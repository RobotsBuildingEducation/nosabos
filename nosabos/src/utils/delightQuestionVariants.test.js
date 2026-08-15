import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIGHT_VARIANT_IDS,
  buildSentenceDetectivePrompt,
  generateSentenceDetectiveQuestion,
  getDelightFallbackQuestion,
  getInitialDelightResponse,
  gradeDelightResponse,
  normalizeDelightQuestion,
  parseDelightQuestion,
  parseSentenceDetectiveValidation,
  sentenceDetectiveAuditPasses,
} from "./delightQuestionVariants.js";
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
  const detective = getDelightFallbackQuestion(
    "sentence_detective",
    "grammar",
  );
  assert.equal(
    gradeDelightResponse(detective, { tokenIndex: 2, replacement: "fue" }),
    true,
  );

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

test("three-word challenge delegates grading to the language judge", () => {
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

test("testing gate exposes Sentence Detective only", () => {
  assert.deepEqual(DELIGHT_VARIANT_TEST_IDS, ["sentence_detective"]);
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
  assert.match(prompt, /llave/);
  assert.doesNotMatch(prompt, /genuinely ungrammatical in the target language/i);
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
    }),
  );
  const validation = {
    valid: true,
    issues: [],
    grammarFits: [true, true, true, true],
    meaningFits: [true, false, false, false],
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
  });
  const outputs = [
    externalDeterminer,
    repaired,
    {
      valid: true,
      issues: [],
      grammarFits: [true, true, true, true],
      meaningFits: [true, false, false, false],
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
