import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAuthoredTargetCurriculum,
  buildLessonCurriculumAudit,
  buildLessonAgenda,
  buildUnitQuizBlueprint,
  getLessonQuizSettings,
  buildUnitCurriculumSnapshot,
  getCurriculumIntegrityIssues,
  getAgendaGoal,
  getAgendaTargetForms,
  getAgendaTargetRole,
  getLessonAgenda,
  getLocalizedAgendaLabel,
  isCurriculumPayloadGrounded,
  isInvalidLessonObjective,
  withCanonicalLessonAgenda,
} from "./lessonCurriculum.js";
import { getMultiLevelLearningPath } from "../data/skillTreeData.js";
import {
  getManualA1AgendaItems,
  MANUAL_A1_AGENDAS,
} from "../data/manualA1Agendas.js";
import {
  B1_B2_FOUNDATION_FORMS,
  getManualB1B2AgendaItems,
  getManualB1B2FoundationFormItems,
  MANUAL_B1_B2_AGENDAS,
} from "../data/manualB1B2Agendas.js";
import {
  C1_C2_FOUNDATION_FORMS,
  getManualC1C2AgendaItems,
  getManualC1C2FoundationFormItems,
  MANUAL_C1_C2_AGENDAS,
} from "../data/manualC1C2Agendas.js";
import {
  getManualPreA1AgendaItems,
  MANUAL_PRE_A1_AGENDAS,
} from "../data/manualPreA1Agendas.js";

const SUPPORT_LANGUAGES = [
  "en",
  "es",
  "pt",
  "it",
  "fr",
  "de",
  "ja",
  "hi",
  "ar",
  "zh",
];

test("placeholder teaching formats are not curriculum objectives", () => {
  [
    "form",
    "use",
    "pattern recycling",
    "micro-drills",
    "general vocabulary and grammar",
    "comprehensive review",
  ].forEach((value) => assert.equal(isInvalidLessonObjective(value), true));
  assert.equal(
    isInvalidLessonObjective("choose tú or vos based on region"),
    false,
  );
});

test("quiz payload grounding rejects unrelated grammar families", () => {
  const curriculumContext = {
    agendaItems: [
      {
        modes: ["grammar"],
        targetConcept: "llevar / ponerse (reflexive)",
      },
      {
        modes: ["grammar"],
        targetConcept: "agreement and plural of clothes",
      },
      {
        modes: ["grammar"],
        targetConcept: "colors + clothing (camisa azul)",
      },
    ],
  };

  assert.equal(
    isCurriculumPayloadGrounded(
      {
        left: ["La casa", "El libro", "Un profesor", "La ciudad"],
        right: ["Las casas", "Los libros", "Unos profesores", "Las ciudades"],
      },
      curriculumContext,
      { mode: "grammar" },
    ),
    false,
  );
  assert.equal(
    isCurriculumPayloadGrounded(
      {
        left: ["La camisa", "El pantalón", "El vestido"],
        right: ["Las camisas", "Los pantalones", "Los vestidos"],
      },
      curriculumContext,
      { mode: "grammar" },
    ),
    true,
  );
});

test("agenda derivation ignores placeholders and uses concrete mode prompts", () => {
  const lesson = {
    id: "lesson-example",
    title: { en: "Regional Register", es: "Registro regional" },
    description: {
      en: "Adapt language to the listener",
      es: "Adapta el lenguaje al interlocutor",
    },
    modes: ["grammar", "realtime"],
    content: {
      grammar: {
        topic: "regional pronouns",
        focusPoints: ["form", "use"],
        prompt: "Choose a second-person form appropriate to the region",
      },
      realtime: {
        prompt: "Adapt pronouns and formality to the listener",
      },
    },
  };

  const agenda = buildLessonAgenda(lesson).items;
  assert.deepEqual(
    agenda.map((item) => item.targetConcept),
    [
      "Choose a second-person form appropriate to the region",
      "Adapt pronouns and formality to the listener",
    ],
  );
  assert.equal(agenda.some((item) => item.targetConcept === "form"), false);
  assert.equal(agenda.some((item) => item.targetConcept === "use"), false);
  assert.deepEqual(
    agenda.map((item) => getAgendaTargetRole(item)),
    ["goal", "goal"],
  );
  agenda.forEach((item) => assert.deepEqual(getAgendaTargetForms(item), []));
});

test("legacy activity instructions are capability goals, never exact target forms", () => {
  const lesson = {
    id: "lesson-reading-safety",
    modes: ["reading", "realtime"],
    content: {
      reading: {
        prompt: "Read a short description of people in a neighborhood",
      },
      realtime: {
        successCriteria: "The learner describes one person.",
      },
    },
  };

  const agenda = getLessonAgenda(withCanonicalLessonAgenda(lesson));
  assert.deepEqual(
    agenda.map((item) => getAgendaGoal(item)),
    [
      "Read a short description of people in a neighborhood",
      "The learner describes one person.",
    ],
  );
  assert.equal(agenda.every((item) => getAgendaTargetRole(item) === "goal"), true);
  assert.equal(agenda.every((item) => getAgendaTargetForms(item).length === 0), true);
});

test("non-Spanish practice paths do not expose Spanish-authored agenda examples", () => {
  const lesson = {
    id: "lesson-present-perfect",
    title: {
      en: "Recent Experiences",
      es: "Experiencias Recientes",
      de: "Neuere Erfahrungen",
    },
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        prompt:
          "Practice the present perfect with 'ya', 'todavía no', and 'esta semana'",
      },
      stories: {
        prompt: "Read about someone's experiences ('he viajado a...')",
      },
    },
  };

  const agenda = getLessonAgenda(lesson, { targetLang: "de" });
  assert.equal(agenda.length, 2);
  assert.deepEqual(
    agenda.map((item) => item.id),
    [
      "target-de-lesson-present-perfect-realtime",
      "target-de-lesson-present-perfect-stories",
    ],
  );
  agenda.forEach((item) => {
    assert.doesNotMatch(
      `${item.label.en} ${item.targetConcept}`,
      /\b(?:ya|todavía|esta semana|he viajado)\b/i,
    );
    assert.match(item.label.en, /Recent Experiences/);
    assert.deepEqual(item.targetExamples, []);
  });
});

test("authored non-Spanish practice paths retain mode-specific semantic detail", () => {
  const unit = getMultiLevelLearningPath("de", ["B2"]).find(
    (candidate) => candidate.id === "unit-b2-2",
  );
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-b2-2-2",
  );
  const targetLanguages = [
    "en",
    "pt",
    "fr",
    "it",
    "nl",
    "nah",
    "ja",
    "ru",
    "de",
    "el",
    "pl",
    "ga",
    "yua",
  ];

  targetLanguages.forEach((targetLang) => {
    const agenda = getLessonAgenda(lesson, { unit, targetLang });
    const hasGermanAuthoredCurriculum = targetLang === "de";
    assert.deepEqual(
      agenda.map((item) => item.label.en),
      hasGermanAuthoredCurriculum
        ? [
            "Use in conversation: Practice « wird gemacht » and « wurde von... hergestellt » to describe processes",
            "Understand in a story: Read a news report and notice passive constructions",
          ]
        : [
            "Use in conversation: Passive Voice — Describing how a product is made",
            "Understand in a story: Passive Voice — The passive voice in reports and news",
          ],
    );
    agenda.forEach((item) => {
      assert.doesNotMatch(item.targetConcept, /se hace|es fabricado por/i);
      assert.equal(item.targetExamples.length > 0, hasGermanAuthoredCurriculum);
      SUPPORT_LANGUAGES.forEach((supportLang) => {
        assert.ok(getLocalizedAgendaLabel(item, supportLang));
      });
    });
  });
});

