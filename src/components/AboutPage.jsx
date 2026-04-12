import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'CCGG 소개 - 무료 심리 테스트 & 성격 유형 검사';
  }, []);

  return (
    <div className="about-wrapper animate-in">
      <div className="about-hero">
        <div className="about-logo">CCGG</div>
        <h1 className="about-title">심리 테스트로 나를 더 잘 알아보세요</h1>
        <p className="about-subtitle">
          CCGG는 누구나 무료로 즐길 수 있는 다양한 심리 테스트와 성격 유형 검사를 제공하는 플랫폼입니다.
        </p>
      </div>

      <div className="about-section">
        <h2>🎯 CCGG가 하는 일</h2>
        <p>
          저희는 심리학 기반의 테스트를 쉽고 재미있게 제공합니다. MBTI, 러브 랭귀지, 색깔 심리 테스트 등
          다양한 유형의 테스트를 통해 자신과 주변 사람들을 더 깊이 이해할 수 있도록 돕습니다.
        </p>
        <p>
          매월 1일, 최신 트렌드를 반영한 새로운 인기 테스트를 업데이트하여 항상 신선한 콘텐츠를 제공합니다.
        </p>
      </div>

      <div className="about-features">
        <div className="feature-card">
          <div className="feature-icon">🔮</div>
          <h3>다양한 테스트</h3>
          <p>MBTI부터 러브 랭귀지, 색깔 심리까지 다양한 성격 & 심리 테스트</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>매월 업데이트</h3>
          <p>매월 1일 최신 트렌드 기반의 새로운 테스트가 추가됩니다</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🆓</div>
          <h3>완전 무료</h3>
          <p>모든 테스트는 회원가입 없이 완전 무료로 이용 가능합니다</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>모바일 최적화</h3>
          <p>PC와 스마트폰 모두 편리하게 이용할 수 있는 반응형 디자인</p>
        </div>
      </div>

      <div className="about-section">
        <h2>📋 제공 중인 테스트</h2>
        <ul className="about-test-list">
          <li><Link to="/mbti">MBTI 성격 유형 테스트</Link> — 16가지 성격 유형으로 나를 알아보세요</li>
          <li><Link to="/celebrity">연예인 이상형 테스트</Link> — 나와 찰떡인 연예인 이상형을 알아보세요</li>
          <li><Link to="/love-language">러브 랭귀지 테스트</Link> — 내가 사랑을 표현하고 받는 방식을 알아보세요</li>
          <li><Link to="/mental-age">심리 나이 테스트</Link> — 당신의 심리적 나이는 몇 살일까요?</li>
          <li><Link to="/kpop-fan">K-POP 팬 유형 테스트</Link> — 나는 어떤 스타일의 팬일까요?</li>
          <li><Link to="/color-test">색깔 심리 테스트</Link> — 내 성격을 색깔로 표현한다면?</li>
          <li><Link to="/stress-type">스트레스 대처 유형 테스트</Link> — 나의 스트레스 해소 방법은?</li>
        </ul>
      </div>

      <div className="about-section">
        <h2>📞 문의 & 제휴</h2>
        <p>
          광고 제휴나 콘텐츠 관련 문의는{' '}
          <Link to="/inquiry">제휴 문의 페이지</Link>를 통해 연락해 주세요.
          담당자가 영업일 기준 24시간 내에 답변드립니다.
        </p>
      </div>

      <div className="about-section about-legal">
        <p>
          본 사이트의 테스트 결과는 참고용이며, 전문적인 심리 진단을 대체하지 않습니다.
          개인정보 처리에 관한 사항은{' '}
          <Link to="/privacy">개인정보처리방침</Link>을 확인해 주세요.
        </p>
      </div>
    </div>
  );
}
