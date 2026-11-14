// 🦖 스톤몬스터 v4.0 - 정적 기획 데이터 (속성 · 상성 · 기술 · 특성 · 스톤몬 100종 · 스테이지 1~5)
// v4.0: 진화는 '레벨업'으로만, 포식은 '기본 스탯 무한 누적 + 속성 습득(같은 속성 10회)' 전용. 외형은 스탯 임계치에서만 바뀐다.
import { MONSTERS } from './data/monsters';

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

// ── v4.0 속성 습득: 같은 속성의 스톤몬을 '누적 10회' 포식하면 그 속성을 정식 습득 ──
//  · 습득한 속성은 속성 일치 보너스(×1.2)와 내성(×0.85)을 얻고, 전용 '속성 스킬 슬롯'이 1칸 해금된다.
//  · 속성 스킬은 레벨에 따라 강해진다 (Lv1~24 / 25~44 / 45~).
export const ELEMENT_UNLOCK = 10;
export const ELEMENT_SKILLS = {
  primal: ['fang', 'stomp', 'devourBite'],
  fire: ['fireFang', 'flamethrower', 'eruption'],
  water: ['aquaPillar', 'tidal', 'abyss'],
  grass: ['razorLeaf', 'leafBlade', 'woodHammer'],
  thunder: ['thunderFang', 'volt', 'lightning'],
  wind: ['gust', 'slash', 'storm'],
  earth: ['rockDrop', 'quake', 'crush'],
  ice: ['iceFang', 'blizzard', 'iceAge'],
  poison: ['venomFang', 'sludge', 'plague'],
};
export const elementSkillFor = (el, lv) => ELEMENT_SKILLS[el]?.[lv >= 45 ? 2 : lv >= 25 ? 1 : 0] || null;

// ── v4.0 스탯 임계치 각성: 실전 능력치가 기준을 넘을 때만 외형이 바뀐다 (Ⅰ·Ⅱ·Ⅲ단계) ──
//  공격 → 발톱·이빨 강조 + 붉은 투기 / 방어 → 비늘·등껍질 장갑 + 황금 수호 오라 / 체력 → 거대화(×1.05·1.10·1.15) + 뿔·왕관 장식
export const AWAKEN = { atk: [300, 800, 1500], def: [300, 800, 1500], hp: [1000, 3000, 7000] };
export const AWAKEN_INFO = {
  atk: { name: '투기 각성', icon: '💢', color: '#ff3a3a', text: ['발톱과 이빨이 날카롭게 번뜩인다! 붉은 투기가 피어오른다.', '발톱이 칼날처럼 길어졌다! 투기가 불길처럼 치솟는다.', '피를 머금은 듯 붉은 송곳니! 투기가 폭풍처럼 몰아친다.'] },
  def: { name: '수호 각성', icon: '🛡️', color: '#ffd23a', text: ['비늘 위로 단단한 장갑판이 돋았다! 황금빛 수호 오라가 감돈다.', '등껍질이 겹겹이 두꺼워졌다! 황금 오라가 몸을 감싼다.', '금강석 같은 장갑! 황금 수호 결계가 빛난다.'] },
  hp: { name: '거신 각성', icon: '👑', color: '#7fe08a', text: ['몸집이 한층 커졌다! 머리에 작은 뿔 장식이 솟았다.', '거대한 몸! 뿔 장식이 위풍당당하게 자랐다.', '산만 한 거신이 되었다! 머리 위에 황금 왕관이 솟았다.'] },
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

// ── 스톤몬 100종 (v4.0): data/monsters.js 의 도감 배열을 게임 내부 형식으로 변환 ──
// 내부 필드: el(속성) · arch(골격) · base(종족값) · evo(진화 단계) · spawn(출현 스테이지) · pal(팔레트) · parts(도트 외형)
export { MONSTERS };
export const SPECIES = {};
for (const d of MONSTERS) {
  SPECIES[d.id] = {
    id: d.id, name: d.name, el: d.element, arch: d.archetype, tier: d.tier, base: { ...d.baseStats }, skills: d.skills, trait: d.trait,
    evo: d.stage, evolvesTo: d.evolvesTo, spawn: d.spawnStage, pal: d.palette, parts: d.parts || {}, size: d.size || 1, desc: d.desc,
    legacyId: d.legacyId || null, prevo: null,
  };
}
for (const sp of Object.values(SPECIES)) if (sp.evolvesTo && SPECIES[sp.evolvesTo.id]) SPECIES[sp.evolvesTo.id].prevo = sp.id;
export const SPECIES_COUNT = MONSTERS.length;
export const STARTERS = [1, 4, 7]; // 티랑이 · 케톱스 · 브퉁이

// v3.0 이전 도감 번호(1~56) → v4.0 도감 번호 (세이브 · 제단 그림자 변환용)
export const LEGACY_SID = Object.fromEntries(MONSTERS.filter((d) => d.legacyId).map((d) => [d.legacyId, d.id]));

// 진화 계통: 기본형 → … → 최종형
export function baseForm(sid) {
  let id = sid;
  for (let i = 0; i < 4 && SPECIES[id]?.prevo; i++) id = SPECIES[id].prevo;
  return id;
}
export function evoChain(sid) {
  const out = [];
  let id = baseForm(sid);
  for (let i = 0; i < 4 && SPECIES[id]; i++) { out.push(id); id = SPECIES[id].evolvesTo?.id; }
  return out;
}
// 레벨에 맞는 진화형 (야생 · 트레이너 · 부화 개체용): 레벨이 진화 레벨 이상이면 끝까지 진화
export function formForLevel(sid, lv) {
  let id = sid;
  for (let i = 0; i < 4; i++) {
    const nx = SPECIES[id]?.evolvesTo;
    if (!nx || lv < nx.lv || !SPECIES[nx.id]) break;
    id = nx.id;
  }
  return id;
}
// 최종 진화 · 보스급(전설) → 48x48 도트, 나머지 → 32x32 도트
export const isBigSprite = (sid) => {
  const sp = SPECIES[sid];
  return !!sp && (sp.evo >= 3 || sp.tier >= 4 || (!sp.evolvesTo && sp.evo >= 2 && sp.tier >= 3));
};

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
