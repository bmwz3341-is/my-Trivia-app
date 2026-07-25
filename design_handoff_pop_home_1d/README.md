# Handoff: מסך הבית — סגנון "פופ בהיר ואנרגטי" (1d)

## Overview
מסך הבית (Home) של אפליקציית טריוויה "Trivia" — כותרת, תיאור, 3 כפתורי CTA (אתגר מהיר, קרב מול משתמש, לוח תוצאות) ו-4 כרטיסי קטגוריה. עיצוב RTL (עברית).

## About the Design Files
הקבצים בחבילה זו הם **הפניות עיצוב (design references) שנוצרו ב-HTML** — פרוטוטייפים המציגים מראה והתנהגות מיועדים, לא קוד פרודקשן להעתקה ישירה. המשימה היא **לשחזר את העיצוב הזה בסביבת הפיתוח הקיימת** (React / Vue / native וכו') לפי הדפוסים והספריות שכבר קיימים בקוד — או, אם אין סביבה קיימת, לבחור את הפריימוורק המתאים ביותר.

## Fidelity
**High-fidelity (hifi)** — צבעים, מרווחים וטיפוגרפיה סופיים. יש לשחזר פיקסל-מדויק.

## Screen: Home

### Layout
- קונטיינר יחיד, `border-radius: 32px`, `padding: 28px 22px`, `display:flex; flex-direction:column; gap:20px`
- כיוון RTL, `direction: rtl`
- רוחב מומלץ למובייל: 380–420px (יחסי, לא קבוע ליישום אמיתי — יש להתאים ל-responsive)

### Background
```css
background: linear-gradient(160deg, #FF3D81, #6C2BD9);
box-shadow: 0 20px 50px -20px rgba(0,0,0,0.5);
```

### Header
- לוגו "Trivia": `font-weight:900; font-size:34px; color:#FFFFFF`
- כפתור "מחשב" (indicator, top-left): `background:#141110; color:#22D3EE; font-size:12px; font-weight:700; padding:8px 14px; border-radius:999px`
- Header row: `display:flex; justify-content:space-between; align-items:center`

### Description text
`color:#FFFFFF; opacity:0.92; font-size:14px; line-height:1.7; font-weight:500; text-align:center`

### CTA Buttons (stacked, gap:10px)
1. **אתגר מהיר · 8 שאלות** (primary):
```css
background:#22D3EE; color:#141110; font-weight:900; font-size:15px;
padding:14px 16px; border-radius:999px; text-align:center;
box-shadow:0 5px 0 #0F9BAA;
```
2. **קרב מול משתמש** (secondary/outline):
```css
background:transparent; border:2px solid rgba(255,255,255,0.55);
color:#FFFFFF; font-weight:700; font-size:14px; padding:12px 16px; border-radius:999px;
```
3. **לוח תוצאות 🏆** (secondary/outline — same style as #2):
```css
background:transparent; border:2px solid rgba(255,255,255,0.55);
color:#FFFFFF; font-weight:700; font-size:14px; padding:12px 16px; border-radius:999px;
```

### Category cards (stacked, gap:12px; each card: border-radius:20px; padding:16px; box-shadow:0 8px 20px -10px rgba(0,0,0,0.4))

1. **ידע כללי וטריוויה רב-תחומית**
   - bg: `#6A3FB5`, title color: `#FFFFFF`, subtitle color: `rgba(255,255,255,0.75)`
   - subtitle: "מדע · טכנולוגיה · ספרות · אמנות"
   - progress bars: `#FFFFFF`, `rgba(255,255,255,0.5)`, `rgba(255,255,255,0.25)`

2. **אקטואליה ועולם**
   - bg: `#3FAE6B` (ירוק בהיר), title color: `#FFFFFF`, subtitle color: `rgba(255,255,255,0.75)`
   - subtitle: "גיאוגרפיה · פוליטיקה · היסטוריה"
   - progress bars: `#FFFFFF`, `rgba(255,255,255,0.5)`, `rgba(255,255,255,0.25)`

3. **תרבות פופ ונוסטלגיה**
   - bg: `#F5EF1E`, title color: `#141110`, subtitle color: `rgba(20,17,16,0.7)`
   - subtitle: "כדורגל · סרטים 80/90 · מוזיקה"
   - progress bars: `#141110`, `rgba(20,17,16,0.5)`, `rgba(20,17,16,0.25)`

4. **מותגי לייף-סטייל**
   - bg: `#FFFFFF`, title color: `#141110`, subtitle color: `rgba(20,17,16,0.7)`
   - subtitle: "אוכל · יין · רכב · אופנה"
   - progress bars: `#141110`, `rgba(20,17,16,0.5)`, `rgba(20,17,16,0.25)`

Each card title: `font-weight:900; font-size:15px`. Subtitle: `font-size:12px; margin-top:4px`. Progress bars: 3 segments, each `width:26px; height:5px; border-radius:4px`, `display:flex; gap:6px; margin-top:10px`.

## Typography
- Font family: `'Heebo', sans-serif` (Google Fonts — weights 400/500/700/800/900)
- All text right-to-left, Hebrew

## Design Tokens (exact colors used)
| Token | Hex / value |
|---|---|
| Gradient start | `#FF3D81` |
| Gradient end | `#6C2BD9` |
| Accent / primary CTA | `#22D3EE` |
| Primary CTA shadow | `#0F9BAA` |
| Header chip bg | `#141110` |
| Header chip text | `#22D3EE` |
| Card — general knowledge | `#6A3FB5` |
| Card — world affairs | `#3FAE6B` |
| Card — pop culture | `#F5EF1E` |
| Card — lifestyle | `#FFFFFF` |
| Dark text (on yellow/white cards) | `#141110` |
| White | `#FFFFFF` |

## Interactions & Behavior
- Category cards: click → navigate to that category's question screen
- "אתגר מהיר": click → start an 8-question mixed-category quick round
- "קרב מול משתמש": disabled/placeholder (coming soon)
- "לוח תוצאות": navigate to leaderboard/results screen
- Hover: subtle lift (`translateY(-2px)`) recommended on cards and buttons
- Active/press: buttons should compress slightly (translateY + reduced shadow) for a tactile feel

## Files
- `home-1d.html` — static HTML/CSS reference of this exact screen
