// 🎨 스톤몬스터 v4.0 도트(Pixel Art) 렌더링 엔진
//
// 외부 이미지 없이 100종 전부를 코드로 그린다. (이미지 크롭 오류 · 해상도 불일치 없음)
//  · 도트 매트릭스: 일반 32x32 · 최종 진화/보스(전설) 48x48. 같은 32단위 좌표계의 골격을 해상도에 맞춰 래스터화한다.
//  · 12가지 골격 템플릿: 수각류 · 용각류 · 각룡류 · 익룡 · 수장룡 · 검룡 · 곡룡 · 갑각류 · 고대포유류 · 맹금류 · 파충류 · 신수형
//  · 종마다 [머리 장식 + 등 장식 + 꼬리 형태 + 4단계 명암 팔레트 + 무늬/눈매/체형] 조합 → 100종 모두 다른 스프라이트
//  · 대기(Idle) 2프레임 바운스(숨쉬기): 다리는 고정, 상체만 1px 오르내림 (떠 있는 종은 몸 전체)
//  · 스탯 임계치 각성: 공격(발톱·이빨 강조 + 붉은 투기) · 방어(장갑 도트 + 황금 수호 오라) · 체력(뿔 → 왕관 장식)
//  · 속성 습득: 속성 상징 포인트 컬러(외곽 림 라이트 + 불꽃 갈기 · 빙결 결정 · 번개 문양 …) + 속성 입자 오라
//  · 모든 결과는 Offscreen Canvas 에 캐싱 → 배틀 · 도감에서 매 프레임 drawImage 한 번 (60fps)
//
// 사용: drawMonster(ctx, look, x, y, size, { t, flip }) / monsterCanvas(look, { frame, silhouette, white })
//  look = { sid, atk, def, hp (각성 단계 0~3), els: [습득 속성], shiny, alpha } — monster.js 의 lookOf(m)
import { SPECIES, ELEMENTS, isBigSprite } from '../data.js';

// ───────── 색 유틸 ─────────
const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
function hueRotate(hex, deg) {
  const [r0, g0, b0] = hex2rgb(hex).map((v) => v / 255);
  const mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0), l = (mx + mn) / 2, d = mx - mn;
  if (d < 0.04) return hex;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r0 ? (g0 - b0) / d + (g0 < b0 ? 6 : 0) : mx === g0 ? (b0 - r0) / d + 2 : (r0 - g0) / d + 4;
  h = ((h / 6 + deg / 360) % 1 + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return rgb2hex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
}
// 4단계 명암 램프 [하이라이트, 기본, 그늘, 어둠] — 하이라이트는 따뜻하게, 그늘은 차갑게(색상 이동)
function ramp(c) {
  return [mix(c, '#fff6dc', 0.38), c, mix(c, '#2a1446', 0.32), mix(c, '#120a1c', 0.62)];
}
const INK = '#140e1c';

function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280; if (s <= 0) s += 233279;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ───────── 영역 코드 (팔레트 슬롯) ─────────
const C = {
  B: 1, // 몸
  L: 2, // 먼 쪽 다리·그림자 몸
  U: 3, // 배
  A: 4, // 포인트(볏·골판·무늬)
  H: 5, // 뿔·뼈·발톱
  T: 6, // 이빨 (단색)
  W: 7, // 눈 흰자 (단색)
  P: 8, // 눈동자 (단색)
  M: 9, // 입 안 (단색)
  G: 10, // 황금 (왕관 · 수호 장갑 테두리)
  R: 11, // 붉은 투기 (공격 각성)
  K: 12, // 장갑판 (방어 각성)
  E1: 13, // 습득 속성 1 포인트 컬러
  E2: 14, // 습득 속성 2 포인트 컬러
  F: 15, // 불꽃
  Q: 16, // 얼음 결정
  Y: 17, // 번개
  V: 18, // 잎사귀
  N: 19, // 콧구멍·눈썹 (몸의 어둠 단색)
};
const FLAT = new Set([C.T, C.W, C.P, C.M, C.N]);
const BODYISH = new Set([C.B, C.L, C.U]);

// ───────── 도트 매트릭스 ─────────
// 골격은 32단위 좌표(지면 y=30, 오른쪽을 바라봄)로 정의하고, 해상도 배율 k(32→1, 48→1.5)로 래스터화한다.
class Grid {
  constructor(n) {
    this.n = n; this.k = n / 32; this.c = new Uint8Array(n * n);
    this.sz = 1; // 종별 체형 배율 (지면 중앙 기준)
  }
  tx(x) { return (16 + (x - 16) * this.sz) * this.k; }
  ty(y) { return (30.5 - (30.5 - y) * this.sz) * this.k; }
  get(x, y) { return x < 0 || y < 0 || x >= this.n || y >= this.n ? 0 : this.c[y * this.n + x]; }
  // mode: 'o' 덮어쓰기 · 'u' 빈 곳만(뒤에 깔기) · 'm' 몸 위에만(무늬) · 'f' 칠해진 곳 위에만
  put(x, y, code, mode = 'o') {
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return;
    const i = y * this.n + x, cur = this.c[i];
    if (mode === 'u' && cur) return;
    if (mode === 'm' && !BODYISH.has(cur)) return;
    if (mode === 'f' && !cur) return;
    this.c[i] = code;
  }
  ell(cx, cy, rx, ry, code, mode) {
    const gx = this.tx(cx), gy = this.ty(cy), grx = Math.max(0.5, rx * this.k * this.sz), gry = Math.max(0.5, ry * this.k * this.sz);
    for (let y = Math.floor(gy - gry - 1); y <= Math.ceil(gy + gry + 1); y++)
      for (let x = Math.floor(gx - grx - 1); x <= Math.ceil(gx + grx + 1); x++) {
        const dx = (x + 0.5 - gx) / (grx + 0.2), dy = (y + 0.5 - gy) / (gry + 0.2);
        if (dx * dx + dy * dy <= 1) this.put(x, y, code, mode);
      }
  }
  poly(pts, code, mode) {
    const P = pts.map(([x, y]) => [this.tx(x), this.ty(y)]);
    const minY = Math.floor(Math.min(...P.map((p) => p[1]))), maxY = Math.ceil(Math.max(...P.map((p) => p[1])));
    const minX = Math.floor(Math.min(...P.map((p) => p[0]))), maxX = Math.ceil(Math.max(...P.map((p) => p[0])));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      let inside = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.put(x, y, code, mode);
    }
  }
  // 굵기 w(32단위)의 선. w가 작으면 1px 선
  line(x0, y0, x1, y1, w, code, mode) {
    const len = Math.hypot(this.tx(x1) - this.tx(x0), this.ty(y1) - this.ty(y0));
    const n = Math.max(1, Math.ceil(len * 1.5));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (w * this.k * this.sz <= 1.2) this.put(Math.floor(this.tx(x)), Math.floor(this.ty(y)), code, mode);
      else this.ell(x, y, w / 2, w / 2, code, mode);
    }
  }
  // 굵기가 점점 가늘어지는 선 (꼬리 · 목 · 덩굴)
  taper(pts, w0, w1, code, mode) {
    for (let s = 0; s < pts.length - 1; s++) {
      const [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const t = (s + i / n) / (pts.length - 1);
        const w = w0 + (w1 - w0) * t;
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        if (w * this.k * this.sz <= 1.2) this.put(Math.floor(this.tx(x)), Math.floor(this.ty(y)), code, mode);
        else this.ell(x, y, w / 2, w / 2, code, mode);
      }
    }
  }
  // 고리 (바깥 반지름 r0 ~ 안쪽 반지름 r1 사이만 칠함)
  ring(cx, cy, r0, r1, code, mode) {
    const gx = this.tx(cx), gy = this.ty(cy), R0 = r0 * this.k * this.sz, R1 = r1 * this.k * this.sz;
    for (let y = Math.floor(gy - R0 - 1); y <= Math.ceil(gy + R0 + 1); y++)
      for (let x = Math.floor(gx - R0 - 1); x <= Math.ceil(gx + R0 + 1); x++) {
        const d = Math.hypot(x + 0.5 - gx, y + 0.5 - gy);
        if (d <= R0 + 0.2 && d > R1) this.put(x, y, code, mode);
      }
  }
  // 32단위 좌표의 점 하나 (해상도와 무관하게 1px — 디테일용)
  dot(x, y, code, mode) { this.put(Math.floor(this.tx(x)), Math.floor(this.ty(y)), code, mode); }
  gx(x) { return Math.floor(this.tx(x)); }
  gy(y) { return Math.floor(this.ty(y)); }
}

// ───────── 12가지 골격 템플릿 ─────────
// 각 템플릿은 몸통을 그리고 장식을 붙일 기준점(anchors)을 돌려준다.
//  o = { b: 상체 바운스(32단위), lb: 다리 바운스, hs: 머리 배율, bs: 몸 배율, parts, big, evo }
//  anchors: head(머리 꼭대기) · hr(머리 반지름) · eye · mouth[시작, 끝] · back[등선 점들] · tail[꼬리 끝] · claws · body[cx,cy,rx,ry] · neck
const leg = (g, x, yTop, yBot, w, code, foot = true) => {
  g.line(x, yTop, x, yBot - 0.6, w, code);
  if (foot) g.ell(x + w * 0.35, yBot - 0.3, w * 0.75, 0.9, code);
};

