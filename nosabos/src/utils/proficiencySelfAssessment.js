import { initialEloRating, normalizeEloLevel, SCORE_LEVEL_BANDS, SCORE_SCALE_VERSION, scoreToElo } from "./performanceEloModel.js";

// The lower level in a range is the course starting point. Its Score
// preserves the learner's more specific self-report without unlocking the
// upper course before they have practiced or taken the placement test.
export const SELF_ASSESSMENT_OPTIONS = Object.freeze([
  { id: "understands_more", level: "Pre-A1", rating: 3, range: "Pre-A1", label: "I understand more than I can speak" },
  { id: "common_words", level: "A1", rating: 18, range: "A1", label: "I know some common words and phrases" },
  { id: "home_language", level: "A1", rating: 25, range: "A1–A2", label: "I mostly speak {language} at home" },
  { id: "basic_conversations", level: "A2", rating: 32, range: "A2", label: "I can have basic conversations" },
  { id: "read_write", level: "B1", rating: 53, range: "B1–B2", label: "I can comfortably read and write" },
  { id: "stories_opinions", level: "B1", rating: 53, range: "B1–B2", label: "I can tell stories and express my opinions" },
  { id: "grammar_struggle", level: "A1", rating: 18, range: "A1", modifier: true, label: "I struggle with grammar" },
  { id: "complex_topics", level: "B2", rating: 67, range: "B2–C1", label: "I can discuss complex topics in detail" },
  { id: "professional_use", level: "B2", rating: 67, range: "B2–C1", label: "I use {language} professionally or academically" },
  { id: "nuance_precision", level: "C1", rating: 81, range: "C1–C2", label: "I can express myself naturally, with nuance and precision" },
]);

export function estimateSelfReportedPlacement(selectedIds) {
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  const options = SELF_ASSESSMENT_OPTIONS.filter((option) => selected.has(option.id));
  if (options.length === 0) return null;
  const milestones = options.filter((option) => !option.modifier);
  const candidatePool = milestones.length > 0 ? milestones : options;
  const strongest = candidatePool
    .reduce((best, option) => option.rating > (best?.rating || 0) ? option : best, null);
  if (!strongest) return null;
  return { level: strongest.level, rating: strongest.rating, range: strongest.range };
}

// The placement conversation supplies six 1–10 rubric scores. Use them to
// choose a point inside its assessed CEFR band instead of assigning every
// Pre-A1 learner the same starting Score. A fully minimal rubric can earn 0.
export function scoreFromPlacementEvidence(level, rubricScores) {
  const normalizedLevel = normalizeEloLevel(level, "Pre-A1");
  const [floor, ceiling] = SCORE_LEVEL_BANDS[normalizedLevel];
  const values = ["pronunciation", "grammar", "vocabulary", "fluency", "confidence", "comprehension"]
    .map((key) => {
      const raw = rubricScores?.[key];
      const numeric = Number(typeof raw === "object" && raw !== null ? raw.score : raw);
      return Number.isFinite(numeric) && numeric >= 1 && numeric <= 10 ? numeric : null;
    })
    .filter((value) => value !== null);
  if (values.length < 4) return initialEloRating(normalizedLevel);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (normalizedLevel === "Pre-A1" && average <= 1.2) return 0;
  const estimated = floor + Math.round(((average - 1) / 9) * (ceiling - floor));
  return Math.max(normalizedLevel === "Pre-A1" ? 1 : floor, Math.min(ceiling, estimated));
}

export function seedPlacementElo(bucket = {}, { level, rating, source, selectedIds = [], now = new Date().toISOString() }) {
  const allowedRatings = new Set(SELF_ASSESSMENT_OPTIONS.map((option) => option.rating));
  const normalizedLevel = normalizeEloLevel(level, "Pre-A1");
  const [floor, ceiling] = SCORE_LEVEL_BANDS[normalizedLevel];
  const validTestRating = source === "placement_test" && rating != null && Number.isFinite(Number(rating))
    && Number(rating) >= floor && Number(rating) <= ceiling;
  const initialRating = (source === "completely_new" || source === "onboarding_baseline") && normalizedLevel === "Pre-A1"
    ? 0
    : source === "self_report" && allowedRatings.has(rating)
      ? rating
      : validTestRating
        ? Math.round(Number(rating))
        : initialEloRating(normalizedLevel);
  const selfAssessment = source === "self_report"
    ? { selectedIds: SELF_ASSESSMENT_OPTIONS.filter((option) => selectedIds.includes(option.id)).map((option) => option.id),
        estimatedLevel: level, estimatedRating: initialRating, updatedAt: now }
    : bucket.selfAssessment;
  if (Number(bucket.elo?.totalGraded) > 0) {
    return { ...bucket, ...(selfAssessment ? { selfAssessment } : {}) };
  }
  return {
    ...bucket,
    ...(selfAssessment ? { selfAssessment } : {}),
    elo: {
      ...bucket.elo,
      rating: scoreToElo(initialRating),
      scaleVersion: SCORE_SCALE_VERSION,
      totalGraded: 0,
      recentEventIds: bucket.elo?.recentEventIds || [],
      initializedFrom: source,
      updatedAt: now,
    },
  };
}
