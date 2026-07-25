// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [
// Tutorial Unit - always at the very beginning
{
  id: "unit-tutorial-pre-a1",
  title: {
    en: "Getting Started",
    es: "Primeros Pasos"
  },
  description: {
    en: "Learn how to use the app and explore all features",
    es: "Aprende a usar la app y explora todas las funciones"
  },
  color: "#6366F1",
  position: {
    row: -1,
    offset: 0
  },
  isTutorial: true,
  lessons: [{
    id: "lesson-tutorial-1",
    title: {
      en: "Getting Started",
      es: "Primeros Pasos"
    },
    description: {
      en: "Learn basic introductions and goodbyes",
      es: "Aprende introducciones y despedidas básicas"
    },
    xpRequired: 0,
    xpReward: 1,
    isTutorial: true,
    modes: ["vocabulary", "grammar", "reading", "stories", "realtime", "game"],
    content: {
      vocabulary: {
        topic: "tutorial",
        focusPoints: ["hola", "me llamo", "buenos días", "buenas tardes", "buenas noches", "¿cómo estás?", "adiós"],
        tutorialDescription: {
          en: "Learn first introduction and goodbye phrases with interactive questions.",
          es: "Aprende tus primeras frases de introducción y despedida con preguntas interactivas."
        }
      },
      grammar: {
        topic: "tutorial",
        focusPoints: ["hola + me llamo", "buenos días / buenas tardes / buenas noches", "¿cómo estás? + bien, gracias", "adiós / hasta luego"],
        tutorialDescription: {
          en: "Practice simple patterns for introductions, greetings, and goodbyes.",
          es: "Practica patrones simples para introducciones, saludos y despedidas."
        }
      },
      reading: {
        topic: "tutorial",
        prompt: 'Use only this short welcome: "Hello, good morning. My name is Piyali. How are you? Excited to learn how to speak <target language>?"'
      },
      stories: {
        topic: "tutorial",
        prompt: "Practice basic introductions and goodbyes in a story",
        tutorialDescription: {
          en: "Practice basic introductions and goodbyes in a short interactive story.",
          es: "Practica introducciones y despedidas básicas en una historia interactiva corta."
        }
      },
      realtime: {
        topic: "tutorial",
        scenario: "Learn basic introductions and goodbyes",
        prompt: "Practice hello, my name is, good morning, good afternoon, good night, how are you, and goodbye",
        successCriteria: "The learner makes understandable attempts at hello, my name is, good morning, good afternoon, good night, how are you, and goodbye.",
        successCriteria_es: 'El estudiante intenta de forma comprensible decir "hola", "me llamo", "buenos días", "buenas tardes", "buenas noches", "¿cómo estás?" y "adiós".',
        successCriteria_pt: 'O aluno tenta de forma compreensível dizer "olá", "meu nome é", "bom dia", "boa tarde", "boa noite", "como você está?" e "adeus".',
        successCriteria_fr: 'L\'apprenant essaie de dire de façon compréhensible "bonjour", "je m\'appelle", "bonjour", "bon après-midi", "bonne nuit", "comment ça va ?" et "au revoir".',
        successCriteria_it: 'L\'apprendente prova in modo comprensibile a dire "ciao", "mi chiamo", "buongiorno", "buon pomeriggio", "buonanotte", "come stai?" e "arrivederci".',
        successCriteria_nl: 'De leerling probeert begrijpelijk "hallo", "mijn naam is", "goedemorgen", "goedemiddag", "goedenacht", "hoe gaat het?" en "tot ziens" te zeggen.',
        successCriteria_nah: "The learner makes understandable attempts at the basic introduction agenda.",
        successCriteria_ja: "The learner makes understandable attempts at the basic introduction agenda.",
        tutorialDescription: {
          en: "Practice basic introductions and goodbyes in a realtime tutoring session.",
          es: "Practica introducciones y despedidas básicas en una sesión de tutoría en tiempo real."
        }
      },
      game: {
        topic: "tutorial",
        unitTitle: "Getting Started",
        sceneId: "tutorialPlaza",
        xpReward: 30,
        focusPoints: ["hola", "me llamo", "buenos días", "buenas tardes", "buenas noches", "¿cómo estás?", "adiós"],
        tutorialDescription: {
          en: "Finish the tutorial by playing a short game review.",
          es: "Termina el tutorial jugando un breve repaso en modo juego."
        }
      }
    }
  }]
},
// Unit 1: People & Family
{
  id: "unit-pre-a1-people",
  title: {
    en: "People & Family",
    es: "Personas y Familia"
  },
  description: {
    en: "Learn words for the people in your life",
    es: "Aprende palabras para las personas en tu vida"
  },
  color: "#8B5CF6",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-1-1",
    title: {
      en: "My Family",
      es: "Mi Familia"
    },
    description: {
      en: "Learn the words for close family members",
      es: "Aprende las palabras para familiares cercanos"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "close family members",
        focusPoints: ["mamá", "papá", "hermano", "hermana", "familia"]
      },
      grammar: {
        topic: "family with articles",
        focusPoints: ["el/la with family nouns", "mi mamá, mi papá"]
      }
    }
  }, {
    id: "lesson-pre-a1-1-2",
    title: {
      en: "More Family",
      es: "Más Familia"
    },
    description: {
      en: "Grandparents, babies, and extended family",
      es: "Abuelos, bebés y familia extendida"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "Talking about family",
        prompt: "Tell someone about your grandparents and extended family",
        successCriteria: "The learner names at least two extended family members."
      },
      stories: {
        topic: "extended family",
        prompt: "Identify grandparents and extended family members during a short family visit",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-visiting-grandparents-and-meeting-exte-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-1-3",
    title: {
      en: "People Around Me",
      es: "Personas a Mi Alrededor"
    },
    description: {
      en: "Words for friends, children, and people you see every day",
      es: "Palabras para amigos, niños y personas que ves todos los días"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["reading", "realtime"],
    agenda: {
      version: 2,
      items: [{
        // Keep the legacy ID during the schema migration so existing
        // in-progress Tutor checkpoints remain valid.
        id: "reading-read-a-short-description-of-people-in-a-neighborhood-1",
        kind: "comprehension",
        modes: ["reading"],
        label: {
          en: "Identify familiar people in a short description",
          es: "Identifica personas conocidas en una descripción breve",
          pt: "Identifique pessoas conhecidas em uma descrição curta",
          it: "Identifica persone conosciute in una breve descrizione",
          fr: "Identifie des personnes connues dans une courte description",
          de: "Erkenne bekannte Personen in einer kurzen Beschreibung",
          ja: "短い説明の中で身近な人を見分ける",
          hi: "छोटे वर्णन में परिचित लोगों को पहचानें",
          ar: "تعرّف على الأشخاص المألوفين في وصف قصير",
          zh: "识别简短描述中的熟人"
        },
        goal: "Identify familiar people and their relationships in a short neighborhood description",
        targetConcept: "Identify familiar people and their relationships in a short neighborhood description",
        preserveCanonicalGoal: true,
        targetRole: "goal",
        targetForms: [],
        targetExamples: ["Esta es mi amiga Ana.", "Ella es mi vecina."],
        activityBrief: "Present a two-sentence Pre-A1 description in the target language, then ask one simple meaning question",
        evidence: {
          type: "identify",
          criteria: "The learner correctly identifies at least one person or relationship from the description"
        }
      }, {
        id: "realtime-the-learner-uses-people-vocabulary-to-describe-someo-1",
        kind: "communication",
        modes: ["realtime"],
        label: {
          en: "Describe one person you know",
          es: "Describe a una persona que conoces",
          pt: "Descreva uma pessoa que você conhece",
          it: "Descrivi una persona che conosci",
          fr: "Décris une personne que tu connais",
          de: "Beschreibe eine Person, die du kennst",
          ja: "知っている人を一人説明する",
          hi: "अपने परिचित किसी एक व्यक्ति का वर्णन करें",
          ar: "اوصف شخصًا واحدًا تعرفه",
          zh: "描述一个你认识的人"
        },
        goal: "Produce one short, understandable description of a familiar person",
        targetConcept: "Produce one short, understandable description of a familiar person",
        preserveCanonicalGoal: true,
        targetRole: "goal",
        targetForms: [],
        targetExamples: ["Esta es mi amiga.", "Mi vecino es amable."],
        activityBrief: "Help the learner build one short personal description using familiar people vocabulary",
        evidence: {
          type: "scenario_response",
          criteria: "The learner produces one understandable sentence containing a people word"
        }
      }]
    },
    content: {
      reading: {
        topic: "people in daily life",
        prompt: "Read a short description of people in a neighborhood"
      },
      realtime: {
        scenario: "Describing people",
        prompt: "Describe the people around you using new vocabulary",
        successCriteria: "The learner uses people vocabulary to describe someone."
      }
    }
  }, {
    id: "lesson-pre-a1-1-quiz",
    title: {
      en: "People & Family Quiz",
      es: "Prueba de Personas y Familia"
    },
    description: {
      en: "Test your knowledge of people and family words",
      es: "Pon a prueba tu conocimiento de palabras de personas y familia"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "people and family review",
        focusPoints: ["family members", "friends", "people"]
      },
      grammar: {
        topic: "people vocabulary usage",
        focusPoints: ["gender", "articles", "possessives"]
      }
    }
  }]
},
// Unit 2: Numbers 0-10
{
  id: "unit-pre-a1-numbers",
  title: {
    en: "Numbers 0-10",
    es: "Números 0-10"
  },
  description: {
    en: "Count from zero to ten",
    es: "Cuenta del cero al diez"
  },
  color: "#EC4899",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-2-1",
    title: {
      en: "Zero to Five",
      es: "Cero a Cinco"
    },
    description: {
      en: "Learn numbers 0-5",
      es: "Aprende números 0-5"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "numbers 0-5",
        focusPoints: ["cero", "uno", "dos", "tres", "cuatro", "cinco"]
      },
      grammar: {
        topic: "number usage",
        focusPoints: ["counting objects"]
      }
    }
  }, {
    id: "lesson-pre-a1-2-2",
    title: {
      en: "Six to Ten",
      es: "Seis a Diez"
    },
    description: {
      en: "Complete counting to ten",
      es: "Completa el conteo hasta diez"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["stories", "reading"],
    content: {
      stories: {
        topic: "numbers 6-10",
        prompt: "Identify quantities from six to ten in a short market exchange",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-counting-items-at-a-market-from-six-to-1"]
      },
      reading: {
        topic: "numbers 6-10",
        prompt: "Read a short passage that uses numbers six through ten"
      }
    }
  }, {
    id: "lesson-pre-a1-2-3",
    title: {
      en: "Counting Objects",
      es: "Contando Objetos"
    },
    description: {
      en: "Use numbers to count things",
      es: "Usa números para contar cosas"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "Counting objects",
        prompt: "Count everyday objects together in a conversation",
        successCriteria: "The learner counts at least three objects using correct numbers."
      },
      stories: {
        topic: "counting objects",
        prompt: "Retell how many toys a child has and shares using numbers zero to ten",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-short-story-about-a-child-counting-toys-and-sharin-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-2-quiz",
    title: {
      en: "Numbers Quiz",
      es: "Prueba de Números"
    },
    description: {
      en: "Test counting 0-10",
      es: "Prueba de contar 0-10"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "numbers review",
        focusPoints: ["0-10"]
      },
      grammar: {
        topic: "number usage",
        focusPoints: ["quantities"]
      }
    }
  }]
},
// Unit 3: Hello & Goodbye
{
  id: "unit-pre-a1-greetings",
  title: {
    en: "Hello & Goodbye",
    es: "Hola y Adiós"
  },
  description: {
    en: "Basic greetings and farewells",
    es: "Saludos y despedidas básicas"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-3-1",
    title: {
      en: "Saying Hello",
      es: "Decir Hola"
    },
    description: {
      en: "Different ways to greet people",
      es: "Diferentes formas de saludar"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "greetings",
        focusPoints: ["hola", "buenos días", "buenas tardes", "buenas noches"]
      },
      grammar: {
        topic: "greeting usage",
        focusPoints: ["time-appropriate greetings"]
      }
    }
  }, {
    id: "lesson-pre-a1-3-2",
    title: {
      en: "Saying Goodbye",
      es: "Decir Adiós"
    },
    description: {
      en: "Farewell expressions",
      es: "Expresiones de despedida"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "farewells",
        prompt: "Read a short dialogue where friends say goodbye in different ways"
      },
      realtime: {
        scenario: "Saying goodbye",
        prompt: "Practice different ways to say goodbye",
        successCriteria: "The learner uses at least two different farewell expressions."
      }
    }
  }, {
    id: "lesson-pre-a1-3-3",
    title: {
      en: "Greetings in Context",
      es: "Saludos en Contexto"
    },
    description: {
      en: "Practice in real situations",
      es: "Practica en situaciones reales"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["stories", "reading"],
    content: {
      stories: {
        topic: "greetings in context",
        prompt: "Choose and produce an appropriate greeting when arriving at a party",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-arriving-at-a-party-and-greeting-every-1"]
      },
      reading: {
        topic: "greeting conversations",
        prompt: "Read a scene where people greet each other at different times of day"
      }
    }
  }, {
    id: "lesson-pre-a1-3-quiz",
    title: {
      en: "Greetings Quiz",
      es: "Prueba de Saludos"
    },
    description: {
      en: "Test greeting skills",
      es: "Prueba de saludos"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "greetings review",
        focusPoints: ["all greetings/farewells"]
      },
      grammar: {
        topic: "greeting rules",
        focusPoints: ["appropriate usage"]
      }
    }
  }]
},
// Unit 4: Yes, No & Basic Responses
{
  id: "unit-pre-a1-responses",
  title: {
    en: "Yes, No & Basic Responses",
    es: "Sí, No y Respuestas Básicas"
  },
  description: {
    en: "Essential single-word responses",
    es: "Respuestas esenciales de una palabra"
  },
  color: "#F59E0B",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-4-1",
    title: {
      en: "Yes and No",
      es: "Sí y No"
    },
    description: {
      en: "The most important words",
      es: "Las palabras más importantes"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "affirmative/negative",
        focusPoints: ["sí", "no", "claro", "vale"]
      },
      grammar: {
        topic: "response patterns",
        focusPoints: ["answering yes/no questions"]
      }
    }
  }, {
    id: "lesson-pre-a1-4-2",
    title: {
      en: "Maybe and I Don't Know",
      es: "Quizás y No Sé"
    },
    description: {
      en: "Express uncertainty",
      es: "Expresa incertidumbre"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "Expressing uncertainty",
        prompt: "Practice responding with maybe, I don't know, and other uncertain phrases",
        successCriteria: "The learner uses at least two uncertainty expressions."
      },
      stories: {
        topic: "uncertainty expressions",
        prompt: "Respond to an undecided lunch choice with an uncertainty expression",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-someone-who-can-t-decide-what-to-eat-f-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-4-3",
    title: {
      en: "Quick Responses",
      es: "Respuestas Rápidas"
    },
    description: {
      en: "React naturally",
      es: "Reacciona naturalmente"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["reading", "stories"],
    content: {
      reading: {
        topic: "reaction words",
        prompt: "Read a text message conversation full of reactions and exclamations"
      },
      stories: {
        topic: "quick responses",
        prompt: "Choose a natural short reaction to surprising news",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-friends-reacting-to-surprising-news-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-4-quiz",
    title: {
      en: "Responses Quiz",
      es: "Prueba de Respuestas"
    },
    description: {
      en: "Test response skills",
      es: "Prueba de respuestas"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "responses review",
        focusPoints: ["yes/no", "uncertainty", "reactions"]
      },
      grammar: {
        topic: "response usage",
        focusPoints: ["appropriate responses"]
      }
    }
  }]
},
// Unit 5: Please & Thank You
{
  id: "unit-pre-a1-courtesy",
  title: {
    en: "Please & Thank You",
    es: "Por Favor y Gracias"
  },
  description: {
    en: "Essential courtesy expressions",
    es: "Expresiones de cortesía esenciales"
  },
  color: "#EF4444",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-5-1",
    title: {
      en: "Please and Thank You",
      es: "Por Favor y Gracias"
    },
    description: {
      en: "Magic words that open doors",
      es: "Palabras mágicas que abren puertas"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "basic courtesy",
        focusPoints: ["por favor", "gracias", "muchas gracias", "de nada"]
      },
      grammar: {
        topic: "polite requests",
        focusPoints: ["adding por favor"]
      }
    }
  }, {
    id: "lesson-pre-a1-5-2",
    title: {
      en: "Sorry and Excuse Me",
      es: "Perdón y Disculpe"
    },
    description: {
      en: "Apologize politely",
      es: "Discúlpate educadamente"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["stories", "realtime"],
    content: {
      stories: {
        topic: "apologies",
        prompt: "Choose an appropriate apology after accidentally bumping into someone",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-someone-who-accidentally-bumps-into-pe-1"]
      },
      realtime: {
        scenario: "Apologizing and excusing yourself",
        prompt: "Practice saying sorry and excuse me in different situations",
        successCriteria: "The learner uses apology and attention phrases appropriately."
      }
    }
  }, {
    id: "lesson-pre-a1-5-3",
    title: {
      en: "Polite Expressions",
      es: "Expresiones Corteses"
    },
    description: {
      en: "Additional gracious phrases",
      es: "Frases corteses adicionales"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "polite expressions",
        prompt: "Read a scene where people exchange gracious phrases at a restaurant"
      },
      realtime: {
        scenario: "Being polite",
        prompt: "Practice using polite phrases in everyday situations",
        successCriteria: "The learner uses at least two polite expressions naturally."
      }
    }
  }, {
    id: "lesson-pre-a1-5-quiz",
    title: {
      en: "Courtesy Quiz",
      es: "Prueba de Cortesía"
    },
    description: {
      en: "Test polite expressions",
      es: "Prueba de expresiones corteses"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "courtesy review",
        focusPoints: ["please/thank you", "apologies"]
      },
      grammar: {
        topic: "courtesy usage",
        focusPoints: ["appropriate situations"]
      }
    }
  }]
},
// Unit 6: Common Objects
{
  id: "unit-pre-a1-objects",
  title: {
    en: "Common Objects",
    es: "Objetos Comunes"
  },
  description: {
    en: "Name everyday things",
    es: "Nombra las cosas cotidianas"
  },
  color: "#06B6D4",
  position: {
    row: 5,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-6-1",
    title: {
      en: "Things at Home",
      es: "Cosas en Casa"
    },
    description: {
      en: "Common household items",
      es: "Artículos comunes del hogar"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "household items",
        focusPoints: ["mesa", "silla", "puerta", "ventana", "cama"]
      },
      grammar: {
        topic: "articles with objects",
        focusPoints: ["el/la"]
      }
    }
  }, {
    id: "lesson-pre-a1-6-2",
    title: {
      en: "Personal Items",
      es: "Artículos Personales"
    },
    description: {
      en: "Things you carry daily",
      es: "Cosas que llevas cada día"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["reading", "stories"],
    content: {
      reading: {
        topic: "personal items",
        prompt: "Read about someone describing what they carry in their bag"
      },
      stories: {
        topic: "personal items",
        prompt: "Identify which personal item is missing and say where to look for it",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-someone-who-lost-their-keys-and-search-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-6-3",
    title: {
      en: "Food and Drink",
      es: "Comida y Bebida"
    },
    description: {
      en: "Basic food vocabulary",
      es: "Vocabulario básico de comida"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["realtime", "reading"],
    content: {
      realtime: {
        scenario: "Ordering food and drinks",
        prompt: "Practice asking for food and drinks at a café",
        successCriteria: "The learner names at least two food or drink items."
      },
      reading: {
        topic: "food and drinks",
        prompt: "Read a simple café menu and identify common food and drink items"
      }
    }
  }, {
    id: "lesson-pre-a1-6-quiz",
    title: {
      en: "Objects Quiz",
      es: "Prueba de Objetos"
    },
    description: {
      en: "Test object vocabulary",
      es: "Prueba de vocabulario de objetos"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "objects review",
        focusPoints: ["household", "personal", "food"]
      },
      grammar: {
        topic: "object naming",
        focusPoints: ["articles", "gender"]
      }
    }
  }]
},
// Unit 7: Colors
{
  id: "unit-pre-a1-colors",
  title: {
    en: "Colors",
    es: "Colores"
  },
  description: {
    en: "Identify and name colors",
    es: "Identifica y nombra colores"
  },
  color: "#F97316",
  position: {
    row: 6,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-7-1",
    title: {
      en: "Primary Colors",
      es: "Colores Primarios"
    },
    description: {
      en: "Red, blue, yellow",
      es: "Rojo, azul, amarillo"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "primary colors",
        focusPoints: ["rojo", "azul", "amarillo"]
      },
      grammar: {
        topic: "color as adjective",
        focusPoints: ["el libro rojo"]
      }
    }
  }, {
    id: "lesson-pre-a1-7-2",
    title: {
      en: "More Colors",
      es: "Más Colores"
    },
    description: {
      en: "Expand your palette",
      es: "Amplía tu paleta"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["realtime", "reading"],
    content: {
      realtime: {
        scenario: "Describing colors around you",
        prompt: "Tell someone what colors you see around you",
        successCriteria: "The learner names at least three colors in conversation."
      },
      reading: {
        topic: "additional colors",
        prompt: "Read descriptions of colorful paintings and identify the colors used"
      }
    }
  }, {
    id: "lesson-pre-a1-7-3",
    title: {
      en: "Black, White & Neutral",
      es: "Negro, Blanco y Neutros"
    },
    description: {
      en: "Complete your palette",
      es: "Completa tu paleta"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["stories", "realtime"],
    content: {
      stories: {
        topic: "neutral colors",
        prompt: "Describe a room choice using light, dark, and neutral color words",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-painting-a-room-and-choosing-between-l-1"]
      },
      realtime: {
        scenario: "Color preferences",
        prompt: "Discuss your favorite colors and describe what color things are",
        successCriteria: "The learner uses at least three color words including neutral colors."
      }
    }
  }, {
    id: "lesson-pre-a1-7-quiz",
    title: {
      en: "Colors Quiz",
      es: "Prueba de Colores"
    },
    description: {
      en: "Test color knowledge",
      es: "Prueba de conocimiento de colores"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "colors review",
        focusPoints: ["all colors"]
      },
      grammar: {
        topic: "color usage",
        focusPoints: ["agreement", "placement"]
      }
    }
  }]
},
// Unit 8: What's Your Name?
{
  id: "unit-pre-a1-introductions",
  title: {
    en: "What's Your Name?",
    es: "¿Cómo Te Llamas?"
  },
  description: {
    en: "Introduce yourself",
    es: "Preséntate"
  },
  color: "#6366F1",
  position: {
    row: 7,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-8-1",
    title: {
      en: "Saying Your Name",
      es: "Decir Tu Nombre"
    },
    description: {
      en: "Learn to introduce yourself",
      es: "Aprende a presentarte"
    },
    xpRequired: 0,
    xpReward: 15,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "self introduction",
        focusPoints: ["me llamo", "soy", "mi nombre es"]
      },
      grammar: {
        topic: "introduction patterns",
        focusPoints: ["Me llamo + name"]
      }
    }
  }, {
    id: "lesson-pre-a1-8-2",
    title: {
      en: "Asking Names",
      es: "Preguntar Nombres"
    },
    description: {
      en: "Ask others their name",
      es: "Pregunta a otros su nombre"
    },
    xpRequired: 10,
    xpReward: 15,
    modes: ["stories", "realtime"],
    content: {
      stories: {
        topic: "asking for names",
        prompt: "Ask for and remember the names of two new classmates",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-a-new-student-meeting-classmates-and-l-1"]
      },
      realtime: {
        scenario: "Asking someone's name",
        prompt: "Meet someone new and ask what their name is",
        successCriteria: "The learner asks for the other person's name using an appropriate phrase."
      }
    }
  }, {
    id: "lesson-pre-a1-8-3",
    title: {
      en: "Nice to Meet You",
      es: "Mucho Gusto"
    },
    description: {
      en: "Complete the introduction",
      es: "Completa la presentación"
    },
    xpRequired: 20,
    xpReward: 15,
    modes: ["reading", "stories"],
    content: {
      reading: {
        topic: "meeting expressions",
        prompt: "Read a dialogue where two people meet for the first time and exchange polite greetings"
      },
      stories: {
        topic: "nice to meet you",
        prompt: "Complete a first meeting with an introduction and a nice-to-meet-you expression",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-a-story-about-a-welcome-party-where-everyone-introdu-1"]
      }
    }
  }, {
    id: "lesson-pre-a1-8-quiz",
    title: {
      en: "Introductions Quiz",
      es: "Prueba de Presentaciones"
    },
    description: {
      en: "Test introduction skills",
      es: "Prueba de presentaciones"
    },
    xpRequired: 30,
    xpReward: 25,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "introductions review",
        focusPoints: ["giving name", "asking name"]
      },
      grammar: {
        topic: "introduction patterns",
        focusPoints: ["formal/informal"]
      }
    }
  }]
},
// Unit: First Words (moved from A1)
{
  id: "unit-a1-1",
  title: {
    en: "First Words",
    es: "Primeras Palabras"
  },
  description: {
    en: "Combine familiar basics into complete first conversations",
    es: "Combina lo básico en primeras conversaciones completas"
  },
  color: "#22C55E",
  position: {
    row: 8,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-1-1",
    title: {
      en: "Conversation Building Blocks",
      es: "Bloques de una Conversación"
    },
    description: {
      en: "Combine greetings, introductions, courtesy, and closings",
      es: "Combina saludos, presentaciones, cortesía y despedidas"
    },
    xpRequired: 0,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "greetings and polite words",
        focusPoints: ["hola, buenos días, buenas tardes/noches", "adiós, hasta luego", "por favor, gracias, de nada"]
      },
      grammar: {
        topic: "greeting people formally and informally",
        focusPoints: ["¿cómo estás? (informal) vs ¿cómo está usted? (formal)", "me llamo... / soy...", "mucho gusto, encantado/a"]
      }
    }
  }, {
    id: "lesson-a1-1-2",
    title: {
      en: "Meeting Someone New",
      es: "Conocer a Alguien Nuevo"
    },
    description: {
      en: "Practice greetings in real conversations",
      es: "Practica saludos en conversaciones reales"
    },
    xpRequired: 10,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "holding a complete first conversation",
        prompt: "Complete a four-turn first meeting: greet, exchange names, ask how someone is, and close politely",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["realtime-practice-greetings-and-introductions-hola-me-llamo-1"]
      },
      stories: {
        topic: "the sequence of a first conversation",
        prompt: "Identify the greeting, introduction, courtesy phrase, and closing in a short conversation",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-read-a-short-greeting-dialogue-and-discuss-it-1"]
      }
    }
  }, {
    id: "lesson-a1-1-3",
    title: {
      en: "Advanced Greetings",
      es: "Saludos Avanzados"
    },
    description: {
      en: "Switch a complete introduction between casual and formal register",
      es: "Cambia una presentación completa entre registro casual y formal"
    },
    xpRequired: 20,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "formal vs informal greetings",
        prompt: "Compare two introductions and identify the casual and formal register choices",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["reading-read-and-notice-when-to-use-tu-vs-usted-in-greetings-1"]
      },
      realtime: {
        scenario: "greeting a friend vs a stranger",
        prompt: "Perform the same introduction casually with a peer and formally with a stranger",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["realtime-demonstrate-greetings-and-introductions-in-the-right-1"]
      }
    }
  }, {
    id: "lesson-a1-1-quiz",
    title: {
      en: "First Words Quiz",
      es: "Prueba de Primeras Palabras"
    },
    description: {
      en: "Test your knowledge of first words",
      es: "Prueba tus conocimientos de primeras palabras"
    },
    xpRequired: 30,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "greetings and polite words",
        focusPoints: ["hola, adiós, gracias, por favor", "me llamo..., mucho gusto"]
      },
      grammar: {
        topics: ["greeting people formally and informally"],
        focusPoints: ["¿cómo estás? vs ¿cómo está usted?"]
      }
    }
  }]
},
// Unit: Numbers 11-30 (moved from A1)
{
  id: "unit-a1-3",
  title: {
    en: "Numbers 11-30",
    es: "Números 11-30"
  },
  description: {
    en: "Count from eleven to thirty",
    es: "Cuenta del once al treinta"
  },
  color: "#F59E0B",
  position: {
    row: 9,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-3-1",
    title: {
      en: "Counting from Eleven to Thirty",
      es: "Contando del Once al Treinta"
    },
    description: {
      en: "Learn to count from eleven to thirty",
      es: "Aprende a contar del once al treinta"
    },
    xpRequired: 0,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "numbers 11-30",
        focusPoints: ["once, doce, trece, catorce, quince", "dieciséis, diecisiete, dieciocho, diecinueve, veinte", "veintiuno, veintidós... treinta"]
      },
      grammar: {
        topic: "using numbers to count and quantify",
        focusPoints: ["hay + number (hay trece libros)", "veintiuno vs veintiún/veintiuna", "¿cuántos/cuántas hay?"]
      }
    }
  }, {
    id: "lesson-a1-3-2",
    title: {
      en: "Using Numbers Daily",
      es: "Usando Números Diariamente"
    },
    description: {
      en: "Practice numbers in everyday situations",
      es: "Practica números en situaciones cotidianas"
    },
    xpRequired: 10,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "counting things out loud with a friend",
        prompt: "Practice numbers 11-30 with 'hay' and '¿cuántos hay?'"
      },
      stories: {
        topic: "numbers in everyday life",
        prompt: "Read a short text with numbers and discuss the quantities"
      }
    }
  }, {
    id: "lesson-a1-3-3",
    title: {
      en: "Phone Numbers and Ages",
      es: "Números de Teléfono y Edades"
    },
    description: {
      en: "Apply numbers to phone numbers and ages",
      es: "Aplica números a teléfonos y edades"
    },
    xpRequired: 20,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["phone"], ["age"]],
    content: {
      reading: {
        topic: "phone numbers and ages",
        prompt: "Read a contact card and identify a phone number and an age"
      },
      realtime: {
        scenario: "exchanging contact details and ages",
        prompt: "Ask for and give a phone number and an age"
      }
    }
  }, {
    id: "lesson-a1-3-quiz",
    title: {
      en: "Numbers 11-30 Quiz",
      es: "Prueba de Números 11-30"
    },
    description: {
      en: "Test your knowledge of numbers 11-30",
      es: "Prueba tus conocimientos de números 11-30"
    },
    xpRequired: 30,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "numbers 11-30",
        focusPoints: ["once a veinte", "veintiuno a treinta"]
      },
      grammar: {
        topics: ["counting and quantifying"],
        focusPoints: ["hay + number", "¿cuántos hay?"]
      }
    }
  }]
},
// Unit: Numbers 31-100 (moved from A1)
{
  id: "unit-a1-4",
  title: {
    en: "Numbers 31-100",
    es: "Números 31-100"
  },
  description: {
    en: "Larger numbers",
    es: "Números más grandes"
  },
  color: "#8B5CF6",
  position: {
    row: 10,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-4-1",
    title: {
      en: "Counting from Thirty-One to One Hundred",
      es: "Contando del Treinta y Uno al Cien"
    },
    description: {
      en: "Learn to count from thirty-one to one hundred",
      es: "Aprende a contar del treinta y uno al cien"
    },
    xpRequired: 0,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "numbers 31-100",
        focusPoints: ["treinta y uno, cuarenta, cincuenta", "sesenta, setenta, ochenta, noventa, cien", "compounds: treinta y cinco, cuarenta y dos"]
      },
      grammar: {
        topic: "forming numbers 31-100",
        focusPoints: ["y in compounds (cuarenta y dos)", "cien vs ciento", "agreement: treinta y un libros, treinta y una casas"]
      }
    }
  }, {
    id: "lesson-a1-4-2",
    title: {
      en: "Prices and Money",
      es: "Precios y Dinero"
    },
    description: {
      en: "Practice using larger numbers with prices and money",
      es: "Practica usando números grandes con precios y dinero"
    },
    xpRequired: 10,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "comparing prices and checking a total",
        prompt: "Practice numbers 31-100 with prices, totals, and change"
      },
      stories: {
        topic: "numbers in prices and quantities",
        prompt: "Read prices and amounts and say the numbers aloud"
      }
    }
  }, {
    id: "lesson-a1-4-3",
    title: {
      en: "Big Numbers in Context",
      es: "Números Grandes en Contexto"
    },
    description: {
      en: "Apply larger numbers in real-life contexts",
      es: "Aplica números grandes en contextos de la vida real"
    },
    xpRequired: 20,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "larger numbers in real contexts",
        prompt: "Read numbers 31-100 in prices, scores, and quantities and interpret them",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["reading-read-larger-numbers-prices-years-quantities-and-inte-1"]
      },
      realtime: {
        scenario: "saying prices, scores, totals, and quantities",
        prompt: "Use numbers 31-100 to state prices, scores, totals, and quantities"
      }
    }
  }, {
    id: "lesson-a1-4-quiz",
    title: {
      en: "Numbers 31-100 Quiz",
      es: "Prueba de Números 31-100"
    },
    description: {
      en: "Test your knowledge of numbers 31-100",
      es: "Prueba tus conocimientos de números 31-100"
    },
    xpRequired: 30,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "numbers 31-100",
        focusPoints: ["treinta y uno a cien", "compound numbers"]
      },
      grammar: {
        topics: ["forming numbers 31-100"],
        focusPoints: ["y in compounds", "cien vs ciento"]
      }
    }
  }]
},
// Unit: Pre-A1 Foundations (moved from A1 - now last in Pre-A1)
{
  id: "unit-pre-a1-foundations",
  title: {
    en: "Pre-A1 Foundations",
    es: "Fundamentos Pre-A1"
  },
  description: {
    en: "100 must-know words and phrases to start fast",
    es: "100 palabras y frases imprescindibles para empezar rápido"
  },
  color: "#10B981",
  position: {
    row: 11,
    offset: 0
  },
  lessons: [{
    id: "lesson-pre-a1-f-1",
    title: {
      en: "Everyday Starters",
      es: "Arranques Cotidianos"
    },
    description: {
      en: "Your first 20 high-frequency words for greetings and basics",
      es: "Tus primeras 20 palabras de alta frecuencia para saludos y básicos"
    },
    xpRequired: 0,
    xpReward: 25,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "greetings and starters",
        focusPoints: ["hello/bye variations", "thanks/please", "yes/no"]
      },
      grammar: {
        topic: "formula chunks",
        focusPoints: ["basic greeting patterns"]
      }
    }
  }, {
    id: "lesson-pre-a1-f-2",
    title: {
      en: "People & Places",
      es: "Personas y Lugares"
    },
    description: {
      en: "Add 20 words for names, family, and moving around",
      es: "Suma 20 palabras para nombres, familia y moverte por ahí"
    },
    xpRequired: 10,
    xpReward: 25,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "people and places",
        focusPoints: ["family", "locations", "getting attention"]
      },
      grammar: {
        topic: "formula chunks",
        focusPoints: ["I am/from", "This is", "Where is?"]
      }
    }
  }, {
    id: "lesson-pre-a1-f-3",
    title: {
      en: "Actions & Essentials",
      es: "Acciones y Esenciales"
    },
    description: {
      en: "20 everyday verbs and short requests to get things done",
      es: "20 verbos cotidianos y peticiones cortas para lograr cosas"
    },
    xpRequired: 20,
    xpReward: 30,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "actions and needs",
        focusPoints: ["common verbs", "requests", "need/want"]
      },
      grammar: {
        topic: "action phrases",
        focusPoints: ["basic verb usage"]
      }
    }
  }, {
    id: "lesson-pre-a1-f-4",
    title: {
      en: "Time, Travel & Directions",
      es: "Tiempo, Viajes y Direcciones"
    },
    description: {
      en: "20 words for time, transport, and finding your way",
      es: "20 palabras para tiempo, transporte y orientarte"
    },
    xpRequired: 30,
    xpReward: 30,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "time and movement",
        focusPoints: ["days and hours", "here/there", "left/right"]
      },
      grammar: {
        topic: "direction phrases",
        focusPoints: ["basic direction patterns"]
      }
    }
  }, {
    id: "lesson-pre-a1-f-quiz",
    title: {
      en: "Foundations Quiz",
      es: "Prueba de Fundamentos"
    },
    description: {
      en: "Round out 100 words with connectors, feelings, and quick questions",
      es: "Completa 100 palabras con conectores, emociones y preguntas rápidas"
    },
    xpRequired: 40,
    xpReward: 35,
    isFinalQuiz: true,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "connectors and questions",
        focusPoints: ["and/but/because", "how/what/where", "feeling words"]
      },
      grammar: {
        topic: "foundation review",
        focusPoints: ["all patterns"]
      }
    }
  }]
}];
