// 🎨 스톤몬스터 도트 그래픽 - 전부 코드로 그리는 절차적 픽셀아트 (외부 이미지 없음)
// 스톤몬: 체형(arch) 18종 + 흡수한 유전자에 따라 날개·번개가시·불꽃·지느러미 등 변이 부위가 덧붙는다.
import { SPECIES, ELEMENTS } from './data';
import { partsOf, dominantGene, sizeOf } from './monster';

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

// ── 스톤몬 체형 18종 (오른쪽을 바라봄, 56x56 좌표) ──
const BONE = '#f0e8d0';
const ARCH = {
  rex: {
    a: { back: [[18, 24], [24, 21], [30, 20]], head: [40, 11], tail: [2, 39], mouth: [50, 20], body: [26, 30, 10, 8] },
    body(P, c) {
      P.tri(18, 23, 18, 35, 1, 40, c.b); P.line(18, 29, 3, 38, c.b, 2.5);
      P.ell(21, 40, 4, 5, c.d); P.rect(19, 42, 4, 8, c.d); P.rect(19, 49, 7, 2, c.d);
      P.ell(26, 30, 11, 9, c.b); P.ell(28, 33, 8, 5, c.u);
      P.ell(27, 39, 5, 6, c.b); P.rect(25, 43, 4, 7, c.b); P.rect(25, 49, 8, 2, c.b);
      P.ell(34, 24, 5, 6, c.b);
      P.ell(40, 16, 8, 6, c.b); P.ell(46, 17, 5, 4, c.b); P.rect(38, 20, 12, 3, c.u);
      P.line(35, 30, 38, 33, c.b, 1);
    },
    detail(P, c) {
      P.set(43, 13, '#fff'); P.set(43, 14, '#111'); P.set(44, 14, '#111'); P.set(49, 15, c.d);
      P.line(38, 19, 50, 19, OUTLINE);
      for (let x = 40; x <= 50; x += 2) P.set(x, 20, '#fff');
      for (let x = 21; x <= 31; x += 4) P.set(x, 23, c.a);
    },
  },
  trike: {
    a: { back: [[14, 24], [22, 23], [30, 24]], head: [42, 22], tail: [1, 40], mouth: [53, 34], body: [24, 32, 13, 8] },
    body(P, c) {
      P.tri(14, 29, 14, 38, 0, 40, c.b);
      P.rect(13, 38, 5, 12, c.d); P.rect(31, 38, 5, 12, c.d);
      P.ell(24, 32, 14, 9, c.b); P.ell(24, 37, 11, 4, c.u);
      P.rect(17, 38, 5, 13, c.b); P.rect(35, 38, 5, 13, c.b);
      P.ell(38, 24, 7, 11, c.a); P.ell(38, 25, 5, 8, mix(c.a, c.b, 0.4));
      P.ell(44, 31, 7, 6, c.b); P.tri(48, 29, 54, 34, 48, 37, '#d8c8a0');
      P.tri(39, 25, 42, 27, 49, 15, light(BONE, 0)); P.tri(42, 25, 45, 27, 53, 17, BONE);
      P.tri(49, 29, 51, 30, 52, 24, BONE);
    },
    detail(P, c) {
      P.set(45, 29, '#111'); P.set(46, 29, '#111'); P.set(45, 28, '#fff');
      for (let i = 0; i < 5; i++) P.set(33 + (i % 2) * 2, 16 + i * 4, light(c.a, 0.4));
      P.line(49, 35, 53, 34, OUTLINE);
    },
  },
  sauro: {
    a: { back: [[14, 28], [22, 27], [30, 29]], head: [43, 4], tail: [1, 46], mouth: [50, 10], body: [22, 36, 12, 8] },
    body(P, c) {
      P.line(12, 36, 1, 46, c.b, 3); P.line(1, 46, -1, 48, c.b, 1);
      P.rect(11, 40, 5, 11, c.d); P.rect(29, 40, 5, 11, c.d);
      P.ell(22, 36, 13, 9, c.b); P.ell(22, 40, 10, 4, c.u);
      P.rect(15, 41, 5, 11, c.b); P.rect(33, 41, 5, 11, c.b);
      P.line(31, 32, 41, 11, c.b, 3.5);
      P.ell(44, 9, 6, 4, c.b);
    },
    detail(P, c) {
      P.set(46, 7, '#111'); P.set(45, 7, '#fff'); P.line(46, 11, 50, 11, OUTLINE);
      for (let i = 0; i < 4; i++) P.set(15 + i * 5, 31 + (i % 2), c.a);
      P.set(35, 24, c.a); P.set(38, 18, c.a);
    },
  },
  ptero: {
    a: { back: [[24, 25], [28, 24], [32, 25]], head: [36, 18], tail: [20, 36], mouth: [52, 24], body: [28, 30, 6, 6] },
    body(P, c) {
      P.tri(25, 27, 2, 8, 21, 33, c.d); P.line(25, 27, 2, 8, dark(c.d, 0.2), 1);
      P.line(26, 35, 24, 43, c.d, 1); P.line(30, 35, 31, 43, c.d, 1);
      P.ell(28, 30, 6, 6, c.b); P.ell(29, 32, 4, 4, c.u);
      P.tri(29, 27, 16, 1, 37, 31, c.b); P.tri(29, 28, 19, 6, 34, 31, light(c.b, 0.25));
      P.ell(37, 22, 4, 3, c.b); P.tri(34, 21, 22, 13, 36, 19, c.a); P.tri(39, 20, 54, 24, 39, 24, c.a);
    },
    detail(P, c) {
      P.set(38, 21, '#111'); P.set(38, 20, '#fff'); P.line(40, 23, 52, 24, dark(c.a, 0.4));
      P.line(29, 27, 16, 1, dark(c.b, 0.35));
    },
  },
  raptor: {
    a: { back: [[19, 25], [24, 23], [29, 23]], head: [38, 13], tail: [1, 21], mouth: [47, 18], body: [25, 29, 8, 5] },
    body(P, c, sp) {
      P.line(18, 28, 2, 22, c.b, 2.5); P.line(2, 22, 0, 21, c.b, 1);
      P.line(22, 32, 20, 40, c.d, 2); P.line(20, 40, 23, 48, c.d, 1.5); P.rect(21, 48, 5, 2, c.d);
      P.ell(25, 29, 9, 6, c.b); P.ell(27, 31, 6, 3, c.u);
      P.line(26, 32, 25, 40, c.b, 2.5); P.line(25, 40, 28, 48, c.b, 1.5); P.rect(26, 48, 6, 2, c.b);
      if (sp.id === 7) { P.ell(33, 18, 5, 6, c.a); P.ell(33, 18, 3, 4, light(c.a, 0.35)); }
      P.line(31, 26, 36, 19, c.b, 2.5);
      P.ell(39, 17, 5, 3.5, c.b); P.ell(43, 18, 4, 2.5, c.b);
      P.line(32, 28, 35, 32, c.b, 1);
    },
    detail(P, c) {
      P.set(40, 16, '#111'); P.set(40, 15, '#fff'); P.line(41, 19, 46, 19, OUTLINE);
      P.set(31, 47, BONE); P.set(32, 46, BONE);
      for (let i = 0; i < 4; i++) P.set(19 + i * 3, 25 - (i > 1 ? 1 : 0), c.a);
    },
  },
  pachy: {
    a: { back: [[18, 25], [24, 23], [30, 24]], head: [38, 13], tail: [3, 30], mouth: [47, 25], body: [25, 31, 9, 7] },
    body(P, c) {
      P.line(18, 30, 3, 31, c.b, 2.5);
      P.line(22, 34, 21, 42, c.d, 2.5); P.rect(19, 43, 4, 6, c.d); P.rect(19, 48, 6, 2, c.d);
      P.ell(25, 31, 10, 8, c.b); P.ell(27, 34, 7, 4, c.u);
      P.line(28, 35, 28, 42, c.b, 2.5); P.rect(26, 43, 4, 6, c.b); P.rect(26, 48, 7, 2, c.b);
      P.ell(32, 26, 4, 5, c.b);
      P.ell(38, 21, 7, 7, c.b); P.ell(38, 18, 6, 4.5, c.a); P.ell(44, 24, 3.5, 3, c.b);
      P.line(33, 31, 36, 33, c.b, 1);
    },
    detail(P, c) {
      P.set(41, 22, '#111'); P.set(41, 21, '#fff'); P.line(43, 26, 47, 25, OUTLINE);
      for (const [x, y] of [[32, 19], [33, 16], [36, 14], [40, 14], [43, 16], [44, 19]]) P.set(x, y, BONE);
    },
  },
  stego: {
    a: { back: [[18, 27], [26, 26], [34, 28]], head: [44, 33], tail: [1, 30], mouth: [48, 39], body: [26, 35, 14, 8] },
    body(P, c) {
      for (let i = 0; i < 5; i++) {
        const x = 14 + i * 6, hgt = [6, 9, 11, 9, 6][i];
        P.tri(x - 3.5, 30, x + 3.5, 30, x, 26 - hgt, c.a);
      }
      P.tri(12, 31, 12, 38, 0, 30, c.b);
      P.tri(1, 30, 4, 30, 0, 23, BONE); P.tri(5, 31, 8, 32, 5, 24, BONE);
      P.rect(14, 40, 5, 11, c.d); P.rect(32, 40, 5, 11, c.d);
      P.ell(26, 35, 15, 9, c.b); P.ell(26, 40, 11, 4, c.u);
      P.rect(18, 41, 5, 11, c.b); P.rect(36, 41, 5, 11, c.b);
      P.ell(39, 36, 4, 4, c.b); P.ell(44, 38, 5, 3.5, c.b);
    },
    detail(P, c) {
      P.set(45, 37, '#111'); P.set(45, 36, '#fff'); P.line(46, 40, 49, 39, OUTLINE);
      for (let i = 0; i < 5; i++) P.set(14 + i * 6, 23 - [3, 6, 8, 6, 3][i] + 4, light(c.a, 0.4));
    },
  },
  ankylo: {
    a: { back: [[16, 30], [26, 29], [36, 31]], head: [44, 34], tail: [2, 36], mouth: [49, 40], body: [26, 37, 15, 7] },
    body(P, c) {
      P.line(12, 38, 3, 36, c.b, 2); P.ell(3, 36, 4, 3.5, c.a);
      P.rect(14, 41, 5, 9, c.d); P.rect(32, 41, 5, 9, c.d);
      P.ell(26, 37, 16, 8, c.b); P.ell(26, 41, 12, 3, c.u);
      for (let i = 0; i < 6; i++) P.tri(13 + i * 5, 41, 16 + i * 5, 41, 14.5 + i * 5, 46, BONE);
      P.rect(18, 42, 5, 9, c.b); P.rect(36, 42, 5, 9, c.b);
      P.ell(44, 39, 5, 4, c.b); P.tri(41, 35, 43, 35, 40, 31, BONE);
    },
    detail(P, c) {
      P.set(46, 38, '#111'); P.set(46, 37, '#fff'); P.line(46, 41, 49, 40, OUTLINE);
      for (let y = 31; y <= 39; y += 4) for (let x = 14; x <= 38; x += 5) if (P.has(x, y)) P.set(x + ((y / 4) % 2) * 2, y, light(c.a, 0.25));
    },
  },
  dimetro: {
    a: { back: [[18, 24], [24, 21], [30, 24]], head: [40, 34], tail: [0, 44], mouth: [48, 41], body: [25, 40, 12, 4] },
    body(P, c) {
      P.ell(24, 32, 11, 13, c.a);
      P.line(12, 40, 0, 44, c.b, 2);
      P.line(16, 42, 13, 48, c.d, 1.5); P.line(32, 42, 30, 48, c.d, 1.5);
      P.ell(25, 40, 13, 5, c.b); P.ell(25, 43, 10, 2, c.u);
      P.line(20, 42, 18, 49, c.b, 1.5); P.line(35, 42, 37, 49, c.b, 1.5);
      P.ell(40, 39, 6, 4, c.b); P.ell(45, 40, 3.5, 3, c.b);
    },
    detail(P, c) {
      for (let x = 16; x <= 32; x += 4) P.line(x, 35, 24 + (x - 24) * 1.3, 21 + Math.abs(x - 24) * 0.35, dark(c.a, 0.35));
      P.set(42, 37, '#111'); P.set(42, 36, '#fff'); P.line(42, 41, 48, 41, OUTLINE);
      for (let x = 43; x <= 47; x += 2) P.set(x, 42, '#fff');
    },
  },
  spino: {
    a: { back: [[16, 20], [24, 13], [30, 18]], head: [38, 14], tail: [2, 40], mouth: [52, 20], body: [26, 31, 9, 7] },
    body(P, c) {
      P.ell(24, 22, 10, 11, c.a);
      P.line(18, 32, 2, 40, c.b, 3);
      P.ell(22, 40, 4, 5, c.d); P.rect(20, 42, 4, 8, c.d); P.rect(20, 49, 7, 2, c.d);
      P.ell(26, 31, 10, 8, c.b); P.ell(28, 34, 7, 4, c.u);
      P.ell(28, 39, 5, 6, c.b); P.rect(26, 43, 4, 7, c.b); P.rect(26, 49, 8, 2, c.b);
      P.ell(33, 25, 4, 5, c.b);
      P.ell(38, 19, 5, 4, c.b); P.rect(40, 17, 13, 3, c.b); P.rect(40, 20, 12, 2, c.u);
      P.line(34, 30, 37, 34, c.b, 1);
    },
    detail(P, c) {
      for (let x = 16; x <= 32; x += 4) P.line(x, 30, 24 + (x - 24) * 1.2, 12, dark(c.a, 0.3));
      P.set(39, 17, '#111'); P.set(39, 16, '#fff'); P.line(41, 19, 52, 19, OUTLINE);
      for (let x = 42; x <= 52; x += 2) P.set(x, 20, '#fff');
    },
  },
  mammoth: {
    a: { back: [[14, 20], [22, 15], [30, 18]], head: [38, 15], tail: [9, 32], mouth: [46, 46], body: [24, 30, 14, 11] },
    body(P, c) {
      P.rect(11, 36, 6, 14, c.d); P.rect(27, 36, 6, 14, c.d);
      P.ell(24, 30, 15, 13, c.b); P.ell(22, 19, 8, 5, c.b); P.ell(25, 37, 11, 5, c.u);
      P.rect(15, 38, 7, 14, c.b); P.rect(31, 38, 7, 14, c.b);
      P.ell(38, 26, 8, 9, c.b); P.ell(34, 26, 4, 6, c.d);
      P.line(43, 30, 46, 40, c.b, 2.5); P.line(46, 40, 44, 48, c.b, 2);
      P.line(41, 34, 49, 38, c.a, 1.5); P.line(49, 38, 53, 31, c.a, 1.2);
    },
    detail(P, c) {
      P.set(41, 23, '#111'); P.set(41, 22, '#fff');
      const r = seeded(29);
      for (let i = 0; i < 24; i++) { const x = 12 + r() * 26, y = 20 + r() * 24; if (P.has(x, y)) P.line(x, y, x - 1, y + 2, dark(c.b, 0.25)); }
    },
  },
  saber: {
    a: { back: [[16, 26], [24, 25], [32, 26]], head: [42, 19], tail: [4, 22], mouth: [48, 31], body: [26, 32, 12, 6] },
    body(P, c) {
      P.line(13, 29, 7, 26, c.b, 1.5); P.line(7, 26, 4, 20, c.b, 1.5);
      P.rect(13, 34, 4, 15, c.d); P.rect(29, 34, 4, 15, c.d);
      P.ell(26, 32, 13, 7, c.b); P.ell(26, 35, 9, 3, c.u);
      P.rect(17, 35, 4, 15, c.b); P.rect(33, 35, 4, 15, c.b); P.rect(17, 49, 5, 2, c.b); P.rect(33, 49, 5, 2, c.b);
      P.tri(37, 22, 39, 16, 42, 21, c.b); P.ell(42, 26, 7, 6, c.b); P.ell(47, 28, 3.5, 3, c.u);
    },
    detail(P, c) {
      P.set(45, 24, '#111'); P.set(44, 24, '#ffe04a'); P.set(49, 27, '#111');
      P.line(45, 31, 45, 38, '#fff8e8'); P.line(46, 31, 46, 37, '#fff8e8'); P.line(48, 31, 48, 36, '#fff8e8');
      for (let x = 18; x <= 32; x += 4) P.line(x, 26, x + 1, 30, dark(c.b, 0.3));
    },
  },
  plesio: {
    a: { back: [[16, 30], [24, 29], [30, 30]], head: [44, 8], tail: [2, 40], mouth: [50, 14], body: [24, 36, 11, 6] },
    body(P, c) {
      P.tri(16, 38, 24, 38, 12, 48, c.d); P.tri(30, 38, 36, 38, 35, 48, c.d);
      P.tri(14, 33, 14, 40, 2, 40, c.b);
      P.ell(24, 36, 12, 7, c.b); P.ell(24, 40, 9, 3, c.u);
      P.line(32, 33, 42, 14, c.b, 3);
      P.ell(45, 13, 5, 3.5, c.b);
      P.tri(18, 40, 26, 40, 16, 51, c.b); P.tri(32, 40, 38, 40, 39, 51, c.b);
    },
    detail(P, c) {
      P.set(46, 11, '#111'); P.set(46, 10, '#fff'); P.line(46, 15, 50, 14, OUTLINE); P.set(48, 16, '#fff');
      for (let i = 0; i < 4; i++) P.set(16 + i * 5, 32, c.a);
    },
  },
  shark: {
    a: { back: [[18, 22], [26, 20], [34, 22]], head: [44, 23], tail: [1, 18], mouth: [52, 32], body: [28, 30, 17, 7] },
    body(P, c) {
      P.tri(22, 23, 31, 23, 21, 11, c.b);
      P.tri(11, 30, 0, 17, 5, 30, c.b); P.tri(11, 30, 0, 43, 5, 30, c.b);
      P.ell(28, 30, 19, 8, c.b); P.ell(31, 34, 15, 4, c.u); P.ell(46, 31, 7, 6, c.b); P.ell(47, 34, 6, 3, c.u);
      P.tri(30, 34, 39, 35, 28, 45, c.d);
    },
    detail(P, c) {
      P.set(45, 28, '#111'); P.set(45, 27, '#fff');
      P.line(40, 34, 53, 32, OUTLINE);
      for (let x = 41; x <= 52; x += 2) { P.set(x, 33, '#fff'); P.set(x + 1, 35 - (x > 46 ? 1 : 0), '#fff'); }
      for (let x = 36; x <= 40; x += 2) P.line(x, 27, x - 1, 31, dark(c.b, 0.3));
      P.set(14, 24, c.a); P.set(20, 26, c.a); P.set(26, 25, c.a);
    },
  },
  ammo: {
    a: { back: [[14, 18], [24, 15], [32, 18]], head: [36, 30], tail: [10, 32], mouth: [44, 40], body: [24, 30, 12, 12] },
    body(P, c) {
      for (const [tx, ty] of [[49, 44], [47, 48], [43, 50], [38, 50]]) P.line(36, 38, tx, ty, c.u, 1.5);
      P.ell(24, 30, 14, 14, c.b); P.ell(24, 30, 10, 10, c.u); P.ell(24, 30, 7, 7, c.b); P.ell(23, 29, 3.5, 3.5, c.u); P.ell(23, 29, 1.5, 1.5, c.b);
      P.ell(37, 36, 6, 6, c.u);
    },
    detail(P, c) {
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; P.line(24 + Math.cos(a) * 11, 30 + Math.sin(a) * 11, 24 + Math.cos(a) * 14, 30 + Math.sin(a) * 14, c.a); }
      P.set(39, 34, '#111'); P.set(40, 34, '#111'); P.set(39, 33, '#fff');
    },
  },
  trilo: {
    a: { back: [[18, 30], [28, 29], [38, 30]], head: [44, 30], tail: [10, 38], mouth: [50, 40], body: [28, 38, 16, 7] },
    body(P, c) {
      for (let x = 14; x <= 44; x += 4) P.line(x, 42, x - 2, 48, c.d, 1);
      P.line(47, 34, 54, 25, c.a, 1); P.line(47, 36, 55, 32, c.a, 1);
      P.ell(28, 38, 18, 9, c.b); P.ell(28, 38, 18, 3, light(c.b, 0.15)); P.ell(43, 38, 7, 8, c.u);
    },
    detail(P, c) {
      for (let x = 14; x <= 36; x += 4) P.line(x, 30, x, 46, dark(c.b, 0.3));
      P.set(45, 33, '#111'); P.set(46, 33, '#111'); P.set(45, 32, '#ffe04a');
    },
  },
  golem: {
    a: { back: [[18, 20], [26, 18], [34, 20]], head: [29, 9], tail: [14, 40], mouth: [34, 18], body: [27, 30, 12, 11] },
    body(P, c) {
      P.ell(13, 33, 5, 8, c.d);
      P.rect(17, 40, 7, 11, c.d); P.rect(17, 49, 8, 2, c.d);
      P.ell(27, 30, 13, 12, c.b); P.ell(21, 24, 5, 4, light(c.b, 0.12)); P.ell(32, 35, 6, 5, dark(c.b, 0.08));
      P.rect(29, 40, 7, 11, c.b); P.rect(29, 49, 9, 2, c.b);
      P.ell(29, 15, 7, 6, c.b);
      P.ell(42, 33, 5, 8, c.b); P.ell(43, 41, 4, 3, c.b);
      P.tri(25, 30, 31, 30, 28, 23, c.a); P.tri(25, 30, 31, 30, 28, 36, dark(c.a, 0.2));
    },
    detail(P, c) {
      P.rect(31, 13, 2, 2, c.a); P.rect(35, 13, 2, 2, c.a); P.line(31, 18, 35, 18, OUTLINE);
      P.set(27, 26, light(c.a, 0.6));
      const r = seeded(16);
      for (let i = 0; i < 10; i++) { const x = 16 + r() * 22, y = 20 + r() * 20; if (P.has(x, y)) P.line(x, y, x + 2, y + 1, dark(c.b, 0.3)); }
    },
  },
  bug: {
    a: { back: [[20, 24], [28, 24], [32, 25]], head: [37, 24], tail: [3, 30], mouth: [41, 32], body: [22, 30, 14, 3] },
    body(P, c) {
      const w = mix(c.a, '#ffffff', 0.55);
      P.ell(22, 19, 13, 4, w); P.ell(25, 14, 13, 3.5, light(w, 0.2));
      P.line(28, 33, 26, 40, c.d, 1); P.line(31, 33, 32, 40, c.d, 1); P.line(33, 33, 37, 39, c.d, 1);
      P.line(4, 30, 26, 30, c.b, 2); P.ell(30, 30, 5, 4, c.b); P.ell(37, 30, 4, 4, c.b); P.ell(39, 28, 3, 3, c.a);
    },
    detail(P, c) {
      for (let x = 6; x <= 24; x += 3) P.set(x, 30, dark(c.b, 0.35));
      P.set(40, 27, '#fff'); P.line(15, 19, 33, 19, dark(c.a, 0.2)); P.line(16, 14, 36, 14, dark(c.a, 0.2));
    },
  },
  moth: {
    a: { back: [[24, 14], [30, 16], [34, 20]], head: [39, 17], tail: [34, 40], mouth: [42, 24], body: [34, 30, 4, 8] },
    body(P, c) {
      P.ell(22, 22, 14, 11, c.b); P.ell(22, 39, 11, 8, c.d);
      P.ell(35, 30, 5, 9, c.u); P.ell(39, 21, 4, 4, c.u);
      P.line(40, 18, 46, 9, c.a, 1); P.line(41, 18, 49, 13, c.a, 1);
    },
    detail(P, c) {
      P.ell(19, 21, 4, 4, c.a); P.ell(19, 21, 2, 2, '#111'); P.set(18, 20, '#fff');
      P.ell(20, 39, 3, 3, c.a); P.ell(20, 39, 1, 1, '#111');
      for (let y = 26; y <= 36; y += 3) P.line(31, y, 39, y, dark(c.u, 0.25));
      P.set(41, 20, '#111');
    },
  },
  scorp: {
    a: { back: [[24, 32], [30, 32], [34, 33]], head: [40, 32], tail: [16, 15], mouth: [48, 34], body: [28, 38, 11, 5] },
    body(P, c) {
      for (let x = 20; x <= 34; x += 4) P.line(x, 41, x - 3, 48, c.d, 1);
      P.ell(28, 38, 12, 6, c.b); P.ell(28, 41, 9, 2, c.u);
      P.ell(17, 34, 3.5, 3.5, c.b); P.ell(13, 28, 3.5, 3.5, c.b); P.ell(13, 21, 3.5, 3.5, c.b); P.ell(17, 15, 3.5, 3.5, c.b);
      P.tri(19, 13, 25, 16, 19, 18, c.a);
      P.line(38, 38, 45, 34, c.b, 1.5); P.ell(48, 32, 4, 3, c.b); P.tri(50, 31, 54, 29, 52, 33, c.b);
    },
    detail(P, c) {
      for (let x = 20; x <= 36; x += 4) P.line(x, 33, x, 43, dark(c.b, 0.3));
      P.set(40, 35, '#111'); P.set(41, 35, '#111'); P.line(50, 32, 52, 31, OUTLINE);
    },
  },
};

