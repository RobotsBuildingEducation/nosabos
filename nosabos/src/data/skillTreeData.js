/**
 * Skill Tree Data Structure for Language Learning
 *
 * This defines the structured learning path with units and lessons.
 * Each unit contains multiple lessons that unlock progressively.
 *
 * Structure:
 * - Unit: A thematic grouping of lessons (e.g., "Basics 1", "Greetings")
 * - Lesson: Individual learning session combining multiple modes
 * - Skill: Completion state for a lesson (locked, available, in_progress, completed)
 */

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

/**
 * Learning path structure for each language
 * Organized by CEFR proficiency levels (A1, A2, B1, B2, C1, C2)
 *
 * A1: Absolute Beginner - Basic survival language
 * A2: Elementary - Simple everyday communication
 * B1: Intermediate - Handle most everyday situations
 * B2: Upper Intermediate - Abstract topics and complex discussions
 * C1: Advanced - Flexible, sophisticated language use
 * C2: Mastery - Near-native proficiency
 */
const baseLearningPath = {
  A1: [
    // Tutorial Unit - always at the very beginning
    {
      id: "unit-tutorial-a1",
      title: {
        en: "Getting Started",
        es: "Primeros Pasos",
      },
      description: {
        en: "Learn how to use the app and explore all features",
        es: "Aprende a usar la app y explora todas las funciones",
      },
      color: "#6366F1",
      position: { row: -2, offset: 0 },
      isTutorial: true,
      lessons: [
        {
          id: "lesson-tutorial-1",
          title: {
            en: "Getting Started",
            es: "Primeros Pasos",
          },
          description: {
            en: "A guided tour of all learning modules",
            es: "Un recorrido guiado por todos los módulos de aprendizaje",
          },
          xpRequired: 0,
          xpReward: 50,
          isTutorial: true,
          modes: ["vocabulary", "grammar", "verbConjugator", "reading", "stories", "realtime"],
          content: {
            vocabulary: {
              topic: "tutorial",
              focusPoints: ["basic words", "greetings"],
              tutorialDescription: {
                en: "Learn new words with interactive questions.",
                es: "Aprende nuevas palabras mediante preguntas interactivas.",
              },
            },
            grammar: {
              topic: "tutorial",
              focusPoints: ["basic patterns"],
              tutorialDescription: {
                en: "Master grammar rules through exercises.",
                es: "Domina las reglas gramaticales mediante ejercicios.",
              },
            },
            verbConjugator: {
              topic: "tutorial",
              focusPoints: ["simple present", "ser", "estar"],
              tutorialDescription: {
                en: "Practice verb conjugations. Learn to conjugate 'to be' (ser/estar) in simple present.",
                es: "Practica conjugaciones verbales. Aprende a conjugar 'ser/estar' en presente simple.",
              },
            },
            reading: {
              topic: "tutorial",
              prompt: "Introduction to reading comprehension",
              tutorialDescription: {
                en: "Improve your reading skills by following along with passages.",
                es: "Mejora tus habilidades de lectura siguiendo los textos.",
              },
            },
            stories: {
              topic: "tutorial",
              prompt: "Introduction to interactive stories",
              tutorialDescription: {
                en: "Practice with interactive stories and roleplay by reading and speaking sentence by sentence.",
                es: "Practica con historias interactivas y juegos de rol leyendo y hablando oración por oración.",
              },
            },
            realtime: {
              scenario: "Say hello",
              prompt: "Practice saying hello in a live chat",
              successCriteria: "The learner says hello.",
              successCriteria_es: 'El estudiante dice "hola".',
              successCriteria_pt: 'O aluno diz "olá" para você.',
              successCriteria_fr: 'L\'apprenant te dit "bonjour".',
              successCriteria_it: 'L\'apprendente ti dice "ciao".',
              successCriteria_nl: 'De leerling zegt "hallo" tegen je.',
              successCriteria_nah: 'The learner says "niltze" to you.',
              successCriteria_ja: 'The learner says "こんにちは" (konnichiwa) to you.',
              tutorialDescription: {
                en: "Practice speaking with realtime conversations and goal oriented chats.",
                es: "Practica la expresión oral con conversaciones en tiempo real y chats orientados a objetivos.",
              },
            },
          },
        },
      ],
    },
    {
      id: "unit-pre-a1-1",
      title: {
        en: "Pre-A1 Foundations",
        es: "Fundamentos Pre-A1",
      },
      description: {
        en: "100 must-know words and phrases to start fast",
        es: "100 palabras y frases imprescindibles para empezar rápido",
      },
      color: "#10B981",
      position: { row: -1, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-1",
          title: {
            en: "Everyday Starters",
            es: "Arranques Cotidianos",
          },
          description: {
            en: "Your first 20 high-frequency words for greetings and basics",
            es: "Tus primeras 20 palabras de alta frecuencia para saludos y básicos",
          },
          xpRequired: 0,
          xpReward: 25,
          modes: ["vocabulary", "listening"],
          content: {
            vocabulary: {
              topic: "greetings and starters",
              focusPoints: ["hello/bye variations", "thanks/please", "yes/no"],
            },
            listening: {
              topic: "greetings and starters",
              focusPoints: [
                "recognizing common polite phrases",
                "intonation for greetings",
              ],
            },
          },
        },
        {
          id: "lesson-pre-a1-2",
          title: {
            en: "People & Places",
            es: "Personas y Lugares",
          },
          description: {
            en: "Add 20 words for names, family, and moving around",
            es: "Suma 20 palabras para nombres, familia y moverte por ahí",
          },
          xpRequired: 15,
          xpReward: 25,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "people and places",
              focusPoints: ["family", "locations", "getting attention"],
            },
            grammar: {
              topic: "formula chunks",
              focusPoints: ["I am/from", "This is", "Where is?"],
            },
          },
        },
        {
          id: "lesson-pre-a1-3",
          title: {
            en: "Actions & Essentials",
            es: "Acciones y Esenciales",
          },
          description: {
            en: "20 everyday verbs and short requests to get things done",
            es: "20 verbos cotidianos y peticiones cortas para lograr cosas",
          },
          xpRequired: 40,
          xpReward: 30,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              topic: "actions and needs",
              focusPoints: ["common verbs", "requests", "need/want"],
            },
            realtime: {
              scenario: "quick requests",
              prompt:
                "Roleplay asking for help, ordering, or finding something",
            },
          },
        },
        {
          id: "lesson-pre-a1-4",
          title: {
            en: "Time, Travel & Directions",
            es: "Tiempo, Viajes y Direcciones",
          },
          description: {
            en: "20 words for time, transport, and finding your way",
            es: "20 palabras para tiempo, transporte y orientarte",
          },
          xpRequired: 65,
          xpReward: 30,
          modes: ["vocabulary", "reading"],
          content: {
            vocabulary: {
              topic: "time and movement",
              focusPoints: ["days and hours", "here/there", "left/right"],
            },
            reading: {
              topic: "travel mini-notices",
              prompt: "Read tiny signs and captions about time and direction",
            },
          },
        },
        {
          id: "lesson-pre-a1-5",
          title: {
            en: "Social Glue & Questions",
            es: "Conectores Sociales y Preguntas",
          },
          description: {
            en: "Round out 100 words with connectors, feelings, and quick questions",
            es: "Completa 100 palabras con conectores, emociones y preguntas rápidas",
          },
          xpRequired: 90,
          xpReward: 35,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              topic: "connectors and questions",
              focusPoints: [
                "and/but/because",
                "how/what/where",
                "feeling words",
              ],
            },
            stories: {
              topic: "micro roleplays",
              prompt: "Act out short meetups using your new question words",
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-1",
      title: {
        en: "First Words",
        es: "Primeras Palabras",
      },
      description: {
        en: "Your very first words",
        es: "Tus primeras palabras",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-1-1",
          title: {
            en: "Hello and Goodbye",
            es: "Hola y Adiós",
          },
          description: {
            en: "Learn essential greetings and farewells",
            es: "Aprende saludos y despedidas esenciales",
          },
          xpRequired: 110,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "greetings",
            },
            grammar: {
              topic: "greetings structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-1-2",
          title: {
            en: "Meeting Someone New",
            es: "Conocer a Alguien Nuevo",
          },
          description: {
            en: "Practice greetings in real conversations",
            es: "Practica saludos en conversaciones reales",
          },
          xpRequired: 125,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "greetings conversation",
              prompt: "Practice using greetings in real conversation",
            },
            stories: {
              topic: "greetings",
              prompt: "Read and discuss greetings",
            },
          },
        },
        {
          id: "lesson-a1-1-3",
          title: {
            en: "Polite Conversations",
            es: "Conversaciones Corteses",
          },
          description: {
            en: "Master greeting etiquette and social niceties",
            es: "Domina la etiqueta de saludos y cortesías sociales",
          },
          xpRequired: 140,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "greetings",
              prompt: "Advanced greetings content and comprehension",
            },
            realtime: {
              scenario: "greetings mastery",
              prompt: "Demonstrate mastery of greetings",
            },
          },
        },
        {
          id: "lesson-a1-1-quiz",
          title: {
            en: "First Words Quiz",
            es: "Prueba de Primeras Palabras",
          },
          description: {
            en: "Test your knowledge of first words",
            es: "Prueba tus conocimientos de primeras palabras",
          },
          xpRequired: 155,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "greetings",
            },
            grammar: {
              topics: ["greetings structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-2",
      title: {
        en: "Introducing Yourself",
        es: "Presentándote",
      },
      description: {
        en: "Say your name and origin",
        es: "Di tu nombre y origen",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-2-1",
          title: {
            en: "What's Your Name?",
            es: "¿Cómo Te Llamas?",
          },
          description: {
            en: "Learn to introduce yourself and ask others' names",
            es: "Aprende a presentarte y preguntar nombres",
          },
          xpRequired: 185,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "introductions",
            },
            grammar: {
              topic: "introductions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-2-2",
          title: {
            en: "Nice to Meet You",
            es: "Mucho Gusto",
          },
          description: {
            en: "Practice introductions in real conversations",
            es: "Practica presentaciones en conversaciones reales",
          },
          xpRequired: 200,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "introductions conversation",
              prompt: "Practice using introductions in real conversation",
            },
            stories: {
              topic: "introductions",
              prompt: "Read and discuss introductions",
            },
          },
        },
        {
          id: "lesson-a1-2-3",
          title: {
            en: "Tell Me About Yourself",
            es: "Cuéntame Sobre Ti",
          },
          description: {
            en: "Share personal information and ask about others",
            es: "Comparte información personal y pregunta sobre otros",
          },
          xpRequired: 215,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "introductions",
              prompt: "Advanced introductions content and comprehension",
            },
            realtime: {
              scenario: "introductions mastery",
              prompt: "Demonstrate mastery of introductions",
            },
          },
        },
        {
          id: "lesson-a1-2-quiz",
          title: {
            en: "Introducing Yourself Quiz",
            es: "Prueba de Presentándote",
          },
          description: {
            en: "Test your knowledge of introducing yourself",
            es: "Prueba tus conocimientos de presentándote",
          },
          xpRequired: 230,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "introductions",
            },
            grammar: {
              topics: ["introductions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-3",
      title: {
        en: "Numbers 0-20",
        es: "Números 0-20",
      },
      description: {
        en: "Count to twenty",
        es: "Cuenta hasta veinte",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-3-1",
          title: {
            en: "Counting to Twenty",
            es: "Contando hasta Veinte",
          },
          description: {
            en: "Learn to count from zero to twenty",
            es: "Aprende a contar desde cero hasta veinte",
          },
          xpRequired: 260,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "numbers",
            },
            grammar: {
              topic: "numbers structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-3-2",
          title: {
            en: "Using Numbers Daily",
            es: "Usando Números Diariamente",
          },
          description: {
            en: "Practice numbers in everyday situations",
            es: "Practica números en situaciones cotidianas",
          },
          xpRequired: 275,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "numbers conversation",
              prompt: "Practice using numbers in real conversation",
            },
            stories: {
              topic: "numbers",
              prompt: "Read and discuss numbers",
            },
          },
        },
        {
          id: "lesson-a1-3-3",
          title: {
            en: "Phone Numbers and Ages",
            es: "Números de Teléfono y Edades",
          },
          description: {
            en: "Apply numbers to phone numbers and ages",
            es: "Aplica números a teléfonos y edades",
          },
          xpRequired: 290,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "numbers",
              prompt: "Advanced numbers content and comprehension",
            },
            realtime: {
              scenario: "numbers mastery",
              prompt: "Demonstrate mastery of numbers",
            },
          },
        },
        {
          id: "lesson-a1-3-quiz",
          title: {
            en: "Numbers 0-20 Quiz",
            es: "Prueba de Números 0-20",
          },
          description: {
            en: "Test your knowledge of numbers 0-20",
            es: "Prueba tus conocimientos de números 0-20",
          },
          xpRequired: 305,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "numbers",
            },
            grammar: {
              topics: ["numbers structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-4",
      title: {
        en: "Numbers 21-100",
        es: "Números 21-100",
      },
      description: {
        en: "Larger numbers",
        es: "Números más grandes",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-4-1",
          title: {
            en: "Counting to One Hundred",
            es: "Contando hasta Cien",
          },
          description: {
            en: "Learn to count from twenty-one to one hundred",
            es: "Aprende a contar desde veintiuno hasta cien",
          },
          xpRequired: 335,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "numbers",
            },
            grammar: {
              topic: "numbers structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-4-2",
          title: {
            en: "Prices and Money",
            es: "Precios y Dinero",
          },
          description: {
            en: "Practice using larger numbers with prices and money",
            es: "Practica usando números grandes con precios y dinero",
          },
          xpRequired: 350,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "numbers conversation",
              prompt: "Practice using numbers in real conversation",
            },
            stories: {
              topic: "numbers",
              prompt: "Read and discuss numbers",
            },
          },
        },
        {
          id: "lesson-a1-4-3",
          title: {
            en: "Big Numbers in Context",
            es: "Números Grandes en Contexto",
          },
          description: {
            en: "Apply larger numbers in real-life contexts",
            es: "Aplica números grandes en contextos de la vida real",
          },
          xpRequired: 365,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "numbers",
              prompt: "Advanced numbers content and comprehension",
            },
            realtime: {
              scenario: "numbers mastery",
              prompt: "Demonstrate mastery of numbers",
            },
          },
        },
        {
          id: "lesson-a1-4-quiz",
          title: {
            en: "Numbers 21-100 Quiz",
            es: "Prueba de Números 21-100",
          },
          description: {
            en: "Test your knowledge of numbers 21-100",
            es: "Prueba tus conocimientos de números 21-100",
          },
          xpRequired: 380,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "numbers",
            },
            grammar: {
              topics: ["numbers structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-5",
      title: {
        en: "Days of Week",
        es: "Días de la Semana",
      },
      description: {
        en: "Learn the days",
        es: "Aprende los días",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-5-1",
          title: {
            en: "Monday to Sunday",
            es: "Lunes a Domingo",
          },
          description: {
            en: "Learn key vocabulary for days of week",
            es: "Aprende vocabulario clave para días de la semana",
          },
          xpRequired: 410,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "days of week",
            },
            grammar: {
              topic: "days of week structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-5-2",
          title: {
            en: "What Day Is It?",
            es: "¿Qué Día Es?",
          },
          description: {
            en: "Practice days of week in conversation",
            es: "Practica días de la semana en conversación",
          },
          xpRequired: 425,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "days of week conversation",
              prompt: "Practice using days of week in real conversation",
            },
            stories: {
              topic: "days of week",
              prompt: "Read and discuss days of week",
            },
          },
        },
        {
          id: "lesson-a1-5-3",
          title: {
            en: "Planning Your Week",
            es: "Planificando Tu Semana",
          },
          description: {
            en: "Apply days of week skills",
            es: "Aplica habilidades de días de la semana",
          },
          xpRequired: 440,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "days of week",
              prompt: "Advanced days of week content and comprehension",
            },
            realtime: {
              scenario: "days of week mastery",
              prompt: "Demonstrate mastery of days of week",
            },
          },
        },
        {
          id: "lesson-a1-5-quiz",
          title: {
            en: "Days of Week Quiz",
            es: "Prueba de Días de la Semana",
          },
          description: {
            en: "Test your knowledge of days of week",
            es: "Prueba tus conocimientos de días de la semana",
          },
          xpRequired: 455,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "days of week",
            },
            grammar: {
              topics: ["days of week structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-6",
      title: {
        en: "Months & Dates",
        es: "Meses y Fechas",
      },
      description: {
        en: "Calendar basics",
        es: "Conceptos del calendario",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-6-1",
          title: {
            en: "Twelve Months",
            es: "Doce Meses",
          },
          description: {
            en: "Learn key vocabulary for months & dates",
            es: "Aprende vocabulario clave para meses y fechas",
          },
          xpRequired: 485,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-6-2",
          title: {
            en: "When's Your Birthday?",
            es: "¿Cuándo Es Tu Cumpleaños?",
          },
          description: {
            en: "Practice months & dates in conversation",
            es: "Practica meses y fechas en conversación",
          },
          xpRequired: 500,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-a1-6-3",
          title: {
            en: "Important Dates",
            es: "Fechas Importantes",
          },
          description: {
            en: "Apply months & dates skills",
            es: "Aplica habilidades de meses y fechas",
          },
          xpRequired: 515,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-a1-6-quiz",
          title: {
            en: "Months & Dates Quiz",
            es: "Prueba de Meses y Fechas",
          },
          description: {
            en: "Test your knowledge of months & dates",
            es: "Prueba tus conocimientos de meses y fechas",
          },
          xpRequired: 530,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-7",
      title: {
        en: "Telling Time",
        es: "Decir la Hora",
      },
      description: {
        en: "What time is it?",
        es: "¿Qué hora es?",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-7-1",
          title: {
            en: "What Time Is It?",
            es: "¿Qué Hora Es?",
          },
          description: {
            en: "Learn key vocabulary for telling time",
            es: "Aprende vocabulario clave para decir la hora",
          },
          xpRequired: 560,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time",
            },
            grammar: {
              topic: "time structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-7-2",
          title: {
            en: "Daily Schedule",
            es: "Horario Diario",
          },
          description: {
            en: "Practice telling time in conversation",
            es: "Practica decir la hora en conversación",
          },
          xpRequired: 575,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time conversation",
              prompt: "Practice using time in real conversation",
            },
            stories: {
              topic: "time",
              prompt: "Read and discuss time",
            },
          },
        },
        {
          id: "lesson-a1-7-3",
          title: {
            en: "Making Appointments",
            es: "Haciendo Citas",
          },
          description: {
            en: "Apply telling time skills",
            es: "Aplica habilidades de decir la hora",
          },
          xpRequired: 590,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time",
              prompt: "Advanced time content and comprehension",
            },
            realtime: {
              scenario: "time mastery",
              prompt: "Demonstrate mastery of time",
            },
          },
        },
        {
          id: "lesson-a1-7-quiz",
          title: {
            en: "Telling Time Quiz",
            es: "Prueba de Decir la Hora",
          },
          description: {
            en: "Test your knowledge of telling time",
            es: "Prueba tus conocimientos de decir la hora",
          },
          xpRequired: 605,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time",
            },
            grammar: {
              topics: ["time structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-8",
      title: {
        en: "Family Members",
        es: "Familia",
      },
      description: {
        en: "Your family",
        es: "Tu familia",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-8-1",
          title: {
            en: "My Family Tree",
            es: "Mi Árbol Genealógico",
          },
          description: {
            en: "Learn key vocabulary for family members",
            es: "Aprende vocabulario clave para familia",
          },
          xpRequired: 635,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "family",
            },
            grammar: {
              topic: "family structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-8-2",
          title: {
            en: "Talking About Family",
            es: "Hablando de la Familia",
          },
          description: {
            en: "Practice family members in conversation",
            es: "Practica familia en conversación",
          },
          xpRequired: 650,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "family conversation",
              prompt: "Practice using family in real conversation",
            },
            stories: {
              topic: "family",
              prompt: "Read and discuss family",
            },
          },
        },
        {
          id: "lesson-a1-8-3",
          title: {
            en: "Family Relationships",
            es: "Relaciones Familiares",
          },
          description: {
            en: "Apply family members skills",
            es: "Aplica habilidades de familia",
          },
          xpRequired: 665,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "family",
              prompt: "Advanced family content and comprehension",
            },
            realtime: {
              scenario: "family mastery",
              prompt: "Demonstrate mastery of family",
            },
          },
        },
        {
          id: "lesson-a1-8-quiz",
          title: {
            en: "Family Members Quiz",
            es: "Prueba de Familia",
          },
          description: {
            en: "Test your knowledge of family members",
            es: "Prueba tus conocimientos de familia",
          },
          xpRequired: 680,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "family",
            },
            grammar: {
              topics: ["family structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-9",
      title: {
        en: "Colors & Shapes",
        es: "Colores y Formas",
      },
      description: {
        en: "Describe visually",
        es: "Describe visualmente",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-9-1",
          title: {
            en: "Rainbow Colors",
            es: "Colores del Arcoíris",
          },
          description: {
            en: "Learn key vocabulary for colors & shapes",
            es: "Aprende vocabulario clave para colores y formas",
          },
          xpRequired: 710,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "colors",
            },
            grammar: {
              topic: "colors structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-9-2",
          title: {
            en: "Describing Things",
            es: "Describiendo Cosas",
          },
          description: {
            en: "Practice colors & shapes in conversation",
            es: "Practica colores y formas en conversación",
          },
          xpRequired: 725,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "colors conversation",
              prompt: "Practice using colors in real conversation",
            },
            stories: {
              topic: "colors",
              prompt: "Read and discuss colors",
            },
          },
        },
        {
          id: "lesson-a1-9-3",
          title: {
            en: "Colors Everywhere",
            es: "Colores por Todas Partes",
          },
          description: {
            en: "Apply colors & shapes skills",
            es: "Aplica habilidades de colores y formas",
          },
          xpRequired: 740,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "colors",
              prompt: "Advanced colors content and comprehension",
            },
            realtime: {
              scenario: "colors mastery",
              prompt: "Demonstrate mastery of colors",
            },
          },
        },
        {
          id: "lesson-a1-9-quiz",
          title: {
            en: "Colors & Shapes Quiz",
            es: "Prueba de Colores y Formas",
          },
          description: {
            en: "Test your knowledge of colors & shapes",
            es: "Prueba tus conocimientos de colores y formas",
          },
          xpRequired: 755,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "colors",
            },
            grammar: {
              topics: ["colors structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-10",
      title: {
        en: "Food & Drinks",
        es: "Comida y Bebidas",
      },
      description: {
        en: "Basic food vocabulary",
        es: "Vocabulario de comida",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-10-1",
          title: {
            en: "Food Vocabulary",
            es: "Vocabulario de Comida",
          },
          description: {
            en: "Learn key vocabulary for food & drinks",
            es: "Aprende vocabulario clave para comida y bebidas",
          },
          xpRequired: 785,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "food and drinks",
            },
            grammar: {
              topic: "food and drinks structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-10-2",
          title: {
            en: "I'm Hungry!",
            es: "¡Tengo Hambre!",
          },
          description: {
            en: "Practice food & drinks in conversation",
            es: "Practica comida y bebidas en conversación",
          },
          xpRequired: 800,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "food and drinks conversation",
              prompt: "Practice using food and drinks in real conversation",
            },
            stories: {
              topic: "food and drinks",
              prompt: "Read and discuss food and drinks",
            },
          },
        },
        {
          id: "lesson-a1-10-3",
          title: {
            en: "My Favorite Foods",
            es: "Mis Comidas Favoritas",
          },
          description: {
            en: "Apply food & drinks skills",
            es: "Aplica habilidades de comida y bebidas",
          },
          xpRequired: 815,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "food and drinks",
              prompt: "Advanced food and drinks content and comprehension",
            },
            realtime: {
              scenario: "food and drinks mastery",
              prompt: "Demonstrate mastery of food and drinks",
            },
          },
        },
        {
          id: "lesson-a1-10-quiz",
          title: {
            en: "Food & Drinks Quiz",
            es: "Prueba de Comida y Bebidas",
          },
          description: {
            en: "Test your knowledge of food & drinks",
            es: "Prueba tus conocimientos de comida y bebidas",
          },
          xpRequired: 830,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "food and drinks",
            },
            grammar: {
              topics: ["food and drinks structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-11",
      title: {
        en: "At the Restaurant",
        es: "En el Restaurante",
      },
      description: {
        en: "Order food",
        es: "Pide comida",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-11-1",
          title: {
            en: "Restaurant Words",
            es: "Palabras de Restaurante",
          },
          description: {
            en: "Learn key vocabulary for at the restaurant",
            es: "Aprende vocabulario clave para en el restaurante",
          },
          xpRequired: 860,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "food and drinks",
            },
            grammar: {
              topic: "food and drinks structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-11-2",
          title: {
            en: "Ordering a Meal",
            es: "Pidiendo una Comida",
          },
          description: {
            en: "Practice at the restaurant in conversation",
            es: "Practica en el restaurante en conversación",
          },
          xpRequired: 875,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "food and drinks conversation",
              prompt: "Practice using food and drinks in real conversation",
            },
            stories: {
              topic: "food and drinks",
              prompt: "Read and discuss food and drinks",
            },
          },
        },
        {
          id: "lesson-a1-11-3",
          title: {
            en: "Paying the Bill",
            es: "Pagando la Cuenta",
          },
          description: {
            en: "Apply at the restaurant skills",
            es: "Aplica habilidades de en el restaurante",
          },
          xpRequired: 890,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "food and drinks",
              prompt: "Advanced food and drinks content and comprehension",
            },
            realtime: {
              scenario: "food and drinks mastery",
              prompt: "Demonstrate mastery of food and drinks",
            },
          },
        },
        {
          id: "lesson-a1-11-quiz",
          title: {
            en: "At the Restaurant Quiz",
            es: "Prueba de En el Restaurante",
          },
          description: {
            en: "Test your knowledge of at the restaurant",
            es: "Prueba tus conocimientos de en el restaurante",
          },
          xpRequired: 905,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "food and drinks",
            },
            grammar: {
              topics: ["food and drinks structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-12",
      title: {
        en: "Common Objects",
        es: "Objetos Comunes",
      },
      description: {
        en: "Everyday items",
        es: "Artículos cotidianos",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-12-1",
          title: {
            en: "Everyday Items",
            es: "Objetos Cotidianos",
          },
          description: {
            en: "Learn key vocabulary for common objects",
            es: "Aprende vocabulario clave para objetos comunes",
          },
          xpRequired: 935,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "common objects",
            },
            grammar: {
              topic: "common objects structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-12-2",
          title: {
            en: "What Is This?",
            es: "¿Qué Es Esto?",
          },
          description: {
            en: "Practice common objects in conversation",
            es: "Practica objetos comunes en conversación",
          },
          xpRequired: 950,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "common objects conversation",
              prompt: "Practice using common objects in real conversation",
            },
            stories: {
              topic: "common objects",
              prompt: "Read and discuss common objects",
            },
          },
        },
        {
          id: "lesson-a1-12-3",
          title: {
            en: "Objects Around Us",
            es: "Objetos a Nuestro Alrededor",
          },
          description: {
            en: "Apply common objects skills",
            es: "Aplica habilidades de objetos comunes",
          },
          xpRequired: 965,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "common objects",
              prompt: "Advanced common objects content and comprehension",
            },
            realtime: {
              scenario: "common objects mastery",
              prompt: "Demonstrate mastery of common objects",
            },
          },
        },
        {
          id: "lesson-a1-12-quiz",
          title: {
            en: "Common Objects Quiz",
            es: "Prueba de Objetos Comunes",
          },
          description: {
            en: "Test your knowledge of common objects",
            es: "Prueba tus conocimientos de objetos comunes",
          },
          xpRequired: 980,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "common objects",
            },
            grammar: {
              topics: ["common objects structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-13",
      title: {
        en: "In the House",
        es: "En la Casa",
      },
      description: {
        en: "Rooms and furniture",
        es: "Habitaciones y muebles",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-13-1",
          title: {
            en: "Rooms of the House",
            es: "Cuartos de la Casa",
          },
          description: {
            en: "Learn key vocabulary for in the house",
            es: "Aprende vocabulario clave para en la casa",
          },
          xpRequired: 1010,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "house and rooms",
            },
            grammar: {
              topic: "house and rooms structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-13-2",
          title: {
            en: "Where Is It?",
            es: "¿Dónde Está?",
          },
          description: {
            en: "Practice in the house in conversation",
            es: "Practica en la casa en conversación",
          },
          xpRequired: 1025,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "house and rooms conversation",
              prompt: "Practice using house and rooms in real conversation",
            },
            stories: {
              topic: "house and rooms",
              prompt: "Read and discuss house and rooms",
            },
          },
        },
        {
          id: "lesson-a1-13-3",
          title: {
            en: "At Home",
            es: "En Casa",
          },
          description: {
            en: "Apply in the house skills",
            es: "Aplica habilidades de en la casa",
          },
          xpRequired: 1040,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "house and rooms",
              prompt: "Advanced house and rooms content and comprehension",
            },
            realtime: {
              scenario: "house and rooms mastery",
              prompt: "Demonstrate mastery of house and rooms",
            },
          },
        },
        {
          id: "lesson-a1-13-quiz",
          title: {
            en: "In the House Quiz",
            es: "Prueba de En la Casa",
          },
          description: {
            en: "Test your knowledge of in the house",
            es: "Prueba tus conocimientos de en la casa",
          },
          xpRequired: 1055,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "house and rooms",
            },
            grammar: {
              topics: ["house and rooms structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-14",
      title: {
        en: "Clothing",
        es: "Ropa",
      },
      description: {
        en: "What you wear",
        es: "Lo que vistes",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-14-1",
          title: {
            en: "What to Wear",
            es: "Qué Ponerse",
          },
          description: {
            en: "Learn key vocabulary for clothing",
            es: "Aprende vocabulario clave para ropa",
          },
          xpRequired: 1085,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "clothing",
            },
            grammar: {
              topic: "clothing structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-14-2",
          title: {
            en: "Shopping for Clothes",
            es: "Comprando Ropa",
          },
          description: {
            en: "Practice clothing in conversation",
            es: "Practica ropa en conversación",
          },
          xpRequired: 1100,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "clothing conversation",
              prompt: "Practice using clothing in real conversation",
            },
            stories: {
              topic: "clothing",
              prompt: "Read and discuss clothing",
            },
          },
        },
        {
          id: "lesson-a1-14-3",
          title: {
            en: "My Wardrobe",
            es: "Mi Guardarropa",
          },
          description: {
            en: "Apply clothing skills",
            es: "Aplica habilidades de ropa",
          },
          xpRequired: 1115,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "clothing",
              prompt: "Advanced clothing content and comprehension",
            },
            realtime: {
              scenario: "clothing mastery",
              prompt: "Demonstrate mastery of clothing",
            },
          },
        },
        {
          id: "lesson-a1-14-quiz",
          title: {
            en: "Clothing Quiz",
            es: "Prueba de Ropa",
          },
          description: {
            en: "Test your knowledge of clothing",
            es: "Prueba tus conocimientos de ropa",
          },
          xpRequired: 1130,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "clothing",
            },
            grammar: {
              topics: ["clothing structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-15",
      title: {
        en: "Daily Routine",
        es: "Rutina Diaria",
      },
      description: {
        en: "Your day",
        es: "Tu día",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-15-1",
          title: {
            en: "My Day",
            es: "Mi Día",
          },
          description: {
            en: "Learn key vocabulary for daily routine",
            es: "Aprende vocabulario clave para rutina diaria",
          },
          xpRequired: 1160,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "daily activities",
            },
            grammar: {
              topic: "daily activities structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-15-2",
          title: {
            en: "Daily Activities",
            es: "Actividades Diarias",
          },
          description: {
            en: "Practice daily routine in conversation",
            es: "Practica rutina diaria en conversación",
          },
          xpRequired: 1175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "daily activities conversation",
              prompt: "Practice using daily activities in real conversation",
            },
            stories: {
              topic: "daily activities",
              prompt: "Read and discuss daily activities",
            },
          },
        },
        {
          id: "lesson-a1-15-3",
          title: {
            en: "From Morning to Night",
            es: "De la Mañana a la Noche",
          },
          description: {
            en: "Apply daily routine skills",
            es: "Aplica habilidades de rutina diaria",
          },
          xpRequired: 1190,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "daily activities",
              prompt: "Advanced daily activities content and comprehension",
            },
            realtime: {
              scenario: "daily activities mastery",
              prompt: "Demonstrate mastery of daily activities",
            },
          },
        },
        {
          id: "lesson-a1-15-quiz",
          title: {
            en: "Daily Routine Quiz",
            es: "Prueba de Rutina Diaria",
          },
          description: {
            en: "Test your knowledge of daily routine",
            es: "Prueba tus conocimientos de rutina diaria",
          },
          xpRequired: 1205,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "daily activities",
            },
            grammar: {
              topics: ["daily activities structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-16",
      title: {
        en: "Weather",
        es: "Clima",
      },
      description: {
        en: "Talk about weather",
        es: "Habla del clima",
      },
      color: "#3B82F6",
      position: { row: 7, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-16-1",
          title: {
            en: "How's the Weather?",
            es: "¿Cómo Está el Clima?",
          },
          description: {
            en: "Learn key vocabulary for weather",
            es: "Aprende vocabulario clave para clima",
          },
          xpRequired: 1235,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "weather",
            },
            grammar: {
              topic: "weather structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-16-2",
          title: {
            en: "Four Seasons",
            es: "Cuatro Estaciones",
          },
          description: {
            en: "Practice weather in conversation",
            es: "Practica clima en conversación",
          },
          xpRequired: 1250,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "weather conversation",
              prompt: "Practice using weather in real conversation",
            },
            stories: {
              topic: "weather",
              prompt: "Read and discuss weather",
            },
          },
        },
        {
          id: "lesson-a1-16-3",
          title: {
            en: "Weather Reports",
            es: "Reportes del Clima",
          },
          description: {
            en: "Apply weather skills",
            es: "Aplica habilidades de clima",
          },
          xpRequired: 1265,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "weather",
              prompt: "Advanced weather content and comprehension",
            },
            realtime: {
              scenario: "weather mastery",
              prompt: "Demonstrate mastery of weather",
            },
          },
        },
        {
          id: "lesson-a1-16-quiz",
          title: {
            en: "Weather Quiz",
            es: "Prueba de Clima",
          },
          description: {
            en: "Test your knowledge of weather",
            es: "Prueba tus conocimientos de clima",
          },
          xpRequired: 1280,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "weather",
            },
            grammar: {
              topics: ["weather structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-17",
      title: {
        en: "Likes & Dislikes",
        es: "Gustos",
      },
      description: {
        en: "Preferences",
        es: "Preferencias",
      },
      color: "#F59E0B",
      position: { row: 8, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-17-1",
          title: {
            en: "I Like, I Love",
            es: "Me Gusta, Me Encanta",
          },
          description: {
            en: "Learn key vocabulary for likes & dislikes",
            es: "Aprende vocabulario clave para gustos",
          },
          xpRequired: 1310,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "preferences",
            },
            grammar: {
              topic: "preferences structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-17-2",
          title: {
            en: "Expressing Preferences",
            es: "Expresando Preferencias",
          },
          description: {
            en: "Practice likes & dislikes in conversation",
            es: "Practica gustos en conversación",
          },
          xpRequired: 1325,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "preferences conversation",
              prompt: "Practice using preferences in real conversation",
            },
            stories: {
              topic: "preferences",
              prompt: "Read and discuss preferences",
            },
          },
        },
        {
          id: "lesson-a1-17-3",
          title: {
            en: "Favorites and Dislikes",
            es: "Favoritos y Disgustos",
          },
          description: {
            en: "Apply likes & dislikes skills",
            es: "Aplica habilidades de gustos",
          },
          xpRequired: 1340,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "preferences",
              prompt: "Advanced preferences content and comprehension",
            },
            realtime: {
              scenario: "preferences mastery",
              prompt: "Demonstrate mastery of preferences",
            },
          },
        },
        {
          id: "lesson-a1-17-quiz",
          title: {
            en: "Likes & Dislikes Quiz",
            es: "Prueba de Gustos",
          },
          description: {
            en: "Test your knowledge of likes & dislikes",
            es: "Prueba tus conocimientos de gustos",
          },
          xpRequired: 1355,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "preferences",
            },
            grammar: {
              topics: ["preferences structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-18",
      title: {
        en: "Basic Questions",
        es: "Preguntas",
      },
      description: {
        en: "Ask questions",
        es: "Haz preguntas",
      },
      color: "#8B5CF6",
      position: { row: 8, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-18-1",
          title: {
            en: "Question Words",
            es: "Palabras de Pregunta",
          },
          description: {
            en: "Learn key vocabulary for basic questions",
            es: "Aprende vocabulario clave para preguntas",
          },
          xpRequired: 1385,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "question words",
            },
            grammar: {
              topic: "question words structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a1-18-2",
          title: {
            en: "Asking Questions",
            es: "Haciendo Preguntas",
          },
          description: {
            en: "Practice basic questions in conversation",
            es: "Practica preguntas en conversación",
          },
          xpRequired: 1400,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "question words conversation",
              prompt: "Practice using question words in real conversation",
            },
            stories: {
              topic: "question words",
              prompt: "Read and discuss question words",
            },
          },
        },
        {
          id: "lesson-a1-18-3",
          title: {
            en: "Getting Information",
            es: "Obteniendo Información",
          },
          description: {
            en: "Apply basic questions skills",
            es: "Aplica habilidades de preguntas",
          },
          xpRequired: 1415,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "question words",
              prompt: "Advanced question words content and comprehension",
            },
            realtime: {
              scenario: "question words mastery",
              prompt: "Demonstrate mastery of question words",
            },
          },
        },
        {
          id: "lesson-a1-18-quiz",
          title: {
            en: "Basic Questions Quiz",
            es: "Prueba de Preguntas",
          },
          description: {
            en: "Test your knowledge of basic questions",
            es: "Prueba tus conocimientos de preguntas",
          },
          xpRequired: 1430,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "question words",
            },
            grammar: {
              topics: ["question words structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
  ],
  A2: [
    {
      id: "unit-a2-1",
      title: {
        en: "Describing People",
        es: "Describir Personas",
      },
      description: {
        en: "Physical descriptions",
        es: "Descripciones físicas",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-1-1",
          title: {
            en: "Appearance Words",
            es: "Palabras de Apariencia",
          },
          description: {
            en: "Learn key vocabulary for describing people",
            es: "Aprende vocabulario clave para describir personas",
          },
          xpRequired: 1350,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "physical descriptions",
            },
            grammar: {
              topic: "physical descriptions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-1-2",
          title: {
            en: "How Do They Look?",
            es: "¿Cómo Se Ven?",
          },
          description: {
            en: "Practice describing people in conversation",
            es: "Practica describir personas en conversación",
          },
          xpRequired: 1370,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "physical descriptions conversation",
              prompt:
                "Practice using physical descriptions in real conversation",
            },
            stories: {
              topic: "physical descriptions",
              prompt: "Read and discuss physical descriptions",
            },
          },
        },
        {
          id: "lesson-a2-1-3",
          title: {
            en: "Detailed Descriptions",
            es: "Descripciones Detalladas",
          },
          description: {
            en: "Apply describing people skills",
            es: "Aplica habilidades de describir personas",
          },
          xpRequired: 1390,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "physical descriptions",
              prompt:
                "Advanced physical descriptions content and comprehension",
            },
            realtime: {
              scenario: "physical descriptions mastery",
              prompt: "Demonstrate mastery of physical descriptions",
            },
          },
        },
        {
          id: "lesson-a2-1-quiz",
          title: {
            en: "Describing People Quiz",
            es: "Prueba de Describir Personas",
          },
          description: {
            en: "Test your knowledge of describing people",
            es: "Prueba tus conocimientos de describir personas",
          },
          xpRequired: 1410,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "physical descriptions",
            },
            grammar: {
              topics: ["physical descriptions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-2",
      title: {
        en: "Describing Places",
        es: "Describir Lugares",
      },
      description: {
        en: "Talk about locations",
        es: "Habla sobre lugares",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-2-1",
          title: {
            en: "Places Around Town",
            es: "Lugares en la Ciudad",
          },
          description: {
            en: "Learn key vocabulary for describing places",
            es: "Aprende vocabulario clave para describir lugares",
          },
          xpRequired: 1450,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "places",
            },
            grammar: {
              topic: "places structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-2-2",
          title: {
            en: "My Neighborhood",
            es: "Mi Vecindario",
          },
          description: {
            en: "Practice describing places in conversation",
            es: "Practica describir lugares en conversación",
          },
          xpRequired: 1470,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "places conversation",
              prompt: "Practice using places in real conversation",
            },
            stories: {
              topic: "places",
              prompt: "Read and discuss places",
            },
          },
        },
        {
          id: "lesson-a2-2-3",
          title: {
            en: "Dream Destinations",
            es: "Destinos Soñados",
          },
          description: {
            en: "Apply describing places skills",
            es: "Aplica habilidades de describir lugares",
          },
          xpRequired: 1490,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "places",
              prompt: "Advanced places content and comprehension",
            },
            realtime: {
              scenario: "places mastery",
              prompt: "Demonstrate mastery of places",
            },
          },
        },
        {
          id: "lesson-a2-2-quiz",
          title: {
            en: "Describing Places Quiz",
            es: "Prueba de Describir Lugares",
          },
          description: {
            en: "Test your knowledge of describing places",
            es: "Prueba tus conocimientos de describir lugares",
          },
          xpRequired: 1510,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "places",
            },
            grammar: {
              topics: ["places structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-3",
      title: {
        en: "Shopping & Money",
        es: "Compras y Dinero",
      },
      description: {
        en: "Buy things",
        es: "Compra cosas",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-3-1",
          title: {
            en: "At the Store",
            es: "En la Tienda",
          },
          description: {
            en: "Learn key vocabulary for shopping & money",
            es: "Aprende vocabulario clave para compras y dinero",
          },
          xpRequired: 1550,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topic: "shopping structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-3-2",
          title: {
            en: "Bargain Hunting",
            es: "Buscando Ofertas",
          },
          description: {
            en: "Practice shopping & money in conversation",
            es: "Practica compras y dinero en conversación",
          },
          xpRequired: 1570,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "shopping conversation",
              prompt: "Practice using shopping in real conversation",
            },
            stories: {
              topic: "shopping",
              prompt: "Read and discuss shopping",
            },
          },
        },
        {
          id: "lesson-a2-3-3",
          title: {
            en: "Smart Shopping",
            es: "Comprando Inteligentemente",
          },
          description: {
            en: "Apply shopping & money skills",
            es: "Aplica habilidades de compras y dinero",
          },
          xpRequired: 1590,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "shopping",
              prompt: "Advanced shopping content and comprehension",
            },
            realtime: {
              scenario: "shopping mastery",
              prompt: "Demonstrate mastery of shopping",
            },
          },
        },
        {
          id: "lesson-a2-3-quiz",
          title: {
            en: "Shopping & Money Quiz",
            es: "Prueba de Compras y Dinero",
          },
          description: {
            en: "Test your knowledge of shopping & money",
            es: "Prueba tus conocimientos de compras y dinero",
          },
          xpRequired: 1610,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topics: ["shopping structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-4",
      title: {
        en: "At the Market",
        es: "En el Mercado",
      },
      description: {
        en: "Fresh food shopping",
        es: "Compra de alimentos",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-4-1",
          title: {
            en: "Fresh Produce",
            es: "Productos Frescos",
          },
          description: {
            en: "Learn key vocabulary for at the market",
            es: "Aprende vocabulario clave para en el mercado",
          },
          xpRequired: 1650,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topic: "shopping structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-4-2",
          title: {
            en: "Buying Groceries",
            es: "Comprando Comestibles",
          },
          description: {
            en: "Practice at the market in conversation",
            es: "Practica en el mercado en conversación",
          },
          xpRequired: 1670,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "shopping conversation",
              prompt: "Practice using shopping in real conversation",
            },
            stories: {
              topic: "shopping",
              prompt: "Read and discuss shopping",
            },
          },
        },
        {
          id: "lesson-a2-4-3",
          title: {
            en: "Market Day",
            es: "Día de Mercado",
          },
          description: {
            en: "Apply at the market skills",
            es: "Aplica habilidades de en el mercado",
          },
          xpRequired: 1690,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "shopping",
              prompt: "Advanced shopping content and comprehension",
            },
            realtime: {
              scenario: "shopping mastery",
              prompt: "Demonstrate mastery of shopping",
            },
          },
        },
        {
          id: "lesson-a2-4-quiz",
          title: {
            en: "At the Market Quiz",
            es: "Prueba de En el Mercado",
          },
          description: {
            en: "Test your knowledge of at the market",
            es: "Prueba tus conocimientos de en el mercado",
          },
          xpRequired: 1710,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topics: ["shopping structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-5",
      title: {
        en: "Transportation",
        es: "Transporte",
      },
      description: {
        en: "Getting around",
        es: "Moverse",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-5-1",
          title: {
            en: "Getting Around",
            es: "Moviéndose",
          },
          description: {
            en: "Learn key vocabulary for transportation",
            es: "Aprende vocabulario clave para transporte",
          },
          xpRequired: 1750,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "transportation",
            },
            grammar: {
              topic: "transportation structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-5-2",
          title: {
            en: "Taking the Bus",
            es: "Tomando el Autobús",
          },
          description: {
            en: "Practice transportation in conversation",
            es: "Practica transporte en conversación",
          },
          xpRequired: 1770,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "transportation conversation",
              prompt: "Practice using transportation in real conversation",
            },
            stories: {
              topic: "transportation",
              prompt: "Read and discuss transportation",
            },
          },
        },
        {
          id: "lesson-a2-5-3",
          title: {
            en: "Travel Options",
            es: "Opciones de Viaje",
          },
          description: {
            en: "Apply transportation skills",
            es: "Aplica habilidades de transporte",
          },
          xpRequired: 1790,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "transportation",
              prompt: "Advanced transportation content and comprehension",
            },
            realtime: {
              scenario: "transportation mastery",
              prompt: "Demonstrate mastery of transportation",
            },
          },
        },
        {
          id: "lesson-a2-5-quiz",
          title: {
            en: "Transportation Quiz",
            es: "Prueba de Transporte",
          },
          description: {
            en: "Test your knowledge of transportation",
            es: "Prueba tus conocimientos de transporte",
          },
          xpRequired: 1810,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "transportation",
            },
            grammar: {
              topics: ["transportation structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-6",
      title: {
        en: "Directions",
        es: "Direcciones",
      },
      description: {
        en: "Find your way",
        es: "Encuentra tu camino",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-6-1",
          title: {
            en: "Left and Right",
            es: "Izquierda y Derecha",
          },
          description: {
            en: "Learn key vocabulary for directions",
            es: "Aprende vocabulario clave para direcciones",
          },
          xpRequired: 1850,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "directions",
            },
            grammar: {
              topic: "directions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-6-2",
          title: {
            en: "How Do I Get There?",
            es: "¿Cómo Llego Ahí?",
          },
          description: {
            en: "Practice directions in conversation",
            es: "Practica direcciones en conversación",
          },
          xpRequired: 1870,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "directions conversation",
              prompt: "Practice using directions in real conversation",
            },
            stories: {
              topic: "directions",
              prompt: "Read and discuss directions",
            },
          },
        },
        {
          id: "lesson-a2-6-3",
          title: {
            en: "Finding Your Way",
            es: "Encontrando Tu Camino",
          },
          description: {
            en: "Apply directions skills",
            es: "Aplica habilidades de direcciones",
          },
          xpRequired: 1890,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "directions",
              prompt: "Advanced directions content and comprehension",
            },
            realtime: {
              scenario: "directions mastery",
              prompt: "Demonstrate mastery of directions",
            },
          },
        },
        {
          id: "lesson-a2-6-quiz",
          title: {
            en: "Directions Quiz",
            es: "Prueba de Direcciones",
          },
          description: {
            en: "Test your knowledge of directions",
            es: "Prueba tus conocimientos de direcciones",
          },
          xpRequired: 1910,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "directions",
            },
            grammar: {
              topics: ["directions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-7",
      title: {
        en: "Making Plans",
        es: "Hacer Planes",
      },
      description: {
        en: "Social arrangements",
        es: "Arreglos sociales",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-7-1",
          title: {
            en: "Future Activities",
            es: "Actividades Futuras",
          },
          description: {
            en: "Learn key vocabulary for making plans",
            es: "Aprende vocabulario clave para hacer planes",
          },
          xpRequired: 1950,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "invitations",
            },
            grammar: {
              topic: "invitations structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-7-2",
          title: {
            en: "Let's Meet Up!",
            es: "¡Vamos a Reunirnos!",
          },
          description: {
            en: "Practice making plans in conversation",
            es: "Practica hacer planes en conversación",
          },
          xpRequired: 1970,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "invitations conversation",
              prompt: "Practice using invitations in real conversation",
            },
            stories: {
              topic: "invitations",
              prompt: "Read and discuss invitations",
            },
          },
        },
        {
          id: "lesson-a2-7-3",
          title: {
            en: "Scheduling Events",
            es: "Programando Eventos",
          },
          description: {
            en: "Apply making plans skills",
            es: "Aplica habilidades de hacer planes",
          },
          xpRequired: 1990,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "invitations",
              prompt: "Advanced invitations content and comprehension",
            },
            realtime: {
              scenario: "invitations mastery",
              prompt: "Demonstrate mastery of invitations",
            },
          },
        },
        {
          id: "lesson-a2-7-quiz",
          title: {
            en: "Making Plans Quiz",
            es: "Prueba de Hacer Planes",
          },
          description: {
            en: "Test your knowledge of making plans",
            es: "Prueba tus conocimientos de hacer planes",
          },
          xpRequired: 2010,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "invitations",
            },
            grammar: {
              topics: ["invitations structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-8",
      title: {
        en: "Hobbies & Interests",
        es: "Pasatiempos",
      },
      description: {
        en: "Free time",
        es: "Tiempo libre",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-8-1",
          title: {
            en: "Free Time Fun",
            es: "Pasatiempos - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for hobbies & interests",
            es: "Aprende vocabulario clave para pasatiempos",
          },
          xpRequired: 2050,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "arts and reading",
            },
            grammar: {
              topic: "arts and reading structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-8-2",
          title: {
            en: "What Do You Enjoy?",
            es: "Pasatiempos - Práctica",
          },
          description: {
            en: "Practice hobbies & interests in conversation",
            es: "Practica pasatiempos en conversación",
          },
          xpRequired: 2070,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "arts and reading conversation",
              prompt: "Practice using arts and reading in real conversation",
            },
            stories: {
              topic: "arts and reading",
              prompt: "Read and discuss arts and reading",
            },
          },
        },
        {
          id: "lesson-a2-8-3",
          title: {
            en: "Sharing Interests",
            es: "Pasatiempos - Aplicación",
          },
          description: {
            en: "Apply hobbies & interests skills",
            es: "Aplica habilidades de pasatiempos",
          },
          xpRequired: 2090,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "arts and reading",
              prompt: "Advanced arts and reading content and comprehension",
            },
            realtime: {
              scenario: "arts and reading mastery",
              prompt: "Demonstrate mastery of arts and reading",
            },
          },
        },
        {
          id: "lesson-a2-8-quiz",
          title: {
            en: "Hobbies & Interests Quiz",
            es: "Prueba de Pasatiempos",
          },
          description: {
            en: "Test your knowledge of hobbies & interests",
            es: "Prueba tus conocimientos de pasatiempos",
          },
          xpRequired: 2110,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "arts and reading",
            },
            grammar: {
              topics: ["arts and reading structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-9",
      title: {
        en: "Sports & Exercise",
        es: "Deportes",
      },
      description: {
        en: "Athletic activities",
        es: "Actividades atléticas",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-9-1",
          title: {
            en: "Playing Sports",
            es: "Deportes - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for sports & exercise",
            es: "Aprende vocabulario clave para deportes",
          },
          xpRequired: 2150,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "sports",
            },
            grammar: {
              topic: "sports structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-9-2",
          title: {
            en: "Staying Active",
            es: "Deportes - Práctica",
          },
          description: {
            en: "Practice sports & exercise in conversation",
            es: "Practica deportes en conversación",
          },
          xpRequired: 2170,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "sports conversation",
              prompt: "Practice using sports in real conversation",
            },
            stories: {
              topic: "sports",
              prompt: "Read and discuss sports",
            },
          },
        },
        {
          id: "lesson-a2-9-3",
          title: {
            en: "Fitness Goals",
            es: "Deportes - Aplicación",
          },
          description: {
            en: "Apply sports & exercise skills",
            es: "Aplica habilidades de deportes",
          },
          xpRequired: 2190,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "sports",
              prompt: "Advanced sports content and comprehension",
            },
            realtime: {
              scenario: "sports mastery",
              prompt: "Demonstrate mastery of sports",
            },
          },
        },
        {
          id: "lesson-a2-9-quiz",
          title: {
            en: "Sports & Exercise Quiz",
            es: "Prueba de Deportes",
          },
          description: {
            en: "Test your knowledge of sports & exercise",
            es: "Prueba tus conocimientos de deportes",
          },
          xpRequired: 2210,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "sports",
            },
            grammar: {
              topics: ["sports structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-10",
      title: {
        en: "Past Tense Regular",
        es: "Pasado Regular",
      },
      description: {
        en: "Regular past verbs",
        es: "Verbos pasados regulares",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-10-1",
          title: {
            en: "Yesterday's Actions",
            es: "Acciones de Ayer",
          },
          description: {
            en: "Learn key vocabulary for past tense regular",
            es: "Aprende vocabulario clave para pasado regular",
          },
          xpRequired: 2250,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-10-2",
          title: {
            en: "What Did You Do?",
            es: "¿Qué Hiciste?",
          },
          description: {
            en: "Practice past tense regular in conversation",
            es: "Practica pasado regular en conversación",
          },
          xpRequired: 2270,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-a2-10-3",
          title: {
            en: "Recent Events",
            es: "Eventos Recientes",
          },
          description: {
            en: "Apply past tense regular skills",
            es: "Aplica habilidades de pasado regular",
          },
          xpRequired: 2290,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-a2-10-quiz",
          title: {
            en: "Past Tense Regular Quiz",
            es: "Prueba de Pasado Regular",
          },
          description: {
            en: "Test your knowledge of past tense regular",
            es: "Prueba tus conocimientos de pasado regular",
          },
          xpRequired: 2310,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-11",
      title: {
        en: "Past Tense Irregular",
        es: "Pasado Irregular",
      },
      description: {
        en: "Irregular verbs",
        es: "Verbos irregulares",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-11-1",
          title: {
            en: "Common Irregular Verbs",
            es: "Verbos Irregulares Comunes",
          },
          description: {
            en: "Learn key vocabulary for past tense irregular",
            es: "Aprende vocabulario clave para pasado irregular",
          },
          xpRequired: 2350,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-11-2",
          title: {
            en: "Last Week",
            es: "La Semana Pasada",
          },
          description: {
            en: "Practice past tense irregular in conversation",
            es: "Practica pasado irregular en conversación",
          },
          xpRequired: 2370,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-a2-11-3",
          title: {
            en: "Life Stories",
            es: "Historias de Vida",
          },
          description: {
            en: "Apply past tense irregular skills",
            es: "Aplica habilidades de pasado irregular",
          },
          xpRequired: 2390,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-a2-11-quiz",
          title: {
            en: "Past Tense Irregular Quiz",
            es: "Prueba de Pasado Irregular",
          },
          description: {
            en: "Test your knowledge of past tense irregular",
            es: "Prueba tus conocimientos de pasado irregular",
          },
          xpRequired: 2410,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-12",
      title: {
        en: "Telling Stories",
        es: "Contar Historias",
      },
      description: {
        en: "Narrate events",
        es: "Narra eventos",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-12-1",
          title: {
            en: "Story Elements",
            es: "Elementos de Historia",
          },
          description: {
            en: "Learn key vocabulary for telling stories",
            es: "Aprende vocabulario clave para contar historias",
          },
          xpRequired: 2450,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topic: "narrative and storytelling structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-12-2",
          title: {
            en: "Once Upon a Time",
            es: "Érase Una Vez",
          },
          description: {
            en: "Practice telling stories in conversation",
            es: "Practica contar historias en conversación",
          },
          xpRequired: 2470,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "narrative and storytelling conversation",
              prompt:
                "Practice using narrative and storytelling in real conversation",
            },
            stories: {
              topic: "narrative and storytelling",
              prompt: "Read and discuss narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-a2-12-3",
          title: {
            en: "My Story",
            es: "Mi Historia",
          },
          description: {
            en: "Apply telling stories skills",
            es: "Aplica habilidades de contar historias",
          },
          xpRequired: 2490,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "narrative and storytelling",
              prompt:
                "Advanced narrative and storytelling content and comprehension",
            },
            realtime: {
              scenario: "narrative and storytelling mastery",
              prompt: "Demonstrate mastery of narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-a2-12-quiz",
          title: {
            en: "Telling Stories Quiz",
            es: "Prueba de Contar Historias",
          },
          description: {
            en: "Test your knowledge of telling stories",
            es: "Prueba tus conocimientos de contar historias",
          },
          xpRequired: 2510,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topics: ["narrative and storytelling structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-13",
      title: {
        en: "Future Plans",
        es: "Planes Futuros",
      },
      description: {
        en: "Future intentions",
        es: "Intenciones futuras",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-13-1",
          title: {
            en: "Dreams and Goals",
            es: "Sueños y Metas",
          },
          description: {
            en: "Learn key vocabulary for future plans",
            es: "Aprende vocabulario clave para planes futuros",
          },
          xpRequired: 2550,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-13-2",
          title: {
            en: "What Will You Do?",
            es: "¿Qué Harás?",
          },
          description: {
            en: "Practice future plans in conversation",
            es: "Practica planes futuros en conversación",
          },
          xpRequired: 2570,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-a2-13-3",
          title: {
            en: "Planning Ahead",
            es: "Planificando el Futuro",
          },
          description: {
            en: "Apply future plans skills",
            es: "Aplica habilidades de planes futuros",
          },
          xpRequired: 2590,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-a2-13-quiz",
          title: {
            en: "Future Plans Quiz",
            es: "Prueba de Planes Futuros",
          },
          description: {
            en: "Test your knowledge of future plans",
            es: "Prueba tus conocimientos de planes futuros",
          },
          xpRequired: 2610,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-14",
      title: {
        en: "Health & Body",
        es: "Salud y Cuerpo",
      },
      description: {
        en: "Body and health",
        es: "Cuerpo y salud",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-14-1",
          title: {
            en: "Body Parts",
            es: "Partes del Cuerpo",
          },
          description: {
            en: "Learn key vocabulary for health & body",
            es: "Aprende vocabulario clave para salud y cuerpo",
          },
          xpRequired: 2650,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "body parts",
            },
            grammar: {
              topic: "body parts structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-14-2",
          title: {
            en: "How Do You Feel?",
            es: "¿Cómo Te Sientes?",
          },
          description: {
            en: "Practice health & body in conversation",
            es: "Practica salud y cuerpo en conversación",
          },
          xpRequired: 2670,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "body parts conversation",
              prompt: "Practice using body parts in real conversation",
            },
            stories: {
              topic: "body parts",
              prompt: "Read and discuss body parts",
            },
          },
        },
        {
          id: "lesson-a2-14-3",
          title: {
            en: "Healthy Living",
            es: "Vida Saludable",
          },
          description: {
            en: "Apply health & body skills",
            es: "Aplica habilidades de salud y cuerpo",
          },
          xpRequired: 2690,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "body parts",
              prompt: "Advanced body parts content and comprehension",
            },
            realtime: {
              scenario: "body parts mastery",
              prompt: "Demonstrate mastery of body parts",
            },
          },
        },
        {
          id: "lesson-a2-14-quiz",
          title: {
            en: "Health & Body Quiz",
            es: "Prueba de Salud y Cuerpo",
          },
          description: {
            en: "Test your knowledge of health & body",
            es: "Prueba tus conocimientos de salud y cuerpo",
          },
          xpRequired: 2710,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "body parts",
            },
            grammar: {
              topics: ["body parts structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-15",
      title: {
        en: "At the Doctor's",
        es: "En el Médico",
      },
      description: {
        en: "Medical visits",
        es: "Visitas médicas",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-15-1",
          title: {
            en: "Medical Terms",
            es: "Términos Médicos",
          },
          description: {
            en: "Learn key vocabulary for at the doctor's",
            es: "Aprende vocabulario clave para en el médico",
          },
          xpRequired: 2750,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "health",
            },
            grammar: {
              topic: "health structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-15-2",
          title: {
            en: "Visiting the Doctor",
            es: "Visitando al Doctor",
          },
          description: {
            en: "Practice at the doctor's in conversation",
            es: "Practica en el médico en conversación",
          },
          xpRequired: 2770,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "health conversation",
              prompt: "Practice using health in real conversation",
            },
            stories: {
              topic: "health",
              prompt: "Read and discuss health",
            },
          },
        },
        {
          id: "lesson-a2-15-3",
          title: {
            en: "Health Concerns",
            es: "Preocupaciones de Salud",
          },
          description: {
            en: "Apply at the doctor's skills",
            es: "Aplica habilidades de en el médico",
          },
          xpRequired: 2790,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "health",
              prompt: "Advanced health content and comprehension",
            },
            realtime: {
              scenario: "health mastery",
              prompt: "Demonstrate mastery of health",
            },
          },
        },
        {
          id: "lesson-a2-15-quiz",
          title: {
            en: "At the Doctor's Quiz",
            es: "Prueba de En el Médico",
          },
          description: {
            en: "Test your knowledge of at the doctor's",
            es: "Prueba tus conocimientos de en el médico",
          },
          xpRequired: 2810,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "health",
            },
            grammar: {
              topics: ["health structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-16",
      title: {
        en: "Jobs & Professions",
        es: "Trabajos",
      },
      description: {
        en: "Different careers",
        es: "Diferentes carreras",
      },
      color: "#3B82F6",
      position: { row: 7, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-16-1",
          title: {
            en: "Career Words",
            es: "Trabajos - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for jobs & professions",
            es: "Aprende vocabulario clave para trabajos",
          },
          xpRequired: 2850,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "careers",
            },
            grammar: {
              topic: "careers structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-16-2",
          title: {
            en: "What Do You Do?",
            es: "Trabajos - Práctica",
          },
          description: {
            en: "Practice jobs & professions in conversation",
            es: "Practica trabajos en conversación",
          },
          xpRequired: 2870,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "careers conversation",
              prompt: "Practice using careers in real conversation",
            },
            stories: {
              topic: "careers",
              prompt: "Read and discuss careers",
            },
          },
        },
        {
          id: "lesson-a2-16-3",
          title: {
            en: "Dream Job",
            es: "Trabajos - Aplicación",
          },
          description: {
            en: "Apply jobs & professions skills",
            es: "Aplica habilidades de trabajos",
          },
          xpRequired: 2890,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "careers",
              prompt: "Advanced careers content and comprehension",
            },
            realtime: {
              scenario: "careers mastery",
              prompt: "Demonstrate mastery of careers",
            },
          },
        },
        {
          id: "lesson-a2-16-quiz",
          title: {
            en: "Jobs & Professions Quiz",
            es: "Prueba de Trabajos",
          },
          description: {
            en: "Test your knowledge of jobs & professions",
            es: "Prueba tus conocimientos de trabajos",
          },
          xpRequired: 2910,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "careers",
            },
            grammar: {
              topics: ["careers structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-17",
      title: {
        en: "School & Education",
        es: "Escuela",
      },
      description: {
        en: "Educational topics",
        es: "Temas educativos",
      },
      color: "#F59E0B",
      position: { row: 8, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-17-1",
          title: {
            en: "In the Classroom",
            es: "Escuela - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for school & education",
            es: "Aprende vocabulario clave para escuela",
          },
          xpRequired: 2950,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "education",
            },
            grammar: {
              topic: "education structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-17-2",
          title: {
            en: "School Life",
            es: "Escuela - Práctica",
          },
          description: {
            en: "Practice school & education in conversation",
            es: "Practica escuela en conversación",
          },
          xpRequired: 2970,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "education conversation",
              prompt: "Practice using education in real conversation",
            },
            stories: {
              topic: "education",
              prompt: "Read and discuss education",
            },
          },
        },
        {
          id: "lesson-a2-17-3",
          title: {
            en: "Learning Journey",
            es: "Escuela - Aplicación",
          },
          description: {
            en: "Apply school & education skills",
            es: "Aplica habilidades de escuela",
          },
          xpRequired: 2990,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "education",
              prompt: "Advanced education content and comprehension",
            },
            realtime: {
              scenario: "education mastery",
              prompt: "Demonstrate mastery of education",
            },
          },
        },
        {
          id: "lesson-a2-17-quiz",
          title: {
            en: "School & Education Quiz",
            es: "Prueba de Escuela",
          },
          description: {
            en: "Test your knowledge of school & education",
            es: "Prueba tus conocimientos de escuela",
          },
          xpRequired: 3010,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "education",
            },
            grammar: {
              topics: ["education structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-a2-18",
      title: {
        en: "Technology Basics",
        es: "Tecnología",
      },
      description: {
        en: "Digital life",
        es: "Vida digital",
      },
      color: "#8B5CF6",
      position: { row: 8, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-18-1",
          title: {
            en: "Digital Devices",
            es: "Tecnología - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for technology basics",
            es: "Aprende vocabulario clave para tecnología",
          },
          xpRequired: 3050,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "digital communication",
            },
            grammar: {
              topic: "digital communication structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-18-2",
          title: {
            en: "Using Technology",
            es: "Tecnología - Práctica",
          },
          description: {
            en: "Practice technology basics in conversation",
            es: "Practica tecnología en conversación",
          },
          xpRequired: 3070,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "digital communication conversation",
              prompt:
                "Practice using digital communication in real conversation",
            },
            stories: {
              topic: "digital communication",
              prompt: "Read and discuss digital communication",
            },
          },
        },
        {
          id: "lesson-a2-18-3",
          title: {
            en: "Connected Life",
            es: "Tecnología - Aplicación",
          },
          description: {
            en: "Apply technology basics skills",
            es: "Aplica habilidades de tecnología",
          },
          xpRequired: 3090,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "digital communication",
              prompt:
                "Advanced digital communication content and comprehension",
            },
            realtime: {
              scenario: "digital communication mastery",
              prompt: "Demonstrate mastery of digital communication",
            },
          },
        },
        {
          id: "lesson-a2-18-quiz",
          title: {
            en: "Technology Basics Quiz",
            es: "Prueba de Tecnología",
          },
          description: {
            en: "Test your knowledge of technology basics",
            es: "Prueba tus conocimientos de tecnología",
          },
          xpRequired: 3110,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "digital communication",
            },
            grammar: {
              topics: ["digital communication structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
  ],
  B1: [
    {
      id: "unit-b1-1",
      title: {
        en: "Present Perfect",
        es: "Pretérito Perfecto",
      },
      description: {
        en: "Have done",
        es: "He hecho",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-1-1",
          title: {
            en: "Have You Ever?",
            es: "Pretérito Perfecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for present perfect",
            es: "Aprende vocabulario clave para pretérito perfecto",
          },
          xpRequired: 3150,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-1-2",
          title: {
            en: "Life Experiences",
            es: "Pretérito Perfecto - Práctica",
          },
          description: {
            en: "Practice present perfect in conversation",
            es: "Practica pretérito perfecto en conversación",
          },
          xpRequired: 3175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-b1-1-3",
          title: {
            en: "Achievements",
            es: "Pretérito Perfecto - Aplicación",
          },
          description: {
            en: "Apply present perfect skills",
            es: "Aplica habilidades de pretérito perfecto",
          },
          xpRequired: 3200,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-b1-1-quiz",
          title: {
            en: "Present Perfect Quiz",
            es: "Prueba de Pretérito Perfecto",
          },
          description: {
            en: "Test your knowledge of present perfect",
            es: "Prueba tus conocimientos de pretérito perfecto",
          },
          xpRequired: 3225,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-2",
      title: {
        en: "Past Continuous",
        es: "Pasado Continuo",
      },
      description: {
        en: "Was doing",
        es: "Estaba haciendo",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-2-1",
          title: {
            en: "While It Was Happening",
            es: "Mientras Sucedía",
          },
          description: {
            en: "Learn key vocabulary for past continuous",
            es: "Aprende vocabulario clave para pasado continuo",
          },
          xpRequired: 3275,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-2-2",
          title: {
            en: "Background Actions",
            es: "Acciones de Fondo",
          },
          description: {
            en: "Practice past continuous in conversation",
            es: "Practica pasado continuo en conversación",
          },
          xpRequired: 3300,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-b1-2-3",
          title: {
            en: "Setting the Scene",
            es: "Ambientando la Escena",
          },
          description: {
            en: "Apply past continuous skills",
            es: "Aplica habilidades de pasado continuo",
          },
          xpRequired: 3325,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-b1-2-quiz",
          title: {
            en: "Past Continuous Quiz",
            es: "Prueba de Pasado Continuo",
          },
          description: {
            en: "Test your knowledge of past continuous",
            es: "Prueba tus conocimientos de pasado continuo",
          },
          xpRequired: 3350,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-3",
      title: {
        en: "Future Tense",
        es: "Futuro",
      },
      description: {
        en: "Will do",
        es: "Haré",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-3-1",
          title: {
            en: "Tomorrow's World",
            es: "Futuro - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for future tense",
            es: "Aprende vocabulario clave para futuro",
          },
          xpRequired: 3400,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-3-2",
          title: {
            en: "Predictions",
            es: "Futuro - Práctica",
          },
          description: {
            en: "Practice future tense in conversation",
            es: "Practica futuro en conversación",
          },
          xpRequired: 3425,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-b1-3-3",
          title: {
            en: "Future Possibilities",
            es: "Futuro - Aplicación",
          },
          description: {
            en: "Apply future tense skills",
            es: "Aplica habilidades de futuro",
          },
          xpRequired: 3450,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-b1-3-quiz",
          title: {
            en: "Future Tense Quiz",
            es: "Prueba de Futuro",
          },
          description: {
            en: "Test your knowledge of future tense",
            es: "Prueba tus conocimientos de futuro",
          },
          xpRequired: 3475,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-4",
      title: {
        en: "Comparisons",
        es: "Comparaciones",
      },
      description: {
        en: "More, less, equal",
        es: "Más, menos, igual",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-4-1",
          title: {
            en: "Better or Worse",
            es: "Mejor o Peor",
          },
          description: {
            en: "Learn key vocabulary for comparisons",
            es: "Aprende vocabulario clave para comparaciones",
          },
          xpRequired: 3525,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "comparisons",
            },
            grammar: {
              topic: "comparisons structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-4-2",
          title: {
            en: "Making Comparisons",
            es: "Haciendo Comparaciones",
          },
          description: {
            en: "Practice comparisons in conversation",
            es: "Practica comparaciones en conversación",
          },
          xpRequired: 3550,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "comparisons conversation",
              prompt: "Practice using comparisons in real conversation",
            },
            stories: {
              topic: "comparisons",
              prompt: "Read and discuss comparisons",
            },
          },
        },
        {
          id: "lesson-b1-4-3",
          title: {
            en: "Superlatives",
            es: "Superlativos",
          },
          description: {
            en: "Apply comparisons skills",
            es: "Aplica habilidades de comparaciones",
          },
          xpRequired: 3575,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "comparisons",
              prompt: "Advanced comparisons content and comprehension",
            },
            realtime: {
              scenario: "comparisons mastery",
              prompt: "Demonstrate mastery of comparisons",
            },
          },
        },
        {
          id: "lesson-b1-4-quiz",
          title: {
            en: "Comparisons Quiz",
            es: "Prueba de Comparaciones",
          },
          description: {
            en: "Test your knowledge of comparisons",
            es: "Prueba tus conocimientos de comparaciones",
          },
          xpRequired: 3600,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "comparisons",
            },
            grammar: {
              topics: ["comparisons structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-5",
      title: {
        en: "Giving Advice",
        es: "Dar Consejos",
      },
      description: {
        en: "Should, must",
        es: "Debería, debe",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-5-1",
          title: {
            en: "Should and Shouldn't",
            es: "Deberías y No Deberías",
          },
          description: {
            en: "Learn key vocabulary for giving advice",
            es: "Aprende vocabulario clave para dar consejos",
          },
          xpRequired: 3650,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "advice and suggestions",
            },
            grammar: {
              topic: "advice and suggestions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-5-2",
          title: {
            en: "Helpful Suggestions",
            es: "Sugerencias Útiles",
          },
          description: {
            en: "Practice giving advice in conversation",
            es: "Practica dar consejos en conversación",
          },
          xpRequired: 3675,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "advice and suggestions conversation",
              prompt:
                "Practice using advice and suggestions in real conversation",
            },
            stories: {
              topic: "advice and suggestions",
              prompt: "Read and discuss advice and suggestions",
            },
          },
        },
        {
          id: "lesson-b1-5-3",
          title: {
            en: "Problem Solving",
            es: "Resolviendo Problemas",
          },
          description: {
            en: "Apply giving advice skills",
            es: "Aplica habilidades de dar consejos",
          },
          xpRequired: 3700,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "advice and suggestions",
              prompt:
                "Advanced advice and suggestions content and comprehension",
            },
            realtime: {
              scenario: "advice and suggestions mastery",
              prompt: "Demonstrate mastery of advice and suggestions",
            },
          },
        },
        {
          id: "lesson-b1-5-quiz",
          title: {
            en: "Giving Advice Quiz",
            es: "Prueba de Dar Consejos",
          },
          description: {
            en: "Test your knowledge of giving advice",
            es: "Prueba tus conocimientos de dar consejos",
          },
          xpRequired: 3725,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "advice and suggestions",
            },
            grammar: {
              topics: ["advice and suggestions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-6",
      title: {
        en: "Making Suggestions",
        es: "Hacer Sugerencias",
      },
      description: {
        en: "Let's, why don't we",
        es: "Vamos, por qué no",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-6-1",
          title: {
            en: "Why Don't We?",
            es: "¿Por Qué No?",
          },
          description: {
            en: "Learn key vocabulary for making suggestions",
            es: "Aprende vocabulario clave para hacer sugerencias",
          },
          xpRequired: 3775,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "advice and suggestions",
            },
            grammar: {
              topic: "advice and suggestions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-6-2",
          title: {
            en: "Let's Try This",
            es: "Intentemos Esto",
          },
          description: {
            en: "Practice making suggestions in conversation",
            es: "Practica hacer sugerencias en conversación",
          },
          xpRequired: 3800,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "advice and suggestions conversation",
              prompt:
                "Practice using advice and suggestions in real conversation",
            },
            stories: {
              topic: "advice and suggestions",
              prompt: "Read and discuss advice and suggestions",
            },
          },
        },
        {
          id: "lesson-b1-6-3",
          title: {
            en: "Collaborative Ideas",
            es: "Ideas Colaborativas",
          },
          description: {
            en: "Apply making suggestions skills",
            es: "Aplica habilidades de hacer sugerencias",
          },
          xpRequired: 3825,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "advice and suggestions",
              prompt:
                "Advanced advice and suggestions content and comprehension",
            },
            realtime: {
              scenario: "advice and suggestions mastery",
              prompt: "Demonstrate mastery of advice and suggestions",
            },
          },
        },
        {
          id: "lesson-b1-6-quiz",
          title: {
            en: "Making Suggestions Quiz",
            es: "Prueba de Hacer Sugerencias",
          },
          description: {
            en: "Test your knowledge of making suggestions",
            es: "Prueba tus conocimientos de hacer sugerencias",
          },
          xpRequired: 3850,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "advice and suggestions",
            },
            grammar: {
              topics: ["advice and suggestions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-7",
      title: {
        en: "Conditional Would",
        es: "Condicional",
      },
      description: {
        en: "I would...",
        es: "Yo haría...",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-7-1",
          title: {
            en: "If I Were You",
            es: "Condicional - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for conditional would",
            es: "Aprende vocabulario clave para condicional",
          },
          xpRequired: 3900,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "conditional",
            },
            grammar: {
              topic: "conditional structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-7-2",
          title: {
            en: "Hypothetical Situations",
            es: "Condicional - Práctica",
          },
          description: {
            en: "Practice conditional would in conversation",
            es: "Practica condicional en conversación",
          },
          xpRequired: 3925,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "conditional conversation",
              prompt: "Practice using conditional in real conversation",
            },
            stories: {
              topic: "conditional",
              prompt: "Read and discuss conditional",
            },
          },
        },
        {
          id: "lesson-b1-7-3",
          title: {
            en: "Imagining Possibilities",
            es: "Condicional - Aplicación",
          },
          description: {
            en: "Apply conditional would skills",
            es: "Aplica habilidades de condicional",
          },
          xpRequired: 3950,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "conditional",
              prompt: "Advanced conditional content and comprehension",
            },
            realtime: {
              scenario: "conditional mastery",
              prompt: "Demonstrate mastery of conditional",
            },
          },
        },
        {
          id: "lesson-b1-7-quiz",
          title: {
            en: "Conditional Would Quiz",
            es: "Prueba de Condicional",
          },
          description: {
            en: "Test your knowledge of conditional would",
            es: "Prueba tus conocimientos de condicional",
          },
          xpRequired: 3975,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "conditional",
            },
            grammar: {
              topics: ["conditional structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-8",
      title: {
        en: "Travel & Tourism",
        es: "Viajes y Turismo",
      },
      description: {
        en: "Traveling abroad",
        es: "Viajar al extranjero",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-8-1",
          title: {
            en: "Trip Planning",
            es: "Planeando Viajes",
          },
          description: {
            en: "Learn key vocabulary for travel & tourism",
            es: "Aprende vocabulario clave para viajes y turismo",
          },
          xpRequired: 4025,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "travel",
            },
            grammar: {
              topic: "travel structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-8-2",
          title: {
            en: "Booking a Trip",
            es: "Reservando un Viaje",
          },
          description: {
            en: "Practice travel & tourism in conversation",
            es: "Practica viajes y turismo en conversación",
          },
          xpRequired: 4050,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "travel conversation",
              prompt: "Practice using travel in real conversation",
            },
            stories: {
              topic: "travel",
              prompt: "Read and discuss travel",
            },
          },
        },
        {
          id: "lesson-b1-8-3",
          title: {
            en: "Adventure Awaits",
            es: "La Aventura Espera",
          },
          description: {
            en: "Apply travel & tourism skills",
            es: "Aplica habilidades de viajes y turismo",
          },
          xpRequired: 4075,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "travel",
              prompt: "Advanced travel content and comprehension",
            },
            realtime: {
              scenario: "travel mastery",
              prompt: "Demonstrate mastery of travel",
            },
          },
        },
        {
          id: "lesson-b1-8-quiz",
          title: {
            en: "Travel & Tourism Quiz",
            es: "Prueba de Viajes y Turismo",
          },
          description: {
            en: "Test your knowledge of travel & tourism",
            es: "Prueba tus conocimientos de viajes y turismo",
          },
          xpRequired: 4100,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "travel",
            },
            grammar: {
              topics: ["travel structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-9",
      title: {
        en: "Environment",
        es: "Medio Ambiente",
      },
      description: {
        en: "Nature and ecology",
        es: "Naturaleza y ecología",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-9-1",
          title: {
            en: "Our Planet",
            es: "Nuestro Planeta",
          },
          description: {
            en: "Learn key vocabulary for environment",
            es: "Aprende vocabulario clave para medio ambiente",
          },
          xpRequired: 4150,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "environment",
            },
            grammar: {
              topic: "environment structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-9-2",
          title: {
            en: "Going Green",
            es: "Siendo Ecológico",
          },
          description: {
            en: "Practice environment in conversation",
            es: "Practica medio ambiente en conversación",
          },
          xpRequired: 4175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "environment conversation",
              prompt: "Practice using environment in real conversation",
            },
            stories: {
              topic: "environment",
              prompt: "Read and discuss environment",
            },
          },
        },
        {
          id: "lesson-b1-9-3",
          title: {
            en: "Saving Earth",
            es: "Salvando la Tierra",
          },
          description: {
            en: "Apply environment skills",
            es: "Aplica habilidades de medio ambiente",
          },
          xpRequired: 4200,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "environment",
              prompt: "Advanced environment content and comprehension",
            },
            realtime: {
              scenario: "environment mastery",
              prompt: "Demonstrate mastery of environment",
            },
          },
        },
        {
          id: "lesson-b1-9-quiz",
          title: {
            en: "Environment Quiz",
            es: "Prueba de Medio Ambiente",
          },
          description: {
            en: "Test your knowledge of environment",
            es: "Prueba tus conocimientos de medio ambiente",
          },
          xpRequired: 4225,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "environment",
            },
            grammar: {
              topics: ["environment structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-10",
      title: {
        en: "Culture & Traditions",
        es: "Cultura y Tradiciones",
      },
      description: {
        en: "Cultural practices",
        es: "Prácticas culturales",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-10-1",
          title: {
            en: "Cultural Heritage",
            es: "Patrimonio Cultural",
          },
          description: {
            en: "Learn key vocabulary for culture & traditions",
            es: "Aprende vocabulario clave para cultura y tradiciones",
          },
          xpRequired: 4275,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          id: "lesson-b1-10-2",
          title: {
            en: "Customs and Festivals",
            es: "Costumbres y Festivales",
          },
          description: {
            en: "Practice culture & traditions in conversation",
            es: "Practica cultura y tradiciones en conversación",
          },
          xpRequired: 4300,
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
          id: "lesson-b1-10-3",
          title: {
            en: "Celebrating Diversity",
            es: "Celebrando la Diversidad",
          },
          description: {
            en: "Apply culture & traditions skills",
            es: "Aplica habilidades de cultura y tradiciones",
          },
          xpRequired: 4325,
          xpReward: 45,
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
          id: "lesson-b1-10-quiz",
          title: {
            en: "Culture & Traditions Quiz",
            es: "Prueba de Cultura y Tradiciones",
          },
          description: {
            en: "Test your knowledge of culture & traditions",
            es: "Prueba tus conocimientos de cultura y tradiciones",
          },
          xpRequired: 4350,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
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
      id: "unit-b1-11",
      title: {
        en: "Media & News",
        es: "Medios y Noticias",
      },
      description: {
        en: "News and media",
        es: "Noticias y medios",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-11-1",
          title: {
            en: "Headlines",
            es: "Titulares",
          },
          description: {
            en: "Learn key vocabulary for media & news",
            es: "Aprende vocabulario clave para medios y noticias",
          },
          xpRequired: 4400,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "current events",
            },
            grammar: {
              topic: "current events structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-11-2",
          title: {
            en: "Current Events",
            es: "Eventos Actuales",
          },
          description: {
            en: "Practice media & news in conversation",
            es: "Practica medios y noticias en conversación",
          },
          xpRequired: 4425,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "current events conversation",
              prompt: "Practice using current events in real conversation",
            },
            stories: {
              topic: "current events",
              prompt: "Read and discuss current events",
            },
          },
        },
        {
          id: "lesson-b1-11-3",
          title: {
            en: "Informed Citizen",
            es: "Ciudadano Informado",
          },
          description: {
            en: "Apply media & news skills",
            es: "Aplica habilidades de medios y noticias",
          },
          xpRequired: 4450,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "current events",
              prompt: "Advanced current events content and comprehension",
            },
            realtime: {
              scenario: "current events mastery",
              prompt: "Demonstrate mastery of current events",
            },
          },
        },
        {
          id: "lesson-b1-11-quiz",
          title: {
            en: "Media & News Quiz",
            es: "Prueba de Medios y Noticias",
          },
          description: {
            en: "Test your knowledge of media & news",
            es: "Prueba tus conocimientos de medios y noticias",
          },
          xpRequired: 4475,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "current events",
            },
            grammar: {
              topics: ["current events structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-12",
      title: {
        en: "Expressing Opinions",
        es: "Expresar Opiniones",
      },
      description: {
        en: "I think that...",
        es: "Creo que...",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-12-1",
          title: {
            en: "I Think That...",
            es: "Creo Que...",
          },
          description: {
            en: "Learn key vocabulary for expressing opinions",
            es: "Aprende vocabulario clave para expresar opiniones",
          },
          xpRequired: 4525,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "opinions and debate",
            },
            grammar: {
              topic: "opinions and debate structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-12-2",
          title: {
            en: "Sharing Views",
            es: "Compartiendo Puntos de Vista",
          },
          description: {
            en: "Practice expressing opinions in conversation",
            es: "Practica expresar opiniones en conversación",
          },
          xpRequired: 4550,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "opinions and debate conversation",
              prompt: "Practice using opinions and debate in real conversation",
            },
            stories: {
              topic: "opinions and debate",
              prompt: "Read and discuss opinions and debate",
            },
          },
        },
        {
          id: "lesson-b1-12-3",
          title: {
            en: "Respectful Debate",
            es: "Debate Respetuoso",
          },
          description: {
            en: "Apply expressing opinions skills",
            es: "Aplica habilidades de expresar opiniones",
          },
          xpRequired: 4575,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "opinions and debate",
              prompt: "Advanced opinions and debate content and comprehension",
            },
            realtime: {
              scenario: "opinions and debate mastery",
              prompt: "Demonstrate mastery of opinions and debate",
            },
          },
        },
        {
          id: "lesson-b1-12-quiz",
          title: {
            en: "Expressing Opinions Quiz",
            es: "Prueba de Expresar Opiniones",
          },
          description: {
            en: "Test your knowledge of expressing opinions",
            es: "Prueba tus conocimientos de expresar opiniones",
          },
          xpRequired: 4600,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "opinions and debate",
            },
            grammar: {
              topics: ["opinions and debate structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-13",
      title: {
        en: "Making Complaints",
        es: "Quejas",
      },
      description: {
        en: "Express dissatisfaction",
        es: "Expresar insatisfacción",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-13-1",
          title: {
            en: "Something's Wrong",
            es: "Quejas - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for making complaints",
            es: "Aprende vocabulario clave para quejas",
          },
          xpRequired: 4650,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "complaints",
            },
            grammar: {
              topic: "complaints structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-13-2",
          title: {
            en: "I'm Not Satisfied",
            es: "Quejas - Práctica",
          },
          description: {
            en: "Practice making complaints in conversation",
            es: "Practica quejas en conversación",
          },
          xpRequired: 4675,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "complaints conversation",
              prompt: "Practice using complaints in real conversation",
            },
            stories: {
              topic: "complaints",
              prompt: "Read and discuss complaints",
            },
          },
        },
        {
          id: "lesson-b1-13-3",
          title: {
            en: "Resolving Issues",
            es: "Quejas - Aplicación",
          },
          description: {
            en: "Apply making complaints skills",
            es: "Aplica habilidades de quejas",
          },
          xpRequired: 4700,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "complaints",
              prompt: "Advanced complaints content and comprehension",
            },
            realtime: {
              scenario: "complaints mastery",
              prompt: "Demonstrate mastery of complaints",
            },
          },
        },
        {
          id: "lesson-b1-13-quiz",
          title: {
            en: "Making Complaints Quiz",
            es: "Prueba de Quejas",
          },
          description: {
            en: "Test your knowledge of making complaints",
            es: "Prueba tus conocimientos de quejas",
          },
          xpRequired: 4725,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "complaints",
            },
            grammar: {
              topics: ["complaints structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-14",
      title: {
        en: "Experiences",
        es: "Experiencias",
      },
      description: {
        en: "Life experiences",
        es: "Experiencias de vida",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-14-1",
          title: {
            en: "Memorable Moments",
            es: "Momentos Memorables",
          },
          description: {
            en: "Learn key vocabulary for experiences",
            es: "Aprende vocabulario clave para experiencias",
          },
          xpRequired: 4775,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "experiences",
            },
            grammar: {
              topic: "experiences structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-14-2",
          title: {
            en: "Sharing Experiences",
            es: "Compartiendo Experiencias",
          },
          description: {
            en: "Practice experiences in conversation",
            es: "Practica experiencias en conversación",
          },
          xpRequired: 4800,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "experiences conversation",
              prompt: "Practice using experiences in real conversation",
            },
            stories: {
              topic: "experiences",
              prompt: "Read and discuss experiences",
            },
          },
        },
        {
          id: "lesson-b1-14-3",
          title: {
            en: "Learning from Life",
            es: "Aprendiendo de la Vida",
          },
          description: {
            en: "Apply experiences skills",
            es: "Aplica habilidades de experiencias",
          },
          xpRequired: 4825,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "experiences",
              prompt: "Advanced experiences content and comprehension",
            },
            realtime: {
              scenario: "experiences mastery",
              prompt: "Demonstrate mastery of experiences",
            },
          },
        },
        {
          id: "lesson-b1-14-quiz",
          title: {
            en: "Experiences Quiz",
            es: "Prueba de Experiencias",
          },
          description: {
            en: "Test your knowledge of experiences",
            es: "Prueba tus conocimientos de experiencias",
          },
          xpRequired: 4850,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "experiences",
            },
            grammar: {
              topics: ["experiences structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-15",
      title: {
        en: "Probability",
        es: "Probabilidad",
      },
      description: {
        en: "Maybe, might",
        es: "Quizás, podría",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-15-1",
          title: {
            en: "Maybe and Perhaps",
            es: "Quizás y Tal Vez",
          },
          description: {
            en: "Learn key vocabulary for probability",
            es: "Aprende vocabulario clave para probabilidad",
          },
          xpRequired: 4900,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "probability",
            },
            grammar: {
              topic: "probability structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b1-15-2",
          title: {
            en: "Likely or Unlikely",
            es: "Probable o Improbable",
          },
          description: {
            en: "Practice probability in conversation",
            es: "Practica probabilidad en conversación",
          },
          xpRequired: 4925,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "probability conversation",
              prompt: "Practice using probability in real conversation",
            },
            stories: {
              topic: "probability",
              prompt: "Read and discuss probability",
            },
          },
        },
        {
          id: "lesson-b1-15-3",
          title: {
            en: "Making Predictions",
            es: "Haciendo Predicciones",
          },
          description: {
            en: "Apply probability skills",
            es: "Aplica habilidades de probabilidad",
          },
          xpRequired: 4950,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "probability",
              prompt: "Advanced probability content and comprehension",
            },
            realtime: {
              scenario: "probability mastery",
              prompt: "Demonstrate mastery of probability",
            },
          },
        },
        {
          id: "lesson-b1-15-quiz",
          title: {
            en: "Probability Quiz",
            es: "Prueba de Probabilidad",
          },
          description: {
            en: "Test your knowledge of probability",
            es: "Prueba tus conocimientos de probabilidad",
          },
          xpRequired: 4975,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "probability",
            },
            grammar: {
              topics: ["probability structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
  ],
  B2: [
    {
      id: "unit-b2-1",
      title: {
        en: "Past Perfect",
        es: "Pluscuamperfecto",
      },
      description: {
        en: "Had done",
        es: "Había hecho",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-1-1",
          title: {
            en: "Before It Happened",
            es: "Pluscuamperfecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for past perfect",
            es: "Aprende vocabulario clave para pluscuamperfecto",
          },
          xpRequired: 5025,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topic: "time expressions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-1-2",
          title: {
            en: "Earlier Actions",
            es: "Pluscuamperfecto - Práctica",
          },
          description: {
            en: "Practice past perfect in conversation",
            es: "Practica pluscuamperfecto en conversación",
          },
          xpRequired: 5055,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "time expressions conversation",
              prompt: "Practice using time expressions in real conversation",
            },
            stories: {
              topic: "time expressions",
              prompt: "Read and discuss time expressions",
            },
          },
        },
        {
          id: "lesson-b2-1-3",
          title: {
            en: "Complex Timelines",
            es: "Pluscuamperfecto - Aplicación",
          },
          description: {
            en: "Apply past perfect skills",
            es: "Aplica habilidades de pluscuamperfecto",
          },
          xpRequired: 5085,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "time expressions",
              prompt: "Advanced time expressions content and comprehension",
            },
            realtime: {
              scenario: "time expressions mastery",
              prompt: "Demonstrate mastery of time expressions",
            },
          },
        },
        {
          id: "lesson-b2-1-quiz",
          title: {
            en: "Past Perfect Quiz",
            es: "Prueba de Pluscuamperfecto",
          },
          description: {
            en: "Test your knowledge of past perfect",
            es: "Prueba tus conocimientos de pluscuamperfecto",
          },
          xpRequired: 5115,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions",
            },
            grammar: {
              topics: ["time expressions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-2",
      title: {
        en: "Passive Voice",
        es: "Voz Pasiva",
      },
      description: {
        en: "Is done by",
        es: "Es hecho por",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-2-1",
          title: {
            en: "It Was Done",
            es: "Fue Hecho",
          },
          description: {
            en: "Learn key vocabulary for passive voice",
            es: "Aprende vocabulario clave para voz pasiva",
          },
          xpRequired: 5175,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "passive",
            },
            grammar: {
              topic: "passive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-2-2",
          title: {
            en: "Formal Writing",
            es: "Escritura Formal",
          },
          description: {
            en: "Practice passive voice in conversation",
            es: "Practica voz pasiva en conversación",
          },
          xpRequired: 5205,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "passive conversation",
              prompt: "Practice using passive in real conversation",
            },
            stories: {
              topic: "passive",
              prompt: "Read and discuss passive",
            },
          },
        },
        {
          id: "lesson-b2-2-3",
          title: {
            en: "Professional Tone",
            es: "Tono Profesional",
          },
          description: {
            en: "Apply passive voice skills",
            es: "Aplica habilidades de voz pasiva",
          },
          xpRequired: 5235,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "passive",
              prompt: "Advanced passive content and comprehension",
            },
            realtime: {
              scenario: "passive mastery",
              prompt: "Demonstrate mastery of passive",
            },
          },
        },
        {
          id: "lesson-b2-2-quiz",
          title: {
            en: "Passive Voice Quiz",
            es: "Prueba de Voz Pasiva",
          },
          description: {
            en: "Test your knowledge of passive voice",
            es: "Prueba tus conocimientos de voz pasiva",
          },
          xpRequired: 5265,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "passive",
            },
            grammar: {
              topics: ["passive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-3",
      title: {
        en: "Reported Speech",
        es: "Discurso Indirecto",
      },
      description: {
        en: "He said that...",
        es: "Él dijo que...",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-3-1",
          title: {
            en: "She Said That...",
            es: "Discurso Indirecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for reported speech",
            es: "Aprende vocabulario clave para discurso indirecto",
          },
          xpRequired: 5325,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topic: "narrative and storytelling structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-3-2",
          title: {
            en: "Quoting Others",
            es: "Discurso Indirecto - Práctica",
          },
          description: {
            en: "Practice reported speech in conversation",
            es: "Practica discurso indirecto en conversación",
          },
          xpRequired: 5355,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "narrative and storytelling conversation",
              prompt:
                "Practice using narrative and storytelling in real conversation",
            },
            stories: {
              topic: "narrative and storytelling",
              prompt: "Read and discuss narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-b2-3-3",
          title: {
            en: "Retelling Stories",
            es: "Discurso Indirecto - Aplicación",
          },
          description: {
            en: "Apply reported speech skills",
            es: "Aplica habilidades de discurso indirecto",
          },
          xpRequired: 5385,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "narrative and storytelling",
              prompt:
                "Advanced narrative and storytelling content and comprehension",
            },
            realtime: {
              scenario: "narrative and storytelling mastery",
              prompt: "Demonstrate mastery of narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-b2-3-quiz",
          title: {
            en: "Reported Speech Quiz",
            es: "Prueba de Discurso Indirecto",
          },
          description: {
            en: "Test your knowledge of reported speech",
            es: "Prueba tus conocimientos de discurso indirecto",
          },
          xpRequired: 5415,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topics: ["narrative and storytelling structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-4",
      title: {
        en: "Relative Clauses",
        es: "Cláusulas Relativas",
      },
      description: {
        en: "Who, which, that",
        es: "Que, quien",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-4-1",
          title: {
            en: "Who, Which, That",
            es: "Quien, Cual, Que",
          },
          description: {
            en: "Learn key vocabulary for relative clauses",
            es: "Aprende vocabulario clave para cláusulas relativas",
          },
          xpRequired: 5475,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "relative clauses",
            },
            grammar: {
              topic: "relative clauses structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-4-2",
          title: {
            en: "Connecting Ideas",
            es: "Conectando Ideas",
          },
          description: {
            en: "Practice relative clauses in conversation",
            es: "Practica cláusulas relativas en conversación",
          },
          xpRequired: 5505,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "relative clauses conversation",
              prompt: "Practice using relative clauses in real conversation",
            },
            stories: {
              topic: "relative clauses",
              prompt: "Read and discuss relative clauses",
            },
          },
        },
        {
          id: "lesson-b2-4-3",
          title: {
            en: "Complex Sentences",
            es: "Oraciones Complejas",
          },
          description: {
            en: "Apply relative clauses skills",
            es: "Aplica habilidades de cláusulas relativas",
          },
          xpRequired: 5535,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "relative clauses",
              prompt: "Advanced relative clauses content and comprehension",
            },
            realtime: {
              scenario: "relative clauses mastery",
              prompt: "Demonstrate mastery of relative clauses",
            },
          },
        },
        {
          id: "lesson-b2-4-quiz",
          title: {
            en: "Relative Clauses Quiz",
            es: "Prueba de Cláusulas Relativas",
          },
          description: {
            en: "Test your knowledge of relative clauses",
            es: "Prueba tus conocimientos de cláusulas relativas",
          },
          xpRequired: 5565,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "relative clauses",
            },
            grammar: {
              topics: ["relative clauses structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-5",
      title: {
        en: "Formal vs Informal",
        es: "Formal e Informal",
      },
      description: {
        en: "Register switching",
        es: "Cambio de registro",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-5-1",
          title: {
            en: "Registers of Speech",
            es: "Formal e Informal - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for formal vs informal",
            es: "Aprende vocabulario clave para formal e informal",
          },
          xpRequired: 5625,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "register",
            },
            grammar: {
              topic: "register structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-5-2",
          title: {
            en: "Appropriate Language",
            es: "Formal e Informal - Práctica",
          },
          description: {
            en: "Practice formal vs informal in conversation",
            es: "Practica formal e informal en conversación",
          },
          xpRequired: 5655,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "register conversation",
              prompt: "Practice using register in real conversation",
            },
            stories: {
              topic: "register",
              prompt: "Read and discuss register",
            },
          },
        },
        {
          id: "lesson-b2-5-3",
          title: {
            en: "Context Matters",
            es: "Formal e Informal - Aplicación",
          },
          description: {
            en: "Apply formal vs informal skills",
            es: "Aplica habilidades de formal e informal",
          },
          xpRequired: 5685,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "register",
              prompt: "Advanced register content and comprehension",
            },
            realtime: {
              scenario: "register mastery",
              prompt: "Demonstrate mastery of register",
            },
          },
        },
        {
          id: "lesson-b2-5-quiz",
          title: {
            en: "Formal vs Informal Quiz",
            es: "Prueba de Formal e Informal",
          },
          description: {
            en: "Test your knowledge of formal vs informal",
            es: "Prueba tus conocimientos de formal e informal",
          },
          xpRequired: 5715,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "register",
            },
            grammar: {
              topics: ["register structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-6",
      title: {
        en: "Business Spanish",
        es: "Español de Negocios",
      },
      description: {
        en: "Professional language",
        es: "Lenguaje profesional",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-6-1",
          title: {
            en: "Corporate World",
            es: "Mundo Corporativo",
          },
          description: {
            en: "Learn key vocabulary for business spanish",
            es: "Aprende vocabulario clave para español de negocios",
          },
          xpRequired: 5775,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topic: "professional structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-6-2",
          title: {
            en: "Professional Meetings",
            es: "Reuniones Profesionales",
          },
          description: {
            en: "Practice business spanish in conversation",
            es: "Practica español de negocios en conversación",
          },
          xpRequired: 5805,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "professional conversation",
              prompt: "Practice using professional in real conversation",
            },
            stories: {
              topic: "professional",
              prompt: "Read and discuss professional",
            },
          },
        },
        {
          id: "lesson-b2-6-3",
          title: {
            en: "Business Communication",
            es: "Comunicación Empresarial",
          },
          description: {
            en: "Apply business spanish skills",
            es: "Aplica habilidades de español de negocios",
          },
          xpRequired: 5835,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "professional",
              prompt: "Advanced professional content and comprehension",
            },
            realtime: {
              scenario: "professional mastery",
              prompt: "Demonstrate mastery of professional",
            },
          },
        },
        {
          id: "lesson-b2-6-quiz",
          title: {
            en: "Business Spanish Quiz",
            es: "Prueba de Español de Negocios",
          },
          description: {
            en: "Test your knowledge of business spanish",
            es: "Prueba tus conocimientos de español de negocios",
          },
          xpRequired: 5865,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topics: ["professional structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-7",
      title: {
        en: "Science & Innovation",
        es: "Ciencia e Innovación",
      },
      description: {
        en: "Scientific topics",
        es: "Temas científicos",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-7-1",
          title: {
            en: "Scientific Terms",
            es: "Términos Científicos",
          },
          description: {
            en: "Learn key vocabulary for science & innovation",
            es: "Aprende vocabulario clave para ciencia e innovación",
          },
          xpRequired: 5925,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "science",
            },
            grammar: {
              topic: "science structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-7-2",
          title: {
            en: "Technological Advances",
            es: "Avances Tecnológicos",
          },
          description: {
            en: "Practice science & innovation in conversation",
            es: "Practica ciencia e innovación en conversación",
          },
          xpRequired: 5955,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "science conversation",
              prompt: "Practice using science in real conversation",
            },
            stories: {
              topic: "science",
              prompt: "Read and discuss science",
            },
          },
        },
        {
          id: "lesson-b2-7-3",
          title: {
            en: "Future of Science",
            es: "Futuro de la Ciencia",
          },
          description: {
            en: "Apply science & innovation skills",
            es: "Aplica habilidades de ciencia e innovación",
          },
          xpRequired: 5985,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "science",
              prompt: "Advanced science content and comprehension",
            },
            realtime: {
              scenario: "science mastery",
              prompt: "Demonstrate mastery of science",
            },
          },
        },
        {
          id: "lesson-b2-7-quiz",
          title: {
            en: "Science & Innovation Quiz",
            es: "Prueba de Ciencia e Innovación",
          },
          description: {
            en: "Test your knowledge of science & innovation",
            es: "Prueba tus conocimientos de ciencia e innovación",
          },
          xpRequired: 6015,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "science",
            },
            grammar: {
              topics: ["science structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-8",
      title: {
        en: "Social Issues",
        es: "Problemas Sociales",
      },
      description: {
        en: "Society and issues",
        es: "Sociedad y problemas",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-8-1",
          title: {
            en: "Society Today",
            es: "Problemas Sociales - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for social issues",
            es: "Aprende vocabulario clave para problemas sociales",
          },
          xpRequired: 6075,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "social justice",
            },
            grammar: {
              topic: "social justice structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-8-2",
          title: {
            en: "Discussing Problems",
            es: "Problemas Sociales - Práctica",
          },
          description: {
            en: "Practice social issues in conversation",
            es: "Practica problemas sociales en conversación",
          },
          xpRequired: 6105,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "social justice conversation",
              prompt: "Practice using social justice in real conversation",
            },
            stories: {
              topic: "social justice",
              prompt: "Read and discuss social justice",
            },
          },
        },
        {
          id: "lesson-b2-8-3",
          title: {
            en: "Making Change",
            es: "Problemas Sociales - Aplicación",
          },
          description: {
            en: "Apply social issues skills",
            es: "Aplica habilidades de problemas sociales",
          },
          xpRequired: 6135,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "social justice",
              prompt: "Advanced social justice content and comprehension",
            },
            realtime: {
              scenario: "social justice mastery",
              prompt: "Demonstrate mastery of social justice",
            },
          },
        },
        {
          id: "lesson-b2-8-quiz",
          title: {
            en: "Social Issues Quiz",
            es: "Prueba de Problemas Sociales",
          },
          description: {
            en: "Test your knowledge of social issues",
            es: "Prueba tus conocimientos de problemas sociales",
          },
          xpRequired: 6165,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "social justice",
            },
            grammar: {
              topics: ["social justice structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-9",
      title: {
        en: "Arts & Literature",
        es: "Artes y Literatura",
      },
      description: {
        en: "Cultural works",
        es: "Obras culturales",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-9-1",
          title: {
            en: "Creative Expression",
            es: "Expresión Creativa",
          },
          description: {
            en: "Learn key vocabulary for arts & literature",
            es: "Aprende vocabulario clave para artes y literatura",
          },
          xpRequired: 6225,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topic: "literature structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-9-2",
          title: {
            en: "Artistic Movements",
            es: "Movimientos Artísticos",
          },
          description: {
            en: "Practice arts & literature in conversation",
            es: "Practica artes y literatura en conversación",
          },
          xpRequired: 6255,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "literature conversation",
              prompt: "Practice using literature in real conversation",
            },
            stories: {
              topic: "literature",
              prompt: "Read and discuss literature",
            },
          },
        },
        {
          id: "lesson-b2-9-3",
          title: {
            en: "Cultural Analysis",
            es: "Análisis Cultural",
          },
          description: {
            en: "Apply arts & literature skills",
            es: "Aplica habilidades de artes y literatura",
          },
          xpRequired: 6285,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "literature",
              prompt: "Advanced literature content and comprehension",
            },
            realtime: {
              scenario: "literature mastery",
              prompt: "Demonstrate mastery of literature",
            },
          },
        },
        {
          id: "lesson-b2-9-quiz",
          title: {
            en: "Arts & Literature Quiz",
            es: "Prueba de Artes y Literatura",
          },
          description: {
            en: "Test your knowledge of arts & literature",
            es: "Prueba tus conocimientos de artes y literatura",
          },
          xpRequired: 6315,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topics: ["literature structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-10",
      title: {
        en: "Politics & Society",
        es: "Política y Sociedad",
      },
      description: {
        en: "Civic topics",
        es: "Temas cívicos",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-10-1",
          title: {
            en: "Civic Engagement",
            es: "Participación Cívica",
          },
          description: {
            en: "Learn key vocabulary for politics & society",
            es: "Aprende vocabulario clave para política y sociedad",
          },
          xpRequired: 6375,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "politics",
            },
            grammar: {
              topic: "politics structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-10-2",
          title: {
            en: "Political Discourse",
            es: "Discurso Político",
          },
          description: {
            en: "Practice politics & society in conversation",
            es: "Practica política y sociedad en conversación",
          },
          xpRequired: 6405,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "politics conversation",
              prompt: "Practice using politics in real conversation",
            },
            stories: {
              topic: "politics",
              prompt: "Read and discuss politics",
            },
          },
        },
        {
          id: "lesson-b2-10-3",
          title: {
            en: "Active Citizenship",
            es: "Ciudadanía Activa",
          },
          description: {
            en: "Apply politics & society skills",
            es: "Aplica habilidades de política y sociedad",
          },
          xpRequired: 6435,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "politics",
              prompt: "Advanced politics content and comprehension",
            },
            realtime: {
              scenario: "politics mastery",
              prompt: "Demonstrate mastery of politics",
            },
          },
        },
        {
          id: "lesson-b2-10-quiz",
          title: {
            en: "Politics & Society Quiz",
            es: "Prueba de Política y Sociedad",
          },
          description: {
            en: "Test your knowledge of politics & society",
            es: "Prueba tus conocimientos de política y sociedad",
          },
          xpRequired: 6465,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "politics",
            },
            grammar: {
              topics: ["politics structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-11",
      title: {
        en: "Health & Lifestyle",
        es: "Salud y Estilo de Vida",
      },
      description: {
        en: "Wellness",
        es: "Bienestar",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-11-1",
          title: {
            en: "Wellness Choices",
            es: "Elecciones de Bienestar",
          },
          description: {
            en: "Learn key vocabulary for health & lifestyle",
            es: "Aprende vocabulario clave para salud y estilo de vida",
          },
          xpRequired: 6525,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "wellness",
            },
            grammar: {
              topic: "wellness structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-11-2",
          title: {
            en: "Balanced Living",
            es: "Vida Equilibrada",
          },
          description: {
            en: "Practice health & lifestyle in conversation",
            es: "Practica salud y estilo de vida en conversación",
          },
          xpRequired: 6555,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "wellness conversation",
              prompt: "Practice using wellness in real conversation",
            },
            stories: {
              topic: "wellness",
              prompt: "Read and discuss wellness",
            },
          },
        },
        {
          id: "lesson-b2-11-3",
          title: {
            en: "Holistic Health",
            es: "Salud Holística",
          },
          description: {
            en: "Apply health & lifestyle skills",
            es: "Aplica habilidades de salud y estilo de vida",
          },
          xpRequired: 6585,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "wellness",
              prompt: "Advanced wellness content and comprehension",
            },
            realtime: {
              scenario: "wellness mastery",
              prompt: "Demonstrate mastery of wellness",
            },
          },
        },
        {
          id: "lesson-b2-11-quiz",
          title: {
            en: "Health & Lifestyle Quiz",
            es: "Prueba de Salud y Estilo de Vida",
          },
          description: {
            en: "Test your knowledge of health & lifestyle",
            es: "Prueba tus conocimientos de salud y estilo de vida",
          },
          xpRequired: 6615,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "wellness",
            },
            grammar: {
              topics: ["wellness structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-12",
      title: {
        en: "Abstract Concepts",
        es: "Conceptos Abstractos",
      },
      description: {
        en: "Complex ideas",
        es: "Ideas complejas",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-12-1",
          title: {
            en: "Philosophical Ideas",
            es: "Ideas Filosóficas",
          },
          description: {
            en: "Learn key vocabulary for abstract concepts",
            es: "Aprende vocabulario clave para conceptos abstractos",
          },
          xpRequired: 6675,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "abstract",
            },
            grammar: {
              topic: "abstract structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-12-2",
          title: {
            en: "Deep Thinking",
            es: "Pensamiento Profundo",
          },
          description: {
            en: "Practice abstract concepts in conversation",
            es: "Practica conceptos abstractos en conversación",
          },
          xpRequired: 6705,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "abstract conversation",
              prompt: "Practice using abstract in real conversation",
            },
            stories: {
              topic: "abstract",
              prompt: "Read and discuss abstract",
            },
          },
        },
        {
          id: "lesson-b2-12-3",
          title: {
            en: "Theoretical Discussion",
            es: "Discusión Teórica",
          },
          description: {
            en: "Apply abstract concepts skills",
            es: "Aplica habilidades de conceptos abstractos",
          },
          xpRequired: 6735,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "abstract",
              prompt: "Advanced abstract content and comprehension",
            },
            realtime: {
              scenario: "abstract mastery",
              prompt: "Demonstrate mastery of abstract",
            },
          },
        },
        {
          id: "lesson-b2-12-quiz",
          title: {
            en: "Abstract Concepts Quiz",
            es: "Prueba de Conceptos Abstractos",
          },
          description: {
            en: "Test your knowledge of abstract concepts",
            es: "Prueba tus conocimientos de conceptos abstractos",
          },
          xpRequired: 6765,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "abstract",
            },
            grammar: {
              topics: ["abstract structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
  ],
  C1: [
    {
      id: "unit-c1-1",
      title: {
        en: "Subjunctive Present",
        es: "Subjuntivo Presente",
      },
      description: {
        en: "Complex moods",
        es: "Modos complejos",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-1-1",
          title: {
            en: "Doubt and Desire",
            es: "Duda y Deseo",
          },
          description: {
            en: "Learn key vocabulary for subjunctive present",
            es: "Aprende vocabulario clave para subjuntivo presente",
          },
          xpRequired: 6825,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topic: "subjunctive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-1-2",
          title: {
            en: "Expressing Wishes",
            es: "Expresando Deseos",
          },
          description: {
            en: "Practice subjunctive present in conversation",
            es: "Practica subjuntivo presente en conversación",
          },
          xpRequired: 6860,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "subjunctive conversation",
              prompt: "Practice using subjunctive in real conversation",
            },
            stories: {
              topic: "subjunctive",
              prompt: "Read and discuss subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-1-3",
          title: {
            en: "Nuanced Meaning",
            es: "Significado Matizado",
          },
          description: {
            en: "Apply subjunctive present skills",
            es: "Aplica habilidades de subjuntivo presente",
          },
          xpRequired: 6895,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "subjunctive",
              prompt: "Advanced subjunctive content and comprehension",
            },
            realtime: {
              scenario: "subjunctive mastery",
              prompt: "Demonstrate mastery of subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-1-quiz",
          title: {
            en: "Subjunctive Present Quiz",
            es: "Prueba de Subjuntivo Presente",
          },
          description: {
            en: "Test your knowledge of subjunctive present",
            es: "Prueba tus conocimientos de subjuntivo presente",
          },
          xpRequired: 6930,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topics: ["subjunctive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-2",
      title: {
        en: "Subjunctive Past",
        es: "Subjuntivo Pasado",
      },
      description: {
        en: "Past subjunctive",
        es: "Subjuntivo pasado",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-2-1",
          title: {
            en: "If Only...",
            es: "Si Tan Solo...",
          },
          description: {
            en: "Learn key vocabulary for subjunctive past",
            es: "Aprende vocabulario clave para subjuntivo pasado",
          },
          xpRequired: 7000,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topic: "subjunctive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-2-2",
          title: {
            en: "Contrary to Fact",
            es: "Contrario a la Realidad",
          },
          description: {
            en: "Practice subjunctive past in conversation",
            es: "Practica subjuntivo pasado en conversación",
          },
          xpRequired: 7035,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "subjunctive conversation",
              prompt: "Practice using subjunctive in real conversation",
            },
            stories: {
              topic: "subjunctive",
              prompt: "Read and discuss subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-2-3",
          title: {
            en: "Complex Emotions",
            es: "Emociones Complejas",
          },
          description: {
            en: "Apply subjunctive past skills",
            es: "Aplica habilidades de subjuntivo pasado",
          },
          xpRequired: 7070,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "subjunctive",
              prompt: "Advanced subjunctive content and comprehension",
            },
            realtime: {
              scenario: "subjunctive mastery",
              prompt: "Demonstrate mastery of subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-2-quiz",
          title: {
            en: "Subjunctive Past Quiz",
            es: "Prueba de Subjuntivo Pasado",
          },
          description: {
            en: "Test your knowledge of subjunctive past",
            es: "Prueba tus conocimientos de subjuntivo pasado",
          },
          xpRequired: 7105,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topics: ["subjunctive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-3",
      title: {
        en: "Complex Conditionals",
        es: "Condicionales Complejos",
      },
      description: {
        en: "If I had...",
        es: "Si hubiera...",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-3-1",
          title: {
            en: "Advanced If Clauses",
            es: "Cláusulas If Avanzadas",
          },
          description: {
            en: "Learn key vocabulary for complex conditionals",
            es: "Aprende vocabulario clave para condicionales complejos",
          },
          xpRequired: 7175,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "conditional",
            },
            grammar: {
              topic: "conditional structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-3-2",
          title: {
            en: "Mixed Conditionals",
            es: "Condicionales Mixtos",
          },
          description: {
            en: "Practice complex conditionals in conversation",
            es: "Practica condicionales complejos en conversación",
          },
          xpRequired: 7210,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "conditional conversation",
              prompt: "Practice using conditional in real conversation",
            },
            stories: {
              topic: "conditional",
              prompt: "Read and discuss conditional",
            },
          },
        },
        {
          id: "lesson-c1-3-3",
          title: {
            en: "Sophisticated Logic",
            es: "Lógica Sofisticada",
          },
          description: {
            en: "Apply complex conditionals skills",
            es: "Aplica habilidades de condicionales complejos",
          },
          xpRequired: 7245,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "conditional",
              prompt: "Advanced conditional content and comprehension",
            },
            realtime: {
              scenario: "conditional mastery",
              prompt: "Demonstrate mastery of conditional",
            },
          },
        },
        {
          id: "lesson-c1-3-quiz",
          title: {
            en: "Complex Conditionals Quiz",
            es: "Prueba de Condicionales Complejos",
          },
          description: {
            en: "Test your knowledge of complex conditionals",
            es: "Prueba tus conocimientos de condicionales complejos",
          },
          xpRequired: 7280,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "conditional",
            },
            grammar: {
              topics: ["conditional structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-4",
      title: {
        en: "Idiomatic Expressions",
        es: "Expresiones Idiomáticas",
      },
      description: {
        en: "Idioms and sayings",
        es: "Modismos y dichos",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-4-1",
          title: {
            en: "Native Phrases",
            es: "Frases Nativas",
          },
          description: {
            en: "Learn key vocabulary for idiomatic expressions",
            es: "Aprende vocabulario clave para expresiones idiomáticas",
          },
          xpRequired: 7350,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "idioms",
            },
            grammar: {
              topic: "idioms structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-4-2",
          title: {
            en: "Sound Natural",
            es: "Sonar Natural",
          },
          description: {
            en: "Practice idiomatic expressions in conversation",
            es: "Practica expresiones idiomáticas en conversación",
          },
          xpRequired: 7385,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "idioms conversation",
              prompt: "Practice using idioms in real conversation",
            },
            stories: {
              topic: "idioms",
              prompt: "Read and discuss idioms",
            },
          },
        },
        {
          id: "lesson-c1-4-3",
          title: {
            en: "Cultural Fluency",
            es: "Fluidez Cultural",
          },
          description: {
            en: "Apply idiomatic expressions skills",
            es: "Aplica habilidades de expresiones idiomáticas",
          },
          xpRequired: 7420,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "idioms",
              prompt: "Advanced idioms content and comprehension",
            },
            realtime: {
              scenario: "idioms mastery",
              prompt: "Demonstrate mastery of idioms",
            },
          },
        },
        {
          id: "lesson-c1-4-quiz",
          title: {
            en: "Idiomatic Expressions Quiz",
            es: "Prueba de Expresiones Idiomáticas",
          },
          description: {
            en: "Test your knowledge of idiomatic expressions",
            es: "Prueba tus conocimientos de expresiones idiomáticas",
          },
          xpRequired: 7455,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "idioms",
            },
            grammar: {
              topics: ["idioms structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-5",
      title: {
        en: "Academic Writing",
        es: "Escritura Académica",
      },
      description: {
        en: "Formal writing",
        es: "Escritura formal",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-5-1",
          title: {
            en: "Scholarly Language",
            es: "Lenguaje Académico",
          },
          description: {
            en: "Learn key vocabulary for academic writing",
            es: "Aprende vocabulario clave para escritura académica",
          },
          xpRequired: 7525,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "academic",
            },
            grammar: {
              topic: "academic structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-5-2",
          title: {
            en: "Research Papers",
            es: "Trabajos de Investigación",
          },
          description: {
            en: "Practice academic writing in conversation",
            es: "Practica escritura académica en conversación",
          },
          xpRequired: 7560,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "academic conversation",
              prompt: "Practice using academic in real conversation",
            },
            stories: {
              topic: "academic",
              prompt: "Read and discuss academic",
            },
          },
        },
        {
          id: "lesson-c1-5-3",
          title: {
            en: "Critical Analysis",
            es: "Análisis Crítico",
          },
          description: {
            en: "Apply academic writing skills",
            es: "Aplica habilidades de escritura académica",
          },
          xpRequired: 7595,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "academic",
              prompt: "Advanced academic content and comprehension",
            },
            realtime: {
              scenario: "academic mastery",
              prompt: "Demonstrate mastery of academic",
            },
          },
        },
        {
          id: "lesson-c1-5-quiz",
          title: {
            en: "Academic Writing Quiz",
            es: "Prueba de Escritura Académica",
          },
          description: {
            en: "Test your knowledge of academic writing",
            es: "Prueba tus conocimientos de escritura académica",
          },
          xpRequired: 7630,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "academic",
            },
            grammar: {
              topics: ["academic structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-6",
      title: {
        en: "Professional Communication",
        es: "Comunicación Profesional",
      },
      description: {
        en: "Workplace language",
        es: "Lenguaje laboral",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-6-1",
          title: {
            en: "Business Etiquette",
            es: "Etiqueta Empresarial",
          },
          description: {
            en: "Learn key vocabulary for professional communication",
            es: "Aprende vocabulario clave para comunicación profesional",
          },
          xpRequired: 7700,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topic: "professional structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-6-2",
          title: {
            en: "Executive Presence",
            es: "Presencia Ejecutiva",
          },
          description: {
            en: "Practice professional communication in conversation",
            es: "Practica comunicación profesional en conversación",
          },
          xpRequired: 7735,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "professional conversation",
              prompt: "Practice using professional in real conversation",
            },
            stories: {
              topic: "professional",
              prompt: "Read and discuss professional",
            },
          },
        },
        {
          id: "lesson-c1-6-3",
          title: {
            en: "Leadership Language",
            es: "Lenguaje de Liderazgo",
          },
          description: {
            en: "Apply professional communication skills",
            es: "Aplica habilidades de comunicación profesional",
          },
          xpRequired: 7770,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "professional",
              prompt: "Advanced professional content and comprehension",
            },
            realtime: {
              scenario: "professional mastery",
              prompt: "Demonstrate mastery of professional",
            },
          },
        },
        {
          id: "lesson-c1-6-quiz",
          title: {
            en: "Professional Communication Quiz",
            es: "Prueba de Comunicación Profesional",
          },
          description: {
            en: "Test your knowledge of professional communication",
            es: "Prueba tus conocimientos de comunicación profesional",
          },
          xpRequired: 7805,
          xpReward: 40,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topics: ["professional structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-7",
      title: {
        en: "Debate & Argumentation",
        es: "Debate y Argumentación",
      },
      description: {
        en: "Persuasive skills",
        es: "Habilidades persuasivas",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-7-1",
          title: {
            en: "Persuasive Language",
            es: "Lenguaje Persuasivo",
          },
          description: {
            en: "Learn key vocabulary for debate & argumentation",
            es: "Aprende vocabulario clave para debate y argumentación",
          },
          xpRequired: 7875,
          xpReward: 35,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "debate",
            },
            grammar: {
              topic: "debate structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-7-2",
          title: {
            en: "Building Arguments",
            es: "Construyendo Argumentos",
          },
          description: {
            en: "Practice debate & argumentation in conversation",
            es: "Practica debate y argumentación en conversación",
          },
          xpRequired: 7910,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "debate conversation",
              prompt: "Practice using debate in real conversation",
            },
            stories: {
              topic: "debate",
              prompt: "Read and discuss debate",
            },
          },
        },
        {
          id: "lesson-c1-7-3",
          title: {
            en: "Winning Debates",
            es: "Ganando Debates",
          },
          description: {
            en: "Apply debate & argumentation skills",
            es: "Aplica habilidades de debate y argumentación",
          },
          xpRequired: 7945,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "debate",
              prompt: "Advanced debate content and comprehension",
            },
            realtime: {
              scenario: "debate mastery",
              prompt: "Demonstrate mastery of debate",
            },
          },
        },
        {
          id: "lesson-c1-7-quiz",
          title: {
            en: "Debate & Argumentation Quiz",
            es: "Prueba de Debate y Argumentación",
          },
          description: {
            en: "Test your knowledge of debate & argumentation",
            es: "Prueba tus conocimientos de debate y argumentación",
          },
          xpRequired: 7980,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "debate",
            },
            grammar: {
              topics: ["debate structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-8",
      title: {
        en: "Cultural Analysis",
        es: "Análisis Cultural",
      },
      description: {
        en: "Deep culture",
        es: "Cultura profunda",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-8-1",
          title: {
            en: "Cultural Studies",
            es: "Estudios Culturales",
          },
          description: {
            en: "Learn key vocabulary for cultural analysis",
            es: "Aprende vocabulario clave para análisis cultural",
          },
          xpRequired: 8050,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          id: "lesson-c1-8-2",
          title: {
            en: "Interpreting Culture",
            es: "Interpretando Cultura",
          },
          description: {
            en: "Practice cultural analysis in conversation",
            es: "Practica análisis cultural en conversación",
          },
          xpRequired: 8085,
          xpReward: 60,
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
          id: "lesson-c1-8-3",
          title: {
            en: "Cross-Cultural Understanding",
            es: "Comprensión Intercultural",
          },
          description: {
            en: "Apply cultural analysis skills",
            es: "Aplica habilidades de análisis cultural",
          },
          xpRequired: 8120,
          xpReward: 55,
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
          id: "lesson-c1-8-quiz",
          title: {
            en: "Cultural Analysis Quiz",
            es: "Prueba de Análisis Cultural",
          },
          description: {
            en: "Test your knowledge of cultural analysis",
            es: "Prueba tus conocimientos de análisis cultural",
          },
          xpRequired: 8155,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
      id: "unit-c1-9",
      title: {
        en: "Literary Techniques",
        es: "Técnicas Literarias",
      },
      description: {
        en: "Literary analysis",
        es: "Análisis literario",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-9-1",
          title: {
            en: "Literary Devices",
            es: "Dispositivos Literarios",
          },
          description: {
            en: "Learn key vocabulary for literary techniques",
            es: "Aprende vocabulario clave para técnicas literarias",
          },
          xpRequired: 8225,
          xpReward: 55,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topic: "literature structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-9-2",
          title: {
            en: "Analyzing Texts",
            es: "Analizando Textos",
          },
          description: {
            en: "Practice literary techniques in conversation",
            es: "Practica técnicas literarias en conversación",
          },
          xpRequired: 8260,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "literature conversation",
              prompt: "Practice using literature in real conversation",
            },
            stories: {
              topic: "literature",
              prompt: "Read and discuss literature",
            },
          },
        },
        {
          id: "lesson-c1-9-3",
          title: {
            en: "Literary Criticism",
            es: "Crítica Literaria",
          },
          description: {
            en: "Apply literary techniques skills",
            es: "Aplica habilidades de técnicas literarias",
          },
          xpRequired: 8295,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "literature",
              prompt: "Advanced literature content and comprehension",
            },
            realtime: {
              scenario: "literature mastery",
              prompt: "Demonstrate mastery of literature",
            },
          },
        },
        {
          id: "lesson-c1-9-quiz",
          title: {
            en: "Literary Techniques Quiz",
            es: "Prueba de Técnicas Literarias",
          },
          description: {
            en: "Test your knowledge of literary techniques",
            es: "Prueba tus conocimientos de técnicas literarias",
          },
          xpRequired: 8330,
          xpReward: 60,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topics: ["literature structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-10",
      title: {
        en: "Advanced Discourse",
        es: "Discurso Avanzado",
      },
      description: {
        en: "Complex communication",
        es: "Comunicación compleja",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-10-1",
          title: {
            en: "Discourse Markers",
            es: "Marcadores del Discurso",
          },
          description: {
            en: "Learn key vocabulary for advanced discourse",
            es: "Aprende vocabulario clave para discurso avanzado",
          },
          xpRequired: 8400,
          xpReward: 45,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          content: {
            vocabulary: {
              topic: "discourse",
            },
            grammar: {
              topic: "discourse structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-10-2",
          title: {
            en: "Coherent Arguments",
            es: "Argumentos Coherentes",
          },
          description: {
            en: "Practice advanced discourse in conversation",
            es: "Practica discurso avanzado en conversación",
          },
          xpRequired: 8435,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "discourse conversation",
              prompt: "Practice using discourse in real conversation",
            },
            stories: {
              topic: "discourse",
              prompt: "Read and discuss discourse",
            },
          },
        },
        {
          id: "lesson-c1-10-3",
          title: {
            en: "Fluent Expression",
            es: "Expresión Fluida",
          },
          description: {
            en: "Apply advanced discourse skills",
            es: "Aplica habilidades de discurso avanzado",
          },
          xpRequired: 8470,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "discourse",
              prompt: "Advanced discourse content and comprehension",
            },
            realtime: {
              scenario: "discourse mastery",
              prompt: "Demonstrate mastery of discourse",
            },
          },
        },
        {
          id: "lesson-c1-10-quiz",
          title: {
            en: "Advanced Discourse Quiz",
            es: "Prueba de Discurso Avanzado",
          },
          description: {
            en: "Test your knowledge of advanced discourse",
            es: "Prueba tus conocimientos de discurso avanzado",
          },
          xpRequired: 8505,
          xpReward: 50,
          modes: ["vocabulary", "grammar", "verbConjugator"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "discourse",
            },
            grammar: {
              topics: ["discourse structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
  ],
  C2: [
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
          modes: ["vocabulary", "grammar", "verbConjugator"],
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
  ],
};

const LESSON_XP_RANGE = { min: 55, max: 80 };
const LESSON_XP_STEP = 5;

/**
 * Assign a deterministic pseudo-random XP reward to each lesson so that every
 * lesson requires between 55–80 XP to complete in increments of 5. The hash
 * keeps rewards stable across sessions while still varying the distribution
 * across lessons.
 */
function applyLessonXPSchedule(lessons) {
  return lessons.map((lesson) => ({
    ...lesson,
    xpReward: getLessonXpReward(lesson.id),
  }));
}

function getLessonXpReward(lessonId = "") {
  const normalized = lessonId || "lesson";
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
  "verbConjugator",
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
      modes: ["grammar", "vocabulary", "verbConjugator"],
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
      allFocus
    );

    return {
      scenario: template.scenario,
      prompt: template.prompt,
      successCriteria: template.successCriteria,
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
        ", "
      )}.`,
      successCriteria: `User demonstrates use of ${firstFocus} in context`,
    };

    // Create variations for focus points
    const variations = [baseGoal];
    allFocus.slice(1, 3).forEach((focus, i) => {
      variations.push({
        scenario: `Practice ${focus} in a real situation`,
        prompt: `Create a situation where the learner must use ${focus}. Ask follow-up questions.`,
        successCriteria: `User uses ${focus} correctly in context`,
      });
    });

    return {
      ...baseGoal,
      focusPoints: allFocus,
      goalVariations: variations,
      goalIndex: 0,
    };
  }

  // Final fallback - still more specific than before
  return {
    scenario: `Have a conversation about ${topicLabel}`,
    prompt: `Engage the learner in a natural conversation about ${topicLabel}. Ask questions and encourage responses.`,
    successCriteria: `User participates meaningfully in conversation about ${topicLabel}`,
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

function generateGoalVariations(baseTemplate, topicLabel, focusPoints = []) {
  const variations = [
    {
      scenario: baseTemplate.scenario,
      scenario_es: translateGoalTextToEs(baseTemplate.scenario, topicLabel),
      prompt: baseTemplate.prompt,
      prompt_es: translateGoalTextToEs(baseTemplate.prompt, topicLabel),
      successCriteria: baseTemplate.successCriteria,
      successCriteria_es: translateGoalTextToEs(
        baseTemplate.successCriteria,
        topicLabel
      ),
    },
  ];

  // Add "respond to questions" variation
  variations.push({
    scenario: `Answer questions about ${topicLabel}`,
    scenario_es: translateGoalTextToEs(
      `Answer questions about ${topicLabel}`,
      topicLabel
    ),
    prompt: `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
    prompt_es: translateGoalTextToEs(
      `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
      topicLabel
    ),
    successCriteria: `User answers questions using ${topicLabel} vocabulary correctly`,
    successCriteria_es: translateGoalTextToEs(
      `User answers questions using ${topicLabel} vocabulary correctly`,
      topicLabel
    ),
  });

  // Add "start a conversation" variation
  variations.push({
    scenario: `Start a conversation about ${topicLabel}`,
    scenario_es: translateGoalTextToEs(
      `Start a conversation about ${topicLabel}`,
      topicLabel
    ),
    prompt: `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
    prompt_es: translateGoalTextToEs(
      `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
      topicLabel
    ),
    successCriteria: `User initiates and sustains conversation about ${topicLabel}`,
    successCriteria_es: translateGoalTextToEs(
      `User initiates and sustains conversation about ${topicLabel}`,
      topicLabel
    ),
  });

  // Add focus-point specific variations if available
  if (focusPoints.length > 0) {
    variations.push({
      scenario: `Use ${focusPoints[0]} in a real situation`,
      scenario_es: translateGoalTextToEs(
        `Use ${focusPoints[0]} in a real situation`,
        topicLabel,
        focusPoints[0]
      ),
      prompt: `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
      prompt_es: translateGoalTextToEs(
        `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
        topicLabel,
        focusPoints[0]
      ),
      successCriteria: `User demonstrates correct use of ${focusPoints[0]}`,
      successCriteria_es: translateGoalTextToEs(
        `User demonstrates correct use of ${focusPoints[0]}`,
        topicLabel,
        focusPoints[0]
      ),
    });
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
    goalVariations.push(...topicSpecificGoals);
  }

  // Generate creative roleplay scenarios based on the unit topic
  // These should be specific actions, not abstract concepts
  const creativeGoals = generateCreativeGoalsForTopic(
    topicKey,
    unitTitle,
    lessonTitles
  );
  goalVariations.push(...creativeGoals);

  // Ensure we have at least one goal
  if (goalVariations.length === 0) {
    goalVariations.push({
      scenario: `Have a conversation about ${unitTitle}`,
      prompt: `Start a natural conversation about ${unitTitle}. Ask the learner questions and respond to their answers. Build on what they say.`,
      successCriteria: `User participates actively in a conversation about ${unitTitle}`,
    });
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
    modes = ["grammar", "vocabulary", "verbConjugator"];
  } else if (isSkillBuilder) {
    modes = ["grammar", "vocabulary", "verbConjugator"];
  } else if (isIntegratedPractice) {
    modes = ["realtime", "reading", "stories"];
  } else {
    if (modes.length === 0) {
      modes = ["vocabulary", "realtime", "reading"];
    }

    // Add verbConjugator whenever both vocabulary and grammar are present
    const hasVocabAndGrammar =
      modes.includes("vocabulary") && modes.includes("grammar");
    if (hasVocabAndGrammar && !modes.includes("verbConjugator")) {
      modes.push("verbConjugator");
    }

    const hasOnlyVocabGrammarVerb =
      modes.length <= 3 &&
      modes.includes("vocabulary") &&
      modes.includes("grammar") &&
      modes.includes("verbConjugator");

    if (hasOnlyVocabGrammarVerb && modes.length === 3) {
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
        lessons: applyLessonXPSchedule(balancedLessons),
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

/**
 * Get the learning path for a specific language and level
 */
export function getLearningPath(targetLang, level) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;
  const units = LEARNING_PATHS[lang]?.[level] || [];
  // Return a deep clone to avoid mutation
  return JSON.parse(JSON.stringify(units));
}

/**
 * Get the learning path for multiple levels
 * Returns combined units from all specified levels with level metadata
 */
export function getMultiLevelLearningPath(targetLang, levels = ["A1", "A2"]) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;

  const allUnits = [];
  levels.forEach((level) => {
    const units = LEARNING_PATHS[lang]?.[level] || [];
    // Add level metadata to each unit
    const unitsWithLevel = units.map((unit) => ({
      ...unit,
      cefrLevel: level,
    }));
    allUnits.push(...unitsWithLevel);
  });

  // Return a deep clone to avoid mutation
  return JSON.parse(JSON.stringify(allUnits));
}

/**
 * Calculate total XP required to complete a unit
 */
export function getUnitTotalXP(unit) {
  return unit.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
}

/**
 * Get the next available lesson for a user based on sequential completion
 */
export function getNextLesson(units, userProgress) {
  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    for (
      let lessonIndex = 0;
      lessonIndex < unit.lessons.length;
      lessonIndex++
    ) {
      const lesson = unit.lessons[lessonIndex];
      if (!userProgress?.[lesson.id]?.completed) {
        return { lesson, unitIndex, lessonIndex, unit };
      }
    }
  }
  return null;
}

/**
 * Get overall unit progress as a percentage
 */
export function getUnitProgress(unit, userProgress) {
  const total = unit.lessons.length;
  if (!total) return 0;
  const completed = unit.lessons.filter(
    (l) => userProgress?.[l.id]?.completed
  ).length;
  return Math.round((completed / total) * 100);
}

// Re-export lazy-loading utilities for better performance
// These allow components to load only the skill tree data they need
export {
  loadSkillTreeForLevel,
  loadSkillTreeForLevels,
  loadRelevantSkillTree,
  loadAllSkillTree,
  getLevelsToLoad,
  clearSkillTreeCache,
  getSkillTreeCacheStats,
} from "./skillTree/index.js";
