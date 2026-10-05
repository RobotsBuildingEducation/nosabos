export const CEFR_PLACEMENT_LEVELS = [
  "Pre-A1",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

export function getHighestProficiencyPlacement(...placements) {
  return placements.reduce((highest, placement) => {
    const placementIndex = CEFR_PLACEMENT_LEVELS.indexOf(placement);
    if (placementIndex < 0) return highest;

    const highestIndex = CEFR_PLACEMENT_LEVELS.indexOf(highest);
    return placementIndex > highestIndex ? placement : highest;
  }, null);
}

export function isHigherProficiencyPlacement(candidate, current) {
  const candidateIndex = CEFR_PLACEMENT_LEVELS.indexOf(candidate);
  const currentIndex = CEFR_PLACEMENT_LEVELS.indexOf(current);
  return candidateIndex >= 0 && candidateIndex > currentIndex;
}

// Placement grants access, never completion credit. Keep the beginner path's
// sequential introduction and ignore skipped/invalid placement values.
export function isContentUnlockedByPlacement(placement, contentLevel) {
  const placementIndex = CEFR_PLACEMENT_LEVELS.indexOf(placement);
  const contentIndex = CEFR_PLACEMENT_LEVELS.indexOf(contentLevel);
  return placementIndex > 0 && contentIndex >= 0 && contentIndex <= placementIndex;
}
