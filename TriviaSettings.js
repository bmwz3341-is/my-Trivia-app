// Settings screen: audio/gameplay/haptics preferences + data-reset actions.
// Follows the same pattern as playerProfile.js — plain globals, DOM built lazily on first use,
// state persisted to localStorage so it survives between sessions.

const TRIVIA_SETTINGS_STORAGE_KEY = 'triviaSettings';
const TRIVIA_HIGH_SCORES_STORAGE_KEY = 'triviaHighScores';
const TRIVIA_QUEUE_STORAGE_PREFIX = 'triviaQueue::';
const APP_VERSION = '1.0.0';

const TIMER_DURATION_OPTIONS = [
  { value: 5, label: 'מהיר מאוד', hint: '5 שניות' },
  { value: 10, label: 'רגיל', hint: '10 שניות' },
  { value: 15, label: 'רגוע', hint: '15 שניות' },
];

const DEFAULT_TRIVIA_SETTINGS = {
  soundEffects: true,
  backgroundMusic: true,
  hapticFeedback: true,
  timerDuration: 10,
};

function getTriviaSettings() {
  try {
    const raw = localStorage.getItem(TRIVIA_SETTINGS_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return { ...DEFAULT_TRIVIA_SETTINGS, ...saved };
  } catch (err) {
    return { ...DEFAULT_TRIVIA_SETTINGS };
  }
}

function saveTriviaSettings(partialSettings) {
  const next = { ...getTriviaSettings(), ...partialSettings };
  try {
    localStorage.setItem(TRIVIA_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
  window.dispatchEvent(new CustomEvent('triviaSettingsChanged', { detail: next }));
  return next;
}

function resetQuestionHistory() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(TRIVIA_QUEUE_STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function resetHighScores() {
  // No separate local high-score cache exists yet in this codebase (the leaderboard
  // is Firestore-backed via leaderboardPage.js/playerProfile.js) — this clears the
  // reserved local key and notifies listeners so any local cache can react too.
  localStorage.removeItem(TRIVIA_HIGH_SCORES_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('triviaHighScoresReset'));
}

let settingsModalState = { confirmTimeoutId: null };

function ensureSettingsModal() {
  if (document.getElementById('settingsModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'settingsModalOverlay';
  overlay.className = 'settings-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle">
      <div class="settings-modal__header">
        <h2 id="settingsModalTitle" class="settings-modal__title">הגדרות</h2>
        <button type="button" class="settings-close-button" id="settingsCloseButton" aria-label="סגור">✕</button>
      </div>

      <div class="settings-modal__body">
        <section class="settings-section">
          <h3 class="settings-section__title">שמע ואפקטים</h3>
          ${renderToggleRow('soundEffects', 'אפקטים קוליים')}
          ${renderToggleRow('backgroundMusic', 'מוזיקת רקע')}
          ${renderToggleRow('hapticFeedback', 'רטט (Haptic Feedback)')}
        </section>

        <section class="settings-section">
          <h3 class="settings-section__title">משחק ואתגר</h3>
          <p class="settings-field-label">משך זמן לשאלה</p>
          <div class="settings-segmented" id="timerDurationSegmented">
            ${TIMER_DURATION_OPTIONS.map((option) => `
              <button type="button" class="settings-segmented__option" data-value="${option.value}">
                <span class="settings-segmented__label">${option.label}</span>
                <span class="settings-segmented__hint">${option.hint}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="settings-section">
          <h3 class="settings-section__title">נתונים ומערכת</h3>
          <button type="button" class="settings-danger-button" id="resetQuestionHistoryButton">
            איפוס היסטוריית שאלות
          </button>
          <button type="button" class="settings-danger-button" id="resetHighScoresButton">
            איפוס שיאים ותוצאות
          </button>
        </section>

        <section class="settings-section settings-section--about">
          <p class="settings-about-text">Tick Tock Trivia · גרסה ${APP_VERSION}</p>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.settings-toggle input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', () => {
      saveTriviaSettings({ [input.dataset.setting]: input.checked });
    });
  });

  overlay.querySelector('#timerDurationSegmented').addEventListener('click', (event) => {
    const button = event.target.closest('.settings-segmented__option');
    if (!button) return;
    saveTriviaSettings({ timerDuration: Number(button.dataset.value) });
    updateTimerDurationSelection(Number(button.dataset.value));
  });

  overlay.querySelector('#resetQuestionHistoryButton').addEventListener('click', (event) => {
    if (!window.confirm('לאפס את היסטוריית השאלות שהוגרלו? כל השאלות יוכלו לחזור ולהיבחר מחדש.')) return;
    resetQuestionHistory();
    flashButtonConfirmation(event.currentTarget, '✓ ההיסטוריה אופסה');
  });

  overlay.querySelector('#resetHighScoresButton').addEventListener('click', (event) => {
    if (!window.confirm('לאפס את השיאים והתוצאות המקומיים?')) return;
    resetHighScores();
    flashButtonConfirmation(event.currentTarget, '✓ השיאים אופסו');
  });

  overlay.querySelector('#settingsCloseButton').addEventListener('click', closeSettingsModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSettingsModal();
  });
}

function renderToggleRow(settingKey, label) {
  return `
    <label class="settings-row">
      <span class="settings-row__label">${label}</span>
      <span class="settings-toggle">
        <input type="checkbox" data-setting="${settingKey}">
        <span class="settings-toggle__track"><span class="settings-toggle__thumb"></span></span>
      </span>
    </label>
  `;
}

function updateTimerDurationSelection(selectedValue) {
  document.querySelectorAll('#timerDurationSegmented .settings-segmented__option').forEach((button) => {
    button.classList.toggle('settings-segmented__option--selected', Number(button.dataset.value) === selectedValue);
  });
}

function flashButtonConfirmation(button, confirmationText) {
  clearTimeout(settingsModalState.confirmTimeoutId);
  const originalText = button.textContent;
  button.textContent = confirmationText;
  button.disabled = true;
  settingsModalState.confirmTimeoutId = setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1400);
}

function openSettingsModal() {
  ensureSettingsModal();
  const settings = getTriviaSettings();

  document.querySelectorAll('.settings-toggle input[type="checkbox"]').forEach((input) => {
    input.checked = !!settings[input.dataset.setting];
  });
  updateTimerDurationSelection(settings.timerDuration);

  document.getElementById('settingsModalOverlay').hidden = false;
}

function closeSettingsModal() {
  const overlay = document.getElementById('settingsModalOverlay');
  if (overlay) overlay.hidden = true;
}
