import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const W = 400;
const H = 440;

// Goal coords
const GL = 72;
const GR = 328;
const GT = 108;
const GB = 292;
const GW = GR - GL;
const GH = GB - GT;

// Zone target positions inside the goal
const ZONES = {
  LEFT:   { bx: GL + GW * 0.14, by: GT + GH * 0.70, kx: GL + 58, ky: GB - 22 },
  CENTER: { bx: GL + GW * 0.50, by: GT + GH * 0.28, kx: W / 2,   ky: GT + GH * 0.38 },
  RIGHT:  { bx: GL + GW * 0.86, by: GT + GH * 0.70, kx: GR - 58, ky: GB - 22 },
};

const ATTACKER_X = W / 2;
const ATTACKER_Y = H - 48;

const KEEPER_CENTER = { x: W / 2, y: GB - 22 };

function getTelegraphDuration(round) {
  if (round <= 3)  return 1.1;
  if (round <= 7)  return 0.85;
  if (round <= 12) return 0.65;
  if (round <= 18) return 0.50;
  return 0.38;
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function drawField(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, GT);
  sky.addColorStop(0, '#4fc3f7');
  sky.addColorStop(1, '#b3e5fc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GT);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  [[55, 28, 32, 16], [155, 18, 42, 20], [285, 35, 30, 16], [345, 22, 22, 12]].forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  });

  const grd = ctx.createLinearGradient(0, GT, 0, H);
  grd.addColorStop(0, '#43a047');
  grd.addColorStop(0.55, '#388e3c');
  grd.addColorStop(1, '#1b5e20');
  ctx.fillStyle = grd;
  ctx.fillRect(0, GT, W, H - GT);

  // Field stripes
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) continue;
    const y1 = GT + (H - GT) * (i / 7);
    const y2 = GT + (H - GT) * ((i + 1) / 7);
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    ctx.fillRect(0, y1, W, y2 - y1);
  }

  // White lines
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(GL - 38, GB - 2, GW + 76, 80);
  ctx.strokeRect(GL + 12, GB - 2, GW - 24, 38);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(W / 2, ATTACKER_Y - 14, 3, 0, Math.PI * 2); ctx.fill();
}

function drawGoal(ctx) {
  // Net background
  ctx.fillStyle = 'rgba(180,220,255,0.10)';
  ctx.fillRect(GL, GT, GW, GH);

  // Net grid
  ctx.strokeStyle = 'rgba(200,225,255,0.38)';
  ctx.lineWidth = 0.7;
  for (let x = GL; x <= GR; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke();
  }
  for (let y = GT; y <= GB; y += 15) {
    ctx.beginPath(); ctx.moveTo(GL, y); ctx.lineTo(GR, y); ctx.stroke();
  }

  // Post shadows
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(GL - 6, GT, 12, GH + 4);
  ctx.fillRect(GR - 6, GT, 12, GH + 4);
  ctx.fillRect(GL - 6, GT - 9, GW + 12, 10);

  // Posts
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(GL - 5, GT, 9, GH + 3);
  ctx.fillRect(GR - 4, GT, 9, GH + 3);
  ctx.fillRect(GL - 5, GT - 8, GW + 9, 8);

  // Post highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(GL - 2, GT, 3, GH);
}