test("unit snapshots contain only preceding core lesson objectives", () => {
  const coreLesson = {
    id: "lesson-a1-1",
    modes: ["vocabulary"],
    agenda: {
      version: 1,
      items: [
        {
          id: "greet-politely",
          kind: "vocabulary",
          modes: ["vocabulary"],
          label: { en: "Greet politely", es: "Saluda con cortesía" },
          targetConcept: "polite greetings",
          evidence: { type: "produce", criteria: "Produces a polite greeting" },
        },
      ],
    },
  };
  const skillBuilder = {
    id: "unit-a1-skill-builder",
    modes: ["grammar", "vocabulary"],
  };
  const futureLesson = {
    id: "lesson-a1-2",
    modes: ["grammar"],
    agenda: {
      version: 1,
      items: [
        {
          id: "future-objective",
          kind: "grammar",
          modes: ["grammar"],
          label: { en: "Future objective", es: "Objetivo futuro" },
          targetConcept: "future objective",
          evidence: { type: "produce", criteria: "Produces it" },
        },
      ],
    },
  };

  const snapshot = buildUnitCurriculumSnapshot(
    {
      id: "unit-a1",
      lessons: [coreLesson, skillBuilder, futureLesson],
    },
    { beforeLessonId: skillBuilder.id },
  );

  assert.deepEqual(snapshot.sourceLessonIds, [coreLesson.id]);
  assert.deepEqual(
    snapshot.agendaItems.map((item) => item.id),
    ["greet-politely"],
  );
});

test("C2 linguistic diversity preserves authored modes and concrete agenda", () => {
  const units = getMultiLevelLearningPath("es", ["C2"]);
  const unit = units.find((candidate) => candidate.id === "unit-c2-2");
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-c2-2-3",
  );

  assert.deepEqual(lesson.modes, ["reading", "realtime"]);
  const agenda = getLessonAgenda(lesson, { unit });
  assert.equal(agenda.length, 2);
  assert.match(agenda[0].targetConcept, /regional pronouns and vocabulary/i);
  assert.match(agenda[1].targetConcept, /region and formality/i);
  assert.equal(
    agenda.some((item) => ["form", "use"].includes(item.targetConcept)),
    false,
  );
  assert.doesNotMatch(agenda[0].label.es, /\bRead short texts\b/i);
  assert.doesNotMatch(agenda[0].label.ja, /\bRecognize\b/i);
  assert.doesNotMatch(agenda[1].label.ar, /\bUse in conversation\b/i);
});

test("unit review lessons reference the objectives taught by core lessons", () => {
  const units = getMultiLevelLearningPath("es", ["C2"]);
  const unit = units.find((candidate) => candidate.id === "unit-c2-2");
  const skillBuilder = unit.lessons.find((lesson) =>
    lesson.id.includes("skill-builder"),
  );
  const integratedPractice = unit.lessons.find((lesson) =>
    lesson.id.includes("integrated-practice"),
  );

  assert.deepEqual(skillBuilder.reviewSourceLessonIds, [
    "lesson-c2-2-1",
    "lesson-c2-2-2",
    "lesson-c2-2-3",
  ]);
  assert.deepEqual(
    integratedPractice.reviewSourceLessonIds,
    skillBuilder.reviewSourceLessonIds,
  );
  assert.ok(getLessonAgenda(skillBuilder, { unit }).length >= 6);
  assert.ok(getLessonAgenda(integratedPractice, { unit }).length >= 6);
});

test("quiz blueprints distribute questions across the lessons taught in a unit", () => {
  const units = getMultiLevelLearningPath("es", ["C2"]);
  const unit = units.find((candidate) => candidate.id === "unit-c2-2");
  const quiz = unit.lessons.find((lesson) => lesson.isFinalQuiz);
  const blueprint = buildUnitQuizBlueprint(unit, {
    beforeLessonId: quiz.id,
    questionCount: 9,
  });

  assert.equal(blueprint.questionTargets.length, 9);
  assert.deepEqual(blueprint.sourceLessonIds, [
    "lesson-c2-2-1",
    "lesson-c2-2-2",
    "lesson-c2-2-3",
  ]);
  assert.equal(
    blueprint.questionTargets.every(
      (target) =>
        target.agendaItemId &&
        target.sourceLessonId &&
        target.targetConcept &&
        target.evidence?.criteria,
    ),
    true,
  );
  assert.equal(
    blueprint.questionTargets.every(
      (target) => target.goal && Array.isArray(target.targetExamples),
    ),
    true,
  );
});

test("quiz settings scale the pass mark when a unit has fewer available objectives", () => {
  assert.deepEqual(getLessonQuizSettings({ isFinalQuiz: true }, 9), {
    questionCount: 9,
    passingScore: 8,
  });
  assert.deepEqual(
    getLessonQuizSettings(
      {
        isFinalQuiz: true,
        quizConfig: { questionsRequired: 10, passingScore: 8 },
      },
      5,
    ),
    { questionCount: 5, passingScore: 4 },
  );
});

test("support-language labels show concrete vocabulary and grammar objectives", () => {
  const units = getMultiLevelLearningPath("es", ["Pre-A1", "A1"]);
  const unit = units.find((candidate) => candidate.id === "unit-a1-5");
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-a1-5-1",
  );
  const agenda = getLessonAgenda(lesson, { unit });

  // Every UI language sees the actual objective, not the generic lesson
  // description repeated per item.
  assert.match(getLocalizedAgendaLabel(agenda[0], "es"), /lunes, martes/);
  assert.match(getLocalizedAgendaLabel(agenda[0], "de"), /lunes, martes/);
  ["es", "de", "ja"].forEach((lang) => {
    const labels = agenda.map((item) => getLocalizedAgendaLabel(item, lang));
    assert.equal(new Set(labels).size, labels.length);
  });
});

