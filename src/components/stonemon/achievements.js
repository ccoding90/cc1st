// 🏆 스톤몬스터 v3.0 칭호 & 업적: 달성 시 상단 토스트 + 영구 보너스 (게임 오버·새로 시작해도 유지)
// 보너스 종류: gold(뼈조각 획득량) · capture(길들이기 성공률) · absorb(포식 능력치 흡수량) · exp(경험치)
import { SPECIES_COUNT } from './data';

export const BONUS_NAME = { gold: '뼈조각 획득량', capture: '길들이기 성공률', absorb: '포식 흡수량', exp: '경험치' };

const dexCount = (S) => {
  const c = S.codex || {};
  const ids = new Set([...Object.keys(c.eaten || {}), ...Object.keys(c.owned || {})]);
  return ids.size;
};

export const ACHIEVEMENTS = [
  { id: 'firstDevour', name: '첫 포식', title: '풋내기 포식자', desc: '처음으로 스톤몬을 포식했다', bonus: { gold: 0.05 }, check: (S) => (S.life?.devours || 0) >= 1 },
  { id: 'devour10', name: '연속 10포식', title: '굶주린 턱', desc: '길들이거나 살려 보내지 않고 10연속 포식', bonus: { absorb: 0.1 }, check: (S) => (S.life?.bestStreak || 0) >= 10 },
  { id: 'firstTame', name: '첫 길들이기', title: '초보 조련사', desc: '스톤 그물로 야생 스톤몬을 처음 길들였다', bonus: { capture: 0.05 }, check: (S) => (S.life?.tames || 0) >= 1 },
  { id: 'variantHunter', name: '변종 사냥꾼', title: '변종 사냥꾼', desc: '고대 변종(이로치)·알파 개체를 3마리 쓰러뜨렸다', bonus: { capture: 0.1 }, check: (S) => (S.life?.variants || 0) >= 3 },
  { id: 'shinyTamer', name: '빛의 조련사', title: '빛의 조련사', desc: '고대 변종(이로치)을 길들였다', bonus: { capture: 0.05 }, check: (S) => (S.life?.shinyTames || 0) >= 1 },
  { id: 'synergy', name: '유전자 각성', title: '유전자 설계자', desc: '처음으로 유전자 시너지를 각성시켰다', bonus: { absorb: 0.05 }, check: (S) => (S.life?.synergies || 0) >= 1 },
  { id: 'fossil10', name: '발굴왕', title: '발굴왕', desc: '고대 화석 바위·알 둥지를 10번 조사했다', bonus: { gold: 0.05 }, check: (S) => (S.life?.digs || 0) >= 10 },
  { id: 'hatch', name: '첫 부화', title: '알 지킴이', desc: '미확인 공룡알을 부화시켰다', bonus: { exp: 0.05 }, check: (S) => (S.life?.hatches || 0) >= 1 },
  { id: 'dex50', name: '도감 50% 달성', title: '고생물학자', desc: `도감 ${Math.ceil(SPECIES_COUNT / 2)}종 포식·길들이기`, bonus: { gold: 0.1 }, check: (S) => dexCount(S) >= Math.ceil(SPECIES_COUNT / 2) },
  { id: 'dex100', name: '도감 완성', title: '스톤 마스터', desc: `도감 ${SPECIES_COUNT}종 전부 포식·길들이기`, bonus: { exp: 0.1 }, check: (S) => dexCount(S) >= SPECIES_COUNT },
  { id: 'rivalAll', name: '숙명의 승자', title: '숙명의 승자', desc: '라이벌 카인과의 다섯 번의 대결에서 모두 이겼다', bonus: { exp: 0.05 }, check: (S) => [1, 2, 3, 4, 5].every((n) => S.flags?.[`rival${n}`]) },
  { id: 'stage5', name: '태고의 하늘 신전 정복', title: '태초의 패왕', desc: '고대 3대 신수를 모두 꺾었다', bonus: { gold: 0.1 }, check: (S) => !!S.flags?.boss5 },
  { id: 'arena10', name: '투기장 10연승', title: '투기장 챔피언', desc: '무한의 원시 투기장 10연승', bonus: { capture: 0.05 }, check: (S) => (S.life?.arenaBest || 0) >= 10 },
  { id: 'arena30', name: '투기장 30연승', title: '불멸의 투사', desc: '무한의 원시 투기장 30연승', bonus: { absorb: 0.1 }, check: (S) => (S.life?.arenaBest || 0) >= 30 },
];
export const ACH = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// 달성한 업적의 보너스 합
export function achBonus(S, kind) {
  let b = 0;
  for (const a of ACHIEVEMENTS) if (S?.ach?.[a.id] && a.bonus[kind]) b += a.bonus[kind];
  return b;
}
export const bonusText = (a) => Object.entries(a.bonus).map(([k, v]) => `${BONUS_NAME[k]} +${Math.round(v * 100)}%`).join(' · ');

// 새로 달성한 업적 목록을 돌려주고 기록한다
export function checkAchievements(S) {
  if (!S) return [];
  S.ach = S.ach || {};
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (S.ach[a.id]) continue;
    let ok = false;
    try { ok = a.check(S); } catch (e) { ok = false; }
    if (ok) { S.ach[a.id] = Date.now(); fresh.push(a); }
  }
  if (fresh.length) S.title = fresh[fresh.length - 1].title;
  return fresh;
}
