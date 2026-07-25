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
  renderDuelCategoryStep();
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
      return;
    }
  }

  document.getElementById('duelSetupHint').textContent = 'בחרו קטגוריה לקרב המהיר';
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
    button.addEventListener('click', () => handleQuickMatch(categoryKey, subKey));
    body.appendChild(button);
  });
}

async function handleQuickMatch(categoryKey, subKey) {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'מחפשים יריב...';
  document.getElementById('duelSetupBody').innerHTML = '';

  try {
    const joinedRoomCode = await findAndJoinQuickMatch(categoryKey, subKey);
    if (joinedRoomCode) {
      window.location.href = `duelPageTrivia.html?room=${joinedRoomCode}`;
      return;
    }

    const questionCount = duelCategoryDataCache[categoryKey].subcategories[subKey].questions.length;
    const roomCode = await createDuelRoom({ category: categoryKey, subCategory: subKey, questionCount });
    window.location.href = `duelPageTrivia.html?room=${roomCode}`;
  } catch (err) {
    showDuelSetupError('לא הצלחנו למצוא או ליצור קרב.');
    document.getElementById('duelSetupHint').textContent = '';
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'profile-modal__start-button duel-setup__option';
    retryButton.textContent = 'נסו שוב';
    retryButton.addEventListener('click', () => handleQuickMatch(categoryKey, subKey));
    document.getElementById('duelSetupBody').appendChild(retryButton);
  }
}
