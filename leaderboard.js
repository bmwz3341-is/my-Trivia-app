const LEADERBOARD_COLLECTION = 'leaderboard';
const LEADERBOARD_DISPLAY_LIMIT = 10;

const leaderboardRef = firebase.firestore().collection(LEADERBOARD_COLLECTION);

async function addLeaderboardEntry({ playerId, name, avatar, score, category }) {
  const docRef = leaderboardRef.doc(playerId);

  await firebase.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    if (doc.exists && doc.data().score >= score) return;
    tx.set(docRef, {
      name,
      avatar,
      score,
      category,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });

  const bestDoc = await docRef.get();
  const entry = { id: docRef.id, ...bestDoc.data() };

  const [higherScoresSnapshot, totalSnapshot] = await Promise.all([
    leaderboardRef.where('score', '>', entry.score).get(),
    leaderboardRef.get(),
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
      const higherScoresSnapshot = await leaderboardRef.where('score', '>', highlightEntry.score).get();
      const rank = higherScoresSnapshot.size + 1;

      const divider = document.createElement('li');
      divider.className = 'leaderboard-list__divider';
      divider.textContent = '···';
      container.appendChild(divider);
      container.appendChild(buildLeaderboardItem(highlightEntry, rank, true));
    }
  }
}
