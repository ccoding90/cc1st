// 🦖 스톤몬 개체 로직: 생성 · 능력치 · 포식(흡수) · 무한 변이 진화
import { SPECIES, SKILLS, TRAITS, TRAIT_MAX, ELEMENTS, ELEMENT_KEYS, maxPP, FALLBACK_SKILL } from './data';

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// 조사 처리: 받침 유무로 이/가, 을/를, 은/는, 과/와
export function josa(word, pair) {
  const ch = word.charCodeAt(word.length - 1);
  const has = ch >= 0xac00 && ch <= 0xd7a3 ? (ch - 0xac00) % 28 !== 0 : false;
  const [a, b] = pair.split('/');
  return word + (has ? a : b);
}

export function createMonster(sid, { scale = 1, genes = null, extraTraits = null, jitter = true } = {}) {
  const sp = SPECIES[sid];
  const j = () => (jitter ? rand(0.93, 1.07) : 1);
  const stats = {};
  for (const k of ['hp', 'atk', 'def', 'spd']) stats[k] = Math.max(1, Math.round(sp.base[k] * scale * j()));
  const m = {
    uid: uid(),
    sid,
    stats,
    hp: 0,
    skills: sp.skills.slice(0, 4),
    traits: { [sp.trait]: 1 },
    genes: {},
    devours: 0,
    prey: {},
    stage: 0,
    born: Date.now(),
  };
  if (genes) for (const [k, v] of Object.entries(genes)) m.genes[k] = (m.genes[k] || 0) + v;
  if (extraTraits) for (const [k, v] of Object.entries(extraTraits)) m.traits[k] = Math.min(TRAIT_MAX, (m.traits[k] || 0) + v);
  m.stage = stageFor(geneTotal(m));
  m.hp = maxHp(m);
  return m;
}

export const tl = (m, t) => m.traits?.[t] || 0;

// 남은 사용 횟수 (무제한이면 Infinity)
export function ppLeft(m, id) {
  const max = maxPP(id);
  return max === Infinity ? Infinity : Math.max(0, max - (m.ppUsed?.[id] || 0));
}
export function usePP(m, id) {
  if (maxPP(id) === Infinity) return;
  m.ppUsed = m.ppUsed || {};
  m.ppUsed[id] = (m.ppUsed[id] || 0) + 1;
}
export function restorePP(m, n = Infinity) {
  if (!m.ppUsed) return;
  if (n === Infinity) { m.ppUsed = {}; return; }
  for (const k of Object.keys(m.ppUsed)) m.ppUsed[k] = Math.max(0, m.ppUsed[k] - n);
}
// 지금 쓸 수 있는 기술. 전부 바닥나면 몸통박치기
export function usableSkills(m) {
  const list = m.skills.filter((s) => ppLeft(m, s) > 0);
  return list.length ? list : [FALLBACK_SKILL];
}
export const geneTotal = (m) => Object.values(m.genes || {}).reduce((a, b) => a + b, 0);
// 변이 단계 n에 필요한 유전자 총량: n(n+2) → 3, 8, 15, 24, 35, 48 … (끝없음)
export const stageThreshold = (n) => n * (n + 2);
export function stageFor(total) {
  let n = 0;
  while (total >= stageThreshold(n + 1)) n++;
  return n;
}

export function maxHp(m) {
  return Math.round(m.stats.hp * (1 + 0.1 * tl(m, 'giant')));
}
// 특성을 반영한 실전 능력치
export function eff(m) {
  return {
    hp: maxHp(m),
    atk: Math.round(m.stats.atk * (1 + 0.08 * tl(m, 'jaw'))),
    def: Math.round(m.stats.def * (1 + 0.08 * tl(m, 'hide'))),
    spd: Math.round(m.stats.spd * (1 + 0.08 * tl(m, 'swift'))),
  };
}
export function power(m) {
  const e = eff(m);
  const traitLv = Object.values(m.traits || {}).reduce((a, b) => a + b, 0);
  return Math.round(e.hp * 0.6 + e.atk * 2.2 + e.def * 1.6 + e.spd * 1.4 + traitLv * 3);
}

// 보유 속성: 핵 속성 + 유전자 3 이상 흡수한 속성
export function elementsOf(m) {
  const core = SPECIES[m.sid].el;
  const extra = ELEMENT_KEYS.filter((k) => k !== core && (m.genes?.[k] || 0) >= 3)
    .sort((a, b) => m.genes[b] - m.genes[a]);
  return [core, ...extra];
}

// 가장 많이 흡수한 속성 (핵 속성 제외 우선)
export function dominantGene(m) {
  const core = SPECIES[m.sid].el;
  let best = null, bv = 0;
  for (const [k, v] of Object.entries(m.genes || {})) {
    if (k === core) continue;
    if (v > bv) { best = k; bv = v; }
  }
  return best || (m.genes?.[core] ? core : null);
}