const SKELETONS = {
  // 수각류: 두 발로 선 육식 공룡 (큰 머리 · 짧은 팔 · 굵은 꼬리)
  theropod(g, o) {
    const { b, hs, bs } = o;
    const snout = o.parts.head === 'snout';
    leg(g, 18.5, 22, 30, 2.2, C.L); // 먼 다리
    g.taper([[12, 18 + b], [7, 16 + b], [2.5, 12.5 + b]], 5.2 * bs, 1.2, C.B); // 꼬리
    g.ell(16, 18 + b, 7 * bs, 6 * bs, C.B); // 몸
    g.ell(18.5, 20.5 + b, 4.2 * bs, 3.4 * bs, C.U, 'm'); // 배
    g.ell(14, 21 + b, 3.6, 4.4, C.B); // 허벅지
    leg(g, 14.5, 23, 30, 2.3, C.B);
    g.line(21, 14 + b, 23, 11 + b, 4 * bs, C.B); // 목
    const hx = 24.5, hy = 9.5 + b, hr = 4.6 * hs;
    g.ell(hx, hy, hr, hr * 0.82, C.B); // 머리
    g.ell(hx + 1.5 * hs, hy + 2.8 * hs, (snout ? 5.6 : 4.4) * hs, 1.9 * hs, C.B); // 턱
    if (snout) g.ell(hx + 5.6 * hs, hy + 2.3 * hs, 2.6 * hs, 1.6 * hs, C.B);
    g.ell(hx + 1.6 * hs, hy + 3.6 * hs, 3.4 * hs, 1.1 * hs, C.U, 'm');
    g.line(21.5, 18 + b, 23.3, 20.2 + b, 1.1, C.B); // 짧은 팔
    const mx0 = hx - 0.5, mx1 = hx + (snout ? 7.5 : 5.2) * hs;
    return {
      head: [hx - 0.5, hy - hr * 0.8], hr, eye: [hx + 1.2 * hs, hy - 0.8 * hs], mouth: [mx0, mx1, hy + 2.6 * hs],
      back: [[9, 15.2 + b], [12, 13 + b], [15, 12 + b], [18, 12.4 + b], [20.5, 13.5 + b]], tail: [2.5, 12.5 + b], tailDir: [-1, -0.6],
      claws: [[23.6, 20.6 + b], [16.5, 30]], body: [16, 18 + b, 7 * bs, 6 * bs], neck: [22, 12.5 + b],
    };
  },
  // 용각류: 긴 목 · 긴 꼬리 · 네 기둥 다리
  sauropod(g, o) {
    const { b, hs, bs } = o;
    leg(g, 11.5, 22, 30, 2.4, C.L); leg(g, 19.5, 22, 30, 2.4, C.L);
    g.taper([[10, 20 + b], [5, 22 + b], [1.2, 23.5 + b]], 4.4 * bs, 1, C.B);
    g.ell(15.5, 19 + b, 8 * bs, 5.6 * bs, C.B);
    g.ell(15.5, 22 + b, 6 * bs, 2.4 * bs, C.U, 'm');
    leg(g, 13.5, 22, 30, 2.6, C.B); leg(g, 21.5, 22, 30, 2.6, C.B);
    const tube = o.parts.head === 'tubeCrest' || o.parts.head === 'crest';
    const ny = tube ? 8 : 6.2;
    g.taper([[21, 17 + b], [24, 11 + b], [26, ny + b]], 3.6 * bs, 2.4, C.B); // 목
    const hx = 27, hy = ny - 1 + b, hr = 3.1 * hs;
    g.ell(hx, hy, hr, hr * 0.8, C.B);
    g.ell(hx + 2.4 * hs, hy + 0.9 * hs, 2.2 * hs, 1.3 * hs, C.B);
    g.ell(hx + 1.4 * hs, hy + 1.8 * hs, 2 * hs, 0.7, C.U, 'm');
    return {
      head: [hx - 0.4, hy - hr * 0.8], hr, eye: [hx + 0.5 * hs, hy - 0.6 * hs], mouth: [hx + 1, hx + 4.4 * hs, hy + 1.4 * hs],
      back: [[9.5, 15 + b], [12.5, 13.8 + b], [15.5, 13.4 + b], [18.5, 13.8 + b], [22.5, 12.5 + b], [24.5, 9.5 + b]], tail: [1.2, 23.5 + b], tailDir: [-1, 0.3],
      claws: [[14, 30], [22, 30]], body: [15.5, 19 + b, 8 * bs, 5.6 * bs], neck: [24, 11 + b],
    };
  },
  // 각룡류: 큰 머리 · 프릴(방패) · 네 다리 (돔 머리면 프릴 대신 박치기 돔)
  ceratopsian(g, o) {
    const { b, hs, bs } = o;
    const dome = o.parts.head === 'dome' || o.parts.head === 'domeSpikes';
    leg(g, 11, 23, 30, 2.4, C.L); leg(g, 19, 23, 30, 2.4, C.L);
    g.taper([[9.5, 20 + b], [5, 21.2 + b], [2.4, 22.4 + b]], 4 * bs, 1.2, C.B);
    g.ell(14.5, 20 + b, 7.6 * bs, 5.6 * bs, C.B);
    g.ell(14.5, 23 + b, 5.8 * bs, 2.3 * bs, C.U, 'm');
    leg(g, 13, 23, 30, 2.7, C.B); leg(g, 20.5, 23, 30, 2.7, C.B);
    const hx = 23.5, hy = (dome ? 15.5 : 17.5) + b, hr = 4.6 * hs;
    if (!dome) g.ell(hx - 3.2 * hs, hy - 3 * hs, 4 * hs, 5.6 * hs, C.A); // 프릴
    if (!dome) g.ell(hx - 3 * hs, hy - 2.6 * hs, 2.6 * hs, 4 * hs, C.U, 'f');
    g.ell(hx, hy, hr, hr * 0.82, C.B);
    g.poly([[hx + 2 * hs, hy - 0.5 * hs], [hx + 6.4 * hs, hy + 1.6 * hs], [hx + 2.6 * hs, hy + 3.6 * hs]], C.B); // 부리 주둥이
    g.poly([[hx + 4.4 * hs, hy + 0.8 * hs], [hx + 6.6 * hs, hy + 1.8 * hs], [hx + 4.2 * hs, hy + 2.6 * hs]], C.N); // 부리 끝
    if (dome) g.ell(hx - 0.5, hy - hr * 0.55, hr * 0.85, hr * 0.6, C.H);
    return {
      head: [hx - 0.5, hy - hr * 0.82], hr, eye: [hx + 0.6 * hs, hy - 0.6 * hs], mouth: [hx + 1, hx + 4 * hs, hy + 2.4 * hs],
      back: [[8.5, 16 + b], [11.5, 14.8 + b], [14.5, 14.4 + b], [17.5, 15 + b]], tail: [2.4, 22.4 + b], tailDir: [-1, 0.2],
      claws: [[13.6, 30], [21, 30]], body: [14.5, 20 + b, 7.6 * bs, 5.6 * bs], neck: [hx - 3, hy - 2], frill: !dome,
    };
  },
  // 익룡: 넓은 피막 날개 · 긴 부리 · 볏
  pterosaur(g, o) {
    const { b, hs, bs } = o;
    const flap = b; // 날개 끝도 함께 내려간다
    g.poly([[15, 14 + b], [3, 4 + flap * 2], [4.5, 9 + flap], [7, 14 + flap], [13, 19 + b]], C.L); // 먼 날개
    leg(g, 15, 21 + b, 29 + b, 1.4, C.L);
    g.ell(15.5, 17.5 + b, 4.6 * bs, 4.2 * bs, C.B);
    g.ell(16.5, 19 + b, 2.8 * bs, 2.4 * bs, C.U, 'm');
    leg(g, 16.8, 21 + b, 29 + b, 1.6, C.B);
    g.line(11.5, 19.5 + b, 9.5, 21.5 + b, 1.4, C.B); // 짧은 꼬리
    // 앞 날개 (피막 + 날개 손가락 뼈)
    g.poly([[16.5, 14.5 + b], [6, 3 + flap * 2], [9, 9 + flap], [11, 13 + flap], [15, 19 + b]], C.A);
    g.line(16.5, 14.5 + b, 6, 3 + flap * 2, 1, C.H);
    g.taper([[19, 15 + b], [21, 11.5 + b]], 2.6 * bs, 2.2, C.B); // 목
    const hx = 22.5, hy = 10.5 + b, hr = 3.4 * hs;
    g.ell(hx, hy, hr, hr * 0.85, C.B);
    const beak = o.parts.head === 'beak';
    g.poly([[hx + 1.5 * hs, hy - 1.2 * hs], [hx + (beak ? 6 : 9) * hs, hy + 1.6 * hs], [hx + 1.6 * hs, hy + 2.2 * hs]], beak ? C.H : C.B); // 부리
    return {
      head: [hx - 0.6, hy - hr * 0.85], hr, eye: [hx + 0.4 * hs, hy - 0.8 * hs], mouth: [hx + 1.6 * hs, hx + (beak ? 5 : 8) * hs, hy + 1.2 * hs],
      back: [[12.5, 15.5 + b], [15.5, 13.6 + b], [18, 14 + b]], tail: [9.5, 21.5 + b], tailDir: [-1, 0.6],
      claws: [[16.8, 29 + b], [6, 3 + flap * 2]], body: [15.5, 17.5 + b, 4.6 * bs, 4.2 * bs], neck: [20, 13 + b], wings: true, floats: true,
    };
  },
  // 수장룡: 물속 생물 (지느러미 발 4개). 긴 목형 / 큰 턱형(모사사우루스)
  plesiosaur(g, o) {
    const { b, hs, bs } = o;
    const longNeck = o.parts.head === 'longNeck';
    g.poly([[9, 21 + b], [5, 26.5 + b], [8, 27 + b], [11, 22.5 + b]], C.L);
    g.poly([[17, 21 + b], [16, 27 + b], [19, 27 + b], [19.5, 22 + b]], C.L);
    g.taper([[8, 20 + b], [4, 19 + b], [1.4, 17.4 + b]], 4 * bs, 1.2, C.B);
    g.ell(14, 20 + b, 8 * bs, 4.6 * bs, C.B);
    g.ell(14.5, 22.6 + b, 6 * bs, 1.9 * bs, C.U, 'm');
    g.poly([[11, 22 + b], [7.5, 28 + b], [11, 28.4 + b], [13.4, 23 + b]], C.B);
    g.poly([[18.5, 22 + b], [20, 28.2 + b], [23, 27.8 + b], [21, 21.6 + b]], C.B);
    let hx, hy, hr, mouth;
    if (longNeck) {
      g.taper([[20, 18.5 + b], [23, 13 + b], [25, 8.5 + b]], 3 * bs, 2, C.B);
      hx = 26.2; hy = 7.4 + b; hr = 2.8 * hs;
      g.ell(hx, hy, hr, hr * 0.8, C.B);
      g.ell(hx + 2.2 * hs, hy + 0.8 * hs, 2.2 * hs, 1.1 * hs, C.B);
      mouth = [hx + 0.6, hx + 4.2 * hs, hy + 1.2 * hs];
    } else {
      hx = 23.5; hy = 17.4 + b; hr = 4.2 * hs;
      g.ell(hx, hy, hr, hr * 0.78, C.B);
      g.ell(hx + 3.8 * hs, hy + 1 * hs, 4.4 * hs, 1.7 * hs, C.B); // 긴 턱
      g.ell(hx + 3.4 * hs, hy + 2 * hs, 3.4 * hs, 0.8 * hs, C.U, 'm');
      mouth = [hx, hx + 7.6 * hs, hy + 1.1 * hs];
    }
    return {
      head: [hx - 0.6, hy - hr * 0.8], hr, eye: [hx + 0.5 * hs, hy - 0.7 * hs], mouth,
      back: [[8.5, 16 + b], [11.5, 15.6 + b], [14.5, 15.4 + b], [17.5, 15.8 + b]], tail: [1.4, 17.4 + b], tailDir: [-1, -0.3],
      claws: [[9, 28.2 + b], [21.5, 28 + b]], body: [14, 20 + b, 8 * bs, 4.6 * bs], neck: [longNeck ? 23 : 20, longNeck ? 13 : 17 + b], floats: true, teeth: !longNeck,
    };
  },
  // 검룡: 높이 솟은 등 · 작은 머리 · 골판
  stegosaur(g, o) {
    const { b, hs, bs } = o;
    leg(g, 11, 23, 30, 2.6, C.L); leg(g, 19.5, 24, 30, 2.2, C.L);
    g.taper([[9.5, 19 + b], [5, 17 + b], [1.4, 15.2 + b]], 4.4 * bs, 1.2, C.B);
    g.ell(14.5, 19 + b, 7.6 * bs, 6.2 * bs, C.B);
    g.ell(15, 22.5 + b, 5.6 * bs, 2.4 * bs, C.U, 'm');
    leg(g, 13, 23, 30, 2.9, C.B); leg(g, 21, 24, 30, 2.4, C.B);
    g.taper([[20.5, 20 + b], [23, 21 + b]], 2.8 * bs, 2.4, C.B);
    const hx = 24.5, hy = 21 + b, hr = 2.9 * hs;
    g.ell(hx, hy, hr, hr * 0.78, C.B);
    g.ell(hx + 2 * hs, hy + 0.8 * hs, 1.8 * hs, 1.1 * hs, C.B);
    return {
      head: [hx - 0.4, hy - hr * 0.78], hr, eye: [hx + 0.4 * hs, hy - 0.6 * hs], mouth: [hx + 0.6, hx + 3.6 * hs, hy + 1.2 * hs],
      back: [[8.5, 15.2 + b], [11, 13.2 + b], [13.5, 12.4 + b], [16, 12.4 + b], [18.5, 13.4 + b], [20.5, 15.5 + b]], tail: [1.4, 15.2 + b], tailDir: [-1, -0.4],
      claws: [[13.8, 30], [21.6, 30]], body: [14.5, 19 + b, 7.6 * bs, 6.2 * bs], neck: [22, 20.5 + b],
    };
  },
  // 곡룡: 낮고 넓은 갑옷 몸 · 짧은 다리 (등껍질이면 거북형)
  ankylosaur(g, o) {
    const { b, hs, bs } = o;
    leg(g, 10.5, 24, 30, 2.4, C.L); leg(g, 19.5, 24, 30, 2.4, C.L);
    g.taper([[8.5, 22 + b], [4.5, 21.6 + b], [1.6, 21 + b]], 3.4 * bs, 1.4, C.B);
    g.ell(15, 21 + b, 8.6 * bs, 5 * bs, C.B);
    g.ell(15, 24.4 + b, 7 * bs, 1.6 * bs, C.U, 'm');
    leg(g, 12.5, 24, 30, 2.8, C.B); leg(g, 21.5, 24, 30, 2.8, C.B);
    const hx = 24.6, hy = 21.5 + b, hr = 3.4 * hs;
    g.ell(hx, hy, hr, hr * 0.8, C.B);
    g.ell(hx + 2.2 * hs, hy + 0.9 * hs, 2 * hs, 1.3 * hs, C.B);
    return {
      head: [hx - 0.4, hy - hr * 0.8], hr, eye: [hx + 0.6 * hs, hy - 0.6 * hs], mouth: [hx + 0.8, hx + 4 * hs, hy + 1.4 * hs],
      back: [[8.5, 17.6 + b], [11.5, 16.6 + b], [15, 16.1 + b], [18.5, 16.6 + b], [21.5, 17.8 + b]], tail: [1.6, 21 + b], tailDir: [-1, 0],
      claws: [[13.2, 30], [22.2, 30]], body: [15, 21 + b, 8.6 * bs, 5 * bs], neck: [22, 20.5 + b],
    };
  },
  // 갑각류: 나선 껍데기(암모나이트) / 투구 껍데기(투구게·삼엽충)
  crustacean(g, o) {
    const { b, hs, bs } = o;
    if (o.parts.tail === 'spiral') {
      for (let i = 0; i < 4; i++) g.line(19 + i * 1.2, 21 + b, 22 + i * 2, 27.5 + b - (i % 2), 1.3, i % 2 ? C.U : C.B); // 촉수
      g.ell(13.5, 17 + b, 8 * bs, 8 * bs, C.B); // 껍데기
      g.ell(13.5, 17 + b, 5.6 * bs, 5.6 * bs, C.A, 'f');
      g.ell(13.5, 17 + b, 3.6 * bs, 3.6 * bs, C.B, 'f');
      g.ell(13.5, 17 + b, 1.6 * bs, 1.6 * bs, C.A, 'f');
      for (let a = 0; a < 6; a++) { const r = a * 0.7; g.line(13.5, 17 + b, 13.5 + Math.cos(r) * 7.6 * bs, 17 + b + Math.sin(r) * 7.6 * bs, 0.6, C.L, 'f'); }
      const hx = 21, hy = 19 + b, hr = 3.2 * hs;
      g.ell(hx, hy, hr, hr * 0.85, C.U);
      return {
        head: [hx, hy - hr], hr, eye: [hx + 0.6, hy - 0.6], mouth: [hx + 1, hx + 2.6, hy + 1.6],
        back: [[8, 10.5 + b], [12, 9.4 + b], [16, 9.6 + b], [19, 11.5 + b]], tail: [6, 17 + b], tailDir: [-1, 0],
        claws: [[25, 27 + b]], body: [13.5, 17 + b, 8 * bs, 8 * bs], neck: [20, 18 + b], floats: true, noMouth: true,
      };
    }
    for (let i = 0; i < 4; i++) g.line(10 + i * 3.4, 24 + b, 9 + i * 3.4, 28.5, 1, C.H); // 다리
    g.line(9, 23 + b, 1.2, 26 + b, 1.4, C.H); // 꼬리창
    g.ell(15, 22 + b, 10 * bs, 6 * bs, C.B); // 투구
    g.ell(15, 25.6 + b, 8.6 * bs, 1.6 * bs, C.U, 'm');
    g.line(7, 21.5 + b, 23, 21.5 + b, 0.7, C.L, 'f'); g.line(15, 16.5 + b, 15, 26 + b, 0.7, C.L, 'f');
    for (let i = 0; i < 3; i++) g.ell(10 + i * 4.6, 19.5 + b, 1.4, 0.9, C.A, 'f');
    const hx = 22, hy = 19.5 + b;
    return {
      head: [hx, hy - 3], hr: 3, eye: [hx + 0.4, hy - 0.4], mouth: [hx, hx + 2, hy + 3],
      back: [[9, 17.5 + b], [13, 16.2 + b], [17, 16.2 + b], [21, 17.4 + b]], tail: [1.2, 26 + b], tailDir: [-1, 0.3],
      claws: [[9, 28.5]], body: [15, 22 + b, 10 * bs, 6 * bs], neck: [21, 18 + b], noMouth: true,
    };
  },
  // 고대 포유류: 털 · 둥근 머리 · 귀 (매머드 · 검치호 · 늑대 · 고슴도치 …)
  mammal(g, o) {
    const { b, hs, bs } = o;
    leg(g, 11, 23, 30, 2.4, C.L); leg(g, 19.5, 23, 30, 2.4, C.L);
    g.taper([[8.5, 18 + b], [6, 17 + b]], 2.6, 1.6, C.B);
    g.ell(14.5, 19.5 + b, 7.8 * bs, 5.6 * bs, C.B);
    g.ell(15.5, 22.5 + b, 5.4 * bs, 2.4 * bs, C.U, 'm');
    leg(g, 13, 23, 30, 2.7, C.B); leg(g, 21, 23, 30, 2.7, C.B);
    const hx = 23.5, hy = 14.5 + b, hr = 4.4 * hs;
    g.ell(hx, hy, hr, hr * 0.92, C.B);
    g.ell(hx + 3.4 * hs, hy + 1.6 * hs, 2.2 * hs, 1.7 * hs, C.U); // 주둥이
    g.dot(hx + 5.2 * hs, hy + 0.8 * hs, C.N); // 코
    return {
      head: [hx - 0.4, hy - hr * 0.9], hr, eye: [hx + 1 * hs, hy - 0.9 * hs], mouth: [hx + 2.6 * hs, hx + 5 * hs, hy + 2.8 * hs],
      back: [[8.5, 15.4 + b], [11.5, 14.2 + b], [14.5, 13.9 + b], [17.5, 14.2 + b], [20.5, 14.8 + b]], tail: [6, 17 + b], tailDir: [-1, -0.2],
      claws: [[13.6, 30], [21.6, 30]], body: [14.5, 19.5 + b, 7.8 * bs, 5.6 * bs], neck: [20, 15 + b],
    };
  },
  // 맹금류(랩터): 앞으로 기운 날렵한 몸 · 곧은 꼬리 · 낫발톱 · 깃털
  raptor(g, o) {
    const { b, hs, bs } = o;
    leg(g, 17.5, 21, 30, 1.6, C.L);
    g.taper([[11.5, 17.5 + b], [6, 16.4 + b], [0.8, 15.4 + b]], 4 * bs, 1, C.B);
    g.ell(16, 17 + b, 6.2 * bs, 4.2 * bs, C.B);
    g.ell(17.5, 19 + b, 3.8 * bs, 2.2 * bs, C.U, 'm');
    g.ell(14, 19.5 + b, 2.8, 3.4, C.B);
    g.line(14, 21.5 + b, 13.4, 27.5, 1.8, C.B); g.ell(14.6, 29.2, 2, 0.9, C.B);
    g.line(13, 28, 12.2, 26.6, 1, C.H); // 낫발톱
    g.taper([[20.5, 15 + b], [23, 11.5 + b]], 2.8 * bs, 2.4, C.B);
    const hx = 24.5, hy = 9.8 + b, hr = 3.6 * hs;
    const beak = o.parts.head === 'beak', snout = o.parts.head === 'snout';
    g.ell(hx, hy, hr, hr * 0.8, C.B);
    if (beak) g.poly([[hx + 2 * hs, hy - 1.4 * hs], [hx + 5.4 * hs, hy + 0.4 * hs], [hx + 3.6 * hs, hy + 2.6 * hs], [hx + 1.6 * hs, hy + 2 * hs]], C.H);
    else g.ell(hx + 2.8 * hs, hy + 1.2 * hs, (snout ? 4.4 : 3.2) * hs, 1.4 * hs, C.B);
    g.line(20.5, 17.5 + b, 22.6, 20.4 + b, 1.1, C.B);
    return {
      head: [hx - 0.5, hy - hr * 0.8], hr, eye: [hx + 0.6 * hs, hy - 0.6 * hs], mouth: [hx + 0.8, hx + (snout ? 6.8 : 5.6) * hs, hy + 1.6 * hs],
      back: [[9.5, 15 + b], [12.5, 13.6 + b], [15.5, 13 + b], [18.5, 13.6 + b]], tail: [0.8, 15.4 + b], tailDir: [-1, -0.15],
      claws: [[22.8, 20.6 + b], [12.4, 26.8]], body: [16, 17 + b, 6.2 * bs, 4.2 * bs], neck: [22, 13 + b], noTeeth: beak,
    };
  },
  // 파충류: 낮게 엎드린 몸 · 옆으로 벌린 다리 · 긴 주둥이 (악어 · 도마뱀 · 단궁류)
  reptile(g, o) {
    const { b, hs, bs } = o;
    const sprawl = (x, code) => { g.line(x, 24 + b, x + 1.4, 27.4, 1.8, code); g.ell(x + 2, 28.6, 1.8, 0.9, code); };
    sprawl(9.5, C.L); sprawl(18.5, C.L);
    g.taper([[8.5, 22 + b], [4, 23.6 + b], [0.6, 24.4 + b]], 4 * bs, 1, C.B);
    g.ell(14.5, 22 + b, 8 * bs, 3.9 * bs, C.B);
    g.ell(14.5, 24.6 + b, 6.4 * bs, 1.4 * bs, C.U, 'm');
    sprawl(11.5, C.B); sprawl(20.5, C.B);
    const hx = 23.5, hy = 21 + b, hr = 3.4 * hs;
    const snout = o.parts.head === 'snout';
    g.ell(hx, hy, hr, hr * 0.78, C.B);
    g.ell(hx + (snout ? 4.4 : 3) * hs, hy + 1 * hs, (snout ? 4.4 : 3) * hs, 1.5 * hs, C.B);
    return {
      head: [hx - 0.4, hy - hr * 0.78], hr, eye: [hx + 0.4 * hs, hy - 0.8 * hs], mouth: [hx + 0.6, hx + (snout ? 8.4 : 5.6) * hs, hy + 1.2 * hs],
      back: [[8.5, 18.6 + b], [11.5, 18.2 + b], [14.5, 18.1 + b], [17.5, 18.2 + b], [20.5, 18.7 + b]], tail: [0.6, 24.4 + b], tailDir: [-1, 0.2],
      claws: [[13.5, 28.6], [22.5, 28.6]], body: [14.5, 22 + b, 8 * bs, 3.9 * bs], neck: [21, 20 + b],
    };
  },
  // 신수형: 공중에 뜬 위엄 있는 고대 신수 (후광 · 갈기 · 흐르는 꼬리 · 발굽)
  divine(g, o) {
    const { b, hs, bs } = o;
    g.ring(19, 10 + b, 9.4, 8.2, C.G, 'u'); // 후광 링
    g.line(11.5, 22 + b, 10.5, 27 + b, 1.6, C.L); g.line(19, 22 + b, 20, 27 + b, 1.6, C.L);
    g.taper([[9.5, 19 + b], [5.5, 16 + b], [3, 19.5 + b], [1.2, 14 + b]], 3.6 * bs, 1.2, C.B);
    g.ell(15, 18 + b, 7.2 * bs, 5 * bs, C.B);
    g.ell(18.5, 19.5 + b, 3.4 * bs, 3.2 * bs, C.U, 'm');
    g.line(13, 22 + b, 12.4, 27.6 + b, 1.9, C.B); g.line(20.5, 22 + b, 21.6, 27.4 + b, 1.9, C.B);
    g.ell(12.6, 28.2 + b, 1.3, 0.8, C.H); g.ell(21.8, 28 + b, 1.3, 0.8, C.H); // 발굽
    g.taper([[19.5, 15 + b], [22, 10.5 + b]], 3.4 * bs, 2.8, C.B);
    const hx = 23.5, hy = 8 + b, hr = 3.9 * hs;
    g.ell(hx, hy, hr, hr * 0.82, C.B);
    g.ell(hx + 3 * hs, hy + 1.3 * hs, 2.8 * hs, 1.5 * hs, C.B);
    for (let i = 0; i < 4; i++) g.line(20.5 - i * 0.6, 8.5 + b + i * 2.2, 17 - i, 11 + b + i * 2.4, 1.4, C.A); // 갈기
    return {
      head: [hx - 0.5, hy - hr * 0.82], hr, eye: [hx + 0.7 * hs, hy - 0.6 * hs], mouth: [hx + 1, hx + 5.4 * hs, hy + 1.8 * hs],
      back: [[10, 14.4 + b], [13, 13.2 + b], [16, 13 + b], [19, 13.6 + b]], tail: [1.2, 14 + b], tailDir: [-1, -1],
      claws: [[12.6, 28.4 + b], [21.8, 28.2 + b]], body: [15, 18 + b, 7.2 * bs, 5 * bs], neck: [21, 12 + b], floats: true,
    };
  },
};
export const ARCHETYPES = Object.keys(SKELETONS);

