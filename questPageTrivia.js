let CATEGORY_DATA = {};

const QUESTION_TIME = 25;
const WARNING_TIME = 10;

let state = {
  category: 'general-trivia',
  subCategory: '',
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
};

let timerInterval = null;
let timeLeft = QUESTION_TIME;

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

  document.getElementById('categoryTitle').textContent = subCategoryData.title;
  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = `subCategoryPage.html?category=${state.category}`;
  });
  document.getElementById('nextButton').addEventListener('click', handleNextClick);
  document.getElementById('restartButton').addEventListener('click', restartQuiz);
  document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  renderQuestion();
}

function renderQuestion() {
  state.answered = false;
  const question = state.questions[state.currentIndex];
  const total = state.questions.length;

  document.getElementById('questionCounter').textContent = `שאלה ${state.currentIndex + 1} מתוך ${total}`;
  document.getElementById('scoreBadge').textContent = `${state.score} נק'`;
  document.getElementById('progressFill').style.width = `${((state.currentIndex) / total) * 100}%`;
  document.getElementById('questionText').textContent = question.text;

  const answersGrid = document.getElementById('answersGrid');
  answersGrid.innerHTML = '';

  question.options.forEach((optionText, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.innerHTML = `<span>${optionText}</span><span class="answer-button__icon"></span>`;
    button.addEventListener('click', () => handleAnswerClick(index, button));
    answersGrid.appendChild(button);
  });

  document.getElementById('nextButton').disabled = true;

  startTimer();
}

function startTimer() {
  stopTimer();
  timeLeft = QUESTION_TIME;
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
  handleAnswerClick(-1, null);
  setTimeout(handleNextClick, 1500);
}

function handleAnswerClick(selectedIndex, button) {
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

  if (selectedIndex === question.correct) {
    state.score += 10;
    document.getElementById('scoreBadge').textContent = `${state.score} נק'`;
  }

  document.getElementById('nextButton').disabled = false;
}

function handleNextClick() {
  stopTimer();
  const total = state.questions.length;
  if (state.currentIndex < total - 1) {
    state.currentIndex += 1;
    renderQuestion();
  } else {
    showResultScreen();
  }
}

function showResultScreen() {
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('questionCard').hidden = true;
  document.getElementById('answersGrid').hidden = true;
  document.getElementById('nextButton').hidden = true;

  const resultScreen = document.getElementById('resultScreen');
  resultScreen.hidden = false;
  document.getElementById('resultScore').textContent =
    `הצלחתם! צברתם ${state.score} נקודות מתוך ${state.questions.length * 10}`;
}

function restartQuiz() {
  state.currentIndex = 0;
  state.score = 0;

  document.getElementById('questionCard').hidden = false;
  document.getElementById('answersGrid').hidden = false;
  document.getElementById('nextButton').hidden = false;
  document.getElementById('resultScreen').hidden = true;

  renderQuestion();
}