test("authored target-language curriculum keeps the per-objective sequence", () => {
  const lesson = withCanonicalLessonAgenda({
    id: "lesson-authored",
    title: { en: "Days", es: "Días" },
    description: {
      en: "Learn key vocabulary for days",
      es: "Aprende vocabulario clave para los días",
    },
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "days",
        focusPoints: ["lunes, martes", "hoy, mañana"],
      },
      grammar: { topic: "days grammar", focusPoints: ["el lunes vs los lunes"] },
    },
  });
  const unit = { id: "unit-authored", lessons: [lesson] };
  applyAuthoredTargetCurriculum({ A1: [unit] }, "it", {
    "lesson-authored": {
      [lesson.agenda.items[0].id]: {
        concept: "lunedì, martedì",
        examples: ["Oggi è lunedì."],
      },
      [lesson.agenda.items[1].id]: { concept: "oggi, domani", examples: [] },
    },
  });

  const agenda = getLessonAgenda(unit.lessons[0], { unit, targetLang: "it" });
  assert.equal(agenda.length, 3);
  assert.equal(agenda[0].source, "target-language-authored");
  assert.equal(agenda[0].id, `target-it-${lesson.agenda.items[0].id}`);
  assert.equal(agenda[0].targetConcept, "lunedì, martedì");
  assert.deepEqual(agenda[0].targetExamples, ["Oggi è lunedì."]);
  // The Spanish-authored base concept survives adaptation as a gloss for
  // Spanish-support learners of any target language.
  assert.equal(agenda[0].sourceConcept, "lunes, martes");
  // Short-chunk concepts stay the learner-facing objective in every support
  // language; the example sentence is context, not the drill target (it was
  // being promoted into the label, which made Pre-A1 tutors drill full
  // conjugated sentences).
  assert.equal(agenda[0].label.de, "Im Kontext verwenden: lunedì, martedì");
  assert.equal(agenda[1].targetConcept, "oggi, domani");
  // The unauthored grammar objective still collapses to the generic adapter.
  assert.equal(agenda[2].source, "target-language-adapter");
  assert.equal(agenda[2].id, "target-it-lesson-authored-grammar");
  assert.equal(agenda[2].targetExamples.length, 0);
});

test("non-English support labels do not expose English curriculum scaffolding", () => {
  const units = getMultiLevelLearningPath("de", ["B2"]);
  const unit = units.find((candidate) => candidate.id === "unit-b2-1");
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-b2-1-2",
  );
  const agenda = getLessonAgenda(lesson, { unit, targetLang: "de" });

  assert.deepEqual(
    agenda.map((item) => getLocalizedAgendaLabel(item, "it")),
    [
      "Usa in una conversazione: Als ich ankam, hatte der Film schon begonnen.",
      "Comprendi in una storia: Maya war ruhig, weil sie sich gut vorbereitet hatte.",
    ],
  );
  agenda.forEach((item) => {
    assert.doesNotMatch(
      getLocalizedAgendaLabel(item, "it"),
      /\b(?:practice|read|demonstrate|notice|reported speech)\b/i,
    );
  });
  assert.match(
    getLocalizedAgendaLabel(agenda[0], "en"),
    /Practice .* to order past events/,
  );
});

test("Italian A1 lessons run on authored curriculum without Spanish leakage", () => {
  const units = getMultiLevelLearningPath("it", ["A1"]);
  const spanishTokens =
    /\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|cumpleaños|hermano|hermana|gustan|zumo|camarero|propina|llueve|nublado)\b/i;
  let checkedItems = 0;

  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      if (lesson.isFinalQuiz) return; // quizzes draw targets from the blueprint
      const agenda = getLessonAgenda(lesson, { unit, targetLang: "it" });
      agenda.forEach((item) => {
        checkedItems += 1;
        assert.equal(
          item.source,
          "target-language-authored",
          `${lesson.id} → ${item.id} fell back to the generic adapter`,
        );
        assert.doesNotMatch(item.targetConcept, spanishTokens);
        item.targetExamples.forEach((example) =>
          assert.doesNotMatch(example, spanishTokens),
        );
      });
    });
  });
  assert.ok(checkedItems >= 140, `only ${checkedItems} items checked`);

  const quizBlueprint = buildUnitQuizBlueprint(
    units.find((unit) => unit.id === "unit-a1-5"),
    { beforeLessonId: "lesson-a1-5-quiz", questionCount: 10, targetLang: "it" },
  );
  quizBlueprint.questionTargets.forEach((target) => {
    assert.doesNotMatch(target.targetConcept, spanishTokens);
  });
});

test("People Around Me uses localized capability goals instead of spoken metadata", () => {
  const targets = ["en", "it", "de", "ja"];
  targets.forEach((targetLang) => {
    const unit = getMultiLevelLearningPath(targetLang, ["Pre-A1"]).find(
      (candidate) => candidate.id === "unit-pre-a1-people",
    );
    const lesson = unit.lessons.find(
      (candidate) => candidate.id === "lesson-pre-a1-1-3",
    );
    const agenda = getLessonAgenda(lesson, { unit, targetLang });

    assert.equal(lesson.agenda.version, 2);
    assert.deepEqual(
      agenda.map((item) => getAgendaGoal(item)),
      [
        "Identify familiar people and their relationships in a short neighborhood description",
        "Produce one short, understandable description of a familiar person",
      ],
    );
    assert.equal(
      agenda.every((item) => getAgendaTargetRole(item) === "goal"),
      true,
    );
    assert.equal(
      agenda.every((item) => getAgendaTargetForms(item).length === 0),
      true,
    );
    assert.equal(
      agenda.every(
        (item) =>
          item.targetExamples.length > 0 &&
          item.activityBrief &&
          item.evidence?.criteria,
      ),
      true,
    );
    SUPPORT_LANGUAGES.forEach((supportLang) => {
      const labels = agenda.map((item) =>
        getLocalizedAgendaLabel(item, supportLang),
      );
      assert.equal(labels.every(Boolean), true);
      assert.equal(
        labels.some((label) =>
          /Read a short description of people in a neighborhood/i.test(label),
        ),
        false,
      );
    });
  });
});

test("every Spanish core lesson shown in Pre-A1 has concrete authored language", () => {
  const units = getMultiLevelLearningPath("es", ["Pre-A1"]);
  const lessons = units.flatMap((unit) =>
    (unit.lessons || [])
      .filter(
        (lesson) =>
          lesson.id !== "lesson-tutorial-1" &&
          !lesson.isFinalQuiz &&
          !lesson.isGame &&
          !lesson.tutorPurpose,
      )
      .map((lesson) => ({ lesson, unit })),
  );

  assert.equal(lessons.length, 37);
  lessons.forEach(({ lesson, unit }) => {
    const exactForms = new Set(
      getLessonAgenda(lesson, { unit, targetLang: "es" })
        .flatMap((item) => getAgendaTargetForms(item))
        .map((form) => form.toLocaleLowerCase("es")),
    );
    assert.ok(
      exactForms.size >= 3,
      `${lesson.id} exposes only ${exactForms.size} exact forms`,
    );
  });
});

test("manual review covers every previously prose-only Spanish Pre-A1 lesson", () => {
  assert.equal(Object.keys(MANUAL_PRE_A1_AGENDAS).length, 26);
  Object.entries(MANUAL_PRE_A1_AGENDAS).forEach(([lessonId, spec]) => {
    assert.ok(spec.forms.length >= 4, `${lessonId} has too few concrete forms`);
    assert.ok(spec.application?.goal, `${lessonId} has no application goal`);
    assert.ok(
      spec.application?.evidence,
      `${lessonId} has no observable evidence`,
    );
    getManualPreA1AgendaItems(lessonId).forEach((item) => {
      SUPPORT_LANGUAGES.forEach((lang) => {
        assert.equal(
          typeof item.label?.[lang],
          "string",
          `${lessonId}/${item.id} has no ${lang} label`,
        );
        assert.ok(item.label[lang].trim());
        if (lang !== "en") {
          assert.notEqual(
            item.label[lang],
            item.label.en,
            `${lessonId}/${item.id} falls back to English for ${lang}`,
          );
        }
      });
    });
  });
});

