// 🎮 스톤몬스터 v3.0 게임 진행기: 상태 · 저장 · 맵 이동(스테이지 1~5) · 스토리 · 배틀 흐름 · 레벨/포식
//  v3.0: 포식 vs 길들이기 · 유전자 시너지 · 타격감 · 라이벌 카인 · Stage 4~5 · 원시 투기장 · 변종 · 화석/알 · 업적 · 세이브 백업
// React 화면(StoneMonsterGame.jsx)은 game.ui 를 그리고, 입력은 game.press()/hold() 로 넘긴다.
import { SPECIES, SKILLS, TRAITS, ELEMENTS, ELEMENT_KEYS, STARTERS, SPECIES_COUNT, TIER_NAME, FALLBACK_SKILL } from './data';
import {
  createMonster, maxHp, power, formName, absorb, elementsOf, josa, pick, rand, eff, geneTotal, stageThreshold,
  ppLeft, usePP, restorePP, gainExp, expYield, expNext, normalizeMon, applyGenes, isVariant,
} from './monster';
import { fighter, act, order, endTurn, chooseSkill, intimidate, spdVal, STATUS, blizzardRoll } from './battle';
import {
  MAPS, MAP_W, MAP_H, TRAINERS, ELITES, mapOf, blocked, doorAt, isTall, warpAt, rollWild, trainerParty, zoneAt,
  objectAt, OBJ_RESPAWN, makeVariant, eggSpecies, EGG_LV, RIVAL_OF, rivalStarter, rivalParty, RIVAL_REWARD, arenaEnemy,
} from './world';
import { registerShadow, reportResult, fetchOpponents, fetchMyResults, uploadCloudSave, downloadCloudSave } from './net';
import { sfx } from '../coffee/sound';
import { chip } from './chip';
import { SYNERGIES, synergiesOf } from './synergy';
import { checkAchievements, achBonus } from './achievements';

const SAVE_KEY = 'stonemon_save_v1';
const BACKUP_KEY = 'stonemon_save_backup'; // 5분마다 갱신되는 예비 저장 (본 저장이 깨졌을 때 복구)
const PRE_V3_KEY = 'stonemon_save_pre_v3'; // v3.0 업데이트 직전 저장 원본 (1회 보관)
const SAVE_VER = 3;
const BOX_MAX = 30;
const EGG_MAX = 3;
const SPEED_KEY = 'stonemonSpeed';
const PARTY_MAX = 4;
// v2.0: 기본 이동 속도 약 1.4배 상향 (150ms → 107ms / 달리기 80ms → 57ms)
const MOVE_MS = 107;
const RUN_MS = 57;
export const SPEEDS = [1, 2, 3];
export const ITEMS = {
  meat: { name: '생고기', desc: '체력 50% 회복', price: 30, icon: '🍖' },
  potion: { name: '회복약', desc: '체력 70% 회복', price: 60, icon: '🧪' },
  bigMeat: { name: '통구이', desc: '체력 100% · 기술 횟수 전부 회복 · 상태이상 치료', price: 90, icon: '🍗' },
  antidote: { name: '해독제', desc: '전투 중 중독·화상·마비·빙결 치료', price: 25, icon: '💊' },
  evoStone: { name: '진화석', desc: '핵 속성 유전자 +5 (변이 진화 촉진)', price: 220, icon: '💎' },
  stone: { name: '스톤 그물', desc: '쓰러뜨린 야생 스톤몬을 길들여 동료로 영입 (파티 4 · 보관함 30)', price: 50, icon: '🕸️' },
  amber: { name: '고대 호박', desc: '[희귀 진화] 원하는 속성 유전자 +8 (변이 방향 선택)', price: 0, icon: '🟠' },
};
const SHOPS = {
  shop: { name: '원시 상점', keeper: '상인', items: ['meat', 'bigMeat', 'stone', 'antidote'], hello: '어서 와! 뼈조각만 있으면 뭐든 팔지!', bye: '또 와! 살아 있다면 말이지. 크하하!' },
  swampShop: { name: '습지 상점', keeper: '늪지 약재상', items: ['antidote', 'potion', 'evoStone', 'meat', 'bigMeat', 'stone'], hello: '해독제, 회복약, 진화석… 습지에서 살아남을 건 다 있다네.', bye: '독 조심하게나!' },
  trader: { name: '떠돌이 상인', keeper: '떠돌이 상인', items: ['potion', 'bigMeat', 'antidote', 'evoStone', 'stone'], hello: '화산까지 와서 장사하는 건 나뿐이지! 뭐 줄까?', bye: '용암에 빠지지 마!' },
  iceShop: { name: '설원 행상', keeper: '설원 행상', items: ['potion', 'bigMeat', 'antidote', 'stone', 'evoStone'], hello: '으, 추워… 해독제는 넉넉히 챙기라고. 도쿠 녀석은 독을 쓰니까.', bye: '눈보라 조심해!' },
  skyShop: { name: '구름 상점', keeper: '구름 행상', items: ['bigMeat', 'potion', 'antidote', 'stone', 'evoStone'], hello: '구름 위까지 올라온 손님은 오랜만이야. 신수 앞에선 통구이가 최고지!', bye: '떨어지지 마!' },
};
const HEALERS = { mom: '엄마', herbalist: '약초꾼 할멈', shaman: '화산 무녀', hermit: '설원 은자', priest: '하늘 사제' };
// 스테이지 보스: 플래그 · 배경 · 스테이지 번호 (보스전 직전 길목에서 라이벌 카인이 기다린다)
const BOSSES = {
  guardian: { flag: 'boss1', bg: 'temple', stage: 1 },
  canyonBoss: { flag: 'boss2', bg: 'canyon', stage: 2 },
  finalBoss: { flag: 'boss3', bg: 'ruins', stage: 3 },
  glacierBoss: { flag: 'boss4', bg: 'glacier', stage: 4 },
  skyBoss: { flag: 'boss5', bg: 'sky', stage: 5 },
};
const GATE_MSG = {
  boss1: '거대한 가시덩굴이 길을 막고 있다… 숲의 수호자를 쓰러뜨려야 열릴 것 같다.',
  boss2: '무너진 바위가 협곡 길을 막고 있다… 협곡의 지배자를 쓰러뜨려야 지나갈 수 있다.',
  boss3: '두꺼운 얼음 문이 굳게 닫혀 있다… 태초의 왕좌를 꺾은 자만 지나갈 수 있다.',
  boss4: '얼음 계단이 무너져 있다… 빙하의 군주를 쓰러뜨려야 하늘로 오를 수 있다.',
};
const freshLife = (l = {}) => ({ devours: 0, tames: 0, shinyTames: 0, variants: 0, synergies: 0, digs: 0, hatches: 0, arenaBest: 0, streak: 0, bestStreak: 0, rivalWins: 0, ...l });
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CAPTURE = { 1: 0.95, 2: 0.75, 3: 0.55, 4: 0.3 };

function freshRun(meta = {}) {
  return {
    v: SAVE_VER,
    name: meta.name || '',
    ownerId: meta.ownerId || 'p' + Math.random().toString(36).slice(2, 12),
    runs: (meta.runs || 0) + 1,
    party: [],
    box: [],
    eggs: [],
    items: Object.fromEntries(Object.keys(ITEMS).map((k) => [k, 0])),
    bones: 0,
    steps: 0,
    objs: {},
    flags: {
      intro: false, starter: false, tutorial: false, trainers: {}, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false,
      rival1: false, rival2: false, rival3: false, rival4: false, rival5: false, endless: !!meta.endless, arena: !!meta.arena, visited: {},
    },
    pos: { map: 'village', x: 4, y: 18, dir: 'down' },
    codex: meta.codex || { seen: {}, eaten: {}, owned: {} },
    grave: meta.grave || [],
    stats: { devours: 0, wins: 0, pvpWins: 0, best: meta.stats?.best || 0, bestName: meta.stats?.bestName || '' },
    seenResults: meta.seenResults || {},
    // v3.0: 생을 넘어 유지되는 기록 · 업적 · 칭호
    life: freshLife({ ...(meta.life || {}), streak: 0 }),
    ach: meta.ach || {},
    title: meta.title || '',
  };
}
// 게임 오버 · 새로 시작 때 이어지는 기록
const metaOf = (S) => ({
  name: S.name, ownerId: S.ownerId, runs: S.runs, codex: S.codex, grave: S.grave, stats: S.stats, seenResults: S.seenResults,
  endless: S.flags?.endless, arena: S.flags?.arena, life: S.life, ach: S.ach, title: S.title,
});

// 저장 데이터 정리: 빠진 필드는 기본값으로 채움 (v1 · v2 → v3 변환 · 백업 · 클라우드 공용)
export function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object' || ![1, 2, 3].includes(raw.v)) return null;
  const base = freshRun({ name: raw.name, ownerId: raw.ownerId, runs: Math.max(0, (raw.runs || 1) - 1) });
  const s = { ...base, ...raw, v: SAVE_VER };
  s.flags = { ...base.flags, ...(raw.flags || {}), trainers: { ...(raw.flags?.trainers || {}) }, visited: { ...(raw.flags?.visited || {}) } };
  if (raw.flags?.chief) s.flags.boss1 = true; // v1 족장 격파 → 1단계 클리어로 인정
  delete s.flags.chief;
  s.items = { ...base.items, ...(raw.items || {}) };
  s.codex = { seen: {}, eaten: {}, owned: {}, ...(raw.codex || {}) };
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  const p = raw.pos || {};
  s.pos = Number.isFinite(p.x) && Number.isFinite(p.y) ? { map: MAPS[p.map] ? p.map : 'village', x: p.x, y: p.y, dir: p.dir || 'down' } : base.pos;
  s.party = Array.isArray(raw.party) ? raw.party.map((m) => normalizeMon(m)).filter(Boolean) : [];
  s.box = Array.isArray(raw.box) ? raw.box.map((m) => normalizeMon(m)).filter(Boolean) : [];
  if (s.party.length > PARTY_MAX) { s.box = [...s.party.slice(PARTY_MAX), ...s.box]; s.party = s.party.slice(0, PARTY_MAX); }
  s.box = s.box.slice(0, BOX_MAX);
  s.eggs = Array.isArray(raw.eggs) ? raw.eggs.filter((e) => e && SPECIES[e.sid]).slice(0, EGG_MAX) : [];
  s.objs = raw.objs && typeof raw.objs === 'object' ? { ...raw.objs } : {};
  s.steps = Math.max(0, Number(raw.steps) || 0);
  s.life = freshLife(raw.life || {});
  s.ach = raw.ach && typeof raw.ach === 'object' ? { ...raw.ach } : {};
  s.title = typeof raw.title === 'string' ? raw.title : '';
  s.grave = Array.isArray(raw.grave) ? raw.grave.slice(0, 40) : [];
  return s;
}

function loadSave() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
  let data = null;
  try { data = JSON.parse(raw); } catch (e) { data = null; }
  // v3.0 업데이트 직전 저장 원본을 한 번 따로 보관 (만약을 위한 복구용)
  try { if (data && data.v < SAVE_VER && !localStorage.getItem(PRE_V3_KEY)) localStorage.setItem(PRE_V3_KEY, raw); } catch (e) { /* ignore */ }
  let s = normalizeSave(data);
  if (!s) { // 본 저장이 깨졌으면 예비 저장으로 복구
    try { s = normalizeSave(JSON.parse(localStorage.getItem(BACKUP_KEY))); } catch (e) { s = null; }
  }
  return s;
}
// 백업 텍스트 해석: JSON 원문 · 'SM1:' base64 둘 다 지원
export function parseBackup(text) {
  const t = String(text || '').trim();
  if (t.startsWith('{')) { try { return normalizeSave(JSON.parse(t)); } catch (e) { return null; } }
  return decodeBackup(t);
}

// 백업 문자열: 'SM1:' + base64(JSON)
export function encodeBackup(S) {
  return 'SM1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
}
function decodeBackup(str) {
  const t = String(str).trim();
  if (!t.startsWith('SM1:')) return null;
  try { return normalizeSave(JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))))); } catch (e) { return null; }
}
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 10 }, () => CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]).join('');

export class Game {
  constructor(refresh) {
    this.refresh = refresh;
    this.S = loadSave();
    this.ui = { title: true, dialog: null, choice: null, cmd: null, panel: null, card: null, nameInput: null, hud: null, toast: null, ach: null, backup: null };
    this._achQ = [];
    this.v = { mode: 'title', map: 'village', x: 4, y: 18, dir: 'down', mv: null, walk: 0, fx: {}, flash: 0, t: 0, battle: null, scene: null, banner: null };
    this.held = [];
    this.busy = false;
    this.npcDir = {};
    let sp = 1;
    try { sp = Number(localStorage.getItem(SPEED_KEY)) || 1; } catch (e) { /* ignore */ }
    this.speed = SPEEDS.includes(sp) ? sp : 1;
  }