function drawKeeper(ctx, kx, ky) {
  const TH = 34, TW = 17;

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(kx, GB + 5, 19, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Legs / socks
  ctx.fillStyle = '#fff';
  ctx.fillRect(kx - TW / 2, ky, 7, 20);
  ctx.fillRect(kx + TW / 2 - 7, ky, 7, 20);

  // Shorts
  ctx.fillStyle = '#1565c0';
  ctx.fillRect(kx - TW / 2, ky - 6, TW, 8);

  // Jersey (yellow)
  ctx.fillStyle = '#ffd600';
  ctx.fillRect(kx - TW / 2, ky - TH, TW, TH - 6);

  // Number
  ctx.fillStyle = '#1a237e';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1', kx, ky - TH * 0.45);

  // Gloves
  ctx.fillStyle = '#ff8f00';
  ctx.beginPath(); ctx.arc(kx - TW / 2 - 9, ky - TH * 0.62, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(kx + TW / 2 + 9, ky - TH * 0.62, 8, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = '#ffcc80';
  ctx.beginPath(); ctx.arc(kx, ky - TH - 12, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(kx - 4, ky - TH - 15, 2.5, 2.5);
  ctx.fillRect(kx + 1.5, ky - TH - 15, 2.5, 2.5);
}

function drawBall(ctx, bx, by, r) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(bx + 2, by + r + 2, r * 0.75, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  const patches = [[0, 0], [0.55, -0.42], [-0.55, -0.42], [0.55, 0.42], [-0.55, 0.42]];
  ctx.fillStyle = '#1a1a1a';
  patches.forEach(([px, py]) => {
    ctx.beginPath(); ctx.arc(bx + px * r * 0.6, by + py * r * 0.6, r * 0.24, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.2, 0, Math.PI * 2); ctx.fill();
}

function drawAttacker(ctx, ax, ay) {
  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(ax, ay + 14, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#c62828';
  ctx.fillRect(ax - 8, ay - 24, 16, 24);
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(ax - 8, ay, 7, 16);
  ctx.fillRect(ax + 1, ay, 7, 16);
  ctx.fillStyle = '#ffcc80';
  ctx.beginPath(); ctx.arc(ax, ay - 24 - 10, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(ax - 3, ay - 27, 2, 2);
  ctx.fillRect(ax + 1, ay - 27, 2, 2);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GoalkeeperGame() {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const afRef = useRef(null);

  const [phase, setPhase] = useState('menu');
  const [innerPhase, setInnerPhase] = useState('waiting');
  const [uiSaves, setUiSaves] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [lastResult, setLastResult] = useState(null);

  const [nickname, setNickname] = useState('');
  const [rankings, setRankings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rankError, setRankError] = useState('');

  const loadRankings = useCallback(async () => {
    try {
      const q = query(collection(db, 'goalkeeperScores'), orderBy('saves', 'desc'), limit(10));
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
      await addDoc(collection(db, 'goalkeeperScores'), {
        nickname: nickname.trim().slice(0, 12),
        saves: gRef.current?.saves ?? uiSaves,
        createdAt: serverTimestamp(),
      });
      await loadRankings();
      setSubmitted(true);
    } catch (_) { setRankError('등록 실패. 다시 시도해주세요'); }
    setSubmitting(false);
  }, [nickname, submitting, submitted, loadRankings, uiSaves]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = useCallback((ts) => {
    const g = gRef.current;
    if (!g || g._ended) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!g.lastTs) g.lastTs = ts;
    const dt = Math.min((ts - g.lastTs) / 1000, 0.05);
    g.lastTs = ts;
    g.phaseElapsed += dt;

    // Smooth keeper interpolation
    g.keeperX += (g.keeperTargetX - g.keeperX) * Math.min(1, dt * 9);
    g.keeperY += (g.keeperTargetY - g.keeperY) * Math.min(1, dt * 9);

    // Phase transitions
    if (g.innerPhase === 'waiting' && g.phaseElapsed >= 0.55) {
      const zoneKeys = ['LEFT', 'CENTER', 'RIGHT'];
      g.currentZone = zoneKeys[Math.floor(Math.random() * 3)];
      g.playerChoice = null;
      g.innerPhase = 'telegraphing';
      g.phaseElapsed = 0;
      setInnerPhase('telegraphing');
    }

    if (g.innerPhase === 'telegraphing' && g.phaseElapsed >= getTelegraphDuration(g.round)) {
      g.innerPhase = 'flying';
      g.phaseElapsed = 0;
      setInnerPhase('flying');
      // Move keeper toward chosen zone (or stay if no choice)
      if (g.playerChoice) {
        g.keeperTargetX = ZONES[g.playerChoice].kx;
        g.keeperTargetY = ZONES[g.playerChoice].ky;
      }
    }

    if (g.innerPhase === 'flying' && g.phaseElapsed >= 0.58) {
      const saved = g.playerChoice === g.currentZone;
      if (saved) {
        g.saves++;
        g.lastResult = 'save';
      } else {
        g.misses++;
        g.lastResult = 'goal';
      }
      g.round++;
      g.innerPhase = 'result';
      g.phaseElapsed = 0;
      setUiSaves(g.saves);
      setUiLives(3 - g.misses);
      setLastResult(g.lastResult);
      setInnerPhase('result');
    }

    if (g.innerPhase === 'result' && g.phaseElapsed >= 0.78) {
      if (g.misses >= 3) {
        g._ended = true;
        setTimeout(() => {
          setUiSaves(g.saves);
          setPhase('over');
          loadRankings();
        }, 200);
        return;
      }
      g.innerPhase = 'waiting';
      g.phaseElapsed = 0;
      g.keeperTargetX = KEEPER_CENTER.x;
      g.keeperTargetY = KEEPER_CENTER.y;
      setInnerPhase('waiting');
    }

    // Ball position
    let ballX = ATTACKER_X;
    let ballY = ATTACKER_Y - 10;
    let ballR = 11;
    let showBall = false;

    if (g.innerPhase === 'flying' || g.innerPhase === 'result') {
      const prog = Math.min(1, g.phaseElapsed / 0.58);
      const ease = 1 - Math.pow(1 - prog, 2.2);
      const tz = ZONES[g.currentZone];
      ballX = ATTACKER_X + (tz.bx - ATTACKER_X) * ease;
      ballY = (ATTACKER_Y - 10) + (tz.by - (ATTACKER_Y - 10)) * ease;
      ballR = 11 - 3 * ease;
      showBall = true;
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    drawField(ctx);
    drawGoal(ctx);

    // Zone indicator during telegraphing
    if (g.innerPhase === 'telegraphing') {
      const dur = getTelegraphDuration(g.round);
      const fade = Math.max(0, 1 - g.phaseElapsed / dur);
      const tz = ZONES[g.currentZone];

      ctx.save();
      ctx.globalAlpha = 0.25 + 0.45 * fade;
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.arc(tz.bx, tz.by, 24, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(tz.bx, tz.by, 24, 0, Math.PI * 2); ctx.stroke();

      // Expanding ring
      const ring = 24 + 20 * (1 - fade);
      ctx.strokeStyle = `rgba(255,235,59,${0.55 * fade})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tz.bx, tz.by, ring, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Save flash
    if (g.innerPhase === 'result' && g.lastResult === 'save') {
      ctx.save();
      ctx.globalAlpha = 0.12 * Math.max(0, 1 - g.phaseElapsed / 0.78);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // Goal flash
    if (g.innerPhase === 'result' && g.lastResult === 'goal') {
      ctx.save();
      ctx.globalAlpha = 0.12 * Math.max(0, 1 - g.phaseElapsed / 0.78);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    drawKeeper(ctx, g.keeperX, g.keeperY);

    // Ball
    if (showBall) {
      drawBall(ctx, ballX, ballY, ballR);
    } else {
      // Ball at attacker feet
      drawBall(ctx, ATTACKER_X - 12, ATTACKER_Y - 2, 9);
    }

    drawAttacker(ctx, ATTACKER_X, ATTACKER_Y);

    // HUD bar
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, 48);

    // Lives
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      ctx.fillText(i < (3 - g.misses) ? '❤️' : '🖤', 10 + i * 26, 30);
    }

    // Saves
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${g.saves} 선방`, W - 12, 30);

    // Round
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`라운드 ${g.round + 1}`, W / 2, 30);

    // Phase hint
    if (g.innerPhase === 'telegraphing') {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('방향을 선택하세요!', W / 2, H - 10);
    } else if (g.innerPhase === 'result') {
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      if (g.lastResult === 'save') {
        ctx.fillStyle = '#69f0ae';
        ctx.fillText('SAVE! ✋', W / 2, H - 10);
      } else {
        ctx.fillStyle = '#ff5252';
        ctx.fillText('GOAL! ⚽', W / 2, H - 10);
      }
    }

    afRef.current = requestAnimationFrame(loop);
  }, [loadRankings]);

  const handleChoice = useCallback((zone) => {
    const g = gRef.current;
    if (!g || g.playerChoice) return;
    if (g.innerPhase !== 'telegraphing' && g.innerPhase !== 'flying') return;
    g.playerChoice = zone;
    g.keeperTargetX = ZONES[zone].kx;
    g.keeperTargetY = ZONES[zone].ky;
  }, []);

  const startGame = useCallback(() => {
    if (afRef.current) cancelAnimationFrame(afRef.current);
    gRef.current = {
      saves: 0, misses: 0, round: 0,
      innerPhase: 'waiting', phaseElapsed: 0,
      currentZone: 'CENTER', playerChoice: null,
      keeperX: KEEPER_CENTER.x, keeperY: KEEPER_CENTER.y,
      keeperTargetX: KEEPER_CENTER.x, keeperTargetY: KEEPER_CENTER.y,
      lastResult: null, lastTs: null, _ended: false,
    };
    setUiSaves(0); setUiLives(3); setLastResult(null);
    setInnerPhase('waiting');
    setSubmitted(false); setNickname(''); setRankError('');
    setPhase('playing');
    afRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const down = (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') handleChoice('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleChoice('RIGHT');
      if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') handleChoice('CENTER');
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [phase, handleChoice]);

  useEffect(() => () => {
    if (afRef.current) cancelAnimationFrame(afRef.current);
  }, []);

  const canInput = innerPhase === 'telegraphing' || innerPhase === 'flying';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px', minHeight: '100vh', background: 'linear-gradient(160deg,#1a237e 0%,#0d47a1 50%,#1565c0 100%)' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', padding: '20px 16px 10px', color: '#fff' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#ffeb3b,#ff9800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🧤 월드컵 골키퍼 챌린지
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
          슈팅 방향을 읽고 막아라! 2026 FIFA 월드컵 특집
        </p>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: W, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
        />

        {/* MENU overlay */}
        {phase === 'menu' && (
          <div style={overlayStyle}>
            <div style={panelStyle}>
              <div style={{ fontSize: '44px', marginBottom: 8 }}>🧤</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>골키퍼 챌린지</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '0 0 18px', lineHeight: 1.6 }}>
                슈팅 방향을 표시하는 <span style={{ color: '#ffeb3b', fontWeight: 700 }}>노란 원</span>이 사라지기 전에<br />
                방향 버튼을 눌러 슈팅을 막으세요!<br />
                <span style={{ color: '#ffd54f' }}>라운드가 올라갈수록 빨라집니다!</span>
              </p>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.7 }}>
                ⌨️ A / ← = 왼쪽 &nbsp;|&nbsp; W / ↑ = 중앙 &nbsp;|&nbsp; D / → = 오른쪽
              </div>
              <button style={btnPrimary} onClick={startGame}>게임 시작</button>
              {rankings.length > 0 && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 8px', textAlign: 'center' }}>🏆 선방왕 랭킹</p>
                  <RankingTable rankings={rankings} highlight={-1} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME OVER overlay */}
        {phase === 'over' && (
          <div style={overlayStyle}>
            <div style={{ ...panelStyle, maxHeight: '90%', overflowY: 'auto' }}>
              <div style={{ fontSize: '38px', marginBottom: 6 }}>🥅</div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f87171', margin: '0 0 4px' }}>3실점 교체!!</h2>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', margin: '8px 0 16px', textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>최종 선방 기록</div>
                <div style={{ color: '#ffeb3b', fontSize: '34px', fontWeight: 800 }}>{uiSaves}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>선방</div>
              </div>

              {!submitted ? (
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 8px' }}>선방왕 랭킹에 등록할까요?</p>
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitScore()}
                    placeholder="닉네임 입력 (최대 12자)"
                    maxLength={12}
                    style={inputStyle}
                  />
                  {rankError && <p style={{ color: '#f87171', fontSize: '12px', margin: '4px 0 0' }}>{rankError}</p>}
                  <button style={{ ...btnPrimary, marginTop: 8, width: '100%' }} onClick={submitScore} disabled={submitting}>
                    {submitting ? '등록 중...' : '🏆 랭킹 등록'}
                  </button>
                </div>
              ) : (
                <div style={{ background: 'rgba(74,222,128,0.15)', borderRadius: 8, padding: '8px 16px', marginBottom: 12, color: '#4ade80', fontSize: '14px', fontWeight: 600 }}>
                  ✅ 랭킹 등록 완료!
                </div>
              )}

              <button style={{ ...btnSecondary, marginBottom: 16 }} onClick={startGame}>🔄 다시 도전</button>

              {rankings.length > 0 && (
                <div style={{ width: '100%' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 8px', textAlign: 'center' }}>🏆 선방왕 TOP 10</p>
                  <RankingTable rankings={rankings} highlight={uiSaves} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Direction Buttons */}
      {phase === 'playing' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, width: W, maxWidth: '100%', padding: '0 8px', boxSizing: 'border-box' }}>
          <button
            style={{ ...dirBtn, opacity: canInput ? 1 : 0.38, background: 'linear-gradient(135deg,#e53935,#b71c1c)' }}
            onClick={() => handleChoice('LEFT')}
            onTouchStart={e => { e.preventDefault(); handleChoice('LEFT'); }}
            disabled={!canInput}
          >
            ◀ 왼쪽
          </button>
          <button
            style={{ ...dirBtn, opacity: canInput ? 1 : 0.38, background: 'linear-gradient(135deg,#388e3c,#1b5e20)' }}
            onClick={() => handleChoice('CENTER')}
            onTouchStart={e => { e.preventDefault(); handleChoice('CENTER'); }}
            disabled={!canInput}
          >
            ▲ 중앙
          </button>
          <button
            style={{ ...dirBtn, opacity: canInput ? 1 : 0.38, background: 'linear-gradient(135deg,#1565c0,#0d47a1)' }}
            onClick={() => handleChoice('RIGHT')}
            onTouchStart={e => { e.preventDefault(); handleChoice('RIGHT'); }}
            disabled={!canInput}
          >
            오른쪽 ▶
          </button>
        </div>
      )}

      {/* Controls hint */}
      {phase !== 'playing' && (
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', lineHeight: 1.8 }}>
          <div>⌨️ A / ← 왼쪽 &nbsp;|&nbsp; W / ↑ 중앙 &nbsp;|&nbsp; D / → 오른쪽</div>
          <div>모바일: 하단 버튼 사용</div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RankingTable({ rankings, highlight }) {
  return (
    <div style={{ width: '100%' }}>
      {rankings.map((r, i) => {
        const isHl = highlight >= 0 && r.saves === highlight;
        return (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
            borderRadius: 7, marginBottom: 3,
            background: isHl ? 'rgba(255,235,59,0.15)' : 'rgba(255,255,255,0.05)',
            border: isHl ? '1px solid rgba(255,235,59,0.4)' : '1px solid transparent',
          }}>
            <span style={{ width: 24, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: i < 3 ? ['#fbbf24', '#9ca3af', '#b45309'][i] : 'rgba(255,255,255,0.4)' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
            </span>
            <span style={{ flex: 1, color: '#fff', fontSize: '13px', fontWeight: isHl ? 700 : 400 }}>{r.nickname}</span>
            <span style={{ color: '#ffeb3b', fontSize: '13px', fontWeight: 700 }}>{r.saves ?? 0} 선방</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(10,20,60,0.80)', backdropFilter: 'blur(4px)', borderRadius: 12,
};
const panelStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: 'rgba(13,27,90,0.95)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16, padding: '24px 20px', width: '90%', maxWidth: 340,
};
const btnPrimary = {
  padding: '11px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg,#ffd600,#ff9800)', color: '#1a1a1a',
  fontSize: '16px', fontWeight: 800, width: '100%',
};
const btnSecondary = {
  padding: '9px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', fontWeight: 600, width: '100%',
};
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
};
const dirBtn = {
  flex: 1, padding: '15px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
  color: '#fff', fontSize: '14px', fontWeight: 800,
  userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation',
  transition: 'opacity 0.15s',
};
