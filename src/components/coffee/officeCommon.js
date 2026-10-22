// 회사원 내기 게임 공용 - 캔버스 크기, 회사원 캐릭터·이름표·말풍선 드로잉

export const OW = 400;
export const OH = 540;

// 참가자별 복장 (셔츠/넥타이·리본 색이 모두 다름). color는 순위표 점 색상
export const LOOKS = [
  { shirt: '#FFFFFF', tie: '#E63946', hair: '#2B2B2B', pants: '#2F3E5C', style: 'tie' },
  { shirt: '#BDE0FE', tie: '#1D3557', hair: '#4A3426', pants: '#3A3A3A', style: 'tie', glasses: true },
  { shirt: '#FFC8DD', tie: '#FF5D8F', hair: '#5C3A21', pants: '#3D405B', style: 'blouse' },
  { shirt: '#CDEAC0', tie: '#2D6A4F', hair: '#1B1B1B', pants: '#4A4E69', style: 'tie' },
  { shirt: '#FFE5A0', tie: '#F77F00', hair: '#7A4B2A', pants: '#2F3E5C', style: 'blouse' },
  { shirt: '#E0C3FC', tie: '#7B2CBF', hair: '#2B2B2B', pants: '#22223B', style: 'tie' },
  { shirt: '#A0E7E5', tie: '#00798C', hair: '#3B2416', pants: '#5E503F', style: 'blouse', glasses: true },
  { shirt: '#FFD6A5', tie: '#8B4513', hair: '#1B1B1B', pants: '#3A3A3A', style: 'tie' },
  { shirt: '#CAF0F8', tie: '#0077B6', hair: '#8D5524', pants: '#3D405B', style: 'blouse' },
  { shirt: '#FFADAD', tie: '#E9B200', hair: '#2B2B2B', pants: '#2F3E5C', style: 'tie', glasses: true },
].map((l) => ({ ...l, color: l.tie }));

export const BOSS_LOOK = { shirt: '#4A4E69', tie: '#9D0208', hair: '#9A9A9A', pants: '#22223B', style: 'tie', glasses: true };
export const LEADER_LOOK = { shirt: '#3D405B', tie: '#D00000', hair: '#1B1B1B', pants: '#22223B', style: 'tie', glasses: true };

const SKIN = '#FFE0C2';
const DARK = '#1B1B1B';
const LANYARD = '#3A86FF';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fill();
}

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/**
 * 2~3등신 회사원. (x, y) = 발 위치, s = 머리 반지름
 * o.expr: idle | joy | panic | sweat | dizzy | talk | angry
 * o.walk: 걷기 위상(null이면 정지), o.back: 뒷모습, o.sit: 다리 생략
 * o.hold: paper | phone | drink | coffee, o.typing, o.rot(전체 회전), o.bow(상체 숙이기)
 */
