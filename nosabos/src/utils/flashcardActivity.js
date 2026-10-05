// These maps describe the same reviews at different stages of saving. Merge
// totals instead of adding pending work to a total that may already include it.
export function mergeFlashcardActivityCounts(...maps) {
  const merged = {};
  for (const map of maps) {
    for (const [day, value] of Object.entries(map || {})) {
      const count = Number(value);
      if (!day || !Number.isFinite(count) || count <= 0) continue;
      merged[day] = Math.max(merged[day] || 0, count);
    }
  }
  return merged;
}

// The correct-answer screen appears before the review rating saves the card.
// Hold its expected total so a later saved count doesn't add the answer twice.
export function getFlashcardReviewPreviewCount(savedCount, countBeforeAnswer = null) {
  const saved = Math.max(0, Number(savedCount) || 0);
  if (countBeforeAnswer === null) return saved;
  return Math.max(saved, Math.max(0, Number(countBeforeAnswer) || 0) + 1);
}
