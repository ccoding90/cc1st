import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { W, H, FONT, createGame, weaponLabel, POWERUPS, HELP_SEC, HELP_USES, STAGE_COUNT } from './threejo/engine';
import { sfx, unlockAudio, setMuted } from './coffee/sound';

const MUTED_KEY = 'threejoMuted';
const PLAYS_KEY = 'threejoPlays';
const HELP_UNLOCK = 5; // 개발자 도움 요청은 5판 이상 플레이 후 해금
const PIXEL = 2.5; // 도트 1칸 = 게임 좌표 2.5 (월드를 저해상도로 그린 뒤 확대)
const LW = Math.round(W / PIXEL), LH = Math.round(H / PIXEL);
const PIXEL_FONT_CSS = 'https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/galmuri.css';

// 픽셀 폰트는 이 게임 페이지에서만 로드
function usePixelFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${PIXEL_FONT_CSS}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = PIXEL_FONT_CSS;
    document.head.appendChild(link);
  }, []);
}

const STAGE_NAMES = ['1탄 캐슬조', '2탄 제로조', '3탄 킬러조', '4탄 조철왕'];
const KILLER_EMOJI = { 조철왕: '👑', 킬러조: '🚗' };
const BLESS_TAPS = 3;       // 숨은 '도움' 버튼 연속 클릭 횟수
const BLESS_GAP_MS = 700;   // 이 간격 안에 눌러야 '연속'으로 인정

// 브라우저 Fullscreen API (사파리 webkit 접두사 대응)
// 아이폰 사파리는 일반 요소의 Fullscreen API를 지원하지 않음 → 화면을 꽉 채우는 '가상 전체화면'으로 대체
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsSupported = () => typeof document !== 'undefined' && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

function loadMuted() {
  try { return localStorage.getItem(MUTED_KEY) === '1'; } catch (e) { return false; }
}

function loadPlays() {
  try { return Number(localStorage.getItem(PLAYS_KEY)) || 0; } catch (e) { return 0; }
}

