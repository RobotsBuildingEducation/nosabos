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

  return `${subject} must use an adult beginner tone: the learner is an adult with limited target-language ability. Keep the same vocabulary and grammar ceiling, but use a calm, socially normal adult register. Sound conversational, not telegraphic: prefer short complete memorized phrases and simple formulaic sentences over isolated word fragments. Do not repeat basic words to fill a turn. Do not use childish, patronizing, sing-song, caveman-like, or classroom-for-toddlers phrasing. Avoid pet names, exaggerated cheerleading, and repeated "good job"/"great job" coaching. Use praise sparingly and only when it sounds natural.`;
}
