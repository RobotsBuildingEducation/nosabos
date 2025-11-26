/**
 * Skill Tree Data Structure for Language Learning
 *
 * This file defines the structured learning path with units and lessons.
 * The updated curriculum deepens coverage for each CEFR level with
 * level-appropriate communicative goals, grammar targets, and vocabulary.
 */

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const baseLearningPath = {
  A1: [
    {
      id: "unit-a1-1",
      title: { en: "Survival Basics", es: "Básicos de Supervivencia" },
      description: { en: "Greet people and exchange polite phrases", es: "Saluda y usa frases corteses" },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-1-1",
          title: { en: "Essential Greetings", es: "Saludos Esenciales" },
          description: { en: "Say hello, goodbye, and check in on someone", es: "Di hola, adiós y pregunta cómo está alguien" },
          xpRequired: 0,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "greetings" },
            grammar: { topic: "greeting patterns", focusPoints: ["question intonation", "basic pronouns"] },
          },
        },
        {
          id: "lesson-a1-1-2",
          title: { en: "Courtesy in Action", es: "Cortesía en Acción" },
          description: { en: "Use please/thank you and polite responses", es: "Usa por favor/gracias y respuestas corteses" },
          xpRequired: 15,
          xpReward: 15,
          modes: ["realtime", "stories"],
          content: {
            realtime: { scenario: "short polite exchanges", prompt: "Handle simple checkouts and first meetings" },
            stories: { topic: "polite exchanges", prompt: "Read mini-dialogues with courtesy phrases" },
          },
        },
        {
          id: "lesson-a1-1-3",
          title: { en: "Introducing Yourself", es: "Presentarte" },
          description: { en: "Share your name and ask for someone else's", es: "Di tu nombre y pregunta el de otra persona" },
          xpRequired: 30,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "introductions" },
            grammar: { topic: "basic questions", focusPoints: ["what's your name", "where are you from"] },
          },
        },
        {
          id: "lesson-a1-1-quiz",
          title: { en: "Survival Basics Quiz", es: "Quiz de Básicos" },
          description: { en: "Review greetings and politeness", es: "Repasa saludos y cortesía" },
          xpRequired: 45,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "greetings" },
            grammar: { topics: ["greeting patterns", "basic questions"], focusPoints: ["polite forms", "question order"] },
          },
        },
      ],
    },
    {
      id: "unit-a1-2",
      title: { en: "Personal Details", es: "Datos Personales" },
      description: { en: "Share personal info and talk about family", es: "Comparte datos personales y habla de la familia" },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-2-1",
          title: { en: "Name & Origin", es: "Nombre y Origen" },
          description: { en: "Say where you're from and your age", es: "Di de dónde eres y tu edad" },
          xpRequired: 80,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "personal information" },
            grammar: { topic: "ser vs. estar basics", focusPoints: ["nationality adjectives", "age expressions"] },
          },
        },
        {
          id: "lesson-a1-2-2",
          title: { en: "Family Words", es: "Palabras de Familia" },
          description: { en: "Introduce family members and relationships", es: "Presenta miembros de la familia y relaciones" },
          xpRequired: 95,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "family" },
            grammar: { topic: "possessive adjectives", focusPoints: ["mi/tu/su", "plural family terms"] },
          },
        },
        {
          id: "lesson-a1-2-3",
          title: { en: "Talking About You", es: "Hablando de Ti" },
          description: { en: "Describe what you like and simple routines", es: "Describe lo que te gusta y rutinas simples" },
          xpRequired: 110,
          xpReward: 15,
          modes: ["reading", "realtime"],
          content: {
            reading: { topic: "short bios", prompt: "Read mini-profiles with likes and jobs" },
            realtime: { scenario: "meet-and-greet", prompt: "Introduce yourself in a live prompt" },
          },
        },
        {
          id: "lesson-a1-2-quiz",
          title: { en: "Personal Details Quiz", es: "Quiz de Datos" },
          description: { en: "Check personal info and family language", es: "Comprueba lenguaje de datos personales y familia" },
          xpRequired: 125,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "personal information" },
            grammar: { topics: ["possessive adjectives", "ser vs. estar basics"], focusPoints: ["word order", "agreement"] },
          },
        },
      ],
    },
    {
      id: "unit-a1-3",
      title: { en: "Numbers & Time", es: "Números y Tiempo" },
      description: { en: "Count, give dates, and tell the time", es: "Cuenta, da fechas y di la hora" },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-3-1",
          title: { en: "Counting to 100", es: "Contar hasta 100" },
          description: { en: "Use numbers for prices and ages", es: "Usa números para precios y edades" },
          xpRequired: 160,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "numbers" },
            grammar: { topic: "number patterns", focusPoints: ["tens", "agreement with nouns"] },
          },
        },
        {
          id: "lesson-a1-3-2",
          title: { en: "Calendars & Birthdays", es: "Calendarios y Cumpleaños" },
          description: { en: "Say dates and schedule events", es: "Di fechas y agenda eventos" },
          xpRequired: 175,
          xpReward: 15,
          modes: ["reading", "stories"],
          content: {
            stories: { topic: "calendar", prompt: "Read invites and birthday cards" },
            grammar: { topic: "date expressions", focusPoints: ["months and days", "prepositions for dates"] },
          },
        },
        {
          id: "lesson-a1-3-3",
          title: { en: "Telling Time", es: "Decir la Hora" },
          description: { en: "Ask and answer about time and schedules", es: "Pregunta y responde sobre horarios" },
          xpRequired: 190,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "setting a meeting", prompt: "Arrange class and bus times" },
            grammar: { topic: "time expressions", focusPoints: ["es la/son las", "quarter/half past"] },
          },
        },
        {
          id: "lesson-a1-3-quiz",
          title: { en: "Numbers & Time Quiz", es: "Quiz de Números y Tiempo" },
          description: { en: "Use numbers, dates, and time together", es: "Usa números, fechas y horas juntos" },
          xpRequired: 205,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "numbers" },
            grammar: { topics: ["date expressions", "time expressions"], focusPoints: ["pronunciation of tens", "prepositions"] },
          },
        },
      ],
    },
    {
      id: "unit-a1-4",
      title: { en: "Daily Life", es: "Vida Diaria" },
      description: { en: "Talk about routines and basic needs", es: "Habla de rutinas y necesidades básicas" },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-4-1",
          title: { en: "Daily Routine", es: "Rutina Diaria" },
          description: { en: "Describe morning and evening habits", es: "Describe hábitos de mañana y noche" },
          xpRequired: 240,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "routine", prompt: "Follow a simple day-in-the-life story" },
            grammar: { topic: "present simple", focusPoints: ["reflexive verbs", "time adverbs"] },
          },
        },
        {
          id: "lesson-a1-4-2",
          title: { en: "Food & Drink", es: "Comida y Bebida" },
          description: { en: "Name meals, order politely, and ask for prices", es: "Nombra comidas, pide con cortesía y pregunta precios" },
          xpRequired: 255,
          xpReward: 15,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: { topic: "food" },
            realtime: { scenario: "ordering", prompt: "Order snacks and drinks in cafés" },
          },
        },
        {
          id: "lesson-a1-4-3",
          title: { en: "Going Places", es: "Ir a Lugares" },
          description: { en: "Ask for simple directions and transport times", es: "Pide direcciones y horarios simples" },
          xpRequired: 270,
          xpReward: 15,
          modes: ["realtime", "stories"],
          content: {
            realtime: { scenario: "bus station", prompt: "Buy tickets and ask when it leaves" },
            stories: { topic: "directions", prompt: "Follow a short map dialogue" },
          },
        },
        {
          id: "lesson-a1-4-quiz",
          title: { en: "Daily Life Quiz", es: "Quiz de Vida Diaria" },
          description: { en: "Combine routines, food, and navigation", es: "Combina rutinas, comida y orientación" },
          xpRequired: 285,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "food" },
            grammar: { topics: ["present simple", "requests"], focusPoints: ["polite questions", "frequency adverbs"] },
          },
        },
      ],
    },
  ],
  A2: [
    {
      id: "unit-a2-1",
      title: { en: "People & Places", es: "Personas y Lugares" },
      description: { en: "Describe people, homes, and neighborhoods", es: "Describe personas, casas y vecindarios" },
      color: "#14B8A6",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-1-1",
          title: { en: "Appearance & Personality", es: "Aspecto y Personalidad" },
          description: { en: "Talk about looks and character", es: "Habla de apariencia y carácter" },
          xpRequired: 330,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "describing people" },
            grammar: { topic: "ser vs. estar review", focusPoints: ["adjective agreement", "muy vs. mucho"] },
          },
        },
        {
          id: "lesson-a2-1-2",
          title: { en: "Homes & Rooms", es: "Casas y Habitaciones" },
          description: { en: "Describe spaces and furniture", es: "Describe espacios y muebles" },
          xpRequired: 345,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "home tour", prompt: "Read a listing for an apartment" },
            grammar: { topic: "prepositions of place", focusPoints: ["sobre/debajo", "al lado de"] },
          },
        },
        {
          id: "lesson-a2-1-3",
          title: { en: "City Life", es: "Vida en la Ciudad" },
          description: { en: "Compare neighborhoods and services", es: "Compara barrios y servicios" },
          xpRequired: 360,
          xpReward: 15,
          modes: ["realtime", "stories"],
          content: {
            realtime: { scenario: "choosing a neighborhood", prompt: "Explain what you like near your home" },
            stories: { topic: "places", prompt: "Read about two towns and compare them" },
          },
        },
        {
          id: "lesson-a2-1-quiz",
          title: { en: "People & Places Quiz", es: "Quiz de Personas y Lugares" },
          description: { en: "Check descriptions and comparisons", es: "Revisa descripciones y comparaciones" },
          xpRequired: 375,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "describing people" },
            grammar: { topics: ["prepositions of place", "comparisons"], focusPoints: ["más/menos", "tan...como"] },
          },
        },
      ],
    },
    {
      id: "unit-a2-2",
      title: { en: "Moving Around", es: "Moverse" },
      description: { en: "Handle transport, directions, and plans", es: "Gestiona transporte, direcciones y planes" },
      color: "#EC4899",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-2-1",
          title: { en: "Transport Basics", es: "Básicos de Transporte" },
          description: { en: "Talk about buses, trains, and tickets", es: "Habla de buses, trenes y boletos" },
          xpRequired: 410,
          xpReward: 15,
          modes: ["vocabulary", "realtime"],
          content: {
            vocabulary: { topic: "transport" },
            realtime: { scenario: "ticket counter", prompt: "Buy a ticket and ask for platform info" },
          },
        },
        {
          id: "lesson-a2-2-2",
          title: { en: "Giving Directions", es: "Dar Direcciones" },
          description: { en: "Guide someone through town", es: "Guía a alguien por la ciudad" },
          xpRequired: 425,
          xpReward: 15,
          modes: ["grammar", "realtime"],
          content: {
            grammar: { topic: "imperatives", focusPoints: ["sigue", "gira", "cruza"] },
            realtime: { scenario: "tourist help", prompt: "Explain how to reach a landmark" },
          },
        },
        {
          id: "lesson-a2-2-3",
          title: { en: "Making Plans", es: "Hacer Planes" },
          description: { en: "Invite, accept, and decline politely", es: "Invita, acepta y rechaza con cortesía" },
          xpRequired: 440,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "invitations", prompt: "Read texts arranging a meet-up" },
            realtime: { scenario: "social planning", prompt: "Suggest days and times to friends" },
          },
        },
        {
          id: "lesson-a2-2-quiz",
          title: { en: "Moving Around Quiz", es: "Quiz de Movimiento" },
          description: { en: "Combine transport, directions, and planning", es: "Combina transporte, direcciones y planes" },
          xpRequired: 455,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "transport" },
            grammar: { topics: ["imperatives", "invitation frames"], focusPoints: ["command forms", "softening language"] },
          },
        },
      ],
    },
    {
      id: "unit-a2-3",
      title: { en: "Past & Future", es: "Pasado y Futuro" },
      description: { en: "Narrate past events and near-future plans", es: "Narra eventos pasados y planes cercanos" },
      color: "#06B6D4",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-3-1",
          title: { en: "Regular Past", es: "Pasado Regular" },
          description: { en: "Form regular preterite verbs and time markers", es: "Forma el pretérito regular y marcadores de tiempo" },
          xpRequired: 490,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "preterite regular", focusPoints: ["-ar/-er/-ir endings", "ayer/anoche"] },
            reading: { topic: "short diaries", prompt: "Read weekend recounts" },
          },
        },
        {
          id: "lesson-a2-3-2",
          title: { en: "Irregular Past", es: "Pasado Irregular" },
          description: { en: "Handle core irregular preterites", es: "Maneja pretéritos irregulares básicos" },
          xpRequired: 505,
          xpReward: 15,
          modes: ["grammar", "stories"],
          content: {
            grammar: { topic: "preterite irregular", focusPoints: ["tener/ir/ser", "stem changes"] },
            stories: { topic: "travel mishaps", prompt: "Follow a narrative with irregular verbs" },
          },
        },
        {
          id: "lesson-a2-3-3",
          title: { en: "Future Plans", es: "Planes Futuros" },
          description: { en: "Use ir + a + infinitive for near future", es: "Usa ir + a + infinitivo para el futuro cercano" },
          xpRequired: 520,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "planning a trip", prompt: "Explain what you'll do next week" },
            grammar: { topic: "near future", focusPoints: ["ir conjugations", "sequencing words"] },
          },
        },
        {
          id: "lesson-a2-3-quiz",
          title: { en: "Past & Future Quiz", es: "Quiz de Pasado y Futuro" },
          description: { en: "Blend past narration with future intentions", es: "Combina narración pasada con intenciones futuras" },
          xpRequired: 535,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "time markers" },
            grammar: { topics: ["preterite regular", "preterite irregular", "near future"], focusPoints: ["sequencing", "pronunciation of endings"] },
          },
        },
      ],
    },
    {
      id: "unit-a2-4",
      title: { en: "Health, Work & Study", es: "Salud, Trabajo y Estudio" },
      description: { en: "Handle key services and talk about professions", es: "Gestiona servicios clave y habla de profesiones" },
      color: "#F97316",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-4-1",
          title: { en: "At the Doctor", es: "En el Médico" },
          description: { en: "Describe symptoms and get advice", es: "Describe síntomas y recibe consejos" },
          xpRequired: 570,
          xpReward: 15,
          modes: ["realtime", "vocabulary"],
          content: {
            realtime: { scenario: "clinic visit", prompt: "Explain what's hurting and follow instructions" },
            vocabulary: { topic: "health" },
          },
        },
        {
          id: "lesson-a2-4-2",
          title: { en: "Jobs & Schedules", es: "Trabajos y Horarios" },
          description: { en: "Talk about professions and shifts", es: "Habla de profesiones y turnos" },
          xpRequired: 585,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "present simple review", focusPoints: ["work routines", "frequency"] },
            reading: { topic: "job posts", prompt: "Read short job ads" },
          },
        },
        {
          id: "lesson-a2-4-3",
          title: { en: "School & Skills", es: "Escuela y Habilidades" },
          description: { en: "Discuss subjects, learning goals, and abilities", es: "Habla de materias, metas y habilidades" },
          xpRequired: 600,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "study plans", prompt: "Follow a student talking about exams" },
            grammar: { topic: "can/can't", focusPoints: ["poder for ability", "asking for permission"] },
          },
        },
        {
          id: "lesson-a2-4-quiz",
          title: { en: "Health, Work & Study Quiz", es: "Quiz de Servicios" },
          description: { en: "Check language for services and professions", es: "Revisa lenguaje para servicios y profesiones" },
          xpRequired: 615,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "health" },
            grammar: { topics: ["poder", "present simple review"], focusPoints: ["requests", "abilities"] },
          },
        },
      ],
    },
  ],
  B1: [
    {
      id: "unit-b1-1",
      title: { en: "Narrating Experiences", es: "Narrar Experiencias" },
      description: { en: "Recount events with detail", es: "Relata eventos con detalle" },
      color: "#EF4444",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-1-1",
          title: { en: "Present Perfect", es: "Pretérito Perfecto" },
          description: { en: "Share life experiences up to now", es: "Comparte experiencias hasta ahora" },
          xpRequired: 660,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "present perfect", focusPoints: ["haber + participle", "ever/never"] },
            reading: { topic: "travel memories", prompt: "Read blogs about places visited" },
          },
        },
        {
          id: "lesson-b1-1-2",
          title: { en: "Past Continuous", es: "Pretérito Imperfecto Progresivo" },
          description: { en: "Set scenes and interrupted actions", es: "Describe escenas y acciones interrumpidas" },
          xpRequired: 675,
          xpReward: 15,
          modes: ["grammar", "stories"],
          content: {
            grammar: { topic: "past continuous", focusPoints: ["estaba + gerundio", "background descriptions"] },
            stories: { topic: "mystery scene", prompt: "Follow a story with interruptions" },
          },
        },
        {
          id: "lesson-b1-1-3",
          title: { en: "Linking Events", es: "Enlazar Eventos" },
          description: { en: "Sequence actions and emphasize order", es: "Secuencia acciones y enfatiza el orden" },
          xpRequired: 690,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "telling a story", prompt: "Explain what happened during a trip" },
            grammar: { topic: "sequencers", focusPoints: ["primero/después", "al final"] },
          },
        },
        {
          id: "lesson-b1-1-quiz",
          title: { en: "Narrating Experiences Quiz", es: "Quiz de Narración" },
          description: { en: "Combine perfect, continuous, and sequencers", es: "Combina perfecto, continuo y conectores" },
          xpRequired: 705,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "time markers" },
            grammar: { topics: ["present perfect", "past continuous"], focusPoints: ["since/for", "background vs. action"] },
          },
        },
      ],
    },
    {
      id: "unit-b1-2",
      title: { en: "Opinions & Comparisons", es: "Opiniones y Comparaciones" },
      description: { en: "Share viewpoints and weigh options", es: "Comparte puntos de vista y evalúa opciones" },
      color: "#0EA5E9",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-2-1",
          title: { en: "Expressing Opinions", es: "Expresar Opiniones" },
          description: { en: "Use phrases to agree, disagree, and hedge", es: "Usa frases para estar de acuerdo, discrepar y matizar" },
          xpRequired: 740,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "debating plans", prompt: "Share what you think about options" },
            grammar: { topic: "opinion frames", focusPoints: ["creo que", "me parece", "tal vez"] },
          },
        },
        {
          id: "lesson-b1-2-2",
          title: { en: "Comparatives & Superlatives", es: "Comparativos y Superlativos" },
          description: { en: "Compare qualities and quantities", es: "Compara cualidades y cantidades" },
          xpRequired: 755,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "comparisons", focusPoints: ["más/menos que", "el más/el menos"] },
            reading: { topic: "product reviews", prompt: "Read contrasting product summaries" },
          },
        },
        {
          id: "lesson-b1-2-3",
          title: { en: "Persuading Others", es: "Persuadir a Otros" },
          description: { en: "Use reasons and examples to convince", es: "Usa razones y ejemplos para convencer" },
          xpRequired: 770,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "debate", prompt: "Read two sides of an argument" },
            realtime: { scenario: "making a case", prompt: "Recommend one option over another" },
          },
        },
        {
          id: "lesson-b1-2-quiz",
          title: { en: "Opinions & Comparisons Quiz", es: "Quiz de Opiniones" },
          description: { en: "Review opinion language and comparisons", es: "Repasa lenguaje de opinión y comparaciones" },
          xpRequired: 785,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "debate" },
            grammar: { topics: ["comparisons", "opinion frames"], focusPoints: ["agreement structures", "evidence phrases"] },
          },
        },
      ],
    },
    {
      id: "unit-b1-3",
      title: { en: "Planning Ahead", es: "Planificar" },
      description: { en: "Talk about future, conditions, and obligations", es: "Habla de futuro, condiciones y obligaciones" },
      color: "#84CC16",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-3-1",
          title: { en: "Simple Future", es: "Futuro Simple" },
          description: { en: "Make predictions and promises", es: "Haz predicciones y promesas" },
          xpRequired: 820,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "simple future", focusPoints: ["infinitive + endings", "probability"] },
            reading: { topic: "future goals", prompt: "Read letters about life plans" },
          },
        },
        {
          id: "lesson-b1-3-2",
          title: { en: "Obligations & Advice", es: "Obligaciones y Consejos" },
          description: { en: "Use tener que, deber, and hay que", es: "Usa tener que, deber y hay que" },
          xpRequired: 835,
          xpReward: 15,
          modes: ["grammar", "realtime"],
          content: {
            grammar: { topic: "obligation phrases", focusPoints: ["softening advice", "negative forms"] },
            realtime: { scenario: "giving guidance", prompt: "Explain rules and suggestions" },
          },
        },
        {
          id: "lesson-b1-3-3",
          title: { en: "First Conditionals", es: "Primer Condicional" },
          description: { en: "Talk about real possibilities", es: "Habla de posibilidades reales" },
          xpRequired: 850,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "plans changing", prompt: "Follow decisions with if-clauses" },
            grammar: { topic: "first conditional", focusPoints: ["si + present, future", "unless/if not"] },
          },
        },
        {
          id: "lesson-b1-3-quiz",
          title: { en: "Planning Ahead Quiz", es: "Quiz de Planes" },
          description: { en: "Mix future, conditionals, and advice", es: "Mezcla futuro, condicionales y consejos" },
          xpRequired: 865,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "planning" },
            grammar: { topics: ["simple future", "first conditional"], focusPoints: ["if-clauses", "probability markers"] },
          },
        },
      ],
    },
    {
      id: "unit-b1-4",
      title: { en: "Problem Solving", es: "Resolución de Problemas" },
      description: { en: "Report issues and propose fixes", es: "Reporta problemas y propone soluciones" },
      color: "#EAB308",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-4-1",
          title: { en: "Complaints & Requests", es: "Quejas y Pedidos" },
          description: { en: "Explain issues politely", es: "Explica problemas con cortesía" },
          xpRequired: 900,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "hotel issue", prompt: "Report a problem and ask for help" },
            grammar: { topic: "polite requests", focusPoints: ["conditional courtesy", "modal tone"] },
          },
        },
        {
          id: "lesson-b1-4-2",
          title: { en: "Reporting Events", es: "Reportar Eventos" },
          description: { en: "Summarize incidents clearly", es: "Resume incidentes con claridad" },
          xpRequired: 915,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "news briefs", prompt: "Read short reports" },
            grammar: { topic: "past review", focusPoints: ["sequence markers", "object pronouns"] },
          },
        },
        {
          id: "lesson-b1-4-3",
          title: { en: "Solutions & Suggestions", es: "Soluciones y Sugerencias" },
          description: { en: "Offer fixes and alternatives", es: "Ofrece soluciones y alternativas" },
          xpRequired: 930,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "problem solving", prompt: "Follow a scenario of fixing an issue" },
            realtime: { scenario: "brainstorm", prompt: "Suggest actions and weigh pros/cons" },
          },
        },
        {
          id: "lesson-b1-4-quiz",
          title: { en: "Problem Solving Quiz", es: "Quiz de Problemas" },
          description: { en: "Review polite requests and summaries", es: "Repasa pedidos corteses y resúmenes" },
          xpRequired: 945,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "solutions" },
            grammar: { topics: ["polite requests", "past review"], focusPoints: ["object pronouns", "sequencers"] },
          },
        },
      ],
    },
  ],
  B2: [
    {
      id: "unit-b2-1",
      title: { en: "Nuanced Opinions", es: "Opiniones Matizadas" },
      description: { en: "Debate abstract topics with clarity", es: "Debate temas abstractos con claridad" },
      color: "#6366F1",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-1-1",
          title: { en: "Hedging & Emphasis", es: "Matizar y Enfatizar" },
          description: { en: "Balance certainty and doubt", es: "Equilibra certeza y duda" },
          xpRequired: 990,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "modals for stance", focusPoints: ["might/must", "tal vez/seguro"] },
            reading: { topic: "op-ed", prompt: "Analyze opinion articles" },
          },
        },
        {
          id: "lesson-b2-1-2",
          title: { en: "Discourse Markers", es: "Marcadores Discursivos" },
          description: { en: "Structure arguments with connectors", es: "Estructura argumentos con conectores" },
          xpRequired: 1005,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "panel discussion", prompt: "Follow a structured debate" },
            grammar: { topic: "connectors", focusPoints: ["sin embargo", "por lo tanto", "aun así"] },
          },
        },
        {
          id: "lesson-b2-1-3",
          title: { en: "Evaluating Sources", es: "Evaluar Fuentes" },
          description: { en: "Assess reliability and bias", es: "Evalúa fiabilidad y sesgo" },
          xpRequired: 1020,
          xpReward: 15,
          modes: ["realtime", "reading"],
          content: {
            realtime: { scenario: "discussing news", prompt: "Challenge a claim with evidence" },
            reading: { topic: "media literacy", prompt: "Spot opinion vs. fact markers" },
          },
        },
        {
          id: "lesson-b2-1-quiz",
          title: { en: "Nuanced Opinions Quiz", es: "Quiz de Opiniones" },
          description: { en: "Review connectors and stance language", es: "Repasa conectores y lenguaje de postura" },
          xpRequired: 1035,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "discourse" },
            grammar: { topics: ["connectors", "modals for stance"], focusPoints: ["register", "cohesion"] },
          },
        },
      ],
    },
    {
      id: "unit-b2-2",
      title: { en: "Complex Grammar", es: "Gramática Compleja" },
      description: { en: "Use relative clauses, passive voice, and reported speech", es: "Usa oraciones relativas, voz pasiva y estilo indirecto" },
      color: "#DB2777",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-2-1",
          title: { en: "Relative Clauses", es: "Oraciones Relativas" },
          description: { en: "Add detail smoothly", es: "Añade detalle con fluidez" },
          xpRequired: 1070,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "relative pronouns", focusPoints: ["que/quien", "defining vs. non-defining"] },
            reading: { topic: "profiles", prompt: "Spot clause boundaries" },
          },
        },
        {
          id: "lesson-b2-2-2",
          title: { en: "Passive Voice", es: "Voz Pasiva" },
          description: { en: "Highlight actions and results", es: "Destaca acciones y resultados" },
          xpRequired: 1085,
          xpReward: 15,
          modes: ["grammar", "stories"],
          content: {
            grammar: { topic: "passive constructions", focusPoints: ["ser + participle", "agent phrases"] },
            stories: { topic: "news report", prompt: "Read headlines written in passive" },
          },
        },
        {
          id: "lesson-b2-2-3",
          title: { en: "Reported Speech", es: "Estilo Indirecto" },
          description: { en: "Retell what others said", es: "Repite lo que otros dijeron" },
          xpRequired: 1100,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "sharing news", prompt: "Report conversations accurately" },
            grammar: { topic: "reported speech", focusPoints: ["tense shifts", "pronoun changes"] },
          },
        },
        {
          id: "lesson-b2-2-quiz",
          title: { en: "Complex Grammar Quiz", es: "Quiz de Gramática" },
          description: { en: "Blend clauses, passive, and reported speech", es: "Combina relativas, pasiva y estilo indirecto" },
          xpRequired: 1115,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "reporting" },
            grammar: { topics: ["relative pronouns", "passive constructions", "reported speech"], focusPoints: ["punctuation", "tense consistency"] },
          },
        },
      ],
    },
    {
      id: "unit-b2-3",
      title: { en: "Professional Communication", es: "Comunicación Profesional" },
      description: { en: "Write emails, present ideas, and negotiate", es: "Escribe correos, presenta ideas y negocia" },
      color: "#0D9488",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-3-1",
          title: { en: "Effective Emails", es: "Correos Efectivos" },
          description: { en: "Structure formal and neutral messages", es: "Estructura mensajes formales y neutrales" },
          xpRequired: 1150,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "business email", prompt: "Analyze salutations and closings" },
            grammar: { topic: "register and tone", focusPoints: ["formal vs. informal", "clear requests"] },
          },
        },
        {
          id: "lesson-b2-3-2",
          title: { en: "Presenting Ideas", es: "Presentar Ideas" },
          description: { en: "Frame arguments with signposting", es: "Enmarca argumentos con señalizadores" },
          xpRequired: 1165,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "presentation", prompt: "Follow a short pitch" },
            realtime: { scenario: "pitch practice", prompt: "Summarize and invite questions" },
          },
        },
        {
          id: "lesson-b2-3-3",
          title: { en: "Negotiating", es: "Negociar" },
          description: { en: "Seek compromises and clarify terms", es: "Busca compromisos y aclara términos" },
          xpRequired: 1180,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "agreement", prompt: "Propose conditions and counteroffers" },
            grammar: { topic: "modal nuance", focusPoints: ["would/could", "if we + conditional"] },
          },
        },
        {
          id: "lesson-b2-3-quiz",
          title: { en: "Professional Communication Quiz", es: "Quiz Profesional" },
          description: { en: "Review formal tone and negotiation language", es: "Repasa tono formal y lenguaje de negociación" },
          xpRequired: 1195,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "formal" },
            grammar: { topics: ["register and tone", "modal nuance"], focusPoints: ["clarity", "softening"] },
          },
        },
      ],
    },
    {
      id: "unit-b2-4",
      title: { en: "Complex Narratives", es: "Narrativas Complejas" },
      description: { en: "Blend tenses and perspectives", es: "Combina tiempos y perspectivas" },
      color: "#F43F5E",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-4-1",
          title: { en: "Mixed Tenses", es: "Tiempos Mixtos" },
          description: { en: "Shift between past and present for effect", es: "Cambia entre pasado y presente con efecto" },
          xpRequired: 1230,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "tense contrast", focusPoints: ["historic present", "narrative past"] },
            reading: { topic: "personal essay", prompt: "Notice tense shifts in storytelling" },
          },
        },
        {
          id: "lesson-b2-4-2",
          title: { en: "Point of View", es: "Punto de Vista" },
          description: { en: "Move between first and reported perspectives", es: "Mueve entre perspectivas en primera e indirecta" },
          xpRequired: 1245,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "memoir", prompt: "Follow a retold memory" },
            grammar: { topic: "reported narration", focusPoints: ["pronoun shifts", "tense backshifting"] },
          },
        },
        {
          id: "lesson-b2-4-3",
          title: { en: "Cohesion & Style", es: "Cohesión y Estilo" },
          description: { en: "Use cohesive devices and stylistic choices", es: "Usa recursos cohesivos y estilísticos" },
          xpRequired: 1260,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "story workshop", prompt: "Retell with better flow" },
            grammar: { topic: "cohesion", focusPoints: ["pronoun referencing", "ellipsis"] },
          },
        },
        {
          id: "lesson-b2-4-quiz",
          title: { en: "Complex Narratives Quiz", es: "Quiz de Narrativas" },
          description: { en: "Combine mixed tenses and cohesive devices", es: "Combina tiempos mixtos y cohesión" },
          xpRequired: 1275,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "cohesion" },
            grammar: { topics: ["tense contrast", "cohesion"], focusPoints: ["narrative flow", "referencing"] },
          },
        },
      ],
    },
  ],
  C1: [
    {
      id: "unit-c1-1",
      title: { en: "Academic Precision", es: "Precisión Académica" },
      description: { en: "Write and speak with exactness", es: "Habla y escribe con precisión" },
      color: "#22D3EE",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-1-1",
          title: { en: "Nominalization", es: "Nominalización" },
          description: { en: "Turn clauses into concise nouns", es: "Convierte oraciones en sustantivos concisos" },
          xpRequired: 1320,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "nominalization", focusPoints: ["using nouns for processes", "density"] },
            reading: { topic: "academic text", prompt: "Identify condensed structures" },
          },
        },
        {
          id: "lesson-c1-1-2",
          title: { en: "Advanced Connectors", es: "Conectores Avanzados" },
          description: { en: "Signal contrast, concession, and consequence", es: "Indica contraste, concesión y consecuencia" },
          xpRequired: 1335,
          xpReward: 15,
          modes: ["grammar", "stories"],
          content: {
            grammar: { topic: "complex connectors", focusPoints: ["aunque/aun cuando", "por consiguiente"] },
            stories: { topic: "essay excerpt", prompt: "Trace logic in a paragraph" },
          },
        },
        {
          id: "lesson-c1-1-3",
          title: { en: "Data Commentary", es: "Comentario de Datos" },
          description: { en: "Describe charts and trends", es: "Describe gráficos y tendencias" },
          xpRequired: 1350,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "presenting findings", prompt: "Summarize changes and comparisons" },
            grammar: { topic: "trend language", focusPoints: ["increase/decrease", "stability"] },
          },
        },
        {
          id: "lesson-c1-1-quiz",
          title: { en: "Academic Precision Quiz", es: "Quiz Académico" },
          description: { en: "Combine density, connectors, and data language", es: "Combina densidad, conectores y lenguaje de datos" },
          xpRequired: 1365,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "academic" },
            grammar: { topics: ["nominalization", "complex connectors", "trend language"], focusPoints: ["register", "coherence"] },
          },
        },
      ],
    },
    {
      id: "unit-c1-2",
      title: { en: "Subtle Meaning", es: "Matices" },
      description: { en: "Express doubt, concession, and hypotheticals", es: "Expresa duda, concesión e hipotéticos" },
      color: "#C084FC",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-2-1",
          title: { en: "Subjunctive Review", es: "Repaso del Subjuntivo" },
          description: { en: "Use moods for desire, doubt, and emotion", es: "Usa modos para deseo, duda y emoción" },
          xpRequired: 1400,
          xpReward: 15,
          modes: ["grammar", "reading"],
          content: {
            grammar: { topic: "subjunctive", focusPoints: ["influence verbs", "impersonal expressions"] },
            reading: { topic: "opinion pieces", prompt: "Spot mood triggers" },
          },
        },
        {
          id: "lesson-c1-2-2",
          title: { en: "Concessions", es: "Concesiones" },
          description: { en: "Balance opposing ideas gracefully", es: "Equilibra ideas opuestas con elegancia" },
          xpRequired: 1415,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "debate essays", prompt: "Analyze how concessions are framed" },
            grammar: { topic: "concessive clauses", focusPoints: ["aunque + subjuntivo", "a pesar de"] },
          },
        },
        {
          id: "lesson-c1-2-3",
          title: { en: "Hypotheticals", es: "Hipotéticos" },
          description: { en: "Speculate about unreal situations", es: "Especula sobre situaciones irreales" },
          xpRequired: 1430,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "what if", prompt: "Discuss imaginary outcomes" },
            grammar: { topic: "second conditional", focusPoints: ["si + imperfect subjunctive, conditional", "wish structures"] },
          },
        },
        {
          id: "lesson-c1-2-quiz",
          title: { en: "Subtle Meaning Quiz", es: "Quiz de Matices" },
          description: { en: "Review moods, concessions, and hypotheticals", es: "Repasa modos, concesiones e hipotéticos" },
          xpRequired: 1445,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "subjunctive" },
            grammar: { topics: ["subjunctive", "concessive clauses", "second conditional"], focusPoints: ["mood contrast", "register"] },
          },
        },
      ],
    },
    {
      id: "unit-c1-3",
      title: { en: "Persuasive Language", es: "Lenguaje Persuasivo" },
      description: { en: "Craft arguments and adapt tone", es: "Construye argumentos y adapta el tono" },
      color: "#FB7185",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-3-1",
          title: { en: "Rhetorical Devices", es: "Recursos Retóricos" },
          description: { en: "Use analogy, contrast, and repetition", es: "Usa analogía, contraste y repetición" },
          xpRequired: 1480,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "speeches", prompt: "Identify persuasive moves" },
            grammar: { topic: "rhetorical emphasis", focusPoints: ["parallelism", "antithesis"] },
          },
        },
        {
          id: "lesson-c1-3-2",
          title: { en: "Adapting Register", es: "Adaptar Registro" },
          description: { en: "Shift between formal, neutral, and casual", es: "Cambia entre formal, neutral e informal" },
          xpRequired: 1495,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "email thread", prompt: "Notice tone changes with audience" },
            realtime: { scenario: "role-play", prompt: "Rephrase ideas for boss vs. friend" },
          },
        },
        {
          id: "lesson-c1-3-3",
          title: { en: "Strategic Disagreement", es: "Desacuerdo Estratégico" },
          description: { en: "Disagree firmly but politely", es: "Discrepa con firmeza y cortesía" },
          xpRequired: 1510,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "panel debate", prompt: "Interrupt and redirect gracefully" },
            grammar: { topic: "softening language", focusPoints: ["hedges", "modal politeness"] },
          },
        },
        {
          id: "lesson-c1-3-quiz",
          title: { en: "Persuasive Language Quiz", es: "Quiz Persuasivo" },
          description: { en: "Blend rhetoric, register, and tact", es: "Combina retórica, registro y tacto" },
          xpRequired: 1525,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "rhetoric" },
            grammar: { topics: ["softening language", "rhetorical emphasis"], focusPoints: ["audience fit", "clarity"] },
          },
        },
      ],
    },
    {
      id: "unit-c1-4",
      title: { en: "Precision & Repair", es: "Precisión y Reparación" },
      description: { en: "Self-correct and clarify smoothly", es: "Autocorrígete y aclara con fluidez" },
      color: "#10B981",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-4-1",
          title: { en: "Self-Repair", es: "Auto-Reparación" },
          description: { en: "Fix mistakes without breaking flow", es: "Corrige errores sin perder fluidez" },
          xpRequired: 1560,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "live talk", prompt: "Rephrase mid-sentence" },
            grammar: { topic: "repair strategies", focusPoints: ["apologies", "clarifications"] },
          },
        },
        {
          id: "lesson-c1-4-2",
          title: { en: "Precision Vocabulary", es: "Vocabulario Preciso" },
          description: { en: "Choose exact words for nuance", es: "Elige palabras exactas para matiz" },
          xpRequired: 1575,
          xpReward: 15,
          modes: ["reading", "vocabulary"],
          content: {
            reading: { topic: "style", prompt: "Contrast close synonyms" },
            vocabulary: { topic: "style" },
          },
        },
        {
          id: "lesson-c1-4-3",
          title: { en: "Synthesizing Ideas", es: "Sintetizar Ideas" },
          description: { en: "Summarize multiple sources", es: "Resume múltiples fuentes" },
          xpRequired: 1590,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "article set", prompt: "Combine viewpoints into one summary" },
            realtime: { scenario: "meeting recap", prompt: "Report key points succinctly" },
          },
        },
        {
          id: "lesson-c1-4-quiz",
          title: { en: "Precision & Repair Quiz", es: "Quiz de Precisión" },
          description: { en: "Review repair moves and precision vocabulary", es: "Repasa estrategias de reparación y vocabulario preciso" },
          xpRequired: 1605,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "style" },
            grammar: { topics: ["repair strategies", "summary structures"], focusPoints: ["signposting", "clarity"] },
          },
        },
      ],
    },
  ],
  C2: [
    {
      id: "unit-c2-1",
      title: { en: "Idiomatic Mastery", es: "Maestría Idiomática" },
      description: { en: "Use idioms and cultural references", es: "Usa modismos y referencias culturales" },
      color: "#F59E0B",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-1-1",
          title: { en: "Core Idioms", es: "Modismos Clave" },
          description: { en: "Incorporate common idioms naturally", es: "Incorpora modismos comunes de forma natural" },
          xpRequired: 1650,
          xpReward: 15,
          modes: ["vocabulary", "reading"],
          content: {
            vocabulary: { topic: "idioms" },
            reading: { topic: "dialogues", prompt: "Spot idioms in context" },
          },
        },
        {
          id: "lesson-c2-1-2",
          title: { en: "Metaphor & Humor", es: "Metáfora y Humor" },
          description: { en: "Understand figurative language and jokes", es: "Comprende lenguaje figurado y chistes" },
          xpRequired: 1665,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "short stories", prompt: "Trace metaphor and wordplay" },
            grammar: { topic: "figurative cues", focusPoints: ["tone shifts", "double meanings"] },
          },
        },
        {
          id: "lesson-c2-1-3",
          title: { en: "Cultural References", es: "Referencias Culturales" },
          description: { en: "Recognize and explain common references", es: "Reconoce y explica referencias comunes" },
          xpRequired: 1680,
          xpReward: 15,
          modes: ["realtime", "reading"],
          content: {
            realtime: { scenario: "chatting with natives", prompt: "Ask about and explain a reference" },
            reading: { topic: "media clips", prompt: "Decode headlines and memes" },
          },
        },
        {
          id: "lesson-c2-1-quiz",
          title: { en: "Idiomatic Mastery Quiz", es: "Quiz de Modismos" },
          description: { en: "Review idioms, humor, and references", es: "Repasa modismos, humor y referencias" },
          xpRequired: 1695,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "idioms" },
            grammar: { topics: ["figurative cues", "reference framing"], focusPoints: ["tone", "cultural fit"] },
          },
        },
      ],
    },
    {
      id: "unit-c2-2",
      title: { en: "Specialized Domains", es: "Dominios Especializados" },
      description: { en: "Operate in technical and professional settings", es: "Desenvuélvete en entornos técnicos y profesionales" },
      color: "#F97316",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-2-1",
          title: { en: "Technical Language", es: "Lenguaje Técnico" },
          description: { en: "Handle jargon and acronyms", es: "Maneja jerga y siglas" },
          xpRequired: 1730,
          xpReward: 15,
          modes: ["vocabulary", "reading"],
          content: {
            vocabulary: { topic: "specialized" },
            reading: { topic: "manuals", prompt: "Parse instructions and terms" },
          },
        },
        {
          id: "lesson-c2-2-2",
          title: { en: "Policy & Law", es: "Política y Ley" },
          description: { en: "Read and summarize formal documents", es: "Lee y resume documentos formales" },
          xpRequired: 1745,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "policy brief", prompt: "Follow an argument in formal prose" },
            grammar: { topic: "passive and nominal style", focusPoints: ["whereas", "hereby"] },
          },
        },
        {
          id: "lesson-c2-2-3",
          title: { en: "Academic Debate", es: "Debate Académico" },
          description: { en: "Challenge ideas with evidence", es: "Cuestiona ideas con evidencia" },
          xpRequired: 1760,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "roundtable", prompt: "Refute and concede strategically" },
            grammar: { topic: "stance language", focusPoints: ["it could be argued", "critics claim"] },
          },
        },
        {
          id: "lesson-c2-2-quiz",
          title: { en: "Specialized Domains Quiz", es: "Quiz de Dominios" },
          description: { en: "Review technical and formal language", es: "Repasa lenguaje técnico y formal" },
          xpRequired: 1775,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "specialized" },
            grammar: { topics: ["stance language", "passive and nominal style"], focusPoints: ["conciseness", "objectivity"] },
          },
        },
      ],
    },
    {
      id: "unit-c2-3",
      title: { en: "Creative Expression", es: "Expresión Creativa" },
      description: { en: "Play with style and voice", es: "Juega con estilo y voz" },
      color: "#8B5CF6",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-3-1",
          title: { en: "Voice & Tone", es: "Voz y Tono" },
          description: { en: "Shift between narrators and moods", es: "Cambia entre narradores y tonos" },
          xpRequired: 1810,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "literary", prompt: "Spot voice changes" },
            grammar: { topic: "style shifts", focusPoints: ["free indirect", "stream of consciousness"] },
          },
        },
        {
          id: "lesson-c2-3-2",
          title: { en: "Poetic Devices", es: "Recursos Poéticos" },
          description: { en: "Use rhythm, rhyme, and imagery", es: "Usa ritmo, rima e imágenes" },
          xpRequired: 1825,
          xpReward: 15,
          modes: ["stories", "grammar"],
          content: {
            stories: { topic: "poems", prompt: "Read and imitate short poems" },
            grammar: { topic: "poetic compression", focusPoints: ["ellipsis", "inversion"] },
          },
        },
        {
          id: "lesson-c2-3-3",
          title: { en: "Humor & Irony", es: "Humor e Ironía" },
          description: { en: "Signal and interpret irony", es: "Señala e interpreta ironía" },
          xpRequired: 1840,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "banter", prompt: "Deliver witty lines" },
            grammar: { topic: "pragmatic cues", focusPoints: ["hyperbole", "understatement"] },
          },
        },
        {
          id: "lesson-c2-3-quiz",
          title: { en: "Creative Expression Quiz", es: "Quiz Creativo" },
          description: { en: "Blend voice, imagery, and irony", es: "Combina voz, imaginación e ironía" },
          xpRequired: 1855,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "idioms" },
            grammar: { topics: ["style shifts", "pragmatic cues"], focusPoints: ["tone control", "audience impact"] },
          },
        },
      ],
    },
    {
      id: "unit-c2-4",
      title: { en: "Mastery in Motion", es: "Maestría en Movimiento" },
      description: { en: "React quickly in any context", es: "Reacciona rápido en cualquier contexto" },
      color: "#0EA5E9",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-4-1",
          title: { en: "Rapid Response", es: "Respuesta Rápida" },
          description: { en: "Improvise solutions on the fly", es: "Improvisa soluciones al instante" },
          xpRequired: 1890,
          xpReward: 15,
          modes: ["realtime", "grammar"],
          content: {
            realtime: { scenario: "unexpected problem", prompt: "Handle curveballs smoothly" },
            grammar: { topic: "discourse repairs", focusPoints: ["stalling phrases", "clarifying questions"] },
          },
        },
        {
          id: "lesson-c2-4-2",
          title: { en: "Register Shifts", es: "Cambios de Registro" },
          description: { en: "Switch tone mid-conversation", es: "Cambia el tono en plena conversación" },
          xpRequired: 1905,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: { topic: "mixed audiences", prompt: "Follow dialogue across contexts" },
            realtime: { scenario: "networking", prompt: "Adapt from casual to formal quickly" },
          },
        },
        {
          id: "lesson-c2-4-3",
          title: { en: "Cultural Nuance", es: "Matiz Cultural" },
          description: { en: "Handle humor, taboos, and indirectness", es: "Maneja humor, tabúes e indirectas" },
          xpRequired: 1920,
          xpReward: 15,
          modes: ["reading", "grammar"],
          content: {
            reading: { topic: "cultural notes", prompt: "Interpret unspoken cues" },
            grammar: { topic: "pragmatics", focusPoints: ["implicature", "politeness strategies"] },
          },
        },
        {
          id: "lesson-c2-4-quiz",
          title: { en: "Mastery in Motion Quiz", es: "Quiz de Maestría" },
          description: { en: "Prove flexibility across contexts", es: "Demuestra flexibilidad en todos los contextos" },
          xpRequired: 1935,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 8, passingScore: 6 },
          content: {
            vocabulary: { topic: "fluency" },
            grammar: { topics: ["discourse repairs", "pragmatics"], focusPoints: ["speed", "cultural sensitivity"] },
          },
        },
      ],
    },
  ],
};

