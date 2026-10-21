import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const W = 400;
const H = 600;
const PLAYER_Y = H - 80;
const PLAYER_R = 20;
const ARROW_SPEED = 7;
const ENEMY_SPEED_BASE = 2;

// --- Drawing Helpers ---

function drawBackground(ctx) {
  // Traditional Paper (Hanji) look
  ctx.fillStyle = '#f5f5dc';
  ctx.fillRect(0, 0, W, H);

  // Simple Joseon-style floor/wall line
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, H - 40);
  ctx.lineTo(W, H - 40);
  ctx.stroke();

  // Pattern
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#3e2723';
  for(let i=0; i<W; i+=40) {
    for(let j=0; j<H; j+=40) {
      ctx.fillText('🏹', i+10, j+20);
    }
  }
  ctx.globalAlpha = 1.0;
}

function drawPlayer(ctx, x) {
  ctx.save();
  ctx.translate(x, PLAYER_Y);
  
  // Gat (Hat)
  ctx.fillStyle = '#212121';
  ctx.fillRect(-15, -35, 30, 5); // Brim
  ctx.fillRect(-8, -45, 16, 12); // Top
  
  // Face
  ctx.fillStyle = '#ffe0b2';
  ctx.beginPath();
  ctx.arc(0, -20, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Body (Dopo)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-15, -5);
  ctx.lineTo(15, -5);
  ctx.lineTo(20, 20);
  ctx.lineTo(-20, 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0e0e0';
  ctx.stroke();

  // Bow
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(15, -5, 20, -Math.PI/2, Math.PI/2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  
  // Ninja/Enemy Outfit
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Mask eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(-8, -5, 5, 3);
  ctx.fillRect(3, -5, 5, 3);
  
  ctx.restore();
}

function drawArrow(ctx, a) {
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(a.x, a.y - 15);
  ctx.stroke();
  
  // Arrow head
  ctx.fillStyle = '#757575';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - 20);
  ctx.lineTo(a.x - 3, a.y - 15);
  ctx.lineTo(a.x + 3, a.y - 15);
  ctx.closePath();
  ctx.fill();
}

const ThreeJoGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, over
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const stateRef = useRef({
    px: W / 2,
    arrows: [],
    enemies: [],
    score: 0,
    frame: 0,
    lastShot: 0
  });

  const loadHighScores = async () => {
    try {
      const q = query(collection(db, 'threejo_scores'), orderBy('score', 'desc'), limit(5));
      const snap = await getDocs(q);
      const scores = snap.docs.map(doc => doc.data());
      setHighScores(scores);
    } catch (e) {
      console.error("Score load error:", e);
    }
  };

  useEffect(() => {
    loadHighScores();
  }, []);

  const startGame = () => {
    stateRef.current = {
      px: W / 2,
      arrows: [],
      enemies: [],
      score: 0,
      frame: 0,
      lastShot: 0
    };
    setScore(0);
    setSubmitted(false);
    setGameState('playing');
  };

  // Canvas may be scaled down on mobile, so convert client coords to canvas coords
  const movePlayer = (clientX) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const border = canvas.clientLeft;
    const mx = (clientX - rect.left - border) * (W / canvas.clientWidth);
    stateRef.current.px = Math.max(20, Math.min(W - 20, mx));
  };

  const handlePointerMove = (e) => {
    if (gameState !== 'playing') return;
    movePlayer(e.clientX);
  };

  const handlePointerDown = (e) => {
    if (gameState !== 'playing') return;
    movePlayer(e.clientX);
    const now = Date.now();
    if (now - stateRef.current.lastShot > 300) {
      stateRef.current.arrows.push({ x: stateRef.current.px, y: PLAYER_Y - 20 });
      stateRef.current.lastShot = now;
    }
  };

  const submitScore = async () => {
    if (!nickname.trim() || submitted) return;
    setSubmitted(true);
    try {
      await addDoc(collection(db, 'threejo_scores'), {
        nickname: nickname.trim(),
        score,
        timestamp: serverTimestamp()
      });
      loadHighScores();
      setNickname('');
      alert('점수가 등록되었습니다!');
    } catch (e) {
      console.error("Score submit error:", e);
      setSubmitted(false);
      alert('점수 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const update = () => {
      const s = stateRef.current;
      s.frame++;

      // Spawn enemies
      if (s.frame % Math.max(20, 60 - Math.floor(s.score / 5)) === 0) {
        s.enemies.push({ x: Math.random() * (W - 40) + 20, y: -20 });
      }

      // Move arrows
      s.arrows = s.arrows.filter(a => {
        a.y -= ARROW_SPEED;
        return a.y > -20;
      });

      // Move enemies
      let hit = false;
      s.enemies = s.enemies.filter(e => {
        e.y += ENEMY_SPEED_BASE + (s.score * 0.1);
        
        // Collision with player
        const dx = e.x - s.px;
        const dy = e.y - PLAYER_Y;
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
          hit = true;
        }
        
        return e.y < H;
      });

      if (hit) {
        setScore(s.score);
        setGameState('over');
        return;
      }

      // Collision Arrow-Enemy (one arrow kills at most one enemy)
      const deadEnemies = new Set();
      s.arrows = s.arrows.filter(a => {
        const target = s.enemies.find(e => {
          if (deadEnemies.has(e)) return false;
          const dx = a.x - e.x;
          const dy = a.y - e.y;
          return Math.sqrt(dx*dx + dy*dy) < 20;
        });
        if (!target) return true;
        deadEnemies.add(target);
        return false;
      });
      if (deadEnemies.size > 0) {
        s.enemies = s.enemies.filter(e => !deadEnemies.has(e));
        s.score += deadEnemies.size;
        setScore(s.score);
      }

      // Draw
      drawBackground(ctx);
      s.arrows.forEach(a => drawArrow(ctx, a));
      s.enemies.forEach(e => drawEnemy(ctx, e));
      drawPlayer(ctx, s.px);

      // UI Score on Canvas
      ctx.fillStyle = '#3e2723';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`처단 수: ${s.score}`, 20, 40);

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🏹 쓰리조 (Three Jo) 챌린지</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>마우스(터치)로 이동하고 클릭(탭)하여 화살을 쏘세요!</p>

      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          style={canvasStyle}
        />

        {gameState === 'menu' && (
          <div style={overlayStyle}>
            <h2 style={{ color: '#3e2723' }}>조선의 궁수여, 준비되었는가?</h2>
            <button onClick={startGame} style={btnStyle}>게임 시작</button>
            <div style={rankStyle}>
              <h3>🏆 명예의 전당</h3>
              {highScores.map((s, i) => (
                <div key={i}>{i+1}. {s.nickname}: {s.score}점</div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div style={overlayStyle}>
            <h2 style={{ color: '#c62828' }}>임무 실패...</h2>
            <p style={{ fontSize: '24px', fontWeight: 800 }}>최종 점수: {score}</p>
            <div style={{ margin: '20px 0' }}>
              <input 
                type="text" 
                placeholder="닉네임 입력"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={inputStyle}
              />
              <button onClick={submitScore} disabled={submitted} style={{ ...btnStyle, opacity: submitted ? 0.5 : 1 }}>
                {submitted ? '등록 완료' : '점수 등록'}
              </button>
            </div>
            <button onClick={startGame} style={{ ...btnStyle, background: '#3e2723' }}>다시 도전</button>
          </div>
        )}
      </div>
    </div>
  );
};

const containerStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: '"Noto Sans KR", sans-serif'
};

const titleStyle = {
  fontSize: '32px',
  fontWeight: 900,
  color: '#3e2723',
  marginBottom: '10px'
};

const canvasStyle = {
  border: '8px solid #3e2723',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  cursor: 'crosshair',
  background: '#fff',
  maxWidth: '100%',
  height: 'auto',
  boxSizing: 'border-box',
  touchAction: 'none'
};

const overlayStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(255, 255, 255, 0.95)',
  padding: '30px',
  borderRadius: '20px',
  width: '300px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
};

const btnStyle = {
  padding: '12px 24px',
  fontSize: '18px',
  fontWeight: 700,
  color: '#fff',
  background: '#c62828',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '10px'
};

const inputStyle = {
  padding: '10px',
  width: '150px',
  borderRadius: '8px',
  border: '2px solid #ddd',
  marginRight: '10px'
};

const rankStyle = {
  marginTop: '20px',
  textAlign: 'left',
  fontSize: '14px',
  color: '#555',
  borderTop: '1px solid #ddd',
  paddingTop: '10px'
};

export default ThreeJoGame;
