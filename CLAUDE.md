# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Tick Tock Trivia" — a Hebrew (RTL), speed-based trivia game running entirely client-side. Plain **vanilla JavaScript (ES6)**, HTML, and CSS — no framework (no React/Vue/Angular), no bundler, no TypeScript, no build step. The only npm dependency is `firebase` (`^12.16.0`), and even that is unused in favor of the Firebase **compat SDK loaded via CDN `<script>` tags** in each HTML file (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`, `firebase-analytics-compat.js`) — `firebaseConfig.js` calls `firebase.initializeApp(...)` and `firebase.analytics()`.

There is no test suite, linter, or bundler configured — nothing to run for build/lint/test.

## Running locally

```
npm install       # only installs the (unused) firebase package from package.json
```

Serve the folder with any static file server (e.g. VSCode Live Server, `npx serve`) and open `index.html`. **Do not open via `file://`** — Firebase Auth/Firestore require an `http(s)://` origin.

## Deployment

Hosted on **Vercel**, connected to the `bmwz3341-is/my-Trivia-app` GitHub repo — every `git push` to `main` auto-deploys, live at `my-trivia-app-one.vercel.app`. There is no Firebase Hosting config in this repo (no `firebase.json` / `.firebaserc`) — hosting was deliberately moved off Firebase Hosting to Vercel; Firebase itself (Auth, Firestore, Analytics) is unaffected since those are backend services independent of where the static files are served from.

Any new hosting domain (Vercel preview URLs, custom domains, etc.) must be added to **Firebase Console → Authentication → Settings → Authorized domains**, or Anonymous Auth (and therefore duel mode) will fail from that origin.

## Analytics

Google Analytics (GA4) is wired through Firebase Analytics — `measurementId: 'G-8H81LKJF3C'` in `firebaseConfig.js`, initialized via `firebase.analytics()`. All 7 page HTML files load `firebase-analytics-compat.js` before `firebaseConfig.js`. Standard (non-Realtime) GA reports lag ~24-48h behind live traffic; use the Realtime report to verify tracking immediately after a deploy.

## Ads (Google AdSense)

The site is linked to Google AdSense (publisher ID `ca-pub-1663882705316802`) — the verification `<script async src="...adsbygoogle.js?client=ca-pub-1663882705316802">` tag is already in the `<head>` of all 7 page HTML files. As of 2026-08-03 the site is still pending Google's review/approval (site verification + review request steps are done; a consent message for EEA users was set up via Google's own CMP). No ads render until that review completes.

