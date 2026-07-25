// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
// Keep the transformation pipeline byte-for-byte aligned with the aggregate
// curriculum while allowing the app to import one raw CEFR level at a time.
import { withItalianSkillTreeText } from "./skillTree/italianLocalizer.js";
import { withFrenchSkillTreeText } from "./skillTree/frenchLocalizer.js";
import {
  translateSkillTreeTextToHindi,
  withHindiSkillTreeText,
} from "./skillTree/hindiLocalizer.js";
import { withJapaneseSkillTreeText } from "./skillTree/japaneseLocalizer.js";
import { withPortugueseSkillTreeText } from "./skillTree/portugueseLocalizer.js";
import { withArabicSkillTreeText } from "./skillTree/arabicLocalizer.js";
import { withChineseSkillTreeText } from "./skillTree/chineseLocalizer.js";
import { withGermanSkillTreeText } from "./skillTree/germanLocalizer.js";
import { tagGameLessonContent } from "../components/RPGGame/content/buckets.js";
import {
  applyAuthoredTargetCurriculum,
  buildUnitCurriculumSnapshot,
  withCanonicalLessonAgenda,
} from "../utils/lessonCurriculum.js";
import { withCurriculumRepairSupportText } from "./skillTree/curriculumRepairSupportText.js";


const withLocalizedSkillTreeText = (skillTree) =>
  withCurriculumRepairSupportText(withArabicSkillTreeText(
    withChineseSkillTreeText(
      withHindiSkillTreeText(
        withJapaneseSkillTreeText(
          withFrenchSkillTreeText(
            withGermanSkillTreeText(
              withItalianSkillTreeText(withPortugueseSkillTreeText(skillTree)),
            ),
          ),
        ),
      ),
    ),
  ));


const LESSON_XP_RANGE = { min: 55, max: 80 };
const LESSON_XP_STEP = 5;
const STARTER_LESSON_XP_REQUIRED = 50;
const STARTER_LESSON_IDS = new Set(["lesson-tutorial-1", "lesson-tutorial-a1"]);

/**
 * Assign a deterministic pseudo-random XP reward to each regular lesson so
 * that it requires between 55-80 XP to complete in increments of 5. Starter
 * Tutor lessons are intentionally shorter at 50 XP.
 */
function applyLessonXPSchedule(lessons) {
  return lessons.map((lesson) => ({
    ...lesson,
    xpReward: getLessonXpReward(lesson.id),
  }));
}

function getLessonXpReward(lessonId = "") {
  const normalized = lessonId || "lesson";
  if (STARTER_LESSON_IDS.has(normalized)) return STARTER_LESSON_XP_REQUIRED;

  let hash = 0;

  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  const rewardOptions =
    Math.floor((LESSON_XP_RANGE.max - LESSON_XP_RANGE.min) / LESSON_XP_STEP) +
    1;
  return (hash % rewardOptions) * LESSON_XP_STEP + LESSON_XP_RANGE.min;
}

const SUB_LEVEL_SEGMENTS = {
  "Pre-A1": ["Pre-A1.1", "Pre-A1.2"],
  A1: ["A1.1", "A1.2", "A1.3"],
  A2: ["A2.1", "A2.2", "A2.3"],
  B1: ["B1.1", "B1.2", "B1.3"],
  B2: ["B2.1", "B2.2", "B2.3"],
  C1: ["C1.1", "C1.2", "C1.3"],
  C2: ["C2.1", "C2.2", "C2.3"],
};

const CEFR_LEVEL_PROFILES = {
  "Pre-A1": {
    interaction: "recognize and respond to isolated words and phrases",
    production: "produce single words and memorized chunks",
    mediation: "point to or repeat key words when helping others",
    accuracy: "use memorized single words with basic pronunciation",
    discourseSkills: ["word recognition", "single-word responses"],
  },
  A1: {
    interaction: "exchange short, formulaic turns",
    production: "share personal details and immediate needs",
    mediation: "relay single facts or key words",
    accuracy: "use memorized phrases with understandable pronunciation",
    discourseSkills: ["turn-taking", "formulaic exchanges"],
  },
  A2: {
    interaction: "handle simple transactions and social routines",
    production: "describe familiar topics in short phrases",
    mediation: "summarize main points of brief messages",
    accuracy: "combine rehearsed sentences with basic connectors",
    discourseSkills: ["connected phrases", "short descriptions"],
  },
  B1: {
    interaction: "sustain conversations about experiences and plans",
    production: "narrate events and explain opinions",
    mediation: "relay key details from longer texts or dialogue",
    accuracy: "use past and future frames with emerging control",
    discourseSkills: ["narration", "linking devices", "reformulation"],
  },
  B2: {
    interaction: "negotiate viewpoints and manage breakdowns",
    production: "develop arguments with supporting detail",
    mediation: "summarize and compare sources or positions",
    accuracy: "use complex clauses with generally consistent control",
    discourseSkills: ["argumentation", "clarification", "hedging"],
  },
  C1: {
    interaction: "lead discussions with nuanced register control",
    production: "deliver structured analyses and persuasive discourse",
    mediation: "reframe ideas for different audiences",
    accuracy: "maintain natural flow with precise vocabulary",
    discourseSkills: ["synthesizing", "stance-taking", "register shifts"],
  },
  C2: {
    interaction: "switch effortlessly across formal and informal contexts",
    production: "craft subtle argumentation and stylistic effects",
    mediation: "mediate complex content, positions, or emotions",
    accuracy: "demonstrate near-native control and nuance",
    discourseSkills: [
      "stylistic control",
      "idiomatic range",
      "critical response",
    ],
  },
};

const ADVANCED_MODES = {
  B1: ["listening", "writing"],
  B2: ["listening", "writing", "mediation"],
  C1: ["listening", "writing", "mediation"],
  C2: ["listening", "writing", "mediation"],
};

const ALLOWED_MODULES = new Set([
  "vocabulary",
  "grammar",
  "stories",
  "reading",
  "realtime",
]);

const FUNCTIONAL_PROMPTS = {
  listening: (topic, levelLabel) =>
    `Interpret authentic audio about ${topic} and capture the main points (${levelLabel})`,
  writing: (topic, levelLabel) =>
    `Write a short response that applies the lesson topic to a real scenario (${levelLabel})`,
  mediation: (topic, levelLabel) =>
    `Bridge information about ${topic} for someone with less background knowledge (${levelLabel})`,
};

