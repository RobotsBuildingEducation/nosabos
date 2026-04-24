import {
  getLanguageDirection,
  getLanguageLocale,
} from "../constants/languages";

export const syncDocumentLanguage = (
  language,
  fallbackLocale = "en-US",
  fallbackDirection = "ltr",
) => {
  if (typeof document === "undefined") return null;

  const nextLocale = getLanguageLocale(language, fallbackLocale);
  const nextDirection = getLanguageDirection(language, fallbackDirection);

  document.documentElement.lang = nextLocale;
  document.documentElement.dir = nextDirection;

  return {
    lang: nextLocale,
    dir: nextDirection,
  };
};
