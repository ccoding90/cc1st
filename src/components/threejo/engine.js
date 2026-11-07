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
const MAX_POWER = 11;       // 0~11, 3단계마다 무기 진화
const MAX_HP = 3;
const xpNeed = (p) => 6 + p * 4;
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

export const WEAPON_NAMES = ['활', '조총', '대포', '기관총'];
const WEAPONS = [
  { interval: 0.3, speed: 520, dmg: 1, r: 4, kind: 'arrow' },
  { interval: 0.2, speed: 700, dmg: 1.3, r: 3, kind: 'ball' },
  { interval: 0.42, speed: 430, dmg: 3.6, r: 7, kind: 'cannon', splash: 30 },
  { interval: 0.075, speed: 820, dmg: 1, r: 3, kind: 'mg' },
];
const tierOf = (p) => Math.min(3, Math.floor(p / 3));
const shotsOf = (p) => (tierOf(p) === 3 ? 3 + (p % 3) : 1 + (p % 3));
export const weaponLabel = (p) => `${p >= 10 ? '레이저 ' : ''}${WEAPON_NAMES[tierOf(p)]} ×${shotsOf(p)}`;

const STAGES = [
  { name: '1탄 · 조선 저잣거리', wave: 30, boss: 'castle', mob: { name: '포졸', hp: 2, speed: 80 }, heavy: { name: '세곡 수레', hp: 8 } },
  { name: '2탄 · 개화기 경성', wave: 32, boss: 'zero', mob: { name: '신식 군인', hp: 4, speed: 95 }, heavy: { name: '인력거', hp: 16 } },
  { name: '3탄 · 2077 판교', wave: 16, boss: 'king', mob: { name: '사이보그 병사', hp: 9, speed: 120 }, heavy: { name: '수송 드론', hp: 26 } },
];

const BOSSES = {
  castle: { name: '캐슬조', title: '조선 탐관오리', hp: 190, w: 72, h: 84 },
  zero: { name: '제로조', title: '개화기 군벌 장군', hp: 1100, w: 74, h: 84 },
  king: { name: '조철왕', title: '이 게임의 제작자', hp: 3200, w: 90, h: 92 },
};

