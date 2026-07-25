let duelCategoryDataCache = null;

function ensureDuelSetupModal() {
  if (document.getElementById('duelSetupOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'duelSetupOverlay';
  overlay.className = 'profile-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="duelSetupTitle">
      <h3 id="duelSetupTitle" class="profile-modal__title">קרב ראש-בראש</h3>
      <p id="duelSetupHint" class="profile-modal__hint"></p>
      <div id="duelSetupBody"></div>
      <p id="duelSetupError" class="duel-setup__error" hidden></p>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeDuelSetupModal();
  });
}

function closeDuelSetupModal() {
  const overlay = document.getElementById('duelSetupOverlay');
  if (overlay) overlay.hidden = true;
}

function showDuelSetupError(message) {
  const el = document.getElementById('duelSetupError');
  el.textContent = message;
  el.hidden = false;
}

function clearDuelSetupError() {
  document.getElementById('duelSetupError').hidden = true;
}

function openDuelSetupModal() {
  ensureDuelSetupModal();
  clearDuelSetupError();
  document.getElementById('duelSetupOverlay').hidden = false;
  renderDuelChoiceStep();
}

function renderDuelChoiceStep() {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'צרו חדר חדש או הצטרפו עם קוד מחבר';
  document.getElementById('duelSetupBody').innerHTML = `
    <button id="duelCreateChoice" class="profile-modal__start-button duel-setup__option" type="button">צור חדר חדש</button>
    <button id="duelJoinChoice" class="profile-modal__start-button duel-setup__option" type="button">הצטרף עם קוד</button>
  `;
  document.getElementById('duelCreateChoice').addEventListener('click', renderDuelCategoryStep);
  document.getElementById('duelJoinChoice').addEventListener('click', renderDuelJoinStep);
}

async function renderDuelCategoryStep() {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'טוען קטגוריות...';
  document.getElementById('duelSetupBody').innerHTML = '';

  if (!duelCategoryDataCache) {
    try {
      const response = await fetch('questions.json');
      duelCategoryDataCache = await response.json();
    } catch (err) {
      showDuelSetupError('לא הצלחנו לטעון את הקטגוריות. נסו שוב.');
      renderDuelChoiceStep();
      return;
    }
  }

  document.getElementById('duelSetupHint').textContent = 'בחרו קטגוריה';
  const body = document.getElementById('duelSetupBody');
  body.innerHTML = '';
  Object.entries(duelCategoryDataCache).forEach(([key, cat]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'profile-modal__start-button duel-setup__option';
    button.textContent = cat.title;
    button.addEventListener('click', () => renderDuelSubCategoryStep(key, cat));
    body.appendChild(button);
  });
}

function renderDuelSubCategoryStep(categoryKey, categoryData) {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'בחרו תת-קטגוריה';
  const body = document.getElementById('duelSetupBody');
  body.innerHTML = '';
  Object.entries(categoryData.subcategories).forEach(([subKey, sub]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'profile-modal__start-button duel-setup__option';
    button.textContent = `${sub.title} · ${sub.questions.length} שאלות`;
    button.addEventListener('click', () => handleDuelCreate(categoryKey, subKey, sub.questions.length));
    body.appendChild(button);
  });
}

async function handleDuelCreate(category, subCategory, questionCount) {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'יוצר חדר...';
  document.getElementById('duelSetupBody').innerHTML = '';
  try {
    const roomCode = await createDuelRoom({ category, subCategory, questionCount });
    window.location.href = `duelPageTrivia.html?room=${roomCode}`;
  } catch (err) {
    showDuelSetupError('משהו השתבש ביצירת החדר. נסו שוב.');
    renderDuelChoiceStep();
  }
}

function renderDuelJoinStep() {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'הזינו את הקוד שקיבלתם מהחבר';
  document.getElementById('duelSetupBody').innerHTML = `
    <input id="duelJoinCodeInput" class="profile-modal__input duel-setup__input" type="text" maxlength="5" placeholder="קוד חדר" autocomplete="off">
    <button id="duelJoinSubmit" class="profile-modal__start-button duel-setup__option" type="button">הצטרף</button>
  `;
  document.getElementById('duelJoinSubmit').addEventListener('click', handleDuelJoin);
}

async function handleDuelJoin() {
  const input = document.getElementById('duelJoinCodeInput');
  const code = input.value.trim();
  if (!code) return;
  clearDuelSetupError();
  const submitButton = document.getElementById('duelJoinSubmit');
  submitButton.disabled = true;
  try {
    const roomCode = await joinDuelRoom(code);
    window.location.href = `duelPageTrivia.html?room=${roomCode}`;
  } catch (err) {
    submitButton.disabled = false;
    if (err.message === 'ROOM_NOT_FOUND') {
      showDuelSetupError('לא נמצא חדר עם הקוד הזה.');
    } else if (err.message === 'ROOM_FULL') {
      showDuelSetupError('החדר הזה כבר מלא.');
    } else {
      showDuelSetupError('משהו השתבש. נסו שוב.');
    }
  }
}
