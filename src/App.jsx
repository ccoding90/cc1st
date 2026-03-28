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
            <NavLink to="/mbti" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>MBTI</NavLink>
            <NavLink to="/board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>FEED</NavLink>
            <NavLink to="/inquiry" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>CONTACT</NavLink>
          </div>
        </nav>

        <main className="main-content">
          {/* Top Ad Slot (Compliant with Better Ads Standards) */}
          <div className="ad-slot top-ad" id="ad-top">
            {/* Google AdSense will be inserted here */}
          </div>

          <Routes>
            <Route path="/" element={<Navigate to="/mbti" replace />} />
            <Route path="/mbti" element={<MbtiTest />} />
            <Route path="/inquiry" element={<InquiryForm />} />
            <Route path="/board" element={<Board />} />
          </Routes>

          {/* Bottom Ad Slot */}
          <div className="ad-slot bottom-ad" id="ad-bottom"></div>
        </main>

        <footer className="app-footer">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">About Ads</a>
          </div>
          <p>© 2026 CCGG • All rights reserved</p>
          <p style={{ fontSize: '0.7rem', marginTop: '10px', opacity: 0.6 }}>
            This site complies with the Better Ads Standards to provide a non-disruptive user experience.
          </p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
