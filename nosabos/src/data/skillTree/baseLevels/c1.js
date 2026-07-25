// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-c1-1",
  title: {
    en: "Subjunctive Present",
    es: "Subjuntivo Presente"
  },
  description: {
    en: "Complex moods",
    es: "Modos complejos"
  },
  color: "#22C55E",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-c1-1-1",
    title: {
      en: "Doubt and Desire",
      es: "Duda y Deseo"
    },
    description: {
      en: "Learn key vocabulary for subjunctive present",
      es: "Aprende vocabulario clave para subjuntivo presente"
    },
    xpRequired: 6825,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "verbs and expressions that trigger the present subjunctive",
        focusPoints: ["querer que, esperar que, dudar que", "es importante que, es necesario que", "ojalá (que)"]
      },
      grammar: {
        topic: "forming the present subjunctive",
        focusPoints: ["regular: hable, coma, viva", "irregulars: sea, vaya, haya, sepa, dé", "stem changes: pueda, quiera, pida"]
      }
    }
  }, {
    id: "lesson-c1-1-2",
    title: {
      en: "Expressing Wishes",
      es: "Expresando Deseos"
    },
    description: {
      en: "Practice subjunctive present in conversation",
      es: "Practica subjuntivo presente en conversación"
    },
    xpRequired: 6860,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "giving advice and wishes to a friend (espero que te vaya bien)",
        prompt: "Practice the present subjunctive after querer que, esperar que, and ojalá"
      },
      stories: {
        topic: "the subjunctive in opinions and emotions",
        prompt: "Read a text and spot the subjunctive after 'me alegra que' and 'es una lástima que'"
      }
    }
  }, {
    id: "lesson-c1-1-3",
    title: {
      en: "Nuanced Meaning",
      es: "Significado Matizado"
    },
    description: {
      en: "Apply subjunctive present skills",
      es: "Aplica habilidades de subjuntivo presente"
    },
    xpRequired: 6895,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "subjunctive vs indicative in subordinate clauses",
        prompt: "Read and decide when a clause needs subjunctive (doubt, emotion, wish) vs indicative (fact)"
      },
      realtime: {
        scenario: "negotiating plans using cuando, para que, and a menos que",
        prompt: "Demonstrate the present subjunctive in purpose, time, and condition clauses"
      }
    }
  }, {
    id: "lesson-c1-1-quiz",
    title: {
      en: "Subjunctive Present Quiz",
      es: "Prueba de Subjuntivo Presente"
    },
    description: {
      en: "Test your knowledge of subjunctive present",
      es: "Prueba tus conocimientos de subjuntivo presente"
    },
    xpRequired: 6930,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "present subjunctive triggers",
        focusPoints: ["querer/esperar/dudar que", "es importante/necesario que, ojalá"]
      },
      grammar: {
        topics: ["forming and using the present subjunctive"],
        focusPoints: ["subjunctive vs indicative"]
      }
    }
  }]
}, {
  id: "unit-c1-2",
  title: {
    en: "Subjunctive Past",
    es: "Subjuntivo Pasado"
  },
  description: {
    en: "Past subjunctive",
    es: "Subjuntivo pasado"
  },
  color: "#3B82F6",
  position: {
    row: 0,
    offset: 1
  },
  lessons: [{
    id: "lesson-c1-2-1",
    title: {
      en: "If Only...",
      es: "Si Tan Solo..."
    },
    description: {
      en: "Learn key vocabulary for subjunctive past",
      es: "Aprende vocabulario clave para subjuntivo pasado"
    },
    xpRequired: 7000,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "past-tense triggers for the imperfect subjunctive",
        focusPoints: ["quería que, esperaba que, dudaba que", "como si + past subjunctive", "ojalá (pudiera)"]
      },
      grammar: {
        topic: "forming the imperfect subjunctive (-ra and -se forms)",
        focusPoints: ["hablara/hablase, comiera/comiese", "irregulars: fuera, tuviera, pudiera, hiciera", "built from the 3rd-person plural preterite stem"]
      }
    }
  }, {
    id: "lesson-c1-2-2",
    title: {
      en: "Contrary to Fact",
      es: "Contrario a la Realidad"
    },
    description: {
      en: "Practice subjunctive past in conversation",
      es: "Practica subjuntivo pasado en conversación"
    },
    xpRequired: 7035,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "making polite requests with quisiera and me gustaría que",
        prompt: "Practice softening requests and wishes with the imperfect subjunctive"
      },
      stories: {
        topic: "the past subjunctive in storytelling and hypotheticals",
        prompt: "Read a narrative and notice 'como si fuera' and reported wishes"
      }
    }
  }, {
    id: "lesson-c1-2-3",
    title: {
      en: "Complex Emotions",
      es: "Emociones Complejas"
    },
    description: {
      en: "Apply subjunctive past skills",
      es: "Aplica habilidades de subjuntivo pasado"
    },
    xpRequired: 7070,
    xpReward: 35,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["emotion", "regret", "wish"], ["past"]],
    content: {
      reading: {
        topic: "regret and desire expressed through past-subjunctive forms",
        prompt: "Read a reflection and identify how past-subjunctive forms express regret or desire"
      },
      realtime: {
        scenario: "reflecting on emotionally significant unreal past situations",
        prompt: "Express regret, wishes, and emotional reactions about unreal past situations"
      }
    }
  }, {
    id: "lesson-c1-2-quiz",
    title: {
      en: "Subjunctive Past Quiz",
      es: "Prueba de Subjuntivo Pasado"
    },
    description: {
      en: "Test your knowledge of subjunctive past",
      es: "Prueba tus conocimientos de subjuntivo pasado"
    },
    xpRequired: 7105,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "imperfect subjunctive triggers",
        focusPoints: ["quería/esperaba/dudaba que", "como si, ojalá + past subjunctive"]
      },
      grammar: {
        topics: ["forming and using the imperfect subjunctive"],
        focusPoints: ["-ra/-se forms (fuera, tuviera)", "si-clauses"]
      }
    }
  }]
}, {
  id: "unit-c1-3",
  title: {
    en: "Complex Conditionals",
    es: "Condicionales Complejos"
  },
  description: {
    en: "If I had...",
    es: "Si hubiera..."
  },
  color: "#F59E0B",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-c1-3-1",
    title: {
      en: "Advanced If Clauses",
      es: "Cláusulas If Avanzadas"
    },
    description: {
      en: "Learn key vocabulary for complex conditionals",
      es: "Aprende vocabulario clave para condicionales complejos"
    },
    xpRequired: 7175,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "connectors for conditions and hypotheses",
        focusPoints: ["si, a menos que, en caso de que", "siempre que, con tal de que", "de + infinitive (de haberlo sabido)"]
      },
      grammar: {
        topic: "the three types of si-clauses",
        focusPoints: ["si tengo tiempo, iré (real)", "si tuviera tiempo, iría (unreal present)", "si hubiera tenido tiempo, habría ido (unreal past)"]
      }
    }
  }, {
    id: "lesson-c1-3-2",
    title: {
      en: "Mixed Conditionals",
      es: "Condicionales Mixtos"
    },
    description: {
      en: "Practice complex conditionals in conversation",
      es: "Practica condicionales complejos en conversación"
    },
    xpRequired: 7210,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "discussing 'what would you do if...' dilemmas",
        prompt: "Practice unreal conditionals like 'si pudiera, viviría en...'"
      },
      stories: {
        topic: "regrets and alternate outcomes (the third conditional)",
        prompt: "Read about a missed chance and discuss 'lo que habría pasado si...'"
      }
    }
  }, {
    id: "lesson-c1-3-3",
    title: {
      en: "Sophisticated Logic",
      es: "Lógica Sofisticada"
    },
    description: {
      en: "Apply complex conditionals skills",
      es: "Aplica habilidades de condicionales complejos"
    },
    xpRequired: 7245,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "mixed and advanced conditional structures",
        prompt: "Read and analyze conditionals that mix time frames"
      },
      realtime: {
        scenario: "negotiating with conditions (con tal de que, a no ser que)",
        prompt: "Demonstrate conditional clauses across real, unreal, and past-unreal situations"
      }
    }
  }, {
    id: "lesson-c1-3-quiz",
    title: {
      en: "Complex Conditionals Quiz",
      es: "Prueba de Condicionales Complejos"
    },
    description: {
      en: "Test your knowledge of complex conditionals",
      es: "Prueba tus conocimientos de condicionales complejos"
    },
    xpRequired: 7280,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "conditional connectors",
        focusPoints: ["si, a menos que, en caso de que", "con tal de que, siempre que"]
      },
      grammar: {
        topics: ["the three si-clause types", "mixed conditionals"],
        focusPoints: ["si + present / imperfect subj / pluperfect subj"]
      }
    }
  }]
}, {
  id: "unit-c1-4",
  title: {
    en: "Idiomatic Expressions",
    es: "Expresiones Idiomáticas"
  },
  description: {
    en: "Idioms and sayings",
    es: "Modismos y dichos"
  },
  color: "#8B5CF6",
  position: {
    row: 1,
    offset: 1
  },
  lessons: [{
    id: "lesson-c1-4-1",
    title: {
      en: "Native Phrases",
      es: "Frases Nativas"
    },
    description: {
      en: "Learn key vocabulary for idiomatic expressions",
      es: "Aprende vocabulario clave para expresiones idiomáticas"
    },
    xpRequired: 7350,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "high-frequency Spanish idioms",
        focusPoints: ["echar de menos (to miss someone)", "darse cuenta de (to realize)", "valer la pena (to be worth it)", "tener ganas de (to feel like)"]
      },
      grammar: {
        topic: "verbal idiom structures",
        focusPoints: ["reflexive idioms: ponerse las pilas, hacerse el tonto", "dar idioms: dar la lata, dar igual", "fixed prepositions inside idioms"]
      }
    }
  }, {
    id: "lesson-c1-4-2",
    title: {
      en: "Sound Natural",
      es: "Sonar Natural"
    },
    description: {
      en: "Practice idiomatic expressions in conversation",
      es: "Practica expresiones idiomáticas en conversación"
    },
    xpRequired: 7385,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "catching up with a friend using everyday idioms",
        prompt: "Practice using idioms like 'echar de menos' and 'tener ganas de' naturally"
      },
      stories: {
        topic: "idioms in everyday dialogue",
        prompt: "Read a casual conversation and explain each idiom's meaning"
      }
    }
  }, {
    id: "lesson-c1-4-3",
    title: {
      en: "Cultural Fluency",
      es: "Fluidez Cultural"
    },
    description: {
      en: "Apply idiomatic expressions skills",
      es: "Aplica habilidades de expresiones idiomáticas"
    },
    xpRequired: 7420,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "inferring idiom meaning from context",
        prompt: "Read texts and work out unfamiliar idioms from the surrounding context"
      },
      realtime: {
        scenario: "telling a short story peppered with idioms",
        prompt: "Demonstrate natural use of common idioms in a short narrative"
      }
    }
  }, {
    id: "lesson-c1-4-quiz",
    title: {
      en: "Idiomatic Expressions Quiz",
      es: "Prueba de Expresiones Idiomáticas"
    },
    description: {
      en: "Test your knowledge of idiomatic expressions",
      es: "Prueba tus conocimientos de expresiones idiomáticas"
    },
    xpRequired: 7455,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "common idioms",
        focusPoints: ["echar de menos, darse cuenta, valer la pena", "tener ganas de"]
      },
      grammar: {
        topics: ["verbal idiom structures"],
        focusPoints: ["reflexive and dar idioms"]
      }
    }
  }]
}, {
  id: "unit-c1-5",
  title: {
    en: "Academic Writing",
    es: "Escritura Académica"
  },
  description: {
    en: "Formal writing",
    es: "Escritura formal"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-c1-5-1",
    title: {
      en: "Scholarly Language",
      es: "Lenguaje Académico"
    },
    description: {
      en: "Learn key vocabulary for academic writing",
      es: "Aprende vocabulario clave para escritura académica"
    },
    xpRequired: 7525,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "academic vocabulary and essay structure",
        focusPoints: ["la tesis, el argumento, la conclusión", "la hipótesis, la metodología", "plantear, argumentar, sostener"]
      },
      grammar: {
        topic: "formal academic structures",
        focusPoints: ["impersonal se and the passive voice", "nominalization: analizar → el análisis", "connectors: por consiguiente, en cuanto a, cabe señalar"]
      }
    }
  }, {
    id: "lesson-c1-5-2",
    title: {
      en: "Research Papers",
      es: "Trabajos de Investigación"
    },
    description: {
      en: "Practice academic writing in conversation",
      es: "Practica escritura académica en conversación"
    },
    xpRequired: 7560,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "defending a thesis to a professor",
        prompt: "Practice presenting and supporting an argument in formal register"
      },
      stories: {
        topic: "the structure of an academic essay",
        prompt: "Read an essay excerpt and identify the thesis, evidence, and conclusion"
      }
    }
  }, {
    id: "lesson-c1-5-3",
    title: {
      en: "Critical Analysis",
      es: "Análisis Crítico"
    },
    description: {
      en: "Apply academic writing skills",
      es: "Aplica habilidades de escritura académica"
    },
    xpRequired: 7595,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "comprehending dense academic prose",
        prompt: "Read an abstract and paraphrase its argument in plain Spanish"
      },
      realtime: {
        scenario: "summarizing research objectively",
        prompt: "Demonstrate a formal, objective academic register"
      }
    }
  }, {
    id: "lesson-c1-5-quiz",
    title: {
      en: "Academic Writing Quiz",
      es: "Prueba de Escritura Académica"
    },
    description: {
      en: "Test your knowledge of academic writing",
      es: "Prueba tus conocimientos de escritura académica"
    },
    xpRequired: 7630,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "academic vocabulary and essay structure",
        focusPoints: ["tesis, argumento, conclusión", "hipótesis, metodología"]
      },
      grammar: {
        topics: ["formal academic structures"],
        focusPoints: ["impersonal se, passive, nominalization"]
      }
    }
  }]
}, {
  id: "unit-c1-6",
  title: {
    en: "Professional Communication",
    es: "Comunicación Profesional"
  },
  description: {
    en: "Workplace language",
    es: "Lenguaje laboral"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-c1-6-1",
    title: {
      en: "Business Etiquette",
      es: "Etiqueta Empresarial"
    },
    description: {
      en: "Learn key vocabulary for professional communication",
      es: "Aprende vocabulario clave para comunicación profesional"
    },
    xpRequired: 7700,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "workplace and business vocabulary",
        focusPoints: ["la reunión, el plazo, el informe", "el cliente, el proveedor, la propuesta", "agendar, gestionar, coordinar"]
      },
      grammar: {
        topic: "formal email and request formulas",
        focusPoints: ["le agradecería que + subjunctive", "quedo a la espera de su respuesta", "atentamente / un cordial saludo"]
      }
    }
  }, {
    id: "lesson-c1-6-2",
    title: {
      en: "Executive Presence",
      es: "Presencia Ejecutiva"
    },
    description: {
      en: "Practice professional communication in conversation",
      es: "Practica comunicación profesional en conversación"
    },
    xpRequired: 7735,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a phone call to reschedule a meeting",
        prompt: "Practice polite, formal workplace requests and confirmations"
      },
      stories: {
        topic: "reading professional emails and memos",
        prompt: "Read a business email and discuss its tone and structure"
      }
    }
  }, {
    id: "lesson-c1-6-3",
    title: {
      en: "Leadership Language",
      es: "Lenguaje de Liderazgo"
    },
    description: {
      en: "Apply professional communication skills",
      es: "Aplica habilidades de comunicación profesional"
    },
    xpRequired: 7770,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["lead", "leadership"], ["team", "meeting"]],
    content: {
      reading: {
        topic: "priorities and responsibilities in a team proposal",
        prompt: "Read a team proposal and identify its priorities, risks, and responsibilities"
      },
      realtime: {
        scenario: "leading a short planning meeting",
        prompt: "Lead a short meeting by framing the goal, inviting input, and assigning next steps"
      }
    }
  }, {
    id: "lesson-c1-6-quiz",
    title: {
      en: "Professional Communication Quiz",
      es: "Prueba de Comunicación Profesional"
    },
    description: {
      en: "Test your knowledge of professional communication",
      es: "Prueba tus conocimientos de comunicación profesional"
    },
    xpRequired: 7805,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "workplace and business vocabulary",
        focusPoints: ["reunión, plazo, informe", "cliente, proveedor, propuesta"]
      },
      grammar: {
        topics: ["formal request and email formulas"],
        focusPoints: ["le agradecería que + subjunctive", "professional closings"]
      }
    }
  }]
}, {
  id: "unit-c1-7",
  title: {
    en: "Debate & Argumentation",
    es: "Debate y Argumentación"
  },
  description: {
    en: "Persuasive skills",
    es: "Habilidades persuasivas"
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-c1-7-1",
    title: {
      en: "Persuasive Language",
      es: "Lenguaje Persuasivo"
    },
    description: {
      en: "Learn key vocabulary for debate & argumentation",
      es: "Aprende vocabulario clave para debate y argumentación"
    },
    xpRequired: 7875,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "language for stating and defending opinions",
        focusPoints: ["en mi opinión, sostengo que, considero que", "estoy a favor de / en contra de", "argumentar, refutar, conceder"]
      },
      grammar: {
        topic: "structures for argument and concession",
        focusPoints: ["no creo que + subjunctive", "si bien / aunque for concession", "por un lado... por otro lado"]
      }
    }
  }, {
    id: "lesson-c1-7-2",
    title: {
      en: "Building Arguments",
      es: "Construyendo Argumentos"
    },
    description: {
      en: "Practice debate & argumentation in conversation",
      es: "Practica debate y argumentación en conversación"
    },
    xpRequired: 7910,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "debating a controversial topic respectfully",
        prompt: "Practice stating, supporting, and conceding points in a debate"
      },
      stories: {
        topic: "analyzing arguments in an opinion piece",
        prompt: "Read a persuasive text and identify claims, evidence, and counterarguments"
      }
    }
  }, {
    id: "lesson-c1-7-3",
    title: {
      en: "Winning Debates",
      es: "Ganando Debates"
    },
    description: {
      en: "Apply debate & argumentation skills",
      es: "Aplica habilidades de debate y argumentación"
    },
    xpRequired: 7945,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "evaluating the strength of an argument",
        prompt: "Read two opposing views and weigh their reasoning"
      },
      realtime: {
        scenario: "rebutting an opposing view politely",
        prompt: "Demonstrate concession and rebuttal: 'si bien..., sin embargo...'"
      }
    }
  }, {
    id: "lesson-c1-7-quiz",
    title: {
      en: "Debate & Argumentation Quiz",
      es: "Prueba de Debate y Argumentación"
    },
    description: {
      en: "Test your knowledge of debate & argumentation",
      es: "Prueba tus conocimientos de debate y argumentación"
    },
    xpRequired: 7980,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "opinion and argumentation language",
        focusPoints: ["sostengo que, considero que", "a favor de / en contra de"]
      },
      grammar: {
        topics: ["argument and concession structures"],
        focusPoints: ["no creo que + subjunctive", "concession: si bien, aunque"]
      }
    }
  }]
}, {
  id: "unit-c1-8",
  title: {
    en: "Cultural Analysis",
    es: "Análisis Cultural"
  },
  description: {
    en: "Deep culture",
    es: "Cultura profunda"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-c1-8-1",
    title: {
      en: "Cultural Studies",
      es: "Estudios Culturales"
    },
    description: {
      en: "Learn key vocabulary for cultural analysis",
      es: "Aprende vocabulario clave para análisis cultural"
    },
    xpRequired: 8050,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "vocabulary for discussing culture and society",
        focusPoints: ["los valores, las costumbres, la identidad", "la sociedad, la tradición, la modernidad", "el estereotipo, la diversidad"]
      },
      grammar: {
        topic: "comparing and generalizing",
        focusPoints: ["comparatives: más/menos... que, tan... como", "generalizations: suele(n), tiende(n) a", "lo + adjective (lo importante es que)"]
      }
    }
  }, {
    id: "lesson-c1-8-2",
    title: {
      en: "Interpreting Culture",
      es: "Interpretando Cultura"
    },
    description: {
      en: "Practice cultural analysis in conversation",
      es: "Practica análisis cultural en conversación"
    },
    xpRequired: 8085,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "comparing traditions in two countries",
        prompt: "Practice comparing cultural practices and values respectfully"
      },
      stories: {
        topic: "cultural themes in a short text",
        prompt: "Read about a social custom and analyze what it reveals about values"
      }
    }
  }, {
    id: "lesson-c1-8-3",
    title: {
      en: "Cross-Cultural Understanding",
      es: "Comprensión Intercultural"
    },
    description: {
      en: "Apply cultural analysis skills",
      es: "Aplica habilidades de análisis cultural"
    },
    xpRequired: 8120,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "analyzing cultural perspectives in a text",
        prompt: "Read an article and discuss its cultural assumptions"
      },
      realtime: {
        scenario: "discussing a stereotype vs the reality",
        prompt: "Demonstrate nuanced cultural analysis without overgeneralizing"
      }
    }
  }, {
    id: "lesson-c1-8-quiz",
    title: {
      en: "Cultural Analysis Quiz",
      es: "Prueba de Análisis Cultural"
    },
    description: {
      en: "Test your knowledge of cultural analysis",
      es: "Prueba tus conocimientos de análisis cultural"
    },
    xpRequired: 8155,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "culture and society vocabulary",
        focusPoints: ["valores, costumbres, identidad", "estereotipo, diversidad"]
      },
      grammar: {
        topics: ["comparison and generalization structures"],
        focusPoints: ["comparatives", "suele/tiende a, lo + adjetivo"]
      }
    }
  }]
}, {
  id: "unit-c1-9",
  title: {
    en: "Literary Techniques",
    es: "Técnicas Literarias"
  },
  description: {
    en: "Literary analysis",
    es: "Análisis literario"
  },
  color: "#F97316",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-c1-9-1",
    title: {
      en: "Literary Devices",
      es: "Dispositivos Literarios"
    },
    description: {
      en: "Learn key vocabulary for literary techniques",
      es: "Aprende vocabulario clave para técnicas literarias"
    },
    xpRequired: 8225,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "vocabulary for analyzing literature",
        focusPoints: ["el narrador, el personaje, la trama", "la metáfora, el símbolo, el tono", "el verso, la estrofa, la rima"]
      },
      grammar: {
        topic: "narrative tenses and literary style",
        focusPoints: ["preterite vs imperfect in narration", "literary past forms (hubo, pretérito anterior)", "stylistic word order and adjective placement"]
      }
    }
  }, {
    id: "lesson-c1-9-2",
    title: {
      en: "Analyzing Texts",
      es: "Analizando Textos"
    },
    description: {
      en: "Practice literary techniques in conversation",
      es: "Practica técnicas literarias en conversación"
    },
    xpRequired: 8260,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "discussing a poem's imagery and tone",
        prompt: "Practice describing metaphor, symbol, and tone in a text"
      },
      stories: {
        topic: "reading and interpreting a short literary passage",
        prompt: "Read a passage and discuss its narrator and imagery"
      }
    }
  }, {
    id: "lesson-c1-9-3",
    title: {
      en: "Literary Criticism",
      es: "Crítica Literaria"
    },
    description: {
      en: "Apply literary techniques skills",
      es: "Aplica habilidades de técnicas literarias"
    },
    xpRequired: 8295,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "analyzing theme and style in literature",
        prompt: "Read a short-story excerpt and identify its theme and techniques"
      },
      realtime: {
        scenario: "comparing two authors' styles",
        prompt: "Demonstrate literary analysis using precise terminology"
      }
    }
  }, {
    id: "lesson-c1-9-quiz",
    title: {
      en: "Literary Techniques Quiz",
      es: "Prueba de Técnicas Literarias"
    },
    description: {
      en: "Test your knowledge of literary techniques",
      es: "Prueba tus conocimientos de técnicas literarias"
    },
    xpRequired: 8330,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "literary analysis vocabulary",
        focusPoints: ["narrador, personaje, trama", "metáfora, símbolo, tono"]
      },
      grammar: {
        topics: ["narrative tenses and literary style"],
        focusPoints: ["preterite vs imperfect in narration"]
      }
    }
  }]
}, {
  id: "unit-c1-10",
  title: {
    en: "Advanced Discourse",
    es: "Discurso Avanzado"
  },
  description: {
    en: "Complex communication",
    es: "Comunicación compleja"
  },
  color: "#84CC16",
  position: {
    row: 4,
    offset: 1
  },
  lessons: [{
    id: "lesson-c1-10-1",
    title: {
      en: "Discourse Markers",
      es: "Marcadores del Discurso"
    },
    description: {
      en: "Learn key vocabulary for advanced discourse",
      es: "Aprende vocabulario clave para discurso avanzado"
    },
    xpRequired: 8400,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "discourse markers for organizing extended speech",
        focusPoints: ["en primer lugar, a continuación, por último", "por lo tanto, en consecuencia", "en definitiva, en resumen"]
      },
      grammar: {
        topic: "cohesion and coherence devices",
        focusPoints: ["reference and pronouns to avoid repetition", "connectors of contrast, cause, and result", "topic shifts: en cuanto a, respecto a"]
      }
    }
  }, {
    id: "lesson-c1-10-2",
    title: {
      en: "Coherent Arguments",
      es: "Argumentos Coherentes"
    },
    description: {
      en: "Practice advanced discourse in conversation",
      es: "Practica discurso avanzado en conversación"
    },
    xpRequired: 8435,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "giving a structured two-minute opinion",
        prompt: "Practice organizing extended speech with clear discourse markers"
      },
      stories: {
        topic: "tracing the thread of a long argument",
        prompt: "Read an extended text and map how its ideas connect"
      }
    }
  }, {
    id: "lesson-c1-10-3",
    title: {
      en: "Fluent Expression",
      es: "Expresión Fluida"
    },
    description: {
      en: "Apply advanced discourse skills",
      es: "Aplica habilidades de discurso avanzado"
    },
    xpRequired: 8470,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "analyzing cohesion in extended writing",
        prompt: "Read a long passage and identify its connectors and references"
      },
      realtime: {
        scenario: "summarizing a complex topic coherently",
        prompt: "Demonstrate coherent, well-structured discourse with smooth transitions"
      }
    }
  }, {
    id: "lesson-c1-10-quiz",
    title: {
      en: "Advanced Discourse Quiz",
      es: "Prueba de Discurso Avanzado"
    },
    description: {
      en: "Test your knowledge of advanced discourse",
      es: "Prueba tus conocimientos de discurso avanzado"
    },
    xpRequired: 8505,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "discourse markers and connectors",
        focusPoints: ["sequencing: en primer lugar, por último", "result: por lo tanto, en consecuencia"]
      },
      grammar: {
        topics: ["cohesion and coherence devices"],
        focusPoints: ["reference and topic-shift devices"]
      }
    }
  }]
}];
