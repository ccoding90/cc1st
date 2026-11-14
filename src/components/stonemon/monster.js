// 🦖 스톤몬 개체 로직 v4.0: 생성 · 레벨/경험치 · 레벨업 진화 · 능력치 · 포식(스탯 무한 누적 · 속성 습득) · 스탯 임계치 각성
//
// v4.0 핵심 원칙 — 진화 · 스탯 성장 · 외형 변화의 분리
//  1) 진화      : 오직 '레벨업'. 각 종의 evolvesTo { id, lv } 를 따라 2~3단계로 진화한다.
//  2) 포식      : 외형은 그대로, 기본 스탯(체력·공격·방어·스피드)만 영구 · 무한 누적(m.fed). 먹은 종의 종족값에 비례.
//  3) 속성 습득 : 같은 속성을 누적 10회 포식(m.elFed) → 그 속성 정식 습득 + 전용 속성 스킬 슬롯 해금.
//  4) 외형 변화 : 실전 능력치가 임계치(공격·방어 300/800/1500, 체력 1000/3000/7000)를 넘을 때와 속성 습득 때만.
//
// 능력치 = (종족값 × 레벨 성장 × 개체차 × (1 + 고정 보너스) × 특성 + 포식 누적치) × 순혈 패왕
import {
  SPECIES, SKILLS, TRAITS, TRAIT_MAX, ELEMENTS, ELEMENT_KEYS, maxPP, FALLBACK_SKILL, learnLevels, RARE_SKILL,
  LEGACY_SID, formForLevel, ELEMENT_UNLOCK, elementSkillFor, AWAKEN,
} from './data';
import { synergiesOf, PURE_KING_MUL } from './synergy';

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const STAT_KEYS = ['hp', 'atk', 'def', 'spd'];

// 조사 처리: 받침 유무로 이/가, 을/를, 은/는, 과/와
export function josa(word, pair) {
  const ch = word.charCodeAt(word.length - 1);
  const has = ch >= 0xac00 && ch <= 0xd7a3 ? (ch - 0xac00) % 28 !== 0 : false;
  const [a, b] = pair.split('/');
  return word + (has ? a : b);
}

// ── 레벨 · 성장 ──
export const LV_MAX = 100;
export const growth = (lv) => 1 + 0.12 * (Math.max(1, lv) - 1); // 모든 능력치 공통 (Lv35 ≈ ×5.1)
export const HP_K = 5; // 체력 배율 (데미지 공식 스케일에 맞춤)
// 고정 퍼센트 보너스(m.bonus): 트레이너·보스·야생 개체차와 v3 이전 세이브 변환용. v4 포식은 m.fed(고정 수치)를 쓴다.
export const BONUS_CAP = 0.8;
export const expNext = (lv) => Math.round(0.9 * lv * lv + 8 * lv + 12);

// 레벨에 맞는 기술(최근 4개)
export function skillsAt(sid, lv) {
  const sp = SPECIES[sid];
  const at = learnLevels(sid);
  const list = sp.skills.filter((_, i) => lv >= at[i]);
  return list.slice(-4);
}

const zeroStats = () => ({ hp: 0, atk: 0, def: 0, spd: 0 });

// evolve: 레벨이 진화 레벨 이상이면 진화형으로 생성 (야생 · 트레이너 · 부화). 스타팅처럼 정확한 종이 필요하면 false
export function createMonster(sid, { lv = 5, genes = null, extraTraits = null, jitter = true, bonus = 0, evolve = true } = {}) {
  const j = () => (jitter ? Math.round(rand(0.94, 1.06) * 100) / 100 : 1);
  const L = Math.max(1, Math.min(LV_MAX, Math.round(lv)));
  const id = evolve ? formForLevel(sid, L) : sid;
  const sp = SPECIES[id];
  const m = {
    uid: uid(),
    v4: true,
    sid: id,
    lv: L,
    exp: 0,
    iv: { hp: j(), atk: j(), def: j(), spd: j() },
    bonus: { hp: bonus, atk: bonus, def: bonus, spd: bonus },
    fed: zeroStats(), // 포식으로 쌓인 기본 스탯 (무한 누적)
    elFed: {}, // 속성별 누적 포식 횟수 (10회 → 속성 습득)
    hp: 0,
    skills: skillsAt(id, L),
    traits: { [sp.trait]: 1 },
    devours: 0,
    prey: {},
    born: Date.now(),
  };
  // genes(트레이너 데이터): 속성별 누적 포식 횟수로 해석 → 10 이상이면 그 속성을 습득한 개체
  if (genes) for (const [k, v] of Object.entries(genes)) if (ELEMENTS[k]) m.elFed[k] = (m.elFed[k] || 0) + v;
  if (extraTraits) for (const [k, v] of Object.entries(extraTraits)) m.traits[k] = Math.min(TRAIT_MAX, (m.traits[k] || 0) + v);
  m.hp = maxHp(m);
  return m;
}

