const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

const LANGUAGE_SCRIPT_GROUPS = {
  ar: ["Arabic"],
  el: ["Greek"],
  hi: ["Devanagari"],
  ja: ["Han", "Hiragana", "Katakana"],
  ru: ["Cyrillic"],
  zh: ["Han"],
};

const SCRIPT_PATTERNS = {
  Arabic: /\p{Script=Arabic}/u,
  Cyrillic: /\p{Script=Cyrillic}/u,
  Devanagari: /\p{Script=Devanagari}/u,
  Greek: /\p{Script=Greek}/u,
  Han: /\p{Script=Han}/u,
  Hiragana: /\p{Script=Hiragana}/u,
  Katakana: /\p{Script=Katakana}/u,
  Latin: /\p{Script=Latin}/u,
};

function baseLanguageCode(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
}

function languageScripts(languageCode = "") {
  const base = baseLanguageCode(languageCode);
  return LANGUAGE_SCRIPT_GROUPS[base] || ["Latin"];
}

/**
 * Build one durable transcription contract for the whole Tutor session.
 * Target language is intentionally first and used as OpenAI's language hint;
 * support language remains in the short steering prompt for code-switched help.
 */
export function buildTutorInputTranscription({
  inputLanguageCodes = [],
  keywords = [],
  model = DEFAULT_TRANSCRIPTION_MODEL,
} = {}) {
  const languages = (Array.isArray(inputLanguageCodes)
    ? inputLanguageCodes
    : [inputLanguageCodes]
  )
    .map(baseLanguageCode)
    .filter((code, index, all) => code && all.indexOf(code) === index);
  const [targetLanguage, supportLanguage] = languages;
  const transcription = { model };

  if (targetLanguage) transcription.language = targetLanguage;

  // gpt-4o(-mini)-transcribe supports short prompt/keyword steering. Keep this
  // compact: it is vocabulary context, not a second system prompt.
  if (targetLanguage) {
    const languageContext = supportLanguage
      ? `Language lesson: ${targetLanguage}. Occasional support questions: ${supportLanguage}. Preserve the spelling and writing systems of only these languages.`
      : `Language lesson: ${targetLanguage}. Preserve its spelling and writing system.`;
    const keywordList = (Array.isArray(keywords) ? keywords : [keywords])
      .map((keyword) => String(keyword || "").trim())
      .filter((keyword, index, all) =>
        Boolean(keyword) && all.indexOf(keyword) === index,
      )
      .slice(0, 16)
      .join(", ");
    transcription.prompt = keywordList
      ? `${languageContext} Keywords: ${keywordList}`
      : languageContext;
  }

  return transcription;
}

export function mergeTutorInputTranscription(current = {}, requested) {
  if (!requested || typeof requested !== "object") return current;
  return { ...current, ...requested };
}

/**
 * A final transcript in a writing system that neither the target nor support
 * language uses is an ASR failure, not evidence that the learner switched to a
 * third language. Require at least two strongly-scripted letters so emoji,
 * punctuation, names, and a single stray glyph do not trip the guardrail.
 */
export function hasUnexpectedTutorTranscriptScript(
  text = "",
  inputLanguageCodes = [],
) {
  const allowedScripts = new Set();
  const languageCodes = Array.isArray(inputLanguageCodes)
    ? inputLanguageCodes
    : [inputLanguageCodes];
  languageCodes.filter(Boolean).forEach((code) => {
    languageScripts(code).forEach((script) => allowedScripts.add(script));
  });
  if (!allowedScripts.size) allowedScripts.add("Latin");

  const counts = Object.fromEntries(
    Object.keys(SCRIPT_PATTERNS).map((script) => [script, 0]),
  );
  let scriptedLetters = 0;

  for (const char of String(text || "")) {
    for (const [script, pattern] of Object.entries(SCRIPT_PATTERNS)) {
      if (pattern.test(char)) {
        counts[script] += 1;
        scriptedLetters += 1;
        break;
      }
    }
  }

  if (scriptedLetters < 2) return false;
  const unexpectedLetters = Object.entries(counts).reduce(
    (total, [script, count]) =>
      allowedScripts.has(script) ? total : total + count,
    0,
  );
  return unexpectedLetters >= 2 && unexpectedLetters / scriptedLetters >= 0.6;
}
