/**
 * Identifies views in the skill tree scene that retain the full, standard
 * bottom navigation bar rather than being treated as question activities.
 *
 * Daily Quest ("plate"), Cards ("flashcards"), and Lessons skill tree ("path")
 * are browse/navigation/overview surfaces. Phonics ("alphabet"), Conversations,
 * and Tutor are interactive activities that mount their own QuestionActionArea.
 */
export function isFullNavigationSkillTreeMode(viewMode, pathMode) {
  if (viewMode !== "skillTree") return false;
  return (
    pathMode === "plate" || pathMode === "flashcards" || pathMode === "path"
  );
}