function deriveLessonTopic(unit, lesson) {
  return (
    lesson.content?.vocabulary?.topic ||
    lesson.content?.grammar?.topic ||
    unit.title?.en ||
    lesson.title?.en ||
    "lesson focus"
  );
}

function addSupplementalLessons(level, unit) {
  const lessons = unit.lessons || [];

  // Skip supplemental lessons for tutorial units
  if (unit.isTutorial) {
    return lessons;
  }

  const nonQuizLessons = lessons.filter((lesson) => !lesson.isFinalQuiz);
  const maxNonQuizXp = Math.max(
    ...nonQuizLessons.map((lesson) => lesson.xpRequired || 0),
    0,
  );
  const xpStep = 15;
  const topic = unit.title?.en || unit.description?.en || "unit theme";

  const supplementalLessons = [
    {
      id: `${unit.id}-skill-builder`,
      title: {
        en: `${unit.title?.en || "Unit"} Skill Builder`,
        es: `Refuerzo de ${unit.title?.es || unit.title?.en || "Unidad"}`,
      },
      description: {
        en: "Short targeted drills to consolidate the unit language before the quiz.",
        es: "Ejercicios breves para consolidar el lenguaje de la unidad antes del cuestionario.",
      },
      xpRequired: maxNonQuizXp + xpStep,
      xpReward: 35,
      tutorPurpose: "targeted_review",
      modes: ["grammar", "vocabulary"],
      content: {
        grammar: {
          topic,
          prompt: `Recycle the concrete grammar objectives taught earlier in ${topic} using short, targeted drills.`,
        },
        vocabulary: {
          topic,
          prompt: `Cycle through quick recall of ${topic} phrases before applying them.`,
        },
      },
      cefrStage: level,
      pathway: "granularity",
    },
    {
      id: `${unit.id}-integrated-practice`,
      title: {
        en: `${unit.title?.en || "Unit"} Integrated Practice`,
        es: `Práctica integrada de ${
          unit.title?.es || unit.title?.en || "Unidad"
        }`,
      },
      description: {
        en: "Link vocabulary and grammar from the unit in a guided scenario.",
        es: "Vincula vocabulario y gramática de la unidad en un escenario guiado.",
      },
      xpRequired: maxNonQuizXp + xpStep * 2,
      xpReward: 60,
      tutorPurpose: "integrated_scenario",
      modes: ["realtime", "reading", "stories"],
      content: {
        realtime: generateIntegratedPracticeGoal(topic, unit, lessons),
        reading: {
          topic,
          prompt: `Interpret scaffolded prompts about ${topic} before responding live.`,
        },
        stories: {
          topic,
          prompt: `Follow a mini scenario that blends the unit's core language for ${topic}.`,
        },
      },
      cefrStage: level,
      pathway: "granularity",
    },
  ];

  const quizIndex = lessons.findIndex((lesson) => lesson.isFinalQuiz);

  if (quizIndex === -1) {
    return [...lessons, ...supplementalLessons];
  }

  const quizLesson = lessons[quizIndex];
  const minQuizXp = maxNonQuizXp + xpStep * (supplementalLessons.length + 1);
  const updatedQuiz = {
    ...quizLesson,
    xpRequired: Math.max(quizLesson.xpRequired || 0, minQuizXp),
  };

  const coreLessons = lessons.filter((lesson) => !lesson.isFinalQuiz);
  const trailingLessons = lessons.slice(quizIndex + 1);

  return [
    ...coreLessons,
    ...supplementalLessons,
    updatedQuiz,
    ...trailingLessons,
  ];
}

function buildLessonObjectives(level, unit, lesson) {
  const profile = CEFR_LEVEL_PROFILES[level] || CEFR_LEVEL_PROFILES.A1;
  const topic = deriveLessonTopic(unit, lesson);
  const baseAssessment = lesson.isFinalQuiz
    ? `Meet the ${
        lesson.title?.en || "lesson"
      } pass criteria to show readiness for the next sub-stage.`
    : `Complete guided practice showing control of ${topic} in ${
        lesson.modes?.join(", ") || "core"
      } tasks.`;

  return {
    cefrLevel: level,
    communicativeObjectives: [
      `Can ${profile.interaction} when discussing ${topic}.`,
      `Can ${
        profile.production
      } while keeping conversation aligned to ${unit.title?.en?.toLowerCase()}.`,
      `Can ${profile.mediation} related to ${topic} when peers need support.`,
    ],
    successCriteria: [
      `Uses lesson language to ${profile.interaction} with ${profile.accuracy}.`,
      `Shows ${
        profile.discourseSkills.join(", ") || "connected speech"
      } across ${lesson.modes?.length || 1} activity modes.`,
      baseAssessment,
    ],
  };
}

function appendAdvancedModes(level, lesson, unit) {
  const additions = ADVANCED_MODES[level];
  if (!additions) return lesson;

  const topic = deriveLessonTopic(unit, lesson);
  const advancedTasks = additions.map((mode) => ({
    mode,
    topic,
    prompt:
      FUNCTIONAL_PROMPTS[mode]?.(topic, level) ||
      `Apply ${topic} in a ${mode} task for level ${level}.`,
  }));

  return {
    ...lesson,
    advancedTasks: [...(lesson.advancedTasks || []), ...advancedTasks],
  };
}

/**
 * Maps topics to specific, actionable realtime conversation goals.
 * Each goal includes:
 * - scenario: A clear task the user should accomplish
 * - prompt: Roleplay context for the AI tutor
 * - successCriteria: What counts as completing the goal (for evaluation)
 */
