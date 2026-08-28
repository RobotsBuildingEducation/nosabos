import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIGHT_VARIANT_IDS,
  buildDelightQuestionPrompt,
  buildDelightResponseJudgePrompt,
  buildSentenceDetectiveJudgePrompt,
  buildSentenceDetectivePrompt,
  buildSentenceShapeshifterJudgePrompt,
  buildThreeClueMysteryJudgePrompt,
  calculateDelightQuestionXp,
  generateSentenceDetectiveQuestion,
  generateWithProviderFallback,
  getDelightFallbackQuestion,
  gradeDelightResponse,
  isDelightQuestionLanguageConsistent,
  isDelightResponseReady,
  isSingleDelightCueWord,
  normalizeDelightQuestion,
  parseDelightJudgeVerdict,
  parseDelightQuestion,
  parsePartialDelightQuestion,
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

test("new variants render from their minimal content contracts", () => {
  const minimalDrafts = {
    dialogue_fork: {
      line: "Hola, ¿cómo estás?",
      options: ["Muy bien.", "Hasta mañana."],
      answerIndex: 0,
    },
    sentence_shapeshifter: {
      source: "Ella camina.",
      constraint: "Make it plural",
      answer: "Ellas caminan.",
    },
    word_neighborhoods: {
      groups: [
        { label: "Greetings", items: ["hola", "buenos días"] },
        { label: "Farewells", items: ["adiós", "hasta luego"] },
      ],
    },
    morphology_forge: {
      sentence: "Ella habla ___.",
      pieces: ["rápida", "mente", "lenta", "ción"],
      answerPieces: ["rápida", "mente"],
    },
    three_clue_mystery: {
      clues: ["A greeting", "Used in the daytime", "Starts with h"],
      answer: "hola",
    },
    listen_difference: {
      audioText: "buenos días",
      options: ["buenos días", "buenas noches"],
      answerIndex: 0,
    },
    three_word_challenge: {
      cues: ["hola", "amigo", "hoy"],
      sampleAnswers: ["Hola, amigo. ¿Cómo estás hoy?"],
    },
    natural_or_weird: {
      sentence: "Buenos días.",
      isNatural: true,
    },
  };

  for (const [variant, draft] of Object.entries(minimalDrafts)) {
    const normalized = normalizeDelightQuestion(variant, draft);
    assert.ok(normalized, `${variant} should accept its minimal draft`);
    assert.equal(normalized.instruction, "");
    assert.equal(normalized.hint, "");
    assert.equal(normalized.explanation, "");
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

test("Sentence Detective derives redundant UI fields from its minimal contract", () => {
  const valid = normalizeDelightQuestion(
    "sentence_detective",
    {
      tokens: ["Ayer", "ella", "fuimos", "al", "mercado."],
      incorrectIndex: 2,
      replacements: ["fue", "fui", "fueron", "fuimos"],
      answer: "fue",
    },
    { targetLang: "es" },
  );
  assert.equal(valid?.sentence, "Ayer ella fuimos al mercado.");
  assert.equal(valid?.correctedSentence, "Ayer ella fue al mercado.");
  assert.equal(valid?.wrongToken, "fuimos");
  assert.equal(valid?.joiner, " ");

  const contradictoryExtras = normalizeDelightQuestion(
    "sentence_detective",
    validDetective({
      sentence: "ignored",
      correctedSentence: "also ignored",
      wrongToken: "ignored",
    }),
  );
  assert.equal(contradictoryExtras?.sentence, "Ayer ella fuimos al mercado.");
  assert.equal(
    contradictoryExtras?.correctedSentence,
    "Ayer ella fue al mercado.",
  );

  const correctedDraft = normalizeDelightQuestion(
    "sentence_detective",
    {
      tokens: ["Ayer", "ella", "fue"],
      incorrectIndex: 2,
      replacements: ["fue", "fui"],
      answer: "fue",
    },
  );
  assert.equal(correctedDraft?.sentence, "Ayer ella fui");
  assert.equal(correctedDraft?.correctedSentence, "Ayer ella fue");
});

test("Sentence Detective prompt distinguishes vocabulary from grammar", () => {
  const prompt = buildSentenceDetectivePrompt({
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { words: ["llave"], topic: "objects at home" },
  });
  assert.match(prompt, /explicit local meaning cue/i);
  assert.match(prompt, /tokens is the complete broken sentence/i);
  assert.match(prompt, /llave/);
  assert.match(
    prompt,
    /"tokens":\["\.\.\."\],"incorrectIndex":0,"replacements"/i,
  );
  assert.match(prompt, /application derives those locally/i);
  assert.doesNotMatch(prompt, /"correctedSentence"/i);
});

test("delight prompts carry authoritative lesson context and recent-question variety", () => {
  const prompt = buildDelightQuestionPrompt({
    variant: "three_word_challenge",
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: {
      topic: "things around the home",
      words: ["llave", "mesa"],
      focusPoints: ["household objects in context"],
      curriculumContext: {
        lessonId: "a1-household-objects",
        agendaItems: [
          {
            id: "household-keys",
            modes: ["vocabulary"],
            targetConcept: "puerta",
            targetRole: "form",
            targetForms: ["puerta"],
            targetExamples: ["Abro la puerta."],
          },
        ],
      },
    },
    recentQuestions: ["three_word_challenge: llave / puerta / casa"],
  });

  assert.match(prompt, /CURRICULUM OBJECTIVES \(authoritative\)/);
  assert.match(prompt, /exact lesson vocabulary list/i);
  assert.match(prompt, /llave/);
  assert.match(prompt, /\["llave","mesa","puerta"\]/);
  assert.match(prompt, /Reuse its three required words/i);
  assert.match(prompt, /references rather than exhaustive answer keys/i);
  assert.match(prompt, /THREE-WORD CUE INVENTORY \(REQUIRED\)/);
  assert.match(prompt, /exactly 3 distinct entries verbatim/i);
  assert.match(prompt, /Never replace an entry with its definition/i);
});

test("Three-Word Challenge requires three distinct words rather than phrases", () => {
  const base = {
    instruction: "Use all three words.",
    cues: ["amiga", "amigo", "familia"],
    sampleAnswers: ["Mi amiga y mi amigo conocen a mi familia."],
    reaction: "Nice sentence!",
    hint: "Connect the people in one sentence.",
    explanation: "The sentence uses all three cues.",
  };

  assert.ok(normalizeDelightQuestion("three_word_challenge", base));
  assert.equal(
    normalizeDelightQuestion("three_word_challenge", {
      ...base,
      cues: [
        "una persona muy cercana a ti, mujer",
        "una persona muy cercana a ti, hombre",
        "grupo de personas que comparten parentesco",
      ],
    }),
    null,
  );
  assert.equal(
    normalizeDelightQuestion("three_word_challenge", {
      ...base,
      cues: ["amiga", "amiga", "familia"],
    }),
    null,
  );
  assert.deepEqual(
    normalizeDelightQuestion("three_word_challenge", {
      ...base,
      cues: ["amiga", "amigo", "familia", "vecina"],
    })?.cues,
    ["amiga", "amigo", "familia"],
  );
  assert.equal(isSingleDelightCueWord("amiga"), true);
  assert.equal(isSingleDelightCueWord("arc-en-ciel"), true);
  assert.equal(isSingleDelightCueWord("close friend"), false);
});

test("normalization repairs harmless provider relationship mistakes", () => {
  const dialogue = normalizeDelightQuestion("dialogue_fork", {
    line: "¿Cómo estás?",
    options: ["Bien.", "Bien.", "No sé.", "Hasta luego."],
    answerIndex: 1,
  });
  assert.deepEqual(dialogue?.options, ["Bien.", "No sé.", "Hasta luego."]);
  assert.equal(dialogue?.answerIndex, 0);

  const listening = normalizeDelightQuestion("listen_difference", {
    audioText: "provider mismatch",
    options: ["buenos días", "buenas noches"],
    answerIndex: 1,
  });
  assert.equal(listening?.audioText, "buenas noches");
  assert.equal(listening?.answerIndex, 1);

  const forge = normalizeDelightQuestion("morphology_forge", {
    sentence: "Ella ___ una carta.",
    pieces: ["escrib", "aron", "ía", "escrib"],
    answerPieces: ["escrib", "ió"],
  });
  assert.ok(forge?.pieces.includes("ió"));
  assert.equal(forge?.answerWord, "escribió");

  const repeatedForge = normalizeDelightQuestion("morphology_forge", {
    sentence: "They ___ the word for emphasis.",
    pieces: ["re", "say", "un", "re"],
    answerPieces: ["re", "re", "say"],
  });
  assert.deepEqual(repeatedForge?.answerPieces, ["re", "re", "say"]);
  assert.equal(
    repeatedForge?.pieces.filter((piece) => piece === "re").length,
    2,
  );
  assert.equal(repeatedForge?.answerWord, "reresay");
  assert.equal(
    isDelightQuestionLanguageConsistent(repeatedForge, {
      targetLang: "en",
      supportLang: "es",
    }),
    true,
  );
});

test("Sentence Detective repairs a provider draft containing the corrected token", () => {
  const question = normalizeDelightQuestion(
    "sentence_detective",
    {
      tokens: ["私", "の", "家族", "は", "大きい", "です。"],
      incorrectIndex: 4,
      replacements: ["犬", "大きい", "小さい", "楽しい"],
      answer: "大きい",
    },
    { targetLang: "ja" },
  );

  assert.ok(question);
  assert.equal(question.tokens[4], "犬");
  assert.equal(question.wrongToken, "犬");
  assert.equal(question.answer, "大きい");
  assert.equal(question.correctedSentence, "私の家族は大きいです。");
});

test("provider fallback runs after a failed or rejected primary draft", async () => {
  const calls = [];
  const question = await generateWithProviderFallback({
    primary: async () => {
      calls.push("gemini");
      throw new Error("schema rejected");
    },
    providerFallback: async () => {
      calls.push("openai");
      return { variant: "dialogue_fork" };
    },
    onProviderFallback: (error) => calls.push(error.message),
  });

  assert.deepEqual(calls, ["gemini", "schema rejected", "openai"]);
  assert.equal(question.variant, "dialogue_fork");
});

test("provider fallback errors surface without substituting local content", async () => {
  await assert.rejects(
    generateWithProviderFallback({
      primary: async () => {
        throw new Error("Gemini failed");
      },
      providerFallback: async () => {
        throw new Error("OpenAI failed");
      },
    }),
    /OpenAI failed/,
  );
});

test("tutorial delight prompts replace Spanish source focus with target-language starter phrases", () => {
  const lessonContent = {
    topic: "tutorial",
    focusPoints: ["hola + me llamo", "buenos días / buenas noches"],
  };
  const dialoguePrompt = buildDelightQuestionPrompt({
    variant: "dialogue_fork",
    moduleType: "vocabulary",
    targetLang: "de",
    supportLang: "en",
    lessonContent,
  });
  const detectivePrompt = buildSentenceDetectivePrompt({
    moduleType: "vocabulary",
    targetLang: "de",
    supportLang: "en",
    lessonContent,
  });

  assert.match(dialoguePrompt, /hallo/i);
  assert.match(dialoguePrompt, /guten Morgen/i);
  assert.doesNotMatch(dialoguePrompt, /hola \+ me llamo/i);
  assert.match(detectivePrompt, /SENTENCE DETECTIVE TARGET WORDS \(REQUIRED\)/);
  assert.match(detectivePrompt, /auf Wiedersehen/i);
  assert.doesNotMatch(detectivePrompt, /buenos días \/ buenas noches/i);
});

test("Sentence Detective prompt asks only for target-language content fields", () => {
  const prompt = buildSentenceDetectivePrompt({
    moduleType: "grammar",
    targetLang: "ja",
    supportLang: "ar",
  });

  assert.match(prompt, /Write every token, replacement, and answer in Japanese/i);
  assert.doesNotMatch(prompt, /Egyptian Arabic/i);
  assert.doesNotMatch(prompt, /instruction|hint|explanation/i);
});

test("Japanese variants reject copied English curriculum directives", () => {
  const leaked = normalizeDelightQuestion("sentence_shapeshifter", {
    source: "Choose exactly one objective for testing: 家族",
    constraint:
      "Cambia el sujeto a ‘mi familia’ y usa は para marcar el tema.",
    answer: "私の家族は東京に住んでいます。",
  });
  const valid = normalizeDelightQuestion("sentence_shapeshifter", {
    source: "私は東京に住んでいます。",
    constraint:
      "Cambia el sujeto a ‘mi familia’ y usa は para marcar el tema.",
    answer: "私の家族は東京に住んでいます。",
  });

  assert.equal(
    isDelightQuestionLanguageConsistent(leaked, {
      targetLang: "ja",
      supportLang: "es",
    }),
    false,
  );
  assert.equal(
    isDelightQuestionLanguageConsistent(valid, {
      targetLang: "ja",
      supportLang: "es",
    }),
    true,
  );
});

test("non-English support languages reject obvious English constraints", () => {
  const question = normalizeDelightQuestion("sentence_shapeshifter", {
    source: "私は東京に住んでいます。",
    constraint: "Make it about your family.",
    answer: "私の家族は東京に住んでいます。",
  });

  assert.equal(
    isDelightQuestionLanguageConsistent(question, {
      targetLang: "ja",
      supportLang: "es",
    }),
    false,
  );
});

test("Three-Clue Mystery keeps a valid Japanese draft after removing optional romanization", () => {
  const question = normalizeDelightQuestion(
    "three_clue_mystery",
    {
      clues: [
        "Son personas importantes en tu vida.",
        "Pueden vivir juntas en una casa.",
        "Incluye a padres, madres e hijos.",
      ],
      answer: "家族 (kazoku)",
      acceptableAnswers: ["kazoku", "家族 / kazoku"],
      example: "私は家族が大好きです。(I love my family.)",
    },
    { targetLang: "ja" },
  );

  assert.equal(question?.answer, "家族");
  assert.deepEqual(question?.acceptableAnswers, []);
  assert.equal(question?.example, "私は家族が大好きです。");
  assert.equal(
    isDelightQuestionLanguageConsistent(question, {
      targetLang: "ja",
      supportLang: "es",
    }),
    true,
  );
});

test("Three-Clue Mystery still rejects copied English clues", () => {
  const question = normalizeDelightQuestion(
    "three_clue_mystery",
    {
      clues: [
        "Choose exactly one objective for testing.",
        "Pueden vivir juntas en una casa.",
        "Incluye a padres, madres e hijos.",
      ],
      answer: "家族",
    },
    { targetLang: "ja" },
  );

  assert.equal(
    isDelightQuestionLanguageConsistent(question, {
      targetLang: "ja",
      supportLang: "es",
    }),
    false,
  );
});

test("script-aware cleanup also covers Chinese, Arabic, and Hindi targets", () => {
  const cases = [
    ["zh", "家人 (jiārén)", "家人"],
    ["ar", "عائلة (family)", "عائلة"],
    ["hi", "परिवार (parivaar)", "परिवार"],
  ];

  cases.forEach(([targetLang, rawAnswer, expectedAnswer]) => {
    const question = normalizeDelightQuestion(
      "three_clue_mystery",
      {
        clues: ["Primera pista", "Segunda pista", "Tercera pista"],
        answer: rawAnswer,
      },
      { targetLang },
    );
    assert.equal(question?.answer, expectedAnswer);
    assert.equal(
      isDelightQuestionLanguageConsistent(question, {
        targetLang,
        supportLang: "es",
      }),
      true,
    );
  });
});

test("script-aware cleanup is shared by non-mystery variants", () => {
  const question = normalizeDelightQuestion(
    "dialogue_fork",
    {
      speaker: "Amiga",
      line: "你好 (nǐ hǎo)",
      options: [
        "你好 (hello)",
        "谢谢 (thanks)",
        "再见 (goodbye)",
        "对不起 (sorry)",
      ],
      answerIndex: 0,
      reaction: "很高兴见到你 (Nice to meet you)",
    },
    { targetLang: "zh" },
  );

  assert.equal(question?.line, "你好");
  assert.deepEqual(question?.options, ["你好", "谢谢", "再见", "对不起"]);
  assert.equal(question?.reaction, "很高兴见到你");
  assert.equal(
    isDelightQuestionLanguageConsistent(question, {
      targetLang: "zh",
      supportLang: "es",
    }),
    true,
  );
});

test("Sentence Detective receives exact target forms from its active objective", () => {
  const prompt = buildSentenceDetectivePrompt({
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: {
      words: ["amigo", "amiga"],
      curriculumContext: {
        lessonId: "lesson-pre-a1-1-3",
        agendaItems: [
          {
            id: "people-family",
            modes: ["vocabulary"],
            targetRole: "form",
            targetConcept: "familia",
            targetForms: ["familia"],
          },
        ],
      },
    },
  });

  assert.match(prompt, /SENTENCE DETECTIVE TARGET WORDS \(REQUIRED\)/);
  assert.match(prompt, /\["amigo","amiga","familia"\]/);
  assert.match(prompt, /Do not replace the lesson item with a definition/i);
});

test("Sentence Detective uses one generation call and local structural validation", async () => {
  const prompts = [];
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt) => {
      prompts.push(prompt);
      return {
        tokens: ["Ayer", "ella", "fuimos", "al", "mercado."],
        incorrectIndex: 2,
        replacements: ["fue", "fui", "fueron", "fuimos"],
        answer: "fue",
      };
    },
    moduleType: "grammar",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { focusPoints: ["preterite tense"] },
  });

  assert.equal(question.answer, "fue");
  assert.equal(question.correctedSentence, "Ayer ella fue al mercado.");
  assert.equal(prompts.length, 1);
  assert.doesNotMatch(prompts[0], /audit this sentence detective/i);
});

test("vocabulary generation accepts an ordinary noun token after its article", async () => {
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
  const question = await generateSentenceDetectiveQuestion({
    generate: async (prompt) => {
      prompts.push(prompt);
      return externalDeterminer;
    },
    moduleType: "vocabulary",
    targetLang: "es",
    supportLang: "en",
    lessonContent: { words: ["lápiz"] },
  });

  assert.equal(question.answer, "lápiz");
  assert.equal(prompts.length, 1);
});

test("parsePartialDelightQuestion extracts tokens and fields from streaming chunk buffers", () => {
  const partial1 = parsePartialDelightQuestion('{"instruction":"Find the error","tokens":["Hello,","good');
  assert.ok(partial1);
  assert.equal(partial1.instruction, "Find the error");
  assert.deepEqual(partial1.tokens, ["Hello,"]);

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
  const streamCues = parsePartialDelightQuestion('{"cues":["sol","playa","verano');
  assert.deepEqual(streamCues?.cues, ["sol", "playa"]);

  const completedStreamCues = parsePartialDelightQuestion(
    '{"cues":["sol","playa","verano"',
  );
  assert.deepEqual(completedStreamCues?.cues, ["sol", "playa", "verano"]);

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
