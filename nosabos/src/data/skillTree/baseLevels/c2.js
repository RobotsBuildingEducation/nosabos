// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-c2-1",
  title: {
    en: "Idiomatic Range",
    es: "Dominio Idiomático"
  },
  description: {
    en: "Advanced idioms",
    es: "Modismos avanzados"
  },
  color: "#22C55E",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-c2-1-1",
    title: {
      en: "Advanced Expressions",
      es: "Expresiones Avanzadas"
    },
    description: {
      en: "Learn key vocabulary for native idioms",
      es: "Aprende vocabulario clave para modismos nativos"
    },
    xpRequired: 8575,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "everyday Spanish idioms",
        focusPoints: ["meter la pata (to mess up)", "costar un ojo de la cara (to cost a fortune)", "estar en las nubes (to daydream)", "echar una mano (to lend a hand)"]
      },
      grammar: {
        topic: "fixed idiomatic structures and verb collocations",
        focusPoints: ["dar/tener/hacer idioms: dar igual, tener ganas, hacer caso", "ser pan comido (to be easy) vs estar pez (to be clueless)", "idioms that don't translate word for word"]
      }
    }
  }, {
    id: "lesson-c2-1-2",
    title: {
      en: "Idiomatic Conversation",
      es: "Conversación Idiomática"
    },
    description: {
      en: "Practice native idioms in conversation",
      es: "Practica modismos nativos en conversación"
    },
    xpRequired: 8615,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a casual chat where friends drop idioms like 'no tener pelos en la lengua' and 'tomar el pelo'",
        prompt: "Practice using idioms naturally and noticing when someone is speaking figuratively"
      },
      stories: {
        topic: "regional slang: vale (España), órale (México), che (Argentina)",
        prompt: "Read a dialogue full of colloquialisms and explain what each one really means"
      }
    }
  }, {
    id: "lesson-c2-1-3",
    title: {
      en: "Idiomatic Interpretation",
      es: "Interpretación Idiomática"
    },
    description: {
      en: "Apply native idioms skills",
      es: "Aplica habilidades de modismos nativos"
    },
    xpRequired: 8655,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "figurative vs literal meaning in idioms",
        prompt: "Read texts with idioms and infer their meaning from context"
      },
      realtime: {
        scenario: "explaining a Spanish idiom to someone who took it literally",
        prompt: "Demonstrate mastery by using idioms correctly and paraphrasing what they mean"
      }
    }
  }, {
    id: "lesson-c2-1-quiz",
    title: {
      en: "Native Idioms Quiz",
      es: "Prueba de Modismos Nativos"
    },
    description: {
      en: "Test your knowledge of native idioms",
      es: "Prueba tus conocimientos de modismos nativos"
    },
    xpRequired: 8695,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "common idioms and colloquial expressions",
        focusPoints: ["meter la pata, tomar el pelo, echar una mano", "regional slang: vale, órale, che"]
      },
      grammar: {
        topics: ["idiomatic verb collocations"],
        focusPoints: ["literal vs figurative meaning"]
      }
    }
  }]
}, {
  id: "unit-c2-2",
  title: {
    en: "Regional Variations",
    es: "Variaciones Regionales"
  },
  description: {
    en: "Dialects",
    es: "Dialectos"
  },
  color: "#3B82F6",
  position: {
    row: 0,
    offset: 1
  },
  lessons: [{
    id: "lesson-c2-2-1",
    title: {
      en: "Dialects",
      es: "Dialectos"
    },
    description: {
      en: "Learn key vocabulary for regional variations",
      es: "Aprende vocabulario clave para variaciones regionales"
    },
    xpRequired: 8775,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "regional vocabulary that changes by country",
        focusPoints: ["el carro / el coche / el auto", "la computadora / el ordenador", "el celular / el móvil", "el jugo / el zumo", "la papa / la patata"]
      },
      grammar: {
        topic: "regional second-person pronouns: tú, vos, usted, vosotros, ustedes",
        focusPoints: ["tú tienes vs vos tenés vs usted tiene", "vosotros habláis (España) vs ustedes hablan (Latinoamérica)", "voseo endings -ás/-és/-ís: vos hablás, comés, vivís"]
      }
    }
  }, {
    id: "lesson-c2-2-2",
    title: {
      en: "Accent and Usage",
      es: "Acento y Uso"
    },
    description: {
      en: "Practice regional variations in conversation",
      es: "Practica variaciones regionales en conversación"
    },
    xpRequired: 8815,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "chatting with friends from Argentina, Mexico, and Spain at the same table",
        prompt: "Practice switching between voseo (vos tenés, vení, decime) and tuteo (tú tienes, ven, dime) depending on who you are talking to"
      },
      stories: {
        topic: "regional accents: seseo, yeísmo rioplatense, and Caribbean /s/ aspiration",
        prompt: "Read and discuss how the same words sound across regions, like 'calle' as /kaʝe/ vs /kaʃe/ and 'está' vs 'ehtá'"
      }
    }
  }, {
    id: "lesson-c2-2-3",
    title: {
      en: "Linguistic Diversity",
      es: "Diversidad Lingüística"
    },
    description: {
      en: "Apply regional variations skills",
      es: "Aplica habilidades de variaciones regionales"
    },
    xpRequired: 8855,
    xpReward: 55,
    modes: ["reading", "realtime"],
    agenda: {
      version: 1,
      items: [{
        id: "recognize-regional-forms-in-texts",
        kind: "comprehension",
        modes: ["reading"],
        label: {
          en: "Recognize regional pronouns and vocabulary in texts from Spain, the River Plate, and Central America",
          es: "Reconoce pronombres y vocabulario regionales en textos de España, el Río de la Plata y Centroamérica",
          pt: "Reconheça pronomes e vocabulário regionais em textos da Espanha, do Rio da Prata e da América Central",
          it: "Riconosci pronomi e lessico regionali in testi provenienti dalla Spagna, dal Río de la Plata e dall'America Centrale",
          fr: "Repère les pronoms et le vocabulaire régionaux dans des textes d'Espagne, du Río de la Plata et d'Amérique centrale",
          de: "Erkenne regionale Pronomen und regionalen Wortschatz in Texten aus Spanien, dem Río de la Plata und Mittelamerika",
          ja: "スペイン、ラプラタ川流域、中米の文章で地域特有の代名詞と語彙を見分ける",
          hi: "स्पेन, रियो दे ला प्लाता और मध्य अमेरिका के पाठों में क्षेत्रीय सर्वनाम और शब्दावली पहचानें",
          ar: "تعرّف على الضمائر والمفردات الإقليمية في نصوص من إسبانيا ومنطقة ريو دي لا بلاتا وأمريكا الوسطى",
          zh: "识别西班牙、拉普拉塔河地区和中美洲文本中的地区性代词与词汇"
        },
        targetConcept: "Read short texts from Spain, the River Plate, and Central America and identify the regional pronouns and vocabulary",
        evidence: {
          type: "identify",
          criteria: "Correctly identifies regional pronouns and vocabulary and associates them with the relevant region"
        }
      }, {
        id: "adapt-pronouns-by-region-and-register",
        kind: "communication",
        modes: ["realtime"],
        label: {
          en: "Choose the appropriate second-person form for the region and level of formality",
          es: "Elige la forma de segunda persona adecuada según la región y el nivel de formalidad",
          pt: "Escolha a forma de segunda pessoa adequada conforme a região e o nível de formalidade",
          it: "Scegli la forma di seconda persona adatta alla regione e al livello di formalità",
          fr: "Choisis la forme de deuxième personne adaptée à la région et au niveau de formalité",
          de: "Wähle die zur Region und zum Förmlichkeitsgrad passende Anredeform",
          ja: "地域と丁寧さに合った二人称表現を使い分ける",
          hi: "क्षेत्र और औपचारिकता के स्तर के अनुसार सही द्वितीय-पुरुष रूप चुनें",
          ar: "اختر صيغة المخاطب المناسبة بحسب المنطقة ومستوى الرسمية",
          zh: "根据地区和正式程度选择恰当的第二人称形式"
        },
        targetConcept: "Demonstrate when to use vos, tú, usted, vosotros, and ustedes based on region and formality",
        targetExamples: ["vos", "tú", "usted", "vosotros", "ustedes"],
        evidence: {
          type: "scenario_response",
          criteria: "Selects and uses a region- and register-appropriate second-person form in conversation"
        }
      }]
    },
    content: {
      reading: {
        topic: "spotting voseo, vosotros, and regional words in real texts",
        prompt: "Read short texts from Spain, the River Plate, and Central America and identify the regional pronouns and vocabulary"
      },
      realtime: {
        scenario: "adapting your register for a Rioplatense friend vs a Peninsular colleague",
        prompt: "Demonstrate when to use vos, tú, usted, vosotros, and ustedes based on region and formality"
      }
    }
  }, {
    id: "lesson-c2-2-quiz",
    title: {
      en: "Regional Variations Quiz",
      es: "Prueba de Variaciones Regionales"
    },
    description: {
      en: "Test your knowledge of regional variations",
      es: "Prueba tus conocimientos de variaciones regionales"
    },
    xpRequired: 8895,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "regional vocabulary and pronoun systems",
        focusPoints: ["carro/coche, papa/patata, celular/móvil", "tú / vos / usted / vosotros / ustedes"]
      },
      grammar: {
        topics: ["voseo vs tuteo conjugations", "vosotros vs ustedes"],
        focusPoints: ["vos tenés vs tú tienes", "vosotros habláis vs ustedes hablan"]
      }
    }
  }]
}, {
  id: "unit-c2-3",
  title: {
    en: "Stylistic Mastery",
    es: "Dominio Estilístico"
  },
  description: {
    en: "Style control",
    es: "Control de estilo"
  },
  color: "#F59E0B",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-c2-3-1",
    title: {
      en: "Refined Language",
      es: "Dominio Estilístico - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for stylistic mastery",
      es: "Aprende vocabulario clave para dominio estilístico"
    },
    xpRequired: 8975,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "formal vs colloquial synonyms",
        focusPoints: ["solicitar vs pedir", "adquirir vs conseguir", "comenzar vs empezar", "no obstante vs pero"]
      },
      grammar: {
        topic: "register markers and formal connectors",
        focusPoints: ["sin embargo, no obstante, por ende", "cabe destacar que..., dicho esto...", "impersonal se and passive voice for a formal tone"]
      }
    }
  }, {
    id: "lesson-c2-3-2",
    title: {
      en: "Elegant Expression",
      es: "Dominio Estilístico - Práctica"
    },
    description: {
      en: "Practice stylistic mastery in conversation",
      es: "Practica dominio estilístico en conversación"
    },
    xpRequired: 9015,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "making the same request as a casual text to a friend and a formal email to a boss",
        prompt: "Practice shifting register: '¿me pasás eso?' vs 'le agradecería que me enviara el documento'"
      },
      stories: {
        topic: "tone and rhetorical devices: metaphor, irony, hyperbole",
        prompt: "Read a passage and discuss how its tone (sincere, ironic, exaggerated) changes the meaning"
      }
    }
  }, {
    id: "lesson-c2-3-3",
    title: {
      en: "Artistic Language",
      es: "Lenguaje Artístico"
    },
    description: {
      en: "Apply artistic language skills",
      es: "Aplica recursos de lenguaje artístico"
    },
    xpRequired: 9055,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["artistic", "expressive"], ["imagery"]],
    content: {
      reading: {
        topic: "imagery, rhythm, and stylistic choices in literary language",
        prompt: "Read a literary passage and identify imagery, rhythm, and deliberate stylistic choices"
      },
      realtime: {
        scenario: "turning an ordinary description into expressive language",
        prompt: "Create a short expressive description using imagery and figurative language"
      }
    }
  }, {
    id: "lesson-c2-3-quiz",
    title: {
      en: "Stylistic Mastery Quiz",
      es: "Prueba de Dominio Estilístico"
    },
    description: {
      en: "Test your knowledge of stylistic mastery",
      es: "Prueba tus conocimientos de dominio estilístico"
    },
    xpRequired: 9095,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "formal vs colloquial register",
        focusPoints: ["solicitar/pedir, adquirir/conseguir", "formal email vs casual text wording"]
      },
      grammar: {
        topics: ["formal connectors and discourse markers", "register shifting"],
        focusPoints: ["no obstante, por ende, cabe destacar", "softening and hedging for politeness"]
      }
    }
  }]
}, {
  id: "unit-c2-4",
  title: {
    en: "Rhetorical Devices",
    es: "Dispositivos Retóricos"
  },
  description: {
    en: "Persuasive techniques",
    es: "Técnicas persuasivas"
  },
  color: "#8B5CF6",
  position: {
    row: 1,
    offset: 1
  },
  lessons: [{
    id: "lesson-c2-4-1",
    title: {
      en: "Persuasive Techniques",
      es: "Técnicas Persuasivas"
    },
    description: {
      en: "Learn key vocabulary for rhetorical devices",
      es: "Aprende vocabulario clave para dispositivos retóricos"
    },
    xpRequired: 9175,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "rhetorical and literary devices",
        focusPoints: ["metáfora vs símil (comparison with 'como')", "hipérbole (exaggeration)", "ironía", "personificación"]
      },
      grammar: {
        topic: "structures that create rhetorical effect",
        focusPoints: ["anáfora (repetition at the start of phrases)", "preguntas retóricas", "antítesis (contrasting ideas)"]
      }
    }
  }, {
    id: "lesson-c2-4-2",
    title: {
      en: "Powerful Speech",
      es: "Discurso Poderoso"
    },
    description: {
      en: "Practice rhetorical devices in conversation",
      es: "Practica dispositivos retóricos en conversación"
    },
    xpRequired: 9215,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "giving a persuasive toast or short speech",
        prompt: "Practice weaving in metáfora, ironía, and hipérbole to make your point vivid"
      },
      stories: {
        topic: "spotting irony and metaphor in literature",
        prompt: "Read a literary passage and discuss the devices the author uses"
      }
    }
  }, {
    id: "lesson-c2-4-3",
    title: {
      en: "Master Rhetoric",
      es: "Maestría Retórica"
    },
    description: {
      en: "Apply rhetorical devices skills",
      es: "Aplica habilidades de dispositivos retóricos"
    },
    xpRequired: 9255,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "analyzing persuasive and figurative language",
        prompt: "Read an opinion column and identify its rhetorical devices and intended effect"
      },
      realtime: {
        scenario: "debating a topic with rhetorical flourish",
        prompt: "Demonstrate mastery by using rhetorical devices to persuade"
      }
    }
  }, {
    id: "lesson-c2-4-quiz",
    title: {
      en: "Rhetorical Devices Quiz",
      es: "Prueba de Dispositivos Retóricos"
    },
    description: {
      en: "Test your knowledge of rhetorical devices",
      es: "Prueba tus conocimientos de dispositivos retóricos"
    },
    xpRequired: 9295,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "rhetorical devices",
        focusPoints: ["metáfora, símil, hipérbole, ironía", "personificación"]
      },
      grammar: {
        topics: ["devices that create rhetorical effect"],
        focusPoints: ["anáfora and preguntas retóricas"]
      }
    }
  }]
}, {
  id: "unit-c2-5",
  title: {
    en: "Specialized Vocabulary",
    es: "Vocabulario Especializado"
  },
  description: {
    en: "Technical terms",
    es: "Términos técnicos"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-c2-5-1",
    title: {
      en: "Expert Terminology",
      es: "Terminología Experta"
    },
    description: {
      en: "Learn key vocabulary for specialized vocabulary",
      es: "Aprende vocabulario clave para vocabulario especializado"
    },
    xpRequired: 9375,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "professional and technical vocabulary by field",
        focusPoints: ["legal: el contrato, la cláusula, el demandante", "medical: el diagnóstico, los síntomas, el tratamiento", "business: la inversión, el presupuesto, las acciones"]
      },
      grammar: {
        topic: "nominalization and formal terminology",
        focusPoints: ["turning verbs into nouns: implementar → la implementación", "technical compounds and Latinisms", "precise field-specific collocations"]
      }
    }
  }, {
    id: "lesson-c2-5-2",
    title: {
      en: "Professional Fields",
      es: "Campos Profesionales"
    },
    description: {
      en: "Practice specialized vocabulary in conversation",
      es: "Practica vocabulario especializado en conversación"
    },
    xpRequired: 9415,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a work meeting covering a budget, a contract, and a medical report",
        prompt: "Practice using precise field vocabulary (presupuesto, cláusula, diagnóstico) accurately"
      },
      stories: {
        topic: "academic and scientific register",
        prompt: "Read a technical text and discuss its specialized terms"
      }
    }
  }, {
    id: "lesson-c2-5-3",
    title: {
      en: "Domain Expertise",
      es: "Experiencia en el Dominio"
    },
    description: {
      en: "Apply specialized vocabulary skills",
      es: "Aplica habilidades de vocabulario especializado"
    },
    xpRequired: 9455,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "comprehending dense specialized texts",
        prompt: "Read a legal or scientific excerpt and paraphrase it in plain Spanish"
      },
      realtime: {
        scenario: "explaining a technical topic to an expert vs a layperson",
        prompt: "Demonstrate mastery by switching between jargon and plain language"
      }
    }
  }, {
    id: "lesson-c2-5-quiz",
    title: {
      en: "Specialized Vocabulary Quiz",
      es: "Prueba de Vocabulario Especializado"
    },
    description: {
      en: "Test your knowledge of specialized vocabulary",
      es: "Prueba tus conocimientos de vocabulario especializado"
    },
    xpRequired: 9495,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "specialized vocabulary across fields",
        focusPoints: ["legal, medical, and business terms", "jargon vs plain language"]
      },
      grammar: {
        topics: ["formal terminology and nominalization"],
        focusPoints: ["field-specific collocations"]
      }
    }
  }]
}, {
  id: "unit-c2-6",
  title: {
    en: "Subtle Nuances",
    es: "Matices Sutiles"
  },
  description: {
    en: "Fine distinctions",
    es: "Distinciones finas"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-c2-6-1",
    title: {
      en: "Fine Distinctions",
      es: "Distinciones Finas"
    },
    description: {
      en: "Learn key vocabulary for subtle nuances",
      es: "Aprende vocabulario clave para matices sutiles"
    },
    xpRequired: 9575,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "near-synonyms with different connotations",
        focusPoints: ["delgado / flaco / esquelético", "barato / económico / cutre", "bonito / lindo / hermoso"]
      },
      grammar: {
        topic: "subtle grammatical contrasts",
        focusPoints: ["ser vs estar for permanent vs temporary nuance", "por vs para", "indicative vs subjunctive for certainty vs doubt"]
      }
    }
  }, {
    id: "lesson-c2-6-2",
    title: {
      en: "Precise Meaning",
      es: "Significado Preciso"
    },
    description: {
      en: "Practice subtle nuances in conversation",
      es: "Practica matices sutiles en conversación"
    },
    xpRequired: 9615,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "reading between the lines in a tense but polite conversation",
        prompt: "Practice conveying nuance through word choice and tone (suggesting vs insisting)"
      },
      stories: {
        topic: "connotation and subtext in dialogue",
        prompt: "Read a scene and discuss what the characters imply but don't say"
      }
    }
  }, {
    id: "lesson-c2-6-3",
    title: {
      en: "Mastery of Detail",
      es: "Maestría del Detalle"
    },
    description: {
      en: "Apply subtle nuances skills",
      es: "Aplica habilidades de matices sutiles"
    },
    xpRequired: 9655,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "implicature and tone in writing",
        prompt: "Read a passage and infer the writer's true attitude from subtle cues"
      },
      realtime: {
        scenario: "softening criticism vs being direct, depending on the listener",
        prompt: "Demonstrate mastery of nuance, irony, and politeness in context"
      }
    }
  }, {
    id: "lesson-c2-6-quiz",
    title: {
      en: "Subtle Nuances Quiz",
      es: "Prueba de Matices Sutiles"
    },
    description: {
      en: "Test your knowledge of subtle nuances",
      es: "Prueba tus conocimientos de matices sutiles"
    },
    xpRequired: 9695,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "connotation and near-synonyms",
        focusPoints: ["delgado / flaco / esquelético", "implication and subtext"]
      },
      grammar: {
        topics: ["subtle contrasts: ser/estar, por/para, mood"],
        focusPoints: ["nuance in word and structure choice"]
      }
    }
  }]
}, {
  id: "unit-c2-7",
  title: {
    en: "Cultural Expertise",
    es: "Experiencia Cultural"
  },
  description: {
    en: "Cultural mastery",
    es: "Dominio cultural"
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-c2-7-1",
    title: {
      en: "Cultural Intelligence",
      es: "Inteligencia Cultural"
    },
    description: {
      en: "Learn key vocabulary for cultural expertise",
      es: "Aprende vocabulario clave para experiencia cultural"
    },
    xpRequired: 9775,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "cultural references, festivals, and refranes",
        focusPoints: ["festivals: Día de Muertos, Las Fallas, Carnaval", "refranes: 'A mal tiempo, buena cara'", "sobremesa and tuteo vs usted etiquette"]
      },
      grammar: {
        topic: "language tied to customs and politeness",
        focusPoints: ["formal vs familiar address in social settings", "set phrases for celebrations and condolences"]
      }
    }
  }, {
    id: "lesson-c2-7-2",
    title: {
      en: "Cultural Navigator",
      es: "Navegador Cultural"
    },
    description: {
      en: "Practice cultural expertise in conversation",
      es: "Practica experiencia cultural en conversación"
    },
    xpRequired: 9815,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "navigating a family gathering with greetings, sobremesa, and a toast",
        prompt: "Practice the right cultural register and expressions for a social occasion"
      },
      stories: {
        topic: "the cultural context behind traditions",
        prompt: "Read about a tradition like Día de Muertos and discuss its meaning"
      }
    }
  }, {
    id: "lesson-c2-7-3",
    title: {
      en: "Cultural Ambassador",
      es: "Embajador Cultural"
    },
    description: {
      en: "Apply cultural expertise skills",
      es: "Aplica habilidades de experiencia cultural"
    },
    xpRequired: 9855,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "interpreting cultural references and humor",
        prompt: "Read a text rich in cultural allusions and explain the references"
      },
      realtime: {
        scenario: "explaining a local custom to a foreigner and avoiding a faux pas",
        prompt: "Demonstrate cultural fluency by using refranes and the right etiquette in context"
      }
    }
  }, {
    id: "lesson-c2-7-quiz",
    title: {
      en: "Cultural Expertise Quiz",
      es: "Prueba de Experiencia Cultural"
    },
    description: {
      en: "Test your knowledge of cultural expertise",
      es: "Prueba tus conocimientos de experiencia cultural"
    },
    xpRequired: 9895,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "cultural references and customs",
        focusPoints: ["festivals and refranes", "social etiquette: besos, sobremesa, usted"]
      },
      grammar: {
        topics: ["culturally appropriate register"],
        focusPoints: ["set phrases for social occasions"]
      }
    }
  }]
}, {
  id: "unit-c2-8",
  title: {
    en: "Effortless Discourse",
    es: "Discurso Espontáneo y Preciso"
  },
  description: {
    en: "Native-like skills",
    es: "Habilidades casi nativas"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-c2-8-1",
    title: {
      en: "Fluency Strategies",
      es: "Estrategias de Fluidez"
    },
    description: {
      en: "Learn key vocabulary for near-native fluency",
      es: "Aprende vocabulario clave para fluidez casi nativa"
    },
    xpRequired: 9975,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "fillers and discourse markers for fluent speech",
        focusPoints: ["muletillas: o sea, pues, es que, en plan", "backchanneling: claro, ya, ajá", "a ver, total, resulta que"]
      },
      grammar: {
        topic: "managing spontaneous discourse",
        focusPoints: ["self-correction: digo, quiero decir, mejor dicho", "circumlocution to talk around unknown words", "smooth turn-taking and connectors"]
      }
    }
  }, {
    id: "lesson-c2-8-2",
    title: {
      en: "Interactive Fluency",
      es: "Fluidez Interactiva"
    },
    description: {
      en: "Practice near-native fluency in conversation",
      es: "Practica fluidez casi nativa en conversación"
    },
    xpRequired: 10015,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a fast, overlapping group conversation at a café",
        prompt: "Practice keeping up: react with backchannels, interrupt politely, and self-correct on the fly"
      },
      stories: {
        topic: "natural spoken rhythm and connected speech",
        prompt: "Read a transcript of casual speech and discuss the fillers and reductions"
      }
    }
  }, {
    id: "lesson-c2-8-3",
    title: {
      en: "Sustained Fluency",
      es: "Fluidez Sostenida"
    },
    description: {
      en: "Apply near-native fluency skills",
      es: "Aplica habilidades de fluidez casi nativa"
    },
    xpRequired: 10055,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "understanding rapid, idiomatic speech in writing",
        prompt: "Read informal dialogue and follow the meaning despite slang and ellipsis"
      },
      realtime: {
        scenario: "telling a story spontaneously without pausing",
        prompt: "Demonstrate near-native fluency: speak at length, paraphrase, and keep the conversation flowing"
      }
    }
  }, {
    id: "lesson-c2-8-quiz",
    title: {
      en: "Effortless Discourse Quiz",
      es: "Prueba de Discurso Espontáneo y Preciso"
    },
    description: {
      en: "Test your knowledge of near-native fluency",
      es: "Prueba tus conocimientos de fluidez casi nativa"
    },
    xpRequired: 10095,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 12,
      passingScore: 10
    },
    content: {
      vocabulary: {
        topic: "fluency markers and discourse management",
        focusPoints: ["muletillas and backchanneling", "self-correction and circumlocution"]
      },
      grammar: {
        topics: ["strategies for spontaneous discourse"],
        focusPoints: ["keeping speech flowing naturally"]
      }
    }
  }]
}];
