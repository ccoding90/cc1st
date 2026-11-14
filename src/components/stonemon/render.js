// 🖼️ 스톤몬스터 캔버스 렌더러 (240x176 도트 화면)
//  v3.0 타격감: 피격 흔들림 · 화면 미세 진동 · 속성별 파티클 · 데미지 숫자 팝업 · 강조 텍스트 · 황금 오라 · 변종 반짝임 · 날씨
import { MAP_W, MAP_H, LOOKS, mapOf, OBJ_RESPAWN } from './world';
import { SPECIES, ELEMENTS, STARTERS } from './data';
import { monSprite, monScale, charSprite, tiles, building, eggSprite, objSprite, drawMonster, spriteSize } from './sprites';
import { lookOf } from './monster';
import { hasSyn, SYNERGIES } from './synergy';

export const SW = 240, SH = 176;
const TILE_OF = { ',': 'tall', v: 'dry', a: 'ash', n: 'snow', g: 'skygrass', '=': 'path', c: 'canyon', S: 'stone', m: 'mud', T: 'tree', P: 'palm', f: 'flower', r: 'rock', '#': 'fence', s: 'sign', b: 'bones', R: 'redrock', I: 'pillar', C: 'crystal', K: 'cloud' };
const ENC = { ',': 'tall', v: 'dry', a: 'ash', n: 'snow', g: 'skygrass' };
const FONT = 'Galmuri11, monospace';
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
  if (f.hit && v.t - f.hit.t0 < 160 && !f.hit.dot) s = 1; // 일반 타격도 화면 미세 진동
  if (f.hit && v.t - f.hit.t0 < 260 && f.hit.big) s = f.hit.crit ? 4 : 3;
  if (f.emph && f.emph.kind === 'super2' && v.t - f.emph.t0 < 300) s = 4;
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
  // 필드 오브젝트: 고대 화석 바위 · 알 둥지 (조사 가능하면 반짝임)
  for (const o of M.objects || []) {
    const used = g.S.objs?.[o.id];
    const ready = used === undefined || (g.S.steps || 0) - used >= OBJ_RESPAWN;
    const sx = o.x * 16 - camX, sy = o.y * 16 - camY;
    if (sx < -16 || sy < -16 || sx > SW || sy > SH) continue;
    ctx.drawImage(objSprite(o.kind, ready), sx, sy);
    if (ready) {
      const ph = (v.t / 140 + o.x * 3) % 10;
      if (ph < 4) { ctx.fillStyle = '#ffffff'; const k = ph < 2 ? 1 : 2; ctx.fillRect(sx + 11, sy + 1 - k, 1, 1 + k * 2); ctx.fillRect(sx + 11 - k, sy + 1, 1 + k * 2, 1); }
    }
  }
  for (const b of M.buildings) {
    ctx.drawImage(building(b.type), b.x * 16 - camX, b.y * 16 - camY);
    if (b.type === 'skyAltar' || b.type === 'colosseum') {
      const a = 0.12 + 0.08 * Math.sin(v.t / 260);
      ctx.fillStyle = b.type === 'skyAltar' ? `rgba(255,230,120,${a})` : `rgba(255,120,60,${a})`;
      ctx.beginPath(); ctx.ellipse(b.x * 16 - camX + b.w * 8, b.y * 16 - camY + b.h * 16 - 6, b.w * 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
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
  if (M.theme === 'glacier') { ctx.fillStyle = `rgba(160,210,255,${0.08 + 0.04 * Math.sin(v.t / 900)})`; ctx.fillRect(0, 0, SW, SH); drawSnow(ctx, v.t, 1); }
  if (M.theme === 'sky') drawClouds(ctx, v.t);
  // 대장 스톤몬 미니 아이콘(화면 좌상단) · 순혈 패왕이면 황금 테두리
  const lead = g.S.party?.[0];
  if (lead) {
    const king = hasSyn(lead, 'pureKing');
    ctx.fillStyle = 'rgba(60,34,16,0.75)'; ctx.fillRect(1, 1, 32, 32);
    ctx.strokeStyle = king ? (Math.floor(v.t / 300) % 2 ? '#ffd23a' : '#fff2a0') : '#c8904a'; ctx.lineWidth = 1; ctx.strokeRect(1.5, 1.5, 31, 31);
    if (king) { ctx.fillStyle = `rgba(255,210,58,${0.18 + 0.1 * Math.sin(v.t / 200)})`; ctx.fillRect(2, 2, 30, 30); }
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

function drawSnow(ctx, t, k = 1) {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 40 * k; i++) {
    const x = ((i * 61 + t / (9 + (i % 4))) + Math.sin(t / 500 + i) * 6) % (SW + 10) - 5;
    const y = ((i * 37 + t / (5 + (i % 3))) % (SH + 10)) - 5;
    ctx.fillRect(Math.round(x), Math.round(y), i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
}
function drawClouds(ctx, t) {
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const x = ((t / (60 + i * 15) + i * 80) % (SW + 120)) - 60, y = 20 + i * 38;
    ctx.beginPath(); ctx.ellipse(x, y, 30, 8, 0, 0, Math.PI * 2); ctx.ellipse(x + 18, y - 4, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ───────── 배틀 ─────────
const EPOS = { x: 182, y: 72 }, PPOS = { x: 62, y: 124 };
const PLAT = {
  temple: ['#3a3440', '#6a6270'], altar: ['#5a1a24', '#8a2a34'], forest: ['#4a8a30', '#7ac050'], swamp: ['#3a6a4a', '#5a9a6a'],
  canyon: ['#8a4a2a', '#c8784a'], volcano: ['#2a1e20', '#5a4446'], ruins: ['#6a6458', '#a8a294'],
  glacier: ['#6a8aa8', '#c8e0f0'], sky: ['#b8a878', '#f0e8d0'], arena: ['#8a6a3a', '#d8b878'],
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
  } else if (bg === 'glacier') {
    sky(ctx, '#2a4a7a', '#bfe0f8');
    ctx.fillStyle = '#4a6a9a'; ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(0, 30); ctx.lineTo(24, 12); ctx.lineTo(40, 44); ctx.lineTo(70, 20); ctx.lineTo(96, 90); ctx.fill();
    ctx.beginPath(); ctx.moveTo(240, 90); ctx.lineTo(240, 20); ctx.lineTo(212, 8); ctx.lineTo(190, 40); ctx.lineTo(160, 26); ctx.lineTo(140, 90); ctx.fill();
    ctx.fillStyle = '#9ee8ff'; for (const [x, y, h] of [[22, 14, 30], [68, 22, 26], [210, 10, 34], [162, 28, 24]]) { ctx.beginPath(); ctx.moveTo(x - 6, y + h); ctx.lineTo(x, y); ctx.lineTo(x + 6, y + h); ctx.fill(); }
    ctx.fillStyle = '#e8f8ff'; for (const [x, y] of [[20, 18], [66, 26], [208, 14]]) ctx.fillRect(x, y, 2, 10);
    // 고드름
    ctx.fillStyle = '#d8f4ff'; for (let x = 4; x < SW; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 6, 0); ctx.lineTo(x + 3, 6 + (x % 3) * 4); ctx.fill(); }
    ctx.fillStyle = '#dceef8'; ctx.fillRect(0, 90, SW, SH - 90);
    ctx.fillStyle = '#b8d4e8'; for (let x = 0; x < SW; x += 18) ctx.fillRect(x + 4, 96 + (x % 4) * 9, 8, 1);
    drawSnow(ctx, t * 1.6, 1.4);
  } else if (bg === 'sky') {
    sky(ctx, '#4a7ad8', '#f8e8c0');
    ctx.fillStyle = 'rgba(255,240,180,0.5)'; ctx.beginPath(); ctx.arc(120, 40, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0e8d8';
    for (const [x, h] of [[18, 66], [56, 50], [170, 54], [208, 70]]) { ctx.fillRect(x, 90 - h, 16, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, 90 - h, 5, h); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 2, 90 - h, 20, 4); ctx.fillStyle = '#f0e8d8'; }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) { const x = ((t / 40 + i * 50) % (SW + 60)) - 30; ctx.beginPath(); ctx.ellipse(x, 84 + (i % 2) * 4, 26, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(0, 90, SW, SH - 90);
    ctx.fillStyle = '#d0c4a0'; for (let x = 0; x < SW; x += 20) ctx.fillRect(x, 90, 1, SH - 90);
    ctx.fillStyle = 'rgba(127,224,184,0.5)'; for (let i = 0; i < 8; i++) ctx.fillRect(((i * 31 + t / 20) % SW), 160 - ((t / 15 + i * 23) % 80), 1, 3);
  } else if (bg === 'arena') {
    const gr = ctx.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#2a1a3a'); gr.addColorStop(1, '#8a4a2a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    // 관중석
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = row % 2 ? '#5a3a2a' : '#6a4a32'; ctx.fillRect(0, 16 + row * 16, SW, 14);
      for (let x = (row % 2) * 6; x < SW; x += 12) { const bob = Math.sin(t / 120 + x + row) > 0.7 ? -2 : 0; ctx.fillStyle = ['#c8885a', '#e8b080', '#a8684a'][(x + row) % 3]; ctx.fillRect(x + 2, 18 + row * 16 + bob, 6, 6); }
    }
    ctx.fillStyle = '#c62828'; for (const x of [10, 226]) { ctx.fillRect(x, 0, 3, 40); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 3, 2, 12, 8); ctx.fillStyle = '#c62828'; }
    ctx.fillStyle = '#d8b878'; ctx.fillRect(0, 84, SW, SH - 84);
    ctx.fillStyle = '#c8a060'; for (let x = 0; x < SW; x += 16) ctx.fillRect(x + ((t / 50) % 16) * 0, 100 + (x % 3) * 20, 6, 1);
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

// v4.0 도트 스프라이트 상자: 32x32(일반)·48x48(최종 진화·전설) 도트를 2배로 출력 (+ 체력 각성 거대화 · 변종)
function spriteRect(m, side) {
  const s = Math.min(1.35, monScale(m));
  const n = spriteSize(m.sid);
  const px = side === 'p' ? (n === 48 ? 1.8 : 2.2) : (n === 48 ? 1.6 : 2); // 48 도트는 조금 작은 배율로 (화면 밖으로 잘리지 않게)
  const size = Math.round(n * px * s);
  const pos = side === 'p' ? PPOS : EPOS;
  return { x: pos.x - size / 2, y: pos.y - size + 4, size, cx: pos.x, cy: pos.y - size / 2 };
}

function drawMon(ctx, m, side, v, { alpha = 1, dx = 0, dy = 0, scale = 1, white = false } = {}) {
  const r = spriteRect(m, side);
  const size = r.size * scale;
  const x = Math.round(r.cx - size / 2 + dx), y = Math.round(r.y + (r.size - size) + dy);
  // 순혈 패왕: 황금빛 오라 (몸 뒤에서 일렁임)
  if (alpha > 0.3 && hasSyn(m, 'pureKing')) {
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(v.t / 180);
    const gr = ctx.createRadialGradient(r.cx + dx, r.cy + dy, 4, r.cx + dx, r.cy + dy, size * 0.62);
    gr.addColorStop(0, `rgba(255,236,140,${0.45 + 0.2 * pulse})`); gr.addColorStop(0.6, `rgba(255,200,40,${0.22 + 0.12 * pulse})`); gr.addColorStop(1, 'rgba(255,200,40,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(r.cx + dx, r.cy + dy, size * 0.62, size * 0.56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 도트 렌더러: 대기 2프레임 바운스 + 각성 오라(붉은 투기 · 황금 수호 결계 · 속성 입자) 합성, 적은 왼쪽을 바라봄
  drawMonster(ctx, lookOf(m), x, y, size, { t: v.t + (side === 'e' ? 260 : 0), flip: side === 'e', alpha, white, still: alpha < 1 });
  // 알파 개체 붉은 오라
  if (m.alpha && side === 'e') {
    ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(v.t / 150); ctx.fillStyle = '#ff2a2a';
    ctx.beginPath(); ctx.ellipse(r.cx + dx, r.cy + dy, size * 0.42, size * 0.38, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // 고대 변종(이로치) 무지개 반짝임
  if (m.shiny && alpha > 0.3) {
    for (let i = 0; i < 4; i++) {
      const ph = (v.t / 90 + i * 7) % 24;
      if (ph > 8) continue;
      const a = i * 1.7 + Math.floor(v.t / 2160) * 0.9, rr = size * 0.36;
      const sx = Math.round(r.cx + dx + Math.cos(a) * rr), sy = Math.round(r.cy + dy + Math.sin(a) * rr * 0.8);
      const k = ph < 4 ? 1 : 2;
      ctx.fillStyle = ['#ff8af0', '#8af0ff', '#fff28a', '#a8ff8a'][i];
      ctx.fillRect(sx, sy - k, 1, 1 + k * 2); ctx.fillRect(sx - k, sy, 1 + k * 2, 1);
    }
  }
}

// ── 속성별 타격 파티클: 불꽃 · 물방울 · 잎사귀 · 발톱 할퀴기 · 번개 · 바람 · 바위 · 얼음 · 독 거품 ──
function drawElemFx(ctx, el, cx, cy, e, big) {
  const p = Math.min(1, e / 400), n = big ? 14 : 9;
  const R = (i) => ((i * 9301 + 49297) % 233280) / 233280; // 고정 난수
  ctx.save();
  if (el === 'fire') {
    for (let i = 0; i < n; i++) {
      const x = cx + (R(i) - 0.5) * 40, y = cy + 10 - p * (20 + R(i + 3) * 30), s = (1 - p) * (3 + R(i + 7) * 3);
      ctx.fillStyle = i % 3 === 0 ? '#ffd23a' : i % 3 === 1 ? '#ff6a3d' : '#ff9a2a';
      ctx.beginPath(); ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s); ctx.fill();
    }
  } else if (el === 'water') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = 6 + p * 28;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.6 + p * p * 20;
      ctx.fillStyle = i % 2 ? '#3fa9f5' : '#bfe6ff';
      ctx.beginPath(); ctx.ellipse(x, y, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 1, 1);
    }
  } else if (el === 'grass') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + p * 3, d = 8 + p * 26;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7 + p * 8;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p * 8 + i);
      ctx.fillStyle = i % 2 ? '#5cc84a' : '#9ae86a'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a6a2a'; ctx.fillRect(-3, 0, 6, 1);
      ctx.restore();
    }
  } else if (el === 'thunder') {
    ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 2;
    for (let i = 0; i < (big ? 4 : 3); i++) {
      if (Math.floor(e / 50 + i) % 2) continue;
      let x = cx - 18 + i * 14 + (R(i) - 0.5) * 8, y = cy - 30;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (k % 2 ? 6 : -6); y += 12; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,240,140,${0.3 * (1 - p)})`; ctx.fillRect(cx - 30, cy - 30, 60, 60);
  } else if (el === 'wind') {
    ctx.strokeStyle = '#d8fff0'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, 8 + i * 8 + p * 10, p * 6 + i, p * 6 + i + Math.PI * 1.2); ctx.stroke(); }
  } else if (el === 'earth') {
    for (let i = 0; i < n; i++) {
      const x = cx + (R(i) - 0.5) * 50, y = cy - 30 + p * 50 * (0.6 + R(i + 5) * 0.6) - (R(i + 2) * 10);
      ctx.fillStyle = i % 2 ? '#b07b48' : '#7a5230'; ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
      ctx.fillStyle = '#1c1424'; ctx.fillRect(Math.round(x), Math.round(y) + 3, 4, 1);
    }
  } else if (el === 'ice') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = 4 + p * 30;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = i % 2 ? '#9ee8ff' : '#ffffff'; ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(2, 0); ctx.lineTo(-1, 4); ctx.lineTo(-2, 0); ctx.fill();
      ctx.restore();
    }
  } else if (el === 'poison') {
    for (let i = 0; i < n; i++) {
      const x = cx + (R(i) - 0.5) * 36, y = cy + 14 - p * (16 + R(i + 1) * 26), r = 1.5 + R(i + 4) * 3 * (1 - p * 0.5);
      ctx.strokeStyle = i % 2 ? '#b05cff' : '#e0a8ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    // 원시: 발톱 할퀴기 (세 줄 사선)
    const k = Math.min(1, e / 160), fade = 1 - Math.max(0, (e - 200) / 200);
    ctx.globalAlpha = Math.max(0, fade);
    for (let i = 0; i < 3; i++) {
      const ox = cx - 14 + i * 9, oy = cy - 18;
      ctx.strokeStyle = '#1c1424'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 18 * k, oy + 30 * k); ctx.stroke();
      ctx.strokeStyle = i === 1 ? '#ffffff' : '#ffd8d8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 18 * k, oy + 30 * k); ctx.stroke();
    }
  }
  ctx.restore();
}

// 데미지 숫자 팝업
function drawPops(ctx, B, v) {
  const pops = v.fx.pops;
  if (!pops) return;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of pops) {
    const e = v.t - p.t0;
    if (e > 1000 || e < 0) continue;
    const fi = p.side === 'e' ? B.enemy : B.player;
    if (!fi) continue;
    const r = spriteRect(fi.m, p.side);
    const rise = e < 200 ? (e / 200) * 18 : 18 + (e - 200) / 60;
    const pop = e < 120 ? 1 + (1 - e / 120) * 0.6 : 1;
    ctx.globalAlpha = e > 700 ? 1 - (e - 700) / 300 : 1;
    const size = Math.round((p.big ? 14 : 10) * pop);
    ctx.font = `bold ${size}px ${FONT}`;
    const x = r.cx + p.dx, y = r.y + 4 - rise - p.n * 3;
    ctx.lineWidth = 3; ctx.strokeStyle = '#1c1424'; ctx.strokeText(p.text, x, y);
    ctx.fillStyle = p.color; ctx.fillText(p.text, x, y);
  }
  ctx.restore();
}

// 강조 텍스트 배너 (효과 굉장 · 천적 · 급소 · 시너지)
const EMPH_COL = { super: ['#ff6a3d', '#fff2a0'], super2: ['#ff2a4a', '#ffe680'], crit: ['#ffd23a', '#ffffff'], weak: ['#8a8aa8', '#e8e8f0'], syn: ['#b05cff', '#ffe680'], ice: ['#3fa9f5', '#e8f8ff'] };
function drawEmph(ctx, v) {
  const em = v.fx.emph;
  if (!em) return;
  const e = v.t - em.t0;
  if (e > 950) return;
  const [c1, c2] = EMPH_COL[em.kind] || EMPH_COL.super;
  const sc = e < 140 ? 0.4 + (e / 140) * 0.9 : e < 220 ? 1.3 - ((e - 140) / 80) * 0.3 : 1;
  ctx.save();
  ctx.globalAlpha = e > 750 ? 1 - (e - 750) / 200 : 1;
  ctx.translate(SW / 2, 44);
  ctx.scale(sc, sc);
  if (em.kind !== 'weak') {
    ctx.fillStyle = 'rgba(28,20,36,0.6)'; ctx.fillRect(-SW / 2, -11, SW, 22);
    ctx.fillStyle = c1; ctx.fillRect(-SW / 2, -11, SW, 2); ctx.fillRect(-SW / 2, 9, SW, 2);
  }
  ctx.font = `bold ${em.kind === 'super2' ? 15 : 13}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 4; ctx.strokeStyle = '#1c1424'; ctx.strokeText(em.text, 0, 0);
  ctx.fillStyle = Math.floor(e / 80) % 2 && em.kind !== 'weak' ? c2 : c1; ctx.fillText(em.text, 0, 0);
  ctx.restore();
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
  // 피격 파티클 (속성별) + 큰 타격 시 하얀 섬광
  if (f.hit) {
    const e = v.t - f.hit.t0;
    if (e < 420) {
      const m = (f.hit.side === 'e' ? B.enemy : B.player).m;
      const r = spriteRect(m, f.hit.side);
      if (f.hit.big && e < 70) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, SW, SH); }
      drawElemFx(ctx, f.hit.el, r.cx, r.cy, e, f.hit.big);
    }
  }
  // 눈보라로 몸이 얼어붙음
  if (f.chill) {
    const e = v.t - f.chill.t0;
    if (e < 420) {
      const fi = f.chill.side === 'e' ? B.enemy : B.player;
      const r = spriteRect(fi.m, f.chill.side);
      ctx.fillStyle = `rgba(190,240,255,${0.5 * (1 - e / 420)})`; ctx.beginPath(); ctx.ellipse(r.cx, r.cy, r.size * 0.4, r.size * 0.36, 0, 0, Math.PI * 2); ctx.fill();
      drawElemFx(ctx, 'ice', r.cx, r.cy, e, true);
    }
  }
  // 시너지 발동 (각성 문양)
  if (f.syn) {
    const e = v.t - f.syn.t0;
    if (e < 450) {
      const fi = f.syn.side === 'e' ? B.enemy : B.player;
      const r = spriteRect(fi.m, f.syn.side);
      const col = SYNERGIES[f.syn.key]?.color || '#ffd23a';
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(r.cx, r.cy, 10 + e / 10 + i * 8, 6 + e / 14 + i * 6, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  // 교대 섬광
  if (f.swap && v.t - f.swap.t0 < 300) {
    const r = spriteRect(B.player.m, 'p');
    ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - (v.t - f.swap.t0) / 300)})`;
    ctx.beginPath(); ctx.ellipse(r.cx, r.cy, r.size * 0.45, r.size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
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
      // 스톤 그물: 날아가며 펼쳐져 상대를 덮는다
      const open = e < 500 ? 4 + p * 10 : 14 + Math.sin(e / 90) * (e > 500 ? 2 : 0);
      const cx = Math.round(x), cy = Math.round(y);
      ctx.strokeStyle = '#1c1424'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, open + 1, open * 0.8 + 1, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = e > 500 && Math.floor(e / 120) % 2 ? '#ffffff' : '#d8c8a0'; ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath(); ctx.moveTo(cx - open, cy + k * open * 0.3); ctx.lineTo(cx + open, cy + k * open * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + k * open * 0.35, cy - open * 0.8); ctx.lineTo(cx + k * open * 0.35, cy + open * 0.8); ctx.stroke();
      }
      ctx.fillStyle = '#8a8a8a'; for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(cx + ax * open - 1, cy + ay * open * 0.8 - 1, 3, 3);
    }
  }
  if (dv) drawDevourFx(ctx, B, dv, de);
  drawPops(ctx, B, v);
  drawEmph(ctx, v);
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
  if (sc.done) img = monSprite(sc.now, { frame: Math.floor(v.t / 520) % 2 });
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
  if (sc.plain) { // 필드 부화: 어두운 밤하늘 배경
    const gr = ctx.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#1a1438'); gr.addColorStop(1, '#4a3a5a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = Math.sin(v.t / 300 + i) > 0.5 ? '#ffffff' : '#8a8ab0'; ctx.fillRect((i * 53) % SW, (i * 29) % 100, 1, 1); }
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(SW / 2, 128, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
    drawHatch(ctx, v, sc);
    return;
  }
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
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, SW, SH);
    drawHatch(ctx, v, sc);
  }
}
function drawHatch(ctx, v, sc) {
  {
    const e = v.t - sc.t0;
    if (e < 2200) {
      const sh = e > 600 ? Math.sin(e / 30) * (e / 600) : 0;
      ctx.drawImage(eggSprite(SPECIES[sc.mon.sid].pal[0]), 0, 0, 24, 28, Math.round(SW / 2 - 24 + sh), 60, 48, 56);
      if (e > 600) { ctx.fillStyle = '#1c1424'; ctx.fillRect(SW / 2 - 6, 74, 2, 8); ctx.fillRect(SW / 2 - 4, 80, 6, 2); }
      if (e > 1300) { ctx.fillRect(SW / 2 + 4, 66, 2, 10); ctx.fillRect(SW / 2 - 2, 90, 10, 2); }
    } else {
      if (e < 2500) { ctx.fillStyle = `rgba(255,255,255,${1 - (e - 2200) / 300})`; ctx.fillRect(0, 0, SW, SH); }
      drawMonster(ctx, lookOf(sc.mon), SW / 2 - 48, 36, 96, { t: v.t });
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
  const parade = [1, 13, 89, 63, 82, 79, 4, 61, 7, 90, 31, 25];
  parade.forEach((sid, i) => {
    const x = ((t / 30 + i * 52) % (SW + 520)) - 60;
    const m = { sid };
    const n = spriteSize(sid) * 1.4;
    drawMonster(ctx, m, Math.round(x), Math.round(160 - n), n, { t: t + i * 300, silhouette: true });
  });
  drawEmbers(ctx, t);
}

