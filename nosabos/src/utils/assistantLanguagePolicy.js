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

export function buildExerciseAssistancePolicy() {
  return [
    "DIRECT ASSISTANCE: The learner explicitly requested help solving the current exercise.",
    "Start with the exact answer and the concrete selections or steps to enter it, then briefly explain why it works.",
    "Use only the provided sentence, word bank, options, and answer material. Do not invent an option or ask the learner to find a piece that is not offered.",
    "For word assembly, name the available pieces in order, the assembled word, and the completed sentence.",
    "If no offered solution works, say the exercise is inconsistent and suggest skipping or refreshing it; do not pretend it is solvable.",
    "Do not withhold the answer, give a nudge, or turn the request into a guessing question. This is direct assistance, even if the request template calls it a hint.",
  ].join(" ");
}
