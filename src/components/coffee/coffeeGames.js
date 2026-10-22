// 점심 커피내기 미니게임 3종 - 게임 로직 & 캔버스 드로잉
// 각 게임은 create*(players, env) => { update(dt), draw(ctx, t) } 형태
// env: { particles, shake, slow, sfx, banner(text), finish(loserIndex) }

export const W = 400;
export const H = 560;

export const CHARACTERS = [
  { name: '옐로하이브리드', body: '#FFD93D', hanbok: '#4D96FF', accent: '#FF5D8F', hat: 'gat' },
  { name: '불댕이', body: '#FF7B39', hanbok: '#2EC4B6', accent: '#FFD166', ear: 'dog', earColor: '#C8501A', hat: 'gat', flame: true },
  { name: '감자선비', body: '#D9A86C', hanbok: '#F1FAEE', accent: '#3A86FF', hat: 'gat' },
  { name: '토끼낭자', body: '#FFF3F8', hanbok: '#FF5D8F', accent: '#FFD166', ear: 'rabbit', hat: 'crown' },
  { name: '펭도령', body: '#2B3A55', hanbok: '#E9C46A', accent: '#E63946', belly: true, hat: 'gat' },
  { name: '곰포졸', body: '#8B5E3C', hanbok: '#E63946', accent: '#264653', ear: 'bear', hat: 'jeonrip' },
  { name: '냥이아씨', body: '#F4A261', hanbok: '#9B5DE5', accent: '#FFD166', ear: 'cat', hat: 'crown' },
  { name: '개구리어사', body: '#7BD389', hanbok: '#3A86FF', accent: '#E63946', ear: 'frog', hat: 'gat' },
];

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const easeOutElastic = (x) =>
  x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

// --- Particles ---

const MAX_PARTICLES = 700;

export function burst(env, x, y, count, { colors, speed = [60, 240], life = 0.8, size = [2, 5], gravity = 0, angle = [0, Math.PI * 2] }) {
  for (let i = 0; i < count && env.particles.length < MAX_PARTICLES; i++) {
    const a = rand(angle[0], angle[1]);
    const sp = rand(speed[0], speed[1]);
    env.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: life * rand(0.6, 1.2),
      size: rand(size[0], size[1]),
      color: pick(colors),
      g: gravity,
    });
  }
}

export function updateParticles(parts, dt) {
  const drag = Math.pow(0.3, dt);
  let w = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.life += dt;
    if (p.life >= p.max) continue;
    p.vy += p.g * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    parts[w++] = p;
  }
  parts.length = w;
}

