document.addEventListener('DOMContentLoaded', () => {
  initResultPage();
});

function initResultPage() {
  const raw = sessionStorage.getItem('triviaLastResult');
  if (!raw) {
    window.location.href = 'index.html';
    return;
  }
  sessionStorage.removeItem('triviaLastResult');

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    window.location.href = 'index.html';
    return;
  }

  renderPlayerBadge(document.getElementById('resultPlayerBadgeContainer'), { profile: getPlayerProfile() });

  document.getElementById('resultTitle').textContent = result.title;
  document.getElementById('resultScore').textContent = result.scoreText;
  document.getElementById('resultAccuracy').textContent = result.accuracyText;
  document.getElementById('resultAccuracy').classList.add('result-accuracy--blink');
  document.getElementById('leaderboardRankInfo').textContent = result.rankInfo;

  const list = document.getElementById('resultHistoryList');
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

  document.getElementById('leaderboardNavButton').addEventListener('click', () => {
    window.location.href = 'leaderboardPage.html';
  });
  document.getElementById('restartButton').addEventListener('click', () => {
    window.location.href = result.mode === 'quick'
      ? 'questPageTrivia.html?mode=quick'
      : `questPageTrivia.html?category=${encodeURIComponent(result.category)}&sub=${encodeURIComponent(result.subCategory)}`;
  });
  document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  requestAnimationFrame(() => {
    document.getElementById('questResultScreen').classList.add('result-screen--visible');
  });

  triggerLeaderboardButtonBlink('leaderboardNavButton');

  // iOS only allows audio playback in direct response to a real tap - the automatic
  // setTimeout-triggered celebration this replaced played silently there. Gating the sound
  // (and balloons, so they land together) behind a result-appropriate button tap guarantees
  // it works, at the cost of it no longer firing fully automatically.
  const celebrationButton = document.getElementById('resultCelebrationButton');
  if (result.accuracyRatio >= 0.8) {
    celebrationButton.textContent = 'כל הכבוד !';
    celebrationButton.hidden = false;
    celebrationButton.addEventListener('click', () => {
      celebrationButton.hidden = true;
      if (result.celebration === 'big' || result.celebration === 'small') {
        launchBalloonCelebration(result.celebration);
      }
      new Audio('sounds/driken5482-applause-cheer-236786.mp3').play().catch(() => {});
    }, { once: true });
  } else {
    celebrationButton.textContent = 'לא נורא בפעם הבאה 😉';
    celebrationButton.hidden = false;
    celebrationButton.addEventListener('click', () => {
      celebrationButton.hidden = true;
      new Audio('sounds/soundreality-downfall-3-208028.mp3').play().catch(() => {});
    }, { once: true });
  }
}
