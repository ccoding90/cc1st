// 🗺️ 스톤몬스터 v3.0 월드 - 스테이지 1~5 맵 · 건물 · NPC · 트레이너 · 보스 · 라이벌 · 투기장 · 필드 오브젝트 · 야생 출현표
import { createMonster, wildBoost, rand, pick, maxHp, STAT_KEYS } from './monster';
import { SPECIES, SKILLS, STARTERS, baseForm, ELEMENT_KEYS } from './data';

export const MAP_W = 30, MAP_H = 26;
export const VIEW_W = 15, VIEW_H = 11; // 화면에 보이는 타일 수 (240x176 도트)

// 지형 문자
//  . 땅 / , 수풀·갈대(야생) / v 협곡 마른풀(야생) / a 화산재 풀(야생) / = 길 / c 협곡 바닥 / S 유적 바닥 / m 진흙
//  ~ 물 / W 폭포 / L 용암 / T 나무 / P 야자 / R 붉은 바위 / I 유적 기둥 / f 꽃 / r 바위 / # 뼈울타리 / s 표지판 / b 뼈무더기
//  v3.0: n 설원 눈덤불(야생) / g 하늘 신전 금빛 풀(야생) / C 얼음 결정 / K 구름 낭떠러지
const ENCOUNTER = new Set([',', 'v', 'a', 'n', 'g']);
const SOLID = new Set(['T', 'P', '~', 'W', 'L', 'R', 'I', 'r', '#', 's', 'C', 'K']);

function makeGrid() {
  const g = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
  const put = (list, ch) => list.forEach(([x, y]) => { g[y][x] = ch; });
  return { g, fill, put };
}

// ── Stage 1: 태초마을 + 태초의 숲 ──
function buildVillage() {
  const { g, fill, put } = makeGrid();
  fill(0, 0, MAP_W - 1, 0, 'T'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'T');
  fill(0, 0, 0, MAP_H - 1, 'T'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'T');
  // 북쪽 태초의 숲 (수풀)
  fill(2, 6, 10, 11, ','); fill(19, 6, 27, 11, ','); fill(2, 1, 6, 4, ','); fill(23, 1, 27, 4, ',');
  fill(5, 8, 6, 8, '.'); fill(22, 9, 23, 9, '.');
  put([[11, 2], [18, 2], [11, 3], [18, 3], [1, 5], [28, 5], [8, 1], [21, 1], [10, 6], [19, 11], [7, 4], [9, 9], [24, 6]], 'T');
  put([[8, 4], [21, 4], [12, 10], [17, 6], [3, 12], [26, 12]], 'r');
  put([[12, 6], [17, 11], [9, 12], [20, 12]], 'f');
  // 길
  fill(14, 5, 15, MAP_H - 2, '=');
  fill(4, 18, 4, 19, '='); fill(4, 19, 22, 19, '='); fill(8, 23, 15, 23, '='); fill(16, 21, 22, 21, '=');
  put([[13, 5], [16, 5]], 'b');
  // 동쪽 출구 → 메아리의 습지
  fill(28, 2, 29, 3, '=');
  put([[28, 4]], 's');
  // 마을 경계 뼈울타리
  fill(1, 13, 28, 13, '#'); g[13][14] = '='; g[13][15] = '=';
  // 연못
  fill(1, 21, 4, 23, '~'); fill(2, 20, 3, 20, '~');
  put([[7, 15], [12, 16], [16, 23], [26, 16], [11, 24], [6, 20], [24, 24], [27, 19]], 'f');
  put([[1, 15], [27, 23], [17, 24], [12, 22]], 'P');
  put([[13, 14], [17, 20]], 's');
  return g;
}

// ── Stage 2: 메아리의 습지 & 붉은 바위 협곡 ──
function buildSwamp() {
  const { g, fill, put } = makeGrid();
  fill(0, 0, 15, 0, 'T'); fill(0, MAP_H - 1, 15, MAP_H - 1, 'T'); fill(0, 0, 0, MAP_H - 1, 'T');
  // 협곡 (동쪽)
  fill(16, 1, 28, 24, 'c');
  fill(16, 0, 29, 0, 'R'); fill(16, MAP_H - 1, 29, MAP_H - 1, 'R'); fill(29, 0, 29, MAP_H - 1, 'R');
  // 폭포와 웅덩이
  fill(5, 0, 9, 0, 'W'); fill(4, 1, 10, 3, '~');
  fill(1, 9, 3, 11, '~'); fill(11, 14, 13, 16, '~');
  // 갈대 수풀
  fill(1, 5, 8, 8, ','); fill(9, 6, 14, 11, ','); fill(4, 12, 10, 17, ','); fill(1, 13, 3, 18, ',');
  put([[12, 4], [13, 5], [2, 20], [11, 19], [6, 19], [12, 20], [9, 24]], 'm');
  put([[1, 4], [11, 1], [12, 1], [14, 13], [1, 23], [13, 24], [10, 12]], 'T');
  put([[7, 18], [3, 4], [12, 18]], 'f');
  // 협곡 마른풀
  fill(17, 13, 22, 18, 'v'); fill(23, 8, 28, 12, 'v'); fill(18, 6, 21, 10, 'v'); fill(24, 15, 28, 20, 'v');
  put([[16, 5], [16, 6], [16, 12], [16, 13], [16, 17], [16, 18], [22, 6], [22, 11], [27, 14], [20, 20], [25, 22], [17, 23], [28, 7], [16, 9], [23, 23]], 'R');
  put([[19, 21], [26, 13], [18, 4]], 'b');
  // 길: 서쪽 입구 → 북쪽 → 동쪽 협곡 → 화산 출구
  fill(0, 22, 15, 22, '=');
  fill(15, 3, 15, 22, '=');
  fill(15, 3, 27, 3, '=');
  fill(26, 0, 27, 3, '=');
  put([[2, 21], [17, 2]], 's');
  return g;
}

// ── Stage 3: 작열하는 화산 & 고대 유적 ──
function buildVolcano() {
  const { g, fill, put } = makeGrid();
  fill(0, 0, MAP_W - 1, 0, 'R'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'R');
  fill(0, 0, 0, MAP_H - 1, 'R'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'R');
  // 화산재 수풀
  fill(3, 17, 12, 23, 'a'); fill(18, 17, 27, 23, 'a'); fill(2, 9, 11, 13, 'a'); fill(17, 9, 27, 13, 'a');
  // 용암 강과 웅덩이
  fill(1, 15, 28, 16, 'L');
  fill(2, 19, 4, 21, 'L'); fill(24, 10, 26, 12, 'L'); fill(22, 21, 23, 23, 'L');
  // 고대 유적
  fill(1, 1, 28, 6, 'S');
  put([[5, 2], [5, 5], [9, 2], [9, 5], [20, 2], [20, 5], [24, 2], [24, 5], [2, 3], [27, 3]], 'I');
  fill(1, 7, 28, 7, 'I');
  put([[3, 14], [26, 14], [8, 18], [21, 19], [11, 9], [18, 9], [6, 24], [25, 24]], 'r');
  put([[7, 12], [20, 12], [4, 23], [27, 18]], 'b');
  // 길
  fill(14, 8, 15, MAP_H - 1, '=');
  fill(14, 3, 15, 7, '=');
  put([[13, 24], [16, 8]], 's');
  // v3.0: 유적 동쪽 끝 → 만년설의 빙하 동굴
  fill(16, 4, 29, 4, '='); g[3][29] = '='; g[3][28] = 'S';
  g[5][26] = 's';
  return g;
}

