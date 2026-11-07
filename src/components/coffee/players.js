// 커피내기 5종 공용 저장소 - 참가자 명단·소리 설정·게임 옵션
// 산악 레이스(public/coffee-bet/mountain/index.html)도 같은 키를 읽고 씀
import { MIN_PLAYERS, MAX_PLAYERS } from './games.js';

const NAMES_KEY = 'coffeeBetPlayers';
const MUTED_KEY = 'coffeeBetMuted';
const OPTIONS_KEY = 'coffeeBetOptions';
const LEGACY_BOMB_TIME_KEY = 'coffeeBetBombTime';
const DEFAULT_NAMES = ['김대리', '이과장', '박사원', '최팀장'];

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } // 저장소 접근 불가 시 기본값
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

export function loadNames() {
  const saved = read(NAMES_KEY);
  if (Array.isArray(saved) && saved.length >= MIN_PLAYERS) return saved.slice(0, MAX_PLAYERS).map(String);
  return DEFAULT_NAMES;
}

export const saveNames = (names) => write(NAMES_KEY, names);

export const loadMuted = () => read(MUTED_KEY) === true;
export const saveMuted = (muted) => write(MUTED_KEY, muted);

// 저장값이 선택지에 없으면 첫 번째 선택지로
export function loadOptions(gameId, defs = []) {
  const saved = (read(OPTIONS_KEY) || {})[gameId] || {};
  if (gameId === 'bomb' && saved.fuse == null) saved.fuse = read(LEGACY_BOMB_TIME_KEY);
  return Object.fromEntries(defs.map((d) => {
    const ok = d.choices.some((c) => c.value === saved[d.key]);
    return [d.key, ok ? saved[d.key] : d.choices[0].value];
  }));
}

export function saveOptions(gameId, opts) {
  write(OPTIONS_KEY, { ...(read(OPTIONS_KEY) || {}), [gameId]: opts });
}
