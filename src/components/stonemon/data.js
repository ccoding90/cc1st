// 🦖 스톤몬스터 v3.0 - 정적 기획 데이터 (속성 · 상성 · 기술 · 특성 · 스톤몬 56종 · 스테이지 1~5)
// 레벨(전투 경험치)로 기본 체급이 오르고, '포식'으로 능력치 보너스·유전자·특성·기술을 흡수해 끝없이 변이한다.

export const ELEMENTS = {
  primal: { name: '원시', color: '#c8a070', icon: '🦴', prefix: '폭군' },
  fire: { name: '화염', color: '#ff6a3d', icon: '🔥', prefix: '화염' },
  water: { name: '물', color: '#3fa9f5', icon: '💧', prefix: '심해' },
  grass: { name: '풀', color: '#5cc84a', icon: '🌿', prefix: '정글' },
  thunder: { name: '번개', color: '#ffd93d', icon: '⚡', prefix: '뇌전' },
  wind: { name: '바람', color: '#7fe0b8', icon: '🌪️', prefix: '천공' },
  earth: { name: '대지', color: '#b07b48', icon: '🪨', prefix: '암반' },
  ice: { name: '얼음', color: '#9ee8ff', icon: '❄️', prefix: '빙결' },
  poison: { name: '독', color: '#b05cff', icon: '☠️', prefix: '맹독' },
};
export const ELEMENT_KEYS = Object.keys(ELEMENTS);

// 상성표: 공격 속성 → { 방어측 핵 속성: 배율 }
//  유리 1.5배 · 천적 2.0배 · 보통 1.0배 · 불리 0.5배
export const TYPE_CHART = {
  primal: {},
  fire: { grass: 2, ice: 1.5, poison: 1.5, water: 0.5, earth: 0.5, fire: 0.5 },
  water: { fire: 2, earth: 1.5, water: 0.5, grass: 0.5, ice: 0.5 },
  grass: { water: 1.5, earth: 2, fire: 0.5, grass: 0.5, poison: 0.5, wind: 0.5 },
  thunder: { water: 1.5, wind: 2, earth: 0.5, thunder: 0.5, grass: 0.5 },
  wind: { grass: 1.5, poison: 1.5, earth: 1.5, thunder: 0.5, ice: 0.5 },
  earth: { thunder: 2, fire: 1.5, poison: 1.5, wind: 0.5, grass: 0.5 },
  ice: { wind: 1.5, earth: 1.5, grass: 1.5, fire: 0.5, water: 0.5, ice: 0.5 },
  poison: { water: 1.5, primal: 1.5, grass: 2, earth: 0.5, poison: 0.5 },
};
// 호환용: 효과 굉장 / 효과 별로 목록
export const STRONG = Object.fromEntries(ELEMENT_KEYS.map((k) => [k, Object.keys(TYPE_CHART[k]).filter((d) => TYPE_CHART[k][d] > 1)]));
export const WEAK = Object.fromEntries(ELEMENT_KEYS.map((k) => [k, Object.keys(TYPE_CHART[k]).filter((d) => TYPE_CHART[k][d] < 1)]));

