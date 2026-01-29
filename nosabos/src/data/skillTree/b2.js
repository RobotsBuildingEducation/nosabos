/**
 * B2 Level Skill Tree Data
 */

export const SKILL_TREE_B2 = [
  {
    id: "unit-b2-1",
      title: {
        en: "Past Perfect",
        es: "Pluscuamperfecto",
      },
      description: {
        en: "Had done",
        es: "Había hecho",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-1-1",
          title: {
            en: "Before It Happened",
            es: "Pluscuamperfecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for past perfect",
            es: "Aprende vocabulario clave para pluscuamperfecto",
          },
          xpRequired: 5025,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
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
          id: "lesson-b2-1-2",
          title: {
            en: "Earlier Actions",
            es: "Pluscuamperfecto - Práctica",
          },
          description: {
            en: "Practice past perfect in conversation",
            es: "Practica pluscuamperfecto en conversación",
          },
          xpRequired: 5055,
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
          id: "lesson-b2-1-3",
          title: {
            en: "Complex Timelines",
            es: "Pluscuamperfecto - Aplicación",
          },
          description: {
            en: "Apply past perfect skills",
            es: "Aplica habilidades de pluscuamperfecto",
          },
          xpRequired: 5085,
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
          id: "lesson-b2-1-quiz",
          title: {
            en: "Past Perfect Quiz",
            es: "Prueba de Pluscuamperfecto",
          },
          description: {
            en: "Test your knowledge of past perfect",
            es: "Prueba tus conocimientos de pluscuamperfecto",
          },
          xpRequired: 5115,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
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
        }
      ],
    },
    {
      id: "unit-b2-2",
      title: {
        en: "Passive Voice",
        es: "Voz Pasiva",
      },
      description: {
        en: "Is done by",
        es: "Es hecho por",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-2-1",
          title: {
            en: "It Was Done",
            es: "Fue Hecho",
          },
          description: {
            en: "Learn key vocabulary for passive voice",
            es: "Aprende vocabulario clave para voz pasiva",
          },
          xpRequired: 5175,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "passive",
            },
            grammar: {
              topic: "passive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-2-2",
          title: {
            en: "Formal Writing",
            es: "Escritura Formal",
          },
          description: {
            en: "Practice passive voice in conversation",
            es: "Practica voz pasiva en conversación",
          },
          xpRequired: 5205,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "passive conversation",
              prompt: "Practice using passive in real conversation",
            },
            stories: {
              topic: "passive",
              prompt: "Read and discuss passive",
            },
          },
        },
        {
          id: "lesson-b2-2-3",
          title: {
            en: "Professional Tone",
            es: "Tono Profesional",
          },
          description: {
            en: "Apply passive voice skills",
            es: "Aplica habilidades de voz pasiva",
          },
          xpRequired: 5235,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "passive",
              prompt: "Advanced passive content and comprehension",
            },
            realtime: {
              scenario: "passive mastery",
              prompt: "Demonstrate mastery of passive",
            },
          },
        },
        {
          id: "lesson-b2-2-quiz",
          title: {
            en: "Passive Voice Quiz",
            es: "Prueba de Voz Pasiva",
          },
          description: {
            en: "Test your knowledge of passive voice",
            es: "Prueba tus conocimientos de voz pasiva",
          },
          xpRequired: 5265,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "passive",
            },
            grammar: {
              topics: ["passive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-3",
      title: {
        en: "Reported Speech",
        es: "Discurso Indirecto",
      },
      description: {
        en: "He said that...",
        es: "Él dijo que...",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-3-1",
          title: {
            en: "She Said That...",
            es: "Discurso Indirecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for reported speech",
            es: "Aprende vocabulario clave para discurso indirecto",
          },
          xpRequired: 5325,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topic: "narrative and storytelling structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-3-2",
          title: {
            en: "Quoting Others",
            es: "Discurso Indirecto - Práctica",
          },
          description: {
            en: "Practice reported speech in conversation",
            es: "Practica discurso indirecto en conversación",
          },
          xpRequired: 5355,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "narrative and storytelling conversation",
              prompt:
                "Practice using narrative and storytelling in real conversation",
            },
            stories: {
              topic: "narrative and storytelling",
              prompt: "Read and discuss narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-b2-3-3",
          title: {
            en: "Retelling Stories",
            es: "Discurso Indirecto - Aplicación",
          },
          description: {
            en: "Apply reported speech skills",
            es: "Aplica habilidades de discurso indirecto",
          },
          xpRequired: 5385,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "narrative and storytelling",
              prompt:
                "Advanced narrative and storytelling content and comprehension",
            },
            realtime: {
              scenario: "narrative and storytelling mastery",
              prompt: "Demonstrate mastery of narrative and storytelling",
            },
          },
        },
        {
          id: "lesson-b2-3-quiz",
          title: {
            en: "Reported Speech Quiz",
            es: "Prueba de Discurso Indirecto",
          },
          description: {
            en: "Test your knowledge of reported speech",
            es: "Prueba tus conocimientos de discurso indirecto",
          },
          xpRequired: 5415,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "narrative and storytelling",
            },
            grammar: {
              topics: ["narrative and storytelling structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-4",
      title: {
        en: "Relative Clauses",
        es: "Cláusulas Relativas",
      },
      description: {
        en: "Who, which, that",
        es: "Que, quien",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-4-1",
          title: {
            en: "Who, Which, That",
            es: "Quien, Cual, Que",
          },
          description: {
            en: "Learn key vocabulary for relative clauses",
            es: "Aprende vocabulario clave para cláusulas relativas",
          },
          xpRequired: 5475,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "relative clauses",
            },
            grammar: {
              topic: "relative clauses structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-4-2",
          title: {
            en: "Connecting Ideas",
            es: "Conectando Ideas",
          },
          description: {
            en: "Practice relative clauses in conversation",
            es: "Practica cláusulas relativas en conversación",
          },
          xpRequired: 5505,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "relative clauses conversation",
              prompt: "Practice using relative clauses in real conversation",
            },
            stories: {
              topic: "relative clauses",
              prompt: "Read and discuss relative clauses",
            },
          },
        },
        {
          id: "lesson-b2-4-3",
          title: {
            en: "Complex Sentences",
            es: "Oraciones Complejas",
          },
          description: {
            en: "Apply relative clauses skills",
            es: "Aplica habilidades de cláusulas relativas",
          },
          xpRequired: 5535,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "relative clauses",
              prompt: "Advanced relative clauses content and comprehension",
            },
            realtime: {
              scenario: "relative clauses mastery",
              prompt: "Demonstrate mastery of relative clauses",
            },
          },
        },
        {
          id: "lesson-b2-4-quiz",
          title: {
            en: "Relative Clauses Quiz",
            es: "Prueba de Cláusulas Relativas",
          },
          description: {
            en: "Test your knowledge of relative clauses",
            es: "Prueba tus conocimientos de cláusulas relativas",
          },
          xpRequired: 5565,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "relative clauses",
            },
            grammar: {
              topics: ["relative clauses structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-5",
      title: {
        en: "Formal vs Informal",
        es: "Formal e Informal",
      },
      description: {
        en: "Register switching",
        es: "Cambio de registro",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-5-1",
          title: {
            en: "Registers of Speech",
            es: "Formal e Informal - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for formal vs informal",
            es: "Aprende vocabulario clave para formal e informal",
          },
          xpRequired: 5625,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "register",
            },
            grammar: {
              topic: "register structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-5-2",
          title: {
            en: "Appropriate Language",
            es: "Formal e Informal - Práctica",
          },
          description: {
            en: "Practice formal vs informal in conversation",
            es: "Practica formal e informal en conversación",
          },
          xpRequired: 5655,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "register conversation",
              prompt: "Practice using register in real conversation",
            },
            stories: {
              topic: "register",
              prompt: "Read and discuss register",
            },
          },
        },
        {
          id: "lesson-b2-5-3",
          title: {
            en: "Context Matters",
            es: "Formal e Informal - Aplicación",
          },
          description: {
            en: "Apply formal vs informal skills",
            es: "Aplica habilidades de formal e informal",
          },
          xpRequired: 5685,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "register",
              prompt: "Advanced register content and comprehension",
            },
            realtime: {
              scenario: "register mastery",
              prompt: "Demonstrate mastery of register",
            },
          },
        },
        {
          id: "lesson-b2-5-quiz",
          title: {
            en: "Formal vs Informal Quiz",
            es: "Prueba de Formal e Informal",
          },
          description: {
            en: "Test your knowledge of formal vs informal",
            es: "Prueba tus conocimientos de formal e informal",
          },
          xpRequired: 5715,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "register",
            },
            grammar: {
              topics: ["register structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-6",
      title: {
        en: "Business Spanish",
        es: "Español de Negocios",
      },
      description: {
        en: "Professional language",
        es: "Lenguaje profesional",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-6-1",
          title: {
            en: "Corporate World",
            es: "Mundo Corporativo",
          },
          description: {
            en: "Learn key vocabulary for business spanish",
            es: "Aprende vocabulario clave para español de negocios",
          },
          xpRequired: 5775,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topic: "professional structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-6-2",
          title: {
            en: "Professional Meetings",
            es: "Reuniones Profesionales",
          },
          description: {
            en: "Practice business spanish in conversation",
            es: "Practica español de negocios en conversación",
          },
          xpRequired: 5805,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "professional conversation",
              prompt: "Practice using professional in real conversation",
            },
            stories: {
              topic: "professional",
              prompt: "Read and discuss professional",
            },
          },
        },
        {
          id: "lesson-b2-6-3",
          title: {
            en: "Business Communication",
            es: "Comunicación Empresarial",
          },
          description: {
            en: "Apply business spanish skills",
            es: "Aplica habilidades de español de negocios",
          },
          xpRequired: 5835,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "professional",
              prompt: "Advanced professional content and comprehension",
            },
            realtime: {
              scenario: "professional mastery",
              prompt: "Demonstrate mastery of professional",
            },
          },
        },
        {
          id: "lesson-b2-6-quiz",
          title: {
            en: "Business Spanish Quiz",
            es: "Prueba de Español de Negocios",
          },
          description: {
            en: "Test your knowledge of business spanish",
            es: "Prueba tus conocimientos de español de negocios",
          },
          xpRequired: 5865,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "professional",
            },
            grammar: {
              topics: ["professional structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-7",
      title: {
        en: "Science & Innovation",
        es: "Ciencia e Innovación",
      },
      description: {
        en: "Scientific topics",
        es: "Temas científicos",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-7-1",
          title: {
            en: "Scientific Terms",
            es: "Términos Científicos",
          },
          description: {
            en: "Learn key vocabulary for science & innovation",
            es: "Aprende vocabulario clave para ciencia e innovación",
          },
          xpRequired: 5925,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "science",
            },
            grammar: {
              topic: "science structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-7-2",
          title: {
            en: "Technological Advances",
            es: "Avances Tecnológicos",
          },
          description: {
            en: "Practice science & innovation in conversation",
            es: "Practica ciencia e innovación en conversación",
          },
          xpRequired: 5955,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "science conversation",
              prompt: "Practice using science in real conversation",
            },
            stories: {
              topic: "science",
              prompt: "Read and discuss science",
            },
          },
        },
        {
          id: "lesson-b2-7-3",
          title: {
            en: "Future of Science",
            es: "Futuro de la Ciencia",
          },
          description: {
            en: "Apply science & innovation skills",
            es: "Aplica habilidades de ciencia e innovación",
          },
          xpRequired: 5985,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "science",
              prompt: "Advanced science content and comprehension",
            },
            realtime: {
              scenario: "science mastery",
              prompt: "Demonstrate mastery of science",
            },
          },
        },
        {
          id: "lesson-b2-7-quiz",
          title: {
            en: "Science & Innovation Quiz",
            es: "Prueba de Ciencia e Innovación",
          },
          description: {
            en: "Test your knowledge of science & innovation",
            es: "Prueba tus conocimientos de ciencia e innovación",
          },
          xpRequired: 6015,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "science",
            },
            grammar: {
              topics: ["science structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-8",
      title: {
        en: "Social Issues",
        es: "Problemas Sociales",
      },
      description: {
        en: "Society and issues",
        es: "Sociedad y problemas",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-8-1",
          title: {
            en: "Society Today",
            es: "Problemas Sociales - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for social issues",
            es: "Aprende vocabulario clave para problemas sociales",
          },
          xpRequired: 6075,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "social justice",
            },
            grammar: {
              topic: "social justice structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-8-2",
          title: {
            en: "Discussing Problems",
            es: "Problemas Sociales - Práctica",
          },
          description: {
            en: "Practice social issues in conversation",
            es: "Practica problemas sociales en conversación",
          },
          xpRequired: 6105,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "social justice conversation",
              prompt: "Practice using social justice in real conversation",
            },
            stories: {
              topic: "social justice",
              prompt: "Read and discuss social justice",
            },
          },
        },
        {
          id: "lesson-b2-8-3",
          title: {
            en: "Making Change",
            es: "Problemas Sociales - Aplicación",
          },
          description: {
            en: "Apply social issues skills",
            es: "Aplica habilidades de problemas sociales",
          },
          xpRequired: 6135,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "social justice",
              prompt: "Advanced social justice content and comprehension",
            },
            realtime: {
              scenario: "social justice mastery",
              prompt: "Demonstrate mastery of social justice",
            },
          },
        },
        {
          id: "lesson-b2-8-quiz",
          title: {
            en: "Social Issues Quiz",
            es: "Prueba de Problemas Sociales",
          },
          description: {
            en: "Test your knowledge of social issues",
            es: "Prueba tus conocimientos de problemas sociales",
          },
          xpRequired: 6165,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "social justice",
            },
            grammar: {
              topics: ["social justice structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-9",
      title: {
        en: "Arts & Literature",
        es: "Artes y Literatura",
      },
      description: {
        en: "Cultural works",
        es: "Obras culturales",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-9-1",
          title: {
            en: "Creative Expression",
            es: "Expresión Creativa",
          },
          description: {
            en: "Learn key vocabulary for arts & literature",
            es: "Aprende vocabulario clave para artes y literatura",
          },
          xpRequired: 6225,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topic: "literature structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-9-2",
          title: {
            en: "Artistic Movements",
            es: "Movimientos Artísticos",
          },
          description: {
            en: "Practice arts & literature in conversation",
            es: "Practica artes y literatura en conversación",
          },
          xpRequired: 6255,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "literature conversation",
              prompt: "Practice using literature in real conversation",
            },
            stories: {
              topic: "literature",
              prompt: "Read and discuss literature",
            },
          },
        },
        {
          id: "lesson-b2-9-3",
          title: {
            en: "Cultural Analysis",
            es: "Análisis Cultural",
          },
          description: {
            en: "Apply arts & literature skills",
            es: "Aplica habilidades de artes y literatura",
          },
          xpRequired: 6285,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "literature",
              prompt: "Advanced literature content and comprehension",
            },
            realtime: {
              scenario: "literature mastery",
              prompt: "Demonstrate mastery of literature",
            },
          },
        },
        {
          id: "lesson-b2-9-quiz",
          title: {
            en: "Arts & Literature Quiz",
            es: "Prueba de Artes y Literatura",
          },
          description: {
            en: "Test your knowledge of arts & literature",
            es: "Prueba tus conocimientos de artes y literatura",
          },
          xpRequired: 6315,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "literature",
            },
            grammar: {
              topics: ["literature structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-10",
      title: {
        en: "Politics & Society",
        es: "Política y Sociedad",
      },
      description: {
        en: "Civic topics",
        es: "Temas cívicos",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-10-1",
          title: {
            en: "Civic Engagement",
            es: "Participación Cívica",
          },
          description: {
            en: "Learn key vocabulary for politics & society",
            es: "Aprende vocabulario clave para política y sociedad",
          },
          xpRequired: 6375,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "politics",
            },
            grammar: {
              topic: "politics structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-10-2",
          title: {
            en: "Political Discourse",
            es: "Discurso Político",
          },
          description: {
            en: "Practice politics & society in conversation",
            es: "Practica política y sociedad en conversación",
          },
          xpRequired: 6405,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "politics conversation",
              prompt: "Practice using politics in real conversation",
            },
            stories: {
              topic: "politics",
              prompt: "Read and discuss politics",
            },
          },
        },
        {
          id: "lesson-b2-10-3",
          title: {
            en: "Active Citizenship",
            es: "Ciudadanía Activa",
          },
          description: {
            en: "Apply politics & society skills",
            es: "Aplica habilidades de política y sociedad",
          },
          xpRequired: 6435,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "politics",
              prompt: "Advanced politics content and comprehension",
            },
            realtime: {
              scenario: "politics mastery",
              prompt: "Demonstrate mastery of politics",
            },
          },
        },
        {
          id: "lesson-b2-10-quiz",
          title: {
            en: "Politics & Society Quiz",
            es: "Prueba de Política y Sociedad",
          },
          description: {
            en: "Test your knowledge of politics & society",
            es: "Prueba tus conocimientos de política y sociedad",
          },
          xpRequired: 6465,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "politics",
            },
            grammar: {
              topics: ["politics structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-11",
      title: {
        en: "Health & Lifestyle",
        es: "Salud y Estilo de Vida",
      },
      description: {
        en: "Wellness",
        es: "Bienestar",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-11-1",
          title: {
            en: "Wellness Choices",
            es: "Elecciones de Bienestar",
          },
          description: {
            en: "Learn key vocabulary for health & lifestyle",
            es: "Aprende vocabulario clave para salud y estilo de vida",
          },
          xpRequired: 6525,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "wellness",
            },
            grammar: {
              topic: "wellness structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-11-2",
          title: {
            en: "Balanced Living",
            es: "Vida Equilibrada",
          },
          description: {
            en: "Practice health & lifestyle in conversation",
            es: "Practica salud y estilo de vida en conversación",
          },
          xpRequired: 6555,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "wellness conversation",
              prompt: "Practice using wellness in real conversation",
            },
            stories: {
              topic: "wellness",
              prompt: "Read and discuss wellness",
            },
          },
        },
        {
          id: "lesson-b2-11-3",
          title: {
            en: "Holistic Health",
            es: "Salud Holística",
          },
          description: {
            en: "Apply health & lifestyle skills",
            es: "Aplica habilidades de salud y estilo de vida",
          },
          xpRequired: 6585,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "wellness",
              prompt: "Advanced wellness content and comprehension",
            },
            realtime: {
              scenario: "wellness mastery",
              prompt: "Demonstrate mastery of wellness",
            },
          },
        },
        {
          id: "lesson-b2-11-quiz",
          title: {
            en: "Health & Lifestyle Quiz",
            es: "Prueba de Salud y Estilo de Vida",
          },
          description: {
            en: "Test your knowledge of health & lifestyle",
            es: "Prueba tus conocimientos de salud y estilo de vida",
          },
          xpRequired: 6615,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "wellness",
            },
            grammar: {
              topics: ["wellness structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-b2-12",
      title: {
        en: "Abstract Concepts",
        es: "Conceptos Abstractos",
      },
      description: {
        en: "Complex ideas",
        es: "Ideas complejas",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-12-1",
          title: {
            en: "Philosophical Ideas",
            es: "Ideas Filosóficas",
          },
          description: {
            en: "Learn key vocabulary for abstract concepts",
            es: "Aprende vocabulario clave para conceptos abstractos",
          },
          xpRequired: 6675,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "abstract",
            },
            grammar: {
              topic: "abstract structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-b2-12-2",
          title: {
            en: "Deep Thinking",
            es: "Pensamiento Profundo",
          },
          description: {
            en: "Practice abstract concepts in conversation",
            es: "Practica conceptos abstractos en conversación",
          },
          xpRequired: 6705,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "abstract conversation",
              prompt: "Practice using abstract in real conversation",
            },
            stories: {
              topic: "abstract",
              prompt: "Read and discuss abstract",
            },
          },
        },
        {
          id: "lesson-b2-12-3",
          title: {
            en: "Theoretical Discussion",
            es: "Discusión Teórica",
          },
          description: {
            en: "Apply abstract concepts skills",
            es: "Aplica habilidades de conceptos abstractos",
          },
          xpRequired: 6735,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "abstract",
              prompt: "Advanced abstract content and comprehension",
            },
            realtime: {
              scenario: "abstract mastery",
              prompt: "Demonstrate mastery of abstract",
            },
          },
        },
        {
          id: "lesson-b2-12-quiz",
          title: {
            en: "Abstract Concepts Quiz",
            es: "Prueba de Conceptos Abstractos",
          },
          description: {
            en: "Test your knowledge of abstract concepts",
            es: "Prueba tus conocimientos de conceptos abstractos",
          },
          xpRequired: 6765,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "abstract",
            },
            grammar: {
              topics: ["abstract structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    }
];