const REALTIME_GOAL_TEMPLATES = {
  // Pre-A1 / A1 topics
  "greetings and starters": {
    scenario: "Greet someone and say goodbye",
    prompt:
      "Roleplay meeting someone new. Greet them, exchange pleasantries, and say goodbye.",
    successCriteria: "User greets appropriately and uses a farewell expression",
  },
  "people and places": {
    scenario: "Introduce yourself and say where you're from",
    prompt:
      "Ask the learner where they're from and about their family. Have them introduce a family member.",
    successCriteria:
      "User states their name, origin, or introduces a person using 'This is...' or similar",
  },
  "actions and needs": {
    scenario: "Ask for help or make a simple request",
    prompt:
      "Roleplay a situation where the learner needs to ask for something (directions, help, or an item).",
    successCriteria: "User makes a clear request using appropriate verb forms",
  },
  "time and movement": {
    scenario: "Ask what time it is or for directions",
    prompt:
      "The learner needs to find out the time or get directions to somewhere nearby.",
    successCriteria: "User asks about time or directions using question words",
  },
  "social expressions": {
    scenario: "Use polite phrases in a conversation",
    prompt:
      "Have a brief polite exchange - the learner should use thank you, please, excuse me, or sorry.",
    successCriteria:
      "User uses at least one polite expression naturally in context",
  },
  greetings: {
    scenario: "Greet someone appropriately for the time of day",
    prompt:
      "Meet the learner at different times and have them greet you appropriately.",
    successCriteria:
      "User uses appropriate greeting for context (morning/afternoon/evening)",
  },
  introductions: {
    scenario: "Introduce yourself with your name and one fact",
    prompt:
      "Ask the learner to introduce themselves. Prompt for their name and something about them.",
    successCriteria:
      "User states their name and shares at least one personal detail",
  },
  numbers: {
    scenario: "Give your phone number or age",
    prompt:
      "Ask the learner for their phone number, age, or address number in conversation.",
    successCriteria: "User correctly produces numbers in the target language",
  },
  "days of week": {
    scenario: "Make plans for a specific day",
    prompt:
      "Invite the learner to do something and have them suggest or confirm a day.",
    successCriteria: "User correctly names a day of the week in context",
  },
  "time expressions": {
    scenario: "Say when you do something daily",
    prompt:
      "Ask the learner about their daily routine - when they wake up, eat, or work.",
    successCriteria: "User expresses time of day or routine timing",
  },
  time: {
    scenario: "Tell someone the current time",
    prompt:
      "Ask the learner what time it is now or what time they do certain activities.",
    successCriteria: "User correctly states a time using appropriate format",
  },
  family: {
    scenario: "Describe your family members",
    prompt:
      "Ask the learner about their family. Who do they live with? Siblings?",
    successCriteria: "User names family members and describes a relationship",
  },
  colors: {
    scenario: "Describe what color something is",
    prompt:
      "Point out objects and ask the learner what color they are or what their favorite color is.",
    successCriteria: "User correctly uses color vocabulary",
  },
  food: {
    scenario: "Order food or say what you like to eat",
    prompt:
      "Roleplay a café scene. Ask what the learner wants to eat or drink.",
    successCriteria: "User orders or expresses food preference",
  },
  clothing: {
    scenario: "Describe what you're wearing",
    prompt:
      "Ask the learner what they're wearing today or what they like to wear.",
    successCriteria: "User describes clothing items",
  },
  // A2 topics
  "daily activities": {
    scenario: "Describe your morning routine",
    prompt:
      "Ask about the learner's typical day. What do they do in the morning?",
    successCriteria: "User describes at least two daily activities in sequence",
  },
  weather: {
    scenario: "Talk about today's weather",
    prompt:
      "Discuss the current weather and ask what the learner likes to do in this weather.",
    successCriteria: "User describes weather conditions",
  },
  preferences: {
    scenario: "Say what you like and dislike",
    prompt:
      "Ask the learner about their preferences in food, activities, or music.",
    successCriteria:
      "User expresses a preference using like/dislike structures",
  },
  "question words": {
    scenario: "Ask three questions about someone",
    prompt:
      "The learner should ask you questions to learn about you (who, what, where, when, why).",
    successCriteria: "User asks at least two questions using question words",
  },
  "physical descriptions": {
    scenario: "Describe a person's appearance",
    prompt:
      "Ask the learner to describe someone they know - what do they look like?",
    successCriteria: "User uses adjectives to describe physical appearance",
  },
  places: {
    scenario: "Give directions to a nearby place",
    prompt:
      "The learner is lost. Have them ask for or give directions to a location.",
    successCriteria:
      "User uses directional vocabulary or location prepositions",
  },
  shopping: {
    scenario: "Ask for a price and buy something",
    prompt: "Roleplay a shop scene. The learner wants to buy something.",
    successCriteria: "User asks price and completes a basic transaction",
  },
  transportation: {
    scenario: "Ask about bus or train schedules",
    prompt:
      "The learner needs to take public transport. Have them ask about times/platforms.",
    successCriteria: "User asks about transportation times or locations",
  },
  directions: {
    scenario: "Ask how to get somewhere",
    prompt:
      "The learner needs to find a place. Have them ask for and understand directions.",
    successCriteria: "User asks for directions using appropriate phrases",
  },
  // B1+ topics
  arts: {
    scenario: "Recommend a movie or book you enjoyed",
    prompt:
      "Discuss entertainment. Ask the learner to recommend something and explain why.",
    successCriteria: "User recommends something with a reason",
  },
  sports: {
    scenario: "Talk about your favorite sport or exercise",
    prompt:
      "Discuss sports and fitness. What does the learner do to stay active?",
    successCriteria: "User discusses sports/exercise with relevant vocabulary",
  },
  health: {
    scenario: "Describe how you're feeling today",
    prompt:
      "Check in on the learner's health. How are they feeling? Any concerns?",
    successCriteria: "User describes physical or emotional state",
  },
  careers: {
    scenario: "Describe your job or dream career",
    prompt: "Discuss work and careers. What does the learner do or want to do?",
    successCriteria:
      "User describes work responsibilities or career aspirations",
  },
  education: {
    scenario: "Talk about your studies or learning goals",
    prompt:
      "Discuss education. What is the learner studying? What do they want to learn?",
    successCriteria: "User discusses educational experiences or goals",
  },
  comparisons: {
    scenario: "Compare two things and give your opinion",
    prompt:
      "Present two options to the learner and have them compare and choose.",
    successCriteria: "User uses comparative structures correctly",
  },
  travel: {
    scenario: "Describe a trip you took or want to take",
    prompt:
      "Discuss travel experiences or plans. Where has/would the learner go?",
    successCriteria: "User describes travel using past or conditional forms",
  },
  culture: {
    scenario: "Explain a tradition from your culture",
    prompt:
      "Discuss cultural practices. What traditions does the learner's culture have?",
    successCriteria: "User explains a cultural practice or tradition",
  },
  // Advanced topics
  "abstract ideas": {
    scenario: "Explain your opinion on a topic",
    prompt:
      "Discuss a current topic or idea. Ask the learner to explain their viewpoint.",
    successCriteria: "User presents an opinion with supporting reasoning",
  },
  emotions: {
    scenario: "Describe a time you felt a strong emotion",
    prompt:
      "Discuss feelings and experiences. When did the learner feel happy/sad/excited?",
    successCriteria:
      "User describes emotional experience with appropriate vocabulary",
  },
  "future plans": {
    scenario: "Talk about your goals for next year",
    prompt:
      "Discuss plans and aspirations. What does the learner want to achieve?",
    successCriteria: "User expresses future plans using appropriate tenses",
  },
  environment: {
    scenario: "Discuss an environmental issue",
    prompt:
      "Talk about environmental topics. What concerns does the learner have?",
    successCriteria:
      "User discusses environmental topic with relevant vocabulary",
  },
  technology: {
    scenario: "Explain how you use technology daily",
    prompt:
      "Discuss technology use. How does technology affect the learner's life?",
    successCriteria: "User describes technology use with specific examples",
  },
};