test("Spanish Tutor and skill-tree objectives have authored labels in every support language", () => {
  const units = getMultiLevelLearningPath("es", [
    "Pre-A1",
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
  ]);

  units.forEach((unit) => {
    (unit.lessons || []).forEach((lesson) => {
      getLessonAgenda(lesson, { unit, targetLang: "es" }).forEach((item) => {
        SUPPORT_LANGUAGES.forEach((lang) => {
          const label = item.label?.[lang];
          assert.equal(
            typeof label,
            "string",
            `${lesson.id}/${item.id} has no ${lang} label`,
          );
          assert.ok(label.trim(), `${lesson.id}/${item.id} has a blank ${lang} label`);
          if (lang !== "en") {
            assert.notEqual(
              label,
              item.label.en,
              `${lesson.id}/${item.id} falls back to English for ${lang}`,
            );
          }
        });
      });
    });
  });
});

test("mixed English editor notes are removed from localized grammar objectives", () => {
  const unit = getMultiLevelLearningPath("es", ["B1"]).find(
    (candidate) => candidate.id === "unit-b1-3",
  );
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-b1-3-1",
  );
  const labels = getLessonAgenda(lesson, {
    unit,
    targetLang: "es",
  }).map((item) => getLocalizedAgendaLabel(item, "zh"));

  assert.deepEqual(labels, [
    "在语境中使用: hablaré / comerás / vivirá",
    "在语境中使用: tendré",
    "在语境中使用: haré",
    "在语境中使用: podré",
    "在语境中使用: saldré",
    "在语境中使用: mañana",
    "在语境中使用: el año que viene",
    "在语境中使用: pronto",
    "准确使用: é/ás/á",
    "准确使用: ¿qué hora será?",
    "准确使用: 学习将来时的关键词汇",
  ]);
  assert.equal(
    labels.some((label) =>
      /irregular stems|markers|infinitive|future of probability/i.test(label),
    ),
    false,
  );
});

test("manual A1 review replaces all 28 vague practice and application lessons", () => {
  assert.equal(Object.keys(MANUAL_A1_AGENDAS).length, 28);

  Object.entries(MANUAL_A1_AGENDAS).forEach(([lessonId, spec]) => {
    assert.ok(spec.forms.length >= 5, `${lessonId} has too few exact forms`);
    assert.ok(spec.application?.goal, `${lessonId} has no application goal`);
    assert.ok(
      spec.application?.activityBrief,
      `${lessonId} has no bounded activity`,
    );
    assert.ok(
      spec.application?.evidence,
      `${lessonId} has no observable evidence`,
    );

    const items = getManualA1AgendaItems(lessonId);
    assert.equal(
      items.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
      `${lessonId} must end in one bounded application`,
    );
    SUPPORT_LANGUAGES.forEach((lang) => {
      items.forEach((item) => {
        assert.equal(
          typeof item.label?.[lang],
          "string",
          `${lessonId}/${item.id} has no ${lang} label`,
        );
        assert.ok(item.label[lang].trim());
        if (lang !== "en") {
          assert.notEqual(
            item.label[lang],
            item.label.en,
            `${lessonId}/${item.id} falls back to English for ${lang}`,
          );
        }
      });
    });
  });
});

test("every core A1 lesson exposes concrete language and a measurable agenda", () => {
  const units = getMultiLevelLearningPath("es", ["A1"]);
  const lessons = units.flatMap((unit) =>
    (unit.lessons || [])
      .filter(
        (lesson) =>
          !lesson.isFinalQuiz && !lesson.isGame && !lesson.tutorPurpose,
      )
      .map((lesson) => ({ lesson, unit })),
  );

  assert.equal(units.length, 14);
  assert.equal(lessons.length, 42);

  lessons.forEach(({ lesson, unit }) => {
    const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
    const exactForms = agenda.flatMap((item) => getAgendaTargetForms(item));
    assert.ok(
      exactForms.length >= 3,
      `${lesson.id} exposes only ${exactForms.length} exact forms`,
    );

    if (MANUAL_A1_AGENDAS[lesson.id]) {
      assert.ok(
        exactForms.length >= 5,
        `${lesson.id} does not build enough language`,
      );
      assert.equal(
        agenda.some((item) =>
          /^(?:Practice|Demonstrate|Apply .+ skills|Read .+ and discuss)/i.test(
            getAgendaGoal(item),
          ),
        ),
        false,
        `${lesson.id} still exposes a vague legacy objective`,
      );
    }
  });
});

test("A1 appointments and personal information have bounded phrase inventories", () => {
  const units = getMultiLevelLearningPath("es", ["A1"]);
  const expectations = {
    "lesson-a1-7-3": [
      "¿a qué hora puedes?",
      "puedo a las...",
      "no puedo a las...",
      "¿te va bien...?",
      "sí, perfecto",
      "mejor a las...",
    ],
    "lesson-a1-18-3": [
      "¿cómo te llamas?",
      "¿de dónde eres?",
      "¿dónde vives?",
      "¿qué te gusta?",
      "¿cuándo...?",
      "¿por qué...?",
    ],
  };

  Object.entries(expectations).forEach(([lessonId, expectedForms]) => {
    const unit = units.find((candidate) =>
      candidate.lessons?.some((lesson) => lesson.id === lessonId),
    );
    const lesson = unit.lessons.find((candidate) => candidate.id === lessonId);
    const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
    assert.deepEqual(agenda.flatMap(getAgendaTargetForms), expectedForms);
    assert.equal(
      agenda.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
    );
  });
});

test("A1 generated reviews inherit the manual lesson repairs", () => {
  const unit = getMultiLevelLearningPath("es", ["A1"]).find(
    (candidate) => candidate.id === "unit-a1-7",
  );
  const review = unit.lessons.find(
    (lesson) => lesson.id === "unit-a1-7-skill-builder",
  );
  const forms = getLessonAgenda(review, {
    unit,
    targetLang: "es",
  }).flatMap(getAgendaTargetForms);

  assert.equal(forms.includes("¿a qué hora puedes?"), true);
  assert.equal(forms.includes("mejor a las..."), true);
  assert.equal(
    getLessonAgenda(review, { unit, targetLang: "es" }).some((item) =>
      /Practice '¿qué hora es/i.test(getAgendaGoal(item)),
    ),
    false,
  );
});

