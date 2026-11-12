// 🌐 포식의 제단 - 다른 플레이어의 스톤몬과 비동기 대전 (Firestore)
// 등록한 스톤몬의 '그림자'(능력치 스냅샷)를 다른 플레이어가 AI 대전으로 상대한다.
// 그림자가 먹히면 제단에서 사라지고, 그림자가 이기면 주인에게 방어 보상이 돌아간다.
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { pack, unpack, createMonster, randomMutate, power, pick, rand } from './monster';
import { SPECIES } from './data';

const ARENA = 'stonemon_arena';
const RESULTS = 'stonemon_results';

export async function registerShadow({ ownerId, nick, mon }) {
  const ref = await addDoc(collection(db, ARENA), {
    ownerId, nick: String(nick).slice(0, 12), mon: pack(mon), power: power(mon), createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function reportResult({ target, attackerNick, attackerOwner, attackerMon, winner }) {
  await addDoc(collection(db, RESULTS), {
    targetId: target.id, targetOwner: target.ownerId, attackerNick: String(attackerNick).slice(0, 12), attackerOwner,
    attackerSid: attackerMon.sid, attackerPower: power(attackerMon), winner, createdAt: serverTimestamp(),
  });
}

// 내 그림자들의 전적 (방어 성공/실패 알림)
export async function fetchMyResults(ownerId) {
  const snap = await getDocs(query(collection(db, RESULTS), where('targetOwner', '==', ownerId), limit(50)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const WANDERERS = ['떠돌이 사냥꾼 그르릉', '뼈수집가 오크', '동굴소녀 미르', '외눈 사냥꾼 카악', '늪지기 무르', '화산족 불돌', '바다사냥꾼 해랑', '얼음족 설아'];

// 상대 목록: 실제 플레이어 그림자(먹히지 않은 것) + 부족하면 떠돌이 NPC 그림자
export async function fetchOpponents({ ownerId, myPower, myLv = 5 }) {
  let real = [];
  let online = true;
  try {
    const [arena, res] = await Promise.all([
      getDocs(query(collection(db, ARENA), orderBy('createdAt', 'desc'), limit(60))),
      getDocs(query(collection(db, RESULTS), orderBy('createdAt', 'desc'), limit(300))),
    ]);
    const eaten = new Set(res.docs.map((d) => d.data()).filter((r) => r.winner === 'attacker').map((r) => r.targetId));
    const seenOwner = new Set();
    for (const d of arena.docs) {
      const v = d.data();
      if (v.ownerId === ownerId || eaten.has(d.id) || seenOwner.has(v.ownerId)) continue;
      const mon = unpack(v.mon);
      if (!mon) continue;
      seenOwner.add(v.ownerId);
      real.push({ id: d.id, ownerId: v.ownerId, nick: v.nick || '이름없는 사냥꾼', mon, power: power(mon), real: true });
    }
  } catch (e) {
    online = false;
    console.warn('Arena load failed:', e);
  }
  // 내 전투력 근처 위주로 4명, 나머지는 무작위
  real.sort((a, b) => Math.abs(a.power - myPower) - Math.abs(b.power - myPower));
  const list = real.slice(0, 6);
  while (list.length < 4) list.push(makeWanderer(myLv, list.length));
  list.sort((a, b) => a.power - b.power);
  return { list, online };
}

function makeWanderer(myLv, i) {
  const pool = Object.values(SPECIES).filter((s) => s.tier <= 3).map((s) => s.id);
  const sid = pick(pool);
  const lv = Math.max(2, myLv + [-2, 0, 1, 3][i % 4]);
  const m = createMonster(sid, { lv });
  randomMutate(m, 3 + Math.floor(Math.random() * 10));
  m.devours = Math.floor(rand(2, 12));
  return { id: 'npc-' + Math.random().toString(36).slice(2), nick: pick(WANDERERS), mon: m, power: power(m), real: false };
}

// 💾 모험 코드(클라우드 저장): 코드 = 문서 ID. 코드를 아는 사람만 불러올 수 있다
const SAVES = 'stonemon_saves';
export async function uploadCloudSave(code, save) {
  await setDoc(doc(db, SAVES, code), { data: JSON.stringify(save), name: String(save.name || '').slice(0, 12), updatedAt: serverTimestamp() });
}
export async function downloadCloudSave(code) {
  const snap = await getDoc(doc(db, SAVES, code));
  if (!snap.exists()) return null;
  return JSON.parse(snap.data().data);
}
