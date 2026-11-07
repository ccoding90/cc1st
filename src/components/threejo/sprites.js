// 쓰리조 챌린지 도트 스프라이트 (사용자 제공 콘셉트 이미지 참고: 흰 머리띠 의병 · 홍포 탐관오리 · 군복 개틀링 · 메카 조철왕)
// 사각형 목록으로 스프라이트 픽셀을 찍고, 자동 외곽선을 둘러 캔버스로 캐시. 1 스프라이트 픽셀 = 화면 도트 1칸(U)
// 브라우저에서 그릴 때만 생성 (엔진 헤드리스 테스트는 DOM 없이 동작)

export const U = 2.5; // 도트 1칸 = 게임 좌표 2.5 (ThreeJoGame.jsx의 PIXEL과 동일)
const OUTLINE = '#1A1220';

const SKIN = '#F2C190', SKIN2 = '#D69A6A', HAIR = '#2A2420', DARK = '#1B1B1B';
const WHITE = '#F7F3EA', CLOTH2 = '#CFC6B4', SHOE = '#4E342E';

const cache = new Map();

function build(key, w, h, ax, ay, draw) {
  if (cache.has(key)) return cache.get(key);
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w + 2;
  c.height = h + 2;
  const g = c.getContext('2d');
  const p = (x, y, ww, hh, color) => { g.fillStyle = color; g.fillRect(x + 1, y + 1, ww, hh); };
  draw(p);
  // 자동 외곽선: 투명 픽셀 중 상하좌우에 색이 있는 칸
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    }
  }
  g.fillStyle = OUTLINE;
  for (const [x, y] of edge) g.fillRect(x, y, 1, 1);
  // 피격 번쩍임용 흰 실루엣
  const f = document.createElement('canvas');
  f.width = c.width;
  f.height = c.height;
  const fg = f.getContext('2d');
  fg.drawImage(c, 0, 0);
  fg.globalCompositeOperation = 'source-in';
  fg.fillStyle = '#fff';
  fg.fillRect(0, 0, f.width, f.height);
  const sp = { img: c, flash: f, w: c.width, h: c.height, ax: ax + 1, ay: ay + 1 };
  cache.set(key, sp);
  return sp;
}

// (x, y) = 기준점 위치. 도트 격자에 맞춰 스냅
export function drawSprite(ctx, sp, x, y, flash = false, alpha = 1) {
  if (!sp) return;
  const sx = Math.round(x / U) * U - sp.ax * U;
  const sy = Math.round(y / U) * U - sp.ay * U;
  ctx.imageSmoothingEnabled = false;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.drawImage(flash ? sp.flash : sp.img, sx, sy, sp.w * U, sp.h * U);
  if (alpha !== 1) ctx.globalAlpha = 1;
}

// ---------- 주인공 (흰 머리띠 · 흰 한복, 무기 진화) ----------
export function heroSprite(tier) {
  return build(`hero${tier}`, 20, 22, 8, 13, (p) => {
    const band = ['#FFFFFF', '#FFFFFF', '#E53935', '#00E5FF'][tier];
    p(5, 1, 6, 1, HAIR); p(4, 2, 8, 2, HAIR);
    p(4, 4, 8, 1, band); p(12, 4, 2, 1, band); p(13, 5, 1, 2, band);
    p(4, 5, 1, 2, HAIR); p(11, 5, 1, 2, HAIR);
    p(5, 5, 6, 4, SKIN); p(5, 8, 6, 1, SKIN2);
    p(6, 6, 1, 1, DARK); p(9, 6, 1, 1, DARK); p(7, 8, 2, 1, '#B5543C');
    p(7, 9, 2, 1, SKIN2);
    p(4, 10, 8, 5, WHITE); p(4, 10, 1, 5, CLOTH2); p(11, 10, 1, 5, CLOTH2);
    p(7, 10, 2, 2, CLOTH2); p(8, 12, 1, 2, '#8D6E63');
    if (tier === 3) { p(5, 10, 6, 4, '#4DB6AC'); p(6, 11, 4, 1, '#B2DFDB'); p(7, 6, 3, 1, '#00E5FF'); }
    if (tier === 2) p(4, 11, 1, 2, '#E53935');
    p(2, 11, 2, 4, WHITE); p(12, 11, 2, 4, WHITE); p(2, 11, 1, 4, CLOTH2);
    p(2, 15, 2, 1, SKIN); p(12, 15, 2, 1, SKIN);
    p(4, 15, 8, 1, '#A1887F');
    p(4, 16, 8, 3, WHITE); p(7, 16, 2, 3, CLOTH2);
    p(4, 19, 3, 1, CLOTH2); p(9, 19, 3, 1, CLOTH2);
    p(4, 20, 3, 1, SHOE); p(9, 20, 3, 1, SHOE);
    // 무기
    if (tier === 0) {
      const wood = '#8D5524';
      p(14, 2, 1, 2, wood); p(15, 4, 1, 3, wood); p(16, 7, 1, 6, wood); p(15, 13, 1, 3, wood); p(14, 16, 1, 2, wood);
      p(14, 4, 1, 12, '#E0E0E0');
    } else if (tier === 1) {
      p(14, 0, 1, 13, '#455A64'); p(15, 1, 1, 6, '#90A4AE'); p(13, 12, 2, 6, '#6D4C41'); p(14, 9, 1, 1, '#FFD54F');
    } else if (tier === 2) {
      p(13, 1, 6, 2, '#263238'); p(14, 3, 4, 10, '#37474F'); p(15, 3, 1, 9, '#607D8B');
      p(14, 7, 4, 1, '#B0BEC5'); p(13, 13, 6, 3, '#6D4C41');
    } else {
      p(14, 0, 2, 2, '#00E5FF'); p(13, 2, 4, 10, '#B0BEC5'); p(14, 2, 1, 10, '#ECEFF1');
      p(13, 6, 4, 2, '#1565C0'); p(13, 12, 3, 4, '#455A64'); p(16, 8, 1, 2, '#00E5FF');
    }
  });
}

