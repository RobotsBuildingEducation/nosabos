import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIGHT_VARIANT_IDS,
  buildSentenceDetectiveJudgePrompt,
  buildSentenceDetectivePrompt,
  calculateDelightQuestionXp,
  generateSentenceDetectiveQuestion,
  getDelightFallbackQuestion,
  getInitialDelightResponse,
  gradeDelightResponse,
  isDelightResponseReady,
  normalizeDelightQuestion,
  parseDelightQuestion,
  parsePartialDelightQuestion,
  parseSentenceDetectiveValidation,
  sentenceDetectiveAuditPasses,
} from "./delightQuestionVariants.js";
import { getDialogueForkCopy } from "./dialogueForkI18n.js";
import { DELIGHT_VARIANT_TEST_IDS } from "../config/delightVariantGate.js";

function validDetective(overrides = {}) {
  return {
    instruction: "Find the incorrect word and replace it.",
    sentence: "Ayer ella fuimos al mercado.",
    correctedSentence: "Ayer ella fue al mercado.",
    tokens: ["Ayer", "ella", "fuimos", "al", "mercado."],
    joiner: " ",
    incorrectIndex: 2,
    wrongToken: "fuimos",
    replacements: ["fue", "fui", "fueron", "fuimos"],
    answer: "fue",
    slotType: "verb",
    cueTokens: ["Ayer", "ella"],
    errorEvidence: "Ella requires a third-person singular verb form.",
    repairEvidence: "Fue agrees with ella in the completed past.",
    errorCategory: "past-tense subject agreement",
    targetSkill: "completed past actions",
    sourceEvidence: "focus point: preterite tense",
    hint: "Look at the time word.",
    explanation: "Ella takes the third-person singular past form fue.",
    ...overrides,
  };
}

test("all delight variants have valid normalized fallbacks", () => {
  for (const variant of DELIGHT_VARIANT_IDS) {
    const fallback = getDelightFallbackQuestion(variant, "grammar");
    assert.ok(fallback, `missing fallback for ${variant}`);
    assert.ok(
      normalizeDelightQuestion(variant, fallback),
      `invalid fallback for ${variant}`,
    );
  }
});

test("parses JSON surrounded by model commentary", () => {
  assert.deepEqual(parseDelightQuestion('Result: {"answer":"hola"}\nDone'), {
    answer: "hola",
  });
});

test("grades deterministic interactions", () => {
  const groups = getDelightFallbackQuestion("word_neighborhoods", "grammar");
  const response = getInitialDelightResponse(groups);
  groups.groups.forEach((group, groupIndex) => {
    group.items.forEach((item) => {
      response.assignments[item] = groupIndex;
    });
  });
  assert.equal(gradeDelightResponse(groups, response), true);

  const forge = getDelightFallbackQuestion("morphology_forge", "grammar");
  assert.equal(
    gradeDelightResponse(forge, { pieceIndices: [0, 1] }),
    true,
  );
});

test("sentence detective and three-word challenge delegate grading to the AI language judge", () => {
  const detective = getDelightFallbackQuestion(
    "sentence_detective",
    "grammar",
  );
  assert.equal(
    gradeDelightResponse(detective, { tokenIndex: 2, replacement: "fue" }),
    null,
  );

  const challenge = getDelightFallbackQuestion(
    "three_word_challenge",
    "vocabulary",
  );
  assert.equal(
    gradeDelightResponse(challenge, {
      text: "Ayer fui al parque con mis amigos.",
    }),
    null,
  );
});

test("buildSentenceDetectiveJudgePrompt formats context for AI grading", () => {
  const detective = getDelightFallbackQuestion(
    "sentence_detective",
    "grammar",
  );
  const prompt = buildSentenceDetectiveJudgePrompt({
    question: detective,
    response: { tokenIndex: 2, replacement: "fue" },
    targetLang: "es",
    supportLang: "en",
    cefrLevel: "A1",
    moduleType: "grammar",
  });
  assert.ok(prompt.includes("Judge a Sentence Detective answer"));
  assert.ok(prompt.includes("Original Sentence with error:"));
  assert.ok(prompt.includes("Learner submission:"));
  assert.ok(prompt.includes("reply with ONE word only: YES or NO."));
});

test("testing gate exposes active delight variant under development", () => {
  assert.deepEqual(DELIGHT_VARIANT_TEST_IDS, [
    "sentence_detective",
    "dialogue_fork",
    "sentence_shapeshifter",
    "word_neighborhoods",
    "morphology_forge",
    "three_clue_mystery",
    "listen_difference",
    "three_word_challenge",
    "natural_or_weird",
  ]);
});

