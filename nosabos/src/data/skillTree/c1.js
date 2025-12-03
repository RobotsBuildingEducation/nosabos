/**
 * C1 Level Skill Tree Data
 */

export const SKILL_TREE_C1 = [
id: "unit-c1-1",
      title: {
        en: "Subjunctive Present",
        es: "Subjuntivo Presente",
      },
      description: {
        en: "Complex moods",
        es: "Modos complejos",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-1-1",
          title: {
            en: "Doubt and Desire",
            es: "Duda y Deseo",
          },
          description: {
            en: "Learn key vocabulary for subjunctive present",
            es: "Aprende vocabulario clave para subjuntivo presente",
          },
          xpRequired: 6825,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topic: "subjunctive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-1-2",
          title: {
            en: "Expressing Wishes",
            es: "Expresando Deseos",
          },
          description: {
            en: "Practice subjunctive present in conversation",
            es: "Practica subjuntivo presente en conversación",
          },
          xpRequired: 6860,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "subjunctive conversation",
              prompt: "Practice using subjunctive in real conversation",
            },
            stories: {
              topic: "subjunctive",
              prompt: "Read and discuss subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-1-3",
          title: {
            en: "Nuanced Meaning",
            es: "Significado Matizado",
          },
          description: {
            en: "Apply subjunctive present skills",
            es: "Aplica habilidades de subjuntivo presente",
          },
          xpRequired: 6895,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "subjunctive",
              prompt: "Advanced subjunctive content and comprehension",
            },
            realtime: {
              scenario: "subjunctive mastery",
              prompt: "Demonstrate mastery of subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-1-quiz",
          title: {
            en: "Subjunctive Present Quiz",
            es: "Prueba de Subjuntivo Presente",
          },
          description: {
            en: "Test your knowledge of subjunctive present",
            es: "Prueba tus conocimientos de subjuntivo presente",
          },
          xpRequired: 6930,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topics: ["subjunctive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-2",
      title: {
        en: "Subjunctive Past",
        es: "Subjuntivo Pasado",
      },
      description: {
        en: "Past subjunctive",
        es: "Subjuntivo pasado",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-2-1",
          title: {
            en: "If Only...",
            es: "Si Tan Solo...",
          },
          description: {
            en: "Learn key vocabulary for subjunctive past",
            es: "Aprende vocabulario clave para subjuntivo pasado",
          },
          xpRequired: 7000,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topic: "subjunctive structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-2-2",
          title: {
            en: "Contrary to Fact",
            es: "Contrario a la Realidad",
          },
          description: {
            en: "Practice subjunctive past in conversation",
            es: "Practica subjuntivo pasado en conversación",
          },
          xpRequired: 7035,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "subjunctive conversation",
              prompt: "Practice using subjunctive in real conversation",
            },
            stories: {
              topic: "subjunctive",
              prompt: "Read and discuss subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-2-3",
          title: {
            en: "Complex Emotions",
            es: "Emociones Complejas",
          },
          description: {
            en: "Apply subjunctive past skills",
            es: "Aplica habilidades de subjuntivo pasado",
          },
          xpRequired: 7070,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "subjunctive",
              prompt: "Advanced subjunctive content and comprehension",
            },
            realtime: {
              scenario: "subjunctive mastery",
              prompt: "Demonstrate mastery of subjunctive",
            },
          },
        },
        {
          id: "lesson-c1-2-quiz",
          title: {
            en: "Subjunctive Past Quiz",
            es: "Prueba de Subjuntivo Pasado",
          },
          description: {
            en: "Test your knowledge of subjunctive past",
            es: "Prueba tus conocimientos de subjuntivo pasado",
          },
          xpRequired: 7105,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "subjunctive",
            },
            grammar: {
              topics: ["subjunctive structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-3",
      title: {
        en: "Complex Conditionals",
        es: "Condicionales Complejos",
      },
      description: {
        en: "If I had...",
        es: "Si hubiera...",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-3-1",
          title: {
            en: "Advanced If Clauses",
            es: "Cláusulas If Avanzadas",
          },
          description: {
            en: "Learn key vocabulary for complex conditionals",
            es: "Aprende vocabulario clave para condicionales complejos",
          },
          xpRequired: 7175,
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
          id: "lesson-c1-3-2",
          title: {
            en: "Mixed Conditionals",
            es: "Condicionales Mixtos",
          },
          description: {
            en: "Practice complex conditionals in conversation",
            es: "Practica condicionales complejos en conversación",
          },
          xpRequired: 7210,
          xpReward: 60,
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
          id: "lesson-c1-3-3",
          title: {
            en: "Sophisticated Logic",
            es: "Lógica Sofisticada",
          },
          description: {
            en: "Apply complex conditionals skills",
            es: "Aplica habilidades de condicionales complejos",
          },
          xpRequired: 7245,
          xpReward: 45,
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
          id: "lesson-c1-3-quiz",
          title: {
            en: "Complex Conditionals Quiz",
            es: "Prueba de Condicionales Complejos",
          },
          description: {
            en: "Test your knowledge of complex conditionals",
            es: "Prueba tus conocimientos de condicionales complejos",
          },
          xpRequired: 7280,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
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
      id: "unit-c1-4",
      title: {
        en: "Idiomatic Expressions",
        es: "Expresiones Idiomáticas",
      },
      description: {
        en: "Idioms and sayings",
        es: "Modismos y dichos",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-4-1",
          title: {
            en: "Native Phrases",
            es: "Frases Nativas",
          },
          description: {
            en: "Learn key vocabulary for idiomatic expressions",
            es: "Aprende vocabulario clave para expresiones idiomáticas",
          },
          xpRequired: 7350,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "idioms",
            },
            grammar: {
              topic: "idioms structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-4-2",
          title: {
            en: "Sound Natural",
            es: "Sonar Natural",
          },
          description: {
            en: "Practice idiomatic expressions in conversation",
            es: "Practica expresiones idiomáticas en conversación",
          },
          xpRequired: 7385,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "idioms conversation",
              prompt: "Practice using idioms in real conversation",
            },
            stories: {
              topic: "idioms",
              prompt: "Read and discuss idioms",
            },
          },
        },
        {
          id: "lesson-c1-4-3",
          title: {
            en: "Cultural Fluency",
            es: "Fluidez Cultural",
          },
          description: {
            en: "Apply idiomatic expressions skills",
            es: "Aplica habilidades de expresiones idiomáticas",
          },
          xpRequired: 7420,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "idioms",
              prompt: "Advanced idioms content and comprehension",
            },
            realtime: {
              scenario: "idioms mastery",
              prompt: "Demonstrate mastery of idioms",
            },
          },
        },
        {
          id: "lesson-c1-4-quiz",
          title: {
            en: "Idiomatic Expressions Quiz",
            es: "Prueba de Expresiones Idiomáticas",
          },
          description: {
            en: "Test your knowledge of idiomatic expressions",
            es: "Prueba tus conocimientos de expresiones idiomáticas",
          },
          xpRequired: 7455,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "idioms",
            },
            grammar: {
              topics: ["idioms structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-5",
      title: {
        en: "Academic Writing",
        es: "Escritura Académica",
      },
      description: {
        en: "Formal writing",
        es: "Escritura formal",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-5-1",
          title: {
            en: "Scholarly Language",
            es: "Lenguaje Académico",
          },
          description: {
            en: "Learn key vocabulary for academic writing",
            es: "Aprende vocabulario clave para escritura académica",
          },
          xpRequired: 7525,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "academic",
            },
            grammar: {
              topic: "academic structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-5-2",
          title: {
            en: "Research Papers",
            es: "Trabajos de Investigación",
          },
          description: {
            en: "Practice academic writing in conversation",
            es: "Practica escritura académica en conversación",
          },
          xpRequired: 7560,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "academic conversation",
              prompt: "Practice using academic in real conversation",
            },
            stories: {
              topic: "academic",
              prompt: "Read and discuss academic",
            },
          },
        },
        {
          id: "lesson-c1-5-3",
          title: {
            en: "Critical Analysis",
            es: "Análisis Crítico",
          },
          description: {
            en: "Apply academic writing skills",
            es: "Aplica habilidades de escritura académica",
          },
          xpRequired: 7595,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "academic",
              prompt: "Advanced academic content and comprehension",
            },
            realtime: {
              scenario: "academic mastery",
              prompt: "Demonstrate mastery of academic",
            },
          },
        },
        {
          id: "lesson-c1-5-quiz",
          title: {
            en: "Academic Writing Quiz",
            es: "Prueba de Escritura Académica",
          },
          description: {
            en: "Test your knowledge of academic writing",
            es: "Prueba tus conocimientos de escritura académica",
          },
          xpRequired: 7630,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "academic",
            },
            grammar: {
              topics: ["academic structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-6",
      title: {
        en: "Professional Communication",
        es: "Comunicación Profesional",
      },
      description: {
        en: "Workplace language",
        es: "Lenguaje laboral",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-6-1",
          title: {
            en: "Business Etiquette",
            es: "Etiqueta Empresarial",
          },
          description: {
            en: "Learn key vocabulary for professional communication",
            es: "Aprende vocabulario clave para comunicación profesional",
          },
          xpRequired: 7700,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
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
          id: "lesson-c1-6-2",
          title: {
            en: "Executive Presence",
            es: "Presencia Ejecutiva",
          },
          description: {
            en: "Practice professional communication in conversation",
            es: "Practica comunicación profesional en conversación",
          },
          xpRequired: 7735,
          xpReward: 60,
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
          id: "lesson-c1-6-3",
          title: {
            en: "Leadership Language",
            es: "Lenguaje de Liderazgo",
          },
          description: {
            en: "Apply professional communication skills",
            es: "Aplica habilidades de comunicación profesional",
          },
          xpRequired: 7770,
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
          id: "lesson-c1-6-quiz",
          title: {
            en: "Professional Communication Quiz",
            es: "Prueba de Comunicación Profesional",
          },
          description: {
            en: "Test your knowledge of professional communication",
            es: "Prueba tus conocimientos de comunicación profesional",
          },
          xpRequired: 7805,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
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
        },
      ],
    },
    {
      id: "unit-c1-7",
      title: {
        en: "Debate & Argumentation",
        es: "Debate y Argumentación",
      },
      description: {
        en: "Persuasive skills",
        es: "Habilidades persuasivas",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-7-1",
          title: {
            en: "Persuasive Language",
            es: "Lenguaje Persuasivo",
          },
          description: {
            en: "Learn key vocabulary for debate & argumentation",
            es: "Aprende vocabulario clave para debate y argumentación",
          },
          xpRequired: 7875,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "debate",
            },
            grammar: {
              topic: "debate structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-7-2",
          title: {
            en: "Building Arguments",
            es: "Construyendo Argumentos",
          },
          description: {
            en: "Practice debate & argumentation in conversation",
            es: "Practica debate y argumentación en conversación",
          },
          xpRequired: 7910,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "debate conversation",
              prompt: "Practice using debate in real conversation",
            },
            stories: {
              topic: "debate",
              prompt: "Read and discuss debate",
            },
          },
        },
        {
          id: "lesson-c1-7-3",
          title: {
            en: "Winning Debates",
            es: "Ganando Debates",
          },
          description: {
            en: "Apply debate & argumentation skills",
            es: "Aplica habilidades de debate y argumentación",
          },
          xpRequired: 7945,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "debate",
              prompt: "Advanced debate content and comprehension",
            },
            realtime: {
              scenario: "debate mastery",
              prompt: "Demonstrate mastery of debate",
            },
          },
        },
        {
          id: "lesson-c1-7-quiz",
          title: {
            en: "Debate & Argumentation Quiz",
            es: "Prueba de Debate y Argumentación",
          },
          description: {
            en: "Test your knowledge of debate & argumentation",
            es: "Prueba tus conocimientos de debate y argumentación",
          },
          xpRequired: 7980,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "debate",
            },
            grammar: {
              topics: ["debate structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c1-8",
      title: {
        en: "Cultural Analysis",
        es: "Análisis Cultural",
      },
      description: {
        en: "Deep culture",
        es: "Cultura profunda",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-8-1",
          title: {
            en: "Cultural Studies",
            es: "Estudios Culturales",
          },
          description: {
            en: "Learn key vocabulary for cultural analysis",
            es: "Aprende vocabulario clave para análisis cultural",
          },
          xpRequired: 8050,
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
          id: "lesson-c1-8-2",
          title: {
            en: "Interpreting Culture",
            es: "Interpretando Cultura",
          },
          description: {
            en: "Practice cultural analysis in conversation",
            es: "Practica análisis cultural en conversación",
          },
          xpRequired: 8085,
          xpReward: 60,
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
          id: "lesson-c1-8-3",
          title: {
            en: "Cross-Cultural Understanding",
            es: "Comprensión Intercultural",
          },
          description: {
            en: "Apply cultural analysis skills",
            es: "Aplica habilidades de análisis cultural",
          },
          xpRequired: 8120,
          xpReward: 55,
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
          id: "lesson-c1-8-quiz",
          title: {
            en: "Cultural Analysis Quiz",
            es: "Prueba de Análisis Cultural",
          },
          description: {
            en: "Test your knowledge of cultural analysis",
            es: "Prueba tus conocimientos de análisis cultural",
          },
          xpRequired: 8155,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
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
      id: "unit-c1-9",
      title: {
        en: "Literary Techniques",
        es: "Técnicas Literarias",
      },
      description: {
        en: "Literary analysis",
        es: "Análisis literario",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-c1-9-1",
          title: {
            en: "Literary Devices",
            es: "Dispositivos Literarios",
          },
          description: {
            en: "Learn key vocabulary for literary techniques",
            es: "Aprende vocabulario clave para técnicas literarias",
          },
          xpRequired: 8225,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
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
          id: "lesson-c1-9-2",
          title: {
            en: "Analyzing Texts",
            es: "Analizando Textos",
          },
          description: {
            en: "Practice literary techniques in conversation",
            es: "Practica técnicas literarias en conversación",
          },
          xpRequired: 8260,
          xpReward: 60,
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
          id: "lesson-c1-9-3",
          title: {
            en: "Literary Criticism",
            es: "Crítica Literaria",
          },
          description: {
            en: "Apply literary techniques skills",
            es: "Aplica habilidades de técnicas literarias",
          },
          xpRequired: 8295,
          xpReward: 55,
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
          id: "lesson-c1-9-quiz",
          title: {
            en: "Literary Techniques Quiz",
            es: "Prueba de Técnicas Literarias",
          },
          description: {
            en: "Test your knowledge of literary techniques",
            es: "Prueba tus conocimientos de técnicas literarias",
          },
          xpRequired: 8330,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
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
        },
      ],
    },
    {
      id: "unit-c1-10",
      title: {
        en: "Advanced Discourse",
        es: "Discurso Avanzado",
      },
      description: {
        en: "Complex communication",
        es: "Comunicación compleja",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-c1-10-1",
          title: {
            en: "Discourse Markers",
            es: "Marcadores del Discurso",
          },
          description: {
            en: "Learn key vocabulary for advanced discourse",
            es: "Aprende vocabulario clave para discurso avanzado",
          },
          xpRequired: 8400,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "discourse",
            },
            grammar: {
              topic: "discourse structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-c1-10-2",
          title: {
            en: "Coherent Arguments",
            es: "Argumentos Coherentes",
          },
          description: {
            en: "Practice advanced discourse in conversation",
            es: "Practica discurso avanzado en conversación",
          },
          xpRequired: 8435,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "discourse conversation",
              prompt: "Practice using discourse in real conversation",
            },
            stories: {
              topic: "discourse",
              prompt: "Read and discuss discourse",
            },
          },
        },
        {
          id: "lesson-c1-10-3",
          title: {
            en: "Fluent Expression",
            es: "Expresión Fluida",
          },
          description: {
            en: "Apply advanced discourse skills",
            es: "Aplica habilidades de discurso avanzado",
          },
          xpRequired: 8470,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "discourse",
              prompt: "Advanced discourse content and comprehension",
            },
            realtime: {
              scenario: "discourse mastery",
              prompt: "Demonstrate mastery of discourse",
            },
          },
        },
        {
          id: "lesson-c1-10-quiz",
          title: {
            en: "Advanced Discourse Quiz",
            es: "Prueba de Discurso Avanzado",
          },
          description: {
            en: "Test your knowledge of advanced discourse",
            es: "Prueba tus conocimientos de discurso avanzado",
          },
          xpRequired: 8505,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "discourse",
            },
            grammar: {
              topics: ["discourse structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        },
      ],
    },
];
