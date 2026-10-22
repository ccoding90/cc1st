import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ShareButtons from './ShareButtons';
import { shuffle, easeOutElastic, updateParticles, drawParticles } from './coffee/coffeeGames';
import { OW as W, OH as H, LOOKS } from './coffee/officeCommon';
import { OFFICE_GAMES } from './coffee/officeGames';
import { sfx, unlockAudio, setMuted } from './coffee/sound';

const STORAGE_KEY = 'coffeeBetPlayers'; // 기존 커피내기와 참가자 명단 공유
const DEFAULT_NAMES = ['김대리', '이과장', '박사원', '최팀장'];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const CONFETTI_COLORS = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#F78C6B', '#fff'];

function loadNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length >= MIN_PLAYERS) return saved.slice(0, MAX_PLAYERS).map(String);
  } catch (e) { /* 저장소 접근 불가 시 기본값 */ }
  return DEFAULT_NAMES;
}

function saveNames(names) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(names)); } catch (e) { /* ignore */ }
}

const OfficeBetGame = ({ gameKey }) => {
  const game = OFFICE_GAMES[gameKey];
  const [names, setNames] = useState(loadNames);
  const [phase, setPhase] = useState('setup'); // setup | playing | result
  const [round, setRound] = useState(0);
  const [fast, setFast] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // 효과음 기본 OFF
  const [board, setBoard] = useState([]);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const rosterRef = useRef([]);
  const fastRef = useRef(false);
  const skipRef = useRef(null);

  const inGame = phase !== 'setup';

  useEffect(() => { setMuted(isMuted); }, [isMuted]);
  useEffect(() => { fastRef.current = fast; }, [fast]);

  const updateName = (i, value) => setNames((prev) => prev.map((n, j) => (j === i ? value : n)));
  const addPlayer = () => setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ''] : prev));
  const removePlayer = (i) => setNames((prev) => (prev.length > MIN_PLAYERS ? prev.filter((_, j) => j !== i) : prev));

  const toggleSound = () => {
    const m = !isMuted;
    setMuted(m);
    setIsMuted(m);
    if (!m) unlockAudio();
  };

  const startGame = () => {
    unlockAudio(); // 사용자 클릭 시점에 오디오 잠금 해제
    const looks = shuffle(LOOKS);
    rosterRef.current = names.map((n, i) => ({ name: n.trim() || `참가자${i + 1}`, look: looks[i % looks.length] }));
    saveNames(names);
    setResult(null);
    setLogs([]);
    setBoard([]);
    setPhase('playing');
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (!inGame) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    let finished = false;
    let quiet = false; // 결과 바로보기 중에는 소리·배너 생략
    let banner = null;
    let logId = 0;
    let g = null;
    const logBuf = [];
    const env = {
      particles: [],
      shake: 0,
      sfx: Object.fromEntries(Object.entries(sfx).map(([k, f]) => [k, () => { if (!quiet) f(); }])),
      banner: (text) => { if (!quiet) banner = { text, t: 0 }; },
      log: (text) => { logBuf.push({ id: ++logId, text, time: g ? g.time : 0 }); },
      finish: (rows) => {
        if (finished) return;
        finished = true;
        sfx.fanfare();
        setResult(rows.map((r) => ({ ...rosterRef.current[r.idx], ...r })));
        setPhase('result');
      },
    };
    g = game.create(rosterRef.current, env);

    const flush = () => {
      if (logBuf.length) {
        const add = logBuf.splice(0).reverse();
        setLogs((prev) => [...add, ...prev].slice(0, 40));
      }
      setBoard(g.standings());
    };
    skipRef.current = () => {
      quiet = true;
      for (let k = 0; k < 40000 && !finished; k++) g.update(0.05);
      quiet = false;
      env.particles.length = 0;
      flush();
    };

    let raf;
    let last = performance.now();
    let simT = 0, flushAcc = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const steps = fastRef.current && !finished ? 2 : 1;
      for (let k = 0; k < steps; k++) {
        g.update(dt);
        updateParticles(env.particles, dt);
      }
      simT += dt * steps;
      env.shake *= Math.pow(0.02, dt);
      flushAcc += dt;
      if (flushAcc > 0.25) { flushAcc = 0; flush(); }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (env.shake > 0.5) ctx.translate((Math.random() - 0.5) * env.shake, (Math.random() - 0.5) * env.shake);
      g.draw(ctx, simT);
      drawParticles(ctx, env.particles);
      ctx.restore();

      if (banner) {
        banner.t += dt;
        if (banner.t > 1.8) banner = null;
        else {
          const sc = easeOutElastic(Math.min(1, banner.t / 0.7));
          ctx.save();
          ctx.globalAlpha = banner.t > 1.4 ? (1.8 - banner.t) / 0.4 : 1;
          ctx.translate(W / 2, 92);
          ctx.scale(sc, sc);
          ctx.font = '900 22px "Noto Sans KR", sans-serif';
          const w = ctx.measureText(banner.text).width + 32;
          ctx.fillStyle = 'rgba(62,39,35,0.9)';
          ctx.fillRect(-w / 2, -22, w, 44);
          ctx.fillStyle = '#FFD166';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(banner.text, 0, 1);
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      skipRef.current = null;
    };
    // round가 바뀔 때마다 새 판 시작
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, inGame]);

  if (!game) return null;

  if (!inGame) {
    return (
      <div style={containerStyle}>
        <Link to="/coffee-bet" style={backLink}>← 커피내기 게임 목록</Link>
        <h1 style={titleStyle}>{game.title}</h1>
        <p style={{ color: '#666', margin: '0 auto 20px', maxWidth: 420, wordBreak: 'keep-all' }}>{game.desc}</p>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ ...sectionTitle, margin: 0 }}>👥 참가자</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => removePlayer(names.length - 1)} disabled={names.length <= MIN_PLAYERS} style={stepBtn} aria-label="인원 줄이기">−</button>
              <b style={{ minWidth: 34, textAlign: 'center' }}>{names.length}명</b>
              <button onClick={addPlayer} disabled={names.length >= MAX_PLAYERS} style={stepBtn} aria-label="인원 늘리기">+</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {names.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 4 }}>
                <input
                  value={n}
                  maxLength={8}
                  placeholder={`참가자${i + 1}`}
                  onChange={(e) => updateName(i, e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={() => removePlayer(i)}
                  disabled={names.length <= MIN_PLAYERS}
                  style={{ ...iconBtn, opacity: names.length <= MIN_PLAYERS ? 0.3 : 1 }}
                  aria-label="참가자 삭제"
                >✕</button>
              </div>
            ))}
          </div>
          {names.length < MAX_PLAYERS && (
            <button onClick={addPlayer} style={addBtn}>+ 참가자 추가</button>
          )}
          <p style={{ color: '#999', fontSize: 12, margin: '8px 0 0' }}>2~10명 · 이름을 비우면 "참가자1" 형식으로 자동 입력돼요.</p>
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitle}>📜 게임 규칙</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            {game.rules.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>

        <button onClick={startGame} style={{ ...primaryBtn, width: '100%', maxWidth: 420, margin: '0 auto', padding: 16 }}>
          ▶ 게임 시작
        </button>
      </div>
    );
  }

  const loser = result && result[result.length - 1];
  return (
    <div style={{ ...containerStyle, padding: '16px 16px 32px' }}>
      <style>{keyframes}</style>
      <h1 style={{ ...titleStyle, fontSize: 20 }}>{game.title}</h1>
      <div style={toolbar}>
        <button onClick={() => setPhase('setup')} style={smallBtn}>← 설정</button>
        <button onClick={() => setFast((f) => !f)} style={fast ? { ...smallBtn, ...activeBtn } : smallBtn}>⏩ 2배속{fast ? ' ON' : ''}</button>
        <button onClick={() => skipRef.current?.()} disabled={phase === 'result'} style={{ ...smallBtn, opacity: phase === 'result' ? 0.4 : 1 }}>⏭ 결과 바로보기</button>
        <button onClick={toggleSound} style={smallBtn}>{isMuted ? '🔇 소리 OFF' : '🔊 소리 ON'}</button>
      </div>

      <div style={{ position: 'relative', width: W, maxWidth: '100%', margin: '0 auto' }}>
        <canvas ref={canvasRef} style={canvasStyle} />

        {phase === 'result' && result && (
          <div style={resultOverlay}>
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                style={{
                  ...confettiStyle,
                  left: `${(i * 37) % 100}%`,
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animationDelay: `${((i * 0.29) % 2.4).toFixed(2)}s`,
                  animationDuration: `${2.2 + (i % 5) * 0.3}s`,
                }}
              />
            ))}
            <div style={{ animation: 'obPop 0.9s both', position: 'relative' }}>
              <div style={{ fontSize: 32, lineHeight: 1.1, animation: 'obWiggle 1s 0.9s infinite' }}>☕</div>
              <div style={{ color: '#FFD166', fontSize: 24, fontWeight: 900, animation: 'obShake 0.45s 0.9s infinite' }}>커피 당첨!</div>
              <div style={resultBanner}><span style={{ color: '#FFD166' }}>{loser.name}</span>님이 쏩니다!</div>
              <div style={{ color: '#ddd', fontSize: 12, marginTop: 2 }}>{loser.detail}</div>
            </div>
            <div style={{ color: '#FFD166', fontSize: 12, fontWeight: 800, margin: '10px 0 4px', position: 'relative' }}>🏆 최종 순위</div>
            <ol style={rankList}>
              {result.map((r, k) => {
                const last = k === result.length - 1;
                return (
                  <li key={r.idx} style={last ? { ...rankRow, ...loserRow } : rankRow}>
                    <span style={{ fontWeight: 900, flexShrink: 0 }}>{['🥇', '🥈', '🥉'][k] || `${k + 1}위`}</span>
                    <span style={{ ...dot, background: r.look.color }} />
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <span style={{ fontSize: 10, opacity: 0.85, whiteSpace: 'nowrap' }}>{last ? `☕ 커피 당첨! · ${r.detail}` : r.detail}</span>
                  </li>
                );
              })}
            </ol>
            <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: 300, position: 'relative' }}>
              <button onClick={startGame} style={primaryBtn}>🔁 다시하기</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPhase('setup')} style={{ ...primaryBtn, flex: 1, fontSize: 13, background: '#5D4037' }}>✏️ 참가자 수정</button>
                <Link to="/coffee-bet" style={{ ...primaryBtn, flex: 1, fontSize: 13, background: '#5D4037', textDecoration: 'none' }}>🎮 다른 게임</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === 'playing' && (
        <div style={panelStyle}>
          <div style={panelTitle}>🏆 실시간 순위</div>
          <ol style={boardGrid}>
            {board.map((b, k) => {
              const pl = rosterRef.current[b.idx];
              return (
                <li key={b.idx} style={{ ...boardItem, background: b.done ? '#E8F5E9' : '#fff' }}>
                  <b style={{ width: 18, color: '#8D6E63' }}>{k + 1}</b>
                  <span style={{ ...dot, background: pl.look.color }} />
                  <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 64 }}>{pl.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.text}</span>
                </li>
              );
            })}
          </ol>
          <div style={{ ...panelTitle, marginTop: 12 }}>📢 이벤트 로그</div>
          <div style={logBox}>
            {logs.length === 0 && <div style={{ color: '#aaa' }}>출발 준비 중…</div>}
            {logs.map((l) => (
              <div key={l.id} style={{ padding: '2px 0' }}>
                <span style={{ color: '#aaa', marginRight: 6 }}>{l.time.toFixed(1)}s</span>{l.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && loser && (
        <div style={{ maxWidth: 420, margin: '20px auto 0' }}>
          <ShareButtons
            shareText={`오늘 커피는 ${loser.name}님이 쏩니다! ☕ ${game.title}에서 당첨!`}
            testTitle="점심 커피내기 랜덤 게임"
          />
        </div>
      )}
    </div>
  );
};

const keyframes = `
@keyframes obPop {
  0% { transform: scale(0.3); opacity: 0; }
  40% { transform: scale(1.15); opacity: 1; }
  60% { transform: scale(0.92); }
  80% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes obWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}
@keyframes obShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px) rotate(-1deg); }
  40% { transform: translateX(4px) rotate(1deg); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
@keyframes obFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(560px) rotate(720deg); opacity: 0.6; }
}`;

const containerStyle = {
  textAlign: 'center',
  padding: '32px 16px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: '"Noto Sans KR", sans-serif',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 900,
  color: '#3e2723',
  margin: '0 0 8px',
  wordBreak: 'keep-all',
};

const backLink = {
  display: 'inline-block',
  marginBottom: 12,
  fontSize: 13,
  color: '#8d6e63',
  textDecoration: 'none',
  fontWeight: 700,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  maxWidth: 420,
  margin: '0 auto 16px',
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  textAlign: 'left',
  boxSizing: 'border-box',
};

const sectionTitle = { margin: '0 0 12px', fontSize: 16, color: '#3e2723' };

const inputStyle = {
  flex: 1,
  minWidth: 0,
  padding: '10px',
  borderRadius: 8,
  border: '2px solid #eee',
  fontSize: 14,
};

const iconBtn = {
  border: 'none',
  background: '#f3f3f3',
  borderRadius: 8,
  width: 34,
  cursor: 'pointer',
  color: '#999',
};

const stepBtn = {
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 8,
  background: '#efebe9',
  color: '#5d4037',
  fontSize: 18,
  fontWeight: 800,
  cursor: 'pointer',
};

const addBtn = {
  marginTop: 10,
  width: '100%',
  padding: 10,
  border: '2px dashed #d7ccc8',
  background: 'transparent',
  borderRadius: 8,
  color: '#8d6e63',
  fontWeight: 700,
  cursor: 'pointer',
};

const primaryBtn = {
  display: 'block',
  padding: '12px 16px',
  fontSize: 16,
  fontWeight: 800,
  color: '#fff',
  background: '#c62828',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const toolbar = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  justifyContent: 'center',
  marginBottom: 10,
};

const smallBtn = {
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 700,
  background: '#fff',
  color: '#333',
  border: '1px solid #ddd',
  borderRadius: 8,
  cursor: 'pointer',
};

const activeBtn = { background: '#3e2723', color: '#FFD166', borderColor: '#3e2723' };

const canvasStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: `${W} / ${H}`,
  borderRadius: 12,
  border: '5px solid #3e2723',
  boxSizing: 'border-box',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

const resultOverlay = {
  position: 'absolute',
  inset: 0,
  borderRadius: 12,
  overflowX: 'hidden',
  overflowY: 'auto',
  background: 'radial-gradient(circle, rgba(120,20,20,0.88), rgba(0,0,0,0.93))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px 12px',
  boxSizing: 'border-box',
};

const confettiStyle = {
  position: 'absolute',
  top: 0,
  width: 7,
  height: 11,
  borderRadius: 2,
  animationName: 'obFall',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  pointerEvents: 'none',
};

const resultBanner = {
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  marginTop: 2,
  textShadow: '0 4px 12px rgba(0,0,0,0.6)',
  wordBreak: 'keep-all',
};

const rankList = {
  listStyle: 'none',
  padding: 0,
  margin: '4px 0 10px',
  width: '100%',
  maxWidth: 340,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 4,
  position: 'relative',
};

const rankRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 6px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  fontSize: 12,
  minWidth: 0,
  textAlign: 'left',
};

const loserRow = {
  gridColumn: '1 / -1',
  justifyContent: 'center',
  fontSize: 14,
  padding: '7px 10px',
  background: '#E63946',
  boxShadow: '0 0 0 2px #FFD166',
  animation: 'obShake 0.45s infinite',
};

const dot = {
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  flexShrink: 0,
  border: '1.5px solid #fff',
};

const panelStyle = {
  maxWidth: W,
  margin: '12px auto 0',
  background: '#fff',
  borderRadius: 12,
  padding: 12,
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  textAlign: 'left',
  boxSizing: 'border-box',
};

const panelTitle = { fontSize: 13, fontWeight: 800, color: '#3e2723', marginBottom: 6 };

const boardGrid = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
  gap: 4,
};

const boardItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #f0ebe8',
  fontSize: 12,
  minWidth: 0,
};

const logBox = {
  height: 96,
  overflowY: 'auto',
  fontSize: 12,
  color: '#444',
  background: '#faf7f5',
  borderRadius: 8,
  padding: '6px 8px',
};

export default OfficeBetGame;
