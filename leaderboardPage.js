document.addEventListener('DOMContentLoaded', () => {
  initLeaderboardPage();
});

async function initLeaderboardPage() {
  renderPlayerBadge(document.getElementById('leaderboardPlayerBadgeContainer'), { editable: true });

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  const status = document.getElementById('leaderboardStatus');
  const list = document.getElementById('leaderboardList');

  try {
    await renderLeaderboard(list, { highlightId: getOrCreatePlayerId() });
    status.hidden = true;
  } catch (err) {
    console.error('Leaderboard error:', err.code || '', err.message || err);
    status.textContent = 'לא ניתן היה לטעון את לוח התוצאות כרגע';
  }
}
