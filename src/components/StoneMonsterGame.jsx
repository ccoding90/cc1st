import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Game, PARTY_MAX } from './stonemon/game';
import { draw, SW, SH } from './stonemon/render';
import { monDataUrl } from './stonemon/sprites';
import { SPECIES, SKILLS, TRAITS, ELEMENTS, STAGES, TIER_NAME, SPECIES_COUNT, maxPP, isBasic } from './stonemon/data';
import { formName, power, maxHp, eff, elementsOf, geneTotal, stageThreshold, ppLeft } from './stonemon/monster';
import { typeMult, STATUS } from './stonemon/battle';
import { unlockAudio, setMuted } from './coffee/sound';

const PIXEL_FONT_CSS = 'https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/galmuri.css';
const FONT = "'Galmuri11', 'Galmuri9', 'Noto Sans KR', monospace";
const MUTED_KEY = 'stonemonMuted';

function usePixelFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${PIXEL_FONT_CSS}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = PIXEL_FONT_CSS;
    document.head.appendChild(link);
  }, []);
}

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsSupported = () => typeof document !== 'undefined' && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

const KEYMAP = {
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  z: 'a', Z: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', Backspace: 'b', Enter: 'start', m: 'start', M: 'start',
};

// 🦖 스톤몬스터 - 화면 껍데기. 진행 로직은 stonemon/game.js, 그림은 stonemon/render.js
const StoneMonsterGame = () => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const gameRef = useRef(null);
  if (!gameRef.current) gameRef.current = new Game(refresh);
  const g = gameRef.current;
  const canvasRef = useRef(null);
  const [muted, setMutedState] = useState(() => { try { return localStorage.getItem(MUTED_KEY) === '1'; } catch (e) { return false; } });
  usePixelFont();

  useEffect(() => {
    setMuted(muted);
    try { localStorage.setItem(MUTED_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
  }, [muted]);

  // 렌더 루프
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      g.update(dt);
      draw(ctx, g);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [g]);

  // 키보드
  useEffect(() => {
    const down = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      const k = KEYMAP[e.key];
      if (!k) return;
      e.preventDefault();
      unlockAudio();
      if (['up', 'down', 'left', 'right'].includes(k)) g.hold(k, true);
      if (k === 'b') g.running = true;
      g.press(k);
    };
    const up = (e) => {
      const k = KEYMAP[e.key];
      if (k && ['up', 'down', 'left', 'right'].includes(k)) g.hold(k, false);
      if (k === 'b') g.running = false;
    };
    const blur = () => { g.held = []; g.running = false; };
    const persist = () => { if (g.S && !g.ui.title) g.save(); };
    const onHide = () => { if (document.hidden) persist(); };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      persist();
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', persist); document.removeEventListener('visibilitychange', onHide);
    };
  }, [g]);

  const ui = g.ui;
  const v = g.v;

  // 전체화면: 지원 브라우저는 Fullscreen API, 아이폰 사파리 등은 화면을 꽉 채우는 가상 전체화면
  const fsRef = useRef(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [pseudoFs, setPseudoFs] = useState(false);
  const isFs = nativeFs || pseudoFs;
  const [codeOpen, setCodeOpen] = useState(false);
  useEffect(() => {
    const sync = () => setNativeFs(!!fsElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);
  useEffect(() => {
    if (!pseudoFs) return undefined;
    const { body, documentElement: html } = document;
    const prev = [body.style.overflow, html.style.overflow];
    body.style.overflow = 'hidden'; html.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => { [body.style.overflow, html.style.overflow] = prev; };
  }, [pseudoFs]);
  const toggleFullscreen = () => {
    unlockAudio();
    const el = fsRef.current;
    if (!el) return;
    if (pseudoFs) { setPseudoFs(false); return; }
    if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {}); return; }
    const req = fsSupported() && (el.requestFullscreen || el.webkitRequestFullscreen);
    if (!req) { setPseudoFs(true); return; }
    try { req.call(el)?.catch?.(() => setPseudoFs(true)); } catch (e) { setPseudoFs(true); }
  };

  // 주기적 자동 저장 (이동 위치까지 저장 → 언제 나가도 이어하기)
  useEffect(() => {
    const id = setInterval(() => { if (!g.ui.title && g.S?.flags?.intro) g.save(); }, 8000);
    return () => clearInterval(id);
  }, [g]);

  const startNew = () => {
    unlockAudio();
    if (g.hasSave() && !window.confirm('새로 시작하면 지금 데리고 있는 스톤몬과 아이템이 모두 사라집니다. (도감·무덤 기록은 유지)\n계속할까요?')) return;
    g.newGame();
  };
  const cont = () => { unlockAudio(); g.continueGame(); };

  return (
    <div style={page}>
      <div ref={fsRef} style={pseudoFs ? pseudoFsShell : isFs ? fsShell : undefined}>
      <div style={isFs ? { ...topBar, width: '100%', maxWidth: 720, margin: '0 auto 6px' } : topBar}>
        {!isFs && <Link to="/game-hub" style={topLink}>← 게임 센터</Link>}
        <span style={{ flex: 1 }} />
        <button type="button" style={topBtn} onClick={() => setMutedState((m) => !m)}>{muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</button>
        <button type="button" style={topBtn} onClick={toggleFullscreen}>{isFs ? '⤢ 전체화면 종료' : '⛶ 전체화면'}</button>
      </div>

      <div style={isFs ? fsStageWrap : stageWrap}>
        <div style={stage} onPointerDown={() => unlockAudio()}>
          <canvas ref={canvasRef} width={SW} height={SH} style={canvasStyle} />

          {ui.hud && v.mode === 'battle' && <BattleHud hud={ui.hud} />}
          {v.mode === 'map' && !ui.title && g.S?.party?.[0] && <MapHud m={g.S.party[0]} S={g.S} />}
          {ui.title && <TitleOverlay hasSave={g.hasSave()} save={g.S} onNew={startNew} onContinue={cont} onCode={() => setCodeOpen(true)} />}
          {ui.dialog && <DialogBox d={ui.dialog} onTap={() => g.press('a')} />}
          {ui.choice && !ui.choice.wide && <ChoiceBox c={ui.choice} />}
          {ui.cmd && v.battle && <CommandBox c={ui.cmd} g={g} />}
          {ui.toast && <div style={toast}>{ui.toast}</div>}
          {ui.nameInput && <NameInput onSubmit={ui.nameInput.submit} />}
        </div>
      </div>

      <Controls g={g} />

      {!isFs && (
        <div style={helpText}>
          방향키/WASD 이동 · B(X) 누른 채 이동 = 달리기 · Z/Space = A(조사·결정) · X/Esc = B(취소) · Enter = 메뉴 · 진행은 자동 저장되어 언제든 이어할 수 있어요
        </div>
      )}

      {ui.choice && ui.choice.wide && <WideChoice c={ui.choice} />}
      {ui.card && <ResultCard card={ui.card} />}
      {ui.panel && <Panel kind={ui.panel.kind} g={g} />}
      {codeOpen && <CodeLoad g={g} onClose={() => setCodeOpen(false)} onLoaded={() => { setCodeOpen(false); refresh(); }} />}
      </div>

      <GameIntro />
    </div>
  );
};

// ───────── 타이틀 ─────────
const ago = (t) => {
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 1 ? '방금 전' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`;
};
const TitleOverlay = ({ hasSave, save, onNew, onContinue, onCode }) => {
  const lead = save?.party?.[0];
  return (
    <div style={titleWrap}>
      <div style={logoEn}>STONE MONSTER</div>
      <div style={logoKo}>스톤몬스터</div>
      <div style={tagline}>먹어라. 진화하라. 먹히지 마라.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '3%', alignItems: 'stretch' }}>
        {hasSave && (
          <button type="button" style={titleBtn} onClick={onContinue}>
            ▶ 이어하기
            <span style={{ display: 'block', fontSize: '0.68em', fontWeight: 400, opacity: 0.9 }}>
              {save.name} · {save.runs}번째 생 · {lead ? `${formName(lead)} ★${power(lead)}` : '스톤몬 받기 전'}{save.savedAt ? ` · ${ago(save.savedAt)} 저장` : ''}
            </span>
          </button>
        )}
        <button type="button" style={{ ...titleBtn, background: hasSave ? '#5a3a4a' : '#c62828' }} onClick={onNew}>
          {hasSave ? '↺ 새로 시작' : '▶ 모험 시작'}
        </button>
        <button type="button" style={{ ...titleBtn, background: '#2a3a5a', fontSize: '0.8em', padding: '0.35em 1em' }} onClick={onCode}>
          🔑 코드로 이어하기 (다른 기기)
        </button>
      </div>
      <div style={titleFoot}>DEMO · 1단계 태초마을 · 스톤몬 {SPECIES_COUNT}종 · 자동 저장</div>
    </div>
  );
};

// ───────── 코드로 이어하기 ─────────
const CodeLoad = ({ g, onClose, onLoaded }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!code.trim() || busy) return;
    if (g.hasSave() && !window.confirm('이 기기에 있던 진행이 불러온 모험으로 바뀝니다. 계속할까요?')) return;
    setBusy(true);
    const r = await g.loadFromCode(code);
    setBusy(false);
    setMsg(r.msg);
    if (r.ok) setTimeout(onLoaded, 700);
  };
  return (
    <div style={modalBack} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalTitle}>🔑 코드로 이어하기</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
          게임 메뉴 → <b>💾 저장 · 이어하기 코드</b>에서 받은 <b>10자리 모험 코드</b> 또는 <b>백업 문자열(SM1:…)</b>을 입력하세요.
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="예) K7QX2M9PTA"
          rows={code.length > 20 ? 4 : 1}
          style={{ ...nameInputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
        />
        {msg && <div style={{ marginTop: 8, fontSize: 13, color: msg.includes('불러왔') ? '#7fe08a' : '#ff8a8a' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" style={{ ...titleBtn, flex: 1 }} onClick={load} disabled={busy}>{busy ? '불러오는 중…' : '불러오기'}</button>
          <button type="button" style={smallBtn} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

// ───────── 맵 HUD: 대장의 포식·변이 진행도 ─────────
const MapHud = ({ m, S }) => {
  const total = geneTotal(m), next = stageThreshold(m.stage + 1), prev = stageThreshold(m.stage);
  return (
    <div style={mapHud}>
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>👑 {formName(m)} <span style={{ color: '#ffd166' }}>★{power(m)}</span></div>
      <div style={{ fontSize: '0.8em', opacity: 0.9 }}>변이 {m.stage}단계 · 포식 {m.devours}회 · 🦴{S.bones}</div>
      <div style={{ ...hpTrack, height: 5, border: '1px solid #000' }}>
        <div style={{ ...hpFill, width: `${Math.max(0, Math.min(1, (total - prev) / (next - prev))) * 100}%`, background: 'linear-gradient(90deg,#7fe0ff,#ff5aff)' }} />
      </div>
      <div style={{ fontSize: '0.7em', opacity: 0.8 }}>다음 변이까지 유전자 {total}/{next}</div>
    </div>
  );
};

// ───────── 대화창 ─────────
const DialogBox = ({ d, onTap }) => (
  <div style={dialogBox} onClick={onTap} role="button" tabIndex={-1}>
    {d.speaker && <div style={speakerTag}>{d.speaker}</div>}
    <div style={{ whiteSpace: 'pre-wrap' }}>{d.text.slice(0, d.shown)}</div>
    {d.shown >= d.text.length && !d.auto && <span style={nextMark}>▼</span>}
  </div>
);

// ───────── 선택지 (작은 상자) ─────────
const ChoiceBox = ({ c }) => (
  <>
    <div style={dialogBox}><div style={{ whiteSpace: 'pre-wrap' }}>{c.title}</div></div>
    <div style={choiceBox}>
      {c.options.map((o, i) => (
        <div
          key={i}
          role="button"
          tabIndex={-1}
          onClick={() => c.pick(i)}
          style={{ ...choiceItem, opacity: o.disabled ? 0.45 : 1 }}
        >
          <span style={{ width: '1.1em', display: 'inline-block' }}>{c.idx === i ? '▶' : ''}</span>
          <span>
            {o.label}
            {o.sub && <span style={choiceSub}>{o.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  </>
);

// ───────── 선택지 (넓은 창: 스타팅·도전 상대·기술 흡수) ─────────
const WideChoice = ({ c }) => (
  <div style={modalBack}>
    <div style={{ ...modalBox, maxWidth: 560 }}>
      <div style={modalTitle}>{c.title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {c.options.map((o, i) => (
          <div
            key={i}
            role="button"
            tabIndex={-1}
            onClick={() => c.pick(i)}
            style={{
              ...wideItem,
              borderColor: c.idx === i ? '#ffd166' : '#5a4a6a',
              background: c.idx === i ? '#3a2a4a' : '#241a30',
              opacity: o.disabled ? 0.45 : 1,
            }}
          >
            {o.mon && <img alt="" src={monDataUrl(o.mon, {}, 2)} style={{ width: 64, height: 64, imageRendering: 'pixelated', flexShrink: 0 }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{c.idx === i ? '▶ ' : ''}{o.label}</div>
              {o.sub && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3, lineHeight: 1.45 }}>{o.sub}</div>}
            </div>
          </div>
        ))}
      </div>
      {c.cancel && <button type="button" style={{ ...smallBtn, marginTop: 10 }} onClick={() => c.pick(-1)}>닫기 (B)</button>}
    </div>
  </div>
);

// ───────── 배틀 HUD ─────────
const hpColor = (r) => (r > 0.5 ? '#3ad06a' : r > 0.2 ? '#f0c030' : '#e83a3a');
const HpBar = ({ hp, max }) => {
  const r = Math.max(0, Math.min(1, hp / max));
  return (
    <div style={hpOuter}>
      <span style={hpLabel}>HP</span>
      <div style={hpTrack}><div style={{ ...hpFill, width: `${r * 100}%`, background: hpColor(r) }} /></div>
    </div>
  );
};
const ElChips = ({ els }) => (
  <span>{els.map((e) => <span key={e} title={ELEMENTS[e].name} style={{ marginRight: 1 }}>{ELEMENTS[e].icon}</span>)}</span>
);
const BattleHud = ({ hud }) => (
  <>
    {hud.e && (
      <div style={{ ...hudBox, left: '3%', top: '3%' }}>
        <div style={hudName}>
          {hud.e.alpha && <span style={{ color: '#ff5a5a' }}>👑</span>}{hud.e.name}
          {hud.e.status && <span style={{ ...stTag, background: STATUS[hud.e.status].color }}>{STATUS[hud.e.status].name}</span>}
        </div>
        <div style={hudSub}><ElChips els={hud.e.els} /> ★{hud.e.power}{hud.e.stage ? ` · 변이${hud.e.stage}` : ''}</div>
        <HpBar hp={hud.e.hp} max={hud.e.max} />
      </div>
    )}
    {hud.p && (
      <div style={{ ...hudBox, right: '3%', top: '46%' }}>
        <div style={hudName}>
          {hud.p.name}
          {hud.p.status && <span style={{ ...stTag, background: STATUS[hud.p.status].color }}>{STATUS[hud.p.status].name}</span>}
        </div>
        <div style={hudSub}><ElChips els={hud.p.els} /> ★{hud.p.power}{hud.p.stage ? ` · 변이${hud.p.stage}` : ''}</div>
        <HpBar hp={hud.p.hp} max={hud.p.max} />
        <div style={{ textAlign: 'right', fontSize: '0.85em' }}>{hud.p.hp} / {hud.p.max}</div>
      </div>
    )}
  </>
);

// ───────── 전투 명령 ─────────
const CommandBox = ({ c, g }) => {
  const B = g.v.battle;
  if (c.level === 'main') {
    const labels = ['⚔️ 싸운다', '🦖 스톤몬', '🎒 가방', B.kind === 'wild' ? '🏃 도망' : '🚫 도망'];
    return (
      <div style={{ ...dialogBox, display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{formName(B.player.m)}{'\n'}무엇을 할까?</div>
        <div style={cmdGrid}>
          {labels.map((l, i) => (
            <div key={l} role="button" tabIndex={-1} style={{ ...cmdItem, background: c.idx === i ? '#ffd166' : 'transparent' }} onClick={() => g.cmdPick(i)}>
              {l}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const skills = B.player.m.skills;
  const cur = SKILLS[skills[c.idx]];
  const tm = cur?.pow ? typeMult(cur.el, B.enemy.m) : 1;
  return (
    <div style={{ ...dialogBox, padding: '1.5% 2%' }}>
      <div style={{ ...cmdGrid, width: '100%', gridTemplateColumns: '1fr 1fr' }}>
        {skills.map((s, i) => {
          const sk = SKILLS[s];
          const left = ppLeft(B.player.m, s);
          return (
            <div key={s} role="button" tabIndex={-1} style={{ ...cmdItem, display: 'flex', gap: 4, background: c.idx === i ? '#ffd166' : 'transparent', borderLeft: `4px solid ${ELEMENTS[sk.el].color}`, opacity: left > 0 ? 1 : 0.4 }} onClick={() => g.cmdPick(i)}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ELEMENTS[sk.el].icon} {sk.name}</span>
              <span style={{ fontSize: '0.75em', opacity: 0.8 }}>{left === Infinity ? '∞' : `${left}/${maxPP(s)}`}</span>
            </div>
          );
        })}
      </div>
      {cur && (
        <div style={skillInfo}>
          <span>{ELEMENTS[cur.el].name} · {cur.pow ? `위력 ${cur.pow}` : '변화'} · 명중 {cur.acc} · {isBasic(skills[c.idx]) ? '기본기(무제한)' : `남은 횟수 ${ppLeft(B.player.m, skills[c.idx])}/${maxPP(skills[c.idx])}`}{cur.pow ? (tm > 1 ? ' · 💥효과 굉장' : tm < 1 ? ' · 💤효과 별로' : '') : ''}</span>
          <span role="button" tabIndex={-1} style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => g.cmdPick(-1)}>◀ 뒤로</span>
        </div>
      )}
    </div>
  );
};

// ───────── 이름 입력 ─────────
const NameInput = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const ok = () => onSubmit((name.trim() || '돌이').slice(0, 8));
  return (
    <div style={{ ...dialogBox, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>이름:</span>
      <input
        autoFocus
        maxLength={8}
        value={name}
        placeholder="돌이"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') ok(); }}
        style={nameInputStyle}
      />
      <button type="button" style={smallBtn} onClick={ok}>결정</button>
    </div>
  );
};

// ───────── 결과 카드 (포식 · 변이) ─────────
const STAT_LABEL = { hp: '체력', atk: '공격', def: '방어', spd: '스피드' };
const ResultCard = ({ card }) => {
  const { kind, mon, res } = card;
  if (kind === 'code') return <CodeCard card={card} />;
  const total = geneTotal(mon);
  const next = stageThreshold(mon.stage + 1);
  const prevT = stageThreshold(mon.stage);
  const prog = Math.max(0, Math.min(1, (total - prevT) / (next - prevT)));
  return (
    <div style={modalBack} onClick={card.close}>
      <div style={{ ...modalBox, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        {kind === 'devour' ? (
          <>
            <div style={{ ...modalTitle, color: '#ff6a6a' }}>🍖 포식 완료</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img alt="" src={monDataUrl(card.prey, { silhouette: true }, 1)} style={{ width: 48, height: 48, imageRendering: 'pixelated', opacity: 0.6 }} />
              <span style={{ fontSize: 22 }}>▶</span>
              <img alt="" src={monDataUrl(mon, {}, 2)} style={{ width: 96, height: 96, imageRendering: 'pixelated' }} />
            </div>
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{formName(mon)}</div>
            <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.8 }}>{SPECIES[card.prey.sid].name}의 피와 뼈가 녹아들었다</div>
          </>
        ) : (
          <>
            <div style={{ ...modalTitle, color: '#7fe0ff' }}>🧬 변이 진화!</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img alt="" src={monDataUrl(card.old, {}, 1)} style={{ width: 64, height: 64, imageRendering: 'pixelated', opacity: 0.75 }} />
              <span style={{ fontSize: 22 }}>▶</span>
              <img alt="" src={monDataUrl(mon, {}, 2)} style={{ width: 128, height: 128, imageRendering: 'pixelated' }} />
            </div>
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 18 }}>{res.before.name} ▶ <span style={{ color: '#ffd166' }}>{res.after.name}</span></div>
            <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.85 }}>변이 {res.before.stage}단계 ▶ {res.after.stage}단계 · 다음 단계는 끝이 없다</div>
            {res.mutations.length > 0 && (
              <div style={mutBox}>
                {res.mutations.map((l, i) => (
                  <div key={i} style={{ marginBottom: 6 }}><b style={{ color: ELEMENTS[l.el].color }}>{ELEMENTS[l.el].icon} {ELEMENTS[l.el].name} 변이</b> — {l.text}</div>
                ))}
              </div>
            )}
          </>
        )}
        <div style={statTable}>
          {['hp', 'atk', 'def', 'spd'].map((k) => (
            <React.Fragment key={k}>
              <span>{STAT_LABEL[k]}</span>
              <span style={{ textAlign: 'right' }}>{res.before.stats[k]} ▶ <b>{res.after.stats[k]}</b></span>
              <span style={{ color: '#7fe08a', textAlign: 'right' }}>+{res.after.stats[k] - res.before.stats[k]}</span>
            </React.Fragment>
          ))}
          <span>전투력</span>
          <span style={{ textAlign: 'right' }}>★{res.before.power} ▶ <b>★{res.after.power}</b></span>
          <span style={{ color: '#ffd166', textAlign: 'right' }}>+{res.after.power - res.before.power}</span>
        </div>
        {kind === 'devour' && (
          <>
            <div style={chipRow}>
              {Object.entries(res.geneGain).map(([el, n]) => (
                <span key={el} style={{ ...chip, borderColor: ELEMENTS[el].color }}>{ELEMENTS[el].icon} {ELEMENTS[el].name} 유전자 +{n}</span>
              ))}
              {res.traitGain.map(({ t, lv }) => (
                <span key={t} style={{ ...chip, borderColor: '#ffd166' }}>✨ {TRAITS[t].name} Lv{lv}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, marginTop: 8 }}>다음 변이까지 유전자 {total} / {next}</div>
            <div style={hpTrack}><div style={{ ...hpFill, width: `${prog * 100}%`, background: 'linear-gradient(90deg,#7fe0ff,#ff5aff)' }} /></div>
          </>
        )}
        <button type="button" style={{ ...titleBtn, width: '100%', marginTop: 12 }} onClick={card.close}>확인 (A)</button>
      </div>
    </div>
  );
};

// ───────── 이어하기 코드 안내 ─────────
const CodeCard = ({ card }) => (
  <div style={modalBack} onClick={card.close}>
    <div style={{ ...modalBox, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
      <div style={modalTitle}>💾 이어하기</div>
      {card.code ? (
        <>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>다른 기기(또는 브라우저)의 타이틀 화면 → <b>🔑 코드로 이어하기</b>에 아래 코드를 입력하세요. 집에서 쉴 때마다 자동으로 갱신됩니다.</div>
          <div style={codeText}>{card.code}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>코드를 아는 사람은 이 모험을 불러올 수 있으니 혼자만 보관하세요.</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{card.copied ? '백업 문자열을 클립보드에 복사했습니다.' : '아래 문자열을 전부 복사해 보관하세요.'} 타이틀 → <b>🔑 코드로 이어하기</b>에 붙여넣으면 복원됩니다.</div>
          <textarea readOnly value={card.backup} rows={5} style={{ width: '100%', boxSizing: 'border-box', fontSize: 11, marginTop: 8 }} onFocus={(e) => e.target.select()} />
        </>
      )}
      <button type="button" style={{ ...titleBtn, width: '100%', marginTop: 12 }} onClick={card.close}>확인 (A)</button>
    </div>
  </div>
);

// ───────── 패널: 스톤몬 / 도감 / 기록 ─────────
const Panel = ({ kind, g }) => (
  <div style={modalBack} onClick={() => g.closePanel()}>
    <div style={{ ...modalBox, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ ...modalTitle, margin: 0, flex: 1, textAlign: 'left' }}>
          {kind === 'party' ? '🦖 스톤몬' : kind === 'codex' ? '📖 스톤몬 도감' : '🪦 기록 · 무덤'}
        </div>
        <button type="button" style={smallBtn} onClick={() => g.closePanel()}>닫기 ✕</button>
      </div>
      {kind === 'party' && <PartyPanel g={g} />}
      {kind === 'codex' && <CodexPanel g={g} />}
      {kind === 'records' && <RecordsPanel g={g} />}
    </div>
  </div>
);

const PartyPanel = ({ g }) => {
  const party = g.S.party;
  if (!party.length) return <div>스톤몬이 없다.</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>동료 {party.length}/{PARTY_MAX} · 맨 위가 대장(먼저 싸움). 패배한 스톤몬은 먹혀서 영원히 사라집니다.</div>
      {party.map((m, i) => {
        const e = eff(m);
        const genes = Object.entries(m.genes || {}).sort((a, b) => b[1] - a[1]);
        const eaten = Object.entries(m.prey || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return (
          <div key={m.uid} style={monCard}>
            <div style={{ display: 'flex', gap: 10 }}>
              <img alt="" src={monDataUrl(m, {}, 2)} style={{ width: 96, height: 96, imageRendering: 'pixelated', flexShrink: 0, background: '#1a1224', borderRadius: 6 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{i === 0 && '👑 '}{formName(m)}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  No.{m.sid} {SPECIES[m.sid].name} · ★{power(m)} · 변이 {m.stage}단계 · 포식 {m.devours}회
                </div>
                <div style={{ fontSize: 12, margin: '3px 0' }}>{elementsOf(m).map((el) => `${ELEMENTS[el].icon}${ELEMENTS[el].name}`).join(' ')}</div>
                <HpBar hp={m.hp} max={maxHp(m)} />
                <div style={{ fontSize: 12 }}>HP {m.hp}/{maxHp(m)} · 공격 {e.atk} · 방어 {e.def} · 스피드 {e.spd}</div>
              </div>
            </div>
            <div style={chipRow}>
              {m.skills.map((s) => <span key={s} style={{ ...chip, borderColor: ELEMENTS[SKILLS[s].el].color }}>{ELEMENTS[SKILLS[s].el].icon} {SKILLS[s].name}{SKILLS[s].pow ? ` ${SKILLS[s].pow}` : ''}</span>)}
            </div>
            <div style={chipRow}>
              {Object.entries(m.traits).map(([t, lv]) => <span key={t} title={TRAITS[t].desc} style={{ ...chip, borderColor: '#ffd166' }}>✨ {TRAITS[t].name} Lv{lv}</span>)}
            </div>
            {genes.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {genes.map(([el, n]) => (
                  <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <span style={{ width: 56 }}>{ELEMENTS[el].icon}{ELEMENTS[el].name}</span>
                    <div style={{ ...hpTrack, flex: 1 }}><div style={{ ...hpFill, width: `${Math.min(100, (n / 40) * 100)}%`, background: ELEMENTS[el].color }} /></div>
                    <span style={{ width: 24, textAlign: 'right' }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
            {eaten.length > 0 && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>먹은 것: {eaten.map(([sid, c]) => `${SPECIES[sid].name}×${c}`).join(', ')}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {i > 0 && <button type="button" style={smallBtn} onClick={() => g.setLead(m)}>👑 대장으로</button>}
              {party.length > 1 && <button type="button" style={{ ...smallBtn, background: '#7a1a24', color: '#fff' }} onClick={() => g.feed(m)}>🍖 먹이로 바치기</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CodexPanel = ({ g }) => {
  const { seen, eaten, owned } = g.S.codex;
  const [sel, setSel] = useState(null);
  const sp = sel ? SPECIES[sel] : null;
  const known = sel && (eaten[sel] || owned[sel]);
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
        발견 {Object.keys(seen).length} · 포식 {Object.keys(eaten).length} · 봉인 {Object.keys(owned).length} / {SPECIES_COUNT}종 — 포식하거나 봉인하면 상세 정보가 기록됩니다.
      </div>
      {sp && (
        <div style={{ ...monCard, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <img alt="" src={monDataUrl({ sid: sp.id }, { silhouette: !seen[sp.id] }, 2)} style={{ width: 96, height: 96, imageRendering: 'pixelated', background: '#1a1224', borderRadius: 6 }} />
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>No.{sp.id} {seen[sp.id] ? sp.name : '???'}</div>
              <div>{ELEMENTS[sp.el].icon}{ELEMENTS[sp.el].name} · {TIER_NAME[sp.tier]} · 서식지: {STAGES[sp.stage].name}</div>
              {known ? (
                <>
                  <div>체력 {sp.base.hp} · 공격 {sp.base.atk} · 방어 {sp.base.def} · 스피드 {sp.base.spd}</div>
                  <div>특성: {TRAITS[sp.trait].name} ({TRAITS[sp.trait].desc})</div>
                  <div>기술: {sp.skills.map((s) => SKILLS[s].name).join(', ')}</div>
                  <div style={{ marginTop: 4, opacity: 0.9 }}>{sp.desc}</div>
                  {eaten[sp.id] && <div style={{ color: '#ff8a8a' }}>🍖 포식 {eaten[sp.id]}회</div>}
                </>
              ) : (
                <div style={{ opacity: 0.7 }}>{seen[sp.id] ? '포식하거나 봉인하면 자세한 기록이 남는다.' : '아직 만나지 못했다.'}</div>
              )}
            </div>
          </div>
        </div>
      )}
      <div style={codexGrid}>
        {Object.values(SPECIES).map((s) => {
          const st = eaten[s.id] ? 'eaten' : owned[s.id] ? 'owned' : seen[s.id] ? 'seen' : 'none';
          return (
            <div key={s.id} role="button" tabIndex={-1} onClick={() => setSel(s.id)} style={{ ...codexCell, outline: sel === s.id ? '2px solid #ffd166' : 'none' }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{String(s.id).padStart(2, '0')}</div>
              {st === 'none' ? <div style={{ height: 48, display: 'grid', placeItems: 'center', opacity: 0.4 }}>?</div>
                : <img alt="" src={monDataUrl({ sid: s.id }, { silhouette: st === 'seen' }, 1)} style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />}
              <div style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {st === 'none' ? '???' : s.name}{st === 'eaten' ? ' 🍖' : st === 'owned' ? ' 🪨' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecordsPanel = ({ g }) => {
  const S = g.S;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
      <div style={monCard}>
        <div>👤 {S.name} · {S.runs}번째 생</div>
        <div>이번 생: 포식 {S.stats.devours}회 · 승리 {S.stats.wins}회 · 제단 승리 {S.stats.pvpWins}회 · 🦴{S.bones}</div>
        <div>역대 최강: {S.stats.bestName ? `${S.stats.bestName} ★${S.stats.best}` : '-'}</div>
        <div>태초마을: {S.flags.chief ? '🏆 족장 우가 격파' : '족장 우가 미격파'}</div>
      </div>
      <div style={{ fontWeight: 800, margin: '10px 0 4px' }}>🪦 먹힌 스톤몬들</div>
      {S.grave.length === 0 && <div style={{ opacity: 0.7 }}>아직 아무도 먹히지 않았다.</div>}
      {S.grave.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #3a2a4a', padding: '4px 0' }}>
          <img alt="" src={monDataUrl({ sid: r.sid }, {}, 1)} style={{ width: 40, height: 40, imageRendering: 'pixelated', filter: 'grayscale(1)', opacity: 0.8 }} />
          <div style={{ fontSize: 12 }}>
            <b>{r.name}</b> ★{r.power} · 포식 {r.devours}회 · 변이 {r.stage}단계<br />
            <span style={{ opacity: 0.75 }}>{r.run}번째 생 · {r.cause}에게 먹힘 · {new Date(r.date).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ───────── 조작 패드 ─────────
const Controls = ({ g }) => {
  const bind = (dir) => ({
    onPointerDown: (e) => { e.preventDefault(); unlockAudio(); g.hold(dir, true); g.press(dir); },
    onPointerUp: () => g.hold(dir, false),
    onPointerLeave: () => g.hold(dir, false),
    onPointerCancel: () => g.hold(dir, false),
  });
  const tap = (k) => ({ onPointerDown: (e) => { e.preventDefault(); unlockAudio(); g.press(k); } });
  return (
    <div style={controls}>
      <div style={dpad}>
        <button type="button" aria-label="위" style={{ ...dbtn, gridArea: 'u' }} {...bind('up')}>▲</button>
        <button type="button" aria-label="왼쪽" style={{ ...dbtn, gridArea: 'l' }} {...bind('left')}>◀</button>
        <button type="button" aria-label="오른쪽" style={{ ...dbtn, gridArea: 'r' }} {...bind('right')}>▶</button>
        <button type="button" aria-label="아래" style={{ ...dbtn, gridArea: 'd' }} {...bind('down')}>▼</button>
      </div>
      <button type="button" style={startBtn} {...tap('start')}>MENU</button>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" style={{ ...abtn, marginTop: 24 }} onPointerDown={(e) => { e.preventDefault(); unlockAudio(); g.running = true; g.press('b'); }} onPointerUp={() => { g.running = false; }} onPointerLeave={() => { g.running = false; }} onPointerCancel={() => { g.running = false; }}>B</button>
        <button type="button" style={abtn} {...tap('a')}>A</button>
      </div>
    </div>
  );
};

// ───────── 게임 소개 (검색/처음 방문자용) ─────────
const GameIntro = () => (
  <section style={introBox}>
    <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>🦖 스톤몬스터 (Stone Monster) — 포식 진화 RPG</h1>
    <p>원시 시대와 몬스터 세계가 뒤섞인 땅. 돌알에서 태어난 <b>스톤몬스터</b>는 레벨업으로 자라지 않습니다. 오직 <b>쓰러뜨린 상대를 잡아먹는 것(포식)</b>으로만 강해집니다.</p>
    <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
      <li><b>포식 흡수</b> — 먹은 스톤몬의 능력치·속성 유전자·특성·기술이 그대로 흡수됩니다. 번개 스톤몬을 먹으면 번개 가시와 번개 내성이 생겨요.</li>
      <li><b>무한 변이 진화</b> — 유전자가 쌓일 때마다 날개·불꽃 꼬리·얼음 결정 등 외형이 변하고 이름이 바뀝니다. 변이 단계에는 끝이 없습니다.</li>
      <li><b>포식의 제단(대전)</b> — 다른 플레이어가 키운 스톤몬의 그림자와 목숨을 건 대결. 이기면 먹고, 지면 먹힙니다.</li>
      <li><b>약육강식</b> — 진 스톤몬은 영원히 사라지고, 모두 잃으면 처음부터 다시 시작합니다.</li>
      <li>스톤몬 {SPECIES_COUNT}종 · 8속성(원시·화염·물·번개·바람·대지·얼음·독) · 데모는 1단계 「태초마을」까지 플레이할 수 있습니다.</li>
    </ul>
  </section>
);

// ───────── 스타일 ─────────
const page = { maxWidth: 760, margin: '0 auto', padding: '12px 10px 30px', fontFamily: FONT, color: '#2a1e2e' };
const topBar = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 };
const topLink = { fontSize: 13, color: '#5a3a4a', textDecoration: 'none', fontWeight: 700 };
const topBtn = { padding: '6px 10px', fontSize: 12, border: '2px solid #2a1e2e', background: '#fff', cursor: 'pointer', fontFamily: FONT };
const fsShell = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1a1220', overflow: 'auto', boxSizing: 'border-box', padding: 8 };
const pseudoFsShell = {
  ...fsShell, position: 'fixed', inset: 0, zIndex: 9000, height: '100dvh', overscrollBehavior: 'contain',
  padding: 'max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))',
};
const fsStageWrap = { width: `min(calc(100vw - 16px), 960px, calc((100dvh - 210px) * ${SW / SH}))`, minWidth: 260, margin: '0 auto' };
const codeText = { fontSize: 28, fontWeight: 900, letterSpacing: '0.12em', textAlign: 'center', margin: '12px 0', padding: 10, background: '#fbf7ee', color: '#1c1424', userSelect: 'all', WebkitUserSelect: 'all' };
const stageWrap = { width: `min(100%, 720px, calc((100dvh - 250px) * ${SW / SH}))`, minWidth: 280, margin: '0 auto' };
const stage = {
  position: 'relative', width: '100%', aspectRatio: `${SW} / ${SH}`, background: '#000', overflow: 'hidden',
  border: '4px solid #2a1e2e', boxShadow: '6px 6px 0 #a1887f', containerType: 'inline-size', userSelect: 'none', WebkitUserSelect: 'none',
  fontSize: 'clamp(10px, 3.1cqw, 17px)', lineHeight: 1.5, touchAction: 'manipulation',
};
const canvasStyle = { width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' };
const boxBase = { position: 'absolute', background: '#fbf7ee', color: '#1c1424', border: '3px solid #1c1424', boxShadow: 'inset 0 0 0 2px #fbf7ee, inset 0 0 0 4px #6a5a7a', boxSizing: 'border-box' };
const dialogBox = { ...boxBase, left: '1.5%', right: '1.5%', bottom: '2%', minHeight: '29%', padding: '2% 3%', cursor: 'pointer', zIndex: 5 };
const speakerTag = { position: 'absolute', top: '-1.6em', left: '3%', background: '#1c1424', color: '#ffd166', padding: '0 0.6em', fontSize: '0.85em' };
const nextMark = { position: 'absolute', right: '3%', bottom: '6%', animation: 'none', fontSize: '0.8em' };
const choiceBox = { ...boxBase, right: '1.5%', bottom: '33%', maxWidth: '72%', maxHeight: '64%', overflowY: 'auto', padding: '1.5% 2.5%', zIndex: 6 };
const choiceItem = { display: 'flex', cursor: 'pointer', padding: '0.15em 0' };
const choiceSub = { display: 'block', fontSize: '0.75em', opacity: 0.7 };
const cmdGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: '56%' };
const cmdItem = { padding: '0.25em 0.4em', cursor: 'pointer', border: '2px solid #1c1424', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const skillInfo = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.8em', marginTop: '1.2%' };
const hudBox = { ...boxBase, width: '50%', padding: '1% 2%', zIndex: 4, fontSize: '0.9em' };
const hudName = { fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const hudSub = { fontSize: '0.8em', opacity: 0.85 };
const stTag = { marginLeft: 4, padding: '0 0.3em', fontSize: '0.75em', color: '#1c1424', border: '1px solid #1c1424' };
const hpOuter = { display: 'flex', alignItems: 'center', gap: 4 };
const hpLabel = { fontSize: '0.7em', fontWeight: 800, color: '#e8a030' };
const hpTrack = { flex: 1, height: 7, background: '#3a2a3a', border: '2px solid #1c1424', overflow: 'hidden' };
const hpFill = { height: '100%', transition: 'width 0.4s linear, background 0.3s' };
const mapHud = { position: 'absolute', left: '15%', top: '1.5%', width: '44%', background: 'rgba(20,14,28,0.78)', color: '#fff', padding: '0.3em 0.6em', fontSize: '0.72em', lineHeight: 1.35, zIndex: 3, pointerEvents: 'none' };
const toast = { position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)', background: '#1c1424', color: '#ffd166', padding: '0.3em 0.9em', zIndex: 9 };
const nameInputStyle = { flex: 1, minWidth: 100, padding: 6, fontSize: 16, fontFamily: FONT, border: '2px solid #1c1424' };
const titleWrap = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', zIndex: 3, paddingBottom: '12%' };
const logoEn = { fontSize: '0.95em', letterSpacing: '0.35em', color: '#ffd166', textShadow: '2px 2px 0 #1c1424' };
const logoKo = { fontSize: '3.2em', fontWeight: 900, lineHeight: 1.1, color: '#fff3d6', textShadow: '4px 4px 0 #1c1424, -2px -2px 0 #8a2a1a' };
const tagline = { marginTop: '1%', color: '#ffe0c0', textShadow: '2px 2px 0 #1c1424' };
const titleBtn = { padding: '0.5em 1.4em', fontSize: '1em', fontWeight: 800, color: '#fff', background: '#c62828', border: '3px solid #1c1424', boxShadow: '4px 4px 0 #1c1424', cursor: 'pointer', fontFamily: FONT };
const titleFoot = { position: 'absolute', bottom: '3%', fontSize: '0.7em', color: '#ffe0c0', textShadow: '1px 1px 0 #000' };
const modalBack = { position: 'fixed', inset: 0, background: 'rgba(10,6,16,0.72)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' };
const modalBox = { width: '100%', maxHeight: '92dvh', overflowY: 'auto', background: '#1c1424', color: '#f4eadc', border: '3px solid #ffd166', boxShadow: '6px 6px 0 #000', padding: 14, boxSizing: 'border-box', fontFamily: FONT };
const modalTitle = { fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 10 };
const wideItem = { display: 'flex', gap: 10, alignItems: 'center', padding: 10, border: '2px solid', cursor: 'pointer' };
const smallBtn = { padding: '6px 10px', fontSize: 12, fontWeight: 700, border: '2px solid #1c1424', background: '#fbf7ee', color: '#1c1424', cursor: 'pointer', fontFamily: FONT };
const mutBox = { margin: '10px 0', padding: 10, background: '#2a1e38', borderLeft: '4px solid #ff5aff', fontSize: 13, lineHeight: 1.6 };
const statTable = { display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.6fr', gap: '2px 8px', margin: '10px 0', fontSize: 13, background: '#2a1e38', padding: 10 };
const chipRow = { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 };
const chip = { fontSize: 11, padding: '2px 6px', border: '2px solid', background: '#241a30' };
const monCard = { background: '#2a1e38', padding: 10, border: '2px solid #4a3a5a' };
const codexGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 };
const codexCell = { background: '#2a1e38', textAlign: 'center', padding: 4, cursor: 'pointer' };
const controls = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520, margin: '14px auto 0', padding: '0 8px', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' };
const dpad = { display: 'grid', gridTemplateAreas: '". u ." "l . r" ". d ."', gridTemplateColumns: '48px 48px 48px', gridTemplateRows: '48px 48px 48px' };
const dbtn = { background: '#2a1e2e', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', touchAction: 'none' };
const abtn = { width: 62, height: 62, borderRadius: '50%', background: '#c62828', color: '#fff', border: '3px solid #2a1e2e', fontSize: 22, fontWeight: 900, cursor: 'pointer', fontFamily: FONT, touchAction: 'none', boxShadow: '3px 3px 0 #2a1e2e' };
const startBtn = { padding: '6px 12px', fontSize: 12, background: '#5a4a6a', color: '#fff', border: '2px solid #2a1e2e', borderRadius: 12, cursor: 'pointer', fontFamily: FONT, alignSelf: 'flex-end', touchAction: 'none' };
const helpText = { textAlign: 'center', fontSize: 11, color: '#7a6a7a', marginTop: 10 };
const introBox = { marginTop: 22, padding: 16, background: '#fbf7ee', border: '2px solid #2a1e2e', fontSize: 14, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" };

export default StoneMonsterGame;
