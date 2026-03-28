# Blueprint: CCGG Intranet Project

## Overview
A modern web application built with React, Vite, and Firebase. It features an MBTI personality test, an affiliate inquiry form, and an internal bulletin board.

## Project Structure
- **Frontend:** React 19, Vite 6, React Router 7.
- **Backend:** Firebase Firestore (for the Board).
- **Styling:** Modern CSS with Baseline features.
- **Forms:** Formspree for the Inquiry Form.

## Features Implemented
1. **MBTI Test:** A 8-question personality test with bilingual support (KR/EN).
2. **Affiliate Inquiry:** A contact form for business inquiries.
3. **Internal Board:** A Firestore-backed bulletin board with post creation and commenting.
4. **Responsive Design:** Mobile-friendly layout with a sticky navbar and polished UI.

## Current Fixes & Updates
- **Fixed Blank Screen Issue:** Resolved a critical runtime error where `db` was not exported from `src/firebase.js`, causing the application to fail to initialize.
- **Verified Build:** Confirmed that `npm run build` completes successfully.
- **Standardized Firebase Config:** Updated `src/firebase.js` to correctly export `app`, `analytics`, and `db` (Firestore).

## Plan for Deployment
1. Ensure all dependencies are correctly listed in `package.json`.
2. Verify that `index.html` correctly points to the entry point (`/src/main.jsx`).
3. Run a final production build to verify integrity.
4. The project is ready for deployment to platforms like Cloudflare Pages or Firebase Hosting.
