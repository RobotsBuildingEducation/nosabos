// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-b2-1",
  title: {
    en: "Past Perfect",
    es: "Pluscuamperfecto"
  },
  description: {
    en: "Had done",
    es: "Había hecho"
  },
  color: "#22C55E",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-1-1",
    title: {
      en: "Before It Happened",
      es: "Pluscuamperfecto - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for past perfect",
      es: "Aprende vocabulario clave para pluscuamperfecto"
    },
    xpRequired: 5025,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the past perfect (pluscuamperfecto)",
        focusPoints: ["había hablado, habías comido", "había + participle", "markers: ya, todavía no, antes de que"]
      },
      grammar: {
        topic: "an action before another past action",
        focusPoints: ["haber (imperfect: había) + participle", "ya había... cuando...", "sequencing earlier past events"]
      }
    }
  }, {
    id: "lesson-b2-1-2",
    title: {
      en: "Earlier Actions",
      es: "Pluscuamperfecto - Práctica"
    },
    description: {
      en: "Practice past perfect in conversation",
      es: "Practica pluscuamperfecto en conversación"
    },
    xpRequired: 5055,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "explaining what had already happened before an event",
        prompt: "Practice 'cuando llegué, ya había...' to order past events"
      },
      stories: {
        topic: "flashbacks and backstory",
        prompt: "Read a narrative and notice earlier events (había...)"
      }
    }
  }, {
    id: "lesson-b2-1-3",
    title: {
      en: "Complex Timelines",
      es: "Pluscuamperfecto - Aplicación"
    },
    description: {
      en: "Apply past perfect skills",
      es: "Aplica habilidades de pluscuamperfecto"
    },
    xpRequired: 5085,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "past perfect vs preterite and imperfect",
        prompt: "Read and order events using había + participle vs simple past"
      },
      realtime: {
        scenario: "recounting a misunderstanding that had built up",
        prompt: "Demonstrate the past perfect to sequence earlier and later past events"
      }
    }
  }, {
    id: "lesson-b2-1-quiz",
    title: {
      en: "Past Perfect Quiz",
      es: "Prueba de Pluscuamperfecto"
    },
    description: {
      en: "Test your knowledge of past perfect",
      es: "Prueba tus conocimientos de pluscuamperfecto"
    },
    xpRequired: 5115,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the past perfect",
        focusPoints: ["había + participle", "ya, todavía no, antes de que"]
      },
      grammar: {
        topics: ["sequencing past events"],
        focusPoints: ["había + participle", "past perfect vs preterite"]
      }
    }
  }]
}, {
  id: "unit-b2-2",
  title: {
    en: "Passive Voice",
    es: "Voz Pasiva"
  },
  description: {
    en: "Is done by",
    es: "Es hecho por"
  },
  color: "#3B82F6",
  position: {
    row: 0,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-2-1",
    title: {
      en: "It Was Done",
      es: "Fue Hecho"
    },
    description: {
      en: "Learn key vocabulary for passive voice",
      es: "Aprende vocabulario clave para voz pasiva"
    },
    xpRequired: 5175,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the passive voice",
        focusPoints: ["ser + participle + por (fue construido por)", "pasiva refleja: se venden casas", "estar + participle: la puerta está cerrada"]
      },
      grammar: {
        topic: "forming and choosing passive structures",
        focusPoints: ["ser-passive vs pasiva refleja (se)", "agreement of the participle", "when to use passive vs active"]
      }
    }
  }, {
    id: "lesson-b2-2-2",
    title: {
      en: "Formal Writing",
      es: "Escritura Formal"
    },
    description: {
      en: "Practice passive voice in conversation",
      es: "Practica voz pasiva en conversación"
    },
    xpRequired: 5205,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing how a product is made",
        prompt: "Practice 'se hace...' and 'es fabricado por...' to describe processes"
      },
      stories: {
        topic: "the passive voice in reports and news",
        prompt: "Read a news report and notice passive constructions"
      }
    }
  }, {
    id: "lesson-b2-2-3",
    title: {
      en: "Professional Tone",
      es: "Tono Profesional"
    },
    description: {
      en: "Apply passive voice skills",
      es: "Aplica habilidades de voz pasiva"
    },
    xpRequired: 5235,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "passive vs active and impersonal se",
        prompt: "Read and convert between active, passive, and impersonal"
      },
      realtime: {
        scenario: "explaining a procedure formally",
        prompt: "Demonstrate passive and pasiva refleja in a formal description"
      }
    }
  }, {
    id: "lesson-b2-2-quiz",
    title: {
      en: "Passive Voice Quiz",
      es: "Prueba de Voz Pasiva"
    },
    description: {
      en: "Test your knowledge of passive voice",
      es: "Prueba tus conocimientos de voz pasiva"
    },
    xpRequired: 5265,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the passive voice",
        focusPoints: ["ser + participle + por", "pasiva refleja (se vende)", "estar + participle"]
      },
      grammar: {
        topics: ["forming and choosing passive structures"],
        focusPoints: ["ser-passive vs pasiva refleja", "participle agreement"]
      }
    }
  }]
}, {
  id: "unit-b2-3",
  title: {
    en: "Reported Speech",
    es: "Discurso Indirecto"
  },
  description: {
    en: "He said that...",
    es: "Él dijo que..."
  },
  color: "#F59E0B",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-3-1",
    title: {
      en: "She Said That...",
      es: "Discurso Indirecto - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for reported speech",
      es: "Aprende vocabulario clave para discurso indirecto"
    },
    xpRequired: 5325,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "reporting what others said",
        focusPoints: ["dijo que, comentó que, añadió que", "preguntó si / qué / cuándo", "pidió/sugirió que + subjunctive"]
      },
      grammar: {
        topic: "reported speech and backshift",
        focusPoints: ["present → imperfect (dice → dijo que ...aba)", "preterite → past perfect, future → conditional", "deixis: aquí→allí, hoy→aquel día"]
      }
    }
  }, {
    id: "lesson-b2-3-2",
    title: {
      en: "Quoting Others",
      es: "Discurso Indirecto - Práctica"
    },
    description: {
      en: "Practice reported speech in conversation",
      es: "Practica discurso indirecto en conversación"
    },
    xpRequired: 5355,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "passing on a message from one friend to another",
        prompt: "Practice 'me dijo que...' and 'me preguntó si...' with backshift"
      },
      stories: {
        topic: "reporting a conversation",
        prompt: "Read a dialogue and retell it in reported speech"
      }
    }
  }, {
    id: "lesson-b2-3-3",
    title: {
      en: "Retelling Stories",
      es: "Discurso Indirecto - Aplicación"
    },
    description: {
      en: "Apply reported speech skills",
      es: "Aplica habilidades de discurso indirecto"
    },
    xpRequired: 5385,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "direct vs reported speech",
        prompt: "Read and convert quotes into reported speech"
      },
      realtime: {
        scenario: "relaying an argument you witnessed",
        prompt: "Demonstrate reported speech with correct tense and pronoun shifts"
      }
    }
  }, {
    id: "lesson-b2-3-quiz",
    title: {
      en: "Reported Speech Quiz",
      es: "Prueba de Discurso Indirecto"
    },
    description: {
      en: "Test your knowledge of reported speech",
      es: "Prueba tus conocimientos de discurso indirecto"
    },
    xpRequired: 5415,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "reported speech",
        focusPoints: ["dijo que, preguntó si, pidió que", "comentó, añadió, sugirió"]
      },
      grammar: {
        topics: ["reported speech and backshift"],
        focusPoints: ["tense backshift", "deixis: aquí→allí, hoy→aquel día"]
      }
    }
  }]
}, {
  id: "unit-b2-4",
  title: {
    en: "Relative Clauses",
    es: "Cláusulas Relativas"
  },
  description: {
    en: "Who, which, that",
    es: "Que, quien"
  },
  color: "#8B5CF6",
  position: {
    row: 1,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-4-1",
    title: {
      en: "Who, Which, That",
      es: "Quien, Cual, Que"
    },
    description: {
      en: "Learn key vocabulary for relative clauses",
      es: "Aprende vocabulario clave para cláusulas relativas"
    },
    xpRequired: 5475,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "relative pronouns",
        focusPoints: ["que, quien/quienes", "el/la que, el/la cual", "cuyo/a, donde"]
      },
      grammar: {
        topic: "joining sentences with relative clauses",
        focusPoints: ["restrictive vs non-restrictive (commas)", "preposition + relative: con quien, en el que", "cuyo for possession"]
      }
    }
  }, {
    id: "lesson-b2-4-2",
    title: {
      en: "Connecting Ideas",
      es: "Conectando Ideas"
    },
    description: {
      en: "Practice relative clauses in conversation",
      es: "Practica cláusulas relativas en conversación"
    },
    xpRequired: 5505,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing a person or place precisely",
        prompt: "Practice combining ideas with 'que', 'quien', and 'donde'"
      },
      stories: {
        topic: "relative clauses in descriptions",
        prompt: "Read a detailed description and notice the relative clauses"
      }
    }
  }, {
    id: "lesson-b2-4-3",
    title: {
      en: "Complex Sentences",
      es: "Oraciones Complejas"
    },
    description: {
      en: "Apply relative clauses skills",
      es: "Aplica habilidades de cláusulas relativas"
    },
    xpRequired: 5535,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "complex relative clauses",
        prompt: "Read sentences with 'el cual' and 'cuyo' and unpack them"
      },
      realtime: {
        scenario: "defining something without naming it",
        prompt: "Demonstrate relative clauses to define and add information"
      }
    }
  }, {
    id: "lesson-b2-4-quiz",
    title: {
      en: "Relative Clauses Quiz",
      es: "Prueba de Cláusulas Relativas"
    },
    description: {
      en: "Test your knowledge of relative clauses",
      es: "Prueba tus conocimientos de cláusulas relativas"
    },
    xpRequired: 5565,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "relative pronouns",
        focusPoints: ["que, quien, el que/el cual", "cuyo, donde"]
      },
      grammar: {
        topics: ["relative clauses"],
        focusPoints: ["restrictive vs non-restrictive", "preposition + relative"]
      }
    }
  }]
}, {
  id: "unit-b2-5",
  title: {
    en: "Formal vs Informal",
    es: "Formal e Informal"
  },
  description: {
    en: "Register switching",
    es: "Cambio de registro"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-5-1",
    title: {
      en: "Registers of Speech",
      es: "Formal e Informal - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for formal vs informal",
      es: "Aprende vocabulario clave para formal e informal"
    },
    xpRequired: 5625,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "formal and informal register",
        focusPoints: ["tú vs usted (and ustedes)", "informal: hola, ¿qué tal?, un beso", "formal: buenos días, atentamente"]
      },
      grammar: {
        topic: "shifting register",
        focusPoints: ["verb agreement with tú vs usted", "softened requests (¿le importaría...?)", "formal vs colloquial vocabulary"]
      }
    }
  }, {
    id: "lesson-b2-5-2",
    title: {
      en: "Appropriate Language",
      es: "Formal e Informal - Práctica"
    },
    description: {
      en: "Practice formal vs informal in conversation",
      es: "Practica formal e informal en conversación"
    },
    xpRequired: 5655,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "the same message to a friend vs to your boss",
        prompt: "Practice switching between tú/informal and usted/formal"
      },
      stories: {
        topic: "register in messages and letters",
        prompt: "Read a formal and an informal message and compare them"
      }
    }
  }, {
    id: "lesson-b2-5-3",
    title: {
      en: "Context Matters",
      es: "Formal e Informal - Aplicación"
    },
    description: {
      en: "Apply formal vs informal skills",
      es: "Aplica habilidades de formal e informal"
    },
    xpRequired: 5685,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "matching register to context",
        prompt: "Read texts and judge whether the register fits the situation"
      },
      realtime: {
        scenario: "introducing yourself in an interview vs at a party",
        prompt: "Demonstrate appropriate register for formal and informal settings"
      }
    }
  }, {
    id: "lesson-b2-5-quiz",
    title: {
      en: "Formal vs Informal Quiz",
      es: "Prueba de Formal e Informal"
    },
    description: {
      en: "Test your knowledge of formal vs informal",
      es: "Prueba tus conocimientos de formal e informal"
    },
    xpRequired: 5715,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "formal vs informal register",
        focusPoints: ["tú vs usted", "formal vs colloquial greetings"]
      },
      grammar: {
        topics: ["shifting register"],
        focusPoints: ["tú vs usted agreement", "softened formal requests"]
      }
    }
  }]
}, {
  id: "unit-b2-6",
  title: {
    en: "Business Spanish",
    es: "Español de Negocios"
  },
  description: {
    en: "Professional language",
    es: "Lenguaje profesional"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-6-1",
    title: {
      en: "Corporate World",
      es: "Mundo Corporativo"
    },
    description: {
      en: "Learn key vocabulary for business spanish",
      es: "Aprende vocabulario clave para español de negocios"
    },
    xpRequired: 5775,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "business vocabulary",
        focusPoints: ["la empresa, el departamento, el cargo", "las ventas, el presupuesto, el contrato", "el cliente, el proveedor, la reunión"]
      },
      grammar: {
        topic: "business communication structures",
        focusPoints: ["formal email openings and closings", "le agradecería que + subjunctive", "polite negotiation phrases"]
      }
    }
  }, {
    id: "lesson-b2-6-2",
    title: {
      en: "Professional Meetings",
      es: "Reuniones Profesionales"
    },
    description: {
      en: "Practice business spanish in conversation",
      es: "Practica español de negocios en conversación"
    },
    xpRequired: 5805,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a meeting to discuss a project deadline",
        prompt: "Practice business vocabulary for meetings and updates"
      },
      stories: {
        topic: "a business email exchange",
        prompt: "Read a professional email thread and discuss its purpose"
      }
    }
  }, {
    id: "lesson-b2-6-3",
    title: {
      en: "Business Communication",
      es: "Comunicación Empresarial"
    },
    description: {
      en: "Apply business spanish skills",
      es: "Aplica habilidades de español de negocios"
    },
    xpRequired: 5835,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "interpreting business documents",
        prompt: "Read a short proposal or report and find the key points"
      },
      realtime: {
        scenario: "negotiating terms with a client",
        prompt: "Demonstrate professional negotiation language"
      }
    }
  }, {
    id: "lesson-b2-6-quiz",
    title: {
      en: "Business Spanish Quiz",
      es: "Prueba de Español de Negocios"
    },
    description: {
      en: "Test your knowledge of business spanish",
      es: "Prueba tus conocimientos de español de negocios"
    },
    xpRequired: 5865,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "business vocabulary",
        focusPoints: ["empresa, ventas, presupuesto, contrato", "cliente, proveedor, reunión"]
      },
      grammar: {
        topics: ["business communication structures"],
        focusPoints: ["formal email formulas", "polite negotiation phrases"]
      }
    }
  }]
}, {
  id: "unit-b2-7",
  title: {
    en: "Science & Innovation",
    es: "Ciencia e Innovación"
  },
  description: {
    en: "Scientific topics",
    es: "Temas científicos"
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-7-1",
    title: {
      en: "Scientific Terms",
      es: "Términos Científicos"
    },
    description: {
      en: "Learn key vocabulary for science & innovation",
      es: "Aprende vocabulario clave para ciencia e innovación"
    },
    xpRequired: 5925,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "science and technology vocabulary",
        focusPoints: ["la investigación, el experimento, la hipótesis", "la tecnología, el descubrimiento, los datos", "la inteligencia artificial, el avance"]
      },
      grammar: {
        topic: "explaining processes and findings",
        focusPoints: ["impersonal se (se demostró que)", "passive voice for results", "connectors: debido a, por lo tanto"]
      }
    }
  }, {
    id: "lesson-b2-7-2",
    title: {
      en: "Technological Advances",
      es: "Avances Tecnológicos"
    },
    description: {
      en: "Practice science & innovation in conversation",
      es: "Practica ciencia e innovación en conversación"
    },
    xpRequired: 5955,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "explaining a new technology to a friend",
        prompt: "Practice science vocabulary to describe how something works"
      },
      stories: {
        topic: "a popular-science article",
        prompt: "Read about a discovery and discuss its impact"
      }
    }
  }, {
    id: "lesson-b2-7-3",
    title: {
      en: "Future of Science",
      es: "Futuro de la Ciencia"
    },
    description: {
      en: "Apply science & innovation skills",
      es: "Aplica habilidades de ciencia e innovación"
    },
    xpRequired: 5985,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["future", "predict"], ["science", "scientific", "technology"]],
    content: {
      reading: {
        topic: "evidence-based predictions about emerging science",
        prompt: "Read predictions about an emerging technology and distinguish evidence from speculation"
      },
      realtime: {
        scenario: "considering how a scientific advance may change daily life",
        prompt: "Predict how a scientific advance could affect daily life and defend the prediction"
      }
    }
  }, {
    id: "lesson-b2-7-quiz",
    title: {
      en: "Science & Innovation Quiz",
      es: "Prueba de Ciencia e Innovación"
    },
    description: {
      en: "Test your knowledge of science & innovation",
      es: "Prueba tus conocimientos de ciencia e innovación"
    },
    xpRequired: 6015,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "science and technology",
        focusPoints: ["investigación, experimento, hipótesis", "tecnología, datos, inteligencia artificial"]
      },
      grammar: {
        topics: ["explaining processes and findings"],
        focusPoints: ["impersonal se, passive for results", "cause/result connectors"]
      }
    }
  }]
}, {
  id: "unit-b2-8",
  title: {
    en: "Social Issues",
    es: "Problemas Sociales"
  },
  description: {
    en: "Society and issues",
    es: "Sociedad y problemas"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-8-1",
    title: {
      en: "Society Today",
      es: "Problemas Sociales - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for social issues",
      es: "Aprende vocabulario clave para problemas sociales"
    },
    xpRequired: 6075,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "social issues vocabulary",
        focusPoints: ["la desigualdad, la pobreza, los derechos", "la justicia, la inmigración, la discriminación", "el voluntariado, la solidaridad"]
      },
      grammar: {
        topic: "discussing problems and proposals",
        focusPoints: ["es injusto que / no creo que + subjunctive", "expressing cause and consequence", "general/impersonal statements"]
      }
    }
  }, {
    id: "lesson-b2-8-2",
    title: {
      en: "Discussing Problems",
      es: "Problemas Sociales - Práctica"
    },
    description: {
      en: "Practice social issues in conversation",
      es: "Practica problemas sociales en conversación"
    },
    xpRequired: 6105,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "discussing a social problem in your community",
        prompt: "Practice social-issue vocabulary and opinion structures"
      },
      stories: {
        topic: "a story about a social cause",
        prompt: "Read about a community initiative and discuss it"
      }
    }
  }, {
    id: "lesson-b2-8-3",
    title: {
      en: "Making Change",
      es: "Problemas Sociales - Aplicación"
    },
    description: {
      en: "Apply social issues skills",
      es: "Aplica habilidades de problemas sociales"
    },
    xpRequired: 6135,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "argument and evidence on social issues",
        prompt: "Read an opinion piece and identify claims and support"
      },
      realtime: {
        scenario: "proposing a solution to inequality",
        prompt: "Demonstrate social vocabulary to argue for change"
      }
    }
  }, {
    id: "lesson-b2-8-quiz",
    title: {
      en: "Social Issues Quiz",
      es: "Prueba de Problemas Sociales"
    },
    description: {
      en: "Test your knowledge of social issues",
      es: "Prueba tus conocimientos de problemas sociales"
    },
    xpRequired: 6165,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "social issues",
        focusPoints: ["desigualdad, pobreza, derechos", "justicia, inmigración, discriminación"]
      },
      grammar: {
        topics: ["discussing problems and proposals"],
        focusPoints: ["es injusto que + subjunctive", "cause and consequence"]
      }
    }
  }]
}, {
  id: "unit-b2-9",
  title: {
    en: "Arts & Literature",
    es: "Artes y Literatura"
  },
  description: {
    en: "Cultural works",
    es: "Obras culturales"
  },
  color: "#F97316",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-9-1",
    title: {
      en: "Creative Expression",
      es: "Expresión Creativa"
    },
    description: {
      en: "Learn key vocabulary for arts & literature",
      es: "Aprende vocabulario clave para artes y literatura"
    },
    xpRequired: 6225,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "arts and literature vocabulary",
        focusPoints: ["la novela, el cuento, el autor", "la obra, la pintura, la escultura", "el género, la trama, el personaje"]
      },
      grammar: {
        topic: "describing and reviewing art",
        focusPoints: ["se trata de / trata sobre", "opinion + reason (me gustó porque)", "past tenses to summarize a plot"]
      }
    }
  }, {
    id: "lesson-b2-9-2",
    title: {
      en: "Artistic Movements",
      es: "Movimientos Artísticos"
    },
    description: {
      en: "Practice arts & literature in conversation",
      es: "Practica artes y literatura en conversación"
    },
    xpRequired: 6255,
    xpReward: 40,
    modes: ["realtime", "stories"],
    objectiveAlignment: [["artistic"], ["movement"]],
    content: {
      realtime: {
        scenario: "comparing two artistic movements",
        prompt: "Compare two artistic movements and explain a defining feature of each"
      },
      stories: {
        topic: "the origins and influence of an artistic movement",
        prompt: "Read about an artistic movement and identify its period, style, and influence"
      }
    }
  }, {
    id: "lesson-b2-9-3",
    title: {
      en: "Cultural Analysis",
      es: "Análisis Cultural"
    },
    description: {
      en: "Apply arts & literature skills",
      es: "Aplica habilidades de artes y literatura"
    },
    xpRequired: 6285,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["cultural"], ["context"]],
    content: {
      reading: {
        topic: "the cultural context behind a creative work",
        prompt: "Read a cultural text or artwork description and identify the values and context it reflects"
      },
      realtime: {
        scenario: "connecting a creative work to its time and community",
        prompt: "Analyze how a work reflects its cultural and historical context"
      }
    }
  }, {
    id: "lesson-b2-9-quiz",
    title: {
      en: "Arts & Literature Quiz",
      es: "Prueba de Artes y Literatura"
    },
    description: {
      en: "Test your knowledge of arts & literature",
      es: "Prueba tus conocimientos de artes y literatura"
    },
    xpRequired: 6315,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "arts and literature",
        focusPoints: ["novela, cuento, autor, obra", "género, trama, personaje"]
      },
      grammar: {
        topics: ["describing and reviewing art"],
        focusPoints: ["se trata de / trata sobre", "opinion + reason"]
      }
    }
  }]
}, {
  id: "unit-b2-10",
  title: {
    en: "Politics & Society",
    es: "Política y Sociedad"
  },
  description: {
    en: "Civic topics",
    es: "Temas cívicos"
  },
  color: "#84CC16",
  position: {
    row: 4,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-10-1",
    title: {
      en: "Civic Engagement",
      es: "Participación Cívica"
    },
    description: {
      en: "Learn key vocabulary for politics & society",
      es: "Aprende vocabulario clave para política y sociedad"
    },
    xpRequired: 6375,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "politics and society vocabulary",
        focusPoints: ["el gobierno, las elecciones, el partido", "la ley, el ciudadano, el derecho", "votar, gobernar, la democracia"]
      },
      grammar: {
        topic: "discussing politics respectfully",
        focusPoints: ["dudo que / no creo que + subjunctive", "concession (aunque, si bien)", "impersonal opinions (se dice que)"]
      }
    }
  }, {
    id: "lesson-b2-10-2",
    title: {
      en: "Political Discourse",
      es: "Discurso Político"
    },
    description: {
      en: "Practice politics & society in conversation",
      es: "Practica política y sociedad en conversación"
    },
    xpRequired: 6405,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a calm discussion about an election",
        prompt: "Practice politics vocabulary and balanced opinion language"
      },
      stories: {
        topic: "a news piece on a policy",
        prompt: "Read about a political issue and discuss different views"
      }
    }
  }, {
    id: "lesson-b2-10-3",
    title: {
      en: "Active Citizenship",
      es: "Ciudadanía Activa"
    },
    description: {
      en: "Apply politics & society skills",
      es: "Aplica habilidades de política y sociedad"
    },
    xpRequired: 6435,
    xpReward: 35,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["citizen", "civic"], ["action", "participation"]],
    content: {
      reading: {
        topic: "ways citizens can participate in their community",
        prompt: "Read a community proposal and identify a concrete action citizens can take"
      },
      realtime: {
        scenario: "organizing a practical response to a community need",
        prompt: "Propose a civic action, explain its benefit, and respond to one concern"
      }
    }
  }, {
    id: "lesson-b2-10-quiz",
    title: {
      en: "Politics & Society Quiz",
      es: "Prueba de Política y Sociedad"
    },
    description: {
      en: "Test your knowledge of politics & society",
      es: "Prueba tus conocimientos de política y sociedad"
    },
    xpRequired: 6465,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "politics and society",
        focusPoints: ["gobierno, elecciones, partido, ley", "ciudadano, votar, democracia"]
      },
      grammar: {
        topics: ["discussing politics"],
        focusPoints: ["dudo que + subjunctive", "concession: aunque, si bien"]
      }
    }
  }]
}, {
  id: "unit-b2-11",
  title: {
    en: "Health & Lifestyle",
    es: "Salud y Estilo de Vida"
  },
  description: {
    en: "Wellness",
    es: "Bienestar"
  },
  color: "#14B8A6",
  position: {
    row: 5,
    offset: 0
  },
  lessons: [{
    id: "lesson-b2-11-1",
    title: {
      en: "Wellness Choices",
      es: "Elecciones de Bienestar"
    },
    description: {
      en: "Learn key vocabulary for health & lifestyle",
      es: "Aprende vocabulario clave para salud y estilo de vida"
    },
    xpRequired: 6525,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "health and lifestyle vocabulary",
        focusPoints: ["la salud, el bienestar, la dieta", "el ejercicio, el estrés, el descanso", "los hábitos, el sueño, la alimentación"]
      },
      grammar: {
        topic: "talking about habits and advice",
        focusPoints: ["soler + infinitive for routines", "es bueno que / te recomiendo que + subjunctive", "reflexive verbs (cuidarse, relajarse)"]
      }
    }
  }, {
    id: "lesson-b2-11-2",
    title: {
      en: "Balanced Living",
      es: "Vida Equilibrada"
    },
    description: {
      en: "Practice health & lifestyle in conversation",
      es: "Practica salud y estilo de vida en conversación"
    },
    xpRequired: 6555,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking to a friend about healthier habits",
        prompt: "Practice health vocabulary and advice ('deberías', 'es bueno que')"
      },
      stories: {
        topic: "a wellness article",
        prompt: "Read tips on a healthy lifestyle and discuss"
      }
    }
  }, {
    id: "lesson-b2-11-3",
    title: {
      en: "Holistic Health",
      es: "Salud Holística"
    },
    description: {
      en: "Apply health & lifestyle skills",
      es: "Aplica habilidades de salud y estilo de vida"
    },
    xpRequired: 6585,
    xpReward: 55,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["wellness", "wellbeing"], ["physical"], ["mental"]],
    content: {
      reading: {
        topic: "how different dimensions of wellbeing interact",
        prompt: "Read a wellness plan and identify how sleep, nutrition, movement, and stress affect one another"
      },
      realtime: {
        scenario: "creating a balanced plan for overall wellbeing",
        prompt: "Discuss a wellbeing plan that supports both physical and mental health"
      }
    }
  }, {
    id: "lesson-b2-11-quiz",
    title: {
      en: "Health & Lifestyle Quiz",
      es: "Prueba de Salud y Estilo de Vida"
    },
    description: {
      en: "Test your knowledge of health & lifestyle",
      es: "Prueba tus conocimientos de salud y estilo de vida"
    },
    xpRequired: 6615,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "health and lifestyle",
        focusPoints: ["salud, bienestar, dieta, ejercicio", "estrés, hábitos, descanso"]
      },
      grammar: {
        topics: ["habits and advice"],
        focusPoints: ["soler + infinitive", "es bueno que + subjunctive"]
      }
    }
  }]
}, {
  id: "unit-b2-12",
  title: {
    en: "Abstract Concepts",
    es: "Conceptos Abstractos"
  },
  description: {
    en: "Complex ideas",
    es: "Ideas complejas"
  },
  color: "#A855F7",
  position: {
    row: 5,
    offset: 1
  },
  lessons: [{
    id: "lesson-b2-12-1",
    title: {
      en: "Philosophical Ideas",
      es: "Ideas Filosóficas"
    },
    description: {
      en: "Learn key vocabulary for abstract concepts",
      es: "Aprende vocabulario clave para conceptos abstractos"
    },
    xpRequired: 6675,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "vocabulary for abstract ideas",
        focusPoints: ["la libertad, la felicidad, la justicia", "el éxito, la verdad, el tiempo", "el significado, el propósito"]
      },
      grammar: {
        topic: "discussing abstract concepts",
        focusPoints: ["lo + adjective (lo importante, lo difícil)", "subjunctive after value judgments (es esencial que)", "nominalization of verbs"]
      }
    }
  }, {
    id: "lesson-b2-12-2",
    title: {
      en: "Deep Thinking",
      es: "Pensamiento Profundo"
    },
    description: {
      en: "Practice abstract concepts in conversation",
      es: "Practica conceptos abstractos en conversación"
    },
    xpRequired: 6705,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a philosophical chat about happiness",
        prompt: "Practice abstract vocabulary and 'lo + adjetivo' to discuss ideas"
      },
      stories: {
        topic: "an essay on an abstract theme",
        prompt: "Read a reflective text and discuss its main idea"
      }
    }
  }, {
    id: "lesson-b2-12-3",
    title: {
      en: "Theoretical Discussion",
      es: "Discusión Teórica"
    },
    description: {
      en: "Apply abstract concepts skills",
      es: "Aplica habilidades de conceptos abstractos"
    },
    xpRequired: 6735,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "interpreting abstract arguments",
        prompt: "Read a philosophical passage and paraphrase its point"
      },
      realtime: {
        scenario: "defending what success means to you",
        prompt: "Demonstrate abstract vocabulary to express a nuanced view"
      }
    }
  }, {
    id: "lesson-b2-12-quiz",
    title: {
      en: "Abstract Concepts Quiz",
      es: "Prueba de Conceptos Abstractos"
    },
    description: {
      en: "Test your knowledge of abstract concepts",
      es: "Prueba tus conocimientos de conceptos abstractos"
    },
    xpRequired: 6765,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "abstract concepts",
        focusPoints: ["libertad, felicidad, justicia", "éxito, verdad, propósito"]
      },
      grammar: {
        topics: ["discussing abstract concepts"],
        focusPoints: ["lo + adjetivo", "subjunctive after value judgments"]
      }
    }
  }]
}];