test("manual B1 and B2 review replaces every vague practice and application lesson", () => {
  const lessonIds = Object.keys(MANUAL_B1_B2_AGENDAS);
  assert.equal(lessonIds.length, 54);
  assert.equal(lessonIds.filter((lessonId) => lessonId.includes("-b1-")).length, 30);
  assert.equal(lessonIds.filter((lessonId) => lessonId.includes("-b2-")).length, 24);

  Object.entries(MANUAL_B1_B2_AGENDAS).forEach(([lessonId, spec]) => {
    assert.ok(spec.forms.length >= 6, `${lessonId} has too few discourse forms`);
    assert.ok(spec.application?.goal, `${lessonId} has no application goal`);
    assert.ok(
      spec.application?.activityBrief,
      `${lessonId} has no bounded activity`,
    );
    assert.ok(
      spec.application?.evidence,
      `${lessonId} has no observable evidence`,
    );

    const items = getManualB1B2AgendaItems(lessonId);
    const application = items.at(-1);
    assert.equal(
      items.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
      `${lessonId} must have one integrated outcome`,
    );
    SUPPORT_LANGUAGES.forEach((lang) => {
      items.forEach((item) => {
        assert.equal(
          typeof item.label?.[lang],
          "string",
          `${lessonId}/${item.id} has no ${lang} label`,
        );
        assert.ok(item.label[lang].trim());
        if (lang !== "en") {
          assert.notEqual(
            item.label[lang],
            item.label.en,
            `${lessonId}/${item.id} falls back to English for ${lang}`,
          );
        }
      });
      assert.equal(
        application.label[lang].includes(spec.forms[0]),
        true,
        `${lessonId} ${lang} outcome must retain intentional Spanish target content`,
      );
    });
  });
});

test("B1 and B2 introductory lessons split oversized bundles into usable targets", () => {
  const lessonIds = Object.keys(B1_B2_FOUNDATION_FORMS);
  assert.equal(lessonIds.length, 27);
  assert.equal(lessonIds.filter((lessonId) => lessonId.includes("-b1-")).length, 15);
  assert.equal(lessonIds.filter((lessonId) => lessonId.includes("-b2-")).length, 12);

  lessonIds.forEach((lessonId) => {
    const items = getManualB1B2FoundationFormItems(lessonId);
    assert.equal(items.length, 8, `${lessonId} must expose eight targets`);
    items.forEach((item) => {
      assert.equal(getAgendaTargetRole(item), "form");
      assert.equal(getAgendaTargetForms(item).length, 1);
      SUPPORT_LANGUAGES.forEach((lang) => {
        assert.equal(typeof item.label?.[lang], "string");
        assert.ok(item.label[lang].trim());
      });
    });
  });
});

test("every core B1 and B2 lesson has grounded language without vague legacy outcomes", () => {
  const expected = {
    B1: { units: 15, lessons: 45, repaired: 30 },
    B2: { units: 12, lessons: 36, repaired: 24 },
  };

  Object.entries(expected).forEach(([level, counts]) => {
    const units = getMultiLevelLearningPath("es", [level]);
    const lessons = units.flatMap((unit) =>
      (unit.lessons || [])
        .filter(
          (lesson) =>
            !lesson.isFinalQuiz && !lesson.isGame && !lesson.tutorPurpose,
        )
        .map((lesson) => ({ lesson, unit })),
    );

    assert.equal(units.length, counts.units);
    assert.equal(lessons.length, counts.lessons);
    assert.equal(
      lessons.filter(({ lesson }) => MANUAL_B1_B2_AGENDAS[lesson.id]).length,
      counts.repaired,
    );

    lessons.forEach(({ lesson, unit }) => {
      const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
      const forms = agenda.flatMap(getAgendaTargetForms);
      assert.ok(forms.length >= 7, `${lesson.id} has too few exact forms`);
      assert.equal(
        agenda.some((item) =>
          /^(?:Practice|Demonstrate|Apply .+ skills|Read .+ and discuss)/i.test(
            getAgendaGoal(item),
          ),
        ),
        false,
        `${lesson.id} still exposes a vague legacy outcome`,
      );
      if (MANUAL_B1_B2_AGENDAS[lesson.id]) {
        assert.ok(forms.length >= 6, `${lesson.id} lacks discourse scaffolding`);
      }
    });
  });
});

test("B1 probability and B2 civic action require evidence-linked discourse", () => {
  const checks = {
    "lesson-b1-15-2": [
      "quizás esté...",
      "a lo mejor está...",
      "debe de estar...",
      "es posible que...",
      "no creo que...",
      "probablemente...",
      "porque...",
    ],
    "lesson-b2-10-3": [
      "propongo que...",
      "beneficiaría a...",
      "se podría...",
      "una preocupación es...",
      "para responder a eso...",
      "el primer paso sería...",
      "los ciudadanos podrían...",
    ],
  };

  const units = getMultiLevelLearningPath("es", ["B1", "B2"]);
  Object.entries(checks).forEach(([lessonId, expectedForms]) => {
    const unit = units.find((candidate) =>
      candidate.lessons?.some((lesson) => lesson.id === lessonId),
    );
    const lesson = unit.lessons.find((candidate) => candidate.id === lessonId);
    const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
    assert.deepEqual(agenda.flatMap(getAgendaTargetForms), expectedForms);
    assert.equal(
      agenda.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
    );
    assert.ok(agenda.at(-1).activityBrief);
    assert.ok(agenda.at(-1).evidence?.criteria);
  });
});

test("B1 and B2 generated reviews inherit manually repaired discourse targets", () => {
  const units = getMultiLevelLearningPath("es", ["B1", "B2"]);
  const checks = [
    ["unit-b1-15", "quizás esté...", "debe de estar..."],
    ["unit-b2-10", "propongo que...", "una preocupación es..."],
  ];

  checks.forEach(([unitId, firstForm, secondForm]) => {
    const unit = units.find((candidate) => candidate.id === unitId);
    const review = unit.lessons.find(
      (lesson) => lesson.id === `${unitId}-skill-builder`,
    );
    const agenda = getLessonAgenda(review, { unit, targetLang: "es" });
    const forms = agenda.flatMap(getAgendaTargetForms);
    assert.equal(forms.includes(firstForm), true);
    assert.equal(forms.includes(secondForm), true);
    assert.equal(
      agenda.some((item) =>
        /^(?:Practice|Demonstrate|Read .+ and discuss)/i.test(
          getAgendaGoal(item),
        ),
      ),
      false,
    );
  });
});

test("manual C1 and C2 review replaces every vague practice and application lesson", () => {
  const lessonIds = Object.keys(MANUAL_C1_C2_AGENDAS);
  assert.equal(lessonIds.length, 36);
  assert.equal(
    lessonIds.filter((lessonId) => lessonId.includes("-c1-")).length,
    20,
  );
  assert.equal(
    lessonIds.filter((lessonId) => lessonId.includes("-c2-")).length,
    16,
  );

  Object.entries(MANUAL_C1_C2_AGENDAS).forEach(([lessonId, spec]) => {
    assert.ok(spec.forms.length >= 7, `${lessonId} has too few precise forms`);
    assert.ok(spec.application?.goal, `${lessonId} has no application goal`);
    assert.ok(
      spec.application?.activityBrief,
      `${lessonId} has no bounded activity`,
    );
    assert.ok(
      spec.application?.evidence,
      `${lessonId} has no observable evidence`,
    );

    const items = getManualC1C2AgendaItems(lessonId);
    const application = items.at(-1);
    assert.equal(
      items.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
      `${lessonId} must have one integrated outcome`,
    );
    SUPPORT_LANGUAGES.forEach((lang) => {
      items.forEach((item) => {
        assert.equal(
          typeof item.label?.[lang],
          "string",
          `${lessonId}/${item.id} has no ${lang} label`,
        );
        assert.ok(item.label[lang].trim());
        if (lang !== "en") {
          assert.notEqual(
            item.label[lang],
            item.label.en,
            `${lessonId}/${item.id} falls back to English for ${lang}`,
          );
        }
      });
      assert.equal(
        application.label[lang].includes(spec.forms[0]),
        true,
        `${lessonId} ${lang} outcome must retain intentional Spanish target content`,
      );
    });
  });
});

