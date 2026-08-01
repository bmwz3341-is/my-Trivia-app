let CATEGORY_DATA = {};

// Regular-game question timer, driven by the "משך זמן לשאלה" setting (TriviaSettings.js).
// Duel mode has its own separate constant (duelPageTrivia.js) and is unaffected by this setting.
// Quick Game mode overrides both to a fixed duration (see QUICK_GAME_QUESTION_TIME below).
let QUESTION_TIME = getTriviaSettings().timerDuration;
let WARNING_TIME = Math.ceil(QUESTION_TIME / 2);
let GLOBAL_TIME = 90;
const GLOBAL_WARNING_TIME = 15;
const GLOBAL_RING_CIRCUMFERENCE = 2 * Math.PI * 42;

const QUICK_GAME_QUESTION_COUNT = 10;
const QUICK_GAME_QUESTION_TIME = 8;
const QUICK_GAME_GLOBAL_TIME = 80;
const QUICK_GAME_CORRECT_POINTS = 10;

const SCORE_TIERS = [
  { maxElapsed: 4, points: 15 },
  { maxElapsed: 8, points: 12 },
  { maxElapsed: 14, points: 10 },
  { maxElapsed: 20, points: 7 },
];

let state = {
  mode: 'category',
  category: 'general-trivia',
  subCategory: '',
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  answeredCount: 0,
  remainingQueue: [],
  lastServedIndex: null,
  history: [],
};

let timerInterval = null;

let globalTimerInterval = null;
let globalTimeLeft = GLOBAL_TIME;

let advanceTimeout = null;
let renderId = 0;

let questionStartedAt = 0;
let pausedAt = null;
let pausedDurationMs = 0;

document.addEventListener('DOMContentLoaded', () => {
  initQuestPage();
});

async function initQuestPage() {
  const response = await fetch('questions.json', { cache: 'no-store' });
  CATEGORY_DATA = await response.json();

  const params = new URLSearchParams(window.location.search);
  const isQuickGame = params.get('mode') === 'quick';

  let headerTitle;
  if (isQuickGame) {
    QUESTION_TIME = QUICK_GAME_QUESTION_TIME;
    WARNING_TIME = Math.ceil(QUESTION_TIME / 2);
    GLOBAL_TIME = QUICK_GAME_GLOBAL_TIME;

    state.mode = 'quick';
    state.category = 'quick-game';
    state.subCategory = '';
    state.questions = drawQuickGameQuestions(CATEGORY_DATA, QUICK_GAME_QUESTION_COUNT);
    state.remainingQueue = Array.from({ length: state.questions.length }, (_, i) => i);
    headerTitle = 'אתגר מהיר';
  } else {
    const category = params.get('category');
    const subCategory = params.get('sub');
    const categoryData = CATEGORY_DATA[category];
    const subCategoryData = categoryData ? categoryData.subcategories[subCategory] : null;

    if (!categoryData || !subCategoryData) {
      window.location.href = 'index.html';
      return;
    }

    state.mode = 'category';
    state.category = category;
    state.subCategory = subCategory;
    state.questions = subCategoryData.questions;
    state.remainingQueue = loadQuestionQueue();
    headerTitle = subCategoryData.title;
  }

  state.history = [];
  state.currentIndex = state.mode === 'quick' ? pickNextQuestionIndex() : pickNextOrResetIndex();

  document.getElementById('categoryTitle').textContent = headerTitle;
  renderPlayerBadge(document.getElementById('questPlayerBadgeContainer'));

  if (state.mode === 'quick') {
    document.getElementById('scoreInfoTieredList').hidden = true;
    document.getElementById('scoreInfoQuickSummary').hidden = false;
    document.getElementById('scoreInfoQuickSummary').textContent =
      `${QUICK_GAME_QUESTION_COUNT} שאלות • ${QUICK_GAME_QUESTION_TIME} שניות לכל שאלה • ${QUICK_GAME_GLOBAL_TIME} שניות בסך הכל לסבב`;
    document.getElementById('scoreInfoQuickList').hidden = false;
    document.getElementById('scoreInfoQuickPoints').textContent = `${QUICK_GAME_CORRECT_POINTS} נק'`;
  }

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = state.mode === 'quick' ? 'index.html' : `subCategoryPage.html?category=${state.category}`;
  });
  const scoreInfoOverlay = document.getElementById('scoreInfoOverlay');
  document.getElementById('scoreInfoButton').addEventListener('click', () => {
    scoreInfoOverlay.hidden = false;
    pausedAt = Date.now();
    stopTimer();
    stopGlobalTimer();
  });
  document.getElementById('scoreInfoCloseButton').addEventListener('click', () => {
    scoreInfoOverlay.hidden = true;
    unpause();
    resumeTimers();
  });
  scoreInfoOverlay.addEventListener('click', (event) => {
    if (event.target === scoreInfoOverlay) {
      scoreInfoOverlay.hidden = true;
      unpause();
      resumeTimers();
    }
  });

  startGlobalTimer();
  startBackgroundMusic();
  renderQuestion();
}