// 기술: pow 위력, acc 명중, crit 급소 단계, sp 특수기(화상의 물리 공격 감소 영향 없음)
// 부가효과: st/p 상태이상 · buff 자기 강화 · debuff/p 약화 · heal 회복 · drain 흡혈 · recoil 반동 · flinch 움찔 · prio 선제
export const SKILLS = {
  // 원시
  tackle: { name: '몸통박치기', el: 'primal', pow: 40, acc: 100, desc: '온몸으로 들이받는다.' },
  scratch: { name: '할퀴기', el: 'primal', pow: 40, acc: 100, crit: 1, desc: '발톱으로 할퀸다. 급소에 잘 맞는다.' },
  bite: { name: '물기', el: 'primal', pow: 60, acc: 100, flinch: 0.2, desc: '꽉 문다. 상대가 움찔할 때가 있다.' },
  fang: { name: '날카로운 이빨', el: 'primal', pow: 80, acc: 95, crit: 1, desc: '톱니 같은 이빨로 찢는다.' },
  roar: { name: '포효', el: 'primal', pow: 0, acc: 100, buff: { atk: 1 }, desc: '울부짖어 공격이 오른다.' },
  tailWhip: { name: '꼬리치기', el: 'primal', pow: 65, acc: 100, debuff: { def: -1 }, p: 0.3, desc: '꼬리로 후려친다. 방어를 깎을 때가 있다.' },
  stomp: { name: '짓밟기', el: 'primal', pow: 85, acc: 95, flinch: 0.2, desc: '거대한 발로 짓밟는다.' },
  charge: { name: '돌진', el: 'primal', pow: 95, acc: 95, recoil: 0.25, desc: '전력으로 돌진한다. 반동을 입는다.' },
  devourBite: { name: '대포식', el: 'primal', pow: 120, acc: 85, drain: 0.3, desc: '상대를 통째로 삼키려 든다. 피해의 일부를 회복.' },
  // 대지
  sand: { name: '모래뿌리기', el: 'earth', pow: 0, acc: 100, debuff: { spd: -1 }, p: 1, desc: '모래를 뿌려 상대 스피드를 떨어뜨린다.' },
  headbutt: { name: '박치기', el: 'earth', pow: 70, acc: 100, flinch: 0.3, desc: '돌머리로 들이받는다.' },
  rockDrop: { name: '바위떨구기', el: 'earth', pow: 55, acc: 95, desc: '머리 위로 바위를 떨군다.' },
  rockArmor: { name: '돌갑옷', el: 'earth', pow: 0, acc: 100, buff: { def: 2 }, desc: '돌을 둘러 방어가 크게 오른다.' },
  quake: { name: '지진', el: 'earth', pow: 100, acc: 100, desc: '땅을 뒤흔든다.' },
  crush: { name: '대지분쇄', el: 'earth', pow: 130, acc: 80, desc: '대지째 짓눌러 부순다.' },
  // 화염
  ember: { name: '불씨', el: 'fire', pow: 40, acc: 100, sp: 1, st: 'burn', p: 0.1, desc: '작은 불씨. 화상을 입힐 때가 있다.' },
  fireFang: { name: '화염이빨', el: 'fire', pow: 65, acc: 95, st: 'burn', p: 0.1, desc: '불붙은 이빨로 문다.' },
  willo: { name: '도깨비불', el: 'fire', pow: 0, acc: 85, st: 'burn', p: 1, desc: '푸른 불꽃으로 상대를 화상 입힌다.' },
  flamethrower: { name: '화염방사', el: 'fire', pow: 90, acc: 100, sp: 1, st: 'burn', p: 0.1, desc: '목구멍에서 불길을 뿜는다.' },
  heatUp: { name: '열기폭주', el: 'fire', pow: 0, acc: 100, buff: { atk: 2, def: -1 }, desc: '몸을 달궈 공격이 크게 오르고 방어가 내려간다.' },
  eruption: { name: '용암분출', el: 'fire', pow: 125, acc: 85, sp: 1, st: 'burn', p: 0.2, desc: '용암을 토해낸다.' },
  // 물
  waterGun: { name: '물대포', el: 'water', pow: 40, acc: 100, sp: 1, desc: '물을 세차게 쏜다.' },
  aquaPillar: { name: '물기둥', el: 'water', pow: 65, acc: 100, sp: 1, desc: '발밑에서 물기둥이 솟는다.' },
  tidal: { name: '해일', el: 'water', pow: 95, acc: 90, sp: 1, desc: '거대한 파도로 덮친다.' },
  aquaRing: { name: '아쿠아링', el: 'water', pow: 0, acc: 100, heal: 0.4, desc: '물의 고리로 체력을 40% 회복한다.' },
  abyss: { name: '심해압살', el: 'water', pow: 120, acc: 85, debuff: { def: -1 }, p: 0.3, desc: '심해의 수압으로 짓누른다.' },
  // 풀
  vineWhip: { name: '덩굴채찍', el: 'grass', pow: 40, acc: 100, desc: '가시 덩굴로 후려친다.' },
  razorLeaf: { name: '잎날가르기', el: 'grass', pow: 55, acc: 95, crit: 1, desc: '날카로운 잎사귀를 날린다. 급소에 잘 맞는다.' },
  leafBlade: { name: '리프블레이드', el: 'grass', pow: 80, acc: 100, crit: 1, desc: '잎사귀 칼날로 벤다.' },
  gigaDrain: { name: '기가드레인', el: 'grass', pow: 70, acc: 100, sp: 1, drain: 0.5, desc: '양분을 빨아들인다. 피해의 절반을 회복.' },
  synthesis: { name: '광합성', el: 'grass', pow: 0, acc: 100, heal: 0.4, desc: '햇빛을 받아 체력을 40% 회복한다.' },
  woodHammer: { name: '우드해머', el: 'grass', pow: 115, acc: 90, recoil: 0.25, desc: '통나무 같은 몸으로 내리찍는다. 반동을 입는다.' },
  // 번개
  shock: { name: '전기충격', el: 'thunder', pow: 40, acc: 100, sp: 1, st: 'para', p: 0.15, desc: '전기를 흘린다. 마비시킬 때가 있다.' },
  thunderFang: { name: '번개이빨', el: 'thunder', pow: 65, acc: 95, st: 'para', p: 0.15, desc: '전기를 두른 이빨로 문다.' },
  volt: { name: '10만볼트', el: 'thunder', pow: 90, acc: 100, sp: 1, st: 'para', p: 0.1, desc: '강력한 전격을 날린다.' },
  charge2: { name: '충전', el: 'thunder', pow: 0, acc: 100, buff: { atk: 1, spd: 1 }, desc: '전기를 모아 공격과 스피드가 오른다.' },
  lightning: { name: '낙뢰', el: 'thunder', pow: 120, acc: 75, sp: 1, st: 'para', p: 0.3, desc: '하늘에서 벼락을 떨어뜨린다.' },
  // 바람
  wingBeat: { name: '날개치기', el: 'wind', pow: 50, acc: 100, desc: '날개로 후려친다.' },
  gust: { name: '회오리', el: 'wind', pow: 65, acc: 100, sp: 1, desc: '회오리바람으로 감싼다.' },
  dive: { name: '급강하', el: 'wind', pow: 80, acc: 95, prio: 1, desc: '하늘에서 내리꽂는다. 반드시 먼저 공격.' },
  slash: { name: '질풍가르기', el: 'wind', pow: 75, acc: 100, crit: 1, desc: '바람의 칼날. 급소에 잘 맞는다.' },
  tailwind: { name: '순풍', el: 'wind', pow: 0, acc: 100, buff: { spd: 2 }, desc: '바람을 타 스피드가 크게 오른다.' },
  storm: { name: '폭풍', el: 'wind', pow: 120, acc: 80, sp: 1, desc: '모든 것을 날려버리는 폭풍.' },
  // 얼음
  iceBreath: { name: '얼음숨결', el: 'ice', pow: 40, acc: 100, sp: 1, st: 'frz', p: 0.1, desc: '차가운 숨. 얼릴 때가 있다.' },
  iceFang: { name: '얼음이빨', el: 'ice', pow: 65, acc: 95, st: 'frz', p: 0.1, desc: '얼음 이빨로 문다.' },
  blizzard: { name: '눈보라', el: 'ice', pow: 95, acc: 85, sp: 1, st: 'frz', p: 0.1, desc: '맹렬한 눈보라.' },
  iceArmor: { name: '빙결막', el: 'ice', pow: 0, acc: 100, buff: { def: 1, spd: 1 }, desc: '얼음막을 둘러 방어와 스피드가 오른다.' },
  iceAge: { name: '빙하기', el: 'ice', pow: 130, acc: 80, sp: 1, st: 'frz', p: 0.2, desc: '세상을 얼려버린 그날의 냉기.' },
  // 독
  sting: { name: '독침', el: 'poison', pow: 40, acc: 100, st: 'psn', p: 0.3, desc: '독침으로 찌른다. 중독시킬 때가 있다.' },
  venomFang: { name: '독니', el: 'poison', pow: 65, acc: 95, st: 'psn', p: 0.3, desc: '독이 밴 이빨로 문다.' },
  sludge: { name: '오물폭탄', el: 'poison', pow: 90, acc: 100, sp: 1, st: 'psn', p: 0.3, desc: '썩은 오물을 퍼붓는다.' },
  toxic: { name: '맹독', el: 'poison', pow: 0, acc: 90, st: 'psn', p: 1, desc: '상대를 확실히 중독시킨다.' },
  acid: { name: '부식액', el: 'poison', pow: 50, acc: 100, sp: 1, debuff: { def: -1 }, p: 0.5, desc: '녹이는 액체. 방어를 깎을 때가 많다.' },
  plague: { name: '역병', el: 'poison', pow: 115, acc: 85, sp: 1, st: 'psn', p: 0.5, desc: '고대의 역병을 퍼뜨린다.' },
  // ── v3.0 희귀 기술: 고대 변종(이로치)·알파 개체를 포식해야만 전수된다 ──
  ancientFang: { name: '고대의 송곳니', el: 'primal', pow: 100, acc: 95, crit: 1, drain: 0.2, rare: 1, desc: '[희귀] 태고의 송곳니로 물어뜯고 피를 마신다.' },
  solarFlare: { name: '태양폭염', el: 'fire', pow: 110, acc: 90, sp: 1, st: 'burn', p: 0.3, rare: 1, desc: '[희귀] 작은 태양을 터뜨린다. 화상을 잘 입힌다.' },
  primeTide: { name: '태고의 해류', el: 'water', pow: 110, acc: 90, sp: 1, drain: 0.25, rare: 1, desc: '[희귀] 원시 바다의 해류가 생명력을 빼앗는다.' },
  worldTree: { name: '세계수의 분노', el: 'grass', pow: 110, acc: 90, drain: 0.3, rare: 1, desc: '[희귀] 세계수의 뿌리가 대지를 뚫고 솟는다.' },
  skyHammer: { name: '천뢰', el: 'thunder', pow: 110, acc: 85, sp: 1, st: 'para', p: 0.3, rare: 1, desc: '[희귀] 하늘이 내리치는 망치. 마비시킬 때가 많다.' },
  skyRend: { name: '천공 가르기', el: 'wind', pow: 95, acc: 95, prio: 1, crit: 1, rare: 1, desc: '[희귀] 하늘을 가르며 반드시 먼저 공격한다.' },
  tectonic: { name: '지각 붕괴', el: 'earth', pow: 120, acc: 85, debuff: { def: -1 }, p: 0.4, rare: 1, desc: '[희귀] 판을 뒤엎어 상대를 짓누른다.' },
  glacialLance: { name: '빙하창', el: 'ice', pow: 110, acc: 85, sp: 1, st: 'frz', p: 0.25, rare: 1, desc: '[희귀] 만년설로 벼린 창을 던진다.' },
  miasma: { name: '원시 독무', el: 'poison', pow: 105, acc: 90, sp: 1, st: 'psn', p: 0.6, rare: 1, desc: '[희귀] 태고의 늪에서 피어난 독안개.' },
};
// 변종 포식 시 전수되는 속성별 희귀 기술
export const RARE_SKILL = {
  primal: 'ancientFang', fire: 'solarFlare', water: 'primeTide', grass: 'worldTree', thunder: 'skyHammer',
  wind: 'skyRend', earth: 'tectonic', ice: 'glacialLance', poison: 'miasma',
};

