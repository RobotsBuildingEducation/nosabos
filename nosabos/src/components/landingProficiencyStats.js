// Snapshot of the delivered learning paths (including review lessons), not
// just the raw authored units. The test compares this with the course loaders
// so adding curriculum cannot silently leave the landing-page counts stale.
// Keep the large curriculum chunks off the public landing-page bundle.
export const LANDING_STANDALONE_PRACTICE_MODES = ["flashcards", "tutor", "phonics"];

export const LANDING_PROFICIENCY_STATS = Object.freeze({
  modules: 90,
  lessonReviews: 625,
  modes: 9,
  vocabularyCards: 1150,
});

export const LANDING_PROFICIENCY_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
