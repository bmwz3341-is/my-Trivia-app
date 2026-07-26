# Handoff: מסך תת-קטגוריה — "פזורת פוקר בצבעי מסך הבית" (9a)

## Overview
מסך תת-קטגוריה (מוצג בלחיצה על כרטיסיית קטגוריה מהמסך הראשי) — מציג את שם הקטגוריה, פזורת קלפי פוקר מבולגנת (3 קלפי רקע צבעוניים + קלף ראשי לבן) עם רשימת תת-הקטגוריות בתוך הקלף הראשי.

## About the Design Files
קובץ ה-HTML המצורף הוא **הפניית עיצוב (design reference)** — פרוטוטייפ שמראה מראה והתנהגות מיועדים, לא קוד פרודקשן להעתקה ישירה. יש **לשחזר את העיצוב הזה** בסביבת הפיתוח הקיימת (React / Vue / native) לפי הדפוסים הקיימים בקוד.

## Fidelity
**High-fidelity (hifi)** — צבעים, מרווחים וזוויות סופיים.

## Screen: Sub-Category (Card Spread)

### Layout
- קונטיינר: `border-radius:24px; padding:36px 22px; display:flex; flex-direction:column; align-items:center; gap:18px`
- קלף ראשי + 3 קלפי רקע מסודרים ב-`position:relative` container, כל קלף `position:absolute; inset:0`
- יחס גובה-רוחב לקלפים: `aspect-ratio: 5/7`

### Background (container)
```css
background: linear-gradient(160deg, #FF3D81, #6C2BD9);
box-shadow: 0 20px 50px -20px rgba(0,0,0,0.5);
```

### Card spread (behind → front)
1. קלף אחורי 1: `background:#22D3EE; border-radius:16px; transform: rotate(18deg) translate(16px,-8px); box-shadow:0 12px 24px -14px rgba(0,0,0,0.5)`
2. קלף אחורי 2: `background:#6C2BD9; border-radius:16px; transform: rotate(-12deg) translate(-16px,8px); box-shadow:0 12px 24px -14px rgba(0,0,0,0.5)`
3. קלף אחורי 3: `background:#F5EF1E; border-radius:16px; transform: rotate(5deg) translate(4px,4px); box-shadow:0 12px 24px -14px rgba(0,0,0,0.5)`
4. **קלף ראשי (עליון)**: `background:#FFFFFF; border-radius:16px; transform: rotate(2deg); box-shadow:0 18px 40px -16px rgba(0,0,0,0.6); padding:16px`

### Main card content
- Corner rank/suit indicator (top-right): `color:#6C2BD9; font-weight:900; font-size:20px` — rank "J" + suit "♥" (14px) stacked
- Title (category name): `color:#141110; font-size:16px; font-weight:900; text-align:center`
- Sub-category rows (4), each:
  - `display:flex; justify-content:space-between; border-bottom:1.5px solid #6C2BD9; padding:6px 2px` (last row: no border)
  - Label: `font-weight:700; font-size:13px; color:#141110`
  - Count badge: `color:#FF3D81; font-weight:800; font-size:11px`
- Caption below the card stack: `color:rgba(255,255,255,0.75); font-size:12px` — "בחרו תת-קטגוריה כדי להתחיל"

## Typography
- Font family: `'Heebo', sans-serif` (weights 700/800/900)
- RTL, Hebrew

## Design Tokens (exact colors)
| Token | Hex |
|---|---|
| Background gradient start | `#FF3D81` |
| Background gradient end | `#6C2BD9` |
| Back card — cyan | `#22D3EE` |
| Back card — purple | `#6C2BD9` |
| Back card — yellow | `#F5EF1E` |
| Main card bg | `#FFFFFF` |
| Main card text (title/labels) | `#141110` |
| Corner rank/suit color | `#6C2BD9` |
| Row divider | `#6C2BD9` |
| Count badge text | `#FF3D81` |
| Caption text | `rgba(255,255,255,0.75)` |

## Interactions
- Each sub-category row: click → navigate to question screen for that sub-category, passing its question count
- Card stack is decorative/static (no interaction on the back cards)
- Optional: subtle hover lift (`translateY(-2px)`) on sub-category rows

## Files
- `subcategory-9a.html` — static HTML/CSS reference of this exact screen
