// 🦖 스톤몬스터 - 정적 기획 데이터 (속성 · 기술 · 특성 · 스톤몬 50종 · 지역)
// 레벨/경험치는 없다. 스톤몬은 오직 '포식'으로만 강해진다.

export const ELEMENTS = {
  primal: { name: '원시', color: '#c8a070', icon: '🦴', prefix: '폭군' },
  fire: { name: '화염', color: '#ff6a3d', icon: '🔥', prefix: '화염' },
  water: { name: '물', color: '#3fa9f5', icon: '💧', prefix: '심해' },
  thunder: { name: '번개', color: '#ffd93d', icon: '⚡', prefix: '뇌전' },
  wind: { name: '바람', color: '#7fe0b8', icon: '🌪️', prefix: '천공' },
  earth: { name: '대지', color: '#b07b48', icon: '🪨', prefix: '암반' },
  ice: { name: '얼음', color: '#9ee8ff', icon: '❄️', prefix: '빙결' },
  poison: { name: '독', color: '#b05cff', icon: '☠️', prefix: '맹독' },
};
export const ELEMENT_KEYS = Object.keys(ELEMENTS);

// 공격 속성 → 효과가 굉장한 상대 핵 속성
export const STRONG = {
  primal: [],
  fire: ['ice', 'poison'],
  water: ['fire', 'earth'],
  thunder: ['water', 'wind'],
  wind: ['poison', 'earth'],
  earth: ['thunder', 'fire'],
  ice: ['wind', 'earth'],
  poison: ['water', 'primal'],
};
// 공격 속성 → 효과가 별로인 상대 핵 속성
export const WEAK = {
  primal: [],
  fire: ['water', 'earth', 'fire'],
  water: ['water', 'ice'],
  thunder: ['earth', 'thunder'],
  wind: ['thunder', 'ice'],
  earth: ['wind'],
  ice: ['fire', 'water', 'ice'],
  poison: ['earth', 'poison'],
};

