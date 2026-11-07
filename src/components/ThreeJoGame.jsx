import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { W, H, createGame, weaponLabel } from './threejo/engine';
import { sfx, unlockAudio, setMuted } from './coffee/sound';

const MUTED_KEY = 'threejoMuted';
const STAGE_NAMES = ['1탄 캐슬조', '2탄 제로조', '3탄 조철왕'];

function loadMuted() {
  try { return localStorage.getItem(MUTED_KEY) === '1'; } catch (e) { return false; }
}

// 🏹 쓰리조 챌린지 (탐관오리 토벌전) - 화면 껍데기. 게임 로직·드로잉은 threejo/engine.js
const ThreeJoGame = () => {
  const canvasRef = useRef(null);
  const inputRef = useRef({ dir: 0, targetX: null, left: false, right: false });
  const [gameState, setGameState] = useState('menu'); // menu | playing | over
  const [round, setRound] = useState(0);
  const [result, setResult] = useState(null);
  const [highScores, setHighScores] = useState([]);
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMuted, setIsMuted] = useState(loadMuted);

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

  const startGame = () => {
    unlockAudio();
    inputRef.current = { dir: 0, targetX: null, left: false, right: false };
    setResult(null);
    setSubmitted(false);
    setGameState('playing');
    setRound((r) => r + 1);
  };

  // 키보드: ← → / A D
  useEffect(() => {
    if (gameState !== 'playing') return;
    const inp = inputRef.current;
    const set = (e, down) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') inp.left = down;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') inp.right = down;
      else return;
      e.preventDefault();
      inp.dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (inp.dir) inp.targetX = null;
    };
    const down = (e) => set(e, true);
    const up = (e) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState]);

  // 마우스·터치: 손가락(커서) x 위치로 따라감
  const pointerX = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - canvas.clientLeft) * (W / canvas.clientWidth);
  };
  const onPointerDown = (e) => {
    if (gameState !== 'playing') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    inputRef.current.targetX = pointerX(e);
  };
  const onPointerMove = (e) => {
    if (gameState !== 'playing') return;
    if (e.pointerType === 'mouse' || e.buttons) inputRef.current.targetX = pointerX(e);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    const game = createGame({
      sfx,
      over: (r) => {
        setResult(r);
        setGameState('over');
      },
    });

    let raf;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      game.update(dt, inputRef.current);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.draw(ctx, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // round가 바뀔 때마다 새 판
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const submitScore = async () => {
    if (!nickname.trim() || submitted || !result) return;
    setSubmitted(true);
    try {
      await addDoc(collection(db, 'threejo_scores'), {
        nickname: nickname.trim(),
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
      <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>탐관오리 토벌전 · 좌우로만 피하세요, 공격은 자동!</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <button onClick={() => setIsMuted((m) => !m)} style={smallBtn}>{isMuted ? '🔇 소리 OFF' : '🔊 소리 ON'}</button>
        {gameState === 'playing' && <button onClick={() => setGameState('menu')} style={smallBtn}>✖ 그만하기</button>}
      </div>

      <div style={{ position: 'relative', width: W, maxWidth: '100%', margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          style={canvasStyle}
        />

        {gameState === 'menu' && (
          <div style={overlayStyle}>
            <div style={{ fontSize: 40 }}>🏹⚔️</div>
            <h2 style={{ color: '#3e2723', margin: '6px 0', fontSize: 20 }}>탐관오리 토벌전</h2>
            <p style={{ fontSize: 13, color: '#5d4037', lineHeight: 1.6, margin: '0 0 8px', wordBreak: 'keep-all' }}>
              평민 궁수에서 시작해 <b>활 → 조총 → 대포 → 기관총·레이저</b>로 진화!<br />
              캐슬조 · 제로조 · 조철왕을 차례로 토벌하라
            </p>
            <ul style={tipList}>
              <li>🪙 엽전·📦 무기 상자로 레벨업, 레벨이 오를수록 엄호 병사와 발사체 증가</li>
              <li>⚡ 탄을 <b>아슬아슬하게</b> 피하면 경험치 + 연사 속도 폭발</li>
              <li>💥 피격 시 체력 −1, 무기 한 단계 <b>강등</b>!</li>
              <li>🎮 PC: ← → / A D · 모바일: 화면을 누른 채 좌우로</li>
            </ul>
            <button onClick={startGame} style={btnStyle}>▶ 토벌 시작</button>
            {ranking}
          </div>
        )}

        {gameState === 'over' && result && (
          <div style={overlayStyle}>
            <div style={{ fontSize: 40, animation: 'none' }}>{result.killer === '조철왕' ? '👑' : '💀'}</div>
            <h2 style={{ color: '#c62828', margin: '4px 0 6px', fontSize: 19, wordBreak: 'keep-all' }}>
              {result.killer}에게 당했습니다!
            </h2>
            <p style={{ margin: 0, fontSize: 15, wordBreak: 'keep-all' }}>
              당신의 최종 점수는 <b style={{ color: '#c62828', fontSize: 24 }}>{result.score.toLocaleString('ko-KR')}</b>점 입니다.
            </p>
            <div style={statGrid}>
              <span>🗺️ {STAGE_NAMES[result.stage]}</span>
              <span>👑 보스 {result.bosses}/2 격파</span>
              <span>⚡ 아슬아슬 {result.grazes}회</span>
              <span>⏱ {Math.floor(result.time)}초</span>
              <span style={{ gridColumn: '1 / -1' }}>🔫 최종 무기 Lv.{result.power + 1} {weaponLabel(result.power)}</span>
            </div>
            {result.killer === '조철왕' && (
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px' }}>※ 조철왕은 이 게임의 제작자라 아무도 이길 수 없습니다. 오래 버틸수록 점수가 올라가요!</p>
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
    </div>
  );
};

const containerStyle = {
  textAlign: 'center',
  padding: '28px 16px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: '"Noto Sans KR", sans-serif',
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
  borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  background: '#F3E9D2',
  boxSizing: 'border-box',
  touchAction: 'none',
  userSelect: 'none',
};

const overlayStyle = {
  position: 'absolute',
  inset: 6,
  borderRadius: 8,
  background: 'rgba(253, 251, 247, 0.96)',
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
  borderRadius: 10,
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
