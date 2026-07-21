let CATEGORY_DATA = {};

let state = {
  category: 'general-trivia',
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
};

document.addEventListener('DOMContentLoaded', () => {
  initQuestPage();
});

async function initQuestPage() {
  const response = await fetch('questions.json');
  CATEGORY_DATA = await response.json();

  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  state.category = CATEGORY_DATA[category] ? category : 'general-trivia';
  state.questions = CATEGORY_DATA[state.category].questions;

  document.getElementById('categoryTitle').textContent = CATEGORY_DATA[state.category].title;
  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
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
}

function handleAnswerClick(selectedIndex, button) {
  if (state.answered) return;
  state.answered = true;

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
