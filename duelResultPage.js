document.addEventListener('DOMContentLoaded', () => {
  initDuelResultPage();
});

function initDuelResultPage() {
  const raw = sessionStorage.getItem('triviaDuelLastResult');
  if (!raw) {
    window.location.href = 'index.html';
    return;
  }
  sessionStorage.removeItem('triviaDuelLastResult');

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    window.location.href = 'index.html';
    return;
  }

  renderPlayerBadge(document.getElementById('duelResultPlayerBadgeContainer'), { profile: result.profile });

  document.getElementById('duelResultTitle').textContent = result.title;
  if (result.title && result.title.includes('ניצחתם')) {
    playApplauseSound();
  }
  document.getElementById('duelResultScore').textContent = result.scoreText;
  document.getElementById('duelResultAccuracy').textContent = result.accuracyText;
  document.getElementById('duelLeaderboardRankInfo').textContent = result.rankInfo;

  const list = document.getElementById('duelResultHistoryList');
  list.innerHTML = '';
  (result.history || []).forEach((entry, index) => {
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

  document.getElementById('duelLeaderboardNavButton').addEventListener('click', () => {
    window.location.href = 'leaderboardPage.html?tab=duel';
  });
  document.getElementById('duelHomeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  requestAnimationFrame(() => {
    document.getElementById('duelResultScreen').classList.add('result-screen--visible');
  });

  triggerLeaderboardButtonBlink('duelLeaderboardNavButton');
}
