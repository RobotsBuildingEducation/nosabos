export const TUTOR_CONVERSATION_DRAFT_VERSION = 1;
export const TUTOR_CONVERSATION_DRAFT_MAX_MESSAGES = 60;

// Keep drafts comfortably below Firestore's 1 MiB document limit, even when
// the conversation contains multi-byte scripts. Completed lessons delete the
// draft, so this is only the active lesson's small reconnect buffer.
const MAX_DRAFT_JSON_CHARS = 80000;
const MAX_MESSAGE_TEXT_CHARS = 6000;

function cleanText(value, maxChars) {
  return String(value || "").trim().slice(0, maxChars);
}

export function normalizeTutorConversationDraftMessages(
  messages = [],
  { sanitizeText = (value) => cleanText(value, MAX_MESSAGE_TEXT_CHARS) } = {},
) {
  if (!Array.isArray(messages)) return [];

  const candidates = messages
    // Do not persist half-streamed assistant output. The finalized message
    // update schedules another background save immediately afterward.
    .filter((message) => message?.done !== false)
    .map((message) => {
      const text = cleanText(
        sanitizeText(
          message?.text ||
            `${message?.textFinal || ""} ${message?.textStream || ""}`,
        ),
        MAX_MESSAGE_TEXT_CHARS,
      );
      if (!text) return null;

      return {
        id: cleanText(message?.id || `draft-${Date.now()}`, 240),
        role: message?.role === "user" ? "user" : "assistant",
        lang: cleanText(message?.lang, 32),
        text,
        ...(message?.welcome ? { welcome: true } : {}),
        ts: Number.isFinite(Number(message?.ts))
          ? Number(message.ts)
          : Date.now(),
      };
    })
    .filter(Boolean)
    .slice(-TUTOR_CONVERSATION_DRAFT_MAX_MESSAGES);

  const newestFirst = [];
  let usedChars = 0;
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];
    const candidateChars = JSON.stringify(candidate).length;
    if (usedChars + candidateChars > MAX_DRAFT_JSON_CHARS) continue;
    newestFirst.push(candidate);
    usedChars += candidateChars;
  }

  return newestFirst.reverse();
}

export function getRestorableTutorConversationMessages(
  lessonProgress,
  options,
) {
  if (lessonProgress?.status !== "in_progress") return [];
  const draft = lessonProgress?.conversationDraft;
  if (
    !draft ||
    Number(draft.version) !== TUTOR_CONVERSATION_DRAFT_VERSION
  ) {
    return [];
  }
  return normalizeTutorConversationDraftMessages(draft.messages, options).map(
    (message) => ({
      id: message.id,
      role: message.role,
      lang: message.lang,
      textFinal: message.text,
      textStream: "",
      translation: "",
      translationLang: "",
      pairs: [],
      done: true,
      hasAudio: false,
      ...(message.welcome ? { welcome: true } : {}),
      ts: message.ts,
    }),
  );
}

/**
 * A new realtime connection always starts with a clean visible transcript.
 * Saved messages remain available only as private context for the tutor's
 * kickoff, so reconnecting can continue the lesson without showing a stale
 * bubble or making the UI believe the new session already started.
 */
export function getTutorConversationSessionState(lessonProgress, options) {
  return {
    visibleMessages: [],
    resumeContextMessages: getRestorableTutorConversationMessages(
      lessonProgress,
      options,
    ),
  };
}