export function drawWorker(ctx, x, y, s, look, o = {}) {
  const { expr = 'idle', walk = null, t = 0, seed = 0, hold = null, back = false, sit = false, rot = 0, bow = 0, typing = false } = o;
  ctx.save();
  ctx.translate(x, y);
  if (!sit) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ellipse(ctx, 0, 0, s * 0.95, s * 0.25);
  }
  const step = walk === null ? 0 : Math.sin(walk);
  const hop = walk !== null ? -Math.abs(step) * s * 0.15
    : expr === 'joy' ? -Math.abs(Math.sin(t * 6 + seed)) * s * 0.25 : 0;
  ctx.translate(0, hop);
  if (rot) {
    ctx.translate(0, -s * 1.6);
    ctx.rotate(rot);
    ctx.translate(0, s * 1.6);
  }

  // 다리 + 치마
  if (!sit) {
    for (const d of [-1, 1]) {
      const lift = walk === null ? 0 : Math.max(0, d * step) * s * 0.25;
      ctx.fillStyle = look.style === 'blouse' ? SKIN : look.pants;
      rrect(ctx, d * s * 0.3 - s * 0.15, -s * 0.5 - lift, s * 0.3, s * 0.5, s * 0.1);
      ctx.fill();
      ctx.fillStyle = '#222';
      ellipse(ctx, d * s * 0.3, -lift - s * 0.04, s * 0.2, s * 0.1);
    }
    if (look.style === 'blouse') {
      ctx.fillStyle = look.pants;
      ctx.beginPath();
      ctx.moveTo(-s * 0.62, -s * 0.5);
      ctx.lineTo(s * 0.62, -s * 0.5);
      ctx.lineTo(s * 0.75, -s * 0.22);
      ctx.lineTo(-s * 0.75, -s * 0.22);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.save();
  if (bow) {
    ctx.translate(0, -s * 0.5);
    ctx.rotate(bow);
    ctx.translate(0, s * 0.5);
  }

  // 몸통
  const bt = -s * 1.55, bb = -s * 0.42;
  ctx.fillStyle = look.shirt;
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, bt);
  ctx.lineTo(s * 0.55, bt);
  ctx.lineTo(s * 0.7, bb);
  ctx.lineTo(-s * 0.7, bb);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.stroke();

  if (!back) {
    if (look.style === 'tie') {
      ctx.fillStyle = '#fff';
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, bt + s * 0.05);
        ctx.lineTo(d * s * 0.32, bt);
        ctx.lineTo(d * s * 0.22, bt + s * 0.25);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = look.tie;
      ellipse(ctx, 0, bt + s * 0.12, s * 0.1, s * 0.09);
      ctx.beginPath();
      ctx.moveTo(-s * 0.09, bt + s * 0.18);
      ctx.lineTo(s * 0.09, bt + s * 0.18);
      ctx.lineTo(s * 0.14, bt + s * 0.75);
      ctx.lineTo(0, bt + s * 0.9);
      ctx.lineTo(-s * 0.14, bt + s * 0.75);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff';
      ellipse(ctx, -s * 0.18, bt + s * 0.08, s * 0.2, s * 0.12, 0.3);
      ellipse(ctx, s * 0.18, bt + s * 0.08, s * 0.2, s * 0.12, -0.3);
      ctx.fillStyle = look.tie;
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, bt + s * 0.18);
        ctx.lineTo(d * s * 0.3, bt + s * 0.04);
        ctx.lineTo(d * s * 0.3, bt + s * 0.34);
        ctx.closePath();
        ctx.fill();
      }
      ellipse(ctx, 0, bt + s * 0.18, s * 0.08, s * 0.08);
    }
    // 사원증 목걸이
    ctx.strokeStyle = LANYARD;
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, bt + s * 0.02);
    ctx.lineTo(s * 0.3, bt + s * 0.62);
    ctx.moveTo(s * 0.32, bt + s * 0.02);
    ctx.lineTo(s * 0.42, bt + s * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(s * 0.18, bt + s * 0.6, s * 0.38, s * 0.46);
    ctx.fillStyle = LANYARD;
    ctx.fillRect(s * 0.18, bt + s * 0.6, s * 0.38, s * 0.1);
    ctx.fillStyle = '#9AA5B1';
    ctx.fillRect(s * 0.25, bt + s * 0.75, s * 0.12, s * 0.14);
  } else {
    ctx.strokeStyle = LANYARD;
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.beginPath();
    ctx.arc(0, bt - s * 0.05, s * 0.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // 팔
  const armY = bt + s * 0.45;
  const hand = (hx, hy) => {
    ctx.fillStyle = SKIN;
    ellipse(ctx, hx, hy, s * 0.14, s * 0.14);
  };
  const arm = (ax, ay, hx, hy) => {
    ctx.strokeStyle = look.shirt;
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    hand(hx, hy);
  };
  if (typing) {
    const k = Math.sin(t * 22 + seed);
    arm(-s * 0.5, armY - s * 0.2, -s * 0.35, bt - s * (0.05 + Math.max(0, k) * 0.15));
    arm(s * 0.5, armY - s * 0.2, s * 0.35, bt - s * (0.05 + Math.max(0, -k) * 0.15));
  } else if (hold === 'paper' && !back) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.fillRect(-s * 0.4, bt + s * 0.25, s * 0.8, s * 0.9);
    ctx.strokeRect(-s * 0.4, bt + s * 0.25, s * 0.8, s * 0.9);
    ctx.fillStyle = '#bbb';
    for (let k = 0; k < 3; k++) ctx.fillRect(-s * 0.28, bt + s * (0.4 + k * 0.22), s * 0.56, s * 0.06);
    arm(-s * 0.55, armY - s * 0.2, -s * 0.42, bt + s * 0.7);
    arm(s * 0.55, armY - s * 0.2, s * 0.42, bt + s * 0.7);
  } else if (hold === 'paper') {
    arm(-s * 0.55, armY - s * 0.2, -s * 0.4, bt + s * 0.4);
    arm(s * 0.55, armY - s * 0.2, s * 0.4, bt + s * 0.4);
  } else {
    const sw = walk === null ? 0 : step * s * 0.2;
    arm(-s * 0.58, armY - s * 0.2, -s * 0.78, armY + s * 0.35 + sw);
    if (hold === 'phone') {
      arm(s * 0.58, armY - s * 0.2, s * 0.75, -s * 2.3);
      ctx.fillStyle = '#222';
      rrect(ctx, s * 0.7, -s * 2.7, s * 0.22, s * 0.45, s * 0.05);
      ctx.fill();
    } else if (hold === 'drink' || hold === 'coffee') {
      arm(s * 0.58, armY - s * 0.2, s * 0.8, bt - s * 0.1);
      if (hold === 'drink') {
        ctx.fillStyle = '#FF6B00';
        rrect(ctx, s * 0.68, bt - s * 0.65, s * 0.26, s * 0.5, s * 0.06);
        ctx.fill();
        ctx.fillStyle = '#FFD60A';
        ctx.fillRect(s * 0.68, bt - s * 0.48, s * 0.26, s * 0.12);
      } else {
        ctx.fillStyle = '#fff';
        rrect(ctx, s * 0.64, bt - s * 0.55, s * 0.34, s * 0.42, s * 0.05);
        ctx.fill();
        ctx.fillStyle = '#6F4E37';
        ctx.fillRect(s * 0.64, bt - s * 0.43, s * 0.34, s * 0.14);
      }
    } else {
      arm(s * 0.58, armY - s * 0.2, s * 0.78, armY + s * 0.35 - sw);
    }
  }

  // 머리
  const hy = -s * 2.35;
  if (look.style === 'blouse' || back) {
    ctx.fillStyle = look.hair;
    ellipse(ctx, 0, hy + (back ? 0 : s * 0.2), s * 1.1, s * (back ? 1.02 : 1.05));
  }
  if (!back) {
    ctx.fillStyle = SKIN;
    ellipse(ctx, 0, hy, s, s * 0.95);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.stroke();
    // 앞머리
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(0, hy, s * 1.02, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(s * 0.6, hy - s * 0.25, s * 0.1, hy - s * 0.4);
    ctx.quadraticCurveTo(-s * 0.5, hy - s * 0.15, -s * 1.0, hy - s * 0.05);
    ctx.closePath();
    ctx.fill();
    drawFace(ctx, s, hy, expr, t, seed, look.glasses);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ellipse(ctx, -s * 0.25, hy - s * 0.3, s * 0.3, s * 0.15, -0.4);
  }
  ctx.restore();
  ctx.restore();
}

function drawFace(ctx, s, hy, expr, t, seed, glasses) {
  const ey = hy + s * 0.12, ex = s * 0.38;
  ctx.lineCap = 'round';
  if (expr === 'joy') {
    ctx.strokeStyle = DARK;
    ctx.lineWidth = s * 0.1;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(d * ex, ey + s * 0.08, s * 0.13, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else if (expr === 'dizzy') {
    ctx.strokeStyle = DARK;
    ctx.lineWidth = s * 0.08;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(d * ex - s * 0.1, ey - s * 0.1);
      ctx.lineTo(d * ex + s * 0.1, ey + s * 0.1);
      ctx.moveTo(d * ex + s * 0.1, ey - s * 0.1);
      ctx.lineTo(d * ex - s * 0.1, ey + s * 0.1);
      ctx.stroke();
    }
  } else if (expr === 'panic') {
    for (const d of [-1, 1]) {
      ctx.fillStyle = '#fff';
      ellipse(ctx, d * ex, ey, s * 0.19, s * 0.21);
      ctx.fillStyle = DARK;
      ellipse(ctx, d * ex + Math.sin(t * 30 + seed) * s * 0.04, ey, s * 0.07, s * 0.07);
    }
  } else {
    for (const d of [-1, 1]) {
      ctx.fillStyle = DARK;
      ellipse(ctx, d * ex, ey, s * 0.1, s * 0.12);
      ctx.fillStyle = '#fff';
      ellipse(ctx, d * ex + s * 0.03, ey - s * 0.04, s * 0.035, s * 0.035);
    }
    if (expr === 'angry') {
      ctx.strokeStyle = DARK;
      ctx.lineWidth = s * 0.08;
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(d * (ex + s * 0.15), ey - s * 0.28);
        ctx.lineTo(d * (ex - s * 0.12), ey - s * 0.16);
        ctx.stroke();
      }
    }
  }
  if (glasses) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = Math.max(1, s * 0.06);
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(d * ex, ey, s * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-ex + s * 0.22, ey);
    ctx.lineTo(ex - s * 0.22, ey);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,105,135,0.45)';
  ellipse(ctx, -s * 0.6, hy + s * 0.38, s * 0.15, s * 0.09);
  ellipse(ctx, s * 0.6, hy + s * 0.38, s * 0.15, s * 0.09);

  const my = hy + s * 0.5;
  ctx.strokeStyle = DARK;
  ctx.fillStyle = '#9B1D20';
  ctx.lineWidth = s * 0.08;
  if (expr === 'joy') {
    ctx.beginPath();
    ctx.arc(0, my - s * 0.04, s * 0.18, 0, Math.PI);
    ctx.fill();
  } else if (expr === 'panic' || expr === 'dizzy') {
    ellipse(ctx, 0, my, s * 0.11, s * 0.15);
  } else if (expr === 'talk') {
    ellipse(ctx, 0, my, s * 0.12, s * (0.04 + Math.abs(Math.sin(t * 14 + seed)) * 0.1));
  } else if (expr === 'sweat' || expr === 'angry') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, my);
    ctx.quadraticCurveTo(-s * 0.09, my - s * 0.08, 0, my);
    ctx.quadraticCurveTo(s * 0.09, my + s * 0.08, s * 0.18, my);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, my - s * 0.1, s * 0.13, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }
  if (expr === 'sweat' || expr === 'panic') {
    const dy = ((t * 1.5 + seed) % 1) * s * 0.4;
    ctx.fillStyle = '#7EC8FF';
    ctx.beginPath();
    ctx.moveTo(s * 0.85, hy - s * 0.5 + dy);
    ctx.quadraticCurveTo(s * 1.05, hy - s * 0.15 + dy, s * 0.85, hy - s * 0.07 + dy);
    ctx.quadraticCurveTo(s * 0.65, hy - s * 0.15 + dy, s * 0.85, hy - s * 0.5 + dy);
    ctx.fill();
  }
}