test("C1 and C2 introductory lessons expose precise, manageable repertoires", () => {
  const lessonIds = Object.keys(C1_C2_FOUNDATION_FORMS);
  assert.equal(lessonIds.length, 18);
  assert.equal(
    lessonIds.filter((lessonId) => lessonId.includes("-c1-")).length,
    10,
  );
  assert.equal(
    lessonIds.filter((lessonId) => lessonId.includes("-c2-")).length,
    8,
  );

  lessonIds.forEach((lessonId) => {
    const items = getManualC1C2FoundationFormItems(lessonId);
    assert.equal(items.length, 8, `${lessonId} must expose eight targets`);
    items.forEach((item) => {
      assert.equal(getAgendaTargetRole(item), "form");
      assert.equal(getAgendaTargetForms(item).length, 1);
      SUPPORT_LANGUAGES.forEach((lang) => {
        assert.equal(typeof item.label?.[lang], "string");
        assert.ok(item.label[lang].trim());
      });
    });
  });
});

test("every core C1 and C2 lesson has precise language without vague legacy outcomes", () => {
  const expected = {
    C1: { units: 10, lessons: 30, repaired: 20 },
    C2: { units: 8, lessons: 24, repaired: 16 },
  };

  Object.entries(expected).forEach(([level, counts]) => {
    const units = getMultiLevelLearningPath("es", [level]);
    const lessons = units.flatMap((unit) =>
      (unit.lessons || [])
        .filter(
          (lesson) =>
            !lesson.isFinalQuiz && !lesson.isGame && !lesson.tutorPurpose,
        )
        .map((lesson) => ({ lesson, unit })),
    );

    assert.equal(units.length, counts.units);
    assert.equal(lessons.length, counts.lessons);
    assert.equal(
      lessons.filter(({ lesson }) => MANUAL_C1_C2_AGENDAS[lesson.id]).length,
      counts.repaired,
    );

    lessons.forEach(({ lesson, unit }) => {
      const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
      const forms = agenda.flatMap(getAgendaTargetForms);
      assert.ok(forms.length >= 7, `${lesson.id} has too few precise forms`);
      assert.equal(
        agenda.some((item) =>
          /^(?:Practice|Demonstrate|Apply .+ skills|Read .+ and discuss)/i.test(
            getAgendaGoal(item),
          ),
        ),
        false,
        `${lesson.id} still exposes a vague legacy outcome`,
      );
    });
  });
});

test("C1 synthesis and C2 nuance require advanced discourse control", () => {
  const checks = {
    "lesson-c1-10-3": [
      "en síntesis...",
      "en otras palabras...",
      "respecto a...",
      "dicho esto...",
      "conviene matizar que...",
      "de ahí que...",
      "en última instancia...",
    ],
    "lesson-c2-6-3": [
      "no es que...",
      "dicho sea con reservas...",
      "sin ánimo de...",
      "me temo que...",
      "quizá convendría...",
      "curiosamente...",
      "con cierta ironía...",
    ],
  };

  const units = getMultiLevelLearningPath("es", ["C1", "C2"]);
  Object.entries(checks).forEach(([lessonId, expectedForms]) => {
    const unit = units.find((candidate) =>
      candidate.lessons?.some((lesson) => lesson.id === lessonId),
    );
    const lesson = unit.lessons.find((candidate) => candidate.id === lessonId);
    const agenda = getLessonAgenda(lesson, { unit, targetLang: "es" });
    assert.deepEqual(agenda.flatMap(getAgendaTargetForms), expectedForms);
    assert.equal(
      agenda.filter((item) => getAgendaTargetRole(item) === "goal").length,
      1,
    );
    assert.ok(agenda.at(-1).activityBrief);
    assert.ok(agenda.at(-1).evidence?.criteria);
  });
});

test("C1 and C2 generated reviews inherit manually repaired advanced targets", () => {
  const units = getMultiLevelLearningPath("es", ["C1", "C2"]);
  const checks = [
    ["unit-c1-10", "conviene matizar que...", "de ahí que..."],
    ["unit-c2-6", "no es que...", "con cierta ironía..."],
  ];

  checks.forEach(([unitId, firstForm, secondForm]) => {
    const unit = units.find((candidate) => candidate.id === unitId);
    const review = unit.lessons.find(
      (lesson) => lesson.id === `${unitId}-skill-builder`,
    );
    const agenda = getLessonAgenda(review, { unit, targetLang: "es" });
    const forms = agenda.flatMap(getAgendaTargetForms);
    assert.equal(forms.includes(firstForm), true);
    assert.equal(forms.includes(secondForm), true);
    assert.equal(
      agenda.some((item) =>
        /^(?:Practice|Demonstrate|Read .+ and discuss)/i.test(
          getAgendaGoal(item),
        ),
      ),
      false,
    );
  });
});

test("C2 fluency titles describe functional control without native-speaker framing", () => {
  const units = getMultiLevelLearningPath("es", ["C2"]);
  const renamedIds = [
    "unit-c2-1",
    "lesson-c2-1-2",
    "lesson-c2-1-3",
    "unit-c2-8",
    "lesson-c2-8-1",
    "lesson-c2-8-2",
    "lesson-c2-8-3",
    "lesson-c2-8-quiz",
  ];
  const entries = units.flatMap((unit) => [
    unit,
    ...(unit.lessons || []),
  ]);

  renamedIds.forEach((id) => {
    const entry = entries.find((candidate) => candidate.id === id);
    assert.ok(entry, `${id} is missing`);
    SUPPORT_LANGUAGES.forEach((lang) => {
      assert.equal(typeof entry.title?.[lang], "string");
      assert.ok(entry.title[lang].trim(), `${id} has no ${lang} title`);
    });
    assert.doesNotMatch(
      entry.title.en,
      /native|perfect|complete mastery/i,
      `${id} retains native-speaker framing`,
    );
  });
});

test("Meeting Someone New names the exact language in its four-turn exchange", () => {
  const unit = getMultiLevelLearningPath("es", ["Pre-A1"]).find(
    (candidate) => candidate.id === "unit-a1-1",
  );
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-a1-1-2",
  );
  const agenda = getLessonAgenda(lesson, {
    unit,
    targetLang: "es",
  });
  const forms = agenda.flatMap((item) => getAgendaTargetForms(item));

  assert.deepEqual(forms, [
    "hola",
    "me llamo",
    "¿cómo te llamas?",
    "mucho gusto",
    "¿cómo estás?",
    "bien, gracias",
    "hasta luego",
  ]);
  assert.equal(agenda.filter((item) => getAgendaTargetRole(item) === "goal").length, 1);
  assert.match(
    getAgendaGoal(agenda.at(-1)),
    /greeting, names, wellbeing, and a closing/i,
  );
});