export function drawParticles(ctx, parts) {
  for (const p of parts) {
    const k = p.life / p.max;
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// --- Character drawing ---

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fill();
}

const DARK = '#1b1b1b';

// 눈 한 쌍. (x, y) = 왼눈/오른눈 중심 사이, k = 크기 배율
function drawEyes(ctx, x, y, ex, s, expr, t, seed, k = 1) {
  if (expr === 'joy') {
    ctx.strokeStyle = DARK;
    ctx.lineWidth = s * 0.1 * k;
    ctx.lineCap = 'round';
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + d * ex, y + s * 0.08 * k, s * 0.14 * k, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else if (expr === 'panic') {
    for (const d of [-1, 1]) {
      ctx.fillStyle = '#fff';
      ellipse(ctx, x + d * ex, y, s * 0.21 * k, s * 0.24 * k);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = s * 0.04;
      ctx.stroke();
      ctx.fillStyle = DARK;
      ellipse(ctx, x + d * ex + Math.sin(t * 30 + seed) * s * 0.05 * k, y, s * 0.08 * k, s * 0.08 * k);
    }
  } else {
    for (const d of [-1, 1]) {
      ctx.fillStyle = DARK;
      ellipse(ctx, x + d * ex, y, s * 0.13 * k, s * 0.16 * k);
      ctx.fillStyle = '#fff';
      ellipse(ctx, x + d * ex + s * 0.045 * k, y - s * 0.06 * k, s * 0.055 * k, s * 0.055 * k);
      ellipse(ctx, x + d * ex - s * 0.04 * k, y + s * 0.06 * k, s * 0.025 * k, s * 0.025 * k);
    }
  }
}

// expr: idle | joy | panic | sweat
export function drawChar(ctx, x, y, s, ch, expr, t, seed = 0) {
  const panic = expr === 'panic';
  const joy = expr === 'joy';
  const frog = ch.ear === 'frog';
  const bounce = panic ? Math.sin(t * 40 + seed) * s * 0.06 : -Math.abs(Math.sin(t * 5 + seed)) * s * 0.18;
  const cx = x + (panic ? Math.sin(t * 53 + seed * 3) * s * 0.08 : 0);
  const cy = y + bounce;
  ctx.save();
  ctx.lineCap = 'round';

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ellipse(ctx, x, y + s * 1.38, s * 0.9, s * 0.22);

  // hanbok (아랫단이 둥근 저고리·치마)
  ctx.fillStyle = ch.hanbok;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.6);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.6);
  ctx.quadraticCurveTo(cx + s * 0.92, cy + s * 1.28, cx + s * 0.72, cy + s * 1.36);
  ctx.lineTo(cx - s * 0.72, cy + s * 1.36);
  ctx.quadraticCurveTo(cx - s * 0.92, cy + s * 1.28, cx - s * 0.5, cy + s * 0.6);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.62);
  ctx.lineTo(cx + s * 0.05, cy + s * 1.0);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.62);
  ctx.stroke();
  ctx.fillStyle = ch.accent;
  ellipse(ctx, cx + s * 0.18, cy + s * 1.05, s * 0.1, s * 0.24, 0.4);
  ellipse(ctx, cx + s * 0.05, cy + s * 0.98, s * 0.09, s * 0.09);

  // 동글동글 손 (기쁘면 만세, 당황하면 파닥파닥)
  for (const d of [-1, 1]) {
    let hy = cy + s * 1.0;
    if (joy) hy = cy + s * 0.55 - Math.abs(Math.sin(t * 8 + seed + d)) * s * 0.2;
    else if (panic) hy = cy + s * 0.85 + Math.sin(t * 30 + seed + d * 1.5) * s * 0.15;
    ctx.fillStyle = ch.body;
    ellipse(ctx, cx + d * s * (joy ? 0.88 : 0.78), hy, s * 0.17, s * 0.17);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = s * 0.05;
    ctx.stroke();
  }

  // ears (behind head)
  const inner = '#FFB3C8';
  ctx.fillStyle = ch.body;
  if (ch.ear === 'rabbit') {
    for (const d of [-1, 1]) {
      ctx.fillStyle = ch.body;
      ellipse(ctx, cx + d * s * 0.4, cy - s * 1.1, s * 0.22, s * 0.6, d * 0.2);
      ctx.fillStyle = inner;
      ellipse(ctx, cx + d * s * 0.4, cy - s * 1.1, s * 0.1, s * 0.42, d * 0.2);
    }
  } else if (ch.ear === 'bear') {
    for (const d of [-1, 1]) {
      ctx.fillStyle = ch.body;
      ellipse(ctx, cx + d * s * 0.72, cy - s * 0.62, s * 0.32, s * 0.32);
      ctx.fillStyle = 'rgba(255,220,190,0.7)';
      ellipse(ctx, cx + d * s * 0.72, cy - s * 0.62, s * 0.17, s * 0.17);
    }
  } else if (ch.ear === 'cat') {
    for (const d of [-1, 1]) {
      ctx.fillStyle = ch.body;
      ctx.beginPath();
      ctx.moveTo(cx + d * s * 0.9, cy - s * 0.3);
      ctx.lineTo(cx + d * s * 0.75, cy - s * 1.05);
      ctx.lineTo(cx + d * s * 0.2, cy - s * 0.8);
      ctx.fill();
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.moveTo(cx + d * s * 0.78, cy - s * 0.45);
      ctx.lineTo(cx + d * s * 0.72, cy - s * 0.9);
      ctx.lineTo(cx + d * s * 0.38, cy - s * 0.75);
      ctx.fill();
    }
  } else if (frog) {
    ellipse(ctx, cx - s * 0.45, cy - s * 0.78, s * 0.34, s * 0.34);
    ellipse(ctx, cx + s * 0.45, cy - s * 0.78, s * 0.34, s * 0.34);
  }

  // head
  ctx.fillStyle = ch.body;
  ellipse(ctx, cx, cy, s * 1.02, s * 0.94);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = s * 0.07;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, cx - s * 0.42, cy - s * 0.48, s * 0.24, s * 0.12, -0.5);
  if (ch.belly) {
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx, cy + s * 0.12, s * 0.74, s * 0.7);
  }
  if (ch.ear === 'dog') {
    ctx.fillStyle = ch.earColor;
    ellipse(ctx, cx - s * 0.92, cy + s * 0.05, s * 0.28, s * 0.55, 0.25);
    ellipse(ctx, cx + s * 0.92, cy + s * 0.05, s * 0.28, s * 0.55, -0.25);
  }
  if (ch.ear === 'bear' || ch.ear === 'dog') {
    ctx.fillStyle = 'rgba(255,240,220,0.6)';
    ellipse(ctx, cx, cy + s * 0.34, s * 0.32, s * 0.22);
  }
  if (frog) {
    // 눈망울 흰자 (눈동자는 모자 위에 그려서 절대 가려지지 않게)
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx - s * 0.45, cy - s * 0.78, s * 0.25, s * 0.25);
    ellipse(ctx, cx + s * 0.45, cy - s * 0.78, s * 0.25, s * 0.25);
  }

  // face
  if (!frog) drawEyes(ctx, cx, cy - s * 0.04, s * 0.36, s, expr, t, seed);
  ctx.fillStyle = 'rgba(255,110,140,0.5)';
  ellipse(ctx, cx - s * 0.58, cy + s * 0.2, s * 0.17, s * 0.1);
  ellipse(ctx, cx + s * 0.58, cy + s * 0.2, s * 0.17, s * 0.1);

  // nose / beak
  if (ch.belly) {
    ctx.fillStyle = '#FFB703';
    ellipse(ctx, cx, cy + s * 0.2, s * 0.13, s * 0.07);
  } else if (ch.ear === 'bear' || ch.ear === 'dog') {
    ctx.fillStyle = DARK;
    ellipse(ctx, cx, cy + s * 0.22, s * 0.09, s * 0.06);
  } else if (ch.ear === 'cat' || ch.ear === 'rabbit') {
    ctx.fillStyle = '#FF7B9C';
    ellipse(ctx, cx, cy + s * 0.22, s * 0.06, s * 0.045);
  }

  const my = cy + s * 0.38;
  ctx.strokeStyle = DARK;
  ctx.fillStyle = '#C0392B';
  ctx.lineWidth = s * 0.08;
  if (joy) {
    ctx.beginPath();
    ctx.arc(cx, my - s * 0.05, s * 0.2, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#FF8FA3';
    ellipse(ctx, cx, my + s * 0.08, s * 0.1, s * 0.05);
  } else if (panic) {
    ellipse(ctx, cx, my, s * 0.12, s * 0.17);
  } else if (expr === 'sweat') {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, my);
    ctx.quadraticCurveTo(cx - s * 0.1, my - s * 0.1, cx, my);
    ctx.quadraticCurveTo(cx + s * 0.1, my + s * 0.1, cx + s * 0.2, my);
    ctx.stroke();
  } else if (ch.ear === 'cat') {
    // ω 입
    ctx.beginPath();
    ctx.arc(cx - s * 0.08, my - s * 0.06, s * 0.08, 0.1, Math.PI - 0.1);
    ctx.arc(cx + s * 0.08, my - s * 0.06, s * 0.08, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, my - s * 0.12, s * 0.15, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }

  if (panic || expr === 'sweat') {
    const dy = ((t * 1.5 + seed) % 1) * s * 0.5;
    ctx.fillStyle = '#7EC8FF';
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.85, cy - s * 0.55 + dy);
    ctx.quadraticCurveTo(cx + s * 1.05, cy - s * 0.2 + dy, cx + s * 0.85, cy - s * 0.12 + dy);
    ctx.quadraticCurveTo(cx + s * 0.65, cy - s * 0.2 + dy, cx + s * 0.85, cy - s * 0.55 + dy);
    ctx.fill();
  }

  // headwear - 개구리는 눈 위로 올려 씌움
  const hb = cy - s * (frog ? 1.18 : 0.82); // 모자 챙 높이
  if (ch.hat === 'gat' || ch.hat === 'jeonrip') {
    ctx.fillStyle = 'rgba(25,25,25,0.93)';
    ellipse(ctx, cx, hb, s * 1.0, s * 0.16);
    ctx.fillRect(cx - s * 0.3, hb - s * 0.48, s * 0.6, s * 0.48);
    ellipse(ctx, cx, hb - s * 0.48, s * 0.3, s * 0.09);
    ctx.fillStyle = ch.accent;
    ctx.fillRect(cx - s * 0.3, hb - s * 0.14, s * 0.6, s * 0.08);
    if (ch.hat === 'jeonrip') {
      ctx.fillStyle = '#E63946';
      ellipse(ctx, cx + s * 0.32, hb - s * 0.36, s * 0.12, s * 0.22, 0.5);
    }
  } else if (ch.hat === 'crown') {
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, hb);
    ctx.lineTo(cx - s * 0.25, hb - s * 0.38);
    ctx.lineTo(cx + s * 0.25, hb - s * 0.38);
    ctx.lineTo(cx + s * 0.35, hb);
    ctx.closePath();
    ctx.fill();
    for (const [d, c] of [[-0.18, '#FFD166'], [0, '#FF5D8F'], [0.18, '#FFD166']]) {
      ctx.fillStyle = c;
      ellipse(ctx, cx + d * s, hb - s * 0.18, s * 0.07, s * 0.07);
    }
  }
  if (frog) drawEyes(ctx, cx, cy - s * 0.78, s * 0.45, s, expr, t, seed, 0.85);
  if (ch.flame) {
    const f = 1 + Math.sin(t * 25 + seed) * 0.15;
    const fy = ch.hat === 'gat' ? hb - s * 0.52 : cy - s * 0.95;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.26, fy);
    ctx.quadraticCurveTo(cx - s * 0.26, fy - s * 0.45 * f, cx, fy - s * 0.75 * f);
    ctx.quadraticCurveTo(cx + s * 0.26, fy - s * 0.45 * f, cx + s * 0.26, fy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFD166';
    ellipse(ctx, cx, fy - s * 0.16, s * 0.12, s * 0.22 * f);
  }
  ctx.restore();
}

