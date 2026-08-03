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

### Typeface

The UI font is **Rubik** (Google Fonts), loaded per-page via `<link>` tags in each HTML file's `<head>` (no self-hosting, no `@font-face`) and referenced as `font-family: 'Rubik', 'Segoe UI', Arial, sans-serif` in each page's CSS. Since there's no shared head/layout file, changing the font means updating the Google Fonts `<link>` in every page HTML plus the `font-family` rule in every page CSS individually.

### Design handoff folders

`design_handoff_*/` directories are static mockup exports (self-contained HTML) used for design handoff/reference — not part of the running app.
