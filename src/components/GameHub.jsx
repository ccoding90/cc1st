import React from 'react';
import { Link } from 'react-router-dom';

const GameHub = () => {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f5f5f5', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '30px' }}>게임 센터</h1>
      <div style={{ display: 'grid', gap: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <Link to="/goalkeeper-game" style={gameButtonStyle}>
          🧤 월드컵 골키퍼 챌린지
        </Link>
        <Link to="/three-jo-game" style={gameButtonStyle}>
          🏹 쓰리조 (Three Jo) 챌린지
        </Link>
        <Link to="/coffee-bet" style={gameButtonStyle}>
          ☕ 점심 커피내기 랜덤 게임 3종
        </Link>
      </div>
    </div>
  );
};

const gameButtonStyle = {
  display: 'block',
  padding: '20px',
  fontSize: '18px',
  fontWeight: 700,
  textDecoration: 'none',
  background: '#fff',
  borderRadius: '12px',
  color: '#333',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

export default GameHub;
