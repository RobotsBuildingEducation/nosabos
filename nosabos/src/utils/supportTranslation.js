import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguagePromptName,
  normalizeSupportLanguage,
} from "../constants/languages";

export function resolveSupportUiLanguage({
  supportLang,
  persistedSupportLang = "",
  storedUiLang = "",
  fallback = DEFAULT_SUPPORT_LANGUAGE,
} = {}) {
  return (
    normalizeSupportLanguage(supportLang, "") ||
    normalizeSupportLanguage(persistedSupportLang, "") ||
    normalizeSupportLanguage(storedUiLang, fallback) ||
    fallback
  );
}

export function buildMessageTranslationPrompt(targetLanguage) {
  const target = normalizeSupportLanguage(
    targetLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const languageName = getLanguagePromptName(target) || target;

  return `Translate the following into clear, natural ${languageName}.
Return ONLY JSON in the format {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Write the "translation" value and every "rhs" value entirely in ${languageName}.
Split the sentence into short, aligned chunks (2-6 words) inside "pairs" for phrase-by-phrase study.
Do not return the whole sentence as a single chunk.`;
}

export function buildSimpleTranslationPrompt(targetLanguage) {
  const target = normalizeSupportLanguage(
    targetLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const languageName = getLanguagePromptName(target) || target;

  return `Translate the following into concise, natural ${languageName}.
Return ONLY JSON in the format {"translation":"..."}.
Write the "translation" value entirely in ${languageName}.
Keep the meaning faithful and learner-friendly.`;
}

export function getBaseLanguageCode(code) {
  return String(code || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
}