export const tl = (m, t) => m.traits?.[t] || 0;

// ── 기술 사용 횟수(PP) ──
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

// ── 속성 습득 (누적 10회 포식) ──
// 습득한 속성(핵 속성 제외) — 많이 먹은 순
export function acquiredElements(m) {
  const core = SPECIES[m.sid].el;
  return ELEMENT_KEYS.filter((k) => k !== core && (m.elFed?.[k] || 0) >= ELEMENT_UNLOCK)
    .sort((a, b) => (m.elFed[b] || 0) - (m.elFed[a] || 0));
}
// 보유 속성: 핵 속성 + 습득 속성 (속성 일치 보너스 · 내성 계산용)
export function elementsOf(m) {
  return [SPECIES[m.sid].el, ...acquiredElements(m)];
}
// 속성 습득 진행도 (상태창 · HUD): 핵 속성 제외, 진행도 높은 순
export function elementProgress(m) {
  const core = SPECIES[m.sid].el;
  return ELEMENT_KEYS.filter((k) => k !== core && (m.elFed?.[k] || 0) > 0)
    .map((el) => ({ el, n: m.elFed[el], need: ELEMENT_UNLOCK, done: m.elFed[el] >= ELEMENT_UNLOCK }))
    .sort((a, b) => (b.done - a.done) || (b.n - a.n));
}
// 가장 습득에 가까운 미습득 속성
export function nextElementGoal(m) {
  return elementProgress(m).filter((p) => !p.done)[0] || null;
}
// 습득 속성마다 해금되는 전용 속성 스킬 (레벨에 따라 강해짐, 일반 기술과 겹치면 생략)
export function elementSkills(m) {
  const out = [];
  for (const el of acquiredElements(m)) {
    const s = elementSkillFor(el, m.lv || 1);
    if (s && SKILLS[s] && !m.skills.includes(s) && !out.includes(s)) out.push(s);
  }
  return out;
}
// 전투에서 고를 수 있는 기술: 일반 기술 4칸 + 속성 스킬 슬롯
export function battleSkills(m) {
  return [...m.skills, ...elementSkills(m)];
}
// 지금 쓸 수 있는 기술. 전부 바닥나면 몸통박치기
export function usableSkills(m) {
  const list = battleSkills(m).filter((s) => ppLeft(m, s) > 0);
  return list.length ? list : [FALLBACK_SKILL];
}

// v3.0 고대 변종(이로치) · 알파 개체: 크기 1.15배, 포식 시 3배 흡수 + 희귀 기술 전수
export const isVariant = (m) => !!(m && (m.alpha || m.shiny));
export const VARIANT_ABSORB = 3;

// 특성 · 포식 누적치를 반영한 실전 능력치 (순혈 패왕 시너지: 전 능력치 ×1.15)
export function eff(m) {
  const sp = SPECIES[m.sid];
  const king = m.prey && synergiesOf(m).includes('pureKing') ? PURE_KING_MUL : 1;
  const g = growth(m.lv || 1);
  const fed = m.fed || {};
  const one = (k, trait, per = 0.06) => sp.base[k] * g * (m.iv?.[k] || 1) * (1 + (m.bonus?.[k] || 0)) * (1 + per * tl(m, trait));
  return {
    hp: Math.round((one('hp', 'giant') * HP_K + 10 + (fed.hp || 0)) * king),
    atk: Math.max(1, Math.round((one('atk', 'jaw') + (fed.atk || 0)) * king)),
    def: Math.max(1, Math.round((one('def', 'hide') + (fed.def || 0)) * king)),
    spd: Math.max(1, Math.round((one('spd', 'swift') + (fed.spd || 0)) * king)),
  };
}
export const maxHp = (m) => eff(m).hp;

