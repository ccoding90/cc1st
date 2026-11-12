// 🗺️ 스톤몬스터 v2.0 월드 - 스테이지 1~3 맵 · 건물 · NPC · 트레이너 · 보스 · 야생 출현표
import { createMonster, randomMutate, rand, pick } from './monster';
import { SPECIES } from './data';

export const MAP_W = 30, MAP_H = 26;
export const VIEW_W = 15, VIEW_H = 11; // 화면에 보이는 타일 수 (240x176 도트)

// 지형 문자
//  . 땅 / , 수풀·갈대(야생) / v 협곡 마른풀(야생) / a 화산재 풀(야생) / = 길 / c 협곡 바닥 / S 유적 바닥 / m 진흙
//  ~ 물 / W 폭포 / L 용암 / T 나무 / P 야자 / R 붉은 바위 / I 유적 기둥 / f 꽃 / r 바위 / # 뼈울타리 / s 표지판 / b 뼈무더기
const ENCOUNTER = new Set([',', 'v', 'a']);
const SOLID = new Set(['T', 'P', '~', 'W', 'L', 'R', 'I', 'r', '#', 's']);

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
    },
    warps: [
      { x: 14, y: 25, to: 'swamp', tx: 26, ty: 1, dir: 'down' },
      { x: 15, y: 25, to: 'swamp', tx: 27, ty: 1, dir: 'down' },
    ],
    zones: [
      { x0: 0, y0: 17, x1: 29, y1: 25, lv: [23, 28], table: 's3a' },
      { x0: 0, y0: 0, x1: 29, y1: 16, lv: [27, 33], table: 's3b' },
    ],
  },
};
export const MAP_IDS = Object.keys(MAPS);
export const mapOf = (id) => MAPS[id] || MAPS.village;

// 야생 출현표 [번호, 가중치]
export const WILD_TABLES = {
  s1: [[13, 10], [20, 9], [18, 9], [31, 9], [37, 8], [22, 8], [19, 7], [5, 10], [1, 9]],
  s2a: [[30, 9], [14, 10], [9, 8], [24, 7], [11, 6], [33, 9], [38, 8], [15, 6], [10, 7]],
  s2b: [[16, 9], [34, 9], [41, 8], [40, 3], [44, 9], [24, 6], [14, 6], [9, 6], [15, 5]],
  s3a: [[17, 8], [25, 9], [21, 5], [36, 9], [43, 6], [45, 9], [54, 9], [23, 5]],
  s3b: [[47, 7], [51, 4], [52, 8], [55, 9], [23, 7], [36, 6], [17, 7], [43, 6], [54, 5], [45, 5]],
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
};