// 머리만 (HUD 초상화)
export function heroFace(tier) {
  return build(`face${tier}`, 10, 10, 5, 5, (p) => {
    const band = ['#FFFFFF', '#FFFFFF', '#E53935', '#00E5FF'][tier];
    p(2, 0, 6, 1, HAIR); p(1, 1, 8, 2, HAIR);
    p(1, 3, 8, 1, band);
    p(1, 4, 1, 2, HAIR); p(8, 4, 1, 2, HAIR);
    p(2, 4, 6, 5, SKIN); p(2, 8, 6, 1, SKIN2);
    p(3, 5, 1, 1, DARK); p(6, 5, 1, 1, DARK); p(4, 7, 2, 1, '#B5543C');
  });
}

// ---------- 잡몹 (플레이어 쪽을 바라봄) ----------
export function mobSprite(stage) {
  return build(`mob${stage}`, 14, 17, 7, 9, (p) => {
    if (stage === 0) {
      // 포졸: 전립 + 갈색 군복 + 화승총
      p(4, 0, 6, 3, '#212121'); p(6, 0, 2, 1, '#E53935'); p(1, 3, 12, 2, '#212121'); p(1, 3, 12, 1, '#424242');
      p(4, 5, 6, 4, SKIN); p(4, 8, 6, 1, SKIN2);
      p(5, 6, 1, 1, DARK); p(8, 6, 1, 1, DARK); p(6, 8, 2, 1, '#8D4A3A');
      p(3, 9, 8, 5, '#795548'); p(3, 9, 1, 5, '#5D4037'); p(6, 9, 2, 5, '#A1887F');
      p(3, 12, 8, 1, '#3E2723'); p(1, 10, 2, 3, '#795548'); p(1, 13, 2, 1, SKIN);
      p(4, 14, 2, 2, '#5D4037'); p(8, 14, 2, 2, '#5D4037'); p(4, 16, 2, 1, DARK); p(8, 16, 2, 1, DARK);
      p(11, 6, 1, 11, '#5D4037'); p(11, 15, 1, 2, '#3E2723'); p(12, 10, 1, 2, SKIN);
    } else if (stage === 1) {
      // 신식 군인: 둥근 철모 + 파란 군복 + 소총
      p(4, 0, 6, 3, '#263238'); p(5, 0, 4, 1, '#455A64'); p(3, 3, 8, 1, '#1B1B1B');
      p(4, 4, 6, 5, SKIN); p(4, 8, 6, 1, SKIN2);
      p(5, 5, 1, 1, DARK); p(8, 5, 1, 1, DARK); p(5, 7, 4, 1, '#5D4037');
      p(3, 9, 8, 5, '#3949AB'); p(3, 9, 1, 5, '#283593'); p(7, 10, 1, 1, '#FFD54F'); p(7, 12, 1, 1, '#FFD54F');
      p(3, 13, 8, 1, '#4E342E'); p(1, 10, 2, 3, '#3949AB'); p(1, 13, 2, 1, SKIN);
      p(4, 14, 2, 2, '#283593'); p(8, 14, 2, 2, '#283593'); p(4, 16, 2, 1, DARK); p(8, 16, 2, 1, DARK);
      p(11, 4, 1, 13, '#37474F'); p(11, 4, 1, 2, '#90A4AE'); p(11, 12, 1, 5, '#6D4C41'); p(12, 10, 1, 2, SKIN);
    } else {
      // 사이보그 병사: 은색 장갑 + 빨간 눈
      p(4, 0, 6, 6, '#B0BEC5'); p(5, 0, 4, 1, '#ECEFF1'); p(4, 3, 6, 2, '#263238');
      p(5, 3, 1, 1, '#FF1744'); p(8, 3, 1, 1, '#FF1744'); p(6, 5, 2, 1, '#78909C');
      p(2, 6, 10, 2, '#90A4AE'); p(3, 8, 8, 5, '#78909C'); p(6, 9, 2, 2, '#00E5FF');
      p(1, 7, 2, 6, '#90A4AE'); p(11, 7, 2, 6, '#90A4AE'); p(1, 12, 2, 2, '#546E7A'); p(11, 12, 2, 2, '#FF1744');
      p(4, 13, 2, 3, '#607D8B'); p(8, 13, 2, 3, '#607D8B'); p(3, 16, 3, 1, '#37474F'); p(8, 16, 3, 1, '#37474F');
    }
  });
}

