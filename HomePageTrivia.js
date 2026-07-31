document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

function initHomePage() {
  const categoryCards = document.querySelectorAll('.category-card');

  categoryCards.forEach((card) => {
    card.addEventListener('click', () => handleCategoryClick(card));
  });

  renderPlayerBadge(document.getElementById('homePlayerBadgeContainer'), { editable: true });

  document.getElementById('leaderboardNavButton').addEventListener('click', () => {
    window.location.href = 'leaderboardPage.html';
  });

  document.getElementById('settingsButton').addEventListener('click', () => {
    openSettingsModal();
  });

  document.getElementById('vsPlayerButton').addEventListener('click', () => {
    if (hasPlayerProfile()) {
      openDuelSetupModal();
      return;
    }
    openProfileModal({ onConfirm: () => openDuelSetupModal() });
  });

  document.getElementById('quickGameButton').addEventListener('click', () => {
    if (hasPlayerProfile()) {
      startQuickGame();
      return;
    }
    openProfileModal({ onConfirm: () => startQuickGame() });
  });
}

async function startQuickGame() {
  const response = await fetch('questions.json', { cache: 'no-store' });
  const categoryData = await response.json();

  const categories = Object.keys(categoryData);
  const category = categories[Math.floor(Math.random() * categories.length)];

  const subKeys = Object.keys(categoryData[category].subcategories);
  const sub = subKeys[Math.floor(Math.random() * subKeys.length)];

  const count = categoryData[category].subcategories[sub].questions.length;

  window.location.href = `questPageTrivia.html?category=${category}&sub=${sub}&count=${count}`;
}

function handleCategoryClick(card) {
  const category = card.dataset.category;
  const targetUrl = `subCategoryPage.html?category=${category}`;

  if (hasPlayerProfile()) {
    window.location.href = targetUrl;
    return;
  }

  openProfileModal({
    onConfirm: () => {
      window.location.href = targetUrl;
    },
  });
}
