// 🎨 스톤몬스터 도트 그래픽 - 전부 코드로 그리는 절차적 픽셀아트 (외부 이미지 없음)
// v2.0 도감(STONE MONSTERS 1·2) 아트 방향: 귀여운 2D 카툰 · 굵은 블랙 외곽선 · 큰 눈
// v4.0: 스톤몬 100종은 utils/pixelArtRenderer.js (12 골격 템플릿 도트 엔진)가 그린다. 이 파일은 사람 · 타일 · 건물 · 오브젝트.
import { SPECIES } from './data';
import { lookOf, sizeOf } from './monster';
import { monsterCanvas, drawMonster, spriteSize, warmCache } from './utils/pixelArtRenderer';

// ── 색 유틸 ──
const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
const dark = (c, t = 0.3) => mix(c, '#000000', t);
const light = (c, t = 0.3) => mix(c, '#ffffff', t);
const OUTLINE = '#1c1424';

function seeded(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ── 픽셀 버퍼 ──
class PixBuf {
  constructor(w, h, ox = 0, oy = 0) { this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.c = new Array(w * h).fill(null); }
  set(x, y, c) {
    x = Math.round(x + this.ox); y = Math.round(y + this.oy);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.c[y * this.w + x] = c;
  }
  has(x, y) {
    if (this.maskFn) return this.maskFn(Math.round(x + this.ox), Math.round(y + this.oy));
    x = Math.round(x + this.ox); y = Math.round(y + this.oy);
    return x >= 0 && y >= 0 && x < this.w && y < this.h && !!this.c[y * this.w + x];
  }
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  tri(ax, ay, bx, by, cx, cy, c) {
    const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
    const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (!area) return;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const w0 = ((bx - x) * (cy - y) - (by - y) * (cx - x)) / area;
      const w1 = ((cx - x) * (ay - y) - (cy - y) * (ax - x)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 >= -0.04 && w1 >= -0.04 && w2 >= -0.04) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, r = 0) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (r <= 0.5) this.set(x, y, c); else this.ell(x, y, r - 0.5, r - 0.5, c);
    }
  }
  // 위쪽이 비면 밝게, 아래쪽이 비면 어둡게 → 입체감
  shade() {
    const { w, h, c } = this, out = c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = c[y * w + x]; if (!v) continue;
      const up = y > 0 ? c[(y - 1) * w + x] : null;
      const dn = y < h - 1 ? c[(y + 1) * w + x] : null;
      const rt = x < w - 1 ? c[y * w + x + 1] : null;
      if (!up) out[y * w + x] = light(v, 0.22);
      else if (!dn) out[y * w + x] = dark(v, 0.25);
      else if (!rt) out[y * w + x] = dark(v, 0.12);
    }
    this.c = out;
  }
  outline(col = OUTLINE) {
    const { w, h, c } = this, out = c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (c[y * w + x]) continue;
      if ((x > 0 && c[y * w + x - 1]) || (x < w - 1 && c[y * w + x + 1]) || (y > 0 && c[(y - 1) * w + x]) || (y < h - 1 && c[(y + 1) * w + x]))
        out[y * w + x] = col;
    }
    this.c = out;
  }
  recolor(col) { this.c = this.c.map((v) => (v ? col : v)); }
  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    this.c.forEach((v, i) => {
      if (!v) return;
      const [r, g, b] = hex2rgb(v);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

const BONE = '#f0e8d0';

// ── 스톤몬 스프라이트 (v4.0): utils/pixelArtRenderer.js 의 도트 엔진에 위임 ──
// 외부 아틀라스 이미지는 더 이상 쓰지 않는다. 32x32(일반) / 48x48(최종 진화·전설) 도트를 Offscreen Canvas 에 캐싱.
export const loadSprites = () => warmCache();
export const onSpritesReady = () => () => {};
export const spritesReady = () => true;

// 몬스터 스프라이트 캔버스 (원본 도트 해상도). m: 개체 또는 { sid }
export function monSprite(m, { silhouette = false, white = false, frame = 0 } = {}) {
  return monsterCanvas(lookOf(m), { silhouette, white, frame });
}
// 배틀 화면 배율: 체력 각성 거대화(×1.05/1.10/1.15) · 변종(×1.15)
export const monScale = (m) => (m.v4 ? sizeOf(m) / SPECIES[m.sid].size : 1);
export { drawMonster, spriteSize };

// 도감/카드용 이미지 URL (정수 배율로 확대해 픽셀이 흐려지지 않게)
const urlCache = new Map();
export function monDataUrl(m, opts = {}, scale = 3) {
  const L = lookOf(m);
  const key = `${JSON.stringify(L)}|${!!opts.silhouette}|${!!opts.white}|${scale}`;
  if (urlCache.has(key)) return urlCache.get(key);
  const base = monsterCanvas(L, opts);
  const n = base.width, k = Math.max(1, Math.round((64 * scale) / n));
  const cv = document.createElement('canvas');
  cv.width = n * k; cv.height = n * k;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, cv.width, cv.height);
  const u = cv.toDataURL();
  urlCache.set(key, u);
  if (urlCache.size > 400) urlCache.delete(urlCache.keys().next().value);
  return u;
}

// ── 사람(주인공·NPC) 16x16 ──
const charCache = new Map();
export function charSprite(look, dir, frame) {
  const key = JSON.stringify(look) + dir + frame;
  if (charCache.has(key)) return charCache.get(key);
  const P = new PixBuf(16, 16);
  const { hair = '#4a2a18', skin = '#f2c194', cloth = '#e8963a', spot = '#7a4a1a', extra } = look;
  const step = frame ? 1 : 0;
  // 다리
  if (dir === 'left' || dir === 'right') {
    P.rect(6 - step, 12, 2, 3, skin); P.rect(8 + step, 12, 2, 3, skin);
  } else {
    P.rect(5, 12 - (step ? 1 : 0), 2, 3, skin); P.rect(9, 12 - (step ? 0 : 1), 2, 3, skin);
  }
  // 몸 (가죽옷)
  P.rect(4, 8, 8, 5, cloth);
  if (dir === 'down' || dir === 'up') { P.rect(3, 8, 1, 3, skin); P.rect(12, 8, 1, 3, skin); }
  else P.rect(dir === 'right' ? 9 : 6, 9, 2, 3, skin);
  if (extra === 'coat') { P.rect(4, 8, 8, 6, '#f4f4ec'); P.rect(7, 8, 2, 6, '#d8d8cc'); }
  // 머리
  P.ell(7.5, 4.5, 4, 4, skin);
  if (dir === 'up') P.ell(7.5, 4, 4.4, 4.4, hair);
  else if (dir === 'down') { P.ell(7.5, 2.5, 4.4, 2.6, hair); P.set(3, 4, hair); P.set(12, 4, hair); }
  else if (dir === 'right') { P.ell(6.5, 3, 4, 3, hair); P.rect(3, 3, 2, 4, hair); }
  else { P.ell(8.5, 3, 4, 3, hair); P.rect(11, 3, 2, 4, hair); }
  if (extra === 'beard' && dir !== 'up') P.ell(dir === 'right' ? 9 : dir === 'left' ? 6 : 7.5, 8, 2.5, 2, '#eeeeee');
  if (extra === 'crown') { P.rect(4, 0, 8, 1, '#ffd23a'); P.set(4, -1, '#ffd23a'); P.set(8, -1, '#ffd23a'); P.set(11, -1, '#ffd23a'); }
  if (extra === 'bone') { P.rect(2, 1, 12, 1, BONE); P.set(2, 0, BONE); P.set(13, 0, BONE); }
  P.shade();
  // 얼굴 & 무늬
  if (extra !== 'coat') { P.set(5, 10, spot); P.set(9, 11, spot); P.set(10, 9, spot); }
  if (dir === 'down') { P.set(6, 5, '#111'); P.set(9, 5, '#111'); }
  if (dir === 'right') P.set(10, 5, '#111');
  if (dir === 'left') P.set(5, 5, '#111');
  if (extra === 'glasses' && dir !== 'up') { if (dir === 'down') { P.rect(5, 5, 2, 1, '#333'); P.rect(9, 5, 2, 1, '#333'); } else P.rect(dir === 'right' ? 9 : 5, 5, 2, 1, '#333'); }
  P.outline();
  const cv = P.toCanvas();
  charCache.set(key, cv);
  return cv;
}

// ── 타일 16x16 ──
const T = 16;
function tileCanvas(fn) {
  const cv = document.createElement('canvas');
  cv.width = T; cv.height = T;
  const ctx = cv.getContext('2d');
  fn(ctx);
  return cv;
}
const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
// 테마별 바닥색: 원시 정글 / 습지 / 화산
const GROUND = {
  forest: { base: '#78c850', dk: '#5aa83c', lt: '#98e070' },
  swamp: { base: '#6a9a4a', dk: '#4a7a36', lt: '#8ab868' },
  volcano: { base: '#5a4a48', dk: '#463836', lt: '#74625e' },
  glacier: { base: '#e4f0f8', dk: '#c4d8e8', lt: '#ffffff' },
  sky: { base: '#d8e4f0', dk: '#b8c8dc', lt: '#f4f8ff' },
};
function groundBase(ctx, seed, th) {
  const G = GROUND[th] || GROUND.forest;
  px(ctx, 0, 0, G.base, T, T);
  const r = seeded(seed);
  for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 14); px(ctx, x, y, G.dk); px(ctx, x, y + 1, G.dk); }
  for (let i = 0; i < 3; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), G.lt);
  if (th === 'volcano' && r() < 0.5) px(ctx, Math.floor(r() * 14), Math.floor(r() * 14), '#ff6a3d');
  if (th === 'glacier' && r() < 0.5) px(ctx, Math.floor(r() * 14), Math.floor(r() * 14), '#9ee8ff');
  if (th === 'sky' && r() < 0.4) px(ctx, Math.floor(r() * 14), Math.floor(r() * 14), '#ffe680');
}
function tufts(c, base, dark2, tip) {
  px(c, 0, 0, base, T, T);
  for (const [x, y] of [[1, 3], [8, 1], [5, 9], [12, 8], [0, 12], [9, 13]]) {
    px(c, x, y + 2, dark2, 1, 3); px(c, x + 1, y, dark2, 1, 5); px(c, x + 2, y + 1, dark2, 1, 4);
    px(c, x + 1, y, tip); px(c, x + 3, y + 1, dark2, 1, 4);
  }
}
const TILESETS = {};
export function tiles(th = 'forest') {
  if (TILESETS[th]) return TILESETS[th];
  const gb = (seed) => (c) => groundBase(c, seed, th);
  const on = (seed, fn) => tileCanvas((c) => { groundBase(c, seed, th); fn(c); });
  const S = {
    grass: tileCanvas(gb(3)),
    grass2: tileCanvas(gb(11)),
    tall: tileCanvas((c) => {
      if (th === 'swamp') { // 갈대
        px(c, 0, 0, '#4a7a3a', T, T);
        for (const [x, y] of [[1, 2], [5, 0], [9, 3], [13, 1], [3, 8], [11, 9], [7, 10]]) {
          px(c, x, y + 2, '#2a5a2a', 1, 6); px(c, x, y, '#8a6a3a', 1, 3); px(c, x + 1, y + 4, '#3a6a2a', 1, 4);
        }
      } else tufts(c, '#4f9e3a', '#2f6e28', '#8ad868');
    }),
    dry: tileCanvas((c) => tufts(c, '#c87a4a', '#8a4a2a', '#f0b070')),
    snow: tileCanvas((c) => { tufts(c, '#c8dcec', '#6a8aa8', '#ffffff'); px(c, 3, 2, '#9ee8ff'); px(c, 11, 10, '#9ee8ff'); }),
    skygrass: tileCanvas((c) => { tufts(c, '#c8b45a', '#8a7a2a', '#fff2a0'); px(c, 6, 6, '#ffffff'); }),
    crystal: on(37, (c) => {
      px(c, 5, 2, '#1c1424', 6, 14); px(c, 6, 3, '#7ac8f0', 4, 12); px(c, 6, 3, '#d8f4ff', 2, 12);
      px(c, 1, 7, '#1c1424', 5, 9); px(c, 2, 8, '#9ee8ff', 3, 7); px(c, 10, 6, '#1c1424', 5, 10); px(c, 11, 7, '#9ee8ff', 3, 8);
      px(c, 7, 1, '#ffffff', 2, 2);
    }),
    cloud: tileCanvas((c) => {
      px(c, 0, 0, '#7aa8d8', T, T);
      c.fillStyle = '#ffffff';
      for (const [x, y, r] of [[3, 4, 4], [10, 3, 5], [7, 11, 5], [14, 12, 4], [1, 13, 3]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
      px(c, 6, 9, '#dce8f8', 6, 2);
    }),
    ash: tileCanvas((c) => tufts(c, '#4a3a3a', '#7a2a1a', '#ff8a3a')),
    path: tileCanvas((c) => {
      const pc = th === 'volcano' ? ['#6a6264', '#4a4446'] : th === 'swamp' ? ['#c8b07a', '#a8905a'] : th === 'glacier' ? ['#a8c8e0', '#88a8c8'] : th === 'sky' ? ['#e8dcc0', '#c8b890'] : ['#e2cf96', '#c9b278'];
      px(c, 0, 0, pc[0], T, T);
      const r = seeded(5);
      for (let i = 0; i < 7; i++) px(c, Math.floor(r() * 15), Math.floor(r() * 15), pc[1], 2, 1);
    }),
    canyon: tileCanvas((c) => {
      px(c, 0, 0, '#d8905a', T, T);
      const r = seeded(31);
      for (let i = 0; i < 6; i++) px(c, Math.floor(r() * 15), Math.floor(r() * 15), '#b86a3a', 2, 1);
      px(c, 3, 12, '#f0b080', 3, 1);
    }),
    stone: tileCanvas((c) => {
      px(c, 0, 0, '#8a8478', T, T);
      px(c, 0, 0, '#a8a294', 7, 7); px(c, 8, 0, '#9a9488', 8, 7); px(c, 0, 8, '#9a9488', 10, 8); px(c, 11, 8, '#a8a294', 5, 8);
      px(c, 2, 10, '#5a8a4a', 2, 1);
    }),
    mud: on(41, (c) => { c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(8, 9, 7, 4, 0, 0, Math.PI * 2); c.fill(); px(c, 5, 8, '#8a6a4a', 3, 1); }),
    water0: tileCanvas((c) => { px(c, 0, 0, th === 'swamp' ? '#3a7a8a' : th === 'glacier' ? '#8ac8e8' : '#4a8ae8', T, T); px(c, 2, 4, th === 'glacier' ? '#ffffff' : '#9ccaff', 5, 1); px(c, 9, 11, '#9ccaff', 5, 1); px(c, 12, 2, '#7ab0f8', 3, 1); }),
    water1: tileCanvas((c) => { px(c, 0, 0, th === 'swamp' ? '#3a7a8a' : th === 'glacier' ? '#8ac8e8' : '#4a8ae8', T, T); px(c, 4, 4, th === 'glacier' ? '#ffffff' : '#9ccaff', 5, 1); px(c, 7, 11, '#9ccaff', 5, 1); px(c, 1, 8, '#7ab0f8', 3, 1); }),
    fall0: tileCanvas((c) => { px(c, 0, 0, '#5aa8f0', T, T); for (let x = 1; x < 16; x += 4) px(c, x, 0, '#e8f6ff', 1, 9); px(c, 0, 13, '#ffffff', 16, 3); }),
    fall1: tileCanvas((c) => { px(c, 0, 0, '#5aa8f0', T, T); for (let x = 3; x < 16; x += 4) px(c, x, 5, '#e8f6ff', 1, 9); px(c, 0, 12, '#ffffff', 16, 4); }),
    lava0: tileCanvas((c) => { px(c, 0, 0, '#e8401a', T, T); px(c, 2, 3, '#ffb03a', 5, 2); px(c, 10, 10, '#ffd23a', 4, 2); px(c, 8, 1, '#a8200a', 3, 1); }),
    lava1: tileCanvas((c) => { px(c, 0, 0, '#e8401a', T, T); px(c, 5, 5, '#ffb03a', 5, 2); px(c, 1, 11, '#ffd23a', 4, 2); px(c, 12, 2, '#a8200a', 3, 1); }),
    tree: on(7, (c) => {
      if (th === 'volcano') { // 불탄 고목
        px(c, 7, 4, '#2a1a14', 3, 12); px(c, 4, 6, '#2a1a14', 3, 1); px(c, 10, 3, '#2a1a14', 3, 1); px(c, 8, 4, '#4a3024', 1, 12);
        return;
      }
      px(c, 6, 11, '#6a4424', 4, 5); px(c, 7, 11, '#8a5a30', 1, 5);
      const dk = th === 'swamp' ? '#1a3a26' : '#1e4e26', md = th === 'swamp' ? '#2a5a3a' : '#2f7a3a', lt = th === 'swamp' ? '#3a7a4a' : '#4aa050';
      c.fillStyle = dk; c.beginPath(); c.arc(8, 7, 7.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = md; c.beginPath(); c.arc(8, 7, 6.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = lt; c.beginPath(); c.arc(6, 5, 3.5, 0, Math.PI * 2); c.fill();
      px(c, 4, 3, '#7acc6a', 2, 1); px(c, 10, 9, '#24602e', 2, 2);
      if (th === 'swamp') { px(c, 3, 10, '#5a8a3a', 1, 5); px(c, 12, 9, '#5a8a3a', 1, 6); }
    }),
    palm: on(9, (c) => {
      px(c, 7, 6, '#8a5a30', 2, 10); px(c, 7, 8, '#6a4424', 2, 1); px(c, 7, 12, '#6a4424', 2, 1);
      c.fillStyle = '#2f8a3a';
      for (const [dx, dy] of [[-6, 2], [6, 2], [-4, -3], [4, -3], [0, -5]]) { c.beginPath(); c.ellipse(8 + dx / 2, 5 + dy / 2, 4, 1.6, Math.atan2(dy, dx), 0, Math.PI * 2); c.fill(); }
      px(c, 6, 5, '#7a4a20', 2, 2);
    }),
    flower: on(13, (c) => {
      for (const [x, y, col] of [[3, 3, '#ff6a8a'], [10, 5, '#ffe04a'], [6, 11, '#ff6a8a'], [12, 12, '#ffffff']]) {
        px(c, x, y, col); px(c, x - 1, y, col); px(c, x + 1, y, col); px(c, x, y - 1, col); px(c, x, y + 1, col); px(c, x, y, '#ffb03a');
      }
    }),
    rock: on(17, (c) => {
      c.fillStyle = '#1c1424'; c.beginPath(); c.ellipse(8, 9, 7, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = th === 'volcano' ? '#4a3a3a' : th === 'glacier' ? '#8aa8c0' : '#8a8890'; c.beginPath(); c.ellipse(8, 9, 6, 5, 0, 0, Math.PI * 2); c.fill();
      px(c, 4, 6, th === 'volcano' ? '#6a5a5a' : th === 'glacier' ? '#ffffff' : '#b8b6c0', 4, 2); px(c, 9, 11, '#6a6870', 3, 1);
    }),
    redrock: tileCanvas((c) => {
      const base = th === 'volcano' ? ['#2a2024', '#3a2e30', '#4a3a3a'] : ['#6a2a1a', '#a8482a', '#d8784a'];
      px(c, 0, 0, base[0], T, T); px(c, 1, 1, base[1], 14, 13); px(c, 2, 2, base[2], 6, 3); px(c, 9, 7, base[2], 4, 2);
      px(c, 1, 14, base[0], 14, 1); px(c, 6, 9, base[0], 1, 4);
    }),
    pillar: tileCanvas((c) => {
      px(c, 0, 0, '#8a8478', T, T);
      px(c, 3, 0, '#1c1424', 10, 16); px(c, 4, 0, '#c8c0b0', 8, 16); px(c, 4, 0, '#e8e0d0', 2, 16);
      px(c, 2, 0, '#1c1424', 12, 3); px(c, 3, 1, '#d8d0c0', 10, 1); px(c, 6, 6, '#8a8478', 3, 1); px(c, 7, 10, '#5a8a4a', 1, 3);
    }),
    fence: on(19, (c) => {
      px(c, 0, 6, '#3a2418', 16, 4); px(c, 0, 7, '#a07040', 16, 2);
      for (const x of [1, 9]) { px(c, x, 2, '#3a2418', 5, 13); px(c, x + 1, 3, BONE, 3, 11); px(c, x + 1, 3, '#ffffff', 1, 11); }
    }),
    sign: on(23, (c) => {
      px(c, 7, 9, '#6a4424', 2, 6);
      px(c, 2, 3, '#3a2418', 12, 8); px(c, 3, 4, '#c08a50', 10, 6); px(c, 4, 6, '#7a4a20', 8, 1); px(c, 4, 8, '#7a4a20', 6, 1);
    }),
    bones: on(29, (c) => {
      px(c, 3, 9, BONE, 8, 2); px(c, 2, 8, BONE, 2, 4); px(c, 10, 8, BONE, 2, 4);
      px(c, 9, 3, '#e8e0c8', 4, 4); px(c, 10, 4, '#3a3440', 1, 1); px(c, 12, 4, '#3a3440', 1, 1);
    }),
  };
  TILESETS[th] = S;
  return S;
}

// ── 건물 ──
function bcanvas(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w * T; cv.height = h * T;
  const ctx = cv.getContext('2d');
  fn(ctx, cv.width, cv.height);
  return cv;
}
const BUILD = {};
export function building(type) {
  if (BUILD[type]) return BUILD[type];
  let cv;
  if (type === 'house') cv = bcanvas(4, 3, (c, w, h) => {
    c.fillStyle = '#3a2418'; c.beginPath(); c.ellipse(w / 2, h - 10, w / 2, h - 6, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#c89858'; c.beginPath(); c.ellipse(w / 2, h - 10, w / 2 - 2, h - 8, 0, Math.PI, 0); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#a87a40' : '#d8aa68'; c.fillRect(6 + i * 9, 10 + Math.abs(2.5 - i) * 3, 2, 18); }
    c.fillStyle = '#8a7a6a'; c.fillRect(2, h - 14, w - 4, 14); c.fillStyle = '#a8988a';
    for (let x = 4; x < w - 4; x += 8) c.fillRect(x, h - 12, 6, 4);
    c.fillStyle = '#3a2418'; c.fillRect(19, h - 18, 12, 18); c.fillStyle = '#120c10'; c.fillRect(21, h - 16, 8, 16);
    c.fillStyle = '#ffd23a'; c.fillRect(42, h - 12, 6, 5);
  });
  if (type === 'lab') cv = bcanvas(6, 4, (c, w, h) => {
    c.fillStyle = '#2a2430'; c.fillRect(0, 14, w, h - 14);
    c.fillStyle = '#9a96a0'; c.fillRect(2, 16, w - 4, h - 18);
    c.fillStyle = '#7a7680';
    for (let y = 20; y < h - 4; y += 7) for (let x = 4 + ((y / 7) % 2) * 6; x < w - 6; x += 12) c.fillRect(x, y, 10, 1);
    c.fillStyle = '#5a4a3a'; c.fillRect(0, 8, w, 9); c.fillStyle = '#7a6a50'; c.fillRect(2, 9, w - 4, 6);
    // 지붕 위 공룡 두개골 간판
    c.fillStyle = '#2a2430'; c.fillRect(30, 0, 36, 12); c.fillStyle = BONE; c.fillRect(32, 2, 32, 8);
    c.fillStyle = '#2a2430'; c.fillRect(38, 4, 3, 3); c.fillRect(54, 5, 8, 1); for (let x = 46; x < 62; x += 3) c.fillRect(x, 8, 1, 2);
    c.fillStyle = '#3a6a8a'; c.fillRect(10, 26, 14, 10); c.fillRect(w - 24, 26, 14, 10);
    c.fillStyle = '#9ad0f0'; c.fillRect(11, 27, 5, 4); c.fillRect(w - 23, 27, 5, 4);
    c.fillStyle = '#3a2418'; c.fillRect(40, h - 22, 16, 22); c.fillStyle = '#120c10'; c.fillRect(42, h - 20, 12, 20);
  });
  if (type === 'shop') cv = bcanvas(4, 3, (c, w, h) => {
    c.fillStyle = '#3a2418'; c.beginPath(); c.moveTo(0, 20); c.lineTo(w / 2, 0); c.lineTo(w, 20); c.fill();
    c.fillStyle = '#e07a3a'; c.beginPath(); c.moveTo(4, 18); c.lineTo(w / 2, 3); c.lineTo(w - 4, 18); c.fill();
    c.fillStyle = '#b8582a'; for (let x = 8; x < w - 8; x += 8) c.fillRect(x, 10 + Math.abs(x - w / 2) / 6, 2, 8);
    c.fillStyle = '#3a2418'; c.fillRect(2, 18, w - 4, h - 18); c.fillStyle = '#b08050'; c.fillRect(4, 20, w - 8, h - 20);
    c.fillStyle = '#120c10'; c.fillRect(8, h - 16, 12, 16);
    // 고기 간판
    c.fillStyle = '#3a2418'; c.fillRect(30, 24, 26, 14); c.fillStyle = '#f4ead8'; c.fillRect(31, 25, 24, 12);
    c.fillStyle = '#c0402a'; c.beginPath(); c.ellipse(46, 31, 6, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = BONE; c.fillRect(34, 30, 7, 2); c.fillRect(33, 29, 2, 4);
  });
  if (type === 'temple') cv = bcanvas(6, 4, (c, w, h) => {
    c.fillStyle = '#2a2430'; c.fillRect(0, 12, w, h - 12);
    c.fillStyle = '#6a6470'; c.fillRect(2, 14, w - 4, h - 16);
    c.fillStyle = '#2a2430'; c.beginPath(); c.moveTo(0, 14); c.lineTo(w / 2, 0); c.lineTo(w, 14); c.fill();
    c.fillStyle = '#8a8490'; c.beginPath(); c.moveTo(4, 13); c.lineTo(w / 2, 2); c.lineTo(w - 4, 13); c.fill();
    for (const x of [6, 22, w - 30, w - 14]) { c.fillStyle = '#3a3440'; c.fillRect(x, 16, 8, h - 18); c.fillStyle = '#b8b2c0'; c.fillRect(x + 1, 16, 5, h - 18); }
    c.fillStyle = BONE; c.fillRect(w / 2 - 8, 4, 16, 8); c.fillStyle = '#c0302a'; c.fillRect(w / 2 - 5, 6, 3, 3); c.fillRect(w / 2 + 2, 6, 3, 3);
    c.fillStyle = '#120c10'; c.fillRect(w / 2 - 9, h - 24, 18, 24);
    c.fillStyle = '#ff5a3a'; c.fillRect(w / 2 - 14, h - 26, 2, 4); c.fillRect(w / 2 + 12, h - 26, 2, 4);
  });
  if (type === 'altar') cv = bcanvas(3, 3, (c, w, h) => {
    c.fillStyle = '#2a1418'; c.beginPath(); c.ellipse(w / 2, h / 2 + 6, w / 2, h / 2 - 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7a3a3a'; c.beginPath(); c.ellipse(w / 2, h / 2 + 6, w / 2 - 2, h / 2 - 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a84a3a'; c.beginPath(); c.ellipse(w / 2, h / 2 + 4, w / 2 - 8, h / 2 - 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a1418'; c.fillRect(w / 2 - 7, 4, 14, 26); c.fillStyle = '#5a5060'; c.fillRect(w / 2 - 5, 6, 10, 23);
    c.fillStyle = '#ff3a5a'; c.fillRect(w / 2 - 2, 10, 4, 4); c.fillRect(w / 2 - 1, 16, 2, 8);
    c.fillStyle = BONE; c.fillRect(6, h - 14, 6, 2); c.fillRect(w - 12, h - 12, 6, 2); c.fillRect(8, 16, 2, 5);
  });
  if (type === 'swampShop') cv = bcanvas(4, 3, (c, w, h) => {
    // 수상 가옥 (기둥 위 오두막)
    c.fillStyle = '#3a2418'; for (const x of [4, 20, 40, 56]) c.fillRect(x, h - 14, 4, 14);
    c.fillStyle = '#3a2418'; c.fillRect(0, 14, w, h - 26);
    c.fillStyle = '#8a6a3a'; c.fillRect(2, 16, w - 4, h - 30);
    for (let y = 18; y < h - 14; y += 4) { c.fillStyle = '#6a4a2a'; c.fillRect(2, y, w - 4, 1); }
    c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(-2, 16); c.lineTo(w / 2, 0); c.lineTo(w + 2, 16); c.fill();
    c.fillStyle = '#b8a050'; c.beginPath(); c.moveTo(2, 15); c.lineTo(w / 2, 3); c.lineTo(w - 2, 15); c.fill();
    c.fillStyle = '#8a7a30'; for (let x = 6; x < w - 6; x += 5) c.fillRect(x, 8 + Math.abs(x - w / 2) / 5, 1, 6);
    c.fillStyle = '#120c10'; c.fillRect(17, h - 26, 12, 12);
    // 약병 간판
    c.fillStyle = '#3a2418'; c.fillRect(36, 20, 20, 14); c.fillStyle = '#f4ead8'; c.fillRect(37, 21, 18, 12);
    c.fillStyle = '#5ac85a'; c.fillRect(41, 25, 4, 6); c.fillStyle = '#b05cff'; c.fillRect(47, 25, 4, 6); c.fillStyle = '#3a2418'; c.fillRect(42, 23, 2, 2); c.fillRect(48, 23, 2, 2);
  });
  if (type === 'lair') cv = bcanvas(4, 3, (c, w, h) => {
    // 협곡의 동굴
    c.fillStyle = '#6a2a1a'; c.beginPath(); c.moveTo(0, h); c.lineTo(4, 10); c.lineTo(20, 0); c.lineTo(44, 2); c.lineTo(60, 12); c.lineTo(w, h); c.fill();
    c.fillStyle = '#a8482a'; c.beginPath(); c.moveTo(4, h); c.lineTo(8, 12); c.lineTo(22, 4); c.lineTo(42, 6); c.lineTo(56, 14); c.lineTo(w - 4, h); c.fill();
    c.fillStyle = '#120a0c'; c.beginPath(); c.ellipse(w / 2, h, 18, 22, 0, Math.PI, 0); c.fill();
    c.fillStyle = BONE; for (let x = w / 2 - 14; x <= w / 2 + 12; x += 6) { c.beginPath(); c.moveTo(x, h - 20 + Math.abs(x - w / 2) / 2); c.lineTo(x + 4, h - 20 + Math.abs(x - w / 2) / 2); c.lineTo(x + 2, h - 13 + Math.abs(x - w / 2) / 2); c.fill(); }
    c.fillStyle = '#ff3a3a'; c.fillRect(w / 2 - 6, h - 10, 2, 2); c.fillRect(w / 2 + 4, h - 10, 2, 2);
  });
  if (type === 'throne') cv = bcanvas(6, 3, (c, w, h) => {
    // 고대 유적의 왕좌 (석조 신전)
    c.fillStyle = '#1c1424'; c.fillRect(0, 6, w, h - 6);
    c.fillStyle = '#a8a294'; c.fillRect(2, 8, w - 4, h - 10);
    for (let y = 12; y < h - 4; y += 6) for (let x = 4 + ((y / 6) % 2) * 6; x < w - 6; x += 12) { c.fillStyle = '#8a8478'; c.fillRect(x, y, 10, 1); }
    c.fillStyle = '#1c1424'; c.fillRect(0, 0, w, 8); c.fillStyle = '#c8c0b0'; c.fillRect(2, 2, w - 4, 4);
    for (const x of [6, 22, w - 30, w - 14]) { c.fillStyle = '#1c1424'; c.fillRect(x, 8, 8, h - 8); c.fillStyle = '#d8d0c0'; c.fillRect(x + 1, 8, 5, h - 8); }
    c.fillStyle = '#120a0c'; c.fillRect(w / 2 - 12, h - 26, 24, 26);
    c.fillStyle = '#ff3a2a'; c.fillRect(w / 2 - 3, h - 22, 6, 6); c.fillStyle = '#ffd23a'; c.fillRect(w / 2 - 1, h - 20, 2, 2);
    c.fillStyle = '#5a8a4a'; c.fillRect(4, 10, 2, 14); c.fillRect(w - 6, 12, 2, 10); c.fillRect(30, 6, 10, 2);
  });
  if (type === 'iceLair') cv = bcanvas(6, 3, (c, w, h) => {
    // 빙하의 군주의 얼음 굴
    c.fillStyle = '#1c1424'; c.beginPath(); c.moveTo(0, h); c.lineTo(6, 8); c.lineTo(26, 0); c.lineTo(62, 2); c.lineTo(88, 10); c.lineTo(w, h); c.fill();
    c.fillStyle = '#7ac8f0'; c.beginPath(); c.moveTo(4, h); c.lineTo(10, 10); c.lineTo(28, 3); c.lineTo(60, 5); c.lineTo(84, 12); c.lineTo(w - 4, h); c.fill();
    c.fillStyle = '#d8f4ff'; c.fillRect(18, 10, 10, 3); c.fillRect(56, 9, 14, 3); c.fillRect(30, 6, 6, 2);
    c.fillStyle = '#0a1420'; c.beginPath(); c.ellipse(w / 2, h, 20, 26, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#e8f8ff'; for (let x = w / 2 - 16; x <= w / 2 + 12; x += 7) { c.beginPath(); c.moveTo(x, h - 24 + Math.abs(x - w / 2) / 2); c.lineTo(x + 5, h - 24 + Math.abs(x - w / 2) / 2); c.lineTo(x + 2.5, h - 14 + Math.abs(x - w / 2) / 2); c.fill(); }
    c.fillStyle = '#9ee8ff'; c.fillRect(w / 2 - 7, h - 10, 3, 3); c.fillRect(w / 2 + 4, h - 10, 3, 3);
  });
  if (type === 'skyAltar') cv = bcanvas(6, 4, (c, w, h) => {
    // 하늘 제단 (고대 3대 신수)
    c.fillStyle = '#1c1424'; c.fillRect(0, 16, w, h - 16);
    c.fillStyle = '#f0e8d8'; c.fillRect(2, 18, w - 4, h - 20);
    for (let y = 22; y < h - 4; y += 7) { c.fillStyle = '#c8bca0'; c.fillRect(2, y, w - 4, 1); }
    c.fillStyle = '#1c1424'; c.beginPath(); c.moveTo(-2, 18); c.lineTo(w / 2, 0); c.lineTo(w + 2, 18); c.fill();
    c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(3, 17); c.lineTo(w / 2, 3); c.lineTo(w - 3, 17); c.fill();
    c.fillStyle = '#f8f0c0'; c.beginPath(); c.moveTo(12, 16); c.lineTo(w / 2, 7); c.lineTo(w - 12, 16); c.fill();
    for (const x of [6, 22, w - 30, w - 14]) { c.fillStyle = '#1c1424'; c.fillRect(x, 18, 8, h - 18); c.fillStyle = '#ffffff'; c.fillRect(x + 1, 18, 5, h - 18); c.fillStyle = '#7fe0b8'; c.fillRect(x + 1, 26, 5, 2); }
    c.fillStyle = '#120a0c'; c.fillRect(w / 2 - 10, h - 26, 20, 26);
    for (const [x, col] of [[w / 2 - 6, '#3fa9f5'], [w / 2, '#b07b48'], [w / 2 + 6, '#ff6a3d']]) { c.fillStyle = col; c.fillRect(x - 2, h - 22, 4, 4); }
  });
  if (type === 'colosseum') cv = bcanvas(6, 4, (c, w, h) => {
    // 무한의 원시 투기장 (원형 석조 경기장)
    c.fillStyle = '#1c1424'; c.beginPath(); c.ellipse(w / 2, h / 2 + 4, w / 2, h / 2 - 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c8a878'; c.beginPath(); c.ellipse(w / 2, h / 2 + 4, w / 2 - 2, h / 2 - 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a8885a'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(w / 2 + Math.cos(a) * (w / 2 - 8) - 2, h / 2 + 4 + Math.sin(a) * (h / 2 - 10) - 3, 4, 6); }
    c.fillStyle = '#e8d4a8'; c.beginPath(); c.ellipse(w / 2, h / 2 + 2, w / 2 - 16, h / 2 - 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c62828'; c.fillRect(8, 2, 2, 12); c.fillRect(w - 10, 2, 2, 12); c.fillStyle = '#ffd23a'; c.fillRect(10, 2, 8, 5); c.fillRect(w - 18, 2, 8, 5);
    c.fillStyle = '#120a0c'; c.fillRect(w / 2 - 10, h - 18, 20, 18);
    c.fillStyle = '#8a8a8a'; for (let x = w / 2 - 9; x < w / 2 + 10; x += 4) c.fillRect(x, h - 18, 1, 18);
  });
  BUILD[type] = cv;
  return cv;
}

// v3.0 필드 오브젝트: 고대 화석 바위 · 수상한 알 둥지 (ready = 조사 가능 · 반짝임)
const OBJ = {};
export function objSprite(kind, ready) {
  const key = kind + ready;
  if (OBJ[key]) return OBJ[key];
  const cv = tileCanvas((c) => {
    if (kind === 'fossil') {
      c.fillStyle = '#1c1424'; c.beginPath(); c.ellipse(8, 9, 8, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = ready ? '#b8a890' : '#7a7468'; c.beginPath(); c.ellipse(8, 9, 7, 6, 0, 0, Math.PI * 2); c.fill();
      px(c, 3, 5, ready ? '#d8ccb0' : '#8a8478', 5, 2);
      // 암모나이트 · 뼈 화석 무늬
      c.strokeStyle = ready ? '#f8f0d8' : '#a8a090'; c.lineWidth = 1;
      c.beginPath(); c.arc(9, 10, 3, 0, Math.PI * 1.6); c.stroke();
      px(c, 3, 11, ready ? '#f8f0d8' : '#a8a090', 4, 1); px(c, 2, 10, ready ? '#f8f0d8' : '#a8a090', 1, 3);
    } else {
      c.fillStyle = '#1c1424'; c.beginPath(); c.ellipse(8, 11, 8, 4.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c8a050'; c.beginPath(); c.ellipse(8, 11, 7, 3.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#8a6a2a'; for (const x of [2, 5, 9, 12]) px(c, x, 10 + (x % 3), '#8a6a2a', 2, 1);
      if (ready) for (const [x, col] of [[5, '#f0e8d0'], [10, '#e8f0c8']]) { c.fillStyle = '#1c1424'; c.beginPath(); c.ellipse(x, 8, 3, 3.6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, 8, 2.2, 2.8, 0, 0, Math.PI * 2); c.fill(); px(c, x - 1, 6, '#ffffff'); }
      else { px(c, 4, 9, '#5a4a2a', 8, 2); }
    }
  });
  OBJ[key] = cv;
  return cv;
}

// 알 (스타팅 선택 · 부화 연출)
export function eggSprite(col) {
  const P = new PixBuf(24, 28);
  P.ell(12, 15, 9, 11, '#b8b0a0'); P.ell(12, 15, 9, 11, '#c8c0b0');
  P.ell(9, 10, 3, 3, light('#c8c0b0', 0.3));
  for (const [x, y] of [[6, 18], [15, 12], [12, 22], [17, 19]]) P.ell(x, y, 1.6, 1.6, col);
  P.shade(); P.outline();
  return P.toCanvas();
}