// ── Stage 4: 만년설의 빙하 동굴 ──
function buildGlacier() {
  const { g, fill, put } = makeGrid();
  fill(0, 0, MAP_W - 1, 0, 'C'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'C');
  fill(0, 0, 0, MAP_H - 1, 'C'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'C');
  // 얼어붙은 호수
  fill(3, 3, 8, 6, '~'); fill(21, 14, 24, 15, '~'); fill(2, 20, 3, 23, '~');
  // 눈덤불: 남쪽(입구) · 북쪽(심층)
  fill(4, 15, 12, 18, 'n'); fill(5, 22, 12, 24, 'n'); fill(17, 17, 27, 23, 'n');
  fill(2, 9, 11, 12, 'n'); fill(18, 6, 27, 11, 'n'); fill(10, 2, 12, 6, 'n');
  // 얼음 결정 기둥
  put([[13, 9], [16, 9], [13, 14], [16, 14], [6, 13], [24, 12], [19, 16], [9, 19], [26, 24], [1, 13], [20, 4], [24, 4], [27, 15]], 'C');
  put([[11, 13], [18, 12], [3, 7], [22, 23]], 'r');
  put([[8, 8], [25, 18], [4, 24]], 'b');
  // 길: 서쪽 입구 → 북쪽 → 빙하의 군주 동굴 / 동쪽 위 출구(하늘 신전)
  fill(0, 20, 15, 21, '=');
  fill(14, 3, 15, 21, '=');
  fill(15, 3, 27, 3, '=');
  fill(26, 0, 27, 3, '=');
  put([[1, 19], [17, 2]], 's');
  return g;
}

// ── Stage 5: 태고의 하늘 신전 ──
function buildSky() {
  const { g, fill, put } = makeGrid();
  fill(0, 0, MAP_W - 1, 0, 'K'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'K');
  fill(0, 0, 0, MAP_H - 1, 'K'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'K');
  // 구름 낭떠러지 (지형 장애물)
  fill(1, 22, 4, 24, 'K'); fill(25, 23, 28, 24, 'K'); fill(1, 13, 2, 15, 'K'); fill(27, 13, 28, 14, 'K'); fill(12, 12, 13, 13, 'K'); fill(16, 15, 17, 16, 'K');
  // 고대 석조 신전 (북쪽)
  fill(1, 1, 28, 6, 'S');
  put([[3, 2], [3, 5], [8, 2], [8, 5], [21, 2], [21, 5], [26, 2], [26, 5]], 'I');
  fill(1, 7, 12, 7, 'I'); fill(17, 7, 28, 7, 'I');
  // 금빛 원시풀: 남쪽 회랑 · 북쪽 제단 앞
  fill(3, 16, 11, 20, 'g'); fill(18, 12, 26, 16, 'g'); fill(4, 8, 11, 11, 'g'); fill(18, 8, 26, 10, 'g'); fill(6, 14, 10, 15, 'g');
  put([[20, 18], [7, 21], [23, 11], [10, 12]], 'r');
  put([[5, 21], [21, 20]], 'b');
  // 길: 남쪽 입구 → 북쪽 하늘 제단 / 동쪽 원시 투기장
  fill(14, 7, 15, MAP_H - 1, '=');
  fill(13, 7, 16, 7, '=');
  fill(14, 4, 15, 6, '=');
  fill(16, 22, 24, 22, '=');
  put([[13, 24], [17, 8]], 's');
  return g;
}

