import { PHONICS_LEVELS } from '../data/phonics/index.js';

export function getPhonicsCourseProgress({ cards = [], counts = {}, placementLevel, courseLevel } = {}) {
  const entryIndex = Math.max(0, PHONICS_LEVELS.indexOf(placementLevel), PHONICS_LEVELS.indexOf(courseLevel));
  const levels = Object.fromEntries(PHONICS_LEVELS.map(level => {
    const required = cards.filter(card => card.cefrLevel === level);
    const completed = required.filter(card => Number.isSafeInteger(counts[card.id]) && counts[card.id] > 0).length;
    return [level, {
      completed,
      total: required.length,
      percentage: required.length ? completed / required.length * 100 : 0,
      isComplete: required.length > 0 && completed === required.length,
    }];
  }));
  let unlockedIndex = entryIndex;
  while (unlockedIndex < PHONICS_LEVELS.length - 1 && levels[PHONICS_LEVELS[unlockedIndex]].isComplete) unlockedIndex++;
  return { levels, entryLevel: PHONICS_LEVELS[entryIndex], unlockedLevel: PHONICS_LEVELS[unlockedIndex] };
}

export function canAccessPhonicsLevel(level, unlockedLevel, masterUnlocked = false) {
  const index = PHONICS_LEVELS.indexOf(level);
  return index >= 0 && (masterUnlocked || index <= PHONICS_LEVELS.indexOf(unlockedLevel));
}

export function resolvePhonicsLevel(selectedLevel, unlockedLevel, masterUnlocked = false) {
  return canAccessPhonicsLevel(selectedLevel, unlockedLevel, masterUnlocked) ? selectedLevel : unlockedLevel;
}