/**
 * Generates an actionable realtime goal based on topic and lesson focusPoints.
 * Includes goal variations for multiple sessions.
 */
function generateActionableRealtimeGoal(topicLabel, lesson) {
  const topicKey = topicLabel.toLowerCase();
  const template = REALTIME_GOAL_TEMPLATES[topicKey];

  // Get focusPoints from vocabulary or grammar content for additional context
  const vocabFocus = lesson?.content?.vocabulary?.focusPoints || [];
  const grammarFocus = lesson?.content?.grammar?.focusPoints || [];
  const allFocus = [...vocabFocus, ...grammarFocus].filter(Boolean);

  if (template) {
    // Generate variations based on the base template
    const goalVariations = generateGoalVariations(
      template,
      topicLabel,
      allFocus,
    );

    return {
      ...withGoalUiLocalizations(
        {
          scenario: template.scenario,
          prompt: template.prompt,
          successCriteria: template.successCriteria,
        },
        topicLabel,
      ),
      focusPoints: allFocus,
      goalVariations: goalVariations,
      goalIndex: 0,
    };
  }

  // Generate a reasonable default based on available focusPoints
  if (allFocus.length > 0) {
    const firstFocus = allFocus[0];
    const baseGoal = {
      scenario: `Practice using ${firstFocus} in conversation`,
      prompt: `Have a natural conversation where the learner practices ${topicLabel}. Focus on: ${allFocus.join(
        ", ",
      )}.`,
      successCriteria: `User demonstrates use of ${firstFocus} in context`,
    };

    // Create variations for focus points
    const variations = [
      withGoalUiLocalizations(baseGoal, topicLabel, firstFocus),
    ];
    allFocus.slice(1, 3).forEach((focus) => {
      variations.push(
        withGoalUiLocalizations(
          {
            scenario: `Practice ${focus} in a real situation`,
            prompt: `Create a situation where the learner must use ${focus}. Ask follow-up questions.`,
            successCriteria: `User uses ${focus} correctly in context`,
          },
          topicLabel,
          focus,
        ),
      );
    });

    return {
      ...withGoalUiLocalizations(baseGoal, topicLabel, firstFocus),
      focusPoints: allFocus,
      goalVariations: variations,
      goalIndex: 0,
    };
  }

  // Final fallback - still more specific than before
  return {
    ...withGoalUiLocalizations(
      {
        scenario: `Have a conversation about ${topicLabel}`,
        prompt: `Engage the learner in a natural conversation about ${topicLabel}. Ask questions and encourage responses.`,
        successCriteria: `User participates meaningfully in conversation about ${topicLabel}`,
      },
      topicLabel,
    ),
    focusPoints: [],
    goalVariations: [],
    goalIndex: 0,
  };
}

/**
 * Generates goal variations from a base template for progression through multiple sessions.
 */
function translateGoalTextToEs(text, topicLabel, focus) {
  if (!text) return "";
  const t = text.toLowerCase();
  const topic = topicLabel || focus || "";
  const focusTerm = focus || topicLabel || "";

  const matches = [
    {
      test: (s) => s.includes("answer questions about"),
      build: () => `Responde preguntas sobre ${topic}`,
    },
    {
      test: (s) => s.includes("start a conversation about"),
      build: () => `Inicia una conversación sobre ${topic}`,
    },
    {
      test: (s) => s.includes("use") && s.includes("real situation"),
      build: () => `Usa ${focusTerm} en una situación real`,
    },
    {
      test: (s) => s.includes("demonstrates correct use"),
      build: () => `El usuario demuestra el uso correcto de ${focusTerm}`,
    },
    {
      test: (s) => s.includes("answers questions using"),
      build: () =>
        `El usuario responde preguntas usando vocabulario de ${topic} correctamente`,
    },
    {
      test: (s) => s.includes("initiates and sustains conversation"),
      build: () =>
        `El usuario inicia y mantiene una conversación sobre ${topic}`,
    },
  ];

  const hit = matches.find((m) => m.test(t));
  return hit ? hit.build() : text;
}

function translateGoalTextToHi(text) {
  if (!text) return "";
  return translateSkillTreeTextToHindi(text);
}

function withGoalUiLocalizations(goal, topicLabel, focus) {
  if (!goal) return goal;
  return {
    ...goal,
    scenario_es:
      goal.scenario_es ||
      translateGoalTextToEs(goal.scenario, topicLabel, focus),
    scenario_hi: goal.scenario_hi || translateGoalTextToHi(goal.scenario),
    successCriteria_es:
      goal.successCriteria_es ||
      translateGoalTextToEs(goal.successCriteria, topicLabel, focus),
    successCriteria_hi:
      goal.successCriteria_hi || translateGoalTextToHi(goal.successCriteria),
  };
}

