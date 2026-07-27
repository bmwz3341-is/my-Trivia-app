let duelCategoryDataCache = null;

const H2H_CARD_STYLES = [
  { bg: '#6A3FB5', text: '#fff', rank: 'Q', suit: '♣', suitColor: '#fff' },
  { bg: '#3FAE6B', text: '#fff', rank: 'K', suit: '♦', suitColor: '#fff' },
  { bg: '#F5EF1E', text: '#141110', rank: 'J', suit: '♠', suitColor: '#141110' },
  { bg: '#fff', text: '#141110', rank: 'A', suit: '♥', suitColor: '#FF3D81' },
];

function buildH2HCardBox(items, getLabel, onSelect) {
  const wrap = document.createElement('div');
  wrap.className = 'h2h-cardbox-wrap';

  const cardbox = document.createElement('div');
  cardbox.className = 'h2h-cardbox';
  wrap.appendChild(cardbox);

  items.forEach((item, index) => {
    const style = H2H_CARD_STYLES[index % H2H_CARD_STYLES.length];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'h2h-card';
    button.style.background = style.bg;
    button.style.color = style.text;

    const rank = document.createElement('span');
    rank.className = 'h2h-card__rank';
    rank.textContent = style.rank;
    const suit = document.createElement('span');
    suit.className = 'h2h-card__suit';
    suit.style.color = style.suitColor;
    suit.textContent = style.suit;
    rank.appendChild(suit);

    const title = document.createElement('span');
    title.className = 'h2h-card__title';
    title.textContent = getLabel(item);

    button.appendChild(rank);
    button.appendChild(title);
    button.addEventListener('click', () => onSelect(item));
    cardbox.appendChild(button);
  });

  const shadow = document.createElement('div');
  shadow.className = 'h2h-cardbox-shadow';
  wrap.appendChild(shadow);

  return wrap;
}

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

  const categoryEntries = Object.entries(duelCategoryDataCache);
  const box = buildH2HCardBox(
    categoryEntries,
    ([, cat]) => cat.title,
    ([key, cat]) => renderDuelSubCategoryStep(key, cat)
  );
  body.appendChild(box);
}

function renderDuelSubCategoryStep(categoryKey, categoryData) {
  clearDuelSetupError();
  document.getElementById('duelSetupHint').textContent = 'בחרו תת-קטגוריה';
  const body = document.getElementById('duelSetupBody');
  body.innerHTML = '';

  const subEntries = Object.entries(categoryData.subcategories);
  const box = buildH2HCardBox(
    subEntries,
    ([, sub]) => `${sub.title} · ${sub.questions.length} שאלות`,
    ([subKey]) => handleQuickMatch(categoryKey, subKey)
  );
  body.appendChild(box);
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
