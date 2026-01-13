/**
 * C2 Level Skill Tree Data
 */

export const SKILL_TREE_C2 = [
  {
    id: "unit-c2-1",
    title: {
      en: "Native Idioms",
      es: "Modismos Nativos",
    },
    description: {
      en: "Advanced idioms",
      es: "Modismos avanzados",
    },
    color: "#22C55E",
    position: { row: 0, offset: 0 },
    lessons: [
      {
        id: "lesson-c2-1-1",
        title: {
          en: "Advanced Expressions",
          es: "Expresiones Avanzadas",
        },
        description: {
          en: "Learn key vocabulary for native idioms",
          es: "Aprende vocabulario clave para modismos nativos",
        },
        xpRequired: 8575,
        xpReward: 55,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "idioms and colloquial expressions",
          },
          grammar: {
            topic: "idioms and colloquial expressions structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-1-2",
        title: {
          en: "Speaking Like a Native",
          es: "Hablando Como Nativo",
        },
        description: {
          en: "Practice native idioms in conversation",
          es: "Practica modismos nativos en conversación",
        },
        xpRequired: 8615,
        xpReward: 40,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "idioms and colloquial expressions conversation",
            prompt:
              "Practice using idioms and colloquial expressions in real conversation",
          },
          stories: {
            topic: "idioms and colloquial expressions",
            prompt: "Read and discuss idioms and colloquial expressions",
          },
        },
      },
      {
        id: "lesson-c2-1-3",
        title: {
          en: "Cultural Mastery",
          es: "Maestría Cultural",
        },
        description: {
          en: "Apply native idioms skills",
          es: "Aplica habilidades de modismos nativos",
        },
        xpRequired: 8655,
        xpReward: 45,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "idioms and colloquial expressions",
            prompt:
              "Advanced idioms and colloquial expressions content and comprehension",
          },
          realtime: {
            scenario: "idioms and colloquial expressions mastery",
            prompt: "Demonstrate mastery of idioms and colloquial expressions",
          },
        },
      },
      {
        id: "lesson-c2-1-quiz",
        title: {
          en: "Native Idioms Quiz",
          es: "Prueba de Modismos Nativos",
        },
        description: {
          en: "Test your knowledge of native idioms",
          es: "Prueba tus conocimientos de modismos nativos",
        },
        xpRequired: 8695,
        xpReward: 50,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "idioms and colloquial expressions",
          },
          grammar: {
            topics: ["idioms and colloquial expressions structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-2",
    title: {
      en: "Regional Variations",
      es: "Variaciones Regionales",
    },
    description: {
      en: "Dialects",
      es: "Dialectos",
    },
    color: "#3B82F6",
    position: { row: 0, offset: 1 },
    lessons: [
      {
        id: "lesson-c2-2-1",
        title: {
          en: "Dialects",
          es: "Dialectos",
        },
        description: {
          en: "Learn key vocabulary for regional variations",
          es: "Aprende vocabulario clave para variaciones regionales",
        },
        xpRequired: 8775,
        xpReward: 55,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "regional language",
          },
          grammar: {
            topic: "regional language structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-2-2",
        title: {
          en: "Accent and Usage",
          es: "Acento y Uso",
        },
        description: {
          en: "Practice regional variations in conversation",
          es: "Practica variaciones regionales en conversación",
        },
        xpRequired: 8815,
        xpReward: 50,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "regional language conversation",
            prompt: "Practice using regional language in real conversation",
          },
          stories: {
            topic: "regional language",
            prompt: "Read and discuss regional language",
          },
        },
      },
      {
        id: "lesson-c2-2-3",
        title: {
          en: "Linguistic Diversity",
          es: "Diversidad Lingüística",
        },
        description: {
          en: "Apply regional variations skills",
          es: "Aplica habilidades de variaciones regionales",
        },
        xpRequired: 8855,
        xpReward: 55,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "regional language",
            prompt: "Advanced regional language content and comprehension",
          },
          realtime: {
            scenario: "regional language mastery",
            prompt: "Demonstrate mastery of regional language",
          },
        },
      },
      {
        id: "lesson-c2-2-quiz",
        title: {
          en: "Regional Variations Quiz",
          es: "Prueba de Variaciones Regionales",
        },
        description: {
          en: "Test your knowledge of regional variations",
          es: "Prueba tus conocimientos de variaciones regionales",
        },
        xpRequired: 8895,
        xpReward: 40,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "regional language",
          },
          grammar: {
            topics: ["regional language structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-3",
    title: {
      en: "Stylistic Mastery",
      es: "Dominio Estilístico",
    },
    description: {
      en: "Style control",
      es: "Control de estilo",
    },
    color: "#F59E0B",
    position: { row: 1, offset: 0 },
    lessons: [
      {
        id: "lesson-c2-3-1",
        title: {
          en: "Refined Language",
          es: "Dominio Estilístico - Vocabulario",
        },
        description: {
          en: "Learn key vocabulary for stylistic mastery",
          es: "Aprende vocabulario clave para dominio estilístico",
        },
        xpRequired: 8975,
        xpReward: 55,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "style",
          },
          grammar: {
            topic: "style structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-3-2",
        title: {
          en: "Elegant Expression",
          es: "Dominio Estilístico - Práctica",
        },
        description: {
          en: "Practice stylistic mastery in conversation",
          es: "Practica dominio estilístico en conversación",
        },
        xpRequired: 9015,
        xpReward: 50,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "style conversation",
            prompt: "Practice using style in real conversation",
          },
          stories: {
            topic: "style",
            prompt: "Read and discuss style",
          },
        },
      },
      {
        id: "lesson-c2-3-3",
        title: {
          en: "Artistic Language",
          es: "Dominio Estilístico - Aplicación",
        },
        description: {
          en: "Apply stylistic mastery skills",
          es: "Aplica habilidades de dominio estilístico",
        },
        xpRequired: 9055,
        xpReward: 45,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "style",
            prompt: "Advanced style content and comprehension",
          },
          realtime: {
            scenario: "style mastery",
            prompt: "Demonstrate mastery of style",
          },
        },
      },
      {
        id: "lesson-c2-3-quiz",
        title: {
          en: "Stylistic Mastery Quiz",
          es: "Prueba de Dominio Estilístico",
        },
        description: {
          en: "Test your knowledge of stylistic mastery",
          es: "Prueba tus conocimientos de dominio estilístico",
        },
        xpRequired: 9095,
        xpReward: 40,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "style",
          },
          grammar: {
            topics: ["style structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-4",
    title: {
      en: "Rhetorical Devices",
      es: "Dispositivos Retóricos",
    },
    description: {
      en: "Persuasive techniques",
      es: "Técnicas persuasivas",
    },
    color: "#8B5CF6",
    position: { row: 1, offset: 1 },
    lessons: [
      {
        id: "lesson-c2-4-1",
        title: {
          en: "Persuasive Techniques",
          es: "Técnicas Persuasivas",
        },
        description: {
          en: "Learn key vocabulary for rhetorical devices",
          es: "Aprende vocabulario clave para dispositivos retóricos",
        },
        xpRequired: 9175,
        xpReward: 35,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "rhetoric",
          },
          grammar: {
            topic: "rhetoric structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-4-2",
        title: {
          en: "Powerful Speech",
          es: "Discurso Poderoso",
        },
        description: {
          en: "Practice rhetorical devices in conversation",
          es: "Practica dispositivos retóricos en conversación",
        },
        xpRequired: 9215,
        xpReward: 50,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "rhetoric conversation",
            prompt: "Practice using rhetoric in real conversation",
          },
          stories: {
            topic: "rhetoric",
            prompt: "Read and discuss rhetoric",
          },
        },
      },
      {
        id: "lesson-c2-4-3",
        title: {
          en: "Master Rhetoric",
          es: "Maestría Retórica",
        },
        description: {
          en: "Apply rhetorical devices skills",
          es: "Aplica habilidades de dispositivos retóricos",
        },
        xpRequired: 9255,
        xpReward: 45,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "rhetoric",
            prompt: "Advanced rhetoric content and comprehension",
          },
          realtime: {
            scenario: "rhetoric mastery",
            prompt: "Demonstrate mastery of rhetoric",
          },
        },
      },
      {
        id: "lesson-c2-4-quiz",
        title: {
          en: "Rhetorical Devices Quiz",
          es: "Prueba de Dispositivos Retóricos",
        },
        description: {
          en: "Test your knowledge of rhetorical devices",
          es: "Prueba tus conocimientos de dispositivos retóricos",
        },
        xpRequired: 9295,
        xpReward: 40,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "rhetoric",
          },
          grammar: {
            topics: ["rhetoric structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-5",
    title: {
      en: "Specialized Vocabulary",
      es: "Vocabulario Especializado",
    },
    description: {
      en: "Technical terms",
      es: "Términos técnicos",
    },
    color: "#EC4899",
    position: { row: 2, offset: 0 },
    lessons: [
      {
        id: "lesson-c2-5-1",
        title: {
          en: "Expert Terminology",
          es: "Terminología Experta",
        },
        description: {
          en: "Learn key vocabulary for specialized vocabulary",
          es: "Aprende vocabulario clave para vocabulario especializado",
        },
        xpRequired: 9375,
        xpReward: 45,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "specialized",
          },
          grammar: {
            topic: "specialized structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-5-2",
        title: {
          en: "Professional Fields",
          es: "Campos Profesionales",
        },
        description: {
          en: "Practice specialized vocabulary in conversation",
          es: "Practica vocabulario especializado en conversación",
        },
        xpRequired: 9415,
        xpReward: 60,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "specialized conversation",
            prompt: "Practice using specialized in real conversation",
          },
          stories: {
            topic: "specialized",
            prompt: "Read and discuss specialized",
          },
        },
      },
      {
        id: "lesson-c2-5-3",
        title: {
          en: "Domain Expertise",
          es: "Experiencia en el Dominio",
        },
        description: {
          en: "Apply specialized vocabulary skills",
          es: "Aplica habilidades de vocabulario especializado",
        },
        xpRequired: 9455,
        xpReward: 55,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "specialized",
            prompt: "Advanced specialized content and comprehension",
          },
          realtime: {
            scenario: "specialized mastery",
            prompt: "Demonstrate mastery of specialized",
          },
        },
      },
      {
        id: "lesson-c2-5-quiz",
        title: {
          en: "Specialized Vocabulary Quiz",
          es: "Prueba de Vocabulario Especializado",
        },
        description: {
          en: "Test your knowledge of specialized vocabulary",
          es: "Prueba tus conocimientos de vocabulario especializado",
        },
        xpRequired: 9495,
        xpReward: 60,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "specialized",
          },
          grammar: {
            topics: ["specialized structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-6",
    title: {
      en: "Subtle Nuances",
      es: "Matices Sutiles",
    },
    description: {
      en: "Fine distinctions",
      es: "Distinciones finas",
    },
    color: "#10B981",
    position: { row: 2, offset: 1 },
    lessons: [
      {
        id: "lesson-c2-6-1",
        title: {
          en: "Fine Distinctions",
          es: "Distinciones Finas",
        },
        description: {
          en: "Learn key vocabulary for subtle nuances",
          es: "Aprende vocabulario clave para matices sutiles",
        },
        xpRequired: 9575,
        xpReward: 35,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "advanced vocabulary and nuanced expressions",
          },
          grammar: {
            topic: "advanced vocabulary and nuanced expressions structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-6-2",
        title: {
          en: "Precise Meaning",
          es: "Significado Preciso",
        },
        description: {
          en: "Practice subtle nuances in conversation",
          es: "Practica matices sutiles en conversación",
        },
        xpRequired: 9615,
        xpReward: 50,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario:
              "advanced vocabulary and nuanced expressions conversation",
            prompt:
              "Practice using advanced vocabulary and nuanced expressions in real conversation",
          },
          stories: {
            topic: "advanced vocabulary and nuanced expressions",
            prompt:
              "Read and discuss advanced vocabulary and nuanced expressions",
          },
        },
      },
      {
        id: "lesson-c2-6-3",
        title: {
          en: "Mastery of Detail",
          es: "Maestría del Detalle",
        },
        description: {
          en: "Apply subtle nuances skills",
          es: "Aplica habilidades de matices sutiles",
        },
        xpRequired: 9655,
        xpReward: 55,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "advanced vocabulary and nuanced expressions",
            prompt:
              "Advanced advanced vocabulary and nuanced expressions content and comprehension",
          },
          realtime: {
            scenario: "advanced vocabulary and nuanced expressions mastery",
            prompt:
              "Demonstrate mastery of advanced vocabulary and nuanced expressions",
          },
        },
      },
      {
        id: "lesson-c2-6-quiz",
        title: {
          en: "Subtle Nuances Quiz",
          es: "Prueba de Matices Sutiles",
        },
        description: {
          en: "Test your knowledge of subtle nuances",
          es: "Prueba tus conocimientos de matices sutiles",
        },
        xpRequired: 9695,
        xpReward: 40,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "advanced vocabulary and nuanced expressions",
          },
          grammar: {
            topics: ["advanced vocabulary and nuanced expressions structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-7",
    title: {
      en: "Cultural Expertise",
      es: "Experiencia Cultural",
    },
    description: {
      en: "Cultural mastery",
      es: "Dominio cultural",
    },
    color: "#06B6D4",
    position: { row: 3, offset: 0 },
    lessons: [
      {
        id: "lesson-c2-7-1",
        title: {
          en: "Cultural Intelligence",
          es: "Inteligencia Cultural",
        },
        description: {
          en: "Learn key vocabulary for cultural expertise",
          es: "Aprende vocabulario clave para experiencia cultural",
        },
        xpRequired: 9775,
        xpReward: 35,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "culture",
          },
          grammar: {
            topic: "culture structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-7-2",
        title: {
          en: "Cultural Navigator",
          es: "Navegador Cultural",
        },
        description: {
          en: "Practice cultural expertise in conversation",
          es: "Practica experiencia cultural en conversación",
        },
        xpRequired: 9815,
        xpReward: 50,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "culture conversation",
            prompt: "Practice using culture in real conversation",
          },
          stories: {
            topic: "culture",
            prompt: "Read and discuss culture",
          },
        },
      },
      {
        id: "lesson-c2-7-3",
        title: {
          en: "Cultural Ambassador",
          es: "Embajador Cultural",
        },
        description: {
          en: "Apply cultural expertise skills",
          es: "Aplica habilidades de experiencia cultural",
        },
        xpRequired: 9855,
        xpReward: 35,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "culture",
            prompt: "Advanced culture content and comprehension",
          },
          realtime: {
            scenario: "culture mastery",
            prompt: "Demonstrate mastery of culture",
          },
        },
      },
      {
        id: "lesson-c2-7-quiz",
        title: {
          en: "Cultural Expertise Quiz",
          es: "Prueba de Experiencia Cultural",
        },
        description: {
          en: "Test your knowledge of cultural expertise",
          es: "Prueba tus conocimientos de experiencia cultural",
        },
        xpRequired: 9895,
        xpReward: 50,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "culture",
          },
          grammar: {
            topics: ["culture structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
  {
    id: "unit-c2-8",
    title: {
      en: "Near-Native Fluency",
      es: "Fluidez Casi Nativa",
    },
    description: {
      en: "Native-like skills",
      es: "Habilidades casi nativas",
    },
    color: "#EF4444",
    position: { row: 3, offset: 1 },
    lessons: [
      {
        id: "lesson-c2-8-1",
        title: {
          en: "Native-Like Skills",
          es: "Habilidades Nativas",
        },
        description: {
          en: "Learn key vocabulary for near-native fluency",
          es: "Aprende vocabulario clave para fluidez casi nativa",
        },
        xpRequired: 9975,
        xpReward: 35,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "fluency",
          },
          grammar: {
            topic: "fluency structures",
            focusPoints: ["basic patterns", "common phrases"],
          },
        },
      },
      {
        id: "lesson-c2-8-2",
        title: {
          en: "Perfect Fluency",
          es: "Fluidez Perfecta",
        },
        description: {
          en: "Practice near-native fluency in conversation",
          es: "Practica fluidez casi nativa en conversación",
        },
        xpRequired: 10015,
        xpReward: 40,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "fluency conversation",
            prompt: "Practice using fluency in real conversation",
          },
          stories: {
            topic: "fluency",
            prompt: "Read and discuss fluency",
          },
        },
      },
      {
        id: "lesson-c2-8-3",
        title: {
          en: "Complete Mastery",
          es: "Maestría Completa",
        },
        description: {
          en: "Apply near-native fluency skills",
          es: "Aplica habilidades de fluidez casi nativa",
        },
        xpRequired: 10055,
        xpReward: 35,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "fluency",
            prompt: "Advanced fluency content and comprehension",
          },
          realtime: {
            scenario: "fluency mastery",
            prompt: "Demonstrate mastery of fluency",
          },
        },
      },
      {
        id: "lesson-c2-8-quiz",
        title: {
          en: "Near-Native Fluency Quiz",
          es: "Prueba de Fluidez Casi Nativa",
        },
        description: {
          en: "Test your knowledge of near-native fluency",
          es: "Prueba tus conocimientos de fluidez casi nativa",
        },
        xpRequired: 10095,
        xpReward: 50,
        modes: ["vocabulary", "grammar"],
        isFinalQuiz: true,
        quizConfig: {
          questionsRequired: 12,
          passingScore: 10,
        },
        content: {
          vocabulary: {
            topic: "fluency",
          },
          grammar: {
            topics: ["fluency structures"],
            focusPoints: ["comprehensive review"],
          },
        },
      },
    ],
  },
];

