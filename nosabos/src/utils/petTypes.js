export const DEFAULT_PET_TYPE = "dog";
export const PET_TYPES = [
  DEFAULT_PET_TYPE,
  "alien",
  "ghost",
  "robot",
  "slime",
  "axolotl",
];

export function normalizePetType(value) {
  const type = String(value || "").toLowerCase();
  return PET_TYPES.includes(type) ? type : DEFAULT_PET_TYPE;
}