export const MAPS = {
  village: {
    id: 'village', name: '태초의 숲', stage: 1, theme: 'forest', bg: 'forest', grid: buildVillage(),
    buildings: [
      { id: 'temple', type: 'temple', x: 12, y: 1, w: 6, h: 4, doors: [[14, 4], [15, 4]] },
      { id: 'house', type: 'house', x: 3, y: 15, w: 4, h: 3, doors: [[4, 17]] },
      { id: 'lab', type: 'lab', x: 18, y: 15, w: 6, h: 4, doors: [[20, 18], [21, 18]] },
      { id: 'shop', type: 'shop', x: 8, y: 20, w: 4, h: 3, doors: [[8, 22]] },
      { id: 'altar', type: 'altar', x: 23, y: 20, w: 3, h: 3, doors: 'all' },
    ],
    npcs: [
      { id: 'mom', x: 6, y: 18, dir: 'down', look: 'mom' },
      { id: 'kid', x: 11, y: 16, dir: 'down', look: 'kid' },
      { id: 'granny', x: 24, y: 24, dir: 'up', look: 'granny' },
      { id: 'dolsoe', x: 5, y: 8, dir: 'right', look: 'hunter', trainer: 'dolsoe' },
      { id: 'nuri', x: 22, y: 9, dir: 'left', look: 'gatherer', trainer: 'nuri' },
      { id: 'bawi', x: 13, y: 8, dir: 'right', look: 'brute', trainer: 'bawi' },
    ],
    signs: {
      '13,14': ['↑ 북쪽: 태초의 숲 · 숲의 수호자의 사당', '「약한 자는 먹힌다. 숲에 들어갈 땐 각오하라.」 - 족장 우가'],
      '17,20': ['→ 포식의 제단', '「다른 스톤마스터의 스톤몬을 먹어라. 혹은 먹혀라.」'],
      '28,4': ['→ 동쪽: 메아리의 습지 & 협곡 (적정 Lv.11~22)', '「숲의 수호자를 쓰러뜨린 자만 지나갈 수 있다.」'],
    },
    warps: [
      { x: 29, y: 2, to: 'swamp', tx: 1, ty: 22, dir: 'right', gate: 'boss1' },
      { x: 29, y: 3, to: 'swamp', tx: 1, ty: 22, dir: 'right', gate: 'boss1' },
    ],
    zones: [
      { x0: 1, y0: 1, x1: 28, y1: 4, lv: [4, 8], table: 's1' },
      { x0: 1, y0: 5, x1: 28, y1: 12, lv: [2, 5], table: 's1' },
    ],
    objects: [
      { id: 'f_fossil', kind: 'fossil', x: 17, y: 9 },
      { id: 'f_nest', kind: 'nest', x: 10, y: 4 },
    ],
  },
  swamp: {
    id: 'swamp', name: '메아리의 습지 & 협곡', stage: 2, theme: 'swamp', bg: 'swamp', grid: buildSwamp(),
    buildings: [
      { id: 'swampShop', type: 'swampShop', x: 3, y: 19, w: 4, h: 3, doors: [[4, 21]] },
      { id: 'lair', type: 'lair', x: 19, y: 0, w: 4, h: 3, doors: [[20, 2], [21, 2]] },
    ],
    npcs: [
      { id: 'herbalist', x: 8, y: 21, dir: 'down', look: 'granny2' },
      { id: 'gaegol', x: 7, y: 10, dir: 'down', look: 'swamper', trainer: 'gaegol' },
      { id: 'mir', x: 14, y: 17, dir: 'right', look: 'witch', trainer: 'mir' },
      { id: 'barami', x: 20, y: 12, dir: 'left', look: 'climber', trainer: 'barami' },
    ],
    signs: {
      '2,21': ['메아리의 습지 (적정 Lv.11~22)', '「독과 화상을 조심하라. 습지 상점에 해독제가 있다.」'],
      '17,2': ['← 협곡의 지배자의 동굴', '→ 북쪽: 작열하는 화산 (협곡의 지배자를 쓰러뜨린 자만)'],
    },
    warps: [
      { x: 0, y: 22, to: 'village', tx: 28, ty: 2, dir: 'left' },
      { x: 26, y: 0, to: 'volcano', tx: 14, ty: 24, dir: 'up', gate: 'boss2' },
      { x: 27, y: 0, to: 'volcano', tx: 15, ty: 24, dir: 'up', gate: 'boss2' },
    ],
    zones: [
      { x0: 0, y0: 0, x1: 15, y1: 25, lv: [11, 16], table: 's2a' },
      { x0: 16, y0: 0, x1: 29, y1: 25, lv: [15, 21], table: 's2b' },
    ],
    objects: [
      { id: 's_fossil', kind: 'fossil', x: 22, y: 21 },
      { id: 's_nest', kind: 'nest', x: 2, y: 2 },
    ],
  },
  volcano: {
    id: 'volcano', name: '작열하는 화산 & 고대 유적', stage: 3, theme: 'volcano', bg: 'volcano', grid: buildVolcano(),
    buildings: [
      { id: 'throne', type: 'throne', x: 12, y: 0, w: 6, h: 3, doors: [[14, 2], [15, 2]] },
    ],
    npcs: [
      { id: 'shaman', x: 16, y: 23, dir: 'left', look: 'shaman' },
      { id: 'trader', x: 13, y: 20, dir: 'right', look: 'trader' },
      { id: 'bulmoe', x: 13, y: 18, dir: 'right', look: 'smith', trainer: 'bulmoe' },
      { id: 'gomun', x: 16, y: 11, dir: 'left', look: 'scholar', trainer: 'gomun' },
      { id: 'krom', x: 13, y: 5, dir: 'right', look: 'elite', trainer: 'krom' },
    ],
    signs: {
      '13,24': ['작열하는 화산 (적정 Lv.23~35)', '「용암에 닿으면 끝이다. 유적 안쪽엔 태초의 왕좌가 있다.」'],
      '16,8': ['↑ 고대 유적 · 태초의 왕좌', '「세 정예를 꺾은 포식자만이 왕좌 앞에 설 수 있다.」'],
      '26,5': ['→ 동쪽: 만년설의 빙하 동굴 (적정 Lv.36~48)', '「태초의 왕좌를 꺾은 자만이 얼음 문을 지날 수 있다.」'],
    },
    warps: [
      { x: 14, y: 25, to: 'swamp', tx: 26, ty: 1, dir: 'down' },
      { x: 15, y: 25, to: 'swamp', tx: 27, ty: 1, dir: 'down' },
      { x: 29, y: 3, to: 'glacier', tx: 1, ty: 20, dir: 'right', gate: 'boss3' },
      { x: 29, y: 4, to: 'glacier', tx: 1, ty: 21, dir: 'right', gate: 'boss3' },
    ],
    zones: [
      { x0: 0, y0: 17, x1: 29, y1: 25, lv: [23, 28], table: 's3a' },
      { x0: 0, y0: 0, x1: 29, y1: 16, lv: [27, 33], table: 's3b' },
    ],
    objects: [
      { id: 'v_fossil', kind: 'fossil', x: 20, y: 24 },
      { id: 'v_nest', kind: 'nest', x: 9, y: 8 },
    ],
  },
  glacier: {
    id: 'glacier', name: '만년설의 빙하 동굴', stage: 4, theme: 'glacier', bg: 'glacier', grid: buildGlacier(),
    buildings: [
      { id: 'iceLair', type: 'iceLair', x: 12, y: 0, w: 6, h: 3, doors: [[14, 2], [15, 2]] },
    ],
    npcs: [
      { id: 'hermit', x: 16, y: 21, dir: 'left', look: 'hermit' },
      { id: 'iceTrader', x: 16, y: 19, dir: 'left', look: 'trader2' },
      { id: 'harang', x: 8, y: 14, dir: 'down', look: 'iceHunter', trainer: 'harang' },
      { id: 'seori', x: 17, y: 8, dir: 'left', look: 'frostMage', trainer: 'seori' },
    ],
    signs: {
      '1,19': ['만년설의 빙하 동굴 (적정 Lv.36~48)', '「눈보라가 몰아친다. 얼음 속성이 아닌 스톤몬은 가끔 몸이 얼어 1턴 움직이지 못한다.」'],
      '17,2': ['← 빙하의 군주의 얼음 굴', '→ 북동쪽: 태고의 하늘 신전 (빙하의 군주를 쓰러뜨린 자만)'],
    },
    warps: [
      { x: 0, y: 20, to: 'volcano', tx: 28, ty: 3, dir: 'left' },
      { x: 0, y: 21, to: 'volcano', tx: 28, ty: 4, dir: 'left' },
      { x: 26, y: 0, to: 'sky', tx: 14, ty: 24, dir: 'up', gate: 'boss4' },
      { x: 27, y: 0, to: 'sky', tx: 15, ty: 24, dir: 'up', gate: 'boss4' },
    ],
    zones: [
      { x0: 0, y0: 14, x1: 29, y1: 25, lv: [36, 42], table: 's4a', gene: 'ice' },
      { x0: 0, y0: 0, x1: 29, y1: 13, lv: [42, 48], table: 's4b', gene: 'ice' },
    ],
    objects: [
      { id: 'g_fossil1', kind: 'fossil', x: 11, y: 19 },
      { id: 'g_fossil2', kind: 'fossil', x: 22, y: 5 },
      { id: 'g_nest', kind: 'nest', x: 19, y: 13 },
    ],
  },
  sky: {
    id: 'sky', name: '태고의 하늘 신전', stage: 5, theme: 'sky', bg: 'sky', grid: buildSky(),
    buildings: [
      { id: 'skyAltar', type: 'skyAltar', x: 12, y: 0, w: 6, h: 4, doors: [[14, 3], [15, 3]] },
      { id: 'colosseum', type: 'colosseum', x: 21, y: 18, w: 6, h: 4, doors: [[23, 21], [24, 21]] },
    ],
    npcs: [
      { id: 'priest', x: 16, y: 24, dir: 'left', look: 'priest' },
      { id: 'skyTrader', x: 13, y: 22, dir: 'right', look: 'trader2' },
      { id: 'un', x: 7, y: 13, dir: 'down', look: 'monk', trainer: 'un' },
      { id: 'ara', x: 17, y: 11, dir: 'left', look: 'oracle', trainer: 'ara' },
    ],
    signs: {
      '13,24': ['태고의 하늘 신전 (적정 Lv.49~65)', '「구름 위 제단에 고대 3대 신수가 잠들어 있다.」'],
      '17,8': ['↑ 하늘 제단 · 고대 3대 신수', '→ 동쪽 아래: 무한의 원시 투기장 (신수를 쓰러뜨린 자에게 열린다)'],
    },
    warps: [
      { x: 14, y: 25, to: 'glacier', tx: 26, ty: 1, dir: 'down' },
      { x: 15, y: 25, to: 'glacier', tx: 27, ty: 1, dir: 'down' },
    ],
    zones: [
      { x0: 0, y0: 13, x1: 29, y1: 25, lv: [49, 56], table: 's5a', gene: 'wind' },
      { x0: 0, y0: 0, x1: 29, y1: 12, lv: [56, 63], table: 's5b' },
    ],
    objects: [
      { id: 'k_fossil1', kind: 'fossil', x: 5, y: 12 },
      { id: 'k_fossil2', kind: 'fossil', x: 27, y: 17 },
      { id: 'k_nest', kind: 'nest', x: 20, y: 4 },
    ],
  },
};
export const MAP_IDS = Object.keys(MAPS);
export const mapOf = (id) => MAPS[id] || MAPS.village;

