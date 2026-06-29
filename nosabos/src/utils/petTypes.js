export const DEFAULT_PET_TYPE = "dog";
export const PET_TYPES = [
  DEFAULT_PET_TYPE,
  "alien",
  "robot",
  "slime",
  "ghost",
  "axolotl",
];

export const PET_TYPE_UNLOCK_LEVELS = {
  dog: 1,
  alien: 2,
  robot: 5,
  slime: 10,
  ghost: 20,
  axolotl: 40,
};

export function normalizePetType(value) {
  const type = String(value || "").toLowerCase();
  return PET_TYPES.includes(type) ? type : DEFAULT_PET_TYPE;
}

export function getCompanionLevelFromXp(xp) {
  const numericXp = Number(xp);
  const safeXp = Number.isFinite(numericXp) ? Math.max(0, numericXp) : 0;
  return Math.floor(safeXp / 100) + 1;
}

export function getPetUnlockLevel(value) {
  const type = normalizePetType(value);
  return PET_TYPE_UNLOCK_LEVELS[type] || 1;
}

export function isPetTypeUnlocked(value, companionLevel = 1) {
  return true; // TODO: TESTING — all pets unlocked. Restore the block below when done.
  // eslint-disable-next-line no-unreachable
  const numericLevel = Number(companionLevel);
  const safeLevel = Number.isFinite(numericLevel) ? Math.max(1, numericLevel) : 1;
  return safeLevel >= getPetUnlockLevel(value);
}

export function getEffectivePetType(value, companionLevel = 1) {
  const type = normalizePetType(value);
  return isPetTypeUnlocked(type, companionLevel) ? type : DEFAULT_PET_TYPE;
}

export function getNewlyUnlockedPetTypes(previousLevel = 1, nextLevel = 1) {
  const previous = Number.isFinite(Number(previousLevel))
    ? Math.max(1, Number(previousLevel))
    : 1;
  const next = Number.isFinite(Number(nextLevel)) ? Math.max(1, Number(nextLevel)) : 1;

  if (next <= previous) return [];

  return PET_TYPES.filter((type) => {
    const unlockLevel = getPetUnlockLevel(type);
    return unlockLevel > previous && unlockLevel <= next;
  });
}
