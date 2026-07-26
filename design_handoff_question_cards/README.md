# Handoff: מסך שאלה — "ערימת קלפים בצבעי הבית" (2 גרסאות: 2 תשובות / 4 תשובות)

## Overview
מסך שאלה של אפליקציית טריוויה — כותרת קטגוריה, ניקוד, טיימר עגול, פס התקדמות, שאלה בתוך ערימת קלפים מבולגנת (2 קלפי רקע + קלף ראשי). **שתי גרסאות תוכן**, אותו עיצוב בסיס:
- **11d — הבסיס** — שאלה עם 4 אפשרויות תשובה (4 כפתורים בעמודה אחת, רוחב מלא)
- **11c — וריאציה** — שאלת נכון/לא נכון (2 כפתורי תשובה בלבד)

### ⚠️ הנחיה חשובה למימוש: 11d הוא הבסיס, 11c הוא רק שינוי בפריסת הכפתורים
**11d הוא רכיב הבסיס של העיצוב.** כל שאר המסך — רקע, כותרת קטגוריה, ניקוד, טיימר עגול, פס התקדמות, ערימת הקלפים והשאלה עצמה — **זהה לחלוטין** בין שתי הגרסאות, בלי שום שינוי בצבעים, במרווחים או בזוויות.

ה**הבדל היחיד** בין 11d ל-11c הוא **אופן פריסת כפתורי התשובה בתחתית הכרטיס בלבד**:
- ב-11d (4 תשובות): הכפתורים מסודרים בעמודה אחת (`flex-direction:column`), 4 כפתורים ברוחב מלא, כולם באותו סגנון "לא נבחר" (`rgba(255,255,255,0.14)` + מסגרת `rgba(255,255,255,0.35)`) עד שנבחרת תשובה — ואז הנכונה מודגשת בתכלת `#22D3EE`.
- ב-11c (2 תשובות: נכון/לא נכון): הכפתורים מסודרים ב-grid של שתי עמודות זו-לצד-זו (`grid-template-columns:1fr 1fr`), כפתור "לא נכון" קבוע בסגנון אדום/שקוף עמום, וכפתור "נכון" קבוע בתכלת `#22D3EE`.

**המשמעות למימוש בקוד:** יש לבנות רכיב שאלה אחד ("QuestionCard") שמקבל את מספר האפשרויות כפרמטר/מ-array של תשובות, ולפי האורך שלו (2 או 4) לבחור את פריסת הכפתורים המתאימה — אך את שאר הרכיב (הרקע, הכותרת, הטיימר, פס ההתקדמות וערימת הקלפים) לבנות **פעם אחת בלבד ולשתף בין שני מצבי השאלה**, לא כשני רכיבים נפרדים.

## About the Design Files
קבצי ה-HTML המצורפים הם **הפניות עיצוב (design references)** — פרוטוטייפים, לא קוד פרודקשן להעתקה ישירה. יש **לשחזר את העיצוב** בסביבת הפיתוח הקיימת (React/Vue/native) לפי הדפוסים הקיימים בקוד, ולשמר את כל הלוגיקה הפונקציונלית (טיימר אמיתי, ניקוד, מעבר שאלות, תמיכה בשני מספרי-תשובות).

## Fidelity
**High-fidelity (hifi)** — צבעים, מרווחים וזוויות סופיים.

## Shared Layout & Background
קונטיינר: `border-radius:20px; padding:20px; display:flex; flex-direction:column; gap:16px`
```css
background: linear-gradient(160deg, #FF3D81, #6C2BD9);
box-shadow: 0 20px 50px -20px rgba(0,0,0,0.5);
```

### Header row
`display:flex; justify-content:space-between; align-items:center`
- ניקוד: `background:#F5EF1E; color:#141110; font-weight:900; font-size:14px; padding:8px 16px; border-radius:14px` — לדוגמה "15 נק'"
- שם קטגוריה + אייקון: `color:#fff; font-weight:800; font-size:15px` + badge `background:#141110; color:#fff; font-size:16px; padding:6px 10px; border-radius:999px` (🤖)

### Timer (circular)
```css
width:82px; height:82px; border-radius:50%;
background: conic-gradient(#22D3EE 300deg, rgba(0,0,0,0.25) 0deg); /* 300deg = מייצג את שבריר הזמן שנותר */
/* עיגול פנימי */
width:66px; height:66px; border-radius:50%; background:#6C2BD9;
color:#fff; font-weight:900; font-size:24px; /* לדוגמה "1:22" */
```

