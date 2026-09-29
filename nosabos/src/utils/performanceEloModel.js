// One internal Elo rating spans every CEFR question level in one practice
// language. The 0–100 Score is its learner-facing projection; CEFR remains
// the curriculum/unlock level.
import { calculateFlashcardCompletion, calculateLessonCompletion } from "./cefrProgress.js";
export const ELO_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
export const SCORE_LEVEL_BANDS = Object.freeze({
  "Pre-A1": [0, 14],
  A1: [15, 28],
  A2: [29, 42],
  B1: [43, 56],
  B2: [57, 70],
  C1: [71, 84],
  C2: [85, 100],
});
export const SCORE_LEVEL_DEFAULTS = Object.freeze({
  "Pre-A1": 1,
  A1: 18,
  A2: 32,
  B1: 46,
  B2: 60,
  C1: 74,
  C2: 89,
});
const QUESTION_DIFFICULTY = { "Pre-A1": 7, A1: 21, A2: 35, B1: 49, B2: 63, C1: 77, C2: 93 };
const LEGACY_SCORE_POINTS = [[600, 1], [800, 1], [1000, 125], [1100, 175], [1200, 225], [1400, 325], [1500, 375], [1600, 425], [1700, 475], [1800, 525], [1900, 575], [2000, 625], [2200, 700]];
export const SCORE_SCALE_VERSION = 4;
// Small Elo updates keep course-wide progress from racing across CEFR bands
// after a handful of answers. The first beginner success is a special case.
const K_FACTOR = 4;
const ELO_SUPPORT_WEIGHTS = Object.freeze({
  modeled: 0.55,
  prompted: 0.7,
  "lightly supported": 0.85,
  independent: 1,
  transferred: 1,
});
const MIN_SCORE = 0;
const MAX_SCORE = 100;
const MIN_RATING = 800;
const MAX_RATING = 2200;
const ELO_PER_SCORE = (MAX_RATING - MIN_RATING) / MAX_SCORE;

export function scoreToElo(value) {
  const score = Number(value);
  const bounded = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Number.isFinite(score) ? score : MIN_SCORE));
  // Seed prior whole-number Scores near the middle of their display interval.
  // Otherwise one miss at a freshly seeded Score would immediately lower it.
  if (bounded === MIN_SCORE) return MIN_RATING;
  if (bounded === MAX_SCORE) return MAX_RATING;
  return MIN_RATING + (bounded + 0.5) * ELO_PER_SCORE;
}

export function eloToScore(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return MIN_SCORE;
  // Fractional Elo changes accumulate before the next visible Score point.
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.floor((rating - MIN_RATING) / ELO_PER_SCORE + 1e-8)));
}

// Version 2 used a 1–700 Score. Preserve each CEFR band's relative position
// when moving saved ratings into the shared 1–100 scale.
export function migrateScoreV2(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  const oldScore = Math.max(1, Math.min(700, rating));
  const levelIndex = Math.min(6, Math.floor((oldScore - 1) / 100));
  const [floor, ceiling] = SCORE_LEVEL_BANDS[ELO_LEVELS[levelIndex]];
  const oldFloor = levelIndex * 100 + 1;
  const migratedFloor = levelIndex === 0 ? 1 : floor;
  return migratedFloor + Math.round(((oldScore - oldFloor) / 99) * (ceiling - migratedFloor));
}

export function migrateLegacyEloRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  if (rating <= LEGACY_SCORE_POINTS[0][0]) return 1;
  for (let index = 1; index < LEGACY_SCORE_POINTS.length; index += 1) {
    const [upperLegacy, upperScore] = LEGACY_SCORE_POINTS[index];
    if (rating <= upperLegacy) {
      const [lowerLegacy, lowerScore] = LEGACY_SCORE_POINTS[index - 1];
      const oldScore = lowerScore + ((rating - lowerLegacy) / (upperLegacy - lowerLegacy)) * (upperScore - lowerScore);
      return migrateScoreV2(oldScore);
    }
  }
  return MAX_SCORE;
}

function storedRating(bucket) {
  if (bucket?.elo?.rating == null) return null;
  const rating = Number(bucket?.elo?.rating);
  if (!Number.isFinite(rating)) return null;
  // The old “completely new” button was saved as a self report with no
  // selected statements and a starting rating of 1 (or 800 on the old scale).
  if (bucket.elo.initializedFrom === "self_report" &&
      (!bucket.selfAssessment?.selectedIds?.length) &&
      Number(bucket.elo.totalGraded || 0) === 0 &&
      (rating === 1 || rating === 800)) return MIN_RATING;
  if (bucket.elo.scaleVersion === SCORE_SCALE_VERSION)
    return Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
  if (bucket.elo.scaleVersion === 3) return scoreToElo(rating);
  return scoreToElo(bucket.elo.scaleVersion === 2
    ? migrateScoreV2(rating)
    : migrateLegacyEloRating(rating));
}

