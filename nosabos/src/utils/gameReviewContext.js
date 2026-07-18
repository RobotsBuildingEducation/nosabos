import {
  buildUnitCurriculumSnapshot,
  buildUnitQuizBlueprint,
  getLessonAgenda,
  isReviewLesson,
} from "./lessonCurriculum.js";

function cleanString(value) {
  return String(value || "").trim();
}

function uniqueStrings(values = []) {
  return Array.from(
    new Set(values.map(cleanString).filter(Boolean)),
  );
}

export function inferCefrLevelFromLessonId(lessonId = "") {
  const id = cleanString(lessonId).toLowerCase();
  if (!id) return null;
  if (id.includes("lesson-tutorial") || id.includes("lesson-pre-a1")) {
    return "Pre-A1";
  }

  const match = id.match(/lesson-([a-z]\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

function getLocalizedText(value, locale = "en") {
  if (typeof value === "string") return cleanString(value);
  if (!value || typeof value !== "object") return "";
  return cleanString(value[locale] || value.en || value.es || "");
}

function collectModeTerms(modeData = {}) {
  if (!modeData || typeof modeData !== "object") return [];
  return uniqueStrings([
    ...(Array.isArray(modeData.focusPoints) ? modeData.focusPoints : []),
    ...(Array.isArray(modeData.topics) ? modeData.topics : []),
    ...(Array.isArray(modeData.unitTopics) ? modeData.unitTopics : []),
    modeData.topic,
    modeData.scenario,
    modeData.unitTitle,
  ]);
}

function collectModeObjectives(modeData = {}) {
  if (!modeData || typeof modeData !== "object") return [];
  return uniqueStrings([
    modeData.prompt,
    modeData.scenario,
    modeData.successCriteria,
    modeData.tutorialDescription?.en,
  ]);
}

function collectRelevantLessons(lesson, unit) {
  const unitLessons = Array.isArray(unit?.lessons) ? unit.lessons : [];

  if (lesson?.isTutorial) return [lesson].filter(Boolean);
  if (isReviewLesson(lesson) && unitLessons.length) {
    const relevant = [];
    for (const entry of unitLessons) {
      if (entry?.id === lesson?.id) break;
      if (entry && !isReviewLesson(entry)) relevant.push(entry);
    }
    return relevant;
  }

  return [lesson].filter(Boolean);
}

function buildReviewLesson(entry) {
  const modes = Object.entries(entry?.content || {})
    .filter(([, modeData]) => modeData && typeof modeData === "object")
    .map(([mode, modeData]) => ({
      mode,
      topic: cleanString(modeData.topic || modeData.scenario),
      focusPoints: uniqueStrings([
        ...(Array.isArray(modeData.focusPoints) ? modeData.focusPoints : []),
        ...(Array.isArray(modeData.topics) ? modeData.topics : []),
      ]),
      prompt: cleanString(modeData.prompt),
      successCriteria: cleanString(modeData.successCriteria),
    }))
    .filter(
      (mode) =>
        mode.topic ||
        mode.focusPoints.length ||
        mode.prompt ||
        mode.successCriteria,
    );

  return {
    id: entry?.id || "",
    title: getLocalizedText(entry?.title, "en"),
    description: getLocalizedText(entry?.description, "en"),
    modes,
  };
}

export function buildGameReviewContext({
  lesson,
  unit = null,
  fallbackLevel = null,
  targetLang = "",
}) {
  if (!lesson) return null;

  const normalizedTargetLang = cleanString(targetLang)
    .toLowerCase()
    .split(/[-_]/)[0];
  const usesTargetLanguageAdapter =
    !!normalizedTargetLang && normalizedTargetLang !== "es";
  const relevantLessons = collectRelevantLessons(lesson, unit);
  const curriculumSnapshot = isReviewLesson(lesson)
    ? buildUnitCurriculumSnapshot(unit, {
        beforeLessonId: lesson.id,
        targetLang,
      })
    : {
        version: 1,
        unitId: unit?.id || "",
        unitTitle: unit?.title || null,
        sourceLessonIds: lesson?.id ? [lesson.id] : [],
        agendaItems: getLessonAgenda(lesson, { unit, targetLang }).map((item) => ({
          ...item,
          sourceLessonId: lesson.id,
          sourceLessonTitle: lesson.title,
        })),
      };
  const quizBlueprint = lesson?.isFinalQuiz
    ? buildUnitQuizBlueprint(unit, {
        beforeLessonId: lesson.id,
        questionCount:
          lesson?.quizConfig?.questionCount ||
          lesson?.quizConfig?.questionsRequired ||
          10,
        targetLang,
      })
    : null;
  const reviewLessons = relevantLessons.map(buildReviewLesson);
  const lessonTitles = uniqueStrings(
    relevantLessons.map((entry) => getLocalizedText(entry?.title, "en")),
  );
  const reviewTerms = uniqueStrings(
    relevantLessons.flatMap((entry) =>
      Object.values(entry?.content || {})
        .filter((modeData) => modeData && typeof modeData === "object")
        .flatMap((modeData) => collectModeTerms(modeData)),
    ),
  );
  const reviewObjectives = uniqueStrings(
    relevantLessons.flatMap((entry) =>
      Object.values(entry?.content || {})
        .filter((modeData) => modeData && typeof modeData === "object")
        .flatMap((modeData) => collectModeObjectives(modeData)),
    ),
  );

  const cefrLevel =
    lesson?.content?.game?.cefrLevel ||
    unit?.cefrLevel ||
    fallbackLevel ||
    inferCefrLevelFromLessonId(lesson.id) ||
    "Pre-A1";

  const unitTitle = getLocalizedText(unit?.title, "en") || lesson?.content?.game?.unitTitle || "";
  const lessonTitle = getLocalizedText(lesson?.title, "en");
  const tutorialTerms = lesson?.isTutorial
    ? ["hello", "hi", "good morning", "goodbye", "my name is"]
    : [];
  const finalTerms = uniqueStrings([
    ...tutorialTerms,
    ...reviewTerms,
    ...(Array.isArray(lesson?.content?.game?.focusPoints)
      ? lesson.content.game.focusPoints
      : []),
    lesson?.content?.game?.topic,
    lesson?.content?.game?.unitTitle,
    unitTitle,
    lessonTitle,
  ]).slice(0, 40);

  const mode =
    lesson?.isTutorial ? "tutorial" : lesson?.isGame ? "unit_review" : "lesson_review";

  const curriculumSummary = lesson?.isTutorial
    ? "Tutorial review. Keep the game limited to greetings, saying your name, and very simple polite responses."
    : lesson?.isGame
      ? `Unit review for ${unitTitle || lessonTitle}. Recycle the key language from this chapter only.`
      : `Review the active lesson ${lessonTitle} using nearby chapter topics and the current proficiency level.`;

  return {
    mode,
    isTutorial: !!lesson?.isTutorial,
    isGameReview: !!lesson?.isGame,
    cefrLevel,
    unitId: unit?.id || "",
    unitTitle,
    lessonId: lesson?.id || "",
    lessonTitle,
    lessonTitles,
    targetLang: normalizedTargetLang,
    targetLanguageAdapted: usesTargetLanguageAdapter,
    reviewLessons: usesTargetLanguageAdapter
      ? reviewLessons.map((entry) => ({
          ...entry,
          modes: entry.modes.map((mode) => ({
            mode: mode.mode,
            topic: entry.title,
            focusPoints: [],
            prompt: `Practice ${entry.title} in the selected practice language`,
            successCriteria: "Demonstrates the lesson objective in context",
          })),
        }))
      : reviewLessons,
    sourceLessonIds: curriculumSnapshot.sourceLessonIds,
    agendaItems: curriculumSnapshot.agendaItems,
    reviewStrategy: lesson?.reviewStrategy || null,
    quizBlueprint,
    reviewTerms: usesTargetLanguageAdapter
      ? uniqueStrings([...lessonTitles, unitTitle, lessonTitle])
      : finalTerms,
    reviewObjectives: usesTargetLanguageAdapter
      ? uniqueStrings(
          curriculumSnapshot.agendaItems.map((item) => item.targetConcept),
        ).slice(0, 16)
      : reviewObjectives.slice(0, 16),
    curriculumSummary,
  };
}
