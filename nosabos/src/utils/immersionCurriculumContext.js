import { CEFR_LEVELS } from "../data/flashcards/common.js";

function shortText(value, limit = 140) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function localizedText(value, appLanguage) {
  if (typeof value === "string") return shortText(value);
  if (!value || typeof value !== "object") return "";
  return shortText(value[appLanguage] || value.en || Object.values(value).find((item) => typeof item === "string"));
}

// Send the learning objective, not a whole lesson or a list of example tasks.
export function summarizeImmersionLesson(lesson, appLanguage = "en") {
  if (!lesson || typeof lesson !== "object") return null;
  const focusPoints = [
    ...(Array.isArray(lesson.content?.grammar?.focusPoints) ? lesson.content.grammar.focusPoints : []),
    ...(Array.isArray(lesson.content?.vocabulary?.focusPoints) ? lesson.content.vocabulary.focusPoints : []),
  ];
  return {
    title: localizedText(lesson.title, appLanguage),
    description: localizedText(lesson.description, appLanguage),
    level: shortText(lesson.cefrLevel || lesson.level, 20),
    objective: shortText(lesson.objectives?.communicativeObjectives?.[0], 180),
    focusPoints: [...new Set(focusPoints.map((point) => shortText(point, 90)).filter(Boolean))].slice(0, 4),
  };
}

// Both modes use the same ordered lesson catalog, but save progress separately.
// A course summary lets the daily plate locate the next lesson even when its
// detailed progress listener has not been mounted yet.
export function immersionLessonCandidate({
  units = [], progress = {}, completedCount = 0, level, mode,
  priorityLessonId = null,
}) {
  const lessons = units.flatMap((unit) => unit?.lessons || []);
  if (!lessons.length) return null;
  const eligible = lessons.map((lesson, index) => ({ lesson, index }));
  const priority = priorityLessonId &&
    eligible.find(({ lesson }) => lesson.id === priorityLessonId &&
      progress?.[lesson.id]?.status !== "completed");
  if (priority) return { ...priority, level, mode };

  const inProgress = eligible.find(({ lesson }) =>
    progress?.[lesson.id]?.status === "in_progress");
  const latestCompletedIndex = lessons.reduce((latest, lesson, index) =>
    progress?.[lesson.id]?.status === "completed" ? Math.max(latest, index) : latest, -1);
  const nextIndex = Math.max(0, Number(completedCount) || 0, latestCompletedIndex + 1);
  const current = inProgress || eligible.find(({ index }) => index >= nextIndex)
    || eligible[eligible.length - 1];
  return { ...current, level, mode };
}

export function leadingImmersionLesson(skillTree, tutor) {
  if (!skillTree) return tutor || null;
  if (!tutor) return skillTree;
  const skillRank = CEFR_LEVELS.indexOf(skillTree.level);
  const tutorRank = CEFR_LEVELS.indexOf(tutor.level);
  if (tutorRank !== skillRank) return tutorRank > skillRank ? tutor : skillTree;
  return tutor.index >= skillTree.index ? tutor : skillTree;
}