// 트레이너 · 보스 파티: sid, lv, 유전자(변이), 특성, 포식 보너스
export const TRAINERS = {
  // Stage 1
  dolsoe: {
    name: '꼬마 사냥꾼 돌쇠', look: 'hunter', reward: 60, map: 'village',
    party: [{ sid: 1, lv: 4 }],
    intro: ['너 그 스톤몬 처음 보는 놈이네!', '내 랩텅이가 먹어 주지! 덤벼!'],
    win: ['으아앙! 내 랩텅이가… 먹혀버렸어…', '…다음엔 더 센 놈을 잡아 올 거야!'],
    after: ['숲 깊은 곳(북쪽 구석)엔 레벨 높은 녀석들이 산대. 조심해…'],
  },
  nuri: {
    name: '채집꾼 누리', look: 'gatherer', reward: 90, map: 'village',
    party: [{ sid: 5, lv: 5 }, { sid: 10, lv: 6 }],
    intro: ['열매 따러 왔다가 너 같은 사냥감을 만났네?', '내 아이들, 배고프대!'],
    win: ['…둘 다 먹혔어. 이게 숲의 법이지.'],
    after: ['화상은 3턴, 독은 4턴이면 저절로 나아. 너무 겁먹지 마!', '같은 속성만 먹으면 그 속성 몬스터한테 강해져. 섞어 먹으면 이것저것 다 돋아나고!'],
  },
  bawi: {
    name: '사냥꾼 바위', look: 'brute', reward: 140, map: 'village',
    party: [{ sid: 20, lv: 7, genes: { earth: 3 } }, { sid: 18, lv: 8, genes: { primal: 3 } }],
    intro: ['사당에 가려는 놈은 다 나를 거쳐야 한다.', '숲의 수호자 앞에 서기 전에, 여기서 먹혀라!'],
    win: ['크윽… 내 사냥감이 나를 먹다니.', '좋다. 사당으로 가라. 넌 자격이 있다.'],
    after: ['숲의 수호자 파키파와 가르고는 다섯 번 이상 포식한 놈만 상대해 준다.'],
  },
  guardian: {
    name: '숲의 수호자', look: 'chief', reward: 400, boss: true, map: 'village',
    party: [
      { sid: 8, lv: 10, genes: { earth: 5 }, traits: { hide: 1 } },
      { sid: 6, lv: 11, genes: { earth: 6, grass: 3 }, traits: { sturdy: 1 } },
    ],
    intro: ['사당 깊은 곳에서 땅울림이 들려온다…', '무지개 골판의 파키파와 돌기 갑옷의 가르고 ─ 태초의 숲을 지키는 두 수호자가 깨어났다!'],
    win: ['수호자들이 쓰러지자 숲이 조용해졌다…', '동쪽 숲길 너머 「메아리의 습지」로 가는 길이 열렸다!'],
    after: ['사당은 고요하다. 동쪽 숲길(오른쪽 위)로 가면 메아리의 습지다.'],
  },
  // Stage 2
  gaegol: {
    name: '늪지 사냥꾼 개골', look: 'swamper', reward: 180, map: 'swamp',
    party: [{ sid: 33, lv: 13 }, { sid: 24, lv: 14, genes: { poison: 4 } }],
    intro: ['개굴! 습지에 처음 온 얼굴이군.', '내 딜로의 독맛 좀 볼래?'],
    win: ['개구울… 독도 안 통하다니.'],
    after: ['독은 최대 체력의 1/16씩, 4턴이면 빠져. 해독제 하나면 바로 낫고.'],
  },
  mir: {
    name: '독술사 미르', look: 'witch', reward: 220, map: 'swamp',
    party: [{ sid: 10, lv: 15, genes: { poison: 4, fire: 3 } }, { sid: 24, lv: 16, genes: { poison: 6 } }, { sid: 9, lv: 16, genes: { fire: 4 } }],
    intro: ['후후… 독과 불꽃, 둘 다 맛보게 해 주지.', '도깨비불에 타고, 독에 녹아라!'],
    win: ['내 저주가… 상성으로 정면 돌파당하다니!'],
    after: ['화상은 물리 공격력을 20% 깎아. 특수기(물대포·화염방사 같은)는 영향이 없지.'],
  },
  barami: {
    name: '협곡 등반가 바람이', look: 'climber', reward: 260, map: 'swamp',
    party: [{ sid: 39, lv: 17, genes: { wind: 4 } }, { sid: 44, lv: 18 }, { sid: 35, lv: 19, genes: { primal: 4 } }],
    intro: ['협곡 꼭대기까지 오르려면 날 넘어야 해!', '바람처럼 빠른 내 아이들을 따라올 수 있을까?'],
    win: ['헉헉… 너, 진짜 지배자한테 도전할 셈이야?'],
    after: ['협곡의 지배자 스피노와 알로는 북쪽 동굴에 있어. 물과 원시 속성이라는 걸 기억해.'],
  },
  canyonBoss: {
    name: '협곡의 지배자', look: 'chief', reward: 900, boss: true, map: 'swamp',
    party: [
      { sid: 7, lv: 21, genes: { water: 7, primal: 4 }, traits: { jaw: 1 }, bonus: 0.12 },
      { sid: 12, lv: 22, genes: { primal: 7, earth: 4 }, traits: { rage: 1, intimidate: 1 }, bonus: 0.12 },
    ],
    intro: ['동굴 안에 뼈가 산처럼 쌓여 있다…', '주황 돛의 스피노, 그리고 남색 비늘의 알로 ─ 협곡의 지배자들이 이빨을 드러낸다!'],
    win: ['지배자들이 쓰러졌다! 협곡에 메아리가 울려 퍼진다.', '북쪽 끝 협곡 길 너머 「작열하는 화산」으로 가는 길이 열렸다!'],
    after: ['동굴엔 뼈만 남았다. 북쪽 협곡 길로 가면 화산이다.'],
  },
  // Stage 3
  bulmoe: {
    name: '화산 대장장이 불뫼', look: 'smith', reward: 380, map: 'volcano', elite: true,
    party: [{ sid: 25, lv: 25, genes: { fire: 6 }, traits: { hide: 2 }, bonus: 0.14 }, { sid: 17, lv: 26, genes: { fire: 6, primal: 3 }, traits: { jaw: 2 }, bonus: 0.14 }],
    intro: ['용암으로 벼린 내 아이들이다.', '포식으로 단련한 네 녀석이 진짜 강철인지 시험해 주마!'],
    win: ['크핫! 좋은 담금질이었다!'],
    after: ['정예 셋을 모두 꺾어야 유적의 왕좌가 열린다.'],
  },
  gomun: {
    name: '유적 학자 고문', look: 'scholar', reward: 420, map: 'volcano', elite: true,
    party: [
      { sid: 53, lv: 27, genes: { poison: 6, earth: 3 }, traits: { regen: 2 }, bonus: 0.16 },
      { sid: 56, lv: 28, genes: { grass: 6 }, traits: { giant: 2 }, bonus: 0.16 },
      { sid: 27, lv: 28, genes: { thunder: 6, wind: 3 }, traits: { swift: 2 }, bonus: 0.16 },
    ],
    intro: ['유적의 비문에 따르면… 왕좌의 세 괴물은 모든 걸 먹어 치웠다고 하지.', '자네의 스톤몬이 그 기록에 남을 자격이 있는지 보세!'],
    win: ['흥미롭군… 자네의 아이는 정말 여러 특성을 품고 있어.'],
    after: ['왕좌의 라돈은 화염, 기가노는 원시, 기가는 물이야. 상성을 고르게 갖춰 가게.'],
  },
  krom: {
    name: '정예 사냥왕 크롬', look: 'elite', reward: 500, map: 'volcano', elite: true,
    party: [
      { sid: 49, lv: 30, genes: { wind: 8, fire: 4 }, traits: { crit: 2, flight: 1 }, bonus: 0.18 },
      { sid: 48, lv: 31, genes: { water: 8, poison: 4 }, traits: { jaw: 2, drain: 2 }, bonus: 0.18 },
      { sid: 23, lv: 32, genes: { grass: 8, wind: 4 }, traits: { crit: 2, sturdy: 2 }, bonus: 0.18 },
    ],
    intro: ['수백 마리를 먹어 치운 내 사냥단이다.', '왕좌 앞의 마지막 문. 먹거나, 먹히거나!'],
    win: ['…인정하지. 왕좌로 가라, 포식자여.'],
    after: ['왕좌의 세 괴물은 연달아 나온다. 동료를 충분히 키워 가라.'],
  },
  finalBoss: {
    name: '태초의 왕좌', look: 'chief', reward: 2000, boss: true, map: 'volcano',
    party: [
      { sid: 26, lv: 34, genes: { fire: 10, wind: 6 }, traits: { flameBody: 2, swift: 1 }, bonus: 0.12 },
      { sid: 29, lv: 35, genes: { primal: 10, earth: 4, fire: 3 }, traits: { jaw: 2, crit: 1 }, bonus: 0.12 },
      { sid: 28, lv: 36, genes: { water: 12, earth: 5 }, traits: { sturdy: 2, regen: 1 }, bonus: 0.12 },
    ],
    intro: [
      '유적의 왕좌에 피처럼 붉은 빛이 번진다…',
      '하늘을 불태우는 화염 비룡 라돈, 원시의 폭군 기가노, 그리고 유적 지하 호수의 거신 기가.',
      '태초부터 모든 것을 먹어 온 세 괴물이 너를 내려다본다!',
    ],
    win: ['세 괴물이 모두 쓰러졌다…', '왕좌의 붉은 빛이 너의 스톤몬에게 흘러든다.'],
    after: ['왕좌는 비어 있다. 이제 이 땅의 최상위 포식자는 너다.'],
  },
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

// 야생 개체: 지역 레벨대에서 출현. 가끔 '우두머리'(+3Lv, 변이 多). 무한 사냥 모드면 56종 전부 출현
export function rollWild(mapId, x, y, { leadLv = 5, devours = 0, endless = false, codex = null } = {}) {
  const z = zoneAt(mapId, x, y);
  let sid = rollTable(WILD_TABLES[z.table]);
  let lv = Math.round(rand(z.lv[0], z.lv[1] + 0.99) - 0.49);
  if (endless && Math.random() < 0.3) {
    const all = Object.keys(SPECIES).map(Number);
    const missing = codex ? all.filter((id) => !codex.eaten?.[id] && !codex.owned?.[id]) : [];
    sid = missing.length && Math.random() < 0.7 ? pick(missing) : pick(all);
    lv = Math.max(z.lv[1], leadLv - 2) + Math.floor(Math.random() * 4);
  }
  const alpha = devours >= 2 && Math.random() < 0.07;
  if (alpha) lv += 3;
  lv = Math.max(1, Math.min(60, lv));
  const m = createMonster(sid, { lv });
  randomMutate(m, Math.floor(Math.random() * (2 + lv / 3)) + (alpha ? 6 : 0));
  m.alpha = alpha;
  return m;
}

export function trainerParty(id) {
  return TRAINERS[id].party.map(({ sid, lv, genes, traits, bonus }) => createMonster(sid, { lv, genes, extraTraits: traits, jitter: false, bonus: bonus || 0 }));
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
  return !!buildingAt(mapId, x, y);
}
export function doorAt(mapId, x, y) {
  const b = buildingAt(mapId, x, y);
  if (!b) return null;
  if (b.doors === 'all') return b;
  return b.doors.some(([dx, dy]) => dx === x && dy === y) ? b : null;
}
