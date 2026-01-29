/**
 * Pre-A1 Level Skill Tree Data
 *
 * For ultimate beginners with zero prior knowledge.
 * Focus on recognition, single words, and survival basics before tackling A1.
 */

export const SKILL_TREE_PRE_A1 = [
  // Tutorial Unit - always at the very beginning
  {
    id: "unit-tutorial-pre-a1",
    title: {
      en: "Getting Started",
      es: "Primeros Pasos",
    },
    description: {
      en: "Learn how to use the app and explore all features",
      es: "Aprende a usar la app y explora todas las funciones",
    },
    color: "#6366F1",
    position: { row: -1, offset: 0 },
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
          tutorialDescription: {
            en: "Practice speaking with realtime conversations and goal oriented chats.",
            es: "Practica la expresión oral con conversaciones en tiempo real y chats orientados a objetivos.",
          },
        },
      },
    ],
  },

  // Unit 1: People & Family
  {
    id: "unit-pre-a1-people",
    title: {
      en: "People & Family",
      es: "Personas y Familia",
    },
    description: {
      en: "Learn words for the people in your life",
      es: "Aprende palabras para las personas en tu vida",
    },
    color: "#8B5CF6",
    position: { row: 0, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-1-1",
        title: {
          en: "My Family",
          es: "Mi Familia",
        },
        description: {
          en: "Learn the words for close family members",
          es: "Aprende las palabras para familiares cercanos",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "close family members",
            focusPoints: ["mamá", "papá", "hermano", "hermana", "familia"],
          },
          grammar: {
            topic: "family with articles",
            focusPoints: ["el/la with family nouns", "mi mamá, mi papá"],
          },
        },
      },
      {
        id: "lesson-pre-a1-1-2",
        title: {
          en: "More Family",
          es: "Más Familia",
        },
        description: {
          en: "Grandparents, babies, and extended family",
          es: "Abuelos, bebés y familia extendida",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "extended family",
            focusPoints: [
              "abuelo",
              "abuela",
              "bebé",
              "hijo",
              "hija",
              "tío",
              "tía",
            ],
          },
          grammar: {
            topic: "masculine and feminine",
            focusPoints: ["abuelo/abuela", "hijo/hija", "tío/tía"],
          },
        },
      },
      {
        id: "lesson-pre-a1-1-3",
        title: {
          en: "People Around Me",
          es: "Personas a Mi Alrededor",
        },
        description: {
          en: "Words for friends, children, and people you see every day",
          es: "Palabras para amigos, niños y personas que ves todos los días",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "people in daily life",
            focusPoints: [
              "amigo",
              "amiga",
              "niño",
              "niña",
              "hombre",
              "mujer",
              "persona",
            ],
          },
          grammar: {
            topic: "gender of people nouns",
            focusPoints: ["amigo/amiga", "niño/niña", "hombre/mujer"],
          },
        },
      },
      {
        id: "lesson-pre-a1-1-quiz",
        title: {
          en: "People & Family Quiz",
          es: "Prueba de Personas y Familia",
        },
        description: {
          en: "Test your knowledge of people and family words",
          es: "Pon a prueba tu conocimiento de palabras de personas y familia",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "people and family review",
            focusPoints: ["family members", "friends", "people"],
          },
          grammar: {
            topic: "people vocabulary usage",
            focusPoints: ["gender", "articles", "possessives"],
          },
        },
      },
    ],
  },

  // Unit 2: Numbers 0-10
  {
    id: "unit-pre-a1-numbers",
    title: {
      en: "Numbers 0-10",
      es: "Números 0-10",
    },
    description: {
      en: "Count from zero to ten in Spanish",
      es: "Cuenta del cero al diez en español",
    },
    color: "#EC4899",
    position: { row: 1, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-2-1",
        title: {
          en: "Zero to Five",
          es: "Cero a Cinco",
        },
        description: {
          en: "Learn your first numbers: 0, 1, 2, 3, 4, 5",
          es: "Aprende tus primeros números: 0, 1, 2, 3, 4, 5",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "numbers 0-5",
            focusPoints: ["cero", "uno", "dos", "tres", "cuatro", "cinco"],
          },
          grammar: {
            topic: "number usage",
            focusPoints: ["counting objects", "number pronunciation"],
          },
        },
      },
      {
        id: "lesson-pre-a1-2-2",
        title: {
          en: "Six to Ten",
          es: "Seis a Diez",
        },
        description: {
          en: "Complete counting to ten: 6, 7, 8, 9, 10",
          es: "Completa el conteo hasta diez: 6, 7, 8, 9, 10",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "numbers 6-10",
            focusPoints: ["seis", "siete", "ocho", "nueve", "diez"],
          },
          grammar: {
            topic: "number patterns",
            focusPoints: ["counting sequences", "number recognition"],
          },
        },
      },
      {
        id: "lesson-pre-a1-2-3",
        title: {
          en: "Counting Objects",
          es: "Contando Objetos",
        },
        description: {
          en: "Use numbers to count everyday things",
          es: "Usa números para contar cosas cotidianas",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "counting with objects",
            focusPoints: [
              "un/una",
              "dos libros",
              "tres mesas",
              "quantity expressions",
            ],
          },
          grammar: {
            topic: "number agreement",
            focusPoints: ["uno vs un/una", "numbers with nouns"],
          },
        },
      },
      {
        id: "lesson-pre-a1-2-quiz",
        title: {
          en: "Numbers Quiz",
          es: "Prueba de Números",
        },
        description: {
          en: "Test your counting skills from 0 to 10",
          es: "Pon a prueba tu habilidad de contar del 0 al 10",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "numbers review",
            focusPoints: ["0-10", "counting"],
          },
          grammar: {
            topic: "number usage",
            focusPoints: ["quantities", "counting objects"],
          },
        },
      },
    ],
  },

  // Unit 3: Hello & Goodbye
  {
    id: "unit-pre-a1-greetings",
    title: {
      en: "Hello & Goodbye",
      es: "Hola y Adiós",
    },
    description: {
      en: "Basic greetings and farewells for any situation",
      es: "Saludos y despedidas básicas para cualquier situación",
    },
    color: "#10B981",
    position: { row: 2, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-3-1",
        title: {
          en: "Saying Hello",
          es: "Decir Hola",
        },
        description: {
          en: "Learn different ways to greet people",
          es: "Aprende diferentes formas de saludar a la gente",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "greetings",
            focusPoints: [
              "hola",
              "buenos días",
              "buenas tardes",
              "buenas noches",
            ],
          },
          grammar: {
            topic: "greeting usage",
            focusPoints: ["time-appropriate greetings", "formal vs informal"],
          },
        },
      },
      {
        id: "lesson-pre-a1-3-2",
        title: {
          en: "Saying Goodbye",
          es: "Decir Adiós",
        },
        description: {
          en: "Learn farewell expressions for different situations",
          es: "Aprende expresiones de despedida para diferentes situaciones",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "farewells",
            focusPoints: [
              "adiós",
              "hasta luego",
              "hasta mañana",
              "nos vemos",
              "chao",
            ],
          },
          grammar: {
            topic: "farewell usage",
            focusPoints: ["temporary vs permanent goodbye", "casual vs formal"],
          },
        },
      },
      {
        id: "lesson-pre-a1-3-3",
        title: {
          en: "Greetings in Context",
          es: "Saludos en Contexto",
        },
        description: {
          en: "Practice greetings in real-life situations",
          es: "Practica saludos en situaciones de la vida real",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar", "realtime"],
        content: {
          vocabulary: {
            topic: "greeting conversations",
            focusPoints: [
              "greeting + response patterns",
              "polite acknowledgments",
            ],
          },
          grammar: {
            topic: "greeting exchanges",
            focusPoints: ["question and answer patterns", "social norms"],
          },
          realtime: {
            scenario: "Meeting someone",
            prompt: "Practice greeting someone and saying goodbye",
            successCriteria:
              "The learner uses appropriate greetings and farewells.",
          },
        },
      },
      {
        id: "lesson-pre-a1-3-quiz",
        title: {
          en: "Greetings Quiz",
          es: "Prueba de Saludos",
        },
        description: {
          en: "Test your greeting and farewell skills",
          es: "Pon a prueba tus habilidades de saludo y despedida",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "greetings review",
            focusPoints: ["all greetings", "all farewells"],
          },
          grammar: {
            topic: "greeting rules",
            focusPoints: ["appropriate usage", "context"],
          },
        },
      },
    ],
  },

  // Unit 4: Yes, No & Basic Responses
  {
    id: "unit-pre-a1-responses",
    title: {
      en: "Yes, No & Basic Responses",
      es: "Sí, No y Respuestas Básicas",
    },
    description: {
      en: "Essential single-word responses for any conversation",
      es: "Respuestas esenciales de una palabra para cualquier conversación",
    },
    color: "#F59E0B",
    position: { row: 3, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-4-1",
        title: {
          en: "Yes and No",
          es: "Sí y No",
        },
        description: {
          en: "Master the most important words in any language",
          es: "Domina las palabras más importantes en cualquier idioma",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "affirmative and negative",
            focusPoints: ["sí", "no", "claro", "vale", "de acuerdo"],
          },
          grammar: {
            topic: "response patterns",
            focusPoints: ["answering yes/no questions", "emphasis with sí/no"],
          },
        },
      },
      {
        id: "lesson-pre-a1-4-2",
        title: {
          en: "Maybe and I Don't Know",
          es: "Quizás y No Sé",
        },
        description: {
          en: "Express uncertainty with simple phrases",
          es: "Expresa incertidumbre con frases simples",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "uncertainty expressions",
            focusPoints: [
              "quizás",
              "tal vez",
              "no sé",
              "puede ser",
              "a lo mejor",
            ],
          },
          grammar: {
            topic: "expressing doubt",
            focusPoints: ["uncertainty words", "hesitation phrases"],
          },
        },
      },
      {
        id: "lesson-pre-a1-4-3",
        title: {
          en: "Quick Responses",
          es: "Respuestas Rápidas",
        },
        description: {
          en: "React naturally in conversations",
          es: "Reacciona naturalmente en conversaciones",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "reaction words",
            focusPoints: [
              "¡genial!",
              "¡perfecto!",
              "¡qué bien!",
              "¡oh no!",
              "¿en serio?",
            ],
          },
          grammar: {
            topic: "exclamations",
            focusPoints: ["expressing emotions", "showing interest"],
          },
        },
      },
      {
        id: "lesson-pre-a1-4-quiz",
        title: {
          en: "Responses Quiz",
          es: "Prueba de Respuestas",
        },
        description: {
          en: "Test your ability to respond appropriately",
          es: "Pon a prueba tu habilidad de responder apropiadamente",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "responses review",
            focusPoints: ["yes/no", "uncertainty", "reactions"],
          },
          grammar: {
            topic: "response usage",
            focusPoints: ["appropriate responses"],
          },
        },
      },
    ],
  },

  // Unit 5: Please & Thank You
  {
    id: "unit-pre-a1-courtesy",
    title: {
      en: "Please & Thank You",
      es: "Por Favor y Gracias",
    },
    description: {
      en: "Essential courtesy expressions for polite communication",
      es: "Expresiones de cortesía esenciales para comunicación educada",
    },
    color: "#EF4444",
    position: { row: 4, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-5-1",
        title: {
          en: "Please and Thank You",
          es: "Por Favor y Gracias",
        },
        description: {
          en: "The magic words that open doors everywhere",
          es: "Las palabras mágicas que abren puertas en todas partes",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "basic courtesy",
            focusPoints: ["por favor", "gracias", "muchas gracias", "de nada"],
          },
          grammar: {
            topic: "polite requests",
            focusPoints: ["adding por favor", "thanking appropriately"],
          },
        },
      },
      {
        id: "lesson-pre-a1-5-2",
        title: {
          en: "Sorry and Excuse Me",
          es: "Perdón y Disculpe",
        },
        description: {
          en: "Apologize and get attention politely",
          es: "Discúlpate y llama la atención educadamente",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "apologies and attention",
            focusPoints: [
              "perdón",
              "lo siento",
              "disculpe",
              "disculpa",
              "con permiso",
            ],
          },
          grammar: {
            topic: "apologizing",
            focusPoints: ["formal vs informal apologies", "getting attention"],
          },
        },
      },
      {
        id: "lesson-pre-a1-5-3",
        title: {
          en: "Polite Expressions",
          es: "Expresiones Corteses",
        },
        description: {
          en: "Additional phrases for gracious communication",
          es: "Frases adicionales para comunicación cortés",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "polite phrases",
            focusPoints: [
              "muy amable",
              "no hay de qué",
              "con gusto",
              "a sus órdenes",
            ],
          },
          grammar: {
            topic: "formal courtesy",
            focusPoints: ["polite responses", "gracious expressions"],
          },
        },
      },
      {
        id: "lesson-pre-a1-5-quiz",
        title: {
          en: "Courtesy Quiz",
          es: "Prueba de Cortesía",
        },
        description: {
          en: "Test your polite expression skills",
          es: "Pon a prueba tus habilidades de expresiones corteses",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "courtesy review",
            focusPoints: ["please/thank you", "apologies", "polite phrases"],
          },
          grammar: {
            topic: "courtesy usage",
            focusPoints: ["appropriate situations"],
          },
        },
      },
    ],
  },

  // Unit 6: Common Objects
  {
    id: "unit-pre-a1-objects",
    title: {
      en: "Common Objects",
      es: "Objetos Comunes",
    },
    description: {
      en: "Name everyday things around you",
      es: "Nombra las cosas cotidianas a tu alrededor",
    },
    color: "#06B6D4",
    position: { row: 5, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-6-1",
        title: {
          en: "Things at Home",
          es: "Cosas en Casa",
        },
        description: {
          en: "Learn names of common household items",
          es: "Aprende nombres de artículos comunes del hogar",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "household items",
            focusPoints: [
              "mesa",
              "silla",
              "puerta",
              "ventana",
              "cama",
              "lámpara",
            ],
          },
          grammar: {
            topic: "articles with objects",
            focusPoints: ["el/la with objects", "masculine vs feminine nouns"],
          },
        },
      },
      {
        id: "lesson-pre-a1-6-2",
        title: {
          en: "Personal Items",
          es: "Artículos Personales",
        },
        description: {
          en: "Things you carry with you every day",
          es: "Cosas que llevas contigo todos los días",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "personal items",
            focusPoints: [
              "teléfono",
              "libro",
              "bolsa",
              "llaves",
              "cartera",
              "gafas",
            ],
          },
          grammar: {
            topic: "possessive with objects",
            focusPoints: ["mi/tu/su", "ownership expressions"],
          },
        },
      },
      {
        id: "lesson-pre-a1-6-3",
        title: {
          en: "Food and Drink Items",
          es: "Comida y Bebida",
        },
        description: {
          en: "Basic food and drink vocabulary",
          es: "Vocabulario básico de comida y bebida",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "food and drinks",
            focusPoints: ["agua", "café", "pan", "leche", "fruta", "comida"],
          },
          grammar: {
            topic: "food articles",
            focusPoints: ["el agua (feminine exception)", "uncountable nouns"],
          },
        },
      },
      {
        id: "lesson-pre-a1-6-quiz",
        title: {
          en: "Objects Quiz",
          es: "Prueba de Objetos",
        },
        description: {
          en: "Test your knowledge of common objects",
          es: "Pon a prueba tu conocimiento de objetos comunes",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "objects review",
            focusPoints: ["household", "personal", "food/drink"],
          },
          grammar: {
            topic: "object naming",
            focusPoints: ["articles", "gender"],
          },
        },
      },
    ],
  },

  // Unit 7: Colors
  {
    id: "unit-pre-a1-colors",
    title: {
      en: "Colors",
      es: "Colores",
    },
    description: {
      en: "Learn to identify and name colors",
      es: "Aprende a identificar y nombrar colores",
    },
    color: "#F97316",
    position: { row: 6, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-7-1",
        title: {
          en: "Primary Colors",
          es: "Colores Primarios",
        },
        description: {
          en: "Red, blue, yellow - the building blocks",
          es: "Rojo, azul, amarillo - los bloques básicos",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "primary colors",
            focusPoints: ["rojo", "azul", "amarillo"],
          },
          grammar: {
            topic: "color as adjective",
            focusPoints: ["color placement after noun", "el libro rojo"],
          },
        },
      },
      {
        id: "lesson-pre-a1-7-2",
        title: {
          en: "More Colors",
          es: "Más Colores",
        },
        description: {
          en: "Expand your color vocabulary",
          es: "Amplía tu vocabulario de colores",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "additional colors",
            focusPoints: [
              "verde",
              "naranja",
              "rosa",
              "morado",
              "marrón",
              "gris",
            ],
          },
          grammar: {
            topic: "color agreement",
            focusPoints: [
              "colors that change (rojo/roja)",
              "colors that don't (naranja, rosa)",
            ],
          },
        },
      },
      {
        id: "lesson-pre-a1-7-3",
        title: {
          en: "Black, White & Neutral",
          es: "Negro, Blanco y Neutros",
        },
        description: {
          en: "Complete your color palette",
          es: "Completa tu paleta de colores",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "neutral colors",
            focusPoints: ["negro", "blanco", "gris", "beige", "crema"],
          },
          grammar: {
            topic: "color combinations",
            focusPoints: ["blanco y negro", "azul oscuro", "verde claro"],
          },
        },
      },
      {
        id: "lesson-pre-a1-7-quiz",
        title: {
          en: "Colors Quiz",
          es: "Prueba de Colores",
        },
        description: {
          en: "Test your color recognition skills",
          es: "Pon a prueba tu reconocimiento de colores",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "colors review",
            focusPoints: ["all colors", "shades"],
          },
          grammar: {
            topic: "color usage",
            focusPoints: ["agreement", "placement"],
          },
        },
      },
    ],
  },

  // Unit 8: What's Your Name?
  {
    id: "unit-pre-a1-introductions",
    title: {
      en: "What's Your Name?",
      es: "¿Cómo Te Llamas?",
    },
    description: {
      en: "Introduce yourself and ask others their names",
      es: "Preséntate y pregunta a otros sus nombres",
    },
    color: "#6366F1",
    position: { row: 7, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-8-1",
        title: {
          en: "Saying Your Name",
          es: "Decir Tu Nombre",
        },
        description: {
          en: "Learn to introduce yourself",
          es: "Aprende a presentarte",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "self introduction",
            focusPoints: ["me llamo", "soy", "mi nombre es"],
          },
          grammar: {
            topic: "introduction patterns",
            focusPoints: ["Me llamo + name", "Soy + name"],
          },
        },
      },
      {
        id: "lesson-pre-a1-8-2",
        title: {
          en: "Asking Names",
          es: "Preguntar Nombres",
        },
        description: {
          en: "Ask others what their name is",
          es: "Pregunta a otros cómo se llaman",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "asking for names",
            focusPoints: [
              "¿Cómo te llamas?",
              "¿Cómo se llama?",
              "¿Cuál es tu nombre?",
            ],
          },
          grammar: {
            topic: "formal vs informal",
            focusPoints: ["tú vs usted", "te llamas vs se llama"],
          },
        },
      },
      {
        id: "lesson-pre-a1-8-3",
        title: {
          en: "Nice to Meet You",
          es: "Mucho Gusto",
        },
        description: {
          en: "Complete the introduction with polite expressions",
          es: "Completa la presentación con expresiones corteses",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["vocabulary", "grammar", "realtime"],
        content: {
          vocabulary: {
            topic: "meeting expressions",
            focusPoints: [
              "mucho gusto",
              "encantado/a",
              "el gusto es mío",
              "igualmente",
            ],
          },
          grammar: {
            topic: "gender in expressions",
            focusPoints: ["encantado (male) vs encantada (female)"],
          },
          realtime: {
            scenario: "Meeting someone new",
            prompt: "Introduce yourself and learn someone's name",
            successCriteria:
              "The learner introduces themselves and asks for the other person's name.",
          },
        },
      },
      {
        id: "lesson-pre-a1-8-quiz",
        title: {
          en: "Introductions Quiz",
          es: "Prueba de Presentaciones",
        },
        description: {
          en: "Test your introduction skills",
          es: "Pon a prueba tus habilidades de presentación",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "introductions review",
            focusPoints: ["giving name", "asking name", "polite responses"],
          },
          grammar: {
            topic: "introduction patterns",
            focusPoints: ["formal/informal", "gender agreement"],
          },
        },
      },
    ],
  },
];
