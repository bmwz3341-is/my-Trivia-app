const BALLOON_CELEBRATION_CONFIG = {
  big: {
    count: 112,
    icons: ['🎈', '🎉', '✨', '❤️', '🏆'],
    colors: ['#FF5E5E', '#FFC93C', '#4DD9C4', '#6C7CFF', '#FF7CE5'],
    sizeRange: [24, 44],
    durationRange: [5600, 9000],
    spawnSpread: 2400,
  },
  small: {
    count: 32,
    icons: ['🎈', '✨'],
    colors: ['#4DD9C4', '#6C7CFF'],
    sizeRange: [20, 28],
    durationRange: [4500, 5900],
    spawnSpread: 600,
  },
};

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function launchBalloonCelebration(tier) {
  const config = BALLOON_CELEBRATION_CONFIG[tier];
  if (!config) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const overlay = document.createElement('div');
  overlay.className = 'balloon-overlay';
  document.body.appendChild(overlay);

  const itemCount = prefersReducedMotion ? Math.min(6, config.count) : config.count;

  for (let i = 0; i < itemCount; i++) {
    const item = document.createElement('span');
    item.className = prefersReducedMotion ? 'balloon-item balloon-item--static' : 'balloon-item';
    item.textContent = config.icons[Math.floor(Math.random() * config.icons.length)];

    const left = Math.random() * 100;
    const size = randomInRange(config.sizeRange);
    const drift = `${(Math.random() * 80 - 40).toFixed(0)}px`;
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    item.style.left = `${left}%`;
    item.style.fontSize = `${size}px`;
    item.style.color = color;
    item.style.setProperty('--drift', drift);

    if (prefersReducedMotion) {
      item.style.top = `${30 + Math.random() * 30}%`;
      item.style.animationDelay = `${Math.random() * 300}ms`;
    } else {
      item.style.animationDuration = `${randomInRange(config.durationRange)}ms`;
      item.style.animationDelay = `${Math.random() * config.spawnSpread}ms`;
    }

    overlay.appendChild(item);
  }

  const cleanupDelay = prefersReducedMotion
    ? 1800
    : config.spawnSpread + config.durationRange[1] + 300;
  setTimeout(() => overlay.remove(), cleanupDelay);
}