const SUPPORTED_TARGET_LANGS = new Set(["en", "es", "pt", "fr", "it", "nah"]);
const DEFAULT_TARGET_LANG = "en";

const VOCABULARY_LIBRARY = {
  greetings: { en: ["hello", "hi", "goodbye", "please", "thank you"], es: ["hola", "adios", "por favor", "gracias", "buenos dias"] },
  "polite exchanges": { en: ["excuse me", "sorry", "no problem", "of course"], es: ["disculpa", "lo siento", "no hay problema", "claro"] },
  introductions: { en: ["my name is", "nice to meet you", "where are you from"], es: ["me llamo", "mucho gusto", "de donde eres"] },
  "personal information": { en: ["age", "country", "city", "job"], es: ["edad", "país", "ciudad", "trabajo"] },
  family: { en: ["mother", "father", "sister", "brother", "partner"], es: ["madre", "padre", "hermana", "hermano", "pareja"] },
  numbers: { en: ["twenty", "thirty", "forty", "fifty", "hundred"], es: ["veinte", "treinta", "cuarenta", "cincuenta", "cien"] },
  calendar: { en: ["Monday", "Tuesday", "January", "February"], es: ["lunes", "martes", "enero", "febrero"] },
  "time expressions": { en: ["quarter past", "half past", "o'clock", "at"], es: ["y cuarto", "y media", "en punto", "a las"] },
  routine: { en: ["wake up", "get dressed", "go to work", "sleep"], es: ["despertarse", "vestirse", "ir al trabajo", "dormir"] },
  food: { en: ["bread", "coffee", "water", "check please"], es: ["pan", "café", "agua", "la cuenta"] },
  directions: { en: ["left", "right", "straight", "block"], es: ["izquierda", "derecha", "recto", "cuadra"] },
  "describing people": { en: ["tall", "short", "kind", "funny"], es: ["alto", "bajo", "amable", "gracioso"] },
  places: { en: ["park", "museum", "quiet", "busy"], es: ["parque", "museo", "tranquilo", "ocupado"] },
  transport: { en: ["ticket", "platform", "departure", "arrival"], es: ["boleto", "andén", "salida", "llegada"] },
  invitations: { en: ["would you like", "let's", "can you"], es: ["te gustaría", "vamos a", "puedes"] },
  "time markers": { en: ["yesterday", "last night", "next week", "already"], es: ["ayer", "anoche", "la próxima semana", "ya"] },
  health: { en: ["headache", "doctor", "medicine", "appointment"], es: ["dolor de cabeza", "médico", "medicina", "cita"] },
  planning: { en: ["goal", "deadline", "option", "decide"], es: ["meta", "fecha límite", "opción", "decidir"] },
  debate: { en: ["argument", "evidence", "agree", "disagree"], es: ["argumento", "evidencia", "de acuerdo", "en desacuerdo"] },
  solutions: { en: ["fix", "solution", "alternative", "backup"], es: ["arreglo", "solución", "alternativa", "respaldo"] },
  discourse: { en: ["however", "therefore", "moreover", "nevertheless"], es: ["sin embargo", "por lo tanto", "además", "no obstante"] },
  reporting: { en: ["said", "told", "explained", "announced"], es: ["dijo", "contó", "explicó", "anunció"] },
  cohesion: { en: ["refer", "link", "theme", "topic"], es: ["referir", "enlazar", "tema", "tópico"] },
  academic: { en: ["research", "data", "evidence", "conclusion"], es: ["investigación", "datos", "evidencia", "conclusión"] },
  rhetoric: { en: ["analogy", "emphasis", "contrast", "example"], es: ["analogía", "énfasis", "contraste", "ejemplo"] },
  style: { en: ["formal", "neutral", "casual", "concise"], es: ["formal", "neutral", "informal", "conciso"] },
  idioms: { en: ["break the ice", "piece of cake", "hit the books"], es: ["romper el hielo", "pan comido", "hincar codo"] },
  specialized: { en: ["protocol", "device", "jargon", "compliance"], es: ["protocolo", "dispositivo", "jerga", "cumplimiento"] },
  fluency: { en: ["flexible", "spontaneous", "adapt", "command"], es: ["flexible", "espontáneo", "adaptar", "dominio"] },
};

