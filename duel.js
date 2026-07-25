const DUEL_COLLECTION = 'duels';
const DUEL_ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const DUEL_ROOM_CODE_LENGTH = 5;
const DUEL_QUESTION_COUNT = 8;

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

function shuffledDuelIndices(count, take) {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, take);
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
    hostId: uid,
    guestId: null,
    currentQuestionIndex: 0,
    questionIds: shuffledDuelIndices(questionCount, Math.min(DUEL_QUESTION_COUNT, questionCount)),
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
  await firebase.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    if (!doc.exists) return;
    const data = doc.data();
    if (data.currentQuestionIndex !== questionIndex) return;

    const players = Object.values(data.players || {});
    const bothAnswered = players.length === 2 && players.every((p) => p.lastAnsweredIndex >= questionIndex);
    if (!bothAnswered) return;

    const isLast = questionIndex + 1 >= totalQuestions;
    tx.update(docRef, isLast ? { status: 'finished' } : { currentQuestionIndex: questionIndex + 1 });
  });
}
