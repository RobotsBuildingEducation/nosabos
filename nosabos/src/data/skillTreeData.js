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
 * Organized by proficiency level (beginner, intermediate, advanced)
 */
const baseLearningPath = {
  beginner: [
    {
      id: "unit-1",
      title: {
        en: "Basics 1",
        es: "Básicos 1",
      },
      description: {
        en: "Start your journey with essential greetings and introductions",
        es: "Comienza tu viaje en español con saludos esenciales y presentaciones",
      },
      color: "#22C55E", // Green
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-1-1",
          title: {
            en: "Hello & Goodbye",
            es: "Hola y Adiós",
          },
          description: {
            en: "Learn basic greetings",
            es: "Aprende saludos básicos",
          },
          xpRequired: 0, // First lesson always available
          xpReward: 20,
          modes: ["grammar", "reading"], // Which learning modes to use
          content: {
            grammar: {
              topic: "basic greetings",
              focusPoints: ["formal vs informal", "time-based greetings"],
            },
            reading: {
              topic: "greeting customs",
              prompt:
                "Learn about greeting customs and etiquette in Spanish-speaking cultures",
            },
          },
        },
        {
          id: "lesson-1-2",
          title: {
            en: "Introduce Yourself",
            es: "Preséntate",
          },
          description: {
            en: "Say your name and where you're from",
            es: "Di tu nombre y de dónde eres",
          },
          xpRequired: 20,
          xpReward: 25,
          modes: ["vocabulary", "realtime", "stories"],
          content: {
            vocabulary: {
              words: ["me llamo", "soy de", "nombre", "apellido", "país"],
              topic: "introductions",
            },
            realtime: {
              scenario: "introduction",
              prompt: "Practice introducing yourself in a conversation",
            },
            stories: {
              topic: "introductions",
              prompt:
                "Read and discuss stories about people meeting and introducing themselves",
            },
          },
        },
        {
          id: "lesson-1-3",
          title: {
            en: "Basic Questions",
            es: "Preguntas Básicas",
          },
          description: {
            en: "Ask and answer simple questions",
            es: "Hacer y responder preguntas simples",
          },
          xpRequired: 45,
          xpReward: 25,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "question formation",
              focusPoints: ["question words", "intonation", "word order"],
            },
            realtime: {
              scenario: "asking questions",
              prompt: "Practice asking and answering questions",
            },
          },
        },
        {
          id: "lesson-1-quiz",
          title: {
            en: "Unit 1 Quiz",
            es: "Prueba de Unidad 1",
          },
          description: {
            en: "Test your knowledge of greetings, introductions, and basic questions",
            es: "Pon a prueba tus conocimientos de saludos, presentaciones y preguntas básicas",
          },
          xpRequired: 70,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              // Use topics instead of hardcoded words to support any target language
              topic:
                "greetings and question words (hello, goodbye, good morning, good afternoon, good evening, how, what, where, when, why)",
            },
            grammar: {
              topics: [
                "basic greetings",
                "introductions",
                "question formation",
              ],
              focusPoints: [
                "formal vs informal greetings",
                "time-based greetings",
                "introducing yourself",
                "asking where someone is from",
                "basic question words",
                "question intonation",
                "question word order",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-2",
      title: {
        en: "Basics 2",
        es: "Básicos 2",
      },
      description: {
        en: "Express likes, dislikes, and talk about everyday things",
        es: "Expresa gustos, disgustos y habla de cosas cotidianas",
      },
      color: "#3B82F6", // Blue
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-2-1",
          title: {
            en: "Likes & Dislikes",
            es: "Gustos y Disgustos",
          },
          description: {
            en: "Talk about what you like and don't like",
            es: "Habla sobre lo que te gusta y no te gusta",
          },
          xpRequired: 70,
          xpReward: 30,
          modes: ["grammar", "stories"],
          content: {
            grammar: {
              topic: "gustar verb",
              focusPoints: ["indirect object pronouns", "singular vs plural"],
            },
            stories: {
              topic: "preferences",
              prompt: "Read a story about someone's favorite things",
            },
          },
        },
        {
          id: "lesson-2-2",
          title: {
            en: "Numbers 1-20",
            es: "Números 1-20",
          },
          description: {
            en: "Count and use basic numbers",
            es: "Cuenta y usa números básicos",
          },
          xpRequired: 100,
          xpReward: 30,
          modes: ["vocabulary"],
          content: {
            vocabulary: {
              words: [
                "uno",
                "dos",
                "tres",
                "cuatro",
                "cinco",
                "diez",
                "veinte",
              ],
              topic: "numbers",
            },
          },
        },
        {
          id: "lesson-2-3",
          title: {
            en: "Food & Drinks",
            es: "Comida y Bebidas",
          },
          description: {
            en: "Order food and talk about meals",
            es: "Pide comida y habla sobre las comidas",
          },
          xpRequired: 130,
          xpReward: 35,
          modes: ["grammar", "realtime", "stories"],
          content: {
            grammar: {
              topic: "food and restaurant language",
              focusPoints: [
                "querer + infinitive",
                "me gustaría",
                "tener + noun",
              ],
            },
            realtime: {
              scenario: "restaurant ordering",
              prompt: "Practice ordering food at a restaurant",
            },
            stories: {
              topic: "dining",
              prompt: "Read a story about a meal",
            },
          },
        },
        {
          id: "lesson-2-quiz",
          title: {
            en: "Unit 2 Quiz",
            es: "Prueba de Unidad 2",
          },
          description: {
            en: "Test your knowledge of likes/dislikes, numbers, and food vocabulary",
            es: "Pon a prueba tus conocimientos de gustos/disgustos, números y vocabulario de comida",
          },
          xpRequired: 165,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "preferences, numbers, and food and drinks",
            },
            grammar: {
              topics: [
                "gustar verb",
                "numbers and currency",
                "food and restaurant language",
              ],
              focusPoints: [
                "indirect object pronouns",
                "singular vs plural with gustar",
                "counting 1-20",
                "querer + infinitive",
                "me gustaría",
                "tener + noun",
                "restaurant ordering phrases",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-3",
      title: {
        en: "Daily Life",
        es: "Vida Diaria",
      },
      description: {
        en: "Describe your routine and talk about time",
        es: "Describe tu rutina y habla sobre el tiempo",
      },
      color: "#F59E0B", // Amber
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-3-1",
          title: {
            en: "Telling Time",
            es: "Decir la Hora",
          },
          description: {
            en: "Ask and tell the time",
            es: "Preguntar y decir la hora",
          },
          xpRequired: 165,
          xpReward: 35,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "telling time",
              focusPoints: ["¿Qué hora es?", "es la / son las", "y/menos"],
            },
          },
        },
        {
          id: "lesson-3-2",
          title: {
            en: "Daily Routine",
            es: "Rutina Diaria",
          },
          description: {
            en: "Talk about your day",
            es: "Habla sobre tu día",
          },
          xpRequired: 200,
          xpReward: 40,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: [
                "despertarse",
                "levantarse",
                "ducharse",
                "desayunar",
                "trabajar",
              ],
              topic: "daily activities",
            },
            stories: {
              topic: "daily routine",
              prompt: "Read about someone's typical day",
            },
          },
        },
        {
          id: "lesson-3-3",
          title: {
            en: "Family Members",
            es: "Miembros de la Familia",
          },
          description: {
            en: "Talk about your family",
            es: "Habla sobre tu familia",
          },
          xpRequired: 240,
          xpReward: 40,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "possessive adjectives",
              focusPoints: ["mi/tu/su", "family descriptions"],
            },
            realtime: {
              scenario: "family introduction",
              prompt: "Describe your family in a conversation",
            },
          },
        },
        {
          id: "lesson-3-quiz",
          title: {
            en: "Unit 3 Quiz",
            es: "Prueba de Unidad 3",
          },
          description: {
            en: "Test your knowledge of time, daily routines, and family",
            es: "Pon a prueba tus conocimientos del tiempo, rutinas diarias y familia",
          },
          xpRequired: 280,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time, daily activities, and family",
            },
            grammar: {
              topics: [
                "telling time",
                "daily routine",
                "possessive adjectives",
              ],
              focusPoints: [
                "¿Qué hora es?",
                "es la / son las",
                "y/menos",
                "reflexive verbs for daily activities",
                "mi/tu/su",
                "family member terms",
                "describing daily schedules",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-4",
      title: {
        en: "Getting Around",
        es: "Moviéndose",
      },
      description: {
        en: "Navigate places and give directions",
        es: "Navega lugares y da direcciones",
      },
      color: "#8B5CF6", // Purple
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-4-1",
          title: {
            en: "Places in Town",
            es: "Lugares en la Ciudad",
          },
          description: {
            en: "Name common locations",
            es: "Nombra ubicaciones comunes",
          },
          xpRequired: 280,
          xpReward: 40,
          modes: ["vocabulary"],
          content: {
            vocabulary: {
              words: ["banco", "supermercado", "hospital", "escuela", "parque"],
              topic: "places",
            },
          },
        },
        {
          id: "lesson-4-2",
          title: {
            en: "Directions",
            es: "Direcciones",
          },
          description: {
            en: "Ask for and give directions",
            es: "Pedir y dar direcciones",
          },
          xpRequired: 320,
          xpReward: 45,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "imperative mood",
              focusPoints: ["commands", "direction-giving"],
            },
            realtime: {
              scenario: "asking for directions",
              prompt: "Practice asking for and giving directions",
            },
          },
        },
        {
          id: "lesson-4-3",
          title: {
            en: "Transportation",
            es: "Transporte",
          },
          description: {
            en: "Talk about how you travel",
            es: "Habla sobre cómo viajas",
          },
          xpRequired: 365,
          xpReward: 45,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: ["autobús", "metro", "taxi", "bicicleta", "caminar"],
              topic: "transportation",
            },
            stories: {
              topic: "transportation",
              prompt: "Read about different ways to travel",
            },
          },
        },
        {
          id: "lesson-4-quiz",
          title: {
            en: "Unit 4 Quiz",
            es: "Prueba de Unidad 4",
          },
          description: {
            en: "Test your knowledge of places, directions, and transportation",
            es: "Pon a prueba tus conocimientos de lugares, direcciones y transporte",
          },
          xpRequired: 410,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "places, directions, and transportation",
            },
            grammar: {
              topics: [
                "imperative mood",
                "giving directions",
                "location prepositions",
              ],
              focusPoints: [
                "command forms",
                "direction verbs (girar, seguir, cruzar)",
                "location expressions (a la izquierda, a la derecha, todo recto)",
                "asking for directions",
                "transportation vocabulary in context",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-5",
      title: {
        en: "Shopping & Money",
        es: "Compras y Dinero",
      },
      description: {
        en: "Buy things and handle money",
        es: "Compra cosas y maneja dinero",
      },
      color: "#EC4899", // Pink
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-5-1",
          title: {
            en: "At the Store",
            es: "En la Tienda",
          },
          description: {
            en: "Shop for items",
            es: "Compra artículos",
          },
          xpRequired: 410,
          xpReward: 50,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: {
              words: ["comprar", "vender", "precio", "barato", "caro"],
              topic: "shopping",
            },
            realtime: {
              scenario: "shopping",
              prompt: "Practice shopping conversations",
            },
          },
        },
        {
          id: "lesson-5-2",
          title: {
            en: "Numbers 20-100",
            es: "Números 20-100",
          },
          description: {
            en: "Use larger numbers for prices",
            es: "Usa números más grandes para precios",
          },
          xpRequired: 460,
          xpReward: 50,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "numbers and currency",
              focusPoints: ["large numbers", "prices", "costar + amount"],
            },
          },
        },
        {
          id: "lesson-5-3",
          title: {
            en: "Clothing",
            es: "Ropa",
          },
          description: {
            en: "Describe what you wear",
            es: "Describe lo que vistes",
          },
          xpRequired: 510,
          xpReward: 50,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: ["camisa", "pantalón", "zapatos", "vestido", "llevar"],
              topic: "clothing",
            },
            stories: {
              topic: "clothing",
              prompt: "Read about fashion and clothing",
            },
          },
        },
        {
          id: "lesson-5-quiz",
          title: {
            en: "Unit 5 Quiz",
            es: "Prueba de Unidad 5",
          },
          description: {
            en: "Test your knowledge of shopping, numbers, and clothing vocabulary",
            es: "Pon a prueba tus conocimientos de compras, números y vocabulario de ropa",
          },
          xpRequired: 560,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping, numbers, and clothing",
            },
            grammar: {
              topics: [
                "numbers and currency",
                "shopping expressions",
                "clothing descriptions",
              ],
              focusPoints: [
                "numbers 20-100",
                "costar + amount",
                "price negotiations",
                "¿Cuánto cuesta?",
                "barato vs caro",
                "clothing items with colors",
                "shopping phrases (comprar, vender, precio)",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-6",
      title: {
        en: "Colors & Descriptions",
        es: "Colores y Descripciones",
      },
      description: {
        en: "Describe people, places, and things",
        es: "Describe personas, lugares y cosas",
      },
      color: "#F97316", // Orange
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-6-1",
          title: {
            en: "Colors",
            es: "Colores",
          },
          description: {
            en: "Learn and use colors",
            es: "Aprende y usa colores",
          },
          xpRequired: 560,
          xpReward: 50,
          modes: ["vocabulary"],
          content: {
            vocabulary: {
              words: ["rojo", "azul", "verde", "amarillo", "negro", "blanco"],
              topic: "colors",
            },
          },
        },
        {
          id: "lesson-6-2",
          title: {
            en: "Physical Descriptions",
            es: "Descripciones Físicas",
          },
          description: {
            en: "Describe how people look",
            es: "Describe cómo se ve la gente",
          },
          xpRequired: 610,
          xpReward: 55,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "ser vs estar for descriptions",
              focusPoints: ["permanent vs temporary traits"],
            },
            realtime: {
              scenario: "describing people",
              prompt: "Describe family members or friends",
            },
          },
        },
        {
          id: "lesson-6-3",
          title: {
            en: "Personality Traits",
            es: "Rasgos de Personalidad",
          },
          description: {
            en: "Describe character and personality",
            es: "Describe carácter y personalidad",
          },
          xpRequired: 665,
          xpReward: 55,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: [
                "simpático",
                "amable",
                "inteligente",
                "divertido",
                "serio",
              ],
              topic: "personality",
            },
            stories: {
              topic: "character descriptions",
              prompt: "Read stories with diverse characters",
            },
          },
        },
        {
          id: "lesson-6-quiz",
          title: {
            en: "Unit 6 Quiz",
            es: "Prueba de Unidad 6",
          },
          description: {
            en: "Test your knowledge of colors, physical traits, and personality",
            es: "Pon a prueba tus conocimientos de colores, rasgos físicos y personalidad",
          },
          xpRequired: 720,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "colors, physical descriptions, and personality",
            },
            grammar: {
              topics: [
                "ser vs estar for descriptions",
                "adjective agreement",
                "descriptive language",
              ],
              focusPoints: [
                "permanent traits with ser",
                "temporary states with estar",
                "color adjectives",
                "physical description adjectives (alto, bajo, joven, viejo)",
                "personality adjectives (simpático, amable, inteligente)",
                "gender and number agreement",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-7",
      title: {
        en: "Hobbies & Free Time",
        es: "Pasatiempos y Tiempo Libre",
      },
      description: {
        en: "Talk about activities and interests",
        es: "Habla sobre actividades e intereses",
      },
      color: "#06B6D4", // Cyan
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-7-1",
          title: {
            en: "Sports & Exercise",
            es: "Deportes y Ejercicio",
          },
          description: {
            en: "Discuss sports and physical activities",
            es: "Discute deportes y actividades físicas",
          },
          xpRequired: 720,
          xpReward: 55,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: {
              words: ["fútbol", "nadar", "correr", "jugar", "practicar"],
              topic: "sports",
            },
            realtime: {
              scenario: "sports conversation",
              prompt: "Talk about your favorite sports",
            },
          },
        },
        {
          id: "lesson-7-2",
          title: {
            en: "Music & Entertainment",
            es: "Música y Entretenimiento",
          },
          description: {
            en: "Express preferences in entertainment",
            es: "Expresa preferencias en entretenimiento",
          },
          xpRequired: 775,
          xpReward: 60,
          modes: ["grammar", "stories", "realtime"],
          content: {
            grammar: {
              topic: "expressing preferences and opinions",
              focusPoints: ["me parece", "creo que", "preference verbs"],
            },
            stories: {
              topic: "music and movies",
              prompt: "Read about cultural entertainment",
            },
            realtime: {
              scenario: "entertainment discussion",
              prompt: "Discuss music and movies you enjoy",
            },
          },
        },
        {
          id: "lesson-7-3",
          title: {
            en: "Reading & Arts",
            es: "Lectura y Artes",
          },
          description: {
            en: "Talk about books and creative activities",
            es: "Habla sobre libros y actividades creativas",
          },
          xpRequired: 835,
          xpReward: 60,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: ["libro", "leer", "escribir", "dibujar", "pintar"],
              topic: "arts and reading",
            },
            stories: {
              topic: "books and art",
              prompt: "Read about famous Hispanic artists",
            },
          },
        },
        {
          id: "lesson-7-quiz",
          title: {
            en: "Unit 7 Quiz",
            es: "Prueba de Unidad 7",
          },
          description: {
            en: "Test your knowledge of hobbies, sports, entertainment, and arts",
            es: "Pon a prueba tus conocimientos de pasatiempos, deportes, entretenimiento y artes",
          },
          xpRequired: 895,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "sports, entertainment, and arts and reading",
            },
            grammar: {
              topics: [
                "expressing preferences and opinions",
                "hobby-related verbs",
                "leisure activities",
              ],
              focusPoints: [
                "jugar vs practicar with sports",
                "me parece",
                "creo que",
                "preference verbs",
                "entertainment vocabulary",
                "arts and creative activities",
                "discussing hobbies and interests",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-8",
      title: {
        en: "Past Experiences",
        es: "Experiencias Pasadas",
      },
      description: {
        en: "Talk about things you did",
        es: "Habla sobre cosas que hiciste",
      },
      color: "#14B8A6", // Teal
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-8-1",
          title: {
            en: "Preterite Tense Intro",
            es: "Introducción al Pretérito",
          },
          description: {
            en: "Talk about completed past actions",
            es: "Habla sobre acciones pasadas completadas",
          },
          xpRequired: 895,
          xpReward: 60,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "preterite tense",
              focusPoints: ["regular -ar verbs", "past time markers"],
            },
          },
        },
        {
          id: "lesson-8-2",
          title: {
            en: "Weekend Activities",
            es: "Actividades del Fin de Semana",
          },
          description: {
            en: "Describe what you did last weekend",
            es: "Describe qué hiciste el fin de semana pasado",
          },
          xpRequired: 955,
          xpReward: 60,
          modes: ["vocabulary", "realtime", "stories"],
          content: {
            vocabulary: {
              words: ["fin de semana", "ayer", "anoche", "la semana pasada"],
              topic: "time expressions",
            },
            realtime: {
              scenario: "weekend recap",
              prompt: "Talk about what you did last weekend",
            },
            stories: {
              topic: "weekend activities",
              prompt: "Read about someone's weekend",
            },
          },
        },
        {
          id: "lesson-8-3",
          title: {
            en: "Travel Stories",
            es: "Historias de Viaje",
          },
          description: {
            en: "Share travel experiences",
            es: "Comparte experiencias de viaje",
          },
          xpRequired: 1015,
          xpReward: 65,
          modes: ["stories", "grammar"],
          content: {
            grammar: {
              topic: "preterite -er/-ir verbs",
              focusPoints: ["regular verbs", "irregular verbs", "past actions"],
            },
            stories: {
              topic: "travel",
              prompt: "Read and discuss travel stories",
            },
          },
        },
        {
          id: "lesson-8-quiz",
          title: {
            en: "Unit 8 Quiz",
            es: "Prueba de Unidad 8",
          },
          description: {
            en: "Test your knowledge of preterite tense and past experiences",
            es: "Pon a prueba tus conocimientos del tiempo pretérito y experiencias pasadas",
          },
          xpRequired: 1080,
          xpReward: 65,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "time expressions and travel",
            },
            grammar: {
              topics: [
                "preterite tense",
                "past time expressions",
                "completed actions",
              ],
              focusPoints: [
                "regular -ar verbs in preterite",
                "regular -er/-ir verbs in preterite",
                "irregular preterite verbs",
                "past time markers (ayer, anoche, la semana pasada)",
                "talking about completed past actions",
                "travel vocabulary in past tense",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-9",
      title: {
        en: "Ongoing Past",
        es: "Pasado Continuo",
      },
      description: {
        en: "Describe what was happening",
        es: "Describe lo que estaba pasando",
      },
      color: "#F97316", // Orange
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-9-1",
          title: {
            en: "Imperfect Tense",
            es: "Tiempo Imperfecto",
          },
          description: {
            en: "Describe past habits and states",
            es: "Describe hábitos y estados pasados",
          },
          xpRequired: 1080,
          xpReward: 65,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "imperfect tense",
              focusPoints: ["formation", "uses vs preterite"],
            },
          },
        },
        {
          id: "lesson-9-2",
          title: {
            en: "Childhood Memories",
            es: "Recuerdos de la Infancia",
          },
          description: {
            en: "Talk about when you were young",
            es: "Habla sobre cuando eras joven",
          },
          xpRequired: 1145,
          xpReward: 70,
          modes: ["vocabulary", "stories", "realtime"],
          content: {
            vocabulary: {
              words: ["niñez", "infancia", "jugar", "crecer", "recuerdo"],
              topic: "childhood",
            },
            stories: {
              topic: "childhood",
              prompt: "Read about childhood memories",
            },
            realtime: {
              scenario: "childhood stories",
              prompt: "Share stories from your childhood",
            },
          },
        },
        {
          id: "lesson-9-3",
          title: {
            en: "Weather & Seasons",
            es: "Clima y Estaciones",
          },
          description: {
            en: "Describe weather and seasons",
            es: "Describe el clima y las estaciones",
          },
          xpRequired: 1215,
          xpReward: 70,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "weather expressions",
              focusPoints: ["hacer, estar, hay", "imperfect tense for weather"],
            },
          },
        },
        {
          id: "lesson-9-quiz",
          title: {
            en: "Unit 9 Quiz",
            es: "Prueba de Unidad 9",
          },
          description: {
            en: "Test your knowledge of imperfect tense, childhood, and weather",
            es: "Pon a prueba tus conocimientos del tiempo imperfecto, infancia y clima",
          },
          xpRequired: 1285,
          xpReward: 70,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "childhood and weather",
            },
            grammar: {
              topics: [
                "imperfect tense",
                "weather expressions",
                "imperfect vs preterite",
              ],
              focusPoints: [
                "imperfect tense formation",
                "past habits and states",
                "describing ongoing past actions",
                "weather verbs (hacer, estar, hay)",
                "imperfect for weather descriptions",
                "childhood vocabulary in context",
                "when to use imperfect vs preterite",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-10",
      title: {
        en: "Future Plans",
        es: "Planes Futuros",
      },
      description: {
        en: "Talk about what you will do",
        es: "Habla sobre lo que harás",
      },
      color: "#06B6D4", // Cyan
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-10-1",
          title: {
            en: "Future with Ir + a",
            es: "Futuro con Ir + a",
          },
          description: {
            en: "Express near future plans",
            es: "Expresa planes del futuro cercano",
          },
          xpRequired: 1285,
          xpReward: 75,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "ir a + infinitive",
              focusPoints: ["formation", "time expressions"],
            },
            realtime: {
              scenario: "future plans",
              prompt: "Discuss your plans for tomorrow",
            },
          },
        },
        {
          id: "lesson-10-2",
          title: {
            en: "Simple Future Tense",
            es: "Futuro Simple",
          },
          description: {
            en: "Use the future tense",
            es: "Usa el tiempo futuro",
          },
          xpRequired: 1360,
          xpReward: 75,
          modes: ["vocabulary"],
          content: {
            vocabulary: {
              words: ["mañana", "próximo", "futuro", "después", "luego"],
              topic: "future time expressions",
            },
          },
        },
        {
          id: "lesson-10-3",
          title: {
            en: "Career Goals",
            es: "Metas Profesionales",
          },
          description: {
            en: "Discuss career aspirations",
            es: "Discute aspiraciones profesionales",
          },
          xpRequired: 1435,
          xpReward: 80,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "simple future tense",
              focusPoints: [
                "regular endings",
                "irregular verbs",
                "future planning",
              ],
            },
            realtime: {
              scenario: "career planning",
              prompt: "Talk about your professional future",
            },
          },
        },
        {
          id: "lesson-10-quiz",
          title: {
            en: "Unit 10 Quiz",
            es: "Prueba de Unidad 10",
          },
          description: {
            en: "Test your knowledge of future tenses and career planning",
            es: "Pon a prueba tus conocimientos de tiempos futuros y planificación profesional",
          },
          xpRequired: 1515,
          xpReward: 75,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "careers and time expressions",
            },
            grammar: {
              topics: [
                "ir a + infinitive",
                "simple future tense",
                "future planning",
              ],
              focusPoints: [
                "ir + a + infinitive structure",
                "near future plans",
                "simple future tense formation",
                "regular future endings",
                "irregular future verbs",
                "time expressions for future (mañana, próximo, después)",
                "career vocabulary in future tense",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-11",
      title: {
        en: "Health & Body",
        es: "Salud y Cuerpo",
      },
      description: {
        en: "Talk about health and wellness",
        es: "Habla sobre salud y bienestar",
      },
      color: "#10B981", // Emerald
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-11-1",
          title: {
            en: "Body Parts",
            es: "Partes del Cuerpo",
          },
          description: {
            en: "Learn vocabulary for the body",
            es: "Aprende vocabulario del cuerpo",
          },
          xpRequired: 1515,
          xpReward: 70,
          modes: ["vocabulary"],
          content: {
            vocabulary: {
              words: ["cabeza", "brazo", "pierna", "mano", "pie", "ojo"],
              topic: "body parts",
            },
          },
        },
        {
          id: "lesson-11-2",
          title: {
            en: "At the Doctor",
            es: "En el Médico",
          },
          description: {
            en: "Describe symptoms and ailments",
            es: "Describe síntomas y dolencias",
          },
          xpRequired: 1585,
          xpReward: 75,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "expressing pain",
              focusPoints: ["me duele/me duelen", "doler verb", "body parts"],
            },
            realtime: {
              scenario: "doctor visit",
              prompt: "Practice a conversation at the doctor's office",
            },
          },
        },
        {
          id: "lesson-11-3",
          title: {
            en: "Healthy Habits",
            es: "Hábitos Saludables",
          },
          description: {
            en: "Discuss exercise and wellness",
            es: "Discute ejercicio y bienestar",
          },
          xpRequired: 1660,
          xpReward: 75,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: [
                "ejercicio",
                "saludable",
                "dieta",
                "descansar",
                "energía",
              ],
              topic: "wellness",
            },
            stories: {
              topic: "healthy living",
              prompt: "Read about maintaining a healthy lifestyle",
            },
          },
        },
        {
          id: "lesson-11-quiz",
          title: {
            en: "Unit 11 Quiz",
            es: "Prueba de Unidad 11",
          },
          description: {
            en: "Test your knowledge of body parts, health, and wellness",
            es: "Pon a prueba tus conocimientos de partes del cuerpo, salud y bienestar",
          },
          xpRequired: 1735,
          xpReward: 75,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "body parts, health, and wellness",
            },
            grammar: {
              topics: [
                "expressing pain",
                "health-related expressions",
                "wellness vocabulary",
              ],
              focusPoints: [
                "me duele/me duelen",
                "doler verb conjugation",
                "body parts with articles",
                "doctor visit phrases",
                "symptoms and ailments",
                "healthy living expressions",
                "health advice (deber + infinitive)",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-12",
      title: {
        en: "Environment & Nature",
        es: "Medio Ambiente y Naturaleza",
      },
      description: {
        en: "Discuss nature and environmental topics",
        es: "Discute temas de naturaleza y medio ambiente",
      },
      color: "#84CC16", // Lime
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-12-1",
          title: {
            en: "Animals & Plants",
            es: "Animales y Plantas",
          },
          description: {
            en: "Learn vocabulary about nature",
            es: "Aprende vocabulario sobre la naturaleza",
          },
          xpRequired: 1735,
          xpReward: 75,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: ["animal", "perro", "gato", "árbol", "flor", "bosque"],
              topic: "nature",
            },
            stories: {
              topic: "wildlife",
              prompt: "Read about Latin American wildlife",
            },
          },
        },
        {
          id: "lesson-12-2",
          title: {
            en: "Environmental Issues",
            es: "Problemas Ambientales",
          },
          description: {
            en: "Discuss ecology and conservation",
            es: "Discute ecología y conservación",
          },
          xpRequired: 1810,
          xpReward: 80,
          modes: ["grammar", "realtime", "reading"],
          content: {
            grammar: {
              topic: "environmental language",
              focusPoints: [
                "conditional tense",
                "should/would",
                "environmental expressions",
              ],
            },
            realtime: {
              scenario: "environmental discussion",
              prompt: "Discuss environmental concerns",
            },
            reading: {
              topic: "conservation",
              prompt: "Learn about environmental movements",
            },
          },
        },
        {
          id: "lesson-12-3",
          title: {
            en: "Geography & Landscapes",
            es: "Geografía y Paisajes",
          },
          description: {
            en: "Describe natural features and places",
            es: "Describe características y lugares naturales",
          },
          xpRequired: 1890,
          xpReward: 80,
          modes: ["vocabulary", "stories"],
          content: {
            vocabulary: {
              words: ["montaña", "río", "mar", "playa", "desierto", "valle"],
              topic: "geography",
            },
            stories: {
              topic: "landscapes",
              prompt: "Read about diverse Latin American landscapes",
            },
          },
        },
        {
          id: "lesson-12-quiz",
          title: {
            en: "Unit 12 Quiz",
            es: "Prueba de Unidad 12",
          },
          description: {
            en: "Test your knowledge of nature, environment, and geography",
            es: "Pon a prueba tus conocimientos de naturaleza, medio ambiente y geografía",
          },
          xpRequired: 1970,
          xpReward: 80,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "nature, environment, and geography",
            },
            grammar: {
              topics: [
                "environmental language",
                "conditional tense",
                "descriptive expressions for nature",
              ],
              focusPoints: [
                "conditional tense formation",
                "should/would expressions",
                "environmental vocabulary in context",
                "nature and wildlife terms",
                "geographical features",
                "conservation and ecology expressions",
                "expressing environmental concerns",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-13",
      title: {
        en: "Subjunctive Mood",
        es: "Modo Subjuntivo",
      },
      description: {
        en: "Express wishes, doubts, and emotions",
        es: "Expresa deseos, dudas y emociones",
      },
      color: "#7C3AED", // Violet
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-13-1",
          title: {
            en: "Present Subjunctive Intro",
            es: "Introducción al Subjuntivo Presente",
          },
          description: {
            en: "Learn subjunctive formation",
            es: "Aprende la formación del subjuntivo",
          },
          xpRequired: 1970,
          xpReward: 90,
          modes: ["grammar"],
          content: {
            grammar: {
              topic: "present subjunctive",
              focusPoints: ["formation", "trigger phrases"],
            },
          },
        },
        {
          id: "lesson-13-2",
          title: {
            en: "Wishes & Desires",
            es: "Deseos y Anhelos",
          },
          description: {
            en: "Express hopes and wishes",
            es: "Expresa esperanzas y deseos",
          },
          xpRequired: 2060,
          xpReward: 90,
          modes: ["vocabulary", "realtime", "stories"],
          content: {
            vocabulary: {
              words: ["deseo", "esperanza", "sueño", "anhelo", "ojalá"],
              topic: "wishes and desires",
            },
            realtime: {
              scenario: "expressing wishes",
              prompt: "Talk about your hopes and desires",
            },
            stories: {
              topic: "aspirations",
              prompt: "Read about people pursuing their dreams",
            },
          },
        },
        {
          id: "lesson-13-3",
          title: {
            en: "Doubts & Denials",
            es: "Dudas y Negaciones",
          },
          description: {
            en: "Express uncertainty",
            es: "Expresa incertidumbre",
          },
          xpRequired: 2150,
          xpReward: 95,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "subjunctive with doubt",
              focusPoints: ["dudar, no creer, negar"],
            },
          },
        },
        {
          id: "lesson-13-quiz",
          title: {
            en: "Unit 13 Quiz",
            es: "Prueba de Unidad 13",
          },
          description: {
            en: "Test your knowledge of the subjunctive mood",
            es: "Pon a prueba tus conocimientos del modo subjuntivo",
          },
          xpRequired: 2245,
          xpReward: 95,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "wishes and desires and global issues",
            },
            grammar: {
              topics: [
                "present subjunctive",
                "subjunctive trigger phrases",
                "wishes and doubts",
              ],
              focusPoints: [
                "present subjunctive formation",
                "trigger phrases that require subjunctive",
                "expressing wishes (esperar que, querer que, desear que)",
                "expressing doubt (dudar, no creer, negar)",
                "ojalá expressions",
                "subjunctive vs indicative",
                "irregular subjunctive forms",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-14",
      title: {
        en: "Complex Conversations",
        es: "Conversaciones Complejas",
      },
      description: {
        en: "Engage in sophisticated discussions",
        es: "Participa en discusiones sofisticadas",
      },
      color: "#DC2626", // Red
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-14-1",
          title: {
            en: "Debate & Persuasion",
            es: "Debate y Persuasión",
          },
          description: {
            en: "Argue and persuade effectively",
            es: "Argumenta y persuade efectivamente",
          },
          xpRequired: 2245,
          xpReward: 100,
          modes: ["realtime", "vocabulary"],
          content: {
            vocabulary: {
              words: ["argumentar", "convencer", "debatir", "persuadir"],
              topic: "debate",
            },
            realtime: {
              scenario: "debate",
              prompt: "Engage in a structured debate",
            },
          },
        },
        {
          id: "lesson-14-2",
          title: {
            en: "Current Events",
            es: "Actualidad",
          },
          description: {
            en: "Discuss news and events",
            es: "Discute noticias y eventos",
          },
          xpRequired: 2345,
          xpReward: 100,
          modes: ["reading", "realtime", "grammar"],
          content: {
            grammar: {
              topic: "news and reporting language",
              focusPoints: [
                "passive voice",
                "reported speech",
                "news expressions",
              ],
            },
            reading: {
              topic: "current events",
              prompt: "Read and discuss current news",
            },
            realtime: {
              scenario: "news discussion",
              prompt: "Discuss recent events",
            },
          },
        },
        {
          id: "lesson-14-3",
          title: {
            en: "Professional Communication",
            es: "Comunicación Profesional",
          },
          description: {
            en: "Master workplace language",
            es: "Domina el lenguaje laboral",
          },
          xpRequired: 2445,
          xpReward: 110,
          modes: ["realtime", "vocabulary"],
          content: {
            vocabulary: {
              words: ["reunión", "presentación", "informe", "negociar"],
              topic: "professional",
            },
            realtime: {
              scenario: "workplace conversation",
              prompt: "Navigate workplace scenarios",
            },
          },
        },
        {
          id: "lesson-14-quiz",
          title: {
            en: "Unit 14 Quiz",
            es: "Prueba de Unidad 14",
          },
          description: {
            en: "Test your knowledge of debate, current events, and professional language",
            es: "Pon a prueba tus conocimientos de debate, actualidad y lenguaje profesional",
          },
          xpRequired: 2555,
          xpReward: 100,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "debate, current events, and professional",
            },
            grammar: {
              topics: [
                "news and reporting language",
                "passive voice",
                "formal communication",
              ],
              focusPoints: [
                "passive voice construction",
                "reported speech",
                "news expressions",
                "debate and persuasion vocabulary",
                "professional communication phrases",
                "formal vs informal registers",
                "argumentation structures",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-15",
      title: {
        en: "Literature & Arts",
        es: "Literatura y Artes",
      },
      description: {
        en: "Explore Hispanic culture and creativity",
        es: "Explora la cultura y creatividad hispana",
      },
      color: "#DB2777", // Pink-600
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-15-1",
          title: {
            en: "Poetry & Prose",
            es: "Poesía y Prosa",
          },
          description: {
            en: "Read and analyze literature",
            es: "Lee y analiza literatura",
          },
          xpRequired: 2555,
          xpReward: 100,
          modes: ["stories", "vocabulary", "reading"],
          content: {
            vocabulary: {
              words: ["poeta", "verso", "metáfora", "narrativa", "estilo"],
              topic: "literature",
            },
            stories: {
              topic: "literature",
              prompt: "Read works by famous Hispanic authors",
            },
            reading: {
              topic: "literary movements",
              prompt: "Learn about Hispanic literary history",
            },
          },
        },
        {
          id: "lesson-15-2",
          title: {
            en: "Visual Arts",
            es: "Artes Visuales",
          },
          description: {
            en: "Discuss painting and sculpture",
            es: "Discute pintura y escultura",
          },
          xpRequired: 2655,
          xpReward: 105,
          modes: ["grammar", "reading", "realtime"],
          content: {
            grammar: {
              topic: "describing art",
              focusPoints: [
                "present progressive",
                "aesthetic descriptions",
                "art criticism",
              ],
            },
            reading: {
              topic: "Hispanic artists",
              prompt: "Learn about Frida Kahlo, Diego Rivera, and more",
            },
            realtime: {
              scenario: "art discussion",
              prompt: "Discuss artistic works and styles",
            },
          },
        },
        {
          id: "lesson-15-3",
          title: {
            en: "Cinema & Theater",
            es: "Cine y Teatro",
          },
          description: {
            en: "Explore performing arts",
            es: "Explora artes escénicas",
          },
          xpRequired: 2760,
          xpReward: 105,
          modes: ["vocabulary", "stories", "realtime"],
          content: {
            vocabulary: {
              words: ["película", "director", "actor", "escena", "guion"],
              topic: "cinema",
            },
            stories: {
              topic: "Hispanic cinema",
              prompt: "Learn about influential Hispanic films",
            },
            realtime: {
              scenario: "film discussion",
              prompt: "Discuss movies and performances",
            },
          },
        },
        {
          id: "lesson-15-quiz",
          title: {
            en: "Unit 15 Quiz",
            es: "Prueba de Unidad 15",
          },
          description: {
            en: "Test your knowledge of literature, visual arts, and cinema",
            es: "Pon a prueba tus conocimientos de literatura, artes visuales y cine",
          },
          xpRequired: 2865,
          xpReward: 105,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "literature, visual arts, and cinema",
            },
            grammar: {
              topics: [
                "describing art",
                "aesthetic expressions",
                "cultural commentary",
              ],
              focusPoints: [
                "present progressive for art descriptions",
                "aesthetic vocabulary",
                "literary terms (metáfora, narrativa, verso)",
                "visual arts vocabulary (lienzo, pincel, galería)",
                "cinema terms (director, escena, guion)",
                "expressing artistic opinions",
                "art criticism language",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-16",
      title: {
        en: "Technology & Innovation",
        es: "Tecnología e Innovación",
      },
      description: {
        en: "Discuss modern technology and digital life",
        es: "Discute tecnología moderna y vida digital",
      },
      color: "#0EA5E9", // Sky-500
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-16-1",
          title: {
            en: "Digital Communication",
            es: "Comunicación Digital",
          },
          description: {
            en: "Navigate online interactions",
            es: "Navega interacciones en línea",
          },
          xpRequired: 2865,
          xpReward: 105,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: {
              words: [
                "internet",
                "correo",
                "mensaje",
                "aplicación",
                "red social",
              ],
              topic: "digital communication",
            },
            realtime: {
              scenario: "online conversation",
              prompt: "Practice digital communication",
            },
          },
        },
        {
          id: "lesson-16-2",
          title: {
            en: "Science & Progress",
            es: "Ciencia y Progreso",
          },
          description: {
            en: "Discuss scientific advancement",
            es: "Discute avance científico",
          },
          xpRequired: 2970,
          xpReward: 110,
          modes: ["grammar", "reading", "realtime"],
          content: {
            grammar: {
              topic: "scientific language",
              focusPoints: [
                "passive constructions",
                "technical terminology",
                "cause and effect",
              ],
            },
            reading: {
              topic: "Hispanic scientists",
              prompt: "Learn about Hispanic contributions to science",
            },
            realtime: {
              scenario: "science discussion",
              prompt: "Discuss technological innovations",
            },
          },
        },
        {
          id: "lesson-16-3",
          title: {
            en: "Digital Economy",
            es: "Economía Digital",
          },
          description: {
            en: "Talk about modern business and tech",
            es: "Habla sobre negocios modernos y tecnología",
          },
          xpRequired: 3080,
          xpReward: 110,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: {
              words: [
                "emprendedor",
                "startup",
                "digital",
                "comercio",
                "plataforma",
              ],
              topic: "digital economy",
            },
            realtime: {
              scenario: "business tech discussion",
              prompt: "Discuss digital business trends",
            },
          },
        },
        {
          id: "lesson-16-quiz",
          title: {
            en: "Unit 16 Quiz",
            es: "Prueba de Unidad 16",
          },
          description: {
            en: "Test your knowledge of technology, science, and digital economy",
            es: "Pon a prueba tus conocimientos de tecnología, ciencia y economía digital",
          },
          xpRequired: 3190,
          xpReward: 110,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "digital communication, science, and digital economy",
            },
            grammar: {
              topics: [
                "scientific language",
                "technical terminology",
                "cause and effect",
              ],
              focusPoints: [
                "passive constructions in technical contexts",
                "scientific vocabulary",
                "digital communication terms (internet, correo, mensaje, aplicación)",
                "science terms (experimento, laboratorio, hipótesis)",
                "digital economy vocabulary (startup, plataforma, comercio)",
                "expressing technological concepts",
                "cause and effect expressions",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-17",
      title: {
        en: "Social Issues & Ethics",
        es: "Problemas Sociales y Ética",
      },
      description: {
        en: "Engage with complex social topics",
        es: "Participa en temas sociales complejos",
      },
      color: "#A855F7", // Purple-500
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-17-1",
          title: {
            en: "Social Justice",
            es: "Justicia Social",
          },
          description: {
            en: "Discuss equality and rights",
            es: "Discute igualdad y derechos",
          },
          xpRequired: 3190,
          xpReward: 115,
          modes: ["vocabulary", "realtime", "reading"],
          content: {
            vocabulary: {
              words: [
                "justicia",
                "igualdad",
                "derechos",
                "diversidad",
                "inclusión",
              ],
              topic: "social justice",
            },
            realtime: {
              scenario: "social issues discussion",
              prompt: "Discuss social justice topics",
            },
            reading: {
              topic: "civil rights movements",
              prompt: "Learn about Hispanic social movements",
            },
          },
        },
        {
          id: "lesson-17-2",
          title: {
            en: "Global Challenges",
            es: "Desafíos Globales",
          },
          description: {
            en: "Address worldwide issues",
            es: "Aborda problemas mundiales",
          },
          xpRequired: 3305,
          xpReward: 120,
          modes: ["grammar", "realtime"],
          content: {
            grammar: {
              topic: "advanced expressions",
              focusPoints: ["complex conditionals", "hypothetical situations"],
            },
            realtime: {
              scenario: "global discussion",
              prompt: "Discuss international challenges",
            },
          },
        },
        {
          id: "lesson-17-quiz",
          title: {
            en: "Unit 17 Quiz",
            es: "Prueba de Unidad 17",
          },
          description: {
            en: "Test your knowledge of social justice, global challenges, and ethics",
            es: "Pon a prueba tus conocimientos de justicia social, desafíos globales y ética",
          },
          xpRequired: 3425,
          xpReward: 120,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "social justice and global issues",
            },
            grammar: {
              topics: [
                "advanced expressions",
                "complex conditionals",
                "social discourse",
              ],
              focusPoints: [
                "complex conditional structures",
                "hypothetical situations",
                "si clauses with subjunctive",
                "social justice vocabulary (justicia, igualdad, derechos, diversidad)",
                "global issues terms (clima, migración, cooperación, sostenibilidad)",
                "expressing social concerns",
                "discussing ethical topics",
              ],
            },
          },
        },
      ],
    },
  ],
  intermediate: [],
  advanced: [],
};