// 캐릭터 머리 위 이름표 높이 (발 기준)
export const tagY = (y, s) => y - s * 3.55 - 7;

export function drawTag(ctx, name, x, y, color, highlight = false, suffix = '') {
  const label = (name.length > 5 ? name.slice(0, 5) + '…' : name) + suffix;
  ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
  const w = ctx.measureText(label).width + 16;
  ctx.fillStyle = highlight ? '#E63946' : 'rgba(255,255,255,0.92)';
  rrect(ctx, x - w / 2, y - 7, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = color;
  ellipse(ctx, x - w / 2 + 6, y, 3, 3);
  ctx.fillStyle = highlight ? '#fff' : '#3E2723';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 3, y + 0.5);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// (x, y) = 말꼬리 끝
export function drawBubble(ctx, text, x, y, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
  const w = ctx.measureText(text).width + 14, h = 20;
  const bx = clamp(x - w / 2, 3, OW - w - 3);
  const by = y - h - 6;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 1.5;
  rrect(ctx, bx, by, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const tx = clamp(x, bx + 8, bx + w - 8);
  ctx.beginPath();
  ctx.moveTo(tx - 5, by + h - 1);
  ctx.lineTo(tx, y);
  ctx.lineTo(tx + 5, by + h - 1);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tx - 5, by + h);
  ctx.lineTo(tx, y);
  ctx.lineTo(tx + 5, by + h);
  ctx.stroke();
  ctx.fillStyle = '#3E2723';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
  ctx.restore();
}

export function say(pl, text, dur = 1.6) {
  pl.bubble = { text, t: dur };
}
