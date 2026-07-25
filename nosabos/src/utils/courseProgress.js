import { CEFR_LEVEL_COUNTS, CEFR_LEVELS } from "../data/flashcards/common.js";
import { LESSON_COUNTS, getLessonLevelFromId } from "./cefrProgress.js";

export const COURSE_PROGRESS_SCHEMA_VERSION = 1;
export const COURSE_PROGRESS_COLLECTION = "courseProgress";

export function isCourseProgressSubscriptionReady({
  isLoadingApp = false,
  userId,
  targetLang,
} = {}) {
  return (
    !isLoadingApp &&
    Boolean(String(userId || "").trim()) &&
    Boolean(String(targetLang || "").trim())
  );
}

export function shouldSubscribeToCourseProgressMode(pathMode, mode) {
  if (mode === "skillTree") return pathMode === "path";
  if (mode === "flashcards") return pathMode === "flashcards";
  if (mode === "tutor") return pathMode === "tutor";
  return false;
}

const LEVEL_BY_KEY = Object.fromEntries(
  CEFR_LEVELS.map((level) => [toCourseLevelKey(level), level]),
);

export function normalizeCourseLevel(level) {
  const value = String(level || "").trim();
  if (!value) return null;
  const direct = CEFR_LEVELS.find(
    (candidate) => candidate.toLowerCase() === value.toLowerCase(),
  );
  if (direct) return direct;
  return LEVEL_BY_KEY[value.toLowerCase()] || null;
}

export function toCourseLevelKey(level) {
  return String(level || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

export function getFlashcardLevelFromProgress(data = {}, cardId = "") {
  const explicit = normalizeCourseLevel(
    data?.cefrLevel || data?.card?.cefrLevel,
  );
  if (explicit) return explicit;

  const id = String(data?.cardId || cardId || "").toLowerCase();
  return (
    CEFR_LEVELS.find((level) =>
      id.startsWith(`${String(level).toLowerCase()}-`),
    ) || null
  );
}

export function getProgressDocumentLevel(mode, data = {}, documentId = "") {
  if (mode === "flashcards") {
    return getFlashcardLevelFromProgress(data, data?.cardId || documentId);
  }
  return (
    normalizeCourseLevel(data?.cefrLevel) ||
    getLessonLevelFromId(data?.lessonId || documentId)
  );
}

function getModeTotal(mode, level) {
  if (mode === "flashcards") return CEFR_LEVEL_COUNTS[level] || 0;
  if (mode === "skillTree") return LESSON_COUNTS[level] || 0;
  return LESSON_COUNTS[level] || 0;
}

function createModeLevels(mode) {
  return CEFR_LEVELS.reduce((levels, level) => {
    levels[toCourseLevelKey(level)] = {
      completed: 0,
      total: getModeTotal(mode, level),
    };
    return levels;
  }, {});
}

export function createEmptyCourseProgressSummary(targetLang = "es") {
  return {
    schemaVersion: COURSE_PROGRESS_SCHEMA_VERSION,
    targetLang: String(targetLang || "es").toLowerCase(),
    skillTree: { levels: createModeLevels("skillTree") },
    flashcards: { levels: createModeLevels("flashcards") },
    tutor: { levels: createModeLevels("tutor") },
    migration: { complete: false },
  };
}

function getDocumentData(entry) {
  if (!entry) return {};
  if (typeof entry.data === "function") return entry.data() || {};
  return entry.data && typeof entry.data === "object" ? entry.data : entry;
}

function getDocumentId(entry, data) {
  return entry?.id || data?.lessonId || data?.cardId || "";
}

function countCompletedDocuments(summary, mode, entries = []) {
  const completedIds = new Set();
  entries.forEach((entry) => {
    const data = getDocumentData(entry);
    const documentId = getDocumentId(entry, data);
    const level = getProgressDocumentLevel(mode, data, documentId);
    if (!level) return;

    const isCompleted =
      mode === "flashcards"
        ? data?.completed === true &&
          String(data?.cardId || documentId)
            .toLowerCase()
            .startsWith(`${level.toLowerCase()}-`)
        : data?.status === "completed";
    if (!isCompleted) return;
    const progressId = String(
      mode === "flashcards" ? data?.cardId || documentId : data?.lessonId || documentId,
    );
    if (!progressId || completedIds.has(progressId)) return;
    completedIds.add(progressId);

    const key = toCourseLevelKey(level);
    summary[mode].levels[key].completed += 1;
  });
}

export function buildCourseProgressSummary({
  targetLang = "es",
  languageLessons = [],
  tutorLanguageLessons = [],
  languageFlashcards = [],
} = {}) {
  const summary = createEmptyCourseProgressSummary(targetLang);
  countCompletedDocuments(summary, "skillTree", languageLessons);
  countCompletedDocuments(summary, "tutor", tutorLanguageLessons);
  countCompletedDocuments(summary, "flashcards", languageFlashcards);
  summary.migration.complete = true;
  return summary;
}

export function mergeCourseProgressSummaries(
  calculatedSummary,
  storedSummary,
) {
  if (!storedSummary || typeof storedSummary !== "object") {
    return calculatedSummary;
  }

  const merged = {
    ...storedSummary,
    ...calculatedSummary,
  };
  ["skillTree", "flashcards", "tutor"].forEach((mode) => {
    const calculatedLevels = calculatedSummary?.[mode]?.levels || {};
    const storedLevels = storedSummary?.[mode]?.levels || {};
    const levels = {};

    new Set([
      ...Object.keys(calculatedLevels),
      ...Object.keys(storedLevels),
    ]).forEach((key) => {
      const calculated = calculatedLevels[key] || {};
      const stored = storedLevels[key] || {};
      levels[key] = {
        ...stored,
        ...calculated,
        completed: Math.max(
          0,
          Number(calculated.completed) || 0,
          Number(stored.completed) || 0,
        ),
      };
    });

    merged[mode] = {
      ...(storedSummary?.[mode] || {}),
      ...(calculatedSummary?.[mode] || {}),
      levels,
    };
  });

  return merged;
}

export function getCourseProgressSummary(progress, targetLang = "es") {
  const languageKey = String(targetLang || "es").toLowerCase();
  return progress?.courseProgress?.[languageKey] || null;
}

export function getCourseLevelStats(summary, mode, level, fallbackTotal = 0) {
  const key = toCourseLevelKey(level);
  const stored = summary?.[mode]?.levels?.[key];
  const completed = Number(stored?.completed);
  const total = Number(stored?.total);
  return {
    completed: Number.isFinite(completed) ? Math.max(0, completed) : null,
    total: Number.isFinite(total)
      ? Math.max(0, total)
      : Math.max(0, Number(fallbackTotal) || 0),
  };
}

export function replaceProgressLevel({
  existing = {},
  documents = [],
  mode,
  level,
  idField,
}) {
  const next = {};
  Object.entries(existing || {}).forEach(([id, data]) => {
    if (getProgressDocumentLevel(mode, data, id) !== level) {
      next[id] = data;
    }
  });

  documents.forEach((entry) => {
    const data = getDocumentData(entry);
    const id = data?.[idField] || getDocumentId(entry, data);
    if (id) next[id] = data;
  });
  return next;
}