export function power(m) {
  const e = eff(m);
  const traitLv = Object.values(m.traits || {}).reduce((a, b) => a + b, 0);
  return Math.round(e.hp * 0.12 + e.atk * 2.2 + e.def * 1.6 + e.spd * 1.4 + traitLv * 3);
}

// ── 스탯 임계치 각성 (외형 변화의 유일한 조건) ──
const tierOf = (v, list) => list.reduce((n, t) => (v >= t ? n + 1 : n), 0);
export function awakenTiers(m, stats = eff(m)) {
  return { atk: tierOf(stats.atk, AWAKEN.atk), def: tierOf(stats.def, AWAKEN.def), hp: tierOf(stats.hp, AWAKEN.hp) };
}
// 새로 돌파한 임계치 목록 [{ stat, tier }]
export function awakenDiff(before, after) {
  const out = [];
  for (const k of ['atk', 'def', 'hp']) for (let t = (before?.[k] || 0) + 1; t <= (after?.[k] || 0); t++) out.push({ stat: k, tier: t });
  return out;
}
// 렌더러에 넘기는 외형 정보: 종 + 각성 단계 + 습득 속성(최대 2개 표시) + 변종
export function lookOf(m) {
  if (!m) return null;
  if (!m.v4 && !m.fed) return { sid: m.sid, atk: 0, def: 0, hp: 0, els: [], shiny: !!m.shiny, alpha: !!m.alpha };
  const t = awakenTiers(m);
  return { sid: m.sid, atk: t.atk, def: t.def, hp: t.hp, els: acquiredElements(m).slice(0, 2), shiny: !!m.shiny, alpha: !!m.alpha };
}
// 거대화: 체력 각성 단계별 1.05 / 1.10 / 1.15배 (변종은 추가 1.15배)
export function sizeOf(m) {
  const hpT = m.v4 || m.fed ? awakenTiers(m).hp : 0;
  return SPECIES[m.sid].size * (1 + 0.05 * hpT) * (isVariant(m) ? 1.15 : 1);
}

// 이름: v4.0부터 무작위 합성 이름 없음 → 종 이름 그대로
export function formName(m) {
  return SPECIES[m.sid]?.name || '스톤몬';
}

// 결과 카드용 스냅샷
export function snapshot(m) {
  const stats = eff(m);
  return { sid: m.sid, name: formName(m), lv: m.lv, stats, power: power(m), tiers: awakenTiers(m, stats), els: acquiredElements(m) };
}

// ── 레벨 · 경험치 · 레벨업 진화 ──
// 경험치 획득 → 레벨업 목록 [{lv, learn:[기술]}]. 레벨업해도 깎인 체력은 그대로(최대치만 증가)
export function gainExp(m, n) {
  const ups = [];
  m.exp = (m.exp || 0) + Math.max(0, Math.round(n));
  while (m.lv < LV_MAX && m.exp >= expNext(m.lv)) {
    m.exp -= expNext(m.lv);
    const before = maxHp(m);
    m.lv++;
    m.hp = Math.max(1, m.hp + (maxHp(m) - before));
    const at = learnLevels(m.sid);
    const learn = SPECIES[m.sid].skills.filter((s, i) => at[i] === m.lv && !m.skills.includes(s));
    ups.push({ lv: m.lv, learn });
  }
  if (m.lv >= LV_MAX) m.exp = 0;
  return ups;
}
// 진화 가능한가? → 다음 종 번호. (진화를 멈춘 레벨에서는 다음 레벨업까지 다시 묻지 않음)
export function evolutionReady(m) {
  const nx = SPECIES[m.sid]?.evolvesTo;
  if (!nx || !SPECIES[nx.id] || m.lv < nx.lv) return null;
  if (m.evoStop && m.evoStop >= m.lv) return null;
  return nx.id;
}
// 레벨업 진화 실행: 종이 바뀌고 종족값·기술표가 새 종을 따른다. 포식 누적치·특성·속성 습득은 그대로 이어진다
export function evolveMon(m) {
  const nx = SPECIES[m.sid]?.evolvesTo;
  if (!nx) return null;
  const before = snapshot(m);
  const hpLost = maxHp(m) - m.hp;
  const from = m.sid;
  m.sid = nx.id;
  delete m.evoStop;
  const sp = SPECIES[m.sid];
  if (!m.traits[sp.trait]) m.traits[sp.trait] = 1;
  m.hp = Math.max(1, maxHp(m) - hpLost);
  const at = learnLevels(m.sid);
  const learn = sp.skills.filter((s, i) => at[i] <= m.lv && !m.skills.includes(s)).slice(-2);
  const after = snapshot(m);
  return { from, to: m.sid, before, after, learn, awaken: awakenDiff(before.tiers, after.tiers) };
}

