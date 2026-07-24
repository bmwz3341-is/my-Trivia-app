const PLAYER_PROFILE_STORAGE_KEY = 'triviaPlayerProfile';
const PLAYER_ID_STORAGE_KEY = 'triviaPlayerId';

const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x';

const AVATAR_OPTIONS = [
  { id: 'ninja', name: 'נינג\'ה', style: 'adventurer', seed: 'ninja-shadow-99' },
  { id: 'iceMage', name: 'קוסמת קרח', style: 'adventurer', seed: 'frost-mage-12' },
  { id: 'fireWarrior', name: 'לוחם אש', style: 'adventurer', seed: 'blaze-warrior-5' },
  { id: 'wizard', name: 'קוסם', style: 'adventurer', seed: 'arcane-wizard-8' },
  { id: 'robotOne', name: 'רובוט קרבי', style: 'bottts', seed: 'battle-bot-3' },
  { id: 'robotTwo', name: 'דרואיד חלל', style: 'bottts', seed: 'space-droid-21' },
  { id: 'robotThree', name: 'רובוט ידידותי', style: 'bottts', seed: 'friendly-bot-17' },
  { id: 'pixelHero', name: 'גיבור פיקסלים', style: 'pixel-art', seed: 'pixel-hero-1' },
  { id: 'pixelRogue', name: 'שודד רטרו', style: 'pixel-art', seed: 'retro-rogue-6' },
  { id: 'pixelKnight', name: 'אביר 8-ביט', style: 'pixel-art', seed: 'eight-bit-knight-9' },
  { id: 'cartoonHero', name: 'גיבור-על מצויר', style: 'big-smile', seed: 'super-hero-14' },
  { id: 'cartoonMage', name: 'קוסמת מצוירת', style: 'big-smile', seed: 'cartoon-mage-2' },
  { id: 'steelGuardian', name: 'שומר הפלדה', style: 'avataaars', seed: 'steel-guardian-1' },
  { id: 'crimsonBolt', name: 'הברק הארגמן', style: 'avataaars', seed: 'crimson-bolt-4' },
  { id: 'shadowWeb', name: 'לוחם הרשת', style: 'avataaars', seed: 'shadow-web-7' },
  { id: 'skyDefender', name: 'מגן השמיים', style: 'avataaars', seed: 'sky-defender-2' },
  { id: 'ironTitan', name: 'טיטאן הברזל', style: 'bottts', seed: 'iron-titan-9' },
  { id: 'mysticShield', name: 'המגן המיסטי', style: 'personas', seed: 'mystic-shield-3' },
  { id: 'junglePathfinder', name: 'גששת ג\'ונגל', style: 'micah', seed: 'jungle-pathfinder-3' },
  { id: 'starGuardian', name: 'שומרת הכוכבים', style: 'micah', seed: 'star-guardian-8' },
  { id: 'desertNomad', name: 'נווד המדבר', style: 'notionists', seed: 'desert-nomad-5' },
  { id: 'seaPirate', name: 'פיראט הים', style: 'notionists', seed: 'sea-pirate-2' },
  { id: 'circusJester', name: 'ליצן קרקס', style: 'fun-emoji', seed: 'circus-jester-6' },
  { id: 'arenaChampion', name: 'אלוף הזירה', style: 'thumbs', seed: 'arena-champion-9' },
  { id: 'forestSpirit', name: 'רוח היער', style: 'lorelei', seed: 'forest-spirit-4' },
  { id: 'stormRider', name: 'רוכב הסערה', style: 'open-peeps', seed: 'storm-rider-7' },
  { id: 'jollyGrandpa', name: 'סבא עליז', style: 'avataaars', seed: 'jolly-grandpa-11' },
  { id: 'wiseElder', name: 'הזקן החכם', style: 'avataaars', seed: 'wise-elder-6' },
  { id: 'grannyWarrior', name: 'סבתא לוחמת', style: 'avataaars', seed: 'granny-warrior-3' },
  { id: 'gigglingGoblin', name: 'גובלין צחקן', style: 'croodles', seed: 'giggling-goblin-9' },
  { id: 'sillyProfessor', name: 'פרופסור מצחיק', style: 'croodles', seed: 'silly-professor-2' },
  { id: 'happyChef', name: 'טבח שמח', style: 'big-smile', seed: 'happy-chef-7' },
  { id: 'cheerfulExplorer', name: 'חוקרת שמחה', style: 'big-smile', seed: 'cheerful-explorer-5' },
  { id: 'grinningPrankster', name: 'קונדס מחייך', style: 'fun-emoji', seed: 'grinning-prankster-8' },
];

function getAvatarById(avatarId) {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) || AVATAR_OPTIONS[0];
}

function getAvatarUrl(avatarId) {
  const avatar = getAvatarById(avatarId);
  return `${DICEBEAR_BASE_URL}/${avatar.style}/svg?seed=${encodeURIComponent(avatar.seed)}`;
}

