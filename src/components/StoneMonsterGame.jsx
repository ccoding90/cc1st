import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Game, PARTY_MAX, BOX_MAX, EGG_MAX } from './stonemon/game';
import { draw, SW, SH } from './stonemon/render';
import { monDataUrl, loadSprites, onSpritesReady } from './stonemon/sprites';
import { SPECIES, SKILLS, TRAITS, ELEMENTS, STAGES, TIER_NAME, SPECIES_COUNT, maxPP, isBasic, RARE_SKILL, AWAKEN, AWAKEN_INFO, ELEMENT_UNLOCK, evoChain } from './stonemon/data';
import { formName, power, maxHp, eff, elementsOf, ppLeft, expNext, battleSkills, elementSkills, elementProgress, nextElementGoal, awakenTiers } from './stonemon/monster';
import { mapOf, HABITAT } from './stonemon/world';
import { effTypeMult, STATUS } from './stonemon/battle';
import { SYNERGIES, SYNERGY_KEYS, synergiesOf, synergyProgress } from './stonemon/synergy';
import { ACHIEVEMENTS, BONUS_NAME, achBonus, bonusText } from './stonemon/achievements';
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
  z: 'a', Z: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', Backspace: 'b', Enter: 'start', m: 'start', M: 'start', q: 'speed', Q: 'speed',
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
  // v4.0 도트 렌더러: 100종 기본 스프라이트를 유휴 시간에 미리 캐싱
  useEffect(() => { loadSprites(); return onSpritesReady(() => refresh()); }, []);

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
        <button type="button" style={{ ...topBtn, background: g.speed > 1 ? '#ffd166' : '#fff' }} title="게임 속도 (Q)" onClick={() => { unlockAudio(); g.cycleSpeed(); }}>⏩ {g.speed}x</button>
        <button type="button" style={topBtn} onClick={() => setMutedState((m) => !m)}>{muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}</button>
        <button type="button" style={topBtn} onClick={toggleFullscreen}>{isFs ? '⤢ 전체화면 종료' : '⛶ 전체화면'}</button>
      </div>

      <div style={stageWrapStyle(isFs)}>
        <div style={stage} onPointerDown={() => unlockAudio()}>
          <canvas ref={canvasRef} width={SW} height={SH} style={canvasStyle} />

          {ui.hud && v.mode === 'battle' && <BattleHud hud={ui.hud} />}
          {v.mode === 'map' && !ui.title && g.S?.party?.[0] && <MapHud m={g.S.party[0]} S={g.S} map={v.map} />}
          {ui.title && <TitleOverlay hasSave={g.hasSave()} save={g.S} onNew={startNew} onContinue={cont} onCode={() => setCodeOpen(true)} />}
          {ui.dialog && <DialogBox d={ui.dialog} onTap={() => g.press('a')} />}
          {ui.choice && !ui.choice.wide && <ChoiceBox c={ui.choice} />}
          {ui.cmd && v.battle && <CommandBox c={ui.cmd} g={g} />}
          {ui.toast && <div style={toast}>{ui.toast}</div>}
          {ui.ach && <AchToast a={ui.ach} />}
          {ui.nameInput && <NameInput onSubmit={ui.nameInput.submit} />}
        </div>
      </div>

      <Controls g={g} />

      {!isFs && (
        <div style={helpText}>
          방향키/WASD 이동 · B(X) 누른 채 이동 = 달리기 · Z/Space = A(조사·결정) · X/Esc = B(취소) · Enter = 메뉴 · Q = 배속(1x/2x/3x) · 진행은 자동 저장 · 메뉴 → 💾 저장에서 모험 코드 발급
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
      <div style={logoEn}>STONE MONSTERS</div>
      <div style={logoKo}>스톤몬스터</div>
      <div style={tagline}>먹어라. 진화하라. 먹히지 마라.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '3%', alignItems: 'stretch' }}>
        {hasSave && (
          <button type="button" style={titleBtn} onClick={onContinue}>
            ▶ 이어하기
            <span style={{ display: 'block', fontSize: '0.68em', fontWeight: 400, opacity: 0.9 }}>
              {save.name} · {save.runs}번째 생 · {lead ? `${formName(lead)} Lv.${lead.lv}` : '스톤몬 받기 전'} · {mapOf(save.pos?.map).name}{save.savedAt ? ` · ${ago(save.savedAt)} 저장` : ''}
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
      <div style={titleFoot}>v4.0 · 레벨업 진화 · 포식 스탯 무한 누적 · Stage 1~5 (태초의 숲 → 습지 → 화산 → 빙하 동굴 → 하늘 신전) · 원시 투기장 · 스톤몬 {SPECIES_COUNT}종</div>
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
          게임 메뉴(MENU) → <b>💾 저장 · 모험 코드</b>에서 받은 <b>10자리 모험 코드</b>를 입력하세요.
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
          placeholder="예) K7QX2M9PTA"
          maxLength={14}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          style={{ ...nameInputStyle, width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.12em' }}
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

// ───────── 맵 HUD: 대장의 레벨 · 진화 · 속성 습득 진행도 ─────────
const MapHud = ({ m, S, map }) => {
  const goal = nextElementGoal(m);
  const nx = SPECIES[m.sid].evolvesTo;
  const M = mapOf(map);
  return (
    <div style={mapHud}>
      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>👑 {formName(m)} <span style={{ color: '#ffd166' }}>Lv.{m.lv}</span><TierChips t={awakenTiers(m)} /></div>
      <div style={{ ...hpTrack, height: 4, border: '1px solid #000', margin: '1px 0' }}>
        <div style={{ ...hpFill, width: `${Math.min(1, (m.exp || 0) / expNext(m.lv)) * 100}%`, background: '#5ab8ff' }} />
      </div>
      <div style={{ fontSize: '0.8em', opacity: 0.9 }}>포식 {m.devours}회 · 🦴{S.bones}{nx ? ` · Lv.${nx.lv} 진화` : ''}</div>
      {goal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7em' }}>
          <span>{ELEMENTS[goal.el].icon}{goal.n}/{goal.need}</span>
          <div style={{ ...hpTrack, height: 4, border: '1px solid #000' }}><div style={{ ...hpFill, width: `${(goal.n / goal.need) * 100}%`, background: ELEMENTS[goal.el].color }} /></div>
        </div>
      )}
      <div style={{ fontSize: '0.7em', opacity: 0.8 }}>Stage {M.stage} · {M.name}{S.flags.endless ? ' · ♾️무한 사냥' : ''}</div>
      {(S.eggs?.length > 0 || S.title) && (
        <div style={{ fontSize: '0.7em', opacity: 0.9 }}>
          {S.title && <span style={{ color: '#ffd166' }}>「{S.title}」 </span>}
          {S.eggs?.length > 0 && <span>🥚 부화까지 {Math.min(...S.eggs.map((e) => e.left))}걸음</span>}
        </div>
      )}
    </div>
  );
};

// ───────── 업적 토스트 (화면 상단) ─────────
const AchToast = ({ a }) => (
  <div style={achToast}>
    <div style={{ fontSize: '0.75em', color: '#ffe8b0' }}>🏆 업적 달성!</div>
    <div style={{ fontWeight: 800 }}>{a.name} <span style={{ color: '#ffd166' }}>「{a.title}」</span></div>
    <div style={{ fontSize: '0.72em', opacity: 0.9 }}>영구 보너스: {bonusText(a)}</div>
  </div>
);

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
            {o.mon && <img alt="" src={monDataUrl(o.mon, {}, 2)} style={{ ...pixImg, width: 64, height: 64, flexShrink: 0 }} />}
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
const SynBadges = ({ syn }) => (syn?.length ? (
  <span>{syn.map((k) => <span key={k} title={`${SYNERGIES[k].name}: ${SYNERGIES[k].desc}`} style={{ ...synBadge, borderColor: SYNERGIES[k].color }}>{SYNERGIES[k].icon}</span>)}</span>
) : null);
// 스탯 임계치 각성 뱃지 (💢공격 · 🛡️방어 · 👑체력 + 단계)
const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'];
const TierChips = ({ t }) => (t ? (
  <span>{['atk', 'def', 'hp'].filter((k) => t[k] > 0).map((k) => <span key={k} title={`${AWAKEN_INFO[k].name} ${ROMAN[t[k]]}`} style={{ marginLeft: 3, color: AWAKEN_INFO[k].color }}>{AWAKEN_INFO[k].icon}{ROMAN[t[k]]}</span>)}</span>
) : null);
const VariantTag = ({ m }) => (m.alpha ? <span style={{ ...varTag, background: '#c62828' }}>알파</span> : m.shiny ? <span style={{ ...varTag, background: 'linear-gradient(90deg,#ff8af0,#8af0ff,#fff28a)', color: '#1c1424' }}>이로치</span> : null);
const BattleHud = ({ hud }) => (
  <>
    {(hud.weather || hud.round) && (
      <div style={weatherTag}>{hud.weather === 'blizzard' ? '❄️ 눈보라' : ''}{hud.round ? `🏟️ ${hud.round}번째 상대` : ''}</div>
    )}
    {hud.e && (
      <div style={{ ...hudBox, left: '3%', top: '3%' }}>
        <div style={hudName}>
          <VariantTag m={hud.e} />{hud.e.name} <SynBadges syn={hud.e.syn} />
          {hud.e.status && <span style={{ ...stTag, background: STATUS[hud.e.status].color }}>{STATUS[hud.e.status].name}{STATUS[hud.e.status].turns ? ` ${STATUS[hud.e.status].turns - (hud.e.stTurns || 0)}` : ''}</span>}
        </div>
        <div style={hudSub}><ElChips els={hud.e.els} /> <b>Lv.{hud.e.lv}</b><TierChips t={hud.e.tiers} /></div>
        <HpBar hp={hud.e.hp} max={hud.e.max} />
      </div>
    )}
    {hud.p && (
      <div style={{ ...hudBox, right: '3%', top: '46%' }}>
        <div style={hudName}>
          <VariantTag m={hud.p} />{hud.p.name} <SynBadges syn={hud.p.syn} />
          {hud.p.status && <span style={{ ...stTag, background: STATUS[hud.p.status].color }}>{STATUS[hud.p.status].name}{STATUS[hud.p.status].turns ? ` ${STATUS[hud.p.status].turns - (hud.p.stTurns || 0)}` : ''}</span>}
        </div>
        <div style={hudSub}><ElChips els={hud.p.els} /> <b>Lv.{hud.p.lv}</b><TierChips t={hud.p.tiers} /></div>
        <HpBar hp={hud.p.hp} max={hud.p.max} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85em' }}>
          <span style={{ ...hpLabel, color: '#3a8ad8' }}>EXP</span>
          <div style={{ ...hpTrack, height: 4 }}><div style={{ ...hpFill, width: `${Math.min(1, hud.p.exp) * 100}%`, background: '#5ab8ff' }} /></div>
          <span>{hud.p.hp} / {hud.p.max}</span>
        </div>
      </div>
    )}
  </>
);

// ───────── 전투 명령 ─────────
const CommandBox = ({ c, g }) => {
  const B = g.v.battle;
  if (c.level === 'main') {
    // 위기(HP 25% 이하) + 교대할 동료가 있으면 '교대' 버튼 강조
    const pm = B.player.m;
    const crisis = pm.hp <= maxHp(pm) * 0.25 && g.S.party.some((m) => m !== pm && m.hp > 0);
    const labels = ['⚔️ 싸운다', crisis ? '🔄 교대!' : '🦖 스톤몬', '🎒 가방', B.kind === 'wild' ? '🏃 도망' : '🚫 도망'];
    return (
      <div style={{ ...dialogBox, display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{formName(pm)}{'\n'}{crisis ? '위기다! 동료와 교대할까?' : '무엇을 할까?'}</div>
        <div style={cmdGrid}>
          {labels.map((l, i) => (
            <div key={l} role="button" tabIndex={-1} style={{ ...cmdItem, background: c.idx === i ? '#ffd166' : i === 1 && crisis ? '#ffb4a8' : 'transparent' }} onClick={() => g.cmdPick(i)}>
              {l}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const skills = battleSkills(B.player.m);
  const elSlots = elementSkills(B.player.m);
  const cur = SKILLS[skills[c.idx]];
  const tm = cur?.pow ? effTypeMult(B.player.m, cur.el, B.enemy.m) : 1;
  return (
    <div style={{ ...dialogBox, padding: '1.5% 2%' }}>
      <div style={{ ...cmdGrid, width: '100%', gridTemplateColumns: '1fr 1fr' }}>
        {skills.map((s, i) => {
          const sk = SKILLS[s];
          const left = ppLeft(B.player.m, s);
          return (
            <div key={s} role="button" tabIndex={-1} style={{ ...cmdItem, display: 'flex', gap: 4, background: c.idx === i ? '#ffd166' : 'transparent', borderLeft: `4px solid ${ELEMENTS[sk.el].color}`, opacity: left > 0 ? 1 : 0.4 }} onClick={() => g.cmdPick(i)}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{elSlots.includes(s) && i >= B.player.m.skills.length ? '🔓' : ''}{ELEMENTS[sk.el].icon} {sk.name}</span>
              <span style={{ fontSize: '0.75em', opacity: 0.8 }}>{left === Infinity ? '∞' : `${left}/${maxPP(s)}`}</span>
            </div>
          );
        })}
      </div>
      {cur && (
        <div style={skillInfo}>
          <span>{elSlots.includes(skills[c.idx]) && c.idx >= B.player.m.skills.length ? '🔓속성 스킬 · ' : ''}{ELEMENTS[cur.el].name} · {cur.pow ? `위력 ${cur.pow}` : '변화'} · 명중 {cur.acc} · {isBasic(skills[c.idx]) ? '기본기(무제한)' : `남은 횟수 ${ppLeft(B.player.m, skills[c.idx])}/${maxPP(skills[c.idx])}`}{cur.pow ? (tm >= 2 ? ' · 💥💥천적(×2)' : tm > 1 ? ' · 💥효과 굉장(×1.5)' : tm < 1 ? ` · 💤효과 별로(×${+tm.toFixed(2)}${tm === 0.8 && synergiesOf(B.player.m).includes('chimera') ? ' 🧬키메라' : ''})` : '') : ''}{cur.sp ? ' · 특수' : cur.pow ? ' · 물리' : ''}</span>
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

// ───────── 결과 카드 (포식 · 레벨업 진화) ─────────
const STAT_LABEL = { hp: '체력', atk: '공격', def: '방어', spd: '스피드' };
const ResultCard = ({ card }) => {
  const { kind, mon, res } = card;
  if (kind === 'code') return <CodeCard card={card} />;
  if (kind === 'clear') return <ClearCard card={card} />;
  const el = res.element;
  return (
    <div style={modalBack} onClick={card.close}>
      <div style={{ ...modalBox, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        {kind === 'devour' ? (
          <>
            <div style={{ ...modalTitle, color: '#ff6a6a' }}>🍖 포식 완료 — 기본 스탯 영구 상승</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img alt="" src={monDataUrl(card.prey, { silhouette: true }, 1)} style={{ ...pixImg, width: 48, height: 48, opacity: 0.6 }} />
              <span style={{ fontSize: 22 }}>▶</span>
              <img alt="" src={monDataUrl(mon, {}, 2)} style={{ ...pixImg, width: 96, height: 96 }} />
            </div>
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{formName(mon)} <span style={{ color: '#ffd166' }}>Lv.{mon.lv}</span></div>
            <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.8 }}>{SPECIES[card.prey.sid].name}의 피와 뼈가 녹아들었다 · 외형은 그대로, 힘만 쌓인다</div>
            {res.variant && <div style={{ textAlign: 'center', fontSize: 13, color: '#ffd166', fontWeight: 700, marginTop: 4 }}>✨ 변종 포식! 스탯 3배 흡수 · 희귀 기술 [{SKILLS[res.rareSkill]?.name}] 전수 가능</div>}
          </>
        ) : (
          <>
            <div style={{ ...modalTitle, color: '#7fe0ff' }}>✨ 레벨업 진화!</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img alt="" src={monDataUrl(card.old, {}, 1)} style={{ ...pixImg, width: 64, height: 64, opacity: 0.75 }} />
              <span style={{ fontSize: 22 }}>▶</span>
              <img alt="" src={monDataUrl(mon, {}, 2)} style={{ ...pixImg, width: 128, height: 128 }} />
            </div>
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 18 }}>{res.before.name} ▶ <span style={{ color: '#ffd166' }}>{res.after.name}</span></div>
            <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.85 }}>
              No.{String(res.to).padStart(3, '0')} · {SPECIES[res.to].evo}단계 · {SPECIES[res.to].evolvesTo ? `다음 진화: Lv.${SPECIES[res.to].evolvesTo.lv} ${SPECIES[SPECIES[res.to].evolvesTo.id].name}` : '최종 진화'} · 포식 스탯·속성·특성은 그대로
            </div>
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
        <div style={chipRow}>
          {(res.awaken || []).map(({ stat, tier }) => (
            <span key={stat + tier} style={{ ...chip, borderColor: AWAKEN_INFO[stat].color, background: '#4a2a10', fontWeight: 700 }}>{AWAKEN_INFO[stat].icon} {AWAKEN_INFO[stat].name} {ROMAN[tier]} (외형 변화)</span>
          ))}
          {(res.traitGain || []).map(({ t, lv }) => (
            <span key={t} style={{ ...chip, borderColor: '#ffd166' }}>✨ {TRAITS[t].name} Lv{lv}</span>
          ))}
          {(res.synNew || []).map((k) => (
            <span key={k} style={{ ...chip, borderColor: SYNERGIES[k].color, background: '#4a2a10', fontWeight: 700 }}>🧬 각성! {SYNERGIES[k].icon} {SYNERGIES[k].name}</span>
          ))}
        </div>
        {kind === 'devour' && el && !el.core && (
          <>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              {ELEMENTS[el.el].icon} {ELEMENTS[el.el].name} 속성 누적 포식 {Math.min(el.n, el.need)} / {el.need}
              {el.unlocked ? <b style={{ color: '#ffd166' }}> · 🔓 속성 습득! 속성 스킬 [{SKILLS[el.skill]?.name}] 해금</b> : el.n >= el.need ? ' · 습득 완료' : ''}
            </div>
            <div style={hpTrack}><div style={{ ...hpFill, width: `${Math.min(1, el.n / el.need) * 100}%`, background: ELEMENTS[el.el].color }} /></div>
          </>
        )}
        {kind === 'devour' && el?.core && <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>같은 속성({ELEMENTS[el.el].icon}{ELEMENTS[el.el].name})을 먹었다 — 스탯만 쌓인다</div>}
        <button type="button" style={{ ...titleBtn, width: '100%', marginTop: 12 }} onClick={card.close}>확인 (A)</button>
      </div>
    </div>
  );
};

// ───────── 데모 클리어 ─────────
const ClearCard = ({ card }) => (
  <div style={modalBack} onClick={card.close}>
    <div style={{ ...modalBox, maxWidth: 480, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ ...modalTitle, color: '#ffd166', fontSize: 22 }}>🏆 STONE MONSTERS v4.0 클리어!</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        {card.party.map((m) => (
          <div key={m.uid} style={{ width: 96 }}>
            <img alt="" src={monDataUrl(m, {}, 2)} style={{ ...pixImg, width: 88, height: 88 }} />
            <div style={{ fontSize: 11 }}>{formName(m)}<br />Lv.{m.lv}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
        {card.runs}번째 생 · 이번 생 포식 {card.devours}회 · 도감 포식 {card.eaten}/{SPECIES_COUNT}종<br />
        <b style={{ color: '#7fe08a' }}>🏟️ 무한의 원시 투기장 해금</b> — 하늘 신전 동쪽 아래 투기장에서 끝없는 연승에 도전하세요.
      </div>
      <button type="button" style={{ ...titleBtn, width: '100%', marginTop: 12 }} onClick={card.close}>계속하기 (A)</button>
    </div>
  </div>
);

// ───────── 이어하기 코드 안내 ─────────
const CodeCard = ({ card }) => (
  <div style={modalBack} onClick={card.close}>
    <div style={{ ...modalBox, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
      <div style={modalTitle}>💾 이어하기</div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>다른 기기(또는 브라우저)의 타이틀 화면 → <b>🔑 코드로 이어하기</b>에 아래 코드를 입력하세요. 집에서 쉴 때마다 자동으로 갱신됩니다.</div>
      <div style={codeText}>{card.code}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>코드를 아는 사람은 이 모험을 불러올 수 있으니 혼자만 보관하세요.</div>
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
          {kind === 'party' ? (g.ui.panel?.prep ? '⚔️ 전투 준비' : '🦖 스톤몬 · 보관함') : kind === 'codex' ? '📖 스톤 도감' : kind === 'achieve' ? '🏆 칭호 · 업적' : '🪦 기록 · 무덤'}
        </div>
        <button type="button" style={smallBtn} onClick={() => g.closePanel()}>{g.ui.panel?.prep ? '준비 완료 ✓' : '닫기 ✕'}</button>
      </div>
      {kind === 'party' && <PartyPanel g={g} />}
      {kind === 'codex' && <CodexPanel g={g} />}
      {kind === 'records' && <RecordsPanel g={g} />}
      {kind === 'achieve' && <AchievePanel g={g} />}
    </div>
  </div>
);

const PartyPanel = ({ g }) => {
  const party = g.S.party;
  const prep = !!g.ui.panel?.prep;
  if (!party.length) return <div>스톤몬이 없다.</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>파티 {party.length}/{PARTY_MAX} · 보관함 {g.S.box?.length || 0}/{BOX_MAX} · 맨 위가 대장(먼저 싸움). ▲▼ 로 동료 순서와 기술 위치(전투 명령 순서)를 바꿀 수 있습니다. 패배한 스톤몬은 먹혀서 영원히 사라집니다.</div>
      {party.map((m, i) => {
        const e = eff(m);
        const elProg = elementProgress(m);
        const nx = SPECIES[m.sid].evolvesTo;
        const tiers = awakenTiers(m);
        const eaten = Object.entries(m.prey || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const fed = m.fed || {};
        const syn = synergiesOf(m);
        return (
          <div key={m.uid} style={monCard}>
            <div style={{ display: 'flex', gap: 10 }}>
              <img alt="" src={monDataUrl(m, {}, 2)} style={{ ...pixImg, width: 96, height: 96, flexShrink: 0, background: '#3a2414', border: `2px solid ${syn.includes('pureKing') ? '#ffd23a' : '#8a5a2a'}`, borderRadius: 6, boxShadow: syn.includes('pureKing') ? '0 0 14px 3px rgba(255,210,58,0.75)' : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{i === 0 && '👑 '}<VariantTag m={m} />{formName(m)} <span style={{ color: '#ffd166' }}>Lv.{m.lv}</span></div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  No.{String(m.sid).padStart(3, '0')} · ★{power(m)} · 포식 {m.devours}회 · {nx ? `Lv.${nx.lv}에 ${SPECIES[nx.id].name}(으)로 진화` : '최종 진화'}{m.evoStop ? ' (진화 멈춤)' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#7fe08a' }}>포식 누적 스탯: 체력 +{Math.round(fed.hp || 0)} · 공격 +{Math.round(fed.atk || 0)} · 방어 +{Math.round(fed.def || 0)} · 스피드 +{Math.round(fed.spd || 0)} (상한 없음)</div>
                <div style={{ fontSize: 12, margin: '3px 0' }}>{elementsOf(m).map((el) => `${ELEMENTS[el].icon}${ELEMENTS[el].name}`).join(' ')}</div>
                <HpBar hp={m.hp} max={maxHp(m)} />
                <div style={{ fontSize: 12 }}>HP {m.hp}/{maxHp(m)} · 공격 {e.atk} · 방어 {e.def} · 스피드 {e.spd}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>EXP {m.exp || 0} / {expNext(m.lv)}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  {['atk', 'def', 'hp'].map((k) => {
                    const v = k === 'hp' ? maxHp(m) : e[k];
                    const nextT = AWAKEN[k][tiers[k]];
                    return <span key={k} style={{ marginRight: 8, color: tiers[k] ? AWAKEN_INFO[k].color : '#c8b8a0' }}>{AWAKEN_INFO[k].icon}{ROMAN[tiers[k]] || '-'} {nextT ? `${v}/${nextT}` : 'MAX'}</span>;
                  })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>🗡️ 기술 (위치 변경)</div>
            <div style={{ display: 'grid', gap: 3, marginTop: 4 }}>
              {m.skills.map((s, k) => {
                const sk = SKILLS[s];
                const left = ppLeft(m, s);
                return (
                  <div key={s} style={{ ...skillRow, borderLeft: `4px solid ${ELEMENTS[sk.el].color}` }}>
                    <span style={{ width: 16, opacity: 0.7 }}>{k + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ELEMENTS[sk.el].icon} {sk.name}{sk.pow ? ` · 위력 ${sk.pow}` : ' · 변화'} <span style={{ opacity: 0.7, fontSize: 11 }}>{left === Infinity ? '∞' : `${left}/${maxPP(s)}`}</span>
                    </span>
                    <button type="button" aria-label="위로" style={arrowBtn} disabled={k === 0} onClick={() => g.moveSkill(m, k, -1)}>▲</button>
                    <button type="button" aria-label="아래로" style={arrowBtn} disabled={k === m.skills.length - 1} onClick={() => g.moveSkill(m, k, 1)}>▼</button>
                  </div>
                );
              })}
            </div>
            <div style={chipRow}>
              {Object.entries(m.traits).map(([t, lv]) => <span key={t} title={TRAITS[t].desc} style={{ ...chip, borderColor: '#ffd166' }}>✨ {TRAITS[t].name} Lv{lv}</span>)}
            </div>
            <SynergyRow m={m} />
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>🔥 속성 습득 (같은 속성 {ELEMENT_UNLOCK}회 포식 → 속성 스킬 슬롯 해금)</div>
              {elProg.length === 0 && <div style={{ fontSize: 11, opacity: 0.7 }}>아직 다른 속성을 먹은 적이 없다.</div>}
              {elProg.map(({ el, n, need, done }) => (
                <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ width: 56 }}>{ELEMENTS[el].icon}{ELEMENTS[el].name}</span>
                  <div style={{ ...hpTrack, flex: 1 }}><div style={{ ...hpFill, width: `${Math.min(100, (n / need) * 100)}%`, background: ELEMENTS[el].color }} /></div>
                  <span style={{ width: 70, textAlign: 'right', color: done ? '#ffd166' : undefined }}>{done ? `습득 · ${n}회` : `${n}/${need}`}</span>
                </div>
              ))}
              {elementSkills(m).length > 0 && <div style={{ fontSize: 11, marginTop: 3 }}>🔓 속성 스킬: {elementSkills(m).map((x) => `${ELEMENTS[SKILLS[x].el].icon}${SKILLS[x].name}`).join(', ')}</div>}
            </div>
            {eaten.length > 0 && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>먹은 것: {eaten.map(([sid, c]) => `${SPECIES[sid].name}×${c}`).join(', ')}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {i > 0 && <button type="button" style={smallBtn} onClick={() => g.setLead(m)}>👑 대장으로</button>}
              {i > 0 && <button type="button" style={smallBtn} onClick={() => g.moveMon(m, -1)}>▲ 순서 위로</button>}
              {i < party.length - 1 && <button type="button" style={smallBtn} onClick={() => g.moveMon(m, 1)}>▼ 순서 아래로</button>}
              {!prep && party.length > 1 && <button type="button" style={{ ...smallBtn, background: '#7a1a24', color: '#fff' }} onClick={() => g.feed(m)}>🍖 먹이로 바치기</button>}
              {party.length > 1 && <button type="button" style={smallBtn} onClick={() => g.toBox(m)}>📦 보관함으로</button>}
            </div>
          </div>
        );
      })}
      <BoxList g={g} />
    </div>
  );
};

// 유전자 시너지: 각성 뱃지 + 미각성 진행도
const SynergyRow = ({ m }) => {
  const on = synergiesOf(m);
  const prog = synergyProgress(m);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>🧬 유전자 시너지</div>
      <div style={chipRow}>
        {SYNERGY_KEYS.map((k) => {
          const Y = SYNERGIES[k];
          const act = on.includes(k);
          const [cur, goal] = prog[k];
          return (
            <span key={k} title={`${Y.need}\n→ ${Y.desc}`} style={{ ...chip, borderColor: act ? Y.color : '#5a4a3a', background: act ? '#4a2a10' : '#241a14', opacity: act ? 1 : 0.65, fontWeight: act ? 800 : 400 }}>
              {Y.icon} {Y.name} {act ? '· 각성' : `${cur}/${goal}`}
            </span>
          );
        })}
      </div>
      {on.length > 0 && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>{on.map((k) => `${SYNERGIES[k].name}: ${SYNERGIES[k].desc}`).join(' / ')}</div>}
    </div>
  );
};

// 보관함 (최대 30) — 파티와 교체 · 편성 · 방생
const BoxList = ({ g }) => {
  const box = g.S.box || [];
  const party = g.S.party;
  const [pick, setPick] = useState(null);
  return (
    <div style={{ ...monCard, background: '#2a1a0c' }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>📦 보관함 {box.length}/{BOX_MAX}</div>
      {box.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>비어 있다. 파티(최대 {PARTY_MAX})가 가득 찬 상태에서 길들이거나 부화시킨 스톤몬이 여기로 온다.</div>}
      <div style={{ display: 'grid', gap: 6 }}>
        {box.map((m) => (
          <div key={m.uid} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #4a3a2a', paddingBottom: 6 }}>
            <img alt="" src={monDataUrl(m, {}, 1)} style={{ ...pixImg, width: 48, height: 48 }} />
            <div style={{ flex: 1, minWidth: 120, fontSize: 12 }}>
              <b><VariantTag m={m} />{formName(m)}</b> Lv.{m.lv} ★{power(m)}<br />
              <span style={{ opacity: 0.8 }}>{elementsOf(m).map((el) => ELEMENTS[el].icon).join('')} HP {m.hp}/{maxHp(m)} · 포식 {m.devours}회</span>
            </div>
            {party.length < PARTY_MAX
              ? <button type="button" style={smallBtn} onClick={() => g.fromBox(m)}>🦖 파티 편성</button>
              : <button type="button" style={smallBtn} onClick={() => setPick(pick === m.uid ? null : m.uid)}>🔄 교체</button>}
            <button type="button" style={{ ...smallBtn, opacity: 0.8 }} onClick={() => g.release(m)}>방생</button>
            {pick === m.uid && (
              <div style={{ width: '100%', display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 12 }}>
                누구와 바꿀까?
                {party.map((p) => <button key={p.uid} type="button" style={smallBtn} onClick={() => { g.swapBox(m, p); setPick(null); }}>{formName(p)} Lv.{p.lv}</button>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 스톤 도감: 100종 도트 실루엣/컬러 · 진화 계통 · 출현 지역 · 기본 속성 · 흡수 시 얻는 핵심 기술
const coreSkillOf = (sp) => sp.skills.reduce((a, s) => (SKILLS[s].pow > SKILLS[a].pow ? s : a), sp.skills[0]);
const CodexPanel = ({ g }) => {
  const { seen, eaten, owned } = g.S.codex;
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('all');
  const sp = sel ? SPECIES[sel] : null;
  const known = sel && (eaten[sel] || owned[sel]);
  const doneN = new Set([...Object.keys(eaten), ...Object.keys(owned)]).size;
  const pct = Math.round((doneN / SPECIES_COUNT) * 100);
  const list = Object.values(SPECIES).filter((s) => tab === 'all' || (tab === 'new' ? !seen[s.id] : String(s.spawn) === tab));
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
        발견 {Object.keys(seen).length} · 포식 {Object.keys(eaten).length} · 길들임 {Object.keys(owned).length} / {SPECIES_COUNT}종 — 완성도 <b style={{ color: '#ffd166' }}>{pct}%</b> (포식하거나 길들이면 상세 기록)
      </div>
      <div style={{ ...hpTrack, height: 6, marginBottom: 8 }}><div style={{ ...hpFill, width: `${pct}%`, background: 'linear-gradient(90deg,#7fe08a,#ffd166)' }} /></div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['all', '전체'], ['1', 'Stage 1'], ['2', 'Stage 2'], ['3', 'Stage 3'], ['4', 'Stage 4'], ['5', 'Stage 5'], ['0', '전설·무한'], ['new', '미발견']].map(([k, l]) => (
          <button key={k} type="button" style={{ ...smallBtn, padding: '3px 8px', background: tab === k ? '#ffd166' : '#fbf7ee' }} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {sp && (
        <div style={{ ...monCard, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <img alt="" src={monDataUrl({ sid: sp.id }, { silhouette: !seen[sp.id] }, 2)} style={{ ...pixImg, width: 96, height: 96, background: '#3a2414', border: '2px solid #8a5a2a', borderRadius: 6 }} />
            <div style={{ fontSize: 12, lineHeight: 1.6, flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>No.{String(sp.id).padStart(3, '0')} {seen[sp.id] ? sp.name : '???'} {seen[sp.id] && <span style={{ fontSize: 11, opacity: 0.8 }}>· {TIER_NAME[sp.tier]}</span>}</div>
              <div>기본 속성: {seen[sp.id] ? <b style={{ color: ELEMENTS[sp.el].color }}>{ELEMENTS[sp.el].icon}{ELEMENTS[sp.el].name}</b> : '???'}</div>
              <div>출현 지역: {(HABITAT[sp.id] || []).join(' · ')}</div>
              <div>진화 계통: {evoChain(sp.id).map((id, i) => {
                const e = SPECIES[id];
                const label = seen[id] ? e.name : '???';
                return <span key={id}>{i > 0 && ` ▶ Lv.${SPECIES[evoChain(sp.id)[i - 1]].evolvesTo.lv} `}<b style={{ color: id === sp.id ? '#ffd166' : undefined, cursor: 'pointer' }} onClick={() => setSel(id)}>{label}</b></span>;
              })}{evoChain(sp.id).length === 1 ? ' (진화하지 않음)' : ''}</div>
              {seen[sp.id] ? (
                <>
                  <div>흡수 시 핵심 기술: <b>{ELEMENTS[SKILLS[coreSkillOf(sp)].el].icon} {SKILLS[coreSkillOf(sp)].name}</b> (위력 {SKILLS[coreSkillOf(sp)].pow}) · 변종 포식 시 🌟{SKILLS[RARE_SKILL[sp.el]].name}</div>
                  <div>흡수 특성: {TRAITS[sp.trait].name} ({TRAITS[sp.trait].desc}) · 포식 시 {ELEMENTS[sp.el].icon}{ELEMENTS[sp.el].name} 속성 누적 +1</div>
                </>
              ) : <div style={{ opacity: 0.7 }}>아직 만나지 못했다. 출현 지역을 탐험해 보자.</div>}
              {known ? (
                <>
                  <div>종족값 체력 {sp.base.hp} · 공격 {sp.base.atk} · 방어 {sp.base.def} · 스피드 {sp.base.spd}</div>
                  <div>기술: {sp.skills.map((x) => SKILLS[x].name).join(', ')}</div>
                  <div style={{ marginTop: 4, opacity: 0.9 }}>{sp.desc}</div>
                  {eaten[sp.id] && <span style={{ color: '#ff8a8a' }}>🍖 포식 {eaten[sp.id]}회 </span>}
                  {owned[sp.id] && <span style={{ color: '#8ad8ff' }}>🕸️ 길들임</span>}
                </>
              ) : seen[sp.id] && <div style={{ opacity: 0.7 }}>포식하거나 길들이면 자세한 기록이 남는다.</div>}
            </div>
          </div>
        </div>
      )}
      <div style={codexGrid}>
        {list.map((s) => {
          const st = eaten[s.id] ? 'eaten' : owned[s.id] ? 'owned' : seen[s.id] ? 'seen' : 'none';
          return (
            <div key={s.id} role="button" tabIndex={-1} onClick={() => setSel(s.id)} style={{ ...codexCell, outline: sel === s.id ? '2px solid #ffd166' : 'none', borderColor: st === 'none' ? '#5a4a3a' : ELEMENTS[s.el].color }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{String(s.id).padStart(3, '0')} {st !== 'none' ? ELEMENTS[s.el].icon : ''}</div>
              <img alt="" src={monDataUrl({ sid: s.id }, { silhouette: st === 'none' }, 1)} style={{ ...pixImg, width: 48, height: 48, opacity: st === 'none' ? 0.55 : 1 }} />
              <div style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {st === 'none' ? '???' : s.name}{st === 'eaten' ? ' 🍖' : st === 'owned' ? ' 🕸️' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 칭호 · 업적 (영구 보너스)
const AchievePanel = ({ g }) => {
  const S = g.S;
  const got = S.ach || {};
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ ...monCard, marginBottom: 8, lineHeight: 1.7 }}>
        <div>현재 칭호: <b style={{ color: '#ffd166' }}>{S.title ? `「${S.title}」` : '없음'}</b> · 달성 {Object.keys(got).length}/{ACHIEVEMENTS.length}</div>
        <div style={{ fontSize: 12 }}>영구 보너스 합계: {Object.keys(BONUS_NAME).map((k) => `${BONUS_NAME[k]} +${Math.round(achBonus(S, k) * 100)}%`).join(' · ')}</div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>업적과 보너스는 스톤몬을 모두 잃고 다시 시작해도 유지됩니다.</div>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {ACHIEVEMENTS.map((a) => {
          const ok = !!got[a.id];
          return (
            <div key={a.id} style={{ ...monCard, display: 'flex', gap: 10, alignItems: 'center', opacity: ok ? 1 : 0.6, borderColor: ok ? '#ffd166' : '#8a5a2a' }}>
              <div style={{ fontSize: 24 }}>{ok ? '🏆' : '🔒'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{a.name} <span style={{ color: '#ffd166', fontWeight: 400 }}>「{a.title}」</span></div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{a.desc}</div>
                <div style={{ fontSize: 11, color: '#7fe08a' }}>보너스: {bonusText(a)}{ok ? ` · ${new Date(got[a.id]).toLocaleDateString('ko-KR')} 달성` : ''}</div>
              </div>
              {ok && S.title !== a.title && <button type="button" style={smallBtn} onClick={() => { S.title = a.title; g.save(); g.refresh(); }}>칭호 장착</button>}
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
        <div>Stage 1 태초의 숲: {S.flags.boss1 ? '🏆 숲의 수호자 격파' : '숲의 수호자 미격파'}</div>
        <div>Stage 2 메아리의 습지: {S.flags.boss2 ? '🏆 협곡의 지배자 격파' : '협곡의 지배자 미격파'}</div>
        <div>Stage 3 작열하는 화산: {S.flags.boss3 ? '🏆 태초의 왕좌 격파 · ♾️ 무한 사냥 해금' : '태초의 왕좌 미격파'}</div>
        <div>Stage 4 만년설의 빙하 동굴: {S.flags.boss4 ? '🏆 빙하의 군주 격파' : '빙하의 군주 미격파'}</div>
        <div>Stage 5 태고의 하늘 신전: {S.flags.boss5 ? '🏆 고대 3대 신수 격파 · 🏟️ 원시 투기장 해금' : '고대 3대 신수 미격파'}</div>
        <div>⚔️ 라이벌 카인: {[1, 2, 3, 4, 5].map((n) => (S.flags[`rival${n}`] ? '🏆' : '·')).join(' ')} (통산 {S.life?.rivalWins || 0}승)</div>
        <div>🏟️ 원시 투기장 최고 기록: {S.life?.arenaBest || 0}연승</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>통산: 포식 {S.life?.devours || 0} · 최고 연속 포식 {S.life?.bestStreak || 0} · 길들이기 {S.life?.tames || 0} · 변종 처치 {S.life?.variants || 0} · 발굴 {S.life?.digs || 0} · 부화 {S.life?.hatches || 0}</div>
        {S.eggs?.length > 0 && <div>🥚 미확인 공룡알 {S.eggs.length}/{EGG_MAX}: {S.eggs.map((e) => `${e.left}걸음`).join(' · ')}</div>}
      </div>
      <div style={{ fontWeight: 800, margin: '10px 0 4px' }}>🪦 먹힌 스톤몬들</div>
      {S.grave.length === 0 && <div style={{ opacity: 0.7 }}>아직 아무도 먹히지 않았다.</div>}
      {S.grave.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #3a2a4a', padding: '4px 0' }}>
          <img alt="" src={monDataUrl({ sid: r.sid }, {}, 1)} style={{ ...pixImg, width: 40, height: 40, filter: 'grayscale(1)', opacity: 0.8 }} />
          <div style={{ fontSize: 12 }}>
            <b>{r.name}</b>{r.lv ? ` Lv.${r.lv}` : ''} ★{r.power} · 포식 {r.devours}회<br />
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
    <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>🦖 스톤몬스터 (STONE MONSTERS) v4.0 — 포식 육성 RPG</h1>
    <p>원시 정글 · 습지 · 화산이 뒤섞인 땅. 돌알에서 태어난 <b>스톤몬스터</b>는 싸워서 <b>레벨</b>을 올리고, 일정 레벨에서 <b>진화</b>하며, 쓰러뜨린 상대를 <b>잡아먹어(포식)</b> 끝없이 강해집니다.</p>
    <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
      <li><b>레벨업 진화 · 100종 도감</b> — 티랑이(Lv.1) → 티라노스(Lv.16) → 패왕 티라렉스(Lv.36)처럼 공룡·고대 생물마다 2~3단계 진화 계통이 있습니다. 전 종 32x32 · 48x48 레트로 도트.</li>
      <li><b>포식 = 스탯 무한 누적</b> — 먹은 종의 종족값에 비례해 체력·공격·방어·스피드가 상한 없이 영구 상승합니다. 같은 속성을 10번 먹으면 그 속성을 습득하고 전용 속성 스킬 슬롯이 열려요.</li>
      <li><b>스탯 각성</b> — 공격 300/800/1500(발톱·붉은 투기), 방어 300/800/1500(장갑·황금 오라), 체력 1000/3000/7000(거대화·왕관)을 넘을 때만 외형이 멋지게 바뀝니다.</li>
      <li><b>정직한 상성</b> — 유리 1.5배 · 천적 2배 · 불리 0.5배, 같은 속성 기술 1.2배. 독(1/16·4턴)과 화상(5%·3턴, 물리 공격 -20%)은 저절로 낫습니다.</li>
      <li><b>포식 vs 길들이기</b> — 쓰러뜨린 야생 스톤몬을 먹어 강해질지, 스톤 그물로 길들여 동료(파티 4 · 보관함 30)로 삼을지 매번 선택합니다.</li>
      <li><b>유전자 시너지</b> — 화염+비행은 [폭염의 비룡], 대지+독은 [맹독 갑주], 한 종족 5회는 [순혈 패왕](황금 오라), 4속성은 [고대 키메라]가 각성합니다.</li>
      <li><b>Stage 1~5</b> — 태초의 숲 → 메아리의 습지 &amp; 협곡 → 작열하는 화산 → 만년설의 빙하 동굴(Lv.36~48) → 태고의 하늘 신전(Lv.49~65). 보스 직전마다 숙명의 라이벌 <b>카인</b>이 진화한 모습으로 막아섭니다. 고대 3대 신수를 꺾으면 <b>무한의 원시 투기장</b>이 열려요.</li>
      <li><b>파밍</b> — 5% 확률의 고대 변종(이로치)·알파 개체(먹으면 3배 흡수 + 희귀 기술), 반짝이는 화석 바위와 알 둥지, 걸어서 부화시키는 미확인 공룡알, 14종 업적과 영구 보너스.</li>
      <li><b>편의 기능</b> — 1x/2x/3x 배속, 기술 위치 변경, 상점 연속 구매, 자동 저장 + 예비 저장, 모험 코드로 다른 기기에서 이어하기.</li>
      <li><b>약육강식</b> — 진 스톤몬은 영원히 사라지고, 모두 잃으면 처음부터 다시 시작합니다.</li>
    </ul>
  </section>
);

// ───────── 스타일 ─────────
// 사이트 공통 레이아웃(.main-content 600px)을 벗어나 화면 폭을 넓게 사용
const page = { width: 'min(calc(100vw - 24px), 1400px)', marginLeft: 'calc(50% - min(50vw - 12px, 700px))', boxSizing: 'border-box', padding: '0 0 30px', fontFamily: FONT, color: '#2a1e2e' };
const topBar = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 };
const topLink = { fontSize: 13, color: '#5a3a4a', textDecoration: 'none', fontWeight: 700 };
const topBtn = { padding: '6px 10px', fontSize: 12, border: '2px solid #2a1e2e', background: '#fff', cursor: 'pointer', fontFamily: FONT };
const fsShell = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1a1220', overflow: 'auto', boxSizing: 'border-box', padding: 8 };
const pseudoFsShell = {
  ...fsShell, position: 'fixed', inset: 0, zIndex: 9000, height: '100dvh', overscrollBehavior: 'contain',
  padding: 'max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))',
};
const codeText = { fontSize: 28, fontWeight: 900, letterSpacing: '0.12em', textAlign: 'center', margin: '12px 0', padding: 10, background: '#fbf7ee', color: '#1c1424', userSelect: 'all', WebkitUserSelect: 'all' };
// 게임 화면 크기: 가로 · 세로 중 먼저 닿는 쪽에 맞춰 최대한 크게 (세로 여유 = 상단 바 + 패드)
const stageWrapStyle = (fs) => {
  const reserve = fs ? 190 : 300; // 사이트 헤더 · 상단 바 · 아래 패드 높이
  const maxW = fs ? 'calc(100vw - 16px)' : '100%';
  return { width: `min(${maxW}, 1400px, calc((100dvh - ${reserve}px) * ${SW / SH}))`, minWidth: 260, margin: '0 auto' };
};
const stage = {
  position: 'relative', width: '100%', aspectRatio: `${SW} / ${SH}`, background: '#000', overflow: 'hidden',
  border: '6px solid #8a5a2a', outline: '3px solid #2a1608', borderRadius: 6, boxShadow: '6px 6px 0 #a1887f', containerType: 'inline-size', userSelect: 'none', WebkitUserSelect: 'none',
  fontSize: 'clamp(10px, 3.1cqw, 26px)', lineHeight: 1.5, touchAction: 'manipulation',
};
const canvasStyle = { width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' };
// 도트가 흐려지지 않도록 (브라우저 확대 시 최근접 보간)
const pixImg = { imageRendering: 'pixelated' };
// 나무 프레임 UI (도감 STONE MONSTERS 스타일)
const boxBase = { position: 'absolute', background: '#fbf0d8', color: '#2a1608', border: '3px solid #2a1608', boxShadow: 'inset 0 0 0 3px #b8803e, inset 0 0 0 5px #6a3e18', boxSizing: 'border-box', borderRadius: 4 };
const dialogBox = { ...boxBase, left: '1.5%', right: '1.5%', bottom: '2%', minHeight: '29%', padding: '2% 3%', cursor: 'pointer', zIndex: 5 };
const speakerTag = { position: 'absolute', top: '-1.6em', left: '3%', background: '#6a3e18', color: '#ffe8b0', border: '2px solid #2a1608', borderRadius: 3, padding: '0 0.6em', fontSize: '0.85em' };
const nextMark = { position: 'absolute', right: '3%', bottom: '6%', animation: 'none', fontSize: '0.8em' };
const choiceBox = { ...boxBase, right: '1.5%', bottom: '33%', maxWidth: '72%', maxHeight: '64%', overflowY: 'auto', padding: '1.5% 2.5%', zIndex: 6 };
const choiceItem = { display: 'flex', cursor: 'pointer', padding: '0.15em 0' };
const choiceSub = { display: 'block', fontSize: '0.75em', opacity: 0.7 };
const cmdGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: '56%' };
const cmdItem = { padding: '0.25em 0.4em', cursor: 'pointer', border: '2px solid #6a3e18', borderRadius: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const skillInfo = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.8em', marginTop: '1.2%' };
const hudBox = { ...boxBase, width: '50%', padding: '1% 2%', zIndex: 4, fontSize: '0.9em' };
const hudName = { fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const hudSub = { fontSize: '0.8em', opacity: 0.85 };
const stTag = { marginLeft: 4, padding: '0 0.3em', fontSize: '0.75em', color: '#1c1424', border: '1px solid #1c1424' };
const hpOuter = { display: 'flex', alignItems: 'center', gap: 4 };
const hpLabel = { fontSize: '0.7em', fontWeight: 800, color: '#e8a030' };
const hpTrack = { flex: 1, height: 7, background: '#3a2a3a', border: '2px solid #1c1424', overflow: 'hidden' };
const hpFill = { height: '100%', transition: 'width 0.4s linear, background 0.3s' };
const mapHud = { position: 'absolute', left: '15%', top: '1.5%', width: '46%', background: 'rgba(58,34,14,0.85)', border: '2px solid #b8803e', borderRadius: 3, color: '#fff', padding: '0.3em 0.6em', fontSize: '0.72em', lineHeight: 1.35, zIndex: 3, pointerEvents: 'none' };
const toast = { position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)', background: '#1c1424', color: '#ffd166', padding: '0.3em 0.9em', zIndex: 9 };
const nameInputStyle = { flex: 1, minWidth: 100, padding: 6, fontSize: 16, fontFamily: FONT, border: '2px solid #1c1424' };
const titleWrap = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', zIndex: 3, paddingBottom: '12%' };
const logoEn = { fontSize: '0.95em', letterSpacing: '0.35em', color: '#ffd166', textShadow: '2px 2px 0 #1c1424' };
const logoKo = { fontSize: '3.2em', fontWeight: 900, lineHeight: 1.1, color: '#fff3d6', textShadow: '4px 4px 0 #1c1424, -2px -2px 0 #8a2a1a' };
const tagline = { marginTop: '1%', color: '#ffe0c0', textShadow: '2px 2px 0 #1c1424' };
const titleBtn = { padding: '0.5em 1.4em', fontSize: '1em', fontWeight: 800, color: '#fff', background: '#c62828', border: '3px solid #1c1424', boxShadow: '4px 4px 0 #1c1424', cursor: 'pointer', fontFamily: FONT };
const titleFoot = { position: 'absolute', bottom: '3%', fontSize: '0.7em', color: '#ffe0c0', textShadow: '1px 1px 0 #000' };
const modalBack = { position: 'fixed', inset: 0, background: 'rgba(10,6,16,0.72)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' };
const modalBox = { width: '100%', maxHeight: '92dvh', overflowY: 'auto', background: '#2e1c10', color: '#f8ecd4', border: '4px solid #b8803e', outline: '3px solid #2a1608', boxShadow: '6px 6px 0 #000, inset 0 0 0 2px #6a3e18', borderRadius: 6, padding: 14, boxSizing: 'border-box', fontFamily: FONT };
const modalTitle = { fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 10 };
const wideItem = { display: 'flex', gap: 10, alignItems: 'center', padding: 10, border: '2px solid', cursor: 'pointer' };
const smallBtn = { padding: '6px 10px', fontSize: 12, fontWeight: 700, border: '2px solid #1c1424', background: '#fbf7ee', color: '#1c1424', cursor: 'pointer', fontFamily: FONT };
const statTable = { display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.6fr', gap: '2px 8px', margin: '10px 0', fontSize: 13, background: '#2a1e38', padding: 10 };
const chipRow = { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 };
const chip = { fontSize: 11, padding: '2px 6px', border: '2px solid', background: '#241a30' };
const monCard = { background: '#3e2814', padding: 10, border: '2px solid #8a5a2a', borderRadius: 4 };
const skillRow = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 6px', background: '#2e1c10' };
const arrowBtn = { padding: '2px 8px', fontSize: 12, border: '2px solid #2a1608', background: '#f8ecd4', color: '#2a1608', cursor: 'pointer', fontFamily: FONT };
const codexGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 };
const codexCell = { background: '#3e2814', border: '2px solid #8a5a2a', borderRadius: 4, textAlign: 'center', padding: 4, cursor: 'pointer' };
const achToast = { position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)', minWidth: '62%', textAlign: 'center', background: 'linear-gradient(180deg,#6a3e18,#3a2210)', color: '#fff', border: '3px solid #ffd166', outline: '2px solid #2a1608', borderRadius: 4, padding: '0.35em 0.9em', zIndex: 10, boxShadow: '0 0 12px rgba(255,209,102,0.7)', fontSize: '0.85em', lineHeight: 1.35, pointerEvents: 'none' };
const synBadge = { display: 'inline-block', marginLeft: 2, padding: '0 0.15em', border: '1px solid', borderRadius: 3, background: '#2a1608', fontSize: '0.8em', lineHeight: 1.2 };
const varTag = { display: 'inline-block', marginRight: 3, padding: '0 0.3em', fontSize: '0.7em', color: '#fff', border: '1px solid #1c1424', borderRadius: 2, verticalAlign: 'middle' };
const weatherTag = { position: 'absolute', right: '3%', top: '3%', zIndex: 4, background: 'rgba(28,20,36,0.75)', color: '#e8f8ff', border: '2px solid #9ee8ff', borderRadius: 3, padding: '0 0.5em', fontSize: '0.75em' };
const controls = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520, margin: '14px auto 0', padding: '0 8px', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' };
const dpad = { display: 'grid', gridTemplateAreas: '". u ." "l . r" ". d ."', gridTemplateColumns: '48px 48px 48px', gridTemplateRows: '48px 48px 48px' };
const dbtn = { background: '#2a1e2e', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', touchAction: 'none' };
const abtn = { width: 62, height: 62, borderRadius: '50%', background: '#c62828', color: '#fff', border: '3px solid #2a1e2e', fontSize: 22, fontWeight: 900, cursor: 'pointer', fontFamily: FONT, touchAction: 'none', boxShadow: '3px 3px 0 #2a1e2e' };
const startBtn = { padding: '6px 12px', fontSize: 12, background: '#5a4a6a', color: '#fff', border: '2px solid #2a1e2e', borderRadius: 12, cursor: 'pointer', fontFamily: FONT, alignSelf: 'flex-end', touchAction: 'none' };
const helpText = { textAlign: 'center', fontSize: 11, color: '#7a6a7a', marginTop: 10 };
const introBox = { maxWidth: 760, margin: '22px auto 0', padding: 16, background: '#fbf7ee', border: '2px solid #2a1e2e', fontSize: 14, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" };

export default StoneMonsterGame;
