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
const baseLearningPath = {
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
          {
            id: 'lesson-1-quiz',
            title: {
              en: 'Unit 1 Quiz',
              es: 'Examen de Unidad 1',
            },
            description: {
              en: 'Test your knowledge of greetings and introductions',
              es: 'Prueba tus conocimientos de saludos y presentaciones',
            },
            xpRequired: 70,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['hola', 'adiós', 'buenos días', 'buenas tardes', 'buenas noches', 'me llamo', '¿cómo?', '¿qué?', '¿dónde?'],
                topic: 'Unit 1 Review: greetings and questions',
              },
              grammar: {
                topic: 'Unit 1 Review',
                focusPoints: ['greetings', 'introductions', 'question words', 'verb ser'],
              },
              realtime: {
                scenario: 'comprehensive introduction',
                prompt: 'Have a complete conversation: greet someone, introduce yourself, and ask them questions',
              },
              stories: {
                topic: 'meeting someone new',
                prompt: 'Tell a story about meeting someone for the first time using greetings and introductions',
              },
              history: {
                topic: 'Spanish greetings and cultural context',
                prompt: 'Learn about the cultural significance of greetings in Spanish-speaking countries',
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
          {
            id: 'lesson-2-quiz',
            title: {
              en: 'Unit 2 Quiz',
              es: 'Examen de Unidad 2',
            },
            description: {
              en: 'Test your knowledge of likes, numbers, and food (80% required to pass)',
              es: 'Prueba tus conocimientos de gustos, números y comida (se requiere 80% para aprobar)',
            },
            xpRequired: 165,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['me gusta', 'no me gusta', 'me encanta', 'odio', 'prefiero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'diez', 'veinte', 'agua', 'café', 'pan', 'arroz', 'pollo', 'fruta'],
                topic: 'Unit 2 Review: Likes, Numbers, and Food',
              },
              grammar: {
                topic: 'Unit 2 Review',
                focusPoints: ['gustar verb with indirect object pronouns', 'singular vs plural forms', 'numbers 1-20 in sentences', 'food vocabulary usage'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation where you express your food preferences using me gusta/no me gusta, count items, and order food at a restaurant',
              },
              stories: {
                topic: 'dining and preferences',
                prompt: 'Write a story about visiting a restaurant, ordering food, and expressing what you like and don\'t like about different dishes',
              },
              history: {
                topic: 'Latin American cuisine',
                prompt: 'Learn about the diversity of food traditions across Spanish-speaking countries and how they reflect cultural heritage',
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
          {
            id: 'lesson-3-quiz',
            title: {
              en: 'Unit 3 Quiz',
              es: 'Examen de Unidad 3',
            },
            description: {
              en: 'Test your knowledge of time, daily routines, and family (80% required to pass)',
              es: 'Prueba tus conocimientos de la hora, rutinas diarias y familia (se requiere 80% para aprobar)',
            },
            xpRequired: 280,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['hora', 'minuto', 'mañana', 'tarde', 'noche', 'despertarse', 'levantarse', 'ducharse', 'desayunar', 'trabajar', 'madre', 'padre', 'hermano', 'hermana', 'familia'],
                topic: 'Unit 3 Review: Time, Daily Routines, and Family',
              },
              grammar: {
                topic: 'Unit 3 Review',
                focusPoints: ['telling time (es la / son las)', 'reflexive verbs (me/te/se)', 'possessive adjectives (mi/tu/su)', 'daily routine conjugations'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation where you ask and tell the time, describe your daily routine using reflexive verbs, and introduce your family members',
              },
              stories: {
                topic: 'daily life and family',
                prompt: 'Write a story about a typical day in your family, including what time different activities happen and who does what',
              },
              history: {
                topic: 'family structure in Hispanic culture',
                prompt: 'Learn about the importance of extended family in Spanish-speaking cultures and traditional family values',
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
          {
            id: 'lesson-4-quiz',
            title: {
              en: 'Unit 4 Quiz',
              es: 'Examen de Unidad 4',
            },
            description: {
              en: 'Test your knowledge of places, directions, and transportation (80% required to pass)',
              es: 'Prueba tus conocimientos de lugares, direcciones y transporte (se requiere 80% para aprobar)',
            },
            xpRequired: 410,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['banco', 'supermercado', 'hospital', 'escuela', 'parque', 'derecha', 'izquierda', 'recto', 'cerca', 'lejos', 'autobús', 'metro', 'taxi', 'bicicleta', 'caminar'],
                topic: 'Unit 4 Review: Places, Directions, and Transportation',
              },
              grammar: {
                topic: 'Unit 4 Review',
                focusPoints: ['location prepositions (en, al, del)', 'estar with locations', 'imperative mood for directions', 'ir + a for going places'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation where you ask for directions to different places in town, explain how to get somewhere, and discuss different transportation options',
              },
              stories: {
                topic: 'navigating the city',
                prompt: 'Write a story about exploring a new city, visiting different places, and using various forms of transportation to get around',
              },
              history: {
                topic: 'urban development in Latin America',
                prompt: 'Learn about the evolution of cities in Spanish-speaking countries and their unique transportation systems like Mexico City\'s Metro',
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
          {
            id: 'lesson-5-quiz',
            title: {
              en: 'Unit 5 Quiz',
              es: 'Examen de Unidad 5',
            },
            description: {
              en: 'Test your knowledge of shopping, numbers, and clothing (80% required to pass)',
              es: 'Prueba tus conocimientos de compras, números y ropa (se requiere 80% para aprobar)',
            },
            xpRequired: 560,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['comprar', 'vender', 'precio', 'barato', 'caro', 'treinta', 'cuarenta', 'cincuenta', 'cien', 'camisa', 'pantalón', 'zapatos', 'vestido', 'llevar'],
                topic: 'Unit 5 Review: Shopping, Money, and Clothing',
              },
              grammar: {
                topic: 'Unit 5 Review',
                focusPoints: ['large numbers (30-100)', 'currency and prices', 'adjective agreement with clothing', 'shopping verb conjugations'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation at a clothing store where you ask about prices, discuss sizes and colors, and negotiate purchases using larger numbers',
              },
              stories: {
                topic: 'shopping experience',
                prompt: 'Write a story about a shopping trip where you buy clothes, compare prices, and describe what you purchased',
              },
              history: {
                topic: 'traditional markets in Latin America',
                prompt: 'Learn about the history and cultural significance of mercados and tianguis in Spanish-speaking countries',
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
          {
            id: 'lesson-6-quiz',
            title: {
              en: 'Unit 6 Quiz',
              es: 'Examen de Unidad 6',
            },
            description: {
              en: 'Test your knowledge of colors, physical descriptions, and personality traits (80% required to pass)',
              es: 'Prueba tus conocimientos de colores, descripciones físicas y rasgos de personalidad (se requiere 80% para aprobar)',
            },
            xpRequired: 720,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'alto', 'bajo', 'delgado', 'fuerte', 'pelo', 'ojos', 'simpático', 'amable', 'inteligente', 'divertido', 'serio'],
                topic: 'Unit 6 Review: Colors, Descriptions, and Personality',
              },
              grammar: {
                topic: 'Unit 6 Review',
                focusPoints: ['color adjective agreement', 'ser vs estar for descriptions', 'permanent vs temporary traits', 'personality adjectives'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation where you describe people using colors, physical characteristics, and personality traits, explaining what they look like and what they are like as people',
              },
              stories: {
                topic: 'character descriptions',
                prompt: 'Write a story introducing different characters, describing their physical appearance, clothing colors, and personality traits',
              },
              history: {
                topic: 'diversity in the Spanish-speaking world',
                prompt: 'Learn about the rich ethnic and cultural diversity across Latin America and Spain, and how different regions celebrate their unique characteristics',
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
          {
            id: 'lesson-7-quiz',
            title: {
              en: 'Unit 7 Quiz',
              es: 'Examen de Unidad 7',
            },
            description: {
              en: 'Test your knowledge of sports, entertainment, and arts (80% required to pass)',
              es: 'Prueba tus conocimientos de deportes, entretenimiento y artes (se requiere 80% para aprobar)',
            },
            xpRequired: 895,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['fútbol', 'nadar', 'correr', 'jugar', 'practicar', 'música', 'canción', 'película', 'concierto', 'bailar', 'libro', 'leer', 'escribir', 'dibujar', 'pintar'],
                topic: 'Unit 7 Review: Hobbies, Sports, and Entertainment',
              },
              grammar: {
                topic: 'Unit 7 Review',
                focusPoints: ['jugar vs practicar with sports', 'frequency expressions', 'present progressive (estar + gerund)', 'ongoing activities'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about your hobbies and interests, discussing sports you play, music and movies you enjoy, and creative activities you do in your free time',
              },
              stories: {
                topic: 'hobbies and free time',
                prompt: 'Write a story about a weekend full of activities including sports, entertainment, and creative pursuits',
              },
              history: {
                topic: 'sports and arts in Hispanic culture',
                prompt: 'Learn about the cultural importance of soccer in Latin America, famous Hispanic artists like Frida Kahlo and Diego Rivera, and traditional music genres',
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
          {
            id: 'lesson-8-quiz',
            title: {
              en: 'Unit 8 Quiz',
              es: 'Examen de Unidad 8',
            },
            description: {
              en: 'Test your knowledge of preterite tense and past experiences (80% required to pass)',
              es: 'Prueba tus conocimientos del pretérito y experiencias pasadas (se requiere 80% para aprobar)',
            },
            xpRequired: 1080,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['ayer', 'anoche', 'la semana pasada', 'viajar', 'visitar', 'conocer', 'descubrir'],
                topic: 'Unit 8 Review: Past Experiences and Travel',
              },
              grammar: {
                topic: 'Unit 8 Review',
                focusPoints: ['preterite tense regular -ar verbs', 'preterite -er/-ir verbs', 'past time markers', 'completed past actions'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about what you did last weekend or on a recent trip, using preterite tense to describe completed actions',
              },
              stories: {
                topic: 'past experiences',
                prompt: 'Write a story about a memorable trip or weekend experience, describing what you did, where you visited, and what you discovered',
              },
              history: {
                topic: 'historical travels and explorers',
                prompt: 'Learn about famous Spanish explorers and their journeys, and the history of travel in the Spanish-speaking world',
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
          {
            id: 'lesson-9-quiz',
            title: {
              en: 'Unit 9 Quiz',
              es: 'Examen de Unidad 9',
            },
            description: {
              en: 'Test your knowledge of imperfect tense, childhood, and weather (80% required to pass)',
              es: 'Prueba tus conocimientos del imperfecto, infancia y clima (se requiere 80% para aprobar)',
            },
            xpRequired: 1285,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['llover', 'nevar', 'hacer calor', 'hacer frío', 'primavera'],
                topic: 'Unit 9 Review: Imperfect Tense, Childhood, and Weather',
              },
              grammar: {
                topic: 'Unit 9 Review',
                focusPoints: ['imperfect tense formation', 'imperfect vs preterite', 'habitual past actions', 'weather expressions (hacer, estar, hay)'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about your childhood, describing what you used to do, what the weather was like where you grew up, and your habits when you were young',
              },
              stories: {
                topic: 'childhood memories',
                prompt: 'Write a story about your childhood, describing typical activities, the weather in different seasons, and how things were different back then',
              },
              history: {
                topic: 'climate diversity in the Spanish-speaking world',
                prompt: 'Learn about the varied climates across Latin America and Spain, from tropical to desert to alpine regions',
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
          {
            id: 'lesson-10-quiz',
            title: {
              en: 'Unit 10 Quiz',
              es: 'Examen de Unidad 10',
            },
            description: {
              en: 'Test your knowledge of future tenses and career vocabulary (80% required to pass)',
              es: 'Prueba tus conocimientos de tiempos futuros y vocabulario de carreras (se requiere 80% para aprobar)',
            },
            xpRequired: 1515,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['carrera', 'trabajo', 'meta', 'aspiración', 'futuro'],
                topic: 'Unit 10 Review: Future Plans and Careers',
              },
              grammar: {
                topic: 'Unit 10 Review',
                focusPoints: ['ir + a + infinitive for near future', 'simple future tense regular endings', 'irregular future verbs', 'future time expressions'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about your future plans, discussing what you are going to do tomorrow and your long-term career goals and aspirations',
              },
              stories: {
                topic: 'future dreams and goals',
                prompt: 'Write a story about your future, describing your career aspirations, where you will live, and what you hope to achieve',
              },
              history: {
                topic: 'education and careers in Latin America',
                prompt: 'Learn about educational systems and career opportunities in Spanish-speaking countries, and how they are evolving',
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
          {
            id: 'lesson-11-quiz',
            title: {
              en: 'Unit 11 Quiz',
              es: 'Examen de Unidad 11',
            },
            description: {
              en: 'Test your knowledge of body parts, health, and wellness (80% required to pass)',
              es: 'Prueba tus conocimientos de partes del cuerpo, salud y bienestar (se requiere 80% para aprobar)',
            },
            xpRequired: 1735,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['cabeza', 'brazo', 'pierna', 'mano', 'pie', 'ojo', 'dolor', 'fiebre', 'médico', 'enfermedad', 'medicina', 'ejercicio', 'saludable', 'dieta', 'descansar', 'energía'],
                topic: 'Unit 11 Review: Health, Body, and Wellness',
              },
              grammar: {
                topic: 'Unit 11 Review',
                focusPoints: ['reflexive verbs with body parts', 'doler conjugation (me duele/me duelen)', 'informal commands for health advice', 'body-related actions'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation at a doctor\'s office where you describe symptoms, explain what hurts, and discuss healthy habits and wellness practices',
              },
              stories: {
                topic: 'health and wellness',
                prompt: 'Write a story about someone\'s journey to better health, including visiting a doctor, changing their habits, and improving their lifestyle',
              },
              history: {
                topic: 'traditional medicine in Latin America',
                prompt: 'Learn about traditional healing practices and remedies in Spanish-speaking cultures, and how they complement modern medicine',
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
          {
            id: 'lesson-12-quiz',
            title: {
              en: 'Unit 12 Quiz',
              es: 'Examen de Unidad 12',
            },
            description: {
              en: 'Test your knowledge of nature, environment, and geography (80% required to pass)',
              es: 'Prueba tus conocimientos de naturaleza, medio ambiente y geografía (se requiere 80% para aprobar)',
            },
            xpRequired: 1970,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['animal', 'perro', 'gato', 'árbol', 'flor', 'bosque', 'contaminación', 'reciclar', 'clima', 'proteger', 'naturaleza', 'montaña', 'río', 'mar', 'playa', 'desierto', 'valle'],
                topic: 'Unit 12 Review: Environment, Nature, and Geography',
              },
              grammar: {
                topic: 'Unit 12 Review',
                focusPoints: ['geographic descriptions', 'estar with locations', 'environmental vocabulary usage', 'descriptive language for nature'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about environmental issues, discussing ways to protect nature, describing geographic features, and talking about plants and animals in your region',
              },
              stories: {
                topic: 'environment and nature',
                prompt: 'Write a story about exploring a natural landscape, encountering wildlife, and learning about environmental conservation',
              },
              history: {
                topic: 'biodiversity and conservation in Latin America',
                prompt: 'Learn about the Amazon rainforest, Galapagos Islands, and other unique ecosystems in Spanish-speaking regions, and conservation efforts to protect them',
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
          {
            id: 'lesson-13-quiz',
            title: {
              en: 'Unit 13 Quiz',
              es: 'Examen de Unidad 13',
            },
            description: {
              en: 'Test your knowledge of subjunctive mood (80% required to pass)',
              es: 'Prueba tus conocimientos del modo subjuntivo (se requiere 80% para aprobar)',
            },
            xpRequired: 2245,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['querer', 'esperar', 'dudar', 'negar', 'desear', 'temer', 'alegrarse'],
                topic: 'Unit 13 Review: Subjunctive Mood and Trigger Verbs',
              },
              grammar: {
                topic: 'Unit 13 Review',
                focusPoints: ['present subjunctive formation', 'trigger phrases for subjunctive', 'subjunctive with wishes (querer, esperar)', 'subjunctive with doubt (dudar, no creer)', 'irregular subjunctive forms'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation expressing your wishes, hopes, doubts, and emotions about various topics using the subjunctive mood',
              },
              stories: {
                topic: 'wishes and emotions',
                prompt: 'Write a story about characters expressing their hopes, fears, doubts, and desires for the future using subjunctive constructions',
              },
              history: {
                topic: 'expressions of emotion in Hispanic culture',
                prompt: 'Learn about how Spanish-speaking cultures express emotions, wishes, and hopes, and the cultural importance of these expressions',
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
          {
            id: 'lesson-14-quiz',
            title: {
              en: 'Unit 14 Quiz',
              es: 'Examen de Unidad 14',
            },
            description: {
              en: 'Test your knowledge of debate, current events, and professional communication (80% required to pass)',
              es: 'Prueba tus conocimientos de debate, actualidad y comunicación profesional (se requiere 80% para aprobar)',
            },
            xpRequired: 2555,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['argumentar', 'convencer', 'debatir', 'persuadir', 'noticia', 'evento', 'actualidad', 'política', 'reunión', 'presentación', 'informe', 'negociar'],
                topic: 'Unit 14 Review: Complex Conversations and Professional Communication',
              },
              grammar: {
                topic: 'Unit 14 Review',
                focusPoints: ['advanced persuasive language', 'formal vs informal registers', 'professional communication structures', 'debate and argumentation techniques'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Participate in a professional meeting where you present ideas, debate different viewpoints, discuss current events, and persuade colleagues',
              },
              stories: {
                topic: 'professional life',
                prompt: 'Write a story about a professional situation involving debates, presentations, and navigating complex workplace dynamics',
              },
              history: {
                topic: 'media and politics in the Hispanic world',
                prompt: 'Learn about important current events, media landscape, and political systems in Spanish-speaking countries',
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
          {
            id: 'lesson-15-quiz',
            title: {
              en: 'Unit 15 Quiz',
              es: 'Examen de Unidad 15',
            },
            description: {
              en: 'Test your knowledge of literature and arts (80% required to pass)',
              es: 'Prueba tus conocimientos de literatura y artes (se requiere 80% para aprobar)',
            },
            xpRequired: 2865,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['poeta', 'verso', 'metáfora', 'narrativa', 'estilo', 'pintura', 'escultura', 'artista', 'galería', 'obra', 'película', 'director', 'actor', 'escena', 'guion'],
                topic: 'Unit 15 Review: Literature, Visual Arts, and Cinema',
              },
              grammar: {
                topic: 'Unit 15 Review',
                focusPoints: ['literary analysis vocabulary', 'artistic descriptions', 'cultural discussion structures', 'advanced adjectives for art'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about Hispanic culture, discussing literature, visual arts, and cinema, analyzing works and expressing artistic opinions',
              },
              stories: {
                topic: 'arts and culture',
                prompt: 'Write a story about visiting museums and theaters, experiencing Hispanic arts and culture, and being inspired by famous works',
              },
              history: {
                topic: 'Hispanic cultural movements',
                prompt: 'Learn about major literary movements, famous Hispanic artists like Frida Kahlo and Pablo Picasso, and influential films from Spanish-speaking countries',
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
          {
            id: 'lesson-16-quiz',
            title: {
              en: 'Unit 16 Quiz',
              es: 'Examen de Unidad 16',
            },
            description: {
              en: 'Test your knowledge of technology and innovation (80% required to pass)',
              es: 'Prueba tus conocimientos de tecnología e innovación (se requiere 80% para aprobar)',
            },
            xpRequired: 3190,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['internet', 'correo', 'mensaje', 'aplicación', 'red social', 'investigación', 'descubrimiento', 'tecnología', 'innovar', 'futuro', 'emprendedor', 'startup', 'digital', 'comercio', 'plataforma'],
                topic: 'Unit 16 Review: Technology, Innovation, and Digital Economy',
              },
              grammar: {
                topic: 'Unit 16 Review',
                focusPoints: ['technology-related verbs', 'modern terminology', 'digital communication expressions', 'business and innovation vocabulary'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about technology and innovation, discussing digital communication, scientific discoveries, and entrepreneurial ideas in the digital economy',
              },
              stories: {
                topic: 'technology and innovation',
                prompt: 'Write a story about launching a tech startup, making scientific discoveries, or how technology has transformed modern life',
              },
              history: {
                topic: 'Hispanic contributions to science and technology',
                prompt: 'Learn about important Hispanic scientists, inventors, and entrepreneurs who have shaped modern technology and innovation',
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
          {
            id: 'lesson-17-quiz',
            title: {
              en: 'Unit 17 Quiz',
              es: 'Examen de Unidad 17',
            },
            description: {
              en: 'Test your knowledge of social issues and ethics (80% required to pass)',
              es: 'Prueba tus conocimientos de problemas sociales y ética (se requiere 80% para aprobar)',
            },
            xpRequired: 3425,
            xpReward: 0,
            modes: ['vocabulary', 'grammar', 'realtime', 'stories', 'history'],
            content: {
              vocabulary: {
                words: ['justicia', 'igualdad', 'derechos', 'diversidad', 'inclusión', 'global', 'crisis', 'solución', 'cooperación', 'sostenibilidad'],
                topic: 'Unit 17 Review: Social Issues, Ethics, and Global Challenges',
              },
              grammar: {
                topic: 'Unit 17 Review',
                focusPoints: ['advanced discourse markers', 'persuasive language for social topics', 'subjunctive for expressing hopes and concerns', 'complex sentence structures'],
              },
              realtime: {
                scenario: 'comprehensive review',
                prompt: 'Have a conversation about social justice, global challenges, and ethical issues, discussing equality, rights, sustainability, and international cooperation',
              },
              stories: {
                topic: 'social change and ethics',
                prompt: 'Write a story about addressing a social issue, working toward justice and equality, or solving a global challenge through cooperation',
              },
              history: {
                topic: 'social movements in Latin America',
                prompt: 'Learn about important social justice movements, civil rights leaders, and ethical debates in Spanish-speaking countries throughout history',
              },
            },
          },
        ],
      },
  ],
  intermediate: [],
  advanced: [],
};

const SUPPORTED_TARGET_LANGS = new Set(['en', 'es', 'pt', 'fr', 'it', 'nah']);
const DEFAULT_TARGET_LANG = 'es';

const VOCABULARY_LIBRARY = {
  greetings: {
    en: ['hello', 'goodbye', 'good morning', 'good afternoon', 'good night'],
    es: ['hola', 'adiós', 'buenos días', 'buenas tardes', 'buenas noches'],
    fr: ['bonjour', 'salut', 'bonsoir', 'bonne nuit', 'à bientôt'],
    pt: ['olá', 'tchau', 'bom dia', 'boa tarde', 'boa noite'],
    it: ['ciao', 'arrivederci', 'buongiorno', 'buon pomeriggio', 'buonanotte'],
    nah: ['niltze', 'motlazotla', 'tlaneci', 'tlahco tonalli', 'yohualli'],
  },
  'question words': {
    en: ['who', 'what', 'where', 'when', 'why'],
    es: ['¿quién?', '¿qué?', '¿dónde?', '¿cuándo?', '¿por qué?'],
    fr: ['qui', 'quoi', 'où', 'quand', 'pourquoi'],
    pt: ['quem', 'o que', 'onde', 'quando', 'por quê'],
    it: ['chi', 'che cosa', 'dove', 'quando', 'perché'],
    nah: ['aqueni', 'tlen', 'canin', 'quema', 'tleca'],
  },
  preferences: {
    en: ['I like', "I don't like", 'I love', 'I prefer', 'I dislike'],
    es: ['me gusta', 'no me gusta', 'me encanta', 'prefiero', 'me desagrada'],
    fr: ["j'aime", "je n'aime pas", "j'adore", 'je préfère', 'je déteste'],
    pt: ['eu gosto', 'eu não gosto', 'eu adoro', 'eu prefiro', 'eu detesto'],
    it: ['mi piace', 'non mi piace', 'adoro', 'preferisco', 'detesto'],
    nah: ['nicniqui', 'axnicniqui', 'nicmotetzopelia', 'nicnequi', 'axniquilia'],
  },
  numbers: {
    en: ['one', 'two', 'three', 'ten', 'twenty'],
    es: ['uno', 'dos', 'tres', 'diez', 'veinte'],
    fr: ['un', 'deux', 'trois', 'dix', 'vingt'],
    pt: ['um', 'dois', 'três', 'dez', 'vinte'],
    it: ['uno', 'due', 'tre', 'dieci', 'venti'],
    nah: ['ce', 'ome', 'eyi', 'mahtlactli', 'cempualli'],
  },
  'food and drinks': {
    en: ['water', 'coffee', 'bread', 'rice', 'chicken'],
    es: ['agua', 'café', 'pan', 'arroz', 'pollo'],
    fr: ['eau', 'café', 'pain', 'riz', 'poulet'],
    pt: ['água', 'café', 'pão', 'arroz', 'frango'],
    it: ['acqua', 'caffè', 'pane', 'riso', 'pollo'],
    nah: ['atl', 'cafeto', 'pantli', 'ollohtli', 'totolin'],
  },
  time: {
    en: ['morning', 'afternoon', 'night', "o'clock", 'minute'],
    es: ['mañana', 'tarde', 'noche', 'en punto', 'minuto'],
    fr: ['matin', 'après-midi', 'nuit', 'heure pile', 'minute'],
    pt: ['manhã', 'tarde', 'noite', 'em ponto', 'minuto'],
    it: ['mattina', 'pomeriggio', 'notte', "in punto", 'minuto'],
    nah: ['tlaneci', 'tlahco', 'yohualli', 'ce hora', 'momimi'],
  },
  'daily activities': {
    en: ['wake up', 'eat breakfast', 'work', 'study', 'sleep'],
    es: ['despertar', 'desayunar', 'trabajar', 'estudiar', 'dormir'],
    fr: ['se réveiller', 'prendre le petit-déj', 'travailler', 'étudier', 'dormir'],
    pt: ['acordar', 'tomar café', 'trabalhar', 'estudar', 'dormir'],
    it: ['svegliarsi', 'fare colazione', 'lavorare', 'studiare', 'dormire'],
  },
  family: {
    en: ['mother', 'father', 'brother', 'sister', 'grandmother'],
    es: ['madre', 'padre', 'hermano', 'hermana', 'abuela'],
    fr: ['mère', 'père', 'frère', 'sœur', 'grand-mère'],
    pt: ['mãe', 'pai', 'irmão', 'irmã', 'avó'],
    it: ['madre', 'padre', 'fratello', 'sorella', 'nonna'],
  },
  places: {
    en: ['home', 'school', 'office', 'park', 'store'],
    es: ['casa', 'escuela', 'oficina', 'parque', 'tienda'],
    fr: ['maison', 'école', 'bureau', 'parc', 'magasin'],
    pt: ['casa', 'escola', 'escritório', 'parque', 'loja'],
    it: ['casa', 'scuola', 'ufficio', 'parco', 'negozio'],
  },
  directions: {
    en: ['left', 'right', 'straight', 'north', 'south'],
    es: ['izquierda', 'derecha', 'recto', 'norte', 'sur'],
    fr: ['gauche', 'droite', 'tout droit', 'nord', 'sud'],
    pt: ['esquerda', 'direita', 'em frente', 'norte', 'sul'],
    it: ['sinistra', 'destra', 'dritto', 'nord', 'sud'],
  },
  transportation: {
    en: ['bus', 'train', 'plane', 'ticket', 'station'],
    es: ['autobús', 'tren', 'avión', 'boleto', 'estación'],
    fr: ['bus', 'train', 'avion', 'billet', 'gare'],
    pt: ['ônibus', 'trem', 'avião', 'bilhete', 'estação'],
    it: ['autobus', 'treno', 'aereo', 'biglietto', 'stazione'],
  },
  shopping: {
    en: ['price', 'money', 'sale', 'cashier', 'receipt'],
    es: ['precio', 'dinero', 'oferta', 'cajero', 'recibo'],
    fr: ['prix', 'argent', 'promotion', 'caissier', 'reçu'],
    pt: ['preço', 'dinheiro', 'promoção', 'caixa', 'recibo'],
    it: ['prezzo', 'denaro', 'offerta', 'cassiere', 'scontrino'],
  },
  clothing: {
    en: ['shirt', 'pants', 'dress', 'shoes', 'jacket'],
    es: ['camisa', 'pantalón', 'vestido', 'zapatos', 'chaqueta'],
    fr: ['chemise', 'pantalon', 'robe', 'chaussures', 'veste'],
    pt: ['camisa', 'calça', 'vestido', 'sapatos', 'jaqueta'],
    it: ['camicia', 'pantaloni', 'abito', 'scarpe', 'giacca'],
  },
  colors: {
    en: ['red', 'blue', 'green', 'yellow', 'black'],
    es: ['rojo', 'azul', 'verde', 'amarillo', 'negro'],
    fr: ['rouge', 'bleu', 'vert', 'jaune', 'noir'],
    pt: ['vermelho', 'azul', 'verde', 'amarelo', 'preto'],
    it: ['rosso', 'blu', 'verde', 'giallo', 'nero'],
  },
  'physical descriptions': {
    en: ['tall', 'short', 'young', 'old', 'strong'],
    es: ['alto', 'bajo', 'joven', 'viejo', 'fuerte'],
    fr: ['grand', 'petit', 'jeune', 'vieux', 'fort'],
    pt: ['alto', 'baixo', 'jovem', 'velho', 'forte'],
    it: ['alto', 'basso', 'giovane', 'anziano', 'forte'],
  },
  personality: {
    en: ['kind', 'funny', 'serious', 'friendly', 'shy'],
    es: ['amable', 'gracioso', 'serio', 'amistoso', 'tímido'],
    fr: ['gentil', 'drôle', 'sérieux', 'amical', 'timide'],
    pt: ['amável', 'engraçado', 'sério', 'amigável', 'tímido'],
    it: ['gentile', 'divertente', 'serio', 'amichevole', 'timido'],
  },
  sports: {
    en: ['soccer', 'basketball', 'tennis', 'swimming', 'running'],
    es: ['fútbol', 'baloncesto', 'tenis', 'natación', 'correr'],
    fr: ['football', 'basket', 'tennis', 'natation', 'course'],
    pt: ['futebol', 'basquete', 'tênis', 'natação', 'corrida'],
    it: ['calcio', 'basket', 'tennis', 'nuoto', 'corsa'],
  },
  entertainment: {
    en: ['music', 'movie', 'concert', 'series', 'game'],
    es: ['música', 'película', 'concierto', 'serie', 'juego'],
    fr: ['musique', 'film', 'concert', 'série', 'jeu'],
    pt: ['música', 'filme', 'show', 'série', 'jogo'],
    it: ['musica', 'film', 'concerto', 'serie', 'gioco'],
  },
  'arts and reading': {
    en: ['book', 'author', 'painting', 'poem', 'chapter'],
    es: ['libro', 'autor', 'pintura', 'poema', 'capítulo'],
    fr: ['livre', 'auteur', 'peinture', 'poème', 'chapitre'],
    pt: ['livro', 'autor', 'pintura', 'poema', 'capítulo'],
    it: ['libro', 'autore', 'dipinto', 'poesia', 'capitolo'],
  },
  'time expressions': {
    en: ['always', 'often', 'sometimes', 'rarely', 'never'],
    es: ['siempre', 'a menudo', 'a veces', 'raramente', 'nunca'],
    fr: ['toujours', 'souvent', 'parfois', 'rarement', 'jamais'],
    pt: ['sempre', 'frequentemente', 'às vezes', 'raramente', 'nunca'],
    it: ['sempre', 'spesso', 'a volte', 'raramente', 'mai'],
  },
  travel: {
    en: ['passport', 'flight', 'hotel', 'reservation', 'luggage'],
    es: ['pasaporte', 'vuelo', 'hotel', 'reserva', 'equipaje'],
    fr: ['passeport', 'vol', 'hôtel', 'réservation', 'bagage'],
    pt: ['passaporte', 'voo', 'hotel', 'reserva', 'bagagem'],
    it: ['passaporto', 'volo', 'hotel', 'prenotazione', 'bagaglio'],
  },
  weather: {
    en: ['sunny', 'rainy', 'cloudy', 'windy', 'storm'],
    es: ['soleado', 'lluvioso', 'nublado', 'ventoso', 'tormenta'],
    fr: ['ensoleillé', 'pluvieux', 'nuageux', 'venteux', 'tempête'],
    pt: ['ensolarado', 'chuvoso', 'nublado', 'ventoso', 'tempestade'],
    it: ['soleggiato', 'piovoso', 'nuvoloso', 'ventoso', 'tempesta'],
  },
  careers: {
    en: ['engineer', 'doctor', 'teacher', 'artist', 'entrepreneur'],
    es: ['ingeniero', 'médico', 'maestro', 'artista', 'emprendedor'],
    fr: ['ingénieur', 'médecin', 'professeur', 'artiste', 'entrepreneur'],
    pt: ['engenheiro', 'médico', 'professor', 'artista', 'empreendedor'],
    it: ['ingegnere', 'medico', 'insegnante', 'artista', 'imprenditore'],
  },
  'body parts': {
    en: ['head', 'hand', 'arm', 'leg', 'heart'],
    es: ['cabeza', 'mano', 'brazo', 'pierna', 'corazón'],
    fr: ['tête', 'main', 'bras', 'jambe', 'cœur'],
    pt: ['cabeça', 'mão', 'braço', 'perna', 'coração'],
    it: ['testa', 'mano', 'braccio', 'gamba', 'cuore'],
  },
  health: {
    en: ['doctor', 'medicine', 'appointment', 'pain', 'healthy'],
    es: ['doctor', 'medicina', 'cita', 'dolor', 'saludable'],
    fr: ['médecin', 'médicament', 'rendez-vous', 'douleur', 'sain'],
    pt: ['médico', 'medicamento', 'consulta', 'dor', 'saudável'],
    it: ['medico', 'medicina', 'appuntamento', 'dolore', 'sano'],
  },
  wellness: {
    en: ['exercise', 'sleep', 'hydrate', 'relax', 'balance'],
    es: ['ejercicio', 'dormir', 'hidratarse', 'relajarse', 'equilibrio'],
    fr: ['exercice', 'sommeil', "s'hydrater", 'se détendre', 'équilibre'],
    pt: ['exercício', 'dormir', 'hidratar', 'relaxar', 'equilíbrio'],
    it: ['esercizio', 'dormire', 'idratare', 'rilassarsi', 'equilibrio'],
  },
  nature: {
    en: ['forest', 'river', 'mountain', 'tree', 'flower'],
    es: ['bosque', 'río', 'montaña', 'árbol', 'flor'],
    fr: ['forêt', 'rivière', 'montagne', 'arbre', 'fleur'],
    pt: ['floresta', 'rio', 'montanha', 'árvore', 'flor'],
    it: ['foresta', 'fiume', 'montagna', 'albero', 'fiore'],
  },
  environment: {
    en: ['recycle', 'pollution', 'energy', 'climate', 'conservation'],
    es: ['reciclar', 'contaminación', 'energía', 'clima', 'conservación'],
    fr: ['recycler', 'pollution', 'énergie', 'climat', 'conservation'],
    pt: ['reciclar', 'poluição', 'energia', 'clima', 'conservação'],
    it: ['riciclare', 'inquinamento', 'energia', 'clima', 'conservazione'],
  },
  geography: {
    en: ['continent', 'country', 'city', 'coast', 'desert'],
    es: ['continente', 'país', 'ciudad', 'costa', 'desierto'],
    fr: ['continent', 'pays', 'ville', 'côte', 'désert'],
    pt: ['continente', 'país', 'cidade', 'costa', 'deserto'],
    it: ['continente', 'paese', 'città', 'costa', 'deserto'],
  },
  debate: {
    en: ['argument', 'evidence', 'counterpoint', 'rebuttal', 'stance'],
    es: ['argumento', 'evidencia', 'contrapunto', 'réplica', 'postura'],
    fr: ['argument', 'preuve', 'contrepoint', 'réfutation', 'position'],
    pt: ['argumento', 'prova', 'contraponto', 'réplica', 'posição'],
    it: ['argomento', 'prova', 'controparte', 'confutazione', 'posizione'],
  },
  'current events': {
    en: ['headline', 'election', 'policy', 'protest', 'update'],
    es: ['titular', 'elección', 'política', 'protesta', 'actualización'],
    fr: ['titre', 'élection', 'politique', 'manifestation', 'actualité'],
    pt: ['manchete', 'eleição', 'política', 'protesto', 'atualização'],
    it: ['titolo', 'elezione', 'politica', 'protesta', 'aggiornamento'],
  },
  professional: {
    en: ['meeting', 'deadline', 'proposal', 'client', 'team'],
    es: ['reunión', 'plazo', 'propuesta', 'cliente', 'equipo'],
    fr: ['réunion', 'échéance', 'proposition', 'client', 'équipe'],
    pt: ['reunião', 'prazo', 'proposta', 'cliente', 'equipe'],
    it: ['riunione', 'scadenza', 'proposta', 'cliente', 'squadra'],
  },
  literature: {
    en: ['novel', 'character', 'plot', 'metaphor', 'theme'],
    es: ['novela', 'personaje', 'trama', 'metáfora', 'tema'],
    fr: ['roman', 'personnage', 'intrigue', 'métaphore', 'thème'],
    pt: ['romance', 'personagem', 'enredo', 'metáfora', 'tema'],
    it: ['romanzo', 'personaggio', 'trama', 'metafora', 'tema'],
  },
  'visual arts': {
    en: ['canvas', 'brush', 'gallery', 'sculpture', 'exhibit'],
    es: ['lienzo', 'pincel', 'galería', 'escultura', 'exposición'],
    fr: ['toile', 'pinceau', 'galerie', 'sculpture', 'exposition'],
    pt: ['tela', 'pincel', 'galeria', 'escultura', 'exposição'],
    it: ['tela', 'pennello', 'galleria', 'scultura', 'mostra'],
  },
  cinema: {
    en: ['director', 'scene', 'script', 'actor', 'premiere'],
    es: ['director', 'escena', 'guion', 'actor', 'estreno'],
    fr: ['réalisateur', 'scène', 'scénario', 'acteur', 'première'],
    pt: ['diretor', 'cena', 'roteiro', 'ator', 'estreia'],
    it: ['regista', 'scena', 'copione', 'attore', 'prima'],
  },
  'digital communication': {
    en: ['message', 'emoji', 'video call', 'notification', 'link'],
    es: ['mensaje', 'emoji', 'videollamada', 'notificación', 'enlace'],
    fr: ['message', 'emoji', 'appel vidéo', 'notification', 'lien'],
    pt: ['mensagem', 'emoji', 'chamada de vídeo', 'notificação', 'link'],
    it: ['messaggio', 'emoji', 'videochiamata', 'notifica', 'link'],
  },
  science: {
    en: ['experiment', 'laboratory', 'hypothesis', 'data', 'discovery'],
    es: ['experimento', 'laboratorio', 'hipótesis', 'datos', 'descubrimiento'],
    fr: ['expérience', 'laboratoire', 'hypothèse', 'données', 'découverte'],
    pt: ['experimento', 'laboratório', 'hipótese', 'dados', 'descoberta'],
    it: ['esperimento', 'laboratorio', 'ipotesi', 'dati', 'scoperta'],
  },
  'digital economy': {
    en: ['startup', 'platform', 'subscription', 'analytics', 'cryptocurrency'],
    es: ['startup', 'plataforma', 'suscripción', 'analítica', 'criptomoneda'],
    fr: ['startup', 'plateforme', 'abonnement', 'analyse', 'cryptomonnaie'],
    pt: ['startup', 'plataforma', 'assinatura', 'analítica', 'criptomoeda'],
    it: ['startup', 'piattaforma', 'abbonamento', 'analitica', 'criptovaluta'],
  },
  'social justice': {
    en: ['equality', 'rights', 'inclusion', 'advocacy', 'community'],
    es: ['igualdad', 'derechos', 'inclusión', 'defensa', 'comunidad'],
    fr: ['égalité', 'droits', 'inclusion', 'plaidoyer', 'communauté'],
    pt: ['igualdade', 'direitos', 'inclusão', 'advocacia', 'comunidade'],
    it: ['uguaglianza', 'diritti', 'inclusione', 'advocacy', 'comunità'],
  },
  'global issues': {
    en: ['climate', 'migration', 'cooperation', 'sustainability', 'development'],
    es: ['clima', 'migración', 'cooperación', 'sostenibilidad', 'desarrollo'],
    fr: ['climat', 'migration', 'coopération', 'durabilité', 'développement'],
    pt: ['clima', 'migração', 'cooperação', 'sustentabilidade', 'desenvolvimento'],
    it: ['clima', 'migrazione', 'cooperazione', 'sostenibilità', 'sviluppo'],
  },
};

function normalizeTopicKey(topic = '') {
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
export function getNextLesson(units, userProgress, activeNsec = null) {
  // Special admin key - first incomplete lesson is available
  const hasAdminKey = activeNsec === 'nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv';

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const lessonProgress = userProgress.lessons?.[lesson.id];
      if (!lessonProgress || lessonProgress.status !== SKILL_STATUS.COMPLETED) {
        if (hasAdminKey || userProgress.totalXp >= lesson.xpRequired) {
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
