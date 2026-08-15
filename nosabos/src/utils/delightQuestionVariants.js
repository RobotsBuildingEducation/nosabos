export const DELIGHT_VARIANTS = [
  {
    id: "sentence_detective",
    label: "Sentence Detective",
    icon: "🔎",
    description: "Find the broken word and repair it.",
  },
  {
    id: "dialogue_fork",
    label: "Dialogue Fork",
    icon: "💬",
    description: "Choose the most natural reply.",
  },
  {
    id: "sentence_shapeshifter",
    label: "Sentence Shapeshifter",
    icon: "✨",
    description: "Transform a sentence without losing its meaning.",
  },
  {
    id: "word_neighborhoods",
    label: "Word Neighborhoods",
    icon: "🏘️",
    description: "Sort words into the groups where they belong.",
  },
  {
    id: "morphology_forge",
    label: "Morphology Forge",
    icon: "⚒️",
    description: "Build the right word from meaningful pieces.",
  },
  {
    id: "three_clue_mystery",
    label: "Three-Clue Mystery",
    icon: "🕵️",
    description: "Name the word with as few clues as possible.",
  },
  {
    id: "listen_difference",
    label: "Listen for the Difference",
    icon: "🎧",
    description: "Hear the detail that changes the meaning.",
  },
  {
    id: "three_word_challenge",
    label: "Three-Word Challenge",
    icon: "🎨",
    description: "Create an original sentence from three cues.",
  },
  {
    id: "natural_or_weird",
    label: "Natural or Weird?",
    icon: "🌀",
    description: "Trust your ear, then uncover the repair.",
  },
];

export const DELIGHT_VARIANT_IDS = DELIGHT_VARIANTS.map(({ id }) => id);

const SCHEMAS = {
  sentence_detective:
    '{"instruction":"...","sentence":"...","correctedSentence":"...","tokens":["..."],"joiner":" ","incorrectIndex":0,"wrongToken":"...","replacements":["...","...","...","..."],"answer":"...","slotType":"noun|verb|adjective|adverb|other","errorCategory":"...","targetSkill":"...","sourceEvidence":"...","hint":"...","explanation":"..."}',
  dialogue_fork:
    '{"instruction":"...","speaker":"...","line":"...","options":["..."],"answerIndex":0,"reaction":"...","hint":"...","explanation":"..."}',
  sentence_shapeshifter:
    '{"instruction":"...","source":"...","constraint":"...","answer":"...","acceptableAnswers":["..."],"hint":"...","explanation":"..."}',
  word_neighborhoods:
    '{"instruction":"...","groups":[{"label":"...","items":["...","..."]},{"label":"...","items":["...","..."]}],"hint":"...","explanation":"..."}',
  morphology_forge:
    '{"instruction":"...","sentence":"... ___ ...","pieces":["..."],"answerPieces":["..."],"answerWord":"...","hint":"...","explanation":"..."}',
  three_clue_mystery:
    '{"instruction":"...","clues":["...","...","..."],"answer":"...","acceptableAnswers":["..."],"example":"...","hint":"...","explanation":"..."}',
  listen_difference:
    '{"instruction":"...","audioText":"...","options":["...","..."],"answerIndex":0,"contrast":"...","hint":"...","explanation":"..."}',
  three_word_challenge:
    '{"instruction":"...","cues":["...","...","..."],"sampleAnswers":["...","..."],"reaction":"...","hint":"...","explanation":"..."}',
  natural_or_weird:
    '{"instruction":"...","sentence":"...","isNatural":false,"correction":"...","hint":"...","explanation":"..."}',
};