// 🏹 쓰리조 챌린지 (탐관오리 토벌전) - 화면 껍데기. 게임 로직·드로잉은 threejo/engine.js
const ThreeJoGame = () => {
  const canvasRef = useRef(null);
  const inputRef = useRef({ dx: 0, dy: 0, tx: null, ty: null });
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const dragRef = useRef(null);
  const [bombs, setBombs] = useState(2);
  const [gameState, setGameState] = useState('menu'); // menu | playing | over
  const [round, setRound] = useState(0);
  const [result, setResult] = useState(null);
  const [highScores, setHighScores] = useState([]);
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMuted, setIsMuted] = useState(loadMuted);
  const [plays, setPlays] = useState(loadPlays);
  const [help, setHelp] = useState({ auto: false, left: HELP_USES });
  const [nativeFs, setNativeFs] = useState(false);
  const [pseudoFs, setPseudoFs] = useState(false);
  const [canNativeFs] = useState(fsSupported);
  const isFs = nativeFs || pseudoFs;
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const stageRef = useRef(null);
  const blessTapRef = useRef({ n: 0, last: 0 });
  const helpUnlocked = plays >= HELP_UNLOCK;
  usePixelFont();

  useEffect(() => {
    setMuted(isMuted);
    try { localStorage.setItem(MUTED_KEY, isMuted ? '1' : '0'); } catch (e) { /* ignore */ }
  }, [isMuted]);

  const loadHighScores = async () => {
    try {
      const q = query(collection(db, 'threejo_scores'), orderBy('score', 'desc'), limit(10));
      const snap = await getDocs(q);
      setHighScores(snap.docs.map((d) => d.data()));
    } catch (e) {
      console.error('Score load error:', e);
    }
  };

  useEffect(() => { loadHighScores(); }, []);

  // 전체화면 상태 동기화 (Esc로 빠져나와도 반영)
  useEffect(() => {
    const sync = () => setNativeFs(!!fsElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (pseudoFs) { setPseudoFs(false); return; }
    if (fsElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
      return;
    }
    const request = canNativeFs && (el.requestFullscreen || el.webkitRequestFullscreen);
    if (!request) { setPseudoFs(true); return; }
    try {
      // 거부되면(일부 모바일 브라우저) 가상 전체화면으로 대체
      request.call(el)?.catch?.(() => setPseudoFs(true));
    } catch (e) {
      setPseudoFs(true);
    }
  };

  // 가상 전체화면 중에는 뒤 페이지 스크롤 잠금
  useEffect(() => {
    if (!pseudoFs) return;
    const { body, documentElement: html } = document;
    const prev = [body.style.overflow, html.style.overflow];
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => { [body.style.overflow, html.style.overflow] = prev; };
  }, [pseudoFs]);

  // 일시정지: 게임 루프는 pausedRef를 보고 진행을 멈춤
  const setPause = (on) => {
    pausedRef.current = on;
    setPaused(on);
    if (on) {
      // 누르고 있던 방향키·드래그 입력 초기화 (재개 시 혼자 움직이지 않게)
      keysRef.current = {};
      dragRef.current = null;
      inputRef.current = { dx: 0, dy: 0, tx: null, ty: null };
    }
  };
  const togglePause = () => setPause(!pausedRef.current);
  const quitGame = () => { setPause(false); setGameState('menu'); };

  // 탭 전환·화면 잠금·전화 수신 등으로 화면이 가려지면 자동 일시정지
  useEffect(() => {
    if (gameState !== 'playing') return;
    const onHide = () => { if (document.hidden) setPause(true); };
    const onPageHide = () => setPause(true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // 숨은 '도움' 버튼: 연속 3번 클릭 → 개발자의 가호
  const tapBless = () => {
    const now = performance.now(), tap = blessTapRef.current;
    tap.n = now - tap.last < BLESS_GAP_MS ? tap.n + 1 : 1;
    tap.last = now;
    if (pausedRef.current) return;
    if (tap.n >= BLESS_TAPS) {
      tap.n = 0;
      gameRef.current?.blessing();
    }
  };

  const startGame = () => {
    unlockAudio();
    document.fonts?.load(`11px ${FONT}`).catch(() => {});
    inputRef.current = { dx: 0, dy: 0, tx: null, ty: null };
    keysRef.current = {};
    setBombs(2);
    setHelp({ auto: false, left: HELP_USES });
    setResult(null);
    setSubmitted(false);
    setPause(false);
    setGameState('playing');
    setRound((r) => r + 1);
    // 모바일: 게임판이 화면에 꽉 차도록 스크롤
    requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const fireSpecial = () => { if (!pausedRef.current) gameRef.current?.special(); };
  const askHelp = () => { if (helpUnlocked && !pausedRef.current) gameRef.current?.setAuto(true); };

  // 키보드: 방향키 / WASD 이동, Space / X 필살기, P / Esc 일시정지
  useEffect(() => {
    if (gameState !== 'playing') return;
    const KEYS = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'u', w: 'u', ArrowDown: 'd', s: 'd' };
    const set = (e, down) => {
      if (down && (e.key === ' ' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        if (!e.repeat) fireSpecial();
        return;
      }
      if (down && (e.key === 'h' || e.key === 'H')) {
        if (!e.repeat) askHelp();
        return;
      }
      if (down && (e.key === 'p' || e.key === 'P' || e.key === 'Escape')) {
        if (!e.repeat) togglePause();
        return;
      }
      if (down && (e.key === 'f' || e.key === 'F')) {
        if (!e.repeat) toggleFullscreen();
        return;
      }
      if (pausedRef.current) return;
      const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
      if (!k) return;
      e.preventDefault();
      const keys = keysRef.current, inp = inputRef.current;
      keys[k] = down;
      inp.dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      inp.dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      if (inp.dx || inp.dy) { inp.tx = null; inp.ty = null; }
    };
    const down = (e) => set(e, true);
    const up = (e) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, helpUnlocked, pseudoFs]);

  // 마우스: 커서 위치로 따라감 / 터치: 누른 곳 기준 상대 드래그 (손가락이 캐릭터를 가리지 않게)
  const toCanvas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - canvas.clientLeft) * (W / canvas.clientWidth),
      y: (e.clientY - rect.top - canvas.clientTop) * (H / canvas.clientHeight),
    };
  };
  const onPointerDown = (e) => {
    if (gameState !== 'playing' || !gameRef.current || pausedRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const c = toCanvas(e), inp = inputRef.current;
    if (e.pointerType === 'mouse') { inp.tx = c.x; inp.ty = c.y; return; }
    dragRef.current = { fx: c.x, fy: c.y, ...gameRef.current.player() };
  };
  const onPointerMove = (e) => {
    if (gameState !== 'playing' || pausedRef.current) return;
    const c = toCanvas(e), inp = inputRef.current;
    if (e.pointerType === 'mouse') { inp.tx = c.x; inp.ty = c.y; return; }
    const d = dragRef.current;
    if (!d) return;
    inp.tx = d.x + (c.x - d.fx) * 1.3;
    inp.ty = d.y + (c.y - d.fy) * 1.3;
  };
  const onPointerUp = (e) => {
    if (e.pointerType === 'mouse') return;
    dragRef.current = null;
    const inp = inputRef.current;
    inp.tx = null;
    inp.ty = null;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // 반응형: 화면에 표시되는 실제 크기 × DPR로 캔버스 해상도를 맞춤 (전체화면·창 크기 변경 시 선명하게)
    let dirty = true; // 일시정지 중에도 캔버스 크기가 바뀌면(전체화면 전환 등) 한 번 다시 그림
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round((canvas.clientWidth || W) * dpr));
      const h = Math.max(1, Math.round((canvas.clientHeight || H) * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; }
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(canvas);
    window.addEventListener('resize', fit);
    // 월드는 저해상도 캔버스에 그린 뒤 최근접 확대 → 도트 그래픽
    const low = document.createElement('canvas');
    low.width = LW;
    low.height = LH;
    const lctx = low.getContext('2d', { willReadFrequently: true });

    const game = createGame({
      sfx,
      bombs: setBombs,
      help: setHelp,
      over: (r) => {
        setResult(r);
        setGameState('over');
        setPlays((n) => {
          try { localStorage.setItem(PLAYS_KEY, String(n + 1)); } catch (e) { /* ignore */ }
          return n + 1;
        });
      },
    });

    gameRef.current = game;
    let raf;
    let last = performance.now();
    let clock = 0; // 일시정지 동안 멈추는 게임 시계 (애니메이션도 정지)
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (pausedRef.current && !dirty) { raf = requestAnimationFrame(frame); return; }
      dirty = false;
      if (!pausedRef.current) {
        clock += dt;
        game.update(dt, inputRef.current);
      }
      // 일시정지 중에는 마지막 화면을 그대로 유지 (흔들림·번개 등 무작위 연출도 멈춤)
      lctx.setTransform(LW / W, 0, 0, LH / H, 0, 0);
      game.draw(lctx, clock);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      game.drawUi(ctx, clock);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', fit);
      gameRef.current = null;
    };
    // round가 바뀔 때마다 새 판
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const submitScore = async () => {
    if (!nickname.trim() || submitted || !result) return;
    setSubmitted(true);
    try {
      // 개발자 도움을 쓴 판은 랭킹에 🤖 표시
      const name = (result.autoUsed ? '🤖 ' : '') + nickname.trim();
      await addDoc(collection(db, 'threejo_scores'), {
        nickname: name,
        score: result.score,
        timestamp: serverTimestamp(),
      });
      loadHighScores();
      setNickname('');
    } catch (e) {
      console.error('Score submit error:', e);
      setSubmitted(false);
      alert('점수 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const ranking = (
    <div style={rankStyle}>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, color: '#3e2723' }}>🏆 명예의 전당</h3>
      {highScores.length === 0 && <div style={{ color: '#aaa' }}>아직 기록이 없어요</div>}
      {highScores.map((s, i) => (
        <div key={i} style={rankRow}>
          <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {s.nickname}</span>
          <b>{Number(s.score).toLocaleString('ko-KR')}점</b>
        </div>
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🏹 쓰리조 챌린지</h1>
      <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>탐관오리 토벌전 · 상하좌우로 피하세요, 공격은 자동!</p>

      <div ref={stageRef} style={pseudoFs ? pseudoFsShell : isFs ? fsShell : { scrollMarginTop: 72 }}>
      <div style={isFs ? fsStageWrap : stageWrap}>
      <div style={topBar}>
        {gameState === 'playing' && (
          <button onClick={togglePause} style={{ ...smallBtn, marginRight: 'auto' }} aria-pressed={paused}>
            {paused ? '▶ 계속하기' : '⏸ 일시정지'}
          </button>
        )}
        <button onClick={toggleFullscreen} style={smallBtn} aria-pressed={isFs}>
          {isFs ? '🗗 창 모드' : '⛶ 전체화면'}
        </button>
        <button onClick={() => setIsMuted((m) => !m)} style={smallBtn}>{isMuted ? '🔇 소리' : '🔊 소리'}</button>
        {gameState === 'playing' && <button onClick={quitGame} style={smallBtn}>✖ 그만하기</button>}
      </div>

      <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={canvasStyle}
        />

        {gameState === 'playing' && paused && (
          <div style={pauseOverlay}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>⏸</div>
            <h2 style={{ margin: '8px 0 4px', fontSize: 22, color: '#FFD166' }}>일시정지</h2>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#f3e9d2' }}>PC: P 또는 Esc로 재개</p>
            <button onClick={() => setPause(false)} style={{ ...btnStyle, marginTop: 0, width: 200 }}>▶ 계속하기</button>
            <button onClick={quitGame} style={{ ...btnStyle, marginTop: 12, width: 200, background: '#3e2723', boxShadow: '4px 4px 0 #000' }}>✖ 그만하기</button>
          </div>
        )}

        {gameState === 'playing' && !paused && (
          // 눈에 잘 안 띄는 숨은 '도움' 버튼 (연속 3번 → 개발자의 가호)
          <button
            onPointerDown={(e) => { e.preventDefault(); tapBless(); }}
            style={secretBtn}
            aria-label="도움"
            title="도움"
          >
            🛠
          </button>
        )}

        {gameState === 'menu' && (
          <div style={overlayStyle}>
            <div style={{ fontSize: 40 }}>🏹⚔️</div>
            <h2 style={{ color: '#3e2723', margin: '6px 0', fontSize: 20 }}>탐관오리 토벌전</h2>
            <p style={{ fontSize: 13, color: '#5d4037', lineHeight: 1.6, margin: '0 0 8px', wordBreak: 'keep-all' }}>
              평민 궁수에서 시작해 <b>활 → 조총 → 대포 → 기관총 → 레이저 → 💧물 → 🔥불 → 🌿풀 → ⚡번개 → ⌨️개발자 키보드·마우스 핵폭격</b>까지 10단계 진화!<br />
              캐슬조 · 제로조 · 킬러조 · 조철왕을 차례로 토벌하라<br />
              <b style={{ color: '#c62828' }}>…조철왕을 쓰러뜨리면 무슨 일이 벌어질까?</b>
            </p>
            <ul style={tipList}>
              <li>🪙 엽전·📦 무기 상자로 레벨업, 레벨이 오를수록 엄호 병사와 발사체 증가</li>
              <li>⚡ 탄을 <b>아슬아슬하게</b> 피하면 경험치 + 연사 속도 폭발</li>
              <li>💥 피격 시 체력 −1, 무기 한 단계 <b>강등</b>!</li>
              <li>🔥 탄이 쏟아지면 <b>필살기</b>로 화면의 탄을 싹 지우기 (보스 격파·📜 부적으로 충전)</li>
              <li>🤖 <b>개발자에게 도움 요청</b>: {HELP_SEC}초 동안 프로게이머 AI가 모든 탄을 피하며 공격 (판당 {HELP_USES}회) · {helpUnlocked ? '해금 완료!' : `${HELP_UNLOCK}판 플레이 후 해금 (현재 ${plays}판)`}</li>
              <li>🎮 PC: 방향키/WASD 이동, Space/X 필살기, H 도움, P/Esc 일시정지, F 전체화면 · 모바일: 게임판을 누른 채 드래그, 아래 버튼</li>
            </ul>
            <div style={itemGrid}>
              {Object.values(POWERUPS).map((pu) => (
                <span key={pu.name} style={{ ...itemChip, borderColor: pu.color }}>{pu.icon} {pu.name}</span>
              ))}
            </div>
            <button onClick={startGame} style={btnStyle}>▶ 토벌 시작</button>
            {ranking}
          </div>
        )}

        {gameState === 'over' && result && (
          <div style={overlayStyle}>
            <div style={{ fontSize: 40, animation: 'none' }}>{KILLER_EMOJI[result.killer] || '💀'}</div>
            {result.loop > 0 ? (
              // 어려움 모드(무한 루프)까지 간 판: 도전 성과 강조
              <>
                <h2 style={{ color: '#c62828', margin: '4px 0 6px', fontSize: 17, wordBreak: 'keep-all', lineHeight: 1.4 }}>
                  결국 개발자 조철왕의 분노를 버티지 못하고 패배했습니다!
                </h2>
                <div style={hardBox}>
                  <div>🔥 최종 난이도: <b>어려움 {result.loop}회차 루프</b></div>
                  <div>🏆 점수: <b style={{ fontSize: 22 }}>{result.score.toLocaleString('ko-KR')}</b>점</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>({result.killer}에게 당함)</div>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ color: '#c62828', margin: '4px 0 6px', fontSize: 19, wordBreak: 'keep-all' }}>
                  {result.killer}에게 당했습니다!
                </h2>
                <p style={{ margin: 0, fontSize: 15, wordBreak: 'keep-all' }}>
                  당신의 최종 점수는 <b style={{ color: '#c62828', fontSize: 24 }}>{result.score.toLocaleString('ko-KR')}</b>점 입니다.
                </p>
              </>
            )}
            <div style={statGrid}>
              <span>🗺️ {result.loop > 0 ? `🔥${result.loop}회차 · ` : ''}{STAGE_NAMES[result.stage]}</span>
              <span>👑 보스 {result.bosses}{result.loop > 0 ? '회' : `/${STAGE_COUNT}`} 격파</span>
              <span>⚡ 아슬아슬 {result.grazes}회</span>
              <span>⏱ {Math.floor(result.time)}초</span>
              <span style={{ gridColumn: '1 / -1' }}>🔫 최종 무기 Lv.{result.power + 1} {weaponLabel(result.power)}</span>
              {result.autoUsed && <span style={{ gridColumn: '1 / -1' }}>🤖 개발자 도움 사용 (랭킹에 🤖 표시)</span>}
              {!helpUnlocked && <span style={{ gridColumn: '1 / -1' }}>🔒 개발자 도움 해금까지 {HELP_UNLOCK - plays}판</span>}
            </div>
            {(result.killer === '조철왕' || result.loop > 0) && (
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', wordBreak: 'keep-all' }}>※ 조철왕의 체력을 0으로 만들면 분노하여 🔥어려움 모드 무한 루프가 시작됩니다. 회차가 오를수록 점수 배율 UP! 몇 회차까지 버틸 수 있을까요?</p>
            )}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <input
                type="text"
                placeholder="닉네임 입력"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitScore(); }}
                style={inputStyle}
                disabled={submitted}
              />
              <button onClick={submitScore} disabled={submitted || !nickname.trim()} style={{ ...btnStyle, marginTop: 0, padding: '10px 14px', fontSize: 15, opacity: submitted || !nickname.trim() ? 0.5 : 1 }}>
                {submitted ? '등록 완료' : '점수 등록'}
              </button>
            </div>
            <button onClick={startGame} style={{ ...btnStyle, background: '#3e2723', width: '100%' }}>🔁 다시 도전</button>
            {ranking}
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        // 모바일: 엄지가 닿는 게임판 바로 아래에 큰 버튼 2개 (게임 화면은 가리지 않음)
        <div style={controlBar}>
          <button
            onPointerDown={(e) => { e.preventDefault(); askHelp(); }}
            disabled={!helpUnlocked || help.auto || help.left <= 0}
            style={{ ...ctrlBtn, background: help.auto ? '#2E7D32' : '#3e2723', opacity: helpUnlocked && (help.auto || help.left > 0) ? 1 : 0.5 }}
            aria-label="개발자에게 도움 요청"
          >
            <span style={{ fontSize: 22 }}>{helpUnlocked ? '🤖' : '🔒'}</span>
            <span style={ctrlLabel}>
              {!helpUnlocked ? `개발자 도움 (${plays}/${HELP_UNLOCK}판 후 해금)`
                : help.auto ? '도움 받는 중…'
                  : help.left > 0 ? `개발자 도움 ×${help.left}` : '도움 소진'}
            </span>
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); fireSpecial(); }}
            disabled={bombs <= 0}
            style={{ ...ctrlBtn, background: '#c62828', opacity: bombs > 0 ? 1 : 0.5 }}
            aria-label={`필살기 사용, 남은 횟수 ${bombs}`}
          >
            <span style={{ fontSize: 22 }}>💥</span>
            <span style={ctrlLabel}>필살기 ×{bombs}</span>
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

const PIXEL_UI = '"Galmuri11", "Noto Sans KR", sans-serif';

const containerStyle = {
  textAlign: 'center',
  padding: '28px 16px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: PIXEL_UI,
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 900,
  color: '#3e2723',
  margin: '0 0 6px',
};

const canvasStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: `${W} / ${H}`,
  border: '6px solid #3e2723',
  borderRadius: 0,
  boxShadow: '6px 6px 0 #a1887f',
  imageRendering: 'pixelated',
  background: '#F3E9D2',
  boxSizing: 'border-box',
  touchAction: 'none',
  userSelect: 'none',
};

const overlayStyle = {
  position: 'absolute',
  inset: 6,
  borderRadius: 0,
  background: 'rgba(253, 251, 247, 0.96)',
  boxShadow: 'inset 0 0 0 3px #3e2723',
  padding: '16px 18px',
  overflowY: 'auto',
  boxSizing: 'border-box',
};

const tipList = {
  textAlign: 'left',
  margin: '0 0 6px',
  paddingLeft: 18,
  fontSize: 12,
  color: '#555',
  lineHeight: 1.65,
  wordBreak: 'keep-all',
};

// 게임판 + 버튼이 한 화면에 들어오도록 창 높이 기준으로 폭 결정 (PC 큰 창에서는 최대 720px까지 확대)
const stageWrap = {
  width: `min(720px, 100%, calc((100dvh - 230px) * ${W / H}))`,
  minWidth: 260,
  margin: '0 auto',
};

// 전체화면: 어두운 배경 가운데에 화면 높이를 꽉 채우는 게임판
const fsShell = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  background: '#1A1220',
  overflow: 'auto',
  boxSizing: 'border-box',
  padding: 8,
};

// 가상 전체화면 (아이폰 등 Fullscreen API 미지원 브라우저): 화면 위에 고정된 전체 레이어
const pseudoFsShell = {
  ...fsShell,
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  height: '100dvh',
  padding: 'max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))',
  overscrollBehavior: 'contain',
};

const pauseOverlay = {
  position: 'absolute',
  inset: 6,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(26, 18, 32, 0.72)',
  color: '#fff',
  boxSizing: 'border-box',
  padding: 16,
};

const fsStageWrap = {
  width: `min(calc(100vw - 16px), calc((100dvh - 150px) * ${W / H}))`,
  minWidth: 260,
  margin: '0 auto',
};

const topBar = { display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 6 };

const secretBtn = {
  position: 'absolute',
  right: 8,
  bottom: 30,
  width: 22,
  height: 22,
  padding: 0,
  fontSize: 11,
  lineHeight: '22px',
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  opacity: 0.22,
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const controlBar = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginTop: 8,
  paddingBottom: 'env(safe-area-inset-bottom)',
};

const ctrlBtn = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  minHeight: 64,
  padding: '6px 4px',
  border: '3px solid #FFD166',
  borderRadius: 0,
  boxShadow: '4px 4px 0 #a1887f',
  color: '#fff',
  fontFamily: PIXEL_UI,
  cursor: 'pointer',
  touchAction: 'manipulation',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const ctrlLabel = { fontSize: 12, fontWeight: 700, lineHeight: 1.2, wordBreak: 'keep-all' };

const itemGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  justifyContent: 'center',
  margin: '4px 0 2px',
};

