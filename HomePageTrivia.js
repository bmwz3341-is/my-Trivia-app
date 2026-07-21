document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

function initHomePage() {
  const categoryCards = document.querySelectorAll('.category-card');

  categoryCards.forEach((card) => {
    card.addEventListener('click', () => handleCategoryClick(card));
  });
}

function handleCategoryClick(card) {
  const category = card.dataset.category;
  window.location.href = `questPageTrivia.html?category=${category}`;
}
