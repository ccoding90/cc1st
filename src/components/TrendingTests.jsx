import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MONTHLY_TESTS, getCurrentMonthKey, getMonthList } from '../data/monthlyTests';

export default function TrendingTests() {
  const navigate = useNavigate();
  const monthList = getMonthList();
  const currentMonthKey = getCurrentMonthKey();

  // 현재 달 데이터가 있으면 현재 달, 없으면 가장 최신 달을 기본으로
  const defaultTab = MONTHLY_TESTS[currentMonthKey] ? currentMonthKey : monthList[0];
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    document.title = '이달의 인기 테스트 - 매월 업데이트 | CCGG';
  }, []);

  const activeData = MONTHLY_TESTS[activeTab];

  return (
    <div className="trending-wrapper animate-in">
      {/* 헤더 */}
      <div className="trending-header">
        <h1 className="trending-main-title">
          📅 이달의 인기 테스트
        </h1>
        <p className="trending-main-desc">
          매월 1일, 전월 기준 검색 상위 인기 테스트가 업데이트됩니다
        </p>
      </div>

      {/* 월 탭 */}
      <div className="month-tabs">
        {monthList.map((key) => (
          <button
            key={key}
            className={`month-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {MONTHLY_TESTS[key].emoji} {MONTHLY_TESTS[key].label}
          </button>
        ))}
      </div>

      {/* 월별 설명 */}
      <p className="month-description">{activeData.description}</p>

      {/* 테스트 카드 그리드 */}
      <div className="test-grid">
        {activeData.tests.map((test, index) => (
          <div key={test.id} className="trending-test-card">
            {/* 순위 & 신규 뱃지 */}
            <div className="card-badges">
              <span className="rank-badge">TOP {test.searchRank}</span>
              {test.isNew && <span className="rank-badge new-badge">NEW</span>}
            </div>

            {/* 이모지 & 제목 */}
            <div className="test-card-emoji">{test.emoji}</div>
            <h3 className="test-card-title">{test.title}</h3>
            <p className="test-card-desc">{test.description}</p>

            {/* 태그 */}
            <div className="test-tags">
              {test.tags.map((tag) => (
                <span key={tag} className="test-tag">#{tag}</span>
              ))}
            </div>

            {/* 버튼 */}
            {test.isAvailable ? (
              <button
                className="btn-test"
                onClick={() => navigate(test.path)}
              >
                테스트 하기 →
              </button>
            ) : (
              <button className="btn-test btn-coming-soon" disabled>
                준비 중 🔧
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="trending-footer-note">
        <p>
          💡 <strong>업데이트 기준:</strong> 전월 기준 구글 검색 상위권 (10대~40대 대상)
        </p>
        <p>매월 1일에 새로운 인기 테스트가 추가됩니다.</p>
      </div>
    </div>
  );
}
