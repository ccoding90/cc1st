// 🎮 스톤몬스터 게임 진행기: 상태 · 저장 · 맵 이동 · 스토리 스크립트 · 배틀 흐름
// React 화면(StoneMonsterGame.jsx)은 game.ui 를 그리고, 입력은 game.press()/hold() 로 넘긴다.
import { SPECIES, SKILLS, TRAITS, ELEMENTS, STARTERS, SPECIES_COUNT, TIER_NAME } from './data';
import {
  createMonster, maxHp, power, formName, absorb, elementsOf, josa, pick, rand, eff, geneTotal, stageThreshold,
  ppLeft, usePP, restorePP,
} from './monster';
import { FALLBACK_SKILL } from './data';
import { fighter, act, order, endTurn, chooseSkill, intimidate, spdVal, STATUS } from './battle';
import {
  GRID, MAP_W, MAP_H, NPCS, TRAINERS, SIGNS, blocked, doorAt, isTall, rollWild, trainerParty,
} from './world';
import { registerShadow, reportResult, fetchOpponents, fetchMyResults, uploadCloudSave, downloadCloudSave } from './net';
import { sfx } from '../coffee/sound';

const SAVE_KEY = 'stonemon_save_v1';
const PARTY_MAX = 4;
const MOVE_MS = 150;
export const ITEMS = {
  meat: { name: '생고기', desc: '체력 50% 회복', price: 30, icon: '🍖' },
  bigMeat: { name: '통구이', desc: '체력 100% · 기술 횟수 전부 회복 · 상태이상 치료', price: 90, icon: '🍗' },
  stone: { name: '봉인석', desc: '쓰러뜨린 야생 스톤몬을 동료로 봉인', price: 50, icon: '🪨' },
};
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CAPTURE = { 1: 0.95, 2: 0.75, 3: 0.55, 4: 0.3 };

function freshRun(meta = {}) {
  return {
    v: 1,
    name: meta.name || '',
    ownerId: meta.ownerId || 'p' + Math.random().toString(36).slice(2, 12),
    runs: (meta.runs || 0) + 1,
    party: [],
    items: { meat: 0, bigMeat: 0, stone: 0 },
    bones: 0,
    flags: { intro: false, starter: false, tutorial: false, trainers: {}, chief: false },
    pos: { x: 4, y: 18, dir: 'down' },
    codex: meta.codex || { seen: {}, eaten: {}, owned: {} },
    grave: meta.grave || [],
    stats: { devours: 0, wins: 0, pvpWins: 0, best: meta.stats?.best || 0, bestName: meta.stats?.bestName || '' },
    seenResults: meta.seenResults || {},
  };
}

// 저장 데이터 정리: 빠진 필드는 기본값으로 채움 (구버전·백업 문자열·클라우드 불러오기 공용)
export function normalizeSave(raw) {
  if (!raw || raw.v !== 1 || typeof raw !== 'object') return null;
  const base = freshRun({ name: raw.name, ownerId: raw.ownerId, runs: Math.max(0, (raw.runs || 1) - 1) });
  const s = { ...base, ...raw };
  s.flags = { ...base.flags, ...(raw.flags || {}), trainers: { ...(raw.flags?.trainers || {}) } };
  s.items = { ...base.items, ...(raw.items || {}) };
  s.codex = { seen: {}, eaten: {}, owned: {}, ...(raw.codex || {}) };
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  s.pos = raw.pos && Number.isFinite(raw.pos.x) ? raw.pos : base.pos;
  s.party = Array.isArray(raw.party) ? raw.party.filter((m) => m && SPECIES[m.sid] && m.stats).slice(0, PARTY_MAX) : [];
  for (const m of s.party) {
    m.skills = (m.skills || []).filter((k) => SKILLS[k]).slice(0, 4);
    if (!m.skills.length) m.skills = SPECIES[m.sid].skills.slice(0, 4);
    m.traits = m.traits || {}; m.genes = m.genes || {}; m.prey = m.prey || {};
    m.hp = Math.max(1, Math.min(maxHp(m), Number(m.hp) || maxHp(m)));
  }
  s.grave = Array.isArray(raw.grave) ? raw.grave.slice(0, 40) : [];
  return s;
}

