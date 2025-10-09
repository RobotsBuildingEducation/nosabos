export const TARGET_LANGUAGE_CODES = [
  "nah",
  "es",
  "en",
  "maya",
  "mix",
  "zap",
  "oto",
  "pur",
];

export const LANGUAGE_NAME_KEYS = {
  en: "language_en",
  es: "language_es",
  nah: "language_nah",
  maya: "language_maya",
  mix: "language_mix",
  zap: "language_zap",
  oto: "language_oto",
  pur: "language_pur",
};

export const PRACTICE_LABEL_KEYS = {
  en: "onboarding_practice_en",
  es: "onboarding_practice_es",
  nah: "onboarding_practice_nah",
  maya: "onboarding_practice_maya",
  mix: "onboarding_practice_mix",
  zap: "onboarding_practice_zap",
  oto: "onboarding_practice_oto",
  pur: "onboarding_practice_pur",
};

export const LLM_LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  nah: "Nahuatl",
  maya: "Maya",
  mix: "Mixtec",
  zap: "Zapotec",
  oto: "Otomí",
  pur: "Purépecha",
};

export const isSupportedTargetLang = (code) =>
  typeof code === "string" &&
  Object.prototype.hasOwnProperty.call(LANGUAGE_NAME_KEYS, code);

export const languageKeyFor = (code) => LANGUAGE_NAME_KEYS[code] || null;

export const practiceLabelKeyFor = (code) => PRACTICE_LABEL_KEYS[code] || null;

export const llmLanguageNameFor = (code) => {
  if (!code) return null;
  const direct = LLM_LANGUAGE_NAMES[code];
  if (direct) return direct;
  const lower = typeof code === "string" ? code.toLowerCase() : "";
  return LLM_LANGUAGE_NAMES[lower] || null;
};
