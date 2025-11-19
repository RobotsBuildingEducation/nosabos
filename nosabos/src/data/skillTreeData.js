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
      {
        id: 'unit-6',
        title: {
          en: 'Colors & Descriptions',
          es: 'Colores y Descripciones',
        },
        description: {
          en: 'Describe people, places, and things',
          es: 'Describe personas, lugares y cosas',
        },
        color: '#F97316', // Orange
        position: { row: 5, offset: 1 },
        lessons: [
          {
            id: 'lesson-6-1',
            title: {
              en: 'Colors',
              es: 'Colores',
            },
            description: {
              en: 'Learn and use colors',
              es: 'Aprende y usa colores',
            },
            xpRequired: 560,
            xpReward: 50,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco'],
                topic: 'colors',
              },
              grammar: {
                topic: 'color adjectives',
                focusPoints: ['adjective agreement', 'gender and number'],
              },
            },
          },
          {
            id: 'lesson-6-2',
            title: {
              en: 'Physical Descriptions',
              es: 'Descripciones Físicas',
            },
            description: {
              en: 'Describe how people look',
              es: 'Describe cómo se ve la gente',
            },
            xpRequired: 610,
            xpReward: 55,
            modes: ['vocabulary', 'grammar', 'realtime'],
            content: {
              vocabulary: {
                words: ['alto', 'bajo', 'delgado', 'fuerte', 'pelo', 'ojos'],
                topic: 'physical descriptions',
              },
              grammar: {
                topic: 'ser vs estar for descriptions',
                focusPoints: ['permanent vs temporary traits'],
              },
              realtime: {
                scenario: 'describing people',
                prompt: 'Describe family members or friends',
              },
            },
          },
          {
            id: 'lesson-6-3',
            title: {
              en: 'Personality Traits',
              es: 'Rasgos de Personalidad',
            },
            description: {
              en: 'Describe character and personality',
              es: 'Describe carácter y personalidad',
            },
            xpRequired: 665,
            xpReward: 55,
            modes: ['vocabulary', 'grammar', 'stories'],
            content: {
              vocabulary: {
                words: ['simpático', 'amable', 'inteligente', 'divertido', 'serio'],
                topic: 'personality',
              },
              grammar: {
                topic: 'personality adjectives',
                focusPoints: ['positive and negative traits'],
              },
              stories: {
                topic: 'character descriptions',
                prompt: 'Read stories with diverse characters',
              },
            },
          },
        ],
      },
      {
        id: 'unit-7',
        title: {
          en: 'Hobbies & Free Time',
          es: 'Pasatiempos y Tiempo Libre',
        },
        description: {
          en: 'Talk about activities and interests',
          es: 'Habla sobre actividades e intereses',
        },
        color: '#06B6D4', // Cyan
        position: { row: 6, offset: 0 },
        lessons: [
          {
            id: 'lesson-7-1',
            title: {
              en: 'Sports & Exercise',
              es: 'Deportes y Ejercicio',
            },
            description: {
              en: 'Discuss sports and physical activities',
              es: 'Discute deportes y actividades físicas',
            },
            xpRequired: 720,
            xpReward: 55,
            modes: ['vocabulary', 'grammar', 'realtime'],
            content: {
              vocabulary: {
                words: ['fútbol', 'nadar', 'correr', 'jugar', 'practicar'],
                topic: 'sports',
              },
              grammar: {
                topic: 'jugar vs practicar',
                focusPoints: ['sports verbs', 'frequency expressions'],
              },
              realtime: {
                scenario: 'sports conversation',
                prompt: 'Talk about your favorite sports',
              },
            },
          },
          {
            id: 'lesson-7-2',
            title: {
              en: 'Music & Entertainment',
              es: 'Música y Entretenimiento',
            },
            description: {
              en: 'Express preferences in entertainment',
              es: 'Expresa preferencias en entretenimiento',
            },
            xpRequired: 775,
            xpReward: 60,
            modes: ['vocabulary', 'stories', 'realtime'],
            content: {
              vocabulary: {
                words: ['música', 'canción', 'película', 'concierto', 'bailar'],
                topic: 'entertainment',
              },
              stories: {
                topic: 'music and movies',
                prompt: 'Read about cultural entertainment',
              },
              realtime: {
                scenario: 'entertainment discussion',
                prompt: 'Discuss music and movies you enjoy',
              },
            },
          },
          {
            id: 'lesson-7-3',
            title: {
              en: 'Reading & Arts',
              es: 'Lectura y Artes',
            },
            description: {
              en: 'Talk about books and creative activities',
              es: 'Habla sobre libros y actividades creativas',
            },
            xpRequired: 835,
            xpReward: 60,
            modes: ['vocabulary', 'grammar', 'stories'],
            content: {
              vocabulary: {
                words: ['libro', 'leer', 'escribir', 'dibujar', 'pintar'],
                topic: 'arts and reading',
              },
              grammar: {
                topic: 'present progressive',
                focusPoints: ['estar + gerund', 'ongoing activities'],
              },
              stories: {
                topic: 'books and art',
                prompt: 'Read about famous Hispanic artists',
              },
            },
          },
        ],
      },
      {
        id: 'unit-8',
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
            id: 'lesson-8-1',
            title: {
              en: 'Preterite Tense Intro',
              es: 'Introducción al Pretérito',
            },
            description: {
              en: 'Talk about completed past actions',
              es: 'Habla sobre acciones pasadas completadas',
            },
            xpRequired: 895,
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
            id: 'lesson-8-2',
            title: {
              en: 'Weekend Activities',
              es: 'Actividades del Fin de Semana',
            },
            description: {
              en: 'Describe what you did last weekend',
              es: 'Describe qué hiciste el fin de semana pasado',
            },
            xpRequired: 955,
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
            id: 'lesson-8-3',
            title: {
              en: 'Travel Stories',
              es: 'Historias de Viaje',
            },
            description: {
              en: 'Share travel experiences',
              es: 'Comparte experiencias de viaje',
            },
            xpRequired: 1015,
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
        id: 'unit-9',
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
            id: 'lesson-9-1',
            title: {
              en: 'Imperfect Tense',
              es: 'Tiempo Imperfecto',
            },
            description: {
              en: 'Describe past habits and states',
              es: 'Describe hábitos y estados pasados',
            },
            xpRequired: 1080,
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
            id: 'lesson-9-2',
            title: {
              en: 'Childhood Memories',
              es: 'Recuerdos de la Infancia',
            },
            description: {
              en: 'Talk about when you were young',
              es: 'Habla sobre cuando eras joven',
            },
            xpRequired: 1145,
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
            id: 'lesson-9-3',
            title: {
              en: 'Weather & Seasons',
              es: 'Clima y Estaciones',
            },
            description: {
              en: 'Describe weather and seasons',
              es: 'Describe el clima y las estaciones',
            },
            xpRequired: 1215,
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
        id: 'unit-10',
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
            id: 'lesson-10-1',
            title: {
              en: 'Future with Ir + a',
              es: 'Futuro con Ir + a',
            },
            description: {
              en: 'Express near future plans',
              es: 'Expresa planes del futuro cercano',
            },
            xpRequired: 1285,
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
            id: 'lesson-10-2',
            title: {
              en: 'Simple Future Tense',
              es: 'Futuro Simple',
            },
            description: {
              en: 'Use the future tense',
              es: 'Usa el tiempo futuro',
            },
            xpRequired: 1360,
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
            id: 'lesson-10-3',
            title: {
              en: 'Career Goals',
              es: 'Metas Profesionales',
            },
            description: {
              en: 'Discuss career aspirations',
              es: 'Discute aspiraciones profesionales',
            },
            xpRequired: 1435,
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
      {
        id: 'unit-11',
        title: {
          en: 'Health & Body',
          es: 'Salud y Cuerpo',
        },
        description: {
          en: 'Talk about health and wellness',
          es: 'Habla sobre salud y bienestar',
        },
        color: '#10B981', // Emerald
        position: { row: 3, offset: 1 },
        lessons: [
          {
            id: 'lesson-11-1',
            title: {
              en: 'Body Parts',
              es: 'Partes del Cuerpo',
            },
            description: {
              en: 'Learn vocabulary for the body',
              es: 'Aprende vocabulario del cuerpo',
            },
            xpRequired: 1515,
            xpReward: 70,
            modes: ['vocabulary', 'grammar'],
            content: {
              vocabulary: {
                words: ['cabeza', 'brazo', 'pierna', 'mano', 'pie', 'ojo'],
                topic: 'body parts',
              },
              grammar: {
                topic: 'reflexive verbs with body',
                focusPoints: ['doler', 'lavarse', 'body-related actions'],
              },
            },
          },
          {
            id: 'lesson-11-2',
            title: {
              en: 'At the Doctor',
              es: 'En el Médico',
            },
            description: {
              en: 'Describe symptoms and ailments',
              es: 'Describe síntomas y dolencias',
            },
            xpRequired: 1585,
            xpReward: 75,
            modes: ['vocabulary', 'realtime', 'grammar'],
            content: {
              vocabulary: {
                words: ['dolor', 'fiebre', 'médico', 'enfermedad', 'medicina'],
                topic: 'health',
              },
              realtime: {
                scenario: 'doctor visit',
                prompt: 'Practice a conversation at the doctor\'s office',
              },
              grammar: {
                topic: 'expressing pain',
                focusPoints: ['me duele/me duelen'],
              },
            },
          },
          {
            id: 'lesson-11-3',
            title: {
              en: 'Healthy Habits',
              es: 'Hábitos Saludables',
            },
            description: {
              en: 'Discuss exercise and wellness',
              es: 'Discute ejercicio y bienestar',
            },
            xpRequired: 1660,
            xpReward: 75,
            modes: ['vocabulary', 'stories', 'grammar'],
            content: {
              vocabulary: {
                words: ['ejercicio', 'saludable', 'dieta', 'descansar', 'energía'],
                topic: 'wellness',
              },
              stories: {
                topic: 'healthy living',
                prompt: 'Read about maintaining a healthy lifestyle',
              },
              grammar: {
                topic: 'commands for advice',
                focusPoints: ['informal commands', 'health recommendations'],
              },
            },
          },
        ],
      },
      {
        id: 'unit-12',
        title: {
          en: 'Environment & Nature',
          es: 'Medio Ambiente y Naturaleza',
        },
        description: {
          en: 'Discuss nature and environmental topics',
          es: 'Discute temas de naturaleza y medio ambiente',
        },
        color: '#84CC16', // Lime
        position: { row: 4, offset: 0 },
        lessons: [
          {
            id: 'lesson-12-1',
            title: {
              en: 'Animals & Plants',
              es: 'Animales y Plantas',
            },
            description: {
              en: 'Learn vocabulary about nature',
              es: 'Aprende vocabulario sobre la naturaleza',
            },
            xpRequired: 1735,
            xpReward: 75,
            modes: ['vocabulary', 'stories'],
            content: {
              vocabulary: {
                words: ['animal', 'perro', 'gato', 'árbol', 'flor', 'bosque'],
                topic: 'nature',
              },
              stories: {
                topic: 'wildlife',
                prompt: 'Read about Latin American wildlife',
              },
            },
          },
          {
            id: 'lesson-12-2',
            title: {
              en: 'Environmental Issues',
              es: 'Problemas Ambientales',
            },
            description: {
              en: 'Discuss ecology and conservation',
              es: 'Discute ecología y conservación',
            },
            xpRequired: 1810,
            xpReward: 80,
            modes: ['vocabulary', 'realtime', 'history'],
            content: {
              vocabulary: {
                words: ['contaminación', 'reciclar', 'clima', 'proteger', 'naturaleza'],
                topic: 'environment',
              },
              realtime: {
                scenario: 'environmental discussion',
                prompt: 'Discuss environmental concerns',
              },
              history: {
                topic: 'conservation',
                prompt: 'Learn about environmental movements',
              },
            },
          },
          {
            id: 'lesson-12-3',
            title: {
              en: 'Geography & Landscapes',
              es: 'Geografía y Paisajes',
            },
            description: {
              en: 'Describe natural features and places',
              es: 'Describe características y lugares naturales',
            },
            xpRequired: 1890,
            xpReward: 80,
            modes: ['vocabulary', 'grammar', 'stories'],
            content: {
              vocabulary: {
                words: ['montaña', 'río', 'mar', 'playa', 'desierto', 'valle'],
                topic: 'geography',
              },
              grammar: {
                topic: 'location and description',
                focusPoints: ['geographic descriptions', 'estar + location'],
              },
              stories: {
                topic: 'landscapes',
                prompt: 'Read about diverse Latin American landscapes',
              },
            },
          },
        ],
      },
      {
        id: 'unit-13',
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
            id: 'lesson-13-1',
            title: {
              en: 'Present Subjunctive Intro',
              es: 'Introducción al Subjuntivo Presente',
            },
            description: {
              en: 'Learn subjunctive formation',
              es: 'Aprende la formación del subjuntivo',
            },
            xpRequired: 1970,
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
            id: 'lesson-13-2',
            title: {
              en: 'Wishes & Desires',
              es: 'Deseos y Anhelos',
            },
            description: {
              en: 'Express hopes and wishes',
              es: 'Expresa esperanzas y deseos',
            },
            xpRequired: 2060,
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
            id: 'lesson-13-3',
            title: {
              en: 'Doubts & Denials',
              es: 'Dudas y Negaciones',
            },
            description: {
              en: 'Express uncertainty',
              es: 'Expresa incertidumbre',
            },
            xpRequired: 2150,
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
        id: 'unit-14',
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
            id: 'lesson-14-1',
            title: {
              en: 'Debate & Persuasion',
              es: 'Debate y Persuasión',
            },
            description: {
              en: 'Argue and persuade effectively',
              es: 'Argumenta y persuade efectivamente',
            },
            xpRequired: 2245,
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
            id: 'lesson-14-2',
            title: {
              en: 'Current Events',
              es: 'Actualidad',
            },
            description: {
              en: 'Discuss news and events',
              es: 'Discute noticias y eventos',
            },
            xpRequired: 2345,
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
            id: 'lesson-14-3',
            title: {
              en: 'Professional Communication',
              es: 'Comunicación Profesional',
            },
            description: {
              en: 'Master workplace language',
              es: 'Domina el lenguaje laboral',
            },
            xpRequired: 2445,
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
      {
        id: 'unit-15',
        title: {
          en: 'Literature & Arts',
          es: 'Literatura y Artes',
        },
        description: {
          en: 'Explore Hispanic culture and creativity',
          es: 'Explora la cultura y creatividad hispana',
        },
        color: '#DB2777', // Pink-600
        position: { row: 2, offset: 0 },
        lessons: [
          {
            id: 'lesson-15-1',
            title: {
              en: 'Poetry & Prose',
              es: 'Poesía y Prosa',
            },
            description: {
              en: 'Read and analyze literature',
              es: 'Lee y analiza literatura',
            },
            xpRequired: 2555,
            xpReward: 100,
            modes: ['stories', 'vocabulary', 'history'],
            content: {
              vocabulary: {
                words: ['poeta', 'verso', 'metáfora', 'narrativa', 'estilo'],
                topic: 'literature',
              },
              stories: {
                topic: 'literature',
                prompt: 'Read works by famous Hispanic authors',
              },
              history: {
                topic: 'literary movements',
                prompt: 'Learn about Hispanic literary history',
              },
            },
          },
          {
            id: 'lesson-15-2',
            title: {
              en: 'Visual Arts',
              es: 'Artes Visuales',
            },
            description: {
              en: 'Discuss painting and sculpture',
              es: 'Discute pintura y escultura',
            },
            xpRequired: 2655,
            xpReward: 105,
            modes: ['vocabulary', 'history', 'realtime'],
            content: {
              vocabulary: {
                words: ['pintura', 'escultura', 'artista', 'galería', 'obra'],
                topic: 'visual arts',
              },
              history: {
                topic: 'Hispanic artists',
                prompt: 'Learn about Frida Kahlo, Diego Rivera, and more',
              },
              realtime: {
                scenario: 'art discussion',
                prompt: 'Discuss artistic works and styles',
              },
            },
          },
          {
            id: 'lesson-15-3',
            title: {
              en: 'Cinema & Theater',
              es: 'Cine y Teatro',
            },
            description: {
              en: 'Explore performing arts',
              es: 'Explora artes escénicas',
            },
            xpRequired: 2760,
            xpReward: 105,
            modes: ['vocabulary', 'stories', 'realtime'],
            content: {
              vocabulary: {
                words: ['película', 'director', 'actor', 'escena', 'guion'],
                topic: 'cinema',
              },
              stories: {
                topic: 'Hispanic cinema',
                prompt: 'Learn about influential Hispanic films',
              },
              realtime: {
                scenario: 'film discussion',
                prompt: 'Discuss movies and performances',
              },
            },
          },
        ],
      },
      {
        id: 'unit-16',
        title: {
          en: 'Technology & Innovation',
          es: 'Tecnología e Innovación',
        },
        description: {
          en: 'Discuss modern technology and digital life',
          es: 'Discute tecnología moderna y vida digital',
        },
        color: '#0EA5E9', // Sky-500
        position: { row: 3, offset: 1 },
        lessons: [
          {
            id: 'lesson-16-1',
            title: {
              en: 'Digital Communication',
              es: 'Comunicación Digital',
            },
            description: {
              en: 'Navigate online interactions',
              es: 'Navega interacciones en línea',
            },
            xpRequired: 2865,
            xpReward: 105,
            modes: ['vocabulary', 'realtime', 'grammar'],
            content: {
              vocabulary: {
                words: ['internet', 'correo', 'mensaje', 'aplicación', 'red social'],
                topic: 'digital communication',
              },
              realtime: {
                scenario: 'online conversation',
                prompt: 'Practice digital communication',
              },
              grammar: {
                topic: 'technology expressions',
                focusPoints: ['tech-related verbs', 'modern terminology'],
              },
            },
          },
          {
            id: 'lesson-16-2',
            title: {
              en: 'Science & Progress',
              es: 'Ciencia y Progreso',
            },
            description: {
              en: 'Discuss scientific advancement',
              es: 'Discute avance científico',
            },
            xpRequired: 2970,
            xpReward: 110,
            modes: ['vocabulary', 'history', 'realtime'],
            content: {
              vocabulary: {
                words: ['investigación', 'descubrimiento', 'tecnología', 'innovar', 'futuro'],
                topic: 'science',
              },
              history: {
                topic: 'Hispanic scientists',
                prompt: 'Learn about Hispanic contributions to science',
              },
              realtime: {
                scenario: 'science discussion',
                prompt: 'Discuss technological innovations',
              },
            },
          },
          {
            id: 'lesson-16-3',
            title: {
              en: 'Digital Economy',
              es: 'Economía Digital',
            },
            description: {
              en: 'Talk about modern business and tech',
              es: 'Habla sobre negocios modernos y tecnología',
            },
            xpRequired: 3080,
            xpReward: 110,
            modes: ['jobscript', 'vocabulary', 'realtime'],
            content: {
              vocabulary: {
                words: ['emprendedor', 'startup', 'digital', 'comercio', 'plataforma'],
                topic: 'digital economy',
              },
              jobscript: {
                scenario: 'tech startup pitch',
                prompt: 'Present a tech business idea',
              },
              realtime: {
                scenario: 'business tech discussion',
                prompt: 'Discuss digital business trends',
              },
            },
          },
        ],
      },
      {
        id: 'unit-17',
        title: {
          en: 'Social Issues & Ethics',
          es: 'Problemas Sociales y Ética',
        },
        description: {
          en: 'Engage with complex social topics',
          es: 'Participa en temas sociales complejos',
        },
        color: '#A855F7', // Purple-500
        position: { row: 4, offset: 0 },
        lessons: [
          {
            id: 'lesson-17-1',
            title: {
              en: 'Social Justice',
              es: 'Justicia Social',
            },
            description: {
              en: 'Discuss equality and rights',
              es: 'Discute igualdad y derechos',
            },
            xpRequired: 3190,
            xpReward: 115,
            modes: ['vocabulary', 'realtime', 'history'],
            content: {
              vocabulary: {
                words: ['justicia', 'igualdad', 'derechos', 'diversidad', 'inclusión'],
                topic: 'social justice',
              },
              realtime: {
                scenario: 'social issues discussion',
                prompt: 'Discuss social justice topics',
              },
              history: {
                topic: 'civil rights movements',
                prompt: 'Learn about Hispanic social movements',
              },
            },
          },
          {
            id: 'lesson-17-2',
            title: {
              en: 'Global Challenges',
              es: 'Desafíos Globales',
            },
            description: {
              en: 'Address worldwide issues',
              es: 'Aborda problemas mundiales',
            },
            xpRequired: 3305,
            xpReward: 120,
            modes: ['vocabulary', 'realtime', 'grammar'],
            content: {
              vocabulary: {
                words: ['global', 'crisis', 'solución', 'cooperación', 'sostenibilidad'],
                topic: 'global issues',
              },
              realtime: {
                scenario: 'global discussion',
                prompt: 'Discuss international challenges',
              },
              grammar: {
                topic: 'advanced expressions',
                focusPoints: ['complex conditionals', 'hypothetical situations'],
              },
            },
          },
        ],
      },
    ],
    intermediate: [],
    advanced: [],
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
