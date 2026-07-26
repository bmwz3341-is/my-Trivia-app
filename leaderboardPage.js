document.addEventListener('DOMContentLoaded', () => {
  initLeaderboardPage();
});

async function initLeaderboardPage() {
  renderPlayerBadge(document.getElementById('leaderboardPlayerBadgeContainer'), { editable: true });

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  renderQuestResult();

  document.getElementById('leaderboardTabGeneral').addEventListener('click', () => {
    switchLeaderboardTab(LEADERBOARD_COLLECTION);
  });
  document.getElementById('leaderboardTabDuel').addEventListener('click', () => {
    switchLeaderboardTab(DUEL_LEADERBOARD_COLLECTION);
  });

  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'duel'
    ? DUEL_LEADERBOARD_COLLECTION
    : LEADERBOARD_COLLECTION;
  await switchLeaderboardTab(initialTab);
}

async function switchLeaderboardTab(collectionName) {
  const isGeneral = collectionName === LEADERBOARD_COLLECTION;
  const generalTab = document.getElementById('leaderboardTabGeneral');
  const duelTab = document.getElementById('leaderboardTabDuel');

  generalTab.classList.toggle('leaderboard-tab--active', isGeneral);
  generalTab.setAttribute('aria-selected', String(isGeneral));
  duelTab.classList.toggle('leaderboard-tab--active', !isGeneral);
  duelTab.setAttribute('aria-selected', String(!isGeneral));

  await loadLeaderboardTab(collectionName);
}

function renderQuestResult() {
  const section = document.getElementById('questResultSection');
  const raw = sessionStorage.getItem('triviaLastResult');
  if (!raw) return;
  sessionStorage.removeItem('triviaLastResult');

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    return;
  }

  section.hidden = false;
  requestAnimationFrame(() => section.classList.add('result-screen--visible'));
  document.getElementById('resultTitle').textContent = result.title;
  document.getElementById('resultScore').textContent = result.scoreText;
  document.getElementById('resultAccuracy').textContent = result.accuracyText;
  document.getElementById('leaderboardRankInfo').textContent = result.rankInfo;

  const list = document.getElementById('resultHistoryList');
  list.innerHTML = '';
  (result.history || []).forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = `result-history-item ${entry.isCorrect ? 'result-history-item--correct' : 'result-history-item--wrong'}`;
    item.innerHTML = `
      <span class="result-history-item__text">${index + 1}. ${truncateText(entry.text)}</span>
      <span class="result-history-item__icon">${entry.isCorrect ? '✓' : '✕'}</span>
    `;
    list.appendChild(item);
  });

  document.getElementById('restartButton').addEventListener('click', () => {
    window.location.href = `questPageTrivia.html?category=${encodeURIComponent(result.category)}&sub=${encodeURIComponent(result.subCategory)}`;
  });
  document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

async function loadLeaderboardTab(collectionName) {
  const status = document.getElementById('leaderboardStatus');
  const list = document.getElementById('leaderboardList');

  status.hidden = false;
  status.textContent = 'טוען...';

  try {
    await renderLeaderboard(list, { highlightId: getOrCreatePlayerId(), collectionName });
    status.hidden = true;
  } catch (err) {
    console.error('Leaderboard error:', err.code || '', err.message || err);
    status.hidden = false;
    status.textContent = 'לא ניתן היה לטעון את לוח התוצאות כרגע';
  }
}