// ── 변이 부위 ──
const PART_COL = {
  wind: '#7fe0b8', thunder: '#ffd93d', fire: '#ff6a3d', water: '#3fa9f5',
  ice: '#bff2ff', earth: '#8a7560', poison: '#a24cf0', primal: BONE,
};

function backParts(P, a, parts, c) {
  const [b0, b1, b2] = a.back;
  for (const [el, lv] of Object.entries(parts)) {
    const col = PART_COL[el];
    if (el === 'wind') {
      const wing = (bx, by, s, mc) => {
        const tipX = bx - 8 - 5 * s, tipY = by - 12 - 5 * s;
        P.tri(bx - 3, by + 3, bx + 4, by + 1, tipX, tipY, mc);
        P.tri(bx - 3, by + 3, tipX, tipY, bx - 14 - 5 * s, by - 1 - 2 * s, mc);
        P.line(bx + 4, by + 1, tipX, tipY, dark(mc, 0.45), 1);
        P.line(bx - 3, by + 3, tipX, tipY, dark(mc, 0.2));
      };
      const mem = mix(c.b, col, 0.55);
      if (lv >= 2) wing(b1[0] - 4, b1[1] + 1, lv, dark(mem, 0.25));
      wing(b1[0] + 1, b1[1], lv, mem);
      if (lv >= 3) wing(b0[0], b0[1] + 2, 1, light(mem, 0.2));
    } else if (el === 'thunder') {
      const pts = lv >= 3 ? [b0, b1, b2] : lv >= 2 ? [b0, b2] : [b1];
      for (const [x, y] of pts) {
        const h = 4 + 2 * lv;
        P.tri(x - 2, y + 2, x + 2, y + 2, x + 3, y - h, col);
        P.tri(x + 3, y - h, x + 1, y - h + 1, x - 1, y - h - 4 - lv, col);
      }
    } else if (el === 'water') {
      const [x, y] = b1;
      P.tri(x - 5, y + 2, x + 5, y + 2, x - 3, y - 6 - 3 * lv, col);
      P.tri(x - 3, y + 2, x + 3, y + 2, x - 2, y - 3 - 2 * lv, light(col, 0.35));
    } else if (el === 'ice') {
      const pts = lv >= 3 ? [b0, b1, b2] : lv >= 2 ? [b0, b2] : [b1];
      for (const [x, y] of pts) {
        P.tri(x - 2, y + 2, x + 2, y + 2, x, y - 5 - 3 * lv, col);
        P.line(x, y + 1, x, y - 3 - 2 * lv, '#ffffff');
      }
    } else if (el === 'earth') {
      const pts = lv >= 2 ? [b0, b1, b2] : [b0, b2];
      for (const [x, y] of pts) P.ell(x, y, 2.5 + lv, 1.8 + lv * 0.6, col);
    } else if (el === 'poison') {
      if (lv >= 2) for (const [x, y] of [b0, b1, b2]) P.tri(x - 1.5, y + 2, x + 1.5, y + 2, x - 1, y - 4 - 2 * lv, col);
    } else if (el === 'primal') {
      for (const [x, y] of (lv >= 2 ? [b0, b1, b2] : [b1])) P.tri(x - 2, y + 2, x + 2, y + 2, x - 3, y - 4 - 2 * lv, col);
    } else if (el === 'fire' && lv >= 3) {
      for (const [x, y] of [b0, b1, b2]) { P.ell(x, y - 3, 2.5, 4, '#ff6a3d'); P.ell(x, y - 3, 1.2, 2.5, '#ffd23a'); }
    }
  }
}

