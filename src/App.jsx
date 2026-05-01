import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import MbtiTest from './components/MbtiTest';
import InquiryForm from './components/InquiryForm';
import Board from './components/Board';
import MbtiBlog from './components/MbtiBlog';
import InsightBlog from './components/InsightBlog';
import CelebrityTest from './components/CelebrityTest';
import TrendingTests from './components/TrendingTests';
import LoveLanguageTest from './components/LoveLanguageTest';
import ColorTest from './components/ColorTest';
import MentalAgeTest from './components/MentalAgeTest';
import KpopFanTest from './components/KpopFanTest';
import StressTypeTest from './components/StressTypeTest';
import InvestmentTypeTest from './components/InvestmentTypeTest';
import GatsaengTest from './components/GatsaengTest';
import DatingStyleTest from './components/DatingStyleTest';
import TravelStyleTest from './components/TravelStyleTest';
import FeelconomyTest from './components/FeelconomyTest';
import EmotionTypeTest from './components/EmotionTypeTest';
import NovelPage from './components/NovelPage';
import AboutPage from './components/AboutPage';
import PrivacyPolicy from './components/PrivacyPolicy';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>CCGG</Link>
          <div className="nav-links">
            <NavLink to="/trending" className={({ isActive }) => isActive ? "nav-item active nav-highlight" : "nav-item nav-highlight"}>🔥 이달의 테스트</NavLink>
            <NavLink to="/mbti" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>MBTI</NavLink>
            <NavLink to="/celebrity" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>이상형</NavLink>
            <NavLink to="/blog" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>블로그</NavLink>
            <NavLink to="/insight" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>인사이트</NavLink>
            <NavLink to="/novel" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>웹소설</NavLink>
            <NavLink to="/board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>게시판</NavLink>
            <NavLink to="/inquiry" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>제휴 문의</NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/trending" replace />} />
            {/* 이달의 테스트 허브 */}
            <Route path="/trending" element={<div className="trending-page-wrapper"><TrendingTests /></div>} />
            {/* 기존 테스트 */}
            <Route path="/mbti" element={<div className="mbti-wrapper"><MbtiTest /></div>} />
            <Route path="/celebrity" element={<div className="celeb-wrapper"><CelebrityTest /></div>} />
            {/* 신규 테스트 */}
            <Route path="/love-language" element={<div className="mbti-wrapper"><LoveLanguageTest /></div>} />
            <Route path="/color-test" element={<div className="mbti-wrapper"><ColorTest /></div>} />
            <Route path="/mental-age" element={<div className="mbti-wrapper"><MentalAgeTest /></div>} />
            <Route path="/kpop-fan" element={<div className="mbti-wrapper"><KpopFanTest /></div>} />
            <Route path="/stress-type" element={<div className="mbti-wrapper"><StressTypeTest /></div>} />
            {/* 4월 신규 테스트 */}
            <Route path="/investment-type" element={<div className="mbti-wrapper"><InvestmentTypeTest /></div>} />
            <Route path="/gatsaeng-test" element={<div className="mbti-wrapper"><GatsaengTest /></div>} />
            <Route path="/dating-style" element={<div className="mbti-wrapper"><DatingStyleTest /></div>} />
            {/* 5월 신규 테스트 */}
            <Route path="/travel-style" element={<div className="mbti-wrapper"><TravelStyleTest /></div>} />
            <Route path="/feelconomy-type" element={<div className="mbti-wrapper"><FeelconomyTest /></div>} />
            <Route path="/emotion-type" element={<div className="mbti-wrapper"><EmotionTypeTest /></div>} />
            {/* 블로그 & 커뮤니티 */}
            <Route path="/blog" element={<div className="blog-wrapper"><MbtiBlog /></div>} />
            <Route path="/insight" element={<div className="blog-wrapper"><InsightBlog /></div>} />
            <Route path="/novel" element={<div className="feed-wrapper"><NovelPage /></div>} />
            <Route path="/board" element={<div className="feed-wrapper"><Board /></div>} />
            <Route path="/inquiry" element={<div className="contact-wrapper"><InquiryForm /></div>} />
            {/* 정보 페이지 */}
            <Route path="/about" element={<div className="info-wrapper"><AboutPage /></div>} />
            <Route path="/privacy" element={<div className="info-wrapper"><PrivacyPolicy /></div>} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-links">
            <Link to="/about">소개</Link>
            <Link to="/privacy">개인정보처리방침</Link>
            <Link to="/inquiry">문의하기</Link>
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">광고 설정</a>
          </div>
          <p>© 2026 CCGG • All rights reserved</p>
          <p className="footer-disclaimer">본 사이트의 테스트 결과는 참고용이며 전문적인 심리 진단을 대체하지 않습니다.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