export function normalizeEloLevel(value, fallback = "A1") {
  const raw = String(value || "").trim().toUpperCase().replace(/[\s_]+/g, "-");
  if (raw === "PRE-A1" || raw === "PREA1" || raw === "A0") return "Pre-A1";
  if (ELO_LEVELS.includes(raw)) return raw;
  return fallback;
}

export function initialEloRating(level = "A1") {
  return SCORE_LEVEL_DEFAULTS[normalizeEloLevel(level)] || SCORE_LEVEL_DEFAULTS.A1;
}

const higherLevel = (left, right) => ELO_LEVELS[
  Math.max(ELO_LEVELS.indexOf(normalizeEloLevel(left, "Pre-A1")),
    ELO_LEVELS.indexOf(normalizeEloLevel(right, "Pre-A1")))
];

export function curriculumLevelsForUser(user, targetLang) {
  const lang = String(targetLang || "es").toLowerCase();
  const placed = user?.proficiencyPlacements?.[lang];
  const unlockedThrough = (completion) => {
    let level = "Pre-A1";
    for (let index = 0; index < ELO_LEVELS.length - 1; index += 1) {
      if (completion(user?.progress, ELO_LEVELS[index], lang) < 100) break;
      level = ELO_LEVELS[index + 1];
    }
    return higherLevel(level, placed);
  };
  const skillTree = unlockedThrough(calculateLessonCompletion);
  const flashcards = unlockedThrough(calculateFlashcardCompletion);
  const tutor = higherLevel(user?.progress?.tutorUnlockedLevels?.[lang], placed);
  const overall = [skillTree, flashcards, tutor,
    user?.progress?.targetLang === lang ? user?.progress?.level : null,
  ].reduce(higherLevel, "Pre-A1");
  return { skillTree, flashcards, tutor, overall };
}

export function initialEloLevelForUser(user, targetLang) {
  return curriculumLevelsForUser(user, targetLang).overall;
}

// Existing practice-mode callers use this historical name to choose a Score
// band. Keep its public-Score contract; AI context uses internalEloForUser.
export function eloForUser(user, targetLang) {
  return eloToScore(internalEloForUser(user, targetLang));
}

export function internalEloForUser(user, targetLang) {
  const lang = String(targetLang || "es").toLowerCase();
  const stored = storedRating(user?.learningIntelligence?.[lang]);
  if (stored !== null) return stored;
  // Accounts that completed onboarding before the zero baseline was persisted
  // still need to show 0 until they provide placement or practice evidence.
  const hasPlacement = Boolean(user?.proficiencyPlacements?.[lang] || (
    user?.progress?.targetLang === lang && user?.proficiencyPlacement
  ));
  const noPractice = Number(user?.xp || 0) === 0 &&
    Number(user?.progress?.xp || 0) === 0 && Number(user?.streak || 0) === 0;
  if (user?.onboarding?.completed === true && !hasPlacement && noPractice)
    return MIN_RATING;
  return scoreToElo(initialEloRating(initialEloLevelForUser(user, lang)));
}

export const scoreForUser = eloForUser;

export function practiceLevelForElo(rating) {
  const score = Number.isFinite(Number(rating)) ? Number(rating) : SCORE_LEVEL_DEFAULTS.A1;
  return ELO_LEVELS.find((level) => score <= SCORE_LEVEL_BANDS[level][1]) || "C2";
}

export const practiceLevelForScore = practiceLevelForElo;

export function eloDelta({ rating, questionLevel, difficultyScore, success, support = "independent" }) {
  const assessed = Number(difficultyScore);
  const difficulty = difficultyScore != null && Number.isFinite(assessed) && assessed >= 0 && assessed <= 100
    ? MIN_RATING + assessed * ELO_PER_SCORE
    : scoreToElo(QUESTION_DIFFICULTY[normalizeEloLevel(questionLevel)] || QUESTION_DIFFICULTY.A1);
  const expected = 1 / (1 + 10 ** ((difficulty - rating) / 400));
  // A supported answer is evidence of partial capability, not independent
  // mastery. A miss always counts as a miss regardless of offered support.
  const supportWeight = ELO_SUPPORT_WEIGHTS[support] ?? ELO_SUPPORT_WEIGHTS.prompted;
  return success ? K_FACTOR * (1 - expected) * supportWeight : -K_FACTOR * expected;
}

