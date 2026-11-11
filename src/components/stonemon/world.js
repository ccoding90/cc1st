// 🗺️ 1단계 태초마을 - 맵 · 건물 · NPC · 트레이너 · 야생 출현표
import { createMonster, randomMutate, rand, power, maxHp } from './monster';

export const MAP_W = 30, MAP_H = 26;
export const VIEW_W = 15, VIEW_H = 11; // 화면에 보이는 타일 수 (240x176 도트)

// 지형: . 풀 / , 수풀(야생 출현) / = 길 / ~ 물 / T 나무 / P 야자 / f 꽃 / r 바위 / # 뼈울타리 / s 표지판 / b 뼈무더기
function buildGrid() {
  const g = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
  const put = (list, ch) => list.forEach(([x, y]) => { g[y][x] = ch; });
  // 테두리 숲
  fill(0, 0, MAP_W - 1, 0, 'T'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'T');
  fill(0, 0, 0, MAP_H - 1, 'T'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'T');
  // 북쪽 풀숲 지대
  fill(2, 6, 10, 11, ','); fill(19, 6, 27, 11, ','); fill(2, 1, 6, 4, ','); fill(23, 1, 27, 4, ',');
  fill(5, 8, 6, 8, '.'); fill(22, 9, 23, 9, '.');
  put([[11, 2], [18, 2], [11, 3], [18, 3], [1, 5], [28, 5], [8, 1], [21, 1], [10, 6], [19, 11]], 'T');
  put([[8, 4], [21, 4], [12, 10], [17, 6], [3, 12], [26, 12]], 'r');
  put([[12, 6], [17, 11], [9, 12], [20, 12]], 'f');
  // 길
  fill(14, 5, 15, MAP_H - 2, '=');
  fill(4, 18, 4, 19, '='); fill(4, 19, 22, 19, '='); fill(8, 23, 15, 23, '='); fill(16, 21, 22, 21, '=');
  put([[13, 5], [16, 5]], 'b');
  // 마을 경계 뼈울타리
  fill(1, 13, 28, 13, '#'); g[13][14] = '='; g[13][15] = '=';
  // 연못
  fill(1, 21, 4, 23, '~'); fill(2, 20, 3, 20, '~');
  // 장식
  put([[7, 15], [12, 16], [16, 23], [26, 16], [11, 24], [6, 20], [24, 24], [27, 19]], 'f');
  put([[1, 15], [27, 23], [17, 24], [12, 22]], 'P');
  put([[13, 14], [17, 20]], 's');
  return g;
}
export const GRID = buildGrid();

// 건물: 발판 타일은 막힘. door 타일로 걸어 들어가면(부딪히면) 이벤트
export const BUILDINGS = [
  { id: 'temple', type: 'temple', x: 12, y: 1, w: 6, h: 4, doors: [[14, 4], [15, 4]] },
  { id: 'house', type: 'house', x: 3, y: 15, w: 4, h: 3, doors: [[4, 17]] },
  { id: 'lab', type: 'lab', x: 18, y: 15, w: 6, h: 4, doors: [[20, 18], [21, 18]] },
  { id: 'shop', type: 'shop', x: 8, y: 20, w: 4, h: 3, doors: [[8, 22]] },
  { id: 'altar', type: 'altar', x: 23, y: 20, w: 3, h: 3, doors: 'all' },
];

export const SIGNS = {
  '13,14': ['↑ 북쪽: 풀숲 · 태초의 신전', '「약한 자는 먹힌다. 풀숲에 들어갈 땐 각오하라.」 - 족장 우가'],
  '17,20': ['→ 포식의 제단', '「다른 스톤마스터의 스톤몬을 먹어라. 혹은 먹혀라.」'],
};

// NPC 외형
export const LOOKS = {
  hero: { hair: '#3a2010', skin: '#f2c194', cloth: '#e8963a', spot: '#6a3a10' },
  mom: { hair: '#7a3a2a', skin: '#f2c194', cloth: '#6aa860', spot: '#3a6a30' },
  kid: { hair: '#2a2a2a', skin: '#e8b080', cloth: '#5a8ad8', spot: '#2a4a8a' },
  granny: { hair: '#dddddd', skin: '#e8b890', cloth: '#9a6ab0', spot: '#5a3a70' },
  hunter: { hair: '#5a1a1a', skin: '#d89a6a', cloth: '#8a5a3a', spot: '#3a2010', extra: 'bone' },
  gatherer: { hair: '#c86a2a', skin: '#f2c194', cloth: '#d8c040', spot: '#8a7a10' },
  brute: { hair: '#1a1a1a', skin: '#c8885a', cloth: '#6a6a7a', spot: '#2a2a3a', extra: 'bone' },
  chief: { hair: '#2a1a10', skin: '#c8885a', cloth: '#b83a2a', spot: '#ffd23a', extra: 'crown' },
  prof: { hair: '#bbbbbb', skin: '#f2c194', cloth: '#ffffff', spot: '#999', extra: 'coat' },
};

