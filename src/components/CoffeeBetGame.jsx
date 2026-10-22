import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ShareButtons from './ShareButtons';
import {
  W, H, CHARACTERS, GAMES, shuffle, pick, easeOutElastic, updateParticles, drawParticles,
} from './coffee/coffeeGames';
import { OFFICE_GAMES } from './coffee/officeGames';
import { sfx, unlockAudio, setMuted } from './coffee/sound';

const STORAGE_KEY = 'coffeeBetPlayers';
const BOMB_TIME_KEY = 'coffeeBetBombTime';
const DEFAULT_NAMES = ['김대리', '이과장', '박사원', '최팀장'];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

function loadNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length >= MIN_PLAYERS) return saved.slice(0, MAX_PLAYERS).map(String);
  } catch (e) { /* 저장소 접근 불가 시 기본값 */ }
  return DEFAULT_NAMES;
}

function loadBombTime() {
  try {
    const v = Number(localStorage.getItem(BOMB_TIME_KEY));
    if (GAMES.bomb.times.includes(v)) return v;
  } catch (e) { /* ignore */ }
  return GAMES.bomb.times[0];
}

const timeLabel = (sec) => (sec >= 60 ? `${sec / 60}분` : `${sec}초`);

function saveNames(names) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(names)); } catch (e) { /* ignore */ }
}