// ───────── 등 장식 (몸 뒤에 먼저 깔림) ─────────
function drawBack(g, a, kind, o) {
  const pts = a.back;
  const big = o.big ? 1.2 : 1;
  switch (kind) {
    case 'spines': pts.forEach(([x, y], i) => { const h = (2 + (i % 2)) * big; g.poly([[x - 1.2, y + 1], [x + 0.6, y - h], [x + 1.4, y + 1]], C.A); }); break;
    case 'spikes': pts.forEach(([x, y], i) => { const h = (3.4 + (i % 2) * 1.2) * big; g.poly([[x - 0.8, y + 1], [x + 0.3, y - h], [x + 1, y + 1]], C.H); }); break;
    case 'plates': pts.forEach(([x, y], i) => { const h = (3.4 + (i % 2 ? 1.4 : 0) + (i > 0 && i < pts.length - 1 ? 0.8 : 0)) * big; g.poly([[x - 1.8, y + 1], [x, y - h], [x + 1.8, y + 1], [x, y + 2]], C.A); g.line(x, y - h + 1, x, y, 0.6, C.U, 'f'); }); break;
    case 'sail': {
      const top = pts.map(([x, y], i) => [x, y - (5 + Math.sin((i / (pts.length - 1)) * Math.PI) * 3.5) * big]);
      g.poly([[pts[0][0] - 1, pts[0][1] + 1], ...top, [pts[pts.length - 1][0] + 1, pts[pts.length - 1][1] + 1]], C.A);
      top.forEach(([x, y], i) => g.line(x, y + 0.5, pts[i][0], pts[i][1], 0.6, C.H, 'f'));
      break;
    }
    case 'fins': pts.filter((_, i) => i % 2 === 0).forEach(([x, y]) => g.poly([[x - 2, y + 1], [x - 1.4, y - 2.6 * big], [x + 1.6, y + 1]], C.A)); break;
    case 'dorsal': { const [x, y] = pts[Math.floor(pts.length / 2)]; g.poly([[x - 2.4, y + 1], [x - 1.2, y - 5 * big], [x + 2.4, y + 1]], C.A); break; }
    case 'feathers': pts.forEach(([x, y], i) => { g.line(x, y, x - 1.6, y - 2.2 * big, 1.1, C.A); if (i % 2) g.line(x + 0.6, y, x - 0.4, y - 2.8 * big, 0.9, C.A); }); break;
    case 'wings': if (!a.wings) {
      const [x, y] = pts[Math.min(pts.length - 1, 2)];
      g.poly([[x + 1, y + 1], [x - 9, y - 9 * big], [x - 7, y - 4], [x - 10, y - 2], [x - 5, y + 1], [x - 7, y + 3], [x - 1, y + 3]], C.A);
      g.line(x + 1, y + 1, x - 9, y - 9 * big, 0.9, C.H);
    } break;
    case 'leaves': pts.forEach(([x, y], i) => { if (i % 2 && i !== pts.length - 1) return; g.ell(x - 0.6, y - 1.6, 1.5 * big, 2.4 * big, C.V); g.line(x, y, x - 0.6, y - 3 * big, 0.6, C.L, 'f'); }); break;
    case 'studs': pts.forEach(([x, y]) => g.ell(x, y + 0.3, 1.1 * big, 1.1 * big, C.A)); break;
    case 'crystals': pts.forEach(([x, y], i) => { const h = (2.6 + (i % 2) * 1.6) * big; g.poly([[x - 1, y + 1], [x - 0.3, y - h], [x + 0.5, y - h + 0.6], [x + 1, y + 1]], C.Q); }); break;
    case 'mane': for (let i = 0; i < 5; i++) { const [x, y] = a.neck; g.line(x - i * 1.2, y - 2 + i * 0.8, x - i * 1.2 - 2, y + 1 + i * 0.8, 1.6, C.A); } break;
    default: break;
  }
}
// 등 장식 중 몸 위에 얹는 것 (등껍질 · 갑옷 · 털)
function drawBackOver(g, a, kind, o) {
  const [cx, cy, rx, ry] = a.body;
  switch (kind) {
    case 'shell': {
      g.poly([[cx - rx * 0.95, cy + 0.6], [cx - rx * 0.8, cy - ry * 0.7], [cx - rx * 0.3, cy - ry * 1.06], [cx + rx * 0.3, cy - ry * 1.06], [cx + rx * 0.8, cy - ry * 0.7], [cx + rx * 0.95, cy + 0.6]], C.A);
      for (let i = -1; i <= 1; i++) g.line(cx + i * rx * 0.42, cy - ry * 0.95, cx + i * rx * 0.5, cy + 0.4, 0.6, C.L, 'f');
      g.line(cx - rx * 0.85, cy - ry * 0.35, cx + rx * 0.85, cy - ry * 0.35, 0.6, C.L, 'f');
      g.line(cx - rx * 0.95, cy + 0.8, cx + rx * 0.95, cy + 0.8, 0.8, C.U);
      break;
    }
    case 'armor': {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) g.ell(cx - rx * 0.6 + i * rx * 0.4 + (r ? rx * 0.2 : 0), cy - ry * (0.75 - r * 0.45), 1.2, 0.9, C.A, 'f');
      g.poly([[cx - rx - 0.5, cy + 0.5], [cx - rx - 2, cy - 0.4], [cx - rx + 0.4, cy - 1.4]], C.H);
      g.poly([[cx + rx * 0.7, cy - ry * 0.4], [cx + rx * 0.9, cy - ry - 1.6], [cx + rx * 0.4, cy - ry * 0.7]], C.H);
      break;
    }
    case 'fur': for (let i = 0; i < 7; i++) g.line(cx - rx * 0.8 + i * rx * 0.27, cy - ry * 0.95, cx - rx * 0.8 + i * rx * 0.27 - 1, cy - ry * 0.45, 0.8, C.L, 'f'); break;
    case 'spines': if (o.arch === 'mammal') for (let i = 0; i < 5; i++) g.line(cx - rx * 0.6 + i * rx * 0.3, cy - ry * 0.6, cx - rx * 0.6 + i * rx * 0.3 - 1.4, cy - ry - 1.2, 0.9, C.A); break;
    default: break;
  }
}