// 트레이너 파티: sid, 배율, 유전자(변이)
export const TRAINERS = {
  dolsoe: {
    name: '꼬마 사냥꾼 돌쇠', look: 'hunter', reward: 60,
    party: [{ sid: 5, pw: 95 }],
    intro: ['너 그 스톤몬 처음 보는 놈이네!', '내 랩티가 먹어 주지! 덤벼!'],
    win: ['으아앙! 내 랩티가… 먹혀버렸어…', '…다음엔 더 센 놈을 잡아 올 거야!'],
    after: ['풀숲 깊은 곳엔 독을 뿜는 딜로가 있대. 조심해…'],
  },
  nuri: {
    name: '채집꾼 누리', look: 'gatherer', reward: 90,
    party: [{ sid: 12, pw: 115 }, { sid: 6, pw: 125 }],
    intro: ['열매 따러 왔다가 너 같은 사냥감을 만났네?', '내 아이들, 배고프대!'],
    win: ['…둘 다 먹혔어. 이게 태초마을의 법이지.'],
    after: ['같은 속성만 먹으면 그 속성 몬스터한테 강해져. 섞어 먹으면 이것저것 다 돋아나고!'],
  },
  bawi: {
    name: '사냥꾼 바위', look: 'brute', reward: 140,
    party: [{ sid: 8, pw: 165, genes: { earth: 3 } }, { sid: 11, pw: 180, genes: { fire: 4 } }],
    intro: ['신전에 가려는 놈은 다 나를 거쳐야 한다.', '족장님 앞에 서기 전에, 여기서 먹혀라!'],
    win: ['크윽… 내 사냥감이 나를 먹다니.', '좋다. 족장님께 가라. 넌 자격이 있다.'],
    after: ['족장 우가님의 스톤몬은 다섯 번 이상 포식한 놈만 상대해 주신다.'],
  },
  chief: {
    name: '태초마을 족장 우가', look: 'chief', reward: 600, boss: true,
    party: [
      { sid: 9, pw: 340, genes: { earth: 6, primal: 3 } },
      { sid: 16, pw: 380, genes: { earth: 5, thunder: 4 } },
      { sid: 7, pw: 420, genes: { poison: 6, wind: 4 } },
    ],
    intro: ['…또 하나의 어린 포식자인가.', '이 마을은 약육강식의 땅. 약자는 멸시받고, 적자만이 살아남는다.', '내 스톤몬들은 수백 마리를 삼켰다. 네 녀석도 그 중 하나가 될 것이다!'],
    win: ['…훌륭하다. 내 아이들이 모두 네 피와 뼈가 되었구나.', '받아라, 태초의 증표다. 너는 이제 진짜 스톤마스터다.'],
    after: ['북쪽 너머 불꽃 화산에는 더 강한 포식자들이 있다. 길이 열리면 가 보거라.'],
  },
};

export const NPCS = [
  { id: 'mom', x: 6, y: 18, dir: 'down', look: 'mom' },
  { id: 'kid', x: 11, y: 16, dir: 'down', look: 'kid' },
  { id: 'granny', x: 24, y: 24, dir: 'up', look: 'granny' },
  { id: 'dolsoe', x: 5, y: 8, dir: 'right', look: 'hunter', trainer: 'dolsoe' },
  { id: 'nuri', x: 22, y: 9, dir: 'left', look: 'gatherer', trainer: 'nuri' },
  { id: 'bawi', x: 13, y: 8, dir: 'right', look: 'brute', trainer: 'bawi' },
];

// 태초마을 야생 출현표 [번호, 가중치]
export const WILD_TABLE = [
  [4, 15], [5, 12], [6, 11], [8, 10], [11, 9], [12, 10], [13, 6], [14, 6], [15, 9], [16, 8],
  [7, 4], [9, 3], [10, 3], [1, 1], [2, 1], [3, 1],
];

// 전투력을 목표치에 맞춘다 (능력치 비율은 종 고유값 유지)
export function scaleTo(m, target) {
  for (let i = 0; i < 3; i++) {
    const k = target / power(m);
    for (const s of ['hp', 'atk', 'def', 'spd']) m.stats[s] = Math.max(1, Math.round(m.stats[s] * k));
  }
  m.hp = maxHp(m);
  return m;
}

// 야생 개체 생성: 내 대장의 전투력을 기준으로 0.5~0.85배. 가끔 '우두머리'(1.3배, 변이 多) 등장
export function rollWild(myPower, devours) {
  const total = WILD_TABLE.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * total, sid = 4;
  for (const [id, w] of WILD_TABLE) { r -= w; if (r <= 0) { sid = id; break; } }
  const alpha = devours >= 2 && Math.random() < 0.07;
  const m = createMonster(sid);
  randomMutate(m, Math.floor(Math.random() * Math.min(10, devours + 1)) + (alpha ? 6 : 0));
  const base = power(createMonster(sid, { jitter: false }));
  const target = Math.max(base * 0.8, myPower * rand(0.5, 0.85) * (alpha ? 1.3 : 1));
  scaleTo(m, target);
  m.alpha = alpha;
  return m;
}

export function trainerParty(id) {
  return TRAINERS[id].party.map(({ sid, pw, genes }) => scaleTo(createMonster(sid, { genes, jitter: false }), pw));
}

export const isTall = (x, y) => GRID[y]?.[x] === ',';
const SOLID = new Set(['T', 'P', '~', 'r', '#', 's']);
export function buildingAt(x, y) {
  return BUILDINGS.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
}
export function blocked(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  if (SOLID.has(GRID[y][x])) return true;
  return !!buildingAt(x, y);
}
export function doorAt(x, y) {
  const b = buildingAt(x, y);
  if (!b) return null;
  if (b.doors === 'all') return b;
  return b.doors.some(([dx, dy]) => dx === x && dy === y) ? b : null;
}