test("Polite Expressions has a manually authored courtesy sequence", () => {
  const unit = getMultiLevelLearningPath("es", ["Pre-A1"]).find(
    (candidate) => candidate.id === "unit-pre-a1-courtesy",
  );
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "lesson-pre-a1-5-3",
  );
  const forms = getLessonAgenda(lesson, {
    unit,
    targetLang: "es",
  }).flatMap((item) => getAgendaTargetForms(item));

  assert.deepEqual(forms, [
    "muchas gracias",
    "de nada",
    "no hay problema",
    "con gusto",
    "no es nada",
  ]);
  assert.equal(forms.includes("por favor"), false);
});

test("Spanish unit reviews retain strong lessons and replace weak source objectives", () => {
  const unit = getMultiLevelLearningPath("es", ["Pre-A1"]).find(
    (candidate) => candidate.id === "unit-pre-a1-people",
  );
  const lesson = unit.lessons.find(
    (candidate) => candidate.id === "unit-pre-a1-people-skill-builder",
  );
  const forms = getLessonAgenda(lesson, {
    unit,
    targetLang: "es",
  }).flatMap((item) => getAgendaTargetForms(item));

  assert.equal(forms.includes("mamá"), true);
  assert.equal(forms.includes("abuelo"), true);
  assert.equal(forms.includes("vecina"), true);
  assert.equal(
    getLessonAgenda(lesson, { unit, targetLang: "es" }).some((item) =>
      /names at least two extended family/i.test(getAgendaGoal(item)),
    ),
    false,
  );
});

test("curriculum audit separates release blockers from manual review candidates", () => {
  const units = getMultiLevelLearningPath("es", ["Pre-A1"]);
  const audit = buildLessonCurriculumAudit(units, {
    requiredSupportLanguages: SUPPORT_LANGUAGES,
    targetLang: "es",
  });

  assert.equal(audit.lessonCount > 0, true);
  assert.equal(audit.itemCount > 0, true);
  assert.deepEqual(audit.blockers, []);
  assert.equal(
    audit.reviewCandidates.some(
      (finding) => finding.type === "legacy_fallback_objective",
    ),
    true,
  );
  assert.equal(
    audit.reviewCandidates.some(
      (finding) =>
        finding.lessonId === "lesson-pre-a1-1-3" &&
        finding.type === "legacy_fallback_objective",
    ),
    false,
  );
});

test("curriculum audit blocks a declared lesson/objective alignment regression", () => {
  const lesson = withCanonicalLessonAgenda({
    id: "lesson-phone-age-regression",
    title: { en: "Phone Numbers and Ages", es: "Teléfonos y edades" },
    objectiveAlignment: [["phone"], ["age"]],
    modes: ["reading"],
    content: {
      reading: {
        prompt: "Read and say numbers in simple prices",
      },
    },
  });
  const audit = buildLessonCurriculumAudit([
    {
      id: "unit-regression",
      title: { en: "Numbers", es: "Números" },
      lessons: [lesson],
    },
  ]);

  assert.deepEqual(
    audit.blockers
      .filter((finding) => finding.type === "objective_alignment_missing")
      .map((finding) => finding.expectedAnyOf),
    [["phone"], ["age"]],
  );
});

test("the numbers unit covers 11-30 and the repaired lessons match their titles", () => {
  const units = getMultiLevelLearningPath("es", [
    "Pre-A1",
    "A1",
    "A2",
    "B2",
    "C1",
    "C2",
  ]);
  const numbersUnit = units.find((unit) => unit.id === "unit-a1-3");
  const largerNumbersUnit = units.find((unit) => unit.id === "unit-a1-4");
  assert.equal(numbersUnit.title.en, "Numbers 11-30");
  assert.equal(largerNumbersUnit.title.en, "Numbers 31-100");
  assert.equal(JSON.stringify(numbersUnit).includes("Numbers 0-20"), false);
  assert.equal(JSON.stringify(largerNumbersUnit).includes("Numbers 21-100"), false);

  const findLesson = (lessonId) =>
    units.flatMap((unit) => unit.lessons || []).find((lesson) => lesson.id === lessonId);
  const goalsFor = (lessonId) =>
    getLessonAgenda(findLesson(lessonId)).map((item) => getAgendaGoal(item));

  assert.equal(goalsFor("lesson-a1-3-1").some((goal) => /treinta/i.test(goal)), true);
  assert.equal(goalsFor("lesson-a1-3-1").some((goal) => /cero/i.test(goal)), false);
  assert.equal(
    goalsFor("lesson-a1-4-1").some((goal) => /veintiuno|veintiún/i.test(goal)),
    false,
  );

  const expectedConcepts = {
    "lesson-a1-3-3": [/phone/i, /age/i],
    "lesson-a1-7-3": [/appointment/i, /schedule|reschedule/i],
    "lesson-a1-11-3": [/bill/i, /total|charge/i],
    "lesson-a2-2-3": [/dream destination/i, /appealing/i],
    "lesson-a2-9-3": [/fitness/i, /goal/i],
    "lesson-a2-14-3": [/healthy/i, /habit/i],
    "lesson-a2-16-3": [/dream job/i, /interests|qualities/i],
    "lesson-a2-17-3": [/progress/i, /goal/i],
    "lesson-b2-7-3": [/predict/i, /technology|scientific/i],
    "lesson-b2-9-2": [/artistic movement/i, /influence/i],
    "lesson-b2-9-3": [/cultural/i, /context/i],
    "lesson-b2-10-3": [/civic|citizen/i, /action/i],
    "lesson-b2-11-3": [/wellness|wellbeing/i, /physical/i, /mental/i],
    "lesson-c1-2-3": [/regret/i, /emotion/i],
    "lesson-c1-6-3": [/lead/i, /team|meeting/i],
    "lesson-c2-3-3": [/imagery/i, /figurative/i],
  };
  Object.entries(expectedConcepts).forEach(([lessonId, patterns]) => {
    const combinedGoals = goalsFor(lessonId).join(" ");
    patterns.forEach((pattern) => assert.match(combinedGoals, pattern));
  });
});

