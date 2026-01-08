export const SUPPORTED_ALPHABET_LANGUAGES = [
  "en",
  "es",
  "pt",
  "fr",
  "it",
  "nl",
  "ja",
  "ru",
  "de",
];

const buildLanguageMap = (primary = "", secondary = "") => {
  const fallback = primary || secondary || "";
  const spanish = secondary || primary || "";
  return SUPPORTED_ALPHABET_LANGUAGES.reduce((acc, lang) => {
    if (lang === "es") {
      acc[lang] = spanish;
    } else {
      acc[lang] = fallback;
    }
    return acc;
  }, {});
};

export const expandAlphabetEntry = (entry) => {
  if (!entry) return entry;
  const soundLanguage =
    entry.sound_language ||
    entry.soundLanguage ||
    buildLanguageMap(entry.sound, entry.soundEs);
  const tipLanguage =
    entry.tip_language || entry.tipLanguage || buildLanguageMap(entry.tip, entry.tipEs);
  const nameLanguage =
    entry.name_language || entry.nameLanguage || buildLanguageMap(entry.name, entry.nameEs);

  return {
    ...entry,
    sound_language: soundLanguage,
    tip_language: tipLanguage,
    name_language: nameLanguage,
  };
};