function getQueueStorageKey() {
  return `triviaQueue::${state.category}::${state.subCategory}`;
}

function shuffledIndices(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadQuestionQueue() {
  try {
    const raw = localStorage.getItem(getQueueStorageKey());
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && saved.total === state.questions.length && Array.isArray(saved.queue) && saved.queue.length > 0) {
      state.lastServedIndex = typeof saved.lastServed === 'number' ? saved.lastServed : null;
      return saved.queue;
    }
  } catch (err) {
    // localStorage unavailable or corrupted; fall back to a fresh shuffle below
  }
  state.lastServedIndex = null;
  return shuffledIndices(state.questions.length);
}

function saveQuestionQueue() {
  // Quick Game draws its 12 questions once at round start (drawQuickGameQuestions) and
  // just plays through them in order — nothing to persist per-question here.
  if (state.mode === 'quick') return;
  try {
    localStorage.setItem(getQueueStorageKey(), JSON.stringify({
      total: state.questions.length,
      queue: state.remainingQueue,
      lastServed: state.lastServedIndex,
    }));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
}

function pickNextQuestionIndex() {
  if (state.remainingQueue.length === 0) return null;
  const index = state.remainingQueue.shift();
  state.lastServedIndex = index;
  saveQuestionQueue();
  return index;
}

// Quick Game: draws QUICK_GAME_QUESTION_COUNT questions from a single shuffled pool spanning
// every category/sub-category, persisted in localStorage so repeats are avoided across plays
// (mirroring the per-category queue above) until the whole question bank has been served.
const QUICK_GAME_QUEUE_KEY = 'triviaQueue::quickGame';

function buildFlatQuestionRefs(categoryData) {
  const refs = [];
  Object.keys(categoryData).forEach((categoryKey) => {
    const subcategories = categoryData[categoryKey].subcategories;
    Object.keys(subcategories).forEach((subKey) => {
      subcategories[subKey].questions.forEach((_, questionIndex) => {
        refs.push({ category: categoryKey, subCategory: subKey, index: questionIndex });
      });
    });
  });
  return refs;
}

function loadQuickGameQueue(total) {
  try {
    const raw = localStorage.getItem(QUICK_GAME_QUEUE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && saved.total === total && Array.isArray(saved.queue)) {
      return { queue: saved.queue, lastServed: typeof saved.lastServed === 'number' ? saved.lastServed : null };
    }
  } catch (err) {
    // localStorage unavailable or corrupted; fall back to a fresh shuffle below
  }
  return { queue: shuffledIndices(total), lastServed: null };
}

function saveQuickGameQueue(total, queue, lastServed) {
  try {
    localStorage.setItem(QUICK_GAME_QUEUE_KEY, JSON.stringify({ total, queue, lastServed }));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
}

function drawQuickGameQuestions(categoryData, count) {
  const refs = buildFlatQuestionRefs(categoryData);
  const drawCount = Math.min(count, refs.length);
  let { queue, lastServed } = loadQuickGameQueue(refs.length);

  const drawnRefs = [];
  while (drawnRefs.length < drawCount) {
    if (queue.length === 0) {
      queue = shuffledIndices(refs.length);
      // Avoid immediately repeating the last question served in the previous quick game.
      if (queue.length > 1 && queue[0] === lastServed) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
    }
    lastServed = queue.shift();
    drawnRefs.push(refs[lastServed]);
  }

  saveQuickGameQueue(refs.length, queue, lastServed);

  return drawnRefs.map((ref) => ({
    ...categoryData[ref.category].subcategories[ref.subCategory].questions[ref.index],
    sourceCategory: ref.category,
    sourceSubCategory: ref.subCategory,
  }));
}

function pickNextOrResetIndex() {
  let index = pickNextQuestionIndex();
  if (index === null) {
    state.remainingQueue = shuffledIndices(state.questions.length);
    // Avoid immediately repeating the last question served in the previous session/cycle.
    if (state.remainingQueue.length > 1 && state.remainingQueue[0] === state.lastServedIndex) {
      [state.remainingQueue[0], state.remainingQueue[1]] = [state.remainingQueue[1], state.remainingQueue[0]];
    }
    index = pickNextQuestionIndex();
  }
  return index;
}

function renderQuestion() {
  state.answered = false;
  renderId += 1;
  const currentRenderId = renderId;
  const question = state.questions[state.currentIndex];
  const isTrueFalse = question.type === 'true-false';

  document.getElementById('scoreBadge').textContent = `${state.score} נק'`;
  document.getElementById('questionText').textContent = question.text;

  const answersGrid = document.getElementById('answersGrid');
  answersGrid.innerHTML = '';
  answersGrid.classList.toggle('answers-grid--boolean', isTrueFalse);

  question.options.forEach((optionText, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.innerHTML = `<span>${optionText}</span><span class="answer-button__icon"></span>`;
    button.addEventListener('click', () => handleAnswerClick(index, button, currentRenderId));
    answersGrid.appendChild(button);
  });

  startTimer();
}

function unpause() {
  if (pausedAt === null) return;
  pausedDurationMs += Date.now() - pausedAt;
  pausedAt = null;
}

function getElapsedSeconds() {
  const rawMs = Date.now() - questionStartedAt - pausedDurationMs;
  return Math.max(0, Math.round(rawMs / 100) / 10);
}

function getRemainingTime() {
  return Math.max(0, QUESTION_TIME - getElapsedSeconds());
}

function startTimer(reset = true) {
  stopTimer();
  if (reset) {
    questionStartedAt = Date.now();
    pausedDurationMs = 0;
  }
  updateTimerDisplay();
  startTickingClock(getRemainingTime, WARNING_TIME);

  // Ticks every 100ms (instead of 1s) so fractional durations like Quick Game's 7.5s
  // still time out at the right moment, while the on-screen badge shows a whole second.
  timerInterval = setInterval(() => {
    const remaining = getRemainingTime();
    updateTimerDisplay();

    if (remaining <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 100);
}

function stopTimer() {
  stopTickingClock();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const remaining = getRemainingTime();
  const displaySeconds = Math.ceil(remaining);
  document.getElementById('timerBadge').textContent = displaySeconds;
  document.getElementById('timerCard').classList.toggle('timer-card--warning', remaining <= WARNING_TIME && remaining > 0);
}

function handleTimeOut() {
  if (state.answered) return;
  handleAnswerClick(-1, null, renderId);
}

function startGlobalTimer(reset = true) {
  stopGlobalTimer();
  if (reset) globalTimeLeft = GLOBAL_TIME;
  updateGlobalTimerDisplay();

  globalTimerInterval = setInterval(() => {
    globalTimeLeft -= 1;
    updateGlobalTimerDisplay();

    if (globalTimeLeft <= 0) {
      stopGlobalTimer();
      handleGlobalTimeOut();
    }
  }, 1000);
}

function stopGlobalTimer() {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
}

function updateGlobalTimerDisplay() {
  const minutes = Math.floor(globalTimeLeft / 60);
  const seconds = globalTimeLeft % 60;
  document.getElementById('globalTimerBadge').textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const elapsedRatio = 1 - globalTimeLeft / GLOBAL_TIME;
  const offset = GLOBAL_RING_CIRCUMFERENCE * elapsedRatio;
  document.getElementById('globalTimerRing').style.strokeDashoffset = offset;
  document.getElementById('globalTimerCard').classList.toggle('global-timer--warning', globalTimeLeft <= GLOBAL_WARNING_TIME && globalTimeLeft > 0);
  document.getElementById('progressFill').style.width = `${elapsedRatio * 100}%`;
}

function resumeTimers() {
  if (!state.answered) startTimer(false);
  startGlobalTimer(false);
}

function handleGlobalTimeOut() {
  stopTimer();
  if (advanceTimeout) {
    clearTimeout(advanceTimeout);
    advanceTimeout = null;
  }
  state.answered = true;
  showResultScreen();
}

function handleAnswerClick(selectedIndex, button, clickRenderId) {
  if (clickRenderId !== renderId) return;
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  const question = state.questions[state.currentIndex];
  const buttons = document.querySelectorAll('.answer-button');

  buttons.forEach((btn, index) => {
    btn.disabled = true;
    if (index === question.correct) {
      btn.classList.add('answer-button--correct');
      btn.querySelector('.answer-button__icon').textContent = '✔';
    } else if (index === selectedIndex) {
      btn.classList.add('answer-button--wrong');
      btn.querySelector('.answer-button__icon').textContent = '✘';
    }
  });

  const timedOut = selectedIndex === -1;
  const isCorrect = selectedIndex === question.correct;

  if (!timedOut) {
    state.answeredCount += 1;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
      triggerWrongAnswerHaptic();
    }
  }

  state.history.push({
    text: question.text,
    isCorrect,
    timedOut,
    elapsed: getElapsedSeconds(),
  });

  if (isCorrect) {
    if (state.mode === 'quick') {
      state.score += QUICK_GAME_CORRECT_POINTS;
    } else {
      const elapsed = getElapsedSeconds();
      const tier = SCORE_TIERS.find(t => elapsed <= t.maxElapsed);
      state.score += tier ? tier.points : 0;
    }
    document.getElementById('scoreBadge').textContent = `${state.score} נק'`;
  }

  advanceTimeout = setTimeout(handleNextClick, 1500);
}

function handleNextClick() {
  stopTimer();
  const nextIndex = pickNextQuestionIndex();
  if (nextIndex === null) {
    showResultScreen(true);
    return;
  }
  state.currentIndex = nextIndex;
  renderQuestion();
}

async function showResultScreen(poolExhausted = false) {
  stopTimer();
  stopGlobalTimer();
  stopBackgroundMusic();

  const correctCount = state.history.filter(entry => entry.isCorrect).length;
  const profile = getPlayerProfile() || { name: 'אורח', avatar: '🙂' };
  const categoryTitle = state.mode === 'quick'
    ? 'אתגר מהיר'
    : (CATEGORY_DATA[state.category] ? CATEGORY_DATA[state.category].title : state.category);

  const isPerfect = state.answeredCount > 0 && correctCount === state.answeredCount;
  const accuracyRatio = state.answeredCount > 0 ? correctCount / state.answeredCount : 0;

  const result = {
    title: poolExhausted ? 'עניתם על כל השאלות!' : 'הזמן נגמר!',
    scoreText: `צברתם ${state.score} נקודות`,
    accuracyText: `הצלחתם לענות נכון על ${correctCount} מתוך ${state.answeredCount} שאלות שנענו (${Math.round(accuracyRatio * 100)}%)`,
    history: state.history,
    mode: state.mode,
    category: state.category,
    subCategory: state.subCategory,
    rankInfo: '',
    celebration: 'none',
  };

  try {
    const { rank, total, isNewBest } = await addLeaderboardEntry({
      playerId: getOrCreatePlayerId(),
      name: profile.name,
      avatar: profile.avatar,
      score: state.score,
      category: categoryTitle,
    });
    result.rankInfo = `המיקום שלכם בלוח התוצאות: #${rank} מתוך ${total}`;
    result.celebration = (isNewBest || isPerfect) ? 'big' : (accuracyRatio >= 0.8 ? 'small' : 'none');
  } catch (err) {
    console.error('Leaderboard error:', err.code || '', err.message || err);
    result.rankInfo = 'לא ניתן היה לטעון את לוח התוצאות כרגע';
    result.celebration = isPerfect ? 'big' : (accuracyRatio >= 0.8 ? 'small' : 'none');
  }

  try {
    sessionStorage.setItem('triviaLastResult', JSON.stringify(result));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }

  window.location.href = 'resultPage.html';
}