  // ───────── 배속 (1x / 2x / 3x) ─────────
  // 필드 이동 · 텍스트 출력 · 전투 연출 딜레이가 모두 배율만큼 빨라진다 (즉시 적용)
  setSpeed(n) {
    this.speed = SPEEDS.includes(n) ? n : 1;
    try { localStorage.setItem(SPEED_KEY, String(this.speed)); } catch (e) { /* ignore */ }
    this.refresh();
  }
  cycleSpeed() {
    this.setSpeed(SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length]);
    sfx.tick();
    this.toast(`⏩ 게임 속도 ${this.speed}x`);
  }

  // ───────── UI 브릿지 ─────────
  setUi(p) { Object.assign(this.ui, p); this.refresh(); }
  hasSave() { return !!(this.S && this.S.name && this.S.flags?.intro && (this.S.party?.length || !this.S.flags.starter)); }
  save() {
    if (!this.S) return;
    this.S.savedAt = Date.now();
    try {
      const json = JSON.stringify(this.S);
      localStorage.setItem(SAVE_KEY, json);
      // 5분마다 예비 저장 갱신 (본 저장이 손상돼도 복구 가능)
      if (!this._bakAt || Date.now() - this._bakAt > 300000) { localStorage.setItem(BACKUP_KEY, json); this._bakAt = Date.now(); }
    } catch (e) { /* ignore */ }
  }
  async cloudSync(force = false) {
    if (!this.S || (!this.S.cloudCode && !force)) return false;
    if (!this.S.cloudCode) this.S.cloudCode = makeCode();
    this.save();
    try { await uploadCloudSave(this.S.cloudCode, this.S); this.S.cloudAt = Date.now(); this.save(); return true; } catch (e) { console.warn('cloud save failed', e); return false; }
  }
  async loadFromCode(input) {
    const t = String(input || '').trim();
    let data = null;
    if (t.startsWith('SM1:') || t.startsWith('{')) data = parseBackup(t);
    else {
      const code = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length !== 10) return { ok: false, msg: '모험 코드는 10자리입니다.' };
      try { const raw = await downloadCloudSave(code); data = raw && normalizeSave(raw); if (data) data.cloudCode = code; }
      catch (e) { return { ok: false, msg: '서버에 연결하지 못했습니다. 백업 문자열로 시도해 보세요.' }; }
    }
    if (!data) return { ok: false, msg: '저장 데이터를 찾지 못했습니다. 코드를 다시 확인해 주세요.' };
    this.S = data;
    this.save();
    return { ok: true, msg: `${data.name}의 모험을 불러왔습니다!` };
  }
  // 연출용 대기: 배속에 비례해 짧아진다
  wait(ms) { return new Promise((r) => setTimeout(r, ms / this.speed)); }
  toast(text) {
    this.setUi({ toast: text });
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.setUi({ toast: null }), 2200);
  }
  // ───────── 업적 (상단 토스트 큐) ─────────
  checkAch() {
    const fresh = checkAchievements(this.S);
    for (const a of fresh) this._achQ.push(a);
    if (fresh.length && !this.ui.ach) this._nextAch();
    if (fresh.length) this.save();
    return fresh;
  }
  _nextAch() {
    const a = this._achQ.shift();
    if (!a) { this.setUi({ ach: null }); return; }
    chip.achieve();
    this.setUi({ ach: a });
    clearTimeout(this._achT);
    this._achT = setTimeout(() => this._nextAch(), 3400);
  }
  bonus(kind) { return achBonus(this.S, kind); }
  // ───────── 세이브 백업 (JSON 복사 / 불러오기) ─────────
  openBackup(mode) {
    return new Promise((res) => {
      const text = mode === 'export' ? JSON.stringify(this.S) : '';
      this.setUi({ backup: { mode, text, msg: '', done: res } });
    });
  }
  closeBackup(result = null) {
    const b = this.ui.backup;
    this.setUi({ backup: null });
    b?.done?.(result);
  }
  importBackup(text) {
    const data = parseBackup(text);
    if (!data) return { ok: false, msg: '세이브 데이터를 읽지 못했습니다. 복사한 내용 전체를 붙여넣었는지 확인해 주세요.' };
    try { if (this.S) localStorage.setItem(BACKUP_KEY, JSON.stringify(this.S)); } catch (e) { /* ignore */ }
    this.S = data;
    this.save();
    return { ok: true, msg: `${data.name || '모험가'}의 모험(${data.runs}번째 생 · 동료 ${data.party.length})을 불러왔습니다!` };
  }

  say(text, opts = {}) {
    return new Promise((res) => {
      const d = { text, speaker: opts.speaker || null, shown: 0, auto: opts.auto || 0, done: null };
      d.done = () => {
        if (d.finished) return;
        d.finished = true;
        clearInterval(d.iv); clearTimeout(d.at);
        res();
        setTimeout(() => { if (this.ui.dialog === d) this.setUi({ dialog: null }); }, 0);
      };
      const autoClose = () => { d.at = setTimeout(d.done, d.auto / this.speed); };
      d.iv = setInterval(() => {
        d.shown = Math.min(text.length, d.shown + (opts.auto ? 2 : 1) * this.speed);
        if (d.shown >= text.length) {
          clearInterval(d.iv);
          if (d.auto) autoClose();
        }
        this.refresh();
      }, 22);
      d.skip = () => { d.shown = text.length; clearInterval(d.iv); if (d.auto) autoClose(); this.refresh(); };
      this.setUi({ dialog: d });
    });
  }
  async talk(speaker, lines) { for (const l of lines) await this.say(l.replace(/\{name\}/g, this.S.name), { speaker }); }

  // 선택지: idx 로 처음 커서 위치를 지정할 수 있다 (상점 연속 구매용)
  choose(title, options, { cancel = false, wide = false, idx = null } = {}) {
    return new Promise((res) => {
      const opts = options.map((o) => (typeof o === 'string' ? { label: o } : o));
      const first = opts.findIndex((o) => !o.disabled);
      const start = idx !== null && idx >= 0 && idx < opts.length ? idx : Math.max(0, first);
      const c = {
        title, options: opts, idx: start, cancel, wide,
        pick: (i) => {
          if (i >= 0 && opts[i]?.disabled) { sfx.bump(); return; }
          if (i < 0 && !cancel) return;
          sfx.tick();
          this.setUi({ choice: null });
          res(i);
        },
      };
      this.setUi({ choice: c });
    });
  }

  showCard(card) {
    return new Promise((res) => {
      this.setUi({ card: { ...card, close: () => { sfx.tick(); this.setUi({ card: null }); res(); } } });
    });
  }

  askName() {
    return new Promise((res) => {
      this.setUi({ nameInput: { submit: (n) => { this.setUi({ nameInput: null }); res(n); } } });
    });
  }

  command() {
    return new Promise((res) => {
      const c = { level: 'main', idx: 0, pick: (r) => { this.setUi({ cmd: null }); res(r); } };
      this.setUi({ cmd: c });
    });
  }

  // ───────── 입력 ─────────
  press(k) {
    const u = this.ui;
    if (k === 'speed') { this.cycleSpeed(); return; }
    if (u.nameInput || u.backup) return;
    if (u.card) { if (k === 'a' || k === 'b' || k === 'start') u.card.close(); return; }
    if (u.choice) {
      const c = u.choice, n = c.options.length;
      if (k === 'up' || k === 'left') { c.idx = (c.idx + n - 1) % n; sfx.tick(); this.refresh(); }
      else if (k === 'down' || k === 'right') { c.idx = (c.idx + 1) % n; sfx.tick(); this.refresh(); }
      else if (k === 'a' || k === 'start') c.pick(c.idx);
      else if (k === 'b') c.pick(-1);
      return;
    }
    if (u.dialog) {
      const d = u.dialog;
      if (k === 'a' || k === 'b' || k === 'start') {
        if (d.shown < d.text.length) d.skip();
        else d.done();
      }
      return;
    }
    if (u.cmd) { this.cmdKey(k); return; }
    if (u.panel) { if (k === 'b' || k === 'start') this.closePanel(); return; }
    if (u.title) return;
    if (this.v.mode === 'map' && !this.busy) {
      if (k === 'a') this.interact();
      else if (k === 'start') this.run(() => this.startMenu());
    }
  }
  hold(dir, on) {
    this.held = this.held.filter((d) => d !== dir);
    if (on) this.held.push(dir);
  }
  cmdKey(k) {
    const c = this.ui.cmd;
    const n = c.level === 'main' ? 4 : this.v.battle.player.m.skills.length;
    if (k === 'up') c.idx = (c.idx + n - 2) % n;
    else if (k === 'down') c.idx = (c.idx + 2) % n;
    else if (k === 'left') c.idx = (c.idx + n - 1) % n;
    else if (k === 'right') c.idx = (c.idx + 1) % n;
    else if (k === 'a' || k === 'start') { this.cmdPick(c.idx); return; }
    else if (k === 'b' && c.level === 'skill') { c.level = 'main'; c.idx = 0; }
    if (c.idx >= n) c.idx = n - 1;
    sfx.tick();
    this.refresh();
  }
  cmdPick(i) {
    const c = this.ui.cmd;
    if (!c) return;
    sfx.tick();
    const m = this.v.battle.player.m;
    if (c.level === 'main') {
      if (i === 0) {
        if (!m.skills.some((s) => ppLeft(m, s) > 0)) {
          c.pick({ type: 'skill', id: FALLBACK_SKILL, exhausted: true });
          return;
        }
        c.level = 'skill'; c.idx = 0; this.refresh(); return;
      }
      c.pick({ type: ['fight', 'party', 'bag', 'run'][i] });
    } else if (i < 0) { c.level = 'main'; c.idx = 0; this.refresh(); }
    else {
      const id = m.skills[i];
      if (ppLeft(m, id) <= 0) { sfx.bump(); this.toast(`${SKILLS[id].name}: 남은 횟수가 없다!`); return; }
      c.pick({ type: 'skill', id });
    }
  }

  async run(fn) {
    if (this.busy) return;
    this.busy = true;
    this.held = [];
    try { await fn(); } catch (e) { console.error(e); }
    finally { this.busy = false; this.save(); this.refresh(); }
  }

  // ───────── 타이틀 ─────────
  newGame() {
    const meta = this.S;
    this.S = freshRun(meta ? metaOf(meta) : {});
    if (meta?.name) this.S.name = meta.name;
    this.save();
    this.setUi({ title: false });
    this.run(() => this.opening());
  }
  continueGame() {
    if (!this.hasSave()) { this.newGame(); return; }
    this.setUi({ title: false });
    const { map, x, y, dir } = this.S.pos;
    if (blocked(map, x, y)) this.placePlayer(4, 18, 'down', 'village'); else this.placePlayer(x, y, dir, map);
    this.v.mode = 'map';
    this.v.flash = 1;
    this.showBanner();
    this.refresh();
    const lead = this.S.party[0];
    this.run(async () => {
      await this.say(lead ? `${this.S.name}의 모험을 이어서 시작합니다. (${this.S.runs}번째 생 · 대장 ${formName(lead)} Lv.${lead.lv})` : `${this.S.name}의 모험을 이어서 시작합니다. 연구소로 가 보자!`, { auto: 1400 });
    });
  }
  toTitle() {
    if (this.busy) return;
    this.save();
    this.v.mode = 'title'; this.v.battle = null; this.v.fx = {};
    this.setUi({ title: true, hud: null, panel: null });
  }
  placePlayer(x, y, dir, map) {
    if (map) this.v.map = map;
    Object.assign(this.v, { x, y, dir: dir || this.v.dir, mv: null });
    if (this.S) this.S.pos = { map: this.v.map, x, y, dir: this.v.dir };
  }
  showBanner() { this.v.banner = { text: `Stage ${mapOf(this.v.map).stage} · ${mapOf(this.v.map).name}`, t0: this.v.t }; }

  // ───────── 맵 ─────────
  npcAt(x, y) {
    return mapOf(this.v.map).npcs.find((n) => n.x === x && n.y === y && !(n.trainer && this.S.flags.trainers[n.trainer] === 'gone'));
  }
  update(dt) {
    const v = this.v;
    dt *= this.speed;
    v.t += dt;
    if (v.mode !== 'map') return;
    if (v.mv) {
      v.mv.t += dt;
      if (v.mv.t >= v.mv.dur) {
        v.x = v.mv.tx; v.y = v.mv.ty; v.mv = null; v.walk ^= 1;
        this.S.pos = { map: v.map, x: v.x, y: v.y, dir: v.dir };
        this.onStep();
      }
      return;
    }
    if (this.busy || this.ui.dialog || this.ui.choice || this.ui.panel || this.ui.card || this.ui.title || this.ui.backup) return;
    const dir = this.held[this.held.length - 1];
    if (!dir) return;
    v.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = v.x + dx, ny = v.y + dy;
    const door = doorAt(v.map, nx, ny);
    if (door) { this.held = []; this.run(() => this.enterBuilding(door.id)); return; }
    if (v.map === 'village' && !this.S.flags.starter && ny <= 12) {
      this.held = [];
      this.run(async () => { await this.say('…숲에서 무언가 으르렁거린다. 맨몸으로 가는 건 자살 행위다.'); await this.say('먼저 동쪽 연구소의 박사님께 스톤몬을 받자.'); });
      return;
    }
    const w = warpAt(v.map, nx, ny);
    if (w && w.gate && !this.S.flags[w.gate]) {
      this.held = [];
      this.run(() => this.say(GATE_MSG[w.gate] || '아직 지나갈 수 없다.'));
      return;
    }
    if (blocked(v.map, nx, ny) || this.npcAt(nx, ny)) {
      if (!v.bumpT || v.t - v.bumpT > 300) { sfx.bump(); v.bumpT = v.t; }
      return;
    }
    v.mv = { tx: nx, ty: ny, t: 0, dur: this.running ? RUN_MS : MOVE_MS };
  }
  onStep() {
    const { x, y, map } = this.v;
    const S = this.S;
    S.steps = (S.steps || 0) + 1;
    const w = warpAt(map, x, y);
    if (w) { this.run(() => this.changeMap(w)); return; }
    // 미확인 공룡알: 걸음 수가 차면 부화
    if (S.eggs?.length) {
      for (const e of S.eggs) e.left = Math.max(0, (e.left || 0) - 1);
      const ready = S.eggs.find((e) => e.left <= 0);
      if (ready && S.party.length) { this.run(() => this.hatchEgg(ready)); return; }
    }
    if (isTall(map, x, y) && this.S.flags.starter) {
      if (!this.S.flags.tutorial) { if (map === 'village') this.run(() => this.tutorial()); return; }
      if (Math.random() < 0.11) this.run(() => this.wildBattle());
    }
  }
  async changeMap(w) {
    sfx.whoosh();
    this.v.flash = 1;
    this.placePlayer(w.tx, w.ty, w.dir, w.to);
    this.showBanner();
    this.save();
    this.refresh();
    await this.wait(350);
    const F = this.S.flags;
    if (!F.visited[w.to]) {
      F.visited[w.to] = true;
      if (w.to === 'swamp') {
        await this.say('물안개 너머로 폭포 소리와 개구리 울음이 메아리친다…');
        await this.say('▶ Stage 2 「메아리의 습지 & 협곡」 (적정 Lv.11~22) · 독/화상 기술을 쓰는 스톤몬이 나온다. 습지 상점(입구 왼쪽)에서 해독제를 살 수 있다.');
      } else if (w.to === 'volcano') {
        await this.say('뜨거운 바람에 재가 날린다. 땅속 깊은 곳에서 용암이 끓는다…');
        await this.say('▶ Stage 3 「작열하는 화산 & 고대 유적」 (적정 Lv.23~35) · 세 정예를 꺾고 유적의 왕좌에 도전하자.');
      } else if (w.to === 'glacier') {
        await this.say('숨을 쉴 때마다 허파가 얼어붙는다. 푸른 얼음 결정이 동굴 천장까지 자라 있다…');
        await this.say('▶ Stage 4 「만년설의 빙하 동굴」 (적정 Lv.36~48) · ❄️ 눈보라: 얼음 속성이 아닌 스톤몬은 가끔 몸이 얼어 1턴 행동 불가. 설원 은자가 회복을, 설원 행상이 물건을 판다.');
      } else if (w.to === 'sky') {
        await this.say('구름을 뚫고 올라서자 하늘 위에 거대한 석조 신전이 떠 있다. 원시의 에너지가 제단으로 흐른다…');
        await this.say('▶ Stage 5 「태고의 하늘 신전」 (적정 Lv.49~65) · 제단의 고대 3대 신수를 모두 꺾으면 원시 투기장이 열린다.');
      }
    }
  }
  interact() {
    const [dx, dy] = DIRS[this.v.dir];
    const tx = this.v.x + dx, ty = this.v.y + dy;
    const npc = this.npcAt(tx, ty);
    if (npc) {
      this.npcDir[npc.id] = { up: 'down', down: 'up', left: 'right', right: 'left' }[this.v.dir];
      this.run(() => this.talkNpc(npc));
      return;
    }
    const sign = mapOf(this.v.map).signs[`${tx},${ty}`];
    if (sign) { this.run(async () => { for (const l of sign) await this.say(l); }); return; }
    const obj = objectAt(this.v.map, tx, ty);
    if (obj) { this.run(() => this.investigate(obj)); return; }
    const door = doorAt(this.v.map, tx, ty);
    if (door) this.run(() => this.enterBuilding(door.id));
  }

  // ───────── 스토리 ─────────
  async opening() {
    const v = this.v;
    const reborn = this.S.runs > 1;
    v.mode = 'black';
    this.refresh();
    if (!this.S.name) {
      await this.say('……쿵. ……쿵.');
      await this.say('땅이 울린다. 공룡의 발소리인가, 내 심장 소리인가.');
      await this.say('이곳은 원시와 괴물이 공존하는 세계.\n돌알에서 태어나 서로를 잡아먹으며 진화하는 존재 ─ 스톤몬스터.');
      await this.say('…그런데, 너의 이름은?');
      this.S.name = await this.askName();
    } else if (reborn) {
      await this.say('……');
      await this.say(`${this.S.name}은(는) 식은땀을 흘리며 눈을 떴다.`);
      await this.say('삼켜지던 스톤몬의 마지막 비명이 아직 귀에 남아 있다.');
      await this.say('하지만 이 세계의 법칙은 단순하다. 먹히면 끝. 그리고… 다시 시작.');
    }
    this.placePlayer(4, 18, 'down', 'village');
    v.mode = 'map';
    v.flash = 1;
    this.showBanner();
    this.refresh();
    await this.wait(400);
    await this.talk('엄마', reborn ? [
      '{name}! 악몽이라도 꿨니? 얼굴이 하얗구나.',
      '오늘은 박사님께 새 스톤몬을 받기로 한 날이잖니. 동쪽 큰 돌집 연구소로 가 보렴.',
    ] : [
      '{name}! 드디어 일어났구나!',
      '오늘이 무슨 날인지 잊은 건 아니지? 열여섯 번째 우기를 맞은 아이는 공룡 박사님께 첫 스톤몬을 받는 날이잖니.',
      '박사님 연구소는 마을 동쪽의 큰 돌집이야. 지붕에 공룡 두개골이 걸려 있어.',
      '…그리고 명심하렴. 이 숲에서 스톤몬을 잃는다는 건, 모든 걸 잃는다는 뜻이야.',
    ]);
    await this.say('▶ 방향키(또는 화면 패드)로 이동 · B를 누른 채 이동하면 달리기 · A(Z/Space) 조사·대화 · 메뉴(Enter) · 상단 ⏩ 버튼(또는 Q)으로 1x/2x/3x 배속');
    this.S.flags.intro = true;
  }

  async enterBuilding(id) {
    this.v.dir = 'up';
    if (id === 'lab') return this.lab();
    if (id === 'house') return this.home();
    if (id === 'shop' || id === 'swampShop') return this.shop(id);
    if (id === 'altar') return this.altar();
    if (id === 'temple') return this.bossGate('guardian');
    if (id === 'lair') return this.bossGate('canyonBoss');
    if (id === 'throne') return this.bossGate('finalBoss');
    if (id === 'iceLair') return this.bossGate('glacierBoss');
    if (id === 'skyAltar') return this.bossGate('skyBoss');
    if (id === 'colosseum') return this.arena();
  }

  async lab() {
    const F = this.S.flags;
    if (!F.starter) return this.starterEvent();
    const seen = Object.keys(this.S.codex.seen).length, eaten = Object.keys(this.S.codex.eaten).length;
    await this.talk('고돌 박사', [
      '오, {name}! 연구는 순조롭냐?',
      `도감 기록: 발견 ${seen} / 포식 ${eaten} / 전체 ${SPECIES_COUNT}종.`,
    ]);
    const tips = [
      '싸워 이기면 경험치로 레벨이 오르지만, 진짜 변이는 포식으로만 일어난다. 레벨은 체급, 포식은 진화지.',
      '상성은 정직하다. 유리하면 1.5배, 천적이면 2배, 불리하면 절반! 같은 속성 기술은 1.2배다.',
      '독은 매 턴 최대 체력의 1/16씩 4턴, 화상은 5%씩 3턴이면 저절로 낫는다. 겁먹지 말고 상성으로 밀어붙여라.',
      '변이 단계는 흡수한 유전자의 총량으로 정해진다. 3, 8, 15, 24, 35… 끝이 없지. 습지 상점의 진화석으로 앞당길 수도 있다.',
      '메뉴 → 스톤몬에서 기술 순서를 ▲▼로 바꿀 수 있다. 자주 쓰는 기술을 맨 앞에 두거라.',
      '동료로 길들인 스톤몬을 대장에게 먹이면(메뉴 → 스톤몬 → 먹이로 바치기) 야생보다 더 많이 흡수한다. 잔인하지만… 효율적이지.',
      '쓰러뜨린 녀석을 먹을지, 스톤 그물로 길들일지는 네 선택이다. 먹으면 강해지고, 길들이면 동료가 는다. 파티는 넷, 나머지는 보관함이다.',
      '같은 계통을 계속 먹으면 유전자 시너지가 각성한다. 화염+비행이면 폭염의 비룡, 대지+독이면 맹독 갑주… 상태창의 각성 뱃지를 확인해라.',
      '수풀에서 아주 드물게 색이 뒤집힌 고대 변종이나 덩치 큰 알파 개체가 나온다. 먹으면 세 배를 흡수하고 희귀 기술까지 얻지!',
      '맵 곳곳의 반짝이는 화석 바위와 알 둥지를 조사해 봐라. 미확인 공룡알은 걷다 보면 부화한다.',
    ];
    await this.say(pick(tips), { speaker: '고돌 박사' });
    if (F.boss5) await this.say('고대 3대 신수까지…! 너는 이제 전설이다. 하늘 신전의 원시 투기장에서 끝을 시험해 봐라.', { speaker: '고돌 박사' });
    else if (F.boss4) await this.say('빙하의 군주를 꺾었다고? 얼음 계단 위 태고의 하늘 신전에 마지막 신수들이 있다.', { speaker: '고돌 박사' });
    else if (F.boss3) await this.say('왕좌의 세 괴물을 먹다니… 유적 동쪽 끝 얼음 문 너머, 만년설의 빙하 동굴이 열렸다!', { speaker: '고돌 박사' });
    else if (F.boss2) await this.say('협곡의 지배자까지! 화산 너머 유적의 왕좌… 거기가 마지막 시련이다.', { speaker: '고돌 박사' });
    else if (F.boss1) await this.say('숲의 수호자를 꺾었구나! 동쪽 숲길 너머 메아리의 습지로 가 보거라.', { speaker: '고돌 박사' });
  }

  async starterEvent() {
    const v = this.v;
    v.mode = 'scene';
    v.scene = { kind: 'lab', t0: v.t };
    this.refresh();
    await this.talk('고돌 박사', [
      '오, 왔구나 {name}! 나는 화석 박사 고돌이다.',
      '이 세계엔 \'스톤몬스터\'라 불리는 존재들이 살고 있지. 돌알에서 깨어나, 서로를 잡아먹으며 진화하는 원시의 괴물들…',
      '싸우면 레벨이 오르고 몸집은 커진다. 하지만 진짜 진화는 단 하나 ─ \'포식\'이다.',
      '쓰러뜨린 상대를 잡아먹으면, 그 녀석의 힘·속성·특성·기술이 네 스톤몬의 피와 뼈에 녹아든다.',
      '바람 스톤몬을 삼키면 날개가 돋고, 번개를 삼키면 번개 가시가 돋는다. 먹을수록 끝없이 변이하지.',
      '…하지만 명심해라. 네가 지면, 네 스톤몬이 먹힌다. 영원히.',
      '모든 스톤몬을 잃으면… 처음부터 다시다. 약육강식. 약자멸시. 적자생존. 그게 이 세계의 법칙이다.',
      '자, 여기 세 개의 돌알이 있다. 하나를 골라라.',
    ]);
    let sid;
    for (;;) {
      const i = await this.choose('어떤 돌알을 고를까?', STARTERS.map((id) => {
        const sp = SPECIES[id];
        return { label: `${sp.name}  ·  ${ELEMENTS[sp.el].icon}${ELEMENTS[sp.el].name}`, sub: sp.desc, mon: { sid: id } };
      }), { wide: true });
      sid = STARTERS[i];
      const sp = SPECIES[sid];
      const line = {
        2: '티랑이는 불/육식! 공격 특화 꼬마 폭군이지. 풀 속성에겐 천적이다.',
        3: '케톱스는 풀/초식! 단단한 프릴로 버티고 광합성으로 회복한다. 대지 속성에겐 천적이다.',
        4: '브퉁이는 물/초식! 큰 체력으로 오래 버틴다. 불 속성에겐 천적이다.',
      }[sid];
      await this.say(line, { speaker: '고돌 박사' });
      const ok = await this.choose(`정말 ${josa(sp.name, '으로/로')} 하겠느냐?`, ['그래, 이 녀석이다!', '다시 고를래']);
      if (ok === 0) break;
    }
    const m = createMonster(sid, { lv: 5, jitter: false });
    v.scene = { kind: 'hatch', t0: v.t, mon: m };
    this.refresh();
    sfx.crack();
    await this.wait(600); sfx.crack();
    await this.wait(700); sfx.explosion();
    await this.wait(900);
    sfx.fanfare();
    await this.say(`쩌억─! 돌알이 갈라지며 ${josa(SPECIES[sid].name, '이/가')} 튀어나왔다! (Lv.5)`);
    this.S.party = [m];
    this.S.starter = sid;
    this.S.rival = { sid: RIVAL_OF[sid] };
    this.S.flags.starter = true;
    this.S.codex.seen[sid] = true; this.S.codex.owned[sid] = true;
    this.S.items = { ...this.S.items, meat: 3, stone: 3, antidote: 1 };
    this.S.bones = 100;
    await this.talk('고돌 박사', [
      '허허, 벌써 배가 고픈 모양이구나.',
      '생고기 3개, 해독제 1개, 스톤 그물 3개를 주마. 스톤 그물은 쓰러뜨린 야생 스톤몬을 길들여 동료로 만드는 그물이다.',
      '마침 잘됐다. 요즘 북쪽 태초의 숲에 프테라 녀석이 돌알을 훔쳐 간다는구나. 첫 사냥을 해 보거라!',
    ]);
    // 숙명의 라이벌 카인: 남은 돌알 중 주인공의 천적을 가져간다
    const rv = SPECIES[RIVAL_OF[sid]];
    chip.rival();
    await this.talk('???', ['…흥. 그 녀석을 골랐다고?']);
    await this.talk('카인', [
      `나는 카인. 박사님, 남은 돌알 중 ${josa(rv.name, '은/는')} 내가 가져가겠습니다.`,
      `${ELEMENTS[rv.el].icon}${ELEMENTS[rv.el].name} 속성 ─ {name}, 네 스톤몬의 천적이지.`,
      '먹는 쪽은 나다. 보스 앞에서 기다리지. 그때까지 먹히지나 마라.',
    ]);
    await this.say('카인은 돌알을 낚아채 연구소를 나가 버렸다…', { speaker: '고돌 박사' });
    v.scene = null;
    v.mode = 'map';
    this.placePlayer(20, 19, 'down', 'village');
    this.save();
  }

  async tutorial() {
    await this.say('수풀이 바스락거린다…!');
    const enemy = createMonster(5, { lv: 3, jitter: false });
    const res = await this.battle({ kind: 'tutorial', enemies: [enemy], bg: 'forest' });
    if (res.result !== 'win') return;
    this.S.flags.tutorial = true;
    this.save();
    await this.talk('고돌 박사', [
      '…허, 허허허! 봤느냐 {name}! 날개가 돋았어!',
      '이것이 포식 진화다. 먹은 것의 일부가 영원히 네 스톤몬의 몸이 되는 거지.',
      '싸워서 얻은 경험치로 레벨이 오르고, 포식으로 끝없이 변이한다. 둘 다 챙겨라.',
      '참고로 지금 네 스톤몬의 체력은 줄어 있다. 집에서 쉬면 엄마가 회복시켜 줄 거다.',
    ]);
    const next = await this.choose('이제 무엇을 할까?', [
      { label: '🌿 숲 깊숙이 들어가 더 강한 먹잇감을 찾는다', sub: '야생 스톤몬 사냥 · 수풀을 걸으면 조우 (숲 구석일수록 레벨↑)' },
      { label: '🗿 포식의 제단에서 다른 스톤마스터에게 도전한다', sub: '다른 플레이어의 스톤몬을 먹고 급성장 (패배 시 먹힘)' },
      { label: '🔬 마을로 돌아가 박사에게 진화 결과를 보고한다', sub: '연구소로 이동 · 공략 조언 듣기' },
    ], { wide: true });
    if (next === 0) {
      await this.say('더 강한 먹잇감의 냄새가 숲 깊은 곳에서 풍겨 온다…');
      await this.say('▶ 수풀을 걸으면 야생 스톤몬이 나타난다. 위험해 보이면 도망치자.');
    } else if (next === 1) {
      await this.fadeTo(22, 21, 'right');
      await this.altar();
    } else {
      await this.fadeTo(20, 19, 'up');
      await this.talk('고돌 박사', [
        '보고는 들었다! 첫 포식으로 바람 유전자를 얻었구나.',
        '마을 북쪽 사당의 숲의 수호자(파키파 & 가르고)는 다섯 번 이상 포식한 자만 상대해 준다. 그들을 꺾으면 1단계 졸업이다.',
        '숲의 사냥꾼들도 스톤몬을 데리고 있다. 이기면 그들의 스톤몬도 먹을 수 있지.',
      ]);
    }
  }

  async fadeTo(x, y, dir, map) {
    this.v.flash = 1;
    this.placePlayer(x, y, dir, map);
    this.refresh();
    await this.wait(300);
  }

  async home() {
    await this.say('집에 들어왔다. 화덕에 고기가 익어 간다.');
    if (!this.S.party.length) { await this.say('엄마: 박사님께 먼저 다녀오렴!', { speaker: '엄마' }); return; }
    await this.say('엄마: 밥은 먹고 다니니? …아, 너 말고 스톤몬 말이야. 푹 쉬고 가렴.', { speaker: '엄마' });
    this.healAll();
    sfx.ding();
    await this.say('♪ 스톤몬들의 체력과 기술 횟수가 모두 회복되었다! (자동 저장)');
  }
  healAll() { for (const m of this.S.party) { m.hp = maxHp(m); restorePP(m); } this.save(); this.cloudSync(); }

  // 상점: 구매 후에도 방금 산 항목에 커서가 그대로 → 연속 구매
  async shop(kind) {
    const SH = SHOPS[kind] || SHOPS.shop;
    await this.say(SH.hello, { speaker: SH.keeper });
    let cursor = 0;
    for (;;) {
      const keys = SH.items;
      const i = await this.choose(`${SH.name} · 보유 뼈조각 🦴 ${this.S.bones}`, [
        ...keys.map((k) => ({ label: `${ITEMS[k].icon} ${ITEMS[k].name}  ─  🦴${ITEMS[k].price}`, sub: `${ITEMS[k].desc} (보유 ${this.S.items[k] || 0})`, disabled: this.S.bones < ITEMS[k].price })),
        '그만 산다',
      ], { cancel: true, idx: cursor });
      if (i < 0 || i >= keys.length) break;
      cursor = i;
      const k = keys[i];
      this.S.bones -= ITEMS[k].price;
      this.S.items[k] = (this.S.items[k] || 0) + 1;
      sfx.ding();
      this.toast(`${ITEMS[k].name} 구입! (보유 ${this.S.items[k]})`);
      this.save();
    }
    await this.say(SH.bye, { speaker: SH.keeper });
  }

  async talkNpc(npc) {
    const S = this.S;
    if (npc.trainer) return this.trainerTalk(npc.trainer);
    if (HEALERS[npc.id]) {
      const who = HEALERS[npc.id];
      if (!S.party.length) return this.talk(who, ['연구소는 동쪽이야! 지붕에 공룡 두개골이 걸린 집!']);
      this.healAll(); sfx.ding();
      if (npc.id === 'mom') return this.talk(who, ['어머, 다쳤잖니! 이리 와 봐.', '♪ 체력과 기술 횟수가 모두 회복되었다!', '엄마는 늘 여기 있을게. 꼭 살아서 돌아오렴.']);
      if (npc.id === 'herbalist') return this.talk(who, ['쯧쯧, 독 냄새가 진동하는구먼. 약초즙 한 사발 들이켜라.', '♪ 체력과 기술 횟수가 모두 회복되었다! (자동 저장)']);
      if (npc.id === 'hermit') return this.talk(who, ['…모닥불 곁으로 오게. 얼어붙은 피를 녹여 주지.', '♪ 체력과 기술 횟수가 모두 회복되었다! (자동 저장)']);
      if (npc.id === 'priest') return this.talk(who, ['하늘의 바람이 그대들의 상처를 씻어 내리기를.', '♪ 체력과 기술 횟수가 모두 회복되었다! (자동 저장)']);
      return this.talk(who, ['불의 정령이여, 이 아이들의 상처를 태워 없애소서…', '♪ 체력과 기술 횟수가 모두 회복되었다! (자동 저장)']);
    }
    if (npc.id === 'trader') return this.shop('trader');
    if (npc.id === 'iceTrader') return this.shop('iceShop');
    if (npc.id === 'skyTrader') return this.shop('skyShop');
    if (npc.id === 'kid') return this.talk('꼬마', pick([
      ['스톤몬은 싸우면 레벨이 올라! 근데 먹어야 변해!', '프테라를 먹으면 등에 날개가 돋는대! 멋지지?'],
      ['우리 형 스톤몬은 숲 우두머리한테 먹혔어…', '몸에서 붉은 기운이 나는 놈은 우두머리야. 레벨이 3이나 높대.'],
      ['화면 위 ⏩ 버튼을 누르면 게임이 2배, 3배 빨라져!'],
      ['반짝이는 바위를 A로 조사해 봐! 화석이 나오기도 하고, 공룡알이 나오기도 해!'],
    ]));
    if (npc.id === 'granny') return this.talk('할머니', pick([
      ['봉인석으로 잡은 아이는 동료가 되지. 같이 싸우지 않아도 경험치를 절반씩 나눠 받는단다.', '메뉴의 \'먹이로 바치기\'로 대장에게 먹일 수도 있지. 그게 이 마을의 방식이야.'],
      ['예전엔 나도 스톤마스터였단다. 내 아이는 결국 다른 마스터에게 먹혔지.', '약육강식. 약자멸시. 적자생존. …그래도 잊지 마라, 먹힌 아이들의 이름을.'],
    ]));
  }

  // 트레이너·보스 전 '전투 준비': 순서·기술 위치를 정비할 수 있다
  async prepBattle(title) {
    for (;;) {
      const i = await this.choose(title, [
        { label: '⚔️ 싸운다!', sub: `대장 ${formName(this.S.party[0])} Lv.${this.S.party[0].lv}` },
        { label: '🦖 전투 준비 (대장 · 기술 위치 변경)', sub: '스톤몬 순서와 기술 슬롯 순서를 바꾼다' },
        '그만둔다',
      ], { cancel: true });
      if (i === 0) return true;
      if (i === 1) { await this.panelAsync('party'); continue; }
      return false;
    }
  }

  async trainerTalk(id) {
    const T = TRAINERS[id];
    const state = this.S.flags.trainers[id];
    if (state) return this.talk(T.name, T.after);
    await this.talk(T.name, T.intro);
    if (!(await this.prepBattle(`${T.name}의 승부!`))) { await this.say('…겁먹었냐? 언제든 다시 와라.', { speaker: T.name }); return; }
    const res = await this.battle({ kind: 'trainer', trainer: id, enemies: trainerParty(id), bg: this.bgHere() });
    if (res.result === 'win') {
      this.S.flags.trainers[id] = 'beaten';
      await this.talk(T.name, T.win);
    }
  }

  // 스테이지 보스: 숲의 수호자 / 협곡의 지배자 / 태초의 왕좌 / 빙하의 군주 / 고대 3대 신수
  async bossGate(id) {
    const F = this.S.flags;
    const T = TRAINERS[id];
    const { flag, bg, stage } = BOSSES[id];
    if (F[flag]) { await this.say(T.after[0]); return; }
    const lead = this.S.party[0];
    if (!lead) return;
    if (id === 'guardian' && this.S.stats.devours < 5) {
      await this.say('사당 안에서 낮은 울림이 들린다… 「피 맛을 덜 본 자는 돌아가라.」');
      await this.say(`숲의 수호자는 다섯 번 이상 포식한 자만 상대한다. (현재 이번 생 포식 ${this.S.stats.devours}회)`);
      return;
    }
    if (id === 'finalBoss') {
      const left = ELITES.filter((e) => !F.trainers[e]);
      if (left.length) {
        await this.say(`왕좌의 문이 굳게 닫혀 있다. 세 정예를 모두 꺾어야 열린다. (남은 정예: ${left.map((e) => TRAINERS[e].name).join(', ')})`);
        return;
      }
    }
    // 보스전 직전 길목: 숙명의 라이벌 카인
    if (!F[`rival${stage}`] && !(await this.rivalEncounter(stage, bg))) return;
    if (!this.S.party.some((m) => m.hp > 0)) return;
    for (const l of T.intro) await this.say(l);
    if (!(await this.prepBattle(`${T.name}에게 도전할까? (패배한 스톤몬은 먹힌다)`))) return;
    const res = await this.battle({ kind: 'boss', trainer: id, enemies: trainerParty(id), bg });
    if (res.result !== 'win') return;
    F[flag] = true;
    for (const l of T.win) await this.say(l);
    sfx.fanfare();
    if (id === 'guardian') {
      await this.say('🏆 숲의 증표를 얻었다! ━━ Stage 1 「태초의 숲」 클리어 ━━');
      await this.say('▶ 마을 오른쪽 위(동쪽 숲길)로 가면 Stage 2 「메아리의 습지 & 협곡」이다.');
    } else if (id === 'canyonBoss') {
      await this.say('🏆 협곡의 증표를 얻었다! ━━ Stage 2 「메아리의 습지 & 협곡」 클리어 ━━');
      await this.say('▶ 협곡 북쪽 끝 길로 가면 Stage 3 「작열하는 화산 & 고대 유적」이다.');
    } else if (id === 'finalBoss') await this.ending();
    else if (id === 'glacierBoss') {
      await this.say('🏆 빙하의 증표를 얻었다! ━━ Stage 4 「만년설의 빙하 동굴」 클리어 ━━');
      await this.say('▶ 빙하 동굴 북동쪽 얼음 계단을 오르면 Stage 5 「태고의 하늘 신전」이다.');
    } else await this.trueEnding();
    this.checkAch();
    this.save();
  }

  // ───────── 숙명의 라이벌 카인 ─────────
  async rivalEncounter(stage, bg) {
    const S = this.S, F = S.flags;
    const sid = rivalStarter(S);
    S.rival = { sid };
    const enemies = rivalParty(stage, sid);
    const lead = enemies[enemies.length - 1];
    const ln = formName(lead);
    chip.rival();
    await this.say('……저벅, 저벅. 낯익은 발소리가 길을 막아선다.');
    const intro = {
      1: ['…또 만났군, {name}. 사당 앞은 내가 먼저 왔다.', `내 ${josa(ln, '은/는')} 벌써 랩텅이를 두 마리나 삼켰지. 수호자는 내 몫이다!`],
      2: ['협곡의 지배자? 그 전에 너부터다.', `봐라, 내 ${ln}. 프테라를 몇 마리나 삼켰더니 등에 날개가 돋았어!`],
      3: ['…이 몸을 봐라. 독도 날개도 전부 먹어서 얻은 거다.', `왕좌의 괴물들은 내 ${josa(ln, '이/가')} 먹는다. 비켜!`],
      4: ['얼음 굴 앞에서 기다렸다, {name}.', `너를 먹어야 내 ${josa(ln, '이/가')} 완성된다. 각오해라!`],
      5: ['여기까지 왔군… 신수를 먹는 건 나다.', `아니, 너를 먹고 나서 신수를 먹겠다! 가라, ${ln}!`],
    }[stage] || [];
    await this.talk('라이벌 카인', intro);
    if (!(await this.prepBattle('라이벌 카인이 승부를 걸어왔다! (패배한 스톤몬은 먹힌다)'))) {
      await this.say('도망칠 셈이냐? …좋아, 준비되면 다시 와라.', { speaker: '라이벌 카인' });
      return false;
    }
    TRAINERS.rival.reward = RIVAL_REWARD[stage] || 300;
    const res = await this.battle({ kind: 'trainer', trainer: 'rival', enemies, bg });
    if (res.result !== 'win') return false;
    F[`rival${stage}`] = true;
    S.life.rivalWins = (S.life.rivalWins || 0) + 1;
    const win = {
      1: ['쳇… 운이 좋았을 뿐이야. 다음엔 더 많이 먹고 오겠다!'],
      2: ['…내 스톤몬이 먹혔다고? 웃기지 마. 더, 더 먹어야 해…!'],
      3: ['크윽… 날개도 독도 소용없다니. 넌 대체 뭘 먹은 거냐.'],
      4: ['…얼음보다 차갑군, 너. 하지만 다음이 마지막이다.'],
      5: ['……졌다. 네 녀석의 스톤몬, 정말 강해졌구나.', '가라, {name}. 신수를 먹어 치워라. 그리고… 언젠가 투기장에서 다시 붙자.'],
    }[stage] || [];
    await this.talk('라이벌 카인', win);
    this.checkAch();
    this.save();
    return true;
  }

  // Stage 3 클리어: 무한 사냥 해금 + 빙하 동굴로 이어지는 길
  async ending() {
    const S = this.S, v = this.v;
    v.mode = 'black';
    this.refresh();
    await this.wait(600);
    await this.say('…라돈의 불길이 꺼지고, 기가노의 포효가 잦아들고, 기가의 거대한 몸이 무너져 내렸다.');
    await this.say(`왕좌에 남은 것은 ${S.name}, 그리고 수많은 생명을 먹고 살아남은 스톤몬들뿐이다.`);
    sfx.fanfare();
    await this.say('🏆 왕좌의 증표를 얻었다! ━━ Stage 3 「작열하는 화산 & 고대 유적」 클리어 ━━');
    await this.say('…그때, 무너진 왕좌 뒤편에서 얼음처럼 차가운 바람이 불어왔다.');
    if (!S.flags.endless) {
      S.flags.endless = true;
      await this.say('🔓 무한 사냥 모드 해금! 이제 모든 지역의 수풀에서 미확인 종이 섞여 나온다.');
    }
    await this.say('▶ 고대 유적 동쪽 끝 얼음 문 너머 Stage 4 「만년설의 빙하 동굴」이 열렸다!');
    v.mode = 'map';
    v.flash = 1;
    this.refresh();
  }

  // Stage 5 클리어: 진 엔딩 + 원시 투기장 해금
  async trueEnding() {
    const S = this.S, v = this.v;
    v.mode = 'black';
    this.refresh();
    await this.wait(600);
    await this.say('…심연의 사르코가 가라앉고, 대지의 테라토가 무너지고, 태초의 패왕 디노의 불꽃이 꺼졌다.');
    await this.say(`하늘 제단에 선 것은 ${S.name}, 그리고 셀 수 없는 생명을 먹고 진화한 스톤몬들.`);
    await this.say('약육강식. 약자멸시. 적자생존. ─ 하늘과 땅을 통틀어, 최상위 포식자가 정해졌다.');
    sfx.fanfare();
    chip.awaken();
    await this.say('━━ STONE MONSTERS v3.0 클리어! 축하합니다! ━━');
    S.flags.endless = true;
    S.flags.arena = true;
    await this.showCard({ kind: 'clear', party: S.party, runs: S.runs, devours: S.stats.devours, eaten: Object.keys(S.codex.eaten).length, final: true });
    await this.say('🔓 엔드게임 「무한의 원시 투기장」 해금! 하늘 신전 동쪽 아래 투기장에서 끝없는 연승에 도전하자.');
    v.mode = 'map';
    v.flash = 1;
    this.refresh();
  }

  // ───────── 무한의 원시 투기장 (엔드게임) ─────────
  async arena() {
    const S = this.S;
    if (!S.flags.boss5) {
      await this.say('거대한 원형 투기장이다. 문 위에 글씨가 새겨져 있다.');
      await this.say('「고대 3대 신수를 꺾은 포식자만이 이 문을 지날 수 있다.」');
      return;
    }
    if (!S.party.length) return;
    S.flags.arena = true;
    chip.arena();
    await this.say(`함성이 투기장을 뒤흔든다! (최고 기록 ${S.life.arenaBest || 0}연승)`, { speaker: '투기장 관리인' });
    const i = await this.choose('무한의 원시 투기장', [
      { label: '⚔️ 연승 도전', sub: '끝없이 강해지는 변이 몬스터와 연전 · 5연승마다 알파 개체 · 투기장에선 먹히지 않고 기절만 한다' },
      { label: '📜 보상 안내', sub: '5연승 진화석 · 10연승 고대 호박+칭호 · 20연승 고대 호박×2 · 30연승 고대 호박×3+칭호 · 이후 10연승마다 고대 호박' },
      '떠난다',
    ], { cancel: true, wide: true });
    if (i === 1) {
      await this.say('매 승리마다 뼈조각, 일정 연승마다 희귀 진화 아이템 「고대 호박」을 준다. 고대 호박은 원하는 속성 유전자를 +8 올린다.', { speaker: '투기장 관리인' });
      await this.say('연승 사이에는 체력 25%만 회복된다. 그만둘 때까지의 연승이 기록으로 남는다.', { speaker: '투기장 관리인' });
      return;
    }
    if (i !== 0) return;
    if (!(await this.prepBattle('투기장 입장 준비'))) return;
    let streak = 0;
    for (;;) {
      const lead = this.partyAlive()[0];
      if (!lead) break;
      const enemy = arenaEnemy(streak, Math.max(...S.party.map((m) => m.lv)));
      const res = await this.battle({ kind: 'arena', trainer: 'arena', enemies: [enemy], bg: 'arena', round: streak + 1 });
      if (res.result !== 'win') break;
      streak++;
      S.life.arenaBest = Math.max(S.life.arenaBest || 0, streak);
      const bones = Math.round((100 + streak * 30) * (1 + this.bonus('gold')));
      S.bones += bones;
      sfx.fanfare();
      await this.say(`🏟️ ${streak}연승! 뼈조각 ${bones}개 획득! (최고 기록 ${S.life.arenaBest}연승)`);
      const prize = streak === 5 ? ['evoStone', 1] : streak === 10 ? ['amber', 1] : streak === 15 ? ['evoStone', 2] : streak === 20 ? ['amber', 2] : streak === 30 ? ['amber', 3] : streak > 30 && streak % 10 === 0 ? ['amber', 2] : null;
      if (prize) {
        S.items[prize[0]] = (S.items[prize[0]] || 0) + prize[1];
        chip.awaken();
        await this.say(`🎁 연승 보상: ${ITEMS[prize[0]].icon} ${ITEMS[prize[0]].name} ×${prize[1]}!`);
      }
      this.checkAch();
      this.save();
      for (const m of this.partyAlive()) m.hp = Math.min(maxHp(m), m.hp + Math.round(maxHp(m) * 0.25));
      const c = await this.choose(`${streak}연승 중! 다음 상대에게 도전할까?`, [
        { label: `⚔️ ${streak + 1}연승 도전`, sub: (streak + 1) % 5 === 0 ? '⚠️ 다음은 알파 개체 라운드!' : '살아남은 동료 체력 25% 회복됨' },
        { label: '🏳️ 여기서 그만둔다', sub: `${streak}연승 기록으로 마무리` },
      ]);
      if (c !== 0) break;
    }
    // 투기장 의무실: 전원 회복
    for (const m of S.party) { m.hp = maxHp(m); restorePP(m); }
    this.v.mode = 'map';
    await this.say(`투기장 의무실에서 동료들이 모두 회복되었다. 이번 기록: ${streak}연승.`, { speaker: '투기장 관리인' });
    this.save();
  }

  // ───────── 필드 오브젝트: 고대 화석 바위 · 수상한 알 둥지 ─────────
  objReady(o) {
    const used = this.S.objs?.[o.id];
    return used === undefined || (this.S.steps || 0) - used >= OBJ_RESPAWN;
  }
  async investigate(o) {
    const S = this.S;
    const st = mapOf(this.v.map).stage;
    if (!this.objReady(o)) {
      await this.say(o.kind === 'fossil' ? '이미 파낸 화석 바위다. 한참 뒤에 다시 와 보자.' : '텅 빈 둥지다. 시간이 지나면 다시 무언가 생길지도…');
      return;
    }
    if (!S.party.length) { await this.say('스톤몬 없이 맨손으로 조사하기엔 위험해 보인다.'); return; }
    S.objs[o.id] = S.steps || 0;
    S.life.digs = (S.life.digs || 0) + 1;
    const z = mapOf(this.v.map).zones[0];
    const wildLv = () => Math.round(rand(z.lv[0], z.lv[1]));
    const give = async (k, n, text) => {
      S.items[k] = (S.items[k] || 0) + n;
      sfx.ding();
      await this.say(`${text} ${ITEMS[k].icon} ${ITEMS[k].name} ×${n} 획득!`);
    };
    const r = Math.random();
    if (o.kind === 'fossil') {
      chip.dig();
      await this.say('반짝이는 고대 화석 바위다. 스톤몬이 발톱으로 바위를 긁어낸다… 와작!');
      if (r < 0.05 && this.partyAlive().length) {
        const m = createMonster(eggSpecies(st), { lv: wildLv() });
        makeVariant(m, 'shiny');
        await this.say('화석 속에서 무언가 꿈틀거린다…! 잠들어 있던 고대 변종이 깨어났다!');
        await this.battle({ kind: 'wild', enemies: [m], bg: this.bgHere() });
      } else if (r < 0.35) {
        const n = Math.round((20 + st * 30) * rand(0.8, 1.3) * (1 + this.bonus('gold')));
        S.bones += n; sfx.ding();
        await this.say(`화석 조각을 모았다! 🦴 뼈조각 ${n}개 획득!`);
      } else if (r < 0.6) await give(st <= 2 ? 'meat' : st <= 3 ? 'potion' : 'bigMeat', st <= 2 ? 2 : 1, '바위 틈에 묻혀 있던');
      else if (r < 0.75) await give('stone', 2, '고대인이 남긴');
      else if (r < 0.88) await give('evoStone', 1, '화석 속에서 빛나는');
      else await give(st >= 3 ? 'amber' : 'antidote', st >= 3 ? 1 : 2, '화석 깊은 곳에서');
    } else {
      sfx.paper();
      await this.say('마른풀과 뼈로 엮은 수상한 알 둥지다. 조심스럽게 들여다본다…');
      if (r < 0.1 && this.partyAlive().length) {
        const m = createMonster(eggSpecies(st), { lv: wildLv() });
        makeVariant(m, 'alpha');
        sfx.doom();
        await this.say('크아앙! 둥지의 주인이 돌아왔다! 성난 알파 개체다!');
        await this.battle({ kind: 'wild', enemies: [m], bg: this.bgHere() });
      } else if (r < 0.55 && (S.eggs?.length || 0) < EGG_MAX) {
        const total = 90 + Math.floor(Math.random() * 120);
        const egg = { id: Math.random().toString(36).slice(2, 9), sid: eggSpecies(st), stage: st, left: total, total, shiny: Math.random() < 0.2 };
        S.eggs = [...(S.eggs || []), egg];
        chip.hatch();
        await this.say(`🥚 미확인 공룡알을 얻었다! 따뜻하게 품고 약 ${total}걸음 걸으면 부화할 것 같다. (보유 ${S.eggs.length}/${EGG_MAX})`);
      } else if (r < 0.75) await give('meat', 2, '둥지에 모아 둔 먹이 중');
      else {
        const n = Math.round((15 + st * 20) * rand(0.8, 1.2) * (1 + this.bonus('gold')));
        S.bones += n; sfx.ding();
        await this.say(`둥지에 반짝이는 뼈조각이 섞여 있다! 🦴 ${n}개 획득!`);
      }
    }
    this.checkAch();
    this.save();
  }
  async hatchEgg(egg) {
    const S = this.S, v = this.v;
    S.eggs = S.eggs.filter((e) => e !== egg);
    const m = createMonster(egg.sid, { lv: EGG_LV[egg.stage] || 5 });
    if (egg.shiny) m.shiny = true;
    m.hp = maxHp(m);
    await this.say('…어라? 가방 속 미확인 공룡알이 덜컹덜컹 흔들린다!');
    const prev = v.mode;
    v.mode = 'scene';
    v.scene = { kind: 'hatch', plain: true, t0: v.t, mon: m };
    this.refresh();
    sfx.crack();
    await this.wait(600); sfx.crack();
    await this.wait(700); sfx.explosion();
    await this.wait(900);
    chip.hatch();
    if (m.shiny) chip.shiny();
    await this.say(`쩌억─! 알에서 ${josa(formName(m), '이/가')} 태어났다! (Lv.${m.lv})${m.shiny ? ' ✨ 몸빛이 반전된 고대 변종이다!' : ''}`);
    S.codex.seen[m.sid] = true; S.codex.owned[m.sid] = true;
    S.life.hatches = (S.life.hatches || 0) + 1;
    if (S.party.length < PARTY_MAX) { S.party.push(m); await this.say(`${josa(formName(m), '이/가')} 동료가 되었다!`); }
    else if ((S.box?.length || 0) < BOX_MAX) { S.box.push(m); await this.say(`파티가 가득 차서 ${josa(formName(m), '은/는')} 보관함으로 보냈다. (메뉴 → 스톤몬에서 편성)`); }
    else await this.say('보관함까지 가득 차서… 아기 스톤몬은 숲으로 돌아갔다.');
    v.scene = null;
    v.mode = prev === 'scene' ? 'map' : prev;
    v.flash = 1;
    this.checkAch();
    this.save();
  }

  // ───────── 포식의 제단 (PvP) ─────────
  async altar() {
    const S = this.S;
    if (!S.party.length) { await this.say('붉은 돌 제단이다. 스톤몬이 없으면 아무 일도 일어나지 않는다.'); return; }
    await this.say('붉은 돌 제단에서 피비린내가 풍긴다. 수많은 스톤몬이 이곳에서 먹고, 먹혔다.');
    await this.checkShadowResults();
    for (;;) {
      const i = await this.choose('포식의 제단', [
        { label: '⚔️ 다른 스톤마스터에게 도전한다', sub: '이기면 상대 스톤몬을 포식 · 지면 내 스톤몬이 먹힘' },
        { label: '👤 대장 스톤몬의 그림자를 제단에 바친다', sub: '다른 플레이어가 내 그림자에 도전 · 방어 성공 시 보상' },
        '떠난다',
      ], { cancel: true, wide: true });
      if (i === 0) await this.arenaChallenge();
      else if (i === 1) await this.offerShadow();
      else break;
      if (!this.S.party.length || this.v.mode !== 'map') break;
    }
  }
  async offerShadow() {
    const lead = this.S.party[0];
    const ok = await this.choose(`${formName(lead)}(Lv.${lead.lv} ★${power(lead)})의 그림자를 등록할까?`, ['등록한다', '그만둔다']);
    if (ok !== 0) return;
    try {
      await registerShadow({ ownerId: this.S.ownerId, nick: this.S.name, mon: lead });
      sfx.ding();
      await this.say(`${formName(lead)}의 그림자가 제단에 새겨졌다. 다른 스톤마스터들이 이 그림자에 도전하게 된다.`);
      await this.say('그림자가 이기면 다음 방문 때 방어 보상(뼈조각 + 경험치)이 돌아온다. 그림자가 먹혀도 본체는 무사하다.');
    } catch (e) {
      await this.say('제단이 응답하지 않는다… (네트워크 오류로 등록하지 못했다)');
    }
  }
  async checkShadowResults() {
    let list = [];
    try { list = await fetchMyResults(this.S.ownerId); } catch (e) { return; }
    const fresh = list.filter((r) => !this.S.seenResults[r.id]);
    if (!fresh.length) return;
    let wins = 0;
    for (const r of fresh) {
      this.S.seenResults[r.id] = 1;
      const atk = SPECIES[r.attackerSid]?.name || '스톤몬';
      if (r.winner === 'defender') {
        wins++;
        await this.say(`👤 그림자가 ${r.attackerNick}의 ${josa(atk, '을/를')} 포식했다! (★${r.attackerPower})`);
      } else await this.say(`👤 그림자가 ${r.attackerNick}의 ${atk}에게 먹혔다…`);
    }
    if (wins && this.S.party[0]) {
      const m = this.S.party[0];
      this.S.bones += 40 * wins;
      const ups = gainExp(m, Math.round(expNext(m.lv) * 0.3 * wins));
      sfx.ding();
      await this.say(`그림자가 삼킨 힘이 본체로 흘러들었다! 뼈조각 +${40 * wins}, ${formName(m)}의 경험치 상승!`);
      for (const u of ups) await this.levelUpMsg(m, u);
    }
  }
  async arenaChallenge() {
    const lead = this.S.party[0];
    await this.say('제단이 다른 스톤마스터들의 그림자를 불러낸다…', { auto: 500 });
    const { list, online } = await fetchOpponents({ ownerId: this.S.ownerId, myPower: power(lead), myLv: lead.lv });
    if (!online) await this.say('(오프라인: 떠돌이 사냥꾼들의 그림자만 나타났다)', { auto: 900 });
    const i = await this.choose(`상대를 고르자 (내 대장 Lv.${lead.lv} ★${power(lead)})`, [
      ...list.map((o) => ({
        label: `${o.real ? '🧑' : '🏕️'} ${o.nick} · ${formName(o.mon)} Lv.${o.mon.lv} ★${o.power}`,
        sub: `${elementsOf(o.mon).map((e) => ELEMENTS[e].icon + ELEMENTS[e].name).join(' ')} · 포식 ${o.mon.devours || 0}회 · 변이 ${o.mon.stage}단계${o.mon.lv > lead.lv + 3 ? ' · ⚠️위험' : ''}`,
        mon: o.mon,
      })),
      '그만둔다',
    ], { cancel: true, wide: true });
    if (i < 0 || i >= list.length) return;
    const opp = list[i];
    const sure = await this.choose(`${opp.nick}의 ${josa(formName(opp.mon), '와/과')} 목숨을 건 대결을 할까?`, ['먹거나, 먹히거나!', '그만둔다']);
    if (sure !== 0) return;
    opp.mon.hp = maxHp(opp.mon);
    const res = await this.battle({ kind: 'pvp', enemies: [opp.mon], bg: 'altar', opponent: opp });
    if (opp.real) {
      try {
        await reportResult({ target: opp, attackerNick: this.S.name, attackerOwner: this.S.ownerId, attackerMon: res.myMon || lead, winner: res.result === 'win' ? 'attacker' : 'defender' });
      } catch (e) { /* 무시 */ }
    }
  }

  // ───────── 야생 ─────────
  bgHere() {
    const { map, x, y } = this.v;
    if (map === 'swamp') return x >= 16 ? 'canyon' : 'swamp';
    if (map === 'volcano') return y <= 7 ? 'ruins' : 'volcano';
    if (map === 'glacier') return 'glacier';
    if (map === 'sky') return 'sky';
    return 'forest';
  }
  async wildBattle() {
    const lead = this.S.party.find((x) => x.hp > 0) || this.S.party[0];
    const m = rollWild(this.v.map, this.v.x, this.v.y, { leadLv: lead.lv, devours: this.S.stats.devours, endless: this.S.flags.endless, codex: this.S.codex });
    await this.battle({ kind: 'wild', enemies: [m], bg: this.bgHere() });
  }

  // ───────── 배틀 ─────────
  hudOf(f) {
    if (!f) return null;
    const m = f.m;
    return {
      name: formName(m), power: power(m), lv: m.lv, exp: (m.exp || 0) / expNext(m.lv), hp: Math.max(0, m.hp), max: maxHp(m),
      status: f.status, stTurns: f.stTurns, alpha: !!m.alpha, shiny: !!m.shiny, els: elementsOf(m), stage: m.stage,
      syn: synergiesOf(m), chill: !!f.chill,
    };
  }
  updateHud() {
    const B = this.v.battle;
    if (!B) return;
    this.setUi({ hud: { e: B.eShow ? this.hudOf(B.enemy) : null, p: B.pShow ? this.hudOf(B.player) : null, kind: B.kind, trainer: B.trainer ? TRAINERS[B.trainer].name : B.opponent?.nick, weather: B.weather, round: B.round } });
  }
  fx(name, data, ms) {
    this.v.fx[name] = { ...data, t0: this.v.t };
    return this.wait(ms);
  }
  // 데미지 숫자 팝업
  pop(side, e) {
    const v = this.v;
    const col = e.dot ? (ELEMENTS[e.el]?.color || '#fff') : e.crit ? '#ffd23a' : e.tm > 1 ? '#ff5a3a' : e.tm < 1 ? '#b8b8c8' : '#ffffff';
    const pops = (v.fx.pops || []).filter((p) => v.t - p.t0 < 1000);
    pops.push({ side, text: `${e.dot ? '' : '-'}${e.dmg}`, color: col, big: !!(e.crit || e.tm > 1), t0: v.t, dx: Math.round(rand(-8, 8)), n: pops.length });
    v.fx.pops = pops;
  }
  // 강조 텍스트 (효과 굉장 · 천적 · 급소 · 시너지 · 빙결)
  emph(kind, text) {
    const label = { super: '효과가 굉장했다!', super2: '천적의 일격!!', crit: '급소에 맞았다!', weak: '효과가 별로…', ice: '❄ 빙결!' }[kind] || text;
    this.v.fx.emph = { kind, text: label, t0: this.v.t };
    if (kind === 'super') chip.superEff();
    else if (kind === 'super2') chip.superEff2();
    else if (kind === 'crit') chip.crit();
    else if (kind === 'weak') chip.weak();
  }
  async play(evs) {
    for (const e of evs) {
      if (e.t === 'msg') { if (e.emph) this.emph(e.emph, e.text); await this.say(e.text, { auto: e.quick ? 380 : e.emph ? 850 : 750 }); }
      else if (e.t === 'lunge') { sfx.whoosh(); await this.fx('lunge', { side: e.side, el: e.el }, 260); }
      else if (e.t === 'hit') {
        chip.hit(e.el, e.big);
        if (e.dmg) this.pop(e.side, e);
        await this.fx('hit', { side: e.side, el: e.el, big: e.big, crit: e.crit, dot: e.dot }, 330);
      }
      else if (e.t === 'chill') { chip.freeze(); this.updateHud(); await this.fx('chill', { side: e.side }, 420); }
      else if (e.t === 'syn') { chip.synergy(); await this.fx('syn', { side: e.side, key: e.key }, 450); }
      else if (e.t === 'hp') { this.updateHud(); await this.wait(420); }
      else if (e.t === 'status') this.updateHud();
      else if (e.t === 'buff') { sfx.jump(); await this.fx('buff', { side: e.side, up: e.up }, 420); }
      else if (e.t === 'aura') { sfx.whoosh(); await this.fx('aura', { side: e.side, el: e.el }, 420); }
    }
  }
  partyAlive() { return this.S.party.filter((m) => m.hp > 0); }

  async battle({ kind, enemies, trainer, bg, opponent, round }) {
    const S = this.S, v = this.v;
    for (const e of enemies) e.hp = maxHp(e);
    S.codex.seen[enemies[0].sid] = true;
    const lead = S.party.find((m) => m.hp > 0);
    if (!lead) { await this.say('싸울 수 있는 스톤몬이 없다! 회복하고 오자.'); return { result: 'none' }; }
    sfx.whoosh();
    await this.fx('trans', {}, 650);
    const B = { kind, trainer, opponent, bg, round, ei: 0, enemyParty: enemies, enemy: fighter(enemies[0], 'e'), player: fighter(lead, 'p'), eShow: true, pShow: false, joined: new Set([lead]), weather: bg === 'glacier' ? 'blizzard' : null };
    if (kind === 'tutorial') { B.enemy.atkMul = 0.5; B.player.immortal = true; }
    v.battle = B; v.mode = 'battle'; v.fx = {};
    this.updateHud();
    const T = trainer ? TRAINERS[trainer] : null;
    const en = () => `${formName(B.enemy.m)}(Lv.${B.enemy.m.lv})`;
    if (kind === 'wild' || kind === 'tutorial') {
      if (B.enemy.m.alpha) { sfx.doom(); await this.say(`…!! 👑 알파 개체 ${josa(en(), '이/가')} 나타났다! 거대한 몸에서 피비린내가 진동한다…`); }
      else if (B.enemy.m.shiny) { chip.shiny(); await this.say(`✨ 고대 변종(이로치) ${josa(en(), '이/가')} 나타났다! 몸빛이 기묘하게 반전되어 있다…!`); }
      else await this.say(`앗! 야생의 ${josa(en(), '이/가')} 튀어나왔다!`);
      if (isVariant(B.enemy.m)) await this.say('(변종은 포식하면 능력치를 3배로 흡수하고 희귀 기술을 전수한다!)', { auto: 900 });
    } else if (kind === 'arena') {
      chip.arena();
      await this.say(`🏟️ 투기장 ${round}번째 상대! ${B.enemy.m.alpha ? '👑 알파 개체 ' : ''}${josa(en(), '이/가')} 철창을 부수고 뛰쳐나왔다!`);
    } else if (kind === 'pvp') {
      await this.say(`${opponent.nick}의 그림자가 나타났다!`);
      await this.say(`${josa(opponent.nick, '은/는')} ${josa(en(), '을/를')} 내보냈다! (포식 ${B.enemy.m.devours || 0}회)`);
    } else if (kind === 'boss') {
      sfx.doom();
      await this.say(`${T.name}: ${josa(en(), '이/가')} 앞을 가로막는다! (${enemies.length}마리 연전)`);
    } else {
      await this.say(`${josa(T.name, '이/가')} 승부를 걸어왔다!`);
      await this.say(`${josa(T.name, '은/는')} ${josa(en(), '을/를')} 내보냈다!`);
    }
    B.pShow = true;
    sfx.jump();
    this.updateHud();
    await this.say(`가랏! ${formName(B.player.m)}!`, { auto: 500 });
    await this.play([...intimidate(B.player, B.enemy), ...intimidate(B.enemy, B.player)]);
    if (B.weather === 'blizzard') { chip.freeze(); await this.say('❄️ 눈보라가 몰아친다! 얼음 속성이 아닌 스톤몬은 가끔 몸이 얼어 1턴 움직이지 못한다.', { auto: 900 }); }
    const syns = synergiesOf(B.player.m);
    if (syns.length) await this.say(`${formName(B.player.m)}의 유전자 각성: ${syns.map((k) => SYNERGIES[k].icon + SYNERGIES[k].name).join(' · ')}`, { auto: 700 });
    if (kind === 'tutorial') {
      await this.talk('고돌 박사(무전돌)', [
        '{name}! 들리냐? 무전돌로 말하고 있다!',
        '\'싸운다\'를 누르고 기술을 골라라. 상대는 아직 어린 프테라다. 겁먹지 마라!',
      ]);
    }

    for (;;) {
      const cmd = await this.command();
      let mySkill = null;
      if (cmd.type === 'skill') {
        mySkill = cmd.id;
        if (cmd.exhausted) await this.say(`${josa(formName(B.player.m), '은/는')} 쓸 수 있는 기술이 없다! 몸통박치기로 버틴다!`, { auto: 700 });
      } else if (cmd.type === 'fight') continue;
      else if (cmd.type === 'run') {
        if (kind !== 'wild') { await this.say(kind === 'tutorial' ? '박사: 도망치면 안 된다! 첫 사냥이다!' : kind === 'arena' ? '투기장 철창이 닫혀 있다! 이기는 수밖에 없다!' : '도망칠 수 없다! 이건 목숨을 건 승부다!'); continue; }
        const p = Math.min(0.95, 0.45 + 0.5 * (spdVal(B.player) / Math.max(1, spdVal(B.enemy))) - (isVariant(B.enemy.m) ? 0.2 : 0));
        if (Math.random() < p) { sfx.whoosh(); await this.say('무사히 도망쳤다!'); return this.endBattle({ result: 'fled' }); }
        await this.say('도망칠 수 없었다!');
      } else if (cmd.type === 'bag') {
        const used = await this.useItemMenu(B.player.m, B);
        if (!used) continue;
      } else if (cmd.type === 'party') {
        const others = S.party.filter((m) => m !== B.player.m && m.hp > 0);
        if (!others.length) { await this.say('교체할 수 있는 동료가 없다!'); continue; }
        const i = await this.choose('누구를 내보낼까?', [...others.map((m) => ({ label: `${formName(m)} Lv.${m.lv}`, sub: `HP ${m.hp}/${maxHp(m)}`, mon: m })), '취소'], { cancel: true });
        if (i < 0 || i >= others.length) continue;
        await this.say(`돌아와, ${formName(B.player.m)}!`, { auto: 400 });
        B.player = fighter(others[i], 'p');
        B.joined.add(others[i]);
        this.v.fx.swap = { t0: this.v.t };
        sfx.jump();
        this.updateHud();
        await this.say(`가랏! ${formName(B.player.m)}! (교대)`, { auto: 500 });
      }
      const smart = kind === 'boss' || kind === 'pvp' || kind === 'trainer' || kind === 'arena';
      const eSkill = chooseSkill(B.enemy, B.player, smart);
      if (B.weather === 'blizzard') await this.play([...blizzardRoll(B.player), ...blizzardRoll(B.enemy)]);
      const seq = mySkill ? order(B.player, mySkill, B.enemy, eSkill) : [B.enemy];
      for (let si = 0; si < seq.length; si++) {
        const f = seq[si];
        const foe = f === B.player ? B.enemy : B.player;
        const skill = f === B.player ? mySkill : eSkill;
        if (f.m.hp > 0 && !f.chill) usePP(f.m, skill);
        await this.play(act(f, foe, skill, { first: si === 0 && seq.length > 1 }));
        const out = await this.checkFaints(B);
        if (out) return out;
        if (f.m.hp <= 0 || foe.m.hp <= 0) break;
      }
      B.player.chill = false; B.enemy.chill = false;
      await this.play([...endTurn(B.player), ...endTurn(B.enemy)]);
      const out = await this.checkFaints(B);
      if (out) return out;
    }
  }

  // 경험치 분배: 싸운 스톤몬은 전부, 대기 동료는 절반
  async awardExp(B, enemy, mult = 1, only = null) {
    const base = expYield(enemy, B.kind === 'arena' ? 'trainer' : B.kind) * mult * (1 + this.bonus('exp'));
    const list = only ? [only] : this.partyAlive();
    let shared = false;
    for (const m of list) {
      const full = only || B.joined.has(m);
      const n = Math.max(1, Math.round(base * (full ? 1 : 0.5)));
      const ups = gainExp(m, n);
      if (full) await this.say(`${josa(formName(m), '은/는')} 경험치 ${n}을(를) 얻었다!`, { auto: 600 });
      else shared = true;
      for (const u of ups) await this.levelUpMsg(m, u);
    }
    if (shared) await this.say('대기 중인 동료들도 경험치를 절반씩 나눠 받았다.', { auto: 500 });
    this.updateHud();
  }
  async levelUpMsg(m, u) {
    sfx.ding();
    this.updateHud();
    const e = eff(m);
    await this.say(`🎉 ${josa(formName(m), '은/는')} Lv.${u.lv}(으)로 올랐다! (체력 ${maxHp(m)} · 공격 ${e.atk} · 방어 ${e.def} · 스피드 ${e.spd})`);
    for (const s of u.learn) await this.learnPrompt(m, s, `${formName(m)}이(가) 새 기술을 익히려 한다!`);
  }
  // 기술 습득 (4개 초과 시 하나를 잊음)
  async learnPrompt(m, s, title) {
    if (m.skills.includes(s)) return false;
    const label = (k) => `${ELEMENTS[SKILLS[k].el].icon} ${SKILLS[k].name}${SKILLS[k].pow ? ` (위력 ${SKILLS[k].pow})` : ''}`;
    if (m.skills.length < 4) {
      m.skills.push(s); if (m.ppUsed) delete m.ppUsed[s];
      sfx.ding();
      await this.say(`${josa(formName(m), '은/는')} ${josa(SKILLS[s].name, '을/를')} 익혔다!`);
      return true;
    }
    const j = await this.choose(`${title}\n어떤 기술을 잊을까? (→ ${SKILLS[s].name})`, [...m.skills.map((k) => ({ label: label(k), sub: SKILLS[k].desc })), `${SKILLS[s].name}을(를) 배우지 않는다`], { cancel: true, wide: true });
    if (j < 0 || j >= m.skills.length) { await this.say(`${josa(formName(m), '은/는')} ${josa(SKILLS[s].name, '을/를')} 배우지 않았다.`, { auto: 600 }); return false; }
    const forgot = m.skills[j];
    m.skills[j] = s;
    if (m.ppUsed) { delete m.ppUsed[s]; delete m.ppUsed[forgot]; }
    sfx.ding();
    await this.say(`${SKILLS[forgot].name}을(를) 잊고… ${josa(SKILLS[s].name, '을/를')} 익혔다!`);
    return true;
  }

  async checkFaints(B) {
    const S = this.S;
    if (B.enemy.m.hp <= 0) {
      sfx.bump();
      await this.fx('faint', { side: 'e' }, 600);
      await this.say(`${josa(formName(B.enemy.m), '은/는')} 쓰러졌다!`);
      if (isVariant(B.enemy.m) && (B.kind === 'wild' || B.kind === 'arena')) S.life.variants = (S.life.variants || 0) + 1;
      if (B.player.m.hp > 0) {
        await this.awardExp(B, B.enemy.m);
        await this.victory(B);
      } else { B.eShow = false; this.updateHud(); }
      const T = B.trainer ? TRAINERS[B.trainer] : null;
      const party = B.enemyParty;
      if (T && B.ei < party.length - 1) {
        B.ei++;
        B.enemy = fighter(party[B.ei], 'e');
        B.eShow = true;
        this.v.fx = {};
        S.codex.seen[B.enemy.m.sid] = true;
        this.updateHud();
        await this.say(`${josa(T.name, '은/는')} ${formName(B.enemy.m)}(Lv.${B.enemy.m.lv})을(를) 내보냈다!`);
        if (B.player.m.hp <= 0) { const r = await this.playerDown(B); if (r) return r; }
        return null;
      }
      if (B.player.m.hp <= 0) { const r = await this.playerDown(B, true); if (r) return r; }
      S.stats.wins++;
      let reward = 0;
      if (T) reward = T.reward;
      else if (B.kind === 'pvp') { reward = 50 + Math.round(power(B.enemy.m) / 4); S.stats.pvpWins++; }
      else reward = 6 + SPECIES[B.enemy.m.sid].tier * 5 + Math.round(B.enemy.m.lv * 1.5) + (isVariant(B.enemy.m) ? 40 : 0) + Math.floor(Math.random() * 8);
      reward = Math.round(reward * (1 + this.bonus('gold')));
      S.bones += reward;
      if (B.kind !== 'tutorial' && reward > 0) await this.say(`🦴 뼈조각 ${reward}개를 얻었다!`, { auto: 700 });
      this.checkAch();
      return this.endBattle({ result: 'win', myMon: B.player.m });
    }
    if (B.player.m.hp <= 0) return this.playerDown(B);
    return null;
  }

  async playerDown(B, enemyAlsoDown = false) {
    const S = this.S;
    const mine = B.player.m;
    sfx.bump();
    await this.fx('faint', { side: 'p' }, 600);
    await this.say(`${josa(formName(mine), '은/는')} 쓰러졌다!`);
    if (B.kind === 'arena') { // 투기장: 먹히지 않고 기절만 한다
      mine.hp = 0;
      B.pShow = false;
      this.updateHud();
      await this.say('(투기장 규칙: 쓰러진 스톤몬은 먹히지 않고 의무실로 옮겨진다)', { auto: 700 });
      const alive = this.partyAlive();
      if (!alive.length) { await this.say('더 이상 싸울 동료가 없다… 투기장 도전 종료!'); return this.endBattle({ result: 'lose' }); }
      if (enemyAlsoDown) return null;
      const i = await this.choose('누구를 내보낼까?', alive.map((m) => ({ label: `${formName(m)} Lv.${m.lv}`, sub: `HP ${m.hp}/${maxHp(m)}`, mon: m })));
      B.player = fighter(alive[i], 'p');
      B.joined.add(alive[i]);
      B.pShow = true;
      this.v.fx = {};
      this.updateHud();
      await this.say(`가랏! ${formName(B.player.m)}!`, { auto: 500 });
      return null;
    }
    if (!enemyAlsoDown && B.enemy.m.hp > 0) {
      await this.devourAnim('e');
      await this.say(`${josa(formName(B.enemy.m), '이/가')} ${josa(formName(mine), '을/를')} 뼈째 삼켰다…!`);
      absorb(B.enemy.m, mine, B.kind === 'pvp' ? 'pvp' : 'wild');
      this.updateHud();
      await this.say(`${josa(formName(mine), '은/는')} 영원히 사라졌다. 상대는 더 강해졌다…`);
    } else {
      await this.say(`쓰러진 ${josa(formName(mine), '은/는')} 들짐승들에게 먹혀 사라졌다…`);
    }
    S.grave.unshift({ name: formName(mine), sid: mine.sid, lv: mine.lv, devours: mine.devours, stage: mine.stage, power: power(mine), cause: B.trainer ? TRAINERS[B.trainer].name : B.opponent ? B.opponent.nick : `야생 ${SPECIES[B.enemy.m.sid].name}`, date: Date.now(), run: S.runs });
    S.grave = S.grave.slice(0, 40);
    S.party = S.party.filter((m) => m !== mine);
    B.pShow = false;
    this.updateHud();
    this.save();
    const alive = this.partyAlive();
    if (!alive.length && S.box?.length) return this.rescueFromBox();
    if (!alive.length) return this.gameOver(mine);
    if (enemyAlsoDown) return null;
    await this.say('다음 스톤몬을 내보내야 한다!');
    const i = await this.choose('누구를 내보낼까?', alive.map((m) => ({ label: `${formName(m)} Lv.${m.lv}`, sub: `HP ${m.hp}/${maxHp(m)}`, mon: m })));
    B.player = fighter(alive[i], 'p');
    B.joined.add(alive[i]);
    B.pShow = true;
    this.v.fx = {};
    this.updateHud();
    await this.say(`가랏! ${formName(B.player.m)}! 복수다!`, { auto: 500 });
    return null;
  }

  async victory(B) {
    const S = this.S;
    const prey = B.enemy.m;
    const pred = B.player.m;
    if (B.kind === 'tutorial') {
      await this.talk('고돌 박사(무전돌)', ['좋아! 이제 진짜 수업이다.', '쓰러진 녀석을… 먹어라.']);
      const c = await this.choose('프테라를 어떻게 할까?', ['🍖 포식한다!', '…잠깐, 정말 먹어야 해?']);
      if (c === 1) await this.talk('고돌 박사(무전돌)', ['망설이면 다음엔 네 스톤몬이 먹힌다.', '이 세계에서 자비는 사치다. 먹어라!']);
      await this.devour(pred, prey, 'tutorial', B);
      return;
    }
    // v3.0 [포식 vs 길들이기] 딜레마: 먹으면 강해지고, 길들이면 동료가 는다
    const variant = isVariant(prey);
    const opts = [{ label: `🍖 포식하기`, sub: `능력치·유전자·특성·기술 흡수 + 변이 게이지${variant ? ' · ✨변종: 능력치 3배 흡수 + 희귀 기술 전수!' : ''}` }];
    const canSeal = B.kind === 'wild';
    const roomy = S.party.length < PARTY_MAX || (S.box?.length || 0) < BOX_MAX;
    if (canSeal) {
      const rate = this.captureRate(prey);
      opts.push({
        label: `🕸️ 길들이기 (스톤 그물 ${S.items.stone || 0})`,
        sub: !roomy ? '파티·보관함이 가득 찼다' : `성공률 약 ${Math.round(rate * 100)}% · ${S.party.length < PARTY_MAX ? `파티 합류 (${S.party.length}/${PARTY_MAX})` : '파티가 가득 차 보관함으로'}`,
        disabled: !(S.items.stone > 0) || !roomy,
      });
    }
    opts.push({ label: '그냥 둔다', sub: B.kind === 'wild' ? '살려 보낸다' : '먹지 않는다' });
    const i = await this.choose(`쓰러진 ${josa(formName(prey), '을/를')} 어떻게 할까?`, opts, { wide: true });
    if (i === 0) await this.devour(pred, prey, B.kind === 'boss' ? 'boss' : B.kind === 'pvp' ? 'pvp' : B.kind === 'trainer' || B.kind === 'arena' ? 'trainer' : 'wild', B);
    else if (canSeal && i === 1) {
      S.items.stone--;
      S.life.streak = 0;
      await this.say('스톤 그물을 던졌다!', { auto: 500 });
      await this.fx('seal', {}, 1300);
      if (Math.random() < this.captureRate(prey)) {
        sfx.ding(); chip.superEff();
        prey.hp = Math.round(maxHp(prey) * 0.5);
        delete prey.alpha;
        S.codex.owned[prey.sid] = true;
        S.life.tames = (S.life.tames || 0) + 1;
        if (prey.shiny) S.life.shinyTames = (S.life.shinyTames || 0) + 1;
        B.eShow = false; this.updateHud();
        if (S.party.length < PARTY_MAX) {
          S.party.push(prey);
          await this.say(`${josa(formName(prey), '을/를')} 길들였다! 파티에 합류했다. (Lv.${prey.lv} · 전투 중 '스톤몬'으로 교대 가능)`);
        } else {
          S.box.push(prey);
          await this.say(`${josa(formName(prey), '을/를')} 길들였다! 파티가 가득 차서 보관함으로 보냈다. (메뉴 → 스톤몬에서 편성)`);
        }
        this.checkAch();
      } else {
        B.eShow = false; this.updateHud();
        await this.say(`앗! 그물이 찢어졌다! ${josa(formName(prey), '은/는')} 도망쳐 버렸다…`);
      }
    } else {
      S.life.streak = 0;
      B.eShow = false; this.updateHud();
      await this.say(`${josa(formName(prey), '은/는')} 비틀거리며 사라졌다.`);
    }
  }
  captureRate(prey) {
    return Math.min(0.98, CAPTURE[SPECIES[prey.sid].tier] * (isVariant(prey) ? 0.6 : 1) * (1 + this.bonus('capture')));
  }

  async devourAnim(predSide) {
    this.v.fx.devour = { side: predSide, t0: this.v.t };
    sfx.whoosh();
    await this.wait(450); sfx.stamp();
    await this.wait(350); sfx.crack();
    await this.wait(350); sfx.explosion();
    await this.wait(1100);
    this.v.fx.devour = null;
    if (this.v.battle) { if (predSide === 'p') this.v.battle.eShow = false; else this.v.battle.pShow = false; }
  }

  async devour(pred, prey, mode, B = null) {
    const S = this.S;
    const old = JSON.parse(JSON.stringify(pred));
    const pn = formName(pred), qn = formName(prey);
    await this.say(`${josa(pn, '이/가')} ${josa(qn, '을/를')} 덮쳤다!`, { auto: 450 });
    await this.devourAnim('p');
    this.updateHud();
    await this.say(pick([
      `우드득… 와작…! ${josa(pn, '은/는')} ${josa(qn, '을/를')} 뼈째 삼켰다!`,
      `${josa(pn, '은/는')} ${josa(qn, '을/를')} 한입에 집어삼켰다! 피와 살이 녹아든다…`,
      `콰직! ${josa(qn, '은/는')} ${pn}의 뱃속으로 사라졌다.`,
    ]));
    const synBefore = synergiesOf(pred);
    const res = absorb(pred, prey, mode, { mul: 1 + this.bonus('absorb') });
    const synNew = synergiesOf(pred).filter((k) => !synBefore.includes(k));
    res.synNew = synNew;
    S.stats.devours++;
    S.life.devours = (S.life.devours || 0) + 1;
    S.life.streak = (S.life.streak || 0) + 1;
    S.life.bestStreak = Math.max(S.life.bestStreak || 0, S.life.streak);
    S.codex.eaten[prey.sid] = (S.codex.eaten[prey.sid] || 0) + 1;
    this.updateHud();
    if (res.variant) { chip.shiny(); await this.say(`✨ 변종의 피! 능력치를 ${3}배로 흡수했다!`, { auto: 800 }); }
    await this.showCard({ kind: 'devour', mon: pred, prey, res });
    // 유전자 시너지 각성
    for (const k of synNew) {
      const Y = SYNERGIES[k];
      chip.awaken();
      this.v.flash = 0.8;
      S.life.synergies = (S.life.synergies || 0) + 1;
      await this.say(`🧬 유전자 각성! ${formName(pred)}의 피 속에서 [${Y.icon} ${Y.name}]이(가) 깨어났다!`);
      await this.say(`${Y.name}: ${Y.desc}`, { auto: 1400 });
    }
    if (res.learnable.length) {
      const i = await this.choose(`${qn}의 기술을 흡수할 수 있다!`, [
        ...res.learnable.map((s) => ({ label: `${s === res.rareSkill ? '🌟[희귀] ' : ''}${ELEMENTS[SKILLS[s].el].icon} ${SKILLS[s].name}${SKILLS[s].pow ? ` (위력 ${SKILLS[s].pow})` : ''}`, sub: SKILLS[s].desc })),
        '흡수하지 않는다',
      ], { cancel: true, wide: true });
      if (i >= 0 && i < res.learnable.length) await this.learnPrompt(pred, res.learnable[i], `${qn}의 기술 흡수`);
    }
    if (res.stageUp || res.mutations.length) await this.evolve(old, pred, res);
    this.checkAch();
    // 포식 경험치 (전투 경험치의 50%)
    if (B && mode !== 'feed') {
      await this.say('포식으로 힘이 차오른다!', { auto: 400 });
      await this.awardExp(B, prey, 0.5, pred);
    }
    if (power(pred) > S.stats.best) { S.stats.best = power(pred); S.stats.bestName = formName(pred); }
    this.updateHud();
    this.save();
  }

  async evolve(old, now, res) {
    const v = this.v;
    const prevMode = v.mode;
    await this.say(`…어라? ${formName(old)}의 몸이…!`);
    v.mode = 'evolve';
    v.scene = { kind: 'evolve', t0: v.t, old, now };
    this.refresh();
    sfx.alarm();
    await this.wait(1600); sfx.alarm();
    await this.wait(1600);
    sfx.fanfare();
    v.flash = 1;
    v.scene.done = true;
    await this.wait(500);
    await this.say(`${josa(formName(old), '은/는')} ${josa(formName(now), '으로/로')} 변이했다!`);
    await this.showCard({ kind: 'evolve', old, mon: now, res });
    v.mode = prevMode;
    v.scene = null;
    this.refresh();
  }

  async useItemMenu(target, B) {
    const S = this.S;
    const keys = B ? ['meat', 'potion', 'bigMeat', 'antidote'] : ['meat', 'potion', 'bigMeat', 'evoStone', 'amber', 'antidote'];
    const sub = (k) => (k === 'antidote' && !B ? '전투 중에만 쓸 수 있다 (상태이상은 전투가 끝나면 사라짐)' : ITEMS[k].desc);
    const i = await this.choose('가방', [
      ...keys.map((k) => ({ label: `${ITEMS[k].icon} ${ITEMS[k].name} ×${S.items[k] || 0}`, sub: sub(k), disabled: !(S.items[k] > 0) || (k === 'antidote' && !B) })),
      { label: `${ITEMS.stone.icon} 스톤 그물 ×${S.items.stone || 0}`, sub: '야생 스톤몬을 쓰러뜨린 뒤 [길들이기]로 사용', disabled: true },
      ...(!B && S.eggs?.length ? [{ label: `🥚 미확인 공룡알 ×${S.eggs.length}`, sub: S.eggs.map((e) => `부화까지 ${e.left}걸음`).join(' · '), disabled: true }] : []),
      '닫기',
    ], { cancel: true });
    if (i < 0 || i >= keys.length) return false;
    const k = keys[i];
    let m = target;
    if (!B) {
      const evo = k === 'evoStone' || k === 'amber';
      const j = await this.choose(evo ? `누구에게 ${ITEMS[k].name}을(를) 쓸까?` : '누구에게 먹일까?', [...S.party.map((p) => ({ label: `${formName(p)} Lv.${p.lv}`, sub: evo ? `유전자 ${geneTotal(p)}/${stageThreshold(p.stage + 1)} · 변이 ${p.stage}단계` : `HP ${p.hp}/${maxHp(p)}` })), '취소'], { cancel: true });
      if (j < 0 || j >= S.party.length) return false;
      m = S.party[j];
    }
    if (k === 'amber') { // 고대 호박: 원하는 속성 유전자 +8
      const e = await this.choose('어떤 속성의 유전자를 깨울까? (+8)', [...ELEMENT_KEYS.map((el) => ({ label: `${ELEMENTS[el].icon} ${ELEMENTS[el].name}`, sub: `현재 ${m.genes?.[el] || 0}` })), '취소'], { cancel: true });
      if (e < 0 || e >= ELEMENT_KEYS.length) return false;
      const el = ELEMENT_KEYS[e];
      S.items[k]--;
      const old = JSON.parse(JSON.stringify(m));
      chip.awaken();
      await this.say(`${josa(formName(m), '이/가')} 고대 호박을 깨물었다! 갇혀 있던 ${ELEMENTS[el].icon}${ELEMENTS[el].name} 유전자 +8`);
      const res = applyGenes(m, el, 8);
      if (res.stageUp || res.mutations.length) await this.evolve(old, m, res);
      else await this.say(`다음 변이까지 유전자 ${geneTotal(m)}/${stageThreshold(m.stage + 1)}`);
      this.save();
      return true;
    }
    if (k === 'evoStone') {
      S.items[k]--;
      const old = JSON.parse(JSON.stringify(m));
      const el = SPECIES[m.sid].el;
      sfx.ding();
      await this.say(`${josa(formName(m), '이/가')} 진화석을 삼켰다! ${ELEMENTS[el].icon}${ELEMENTS[el].name} 유전자 +5`);
      const res = applyGenes(m, el, 5);
      if (res.stageUp || res.mutations.length) await this.evolve(old, m, res);
      else await this.say(`다음 변이까지 유전자 ${geneTotal(m)}/${stageThreshold(m.stage + 1)}`);
      this.save();
      return true;
    }
    if (k === 'antidote') {
      if (!B.player.status) { await this.say('치료할 상태이상이 없다!'); return false; }
      S.items[k]--;
      B.player.status = null; B.player.stTurns = 0;
      sfx.ding();
      this.updateHud();
      await this.say(`${josa(formName(m), '은/는')} 해독제를 먹고 상태이상이 나았다!`, { auto: 700 });
      return true;
    }
    const ppSpent = Object.values(m.ppUsed || {}).some((n) => n > 0);
    if (m.hp >= maxHp(m) && !(k === 'bigMeat' && (B?.player.status || ppSpent))) { await this.say('체력이 이미 가득하다!'); return false; }
    S.items[k]--;
    const ratio = { meat: 0.5, potion: 0.7, bigMeat: 1 }[k];
    m.hp = Math.min(maxHp(m), m.hp + Math.round(maxHp(m) * ratio));
    if (k === 'bigMeat') { restorePP(m); if (B) { B.player.status = null; B.player.stTurns = 0; } }
    sfx.ding();
    this.updateHud();
    await this.say(`${josa(formName(m), '은/는')} ${josa(ITEMS[k].name, '을/를')} 허겁지겁 먹었다! 체력이 회복되었다.`, { auto: B ? 700 : 0 });
    return true;
  }

  endBattle(r) {
    const v = this.v;
    v.battle = null; v.mode = 'map'; v.fx = {}; v.flash = 1;
    this.setUi({ hud: null });
    this.save();
    return r;
  }

  // 파티가 전멸해도 보관함에 동료가 있으면 집에서 다시 일어난다 (보관함 → 파티 편성)
  async rescueFromBox() {
    const S = this.S, v = this.v;
    await this.wait(400);
    v.battle = null; v.mode = 'black'; v.fx = {};
    this.setUi({ hud: null });
    sfx.doom();
    await this.say('파티의 마지막 스톤몬마저 쓰러졌다…');
    S.party = S.box.splice(0, PARTY_MAX);
    for (const m of S.party) { m.hp = maxHp(m); restorePP(m); }
    await this.say(`…그때, 보관함의 동료들이 달려왔다! ${S.party.map((m) => formName(m)).join(', ')}이(가) 파티에 합류했다.`);
    this.placePlayer(4, 18, 'down', 'village');
    v.mode = 'map'; v.flash = 1;
    this.showBanner();
    this.refresh();
    await this.say('정신을 차려 보니 태초마을 집 앞이다. (보관함의 동료가 파티로 편성되었다)');
    this.save();
    return { result: 'wiped' };
  }

  async gameOver(lastMon) {
    const S = this.S, v = this.v;
    await this.wait(400);
    v.battle = null; v.mode = 'black'; v.fx = {};
    this.setUi({ hud: null });
    sfx.doom();
    await this.wait(900);
    await this.say(`마지막 스톤몬 ${formName(lastMon)}마저 먹혔다…`);
    await this.say('약육강식. 약자멸시. 적자생존.');
    await this.say(`${S.name}의 ${S.runs}번째 모험은 여기서 끝났다. 모든 스톤몬과 아이템을 잃었다.`);
    await this.say('…하지만 먹힌 아이들의 기록은 도감과 무덤에 남는다.');
    this.S = freshRun(metaOf(S));
    this.save();
    await this.opening();
    return { result: 'wiped' };
  }

  // ───────── 메뉴 / 패널 ─────────
  async startMenu() {
    const S = this.S;
    const i = await this.choose('메뉴', [
      { label: '🦖 스톤몬', sub: `동료 ${S.party.length}/${PARTY_MAX} · 순서·기술 위치 변경` },
      { label: '🎒 가방', sub: `🦴${S.bones} · 🍖${S.items.meat || 0} 🧪${S.items.potion || 0} 🍗${S.items.bigMeat || 0} 💊${S.items.antidote || 0} 💎${S.items.evoStone || 0} 🪨${S.items.stone || 0}` },
      { label: '📖 스톤 도감', sub: `발견 ${Object.keys(S.codex.seen).length} · 포식 ${Object.keys(S.codex.eaten).length} · 길들임 ${Object.keys(S.codex.owned).length} / ${SPECIES_COUNT}` },
      { label: '🏆 칭호 · 업적', sub: `${Object.keys(S.ach || {}).length}개 달성${S.title ? ` · 「${S.title}」` : ''}` },
      { label: '🪦 기록 · 무덤', sub: `${S.runs}번째 생 · 먹힌 스톤몬 ${S.grave.length}` },
      { label: `⏩ 게임 속도: ${this.speed}x`, sub: '1x → 2x → 3x (이동 · 텍스트 · 전투 연출)' },
      { label: '⚙️ 설정 · 저장 · 백업', sub: '세이브 백업(JSON 복사) / 불러오기 · 모험 코드' },
      { label: '🏠 타이틀로', sub: '진행은 자동 저장됩니다' },
      '닫기',
    ], { cancel: true });
    if (i === 0) this.openPanel('party');
    else if (i === 1) await this.useItemMenu(null, null);
    else if (i === 2) this.openPanel('codex');
    else if (i === 3) this.openPanel('achieve');
    else if (i === 4) this.openPanel('records');
    else if (i === 5) { this.cycleSpeed(); await this.startMenu(); }
    else if (i === 6) await this.saveMenu();
    else if (i === 7) this.toTitle();
  }
  async saveMenu() {
    this.save();
    sfx.ding();
    await this.say('기기에 자동 저장되었다! (LocalStorage · 5분마다 예비 저장 갱신)', { auto: 0 });
    const i = await this.choose('설정 · 저장', [
      { label: '📋 세이브 데이터 백업 (JSON 복사)', sub: '전체 저장 데이터를 텍스트로 복사 · 메모장 등에 보관' },
      { label: '📥 세이브 데이터 불러오기', sub: '백업해 둔 JSON(또는 SM1: 백업 문자열)을 붙여넣어 복원' },
      { label: '🔑 모험 코드 발급/갱신', sub: '서버에 저장 · 다른 기기 타이틀에서 코드 입력' },
      '닫기',
    ], { cancel: true });
    if (i === 0) {
      let copied = false;
      try { await navigator.clipboard.writeText(JSON.stringify(this.S)); copied = true; } catch (e) { /* ignore */ }
      if (copied) this.toast('📋 세이브 JSON을 클립보드에 복사했다!');
      await this.openBackup('export');
    } else if (i === 1) {
      const r = await this.openBackup('import');
      if (r?.ok) {
        // 불러온 모험으로 갈아끼우고 타이틀에서 이어하기
        this.v.mode = 'title'; this.v.battle = null; this.v.fx = {};
        this.setUi({ title: true, hud: null, panel: null });
      }
    } else if (i === 2) {
      await this.say('제단의 돌판에 모험을 새기는 중…', { auto: 400 });
      const ok = await this.cloudSync(true);
      if (ok) await this.showCard({ kind: 'code', code: this.S.cloudCode });
      else await this.say('서버에 저장하지 못했다… \'세이브 데이터 백업\'을 이용해 주세요.');
    }
  }
  // ───────── 보관함 (파티 4 · 보관함 30) ─────────
  toBox(m) {
    const S = this.S;
    if (S.party.length <= 1) { this.toast('파티에는 최소 1마리가 있어야 한다'); return; }
    if (S.box.length >= BOX_MAX) { this.toast('보관함이 가득 찼다'); return; }
    S.party = S.party.filter((p) => p !== m);
    S.box.push(m);
    this.save(); sfx.tick(); this.refresh();
  }
  fromBox(m) {
    const S = this.S;
    if (S.party.length >= PARTY_MAX) { this.toast(`파티는 최대 ${PARTY_MAX}마리`); return; }
    S.box = S.box.filter((p) => p !== m);
    S.party.push(m);
    this.save(); sfx.ding(); this.refresh();
  }
  swapBox(boxMon, partyMon) {
    const S = this.S;
    const i = S.party.indexOf(partyMon), j = S.box.indexOf(boxMon);
    if (i < 0 || j < 0) return;
    S.party[i] = boxMon; S.box[j] = partyMon;
    this.save(); sfx.ding(); this.refresh();
  }
  release(m) {
    if (!window.confirm(`${formName(m)}을(를) 야생으로 돌려보낼까요? 되돌릴 수 없습니다.`)) return;
    this.S.box = this.S.box.filter((p) => p !== m);
    this.save(); sfx.tick(); this.refresh();
  }
  openPanel(kind) { this.setUi({ panel: { kind } }); }
  // 패널을 열고 닫힐 때까지 기다린다 (전투 준비 화면)
  panelAsync(kind) {
    return new Promise((res) => { this.setUi({ panel: { kind, prep: true, onClose: res } }); });
  }
  closePanel() {
    sfx.tick();
    const p = this.ui.panel;
    this.setUi({ panel: null });
    p?.onClose?.();
  }
  setLead(m) {
    this.S.party = [m, ...this.S.party.filter((p) => p !== m)];
    this.save(); sfx.ding(); this.refresh();
  }
  // 동료 순서 이동
  moveMon(m, d) {
    const P = this.S.party, i = P.indexOf(m), j = i + d;
    if (i < 0 || j < 0 || j >= P.length) return;
    [P[i], P[j]] = [P[j], P[i]];
    this.save(); sfx.tick(); this.refresh();
  }
  // 기술 위치 변경: i번째 기술을 위(-1)/아래(+1)로
  moveSkill(m, i, d) {
    const j = i + d;
    if (!m || j < 0 || j >= m.skills.length) return;
    [m.skills[i], m.skills[j]] = [m.skills[j], m.skills[i]];
    this.save(); sfx.tick(); this.refresh();
  }
  feed(prey) {
    if (this.ui.panel?.prep) { this.toast('전투 준비 중에는 먹이로 바칠 수 없다'); return; }
    this.setUi({ panel: null });
    this.run(async () => {
      const S = this.S;
      const others = S.party.filter((m) => m !== prey);
      if (!others.length) { await this.say('먹일 상대가 없다.'); return; }
      const i = await this.choose(`${josa(formName(prey), '을/를')} 누구에게 먹일까?`, [...others.map((m) => ({ label: `${formName(m)} Lv.${m.lv} ★${power(m)}`, sub: `포식 ${m.devours}회 · 변이 ${m.stage}단계`, mon: m })), '취소'], { cancel: true });
      if (i < 0 || i >= others.length) return;
      const pred = others[i];
      const ok = await this.choose(`정말로 ${josa(formName(prey), '을/를')} ${formName(pred)}에게 바칠까? 되돌릴 수 없다.`, ['바친다', '그만둔다']);
      if (ok !== 0) return;
      const v = this.v;
      v.battle = { kind: 'feed', bg: 'altar', enemy: fighter(prey, 'e'), player: fighter(pred, 'p'), eShow: true, pShow: true, joined: new Set() };
      v.mode = 'battle'; v.fx = {};
      this.updateHud();
      await this.say(`${josa(formName(prey), '은/는')} 체념한 듯 눈을 감았다…`);
      S.party = S.party.filter((m) => m !== prey);
      S.grave.unshift({ name: formName(prey), sid: prey.sid, lv: prey.lv, devours: prey.devours, stage: prey.stage, power: power(prey), cause: `${formName(pred)}에게 바쳐짐`, date: Date.now(), run: S.runs });
      await this.devour(pred, prey, 'feed');
      // 바친 동료 레벨에 비례한 경험치
      const ups = gainExp(pred, Math.round(expYield(prey, 'trainer') * 0.6));
      for (const u of ups) await this.levelUpMsg(pred, u);
      this.endBattle({});
    });
  }
}

export { SPECIES, SKILLS, TRAITS, ELEMENTS, TIER_NAME, STATUS, PARTY_MAX, BOX_MAX, EGG_MAX, eff, geneTotal, stageThreshold, MAP_W, MAP_H, rand, zoneAt };
