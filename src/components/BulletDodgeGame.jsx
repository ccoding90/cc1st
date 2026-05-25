import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const W = 400;
const H = 580;
const GY = 510; // ground y
const MAX_SP = 3;
const HIT_R = 14;

// ── Drawing helpers (defined outside component) ─────────────────────────────

function drawBg(ctx, ts) {
  const sky = ctx.createLinearGradient(0, 0, 0, GY);
  sky.addColorStop(0, '#020617');
  sky.addColorStop(0.45, '#0c1a3d');
  sky.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // stars
  for (let i = 0; i < 55; i++) {
    const sx = (i * 173.1) % W;
    const sy = (i * 91.7) % (GY * 0.62);
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(ts * 0.0007 + i * 0.9));
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  // mountain silhouette
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, GY);
  const pts = [[0,GY-30],[55,GY-105],[115,GY-55],[185,GY-140],[255,GY-85],[320,GY-120],[390,GY-70],[W,GY-50],[W,GY]];
  pts.forEach(([x,y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fill();

  // ground
  const gr = ctx.createLinearGradient(0, GY, 0, H);
  gr.addColorStop(0, '#15803d');
  gr.addColorStop(1, '#14532d');
  ctx.fillStyle = gr;
  ctx.fillRect(0, GY, W, H - GY);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
}

function drawPlayer(ctx, px, walkFrame, invincible) {
  if (invincible) ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(walkFrame * 0.4));

  const fy = GY;
  const legH = 22, bodyH = 26, headR = 13;
  const hipY = fy - legH;
  const shoulderY = hipY - bodyH;
  const headCY = shoulderY - headR;
  const legSw = Math.sin(walkFrame * 0.15) * 11;
  const armSw = Math.sin(walkFrame * 0.15 + Math.PI) * 9;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // head
  ctx.fillStyle = '#fcd5b0';
  ctx.beginPath(); ctx.arc(px, headCY, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(px - 4, headCY - 1, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 4, headCY - 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.beginPath(); ctx.arc(px, headCY + 3, 5, 0.15, Math.PI - 0.15); ctx.stroke();

  // body
  ctx.beginPath(); ctx.moveTo(px, shoulderY); ctx.lineTo(px, hipY); ctx.stroke();

  // arms
  ctx.beginPath(); ctx.moveTo(px, shoulderY + 7); ctx.lineTo(px - 16 + armSw, shoulderY + 17 + armSw * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, shoulderY + 7); ctx.lineTo(px + 16 - armSw, shoulderY + 17 - armSw * 0.3); ctx.stroke();

  // legs
  ctx.beginPath(); ctx.moveTo(px, hipY); ctx.lineTo(px - 11 + legSw, fy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, hipY); ctx.lineTo(px + 11 - legSw, fy); ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawObstacle(ctx, o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);

  if (o.kind === 'rock') {
    const rg = ctx.createRadialGradient(-o.r * 0.3, -o.r * 0.3, 1, 0, 0, o.r);
    rg.addColorStop(0, '#9ca3af'); rg.addColorStop(0.7, '#6b7280'); rg.addColorStop(1, '#374151');
    ctx.beginPath(); ctx.arc(0, 0, o.r, 0, Math.PI * 2);
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,30,30,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-o.r*0.2,-o.r*0.5); ctx.lineTo(o.r*0.1,o.r*0.3);
    ctx.moveTo(o.r*0.3,-o.r*0.3); ctx.lineTo(o.r*0.5,o.r*0.2);
    ctx.stroke();
  } else if (o.kind === 'bullet') {
    const bg = ctx.createRadialGradient(-o.r*0.3, -o.r*0.3, 1, 0, 0, o.r);
    bg.addColorStop(0, '#fde68a'); bg.addColorStop(0.5, '#f59e0b'); bg.addColorStop(1, '#92400e');
    ctx.beginPath(); ctx.arc(0, 0, o.r, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(-o.r*0.35, -o.r*0.35, o.r*0.28, 0, Math.PI*2); ctx.fill();
  } else {
    // missile (red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(0, 0, o.r, o.r * 2.8, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.moveTo(-o.r,-o.r*1.2); ctx.lineTo(o.r,-o.r*1.2); ctx.lineTo(0,-o.r*3.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath(); ctx.moveTo(-o.r,o.r*1.2); ctx.lineTo(-o.r*2.5,o.r*3); ctx.lineTo(-o.r*0.5,o.r*2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(o.r,o.r*1.2); ctx.lineTo(o.r*2.5,o.r*3); ctx.lineTo(o.r*0.5,o.r*2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f97316'; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(0, o.r*3, o.r*0.7, o.r*1.4, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawCheonMissile(ctx, m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.fillStyle = '#2563eb';
  ctx.beginPath(); ctx.ellipse(0, 0, 5, 20, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath(); ctx.moveTo(-5,-20); ctx.lineTo(5,-20); ctx.lineTo(0,-34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ef4444'; ctx.fillRect(-5, -8, 10, 4);
  ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-5, -2, 10, 4);
  ctx.fillStyle = '#f97316'; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.ellipse(0, 22, 4, 14, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function getPhaseInfo(elapsed) {
  if (elapsed < 15) return { label: '돌덩이 낙하', color: '#fde68a', speed: 2.2, size: 22, rate: 0.7, kind: 'rock' };
  if (elapsed < 30) return { label: '돌덩이 증가', color: '#fde68a', speed: 3 + (elapsed-15)*0.1, size: 18, rate: 1.3, kind: 'rock' };
  if (elapsed < 45) return { label: '⚠️ 총알 시작!', color: '#fb923c', speed: 4.5 + (elapsed-30)*0.12, size: 11, rate: 2.4, kind: 'bullet' };
  if (elapsed < 60) return { label: '🔴 총알 폭격!', color: '#f87171', speed: 6.3 + (elapsed-45)*0.15, size: 9, rate: 3.8, kind: 'bullet' };
  return { label: '☠️ 미사일 공격!', color: '#ef4444', speed: Math.min(8 + (elapsed-60)*0.1, 14), size: 7, rate: Math.min(5.5 + (elapsed-60)*0.06, 9), kind: 'missile' };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function BulletDodgeGame() {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const afRef = useRef(null);
  const bgAfRef = useRef(null); // for menu background animation

  const [phase, setPhase] = useState('menu'); // menu | playing | over
  const [uiScore, setUiScore] = useState(0);
  const [uiSpecial, setUiSpecial] = useState(MAX_SP);
  const [uiElapsed, setUiElapsed] = useState(0);

  const [nickname, setNickname] = useState('');
  const [rankings, setRankings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rankError, setRankError] = useState('');

  const loadRankings = useCallback(async () => {
    try {
      const q = query(collection(db, 'dodgeScores'), orderBy('score', 'desc'), limit(10));
      const snap = await getDocs(q);
      setRankings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {}
  }, []);

  useEffect(() => { loadRankings(); }, [loadRankings]);

  const submitScore = useCallback(async () => {
    if (!nickname.trim()) { setRankError('닉네임을 입력해주세요'); return; }
    if (submitting || submitted) return;
    setRankError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'dodgeScores'), {
        nickname: nickname.trim().slice(0, 12),
        score: Math.floor(gRef.current?.score ?? uiScore),
        elapsed: uiElapsed,
        createdAt: serverTimestamp(),
      });
      await loadRankings();
      setSubmitted(true);
    } catch (_) { setRankError('등록 실패. 다시 시도해주세요'); }
    setSubmitting(false);
  }, [nickname, submitting, submitted, loadRankings, uiScore, uiElapsed]);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const loop = useCallback((ts) => {
    const g = gRef.current;
    if (!g) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!g.lastTs) g.lastTs = ts;
    const dt = Math.min((ts - g.lastTs) / 1000, 0.05);
    g.lastTs = ts;

    if (!g.over) {
      g.elapsed += dt;
      g.score = g.elapsed * (g.elapsed < 30 ? 1 : g.elapsed < 60 ? 2 : 3);

      // Player movement
      const spd = 270;
      if (g.keys.left)  g.px = Math.max(22, g.px - spd * dt);
      if (g.keys.right) g.px = Math.min(W - 22, g.px + spd * dt);
      if (g.keys.left || g.keys.right) g.walkFrame += dt * 60;

      // Special cooldown & timer
      if (g.spCd > 0) g.spCd -= dt;
      if (g.spTimer > 0) {
        g.spTimer -= dt;
        if (g.spTimer <= 0) {
          g.spActive = false;
          // Explosion particles for cleared obstacles
          g.obstacles.forEach(o => {
            for (let i = 0; i < 5; i++) {
              g.particles.push({
                x: o.x, y: o.y,
                vx: (Math.random()-0.5)*260, vy: -Math.random()*200,
                r: Math.random()*7+2, life: 0.9+Math.random()*0.5,
                color: ['#ef4444','#f97316','#fbbf24','#3b82f6','#a78bfa'][Math.floor(Math.random()*5)]
              });
            }
          });
          g.obstacles = [];
        }
      }

      // Spawn obstacles
      if (!g.spActive) {
        const d = getPhaseInfo(g.elapsed);
        g.spawnT += dt;
        const interval = 1 / d.rate;
        while (g.spawnT >= interval) {
          g.spawnT -= interval;
          const r = d.size * (0.8 + Math.random() * 0.4);
          g.obstacles.push({
            x: r + Math.random() * (W - r * 2),
            y: -r * 3,
            r,
            vx: (Math.random()-0.5) * 35,
            vy: d.speed * 60 * (0.85 + Math.random()*0.3),
            kind: d.kind,
            rot: Math.random() * Math.PI*2,
            rotV: (Math.random()-0.5)*4,
          });
        }
      }

      // Move obstacles
      g.obstacles = g.obstacles.filter(o => {
        o.y += o.vy * dt; o.x += o.vx * dt; o.rot += o.rotV * dt;
        if (o.x < o.r) { o.x = o.r; o.vx *= -1; }
        if (o.x > W - o.r) { o.x = W - o.r; o.vx *= -1; }
        return o.y < GY + o.r;
      });

      // Move 천궁 missiles (upward)
      g.cheonMissiles = g.cheonMissiles.filter(m => { m.y -= 520 * dt; return m.y > -60; });

      // Particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 280 * dt; p.life -= dt * 1.1;
        return p.life > 0;
      });

      // Collision detection
      if (!g.spActive && g.invincT <= 0) {
        const pcx = g.px, pcy = GY - 43;
        for (const o of g.obstacles) {
          const dx = o.x - pcx, dy = o.y - pcy;
          if (dx*dx + dy*dy < (o.r + HIT_R) * (o.r + HIT_R)) {
            g.over = true;
            for (let i = 0; i < 28; i++) {
              g.particles.push({
                x: pcx + (Math.random()-0.5)*24, y: pcy + (Math.random()-0.5)*40,
                vx: (Math.random()-0.5)*380, vy: -Math.random()*300,
                r: Math.random()*5+2, life: 1.3,
                color: ['#ef4444','#f97316','#fbbf24'][Math.floor(Math.random()*3)]
              });
            }
            break;
          }
        }
      }
      if (g.invincT > 0) g.invincT -= dt;
    }

    // ── Draw ──
    drawBg(ctx, ts);

    // Cheon-gung shockwave effect
    if (g.spActive) {
      ctx.fillStyle = 'rgba(59,130,246,0.22)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(147,197,253,0.75)';
      ctx.lineWidth = 2;
      for (let r = 40; r < W; r += 65) {
        const ph = ((ts * 0.0022 + r / 80) % 1);
        ctx.globalAlpha = Math.max(0, 0.8 - ph);
        ctx.beginPath(); ctx.arc(g.px, GY, r * (0.4 + ph * 1.6), 0, Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Draw 천궁 missiles
    g.cheonMissiles.forEach(m => drawCheonMissile(ctx, m));

    // Draw obstacles
    g.obstacles.forEach(o => drawObstacle(ctx, o));

    // Particles
    g.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life * 0.9);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r * Math.min(p.life, 1)), 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player (hide if game over & particles done)
    if (!g.over) {
      drawPlayer(ctx, g.px, g.walkFrame, g.invincT > 0);
    }

    // HUD bar
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, 52);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${Math.floor(g.elapsed)}s`, 12, 32);

    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(g.score)}점`, W - 12, 32);

    // Special missile icons
    ctx.textAlign = 'center';
    ctx.font = '18px sans-serif';
    for (let i = 0; i < MAX_SP; i++) {
      ctx.globalAlpha = i < g.special ? 1 : 0.22;
      ctx.fillText('🚀', W/2 - (MAX_SP-1)*14 + i*28, 32);
    }
    ctx.globalAlpha = 1;

    // Phase label
    const pd = getPhaseInfo(g.elapsed);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = pd.color;
    ctx.textAlign = 'center';
    ctx.fillText(pd.label, W/2, 50);

    // Hint at bottom
    if (!g.over) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE = 천궁(K-SAM) 발사', W/2, H - 6);
    }

    // Game over
    if (g.over && !g._overSignaled) {
      g._overSignaled = true;
      setTimeout(() => {
        const finalScore = Math.floor(g.score);
        const finalElapsed = Math.floor(g.elapsed);
        setUiScore(finalScore);
        setUiElapsed(finalElapsed);
        setPhase('over');
        loadRankings();
      }, 900);
    }

    if (!g._overSignaled || g.particles.length > 0) {
      setUiScore(Math.floor(g.score));
      setUiSpecial(g.special);
      setUiElapsed(Math.floor(g.elapsed));
      afRef.current = requestAnimationFrame(loop);
    }
  }, [loadRankings]);

  // ── Background loop for menu screen ─────────────────────────────────────
  const menuLoop = useCallback((ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawBg(ctx, ts);

    // Demo rocks falling
    const rocks = [
      { x: (ts * 0.05) % W, y: (ts * 0.12) % GY, r: 18, rot: ts*0.001 },
      { x: ((ts * 0.07) + 120) % W, y: (ts * 0.09 + 100) % GY, r: 14, rot: -ts*0.002 },
      { x: ((ts * 0.04) + 240) % W, y: (ts * 0.15 + 200) % GY, r: 22, rot: ts*0.0015 },
      { x: ((ts * 0.06) + 60) % W, y: (ts * 0.11 + 300) % GY, r: 10, rot: -ts*0.003 },
    ];
    rocks.forEach(o => {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
      drawRockSimple(ctx, 0, 0, o.r);
      ctx.restore();
    });

    // Demo stick figure
    drawPlayer(ctx, W/2 + Math.sin(ts*0.001)*30, ts*0.06, false);

    bgAfRef.current = requestAnimationFrame(menuLoop);
  }, []);

  function drawRockSimple(ctx, x, y, r) {
    const rg = ctx.createRadialGradient(x-r*0.3, y-r*0.3, 1, x, y, r);
    rg.addColorStop(0, '#9ca3af'); rg.addColorStop(1, '#374151');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.stroke();
  }

  useEffect(() => {
    if (phase === 'menu') {
      bgAfRef.current = requestAnimationFrame(menuLoop);
    } else {
      if (bgAfRef.current) cancelAnimationFrame(bgAfRef.current);
    }
    return () => { if (bgAfRef.current) cancelAnimationFrame(bgAfRef.current); };
  }, [phase, menuLoop]);

  // ── Special ability ──────────────────────────────────────────────────────
  const activateSpecial = useCallback(() => {
    const g = gRef.current;
    if (!g || g.over || g.spActive || g.special <= 0 || g.spCd > 0) return;
    g.special--;
    g.spActive = true;
    g.spTimer = 0.75;
    g.spCd = 2.5;
    for (let i = 0; i < 5; i++) {
      g.cheonMissiles.push({ x: 50 + i * (W-100)/4, y: GY - 5 });
    }
    setUiSpecial(g.special);
  }, []);

  // ── Start game ───────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (afRef.current) cancelAnimationFrame(afRef.current);
    gRef.current = {
      px: W/2, walkFrame: 0,
      keys: { left: false, right: false },
      obstacles: [], particles: [], cheonMissiles: [],
      elapsed: 0, lastTs: null, spawnT: 0,
      score: 0, special: MAX_SP,
      spCd: 0, spActive: false, spTimer: 0,
      invincT: 0, over: false, _overSignaled: false,
    };
    setPhase('playing');
    setUiScore(0); setUiSpecial(MAX_SP); setUiElapsed(0);
    setSubmitted(false); setNickname(''); setRankError('');
    afRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // ── Keyboard events ──────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      const g = gRef.current; if (!g) return;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { g.keys.left  = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { g.keys.right = true; e.preventDefault(); }
      if (e.key === ' ' && e.target.tagName !== 'INPUT') { e.preventDefault(); activateSpecial(); }
    };
    const up = (e) => {
      const g = gRef.current; if (!g) return;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') g.keys.left  = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') g.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [activateSpecial]);

  // ── Touch controls ───────────────────────────────────────────────────────
  const touchState = useRef({ left: false, right: false });
  const startTouch = useCallback((dir) => {
    const g = gRef.current; if (!g) return;
    touchState.current[dir] = true;
    if (dir === 'left')    g.keys.left  = true;
    if (dir === 'right')   g.keys.right = true;
    if (dir === 'special') activateSpecial();
  }, [activateSpecial]);
  const endTouch = useCallback((dir) => {
    const g = gRef.current; if (!g) return;
    touchState.current[dir] = false;
    if (dir === 'left')  g.keys.left  = false;
    if (dir === 'right') g.keys.right = false;
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (afRef.current) cancelAnimationFrame(afRef.current);
    if (bgAfRef.current) cancelAnimationFrame(bgAfRef.current);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 0 40px 0', minHeight:'100vh', background:'#020617' }}>
      {/* Title */}
      <div style={{ textAlign:'center', padding:'20px 16px 12px', color:'#fff' }}>
        <h1 style={{ fontSize:'24px', fontWeight:800, margin:0, background:'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          ☄️ 미사일 피하기
        </h1>
        <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', margin:'4px 0 0' }}>
          총알·미사일을 피하고, 천궁으로 방어하라!
        </p>
      </div>

      {/* Game canvas wrapper */}
      <div style={{ position:'relative', width:W, maxWidth:'100%' }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ display:'block', width:'100%', height:'auto', borderRadius:12, boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }}
        />

        {/* MENU overlay */}
        {phase === 'menu' && (
          <div style={overlayStyle}>
            <div style={panelStyle}>
              <div style={{ fontSize:'40px', marginBottom:8 }}>☄️</div>
              <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:'0 0 6px' }}>미사일 피하기</h2>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', margin:'0 0 16px', lineHeight:1.5 }}>
                ← → 방향키로 좌우 이동<br/>
                SPACE = 천궁(K-SAM) 발사 🚀<br/>
                <span style={{ color:'#fbbf24' }}>오래 살아남을수록 고득점!</span>
              </p>
              <button style={btnPrimary} onClick={startGame}>게임 시작</button>
              {rankings.length > 0 && (
                <div style={{ marginTop:20, width:'100%' }}>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:'0 0 8px', textAlign:'center' }}>🏆 역대 랭킹</p>
                  <RankingTable rankings={rankings} highlight={-1} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME OVER overlay */}
        {phase === 'over' && (
          <div style={overlayStyle}>
            <div style={{ ...panelStyle, maxHeight:'90%', overflowY:'auto' }}>
              <div style={{ fontSize:'36px', marginBottom:6 }}>💥</div>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:'#f87171', margin:'0 0 4px' }}>게임 오버!</h2>
              <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 20px', margin:'8px 0 16px', textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>생존 시간</div>
                <div style={{ color:'#fff', fontSize:'28px', fontWeight:800 }}>{uiElapsed}초</div>
                <div style={{ color:'#fbbf24', fontSize:'20px', fontWeight:700 }}>{uiScore.toLocaleString()}점</div>
              </div>

              {!submitted ? (
                <div style={{ width:'100%', marginBottom:12 }}>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:'0 0 8px' }}>랭킹에 등록하시겠어요?</p>
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitScore()}
                    placeholder="닉네임 입력 (최대 12자)"
                    maxLength={12}
                    style={inputStyle}
                  />
                  {rankError && <p style={{ color:'#f87171', fontSize:'12px', margin:'4px 0 0' }}>{rankError}</p>}
                  <button style={{ ...btnPrimary, marginTop:8, width:'100%' }} onClick={submitScore} disabled={submitting}>
                    {submitting ? '등록 중...' : '🏆 랭킹 등록'}
                  </button>
                </div>
              ) : (
                <div style={{ background:'rgba(74,222,128,0.15)', borderRadius:8, padding:'8px 16px', marginBottom:12, color:'#4ade80', fontSize:'14px', fontWeight:600 }}>
                  ✅ 랭킹 등록 완료!
                </div>
              )}

              <button style={{ ...btnSecondary, marginBottom:16 }} onClick={startGame}>🔄 다시 시작</button>

              {rankings.length > 0 && (
                <div style={{ width:'100%' }}>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:'0 0 8px', textAlign:'center' }}>🏆 TOP 10 랭킹</p>
                  <RankingTable rankings={rankings} highlight={uiScore} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile touch controls */}
      {phase === 'playing' && (
        <div style={{ display:'flex', gap:12, marginTop:14, width:W, maxWidth:'100%', padding:'0 8px', boxSizing:'border-box' }}>
          <button
            style={touchBtn}
            onTouchStart={() => startTouch('left')}
            onTouchEnd={() => endTouch('left')}
            onTouchCancel={() => endTouch('left')}
            onMouseDown={() => startTouch('left')}
            onMouseUp={() => endTouch('left')}
          >◀ 왼쪽</button>
          <button
            style={{ ...touchBtn, flex:1.2, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', fontSize:'13px', fontWeight:700 }}
            onTouchStart={() => startTouch('special')}
            onMouseDown={() => startTouch('special')}
          >🚀 천궁 ({uiSpecial})</button>
          <button
            style={touchBtn}
            onTouchStart={() => startTouch('right')}
            onTouchEnd={() => endTouch('right')}
            onTouchCancel={() => endTouch('right')}
            onMouseDown={() => startTouch('right')}
            onMouseUp={() => endTouch('right')}
          >오른쪽 ▶</button>
        </div>
      )}

      {/* Controls info */}
      {phase !== 'playing' && (
        <div style={{ marginTop:16, color:'rgba(255,255,255,0.4)', fontSize:'12px', textAlign:'center', lineHeight:1.8 }}>
          <div>⌨️ ← → 방향키로 이동 &nbsp;|&nbsp; SPACE = 천궁 발사</div>
          <div>모바일: 하단 버튼 사용</div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RankingTable({ rankings, highlight }) {
  return (
    <div style={{ width:'100%' }}>
      {rankings.map((r, i) => {
        const isHighlight = highlight >= 0 && r.score === highlight;
        return (
          <div key={r.id} style={{
            display:'flex', alignItems:'center', gap:8, padding:'5px 10px', borderRadius:7, marginBottom:3,
            background: isHighlight ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
            border: isHighlight ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent',
          }}>
            <span style={{ width:24, textAlign:'center', fontSize:'14px', fontWeight:700, color: i<3 ? ['#fbbf24','#9ca3af','#b45309'][i] : 'rgba(255,255,255,0.4)' }}>
              {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
            </span>
            <span style={{ flex:1, color:'#fff', fontSize:'13px', fontWeight: isHighlight ? 700 : 400 }}>{r.nickname}</span>
            <span style={{ color:'#fbbf24', fontSize:'13px', fontWeight:700 }}>{(r.score||0).toLocaleString()}점</span>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>{r.elapsed ?? '?'}s</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle = {
  position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
  background:'rgba(2,6,23,0.78)', backdropFilter:'blur(4px)', borderRadius:12,
};
const panelStyle = {
  display:'flex', flexDirection:'column', alignItems:'center',
  background:'rgba(15,23,42,0.92)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:16, padding:'24px 20px', width:'90%', maxWidth:340,
};
const btnPrimary = {
  padding:'11px 28px', borderRadius:10, border:'none', cursor:'pointer',
  background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', color:'#fff',
  fontSize:'16px', fontWeight:700, width:'100%',
};
const btnSecondary = {
  padding:'9px 24px', borderRadius:10, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer',
  background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:'14px', fontWeight:600, width:'100%',
};
const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)',
  background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:'14px', outline:'none',
  boxSizing:'border-box',
};
const touchBtn = {
  flex:1, padding:'14px 0', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer',
  background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:'14px', fontWeight:700,
  userSelect:'none', WebkitUserSelect:'none', touchAction:'manipulation',
};
