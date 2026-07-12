// Tier-1 term pools: the localized FLASHCARD_DATA deck (1050 concepts across
// A1–C2, categorized, with names in all ten app languages) is the zero-LLM
// content source for episode slots. Level laddering: draw mostly from the run's
// level with a tail of easier cards; never above the level.

import { FLASHCARD_DATA } from "../../../data/flashcardData";
import { cefrLevelIndex, getCefrProfile, normalizeCefrKey } from "../episodes/profile";

export function conceptText(card, lang = "en") {
  const concept = card?.concept || {};
  return String(concept[lang] || concept.en || "").trim();
}

function cardLevelIndex(card) {
  return cefrLevelIndex(card?.cefrLevel || "A1");
}

export function mulberry32(a) {
  let state = a | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Cards usable at `level`: at/below the level index (Pre-A1 maps onto A1 cards
 * since the deck starts at A1), weighted toward the current level by ordering.
 */
export function getTermCards({
  level = "A1",
  categories = null,
  count = 8,
  rng = Math.random,
  excludeIds = [],
} = {}) {
  const levelKey = normalizeCefrKey(level);
  const levelIdx = Math.max(1, cefrLevelIndex(levelKey)); // Pre-A1 -> A1 cards
  const excluded = new Set(excludeIds);
  const wanted = Array.isArray(categories) && categories.length ? new Set(categories) : null;

  const eligible = FLASHCARD_DATA.filter((card) => {
    if (excluded.has(card.id)) return false;
    if (cardLevelIndex(card) > levelIdx) return false;
    if (wanted && !wanted.has(card.category)) return false;
    return conceptText(card, "en").length > 0;
  });

  const atLevel = eligible.filter((card) => cardLevelIndex(card) === levelIdx);
  const below = eligible.filter((card) => cardLevelIndex(card) < levelIdx);
  const ordered = [...seededShuffle(atLevel, rng), ...seededShuffle(below, rng)];
  return ordered.slice(0, count);
}

/**
 * Pick distractor cards for an answer card, honoring the CEFR profile's
 * distractor policy (unrelated → category → close → nuance).
 */
export function getDistractorCards({ answerCard, level = "A1", count = 2, rng = Math.random }) {
  const profile = getCefrProfile(level);
  const levelIdx = Math.max(1, cefrLevelIndex(level));
  const pool = FLASHCARD_DATA.filter(
    (card) =>
      card.id !== answerCard?.id &&
      cardLevelIndex(card) <= levelIdx &&
      conceptText(card, "en").length > 0,
  );

  const sameCategory = pool.filter((card) => card.category === answerCard?.category);
  const sameKind = sameCategory.filter((card) => card.type === answerCard?.type);
  const otherCategory = pool.filter((card) => card.category !== answerCard?.category);
  const atLevel = sameCategory.filter((card) => cardLevelIndex(card) === levelIdx);

  let ranked;
  if (profile.distractors === "unrelated") {
    ranked = [...otherCategory, ...sameCategory];
  } else if (profile.distractors === "category") {
    ranked = [...sameCategory, ...otherCategory];
  } else if (profile.distractors === "close") {
    ranked = [...sameKind, ...sameCategory, ...otherCategory];
  } else {
    // nuance: same category at the run's level first
    ranked = [...atLevel, ...sameKind, ...sameCategory, ...otherCategory];
  }

  const picked = [];
  const seen = new Set([answerCard?.id]);
  const shuffledTiers = seededShuffle(ranked.slice(0, 60), rng).concat(ranked.slice(60));
  for (const card of shuffledTiers) {
    if (picked.length >= count) break;
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    picked.push(card);
  }
  return picked;
}

/**
 * Universal tier-1 comprehension check that works for ANY language pair at any
 * level: recognize the target-language form of a support-language concept.
 * Returns { promptConcept, answer, options: [{text, correct, cardId}] }.
 */
export function buildTranslationCheck({
  targetLang = "es",
  supportLang = "en",
  level = "A1",
  categories = null,
  rng = Math.random,
  excludeIds = [],
}) {
  const answerCard = getTermCards({
    level,
    categories,
    count: 40,
    rng,
    excludeIds,
  }).find((card) => conceptText(card, targetLang));
  if (!answerCard) return null;
  const distractors = getDistractorCards({
    answerCard,
    level,
    count: 30,
    rng,
  })
    .filter((card) => conceptText(card, targetLang))
    .slice(0, 2);
  if (distractors.length < 2) return null;
  const options = seededShuffle(
    [
      { text: conceptText(answerCard, targetLang), correct: true, cardId: answerCard.id },
      ...distractors.map((card) => ({
        text: conceptText(card, targetLang),
        correct: false,
        cardId: card.id,
      })),
    ].filter((option) => option.text),
    rng,
  );
  return {
    card: answerCard,
    promptConcept: conceptText(answerCard, supportLang) || conceptText(answerCard, "en"),
    answer: conceptText(answerCard, targetLang),
    options,
  };
}
