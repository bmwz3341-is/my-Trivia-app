// Settings screen: audio/gameplay/haptics preferences + data-reset actions.
// Follows the same pattern as playerProfile.js — plain globals, DOM built lazily on first use,
// state persisted to localStorage so it survives between sessions.

const TRIVIA_SETTINGS_STORAGE_KEY = 'triviaSettings';
const TRIVIA_HIGH_SCORES_STORAGE_KEY = 'triviaHighScores';
const TRIVIA_QUEUE_STORAGE_PREFIX = 'triviaQueue::';
const APP_VERSION = '1.0.0';

const TIMER_DURATION_OPTIONS = [
  { value: 20, label: 'רגוע', hint: '20 שניות' },
  { value: 15, label: 'רגיל', hint: '15 שניות' },
  { value: 5, label: 'מהיר מאוד', hint: '5 שניות' },
];

const THEME_OPTIONS = [
  { value: 'default', label: 'צבעוני', hint: 'ערכת הנושא הרגילה' },
  { value: 'amoled', label: 'כהה מלא', hint: 'AMOLED Dark' },
];

const DEFAULT_TRIVIA_SETTINGS = {
  soundEffects: true,
  backgroundMusic: true,
  hapticFeedback: true,
  timerDuration: 20,
  theme: 'default',
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
  applyTriviaTheme(next.theme);
  window.dispatchEvent(new CustomEvent('triviaSettingsChanged', { detail: next }));
  return next;
}

// Short vibration on a wrong answer, gated by the hapticFeedback setting.
// navigator.vibrate is unsupported on iOS Safari and some browsers — guarded
// so calling this is always a safe no-op there.
function triggerWrongAnswerHaptic() {
  if (!getTriviaSettings().hapticFeedback) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate([250, 100, 250]);
}

// Sets a data-theme attribute on <html> so every page's CSS can react to it
// (see the `html[data-theme="amoled"]` overrides in each page's stylesheet).
function applyTriviaTheme(theme) {
  if (theme === 'amoled') {
    document.documentElement.setAttribute('data-theme', 'amoled');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// Runs as soon as this script loads on any page, so the saved theme is applied
// on load — not just when the settings modal (which only exists on the home
// page) is opened.
applyTriviaTheme(getTriviaSettings().theme);

function resetQuestionHistory() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(TRIVIA_QUEUE_STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Deletes this player's real score data — the leaderboard is Firestore-backed
// (see leaderboard.js), so a local-only reset would have been a no-op.
async function resetHighScores() {
  await ensurePlayerAuth();
  const playerId = getOrCreatePlayerId();
  await Promise.all([
    deleteLeaderboardEntry(playerId, LEADERBOARD_COLLECTION),
    deleteLeaderboardEntry(playerId, DUEL_LEADERBOARD_COLLECTION),
  ]);
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
          <h3 class="settings-section__title">תצוגה</h3>
          <p class="settings-field-label">ערכת נושא</p>
          <div class="settings-segmented" id="themeSegmented">
            ${THEME_OPTIONS.map((option) => `
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

  overlay.querySelector('#themeSegmented').addEventListener('click', (event) => {
    const button = event.target.closest('.settings-segmented__option');
    if (!button) return;
    saveTriviaSettings({ theme: button.dataset.value });
    updateThemeSelection(button.dataset.value);
  });

  overlay.querySelector('#resetQuestionHistoryButton').addEventListener('click', (event) => {
    if (!window.confirm('לאפס את היסטוריית השאלות שהוגרלו? כל השאלות יוכלו לחזור ולהיבחר מחדש.')) return;
    resetQuestionHistory();
    flashButtonConfirmation(event.currentTarget, '✓ ההיסטוריה אופסה');
  });

  overlay.querySelector('#resetHighScoresButton').addEventListener('click', async (event) => {
    if (!window.confirm('לאפס את השיאים והתוצאות שלכם? הפעולה אינה הפיכה.')) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await resetHighScores();
      flashButtonConfirmation(button, '✓ השיאים אופסו');
    } catch (err) {
      button.disabled = false;
      window.alert('לא הצלחנו לאפס את השיאים כרגע. בדקו את החיבור לאינטרנט ונסו שוב.');
    }
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

function updateThemeSelection(selectedValue) {
  document.querySelectorAll('#themeSegmented .settings-segmented__option').forEach((button) => {
    button.classList.toggle('settings-segmented__option--selected', button.dataset.value === selectedValue);
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
  updateThemeSelection(settings.theme);

  document.getElementById('settingsModalOverlay').hidden = false;
}

function closeSettingsModal() {
  const overlay = document.getElementById('settingsModalOverlay');
  if (overlay) overlay.hidden = true;
}
