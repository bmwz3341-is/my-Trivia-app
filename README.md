# Tick Tock Trivia

אפליקציית טריוויה בעברית (RTL), רצה בדפדפן — **Vanilla JavaScript**, HTML ו-CSS בלבד. אין React/Vue/Angular ואין build step; כל עמוד הוא קובץ HTML עצמאי שטוען את קבצי ה-JS/CSS שלו ישירות בתגיות `<script>`/`<link>`.

## טכנולוגיה

- **JavaScript טהור (ES6)** — ללא פריימוורק, ללא bundler, ללא TypeScript.
- **Firebase** (תלות יחידה ב-`package.json`, גרסה `^12.16.0`) — Firestore לנתונים בזמן אמת (דו-קרב, לוח תוצאות) ו-Anonymous Auth לזיהוי שחקנים.
- **localStorage** — שמירת הגדרות, תור שאלות (כדי למנוע חזרה על שאלות), ותוצאות שיא מקומיות.
- **Google Fonts (Heebo)** — הפונט הראשי של הממשק.
- קובץ **`questions.json`** — מאגר שאלות טריוויה סטטי, מאורגן לפי קטגוריה → תת-קטגוריה → מערך שאלות.

## מבנה העמודים (HTML)

| קובץ | תפקיד |
|---|---|
| `index.html` | מסך הבית — בחירת קטגוריה, אתגר מהיר, קרב מול משתמש, לוח תוצאות |
| `subCategoryPage.html` | בחירת תת-קטגוריה בתוך קטגוריה |
| `questPageTrivia.html` | מסך השאלות עצמו (טיימר, תשובות, ניקוד) |
| `resultPage.html` | מסך תוצאה בסוף משחק יחיד |
| `duelPageTrivia.html` | מסך המשחק במצב דו-קרב (Head-to-Head) בזמן אמת |
| `duelResultPage.html` | מסך תוצאה בסוף דו-קרב |
| `leaderboardPage.html` | לוח תוצאות (רגיל ודו-קרב) |

לכל עמוד קובץ `.js` וקובץ `.css` תואמים באותו שם (לדוגמה `questPageTrivia.js` + `questPageTrivia.css`).

## מודולי JavaScript עיקריים

- **`firebaseConfig.js`** — אתחול חיבור Firebase (config + `initializeApp`).
- **`duel.js` / `duelSetup.js` / `duelPageTrivia.js` / `duelResultPage.js`** — לוגיקת מצב דו-קרב: יצירת חדר עם קוד בן 5 תווים, סנכרון שאלות משותף בין שני שחקנים דרך Firestore, TTL של 24 שעות לחדר.
- **`leaderboard.js` / `leaderboardPage.js`** — קריאה/כתיבה של תוצאות ל-Firestore (אוספי `leaderboard` ו-`duelLeaderboard`), חישוב דירוג בעזרת טרנזקציות.
- **`TriviaSettings.js`** — מסך הגדרות: אפקטי קול, מוזיקת רקע, רטט (haptics), משך טיימר, ערכת נושא (רגילה / AMOLED כהה), איפוס נתונים. נשמר ב-`localStorage`.
- **`playerProfile.js`** — ניהול פרופיל שחקן מקומי (שם, אווטאר).
- **`soundEffects.js`** — ניגון אפקטי קול במשחק.
- **`subCategoryPage.js` / `questPageTrivia.js` / `resultPage.js`** — לוגיקת מסך תת-קטגוריה, מסך השאלות (כולל תור שאלות לא-חוזרות לכל קטגוריה) ומסך התוצאה.

## זרימת משחק

- **בחירת קטגוריה** — לחיצה על כרטיס קטגוריה בעמוד הבית (אחרי יצירת/אישור פרופיל שחקן) פותחת את `subCategoryPage.html?category=<key>`, שם בוחרים תת-קטגוריה ועוברים ל-`questPageTrivia.html?category=<key>&sub=<subKey>&count=<n>`.
- **אתגר מהיר** (`quickGameButton`) — מדלג על שני שלבי הבחירה: בוחר קטגוריה ותת-קטגוריה אקראיות מתוך `questions.json` ומעביר ישירות ל-`questPageTrivia.html` עם אותם פרמטרים.
- **תור שאלות לא-חוזר** — לכל צירוף קטגוריה/תת-קטגוריה נשמר ב-`localStorage` (מפתח `triviaQueue::<category>::<subCategory>`) סדר שאלות מעורבב שלא חוזר על עצמו עד שכל השאלות נוצלו; אותו מפתח משותף גם למצב דו-קרב (`duel.js`).