function frontParts(P, a, parts) {
  for (const [el, lv] of Object.entries(parts)) {
    if (el === 'fire') {
      const [tx, ty] = a.tail;
      P.ell(tx, ty - 2 - lv, 2 + lv, 3 + lv * 1.3, '#ff6a3d');
      P.ell(tx, ty - 2 - lv, 1 + lv * 0.6, 2 + lv * 0.8, '#ffb03a');
      P.set(tx, ty - 4 - lv * 2.5, '#ffe9a0');
      if (lv >= 2) {
        const [hx, hy] = a.head;
        P.tri(hx - 6, hy + 4, hx - 1, hy + 3, hx - 5, hy - 3 - lv, '#ff6a3d');
        P.tri(hx - 4, hy + 4, hx - 1, hy + 3, hx - 3, hy - 1 - lv, '#ffb03a');
      }
    } else if (el === 'earth' && lv >= 2) {
      const [hx, hy] = a.head;
      P.tri(hx - 1, hy + 3, hx + 3, hy + 3, hx + 3, hy - 3 - 2 * (lv - 1), '#9a8a78');
    } else if (el === 'water' && lv >= 2) {
      const [tx, ty] = a.tail;
      P.tri(tx + 2, ty, tx - 3 - lv, ty - 5 - lv, tx - 3 - lv, ty + 5 + lv, '#3fa9f5');
    } else if (el === 'primal' && lv >= 3) {
      const [hx, hy] = a.head;
      for (let i = -1; i <= 1; i++) P.tri(hx + i * 3 - 1, hy + 2, hx + i * 3 + 1, hy + 2, hx + i * 3, hy - 4, BONE);
    }
  }
}

