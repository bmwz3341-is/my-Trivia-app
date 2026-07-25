document.addEventListener('DOMContentLoaded', () => {
  initLeaderboardPage();
});

async function initLeaderboardPage() {
  renderPlayerBadge(document.getElementById('leaderboardPlayerBadgeContainer'), { editable: true });

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('leaderboardTabGeneral').addEventListener('click', () => {
    switchLeaderboardTab(LEADERBOARD_COLLECTION);
  });
  document.getElementById('leaderboardTabDuel').addEventListener('click', () => {
    switchLeaderboardTab(DUEL_LEADERBOARD_COLLECTION);
  });

  await loadLeaderboardTab(LEADERBOARD_COLLECTION);
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
