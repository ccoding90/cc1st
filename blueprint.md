# Blueprint: CCGG

## Overview

CCGG is a unified internal platform that combines fun personality insights with essential company tools. It integrates a 10-question MBTI test, a partnership inquiry system, and a real-time bulletin board into a single, cohesive React application.

## Core Features

### 1. Navigation System
*   **Sticky Navbar:** Always-on-top menu with links to all main sections.
*   **Routing:** Powered by `react-router-dom` for smooth, single-page transitions.

### 2. MBTI Test (10 Questions)
*   **Bilingual:** Full support for English and Korean.
*   **Logic:** Calculates 16 personality types based on user responses.
*   **UI:** Animated transitions (FadeIn, ScaleIn) for a modern feel.

### 3. Affiliate Inquiry
*   **Formspree Integration:** Direct-to-email inquiry submission.
*   **Multilingual:** Localized labels and placeholders.

### 4. Freedom Board (자유게시판)
*   **Firebase Firestore:** Real-time database for posts and comments.
*   **Post Management:** Create and view posts with author tracking.
*   **Comment System:** Built-in discussion threads for each post.

## Technical Architecture

*   **Framework:** React 19
*   **Router:** React Router 7
*   **Database:** Firebase Firestore
*   **Styling:** Custom CSS with modern variables and animations.
*   **Fonts:** Poppins (Heading), Lato (Body), Noto Sans KR (Korean support).

## Current Progress

1.  **Unified Platform:** Integrated previously separate features into a single React app.
2.  **Navigation:** Implemented a fixed top navbar for [MBTI 테스트], [제휴 문의], [자유게시판].
3.  **Error Resolution:** Fixed the "White Screen" rendering error by properly structuring the `src` directory and components.
4.  **Branding:** Updated the document title and logo to **CCGG**.

## Next Steps

*   [ ] **Authentication:** Add employee login for the Freedom Board.
*   [ ] **Search:** Implement a search feature for board posts.
*   [ ] **Dark Mode:** Add a toggle for dark/light themes.
