let CATEGORY_DATA = {};

// Regular-game question timer, driven by the "משך זמן לשאלה" setting (TriviaSettings.js).
// Duel mode has its own separate constant (duelPageTrivia.js) and is unaffected by this setting.
const QUESTION_TIME = getTriviaSettings().timerDuration;
const WARNING_TIME = Math.ceil(QUESTION_TIME / 2);
const GLOBAL_TIME = 90;
const GLOBAL_WARNING_TIME = 15;
const GLOBAL_RING_CIRCUMFERENCE = 2 * Math.PI * 42;

const SCORE_TIERS = [
  { maxElapsed: 4, points: 15 },
  { maxElapsed: 8, points: 12 },
  { maxElapsed: 14, points: 10 },
  { maxElapsed: 20, points: 7 },
];

let state = {
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
let timeLeft = QUESTION_TIME;

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
  const category = params.get('category');
  const subCategory = params.get('sub');
  const categoryData = CATEGORY_DATA[category];
  const subCategoryData = categoryData ? categoryData.subcategories[subCategory] : null;

  if (!categoryData || !subCategoryData) {
    window.location.href = 'index.html';
    return;
  }

  state.category = category;
  state.subCategory = subCategory;
  state.questions = subCategoryData.questions;
  state.remainingQueue = loadQuestionQueue();
  state.history = [];
  state.currentIndex = pickNextOrResetIndex();

  document.getElementById('categoryTitle').textContent = subCategoryData.title;
  renderPlayerBadge(document.getElementById('questPlayerBadgeContainer'));
  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = `subCategoryPage.html?category=${state.category}`;
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

function startTimer(reset = true) {
  stopTimer();
  if (reset) {
    timeLeft = QUESTION_TIME;
    questionStartedAt = Date.now();
    pausedDurationMs = 0;
  }
  updateTimerDisplay();
  startTickingClock(() => timeLeft, WARNING_TIME);

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  stopTickingClock();
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  document.getElementById('timerBadge').textContent = timeLeft;
  document.getElementById('timerCard').classList.toggle('timer-card--warning', timeLeft <= WARNING_TIME && timeLeft > 0);
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
    const elapsed = QUESTION_TIME - timeLeft;
    const tier = SCORE_TIERS.find(t => elapsed <= t.maxElapsed);
    state.score += tier ? tier.points : 0;
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

  const correctCount = state.history.filter(entry => entry.isCorrect).length;
  const profile = getPlayerProfile() || { name: 'אורח', avatar: '🙂' };
  const categoryTitle = CATEGORY_DATA[state.category] ? CATEGORY_DATA[state.category].title : state.category;

  const result = {
    title: poolExhausted ? 'עניתם על כל השאלות!' : 'הזמן נגמר!',
    scoreText: `צברתם ${state.score} נקודות`,
    accuracyText: `הצלחתם לענות נכון על ${correctCount} מתוך ${state.answeredCount} שאלות שנענו`,
    history: state.history,
    category: state.category,
    subCategory: state.subCategory,
    rankInfo: '',
  };

  try {
    const { rank, total } = await addLeaderboardEntry({
      playerId: getOrCreatePlayerId(),
      name: profile.name,
      avatar: profile.avatar,
      score: state.score,
      category: categoryTitle,
    });
    result.rankInfo = `המיקום שלכם בלוח התוצאות: #${rank} מתוך ${total}`;
  } catch (err) {
    console.error('Leaderboard error:', err.code || '', err.message || err);
    result.rankInfo = 'לא ניתן היה לטעון את לוח התוצאות כרגע';
  }

  try {
    sessionStorage.setItem('triviaLastResult', JSON.stringify(result));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }

  window.location.href = 'resultPage.html';
}