// 쓰러뜨린 상대가 주는 경험치
export function expYield(enemy, kind = 'wild') {
  const sp = SPECIES[enemy.sid];
  const mul = kind === 'boss' ? 1.8 : kind === 'trainer' || kind === 'pvp' ? 1.4 : kind === 'tutorial' ? 2.5 : 1;
  return Math.round(((14 + 8 * sp.tier) * (enemy.lv || 1) / 3) * mul * (isVariant(enemy) ? 1.5 : 1));
}

// ── 포식: 외형은 그대로, 기본 스탯만 무한 누적 + 속성 카운트 ──
// 스탯 증가량 = 먹은 종의 종족값(체력은 ×2.5) × FED_K × (1 + 먹이 레벨/10) × 모드 배율 × 대식가 × 레벨차 × (변종 3배)
//  · 먹이의 가장 두드러진 능력치는 ×1.5 → 단단한 종을 먹으면 방어가, 날랜 종을 먹으면 스피드가 더 오른다
//  · 상한 없음 (끝없이 강해지는 육성)
export const FED_K = 0.015;
// 체력은 종족값 ×2.5 로 누적 (체력 임계치 1000/3000/7000 이 공격·방어 임계치와 비슷한 속도로 열리도록)
export const FED_HP_K = 2.5;
const RATE = { tutorial: 2, wild: 1, trainer: 1.5, boss: 2.5, pvp: 2.5, feed: 2 };
export function topStat(sid) {
  const b = SPECIES[sid].base;
  const norm = { hp: b.hp / 4, atk: b.atk, def: b.def, spd: b.spd };
  return STAT_KEYS.reduce((a, k) => (norm[k] > norm[a] ? k : a), 'hp');
}
export function fedGain(pred, prey, mode = 'wild', mul = 1) {
  const sp = SPECIES[prey.sid];
  const gm = 1 + 0.15 * tl(pred, 'glutton');
  const lvRel = Math.max(0.6, Math.min(1.5, 1 + ((prey.lv || 1) - (pred.lv || 1)) * 0.04));
  const lvF = 1 + (prey.lv || 1) / 10;
  const k = FED_K * lvF * (RATE[mode] || 1) * gm * lvRel * (isVariant(prey) ? VARIANT_ABSORB : 1) * mul;
  const top = topStat(prey.sid);
  const out = {};
  for (const s of STAT_KEYS) out[s] = sp.base[s] * (s === 'hp' ? FED_HP_K : 1) * k * (s === top ? 1.5 : 1);
  return out;
}