function generateGoalVariations(baseTemplate, topicLabel, focusPoints = []) {
  const variations = [
    withGoalUiLocalizations(
      {
        scenario: baseTemplate.scenario,
        prompt: baseTemplate.prompt,
        prompt_es: translateGoalTextToEs(baseTemplate.prompt, topicLabel),
        successCriteria: baseTemplate.successCriteria,
      },
      topicLabel,
    ),
  ];

  // Add "respond to questions" variation
  variations.push(
    withGoalUiLocalizations(
      {
        scenario: `Answer questions about ${topicLabel}`,
        prompt: `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
        prompt_es: translateGoalTextToEs(
          `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
          topicLabel,
        ),
        successCriteria: `User answers questions using ${topicLabel} vocabulary correctly`,
      },
      topicLabel,
    ),
  );

  // Add "start a conversation" variation
  variations.push(
    withGoalUiLocalizations(
      {
        scenario: `Start a conversation about ${topicLabel}`,
        prompt: `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
        prompt_es: translateGoalTextToEs(
          `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
          topicLabel,
        ),
        successCriteria: `User initiates and sustains conversation about ${topicLabel}`,
      },
      topicLabel,
    ),
  );

  // Add focus-point specific variations if available
  if (focusPoints.length > 0) {
    variations.push(
      withGoalUiLocalizations(
        {
          scenario: `Use ${focusPoints[0]} in a real situation`,
          prompt: `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
          prompt_es: translateGoalTextToEs(
            `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
            topicLabel,
            focusPoints[0],
          ),
          successCriteria: `User demonstrates correct use of ${focusPoints[0]}`,
        },
        topicLabel,
        focusPoints[0],
      ),
    );
  }

  return variations;
}

/**
 * Generates integrated practice goals that combine multiple unit topics.
 * Creates specific, actionable roleplay scenarios based on actual lesson content.
 */
function generateIntegratedPracticeGoal(topic, unit, lessons = []) {
  // Collect lesson titles and topics from unit lessons
  const lessonTitles = [];
  const lessonDescriptions = [];

  lessons.forEach((lesson) => {
    // Skip quiz and supplemental lessons
    if (lesson.isFinalQuiz || lesson.id?.includes("integrated-practice")) {
      return;
    }
    if (lesson.title?.en) {
      lessonTitles.push(lesson.title.en);
    }
    if (lesson.description?.en) {
      lessonDescriptions.push(lesson.description.en);
    }
  });

  const topicKey = topic.toLowerCase();
  const unitTitle = unit?.title?.en || topic;

  // Create varied goals - prioritize topic-specific templates
  const goalVariations = [];

  // First, check for topic-specific templates - these are handcrafted and best
  const topicSpecificGoals = INTEGRATED_PRACTICE_TEMPLATES[topicKey];
  if (topicSpecificGoals && topicSpecificGoals.length > 0) {
    goalVariations.push(
      ...topicSpecificGoals.map((goal) =>
        withGoalUiLocalizations(goal, unitTitle),
      ),
    );
  }

  // Generate creative roleplay scenarios based on the unit topic
  // These should be specific actions, not abstract concepts
  const creativeGoals = generateCreativeGoalsForTopic(
    topicKey,
    unitTitle,
    lessonTitles,
  );
  goalVariations.push(
    ...creativeGoals.map((goal) => withGoalUiLocalizations(goal, unitTitle)),
  );

  // Ensure we have at least one goal
  if (goalVariations.length === 0) {
    goalVariations.push(
      withGoalUiLocalizations(
        {
          scenario: `Have a conversation about ${unitTitle}`,
          prompt: `Start a natural conversation about ${unitTitle}. Ask the learner questions and respond to their answers. Build on what they say.`,
          successCriteria: `User participates actively in a conversation about ${unitTitle}`,
        },
        unitTitle,
      ),
    );
  }

  // Return first goal as default, with variations array for progression
  return {
    ...goalVariations[0],
    lessonTitles: lessonTitles.slice(0, 5),
    goalVariations: goalVariations,
    goalIndex: 0,
  };
}

/**
 * Generate creative, actionable roleplay goals based on topic
 * These are specific scenarios, not abstract "use X and Y together"
 */