const VARIANT_RULES = {
  sentence_detective: [
    "Write one short sentence containing exactly one wrong word.",
    "tokens must reproduce sentence in reading order, with punctuation attached where natural.",
    "incorrectIndex is zero-based and points to the wrong token.",
    "replacements contains 3 or 4 options including answer.",
    "The answer must have the same gender, number, and syntactic compatibility as the token it replaces so repairing one token produces a fully natural sentence.",
    "Avoid stereotypes and debatable real-world claims; use a context where the intended lexical or grammatical repair is unambiguous.",
    "instruction must only ask the learner to tap the incorrect word and then choose its replacement.",
  ],
  dialogue_fork: [
    "Create a two-line everyday micro-conversation.",
    "Exactly one of 4 options is the most natural response.",
    "reaction is the speaker's brief response after the correct choice.",
    "instruction must only ask the learner to choose one response.",
  ],
  sentence_shapeshifter: [
    "Give a short source sentence and one explicit transformation constraint.",
    "The learner must type the complete transformed sentence.",
    "Include reasonable acceptableAnswers when more than one surface form works.",
    "instruction must ask the learner to type the complete transformed sentence.",
  ],
  word_neighborhoods: [
    "Create exactly 2 clearly distinct groups with 3 unique items each.",
    "For grammar, group forms or structures. For vocabulary, group by meaning, use, or register.",
    "Do not put the category answer inside the instruction.",
    "instruction must only ask the learner to sort every word into a group.",
  ],
  morphology_forge: [
    "Put ___ where the forged word belongs in sentence.",
    "pieces contains the correct pieces plus 2 plausible distractor pieces.",
    "answerPieces gives exactly 2 or 3 morpheme pieces in order; never use a complete word as one answer piece.",
    "pieces must be reusable-looking stems, prefixes, suffixes, or endings—not a list of complete conjugated words.",
    "instruction must only ask the learner to tap pieces to build the missing word.",
  ],
  three_clue_mystery: [
    "Create exactly 3 clues, ordered from subtle to obvious.",
    "The answer is one useful target-language word or short lexical phrase.",
    "example uses the answer naturally but is only revealed after grading.",
    "instruction may ask the learner to reveal clues and type a guess.",
  ],
  listen_difference: [
    "Create two short target-language options that differ by one meaningful sound, ending, word, or agreement feature.",
    "audioText exactly equals the correct option.",
    "contrast briefly names the important difference.",
    "instruction must only ask the learner to play the audio and choose the sentence heard.",
  ],
  three_word_challenge: [
    "Give exactly 3 target-language cue words appropriate to the level.",
    "The learner must produce one original, natural sentence using all three cues; inflected forms may count.",
    "Provide 2 different valid sample answers for judging context only.",
    "instruction must only ask the learner to type one sentence using all three cues.",
  ],
  natural_or_weird: [
    "Create a short sentence that is either fully natural or contains one common learner error.",
    "Choose natural versus weird unpredictably.",
    "If natural, correction must equal sentence. If weird, provide the natural correction.",
    "instruction must only ask the learner to choose Natural or Weird. Never ask them to type or repair the correction.",
  ],
};

const LANGUAGE_NAMES = {
  ar: "Egyptian Arabic",
  zh: "Mandarin Chinese",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fr: "French",
  ga: "Irish",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  nah: "Eastern Huasteca Nahuatl",
  nl: "Dutch",
  pl: "Polish",
  pt: "Brazilian Portuguese",
  ru: "Russian",
  yua: "Yucatec Maya",
};

const DETACHED_NOUN_DETERMINERS = {
  de: [
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "einen",
    "einem",
    "einer",
  ],
  el: ["ο", "η", "το", "οι", "τα", "ένας", "μια", "ένα"],
  en: ["a", "an", "the"],
  es: ["el", "la", "los", "las", "un", "una", "unos", "unas"],
  fr: ["le", "la", "les", "un", "une", "des", "du"],
  ga: ["an", "na"],
  it: ["il", "lo", "la", "i", "gli", "le", "un", "uno", "una"],
  nl: ["de", "het", "een"],
  pt: ["o", "a", "os", "as", "um", "uma", "uns", "umas"],
};

export function getDelightLanguageName(code = "en") {
  return LANGUAGE_NAMES[code] || code;
}

export function normalizeDelightText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSentenceSurface(value = "") {
  return String(value)
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?،。！？；：])/g, "$1")
    .replace(/([¿¡])\s+/g, "$1");
}

export function parseDelightQuestion(raw = "") {
  if (raw && typeof raw === "object") return raw;
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Models sometimes wrap valid JSON in a short preamble or code fence.
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function stringList(value, limit = 12) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];
}

