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
  const targets = ["es", "en", "it", "de", "ja"];
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
