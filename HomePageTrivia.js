document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

function initHomePage() {
  const categoryCards = document.querySelectorAll('.category-card');

  categoryCards.forEach((card) => {
    card.addEventListener('click', () => handleCategoryClick(card));
  });

  renderPlayerBadge(document.getElementById('homePlayerBadgeContainer'), { editable: true });
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