// 특성(패시브): 포식하면 상대의 특성이 흡수되고, 같은 특성은 레벨이 오른다(최대 5)
export const TRAITS = {
  jaw: { name: '포식자의 턱', desc: '공격 +6%/Lv' },
  hide: { name: '단단한 피부', desc: '방어 +6%/Lv' },
  giant: { name: '거대한 체구', desc: '최대 체력 +6%/Lv' },
  flight: { name: '비행', desc: '회피 +4%/Lv' },
  swift: { name: '질풍', desc: '스피드 +6%/Lv' },
  staticSkin: { name: '전기 피부', desc: '맞으면 8%/Lv 확률로 상대 마비' },
  flameBody: { name: '불꽃 몸', desc: '맞으면 8%/Lv 확률로 상대 화상' },
  poisonPoint: { name: '독가시', desc: '맞으면 8%/Lv 확률로 상대 중독' },
  frostBody: { name: '냉기 몸', desc: '맞으면 6%/Lv 확률로 상대 빙결' },
  regen: { name: '재생', desc: '매 턴 최대 체력 2%/Lv 회복' },
  armor: { name: '철갑', desc: '받는 피해 -4%/Lv' },
  crit: { name: '급소 노리기', desc: '급소율 +3%/Lv' },
  drain: { name: '흡혈', desc: '준 피해의 4%/Lv 회복' },
  rage: { name: '분노', desc: '체력 1/3 이하에서 공격 +12%/Lv' },
  glutton: { name: '대식가', desc: '포식 흡수량 +15%/Lv' },
  first: { name: '선제', desc: '12%/Lv 확률로 먼저 행동' },
  intimidate: { name: '위압', desc: '전투 시작 시 상대 공격 -5%/Lv' },
  sturdy: { name: '끈질김', desc: '치명상에서 20%/Lv 확률로 체력 1 버팀(전투당 1회)' },
};
export const TRAIT_MAX = 5; // v2.0: 특성 중첩 상한 10 → 5 (포식 무한 반복 시 폭주 방지)

