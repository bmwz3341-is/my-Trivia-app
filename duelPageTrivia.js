const DUEL_QUESTION_TIME = 15;
const DUEL_WARNING_TIME = 8;
const DUEL_SCORE_TIERS = [
  { maxElapsed: 3, points: 15 },
  { maxElapsed: 6, points: 12 },
  { maxElapsed: 10, points: 10 },
  { maxElapsed: 15, points: 7 },
];

const duelState = {
  roomCode: null,
  uid: null,
  categoryData: null,
  questions: [],
  unsubscribe: null,
  lastRenderedIndex: -1,
  answeredThisQuestion: false,
  finished: false,
};

let duelTimerInterval = null;
let duelTimeLeft = DUEL_QUESTION_TIME;

document.addEventListener('DOMContentLoaded', () => {
  initDuelPage();
});

async function initDuelPage() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('room');
  if (!roomCode || !hasPlayerProfile()) {
    window.location.href = 'index.html';
    return;
  }

  duelState.roomCode = roomCode;
  document.getElementById('duelRoomCode').textContent = roomCode;

  document.getElementById('duelBackButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  document.getElementById('duelHomeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  duelState.uid = await ensurePlayerAuth();

  const response = await fetch('questions.json');
  duelState.categoryData = await response.json();

  duelState.unsubscribe = watchDuelRoom(roomCode, handleDuelSnapshot);
}

function handleDuelSnapshot(data) {
  if (!data) {
    window.location.href = 'index.html';
    return;
  }

  renderDuelScores(data);

  if (data.status === 'waiting') {
    showDuelWaiting(true);
    return;
  }

  showDuelWaiting(false);

  if (data.status === 'finished') {
    if (!duelState.finished) {
      duelState.finished = true;
      stopDuelTimer();
      showDuelResult(data);
    }
    return;
  }

  renderDuelQuestion(data);
}

function showDuelWaiting(isWaiting) {
  document.getElementById('duelWaitingScreen').hidden = !isWaiting;
  document.getElementById('duelQuestionCard').hidden = isWaiting;
  document.getElementById('duelAnswersGrid').hidden = isWaiting;
}

function renderDuelScores(data) {
  const players = data.players || {};
  const host = players[data.hostId];
  const guest = data.guestId ? players[data.guestId] : null;

  if (host) {
    document.getElementById('duelHostAvatar').innerHTML = getAvatarMarkup(host.avatar);
    document.getElementById('duelHostName').textContent = host.name;
    document.getElementById('duelHostScore').textContent = host.score;
  }

  if (guest) {
    document.getElementById('duelGuestAvatar').innerHTML = getAvatarMarkup(guest.avatar);
    document.getElementById('duelGuestName').textContent = guest.name;
    document.getElementById('duelGuestScore').textContent = guest.score;
  } else {
    document.getElementById('duelGuestAvatar').innerHTML = '';
    document.getElementById('duelGuestName').textContent = 'ממתין...';
    document.getElementById('duelGuestScore').textContent = '0';
  }

  const catData = duelState.categoryData[data.category];
  const subData = catData ? catData.subcategories[data.subCategory] : null;
  if (subData) {
    document.getElementById('duelCategoryTitle').textContent = subData.title;
    duelState.questions = subData.questions;
  }
}

function getMyPlayer(data) {
  return (data.players || {})[duelState.uid];
}

