/**
 * B1 Level Skill Tree Data
 */

export const SKILL_TREE_B1 = [
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
          modes: ["vocabulary", "grammar"],
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
];
