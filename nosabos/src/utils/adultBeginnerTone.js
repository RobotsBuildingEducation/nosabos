const EARLY_BEGINNER_LEVELS = new Set(["A0", "PRE-A1", "PRE_A1", "PREA1", "A1"]);

export function isEarlyBeginnerLevel(level) {
  const normalized = String(level || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  return EARLY_BEGINNER_LEVELS.has(normalized);
}

export function getAdultBeginnerToneRule(level, mode = "conversation") {
  if (!isEarlyBeginnerLevel(level)) return "";

  const subject =
    mode === "rpg"
      ? "NPC dialogue, quest text, narration, choices, and feedback"
      : "Replies, prompts, corrections, and feedback";

  return `${subject} must use an adult beginner register: the learner is an adult with limited target-language ability. This rule controls language complexity and age-appropriateness only; it does not choose the assistant's demeanor or personality. Sound conversational, not telegraphic: prefer short complete memorized phrases and simple formulaic sentences over isolated word fragments. Do not repeat basic words merely to fill a turn. Do not use childish, patronizing, sing-song, caveman-like, or classroom-for-toddlers phrasing.`;
}
