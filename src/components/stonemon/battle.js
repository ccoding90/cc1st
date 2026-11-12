// ⚔️ 스톤몬 턴제 배틀 계산 (순수 로직). 연출은 StoneMonsterGame.jsx 가 이벤트를 받아 재생한다.
import { SKILLS, SPECIES, TYPE_CHART, ELEMENTS } from './data';
import { eff, tl, maxHp, elementsOf, josa, formName, usableSkills } from './monster';

export const STATUS = {
  burn: { name: '화상', color: '#ff6a3d', turns: 3 },
  para: { name: '마비', color: '#ffd93d' },
  psn: { name: '중독', color: '#b05cff', turns: 4 },
  frz: { name: '빙결', color: '#9ee8ff' },
};
export const STAB = 1.2; // 속성 일치 보너스

export function fighter(m, side) {
  return { m, side, st: { atk: 0, def: 0, spd: 0 }, status: null, stTurns: 0, flinch: false, sturdyUsed: false, atkMul: 1 };
}
export const nameOf = (f) => formName(f.m);
const stageMul = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

// 상성 배율: 유리 1.5 ~ 천적 2.0 / 보통 1.0 / 불리 0.5 (흡수해 보유한 속성은 추가 내성 ×0.85)
export function typeMult(el, defM) {
  const core = SPECIES[defM.sid].el;
  let m = TYPE_CHART[el]?.[core] ?? 1;
  if (el !== core && (defM.genes?.[el] || 0) >= 3) m *= 0.85;
  return m;
}

function atkVal(f, sk) {
  const e = eff(f.m);
  let a = e.atk * stageMul(f.st.atk) * f.atkMul;
  if (f.status === 'burn' && !sk?.sp) a *= 0.8; // 화상: 물리 공격력 20% 감소
  if (f.m.hp <= maxHp(f.m) / 3) a *= 1 + 0.12 * tl(f.m, 'rage');
  return a;
}
export function spdVal(f) {
  return eff(f.m).spd * stageMul(f.st.spd) * (f.status === 'para' ? 0.5 : 1);
}

// 비율 기반 데미지 공식
//  최종 = max(2, floor(((2×Lv/5+2) × 위력 × (공격/방어)) / 4 × 상성 × 속성일치(1.2) × 난수(0.9~1.1)))
//  (+ 급소 ×1.5, 철갑 특성 경감)
export function calcDamage(att, def, skillId, { roll = true } = {}) {
  const sk = SKILLS[skillId];
  const A = atkVal(att, sk);
  const D = Math.max(1, eff(def.m).def * stageMul(def.st.def));
  const lv = att.m.lv || 1;
  const base = ((2 * lv / 5 + 2) * sk.pow * (A / D)) / 4;
  const tm = typeMult(sk.el, def.m);
  const stab = elementsOf(att.m).includes(sk.el) ? STAB : 1;
  let extra = Math.max(0.6, 1 - 0.04 * tl(def.m, 'armor'));
  let crit = false;
  let r = 1;
  if (roll) {
    const cr = 1 / 16 + (sk.crit ? 0.12 : 0) + 0.03 * tl(att.m, 'crit');
    crit = Math.random() < cr;
    if (crit) extra *= 1.5;
    r = 0.9 + Math.random() * 0.2;
  }
  const dmg = Math.max(2, Math.floor(base * tm * stab * extra * r));
  return { dmg, tm, crit };
}