### Progress bar
```css
height:6px; background:rgba(0,0,0,0.25); border-radius:6px; overflow:hidden;
/* fill */
width: <percent>%; height:100%; background:#22D3EE;
```

### Card stack (behind → front)
1. קלף אחורי 1: `background:#141110; border-radius:16px; transform: rotate(-6deg) / rotate(-9deg); box-shadow:0 10px 20px -12px rgba(0,0,0,0.5)`
2. קלף אחורי 2: `background:#F5EF1E; border-radius:16px; transform: rotate(5deg) / rotate(7deg); box-shadow:0 10px 20px -12px rgba(0,0,0,0.5)`
3. **קלף ראשי**: `background:#FFFFFF; border-radius:16px; box-shadow:0 18px 40px -16px rgba(0,0,0,0.6); padding:20px`
   - שאלה: `color:#141110; font-size:16px; font-weight:800; line-height:1.5; text-align:center`
   - אינדיקטור זמן קריאה (⏱ + מספר): `color:#6C2BD9; font-size:12px; font-weight:700`

## Variant A — 2 Answers (11c)
Grid `1fr 1fr`, gap:12px, aspect-ratio:5/6 על ערימת הקלפים:
- **לא נכון**: `background:rgba(255,255,255,0.14); border:2px solid rgba(255,255,255,0.35); color:#fff; font-weight:800; font-size:14px; padding:16px; border-radius:14px; text-align:center`
- **נכון**: `background:#22D3EE; color:#141110; font-weight:800; font-size:14px; padding:16px; border-radius:14px; text-align:center`

## Variant B — 4 Answers (11d)
עמודה יחידה (`display:flex; flex-direction:column; gap:10px`), כל כפתור ברוחב מלא, טקסט מיושר במרכז:
- כפתורים לא-נבחרים (ברירת מחדל): `background:rgba(255,255,255,0.14); border:2px solid rgba(255,255,255,0.35); color:#fff; font-weight:800; font-size:14px; padding:14px; border-radius:14px; text-align:center`
- כפתור נכון (מודגש/נבחר, לדוגמה לאחר בחירה נכונה): `background:#22D3EE; color:#141110; font-weight:800; font-size:14px; padding:14px; border-radius:14px; text-align:center`
- הערה: לפני שהמשתמש עונה כל 4 הכפתורים נראים כמו "לא נבחר"; לאחר בחירה — התשובה הנכונה מודגשת ב-`#22D3EE`, ותשובה שגויה שנבחרה יכולה להיות מודגשת באדום/כתום מתאים (למשל `background:#C0272D`)

## Typography
Font family: `'Heebo', sans-serif` (weights 700–900). RTL, Hebrew.

## Design Tokens (exact colors, shared across both variants)
| Token | Hex |
|---|---|
| Background gradient start | `#FF3D81` |
| Background gradient end | `#6C2BD9` |
| Score badge bg | `#F5EF1E` |
| Score badge text | `#141110` |
| Category icon badge bg | `#141110` |
| Timer ring active | `#22D3EE` |
| Timer ring track | `rgba(0,0,0,0.25)` |
| Timer inner circle | `#6C2BD9` |
| Progress bar fill | `#22D3EE` |
| Back card 1 | `#141110` |
| Back card 2 | `#F5EF1E` |
| Main card bg | `#FFFFFF` |
| Question text | `#141110` |
| Reading-time indicator text | `#6C2BD9` |
| Unselected answer bg | `rgba(255,255,255,0.14)` |
| Unselected answer border | `rgba(255,255,255,0.35)` |
| Correct answer bg | `#22D3EE` |
| Correct answer text | `#141110` |
| Incorrect-selected bg (suggested) | `#C0272D` |

## Interactions & Behavior (preserve existing logic)
- Timer counts down in real time; ring depletes proportionally; low-time pulse animation
- Score updates live with speed bonus for fast correct answers
- Component must support BOTH 2-answer and 4-answer question data (render answer count dynamically from the question's options array)
- Selecting an answer locks input, reveals correct/incorrect state, advances to next question after a short delay
- Progress bar reflects question index / total questions
- Category name + icon persist across all questions in the round

## Files
- `question-11c-2answers.html` — static reference, 2-answer variant
- `question-11d-4answers.html` — static reference, 4-answer variant