test("Sentence Detective normalization enforces exact reconstruction", () => {
  const valid = normalizeDelightQuestion(
    "sentence_detective",
    validDetective(),
  );
  assert.equal(valid?.correctedSentence, "Ayer ella fue al mercado.");

  assert.equal(
    normalizeDelightQuestion(
      "sentence_detective",
      validDetective({ correctedSentence: "Ella fue ayer al mercado." }),
    ),
    null,
  );
  assert.equal(
    normalizeDelightQuestion(
      "sentence_detective",
      validDetective({ replacements: ["fue", "fue.", "fueron", "fuimos"] }),
    ),
    null,
  );
});

test("Sentence Detective prompt distinguishes vocabulary from grammar", () => {
  const prompt = buildSentenceDetectivePrompt({
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { words: ["llave"], topic: "objects at home" },
  });
  assert.match(prompt, /remain grammatically well formed/i);
  assert.match(prompt, /same part of speech/i);
  assert.match(prompt, /general greetings/i);
  assert.match(prompt, /any ordinary interpretation/i);
  assert.match(prompt, /llave/);
  assert.doesNotMatch(prompt, /genuinely ungrammatical in the target language/i);
});

test("Sentence Detective prompt assigns target and support languages by field", () => {
  const prompt = buildSentenceDetectivePrompt({
    moduleType: "grammar",
    targetLang: "ja",
    supportLang: "ar",
  });

  assert.match(
    prompt,
    /Write instruction, hint, explanation.*in Egyptian Arabic/i,
  );
  assert.match(
    prompt,
    /Write sentence, correctedSentence, tokens.*in Japanese/i,
  );
  assert.match(prompt, /Do not translate or mix/i);
  assert.match(prompt, /Do not put Egyptian Arabic translations/i);
});

test("Sentence Detective retries invalid drafts and requires audit approval", async () => {
  const prompts = [];
  const outputs = [
    { sentence: "not enough fields" },
    validDetective(),
    {
      valid: true,
      issues: [],
      grammarFits: [true, false, false, false],
      meaningFits: [true, false, false, false],
    },
  ];
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt) => {
      prompts.push(prompt);
      return outputs.shift();
    },
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { focusPoints: ["preterite tense"] },
  });

  assert.equal(question.answer, "fue");
  assert.equal(prompts.length, 3);
  assert.match(prompts[1], /prior draft was rejected/i);
  assert.match(prompts[2], /fail closed/i);
});

test("Sentence Detective validation responses fail closed", () => {
  assert.deepEqual(
    parseSentenceDetectiveValidation('{"valid":false,"issues":["ambiguous"]}'),
    {
      valid: false,
      issues: ["ambiguous"],
      grammarFits: [],
      meaningFits: [],
      originalAcceptable: null,
      correctedAcceptable: null,
      explicitCuePresent: null,
      wrongTokenConflictsWithCue: null,
    },
  );
  assert.equal(parseSentenceDetectiveValidation("YES"), null);
});

test("vocabulary audits require every choice to fit the same grammar slot", () => {
  const question = normalizeDelightQuestion(
    "sentence_detective",
    validDetective({
      sentence: "Uso el paraguas para escribir.",
      correctedSentence: "Uso el lápiz para escribir.",
      tokens: ["Uso", "el", "paraguas", "para", "escribir."],
      incorrectIndex: 2,
      wrongToken: "paraguas",
      replacements: ["lápiz", "paraguas", "cuchara", "llave"],
      answer: "lápiz",
      slotType: "noun",
      errorCategory: "word meaning",
      targetSkill: "everyday objects",
      cueTokens: ["escribir."],
      errorEvidence: "A pencil, not an umbrella, is used to write.",
      repairEvidence: "A pencil satisfies the explicit writing function.",
    }),
  );
  const validation = {
    valid: true,
    issues: [],
    grammarFits: [true, true, true, true],
    meaningFits: [true, false, false, false],
    originalAcceptable: false,
    correctedAcceptable: true,
    explicitCuePresent: true,
    wrongTokenConflictsWithCue: true,
  };

  assert.equal(
    sentenceDetectiveAuditPasses(question, validation, "vocabulary", "es"),
    false,
  );
});

