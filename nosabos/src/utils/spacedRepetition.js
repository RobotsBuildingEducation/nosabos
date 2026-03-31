/**
 * Spaced Repetition System (SRS) - SM-2 inspired algorithm
 *
 * Cards progress through states: New → Learning → Review
 * After each review, the user rates quality which determines the next interval.
 *
 * Quality ratings:
 *   1 = "Again"  — complete failure, reset to learning
 *   2 = "Hard"   — correct but difficult, shorter interval
 *   3 = "Good"   — correct with effort, normal interval
 *   4 = "Easy"   — effortless recall, longer interval
 */

// Default SRS fields for a new card
export function getDefaultSRSData() {
  return {
    interval: 0, // days until next review (0 = learning phase)
    easeFactor: 2.5, // difficulty multiplier (SM-2 default)
    reviewCount: 0, // total times reviewed
    streak: 0, // consecutive correct answers
    dueDate: null, // ISO string, null = new card
    lastReviewDate: null, // ISO string
    state: "new", // "new" | "learning" | "review"
    learningStep: 0, // current step in learning phase
  };
}

// Learning steps in minutes: first fail → 1min, then 10min, then graduate to review
const LEARNING_STEPS_MINUTES = [1, 10];

// Maximum interval cap (days)
const MAX_INTERVAL_DAYS = 365;

// Minimum ease factor
const MIN_EASE_FACTOR = 1.3;

/**
 * Calculate the next review state after a quality rating.
 *
 * @param {Object} srsData - Current SRS data for the card
 * @param {number} quality - Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 * @returns {Object} Updated SRS data
 */
export function calculateNextReview(srsData = {}, quality) {
  const current = { ...getDefaultSRSData(), ...srsData };
  const now = new Date();

  const result = {
    ...current,
    lastReviewDate: now.toISOString(),
    reviewCount: current.reviewCount + 1,
  };

  if (quality === 1) {
    // "Again" — reset to learning phase
    result.state = "learning";
    result.learningStep = 0;
    result.streak = 0;
    result.easeFactor = Math.max(
      MIN_EASE_FACTOR,
      current.easeFactor - 0.2
    );
    // Due in 1 minute
    const due = new Date(now.getTime() + LEARNING_STEPS_MINUTES[0] * 60000);
    result.dueDate = due.toISOString();
    result.interval = 0;
    return result;
  }

  // Correct answer (quality 2, 3, or 4)
  result.streak = current.streak + 1;

  if (current.state === "new" || current.state === "learning") {
    // In learning phase
    const nextStep = current.learningStep + 1;

    if (quality === 4) {
      // "Easy" during learning → graduate immediately with 4-day interval
      result.state = "review";
      result.interval = 4;
      result.learningStep = 0;
      result.easeFactor = Math.max(
        MIN_EASE_FACTOR,
        current.easeFactor + 0.15
      );
    } else if (nextStep >= LEARNING_STEPS_MINUTES.length) {
      // Completed all learning steps → graduate to review
      result.state = "review";
      result.interval = 1; // First review interval: 1 day
      result.learningStep = 0;
    } else {
      // Move to next learning step
      result.state = "learning";
      result.learningStep = nextStep;
      const due = new Date(
        now.getTime() + LEARNING_STEPS_MINUTES[nextStep] * 60000
      );
      result.dueDate = due.toISOString();
      result.interval = 0;
      return result;
    }
  } else {
    // In review phase — apply SM-2 algorithm
    let newInterval;
    const ef = current.easeFactor;

    switch (quality) {
      case 2: // Hard
        newInterval = Math.max(1, Math.round(current.interval * 1.2));
        result.easeFactor = Math.max(MIN_EASE_FACTOR, ef - 0.15);
        break;
      case 3: // Good
        newInterval =
          current.interval === 0
            ? 1
            : Math.round(current.interval * ef);
        break;
      case 4: // Easy
        newInterval =
          current.interval === 0
            ? 4
            : Math.round(current.interval * ef * 1.3);
        result.easeFactor = Math.max(MIN_EASE_FACTOR, ef + 0.15);
        break;
      default:
        newInterval = current.interval;
    }

    result.interval = Math.min(newInterval, MAX_INTERVAL_DAYS);
  }

  // Set due date based on interval (days from now)
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + result.interval);
  dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
  result.dueDate = dueDate.toISOString();

  return result;
}

