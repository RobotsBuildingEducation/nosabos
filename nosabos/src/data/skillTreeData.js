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
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

/**
 * Learning path structure for each language
 * Organized by proficiency level (beginner, intermediate, advanced)
 */
export const LEARNING_PATHS = {
  es: { // Spanish
    beginner: [
      {
        id: 'unit-1',
        title: {
          en: 'Basics 1',
          es: 'Básicos 1',
        },
        description: {
          en: 'Start your Spanish journey with essential greetings and introductions',
          es: 'Comienza tu viaje en español con saludos esenciales y presentaciones',
        },
        color: '#22C55E', // Green
        position: { row: 0, offset: 0 },
        lessons: [
          {
            id: 'lesson-1-1',
            title: {
              en: 'Hello & Goodbye',
              es: 'Hola y Adiós',
            },
            description: {
              en: 'Learn basic greetings',
              es: 'Aprende saludos básicos',
            },
            xpRequired: 0, // First lesson always available
            xpReward: 20,
            modes: ['vocabulary', 'grammar'], // Which learning modes to use
            content: {
              vocabulary: {
                words: ['hola', 'adiós', 'buenos días', 'buenas tardes', 'buenas noches'],
                topic: 'greetings',
              },
              grammar: {
                topic: 'basic greetings',
                focusPoints: ['formal vs informal', 'time-based greetings'],
              },
            },
          },
          {
            id: 'lesson-1-2',
            title: {
              en: 'Introduce Yourself',
              es: 'Preséntate',
            },
            description: {
              en: 'Say your name and where you\'re from',
              es: 'Di tu nombre y de dónde eres',
            },
            xpRequired: 20,
            xpReward: 25,
            modes: ['grammar', 'realtime'],
            content: {
              grammar: {
                topic: 'introductions',
                focusPoints: ['me llamo', 'soy de', 'verb ser'],
              },
              realtime: {
                scenario: 'introduction',
                prompt: 'Practice introducing yourself in a conversation',
              },
            },
          },
          {
            id: 'lesson-1-3',
            title: {
              en: 'Basic Questions',
              es: 'Preguntas Básicas',
            },
            description: {
              en: 'Ask and answer simple questions',
              es: 'Hacer y responder preguntas simples',
            },
            xpRequired: 45,
            xpReward: 25,
            modes: ['grammar', 'vocabulary', 'realtime'],
            content: {
              vocabulary: {
                words: ['¿cómo?', '¿qué?', '¿dónde?', '¿cuándo?', '¿por qué?'],
                topic: 'question words',
              },
              grammar: {
                topic: 'question formation',
                focusPoints: ['question words', 'intonation', 'word order'],
              },
              realtime: {
                scenario: 'asking questions',
                prompt: 'Practice asking and answering questions',
              },
            },
          },
        ],
      },
      {
        id: 'unit-2',
        title: {
          en: 'Basics 2',
          es: 'Básicos 2',
        },
        description: {
          en: 'Express likes, dislikes, and talk about everyday things',
          es: 'Expresa gustos, disgustos y habla de cosas cotidianas',
        },
        color: '#3B82F6', // Blue
        position: { row: 1, offset: 1 },
        lessons: [
          {
            id: 'lesson-2-1',
            title: {
              en: 'Likes & Dislikes',
              es: 'Gustos y Disgustos',
            },
            description: {
              en: 'Talk about what you like and don\'t like',
              es: 'Habla sobre lo que te gusta y no te gusta',
            },
            xpRequired: 70,
            xpReward: 30,
            modes: ['grammar', 'vocabulary', 'stories'],
            content: {
              vocabulary: {
                words: ['me gusta', 'no me gusta', 'me encanta', 'odio', 'prefiero'],
                topic: 'preferences',
              },
              grammar: {
                topic: 'gustar verb',
                focusPoints: ['indirect object pronouns', 'singular vs plural'],
              },
              stories: {
                topic: 'preferences',
                prompt: 'Read a story about someone\'s favorite things',
              },
            },
          },
          {
            id: 'lesson-2-2',
            title: {
              en: 'Numbers 1-20',
              es: 'Números 1-20',
            },
            description: {
              en: 'Count and use basic numbers',
              es: 'Cuenta y usa números básicos',
            },
            xpRequired: 100,
            xpReward: 30,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'diez', 'veinte'],
                topic: 'numbers',
              },
              grammar: {
                topic: 'numbers and counting',
                focusPoints: ['pronunciation', 'usage in sentences'],
              },
            },
          },
          {
            id: 'lesson-2-3',
            title: {
              en: 'Food & Drinks',
              es: 'Comida y Bebidas',
            },
            description: {
              en: 'Order food and talk about meals',
              es: 'Pide comida y habla sobre las comidas',
            },
            xpRequired: 130,
            xpReward: 35,
            modes: ['vocabulary', 'realtime', 'stories'],
            content: {
              vocabulary: {
                words: ['agua', 'café', 'pan', 'arroz', 'pollo', 'fruta'],
                topic: 'food and drinks',
              },
              realtime: {
                scenario: 'restaurant ordering',
                prompt: 'Practice ordering food at a restaurant',
              },
              stories: {
                topic: 'dining',
                prompt: 'Read a story about a meal',
              },
            },
          },
        ],
      },
      {
        id: 'unit-3',
        title: {
          en: 'Daily Life',
          es: 'Vida Diaria',
        },
        description: {
          en: 'Describe your routine and talk about time',
          es: 'Describe tu rutina y habla sobre el tiempo',
        },
        color: '#F59E0B', // Amber
        position: { row: 2, offset: 0 },
        lessons: [
          {
            id: 'lesson-3-1',
            title: {
              en: 'Telling Time',
              es: 'Decir la Hora',
            },
            description: {
              en: 'Ask and tell the time',
              es: 'Preguntar y decir la hora',
            },
            xpRequired: 165,
            xpReward: 35,
            modes: ['grammar', 'vocabulary'],
            content: {
              vocabulary: {
                words: ['hora', 'minuto', 'mañana', 'tarde', 'noche'],
                topic: 'time',
              },
              grammar: {
                topic: 'telling time',
                focusPoints: ['¿Qué hora es?', 'es la / son las', 'y/menos'],
              },
            },
          },
          {
            id: 'lesson-3-2',
            title: {
              en: 'Daily Routine',
              es: 'Rutina Diaria',
            },
            description: {
              en: 'Talk about your day',
              es: 'Habla sobre tu día',
            },
            xpRequired: 200,
            xpReward: 40,
            modes: ['vocabulary', 'grammar', 'stories'],
            content: {
              vocabulary: {
                words: ['despertarse', 'levantarse', 'ducharse', 'desayunar', 'trabajar'],
                topic: 'daily activities',
              },
              grammar: {
                topic: 'reflexive verbs',
                focusPoints: ['me/te/se', 'daily routine verbs'],
              },
              stories: {
                topic: 'daily routine',
                prompt: 'Read about someone\'s typical day',
              },
            },
          },
          {
            id: 'lesson-3-3',
            title: {
              en: 'Family Members',
              es: 'Miembros de la Familia',
            },
            description: {
              en: 'Talk about your family',
              es: 'Habla sobre tu familia',
            },
            xpRequired: 240,
            xpReward: 40,
            modes: ['vocabulary', 'grammar', 'realtime'],
            content: {
              vocabulary: {
                words: ['madre', 'padre', 'hermano', 'hermana', 'familia'],
                topic: 'family',
              },
              grammar: {
                topic: 'possessive adjectives',
                focusPoints: ['mi/tu/su', 'family descriptions'],
              },
              realtime: {
                scenario: 'family introduction',
                prompt: 'Describe your family in a conversation',
              },
            },
          },
        ],
      },
      {
        id: 'unit-4',
        title: {
          en: 'Getting Around',
          es: 'Moviéndose',
        },
        description: {
          en: 'Navigate places and give directions',
          es: 'Navega lugares y da direcciones',
        },
        color: '#8B5CF6', // Purple
        position: { row: 3, offset: 1 },
        lessons: [
          {
            id: 'lesson-4-1',
            title: {
              en: 'Places in Town',
              es: 'Lugares en la Ciudad',
            },
            description: {
              en: 'Name common locations',
              es: 'Nombra ubicaciones comunes',
            },
            xpRequired: 280,
            xpReward: 40,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['banco', 'supermercado', 'hospital', 'escuela', 'parque'],
                topic: 'places',
              },
              grammar: {
                topic: 'location prepositions',
                focusPoints: ['en, al, del', 'estar + location'],
              },
            },
          },
          {
            id: 'lesson-4-2',
            title: {
              en: 'Directions',
              es: 'Direcciones',
            },
            description: {
              en: 'Ask for and give directions',
              es: 'Pedir y dar direcciones',
            },
            xpRequired: 320,
            xpReward: 45,
            modes: ['grammar', 'realtime', 'vocabulary'],
            content: {
              vocabulary: {
                words: ['derecha', 'izquierda', 'recto', 'cerca', 'lejos'],
                topic: 'directions',
              },
              grammar: {
                topic: 'imperative mood',
                focusPoints: ['commands', 'direction-giving'],
              },
              realtime: {
                scenario: 'asking for directions',
                prompt: 'Practice asking for and giving directions',
              },
            },
          },
          {
            id: 'lesson-4-3',
            title: {
              en: 'Transportation',
              es: 'Transporte',
            },
            description: {
              en: 'Talk about how you travel',
              es: 'Habla sobre cómo viajas',
            },
            xpRequired: 365,
            xpReward: 45,
            modes: ['vocabulary', 'stories', 'grammar'],
            content: {
              vocabulary: {
                words: ['autobús', 'metro', 'taxi', 'bicicleta', 'caminar'],
                topic: 'transportation',
              },
              grammar: {
                topic: 'ir + a',
                focusPoints: ['going to places', 'transportation verbs'],
              },
              stories: {
                topic: 'transportation',
                prompt: 'Read about different ways to travel',
              },
            },
          },
        ],
      },
      {
        id: 'unit-5',
        title: {
          en: 'Shopping & Money',
          es: 'Compras y Dinero',
        },
        description: {
          en: 'Buy things and handle money',
          es: 'Compra cosas y maneja dinero',
        },
        color: '#EC4899', // Pink
        position: { row: 4, offset: 0 },
        lessons: [
          {
            id: 'lesson-5-1',
            title: {
              en: 'At the Store',
              es: 'En la Tienda',
            },
            description: {
              en: 'Shop for items',
              es: 'Compra artículos',
            },
            xpRequired: 410,
            xpReward: 50,
            modes: ['vocabulary', 'realtime'],
            content: {
              vocabulary: {
                words: ['comprar', 'vender', 'precio', 'barato', 'caro'],
                topic: 'shopping',
              },
              realtime: {
                scenario: 'shopping',
                prompt: 'Practice shopping conversations',
              },
            },
          },
          {
            id: 'lesson-5-2',
            title: {
              en: 'Numbers 20-100',
              es: 'Números 20-100',
            },
            description: {
              en: 'Use larger numbers for prices',
              es: 'Usa números más grandes para precios',
            },
            xpRequired: 460,
            xpReward: 50,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['treinta', 'cuarenta', 'cincuenta', 'cien'],
                topic: 'numbers',
              },
              grammar: {
                topic: 'numbers and currency',
                focusPoints: ['large numbers', 'prices'],
              },
            },
          },
          {
            id: 'lesson-5-3',
            title: {
              en: 'Clothing',
              es: 'Ropa',
            },
            description: {
              en: 'Describe what you wear',
              es: 'Describe lo que vistes',
            },
            xpRequired: 510,
            xpReward: 50,
            modes: ['vocabulary', 'grammar', 'stories'],
            content: {
              vocabulary: {
                words: ['camisa', 'pantalón', 'zapatos', 'vestido', 'llevar'],
                topic: 'clothing',
              },
              grammar: {
                topic: 'adjective agreement',
                focusPoints: ['colors', 'sizes', 'descriptions'],
              },
              stories: {
                topic: 'clothing',
                prompt: 'Read about fashion and clothing',
              },
            },
          },
        ],
      },
    ],
    intermediate: [
      {
        id: 'unit-6',
        title: {
          en: 'Past Experiences',
          es: 'Experiencias Pasadas',
        },
        description: {
          en: 'Talk about things you did',
          es: 'Habla sobre cosas que hiciste',
        },
        color: '#14B8A6', // Teal
        position: { row: 0, offset: 0 },
        lessons: [
          {
            id: 'lesson-6-1',
            title: {
              en: 'Preterite Tense Intro',
              es: 'Introducción al Pretérito',
            },
            description: {
              en: 'Talk about completed past actions',
              es: 'Habla sobre acciones pasadas completadas',
            },
            xpRequired: 560,
            xpReward: 60,
            modes: ['grammar', 'vocabulary'],
            content: {
              grammar: {
                topic: 'preterite tense',
                focusPoints: ['regular -ar verbs', 'past time markers'],
              },
              vocabulary: {
                words: ['ayer', 'anoche', 'la semana pasada'],
                topic: 'time expressions',
              },
            },
          },
          {
            id: 'lesson-6-2',
            title: {
              en: 'Weekend Activities',
              es: 'Actividades del Fin de Semana',
            },
            description: {
              en: 'Describe what you did last weekend',
              es: 'Describe qué hiciste el fin de semana pasado',
            },
            xpRequired: 620,
            xpReward: 60,
            modes: ['grammar', 'realtime', 'stories'],
            content: {
              grammar: {
                topic: 'preterite -er/-ir verbs',
                focusPoints: ['regular verbs', 'past actions'],
              },
              realtime: {
                scenario: 'weekend recap',
                prompt: 'Talk about what you did last weekend',
              },
              stories: {
                topic: 'weekend activities',
                prompt: 'Read about someone\'s weekend',
              },
            },
          },
          {
            id: 'lesson-6-3',
            title: {
              en: 'Travel Stories',
              es: 'Historias de Viaje',
            },
            description: {
              en: 'Share travel experiences',
              es: 'Comparte experiencias de viaje',
            },
            xpRequired: 680,
            xpReward: 65,
            modes: ['stories', 'vocabulary', 'jobscript'],
            content: {
              vocabulary: {
                words: ['viajar', 'visitar', 'conocer', 'descubrir'],
                topic: 'travel',
              },
              stories: {
                topic: 'travel',
                prompt: 'Read and discuss travel stories',
              },
              jobscript: {
                scenario: 'travel presentation',
                prompt: 'Prepare a presentation about a trip',
              },
            },
          },
        ],
      },
      {
        id: 'unit-7',
        title: {
          en: 'Ongoing Past',
          es: 'Pasado Continuo',
        },
        description: {
          en: 'Describe what was happening',
          es: 'Describe lo que estaba pasando',
        },
        color: '#F97316', // Orange
        position: { row: 1, offset: 1 },
        lessons: [
          {
            id: 'lesson-7-1',
            title: {
              en: 'Imperfect Tense',
              es: 'Tiempo Imperfecto',
            },
            description: {
              en: 'Describe past habits and states',
              es: 'Describe hábitos y estados pasados',
            },
            xpRequired: 745,
            xpReward: 65,
            modes: ['grammar', 'vocabulary'],
            content: {
              grammar: {
                topic: 'imperfect tense',
                focusPoints: ['formation', 'uses vs preterite'],
              },
            },
          },
          {
            id: 'lesson-7-2',
            title: {
              en: 'Childhood Memories',
              es: 'Recuerdos de la Infancia',
            },
            description: {
              en: 'Talk about when you were young',
              es: 'Habla sobre cuando eras joven',
            },
            xpRequired: 810,
            xpReward: 70,
            modes: ['grammar', 'stories', 'realtime'],
            content: {
              grammar: {
                topic: 'imperfect for descriptions',
                focusPoints: ['childhood', 'habitual actions'],
              },
              stories: {
                topic: 'childhood',
                prompt: 'Read about childhood memories',
              },
              realtime: {
                scenario: 'childhood stories',
                prompt: 'Share stories from your childhood',
              },
            },
          },
          {
            id: 'lesson-7-3',
            title: {
              en: 'Weather & Seasons',
              es: 'Clima y Estaciones',
            },
            description: {
              en: 'Describe weather and seasons',
              es: 'Describe el clima y las estaciones',
            },
            xpRequired: 880,
            xpReward: 70,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['llover', 'nevar', 'hacer calor', 'hacer frío', 'primavera'],
                topic: 'weather',
              },
              grammar: {
                topic: 'weather expressions',
                focusPoints: ['hacer, estar, hay'],
              },
            },
          },
        ],
      },
      {
        id: 'unit-8',
        title: {
          en: 'Future Plans',
          es: 'Planes Futuros',
        },
        description: {
          en: 'Talk about what you will do',
          es: 'Habla sobre lo que harás',
        },
        color: '#06B6D4', // Cyan
        position: { row: 2, offset: 0 },
        lessons: [
          {
            id: 'lesson-8-1',
            title: {
              en: 'Future with Ir + a',
              es: 'Futuro con Ir + a',
            },
            description: {
              en: 'Express near future plans',
              es: 'Expresa planes del futuro cercano',
            },
            xpRequired: 950,
            xpReward: 75,
            modes: ['grammar', 'realtime'],
            content: {
              grammar: {
                topic: 'ir a + infinitive',
                focusPoints: ['formation', 'time expressions'],
              },
              realtime: {
                scenario: 'future plans',
                prompt: 'Discuss your plans for tomorrow',
              },
            },
          },
          {
            id: 'lesson-8-2',
            title: {
              en: 'Simple Future Tense',
              es: 'Futuro Simple',
            },
            description: {
              en: 'Use the future tense',
              es: 'Usa el tiempo futuro',
            },
            xpRequired: 1025,
            xpReward: 75,
            modes: ['grammar', 'vocabulary'],
            content: {
              grammar: {
                topic: 'simple future',
                focusPoints: ['regular endings', 'irregular verbs'],
              },
            },
          },
          {
            id: 'lesson-8-3',
            title: {
              en: 'Career Goals',
              es: 'Metas Profesionales',
            },
            description: {
              en: 'Discuss career aspirations',
              es: 'Discute aspiraciones profesionales',
            },
            xpRequired: 1100,
            xpReward: 80,
            modes: ['jobscript', 'vocabulary', 'realtime'],
            content: {
              vocabulary: {
                words: ['carrera', 'trabajo', 'meta', 'aspiración', 'futuro'],
                topic: 'careers',
              },
              jobscript: {
                scenario: 'career interview',
                prompt: 'Discuss your career goals',
              },
              realtime: {
                scenario: 'career planning',
                prompt: 'Talk about your professional future',
              },
            },
          },
        ],
      },
    ],
    advanced: [
      {
        id: 'unit-9',
        title: {
          en: 'Subjunctive Mood',
          es: 'Modo Subjuntivo',
        },
        description: {
          en: 'Express wishes, doubts, and emotions',
          es: 'Expresa deseos, dudas y emociones',
        },
        color: '#7C3AED', // Violet
        position: { row: 0, offset: 0 },
        lessons: [
          {
            id: 'lesson-9-1',
            title: {
              en: 'Present Subjunctive Intro',
              es: 'Introducción al Subjuntivo Presente',
            },
            description: {
              en: 'Learn subjunctive formation',
              es: 'Aprende la formación del subjuntivo',
            },
            xpRequired: 1180,
            xpReward: 90,
            modes: ['grammar', 'vocabulary'],
            content: {
              grammar: {
                topic: 'present subjunctive',
                focusPoints: ['formation', 'trigger phrases'],
              },
            },
          },
          {
            id: 'lesson-9-2',
            title: {
              en: 'Wishes & Desires',
              es: 'Deseos y Anhelos',
            },
            description: {
              en: 'Express hopes and wishes',
              es: 'Expresa esperanzas y deseos',
            },
            xpRequired: 1270,
            xpReward: 90,
            modes: ['grammar', 'realtime', 'stories'],
            content: {
              grammar: {
                topic: 'subjunctive with querer, esperar',
                focusPoints: ['wishes', 'desires', 'hope'],
              },
              realtime: {
                scenario: 'expressing wishes',
                prompt: 'Talk about your hopes and desires',
              },
            },
          },
          {
            id: 'lesson-9-3',
            title: {
              en: 'Doubts & Denials',
              es: 'Dudas y Negaciones',
            },
            description: {
              en: 'Express uncertainty',
              es: 'Expresa incertidumbre',
            },
            xpRequired: 1360,
            xpReward: 95,
            modes: ['grammar', 'realtime'],
            content: {
              grammar: {
                topic: 'subjunctive with doubt',
                focusPoints: ['dudar, no creer, negar'],
              },
            },
          },
        ],
      },
      {
        id: 'unit-10',
        title: {
          en: 'Complex Conversations',
          es: 'Conversaciones Complejas',
        },
        description: {
          en: 'Engage in sophisticated discussions',
          es: 'Participa en discusiones sofisticadas',
        },
        color: '#DC2626', // Red
        position: { row: 1, offset: 1 },
        lessons: [
          {
            id: 'lesson-10-1',
            title: {
              en: 'Debate & Persuasion',
              es: 'Debate y Persuasión',
            },
            description: {
              en: 'Argue and persuade effectively',
              es: 'Argumenta y persuade efectivamente',
            },
            xpRequired: 1455,
            xpReward: 100,
            modes: ['realtime', 'jobscript', 'vocabulary'],
            content: {
              vocabulary: {
                words: ['argumentar', 'convencer', 'debatir', 'persuadir'],
                topic: 'debate',
              },
              realtime: {
                scenario: 'debate',
                prompt: 'Engage in a structured debate',
              },
              jobscript: {
                scenario: 'persuasive presentation',
                prompt: 'Create a persuasive argument',
              },
            },
          },
          {
            id: 'lesson-10-2',
            title: {
              en: 'Current Events',
              es: 'Actualidad',
            },
            description: {
              en: 'Discuss news and events',
              es: 'Discute noticias y eventos',
            },
            xpRequired: 1555,
            xpReward: 100,
            modes: ['history', 'realtime', 'vocabulary'],
            content: {
              vocabulary: {
                words: ['noticia', 'evento', 'actualidad', 'política'],
                topic: 'current events',
              },
              history: {
                topic: 'current events',
                prompt: 'Read and discuss current news',
              },
              realtime: {
                scenario: 'news discussion',
                prompt: 'Discuss recent events',
              },
            },
          },
          {
            id: 'lesson-10-3',
            title: {
              en: 'Professional Communication',
              es: 'Comunicación Profesional',
            },
            description: {
              en: 'Master workplace language',
              es: 'Domina el lenguaje laboral',
            },
            xpRequired: 1655,
            xpReward: 110,
            modes: ['jobscript', 'realtime', 'vocabulary'],
            content: {
              vocabulary: {
                words: ['reunión', 'presentación', 'informe', 'negociar'],
                topic: 'professional',
              },
              jobscript: {
                scenario: 'business meeting',
                prompt: 'Participate in a professional meeting',
              },
              realtime: {
                scenario: 'workplace conversation',
                prompt: 'Navigate workplace scenarios',
              },
            },
          },
        ],
      },
    ],
  },
  // Template for other languages - can be expanded
  en: { // English (for Spanish speakers)
    beginner: [], // Would mirror Spanish structure
    intermediate: [],
    advanced: [],
  },
  pt: { // Portuguese
    beginner: [],
    intermediate: [],
    advanced: [],
  },
  fr: { // French
    beginner: [],
    intermediate: [],
    advanced: [],
  },
  it: { // Italian
    beginner: [],
    intermediate: [],
    advanced: [],
  },
  nah: { // Nahuatl
    beginner: [],
    intermediate: [],
    advanced: [],
  },
};

/**
 * Get the learning path for a specific language and level
 */
export function getLearningPath(targetLang, level) {
  return LEARNING_PATHS[targetLang]?.[level] || [];
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
    lesson => userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
  );
  return (completedLessons.length / unit.lessons.length) * 100;
}