function getAvatarMarkup(avatarId) {
  const avatar = getAvatarById(avatarId);
  return `<img src="${getAvatarUrl(avatarId)}" alt="${escapeHtml(avatar.name)}" loading="lazy">`;
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
  if (!id) {
    id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      localStorage.setItem(PLAYER_ID_STORAGE_KEY, id);
    } catch (err) {
      // ignore storage failures (e.g. private browsing quota)
    }
  }
  return id;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getPlayerProfile() {
  try {
    const raw = localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    return profile && profile.name && profile.avatar ? profile : null;
  } catch (err) {
    return null;
  }
}

function hasPlayerProfile() {
  return getPlayerProfile() !== null;
}

function savePlayerProfile(name, avatar) {
  const profile = { name: name.trim(), avatar };
  try {
    localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
  return profile;
}

let profileModalState = { selectedAvatar: null, onConfirm: null };

function ensureProfileModal() {
  if (document.getElementById('profileModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'profileModalOverlay';
  overlay.className = 'profile-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
      <h3 id="profileModalTitle" class="profile-modal__title">בחרו דמות והזינו שם</h3>
      <p class="profile-modal__hint">הדמות והשם ילוו אתכם במהלך המשחק ובלוח התוצאות</p>
      <div id="avatarGrid" class="avatar-grid"></div>
      <input id="playerNameInput" class="profile-modal__input" type="text" maxlength="16" placeholder="הזינו שם שחקן" autocomplete="off">
      <button id="profileStartButton" class="profile-modal__start-button" type="button" disabled>התחל</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const avatarGrid = overlay.querySelector('#avatarGrid');
  AVATAR_OPTIONS.forEach((avatar) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'avatar-option';
    button.innerHTML = getAvatarMarkup(avatar.id);
    button.dataset.avatar = avatar.id;
    button.setAttribute('aria-label', `בחר דמות ${avatar.name}`);
    button.addEventListener('click', () => selectAvatar(avatar.id));
    avatarGrid.appendChild(button);
  });

  overlay.querySelector('#playerNameInput').addEventListener('input', updateStartButtonState);
  overlay.querySelector('#profileStartButton').addEventListener('click', confirmProfileModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeProfileModal();
  });
}

function selectAvatar(avatarId) {
  profileModalState.selectedAvatar = avatarId;
  document.querySelectorAll('#avatarGrid .avatar-option').forEach((btn) => {
    btn.classList.toggle('avatar-option--selected', btn.dataset.avatar === avatarId);
  });
  updateStartButtonState();
}

function updateStartButtonState() {
  const name = document.getElementById('playerNameInput').value.trim();
  document.getElementById('profileStartButton').disabled = !(name && profileModalState.selectedAvatar);
}

function confirmProfileModal() {
  const name = document.getElementById('playerNameInput').value.trim();
  if (!name || !profileModalState.selectedAvatar) return;
  savePlayerProfile(name, profileModalState.selectedAvatar);
  const onConfirm = profileModalState.onConfirm;
  closeProfileModal();
  if (typeof onConfirm === 'function') onConfirm();
}

function closeProfileModal() {
  const overlay = document.getElementById('profileModalOverlay');
  if (overlay) overlay.hidden = true;
  profileModalState.onConfirm = null;
}

function openProfileModal({ onConfirm } = {}) {
  ensureProfileModal();
  const existing = getPlayerProfile();
  profileModalState.selectedAvatar = existing ? existing.avatar : null;
  profileModalState.onConfirm = onConfirm || null;

  const nameInput = document.getElementById('playerNameInput');
  nameInput.value = existing ? existing.name : '';

  document.querySelectorAll('#avatarGrid .avatar-option').forEach((btn) => {
    btn.classList.toggle('avatar-option--selected', !!existing && btn.dataset.avatar === existing.avatar);
  });

  updateStartButtonState();
  document.getElementById('profileModalOverlay').hidden = false;
}

function renderPlayerBadge(container, { editable = false, profile: profileOverride = null } = {}) {
  if (!container) return;
  container.innerHTML = '';
  const profile = profileOverride || getPlayerProfile();
  if (!profile) return;

  const badge = document.createElement(editable ? 'button' : 'div');
  badge.className = 'player-badge';
  if (editable) {
    badge.type = 'button';
    badge.setAttribute('aria-label', 'ערוך פרופיל שחקן');
  }
  badge.innerHTML = `
    <span class="player-badge__avatar">${getAvatarMarkup(profile.avatar)}</span>
    <span class="player-badge__name">${escapeHtml(profile.name)}</span>
    ${editable ? '<span class="player-badge__edit">✎</span>' : ''}
  `;
  if (editable) {
    badge.addEventListener('click', () => {
      openProfileModal({ onConfirm: () => renderPlayerBadge(container, { editable: true }) });
    });
  }
  container.appendChild(badge);
}
