import { CEFR_LEVELS } from "../data/flashcards/common.js";

export const INTRO_TUTORIAL_LESSON_ID = "lesson-tutorial-1";

const PRACTICE_CONTEXTS = {
  A1: "introducing yourself and sharing a few personal details",
  A2: "introducing yourself, describing your routine, and making a simple plan",
  B1: "introducing yourself through a past experience, a current interest, and an opinion",
  B2: "introducing yourself while explaining a viewpoint and weighing alternatives",
  C1: "introducing yourself with precise detail, nuance, and an appropriate register",
  C2: "introducing yourself with subtlety, stylistic range, and precise distinctions",
};

export function needsIntroTutorial({ level, lessons = {}, hasFirstQuestHistory = false }) {
  return Boolean(
    hasFirstQuestHistory &&
      PRACTICE_CONTEXTS[level] &&
      lessons?.[INTRO_TUTORIAL_LESSON_ID]?.status !== "completed",
  );
}

export function adaptIntroTutorialUnit(unit, level) {
  if (!unit?.isTutorial || !CEFR_LEVELS.includes(level) || level === "Pre-A1") {
    return unit;
  }
  const context = PRACTICE_CONTEXTS[level];
  if (!context) return unit;

  const lesson = unit.lessons.find((entry) => entry.id === INTRO_TUTORIAL_LESSON_ID);
  if (!lesson) return unit;
  const topic = context;
  const focusPoints = [context, "a relevant personal detail", "a natural follow-up question"];
  const content = Object.fromEntries(
    Object.entries(lesson.content || {}).map(([mode, block]) => [
      mode,
      {
        ...Object.fromEntries(
          Object.entries(block).filter(([key]) =>
            key !== "tutorialDescription" && !key.startsWith("successCriteria_"),
          ),
        ),
        topic: mode === "game" ? "tutorial" : topic,
        cefrLevel: level,
        tutorialPracticeLevel: level,
        focusPoints,
        tutorialDescription: {
          en: `Try ${mode} with material suited to CEFR ${level}.`,
          es: `Prueba ${mode} con contenido de nivel ${level}.`,
        },
        ...(mode === "reading"
          ? { prompt: `Write a short first reading encounter about ${context}, at CEFR ${level}.` }
          : {}),
        ...(mode === "stories"
          ? { prompt: `A short interactive story about ${context}, at CEFR ${level}.` }
          : {}),
        ...(mode === "realtime"
          ? {
              scenario: `A short conversation about ${context}`,
              prompt: `Help the learner practice ${context} in the target language at CEFR ${level}.`,
              successCriteria: `The learner communicates about ${context} at CEFR ${level}.`,
            }
          : {}),
        ...(mode === "game"
          ? {
              unitTitle: "Getting Started",
              sceneId: "tutorialPlaza",
              scenario: context,
            }
          : {}),
      },
    ]),
  );
  const agenda = {
    version: 1,
    items: lesson.modes.map((mode) => ({
      id: `adaptive-tutorial-${level.toLowerCase()}-${mode}`,
      kind: mode === "reading" ? "comprehension" : mode,
      modes: [mode],
      label: { en: `Explore ${mode} at ${level}`, es: `Explora ${mode} en ${level}` },
      goal: `Practice ${context} at CEFR ${level} while learning how ${mode} works.`,
      targetConcept: context,
      targetRole: "goal",
      targetForms: [],
      evidence: {
        type: "produce_or_choose",
        criteria: `Completes the ${mode} introduction using CEFR ${level} language`,
      },
      source: "adaptive-tutorial",
    })),
  };
  return {
    ...unit,
    cefrLevel: level,
    lessons: unit.lessons.map((entry) =>
      entry.id === INTRO_TUTORIAL_LESSON_ID
        ? {
            ...entry,
            cefrLevel: level,
            tutorialPracticeLevel: level,
            description: {
              en: `Explore every lesson activity while practicing ${context}.`,
              es: `Explora todas las actividades con contenido de nivel ${level}.`,
            },
            content,
            agenda,
            objectives: {
              cefrLevel: level,
              communicativeObjectives: [
                `Communicate about ${context} at CEFR ${level}.`,
                "Explore vocabulary, grammar, reading, stories, speaking, and game practice.",
              ],
              successCriteria: [
                `Complete the introductory activities using language appropriate to CEFR ${level}.`,
              ],
            },
            communicativeFocus: {
              function: `Communicate about ${context}`,
              discourseSkills: [context],
              scenario: `Explore the app's lesson activities at CEFR ${level}.`,
            },
          }
        : entry,
    ),
  };
}