// mode: tutorial | wild | trainer | boss | pvp | feed. opts.mul: 업적 보너스 등 추가 흡수 배율
export function absorb(pred, prey, mode = 'wild', opts = {}) {
  const sp = SPECIES[prey.sid];
  const variant = isVariant(prey);
  const before = snapshot(pred);
  const hpBefore = before.stats.hp;
  // 1) 기본 스탯 무한 누적
  pred.fed = pred.fed || zeroStats();
  const gain = fedGain(pred, prey, mode, opts.mul || 1);
  for (const s of STAT_KEYS) pred.fed[s] = Math.round(((pred.fed[s] || 0) + gain[s]) * 1000) / 1000;
  // 2) 속성 카운트 (먹은 종의 기본 속성 +1) → 누적 10회에 습득
  pred.elFed = pred.elFed || {};
  const core = SPECIES[pred.sid].el;
  const el = sp.el;
  const was = pred.elFed[el] || 0;
  pred.elFed[el] = was + 1;
  const unlocked = el !== core && was < ELEMENT_UNLOCK && pred.elFed[el] >= ELEMENT_UNLOCK;
  // 3) 특성: 야생은 1개, 그 외에는 상대의 모든 특성을 흡수(+1Lv, 최대 5)
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
  // 먹으면 회복 (늘어난 최대 체력 + 최대 체력 30%, 제한 기술 1회씩 충전)
  restorePP(pred, 1);
  pred.hp = Math.min(maxHp(pred), pred.hp + (maxHp(pred) - hpBefore) + Math.round(maxHp(pred) * 0.3));
  const rareSkill = variant ? RARE_SKILL[sp.el] : null;
  const learnable = [...(rareSkill ? [rareSkill] : []), ...(prey.skills || [])]
    .filter((s, i, a) => SKILLS[s] && !pred.skills.includes(s) && a.indexOf(s) === i);
  const after = snapshot(pred);
  return {
    variant, rareSkill, traitGain, learnable, before, after,
    element: { el, n: pred.elFed[el], need: ELEMENT_UNLOCK, core: el === core, unlocked, skill: unlocked ? elementSkillFor(el, pred.lv) : null },
    awaken: awakenDiff(before.tiers, after.tiers),
  };
}

// 진화석: 포식 3회분의 정수 — 핵 속성 카운트 +3 · 기본 스탯 소량 누적
export function applyEssence(m, el, count, statMul = 0) {
  const before = snapshot(m);
  const hpBefore = before.stats.hp;
  m.elFed = m.elFed || {};
  const was = m.elFed[el] || 0;
  m.elFed[el] = was + count;
  if (statMul > 0) {
    m.fed = m.fed || zeroStats();
    const g = fedGain(m, { sid: m.sid, lv: m.lv, traits: {} }, 'wild', statMul);
    for (const s of STAT_KEYS) m.fed[s] = Math.round(((m.fed[s] || 0) + g[s]) * 1000) / 1000;
  }
  m.hp = Math.min(maxHp(m), m.hp + (maxHp(m) - hpBefore));
  const core = SPECIES[m.sid].el;
  const unlocked = el !== core && was < ELEMENT_UNLOCK && m.elFed[el] >= ELEMENT_UNLOCK;
  const after = snapshot(m);
  return {
    before, after, traitGain: [], learnable: [],
    element: { el, n: m.elFed[el], need: ELEMENT_UNLOCK, core: el === core, unlocked, skill: unlocked ? elementSkillFor(el, m.lv) : null },
    awaken: awakenDiff(before.tiers, after.tiers),
  };
}

// 야생 · NPC 개체 강화 (v3의 무작위 변이를 대체): 외형은 그대로, 고정 보너스만 소폭
export function wildBoost(m, points) {
  const add = Math.max(0, points) * 0.01;
  m.bonus = m.bonus || zeroStats();
  for (const k of STAT_KEYS) m.bonus[k] = Math.min(0.5, (m.bonus[k] || 0) + add);
  m.hp = maxHp(m);
  return m;
}

// 구버전(레벨 없는 절대 능력치) → 레벨 추정
export function legacyLevel(stats = {}, traits = {}) {
  const tsum = Object.values(traits || {}).reduce((a, b) => a + b, 0);
  const p = (stats.hp || 40) * 0.6 + (stats.atk || 10) * 2.2 + (stats.def || 10) * 1.6 + (stats.spd || 10) * 1.4 + tsum * 3;
  return Math.max(3, Math.min(60, Math.round(3 + (p - 90) / 40)));
}

