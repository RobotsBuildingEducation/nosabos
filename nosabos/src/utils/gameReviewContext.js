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
  if (lesson?.isGame && unitLessons.length) {
    return unitLessons.filter((entry) => entry && !entry.isGame);
  }
  if (unitLessons.length) {
    return unitLessons.filter((entry) => entry && !entry.isGame);
  }

  return [lesson].filter(Boolean);
}

export function buildGameReviewContext({
  lesson,
  unit = null,
  fallbackLevel = null,
}) {
  if (!lesson) return null;

  const relevantLessons = collectRelevantLessons(lesson, unit);
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
    reviewTerms: finalTerms,
    reviewObjectives: reviewObjectives.slice(0, 16),
    curriculumSummary,
  };
}