function detailParts(P, a, parts, seed) {
  const r = seeded(seed + 7);
  const [cx, cy, rx, ry] = a.body;
  const inBody = () => {
    for (let k = 0; k < 20; k++) {
      const x = cx + (r() * 2 - 1) * rx, y = cy + (r() * 2 - 1) * ry;
      if (P.has(x, y)) return [x, y];
    }
    return [cx, cy];
  };
  for (const [el, lv] of Object.entries(parts)) {
    if (el === 'poison') {
      for (let i = 0; i < 2 + lv * 2; i++) { const [x, y] = inBody(); P.rect(x, y, 2, 2, '#a24cf0'); P.set(x, y, '#d9a8ff'); }
      if (lv >= 3) { const [mx, my] = a.mouth; P.line(mx - 1, my + 1, mx - 1, my + 5, '#a24cf0'); P.set(mx - 1, my + 6, '#d9a8ff'); }
    } else if (el === 'thunder') {
      for (let i = 0; i < 2 + lv * 2; i++) {
        const ang = r() * Math.PI * 2, d = 1.1 + r() * 0.3;
        P.set(cx + Math.cos(ang) * rx * d * 1.3, cy + Math.sin(ang) * ry * d * 1.5, '#fff27a');
      }
      for (let i = 0; i < lv; i++) { const [x, y] = inBody(); P.line(x, y, x + 2, y + 2, '#ffd93d'); P.line(x + 2, y + 2, x + 1, y + 4, '#ffd93d'); }
    } else if (el === 'ice') {
      for (let i = 0; i < lv * 3; i++) { const [x, y] = inBody(); P.set(x, y, '#ffffff'); }
    } else if (el === 'water' && lv >= 3) {
      for (let i = 0; i < 3; i++) { const x = cx + rx + 3 + i * 2, y = cy - 6 - i * 4; P.set(x, y, '#bfe6ff'); P.set(x + 1, y, '#bfe6ff'); }
    } else if (el === 'primal') {
      for (let i = 0; i < lv; i++) { const [x, y] = inBody(); P.line(x, y, x + 3, y - 2, '#7a2a2a'); }
    } else if (el === 'fire' && lv >= 2) {
      for (let i = 0; i < lv * 2; i++) P.set(cx + (r() * 2 - 1) * rx, cy - ry - 3 - r() * 6, '#ffb03a');
    } else if (el === 'earth') {
      for (let i = 0; i < lv * 2; i++) { const [x, y] = inBody(); P.rect(x, y, 2, 1, '#8a7560'); }
    }
  }
}

