# Handoff: לוח תוצאות — "ערימת קלפים בצבעי הבית" (12c)

## Overview
מסך לוח תוצאות (מוצג בסיום סבב שאלות) — כרטיס סיכום תוצאות בתוך ערימת קלפים מבולגנת (סיכום ניקוד, פירוט תשובות, מיקום, כפתורי CTA) ומתחתיו לוח תוצאות גלובלי עם טאבים ורשימת דירוג.

## About the Design Files
קובץ ה-HTML המצורף הוא **הפניית עיצוב (design reference)** — פרוטוטייפ שמראה מראה והתנהגות מיועדים, לא קוד פרודקשן להעתקה ישירה. יש **לשחזר את העיצוב** בסביבת הפיתוח הקיימת (React/Vue/native) לפי הדפוסים הקיימים בקוד, ולשמר את כל הלוגיקה הפונקציונלית הקיימת (חישוב ניקוד, פירוט תשובות אמיתי, החלפת טאב כללי/ראש-בראש, רשימת דירוג דינמית).

## Fidelity
**High-fidelity (hifi)** — צבעים, מרווחים וזוויות סופיים.

## Screen: Results (Card Stack)

### Layout
קונטיינר: `border-radius:20px; padding:20px; display:flex; flex-direction:column; gap:16px`

### Background
```css
background: linear-gradient(160deg, #FF3D81, #6C2BD9);
box-shadow: 0 20px 50px -20px rgba(0,0,0,0.5);
```

### Header
- Opponent/mode chip (top, aligned end): `background:#141110; color:#22D3EE; font-size:12px; font-weight:700; padding:6px 12px; border-radius:999px` — "מחשב 🤖"

### Card stack (behind → front)
1. קלף אחורי 1: `background:#141110; border-radius:18px; transform: rotate(-6deg); top offset ~6px; box-shadow:0 10px 20px -12px rgba(0,0,0,0.5)`
2. קלף אחורי 2: `background:#F5EF1E; border-radius:18px; transform: rotate(5deg); top offset ~3px; box-shadow:0 10px 20px -12px rgba(0,0,0,0.5)`
3. **קלף ראשי**: `background:#FFFFFF; border-radius:18px; padding:20px 16px; box-shadow:0 18px 40px -16px rgba(0,0,0,0.6)`

### Main card content (top → bottom)
- כותרת: "עניתם על כל השאלות!" — `color:#6C2BD9; font-size:19px; font-weight:900; text-align:center`
- Opponent chip (מרכזי): `background:#6C2BD9; color:#fff; font-weight:800; font-size:13px; padding:8px 20px; border-radius:999px` — "🤖 מחשב"
- סיכום ניקוד: `color:#141110; font-weight:800; font-size:15px; text-align:center` — "צברתם X נקודות"
- תת-כותרת דיוק: `color:#6B5541; font-size:12px; text-align:center` — "הצלחתם לענות נכון על Y מתוך Z שאלות שנענו"
- **רשימת שאלות** (per question row): `display:flex; justify-content:space-between; align-items:center; background:#F5EFDF; border-radius:10px; padding:10px 12px`
  - טקסט שאלה: `font-size:12px; color:#141110; font-weight:700`
  - סימן תשובה שגויה: `color:#FF3D81; font-weight:900` — "✕"
  - סימן תשובה נכונה: `color:#3FAE6B; font-weight:900` — "✓"
- מיקום בלוח: `color:#6B5541; font-size:11px; text-align:center` — "המיקום שלכם בלוח התוצאות: #N מתוך M"
- **CTA ראשי — "שחקו שוב"**: `background:#22D3EE; color:#141110; font-weight:900; font-size:15px; padding:14px; border-radius:14px; text-align:center; box-shadow:0 4px 0 #0F9BAA`
- **CTA משני — "חזרה למסך הבית"**: `background:transparent; border:2px solid #6C2BD9; color:#6C2BD9; font-weight:800; font-size:14px; padding:12px; border-radius:14px; text-align:center`

### Below the card stack: Global Leaderboard
- כותרת: "לוח תוצאות גלובלי" — `color:#fff; font-size:17px; font-weight:900; text-align:center; margin-top:22px`
- **טאבים** (2, side by side, gap:10px):
  - טאב פעיל ("קרב ראש-בראש"): `background:#F5EF1E; color:#141110; font-weight:800; font-size:13px; padding:10px; border-radius:12px; text-align:center`
  - טאב לא-פעיל ("כללי"): `background:transparent; border:1px solid rgba(255,255,255,0.4); color:#fff; font-weight:800; font-size:13px; padding:10px; border-radius:12px; text-align:center`
- **שורות דירוג** (repeat per player): `display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.14); border-radius:14px; padding:10px 14px`
  - ניקוד: `color:#F5EF1E; font-weight:900; font-size:14px; min-width:56px` — "184 נק'"
  - שם: `color:#fff; font-weight:700; font-size:14px; flex:1`
  - דירוג: `color:rgba(255,255,255,0.6); font-size:12px` — "#1"

## Typography
Font family: `'Heebo', sans-serif` (weights 700–900). RTL, Hebrew.

## Design Tokens (exact colors)
| Token | Hex / value |
|---|---|
| Background gradient start | `#FF3D81` |
| Background gradient end | `#6C2BD9` |
| Opponent chip (top) bg | `#141110` |
| Opponent chip (top) text | `#22D3EE` |
| Back card 1 | `#141110` |
| Back card 2 | `#F5EF1E` |
| Main card bg | `#FFFFFF` |
| Title text | `#6C2BD9` |
| Opponent chip (in-card) bg | `#6C2BD9` |
| Score summary text | `#141110` |
| Accuracy subtitle text | `#6B5541` |
| Question row bg | `#F5EFDF` |
| Question row text | `#141110` |
| Wrong-answer mark | `#FF3D81` |
| Correct-answer mark | `#3FAE6B` |
| Rank note text | `#6B5541` |
| Primary CTA bg | `#22D3EE` |
| Primary CTA text | `#141110` |
| Primary CTA shadow | `#0F9BAA` |
| Secondary CTA border/text | `#6C2BD9` |
| Leaderboard heading text | `#FFFFFF` |
| Active tab bg | `#F5EF1E` |
| Active tab text | `#141110` |
| Inactive tab border | `rgba(255,255,255,0.4)` |
| Inactive tab text | `#FFFFFF` |
| Leaderboard row bg | `rgba(255,255,255,0.14)` |
| Leaderboard row score text | `#F5EF1E` |
| Leaderboard row name text | `#FFFFFF` |
| Leaderboard row rank text | `rgba(255,255,255,0.6)` |

## Interactions & Behavior (preserve existing logic)
- Score, accuracy, and question-by-question review reflect the actual completed round
- "שחקו שוב" restarts the same category/mode; "חזרה למסך הבית" navigates to Home
- Leaderboard tabs switch between "ראש-בראש" (head-to-head) and "כללי" (global) rankings — live data
- Leaderboard list scrolls/paginates if there are more players than fit

## Files
- `results-12c.html` — static HTML/CSS reference of this exact screen