export function normalizeDelightQuestion(variant, raw) {
  const source = parseDelightQuestion(raw);
  if (!source || !DELIGHT_VARIANT_IDS.includes(variant)) return null;
  const base = {
    variant,
    instruction: String(source.instruction || "").trim(),
    hint: String(source.hint || "").trim(),
    explanation: String(source.explanation || "").trim(),
  };

  if (variant === "sentence_detective") {
    const tokens = stringList(source.tokens, 30);
    const replacements = stringList(source.replacements, 6);
    const incorrectIndex = Number(source.incorrectIndex);
    const answer = String(source.answer || "").trim();
    const slotType = String(source.slotType || "").trim().toLowerCase();
    const joiner = source.joiner === "" ? "" : " ";
    const sentence = tokens.join(joiner);
    const correctedTokens = [...tokens];
    if (Number.isInteger(incorrectIndex) && correctedTokens[incorrectIndex]) {
      correctedTokens[incorrectIndex] = answer;
    }
    const correctedSentence = correctedTokens.join(joiner);
    const replacementKeys = replacements.map(normalizeDelightText);
    if (
      tokens.length < 3 ||
      !Number.isInteger(incorrectIndex) ||
      incorrectIndex < 0 ||
      incorrectIndex >= tokens.length ||
      replacements.length !== 4 ||
      new Set(replacementKeys).size !== replacements.length ||
      !answer ||
      !replacements.some(
        (replacement) =>
          normalizeDelightText(replacement) === normalizeDelightText(answer),
      ) ||
      normalizeDelightText(tokens[incorrectIndex]) ===
        normalizeDelightText(answer) ||
      (source.wrongToken &&
        normalizeDelightText(source.wrongToken) !==
          normalizeDelightText(tokens[incorrectIndex])) ||
      (source.sentence &&
        normalizeSentenceSurface(source.sentence) !==
          normalizeSentenceSurface(sentence)) ||
      !source.correctedSentence ||
      normalizeSentenceSurface(source.correctedSentence) !==
        normalizeSentenceSurface(correctedSentence) ||
      !String(source.instruction || "").trim() ||
      !["noun", "verb", "adjective", "adverb", "other"].includes(slotType) ||
      !String(source.hint || "").trim() ||
      !String(source.explanation || "").trim() ||
      !String(source.errorCategory || "").trim() ||
      !String(source.targetSkill || "").trim() ||
      !String(source.sourceEvidence || "").trim()
    )
      return null;
    return {
      ...base,
      sentence,
      correctedSentence,
      tokens,
      joiner,
      incorrectIndex,
      wrongToken: tokens[incorrectIndex],
      replacements,
      answer,
      slotType,
      errorCategory: String(source.errorCategory).trim(),
      targetSkill: String(source.targetSkill).trim(),
      sourceEvidence: String(source.sourceEvidence || "").trim(),
    };
  }

  if (variant === "dialogue_fork") {
    const options = stringList(source.options, 6);
    const answerIndex = Number(source.answerIndex);
    if (
      !source.line ||
      options.length < 2 ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= options.length
    )
      return null;
    return {
      ...base,
      speaker: String(source.speaker || "Speaker").trim(),
      line: String(source.line).trim(),
      options,
      answerIndex,
      reaction: String(source.reaction || "").trim(),
    };
  }

  if (variant === "sentence_shapeshifter") {
    const answer = String(source.answer || "").trim();
    if (!source.source || !source.constraint || !answer) return null;
    return {
      ...base,
      source: String(source.source).trim(),
      constraint: String(source.constraint).trim(),
      answer,
      acceptableAnswers: stringList(source.acceptableAnswers, 8),
    };
  }

  if (variant === "word_neighborhoods") {
    const groups = Array.isArray(source.groups)
      ? source.groups
          .map((group) => ({
            label: String(group?.label || "").trim(),
            items: stringList(group?.items, 6),
          }))
          .filter((group) => group.label && group.items.length >= 2)
          .slice(0, 3)
      : [];
    const allItems = groups.flatMap((group) => group.items);
    if (
      groups.length < 2 ||
      new Set(allItems.map(normalizeDelightText)).size !== allItems.length
    )
      return null;
    return { ...base, groups };
  }

  if (variant === "morphology_forge") {
    const pieces = stringList(source.pieces, 10);
    const answerPieces = stringList(source.answerPieces, 6);
    if (
      !source.sentence ||
      pieces.length < 4 ||
      answerPieces.length < 2 ||
      answerPieces.length > 3
    )
      return null;
    return {
      ...base,
      sentence: String(source.sentence).trim(),
      pieces,
      answerPieces,
      answerWord:
        String(source.answerWord || "").trim() || answerPieces.join(""),
    };
  }

  if (variant === "three_clue_mystery") {
    const clues = stringList(source.clues, 3);
    const answer = String(source.answer || "").trim();
    if (clues.length !== 3 || !answer) return null;
    return {
      ...base,
      clues,
      answer,
      acceptableAnswers: stringList(source.acceptableAnswers, 8),
      example: String(source.example || "").trim(),
    };
  }

  if (variant === "listen_difference") {
    const options = stringList(source.options, 4);
    const answerIndex = Number(source.answerIndex);
    if (
      !source.audioText ||
      options.length < 2 ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= options.length
    )
      return null;
    return {
      ...base,
      audioText: String(source.audioText).trim(),
      options,
      answerIndex,
      contrast: String(source.contrast || "").trim(),
    };
  }

  if (variant === "three_word_challenge") {
    const cues = stringList(source.cues, 3);
    const sampleAnswers = stringList(source.sampleAnswers, 5);
    if (cues.length !== 3 || !sampleAnswers.length) return null;
    return {
      ...base,
      cues,
      sampleAnswers,
      reaction: String(source.reaction || "").trim(),
    };
  }

  if (variant === "natural_or_weird") {
    if (!source.sentence || typeof source.isNatural !== "boolean") return null;
    return {
      ...base,
      sentence: String(source.sentence).trim(),
      isNatural: source.isNatural,
      correction: String(source.correction || source.sentence).trim(),
    };
  }

  return null;
}