// ---------- 보스 ----------
// 캐슬조: 사모(날개 관모) + 홍포 + 흉배 + 수염 + 옥 지팡이
export function castleSprite() {
  return build('castle', 32, 36, 16, 18, (p) => {
    const K = '#1B1B1B', RED = '#C62828', RED2 = '#8E1B1B';
    p(11, 0, 10, 6, K); p(13, 1, 6, 1, '#3A3A3A'); p(10, 5, 12, 2, K);
    p(3, 3, 8, 2, K); p(21, 3, 8, 2, K); p(2, 4, 2, 1, K); p(28, 4, 2, 1, K);
    p(11, 7, 10, 8, SKIN); p(11, 13, 10, 2, SKIN2);
    p(13, 8, 2, 1, '#3E2723'); p(17, 8, 2, 1, '#3E2723'); p(13, 9, 2, 1, DARK); p(17, 9, 2, 1, DARK);
    p(12, 11, 1, 1, '#E57373'); p(19, 11, 1, 1, '#E57373');
    p(12, 12, 8, 1, HAIR); p(11, 13, 2, 1, HAIR); p(19, 13, 2, 1, HAIR); p(15, 13, 2, 3, HAIR);
    p(6, 15, 20, 4, RED); p(7, 19, 18, 14, RED); p(7, 19, 2, 14, RED2); p(23, 19, 2, 14, RED2); p(6, 15, 20, 1, '#E53935');
    p(11, 19, 10, 8, '#1565C0'); p(13, 21, 6, 4, '#FFC107'); p(15, 22, 2, 2, '#FF6F00'); p(11, 19, 10, 1, '#1E88E5');
    p(7, 28, 18, 2, '#FFD54F'); p(14, 28, 4, 2, '#FFA000');
    p(8, 33, 16, 2, '#B71C1C'); p(10, 35, 4, 1, K); p(18, 35, 4, 1, K);
    // 지팡이 + 옥
    p(28, 4, 2, 31, '#C9A227'); p(28, 4, 1, 31, '#FFE082'); p(27, 0, 4, 4, '#43A047'); p(28, 1, 2, 1, '#A5D6A7');
    p(25, 18, 4, 3, SKIN);
    // 두루마리
    p(1, 20, 5, 7, '#F5E6C8'); p(1, 19, 5, 1, '#8D6E63'); p(1, 27, 5, 1, '#8D6E63'); p(2, 22, 3, 1, '#A1887F'); p(2, 24, 3, 1, '#A1887F');
    p(5, 21, 3, 3, SKIN);
  });
}