// 기술: pow 위력, acc 명중, crit 급소 단계, eff 부가효과
// eff: { st: 상태이상, p: 확률 } | { buff: {atk,def,spd}, self } | { debuff, p } | heal | drain | recoil | flinch | prio
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
  rockDrop: { name: '바위떨구기', el: 'earth', pow: 60, acc: 95, desc: '머리 위로 바위를 떨군다.' },
  rockArmor: { name: '돌갑옷', el: 'earth', pow: 0, acc: 100, buff: { def: 2 }, desc: '돌을 둘러 방어가 크게 오른다.' },
  quake: { name: '지진', el: 'earth', pow: 100, acc: 100, desc: '땅을 뒤흔든다.' },
  crush: { name: '대지분쇄', el: 'earth', pow: 130, acc: 80, desc: '대지째 짓눌러 부순다.' },
  // 화염
  ember: { name: '불씨', el: 'fire', pow: 40, acc: 100, st: 'burn', p: 0.15, desc: '작은 불씨. 화상을 입힐 때가 있다.' },
  fireFang: { name: '화염이빨', el: 'fire', pow: 65, acc: 95, st: 'burn', p: 0.15, desc: '불붙은 이빨로 문다.' },
  flamethrower: { name: '화염방사', el: 'fire', pow: 90, acc: 100, st: 'burn', p: 0.1, desc: '목구멍에서 불길을 뿜는다.' },
  heatUp: { name: '열기폭주', el: 'fire', pow: 0, acc: 100, buff: { atk: 2, def: -1 }, desc: '몸을 달궈 공격이 크게 오르고 방어가 내려간다.' },
  eruption: { name: '용암분출', el: 'fire', pow: 125, acc: 85, st: 'burn', p: 0.2, desc: '용암을 토해낸다.' },
  // 물
  waterGun: { name: '물대포', el: 'water', pow: 40, acc: 100, desc: '물을 세차게 쏜다.' },
  aquaPillar: { name: '물기둥', el: 'water', pow: 65, acc: 100, desc: '발밑에서 물기둥이 솟는다.' },
  tidal: { name: '해일', el: 'water', pow: 95, acc: 90, desc: '거대한 파도로 덮친다.' },
  aquaRing: { name: '아쿠아링', el: 'water', pow: 0, acc: 100, heal: 0.4, desc: '물의 고리로 체력을 40% 회복한다.' },
  abyss: { name: '심해압살', el: 'water', pow: 125, acc: 85, debuff: { def: -1 }, p: 0.3, desc: '심해의 수압으로 짓누른다.' },
  // 번개
  shock: { name: '전기충격', el: 'thunder', pow: 40, acc: 100, st: 'para', p: 0.15, desc: '전기를 흘린다. 마비시킬 때가 있다.' },
  thunderFang: { name: '번개이빨', el: 'thunder', pow: 65, acc: 95, st: 'para', p: 0.15, desc: '전기를 두른 이빨로 문다.' },
  volt: { name: '10만볼트', el: 'thunder', pow: 90, acc: 100, st: 'para', p: 0.1, desc: '강력한 전격을 날린다.' },
  charge2: { name: '충전', el: 'thunder', pow: 0, acc: 100, buff: { atk: 1, spd: 1 }, desc: '전기를 모아 공격과 스피드가 오른다.' },
  lightning: { name: '낙뢰', el: 'thunder', pow: 120, acc: 75, st: 'para', p: 0.3, desc: '하늘에서 벼락을 떨어뜨린다.' },
  // 바람
  wingBeat: { name: '날개치기', el: 'wind', pow: 55, acc: 100, desc: '날개로 후려친다.' },
  gust: { name: '회오리', el: 'wind', pow: 65, acc: 100, desc: '회오리바람으로 감싼다.' },
  dive: { name: '급강하', el: 'wind', pow: 80, acc: 95, prio: 1, desc: '하늘에서 내리꽂는다. 반드시 먼저 공격.' },
  slash: { name: '질풍가르기', el: 'wind', pow: 75, acc: 100, crit: 1, desc: '바람의 칼날. 급소에 잘 맞는다.' },
  tailwind: { name: '순풍', el: 'wind', pow: 0, acc: 100, buff: { spd: 2 }, desc: '바람을 타 스피드가 크게 오른다.' },
  storm: { name: '폭풍', el: 'wind', pow: 120, acc: 80, desc: '모든 것을 날려버리는 폭풍.' },
  // 얼음
  iceBreath: { name: '얼음숨결', el: 'ice', pow: 40, acc: 100, st: 'frz', p: 0.1, desc: '차가운 숨. 얼릴 때가 있다.' },
  iceFang: { name: '얼음이빨', el: 'ice', pow: 65, acc: 95, st: 'frz', p: 0.1, desc: '얼음 이빨로 문다.' },
  blizzard: { name: '눈보라', el: 'ice', pow: 95, acc: 85, st: 'frz', p: 0.1, desc: '맹렬한 눈보라.' },
  iceArmor: { name: '빙결막', el: 'ice', pow: 0, acc: 100, buff: { def: 1, spd: 1 }, desc: '얼음막을 둘러 방어와 스피드가 오른다.' },
  iceAge: { name: '빙하기', el: 'ice', pow: 130, acc: 80, st: 'frz', p: 0.2, desc: '세상을 얼려버린 그날의 냉기.' },
  // 독
  sting: { name: '독침', el: 'poison', pow: 40, acc: 100, st: 'psn', p: 0.3, desc: '독침으로 찌른다. 중독시킬 때가 있다.' },
  venomFang: { name: '독니', el: 'poison', pow: 65, acc: 95, st: 'psn', p: 0.3, desc: '독이 밴 이빨로 문다.' },
  sludge: { name: '오물폭탄', el: 'poison', pow: 90, acc: 100, st: 'psn', p: 0.3, desc: '썩은 오물을 퍼붓는다.' },
  toxic: { name: '맹독', el: 'poison', pow: 0, acc: 90, st: 'psn', p: 1, desc: '상대를 확실히 중독시킨다.' },
  acid: { name: '부식액', el: 'poison', pow: 50, acc: 100, debuff: { def: -1 }, p: 0.5, desc: '녹이는 액체. 방어를 깎을 때가 많다.' },
  plague: { name: '역병', el: 'poison', pow: 115, acc: 85, st: 'psn', p: 0.5, desc: '고대의 역병을 퍼뜨린다.' },
};