// 몬스터 스프라이트 (64x64 캔버스, 캐시)
const cache = new Map();
export function monSprite(m, { silhouette = false, white = false } = {}) {
  const sp = SPECIES[m.sid];
  const parts = m.genes ? partsOf(m) : {};
  const dom = m.genes ? dominantGene(m) : null;
  const tint = dom && dom !== sp.el ? Math.min(0.4, (m.genes[dom] || 0) / 45) : 0;
  const key = `${m.sid}|${JSON.stringify(parts)}|${dom}|${tint.toFixed(2)}|${silhouette}|${white}`;
  if (cache.has(key)) return cache.get(key);
  const P = new PixBuf(64, 64, 4, 6);
  const [body, belly, acc] = sp.pal;
  const b = tint ? mix(body, ELEMENTS[dom].color, tint) : body;
  const c = { b, d: dark(b, 0.22), u: belly, a: acc };
  const arch = ARCH[sp.arch];
  backParts(P, arch.a, parts, c);
  arch.body(P, c, sp);
  frontParts(P, arch.a, parts);
  P.shade();
  arch.detail(P, c, sp);
  detailParts(P, arch.a, parts, sp.id * 31);
  if (parts.thunder) { const [hx, hy] = arch.a.head; P.set(hx + 3, hy + 3, '#fff27a'); }
  P.outline();
  if (silhouette) P.recolor('#2a2433');
  if (white) P.recolor('#ffffff');
  const cv = P.toCanvas();
  cache.set(key, cv);
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  return cv;
}
export const monScale = (m) => (m.genes ? sizeOf(m) : SPECIES[m.sid].size);

