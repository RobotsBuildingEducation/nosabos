const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.8;
const DEFAULT_EASE_FACTOR = 2.3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toTimestamp = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const uniqueCards = (cards = []) => {
  const seen = new Set();
  return cards.filter((card) => {
    if (!card?.id || seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
};

const interleaveCards = (groups = [], limit = 10) => {
  const queues = groups.map((group) => [...group]);
  const result = [];

  while (result.length < limit) {
    let madeProgress = false;

    for (const queue of queues) {
      if (!queue.length || result.length >= limit) continue;
      result.push(queue.shift());
      madeProgress = true;
    }

    if (!madeProgress) break;
  }

  return uniqueCards(result).slice(0, limit);
};

export const FLASHCARD_SESSION_LIMITS = {
  smart: 10,
  challenge: 8,
  learn: 8,
  preview: 6,
};

export function normalizeFlashcardProgress(progress = {}) {
  const completed = progress?.completed === true;
  const completedAt = progress?.completedAt || null;
  const lastReviewedAt =
    progress?.lastReviewedAt || progress?.updatedAt || completedAt || null;
  const dueAt = progress?.dueAt || null;

  const repetitions = Math.max(
    0,
    Number(progress?.repetitions) || (completed ? 1 : 0),
  );
  const intervalDays = Math.max(
    0,
    Number(progress?.intervalDays) || (completed ? 1 : 0),
  );
  const correctCount = Math.max(
    0,
    Number(progress?.correctCount) || (completed ? 1 : 0),
  );
  const incorrectCount = Math.max(0, Number(progress?.incorrectCount) || 0);
  const lapseCount = Math.max(0, Number(progress?.lapseCount) || 0);
  const consecutiveCorrect = Math.max(
    0,
    Number(progress?.consecutiveCorrect) || (completed ? 1 : 0),
  );
  const easeFactor = clamp(
    Number(progress?.easeFactor) || DEFAULT_EASE_FACTOR,
    MIN_EASE_FACTOR,
    MAX_EASE_FACTOR,
  );

  return {
    ...progress,
    completed,
    completedAt,
    lastReviewedAt,
    dueAt,
    repetitions,
    intervalDays,
    correctCount,
    incorrectCount,
    lapseCount,
    consecutiveCorrect,
    easeFactor,
    lastReviewResult:
      progress?.lastReviewResult || (completed ? "correct" : null),
  };
}

export function isFlashcardDue(progress = {}, now = new Date()) {
  const normalized = normalizeFlashcardProgress(progress);
  if (!normalized.completed) return false;

  const dueTimestamp = toTimestamp(normalized.dueAt);
  if (!dueTimestamp) return true;

  return dueTimestamp <= now.getTime();
}

export function getFlashcardWeaknessScore(progress = {}, now = new Date()) {
  const normalized = normalizeFlashcardProgress(progress);
  const nowTs = now.getTime();
  const dueTs = toTimestamp(normalized.dueAt);
  const lastReviewedTs = toTimestamp(normalized.lastReviewedAt);

  const overdueDays =
    dueTs != null ? Math.max(0, Math.round((nowTs - dueTs) / DAY_MS)) : 0;
  const staleDays =
    lastReviewedTs != null
      ? Math.max(0, Math.round((nowTs - lastReviewedTs) / DAY_MS))
      : normalized.completed
        ? 1
        : 0;

  let score = 0;
  score += normalized.incorrectCount * 1.4;
  score += normalized.lapseCount * 2.5;
  score += overdueDays * 1.2;

  if (normalized.lastReviewResult === "incorrect") {
    score += 3;
  }

  if (normalized.completed && normalized.intervalDays <= 3) {
    score += 1.2;
  }

  if (!normalized.completed && normalized.incorrectCount > 0) {
    score += 2;
  }

  score += Math.min(staleDays * 0.2, 2);
  score -= Math.min(normalized.consecutiveCorrect * 0.35, 2);

  return Number(score.toFixed(2));
}

export function createFlashcardReviewUpdate({
  previousProgress = {},
  outcome,
  now = new Date(),
}) {
  const normalized = normalizeFlashcardProgress(previousProgress);
  const reviewedAt = now.toISOString();

  if (outcome === "correct") {
    const firstSuccessfulCompletion = !normalized.completed;
    const repetitions = firstSuccessfulCompletion
      ? 1
      : normalized.repetitions + 1;
    const consecutiveCorrect = normalized.consecutiveCorrect + 1;
    const correctCount = normalized.correctCount + 1;
    const lapsePenalty = Math.min(normalized.lapseCount * 0.03, 0.18);
    const easeFactor = clamp(
      normalized.easeFactor +
        (firstSuccessfulCompletion ? 0.05 : 0.12) -
        lapsePenalty,
      MIN_EASE_FACTOR,
      MAX_EASE_FACTOR,
    );

    let intervalDays = 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else if (repetitions === 3) {
      intervalDays = 7;
    } else {
      intervalDays = Math.max(
        normalized.intervalDays + 1,
        Math.round(normalized.intervalDays * (easeFactor - 0.1)),
      );
    }

    const dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();

    return {
      completed: true,
      completedAt: normalized.completedAt || reviewedAt,
      lastReviewedAt: reviewedAt,
      lastReviewResult: "correct",
      dueAt,
      intervalDays,
      easeFactor,
      repetitions,
      correctCount,
      incorrectCount: normalized.incorrectCount,
      lapseCount: normalized.lapseCount,
      consecutiveCorrect,
      updatedAt: reviewedAt,
    };
  }

  return {
    completed: normalized.completed,
    completedAt: normalized.completedAt || null,
    lastReviewedAt: reviewedAt,
    lastReviewResult: "incorrect",
    dueAt: reviewedAt,
    intervalDays: 0,
    easeFactor: clamp(
      normalized.easeFactor - 0.2,
      MIN_EASE_FACTOR,
      MAX_EASE_FACTOR,
    ),
    repetitions: normalized.repetitions,
    correctCount: normalized.correctCount,
    incorrectCount: normalized.incorrectCount + 1,
    lapseCount: normalized.completed
      ? normalized.lapseCount + 1
      : normalized.lapseCount,
    consecutiveCorrect: 0,
    updatedAt: reviewedAt,
  };
}

export function getFlashcardReviewBuckets({
  flashcardData = [],
  progressMap = {},
  now = new Date(),
}) {
  const dueCards = [];
  const weakCards = [];
  const newCards = [];
  const scheduledCards = [];
  const completedCards = [];

  flashcardData.forEach((card) => {
    const progress = normalizeFlashcardProgress(progressMap?.[card.id]);
    const weaknessScore = getFlashcardWeaknessScore(progress, now);

    if (progress.completed) {
      completedCards.push(card);

      if (isFlashcardDue(progress, now)) {
        dueCards.push(card);
      } else {
        scheduledCards.push(card);
      }
    } else {
      newCards.push(card);
    }

    if (weaknessScore >= 2) {
      weakCards.push(card);
    }
  });

  const sortByDueDate = (a, b) => {
    const aDue = toTimestamp(progressMap?.[a.id]?.dueAt);
    const bDue = toTimestamp(progressMap?.[b.id]?.dueAt);

    if (aDue == null && bDue == null) return 0;
    if (aDue == null) return -1;
    if (bDue == null) return 1;
    return aDue - bDue;
  };

  const sortByWeakness = (a, b) =>
    getFlashcardWeaknessScore(progressMap?.[b.id], now) -
    getFlashcardWeaknessScore(progressMap?.[a.id], now);

  const sortRecentCompleted = (a, b) => {
    const aReviewed =
      toTimestamp(progressMap?.[a.id]?.lastReviewedAt) ||
      toTimestamp(progressMap?.[a.id]?.completedAt) ||
      0;
    const bReviewed =
      toTimestamp(progressMap?.[b.id]?.lastReviewedAt) ||
      toTimestamp(progressMap?.[b.id]?.completedAt) ||
      0;

    return bReviewed - aReviewed;
  };

  return {
    dueCards: dueCards.sort(sortByDueDate),
    weakCards: uniqueCards(weakCards.sort(sortByWeakness)),
    newCards,
    scheduledCards: scheduledCards.sort(sortByDueDate),
    completedCards: completedCards.sort(sortRecentCompleted),
  };
}

export function buildFlashcardSession({
  flashcardData = [],
  progressMap = {},
  mode = "smart",
  now = new Date(),
}) {
  const buckets = getFlashcardReviewBuckets({ flashcardData, progressMap, now });
  const dueIds = new Set(buckets.dueCards.map((card) => card.id));
  const weakCards = buckets.weakCards.filter((card) => !dueIds.has(card.id));

  const configs = {
    smart: {
      label: "Smart review",
      description: "Due cards first, then weak cards, then a few fresh unlocks.",
      queue: uniqueCards([
        ...buckets.dueCards.slice(0, 6),
        ...interleaveCards(
          [weakCards.slice(0, 3), buckets.newCards.slice(0, 4)],
          4,
        ),
      ]).slice(0, FLASHCARD_SESSION_LIMITS.smart),
    },
    challenge: {
      label: "Challenge round",
      description: "Hard cards come back fast so you have to prove them twice.",
      queue: interleaveCards(
        [weakCards.slice(0, 5), buckets.dueCards.slice(0, 3), buckets.newCards],
        FLASHCARD_SESSION_LIMITS.challenge,
      ),
    },
    learn: {
      label: "Unlock new cards",
      description: "Keep momentum on new material with just enough review mixed in.",
      queue: interleaveCards(
        [buckets.newCards.slice(0, 6), buckets.dueCards.slice(0, 2)],
        FLASHCARD_SESSION_LIMITS.learn,
      ),
    },
  };

  const config = configs[mode] || configs.smart;
  let queue = config.queue;

  if (queue.length === 0 && buckets.newCards.length > 0) {
    queue = buckets.newCards.slice(0, FLASHCARD_SESSION_LIMITS.learn);
  }

  if (queue.length === 0 && buckets.completedCards.length > 0) {
    queue = buckets.completedCards.slice(0, FLASHCARD_SESSION_LIMITS.smart);
  }

  return {
    mode,
    label: config.label,
    description: config.description,
    queue,
    buckets,
  };
}