function generateCreativeGoalsForTopic(topicKey, unitTitle, lessonTitles) {
  const goals = [];

  // Map topics to creative roleplay scenarios
  const topicScenarios = {
    transportation: [
      {
        scenario: "Buy a bus ticket to the city center",
        prompt:
          "You work at a bus station. The learner needs to buy a ticket. Ask where they want to go, tell them the price, and give them departure information.",
        successCriteria:
          "User asks for a ticket, understands the price, and confirms their trip details",
      },
      {
        scenario: "Ask a stranger for directions to the train station",
        prompt:
          "The learner is lost and needs to find the train station. Give them directions using landmarks and transportation vocabulary.",
        successCriteria:
          "User asks for directions and confirms they understand how to get there",
      },
      {
        scenario: "Explain your daily commute to a new coworker",
        prompt:
          "You are a new coworker asking about how to get to work. Ask the learner what transportation they use, how long it takes, and any tips.",
        successCriteria:
          "User describes their commute with transportation type, duration, and route details",
      },
    ],
    greetings: [
      {
        scenario: "Meet a friend's parent for the first time",
        prompt:
          "You are your friend's parent meeting the learner. Have a polite greeting exchange - introductions, pleasantries, and small talk.",
        successCriteria:
          "User greets politely, introduces themselves, and responds appropriately to questions",
      },
    ],
    food: [
      {
        scenario: "Order breakfast at a café",
        prompt:
          "You are a waiter at a café. Take the learner's breakfast order - ask what they want to eat and drink, suggest items, and confirm the order.",
        successCriteria:
          "User orders food and drink items and responds to your suggestions",
      },
      {
        scenario: "Recommend a restaurant to a tourist",
        prompt:
          "You are a tourist asking for restaurant recommendations. Ask the learner about good places to eat, what kind of food they serve, and how to get there.",
        successCriteria:
          "User recommends a place and describes the food and location",
      },
    ],
    numbers: [
      {
        scenario: "Exchange phone numbers with a new friend",
        prompt:
          "You just met the learner and want to stay in touch. Exchange phone numbers - ask for theirs, give yours, and confirm you got it right.",
        successCriteria:
          "User gives their phone number clearly and confirms they wrote down yours correctly",
      },
    ],
    family: [
      {
        scenario: "Show photos of your family to a friend",
        prompt:
          "Ask the learner to describe their family as if showing you photos. Ask about names, ages, relationships, and what each person is like.",
        successCriteria:
          "User describes multiple family members with names and at least one detail about each",
      },
    ],
    places: [
      {
        scenario: "Recommend your favorite spot in the city",
        prompt:
          "You are new to the city and looking for good places to visit. Ask the learner for recommendations - what's there, why they like it, how to get there.",
        successCriteria:
          "User recommends a specific place with description and directions",
      },
    ],
    shopping: [
      {
        scenario: "Return an item that doesn't fit",
        prompt:
          "You work at a clothing store. The learner wants to return or exchange something. Ask what's wrong with it and help them find a solution.",
        successCriteria:
          "User explains the problem and successfully completes the return/exchange",
      },
    ],
    time: [
      {
        scenario: "Make plans to meet a friend this weekend",
        prompt:
          "You want to meet up with the learner this weekend. Discuss when you're both free, what time works, and what you'll do together.",
        successCriteria:
          "User discusses availability using time expressions and agrees on a specific time to meet",
      },
    ],
    weather: [
      {
        scenario: "Decide what to do today based on the weather",
        prompt:
          "Discuss today's weather with the learner and make plans together. Talk about what the weather is like and what activities would be good or bad for it.",
        successCriteria:
          "User describes the weather and suggests appropriate activities",
      },
    ],
    work: [
      {
        scenario: "Tell a new acquaintance about your job",
        prompt:
          "You just met the learner at a party. Ask about their work - what they do, where they work, if they like it, and what a typical day is like.",
        successCriteria:
          "User describes their job with at least 3 details (role, place, activities, or opinions)",
      },
    ],
    health: [
      {
        scenario: "Describe your symptoms to a pharmacist",
        prompt:
          "You work at a pharmacy. The learner doesn't feel well. Ask about their symptoms, how long they've had them, and recommend something to help.",
        successCriteria:
          "User describes symptoms clearly and responds to your recommendations",
      },
    ],
    hobbies: [
      {
        scenario: "Invite someone to join your hobby",
        prompt:
          "Ask the learner about their hobbies, then have them try to convince you to try their favorite hobby. Ask questions about what it involves and why they enjoy it.",
        successCriteria:
          "User describes their hobby in detail and explains why you should try it",
      },
    ],
  };

  // Find matching scenarios for this topic
  for (const [key, scenarios] of Object.entries(topicScenarios)) {
    if (topicKey.includes(key) || key.includes(topicKey)) {
      goals.push(...scenarios);
      break;
    }
  }

  // If we found topic-specific goals, add a synthesis goal using lesson titles
  if (goals.length > 0 && lessonTitles.length >= 2) {
    goals.push({
      scenario: `Combine: ${lessonTitles[0]} and ${lessonTitles[1]}`,
      prompt: `Create a realistic conversation that naturally combines elements from "${lessonTitles[0]}" and "${lessonTitles[1]}". The learner should demonstrate they can use vocabulary and structures from both lessons.`,
      successCriteria: `User demonstrates language from both ${lessonTitles[0]} and ${lessonTitles[1]} in their responses`,
    });
  }

  // If no specific match, create goals from lesson titles
  if (goals.length === 0 && lessonTitles.length > 0) {
    if (lessonTitles.length >= 2) {
      goals.push({
        scenario: `Use what you learned: ${lessonTitles[0]} + ${lessonTitles[1]}`,
        prompt: `Have a conversation that lets the learner practice "${lessonTitles[0]}" and "${lessonTitles[1]}". Create a realistic situation where both topics come up naturally.`,
        successCriteria: `User demonstrates skills from both lessons in a natural conversation`,
      });
    }

    // Add a roleplay based on unit title
    goals.push({
      scenario: `Real-world practice: ${unitTitle}`,
      prompt: `Create a realistic everyday situation involving ${unitTitle}. Guide the learner through the interaction with follow-up questions.`,
      successCriteria: `User successfully navigates a realistic ${unitTitle} scenario`,
    });
  }

  return goals;
}

/**
 * Topic-specific integrated practice goals for better relevance
 */