// 행동 순서: 우선도 → 선제 특성 → 스피드
export function order(a, sa, b, sb) {
  const pa = SKILLS[sa]?.prio || 0, pb = SKILLS[sb]?.prio || 0;
  if (pa !== pb) return pa > pb ? [a, b] : [b, a];
  const fa = Math.random() < 0.12 * tl(a.m, 'first'), fb = Math.random() < 0.12 * tl(b.m, 'first');
  if (fa !== fb) return fa ? [a, b] : [b, a];
  const va = spdVal(a), vb = spdVal(b);
  if (va !== vb) return va > vb ? [a, b] : [b, a];
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

const STAT_NAME = { atk: '공격', def: '방어', spd: '스피드' };

// 한 번의 행동을 이벤트 목록으로 계산
// 이벤트: msg | lunge | hit | hp | status | buff | miss
export function act(att, def, skillId) {
  const ev = [];
  const an = nameOf(att), dn = nameOf(def);
  const sk = SKILLS[skillId];
  if (att.m.hp <= 0) return ev;
  // 행동 불가 상태
  if (att.status === 'frz') {
    if (Math.random() < 0.3) { att.status = null; ev.push({ t: 'msg', text: `${an}의 얼음이 녹았다!` }); ev.push({ t: 'status', side: att.side }); }
    else { ev.push({ t: 'msg', text: `${josa(an, '은/는')} 꽁꽁 얼어 움직일 수 없다!` }); return ev; }
  }
  if (att.flinch) { att.flinch = false; ev.push({ t: 'msg', text: `${josa(an, '은/는')} 움찔해서 움직이지 못했다!` }); return ev; }
  if (att.status === 'para' && Math.random() < 0.25) { ev.push({ t: 'msg', text: `${josa(an, '은/는')} 몸이 저려 움직일 수 없다!` }); return ev; }

  ev.push({ t: 'msg', text: `${an}의 ${sk.name}!`, quick: true });

  // 자기 강화 / 회복
  if (!sk.pow && (sk.buff || sk.heal)) {
    ev.push({ t: 'aura', side: att.side, el: sk.el });
    if (sk.heal) {
      const mh = maxHp(att.m);
      const before = att.m.hp;
      att.m.hp = Math.min(mh, att.m.hp + Math.round(mh * sk.heal));
      ev.push({ t: 'hp', side: att.side, hp: att.m.hp });
      ev.push({ t: 'msg', text: att.m.hp > before ? `${an}의 체력이 회복되었다!` : '그러나 체력은 이미 가득하다!' });
    }
    if (sk.buff) for (const [k, v] of Object.entries(sk.buff)) ev.push(...shiftStat(att, k, v));
    return ev;
  }
  // 명중
  const evade = Math.min(0.3, 0.04 * tl(def.m, 'flight'));
  if (Math.random() * 100 >= sk.acc * (1 - evade)) {
    ev.push({ t: 'lunge', side: att.side, el: sk.el });
    ev.push({ t: 'msg', text: `그러나 ${josa(dn, '은/는')} 공격을 피했다!` });
    return ev;
  }
  // 상태 변화 전용
  if (!sk.pow) {
    ev.push({ t: 'aura', side: def.side, el: sk.el });
    if (sk.debuff) for (const [k, v] of Object.entries(sk.debuff)) ev.push(...shiftStat(def, k, v));
    if (sk.st) ev.push(...inflict(def, sk.st, true));
    return ev;
  }
  // 공격
  const { dmg: raw, tm, crit } = calcDamage(att, def, skillId);
  let dmg = Math.min(raw, def.m.hp);
  let sturdy = false;
  if (raw >= def.m.hp && def.m.hp > 1 && !def.sturdyUsed && Math.random() < 0.2 * tl(def.m, 'sturdy')) {
    dmg = def.m.hp - 1; sturdy = true; def.sturdyUsed = true;
  }
  if (def.immortal) dmg = Math.min(dmg, Math.max(0, def.m.hp - 1)); // 튜토리얼 보호
  def.m.hp -= dmg;
  ev.push({ t: 'lunge', side: att.side, el: sk.el });
  ev.push({ t: 'hit', side: def.side, el: sk.el, big: tm > 1 || crit });
  ev.push({ t: 'hp', side: def.side, hp: def.m.hp });
  if (crit) ev.push({ t: 'msg', text: '급소에 맞았다!' });
  if (tm >= 2) ev.push({ t: 'msg', text: '천적의 일격! 효과가 엄청났다!' });
  else if (tm > 1) ev.push({ t: 'msg', text: '효과가 굉장했다!' });
  else if (tm < 1) ev.push({ t: 'msg', text: '효과가 별로인 듯하다…' });
  if (sturdy) ev.push({ t: 'msg', text: `${josa(dn, '은/는')} 끈질기게 버텼다!` });

  // 흡혈
  const drain = (sk.drain || 0) + 0.04 * tl(att.m, 'drain');
  if (drain > 0 && att.m.hp > 0 && att.m.hp < maxHp(att.m)) {
    att.m.hp = Math.min(maxHp(att.m), att.m.hp + Math.max(1, Math.round(dmg * drain)));
    ev.push({ t: 'hp', side: att.side, hp: att.m.hp });
    ev.push({ t: 'msg', text: `${josa(an, '은/는')} 상대의 피를 빨아들였다!` });
  }
  // 반동
  if (sk.recoil) {
    const r = Math.max(1, Math.round(dmg * sk.recoil));
    att.m.hp = Math.max(0, att.m.hp - r);
    ev.push({ t: 'hit', side: att.side, el: 'primal' });
    ev.push({ t: 'hp', side: att.side, hp: att.m.hp });
    ev.push({ t: 'msg', text: `${josa(an, '은/는')} 반동으로 피해를 입었다!` });
  }
  if (def.m.hp > 0) {
    if (sk.st && Math.random() < sk.p) ev.push(...inflict(def, sk.st));
    if (sk.debuff && Math.random() < sk.p) for (const [k, v] of Object.entries(sk.debuff)) ev.push(...shiftStat(def, k, v));
    if (sk.flinch && Math.random() < sk.flinch) def.flinch = true;
  }
  // 접촉 특성 반격
  if (att.m.hp > 0 && !att.status) {
    const contact = [['staticSkin', 'para', 0.08], ['flameBody', 'burn', 0.08], ['poisonPoint', 'psn', 0.08], ['frostBody', 'frz', 0.06]];
    for (const [t, st, p] of contact) {
      const lv = tl(def.m, t);
      if (lv && !sk.sp && Math.random() < Math.min(0.5, p * lv)) {
        ev.push({ t: 'msg', text: `${dn}의 ${t === 'staticSkin' ? '전기 피부' : t === 'flameBody' ? '불꽃 몸' : t === 'poisonPoint' ? '독가시' : '냉기 몸'}!` });
        ev.push(...inflict(att, st));
        break;
      }
    }
  }
  return ev;
}

function shiftStat(f, k, v) {
  const cur = f.st[k];
  const nv = Math.max(-6, Math.min(6, cur + v));
  const n = nameOf(f);
  if (nv === cur) return [{ t: 'msg', text: `${n}의 ${STAT_NAME[k]}은(는) 더 이상 변하지 않는다!` }];
  f.st[k] = nv;
  const word = v >= 2 ? '크게 올랐다!' : v > 0 ? '올랐다!' : v <= -2 ? '크게 떨어졌다!' : '떨어졌다!';
  return [{ t: 'buff', side: f.side, up: v > 0 }, { t: 'msg', text: `${n}의 ${STAT_NAME[k]}이(가) ${word}` }];
}

function inflict(f, st, verbose = false) {
  const n = nameOf(f);
  // 이미 상태이상이면 중복 적용 불가
  if (f.status) return verbose ? [{ t: 'msg', text: `그러나 ${josa(n, '은/는')} 이미 ${STATUS[f.status].name} 상태다!` }] : [];
  const core = SPECIES[f.m.sid].el;
  const immune = (st === 'burn' && core === 'fire') || (st === 'para' && core === 'thunder') || (st === 'psn' && core === 'poison') || (st === 'frz' && core === 'ice');
  if (immune) return verbose ? [{ t: 'msg', text: `${josa(n, '은/는')} ${ELEMENTS[core].name} 속성이라 끄떡없다!` }] : [];
  f.status = st;
  f.stTurns = 0;
  const text = { burn: '화상을 입었다!', para: '마비되었다!', psn: '독에 중독되었다!', frz: '꽁꽁 얼어붙었다!' }[st];
  return [{ t: 'status', side: f.side }, { t: 'msg', text: `${josa(n, '은/는')} ${text}` }];
}

// 턴 종료: 중독(최대 HP 1/16, 4턴) · 화상(최대 HP 5%, 3턴) 피해 후 지속 턴이 끝나면 자동 해제, 재생
export function endTurn(f) {
  const ev = [];
  if (f.m.hp <= 0) return ev;
  const mh = maxHp(f.m), n = nameOf(f);
  if (f.status === 'burn' || f.status === 'psn') {
    const burn = f.status === 'burn';
    const d = Math.max(1, Math.floor(burn ? mh * 0.05 : mh / 16));
    f.m.hp = Math.max(0, f.m.hp - d);
    ev.push({ t: 'hit', side: f.side, el: burn ? 'fire' : 'poison' });
    ev.push({ t: 'hp', side: f.side, hp: f.m.hp });
    ev.push({ t: 'msg', text: `${josa(n, '은/는')} ${burn ? '화상' : '독'} 피해를 입었다!`, quick: true });
    f.stTurns = (f.stTurns || 0) + 1;
    if (f.m.hp > 0 && f.stTurns >= STATUS[f.status].turns) {
      f.status = null; f.stTurns = 0;
      ev.push({ t: 'status', side: f.side });
      ev.push({ t: 'msg', text: burn ? `${n}의 화상이 나았다!` : `${n}의 몸에서 독이 빠졌다!`, quick: true });
    }
  }
  const rg = tl(f.m, 'regen');
  if (rg && f.m.hp > 0 && f.m.hp < mh) {
    f.m.hp = Math.min(mh, f.m.hp + Math.max(1, Math.round(mh * 0.02 * rg)));
    ev.push({ t: 'hp', side: f.side, hp: f.m.hp });
    ev.push({ t: 'msg', text: `${josa(n, '은/는')} 상처가 재생되었다.`, quick: true });
  }
  return ev;
}

// 적 AI: smart면 기대 피해가 가장 큰 기술 위주, 아니면 가중 무작위
export function chooseSkill(me, foe, smart) {
  const mh = maxHp(me.m);
  const scored = usableSkills(me.m).map((s) => {
    const sk = SKILLS[s];
    let v;
    if (sk.pow) {
      const { dmg } = calcDamage(me, foe, s, { roll: false });
      v = Math.min(dmg, foe.m.hp + 5) * (sk.acc / 100);
      if (dmg >= foe.m.hp) v *= 1.6;
      if (sk.recoil && me.m.hp < mh * 0.3) v *= 0.5;
    } else if (sk.heal) v = me.m.hp < mh * 0.4 ? mh * 0.35 : 0.5;
    else if (sk.buff) v = me.m.hp > mh * 0.6 && Object.keys(sk.buff).every((k) => me.st[k] < 2) ? mh * 0.2 : 1;
    else if (sk.st) v = foe.status ? 0.5 : foe.m.hp > maxHp(foe.m) * 0.5 ? mh * 0.2 : 2;
    else v = foe.m.hp > maxHp(foe.m) * 0.5 ? mh * 0.12 : 1;
    return { s, v: Math.max(0.5, v) };
  });
  if (smart) {
    scored.sort((a, b) => b.v - a.v);
    if (scored.length > 1 && Math.random() < 0.15) return scored[1].s;
    return scored[0].s;
  }
  const total = scored.reduce((a, b) => a + b.v, 0);
  let r = Math.random() * total;
  for (const x of scored) { r -= x.v; if (r <= 0) return x.s; }
  return scored[0].s;
}

export function intimidate(f, foe) {
  const lv = tl(f.m, 'intimidate');
  if (!lv) return [];
  foe.atkMul *= Math.max(0.6, 1 - 0.05 * lv);
  return [{ t: 'msg', text: `${nameOf(f)}의 위압! ${josa(nameOf(foe), '은/는')} 기가 죽었다!` }];
}
