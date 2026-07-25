let CATEGORY_DATA = {};

const QUESTION_TIME = 20;
const WARNING_TIME = 10;
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
  const response = await fetch('questions.json');
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
  document.getElementById('restartButton').addEventListener('click', restartQuiz);
  document.getElementById('leaderboardButton').addEventListener('click', () => {
    window.location.href = 'leaderboardPage.html';
  });
  document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
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
      return saved.queue;
    }
  } catch (err) {
    // localStorage unavailable or corrupted; fall back to a fresh shuffle below
  }
  return shuffledIndices(state.questions.length);
}

function saveQuestionQueue() {
  try {
    localStorage.setItem(getQueueStorageKey(), JSON.stringify({ total: state.questions.length, queue: state.remainingQueue }));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
}

function pickNextQuestionIndex() {
  if (state.remainingQueue.length === 0) return null;
  const index = state.remainingQueue.shift();
  saveQuestionQueue();
  return index;
}

function pickNextOrResetIndex() {
  let index = pickNextQuestionIndex();
  if (index === null) {
    state.remainingQueue = shuffledIndices(state.questions.length);
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
    if (isTrueFalse) {
      button.classList.add(index === 0 ? 'answer-button--true-option' : 'answer-button--false-option');
    }
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
  if (document.getElementById('resultScreen').hidden === false) return;
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

function renderResultHistory() {
  const list = document.getElementById('resultHistoryList');
  list.innerHTML = '';

  state.history.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = `result-history-item ${entry.isCorrect ? 'result-history-item--correct' : 'result-history-item--wrong'}`;
    const timeLabel = entry.timedOut ? '⏰ לא הספקתם' : `⏱️ ${entry.elapsed.toFixed(1)} שנ׳`;
    item.innerHTML = `
      <span class="result-history-item__icon">${entry.isCorrect ? '✔' : '✘'}</span>
      <span class="result-history-item__text">${index + 1}. ${truncateText(entry.text)}</span>
      <span class="result-history-item__time">${timeLabel}</span>
    `;
    list.appendChild(item);
  });
}

function showResultScreen(poolExhausted = false) {
  stopTimer();
  stopGlobalTimer();

  document.getElementById('questionCard').hidden = true;
  document.getElementById('answersGrid').hidden = true;

  const resultScreen = document.getElementById('resultScreen');
  resultScreen.hidden = false;
  requestAnimationFrame(() => resultScreen.classList.add('result-screen--visible'));
  document.getElementById('resultTitle').textContent = poolExhausted ? 'עניתם על כל השאלות!' : 'הזמן נגמר!';

  const correctCount = state.history.filter(entry => entry.isCorrect).length;
  document.getElementById('resultScore').textContent = `צברתם ${state.score} נקודות`;
  document.getElementById('resultAccuracy').textContent =
    `הצלחתם לענות נכון על ${correctCount} מתוך ${state.answeredCount} שאלות שנענו`;

  renderResultHistory();
  recordAndRenderLeaderboard();
  triggerLeaderboardButtonBlink('leaderboardButton');
}

async function recordAndRenderLeaderboard() {
  const profile = getPlayerProfile() || { name: 'אורח', avatar: '🙂' };
  const categoryTitle = CATEGORY_DATA[state.category] ? CATEGORY_DATA[state.category].title : state.category;

  renderPlayerBadge(document.getElementById('resultPlayerBadgeContainer'), { profile });

  try {
    const { rank, total } = await addLeaderboardEntry({
      playerId: getOrCreatePlayerId(),
      name: profile.name,
      avatar: profile.avatar,
      score: state.score,
      category: categoryTitle,
    });

    document.getElementById('leaderboardRankInfo').textContent = `המיקום שלכם בלוח התוצאות: #${rank} מתוך ${total}`;
  } catch (err) {
    console.error('Leaderboard error:', err.code || '', err.message || err);
    document.getElementById('leaderboardRankInfo').textContent = 'לא ניתן היה לטעון את לוח התוצאות כרגע';
  }
}

function restartQuiz() {
  state.history = [];
  state.currentIndex = pickNextOrResetIndex();
  state.score = 0;
  state.answeredCount = 0;

  document.getElementById('questionCard').hidden = false;
  document.getElementById('answersGrid').hidden = false;
  const resultScreen = document.getElementById('resultScreen');
  resultScreen.hidden = true;
  resultScreen.classList.remove('result-screen--visible');

  startGlobalTimer();
  renderQuestion();
}