Planned next step once approved: enable **Anchor ads only** (sticky bottom banner, via AdSense's Auto ads dashboard setting, not hand-built) on all pages — chosen over a manual fixed `<div>` because Google's anchor ad ships with a required close (✕) button and responsive sizing out of the box. `leaderboardPage.css`, `questPageTrivia.css`, and `subCategoryPage.css` each have a `.back-button` fixed at `bottom: 16px` that will need its offset raised (e.g. to `~76px`) once the anchor ad is live, to avoid the ad overlapping/occluding that button.

## Architecture

### No modules — scripts are globals loaded by `<script>` order

Every page is a standalone `.html` file that loads its dependencies as plain `<script>` tags (no `import`/`export`, no bundling), in a fixed order that matters: Firebase CDN scripts → `firebaseConfig.js` → `playerProfile.js` → `leaderboard.js` → `soundEffects.js` → feature-specific files (e.g. `duel.js` before `duelPageTrivia.js`) → the page's own controller script. Functions and `const`s declared in one script are consumed as globals by scripts loaded after it — there is no explicit dependency wiring beyond script tag order.

### Page → controller script pairing

Each page has a matching `.html` + `.js` + `.css` triplet (e.g. `questPageTrivia.html` / `.js` / `.css`). Page flow, in order:

`index.html` (`HomePageTrivia.js`) → `subCategoryPage.html?category=<key>` (`subCategoryPage.js`) → `questPageTrivia.html?category=<key>&sub=<subKey>&count=<n>` (`questPageTrivia.js`) → `resultPage.html`.

"אתגר מהיר" (Quick Game) on the home page skips the category/sub-category steps entirely by picking a random category+subcategory from `questions.json` and navigating straight to `questPageTrivia.html`. Head-to-head duels follow a parallel path: `duelSetup.js` (category/sub-category picker modal) → `duelPageTrivia.html?room=<code>` → `duelResultPage.html`.

### Legal pages

Five static, Firebase-free pages — `privacy.html`, `terms.html`, `cookies.html`, `about.html`, `accessibility.html` (Privacy Policy, Terms of Use, Cookie Policy, About Us, and an Israeli-law accessibility statement) — added 2026-08-05 ahead of public launch. They share `legalPage.css` (same gradient-background/white-card visual language as the rest of the app) and `legalPage.js` (wires only the back button to `index.html`; no Firebase scripts loaded). `index.html` links to all five from a fixed `.legal-footer` strip at the bottom of the home screen — no other page links to them. `accessibility.html` has a `[להשלמה - שם מלא]` placeholder for the accessibility coordinator's name that must be filled in before launch (Israeli accessibility regulations require a named contact, not just an email).

### Question data (`questions.json`)

Static JSON, shape: `{ [categoryKey]: { title, theme, subcategories: { [subKey]: { title, questions: [{ text, options[], correct }] } } } }`. Loaded via `fetch('questions.json', { cache: 'no-store' })` independently by each page that needs it (`subCategoryPage.js`, `questPageTrivia.js`, `duelSetup.js`, and `HomePageTrivia.js`'s quick-game picker) — there's no shared in-memory cache across page loads since each page is a fresh document.

### Shared non-repeating question queue

Both solo play (`pickNextOrResetIndex()` in `questPageTrivia.js`) and duel room creation (`drawDuelQuestionIndices()` in `duel.js`) draw from the **same** shuffled-index pool per category/sub-category, persisted to `localStorage` under `triviaQueue::<category>::<subCategory>` as `{ total, queue }`. This keeps a player from seeing the same question twice in a row whether they're playing solo or in a duel, and reshuffles once the pool is exhausted.

### Timers and scoring (`questPageTrivia.js`)

Two independent timers run per solo round: a per-question timer (`QUESTION_TIME`, from the user's speed setting: 20/15/5s) and a fixed 90s global round timer (`GLOBAL_TIME`, unaffected by settings). Correct answers score via `SCORE_TIERS` — points decrease the longer the player takes to answer (15/12/10/7 pts at ≤4/8/14/20s). Duel mode (`duelPageTrivia.js`) uses its own fixed, settings-independent 15s per-question timer (`DUEL_QUESTION_TIME`) so both players face identical conditions.

### Duel (head-to-head) data model — Firestore

- One document per match: `duels/{roomCode}` (5-char code, e.g. `ABCDE`, is the doc ID). `players` is a map keyed by Firebase Auth `uid` (not a subcollection), so a match is one read/listener.
- Room lifecycle: `status` is `waiting` → `active` → `finished`. `createDuelRoom()` / `joinDuelRoom()` / `advanceDuelIfReady()` all use Firestore transactions to handle concurrent joins/advances safely.
- Quick Match (`findAndJoinQuickMatch()`): queries for an open `waiting` room matching category+subCategory; joins it if found, otherwise creates a new room. There is intentionally no manual create-room/join-by-code UI — that flow was built and then removed in favor of quick match only.
- Players are authenticated via **Firebase Anonymous Auth** (`ensurePlayerAuth()` in `playerProfile.js`) purely to get a stable `uid` for Firestore security rules — it's silent, with no sign-in UI, and doesn't change the no-signup UX.
- `expiresAt` (~24h from creation) is stored on each room but **no Firestore TTL policy is configured** — treat it as inert metadata; stale room cleanup is manual via the Firebase Console.
- **Firestore security rules live only in the Firebase Console, not in this repo** (no `firestore.rules` file). Rules gate `duels` reads to participants (or anyone while `waiting`, so matchmaking works) and scope writes so each player can only touch their own `players.<uid>` subtree, with a per-question score cap (+15) to block score injection. Any change to the duel data shape must be paired with a manual rules update in the Console.

### Leaderboard

Two Firestore collections: `leaderboard` (solo) and `duelLeaderboard`, both written via `addLeaderboardEntry()` in `leaderboard.js`. One doc per player (`playerId` as doc ID), updated transactionally to keep only the player's best score. Rank is computed by counting docs with a strictly higher score.

### Sound & music (`soundEffects.js`)

Most one-shot SFX (ticks, correct/wrong answer, button taps) are synthesized on the fly with Web Audio oscillators — no audio files. Background music and the two result-screen stingers are the exception: they play real `.mp3` files from the `sounds/` folder (not yet committed as of 2026-08) via plain `new Audio(...)` elements, not the oscillator engine:

- **Background music** — `startBackgroundMusic()` / `stopBackgroundMusic()` loop `sounds/prettyjohn1-soft-499242.mp3` through a `MediaElementSource` → `GainNode` (so the existing fade-out and the `backgroundMusic` settings toggle still work); playback spans exactly the round's global timer, started/stopped alongside `startGlobalTimer()`/`stopGlobalTimer()` in the page controllers.
- **Result stingers** (`resultPage.js`) — after a solo round, `sounds/driken5482-applause-cheer-236786.mp3` plays if `result.accuracyRatio >= 0.8`, otherwise `sounds/soundreality-downfall-3-208028.mp3` plays, ~400ms after the result screen animates in (alongside the balloon celebration, when shown).

### Settings modal is shared across pages

`TriviaSettings.js`/`TriviaSettings.css` (the settings modal, gear icon, and its `.settings-gear-button` style) are no longer home-page-only — `questPageTrivia.html` and `duelPageTrivia.html` also load `TriviaSettings.css` and render a `#settingsButton`, so players can toggle sound/haptics/theme mid-round instead of only from the home screen. Opening/closing the modal dispatches global `triviaSettingsOpened` / `triviaSettingsClosed` `CustomEvent`s on `window`; `questPageTrivia.js` and `duelPageTrivia.js` listen for `triviaSettingsClosed` to resume their timers (mirroring how the existing score-info modal already paused/resumed them), so the shared `TriviaSettings.js` stays unaware of any page-specific timer logic. The score-info button (`.score-info-button`, the "?" icon) was moved from an absolutely-positioned spot inside the header to `position: fixed; top: 64px; right: 16px` (directly under the player badge) to avoid colliding with the gear icon at `top: 16px; left: 16px`.

### Tablet breakpoints (iPad mini/Air and iPad Pro)

The layout was built mobile-first with no upper bound (`width: 100vw`, and per-element `max-width: 420px` throughout `questPageTrivia.css`), so on tablet-width viewports it rendered as a small phone layout floating in the middle of a mostly-empty page. `HomePageTrivia.css` and `questPageTrivia.css` (shared by the duel screen) now add two media-query tiers that widen the shared max-widths and scale up typography/spacing/icon sizes:

- `@media (min-width: 700px)` — iPad mini/Air-class widths.
- `@media (min-width: 1000px)` — iPad Pro-class widths, scaled up again on top of the 700px tier.

`HomePageTrivia.css`'s `.home-screen` is also capped at a `max-width` and centered (`margin: 0 auto`) with `justify-content: center`, so on very tall/wide viewports the panel no longer stretches full-bleed or leaves a large empty gap below the content. Below 700px, nothing changes from the original mobile layout.

### Home screen fits one screen on iPhone 16 Pro Max (no scroll)

`HomePageTrivia.css`'s mobile (base, <700px) spacing — `.home-screen` padding/gap, `.app-title`/`.app-subtitle` sizing, and `.category-card` padding — was tuned in 2026-08 so the whole home screen (title, subtitle, 3 pill buttons, 4 category cards) fits on iPhone 16 Pro Max without vertical scrolling. Verified via Playwright at 430×932 and a conservative 430×786 (approximating Safari with an expanded toolbar).

**Constraint:** `#settingsButton` and `#homePlayerBadgeContainer` are `position: fixed; top: 16px`, shared across `index.html`, `questPageTrivia.html`, and `duelPageTrivia.html`. `.app-title` is `text-align: left` with a full-width box, so its left portion sits directly under the gear icon (bottom edge ~56px from viewport top) — cutting `app-title`'s `margin-top` too low makes the fixed gear button visually overlap the title. Current mobile value is `margin-top: 40px` (a deliberately thin ~2px safety margin below the gear icon). The `700px`/`1000px` tablet tiers already override `app-title margin-top` explicitly (56px/64px) and are unaffected by mobile-tier changes — any future adjustment to mobile spacing here must re-check title-vs-gear overlap, not just whether total content height fits the viewport.

**Testing note:** plain F12 DevTools (without Device Toolbar / Ctrl+Shift+M device emulation) renders at the desktop browser window's actual height, not an iPhone-sized viewport — since `.home-screen` centers shorter content via `justify-content: center`, this produces a large, expected empty gap above/below the content on desktop that does not appear on a real device. Use Device Toolbar with the target device selected to test this layout accurately.

As of 2026-08-05, `.category-card` mobile padding is `16px 14px` (grown from `11px 14px`, card height 69px → 79px) for a larger tap target, while still fitting without scrolling (content height 647px, ~99px of slack at the 786px conservative viewport).

### Typeface

The UI font is **Rubik** (Google Fonts), loaded per-page via `<link>` tags in each HTML file's `<head>` (no self-hosting, no `@font-face`) and referenced as `font-family: 'Rubik', 'Segoe UI', Arial, sans-serif` in each page's CSS. Since there's no shared head/layout file, changing the font means updating the Google Fonts `<link>` in every page HTML plus the `font-family` rule in every page CSS individually.

### Design handoff folders

`design_handoff_*/` directories are static mockup exports (self-contained HTML) used for design handoff/reference — not part of the running app.