// ───────── 꼬리 끝 장식 ─────────
function drawTail(g, a, kind, o) {
  const [x, y] = a.tail, [dx, dy] = a.tailDir;
  const big = o.big ? 1.2 : 1;
  switch (kind) {
    case 'flame':
      g.ell(x - 0.4, y - 1.4, 1.8 * big, 2.4 * big, C.F); g.poly([[x - 2, y - 1.6], [x - 0.6, y - 5.4 * big], [x + 1.2, y - 1.6]], C.F);
      g.ell(x - 0.3, y - 1.2, 0.9, 1.3, C.Y); break;
    case 'club': g.ell(x + 0.4, y, 2.4 * big, 1.8 * big, C.H); g.ell(x + 0.4, y - 0.4, 1.4, 0.9, C.A, 'f'); break;
    case 'fin': g.poly([[x + 1.5, y], [x + dx * 2.4, y - 3.6 * big], [x + dx * 1.2, y], [x + dx * 2.4, y + 3.4 * big]], C.A); break;
    case 'fan': for (let i = -2; i <= 2; i++) g.line(x + 1, y, x + dx * 3.6, y + i * 1.4 * big - 0.6, 1, C.A); break;
    case 'whip': g.taper([[x + 1, y], [x + dx * 2, y + dy * 2 + 1], [x + dx * 3.4, y + dy * 3.4 + 2.4]], 1, 0.6, C.B); break;
    case 'spike': for (let i = 0; i < 2; i++) { const sx = x + 1.4 + i * 2; g.poly([[sx - 0.6, y], [sx - 1.6, y - 3.2 * big], [sx + 0.5, y - 0.4]], C.H); g.poly([[sx - 0.6, y + 0.2], [sx - 1.8, y + 2.6 * big], [sx + 0.5, y + 0.4]], C.H); } break;
    case 'leaf': g.ell(x - 1, y - 0.6, 2.4 * big, 1.4 * big, C.V); g.line(x + 1, y, x - 3, y - 0.8, 0.6, C.L, 'f'); break;
    case 'bolt': g.line(x, y, x - 1.6, y - 2, 1, C.Y); g.line(x - 1.6, y - 2, x - 0.4, y - 3, 1, C.Y); g.line(x - 0.4, y - 3, x - 2.4, y - 5.4 * big, 1, C.Y); break;
    case 'bushy': g.ell(x - 0.6, y - 0.4, 2.4 * big, 1.8 * big, C.B); g.ell(x - 1.6, y - 0.6, 1.2, 1, C.U, 'f'); break;
    default: break;
  }
}

