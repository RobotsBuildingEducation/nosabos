/**
 * A1 Level Skill Tree Data
 */

export const SKILL_TREE_A1 = [
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
        modes: ["vocabulary", "grammar", "reading", "stories", "realtime"],
        content: {
          vocabulary: {
            topic: "tutorial",
            focusPoints: ["basic words", "greetings"],
            tutorialDescription: {
              en: "Learn new words through interactive questions.",
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
        modes: ["vocabulary", "grammar"],
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
            prompt: "Roleplay asking for help, ordering, or finding something",
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
            focusPoints: ["and/but/because", "how/what/where", "feeling words"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
        modes: ["vocabulary", "grammar"],
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
];
