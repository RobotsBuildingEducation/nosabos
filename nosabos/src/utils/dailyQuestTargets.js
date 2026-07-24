export const DAILY_QUEST_FLASHCARD_TARGET_MIN = 4;
export const DAILY_QUEST_FLASHCARD_TARGET_DEFAULT = 5;
export const DAILY_QUEST_FLASHCARD_TARGET_MAX = 6;

function hashString(value) {
  const text = String(value || "");
  let hash = 1779033703 ^ text.length;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/**
 * Pick a stable 4-6 card target for one learner's daily quest.
 *
 * Four, five, and six are equally likely. Including the learner, language, and
 * local day keeps the target fresh while ensuring it does not change after a
 * refresh or between devices.
 */
export function getDailyQuestFlashcardTarget({
  userKey = "",
  langKey = "",
  dayKey = "",
} = {}) {
  const bucket =
    hashString(`review|${userKey}|${langKey}|${dayKey}`) % 3;
  return DAILY_QUEST_FLASHCARD_TARGET_MIN + bucket;
}