test("vocabulary generation repairs detached noun determiners before auditing", async () => {
  const externalDeterminer = validDetective({
    sentence: "Uso el paraguas para escribir.",
    correctedSentence: "Uso el lápiz para escribir.",
    tokens: ["Uso", "el", "paraguas", "para", "escribir."],
    incorrectIndex: 2,
    wrongToken: "paraguas",
    replacements: ["lápiz", "paraguas", "cuchara", "llave"],
    answer: "lápiz",
    slotType: "noun",
    cueTokens: ["escribir."],
    errorEvidence: "An umbrella conflicts with the explicit writing function.",
    repairEvidence: "A pencil satisfies the writing function.",
  });
  const repaired = validDetective({
    sentence: "Uso un paraguas para escribir.",
    correctedSentence: "Uso un lápiz para escribir.",
    tokens: ["Uso", "un paraguas", "para", "escribir."],
    incorrectIndex: 1,
    wrongToken: "un paraguas",
    replacements: ["un lápiz", "un paraguas", "una cuchara", "una llave"],
    answer: "un lápiz",
    slotType: "noun",
    cueTokens: ["escribir."],
    errorEvidence: "An umbrella conflicts with the explicit writing function.",
    repairEvidence: "A pencil satisfies the writing function.",
  });
  const outputs = [
    externalDeterminer,
    repaired,
    {
      valid: true,
      issues: [],
      grammarFits: [true, true, true, true],
      meaningFits: [true, false, false, false],
      originalAcceptable: false,
      correctedAcceptable: true,
      explicitCuePresent: true,
      wrongTokenConflictsWithCue: true,
    },
  ];
  const prompts = [];
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt) => {
      prompts.push(prompt);
      return outputs.shift();
    },
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { words: ["lápiz"] },
  });

  assert.equal(question.answer, "un lápiz");
  assert.equal(prompts.length, 3);
  assert.match(prompts[1], /article\/determiner was outside/i);
});

test("vocabulary audits reject an original sentence with a natural reading", () => {
  const question = normalizeDelightQuestion(
    "sentence_detective",
    validDetective({
      sentence: "Hello, good evening. My name is Alex.",
      correctedSentence: "Hi, good evening. My name is Alex.",
      tokens: ["Hello,", "good", "evening.", "My", "name", "is", "Alex."],
      incorrectIndex: 0,
      wrongToken: "Hello,",
      replacements: ["Hello,", "Hi,", "Goodbye,", "Thanks,"],
      answer: "Hi,",
      slotType: "other",
      cueTokens: ["good", "evening."],
      errorEvidence: "The draft incorrectly claims hello conflicts with evening.",
      repairEvidence: "Hi is also a general greeting.",
      errorCategory: "greetings",
      targetSkill: "time-of-day greetings",
    }),
  );
  const validation = {
    valid: true,
    issues: [],
    grammarFits: [true, true, true, true],
    meaningFits: [false, true, false, false],
    originalAcceptable: true,
    correctedAcceptable: true,
    explicitCuePresent: true,
    wrongTokenConflictsWithCue: false,
  };

  assert.equal(
    sentenceDetectiveAuditPasses(question, validation, "vocabulary", "en"),
    false,
  );
});

test("parsePartialDelightQuestion extracts tokens and fields from streaming chunk buffers", () => {
  const partial1 = parsePartialDelightQuestion('{"instruction":"Find the error","tokens":["Hello,","good"');
  assert.ok(partial1);
  assert.equal(partial1.instruction, "Find the error");
  assert.deepEqual(partial1.tokens, ["Hello,", "good"]);

  const partial2 = parsePartialDelightQuestion('{"tokens":["Ayer","ella","fuimos"],"replacements":["fue","fui"');
  assert.ok(partial2);
  assert.deepEqual(partial2.tokens, ["Ayer", "ella", "fuimos"]);
  assert.deepEqual(partial2.replacements, ["fue", "fui"]);
});

test("generateSentenceDetectiveQuestion notifies onStream during generation", async () => {
  const streamedChunks = [];
  const validJson = JSON.stringify(validDetective());
  const validationJson = JSON.stringify({
    valid: true,
    issues: [],
    grammarFits: [true, false, false, false],
    meaningFits: [true, false, false, false],
    originalAcceptable: false,
    correctedAcceptable: true,
  });

  let callCount = 0;
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt, onStream) => {
      callCount += 1;
      if (callCount === 1) {
        onStream?.('{"instruction":"Find the error","tokens":["Ayer","ella"');
        return validJson;
      }
      return validationJson;
    },
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    onStream: (chunk) => streamedChunks.push(chunk),
  });

  assert.ok(question);
  assert.equal(streamedChunks.length, 1);
  assert.match(streamedChunks[0], /"tokens"/);
});

