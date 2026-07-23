import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

export const CITIZENSHIP_REMOTE_SCHEMA_VERSION = 1;

const getRemoteRefs = (database, userId) => {
  const user = doc(database, "users", userId);
  const progress = doc(
    database,
    "users",
    userId,
    "citizenship",
    "progress",
  );
  const chat = doc(database, "users", userId, "citizenship", "chat");
  const messages = collection(
    database,
    "users",
    userId,
    "citizenship",
    "chat",
    "messages",
  );
  return { user, progress, chat, messages };
};

export const stripAssistantChatFromProgress = (progress = {}) => {
  const { assistantChat: _assistantChat, ...progressDocument } = progress;
  return progressDocument;
};

export const combineProgressAndChat = (progress = {}, assistantChat) => ({
  ...progress,
  ...(assistantChat ? { assistantChat } : {}),
});

export const chooseMostRecentTimestamped = (...values) => {
  const candidates = values.filter(
    (value) => value && typeof value === "object",
  );
  if (!candidates.length) return null;

  return candidates.reduce((newest, candidate) => {
    const newestTime = Date.parse(newest?.updatedAt || "");
    const candidateTime = Date.parse(candidate?.updatedAt || "");
    if (!Number.isFinite(newestTime)) return candidate;
    if (!Number.isFinite(candidateTime)) return newest;
    return candidateTime >= newestTime ? candidate : newest;
  });
};

export const sortRemoteChatMessages = (messages = []) =>
  [...messages].sort((left, right) => {
    const positionDifference =
      Number(left?.position ?? Number.MAX_SAFE_INTEGER) -
      Number(right?.position ?? Number.MAX_SAFE_INTEGER);
    if (positionDifference) return positionDifference;
    return String(left?.createdAt || "").localeCompare(
      String(right?.createdAt || ""),
    );
  });

export const readCitizenshipRemoteBundle = async (database, userId) => {
  const refs = getRemoteRefs(database, userId);
  const [userSnapshot, progressSnapshot, chatSnapshot] = await Promise.all([
    getDoc(refs.user),
    getDoc(refs.progress),
    getDoc(refs.chat),
  ]);

  let chatMessages = [];
  if (chatSnapshot.exists() && chatSnapshot.data()?.saved === true) {
    const messageSnapshot = await getDocs(refs.messages);
    chatMessages = sortRemoteChatMessages(
      messageSnapshot.docs.map((messageDocument) => ({
        id: messageDocument.id,
        ...messageDocument.data(),
      })),
    );
  }

  return {
    userData: userSnapshot.exists() ? userSnapshot.data() : {},
    progressData: progressSnapshot.exists() ? progressSnapshot.data() : null,
    chatData: chatSnapshot.exists()
      ? {
          ...chatSnapshot.data(),
          messages: chatMessages,
        }
      : null,
  };
};

export const writeCitizenshipProgressDocument = async (
  database,
  userId,
  progress,
) => {
  const refs = getRemoteRefs(database, userId);
  await setDoc(
    refs.progress,
    {
      ...stripAssistantChatFromProgress(progress),
      remoteSchemaVersion: CITIZENSHIP_REMOTE_SCHEMA_VERSION,
    },
    { merge: false },
  );
};

export const writeCitizenshipChatDocuments = async (
  database,
  userId,
  assistantChat,
) => {
  const refs = getRemoteRefs(database, userId);
  const existingMessages = await getDocs(refs.messages);
  const nextMessages = Array.isArray(assistantChat?.messages)
    ? assistantChat.messages
    : [];
  const nextIds = new Set(nextMessages.map((message) => message.id));
  const batch = writeBatch(database);

  batch.set(
    refs.chat,
    {
      saved: assistantChat?.saved === true,
      updatedAt:
        typeof assistantChat?.updatedAt === "string"
          ? assistantChat.updatedAt
          : "",
      messageCount: nextMessages.length,
      remoteSchemaVersion: CITIZENSHIP_REMOTE_SCHEMA_VERSION,
    },
    { merge: false },
  );

  nextMessages.forEach((message, position) => {
    batch.set(
      doc(refs.messages, message.id),
      {
        role: message.role === "user" ? "user" : "assistant",
        text: typeof message.text === "string" ? message.text : "",
        done: message.done !== false,
        createdAt:
          typeof message.createdAt === "string" ? message.createdAt : "",
        position,
      },
      { merge: false },
    );
  });

  existingMessages.docs.forEach((messageDocument) => {
    if (!nextIds.has(messageDocument.id)) {
      batch.delete(messageDocument.ref);
    }
  });

  await batch.commit();
};

export const clearCitizenshipChatDocuments = async (database, userId) => {
  const refs = getRemoteRefs(database, userId);
  const existingMessages = await getDocs(refs.messages);
  const batch = writeBatch(database);
  existingMessages.docs.forEach((messageDocument) => {
    batch.delete(messageDocument.ref);
  });
  batch.delete(refs.chat);
  await batch.commit();
};

export const markCitizenshipOnboarded = async (database, userId) => {
  const { user } = getRemoteRefs(database, userId);
  await setDoc(user, { onboardedCitizenship: true }, { merge: true });
};

export const removeLegacyCitizenshipProgressMap = async (
  database,
  userId,
) => {
  const { user } = getRemoteRefs(database, userId);
  await setDoc(
    user,
    { citizenshipProgress: deleteField() },
    { merge: true },
  );
};