## טיימרים וניקוד

במשחק יחיד (`questPageTrivia.js`) פועלים **שני טיימרים במקביל**:

- **טיימר שאלה** — משך משתנה לפי הגדרת "מהירות" ב-`TriviaSettings.js` (20/15/5 שניות: רגוע/רגיל/מהיר מאוד), עם מצב אזהרה כשנותרה מחצית מהזמן. שאלה שלא נענתה בזמן נספרת כתשובה שגויה.
- **טיימר גלובלי** — 90 שניות קבועות לכל הסבב (לא מושפע מהגדרת המהירות), מוצג כטבעת התקדמות (`globalTimerRing`) עם אזהרה ב-15 השניות האחרונות.

**הניקוד תלוי מהירות** (`SCORE_TIERS`) — ככל שעונים מהר יותר על תשובה נכונה, מקבלים יותר נקודות:

| זמן תגובה | נקודות |
|---|---|
| עד 4 שניות | 15 |
| עד 8 שניות | 12 |
| עד 14 שניות | 10 |
| עד 20 שניות | 7 |

במצב **דו-קרב** (`duelPageTrivia.js`) יש טיימר נפרד וקבוע — **15 שניות לשאלה**, אזהרה ב-8 השניות האחרונות — שאינו מושפע מהגדרות הטיימר האישיות, כדי לשמור על תנאים זהים לשני השחקנים.

## פרופיל שחקן ואווטארים

`playerProfile.js` שומר שם ומזהה שחקן (`playerId`) מקומית ב-`localStorage`, ומציע כ-30 אווטארים מוכנים מראש הנטענים דינמית מ-**DiceBear API** (`api.dicebear.com`, סגנונות: adventurer, bottts, pixel-art, avataaars ועוד). זו תלות חיצונית יחידה מלבד Firebase — נדרש חיבור אינטרנט כדי שהאווטארים ייטענו.

## נתונים

`questions.json` מכיל כרגע 4 קטגוריות ראשיות (ידע כללי, אקטואליה ועולם, תרבות פופ, מותגי לייף-סטייל) עם 13 תת-קטגוריות בסה"כ (מדע, טכנולוגיה, ספרות, אסטרונומיה, גאוגרפיה, פוליטיקה עולמית, אירועים היסטוריים, תנ"ך, כדורגל, סרטים וסדרות, מוזיקה, ביטוח, אוכל, כושר, רכב, אופנה).

## תיקיות עיצוב (Design Handoff)

תיקיות `design_handoff_*` מכילות קבצי HTML/README נפרדים המשמשים כמסמכי מסירה לעיצוב (mockups סטטיים) לכל מסך — לא חלק מהאפליקציה הרצה בפועל:

- `design_handoff_pop_home_1d` — מסך הבית
- `design_handoff_subcategory_9a` — מסך תת-קטגוריה
- `design_handoff_question_cards` — כרטיסי שאלה (2/4 תשובות)
- `design_handoff_results_12c` — מסך תוצאה
- `design_handoff_h2h_13b` — מסך דו-קרב
- `design_handoff_h2h_subcategory_14b` — תת-קטגוריה במצב דו-קרב

## הרצה מקומית

אין build/dev-server ייעודי. פתחו את `index.html` דרך שרת סטטי מקומי (למשל Live Server ב-VSCode) — לא ישירות מהדיסק (`file://`), כי Firebase Auth/Firestore דורשים הגשה מ-`http(s)://`.

```
npm install   # מתקין את חבילת firebase
```

ואז הגישו את התיקייה עם כל שרת סטטי (Live Server / `npx serve` וכו').