// 야생 출현표 [번호, 가중치]
export const WILD_TABLES = {
  s1: [[20, 10], [22, 9], [25, 9], [30, 9], [18, 8], [28, 8], [46, 7], [13, 10], [10, 9], [27, 5]],
  s2a: [[39, 6], [41, 6], [59, 5], [35, 9], [47, 10], [49, 8], [43, 7], [33, 6], [58, 9], [53, 8], [63, 6], [51, 7]],
  s2b: [[59, 4], [66, 9], [55, 9], [45, 8], [37, 3], [68, 9], [43, 6], [47, 6], [49, 6], [63, 5]],
  s3a: [[75, 5], [62, 8], [57, 9], [76, 5], [79, 9], [70, 6], [71, 9], [83, 9], [84, 5]],
  s3b: [[41, 4], [82, 7], [91, 4], [85, 8], [81, 9], [84, 7], [79, 6], [62, 7], [70, 6], [83, 5], [71, 5]],
  // v3.0 Stage 4 만년설의 빙하 동굴
  s4a: [[63, 12], [56, 8], [72, 8], [65, 9], [78, 8], [69, 7]],
  s4b: [[14, 4], [63, 8], [69, 9], [37, 7], [91, 5], [56, 6], [72, 5], [78, 5], [65, 5]],
  // v3.0 Stage 5 태고의 하늘 신전
  s5a: [[86, 5], [80, 10], [77, 9], [81, 9], [88, 8], [93, 6], [94, 6]],
  s5b: [[86, 5], [73, 4], [88, 8], [94, 6], [93, 6], [81, 7], [77, 6], [80, 6], [61, 2], [89, 2], [90, 2]],
};
export const TABLE_REGION = {
  s1: '태초의 숲', s2a: '메아리의 습지', s2b: '붉은 바위 협곡', s3a: '작열하는 화산', s3b: '고대 유적',
  s4a: '빙하 동굴 입구', s4b: '만년설 심층', s5a: '구름 회랑', s5b: '태고의 제단',
};

// NPC 외형
export const LOOKS = {
  hero: { hair: '#3a2010', skin: '#f2c194', cloth: '#e8963a', spot: '#6a3a10' },
  mom: { hair: '#7a3a2a', skin: '#f2c194', cloth: '#6aa860', spot: '#3a6a30' },
  kid: { hair: '#2a2a2a', skin: '#e8b080', cloth: '#5a8ad8', spot: '#2a4a8a' },
  granny: { hair: '#dddddd', skin: '#e8b890', cloth: '#9a6ab0', spot: '#5a3a70' },
  granny2: { hair: '#cccccc', skin: '#e0b088', cloth: '#5a9a6a', spot: '#2a5a3a' },
  hunter: { hair: '#5a1a1a', skin: '#d89a6a', cloth: '#8a5a3a', spot: '#3a2010', extra: 'bone' },
  gatherer: { hair: '#c86a2a', skin: '#f2c194', cloth: '#d8c040', spot: '#8a7a10' },
  brute: { hair: '#1a1a1a', skin: '#c8885a', cloth: '#6a6a7a', spot: '#2a2a3a', extra: 'bone' },
  chief: { hair: '#2a1a10', skin: '#c8885a', cloth: '#b83a2a', spot: '#ffd23a', extra: 'crown' },
  prof: { hair: '#bbbbbb', skin: '#f2c194', cloth: '#ffffff', spot: '#999', extra: 'coat' },
  swamper: { hair: '#3a5a2a', skin: '#c8a070', cloth: '#4a7a5a', spot: '#2a4a2a' },
  witch: { hair: '#4a1a5a', skin: '#e8c0a0', cloth: '#6a3a8a', spot: '#b05cff' },
  climber: { hair: '#8a3a1a', skin: '#d89a6a', cloth: '#c85a3a', spot: '#7a2a1a', extra: 'bone' },
  smith: { hair: '#1a1a1a', skin: '#b87850', cloth: '#5a3a2a', spot: '#ff8a3a' },
  scholar: { hair: '#6a6a6a', skin: '#f2c194', cloth: '#3a5a8a', spot: '#ffd23a', extra: 'glasses' },
  elite: { hair: '#e8e8e8', skin: '#c8885a', cloth: '#2a2a3a', spot: '#ff3a3a', extra: 'crown' },
  shaman: { hair: '#2a1a3a', skin: '#e8b890', cloth: '#c83a5a', spot: '#ffd23a' },
  trader: { hair: '#5a3a1a', skin: '#e8b080', cloth: '#a87a40', spot: '#5a3a1a', extra: 'bone' },
  // v3.0
  rival: { hair: '#c8202a', skin: '#f2c194', cloth: '#2a2a3a', spot: '#c8202a' },
  hermit: { hair: '#f0f0f0', skin: '#e8c0a0', cloth: '#5a7ab0', spot: '#2a3a6a' },
  trader2: { hair: '#3a3a5a', skin: '#e8b080', cloth: '#7a9ac8', spot: '#2a3a6a', extra: 'bone' },
  iceHunter: { hair: '#e8f0ff', skin: '#d89a6a', cloth: '#4a6a8a', spot: '#9ee8ff', extra: 'bone' },
  frostMage: { hair: '#9ee8ff', skin: '#f0d0c0', cloth: '#3a4a8a', spot: '#e8f8ff' },
  monk: { hair: '#2a1a10', skin: '#d89a6a', cloth: '#e8a030', spot: '#8a4a10' },
  oracle: { hair: '#f0e0a0', skin: '#f2c194', cloth: '#f8f0e0', spot: '#ffd23a', extra: 'crown' },
  priest: { hair: '#dddddd', skin: '#e8b890', cloth: '#f0e8d0', spot: '#7fe0b8' },
};

