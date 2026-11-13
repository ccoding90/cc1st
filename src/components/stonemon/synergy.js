// 🧬 스톤몬스터 v3.0 유전자 시너지: 특정 계통을 누적 포식하면 특수 패시브가 자동 각성된다.
// 포식 기록(m.prey: 종 번호 → 횟수)만으로 계산하므로 저장 데이터·그림자(PvP)에도 그대로 적용된다.
import { SPECIES } from './data';

export const SYNERGIES = {
  blazeWyvern: {
    name: '폭염의 비룡', icon: '🐉', color: '#ff6a3d',
    need: '화염 속성 2회 + 비행 계열(바람 속성·비행 특성) 2회 포식',
    desc: '먼저 공격할 때 25% 확률로 추가 화염 피해',
  },
  venomArmor: {
    name: '맹독 갑주', icon: '🛡️', color: '#b05cff',
    need: '대지 속성 2회 + 독 속성 2회 포식',
    desc: '물리(접촉) 공격에 맞으면 받은 피해의 10%를 반사하고 공격자를 중독',
  },
  pureKing: {
    name: '순혈 패왕', icon: '👑', color: '#ffd23a',
    need: '한 종족을 5회 이상 포식',
    desc: '체력·공격·방어·스피드 15% 영구 증폭 · 황금빛 오라',
  },
  chimera: {
    name: '고대 키메라', icon: '🧬', color: '#7fe0ff',
    need: '서로 다른 속성 4가지 이상 포식',
    desc: '상성 불리(×0.5) 패널티가 ×0.8로 완화',
  },
};
export const SYNERGY_KEYS = Object.keys(SYNERGIES);
export const PURE_KING_MUL = 1.15;
export const BLAZE_CHANCE = 0.25;
export const VENOM_REFLECT = 0.1;
export const CHIMERA_FLOOR = 0.8;

// 포식 기록 요약: 속성별 횟수 · 비행 계열 횟수 · 한 종족 최다 포식 횟수
export function preyProfile(m) {
  const byEl = {};
  let flying = 0, maxSame = 0;
  for (const [id, c] of Object.entries(m?.prey || {})) {
    const sp = SPECIES[id];
    if (!sp || !c) continue;
    byEl[sp.el] = (byEl[sp.el] || 0) + c;
    if (sp.el === 'wind' || sp.trait === 'flight') flying += c;
    if (c > maxSame) maxSame = c;
  }
  return { byEl, flying, maxSame, kinds: Object.keys(byEl).length };
}

// 각성 조건 진행도 (상태창 표시용) → { key: [현재, 목표] … }
export function synergyProgress(m) {
  const p = preyProfile(m);
  const f = (n, goal) => Math.min(n, goal);
  return {
    blazeWyvern: [f(p.byEl.fire || 0, 2) + f(p.flying, 2), 4],
    venomArmor: [f(p.byEl.earth || 0, 2) + f(p.byEl.poison || 0, 2), 4],
    pureKing: [f(p.maxSame, 5), 5],
    chimera: [f(p.kinds, 4), 4],
  };
}

export function synergiesOf(m) {
  if (!m?.prey) return [];
  const p = preyProfile(m);
  const out = [];
  if ((p.byEl.fire || 0) >= 2 && p.flying >= 2) out.push('blazeWyvern');
  if ((p.byEl.earth || 0) >= 2 && (p.byEl.poison || 0) >= 2) out.push('venomArmor');
  if (p.maxSame >= 5) out.push('pureKing');
  if (p.kinds >= 4) out.push('chimera');
  return out;
}
export const hasSyn = (m, key) => synergiesOf(m).includes(key);
