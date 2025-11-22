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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Cómo se dice "hello" en español?',
                    options: [
                      { id: '1', label: 'Adiós', correct: false },
                      { id: '2', label: 'Hola', correct: true },
                      { id: '3', label: 'Gracias', correct: false },
                      { id: '4', label: 'Por favor', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué saludo usas en la mañana?',
                    options: [
                      { id: '1', label: 'Buenas noches', correct: false },
                      { id: '2', label: 'Buenas tardes', correct: false },
                      { id: '3', label: 'Buenos días', correct: true },
                      { id: '4', label: 'Adiós', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "goodbye"?',
                    answer: { acceptable: ['adiós', 'adios'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cómo te presentas en español?',
                    options: [
                      { id: '1', label: 'Me llamo...', correct: true },
                      { id: '2', label: '¿Cómo estás?', correct: false },
                      { id: '3', label: 'Hasta luego', correct: false },
                      { id: '4', label: '¿Qué hora es?', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona todos los saludos correctos:',
                    options: [
                      { id: '1', label: 'Hola', correct: true },
                      { id: '2', label: 'Zapato', correct: false },
                      { id: '3', label: 'Buenos días', correct: true },
                      { id: '4', label: 'Buenas tardes', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué pregunta significa "how?"',
                    options: [
                      { id: '1', label: '¿Qué?', correct: false },
                      { id: '2', label: '¿Dónde?', correct: false },
                      { id: '3', label: '¿Cómo?', correct: true },
                      { id: '4', label: '¿Cuándo?', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué pregunta usas para "where?"',
                    answer: { acceptable: ['¿dónde?', '¿donde?', 'dónde', 'donde'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "¿Por qué?"',
                    options: [
                      { id: '1', label: 'What?', correct: false },
                      { id: '2', label: 'When?', correct: false },
                      { id: '3', label: 'Why?', correct: true },
                      { id: '4', label: 'How?', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras interrogativas:',
                    options: [
                      { id: '1', label: '¿Qué?', correct: true },
                      { id: '2', label: 'Hola', correct: false },
                      { id: '3', label: '¿Cuándo?', correct: true },
                      { id: '4', label: 'Adiós', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el saludo correcto para la noche?',
                    options: [
                      { id: '1', label: 'Buenos días', correct: false },
                      { id: '2', label: 'Buenas tardes', correct: false },
                      { id: '3', label: 'Buenas noches', correct: true },
                      { id: '4', label: 'Hasta mañana', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Cómo se dice "I like" en español?',
                    options: [
                      { id: '1', label: 'No me gusta', correct: false },
                      { id: '2', label: 'Me gusta', correct: true },
                      { id: '3', label: 'Odio', correct: false },
                      { id: '4', label: 'Prefiero', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "me encanta"?',
                    options: [
                      { id: '1', label: 'I hate', correct: false },
                      { id: '2', label: 'I like', correct: false },
                      { id: '3', label: 'I love', correct: true },
                      { id: '4', label: 'I prefer', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué número es "five"?',
                    answer: { acceptable: ['cinco'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el número "10" en español?',
                    options: [
                      { id: '1', label: 'Cinco', correct: false },
                      { id: '2', label: 'Diez', correct: true },
                      { id: '3', label: 'Veinte', correct: false },
                      { id: '4', label: 'Quince', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las comidas y bebidas:',
                    options: [
                      { id: '1', label: 'Agua', correct: true },
                      { id: '2', label: 'Madre', correct: false },
                      { id: '3', label: 'Pan', correct: true },
                      { id: '4', label: 'Café', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "chicken" en español?',
                    answer: { acceptable: ['pollo'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué bebida es "coffee"?',
                    options: [
                      { id: '1', label: 'Agua', correct: false },
                      { id: '2', label: 'Café', correct: true },
                      { id: '3', label: 'Leche', correct: false },
                      { id: '4', label: 'Pan', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones de preferencia:',
                    options: [
                      { id: '1', label: 'Me gusta', correct: true },
                      { id: '2', label: 'Hola', correct: false },
                      { id: '3', label: 'Prefiero', correct: true },
                      { id: '4', label: 'Odio', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es "rice" en español?',
                    options: [
                      { id: '1', label: 'Pan', correct: false },
                      { id: '2', label: 'Arroz', correct: true },
                      { id: '3', label: 'Pollo', correct: false },
                      { id: '4', label: 'Fruta', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué número es "twenty"?',
                    options: [
                      { id: '1', label: 'Dos', correct: false },
                      { id: '2', label: 'Diez', correct: false },
                      { id: '3', label: 'Doce', correct: false },
                      { id: '4', label: 'Veinte', correct: true },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "hora"?',
                    options: [
                      { id: '1', label: 'Minute', correct: false },
                      { id: '2', label: 'Hour', correct: true },
                      { id: '3', label: 'Day', correct: false },
                      { id: '4', label: 'Night', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "morning" en español?',
                    answer: { acceptable: ['mañana'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to wake up"?',
                    options: [
                      { id: '1', label: 'Trabajar', correct: false },
                      { id: '2', label: 'Desayunar', correct: false },
                      { id: '3', label: 'Despertarse', correct: true },
                      { id: '4', label: 'Ducharse', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los verbos reflexivos de la rutina diaria:',
                    options: [
                      { id: '1', label: 'Levantarse', correct: true },
                      { id: '2', label: 'Madre', correct: false },
                      { id: '3', label: 'Ducharse', correct: true },
                      { id: '4', label: 'Desayunar', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "mother" en español?',
                    answer: { acceptable: ['madre', 'mamá', 'mama'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "hermano"?',
                    options: [
                      { id: '1', label: 'Father', correct: false },
                      { id: '2', label: 'Sister', correct: false },
                      { id: '3', label: 'Brother', correct: true },
                      { id: '4', label: 'Mother', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los miembros de la familia:',
                    options: [
                      { id: '1', label: 'Padre', correct: true },
                      { id: '2', label: 'Trabajar', correct: false },
                      { id: '3', label: 'Hermana', correct: true },
                      { id: '4', label: 'Familia', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué actividad es "desayunar"?',
                    options: [
                      { id: '1', label: 'To work', correct: false },
                      { id: '2', label: 'To have breakfast', correct: true },
                      { id: '3', label: 'To shower', correct: false },
                      { id: '4', label: 'To get up', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "night"?',
                    answer: { acceptable: ['noche'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el momento del día "tarde"?',
                    options: [
                      { id: '1', label: 'Morning', correct: false },
                      { id: '2', label: 'Afternoon', correct: true },
                      { id: '3', label: 'Night', correct: false },
                      { id: '4', label: 'Midnight', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Dónde guardas dinero?',
                    options: [
                      { id: '1', label: 'Supermercado', correct: false },
                      { id: '2', label: 'Banco', correct: true },
                      { id: '3', label: 'Parque', correct: false },
                      { id: '4', label: 'Hospital', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "school" en español?',
                    answer: { acceptable: ['escuela'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los lugares de la ciudad:',
                    options: [
                      { id: '1', label: 'Hospital', correct: true },
                      { id: '2', label: 'Derecha', correct: false },
                      { id: '3', label: 'Parque', correct: true },
                      { id: '4', label: 'Supermercado', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "derecha"?',
                    options: [
                      { id: '1', label: 'Left', correct: false },
                      { id: '2', label: 'Right', correct: true },
                      { id: '3', label: 'Straight', correct: false },
                      { id: '4', label: 'Near', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué dirección es lo opuesto de "derecha"?',
                    answer: { acceptable: ['izquierda'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cómo se dice "far" en español?',
                    options: [
                      { id: '1', label: 'Cerca', correct: false },
                      { id: '2', label: 'Recto', correct: false },
                      { id: '3', label: 'Lejos', correct: true },
                      { id: '4', label: 'Derecha', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los medios de transporte:',
                    options: [
                      { id: '1', label: 'Autobús', correct: true },
                      { id: '2', label: 'Banco', correct: false },
                      { id: '3', label: 'Metro', correct: true },
                      { id: '4', label: 'Bicicleta', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué transporte va bajo tierra?',
                    options: [
                      { id: '1', label: 'Autobús', correct: false },
                      { id: '2', label: 'Metro', correct: true },
                      { id: '3', label: 'Bicicleta', correct: false },
                      { id: '4', label: 'Taxi', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué verbo significa "to walk"?',
                    answer: { acceptable: ['caminar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "recto"?',
                    options: [
                      { id: '1', label: 'Left', correct: false },
                      { id: '2', label: 'Right', correct: false },
                      { id: '3', label: 'Straight', correct: true },
                      { id: '4', label: 'Far', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to buy"?',
                    options: [
                      { id: '1', label: 'Vender', correct: false },
                      { id: '2', label: 'Comprar', correct: true },
                      { id: '3', label: 'Llevar', correct: false },
                      { id: '4', label: 'Precio', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "expensive" en español?',
                    answer: { acceptable: ['caro'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "barato"?',
                    options: [
                      { id: '1', label: 'Expensive', correct: false },
                      { id: '2', label: 'Cheap', correct: true },
                      { id: '3', label: 'Price', correct: false },
                      { id: '4', label: 'To sell', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué número es "thirty"?',
                    answer: { acceptable: ['treinta'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el número "50" en español?',
                    options: [
                      { id: '1', label: 'Treinta', correct: false },
                      { id: '2', label: 'Cuarenta', correct: false },
                      { id: '3', label: 'Cincuenta', correct: true },
                      { id: '4', label: 'Cien', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las prendas de ropa:',
                    options: [
                      { id: '1', label: 'Camisa', correct: true },
                      { id: '2', label: 'Precio', correct: false },
                      { id: '3', label: 'Zapatos', correct: true },
                      { id: '4', label: 'Vestido', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "shirt" en español?',
                    answer: { acceptable: ['camisa'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué prenda son "shoes"?',
                    options: [
                      { id: '1', label: 'Camisa', correct: false },
                      { id: '2', label: 'Pantalón', correct: false },
                      { id: '3', label: 'Zapatos', correct: true },
                      { id: '4', label: 'Vestido', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "llevar"?',
                    options: [
                      { id: '1', label: 'To buy', correct: false },
                      { id: '2', label: 'To sell', correct: false },
                      { id: '3', label: 'To wear/carry', correct: true },
                      { id: '4', label: 'To price', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es "100" en español?',
                    options: [
                      { id: '1', label: 'Cincuenta', correct: false },
                      { id: '2', label: 'Noventa', correct: false },
                      { id: '3', label: 'Cien', correct: true },
                      { id: '4', label: 'Mil', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿De qué color es el cielo?',
                    options: [
                      { id: '1', label: 'Rojo', correct: false },
                      { id: '2', label: 'Azul', correct: true },
                      { id: '3', label: 'Verde', correct: false },
                      { id: '4', label: 'Amarillo', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "red" en español?',
                    answer: { acceptable: ['rojo'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los colores:',
                    options: [
                      { id: '1', label: 'Negro', correct: true },
                      { id: '2', label: 'Alto', correct: false },
                      { id: '3', label: 'Blanco', correct: true },
                      { id: '4', label: 'Verde', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "alto"?',
                    options: [
                      { id: '1', label: 'Short', correct: false },
                      { id: '2', label: 'Tall', correct: true },
                      { id: '3', label: 'Thin', correct: false },
                      { id: '4', label: 'Strong', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cuál es lo opuesto de "alto"?',
                    answer: { acceptable: ['bajo'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las descripciones físicas:',
                    options: [
                      { id: '1', label: 'Delgado', correct: true },
                      { id: '2', label: 'Simpático', correct: false },
                      { id: '3', label: 'Fuerte', correct: true },
                      { id: '4', label: 'Pelo', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "simpático"?',
                    options: [
                      { id: '1', label: 'Serious', correct: false },
                      { id: '2', label: 'Nice/friendly', correct: true },
                      { id: '3', label: 'Intelligent', correct: false },
                      { id: '4', label: 'Funny', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "intelligent" en español?',
                    answer: { acceptable: ['inteligente'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los rasgos de personalidad:',
                    options: [
                      { id: '1', label: 'Amable', correct: true },
                      { id: '2', label: 'Ojos', correct: false },
                      { id: '3', label: 'Divertido', correct: true },
                      { id: '4', label: 'Serio', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué parte del cuerpo es "hair"?',
                    options: [
                      { id: '1', label: 'Ojos', correct: false },
                      { id: '2', label: 'Pelo', correct: true },
                      { id: '3', label: 'Nariz', correct: false },
                      { id: '4', label: 'Boca', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el deporte más popular en América Latina?',
                    options: [
                      { id: '1', label: 'Béisbol', correct: false },
                      { id: '2', label: 'Fútbol', correct: true },
                      { id: '3', label: 'Baloncesto', correct: false },
                      { id: '4', label: 'Tenis', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "to swim" en español?',
                    answer: { acceptable: ['nadar'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las actividades deportivas:',
                    options: [
                      { id: '1', label: 'Correr', correct: true },
                      { id: '2', label: 'Canción', correct: false },
                      { id: '3', label: 'Jugar', correct: true },
                      { id: '4', label: 'Practicar', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "música"?',
                    options: [
                      { id: '1', label: 'Song', correct: false },
                      { id: '2', label: 'Music', correct: true },
                      { id: '3', label: 'Movie', correct: false },
                      { id: '4', label: 'Concert', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "movie" en español?',
                    answer: { acceptable: ['película'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las actividades artísticas:',
                    options: [
                      { id: '1', label: 'Dibujar', correct: true },
                      { id: '2', label: 'Nadar', correct: false },
                      { id: '3', label: 'Pintar', correct: true },
                      { id: '4', label: 'Escribir', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to dance"?',
                    options: [
                      { id: '1', label: 'Bailar', correct: true },
                      { id: '2', label: 'Cantar', correct: false },
                      { id: '3', label: 'Correr', correct: false },
                      { id: '4', label: 'Leer', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "book" en español?',
                    answer: { acceptable: ['libro'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué actividad es "leer"?',
                    options: [
                      { id: '1', label: 'To write', correct: false },
                      { id: '2', label: 'To read', correct: true },
                      { id: '3', label: 'To paint', correct: false },
                      { id: '4', label: 'To draw', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las actividades de entretenimiento:',
                    options: [
                      { id: '1', label: 'Concierto', correct: true },
                      { id: '2', label: 'Correr', correct: false },
                      { id: '3', label: 'Canción', correct: true },
                      { id: '4', label: 'Película', correct: true },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "ayer"?',
                    options: [
                      { id: '1', label: 'Today', correct: false },
                      { id: '2', label: 'Yesterday', correct: true },
                      { id: '3', label: 'Tomorrow', correct: false },
                      { id: '4', label: 'Last week', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "last night" en español?',
                    answer: { acceptable: ['anoche'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to travel"?',
                    options: [
                      { id: '1', label: 'Visitar', correct: false },
                      { id: '2', label: 'Viajar', correct: true },
                      { id: '3', label: 'Conocer', correct: false },
                      { id: '4', label: 'Descubrir', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones de tiempo pasado:',
                    options: [
                      { id: '1', label: 'Ayer', correct: true },
                      { id: '2', label: 'Mañana', correct: false },
                      { id: '3', label: 'Anoche', correct: true },
                      { id: '4', label: 'La semana pasada', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué verbo significa "to visit"?',
                    answer: { acceptable: ['visitar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "conocer"?',
                    options: [
                      { id: '1', label: 'To travel', correct: false },
                      { id: '2', label: 'To visit', correct: false },
                      { id: '3', label: 'To know/meet', correct: true },
                      { id: '4', label: 'To discover', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los verbos de viaje:',
                    options: [
                      { id: '1', label: 'Viajar', correct: true },
                      { id: '2', label: 'Ayer', correct: false },
                      { id: '3', label: 'Descubrir', correct: true },
                      { id: '4', label: 'Visitar', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to discover"?',
                    options: [
                      { id: '1', label: 'Viajar', correct: false },
                      { id: '2', label: 'Descubrir', correct: true },
                      { id: '3', label: 'Visitar', correct: false },
                      { id: '4', label: 'Conocer', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "last week"?',
                    answer: { acceptable: ['la semana pasada'] },
                  },
                  {
                    type: 'mcq',
                    stem: 'El pretérito se usa para acciones...',
                    options: [
                      { id: '1', label: 'Habituales en el pasado', correct: false },
                      { id: '2', label: 'Completadas en el pasado', correct: true },
                      { id: '3', label: 'En el futuro', correct: false },
                      { id: '4', label: 'En el presente', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "llover"?',
                    options: [
                      { id: '1', label: 'To snow', correct: false },
                      { id: '2', label: 'To rain', correct: true },
                      { id: '3', label: 'To be hot', correct: false },
                      { id: '4', label: 'To be cold', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "to snow" en español?',
                    answer: { acceptable: ['nevar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué expresión significa "to be hot" (weather)?',
                    options: [
                      { id: '1', label: 'Hacer frío', correct: false },
                      { id: '2', label: 'Hacer calor', correct: true },
                      { id: '3', label: 'Llover', correct: false },
                      { id: '4', label: 'Nevar', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones de clima:',
                    options: [
                      { id: '1', label: 'Hacer frío', correct: true },
                      { id: '2', label: 'Viajar', correct: false },
                      { id: '3', label: 'Llover', correct: true },
                      { id: '4', label: 'Hacer calor', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cuál es una estación del año que empieza con "p"?',
                    answer: { acceptable: ['primavera'] },
                  },
                  {
                    type: 'mcq',
                    stem: 'El imperfecto se usa para acciones...',
                    options: [
                      { id: '1', label: 'Completadas en el pasado', correct: false },
                      { id: '2', label: 'Habituales en el pasado', correct: true },
                      { id: '3', label: 'En el futuro', correct: false },
                      { id: '4', label: 'En el presente', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué tiempo verbal describes "what you used to do"?',
                    options: [
                      { id: '1', label: 'Pretérito', correct: false },
                      { id: '2', label: 'Imperfecto', correct: true },
                      { id: '3', label: 'Presente', correct: false },
                      { id: '4', label: 'Futuro', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones de clima con "hacer":',
                    options: [
                      { id: '1', label: 'Hacer calor', correct: true },
                      { id: '2', label: 'Llover', correct: false },
                      { id: '3', label: 'Hacer frío', correct: true },
                      { id: '4', label: 'Nevar', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuándo nieva?',
                    options: [
                      { id: '1', label: 'En verano', correct: false },
                      { id: '2', label: 'En invierno', correct: true },
                      { id: '3', label: 'En primavera', correct: false },
                      { id: '4', label: 'Nunca', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué estación es "spring"?',
                    options: [
                      { id: '1', label: 'Verano', correct: false },
                      { id: '2', label: 'Otoño', correct: false },
                      { id: '3', label: 'Primavera', correct: true },
                      { id: '4', label: 'Invierno', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "carrera"?',
                    options: [
                      { id: '1', label: 'Job', correct: false },
                      { id: '2', label: 'Career', correct: true },
                      { id: '3', label: 'Goal', correct: false },
                      { id: '4', label: 'Future', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "job/work" en español?',
                    answer: { acceptable: ['trabajo'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "meta"?',
                    options: [
                      { id: '1', label: 'Career', correct: false },
                      { id: '2', label: 'Work', correct: false },
                      { id: '3', label: 'Goal', correct: true },
                      { id: '4', label: 'Aspiration', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras relacionadas con el futuro y las carreras:',
                    options: [
                      { id: '1', label: 'Aspiración', correct: true },
                      { id: '2', label: 'Ayer', correct: false },
                      { id: '3', label: 'Futuro', correct: true },
                      { id: '4', label: 'Meta', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "future" en español?',
                    answer: { acceptable: ['futuro'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué estructura usas para expresar el futuro próximo?',
                    options: [
                      { id: '1', label: 'Pretérito', correct: false },
                      { id: '2', label: 'Ir + a + infinitivo', correct: true },
                      { id: '3', label: 'Imperfecto', correct: false },
                      { id: '4', label: 'Presente perfecto', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál es el tiempo verbal para planes futuros?',
                    options: [
                      { id: '1', label: 'Pasado', correct: false },
                      { id: '2', label: 'Presente', correct: false },
                      { id: '3', label: 'Futuro', correct: true },
                      { id: '4', label: 'Condicional', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones correctas sobre el futuro:',
                    options: [
                      { id: '1', label: 'Voy a estudiar', correct: true },
                      { id: '2', label: 'Estudié ayer', correct: false },
                      { id: '3', label: 'Trabajaré mañana', correct: true },
                      { id: '4', label: 'Tengo una meta', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué palabra significa "aspiration"?',
                    options: [
                      { id: '1', label: 'Trabajo', correct: false },
                      { id: '2', label: 'Aspiración', correct: true },
                      { id: '3', label: 'Meta', correct: false },
                      { id: '4', label: 'Carrera', correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: 'Para hablar de "what I am going to do", uso...',
                    options: [
                      { id: '1', label: 'Voy a + infinitivo', correct: true },
                      { id: '2', label: 'Fui a + infinitivo', correct: false },
                      { id: '3', label: 'Iba a + infinitivo', correct: false },
                      { id: '4', label: 'He ido a + infinitivo', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué parte del cuerpo es "head"?',
                    options: [
                      { id: '1', label: 'Brazo', correct: false },
                      { id: '2', label: 'Cabeza', correct: true },
                      { id: '3', label: 'Pierna', correct: false },
                      { id: '4', label: 'Mano', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "arm" en español?',
                    answer: { acceptable: ['brazo'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las partes del cuerpo:',
                    options: [
                      { id: '1', label: 'Pierna', correct: true },
                      { id: '2', label: 'Dolor', correct: false },
                      { id: '3', label: 'Mano', correct: true },
                      { id: '4', label: 'Ojo', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué significa "pain"?',
                    answer: { acceptable: ['dolor'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "médico"?',
                    options: [
                      { id: '1', label: 'Medicine', correct: false },
                      { id: '2', label: 'Doctor', correct: true },
                      { id: '3', label: 'Illness', correct: false },
                      { id: '4', label: 'Fever', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras relacionadas con la salud:',
                    options: [
                      { id: '1', label: 'Enfermedad', correct: true },
                      { id: '2', label: 'Libro', correct: false },
                      { id: '3', label: 'Medicina', correct: true },
                      { id: '4', label: 'Fiebre', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "exercise" en español?',
                    answer: { acceptable: ['ejercicio'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "saludable"?',
                    options: [
                      { id: '1', label: 'Sick', correct: false },
                      { id: '2', label: 'Healthy', correct: true },
                      { id: '3', label: 'Medicine', correct: false },
                      { id: '4', label: 'Diet', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las actividades de bienestar:',
                    options: [
                      { id: '1', label: 'Ejercicio', correct: true },
                      { id: '2', label: 'Enfermedad', correct: false },
                      { id: '3', label: 'Descansar', correct: true },
                      { id: '4', label: 'Dieta', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué parte del cuerpo es "foot"?',
                    options: [
                      { id: '1', label: 'Mano', correct: false },
                      { id: '2', label: 'Brazo', correct: false },
                      { id: '3', label: 'Pie', correct: true },
                      { id: '4', label: 'Pierna', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué animal doméstico es "dog"?',
                    options: [
                      { id: '1', label: 'Gato', correct: false },
                      { id: '2', label: 'Perro', correct: true },
                      { id: '3', label: 'Pájaro', correct: false },
                      { id: '4', label: 'Pez', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "tree" en español?',
                    answer: { acceptable: ['árbol', 'arbol'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona elementos de la naturaleza:',
                    options: [
                      { id: '1', label: 'Flor', correct: true },
                      { id: '2', label: 'Médico', correct: false },
                      { id: '3', label: 'Bosque', correct: true },
                      { id: '4', label: 'Árbol', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "pollution"?',
                    answer: { acceptable: ['contaminación', 'contaminacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to recycle"?',
                    options: [
                      { id: '1', label: 'Contaminar', correct: false },
                      { id: '2', label: 'Reciclar', correct: true },
                      { id: '3', label: 'Proteger', correct: false },
                      { id: '4', label: 'Destruir', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las formaciones geográficas:',
                    options: [
                      { id: '1', label: 'Montaña', correct: true },
                      { id: '2', label: 'Animal', correct: false },
                      { id: '3', label: 'Río', correct: true },
                      { id: '4', label: 'Valle', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "sea/ocean" en español?',
                    answer: { acceptable: ['mar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "playa"?',
                    options: [
                      { id: '1', label: 'Mountain', correct: false },
                      { id: '2', label: 'Beach', correct: true },
                      { id: '3', label: 'River', correct: false },
                      { id: '4', label: 'Desert', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras ambientales:',
                    options: [
                      { id: '1', label: 'Proteger', correct: true },
                      { id: '2', label: 'Bailar', correct: false },
                      { id: '3', label: 'Naturaleza', correct: true },
                      { id: '4', label: 'Clima', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué formación geográfica es "desert"?',
                    options: [
                      { id: '1', label: 'Bosque', correct: false },
                      { id: '2', label: 'Mar', correct: false },
                      { id: '3', label: 'Desierto', correct: true },
                      { id: '4', label: 'Valle', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to want/wish"?',
                    options: [
                      { id: '1', label: 'Esperar', correct: false },
                      { id: '2', label: 'Querer', correct: true },
                      { id: '3', label: 'Dudar', correct: false },
                      { id: '4', label: 'Temer', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "to hope" en español?',
                    answer: { acceptable: ['esperar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "dudar"?',
                    options: [
                      { id: '1', label: 'To hope', correct: false },
                      { id: '2', label: 'To want', correct: false },
                      { id: '3', label: 'To doubt', correct: true },
                      { id: '4', label: 'To deny', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los verbos que requieren subjuntivo:',
                    options: [
                      { id: '1', label: 'Querer', correct: true },
                      { id: '2', label: 'Saber', correct: false },
                      { id: '3', label: 'Esperar', correct: true },
                      { id: '4', label: 'Desear', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué verbo significa "to deny"?',
                    answer: { acceptable: ['negar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "temer"?',
                    options: [
                      { id: '1', label: 'To want', correct: false },
                      { id: '2', label: 'To fear', correct: true },
                      { id: '3', label: 'To hope', correct: false },
                      { id: '4', label: 'To doubt', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las expresiones de emoción:',
                    options: [
                      { id: '1', label: 'Alegrarse', correct: true },
                      { id: '2', label: 'Trabajar', correct: false },
                      { id: '3', label: 'Temer', correct: true },
                      { id: '4', label: 'Desear', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: 'El subjuntivo se usa después de expresiones de...',
                    options: [
                      { id: '1', label: 'Certeza', correct: false },
                      { id: '2', label: 'Deseo y duda', correct: true },
                      { id: '3', label: 'Hechos', correct: false },
                      { id: '4', label: 'Verdad', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué verbo significa "to desire/wish"?',
                    answer: { acceptable: ['desear'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Cuál frase requiere subjuntivo?',
                    options: [
                      { id: '1', label: 'Yo sé que...', correct: false },
                      { id: '2', label: 'Es cierto que...', correct: false },
                      { id: '3', label: 'Espero que...', correct: true },
                      { id: '4', label: 'Creo que...', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to argue/make an argument"?',
                    options: [
                      { id: '1', label: 'Convencer', correct: false },
                      { id: '2', label: 'Argumentar', correct: true },
                      { id: '3', label: 'Persuadir', correct: false },
                      { id: '4', label: 'Negociar', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "to convince" en español?',
                    answer: { acceptable: ['convencer'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las actividades de debate:',
                    options: [
                      { id: '1', label: 'Debatir', correct: true },
                      { id: '2', label: 'Dormir', correct: false },
                      { id: '3', label: 'Argumentar', correct: true },
                      { id: '4', label: 'Persuadir', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "news"?',
                    answer: { acceptable: ['noticia', 'noticias'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "actualidad"?',
                    options: [
                      { id: '1', label: 'Past', correct: false },
                      { id: '2', label: 'Current events', correct: true },
                      { id: '3', label: 'Future', correct: false },
                      { id: '4', label: 'Politics', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras profesionales:',
                    options: [
                      { id: '1', label: 'Reunión', correct: true },
                      { id: '2', label: 'Bailar', correct: false },
                      { id: '3', label: 'Presentación', correct: true },
                      { id: '4', label: 'Informe', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "to negotiate" en español?',
                    answer: { acceptable: ['negociar'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué es una "reunión"?',
                    options: [
                      { id: '1', label: 'A meeting', correct: true },
                      { id: '2', label: 'A report', correct: false },
                      { id: '3', label: 'A presentation', correct: false },
                      { id: '4', label: 'An event', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras relacionadas con noticias:',
                    options: [
                      { id: '1', label: 'Noticia', correct: true },
                      { id: '2', label: 'Reunión', correct: false },
                      { id: '3', label: 'Evento', correct: true },
                      { id: '4', label: 'Política', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué actividad es "presentación"?',
                    options: [
                      { id: '1', label: 'Meeting', correct: false },
                      { id: '2', label: 'Presentation', correct: true },
                      { id: '3', label: 'Report', correct: false },
                      { id: '4', label: 'Negotiation', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué es un "poeta"?',
                    options: [
                      { id: '1', label: 'A painter', correct: false },
                      { id: '2', label: 'A poet', correct: true },
                      { id: '3', label: 'An actor', correct: false },
                      { id: '4', label: 'A sculptor', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "painting" (el arte) en español?',
                    answer: { acceptable: ['pintura'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras literarias:',
                    options: [
                      { id: '1', label: 'Verso', correct: true },
                      { id: '2', label: 'Pintura', correct: false },
                      { id: '3', label: 'Metáfora', correct: true },
                      { id: '4', label: 'Narrativa', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "artist"?',
                    answer: { acceptable: ['artista'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué es una "galería"?',
                    options: [
                      { id: '1', label: 'A poem', correct: false },
                      { id: '2', label: 'An art gallery', correct: true },
                      { id: '3', label: 'A movie', correct: false },
                      { id: '4', label: 'A book', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras relacionadas con el cine:',
                    options: [
                      { id: '1', label: 'Director', correct: true },
                      { id: '2', label: 'Poeta', correct: false },
                      { id: '3', label: 'Actor', correct: true },
                      { id: '4', label: 'Película', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "sculpture" en español?',
                    answer: { acceptable: ['escultura'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué es un "guion"?',
                    options: [
                      { id: '1', label: 'A painting', correct: false },
                      { id: '2', label: 'A sculpture', correct: false },
                      { id: '3', label: 'A script', correct: true },
                      { id: '4', label: 'A gallery', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las artes visuales:',
                    options: [
                      { id: '1', label: 'Pintura', correct: true },
                      { id: '2', label: 'Verso', correct: false },
                      { id: '3', label: 'Escultura', correct: true },
                      { id: '4', label: 'Obra', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "escena"?',
                    options: [
                      { id: '1', label: 'Style', correct: false },
                      { id: '2', label: 'Scene', correct: true },
                      { id: '3', label: 'Verse', correct: false },
                      { id: '4', label: 'Metaphor', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué es "internet"?',
                    options: [
                      { id: '1', label: 'A message', correct: false },
                      { id: '2', label: 'The internet', correct: true },
                      { id: '3', label: 'An app', correct: false },
                      { id: '4', label: 'A platform', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "message" en español?',
                    answer: { acceptable: ['mensaje'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras de comunicación digital:',
                    options: [
                      { id: '1', label: 'Correo', correct: true },
                      { id: '2', label: 'Árbol', correct: false },
                      { id: '3', label: 'Aplicación', correct: true },
                      { id: '4', label: 'Red social', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "research"?',
                    answer: { acceptable: ['investigación', 'investigacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "descubrimiento"?',
                    options: [
                      { id: '1', label: 'Technology', correct: false },
                      { id: '2', label: 'Discovery', correct: true },
                      { id: '3', label: 'Innovation', correct: false },
                      { id: '4', label: 'Research', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras científicas y tecnológicas:',
                    options: [
                      { id: '1', label: 'Tecnología', correct: true },
                      { id: '2', label: 'Bailar', correct: false },
                      { id: '3', label: 'Innovar', correct: true },
                      { id: '4', label: 'Investigación', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "entrepreneur" en español?',
                    answer: { acceptable: ['emprendedor'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué es una "startup"?',
                    options: [
                      { id: '1', label: 'An old company', correct: false },
                      { id: '2', label: 'A startup company', correct: true },
                      { id: '3', label: 'A platform', correct: false },
                      { id: '4', label: 'A discovery', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras de economía digital:',
                    options: [
                      { id: '1', label: 'Digital', correct: true },
                      { id: '2', label: 'Cabeza', correct: false },
                      { id: '3', label: 'Comercio', correct: true },
                      { id: '4', label: 'Plataforma', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué verbo significa "to innovate"?',
                    options: [
                      { id: '1', label: 'Investigar', correct: false },
                      { id: '2', label: 'Descubrir', correct: false },
                      { id: '3', label: 'Innovar', correct: true },
                      { id: '4', label: 'Comerciar', correct: false },
                    ],
                  },
                ],
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
            modes: ['quiz'],
            content: {
              quiz: {
                questions: [
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "justicia"?',
                    options: [
                      { id: '1', label: 'Equality', correct: false },
                      { id: '2', label: 'Justice', correct: true },
                      { id: '3', label: 'Rights', correct: false },
                      { id: '4', label: 'Diversity', correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "equality" en español?',
                    answer: { acceptable: ['igualdad'] },
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras de justicia social:',
                    options: [
                      { id: '1', label: 'Derechos', correct: true },
                      { id: '2', label: 'Internet', correct: false },
                      { id: '3', label: 'Diversidad', correct: true },
                      { id: '4', label: 'Inclusión', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Qué palabra significa "rights"?',
                    answer: { acceptable: ['derechos'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué significa "crisis"?',
                    options: [
                      { id: '1', label: 'Solution', correct: false },
                      { id: '2', label: 'Crisis', correct: true },
                      { id: '3', label: 'Cooperation', correct: false },
                      { id: '4', label: 'Sustainability', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona las palabras sobre desafíos globales:',
                    options: [
                      { id: '1', label: 'Global', correct: true },
                      { id: '2', label: 'Bailar', correct: false },
                      { id: '3', label: 'Crisis', correct: true },
                      { id: '4', label: 'Solución', correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: '¿Cómo se dice "cooperation" en español?',
                    answer: { acceptable: ['cooperación', 'cooperacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué es "sostenibilidad"?',
                    options: [
                      { id: '1', label: 'Justice', correct: false },
                      { id: '2', label: 'Sustainability', correct: true },
                      { id: '3', label: 'Diversity', correct: false },
                      { id: '4', label: 'Crisis', correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: 'Selecciona los conceptos éticos y sociales:',
                    options: [
                      { id: '1', label: 'Justicia', correct: true },
                      { id: '2', label: 'Computadora', correct: false },
                      { id: '3', label: 'Igualdad', correct: true },
                      { id: '4', label: 'Inclusión', correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: '¿Qué necesitamos para resolver problemas globales?',
                    options: [
                      { id: '1', label: 'División', correct: false },
                      { id: '2', label: 'Cooperación', correct: true },
                      { id: '3', label: 'Crisis', correct: false },
                      { id: '4', label: 'Conflicto', correct: false },
                    ],
                  },
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