function normalizeTopicKey(topic = "") {
  return topic.trim().toLowerCase();
}

function resolveVocabularyWords(topic, targetLang) {
  if (!topic) return null;
  const entry = VOCABULARY_LIBRARY[normalizeTopicKey(topic)];
  if (!entry) return null;
  return entry[targetLang] || entry[DEFAULT_TARGET_LANG] || entry.en || Object.values(entry)[0];
}

function localizeLearningPath(units, targetLang) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang) ? targetLang : DEFAULT_TARGET_LANG;
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
  es: cloneLearningPath(),
  en: cloneLearningPath(),
  pt: cloneLearningPath(),
  fr: cloneLearningPath(),
  it: cloneLearningPath(),
  nah: cloneLearningPath(),
};

export function getLearningPath(targetLang, level) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang) ? targetLang : DEFAULT_TARGET_LANG;
  const units = LEARNING_PATHS[lang]?.[level] || [];
  return localizeLearningPath(units, lang);
}

export function getMultiLevelLearningPath(targetLang, levels = ["A1", "A2"]) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang) ? targetLang : DEFAULT_TARGET_LANG;
  const allUnits = [];
  levels.forEach((level) => {
    const units = LEARNING_PATHS[lang]?.[level] || [];
    const withLevel = units.map((unit) => ({ ...unit, cefrLevel: level }));
    allUnits.push(...withLevel);
  });
  return localizeLearningPath(allUnits, lang);
}

export function getUnitTotalXP(unit) {
  return unit.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
}

export function getNextLesson(units, userProgress) {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const lessonProgress = userProgress.lessons?.[lesson.id];
      if (!lessonProgress || lessonProgress.status !== SKILL_STATUS.COMPLETED) {
        if (userProgress.totalXp >= lesson.xpRequired) {
          return { unit, lesson };
        }
        return null;
      }
    }
  }
  return null;
}

export function getUnitProgress(unit, userProgress) {
  const completed = unit.lessons.filter((lesson) => userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED);
  return (completed.length / unit.lessons.length) * 100;
}
