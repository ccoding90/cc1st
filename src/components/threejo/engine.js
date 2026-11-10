// 🏹 쓰리조 챌린지 (탐관오리 토벌전) - 게임 엔진
// DOM 없이 동작하는 순수 Canvas/JS 모듈. 화면 껍데기(시작·게임오버·랭킹)는 ThreeJoGame.jsx
// createGame(env) => { update(dt, input), draw(ctx, t), drawUi(ctx, t), special(), setAuto(on), player(), snapshot() }
// env: { sfx, over({ score, killer, stage, time, grazes, bosses }), bombs(n) }
// input: { dx, dy: -1|0|1 (키보드), tx, ty: number|null (마우스·터치 목표 위치) }

export const W = 400;
export const H = 600;
// 도트 감성 픽셀 폰트 (ThreeJoGame.jsx에서 Galmuri 로드)
export const FONT = '"Galmuri11", "Noto Sans KR", sans-serif';

const PY = H - 72;          // 플레이어 시작 y
const MIN_Y = H * 0.3, MAX_Y = H - 40; // 상하 이동 범위
const HIT_R = 6;            // 플레이어 피격 판정 반지름 (탄막 게임식 작은 판정)
const GRAZE_R = 18;         // 판정 바로 바깥 '아슬아슬' 영역 두께
const SPEED = 330;          // 좌우 이동 속도 px/s
const MAX_HP = 3;
const MAX_BOMBS = 5;
export const HELP_SEC = 10;   // 개발자 도움 1회 = 10초 자동 플레이
export const HELP_USES = 3;   // 판당 사용 횟수

// 아이템: 지속형 버프는 sec 동안 유지
export const POWERUPS = {
  shield: { icon: '🛡️', name: '방어막', color: '#40C4FF', sec: 12, weight: 3 },
  drone: { icon: '🛰️', name: '호위 드론', color: '#B388FF', sec: 14, weight: 2 },
  magnet: { icon: '🧲', name: '자석', color: '#FF5252', sec: 12, weight: 2 },
  fire: { icon: '🔥', name: '화력 강화', color: '#FF9100', sec: 10, weight: 2 },
  slow: { icon: '⏳', name: '시간 감속', color: '#64FFDA', sec: 7, weight: 1.5 },
  star: { icon: '⭐', name: '무적 별', color: '#FFD600', sec: 6, weight: 0.8 },
  talisman: { icon: '📜', name: '부적 (필살기 +1)', color: '#FF4081', weight: 1.2 },
  gold: { icon: '💰', name: '금괴 +500', color: '#FFC400', weight: 1.8 },
};
const SHIELD_HITS = 4;
function randomPowerup() {
  const list = Object.entries(POWERUPS);
  let r = Math.random() * list.reduce((a, [, v]) => a + v.weight, 0);
  for (const [k, v] of list) if ((r -= v.weight) <= 0) return k;
  return 'shield';
}

// 무기 10단계. 1~4단계는 3레벨씩, 5~10단계는 2레벨씩 (power 0~23)
// 5 레이저 → 6 물(해일 물대포) → 7 불(화염방사기) → 8 풀(가시덩굴) → 9 번개(천둥 라이트닝)
// → 10 개발자 궁극기(키보드·마우스 핵폭격, 보스 3방컷 / 조철왕 제외)
// 6단계부터는 이전 원소를 물려받아 누적: 9단계는 물·불·풀·번개, 10단계는 4원소 + 키보드·마우스 + 핵
export const WEAPON_NAMES = ['활', '조총', '대포', '기관총', '레이저 기관총', '해일 물대포', '화염방사기', '가시덩굴', '천둥 라이트닝', '개발자 궁극기'];
export const WEAPON_ELEMENTS = ['', '', '', '', '', '💧', '🔥', '🌿', '⚡', '⌨️'];
const TIER_START = [0, 3, 6, 9, 12, 14, 16, 18, 20, 22];
const MAX_POWER = 23;
const TIER_COUNT = TIER_START.length;
const WEAPONS = [
  { interval: 0.3, speed: 520, dmg: 1, r: 4, kind: 'arrow' },
  { interval: 0.2, speed: 700, dmg: 1.3, r: 3, kind: 'ball' },
  { interval: 0.42, speed: 430, dmg: 3.6, r: 7, kind: 'cannon', splash: 30 },
  { interval: 0.075, speed: 820, dmg: 1, r: 3, kind: 'mg' },
  { interval: 0.075, speed: 820, dmg: 1, r: 3, kind: 'mg', beam: [9, 14] },
  // 6 💧 물: 물방울 산탄 + 주기적 해일(적 탄 소거)
  { interval: 0.075, speed: 840, dmg: 1, r: 3, kind: 'mg', beam: [14, 16], water: [5, 7], tsunami: 5 },
  // 7 🔥 불: + 부채꼴 관통 화염
  { interval: 0.075, speed: 860, dmg: 1.1, r: 3, kind: 'mg', beam: [16, 18], water: [6, 7], tsunami: 4.5, flame: [2.2, 2.6] },
  // 8 🌿 풀: + 유도 풀잎 수리검 · 적을 묶는 가시덩굴
  { interval: 0.07, speed: 860, dmg: 1.1, r: 3, kind: 'mg', beam: [18, 20], water: [7, 8], tsunami: 4.2, flame: [2.4, 2.6], leaf: [3, 4], vine: [3, 4] },
  // 9 ⚡ 번개: + 연쇄 라이트닝 · 하늘에서 내리꽂는 낙뢰
  { interval: 0.065, speed: 880, dmg: 1.2, r: 3, kind: 'mg', beam: [22, 24], water: [7, 9], tsunami: 4, flame: [2.6, 2.8], leaf: [4, 4], vine: [4, 5], chain: [5, 6], thunder: [2, 3] },
  // 10 ⌨️ 개발자 궁극기: 4원소 강화 + 키캡 유도탄 · 마우스 클릭 폭격 · 엔터키 핵미사일
  { interval: 0.055, speed: 920, dmg: 1.4, r: 3, kind: 'mg', beam: [28, 30], water: [9, 11], tsunami: 3.2, flame: [3, 3.2], leaf: [5, 6], vine: [5, 6], chain: [7, 8], thunder: [3, 4], keys: [4, 5], click: [3, 4], ult: true, ultra: true },
];
const tierOf = (p) => { let t = 0; while (t + 1 < TIER_COUNT && p >= TIER_START[t + 1]) t++; return t; };
const subOf = (p) => p - TIER_START[tierOf(p)];
const shotsOf = (p) => { const t = tierOf(p); return t >= 4 ? 5 : t === 3 ? 3 + subOf(p) : 1 + subOf(p); };
// 1~4단계 레벨은 기존 곡선, 이후엔 레벨당 고정치 (끝없이 비싸지지 않게)
const xpNeed = (p) => (p < 12 ? 6 + p * 4 : 28);
const ROMAN = ['I', 'II', 'III'];
const KEYCAPS = ['Ctrl', 'Alt', 'Del', 'Esc', 'F5', 'Tab', 'Shift', 'C', 'V', 'Z', 'Fn', '⌘'];
const lv = (arr, sub) => arr[sub] ?? arr[arr.length - 1];
export const weaponLabel = (p) => {
  const t = tierOf(p);
  return t <= 4 ? `${WEAPON_NAMES[t]} ×${shotsOf(p)}` : `${WEAPON_ELEMENTS[t]}${WEAPON_NAMES[t]} ${ROMAN[subOf(p)]}`;
};
export const weaponTier = tierOf;

// 1~3탄은 '성장의 재미' 구간: 적·보스 체력 -30%, 적 탄속 ×0.8, 적 등장·사격 간격 ↑ (bulletK·spawnK·fireK·bossK)
// 4탄 판교(조철왕)는 원래 난이도 유지
const STAGES = [
  { name: '1탄 · 조선 저잣거리', wave: 30, boss: 'castle', mob: { name: '포졸', hp: 1.4, speed: 72 }, heavy: { name: '세곡 수레', hp: 5.6 }, bulletK: 0.8, spawnK: 1.45, fireK: 1.8, heavyT: 8.5, bossK: 1.2 },
  { name: '2탄 · 개화기 경성', wave: 32, boss: 'zero', mob: { name: '신식 군인', hp: 2.8, speed: 85 }, heavy: { name: '인력거', hp: 11.2 }, bulletK: 0.8, spawnK: 1.25, fireK: 1.3, heavyT: 8.5, bossK: 1.15 },
  { name: '3탄 · 중고차 매매단지', wave: 28, boss: 'killer', mob: { name: '호객꾼', hp: 4.2, speed: 90 }, heavy: { name: '폐차 직전 중고차', hp: 14 }, bulletK: 0.8, spawnK: 1.2, fireK: 1.25, heavyT: 8, bossK: 1.15 },
  { name: '4탄 · 2077 판교', wave: 16, boss: 'king', mob: { name: '사이보그 병사', hp: 9, speed: 120 }, heavy: { name: '수송 드론', hp: 26 }, bulletK: 1, spawnK: 0.9, fireK: 1, heavyT: 7, bossK: 1 },
];
export const STAGE_COUNT = STAGES.length;

// 🔥 어려움 모드 (무한 루프): 조철왕을 쓰러뜨리면 1탄부터 다시, 회차(loop)마다 계속 강해짐
// hp: 적·보스 체력 / spd: 적 탄속 / atk: 공격·등장 빈도 / dens: 탄막 밀도(탄 복제) / move: 적 이동 속도
// 체력은 상한 없이 회차마다 ×1.45씩 불어나서 결국엔 버틸 수 없게 됨
export function hardK(loop) {
  if (!loop) return { hp: 1, spd: 1, atk: 1, dens: 1, move: 1 };
  const n = loop - 1;
  return {
    hp: 1.8 * Math.pow(1.45, n),
    spd: Math.min(2.4, 1.5 + 0.2 * n),
    atk: Math.min(3, 1.6 + 0.3 * n),
    dens: Math.min(3, 1.5 + 0.35 * n),
    move: Math.min(2, 1.3 + 0.15 * n),
  };
}
// 🦸 영웅 초월(초각성): 점수 10만 점마다 한국의 위인 → 현대의 영웅으로 변신 (최대 10단계 = 100만 점)
// 각성하면 기본 사격이 영웅 전용 무기로 바뀌고(원소 보조 무기는 유지), Space로 영웅 필살기(쿨타임 HERO_CD초)
export const HERO_STEP = 100000;
export const HERO_CD = 10;
const AWAKEN_SEC = 1.9; // 변신 순간 시간 정지 연출
export const HEROES = [
  { key: 'yi', name: '이순신', title: '조선의 성웅', icon: '🐢', color: '#FF5252', weapon: '신기전 불화살', ult: '거북선 출격', line: '신에게는 아직 열두 척의 배가 남아 있사옵니다' },
  { key: 'kang', name: '강감찬', title: '귀주대첩의 명장', icon: '⭐', color: '#FFD740', weapon: '문곡성 별똥별', ult: '귀주대첩 수공', line: '물을 막았다가 한꺼번에 터뜨려라!' },
  { key: 'sejong', name: '세종대왕', title: '훈민정음을 만든 성군', icon: '📜', color: '#FFAB40', weapon: '훈민정음 유도 탄막', ult: '훈민정음 반포', line: '나랏말싸미 듕귁에 달아…' },
  { key: 'jang', name: '장영실', title: '조선의 천재 과학자', icon: '⚙️', color: '#FFCA28', weapon: '톱니바퀴 관통탄', ult: '자격루 시간 정지', line: '시간마저 측정하겠사옵니다' },
  { key: 'heo', name: '허준', title: '동의보감의 명의', icon: '💉', color: '#9CCC65', weapon: '침술 속사', ult: '동의보감', line: '탐관오리 병, 침 한 방이면 낫소' },
  { key: 'gungye', name: '궁예', title: '후고구려의 미륵', icon: '👁️', color: '#FFD600', weapon: '관심법 눈빛', ult: '관심법 레이저', line: '누구인가? 지금 누가 기침 소리를 내었어?' },
  { key: 'hong', name: '홍길동', title: '활빈당 의적', icon: '🥷', color: '#7986CB', weapon: '분신 표창', ult: '동에 번쩍 서에 번쩍', line: '탐관오리의 재물은 백성에게!' },
  { key: 'kim', name: '김두한', title: '야인', icon: '👊', color: '#FF7043', weapon: '주먹 · 오렌지 주스 연사', ult: '종로 대난투', line: '사딸라!' },
  { key: 'ahn', name: '안창남', title: '한국 최초의 비행사', icon: '✈️', color: '#4FC3F7', weapon: '프로펠러 기관총', ult: '금강호 공중 폭격', line: '떴다 보아라 안창남 비행기!' },
  { key: 'jin', name: '진양철', title: '순양 회장', icon: '💵', color: '#69F0AE', weapon: '자본주의 탄막 (돈다발 · 반도체)', ult: '초밥 밥알 320개', line: '초밥 밥알이 몇 개고?!' },
];
export const HERO_COUNT = HEROES.length;
const JAMO = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ';

// ⚖️ 초각성 난이도 스케일링: 각성 1단계당 적 등장 간격 ×0.85, 체력 ×1.2, 이동·탄속 ×1.2
// 속도만은 사람이 피할 수 있는 한계(각성 ×2, 어려움 모드 합산 ×3.2)에서 멈춤. 보스 체력은 ×1.1씩 (화력 인플레 보정)
export function awakenK(lv) {
  return { hp: Math.pow(1.2, lv), spd: Math.min(2, Math.pow(1.2, lv)), move: Math.min(2, Math.pow(1.2, lv)), spawn: Math.pow(0.85, lv), boss: Math.pow(1.1, lv) };
}
// 어려움 모드(무한 루프) 배수 × 초각성 배수 = 곱연산
export function makeK(loop, lv) {
  const h = hardK(loop), a = awakenK(lv);
  return {
    hp: h.hp * a.hp, bossHp: h.hp * a.boss, spd: Math.min(3.2, h.spd * a.spd), move: Math.min(2.8, h.move * a.move),
    atk: h.atk, dens: h.dens, spawn: a.spawn, aw: a,
  };
}
const MOB_CAP = 90; // 극한 탄막에서도 프레임 유지용 적 수 상한
const RAGE_LINES = ['감히 개발자를 무시하지 마라!', '네가 감히 나를 이길 수 있을 것 같으냐?!'];
const RAGE_SEC = 3.8;

const BOSSES = {
  castle: { name: '캐슬조', title: '조선 탐관오리', hp: 133, w: 72, h: 84, reward: 1000 },
  zero: { name: '제로조', title: '개화기 군벌 장군', hp: 770, w: 74, h: 84, reward: 3000 },
  killer: { name: '킬러조', title: '악덕 중고차 딜러', hp: 1250, w: 80, h: 92, reward: 4000 },
  king: { name: '조철왕', title: '이 게임의 제작자', hp: 3200, w: 90, h: 92, reward: 0 },
};

// 적 탄 색: 어떤 배경(특히 청록색 판교)에서도 튀는 형광 주황·빨강 + 흰 테두리 (drawBullet)
const E_ORANGE = '#FF6D00', E_RED = '#FF1744', E_HOT = '#FF3D00';