// 외형 변이 부위: 핵 속성이 아닌 유전자가 2/8/20 이상이면 1/2/3단계
export function partsOf(m) {
  const core = SPECIES[m.sid].el;
  const parts = {};
  for (const [k, v] of Object.entries(m.genes || {})) {
    if (k === core) continue;
    const lv = v >= 20 ? 3 : v >= 8 ? 2 : v >= 2 ? 1 : 0;
    if (lv) parts[k] = lv;
  }
  return parts;
}
export function sizeOf(m) {
  return SPECIES[m.sid].size * (1 + Math.min(0.3, (m.stage || 0) * 0.04));
}

function fuse(a, b) {
  const a2 = a.length >= 3 ? a.slice(0, 2) : a;
  const b2 = b.length >= 3 ? b.slice(-2) : b;
  return a2 + b2;
}
const ROMAN = ['', '', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

// 변이체 이름: [가장 많이 흡수한 속성 접두] + [본체 + 가장 많이 먹은 종] 합성 + 단계
export function formName(m) {
  const sp = SPECIES[m.sid];
  if (!m.stage) return sp.name;
  const dom = dominantGene(m);
  const prefix = dom ? ELEMENTS[dom].prefix + ' ' : '';
  let favorite = null, fc = 0;
  for (const [id, c] of Object.entries(m.prey || {})) {
    if (Number(id) !== sp.id && c > fc) { favorite = SPECIES[id]; fc = c; }
  }
  const core = favorite ? fuse(sp.name, favorite.name) : sp.name;
  const roman = m.stage >= 10 ? ` ${m.stage}식` : ROMAN[m.stage] ? ` ${ROMAN[m.stage]}` : '';
  return `${prefix}${core}${roman}`;
}

// 변이 부위 묘사 (진화 결과창)
const PART_TEXT = {
  wind: [
    '견갑골을 찢고 얇은 피막 날개 한 쌍이 돋아났다. 아직 서툴지만 땅을 박차면 몸이 붕 떠오른다.',
    '날개가 몸통보다 커졌다. 날갯짓 한 번에 풀숲이 눕고, 그림자가 마을을 덮는다.',
    '네 장의 거대한 날개. 하늘은 이제 이 녀석의 사냥터다.',
  ],
  thunder: [
    '등줄기를 따라 노란 번개 가시가 솟았다. 숨 쉴 때마다 파직, 스파크가 튄다.',
    '가시가 피뢰침처럼 길어졌다. 비 오는 날이면 몸이 저절로 빛난다.',
    '온몸이 번개를 두른 발전소가 됐다. 다가오는 것만으로 털이 곤두선다.',
  ],
  fire: [
    '꼬리 끝에 꺼지지 않는 불꽃이 붙었다. 발자국마다 풀이 그을린다.',
    '목덜미에 불꽃 갈기가 타오른다. 입김이 아지랑이처럼 일렁인다.',
    '몸 전체가 불길에 휩싸였다. 이 녀석이 지나간 자리엔 재만 남는다.',
  ],
  water: [
    '등에 반투명한 지느러미가 돋았다. 비늘 사이로 물방울이 맺힌다.',
    '꼬리에도 지느러미가 생겼다. 물속에서도 숨을 쉰다.',
    '심해의 수압을 견디는 몸. 주변 공기마저 축축해진다.',
  ],
  ice: [
    '등에서 서리 결정이 자라났다. 닿는 것마다 하얗게 언다.',
    '결정이 칼날처럼 커졌다. 숨결이 눈보라가 된다.',
    '빙하 조각이 갑옷처럼 몸을 감쌌다. 한여름에도 서리가 낀다.',
  ],
  earth: [
    '피부 위로 바위 판이 돋아 갑옷이 되었다.',
    '이마에 돌뿔이 솟았다. 박치기 한 번에 바위가 쪼개진다.',
    '산맥 같은 암반 등껍질. 이제 이 녀석 자체가 하나의 지형이다.',
  ],
  poison: [
    '피부에 보랏빛 독반점이 번졌다. 만지면 저릿하다.',
    '등에 독가시가 돋았다. 끝에서 보랏빛 액체가 똑똑 떨어진다.',
    '입가에서 독침이 흘러내린다. 숨결에 풀이 시든다.',
  ],
  primal: [
    '뼈 가시가 등을 뚫고 솟았다. 원시의 본능이 깨어난다.',
    '뼈 가시가 더 길고 날카로워졌다. 눈빛이 짐승의 것이다.',
    '뼈로 된 왕관과 등뼈. 원시의 폭군 그 자체.',
  ],
};
export function mutationLines(before, after) {
  const lines = [];
  for (const [el, lv] of Object.entries(after)) {
    const prev = before[el] || 0;
    for (let l = prev + 1; l <= lv; l++) lines.push({ el, text: PART_TEXT[el][l - 1] });
  }
  return lines;
}

// 포식: 승자가 패자를 삼켜 능력치 · 유전자 · 특성을 흡수
// mode: tutorial | wild | trainer | boss | pvp | feed
const RATE = { tutorial: 0.15, wild: 0.12, trainer: 0.15, boss: 0.22, pvp: 0.2, feed: 0.25 };
export function absorb(pred, prey, mode = 'wild') {
  const sp = SPECIES[prey.sid];
  const before = { stats: { ...eff(pred) }, power: power(pred), stage: pred.stage, parts: partsOf(pred), name: formName(pred) };
  const rate = RATE[mode] * (1 + 0.15 * tl(pred, 'glutton'));
  const pe = eff(prey);
  const gains = {};
  for (const k of ['hp', 'atk', 'def', 'spd']) {
    gains[k] = Math.max(k === 'hp' ? 2 : 1, Math.round(pe[k] * rate));
    pred.stats[k] += gains[k];
  }
  // 유전자: 상대 핵 속성 + 상대가 지닌 유전자의 절반
  const geneGain = {};
  const add = (el, n) => { if (n > 0) geneGain[el] = (geneGain[el] || 0) + n; };
  add(sp.el, 1 + sp.tier + (mode === 'pvp' || mode === 'boss' ? 2 : 0));
  for (const [el, v] of Object.entries(prey.genes || {})) add(el, Math.floor(v * 0.5));
  if (mode === 'tutorial') for (const k in geneGain) geneGain[k] *= 2;
  const gm = 1 + 0.15 * tl(pred, 'glutton');
  for (const [el, n] of Object.entries(geneGain)) {
    geneGain[el] = Math.max(1, Math.round(n * gm));
    pred.genes[el] = (pred.genes[el] || 0) + geneGain[el];
  }
  // 특성: 야생은 1개, 그 외에는 상대의 모든 특성을 흡수(+1Lv)
  const preyTraits = Object.keys(prey.traits || {});
  const takeTraits = mode === 'wild' || mode === 'tutorial' || mode === 'feed' ? [pick(preyTraits)] : preyTraits;
  const traitGain = [];
  for (const t of takeTraits) {
    if (!t || !TRAITS[t]) continue;
    const cur = pred.traits[t] || 0;
    if (cur >= TRAIT_MAX) continue;
    pred.traits[t] = cur + 1;
    traitGain.push({ t, lv: cur + 1 });
  }
  pred.devours = (pred.devours || 0) + 1;
  pred.prey[prey.sid] = (pred.prey[prey.sid] || 0) + 1;
  const newStage = stageFor(geneTotal(pred));
  const stageUp = newStage > pred.stage;
  if (stageUp) {
    // 변이 단계가 오를 때마다 전 능력치 +5%
    for (let s = pred.stage; s < newStage; s++)
      for (const k of ['hp', 'atk', 'def', 'spd']) pred.stats[k] = Math.round(pred.stats[k] * 1.05) + 1;
    pred.stage = newStage;
  }
  // 먹으면 회복 (최대 체력 30% + 제한 기술 1회씩 충전)
  restorePP(pred, 1);
  pred.hp = Math.min(maxHp(pred), pred.hp + Math.round(maxHp(pred) * 0.3) + gains.hp);
  const learnable = (prey.skills || []).filter((s) => SKILLS[s] && !pred.skills.includes(s));
  const afterParts = partsOf(pred);
  return {
    gains, geneGain, traitGain, learnable, stageUp,
    before,
    after: { stats: eff(pred), power: power(pred), stage: pred.stage, parts: afterParts, name: formName(pred) },
    mutations: mutationLines(before.parts, afterParts),
  };
}

// 야생/NPC 개체에 무작위 변이를 입힌다
export function randomMutate(m, points) {
  const core = SPECIES[m.sid].el;
  for (let i = 0; i < points; i++) {
    const el = Math.random() < 0.35 ? core : pick(ELEMENT_KEYS);
    m.genes[el] = (m.genes[el] || 0) + 1;
  }
  m.stage = stageFor(geneTotal(m));
  for (let s = 0; s < m.stage; s++) for (const k of ['hp', 'atk', 'def', 'spd']) m.stats[k] = Math.round(m.stats[k] * 1.05) + 1;
  m.hp = maxHp(m);
  return m;
}

// 저장/네트워크용 직렬화
export function pack(m) {
  return {
    sid: m.sid, stats: m.stats, skills: m.skills, traits: m.traits, genes: m.genes,
    devours: m.devours || 0, prey: m.prey || {}, stage: m.stage || 0,
  };
}
export function unpack(d) {
  if (!d || !SPECIES[d.sid]) return null;
  const m = {
    uid: uid(), sid: d.sid, stats: { ...d.stats }, skills: (d.skills || []).filter((s) => SKILLS[s]).slice(0, 4),
    traits: Object.fromEntries(Object.entries(d.traits || {}).filter(([k]) => TRAITS[k]).map(([k, v]) => [k, Math.min(TRAIT_MAX, v)])),
    genes: Object.fromEntries(Object.entries(d.genes || {}).filter(([k]) => ELEMENTS[k])),
    devours: d.devours || 0, prey: d.prey || {}, stage: d.stage || 0, hp: 0, born: Date.now(),
  };
  for (const k of ['hp', 'atk', 'def', 'spd']) m.stats[k] = Math.max(1, Math.min(99999, Number(m.stats[k]) || 1));
  if (!m.skills.length) m.skills = SPECIES[d.sid].skills.slice(0, 4);
  m.hp = maxHp(m);
  return m;
}
