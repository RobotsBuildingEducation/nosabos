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
                    stem: {
                      es: '¿Cómo se dice "hello" en español?',
                      en: 'How do you say "hello" in Spanish?',
                      pt: 'Como se diz "hello" em espanhol?',
                      fr: 'Comment dit-on "hello" en espagnol?',
                      it: 'Come si dice "hello" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Adiós', en: 'Adiós', pt: 'Adiós', fr: 'Adiós', it: 'Adiós' }, correct: false },
                      { id: '2', label: { es: 'Hola', en: 'Hola', pt: 'Hola', fr: 'Hola', it: 'Hola' }, correct: true },
                      { id: '3', label: { es: 'Gracias', en: 'Gracias', pt: 'Gracias', fr: 'Gracias', it: 'Gracias' }, correct: false },
                      { id: '4', label: { es: 'Por favor', en: 'Por favor', pt: 'Por favor', fr: 'Por favor', it: 'Por favor' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué saludo usas en la mañana?',
                      en: 'What greeting do you use in the morning?',
                      pt: 'Que saudação você usa de manhã?',
                      fr: 'Quelle salutation utilisez-vous le matin?',
                      it: 'Che saluto usi al mattino?',
                    },
                    options: [
                      { id: '1', label: { es: 'Buenas noches', en: 'Buenas noches', pt: 'Buenas noches', fr: 'Buenas noches', it: 'Buenas noches' }, correct: false },
                      { id: '2', label: { es: 'Buenas tardes', en: 'Buenas tardes', pt: 'Buenas tardes', fr: 'Buenas tardes', it: 'Buenas tardes' }, correct: false },
                      { id: '3', label: { es: 'Buenos días', en: 'Buenos días', pt: 'Buenos días', fr: 'Buenos días', it: 'Buenos días' }, correct: true },
                      { id: '4', label: { es: 'Adiós', en: 'Adiós', pt: 'Adiós', fr: 'Adiós', it: 'Adiós' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "goodbye"?',
                      en: 'What word means "goodbye"?',
                      pt: 'Que palavra significa "goodbye"?',
                      fr: 'Quel mot signifie "goodbye"?',
                      it: 'Quale parola significa "goodbye"?',
                    },
                    answer: { acceptable: ['adiós', 'adios'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cómo te presentas en español?',
                      en: 'How do you introduce yourself in Spanish?',
                      pt: 'Como você se apresenta em espanhol?',
                      fr: 'Comment vous présentez-vous en espagnol?',
                      it: 'Come ti presenti in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Me llamo...', en: 'Me llamo...', pt: 'Me llamo...', fr: 'Me llamo...', it: 'Me llamo...' }, correct: true },
                      { id: '2', label: { es: '¿Cómo estás?', en: '¿Cómo estás?', pt: '¿Cómo estás?', fr: '¿Cómo estás?', it: '¿Cómo estás?' }, correct: false },
                      { id: '3', label: { es: 'Hasta luego', en: 'Hasta luego', pt: 'Hasta luego', fr: 'Hasta luego', it: 'Hasta luego' }, correct: false },
                      { id: '4', label: { es: '¿Qué hora es?', en: '¿Qué hora es?', pt: '¿Qué hora es?', fr: '¿Qué hora es?', it: '¿Qué hora es?' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona todos los saludos correctos:',
                      en: 'Select all the correct greetings:',
                      pt: 'Selecione todas as saudações corretas:',
                      fr: 'Sélectionnez toutes les salutations correctes:',
                      it: 'Seleziona tutti i saluti corretti:',
                    },
                    options: [
                      { id: '1', label: { es: 'Hola', en: 'Hola', pt: 'Hola', fr: 'Hola', it: 'Hola' }, correct: true },
                      { id: '2', label: { es: 'Zapato', en: 'Zapato', pt: 'Zapato', fr: 'Zapato', it: 'Zapato' }, correct: false },
                      { id: '3', label: { es: 'Buenos días', en: 'Buenos días', pt: 'Buenos días', fr: 'Buenos días', it: 'Buenos días' }, correct: true },
                      { id: '4', label: { es: 'Buenas tardes', en: 'Buenas tardes', pt: 'Buenas tardes', fr: 'Buenas tardes', it: 'Buenas tardes' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué pregunta significa "how?"',
                      en: 'What question word means "how"?',
                      pt: 'Que palavra interrogativa significa "how"?',
                      fr: 'Quel mot interrogatif signifie "how"?',
                      it: 'Quale parola interrogativa significa "how"?',
                    },
                    options: [
                      { id: '1', label: { es: '¿Qué?', en: '¿Qué?', pt: '¿Qué?', fr: '¿Qué?', it: '¿Qué?' }, correct: false },
                      { id: '2', label: { es: '¿Dónde?', en: '¿Dónde?', pt: '¿Dónde?', fr: '¿Dónde?', it: '¿Dónde?' }, correct: false },
                      { id: '3', label: { es: '¿Cómo?', en: '¿Cómo?', pt: '¿Cómo?', fr: '¿Cómo?', it: '¿Cómo?' }, correct: true },
                      { id: '4', label: { es: '¿Cuándo?', en: '¿Cuándo?', pt: '¿Cuándo?', fr: '¿Cuándo?', it: '¿Cuándo?' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué pregunta usas para "where?"',
                      en: 'What question word do you use for "where"?',
                      pt: 'Que palavra interrogativa você usa para "where"?',
                      fr: 'Quel mot interrogatif utilisez-vous pour "where"?',
                      it: 'Quale parola interrogativa usi per "where"?',
                    },
                    answer: { acceptable: ['¿dónde?', '¿donde?', 'dónde', 'donde'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "¿Por qué?"?',
                      en: 'What does "¿Por qué?" mean?',
                      pt: 'O que significa "¿Por qué?"?',
                      fr: 'Que signifie "¿Por qué?"?',
                      it: 'Cosa significa "¿Por qué?"?',
                    },
                    options: [
                      { id: '1', label: { es: '¿Qué?', en: 'What?', pt: 'O quê?', fr: 'Quoi?', it: 'Cosa?' }, correct: false },
                      { id: '2', label: { es: '¿Cuándo?', en: 'When?', pt: 'Quando?', fr: 'Quand?', it: 'Quando?' }, correct: false },
                      { id: '3', label: { es: '¿Por qué?', en: 'Why?', pt: 'Por quê?', fr: 'Pourquoi?', it: 'Perché?' }, correct: true },
                      { id: '4', label: { es: '¿Cómo?', en: 'How?', pt: 'Como?', fr: 'Comment?', it: 'Come?' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras interrogativas:',
                      en: 'Select the interrogative words:',
                      pt: 'Selecione as palavras interrogativas:',
                      fr: 'Sélectionnez les mots interrogatifs:',
                      it: 'Seleziona le parole interrogative:',
                    },
                    options: [
                      { id: '1', label: { es: '¿Qué?', en: '¿Qué?', pt: '¿Qué?', fr: '¿Qué?', it: '¿Qué?' }, correct: true },
                      { id: '2', label: { es: 'Hola', en: 'Hola', pt: 'Hola', fr: 'Hola', it: 'Hola' }, correct: false },
                      { id: '3', label: { es: '¿Cuándo?', en: '¿Cuándo?', pt: '¿Cuándo?', fr: '¿Cuándo?', it: '¿Cuándo?' }, correct: true },
                      { id: '4', label: { es: 'Adiós', en: 'Adiós', pt: 'Adiós', fr: 'Adiós', it: 'Adiós' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es el saludo correcto para la noche?',
                      en: 'What is the correct greeting for the night?',
                      pt: 'Qual é a saudação correta para a noite?',
                      fr: 'Quelle est la salutation correcte pour la nuit?',
                      it: 'Qual è il saluto corretto per la notte?',
                    },
                    options: [
                      { id: '1', label: { es: 'Buenos días', en: 'Buenos días', pt: 'Buenos días', fr: 'Buenos días', it: 'Buenos días' }, correct: false },
                      { id: '2', label: { es: 'Buenas tardes', en: 'Buenas tardes', pt: 'Buenas tardes', fr: 'Buenas tardes', it: 'Buenas tardes' }, correct: false },
                      { id: '3', label: { es: 'Buenas noches', en: 'Buenas noches', pt: 'Buenas noches', fr: 'Buenas noches', it: 'Buenas noches' }, correct: true },
                      { id: '4', label: { es: 'Hasta mañana', en: 'Hasta mañana', pt: 'Hasta mañana', fr: 'Hasta mañana', it: 'Hasta mañana' }, correct: false },
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
                    stem: {
                      es: '¿Cómo se dice "I like" en español?',
                      en: 'How do you say "I like" in Spanish?',
                      pt: 'Como se diz "I like" em espanhol?',
                      fr: 'Comment dit-on "I like" en espagnol?',
                      it: 'Come si dice "I like" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'No me gusta', en: 'No me gusta', pt: 'No me gusta', fr: 'No me gusta', it: 'No me gusta' }, correct: false },
                      { id: '2', label: { es: 'Me gusta', en: 'Me gusta', pt: 'Me gusta', fr: 'Me gusta', it: 'Me gusta' }, correct: true },
                      { id: '3', label: { es: 'Odio', en: 'Odio', pt: 'Odio', fr: 'Odio', it: 'Odio' }, correct: false },
                      { id: '4', label: { es: 'Prefiero', en: 'Prefiero', pt: 'Prefiero', fr: 'Prefiero', it: 'Prefiero' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "me encanta"?',
                      en: 'What does "me encanta" mean?',
                      pt: 'O que significa "me encanta"?',
                      fr: 'Que signifie "me encanta"?',
                      it: 'Cosa significa "me encanta"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Odio', en: 'I hate', pt: 'Eu odeio', fr: 'Je déteste', it: 'Odio' }, correct: false },
                      { id: '2', label: { es: 'Me gusta', en: 'I like', pt: 'Eu gosto', fr: 'J\'aime', it: 'Mi piace' }, correct: false },
                      { id: '3', label: { es: 'Me encanta', en: 'I love', pt: 'Eu amo', fr: 'J\'adore', it: 'Adoro' }, correct: true },
                      { id: '4', label: { es: 'Prefiero', en: 'I prefer', pt: 'Eu prefiro', fr: 'Je préfère', it: 'Preferisco' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué número es "five"?',
                      en: 'What number is "five"?',
                      pt: 'Que número é "five"?',
                      fr: 'Quel nombre est "five"?',
                      it: 'Che numero è "five"?',
                    },
                    answer: { acceptable: ['cinco'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es el número "10" en español?',
                      en: 'What is the number "10" in Spanish?',
                      pt: 'Qual é o número "10" em espanhol?',
                      fr: 'Quel est le nombre "10" en espagnol?',
                      it: 'Qual è il numero "10" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Cinco', en: 'Cinco', pt: 'Cinco', fr: 'Cinco', it: 'Cinco' }, correct: false },
                      { id: '2', label: { es: 'Diez', en: 'Diez', pt: 'Diez', fr: 'Diez', it: 'Diez' }, correct: true },
                      { id: '3', label: { es: 'Veinte', en: 'Veinte', pt: 'Veinte', fr: 'Veinte', it: 'Veinte' }, correct: false },
                      { id: '4', label: { es: 'Quince', en: 'Quince', pt: 'Quince', fr: 'Quince', it: 'Quince' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las comidas y bebidas:',
                      en: 'Select the foods and drinks:',
                      pt: 'Selecione as comidas e bebidas:',
                      fr: 'Sélectionnez les aliments et boissons:',
                      it: 'Seleziona i cibi e le bevande:',
                    },
                    options: [
                      { id: '1', label: { es: 'Agua', en: 'Agua', pt: 'Agua', fr: 'Agua', it: 'Agua' }, correct: true },
                      { id: '2', label: { es: 'Madre', en: 'Madre', pt: 'Madre', fr: 'Madre', it: 'Madre' }, correct: false },
                      { id: '3', label: { es: 'Pan', en: 'Pan', pt: 'Pan', fr: 'Pan', it: 'Pan' }, correct: true },
                      { id: '4', label: { es: 'Café', en: 'Café', pt: 'Café', fr: 'Café', it: 'Café' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "chicken" en español?',
                      en: 'How do you say "chicken" in Spanish?',
                      pt: 'Como se diz "chicken" em espanhol?',
                      fr: 'Comment dit-on "chicken" en espagnol?',
                      it: 'Come si dice "chicken" in spagnolo?',
                    },
                    answer: { acceptable: ['pollo'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué bebida es "coffee"?',
                      en: 'What drink is "coffee"?',
                      pt: 'Que bebida é "coffee"?',
                      fr: 'Quelle boisson est "coffee"?',
                      it: 'Quale bevanda è "coffee"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Agua', en: 'Agua', pt: 'Agua', fr: 'Agua', it: 'Agua' }, correct: false },
                      { id: '2', label: { es: 'Café', en: 'Café', pt: 'Café', fr: 'Café', it: 'Café' }, correct: true },
                      { id: '3', label: { es: 'Leche', en: 'Leche', pt: 'Leche', fr: 'Leche', it: 'Leche' }, correct: false },
                      { id: '4', label: { es: 'Pan', en: 'Pan', pt: 'Pan', fr: 'Pan', it: 'Pan' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones de preferencia:',
                      en: 'Select the preference expressions:',
                      pt: 'Selecione as expressões de preferência:',
                      fr: 'Sélectionnez les expressions de préférence:',
                      it: 'Seleziona le espressioni di preferenza:',
                    },
                    options: [
                      { id: '1', label: { es: 'Me gusta', en: 'Me gusta', pt: 'Me gusta', fr: 'Me gusta', it: 'Me gusta' }, correct: true },
                      { id: '2', label: { es: 'Hola', en: 'Hola', pt: 'Hola', fr: 'Hola', it: 'Hola' }, correct: false },
                      { id: '3', label: { es: 'Prefiero', en: 'Prefiero', pt: 'Prefiero', fr: 'Prefiero', it: 'Prefiero' }, correct: true },
                      { id: '4', label: { es: 'Odio', en: 'Odio', pt: 'Odio', fr: 'Odio', it: 'Odio' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es "rice" en español?',
                      en: 'What is "rice" in Spanish?',
                      pt: 'O que é "rice" em espanhol?',
                      fr: 'Qu\'est-ce que "rice" en espagnol?',
                      it: 'Cos\'è "rice" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Pan', en: 'Pan', pt: 'Pan', fr: 'Pan', it: 'Pan' }, correct: false },
                      { id: '2', label: { es: 'Arroz', en: 'Arroz', pt: 'Arroz', fr: 'Arroz', it: 'Arroz' }, correct: true },
                      { id: '3', label: { es: 'Pollo', en: 'Pollo', pt: 'Pollo', fr: 'Pollo', it: 'Pollo' }, correct: false },
                      { id: '4', label: { es: 'Fruta', en: 'Fruta', pt: 'Fruta', fr: 'Fruta', it: 'Fruta' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué número es "twenty"?',
                      en: 'What number is "twenty"?',
                      pt: 'Que número é "twenty"?',
                      fr: 'Quel nombre est "twenty"?',
                      it: 'Che numero è "twenty"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Dos', en: 'Dos', pt: 'Dos', fr: 'Dos', it: 'Dos' }, correct: false },
                      { id: '2', label: { es: 'Diez', en: 'Diez', pt: 'Diez', fr: 'Diez', it: 'Diez' }, correct: false },
                      { id: '3', label: { es: 'Doce', en: 'Doce', pt: 'Doce', fr: 'Doce', it: 'Doce' }, correct: false },
                      { id: '4', label: { es: 'Veinte', en: 'Veinte', pt: 'Veinte', fr: 'Veinte', it: 'Veinte' }, correct: true },
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
                    stem: {
                      es: '¿Qué significa "hora"?',
                      en: 'What does "hora" mean?',
                      pt: 'O que significa "hora"?',
                      fr: 'Que signifie "hora"?',
                      it: 'Cosa significa "hora"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Minuto', en: 'Minute', pt: 'Minuto', fr: 'Minute', it: 'Minuto' }, correct: false },
                      { id: '2', label: { es: 'Hora', en: 'Hour', pt: 'Hora', fr: 'Heure', it: 'Ora' }, correct: true },
                      { id: '3', label: { es: 'Día', en: 'Day', pt: 'Dia', fr: 'Jour', it: 'Giorno' }, correct: false },
                      { id: '4', label: { es: 'Noche', en: 'Night', pt: 'Noite', fr: 'Nuit', it: 'Notte' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "morning" en español?',
                      en: 'How do you say "morning" in Spanish?',
                      pt: 'Como se diz "morning" em espanhol?',
                      fr: 'Comment dit-on "morning" en espagnol?',
                      it: 'Come si dice "morning" in spagnolo?',
                    },
                    answer: { acceptable: ['mañana'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to wake up"?',
                      en: 'What verb means "to wake up"?',
                      pt: 'Que verbo significa "to wake up"?',
                      fr: 'Quel verbe signifie "to wake up"?',
                      it: 'Quale verbo significa "to wake up"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Trabajar', en: 'Trabajar', pt: 'Trabajar', fr: 'Trabajar', it: 'Trabajar' }, correct: false },
                      { id: '2', label: { es: 'Desayunar', en: 'Desayunar', pt: 'Desayunar', fr: 'Desayunar', it: 'Desayunar' }, correct: false },
                      { id: '3', label: { es: 'Despertarse', en: 'Despertarse', pt: 'Despertarse', fr: 'Despertarse', it: 'Despertarse' }, correct: true },
                      { id: '4', label: { es: 'Ducharse', en: 'Ducharse', pt: 'Ducharse', fr: 'Ducharse', it: 'Ducharse' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los verbos reflexivos de la rutina diaria:',
                      en: 'Select the reflexive verbs of the daily routine:',
                      pt: 'Selecione os verbos reflexivos da rotina diária:',
                      fr: 'Sélectionnez les verbes réfléchis de la routine quotidienne:',
                      it: 'Seleziona i verbi riflessivi della routine quotidiana:',
                    },
                    options: [
                      { id: '1', label: { es: 'Levantarse', en: 'Levantarse', pt: 'Levantarse', fr: 'Levantarse', it: 'Levantarse' }, correct: true },
                      { id: '2', label: { es: 'Madre', en: 'Madre', pt: 'Madre', fr: 'Madre', it: 'Madre' }, correct: false },
                      { id: '3', label: { es: 'Ducharse', en: 'Ducharse', pt: 'Ducharse', fr: 'Ducharse', it: 'Ducharse' }, correct: true },
                      { id: '4', label: { es: 'Desayunar', en: 'Desayunar', pt: 'Desayunar', fr: 'Desayunar', it: 'Desayunar' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "mother" en español?',
                      en: 'How do you say "mother" in Spanish?',
                      pt: 'Como se diz "mother" em espanhol?',
                      fr: 'Comment dit-on "mother" en espagnol?',
                      it: 'Come si dice "mother" in spagnolo?',
                    },
                    answer: { acceptable: ['madre', 'mamá', 'mama'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "hermano"?',
                      en: 'What does "hermano" mean?',
                      pt: 'O que significa "hermano"?',
                      fr: 'Que signifie "hermano"?',
                      it: 'Cosa significa "hermano"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Padre', en: 'Father', pt: 'Pai', fr: 'Père', it: 'Padre' }, correct: false },
                      { id: '2', label: { es: 'Hermana', en: 'Sister', pt: 'Irmã', fr: 'Sœur', it: 'Sorella' }, correct: false },
                      { id: '3', label: { es: 'Hermano', en: 'Brother', pt: 'Irmão', fr: 'Frère', it: 'Fratello' }, correct: true },
                      { id: '4', label: { es: 'Madre', en: 'Mother', pt: 'Mãe', fr: 'Mère', it: 'Madre' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los miembros de la familia:',
                      en: 'Select the family members:',
                      pt: 'Selecione os membros da família:',
                      fr: 'Sélectionnez les membres de la famille:',
                      it: 'Seleziona i membri della famiglia:',
                    },
                    options: [
                      { id: '1', label: { es: 'Padre', en: 'Padre', pt: 'Padre', fr: 'Padre', it: 'Padre' }, correct: true },
                      { id: '2', label: { es: 'Trabajar', en: 'Trabajar', pt: 'Trabajar', fr: 'Trabajar', it: 'Trabajar' }, correct: false },
                      { id: '3', label: { es: 'Hermana', en: 'Hermana', pt: 'Hermana', fr: 'Hermana', it: 'Hermana' }, correct: true },
                      { id: '4', label: { es: 'Familia', en: 'Familia', pt: 'Familia', fr: 'Familia', it: 'Familia' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué actividad es "desayunar"?',
                      en: 'What activity is "desayunar"?',
                      pt: 'Que atividade é "desayunar"?',
                      fr: 'Quelle activité est "desayunar"?',
                      it: 'Che attività è "desayunar"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Trabajar', en: 'To work', pt: 'Trabalhar', fr: 'Travailler', it: 'Lavorare' }, correct: false },
                      { id: '2', label: { es: 'Desayunar', en: 'To have breakfast', pt: 'Tomar café da manhã', fr: 'Prendre le petit-déjeuner', it: 'Fare colazione' }, correct: true },
                      { id: '3', label: { es: 'Ducharse', en: 'To shower', pt: 'Tomar banho', fr: 'Se doucher', it: 'Fare la doccia' }, correct: false },
                      { id: '4', label: { es: 'Levantarse', en: 'To get up', pt: 'Levantar-se', fr: 'Se lever', it: 'Alzarsi' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "night"?',
                      en: 'What word means "night"?',
                      pt: 'Que palavra significa "night"?',
                      fr: 'Quel mot signifie "night"?',
                      it: 'Quale parola significa "night"?',
                    },
                    answer: { acceptable: ['noche'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es el momento del día "tarde"?',
                      en: 'What time of day is "tarde"?',
                      pt: 'Que hora do dia é "tarde"?',
                      fr: 'Quel moment de la journée est "tarde"?',
                      it: 'Che momento del giorno è "tarde"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Mañana', en: 'Morning', pt: 'Manhã', fr: 'Matin', it: 'Mattina' }, correct: false },
                      { id: '2', label: { es: 'Tarde', en: 'Afternoon', pt: 'Tarde', fr: 'Après-midi', it: 'Pomeriggio' }, correct: true },
                      { id: '3', label: { es: 'Noche', en: 'Night', pt: 'Noite', fr: 'Nuit', it: 'Notte' }, correct: false },
                      { id: '4', label: { es: 'Medianoche', en: 'Midnight', pt: 'Meia-noite', fr: 'Minuit', it: 'Mezzanotte' }, correct: false },
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
                    stem: {
                      es: '¿Dónde guardas dinero?',
                      en: 'Where do you keep money?',
                      pt: 'Onde você guarda dinheiro?',
                      fr: 'Où gardez-vous de l\'argent?',
                      it: 'Dove tieni i soldi?',
                    },
                    options: [
                      { id: '1', label: { es: 'Supermercado', en: 'Supermercado', pt: 'Supermercado', fr: 'Supermercado', it: 'Supermercado' }, correct: false },
                      { id: '2', label: { es: 'Banco', en: 'Banco', pt: 'Banco', fr: 'Banco', it: 'Banco' }, correct: true },
                      { id: '3', label: { es: 'Parque', en: 'Parque', pt: 'Parque', fr: 'Parque', it: 'Parque' }, correct: false },
                      { id: '4', label: { es: 'Hospital', en: 'Hospital', pt: 'Hospital', fr: 'Hospital', it: 'Hospital' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "school" en español?',
                      en: 'How do you say "school" in Spanish?',
                      pt: 'Como se diz "school" em espanhol?',
                      fr: 'Comment dit-on "school" en espagnol?',
                      it: 'Come si dice "school" in spagnolo?',
                    },
                    answer: { acceptable: ['escuela'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los lugares de la ciudad:',
                      en: 'Select the places in the city:',
                      pt: 'Selecione os lugares da cidade:',
                      fr: 'Sélectionnez les lieux de la ville:',
                      it: 'Seleziona i luoghi della città:',
                    },
                    options: [
                      { id: '1', label: { es: 'Hospital', en: 'Hospital', pt: 'Hospital', fr: 'Hospital', it: 'Hospital' }, correct: true },
                      { id: '2', label: { es: 'Derecha', en: 'Derecha', pt: 'Derecha', fr: 'Derecha', it: 'Derecha' }, correct: false },
                      { id: '3', label: { es: 'Parque', en: 'Parque', pt: 'Parque', fr: 'Parque', it: 'Parque' }, correct: true },
                      { id: '4', label: { es: 'Supermercado', en: 'Supermercado', pt: 'Supermercado', fr: 'Supermercado', it: 'Supermercado' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "derecha"?',
                      en: 'What does "derecha" mean?',
                      pt: 'O que significa "derecha"?',
                      fr: 'Que signifie "derecha"?',
                      it: 'Cosa significa "derecha"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Izquierda', en: 'Left', pt: 'Esquerda', fr: 'Gauche', it: 'Sinistra' }, correct: false },
                      { id: '2', label: { es: 'Derecha', en: 'Right', pt: 'Direita', fr: 'Droite', it: 'Destra' }, correct: true },
                      { id: '3', label: { es: 'Recto', en: 'Straight', pt: 'Reto', fr: 'Tout droit', it: 'Dritto' }, correct: false },
                      { id: '4', label: { es: 'Cerca', en: 'Near', pt: 'Perto', fr: 'Près', it: 'Vicino' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué dirección es lo opuesto de "derecha"?',
                      en: 'What direction is the opposite of "derecha" (right)?',
                      pt: 'Que direção é o oposto de "derecha" (direita)?',
                      fr: 'Quelle direction est l\'opposé de "derecha" (droite)?',
                      it: 'Quale direzione è l\'opposto di "derecha" (destra)?',
                    },
                    answer: { acceptable: ['izquierda'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cómo se dice "far" en español?',
                      en: 'How do you say "far" in Spanish?',
                      pt: 'Como se diz "far" em espanhol?',
                      fr: 'Comment dit-on "far" en espagnol?',
                      it: 'Come si dice "far" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Cerca', en: 'Cerca', pt: 'Cerca', fr: 'Cerca', it: 'Cerca' }, correct: false },
                      { id: '2', label: { es: 'Recto', en: 'Recto', pt: 'Recto', fr: 'Recto', it: 'Recto' }, correct: false },
                      { id: '3', label: { es: 'Lejos', en: 'Lejos', pt: 'Lejos', fr: 'Lejos', it: 'Lejos' }, correct: true },
                      { id: '4', label: { es: 'Derecha', en: 'Derecha', pt: 'Derecha', fr: 'Derecha', it: 'Derecha' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los medios de transporte:',
                      en: 'Select the means of transportation:',
                      pt: 'Selecione os meios de transporte:',
                      fr: 'Sélectionnez les moyens de transport:',
                      it: 'Seleziona i mezzi di trasporto:',
                    },
                    options: [
                      { id: '1', label: { es: 'Autobús', en: 'Autobús', pt: 'Autobús', fr: 'Autobús', it: 'Autobús' }, correct: true },
                      { id: '2', label: { es: 'Banco', en: 'Banco', pt: 'Banco', fr: 'Banco', it: 'Banco' }, correct: false },
                      { id: '3', label: { es: 'Metro', en: 'Metro', pt: 'Metro', fr: 'Metro', it: 'Metro' }, correct: true },
                      { id: '4', label: { es: 'Bicicleta', en: 'Bicicleta', pt: 'Bicicleta', fr: 'Bicicleta', it: 'Bicicleta' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué transporte va bajo tierra?',
                      en: 'What transportation goes underground?',
                      pt: 'Que transporte vai subterrâneo?',
                      fr: 'Quel transport va sous terre?',
                      it: 'Quale trasporto va sottoterra?',
                    },
                    options: [
                      { id: '1', label: { es: 'Autobús', en: 'Autobús', pt: 'Autobús', fr: 'Autobús', it: 'Autobús' }, correct: false },
                      { id: '2', label: { es: 'Metro', en: 'Metro', pt: 'Metro', fr: 'Metro', it: 'Metro' }, correct: true },
                      { id: '3', label: { es: 'Bicicleta', en: 'Bicicleta', pt: 'Bicicleta', fr: 'Bicicleta', it: 'Bicicleta' }, correct: false },
                      { id: '4', label: { es: 'Taxi', en: 'Taxi', pt: 'Taxi', fr: 'Taxi', it: 'Taxi' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué verbo significa "to walk"?',
                      en: 'What verb means "to walk"?',
                      pt: 'Que verbo significa "to walk"?',
                      fr: 'Quel verbe signifie "to walk"?',
                      it: 'Quale verbo significa "to walk"?',
                    },
                    answer: { acceptable: ['caminar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "recto"?',
                      en: 'What does "recto" mean?',
                      pt: 'O que significa "recto"?',
                      fr: 'Que signifie "recto"?',
                      it: 'Cosa significa "recto"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Izquierda', en: 'Left', pt: 'Esquerda', fr: 'Gauche', it: 'Sinistra' }, correct: false },
                      { id: '2', label: { es: 'Derecha', en: 'Right', pt: 'Direita', fr: 'Droite', it: 'Destra' }, correct: false },
                      { id: '3', label: { es: 'Recto', en: 'Straight', pt: 'Reto', fr: 'Tout droit', it: 'Dritto' }, correct: true },
                      { id: '4', label: { es: 'Lejos', en: 'Far', pt: 'Longe', fr: 'Loin', it: 'Lontano' }, correct: false },
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
                    stem: {
                      es: '¿Qué verbo significa "to buy"?',
                      en: 'What verb means "to buy"?',
                      pt: 'Que verbo significa "to buy"?',
                      fr: 'Quel verbe signifie "to buy"?',
                      it: 'Quale verbo significa "to buy"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Vender', en: 'Vender', pt: 'Vender', fr: 'Vender', it: 'Vender' }, correct: false },
                      { id: '2', label: { es: 'Comprar', en: 'Comprar', pt: 'Comprar', fr: 'Comprar', it: 'Comprar' }, correct: true },
                      { id: '3', label: { es: 'Llevar', en: 'Llevar', pt: 'Llevar', fr: 'Llevar', it: 'Llevar' }, correct: false },
                      { id: '4', label: { es: 'Precio', en: 'Precio', pt: 'Precio', fr: 'Precio', it: 'Precio' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "expensive" en español?',
                      en: 'How do you say "expensive" in Spanish?',
                      pt: 'Como se diz "expensive" em espanhol?',
                      fr: 'Comment dit-on "expensive" en espagnol?',
                      it: 'Come si dice "expensive" in spagnolo?',
                    },
                    answer: { acceptable: ['caro'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "barato"?',
                      en: 'What does "barato" mean?',
                      pt: 'O que significa "barato"?',
                      fr: 'Que signifie "barato"?',
                      it: 'Cosa significa "barato"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Caro', en: 'Expensive', pt: 'Caro', fr: 'Cher', it: 'Costoso' }, correct: false },
                      { id: '2', label: { es: 'Barato', en: 'Cheap', pt: 'Barato', fr: 'Pas cher', it: 'Economico' }, correct: true },
                      { id: '3', label: { es: 'Precio', en: 'Price', pt: 'Preço', fr: 'Prix', it: 'Prezzo' }, correct: false },
                      { id: '4', label: { es: 'Vender', en: 'To sell', pt: 'Vender', fr: 'Vendre', it: 'Vendere' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué número es "thirty"?',
                      en: 'What number is "thirty"?',
                      pt: 'Que número é "thirty"?',
                      fr: 'Quel nombre est "thirty"?',
                      it: 'Che numero è "thirty"?',
                    },
                    answer: { acceptable: ['treinta'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es el número "50" en español?',
                      en: 'What is the number "50" in Spanish?',
                      pt: 'Qual é o número "50" em espanhol?',
                      fr: 'Quel est le nombre "50" en espagnol?',
                      it: 'Qual è il numero "50" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Treinta', en: 'Treinta', pt: 'Treinta', fr: 'Treinta', it: 'Treinta' }, correct: false },
                      { id: '2', label: { es: 'Cuarenta', en: 'Cuarenta', pt: 'Cuarenta', fr: 'Cuarenta', it: 'Cuarenta' }, correct: false },
                      { id: '3', label: { es: 'Cincuenta', en: 'Cincuenta', pt: 'Cincuenta', fr: 'Cincuenta', it: 'Cincuenta' }, correct: true },
                      { id: '4', label: { es: 'Cien', en: 'Cien', pt: 'Cien', fr: 'Cien', it: 'Cien' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las prendas de ropa:',
                      en: 'Select the clothing items:',
                      pt: 'Selecione as peças de roupa:',
                      fr: 'Sélectionnez les vêtements:',
                      it: 'Seleziona i capi di abbigliamento:',
                    },
                    options: [
                      { id: '1', label: { es: 'Camisa', en: 'Camisa', pt: 'Camisa', fr: 'Camisa', it: 'Camisa' }, correct: true },
                      { id: '2', label: { es: 'Precio', en: 'Precio', pt: 'Precio', fr: 'Precio', it: 'Precio' }, correct: false },
                      { id: '3', label: { es: 'Zapatos', en: 'Zapatos', pt: 'Zapatos', fr: 'Zapatos', it: 'Zapatos' }, correct: true },
                      { id: '4', label: { es: 'Vestido', en: 'Vestido', pt: 'Vestido', fr: 'Vestido', it: 'Vestido' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "shirt" en español?',
                      en: 'How do you say "shirt" in Spanish?',
                      pt: 'Como se diz "shirt" em espanhol?',
                      fr: 'Comment dit-on "shirt" en espagnol?',
                      it: 'Come si dice "shirt" in spagnolo?',
                    },
                    answer: { acceptable: ['camisa'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué prenda son "shoes"?',
                      en: 'What clothing item is "shoes"?',
                      pt: 'Que peça de roupa é "shoes"?',
                      fr: 'Quel vêtement est "shoes"?',
                      it: 'Quale capo di abbigliamento è "shoes"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Camisa', en: 'Camisa', pt: 'Camisa', fr: 'Camisa', it: 'Camisa' }, correct: false },
                      { id: '2', label: { es: 'Pantalón', en: 'Pantalón', pt: 'Pantalón', fr: 'Pantalón', it: 'Pantalón' }, correct: false },
                      { id: '3', label: { es: 'Zapatos', en: 'Zapatos', pt: 'Zapatos', fr: 'Zapatos', it: 'Zapatos' }, correct: true },
                      { id: '4', label: { es: 'Vestido', en: 'Vestido', pt: 'Vestido', fr: 'Vestido', it: 'Vestido' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "llevar"?',
                      en: 'What does "llevar" mean?',
                      pt: 'O que significa "llevar"?',
                      fr: 'Que signifie "llevar"?',
                      it: 'Cosa significa "llevar"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Comprar', en: 'To buy', pt: 'Comprar', fr: 'Acheter', it: 'Comprare' }, correct: false },
                      { id: '2', label: { es: 'Vender', en: 'To sell', pt: 'Vender', fr: 'Vendre', it: 'Vendere' }, correct: false },
                      { id: '3', label: { es: 'Llevar', en: 'To wear/carry', pt: 'Levar/usar', fr: 'Porter', it: 'Portare/indossare' }, correct: true },
                      { id: '4', label: { es: 'Precio', en: 'To price', pt: 'Preço', fr: 'Prix', it: 'Prezzo' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es "100" en español?',
                      en: 'What is "100" in Spanish?',
                      pt: 'O que é "100" em espanhol?',
                      fr: 'Qu\'est-ce que "100" en espagnol?',
                      it: 'Cos\'è "100" in spagnolo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Cincuenta', en: 'Cincuenta', pt: 'Cincuenta', fr: 'Cincuenta', it: 'Cincuenta' }, correct: false },
                      { id: '2', label: { es: 'Noventa', en: 'Noventa', pt: 'Noventa', fr: 'Noventa', it: 'Noventa' }, correct: false },
                      { id: '3', label: { es: 'Cien', en: 'Cien', pt: 'Cien', fr: 'Cien', it: 'Cien' }, correct: true },
                      { id: '4', label: { es: 'Mil', en: 'Mil', pt: 'Mil', fr: 'Mil', it: 'Mil' }, correct: false },
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
                    stem: {
                      es: '¿De qué color es el cielo?',
                      en: 'What color is the sky?',
                      pt: 'De que cor é o céu?',
                      fr: 'De quelle couleur est le ciel?',
                      it: 'Di che colore è il cielo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Rojo', en: 'Rojo', pt: 'Rojo', fr: 'Rojo', it: 'Rojo' }, correct: false },
                      { id: '2', label: { es: 'Azul', en: 'Azul', pt: 'Azul', fr: 'Azul', it: 'Azul' }, correct: true },
                      { id: '3', label: { es: 'Verde', en: 'Verde', pt: 'Verde', fr: 'Verde', it: 'Verde' }, correct: false },
                      { id: '4', label: { es: 'Amarillo', en: 'Amarillo', pt: 'Amarillo', fr: 'Amarillo', it: 'Amarillo' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "red" en español?',
                      en: 'How do you say "red" in Spanish?',
                      pt: 'Como se diz "red" em espanhol?',
                      fr: 'Comment dit-on "red" en espagnol?',
                      it: 'Come si dice "red" in spagnolo?',
                    },
                    answer: { acceptable: ['rojo'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los colores:',
                      en: 'Select the colors:',
                      pt: 'Selecione as cores:',
                      fr: 'Sélectionnez les couleurs:',
                      it: 'Seleziona i colori:',
                    },
                    options: [
                      { id: '1', label: { es: 'Negro', en: 'Negro', pt: 'Negro', fr: 'Negro', it: 'Negro' }, correct: true },
                      { id: '2', label: { es: 'Alto', en: 'Alto', pt: 'Alto', fr: 'Alto', it: 'Alto' }, correct: false },
                      { id: '3', label: { es: 'Blanco', en: 'Blanco', pt: 'Blanco', fr: 'Blanco', it: 'Blanco' }, correct: true },
                      { id: '4', label: { es: 'Verde', en: 'Verde', pt: 'Verde', fr: 'Verde', it: 'Verde' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "alto"?',
                      en: 'What does "alto" mean?',
                      pt: 'O que significa "alto"?',
                      fr: 'Que signifie "alto"?',
                      it: 'Cosa significa "alto"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Bajo', en: 'Short', pt: 'Baixo', fr: 'Petit', it: 'Basso' }, correct: false },
                      { id: '2', label: { es: 'Alto', en: 'Tall', pt: 'Alto', fr: 'Grand', it: 'Alto' }, correct: true },
                      { id: '3', label: { es: 'Delgado', en: 'Thin', pt: 'Magro', fr: 'Mince', it: 'Magro' }, correct: false },
                      { id: '4', label: { es: 'Fuerte', en: 'Strong', pt: 'Forte', fr: 'Fort', it: 'Forte' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cuál es lo opuesto de "alto"?',
                      en: 'What is the opposite of "alto" (tall)?',
                      pt: 'Qual é o oposto de "alto"?',
                      fr: 'Quel est l\'opposé de "alto" (grand)?',
                      it: 'Qual è l\'opposto di "alto"?',
                    },
                    answer: { acceptable: ['bajo'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las descripciones físicas:',
                      en: 'Select the physical descriptions:',
                      pt: 'Selecione as descrições físicas:',
                      fr: 'Sélectionnez les descriptions physiques:',
                      it: 'Seleziona le descrizioni fisiche:',
                    },
                    options: [
                      { id: '1', label: { es: 'Delgado', en: 'Delgado', pt: 'Delgado', fr: 'Delgado', it: 'Delgado' }, correct: true },
                      { id: '2', label: { es: 'Simpático', en: 'Simpático', pt: 'Simpático', fr: 'Simpático', it: 'Simpático' }, correct: false },
                      { id: '3', label: { es: 'Fuerte', en: 'Fuerte', pt: 'Fuerte', fr: 'Fuerte', it: 'Fuerte' }, correct: true },
                      { id: '4', label: { es: 'Pelo', en: 'Pelo', pt: 'Pelo', fr: 'Pelo', it: 'Pelo' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "simpático"?',
                      en: 'What does "simpático" mean?',
                      pt: 'O que significa "simpático"?',
                      fr: 'Que signifie "simpático"?',
                      it: 'Cosa significa "simpático"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Serio', en: 'Serious', pt: 'Sério', fr: 'Sérieux', it: 'Serio' }, correct: false },
                      { id: '2', label: { es: 'Simpático', en: 'Nice/friendly', pt: 'Simpático', fr: 'Sympathique', it: 'Simpatico' }, correct: true },
                      { id: '3', label: { es: 'Inteligente', en: 'Intelligent', pt: 'Inteligente', fr: 'Intelligent', it: 'Intelligente' }, correct: false },
                      { id: '4', label: { es: 'Divertido', en: 'Funny', pt: 'Divertido', fr: 'Drôle', it: 'Divertente' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "intelligent" en español?',
                      en: 'How do you say "intelligent" in Spanish?',
                      pt: 'Como se diz "intelligent" em espanhol?',
                      fr: 'Comment dit-on "intelligent" en espagnol?',
                      it: 'Come si dice "intelligent" in spagnolo?',
                    },
                    answer: { acceptable: ['inteligente'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los rasgos de personalidad:',
                      en: 'Select the personality traits:',
                      pt: 'Selecione os traços de personalidade:',
                      fr: 'Sélectionnez les traits de personnalité:',
                      it: 'Seleziona i tratti della personalità:',
                    },
                    options: [
                      { id: '1', label: { es: 'Amable', en: 'Amable', pt: 'Amable', fr: 'Amable', it: 'Amable' }, correct: true },
                      { id: '2', label: { es: 'Ojos', en: 'Ojos', pt: 'Ojos', fr: 'Ojos', it: 'Ojos' }, correct: false },
                      { id: '3', label: { es: 'Divertido', en: 'Divertido', pt: 'Divertido', fr: 'Divertido', it: 'Divertido' }, correct: true },
                      { id: '4', label: { es: 'Serio', en: 'Serio', pt: 'Serio', fr: 'Serio', it: 'Serio' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué parte del cuerpo es "hair"?',
                      en: 'What body part is "hair"?',
                      pt: 'Que parte do corpo é "hair"?',
                      fr: 'Quelle partie du corps est "hair"?',
                      it: 'Quale parte del corpo è "hair"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Ojos', en: 'Ojos', pt: 'Ojos', fr: 'Ojos', it: 'Ojos' }, correct: false },
                      { id: '2', label: { es: 'Pelo', en: 'Pelo', pt: 'Pelo', fr: 'Pelo', it: 'Pelo' }, correct: true },
                      { id: '3', label: { es: 'Nariz', en: 'Nariz', pt: 'Nariz', fr: 'Nariz', it: 'Nariz' }, correct: false },
                      { id: '4', label: { es: 'Boca', en: 'Boca', pt: 'Boca', fr: 'Boca', it: 'Boca' }, correct: false },
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
                    stem: {
                      es: '¿Cuál es el deporte más popular en América Latina?',
                      en: 'What is the most popular sport in Latin America?',
                      pt: 'Qual é o esporte mais popular na América Latina?',
                      fr: 'Quel est le sport le plus populaire en Amérique latine?',
                      it: 'Qual è lo sport più popolare in America Latina?',
                    },
                    options: [
                      { id: '1', label: { es: 'Béisbol', en: 'Béisbol', pt: 'Béisbol', fr: 'Béisbol', it: 'Béisbol' }, correct: false },
                      { id: '2', label: { es: 'Fútbol', en: 'Fútbol', pt: 'Fútbol', fr: 'Fútbol', it: 'Fútbol' }, correct: true },
                      { id: '3', label: { es: 'Baloncesto', en: 'Baloncesto', pt: 'Baloncesto', fr: 'Baloncesto', it: 'Baloncesto' }, correct: false },
                      { id: '4', label: { es: 'Tenis', en: 'Tenis', pt: 'Tenis', fr: 'Tenis', it: 'Tenis' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "to swim" en español?',
                      en: 'How do you say "to swim" in Spanish?',
                      pt: 'Como se diz "to swim" em espanhol?',
                      fr: 'Comment dit-on "to swim" en espagnol?',
                      it: 'Come si dice "to swim" in spagnolo?',
                    },
                    answer: { acceptable: ['nadar'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las actividades deportivas:',
                      en: 'Select the sports activities:',
                      pt: 'Selecione as atividades esportivas:',
                      fr: 'Sélectionnez les activités sportives:',
                      it: 'Seleziona le attività sportive:',
                    },
                    options: [
                      { id: '1', label: { es: 'Correr', en: 'Correr', pt: 'Correr', fr: 'Correr', it: 'Correr' }, correct: true },
                      { id: '2', label: { es: 'Canción', en: 'Canción', pt: 'Canción', fr: 'Canción', it: 'Canción' }, correct: false },
                      { id: '3', label: { es: 'Jugar', en: 'Jugar', pt: 'Jugar', fr: 'Jugar', it: 'Jugar' }, correct: true },
                      { id: '4', label: { es: 'Practicar', en: 'Practicar', pt: 'Practicar', fr: 'Practicar', it: 'Practicar' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "música"?',
                      en: 'What does "música" mean?',
                      pt: 'O que significa "música"?',
                      fr: 'Que signifie "música"?',
                      it: 'Cosa significa "música"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Canción', en: 'Song', pt: 'Canção', fr: 'Chanson', it: 'Canzone' }, correct: false },
                      { id: '2', label: { es: 'Música', en: 'Music', pt: 'Música', fr: 'Musique', it: 'Musica' }, correct: true },
                      { id: '3', label: { es: 'Película', en: 'Movie', pt: 'Filme', fr: 'Film', it: 'Film' }, correct: false },
                      { id: '4', label: { es: 'Concierto', en: 'Concert', pt: 'Concerto', fr: 'Concert', it: 'Concerto' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "movie" en español?',
                      en: 'How do you say "movie" in Spanish?',
                      pt: 'Como se diz "movie" em espanhol?',
                      fr: 'Comment dit-on "movie" en espagnol?',
                      it: 'Come si dice "movie" in spagnolo?',
                    },
                    answer: { acceptable: ['película'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las actividades artísticas:',
                      en: 'Select the artistic activities:',
                      pt: 'Selecione as atividades artísticas:',
                      fr: 'Sélectionnez les activités artistiques:',
                      it: 'Seleziona le attività artistiche:',
                    },
                    options: [
                      { id: '1', label: { es: 'Dibujar', en: 'Dibujar', pt: 'Dibujar', fr: 'Dibujar', it: 'Dibujar' }, correct: true },
                      { id: '2', label: { es: 'Nadar', en: 'Nadar', pt: 'Nadar', fr: 'Nadar', it: 'Nadar' }, correct: false },
                      { id: '3', label: { es: 'Pintar', en: 'Pintar', pt: 'Pintar', fr: 'Pintar', it: 'Pintar' }, correct: true },
                      { id: '4', label: { es: 'Escribir', en: 'Escribir', pt: 'Escribir', fr: 'Escribir', it: 'Escribir' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to dance"?',
                      en: 'What verb means "to dance"?',
                      pt: 'Que verbo significa "to dance"?',
                      fr: 'Quel verbe signifie "to dance"?',
                      it: 'Quale verbo significa "to dance"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Bailar', en: 'Bailar', pt: 'Bailar', fr: 'Bailar', it: 'Bailar' }, correct: true },
                      { id: '2', label: { es: 'Cantar', en: 'Cantar', pt: 'Cantar', fr: 'Cantar', it: 'Cantar' }, correct: false },
                      { id: '3', label: { es: 'Correr', en: 'Correr', pt: 'Correr', fr: 'Correr', it: 'Correr' }, correct: false },
                      { id: '4', label: { es: 'Leer', en: 'Leer', pt: 'Leer', fr: 'Leer', it: 'Leer' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "book" en español?',
                      en: 'How do you say "book" in Spanish?',
                      pt: 'Como se diz "book" em espanhol?',
                      fr: 'Comment dit-on "book" en espagnol?',
                      it: 'Come si dice "book" in spagnolo?',
                    },
                    answer: { acceptable: ['libro'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué actividad es "leer"?',
                      en: 'What activity is "leer"?',
                      pt: 'Que atividade é "leer"?',
                      fr: 'Quelle activité est "leer"?',
                      it: 'Che attività è "leer"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Escribir', en: 'To write', pt: 'Escrever', fr: 'Écrire', it: 'Scrivere' }, correct: false },
                      { id: '2', label: { es: 'Leer', en: 'To read', pt: 'Ler', fr: 'Lire', it: 'Leggere' }, correct: true },
                      { id: '3', label: { es: 'Pintar', en: 'To paint', pt: 'Pintar', fr: 'Peindre', it: 'Dipingere' }, correct: false },
                      { id: '4', label: { es: 'Dibujar', en: 'To draw', pt: 'Desenhar', fr: 'Dessiner', it: 'Disegnare' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las actividades de entretenimiento:',
                      en: 'Select the entertainment activities:',
                      pt: 'Selecione as atividades de entretenimento:',
                      fr: 'Sélectionnez les activités de divertissement:',
                      it: 'Seleziona le attività di intrattenimento:',
                    },
                    options: [
                      { id: '1', label: { es: 'Concierto', en: 'Concierto', pt: 'Concierto', fr: 'Concierto', it: 'Concierto' }, correct: true },
                      { id: '2', label: { es: 'Correr', en: 'Correr', pt: 'Correr', fr: 'Correr', it: 'Correr' }, correct: false },
                      { id: '3', label: { es: 'Canción', en: 'Canción', pt: 'Canción', fr: 'Canción', it: 'Canción' }, correct: true },
                      { id: '4', label: { es: 'Película', en: 'Película', pt: 'Película', fr: 'Película', it: 'Película' }, correct: true },
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
                    stem: {
                      es: '¿Qué significa "ayer"?',
                      en: 'What does "ayer" mean?',
                      pt: 'O que significa "ayer"?',
                      fr: 'Que signifie "ayer"?',
                      it: 'Cosa significa "ayer"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Hoy', en: 'Today', pt: 'Hoje', fr: 'Aujourd\'hui', it: 'Oggi' }, correct: false },
                      { id: '2', label: { es: 'Ayer', en: 'Yesterday', pt: 'Ontem', fr: 'Hier', it: 'Ieri' }, correct: true },
                      { id: '3', label: { es: 'Mañana', en: 'Tomorrow', pt: 'Amanhã', fr: 'Demain', it: 'Domani' }, correct: false },
                      { id: '4', label: { es: 'La semana pasada', en: 'Last week', pt: 'Semana passada', fr: 'La semaine dernière', it: 'Settimana scorsa' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "last night" en español?',
                      en: 'How do you say "last night" in Spanish?',
                      pt: 'Como se diz "last night" em espanhol?',
                      fr: 'Comment dit-on "last night" en espagnol?',
                      it: 'Come si dice "last night" in spagnolo?',
                    },
                    answer: { acceptable: ['anoche'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to travel"?',
                      en: 'What verb means "to travel"?',
                      pt: 'Que verbo significa "to travel"?',
                      fr: 'Quel verbe signifie "to travel"?',
                      it: 'Quale verbo significa "to travel"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Visitar', en: 'Visitar', pt: 'Visitar', fr: 'Visitar', it: 'Visitar' }, correct: false },
                      { id: '2', label: { es: 'Viajar', en: 'Viajar', pt: 'Viajar', fr: 'Viajar', it: 'Viajar' }, correct: true },
                      { id: '3', label: { es: 'Conocer', en: 'Conocer', pt: 'Conocer', fr: 'Conocer', it: 'Conocer' }, correct: false },
                      { id: '4', label: { es: 'Descubrir', en: 'Descubrir', pt: 'Descubrir', fr: 'Descubrir', it: 'Descubrir' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones de tiempo pasado:',
                      en: 'Select the past time expressions:',
                      pt: 'Selecione as expressões de tempo passado:',
                      fr: 'Sélectionnez les expressions de temps passé:',
                      it: 'Seleziona le espressioni di tempo passato:',
                    },
                    options: [
                      { id: '1', label: { es: 'Ayer', en: 'Ayer', pt: 'Ayer', fr: 'Ayer', it: 'Ayer' }, correct: true },
                      { id: '2', label: { es: 'Mañana', en: 'Mañana', pt: 'Mañana', fr: 'Mañana', it: 'Mañana' }, correct: false },
                      { id: '3', label: { es: 'Anoche', en: 'Anoche', pt: 'Anoche', fr: 'Anoche', it: 'Anoche' }, correct: true },
                      { id: '4', label: { es: 'La semana pasada', en: 'La semana pasada', pt: 'La semana pasada', fr: 'La semana pasada', it: 'La semana pasada' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué verbo significa "to visit"?',
                      en: 'What verb means "to visit"?',
                      pt: 'Que verbo significa "to visit"?',
                      fr: 'Quel verbe signifie "to visit"?',
                      it: 'Quale verbo significa "to visit"?',
                    },
                    answer: { acceptable: ['visitar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "conocer"?',
                      en: 'What does "conocer" mean?',
                      pt: 'O que significa "conocer"?',
                      fr: 'Que signifie "conocer"?',
                      it: 'Cosa significa "conocer"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Viajar', en: 'To travel', pt: 'Viajar', fr: 'Voyager', it: 'Viaggiare' }, correct: false },
                      { id: '2', label: { es: 'Visitar', en: 'To visit', pt: 'Visitar', fr: 'Visiter', it: 'Visitare' }, correct: false },
                      { id: '3', label: { es: 'Conocer', en: 'To know/meet', pt: 'Conhecer', fr: 'Connaître/rencontrer', it: 'Conoscere/incontrare' }, correct: true },
                      { id: '4', label: { es: 'Descubrir', en: 'To discover', pt: 'Descobrir', fr: 'Découvrir', it: 'Scoprire' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los verbos de viaje:',
                      en: 'Select the travel verbs:',
                      pt: 'Selecione os verbos de viagem:',
                      fr: 'Sélectionnez les verbes de voyage:',
                      it: 'Seleziona i verbi di viaggio:',
                    },
                    options: [
                      { id: '1', label: { es: 'Viajar', en: 'Viajar', pt: 'Viajar', fr: 'Viajar', it: 'Viajar' }, correct: true },
                      { id: '2', label: { es: 'Ayer', en: 'Ayer', pt: 'Ayer', fr: 'Ayer', it: 'Ayer' }, correct: false },
                      { id: '3', label: { es: 'Descubrir', en: 'Descubrir', pt: 'Descubrir', fr: 'Descubrir', it: 'Descubrir' }, correct: true },
                      { id: '4', label: { es: 'Visitar', en: 'Visitar', pt: 'Visitar', fr: 'Visitar', it: 'Visitar' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to discover"?',
                      en: 'What verb means "to discover"?',
                      pt: 'Que verbo significa "to discover"?',
                      fr: 'Quel verbe signifie "to discover"?',
                      it: 'Quale verbo significa "to discover"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Viajar', en: 'Viajar', pt: 'Viajar', fr: 'Viajar', it: 'Viajar' }, correct: false },
                      { id: '2', label: { es: 'Descubrir', en: 'Descubrir', pt: 'Descubrir', fr: 'Descubrir', it: 'Descubrir' }, correct: true },
                      { id: '3', label: { es: 'Visitar', en: 'Visitar', pt: 'Visitar', fr: 'Visitar', it: 'Visitar' }, correct: false },
                      { id: '4', label: { es: 'Conocer', en: 'Conocer', pt: 'Conocer', fr: 'Conocer', it: 'Conocer' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "last week"?',
                      en: 'How do you say "last week"?',
                      pt: 'Como se diz "last week"?',
                      fr: 'Comment dit-on "last week"?',
                      it: 'Come si dice "last week"?',
                    },
                    answer: { acceptable: ['la semana pasada'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: 'El pretérito se usa para acciones...',
                      en: 'The preterite is used for actions...',
                      pt: 'O pretérito é usado para ações...',
                      fr: 'Le prétérit est utilisé pour les actions...',
                      it: 'Il preterito è usato per azioni...',
                    },
                    options: [
                      { id: '1', label: { es: 'Habituales en el pasado', en: 'Habitual in the past', pt: 'Habituais no passado', fr: 'Habituelles au passé', it: 'Abituali nel passato' }, correct: false },
                      { id: '2', label: { es: 'Completadas en el pasado', en: 'Completed in the past', pt: 'Completadas no passado', fr: 'Complétées au passé', it: 'Completate nel passato' }, correct: true },
                      { id: '3', label: { es: 'En el futuro', en: 'In the future', pt: 'No futuro', fr: 'Au futur', it: 'Nel futuro' }, correct: false },
                      { id: '4', label: { es: 'En el presente', en: 'In the present', pt: 'No presente', fr: 'Au présent', it: 'Nel presente' }, correct: false },
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
                    stem: {
                      es: '¿Qué significa "llover"?',
                      en: 'What does "llover" mean?',
                      pt: 'O que significa "llover"?',
                      fr: 'Que signifie "llover"?',
                      it: 'Cosa significa "llover"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Nevar', en: 'To snow', pt: 'Nevar', fr: 'Neiger', it: 'Nevicare' }, correct: false },
                      { id: '2', label: { es: 'Llover', en: 'To rain', pt: 'Chover', fr: 'Pleuvoir', it: 'Piovere' }, correct: true },
                      { id: '3', label: { es: 'Hacer calor', en: 'To be hot', pt: 'Fazer calor', fr: 'Faire chaud', it: 'Fare caldo' }, correct: false },
                      { id: '4', label: { es: 'Hacer frío', en: 'To be cold', pt: 'Fazer frio', fr: 'Faire froid', it: 'Fare freddo' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "to snow" en español?',
                      en: 'How do you say "to snow" in Spanish?',
                      pt: 'Como se diz "to snow" em espanhol?',
                      fr: 'Comment dit-on "to snow" en espagnol?',
                      it: 'Come si dice "to snow" in spagnolo?',
                    },
                    answer: { acceptable: ['nevar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué expresión significa "to be hot" (weather)?',
                      en: 'What expression means "to be hot" (weather)?',
                      pt: 'Que expressão significa "to be hot" (clima)?',
                      fr: 'Quelle expression signifie "to be hot" (météo)?',
                      it: 'Quale espressione significa "to be hot" (tempo)?',
                    },
                    options: [
                      { id: '1', label: { es: 'Hacer frío', en: 'Hacer frío', pt: 'Hacer frío', fr: 'Hacer frío', it: 'Hacer frío' }, correct: false },
                      { id: '2', label: { es: 'Hacer calor', en: 'Hacer calor', pt: 'Hacer calor', fr: 'Hacer calor', it: 'Hacer calor' }, correct: true },
                      { id: '3', label: { es: 'Llover', en: 'Llover', pt: 'Llover', fr: 'Llover', it: 'Llover' }, correct: false },
                      { id: '4', label: { es: 'Nevar', en: 'Nevar', pt: 'Nevar', fr: 'Nevar', it: 'Nevar' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones de clima:',
                      en: 'Select the weather expressions:',
                      pt: 'Selecione as expressões de clima:',
                      fr: 'Sélectionnez les expressions météorologiques:',
                      it: 'Seleziona le espressioni del tempo:',
                    },
                    options: [
                      { id: '1', label: { es: 'Hacer frío', en: 'Hacer frío', pt: 'Hacer frío', fr: 'Hacer frío', it: 'Hacer frío' }, correct: true },
                      { id: '2', label: { es: 'Viajar', en: 'Viajar', pt: 'Viajar', fr: 'Viajar', it: 'Viajar' }, correct: false },
                      { id: '3', label: { es: 'Llover', en: 'Llover', pt: 'Llover', fr: 'Llover', it: 'Llover' }, correct: true },
                      { id: '4', label: { es: 'Hacer calor', en: 'Hacer calor', pt: 'Hacer calor', fr: 'Hacer calor', it: 'Hacer calor' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cuál es una estación del año que empieza con "p"?',
                      en: 'What is a season that starts with "p"?',
                      pt: 'Qual é uma estação do ano que começa com "p"?',
                      fr: 'Quelle est une saison qui commence par "p"?',
                      it: 'Qual è una stagione che inizia con "p"?',
                    },
                    answer: { acceptable: ['primavera'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: 'El imperfecto se usa para acciones...',
                      en: 'The imperfect is used for actions...',
                      pt: 'O imperfeito é usado para ações...',
                      fr: 'L\'imparfait est utilisé pour les actions...',
                      it: 'L\'imperfetto è usato per azioni...',
                    },
                    options: [
                      { id: '1', label: { es: 'Completadas en el pasado', en: 'Completed in the past', pt: 'Completadas no passado', fr: 'Complétées au passé', it: 'Completate nel passato' }, correct: false },
                      { id: '2', label: { es: 'Habituales en el pasado', en: 'Habitual in the past', pt: 'Habituais no passado', fr: 'Habituelles au passé', it: 'Abituali nel passato' }, correct: true },
                      { id: '3', label: { es: 'En el futuro', en: 'In the future', pt: 'No futuro', fr: 'Au futur', it: 'Nel futuro' }, correct: false },
                      { id: '4', label: { es: 'En el presente', en: 'In the present', pt: 'No presente', fr: 'Au présent', it: 'Nel presente' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué tiempo verbal describes "what you used to do"?',
                      en: 'What verb tense describes "what you used to do"?',
                      pt: 'Que tempo verbal descreve "what you used to do"?',
                      fr: 'Quel temps verbal décrit "what you used to do"?',
                      it: 'Quale tempo verbale descrive "what you used to do"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Pretérito', en: 'Preterite', pt: 'Pretérito', fr: 'Prétérit', it: 'Preterito' }, correct: false },
                      { id: '2', label: { es: 'Imperfecto', en: 'Imperfect', pt: 'Imperfeito', fr: 'Imparfait', it: 'Imperfetto' }, correct: true },
                      { id: '3', label: { es: 'Presente', en: 'Present', pt: 'Presente', fr: 'Présent', it: 'Presente' }, correct: false },
                      { id: '4', label: { es: 'Futuro', en: 'Future', pt: 'Futuro', fr: 'Futur', it: 'Futuro' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones de clima con "hacer":',
                      en: 'Select the weather expressions with "hacer":',
                      pt: 'Selecione as expressões de clima com "hacer":',
                      fr: 'Sélectionnez les expressions météorologiques avec "hacer":',
                      it: 'Seleziona le espressioni del tempo con "hacer":',
                    },
                    options: [
                      { id: '1', label: { es: 'Hacer calor', en: 'Hacer calor', pt: 'Hacer calor', fr: 'Hacer calor', it: 'Hacer calor' }, correct: true },
                      { id: '2', label: { es: 'Llover', en: 'Llover', pt: 'Llover', fr: 'Llover', it: 'Llover' }, correct: false },
                      { id: '3', label: { es: 'Hacer frío', en: 'Hacer frío', pt: 'Hacer frío', fr: 'Hacer frío', it: 'Hacer frío' }, correct: true },
                      { id: '4', label: { es: 'Nevar', en: 'Nevar', pt: 'Nevar', fr: 'Nevar', it: 'Nevar' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuándo nieva?',
                      en: 'When does it snow?',
                      pt: 'Quando neva?',
                      fr: 'Quand neige-t-il?',
                      it: 'Quando nevica?',
                    },
                    options: [
                      { id: '1', label: { es: 'En verano', en: 'In summer', pt: 'No verão', fr: 'En été', it: 'In estate' }, correct: false },
                      { id: '2', label: { es: 'En invierno', en: 'In winter', pt: 'No inverno', fr: 'En hiver', it: 'In inverno' }, correct: true },
                      { id: '3', label: { es: 'En primavera', en: 'In spring', pt: 'Na primavera', fr: 'Au printemps', it: 'In primavera' }, correct: false },
                      { id: '4', label: { es: 'Nunca', en: 'Never', pt: 'Nunca', fr: 'Jamais', it: 'Mai' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué estación es "spring"?',
                      en: 'What season is "spring"?',
                      pt: 'Que estação é "spring"?',
                      fr: 'Quelle saison est "spring"?',
                      it: 'Che stagione è "spring"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Verano', en: 'Verano', pt: 'Verano', fr: 'Verano', it: 'Verano' }, correct: false },
                      { id: '2', label: { es: 'Otoño', en: 'Otoño', pt: 'Otoño', fr: 'Otoño', it: 'Otoño' }, correct: false },
                      { id: '3', label: { es: 'Primavera', en: 'Primavera', pt: 'Primavera', fr: 'Primavera', it: 'Primavera' }, correct: true },
                      { id: '4', label: { es: 'Invierno', en: 'Invierno', pt: 'Invierno', fr: 'Invierno', it: 'Invierno' }, correct: false },
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
                    stem: {
                      es: '¿Qué significa "carrera"?',
                      en: 'What does "carrera" mean?',
                      pt: 'O que significa "carrera"?',
                      fr: 'Que signifie "carrera"?',
                      it: 'Cosa significa "carrera"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Trabajo', en: 'Job', pt: 'Trabalho', fr: 'Travail', it: 'Lavoro' }, correct: false },
                      { id: '2', label: { es: 'Carrera', en: 'Career', pt: 'Carreira', fr: 'Carrière', it: 'Carriera' }, correct: true },
                      { id: '3', label: { es: 'Meta', en: 'Goal', pt: 'Meta', fr: 'Objectif', it: 'Obiettivo' }, correct: false },
                      { id: '4', label: { es: 'Futuro', en: 'Future', pt: 'Futuro', fr: 'Futur', it: 'Futuro' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "job/work" en español?',
                      en: 'How do you say "job/work" in Spanish?',
                      pt: 'Como se diz "job/work" em espanhol?',
                      fr: 'Comment dit-on "job/work" en espagnol?',
                      it: 'Come si dice "job/work" in spagnolo?',
                    },
                    answer: { acceptable: ['trabajo'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "meta"?',
                      en: 'What does "meta" mean?',
                      pt: 'O que significa "meta"?',
                      fr: 'Que signifie "meta"?',
                      it: 'Cosa significa "meta"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Carrera', en: 'Career', pt: 'Carreira', fr: 'Carrière', it: 'Carriera' }, correct: false },
                      { id: '2', label: { es: 'Trabajo', en: 'Work', pt: 'Trabalho', fr: 'Travail', it: 'Lavoro' }, correct: false },
                      { id: '3', label: { es: 'Meta', en: 'Goal', pt: 'Meta', fr: 'Objectif', it: 'Obiettivo' }, correct: true },
                      { id: '4', label: { es: 'Aspiración', en: 'Aspiration', pt: 'Aspiração', fr: 'Aspiration', it: 'Aspirazione' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras relacionadas con el futuro y las carreras:',
                      en: 'Select the words related to the future and careers:',
                      pt: 'Selecione as palavras relacionadas ao futuro e carreiras:',
                      fr: 'Sélectionnez les mots liés à l\'avenir et aux carrières:',
                      it: 'Seleziona le parole relative al futuro e alle carriere:',
                    },
                    options: [
                      { id: '1', label: { es: 'Aspiración', en: 'Aspiración', pt: 'Aspiración', fr: 'Aspiración', it: 'Aspiración' }, correct: true },
                      { id: '2', label: { es: 'Ayer', en: 'Ayer', pt: 'Ayer', fr: 'Ayer', it: 'Ayer' }, correct: false },
                      { id: '3', label: { es: 'Futuro', en: 'Futuro', pt: 'Futuro', fr: 'Futuro', it: 'Futuro' }, correct: true },
                      { id: '4', label: { es: 'Meta', en: 'Meta', pt: 'Meta', fr: 'Meta', it: 'Meta' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "future" en español?',
                      en: 'How do you say "future" in Spanish?',
                      pt: 'Como se diz "future" em espanhol?',
                      fr: 'Comment dit-on "future" en espagnol?',
                      it: 'Come si dice "future" in spagnolo?',
                    },
                    answer: { acceptable: ['futuro'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué estructura usas para expresar el futuro próximo?',
                      en: 'What structure do you use to express the near future?',
                      pt: 'Que estrutura você usa para expressar o futuro próximo?',
                      fr: 'Quelle structure utilisez-vous pour exprimer le futur proche?',
                      it: 'Quale struttura usi per esprimere il futuro prossimo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Pretérito', en: 'Preterite', pt: 'Pretérito', fr: 'Prétérit', it: 'Preterito' }, correct: false },
                      { id: '2', label: { es: 'Ir + a + infinitivo', en: 'Ir + a + infinitive', pt: 'Ir + a + infinitivo', fr: 'Ir + a + infinitif', it: 'Ir + a + infinito' }, correct: true },
                      { id: '3', label: { es: 'Imperfecto', en: 'Imperfect', pt: 'Imperfeito', fr: 'Imparfait', it: 'Imperfetto' }, correct: false },
                      { id: '4', label: { es: 'Presente perfecto', en: 'Present perfect', pt: 'Presente perfeito', fr: 'Passé composé', it: 'Passato prossimo' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál es el tiempo verbal para planes futuros?',
                      en: 'What is the verb tense for future plans?',
                      pt: 'Qual é o tempo verbal para planos futuros?',
                      fr: 'Quel est le temps verbal pour les plans futurs?',
                      it: 'Qual è il tempo verbale per i piani futuri?',
                    },
                    options: [
                      { id: '1', label: { es: 'Pasado', en: 'Past', pt: 'Passado', fr: 'Passé', it: 'Passato' }, correct: false },
                      { id: '2', label: { es: 'Presente', en: 'Present', pt: 'Presente', fr: 'Présent', it: 'Presente' }, correct: false },
                      { id: '3', label: { es: 'Futuro', en: 'Future', pt: 'Futuro', fr: 'Futur', it: 'Futuro' }, correct: true },
                      { id: '4', label: { es: 'Condicional', en: 'Conditional', pt: 'Condicional', fr: 'Conditionnel', it: 'Condizionale' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones correctas sobre el futuro:',
                      en: 'Select the correct expressions about the future:',
                      pt: 'Selecione as expressões corretas sobre o futuro:',
                      fr: 'Sélectionnez les expressions correctes sur l\'avenir:',
                      it: 'Seleziona le espressioni corrette sul futuro:',
                    },
                    options: [
                      { id: '1', label: { es: 'Voy a estudiar', en: 'Voy a estudiar', pt: 'Voy a estudiar', fr: 'Voy a estudiar', it: 'Voy a estudiar' }, correct: true },
                      { id: '2', label: { es: 'Estudié ayer', en: 'Estudié ayer', pt: 'Estudié ayer', fr: 'Estudié ayer', it: 'Estudié ayer' }, correct: false },
                      { id: '3', label: { es: 'Trabajaré mañana', en: 'Trabajaré mañana', pt: 'Trabajaré mañana', fr: 'Trabajaré mañana', it: 'Trabajaré mañana' }, correct: true },
                      { id: '4', label: { es: 'Tengo una meta', en: 'Tengo una meta', pt: 'Tengo una meta', fr: 'Tengo una meta', it: 'Tengo una meta' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué palabra significa "aspiration"?',
                      en: 'What word means "aspiration"?',
                      pt: 'Que palavra significa "aspiration"?',
                      fr: 'Quel mot signifie "aspiration"?',
                      it: 'Quale parola significa "aspiration"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Trabajo', en: 'Trabajo', pt: 'Trabajo', fr: 'Trabajo', it: 'Trabajo' }, correct: false },
                      { id: '2', label: { es: 'Aspiración', en: 'Aspiración', pt: 'Aspiración', fr: 'Aspiración', it: 'Aspiración' }, correct: true },
                      { id: '3', label: { es: 'Meta', en: 'Meta', pt: 'Meta', fr: 'Meta', it: 'Meta' }, correct: false },
                      { id: '4', label: { es: 'Carrera', en: 'Carrera', pt: 'Carrera', fr: 'Carrera', it: 'Carrera' }, correct: false },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: 'Para hablar de "what I am going to do", uso...',
                      en: 'To talk about "what I am going to do", I use...',
                      pt: 'Para falar sobre "what I am going to do", uso...',
                      fr: 'Pour parler de "what I am going to do", j\'utilise...',
                      it: 'Per parlare di "what I am going to do", uso...',
                    },
                    options: [
                      { id: '1', label: { es: 'Voy a + infinitivo', en: 'Voy a + infinitive', pt: 'Voy a + infinitivo', fr: 'Voy a + infinitif', it: 'Voy a + infinito' }, correct: true },
                      { id: '2', label: { es: 'Fui a + infinitivo', en: 'Fui a + infinitive', pt: 'Fui a + infinitivo', fr: 'Fui a + infinitif', it: 'Fui a + infinito' }, correct: false },
                      { id: '3', label: { es: 'Iba a + infinitivo', en: 'Iba a + infinitive', pt: 'Iba a + infinitivo', fr: 'Iba a + infinitif', it: 'Iba a + infinito' }, correct: false },
                      { id: '4', label: { es: 'He ido a + infinitivo', en: 'He ido a + infinitive', pt: 'He ido a + infinitivo', fr: 'He ido a + infinitif', it: 'He ido a + infinito' }, correct: false },
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
                    stem: {
                      es: '¿Qué parte del cuerpo es "head"?',
                      en: 'What body part is "head"?',
                      pt: 'Que parte do corpo é "head"?',
                      fr: 'Quelle partie du corps est "head"?',
                      it: 'Quale parte del corpo è "head"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Brazo', en: 'Brazo', pt: 'Brazo', fr: 'Brazo', it: 'Brazo' }, correct: false },
                      { id: '2', label: { es: 'Cabeza', en: 'Cabeza', pt: 'Cabeza', fr: 'Cabeza', it: 'Cabeza' }, correct: true },
                      { id: '3', label: { es: 'Pierna', en: 'Pierna', pt: 'Pierna', fr: 'Pierna', it: 'Pierna' }, correct: false },
                      { id: '4', label: { es: 'Mano', en: 'Mano', pt: 'Mano', fr: 'Mano', it: 'Mano' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "arm" en español?',
                      en: 'How do you say "arm" in Spanish?',
                      pt: 'Como se diz "arm" em espanhol?',
                      fr: 'Comment dit-on "arm" en espagnol?',
                      it: 'Come si dice "arm" in spagnolo?',
                    },
                    answer: { acceptable: ['brazo'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las partes del cuerpo:',
                      en: 'Select the body parts:',
                      pt: 'Selecione as partes do corpo:',
                      fr: 'Sélectionnez les parties du corps:',
                      it: 'Seleziona le parti del corpo:',
                    },
                    options: [
                      { id: '1', label: { es: 'Pierna', en: 'Pierna', pt: 'Pierna', fr: 'Pierna', it: 'Pierna' }, correct: true },
                      { id: '2', label: { es: 'Dolor', en: 'Dolor', pt: 'Dolor', fr: 'Dolor', it: 'Dolor' }, correct: false },
                      { id: '3', label: { es: 'Mano', en: 'Mano', pt: 'Mano', fr: 'Mano', it: 'Mano' }, correct: true },
                      { id: '4', label: { es: 'Ojo', en: 'Ojo', pt: 'Ojo', fr: 'Ojo', it: 'Ojo' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué significa "pain"?',
                      en: 'What does "pain" mean?',
                      pt: 'O que significa "pain"?',
                      fr: 'Que signifie "pain"?',
                      it: 'Cosa significa "pain"?',
                    },
                    answer: { acceptable: ['dolor'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "médico"?',
                      en: 'What does "médico" mean?',
                      pt: 'O que significa "médico"?',
                      fr: 'Que signifie "médico"?',
                      it: 'Cosa significa "médico"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Medicine', en: 'Medicine', pt: 'Medicine', fr: 'Medicine', it: 'Medicine' }, correct: false },
                      { id: '2', label: { es: 'Doctor', en: 'Doctor', pt: 'Doctor', fr: 'Doctor', it: 'Doctor' }, correct: true },
                      { id: '3', label: { es: 'Illness', en: 'Illness', pt: 'Illness', fr: 'Illness', it: 'Illness' }, correct: false },
                      { id: '4', label: { es: 'Fever', en: 'Fever', pt: 'Fever', fr: 'Fever', it: 'Fever' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras relacionadas con la salud:',
                      en: 'Select the words related to health:',
                      pt: 'Selecione as palavras relacionadas à saúde:',
                      fr: 'Sélectionnez les mots liés à la santé:',
                      it: 'Seleziona le parole relative alla salute:',
                    },
                    options: [
                      { id: '1', label: { es: 'Enfermedad', en: 'Enfermedad', pt: 'Enfermedad', fr: 'Enfermedad', it: 'Enfermedad' }, correct: true },
                      { id: '2', label: { es: 'Libro', en: 'Libro', pt: 'Libro', fr: 'Libro', it: 'Libro' }, correct: false },
                      { id: '3', label: { es: 'Medicina', en: 'Medicina', pt: 'Medicina', fr: 'Medicina', it: 'Medicina' }, correct: true },
                      { id: '4', label: { es: 'Fiebre', en: 'Fiebre', pt: 'Fiebre', fr: 'Fiebre', it: 'Fiebre' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "exercise" en español?',
                      en: 'How do you say "exercise" in Spanish?',
                      pt: 'Como se diz "exercise" em espanhol?',
                      fr: 'Comment dit-on "exercise" en espagnol?',
                      it: 'Come si dice "exercise" in spagnolo?',
                    },
                    answer: { acceptable: ['ejercicio'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "saludable"?',
                      en: 'What does "saludable" mean?',
                      pt: 'O que significa "saludable"?',
                      fr: 'Que signifie "saludable"?',
                      it: 'Cosa significa "saludable"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Sick', en: 'Sick', pt: 'Sick', fr: 'Sick', it: 'Sick' }, correct: false },
                      { id: '2', label: { es: 'Healthy', en: 'Healthy', pt: 'Healthy', fr: 'Healthy', it: 'Healthy' }, correct: true },
                      { id: '3', label: { es: 'Medicine', en: 'Medicine', pt: 'Medicine', fr: 'Medicine', it: 'Medicine' }, correct: false },
                      { id: '4', label: { es: 'Diet', en: 'Diet', pt: 'Diet', fr: 'Diet', it: 'Diet' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las actividades de bienestar:',
                      en: 'Select the wellness activities:',
                      pt: 'Selecione as atividades de bem-estar:',
                      fr: 'Sélectionnez les activités de bien-être:',
                      it: 'Seleziona le attività di benessere:',
                    },
                    options: [
                      { id: '1', label: { es: 'Ejercicio', en: 'Ejercicio', pt: 'Ejercicio', fr: 'Ejercicio', it: 'Ejercicio' }, correct: true },
                      { id: '2', label: { es: 'Enfermedad', en: 'Enfermedad', pt: 'Enfermedad', fr: 'Enfermedad', it: 'Enfermedad' }, correct: false },
                      { id: '3', label: { es: 'Descansar', en: 'Descansar', pt: 'Descansar', fr: 'Descansar', it: 'Descansar' }, correct: true },
                      { id: '4', label: { es: 'Dieta', en: 'Dieta', pt: 'Dieta', fr: 'Dieta', it: 'Dieta' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué parte del cuerpo es "foot"?',
                      en: 'What body part is "foot"?',
                      pt: 'Que parte do corpo é "foot"?',
                      fr: 'Quelle partie du corps est "foot"?',
                      it: 'Quale parte del corpo è "foot"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Mano', en: 'Mano', pt: 'Mano', fr: 'Mano', it: 'Mano' }, correct: false },
                      { id: '2', label: { es: 'Brazo', en: 'Brazo', pt: 'Brazo', fr: 'Brazo', it: 'Brazo' }, correct: false },
                      { id: '3', label: { es: 'Pie', en: 'Pie', pt: 'Pie', fr: 'Pie', it: 'Pie' }, correct: true },
                      { id: '4', label: { es: 'Pierna', en: 'Pierna', pt: 'Pierna', fr: 'Pierna', it: 'Pierna' }, correct: false },
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
                    stem: {
                      es: '¿Qué animal doméstico es "dog"?',
                      en: 'What domestic animal is "dog"?',
                      pt: 'Que animal doméstico é "dog"?',
                      fr: 'Quel animal domestique est "dog"?',
                      it: 'Quale animale domestico è "dog"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Gato', en: 'Gato', pt: 'Gato', fr: 'Gato', it: 'Gato' }, correct: false },
                      { id: '2', label: { es: 'Perro', en: 'Perro', pt: 'Perro', fr: 'Perro', it: 'Perro' }, correct: true },
                      { id: '3', label: { es: 'Pájaro', en: 'Pájaro', pt: 'Pájaro', fr: 'Pájaro', it: 'Pájaro' }, correct: false },
                      { id: '4', label: { es: 'Pez', en: 'Pez', pt: 'Pez', fr: 'Pez', it: 'Pez' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "tree" en español?',
                      en: 'How do you say "tree" in Spanish?',
                      pt: 'Como se diz "tree" em espanhol?',
                      fr: 'Comment dit-on "tree" en espagnol?',
                      it: 'Come si dice "tree" in spagnolo?',
                    },
                    answer: { acceptable: ['árbol', 'arbol'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona elementos de la naturaleza:',
                      en: 'Select elements of nature:',
                      pt: 'Selecione elementos da natureza:',
                      fr: 'Sélectionnez les éléments de la nature:',
                      it: 'Seleziona elementi della natura:',
                    },
                    options: [
                      { id: '1', label: { es: 'Flor', en: 'Flor', pt: 'Flor', fr: 'Flor', it: 'Flor' }, correct: true },
                      { id: '2', label: { es: 'Médico', en: 'Médico', pt: 'Médico', fr: 'Médico', it: 'Médico' }, correct: false },
                      { id: '3', label: { es: 'Bosque', en: 'Bosque', pt: 'Bosque', fr: 'Bosque', it: 'Bosque' }, correct: true },
                      { id: '4', label: { es: 'Árbol', en: 'Árbol', pt: 'Árbol', fr: 'Árbol', it: 'Árbol' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "pollution"?',
                      en: 'What word means "pollution"?',
                      pt: 'Que palavra significa "pollution"?',
                      fr: 'Quel mot signifie "pollution"?',
                      it: 'Quale parola significa "pollution"?',
                    },
                    answer: { acceptable: ['contaminación', 'contaminacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to recycle"?',
                      en: 'What verb means "to recycle"?',
                      pt: 'Que verbo significa "to recycle"?',
                      fr: 'Quel verbe signifie "to recycle"?',
                      it: 'Quale verbo significa "to recycle"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Contaminar', en: 'Contaminar', pt: 'Contaminar', fr: 'Contaminar', it: 'Contaminar' }, correct: false },
                      { id: '2', label: { es: 'Reciclar', en: 'Reciclar', pt: 'Reciclar', fr: 'Reciclar', it: 'Reciclar' }, correct: true },
                      { id: '3', label: { es: 'Proteger', en: 'Proteger', pt: 'Proteger', fr: 'Proteger', it: 'Proteger' }, correct: false },
                      { id: '4', label: { es: 'Destruir', en: 'Destruir', pt: 'Destruir', fr: 'Destruir', it: 'Destruir' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las formaciones geográficas:',
                      en: 'Select the geographical formations:',
                      pt: 'Selecione as formações geográficas:',
                      fr: 'Sélectionnez les formations géographiques:',
                      it: 'Seleziona le formazioni geografiche:',
                    },
                    options: [
                      { id: '1', label: { es: 'Montaña', en: 'Montaña', pt: 'Montaña', fr: 'Montaña', it: 'Montaña' }, correct: true },
                      { id: '2', label: { es: 'Animal', en: 'Animal', pt: 'Animal', fr: 'Animal', it: 'Animal' }, correct: false },
                      { id: '3', label: { es: 'Río', en: 'Río', pt: 'Río', fr: 'Río', it: 'Río' }, correct: true },
                      { id: '4', label: { es: 'Valle', en: 'Valle', pt: 'Valle', fr: 'Valle', it: 'Valle' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "sea/ocean" en español?',
                      en: 'How do you say "sea/ocean" in Spanish?',
                      pt: 'Como se diz "sea/ocean" em espanhol?',
                      fr: 'Comment dit-on "sea/ocean" en espagnol?',
                      it: 'Come si dice "sea/ocean" in spagnolo?',
                    },
                    answer: { acceptable: ['mar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "playa"?',
                      en: 'What does "playa" mean?',
                      pt: 'O que significa "playa"?',
                      fr: 'Que signifie "playa"?',
                      it: 'Cosa significa "playa"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Mountain', en: 'Mountain', pt: 'Mountain', fr: 'Mountain', it: 'Mountain' }, correct: false },
                      { id: '2', label: { es: 'Beach', en: 'Beach', pt: 'Beach', fr: 'Beach', it: 'Beach' }, correct: true },
                      { id: '3', label: { es: 'River', en: 'River', pt: 'River', fr: 'River', it: 'River' }, correct: false },
                      { id: '4', label: { es: 'Desert', en: 'Desert', pt: 'Desert', fr: 'Desert', it: 'Desert' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras ambientales:',
                      en: 'Select the environmental words:',
                      pt: 'Selecione as palavras ambientais:',
                      fr: 'Sélectionnez les mots environnementaux:',
                      it: 'Seleziona le parole ambientali:',
                    },
                    options: [
                      { id: '1', label: { es: 'Proteger', en: 'Proteger', pt: 'Proteger', fr: 'Proteger', it: 'Proteger' }, correct: true },
                      { id: '2', label: { es: 'Bailar', en: 'Bailar', pt: 'Bailar', fr: 'Bailar', it: 'Bailar' }, correct: false },
                      { id: '3', label: { es: 'Naturaleza', en: 'Naturaleza', pt: 'Naturaleza', fr: 'Naturaleza', it: 'Naturaleza' }, correct: true },
                      { id: '4', label: { es: 'Clima', en: 'Clima', pt: 'Clima', fr: 'Clima', it: 'Clima' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué formación geográfica es "desert"?',
                      en: 'What geographical formation is "desert"?',
                      pt: 'Que formação geográfica é "desert"?',
                      fr: 'Quelle formation géographique est "desert"?',
                      it: 'Quale formazione geografica è "desert"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Bosque', en: 'Bosque', pt: 'Bosque', fr: 'Bosque', it: 'Bosque' }, correct: false },
                      { id: '2', label: { es: 'Mar', en: 'Mar', pt: 'Mar', fr: 'Mar', it: 'Mar' }, correct: false },
                      { id: '3', label: { es: 'Desierto', en: 'Desierto', pt: 'Desierto', fr: 'Desierto', it: 'Desierto' }, correct: true },
                      { id: '4', label: { es: 'Valle', en: 'Valle', pt: 'Valle', fr: 'Valle', it: 'Valle' }, correct: false },
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
                    stem: {
                      es: '¿Qué verbo significa "to want/wish"?',
                      en: 'What verb means "to want/wish"?',
                      pt: 'Que verbo significa "to want/wish"?',
                      fr: 'Quel verbe signifie "to want/wish"?',
                      it: 'Quale verbo significa "to want/wish"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Esperar', en: 'Esperar', pt: 'Esperar', fr: 'Esperar', it: 'Esperar' }, correct: false },
                      { id: '2', label: { es: 'Querer', en: 'Querer', pt: 'Querer', fr: 'Querer', it: 'Querer' }, correct: true },
                      { id: '3', label: { es: 'Dudar', en: 'Dudar', pt: 'Dudar', fr: 'Dudar', it: 'Dudar' }, correct: false },
                      { id: '4', label: { es: 'Temer', en: 'Temer', pt: 'Temer', fr: 'Temer', it: 'Temer' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "to hope" en español?',
                      en: 'How do you say "to hope" in Spanish?',
                      pt: 'Como se diz "to hope" em espanhol?',
                      fr: 'Comment dit-on "to hope" en espagnol?',
                      it: 'Come si dice "to hope" in spagnolo?',
                    },
                    answer: { acceptable: ['esperar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "dudar"?',
                      en: 'What does "dudar" mean?',
                      pt: 'O que significa "dudar"?',
                      fr: 'Que signifie "dudar"?',
                      it: 'Cosa significa "dudar"?',
                    },
                    options: [
                      { id: '1', label: { es: 'To hope', en: 'To hope', pt: 'To hope', fr: 'To hope', it: 'To hope' }, correct: false },
                      { id: '2', label: { es: 'To want', en: 'To want', pt: 'To want', fr: 'To want', it: 'To want' }, correct: false },
                      { id: '3', label: { es: 'To doubt', en: 'To doubt', pt: 'To doubt', fr: 'To doubt', it: 'To doubt' }, correct: true },
                      { id: '4', label: { es: 'To deny', en: 'To deny', pt: 'To deny', fr: 'To deny', it: 'To deny' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los verbos que requieren subjuntivo:',
                      en: 'Select the verbs that require subjunctive:',
                      pt: 'Selecione os verbos que exigem subjuntivo:',
                      fr: 'Sélectionnez les verbes qui nécessitent le subjonctif:',
                      it: 'Seleziona i verbi che richiedono il congiuntivo:',
                    },
                    options: [
                      { id: '1', label: { es: 'Querer', en: 'Querer', pt: 'Querer', fr: 'Querer', it: 'Querer' }, correct: true },
                      { id: '2', label: { es: 'Saber', en: 'Saber', pt: 'Saber', fr: 'Saber', it: 'Saber' }, correct: false },
                      { id: '3', label: { es: 'Esperar', en: 'Esperar', pt: 'Esperar', fr: 'Esperar', it: 'Esperar' }, correct: true },
                      { id: '4', label: { es: 'Desear', en: 'Desear', pt: 'Desear', fr: 'Desear', it: 'Desear' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué verbo significa "to deny"?',
                      en: 'What verb means "to deny"?',
                      pt: 'Que verbo significa "to deny"?',
                      fr: 'Quel verbe signifie "to deny"?',
                      it: 'Quale verbo significa "to deny"?',
                    },
                    answer: { acceptable: ['negar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "temer"?',
                      en: 'What does "temer" mean?',
                      pt: 'O que significa "temer"?',
                      fr: 'Que signifie "temer"?',
                      it: 'Cosa significa "temer"?',
                    },
                    options: [
                      { id: '1', label: { es: 'To want', en: 'To want', pt: 'To want', fr: 'To want', it: 'To want' }, correct: false },
                      { id: '2', label: { es: 'To fear', en: 'To fear', pt: 'To fear', fr: 'To fear', it: 'To fear' }, correct: true },
                      { id: '3', label: { es: 'To hope', en: 'To hope', pt: 'To hope', fr: 'To hope', it: 'To hope' }, correct: false },
                      { id: '4', label: { es: 'To doubt', en: 'To doubt', pt: 'To doubt', fr: 'To doubt', it: 'To doubt' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las expresiones de emoción:',
                      en: 'Select the expressions of emotion:',
                      pt: 'Selecione as expressões de emoção:',
                      fr: 'Sélectionnez les expressions d\'émotion:',
                      it: 'Seleziona le espressioni di emozione:',
                    },
                    options: [
                      { id: '1', label: { es: 'Alegrarse', en: 'Alegrarse', pt: 'Alegrarse', fr: 'Alegrarse', it: 'Alegrarse' }, correct: true },
                      { id: '2', label: { es: 'Trabajar', en: 'Trabajar', pt: 'Trabajar', fr: 'Trabajar', it: 'Trabajar' }, correct: false },
                      { id: '3', label: { es: 'Temer', en: 'Temer', pt: 'Temer', fr: 'Temer', it: 'Temer' }, correct: true },
                      { id: '4', label: { es: 'Desear', en: 'Desear', pt: 'Desear', fr: 'Desear', it: 'Desear' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: 'El subjuntivo se usa después de expresiones de...',
                      en: 'The subjunctive is used after expressions of...',
                      pt: 'O subjuntivo é usado após expressões de...',
                      fr: 'Le subjonctif est utilisé après des expressions de...',
                      it: 'Il congiuntivo si usa dopo espressioni di...',
                    },
                    options: [
                      { id: '1', label: { es: 'Certeza', en: 'Certeza', pt: 'Certeza', fr: 'Certeza', it: 'Certeza' }, correct: false },
                      { id: '2', label: { es: 'Deseo y duda', en: 'Deseo y duda', pt: 'Deseo y duda', fr: 'Deseo y duda', it: 'Deseo y duda' }, correct: true },
                      { id: '3', label: { es: 'Hechos', en: 'Hechos', pt: 'Hechos', fr: 'Hechos', it: 'Hechos' }, correct: false },
                      { id: '4', label: { es: 'Verdad', en: 'Verdad', pt: 'Verdad', fr: 'Verdad', it: 'Verdad' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué verbo significa "to desire/wish"?',
                      en: 'What verb means "to desire/wish"?',
                      pt: 'Que verbo significa "to desire/wish"?',
                      fr: 'Quel verbe signifie "to desire/wish"?',
                      it: 'Quale verbo significa "to desire/wish"?',
                    },
                    answer: { acceptable: ['desear'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Cuál frase requiere subjuntivo?',
                      en: 'Which phrase requires subjunctive?',
                      pt: 'Qual frase requer subjuntivo?',
                      fr: 'Quelle phrase nécessite le subjonctif?',
                      it: 'Quale frase richiede il congiuntivo?',
                    },
                    options: [
                      { id: '1', label: { es: 'Yo sé que...', en: 'Yo sé que...', pt: 'Yo sé que...', fr: 'Yo sé que...', it: 'Yo sé que...' }, correct: false },
                      { id: '2', label: { es: 'Es cierto que...', en: 'Es cierto que...', pt: 'Es cierto que...', fr: 'Es cierto que...', it: 'Es cierto que...' }, correct: false },
                      { id: '3', label: { es: 'Espero que...', en: 'Espero que...', pt: 'Espero que...', fr: 'Espero que...', it: 'Espero que...' }, correct: true },
                      { id: '4', label: { es: 'Creo que...', en: 'Creo que...', pt: 'Creo que...', fr: 'Creo que...', it: 'Creo que...' }, correct: false },
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
                    stem: {
                      es: '¿Qué verbo significa "to argue/make an argument"?',
                      en: 'What verb means "to argue/make an argument"?',
                      pt: 'Que verbo significa "to argue/make an argument"?',
                      fr: 'Quel verbe signifie "to argue/make an argument"?',
                      it: 'Quale verbo significa "to argue/make an argument"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Convencer', en: 'Convencer', pt: 'Convencer', fr: 'Convencer', it: 'Convencer' }, correct: false },
                      { id: '2', label: { es: 'Argumentar', en: 'Argumentar', pt: 'Argumentar', fr: 'Argumentar', it: 'Argumentar' }, correct: true },
                      { id: '3', label: { es: 'Persuadir', en: 'Persuadir', pt: 'Persuadir', fr: 'Persuadir', it: 'Persuadir' }, correct: false },
                      { id: '4', label: { es: 'Negociar', en: 'Negociar', pt: 'Negociar', fr: 'Negociar', it: 'Negociar' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "to convince" en español?',
                      en: 'How do you say "to convince" in Spanish?',
                      pt: 'Como se diz "to convince" em espanhol?',
                      fr: 'Comment dit-on "to convince" en espagnol?',
                      it: 'Come si dice "to convince" in spagnolo?',
                    },
                    answer: { acceptable: ['convencer'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las actividades de debate:',
                      en: 'Select the debate activities:',
                      pt: 'Selecione as atividades de debate:',
                      fr: 'Sélectionnez les activités de débat:',
                      it: 'Seleziona le attività di dibattito:',
                    },
                    options: [
                      { id: '1', label: { es: 'Debatir', en: 'Debatir', pt: 'Debatir', fr: 'Debatir', it: 'Debatir' }, correct: true },
                      { id: '2', label: { es: 'Dormir', en: 'Dormir', pt: 'Dormir', fr: 'Dormir', it: 'Dormir' }, correct: false },
                      { id: '3', label: { es: 'Argumentar', en: 'Argumentar', pt: 'Argumentar', fr: 'Argumentar', it: 'Argumentar' }, correct: true },
                      { id: '4', label: { es: 'Persuadir', en: 'Persuadir', pt: 'Persuadir', fr: 'Persuadir', it: 'Persuadir' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "news"?',
                      en: 'What word means "news"?',
                      pt: 'Que palavra significa "news"?',
                      fr: 'Quel mot signifie "news"?',
                      it: 'Quale parola significa "news"?',
                    },
                    answer: { acceptable: ['noticia', 'noticias'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "actualidad"?',
                      en: 'What does "actualidad" mean?',
                      pt: 'O que significa "actualidad"?',
                      fr: 'Que signifie "actualidad"?',
                      it: 'Cosa significa "actualidad"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Past', en: 'Past', pt: 'Past', fr: 'Past', it: 'Past' }, correct: false },
                      { id: '2', label: { es: 'Current events', en: 'Current events', pt: 'Current events', fr: 'Current events', it: 'Current events' }, correct: true },
                      { id: '3', label: { es: 'Future', en: 'Future', pt: 'Future', fr: 'Future', it: 'Future' }, correct: false },
                      { id: '4', label: { es: 'Politics', en: 'Politics', pt: 'Politics', fr: 'Politics', it: 'Politics' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras profesionales:',
                      en: 'Select the professional words:',
                      pt: 'Selecione as palavras profissionais:',
                      fr: 'Sélectionnez les mots professionnels:',
                      it: 'Seleziona le parole professionali:',
                    },
                    options: [
                      { id: '1', label: { es: 'Reunión', en: 'Reunión', pt: 'Reunión', fr: 'Reunión', it: 'Reunión' }, correct: true },
                      { id: '2', label: { es: 'Bailar', en: 'Bailar', pt: 'Bailar', fr: 'Bailar', it: 'Bailar' }, correct: false },
                      { id: '3', label: { es: 'Presentación', en: 'Presentación', pt: 'Presentación', fr: 'Presentación', it: 'Presentación' }, correct: true },
                      { id: '4', label: { es: 'Informe', en: 'Informe', pt: 'Informe', fr: 'Informe', it: 'Informe' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "to negotiate" en español?',
                      en: 'How do you say "to negotiate" in Spanish?',
                      pt: 'Como se diz "to negotiate" em espanhol?',
                      fr: 'Comment dit-on "to negotiate" en espagnol?',
                      it: 'Come si dice "to negotiate" in spagnolo?',
                    },
                    answer: { acceptable: ['negociar'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué es una "reunión"?',
                      en: 'What is a "reunión"?',
                      pt: 'O que é uma "reunión"?',
                      fr: 'Qu\'est-ce qu\'une "reunión"?',
                      it: 'Cos\'è una "reunión"?',
                    },
                    options: [
                      { id: '1', label: { es: 'A meeting', en: 'A meeting', pt: 'A meeting', fr: 'A meeting', it: 'A meeting' }, correct: true },
                      { id: '2', label: { es: 'A report', en: 'A report', pt: 'A report', fr: 'A report', it: 'A report' }, correct: false },
                      { id: '3', label: { es: 'A presentation', en: 'A presentation', pt: 'A presentation', fr: 'A presentation', it: 'A presentation' }, correct: false },
                      { id: '4', label: { es: 'An event', en: 'An event', pt: 'An event', fr: 'An event', it: 'An event' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras relacionadas con noticias:',
                      en: 'Select the words related to news:',
                      pt: 'Selecione as palavras relacionadas a notícias:',
                      fr: 'Sélectionnez les mots liés aux nouvelles:',
                      it: 'Seleziona le parole relative alle notizie:',
                    },
                    options: [
                      { id: '1', label: { es: 'Noticia', en: 'Noticia', pt: 'Noticia', fr: 'Noticia', it: 'Noticia' }, correct: true },
                      { id: '2', label: { es: 'Reunión', en: 'Reunión', pt: 'Reunión', fr: 'Reunión', it: 'Reunión' }, correct: false },
                      { id: '3', label: { es: 'Evento', en: 'Evento', pt: 'Evento', fr: 'Evento', it: 'Evento' }, correct: true },
                      { id: '4', label: { es: 'Política', en: 'Política', pt: 'Política', fr: 'Política', it: 'Política' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué actividad es "presentación"?',
                      en: 'What activity is "presentación"?',
                      pt: 'Que atividade é "presentación"?',
                      fr: 'Quelle activité est "presentación"?',
                      it: 'Quale attività è "presentación"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Meeting', en: 'Meeting', pt: 'Meeting', fr: 'Meeting', it: 'Meeting' }, correct: false },
                      { id: '2', label: { es: 'Presentation', en: 'Presentation', pt: 'Presentation', fr: 'Presentation', it: 'Presentation' }, correct: true },
                      { id: '3', label: { es: 'Report', en: 'Report', pt: 'Report', fr: 'Report', it: 'Report' }, correct: false },
                      { id: '4', label: { es: 'Negotiation', en: 'Negotiation', pt: 'Negotiation', fr: 'Negotiation', it: 'Negotiation' }, correct: false },
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
                    stem: {
                      es: '¿Qué es un "poeta"?',
                      en: 'What is a "poeta"?',
                      pt: 'O que é um "poeta"?',
                      fr: 'Qu\'est-ce qu\'un "poeta"?',
                      it: 'Cos\'è un "poeta"?',
                    },
                    options: [
                      { id: '1', label: { es: 'A painter', en: 'A painter', pt: 'A painter', fr: 'A painter', it: 'A painter' }, correct: false },
                      { id: '2', label: { es: 'A poet', en: 'A poet', pt: 'A poet', fr: 'A poet', it: 'A poet' }, correct: true },
                      { id: '3', label: { es: 'An actor', en: 'An actor', pt: 'An actor', fr: 'An actor', it: 'An actor' }, correct: false },
                      { id: '4', label: { es: 'A sculptor', en: 'A sculptor', pt: 'A sculptor', fr: 'A sculptor', it: 'A sculptor' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "painting" (el arte) en español?',
                      en: 'How do you say "painting" (the art) in Spanish?',
                      pt: 'Como se diz "painting" (a arte) em espanhol?',
                      fr: 'Comment dit-on "painting" (l\'art) en espagnol?',
                      it: 'Come si dice "painting" (l\'arte) in spagnolo?',
                    },
                    answer: { acceptable: ['pintura'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras literarias:',
                      en: 'Select the literary words:',
                      pt: 'Selecione as palavras literárias:',
                      fr: 'Sélectionnez les mots littéraires:',
                      it: 'Seleziona le parole letterarie:',
                    },
                    options: [
                      { id: '1', label: { es: 'Verso', en: 'Verso', pt: 'Verso', fr: 'Verso', it: 'Verso' }, correct: true },
                      { id: '2', label: { es: 'Pintura', en: 'Pintura', pt: 'Pintura', fr: 'Pintura', it: 'Pintura' }, correct: false },
                      { id: '3', label: { es: 'Metáfora', en: 'Metáfora', pt: 'Metáfora', fr: 'Metáfora', it: 'Metáfora' }, correct: true },
                      { id: '4', label: { es: 'Narrativa', en: 'Narrativa', pt: 'Narrativa', fr: 'Narrativa', it: 'Narrativa' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "artist"?',
                      en: 'What word means "artist"?',
                      pt: 'Que palavra significa "artist"?',
                      fr: 'Quel mot signifie "artist"?',
                      it: 'Quale parola significa "artist"?',
                    },
                    answer: { acceptable: ['artista'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué es una "galería"?',
                      en: 'What is a "galería"?',
                      pt: 'O que é uma "galería"?',
                      fr: 'Qu\'est-ce qu\'une "galería"?',
                      it: 'Cos\'è una "galería"?',
                    },
                    options: [
                      { id: '1', label: { es: 'A poem', en: 'A poem', pt: 'A poem', fr: 'A poem', it: 'A poem' }, correct: false },
                      { id: '2', label: { es: 'An art gallery', en: 'An art gallery', pt: 'An art gallery', fr: 'An art gallery', it: 'An art gallery' }, correct: true },
                      { id: '3', label: { es: 'A movie', en: 'A movie', pt: 'A movie', fr: 'A movie', it: 'A movie' }, correct: false },
                      { id: '4', label: { es: 'A book', en: 'A book', pt: 'A book', fr: 'A book', it: 'A book' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras relacionadas con el cine:',
                      en: 'Select the words related to cinema:',
                      pt: 'Selecione as palavras relacionadas ao cinema:',
                      fr: 'Sélectionnez les mots liés au cinéma:',
                      it: 'Seleziona le parole relative al cinema:',
                    },
                    options: [
                      { id: '1', label: { es: 'Director', en: 'Director', pt: 'Director', fr: 'Director', it: 'Director' }, correct: true },
                      { id: '2', label: { es: 'Poeta', en: 'Poeta', pt: 'Poeta', fr: 'Poeta', it: 'Poeta' }, correct: false },
                      { id: '3', label: { es: 'Actor', en: 'Actor', pt: 'Actor', fr: 'Actor', it: 'Actor' }, correct: true },
                      { id: '4', label: { es: 'Película', en: 'Película', pt: 'Película', fr: 'Película', it: 'Película' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "sculpture" en español?',
                      en: 'How do you say "sculpture" in Spanish?',
                      pt: 'Como se diz "sculpture" em espanhol?',
                      fr: 'Comment dit-on "sculpture" en espagnol?',
                      it: 'Come si dice "sculpture" in spagnolo?',
                    },
                    answer: { acceptable: ['escultura'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué es un "guion"?',
                      en: 'What is a "guion"?',
                      pt: 'O que é um "guion"?',
                      fr: 'Qu\'est-ce qu\'un "guion"?',
                      it: 'Cos\'è un "guion"?',
                    },
                    options: [
                      { id: '1', label: { es: 'A painting', en: 'A painting', pt: 'A painting', fr: 'A painting', it: 'A painting' }, correct: false },
                      { id: '2', label: { es: 'A sculpture', en: 'A sculpture', pt: 'A sculpture', fr: 'A sculpture', it: 'A sculpture' }, correct: false },
                      { id: '3', label: { es: 'A script', en: 'A script', pt: 'A script', fr: 'A script', it: 'A script' }, correct: true },
                      { id: '4', label: { es: 'A gallery', en: 'A gallery', pt: 'A gallery', fr: 'A gallery', it: 'A gallery' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las artes visuales:',
                      en: 'Select the visual arts:',
                      pt: 'Selecione as artes visuais:',
                      fr: 'Sélectionnez les arts visuels:',
                      it: 'Seleziona le arti visive:',
                    },
                    options: [
                      { id: '1', label: { es: 'Pintura', en: 'Pintura', pt: 'Pintura', fr: 'Pintura', it: 'Pintura' }, correct: true },
                      { id: '2', label: { es: 'Verso', en: 'Verso', pt: 'Verso', fr: 'Verso', it: 'Verso' }, correct: false },
                      { id: '3', label: { es: 'Escultura', en: 'Escultura', pt: 'Escultura', fr: 'Escultura', it: 'Escultura' }, correct: true },
                      { id: '4', label: { es: 'Obra', en: 'Obra', pt: 'Obra', fr: 'Obra', it: 'Obra' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "escena"?',
                      en: 'What does "escena" mean?',
                      pt: 'O que significa "escena"?',
                      fr: 'Que signifie "escena"?',
                      it: 'Cosa significa "escena"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Style', en: 'Style', pt: 'Style', fr: 'Style', it: 'Style' }, correct: false },
                      { id: '2', label: { es: 'Scene', en: 'Scene', pt: 'Scene', fr: 'Scene', it: 'Scene' }, correct: true },
                      { id: '3', label: { es: 'Verse', en: 'Verse', pt: 'Verse', fr: 'Verse', it: 'Verse' }, correct: false },
                      { id: '4', label: { es: 'Metaphor', en: 'Metaphor', pt: 'Metaphor', fr: 'Metaphor', it: 'Metaphor' }, correct: false },
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
                    stem: {
                      es: '¿Qué es "internet"?',
                      en: 'What is "internet"?',
                      pt: 'O que é "internet"?',
                      fr: 'Qu\'est-ce que "internet"?',
                      it: 'Cos\'è "internet"?',
                    },
                    options: [
                      { id: '1', label: { es: 'A message', en: 'A message', pt: 'A message', fr: 'A message', it: 'A message' }, correct: false },
                      { id: '2', label: { es: 'The internet', en: 'The internet', pt: 'The internet', fr: 'The internet', it: 'The internet' }, correct: true },
                      { id: '3', label: { es: 'An app', en: 'An app', pt: 'An app', fr: 'An app', it: 'An app' }, correct: false },
                      { id: '4', label: { es: 'A platform', en: 'A platform', pt: 'A platform', fr: 'A platform', it: 'A platform' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "message" en español?',
                      en: 'How do you say "message" in Spanish?',
                      pt: 'Como se diz "message" em espanhol?',
                      fr: 'Comment dit-on "message" en espagnol?',
                      it: 'Come si dice "message" in spagnolo?',
                    },
                    answer: { acceptable: ['mensaje'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras de comunicación digital:',
                      en: 'Select the digital communication words:',
                      pt: 'Selecione as palavras de comunicação digital:',
                      fr: 'Sélectionnez les mots de communication numérique:',
                      it: 'Seleziona le parole di comunicazione digitale:',
                    },
                    options: [
                      { id: '1', label: { es: 'Correo', en: 'Correo', pt: 'Correo', fr: 'Correo', it: 'Correo' }, correct: true },
                      { id: '2', label: { es: 'Árbol', en: 'Árbol', pt: 'Árbol', fr: 'Árbol', it: 'Árbol' }, correct: false },
                      { id: '3', label: { es: 'Aplicación', en: 'Aplicación', pt: 'Aplicación', fr: 'Aplicación', it: 'Aplicación' }, correct: true },
                      { id: '4', label: { es: 'Red social', en: 'Red social', pt: 'Red social', fr: 'Red social', it: 'Red social' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "research"?',
                      en: 'What word means "research"?',
                      pt: 'Que palavra significa "research"?',
                      fr: 'Quel mot signifie "research"?',
                      it: 'Quale parola significa "research"?',
                    },
                    answer: { acceptable: ['investigación', 'investigacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "descubrimiento"?',
                      en: 'What does "descubrimiento" mean?',
                      pt: 'O que significa "descubrimiento"?',
                      fr: 'Que signifie "descubrimiento"?',
                      it: 'Cosa significa "descubrimiento"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Technology', en: 'Technology', pt: 'Technology', fr: 'Technology', it: 'Technology' }, correct: false },
                      { id: '2', label: { es: 'Discovery', en: 'Discovery', pt: 'Discovery', fr: 'Discovery', it: 'Discovery' }, correct: true },
                      { id: '3', label: { es: 'Innovation', en: 'Innovation', pt: 'Innovation', fr: 'Innovation', it: 'Innovation' }, correct: false },
                      { id: '4', label: { es: 'Research', en: 'Research', pt: 'Research', fr: 'Research', it: 'Research' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras científicas y tecnológicas:',
                      en: 'Select the scientific and technological words:',
                      pt: 'Selecione as palavras científicas e tecnológicas:',
                      fr: 'Sélectionnez les mots scientifiques et technologiques:',
                      it: 'Seleziona le parole scientifiche e tecnologiche:',
                    },
                    options: [
                      { id: '1', label: { es: 'Tecnología', en: 'Tecnología', pt: 'Tecnología', fr: 'Tecnología', it: 'Tecnología' }, correct: true },
                      { id: '2', label: { es: 'Bailar', en: 'Bailar', pt: 'Bailar', fr: 'Bailar', it: 'Bailar' }, correct: false },
                      { id: '3', label: { es: 'Innovar', en: 'Innovar', pt: 'Innovar', fr: 'Innovar', it: 'Innovar' }, correct: true },
                      { id: '4', label: { es: 'Investigación', en: 'Investigación', pt: 'Investigación', fr: 'Investigación', it: 'Investigación' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "entrepreneur" en español?',
                      en: 'How do you say "entrepreneur" in Spanish?',
                      pt: 'Como se diz "entrepreneur" em espanhol?',
                      fr: 'Comment dit-on "entrepreneur" en espagnol?',
                      it: 'Come si dice "entrepreneur" in spagnolo?',
                    },
                    answer: { acceptable: ['emprendedor'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué es una "startup"?',
                      en: 'What is a "startup"?',
                      pt: 'O que é uma "startup"?',
                      fr: 'Qu\'est-ce qu\'une "startup"?',
                      it: 'Cos\'è una "startup"?',
                    },
                    options: [
                      { id: '1', label: { es: 'An old company', en: 'An old company', pt: 'An old company', fr: 'An old company', it: 'An old company' }, correct: false },
                      { id: '2', label: { es: 'A startup company', en: 'A startup company', pt: 'A startup company', fr: 'A startup company', it: 'A startup company' }, correct: true },
                      { id: '3', label: { es: 'A platform', en: 'A platform', pt: 'A platform', fr: 'A platform', it: 'A platform' }, correct: false },
                      { id: '4', label: { es: 'A discovery', en: 'A discovery', pt: 'A discovery', fr: 'A discovery', it: 'A discovery' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras de economía digital:',
                      en: 'Select the digital economy words:',
                      pt: 'Selecione as palavras de economia digital:',
                      fr: 'Sélectionnez les mots d\'économie numérique:',
                      it: 'Seleziona le parole di economia digitale:',
                    },
                    options: [
                      { id: '1', label: { es: 'Digital', en: 'Digital', pt: 'Digital', fr: 'Digital', it: 'Digital' }, correct: true },
                      { id: '2', label: { es: 'Cabeza', en: 'Cabeza', pt: 'Cabeza', fr: 'Cabeza', it: 'Cabeza' }, correct: false },
                      { id: '3', label: { es: 'Comercio', en: 'Comercio', pt: 'Comercio', fr: 'Comercio', it: 'Comercio' }, correct: true },
                      { id: '4', label: { es: 'Plataforma', en: 'Plataforma', pt: 'Plataforma', fr: 'Plataforma', it: 'Plataforma' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué verbo significa "to innovate"?',
                      en: 'What verb means "to innovate"?',
                      pt: 'Que verbo significa "to innovate"?',
                      fr: 'Quel verbe signifie "to innovate"?',
                      it: 'Quale verbo significa "to innovate"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Investigar', en: 'Investigar', pt: 'Investigar', fr: 'Investigar', it: 'Investigar' }, correct: false },
                      { id: '2', label: { es: 'Descubrir', en: 'Descubrir', pt: 'Descubrir', fr: 'Descubrir', it: 'Descubrir' }, correct: false },
                      { id: '3', label: { es: 'Innovar', en: 'Innovar', pt: 'Innovar', fr: 'Innovar', it: 'Innovar' }, correct: true },
                      { id: '4', label: { es: 'Comerciar', en: 'Comerciar', pt: 'Comerciar', fr: 'Comerciar', it: 'Comerciar' }, correct: false },
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
                    stem: {
                      es: '¿Qué significa "justicia"?',
                      en: 'What does "justicia" mean?',
                      pt: 'O que significa "justicia"?',
                      fr: 'Que signifie "justicia"?',
                      it: 'Cosa significa "justicia"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Equality', en: 'Equality', pt: 'Equality', fr: 'Equality', it: 'Equality' }, correct: false },
                      { id: '2', label: { es: 'Justice', en: 'Justice', pt: 'Justice', fr: 'Justice', it: 'Justice' }, correct: true },
                      { id: '3', label: { es: 'Rights', en: 'Rights', pt: 'Rights', fr: 'Rights', it: 'Rights' }, correct: false },
                      { id: '4', label: { es: 'Diversity', en: 'Diversity', pt: 'Diversity', fr: 'Diversity', it: 'Diversity' }, correct: false },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "equality" en español?',
                      en: 'How do you say "equality" in Spanish?',
                      pt: 'Como se diz "equality" em espanhol?',
                      fr: 'Comment dit-on "equality" en espagnol?',
                      it: 'Come si dice "equality" in spagnolo?',
                    },
                    answer: { acceptable: ['igualdad'] },
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras de justicia social:',
                      en: 'Select the social justice words:',
                      pt: 'Selecione as palavras de justiça social:',
                      fr: 'Sélectionnez les mots de justice sociale:',
                      it: 'Seleziona le parole di giustizia sociale:',
                    },
                    options: [
                      { id: '1', label: { es: 'Derechos', en: 'Derechos', pt: 'Derechos', fr: 'Derechos', it: 'Derechos' }, correct: true },
                      { id: '2', label: { es: 'Internet', en: 'Internet', pt: 'Internet', fr: 'Internet', it: 'Internet' }, correct: false },
                      { id: '3', label: { es: 'Diversidad', en: 'Diversidad', pt: 'Diversidad', fr: 'Diversidad', it: 'Diversidad' }, correct: true },
                      { id: '4', label: { es: 'Inclusión', en: 'Inclusión', pt: 'Inclusión', fr: 'Inclusión', it: 'Inclusión' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Qué palabra significa "rights"?',
                      en: 'What word means "rights"?',
                      pt: 'Que palavra significa "rights"?',
                      fr: 'Quel mot signifie "rights"?',
                      it: 'Quale parola significa "rights"?',
                    },
                    answer: { acceptable: ['derechos'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué significa "crisis"?',
                      en: 'What does "crisis" mean?',
                      pt: 'O que significa "crisis"?',
                      fr: 'Que signifie "crisis"?',
                      it: 'Cosa significa "crisis"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Solution', en: 'Solution', pt: 'Solution', fr: 'Solution', it: 'Solution' }, correct: false },
                      { id: '2', label: { es: 'Crisis', en: 'Crisis', pt: 'Crisis', fr: 'Crisis', it: 'Crisis' }, correct: true },
                      { id: '3', label: { es: 'Cooperation', en: 'Cooperation', pt: 'Cooperation', fr: 'Cooperation', it: 'Cooperation' }, correct: false },
                      { id: '4', label: { es: 'Sustainability', en: 'Sustainability', pt: 'Sustainability', fr: 'Sustainability', it: 'Sustainability' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona las palabras sobre desafíos globales:',
                      en: 'Select the words about global challenges:',
                      pt: 'Selecione as palavras sobre desafios globais:',
                      fr: 'Sélectionnez les mots sur les défis mondiaux:',
                      it: 'Seleziona le parole sulle sfide globali:',
                    },
                    options: [
                      { id: '1', label: { es: 'Global', en: 'Global', pt: 'Global', fr: 'Global', it: 'Global' }, correct: true },
                      { id: '2', label: { es: 'Bailar', en: 'Bailar', pt: 'Bailar', fr: 'Bailar', it: 'Bailar' }, correct: false },
                      { id: '3', label: { es: 'Crisis', en: 'Crisis', pt: 'Crisis', fr: 'Crisis', it: 'Crisis' }, correct: true },
                      { id: '4', label: { es: 'Solución', en: 'Solución', pt: 'Solución', fr: 'Solución', it: 'Solución' }, correct: true },
                    ],
                  },
                  {
                    type: 'oneword',
                    stem: {
                      es: '¿Cómo se dice "cooperation" en español?',
                      en: 'How do you say "cooperation" in Spanish?',
                      pt: 'Como se diz "cooperation" em espanhol?',
                      fr: 'Comment dit-on "cooperation" en espagnol?',
                      it: 'Come si dice "cooperation" in spagnolo?',
                    },
                    answer: { acceptable: ['cooperación', 'cooperacion'] },
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué es "sostenibilidad"?',
                      en: 'What is "sostenibilidad"?',
                      pt: 'O que é "sostenibilidad"?',
                      fr: 'Qu\'est-ce que "sostenibilidad"?',
                      it: 'Cos\'è "sostenibilidad"?',
                    },
                    options: [
                      { id: '1', label: { es: 'Justice', en: 'Justice', pt: 'Justice', fr: 'Justice', it: 'Justice' }, correct: false },
                      { id: '2', label: { es: 'Sustainability', en: 'Sustainability', pt: 'Sustainability', fr: 'Sustainability', it: 'Sustainability' }, correct: true },
                      { id: '3', label: { es: 'Diversity', en: 'Diversity', pt: 'Diversity', fr: 'Diversity', it: 'Diversity' }, correct: false },
                      { id: '4', label: { es: 'Crisis', en: 'Crisis', pt: 'Crisis', fr: 'Crisis', it: 'Crisis' }, correct: false },
                    ],
                  },
                  {
                    type: 'multi',
                    stem: {
                      es: 'Selecciona los conceptos éticos y sociales:',
                      en: 'Select the ethical and social concepts:',
                      pt: 'Selecione os conceitos éticos e sociais:',
                      fr: 'Sélectionnez les concepts éthiques et sociaux:',
                      it: 'Seleziona i concetti etici e sociali:',
                    },
                    options: [
                      { id: '1', label: { es: 'Justicia', en: 'Justicia', pt: 'Justicia', fr: 'Justicia', it: 'Justicia' }, correct: true },
                      { id: '2', label: { es: 'Computadora', en: 'Computadora', pt: 'Computadora', fr: 'Computadora', it: 'Computadora' }, correct: false },
                      { id: '3', label: { es: 'Igualdad', en: 'Igualdad', pt: 'Igualdad', fr: 'Igualdad', it: 'Igualdad' }, correct: true },
                      { id: '4', label: { es: 'Inclusión', en: 'Inclusión', pt: 'Inclusión', fr: 'Inclusión', it: 'Inclusión' }, correct: true },
                    ],
                  },
                  {
                    type: 'mcq',
                    stem: {
                      es: '¿Qué necesitamos para resolver problemas globales?',
                      en: 'What do we need to solve global problems?',
                      pt: 'O que precisamos para resolver problemas globais?',
                      fr: 'De quoi avons-nous besoin pour résoudre les problèmes mondiaux?',
                      it: 'Cosa ci serve per risolvere i problemi globali?',
                    },
                    options: [
                      { id: '1', label: { es: 'División', en: 'División', pt: 'División', fr: 'División', it: 'División' }, correct: false },
                      { id: '2', label: { es: 'Cooperación', en: 'Cooperación', pt: 'Cooperación', fr: 'Cooperación', it: 'Cooperación' }, correct: true },
                      { id: '3', label: { es: 'Crisis', en: 'Crisis', pt: 'Crisis', fr: 'Crisis', it: 'Crisis' }, correct: false },
                      { id: '4', label: { es: 'Conflicto', en: 'Conflicto', pt: 'Conflicto', fr: 'Conflicto', it: 'Conflicto' }, correct: false },
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
