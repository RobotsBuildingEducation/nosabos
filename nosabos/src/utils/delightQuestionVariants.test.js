import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIGHT_VARIANT_IDS,
  buildDelightQuestionPrompt,
  buildDelightQuestionRepairPrompt,
  buildDelightResponseJudgePrompt,
  buildSentenceDetectiveJudgePrompt,
  buildSentenceDetectivePrompt,
  buildSentenceShapeshifterJudgePrompt,
  buildThreeClueMysteryJudgePrompt,
  calculateDelightQuestionXp,
  generateSentenceDetectiveQuestion,
  getDelightFallbackQuestion,
  gradeDelightResponse,
  isDelightQuestionLessonGrounded,
  isDelightResponseReady,
  normalizeDelightQuestion,
  parseDelightJudgeVerdict,
  parseDelightQuestion,
  parsePartialDelightQuestion,
  parseSentenceDetectiveValidation,
  sentenceDetectiveAuditPasses,
} from "./delightQuestionVariants.js";
import { getDialogueForkCopy } from "./dialogueForkI18n.js";

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

function buildReferenceResponse(question) {
  switch (question.variant) {
    case "sentence_detective":
      return {
        tokenIndex: question.incorrectIndex,
        replacement: question.answer,
      };
    case "dialogue_fork":
    case "listen_difference":
      return { selectedIndex: question.answerIndex };
    case "sentence_shapeshifter":
    case "three_clue_mystery":
      return { text: question.answer };
    case "three_word_challenge":
      return { text: question.sampleAnswers[0] };
    case "word_neighborhoods": {
      const assignments = {};
      question.groups.forEach((group, groupIndex) => {
        group.items.forEach((item) => {
          assignments[item] = groupIndex;
        });
      });
      return { assignments };
    }
    case "morphology_forge":
      return {
        pieceIndices: question.answerPieces.map((piece) =>
          question.pieces.indexOf(piece),
        ),
      };
    case "natural_or_weird":
      return { choice: question.isNatural };
    default:
      return {};
  }
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

test("every completed variant delegates grading to semantic judgment", () => {
  for (const variant of DELIGHT_VARIANT_IDS) {
    const question = getDelightFallbackQuestion(variant, "grammar");
    const response = buildReferenceResponse(question);
    assert.equal(
      isDelightResponseReady(question, response),
      true,
      `${variant} reference response should be ready`,
    );
    assert.equal(
      gradeDelightResponse(question, response),
      null,
      `${variant} should delegate instead of grading deterministically`,
    );
  }
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

test("open-response judge prompts treat reference answers as non-exhaustive", () => {
  const shapeshifter = getDelightFallbackQuestion(
    "sentence_shapeshifter",
    "grammar",
  );
  const shapeshifterPrompt = buildSentenceShapeshifterJudgePrompt({
    question: shapeshifter,
    response: { text: "Otra transformación válida." },
    targetLang: "es",
    supportLang: "en",
    cefrLevel: "A1",
  });
  assert.ok(shapeshifterPrompt.includes("not an exhaustive answer key"));
  assert.ok(shapeshifterPrompt.includes("required transformation"));

  const mystery = getDelightFallbackQuestion(
    "three_clue_mystery",
    "vocabulary",
  );
  const mysteryPrompt = buildThreeClueMysteryJudgePrompt({
    question: mystery,
    response: { text: `The mystery word is ${mystery.answer}` },
    targetLang: "es",
    supportLang: "en",
    cefrLevel: "A1",
  });
  assert.ok(mysteryPrompt.includes("natural spoken wrappers"));
  assert.ok(mysteryPrompt.includes("Judge the meaning"));
  assert.ok(mysteryPrompt.includes(`The mystery word is ${mystery.answer}`));
});

test("Morphology Forge judges the forged word inside the completed sentence", () => {
  const question = {
    variant: "morphology_forge",
    sentence: "My ___ is playing with me.",
    pieces: ["broth", "er", "sist", "fam", "ily"],
    answerPieces: ["fam", "ily"],
    answerWord: "family",
  };
  const prompt = buildDelightResponseJudgePrompt({
    question,
    response: { pieceIndices: [0, 1] },
    targetLang: "en",
    supportLang: "en",
    cefrLevel: "A1",
    moduleType: "vocabulary",
  });
  assert.ok(prompt.includes('Learner\'s forged word: "brother"'));
  assert.ok(prompt.includes('Completed learner sentence: "My brother is playing with me."'));
  assert.ok(prompt.includes("reference word is not exclusive"));
});

test("every variant has a task-specific semantic judge prompt", () => {
  for (const variant of DELIGHT_VARIANT_IDS) {
    const question = getDelightFallbackQuestion(variant, "grammar");
    const prompt = buildDelightResponseJudgePrompt({
      question,
      response: buildReferenceResponse(question),
      targetLang: "es",
      supportLang: "en",
      cefrLevel: "A1",
      moduleType: "grammar",
    });
    assert.match(prompt, /YES or NO/);
    assert.doesNotMatch(prompt, /^Judge this Spanish learning response/);
  }
});

test("integrated delight rotation exposes all approved variants", () => {
  assert.deepEqual(DELIGHT_VARIANT_IDS, [
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

test("semantic judge accepts only explicit YES or NO verdicts", () => {
  assert.equal(parseDelightJudgeVerdict("YES — this is natural."), true);
  assert.equal(parseDelightJudgeVerdict("NO, the tense is wrong."), false);
  assert.equal(parseDelightJudgeVerdict("The answer may be acceptable."), null);
  assert.equal(parseDelightJudgeVerdict(""), null);
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

test("delight prompts carry authoritative lesson context and recent-question variety", () => {
  const prompt = buildDelightQuestionPrompt({
    variant: "three_word_challenge",
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: {
      topic: "things around the home",
      words: ["llave", "mesa", "puerta"],
      focusPoints: ["household objects in context"],
      curriculumContext: {
        lessonId: "a1-household-objects",
        agendaItems: [
          {
            id: "household-keys",
            modes: ["vocabulary"],
            targetConcept: "llave",
            targetExamples: ["Necesito la llave."],
          },
        ],
      },
    },
    recentQuestions: ["three_word_challenge: llave / puerta / casa"],
  });

  assert.match(prompt, /CURRICULUM OBJECTIVES \(authoritative\)/);
  assert.match(prompt, /exact lesson vocabulary list/i);
  assert.match(prompt, /llave/);
  assert.match(prompt, /Do not repeat or closely paraphrase/i);
  assert.match(prompt, /references rather than exhaustive answer keys/i);
});

test("invalid delight drafts get one schema-preserving lesson repair prompt", () => {
  const prompt = buildDelightQuestionRepairPrompt({
    variant: "dialogue_fork",
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    lessonContent: {
      topic: "subjunctive doubt and desire",
      focusPoints: ["use the present subjunctive after expressions of doubt"],
    },
    rejectedResponse: '{"line":"Dudo que viene."}',
    reason: "answerIndex was missing",
  });

  assert.match(prompt, /REPAIR TASK/);
  assert.match(prompt, /answerIndex was missing/);
  assert.match(prompt, /subjunctive doubt and desire/);
  assert.match(prompt, /Return only a complete JSON object/);
  assert.match(prompt, /"answerIndex":0/);
});

test("delight questions reject generated payloads outside the lesson curriculum", () => {
  const lessonContent = {
    curriculumContext: {
      agendaItems: [
        {
          modes: ["vocabulary"],
          targetConcept: "llave",
          targetExamples: ["Necesito la llave."],
        },
      ],
    },
  };

  assert.equal(
    isDelightQuestionLessonGrounded(
      { sentence: "Necesito la llave para abrir la puerta." },
      lessonContent,
      "vocabulary",
    ),
    true,
  );
  assert.equal(
    isDelightQuestionLessonGrounded(
      { sentence: "El perro corre por el parque." },
      lessonContent,
      "vocabulary",
    ),
    false,
  );
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

test("Sentence Detective uses one generation call and local structural validation", async () => {
  const prompts = [];
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt) => {
      prompts.push(prompt);
      return validDetective();
    },
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { focusPoints: ["preterite tense"] },
  });

  assert.equal(question.answer, "fue");
  assert.equal(prompts.length, 1);
  assert.doesNotMatch(prompts[0], /audit this sentence detective/i);
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

test("vocabulary generation rejects detached noun determiners without retrying", async () => {
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
  const prompts = [];
  await assert.rejects(
    generateSentenceDetectiveQuestion({
      generate: async (prompt) => {
        prompts.push(prompt);
        return externalDeterminer;
      },
      moduleType: "vocabulary",
      targetLang: "es",
      supportLang: "en",
      lessonContent: { words: ["lápiz"] },
    }),
    /structurally valid question/i,
  );

  assert.equal(prompts.length, 1);
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

  let callCount = 0;
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt, onStream) => {
      callCount += 1;
      if (callCount === 1) {
        onStream?.('{"instruction":"Find the error","tokens":["Ayer","ella"');
        return validJson;
      }
      throw new Error("Sentence Detective must not make a second call.");
    },
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    onStream: (chunk) => streamedChunks.push(chunk),
  });

  assert.ok(question);
  assert.equal(callCount, 1);
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

  // Every complete choice is evaluated semantically in context.
  assert.equal(gradeDelightResponse(normalized, { selectedIndex: 0 }), null);
  assert.equal(gradeDelightResponse(normalized, { selectedIndex: 1 }), null);
});

test("parsePartialDelightQuestion parses in-flight streaming fields across all variants", () => {
  // In-flight sentence & open string
  const streamShapeshifter = parsePartialDelightQuestion(
    '{"source":"Yo hablo español","constraint":"Hazlo en pasado"',
  );
  assert.equal(streamShapeshifter?.source, "Yo hablo español");
  assert.equal(streamShapeshifter?.constraint, "Hazlo en pasado");

  // In-flight groups
  const streamGroups = parsePartialDelightQuestion(
    '{"groups":[{"label":"Animales","items":["perro","gato"]},{"label":"Comida","items":["manzana"',
  );
  assert.equal(streamGroups?.groups?.length, 2);
  assert.equal(streamGroups.groups[0].label, "Animales");
  assert.deepEqual(streamGroups.groups[0].items, ["perro", "gato"]);
  assert.equal(streamGroups.groups[1].label, "Comida");
  assert.deepEqual(streamGroups.groups[1].items, ["manzana"]);

  // In-flight cues & clues
  const streamCues = parsePartialDelightQuestion('{"cues":["sol","playa","verano"');
  assert.deepEqual(streamCues?.cues, ["sol", "playa", "verano"]);

  const streamClues = parsePartialDelightQuestion(
    '{"clues":["Vive en el agua","Tiene escamas"',
  );
  assert.deepEqual(streamClues?.clues, ["Vive en el agua", "Tiene escamas"]);

  // In-flight pieces & natural or weird boolean
  const streamPieces = parsePartialDelightQuestion(
    '{"sentence":"Ella ___ una carta.","pieces":["escrib","ió","aron"]',
  );
  assert.equal(streamPieces?.sentence, "Ella ___ una carta.");
  assert.deepEqual(streamPieces?.pieces, ["escrib", "ió", "aron"]);

  const streamNatural = parsePartialDelightQuestion(
    '{"sentence":"Yo tengo mucho hambre.","isNatural":false',
  );
  assert.equal(streamNatural?.sentence, "Yo tengo mucho hambre.");
  assert.equal(streamNatural?.isNatural, false);
});

test("buildDelightQuestionPrompt strictly enforces practice and support language roles", () => {
  const prompt = buildDelightQuestionPrompt({
    variant: "sentence_shapeshifter",
    moduleType: "grammar",
    targetLang: "fr",
    supportLang: "en",
    cefrLevel: "A1",
    lessonContent: { topic: "past tense" },
  });

  assert.match(prompt, /learner studying French \(fr\)/i);
  assert.match(prompt, /support language is English \(en\)/i);
  assert.match(prompt, /PRACTICE TARGET LANGUAGE \(French\)/i);
  assert.match(prompt, /LEARNER SUPPORT LANGUAGE \(English\)/i);
  assert.match(prompt, /STRICT CONSTRAINT\/LABEL RULE.*English/i);
  assert.doesNotMatch(prompt, /Spanish/i);
});

test("getDelightFallbackQuestion generates valid normalized fallbacks across multiple languages", () => {
  const frenchTarget = getDelightFallbackQuestion(
    "sentence_shapeshifter",
    "grammar",
    "fr",
    "en",
  );
  assert.equal(frenchTarget.source, "Elle mange avec sa famille.");
  assert.equal(frenchTarget.constraint, "Make it happen yesterday.");
  assert.ok(normalizeDelightQuestion("sentence_shapeshifter", frenchTarget));

  const germanTarget = getDelightFallbackQuestion(
    "word_neighborhoods",
    "grammar",
    "de",
    "es",
  );
  assert.equal(germanTarget.groups[0].label, "Pasado");
  assert.deepEqual(germanTarget.groups[0].items, ["ging", "aß", "sprachen"]);
  assert.ok(normalizeDelightQuestion("word_neighborhoods", germanTarget));
});
