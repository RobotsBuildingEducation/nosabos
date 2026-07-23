export const TUTOR_LESSON_LAUNCH_MODE = Object.freeze({
  VOICE: "voice",
  RPG_GAME: "rpg_game",
});

export function getTutorLessonLaunchMode(lesson) {
  if (
    lesson?.tutorPurpose === TUTOR_LESSON_LAUNCH_MODE.RPG_GAME ||
    lesson?.isGame === true ||
    lesson?.modes?.includes?.("game")
  ) {
    return TUTOR_LESSON_LAUNCH_MODE.RPG_GAME;
  }
  return TUTOR_LESSON_LAUNCH_MODE.VOICE;
}