import { U, drawSprite, heroSprite, heroFace, mobSprite, castleSprite, zeroSprite, killerSprite, kingSprite, awakenSprite, drawAwakenFace } from './sprites.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createGame(env) {
  const s = {
    time: 0, score: 0, stage: 0, phase: 'wave', phaseT: 0,
    p: { x: W / 2, y: PY, hp: MAX_HP, power: 0, xp: 0, inv: 1.5, fireT: 0, beamT: 0, alive: true, deadT: 0, tilt: 0 },
    bombs: 2, bombCd: 0, nova: null,
    auto: false, autoLeft: 0, autoDodgeT: 0, helps: HELP_USES, autoUsed: false, autoT: 0, autoTarget: null, autoKingLine: false,
    buffs: { shield: 0, drone: 0, magnet: 0, fire: 0, slow: 0, star: 0 }, shieldHits: 0, droneT: 0, droneA: 0,
    fever: 0, grazes: 0, combo: 0, comboT: 0, bosses: 0,
    shots: [], bullets: [], mobs: [], items: [], lasers: [], parts: [], texts: [], timers: [],
    boss: null, banner: null, shake: 0, flash: 0, scroll: 0,
    spawnT: 1.6, heavyT: 7, killer: '', ended: false, beams: [], bolts: [], waves: [], clicks: [], nukes: [], vineFx: [], blessed: false,
    loop: 0, K: makeK(0, 0), cine: null,
    heroLv: 0, heroCd: 0, heroReady: false, awake: null, ultFx: [],
  };
  const sfx = env.sfx || {};
  const play = (k) => sfx[k] && sfx[k]();

  // ---------- 공용 유틸 ----------
  const later = (delay, fn) => s.timers.push({ t: delay, fn });
  const popText = (x, y, text, color = '#fff', size = 14, life = 0.9) => s.texts.push({ x, y, text, color, size, life, max: life });
  const banner = (text, sub = '', dur = 2) => { s.banner = { text, sub, t: 0, dur }; };
  const burst = (x, y, n, colors, sp = [60, 220], life = 0.6, size = [2, 4]) => {
    for (let i = 0; i < n && s.parts.length < 900; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(sp[0], sp[1]);
      s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), max: life, c: pick(colors), size: rand(size[0], size[1]) });
    }
  };
  // 적 탄환
  // 1~3탄은 스테이지별 bulletK로 탄속을 늦춤
  // 어려움 모드: 탄속 ×K.spd, 탄막 밀도 ×K.dens (양옆으로 살짝 벌어진 복제탄 추가)
  const fire = (x, y, ang, speed, o = {}, extra = true) => {
    const v = speed * STAGES[s.stage].bulletK * s.K.spd;
    if (extra && s.K.dens > 1) {
      const d = s.K.dens - 1;
      const n = Math.floor(d) + (Math.random() < d % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) fire(x, y, ang + (i % 2 ? 1 : -1) * (0.09 + Math.floor(i / 2) * 0.07), speed * rand(0.9, 1.05), o, false);
    }
    s.bullets.push({
      x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: o.r || 5, kind: o.kind || 'orb',
      color: o.color || E_RED, src: o.src, grazed: false, homing: o.homing || 0, acc: o.acc || 0, t: 0,
      bounce: o.bounce || 0, drag: o.drag || 0, minV: (o.minV || 0) * STAGES[s.stage].bulletK * s.K.spd, spin: rand(0, 6),
    });
  };
  const aim = (x, y) => Math.atan2(s.p.y - y, s.p.x - x);
  const setBombs = (n) => { s.bombs = clamp(n, 0, MAX_BOMBS); env.bombs && env.bombs(s.bombs); };
  const addScore = (v) => { s.score += v * (1 + s.loop * 0.5); }; // 어려움 모드 회차당 점수 +50%

  // ---------- 성장 ----------
  function gainXp(v) {
    const p = s.p;
    if (p.power >= MAX_POWER) { addScore(v * 10); return; }
    p.xp += v;
    while (p.power < MAX_POWER && p.xp >= xpNeed(p.power)) {
      p.xp -= xpNeed(p.power);
      powerUp();
    }
  }
  function powerUp() {
    const p = s.p;
    if (p.power >= MAX_POWER) { addScore(300); popText(p.x, p.y - 50, 'MAX +300', '#FFD166', 16); return; }
    const before = tierOf(p.power);
    p.power++;
    const evolved = tierOf(p.power) > before;
    const tier = tierOf(p.power);
    popText(p.x, p.y - 50, evolved ? `무기 진화! ${WEAPON_ELEMENTS[tier]}${WEAPON_NAMES[tier]}` : `LEVEL UP! ${weaponLabel(p.power)}`, evolved ? '#FFD166' : '#9BE7FF', evolved ? (tier >= 8 ? 14 : 18) : 14, 1.3);
    burst(p.x, p.y, evolved ? 50 : 18, ['#FFD166', '#fff', '#9BE7FF'], [80, 260], 0.8);
    if (evolved) { s.flash = 0.35; play('fanfare'); } else play('ding');
    if (evolved && tier >= 5) banner(`${tier + 1}단계 무기 해금!`, `${WEAPON_ELEMENTS[tier]} ${WEAPON_NAMES[tier]}`, 1.8);
  }

  // ---------- 플레이어 ----------
  // 방어막·무적 별이 있으면 막고 true
  function hurtOrBlock(src) {
    if (s.buffs.star > 0) return true;
    if (s.auto) { autoDodge(s.p.x, s.p.y); return true; } // 개발자 도움 중: 몸통 박치기도 흘려 보내고 적 격파
    if (s.buffs.shield > 0) { shieldHit(s.p.x, s.p.y - 20); return true; }
    hurt(src);
    return false;
  }
  function shieldHit(x, y) {
    s.shieldHits--;
    burst(x, y, 10, ['#40C4FF', '#fff'], [60, 180], 0.35);
    play('crack');
    if (s.shieldHits <= 0) { s.buffs.shield = 0; popText(s.p.x, s.p.y - 50, '방어막 파괴!', '#40C4FF', 13); }
  }
  function hurt(src) {
    const p = s.p;
    if (!p.alive || p.inv > 0 || s.buffs.star > 0) return;
    if (s.auto) { autoDodge(p.x, p.y); return; } // 개발자 도움 중엔 피해 없음
    p.hp--;
    s.shake = Math.max(s.shake, 14);
    s.flash = 0.25;
    play('bump');
    burst(p.x, p.y, 40, ['#ff5252', '#fff', '#FFD166'], [80, 280], 0.7);
    s.combo = 0;
    // 피격 시 무기 한 단계 강등 (대포 → 조총)
    const before = tierOf(p.power);
    if (before > 0) {
      const prevLen = TIER_START[before] - TIER_START[before - 1];
      p.power = TIER_START[before - 1] + Math.min(subOf(p.power), prevLen - 1);
      p.xp = 0;
      popText(p.x, p.y - 56, `무기 강등! ${WEAPON_NAMES[before]} → ${WEAPON_NAMES[tierOf(p.power)]}`, '#ff6b6b', 15, 1.4);
    } else {
      p.xp = 0;
      popText(p.x, p.y - 56, '으악!', '#ff6b6b', 15);
    }
    // 피격 직후 주변 탄 제거 (연속 피격 방지)
    s.bullets = s.bullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) > 90);
    if (p.hp <= 0) die(src);
    else p.inv = 2;
  }
  function die(src) {
    const p = s.p;
    if (!p.alive) return;
    p.alive = false;
    p.hp = 0;
    s.killer = src || '탐관오리';
    s.shake = 24;
    s.flash = 0.6;
    play('explosion');
    burst(p.x, p.y, 120, ['#ff5252', '#FFD166', '#fff', '#444'], [100, 380], 1.3, [2, 6]);
  }

  function playerFire(dt) {
    const p = s.p;
    const tier = tierOf(p.power), w = WEAPONS[tier], n = shotsOf(p.power);
    p.fireT -= dt * (s.fever > 0 ? 1.6 : 1);
    if (s.heroLv > 0) heroFire(dt); // 초각성: 기본 사격이 영웅 전용 무기로 교체
    else if (p.fireT <= 0) {
      p.fireT += w.interval;
      if (p.fireT < 0) p.fireT = 0;
      const spread = tier === 3 ? 0.035 : 0.07;
      for (let k = 0; k < n; k++) {
        const off = k - (n - 1) / 2;
        const ang = -Math.PI / 2 + off * spread;
        s.shots.push({
          x: p.x + off * 16, y: p.y - 26, vx: Math.cos(ang) * w.speed, vy: Math.sin(ang) * w.speed,
          dmg: w.dmg * (s.buffs.fire > 0 ? 1.8 : 1), r: w.r, kind: w.kind, splash: w.splash || 0, hot: s.buffs.fire > 0,
        });
      }
      if (tier >= 2 && Math.random() < 0.35) play('tick');
    }
    const sub = subOf(p.power), hot = s.buffs.fire > 0 ? 1.8 : 1;
    // 레이저 빔 (5단계+): 관통 빔, 6단계부터 원소 색으로 바뀌며 굵어짐
    if (w.beam) {
      p.beamT -= dt;
      if (p.beamT <= 0) {
        p.beamT = 0.12;
        const width = lv(w.beam, sub);
        const dmg = (tier === 4 && sub === 0 ? 1.6 : 2.4) + Math.max(0, tier - 5) * 0.5 + (w.ultra ? 1.5 : 0);
        s.beams.push({ x: p.x, w: width, life: 0.1, tier, seed: Math.random() * 1000 });
        hitColumn(p.x, w.ultra ? width * 1.4 : width, dmg * hot);
      }
    }
    // 💧 물 (6단계+): 물방울 산탄 + 주기적으로 화면을 쓸어 올리는 해일 (적 탄 소거)
    if (w.water) {
      p.sgT = (p.sgT || 0) - dt;
      if (p.sgT <= 0) {
        p.sgT = 0.42;
        const cnt = lv(w.water, sub);
        for (let i = 0; i < cnt; i++) {
          const ang = -Math.PI / 2 + (i - (cnt - 1) / 2) * 0.1 + rand(-0.03, 0.03);
          const v = rand(620, 740);
          s.shots.push({ x: p.x, y: p.y - 28, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, dmg: 1.6 * hot, r: 4, kind: 'water', splash: 0 });
        }
      }
      p.waveT = (p.waveT ?? 2) - dt;
      if (p.waveT <= 0) {
        p.waveT = w.tsunami;
        s.waves.push({ y: p.y - 10, hits: new Set(), dmg: (w.ultra ? 12 : 8) * hot, bossDmg: (w.ultra ? 40 : 24) * hot });
        popText(p.x, p.y - 60, '🌊 해일!', '#40C4FF', 15, 0.9);
        play('splash');
      }
    }
    // 🔥 불 (7단계+): 앞쪽 부채꼴로 퍼지는 관통 불길
    if (w.flame) {
      p.flameT = (p.flameT || 0) - dt;
      if (p.flameT <= 0) {
        p.flameT = 0.045;
        const k = lv(w.flame, sub);
        const cnt = Math.round(2 + k);
        for (let i = 0; i < cnt; i++) {
          const ang = -Math.PI / 2 + rand(-0.32, 0.32) * (w.ultra ? 1.4 : 1.2);
          const v = rand(430, 560);
          s.shots.push({
            x: p.x + rand(-6, 6), y: p.y - 30, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
            dmg: 0.55 * k * hot, r: 6, kind: 'flame', pierce: true, hits: new Set(), life: w.ultra ? 0.95 : 0.85, t: 0, ultra: !!w.ultra,
          });
        }
        if (Math.random() < 0.15) play('whoosh');
      }
    }
    // 🌿 풀 (8단계+): 적을 쫓아가 2~3마리를 베고 지나가는 풀잎 수리검 + 땅에서 솟아 적을 묶는 가시덩굴
    if (w.leaf) {
      p.leafT = (p.leafT || 0) - dt;
      if (p.leafT <= 0) {
        p.leafT = 0.5;
        const cnt = lv(w.leaf, sub);
        for (let i = 0; i < cnt; i++) {
          const ang = -Math.PI / 2 + (i - (cnt - 1) / 2) * 0.55;
          s.shots.push({
            x: p.x, y: p.y - 24, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300, dmg: 2.4 * hot, r: 7, kind: 'leaf',
            pierce: true, maxHits: 3, hits: new Set(), homing: true, life: 2.4, t: 0, spin: rand(0, 6), trailT: 99,
          });
        }
      }
    }
    if (w.vine) {
      p.vineT = (p.vineT ?? 0.6) - dt;
      if (p.vineT <= 0) {
        p.vineT = w.ultra ? 1.1 : 1.5;
        const cnt = lv(w.vine, sub);
        const targets = s.mobs.filter((m) => m.hp > 0 && m.y > 10 && m.y < H - 40 && !(m.rootT > 0))
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, cnt);
        for (const m of targets) {
          m.rootT = 1.8;
          m.frozen = false;
          m.rootDps = (w.ultra ? 6 : 4) * hot;
          burst(m.x, m.y + m.r, 8, ['#2E7D32', '#76FF03', '#C6FF00'], [40, 140], 0.4);
        }
        const b = s.boss;
        if (b && !b.entering && !b.dead) {
          damageBoss(b, (w.ultra ? 14 : 9) * hot, b.x, b.y + b.h / 2);
          s.vineFx.push({ x: b.x, y: b.y + b.h / 2 - 6, w: b.w, life: 0.9, max: 0.9 });
        }
        if (targets.length || b) play('crack');
      }
    }
    // ⚡ 번개 (9단계+): 가까운 적들에게 튀는 연쇄 라이트닝 + 하늘에서 내리꽂는 낙뢰
    if (w.chain) {
      p.chainT = (p.chainT || 0) - dt;
      if (p.chainT <= 0) {
        p.chainT = w.ultra ? 0.14 : 0.2;
        const max = lv(w.chain, sub);
        const dmg = (w.ultra ? 4 : 2.6) * hot;
        const pts = [{ x: p.x, y: p.y - 30 }];
        const used = new Set();
        let from = pts[0];
        for (let i = 0; i < max; i++) {
          let best = null, bd = 260;
          for (const m of s.mobs) {
            if (used.has(m) || m.hp <= 0 || m.y < 0) continue;
            const d = Math.hypot(m.x - from.x, m.y - from.y);
            if (d < bd) { bd = d; best = m; }
          }
          if (!best) break;
          used.add(best);
          best.hp -= dmg; best.flashT = 0.06;
          from = { x: best.x, y: best.y };
          pts.push(from);
        }
        const b = s.boss;
        if (b && !b.entering && !b.dead && pts.length <= max) {
          const bp = { x: b.x, y: b.y + b.h / 4 };
          if (Math.hypot(bp.x - from.x, bp.y - from.y) < 480) { damageBoss(b, dmg, bp.x, bp.y); pts.push(bp); }
        }
        if (pts.length > 1) { s.bolts.push({ pts, life: 0.12, ultra: !!w.ultra }); if (Math.random() < 0.3) play('tick'); }
      }
    }
    if (w.thunder) {
      p.thunderT = (p.thunderT ?? 1) - dt;
      if (p.thunderT <= 0) {
        p.thunderT = w.ultra ? 0.9 : 1.2;
        const cnt = lv(w.thunder, sub);
        const pool = s.mobs.filter((m) => m.hp > 0 && m.y > 20);
        const b = s.boss;
        const hasBoss = b && !b.entering && !b.dead;
        for (let i = 0; i < cnt; i++) {
          let tx, ty;
          if (hasBoss && (i === 0 || !pool.length)) { tx = b.x + rand(-b.w / 3, b.w / 3); ty = b.y; }
          else if (pool.length) { const m = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; tx = m.x; ty = m.y; }
          else break;
          const dmg = (w.ultra ? 11 : 7) * hot;
          for (const m of s.mobs) if (m.hp > 0 && Math.hypot(m.x - tx, m.y - ty) < 42 + m.r) { m.hp -= dmg; m.flashT = 0.08; }
          if (hasBoss && Math.abs(tx - b.x) < b.w / 2 + 20 && Math.abs(ty - b.y) < b.h / 2 + 20) damageBoss(b, dmg, tx, ty);
          const pts = [{ x: tx + rand(-30, 30), y: 0 }];
          for (let yy = 50; yy < ty; yy += 50) pts.push({ x: tx + rand(-24, 24), y: yy });
          pts.push({ x: tx, y: ty });
          s.bolts.push({ pts, life: 0.22, ultra: !!w.ultra, sky: true });
          burst(tx, ty, 14, ['#FFEA00', '#fff', '#82B1FF'], [60, 220], 0.4);
        }
        s.flash = Math.max(s.flash, 0.08);
        s.shake = Math.max(s.shake, 4);
        play('crack');
      }
    }
    // ⌨️ 개발자 궁극기 (10단계): 키캡 유도탄 · 마우스 클릭 폭격 · 엔터키 핵미사일
    if (w.keys) {
      p.missileT = (p.missileT || 0) - dt;
      if (p.missileT <= 0) {
        p.missileT = 0.3;
        const cnt = lv(w.keys, sub);
        for (let i = 0; i < cnt; i++) {
          const side = i % 2 ? 1 : -1, ang = -Math.PI / 2 + side * (0.5 + Math.floor(i / 2) * 0.35);
          s.shots.push({
            x: p.x + side * 14, y: p.y - 18, vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260,
            dmg: 5 * hot, r: 8, kind: 'key', label: pick(KEYCAPS), spin: rand(-0.4, 0.4), splash: 34, homing: true, life: 3, t: 0, trailT: 99,
          });
        }
      }
    }
    if (w.click) {
      p.clickT = (p.clickT ?? 0.4) - dt;
      if (p.clickT <= 0) {
        p.clickT = 0.6;
        const cnt = lv(w.click, sub);
        const pool = s.mobs.filter((m) => m.hp > 0 && m.y > 20).sort((a, b) => b.max - a.max);
        const b = s.boss;
        if (b && !b.entering && !b.dead) s.clicks.push({ x: b.x + rand(-b.w / 3, b.w / 3), y: b.y + rand(-b.h / 4, b.h / 4), t: 0, boss: true });
        for (let i = 0; i < cnt && pool.length; i++) { const m = pool.shift(); s.clicks.push({ x: m.x, y: m.y, t: 0, mob: m }); }
      }
    }
    if (w.ult) fireUltimate(dt);
  }

  // 마우스 클릭 폭격: 커서가 적에게 붙은 뒤 0.28초 후 '딸깍' 폭발
  function updateClicks(dt) {
    const hot = s.buffs.fire > 0 ? 1.8 : 1;
    for (const c of s.clicks) {
      c.t += dt;
      if (c.mob && c.mob.hp > 0) { c.x = c.mob.x; c.y = c.mob.y; }
      if (!c.done && c.t > 0.28) {
        c.done = true;
        const dmg = 12 * hot;
        for (const m of s.mobs) if (m.hp > 0 && Math.hypot(m.x - c.x, m.y - c.y) < 46 + m.r) { m.hp -= dmg; m.flashT = 0.08; }
        const b = s.boss;
        if (b && !b.entering && !b.dead && Math.abs(c.x - b.x) < b.w / 2 + 30 && Math.abs(c.y - b.y) < b.h / 2 + 30) damageBoss(b, dmg, c.x, c.y);
        burst(c.x, c.y, 14, ['#fff', '#18FFFF', '#E040FB'], [60, 200], 0.4);
        popText(c.x, c.y - 18, pick(['딸깍!', 'CLICK!', '더블클릭!', '우클릭!']), '#18FFFF', 11, 0.5);
        if (Math.random() < 0.4) play('tick');
      }
    }
    s.clicks = s.clicks.filter((c) => c.t < 0.5);
  }

  // 엔터키 핵미사일 (10단계): 일정 주기로 발사 → 적에 닿거나 화면 위쪽에서 기폭
  // 기폭 시 화면 전체 적에게 큰 피해 + 적 탄 전부 소거. 보스는 3방이면 끝 (조철왕만 예외)
  function fireUltimate(dt) {
    const p = s.p;
    p.ultT = (p.ultT ?? 1.2) - dt;
    if (p.ultT > 0) return;
    p.ultT = 4;
    s.shots.push({ x: p.x, y: p.y - 40, vx: 0, vy: -480, dmg: 40, r: 16, kind: 'ult', ult: true, life: 3, t: 0 });
    popText(p.x, p.y - 70, pick(['Ctrl+Alt+NUKE!', 'git push --force ☢️', 'sudo rm -rf 탐관오리/*', 'Enter ↵ 핵발사!']), '#FFD166', 13, 1);
    s.shake = Math.max(s.shake, 5);
    play('explosion');
  }
  function detonate(sh) {
    if (sh.dead) return;
    sh.dead = true;
    const hot = s.buffs.fire > 0 ? 1.8 : 1;
    s.nukes.push({ x: sh.x, y: sh.y, t: 0 });
    for (const m of s.mobs) if (m.hp > 0 && m.y > -20) { m.hp -= sh.dmg * hot; m.flashT = 0.12; }
    const n = s.bullets.length;
    for (const bl of s.bullets) burst(bl.x, bl.y, 1, ['#FFD166', '#fff'], [30, 90], 0.3);
    s.bullets.length = 0;
    if (n) addScore(n * 3);
    const b = s.boss;
    if (b && !b.entering && !b.dead) ultHitBoss(b, sh);
    s.shake = Math.max(s.shake, 22);
    s.flash = Math.max(s.flash, 0.55);
    burst(sh.x, sh.y, 70, ['#FFD166', '#FF6D00', '#fff', '#76FF03', '#E040FB'], [100, 420], 0.9, [2, 6]);
    play('explosion');
  }
  function ultHitBoss(b, sh) {
    if (b.entering || b.dead) return;
    if (b.key === 'king') {
      // 조철왕은 제작자라 3방컷이 통하지 않음 (큰 피해만 주고, 원래대로 체력 1 고정 규칙 적용)
      damageBoss(b, 90, sh.x, sh.y);
      popText(b.x, b.y + 56, pick(['조철왕: "내 키보드로 날 쳐?"', '조철왕: "3방컷? 나한텐 안 통해~"', '제작자 면역!']), '#18FFFF', 12, 1);
    } else {
      b.ultHits = (b.ultHits || 0) + 1;
      const left = 3 - b.ultHits;
      damageBoss(b, left <= 0 ? b.hp + 1 : b.max / 3, b.x, b.y);
      popText(b.x, b.y + 56, left > 0 ? `☢️ 핵폭격 명중! ${b.ultHits}/3` : '💥 3방컷!', '#FFD166', 16, 1);
    }
    burst(b.x, b.y, 40, ['#FFD166', '#fff', '#E040FB', '#18FFFF'], [80, 320], 0.7, [2, 5]);
  }

  // 해일: 화면 전체 폭으로 위로 쓸려 올라가며 적에게 한 번씩 피해 + 적 탄 소거
  function updateWaves(dt) {
    for (const wv of s.waves) {
      wv.y -= 520 * dt;
      for (const m of s.mobs) if (m.hp > 0 && !wv.hits.has(m) && Math.abs(m.y - wv.y) < 22 + m.r) { wv.hits.add(m); m.hp -= wv.dmg; m.flashT = 0.08; }
      for (const bl of s.bullets) if (Math.abs(bl.y - wv.y) < 20) bl.dead = true;
      const b = s.boss;
      if (b && !wv.hits.has(b) && !b.entering && !b.dead && Math.abs(b.y - wv.y) < b.h / 2) { wv.hits.add(b); damageBoss(b, wv.bossDmg, b.x, wv.y); burst(b.x, wv.y, 16, ['#40C4FF', '#fff'], [60, 200], 0.4); }
    }
    s.waves = s.waves.filter((wv) => wv.y > -40);
  }

  // 유도탄 조향 · 화염 수명 · 핵 기폭 고도
  function steerShots(dt) {
    for (const sh of s.shots) {
      if (!sh.life) continue;
      sh.t += dt;
      if (sh.t > sh.life) { sh.dead = true; continue; }
      if (sh.ult) { if (sh.y < 130) detonate(sh); continue; }
      if (sh.kind === 'leaf' || sh.kind === 'gear' || sh.kind === 'shuri') sh.spin += dt * 16;
      if (sh.kind === 'flame') {
        sh.vx *= 1 - dt * 1.2; sh.vy *= 1 - dt * 1.2;
        sh.r = 6 + sh.t * (sh.ultra ? 34 : 26);
      } else if (sh.homing) {
        let tx = null, ty = null, bd = 1e9;
        for (const m of s.mobs) {
          if (m.hp <= 0 || m.y < 0 || (sh.hits && sh.hits.has(m))) continue;
          const d = Math.hypot(m.x - sh.x, m.y - sh.y);
          if (d < bd) { bd = d; tx = m.x; ty = m.y; }
        }
        const b = s.boss;
        if (b && !b.entering && !b.dead && !(sh.hits && sh.hits.has(b)) && (tx === null || Math.hypot(b.x - sh.x, b.y - sh.y) < bd)) { tx = b.x; ty = b.y; }
        const sp = Math.min(sh.kind === 'leaf' ? 560 : 720, Math.hypot(sh.vx, sh.vy) + dt * 900);
        let a = Math.atan2(sh.vy, sh.vx);
        if (tx !== null) {
          let da = Math.atan2(ty - sh.y, tx - sh.x) - a;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          a += clamp(da, -dt * 7, dt * 7);
        }
        sh.vx = Math.cos(a) * sp; sh.vy = Math.sin(a) * sp;
        sh.trailT -= dt;
        if (sh.trailT <= 0) { sh.trailT = 0.03; s.parts.push({ x: sh.x, y: sh.y, vx: rand(-20, 20), vy: rand(10, 40), life: 0.3, max: 0.3, c: pick(['#FFD166', '#ff7043', '#B0BEC5']), size: 2.5 }); }
      }
    }
  }


  // ---------- 🦸 영웅 초월(초각성) ----------
  const heroChanged = () => {
    const h = HEROES[s.heroLv - 1];
    s.heroReady = !!h && s.heroCd <= 0;
    env.hero && env.hero(h ? { lv: s.heroLv, name: h.name, icon: h.icon, ult: h.ult, ready: s.heroReady } : null);
  };
  // 영웅 무기 화력: 현재 무기 단계의 기본 사격 DPS를 기준으로 (각성해도 약해지지 않게) + 각성 단계 보너스
  function heroPower() {
    const p = s.p, w = WEAPONS[tierOf(p.power)];
    return Math.max(16, (shotsOf(p.power) * w.dmg) / w.interval) * (1.25 + 0.12 * s.heroLv) * (s.buffs.fire > 0 ? 1.8 : 1);
  }
  const vel = (a, v) => ({ vx: Math.cos(a) * v, vy: Math.sin(a) * v });
  const heroShot = (o) => s.shots.push({ splash: 0, r: 4, ...o });
  const homingShot = (o) => heroShot({ homing: true, life: 2.4, t: 0, trailT: 99, ...o });
  function heroFire(dt) {
    const p = s.p, h = HEROES[s.heroLv - 1], dps = heroPower();
    const up = -Math.PI / 2, x = p.x, y = p.y - 26;
    // 진양철: 사방으로 쏟아지는 돈다발·반도체 칩 (전방위 유도)
    if (h.key === 'jin') {
      p.ringT = (p.ringT ?? 0.3) - dt;
      if (p.ringT <= 0) {
        p.ringT = 0.45;
        const n = 14, d = (dps * 0.45 * 0.7) / n, off = rand(0, 1);
        for (let i = 0; i < n; i++) homingShot({ x, y: y + 10, ...vel(((i + off) / n) * Math.PI * 2, 230), dmg: d, r: 6, kind: i % 2 ? 'chip' : 'money', life: 2.6 });
      }
    }
    if (p.heroT > 0) { p.heroT -= dt * (s.fever > 0 ? 1.6 : 1); return; }
    const go = (iv) => { p.heroT = iv; return dps * iv; }; // 이번 발사에 나눠 줄 총 피해
    switch (h.key) {
      case 'yi': { // 신기전: 7갈래 부채꼴 불화살
        const d = (go(0.14) * 1.4) / 7;
        for (let i = 0; i < 7; i++) heroShot({ x: x + (i - 3) * 3, y, ...vel(up + (i - 3) * 0.17, 620), dmg: d, kind: 'singi', r: 4, splash: i % 3 === 0 ? 20 : 0 });
        break;
      }
      case 'kang': { // 별똥별: 유도 별 2 + 직진 별 2
        const d = (go(0.16) * 1.2) / 4;
        for (const k of [-1, 1]) homingShot({ x: x + k * 10, y, ...vel(up + k * 0.6, 340), dmg: d, r: 6, kind: 'hstar', spin: 0 });
        for (const k of [-1, 1]) heroShot({ x: x + k * 5, y, ...vel(up + k * 0.05, 700), dmg: d, r: 5, kind: 'hstar' });
        break;
      }
      case 'sejong': { // 훈민정음 자모가 유도탄처럼
        const d = (go(0.15) * 1.25) / 4;
        for (let i = 0; i < 4; i++) homingShot({ x, y, ...vel(up + (i - 1.5) * 0.5, 300), dmg: d, r: 7, kind: 'glyph', label: pick(JAMO), life: 2.6 });
        break;
      }
      case 'jang': { // 회전하며 4마리까지 관통하는 톱니바퀴
        const d = (go(0.24) * 0.9) / 3;
        for (let i = 0; i < 3; i++) heroShot({ x, y, ...vel(up + (i - 1) * 0.22, 520), dmg: d, r: 9, kind: 'gear', pierce: true, maxHits: 4, hits: new Set(), life: 1.5, t: 0, spin: rand(0, 6) });
        break;
      }
      case 'heo': { // 침술 속사: 아주 빠른 3연침
        const d = go(0.05) / 3;
        for (let i = 0; i < 3; i++) heroShot({ x: x + (i - 1) * 5, y, ...vel(up + (i - 1) * 0.035, 1050), dmg: d, r: 3, kind: 'needle' });
        break;
      }
      case 'gungye': { // 관심법 눈빛: 금빛 관통 광선
        const d = (go(0.12) * 0.8) / 2;
        for (const k of [-1, 1]) heroShot({ x: x + k * 9, y, ...vel(up, 950), dmg: d, r: 6, kind: 'eye', pierce: true, maxHits: 5, hits: new Set(), life: 1.2, t: 0 });
        break;
      }
      case 'hong': { // 분신술: 본체 + 좌우 분신이 함께 유도 표창
        const d = (go(0.14) * 1.1) / 3;
        for (const ox of [0, -40, 40]) homingShot({ x: x + ox, y: y + (ox ? 14 : 0), ...vel(up + ox * 0.006, 420), dmg: d, r: 6, kind: 'shuri', spin: rand(0, 6), life: 2.2 });
        break;
      }
      case 'kim': { // 주먹(가끔 오렌지 주스) 초고속 연사
        const d = go(0.055) / 2;
        for (const k of [-1, 1]) heroShot({ x: x + k * 7, y, ...vel(up + rand(-0.07, 0.07), 780), dmg: d, r: 7, kind: 'fist', label: Math.random() < 0.22 ? '🧃' : '👊' });
        break;
      }
      case 'ahn': { // 프로펠러 기관총: 5갈래 예광탄
        const d = go(0.08) / 5;
        for (let i = 0; i < 5; i++) heroShot({ x: x + (i - 2) * 5, y, ...vel(up + (i - 2) * 0.1, 900), dmg: d, r: 3, kind: 'prop' });
        break;
      }
      default: { // 진양철: 정면 돈다발
        const d = (go(0.1) * 0.55) / 2;
        for (const k of [-1, 1]) heroShot({ x: x + k * 8, y, ...vel(up + k * 0.04, 700), dmg: d, r: 7, kind: 'money' });
      }
    }
    if (Math.random() < 0.2) play('tick');
  }

  // 필살기 공통 타격: 엘리트도 거의 한 방에 (적 최대 체력 70% + 영웅 화력 비례)
  const ultHitMob = (m, pow) => { if (m.hp <= 0) return; m.hp -= pow * 4 + m.max * 0.7; m.flashT = 0.12; };
  const ultHitHeroBoss = (b, pow, x, y, k = 1) => { if (b && !b.entering && !b.dead) damageBoss(b, (b.max * 0.05 + pow * 3) * k, x, y); };
  function clearBullets(pred = () => true) {
    let n = 0;
    for (const bl of s.bullets) if (!bl.dead && pred(bl)) { bl.dead = true; n++; if (n % 2) burst(bl.x, bl.y, 1, ['#FFD166', '#fff'], [30, 90], 0.3); }
    s.bullets = s.bullets.filter((bl) => !bl.dead);
    if (n) addScore(n * 5);
    return n;
  }
  function ultStrike(fx) {
    clearBullets();
    for (const m of s.mobs) if (m.y > -20) ultHitMob(m, fx.pow);
    if (s.boss) ultHitHeroBoss(s.boss, fx.pow, s.boss.x, s.boss.y);
  }
  function heroUlt() {
    const p = s.p, h = HEROES[s.heroLv - 1];
    s.heroCd = HERO_CD;
    p.inv = Math.max(p.inv, 1.5);
    s.lasers = s.lasers.filter((lz) => lz.final);
    s.shake = Math.max(s.shake, 16);
    s.flash = Math.max(s.flash, 0.3);
    play('explosion');
    later(0.15, () => play('fanfare'));
    const fx = { key: h.key, t: 0, dur: 1.6, hits: new Set(), pow: heroPower(), x: p.x, y: p.y, n: 0 };
    s.banner = null; // 필살기 대사가 화면 중앙에 크게 뜨므로 배너는 치움
    switch (h.key) {
      case 'yi': fx.y = H + 90; fx.dur = 1.55; break; // 거북선: 화면 아래에서 위로 돌진
      case 'kang': fx.y = H + 40; fx.dur = 1.45; break; // 수공: 둑을 터뜨린 물벽이 위로
      case 'ahn': fx.x = -110; fx.dur = 1.4; break; // 비행기: 왼쪽 → 오른쪽 폭격
      case 'sejong':
        ultStrike(fx);
        for (let i = 0; i < 40; i++) homingShot({ x: p.x, y: p.y - 20, ...vel((i / 40) * Math.PI * 2, 260), dmg: fx.pow * 0.08, r: 8, kind: 'glyph', label: pick(JAMO), life: 2.8, big: true });
        break;
      case 'jang': // 자격루: 적 3초 정지 + 보스 공격 지연
        fx.dur = 3;
        ultStrike(fx);
        for (const m of s.mobs) { m.rootT = 3; m.rootDps = fx.pow * 0.25; m.frozen = true; }
        if (s.boss) s.boss.atkT += 2.5;
        break;
      case 'heo':
        ultStrike(fx);
        if (p.hp < MAX_HP) { p.hp++; popText(p.x, p.y - 60, '동의보감! 체력 +1', '#69F0AE', 15, 1.2); }
        else popText(p.x, p.y - 60, '무병장수!', '#69F0AE', 15, 1);
        burst(p.x, p.y, 40, ['#69F0AE', '#C5E1A5', '#fff'], [80, 260], 0.9);
        break;
      case 'gungye': fx.dur = 1.7; fx.caption = '누구인가?'; break; // 0.45초 뒤 금빛 레이저
      case 'hong': fx.dur = 1.1; fx.slashes = []; ultStrike(fx); break;
      case 'kim': fx.dur = 1.3; fx.caption = '사딸라!'; later(0.15, () => ultStrike(fx)); break;
      case 'jin': fx.dur = 2.2; fx.caption = '초밥 밥알이 몇 개고?!'; break; // 0.45초 뒤 밥알 320개 대폭발
      default: ultStrike(fx);
    }
    s.ultFx.push(fx);
    heroChanged();
    return true;
  }
  // 휩쓸고 지나가는 필살기(거북선·물벽·비행기): 닿는 순간 적·탄 처리
  function sweepHit(fx, inBand) {
    for (const m of s.mobs) if (m.hp > 0 && !fx.hits.has(m) && inBand(m.x, m.y, m.r)) { fx.hits.add(m); ultHitMob(m, fx.pow); }
    const b = s.boss;
    if (b && !fx.hits.has(b) && !b.entering && !b.dead && inBand(b.x, b.y, Math.max(b.w, b.h) / 2)) { fx.hits.add(b); ultHitHeroBoss(b, fx.pow, b.x, b.y, 1.2); }
  }
  function updateUltFx(dt) {
    for (const fx of s.ultFx) {
      const t0 = fx.t;
      fx.t += dt;
      const at = (k) => t0 < k && fx.t >= k;
      if (fx.key === 'yi' || fx.key === 'kang') {
        fx.y -= (fx.key === 'yi' ? 720 : 640) * dt;
        const band = fx.key === 'yi' ? 70 : 60;
        sweepHit(fx, (x, y, r) => Math.abs(y - fx.y) < band + r);
        clearBullets((bl) => bl.y > fx.y - band);
        if (fx.key === 'yi' && (fx.n += dt) > 0.07) { // 거북선 옆구리 포격
          fx.n = 0;
          for (const sx of [-1, 1]) burst(W / 2 + sx * 70, fx.y + rand(-20, 30), 4, ['#FF6D00', '#FFD166', '#fff'], [60, 200], 0.4);
          if (Math.random() < 0.4) play('explosion');
        }
      } else if (fx.key === 'ahn') {
        fx.x += 430 * dt;
        sweepHit(fx, (x, y, r) => Math.abs(x - fx.x) < 46 + r);
        clearBullets((bl) => bl.x < fx.x + 40);
        if ((fx.n += dt) > 0.05) { fx.n = 0; burst(fx.x + rand(-20, 20), rand(130, H * 0.7), 10, ['#FF6D00', '#FFD166', '#fff', '#555'], [60, 220], 0.5); }
      } else if (fx.key === 'gungye') {
        if (at(0.45)) { ultStrike(fx); s.flash = 0.6; s.shake = 24; play('explosion'); }
        if (fx.t > 0.45 && fx.t < 1.5) {
          clearBullets();
          for (const m of s.mobs) if (m.hp > 0 && m.y > -20) { m.hp -= fx.pow * 2 * dt; m.flashT = 0.05; }
          if (s.boss) ultHitHeroBoss(s.boss, fx.pow, s.boss.x, s.boss.y + s.boss.h / 2, dt * 0.6);
        }
      } else if (fx.key === 'hong') {
        if ((fx.n += dt) > 0.09 && fx.t < 0.8) {
          fx.n = 0;
          const y0 = rand(40, H * 0.75), y1 = y0 + rand(-160, 160);
          fx.slashes.push({ y0, y1, t: 0 });
          for (const m of s.mobs) if (m.hp > 0) { const ly = y0 + ((y1 - y0) * m.x) / W; if (Math.abs(m.y - ly) < 24 + m.r) { m.hp -= fx.pow * 0.8; m.flashT = 0.08; } }
          const b = s.boss;
          if (b) { const ly = y0 + ((y1 - y0) * b.x) / W; if (Math.abs(b.y - ly) < b.h / 2 + 20) ultHitHeroBoss(b, fx.pow, b.x, ly, 0.12); }
          play('whoosh');
        }
        for (const sl of fx.slashes) sl.t += dt;
      } else if (fx.key === 'kim') {
        if ((fx.n += dt) > 0.03 && fx.t < 0.7) {
          fx.n = 0;
          for (let i = 0; i < 2; i++) heroShot({ x: rand(16, W - 16), y: H + 10, ...vel(-Math.PI / 2 + rand(-0.12, 0.12), rand(560, 760)), dmg: fx.pow * 0.08, r: 9, kind: 'fist', label: Math.random() < 0.3 ? '🧃' : '👊', big: true });
        }
      } else if (fx.key === 'jin') {
        if (at(0.45)) {
          // 🍣 초밥 밥알 320개 대폭발
          const cx = W / 2, cy = H * 0.42;
          for (let i = 0; i < 320; i++) {
            const a = (i / 320) * Math.PI * 2 + rand(-0.02, 0.02);
            heroShot({ x: cx, y: cy, ...vel(a, rand(200, 520)), dmg: fx.pow * 0.05, r: 4, kind: 'grain', pierce: true, maxHits: 3, hits: new Set(), life: 1.8, t: 0 });
          }
          ultStrike(fx);
          burst(cx, cy, 80, ['#fff', '#FFF8E1', '#FF7043', '#FFD166'], [100, 420], 1, [2, 5]);
          s.flash = 0.7;
          s.shake = 30;
          popText(cx, cy + 60, '밥알 320개! 전원 해고!', '#fff', 16, 1.2);
          play('explosion');
        }
      }
    }
    s.ultFx = s.ultFx.filter((fx) => fx.t < fx.dur);
  }

  // 점수가 10만 점 단위를 넘는 순간 초각성: 시간 정지 → 화면 번쩍 → 영웅 등장
  function checkAwaken() {
    if (s.awake || s.cine || !s.p.alive || s.ended || s.heroLv >= HERO_COUNT) return;
    if (s.score < (s.heroLv + 1) * HERO_STEP) return;
    s.heroLv++;
    s.heroCd = 0;
    s.K = makeK(s.loop, s.heroLv); // 적도 실시간으로 강해짐 (어려움 모드 배수와 곱연산)
    s.awake = { t: 0, dur: AWAKEN_SEC, lv: s.heroLv, boom: false };
    s.flash = 1;
    play('doom');
  }
  function updateAwake(dt) {
    const a = s.awake;
    a.t += dt;
    if (!a.boom && a.t > 0.35) { a.boom = true; play('fanfare'); }
    s.flash = Math.max(0, s.flash - dt * 2);
    if (a.t < a.dur) return;
    s.awake = null;
    const h = HEROES[s.heroLv - 1], p = s.p;
    p.inv = Math.max(p.inv, 1.5);
    s.bullets = s.bullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) > 110);
    burst(p.x, p.y, 70, [h.color, '#fff', '#FFD166'], [80, 320], 1, [2, 5]);
    s.shake = Math.max(s.shake, 14);
    banner(`${h.icon} ${h.name} 초각성!`, `Space: ${h.ult} · 적 체력 ×${s.K.aw.hp.toFixed(1)}`, 2);
    heroChanged();
  }

  // ---------- 적 ----------
  function spawnMob(x, y, kind, o = {}) {
    const st = STAGES[s.stage];
    const heavy = kind === 'heavy';
    if (s.mobs.length >= MOB_CAP) return;
    const base = heavy ? st.heavy : st.mob;
    // 👹 엘리트 몹 (1단계 각성 이후): 붉은 오라 · 크기 1.5배 · 체력 10배 · 플레이어 유도탄 · 잠시 머물며 사격
    const elite = !heavy && s.heroLv > 0 && Math.random() < Math.min(0.2, 0.06 + 0.012 * s.heroLv);
    const hp = base.hp * s.K.hp * (elite ? 10 : 1);
    s.mobs.push({
      x, y, x0: x, kind, name: elite ? `엘리트 ${base.name}` : base.name, hp, max: hp, r: heavy ? 22 : elite ? 21 : 14,
      vy: (o.vy ?? (heavy ? 45 : st.mob.speed)) * s.K.move * (elite ? 0.8 : 1), vx: (o.vx || 0) * s.K.move, zig: o.zig || 0, t: rand(0, 3),
      fireT: elite ? rand(0.8, 1.5) : rand(1.2, 2.6), hover: o.hover || (elite ? rand(90, 200) : 0), stage: s.stage, flashT: 0, elite,
    });
  }
  function spawnFormation() {
    const st = s.stage;
    const f = pick(st === 0 ? ['line', 'v', 'rain'] : ['line', 'v', 'sweep', 'zig', 'rain']);
    if (f === 'line') {
      const n = st === 0 ? 4 : 5;
      for (let i = 0; i < n; i++) spawnMob(40 + (i * (W - 80)) / (n - 1), -20);
    } else if (f === 'v') {
      const cx = rand(110, W - 110);
      for (let i = -2; i <= 2; i++) spawnMob(cx + i * 34, -20 - Math.abs(i) * 26);
    } else if (f === 'rain') {
      for (let i = 0; i < 5; i++) later(i * 0.25, () => spawnMob(rand(30, W - 30), -20));
    } else if (f === 'sweep') {
      const left = Math.random() < 0.5;
      for (let i = 0; i < 5; i++) later(i * 0.3, () => spawnMob(left ? -20 : W + 20, 60 + i * 6, 'mob', { vx: left ? 120 : -120, vy: 34 }));
    } else if (f === 'zig') {
      const cx = rand(120, W - 120);
      for (let i = 0; i < 4; i++) later(i * 0.35, () => spawnMob(cx, -20, 'mob', { zig: 70 }));
    }
    if (st === 3) {
      // 드론은 내려와 잠시 머물며 사격
      s.mobs.forEach((m) => { if (m.stage === 3 && !m.hover && m.kind === 'mob') m.hover = rand(80, 220); });
    }
  }
  function mobShoot(m) {
    const src = m.name;
    if (m.elite) {
      // 엘리트: 플레이어를 쫓아오는 유도탄 2발 + 조준탄
      for (const side of [-1, 1]) fire(m.x + side * 14, m.y + 10, aim(m.x, m.y) + side * 0.55, 135, { src, kind: 'missile', color: E_RED, r: 5, homing: 1.3 });
      later(0.25, () => { if (m.hp > 0) fire(m.x, m.y, aim(m.x, m.y), 190, { src, kind: 'orb', color: E_HOT, r: 6 }); });
      return;
    }
    if (m.stage === 0) fire(m.x, m.y, aim(m.x, m.y) + rand(-0.15, 0.15), 140, { src, kind: 'orb', color: E_RED, r: 5 });
    else if (m.stage === 1) {
      const a = aim(m.x, m.y);
      fire(m.x, m.y, a - 0.12, 175, { src, kind: 'rice', color: E_ORANGE });
      fire(m.x, m.y, a + 0.12, 175, { src, kind: 'rice', color: E_ORANGE });
    } else if (m.stage === 2) {
      // 호객꾼: 명함 2장 연속 투척
      for (let i = 0; i < 2; i++) later(i * 0.18, () => { if (m.hp > 0) fire(m.x, m.y, aim(m.x, m.y) + rand(-0.08, 0.08), 180, { src, kind: 'orb', color: E_ORANGE, r: 5 }); });
    } else {
      for (let i = 0; i < 3; i++) later(i * 0.12, () => { if (m.hp > 0) fire(m.x, m.y, aim(m.x, m.y), 230, { src, kind: 'orb', color: E_RED, r: 4 }); });
    }
  }
  function killMob(m) {
    const heavy = m.kind === 'heavy' || m.elite;
    addScore((m.elite ? 150 : heavy ? 60 : 15) * (m.stage + 1));
    if (m.elite) { popText(m.x, m.y - 26, '엘리트 격파!', '#FF5252', 13, 0.9); burst(m.x, m.y, 30, ['#FF1744', '#FF8A80', '#fff'], [80, 260], 0.7); }
    burst(m.x, m.y, heavy ? 36 : 14, m.stage === 3 ? ['#00E5FF', '#fff', '#90A4AE'] : ['#FFD166', '#ff7043', '#fff'], [60, 220], 0.6);
    play(heavy ? 'crack' : 'whoosh');
    if (heavy) {
      dropItem(m.x, m.y, 'box');
      dropItem(m.x, m.y + 10, randomPowerup());
      dropItem(m.x - 12, m.y, 'coin');
      dropItem(m.x + 12, m.y, 'coin');
      if (s.p.hp < MAX_HP && Math.random() < 0.5) dropItem(m.x, m.y - 14, 'ginseng');
    } else {
      if (Math.random() < 0.8) dropItem(m.x, m.y, 'coin');
      if (Math.random() < 0.025) dropItem(m.x, m.y, 'ginseng');
      else if (Math.random() < 0.06) dropItem(m.x, m.y, randomPowerup());
    }
  }
  function dropItem(x, y, kind) {
    s.items.push({ x, y, vx: rand(-40, 40), vy: rand(-90, -40), kind, t: 0 });
  }

  // ---------- 보스 ----------
  function spawnBoss(key) {
    const d = BOSSES[key];
    s.boss = {
      key, ...d, hp: d.hp * s.K.bossHp, max: d.hp * s.K.bossHp, x: W / 2, y: -100, ty: key === 'king' ? 135 : 128, t: 0, entering: true,
      atkT: 2, moveT: 0, tx: W / 2, rage: false, mode: 'normal', modeT: 0, shield: 0, floorT: 0, flashT: 0,
      deathT: 0, dead: false, lastAtk: '', dash: null, smokeT: 0, loopRage: s.loop > 0,
      reso: s.heroLv, resoT: 2.5, // 🔥 각성 공명: 초각성한 플레이어를 만나면 보스도 강해짐
    };
    s.shake = 22;
    play('doom');
    const sub = s.loop ? `🔥 어려움 모드 ${s.loop}회차 · 체력 ×${s.K.bossHp.toFixed(1)}` : d.title;
    banner(`⚠️ ${d.name} 등장!`, s.heroLv ? `🔥 각성 공명! 무작위 탄막 추가${s.loop ? ` · ${s.loop}회차` : ''}` : sub, 2.4);
  }

  function bossAttack(b) {
    const src = b.name;
    if (b.key === 'castle') {
      const atk = pick(['fan', 'aimed', 'tax'].filter((a) => a !== b.lastAtk));
      b.lastAtk = atk;
      if (atk === 'fan') {
        for (let i = 0; i < 7; i++) fire(b.x, b.y + 30, Math.PI / 2 + (i - 3) * 0.15, 140, { src, kind: 'orb', color: E_RED, r: 6 });
      } else if (atk === 'aimed') {
        for (let i = 0; i < 3; i++) later(i * 0.18, () => fire(b.x, b.y + 30, aim(b.x, b.y + 30), 170, { src, kind: 'orb', color: E_RED, r: 6 }));
      } else {
        popText(b.x, b.y + 50, '세금 징수!', '#FFD166', 14);
        for (let i = 0; i < 8; i++) later(i * 0.12, () => fire(rand(20, W - 20), -10, Math.PI / 2, 120, { src, kind: 'orb', color: E_RED, r: 6 }));
      }
      return b.rage ? 1.2 : 1.6;
    }
    if (b.key === 'zero') {
      const k = b.rage ? 1.15 : 1;
      const atk = pick(['spiral', 'shotgun', 'wall', 'sweep'].filter((a) => a !== b.lastAtk));
      b.lastAtk = atk;
      if (atk === 'spiral') {
        const base = Math.random() * Math.PI;
        for (let i = 0; i < 26; i++) {
          later(i * 0.06, () => {
            const a = base + i * 0.42;
            fire(b.x, b.y + 20, a, 150 * k, { src, kind: 'rice', color: E_ORANGE });
            fire(b.x, b.y + 20, a + Math.PI, 150 * k, { src, kind: 'rice', color: E_ORANGE });
          });
        }
        return 2.1;
      }
      if (atk === 'shotgun') {
        for (let r = 0; r < 3; r++) {
          later(r * 0.35, () => {
            const a = aim(b.x, b.y + 30);
            for (let i = -2; i <= 2; i++) fire(b.x, b.y + 30, a + i * 0.16, 230 * k, { src, kind: 'orb', color: E_RED });
          });
        }
        return 1.6;
      }
      if (atk === 'wall') {
        for (let r = 0; r < 2; r++) {
          later(r * 0.9, () => {
            const gap = rand(40, W - 110);
            for (let x = 10; x < W; x += 24) if (x < gap || x > gap + 74) fire(x, -10, Math.PI / 2, 130 * k, { src, kind: 'orb', color: E_HOT, r: 6 });
          });
        }
        return 2;
      }
      // 지팡이 휘두르기: 좌→우로 훑는 연속탄
      const dirL = Math.random() < 0.5;
      for (let i = 0; i < 16; i++) {
        later(i * 0.05, () => {
          const a = Math.PI / 2 + (dirL ? 1 : -1) * (0.9 - i * 0.12);
          fire(b.x, b.y + 30, a, 200 * k, { src, kind: 'rice', color: E_ORANGE });
        });
      }
      return 1.4;
    }
    if (b.key === 'killer') return killerAttack(b, src);
    // 조철왕
    // 난이도 단계: 체력 50% 이하 +1, 어려움 모드 +1 (2회차부터는 처음부터 최고 단계)
    const hard = Math.min(2, (b.max * 0.5 > b.hp ? 1 : 0) + (s.loop ? 1 : 0) + (s.loop >= 2 ? 1 : 0));
    const pool = ['curtain', 'ring', 'missile', 'rain'];
    if (hard >= 1) pool.push('curtain', 'double');
    if (s.loop) pool.push('chaos', 'chaos');
    const atk = pick(pool.filter((a) => a !== b.lastAtk));
    b.lastAtk = atk;
    if (atk === 'curtain' || atk === 'double') {
      const gapW = [86, 70, 56][hard];
      const warn = [1.3, 1.15, 1][hard];
      laserCurtain(gapW, warn, src);
      if (atk === 'double') later(warn + 0.5, () => laserCurtain(gapW, warn, src));
      // 레이저 예고 중에도 조준탄으로 압박
      for (let i = 0; i < 3; i++) later(0.3 + i * 0.3, () => fire(b.x, b.y + 30, aim(b.x, b.y + 30), 200, { src, kind: 'orb', color: E_RED, r: 4 }));
      return atk === 'double' ? 3.4 : 2.2;
    }
    if (atk === 'chaos') {
      // 어려움 모드 전용: 역회전 이중 나선 + 사이사이 조준탄 (괴랄한 탄막)
      popText(b.x, b.y + 60, pick(['디버그 모드 ON', 'while (true) { 탄막(); }', '무한 루프 탄막!']), '#FF1744', 13, 1);
      const base = Math.random() * Math.PI * 2;
      for (let i = 0; i < 30; i++) {
        later(i * 0.07, () => {
          for (let k = 0; k < 3; k++) {
            fire(b.x, b.y + 20, base + i * 0.31 + (k * Math.PI * 2) / 3, 125, { src, kind: 'rice', color: E_ORANGE }, false);
            fire(b.x, b.y + 20, -base - i * 0.31 + (k * Math.PI * 2) / 3, 105, { src, kind: 'orb', color: E_HOT, r: 4 }, false);
          }
          if (i % 6 === 0) fire(b.x, b.y + 30, aim(b.x, b.y + 30), 230, { src, kind: 'orb', color: E_RED, r: 5 });
        });
      }
      return 2.6;
    }
    if (atk === 'ring') {
      for (let r = 0; r < 3; r++) {
        later(r * 0.4, () => {
          const n = 22 + hard * 4, off = r * 0.14;
          for (let i = 0; i < n; i++) fire(b.x, b.y + 10, off + (i * Math.PI * 2) / n, 140 + hard * 20, { src, kind: 'orb', color: E_ORANGE, r: 5 });
        });
      }
      return 1.8;
    }
    if (atk === 'missile') {
      for (let i = 0; i < 4 + hard; i++) {
        later(i * 0.2, () => fire(b.x + (i % 2 ? 40 : -40), b.y + 20, Math.PI / 2 + rand(-0.8, 0.8), 150, { src, kind: 'missile', color: E_RED, r: 5, homing: 1.4 }));
      }
      return 1.9;
    }
    for (let i = 0; i < 22 + hard * 8; i++) later(i * 0.07, () => fire(rand(10, W - 10), -10, Math.PI / 2 + rand(-0.1, 0.1), rand(160, 230), { src, kind: 'rice', color: E_HOT }));
    return 1.9;
  }

  // 킬러조 (악덕 중고차 딜러): 낡은 타이어 굴리기 · 매연 분사 · 고장 난 차로 돌진
  function killerAttack(b, src) {
    const k = b.rage ? 1.15 : 1;
    const atk = pick(['tire', 'smoke', 'charge', 'tire', 'smoke', 'charge'].filter((a) => a !== b.lastAtk));
    b.lastAtk = atk;
    if (atk === 'tire') {
      // 벽에 튕기며 굴러오는 타이어
      popText(b.x, b.y + 56, pick(['폐타이어 서비스!', '타이어 덤으로 드려요~']), '#FFD166', 13);
      const n = b.rage ? 5 : 3;
      for (let i = 0; i < n; i++) {
        later(i * 0.32, () => {
          const a = Math.PI / 2 + rand(-0.75, 0.75);
          fire(b.x + rand(-28, 28), b.y + 40, a, rand(130, 165) * k, { src, kind: 'tire', color: E_HOT, r: 9, bounce: 2 });
        });
      }
      return 2.1;
    }
    if (atk === 'smoke') {
      // 배기구 매연: 퍼지면서 느려지는 독가스 구름 + 조준 매연
      popText(b.x, b.y + 56, '부릉부릉~ 매연 폭탄!', '#FFAB40', 13);
      play('whoosh');
      const n = b.rage ? 16 : 12;
      for (let i = 0; i < n; i++) {
        later(i * 0.05, () => fire(b.x + rand(-20, 20), b.y + 30, Math.PI / 2 + rand(-1.15, 1.15), rand(110, 190) * k, { src, kind: 'smoke', color: E_ORANGE, r: 8, drag: 0.35, minV: 45 }));
      }
      later(0.7, () => fire(b.x, b.y + 30, aim(b.x, b.y + 30), 180 * k, { src, kind: 'smoke', color: E_ORANGE, r: 9 }));
      return 2.2;
    }
    // 돌진: 예고선 → 고장 난 차를 몰고 화면 아래까지 급발진 → 위에서 다시 등장
    // 어려움 모드: 예고는 짧아지고(최소 0.55초) 급발진 속도는 어마어마하게
    b.dash = { st: 'warn', t: 0, x: clamp(s.p.x, 50, W - 50), warn: Math.max(0.55, (b.rage ? 0.95 : 1.15) / Math.sqrt(s.K.atk)), vy: 0, trailT: 0 };
    if (s.loop) popText(b.x, b.y + 74, `${s.loop}회차 터보 엔진!!`, '#FF1744', 13, 1.2);
    popText(b.x, b.y + 56, '급발진 돌진!!', '#FF5252', 15, 1.2);
    play('alarm');
    return 1.6;
  }
  function updateDash(b, dt) {
    const d = b.dash, src = b.name;
    d.t += dt;
    if (d.st === 'warn') {
      b.x += (d.x - b.x) * Math.min(1, dt * 6);
      b.y = b.ty - Math.min(18, d.t * 30) + Math.sin(d.t * 60) * 1.5; // 뒤로 살짝 빼며 부르르
      if (d.t > d.warn) { d.st = 'go'; d.t = 0; d.vy = s.loop ? 400 : 120; s.shake = Math.max(s.shake, 10); play('whoosh'); }
    } else if (d.st === 'go') {
      d.vy = Math.min(560 * (s.loop ? 1.8 + 0.3 * (s.loop - 1) : 1), d.vy + 1300 * (s.loop ? 2.5 : 1) * dt);
      b.y += d.vy * dt;
      b.x = d.x;
      d.trailT -= dt;
      if (d.trailT <= 0) {
        d.trailT = 0.14;
        // 지나간 자리에 매연을 좌우로 흘림
        if (b.y < H - 40) for (const sx of [-1, 1]) fire(b.x + sx * 30, b.y - 40, Math.PI / 2 + sx * 1.35, 55, { src, kind: 'smoke', color: E_ORANGE, r: 7, drag: 0.5, minV: 25 });
      }
      if (b.y > H + 90) { d.st = 'back'; d.t = 0; b.x = rand(80, W - 80); b.y = -110; }
    } else {
      b.y += (b.ty - b.y) * Math.min(1, dt * 2.2);
      if (Math.abs(b.y - b.ty) < 3) { b.dash = null; b.atkT = 0.9; }
    }
  }

  // 화면 대부분(약 80%)을 덮는 즉사 레이저 + 좁은 안전지대
  function laserCurtain(gapW, warn, src) {
    const reach = SPEED * warn * 0.75; // 예고 시간 안에 닿을 수 있는 틈만 생성
    const lo = clamp(s.p.x - reach, 8, W - gapW - 8);
    const hi = clamp(s.p.x + reach - gapW, 8, W - gapW - 8);
    const g = rand(Math.min(lo, hi), Math.max(lo, hi));
    s.lasers.push({ ranges: [[0, g], [g + gapW, W]], t: 0, warn, fire: 0.55, src, gap: [g, g + gapW] });
    play('alarm');
  }

  function damageBoss(b, dmg, x, y) {
    if (b.entering || b.dead) return false;
    if (b.key === 'king') {
      if (b.shield > 0) {
        // 제작자 실드: 공격을 튕겨냄
        if (Math.random() < 0.3) popText(x + rand(-10, 10), y, '튕겨냄!', '#18FFFF', 11, 0.5);
        burst(x, y, 3, ['#18FFFF', '#fff'], [60, 160], 0.3);
        return true;
      }
      if (b.mode === 'rage') return true; // 분노 연출 중 무적
    }
    b.hp -= dmg;
    b.flashT = 0.06;
    addScore(dmg);
    if (b.key === 'king') {
      if (b.mode === 'normal' && b.hp <= b.max * 0.15) {
        // 1차: 제작자 권한 발동 - 체력 회복 + 무적 실드
        b.mode = 'refill';
        b.modeT = 0;
        b.shield = 5;
        s.shake = 20;
        play('doom');
        banner('🛡️ 제작자 권한 발동!', '조철왕: "밸런스 패치 들어갑니다~"', 2.4);
        s.bullets.length = 0;
      } else if (b.hp <= 0) {
        // 체력 0: 쓰러뜨린 줄 알았지만… 분노 각성 → 어려움 모드 루프
        b.hp = 0;
        kingRage(b);
      }
      return true;
    }
    if (!b.rage && b.hp <= b.max * 0.5) {
      b.rage = true;
      s.shake = 14;
      banner(`💢 ${b.name} 분노!`, b.key === 'zero' ? '움직임이 빨라진다' : b.key === 'killer' ? '엔진 과열! 돌진이 빨라진다' : '공격이 거세진다', 1.6);
    }
    if (b.hp <= 0) bossDown(b);
    return true;
  }
  function bossDown(b) {
    b.dead = true;
    b.deathT = 0;
    s.bosses++;
    s.bullets.length = 0;
    s.lasers.length = 0;
    s.timers.length = 0;
    if (b.dash) { b.dash = null; b.y = clamp(b.y, 60, H * 0.45); } // 돌진 중 격파되면 화면 안에서 폭발
    addScore(b.reward);
    s.shake = 26;
    s.flash = 0.7;
    play('explosion');
    later(0.4, () => play('fanfare'));
    banner(`🎉 ${b.name} 격파!`, `+${b.reward}점`, 2.2);
    for (let i = 0; i < 6; i++) later(i * 0.15, () => burst(b.x + rand(-40, 40), b.y + rand(-40, 40), 40, ['#FFD166', '#ff7043', '#fff'], [80, 300], 0.9, [2, 6]));
    // 보스 보상: 무기 상자 2개 + 인삼
    later(0.6, () => {
      dropItem(b.x - 30, b.y, 'box');
      dropItem(b.x + 30, b.y, 'box');
      dropItem(b.x, b.y, 'ginseng');
      dropItem(b.x - 15, b.y + 10, 'talisman');
      dropItem(b.x + 15, b.y + 10, 'shield');
    });
  }
  function hitColumn(x, w, dmg) {
    for (const m of s.mobs) if (Math.abs(m.x - x) < w + m.r && m.y > 0) { m.hp -= dmg; m.flashT = 0.05; }
    const b = s.boss;
    if (b && Math.abs(b.x - x) < b.w / 2 + w) damageBoss(b, dmg, x, b.y + b.h / 2);
  }

  function updateBoss(b, dt) {
    b.t += dt;
    b.flashT = Math.max(0, b.flashT - dt);
    if (b.dead) {
      b.deathT += dt;
      b.y += dt * 30;
      if (b.deathT > 2.2) {
        s.boss = null;
        nextStage();
      }
      return;
    }
    if (b.entering) {
      b.y += (b.ty - b.y) * Math.min(1, dt * 1.6);
      if (Math.abs(b.y - b.ty) < 2) b.entering = false;
      return;
    }
    // 이동
    if (b.key === 'castle') {
      b.x = W / 2 + Math.sin(b.t * 0.6) * 110;
      b.y = b.ty + Math.sin(b.t * 1.3) * 8;
    } else if (b.key === 'zero') {
      b.moveT -= dt;
      if (b.moveT <= 0) { b.moveT = b.rage ? 0.8 : 1.2; b.tx = rand(60, W - 60); }
      b.x += (b.tx - b.x) * Math.min(1, dt * (b.rage ? 5 : 3.5));
      b.y = b.ty + Math.sin(b.t * 2) * 10;
    } else if (b.key === 'killer') {
      if (b.dash) updateDash(b, dt);
      else {
        b.x += (W / 2 + Math.sin(b.t * 0.7) * 105 - b.x) * Math.min(1, dt * 3);
        b.y = b.ty + Math.sin(b.t * 9) * 1.5; // 공회전 진동
      }
      // 배기구 매연 (장식)
      b.smokeT -= dt;
      if (b.smokeT <= 0 && b.y > -60) {
        b.smokeT = b.rage ? 0.06 : 0.1;
        for (const sx of [-14, 14]) burst(b.x + sx, b.y - b.h / 2 + 4, 1, ['#616161', '#9E9E9E', '#424242'], [20, 60], 0.7, [4, 7]);
      }
    } else {
      b.x = W / 2 + Math.sin(b.t * 0.45) * 90 + Math.sin(b.t * 1.7) * 18;
      b.y = b.ty + Math.sin(b.t * 1.1) * 10;
      addScore(dt * 10); // 조철왕 앞에서 버틴 시간 점수
      kingPhases(b, dt);
    }
    // 🔥 각성 공명 서브 패턴: 기존 공격과 별개로 사방에 무작위 탄막 (각성 단계·어려움 모드 밀도에 비례)
    if (s.heroLv > b.reso) b.reso = s.heroLv;
    if (b.reso && s.p.alive && b.mode !== 'rage' && !(b.dash && b.dash.st === 'go')) {
      b.resoT -= dt;
      if (b.resoT <= 0) {
        b.resoT = Math.max(0.32, 1.15 - 0.07 * b.reso) / Math.sqrt(s.K.atk);
        const n = 4 + Math.ceil(b.reso / 2);
        for (let i = 0; i < n; i++) fire(b.x + rand(-b.w / 3, b.w / 3), b.y + rand(0, b.h / 3), rand(0, Math.PI * 2), rand(95, 150), { src: b.name, kind: Math.random() < 0.5 ? 'orb' : 'rice', color: Math.random() < 0.5 ? E_HOT : E_ORANGE, r: 5 });
      }
    }
    b.atkT -= dt;
    if (b.atkT <= 0 && s.p.alive && b.mode !== 'rage' && !b.dash) b.atkT = bossAttack(b) * (b.key === 'zero' && b.rage ? 0.8 : 1) * STAGES[s.stage].bossK / s.K.atk;
    // 보스 몸통 충돌
    if (Math.abs(b.x - s.p.x) < b.w / 2 && Math.abs(b.y - s.p.y) < b.h / 2 + 10) hurtOrBlock(b.name);
  }

  // 조철왕: 이길 듯 말 듯 → 실드 회복 → HP 1 고정 → 최종 오의(전체 레이저)로 반드시 패배
  function kingPhases(b, dt) {
    b.modeT += dt;
    if (b.shield > 0) b.shield -= dt;
    if (b.mode === 'refill') {
      b.hp = Math.min(b.max * 0.55, b.hp + b.max * 0.25 * dt);
      if (b.modeT > 2.4 && b.shield <= 0) { b.mode = 'second'; b.modeT = 0; }
    }
  }

  // 조철왕 체력 0 → 게임 일시정지 + 분노 연출 (붉은 대사 · 강한 화면 흔들림 · 붉은 점멸 · 사이렌)
  function kingRage(b) {
    b.mode = 'rage';
    s.bosses++;
    addScore(5000);
    b.shield = 0;
    b.dash = null;
    s.bullets.length = 0;
    s.lasers.length = 0;
    s.timers.length = 0;
    s.banner = null;
    s.texts.length = 0;
    s.cine = { t: 0, dur: RAGE_SEC, line: RAGE_LINES[s.loop % RAGE_LINES.length], sirenT: 0 };
    s.p.inv = Math.max(s.p.inv, RAGE_SEC + 3);
    play('doom');
  }
  function updateCine(dt) {
    const c = s.cine;
    c.t += dt;
    s.shake = 22 + Math.sin(c.t * 37) * 6;
    c.sirenT -= dt;
    if (c.sirenT <= 0) { c.sirenT = 0.7; play('alarm'); }
    if (s.boss) { s.boss.flashT = Math.sin(c.t * 30) > 0 ? 0.05 : 0; s.boss.t += dt; }
    if (Math.random() < 0.5) burst(rand(0, W), rand(0, H), 3, ['#FF1744', '#FF6D00', '#fff'], [40, 160], 0.5);
    for (const pt of s.parts) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
    s.parts = s.parts.filter((pt) => pt.life > 0);
    if (c.t >= c.dur) startLoop();
  }
  // 1탄부터 다시: 무기·점수는 유지, 적은 회차만큼 강해짐
  function startLoop() {
    s.cine = null;
    s.loop++;
    s.K = makeK(s.loop, s.heroLv);
    s.stage = 0;
    s.phase = 'wave';
    s.phaseT = 0;
    s.spawnT = 2.5;
    s.heavyT = 5;
    s.boss = null;
    s.mobs.length = 0;
    s.bullets.length = 0;
    s.lasers.length = 0;
    s.timers.length = 0;
    s.items.length = 0;
    s.waves.length = 0;
    s.clicks.length = 0;
    s.nukes.length = 0;
    s.shake = 10;
    s.flash = 0.6;
    s.p.hp = MAX_HP;
    s.p.inv = 3;
    setBombs(s.bombs + 1);
    play('fanfare');
    banner(`🔥 어려움 모드 ${s.loop}회차 루프`, `조철왕: "처음부터 다시 해봐라!" · ${STAGES[0].name}`, 3);
  }

  function nextStage() {
    s.stage++;
    s.phase = 'wave';
    s.phaseT = 0;
    s.spawnT = 2;
    s.heavyT = 4;
    banner(STAGES[s.stage].name, s.stage === STAGES.length - 1 ? (s.loop ? `🔥 분노한 조철왕 (${s.loop}회차)` : '최종 보스가 기다린다…') : s.loop ? `🔥 어려움 모드 ${s.loop}회차` : '무기를 키워라!', 2.2);
  }

  // ---------- 메인 업데이트 ----------
  function update(dt, input = {}) {
    if (s.cine) { s.time += dt; updateCine(dt); return; } // 분노 연출 중엔 게임 정지
    if (s.awake) { s.time += dt; updateAwake(dt); return; } // 초각성 순간 시간 정지
    s.time += dt;
    s.scroll += dt * [60, 90, 140, 120][s.stage];
    const p = s.p;

    // 타이머
    for (let i = s.timers.length - 1; i >= 0; i--) {
      const tm = s.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) { s.timers.splice(i, 1); tm.fn(); }
    }

    // 개발자 도움(자동 플레이)이 켜져 있으면 AI가 입력을 대신함
    if (s.auto && p.alive) {
      input = autoPilot(dt);
      s.autoLeft -= dt;
      if (s.autoLeft <= 0) setAuto(false);
    }

    // 플레이어 이동 (상하좌우)
    if (p.alive) {
      const ox = p.x;
      if (input.dx || input.dy) {
        const k = input.dx && input.dy ? Math.SQRT1_2 : 1;
        p.x += (input.dx || 0) * SPEED * k * dt;
        p.y += (input.dy || 0) * SPEED * k * dt;
      } else if (input.tx != null) {
        const dx = input.tx - p.x, dy = (input.ty ?? p.y) - p.y, d = Math.hypot(dx, dy);
        const step = Math.min(d, SPEED * 1.6 * dt);
        if (d > 0.5) { p.x += (dx / d) * step; p.y += (dy / d) * step; }
      }
      p.x = clamp(p.x, 16, W - 16);
      p.y = clamp(p.y, MIN_Y, MAX_Y);
      p.tilt += ((p.x - ox) / Math.max(dt, 0.001) / SPEED * 0.25 - p.tilt) * Math.min(1, dt * 10);
      p.inv = Math.max(0, p.inv - dt);
      playerFire(dt);
    } else {
      p.deadT += dt;
      if (p.deadT > 1.8 && !s.ended) {
        s.ended = true;
        env.over && env.over({ score: Math.floor(s.score), killer: s.killer, stage: s.stage, time: s.time, grazes: s.grazes, bosses: s.bosses, power: p.power, autoUsed: s.autoUsed, loop: s.loop, heroLv: s.heroLv });
      }
    }
    s.fever = Math.max(0, s.fever - dt);
    s.bombCd = Math.max(0, s.bombCd - dt);
    if (s.heroLv > 0) {
      s.heroCd = Math.max(0, s.heroCd - dt);
      if (!s.heroReady && s.heroCd <= 0) { heroChanged(); popText(p.x, p.y - 56, `${HEROES[s.heroLv - 1].icon} 필살기 준비 완료!`, '#FFD166', 12, 0.9); }
    }
    for (const k in s.buffs) s.buffs[k] = Math.max(0, s.buffs[k] - dt);
    if (s.nova) { s.nova.t += dt; if (s.nova.t > 0.8) s.nova = null; }
    if (s.buffs.drone > 0 && p.alive) updateDrones(dt);
    s.comboT -= dt;
    if (s.comboT <= 0) s.combo = 0;

    // 스테이지 진행
    s.phaseT += dt;
    const st = STAGES[s.stage];
    if (s.phase === 'wave') {
      s.spawnT -= dt;
      if (s.spawnT <= 0) { spawnFormation(); s.spawnT = Math.max(0.22, rand(1.5, 2.3) * st.spawnK / Math.sqrt(s.K.atk) * s.K.spawn); }
      s.heavyT -= dt;
      if (s.heavyT <= 0) { spawnMob(rand(50, W - 50), -30, 'heavy'); s.heavyT = Math.max(1.2, st.heavyT / Math.sqrt(s.K.atk) * s.K.spawn); }
      if (s.phaseT > st.wave) { s.phase = 'warn'; s.phaseT = 0; banner('⚠️ WARNING', `${BOSSES[st.boss].name} 접근 중`, 2); play('alarm'); }
    } else if (s.phase === 'warn') {
      if (s.phaseT > 2.4) { s.phase = 'boss'; s.phaseT = 0; spawnBoss(st.boss); }
    }

    // 플레이어 탄
    steerShots(dt);
    for (const sh of s.shots) { sh.x += sh.vx * dt; sh.y += sh.vy * dt; }
    s.shots = s.shots.filter((sh) => !sh.dead && sh.y > (sh.homing ? -60 : -20) && sh.x > -20 && sh.x < W + 20 && sh.y < H + 20);
    s.beams = s.beams.filter((bm) => (bm.life -= dt) > 0);
    s.bolts = s.bolts.filter((bo) => (bo.life -= dt) > 0);
    updateWaves(dt);
    updateClicks(dt);
    s.nukes = s.nukes.filter((nk) => (nk.t += dt) < 1.4);
    s.vineFx = s.vineFx.filter((v) => (v.life -= dt) > 0);
    updateUltFx(dt);

    // 잡몹
    for (const m of s.mobs) {
      m.t += dt;
      m.flashT = Math.max(0, m.flashT - dt);
      if (m.rootT > 0) {
        // 🌿 가시덩굴에 묶임: 이동 정지 + 지속 피해
        m.rootT -= dt;
        m.hp -= m.rootDps * dt;
        m.fireT = Math.max(m.fireT, 0.3);
      } else if (m.hover && m.y >= m.hover) {
        m.x += Math.sin(m.t * 1.5) * 60 * dt;
        if (m.t > 7) m.hover = 0; // 머물다 퇴장
      } else {
        m.y += m.vy * dt;
      }
      m.x += m.vx * dt;
      if (m.zig) m.x = m.x0 + Math.sin(m.t * 2.4) * m.zig;
      m.fireT -= dt;
      if (m.fireT <= 0 && m.y > 20 && m.y < p.y - 100 && p.alive) {
        m.fireT = m.kind === 'heavy' ? 99 : m.elite ? rand(1.5, 2.2) / Math.sqrt(s.K.atk) : rand(1.8, 3.2) * STAGES[m.stage].fireK / s.K.atk;
        if (m.elite) mobShoot(m);
        else if (m.kind !== 'heavy' && Math.random() < (s.loop ? 0.95 : m.stage === 0 ? 0.5 : m.stage < 3 ? 0.7 : 0.8)) mobShoot(m);
      }
      if (p.alive && m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) < m.r + HIT_R + 4) {
        // 무적 별·방어막으로 부딪히면 적만 격파
        if (hurtOrBlock(m.name)) m.hp = 0;
        else { m.hp = 0; m.crashed = true; }
      }
    }

    // 탄 충돌: 플레이어 탄 → 적
    for (const sh of s.shots) {
      for (const m of s.mobs) {
        if (m.hp <= 0 || Math.hypot(m.x - sh.x, m.y - sh.y) > m.r + sh.r) continue;
        if (sh.ult) { detonate(sh); break; } // 핵: 닿는 순간 기폭
        if (sh.pierce) {
          // 화염·풀잎: 관통하며 적마다 한 번씩만 피해 (풀잎은 maxHits마리까지)
          if (sh.hits.has(m)) continue;
          sh.hits.add(m);
          m.hp -= sh.dmg;
          m.flashT = 0.05;
          if (sh.maxHits && sh.hits.size >= sh.maxHits) { sh.dead = true; break; }
          continue;
        }
        m.hp -= sh.dmg;
        m.flashT = 0.05;
        sh.dead = true;
        if (sh.splash) splash(sh);
        break;
      }
      const b = s.boss;
      if (!sh.dead && b && Math.abs(sh.x - b.x) < b.w / 2 && Math.abs(sh.y - b.y) < b.h / 2) {
        if (sh.ult) {
          if (!b.entering && !b.dead) detonate(sh);
        } else if (sh.pierce) {
          if (!sh.hits.has(b)) { sh.hits.add(b); damageBoss(b, sh.dmg, sh.x, sh.y); if (sh.maxHits && sh.hits.size >= sh.maxHits) sh.dead = true; }
        } else if (damageBoss(b, sh.dmg, sh.x, sh.y)) {
          sh.dead = true;
          if (sh.splash) burst(sh.x, sh.y, 8, ['#FFD166', '#ff7043'], [40, 140], 0.35);
        }
      }
    }
    s.shots = s.shots.filter((sh) => !sh.dead);
    for (const m of s.mobs) if (m.hp <= 0 && !m.gone) { m.gone = true; if (!m.crashed) killMob(m); }
    s.mobs = s.mobs.filter((m) => !m.gone && m.y < H + 40 && m.x > -60 && m.x < W + 60);

    // 보스
    if (s.boss) updateBoss(s.boss, dt);

    // 적 탄: 이동 · 피격 · 아슬아슬 회피
    for (const bl of s.bullets) {
      bl.t += dt;
      if (bl.homing > 0 && bl.t < bl.homing) {
        const want = Math.atan2(p.y - bl.y, p.x - bl.x);
        const cur = Math.atan2(bl.vy, bl.vx);
        let d = want - cur;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const a = cur + clamp(d, -2.2 * dt, 2.2 * dt);
        const sp = Math.hypot(bl.vx, bl.vy) + 40 * dt;
        bl.vx = Math.cos(a) * sp;
        bl.vy = Math.sin(a) * sp;
      }
      const bdt = s.buffs.slow > 0 ? dt * 0.45 : dt;
      if (bl.drag && Math.hypot(bl.vx, bl.vy) > bl.minV) { const f = Math.pow(bl.drag, bdt); bl.vx *= f; bl.vy *= f; }
      bl.x += bl.vx * bdt;
      bl.y += bl.vy * bdt;
      bl.spin += bdt * 8;
      // 타이어: 좌우 벽에 튕김
      if (bl.bounce > 0 && ((bl.x < bl.r && bl.vx < 0) || (bl.x > W - bl.r && bl.vx > 0))) { bl.vx = -bl.vx; bl.bounce--; }
      if (!p.alive) continue;
      const d = Math.hypot(bl.x - p.x, bl.y - p.y);
      if (s.buffs.shield > 0 && d < 30 + bl.r) { bl.dead = true; shieldHit(bl.x, bl.y); continue; }
      if (s.buffs.drone > 0 && droneBlock(bl)) { bl.dead = true; continue; }
      if (s.buffs.star > 0 && d < HIT_R + bl.r) { bl.dead = true; continue; }
      if (d < HIT_R + bl.r * 0.8) {
        bl.dead = true;
        if (p.inv <= 0) hurt(bl.src);
      } else if (!bl.grazed && d < HIT_R + bl.r + GRAZE_R && p.inv <= 0) {
        graze(bl);
      }
    }
    s.bullets = s.bullets.filter((bl) => !bl.dead && bl.y < H + 20 && bl.y > -40 && bl.x > -30 && bl.x < W + 30);

    // 레이저
    for (const lz of s.lasers) {
      lz.t += dt;
      const active = lz.t >= lz.warn && lz.t < lz.warn + lz.fire;
      if (active && !lz.fired) { lz.fired = true; s.shake = Math.max(s.shake, lz.final ? 30 : 12); play('explosion'); }
      if (active && p.alive && !s.auto && lz.ranges.some(([a, b]) => p.x > a + 3 && p.x < b - 3)) {
        popText(p.x, p.y - 40, '즉사!', '#ff1744', 20, 1.2);
        die(lz.src);
      }
      // 틈새로 피했으면 보너스
      if (!active && lz.fired && !lz.scored && p.alive) { lz.scored = true; addScore(100); popText(p.x, p.y - 44, '안전지대 생존! +100', '#18FFFF', 13); }
    }
    s.lasers = s.lasers.filter((lz) => lz.t < lz.warn + lz.fire + 0.05);

    // 아이템
    for (const it of s.items) {
      it.t += dt;
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy) || 1;
      if (p.alive && (d < 70 || s.buffs.magnet > 0) && it.t > 0.4) { it.vx += (dx / d) * 900 * dt; it.vy += (dy / d) * 900 * dt; } // 자석
      else { it.vy = Math.min(it.vy + 220 * dt, 130); it.vx *= Math.pow(0.3, dt); }
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      if (p.alive && d < 22) {
        it.dead = true;
        if (it.kind === 'coin') { gainXp(1); addScore(5); play('tick'); }
        else if (it.kind === 'box') { powerUp(); addScore(50); }
        else if (it.kind === 'ginseng') { p.hp = Math.min(MAX_HP, p.hp + 1); addScore(50); popText(p.x, p.y - 50, '인삼! 체력 +1', '#69F0AE', 15); play('ding'); }
        else collectPowerup(it.kind);
      }
    }
    s.items = s.items.filter((it) => !it.dead && it.y < H + 20);

    // 연출
    for (const pt of s.parts) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= Math.pow(0.2, dt); pt.vy *= Math.pow(0.2, dt); pt.life -= dt; }
    s.parts = s.parts.filter((pt) => pt.life > 0);
    for (const tx of s.texts) { tx.y -= 28 * dt; tx.life -= dt; }
    s.texts = s.texts.filter((tx) => tx.life > 0);
    if (s.banner && (s.banner.t += dt) > s.banner.dur) s.banner = null;
    s.shake *= Math.pow(0.02, dt);
    s.flash = Math.max(0, s.flash - dt * 1.5);
    checkAwaken();
  }

  // ---------- 개발자 도움: 자동 플레이 AI (프로게이머 모드) ----------
  // 매 프레임 '앞으로 0.8초'를 1/60초 단위로 미리 시뮬레이션해서 판단한다.
  //  1) 적 탄(유도탄·감속탄·튕기는 타이어 포함)·잡몹 몸통·보스 몸통/돌진·레이저 장막의 미래 위치를 계산
  //  2) 약 60개의 이동 후보(제자리 + 16방향 × 4거리 + 공격/아이템 지점)마다 실제 이동 속도로 경로를 따라가며
  //     충돌 여부와 '가장 가까운 탄과의 여유 거리'를 측정
  //  3) 안전한 후보 중 여유가 넉넉하고, 보스·적 바로 아래에서 조준하며, 아이템을 먹는 곳을 고름
  //  4) 피할 길이 없으면 즉시 필살기. 그래도 맞는 탄은 '퍼펙트 회피'로 흘려 보냄 (도움 10초 동안 피해 0)
  // 개발자 도움 요청: 10초 자동 플레이 후 수동 복귀 (판당 HELP_USES회)
  const helpChanged = () => env.help && env.help({ auto: s.auto, left: s.helps });
  const AI_DT = 1 / 60, AI_STEPS = 48;   // 0.8초 앞까지 예측
  const AI_MOVE = SPEED * 1.6;           // 목표 지점 이동 속도 (터치/마우스 이동과 동일)
  const HANDOFF_INV = 1.2;               // 도움 종료 직후 수동 조작으로 넘겨받는 동안의 무적
  function setAuto(on) {
    if (on) {
      if (s.auto || s.helps <= 0 || !s.p.alive) return false;
      s.helps--;
      s.auto = true;
      s.autoLeft = HELP_SEC;
      s.autoUsed = true;
      s.autoTarget = null;
      s.autoDodgeT = 0;
      banner('🤖 개발자 도움 ON', s.boss && s.boss.key === 'king' ? '조철왕: "...나한테 도와달라고?"' : `${HELP_SEC}초 동안 프로게이머 AI가 피하고 싸웁니다`, 1.4);
    } else {
      if (!s.auto) return false;
      s.auto = false;
      // 넘겨받자마자 탄에 맞지 않도록 잠깐 무적 + 바로 앞 탄 정리
      if (s.p.alive) {
        s.p.inv = Math.max(s.p.inv, HANDOFF_INV);
        s.bullets = s.bullets.filter((b) => Math.hypot(b.x - s.p.x, b.y - s.p.y) > 60);
      }
      banner('🎮 다시 직접 조작!', '', 1);
    }
    helpChanged();
    return true;
  }

  // 도움 중 피격 판정이 나면 AI가 마지막 순간에 흘려 보냄 (피해 없음)
  function autoDodge(x, y) {
    s.autoSaves = (s.autoSaves || 0) + 1; // 헤드리스 테스트용 집계
    s.bullets = s.bullets.filter((b) => Math.hypot(b.x - x, b.y - y) > 40);
    if (s.autoDodgeT <= 0) {
      popText(x, y - 40, '🤖 퍼펙트 회피!', '#18FFFF', 13, 0.8);
      burst(x, y, 10, ['#18FFFF', '#fff'], [60, 160], 0.3);
      s.autoDodgeT = 0.5;
    }
  }

  // 탄의 미래 경로를 엔진과 같은 규칙으로 시뮬레이션 (유도탄은 플레이어 경로를 따라 추적)
  function stepBullet(b, dt, px, py) {
    if (b.homing > 0 && b.t < b.homing) {
      const want = Math.atan2(py - b.y, px - b.x), cur = Math.atan2(b.vy, b.vx);
      let d = want - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const a = cur + clamp(d, -2.2 * dt, 2.2 * dt), sp = Math.hypot(b.vx, b.vy) + 40 * dt;
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp;
    }
    const bdt = s.buffs.slow > 0 ? dt * 0.45 : dt;
    if (b.drag && Math.hypot(b.vx, b.vy) > b.minV) { const f = Math.pow(b.drag, bdt); b.vx *= f; b.vy *= f; }
    b.x += b.vx * bdt;
    b.y += b.vy * bdt;
    b.t += dt;
    if (b.bounce > 0 && ((b.x < b.r && b.vx < 0) || (b.x > W - b.r && b.vx > 0))) { b.vx = -b.vx; b.bounce--; }
  }

  function autoPilot(dt) {
    const p = s.p;
    s.autoDodgeT = Math.max(0, (s.autoDodgeT || 0) - dt);
    if (s.boss && s.boss.key === 'king' && !s.autoKingLine) {
      s.autoKingLine = true;
      popText(W / 2, H * 0.5, '조철왕: "내가 만든 AI로 날 이기겠다고?"', '#E040FB', 13, 2.2);
    }
    // 무적(별·피격 직후·필살기 직후) 중엔 탄 걱정 없이 공격 위치로
    const safeNow = s.buffs.star > 0;
    const reach = AI_STEPS * AI_DT;

    // --- 위험 요소 미래 위치 미리 계산 ---
    const straight = [], homing = [];
    for (const b of s.bullets) {
      const sp = Math.hypot(b.vx, b.vy);
      if (Math.hypot(b.x - p.x, b.y - p.y) > (sp + AI_MOVE) * reach + 40) continue; // 닿을 수 없는 탄은 제외
      const sim = { x: b.x, y: b.y, vx: b.vx, vy: b.vy, t: b.t, r: b.r, homing: b.homing, drag: b.drag, minV: b.minV, bounce: b.bounce };
      if (b.homing > 0 && b.t < b.homing) { homing.push(sim); continue; }
      const xs = new Float32Array(AI_STEPS), ys = new Float32Array(AI_STEPS);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let k = 0; k < AI_STEPS; k++) {
        stepBullet(sim, AI_DT, p.x, p.y);
        xs[k] = sim.x; ys[k] = sim.y;
        if (sim.x < x0) x0 = sim.x; if (sim.x > x1) x1 = sim.x; if (sim.y < y0) y0 = sim.y; if (sim.y > y1) y1 = sim.y;
      }
      const rr = HIT_R + b.r * 0.8;
      straight.push({ xs, ys, rr, x0: x0 - rr - 26, x1: x1 + rr + 26, y0: y0 - rr - 26, y1: y1 + rr + 26 }); // 경로 범위(빠른 제외용)
    }
    const mobs = s.mobs.filter((m) => m.hp > 0).map((m) => {
      const xs = new Float32Array(AI_STEPS), ys = new Float32Array(AI_STEPS);
      let x = m.x, y = m.y, t = m.t;
      for (let k = 0; k < AI_STEPS; k++) {
        t += AI_DT;
        if (m.rootT > 0) { /* 묶여서 정지 */ } else if (m.hover && y >= m.hover) x += Math.sin(t * 1.5) * 60 * AI_DT;
        else y += m.vy * AI_DT;
        x += m.vx * AI_DT;
        if (m.zig) x = m.x0 + Math.sin(t * 2.4) * m.zig;
        xs[k] = x; ys[k] = y;
      }
      return { xs, ys, rr: m.r + HIT_R + 10 };
    });
    const boss = s.boss && !s.boss.dead && !s.boss.entering ? s.boss : null;
    const lasers = s.lasers.filter((lz) => lz.t < lz.warn + lz.fire).map((lz) => ({
      from: lz.warn - lz.t - 0.08, to: lz.warn + lz.fire - lz.t + 0.05, ranges: lz.ranges,
    }));

    // 후보 경로 평가: 반환 { hit: 첫 충돌 시점(없으면 Infinity), clear: 최소 여유 거리, soft: 근접 위험 누적 }
    const evalPath = (tx, ty) => {
      let x = p.x, y = p.y, hit = Infinity, clear = 999, soft = 0;
      const hs = homing.map((h) => ({ ...h }));
      // 이 경로가 지나는 범위와 겹치는 탄만 검사 (탄이 많은 어려움 모드에서도 가볍게)
      const px0 = Math.min(p.x, tx), px1 = Math.max(p.x, tx), py0 = Math.min(p.y, ty), py1 = Math.max(p.y, ty);
      const near = straight.filter((b) => b.x1 >= px0 && b.x0 <= px1 && b.y1 >= py0 && b.y0 <= py1);
      for (let k = 0; k < AI_STEPS; k++) {
        const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy), step = Math.min(d, AI_MOVE * AI_DT);
        if (d > 0.5) { x += (dx / d) * step; y += (dy / d) * step; }
        const w = 1 / (1 + k * 0.06); // 가까운 미래일수록 중요
        let minD = 999;
        for (const b of near) {
          const g = Math.hypot(b.xs[k] - x, b.ys[k] - y) - b.rr;
          if (g < minD) minD = g;
        }
        for (const h of hs) {
          stepBullet(h, AI_DT, x, y);
          const g = Math.hypot(h.x - x, h.y - y) - (HIT_R + h.r * 0.8);
          if (g < minD) minD = g;
        }
        for (const m of mobs) {
          const g = Math.hypot(m.xs[k] - x, m.ys[k] - y) - m.rr;
          if (g < minD) minD = g;
        }
        if (boss) {
          const gx = Math.abs(boss.x - x) - boss.w / 2, gy = Math.abs(boss.y - y) - (boss.h / 2 + 10);
          const g = Math.max(gx, gy) - 14;
          if (g < minD) minD = g;
          if (boss.dash && boss.dash.st !== 'back') {
            const gd = Math.abs(boss.dash.x - x) - (boss.w / 2 + 24);
            if (gd < minD) minD = gd;
          }
        }
        const tk = k * AI_DT;
        for (const lz of lasers) {
          if (tk < lz.from || tk > lz.to) continue;
          for (const [a, c] of lz.ranges) {
            const g = Math.max(a - x, x - c) + 3 - 10; // 레이저 안쪽이면 음수
            if (g < minD) minD = g;
          }
        }
        if (minD < 2 && hit === Infinity) hit = tk;
        if (minD < clear) clear = minD;
        if (minD < 26) soft += (26 - minD) * w;
      }
      return { hit, clear, soft, x, y };
    };

    // --- 공격 목표: 보스 우선, 없으면 가장 위협적인(가까운) 적 ---
    let aimX = null;
    if (boss) aimX = boss.dash ? null : boss.x;
    else {
      let bestM = null;
      for (const m of s.mobs) if (m.hp > 0 && m.y > -10 && m.y < p.y - 60 && (!bestM || m.y > bestM.y)) bestM = m;
      if (bestM) aimX = bestM.x;
    }
    const homeY = clamp(H - 130, MIN_Y + 40, MAX_Y);

    // --- 후보 생성 ---
    const cands = [[p.x, p.y]];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      for (const r of [24, 60, 120, 200]) cands.push([p.x + Math.cos(a) * r, p.y + Math.sin(a) * r]);
    }
    if (aimX != null) for (const y of [p.y, homeY, homeY - 80]) cands.push([aimX, y]);
    for (const it of s.items) if (it.y > MIN_Y - 40) cands.push([it.x, Math.max(it.y + 30, MIN_Y)]);
    if (lasers.length) for (const lz of s.lasers) if (lz.gap) cands.push([(lz.gap[0] + lz.gap[1]) / 2, p.y]);

    let best = null, bestV = Infinity, bestHit = 0;
    for (const [cx, cy] of cands) {
      const tx = clamp(cx, 16, W - 16), ty = clamp(cy, MIN_Y, MAX_Y);
      const r = evalPath(tx, ty);
      // 1순위: 충돌하지 않는 것 (피할 수 없으면 최대한 늦게 맞는 쪽)
      let v = r.hit === Infinity ? 0 : 100000 - r.hit * 50000;
      if (safeNow) v = 0;
      // 2순위: 탄과의 여유 거리
      v += r.soft * 2.5 - Math.min(r.clear, 30) * 3;
      // 3순위: 공격 자리 (적·보스 바로 아래) + 화면 아래쪽 대기
      if (aimX != null) v += Math.min(Math.abs(r.x - aimX), 200) * 1.6;
      v += Math.abs(r.y - homeY) * 0.12;
      // 아이템 줍기
      for (const it of s.items) {
        const d = Math.hypot(it.x - r.x, it.y - r.y);
        if (d < 60) v -= (it.kind === 'coin' ? 6 : 40) * (1 - d / 60);
      }
      // 화면 구석은 몰리기 쉬우므로 약간 감점, 진동 방지를 위해 직전 목표 근처 우대
      v += Math.max(0, 40 - Math.min(r.x, W - r.x)) * 0.6;
      if (s.autoTarget) v += Math.min(Math.hypot(tx - s.autoTarget.tx, ty - s.autoTarget.ty), 80) * 0.05;
      if (v < bestV) { bestV = v; best = { tx, ty }; bestHit = r.hit; }
    }

    // 어떤 경로로도 0.3초 안에 맞는다면 즉시 필살기로 탄 삭제
    if (!safeNow && bestHit < 0.3 && p.inv <= 0) special();
    // 영웅 필살기는 쿨타임이 돌아오면 보스·적 무리·탄막에 바로 사용
    else if (s.heroLv > 0 && s.heroCd <= 0 && (boss || s.mobs.length > 6 || s.bullets.length > 30 || s.mobs.some((m) => m.elite))) special();

    s.autoTarget = best;
    return s.autoTarget;
  }

  // 숨겨진 '개발자의 가호': 무기 최종 단계 + 체력 완전 회복 + 방어막 + 필살기 +1 (판당 1회, 랭킹엔 🤖 표시)
  function blessing() {
    const p = s.p;
    if (!p.alive || s.ended) return false;
    if (s.blessed) { popText(p.x, p.y - 60, '가호는 한 판에 한 번뿐!', '#B9F6CA', 13, 1.2); return false; }
    s.blessed = true;
    s.autoUsed = true;
    const king = s.boss && s.boss.key === 'king';
    p.power = MAX_POWER;
    p.xp = 0;
    p.hp = MAX_HP;
    p.inv = Math.max(p.inv, 2);
    s.buffs.shield = POWERUPS.shield.sec;
    s.shieldHits = SHIELD_HITS;
    setBombs(s.bombs + 1);
    s.flash = 0.7;
    s.shake = Math.max(s.shake, 12);
    play('fanfare');
    burst(p.x, p.y, 90, ['#FFD166', '#fff', '#69F0AE', '#9BE7FF'], [80, 320], 1.1, [2, 5]);
    banner('✨ 개발자의 가호가 깃듭니다!', king ? '조철왕: "그 가호… 내가 준 건데?"' : '무기 최종 진화 · 체력 완전 회복 · 방어막', 2.4);
    return true;
  }

  function collectPowerup(kind) {
    const pu = POWERUPS[kind], p = s.p;
    addScore(30);
    play('ding');
    popText(p.x, p.y - 52, `${pu.icon} ${pu.name}`, pu.color, 15, 1.1);
    burst(p.x, p.y, 20, [pu.color, '#fff'], [60, 200], 0.5);
    if (kind === 'talisman') setBombs(s.bombs + 1);
    else if (kind === 'gold') addScore(500);
    else {
      s.buffs[kind] = pu.sec;
      if (kind === 'shield') s.shieldHits = SHIELD_HITS;
    }
  }

  // 호위 드론: 플레이어 주위를 돌며 사격 + 탄 막기
  const dronePos = (k) => {
    const a = s.droneA + k * Math.PI;
    return { x: s.p.x + Math.cos(a) * 36, y: s.p.y - 10 + Math.sin(a) * 22 };
  };
  function updateDrones(dt) {
    s.droneA += dt * 3.2;
    s.droneT -= dt;
    if (s.droneT <= 0) {
      s.droneT = 0.22;
      const dmg = WEAPONS[Math.min(3, tierOf(s.p.power))].dmg * 0.8 * (tierOf(s.p.power) >= 6 ? 1.5 : 1);
      for (const k of [0, 1]) {
        const d = dronePos(k);
        s.shots.push({ x: d.x, y: d.y - 8, vx: 0, vy: -680, dmg, r: 3, kind: 'drone', splash: 0 });
      }
    }
  }
  function droneBlock(bl) {
    for (const k of [0, 1]) {
      const d = dronePos(k);
      if (Math.hypot(bl.x - d.x, bl.y - d.y) < 10 + bl.r) { burst(bl.x, bl.y, 5, ['#B388FF', '#fff'], [40, 120], 0.25); return true; }
    }
    return false;
  }

  // Space: 초각성 중이고 쿨타임이 끝났으면 영웅 필살기, 아니면 기존 필살기(천지개벽)
  function special() {
    if (s.heroLv > 0 && s.heroCd <= 0 && s.p.alive && !s.ended && !s.awake && !s.cine) return heroUlt();
    return bomb();
  }
  // 필살기: 화면의 모든 적 탄·예고 레이저 소거 + 전체 공격 + 잠깐 무적
  function bomb() {
    const p = s.p;
    if (!p.alive || s.bombs <= 0 || s.bombCd > 0 || s.ended || s.awake) return false;
    setBombs(s.bombs - 1);
    s.bombCd = 1;
    p.inv = Math.max(p.inv, 2);
    s.nova = { x: p.x, y: p.y, t: 0 };
    s.shake = Math.max(s.shake, 20);
    s.flash = 0.5;
    play('explosion');
    later(0.15, () => play('fanfare'));
    const n = s.bullets.length;
    for (const bl of s.bullets) burst(bl.x, bl.y, 2, ['#FFD166', '#fff'], [30, 90], 0.4);
    s.bullets.length = 0;
    addScore(n * 5);
    const finalOn = s.lasers.some((lz) => lz.final);
    s.lasers = s.lasers.filter((lz) => lz.final);
    if (finalOn) popText(p.x, p.y - 70, '필살기 무효!? 서비스 종료는 못 막는다', '#FF1744', 13, 1.6);
    for (const m of s.mobs) if (m.y > -10) { m.hp -= 30; m.flashT = 0.1; }
    const b = s.boss;
    if (b && !b.entering && !b.dead) damageBoss(b, b.key === 'king' ? 120 : b.max * 0.06, b.x, b.y);
    banner('💥 필살기 · 천지개벽!', n ? `적 탄 ${n}발 소거 +${n * 5}점` : '', 1.2);
    return true;
  }

  function splash(sh) {
    for (const m of s.mobs) if (m.hp > 0 && Math.hypot(m.x - sh.x, m.y - sh.y) < sh.splash + m.r) { m.hp -= sh.dmg * 0.5; m.flashT = 0.05; }
    burst(sh.x, sh.y, 10, ['#FFD166', '#ff7043', '#555'], [40, 160], 0.4);
  }

  // 아슬아슬 회피: 경험치 + 공격 속도 일시 증폭
  function graze(bl) {
    bl.grazed = true;
    s.grazes++;
    s.combo++;
    s.comboT = 2;
    s.fever = Math.min(4, s.fever + 1.1);
    gainXp(0.6);
    const pts = 20 + Math.min(10, s.combo) * 5;
    addScore(pts);
    popText(s.p.x + rand(-20, 20), s.p.y - 34, s.combo > 1 ? `아슬아슬! ×${s.combo}` : '아슬아슬!', '#FFE082', 12, 0.7);
    burst(bl.x, bl.y, 6, ['#FFE082', '#fff'], [40, 120], 0.3, [1, 2.5]);
  }

  // ---------- 그리기 ----------
  function draw(ctx, t) {
    ctx.save();
    if (s.shake > 0.5) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    drawBackground(ctx, s.stage, s.scroll, t);
    for (const it of s.items) drawItem(ctx, it, t);
    for (const m of s.mobs) drawMob(ctx, m, t);
    if (s.boss && s.boss.dash && s.boss.dash.st === 'warn') drawDashWarn(ctx, s.boss, t);
    if (s.boss) drawBoss(ctx, s.boss, t);
    for (const lz of s.lasers) drawLaser(ctx, lz, t, s.p.y);
    for (const m of s.mobs) if (m.rootT > 0) (m.frozen ? drawFrozen : drawVine)(ctx, m.x, m.y + m.r * 0.4, m.r * 2.2, Math.min(1, m.rootT * 2), t);
    for (const v of s.vineFx) drawVine(ctx, v.x, v.y, v.w, v.life / v.max, t);
    for (const bm of s.beams) drawBeam(ctx, bm, s.p.power >= 13, s.p.y);
    for (const sh of s.shots) drawShot(ctx, sh, t);
    for (const bo of s.bolts) drawBolt(ctx, bo);
    for (const wv of s.waves) drawWave(ctx, wv, t);
    for (const c of s.clicks) drawClick(ctx, c);
    for (const nk of s.nukes) drawNuke(ctx, nk);
    for (const fx of s.ultFx) drawUltFx(ctx, fx, t, s);
    drawPlayer(ctx, s, t);
    for (const bl of s.bullets) drawBullet(ctx, bl, t);
    if (s.nova) {
      const k = s.nova.t / 0.8;
      ctx.strokeStyle = `rgba(255,209,102,${1 - k})`;
      ctx.lineWidth = 14 * (1 - k) + 2;
      ctx.beginPath();
      ctx.arc(s.nova.x, s.nova.y, 30 + k * 620, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const pt of s.parts) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.c;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, s.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (!s.p.alive) {
      ctx.fillStyle = `rgba(80,0,0,${Math.min(0.45, s.p.deadT * 0.3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // UI 레이어: 도트로 뭉개지면 안 되는 글자·아이콘은 원해상도로 그림
  function drawUi(ctx, t) {
    for (const it of s.items) drawItemIcon(ctx, it);
    for (const sh of s.shots) if (sh.label) drawShotLabel(ctx, sh);
    for (const fx of s.ultFx) drawUltUi(ctx, fx, t);
    for (const lz of s.lasers) drawLaserLabel(ctx, lz, s.p.y);
    if (s.boss && s.boss.dash && s.boss.dash.st === 'warn') {
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText('🚗 돌진 주의!', s.boss.dash.x, H * 0.62);
      ctx.fillStyle = Math.floor(t * 8) % 2 ? '#FFD166' : '#FF5252';
      ctx.fillText('🚗 돌진 주의!', s.boss.dash.x, H * 0.62);
    }
    for (const tx of s.texts) {
      ctx.globalAlpha = Math.min(1, tx.life / tx.max * 2);
      ctx.font = `700 ${tx.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
    drawHud(ctx, s, t);
    if (s.cine) drawCine(ctx, s.cine, t);
    if (s.awake) drawAwake(ctx, s, t);
  }

  return {
    update,
    draw,
    drawUi,
    special,
    bomb,
    setAuto,
    blessing,
    isAuto: () => s.auto,
    player: () => ({ x: s.p.x, y: s.p.y }),
    snapshot: () => ({ score: Math.floor(s.score), stage: s.stage, hp: s.p.hp, power: s.p.power, alive: s.p.alive, boss: s.boss && { key: s.boss.key, hp: s.boss.hp, max: s.boss.max, mode: s.boss.mode }, time: s.time, loop: s.loop, cine: !!s.cine, heroLv: s.heroLv, heroCd: s.heroCd, awake: !!s.awake }),
    // 헤드리스 밸런스 테스트용
    _state: s,
  };
}

// =====================================================================
// 드로잉 (시대별 배경 · 캐릭터 · 보스 · 탄)
// =====================================================================
// 조철왕 분노 각성 연출: 붉은 점멸 + 흔들리는 거대 붉은 대사
function drawCine(ctx, c, t) {
  const k = c.t / c.dur;
  const blink = Math.sin(c.t * 18) > 0;
  ctx.fillStyle = `rgba(${blink ? '213,0,0' : '60,0,0'},${blink ? 0.42 : 0.3})`;
  ctx.fillRect(0, 0, W, H);
  // 위아래 경고 띠
  ctx.fillStyle = '#B71C1C';
  ctx.fillRect(0, 0, W, 26);
  ctx.fillRect(0, H - 26, W, 26);
  ctx.font = `700 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = blink ? '#FFEB3B' : '#fff';
  const warn = '⚠ WARNING · 개발자 분노 감지 · ⚠ WARNING · 개발자 분노 감지 · ';
  const off = (t * 120) % 200;
  ctx.fillText(warn + warn, W / 2 - off + 100, 17);
  ctx.fillText(warn + warn, W / 2 + off - 100, H - 9);
  const jx = (Math.random() - 0.5) * 14, jy = (Math.random() - 0.5) * 14;
  const pop = Math.min(1, c.t * 4);
  ctx.save();
  ctx.translate(W / 2 + jx, H * 0.42 + jy);
  ctx.scale(0.6 + pop * 0.4 + Math.sin(c.t * 25) * 0.03, 0.6 + pop * 0.4 + Math.sin(c.t * 25) * 0.03);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  rr(ctx, -W / 2 + 12, -62, W - 24, 124, 10);
  ctx.fill();
  ctx.strokeStyle = blink ? '#FF1744' : '#FFEB3B';
  ctx.lineWidth = 3;
  rr(ctx, -W / 2 + 12, -62, W - 24, 124, 10);
  ctx.stroke();
  ctx.font = `700 14px ${FONT}`;
  ctx.fillStyle = '#FFEB3B';
  ctx.fillText('👑 조철왕', 0, -40);
  // 대사가 길면 두 줄로
  const line = c.line;
  const cut = line.length > 12 ? line.lastIndexOf(' ', Math.ceil(line.length / 2) + 2) : -1;
  const rows = cut > 0 ? [line.slice(0, cut), line.slice(cut + 1)] : [line];
  ctx.font = `700 25px ${FONT}`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000';
  rows.forEach((r, i) => {
    const y = (i - (rows.length - 1) / 2) * 32 + 4;
    ctx.strokeText(r, 0, y);
    ctx.fillStyle = '#FF1744';
    ctx.fillText(r, 0, y);
  });
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  // 아래 안내
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  const sub = k < 0.5 ? '🚨 조철왕의 체력이 0이 되었다…?!' : '🔥 어려움 모드로 1탄부터 다시 시작됩니다';
  ctx.strokeText(sub, W / 2, H * 0.62);
  ctx.fillStyle = '#fff';
  ctx.fillText(sub, W / 2, H * 0.62);
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();
}

// 도트 격자 사각형
const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / U) * U, Math.round(y / U) * U, w, h); };

function pine(ctx, x, y) {
  px(ctx, x - 5, y + 20, 10, 25, '#6D4C41');
  px(ctx, x - 30, y + 5, 60, 20, '#2E7D32');
  px(ctx, x - 22, y - 10, 45, 20, '#388E3C');
  px(ctx, x - 12, y - 22, 25, 15, '#43A047');
  px(ctx, x - 25, y + 5, 15, 5, '#66BB6A');
  px(ctx, x - 15, y - 10, 12, 5, '#66BB6A');
}
function hanok(ctx, x, y, w) {
  px(ctx, x, y + 25, w, 35, '#EFE6D2');
  px(ctx, x, y + 25, w, 5, '#8D6E63');
  for (let k = x + 10; k < x + w - 10; k += 25) px(ctx, k, y + 35, 15, 20, '#A1887F');
  px(ctx, x - 12, y + 12, w + 24, 15, '#455A64');
  px(ctx, x - 5, y, w + 10, 15, '#546E7A');
  px(ctx, x - 17, y + 20, 10, 7.5, '#37474F');
  px(ctx, x + w + 7, y + 20, 10, 7.5, '#37474F');
  px(ctx, x, y, w, 5, '#78909C');
}
function stoneWall(ctx, x, y, w) {
  px(ctx, x, y, w, 30, '#9E9E9E');
  for (let r = 0; r < 3; r++) for (let k = x + (r % 2) * 10; k < x + w; k += 20) px(ctx, k, y + r * 10, 17.5, 7.5, r % 2 ? '#BDBDBD' : '#B0B0B0');
  px(ctx, x - 5, y - 10, w + 10, 10, '#455A64');
}

function drawBackground(ctx, stage, scroll, t) {
  if (stage === 0) {
    // 조선 마을: 흙길 + 돌담 + 한옥 + 소나무 (콘셉트 이미지 참고)
    ctx.fillStyle = '#D9C49A';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const y = ((i * 53 + scroll) % (H + 20)) - 10;
      px(ctx, (i * 97) % W, y, 5, 5, i % 3 ? '#C8B084' : '#E6D5AE');
    }
    px(ctx, 95, 0, 5, H, 'rgba(160,130,90,0.25)');
    px(ctx, 300, 0, 5, H, 'rgba(160,130,90,0.25)');
    for (let k = 0; k < 4; k++) {
      const y = ((k * 190 + scroll * 0.9) % (H + 190)) - 140;
      const left = k % 2 === 0;
      stoneWall(ctx, left ? -10 : W - 80, y + 70, 90);
      hanok(ctx, left ? 0 : W - 70, y, 70);
      pine(ctx, left ? W - 25 : 25, y + 60);
    }
  } else if (stage === 1) {
    // 개화기 경성: 벽돌 + 전신주
    ctx.fillStyle = '#D7C2A0';
    ctx.fillRect(0, 0, W, H);
    for (let y = -30; y < H + 30; y += 22.5) {
      const yy = y + (scroll % 22.5);
      for (let x = (Math.round(y / 22.5) % 2) * 20; x < W; x += 40) px(ctx, x, yy, 35, 17.5, '#C4A47C');
    }
    px(ctx, 60, 0, 280, H, 'rgba(62,39,35,0.22)');
    for (let k = 0; k < 3; k++) {
      const y = ((k * 230 + scroll * 1.1) % (H + 230)) - 200;
      for (const x of [40, W - 40]) {
        px(ctx, x - 2.5, y, 5, 200, '#4E342E');
        px(ctx, x - 17.5, y + 10, 35, 5, '#4E342E');
      }
      for (let x = 25; x < W - 25; x += 10) px(ctx, x, y + 12.5 + Math.sin(((x - 25) / (W - 50)) * Math.PI) * 25, 10, 2.5, 'rgba(62,39,35,0.7)');
    }
  } else if (stage === 2) {
    // 중고차 매매단지: 가운데 낡은 도로 + 양옆 주차장(매물 차량·급매 깃발)
    ctx.fillStyle = '#A7ADB2';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) px(ctx, (i * 89) % 85, ((i * 61 + scroll) % (H + 20)) - 10, 5, 2.5, '#979DA2');
    for (let i = 0; i < 40; i++) px(ctx, 315 + ((i * 47) % 85), ((i * 71 + scroll) % (H + 20)) - 10, 5, 2.5, '#979DA2');
    px(ctx, 85, 0, 230, H, '#43484F');
    for (let i = 0; i < 30; i++) px(ctx, 90 + ((i * 67) % 220), ((i * 113 + scroll) % (H + 20)) - 10, 5, 5, i % 4 ? '#4C525A' : '#363A40');
    px(ctx, 87.5, 0, 5, H, '#ECEFF1');
    px(ctx, 307.5, 0, 5, H, '#ECEFF1');
    const dash = scroll % 70;
    for (let y = -70; y < H + 70; y += 70) {
      px(ctx, 195, y + dash, 5, 35, '#FFC400');
      px(ctx, 202.5, y + dash, 2.5, 35, '#FFC400');
      px(ctx, 145, y + dash + 20, 2.5, 25, 'rgba(236,239,241,0.6)');
      px(ctx, 255, y + dash + 20, 2.5, 25, 'rgba(236,239,241,0.6)');
    }
    // 포트홀
    for (let k = 0; k < 3; k++) {
      const y = ((k * 260 + scroll) % (H + 260)) - 120;
      px(ctx, 110 + k * 70, y, 20, 10, '#2B2E33');
      px(ctx, 115 + k * 70, y + 2.5, 10, 5, '#1E2024');
    }
    // 주차 칸 + 매물 차량
    const CARS = ['#E53935', '#FDD835', '#1E88E5', '#ECEFF1', '#43A047', '#8E24AA', '#FB8C00', '#546E7A'];
    const lot = scroll % 56;
    for (let r = -1; r < H / 56 + 2; r++) {
      const y = r * 56 + lot;
      const idx = Math.floor((r * 56 + lot - scroll) / 56);
      px(ctx, 0, y, 80, 2.5, '#ECEFF1');
      px(ctx, 320, y, 80, 2.5, '#ECEFF1');
      const hash = (n) => ((n * 2654435761) >>> 0) % 97;
      if (hash(idx) % 4 !== 0) parkedCar(ctx, 8, y + 10, CARS[hash(idx) % CARS.length]);
      if (hash(idx + 31) % 4 !== 0) parkedCar(ctx, 328, y + 10, CARS[hash(idx + 31) % CARS.length]);
    }
    // 급매 깃발 줄
    for (let k = 0; k < 2; k++) {
      const y = ((k * 330 + scroll * 1.05) % (H + 330)) - 160;
      for (const x0 of [0, 320]) {
        for (let x = x0; x < x0 + 80; x += 10) {
          px(ctx, x, y, 10, 2.5, '#424242');
          px(ctx, x + 2.5, y + 2.5, 5, 5, ['#FF1744', '#FFEA00', '#2979FF', '#00E676'][(x / 10) % 4]);
        }
      }
    }
  } else {
    // 사이버 기지: 청록 회로 바닥 + 네온 패널
    ctx.fillStyle = '#0B2E35';
    ctx.fillRect(0, 0, W, H);
    const off = scroll % 80;
    for (let y = -80; y < H + 80; y += 80) {
      for (let x = 0; x < W; x += 100) {
        px(ctx, x + 5, y + off + 5, 90, 70, '#0F3D46');
        px(ctx, x + 5, y + off + 5, 90, 2.5, '#1DE9B6');
        px(ctx, x + 20, y + off + 30, 40, 2.5, 'rgba(0,229,255,0.5)');
        px(ctx, x + 57.5, y + off + 30, 2.5, 25, 'rgba(0,229,255,0.5)');
        px(ctx, x + 57.5, y + off + 52.5, 25, 2.5, 'rgba(0,229,255,0.5)');
        px(ctx, x + 15, y + off + 27.5, 7.5, 7.5, '#00E5FF');
      }
    }
    for (let i = 0; i < 24; i++) {
      px(ctx, (i * 73) % W, ((i * 131 + scroll * 2.2) % (H + 40)) - 20, 2.5, 12.5, i % 3 ? 'rgba(224,64,251,0.55)' : 'rgba(0,229,255,0.65)');
    }
  }
}

// 매매단지 주차 차량 (위에서 본 모습, 가로 주차) + 노란 가격표
function parkedCar(ctx, x, y, c) {
  px(ctx, x + 7.5, y - 2.5, 10, 5, '#212121');
  px(ctx, x + 47.5, y - 2.5, 10, 5, '#212121');
  px(ctx, x + 7.5, y + 30, 10, 5, '#212121');
  px(ctx, x + 47.5, y + 30, 10, 5, '#212121');
  px(ctx, x, y, 65, 32.5, c);
  px(ctx, x + 2.5, y + 2.5, 60, 2.5, 'rgba(255,255,255,0.35)');
  px(ctx, x + 15, y + 5, 30, 22.5, 'rgba(0,0,0,0.18)');
  px(ctx, x + 42.5, y + 5, 7.5, 22.5, '#90CAF9');
  px(ctx, x + 12.5, y + 5, 5, 22.5, '#64B5F6');
  px(ctx, x + 22.5, y + 10, 10, 10, '#FFEB3B');
}

function drawPlayer(ctx, s, t) {
  const p = s.p;
  if (!p.alive) return;
  const PY = p.y;
  // 호위 드론
  if (s.buffs.drone > 0) {
    for (const k of [0, 1]) {
      const a = s.droneA + k * Math.PI;
      const x = p.x + Math.cos(a) * 36, y = PY - 10 + Math.sin(a) * 22;
      ctx.fillStyle = 'rgba(179,136,255,0.35)';
      circle(ctx, x, y, 11);
      ctx.fillStyle = '#7C4DFF';
      circle(ctx, x, y, 7);
      ctx.fillStyle = '#fff';
      circle(ctx, x, y, 2.5);
    }
  }
  if (p.inv > 0 && s.buffs.star <= 0 && Math.floor(t * 16) % 2 === 0) return;
  const tier = tierOf(p.power), n = shotsOf(p.power);
  // 아슬아슬 피버 오라
  if (s.fever > 0) {
    ctx.fillStyle = `rgba(255,224,130,${0.25 + Math.sin(t * 20) * 0.1})`;
    circle(ctx, p.x, PY - 6, 34);
  }
  // 무적 별: 무지개 오라
  if (s.buffs.star > 0) {
    ctx.fillStyle = `hsla(${(t * 400) % 360},100%,60%,0.45)`;
    circle(ctx, p.x, PY - 6, 38);
  }
  // 엄호 병사 (군대 규모): 같은 흰 머리띠 의병이 양옆 뒤로
  const sp = heroSprite(tier);
  const step = Math.floor(t * 8) % 2 ? U : 0; // 2프레임 걸음 들썩임
  for (let k = n - 2; k >= 0; k--) {
    const side = k % 2 ? 1 : -1, row = Math.floor(k / 2) + 1;
    drawSprite(ctx, sp, p.x + side * (30 + (row - 1) * 26), PY + 10 + row * 8 - (k % 2 ? step : U - step), false, 0.92);
  }
  const hero = s.heroLv > 0 ? HEROES[s.heroLv - 1] : null;
  if (hero) {
    // 🦸 초각성 오라 + 영웅 도트 스프라이트 (홍길동은 좌우 분신)
    ctx.fillStyle = hero.color;
    ctx.globalAlpha = 0.22 + Math.sin(t * 6) * 0.08;
    circle(ctx, p.x, PY - 6, 30);
    ctx.globalAlpha = 1;
    const hs = awakenSprite(hero.key);
    if (hero.key === 'hong') for (const ox of [-40, 40]) drawSprite(ctx, hs, p.x + ox, PY + 14 - step, false, 0.45);
    if (hero.key === 'ahn') {
      // 등 뒤 프로펠러
      const a = t * 40;
      ctx.fillStyle = 'rgba(236,239,241,0.6)';
      ctx.fillRect(p.x - 18 * Math.abs(Math.cos(a)), PY + 22, 36 * Math.abs(Math.cos(a)), 3);
    }
    drawSprite(ctx, hs || sp, p.x, PY - step);
  } else drawSprite(ctx, sp, p.x, PY - step);
  // 피격 판정 점 (탄막 게임식)
  ctx.fillStyle = '#fff';
  circle(ctx, p.x, PY, HIT_R - 2);
  ctx.strokeStyle = '#C62828';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, PY, HIT_R - 1, 0, Math.PI * 2);
  ctx.stroke();
  // 방어막 (남은 내구도만큼 진하게)
  if (s.buffs.shield > 0) {
    const fade = s.buffs.shield < 2 && Math.floor(t * 8) % 2 ? 0.3 : 1;
    ctx.strokeStyle = `rgba(64,196,255,${(0.35 + 0.15 * s.shieldHits) * fade})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, PY - 8, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(64,196,255,${0.12 * fade})`;
    circle(ctx, p.x, PY - 8, 30);
  }
}

// 🦸 영웅 무기 탄 (글자·이모지는 drawShotLabel이 UI 레이어에 선명하게)
function drawHeroShot(ctx, sh, t) {
  const k = sh.kind;
  if (k === 'singi') {
    // 신기전 불화살: 화살대 + 불꼬리
    const a = Math.atan2(sh.vy, sh.vx);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,109,0,0.75)';
    ctx.fillRect(-16, -2.5, 9, 5);
    ctx.fillStyle = '#FFEA00';
    ctx.fillRect(-12, -1.2, 6, 2.4);
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-8, -1, 14, 2);
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(5, -3.5);
    ctx.lineTo(5, 3.5);
    ctx.fill();
    ctx.restore();
  } else if (k === 'hstar') {
    ctx.fillStyle = 'rgba(255,234,0,0.35)';
    circle(ctx, sh.x, sh.y + 6, 7);
    starPath(ctx, sh.x, sh.y, sh.r + 2, (sh.r + 2) * 0.45, t * 8);
    ctx.fillStyle = '#FFEA00';
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, sh.x, sh.y, 2);
  } else if (k === 'glyph') {
    ctx.fillStyle = 'rgba(255,171,64,0.4)';
    circle(ctx, sh.x, sh.y, sh.big ? 12 : 9);
  } else if (k === 'gear') {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.spin);
    ctx.fillStyle = '#C49000';
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-2, -sh.r - 2, 4, 5); }
    ctx.fillStyle = '#FFCA28';
    circle(ctx, 0, 0, sh.r - 1);
    ctx.fillStyle = '#6D4C41';
    circle(ctx, 0, 0, 3);
    ctx.restore();
  } else if (k === 'needle') {
    ctx.fillStyle = 'rgba(156,204,101,0.5)';
    ctx.fillRect(sh.x - 2, sh.y - 6, 4, 16);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(sh.x - 0.8, sh.y - 10, 1.6, 16);
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(sh.x - 1.5, sh.y + 4, 3, 3);
  } else if (k === 'eye') {
    const g = ctx.createLinearGradient(sh.x - 6, 0, sh.x + 6, 0);
    g.addColorStop(0, 'rgba(255,214,0,0)');
    g.addColorStop(0.5, 'rgba(255,214,0,0.95)');
    g.addColorStop(1, 'rgba(255,214,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sh.x - 6, sh.y - 22, 12, 34);
    ctx.fillStyle = '#FFFDE7';
    ctx.fillRect(sh.x - 1.5, sh.y - 20, 3, 30);
  } else if (k === 'shuri') {
    starPath(ctx, sh.x, sh.y, 8, 2.5, sh.spin, 4);
    ctx.fillStyle = '#CFD8DC';
    ctx.fill();
    ctx.fillStyle = '#37474F';
    circle(ctx, sh.x, sh.y, 1.8);
  } else if (k === 'fist') {
    ctx.fillStyle = sh.label === '🧃' ? 'rgba(255,145,0,0.45)' : 'rgba(255,112,67,0.4)';
    circle(ctx, sh.x, sh.y + 8, sh.big ? 9 : 7);
  } else if (k === 'prop') {
    ctx.fillStyle = 'rgba(79,195,247,0.5)';
    ctx.fillRect(sh.x - 2.5, sh.y - 9, 5, 16);
    ctx.fillStyle = '#FFF59D';
    ctx.fillRect(sh.x - 1, sh.y - 10, 2, 12);
  } else if (k === 'money') {
    // 돈다발(수표): 초록 지폐 + 띠지
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(Math.atan2(sh.vy, sh.vx) + Math.PI / 2);
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(-7, -4.5, 14, 9);
    ctx.fillStyle = '#A5D6A7';
    ctx.fillRect(-6, -3.5, 12, 7);
    ctx.fillStyle = '#1B5E20';
    circle(ctx, 0, 0, 2.2);
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(-1.5, -4.5, 3, 9);
    ctx.restore();
  } else if (k === 'chip') {
    // 반도체 칩: 검은 패키지 + 은색 다리 + 금빛 코어
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(t * 3 + sh.x);
    ctx.fillStyle = '#B0BEC5';
    for (let i = -1; i <= 1; i++) { ctx.fillRect(-8, i * 3 - 0.8, 16, 1.6); ctx.fillRect(i * 3 - 0.8, -8, 1.6, 16); }
    ctx.fillStyle = '#212121';
    ctx.fillRect(-5.5, -5.5, 11, 11);
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  } else if (k === 'grain') {
    // 초밥 밥알
    const a = Math.atan2(sh.vy, sh.vx);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(a);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(-1.5, -0.8, 3, 1.6);
    ctx.restore();
  } else return false;
  return true;
}
function starPath(ctx, x, y, r1, r2, rot = 0, n = 5) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n - Math.PI / 2;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function drawShotLabel(ctx, sh) {
  const big = sh.big ? 1.35 : 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (sh.kind === 'glyph') {
    ctx.font = `700 ${Math.round(15 * big)}px ${FONT}`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3E2723';
    ctx.strokeText(sh.label, sh.x, sh.y);
    ctx.fillStyle = '#FFF3E0';
    ctx.fillText(sh.label, sh.x, sh.y);
  } else {
    ctx.font = `${Math.round(14 * big)}px sans-serif`;
    ctx.fillText(sh.label, sh.x, sh.y);
  }
  ctx.textBaseline = 'alphabetic';
}
// 자격루 시간 정지: 얼어붙은 적
function drawFrozen(ctx, x, y, w, a) {
  ctx.save();
  ctx.globalAlpha = a * 0.75;
  ctx.fillStyle = '#B3E5FC';
  ctx.fillRect(x - w / 2, y - w * 0.9, w, w);
  ctx.fillStyle = '#E1F5FE';
  ctx.fillRect(x - w / 2 + 3, y - w * 0.9 + 3, w * 0.3, w * 0.2);
  ctx.restore();
}

function drawShot(ctx, sh, t) {
  if (drawHeroShot(ctx, sh, t)) return;
  if (sh.kind === 'flame') {
    const k = sh.t / sh.life;
    const hue = sh.ultra ? (t * 300 + sh.x) % 360 : 40 - k * 40;
    ctx.fillStyle = sh.ultra ? `hsla(${hue},100%,60%,${0.55 * (1 - k)})` : `hsla(${hue},100%,${60 - k * 20}%,${0.6 * (1 - k)})`;
    circle(ctx, sh.x, sh.y, sh.r);
    ctx.fillStyle = `rgba(255,245,200,${0.7 * (1 - k) * (1 - k)})`;
    circle(ctx, sh.x, sh.y, sh.r * 0.4);
    return;
  }
  if (sh.kind === 'ult') {
    // 엔터키 핵미사일: 불꽃 꼬리 + 거대한 ↵ Enter 키캡 + 방사능 마크
    const fl = 1 + Math.sin(t * 40) * 0.2;
    ctx.fillStyle = 'rgba(255,109,0,0.7)';
    circle(ctx, sh.x, sh.y + 26, 10 * fl);
    ctx.fillStyle = 'rgba(255,234,0,0.9)';
    circle(ctx, sh.x, sh.y + 24, 5 * fl);
    ctx.fillStyle = '#9E9E9E';
    rr(ctx, sh.x - 15, sh.y - 16, 30, 34, 5);
    ctx.fill();
    ctx.fillStyle = '#ECEFF1';
    rr(ctx, sh.x - 12, sh.y - 16, 24, 28, 4);
    ctx.fill();
    ctx.fillStyle = '#FFD600';
    circle(ctx, sh.x, sh.y - 6, 8);
    ctx.fillStyle = '#212121';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3 + t * 6;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y - 6);
      ctx.arc(sh.x, sh.y - 6, 7, a - 0.5, a + 0.5);
      ctx.fill();
    }
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#37474F';
    ctx.fillText('↵Enter', sh.x, sh.y + 7);
    return;
  }
  if (sh.kind === 'water') {
    ctx.fillStyle = 'rgba(0,145,234,0.85)';
    circle(ctx, sh.x, sh.y, 4);
    ctx.fillStyle = '#E1F5FE';
    circle(ctx, sh.x - 1.2, sh.y - 1.2, 1.6);
    return;
  }
  if (sh.kind === 'leaf') {
    // 풀잎 수리검: 회전하는 초록 잎사귀
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.spin);
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#76FF03';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (sh.kind === 'key') {
    // 키캡 유도탄: 회색 키캡 + 키 이름
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(Math.atan2(sh.vy, sh.vx) + Math.PI / 2 + sh.spin);
    const kw = sh.label.length > 2 ? 26 : 16;
    ctx.fillStyle = '#546E7A';
    rr(ctx, -kw / 2, -8, kw, 17, 3);
    ctx.fill();
    ctx.fillStyle = '#ECEFF1';
    rr(ctx, -kw / 2 + 2, -8, kw - 4, 13, 2);
    ctx.fill();
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#263238';
    ctx.fillText(sh.label, 0, -1.5);
    ctx.restore();
    return;
  }
  if (sh.hot) {
    ctx.fillStyle = 'rgba(255,145,0,0.45)';
    circle(ctx, sh.x, sh.y, sh.r + 4);
  }
  if (sh.kind === 'arrow') {
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y + 8);
    ctx.lineTo(sh.x, sh.y - 8);
    ctx.stroke();
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y - 13);
    ctx.lineTo(sh.x - 3, sh.y - 7);
    ctx.lineTo(sh.x + 3, sh.y - 7);
    ctx.fill();
  } else if (sh.kind === 'ball') {
    // 조총 납탄: 은회색 (금색 엽전과 구분)
    ctx.fillStyle = '#B0BEC5';
    ctx.fillRect(sh.x - 1.5, sh.y - 7, 3, 10);
    ctx.fillStyle = '#fff';
    circle(ctx, sh.x, sh.y - 7, 2.5);
  } else if (sh.kind === 'cannon') {
    ctx.fillStyle = 'rgba(255,112,67,0.4)';
    circle(ctx, sh.x, sh.y + 6, 6);
    ctx.fillStyle = '#212121';
    circle(ctx, sh.x, sh.y, sh.r);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    circle(ctx, sh.x - 2, sh.y - 2, 2);
  } else if (sh.kind === 'drone') {
    ctx.fillStyle = '#E040FB';
    ctx.fillRect(sh.x - 1.5, sh.y - 8, 3, 10);
  } else {
    ctx.fillStyle = '#E1F5FE';
    ctx.fillRect(sh.x - 1.5, sh.y - 10, 3, 14);
    ctx.fillStyle = 'rgba(0,229,255,0.35)';
    ctx.fillRect(sh.x - 3, sh.y - 12, 6, 18);
  }
}

function drawWave(ctx, wv, t) {
  // 해일: 화면 폭 전체의 물결 띠
  ctx.fillStyle = 'rgba(0,145,234,0.45)';
  ctx.fillRect(0, wv.y - 6, W, 30);
  ctx.fillStyle = 'rgba(64,196,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(0, wv.y + 6);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, wv.y - 6 + Math.sin(x / 22 + t * 10) * 6);
  ctx.lineTo(W, wv.y + 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let x = 6; x < W; x += 22) circle(ctx, x, wv.y - 8 + Math.sin(x / 22 + t * 10) * 6, 2.5);
}

// 🌿 가시덩굴: 묶인 적 발밑에서 솟아오르는 덩굴 + 가시
function drawVine(ctx, x, y, w, a, t) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const ox = (i / 3 - 0.5) * w;
    ctx.beginPath();
    ctx.moveTo(x + ox, y + 10);
    ctx.quadraticCurveTo(x + ox + Math.sin(t * 6 + i) * 8, y - 6, x + ox * 0.3, y - 18 - (i % 2) * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#76FF03';
  for (let i = 0; i < 5; i++) circle(ctx, x + (i / 4 - 0.5) * w * 0.9, y - 4 - (i % 2) * 8, 2.2);
  ctx.fillStyle = '#C6FF00';
  for (let i = 0; i < 3; i++) {
    const px = x + (i - 1) * w * 0.3, py = y - 10;
    ctx.beginPath();
    ctx.moveTo(px - 3, py);
    ctx.lineTo(px, py - 6);
    ctx.lineTo(px + 3, py);
    ctx.fill();
  }
  ctx.restore();
}

// ⌨️ 마우스 클릭 폭격: 조준 원 + 화살표 커서 → 딸깍 폭발 링
function drawClick(ctx, c) {
  if (!c.done) {
    const k = c.t / 0.28;
    ctx.strokeStyle = `rgba(24,255,255,${0.5 + k * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 30 - k * 18, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const k = (c.t - 0.28) / 0.22;
    ctx.strokeStyle = `rgba(224,64,251,${1 - k})`;
    ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10 + k * 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 커서 (클릭 순간 살짝 눌림)
  const cx = c.x + 4, cy = c.y + 4 + (c.done ? 2 : 0);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + 16);
  ctx.lineTo(cx + 4, cy + 12);
  ctx.lineTo(cx + 7, cy + 18);
  ctx.lineTo(cx + 9.5, cy + 17);
  ctx.lineTo(cx + 6.5, cy + 11);
  ctx.lineTo(cx + 11, cy + 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ☢️ 핵폭발: 화면을 덮는 충격파 + 버섯구름
function drawNuke(ctx, nk) {
  const k = nk.t / 1.4;
  ctx.save();
  ctx.strokeStyle = `rgba(255,214,0,${1 - k})`;
  ctx.lineWidth = 18 * (1 - k) + 2;
  ctx.beginPath();
  ctx.arc(nk.x, nk.y, 20 + k * 700, 0, Math.PI * 2);
  ctx.stroke();
  const a = Math.max(0, 1 - k * 1.1);
  const rise = k * 50;
  ctx.fillStyle = `rgba(255,109,0,${0.75 * a})`;
  ctx.fillRect(nk.x - 9, nk.y - rise, 18, 40 + rise);
  ctx.fillStyle = `rgba(255,145,0,${0.85 * a})`;
  circle(ctx, nk.x, nk.y - 20 - rise, 30 + k * 30);
  ctx.fillStyle = `rgba(255,234,0,${0.9 * a})`;
  circle(ctx, nk.x - 16, nk.y - 26 - rise, 16 + k * 14);
  circle(ctx, nk.x + 16, nk.y - 26 - rise, 16 + k * 14);
  ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
  circle(ctx, nk.x, nk.y - 28 - rise, 10 + k * 8);
  ctx.restore();
}

function drawBolt(ctx, bo) {
  const a = Math.min(1, bo.life / 0.08);
  const glow = bo.ultra ? `rgba(224,64,251,${0.45 * a})` : bo.sky ? `rgba(255,234,0,${0.5 * a})` : `rgba(0,229,255,${0.4 * a})`;
  for (const [lw, col] of [[bo.sky ? 11 : 7, glow], [bo.sky ? 3.5 : 2.5, `rgba(255,255,255,${a})`]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let i = 0; i < bo.pts.length - 1; i++) {
      const p0 = bo.pts[i], p1 = bo.pts[i + 1];
      if (i === 0) ctx.moveTo(p0.x, p0.y);
      const n = 5;
      for (let k = 1; k <= n; k++) {
        const f = k / n, j = k === n ? 0 : 9;
        ctx.lineTo(p0.x + (p1.x - p0.x) * f + (Math.random() - 0.5) * j, p0.y + (p1.y - p0.y) * f + (Math.random() - 0.5) * j);
      }
    }
    ctx.stroke();
  }
}

function drawBeam(ctx, bm, big, PY) {
  if (bm.tier >= 9) {
    // 궁극: 화면을 가르는 무지개빛 개발자 에네르기파
    const w = bm.w * 1.6, wob = Math.sin(bm.seed + performance.now() / 40) * 3;
    const hue = (performance.now() / 6) % 360;
    const g = ctx.createLinearGradient(bm.x - w, 0, bm.x + w, 0);
    g.addColorStop(0, `hsla(${hue},100%,60%,0)`);
    g.addColorStop(0.3, `hsla(${hue},100%,60%,0.55)`);
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.7, `hsla(${(hue + 120) % 360},100%,60%,0.55)`);
    g.addColorStop(1, `hsla(${(hue + 120) % 360},100%,60%,0)`);
    ctx.fillStyle = g;
    ctx.fillRect(bm.x - w - wob, 0, (w + wob) * 2, PY - 30);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    circle(ctx, bm.x, PY - 34, w * 0.9);
    ctx.fillStyle = '#fff';
    circle(ctx, bm.x, PY - 34, w * 0.45);
    return;
  }
  if (bm.tier >= 5) {
    // 원소 빔: 6 물(파랑) · 7 불(주황) · 8 풀(초록) · 9 번개(노랑 + 지그재그 전격)
    const col = { 5: '0,145,234', 6: '255,109,0', 7: '100,221,23', 8: '255,234,0' }[bm.tier];
    const g = ctx.createLinearGradient(bm.x - bm.w, 0, bm.x + bm.w, 0);
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(0.5, `rgba(${col},0.8)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(bm.x - bm.w, 0, bm.w * 2, PY - 30);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(bm.x - bm.w * 0.18, 0, bm.w * 0.36, PY - 30);
    if (bm.tier === 8) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      for (let s2 = 0; s2 < 2; s2++) {
        ctx.beginPath();
        ctx.moveTo(bm.x, PY - 30);
        for (let y = PY - 30; y > 0; y -= 22) ctx.lineTo(bm.x + (Math.random() - 0.5) * bm.w * 1.1, y);
        ctx.stroke();
      }
    }
    return;
  }
  const g = ctx.createLinearGradient(bm.x - bm.w, 0, bm.x + bm.w, 0);
  g.addColorStop(0, 'rgba(0,229,255,0)');
  g.addColorStop(0.5, big ? 'rgba(224,64,251,0.9)' : 'rgba(0,229,255,0.85)');
  g.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bm.x - bm.w, 0, bm.w * 2, PY - 30);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(bm.x - 1.5, 0, 3, PY - 30);
}

// 적 탄: 형광 주황·빨강 몸체 + 굵은 흰 테두리 → 어떤 배경에서도 분리돼 보이게
const OUTLINE_W = 3;
function drawBullet(ctx, bl, t) {
  if (bl.kind === 'tire') {
    // 낡은 타이어: 흰 테두리 + 주황 트레드 + 검은 고무 + 회전하는 휠
    ctx.fillStyle = '#fff';
    circle(ctx, bl.x, bl.y, bl.r + OUTLINE_W);
    ctx.fillStyle = bl.color;
    circle(ctx, bl.x, bl.y, bl.r);
    ctx.fillStyle = '#212121';
    circle(ctx, bl.x, bl.y, bl.r * 0.68);
    ctx.fillStyle = '#FFD166';
    for (let i = 0; i < 3; i++) {
      const a = bl.spin + (i * Math.PI * 2) / 3;
      circle(ctx, bl.x + Math.cos(a) * bl.r * 0.42, bl.y + Math.sin(a) * bl.r * 0.42, 1.6);
    }
    ctx.fillStyle = '#fff';
    circle(ctx, bl.x, bl.y, 1.8);
    return;
  }
  if (bl.kind === 'smoke') {
    // 매연 구름: 흰 테두리 + 주황 독가스 + 검댕 얼룩
    ctx.fillStyle = '#fff';
    circle(ctx, bl.x, bl.y, bl.r + OUTLINE_W);
    ctx.fillStyle = bl.color;
    circle(ctx, bl.x, bl.y, bl.r);
    ctx.fillStyle = 'rgba(66,66,66,0.75)';
    circle(ctx, bl.x - bl.r * 0.35, bl.y - bl.r * 0.25, bl.r * 0.38);
    circle(ctx, bl.x + bl.r * 0.3, bl.y + bl.r * 0.3, bl.r * 0.3);
    ctx.fillStyle = '#FFE0B2';
    circle(ctx, bl.x + bl.r * 0.25, bl.y - bl.r * 0.35, bl.r * 0.2);
    return;
  }
  if (bl.kind === 'coin') {
    // 엽전
    ctx.fillStyle = bl.color;
    circle(ctx, bl.x, bl.y, bl.r);
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(bl.x - bl.r * 0.35, bl.y - bl.r * 0.35, bl.r * 0.7, bl.r * 0.7);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bl.x, bl.y, bl.r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (bl.kind === 'rice') {
    const a = Math.atan2(bl.vy, bl.vx);
    ctx.save();
    ctx.translate(bl.x, bl.y);
    ctx.rotate(a);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, bl.r * 1.7 + OUTLINE_W, bl.r * 0.8 + OUTLINE_W, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bl.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bl.r * 1.7, bl.r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.ellipse(0, 0, bl.r * 0.8, bl.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (bl.kind === 'missile') {
    const a = Math.atan2(bl.vy, bl.vx);
    ctx.save();
    ctx.translate(bl.x, bl.y);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,214,0,0.85)';
    circle(ctx, -11, 0, 3 + Math.random() * 2);
    // 미사일: 흰 테두리 + 빨강 동체 + 주황 탄두
    ctx.fillStyle = '#fff';
    rr(ctx, -8 - OUTLINE_W, -3.5 - OUTLINE_W, 18 + OUTLINE_W * 2, 7 + OUTLINE_W * 2, 5);
    ctx.fill();
    ctx.fillStyle = bl.color;
    rr(ctx, -8, -3.5, 18, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = E_ORANGE;
    ctx.fillRect(5, -3.5, 5, 7);
    ctx.restore();
  } else {
    // 일반 탄: 흰 테두리 링 + 형광 몸체 + 밝은 심지
    ctx.fillStyle = '#fff';
    circle(ctx, bl.x, bl.y, bl.r + OUTLINE_W);
    ctx.fillStyle = bl.color;
    circle(ctx, bl.x, bl.y, bl.r + (Math.sin(t * 20) > 0 ? 0.6 : 0));
    ctx.fillStyle = '#FFF59D';
    circle(ctx, bl.x, bl.y, bl.r * 0.4);
  }
}

function drawItem(ctx, it, t) {
  const bob = Math.sin(it.t * 6) * 2;
  if (it.kind === 'coin') {
    // 엽전: 금색 + 반짝임 (적 탄은 빨간색이라 구분)
    const y = it.y + bob;
    ctx.fillStyle = 'rgba(255,214,0,0.35)';
    circle(ctx, it.x, y, 10);
    ctx.fillStyle = '#FFD600';
    circle(ctx, it.x, y, 7);
    ctx.strokeStyle = '#8D6E00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(it.x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(it.x - 2.5, y - 2.5, 5, 5);
    const tw = (Math.sin(it.t * 9) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + tw * 0.6})`;
    ctx.beginPath();
    ctx.moveTo(it.x + 6, y - 11 - tw * 2);
    ctx.lineTo(it.x + 7.5, y - 7);
    ctx.lineTo(it.x + 11 + tw * 2, y - 5.5);
    ctx.lineTo(it.x + 7.5, y - 4);
    ctx.lineTo(it.x + 6, y + 0 + tw * 2);
    ctx.lineTo(it.x + 4.5, y - 4);
    ctx.lineTo(it.x + 1 - tw * 2, y - 5.5);
    ctx.lineTo(it.x + 4.5, y - 7);
    ctx.fill();
  } else if (POWERUPS[it.kind]) {
    // 파워업: 흰 배지 + 색 테두리 + 아이콘
    const pu = POWERUPS[it.kind], y = it.y + bob;
    ctx.globalAlpha = 0.35 + Math.sin(t * 8) * 0.15;
    ctx.fillStyle = pu.color;
    circle(ctx, it.x, y, 17);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    circle(ctx, it.x, y, 12);
    ctx.strokeStyle = pu.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(it.x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else if (it.kind === 'box') {
    ctx.fillStyle = `rgba(255,209,102,${0.35 + Math.sin(t * 10) * 0.15})`;
    circle(ctx, it.x, it.y, 18);
    ctx.fillStyle = '#8D6E63';
    rr(ctx, it.x - 11, it.y - 9 + bob, 22, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#FFD166';
    ctx.fillRect(it.x - 11, it.y - 2 + bob, 22, 4);
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3E2723';
    ctx.fillText('武', it.x, it.y + 9 + bob);
  } else {
    // 인삼
    ctx.fillStyle = '#69F0AE';
    circle(ctx, it.x, it.y - 9 + bob, 5);
    ctx.fillStyle = '#FFE0B2';
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 2 + bob, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawItemIcon(ctx, it) {
  const pu = POWERUPS[it.kind];
  if (!pu) return;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pu.icon, it.x, it.y + Math.sin(it.t * 6) * 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawMob(ctx, m, t) {
  if (m.elite) {
    // 👹 엘리트: 붉은 오라 + 1.5배 크기
    const pulse = Math.sin(t * 8 + m.x) * 3;
    ctx.fillStyle = 'rgba(255,23,68,0.28)';
    circle(ctx, m.x, m.y, m.r + 10 + pulse);
    ctx.fillStyle = 'rgba(255,82,82,0.35)';
    circle(ctx, m.x, m.y, m.r + 3);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.scale(1.5, 1.5);
    ctx.translate(-m.x, -m.y);
    drawSprite(ctx, mobSprite(m.stage), m.x, m.y + (Math.floor(m.t * 6) % 2 ? U : 0), m.flashT > 0);
    ctx.restore();
    if (m.hp < m.max) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(m.x - 20, m.y - m.r - 14, 40, 4);
      ctx.fillStyle = '#FF1744';
      ctx.fillRect(m.x - 20, m.y - m.r - 14, 40 * Math.max(0, m.hp / m.max), 4);
    }
    return;
  }
  if (m.kind !== 'heavy') {
    const bob = Math.floor(m.t * 6) % 2 ? U : 0;
    drawSprite(ctx, mobSprite(m.stage), m.x, m.y + bob, m.flashT > 0);
    if (m.max > 3 && m.hp < m.max) drawMobHp(ctx, m);
    return;
  }
  ctx.save();
  ctx.translate(m.x, m.y);
  if (m.flashT > 0) ctx.filter = 'brightness(3)';
  const heavy = m.kind === 'heavy';
  if (m.stage === 0) {
    if (heavy) {
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(-22, -14, 44, 22);
      ctx.fillStyle = '#FFE082';
      ctx.fillRect(-18, -22, 36, 10);
      ctx.fillStyle = '#3E2723';
      circle(ctx, -14, 10, 7);
      circle(ctx, 14, 10, 7);
    } else {
      // 포졸: 전립 + 검은 쾌자
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.lineTo(11, -2);
      ctx.lineTo(13, 16);
      ctx.lineTo(-13, 16);
      ctx.fill();
      ctx.fillStyle = '#C62828';
      ctx.fillRect(-11, 2, 22, 3);
      ctx.fillStyle = '#FFE0B2';
      circle(ctx, 0, -9, 8);
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.ellipse(0, -14, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5, -21, 10, 7);
      ctx.fillStyle = '#E53935';
      circle(ctx, 0, -22, 3);
      ctx.fillStyle = '#222';
      ctx.fillRect(-4, -9, 3, 2);
      ctx.fillRect(1, -9, 3, 2);
    }
  } else if (m.stage === 1) {
    if (heavy) {
      ctx.fillStyle = '#212121';
      circle(ctx, 0, 6, 15);
      ctx.fillStyle = '#B71C1C';
      rr(ctx, -16, -20, 32, 22, 6);
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 6);
      ctx.lineTo(-24, 22);
      ctx.moveTo(14, 6);
      ctx.lineTo(24, 22);
      ctx.stroke();
    } else {
      // 순사: 남색 제복 + 모자
      ctx.fillStyle = '#1A237E';
      rr(ctx, -12, -2, 24, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#FFD54F';
      circle(ctx, 0, 4, 1.8);
      circle(ctx, 0, 10, 1.8);
      ctx.fillStyle = '#FFE0B2';
      circle(ctx, 0, -9, 8);
      ctx.fillStyle = '#1A237E';
      ctx.fillRect(-9, -20, 18, 7);
      ctx.fillStyle = '#212121';
      ctx.fillRect(-11, -14, 22, 3);
      ctx.fillStyle = '#222';
      ctx.fillRect(-4, -9, 3, 2);
      ctx.fillRect(1, -9, 3, 2);
    }
  } else if (m.stage === 2) {
    // 폐차 직전 중고차 (정면이 아래): 녹슨 차체 + 금 간 유리 + 깨진 헤드라이트
    ctx.fillStyle = '#212121';
    for (const [wx, wy] of [[-17, -15], [13, -15], [-17, 7], [13, 7]]) ctx.fillRect(wx, wy, 4, 9);
    ctx.fillStyle = '#26A69A';
    rr(ctx, -14, -22, 28, 44, 5);
    ctx.fill();
    ctx.fillStyle = '#8D5524';
    ctx.fillRect(-12, -18, 7, 5);
    ctx.fillRect(5, 10, 7, 6);
    ctx.fillStyle = '#90CAF9';
    ctx.fillRect(-10, 2, 20, 7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, 2, 1.5, 7);
    ctx.fillRect(-4, 5, 7, 1.5);
    ctx.fillStyle = '#00796B';
    ctx.fillRect(-10, -12, 20, 13);
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(-12, 18, 6, 3);
    ctx.fillStyle = '#616161';
    ctx.fillRect(6, 18, 6, 3);
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(-5, -7, 10, 5);
  } else {
    // 드론
    const big = heavy ? 1.5 : 1;
    ctx.scale(big, big);
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 2;
    for (const sx of [-14, 14]) {
      ctx.beginPath();
      ctx.ellipse(sx, -8, 9, 2.5 + Math.abs(Math.sin(t * 40)) * 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#37474F';
    rr(ctx, -12, -8, 24, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#FF1744';
    circle(ctx, 0, -1, 3.5 + Math.sin(t * 10) * 0.6);
    if (heavy) {
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(-8, 7, 16, 10);
    }
  }
  ctx.filter = 'none';
  ctx.restore();
  if (m.max > 3 && m.hp < m.max) drawMobHp(ctx, m);
}

function drawMobHp(ctx, m) {
  {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(m.x - 14, m.y - m.r - 10, 28, 3);
    ctx.fillStyle = '#FF5252';
    ctx.fillRect(m.x - 14, m.y - m.r - 10, 28 * Math.max(0, m.hp / m.max), 3);
  }
}

function drawBoss(ctx, b, t) {
  const alpha = b.dead ? Math.max(0, 1 - b.deathT / 2.2) : 1;
  const jx = b.dead ? (Math.floor(b.deathT * 30) % 2 ? U : -U) : 0;
  const flash = b.flashT > 0;
  if (b.key === 'castle') {
    drawSprite(ctx, castleSprite(), b.x + jx, b.y, flash, alpha);
  } else if (b.key === 'zero') {
    drawSprite(ctx, zeroSprite(b.rage), b.x + jx, b.y, flash, alpha);
    // 개틀링 총구 화염
    if (!b.dead && Math.floor(t * 20) % 2) {
      ctx.fillStyle = 'rgba(255,145,0,0.85)';
      ctx.fillRect(b.x - 7.5, b.y + 42.5, 15, 7.5);
      ctx.fillStyle = 'rgba(255,235,59,0.9)';
      ctx.fillRect(b.x - 2.5, b.y + 45, 5, 7.5);
    }
  } else if (b.key === 'killer') {
    const dashing = b.dash && b.dash.st === 'go';
    // 헤드라이트 불빛 (아래 = 플레이어 방향)
    if (!b.dead && (b.rage || (b.dash && b.dash.st !== 'back'))) {
      ctx.fillStyle = 'rgba(255,241,118,0.22)';
      for (const sx of [-24, 14]) {
        ctx.beginPath();
        ctx.moveTo(b.x + sx, b.y + 44);
        ctx.lineTo(b.x + sx + 10, b.y + 44);
        ctx.lineTo(b.x + sx + 30, b.y + (dashing ? 170 : 120));
        ctx.lineTo(b.x + sx - 20, b.y + (dashing ? 170 : 120));
        ctx.fill();
      }
    }
    // 돌진 잔상
    if (dashing) {
      drawSprite(ctx, killerSprite(b.rage), b.x, b.y - 30, false, 0.3);
    }
    drawSprite(ctx, killerSprite(b.rage), b.x + jx, b.y, flash, alpha);
  } else {
    const rage = b.mode === 'rage' || b.mode === 'second' || b.loopRage;
    // 제트 불꽃
    ctx.fillStyle = rage ? 'rgba(255,23,68,0.7)' : 'rgba(0,229,255,0.7)';
    const fl = Math.floor(t * 16) % 2 ? 10 : 5;
    ctx.fillRect(b.x - 15, b.y + 50, 10, fl);
    ctx.fillRect(b.x + 2.5, b.y + 50, 10, fl);
    drawSprite(ctx, kingSprite(rage), b.x + jx, b.y, flash, alpha);
    if (b.shield > 0) {
      ctx.strokeStyle = `rgba(24,255,255,${0.5 + Math.sin(t * 12) * 0.3})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i * Math.PI) / 3 + t;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](b.x + Math.cos(a) * 66, b.y + Math.sin(a) * 66);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(24,255,255,0.1)';
      circle(ctx, b.x, b.y, 64);
    }
  }
}

// 킬러조 돌진 예고: 차 폭만큼 아래로 깜빡이는 주황 경고 띠
function drawDashWarn(ctx, b, t) {
  const d = b.dash, k = d.t / d.warn, half = b.w / 2 + 6;
  ctx.fillStyle = `rgba(255,109,0,${0.12 + 0.18 * k + (Math.floor(t * (6 + k * 10)) % 2) * 0.1})`;
  ctx.fillRect(d.x - half, b.y, half * 2, H - b.y);
  ctx.strokeStyle = 'rgba(255,214,0,0.95)';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(d.x - half, b.y, half * 2, H - b.y + 4);
  ctx.setLineDash([]);
}

function drawLaser(ctx, lz, t, py) {
  const active = lz.t >= lz.warn;
  for (const [a, b] of lz.ranges) {
    if (!active) {
      // 예고: 깜빡이는 경고 영역
      const k = lz.t / lz.warn;
      ctx.fillStyle = `rgba(255,23,68,${0.12 + 0.18 * k + (Math.floor(t * (6 + k * 10)) % 2) * 0.1})`;
      ctx.fillRect(a, 0, b - a, H);
      ctx.strokeStyle = 'rgba(255,23,68,0.9)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(a + 1, -2, b - a - 2, H + 4);
      ctx.setLineDash([]);
    } else {
      const g = ctx.createLinearGradient(a, 0, b, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.5, lz.final ? 'rgba(255,23,68,0.95)' : 'rgba(224,64,251,0.92)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(a, 0, b - a, H);
    }
  }
}

function drawLaserLabel(ctx, lz, py) {
  const active = lz.t >= lz.warn;
  if (!active) {
    ctx.font = `700 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    if (lz.gap) {
      const cx = (lz.gap[0] + lz.gap[1]) / 2;
      ctx.fillStyle = 'rgba(105,240,174,0.25)';
      ctx.fillRect(lz.gap[0], 0, lz.gap[1] - lz.gap[0], H);
      ctx.fillStyle = '#69F0AE';
      ctx.fillText('▼ 안전 ▼', cx, clamp(py - 70, 120, H - 60));
    } else {
      ctx.fillText('피할 곳이 없다…', W / 2, H / 2);
    }
  }
}

// 도트 하트
const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function drawPixelHeart(ctx, x, y, px, filled) {
  HEART.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== 'X') continue;
      ctx.fillStyle = filled ? (r === 1 && c === 1 ? '#FFCDD2' : '#E53935') : '#424242';
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  });
}

function drawHud(ctx, s, t) {
  const p = s.p;
  ctx.textAlign = 'left';
  ctx.font = `700 18px ${FONT}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  const sc = Math.floor(s.score).toLocaleString('ko-KR');
  // 초상화 (콘셉트 이미지의 좌상단 HERO 칸)
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(8, 8, 36, 36);
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(10, 10, 32, 32);
  const hero = s.heroLv > 0 ? HEROES[s.heroLv - 1] : null;
  if (hero) { ctx.fillStyle = hero.color; ctx.fillRect(10, 10, 32, 32); drawAwakenFace(ctx, hero.key, 11, 11, 30); }
  else {
    const face = heroFace(tierOf(p.power));
    if (face) { ctx.imageSmoothingEnabled = false; ctx.drawImage(face.img, 11, 11, 30, 30); }
  }
  ctx.strokeText(sc, 52, 28);
  ctx.fillStyle = '#FFD166';
  ctx.fillText(sc, 52, 28);
  ctx.font = `700 11px ${FONT}`;
  if (s.stage >= 2) ctx.strokeText(STAGES[s.stage].name, 52, 42);
  ctx.fillStyle = s.stage === 3 ? '#B2EBF2' : s.stage === 2 ? '#FFFFFF' : '#3E2723';
  ctx.fillText(STAGES[s.stage].name, 52, 42);
  if (s.loop) {
    // 🔥 어려움 모드 뱃지
    const txt = `🔥 어려움 모드 (${s.loop}회차 루프)`;
    ctx.font = `700 11px ${FONT}`;
    const tw = ctx.measureText(txt).width;
    ctx.fillStyle = `rgba(183,28,28,${0.75 + Math.sin(t * 4) * 0.15})`;
    const yy = s.boss ? 70 : 50;
    rr(ctx, 8, yy, tw + 12, 17, 4);
    ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.fillText(txt, 14, yy + 12.5);
  }
  if (hero) {
    // 🦸 영웅 도감: 현재 영웅 이름 + 필살기 쿨타임 게이지
    const yy = (s.boss ? 70 : 50) + (s.loop ? 20 : 0), bw = 150;
    const ready = s.heroCd <= 0, k = ready ? 1 : 1 - s.heroCd / HERO_CD;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    rr(ctx, 8, yy, bw + 12, 31, 5);
    ctx.fill();
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 1.5;
    rr(ctx, 8, yy, bw + 12, 31, 5);
    ctx.stroke();
    ctx.font = `700 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = hero.color;
    ctx.fillText(`${hero.icon} ${hero.name}`, 14, yy + 12.5);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#B0BEC5';
    ctx.font = `700 9px ${FONT}`;
    ctx.fillText(`영웅 ${s.heroLv}/${HERO_COUNT}`, bw + 14, yy + 12);
    ctx.fillStyle = '#263238';
    rr(ctx, 14, yy + 17, bw, 10, 4);
    ctx.fill();
    ctx.fillStyle = ready ? (Math.floor(t * 6) % 2 ? '#FFD166' : hero.color) : '#78909C';
    rr(ctx, 14, yy + 17, Math.max(4, bw * k), 10, 4);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `700 8px ${FONT}`;
    ctx.fillStyle = ready ? '#1A1220' : '#fff';
    ctx.fillText(ready ? `${hero.ult} READY · Space` : `${hero.ult} ${s.heroCd.toFixed(1)}s`, 14 + bw / 2, yy + 25);
    ctx.textAlign = 'left';
  }
  // 체력
  ctx.textAlign = 'right';
  ctx.font = '16px sans-serif';
  for (let i = 0; i < MAX_HP; i++) drawPixelHeart(ctx, W - 34 - i * 26, 12, 3, i < p.hp);
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = s.stage >= 2 ? '#FFD166' : '#BF360C';
  if (s.stage >= 2) ctx.strokeText(`💥 필살기 ×${s.bombs}`, W - 10, 46);
  ctx.fillText(`💥 필살기 ×${s.bombs}`, W - 10, 46);
  // 활성 버프
  const active = Object.entries(s.buffs).filter(([, v]) => v > 0);
  active.forEach(([k, v], i) => {
    const x = W - 22 - i * 34, y = s.boss ? 88 : 70;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    circle(ctx, x, y, 14);
    ctx.strokeStyle = POWERUPS[k].color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, v / POWERUPS[k].sec));
    ctx.stroke();
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUPS[k].icon, x, y + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'right';
  });
  // 보스 체력
  const b = s.boss;
  if (b && !b.entering) {
    const y = 52;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, 10, y, W - 20, 14, 7);
    ctx.fill();
    const k = b.dead ? 0 : b.hp / b.max;
    if (b.reso && !b.dead) {
      // 🔥 각성 공명: 불타는 체력 바 테두리
      for (let x = 12; x < W - 12; x += 7) {
        const fh = 3 + Math.abs(Math.sin(t * 13 + x * 0.7)) * 5;
        ctx.fillStyle = (x / 7) % 2 < 1 ? '#FF6D00' : '#FFD600';
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 1);
        ctx.lineTo(x, y - fh);
        ctx.lineTo(x + 4, y + 1);
        ctx.fill();
      }
      ctx.strokeStyle = Math.floor(t * 10) % 2 ? '#FF3D00' : '#FFAB00';
      ctx.lineWidth = 2.5;
      rr(ctx, 9, y - 1, W - 18, 16, 8);
      ctx.stroke();
    }
    ctx.fillStyle = b.key === 'king' ? (b.mode === 'rage' || b.loopRage ? '#FF1744' : '#E040FB') : b.rage ? '#FF5252' : '#FFA726';
    rr(ctx, 12, y + 2, Math.max(0, (W - 24) * k), 10, 5);
    ctx.fill();
    if (b.shield > 0) {
      ctx.fillStyle = `rgba(24,255,255,${0.4 + Math.sin(t * 10) * 0.2})`;
      rr(ctx, 12, y + 2, W - 24, 10, 5);
      ctx.fill();
    }
    ctx.font = `700 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    const hpTxt = b.key === 'king' && b.mode === 'rage' ? '??? 분노 각성 ???' : `${Math.ceil(Math.max(0, b.hp))} / ${Math.ceil(b.max)}`;
    ctx.fillText(`${b.reso ? '🔥공명 ' : ''}${b.name} · ${hpTxt}`, W / 2, y + 10.5);
  }
  // 무기 · 경험치
  const by = H - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(ctx, 10, by, W - 20, 14, 7);
  ctx.fill();
  const need = xpNeed(p.power);
  ctx.fillStyle = p.power >= MAX_POWER ? '#FFD166' : '#69F0AE';
  rr(ctx, 12, by + 2, (W - 24) * (p.power >= MAX_POWER ? 1 : clamp(p.xp / need, 0, 1)), 10, 5);
  ctx.fill();
  ctx.font = `700 10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${hero ? `${hero.icon}${hero.weapon} + ` : ''}Lv.${p.power + 1} ${weaponLabel(p.power)}${p.power >= MAX_POWER ? ' · MAX' : ''}`, W / 2, by + 10.5, W - 30);
  if (s.fever > 0) {
    ctx.fillStyle = '#FFE082';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ 아슬아슬 피버 ${s.fever.toFixed(1)}s`, 12, by - 6);
  }
  if (s.auto) {
    ctx.textAlign = 'center';
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#69F0AE' : '#B9F6CA';
    ctx.fillText(`🤖 개발자 도움 중 ${Math.ceil(s.autoLeft)}초`, W / 2, by - 6);
  }
  if (s.combo > 1) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFE082';
    ctx.fillText(`회피 콤보 ×${s.combo}`, W - 12, by - 6);
  }
  // 배너
  if (s.banner) {
    const bn = s.banner, k = Math.min(1, bn.t / 0.25), out = bn.t > bn.dur - 0.3 ? (bn.dur - bn.t) / 0.3 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, out);
    ctx.translate(W / 2, H * 0.36);
    ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    ctx.fillStyle = 'rgba(20,10,10,0.82)';
    rr(ctx, -W / 2 + 20, -34, W - 40, bn.sub ? 66 : 48, 12);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `700 22px ${FONT}`;
    ctx.fillStyle = '#FFD166';
    ctx.fillText(bn.text, 0, -4);
    if (bn.sub) {
      ctx.font = `700 12px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(bn.sub, 0, 20);
    }
    ctx.restore();
  }
}

// =====================================================================
// 🦸 영웅 필살기 · 초각성 연출
// =====================================================================
// 월드 레이어(도트): 거북선 · 물벽 · 비행기 · 레이저 등 큰 그림
function drawUltFx(ctx, fx, t, s) {
  const k = fx.t / fx.dur, fade = Math.min(1, (fx.dur - fx.t) / 0.3);
  ctx.save();
  if (fx.key === 'yi') drawTurtleShip(ctx, W / 2, fx.y, t);
  else if (fx.key === 'kang') {
    // 귀주대첩 수공: 둑을 터뜨린 거대한 물벽
    const g = ctx.createLinearGradient(0, fx.y, 0, fx.y + 160);
    g.addColorStop(0, 'rgba(1,87,155,0.85)');
    g.addColorStop(1, 'rgba(1,87,155,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, fx.y, W, 160);
    ctx.fillStyle = 'rgba(64,196,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(0, fx.y + 20);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, fx.y - 14 + Math.sin(x / 18 + t * 14) * 10);
    ctx.lineTo(W, fx.y + 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let x = 4; x < W; x += 16) circle(ctx, x, fx.y - 18 + Math.sin(x / 18 + t * 14) * 10, 3);
  } else if (fx.key === 'ahn') drawBiplane(ctx, fx.x, 112, t);
  else if (fx.key === 'sejong') {
    ctx.globalAlpha = fade;
    const w = Math.min(1, fx.t * 4) * (W - 60), x = W / 2 - w / 2, y = H * 0.2;
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(x, y, w, 110);
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(x, y + 104, w, 6);
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(x - 8, y - 6, 10, 122);
    ctx.fillRect(x + w - 2, y - 6, 10, 122);
  } else if (fx.key === 'jang') {
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(64,196,255,0.16)';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.36, r = 64;
    ctx.fillStyle = 'rgba(255,248,225,0.8)';
    circle(ctx, cx, cy, r);
    ctx.strokeStyle = '#C49000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#5D4037';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillRect(cx + Math.cos(a) * (r - 10) - 2, cy + Math.sin(a) * (r - 10) - 2, 4, 4); }
    ctx.strokeStyle = '#3E2723';
    for (const [len, sp, lw] of [[r * 0.55, -1.2, 5], [r * 0.8, -9, 3]]) {
      const a = -Math.PI / 2 + fx.t * sp;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  } else if (fx.key === 'heo') {
    ctx.globalAlpha = fade;
    ctx.strokeStyle = 'rgba(105,240,174,0.8)';
    ctx.lineWidth = 10 * (1 - k) + 2;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, 30 + k * 520, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(105,240,174,0.15)';
    ctx.fillRect(0, 0, W, H);
  } else if (fx.key === 'gungye') {
    if (fx.t < 0.45) {
      // 하늘에서 열리는 거대한 눈
      const open = Math.min(1, fx.t / 0.35);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FFF8E1';
      ctx.beginPath();
      ctx.ellipse(W / 2, 110, 120, 44 * open + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD600';
      circle(ctx, W / 2, 110, 30 * open);
      ctx.fillStyle = '#000';
      circle(ctx, W / 2, 110, 13 * open);
    } else {
      // 화면 전체를 관통하는 금빛 관심법 레이저
      const a = Math.min(1, (1.5 - fx.t) / 0.25, (fx.t - 0.45) / 0.08);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(255,214,0,${0.35 * a})`);
      g.addColorStop(0.5, `rgba(255,253,231,${0.9 * a})`);
      g.addColorStop(1, `rgba(255,214,0,${0.35 * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`;
      ctx.fillRect(W / 2 - 40 + Math.sin(t * 50) * 6, 0, 80, H);
    }
  } else if (fx.key === 'hong') {
    for (const sl of fx.slashes) {
      const a = Math.max(0, 1 - sl.t / 0.3);
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(197,202,233,${a * 0.6})`;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(0, sl.y0);
      ctx.lineTo(W, sl.y1);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (fx.key === 'kim') {
    ctx.fillStyle = `rgba(255,112,67,${0.12 * fade})`;
    ctx.fillRect(0, 0, W, H);
  } else if (fx.key === 'jin') {
    const cx = W / 2, cy = H * 0.42;
    if (fx.t < 0.45) {
      ctx.fillStyle = `rgba(0,0,0,${0.3 + fx.t})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      const q = (fx.t - 0.45) / 1.2;
      if (q < 1) {
        ctx.strokeStyle = `rgba(255,255,255,${1 - q})`;
        ctx.lineWidth = 16 * (1 - q) + 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + q * 520, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// 🐢 거북선: 용머리 · 철갑 등판의 쇠못 · 양옆 노 · 포구 화염 (위로 돌진)
function drawTurtleShip(ctx, x, y, t) {
  // 물보라 항적
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 8; i++) circle(ctx, x + Math.sin(t * 20 + i) * 30, y + 70 + i * 18, 14 - i);
  // 노
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const oy = y - 10 + i * 14, sw = Math.sin(t * 16 + i * 0.6) * 10;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * 54, oy);
      ctx.lineTo(x + sx * 82, oy + sw);
      ctx.stroke();
    }
  }
  // 선체
  ctx.fillStyle = '#4E342E';
  rr(ctx, x - 58, y - 34, 116, 96, 26);
  ctx.fill();
  ctx.fillStyle = '#795548';
  rr(ctx, x - 54, y - 30, 108, 88, 22);
  ctx.fill();
  // 철갑 등판 (육각 무늬 + 쇠못)
  ctx.fillStyle = '#33691E';
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 46, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#558B2F';
  for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
    if (Math.abs(r) + Math.abs(c) > 3) continue;
    rr(ctx, x + c * 16 - 6 + (r % 2 ? 8 : 0), y + 12 + r * 15 - 6, 12, 11, 3);
    ctx.fill();
  }
  ctx.fillStyle = '#ECEFF1';
  for (let r = -2; r <= 2; r++) for (let c = -3; c <= 3; c++) {
    const sx = x + c * 13 + (r % 2 ? 6 : 0), sy = y + 12 + r * 15;
    if (((sx - x) / 44) ** 2 + ((sy - y - 12) / 40) ** 2 > 1) continue;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 5);
    ctx.lineTo(sx - 2.5, sy + 1);
    ctx.lineTo(sx + 2.5, sy + 1);
    ctx.fill();
  }
  // 포구 + 화염
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const py = y - 6 + i * 22;
    ctx.fillStyle = '#212121';
    ctx.fillRect(x + sx * 56 - 4, py, 8, 7);
    if (Math.floor(t * 12 + i) % 3 === 0) { ctx.fillStyle = '#FF6D00'; circle(ctx, x + sx * 66, py + 3, 7); ctx.fillStyle = '#FFEA00'; circle(ctx, x + sx * 64, py + 3, 3.5); }
  }
  // 용머리 (뱃머리)
  ctx.fillStyle = '#F9A825';
  rr(ctx, x - 16, y - 66, 32, 36, 10);
  ctx.fill();
  ctx.fillStyle = '#C62828';
  ctx.fillRect(x - 12, y - 46, 24, 8);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 10, y - 46, 4, 4);
  ctx.fillRect(x + 6, y - 46, 4, 4);
  ctx.fillStyle = '#212121';
  circle(ctx, x - 7, y - 58, 3);
  circle(ctx, x + 7, y - 58, 3);
  ctx.fillStyle = '#E65100';
  ctx.fillRect(x - 20, y - 70, 6, 10);
  ctx.fillRect(x + 14, y - 70, 6, 10);
  // 용 입에서 뿜는 연기
  ctx.fillStyle = 'rgba(158,158,158,0.7)';
  for (let i = 0; i < 4; i++) circle(ctx, x + Math.sin(t * 9 + i) * 8, y - 74 - i * 12, 9 + i * 2);
}