// 스테이지 (v3.0: 1~5단계 + 엔드게임 원시 투기장)
export const STAGES = {
  1: { name: '태초의 숲', lv: '1~10', open: true },
  2: { name: '메아리의 습지 & 협곡', lv: '11~22', open: true },
  3: { name: '작열하는 화산 & 고대 유적', lv: '23~35', open: true },
  4: { name: '만년설의 빙하 동굴', lv: '36~48', open: true },
  5: { name: '태고의 하늘 신전', lv: '49~65', open: true },
  0: { name: '미확인 · 무한 사냥', lv: '클리어 후', open: true },
};

// 스톤몬 56종 (도감 STONE MONSTERS 1 · 2)
// [번호, 이름, 체형, 속성, 등급(1~4), 체력, 공격, 방어, 스피드, 기술(습득 순), 특성, 서식 스테이지, 색상[몸, 배, 포인트], 크기, 도감 설명, 외형 옵션]
const RAW = [
  // ── 시리즈 1 ──
  [1, '랩텅이', 'raptor', 'primal', 1, 36, 13, 7, 15, ['scratch', 'bite', 'roar', 'fang'], 'crit', 1, ['#3a6ad8', '#e8f0ff', '#2a3a8a'], 0.9, '파란 줄무늬의 꼬마 랩터. 무리 지어 숲을 달리며 낫 같은 발톱으로 급소를 노린다.'],
  [2, '티랑이', 'rex', 'fire', 1, 50, 14, 10, 10, ['scratch', 'ember', 'roar', 'fireFang'], 'jaw', 1, ['#e8443a', '#ffd99a', '#b8321e'], 1, '[스타팅 · 불/육식] 화산 기슭의 돌알에서 깨어난 꼬마 폭군. 콧김에서 불씨가 튄다. 먹을수록 턱이 커진다.'],
  [3, '케톱스', 'trike', 'grass', 1, 50, 11, 14, 8, ['tackle', 'vineWhip', 'synthesis', 'leafBlade'], 'hide', 1, ['#58b848', '#e8f6b8', '#3a8a2a'], 1, '[스타팅 · 풀/초식] 초록 프릴과 세 개의 뿔. 햇볕을 쬐면 상처가 아문다.'],
  [4, '브퉁이', 'sauro', 'water', 1, 60, 10, 11, 7, ['tailWhip', 'waterGun', 'aquaRing', 'aquaPillar'], 'giant', 1, ['#4aa8e8', '#d8f0ff', '#2a6aa8'], 1, '[스타팅 · 물/초식] 목이 긴 하늘색 물놀이 대장. 꼬리 한 번에 물기둥이 솟는다.'],
  [5, '프테라', 'ptero', 'wind', 1, 32, 10, 7, 15, ['wingBeat', 'dive', 'tailwind', 'gust'], 'flight', 1, ['#9a7ad8', '#ece0ff', '#ff9f43'], 0.9, '숲의 돌알을 훔쳐 가는 말썽꾸러기 보라 익룡. 하늘에서 내리꽂는 급강하가 특기.'],
  [6, '가르고', 'ankylo', 'earth', 2, 58, 13, 18, 5, ['tackle', 'rockDrop', 'rockArmor', 'headbutt'], 'hide', 1, ['#8a6a4a', '#e0d0a8', '#5a4a35'], 1.1, '[숲의 수호자] 돌기 갑옷을 두른 숲의 문지기. 꼬리 곤봉에 맞으면 뼈가 가루가 된다.'],
  [7, '스피노', 'spino', 'water', 3, 80, 20, 15, 11, ['aquaPillar', 'bite', 'tidal', 'fang'], 'rage', 2, ['#f08a3a', '#ffe0b0', '#e05a3a'], 1.25, '[협곡의 지배자] 주황 돛을 세운 물가의 최상위 포식자. 악어 주둥이로 물고기를 낚는다.'],
  [8, '파키파', 'stego', 'earth', 2, 50, 14, 15, 8, ['headbutt', 'tackle', 'rockDrop', 'rockArmor'], 'sturdy', 1, ['#7ac850', '#f0f0b0', '#ff7a3a'], 1.05, '[숲의 수호자] 무지개색 골판을 세운 숲의 수호자. 골판 색이 바뀌면 화가 난 것이다.'],
  [9, '디메토', 'pachy', 'earth', 1, 44, 13, 12, 9, ['headbutt', 'tackle', 'sand', 'rockDrop'], 'sturdy', 2, ['#f0c840', '#fff0b0', '#a8a8a8'], 0.95, '노란 돌머리 꼬마. 습지 바위에 머리를 박으며 박치기를 연습한다.'],
  [10, '코기', 'dimetro', 'fire', 1, 34, 12, 8, 13, ['ember', 'sting', 'willo', 'fireFang'], 'flameBody', 2, ['#e04a3a', '#ffc8a0', '#a82a1a'], 0.9, '붉은 돛의 작은 도마뱀. 독침과 도깨비불을 함께 쓰는 습지의 장난꾸러기.'],
  [11, '모사리', 'plesio', 'water', 2, 62, 17, 12, 13, ['bite', 'aquaPillar', 'tidal', 'abyss'], 'jaw', 2, ['#2a9ac0', '#c8f0f8', '#1a5a8a'], 1.1, '습지 깊은 물웅덩이를 헤엄치는 해룡. 웃는 얼굴로 다가와 무엇이든 끌고 들어간다.'],
  [12, '알로', 'rex', 'primal', 3, 78, 22, 14, 13, ['bite', 'fang', 'roar', 'stomp'], 'crit', 2, ['#2a3a7a', '#e0e8f0', '#c03a2a'], 1.25, '[협곡의 지배자] 남색 비늘의 사냥꾼. 협곡을 피로 물들인 지배자.'],
  [13, '토롱이', 'saber', 'grass', 1, 40, 10, 9, 12, ['tackle', 'vineWhip', 'synthesis', 'razorLeaf'], 'regen', 1, ['#a87a4a', '#f8e8c8', '#e88a8a'], 0.8, '긴 귀를 쫑긋 세운 숲의 꼬마. 볼에 열매를 가득 채우고 깡충깡충 뛰어다닌다.'],
  [14, '바고', 'ankylo', 'earth', 1, 46, 10, 15, 6, ['tackle', 'headbutt', 'rockArmor', 'rockDrop'], 'hide', 2, ['#8a6a4a', '#d8b890', '#5a4a3a'], 0.95, '단단한 등딱지의 늪 거북. 진흙탕에서 느긋하게 일광욕을 즐긴다.'],
  [15, '메머', 'mammoth', 'ice', 2, 70, 15, 14, 7, ['iceBreath', 'stomp', 'iceArmor', 'iceFang'], 'giant', 2, ['#8a5a3a', '#d8b890', '#f5f0e0'], 1.1, '하얀 엄니의 털북숭이. 폭포 아래 차가운 물에서 몸을 식힌다.'],
  [16, '타이거', 'saber', 'primal', 2, 50, 18, 10, 15, ['scratch', 'bite', 'roar', 'fang'], 'crit', 2, ['#f0902a', '#fff0d0', '#2a1a1a'], 1, '단검 같은 송곳니의 줄무늬 검치호. 한 번 문 먹이는 놓지 않는다.'],
  [17, '카르노', 'raptor', 'primal', 2, 60, 16, 13, 12, ['tackle', 'bite', 'roar', 'stomp'], 'sturdy', 3, ['#f08ab0', '#fff0f4', '#c84a7a'], 1.05, '분홍빛 어미 공룡. 화산 열기로 알을 데우며, 알을 노리는 자에겐 무자비하다.'],
  [18, '도도', 'rex', 'primal', 1, 42, 12, 9, 10, ['scratch', 'bite', 'roar', 'stomp'], 'glutton', 1, ['#b86a3a', '#f8d8b0', '#7a3a1a'], 0.9, '눈 위에 작은 뿔이 난 꼬마 육식 공룡. 무엇이든 주워 먹는 숲의 먹보.'],
  [19, '팽이', 'ankylo', 'water', 1, 44, 9, 14, 8, ['waterGun', 'tackle', 'rockArmor', 'aquaPillar'], 'hide', 1, ['#7ac850', '#f0f0c0', '#7a7a6a'], 0.85, '숲 속 샘물에 사는 아기 거북. 등딱지 속에 들어가 팽이처럼 빙글빙글 돈다.', { dome: true }],
  [20, '콩이', 'raptor', 'grass', 1, 40, 10, 11, 9, ['vineWhip', 'tackle', 'synthesis', 'razorLeaf'], 'regen', 1, ['#5cc84a', '#e8f8c8', '#3a9a2a'], 0.75, '머리에 새싹이 돋은 콩알만 한 공룡. 새싹이 크면 숲의 거인이 된다는 전설이 있다.'],
  [21, '사우로', 'sauro', 'earth', 3, 90, 18, 18, 7, ['tailWhip', 'stomp', 'rockArmor', 'quake'], 'giant', 3, ['#f0d040', '#fff8c8', '#c8a020'], 1.3, '화산 너머까지 목을 뻗는 노란 거인. 걸을 때마다 땅이 울린다.'],
  [22, '이구아', 'raptor', 'grass', 1, 46, 12, 11, 8, ['vineWhip', 'tackle', 'razorLeaf', 'leafBlade'], 'drain', 1, ['#7ad050', '#e8f8c0', '#3a8a2a'], 0.95, '등에 초록 가시가 돋은 숲 도마뱀 공룡. 덩굴처럼 질긴 근육을 가졌다.'],
  [23, '테리지', 'bird', 'grass', 3, 66, 21, 13, 11, ['razorLeaf', 'scratch', 'leafBlade', 'slash'], 'crit', 3, ['#f08a2a', '#ffe0a0', '#c84a1a'], 1.2, '주황 깃털과 거대한 낫발톱. 유적의 덩굴을 베며 걷는다.', { tall: true }],
  [24, '딜로', 'raptor', 'poison', 2, 44, 14, 9, 13, ['venomFang', 'acid', 'toxic', 'sludge'], 'poisonPoint', 2, ['#9a5ad0', '#f0e0ff', '#e8b040'], 1, '목 주름을 활짝 펴고 독액을 뱉는다. 습지의 독사냥꾼.', { frill: true }],
  [25, '볼로', 'stego', 'water', 2, 66, 15, 17, 6, ['waterGun', 'tailWhip', 'aquaPillar', 'tidal'], 'armor', 3, ['#3a8ad8', '#c8e8ff', '#e8e8f8'], 1.05, '등에 하얀 돌기가 돋은 파란 갑룡. 화산 온천에서 김을 뿜으며 산다.'],
  [26, '라돈', 'ptero', 'fire', 4, 96, 28, 18, 24, ['ember', 'dive', 'flamethrower', 'eruption'], 'flight', 3, ['#d83a2a', '#ffd08a', '#ffcc33'], 1.45, '【최종 보스 · 화염 비룡】 불꽃 날개를 펼치면 화산이 깨어난다. 하늘을 불태우는 왕.', { flame: true }],
  [27, '미크로', 'ptero', 'wind', 2, 40, 14, 9, 20, ['wingBeat', 'gust', 'dive', 'tailwind'], 'swift', 5, ['#4ac87a', '#e0f8e8', '#2a8a5a'], 0.8, '초록 날개로 나무 사이를 활공하는 작은 비룡. 바람보다 빠르다.'],
  [28, '기가', 'rex', 'water', 4, 150, 26, 30, 8, ['aquaPillar', 'quake', 'tidal', 'abyss'], 'armor', 3, ['#2aa898', '#c8f0e0', '#1a6a6a'], 1.45, '【최종 보스 · 유적의 거신】 고대 유적 지하 호수에서 깨어난 청록 괴수. 등의 가시는 산맥과 같다.'],
  // ── 시리즈 2 ──
  [29, '기가노', 'rex', 'primal', 4, 115, 32, 20, 16, ['bite', 'fang', 'stomp', 'devourBite'], 'glutton', 3, ['#d8382a', '#ffd0a0', '#7a1a1a'], 1.45, '【최종 보스 · 원시의 폭군】 수천 마리를 삼키고도 배고프다.'],
  [30, '수코', 'dimetro', 'water', 2, 60, 16, 13, 10, ['waterGun', 'bite', 'aquaPillar', 'tidal'], 'drain', 2, ['#6ab83a', '#f0f0c0', '#3a7a2a'], 1.05, '늪 동굴에 사는 초록 악어. 커다란 입으로 물고기를 통째로 삼킨다.', { noSail: true }],
  [31, '프시타', 'bird', 'grass', 1, 38, 10, 10, 11, ['vineWhip', 'tackle', 'synthesis', 'razorLeaf'], 'regen', 1, ['#f08a2a', '#fff0c0', '#2a2a2a'], 0.8, '앵무새 부리를 가진 주황 꼬마 공룡. 단단한 열매도 톡 쪼갠다.', { beak: 'hook' }],
  [32, '도쿠', 'saber', 'poison', 2, 50, 15, 13, 11, ['sting', 'venomFang', 'acid', 'plague'], 'poisonPoint', 4, ['#9a5a9a', '#f0d8e8', '#5a2a5a'], 1, '동굴 속 독버섯을 먹고 자란 보랏빛 짐승. 털 끝에 독이 맺힌다.'],
  [33, '코리토', 'raptor', 'ice', 2, 54, 14, 12, 12, ['iceBreath', 'scratch', 'iceFang', 'blizzard'], 'frostBody', 2, ['#6ab8e8', '#e8f8ff', '#e8e0c8'], 1, '하얀 뿔을 단 하늘색 공룡. 폭포 물보라를 얼려 무기로 쓴다.'],
  [34, '켄트라', 'raptor', 'poison', 2, 54, 14, 15, 8, ['sting', 'tailWhip', 'acid', 'sludge'], 'poisonPoint', 2, ['#9a6a3a', '#e8d0a8', '#5a3a1a'], 1.05, '등줄기를 따라 독가시가 솟은 갈색 공룡. 협곡 바위틈에 숨는다.'],
  [35, '모노', 'trike', 'thunder', 2, 56, 15, 14, 9, ['shock', 'headbutt', 'thunderFang', 'charge'], 'intimidate', 5, ['#f0d040', '#fff8c8', '#f0e8d0'], 1, '외뿔에 번개를 모으는 노란 각룡. 뿔이 번쩍이면 피해야 한다.'],
  [36, '데이노', 'raptor', 'thunder', 2, 48, 17, 10, 18, ['shock', 'scratch', 'thunderFang', 'volt'], 'staticSkin', 3, ['#7a4ac8', '#e8d8ff', '#3a2a7a'], 1.05, '보랏빛 깃털에 정전기가 흐르는 화산 랩터. 깃털을 세우면 번개가 튄다.'],
  [37, '도치', 'saber', 'earth', 1, 42, 10, 14, 7, ['tackle', 'sting', 'rockArmor', 'rockDrop'], 'hide', 1, ['#a87a4a', '#f0e0c0', '#5a3a1a'], 0.75, '등에 가시가 빼곡한 고슴도치. 겁이 나면 밤송이처럼 몸을 만다.'],
  [38, '파라', 'hadro', 'water', 2, 56, 13, 12, 11, ['waterGun', 'roar', 'aquaPillar', 'tidal'], 'giant', 2, ['#f08a2a', '#fff0d8', '#a83a2a'], 1.05, '나팔 같은 긴 볏. 폭포 소리보다 큰 소리로 운다.', { crest: 'long' }],
  [39, '마크라', 'mammoth', 'earth', 2, 62, 15, 14, 9, ['tackle', 'stomp', 'rockArmor', 'quake'], 'giant', 4, ['#b88a5a', '#f0d8b8', '#7a5a3a'], 1.05, '짧은 코와 작은 엄니의 초원 짐승. 무리 지어 대지를 울리며 달린다.'],
  [40, '크로노', 'plesio', 'water', 3, 80, 22, 14, 12, ['bite', 'aquaPillar', 'tidal', 'abyss'], 'jaw', 2, ['#2a3a6a', '#d0e0f8', '#5a6a9a'], 1.2, '습지 가장 깊은 물웅덩이의 왕. 긴 목으로 물 위를 살핀다.'],
  [41, '안킬로', 'shark', 'water', 2, 60, 15, 14, 13, ['waterGun', 'bite', 'aquaPillar', 'tidal'], 'swift', 2, ['#2aa8a8', '#c8f0f0', '#1a6a6a'], 1.05, '물살을 가르는 청록 어룡. 이빨을 드러내고 웃으며 먹잇감을 쫓는다.'],
  [42, '파치', 'ankylo', 'earth', 2, 60, 13, 19, 6, ['tackle', 'headbutt', 'rockArmor', 'quake'], 'armor', 4, ['#9a9a4a', '#e8e8b8', '#c8783a'], 1.05, '올리브색 돌기 갑옷과 꼬리 곤봉. 머리의 혹으로 바위를 깬다.'],
  [43, '메가테', 'mammoth', 'primal', 3, 88, 19, 18, 6, ['scratch', 'stomp', 'roar', 'quake'], 'giant', 3, ['#7a5a3a', '#c8a880', '#3a2a1a'], 1.2, '집채만 한 갈색 짐승. 느리지만 앞발 한 번에 바위가 갈라진다.', { noTusk: true }],
  [44, '다이어', 'saber', 'ice', 2, 52, 17, 10, 16, ['iceFang', 'bite', 'roar', 'fang'], 'first', 2, ['#8a8a9a', '#e8e8f0', '#4a4a5a'], 1, '협곡을 무리 지어 달리는 회색 늑대. 하울링이 메아리친다.'],
  [45, '글립토', 'ankylo', 'earth', 2, 62, 12, 22, 4, ['tackle', 'rockArmor', 'rockDrop', 'quake'], 'armor', 3, ['#a87a4a', '#e8d0a8', '#6a4a2a'], 1.05, '거북 등딱지 같은 둥근 갑옷. 용암이 튀어도 끄떡없다.', { dome: true }],
  [46, '디노', 'rex', 'fire', 2, 58, 18, 11, 13, ['ember', 'bite', 'fireFang', 'flamethrower'], 'rage', 5, ['#d8382a', '#ffd0a0', '#7a1a1a'], 1.1, '등에 불꽃 가시가 돋은 붉은 폭군. 화가 날수록 강해진다.'],
  [47, '아파토', 'bird', 'fire', 3, 62, 20, 12, 19, ['ember', 'wingBeat', 'dive', 'flamethrower'], 'flight', 3, ['#d84a2a', '#ffd8a0', '#f0b030'], 1.15, '불꽃색 날개를 펼친 화산의 괴조. 상승기류를 타고 용암 위를 맴돈다.', { bigWing: true, beak: 'hook' }],
  [48, '사르코', 'sauro', 'grass', 3, 92, 18, 17, 7, ['vineWhip', 'tailWhip', 'leafBlade', 'synthesis'], 'giant', 5, ['#8ac850', '#e8f0c0', '#4a8a30'], 1.3, '유적 위에 덩굴을 드리운 연둣빛 거인. 꼬리 채찍은 소리보다 빠르다.', { leaf: true }],
  [49, '테라토', 'dimetro', 'water', 3, 78, 21, 16, 9, ['bite', 'aquaPillar', 'fang', 'abyss'], 'jaw', 5, ['#6a8a3a', '#e0e0b0', '#3a4a2a'], 1.2, '등에 가시 비늘이 줄지은 고대 악어. 늪의 그림자 속에서 기다린다.', { noSail: true }],
  [50, '이구아나', 'raptor', 'grass', 1, 40, 11, 10, 10, ['vineWhip', 'scratch', 'razorLeaf', 'synthesis'], 'regen', 1, ['#a8e05a', '#f0f8d0', '#5a9a2a'], 0.85, '연둣빛 비늘의 작은 공룡. 햇볕을 쬐며 꾸벅꾸벅 존다.'],
  [51, '아르젠', 'sauro', 'water', 3, 110, 19, 22, 6, ['tailWhip', 'aquaPillar', 'quake', 'tidal'], 'giant', 3, ['#4aa8e8', '#d8f0ff', '#2a6aa8'], 1.4, '하늘색 대지의 거신. 화산 너머 유적까지 한 걸음에 닿는다.'],
  [52, '바리오', 'raptor', 'water', 3, 74, 20, 14, 12, ['aquaPillar', 'scratch', 'slash', 'tidal'], 'crit', 3, ['#2aa898', '#d0f0e8', '#1a5a5a'], 1.15, '갈고리 발톱의 청록 사냥꾼. 용암 웅덩이 옆 온천에서 물고기를 낚는다.'],
  [53, '디크라', 'raptor', 'poison', 2, 66, 15, 15, 9, ['sting', 'sludge', 'toxic', 'plague'], 'poisonPoint', 4, ['#9a6a3a', '#e8d0a8', '#5a3a1a'], 1.05, '등줄기의 가시에서 독안개가 피어오르는 얼룩무늬 공룡.'],
  [54, '하드로', 'hadro', 'grass', 2, 64, 14, 14, 10, ['vineWhip', 'stomp', 'leafBlade', 'synthesis'], 'regen', 3, ['#f08aa8', '#fff0f4', '#c84a7a'], 1.1, '유적 정원의 풀을 뜯는 분홍 오리주둥이. 화나면 무리가 몰려온다.', { crest: 'bump' }],
  [55, '아비', 'bird', 'wind', 2, 46, 15, 10, 18, ['wingBeat', 'gust', 'dive', 'slash'], 'flight', 3, ['#a87a4a', '#f0e0c8', '#e8c040'], 0.9, '커다란 눈의 부엉이 새. 화산재 속에서도 먹잇감을 놓치지 않는다.'],
  [56, '플라토', 'trike', 'earth', 2, 66, 15, 15, 8, ['tackle', 'headbutt', 'rockDrop', 'quake'], 'sturdy', 4, ['#d8a860', '#f8ecd0', '#a87a3a'], 1.05, '목에 뼈 장식 프릴을 두른 황토빛 공룡. 고집이 세다.', { beakHead: true }],
];