// ───────── 머리 장식 ─────────
function drawHead(g, a, kind, o) {
  const [hx, hy] = a.head, r = a.hr;
  const s = r / 4;
  switch (kind) {
    case 'spikes': for (let i = 0; i < 3; i++) g.poly([[hx - 1.6 - i * 1.4, hy + 1 + i * 0.6], [hx - 2 - i * 1.8, hy - 1.6 * s + i * 0.4], [hx - 0.4 - i * 1.4, hy + 0.6 + i * 0.6]], C.H); break;
    case 'crownHorns':
      g.taper([[hx - 1, hy + 1], [hx - 3.4 * s, hy - 2.6 * s], [hx - 2.4 * s, hy - 5 * s]], 1.8, 0.7, C.H);
      g.taper([[hx + 0.8, hy + 0.6], [hx + 0.2, hy - 3 * s], [hx + 1.6 * s, hy - 4.6 * s]], 1.6, 0.7, C.H); break;
    case 'tripleHorn': {
      const [ex, ey] = a.eye;
      g.taper([[ex, ey - 0.6], [ex + 2.6 * s, ey - 3 * s], [ex + 5.2 * s, ey - 3.6 * s]], 1.4, 0.6, C.H);
      g.taper([[ex - 1, ey - 0.4], [ex + 1.6 * s, ey - 3.6 * s], [ex + 4 * s, ey - 4.8 * s]], 1.2, 0.6, C.H, 'u');
      g.poly([[a.mouth[1] - 2.8 * s, ey + 0.6], [a.mouth[1] - 1.2 * s, ey - 2 * s], [a.mouth[1] - 0.8 * s, ey + 0.8]], C.H);
      break;
    }
    case 'crest': g.ell(hx - 0.6, hy - 0.2, 2.2 * s, 1.6 * s, C.A); g.poly([[hx - 2.4 * s, hy + 0.6], [hx - 0.6, hy - 2.6 * s], [hx + 1.2 * s, hy]], C.A); break;
    case 'crestLong': g.poly([[hx - 0.4, hy + 0.6], [hx - 6.4 * s, hy - 2.4 * s], [hx - 6 * s, hy - 1 * s], [hx - 0.6, hy + 2 * s]], C.A); break;
    case 'doubleCrest': for (let i = 0; i < 2; i++) g.poly([[hx - 0.6 + i * 1.6, hy + 1], [hx - 2.6 * s + i * 1.6, hy - 3.4 * s], [hx + 0.4 + i * 1.6, hy + 0.6]], C.A); break;
    case 'tubeCrest': g.taper([[hx, hy + 0.6], [hx - 3 * s, hy - 1.4 * s], [hx - 6 * s, hy - 1 * s]], 2 * s, 1.4 * s, C.A); break;
    case 'ears': g.poly([[hx - 1.6, hy + 1.4], [hx - 1.8 * s, hy - 2.6 * s], [hx + 0.4, hy + 0.8]], C.B); g.dot(hx - 1.3 * s, hy - 0.4 * s, C.A, 'f'); break;
    case 'longEars': g.taper([[hx - 1, hy + 1], [hx - 2 * s, hy - 4 * s], [hx - 2.6 * s, hy - 7 * s]], 2 * s, 1.4 * s, C.B); g.line(hx - 1.2, hy - 0.6, hx - 2.4 * s, hy - 6 * s, 0.8, C.A, 'f'); break;
    case 'sprout': g.line(hx, hy + 0.6, hx, hy - 2 * s, 0.8, C.V); g.ell(hx - 1.2 * s, hy - 2.4 * s, 1.3 * s, 0.8 * s, C.V); g.ell(hx + 1.2 * s, hy - 2.8 * s, 1.3 * s, 0.8 * s, C.V); break;
    case 'antlers':
      g.line(hx - 0.6, hy + 0.6, hx - 2.2 * s, hy - 4 * s, 1, C.H); g.line(hx - 1.6 * s, hy - 2.6 * s, hx - 4 * s, hy - 3.6 * s, 0.9, C.H);
      g.line(hx - 2.2 * s, hy - 4 * s, hx - 1.4 * s, hy - 6 * s, 0.9, C.H); g.line(hx + 0.6, hy + 0.4, hx + 1.4 * s, hy - 3.4 * s, 0.9, C.H, 'u'); break;
    case 'horn': { const [ex, ey] = a.eye; g.poly([[ex + 0.4, ey - 0.6], [ex + 1.4 * s, ey - 3.4 * s], [ex + 2.2 * s, ey - 0.4]], C.H); break; }
    case 'bullHorns': { const [ex, ey] = a.eye; g.taper([[ex - 1, ey - 1], [ex - 2.4 * s, ey - 2.6 * s], [ex - 1.6 * s, ey - 4 * s]], 1.4, 0.6, C.H); break; }
    case 'brow': { const [ex, ey] = a.eye; g.poly([[ex - 1.4, ey - 1], [ex + 0.4, ey - 2.8 * s], [ex + 1.6, ey - 1]], C.A); break; }
    case 'frill': if (!a.frill) { g.ell(hx - 2.6 * s, hy + 3.4 * s, 2.4 * s, 4 * s, C.A, 'u'); g.ell(hx - 2.4 * s, hy + 3.4 * s, 1.4 * s, 2.8 * s, C.U, 'f'); } break;
    case 'domeSpikes': for (let i = 0; i < 4; i++) g.dot(hx - 2.6 * s + i * 1.6 * s, hy - 0.4 + Math.abs(i - 1.5) * 0.7, C.H); break;
    case 'tusks': { const [m0, m1, my] = a.mouth; g.taper([[m0 + (m1 - m0) * 0.5, my], [m1, my + 2.4 * s], [m1 + 1.6 * s, my + 0.6 * s]], 1.3, 0.7, C.H); break; }
    case 'trunk': { const [, m1, my] = a.mouth; g.taper([[m1 - 0.6, my - 1.6], [m1 + 1, my + 1.4 * s], [m1 + 0.4, my + 3.2 * s]], 1.8 * s, 1.1, C.B); break; }
    case 'sabre': { const [m0, m1, my] = a.mouth; const x = m0 + (m1 - m0) * 0.55; g.taper([[x, my], [x + 0.2, my + 3.4 * s]], 1.2, 0.6, C.T); break; }
    case 'tentacles': break;
    case 'antenna': g.line(hx, hy + 1, hx + 3.4 * s, hy - 2.4 * s, 0.6, C.H); g.line(hx - 1, hy + 1, hx + 1.4 * s, hy - 3 * s, 0.6, C.H); break;
    default: break;
  }
}

