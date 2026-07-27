const LEADERBOARD_COLLECTION = 'leaderboard';
const DUEL_LEADERBOARD_COLLECTION = 'duelLeaderboard';
const LEADERBOARD_DISPLAY_LIMIT = 20;

function leaderboardCollectionRef(collectionName) {
  return firebase.firestore().collection(collectionName);
}

async function addLeaderboardEntry({ playerId, name, avatar, score, category }, collectionName = LEADERBOARD_COLLECTION) {
  const ref = leaderboardCollectionRef(collectionName);
  const docRef = ref.doc(playerId);

  await firebase.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const bestScore = doc.exists ? Math.max(doc.data().score, score) : score;
    tx.set(docRef, {
      name,
      avatar,
      score: bestScore,
      category: category || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });

  const bestDoc = await docRef.get();
  const entry = { id: docRef.id, ...bestDoc.data() };

  const [higherScoresSnapshot, totalSnapshot] = await Promise.all([
    ref.where('score', '>', entry.score).get(),
    ref.get(),
  ]);

  return {
    entry,
    rank: higherScoresSnapshot.size + 1,
    total: totalSnapshot.size,
  };
}

function buildLeaderboardItem(entry, rank, isCurrent) {
  const item = document.createElement('li');
  item.className = `leaderboard-item${isCurrent ? ' leaderboard-item--current' : ''}`;
  const avatarName = getAvatarById(entry.avatar).name;
  item.innerHTML = `
    <span class="leaderboard-item__rank">#${rank}</span>
    <span class="leaderboard-item__avatar">${getAvatarMarkup(entry.avatar)}</span>
    <span class="leaderboard-item__name">
      <span class="leaderboard-item__name-text">${escapeHtml(entry.name)}</span>
      <span class="leaderboard-item__avatar-name">${escapeHtml(avatarName)}</span>
    </span>
    <span class="leaderboard-item__category">${escapeHtml(entry.category || '')}</span>
    <span class="leaderboard-item__score">${entry.score} נק'</span>
  `;
  return item;
}

async function renderLeaderboard(container, { highlightId, collectionName = LEADERBOARD_COLLECTION } = {}) {
  if (!container) return;
  container.innerHTML = '';
  const ref = leaderboardCollectionRef(collectionName);

  const topSnapshot = await ref.orderBy('score', 'desc').limit(LEADERBOARD_DISPLAY_LIMIT).get();
  const topEntries = topSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  topEntries.forEach((entry, index) => {
    container.appendChild(buildLeaderboardItem(entry, index + 1, entry.id === highlightId));
  });

  const highlightInTop = highlightId && topEntries.some((e) => e.id === highlightId);
  if (highlightId && !highlightInTop) {
    const highlightDoc = await ref.doc(highlightId).get();
    if (highlightDoc.exists) {
      const highlightEntry = { id: highlightDoc.id, ...highlightDoc.data() };
      const higherScoresSnapshot = await ref.where('score', '>', highlightEntry.score).get();
      const rank = higherScoresSnapshot.size + 1;

      const divider = document.createElement('li');
      divider.className = 'leaderboard-list__divider';
      divider.textContent = '···';
      container.appendChild(divider);
      container.appendChild(buildLeaderboardItem(highlightEntry, rank, true));
    }
  }
}

function truncateText(text, maxLength = 34) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

function triggerLeaderboardButtonBlink(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.classList.remove('leaderboard-nav-button--blink');
  void button.offsetWidth;
  button.classList.add('leaderboard-nav-button--blink');
}