export function buildDelightQuestionPrompt({
  variant,
  moduleType,
  targetLang,
  supportLang,
  cefrLevel = "A1",
  lessonContent = null,
}) {
  const target = getDelightLanguageName(targetLang);
  const support = getDelightLanguageName(supportLang);
  const moduleFocus =
    moduleType === "grammar"
      ? [
          "Test the lesson's grammar objective; vocabulary must remain familiar.",
          "The grading distinction MUST depend on morphology, syntax, agreement, tense, word order, or another grammatical form—not factual plausibility, stereotypes, or world knowledge.",
          "Never mention factual plausibility, stereotypes, or what people/animals usually do in the instruction, hint, or explanation.",
          "For Sentence Detective, the marked token must make the sentence genuinely ungrammatical and the replacement must repair that grammar error.",
          "For Word Neighborhoods, group grammatical forms or structures. For Three-Clue Mystery, clues should lead to a useful target-language form that demonstrates the grammar objective.",
        ].join(" ")
      : [
          "Test the lesson's vocabulary objective; grammar must remain level-appropriate.",
          "The grading distinction MUST depend on word meaning, lexical choice, semantic category, collocation, or register—not an unrelated grammar trick.",
          "Use direct functional contexts, definitions, collocations, or category knowledge; never rely on stereotypes about what a type of person usually owns, eats, drinks, or does.",
          "For Sentence Detective, the marked token must be semantically incompatible with the context, and only the answer should restore the intended meaning.",
        ].join(" ");
  const lessonScope = {
    topic: lessonContent?.topic || "",
    words: lessonContent?.words || [],
    focusPoints: lessonContent?.focusPoints || [],
    levelGuard: lessonContent?.levelGuard || "",
    curriculumContext: lessonContent?.curriculumContext || null,
  };

  return [
    `Create one ${variant.replaceAll("_", " ")} exercise for a ${cefrLevel} learner of ${target}.`,
    moduleFocus,
    `Write learner-facing instructions, hints, category labels, constraints, speaker labels, and explanations in ${support}.`,
    `Write sentences, answer options, cue words, word pieces, and dialogue utterances in ${target}, except when a short ${support} context is pedagogically necessary.`,
    "Keep the interaction compact, natural, culturally neutral, and suitable for a mobile card.",
    "There must be exactly one defensible grading outcome unless the schema explicitly allows acceptableAnswers.",
    "Do not use markdown. Return one JSON object only.",
    `Lesson scope: ${JSON.stringify(lessonScope)}`,
    `Rules: ${(VARIANT_RULES[variant] || []).join(" ")}`,
    `Required schema: ${SCHEMAS[variant]}`,
  ].join("\n");
}

function getLessonScope(lessonContent = null) {
  return {
    topic: lessonContent?.topic || "",
    words: lessonContent?.words || [],
    focusPoints: lessonContent?.focusPoints || [],
    levelGuard: lessonContent?.levelGuard || "",
    curriculumContext: lessonContent?.curriculumContext || null,
  };
}

