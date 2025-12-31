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
              prompt:
                "Demonstrate mastery of idioms and colloquial expressions",
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
              topics: [
                "advanced vocabulary and nuanced expressions structures",
              ],
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

const SUPPORTED_TARGET_LANGS = new Set(["en", "es", "pt", "fr", "it", "nl", "nah"]);
const DEFAULT_TARGET_LANG = "es";

const VOCABULARY_LIBRARY = {
  greetings: {
    en: ["hello", "goodbye", "good morning", "good afternoon", "good night"],
    es: ["hola", "adiós", "buenos días", "buenas tardes", "buenas noches"],
    fr: ["bonjour", "salut", "bonsoir", "bonne nuit", "à bientôt"],
    pt: ["olá", "tchau", "bom dia", "boa tarde", "boa noite"],
    it: ["ciao", "arrivederci", "buongiorno", "buon pomeriggio", "buonanotte"],
    nah: ["niltze", "motlazotla", "tlaneci", "tlahco tonalli", "yohualli"],
  },
  "question words": {
    en: ["who", "what", "where", "when", "why"],
    es: ["¿quién?", "¿qué?", "¿dónde?", "¿cuándo?", "¿por qué?"],
    fr: ["qui", "quoi", "où", "quand", "pourquoi"],
    pt: ["quem", "o que", "onde", "quando", "por quê"],
    it: ["chi", "che cosa", "dove", "quando", "perché"],
    nah: ["aqueni", "tlen", "canin", "quema", "tleca"],
  },
  preferences: {
    en: ["I like", "I don't like", "I love", "I prefer", "I dislike"],
    es: ["me gusta", "no me gusta", "me encanta", "prefiero", "me desagrada"],
    fr: ["j'aime", "je n'aime pas", "j'adore", "je préfère", "je déteste"],
    pt: ["eu gosto", "eu não gosto", "eu adoro", "eu prefiro", "eu detesto"],
    it: ["mi piace", "non mi piace", "adoro", "preferisco", "detesto"],
    nah: [
      "nicniqui",
      "axnicniqui",
      "nicmotetzopelia",
      "nicnequi",
      "axniquilia",
    ],
  },
  numbers: {
    en: ["one", "two", "three", "ten", "twenty"],
    es: ["uno", "dos", "tres", "diez", "veinte"],
    fr: ["un", "deux", "trois", "dix", "vingt"],
    pt: ["um", "dois", "três", "dez", "vinte"],
    it: ["uno", "due", "tre", "dieci", "venti"],
    nah: ["ce", "ome", "eyi", "mahtlactli", "cempualli"],
  },
  "food and drinks": {
    en: ["water", "coffee", "bread", "rice", "chicken"],
    es: ["agua", "café", "pan", "arroz", "pollo"],
    fr: ["eau", "café", "pain", "riz", "poulet"],
    pt: ["água", "café", "pão", "arroz", "frango"],
    it: ["acqua", "caffè", "pane", "riso", "pollo"],
    nah: ["atl", "cafeto", "pantli", "ollohtli", "totolin"],
  },
  time: {
    en: ["morning", "afternoon", "night", "o'clock", "minute"],
    es: ["mañana", "tarde", "noche", "en punto", "minuto"],
    fr: ["matin", "après-midi", "nuit", "heure pile", "minute"],
    pt: ["manhã", "tarde", "noite", "em ponto", "minuto"],
    it: ["mattina", "pomeriggio", "notte", "in punto", "minuto"],
    nah: ["tlaneci", "tlahco", "yohualli", "ce hora", "momimi"],
  },
  "daily activities": {
    en: ["wake up", "eat breakfast", "work", "study", "sleep"],
    es: ["despertar", "desayunar", "trabajar", "estudiar", "dormir"],
    fr: [
      "se réveiller",
      "prendre le petit-déj",
      "travailler",
      "étudier",
      "dormir",
    ],
    pt: ["acordar", "tomar café", "trabalhar", "estudar", "dormir"],
    it: ["svegliarsi", "fare colazione", "lavorare", "studiare", "dormire"],
  },
  family: {
    en: ["mother", "father", "brother", "sister", "grandmother"],
    es: ["madre", "padre", "hermano", "hermana", "abuela"],
    fr: ["mère", "père", "frère", "sœur", "grand-mère"],
    pt: ["mãe", "pai", "irmão", "irmã", "avó"],
    it: ["madre", "padre", "fratello", "sorella", "nonna"],
  },
  places: {
    en: ["home", "school", "office", "park", "store"],
    es: ["casa", "escuela", "oficina", "parque", "tienda"],
    fr: ["maison", "école", "bureau", "parc", "magasin"],
    pt: ["casa", "escola", "escritório", "parque", "loja"],
    it: ["casa", "scuola", "ufficio", "parco", "negozio"],
  },
  directions: {
    en: ["left", "right", "straight", "north", "south"],
    es: ["izquierda", "derecha", "recto", "norte", "sur"],
    fr: ["gauche", "droite", "tout droit", "nord", "sud"],
    pt: ["esquerda", "direita", "em frente", "norte", "sul"],
    it: ["sinistra", "destra", "dritto", "nord", "sud"],
  },
  transportation: {
    en: ["bus", "train", "plane", "ticket", "station"],
    es: ["autobús", "tren", "avión", "boleto", "estación"],
    fr: ["bus", "train", "avion", "billet", "gare"],
    pt: ["ônibus", "trem", "avião", "bilhete", "estação"],
    it: ["autobus", "treno", "aereo", "biglietto", "stazione"],
  },
  shopping: {
    en: ["price", "money", "sale", "cashier", "receipt"],
    es: ["precio", "dinero", "oferta", "cajero", "recibo"],
    fr: ["prix", "argent", "promotion", "caissier", "reçu"],
    pt: ["preço", "dinheiro", "promoção", "caixa", "recibo"],
    it: ["prezzo", "denaro", "offerta", "cassiere", "scontrino"],
  },
  clothing: {
    en: ["shirt", "pants", "dress", "shoes", "jacket"],
    es: ["camisa", "pantalón", "vestido", "zapatos", "chaqueta"],
    fr: ["chemise", "pantalon", "robe", "chaussures", "veste"],
    pt: ["camisa", "calça", "vestido", "sapatos", "jaqueta"],
    it: ["camicia", "pantaloni", "abito", "scarpe", "giacca"],
  },
  colors: {
    en: ["red", "blue", "green", "yellow", "black"],
    es: ["rojo", "azul", "verde", "amarillo", "negro"],
    fr: ["rouge", "bleu", "vert", "jaune", "noir"],
    pt: ["vermelho", "azul", "verde", "amarelo", "preto"],
    it: ["rosso", "blu", "verde", "giallo", "nero"],
  },
  "physical descriptions": {
    en: ["tall", "short", "young", "old", "strong"],
    es: ["alto", "bajo", "joven", "viejo", "fuerte"],
    fr: ["grand", "petit", "jeune", "vieux", "fort"],
    pt: ["alto", "baixo", "jovem", "velho", "forte"],
    it: ["alto", "basso", "giovane", "anziano", "forte"],
  },
  personality: {
    en: ["kind", "funny", "serious", "friendly", "shy"],
    es: ["amable", "gracioso", "serio", "amistoso", "tímido"],
    fr: ["gentil", "drôle", "sérieux", "amical", "timide"],
    pt: ["amável", "engraçado", "sério", "amigável", "tímido"],
    it: ["gentile", "divertente", "serio", "amichevole", "timido"],
  },
  sports: {
    en: ["soccer", "basketball", "tennis", "swimming", "running"],
    es: ["fútbol", "baloncesto", "tenis", "natación", "correr"],
    fr: ["football", "basket", "tennis", "natation", "course"],
    pt: ["futebol", "basquete", "tênis", "natação", "corrida"],
    it: ["calcio", "basket", "tennis", "nuoto", "corsa"],
  },
  entertainment: {
    en: ["music", "movie", "concert", "series", "game"],
    es: ["música", "película", "concierto", "serie", "juego"],
    fr: ["musique", "film", "concert", "série", "jeu"],
    pt: ["música", "filme", "show", "série", "jogo"],
    it: ["musica", "film", "concerto", "serie", "gioco"],
  },
  "arts and reading": {
    en: ["book", "author", "painting", "poem", "chapter"],
    es: ["libro", "autor", "pintura", "poema", "capítulo"],
    fr: ["livre", "auteur", "peinture", "poème", "chapitre"],
    pt: ["livro", "autor", "pintura", "poema", "capítulo"],
    it: ["libro", "autore", "dipinto", "poesia", "capitolo"],
  },
  "time expressions": {
    en: ["always", "often", "sometimes", "rarely", "never"],
    es: ["siempre", "a menudo", "a veces", "raramente", "nunca"],
    fr: ["toujours", "souvent", "parfois", "rarement", "jamais"],
    pt: ["sempre", "frequentemente", "às vezes", "raramente", "nunca"],
    it: ["sempre", "spesso", "a volte", "raramente", "mai"],
  },
  travel: {
    en: ["passport", "flight", "hotel", "reservation", "luggage"],
    es: ["pasaporte", "vuelo", "hotel", "reserva", "equipaje"],
    fr: ["passeport", "vol", "hôtel", "réservation", "bagage"],
    pt: ["passaporte", "voo", "hotel", "reserva", "bagagem"],
    it: ["passaporto", "volo", "hotel", "prenotazione", "bagaglio"],
  },
  weather: {
    en: ["sunny", "rainy", "cloudy", "windy", "storm"],
    es: ["soleado", "lluvioso", "nublado", "ventoso", "tormenta"],
    fr: ["ensoleillé", "pluvieux", "nuageux", "venteux", "tempête"],
    pt: ["ensolarado", "chuvoso", "nublado", "ventoso", "tempestade"],
    it: ["soleggiato", "piovoso", "nuvoloso", "ventoso", "tempesta"],
  },
  careers: {
    en: ["engineer", "doctor", "teacher", "artist", "entrepreneur"],
    es: ["ingeniero", "médico", "maestro", "artista", "emprendedor"],
    fr: ["ingénieur", "médecin", "professeur", "artiste", "entrepreneur"],
    pt: ["engenheiro", "médico", "professor", "artista", "empreendedor"],
    it: ["ingegnere", "medico", "insegnante", "artista", "imprenditore"],
  },
  "body parts": {
    en: ["head", "hand", "arm", "leg", "heart"],
    es: ["cabeza", "mano", "brazo", "pierna", "corazón"],
    fr: ["tête", "main", "bras", "jambe", "cœur"],
    pt: ["cabeça", "mão", "braço", "perna", "coração"],
    it: ["testa", "mano", "braccio", "gamba", "cuore"],
  },
  health: {
    en: ["doctor", "medicine", "appointment", "pain", "healthy"],
    es: ["doctor", "medicina", "cita", "dolor", "saludable"],
    fr: ["médecin", "médicament", "rendez-vous", "douleur", "sain"],
    pt: ["médico", "medicamento", "consulta", "dor", "saudável"],
    it: ["medico", "medicina", "appuntamento", "dolore", "sano"],
  },
  wellness: {
    en: ["exercise", "sleep", "hydrate", "relax", "balance"],
    es: ["ejercicio", "dormir", "hidratarse", "relajarse", "equilibrio"],
    fr: ["exercice", "sommeil", "s'hydrater", "se détendre", "équilibre"],
    pt: ["exercício", "dormir", "hidratar", "relaxar", "equilíbrio"],
    it: ["esercizio", "dormire", "idratare", "rilassarsi", "equilibrio"],
  },
  nature: {
    en: ["forest", "river", "mountain", "tree", "flower"],
    es: ["bosque", "río", "montaña", "árbol", "flor"],
    fr: ["forêt", "rivière", "montagne", "arbre", "fleur"],
    pt: ["floresta", "rio", "montanha", "árvore", "flor"],
    it: ["foresta", "fiume", "montagna", "albero", "fiore"],
  },
  environment: {
    en: ["recycle", "pollution", "energy", "climate", "conservation"],
    es: ["reciclar", "contaminación", "energía", "clima", "conservación"],
    fr: ["recycler", "pollution", "énergie", "climat", "conservation"],
    pt: ["reciclar", "poluição", "energia", "clima", "conservação"],
    it: ["riciclare", "inquinamento", "energia", "clima", "conservazione"],
  },
  geography: {
    en: ["continent", "country", "city", "coast", "desert"],
    es: ["continente", "país", "ciudad", "costa", "desierto"],
    fr: ["continent", "pays", "ville", "côte", "désert"],
    pt: ["continente", "país", "cidade", "costa", "deserto"],
    it: ["continente", "paese", "città", "costa", "deserto"],
  },
  debate: {
    en: ["argument", "evidence", "counterpoint", "rebuttal", "stance"],
    es: ["argumento", "evidencia", "contrapunto", "réplica", "postura"],
    fr: ["argument", "preuve", "contrepoint", "réfutation", "position"],
    pt: ["argumento", "prova", "contraponto", "réplica", "posição"],
    it: ["argomento", "prova", "controparte", "confutazione", "posizione"],
  },
  "current events": {
    en: ["headline", "election", "policy", "protest", "update"],
    es: ["titular", "elección", "política", "protesta", "actualización"],
    fr: ["titre", "élection", "politique", "manifestation", "actualité"],
    pt: ["manchete", "eleição", "política", "protesto", "atualização"],
    it: ["titolo", "elezione", "politica", "protesta", "aggiornamento"],
  },
  professional: {
    en: ["meeting", "deadline", "proposal", "client", "team"],
    es: ["reunión", "plazo", "propuesta", "cliente", "equipo"],
    fr: ["réunion", "échéance", "proposition", "client", "équipe"],
    pt: ["reunião", "prazo", "proposta", "cliente", "equipe"],
    it: ["riunione", "scadenza", "proposta", "cliente", "squadra"],
  },
  literature: {
    en: ["novel", "character", "plot", "metaphor", "theme"],
    es: ["novela", "personaje", "trama", "metáfora", "tema"],
    fr: ["roman", "personnage", "intrigue", "métaphore", "thème"],
    pt: ["romance", "personagem", "enredo", "metáfora", "tema"],
    it: ["romanzo", "personaggio", "trama", "metafora", "tema"],
  },
  "visual arts": {
    en: ["canvas", "brush", "gallery", "sculpture", "exhibit"],
    es: ["lienzo", "pincel", "galería", "escultura", "exposición"],
    fr: ["toile", "pinceau", "galerie", "sculpture", "exposition"],
    pt: ["tela", "pincel", "galeria", "escultura", "exposição"],
    it: ["tela", "pennello", "galleria", "scultura", "mostra"],
  },
  cinema: {
    en: ["director", "scene", "script", "actor", "premiere"],
    es: ["director", "escena", "guion", "actor", "estreno"],
    fr: ["réalisateur", "scène", "scénario", "acteur", "première"],
    pt: ["diretor", "cena", "roteiro", "ator", "estreia"],
    it: ["regista", "scena", "copione", "attore", "prima"],
  },
  "digital communication": {
    en: ["message", "emoji", "video call", "notification", "link"],
    es: ["mensaje", "emoji", "videollamada", "notificación", "enlace"],
    fr: ["message", "emoji", "appel vidéo", "notification", "lien"],
    pt: ["mensagem", "emoji", "chamada de vídeo", "notificação", "link"],
    it: ["messaggio", "emoji", "videochiamata", "notifica", "link"],
  },
  science: {
    en: ["experiment", "laboratory", "hypothesis", "data", "discovery"],
    es: ["experimento", "laboratorio", "hipótesis", "datos", "descubrimiento"],
    fr: ["expérience", "laboratoire", "hypothèse", "données", "découverte"],
    pt: ["experimento", "laboratório", "hipótese", "dados", "descoberta"],
    it: ["esperimento", "laboratorio", "ipotesi", "dati", "scoperta"],
  },
  "digital economy": {
    en: ["startup", "platform", "subscription", "analytics", "cryptocurrency"],
    es: ["startup", "plataforma", "suscripción", "analítica", "criptomoneda"],
    fr: ["startup", "plateforme", "abonnement", "analyse", "cryptomonnaie"],
    pt: ["startup", "plataforma", "assinatura", "analítica", "criptomoeda"],
    it: ["startup", "piattaforma", "abbonamento", "analitica", "criptovaluta"],
  },
  "social justice": {
    en: ["equality", "rights", "inclusion", "advocacy", "community"],
    es: ["igualdad", "derechos", "inclusión", "defensa", "comunidad"],
    fr: ["égalité", "droits", "inclusion", "plaidoyer", "communauté"],
    pt: ["igualdade", "direitos", "inclusão", "advocacia", "comunidade"],
    it: ["uguaglianza", "diritti", "inclusione", "advocacy", "comunità"],
  },
  "global issues": {
    en: [
      "climate",
      "migration",
      "cooperation",
      "sustainability",
      "development",
    ],
    es: ["clima", "migración", "cooperación", "sostenibilidad", "desarrollo"],
    fr: ["climat", "migration", "coopération", "durabilité", "développement"],
    pt: [
      "clima",
      "migração",
      "cooperação",
      "sustentabilidade",
      "desenvolvimento",
    ],
    it: ["clima", "migrazione", "cooperazione", "sostenibilità", "sviluppo"],
  },
  emotions: {
    en: ["happy", "sad", "angry", "nervous", "excited"],
    es: ["feliz", "triste", "enojado", "nervioso", "emocionado"],
    fr: ["heureux", "triste", "en colère", "nerveux", "excité"],
    pt: ["feliz", "triste", "zangado", "nervoso", "animado"],
    it: ["felice", "triste", "arrabbiato", "nervoso", "eccitato"],
  },
  "physical states": {
    en: ["tired", "sick", "hot", "cold", "hungry"],
    es: ["cansado", "enfermo", "calor", "frío", "hambre"],
    fr: ["fatigué", "malade", "chaud", "froid", "faim"],
    pt: ["cansado", "doente", "calor", "frio", "fome"],
    it: ["stanco", "malato", "caldo", "freddo", "fame"],
  },
  "days of week": {
    en: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    es: [
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ],
    fr: [
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ],
    pt: [
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
      "domingo",
    ],
    it: [
      "lunedì",
      "martedì",
      "mercoledì",
      "giovedì",
      "venerdì",
      "sabato",
      "domenica",
    ],
  },
  invitations: {
    en: ["do you want to", "would you like", "let's", "join us", "come with"],
    es: ["quieres", "te gustaría", "vamos a", "únete", "ven con"],
    fr: ["veux-tu", "aimerais-tu", "allons", "rejoins-nous", "viens avec"],
    pt: ["você quer", "gostaria de", "vamos", "junte-se", "venha com"],
    it: ["vuoi", "ti piacerebbe", "andiamo", "unisciti", "vieni con"],
  },
  abilities: {
    en: ["can", "know how", "skill", "ability", "talent"],
    es: ["poder", "saber", "habilidad", "capacidad", "talento"],
    fr: ["pouvoir", "savoir", "compétence", "capacité", "talent"],
    pt: ["poder", "saber", "habilidade", "capacidade", "talento"],
    it: ["potere", "sapere", "abilità", "capacità", "talento"],
  },
  comparisons: {
    en: ["more", "less", "equal", "different", "better", "worse"],
    es: ["más", "menos", "igual", "diferente", "mejor", "peor"],
    fr: ["plus", "moins", "égal", "différent", "meilleur", "pire"],
    pt: ["mais", "menos", "igual", "diferente", "melhor", "pior"],
    it: ["più", "meno", "uguale", "diverso", "migliore", "peggiore"],
  },
  "advice and suggestions": {
    en: ["should", "could", "recommend", "advise", "suggest"],
    es: ["deber", "poder", "recomendar", "aconsejar", "sugerir"],
    fr: ["devoir", "pouvoir", "recommander", "conseiller", "suggérer"],
    pt: ["dever", "poder", "recomendar", "aconselhar", "sugerir"],
    it: ["dovere", "potere", "raccomandare", "consigliare", "suggerire"],
  },
  "opinions and debate": {
    en: ["opinion", "think", "believe", "agree", "disagree"],
    es: [
      "opinión",
      "pensar",
      "creer",
      "estar de acuerdo",
      "no estar de acuerdo",
    ],
    fr: [
      "opinion",
      "penser",
      "croire",
      "être d'accord",
      "ne pas être d'accord",
    ],
    pt: ["opinião", "pensar", "acreditar", "concordar", "discordar"],
    it: [
      "opinione",
      "pensare",
      "credere",
      "essere d'accordo",
      "non essere d'accordo",
    ],
  },
  "narrative and storytelling": {
    en: ["once upon a time", "then", "after", "finally", "story"],
    es: ["érase una vez", "luego", "después", "finalmente", "historia"],
    fr: ["il était une fois", "puis", "après", "finalement", "histoire"],
    pt: ["era uma vez", "então", "depois", "finalmente", "história"],
    it: ["c'era una volta", "poi", "dopo", "finalmente", "storia"],
  },
  idioms: {
    en: [
      "piece of cake",
      "break the ice",
      "hit the nail on the head",
      "under the weather",
      "spill the beans",
    ],
    es: [
      "ser pan comido",
      "romper el hielo",
      "dar en el clavo",
      "estar en las nubes",
      "meter la pata",
    ],
    fr: [
      "c'est du gâteau",
      "briser la glace",
      "mettre le doigt dessus",
      "avoir le cafard",
      "vendre la mèche",
    ],
    pt: [
      "moleza",
      "quebrar o gelo",
      "acertar na mosca",
      "estar nas nuvens",
      "meter os pés pelas mãos",
    ],
    it: [
      "un gioco da ragazzi",
      "rompere il ghiaccio",
      "azzeccare",
      "essere tra le nuvole",
      "fare una gaffe",
    ],
  },
  "idioms and colloquial expressions": {
    en: ["no way", "for real", "hang out", "freak out", "catch up"],
    es: [
      "ni hablar",
      "en serio",
      "salir con amigos",
      "ponerse nervioso",
      "ponerse al día",
    ],
    fr: ["pas question", "sérieusement", "traîner", "paniquer", "se rattraper"],
    pt: ["nem pensar", "sério", "sair com amigos", "pirar", "colocar em dia"],
    it: [
      "neanche per sogno",
      "davvero",
      "uscire con amici",
      "andare fuori di testa",
      "recuperare",
    ],
  },
  "regional language": {
    en: ["dialect", "accent", "slang", "regional", "variation"],
    es: ["dialecto", "acento", "jerga", "regional", "variación"],
    fr: ["dialecte", "accent", "argot", "régional", "variation"],
    pt: ["dialeto", "sotaque", "gíria", "regional", "variação"],
    it: ["dialetto", "accento", "gergo", "regionale", "variazione"],
  },
  "advanced vocabulary and nuanced expressions": {
    en: ["nuance", "implication", "subtle", "connotation", "rhetoric"],
    es: ["matiz", "implicación", "sutil", "connotación", "retórica"],
    fr: ["nuance", "implication", "subtil", "connotation", "rhétorique"],
    pt: ["nuance", "implicação", "sutil", "conotação", "retórica"],
    it: ["sfumatura", "implicazione", "sottile", "connotazione", "retorica"],
  },
  conditional: {
    en: ["would", "could", "should", "if", "hypothetical"],
    es: ["haría", "podría", "debería", "si", "hipotético"],
    fr: ["ferais", "pourrais", "devrais", "si", "hypothétique"],
    pt: ["faria", "poderia", "deveria", "se", "hipotético"],
    it: ["farei", "potrei", "dovrei", "se", "ipotetico"],
  },
  experiences: {
    en: ["experience", "memory", "event", "story", "moment"],
    es: ["experiencia", "memoria", "evento", "historia", "momento"],
    fr: ["expérience", "mémoire", "événement", "histoire", "moment"],
    pt: ["experiência", "memória", "evento", "história", "momento"],
    it: ["esperienza", "memoria", "evento", "storia", "momento"],
  },
  probability: {
    en: ["maybe", "probably", "possibly", "might", "could"],
    es: ["quizás", "probablemente", "posiblemente", "podría", "tal vez"],
    fr: [
      "peut-être",
      "probablement",
      "possiblement",
      "pourrait",
      "éventuellement",
    ],
    pt: ["talvez", "provavelmente", "possivelmente", "poderia", "porventura"],
    it: [
      "forse",
      "probabilmente",
      "possibilmente",
      "potrebbe",
      "eventualmente",
    ],
  },
  complaints: {
    en: ["complaint", "problem", "issue", "dissatisfied", "unhappy"],
    es: ["queja", "problema", "asunto", "insatisfecho", "infeliz"],
    fr: ["plainte", "problème", "question", "insatisfait", "mécontent"],
    pt: ["reclamação", "problema", "questão", "insatisfeito", "infeliz"],
    it: ["reclamo", "problema", "questione", "insoddisfatto", "scontento"],
  },
  "current events": {
    en: ["news", "media", "press", "journalism", "report"],
    es: ["noticias", "medios", "prensa", "periodismo", "informe"],
    fr: ["nouvelles", "médias", "presse", "journalisme", "rapport"],
    pt: ["notícias", "mídia", "imprensa", "jornalismo", "relatório"],
    it: ["notizie", "media", "stampa", "giornalismo", "rapporto"],
  },
  passive: {
    en: ["is done", "was made", "has been", "being", "by"],
    es: ["se hace", "fue hecho", "ha sido", "siendo", "por"],
    fr: ["est fait", "a été fait", "a été", "étant", "par"],
    pt: ["é feito", "foi feito", "tem sido", "sendo", "por"],
    it: ["è fatto", "è stato fatto", "è stato", "essendo", "da"],
  },
  "relative clauses": {
    en: ["who", "which", "that", "where", "whose"],
    es: ["que", "quien", "el cual", "donde", "cuyo"],
    fr: ["qui", "que", "lequel", "où", "dont"],
    pt: ["que", "quem", "o qual", "onde", "cujo"],
    it: ["che", "il quale", "dove", "cui", "il cui"],
  },
  register: {
    en: ["formal", "informal", "polite", "casual", "respectful"],
    es: ["formal", "informal", "cortés", "casual", "respetuoso"],
    fr: ["formel", "informel", "poli", "décontracté", "respectueux"],
    pt: ["formal", "informal", "educado", "casual", "respeitoso"],
    it: ["formale", "informale", "cortese", "casuale", "rispettoso"],
  },
  science: {
    en: ["research", "study", "experiment", "theory", "discovery"],
    es: ["investigación", "estudio", "experimento", "teoría", "descubrimiento"],
    fr: ["recherche", "étude", "expérience", "théorie", "découverte"],
    pt: ["pesquisa", "estudo", "experimento", "teoria", "descoberta"],
    it: ["ricerca", "studio", "esperimento", "teoria", "scoperta"],
  },
  wellness: {
    en: ["wellness", "fitness", "nutrition", "mental health", "balance"],
    es: [
      "bienestar",
      "condición física",
      "nutrición",
      "salud mental",
      "equilibrio",
    ],
    fr: ["bien-être", "forme", "nutrition", "santé mentale", "équilibre"],
    pt: ["bem-estar", "fitness", "nutrição", "saúde mental", "equilíbrio"],
    it: ["benessere", "fitness", "nutrizione", "salute mentale", "equilibrio"],
  },
  abstract: {
    en: ["concept", "idea", "notion", "philosophy", "principle"],
    es: ["concepto", "idea", "noción", "filosofía", "principio"],
    fr: ["concept", "idée", "notion", "philosophie", "principe"],
    pt: ["conceito", "ideia", "noção", "filosofia", "princípio"],
    it: ["concetto", "idea", "nozione", "filosofia", "principio"],
  },
  subjunctive: {
    en: ["wish", "hope", "doubt", "uncertainty", "desire"],
    es: ["deseo", "esperanza", "duda", "incertidumbre", "deseo"],
    fr: ["souhait", "espoir", "doute", "incertitude", "désir"],
    pt: ["desejo", "esperança", "dúvida", "incerteza", "desejo"],
    it: ["desiderio", "speranza", "dubbio", "incertezza", "desiderio"],
  },
  debate: {
    en: ["argument", "counterargument", "evidence", "persuade", "convince"],
    es: ["argumento", "contraargumento", "evidencia", "persuadir", "convencer"],
    fr: ["argument", "contre-argument", "preuve", "persuader", "convaincre"],
    pt: [
      "argumento",
      "contra-argumento",
      "evidência",
      "persuadir",
      "convencer",
    ],
    it: ["argomento", "controargomento", "prova", "persuadere", "convincere"],
  },
  academic: {
    en: ["thesis", "research", "citation", "bibliography", "scholarly"],
    es: ["tesis", "investigación", "cita", "bibliografía", "académico"],
    fr: ["thèse", "recherche", "citation", "bibliographie", "universitaire"],
    pt: ["tese", "pesquisa", "citação", "bibliografia", "acadêmico"],
    it: ["tesi", "ricerca", "citazione", "bibliografia", "accademico"],
  },
  discourse: {
    en: ["therefore", "however", "moreover", "nevertheless", "thus"],
    es: ["por lo tanto", "sin embargo", "además", "no obstante", "así"],
    fr: ["donc", "cependant", "de plus", "néanmoins", "ainsi"],
    pt: ["portanto", "no entanto", "além disso", "não obstante", "assim"],
    it: ["quindi", "tuttavia", "inoltre", "nondimeno", "così"],
  },
  style: {
    en: ["elegant", "concise", "formal", "casual", "tone"],
    es: ["elegante", "conciso", "formal", "casual", "tono"],
    fr: ["élégant", "concis", "formel", "décontracté", "ton"],
    pt: ["elegante", "conciso", "formal", "casual", "tom"],
    it: ["elegante", "conciso", "formale", "informale", "tono"],
  },
  rhetoric: {
    en: ["metaphor", "irony", "analogy", "persuasion", "ethos"],
    es: ["metáfora", "ironía", "analogía", "persuasión", "ética"],
    fr: ["métaphore", "ironie", "analogie", "persuasion", "ethos"],
    pt: ["metáfora", "ironia", "analogia", "persuasão", "ética"],
    it: ["metafora", "ironia", "analogia", "persuasione", "etica"],
  },
  specialized: {
    en: ["technical", "terminology", "jargon", "specific", "expert"],
    es: ["técnico", "terminología", "jerga", "específico", "experto"],
    fr: ["technique", "terminologie", "jargon", "spécifique", "expert"],
    pt: ["técnico", "terminologia", "jargão", "específico", "especialista"],
    it: ["tecnico", "terminologia", "gergo", "specifico", "esperto"],
  },
  fluency: {
    en: ["fluent", "native", "proficient", "mastery", "command"],
    es: ["fluido", "nativo", "competente", "dominio", "mando"],
    fr: ["fluide", "natif", "compétent", "maîtrise", "commande"],
    pt: ["fluente", "nativo", "proficiente", "domínio", "comando"],
    it: ["fluente", "nativo", "competente", "padronanza", "comando"],
  },
};

function normalizeTopicKey(topic = "") {
  return topic.trim().toLowerCase();
}

function resolveVocabularyWords(topic, targetLang) {
  if (!topic) return null;
  const entry = VOCABULARY_LIBRARY[normalizeTopicKey(topic)];
  if (!entry) return null;
  return (
    entry[targetLang] ||
    entry[DEFAULT_TARGET_LANG] ||
    entry.en ||
    Object.values(entry)[0]
  );
}

function localizeLearningPath(units, targetLang) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;
  const cloned = JSON.parse(JSON.stringify(units));
  cloned.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      const vocab = lesson.content?.vocabulary;
      if (vocab?.topic) {
        const words = resolveVocabularyWords(vocab.topic, lang);
        if (Array.isArray(words) && words.length) {
          vocab.words = words;
        }
      }
    });
  });
  return cloned;
}

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
};