function loadSave() {
  try { return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { return null; }
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
    this.ui = { title: true, dialog: null, choice: null, cmd: null, panel: null, card: null, nameInput: null, hud: null, toast: null };
    this.v = { mode: 'title', x: 4, y: 18, dir: 'down', mv: null, walk: 0, fx: {}, flash: 0, t: 0, battle: null, scene: null };
    this.held = [];
    this.busy = false;
    this.npcDir = {};
  }

  // ───────── UI 브릿지 ─────────
  setUi(p) { Object.assign(this.ui, p); this.refresh(); }
  // 이어하기: 오프닝을 본 뒤라면 어디서든 이어서 (스톤몬을 받기 전이어도 OK)
  hasSave() { return !!(this.S && this.S.name && this.S.flags?.intro && (this.S.party?.length || !this.S.flags.starter)); }
  save() {
    if (!this.S) return;
    this.S.savedAt = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.S)); } catch (e) { /* ignore */ }
  }
  // 모험 코드(클라우드 저장): 코드가 있으면 조용히 갱신
  async cloudSync(force = false) {
    if (!this.S || (!this.S.cloudCode && !force)) return false;
    if (!this.S.cloudCode) this.S.cloudCode = makeCode();
    this.save();
    try { await uploadCloudSave(this.S.cloudCode, this.S); this.S.cloudAt = Date.now(); this.save(); return true; } catch (e) { console.warn('cloud save failed', e); return false; }
  }
  // 타이틀의 '코드로 이어하기': 모험 코드 또는 백업 문자열
  async loadFromCode(input) {
    const t = String(input || '').trim();
    let data = null;
    if (t.startsWith('SM1:')) data = decodeBackup(t);
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
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
  toast(text) {
    this.setUi({ toast: text });
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.setUi({ toast: null }), 2200);
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
      const speed = opts.auto ? 2 : 1;
      d.iv = setInterval(() => {
        d.shown = Math.min(text.length, d.shown + speed);
        if (d.shown >= text.length) {
          clearInterval(d.iv);
          if (d.auto) d.at = setTimeout(d.done, d.auto);
        }
        this.refresh();
      }, 22);
      this.setUi({ dialog: d });
    });
  }
  async talk(speaker, lines) { for (const l of lines) await this.say(l.replace(/\{name\}/g, this.S.name), { speaker }); }

  choose(title, options, { cancel = false, wide = false } = {}) {
    return new Promise((res) => {
      const opts = options.map((o) => (typeof o === 'string' ? { label: o } : o));
      let idx = opts.findIndex((o) => !o.disabled);
      const c = {
        title, options: opts, idx: Math.max(0, idx), cancel, wide,
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
    if (u.nameInput) return;
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
        if (d.shown < d.text.length) { d.shown = d.text.length; clearInterval(d.iv); if (d.auto) d.at = setTimeout(d.done, d.auto); this.refresh(); }
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
    if (k === 'up') c.idx = (c.idx + n - (c.level === 'main' ? 2 : 2)) % n;
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
    this.S = freshRun(meta ? { name: meta.name, ownerId: meta.ownerId, runs: meta.runs, codex: meta.codex, grave: meta.grave, stats: meta.stats, seenResults: meta.seenResults } : {});
    if (meta?.name) this.S.name = meta.name;
    this.save();
    this.setUi({ title: false });
    this.run(() => this.opening());
  }
  continueGame() {
    if (!this.hasSave()) { this.newGame(); return; }
    this.setUi({ title: false });
    const { x, y, dir } = this.S.pos;
    // 막힌 칸에 저장됐으면(구버전 등) 집 앞으로
    if (blocked(x, y)) this.placePlayer(4, 18, 'down'); else this.placePlayer(x, y, dir);
    this.v.mode = 'map';
    this.v.flash = 1;
    this.refresh();
    const lead = this.S.party[0];
    this.run(async () => {
      await this.say(lead ? `${this.S.name}의 모험을 이어서 시작합니다. (${this.S.runs}번째 생 · 대장 ${formName(lead)} ★${power(lead)})` : `${this.S.name}의 모험을 이어서 시작합니다. 연구소로 가 보자!`, { auto: 1400 });
    });
  }
  // 타이틀로 (진행은 자동 저장됨)
  toTitle() {
    if (this.busy) return;
    this.save();
    this.v.mode = 'title'; this.v.battle = null; this.v.fx = {};
    this.setUi({ title: true, hud: null, panel: null });
  }
  placePlayer(x, y, dir) { Object.assign(this.v, { x, y, dir: dir || this.v.dir, mv: null }); }

  // ───────── 맵 ─────────
  npcAt(x, y) {
    return NPCS.find((n) => n.x === x && n.y === y && !(n.trainer && this.S.flags.trainers[n.trainer] === 'gone'));
  }
  update(dt) {
    const v = this.v;
    v.t += dt;
    if (v.mode !== 'map') return;
    if (v.mv) {
      v.mv.t += dt;
      if (v.mv.t >= v.mv.dur) {
        v.x = v.mv.tx; v.y = v.mv.ty; v.mv = null; v.walk ^= 1;
        this.S.pos = { x: v.x, y: v.y, dir: v.dir };
        this.onStep();
      }
      return;
    }
    if (this.busy || this.ui.dialog || this.ui.choice || this.ui.panel || this.ui.card || this.ui.title) return;
    const dir = this.held[this.held.length - 1];
    if (!dir) return;
    v.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = v.x + dx, ny = v.y + dy;
    const door = doorAt(nx, ny);
    if (door) { this.held = []; this.run(() => this.enterBuilding(door.id)); return; }
    if (!this.S.flags.starter && ny <= 12) {
      this.held = [];
      this.run(async () => { await this.say('…풀숲에서 무언가 으르렁거린다. 맨몸으로 가는 건 자살 행위다.'); await this.say('먼저 동쪽 연구소의 박사님께 스톤몬을 받자.'); });
      return;
    }
    if (blocked(nx, ny) || this.npcAt(nx, ny)) {
      if (!v.bumpT || v.t - v.bumpT > 300) { sfx.bump(); v.bumpT = v.t; }
      return;
    }
    v.mv = { tx: nx, ty: ny, t: 0, dur: this.running ? 80 : MOVE_MS };
  }
  onStep() {
    const { x, y } = this.v;
    if (isTall(x, y) && this.S.flags.starter) {
      if (!this.S.flags.tutorial) { this.run(() => this.tutorial()); return; }
      if (Math.random() < 0.11) this.run(() => this.wildBattle());
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
    const sign = SIGNS[`${tx},${ty}`];
    if (sign) { this.run(async () => { for (const l of sign) await this.say(l); }); return; }
    const door = doorAt(tx, ty);
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
    this.placePlayer(4, 18, 'down');
    v.mode = 'map';
    v.flash = 1;
    this.refresh();
    await this.wait(400);
    await this.talk('엄마', reborn ? [
      '{name}! 악몽이라도 꿨니? 얼굴이 하얗구나.',
      '오늘은 박사님께 새 스톤몬을 받기로 한 날이잖니. 동쪽 큰 돌집 연구소로 가 보렴.',
    ] : [
      '{name}! 드디어 일어났구나!',
      '오늘이 무슨 날인지 잊은 건 아니지? 열여섯 번째 우기를 맞은 아이는 공룡 박사님께 첫 스톤몬을 받는 날이잖니.',
      '박사님 연구소는 마을 동쪽의 큰 돌집이야. 지붕에 공룡 두개골이 걸려 있어.',
      '…그리고 명심하렴. 이 마을에서 스톤몬을 잃는다는 건, 모든 걸 잃는다는 뜻이야.',
    ]);
    await this.say('▶ 방향키(또는 화면 패드)로 이동 · B를 누른 채 이동하면 달리기 · A(Z/Space) 조사·대화 · 메뉴(Enter) · 진행은 자동 저장');
    this.S.flags.intro = true;
  }

  async enterBuilding(id) {
    this.v.dir = 'up';
    if (id === 'lab') return this.lab();
    if (id === 'house') return this.home();
    if (id === 'shop') return this.shop();
    if (id === 'altar') return this.altar();
    if (id === 'temple') return this.temple();
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
      '변이 단계는 흡수한 유전자의 총량으로 정해진다. 3, 8, 15, 24, 35… 끝이 없지. 무한 진화란 그런 뜻이다.',
      '같은 속성을 계속 먹으면 그 속성에 내성이 생긴다. 번개를 많이 먹은 녀석은 번개에 덜 아파하지.',
      '동료로 봉인한 스톤몬을 대장에게 먹이면(메뉴 → 스톤몬 → 먹이로 바치기) 야생보다 더 많이 흡수한다. 잔인하지만… 효율적이지.',
      '포식의 제단에서는 다른 스톤마스터가 키운 스톤몬과 싸운다. 수많은 유전자를 품은 녀석을 먹으면 단숨에 변이한다.',
      '대식가 특성을 가진 녀석은 먹을 때마다 더 많이 흡수한다. 전설의 기가노가 그 특성을 가졌다더군.',
    ];
    await this.say(pick(tips), { speaker: '고돌 박사' });
    if (F.chief) await this.say('족장을 꺾다니… 너는 이제 태초마을 최강의 포식자다. 화산으로 가는 길은 곧 열릴 거다.', { speaker: '고돌 박사' });
  }

  async starterEvent() {
    const v = this.v;
    v.mode = 'scene';
    v.scene = { kind: 'lab', t0: v.t };
    this.refresh();
    await this.talk('고돌 박사', [
      '오, 왔구나 {name}! 나는 화석 박사 고돌이다.',
      '이 세계엔 \'스톤몬스터\'라 불리는 존재들이 살고 있지. 돌알에서 깨어나, 서로를 잡아먹으며 진화하는 원시의 괴물들…',
      '보통 짐승은 나이를 먹으며 자라지만, 스톤몬은 다르다. 경험치? 레벨업? 그런 건 없다.',
      '오직 \'포식\'뿐이다.',
      '쓰러뜨린 상대를 잡아먹으면, 그 녀석의 힘·속성·특성·기술이 네 스톤몬의 피와 뼈에 녹아든다.',
      '번개 스톤몬을 삼키면 번개 가시가 돋고, 익룡을 삼키면 날개가 돋는다. 먹을수록 끝없이 변이하지.',
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
      const line = { 1: '티랑이는 공격 특화! 날카로운 이빨로 먼저 물어뜯는 폭군이지.', 2: '트톱이는 방어 특화! 뿔과 프릴로 버티며 들이받는다.', 3: '브라키는 체력 특화! 거대한 몸으로 오래 버티고 꼬리로 후려친다.' }[sid];
      await this.say(line, { speaker: '고돌 박사' });
      const ok = await this.choose(`정말 ${josa(sp.name, '으로/로')} 하겠느냐?`, ['그래, 이 녀석이다!', '다시 고를래']);
      if (ok === 0) break;
    }
    const m = createMonster(sid, { jitter: false });
    v.scene = { kind: 'hatch', t0: v.t, mon: m };
    this.refresh();
    sfx.crack();
    await this.wait(600); sfx.crack();
    await this.wait(700); sfx.explosion();
    await this.wait(900);
    sfx.fanfare();
    await this.say(`쩌억─! 돌알이 갈라지며 ${josa(SPECIES[sid].name, '이/가')} 튀어나왔다!`);
    this.S.party = [m];
    this.S.flags.starter = true;
    this.S.codex.seen[sid] = true; this.S.codex.owned[sid] = true;
    this.S.items = { meat: 3, bigMeat: 0, stone: 3 };
    this.S.bones = 100;
    await this.talk('고돌 박사', [
      '허허, 벌써 배가 고픈 모양이구나.',
      '생고기 3개와 봉인석 3개를 주마. 봉인석은 쓰러뜨린 야생 스톤몬을 동료로 가둘 수 있는 돌이다.',
      '하지만 동료로 삼는다고 강해지진 않는다. 강해지려면… 먹어야 한다.',
      '마침 잘됐다. 요즘 마을 북쪽 풀숲에 프테리 녀석이 돌알을 훔쳐 간다는구나. 첫 사냥을 해 보거라!',
    ]);
    v.scene = null;
    v.mode = 'map';
    this.placePlayer(20, 19, 'down');
    this.save();
  }

  async tutorial() {
    await this.say('풀숲이 바스락거린다…!');
    const enemy = createMonster(4, { scale: 0.75, jitter: false });
    const res = await this.battle({ kind: 'tutorial', enemies: [enemy], bg: 'grass' });
    if (res.result !== 'win') return;
    this.S.flags.tutorial = true;
    this.save();
    await this.talk('고돌 박사', [
      '…허, 허허허! 봤느냐 {name}! 날개가 돋았어!',
      '이것이 포식 진화다. 먹은 것의 일부가 영원히 네 스톤몬의 몸이 되는 거지.',
      '이제부터는 네가 무엇을 먹이느냐에 따라 세상에 단 하나뿐인 스톤몬이 된다. 끝은 없다.',
      '참고로 지금 네 스톤몬의 체력은 줄어 있다. 집에서 쉬면 엄마가 회복시켜 줄 거다.',
    ]);
    const next = await this.choose('이제 무엇을 할까?', [
      { label: '🌿 풀숲 깊숙이 들어가 더 강한 먹잇감을 찾는다', sub: '야생 스톤몬 사냥 · 수풀을 걸으면 조우' },
      { label: '🗿 포식의 제단에서 다른 스톤마스터에게 도전한다', sub: '다른 플레이어의 스톤몬을 먹고 급성장 (패배 시 먹힘)' },
      { label: '🔬 마을로 돌아가 박사에게 진화 결과를 보고한다', sub: '연구소로 이동 · 공략 조언 듣기' },
    ], { wide: true });
    if (next === 0) {
      await this.say('더 강한 먹잇감의 냄새가 풀숲 깊은 곳에서 풍겨 온다…');
      await this.say('▶ 수풀(진한 풀)을 걸으면 야생 스톤몬이 나타난다. 위험해 보이면 도망치자.');
    } else if (next === 1) {
      await this.fadeTo(22, 21, 'right');
      await this.altar();
    } else {
      await this.fadeTo(20, 19, 'up');
      await this.talk('고돌 박사', [
        '보고는 들었다! 첫 포식으로 바람 유전자를 얻었구나.',
        '마을 북쪽 신전의 족장 우가는 다섯 번 이상 포식한 자만 상대해 준다. 그를 꺾으면 태초마을 1단계 졸업이다.',
        '풀숲의 사냥꾼들도 스톤몬을 데리고 있다. 이기면 그들의 스톤몬도 먹을 수 있지.',
      ]);
    }
  }

  async fadeTo(x, y, dir) {
    this.v.flash = 1;
    this.placePlayer(x, y, dir);
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

  async shop() {
    await this.say('원시 상점: 어서 와! 뼈조각만 있으면 뭐든 팔지!', { speaker: '상인' });
    for (;;) {
      const keys = Object.keys(ITEMS);
      const i = await this.choose(`보유 뼈조각 🦴 ${this.S.bones}`, [
        ...keys.map((k) => ({ label: `${ITEMS[k].icon} ${ITEMS[k].name}  ─  🦴${ITEMS[k].price}`, sub: `${ITEMS[k].desc} (보유 ${this.S.items[k] || 0})`, disabled: this.S.bones < ITEMS[k].price })),
        '그만 산다',
      ], { cancel: true });
      if (i < 0 || i >= keys.length) break;
      const k = keys[i];
      this.S.bones -= ITEMS[k].price;
      this.S.items[k] = (this.S.items[k] || 0) + 1;
      sfx.ding();
      this.toast(`${ITEMS[k].name} 구입!`);
    }
    await this.say('또 와! 살아 있다면 말이지. 크하하!', { speaker: '상인' });
  }

  async talkNpc(npc) {
    const S = this.S;
    if (npc.trainer) return this.trainerTalk(npc.trainer);
    if (npc.id === 'mom') {
      if (!S.party.length) return this.talk('엄마', ['연구소는 동쪽이야! 지붕에 공룡 두개골이 걸린 집!']);
      this.healAll(); sfx.ding();
      return this.talk('엄마', ['어머, 다쳤잖니! 이리 와 봐.', '♪ 체력과 기술 횟수가 모두 회복되었다!', '엄마는 늘 여기 있을게. 꼭 살아서 돌아오렴.']);
    }
    if (npc.id === 'kid') return this.talk('꼬마', pick([
      ['스톤몬은 레벨업 같은 거 안 해! 먹어야 커!', '찌릿랩을 먹으면 등에 번개 가시가 돋는대! 멋지지?'],
      ['우리 형 스톤몬은 풀숲 우두머리한테 먹혔어…', '몸에서 붉은 기운이 나는 놈은 우두머리야. 엄청 세지만, 먹으면 그만큼 커진대.'],
      ['화면 왼쪽 위 별(★)은 전투력이야. 상대 별이 훨씬 높으면… 도망쳐.'],
    ]));
    if (npc.id === 'granny') return this.talk('할머니', pick([
      ['봉인석으로 잡은 아이는 동료가 되지. 하지만 정이 들기 전에…', '메뉴의 \'먹이로 바치기\'로 대장에게 먹일 수도 있단다. 야생보다 많이 흡수하지. 그게 이 마을의 방식이야.'],
      ['예전엔 나도 스톤마스터였단다. 내 아이는 결국 다른 마스터에게 먹혔지.', '약육강식. 약자멸시. 적자생존. …그래도 잊지 마라, 먹힌 아이들의 이름을.'],
    ]));
  }

  async trainerTalk(id) {
    const T = TRAINERS[id];
    const state = this.S.flags.trainers[id];
    if (state) return this.talk(T.name, T.after);
    await this.talk(T.name, T.intro);
    const res = await this.battle({ kind: 'trainer', trainer: id, enemies: trainerParty(id), bg: 'grass' });
    if (res.result === 'win') {
      this.S.flags.trainers[id] = 'beaten';
      await this.talk(T.name, T.win);
    }
  }

  async temple() {
    const F = this.S.flags;
    if (F.chief) return this.talk('족장 우가', TRAINERS.chief.after);
    const lead = this.S.party[0];
    if (!lead) return;
    if (this.S.stats.devours < 5) {
      await this.talk('족장 우가', [
        '…냄새가 약하다. 아직 피 맛을 덜 본 놈이군.',
        `최소 다섯 번은 포식하고 와라. (현재 이번 생 포식 ${this.S.stats.devours}회)`,
      ]);
      return;
    }
    const ok = await this.choose('족장 우가에게 도전할까? (패배한 스톤몬은 먹힌다)', ['도전한다', '아직은…']);
    if (ok !== 0) return;
    await this.talk('족장 우가', TRAINERS.chief.intro);
    const res = await this.battle({ kind: 'boss', trainer: 'chief', enemies: trainerParty('chief'), bg: 'temple' });
    if (res.result !== 'win') return;
    F.chief = true;
    await this.talk('족장 우가', TRAINERS.chief.win);
    sfx.fanfare();
    await this.say('🏆 태초의 증표를 얻었다!');
    await this.say('━━ 스톤몬스터 데모 · 1단계 태초마을 클리어 ━━');
    await this.say('다음 스테이지 「불꽃 화산」은 업데이트 예정입니다. 계속해서 사냥과 포식의 제단에서 무한 진화를 즐겨 보세요!');
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
      if (!this.S.party.length || this.v.mode !== 'map') break; // 전멸 후 새 생 시작
    }
  }
  async offerShadow() {
    const lead = this.S.party[0];
    const ok = await this.choose(`${formName(lead)}(★${power(lead)})의 그림자를 등록할까?`, ['등록한다', '그만둔다']);
    if (ok !== 0) return;
    try {
      await registerShadow({ ownerId: this.S.ownerId, nick: this.S.name, mon: lead });
      sfx.ding();
      await this.say(`${formName(lead)}의 그림자가 제단에 새겨졌다. 다른 스톤마스터들이 이 그림자에 도전하게 된다.`);
      await this.say('그림자가 이기면 다음 방문 때 방어 보상(뼈조각 + 능력치)이 돌아온다. 그림자가 먹혀도 본체는 무사하다.');
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
      for (let i = 0; i < wins; i++) m.stats[pick(['hp', 'atk', 'def', 'spd'])] += 1;
      sfx.ding();
      await this.say(`그림자가 삼킨 힘이 본체로 흘러들었다! 뼈조각 +${40 * wins}, ${formName(m)}의 능력치 상승!`);
    }
  }
  async arenaChallenge() {
    const lead = this.S.party[0];
    await this.say('제단이 다른 스톤마스터들의 그림자를 불러낸다…', { auto: 500 });
    const { list, online } = await fetchOpponents({ ownerId: this.S.ownerId, myPower: power(lead) });
    if (!online) await this.say('(오프라인: 떠돌이 사냥꾼들의 그림자만 나타났다)', { auto: 900 });
    const i = await this.choose(`상대를 고르자 (내 대장 ★${power(lead)})`, [
      ...list.map((o) => ({
        label: `${o.real ? '🧑' : '🏕️'} ${o.nick} · ${formName(o.mon)} ★${o.power}`,
        sub: `${elementsOf(o.mon).map((e) => ELEMENTS[e].icon + ELEMENTS[e].name).join(' ')} · 포식 ${o.mon.devours || 0}회 · 변이 ${o.mon.stage}단계${o.power > power(lead) * 1.25 ? ' · ⚠️위험' : ''}`,
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
  async wildBattle() {
    const lead = this.S.party.find((x) => x.hp > 0) || this.S.party[0];
    const m = rollWild(power(lead), this.S.stats.devours);
    await this.battle({ kind: 'wild', enemies: [m], bg: 'grass' });
  }

  // ───────── 배틀 ─────────
  hudOf(f) {
    if (!f) return null;
    return { name: formName(f.m), power: power(f.m), hp: Math.max(0, f.m.hp), max: maxHp(f.m), status: f.status, alpha: !!f.m.alpha, els: elementsOf(f.m), stage: f.m.stage };
  }
  updateHud() {
    const B = this.v.battle;
    if (!B) return;
    this.setUi({ hud: { e: B.eShow ? this.hudOf(B.enemy) : null, p: B.pShow ? this.hudOf(B.player) : null, kind: B.kind, trainer: B.trainer ? TRAINERS[B.trainer].name : B.opponent?.nick } });
  }
  fx(name, data, ms) {
    this.v.fx[name] = { ...data, t0: this.v.t };
    return this.wait(ms);
  }
  async play(evs) {
    for (const e of evs) {
      if (e.t === 'msg') await this.say(e.text, { auto: e.quick ? 380 : 750 });
      else if (e.t === 'lunge') { sfx.whoosh(); await this.fx('lunge', { side: e.side, el: e.el }, 260); }
      else if (e.t === 'hit') { (e.big ? sfx.crack : sfx.stamp)(); await this.fx('hit', { side: e.side, el: e.el, big: e.big }, 330); }
      else if (e.t === 'hp') { this.updateHud(); await this.wait(420); }
      else if (e.t === 'status') this.updateHud();
      else if (e.t === 'buff') { sfx.jump(); await this.fx('buff', { side: e.side, up: e.up }, 420); }
      else if (e.t === 'aura') { sfx.whoosh(); await this.fx('aura', { side: e.side, el: e.el }, 420); }
    }
  }
  partyAlive() { return this.S.party.filter((m) => m.hp > 0); }

  async battle({ kind, enemies, trainer, bg, opponent }) {
    const S = this.S, v = this.v;
    for (const e of enemies) e.hp = maxHp(e);
    S.codex.seen[enemies[0].sid] = true;
    let lead = S.party.find((m) => m.hp > 0);
    if (!lead) { await this.say('싸울 수 있는 스톤몬이 없다! 집에서 회복하자.'); return { result: 'none' }; }
    // 전환 연출
    sfx.whoosh();
    await this.fx('trans', {}, 650);
    const B = { kind, trainer, opponent, bg, ei: 0, enemyParty: enemies, enemy: fighter(enemies[0], 'e'), player: fighter(lead, 'p'), eShow: true, pShow: false };
    if (kind === 'tutorial') { B.enemy.atkMul = 0.5; B.player.immortal = true; }
    v.battle = B; v.mode = 'battle'; v.fx = {};
    this.updateHud();
    const T = trainer ? TRAINERS[trainer] : null;
    const en = () => formName(B.enemy.m);
    if (kind === 'wild' || kind === 'tutorial') {
      if (B.enemy.m.alpha) { sfx.doom(); await this.say(`…!! 풀숲의 우두머리 ${josa(en(), '이/가')} 나타났다! 몸에서 피비린내가 진동한다…`); }
      else await this.say(`앗! 야생의 ${josa(en(), '이/가')} 튀어나왔다!`);
    } else if (kind === 'pvp') {
      await this.say(`${opponent.nick}의 그림자가 나타났다!`);
      await this.say(`${josa(opponent.nick, '은/는')} ${josa(en(), '을/를')} 내보냈다! (포식 ${B.enemy.m.devours || 0}회)`);
    } else {
      await this.say(`${josa(T.name, '이/가')} 승부를 걸어왔다!`);
      await this.say(`${josa(T.name, '은/는')} ${josa(en(), '을/를')} 내보냈다!`);
    }
    B.pShow = true;
    sfx.jump();
    this.updateHud();
    await this.say(`가랏! ${formName(B.player.m)}!`, { auto: 500 });
    await this.play([...intimidate(B.player, B.enemy), ...intimidate(B.enemy, B.player)]);
    if (kind === 'tutorial') {
      await this.talk('고돌 박사(무전돌)', [
        '{name}! 들리냐? 무전돌로 말하고 있다!',
        '\'싸운다\'를 누르고 기술을 골라라. 상대는 아직 어린 프테리다. 겁먹지 마라!',
      ]);
    }

    let turn = 0;
    for (;;) {
      turn++;
      const cmd = await this.command();
      let mySkill = null;
      if (cmd.type === 'skill') {
        mySkill = cmd.id;
        if (cmd.exhausted) await this.say(`${josa(formName(B.player.m), '은/는')} 쓸 수 있는 기술이 없다! 몸통박치기로 버틴다!`, { auto: 700 });
      } else if (cmd.type === 'fight') continue;
      else if (cmd.type === 'run') {
        if (kind !== 'wild') { await this.say(kind === 'tutorial' ? '박사: 도망치면 안 된다! 첫 사냥이다!' : '도망칠 수 없다! 이건 목숨을 건 승부다!'); continue; }
        const p = Math.min(0.95, 0.45 + 0.5 * (spdVal(B.player) / Math.max(1, spdVal(B.enemy))) - (B.enemy.m.alpha ? 0.2 : 0));
        if (Math.random() < p) { sfx.whoosh(); await this.say('무사히 도망쳤다!'); return this.endBattle({ result: 'fled' }); }
        await this.say('도망칠 수 없었다!');
      } else if (cmd.type === 'bag') {
        const used = await this.useItemMenu(B.player.m, B);
        if (!used) continue;
      } else if (cmd.type === 'party') {
        const others = S.party.filter((m) => m !== B.player.m && m.hp > 0);
        if (!others.length) { await this.say('교체할 수 있는 동료가 없다!'); continue; }
        const i = await this.choose('누구를 내보낼까?', [...others.map((m) => ({ label: `${formName(m)} ★${power(m)}`, sub: `HP ${m.hp}/${maxHp(m)}`, mon: m })), '취소'], { cancel: true });
        if (i < 0 || i >= others.length) continue;
        await this.say(`돌아와, ${formName(B.player.m)}!`, { auto: 400 });
        B.player = fighter(others[i], 'p');
        this.updateHud();
        await this.say(`가랏! ${formName(B.player.m)}!`, { auto: 500 });
      }
      // 적 행동 + 내 행동
      const smart = kind === 'boss' || kind === 'pvp' || kind === 'trainer';
      const eSkill = chooseSkill(B.enemy, B.player, smart);
      const seq = mySkill ? order(B.player, mySkill, B.enemy, eSkill) : [B.enemy];
      for (const f of seq) {
        const foe = f === B.player ? B.enemy : B.player;
        const skill = f === B.player ? mySkill : eSkill;
        if (f.m.hp > 0) usePP(f.m, skill);
        await this.play(act(f, foe, skill));
        const out = await this.checkFaints(B);
        if (out) return out;
        if (f.m.hp <= 0 || foe.m.hp <= 0) break;
      }
      await this.play([...endTurn(B.player), ...endTurn(B.enemy)]);
      const out = await this.checkFaints(B);
      if (out) return out;
    }
  }

  // 쓰러짐 처리. 전투가 끝나면 결과 객체를 반환
  async checkFaints(B) {
    const S = this.S;
    if (B.enemy.m.hp <= 0) {
      sfx.bump();
      await this.fx('faint', { side: 'e' }, 600);
      await this.say(`${josa(formName(B.enemy.m), '은/는')} 쓰러졌다!`);
      if (B.player.m.hp > 0) await this.victory(B);
      else { B.eShow = false; this.updateHud(); }
      const T = B.trainer ? TRAINERS[B.trainer] : null;
      const party = B.enemyParty;
      if (T && B.ei < party.length - 1) {
        B.ei++;
        B.enemy = fighter(party[B.ei], 'e');
        B.eShow = true;
        v_reset(this.v);
        S.codex.seen[B.enemy.m.sid] = true;
        this.updateHud();
        await this.say(`${josa(T.name, '은/는')} ${josa(formName(B.enemy.m), '을/를')} 내보냈다!`);
        if (B.player.m.hp <= 0) { const r = await this.playerDown(B); if (r) return r; }
        return null;
      }
      if (B.player.m.hp <= 0) { const r = await this.playerDown(B, true); if (r) return r; }
      // 승리
      S.stats.wins++;
      let reward = 0;
      if (T) reward = T.reward;
      else if (B.kind === 'pvp') { reward = 50 + Math.round(power(B.enemy.m) / 4); S.stats.pvpWins++; }
      else reward = 8 + SPECIES[B.enemy.m.sid].tier * 7 + (B.enemy.m.alpha ? 40 : 0) + Math.floor(Math.random() * 8);
      S.bones += reward;
      if (B.kind !== 'tutorial') await this.say(`🦴 뼈조각 ${reward}개를 얻었다!`, { auto: 700 });
      return this.endBattle({ result: 'win', myMon: B.player.m });
    }
    if (B.player.m.hp <= 0) return this.playerDown(B);
    return null;
  }

  // 내 스톤몬이 쓰러짐 → 상대에게 먹힘(영구 소실)
  async playerDown(B, enemyAlsoDown = false) {
    const S = this.S;
    const mine = B.player.m;
    sfx.bump();
    await this.fx('faint', { side: 'p' }, 600);
    await this.say(`${josa(formName(mine), '은/는')} 쓰러졌다!`);
    if (!enemyAlsoDown && B.enemy.m.hp > 0) {
      await this.devourAnim('e');
      await this.say(`${josa(formName(B.enemy.m), '이/가')} ${josa(formName(mine), '을/를')} 뼈째 삼켰다…!`);
      absorb(B.enemy.m, mine, B.kind === 'pvp' ? 'pvp' : 'wild');
      this.updateHud();
      await this.say(`${josa(formName(mine), '은/는')} 영원히 사라졌다. 상대는 더 강해졌다…`);
    } else {
      await this.say(`쓰러진 ${josa(formName(mine), '은/는')} 들짐승들에게 먹혀 사라졌다…`);
    }
    S.grave.unshift({ name: formName(mine), sid: mine.sid, devours: mine.devours, stage: mine.stage, power: power(mine), cause: B.trainer ? TRAINERS[B.trainer].name : B.opponent ? B.opponent.nick : `야생 ${SPECIES[B.enemy.m.sid].name}`, date: Date.now(), run: S.runs });
    S.grave = S.grave.slice(0, 40);
    S.party = S.party.filter((m) => m !== mine);
    B.pShow = false;
    this.updateHud();
    this.save();
    const alive = this.partyAlive();
    if (!alive.length) return this.gameOver(mine);
    if (enemyAlsoDown) return null;
    await this.say('다음 스톤몬을 내보내야 한다!');
    const i = await this.choose('누구를 내보낼까?', alive.map((m) => ({ label: `${formName(m)} ★${power(m)}`, sub: `HP ${m.hp}/${maxHp(m)}`, mon: m })));
    B.player = fighter(alive[i], 'p');
    B.pShow = true;
    v_reset(this.v);
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
      const c = await this.choose('프테리를 어떻게 할까?', ['🍖 포식한다!', '…잠깐, 정말 먹어야 해?']);
      if (c === 1) await this.talk('고돌 박사(무전돌)', ['망설이면 다음엔 네 스톤몬이 먹힌다.', '이 세계에서 자비는 사치다. 먹어라!']);
      await this.devour(pred, prey, 'tutorial');
      return;
    }
    const opts = [{ label: `🍖 포식한다`, sub: '능력치·유전자·특성·기술 흡수 → 변이 진화' }];
    const canSeal = B.kind === 'wild';
    if (canSeal) opts.push({ label: `🪨 봉인한다 (봉인석 ${S.items.stone || 0})`, sub: S.party.length >= PARTY_MAX ? `동료가 가득 찼다 (최대 ${PARTY_MAX})` : `성공률 약 ${Math.round(CAPTURE[SPECIES[prey.sid].tier] * (prey.alpha ? 0.6 : 1) * 100)}%`, disabled: !(S.items.stone > 0) || S.party.length >= PARTY_MAX });
    opts.push({ label: '그냥 둔다', sub: B.kind === 'wild' ? '살려 보낸다' : '먹지 않는다' });
    const i = await this.choose(`쓰러진 ${josa(formName(prey), '을/를')} 어떻게 할까?`, opts, { wide: true });
    if (i === 0) await this.devour(pred, prey, B.kind === 'boss' ? 'boss' : B.kind === 'pvp' ? 'pvp' : B.kind === 'trainer' ? 'trainer' : 'wild');
    else if (canSeal && i === 1) {
      S.items.stone--;
      await this.say('봉인석을 던졌다!', { auto: 500 });
      await this.fx('seal', {}, 1300);
      const p = CAPTURE[SPECIES[prey.sid].tier] * (prey.alpha ? 0.6 : 1);
      if (Math.random() < p) {
        sfx.ding();
        prey.hp = Math.round(maxHp(prey) * 0.5);
        delete prey.alpha;
        S.party.push(prey);
        S.codex.owned[prey.sid] = true;
        B.eShow = false; this.updateHud();
        await this.say(`${josa(formName(prey), '을/를')} 봉인했다! 동료가 되었다.`);
      } else {
        B.eShow = false; this.updateHud();
        await this.say(`앗! 봉인석이 깨졌다! ${josa(formName(prey), '은/는')} 도망쳐 버렸다…`);
      }
    } else {
      B.eShow = false; this.updateHud();
      await this.say(`${josa(formName(prey), '은/는')} 비틀거리며 사라졌다.`);
    }
  }

  // 포식 연출 + 흡수 + 진화
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

  async devour(pred, prey, mode) {
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
    const res = absorb(pred, prey, mode);
    S.stats.devours++;
    S.codex.eaten[prey.sid] = (S.codex.eaten[prey.sid] || 0) + 1;
    this.updateHud();
    await this.showCard({ kind: 'devour', mon: pred, prey, res });
    // 기술 흡수
    if (res.learnable.length) {
      const i = await this.choose(`${qn}의 기술을 흡수할 수 있다!`, [
        ...res.learnable.map((s) => ({ label: `${ELEMENTS[SKILLS[s].el].icon} ${SKILLS[s].name}${SKILLS[s].pow ? ` (위력 ${SKILLS[s].pow})` : ''}`, sub: SKILLS[s].desc })),
        '흡수하지 않는다',
      ], { cancel: true, wide: true });
      if (i >= 0 && i < res.learnable.length) {
        const s = res.learnable[i];
        if (pred.skills.length < 4) { pred.skills.push(s); if (pred.ppUsed) delete pred.ppUsed[s]; sfx.ding(); await this.say(`${josa(formName(pred), '은/는')} ${josa(SKILLS[s].name, '을/를')} 익혔다!`); }
        else {
          const j = await this.choose(`어떤 기술을 잊을까? (→ ${SKILLS[s].name})`, [...pred.skills.map((k) => ({ label: `${ELEMENTS[SKILLS[k].el].icon} ${SKILLS[k].name}${SKILLS[k].pow ? ` (위력 ${SKILLS[k].pow})` : ''}`, sub: SKILLS[k].desc })), '그만둔다'], { cancel: true, wide: true });
          if (j >= 0 && j < 4) {
            const forgot = pred.skills[j];
            pred.skills[j] = s;
            if (pred.ppUsed) { delete pred.ppUsed[s]; delete pred.ppUsed[forgot]; }
            sfx.ding();
            await this.say(`${SKILLS[forgot].name}을(를) 잊고… ${josa(SKILLS[s].name, '을/를')} 익혔다!`);
          }
        }
      }
    }
    if (res.stageUp || res.mutations.length) await this.evolve(old, pred, res);
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
    const keys = ['meat', 'bigMeat'];
    const i = await this.choose('가방', [...keys.map((k) => ({ label: `${ITEMS[k].icon} ${ITEMS[k].name} ×${S.items[k] || 0}`, sub: ITEMS[k].desc, disabled: !(S.items[k] > 0) })), { label: `${ITEMS.stone.icon} 봉인석 ×${S.items.stone || 0}`, sub: '야생 스톤몬을 쓰러뜨린 뒤 사용', disabled: true }, '닫기'], { cancel: true });
    if (i < 0 || i >= keys.length) return false;
    let m = target;
    if (!B) {
      const j = await this.choose('누구에게 먹일까?', [...S.party.map((p) => ({ label: formName(p), sub: `HP ${p.hp}/${maxHp(p)}` })), '취소'], { cancel: true });
      if (j < 0 || j >= S.party.length) return false;
      m = S.party[j];
    }
    const k = keys[i];
    const ppSpent = Object.values(m.ppUsed || {}).some((n) => n > 0);
    if (m.hp >= maxHp(m) && !(k === 'bigMeat' && (B?.player.status || ppSpent))) { await this.say('체력이 이미 가득하다!'); return false; }
    S.items[k]--;
    m.hp = Math.min(maxHp(m), m.hp + Math.round(maxHp(m) * (k === 'meat' ? 0.5 : 1)));
    if (k === 'bigMeat') { restorePP(m); if (B) B.player.status = null; }
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
    const meta = { name: S.name, ownerId: S.ownerId, runs: S.runs, codex: S.codex, grave: S.grave, stats: S.stats, seenResults: S.seenResults };
    this.S = freshRun(meta);
    this.save();
    await this.opening();
    return { result: 'wiped' };
  }

  // ───────── 메뉴 / 패널 ─────────
  async startMenu() {
    const S = this.S;
    const i = await this.choose('메뉴', [
      { label: '🦖 스톤몬', sub: `동료 ${S.party.length}/${PARTY_MAX}` },
      { label: '🎒 가방', sub: `🦴${S.bones} · 🍖${S.items.meat || 0} 🍗${S.items.bigMeat || 0} 🪨${S.items.stone || 0}` },
      { label: '📖 도감', sub: `발견 ${Object.keys(S.codex.seen).length} · 포식 ${Object.keys(S.codex.eaten).length} / ${SPECIES_COUNT}` },
      { label: '🪦 기록 · 무덤', sub: `${S.runs}번째 생 · 먹힌 스톤몬 ${S.grave.length}` },
      { label: '💾 저장 · 이어하기 코드', sub: this.S.cloudCode ? `모험 코드 ${this.S.cloudCode}` : '다른 기기에서 이어하기 코드 발급' },
      { label: '🏠 타이틀로', sub: '진행은 자동 저장됩니다' },
      '닫기',
    ], { cancel: true });
    if (i === 0) this.openPanel('party');
    else if (i === 1) await this.useItemMenu(null, null);
    else if (i === 2) this.openPanel('codex');
    else if (i === 3) this.openPanel('records');
    else if (i === 4) await this.saveMenu();
    else if (i === 5) this.toTitle();
  }
  async saveMenu() {
    this.save();
    sfx.ding();
    await this.say('기기에 저장했다! 다음에 접속하면 타이틀에서 \'이어하기\'로 계속할 수 있다.', { auto: 0 });
    const i = await this.choose('다른 기기에서도 이어하려면?', [
      { label: '🔑 모험 코드 발급/갱신', sub: '서버에 저장 · 다른 기기 타이틀에서 코드 입력' },
      { label: '📋 백업 문자열 복사', sub: '서버 없이 텍스트로 보관 · 붙여넣어 복원' },
      '닫기',
    ], { cancel: true });
    if (i === 0) {
      await this.say('제단의 돌판에 모험을 새기는 중…', { auto: 400 });
      const ok = await this.cloudSync(true);
      if (ok) {
        await this.showCard({ kind: 'code', code: this.S.cloudCode });
      } else await this.say('서버에 저장하지 못했다… \'백업 문자열 복사\'를 이용해 주세요.');
    } else if (i === 1) {
      const text = encodeBackup(this.S);
      let copied = false;
      try { await navigator.clipboard.writeText(text); copied = true; } catch (e) { /* ignore */ }
      await this.showCard({ kind: 'code', backup: text, copied });
    }
  }
  openPanel(kind) { this.setUi({ panel: { kind } }); }
  closePanel() { sfx.tick(); this.setUi({ panel: null }); }
  setLead(m) {
    this.S.party = [m, ...this.S.party.filter((p) => p !== m)];
    this.save(); sfx.ding(); this.refresh();
  }
  feed(prey) {
    this.setUi({ panel: null });
    this.run(async () => {
      const S = this.S;
      const others = S.party.filter((m) => m !== prey);
      if (!others.length) { await this.say('먹일 상대가 없다.'); return; }
      const i = await this.choose(`${josa(formName(prey), '을/를')} 누구에게 먹일까?`, [...others.map((m) => ({ label: `${formName(m)} ★${power(m)}`, sub: `포식 ${m.devours}회 · 변이 ${m.stage}단계`, mon: m })), '취소'], { cancel: true });
      if (i < 0 || i >= others.length) return;
      const pred = others[i];
      const ok = await this.choose(`정말로 ${josa(formName(prey), '을/를')} ${formName(pred)}에게 바칠까? 되돌릴 수 없다.`, ['바친다', '그만둔다']);
      if (ok !== 0) return;
      const v = this.v;
      v.battle = { kind: 'feed', bg: 'altar', enemy: fighter(prey, 'e'), player: fighter(pred, 'p'), eShow: true, pShow: true };
      v.mode = 'battle'; v.fx = {};
      this.updateHud();
      await this.say(`${josa(formName(prey), '은/는')} 체념한 듯 눈을 감았다…`);
      S.party = S.party.filter((m) => m !== prey);
      S.grave.unshift({ name: formName(prey), sid: prey.sid, devours: prey.devours, stage: prey.stage, power: power(prey), cause: `${formName(pred)}에게 바쳐짐`, date: Date.now(), run: S.runs });
      await this.devour(pred, prey, 'feed');
      this.endBattle({});
    });
  }
}

function v_reset(v) { v.fx = {}; }

export { SPECIES, SKILLS, TRAITS, ELEMENTS, TIER_NAME, STATUS, PARTY_MAX, eff, geneTotal, stageThreshold, GRID, MAP_W, MAP_H, rand };