// 트레이너 · 보스 파티: sid, lv, 유전자(변이), 특성, 포식 보너스
export const TRAINERS = {
  // Stage 1
  dolsoe: {
    name: '꼬마 사냥꾼 돌쇠', look: 'hunter', reward: 60, map: 'village',
    party: [{ sid: 10, lv: 4 }],
    intro: ['너 그 스톤몬 처음 보는 놈이네!', '내 랩텅이가 먹어 주지! 덤벼!'],
    win: ['으아앙! 내 랩텅이가… 먹혀버렸어…', '…다음엔 더 센 놈을 잡아 올 거야!'],
    after: ['숲 깊은 곳(북쪽 구석)엔 레벨 높은 녀석들이 산대. 조심해…'],
  },
  nuri: {
    name: '채집꾼 누리', look: 'gatherer', reward: 90, map: 'village',
    party: [{ sid: 13, lv: 5 }, { sid: 51, lv: 6 }],
    intro: ['열매 따러 왔다가 너 같은 사냥감을 만났네?', '내 아이들, 배고프대!'],
    win: ['…둘 다 먹혔어. 이게 숲의 법이지.'],
    after: ['화상은 3턴, 독은 4턴이면 저절로 나아. 너무 겁먹지 마!', '같은 속성만 먹으면 그 속성 몬스터한테 강해져. 섞어 먹으면 이것저것 다 돋아나고!'],
  },
  bawi: {
    name: '사냥꾼 바위', look: 'brute', reward: 140, map: 'village',
    party: [{ sid: 22, lv: 7, genes: { earth: 3 } }, { sid: 25, lv: 8, genes: { primal: 3 } }],
    intro: ['사당에 가려는 놈은 다 나를 거쳐야 한다.', '숲의 수호자 앞에 서기 전에, 여기서 먹혀라!'],
    win: ['크윽… 내 사냥감이 나를 먹다니.', '좋다. 사당으로 가라. 넌 자격이 있다.'],
    after: ['숲의 수호자 파키파와 가르고는 다섯 번 이상 포식한 놈만 상대해 준다.'],
  },
  guardian: {
    name: '숲의 수호자', look: 'chief', reward: 400, boss: true, map: 'village',
    party: [
      { sid: 16, lv: 10, genes: { earth: 5 }, traits: { hide: 1 } },
      { sid: 48, lv: 11, genes: { earth: 6, grass: 3 }, traits: { sturdy: 1 } },
    ],
    intro: ['사당 깊은 곳에서 땅울림이 들려온다…', '무지개 골판의 파키파와 돌기 갑옷의 가르고 ─ 태초의 숲을 지키는 두 수호자가 깨어났다!'],
    win: ['수호자들이 쓰러지자 숲이 조용해졌다…', '동쪽 숲길 너머 「메아리의 습지」로 가는 길이 열렸다!'],
    after: ['사당은 고요하다. 동쪽 숲길(오른쪽 위)로 가면 메아리의 습지다.'],
  },
  // Stage 2
  gaegol: {
    name: '늪지 사냥꾼 개골', look: 'swamper', reward: 180, map: 'swamp',
    party: [{ sid: 58, lv: 13 }, { sid: 43, lv: 14, genes: { poison: 4 } }],
    intro: ['개굴! 습지에 처음 온 얼굴이군.', '내 딜로의 독맛 좀 볼래?'],
    win: ['개구울… 독도 안 통하다니.'],
    after: ['독은 최대 체력의 1/16씩, 4턴이면 빠져. 해독제 하나면 바로 낫고.'],
  },
  mir: {
    name: '독술사 미르', look: 'witch', reward: 220, map: 'swamp',
    party: [{ sid: 51, lv: 15, genes: { poison: 4, fire: 3 } }, { sid: 43, lv: 16, genes: { poison: 6 } }, { sid: 49, lv: 16, genes: { fire: 4 } }],
    intro: ['후후… 독과 불꽃, 둘 다 맛보게 해 주지.', '도깨비불에 타고, 독에 녹아라!'],
    win: ['내 저주가… 상성으로 정면 돌파당하다니!'],
    after: ['화상은 물리 공격력을 20% 깎아. 특수기(물대포·화염방사 같은)는 영향이 없지.'],
  },
  barami: {
    name: '협곡 등반가 바람이', look: 'climber', reward: 260, map: 'swamp',
    party: [{ sid: 65, lv: 17, genes: { wind: 4 } }, { sid: 68, lv: 18 }, { sid: 77, lv: 19, genes: { primal: 4 } }],
    intro: ['협곡 꼭대기까지 오르려면 날 넘어야 해!', '바람처럼 빠른 내 아이들을 따라올 수 있을까?'],
    win: ['헉헉… 너, 진짜 지배자한테 도전할 셈이야?'],
    after: ['협곡의 지배자 스피노와 알로는 북쪽 동굴에 있어. 물과 원시 속성이라는 걸 기억해.'],
  },
  canyonBoss: {
    name: '협곡의 지배자', look: 'chief', reward: 900, boss: true, map: 'swamp',
    party: [
      { sid: 31, lv: 21, genes: { water: 7, primal: 4 }, traits: { jaw: 1 }, bonus: 0.12 },
      { sid: 73, lv: 22, genes: { primal: 7, earth: 4 }, traits: { rage: 1, intimidate: 1 }, bonus: 0.12 },
    ],
    intro: ['동굴 안에 뼈가 산처럼 쌓여 있다…', '주황 돛의 스피노, 그리고 남색 비늘의 알로 ─ 협곡의 지배자들이 이빨을 드러낸다!'],
    win: ['지배자들이 쓰러졌다! 협곡에 메아리가 울려 퍼진다.', '북쪽 끝 협곡 길 너머 「작열하는 화산」으로 가는 길이 열렸다!'],
    after: ['동굴엔 뼈만 남았다. 북쪽 협곡 길로 가면 화산이다.'],
  },
  // Stage 3
  bulmoe: {
    name: '화산 대장장이 불뫼', look: 'smith', reward: 380, map: 'volcano', elite: true,
    party: [{ sid: 57, lv: 25, genes: { fire: 6 }, traits: { hide: 2 }, bonus: 0.14 }, { sid: 62, lv: 26, genes: { fire: 6, primal: 3 }, traits: { jaw: 2 }, bonus: 0.14 }],
    intro: ['용암으로 벼린 내 아이들이다.', '포식으로 단련한 네 녀석이 진짜 강철인지 시험해 주마!'],
    win: ['크핫! 좋은 담금질이었다!'],
    after: ['정예 셋을 모두 꺾어야 유적의 왕좌가 열린다.'],
  },
  gomun: {
    name: '유적 학자 고문', look: 'scholar', reward: 420, map: 'volcano', elite: true,
    party: [
      { sid: 56, lv: 27, genes: { poison: 6, earth: 3 }, traits: { regen: 2 }, bonus: 0.16 },
      { sid: 78, lv: 28, genes: { grass: 6 }, traits: { giant: 2 }, bonus: 0.16 },
      { sid: 80, lv: 28, genes: { thunder: 6, wind: 3 }, traits: { swift: 2 }, bonus: 0.16 },
    ],
    intro: ['유적의 비문에 따르면… 왕좌의 세 괴물은 모든 걸 먹어 치웠다고 하지.', '자네의 스톤몬이 그 기록에 남을 자격이 있는지 보세!'],
    win: ['흥미롭군… 자네의 아이는 정말 여러 특성을 품고 있어.'],
    after: ['왕좌의 라돈은 화염, 기가노는 원시, 기가는 물이야. 상성을 고르게 갖춰 가게.'],
  },
  krom: {
    name: '정예 사냥왕 크롬', look: 'elite', reward: 500, map: 'volcano', elite: true,
    party: [
      { sid: 93, lv: 30, genes: { wind: 8, fire: 4 }, traits: { crit: 2, flight: 1 }, bonus: 0.18 },
      { sid: 94, lv: 31, genes: { water: 8, poison: 4 }, traits: { jaw: 2, drain: 2 }, bonus: 0.18 },
      { sid: 84, lv: 32, genes: { grass: 8, wind: 4 }, traits: { crit: 2, sturdy: 2 }, bonus: 0.18 },
    ],
    intro: ['수백 마리를 먹어 치운 내 사냥단이다.', '왕좌 앞의 마지막 문. 먹거나, 먹히거나!'],
    win: ['…인정하지. 왕좌로 가라, 포식자여.'],
    after: ['왕좌의 세 괴물은 연달아 나온다. 동료를 충분히 키워 가라.'],
  },
  finalBoss: {
    name: '태초의 왕좌', look: 'chief', reward: 2000, boss: true, map: 'volcano',
    party: [
      { sid: 61, lv: 34, genes: { fire: 10, wind: 6 }, traits: { flameBody: 2, swift: 1 }, bonus: 0.12 },
      { sid: 89, lv: 35, genes: { primal: 10, earth: 4, fire: 3 }, traits: { jaw: 2, crit: 1 }, bonus: 0.12 },
      { sid: 90, lv: 36, genes: { water: 12, earth: 5 }, traits: { sturdy: 2, regen: 1 }, bonus: 0.12 },
    ],
    intro: [
      '유적의 왕좌에 피처럼 붉은 빛이 번진다…',
      '하늘을 불태우는 화염 비룡 라돈, 원시의 폭군 기가노, 그리고 유적 지하 호수의 거신 기가.',
      '태초부터 모든 것을 먹어 온 세 괴물이 너를 내려다본다!',
    ],
    win: ['세 괴물이 모두 쓰러졌다…', '왕좌의 붉은 빛이 너의 스톤몬에게 흘러든다.'],
    after: ['왕좌는 비어 있다. 유적 동쪽 끝 얼음 문 너머에서 차가운 바람이 불어온다…'],
  },
  // Stage 4
  harang: {
    name: '설원 사냥꾼 하람', look: 'iceHunter', reward: 650, map: 'glacier',
    party: [
      { sid: 63, lv: 38, genes: { ice: 8 }, traits: { giant: 2 }, bonus: 0.18 },
      { sid: 68, lv: 39, genes: { ice: 8, primal: 4 }, traits: { first: 2 }, bonus: 0.18 },
      { sid: 65, lv: 40, genes: { earth: 8, ice: 4 }, bonus: 0.18 },
    ],
    intro: ['눈보라 속에서 살아남는 법을 아나?', '…먼저 먹는 거다. 덤벼라!'],
    win: ['크윽… 눈보라도 네 기세를 못 막는군.'],
    after: ['빙하의 군주 도쿠는 독과 얼음을 함께 쓴다. 해독제를 넉넉히 챙겨.'],
  },
  seori: {
    name: '빙결술사 서리', look: 'frostMage', reward: 720, map: 'glacier',
    party: [
      { sid: 58, lv: 42, genes: { ice: 10 }, traits: { frostBody: 2 }, bonus: 0.2, skills: ['iceBreath', 'iceFang', 'blizzard', 'iceArmor'] },
      { sid: 56, lv: 43, genes: { poison: 8, ice: 6 }, traits: { regen: 2 }, bonus: 0.2 },
      { sid: 37, lv: 44, genes: { water: 8, ice: 6 }, traits: { jaw: 2 }, bonus: 0.2 },
    ],
    intro: ['만년설은 모든 것을 멈춘다. 네 심장도.', '얼어붙어라!'],
    win: ['…녹아내린 건 내 쪽이었나.'],
    after: ['얼음은 불·물·얼음에 약해. 바람·대지·풀에겐 강하고.'],
  },
  glacierBoss: {
    name: '빙하의 군주', look: 'chief', reward: 2600, boss: true, map: 'glacier',
    party: [
      { sid: 63, lv: 47, genes: { ice: 16, earth: 6 }, traits: { giant: 3, armor: 2 }, bonus: 0.2, skills: ['iceAge', 'stomp', 'iceArmor', 'quake'], alpha: true },
      { sid: 69, lv: 48, genes: { ice: 14, poison: 10 }, traits: { frostBody: 2, poisonPoint: 2, regen: 1 }, bonus: 0.22, skills: ['glacialLance', 'plague', 'toxic', 'iceFang'] },
    ],
    intro: [
      '얼음 굴 깊은 곳에서 빙하가 갈라지는 소리가 울린다…',
      '만년설의 엄니를 세운 메머 로드, 그리고 얼음 독을 품은 도쿠(변이체) ─ 빙하의 군주들이 깨어났다!',
    ],
    win: ['빙하의 군주가 무너지자 얼음 굴에 햇빛이 스며든다.', '북동쪽 얼음 계단 너머 「태고의 하늘 신전」으로 가는 길이 열렸다!'],
    after: ['얼음 굴은 고요하다. 북동쪽 얼음 계단을 오르면 하늘 신전이다.'],
  },
  // Stage 5
  un: {
    name: '하늘 수도승 운', look: 'monk', reward: 900, map: 'sky',
    party: [
      { sid: 80, lv: 52, genes: { wind: 12 }, traits: { swift: 3 }, bonus: 0.22, skills: ['gust', 'dive', 'storm', 'tailwind'] },
      { sid: 77, lv: 53, genes: { thunder: 12 }, traits: { intimidate: 2 }, bonus: 0.22, skills: ['thunderFang', 'volt', 'lightning', 'charge2'] },
      { sid: 81, lv: 54, genes: { wind: 10, thunder: 6 }, traits: { flight: 3 }, bonus: 0.22 },
    ],
    intro: ['구름 위에선 바람이 법이다.', '그대의 포식이 하늘에 닿는지 보겠다!'],
    win: ['…바람이 그대 편이군.'],
    after: ['신수 사르코는 심연의 물, 테라토는 대지, 디노는 태초의 불꽃을 다룬다.'],
  },
  ara: {
    name: '신전 무녀장 아라', look: 'oracle', reward: 1000, map: 'sky',
    party: [
      { sid: 93, lv: 56, genes: { water: 12, earth: 6 }, traits: { jaw: 3 }, bonus: 0.24 },
      { sid: 94, lv: 57, genes: { grass: 12, water: 6 }, traits: { giant: 3, regen: 2 }, bonus: 0.24, skills: ['gigaDrain', 'leafBlade', 'woodHammer', 'synthesis'] },
      { sid: 88, lv: 58, genes: { fire: 12, primal: 6 }, traits: { rage: 3 }, bonus: 0.24, skills: ['fireFang', 'flamethrower', 'heatUp', 'eruption'] },
    ],
    intro: ['신수들은 3천 년 동안 이 제단을 지켜 왔습니다.', '그 앞에 설 자격이 있는지… 제가 확인하겠습니다.'],
    win: ['…신수께서 그대를 기다리고 계십니다.'],
    after: ['세 신수는 연달아 나옵니다. 동료 넷을 모두 단련해 가세요.'],
  },
  skyBoss: {
    name: '고대 3대 신수', look: 'chief', reward: 6000, boss: true, map: 'sky',
    party: [
      { sid: 94, lv: 62, genes: { water: 18, grass: 12, poison: 6 }, traits: { giant: 4, regen: 2, drain: 2 }, bonus: 0.28, skills: ['abyss', 'gigaDrain', 'woodHammer', 'synthesis'], alpha: true },
      { sid: 93, lv: 63, genes: { earth: 18, water: 10 }, traits: { jaw: 4, armor: 2, sturdy: 2 }, bonus: 0.3, skills: ['crush', 'abyss', 'fang', 'quake'], alpha: true },
      { sid: 88, lv: 65, genes: { fire: 20, primal: 14, wind: 6 }, traits: { rage: 4, jaw: 3, first: 2 }, bonus: 0.32, skills: ['eruption', 'devourBite', 'flamethrower', 'heatUp'], alpha: true },
    ],
    intro: [
      '하늘 제단의 봉인이 풀리며 구름이 소용돌이친다…',
      '심연을 삼킨 사르코, 대지를 짊어진 테라토, 그리고 태초의 패왕 디노.',
      '고대 3대 신수가 차례로 깨어난다 ─ 총력전이다!',
    ],
    win: ['세 신수가 구름 아래로 무너져 내렸다…', '하늘 제단의 빛이 너의 스톤몬들에게 흘러든다.'],
    after: ['제단은 비어 있다. 동쪽 아래 원시 투기장에서 끝없는 도전이 기다린다.'],
  },
  // 라이벌 · 투기장 (파티는 그때그때 생성)
  rival: { name: '라이벌 카인', look: 'rival', reward: 300, party: [], intro: [], win: [], after: [] },
  arena: { name: '원시 투기장', look: 'elite', reward: 0, party: [], intro: [], win: [], after: [] },
};
export const ELITES = ['bulmoe', 'gomun', 'krom'];

