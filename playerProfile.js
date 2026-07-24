const PLAYER_PROFILE_STORAGE_KEY = 'triviaPlayerProfile';
const PLAYER_ID_STORAGE_KEY = 'triviaPlayerId';

const AVATAR_OPTIONS = ['🦁', '🐯', '🦊', '🐼', '🐨', '🐵', '🦄', '🐲', '🤖', '👾', '🦉', '🐺'];

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
    button.textContent = avatar;
    button.dataset.avatar = avatar;
    button.setAttribute('aria-label', `בחר דמות ${avatar}`);
    button.addEventListener('click', () => selectAvatar(avatar));
    avatarGrid.appendChild(button);
  });

  overlay.querySelector('#playerNameInput').addEventListener('input', updateStartButtonState);
  overlay.querySelector('#profileStartButton').addEventListener('click', confirmProfileModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeProfileModal();
  });
}

function selectAvatar(avatar) {
  profileModalState.selectedAvatar = avatar;
  document.querySelectorAll('#avatarGrid .avatar-option').forEach((btn) => {
    btn.classList.toggle('avatar-option--selected', btn.dataset.avatar === avatar);
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
    <span class="player-badge__avatar">${profile.avatar}</span>
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