/**
 * Check if a card is due for review.
 * @param {Object} srsData - Card's SRS data
 * @returns {boolean}
 */
export function isCardDue(srsData) {
  if (!srsData || !srsData.dueDate) return false;
  return new Date(srsData.dueDate) <= new Date();
}

/**
 * Categorize cards into study queues.
 *
 * @param {Array} allCards - All flashcard data objects
 * @param {Object} progressMap - Map of cardId → { completed, ...srsFields }
 * @param {number} newCardsPerDay - Max new cards to introduce per session (default 10)
 * @returns {Object} { dueCards, newCards, learningCards, counts }
 */
export function buildStudyQueue(allCards, progressMap = {}, newCardsPerDay = 10) {
  const now = new Date();
  const dueCards = [];
  const learningCards = [];
  const newCards = [];
  const reviewedToday = [];

  for (const card of allCards) {
    const progress = progressMap[card.id];

    if (!progress || !progress.dueDate) {
      // Never seen → new card
      newCards.push(card);
      continue;
    }

    const srs = { ...getDefaultSRSData(), ...progress };
    const dueDate = new Date(srs.dueDate);

    if (srs.state === "learning") {
      if (dueDate <= now) {
        learningCards.push(card);
      }
      // Learning cards not yet due are still "in progress" - show them soon
      else {
        learningCards.push(card);
      }
    } else if (srs.state === "review" && dueDate <= now) {
      dueCards.push(card);
    } else if (srs.state === "review" && dueDate > now) {
      reviewedToday.push(card);
    }
  }

  // Sort due cards: most overdue first
  dueCards.sort((a, b) => {
    const aDue = new Date(progressMap[a.id]?.dueDate || 0);
    const bDue = new Date(progressMap[b.id]?.dueDate || 0);
    return aDue - bDue;
  });

  // Limit new cards per session
  const availableNewCards = newCards.slice(0, newCardsPerDay);

  // Build the study queue: learning first, then due reviews, then new
  const studyQueue = [...learningCards, ...dueCards, ...availableNewCards];

  return {
    studyQueue,
    dueCards,
    newCards: availableNewCards,
    learningCards,
    counts: {
      due: dueCards.length,
      learning: learningCards.length,
      new: availableNewCards.length,
      totalNew: newCards.length,
      reviewed: reviewedToday.length,
      total: studyQueue.length,
    },
  };
}

/**
 * Get display text for next review intervals based on current SRS state.
 * Shows the user what each quality rating will result in.
 *
 * @param {Object} srsData - Current SRS data
 * @returns {Object} { again, hard, good, easy } with human-readable interval strings
 */
export function getNextIntervalPreview(srsData = {}) {
  const current = { ...getDefaultSRSData(), ...srsData };

  const formatInterval = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    const days = Math.round(minutes / 1440);
    if (days === 1) return "1d";
    if (days < 30) return `${days}d`;
    const months = Math.round(days / 30);
    return `${months}mo`;
  };

  if (current.state === "new" || current.state === "learning") {
    const step = current.learningStep || 0;
    return {
      again: formatInterval(LEARNING_STEPS_MINUTES[0]),
      hard: formatInterval(
        LEARNING_STEPS_MINUTES[Math.min(step + 1, LEARNING_STEPS_MINUTES.length - 1)]
      ),
      good:
        step + 1 >= LEARNING_STEPS_MINUTES.length
          ? formatInterval(1440) // 1 day (graduating)
          : formatInterval(LEARNING_STEPS_MINUTES[step + 1]),
      easy: formatInterval(4 * 1440), // 4 days
    };
  }

  // Review phase
  const ef = current.easeFactor || 2.5;
  const iv = current.interval || 1;

  return {
    again: formatInterval(LEARNING_STEPS_MINUTES[0]),
    hard: formatInterval(Math.max(1, Math.round(iv * 1.2)) * 1440),
    good: formatInterval(Math.round(iv * ef) * 1440),
    easy: formatInterval(
      Math.min(Math.round(iv * ef * 1.3), MAX_INTERVAL_DAYS) * 1440
    ),
  };
}
