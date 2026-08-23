export function buildAssistantLanguagePolicy({
  supportLanguageName,
  targetLanguageName,
}) {
  const support = String(supportLanguageName || "the support language").trim();
  const target = String(targetLanguageName || "the target language").trim();

  return [
    `LANGUAGE CONTRACT: Write every learner-facing sentence in ${support}.`,
    `Use ${target} only for exact exercise words, answers, or examples that the learner is studying.`,
    `Do not use English or any other third language unless it is ${support} or ${target}.`,
    `Translate all headings, grammar terms, labels, definitions, glosses, and parenthetical explanations into ${support}.`,
    `Before responding, silently rewrite any third-language prose into ${support}.`,
  ].join(" ");
}
