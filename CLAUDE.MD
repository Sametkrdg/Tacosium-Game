# Tacosium MVP - Project Context & Guidelines (CLAUDE.md)

## Project Overview
Tacosium is a browser-based, offline-first mobile mini-game designed for festival attendees waiting in food lines [1]. Users scan a QR code to play, fill the "Doyum Metre" (Satiety Meter), and earn a discount coupon at the booth [1].

## Tech Stack & Architecture
- **Architecture:** Zero-backend [2]. Client-side single-file architecture (`index.html` contains the core app logic) [2, 3].
- **Game Engine:** Standard HTML5 `<canvas>` and Vanilla JavaScript [2].
- **Styling:** Embedded Tailwind CSS via official CDN [2, 4].
- **Storage:** Purely client-side using `localStorage` to enforce a 3-hour security lock [2].
- **Offline Infrastructure:** Service Worker (`sw.js`) caching to ensure the game loads and functions perfectly in congested festival environments (cellular dead-zones) [1, 5, 6].
- **Hosting:** Static edge node deployment via Vercel (Hobby Tier) or GitHub Pages [6-8].

## Development Rules & Standards

### 1. Game Loop & Physics
- **Delta-Time Mandatory:** The game loop must be built using `requestAnimationFrame` with strict Time Delta ($\Delta t$) calculations [5, 9]. This ensures that falling object speeds remain uniform across older Androids and newer 120Hz iPhones [5, 9].
- **Collision Detection:** Implement precise intersection validation between the falling items' bounding boxes and the player basket's bounding box (assuming a basket width of 80px) [4, 7, 9, 10].

### 2. Mobile UI/UX Patches (Strict Requirements)
- **Touch Optimization:** Implement a 0ms tap delay for touch controls [1].
- **Disable Default Behaviors:** Apply specific CSS and JS fixes to completely prevent accidental double-tap zooming, text selections, and elastic rubber-banding/scrolling effects on iOS Safari and Android Chrome [6, 7, 10].
- **Viewport Safety:** Properly handle mobile screen notches by explicitly using `env(safe-area-inset-*)` CSS paddings [6, 7].

### 3. Security & The Gatekeeper Lock
- **Win Condition:** The exact millisecond `gameState.score >= 100`, break the game loop, write the absolute Unix timestamp to `localStorage`, and display the reward screen with the coupon code [9].
- **Boot Verification:** On every page load, run an instant script before rendering. If the `localStorage` timestamp exists and the difference is under 3 hours, completely hide the `#game-screen` and only display the `#lock-screen` with a dynamic countdown timer (e.g., 03:00:00) [6, 11].
- **Screenshot Prevention:** Ensure the lock screen has a simple moving CSS element (like a blinking dot or scrolling text) so customers cannot cheat the staff by showing a static screenshot [12].

### 4. Performance & Audio Limitations
- **Load Time:** Initial load speed must be under 1.5 seconds in heavy network traffic [1, 6]. Keep the bundle size extremely small by using Canvas drawings instead of heavy external assets [6].
- **Audio Workaround:** Mobile browsers will block auto-playing audio [12]. Ensure any sound effects are triggered only after the user taps a prominent "START GAME" button to bypass browser restrictions cleanly [12].

## Test Plan & Commands
- **Local Development:** No package manager or build step is required. Run the project by serving `index.html` on a local server [2, 13].
- **Testing Lock Screen:** Write and temporarily uncomment a mock local storage line to test the 3-hour countdown rendering without waiting [4].