// 도감/카드용 이미지 URL
const urlCache = new Map();
export function monDataUrl(m, opts = {}, scale = 3) {
  const base = monSprite(m, opts);
  const key = base;
  if (urlCache.has(key) && urlCache.get(key).s === scale) return urlCache.get(key).u;
  const cv = document.createElement('canvas');
  cv.width = 64 * scale; cv.height = 64 * scale;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, cv.width, cv.height);
  const u = cv.toDataURL();
  urlCache.set(key, { u, s: scale });
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
function grassBase(ctx, seed) {
  px(ctx, 0, 0, '#78c850', T, T);
  const r = seeded(seed);
  for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 14); px(ctx, x, y, '#5aa83c'); px(ctx, x, y + 1, '#5aa83c'); }
  for (let i = 0; i < 3; i++) px(ctx, Math.floor(r() * 16), Math.floor(r() * 16), '#98e070');
}
let TILES = null;
export function tiles() {
  if (TILES) return TILES;
  TILES = {
    grass: tileCanvas((c) => grassBase(c, 3)),
    grass2: tileCanvas((c) => grassBase(c, 11)),
    tall: tileCanvas((c) => {
      px(c, 0, 0, '#4f9e3a', T, T);
      for (const [x, y] of [[1, 3], [8, 1], [5, 9], [12, 8], [0, 12], [9, 13]]) {
        px(c, x, y + 2, '#2f6e28', 1, 3); px(c, x + 1, y, '#2f6e28', 1, 5); px(c, x + 2, y + 1, '#2f6e28', 1, 4);
        px(c, x + 1, y, '#8ad868'); px(c, x + 3, y + 1, '#2f6e28', 1, 4);
      }
    }),
    path: tileCanvas((c) => {
      px(c, 0, 0, '#e2cf96', T, T);
      const r = seeded(5);
      for (let i = 0; i < 7; i++) px(c, Math.floor(r() * 15), Math.floor(r() * 15), '#c9b278', 2, 1);
    }),
    water0: tileCanvas((c) => { px(c, 0, 0, '#4a8ae8', T, T); px(c, 2, 4, '#9ccaff', 5, 1); px(c, 9, 11, '#9ccaff', 5, 1); px(c, 12, 2, '#7ab0f8', 3, 1); }),
    water1: tileCanvas((c) => { px(c, 0, 0, '#4a8ae8', T, T); px(c, 4, 4, '#9ccaff', 5, 1); px(c, 7, 11, '#9ccaff', 5, 1); px(c, 1, 8, '#7ab0f8', 3, 1); }),
    tree: tileCanvas((c) => {
      grassBase(c, 7);
      px(c, 6, 11, '#6a4424', 4, 5); px(c, 7, 11, '#8a5a30', 1, 5);
      c.fillStyle = '#1e4e26'; c.beginPath(); c.arc(8, 7, 7.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2f7a3a'; c.beginPath(); c.arc(8, 7, 6.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#4aa050'; c.beginPath(); c.arc(6, 5, 3.5, 0, Math.PI * 2); c.fill();
      px(c, 4, 3, '#7acc6a', 2, 1); px(c, 10, 9, '#24602e', 2, 2);
    }),
    palm: tileCanvas((c) => {
      grassBase(c, 9);
      px(c, 7, 6, '#8a5a30', 2, 10); px(c, 7, 8, '#6a4424', 2, 1); px(c, 7, 12, '#6a4424', 2, 1);
      c.fillStyle = '#2f8a3a';
      for (const [dx, dy] of [[-6, 2], [6, 2], [-4, -3], [4, -3], [0, -5]]) { c.beginPath(); c.ellipse(8 + dx / 2, 5 + dy / 2, 4, 1.6, Math.atan2(dy, dx), 0, Math.PI * 2); c.fill(); }
      px(c, 6, 5, '#7a4a20', 2, 2);
    }),
    flower: tileCanvas((c) => {
      grassBase(c, 13);
      for (const [x, y, col] of [[3, 3, '#ff6a8a'], [10, 5, '#ffe04a'], [6, 11, '#ff6a8a'], [12, 12, '#ffffff']]) {
        px(c, x, y, col); px(c, x - 1, y, col); px(c, x + 1, y, col); px(c, x, y - 1, col); px(c, x, y + 1, col); px(c, x, y, '#ffb03a');
      }
    }),
    rock: tileCanvas((c) => {
      grassBase(c, 17);
      c.fillStyle = '#3a3440'; c.beginPath(); c.ellipse(8, 9, 7, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#8a8890'; c.beginPath(); c.ellipse(8, 9, 6, 5, 0, 0, Math.PI * 2); c.fill();
      px(c, 4, 6, '#b8b6c0', 4, 2); px(c, 9, 11, '#6a6870', 3, 1);
    }),
    fence: tileCanvas((c) => {
      grassBase(c, 19);
      px(c, 0, 6, '#3a2418', 16, 4); px(c, 0, 7, '#a07040', 16, 2);
      for (const x of [1, 9]) { px(c, x, 2, '#3a2418', 5, 13); px(c, x + 1, 3, BONE, 3, 11); px(c, x + 1, 3, '#ffffff', 1, 11); }
    }),
    sign: tileCanvas((c) => {
      grassBase(c, 23);
      px(c, 7, 9, '#6a4424', 2, 6);
      px(c, 2, 3, '#3a2418', 12, 8); px(c, 3, 4, '#c08a50', 10, 6); px(c, 4, 6, '#7a4a20', 8, 1); px(c, 4, 8, '#7a4a20', 6, 1);
    }),
    bones: tileCanvas((c) => {
      px(c, 0, 0, '#e2cf96', T, T);
      px(c, 3, 9, BONE, 8, 2); px(c, 2, 8, BONE, 2, 4); px(c, 10, 8, BONE, 2, 4);
      px(c, 9, 3, '#e8e0c8', 4, 4); px(c, 10, 4, '#3a3440', 1, 1); px(c, 12, 4, '#3a3440', 1, 1);
    }),
  };
  return TILES;
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
  BUILD[type] = cv;
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
