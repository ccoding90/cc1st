import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import MbtiTest from './components/MbtiTest';
import InquiryForm from './components/InquiryForm';
import Board from './components/Board';
import MbtiBlog from './components/MbtiBlog';
import CelebrityTest from './components/CelebrityTest';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>CCGG</Link>
          <div className="nav-links">
            <NavLink to="/mbti" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>MBTI 테스트</NavLink>
            <NavLink to="/celebrity" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>이상형 테스트</NavLink>
            <NavLink to="/blog" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>MBTI 블로그</NavLink>
            <NavLink to="/board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>자유게시판</NavLink>
            <NavLink to="/inquiry" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>제휴 문의</NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/mbti" replace />} />
            <Route path="/mbti" element={<div className="mbti-wrapper"><MbtiTest /></div>} />
            <Route path="/celebrity" element={<div className="celeb-wrapper"><CelebrityTest /></div>} />
            <Route path="/blog" element={<div className="blog-wrapper"><MbtiBlog /></div>} />
            <Route path="/inquiry" element={<div className="contact-wrapper"><InquiryForm /></div>} />
            <Route path="/board" element={<div className="feed-wrapper"><Board /></div>} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">About Ads</a>
          </div>
          <p>© 2026 CCGG • All rights reserved</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
