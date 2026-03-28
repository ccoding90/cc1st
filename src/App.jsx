import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import MbtiTest from './components/MbtiTest';
import InquiryForm from './components/InquiryForm';
import Board from './components/Board';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-brand">CCGG</div>
          <div className="nav-links">
            <NavLink to="/mbti" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>MBTI 테스트</NavLink>
            <NavLink to="/board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>자유게시판</NavLink>
            <NavLink to="/inquiry" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>제휴 문의</NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/mbti" replace />} />
            <Route path="/mbti" element={<div className="mbti-wrapper"><MbtiTest /></div>} />
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
