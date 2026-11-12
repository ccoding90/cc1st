// 🖼️ 스톤몬스터 캔버스 렌더러 (240x176 도트 화면)
import { MAP_W, MAP_H, LOOKS, mapOf } from './world';
import { SPECIES, ELEMENTS, STARTERS } from './data';
import { monSprite, monScale, charSprite, tiles, building, eggSprite } from './sprites';

export const SW = 240, SH = 176;
const TILE_OF = { ',': 'tall', v: 'dry', a: 'ash', '=': 'path', c: 'canyon', S: 'stone', m: 'mud', T: 'tree', P: 'palm', f: 'flower', r: 'rock', '#': 'fence', s: 'sign', b: 'bones', R: 'redrock', I: 'pillar' };
const ENC = { ',': 'tall', v: 'dry', a: 'ash' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (p) => 1 - (1 - p) * (1 - p);

export function draw(ctx, g) {
  const v = g.v;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  // 화면 흔들림
  const sh = shakeAmount(v);
  if (sh) ctx.translate(Math.round((Math.random() * 2 - 1) * sh), Math.round((Math.random() * 2 - 1) * sh));
  if (v.mode === 'map') drawMap(ctx, g);
  else if (v.mode === 'battle') drawBattle(ctx, g);
  else if (v.mode === 'evolve') drawEvolve(ctx, g);
  else if (v.mode === 'scene') drawScene(ctx, g);
  else if (v.mode === 'title') drawTitle(ctx, g);
  else { ctx.fillStyle = '#000'; ctx.fillRect(-4, -4, SW + 8, SH + 8); drawEmbers(ctx, v.t); }
  ctx.restore();
  // 전투 진입 연출
  const tr = v.fx.trans;
  if (tr) {
    const p = (v.t - tr.t0) / 650;
    if (p < 1) {
      if (p < 0.45) { if (Math.floor(p * 18) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, 0, SW, SH); } }
      else {
        const q = (p - 0.45) / 0.55;
        ctx.fillStyle = '#000';
        for (let i = 0; i < 11; i++) {
          const w = SW * q;
          ctx.fillRect(i % 2 ? SW - w : 0, i * 16, w, 16);
        }
      }
    }
  }
  if (v.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${v.flash})`;
    ctx.fillRect(0, 0, SW, SH);
    v.flash = Math.max(0, v.flash - 0.06);
  }
}

function shakeAmount(v) {
  const f = v.fx;
  let s = 0;
  if (f.hit && v.t - f.hit.t0 < 250 && f.hit.big) s = 3;
  if (f.devour) { const e = v.t - f.devour.t0; if (e > 450 && e < 1250) s = 3; }
  return s;
}

function drawEmbers(ctx, t) {
  for (let i = 0; i < 14; i++) {
    const x = (i * 53 + Math.sin(t / 900 + i) * 20) % SW;
    const y = SH - ((t / 25 + i * 37) % (SH + 20));
    ctx.fillStyle = i % 3 ? '#a8321e' : '#ff8a3a';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

// ───────── 맵 ─────────
function drawMap(ctx, g) {
  const v = g.v, M = mapOf(v.map), GRID = M.grid, T = tiles(M.theme);
  let px = v.x * 16, py = v.y * 16, walking = false;
  if (v.mv) {
    const p = Math.min(1, v.mv.t / v.mv.dur);
    px += (v.mv.tx - v.x) * 16 * p; py += (v.mv.ty - v.y) * 16 * p; walking = true;
  }
  const camX = clamp(Math.round(px - (SW / 2 - 8)), 0, MAP_W * 16 - SW);
  const camY = clamp(Math.round(py - (SH / 2 - 8)), 0, MAP_H * 16 - SH);
  const x0 = Math.floor(camX / 16), y0 = Math.floor(camY / 16);
  const wf = Math.floor(v.t / 500) % 2;
  for (let ty = y0; ty <= y0 + 12 && ty < MAP_H; ty++) for (let tx = x0; tx <= x0 + 15 && tx < MAP_W; tx++) {
    const ch = GRID[ty][tx];
    let img;
    if (ch === '~') img = wf ? T.water1 : T.water0;
    else if (ch === 'W') img = Math.floor(v.t / 160) % 2 ? T.fall1 : T.fall0;
    else if (ch === 'L') img = Math.floor(v.t / 420 + tx * 0.3) % 2 ? T.lava1 : T.lava0;
    else if (ch === '.') img = (tx * 7 + ty * 13) % 5 === 0 ? T.grass2 : T.grass;
    else img = T[TILE_OF[ch]] || T.grass;
    ctx.drawImage(img, tx * 16 - camX, ty * 16 - camY);
  }
  for (const b of M.buildings) {
    ctx.drawImage(building(b.type), b.x * 16 - camX, b.y * 16 - camY);
    if (b.type === 'altar') {
      const a = 0.18 + 0.12 * Math.sin(v.t / 220);
      ctx.fillStyle = `rgba(255,40,60,${a})`;
      ctx.beginPath(); ctx.ellipse(b.x * 16 - camX + 24, b.y * 16 - camY + 30, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 출구 표시 (화살표 깜빡임)
  for (const w of M.warps) {
    if (Math.floor(v.t / 450) % 2) continue;
    const sx = w.x * 16 - camX + 6, sy = w.y * 16 - camY + 6;
    ctx.fillStyle = w.gate && !g.S.flags[w.gate] ? '#ff5a5a' : '#ffe680';
    ctx.fillRect(sx, sy, 4, 4);
  }
  // 인물: y 순 정렬
  const ents = [];
  for (const n of M.npcs) {
    if (n.trainer && g.S.flags.trainers?.[n.trainer] === 'gone') continue;
    ents.push({ y: n.y * 16, x: n.x * 16, img: charSprite(LOOKS[n.look], g.npcDir[n.id] || n.dir, 0), ex: n.trainer && !g.S.flags.trainers?.[n.trainer] });
  }
  const frame = walking ? ((v.mv.t < v.mv.dur / 2 ? 1 : 0) ^ v.walk) : 0;
  ents.push({ y: py, x: px, img: charSprite(LOOKS.hero, v.dir, frame), hero: true, bob: walking && frame ? -1 : 0 });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) {
    const sx = Math.round(e.x - camX), sy = Math.round(e.y - camY - 2 + (e.bob || 0));
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(sx + 3, sy + 14, 10, 2);
    ctx.drawImage(e.img, sx, sy);
    if (e.ex && Math.floor(v.t / 400) % 2) { ctx.fillStyle = '#ff3a3a'; ctx.fillRect(sx + 7, sy - 6, 2, 4); ctx.fillRect(sx + 7, sy - 1, 2, 1); }
    if (e.hero) {
      // 수풀 속에서는 다리가 가려짐
      const cx = Math.round(px / 16), cy = Math.round(py / 16);
      const enc = ENC[GRID[cy]?.[cx]];
      if (enc) ctx.drawImage(T[enc], 0, 10, 16, 6, sx, sy + 12, 16, 6);
    }
  }
  if (M.theme === 'volcano') { ctx.fillStyle = `rgba(255,80,20,${0.06 + 0.03 * Math.sin(v.t / 600)})`; ctx.fillRect(0, 0, SW, SH); drawEmbers(ctx, v.t); }
  // 대장 스톤몬 미니 아이콘(화면 좌상단)
  const lead = g.S.party?.[0];
  if (lead) {
    ctx.fillStyle = 'rgba(60,34,16,0.75)'; ctx.fillRect(1, 1, 32, 32);
    ctx.strokeStyle = '#c8904a'; ctx.lineWidth = 1; ctx.strokeRect(1.5, 1.5, 31, 31);
    ctx.drawImage(monSprite(lead), 1, 1, 32, 32);
  }
  // 지역 이름 배너
  const bn = v.banner;
  if (bn) {
    const e = v.t - bn.t0;
    if (e < 2600) {
      const a = e < 300 ? e / 300 : e > 2100 ? (2600 - e) / 500 : 1;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = '#3a2210'; ctx.fillRect(40, 138, 160, 26);
      ctx.fillStyle = '#c8904a'; ctx.fillRect(42, 140, 156, 22);
      ctx.fillStyle = '#fbf0d8'; ctx.fillRect(44, 142, 152, 18);
      ctx.fillStyle = '#3a2210'; ctx.font = '10px Galmuri11, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bn.text, SW / 2, 151);
      ctx.restore();
    } else v.banner = null;
  }
}

// ───────── 배틀 ─────────
const EPOS = { x: 182, y: 72 }, PPOS = { x: 62, y: 124 };
const PLAT = {
  temple: ['#3a3440', '#6a6270'], altar: ['#5a1a24', '#8a2a34'], forest: ['#4a8a30', '#7ac050'], swamp: ['#3a6a4a', '#5a9a6a'],
  canyon: ['#8a4a2a', '#c8784a'], volcano: ['#2a1e20', '#5a4446'], ruins: ['#6a6458', '#a8a294'],
};
function sky(ctx, top, bot, h = 90) {
  const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, h);
}
function jungleTree(ctx, x, y, s, dk, md) {
  ctx.fillStyle = '#4a2a14'; ctx.fillRect(x - 3 * s, y, 6 * s, 40 * s);
  ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(x, y, 22 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = md; ctx.beginPath(); ctx.ellipse(x - 6 * s, y - 4 * s, 14 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
}
function drawBattleBg(ctx, bg, t) {
  if (bg === 'temple') {
    const gr = ctx.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#2a3a24'); gr.addColorStop(1, '#4a5a40');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#3a4a34';
    for (const x of [14, 70, 150, 206]) ctx.fillRect(x, 0, 18, 90);
    ctx.fillStyle = '#5a8a3a'; for (const x of [18, 76, 154, 210]) ctx.fillRect(x, 10, 3, 60);
    for (const x of [22, 214]) { ctx.fillStyle = Math.sin(t / 90 + x) > 0 ? '#ff8a3a' : '#ffd23a'; ctx.fillRect(x, 40, 4, 6); }
    ctx.fillStyle = '#5a6a50'; ctx.fillRect(0, 90, SW, SH - 90);
  } else if (bg === 'altar') {
    const gr = ctx.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#1a0810'); gr.addColorStop(1, '#4a1420');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = `rgba(255,40,60,${0.08 + 0.05 * Math.sin(t / 300)})`; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#2a0c14'; for (let i = 0; i < 6; i++) ctx.fillRect(i * 44 + 6, 60 - (i % 3) * 8, 10, 40 + (i % 3) * 8);
  } else if (bg === 'swamp') {
    sky(ctx, '#7ac0d8', '#d0f0e8');
    // 폭포
    ctx.fillStyle = '#4a6a4a'; ctx.fillRect(150, 0, 70, 84);
    ctx.fillStyle = '#7ac8f0'; ctx.fillRect(165, 0, 40, 84);
    ctx.fillStyle = '#e8f8ff'; for (let i = 0; i < 6; i++) ctx.fillRect(168 + i * 6, ((t / 6 + i * 13) % 84), 2, 14);
    jungleTree(ctx, 30, 30, 1.1, '#1a4a2a', '#2a6a3a'); jungleTree(ctx, 110, 22, 0.9, '#1a4a2a', '#2a6a3a');
    ctx.fillStyle = '#3a7a8a'; ctx.fillRect(0, 84, SW, 10);
    ctx.fillStyle = '#6aa860'; ctx.fillRect(0, 92, SW, SH - 92);
    ctx.fillStyle = '#4a8a4a'; for (let x = 0; x < SW; x += 12) ctx.fillRect(x + 3, 94, 2, 6);
  } else if (bg === 'canyon') {
    sky(ctx, '#f0a868', '#ffe0b0');
    ctx.fillStyle = '#a8482a'; ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(0, 20); ctx.lineTo(30, 10); ctx.lineTo(60, 40); ctx.lineTo(70, 90); ctx.fill();
    ctx.beginPath(); ctx.moveTo(240, 90); ctx.lineTo(240, 14); ctx.lineTo(200, 6); ctx.lineTo(180, 36); ctx.lineTo(160, 90); ctx.fill();
    ctx.fillStyle = '#d8784a'; ctx.fillRect(4, 30, 30, 3); ctx.fillRect(196, 24, 36, 3); ctx.fillRect(10, 56, 40, 3); ctx.fillRect(178, 60, 50, 3);
    ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(80, 90); ctx.lineTo(100, 52); ctx.lineTo(130, 48); ctx.lineTo(150, 90); ctx.fill();
    ctx.fillStyle = '#e8a070'; ctx.fillRect(0, 90, SW, SH - 90);
  } else if (bg === 'volcano') {
    sky(ctx, '#2a1018', '#a83a1a');
    ctx.fillStyle = '#1a1014'; ctx.beginPath(); ctx.moveTo(50, 90); ctx.lineTo(105, 24); ctx.lineTo(135, 24); ctx.lineTo(190, 90); ctx.fill();
    ctx.fillStyle = '#ff6a1a'; ctx.fillRect(108, 22, 24, 4);
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(118, 26); ctx.lineTo(126, 26); ctx.lineTo(132, 70); ctx.lineTo(116, 70); ctx.fill();
    for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(60,40,44,0.55)'; ctx.beginPath(); ctx.arc(120 + Math.sin(t / 700 + i) * 10 + i * 4, 16 - ((t / 50 + i * 10) % 40), 5 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(0, 90, SW, SH - 90);
    ctx.fillStyle = '#e8401a'; ctx.fillRect(0, 86, SW, 5); ctx.fillStyle = '#ffb03a'; for (let x = 0; x < SW; x += 16) ctx.fillRect(x + ((t / 40) % 16), 87, 5, 2);
    drawEmbers(ctx, t);
  } else if (bg === 'ruins') {
    sky(ctx, '#d87a4a', '#f8d0a0');
    ctx.fillStyle = '#8a8478';
    for (const [x, h] of [[10, 70], [44, 52], [176, 64], [212, 74]]) { ctx.fillRect(x, 90 - h, 18, h); ctx.fillStyle = '#c8c0b0'; ctx.fillRect(x + 2, 90 - h, 6, h); ctx.fillStyle = '#8a8478'; }
    ctx.fillStyle = '#6a6458'; ctx.fillRect(70, 30, 100, 8); ctx.fillRect(76, 38, 10, 52); ctx.fillRect(154, 38, 10, 52);
    ctx.fillStyle = '#5a8a3a'; ctx.fillRect(80, 38, 2, 30); ctx.fillRect(158, 38, 2, 22); ctx.fillRect(48, 40, 2, 26);
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(0, 90, SW, SH - 90);
    ctx.fillStyle = '#a09888'; for (let x = 0; x < SW; x += 24) ctx.fillRect(x, 90, 1, SH - 90);
  } else {
    // 원시 정글 (태초의 숲)
    sky(ctx, '#8fd0ff', '#e8f8e0');
    ctx.fillStyle = '#6a9aa8'; ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(40, 40); ctx.lineTo(70, 62); ctx.lineTo(110, 30); ctx.lineTo(150, 66); ctx.lineTo(240, 50); ctx.lineTo(240, 90); ctx.lineTo(0, 90); ctx.fill();
    ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.moveTo(100, 38); ctx.lineTo(110, 30); ctx.lineTo(120, 38); ctx.fill();
    jungleTree(ctx, 18, 34, 1, '#2a6a2a', '#3a8a3a'); jungleTree(ctx, 222, 30, 1.1, '#2a6a2a', '#3a8a3a');
    ctx.fillStyle = '#3a8a2a'; for (let x = 0; x < SW; x += 10) { ctx.beginPath(); ctx.ellipse(x + 5, 86, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#a8d878'; ctx.fillRect(0, 90, SW, SH - 90);
    ctx.fillStyle = '#88c060'; for (let x = 0; x < SW; x += 14) ctx.fillRect(x + 4, 94 + (x % 3) * 8, 3, 2);
  }
  const pc = PLAT[bg] || PLAT.forest;
  const plat = (x, y, rx, ry) => {
    ctx.fillStyle = '#1c1424'; ctx.beginPath(); ctx.ellipse(x, y + 1, rx + 1, ry + 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pc[0]; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pc[1]; ctx.beginPath(); ctx.ellipse(x, y - 2, rx - 4, ry - 3, 0, 0, Math.PI * 2); ctx.fill();
  };
  plat(EPOS.x, EPOS.y - 4, 44, 10);
  plat(PPOS.x, PPOS.y - 4, 56, 12);
}

function spriteRect(m, side) {
  const s = Math.min(1.45, monScale(m)) * (side === 'p' ? 1.15 : 1);
  const size = 64 * s;
  const pos = side === 'p' ? PPOS : EPOS;
  return { x: pos.x - size / 2, y: pos.y - size + 6 * s, size, cx: pos.x, cy: pos.y - size / 2 };
}

function drawMon(ctx, m, side, v, { alpha = 1, dx = 0, dy = 0, scale = 1, white = false } = {}) {
  const r = spriteRect(m, side);
  const img = monSprite(m, { white });
  const size = r.size * scale;
  const x = Math.round(r.cx - size / 2 + dx), y = Math.round(r.y + (r.size - size) + dy);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (side === 'e') { ctx.translate(x + size, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, size, size); }
  else ctx.drawImage(img, x, y, size, size);
  ctx.restore();
  // 우두머리 붉은 오라
  if (m.alpha && side === 'e') {
    ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(v.t / 150); ctx.fillStyle = '#ff2a2a';
    ctx.beginPath(); ctx.ellipse(r.cx + dx, r.cy + dy, size * 0.42, size * 0.38, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

function drawBattle(ctx, g) {
  const v = g.v, B = v.battle;
  if (!B) return;
  drawBattleBg(ctx, B.bg, v.t);
  const f = v.fx;
  const dv = f.devour;
  const de = dv ? v.t - dv.t0 : 0;
  for (const side of ['e', 'p']) {
    const fi = side === 'e' ? B.enemy : B.player;
    const show = side === 'e' ? B.eShow : B.pShow;
    if (!fi || !show) continue;
    const m = fi.m;
    let dx = 0, dy = 0, alpha = 1, scale = 1, hide = false;
    const dir = side === 'p' ? 1 : -1;
    if (f.lunge?.side === side) { const p = (v.t - f.lunge.t0) / 260; if (p < 1) { dx += Math.sin(p * Math.PI) * 14 * dir; dy -= Math.sin(p * Math.PI) * 6 * dir; } }
    if (f.hit?.side === side) { const e = v.t - f.hit.t0; if (e < 330) { dx += Math.sin(e / 18) * 3; if (Math.floor(e / 60) % 2 === 0) hide = true; } }
    if (m.hp <= 0) {
      const p = f.faint?.side === side ? Math.min(1, (v.t - f.faint.t0) / 600) : 1;
      dy += 10 * p; alpha = 1 - 0.35 * p;
    }
    if (dv) {
      const predSide = dv.side, preySide = predSide === 'p' ? 'e' : 'p';
      const pr = spriteRect(side === predSide ? m : m, side);
      if (side === predSide) {
        const tgt = preySide === 'e' ? EPOS : PPOS;
        const k = de < 450 ? ease(de / 450) : de < 1250 ? 1 : Math.max(0, 1 - (de - 1250) / 700);
        dx += (tgt.x - (side === 'p' ? PPOS.x : EPOS.x)) * 0.45 * k;
        dy += (tgt.y - (side === 'p' ? PPOS.y : EPOS.y)) * 0.45 * k;
        scale = 1 + 0.15 * k;
        void pr;
      } else if (de > 1150) {
        const p = Math.min(1, (de - 1150) / 900);
        alpha = 1 - p; scale = 1 - 0.7 * p;
      } else if (de > 450) dx += Math.sin(de / 15) * 2;
    }
    if (!hide) drawMon(ctx, m, side, v, { alpha, dx, dy, scale });
    // 상태이상 표시 반짝임
    if (fi.status && m.hp > 0 && Math.floor(v.t / 500) % 2) {
      const r = spriteRect(m, side);
      ctx.fillStyle = { burn: '#ff6a3d', para: '#ffd93d', psn: '#b05cff', frz: '#bff2ff' }[fi.status];
      ctx.fillRect(Math.round(r.cx + 10), Math.round(r.y + 6), 3, 3);
      ctx.fillRect(Math.round(r.cx - 14), Math.round(r.y + 14), 2, 2);
    }
  }
  // 피격 파티클
  if (f.hit) {
    const e = v.t - f.hit.t0;
    if (e < 400) {
      const m = (f.hit.side === 'e' ? B.enemy : B.player).m;
      const r = spriteRect(m, f.hit.side);
      const col = ELEMENTS[f.hit.el]?.color || '#fff';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + e / 200, d = 6 + (e / 400) * 26;
        ctx.fillStyle = i % 2 ? col : '#ffffff';
        ctx.fillRect(Math.round(r.cx + Math.cos(a) * d), Math.round(r.cy + Math.sin(a) * d * 0.8), 2, 2);
      }
    }
  }
  if (f.aura) {
    const e = v.t - f.aura.t0;
    if (e < 420) {
      const fi = f.aura.side === 'e' ? B.enemy : B.player;
      const r = spriteRect(fi.m, f.aura.side);
      ctx.strokeStyle = ELEMENTS[f.aura.el]?.color || '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(r.cx, r.cy, 8 + e / 12, 6 + e / 16, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (f.buff) {
    const e = v.t - f.buff.t0;
    if (e < 420) {
      const fi = f.buff.side === 'e' ? B.enemy : B.player;
      const r = spriteRect(fi.m, f.buff.side);
      ctx.fillStyle = f.buff.up ? '#ff5a3a' : '#3a8aff';
      for (let i = 0; i < 5; i++) {
        const x = r.cx - 20 + i * 10, y = r.cy + (f.buff.up ? 20 - e / 10 - (i % 2) * 8 : -20 + e / 10 + (i % 2) * 8);
        ctx.fillRect(Math.round(x), Math.round(y), 2, 6);
        ctx.fillRect(Math.round(x) - 2, Math.round(y) + (f.buff.up ? 0 : 4), 6, 2);
      }
    }
  }
  if (f.seal) {
    const e = v.t - f.seal.t0;
    const p = Math.min(1, e / 500);
    const x = 40 + (EPOS.x - 40) * p, y = 140 - 100 * p + 60 * p * p;
    if (e < 1300) {
      ctx.fillStyle = '#1c1424'; ctx.fillRect(Math.round(x) - 5, Math.round(y) - 5, 10, 10);
      ctx.fillStyle = e > 500 && Math.floor(e / 120) % 2 ? '#ffffff' : '#a8a0b0'; ctx.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 8);
      ctx.fillStyle = '#ff5aff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  }
  if (dv) drawDevourFx(ctx, B, dv, de);
}

function drawDevourFx(ctx, B, dv, e) {
  // 붉게 어두워지는 화면
  const dark = e < 450 ? e / 450 : e < 1250 ? 1 : Math.max(0, 1 - (e - 1250) / 1000);
  ctx.fillStyle = `rgba(80,0,10,${0.5 * dark})`;
  ctx.fillRect(0, 0, SW, SH);
  const preySide = dv.side === 'p' ? 'e' : 'p';
  const prey = (preySide === 'e' ? B.enemy : B.player).m;
  const pred = (dv.side === 'e' ? B.enemy : B.player).m;
  const r = spriteRect(prey, preySide);
  // 거대한 턱 (3번 깨문다)
  if (e > 450 && e < 1250) {
    const k = ((e - 450) % 267) / 267;
    const close = k < 0.5 ? k * 2 : 2 - k * 2;
    const gap = 46 * (1 - close) + 2;
    const w = r.size * 1.5, x0 = r.cx - w / 2;
    for (const dirn of [-1, 1]) {
      const yEdge = r.cy + dirn * gap;
      ctx.fillStyle = '#5a0a14';
      if (dirn < 0) ctx.fillRect(x0, yEdge - 60, w, 60); else ctx.fillRect(x0, yEdge, w, 60);
      ctx.fillStyle = '#f8f0e0';
      const n = 9;
      for (let i = 0; i < n; i++) {
        const tx = x0 + (i + 0.5) * (w / n);
        ctx.beginPath();
        ctx.moveTo(tx - w / n / 2 + 1, yEdge);
        ctx.lineTo(tx + w / n / 2 - 1, yEdge);
        ctx.lineTo(tx, yEdge - dirn * -12);
        ctx.fill();
      }
    }
  }
  // 흡수되는 유전자 입자
  if (e > 1150) {
    const p = Math.min(1, (e - 1150) / 1000);
    const pr = spriteRect(pred, dv.side);
    const col = ELEMENTS[SPECIES[prey.sid].el].color;
    for (let i = 0; i < 26; i++) {
      const q = clamp(p * 1.6 - (i / 26) * 0.6, 0, 1);
      if (q <= 0 || q >= 1) continue;
      const sx = r.cx + Math.cos(i * 2.4) * 18, sy = r.cy + Math.sin(i * 1.7) * 14;
      const x = sx + (pr.cx - sx) * ease(q) + Math.sin(q * 6 + i) * 6;
      const y = sy + (pr.cy - sy) * ease(q) - Math.sin(q * Math.PI) * 24;
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? col : '#ff3a5a';
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    if (p > 0.7) {
      ctx.fillStyle = `rgba(255,255,255,${(p - 0.7) * 1.5})`;
      ctx.beginPath(); ctx.ellipse(pr.cx, pr.cy, pr.size * 0.4, pr.size * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ───────── 진화(변이) 연출 ─────────
function drawEvolve(ctx, g) {
  const v = g.v, sc = v.scene;
  ctx.fillStyle = '#120c1c'; ctx.fillRect(0, 0, SW, SH);
  const e = v.t - sc.t0;
  // 방사형 빛줄기
  ctx.save(); ctx.translate(SW / 2, SH / 2 - 6); ctx.rotate(e / 2000);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = i % 2 ? 'rgba(255,90,140,0.10)' : 'rgba(120,220,255,0.10)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(160, -14); ctx.lineTo(160, 14); ctx.fill();
  }
  ctx.restore();
  const size = 112;
  const x = SW / 2 - size / 2, y = SH / 2 - size / 2 - 10;
  let img;
  if (sc.done) img = monSprite(sc.now);
  else {
    const period = Math.max(70, 520 - e * 0.15);
    const showNew = Math.floor(e / period) % 2 === 1;
    img = monSprite(showNew ? sc.now : sc.old, { white: true });
  }
  ctx.drawImage(img, Math.round(x), Math.round(y), size, size);
  for (let i = 0; i < 18; i++) {
    const a = i * 0.9 + e / 400, d = 30 + ((e / 8 + i * 20) % 60);
    ctx.fillStyle = i % 2 ? '#ffe680' : '#ffffff';
    ctx.fillRect(Math.round(SW / 2 + Math.cos(a) * d), Math.round(SH / 2 - 10 + Math.sin(a) * d * 0.7), 2, 2);
  }
}

// ───────── 연구소 · 부화 ─────────
function drawScene(ctx, g) {
  const v = g.v, sc = v.scene;
  ctx.fillStyle = '#6a4a30'; ctx.fillRect(0, 0, SW, SH);
  for (let y = 0; y < SH; y += 12) { ctx.fillStyle = y % 24 ? '#7a5a3a' : '#5a3a24'; ctx.fillRect(0, y, SW, 1); }
  ctx.fillStyle = '#9a96a0'; ctx.fillRect(0, 0, SW, 56); ctx.fillStyle = '#7a7680'; for (let x = 0; x < SW; x += 20) ctx.fillRect(x, 0, 1, 56);
  // 화석 선반
  ctx.fillStyle = '#4a3020'; ctx.fillRect(12, 18, 70, 4); ctx.fillRect(158, 18, 70, 4);
  ctx.fillStyle = '#f0e8d0'; ctx.fillRect(18, 10, 14, 8); ctx.fillRect(40, 12, 6, 6); ctx.fillRect(166, 8, 20, 10); ctx.fillRect(200, 12, 10, 6);
  ctx.fillStyle = '#1c1424'; ctx.fillRect(21, 12, 2, 2); ctx.fillRect(170, 11, 2, 2);
  // 탁자
  ctx.fillStyle = '#3a2418'; ctx.fillRect(56, 92, 128, 34); ctx.fillStyle = '#a07040'; ctx.fillRect(58, 94, 124, 28);
  if (sc.kind === 'lab') ctx.drawImage(charSprite(LOOKS.prof, 'down', 0), 112, 62);
  if (sc.kind === 'lab') {
    STARTERS.forEach((sid, i) => {
      const ex = 72 + i * 36, bob = Math.sin(v.t / 300 + i) > 0.6 ? -1 : 0;
      ctx.drawImage(eggSprite(SPECIES[sid].pal[0]), ex, 84 + bob);
    });
  } else if (sc.kind === 'hatch') {
    const e = v.t - sc.t0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, SW, SH);
    if (e < 2200) {
      const sh = e > 600 ? Math.sin(e / 30) * (e / 600) : 0;
      ctx.drawImage(eggSprite(SPECIES[sc.mon.sid].pal[0]), 0, 0, 24, 28, Math.round(SW / 2 - 24 + sh), 60, 48, 56);
      if (e > 600) { ctx.fillStyle = '#1c1424'; ctx.fillRect(SW / 2 - 6, 74, 2, 8); ctx.fillRect(SW / 2 - 4, 80, 6, 2); }
      if (e > 1300) { ctx.fillRect(SW / 2 + 4, 66, 2, 10); ctx.fillRect(SW / 2 - 2, 90, 10, 2); }
    } else {
      if (e < 2500) { ctx.fillStyle = `rgba(255,255,255,${1 - (e - 2200) / 300})`; ctx.fillRect(0, 0, SW, SH); }
      ctx.drawImage(monSprite(sc.mon), SW / 2 - 48, 36, 96, 96);
    }
  }
}

// ───────── 타이틀 ─────────
function drawTitle(ctx, g) {
  const t = g.v.t;
  const gr = ctx.createLinearGradient(0, 0, 0, SH);
  gr.addColorStop(0, '#2a1438'); gr.addColorStop(0.55, '#c8502a'); gr.addColorStop(1, '#ffb050');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = '#ffe0a0'; ctx.beginPath(); ctx.arc(176, 70, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a1a24'; ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(60, 80); ctx.lineTo(84, 92); ctx.lineTo(120, 56); ctx.lineTo(132, 60); ctx.lineTo(170, 104); ctx.lineTo(240, 96); ctx.lineTo(240, 176); ctx.lineTo(0, 176); ctx.fill();
  ctx.fillStyle = '#ff6a3d'; ctx.fillRect(122, 56, 8, 3);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(80,60,70,0.5)'; ctx.beginPath(); ctx.arc(126 + Math.sin(t / 900 + i) * 6 + i * 3, 50 - ((t / 40 + i * 12) % 60), 4 + i % 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#2a0c14'; ctx.fillRect(0, 150, SW, 26);
  // 행진하는 스톤몬 실루엣
  const parade = [2, 5, 29, 15, 47, 36, 3, 26, 4, 28, 7, 18];
  parade.forEach((sid, i) => {
    const x = ((t / 30 + i * 52) % (SW + 520)) - 60;
    const m = { sid };
    const s = 0.7 * Math.min(1.3, SPECIES[sid].size);
    ctx.drawImage(monSprite(m, { silhouette: true }), Math.round(x), Math.round(158 - 64 * s), 64 * s, 64 * s);
  });
  drawEmbers(ctx, t);
}