const CoffeeBetGame = () => {
  const [names, setNames] = useState(loadNames);
  const [phase, setPhase] = useState('setup'); // setup | playing | result
  const [gameId, setGameId] = useState(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bombTime, setBombTime] = useState(loadBombTime);
  const canvasRef = useRef(null);
  const rosterRef = useRef([]);

  const inGame = phase !== 'setup';
  const validNames = names.map((n) => n.trim()).filter(Boolean);

  useEffect(() => { setMuted(isMuted); }, [isMuted]);
  useEffect(() => {
    try { localStorage.setItem(BOMB_TIME_KEY, String(bombTime)); } catch (e) { /* ignore */ }
  }, [bombTime]);

  const updateName = (i, value) => setNames((prev) => prev.map((n, j) => (j === i ? value : n)));
  const addPlayer = () => setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ''] : prev));
  const removePlayer = (i) => setNames((prev) => (prev.length > MIN_PLAYERS ? prev.filter((_, j) => j !== i) : prev));

  const startGame = (id) => {
    if (validNames.length < MIN_PLAYERS) return;
    unlockAudio(); // 사용자 클릭 시점에 오디오 잠금 해제
    const chosen = id === 'random' ? pick(Object.keys(GAMES)) : id;
    const chars = shuffle(CHARACTERS);
    rosterRef.current = shuffle(validNames).map((name, i) => ({ name, ch: chars[i % chars.length] }));
    saveNames(validNames);
    setGameId(chosen);
    setResult(null);
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
    let banner = null;
    const env = {
      particles: [],
      shake: 0,
      slow: 1,
      sfx,
      banner: (text) => { banner = { text, t: 0 }; },
      finish: (i) => {
        if (finished) return;
        finished = true;
        sfx.fanfare();
        setResult(rosterRef.current[i]);
        setPhase('result');
      },
    };
    const game = GAMES[gameId].create(rosterRef.current, env, { fuse: bombTime });

    let raf;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const sdt = dt * env.slow;
      game.update(sdt);
      updateParticles(env.particles, sdt);
      env.shake *= Math.pow(0.02, dt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (env.shake > 0.5) ctx.translate((Math.random() - 0.5) * env.shake, (Math.random() - 0.5) * env.shake);
      game.draw(ctx, t);
      drawParticles(ctx, env.particles);
      ctx.restore();

      if (env.slow < 1) {
        const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.7);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
      }
      if (banner) {
        banner.t += dt;
        if (banner.t > 1.8) banner = null;
        else {
          const sc = easeOutElastic(Math.min(1, banner.t / 0.7));
          ctx.save();
          ctx.globalAlpha = banner.t > 1.4 ? (1.8 - banner.t) / 0.4 : 1;
          ctx.translate(W / 2, 70);
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
    return () => cancelAnimationFrame(raf);
    // round가 바뀔 때마다 새 판 시작
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, inGame]);

  if (!inGame) {
    return (
      <div style={containerStyle}>
        <style>{keyframes}</style>
        <h1 style={titleStyle}>☕ 점심 커피내기 랜덤 게임 3종</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>참가자를 입력하고 게임을 고르세요. 단 1명이 오늘 커피를 삽니다!</p>

        <div style={cardStyle}>
          <h3 style={sectionTitle}>👥 참가자 ({names.length}/{MAX_PLAYERS})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {names.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 4 }}>
                <input
                  value={n}
                  maxLength={8}
                  placeholder={`참가자 ${i + 1}`}
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
          {validNames.length < MIN_PLAYERS && (
            <p style={{ color: '#c62828', fontSize: 13, marginTop: 8 }}>이름을 2명 이상 입력해주세요.</p>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12, maxWidth: 420, margin: '0 auto' }}>
          {Object.entries(GAMES).map(([id, g]) => (
            <div key={id} style={g.times ? { ...gameBtn, padding: 0, overflow: 'hidden' } : undefined}>
              <button onClick={() => startGame(id)} disabled={validNames.length < MIN_PLAYERS} style={g.times ? { ...gameBtn, width: '100%', boxShadow: 'none', borderRadius: 0 } : { ...gameBtn, width: '100%' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{g.title}</div>
                <div style={{ fontSize: 13, color: '#777', marginTop: 4, fontWeight: 400 }}>{g.desc}</div>
              </button>
              {g.times && (
                <div style={timeRow}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#5D4037' }}>⏱ 폭탄 시간</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {g.times.map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setBombTime(sec)}
                        aria-pressed={bombTime === sec}
                        style={bombTime === sec ? { ...timeBtn, ...timeBtnActive } : timeBtn}
                      >{timeLabel(sec)}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => startGame('random')} disabled={validNames.length < MIN_PLAYERS} style={{ ...primaryBtn, padding: 16 }}>
            🎲 랜덤 게임으로 바로 시작
          </button>
        </div>

        <div style={{ maxWidth: 420, margin: '32px auto 0' }}>
          <h3 style={{ ...sectionTitle, textAlign: 'left' }}>🆕 회사원 내기 게임 (최대 10명)</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(OFFICE_GAMES).map(([id, g]) => (
              <Link key={id} to={g.path} style={{ ...gameBtn, display: 'block', textDecoration: 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{g.title}</div>
                <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}>{g.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const game = GAMES[gameId];
  return (
    <div style={containerStyle}>
      <style>{keyframes}</style>
      <h1 style={{ ...titleStyle, fontSize: 24 }}>{game.title}</h1>
      <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>
        {game.desc}{game.times ? ` (⏱ ${timeLabel(bombTime)})` : ''}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={() => setPhase('setup')} style={smallBtn}>← 게임 선택</button>
        <button onClick={() => setIsMuted((m) => !m)} style={smallBtn}>{isMuted ? '🔇 소리 켜기' : '🔊 소리 끄기'}</button>
      </div>

      <div style={{ position: 'relative', width: W, maxWidth: '100%', margin: '0 auto' }}>
        <canvas ref={canvasRef} style={canvasStyle} />

        {phase === 'result' && result && (
          <div style={resultOverlay}>
            <div style={{ animation: 'cbPop 0.9s both' }}>
              <div style={{ fontSize: 64, marginBottom: 8, animation: 'cbWiggle 1s 0.9s infinite' }}>☕️</div>
              <div style={resultBanner}>
                <span style={{ color: '#FFD166' }}>{result.name}</span>님이<br />오늘 커피 쏩니다! ☕️
              </div>
              <div style={{ color: '#ddd', fontSize: 13, marginTop: 8 }}>캐릭터: {result.ch.name}</div>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 20, width: '80%' }}>
              <button onClick={() => startGame(gameId)} style={primaryBtn}>🔁 같은 게임 한 판 더</button>
              <button onClick={() => setPhase('setup')} style={{ ...primaryBtn, background: '#5D4037' }}>🎮 다른 게임 고르기</button>
            </div>
          </div>
        )}
      </div>

      {phase === 'result' && result && (
        <div style={{ maxWidth: 420, margin: '20px auto 0' }}>
          <ShareButtons
            shareText={`오늘 커피는 ${result.name}님이 쏩니다! ☕ ${game.title}에서 당첨!`}
            testTitle="점심 커피내기 랜덤 게임"
          />
        </div>
      )}
    </div>
  );
};

const keyframes = `
@keyframes cbPop {
  0% { transform: scale(0.3); opacity: 0; }
  40% { transform: scale(1.15); opacity: 1; }
  60% { transform: scale(0.92); }
  80% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes cbWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-12deg); }
  75% { transform: rotate(12deg); }
}`;

const containerStyle = {
  textAlign: 'center',
  padding: '32px 16px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: '"Noto Sans KR", sans-serif',
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 900,
  color: '#3e2723',
  margin: '0 0 8px',
  wordBreak: 'keep-all',
};

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  maxWidth: 420,
  margin: '0 auto 20px',
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  textAlign: 'left',
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

const gameBtn = {
  padding: 18,
  textAlign: 'left',
  background: '#fff',
  border: 'none',
  borderRadius: 12,
  color: '#333',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  cursor: 'pointer',
};

const timeRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 18px',
  borderTop: '1px dashed #eee',
  background: '#fffaf3',
};

const timeBtn = {
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 700,
  background: '#fff',
  color: '#5D4037',
  border: '2px solid #d7ccc8',
  borderRadius: 999,
  cursor: 'pointer',
};

const timeBtnActive = {
  background: '#c62828',
  color: '#fff',
  borderColor: '#c62828',
};

const primaryBtn = {
  padding: '12px 20px',
  fontSize: 16,
  fontWeight: 800,
  color: '#fff',
  background: '#c62828',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

const smallBtn = {
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 700,
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 8,
  cursor: 'pointer',
};

const canvasStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: `${W} / ${H}`,
  borderRadius: 12,
  border: '6px solid #3e2723',
  boxSizing: 'border-box',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

const resultOverlay = {
  position: 'absolute',
  inset: 0,
  borderRadius: 12,
  background: 'radial-gradient(circle, rgba(120,20,20,0.85), rgba(0,0,0,0.92))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const resultBanner = {
  color: '#fff',
  fontSize: 26,
  fontWeight: 900,
  lineHeight: 1.4,
  textShadow: '0 4px 12px rgba(0,0,0,0.6)',
  wordBreak: 'keep-all',
};

export default CoffeeBetGame;