// 특성(패시브): 포식하면 상대의 특성이 흡수되고, 같은 특성은 레벨이 오른다(최대 10)
export const TRAITS = {
  jaw: { name: '포식자의 턱', desc: '공격 +8%/Lv' },
  hide: { name: '단단한 피부', desc: '방어 +8%/Lv' },
  giant: { name: '거대한 체구', desc: '최대 체력 +10%/Lv' },
  flight: { name: '비행', desc: '회피 +5%/Lv' },
  swift: { name: '질풍', desc: '스피드 +8%/Lv' },
  staticSkin: { name: '전기 피부', desc: '맞으면 10%/Lv 확률로 상대 마비' },
  flameBody: { name: '불꽃 몸', desc: '맞으면 10%/Lv 확률로 상대 화상' },
  poisonPoint: { name: '독가시', desc: '맞으면 10%/Lv 확률로 상대 중독' },
  frostBody: { name: '냉기 몸', desc: '맞으면 8%/Lv 확률로 상대 빙결' },
  regen: { name: '재생', desc: '매 턴 최대 체력 3%/Lv 회복' },
  armor: { name: '철갑', desc: '받는 피해 -5%/Lv' },
  crit: { name: '급소 노리기', desc: '급소율 +4%/Lv' },
  drain: { name: '흡혈', desc: '준 피해의 6%/Lv 회복' },
  rage: { name: '분노', desc: '체력 1/3 이하에서 공격 +15%/Lv' },
  glutton: { name: '대식가', desc: '포식 흡수량 +15%/Lv' },
  first: { name: '선제', desc: '15%/Lv 확률로 먼저 행동' },
  intimidate: { name: '위압', desc: '전투 시작 시 상대 공격 -6%/Lv' },
  sturdy: { name: '끈질김', desc: '치명상에서 25%/Lv 확률로 체력 1 버팀(전투당 1회)' },
};
export const TRAIT_MAX = 10;

// 지역(스테이지). 데모는 1단계 태초마을만 플레이 가능
export const STAGES = {
  1: { name: '태초마을', open: true },
  2: { name: '불꽃 화산', open: false },
  3: { name: '원시 바다', open: false },
  4: { name: '영원 빙하', open: false },
  5: { name: '뇌운 고원', open: false },
  6: { name: '독안개 늪', open: false },
  7: { name: '질풍 협곡', open: false },
  0: { name: '전설 · 미확인', open: false },
};