// v3 이전 개체 → v4 변환
//  · 도감 번호 변환(1~56 → 신규 번호) · 포식 기록 번호 변환
//  · 변이 단계(+3%/단계)는 고정 보너스로 보존 · 유전자 대신 '포식 기록'에서 속성별 누적 횟수 재계산
//  · 레벨이 이미 진화 레벨을 넘었다면 그 레벨에 맞는 진화형으로 (밀린 진화)
function migrateLegacy(m) {
  const map = (id) => LEGACY_SID[Number(id)] || null;
  m.sid = map(m.sid);
  if (!m.sid) return null;
  const prey = {};
  for (const [id, c] of Object.entries(m.prey || {})) { const n = map(id); if (n) prey[n] = (prey[n] || 0) + c; }
  m.prey = prey;
  const stage = Math.max(0, Number(m.stage) || 0);
  m.bonus = m.bonus || {};
  for (const k of STAT_KEYS) m.bonus[k] = (Number(m.bonus[k]) || 0) + 0.03 * stage;
  m.elFed = {};
  for (const [id, c] of Object.entries(prey)) { const el = SPECIES[id].el; m.elFed[el] = (m.elFed[el] || 0) + c; }
  m.fed = zeroStats();
  delete m.genes; delete m.stage;
  m.sid = formForLevel(m.sid, Number.isFinite(m.lv) ? m.lv : 5);
  m.v4 = true;
  return m;
}

// 저장 데이터 속 개체 보정 (구버전 변환 포함)
export function normalizeMon(m) {
  if (!m) return null;
  if (!m.v4) { if (!Number.isFinite(m.lv)) m.lv = legacyLevel(m.stats, m.traits); m = migrateLegacy(m); if (!m) return null; }
  if (!SPECIES[m.sid]) return null;
  if (!Number.isFinite(m.lv)) m.lv = legacyLevel(m.stats, m.traits);
  m.lv = Math.max(1, Math.min(LV_MAX, Math.round(m.lv)));
  m.exp = Math.max(0, Number(m.exp) || 0);
  delete m.stats;
  m.iv = m.iv || {};
  m.bonus = m.bonus || {};
  m.fed = m.fed || {};
  for (const k of STAT_KEYS) {
    m.iv[k] = Math.max(0.9, Math.min(1.1, Number(m.iv[k]) || 1));
    m.bonus[k] = Math.max(0, Math.min(BONUS_CAP, Number(m.bonus[k]) || 0));
    m.fed[k] = Math.max(0, Number(m.fed[k]) || 0);
  }
  m.elFed = Object.fromEntries(Object.entries(m.elFed || {}).filter(([k, v]) => ELEMENTS[k] && Number(v) > 0).map(([k, v]) => [k, Math.round(Number(v))]));
  m.skills = (m.skills || []).filter((s) => SKILLS[s]).slice(0, 4);
  if (!m.skills.length) m.skills = skillsAt(m.sid, m.lv);
  m.traits = Object.fromEntries(Object.entries(m.traits || {}).filter(([k]) => TRAITS[k]).map(([k, v]) => [k, Math.min(TRAIT_MAX, v)]));
  if (!Object.keys(m.traits).length) m.traits = { [SPECIES[m.sid].trait]: 1 };
  m.prey = Object.fromEntries(Object.entries(m.prey || {}).filter(([k]) => SPECIES[k]));
  m.devours = m.devours || 0;
  m.uid = m.uid || uid();
  m.shiny = !!m.shiny;
  m.v4 = true;
  m.hp = Math.max(1, Math.min(maxHp(m), Number(m.hp) || maxHp(m)));
  return m;
}

// 저장/네트워크용 직렬화 (v4 표식 포함 → 구버전 그림자는 불러올 때 자동 변환)
export function pack(m) {
  return {
    v4: true, sid: m.sid, lv: m.lv, iv: m.iv, bonus: m.bonus, fed: m.fed || zeroStats(), elFed: m.elFed || {},
    skills: m.skills, traits: m.traits, devours: m.devours || 0, prey: m.prey || {}, shiny: !!m.shiny,
  };
}
export function unpack(d) {
  if (!d) return null;
  const m = normalizeMon({ ...JSON.parse(JSON.stringify(d)), uid: uid(), hp: 0, born: Date.now() });
  if (!m) return null;
  m.hp = maxHp(m);
  return m;
}
