// CEFR scaling profile — the single table that makes every episode playable at
// every level. Primitives read this; episodes never branch on level.
// See RPG_REFINEMENT_PLAN.md § "CEFR scaling profile".

export const CEFR_LEVEL_ORDER = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

export function normalizeCefrKey(level) {
  const raw = String(level || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (raw === "pre-a1" || raw === "prea1") return "Pre-A1";
  const match = raw.match(/^([abc][12])$/);
  if (match) return match[1].toUpperCase();
  return CEFR_LEVEL_ORDER.includes(level) ? level : "A1";
}

export function cefrLevelIndex(level) {
  const idx = CEFR_LEVEL_ORDER.indexOf(normalizeCefrKey(level));
  return idx === -1 ? 1 : idx;
}

// distractors: how wrong options are drawn relative to the answer.
//   unrelated -> different category | category -> same category
//   close     -> same category + same kind | nuance -> register/nuance traps
// textDuringTts: visible | delayed | hidden (when NPC audio prompts show text)
// sayAloud: read (target shown) | recall (target hidden) | open (micro-goal)
export const CEFR_PROFILES = {
  "Pre-A1": {
    maxUtteranceWords: 4,
    constraintsPerBeat: 1,
    distractors: "unrelated",
    textDuringTts: "visible",
    sayAloud: "read",
    formInput: "picker",
    speechPassSimilarity: 0.55,
    supportVisible: true,
    tenses: "present tense and fixed formulas only",
  },
  A1: {
    maxUtteranceWords: 8,
    constraintsPerBeat: 1,
    distractors: "category",
    textDuringTts: "visible",
    sayAloud: "read",
    formInput: "picker",
    speechPassSimilarity: 0.62,
    supportVisible: true,
    tenses: "present tense and simple near-future",
  },
  A2: {
    maxUtteranceWords: 14,
    constraintsPerBeat: 2,
    distractors: "category",
    textDuringTts: "delayed",
    sayAloud: "read",
    formInput: "picker",
    speechPassSimilarity: 0.68,
    supportVisible: false,
    tenses: "present, preterite, and imperfect",
  },
  B1: {
    maxUtteranceWords: 20,
    constraintsPerBeat: 2,
    distractors: "close",
    textDuringTts: "delayed",
    sayAloud: "recall",
    formInput: "picker",
    speechPassSimilarity: 0.74,
    supportVisible: false,
    tenses: "past tenses, perfect, future, and conditional",
  },
  B2: {
    maxUtteranceWords: 26,
    constraintsPerBeat: 3,
    distractors: "close",
    textDuringTts: "hidden",
    sayAloud: "recall",
    formInput: "typed",
    speechPassSimilarity: 0.78,
    supportVisible: false,
    tenses: "all common tenses plus subjunctive and passive",
  },
  C1: {
    maxUtteranceWords: 34,
    constraintsPerBeat: 3,
    distractors: "nuance",
    textDuringTts: "hidden",
    sayAloud: "open",
    formInput: "typed",
    speechPassSimilarity: 0.8,
    supportVisible: false,
    tenses: "full tense and mood inventory, idiomatic usage",
  },
  C2: {
    maxUtteranceWords: 44,
    constraintsPerBeat: 4,
    distractors: "nuance",
    textDuringTts: "hidden",
    sayAloud: "open",
    formInput: "typed",
    speechPassSimilarity: 0.82,
    supportVisible: false,
    tenses: "full inventory including stylistic and rhetorical forms",
  },
};

export function getCefrProfile(level) {
  return CEFR_PROFILES[normalizeCefrKey(level)] || CEFR_PROFILES.A1;
}

// ─── Scoring model (plan § "Scoring, XP, recap, capture") ────────────────────
export const BEAT_COUNT = 6; // scored beats before the finale
export const BEAT_MAX_POINTS = 100;
export const FINALE_WEIGHT = 2;
export const MAX_BASE_SCORE = BEAT_MAX_POINTS * (BEAT_COUNT + FINALE_WEIGHT); // 800
export const ATTEMPT_POINTS = [100, 50, 25]; // 1st / 2nd / 3rd try
export const MAX_HEARTS = 3;

export function starsForScore(baseScore) {
  const ratio = baseScore / MAX_BASE_SCORE;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}

// Keeps game XP capped at the lesson's existing flat reward (no inflation),
// plus a small flair bonus when speech bonuses were earned generously.
export function xpForRun({ xpReward = 30, baseScore = 0, flairScore = 0 }) {
  const stars = starsForScore(baseScore);
  const byStars = { 1: 0.5, 2: 22 / 30, 3: 1 }[stars] || 0.5;
  const flairBonus = flairScore >= MAX_BASE_SCORE / 2 ? 5 : 0;
  return Math.round(xpReward * byStars) + flairBonus;
}