test("calculateDelightQuestionXp scales XP dynamically based on question variant and performance", () => {
  const detective = { variant: "sentence_detective" };
  // First try solve (0 rejected) -> 7 XP
  assert.equal(calculateDelightQuestionXp(detective, { rejectedTokenIndices: [] }), 7);
  // 1 rejected token -> 6 XP
  assert.equal(calculateDelightQuestionXp(detective, { rejectedTokenIndices: [0] }), 6);
  // 2 rejected tokens -> 5 XP
  assert.equal(calculateDelightQuestionXp(detective, { rejectedTokenIndices: [0, 1] }), 5);

  const threeClue = { variant: "three_clue_mystery" };
  // 1 clue -> 10 XP
  assert.equal(calculateDelightQuestionXp(threeClue, {}, { revealedClues: 1 }), 10);
  // 2 clues -> 7 XP
  assert.equal(calculateDelightQuestionXp(threeClue, {}, { revealedClues: 2 }), 7);
  // 3 clues -> 4 XP
  assert.equal(calculateDelightQuestionXp(threeClue, {}, { revealedClues: 3 }), 4);

  // Generative / composition variants -> 7 XP
  assert.equal(calculateDelightQuestionXp({ variant: "three_word_challenge" }, {}), 7);
  assert.equal(calculateDelightQuestionXp({ variant: "sentence_shapeshifter" }, {}), 7);

  // Standard choices / assembly -> 6 XP
  assert.equal(calculateDelightQuestionXp({ variant: "dialogue_fork" }, {}), 6);
  assert.equal(calculateDelightQuestionXp({ variant: "word_neighborhoods" }, {}), 6);
  assert.equal(calculateDelightQuestionXp({ variant: "morphology_forge" }, {}), 6);

  // Final quiz mode always awards 0 XP
  assert.equal(calculateDelightQuestionXp(detective, {}, { isFinalQuiz: true }), 0);
});

test("dialogue_fork copy is localized across multiple languages", () => {
  const en = getDialogueForkCopy("en");
  assert.equal(en.title, "Dialogue Fork");
  assert.ok(en.instruction);
  assert.ok(en.submit);

  const es = getDialogueForkCopy("es");
  assert.equal(es.title, "Bifurcación de diálogo");
  assert.ok(es.instruction);
  assert.ok(es.submit);

  const ja = getDialogueForkCopy("ja");
  assert.equal(ja.title, "ダイアログ・フォーク");
});

test("parsePartialDelightQuestion parses dialogue_fork streaming fields", () => {
  const partial = parsePartialDelightQuestion(
    '{"speaker":"Sofia","line":"¿Cómo estás hoy?","options":["Muy bien, gracias.","Azul","Mañana","Ayer"],"reaction":"¡Me alegro!"',
  );
  assert.ok(partial);
  assert.equal(partial.speaker, "Sofia");
  assert.equal(partial.line, "¿Cómo estás hoy?");
  assert.deepEqual(partial.options, [
    "Muy bien, gracias.",
    "Azul",
    "Mañana",
    "Ayer",
  ]);
  assert.equal(partial.reaction, "¡Me alegro!");
});

test("normalizes and grades dialogue_fork responses correctly", () => {
  const raw = JSON.stringify({
    instruction: "Choose the natural response to continue the conversation.",
    speaker: "Elena",
    line: "Buenos días, ¿cómo estás?",
    options: [
      "Muy bien, ¿y tú?",
      "Buenas noches.",
      "Tengo hambre.",
      "Hasta luego.",
    ],
    answerIndex: 0,
    reaction: "¡Qué bueno!",
  });

  const normalized = normalizeDelightQuestion("dialogue_fork", raw);
  assert.ok(normalized);
  assert.equal(normalized.speaker, "Elena");
  assert.equal(normalized.answerIndex, 0);

  // Ready when selectedIndex is set
  assert.equal(isDelightResponseReady(normalized, { selectedIndex: null }), false);
  assert.equal(isDelightResponseReady(normalized, { selectedIndex: 0 }), true);

  // Grade check
  assert.equal(gradeDelightResponse(normalized, { selectedIndex: 0 }), true);
  assert.equal(gradeDelightResponse(normalized, { selectedIndex: 1 }), false);
});