const itemChip = {
  fontSize: 11,
  padding: '2px 7px',
  borderRadius: 999,
  border: '1.5px solid',
  background: '#fff',
  color: '#3e2723',
  fontWeight: 700,
};

const hardBox = {
  margin: '6px auto 4px', padding: '8px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #b71c1c, #e65100)',
  color: '#fff', fontSize: 14, lineHeight: 1.7, boxShadow: '0 0 12px rgba(255,23,68,0.5)',
};

const statGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 4,
  margin: '10px 0',
  fontSize: 12,
  color: '#5d4037',
  background: '#f6efe9',
  borderRadius: 10,
  padding: '8px 10px',
  textAlign: 'left',
};

const btnStyle = {
  padding: '12px 24px',
  fontSize: 17,
  fontWeight: 800,
  color: '#fff',
  background: '#c62828',
  border: 'none',
  borderRadius: 0,
  boxShadow: '4px 4px 0 #3e2723',
  fontFamily: PIXEL_UI,
  cursor: 'pointer',
  marginTop: 10,
};

const smallBtn = {
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 700,
  background: '#fff',
  color: '#333',
  border: '1px solid #ddd',
  borderRadius: 8,
  cursor: 'pointer',
};

const inputStyle = {
  padding: 10,
  width: 140,
  borderRadius: 8,
  border: '2px solid #ddd',
  fontSize: 14,
};

const rankStyle = {
  marginTop: 14,
  textAlign: 'left',
  fontSize: 13,
  color: '#555',
  borderTop: '1px solid #e0d6cf',
  paddingTop: 10,
};

const rankRow = { display: 'flex', justifyContent: 'space-between', padding: '2px 0' };

export default ThreeJoGame;