const SUPPORTED_TARGET_LANGS = new Set(["en", "es", "pt", "fr", "it", "nah"]);
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

const cloneLearningPath = () => JSON.parse(JSON.stringify(baseLearningPath));

export const LEARNING_PATHS = {
  es: cloneLearningPath(), // Spanish
  en: cloneLearningPath(), // English
  pt: cloneLearningPath(), // Portuguese
  fr: cloneLearningPath(), // French
  it: cloneLearningPath(), // Italian
  nah: cloneLearningPath(), // Nahuatl
};

/**
 * Get the learning path for a specific language and level
 */
export function getLearningPath(targetLang, level) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;
  const units = LEARNING_PATHS[lang]?.[level] || [];
  return localizeLearningPath(units, lang);
}

/**
 * Calculate total XP required to complete a unit
 */
export function getUnitTotalXP(unit) {
  return unit.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
}

/**
 * Get the next available lesson for a user based on their current XP
 */
export function getNextLesson(units, userProgress) {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const lessonProgress = userProgress.lessons?.[lesson.id];
      if (!lessonProgress || lessonProgress.status !== SKILL_STATUS.COMPLETED) {
        if (userProgress.totalXp >= lesson.xpRequired) {
          return { unit, lesson };
        }
        return null; // Next lesson is still locked
      }
    }
  }
  return null; // All lessons completed!
}

/**
 * Calculate progress percentage for a unit
 */
export function getUnitProgress(unit, userProgress) {
  const completedLessons = unit.lessons.filter(
    (lesson) =>
      userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
  );
  return (completedLessons.length / unit.lessons.length) * 100;
}
