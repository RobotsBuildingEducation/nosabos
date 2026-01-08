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

const buildLanguageMapFromKeys = (entry, baseKey) => {
  const hasAny = SUPPORTED_ALPHABET_LANGUAGES.some(
    (lang) => entry?.[`${baseKey}_${lang}`]
  );
  if (!hasAny) return null;

  return SUPPORTED_ALPHABET_LANGUAGES.reduce((acc, lang) => {
    acc[lang] = entry?.[`${baseKey}_${lang}`] || "";
    return acc;
  }, {});
};

export const expandAlphabetEntry = (entry) => {
  if (!entry) return entry;
  const keyedSound = buildLanguageMapFromKeys(entry, "sound");
  const keyedTip = buildLanguageMapFromKeys(entry, "tip");
  const keyedName = buildLanguageMapFromKeys(entry, "name");
  const soundLanguage =
    entry.sound_language ||
    entry.soundLanguage ||
    keyedSound ||
    buildLanguageMap(entry.sound, entry.soundEs);
  const tipLanguage =
    entry.tip_language ||
    entry.tipLanguage ||
    keyedTip ||
    buildLanguageMap(entry.tip, entry.tipEs);
  const nameLanguage =
    entry.name_language ||
    entry.nameLanguage ||
    keyedName ||
    buildLanguageMap(entry.name, entry.nameEs);

  return {
    ...entry,
    sound_language: soundLanguage,
    tip_language: tipLanguage,
    name_language: nameLanguage,
  };
};