// ✈️ 안창남의 금강호 복엽기 (오른쪽으로 비행하며 폭탄 투하)
function drawBiplane(ctx, x, y, t) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 70, 50, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(x - 46, y - 3, 74, 14); // 동체
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 52, y - 12, 12, 14); // 꼬리
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(x - 18, y - 18, 34, 6); // 윗날개
  ctx.fillRect(x - 18, y + 14, 34, 6); // 아랫날개
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(x - 12, y - 12, 2, 26);
  ctx.fillRect(x + 10, y - 12, 2, 26);
  ctx.fillStyle = '#212121';
  ctx.fillRect(x + 28, y - 1, 6, 10);
  const pa = Math.abs(Math.sin(t * 60));
  ctx.fillStyle = 'rgba(236,239,241,0.8)';
  ctx.fillRect(x + 34, y + 4 - 16 * pa, 3, 32 * pa);
  ctx.fillStyle = '#C62828';
  circle(ctx, x - 20, y + 4, 4);
  // 떨어지는 폭탄
  ctx.fillStyle = '#263238';
  for (let i = 1; i <= 4; i++) circle(ctx, x - i * 26, y + 24 + i * i * 9, 4);
}

// UI 레이어: 필살기 대사·글자
function drawUltUi(ctx, fx, t) {
  const shout = (text, y, size, color, jit = 4) => {
    ctx.save();
    ctx.translate(W / 2 + (Math.random() - 0.5) * jit, y + (Math.random() - 0.5) * jit);
    const pop = Math.min(1, fx.t * 6);
    ctx.scale(0.5 + pop * 0.5, 0.5 + pop * 0.5);
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  };
  const a = Math.min(1, (fx.dur - fx.t) / 0.3);
  ctx.globalAlpha = Math.max(0, a);
  if (fx.key === 'sejong') {
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3E2723';
    ctx.fillText('훈 민 정 음', W / 2, H * 0.2 + 48);
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText('나랏말싸미 듕귁에 달아 문쭝와로 서르 사맛디 아니할쎄', W / 2, H * 0.2 + 82, W - 90);
  } else if (fx.key === 'jang') shout('⏱️ 자격루: 시간 정지!', H * 0.36 + 92, 18, '#B3E5FC', 0);
  else if (fx.key === 'heo') shout('📗 東醫寶鑑', H * 0.36, 26, '#69F0AE', 2);
  else if (fx.key === 'yi') shout('🐢 거북선 출격!', H * 0.22, 24, '#FF5252', 2);
  else if (fx.key === 'kang') shout('🌊 귀주대첩!', H * 0.22, 24, '#40C4FF', 2);
  else if (fx.key === 'ahn') shout('✈️ 떴다 보아라 안창남 비행기!', H * 0.34, 16, '#4FC3F7', 2);
  else if (fx.key === 'hong') shout('동에 번쩍! 서에 번쩍!', H * 0.3, 20, '#C5CAE9', 6);
  else if (fx.key === 'gungye') {
    shout('누구인가?', H * 0.34, 40, '#FFD600', 8);
    if (fx.t > 0.3) shout('지금 누가 기침 소리를 내었어?', H * 0.34 + 44, 15, '#fff', 3);
  } else if (fx.key === 'kim') shout('사딸라!', H * 0.34, 44, '#FF7043', 10);
  else if (fx.key === 'jin') {
    if (fx.t < 0.45) {
      ctx.font = `${Math.round(50 + fx.t * 80)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍣', W / 2, H * 0.42);
      ctx.textBaseline = 'alphabetic';
    }
    shout('초밥 밥알이 몇 개고?!', H * 0.22, 24, '#fff', 8);
  }
  ctx.globalAlpha = 1;
}

// 초각성 컷신: 시간 정지 + 화면 번쩍 + 위인 실루엣 → 정체 공개
function drawAwake(ctx, s, t) {
  const a = s.awake, h = HEROES[a.lv - 1], k = a.t / a.dur;
  const out = Math.min(1, (a.dur - a.t) / 0.25);
  ctx.save();
  ctx.globalAlpha = Math.max(0, out);
  ctx.fillStyle = 'rgba(8,4,16,0.78)';
  ctx.fillRect(0, 0, W, H);
  // 회전하는 집중선
  const cx = W / 2, cy = H * 0.4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a.t * 0.8);
  for (let i = 0; i < 24; i++) {
    ctx.rotate(Math.PI / 12);
    ctx.fillStyle = i % 2 ? `${h.color}55` : 'rgba(255,214,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, -520);
    ctx.lineTo(18, -520);
    ctx.fill();
  }
  ctx.restore();
  // 실루엣 → 0.45초 후 컬러 공개
  const sp = awakenSprite(h.key);
  if (sp) {
    const sc = 5 * (0.8 + Math.min(1, a.t * 3) * 0.2), w = sp.w * sc, hh = sp.h * sc;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.max(0, out) * 0.9;
    for (const [ox, oy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) ctx.drawImage(sp.flash, cx - w / 2 + ox, cy - hh / 2 + oy, w, hh);
    ctx.globalAlpha = Math.max(0, out);
    ctx.drawImage(a.t < 0.45 ? sp.flash : sp.img, cx - w / 2, cy - hh / 2, w, hh);
  }
  // "초각성!" 텍스트
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = '#FFE082';
  ctx.fillText(`⚡ ${(a.lv * HERO_STEP).toLocaleString('ko-KR')}점 돌파 · 영웅 초월 ${a.lv}/${HERO_COUNT}단계`, cx, H * 0.1);
  const pop = Math.min(1, a.t * 5);
  ctx.save();
  ctx.translate(cx + (a.t < 0.6 ? (Math.random() - 0.5) * 8 : 0), H * 0.17);
  ctx.scale(0.4 + pop * 0.6, 0.4 + pop * 0.6);
  ctx.font = `700 46px ${FONT}`;
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#000';
  ctx.strokeText('초각성!', 0, 0);
  const g = ctx.createLinearGradient(-110, 0, 110, 0);
  g.addColorStop(0, `hsl(${(t * 300) % 360},100%,65%)`);
  g.addColorStop(0.5, '#FFF59D');
  g.addColorStop(1, `hsl(${(t * 300 + 180) % 360},100%,65%)`);
  ctx.fillStyle = g;
  ctx.fillText('초각성!', 0, 0);
  ctx.restore();
  if (a.t > 0.45) {
    ctx.font = `700 30px ${FONT}`;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000';
    ctx.strokeText(`${h.icon} ${h.name}`, cx, H * 0.63);
    ctx.fillStyle = h.color;
    ctx.fillText(`${h.icon} ${h.name}`, cx, H * 0.63);
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(`${h.title} · 「${h.line}」`, cx, H * 0.68, W - 24);
    ctx.fillStyle = '#FFE082';
    ctx.fillText(`🔫 ${h.weapon}`, cx, H * 0.73, W - 24);
    ctx.fillText(`Space ▶ ${h.ult} (쿨타임 ${HERO_CD}초)`, cx, H * 0.77, W - 24);
    ctx.fillStyle = '#FF8A80';
    ctx.font = `700 11px ${FONT}`;
    ctx.fillText(`⚠ 적도 각성! 체력 ×${s.K.aw.hp.toFixed(2)} · 속도 ×${s.K.aw.spd.toFixed(2)} · 물량 ×${(1 / s.K.aw.spawn).toFixed(2)} · 👹엘리트 출현`, cx, H * 0.82, W - 16);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  // 시작 순간 하얀 섬광
  if (k < 0.2) { ctx.fillStyle = `rgba(255,255,255,${1 - k / 0.2})`; ctx.fillRect(0, 0, W, H); }
}
