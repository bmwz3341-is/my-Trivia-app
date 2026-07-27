# Handoff: קרב ראש-בראש — בחירת תת-קטגוריה — "קלפים בתוך קופסה" (14b)

## Overview
מסך בחירת תת-קטגוריה במוד "קרב ראש-בראש" (אחרי בחירת הקטגוריה הראשית) — תתי-הקטגוריות מוצגים כערמת קלפים בתוך קופסה כהה, כל קלף כולל את שם תת-הקטגוריה ומספר השאלות בה. אותה פונקציונליות בדיוק: כותרת, תת-כותרת, ובחירת אחת מהתתי-קטגוריות מובילה למסך השאלה.

## About the Design Files
קובץ ה-HTML המצורף הוא **הפניית עיצוב (design reference)** — פרוטוטייפ שמראה מראה והתנהגות מיועדים, לא קוד פרודקשן להעתקה ישירה. יש **לשחזר את העיצוב** בסביבת הפיתוח הקיימת (React/Vue/native) לפי הדפוסים הקיימים בקוד, ולשמר את כל הלוגיקה הפונקציונלית הקיימת (רשימת תתי-הקטגוריות בפועל לכל קטגוריה, מספרי השאלות האמיתיים, ניווט למסך השאלה במוד קרב ראש-בראש).

## Fidelity
**High-fidelity (hifi)** — צבעים, מרווחים וזוויות סופיים.

## Screen: Head-to-Head Sub-Category Select (Cards in a Box)

### Layout
קונטיינר עליון: `border-radius:24px; padding:28px 20px; display:flex; flex-direction:column; align-items:center; gap:6px`

### Background
```css
background: linear-gradient(160deg, #FF3D81, #6C2BD9);
box-shadow: 0 20px 50px -20px rgba(0,0,0,0.5);
```

### Header
- כותרת: "קרב ראש-בראש" — `color:#fff; font-size:22px; font-weight:900; text-align:center`
- תת-כותרת: "בחר תת-קטגוריה" — `color:rgba(255,255,255,0.85); font-size:13px; font-weight:600; text-align:center`

### The Box
זהה במבנה לחבילת ה-handoff הקודמת (13b — בחירת קטגוריה ראשית):
```css
position: relative;
background: #141110;
border-radius: 18px;
padding: 22px 14px 18px;
box-shadow: 0 20px 40px -18px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.08);
display: flex;
flex-direction: column;
gap: 10px;
```
- "שוליים" עליון: `position:absolute; left:14px; right:14px; top:-10px; height:20px; background:#0A0808; border-radius:10px 10px 0 0`
- צל תחתון (עומק): `width:70%; height:14px; background:radial-gradient(ellipse, rgba(0,0,0,0.35), transparent 70%); margin-top:-4px`

### Sub-category cards (4, stacked inside the box)
כל קלף = כרטיס לחיצה מלא (כפתור תת-קטגוריה), עם תג דרגה+סימן פוקר בפינה ושם + מספר שאלות באותה שורה:
```css
border-radius: 12px;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 12px;
box-shadow: 0 6px 14px -8px rgba(0,0,0,0.5);
cursor: pointer;
```
1. **מדע · 200 שאלות** — `background:#6A3FB5`, טקסט `#fff`, תג "Q♣"
2. **טכנולוגיה · 80 שאלות** — `background:#3FAE6B`, טקסט `#fff`, תג "K♦"
3. **ספרות · 100 שאלות** — `background:#F5EF1E`, טקסט `#141110`, תג "J♠"
4. **אמנות · 2 שאלות** — `background:#fff`, טקסט `#141110`, תג "A♥" בצבע `#FF3D81`

טקסט (שם + ספירת שאלות באותה שורה, מופרד ב-"·"): `font-weight:800; font-size:14px; flex:1`
תג דרגה/סימן: `font-weight:900; font-size:16px; line-height:0.9` (הסימן עצמו `font-size:11px`)

## Interaction: press / click animation
בלחיצה על קלף כלשהו הוא מתכווץ קלות ומקבל הילה כחולה — פידבק מיידי לפני הניווט:
```css
transition: transform .12s ease, box-shadow .12s ease;
```
מצב לחיצה:
```css
transform: scale(0.96);
box-shadow: 0 0 0 3px #22D3EE, 0 2px 8px -4px rgba(0,0,0,0.5);
```

## Typography
Font family: `'Heebo', sans-serif` (weights 700–900). RTL, Hebrew.

## Design Tokens (exact colors)
| Token | Hex / value |
|---|---|
| Background gradient start | `#FF3D81` |
| Background gradient end | `#6C2BD9` |
| Box background | `#141110` |
| Box top-edge accent | `#0A0808` |
| Press-state glow | `#22D3EE` |
| Card 1 — מדע | `#6A3FB5` |
| Card 2 — טכנולוגיה | `#3FAE6B` |
| Card 3 — ספרות | `#F5EF1E` |
| Card 4 — אמנות | `#FFFFFF` |
| Card 4 accent (A♥) | `#FF3D81` |
| Header title text | `#FFFFFF` |
| Header subtitle text | `rgba(255,255,255,0.85)` |

## Interactions & Behavior (preserve existing logic)
- כל קלף = פעולת בחירת תת-קטגוריה (equivalent to the flat list's row tap) — מוביל למסך השאלה הראשונה בתת-הקטגוריה הנבחרת, במוד "קרב ראש-בראש"
- קלף בלחיצה: אנימציית כיווץ + הילה כחולה (ראו סעיף Interaction למעלה)
- תתי-הקטגוריות, השמות ומספרי השאלות נשארים דינמיים/מהמקור לפי הקטגוריה הראשית שנבחרה — כאן רק העיצוב הוחלף
- ניתן להרחיב לגלילה אם יתווספו יותר מ-4 תתי-קטגוריות

## Files
- `h2h-subcategory-14b.html` — static HTML/CSS reference of this exact screen (עם הדגמת אנימציית לחיצה ב-CSS `:active`)