// 제로조: 군모 + 검은 군복 + 금 견장 + 붉은 망토 + 개틀링건
export function zeroSprite(rage) {
  return build(`zero${rage ? 'R' : ''}`, 34, 37, 17, 18, (p) => {
    const K = '#212121', GOLD = '#FFC107';
    p(10, 0, 14, 4, K); p(11, 0, 12, 1, '#424242'); p(10, 4, 14, 2, rage ? '#FF1744' : '#C62828'); p(16, 1, 2, 2, GOLD); p(9, 6, 16, 1, '#000');
    p(11, 7, 12, 8, SKIN); p(11, 14, 12, 1, SKIN2);
    p(12, 8, 4, 1, K); p(18, 8, 4, 1, K); p(13, 9, 2, 1, rage ? '#FF1744' : DARK); p(19, 9, 2, 1, rage ? '#FF1744' : DARK);
    p(12, 12, 10, 2, '#3E2723'); p(15, 11, 4, 1, SKIN2);
    p(4, 18, 2, 14, '#B71C1C'); p(28, 18, 2, 14, '#B71C1C');
    p(6, 15, 22, 16, K); p(7, 15, 20, 1, '#424242');
    p(3, 15, 6, 3, GOLD); p(25, 15, 6, 3, GOLD); p(3, 18, 6, 1, '#FF8F00'); p(25, 18, 6, 1, '#FF8F00');
    p(8, 18, 4, 2, '#FFD54F'); p(8, 20, 4, 1, '#E53935'); p(22, 18, 3, 3, '#E53935');
    p(6, 27, 22, 2, '#5D4037'); p(16, 27, 2, 2, GOLD);
    p(9, 31, 6, 3, K); p(19, 31, 6, 3, K); p(8, 34, 7, 2, '#000'); p(19, 34, 7, 2, '#000');
    // 개틀링건 (아래 = 플레이어 방향)
    p(12, 20, 10, 6, '#455A64'); p(13, 21, 8, 1, '#90A4AE');
    p(13, 26, 8, 9, '#78909C'); p(14, 26, 1, 9, '#37474F'); p(16, 26, 1, 9, '#37474F'); p(18, 26, 1, 9, '#37474F'); p(20, 26, 1, 9, '#37474F');
    p(13, 30, 8, 1, '#455A64'); p(13, 35, 8, 1, '#263238');
    p(10, 21, 2, 3, SKIN); p(22, 21, 2, 3, SKIN);
  });
}

// 조철왕: 왕관 투구 메카 + 청록 코어 + 분홍 레이저 캐논 팔 (분노 시 붉은 코어)
export function kingSprite(rage) {
  return build(`king${rage ? 'R' : ''}`, 40, 40, 20, 20, (p) => {
    const GLOW = rage ? '#FF1744' : '#00E5FF', S1 = '#B0BEC5', S2 = '#78909C', S3 = '#546E7A', S4 = '#455A64';
    p(14, 0, 2, 4, '#FFD54F'); p(19, 0, 2, 3, '#FFD54F'); p(24, 0, 2, 4, '#FFD54F'); p(16, 1, 2, 3, '#FFC107'); p(22, 1, 2, 3, '#FFC107');
    p(13, 3, 14, 9, S2); p(14, 4, 12, 2, '#CFD8DC'); p(15, 7, 10, 2, GLOW); p(16, 7, 2, 1, '#fff'); p(15, 10, 10, 2, S3);
    p(4, 12, 10, 7, '#90A4AE'); p(26, 12, 10, 7, '#90A4AE'); p(5, 12, 8, 1, '#CFD8DC'); p(27, 12, 8, 1, '#CFD8DC');
    p(6, 14, 2, 2, GLOW); p(32, 14, 2, 2, GLOW); p(4, 18, 10, 1, S4); p(26, 18, 10, 1, S4);
    p(12, 12, 16, 14, S1); p(14, 20, 12, 6, S2); p(13, 19, 14, 1, rage ? '#FF5252' : '#00B8D4');
    p(18, 14, 4, 4, GLOW); p(19, 15, 2, 2, '#E0F7FA');
    p(5, 19, 6, 10, S2); p(5, 19, 1, 10, S1); p(5, 29, 6, 3, S3);
    p(27, 19, 9, 6, S3); p(29, 25, 6, 11, S4); p(30, 25, 1, 11, S2); p(29, 28, 6, 1, '#E040FB'); p(29, 31, 6, 1, '#E040FB'); p(30, 36, 4, 2, '#FF80AB');
    p(14, 26, 5, 10, S2); p(21, 26, 5, 10, S2); p(14, 30, 5, 1, GLOW); p(21, 30, 5, 1, GLOW);
    p(13, 36, 7, 3, S4); p(20, 36, 7, 3, S4);
  });
}