test("early repeated units now cover materially different communicative work", () => {
  const units = getMultiLevelLearningPath("es", ["Pre-A1", "A1"]);
  const firstWords = units.find((unit) => unit.id === "unit-a1-1");
  const preA1Objects = units.find((unit) => unit.id === "unit-pre-a1-objects");
  const classroomObjects = units.find((unit) => unit.id === "unit-a1-12");

  assert.equal(firstWords.lessons[0].title.en, "Conversation Building Blocks");
  assert.match(
    getLessonAgenda(firstWords.lessons[1], { unit: firstWords })
      .map(getAgendaGoal)
      .join(" "),
    /four-turn first meeting/i,
  );
  assert.equal(preA1Objects.title.en, "Common Objects");
  assert.equal(classroomObjects.title.en, "Classroom Objects");
  assert.match(JSON.stringify(preA1Objects), /household items|personal items/i);
  assert.match(JSON.stringify(classroomObjects), /cuaderno|pizarra|teclado/i);

  [
    units.find((unit) => unit.id === "unit-a1-4").title,
    firstWords.lessons[0].title,
    classroomObjects.title,
  ].forEach((localizedTitle) => {
    SUPPORT_LANGUAGES.forEach((lang) => {
      assert.equal(typeof localizedTitle[lang], "string");
      assert.equal(localizedTitle[lang].trim().length > 0, true);
      if (lang !== "en") assert.notEqual(localizedTitle[lang], localizedTitle.en);
    });
  });
});

test("supplemental lessons expose distinct Tutor purposes over inherited unit objectives", () => {
  const units = getMultiLevelLearningPath("es", ["Pre-A1", "A1"]);
  const unit = units.find((candidate) => candidate.id === "unit-a1-3");
  const skillBuilder = unit.lessons.find(
    (lesson) => lesson.id === `${unit.id}-skill-builder`,
  );
  const integratedPractice = unit.lessons.find(
    (lesson) => lesson.id === `${unit.id}-integrated-practice`,
  );
  const gameReview = unit.lessons.find(
    (lesson) => lesson.id === `${unit.id}-game`,
  );

  assert.equal(skillBuilder.tutorPurpose, "targeted_review");
  assert.equal(integratedPractice.tutorPurpose, "integrated_scenario");
  assert.equal(gameReview.tutorPurpose, "rpg_game");
  assert.equal(gameReview.isGame, true);
  assert.deepEqual(skillBuilder.reviewStrategy.formats, [
    "pattern_recycling",
    "micro_drill",
  ]);
  assert.deepEqual(integratedPractice.reviewStrategy.formats, [
    "guided_scenario",
    "skill_integration",
  ]);
  assert.equal(skillBuilder.reviewSourceLessonIds.length >= 3, true);
  assert.deepEqual(
    integratedPractice.reviewSourceLessonIds,
    skillBuilder.reviewSourceLessonIds,
  );
  assert.equal(
    integratedPractice.agenda.items.every(
      (item) => item.source === "unit-review" && item.sourceLessonId,
    ),
    true,
  );
});

test("remaining Pre-A1 story modules are measurable learner outcomes", () => {
  const repairedIds = new Set([
    "lesson-pre-a1-1-2",
    "lesson-pre-a1-2-2",
    "lesson-pre-a1-2-3",
    "lesson-pre-a1-3-3",
    "lesson-pre-a1-4-2",
    "lesson-pre-a1-4-3",
    "lesson-pre-a1-5-2",
    "lesson-pre-a1-6-2",
    "lesson-pre-a1-7-3",
    "lesson-pre-a1-8-2",
    "lesson-pre-a1-8-3",
  ]);
  const units = getMultiLevelLearningPath("es", ["Pre-A1"]);
  const repairedLessons = units
    .flatMap((unit) => unit.lessons || [])
    .filter((lesson) => repairedIds.has(lesson.id));

  assert.equal(repairedLessons.length, repairedIds.size);
  repairedLessons.forEach((lesson) => {
    getLessonAgenda(lesson).forEach((item) => {
      assert.doesNotMatch(getAgendaGoal(item), /^(?:a short story|a story) about/i);
    });
  });
});

test("the second repair pass stays authored across every generated target curriculum", () => {
  const targetLanguages = ["de", "el", "en", "fr", "ga", "it", "ja", "nl", "pl", "pt", "ru"];
  const repairedIds = new Set([
    "lesson-pre-a1-1-2", "lesson-pre-a1-2-2", "lesson-pre-a1-2-3",
    "lesson-pre-a1-3-3", "lesson-pre-a1-4-2", "lesson-pre-a1-4-3",
    "lesson-pre-a1-5-2", "lesson-pre-a1-6-2", "lesson-pre-a1-7-3",
    "lesson-pre-a1-8-2", "lesson-pre-a1-8-3", "lesson-a1-1-2",
    "lesson-a1-1-3", "lesson-a1-4-1", "lesson-a1-4-2", "lesson-a1-4-3",
    "lesson-a1-7-3", "lesson-a1-11-3", "lesson-a1-12-1",
    "lesson-a1-12-2", "lesson-a1-12-3", "lesson-a2-9-3",
    "lesson-a2-16-3", "lesson-a2-17-3", "lesson-b2-7-3",
    "lesson-b2-10-3", "lesson-c1-6-3",
  ]);

  targetLanguages.forEach((targetLang) => {
    const units = getMultiLevelLearningPath(targetLang, [
      "Pre-A1", "A1", "A2", "B2", "C1",
    ]);
    const repairedLessons = units
      .flatMap((unit) =>
        (unit.lessons || [])
          .filter((lesson) => repairedIds.has(lesson.id))
          .map((lesson) => ({ lesson, unit })),
      );
    assert.equal(repairedLessons.length, repairedIds.size);
    repairedLessons.forEach(({ lesson, unit }) => {
      const agenda = getLessonAgenda(lesson, { unit, targetLang });
      assert.equal(agenda.every((item) => item.source === "target-language-authored"), true);
      assert.equal(agenda.every((item) => item.targetExamples?.length > 0), true);
    });
  });
});

test("repaired objectives retain authored examples in every generated target curriculum", () => {
  const targetLanguages = ["de", "el", "en", "fr", "ga", "it", "ja", "nl", "pl", "pt", "ru"];
  const repairedLessonIds = new Set([
    "lesson-a1-3-1",
    "lesson-a1-3-2",
    "lesson-a1-3-3",
    "lesson-a2-2-3",
    "lesson-a2-14-3",
    "lesson-b2-9-2",
    "lesson-b2-9-3",
    "lesson-b2-11-3",
    "lesson-c1-2-3",
    "lesson-c2-3-3",
  ]);

  targetLanguages.forEach((targetLang) => {
    const units = getMultiLevelLearningPath(targetLang, [
      "Pre-A1",
      "A1",
      "A2",
      "B2",
      "C1",
      "C2",
    ]);
    const repairedLessons = units
      .flatMap((unit) =>
        (unit.lessons || [])
          .filter((lesson) => repairedLessonIds.has(lesson.id))
          .map((lesson) => ({ lesson, unit })),
      );
    assert.equal(repairedLessons.length, repairedLessonIds.size);
    repairedLessons.forEach(({ lesson, unit }) => {
      const agenda = getLessonAgenda(lesson, { unit, targetLang });
      assert.equal(agenda.every((item) => item.source === "target-language-authored"), true);
      assert.equal(agenda.every((item) => item.targetExamples?.length > 0), true);
    });
  });
});

test("the full curriculum passes agenda and support-language integrity", () => {
  const units = getMultiLevelLearningPath("es", [
    "Pre-A1",
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
  ]);
  const issues = getCurriculumIntegrityIssues(units, {
    requiredSupportLanguages: SUPPORT_LANGUAGES,
  });
  assert.deepEqual(issues, []);
});
