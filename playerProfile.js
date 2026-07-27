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
  { id: 'thunderFist', name: 'אגרוף הרעם', style: 'avataaars', seed: 'thunder-fist-1' },
  { id: 'emeraldFlash', name: 'הברק האזמרגד', style: 'avataaars', seed: 'emerald-flash-6' },
  { id: 'shadowNinja', name: 'נינג\'ה הצללים', style: 'adventurer', seed: 'shadow-ninja-14' },
  { id: 'galacticRanger', name: 'השומר הגלקטי', style: 'bottts', seed: 'galactic-ranger-4' },
  { id: 'mightyFalcon', name: 'הבז האדיר', style: 'avataaars', seed: 'mighty-falcon-9' },
  { id: 'crystalSorceress', name: 'מכשפת הבדולח', style: 'big-smile', seed: 'crystal-sorceress-3' },
  { id: 'flameGuardian', name: 'שומר הלהבה', style: 'avataaars', seed: 'flame-guardian-8' },
  { id: 'cyberKnight', name: 'האביר הסייברי', style: 'bottts', seed: 'cyber-knight-2' },
  { id: 'moonHuntress', name: 'צידת הירח', style: 'micah', seed: 'moon-huntress-5' },
  { id: 'goldenPhoenix', name: 'עוף החול הזהוב', style: 'avataaars', seed: 'golden-phoenix-7' },
  { id: 'frostTitan', name: 'טיטאן הכפור', style: 'avataaars', seed: 'frost-titan-1' },
  { id: 'cosmicVoyager', name: 'הנווד הקוסמי', style: 'notionists', seed: 'cosmic-voyager-6' },
  { id: 'laughingJester', name: 'הליצן הצוחק', style: 'fun-emoji', seed: 'laughing-jester-3' },
  { id: 'dreamyPainter', name: 'הצייר החולמני', style: 'croodles', seed: 'dreamy-painter-9' },
  { id: 'brightInventor', name: 'הממציא הבהיר', style: 'big-smile', seed: 'bright-inventor-4' },
  { id: 'gentleGiant', name: 'הענק הרך', style: 'open-peeps', seed: 'gentle-giant-2' },
  { id: 'swiftArrow', name: 'החץ המהיר', style: 'avataaars', seed: 'swift-arrow-7' },
  { id: 'mysticOwl', name: 'הינשוף המיסטי', style: 'lorelei', seed: 'mystic-owl-5' },
  { id: 'candyWitch', name: 'מכשפת הממתקים', style: 'big-smile', seed: 'candy-witch-8' },
  { id: 'steelPhantom', name: 'הרוח הפלדה', style: 'bottts', seed: 'steel-phantom-3' },
  { id: 'valiantScout', name: 'הצופה האמיץ', style: 'personas', seed: 'valiant-scout-1' },
  { id: 'silverHawk', name: 'הנץ הכסוף', style: 'personas', seed: 'silver-hawk-2' },
  { id: 'nobleRanger', name: 'השומר האציל', style: 'personas', seed: 'noble-ranger-3' },
  { id: 'duskWanderer', name: 'נווד הדמדומים', style: 'personas', seed: 'dusk-wanderer-4' },
  { id: 'amberScholar', name: 'המלומד הענברי', style: 'personas', seed: 'amber-scholar-5' },
  { id: 'quietArtisan', name: 'האומן השקט', style: 'micah', seed: 'quiet-artisan-1' },
  { id: 'brightVoyager', name: 'המפליג הבהיר', style: 'micah', seed: 'bright-voyager-2' },
  { id: 'calmSentinel', name: 'הזקיף הרגוע', style: 'micah', seed: 'calm-sentinel-3' },
  { id: 'gracefulDancer', name: 'הרקדנית החיננית', style: 'micah', seed: 'graceful-dancer-4' },
  { id: 'honestMerchant', name: 'הסוחר הישר', style: 'micah', seed: 'honest-merchant-5' },
  { id: 'velvetSinger', name: 'הזמרת הקטיפה', style: 'notionists', seed: 'velvet-singer-1' },
  { id: 'keenArcher', name: 'הקשת החדה', style: 'notionists', seed: 'keen-archer-2' },
  { id: 'cleverEngineer', name: 'המהנדסת החכמה', style: 'notionists', seed: 'clever-engineer-3' },
  { id: 'warmHealer', name: 'המרפא החם', style: 'notionists', seed: 'warm-healer-4' },
  { id: 'boldCaptain', name: 'הקפטן הנועז', style: 'notionists', seed: 'bold-captain-5' },
  { id: 'sunnyFarmer', name: 'החקלאי השמשי', style: 'open-peeps', seed: 'sunny-farmer-1' },
  { id: 'kindTeacher', name: 'המורה האדיבה', style: 'open-peeps', seed: 'kind-teacher-2' },
  { id: 'humbleMonk', name: 'הנזיר הצנוע', style: 'open-peeps', seed: 'humble-monk-3' },
  { id: 'proudAthlete', name: 'הספורטאי הגאה', style: 'open-peeps', seed: 'proud-athlete-4' },
  { id: 'curiousStudent', name: 'הסטודנטית הסקרנית', style: 'open-peeps', seed: 'curious-student-5' },
  { id: 'elegantDuchess', name: 'הדוכסית האלגנטית', style: 'lorelei', seed: 'elegant-duchess-1' },
  { id: 'fiercePirateQueen', name: 'מלכת הפיראטים העזה', style: 'lorelei', seed: 'fierce-pirate-queen-2' },
  { id: 'wittyDetective', name: 'הבלשית השנונה', style: 'lorelei', seed: 'witty-detective-3' },
  { id: 'dignifiedElder', name: 'הזקנה המכובדת', style: 'lorelei', seed: 'dignified-elder-4' },
  { id: 'cheerfulBaker', name: 'האופה השמחה', style: 'lorelei', seed: 'cheerful-baker-5' },
  { id: 'dogPuppyFace', name: 'גור כלבים', emoji: '🐶' },
  { id: 'dogClassic', name: 'כלב', emoji: '🐕' },
  { id: 'dogPoodleEmoji', name: 'פודל', emoji: '🐩' },
  { id: 'dogGuide', name: 'כלב נחייה', emoji: '🦮' },
  { id: 'dogService', name: 'כלב שירות', emoji: '🐕‍🦺' },
  { id: 'everydayDad', name: 'אבא', style: 'personas', seed: 'everyday-dad-1' },
  { id: 'everydayMom', name: 'אמא', style: 'personas', seed: 'everyday-mom-2' },
  { id: 'youngMan', name: 'גבר צעיר', style: 'micah', seed: 'young-man-3' },
  { id: 'youngWoman', name: 'אישה צעירה', style: 'micah', seed: 'young-woman-4' },
  { id: 'littleBoy', name: 'ילד', style: 'open-peeps', seed: 'little-boy-5' },
  { id: 'littleGirl', name: 'ילדה', style: 'open-peeps', seed: 'little-girl-6' },
  { id: 'grandpaFigure', name: 'סבא', style: 'notionists', seed: 'grandpa-figure-7' },
  { id: 'grandmaFigure', name: 'סבתא', style: 'notionists', seed: 'grandma-figure-8' },
  { id: 'teenBoy', name: 'נער', style: 'lorelei', seed: 'teen-boy-9' },
  { id: 'teenGirl', name: 'נערה', style: 'lorelei', seed: 'teen-girl-10' },
  { id: 'carFordModelT', name: 'פורד מודל T', url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/1924_Ford_Model_T_Flivver_IAA_2023_1X7A0610.jpg' },
  { id: 'carVwBeetle', name: 'פולקסווגן חיפושית', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/VW_K%C3%A4fer_193909.jpg' },
  { id: 'carCadillacEldorado', name: 'קאדילק אלדוראדו 1959', url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/1959_Cadillac_Eldorado_Biarritz.jpg' },
  { id: 'carFordMustang', name: 'פורד מוסטנג 1965', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/1965_Ford_Mustang_Convertible_Classic-Gala_2021_1X7A0275.jpg' },
  { id: 'carChevyBelAir', name: 'שברולט בל אייר 1957', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Chevrolet_Bel_Air_1957_Ebern_2019_6200531.jpg' },
  { id: 'carCitroen2CV', name: 'סיטרואן 2CV', url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Citroen_2CV_Warwick_Classic_Car_Show_Warwick_ENGLAND_August_2017.jpg' },
  { id: 'carFiat500', name: 'פיאט 500 קלאסית', url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Fiat_500_1964.jpg' },
  { id: 'carVolvoPV544', name: 'וולוו PV544', url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Volvo_pv544.jpg' },
  { id: 'carJaguarEType', name: 'יגואר E-Type', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Jaguar_E-Type_Roadster_%281969%29_Classic-Gala_2021_1X7A0126.jpg' },
  { id: 'carPorsche356', name: 'פורשה 356', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Porsche_356_A_%282014-09-13_7068_Sp%29.jpg' },
];

function getAvatarById(avatarId) {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) || AVATAR_OPTIONS[0];
}

function getAvatarUrl(avatarId) {
  const avatar = getAvatarById(avatarId);
  if (avatar.url) return avatar.url;
  return `${DICEBEAR_BASE_URL}/${avatar.style}/svg?seed=${encodeURIComponent(avatar.seed)}`;
}

function getAvatarMarkup(avatarId) {
  const avatar = getAvatarById(avatarId);
  if (avatar.emoji) {
    return `<span class="avatar-emoji" role="img" aria-label="${escapeHtml(avatar.name)}">${avatar.emoji}</span>`;
  }
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

let authReadyPromise = null;

function ensurePlayerAuth() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          resolve(user.uid);
        } else {
          firebase.auth().signInAnonymously().catch(reject);
        }
      }, reject);
    });
  }
  return authReadyPromise;
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