// Quote the question's Elo value when it is created. The model chooses the
// content and challenge; the app owns the point economy. All numbers are
// internal Elo points, not visible 0–100 Score points.
export function questionWorthForUser(user, targetLang, questionLevel, assessment = null) {
  const rating = internalEloForUser(user, targetLang);
  const level = normalizeEloLevel(questionLevel, practiceLevelForElo(eloToScore(rating)));
  const rawDifficulty = Number(assessment?.difficultyScore);
  const difficultyScore = assessment?.difficultyScore != null &&
    Number.isFinite(rawDifficulty) && rawDifficulty >= 0 && rawDifficulty <= 100
    ? rawDifficulty : null;
  const gainBySupport = Object.fromEntries(Object.keys(ELO_SUPPORT_WEIGHTS).map((support) => {
    const delta = rating === MIN_RATING
      ? scoreToElo(1) - MIN_RATING
      : eloDelta({ rating, questionLevel: level, difficultyScore, success: true, support });
    return [support, Math.max(0, Math.min(MAX_RATING - rating, delta))];
  }));
  return {
    version: SCORE_SCALE_VERSION,
    ratingAtGeneration: rating,
    questionLevel: level,
    difficultyScore,
    assessedQuestionLevel: difficultyScore === null ? level : practiceLevelForElo(difficultyScore),
    difficultySource: difficultyScore === null ? "cefr_fallback" : "model_assessment",
    gainBySupport,
    loss: Math.max(0, Math.min(rating - MIN_RATING,
      -eloDelta({ rating, questionLevel: level, difficultyScore, success: false }))),
  };
}

function quotedEloDelta(worth, questionLevel, success, support) {
  if (worth?.version !== SCORE_SCALE_VERSION ||
      worth.questionLevel !== questionLevel ||
      !Number.isFinite(worth.ratingAtGeneration) ||
      worth.ratingAtGeneration < MIN_RATING || worth.ratingAtGeneration > MAX_RATING) return null;
  const gain = worth.gainBySupport?.[support] ?? worth.gainBySupport?.prompted;
  if (!Number.isFinite(gain) || gain < 0 || gain > scoreToElo(1) - MIN_RATING ||
      !Number.isFinite(worth.loss) || worth.loss < 0 || worth.loss > K_FACTOR) return null;
  return success ? gain : -worth.loss;
}

const clean = (value, max = 100) => String(value || "").trim().slice(0, max);

export function applyGradedOutcome(bucket = {}, event, fallbackLevel = "A1", now = new Date().toISOString()) {
  if (!event || typeof event.success !== "boolean") return bucket;
  const id = clean(event.id, 160);
  const recentEventIds = Array.isArray(bucket.elo?.recentEventIds)
    ? bucket.elo.recentEventIds : [];
  if (!id || recentEventIds.includes(id)) return bucket;
  const questionLevel = normalizeEloLevel(event.questionLevel, normalizeEloLevel(fallbackLevel));
  const rating = storedRating(bucket) ?? scoreToElo(initialEloRating(fallbackLevel));
  const quotedDelta = quotedEloDelta(event.worth, questionLevel, event.success, event.support || "independent");
  const evidenceLevel = quotedDelta !== null &&
    Number.isFinite(event.worth?.difficultyScore) &&
    event.worth.difficultyScore >= 0 && event.worth.difficultyScore <= 100
    ? practiceLevelForElo(event.worth.difficultyScore) : questionLevel;
  const delta = quotedDelta
    ?? eloDelta({ rating, questionLevel, success: event.success, support: event.support });
  const nextRating = rating === MIN_RATING && event.success && quotedDelta === null
    ? scoreToElo(1)
    : Math.max(MIN_RATING, Math.min(MAX_RATING, rating + delta));
  const previous = bucket.performanceSummary || {};
  const byLevel = { ...(previous.byLevel || {}) };
  const levelCounts = byLevel[evidenceLevel] || { correct: 0, missed: 0 };
  byLevel[evidenceLevel] = {
    correct: (Number(levelCounts.correct) || 0) + (event.success ? 1 : 0),
    missed: (Number(levelCounts.missed) || 0) + (event.success ? 0 : 1),
  };
  const concept = clean(event.concept);
  const weakConcepts = (Array.isArray(previous.weakConcepts) ? previous.weakConcepts : [])
    .filter((item) => item.concept !== concept && Date.parse(item.lastSeen) >= Date.parse(now) - 45 * 86400000);
  if (concept && !event.success) {
    const prior = previous.weakConcepts?.find((item) => item.concept === concept);
    weakConcepts.unshift({ concept, questionLevel: evidenceLevel, misses: Math.min(99, (prior?.misses || 0) + 1), lastSeen: now });
  }
  return {
    ...bucket,
    version: 1,
    elo: {
      rating: nextRating,
      scaleVersion: SCORE_SCALE_VERSION,
      updatedAt: now,
      totalGraded: (Number(bucket.elo?.totalGraded) || 0) + 1,
      recentEventIds: [id, ...recentEventIds].slice(0, 40),
    },
    performanceSummary: {
      byLevel,
      weakConcepts: weakConcepts.slice(0, 5),
      recentResults: [event.success ? 1 : 0, ...(previous.recentResults || [])].slice(0, 10),
      lastQuestionLevel: evidenceLevel,
      lastMode: clean(event.mode, 32),
      lastSupport: event.success ? clean(event.support || "independent", 32) : "missed",
      updatedAt: now,
    },
  };
}