// 스톤몬 50종
// [번호, 이름, 체형, 속성, 등급(1~4), 체력, 공격, 방어, 스피드, 기술, 특성, 서식지, 색상[몸, 배, 포인트], 크기, 도감 설명]
const RAW = [
  [1, '티랑이', 'rex', 'primal', 1, 46, 14, 9, 10, ['bite', 'scratch', 'roar'], 'jaw', 1, ['#d9774a', '#f3d29b', '#8a3b22'], 1, '박사의 돌알에서 깨어난 꼬마 폭군. 이빨 하나로 바위를 깨문다. 먹을수록 턱이 커진다.'],
  [2, '트톱이', 'trike', 'earth', 1, 50, 11, 14, 8, ['tackle', 'headbutt', 'rockArmor'], 'hide', 1, ['#5f9e5a', '#d8e6a3', '#c9643a'], 1, '세 개의 뿔과 돌처럼 단단한 프릴. 어지간한 이빨은 박히지도 않는다.'],
  [3, '브라키', 'sauro', 'water', 1, 62, 10, 10, 7, ['tailWhip', 'waterGun', 'aquaRing'], 'giant', 1, ['#5aa0c8', '#cfe8f0', '#2f6b8f'], 1, '태초의 호수에서 자란 목이 긴 거인. 꼬리 한 번에 나무가 쓰러진다.'],
  [4, '프테리', 'ptero', 'wind', 1, 32, 10, 7, 15, ['wingBeat', 'dive', 'tailwind'], 'flight', 1, ['#b48ad6', '#efe0ff', '#ff9f43'], 0.9, '마을의 돌알을 훔쳐 가는 말썽꾸러기 익룡. 하늘에서 내리꽂는 급강하가 특기.'],
  [5, '랩티', 'raptor', 'primal', 1, 36, 12, 7, 14, ['scratch', 'bite', 'roar'], 'crit', 1, ['#c2b280', '#f2e8c9', '#6b5a2a'], 0.9, '무리 지어 사냥하는 날쌘 사냥꾼. 낫 같은 발톱은 급소만 노린다.'],
  [6, '콤피', 'raptor', 'poison', 1, 28, 9, 6, 13, ['sting', 'scratch', 'toxic'], 'poisonPoint', 1, ['#7dbd5a', '#e1f2b8', '#7a3fb0'], 0.7, '손바닥만 한 독도마뱀. 작다고 얕보면 독에 쓰러진다.'],
  [7, '딜로', 'raptor', 'poison', 2, 42, 13, 9, 12, ['venomFang', 'acid', 'sludge'], 'poisonPoint', 1, ['#4f8f6e', '#d9f0c2', '#e85fa8'], 1, '목 주름을 활짝 펴고 독액을 뱉는다. 태초마을 풀숲 깊은 곳의 포식자.'],
  [8, '파키', 'pachy', 'earth', 1, 42, 11, 13, 8, ['headbutt', 'tackle', 'rockDrop'], 'sturdy', 1, ['#a07850', '#ead2a8', '#6e4a2a'], 0.9, '두께 25cm의 돌머리. 박치기로 서열을 정한다.'],
  [9, '스테고', 'stego', 'earth', 2, 52, 12, 16, 6, ['tailWhip', 'rockArmor', 'rockDrop'], 'armor', 1, ['#7b8f5a', '#dfe6b8', '#d65a3a'], 1, '등의 골판은 햇빛을 모으는 돌판. 가시 꼬리는 사냥꾼의 악몽.'],
  [10, '안킬로', 'ankylo', 'earth', 2, 55, 11, 18, 5, ['tackle', 'rockDrop', 'rockArmor'], 'hide', 1, ['#8a7a5a', '#d8c9a0', '#5a4a35'], 1, '살아 움직이는 요새. 꼬리 곤봉에 맞으면 뼈가 가루가 된다.'],
  [11, '디메트', 'dimetro', 'fire', 1, 40, 12, 9, 9, ['ember', 'fireFang', 'bite'], 'flameBody', 1, ['#c4503a', '#f2c49b', '#ffb03a'], 1, '등의 돛으로 열을 모아 불씨를 뿜는다. 공룡보다 오래된 혈통.'],
  [12, '메가네', 'bug', 'wind', 1, 30, 10, 6, 16, ['gust', 'wingBeat', 'tailwind'], 'swift', 1, ['#3fb8a8', '#d8fff5', '#a6f0ff'], 0.9, '날개폭 70cm의 거대 잠자리. 눈 깜짝할 새 등 뒤에 있다.'],
  [13, '삼엽이', 'trilo', 'water', 1, 36, 8, 14, 7, ['waterGun', 'tackle', 'rockArmor'], 'armor', 1, ['#6a7fa8', '#cfd8ea', '#3c4a6e'], 0.8, '연못 바닥을 기어다니는 갑옷 벌레. 세 겹 껍질이 자랑.'],
  [14, '암모', 'ammo', 'water', 1, 40, 10, 12, 7, ['waterGun', 'aquaPillar', 'aquaRing'], 'regen', 1, ['#e0a46a', '#fff0d8', '#a85a3a'], 0.9, '나선 껍데기 속의 촉수 사냥꾼. 껍데기가 깨져도 다시 자란다.'],
  [15, '찌릿랩', 'raptor', 'thunder', 1, 34, 12, 7, 15, ['shock', 'thunderFang', 'scratch'], 'staticSkin', 1, ['#f2c94c', '#fff6cf', '#3a5bd9'], 0.9, '벼락 맞은 랩티의 후손. 털끝마다 정전기가 튄다. 삼키면 번개가 흐른다.'],
  [16, '돌돌이', 'golem', 'earth', 1, 55, 11, 15, 4, ['rockDrop', 'tackle', 'rockArmor'], 'sturdy', 1, ['#9a9a9a', '#cfcfcf', '#6fd0ff'], 0.9, '태초의 돌에 혼이 깃든 정령. 스톤몬스터의 기원이라는 설이 있다.'],
  [17, '카르노', 'rex', 'fire', 2, 55, 17, 11, 12, ['fireFang', 'flamethrower', 'roar'], 'rage', 2, ['#b8342a', '#f0b090', '#2a1a1a'], 1.05, '불꽃 뿔이 달린 화산의 폭군. 화가 날수록 강해진다.'],
  [18, '불톱스', 'trike', 'fire', 2, 60, 14, 17, 8, ['ember', 'charge', 'fireFang'], 'flameBody', 2, ['#d4562a', '#f6d09a', '#ffe066'], 1.05, '달궈진 뿔로 돌진한다. 지나간 자리엔 재만 남는다.'],
  [19, '마그몬', 'golem', 'fire', 2, 66, 15, 18, 4, ['ember', 'rockDrop', 'heatUp'], 'flameBody', 2, ['#4a3a3a', '#ff8a3a', '#ffcc33'], 1.05, '식은 용암 껍질 아래 마그마가 끓는다.'],
  [20, '화룡익', 'ptero', 'fire', 2, 42, 14, 9, 18, ['ember', 'dive', 'flamethrower'], 'flight', 2, ['#e0603a', '#ffd8a0', '#ffcc33'], 1, '화산 연기를 타고 나는 불꽃 익룡.'],
  [21, '라바돛', 'dimetro', 'fire', 3, 70, 20, 15, 12, ['flamethrower', 'eruption', 'heatUp'], 'regen', 2, ['#7a1f1f', '#ff9a5a', '#ffd23a'], 1.15, '용암 돛을 단 고대의 지배자. 등에서 용암이 흘러내린다.'],
  [22, '재나방', 'moth', 'poison', 2, 40, 13, 9, 15, ['acid', 'sludge', 'gust'], 'poisonPoint', 2, ['#6e6e7a', '#c8c8d0', '#d85cff'], 1, '화산재를 먹고 자란 나방. 날개 가루는 맹독.'],
  [23, '플레시', 'plesio', 'water', 2, 60, 14, 12, 12, ['aquaPillar', 'bite', 'tidal'], 'giant', 3, ['#3a7fb0', '#c8ecf8', '#1f4a6e'], 1.05, '원시 바다의 목긴 사냥꾼. 수면 아래서 조용히 다가온다.'],
  [24, '모사', 'shark', 'water', 3, 75, 21, 14, 13, ['bite', 'tidal', 'abyss'], 'jaw', 3, ['#2a5a7a', '#d8eef5', '#8fd0ff'], 1.15, '바다의 티랑이라 불리는 거대 해룡. 두 줄의 이빨.'],
  [25, '메갈로', 'shark', 'water', 3, 70, 24, 12, 15, ['fang', 'tidal', 'bite'], 'crit', 3, ['#5a6f80', '#eef4f8', '#c03030'], 1.15, '버스만 한 상어. 한입에 무엇이든 반으로 가른다.'],
  [26, '스피노', 'spino', 'water', 3, 80, 20, 15, 11, ['aquaPillar', 'fang', 'tidal'], 'rage', 3, ['#3a8a6a', '#e8e0b8', '#e05a3a'], 1.2, '물가의 최상위 포식자. 돛과 악어 주둥이를 가졌다.'],
  [27, '대왕암모', 'ammo', 'water', 3, 78, 16, 22, 8, ['tidal', 'abyss', 'aquaRing'], 'regen', 3, ['#c07a4a', '#ffe8c8', '#6a2a5a'], 1.2, '천 년을 산 암모. 껍데기에 심해의 문양이 새겨져 있다.'],
  [28, '찌릿플레시', 'plesio', 'thunder', 3, 70, 20, 13, 16, ['volt', 'thunderFang', 'lightning'], 'staticSkin', 3, ['#2a3a8a', '#bfe0ff', '#ffe04a'], 1.1, '번개 치는 밤바다를 헤엄친다. 몸에서 푸른 빛이 번쩍인다.'],
  [29, '매머링', 'mammoth', 'ice', 2, 70, 15, 14, 7, ['iceBreath', 'stomp', 'iceArmor'], 'giant', 4, ['#8a5a3a', '#d8b890', '#f5f0e0'], 1.1, '얼음 엄니의 털북숭이. 빙하를 머리로 밀고 다닌다.'],
  [30, '검치냥', 'saber', 'primal', 2, 50, 18, 10, 15, ['fang', 'scratch', 'roar'], 'crit', 4, ['#d8a050', '#fff0d0', '#ffffff'], 1, '단검 같은 송곳니의 고양이. 한 번 문 먹이는 놓지 않는다.'],
  [31, '설치냥', 'saber', 'ice', 3, 62, 22, 13, 18, ['iceFang', 'fang', 'blizzard'], 'first', 4, ['#e8f4ff', '#ffffff', '#7ab8e8'], 1.05, '눈보라 속에서 나타나는 하얀 암살자.'],
  [32, '얼음톱스', 'trike', 'ice', 2, 62, 14, 18, 8, ['iceFang', 'charge', 'iceArmor'], 'hide', 4, ['#7ab8d8', '#e8f8ff', '#ffffff'], 1.05, '얼음 뿔 세 개. 프릴에 서리가 꽃처럼 핀다.'],
  [33, '빙하골렘', 'golem', 'ice', 3, 88, 18, 24, 5, ['iceBreath', 'quake', 'iceArmor'], 'armor', 4, ['#a8d8f0', '#f0fbff', '#3a8ab0'], 1.2, '만년빙이 걸어 다닌다. 심장은 녹지 않는 푸른 얼음.'],
  [34, '눈익룡', 'ptero', 'ice', 2, 44, 14, 10, 18, ['iceBreath', 'dive', 'tailwind'], 'flight', 4, ['#e0f0ff', '#ffffff', '#5ab0e8'], 1, '날갯짓마다 눈송이가 흩날린다.'],
  [35, '볼트렉스', 'rex', 'thunder', 3, 75, 24, 14, 14, ['thunderFang', 'volt', 'fang'], 'staticSkin', 5, ['#3a4ad0', '#c8d8ff', '#ffe04a'], 1.2, '뇌운 고원의 폭군. 포효가 곧 천둥이다.'],
  [36, '썬더익', 'ptero', 'thunder', 3, 55, 20, 11, 22, ['shock', 'dive', 'lightning'], 'flight', 5, ['#2a2a5a', '#a8b8ff', '#ffe04a'], 1.1, '먹구름 속을 나는 번개 익룡. 그 그림자를 본 자는 벼락을 맞는다.'],
  [37, '번개파키', 'pachy', 'thunder', 2, 50, 15, 15, 11, ['headbutt', 'thunderFang', 'charge2'], 'sturdy', 5, ['#e8c040', '#fff4c0', '#4a5ad0'], 1, '돌머리에 피뢰침이 달렸다. 박치기마다 번쩍.'],
  [38, '전기메가네', 'bug', 'thunder', 2, 38, 14, 8, 20, ['shock', 'volt', 'charge2'], 'swift', 5, ['#4ad0e8', '#e8ffff', '#ffe04a'], 1, '날개가 진동할 때마다 전류가 생긴다.'],
  [39, '뇌석골렘', 'golem', 'thunder', 3, 85, 20, 22, 7, ['volt', 'rockDrop', 'charge2'], 'staticSkin', 5, ['#5a5a7a', '#a8a8c8', '#ffe04a'], 1.2, '벼락을 천 번 맞은 바위. 몸속에 번개가 갇혀 있다.'],
  [40, '독스테고', 'stego', 'poison', 3, 75, 19, 20, 8, ['venomFang', 'sludge', 'tailWhip'], 'poisonPoint', 6, ['#5a3a7a', '#d8c0f0', '#a8ff4a'], 1.15, '골판에서 독안개를 뿜는다.'],
  [41, '늪킬로', 'ankylo', 'poison', 3, 80, 17, 24, 6, ['acid', 'sludge', 'toxic'], 'armor', 6, ['#4a6a3a', '#c8d8a0', '#b05cff'], 1.15, '늪 바닥에서 독을 품고 잠든 요새.'],
  [42, '늪브라키', 'sauro', 'poison', 3, 95, 17, 16, 8, ['tailWhip', 'sludge', 'plague'], 'giant', 6, ['#5a7a5a', '#d0e0c0', '#b05cff'], 1.25, '독안개 늪의 거인. 숨결만으로 풀이 시든다.'],
  [43, '독전갈', 'scorp', 'poison', 2, 45, 16, 14, 12, ['sting', 'venomFang', 'acid'], 'poisonPoint', 6, ['#7a2a3a', '#e8b0b0', '#b05cff'], 1, '고생대의 바다전갈. 꼬리 독침은 공룡도 쓰러뜨린다.'],
  [44, '케찰', 'ptero', 'wind', 3, 70, 20, 13, 20, ['gust', 'dive', 'storm'], 'giant', 7, ['#e8d8a8', '#fff8e8', '#e04a3a'], 1.25, '기린만 한 키의 거대 익룡. 하늘의 제왕.'],
  [45, '질풍랩', 'raptor', 'wind', 2, 44, 16, 9, 20, ['slash', 'scratch', 'tailwind'], 'swift', 7, ['#5ab88a', '#e0fff0', '#ffffff'], 1, '깃털 달린 랩터. 바람보다 빨리 달린다.'],
  [46, '회오리메가', 'bug', 'wind', 3, 55, 19, 11, 24, ['slash', 'storm', 'tailwind'], 'first', 7, ['#2a8a7a', '#c8fff0', '#ffffff'], 1.15, '날갯짓으로 회오리를 만드는 협곡의 주인.'],
  [47, '기가노', 'rex', 'primal', 4, 110, 32, 20, 16, ['devourBite', 'fang', 'stomp', 'roar'], 'glutton', 0, ['#5a2a2a', '#d8a890', '#ff3a3a'], 1.35, '【전설】 원시의 폭군. 수천 마리를 삼키고도 배고프다.'],
  [48, '아르겐', 'sauro', 'earth', 4, 150, 26, 28, 8, ['crush', 'quake', 'rockArmor'], 'giant', 0, ['#7a6a5a', '#d8c8b0', '#4ad0a0'], 1.4, '【전설】 대지의 거신. 걸을 때마다 지도가 바뀐다.'],
  [49, '오로라익', 'ptero', 'ice', 4, 90, 28, 18, 28, ['iceAge', 'blizzard', 'dive'], 'flight', 0, ['#a8e8ff', '#ffffff', '#ff8ae8'], 1.3, '【전설】 오로라를 날개로 두른 빙하기의 사자.'],
  [50, '태초석', 'golem', 'primal', 4, 130, 30, 30, 12, ['devourBite', 'crush', 'roar'], 'glutton', 0, ['#3a3a4a', '#8a8aa8', '#ff5aff'], 1.35, '【환상】 모든 스톤몬이 태어난 최초의 돌. 먹은 것의 모든 것을 기억한다.'],
];

export const SPECIES = {};
for (const r of RAW) {
  const [id, name, arch, el, tier, hp, atk, def, spd, skills, trait, stage, pal, size, desc] = r;
  SPECIES[id] = { id, name, arch, el, tier, base: { hp, atk, def, spd }, skills, trait, stage, pal, size, desc };
}
export const SPECIES_COUNT = RAW.length;
export const STARTERS = [1, 2, 3];
export const TIER_NAME = { 1: '일반', 2: '희귀', 3: '영웅', 4: '전설' };