// ───────── 얼굴: 눈 · 입 · 이빨 ─────────
function drawFace(g, a, o) {
  const { k } = g;
  const [ex, ey] = a.eye;
  const x = g.gx(ex), y = g.gy(ey);
  const n = o.big ? 3 : 2;
  const tall = o.evo === 1 && !o.big ? 1 : 0; // 기본형은 크고 동그란 치비 눈
  for (let j = 0; j < n + tall; j++) for (let i = 0; i < n; i++) g.put(x + i, y + j - tall, C.P);
  g.put(x, y - tall, C.W);
  if (n === 3) g.put(x + 1, y - tall, C.W);
  if (o.fierce || o.atk >= 2) { for (let i = -1; i < n; i++) g.put(x + i, y - tall - 1, C.N, 'f'); g.put(x - 1, y - tall - 2, C.N, 'f'); } // 날카로운 눈썹
  if (o.atk >= 2) g.put(x + n - 1, y + n - 1, C.R);
  if (a.noMouth) return;
  const [m0, m1, my] = a.mouth;
  const yy = g.gy(my);
  const x0 = g.gx(m0 + (m1 - m0) * 0.3), x1 = g.gx(m1) - 1;
  for (let xx = x0; xx <= x1; xx++) if (g.get(xx, yy)) g.put(xx, yy, C.M);
  // 이빨: 육식 · 공격 각성 · 큰 턱
  const teeth = !a.noTeeth && (o.fierce || a.teeth || o.atk > 0);
  if (teeth) {
    const step = o.atk >= 2 ? 1 : 2;
    for (let xx = x0 + 1; xx <= x1; xx += step) if (g.get(xx, yy - 1)) g.put(xx, yy - 1, C.T);
    if (o.atk >= 1) for (let xx = x0 + 2; xx <= x1; xx += 2) if (g.get(xx, yy + 1)) g.put(xx, yy + 1, C.T);
  }
  void k;
}

// ───────── 종별 무늬 (몸 위에만) ─────────
function drawPattern(g, a, pattern, rnd) {
  const [cx, cy, rx, ry] = a.body;
  if (pattern === 'stripes') for (let i = 0; i < 4; i++) { const x = cx - rx * 0.6 + i * rx * 0.38; g.line(x, cy - ry * 0.95, x - 1, cy - ry * 0.25, 1, C.A, 'm'); }
  else if (pattern === 'spots') for (let i = 0; i < 6; i++) g.ell(cx + (rnd() * 1.6 - 0.8) * rx * 0.8, cy - ry * (0.2 + rnd() * 0.6), 0.9, 0.8, C.A, 'm');
  else if (pattern === 'saddle') g.ell(cx - rx * 0.1, cy - ry * 0.7, rx * 0.55, ry * 0.32, C.A, 'm');
  else if (pattern === 'bands') for (let i = 0; i < 3; i++) g.line(cx - rx * 0.4 + i * rx * 0.4, cy - ry, cx - rx * 0.4 + i * rx * 0.4, cy + ry * 0.2, 1.4, C.L, 'm');
}

