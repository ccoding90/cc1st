import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COFFEE_GAMES, MIN_PLAYERS, MAX_PLAYERS, gameTitle } from './coffee/games';
import { pick } from './coffee/coffeeGames';
import { loadNames } from './coffee/players';

// 커피내기 게임 목록 - 5종 모두 같은 카드 포맷, 각 게임 페이지에서 공용 명단으로 설정 → 플레이 → 결과
const CoffeeBetGame = () => {
  const navigate = useNavigate();
  const names = loadNames().map((n) => n.trim()).filter(Boolean);
  const entries = Object.entries(COFFEE_GAMES);

  const go = (id) => {
    const g = COFFEE_GAMES[id];
    if (g.href) window.location.href = g.href; // 단독 정적 페이지
    else navigate(`/coffee-bet/${id}`);
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>☕ 점심 커피내기 게임 {entries.length}종</h1>
      <p style={{ color: '#666', margin: '0 auto 20px', maxWidth: 420, wordBreak: 'keep-all' }}>
        게임을 고르고 참가자를 입력하세요. 단 1명이 오늘 커피를 삽니다!
      </p>

      <div style={{ display: 'grid', gap: 12, maxWidth: 420, margin: '0 auto' }}>
        {entries.map(([id, g]) => {
          const body = (
            <>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{gameTitle(g)}</div>
              <div style={{ fontSize: 13, color: '#777', marginTop: 4, wordBreak: 'keep-all' }}>{g.desc}</div>
              <div style={chipRow}>
                <span style={infoChip}>👥 {MIN_PLAYERS}~{MAX_PLAYERS}명</span>
                <span style={infoChip}>⏱ {g.duration}</span>
              </div>
            </>
          );
          return g.href
            ? <a key={id} href={g.href} style={gameBtn}>{body}</a>
            : <Link key={id} to={`/coffee-bet/${id}`} style={gameBtn}>{body}</Link>;
        })}
        <button onClick={() => go(pick(entries.map(([id]) => id)))} style={primaryBtn}>
          🎲 랜덤 게임 고르기
        </button>
        {names.length >= MIN_PLAYERS && (
          <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
            👥 저장된 참가자 {names.length}명: {names.join(', ')} · 게임 화면에서 수정할 수 있어요
          </p>
        )}
      </div>
    </div>
  );
};

const containerStyle = {
  textAlign: 'center',
  padding: '32px 16px',
  background: '#fdfbf7',
  minHeight: '100vh',
  fontFamily: '"Noto Sans KR", sans-serif',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 900,
  color: '#3e2723',
  margin: '0 0 8px',
  wordBreak: 'keep-all',
};

const gameBtn = {
  display: 'block',
  padding: 18,
  textAlign: 'left',
  background: '#fff',
  borderRadius: 12,
  color: '#333',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  textDecoration: 'none',
};

const chipRow = { display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' };

const infoChip = {
  fontSize: 11,
  fontWeight: 700,
  color: '#5d4037',
  background: '#f6efe9',
  borderRadius: 999,
  padding: '3px 9px',
};

const primaryBtn = {
  padding: 16,
  fontSize: 16,
  fontWeight: 800,
  color: '#fff',
  background: '#c62828',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

export default CoffeeBetGame;