export function drawName(ctx, name, x, y, highlight = false) {
  const label = name.length > 5 ? name.slice(0, 5) + '…' : name;
  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  const w = ctx.measureText(label).width + 10;
  ctx.fillStyle = highlight ? '#E63946' : 'rgba(255,255,255,0.9)';
  ctx.fillRect(x - w / 2, y - 8, w, 16);
  ctx.fillStyle = highlight ? '#fff' : '#3e2723';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- Game 1: 시한폭탄 패스 ---

export const BOMB_TIMES = [30, 60];

export function createBombGame(players, env, opts = {}) {
  const n = players.length;
  const cx = W / 2, cy = H / 2 + 10;
  const R = Math.min(150, 85 + n * 9);
  const seats = players.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  const handPos = (i) => ({ x: seats[i].x + (cx - seats[i].x) * 0.3, y: seats[i].y + (cy - seats[i].y) * 0.3 });
  const fuse = BOMB_TIMES.includes(opts.fuse) ? opts.fuse : BOMB_TIMES[0];
  let time = 0, holder = Math.floor(Math.random() * n), target = null;
  let flightT = 0, flightDur = 0, wait = 0, tickAcc = 0;
  let exploded = false, loser = -1, endT = 0, finished = false;

  // 남은 시간에 비례해 패스 간격이 지수적으로 짧아짐 (30초·1분 모두 끝으로 갈수록 정신없게)
  const interval = () => Math.max(0.13, 1.1 * Math.pow(0.12, Math.min(1, time / fuse)));

  const bombPos = () => {
    const a = handPos(holder);
    if (target === null) return a;
    const b = handPos(target);
    const k = Math.min(1, flightT / flightDur);
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * 50 };
  };

  return {
    update(dt) {
      time += dt;
      if (!exploded) {
        if (target !== null) {
          flightT += dt;
          if (flightT >= flightDur) { holder = target; target = null; wait = 0; }
        } else {
          wait += dt;
          if (wait >= interval()) {
            let next = Math.floor(Math.random() * (n - 1));
            if (next >= holder) next++;
            target = next;
            flightT = 0;
            flightDur = Math.max(0.1, interval() * 0.55);
            env.sfx.whoosh();
          }
        }
        const remain = fuse - time;
        tickAcc += dt;
        if (tickAcc >= (remain < 5 ? 0.12 : remain < 12 ? 0.3 : 0.5)) { tickAcc = 0; env.sfx.tick(); }
        const b = bombPos();
        burst(env, b.x + 13, b.y - 19, 2, { colors: ['#FFD166', '#FF9F1C', '#fff'], speed: [20, 90], life: 0.35, size: [1, 2.5], gravity: 120 });
        if (remain <= 0) {
          exploded = true;
          loser = target !== null && flightT / flightDur > 0.5 ? target : holder;
          holder = loser;
          target = null;
          const s = seats[loser];
          burst(env, s.x, s.y, 180, { colors: ['#FF4500', '#FFD166', '#FF9F1C', '#444', '#fff'], speed: [80, 420], life: 1.3, size: [2, 7], gravity: 80 });
          burst(env, s.x, s.y, 40, { colors: ['#555', '#777', '#999'], speed: [20, 80], life: 2, size: [8, 14], gravity: -30 });
          env.shake = 28;
          env.sfx.explosion();
          env.banner('💥 펑!!');
        }
      } else if (!finished) {
        endT += dt;
        if (endT > 1.8) { finished = true; env.finish(loser); }
      }
    },

    draw(ctx, t) {
      // 마루 바닥
      ctx.fillStyle = '#E8C9A0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(120,80,40,0.25)';
      ctx.lineWidth = 2;
      for (let y = 0; y < H; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // 돗자리
      ctx.fillStyle = '#D4B483';
      ellipse(ctx, cx, cy, R + 40, R + 40);
      ctx.strokeStyle = '#B08D57';
      ctx.lineWidth = 3;
      for (let r = 20; r < R + 40; r += 18) {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }

      const remain = fuse - time;
      const danger = !exploded && remain < 5;
      players.forEach((p, i) => {
        const s = seats[i];
        let expr = 'idle';
        if (exploded) expr = i === loser ? 'panic' : 'joy';
        else if (i === holder || i === target) expr = 'panic';
        else if (danger) expr = 'sweat';
        drawChar(ctx, s.x, s.y - 10, 20, p.ch, expr, t, i * 1.7);
        if (exploded && i === loser) {
          ctx.fillStyle = 'rgba(30,30,30,0.45)';
          ellipse(ctx, s.x, s.y - 4, 22, 26);
        }
        drawName(ctx, p.name, s.x, s.y + 28, exploded && i === loser);
      });

      if (!exploded) {
        const b = bombPos();
        const pulse = danger ? 1 + Math.sin(t * 30) * 0.1 : 1;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#222';
        ellipse(ctx, 0, 0, 15, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ellipse(ctx, -5, -5, 4, 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(4, -15, 7, 6);
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -14);
        ctx.quadraticCurveTo(14, -22, 13, -19);
        ctx.stroke();
        ctx.restore();
      }

      if (danger) {
        ctx.fillStyle = `rgba(230,0,0,${0.12 + 0.12 * Math.sin(t * 18)})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (!exploded) {
        const sec = Math.max(0, Math.ceil(remain));
        const label = `⏱ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
        ctx.font = '900 18px "Noto Sans KR", sans-serif';
        const w = ctx.measureText(label).width + 20;
        ctx.fillStyle = danger ? '#E63946' : 'rgba(62,39,35,0.85)';
        ctx.fillRect(W / 2 - w / 2, 12, w, 32);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, W / 2, 29);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      if (exploded && endT < 0.25) {
        ctx.fillStyle = `rgba(255,255,255,${1 - endT / 0.25})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  };
}

// --- Game 2: 조선 사다리 타기 ---

export function createLadderGame(players, env) {
  const n = players.length;
  const top = 100, bottom = H - 90, mx = 40;
  const xs = players.map((_, i) => mx + (i * (W - 2 * mx)) / (n - 1));
  const LEVELS = 11;
  const ly = (l) => top + ((l + 1) * (bottom - top)) / (LEVELS + 1);
  const rungs = Array.from({ length: LEVELS }, () => Array(n - 1).fill(false));
  for (let l = 0; l < LEVELS; l++) {
    for (let c = 0; c < n - 1; c++) {
      if ((c === 0 || !rungs[l][c - 1]) && Math.random() < 0.5) rungs[l][c] = true;
    }
  }
  const loserSlot = Math.floor(Math.random() * n);
  const paths = players.map((_, start) => {
    let c = start;
    const pts = [{ x: xs[c], y: top }];
    for (let l = 0; l < LEVELS; l++) {
      const y = ly(l);
      if (c < n - 1 && rungs[l][c]) {
        pts.push({ x: xs[c], y }); c++; pts.push({ x: xs[c], y });
      } else if (c > 0 && rungs[l][c - 1]) {
        pts.push({ x: xs[c], y }); c--; pts.push({ x: xs[c], y });
      }
    }
    pts.push({ x: xs[c], y: bottom });
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return { pts, end: c, len };
  });
  const pointAt = (path, d) => {
    let rest = d;
    for (let i = 1; i < path.pts.length; i++) {
      const a = path.pts[i - 1], b = path.pts[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (rest <= seg) { const k = seg ? rest / seg : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
      rest -= seg;
    }
    return path.pts[path.pts.length - 1];
  };

  const order = shuffle(players.map((_, i) => i));
  const RUN_TIME = 4.2; // 경로 길이와 무관하게 1인당 약 4초
  const fogTop = top + (bottom - top) * 0.28, fogBot = top + (bottom - top) * 0.74;
  const slotOwner = Array(n).fill(-1);
  const revealQueue = [];
  let fog = null;
  let k = 0, dist = 0, phase = 'intro', timer = 0, loser = -1, finished = false;

  const drawTrail = (ctx, path, d, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path.pts[0].x, path.pts[0].y);
    let rest = d;
    for (let i = 1; i < path.pts.length; i++) {
      const a = path.pts[i - 1], b = path.pts[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (rest <= seg) { const q = pointAt(path, d); ctx.lineTo(q.x, q.y); break; }
      ctx.lineTo(b.x, b.y);
      rest -= seg;
    }
    ctx.stroke();
  };

  return {
    update(dt) {
      timer += dt;
      if (phase === 'intro') {
        if (timer > 1.2) { phase = 'run'; timer = 0; env.banner(`${players[order[0]].name} 출발!`); }
      } else if (phase === 'run') {
        const path = paths[order[k]];
        const pos = pointAt(path, dist);
        const inFog = pos.y > fogTop && pos.y < fogBot;
        dist += (path.len / RUN_TIME) * dt * (inFog ? 0.75 : 1.15);
        if (inFog) revealQueue.push(pos);
        if (dist >= path.len) {
          dist = path.len;
          const slot = path.end;
          slotOwner[slot] = order[k];
          if (slot === loserSlot) {
            loser = order[k];
            phase = 'done';
            timer = 0;
            env.sfx.doom();
            env.shake = 18;
            burst(env, xs[slot], bottom + 40, 90, { colors: ['#6F4E37', '#A67B5B', '#3E2723', '#fff'], speed: [60, 300], life: 1.2, size: [2, 6], gravity: 200 });
            env.banner('☕ 커피 당첨...');
          } else {
            env.sfx.ding();
            burst(env, xs[slot], bottom + 40, 20, { colors: ['#2EC4B6', '#FFD166', '#fff'], speed: [40, 150], life: 0.6, size: [2, 4] });
            phase = 'gap';
            timer = 0;
          }
        }
      } else if (phase === 'gap') {
        if (timer > 0.6) { k++; dist = 0; phase = 'run'; timer = 0; env.banner(`${players[order[k]].name} 출발!`); }
      } else if (phase === 'done' && !finished && timer > 2) {
        finished = true;
        env.finish(loser);
      }
    },

    draw(ctx, t) {
      // 비단 배경
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#F7EBD3');
      g.addColorStop(1, '#EAD7B5');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(160,120,70,0.12)';
      ctx.lineWidth = 1;
      for (let i = -H; i < W; i += 16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
      }

      // 성곽 돌기둥 + 붉은 가로대
      ctx.lineCap = 'round';
      for (let l = 0; l < LEVELS; l++) {
        for (let c = 0; c < n - 1; c++) {
          if (!rungs[l][c]) continue;
          ctx.strokeStyle = '#B23A48';
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(xs[c], ly(l)); ctx.lineTo(xs[c + 1], ly(l)); ctx.stroke();
        }
      }
      xs.forEach((x) => {
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        for (let y = top + 8; y < bottom; y += 18) {
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.stroke();
        }
      });

      // 안개 (지나간 자리만 걷힘)
      const fh = fogBot - fogTop;
      if (!fog && typeof document !== 'undefined') {
        fog = document.createElement('canvas');
        fog.width = W;
        fog.height = Math.ceil(fh);
        const f = fog.getContext('2d');
        f.fillStyle = 'rgba(225,225,235,0.97)';
        f.fillRect(0, 0, W, fh);
        for (let i = 0; i < 70; i++) {
          f.fillStyle = `rgba(${pick(['200,200,215', '245,245,250', '185,190,205'])},0.6)`;
          f.beginPath();
          f.arc(Math.random() * W, Math.random() * fh, rand(15, 45), 0, Math.PI * 2);
          f.fill();
        }
      }
      if (fog) {
        const f = fog.getContext('2d');
        f.globalCompositeOperation = 'destination-out';
        while (revealQueue.length) {
          const p = revealQueue.shift();
          const rg = f.createRadialGradient(p.x, p.y - fogTop, 4, p.x, p.y - fogTop, 30);
          rg.addColorStop(0, 'rgba(0,0,0,1)');
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          f.fillStyle = rg;
          f.beginPath(); f.arc(p.x, p.y - fogTop, 30, 0, Math.PI * 2); f.fill();
        }
        f.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = phase === 'done' ? Math.max(0, 1 - timer) : 1;
        ctx.drawImage(fog, Math.sin(t * 0.8) * 3, fogTop);
        ctx.globalAlpha = 1;
        if (phase !== 'done') {
          ctx.fillStyle = 'rgba(90,90,110,0.55)';
          ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌫️ 안개 구간 🌫️', W / 2, fogTop + fh / 2);
          ctx.textAlign = 'left';
        }
      }

      // 지나온 경로
      const runIdx = phase === 'intro' ? 0 : k;
      for (let j = 0; j <= runIdx && j < order.length; j++) {
        if (phase === 'intro') break;
        const pi = order[j];
        drawTrail(ctx, paths[pi], j === k ? dist : paths[pi].len, players[pi].ch.body);
      }

      // 도착 칸
      const sy = bottom + 42;
      const bw = Math.min(46, (W - 2 * mx) / (n - 1) - 4);
      xs.forEach((x, i) => {
        const shown = slotOwner[i] !== -1 || phase === 'done';
        const bad = i === loserSlot;
        ctx.fillStyle = !shown ? '#5D4037' : bad ? '#6F4E37' : '#2EC4B6';
        ctx.fillRect(x - bw / 2, sy - 16, bw, 32);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(!shown ? '?' : bad ? '☕커피' : '통과', x, sy);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      });

      // 캐릭터
      const done = new Set(order.slice(0, phase === 'intro' ? 0 : k + (phase === 'run' ? 0 : 1)));
      players.forEach((p, i) => {
        const running = phase === 'run' && order[k] === i;
        if (running) {
          const pos = pointAt(paths[i], dist);
          drawChar(ctx, pos.x, pos.y - 18, 13, p.ch, 'sweat', t, i);
        } else if (done.has(i)) {
          const end = paths[i].pts[paths[i].pts.length - 1];
          const expr = i === loser ? 'panic' : 'joy';
          drawChar(ctx, end.x, end.y - 16, 12, p.ch, expr, t, i);
        } else {
          drawChar(ctx, xs[i], top - 46, 13, p.ch, 'idle', t, i);
          drawName(ctx, p.name, xs[i], top - 14);
        }
      });
    },
  };
}

// --- Game 3: 외나무다리 밀치기 ---

export function createBridgeGame(players, env) {
  const n = players.length;
  const cy = H / 2 + 10, x1 = 26, x2 = W - 26, R = 15;
  let half = 75, halfTarget = 75;
  const bodies = players.map((_, i) => ({
    i,
    x: x1 + 40 + (i * (x2 - x1 - 80)) / Math.max(1, n - 1),
    y: cy + rand(-30, 30),
    vx: 0, vy: 0,
    alive: true, fallT: 0,
    cd: rand(0.8, 1.8),
  }));
  const grain = Array.from({ length: 9 }, () => ({ f: rand(-0.9, 0.9), a: rand(0, 0.5), b: rand(0.5, 1) }));
  let time = 0, evT = 0, slowOn = false, loser = -1, endT = 0, finished = false;

  const randomEvent = (alive) => {
    if (halfTarget > R * 1.7 && Math.random() < 0.5) {
      halfTarget -= 12;
      env.shake = 8;
      env.sfx.crack();
      env.banner('🪵 다리가 좁아진다!');
    } else if (Math.random() < 0.5) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      alive.forEach((b) => { b.vy += dir * rand(120, 220); });
      env.sfx.whoosh();
      env.banner('🌪️ 돌풍!');
    } else {
      const b = pick(alive);
      b.vy += (Math.random() < 0.5 ? -1 : 1) * rand(260, 380);
      burst(env, b.x, b.y, 25, { colors: ['#9AD0F5', '#fff', '#4FC3F7'], speed: [60, 200], life: 0.6, size: [2, 4], gravity: 300 });
      env.sfx.splash();
      env.banner(`🐟 잉어 습격! → ${players[b.i].name}`);
    }
  };

  return {
    update(dt) {
      time += dt;
      const alive = bodies.filter((b) => b.alive);
      if (loser < 0) {
        evT += dt;
        if (evT >= 5) { evT = 0; randomEvent(alive); }
        if (time > 25) halfTarget = Math.max(R * 0.9, halfTarget - dt * (slowOn ? 4 : 2));
        if (!slowOn && alive.length === 2) {
          slowOn = true;
          env.slow = 0.45;
          env.banner('⚔️ 최후의 결투! 슬로모션');
        }
      }
      half += (halfTarget - half) * Math.min(1, dt * 3);

      for (const b of alive) {
        b.cd -= dt;
        if (b.cd <= 0 && alive.length > 1 && loser < 0) {
          const o = pick(alive.filter((a) => a !== b));
          const dx = o.x - b.x, dy = o.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          const pw = Math.min(330, 170 + time * 3);
          b.vx += (dx / d) * pw;
          b.vy += (dy / d) * pw + rand(-40, 40);
          b.cd = rand(0.7, 1.6);
        }
        b.vy += (cy - b.y) * 3 * dt; // 중심 잡으려는 본능
        const damp = Math.pow(0.15, dt);
        b.vx *= damp;
        b.vy *= damp;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < x1 + R) { b.x = x1 + R; b.vx = Math.abs(b.vx) * 0.5; }
        if (b.x > x2 - R) { b.x = x2 - R; b.vx = -Math.abs(b.vx) * 0.5; }
      }

      for (let a = 0; a < alive.length; a++) {
        for (let c = a + 1; c < alive.length; c++) {
          const p = alive[a], q = alive[c];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d >= R * 2 || d === 0) continue;
          const nx = dx / d, ny = dy / d;
          const overlap = R * 2 - d;
          p.x -= nx * overlap / 2; p.y -= ny * overlap / 2;
          q.x += nx * overlap / 2; q.y += ny * overlap / 2;
          const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
          if (rel <= 0) continue;
          const imp = rel * 1.25; // 반발계수 1.5 - 통통 튀는 범퍼카 느낌
          p.vx -= imp * nx; p.vy -= imp * ny;
          q.vx += imp * nx; q.vy += imp * ny;
          if (rel > 90) {
            env.sfx.bump();
            env.shake = Math.max(env.shake, Math.min(10, rel / 40));
            burst(env, p.x + nx * R, p.y + ny * R, 8, { colors: ['#FFD166', '#fff'], speed: [40, 140], life: 0.3, size: [1.5, 3] });
          }
        }
      }

      const fell = [];
      for (const b of alive) {
        if (Math.abs(b.y - cy) > half + R * 0.2) {
          b.alive = false;
          b.fallT = 0;
          fell.push(b);
          burst(env, b.x, b.y, 40, { colors: ['#9AD0F5', '#fff', '#4FC3F7', '#1E88E5'], speed: [60, 260], life: 0.9, size: [2, 5], gravity: 400, angle: [Math.PI, Math.PI * 2] });
          env.sfx.splash();
        }
      }
      if (fell.length && loser < 0) {
        const remaining = bodies.filter((b) => b.alive).length;
        if (remaining <= 1) {
          const last = fell.reduce((m, b) => (Math.abs(b.y - cy) > Math.abs(m.y - cy) ? b : m));
          loser = last.i;
          env.slow = 0.5;
          env.shake = 16;
          burst(env, last.x, last.y, 120, { colors: ['#9AD0F5', '#fff', '#4FC3F7', '#1E88E5'], speed: [100, 380], life: 1.4, size: [2, 6], gravity: 400, angle: [Math.PI, Math.PI * 2] });
          env.banner(`💦 ${players[loser].name} 풍덩!`);
        }
      }
      for (const b of bodies) if (!b.alive) b.fallT += dt;
      if (loser >= 0 && !finished) {
        endT += dt;
        if (endT > 1.2) { finished = true; env.slow = 1; env.finish(loser); }
      }
    },

    draw(ctx, t) {
      // 흐르는 강물
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1E88E5');
      g.addColorStop(1, '#0D47A1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 15; i++) {
        const y = ((i * 42 + t * 70) % (H + 42)) - 21;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 10) {
          const yy = y + Math.sin(x * 0.05 + i + t * 2) * 5;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      // 강둑
      ctx.fillStyle = '#6A994E';
      ctx.fillRect(0, 0, x1, H);
      ctx.fillRect(x2, 0, W - x2, H);
      ctx.fillStyle = '#386641';
      ctx.fillRect(x1 - 4, 0, 4, H);
      ctx.fillRect(x2, 0, 4, H);

      // 외나무다리
      ctx.fillStyle = '#8D5524';
      ctx.fillRect(x1, cy - half, x2 - x1, half * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x1, cy - half, x2 - x1, half * 0.5);
      ctx.strokeStyle = 'rgba(60,30,10,0.45)';
      ctx.lineWidth = 2;
      for (const gr of grain) {
        const y = cy + gr.f * half;
        ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * gr.a, y);
        ctx.lineTo(x1 + (x2 - x1) * gr.b, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#5C3A1A';
      ctx.fillRect(x1, cy - half - 3, x2 - x1, 3);
      ctx.fillRect(x1, cy + half, x2 - x1, 3);

      // 빠진 사람: 물결
      for (const b of bodies) {
        if (b.alive || b.fallT > 1.2) continue;
        const k = b.fallT / 1.2;
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
        ctx.lineWidth = 2;
        for (const m of [1, 0.6]) {
          ctx.beginPath(); ctx.ellipse(b.x, b.y, 10 + k * 40 * m, 4 + k * 14 * m, 0, 0, Math.PI * 2); ctx.stroke();
        }
        if (k < 0.5) {
          ctx.save();
          ctx.globalAlpha = 1 - k * 2;
          drawChar(ctx, b.x, b.y - 14 + k * 30, 13 * (1 - k), players[b.i].ch, 'panic', t, b.i);
          ctx.restore();
        }
      }

      // 생존자
      const sorted = bodies.filter((b) => b.alive).sort((a, b) => a.y - b.y);
      for (const b of sorted) {
        const edge = Math.abs(b.y - cy) > half - R;
        const expr = finished || loser >= 0 ? 'joy' : edge ? 'panic' : slowOn ? 'sweat' : 'idle';
        drawChar(ctx, b.x, b.y - 14, 13, players[b.i].ch, expr, t, b.i);
        drawName(ctx, players[b.i].name, b.x, b.y - 42);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(10, 10, 100, 26);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
      ctx.fillText(`생존 ${sorted.length} / ${n}`, 20, 28);
    },
  };
}

export const GAMES = {
  bomb: {
    title: '💣 시한폭탄 패스',
    desc: '폭탄이 점점 빨라진다! 터지는 순간 들고 있는 사람이 커피',
    create: createBombGame,
    times: BOMB_TIMES,
  },
  ladder: {
    title: '🪜 조선 사다리 타기',
    desc: '안개 속 사다리, 단 한 칸만 커피 당첨!',
    create: createLadderGame,
  },
  bridge: {
    title: '🌊 외나무다리 밀치기',
    desc: '밀고 밀리는 배틀로얄! 최후의 결투에서 빠지는 사람이 커피',
    create: createBridgeGame,
  },
};
