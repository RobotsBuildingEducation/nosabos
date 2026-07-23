export const hasMorphemeBreakdown = (text) =>
  /(^|\n)\s*\*\*[^*\n]+\*\*\s*=\s*\S+/m.test(String(text || ""));

const cleanPlanValue = (value) =>
  String(value || "")
    .replace(/^\/\/\s*/, "")
    .replace(/^[“”"']+|[“”"']+$/g, "")
    .trim();

export const buildMorphemeTranslationPlanPrompt = ({
  targetLanguageName,
  supportLanguageName,
  question,
}) =>
  [
    "Determine the translation direction for a language-learning morpheme tool.",
    `The target/practice language is ${targetLanguageName}.`,
    `The learner's support language is ${supportLanguageName}.`,
    "",
    "If SOURCE_TEXT is in the support language:",
    `- translation: translate it into ${targetLanguageName}.`,
    "- targetText: use that target-language translation.",
    "",
    "If SOURCE_TEXT is in the target language:",
    `- translation: translate it into ${supportLanguageName}.`,
    "- targetText: copy the original target-language SOURCE_TEXT.",
    "",
    "targetText must ALWAYS contain the target-language wording whose morphemes should be analyzed.",
    "For names or forms that conventionally stay unchanged, preserve them.",
    "Return ONLY valid JSON with exactly these string fields:",
    '{"translation":"direct translation of the complete source","targetText":"exact target-language text to analyze"}',
    "",
    "SOURCE_TEXT:",
    question,
  ].join("\n");

export const parseMorphemeTranslationPlan = (text) => {
  const raw = String(text || "").trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      return {
        translation: cleanPlanValue(parsed?.translation),
        targetText: cleanPlanValue(parsed?.targetText),
      };
    } catch {
      // Fall through to the labeled-text parser.
    }
  }

  const translation = raw.match(
    /(?:^|\n)\s*(?:translation|traducción)\s*:\s*(.+)/i,
  )?.[1];
  const targetText = raw.match(
    /(?:^|\n)\s*(?:targetText|target text)\s*:\s*(.+)/i,
  )?.[1];

  return {
    translation: cleanPlanValue(translation),
    targetText: cleanPlanValue(targetText),
  };
};

export const buildMorphemeBreakdownPrompt = ({
  targetLanguageName,
  supportLanguageName,
  targetText,
}) =>
  [
    `Analyze the morphemes in this exact ${targetLanguageName} text:`,
    targetText,
    "",
    "Analyze all and only the target-language words above.",
    "Do not translate or analyze any source-language wording.",
    "Do not create an example sentence, add related words, or rewrite the text.",
    `Write every morpheme meaning and grammatical explanation in ${supportLanguageName}.`,
    "Return ONLY the breakdown, with no heading or introductory paragraph.",
    "",
    "Use this format for each target-language word:",
    "**word** = part1 + part2 + part3",
    "- part1: meaning or grammatical function",
    "- part2: meaning or grammatical function",
    '→ "concise whole-word gloss"',
    "",
    "If a word cannot be meaningfully divided, do not invent a split:",
    "**word** = word",
    "- word: single morpheme (brief meaning or function)",
    '→ "concise whole-word gloss"',
  ].join("\n");
