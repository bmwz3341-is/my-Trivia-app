const LEADERBOARD_COLLECTION = 'leaderboard';
const LEADERBOARD_DISPLAY_LIMIT = 10;

const leaderboardRef = firebase.firestore().collection(LEADERBOARD_COLLECTION);

async function addLeaderboardEntry({ name, avatar, score, category }) {
  const docRef = await leaderboardRef.add({
    name,
    avatar,
    score,
    category,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  const [higherScoresSnapshot, totalSnapshot] = await Promise.all([
    leaderboardRef.where('score', '>', score).count().get(),
    leaderboardRef.count().get(),
  ]);

  return {
    entry: { id: docRef.id, name, avatar, score, category },
    rank: higherScoresSnapshot.data().count + 1,
    total: totalSnapshot.data().count,
  };
}

function buildLeaderboardItem(entry, rank, isCurrent) {
  const item = document.createElement('li');
  item.className = `leaderboard-item${isCurrent ? ' leaderboard-item--current' : ''}`;
  item.innerHTML = `
    <span class="leaderboard-item__rank">#${rank}</span>
    <span class="leaderboard-item__avatar">${entry.avatar}</span>
    <span class="leaderboard-item__name">${escapeHtml(entry.name)}</span>
    <span class="leaderboard-item__category">${escapeHtml(entry.category || '')}</span>
    <span class="leaderboard-item__score">${entry.score} נק'</span>
  `;
  return item;
}

async function renderLeaderboard(container, { highlightId } = {}) {
  if (!container) return;
  container.innerHTML = '';

  const topSnapshot = await leaderboardRef.orderBy('score', 'desc').limit(LEADERBOARD_DISPLAY_LIMIT).get();
  const topEntries = topSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  topEntries.forEach((entry, index) => {
    container.appendChild(buildLeaderboardItem(entry, index + 1, entry.id === highlightId));
  });

  const highlightInTop = highlightId && topEntries.some((e) => e.id === highlightId);
  if (highlightId && !highlightInTop) {
    const highlightDoc = await leaderboardRef.doc(highlightId).get();
    if (highlightDoc.exists) {
      const highlightEntry = { id: highlightDoc.id, ...highlightDoc.data() };
      const higherScoresSnapshot = await leaderboardRef.where('score', '>', highlightEntry.score).count().get();
      const rank = higherScoresSnapshot.data().count + 1;

      const divider = document.createElement('li');
      divider.className = 'leaderboard-list__divider';
      divider.textContent = '···';
      container.appendChild(divider);
      container.appendChild(buildLeaderboardItem(highlightEntry, rank, true));
    }
  }
}