export const SPECIES = {};
for (const r of RAW) {
  const [id, name, arch, el, tier, hp, atk, def, spd, skills, trait, stage, pal, size, desc, fx] = r;
  SPECIES[id] = { id, name, arch, el, tier, base: { hp, atk, def, spd }, skills, trait, stage, pal, size, desc, fx: fx || {} };
}
export const SPECIES_COUNT = RAW.length;
export const STARTERS = [2, 3, 4];
export const TIER_NAME = { 1: '일반', 2: '희귀', 3: '영웅', 4: '전설' };

// 기술 습득 레벨: 1·2번째는 처음부터, 3·4번째는 등급에 따라
export function learnLevels(sid) {
  const t = SPECIES[sid].tier;
  return [1, 1, 5 + 3 * (t - 1), 12 + 5 * (t - 1)];
}

// ── 기술 사용 횟수(PP) ──
// 기본 기술(위력 55 이하 공격기)은 무제한. 나머지는 횟수 제한 → 회복기 무한 반복 같은 버티기 방지
export const FALLBACK_SKILL = 'tackle';
export function isBasic(id) {
  const sk = SKILLS[id];
  return !!sk && sk.pow > 0 && sk.pow <= 55;
}
export function maxPP(id) {
  const sk = SKILLS[id];
  if (!sk || isBasic(id)) return Infinity;
  if (sk.heal) return 3;
  if (!sk.pow) return 6;
  if (sk.pow <= 70) return 15;
  if (sk.pow <= 95) return 10;
  return 5;
}