// ───────── 스탯 임계치 각성 · 속성 포인트 컬러 (스프라이트에 직접 합성) ─────────
function drawAwaken(g, a, o) {
  const [cx, cy, rx, ry] = a.body;
  // 방어 각성: 비늘 장갑 도트 (Ⅰ 비늘 · Ⅱ 어깨 장갑판 · Ⅲ 황금 테두리 전신 장갑)
  if (o.def >= 1) {
    for (let y = g.gy(cy - ry * 0.9); y <= g.gy(cy + ry * 0.1); y++) for (let x = g.gx(cx - rx * 0.8); x <= g.gx(cx + rx * 0.8); x++)
      if ((x + y * 2) % (o.def >= 3 ? 3 : 4) === 0 && g.get(x, y) === C.B) g.put(x, y, C.K);
  }
  if (o.def >= 2) { g.ell(cx + rx * 0.45, cy - ry * 0.55, rx * 0.32, ry * 0.3, C.K, 'f'); g.ell(cx - rx * 0.4, cy - ry * 0.55, rx * 0.3, ry * 0.28, C.K, 'f'); }
  if (o.def >= 3) a.back.forEach(([x, y]) => g.dot(x, y + 1, C.G, 'f'));
  // 공격 각성: 발톱 강조 (단계마다 길어짐) · Ⅲ 붉은 전투 문신
  if (o.atk >= 1) a.claws.forEach(([x, y]) => {
    const len = o.atk;
    for (let i = 0; i <= len; i++) { g.put(g.gx(x) + 1 + i, g.gy(y) - (i > 0 ? 0 : 0), C.H); }
    g.put(g.gx(x) + 1 + len, g.gy(y) - 1, C.R);
  });
  if (o.atk >= 3) for (let i = 0; i < 3; i++) g.line(cx - rx * 0.3 + i * 1.8, cy - ry * 0.6, cx - rx * 0.3 + i * 1.8 + 1.2, cy - ry * 0.1, 0.8, C.R, 'm');
  // 체력 각성: Ⅰ 작은 뿔 · Ⅱ 큰 뿔 · Ⅲ 황금 왕관
  if (o.hp >= 1) {
    const [hx, hy] = a.head, s = a.hr / 4;
    if (o.hp >= 3) {
      const x0 = hx - 2.2 * s, x1 = hx + 2 * s, y0 = hy - 1.2 * s;
      g.poly([[x0, y0 + 1.6], [x0, y0 - 1.4 * s], [x0 + (x1 - x0) * 0.25, y0 - 0.2], [hx, y0 - 2.4 * s], [x0 + (x1 - x0) * 0.75, y0 - 0.2], [x1, y0 - 1.4 * s], [x1, y0 + 1.6]], C.G);
      g.dot(hx, y0 - 0.4, C.R);
    } else {
      const h = o.hp === 1 ? 1.8 : 3;
      g.poly([[hx - 1.4 * s, hy + 0.8], [hx - 2 * s, hy - h * s], [hx - 0.4 * s, hy + 0.6]], C.H);
      g.poly([[hx + 0.6 * s, hy + 0.6], [hx + 1 * s, hy - (h - 0.4) * s], [hx + 1.8 * s, hy + 0.8]], C.H);
    }
  }
  // 속성 습득 포인트 컬러: 등선 위에 속성 상징 모티프 (불꽃 갈기 · 빙결 결정 · 번개 문양 …)
  (o.els || []).slice(0, 2).forEach((el, idx) => {
    const code = idx === 0 ? C.E1 : C.E2;
    const pts = a.back.filter((_, i) => (i + idx) % 2 === 0);
    switch (el) {
      case 'fire': pts.forEach(([x, y]) => g.poly([[x - 1.2, y + 0.8], [x - 0.6, y - 3.2], [x + 0.2, y - 1.4], [x + 0.8, y - 2.6], [x + 1.2, y + 0.8]], C.F)); break;
      case 'ice': pts.forEach(([x, y]) => g.poly([[x - 0.8, y + 0.6], [x, y - 3.4], [x + 0.8, y + 0.6]], C.Q)); break;
      case 'thunder': for (let i = 0; i < 3; i++) { const x = cx - rx * 0.5 + i * rx * 0.5; g.line(x, cy - ry * 0.8, x + 1, cy - ry * 0.4, 0.7, C.Y, 'm'); g.line(x + 1, cy - ry * 0.4, x, cy, 0.7, C.Y, 'm'); } break;
      case 'grass': pts.forEach(([x, y]) => { g.ell(x - 0.4, y - 1.4, 1, 1.6, C.V); }); break;
      case 'water': pts.forEach(([x, y]) => g.poly([[x - 1.4, y + 0.8], [x - 1, y - 2.2], [x + 1.2, y + 0.8]], code)); break;
      case 'poison': for (let i = 0; i < 5; i++) g.ell(cx - rx * 0.6 + i * rx * 0.3, cy - ry * (i % 2 ? 0.3 : 0.6), 0.7, 0.7, code, 'm'); break;
      case 'wind': { const [tx, ty] = a.tail; g.line(tx + 1, ty, tx - 2, ty - 1.6, 0.8, code); pts.forEach(([x, y]) => g.line(x, y, x - 2, y - 1.4, 0.8, code)); break; }
      case 'earth': pts.forEach(([x, y]) => g.ell(x, y, 1, 0.8, code)); break;
      case 'primal': pts.forEach(([x, y]) => g.poly([[x - 0.6, y + 0.6], [x + 0.2, y - 2.6], [x + 0.8, y + 0.6]], C.H)); break;
      default: break;
    }
  });
}

// ───────── 팔레트: 종 기준색 → 4단계 명암 램프 ─────────
const ELC = (el) => ELEMENTS[el]?.color || '#ffffff';
function palettes(sp, o) {
  const rot = (c) => (o.shiny ? hueRotate(c, 180) : c);
  const [body, belly, acc] = sp.pal.map(rot);
  const R = {};
  R[C.B] = ramp(body);
  R[C.L] = ramp(mix(body, '#24143a', 0.2));
  R[C.U] = ramp(belly);
  R[C.A] = ramp(acc);
  R[C.H] = ramp('#f0e4c4');
  R[C.G] = ramp('#ffcc33');
  R[C.R] = ramp('#ff3a3a');
  R[C.K] = ramp(mix(acc, '#e0c888', 0.6));
  R[C.E1] = ramp(ELC(o.els?.[0] || sp.el));
  R[C.E2] = ramp(ELC(o.els?.[1] || o.els?.[0] || sp.el));
  R[C.F] = ramp('#ff8a2a');
  R[C.Q] = ramp('#aeefff');
  R[C.Y] = ramp('#ffdf3a');
  R[C.V] = ramp(rot('#5cc84a'));
  const flat = { [C.T]: '#fffef4', [C.W]: '#ffffff', [C.P]: '#1a1022', [C.M]: '#6a1a2c', [C.N]: R[C.B][3] };
  return { R, flat };
}

// 영역 코드 → 픽셀 색: 위가 비면 하이라이트, 아래쪽은 그늘(경계는 체커 디더링), 외곽은 셀아웃(어두운 테두리)
function paint(g, sp, o, mode) {
  const { n, c } = g;
  const { R, flat } = palettes(sp, o);
  const out = new Array(n * n).fill(null);
  const colTop = new Int16Array(n * n), colBot = new Int16Array(n * n);
  for (let x = 0; x < n; x++) {
    let run = 0;
    for (let y = 0; y < n; y++) { run = c[y * n + x] ? run + 1 : 0; colTop[y * n + x] = run; }
    run = 0;
    for (let y = n - 1; y >= 0; y--) { run = c[y * n + x] ? run + 1 : 0; colBot[y * n + x] = run; }
  }
  const rimEl = o.els?.[0] ? ramp(ELC(o.els[0]))[2] : null;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, v = c[i];
    if (v) {
      if (mode === 'silhouette') { out[i] = '#2a2433'; continue; }
      if (mode === 'white') { out[i] = '#ffffff'; continue; }
      if (FLAT.has(v)) { out[i] = flat[v]; continue; }
      const r = R[v];
      const up = y > 0 ? c[i - n] : 0, rt = x < n - 1 ? c[i + 1] : 0;
      const a = colTop[i], b = colBot[i], t = a / (a + b);
      let tone = 1;
      if (!up) tone = 0;
      else if (t > 0.78 || !rt) tone = 2;
      else if (t > 0.66 && (x + y) % 2 === 0) tone = 2;
      else if (t < 0.2 && (x + y) % 2 === 1) tone = 0;
      out[i] = r[tone];
    } else {
      // 외곽선: 이웃한 칠해진 칸의 어둠 색 (속성 습득 시 윗면 외곽은 속성 포인트 컬러 림 라이트)
      let nb = 0;
      const dn = y < n - 1 ? c[i + n] : 0;
      if (x > 0 && c[i - 1]) nb = c[i - 1]; else if (x < n - 1 && c[i + 1]) nb = c[i + 1]; else if (dn) nb = dn; else if (y > 0 && c[i - n]) nb = c[i - n];
      if (!nb) continue;
      if (mode === 'silhouette') { out[i] = '#120e18'; continue; }
      if (mode === 'white') continue;
      if (rimEl && dn && y < n * 0.62 && BODYISH.has(dn)) { out[i] = rimEl; continue; }
      const r = FLAT.has(nb) ? R[C.B] : R[nb];
      out[i] = mix(r[3], INK, 0.55);
    }
  }
  return out;
}