function renderDuelQuestion(data) {
  const index = data.currentQuestionIndex;
  const totalQuestions = data.questionIds.length;
  const me = getMyPlayer(data);
  const myAnswered = me && me.lastAnsweredIndex >= index;

  document.getElementById('duelProgressFill').style.width = `${(index / totalQuestions) * 100}%`;

  if (myAnswered) {
    document.getElementById('duelQuestionCard').hidden = true;
    document.getElementById('duelAnswersGrid').hidden = true;
    document.getElementById('duelWaitingForOpponent').hidden = false;
    stopDuelTimer();
    return;
  }

  document.getElementById('duelWaitingForOpponent').hidden = true;
  document.getElementById('duelQuestionCard').hidden = false;
  document.getElementById('duelAnswersGrid').hidden = false;

  if (duelState.lastRenderedIndex === index) return;
  duelState.lastRenderedIndex = index;
  duelState.answeredThisQuestion = false;

  const questionIdx = data.questionIds[index];
  const question = duelState.questions[questionIdx];

  document.getElementById('duelQuestionText').textContent = question.text;

  const answersGrid = document.getElementById('duelAnswersGrid');
  answersGrid.innerHTML = '';
  const isTrueFalse = question.type === 'true-false';
  answersGrid.classList.toggle('answers-grid--boolean', isTrueFalse);

  question.options.forEach((optionText, optIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    if (isTrueFalse) {
      button.classList.add(optIndex === 0 ? 'answer-button--true-option' : 'answer-button--false-option');
    }
    button.innerHTML = `<span>${optionText}</span><span class="answer-button__icon"></span>`;
    button.addEventListener('click', () => handleDuelAnswerClick(optIndex, question.correct, index, totalQuestions));
    answersGrid.appendChild(button);
  });

  startDuelTimer(index, totalQuestions, question.correct);
}

function startDuelTimer(index, totalQuestions, correctIndex) {
  stopDuelTimer();
  duelTimeLeft = DUEL_QUESTION_TIME;
  updateDuelTimerDisplay();

  duelTimerInterval = setInterval(() => {
    duelTimeLeft -= 1;
    updateDuelTimerDisplay();
    if (duelTimeLeft <= 0) {
      stopDuelTimer();
      handleDuelAnswerClick(-1, correctIndex, index, totalQuestions);
    }
  }, 1000);
}

function stopDuelTimer() {
  if (duelTimerInterval) {
    clearInterval(duelTimerInterval);
    duelTimerInterval = null;
  }
}

function updateDuelTimerDisplay() {
  document.getElementById('duelTimerBadge').textContent = Math.max(0, duelTimeLeft);
  document.getElementById('duelTimerCard').classList.toggle('timer-card--warning', duelTimeLeft <= DUEL_WARNING_TIME && duelTimeLeft > 0);
}

async function handleDuelAnswerClick(selectedIndex, correctIndex, questionIndex, totalQuestions) {
  if (duelState.answeredThisQuestion) return;
  duelState.answeredThisQuestion = true;
  stopDuelTimer();

  const buttons = document.querySelectorAll('#duelAnswersGrid .answer-button');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) {
      btn.classList.add('answer-button--correct');
      btn.querySelector('.answer-button__icon').textContent = '✔';
    } else if (idx === selectedIndex) {
      btn.classList.add('answer-button--wrong');
      btn.querySelector('.answer-button__icon').textContent = '✘';
    }
  });

  const isCorrect = selectedIndex === correctIndex;
  let points = 0;
  if (isCorrect) {
    const elapsed = DUEL_QUESTION_TIME - duelTimeLeft;
    const tier = DUEL_SCORE_TIERS.find((t) => elapsed <= t.maxElapsed);
    points = tier ? tier.points : 0;
  }

  await submitDuelAnswer(duelState.roomCode, duelState.uid, questionIndex, points);
  await advanceDuelIfReady(duelState.roomCode, questionIndex, totalQuestions);
}

async function showDuelResult(data) {
  document.getElementById('duelQuestionCard').hidden = true;
  document.getElementById('duelAnswersGrid').hidden = true;
  document.getElementById('duelWaitingForOpponent').hidden = true;
  document.getElementById('duelResultScreen').hidden = false;

  const me = getMyPlayer(data);
  const opponentId = data.hostId === duelState.uid ? data.guestId : data.hostId;
  const opponent = opponentId ? data.players[opponentId] : null;

  let title = 'תיקו!';
  if (opponent && me.score > opponent.score) title = 'ניצחתם! 🏆';
  else if (opponent && me.score < opponent.score) title = 'הפסדתם';

  document.getElementById('duelResultTitle').textContent = title;
  document.getElementById('duelResultScore').textContent = opponent
    ? `${me.score} - ${opponent.score}`
    : `צברתם ${me.score} נקודות`;

  if (me) {
    await addLeaderboardEntry({
      playerId: getOrCreatePlayerId(),
      name: me.name,
      avatar: me.avatar,
      score: me.score,
      category: 'קרב ראש-בראש',
    });
  }
}

window.addEventListener('beforeunload', () => {
  if (duelState.unsubscribe) duelState.unsubscribe();
});