export function performanceContextFor(user, targetLang) {
  const lang = String(targetLang || "es").toLowerCase();
  const eloRating = internalEloForUser(user, lang);
  const score = eloToScore(eloRating);
  const curriculumLevels = curriculumLevelsForUser(user, lang);
  const curriculumCefrLevel = curriculumLevels.overall;
  const bucket = user?.learningIntelligence?.[lang] || {};
  const summary = bucket.performanceSummary || {};
  return {
    score,
    eloRating: Math.round(eloRating),
    curriculumCefrLevel,
    curriculumLevels,
    suggestedQuestionLevel: practiceLevelForElo(score),
    ratingGuide: "Elo is the internal 800–2200 estimate of demonstrated ability across all CEFR question levels. Score is its 0–100 learner-facing projection; fractional Elo changes accumulate between Score points. Use Elo, recent accuracy and weak concepts to choose challenge and support; keep the curriculum CEFR as the course objective, not a difficulty ceiling. A miss on an easy question is stronger negative evidence than a miss on a hard one. Self-report and placement are initial estimates until practice confirms them.",
    selfReportedStatements: bucket.selfAssessment?.selectedIds || [],
    weakConcepts: (Array.isArray(summary.weakConcepts) ? summary.weakConcepts : []).slice(0, 5),
    recentAccuracy: Array.isArray(summary.recentResults) && summary.recentResults.length
      ? summary.recentResults.slice(0, 10).reduce((sum, value) => sum + Number(value || 0), 0) / Math.min(10, summary.recentResults.length)
      : null,
    byLevel: summary.byLevel || {},
  };
}

// The generation payload omits the public Score, historical counters, and
// repeated explanatory prose. Grading uses the stored Elo directly and never
// calls a model with this context.
export function generationPerformanceContextFor(user, targetLang, { curriculumCefrLevel } = {}) {
  const context = performanceContextFor(user, targetLang);
  const results = user?.learningIntelligence?.[String(targetLang || "es").toLowerCase()]?.performanceSummary?.recentResults;
  return {
    eloRating: context.eloRating,
    eloScale: "800–2200; higher means stronger performance across CEFR levels",
    curriculumCefrLevel: curriculumCefrLevel
      ? normalizeEloLevel(curriculumCefrLevel, context.curriculumCefrLevel)
      : context.curriculumCefrLevel,
    curriculumLevels: context.curriculumLevels,
    suggestedQuestionLevel: context.suggestedQuestionLevel,
    recentAccuracy: context.recentAccuracy,
    recentAccuracySampleCount: Array.isArray(results) ? Math.min(10, results.length) : 0,
    weakConcepts: context.weakConcepts.slice(0, 3).map(({ concept, questionLevel, misses }) => ({
      concept, questionLevel, misses,
    })),
    byLevel: Object.fromEntries(Object.entries(context.byLevel)
      .filter(([level]) => ELO_LEVELS.includes(level))
      .map(([level, counts]) => [level, {
        correct: Math.max(0, Number(counts?.correct) || 0),
        missed: Math.max(0, Number(counts?.missed) || 0),
      }])),
    selfReportedStatements: context.selfReportedStatements.slice(0, 10),
  };
}