import { U, drawSprite, heroSprite, heroFace, mobSprite, castleSprite, zeroSprite, kingSprite } from './sprites.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createGame(env) {
  const s = {
    time: 0, score: 0, stage: 0, phase: 'wave', phaseT: 0,
    p: { x: W / 2, y: PY, hp: MAX_HP, power: 0, xp: 0, inv: 1.5, fireT: 0, beamT: 0, alive: true, deadT: 0, tilt: 0 },
    bombs: 2, bombCd: 0, nova: null,
    auto: false, autoLeft: 0, helps: HELP_USES, autoUsed: false, autoT: 0, autoTarget: null, autoKingLine: false,
    buffs: { shield: 0, drone: 0, magnet: 0, fire: 0, slow: 0, star: 0 }, shieldHits: 0, droneT: 0, droneA: 0,
    fever: 0, grazes: 0, combo: 0, comboT: 0, bosses: 0,
    shots: [], bullets: [], mobs: [], items: [], lasers: [], parts: [], texts: [], timers: [],
    boss: null, banner: null, shake: 0, flash: 0, scroll: 0,
    spawnT: 1.2, heavyT: 6, killer: '', ended: false, beams: [],
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
  const fire = (x, y, ang, speed, o = {}) => s.bullets.push({
    x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: o.r || 5, kind: o.kind || 'orb',
    color: o.color || '#ff5252', src: o.src, grazed: false, homing: o.homing || 0, acc: o.acc || 0, t: 0,
  });
  const aim = (x, y) => Math.atan2(s.p.y - y, s.p.x - x);
  const setBombs = (n) => { s.bombs = clamp(n, 0, MAX_BOMBS); env.bombs && env.bombs(s.bombs); };
  const addScore = (v) => { s.score += v; };

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
    popText(p.x, p.y - 50, evolved ? `무기 진화! ${WEAPON_NAMES[tierOf(p.power)]}` : `LEVEL UP! ${weaponLabel(p.power)}`, evolved ? '#FFD166' : '#9BE7FF', evolved ? 18 : 14, 1.3);
    burst(p.x, p.y, evolved ? 50 : 18, ['#FFD166', '#fff', '#9BE7FF'], [80, 260], 0.8);
    if (evolved) { s.flash = 0.35; play('fanfare'); } else play('ding');
  }

  // ---------- 플레이어 ----------
  // 방어막·무적 별이 있으면 막고 true
  function hurtOrBlock(src) {
    if (s.buffs.star > 0) return true;
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
    p.hp--;
    s.shake = Math.max(s.shake, 14);
    s.flash = 0.25;
    play('bump');
    burst(p.x, p.y, 40, ['#ff5252', '#fff', '#FFD166'], [80, 280], 0.7);
    s.combo = 0;
    // 피격 시 무기 한 단계 강등 (대포 → 조총)
    const before = tierOf(p.power);
    if (p.power >= 3) {
      p.power -= 3;
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
    if (p.fireT <= 0) {
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
    // 레이저 (power 10+): 관통 빔
    if (p.power >= 10) {
      p.beamT -= dt;
      if (p.beamT <= 0) {
        p.beamT = 0.12;
        const width = p.power >= 11 ? 14 : 9;
        s.beams.push({ x: p.x, w: width, life: 0.1 });
        hitColumn(p.x, width, p.power >= 11 ? 2.4 : 1.6);
      }
    }
  }

  // ---------- 적 ----------
  function spawnMob(x, y, kind, o = {}) {
    const st = STAGES[s.stage];
    const heavy = kind === 'heavy';
    const base = heavy ? st.heavy : st.mob;
    s.mobs.push({
      x, y, x0: x, kind, name: base.name, hp: base.hp, max: base.hp, r: heavy ? 22 : 14,
      vy: o.vy ?? (heavy ? 45 : st.mob.speed), vx: o.vx || 0, zig: o.zig || 0, t: rand(0, 3),
      fireT: rand(1.2, 2.6), hover: o.hover || 0, stage: s.stage, flashT: 0,
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
    if (st === 2) {
      // 드론은 내려와 잠시 머물며 사격
      s.mobs.forEach((m) => { if (m.stage === 2 && !m.hover && m.kind === 'mob') m.hover = rand(80, 220); });
    }
  }
  function mobShoot(m) {
    const src = m.name;
    if (m.stage === 0) fire(m.x, m.y, aim(m.x, m.y) + rand(-0.15, 0.15), 140, { src, kind: 'orb', color: '#E53935', r: 5 });
    else if (m.stage === 1) {
      const a = aim(m.x, m.y);
      fire(m.x, m.y, a - 0.12, 175, { src, kind: 'rice', color: '#ff7043' });
      fire(m.x, m.y, a + 0.12, 175, { src, kind: 'rice', color: '#ff7043' });
    } else {
      for (let i = 0; i < 3; i++) later(i * 0.12, () => { if (m.hp > 0) fire(m.x, m.y, aim(m.x, m.y), 230, { src, kind: 'orb', color: '#00E5FF', r: 4 }); });
    }
  }
  function killMob(m) {
    const heavy = m.kind === 'heavy';
    addScore((heavy ? 60 : 15) * (m.stage + 1));
    burst(m.x, m.y, heavy ? 36 : 14, m.stage === 2 ? ['#00E5FF', '#fff', '#90A4AE'] : ['#FFD166', '#ff7043', '#fff'], [60, 220], 0.6);
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
      key, ...d, max: d.hp, x: W / 2, y: -100, ty: key === 'king' ? 135 : 128, t: 0, entering: true,
      atkT: 2, moveT: 0, tx: W / 2, rage: false, mode: 'normal', modeT: 0, shield: 0, floorT: 0, flashT: 0,
      deathT: 0, dead: false, lastAtk: '',
    };
    s.shake = 22;
    play('doom');
    banner(`⚠️ ${d.name} 등장!`, d.title, 2.4);
  }

  function bossAttack(b) {
    const src = b.name;
    if (b.key === 'castle') {
      const atk = pick(['fan', 'aimed', 'tax'].filter((a) => a !== b.lastAtk));
      b.lastAtk = atk;
      if (atk === 'fan') {
        for (let i = 0; i < 7; i++) fire(b.x, b.y + 30, Math.PI / 2 + (i - 3) * 0.15, 140, { src, kind: 'orb', color: '#D50000', r: 6 });
      } else if (atk === 'aimed') {
        for (let i = 0; i < 3; i++) later(i * 0.18, () => fire(b.x, b.y + 30, aim(b.x, b.y + 30), 170, { src, kind: 'orb', color: '#D50000', r: 6 }));
      } else {
        popText(b.x, b.y + 50, '세금 징수!', '#FFD166', 14);
        for (let i = 0; i < 8; i++) later(i * 0.12, () => fire(rand(20, W - 20), -10, Math.PI / 2, 120, { src, kind: 'orb', color: '#D50000', r: 6 }));
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
            fire(b.x, b.y + 20, a, 150 * k, { src, kind: 'rice', color: '#B388FF' });
            fire(b.x, b.y + 20, a + Math.PI, 150 * k, { src, kind: 'rice', color: '#B388FF' });
          });
        }
        return 2.1;
      }
      if (atk === 'shotgun') {
        for (let r = 0; r < 3; r++) {
          later(r * 0.35, () => {
            const a = aim(b.x, b.y + 30);
            for (let i = -2; i <= 2; i++) fire(b.x, b.y + 30, a + i * 0.16, 230 * k, { src, kind: 'orb', color: '#ff5252' });
          });
        }
        return 1.6;
      }
      if (atk === 'wall') {
        for (let r = 0; r < 2; r++) {
          later(r * 0.9, () => {
            const gap = rand(40, W - 110);
            for (let x = 10; x < W; x += 24) if (x < gap || x > gap + 74) fire(x, -10, Math.PI / 2, 130 * k, { src, kind: 'orb', color: '#F50057', r: 6 });
          });
        }
        return 2;
      }
      // 지팡이 휘두르기: 좌→우로 훑는 연속탄
      const dirL = Math.random() < 0.5;
      for (let i = 0; i < 16; i++) {
        later(i * 0.05, () => {
          const a = Math.PI / 2 + (dirL ? 1 : -1) * (0.9 - i * 0.12);
          fire(b.x, b.y + 30, a, 200 * k, { src, kind: 'rice', color: '#ff7043' });
        });
      }
      return 1.4;
    }
    // 조철왕
    const hard = b.mode === 'floor' ? 2 : b.max * 0.5 > b.hp ? 1 : 0;
    const pool = ['curtain', 'ring', 'missile', 'rain'];
    if (hard >= 1) pool.push('curtain', 'double');
    const atk = pick(pool.filter((a) => a !== b.lastAtk));
    b.lastAtk = atk;
    if (atk === 'curtain' || atk === 'double') {
      const gapW = [86, 70, 56][hard];
      const warn = [1.3, 1.15, 1][hard];
      laserCurtain(gapW, warn, src);
      if (atk === 'double') later(warn + 0.5, () => laserCurtain(gapW, warn, src));
      // 레이저 예고 중에도 조준탄으로 압박
      for (let i = 0; i < 3; i++) later(0.3 + i * 0.3, () => fire(b.x, b.y + 30, aim(b.x, b.y + 30), 200, { src, kind: 'orb', color: '#00E5FF', r: 4 }));
      return atk === 'double' ? 3.4 : 2.2;
    }
    if (atk === 'ring') {
      for (let r = 0; r < 3; r++) {
        later(r * 0.4, () => {
          const n = 22 + hard * 4, off = r * 0.14;
          for (let i = 0; i < n; i++) fire(b.x, b.y + 10, off + (i * Math.PI * 2) / n, 140 + hard * 20, { src, kind: 'orb', color: '#E040FB', r: 5 });
        });
      }
      return 1.8;
    }
    if (atk === 'missile') {
      for (let i = 0; i < 4 + hard; i++) {
        later(i * 0.2, () => fire(b.x + (i % 2 ? 40 : -40), b.y + 20, Math.PI / 2 + rand(-0.8, 0.8), 150, { src, kind: 'missile', color: '#FF1744', r: 5, homing: 1.4 }));
      }
      return 1.9;
    }
    for (let i = 0; i < 22 + hard * 8; i++) later(i * 0.07, () => fire(rand(10, W - 10), -10, Math.PI / 2 + rand(-0.1, 0.1), rand(160, 230), { src, kind: 'rice', color: '#18FFFF' }));
    return 1.9;
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
      if (b.mode === 'floor') {
        b.flashT = 0.05;
        if (Math.random() < 0.08) popText(x + rand(-14, 14), y, pick(['MISS', '튕겨냄!', '무효']), '#ff8a80', 11, 0.5);
        addScore(0.2);
        return true;
      }
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
      } else if (b.mode === 'second' && b.hp <= 1) {
        // 2차: 체력 1에서 고정
        b.hp = 1;
        b.mode = 'floor';
        b.floorT = 0;
        s.shake = 20;
        banner('❗ HP 1 고정', '조철왕: "개발자는 체력 0이 안 돼요"', 2.4);
        play('alarm');
      }
      if (b.hp < 1) b.hp = 1;
      return true;
    }
    if (!b.rage && b.hp <= b.max * 0.5) {
      b.rage = true;
      s.shake = 14;
      banner(`💢 ${b.name} 분노!`, b.key === 'zero' ? '움직임이 빨라진다' : '공격이 거세진다', 1.6);
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
    addScore(b.key === 'castle' ? 1000 : 3000);
    s.shake = 26;
    s.flash = 0.7;
    play('explosion');
    later(0.4, () => play('fanfare'));
    banner(`🎉 ${b.name} 격파!`, `+${b.key === 'castle' ? 1000 : 3000}점`, 2.2);
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
    } else {
      b.x = W / 2 + Math.sin(b.t * 0.45) * 90 + Math.sin(b.t * 1.7) * 18;
      b.y = b.ty + Math.sin(b.t * 1.1) * 10;
      addScore(dt * 10); // 조철왕 앞에서 버틴 시간 점수
      kingPhases(b, dt);
    }
    b.atkT -= dt;
    if (b.atkT <= 0 && s.p.alive && b.mode !== 'final') b.atkT = bossAttack(b) * (b.key === 'zero' && b.rage ? 0.8 : 1);
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
    if (b.mode === 'floor') {
      b.floorT += dt;
      if (b.floorT > 9) finalAttack(b);
    }
    // 화력이 부족해도 일정 시간 뒤 최종 오의
    if (b.t > 110 && b.mode !== 'final') finalAttack(b);
  }
  function finalAttack(b) {
    b.mode = 'final';
    s.bullets.length = 0;
    s.timers.length = 0;
    s.lasers.length = 0;
    banner('☠️ 최종 오의 · 서비스 종료', '조철왕: "내가 만든 게임에서 날 이길 순 없지!"', 2.6);
    s.shake = 18;
    play('alarm');
    s.lasers.push({ ranges: [[0, W]], t: 0, warn: 2.4, fire: 1.2, src: b.name, final: true });
  }

  function nextStage() {
    s.stage++;
    s.phase = 'wave';
    s.phaseT = 0;
    s.spawnT = 2;
    s.heavyT = 4;
    banner(STAGES[s.stage].name, s.stage === 2 ? '최종 보스가 기다린다…' : '무기를 키워라!', 2.2);
  }

  // ---------- 메인 업데이트 ----------
  function update(dt, input = {}) {
    s.time += dt;
    s.scroll += dt * (60 + s.stage * 30);
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
        env.over && env.over({ score: Math.floor(s.score), killer: s.killer, stage: s.stage, time: s.time, grazes: s.grazes, bosses: s.bosses, power: p.power, autoUsed: s.autoUsed });
      }
    }
    s.fever = Math.max(0, s.fever - dt);
    s.bombCd = Math.max(0, s.bombCd - dt);
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
      if (s.spawnT <= 0) { spawnFormation(); s.spawnT = rand(1.5, 2.3) * (s.stage === 0 ? 1.1 : 0.9); }
      s.heavyT -= dt;
      if (s.heavyT <= 0) { spawnMob(rand(50, W - 50), -30, 'heavy'); s.heavyT = 7; }
      if (s.phaseT > st.wave) { s.phase = 'warn'; s.phaseT = 0; banner('⚠️ WARNING', `${BOSSES[st.boss].name} 접근 중`, 2); play('alarm'); }
    } else if (s.phase === 'warn') {
      if (s.phaseT > 2.4) { s.phase = 'boss'; s.phaseT = 0; spawnBoss(st.boss); }
    }

    // 플레이어 탄
    for (const sh of s.shots) { sh.x += sh.vx * dt; sh.y += sh.vy * dt; }
    s.shots = s.shots.filter((sh) => !sh.dead && sh.y > -20 && sh.x > -20 && sh.x < W + 20);
    s.beams = s.beams.filter((bm) => (bm.life -= dt) > 0);

    // 잡몹
    for (const m of s.mobs) {
      m.t += dt;
      m.flashT = Math.max(0, m.flashT - dt);
      if (m.hover && m.y >= m.hover) {
        m.x += Math.sin(m.t * 1.5) * 60 * dt;
        if (m.t > 7) m.hover = 0; // 머물다 퇴장
      } else {
        m.y += m.vy * dt;
      }
      m.x += m.vx * dt;
      if (m.zig) m.x = m.x0 + Math.sin(m.t * 2.4) * m.zig;
      m.fireT -= dt;
      if (m.fireT <= 0 && m.y > 20 && m.y < p.y - 100 && p.alive) {
        m.fireT = m.kind === 'heavy' ? 99 : rand(1.8, 3.2) * (s.stage === 0 ? 1.4 : 1);
        if (m.kind !== 'heavy' && Math.random() < (s.stage === 0 ? 0.55 : 0.8)) mobShoot(m);
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
        m.hp -= sh.dmg;
        m.flashT = 0.05;
        sh.dead = true;
        if (sh.splash) splash(sh);
        break;
      }
      const b = s.boss;
      if (!sh.dead && b && Math.abs(sh.x - b.x) < b.w / 2 && Math.abs(sh.y - b.y) < b.h / 2) {
        if (damageBoss(b, sh.dmg, sh.x, sh.y)) {
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
      bl.x += bl.vx * bdt;
      bl.y += bl.vy * bdt;
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
      if (active && p.alive && lz.ranges.some(([a, b]) => p.x > a + 3 && p.x < b - 3)) {
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
  }

  // ---------- 개발자 도움: 자동 플레이 AI ----------
  // 후보 위치마다 '앞으로 0.6초 동안 탄·적·레이저에 닿을 위험'을 계산해 가장 안전한 곳으로 이동,
  // 안전하면 아이템을 줍고 적 밑으로 파고들어 조준. 탄이 몰리면 필살기 사용
  // 개발자 도움 요청: 10초 자동 플레이 후 수동 복귀 (판당 HELP_USES회)
  const helpChanged = () => env.help && env.help({ auto: s.auto, left: s.helps });
  function setAuto(on) {
    if (on) {
      if (s.auto || s.helps <= 0 || !s.p.alive) return false;
      s.helps--;
      s.auto = true;
      s.autoLeft = HELP_SEC;
      s.autoUsed = true;
      s.autoTarget = null;
      banner('🤖 개발자 도움 ON', s.boss && s.boss.key === 'king' ? '조철왕: "...나한테 도와달라고?"' : `${HELP_SEC}초 동안 자동으로 피하고 싸웁니다`, 1.4);
    } else {
      if (!s.auto) return false;
      s.auto = false;
      banner('🎮 다시 직접 조작!', '', 1);
    }
    helpChanged();
    return true;
  }
  function autoPilot(dt) {
    const p = s.p;
    if (s.boss && s.boss.key === 'king' && !s.autoKingLine) {
      s.autoKingLine = true;
      popText(W / 2, H * 0.5, '조철왕: "내가 만든 AI로 날 이기겠다고?"', '#E040FB', 13, 2.2);
    }
    // 필살기: 주변에 탄이 몰리면
    const near = s.bullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) < 70).length;
    if (s.bombs > 0 && (near >= 8 || (p.hp === 1 && near >= 4))) special();
    s.autoT -= dt;
    if (s.autoT > 0 && s.autoTarget) return s.autoTarget;
    s.autoT = 0.05;
    const bs = s.bullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) < 260);
    const slow = s.buffs.slow > 0 ? 0.45 : 1;
    const homeY = H - 110;
    const ys = [p.y - 45, p.y, p.y + 45, homeY].map((y) => clamp(y, MIN_Y + 40, MAX_Y));
    let best = { x: p.x, y: p.y }, bestV = Infinity;
    for (let x = 16; x <= W - 16; x += 12) {
      for (const y of ys) {
        const dx = x - p.x, dy = y - p.y, dist = Math.hypot(dx, dy) || 1;
        let v = dist * 0.015 + Math.abs(y - homeY) * 0.04;
        for (const b of bs) {
          for (let la = 0.04; la < 0.62; la += 0.08) {
            const step = Math.min(dist, SPEED * 1.6 * la);
            const qx = p.x + (dx / dist) * step, qy = p.y + (dy / dist) * step;
            const bx = b.x + b.vx * la * slow, by = b.y + b.vy * la * slow;
            const d = Math.hypot(bx - qx, by - qy);
            if (d < HIT_R + b.r + 7) v += 400 / (1 + la * 4);
            else if (d < HIT_R + b.r + 22) v += 3;
          }
        }
        for (const lz of s.lasers) if (!lz.final && lz.ranges.some(([a, c]) => x > a - 6 && x < c + 6)) v += 5000;
        for (const m of s.mobs) {
          for (const la of [0.2, 0.5, 0.9]) {
            if (Math.hypot(m.x + m.vx * la - x, m.y + m.vy * la - y) < m.r + 22) v += 80;
          }
          if (m.y < y - 80 && m.y > 0 && Math.abs(m.x - x) < 14) v -= 5;
        }
        const b = s.boss;
        if (b && !b.dead) {
          if (Math.abs(b.x - x) < b.w / 2 + 16 && Math.abs(b.y - y) < b.h / 2 + 30) v += 600;
          if (Math.abs(b.x - x) < b.w / 2 - 6) v -= 8;
        }
        for (const it of s.items) {
          if (Math.hypot(it.x - x, it.y - y) < 34) v -= it.kind === 'coin' ? 4 : 10;
        }
        if (v < bestV) { bestV = v; best = { x, y }; }
      }
    }
    s.autoTarget = { tx: best.x, ty: best.y };
    return s.autoTarget;
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
      const dmg = WEAPONS[tierOf(s.p.power)].dmg * 0.8;
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

  // 필살기: 화면의 모든 적 탄·예고 레이저 소거 + 전체 공격 + 잠깐 무적
  function special() {
    const p = s.p;
    if (!p.alive || s.bombs <= 0 || s.bombCd > 0 || s.ended) return false;
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
    if (s.boss) drawBoss(ctx, s.boss, t);
    for (const lz of s.lasers) drawLaser(ctx, lz, t, s.p.y);
    for (const bm of s.beams) drawBeam(ctx, bm, s.p.power >= 11, s.p.y);
    for (const sh of s.shots) drawShot(ctx, sh);
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
    for (const lz of s.lasers) drawLaserLabel(ctx, lz, s.p.y);
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
  }

  return {
    update,
    draw,
    drawUi,
    special,
    setAuto,
    isAuto: () => s.auto,
    player: () => ({ x: s.p.x, y: s.p.y }),
    snapshot: () => ({ score: Math.floor(s.score), stage: s.stage, hp: s.p.hp, power: s.p.power, alive: s.p.alive, boss: s.boss && { key: s.boss.key, hp: s.boss.hp, max: s.boss.max, mode: s.boss.mode }, time: s.time }),
    // 헤드리스 밸런스 테스트용
    _state: s,
  };
}