const SUB_LEVEL_SEGMENTS = {
  A1: ["A1.1", "A1.2", "A1.3"],
  A2: ["A2.1", "A2.2", "A2.3"],
  B1: ["B1.1", "B1.2", "B1.3"],
  B2: ["B2.1", "B2.2", "B2.3"],
  C1: ["C1.1", "C1.2", "C1.3"],
  C2: ["C2.1", "C2.2", "C2.3"],
};

const CEFR_LEVEL_PROFILES = {
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
  const nonQuizLessons = lessons.filter((lesson) => !lesson.isFinalQuiz);
  const maxNonQuizXp = Math.max(
    ...nonQuizLessons.map((lesson) => lesson.xpRequired || 0),
    0
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
      modes: ["grammar", "vocabulary"],
      content: {
        grammar: {
          topic,
          focusPoints: ["pattern recycling", "micro-drills"],
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
      modes: ["realtime", "reading", "stories"],
      content: {
        realtime: {
          scenario: `${topic.toLowerCase()} integrated task`,
          prompt: `Produce longer turns that connect earlier lesson points for ${topic}.`,
        },
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
      focusPoints: ["form", "use"],
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
    updatedContent.realtime = updatedContent.realtime || {
      scenario: `${topicLabel.toLowerCase()} exchange`,
      prompt: `Respond in real time using ${topicLabel} language.`,
    };
  }

  return updatedContent;
}

function normalizeLessonModes(unit, lesson) {
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
      modes = ["vocabulary", "realtime", "reading"];
    }

    const hasOnlyVocabGrammar =
      modes.length === 2 &&
      modes.includes("vocabulary") &&
      modes.includes("grammar");

    if (hasOnlyVocabGrammar) {
      modes.push("realtime");
    }

    while (modes.length < 3) {
      const filler = [
        "vocabulary",
        "grammar",
        "reading",
        "stories",
        "realtime",
      ].find((mode) => !modes.includes(mode));
      if (!filler) break;
      modes.push(filler);
    }

    if (modes.length > 4) {
      modes = modes.slice(0, 4);
    }
  }

  let content = { ...(lesson.content || {}) };
  modes.forEach((mode) => {
    content = ensureModeContent(mode, topic, { ...lesson, content });
  });

  return { ...lesson, modes, content };
}

function ensureUnitModuleCoverage(unit, lessons) {
  const moduleCounts = lessons.reduce((counts, lesson) => {
    lesson.modes?.forEach((mode) => {
      counts[mode] = (counts[mode] || 0) + 1;
    });
    return counts;
  }, {});

  const missingModules = Array.from(ALLOWED_MODULES).filter(
    (module) => !moduleCounts[module]
  );

  const eligibleLessons = lessons.filter(
    (lesson) =>
      !lesson.isFinalQuiz &&
      !lesson.id?.includes("skill-builder") &&
      !lesson.id?.includes("integrated-practice")
  );

  missingModules.forEach((module) => {
    let targetLesson = eligibleLessons.find(
      (lesson) =>
        (lesson.modes?.length || 0) < 4 &&
        !(lesson.modes || []).includes(module)
    );

    if (!targetLesson) {
      targetLesson = eligibleLessons.find((lesson) => {
        const lessonModes = lesson.modes || [];
        if (lessonModes.includes(module)) return false;
        if (lessonModes.length !== 4) return false;
        return lessonModes.some((mode) => moduleCounts[mode] > 1);
      });

      if (targetLesson) {
        const modeToReplace = targetLesson.modes.find(
          (mode) => moduleCounts[mode] > 1
        );
        if (modeToReplace) {
          targetLesson.modes = targetLesson.modes
            .filter((mode) => mode !== modeToReplace)
            .concat(module);
          moduleCounts[modeToReplace] -= 1;
        }
      }
    }

    if (!targetLesson) {
      return;
    }

    targetLesson.modes = Array.from(
      new Set([...(targetLesson.modes || []), module])
    );
    targetLesson.content = ensureModeContent(
      module,
      deriveLessonTopic(unit, targetLesson),
      targetLesson
    );
    moduleCounts[module] = (moduleCounts[module] || 0) + 1;
  });

  return lessons;
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
        subStages.length - 1
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
            unit
          )
        )
      );
      const balancedLessons = ensureUnitModuleCoverage(unit, enhancedLessons);

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
        lessons: balancedLessons,
      };
    });
  });

  return stagedPath;
}

const cefrAlignedLearningPath = applyCEFRScaffolding(baseLearningPath);

const SUPPORTED_TARGET_LANGS = new Set([
  "en",
  "es",
  "pt",
  "fr",
  "it",
  "nl",
  "nah",
  "ja",
  "ru",
  "de",
  "el",
]);
const DEFAULT_TARGET_LANG = "es";

const cloneLearningPath = () =>
  JSON.parse(JSON.stringify(cefrAlignedLearningPath));

export const LEARNING_PATHS = {
  es: cloneLearningPath(), // Spanish
  en: cloneLearningPath(), // English
  pt: cloneLearningPath(), // Portuguese
  fr: cloneLearningPath(), // French
  it: cloneLearningPath(), // Italian
  nl: cloneLearningPath(), // Dutch
  nah: cloneLearningPath(), // Huastec Nahuatl
  ja: cloneLearningPath(), // Japanese
  ru: cloneLearningPath(), // Russian
  de: cloneLearningPath(), // German
  el: cloneLearningPath(), // Greek
};
