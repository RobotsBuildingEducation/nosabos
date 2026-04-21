import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageLocale,
  normalizeSupportLanguage,
} from "../constants/languages";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const FLASHCARD_DAILY_TARGET = 12;

export const FLASHCARD_REVIEW_STATES = {
  NEW: "new",
  DUE: "due",
  LEARNING: "learning",
  SCHEDULED: "scheduled",
};

export const FLASHCARD_SCHEDULER_STATES = {
  NEW: "new",
  LEARNING: "learning",
  REVIEW: "review",
  RELEARNING: "relearning",
};

export const FLASHCARD_ANKI_PRESET = {
  learningStepsMinutes: [1, 10],
  relearningStepsMinutes: [10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 1,
  startingEase: 2.5,
  hardIntervalMultiplier: 1.2,
  easyBonus: 1.3,
  againEasePenalty: 0.2,
  hardEasePenalty: 0.15,
  easyEaseBonus: 0.15,
  lapseIntervalMultiplier: 0,
  minimumIntervalDays: 1,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function coerceDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundMinutes(value) {
  return Math.max(1, Math.round(value));
}

function isoAfterMinutes(now, minutes) {
  return new Date(now.getTime() + minutes * MINUTE_MS).toISOString();
}

function isoAfterDays(now, days) {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

function normalizeIntervalDays(progress = {}) {
  if (Number.isFinite(Number(progress?.intervalDays))) {
    return Math.max(0, Number(progress.intervalDays));
  }

  if (Number.isFinite(Number(progress?.intervalHours))) {
    return Math.max(0, Number(progress.intervalHours) / 24);
  }

  return 0;
}

function normalizeSchedulerState(progress = {}) {
  if (Object.values(FLASHCARD_SCHEDULER_STATES).includes(progress?.schedulerState)) {
    return progress.schedulerState;
  }

  if (progress?.completed === true) {
    return FLASHCARD_SCHEDULER_STATES.REVIEW;
  }

  if (progress?.nextReviewAt) {
    return FLASHCARD_SCHEDULER_STATES.LEARNING;
  }

  return FLASHCARD_SCHEDULER_STATES.NEW;
}

function deriveMasteryStage(schedulerState, intervalDays) {
  if (schedulerState === FLASHCARD_SCHEDULER_STATES.NEW) return 0;
  if (
    schedulerState === FLASHCARD_SCHEDULER_STATES.LEARNING ||
    schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
  ) {
    return 1;
  }
  if (intervalDays < 1) return 1;
  if (intervalDays < 4) return 2;
  if (intervalDays < 10) return 3;
  if (intervalDays < 30) return 4;
  if (intervalDays < 90) return 5;
  return 6;
}

function buildLearningDelayMinutes({
  schedulerState,
  stepIndex,
  rating,
  steps,
}) {
  const safeSteps = Array.isArray(steps) && steps.length > 0 ? steps : [1];
  const firstStep = safeSteps[0];
  const normalizedIndex =
    schedulerState === FLASHCARD_SCHEDULER_STATES.NEW
      ? -1
      : clamp(Number(stepIndex) || 0, 0, safeSteps.length - 1);

  if (rating === "again") {
    return {
      schedulerState:
        schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
          ? FLASHCARD_SCHEDULER_STATES.RELEARNING
          : FLASHCARD_SCHEDULER_STATES.LEARNING,
      stepIndex: 0,
      delayMinutes: firstStep,
      graduates: false,
    };
  }

  if (rating === "hard") {
    if (normalizedIndex <= 0 && safeSteps.length > 1) {
      return {
        schedulerState:
          schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
            ? FLASHCARD_SCHEDULER_STATES.RELEARNING
            : FLASHCARD_SCHEDULER_STATES.LEARNING,
        stepIndex: 0,
        delayMinutes: roundMinutes((safeSteps[0] + safeSteps[1]) / 2),
        graduates: false,
      };
    }

    return {
      schedulerState:
        schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
          ? FLASHCARD_SCHEDULER_STATES.RELEARNING
          : FLASHCARD_SCHEDULER_STATES.LEARNING,
      stepIndex: Math.max(0, normalizedIndex),
      delayMinutes: safeSteps[Math.max(0, normalizedIndex)],
      graduates: false,
    };
  }

  if (rating === "good") {
    const nextIndex = normalizedIndex + 1;
    if (nextIndex < safeSteps.length) {
      return {
        schedulerState:
          schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
            ? FLASHCARD_SCHEDULER_STATES.RELEARNING
            : FLASHCARD_SCHEDULER_STATES.LEARNING,
        stepIndex: nextIndex,
        delayMinutes: safeSteps[nextIndex],
        graduates: false,
      };
    }

    return {
      schedulerState: FLASHCARD_SCHEDULER_STATES.REVIEW,
      stepIndex: null,
      delayMinutes: null,
      graduates: true,
    };
  }

  return {
    schedulerState: FLASHCARD_SCHEDULER_STATES.REVIEW,
    stepIndex: null,
    delayMinutes: null,
    graduates: true,
  };
}

export function getLocalDayKey(value) {
  const date = coerceDate(value);
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getFlashcardReviewSnapshot(progress = {}, now = new Date()) {
  const schedulerState = normalizeSchedulerState(progress);
  const nextReviewDate = coerceDate(progress?.nextReviewAt);
  const lastReviewedDate = coerceDate(
    progress?.lastReviewedAt || progress?.completedAt,
  );
  const intervalDays = normalizeIntervalDays(progress);
  const reviewCount = Math.max(0, Number(progress?.reviewCount) || 0);
  const lapseCount = Math.max(0, Number(progress?.lapseCount) || 0);
  const successfulReviews = Math.max(
    0,
    Number(progress?.successfulReviews) ||
      (schedulerState !== FLASHCARD_SCHEDULER_STATES.NEW ? 1 : 0),
  );
  const consecutiveCorrect = Math.max(
    0,
    Number(progress?.consecutiveCorrect) || 0,
  );
  const easeFactor = clamp(
    Number(progress?.easeFactor) || FLASHCARD_ANKI_PRESET.startingEase,
    1.3,
    3.5,
  );
  const learningStepIndex = Math.max(0, Number(progress?.learningStepIndex) || 0);
  const postLapseIntervalDays = Math.max(
    FLASHCARD_ANKI_PRESET.minimumIntervalDays,
    Number(progress?.postLapseIntervalDays) || intervalDays || 1,
  );
  const completed =
    schedulerState === FLASHCARD_SCHEDULER_STATES.REVIEW ||
    schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING ||
    progress?.completed === true;

  let reviewState = FLASHCARD_REVIEW_STATES.NEW;
  if (schedulerState !== FLASHCARD_SCHEDULER_STATES.NEW) {
    if (!nextReviewDate || nextReviewDate.getTime() <= now.getTime()) {
      reviewState = FLASHCARD_REVIEW_STATES.DUE;
    } else if (
      schedulerState === FLASHCARD_SCHEDULER_STATES.LEARNING ||
      schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
    ) {
      reviewState = FLASHCARD_REVIEW_STATES.LEARNING;
    } else {
      reviewState = FLASHCARD_REVIEW_STATES.SCHEDULED;
    }
  }

  const masteryStage = deriveMasteryStage(schedulerState, intervalDays);

  return {
    ...progress,
    completed,
    schedulerState,
    nextReviewDate,
    lastReviewedDate,
    intervalDays,
    intervalHours: Number((intervalDays * 24).toFixed(2)),
    reviewCount,
    lapseCount,
    successfulReviews,
    consecutiveCorrect,
    easeFactor,
    learningStepIndex,
    postLapseIntervalDays,
    masteryStage,
    reviewState,
    isDue: reviewState === FLASHCARD_REVIEW_STATES.DUE,
  };
}

export function mapXpToReviewOutcome(xpReward = 5) {
  const xp = Number(xpReward) || 5;
  if (xp >= 7) return "easy";
  if (xp <= 4) return "hard";
  return "good";
}

export function buildFlashcardReviewUpdate(
  progress = {},
  rating = "good",
  now = new Date(),
) {
  const snapshot = getFlashcardReviewSnapshot(progress, now);
  const preset = FLASHCARD_ANKI_PRESET;
  const nowIso = now.toISOString();
  const reviewCount = snapshot.reviewCount + 1;

  let schedulerState = snapshot.schedulerState;
  let completed = snapshot.completed;
  let completedAt = progress?.completedAt || null;
  let easeFactor = snapshot.easeFactor;
  let lapseCount = snapshot.lapseCount;
  let successfulReviews = snapshot.successfulReviews;
  let consecutiveCorrect = snapshot.consecutiveCorrect;
  let intervalDays = snapshot.intervalDays;
  let learningStepIndex = snapshot.learningStepIndex;
  let nextReviewAt = progress?.nextReviewAt || null;
  let postLapseIntervalDays = snapshot.postLapseIntervalDays;

  if (schedulerState === FLASHCARD_SCHEDULER_STATES.NEW) {
    const learningUpdate = buildLearningDelayMinutes({
      schedulerState,
      stepIndex: -1,
      rating,
      steps: preset.learningStepsMinutes,
    });

    if (learningUpdate.graduates) {
      schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
      completed = true;
      completedAt = completedAt || nowIso;
      intervalDays =
        rating === "easy"
          ? preset.easyIntervalDays
          : preset.graduatingIntervalDays;
      nextReviewAt = isoAfterDays(now, intervalDays);
      learningStepIndex = 0;
      successfulReviews += 1;
      consecutiveCorrect += 1;
      if (rating === "easy") {
        easeFactor = clamp(
          easeFactor + preset.easyEaseBonus,
          1.3,
          3.5,
        );
      }
    } else {
      schedulerState = learningUpdate.schedulerState;
      completed = false;
      completedAt = null;
      learningStepIndex = learningUpdate.stepIndex;
      nextReviewAt = isoAfterMinutes(now, learningUpdate.delayMinutes);
      intervalDays = learningUpdate.delayMinutes / (24 * 60);
      if (rating === "again") {
        consecutiveCorrect = 0;
      } else {
        successfulReviews += 1;
        consecutiveCorrect += 1;
      }
      if (rating === "hard") {
        easeFactor = clamp(
          easeFactor - preset.hardEasePenalty,
          1.3,
          3.5,
        );
      }
    }
  } else if (
    schedulerState === FLASHCARD_SCHEDULER_STATES.LEARNING ||
    schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
  ) {
    const steps =
      schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
        ? preset.relearningStepsMinutes
        : preset.learningStepsMinutes;
    const learningUpdate = buildLearningDelayMinutes({
      schedulerState,
      stepIndex: learningStepIndex,
      rating,
      steps,
    });

    if (learningUpdate.graduates) {
      schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
      completed = true;
      completedAt = completedAt || nowIso;
      if (rating === "easy") {
        intervalDays =
          snapshot.schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
            ? Math.max(
                preset.minimumIntervalDays + 1,
                Math.round(postLapseIntervalDays * preset.easyBonus),
              )
            : preset.easyIntervalDays;
        easeFactor = clamp(
          easeFactor + preset.easyEaseBonus,
          1.3,
          3.5,
        );
      } else {
        intervalDays =
          snapshot.schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING
            ? postLapseIntervalDays
            : preset.graduatingIntervalDays;
      }
      nextReviewAt = isoAfterDays(now, intervalDays);
      successfulReviews += 1;
      consecutiveCorrect += 1;
    } else {
      schedulerState = learningUpdate.schedulerState;
      completed =
        schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING ||
        snapshot.schedulerState === FLASHCARD_SCHEDULER_STATES.RELEARNING;
      learningStepIndex = learningUpdate.stepIndex;
      nextReviewAt = isoAfterMinutes(now, learningUpdate.delayMinutes);
      intervalDays = learningUpdate.delayMinutes / (24 * 60);
      if (rating === "again") {
        consecutiveCorrect = 0;
      } else {
        successfulReviews += 1;
        consecutiveCorrect += 1;
      }
      if (rating === "hard") {
        easeFactor = clamp(
          easeFactor - preset.hardEasePenalty,
          1.3,
          3.5,
        );
      }
    }
  } else {
    const currentIntervalDays = Math.max(
      snapshot.intervalDays || preset.graduatingIntervalDays,
      preset.minimumIntervalDays,
    );

    if (rating === "again") {
      lapseCount += 1;
      consecutiveCorrect = 0;
      easeFactor = clamp(
        easeFactor - preset.againEasePenalty,
        1.3,
        3.5,
      );
      postLapseIntervalDays = Math.max(
        preset.minimumIntervalDays,
        Math.round(currentIntervalDays * preset.lapseIntervalMultiplier) ||
          preset.minimumIntervalDays,
      );

      if (preset.relearningStepsMinutes.length > 0) {
        schedulerState = FLASHCARD_SCHEDULER_STATES.RELEARNING;
        completed = true;
        intervalDays = postLapseIntervalDays;
        learningStepIndex = 0;
        nextReviewAt = isoAfterMinutes(now, preset.relearningStepsMinutes[0]);
      } else {
        schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
        completed = true;
        intervalDays = postLapseIntervalDays;
        nextReviewAt = isoAfterDays(now, intervalDays);
      }
    } else if (rating === "hard") {
      schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
      completed = true;
      intervalDays = Math.max(
        currentIntervalDays + 1,
        Math.round(currentIntervalDays * preset.hardIntervalMultiplier),
      );
      nextReviewAt = isoAfterDays(now, intervalDays);
      easeFactor = clamp(
        easeFactor - preset.hardEasePenalty,
        1.3,
        3.5,
      );
      successfulReviews += 1;
      consecutiveCorrect += 1;
    } else if (rating === "easy") {
      schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
      completed = true;
      const goodIntervalDays = Math.max(
        currentIntervalDays + 1,
        Math.round(currentIntervalDays * easeFactor),
      );
      intervalDays = Math.max(
        goodIntervalDays + 1,
        Math.round(goodIntervalDays * preset.easyBonus),
      );
      nextReviewAt = isoAfterDays(now, intervalDays);
      easeFactor = clamp(
        easeFactor + preset.easyEaseBonus,
        1.3,
        3.5,
      );
      successfulReviews += 1;
      consecutiveCorrect += 1;
    } else {
      schedulerState = FLASHCARD_SCHEDULER_STATES.REVIEW;
      completed = true;
      intervalDays = Math.max(
        currentIntervalDays + 1,
        Math.round(currentIntervalDays * easeFactor),
      );
      nextReviewAt = isoAfterDays(now, intervalDays);
      successfulReviews += 1;
      consecutiveCorrect += 1;
    }
  }

  return {
    completed,
    completedAt,
    updatedAt: nowIso,
    lastReviewedAt: nowIso,
    lastReviewOutcome: rating,
    nextReviewAt,
    intervalDays: Number(intervalDays.toFixed(2)),
    intervalHours: Number((intervalDays * 24).toFixed(2)),
    easeFactor: Number(easeFactor.toFixed(2)),
    schedulerState,
    learningStepIndex:
      schedulerState === FLASHCARD_SCHEDULER_STATES.NEW
        ? 0
        : Number(learningStepIndex) || 0,
    postLapseIntervalDays: Number(postLapseIntervalDays.toFixed(2)),
    masteryStage: deriveMasteryStage(schedulerState, intervalDays),
    lapseCount,
    reviewCount,
    successfulReviews,
    consecutiveCorrect,
  };
}

export function getSchedulerRatingOptions(progress = {}, now = new Date()) {
  const ratings = ["again", "hard", "good", "easy"];
  return ratings.map((rating) => {
    const patch = buildFlashcardReviewUpdate(progress, rating, now);
    return {
      rating,
      patch,
      delayLabel: formatShortDelay(patch.nextReviewAt, now),
    };
  });
}

export function getCardsReviewedTodayCount(progressMap = {}, now = new Date()) {
  const todayKey = getLocalDayKey(now);
  return Object.values(progressMap).filter((progress) => {
    const reviewedKey = getLocalDayKey(
      progress?.lastReviewedAt || progress?.completedAt,
    );
    return reviewedKey && reviewedKey === todayKey;
  }).length;
}

export function getFlashcardStudyStreak(progressMap = {}, now = new Date()) {
  const reviewedDays = new Set(
    Object.values(progressMap)
      .map((progress) =>
        getLocalDayKey(progress?.lastReviewedAt || progress?.completedAt),
      )
      .filter(Boolean),
  );

  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  while (reviewedDays.has(getLocalDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function formatRelativeReviewTime(
  nextReviewAt,
  language = "en",
  now = new Date(),
) {
  const reviewDate = coerceDate(nextReviewAt);
  const lang = normalizeSupportLanguage(language, DEFAULT_SUPPORT_LANGUAGE);
  if (!reviewDate) {
    if (lang === "es") return "Sin programar";
    if (lang === "it") return "Non programmato";
    if (lang === "fr") return "Non programme";
    return "Unscheduled";
  }

  const locale = getLanguageLocale(lang);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = reviewDate.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(diffMs / MINUTE_MS));
    return formatter.format(minutes, "minute");
  }

  if (absDiffMs < DAY_MS) {
    const hours = Math.max(1, Math.round(diffMs / HOUR_MS));
    return formatter.format(hours, "hour");
  }

  const days = Math.max(1, Math.round(diffMs / DAY_MS));
  return formatter.format(days, "day");
}

function isSameLocalDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function formatAbsoluteReviewTime(
  nextReviewAt,
  language = "en",
  now = new Date(),
) {
  const reviewDate = coerceDate(nextReviewAt);
  const lang = normalizeSupportLanguage(language, DEFAULT_SUPPORT_LANGUAGE);
  if (!reviewDate) {
    if (lang === "es") return "Sin programar";
    if (lang === "it") return "Non programmato";
    if (lang === "fr") return "Non programme";
    return "Unscheduled";
  }

  const locale = getLanguageLocale(lang);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(reviewDate);

  if (isSameLocalDay(reviewDate, now)) {
    if (lang === "es") return `Hoy a las ${timeLabel}`;
    if (lang === "it") return `Oggi alle ${timeLabel}`;
    if (lang === "fr") return `Aujourd'hui a ${timeLabel}`;
    return `Today at ${timeLabel}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameLocalDay(reviewDate, tomorrow)) {
    if (lang === "es") return `Mañana a las ${timeLabel}`;
    if (lang === "it") return `Domani alle ${timeLabel}`;
    if (lang === "fr") return `Demain a ${timeLabel}`;
    return `Tomorrow at ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(reviewDate.getFullYear() !== now.getFullYear()
      ? { year: "numeric" }
      : {}),
  }).format(reviewDate);

  if (lang === "es") return `${dateLabel} a las ${timeLabel}`;
  if (lang === "it") return `${dateLabel} alle ${timeLabel}`;
  if (lang === "fr") return `${dateLabel} a ${timeLabel}`;
  return `${dateLabel} at ${timeLabel}`;
}

export function formatShortDelay(nextReviewAt, now = new Date()) {
  const reviewDate = coerceDate(nextReviewAt);
  if (!reviewDate) return "now";

  const diffMs = Math.max(0, reviewDate.getTime() - now.getTime());
  if (diffMs < HOUR_MS) {
    return `${Math.max(1, Math.round(diffMs / MINUTE_MS))}m`;
  }
  if (diffMs < DAY_MS) {
    return `${Math.max(1, Math.round(diffMs / HOUR_MS))}h`;
  }
  return `${Math.max(1, Math.round(diffMs / DAY_MS))}d`;
}
