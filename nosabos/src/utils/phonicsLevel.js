/**
 * Phonics generation level
 *
 * Alphabet Bootcamp has no CEFR ladder of its own, so generated phonics decks
 * derive their difficulty from two bounded signals:
 *
 *   phonicsProgressLevel = max(deck ladder, placement)
 *     What phonics work (plus any deliberate placement test) has actually
 *     demonstrated. The ladder climbs only by completing generated decks.
 *
 *   courseCeilingLevel = highest UNLOCKED lesson/flashcard level
 *     What the wider course believes the learner should access.
 *
 *   phonicsGenerationLevel = min(phonicsProgressLevel, courseCeilingLevel)
 *
 * View-state levels (active skill-tree tab, tutor unit selection, the
 * conversation proficiency setting) are deliberately excluded: browsing a
 * level is not evidence of ability.
 */

import { CEFR_LEVELS } from "../data/flashcards/common.js";

// Completed generated decks -> phonics ladder level. Bands are wide on
// purpose: each deck is a handful of cards, so reaching C2 by ladder alone
// means ~21 finished decks of phonics work.
const DECK_LADDER = [
  [21, "C2"],
  [15, "C1"],
  [10, "B2"],
  [6, "B1"],
  [3, "A2"],
  [1, "A1"],
  [0, "Pre-A1"],
];

/**
 * Returns the level if it's a real CEFR level, else null. Placement can be
 * the literal string "skipped", so validation is not optional.
 */
export function clampCefrLevel(level) {
  return CEFR_LEVELS.includes(level) ? level : null;
}

function cefrIndex(level) {
  return CEFR_LEVELS.indexOf(level);
}

/** Highest valid CEFR level among the arguments, or null if none are valid. */
export function maxCefrLevel(...levels) {
  return levels.reduce((best, level) => {
    if (!clampCefrLevel(level)) return best;
    if (!best) return level;
    return cefrIndex(level) > cefrIndex(best) ? level : best;
  }, null);
}

/** Lowest valid CEFR level among the arguments, or null if none are valid. */
export function minCefrLevel(...levels) {
  return levels.reduce((best, level) => {
    if (!clampCefrLevel(level)) return best;
    if (!best) return level;
    return cefrIndex(level) < cefrIndex(best) ? level : best;
  }, null);
}

/** Phonics ladder level earned purely by finishing generated decks. */
export function getPhonicsDeckLadderLevel(completedDeckCount) {
  const count = Number.isFinite(completedDeckCount) ? completedDeckCount : 0;
  const rung = DECK_LADDER.find(([minDecks]) => count >= minDecks);
  return rung ? rung[1] : "Pre-A1";
}

/**
 * The level new phonics decks are generated at:
 * min(max(deck ladder, placement), course ceiling).
 *
 * Placement seeds the ladder the same way it pre-unlocks lesson/flashcard
 * levels elsewhere in the app, and the ceiling keeps the ladder from running
 * ahead of the learner's unlocked course levels. A missing/invalid ceiling
 * leaves progress uncapped rather than clamping everything to Pre-A1.
 */
export function getPhonicsGenerationLevel({
  completedDeckCount = 0,
  placementLevel = null,
  courseCeilingLevel = null,
} = {}) {
  const progressLevel = maxCefrLevel(
    getPhonicsDeckLadderLevel(completedDeckCount),
    placementLevel,
  );
  const ceiling = clampCefrLevel(courseCeilingLevel);
  const level = ceiling ? minCefrLevel(progressLevel, ceiling) : progressLevel;
  return level || "Pre-A1";
}

/** Collapse a CEFR level into the coarse band the generation prompt uses. */
export function getPhonicsBand(level) {
  if (level === "Pre-A1" || level === "A1") return "foundation";
  if (level === "A2" || level === "B1") return "intermediate";
  return "advanced";
}