// ───────── 캔버스 (Offscreen Canvas 우선) ─────────
function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') { try { const cv = new OffscreenCanvas(w, h); if (cv.getContext('2d')) return cv; } catch (e) { /* fallthrough */ } }
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv;
}
function toCanvas(pix, n) {
  const cv = makeCanvas(n, n);
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < pix.length; i++) {
    const v = pix[i]; if (!v) continue;
    const [r, g, b] = hex2rgb(v);
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ───────── 종 설정 (무늬 · 눈매 · 체형) — 도감 번호로 결정되는 고유 개성 ─────────
const PATTERNS = ['none', 'stripes', 'spots', 'saddle', 'none', 'bands'];
function speciesStyle(sp) {
  const rnd = seeded(sp.id * 131 + 7);
  const pattern = sp.id === 66 || sp.id === 67 ? 'stripes' : PATTERNS[Math.floor(rnd() * PATTERNS.length)];
  const fierce = sp.base.atk > sp.base.def + 2 || sp.trait === 'jaw' || sp.trait === 'crit' || sp.trait === 'rage';
  const big = isBigSprite(sp.id);
  const sz = Math.max(0.84, Math.min(1.06, big ? sp.size / 1.38 : sp.size / 1.02));
  const hs = [1.2, 1.04, 0.96][Math.min(2, (sp.evo || 1) - 1)] * (0.96 + rnd() * 0.08);
  const bs = [0.9, 1, 1.06][Math.min(2, (sp.evo || 1) - 1)] * (0.95 + rnd() * 0.08);
  return { pattern, fierce, big, sz, hs, bs, seed: rnd };
}

// 한 프레임의 영역 매트릭스를 그린다 (frame 1 = 숨 들이쉼: 상체 1px 아래로)
function buildGrid(sp, o, frame) {
  const st = speciesStyle(sp);
  const n = st.big ? 48 : 32;
  const g = new Grid(n);
  g.sz = st.sz;
  const k = g.k * g.sz;
  const b = frame ? 1 / k : 0;
  const parts = sp.parts || {};
  const opt = { b, hs: st.hs, bs: st.bs, parts, big: st.big, evo: sp.evo || 1, arch: sp.arch };
  const sk = SKELETONS[sp.arch] || SKELETONS.theropod;
  // 1) 기준점 계산용 예행 (빈 매트릭스에 그려 anchors 만 얻음)
  const a = sk(new Grid(n), opt);
  // 2) 등 장식(뒤) → 몸통 → 등 장식(위) → 무늬 → 꼬리 · 머리 장식 → 얼굴 → 각성
  drawBack(g, a, parts.back, opt);
  const a2 = sk(g, opt);
  drawBackOver(g, a2, parts.back, opt);
  drawPattern(g, a2, st.pattern, seeded(sp.id * 17));
  drawTail(g, a2, parts.tail, opt);
  drawHead(g, a2, parts.head, opt);
  const face = { ...opt, fierce: st.fierce, atk: o.atk || 0 };
  drawFace(g, a2, face);
  drawAwaken(g, a2, { atk: o.atk || 0, def: o.def || 0, hp: o.hp || 0, els: o.els || [] });
  return { g, a: a2, n };
}

// ───────── 캐시 ─────────
const CACHE = new Map();
const CACHE_MAX = 900;
function cacheGet(key, make) {
  let v = CACHE.get(key);
  if (v) { CACHE.delete(key); CACHE.set(key, v); return v; }
  v = make();
  CACHE.set(key, v);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
  return v;
}
const lookKey = (L) => `${L.sid}|${L.atk || 0}${L.def || 0}${L.hp || 0}|${(L.els || []).join(',')}|${L.shiny ? 1 : 0}`;

export const spriteSize = (sid) => (isBigSprite(sid) ? 48 : 32);

// 스프라이트 한 장 (Offscreen Canvas, 캐시) — frame 0/1, silhouette(도감 미발견), white(진화 섬광)
export function monsterCanvas(look, { frame = 0, silhouette = false, white = false } = {}) {
  const L = typeof look === 'number' ? { sid: look } : look;
  const sp = SPECIES[L.sid];
  if (!sp) return makeCanvas(32, 32);
  const mode = silhouette ? 'silhouette' : white ? 'white' : 'color';
  const key = `spr|${lookKey(mode === 'color' ? L : { sid: L.sid })}|${frame}|${mode}`;
  return cacheGet(key, () => {
    const { g, n } = buildGrid(sp, mode === 'color' ? L : { sid: L.sid }, frame);
    return toCanvas(paint(g, sp, mode === 'color' ? L : {}, mode), n);
  });
}

// ───────── 오라 (각성 · 속성 입자) — 4프레임 루프, 캐시 ─────────
//  back: 몸 뒤 (황금 수호 결계) / front: 몸 앞 (붉은 투기 · 속성 입자)
function edgePoints(sid) {
  return cacheGet(`edge|${sid}`, () => {
    const sp = SPECIES[sid];
    const { g, a, n } = buildGrid(sp, {}, 0);
    const pts = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!g.get(x, y)) continue;
      if (!g.get(x, y - 1) || !g.get(x - 1, y) || !g.get(x + 1, y)) pts.push([x, y]);
    }
    return { pts, n, body: [g.tx(a.body[0]), g.ty(a.body[1]), a.body[2] * g.k * g.sz, a.body[3] * g.k * g.sz] };
  });
}
const AURA_EL = {
  fire: ['#ff8a2a', '#ffd23a'], ice: ['#aeefff', '#ffffff'], thunder: ['#ffdf3a', '#fffbe0'], water: ['#5ac8ff', '#d8f4ff'],
  grass: ['#5cc84a', '#c8f8a0'], poison: ['#b05cff', '#e8c8ff'], wind: ['#8af0c8', '#ffffff'], earth: ['#c8945a', '#f0dcb8'], primal: ['#f0e4c4', '#c8a070'],
};
export function auraCanvas(look, f, layer) {
  const L = look;
  const has = layer === 'back' ? (L.def || 0) > 0 : (L.atk || 0) > 0 || (L.els || []).length > 0;
  if (!has) return null;
  const key = `aura|${layer}|${L.sid}|${L.atk || 0}${L.def || 0}|${(L.els || []).join(',')}|${f}`;
  return cacheGet(key, () => {
    const E = edgePoints(L.sid);
    const n = E.n;
    const cv = makeCanvas(n, n);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const px = (x, y, col, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const rnd = seeded(L.sid * 977 + 3);
    const top = E.pts.filter(([, y]) => y < E.body[1]);
    const pickPt = () => (top.length ? top[Math.floor(rnd() * top.length)] : [n / 2, n / 2]);
    if (layer === 'back') {
      // 황금 수호 결계: 몸을 감싸는 점선 고리 (단계마다 고리 · 반짝임 증가)
      const [cx, cy, rx, ry] = E.body;
      for (let ring = 0; ring < Math.min(2, L.def); ring++) {
        const R = rx * (1.25 + ring * 0.22), Ry = ry * (1.5 + ring * 0.25);
        const dots = 22 + ring * 6;
        for (let i = 0; i < dots; i++) {
          if ((i + f + ring * 2) % 3 === 0) continue;
          const t = (i / dots) * Math.PI * 2 + f * 0.12 * (ring ? -1 : 1);
          px(cx + Math.cos(t) * R, cy + Math.sin(t) * Ry, i % 4 === 0 ? '#fff4b0' : '#ffcc33');
        }
      }
      if (L.def >= 3) for (let i = 0; i < 6; i++) { const [x, y] = pickPt(); if ((i + f) % 2) { px(x, y - 3, '#fff4b0'); px(x - 1, y - 2, '#ffcc33', 3, 1); px(x, y - 4, '#ffcc33'); } }
      return cv;
    }
    // 붉은 투기: 윗면 외곽에서 피어오르는 붉은 불꽃 입자
    const atkN = (L.atk || 0) * 6;
    for (let i = 0; i < atkN; i++) {
      const [x, y] = pickPt();
      const life = (i * 3 + f * 2) % 8;
      const col = life < 3 ? '#ffd0c0' : life < 6 ? '#ff3a3a' : '#a01a2a';
      px(x + Math.sin(i + f) * 0.8, y - 1 - life, col, life < 4 && L.atk >= 2 ? 2 : 1, 1);
    }
    // 속성 입자
    (L.els || []).slice(0, 2).forEach((el, idx) => {
      const [c1, c2] = AURA_EL[el] || ['#ffffff', '#ffffff'];
      for (let i = 0; i < 7; i++) {
        const [x, y] = pickPt();
        const ph = (i * 5 + f * 3 + idx * 2) % 10;
        if (el === 'fire') { if (ph < 6) { px(x, y - ph - 1, ph < 3 ? c2 : c1); if (ph < 2) px(x, y - ph - 2, c1); } }
        else if (el === 'ice') { if (ph < 7) { const yy = y - 6 + ph; px(x, yy, c2); if (ph % 3 === 0) { px(x - 1, yy, c1); px(x + 1, yy, c1); px(x, yy - 1, c1); px(x, yy + 1, c1); } } }
        else if (el === 'thunder') { if ((i + f) % 3 === 0) { px(x, y - 2, c1); px(x + 1, y - 3, c2); px(x, y - 4, c1); px(x + 1, y - 5, c1); } }
        else if (el === 'water' || el === 'poison') { if (ph < 8) { px(x, y - ph, c1); if (ph > 4) px(x, y - ph - 1, c2); } }
        else if (el === 'grass') { if (ph < 8) { px(x + Math.sin(ph) * 2, y - ph, c1, 2, 1); } }
        else if (el === 'wind') { if (ph < 6) px(x - ph * 2, y - 2, c1, 3, 1); }
        else if (el === 'earth') { const t = (i / 7) * Math.PI * 2 + f * 0.4; px(E.body[0] + Math.cos(t) * E.body[2] * 1.3, E.body[1] + Math.sin(t) * E.body[3] * 0.6, i % 2 ? c1 : c2, 2, 2); }
        else if (ph < 6) px(x, y - ph - 1, i % 2 ? c1 : c2);
      }
    });
    return cv;
  });
}

// ───────── 화면 출력 ─────────
// (x, y): 스프라이트 상자의 왼쪽 위, size: 출력 크기(px). t: 시간(ms) → 대기 바운스 2프레임 · 오라 4프레임
export function drawMonster(ctx, look, x, y, size, { t = 0, flip = false, alpha = 1, white = false, silhouette = false, aura = true, still = false } = {}) {
  const L = typeof look === 'number' ? { sid: look } : look;
  if (!SPECIES[L?.sid]) return;
  const frame = still ? 0 : Math.floor(t / 520) % 2;
  const af = Math.floor(t / 140) % 4;
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (flip) { ctx.translate(Math.round(x + size), Math.round(y)); ctx.scale(-1, 1); } else ctx.translate(Math.round(x), Math.round(y));
  const plain = white || silhouette;
  const back = aura && !plain ? auraCanvas(L, af, 'back') : null;
  if (back) ctx.drawImage(back, 0, 0, size, size);
  ctx.drawImage(monsterCanvas(L, { frame, white, silhouette }), 0, 0, size, size);
  const front = aura && !plain ? auraCanvas(L, af, 'front') : null;
  if (front) ctx.drawImage(front, 0, 0, size, size);
  ctx.restore();
  ctx.imageSmoothingEnabled = prev;
}

// 도감 화면 진입 전 100종 기본 스프라이트를 미리 캐싱 (idle 시간에 분할 처리)
export function warmCache(ids = Object.keys(SPECIES).map(Number)) {
  const list = ids.slice();
  const step = () => {
    const t0 = Date.now();
    while (list.length && Date.now() - t0 < 8) { const id = list.shift(); monsterCanvas({ sid: id }); monsterCanvas({ sid: id }, { frame: 1 }); }
    if (list.length) (typeof requestIdleCallback === 'function' ? requestIdleCallback : (f) => setTimeout(f, 16))(step);
  };
  step();
}

// 디버그 · 테스트용: 각성 단계를 강제로 지정한 외형
export const testLook = (sid, { atk = 0, def = 0, hp = 0, els = [], shiny = false } = {}) => ({ sid, atk, def, hp, els, shiny });
