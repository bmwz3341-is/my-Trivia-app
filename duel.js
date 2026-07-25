const DUEL_COLLECTION = 'duels';
const DUEL_ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const DUEL_ROOM_CODE_LENGTH = 5;
const DUEL_QUESTION_COUNT = 20;
const DUEL_ROOM_TTL_HOURS = 24;

function duelDocRef(roomCode) {
  return firebase.firestore().collection(DUEL_COLLECTION).doc(roomCode);
}

function generateDuelRoomCode() {
  let code = '';
  for (let i = 0; i < DUEL_ROOM_CODE_LENGTH; i += 1) {
    code += DUEL_ROOM_CODE_CHARS[Math.floor(Math.random() * DUEL_ROOM_CODE_CHARS.length)];
  }
  return code;
}

// Same localStorage queue format/key as pickNextOrResetIndex() in questPageTrivia.js
// (triviaQueue::<category>::<subCategory> => { total, queue }), so solo play and duels
// draw from one shared, non-repeating rotation per category/sub-category.
function getSharedQuestionQueueKey(category, subCategory) {
  return `triviaQueue::${category}::${subCategory}`;
}

function shuffledIndicesPool(count) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadSharedQuestionQueue(category, subCategory, totalQuestions) {
  try {
    const raw = localStorage.getItem(getSharedQuestionQueueKey(category, subCategory));
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && saved.total === totalQuestions && Array.isArray(saved.queue) && saved.queue.length > 0) {
      return saved.queue;
    }
  } catch (err) {
    // localStorage unavailable or corrupted; fall back to a fresh shuffle below
  }
  return shuffledIndicesPool(totalQuestions);
}

function saveSharedQuestionQueue(category, subCategory, totalQuestions, queue) {
  try {
    localStorage.setItem(getSharedQuestionQueueKey(category, subCategory), JSON.stringify({ total: totalQuestions, queue }));
  } catch (err) {
    // ignore storage failures (e.g. private browsing quota)
  }
}

// Draws `take` unique question indices (capped to totalQuestions) from the shared
// rotating pool, reshuffling on exhaustion — mirrors pickNextOrResetIndex()'s behavior
// but returns a whole batch up front for the duel room, with no repeats within the batch.
function drawDuelQuestionIndices(category, subCategory, totalQuestions, take) {
  const capped = Math.min(take, totalQuestions);
  let queue = loadSharedQuestionQueue(category, subCategory, totalQuestions);
  const seen = new Set();
  const result = [];

  while (result.length < capped) {
    if (queue.length === 0) {
      queue = shuffledIndicesPool(totalQuestions);
    }
    const index = queue.shift();
    if (!seen.has(index)) {
      seen.add(index);
      result.push(index);
    }
  }

  saveSharedQuestionQueue(category, subCategory, totalQuestions, queue);
  return result;
}

async function createDuelRoom({ category, subCategory, questionCount }) {
  const uid = await ensurePlayerAuth();
  const profile = getPlayerProfile();

  let roomCode = generateDuelRoomCode();
  let docRef = duelDocRef(roomCode);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await docRef.get();
    if (!existing.exists) break;
    roomCode = generateDuelRoomCode();
    docRef = duelDocRef(roomCode);
  }

  await docRef.set({
    status: 'waiting',
    category,
    subCategory,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: firebase.firestore.Timestamp.fromMillis(Date.now() + DUEL_ROOM_TTL_HOURS * 60 * 60 * 1000),
    hostId: uid,
    guestId: null,
    currentQuestionIndex: 0,
    questionIds: drawDuelQuestionIndices(category, subCategory, questionCount, DUEL_QUESTION_COUNT),
    players: {
      [uid]: { name: profile.name, avatar: profile.avatar, score: 0, lastAnsweredIndex: -1 },
    },
  });

  return roomCode;
}

async function joinDuelRoom(rawCode) {
  const uid = await ensurePlayerAuth();
  const profile = getPlayerProfile();
  const roomCode = rawCode.trim().toUpperCase();
  const docRef = duelDocRef(roomCode);

  await firebase.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    if (!doc.exists) throw new Error('ROOM_NOT_FOUND');
    const data = doc.data();
    if (data.hostId === uid || data.guestId === uid) return;
    if (data.status !== 'waiting' || data.guestId) throw new Error('ROOM_FULL');

    tx.update(docRef, {
      guestId: uid,
      status: 'active',
      [`players.${uid}`]: { name: profile.name, avatar: profile.avatar, score: 0, lastAnsweredIndex: -1 },
    });
  });

  return roomCode;
}

async function findAndJoinQuickMatch(category, subCategory) {
  const uid = await ensurePlayerAuth();
  const snapshot = await firebase.firestore()
    .collection(DUEL_COLLECTION)
    .where('status', '==', 'waiting')
    .where('category', '==', category)
    .where('subCategory', '==', subCategory)
    .limit(5)
    .get();

  for (const doc of snapshot.docs) {
    if (doc.data().hostId === uid) continue;
    try {
      return await joinDuelRoom(doc.id);
    } catch (err) {
      // Room was taken or became invalid between the query and the join attempt - try the next candidate.
    }
  }
  return null;
}

function watchDuelRoom(roomCode, onChange) {
  return duelDocRef(roomCode).onSnapshot(
    (doc) => {
      onChange(doc.exists ? { id: doc.id, ...doc.data() } : null);
    },
    () => {
      onChange(null);
    }
  );
}

async function submitDuelAnswer(roomCode, uid, questionIndex, points) {
  await duelDocRef(roomCode).update({
    [`players.${uid}.score`]: firebase.firestore.FieldValue.increment(points),
    [`players.${uid}.lastAnsweredIndex`]: questionIndex,
  });
}

async function advanceDuelIfReady(roomCode, questionIndex, totalQuestions) {
  const docRef = duelDocRef(roomCode);
  try {
    await firebase.firestore().runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) return;
      const data = doc.data();
      if (data.status !== 'active' || data.currentQuestionIndex !== questionIndex) return;

      const players = Object.values(data.players || {});
      const bothAnswered = players.length === 2 && players.every((p) => p.lastAnsweredIndex >= questionIndex);
      if (!bothAnswered) return;

      const isLast = questionIndex + 1 >= totalQuestions;
      tx.update(docRef, isLast ? { status: 'finished' } : { currentQuestionIndex: questionIndex + 1 });
    });
  } catch (err) {
    if (err.code !== 'permission-denied') throw err;
  }
}
