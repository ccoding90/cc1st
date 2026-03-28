# Blueprint: TestGROUND

## Overview

TestGROUND is a web application that allows users to take various fun and insightful tests. The application is built with modern, framework-less web technologies, including Web Components (Shadow DOM), to ensure it is modular, maintainable, and performant.

## Design and Style Guide

*   **Aesthetics:** Clean, modern, and engaging with a visually balanced layout and polished styles.
*   **Color Palette:**
    *   Primary Background: Very light gray (`#f8f9fa`) with a subtle noise texture (5% opacity).
    *   Header/Footer: Deep dark slate blue (`#2c3e50`).
    *   Primary Text: Dark gray (`#343a40`).
    *   Accent Color: Vibrant coral (`#ff6b6b`) with a hover state (`#ff4757`).
*   **Typography:**
    *   Headings: 'Poppins', a bold and friendly sans-serif font.
    *   Body Text: 'Lato', a clean and readable sans-serif font.
*   **Layout:**
    *   Fully responsive and mobile-first.
    *   A main `app-shell` component manages the header, main content, and footer.
    *   A central content area with a max-width of 1200px.
*   **Iconography:** Interactive and illustrative icons for test cards (e.g., 🧠 for MBTI).
*   **Interactivity:** 
    *   Buttons and cards have smooth transitions (`cubic-bezier(0.25, 0.8, 0.25, 1)`).
    *   Hover effects include subtle lifting (transform) and deepening of shadows.
    *   Animations for question transitions (fade-in) and result display (scale-in).

## Feature Set

*   **Test Selection:** A home screen displaying available tests in a polished card format.
*   **MBTI Test:**
    *   8-question version (expandable) focusing on the four dichotomies (E/I, S/N, T/F, J/P).
    *   Progress tracking (e.g., "Question 1 of 8").
    *   Calculation of the 16 personality types with descriptive results.
    *   "Take Again" and "Back to Home" navigation.

## Component Architecture (Web Components)

*   `<app-shell>`: The root component that structures the application layout and manages high-level view routing.
*   `<test-card>`: A reusable component to display test summaries with an icon, title, and description.
*   `<mbti-test>`: A self-contained component that manages the state and logic of the MBTI test, including scoring and result mapping.

## Current Progress

1.  **Fixed Visibility:** Removed the global `opacity: .3` and implemented the noise texture correctly on a pseudo-element.
2.  **Encapsulated Styles:** Moved component-specific styles into their respective Shadow DOMs for true encapsulation while leveraging global CSS variables for theming.
3.  **Enhanced MBTI Test:** Increased question count to 8 and added detailed result descriptions for all 16 types.
4.  **Improved Navigation:** Added a "Back to Home" option from the test result screen.

## Next Steps

*   [ ] **Add More Tests:** Implement a "Career Match" or "Quick IQ" test to expand the platform.
*   [ ] **Persistence:** Use `localStorage` to save user results.
*   [ ] **Sharing:** Add a feature to share test results (e.g., "I got INTJ on TestGROUND!").
*   [ ] **Visual Polish:** Add more subtle animations and perhaps a loading state between views.