// =====================================================================
// 드로잉 (시대별 배경 · 캐릭터 · 보스 · 탄)
// =====================================================================
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
  drawSprite(ctx, sp, p.x, PY - step);
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

function drawShot(ctx, sh) {
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

function drawBeam(ctx, bm, big, PY) {
  const g = ctx.createLinearGradient(bm.x - bm.w, 0, bm.x + bm.w, 0);
  g.addColorStop(0, 'rgba(0,229,255,0)');
  g.addColorStop(0.5, big ? 'rgba(224,64,251,0.9)' : 'rgba(0,229,255,0.85)');
  g.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bm.x - bm.w, 0, bm.w * 2, PY - 30);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(bm.x - 1.5, 0, 3, PY - 30);
}

function drawBullet(ctx, bl, t) {
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
    ctx.fillStyle = bl.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bl.r * 1.7, bl.r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, bl.r * 0.9, bl.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (bl.kind === 'missile') {
    const a = Math.atan2(bl.vy, bl.vx);
    ctx.save();
    ctx.translate(bl.x, bl.y);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,171,64,0.7)';
    circle(ctx, -9, 0, 3 + Math.random() * 2);
    ctx.fillStyle = '#ECEFF1';
    rr(ctx, -7, -3, 14, 6, 3);
    ctx.fill();
    ctx.fillStyle = bl.color;
    ctx.fillRect(4, -3, 4, 6);
    ctx.restore();
  } else {
    ctx.fillStyle = bl.color;
    ctx.globalAlpha = 0.35;
    circle(ctx, bl.x, bl.y, bl.r + 3 + Math.sin(t * 20) * 0.8);
    ctx.globalAlpha = 1;
    circle(ctx, bl.x, bl.y, bl.r);
    ctx.fillStyle = '#fff';
    circle(ctx, bl.x, bl.y, bl.r * 0.45);
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
  } else {
    const rage = b.mode === 'floor' || b.mode === 'final';
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
  const face = heroFace(tierOf(p.power));
  if (face) { ctx.imageSmoothingEnabled = false; ctx.drawImage(face.img, 11, 11, 30, 30); }
  ctx.strokeText(sc, 52, 28);
  ctx.fillStyle = '#FFD166';
  ctx.fillText(sc, 52, 28);
  ctx.font = `700 11px ${FONT}`;
  ctx.fillStyle = s.stage === 2 ? '#B2EBF2' : '#3E2723';
  ctx.fillText(STAGES[s.stage].name, 52, 42);
  // 체력
  ctx.textAlign = 'right';
  ctx.font = '16px sans-serif';
  for (let i = 0; i < MAX_HP; i++) drawPixelHeart(ctx, W - 34 - i * 26, 12, 3, i < p.hp);
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = s.stage === 2 ? '#FFD166' : '#BF360C';
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
    ctx.fillStyle = b.key === 'king' ? (b.mode === 'floor' ? '#FF1744' : '#E040FB') : b.rage ? '#FF5252' : '#FFA726';
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
    const hpTxt = b.key === 'king' && (b.mode === 'floor' || b.mode === 'final') ? 'HP 1 (고정)' : `${Math.ceil(Math.max(0, b.hp))} / ${b.max}`;
    ctx.fillText(`${b.name} · ${hpTxt}`, W / 2, y + 10.5);
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
  ctx.fillText(`Lv.${p.power + 1} ${weaponLabel(p.power)}${p.power >= MAX_POWER ? ' · MAX' : ''}`, W / 2, by + 10.5);
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