const TABLE_SUM = (t) => t.reduce((a, b) => a + b[1], 0);
function rollTable(t) {
  let r = Math.random() * TABLE_SUM(t);
  for (const [id, w] of t) { r -= w; if (r <= 0) return id; }
  return t[0][0];
}

export function zoneAt(mapId, x, y) {
  return mapOf(mapId).zones.find((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) || mapOf(mapId).zones[0];
}

// 희귀 개체: 풀숲/동굴 전투의 5% → 고대 변종(이로치: 색 반전) 또는 알파 개체(붉은 오라). 둘 다 1.3배 크기
export const VARIANT_RATE = 0.05;
export function makeVariant(m, kind) {
  // v4.0: 알파는 무작위 속성 하나를 '습득한' 개체로 등장 (속성 포인트 컬러 + 입자 오라)
  if (kind === 'alpha') {
    m.alpha = true; m.lv = Math.min(100, m.lv + 3); wildBoost(m, 6);
    const el = pick(ELEMENT_KEYS.filter((k) => k !== SPECIES[m.sid].el));
    m.elFed[el] = Math.max(m.elFed[el] || 0, 10);
  } else { m.shiny = true; m.lv = Math.min(100, m.lv + 1); wildBoost(m, 3); }
  m.hp = maxHp(m);
  return m;
}

// 야생 개체: 지역 레벨대에서 출현(레벨이 진화 레벨 이상이면 진화형). 5% 확률로 변종. 무한 사냥 모드면 100종 전부 출현
export function rollWild(mapId, x, y, { leadLv = 5, devours = 0, endless = false, codex = null, variantRate = VARIANT_RATE } = {}) {
  const z = zoneAt(mapId, x, y);
  let sid = rollTable(WILD_TABLES[z.table]);
  let lv = Math.round(rand(z.lv[0], z.lv[1] + 0.99) - 0.49);
  if (endless && Math.random() < 0.3) {
    const all = Object.keys(SPECIES).map(Number);
    const missing = codex ? all.filter((id) => !codex.eaten?.[id] && !codex.owned?.[id]) : [];
    sid = missing.length && Math.random() < 0.7 ? pick(missing) : pick(all);
    lv = Math.max(z.lv[1], leadLv - 2) + Math.floor(Math.random() * 4);
  }
  lv = Math.max(1, Math.min(80, lv));
  const m = createMonster(sid, { lv });
  wildBoost(m, Math.floor(Math.random() * (2 + lv / 6)));
  // 지역 특유 속성 기운 (빙하 동굴: 설원종 · 하늘 신전: 천공종) — 일정 확률로 그 속성을 습득한 개체
  if (z.gene && z.gene !== SPECIES[m.sid].el && Math.random() < 0.3) m.elFed[z.gene] = 10;
  m.alpha = false;
  if (devours >= 1 && Math.random() < variantRate) makeVariant(m, Math.random() < 0.5 ? 'shiny' : 'alpha');
  return m;
}

// 트레이너 · 보스 파티 (skills: 기술 지정, alpha: 거대 개체)
function build({ sid, lv, genes, traits, bonus, skills, alpha, prey }) {
  const m = createMonster(sid, { lv, genes, extraTraits: traits, jitter: false, bonus: bonus || 0 });
  // v4.0: 트레이너 데이터의 genes 는 '속성 누적 포식'. 습득 속성은 가장 많은 2개까지만 (나머지는 9로)
  Object.entries(m.elFed).sort((x, y) => y[1] - x[1]).forEach(([el, n], i) => { if (i >= 2) m.elFed[el] = Math.min(9, n); });
  if (skills) m.skills = skills.filter((s) => SKILLS[s]).slice(0, 4);
  if (prey) { m.prey = { ...prey }; m.devours = Object.values(prey).reduce((a, b) => a + b, 0); }
  if (alpha) m.alpha = true;
  m.hp = maxHp(m);
  return m;
}
export function trainerParty(id) {
  return TRAINERS[id].party.map(build);
}

// ───────── 숙명의 라이벌 카인 ─────────
// 주인공이 고르지 않은, 주인공에게 상성 우위인 스타팅을 데려간다 (불→물, 풀→불, 물→풀)
export const RIVAL_OF = { 1: 7, 4: 1, 7: 4 };
export function rivalStarter(S) {
  if (S.rival?.sid) return S.rival.sid;
  const mine = S.starter || S.party?.map((m) => baseForm(m.sid)).find((id) => STARTERS.includes(id)) || STARTERS.find((id) => S.codex?.owned?.[id]);
  return RIVAL_OF[baseForm(mine)] || pick(STARTERS);
}
// 스테이지가 지날수록 카인의 스톤몬도 레벨업으로 진화하고, 포식으로 속성을 습득해 강해진다
const RIVAL_STAGES = {
  1: { lv: 10, genes: {}, prey: { 13: 1, 10: 2 }, bonus: 0.06, allies: [] },
  2: { lv: 21, genes: { wind: 6, primal: 4 }, prey: { 13: 3, 10: 2, 43: 1 }, bonus: 0.12, traits: { flight: 1, crit: 1 }, allies: [{ sid: 68, lv: 19, genes: { ice: 4 } }] },
  3: { lv: 33, genes: { wind: 8, poison: 8, earth: 4 }, prey: { 13: 4, 43: 3, 47: 2, 10: 2 }, bonus: 0.2, traits: { flight: 2, poisonPoint: 2, crit: 1 }, allies: [{ sid: 79, lv: 31, genes: { thunder: 6 }, bonus: 0.15 }, { sid: 82, lv: 32, genes: { fire: 6, wind: 4 }, bonus: 0.15 }] },
  4: { lv: 46, genes: { wind: 10, poison: 12, earth: 8, ice: 8 }, prey: { 13: 5, 43: 4, 47: 3, 63: 2, 10: 2 }, bonus: 0.26, traits: { flight: 2, poisonPoint: 3, crit: 2, giant: 2 }, allies: [{ sid: 58, lv: 44, genes: { ice: 10 }, bonus: 0.2 }, { sid: 82, lv: 45, genes: { fire: 10, wind: 6 }, bonus: 0.2 }] },
  5: { lv: 62, genes: { wind: 14, poison: 14, earth: 12, ice: 10, primal: 10 }, prey: { 13: 6, 43: 5, 47: 3, 63: 3, 89: 1, 10: 2 }, bonus: 0.32, traits: { flight: 3, poisonPoint: 3, crit: 3, giant: 3, jaw: 2 }, allies: [{ sid: 73, lv: 60, genes: { primal: 14 }, bonus: 0.26, traits: { crit: 2 } }, { sid: 82, lv: 60, genes: { fire: 14, wind: 8 }, bonus: 0.26 }, { sid: 85, lv: 61, genes: { water: 12, wind: 6 }, bonus: 0.26 }] },
};
export const RIVAL_REWARD = { 1: 200, 2: 500, 3: 900, 4: 1500, 5: 2500 };
export function rivalParty(stage, sid) {
  const R = RIVAL_STAGES[stage] || RIVAL_STAGES[1];
  const lead = build({ sid, lv: R.lv, genes: R.genes, traits: R.traits, bonus: R.bonus, prey: R.prey });
  // 스타팅 기술 + 포식으로 빼앗은 기술
  const stolen = { 1: [], 2: ['dive'], 3: ['dive', 'sludge'], 4: ['dive', 'plague', 'blizzard'], 5: ['skyRend', 'plague', 'iceAge'] }[stage] || [];
  lead.skills = [...stolen, ...lead.skills].filter((s, i, a) => SKILLS[s] && a.indexOf(s) === i).slice(0, 4);
  return [...R.allies.map(build), lead];
}

// ───────── 무한의 원시 투기장 ─────────
// 연승할수록 레벨·포식 보너스·변이·특성이 끝없이 강해진다. 5연승마다 알파 개체가 나온다
export function arenaEnemy(streak, leadLv) {
  const all = Object.keys(SPECIES).map(Number);
  const pool = all.filter((id) => SPECIES[id].tier <= (streak < 5 ? 3 : 4));
  const sid = streak >= 10 && Math.random() < 0.25 ? pick(all.filter((id) => SPECIES[id].tier >= 3)) : pick(pool);
  const lv = Math.min(100, Math.max(50, leadLv - 2) + Math.floor(streak * 1.2));
  const m = createMonster(sid, { lv, bonus: Math.min(0.5, 0.12 + streak * 0.012) });
  wildBoost(m, 8 + streak * 2);
  // v4.0: 플레이어의 포식 스탯은 무한히 오르므로 투기장 상대도 연승마다 포식 누적치를 쌓는다
  const sp = SPECIES[m.sid];
  for (const k of STAT_KEYS) m.fed[k] = sp.base[k] * (k === 'hp' ? 5 : 1) * streak * 0.6;
  if (streak >= 8) { const el = pick(ELEMENT_KEYS.filter((k) => k !== sp.el)); m.elFed[el] = 10; }
  const traitKeys = ['jaw', 'hide', 'giant', 'swift', 'crit', 'regen', 'armor', 'sturdy', 'rage', 'drain'];
  for (let i = 0; i < Math.floor(streak / 3); i++) { const t = pick(traitKeys); m.traits[t] = Math.min(5, (m.traits[t] || 0) + 1); }
  const boss = (streak + 1) % 5 === 0;
  if (boss) makeVariant(m, 'alpha');
  else if (Math.random() < 0.08) makeVariant(m, 'shiny');
  m.hp = maxHp(m);
  return m;
}

// ───────── 미확인 공룡알 ─────────
// 발견한 스테이지 출현표에서 희귀 이상 종이 우선. 태초의 숲 둥지에선 드물게 스타팅 종도 나온다
const STAGE_TABLES = { 1: ['s1'], 2: ['s2a', 's2b'], 3: ['s3a', 's3b'], 4: ['s4a', 's4b'], 5: ['s5a', 's5b'] };
export function eggSpecies(stage) {
  const ids = [...new Set((STAGE_TABLES[stage] || ['s1']).flatMap((t) => WILD_TABLES[t].map(([id]) => id)))];
  const rare = ids.filter((id) => SPECIES[id].tier >= 2);
  if (stage === 1 && Math.random() < 0.35) return pick(STARTERS);
  return pick(rare.length && Math.random() < 0.75 ? rare : ids);
}
export const EGG_LV = { 1: 5, 2: 14, 3: 26, 4: 38, 5: 50 };

// ───────── 도감: 출현 지역 ─────────
export const HABITAT = (() => {
  const h = {};
  const add = (id, txt) => { h[id] = h[id] || []; if (!h[id].includes(txt)) h[id].push(txt); };
  for (const [t, list] of Object.entries(WILD_TABLES)) for (const [id] of list) add(id, TABLE_REGION[t]);
  for (const T of Object.values(TRAINERS)) if (T.boss) for (const p of T.party) add(p.sid, `${T.name} (보스)`);
  for (const id of STARTERS) add(id, '스타팅 돌알 · 태초의 숲 알 둥지');
  for (const id of Object.keys(SPECIES)) if (!h[id]) add(Number(id), '무한 사냥');
  return h;
})();

// ───────── 필드 오브젝트: 고대 화석 바위 · 수상한 알 둥지 ─────────
export const OBJ_RESPAWN = 150; // 조사 후 다시 반짝이기까지 걸음 수
export function objectAt(mapId, x, y) {
  return (mapOf(mapId).objects || []).find((o) => o.x === x && o.y === y) || null;
}

export const isTall = (mapId, x, y) => ENCOUNTER.has(mapOf(mapId).grid[y]?.[x]);
export const tileAt = (mapId, x, y) => mapOf(mapId).grid[y]?.[x];
export function buildingAt(mapId, x, y) {
  return mapOf(mapId).buildings.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
}
export function warpAt(mapId, x, y) {
  return mapOf(mapId).warps.find((w) => w.x === x && w.y === y) || null;
}
export function blocked(mapId, x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  if (SOLID.has(mapOf(mapId).grid[y][x])) return true;
  if (objectAt(mapId, x, y)) return true;
  return !!buildingAt(mapId, x, y);
}
export function doorAt(mapId, x, y) {
  const b = buildingAt(mapId, x, y);
  if (!b) return null;
  if (b.doors === 'all') return b;
  return b.doors.some(([dx, dy]) => dx === x && dy === y) ? b : null;
}