export function buildSentenceDetectivePrompt({
  moduleType,
  targetLang,
  supportLang,
  cefrLevel = "A1",
  lessonContent = null,
  previousIssues = [],
}) {
  const target = getDelightLanguageName(targetLang);
  const support = getDelightLanguageName(supportLang);
  const isGrammar = moduleType === "grammar";
  const lessonScope = getLessonScope(lessonContent);
  const hasLessonScope = Boolean(
    lessonScope.topic ||
      lessonScope.words.length ||
      lessonScope.focusPoints.length ||
      lessonScope.curriculumContext,
  );
  const focusRules = isGrammar
    ? [
        "The original sentence MUST be genuinely ungrammatical in the target language.",
        "The one-token correction must directly test the lesson grammar objective: morphology, syntax, agreement, tense, mood, case, article, pronoun, or word order.",
        "Every distractor must make the complete sentence genuinely ungrammatical, not merely change its meaning, nuance, tense, or aspect. Prefer person, number, gender, case, or agreement contrasts within one paradigm. Never offer an alternative tense/aspect that could also fit the sentence context.",
        "Do not use factual plausibility, stereotypes, common behavior, or world knowledge to make a token seem wrong.",
        "Keep all non-target vocabulary familiar so vocabulary knowledge is not the grading distinction.",
      ]
    : [
        "The original sentence must remain grammatically well formed but contain one contextually incompatible lexical token.",
        "The answer and all distractors must be the same part of speech and must fit the same grammatical slot, including gender, number, inflection, article agreement, and punctuation.",
        "For EVERY noun slot, include the complete determiner+noun phrase as the single replaceable token and in every replacement (for example, 'el libro' / 'la mesa'). Never leave an article or determiner in the preceding token. This is required even when every noun happens to share a gender.",
        "Use a direct definition, function, category, or strong collocation so exactly one option restores the intended meaning.",
        "Do not use stereotypes, personal preferences, typical behavior, or debatable real-world expectations as evidence.",
        "When lesson words are supplied, use one of those exact words (or its grammatically required inflection) as the answer.",
      ];

  return [
    `Create one production-ready Sentence Detective exercise for a ${cefrLevel} learner of ${target}.`,
    `This is a ${isGrammar ? "GRAMMAR" : "VOCABULARY"} exercise.`,
    ...focusRules,
    `Write instruction, hint, explanation, errorCategory, and targetSkill in ${support}.`,
    `Write sentence, correctedSentence, tokens, wrongToken, replacements, and answer in ${target}.`,
    "The learner first taps the single broken token and then chooses its replacement.",
    "Return tokens in exact reading order. sentence MUST equal tokens joined with joiner.",
    'Set joiner to "" only for languages normally written without spaces (such as Chinese or Japanese); otherwise set it to " ".',
    "The corrected sentence must differ from the original at incorrectIndex only. correctedSentence MUST equal tokens with answer substituted at incorrectIndex, joined with joiner.",
    "Attach punctuation consistently to the token and every replacement for that slot.",
    "Return exactly 4 unique replacements including answer. The wrong token may be one distractor, but answer must differ from it.",
    "Exactly one replacement—the answer—may produce a correct, natural sentence in the supplied context.",
    "wrongToken must exactly equal tokens[incorrectIndex]. incorrectIndex is zero-based.",
    "slotType must classify the replaceable token as noun, verb, adjective, adverb, or other. A determiner+noun phrase is slotType noun.",
    "Keep the sentence concise, culturally neutral, mobile-friendly, and appropriate to the CEFR level.",
    "instruction must only tell the learner to find the incorrect word and replace it; do not reveal the answer or rule.",
    "hint should guide attention without giving the answer. explanation should briefly teach why the answer repairs the sentence.",
    hasLessonScope
      ? "sourceEvidence must briefly name the supplied lesson word, focus point, or topic used to ground the question; never invent a lesson source."
      : `No lesson-specific scope was supplied. Use a common ${cefrLevel} ${moduleType} skill and set sourceEvidence to that exact general-practice skill.`,
    `Lesson scope: ${JSON.stringify(lessonScope)}`,
    previousIssues.length
      ? `A prior draft was rejected. Fix every issue: ${JSON.stringify(previousIssues)}`
      : "",
    "Do not use markdown or commentary. Return one JSON object only.",
    `Required schema: ${SCHEMAS.sentence_detective}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSentenceDetectiveValidationPrompt({
  question,
  moduleType,
  targetLang,
  supportLang,
  cefrLevel = "A1",
  lessonContent = null,
}) {
  const isGrammar = moduleType === "grammar";
  const lessonScope = getLessonScope(lessonContent);
  const hasLessonScope = Boolean(
    lessonScope.topic ||
      lessonScope.words.length ||
      lessonScope.focusPoints.length ||
      lessonScope.curriculumContext,
  );
  return [
    `Audit this Sentence Detective for a ${cefrLevel} learner of ${getDelightLanguageName(targetLang)}.`,
    `It is a ${isGrammar ? "GRAMMAR" : "VOCABULARY"} exercise. Be strict and fail closed.`,
    "Return valid=true only when every condition below passes:",
    "1. The original contains exactly one intended error and correctedSentence is completely natural.",
    "2. The correction changes only tokens[incorrectIndex], and all surface fields reconstruct exactly.",
    "3. There are exactly four unique replacements and only answer works in the stated sentence context; every distractor is plausible-looking but invalid there.",
    "For a noun slot, the complete determiner+noun phrase must be inside the replaceable token and each replacement; a preceding token must not hold the governing determiner.",
    isGrammar
      ? "4. The original and every distractor-substituted sentence are truly ungrammatical. A distractor cannot pass merely because it changes tense, aspect, nuance, or intended meaning. The distinction tests the supplied grammar objective, never factual plausibility or world knowledge."
      : "4. The original stays grammatical; the distinction is lexical meaning or collocation, and every option is morphologically and syntactically compatible with the slot.",
    hasLessonScope
      ? "5. The question is directly grounded in the supplied lesson scope, and sourceEvidence accurately identifies that grounding."
      : `5. The question tests a common ${cefrLevel} ${moduleType} skill, and sourceEvidence accurately names that general-practice skill.`,
    `6. Target-language content is in ${getDelightLanguageName(targetLang)}; learner guidance is in ${getDelightLanguageName(supportLang)}.`,
    "7. The content is culturally neutral, free of stereotypes, and suitable for the CEFR level.",
    `Lesson scope: ${JSON.stringify(lessonScope)}`,
    `Question: ${JSON.stringify(question)}`,
    "For each replacement, explicitly test whether any fluent speaker could accept the complete substituted sentence in the written context. grammarFits means the full sentence has correct morphology, agreement, syntax, tense/aspect compatibility, and punctuation—not merely that it matches the author's preferred reading. meaningFits means it satisfies the sentence's intended lexical context.",
    'Return JSON only: {"valid":true,"issues":[],"grammarFits":[true,false,false,false],"meaningFits":[true,false,false,false]}. Both boolean arrays must contain exactly four entries in the same order as replacements.',
  ].join("\n");
}

export function parseSentenceDetectiveValidation(raw = "") {
  const source = parseDelightQuestion(raw);
  if (!source || typeof source.valid !== "boolean") return null;
  const booleanList = (value) =>
    Array.isArray(value)
      ? value.filter((item) => typeof item === "boolean").slice(0, 6)
      : [];
  return {
    valid: source.valid,
    issues: stringList(source.issues, 8),
    grammarFits: booleanList(source.grammarFits),
    meaningFits: booleanList(source.meaningFits),
  };
}

function hasDetachedNounDeterminer(question, targetLang) {
  if (question.slotType !== "noun") return false;
  const precedingToken = normalizeDelightText(
    question.tokens[question.incorrectIndex - 1] || "",
  );
  const determiners = (DETACHED_NOUN_DETERMINERS[targetLang] || []).map(
    normalizeDelightText,
  );
  return determiners.includes(precedingToken);
}

export function sentenceDetectiveAuditPasses(
  question,
  validation,
  moduleType,
  targetLang,
) {
  if (
    !validation?.valid ||
    validation.issues.length > 0 ||
    validation.grammarFits.length !== question.replacements.length ||
    validation.meaningFits.length !== question.replacements.length
  )
    return false;

  const answerKey = normalizeDelightText(question.answer);
  if (moduleType === "grammar") {
    return question.replacements.every(
      (replacement, index) =>
        validation.grammarFits[index] ===
        (normalizeDelightText(replacement) === answerKey),
    );
  }

  if (hasDetachedNounDeterminer(question, targetLang)) return false;

  return question.replacements.every(
    (replacement, index) =>
      validation.grammarFits[index] &&
      validation.meaningFits[index] ===
        (normalizeDelightText(replacement) === answerKey),
  );
}

export async function generateSentenceDetectiveQuestion({
  generate,
  moduleType,
  targetLang,
  supportLang,
  cefrLevel = "A1",
  lessonContent = null,
  maxAttempts = 2,
}) {
  if (typeof generate !== "function") {
    throw new TypeError("A Sentence Detective generator is required.");
  }

  let previousIssues = [];
  const attempts = Math.max(1, Number(maxAttempts) || 1);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const rawQuestion = await generate(
      buildSentenceDetectivePrompt({
        moduleType,
        targetLang,
        supportLang,
        cefrLevel,
        lessonContent,
        previousIssues,
      }),
    );
    const question = normalizeDelightQuestion(
      "sentence_detective",
      rawQuestion,
    );
    if (!question) {
      previousIssues = [
        "The draft failed the required schema or exact one-token reconstruction contract.",
      ];
      continue;
    }
    if (
      moduleType === "vocabulary" &&
      hasDetachedNounDeterminer(question, targetLang)
    ) {
      previousIssues = [
        "The noun's article/determiner was outside the replaceable token. Combine it with the noun in wrongToken, tokens[incorrectIndex], answer, and all four replacements so every choice carries its own agreement.",
      ];
      continue;
    }

    const rawValidation = await generate(
      buildSentenceDetectiveValidationPrompt({
        question,
        moduleType,
        targetLang,
        supportLang,
        cefrLevel,
        lessonContent,
      }),
    );
    const validation = parseSentenceDetectiveValidation(rawValidation);
    if (
      sentenceDetectiveAuditPasses(
        question,
        validation,
        moduleType,
        targetLang,
      )
    ) {
      return question;
    }

    previousIssues = validation?.issues?.length
      ? validation.issues
      : [
          "The quality audit did not prove the required per-replacement grammar and meaning contract.",
        ];
  }

  const error = new Error("Unable to generate an unambiguous question.");
  error.issues = previousIssues;
  throw error;
}

export function getInitialDelightResponse(question) {
  switch (question?.variant) {
    case "sentence_detective":
      return { tokenIndex: null, replacement: "" };
    case "dialogue_fork":
    case "listen_difference":
      return { selectedIndex: null };
    case "sentence_shapeshifter":
    case "three_clue_mystery":
    case "three_word_challenge":
      return { text: "" };
    case "word_neighborhoods":
      return { assignments: {} };
    case "morphology_forge":
      return { pieceIndices: [] };
    case "natural_or_weird":
      return { choice: null };
    default:
      return {};
  }
}

function sameNormalizedList(a = [], b = []) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        normalizeDelightText(item) === normalizeDelightText(b[index]),
    )
  );
}

export function gradeDelightResponse(question, response) {
  if (!question || !response) return false;
  switch (question.variant) {
    case "sentence_detective":
      return (
        response.tokenIndex === question.incorrectIndex &&
        normalizeDelightText(response.replacement) ===
          normalizeDelightText(question.answer)
      );
    case "dialogue_fork":
    case "listen_difference":
      return response.selectedIndex === question.answerIndex;
    case "sentence_shapeshifter": {
      const accepted = [question.answer, ...(question.acceptableAnswers || [])]
        .map(normalizeDelightText)
        .filter(Boolean);
      return accepted.includes(normalizeDelightText(response.text));
    }
    case "word_neighborhoods":
      return question.groups.every((group, groupIndex) =>
        group.items.every(
          (item) => Number(response.assignments?.[item]) === groupIndex,
        ),
      );
    case "morphology_forge": {
      const chosen = (response.pieceIndices || []).map(
        (index) => question.pieces[index],
      );
      return sameNormalizedList(chosen, question.answerPieces);
    }
    case "three_clue_mystery": {
      const accepted = [question.answer, ...(question.acceptableAnswers || [])]
        .map(normalizeDelightText)
        .filter(Boolean);
      return accepted.includes(normalizeDelightText(response.text));
    }
    case "three_word_challenge":
      return null;
    case "natural_or_weird":
      return response.choice === question.isNatural;
    default:
      return false;
  }
}

export function isDelightResponseReady(question, response) {
  if (!question || !response) return false;
  switch (question.variant) {
    case "sentence_detective":
      return response.tokenIndex !== null && !!response.replacement;
    case "dialogue_fork":
    case "listen_difference":
      return response.selectedIndex !== null;
    case "sentence_shapeshifter":
    case "three_clue_mystery":
    case "three_word_challenge":
      return !!response.text?.trim();
    case "word_neighborhoods":
      return (
        Object.keys(response.assignments || {}).length ===
        question.groups.flatMap((group) => group.items).length
      );
    case "morphology_forge":
      return (response.pieceIndices || []).length > 0;
    case "natural_or_weird":
      return response.choice !== null;
    default:
      return false;
  }
}

export function buildThreeWordJudgePrompt({
  question,
  response,
  targetLang,
  supportLang,
}) {
  return [
    `Judge one original sentence written by a learner of ${getDelightLanguageName(targetLang)}.`,
    `Required cues: ${JSON.stringify(question.cues)}`,
    `Learner sentence: ${response.text}`,
    `Valid examples: ${JSON.stringify(question.sampleAnswers)}`,
    "Say YES when the sentence is understandable, natural enough for the learner level, and uses all three cues or reasonable inflected forms.",
    "Ignore minor punctuation, capitalization, and missing diacritics.",
    `Use ${getDelightLanguageName(supportLang)} only internally; output one word only: YES or NO.`,
  ].join("\n");
}

export function getDelightFallbackQuestion(variant, moduleType = "grammar") {
  const grammar = moduleType === "grammar";
  const shared = {
    variant,
    hint: grammar
      ? "Look for the form that fits the time cue."
      : "Use the surrounding meaning as your guide.",
  };
  const fallbacks = {
    sentence_detective: {
      ...shared,
      instruction: "Tap the broken word, then repair it.",
      sentence: grammar
        ? "Ayer ella fuimos al mercado."
        : "Para abrir la puerta, uso una cuchara.",
      correctedSentence: grammar
        ? "Ayer ella fue al mercado."
        : "Para abrir la puerta, uso una llave.",
      tokens: grammar
        ? ["Ayer", "ella", "fuimos", "al", "mercado."]
        : ["Para", "abrir", "la", "puerta,", "uso", "una cuchara."],
      joiner: " ",
      incorrectIndex: grammar ? 2 : 5,
      wrongToken: grammar ? "fuimos" : "una cuchara.",
      replacements: grammar
        ? ["fue", "fui", "fueron", "fuimos"]
        : ["una llave.", "una cuchara.", "una almohada.", "una ventana."],
      answer: grammar ? "fue" : "una llave.",
      slotType: grammar ? "verb" : "noun",
      errorCategory: grammar
        ? "past-tense subject agreement"
        : "word meaning",
      targetSkill: grammar
        ? "completed actions in the past"
        : "objects and their functions",
      sourceEvidence: "local development fallback",
      explanation: grammar
        ? "Ella takes the third-person singular past form fue."
        : "A llave is the object used to open a door.",
    },
    dialogue_fork: {
      ...shared,
      instruction: "Choose the most natural reply.",
      speaker: "Camarero",
      line: "¿Qué desea comer?",
      options: [
        "Estoy una sopa.",
        "Quisiera una sopa, por favor.",
        "La sopa desea.",
        "Soy una sopa.",
      ],
      answerIndex: 1,
      reaction: "¡Claro! Enseguida. 🍲",
      explanation: "Quisiera… is a natural, polite way to order.",
    },
    sentence_shapeshifter: {
      ...shared,
      instruction: "Transform the complete sentence.",
      source: "Ella come con su familia.",
      constraint: grammar
        ? "Make it happen yesterday."
        : "Replace come with a more specific meal verb for dinner.",
      answer: grammar
        ? "Ayer ella comió con su familia."
        : "Ella cena con su familia.",
      acceptableAnswers: grammar
        ? ["Ella comió con su familia ayer."]
        : [],
      explanation: grammar
        ? "The completed past form of comer is comió."
        : "Cenar specifically means to eat dinner.",
    },
    word_neighborhoods: {
      ...shared,
      instruction: "Move every word into its neighborhood.",
      groups: grammar
        ? [
            { label: "Past", items: ["fui", "comió", "hablaron"] },
            { label: "Present", items: ["voy", "come", "hablan"] },
          ]
        : [
            { label: "Food", items: ["manzana", "plátano", "pera"] },
            { label: "Clothing", items: ["camisa", "zapatos", "pantalones"] },
          ],
      explanation: "Each word now sits with others from the same family.",
    },
    morphology_forge: {
      ...shared,
      instruction: "Forge the word that completes the sentence.",
      sentence: "Cuando éramos niños, nosotros ___ en el parque.",
      pieces: ["jug", "ábamos", "aron", "aré"],
      answerPieces: ["jug", "ábamos"],
      answerWord: "jugábamos",
      explanation: "The stem jug- and imperfect ending -ábamos form jugábamos.",
    },
    three_clue_mystery: {
      ...shared,
      instruction: "Solve the mystery with as few clues as possible.",
      clues: [
        "You often need me outside.",
        "You use me when water falls from the sky.",
        "I open above your head.",
      ],
      answer: "paraguas",
      acceptableAnswers: ["el paraguas"],
      example: "Olvidé mi paraguas y llegué mojado.",
      explanation: "Paraguas means umbrella.",
    },
    listen_difference: {
      ...shared,
      instruction: "Listen carefully. Which sentence did you hear?",
      audioText: "Él compró el pan.",
      options: ["Él compró el pan.", "Él compra el pan."],
      answerIndex: 0,
      contrast: "compró = completed action · compra = present action",
      explanation: "The stressed final ó signals the completed past action.",
    },
    three_word_challenge: {
      ...shared,
      instruction: "Create one sentence using all three cues.",
      cues: ["ayer", "amigos", "parque"],
      sampleAnswers: [
        "Ayer fui al parque con mis amigos.",
        "Ayer mis amigos jugaron en el parque.",
      ],
      reaction: "That sounds like a good afternoon!",
      explanation: "Many original answers can work here.",
    },
    natural_or_weird: {
      ...shared,
      instruction: "Would someone naturally say this?",
      sentence: "Soy veinte años.",
      isNatural: false,
      correction: "Tengo veinte años.",
      explanation: "Spanish uses tener, not ser, when stating age.",
    },
  };
  return fallbacks[variant] || null;
}
