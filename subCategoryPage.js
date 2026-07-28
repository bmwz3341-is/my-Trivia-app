let CATEGORY_DATA = {};

const THEME_CORNER = {
  purple: { rank: 'A', suit: '♠' },
  teal: { rank: 'K', suit: '♦' },
  orange: { rank: 'Q', suit: '♣' },
  green: { rank: 'J', suit: '♥' },
};

document.addEventListener('DOMContentLoaded', () => {
  initSubCategoryPage();
});

async function initSubCategoryPage() {
  const response = await fetch('questions.json', { cache: 'no-store' });
  CATEGORY_DATA = await response.json();

  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');

  if (!CATEGORY_DATA[category]) {
    window.location.href = 'index.html';
    return;
  }

  const categoryData = CATEGORY_DATA[category];

  document.title = `טריוויה - ${categoryData.title}`;
  document.getElementById('mainCategoryTitle').textContent = categoryData.title;

  const corner = THEME_CORNER[categoryData.theme] || THEME_CORNER.purple;
  document.getElementById('cornerRank').textContent = corner.rank;
  document.getElementById('cornerSuit').textContent = corner.suit;

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  renderSubCategories(category, categoryData);
}

function renderSubCategories(category, categoryData) {
  const rows = document.getElementById('subCategoryRows');
  rows.innerHTML = '';

  Object.entries(categoryData.subcategories).forEach(([subKey, sub]) => {
    const count = sub.questions.length;

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'sub-category-row';
    row.innerHTML = `
      <span class="sub-category-row__label">${sub.title}</span>
      <span class="sub-category-row__count">${count}</span>
    `;
    row.addEventListener('click', () => {
      window.location.href = `questPageTrivia.html?category=${category}&sub=${subKey}&count=${count}`;
    });
    rows.appendChild(row);
  });
}
