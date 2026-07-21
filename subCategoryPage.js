let CATEGORY_DATA = {};

document.addEventListener('DOMContentLoaded', () => {
  initSubCategoryPage();
});

async function initSubCategoryPage() {
  const response = await fetch('questions.json');
  CATEGORY_DATA = await response.json();

  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');

  if (!CATEGORY_DATA[category]) {
    window.location.href = 'index.html';
    return;
  }

  const categoryData = CATEGORY_DATA[category];

  document.getElementById('mainCategoryTitle').textContent = categoryData.title;
  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  renderSubCategories(category, categoryData);
}

function renderSubCategories(category, categoryData) {
  const grid = document.getElementById('subCategoryGrid');
  grid.innerHTML = '';

  Object.entries(categoryData.subcategories).forEach(([subKey, sub]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sub-category-card sub-category-card--${categoryData.theme}`;
    button.innerHTML = `
      <span class="sub-category-card__title">${sub.title}</span>
      <span class="sub-category-card__tag">${sub.questions.length} שאלות</span>
    `;
    button.addEventListener('click', () => {
      window.location.href = `questPageTrivia.html?category=${category}&sub=${subKey}`;
    });
    grid.appendChild(button);
  });
}