const INTEGRATED_PRACTICE_TEMPLATES = {
  "pre-a1 foundations": [
    {
      scenario: "Introduce yourself and ask about someone else",
      prompt:
        "Have the learner introduce themselves fully (name, origin, family) and then ask questions about you.",
      successCriteria:
        "User introduces themselves AND asks at least one question about the other person",
    },
    {
      scenario: "Navigate a simple social situation",
      prompt:
        "Roleplay meeting someone new - greetings, introductions, polite phrases, and saying goodbye.",
      successCriteria:
        "User uses greetings, introduces themselves, and uses polite expressions",
    },
  ],
  greetings: [
    {
      scenario: "Have a complete greeting exchange",
      prompt:
        "Practice a full greeting sequence - hello, how are you, response, and goodbye.",
      successCriteria:
        "User completes a natural greeting exchange with appropriate responses",
    },
  ],
  "people and places": [
    {
      scenario: "Describe where you live and who you live with",
      prompt:
        "Ask about the learner's home - where they live, who is in their family, what's nearby.",
      successCriteria:
        "User describes their location AND mentions family or people",
    },
  ],
  numbers: [
    {
      scenario: "Exchange contact information",
      prompt:
        "Practice giving and asking for phone numbers, ages, or addresses.",
      successCriteria: "User correctly produces multiple numbers in context",
    },
  ],
  food: [
    {
      scenario: "Order a complete meal at a restaurant",
      prompt:
        "Roleplay ordering food - greeting the waiter, ordering food and drink, asking for the check.",
      successCriteria: "User orders at least two items and uses polite phrases",
    },
  ],
  shopping: [
    {
      scenario: "Complete a shopping transaction",
      prompt:
        "Guide the learner through buying something - asking about items, prices, and paying.",
      successCriteria:
        "User asks questions about products AND completes the transaction",
    },
  ],
  travel: [
    {
      scenario: "Plan and describe a trip",
      prompt:
        "Discuss travel plans - where they want to go, when, how, and what they'll do there.",
      successCriteria:
        "User describes travel plans with multiple details (destination, timing, activities)",
    },
  ],
  places: [
    {
      scenario: "Describe your favorite place in your city",
      prompt:
        "Ask the learner about places in their city - a favorite restaurant, park, or neighborhood. Have them describe what it looks like and why they like it.",
      successCriteria:
        "User describes a specific place with at least 3 details (location, appearance, why they like it)",
    },
    {
      scenario: "Give directions to a landmark",
      prompt:
        "You are lost and need directions to a famous place. Ask the learner how to get there.",
      successCriteria:
        "User gives directions using location vocabulary (near, far, turn, straight, etc.)",
    },
  ],
  "describing places": [
    {
      scenario: "Compare two different places",
      prompt:
        "Ask the learner to compare two places they know - their home vs a friend's, their city vs another city, etc.",
      successCriteria:
        "User uses comparison language to describe differences and similarities between places",
    },
  ],
  family: [
    {
      scenario: "Introduce your family members",
      prompt:
        "Ask about the learner's family - names, ages, relationships, what they do. Encourage them to describe each person briefly.",
      successCriteria:
        "User names and describes at least 2-3 family members with basic details",
    },
  ],
  time: [
    {
      scenario: "Describe your typical day",
      prompt:
        "Ask the learner what they do at different times - morning routine, afternoon activities, evening plans.",
      successCriteria:
        "User describes activities at specific times (morning, afternoon, evening) with time expressions",
    },
  ],
  weather: [
    {
      scenario: "Discuss today's weather and make plans",
      prompt:
        "Talk about the weather today and ask what the learner plans to do because of it. Discuss appropriate clothing or activities.",
      successCriteria:
        "User describes weather AND connects it to plans or clothing choices",
    },
  ],
  transportation: [
    {
      scenario: "Explain how you get to work or school",
      prompt:
        "Ask about the learner's commute - what transportation they use, how long it takes, their preferences.",
      successCriteria:
        "User describes their transportation method with details (type, time, frequency)",
    },
  ],
  health: [
    {
      scenario: "Describe how you're feeling today",
      prompt:
        "Ask about the learner's health and wellbeing. If they feel unwell, ask about symptoms. If well, ask what they do to stay healthy.",
      successCriteria:
        "User describes their physical or emotional state with relevant vocabulary",
    },
  ],
  work: [
    {
      scenario: "Talk about your job or studies",
      prompt:
        "Ask about what the learner does for work or studies - their role, responsibilities, what they like about it.",
      successCriteria:
        "User describes their work/studies with at least 2-3 specific details",
    },
  ],
  hobbies: [
    {
      scenario: "Share your favorite hobby and why you enjoy it",
      prompt:
        "Ask about hobbies and free time activities. Have them explain what they do, how often, and why they enjoy it.",
      successCriteria:
        "User describes a hobby with details about frequency and reasons for enjoyment",
    },
  ],
};

function ensureModeContent(mode, topic, lesson) {
  const topicLabel =
    typeof topic === "string" ? topic : String(topic || "topic");
  const updatedContent = { ...(lesson.content || {}) };

  if (mode === "vocabulary") {
    updatedContent.vocabulary = updatedContent.vocabulary || {
      topic: topicLabel,
      prompt: `Learn and recycle ${topicLabel} vocabulary in context.`,
    };
  }

  if (mode === "grammar") {
    updatedContent.grammar = updatedContent.grammar || {
      topic: topicLabel,
      prompt: `Practice the concrete grammar objectives for ${topicLabel}.`,
    };
  }

  if (mode === "stories") {
    updatedContent.stories = updatedContent.stories || {
      topic: topicLabel,
      prompt: `Follow a short story that highlights ${topicLabel} language.`,
    };
  }

  if (mode === "reading") {
    updatedContent.reading = updatedContent.reading || {
      topic: topicLabel,
      prompt: `Interpret written prompts about ${topicLabel}.`,
    };
  }

  if (mode === "realtime") {
    updatedContent.realtime =
      updatedContent.realtime ||
      generateActionableRealtimeGoal(topicLabel, lesson);
  }

  return updatedContent;
}

function normalizeLessonModes(unit, lesson) {
  // Skip normalization for tutorial lessons - preserve their exact modes
  if (lesson.isTutorial) {
    return lesson;
  }

  const topic = deriveLessonTopic(unit, lesson);
  const isQuiz = lesson.isFinalQuiz;
  const isSkillBuilder = lesson.id?.includes("skill-builder");
  const isIntegratedPractice = lesson.id?.includes("integrated-practice");

  let modes = (lesson.modes || []).filter((mode) => ALLOWED_MODULES.has(mode));
  modes = Array.from(new Set(modes));

  if (isQuiz) {
    modes = ["grammar", "vocabulary"];
  } else if (isSkillBuilder) {
    modes = ["grammar", "vocabulary"];
  } else if (isIntegratedPractice) {
    modes = ["realtime", "reading", "stories"];
  } else {
    if (modes.length === 0) {
      modes = Object.keys(lesson.content || {}).filter((mode) =>
        ALLOWED_MODULES.has(mode),
      );
    }

    if (modes.length > 5) {
      modes = modes.slice(0, 5);
    }
  }

  let content = { ...(lesson.content || {}) };
  modes.forEach((mode) => {
    content = ensureModeContent(mode, topic, { ...lesson, content });
  });

  return { ...lesson, modes, content };
}

function tagLessonWithFunction(level, unit, lesson) {
  const topic = deriveLessonTopic(unit, lesson);
  const profile = CEFR_LEVEL_PROFILES[level] || CEFR_LEVEL_PROFILES.A1;
  return {
    ...lesson,
    objectives: buildLessonObjectives(level, unit, lesson),
    communicativeFocus: {
      function: `${profile.interaction} on ${topic}`,
      discourseSkills: profile.discourseSkills,
      scenario: `${unit.description?.en || unit.title?.en}: ${
        lesson.description?.en || lesson.title?.en || "lesson"
      }`,
    },
  };
}

