# Blueprint: TestGROUND & Intranet Board

## Overview

TestGROUND is a web application that allows users to take various fun and insightful tests (MBTI). In addition, it now features an **Internal Bulletin Board** for company employees, built with React and Firebase Firestore.

## Features

### 1. TestGROUND (Web Components)
*   MBTI Personality Test with English/Korean support.
*   Affiliate Inquiry Form (Formspree).

### 2. Intranet Bulletin Board (React + Firebase)
*   **Post List:** View registered post titles, authors, and timestamps.
*   **Write Post:** Create new posts with title, author, and content.
*   **Post Detail & Comments:** View full post content and add/view comments directly.
*   **Design:** Clean, professional intranet aesthetic with custom CSS.

## Technology Stack

*   **Framework:** React (for the Board feature)
*   **Database:** Firebase Firestore
*   **Styling:** Modern CSS (Logical properties, Container queries, :has())
*   **Languages:** English/Korean Support (for TestGROUND)

## Current Progress

1.  **MBTI Test & Inquiry:** Fully functional and deployed to GitHub.
2.  **React Setup:** Initializing `package.json` and React entry points.
3.  **Firebase Integration:** Setting up `firebase.js` for Firestore access.
4.  **Board UI:** Implementing Post List, Create Post, and Post Detail components.

## Next Steps

*   [ ] Implement Board feature in React.
*   [ ] Connect Firestore for real-time updates.
*   [ ] Add basic authentication or user identification for "Author" fields.