function assignSubLevels(unitsByLevel) {
  const cloned = JSON.parse(JSON.stringify(unitsByLevel));

  Object.entries(cloned).forEach(([level, units]) => {
    const subStages = SUB_LEVEL_SEGMENTS[level] || [level];
    const chunkSize = Math.ceil(units.length / subStages.length);

    cloned[level] = units.map((unit, index) => {
      const subLevelIndex = Math.min(
        Math.floor(index / chunkSize),
        subStages.length - 1,
      );
      const subLevel = subStages[subLevelIndex];
      const isMilestone =
        index === units.length - 1 || (index + 1) % chunkSize === 0;

      return {
        ...unit,
        subLevel,
        milestone: isMilestone
          ? {
              title: `${subLevel} milestone`,
              summary: `Checkpoint for ${subLevel} to verify readiness before advancing to the next sub-stage.`,
              checks: [
                `Completed ${unit.title?.en || "unit"} quiz with ${
                  unit.lessons?.find((lesson) => lesson.isFinalQuiz)?.quizConfig
                    ?.passingScore || "target"
                } passing score target.`,
                `Can ${
                  CEFR_LEVEL_PROFILES[level]?.interaction ||
                  "interact in everyday situations"
                } using the themes from this segment.`,
                `Demonstrates ${
                  CEFR_LEVEL_PROFILES[level]?.accuracy || "steady control"
                } across ${subLevel} topics.`,
              ],
            }
          : undefined,
      };
    });
  });

  return cloned;
}

function applyCEFRScaffolding(path) {
  const stagedPath = assignSubLevels(path);

  Object.entries(stagedPath).forEach(([level, units]) => {
    stagedPath[level] = units.map((unit) => {
      const expandedLessons = addSupplementalLessons(level, unit);
      const enhancedLessons = expandedLessons.map((lesson) =>
        normalizeLessonModes(
          unit,
          appendAdvancedModes(
            level,
            tagLessonWithFunction(level, unit, lesson),
            unit,
          ),
        ),
      );
      const agendaLessons = enhancedLessons.map((lesson) =>
        withCanonicalLessonAgenda(lesson, { unit }),
      );
      const agendaUnit = { ...unit, cefrLevel: level, lessons: agendaLessons };
      const balancedLessons = agendaLessons.map((lesson) => {
        if (
          !lesson.id?.includes("skill-builder") &&
          !lesson.id?.includes("integrated-practice")
        ) {
          return lesson;
        }

        const snapshot = buildUnitCurriculumSnapshot(agendaUnit, {
          beforeLessonId: lesson.id,
        });
        const reviewItems = snapshot.agendaItems.map((item) => ({
          ...item,
          id: `review-${item.sourceLessonId}-${item.id}`,
          sourceModes: item.modes,
          modes: [...lesson.modes],
          source: "unit-review",
          sourceAgendaItemId: item.id,
        }));

        return reviewItems.length
          ? {
              ...lesson,
              agenda: { version: 1, items: reviewItems },
              reviewSourceLessonIds: snapshot.sourceLessonIds,
              reviewStrategy: lesson.id.includes("skill-builder")
                ? {
                    formats: ["pattern_recycling", "micro_drill"],
                    maxItemsPerRound: 4,
                  }
                : {
                    formats: ["guided_scenario", "skill_integration"],
                    minimumSourceObjectives: 2,
                  },
            }
          : lesson;
      });

      const scheduledLessons = applyLessonXPSchedule(balancedLessons);

      // Append a Game Review lesson at the end of every non-tutorial unit
      if (!unit.isTutorial) {
        const unitTitle = unit.title?.en || "Unit";
        const maxXp = Math.max(...scheduledLessons.map((l) => l.xpRequired || 0), 0);
        const unitTopics = scheduledLessons
          .filter((l) => !l.isGame)
          .map((l) =>
            l.content?.vocabulary?.topic || l.content?.grammar?.topic ||
            l.content?.realtime?.scenario || l.content?.reading?.topic ||
            l.title?.en || "",
          )
          .filter(Boolean);
        const gameLesson = {
          id: `${unit.id}-game`,
          title: { en: "Game Review", es: "Repaso de Juego" },
          description: {
            en: `Review ${unitTitle} by playing an interactive game`,
            es: `Repasa ${unit.title?.es || unitTitle} jugando un juego interactivo`,
          },
          xpRequired: maxXp + 30,
          xpReward: 30,
          isGame: true,
          tutorPurpose: "rpg_game",
          modes: ["game"],
          content: {
            game: {
              topic: `${unitTitle} game review`, unitTitle, cefrLevel: level,
              unitTopics,
              ...tagGameLessonContent(unitTopics),
            },
          },
        };
        const gameSnapshot = buildUnitCurriculumSnapshot(
          { ...unit, cefrLevel: level, lessons: scheduledLessons },
        );
        scheduledLessons.push({
          ...gameLesson,
          agenda: {
            version: 1,
            items: gameSnapshot.agendaItems.map((item) => ({
              ...item,
              id: `review-${item.sourceLessonId}-${item.id}`,
              sourceModes: item.modes,
              modes: ["game"],
              source: "unit-review",
              sourceAgendaItemId: item.id,
            })),
          },
          reviewSourceLessonIds: gameSnapshot.sourceLessonIds,
        });
      }

      return {
        ...unit,
        communicativeFunctions: [
          `Functional focus: ${
            CEFR_LEVEL_PROFILES[level]?.interaction || "interaction"
          }.`,
          `Discourse skills: ${(
            CEFR_LEVEL_PROFILES[level]?.discourseSkills || []
          ).join(", ")}.`,
        ],
        lessons: scheduledLessons,
      };
    });
  });

  return stagedPath;
}


export function buildLearningPathLevel({
  rawUnits = [],
  level,
  targetLang = "es",
  authoredCurriculum,
} = {}) {
  const baseLearningPath = withLocalizedSkillTreeText({
    [level]: rawUnits,
  });
  const alignedPath = withLocalizedSkillTreeText(
    applyCEFRScaffolding(baseLearningPath),
  );
  const clonedPath = JSON.parse(JSON.stringify(alignedPath));
  const targetPath = applyAuthoredTargetCurriculum(
    clonedPath,
    targetLang,
    authoredCurriculum,
  );
  return targetPath?.[level] || [];
}
