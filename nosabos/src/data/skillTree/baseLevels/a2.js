// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-a2-1",
  title: {
    en: "Describing People",
    es: "Describir Personas"
  },
  description: {
    en: "Physical descriptions",
    es: "Descripciones físicas"
  },
  color: "#22C55E",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-1-1",
    title: {
      en: "Appearance Words",
      es: "Palabras de Apariencia"
    },
    description: {
      en: "Learn key vocabulary for describing people",
      es: "Aprende vocabulario clave para describir personas"
    },
    xpRequired: 1350,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "describing people's appearance and personality",
        focusPoints: ["alto/a, bajo/a, moreno/a, rubio/a", "delgado/a, fuerte, joven, mayor", "simpático/a, tímido/a, alegre"]
      },
      grammar: {
        topic: "ser and adjectives for description",
        focusPoints: ["ser + adjective (es alto)", "agreement in gender and number", "tener + noun (tiene el pelo largo)"]
      }
    }
  }, {
    id: "lesson-a2-1-2",
    title: {
      en: "How Do They Look?",
      es: "¿Cómo Se Ven?"
    },
    description: {
      en: "Practice describing people in conversation",
      es: "Practica describir personas en conversación"
    },
    xpRequired: 1370,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing a friend to someone who hasn't met them",
        prompt: "Practice 'es...' and 'tiene...' to describe appearance and character"
      },
      stories: {
        topic: "a character description",
        prompt: "Read a description of a person and discuss"
      }
    }
  }, {
    id: "lesson-a2-1-3",
    title: {
      en: "Detailed Descriptions",
      es: "Descripciones Detalladas"
    },
    description: {
      en: "Apply describing people skills",
      es: "Aplica habilidades de describir personas"
    },
    xpRequired: 1390,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "physical vs personality description",
        prompt: "Read and separate looks (es alto) from character (es amable)"
      },
      realtime: {
        scenario: "describing someone in a photo",
        prompt: "Demonstrate description with 'ser', 'tener', and agreement"
      }
    }
  }, {
    id: "lesson-a2-1-quiz",
    title: {
      en: "Describing People Quiz",
      es: "Prueba de Describir Personas"
    },
    description: {
      en: "Test your knowledge of describing people",
      es: "Prueba tus conocimientos de describir personas"
    },
    xpRequired: 1410,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "describing people",
        focusPoints: ["alto, bajo, moreno, rubio", "simpático, tímido, alegre"]
      },
      grammar: {
        topics: ["ser and adjectives for description"],
        focusPoints: ["ser + adjective with agreement", "tener el pelo..."]
      }
    }
  }]
}, {
  id: "unit-a2-2",
  title: {
    en: "Describing Places",
    es: "Describir Lugares"
  },
  description: {
    en: "Talk about locations",
    es: "Habla sobre lugares"
  },
  color: "#3B82F6",
  position: {
    row: 0,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-2-1",
    title: {
      en: "Places Around Town",
      es: "Lugares en la Ciudad"
    },
    description: {
      en: "Learn key vocabulary for describing places",
      es: "Aprende vocabulario clave para describir lugares"
    },
    xpRequired: 1450,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "describing places",
        focusPoints: ["grande, pequeño, bonito, feo", "tranquilo, ruidoso, moderno, antiguo", "la ciudad, el pueblo, el barrio"]
      },
      grammar: {
        topic: "hay, estar, and ser for places",
        focusPoints: ["hay + noun (hay un parque)", "estar for location (está en el centro)", "ser for characteristics (es grande)"]
      }
    }
  }, {
    id: "lesson-a2-2-2",
    title: {
      en: "My Neighborhood",
      es: "Mi Vecindario"
    },
    description: {
      en: "Practice describing places in conversation",
      es: "Practica describir lugares en conversación"
    },
    xpRequired: 1470,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing your town to a visitor",
        prompt: "Practice 'hay...', 'está...', and 'es...' to describe a place"
      },
      stories: {
        topic: "a description of a city",
        prompt: "Read about a place and discuss what it's like"
      }
    }
  }, {
    id: "lesson-a2-2-3",
    title: {
      en: "Dream Destinations",
      es: "Destinos Soñados"
    },
    description: {
      en: "Apply describing places skills",
      es: "Aplica habilidades de describir lugares"
    },
    xpRequired: 1490,
    xpReward: 45,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["dream", "destination"], ["appealing", "like"]],
    content: {
      reading: {
        topic: "descriptions of dream destinations",
        prompt: "Read two destination descriptions and identify what makes each place appealing"
      },
      realtime: {
        scenario: "sharing where you would most like to travel",
        prompt: "Describe a dream destination and explain what the place is like"
      }
    }
  }, {
    id: "lesson-a2-2-quiz",
    title: {
      en: "Describing Places Quiz",
      es: "Prueba de Describir Lugares"
    },
    description: {
      en: "Test your knowledge of describing places",
      es: "Prueba tus conocimientos de describir lugares"
    },
    xpRequired: 1510,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "describing places",
        focusPoints: ["grande, pequeño, tranquilo, ruidoso", "ciudad, pueblo, barrio"]
      },
      grammar: {
        topics: ["hay, estar, and ser for places"],
        focusPoints: ["hay vs está vs es"]
      }
    }
  }]
}, {
  id: "unit-a2-3",
  title: {
    en: "Shopping & Money",
    es: "Compras y Dinero"
  },
  description: {
    en: "Buy things",
    es: "Compra cosas"
  },
  color: "#F59E0B",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-3-1",
    title: {
      en: "At the Store",
      es: "En la Tienda"
    },
    description: {
      en: "Learn key vocabulary for shopping & money",
      es: "Aprende vocabulario clave para compras y dinero"
    },
    xpRequired: 1550,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "shopping and money",
        focusPoints: ["la tienda, el precio, la talla", "caro/a, barato/a, la oferta", "el euro, pagar, el cambio"]
      },
      grammar: {
        topic: "asking about prices and items",
        focusPoints: ["¿cuánto cuesta? / ¿cuánto es?", "demonstratives: este, ese, aquel", "quería / me llevo..."]
      }
    }
  }, {
    id: "lesson-a2-3-2",
    title: {
      en: "Bargain Hunting",
      es: "Buscando Ofertas"
    },
    description: {
      en: "Practice shopping & money in conversation",
      es: "Practica compras y dinero en conversación"
    },
    xpRequired: 1570,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "buying clothes and asking the price",
        prompt: "Practice '¿cuánto cuesta?' and 'me llevo...' while shopping"
      },
      stories: {
        topic: "a shopping conversation",
        prompt: "Read a shop dialogue and discuss the purchase"
      }
    }
  }, {
    id: "lesson-a2-3-3",
    title: {
      en: "Smart Shopping",
      es: "Comprando Inteligentemente"
    },
    description: {
      en: "Apply shopping & money skills",
      es: "Aplica habilidades de compras y dinero"
    },
    xpRequired: 1590,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "prices and paying",
        prompt: "Read prices and a receipt and follow the amounts"
      },
      realtime: {
        scenario: "paying and asking for the price",
        prompt: "Demonstrate shopping vocabulary and price questions"
      }
    }
  }, {
    id: "lesson-a2-3-quiz",
    title: {
      en: "Shopping & Money Quiz",
      es: "Prueba de Compras y Dinero"
    },
    description: {
      en: "Test your knowledge of shopping & money",
      es: "Prueba tus conocimientos de compras y dinero"
    },
    xpRequired: 1610,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "shopping and money",
        focusPoints: ["tienda, precio, talla, oferta", "caro, barato, pagar"]
      },
      grammar: {
        topics: ["asking about prices and items"],
        focusPoints: ["¿cuánto cuesta?", "este/ese/aquel"]
      }
    }
  }]
}, {
  id: "unit-a2-4",
  title: {
    en: "At the Market",
    es: "En el Mercado"
  },
  description: {
    en: "Fresh food shopping",
    es: "Compra de alimentos"
  },
  color: "#8B5CF6",
  position: {
    row: 1,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-4-1",
    title: {
      en: "Fresh Produce",
      es: "Productos Frescos"
    },
    description: {
      en: "Learn key vocabulary for at the market",
      es: "Aprende vocabulario clave para en el mercado"
    },
    xpRequired: 1650,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "at the market",
        focusPoints: ["la fruta, la verdura, la carne, el pescado", "el kilo, el gramo, la docena", "el puesto, la bolsa"]
      },
      grammar: {
        topic: "asking for quantities",
        focusPoints: ["un kilo de / medio kilo de", "¿a cuánto está(n)?", "quisiera / póngame..."]
      }
    }
  }, {
    id: "lesson-a2-4-2",
    title: {
      en: "Buying Groceries",
      es: "Comprando Comestibles"
    },
    description: {
      en: "Practice at the market in conversation",
      es: "Practica en el mercado en conversación"
    },
    xpRequired: 1670,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "buying fruit and vegetables at a market",
        prompt: "Practice quantities: 'un kilo de...', '¿a cuánto está?'"
      },
      stories: {
        topic: "a market scene",
        prompt: "Read a market dialogue and discuss the quantities bought"
      }
    }
  }, {
    id: "lesson-a2-4-3",
    title: {
      en: "Market Day",
      es: "Día de Mercado"
    },
    description: {
      en: "Apply at the market skills",
      es: "Aplica habilidades de en el mercado"
    },
    xpRequired: 1690,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "quantities and prices at the market",
        prompt: "Read and follow amounts and prices in a market list"
      },
      realtime: {
        scenario: "ordering produce by weight",
        prompt: "Demonstrate market vocabulary with quantities and prices"
      }
    }
  }, {
    id: "lesson-a2-4-quiz",
    title: {
      en: "At the Market Quiz",
      es: "Prueba de En el Mercado"
    },
    description: {
      en: "Test your knowledge of at the market",
      es: "Prueba tus conocimientos de en el mercado"
    },
    xpRequired: 1710,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "at the market",
        focusPoints: ["fruta, verdura, carne, pescado", "kilo, gramo, docena"]
      },
      grammar: {
        topics: ["asking for quantities"],
        focusPoints: ["un kilo de / medio kilo de", "¿a cuánto está?"]
      }
    }
  }]
}, {
  id: "unit-a2-5",
  title: {
    en: "Transportation",
    es: "Transporte"
  },
  description: {
    en: "Getting around",
    es: "Moverse"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-5-1",
    title: {
      en: "Getting Around",
      es: "Moviéndose"
    },
    description: {
      en: "Learn key vocabulary for transportation",
      es: "Aprende vocabulario clave para transporte"
    },
    xpRequired: 1750,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "transportation",
        focusPoints: ["el autobús, el tren, el metro, el coche", "el billete/boleto, la parada, la estación", "el aeropuerto, el avión"]
      },
      grammar: {
        topic: "talking about getting around",
        focusPoints: ["ir en + transport (en autobús, a pie)", "coger/tomar el autobús", "¿cómo vas a...?"]
      }
    }
  }, {
    id: "lesson-a2-5-2",
    title: {
      en: "Taking the Bus",
      es: "Tomando el Autobús"
    },
    description: {
      en: "Practice transportation in conversation",
      es: "Practica transporte en conversación"
    },
    xpRequired: 1770,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "asking how to get to a place by public transport",
        prompt: "Practice 'ir en...' and buying a ticket"
      },
      stories: {
        topic: "getting around a city",
        prompt: "Read about a journey and discuss the transport used"
      }
    }
  }, {
    id: "lesson-a2-5-3",
    title: {
      en: "Travel Options",
      es: "Opciones de Viaje"
    },
    description: {
      en: "Apply transportation skills",
      es: "Aplica habilidades de transporte"
    },
    xpRequired: 1790,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "transport options and tickets",
        prompt: "Read a transport schedule and find the details"
      },
      realtime: {
        scenario: "planning a trip across town",
        prompt: "Demonstrate transport vocabulary with 'ir en' and tickets"
      }
    }
  }, {
    id: "lesson-a2-5-quiz",
    title: {
      en: "Transportation Quiz",
      es: "Prueba de Transporte"
    },
    description: {
      en: "Test your knowledge of transportation",
      es: "Prueba tus conocimientos de transporte"
    },
    xpRequired: 1810,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "transportation",
        focusPoints: ["autobús, tren, metro, coche", "billete/boleto, parada, estación"]
      },
      grammar: {
        topics: ["getting around"],
        focusPoints: ["ir en + transport", "coger/tomar el autobús"]
      }
    }
  }]
}, {
  id: "unit-a2-6",
  title: {
    en: "Directions",
    es: "Direcciones"
  },
  description: {
    en: "Find your way",
    es: "Encuentra tu camino"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-6-1",
    title: {
      en: "Left and Right",
      es: "Izquierda y Derecha"
    },
    description: {
      en: "Learn key vocabulary for directions",
      es: "Aprende vocabulario clave para direcciones"
    },
    xpRequired: 1850,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "directions",
        focusPoints: ["a la derecha, a la izquierda, recto/todo recto", "cerca, lejos, al lado de, enfrente de", "la esquina, la calle, la plaza"]
      },
      grammar: {
        topic: "asking for and giving directions",
        focusPoints: ["¿cómo se va a...? / ¿dónde está...?", "imperatives: gire, siga, cruce", "estar for location"]
      }
    }
  }, {
    id: "lesson-a2-6-2",
    title: {
      en: "How Do I Get There?",
      es: "¿Cómo Llego Ahí?"
    },
    description: {
      en: "Practice directions in conversation",
      es: "Practica direcciones en conversación"
    },
    xpRequired: 1870,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "asking a stranger how to get to the station",
        prompt: "Practice '¿cómo se va a...?' and 'gire a la derecha'"
      },
      stories: {
        topic: "following directions",
        prompt: "Read directions to a place and trace the route"
      }
    }
  }, {
    id: "lesson-a2-6-3",
    title: {
      en: "Finding Your Way",
      es: "Encontrando Tu Camino"
    },
    description: {
      en: "Apply directions skills",
      es: "Aplica habilidades de direcciones"
    },
    xpRequired: 1890,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "directions and city places",
        prompt: "Read a route description and find the destination"
      },
      realtime: {
        scenario: "guiding someone to a nearby place",
        prompt: "Demonstrate directions with imperatives and place words"
      }
    }
  }, {
    id: "lesson-a2-6-quiz",
    title: {
      en: "Directions Quiz",
      es: "Prueba de Direcciones"
    },
    description: {
      en: "Test your knowledge of directions",
      es: "Prueba tus conocimientos de direcciones"
    },
    xpRequired: 1910,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "directions",
        focusPoints: ["a la derecha/izquierda, recto", "cerca, lejos, al lado de, enfrente de"]
      },
      grammar: {
        topics: ["asking for and giving directions"],
        focusPoints: ["¿cómo se va a...?", "gire, siga, cruce"]
      }
    }
  }]
}, {
  id: "unit-a2-7",
  title: {
    en: "Making Plans",
    es: "Hacer Planes"
  },
  description: {
    en: "Social arrangements",
    es: "Arreglos sociales"
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-7-1",
    title: {
      en: "Future Activities",
      es: "Actividades Futuras"
    },
    description: {
      en: "Learn key vocabulary for making plans",
      es: "Aprende vocabulario clave para hacer planes"
    },
    xpRequired: 1950,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "making plans and invitations",
        focusPoints: ["quedar, invitar, la cita", "¿te apetece...? / ¿quieres...?", "vale, de acuerdo, lo siento, no puedo"]
      },
      grammar: {
        topic: "arranging to meet",
        focusPoints: ["ir a + infinitive for plans", "quedar (¿quedamos a las...?)", "accepting and declining"]
      }
    }
  }, {
    id: "lesson-a2-7-2",
    title: {
      en: "Let's Meet Up!",
      es: "¡Vamos a Reunirnos!"
    },
    description: {
      en: "Practice making plans in conversation",
      es: "Practica hacer planes en conversación"
    },
    xpRequired: 1970,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "inviting a friend out and agreeing on a time",
        prompt: "Practice '¿te apetece...?' and 'quedamos a las...'"
      },
      stories: {
        topic: "a chat about weekend plans",
        prompt: "Read friends making plans and discuss the arrangement"
      }
    }
  }, {
    id: "lesson-a2-7-3",
    title: {
      en: "Scheduling Events",
      es: "Programando Eventos"
    },
    description: {
      en: "Apply making plans skills",
      es: "Aplica habilidades de hacer planes"
    },
    xpRequired: 1990,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "accepting and turning down invitations",
        prompt: "Read and notice how people accept or decline plans"
      },
      realtime: {
        scenario: "planning an outing with a friend",
        prompt: "Demonstrate making, accepting, and declining invitations"
      }
    }
  }, {
    id: "lesson-a2-7-quiz",
    title: {
      en: "Making Plans Quiz",
      es: "Prueba de Hacer Planes"
    },
    description: {
      en: "Test your knowledge of making plans",
      es: "Prueba tus conocimientos de hacer planes"
    },
    xpRequired: 2010,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "making plans",
        focusPoints: ["quedar, invitar, cita", "¿te apetece...?, vale, no puedo"]
      },
      grammar: {
        topics: ["arranging to meet"],
        focusPoints: ["ir a + infinitive", "quedar a las..."]
      }
    }
  }]
}, {
  id: "unit-a2-8",
  title: {
    en: "Hobbies & Interests",
    es: "Pasatiempos"
  },
  description: {
    en: "Free time",
    es: "Tiempo libre"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-8-1",
    title: {
      en: "Free Time Fun",
      es: "Pasatiempos - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for hobbies & interests",
      es: "Aprende vocabulario clave para pasatiempos"
    },
    xpRequired: 2050,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "hobbies and free time",
        focusPoints: ["leer, pintar, cocinar, bailar", "la música, el cine, los videojuegos", "el tiempo libre, la afición"]
      },
      grammar: {
        topic: "talking about what you like to do",
        focusPoints: ["gustar + infinitive (me gusta leer)", "soler + infinitive (suelo...)", "frequency: a veces, siempre, nunca"]
      }
    }
  }, {
    id: "lesson-a2-8-2",
    title: {
      en: "What Do You Enjoy?",
      es: "Pasatiempos - Práctica"
    },
    description: {
      en: "Practice hobbies & interests in conversation",
      es: "Practica pasatiempos en conversación"
    },
    xpRequired: 2070,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about what you do in your free time",
        prompt: "Practice 'me gusta + infinitive' and frequency words"
      },
      stories: {
        topic: "hobbies and pastimes",
        prompt: "Read about someone's hobbies and discuss"
      }
    }
  }, {
    id: "lesson-a2-8-3",
    title: {
      en: "Sharing Interests",
      es: "Pasatiempos - Aplicación"
    },
    description: {
      en: "Apply hobbies & interests skills",
      es: "Aplica habilidades de pasatiempos"
    },
    xpRequired: 2090,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "free-time habits",
        prompt: "Read and notice how often someone does activities"
      },
      realtime: {
        scenario: "comparing hobbies with a friend",
        prompt: "Demonstrate hobby vocabulary with gustar and frequency"
      }
    }
  }, {
    id: "lesson-a2-8-quiz",
    title: {
      en: "Hobbies & Interests Quiz",
      es: "Prueba de Pasatiempos"
    },
    description: {
      en: "Test your knowledge of hobbies & interests",
      es: "Prueba tus conocimientos de pasatiempos"
    },
    xpRequired: 2110,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "hobbies and interests",
        focusPoints: ["leer, pintar, cocinar, bailar", "música, cine, tiempo libre"]
      },
      grammar: {
        topics: ["talking about what you like to do"],
        focusPoints: ["gustar + infinitive", "soler + infinitive, frequency"]
      }
    }
  }]
}, {
  id: "unit-a2-9",
  title: {
    en: "Sports & Exercise",
    es: "Deportes"
  },
  description: {
    en: "Athletic activities",
    es: "Actividades atléticas"
  },
  color: "#F97316",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-9-1",
    title: {
      en: "Playing Sports",
      es: "Deportes - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for sports & exercise",
      es: "Aprende vocabulario clave para deportes"
    },
    xpRequired: 2150,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "sports and exercise",
        focusPoints: ["el fútbol, el baloncesto, el tenis", "correr, nadar, montar en bici", "el gimnasio, el equipo, el partido"]
      },
      grammar: {
        topic: "talking about doing sports",
        focusPoints: ["jugar a (juego al fútbol)", "hacer / practicar (hago deporte)", "frequency: dos veces por semana"]
      }
    }
  }, {
    id: "lesson-a2-9-2",
    title: {
      en: "Staying Active",
      es: "Deportes - Práctica"
    },
    description: {
      en: "Practice sports & exercise in conversation",
      es: "Practica deportes en conversación"
    },
    xpRequired: 2170,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about the sports you play",
        prompt: "Practice 'juego al...', 'hago...', and frequency"
      },
      stories: {
        topic: "an active lifestyle",
        prompt: "Read about someone's exercise habits and discuss"
      }
    }
  }, {
    id: "lesson-a2-9-3",
    title: {
      en: "Fitness Goals",
      es: "Deportes - Aplicación"
    },
    description: {
      en: "Apply sports & exercise skills",
      es: "Aplica habilidades de deportes"
    },
    xpRequired: 2190,
    xpReward: 55,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["fitness"], ["goal"]],
    content: {
      reading: {
        topic: "a simple fitness plan",
        prompt: "Read a fitness plan and identify its activity, frequency, and goal"
      },
      realtime: {
        scenario: "setting a realistic fitness goal",
        prompt: "State a fitness goal and explain what activity you will do and how often"
      }
    }
  }, {
    id: "lesson-a2-9-quiz",
    title: {
      en: "Sports & Exercise Quiz",
      es: "Prueba de Deportes"
    },
    description: {
      en: "Test your knowledge of sports & exercise",
      es: "Prueba tus conocimientos de deportes"
    },
    xpRequired: 2210,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "sports and exercise",
        focusPoints: ["fútbol, baloncesto, tenis", "correr, nadar, gimnasio"]
      },
      grammar: {
        topics: ["talking about doing sports"],
        focusPoints: ["jugar a vs hacer/practicar", "frequency expressions"]
      }
    }
  }]
}, {
  id: "unit-a2-10",
  title: {
    en: "Past Tense Regular",
    es: "Pasado Regular"
  },
  description: {
    en: "Regular past verbs",
    es: "Verbos pasados regulares"
  },
  color: "#84CC16",
  position: {
    row: 4,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-10-1",
    title: {
      en: "Yesterday's Actions",
      es: "Acciones de Ayer"
    },
    description: {
      en: "Learn key vocabulary for past tense regular",
      es: "Aprende vocabulario clave para pasado regular"
    },
    xpRequired: 2250,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the regular preterite and time markers",
        focusPoints: ["ayer, anoche, la semana pasada", "el año pasado, hace dos días", "ya, por fin"]
      },
      grammar: {
        topic: "forming the regular preterite",
        focusPoints: ["-ar: hablé, hablaste, habló", "-er/-ir: comí, comiste, comió", "for completed past actions"]
      }
    }
  }, {
    id: "lesson-a2-10-2",
    title: {
      en: "What Did You Do?",
      es: "¿Qué Hiciste?"
    },
    description: {
      en: "Practice past tense regular in conversation",
      es: "Practica pasado regular en conversación"
    },
    xpRequired: 2270,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "telling a friend what you did yesterday",
        prompt: "Practice the regular preterite: 'ayer hablé, comí, trabajé'"
      },
      stories: {
        topic: "a short account of a past day",
        prompt: "Read about what someone did and discuss"
      }
    }
  }, {
    id: "lesson-a2-10-3",
    title: {
      en: "Recent Events",
      es: "Eventos Recientes"
    },
    description: {
      en: "Apply past tense regular skills",
      es: "Aplica habilidades de pasado regular"
    },
    xpRequired: 2290,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "the preterite in a sequence of events",
        prompt: "Read a past narrative and notice the preterite verbs"
      },
      realtime: {
        scenario: "recounting last weekend",
        prompt: "Demonstrate the regular preterite with time markers"
      }
    }
  }, {
    id: "lesson-a2-10-quiz",
    title: {
      en: "Past Tense Regular Quiz",
      es: "Prueba de Pasado Regular"
    },
    description: {
      en: "Test your knowledge of past tense regular",
      es: "Prueba tus conocimientos de pasado regular"
    },
    xpRequired: 2310,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the regular preterite",
        focusPoints: ["ayer, anoche, la semana pasada", "hace + time"]
      },
      grammar: {
        topics: ["forming the regular preterite"],
        focusPoints: ["-ar: -é/-aste/-ó", "-er/-ir: -í/-iste/-ió"]
      }
    }
  }]
}, {
  id: "unit-a2-11",
  title: {
    en: "Past Tense Irregular",
    es: "Pasado Irregular"
  },
  description: {
    en: "Irregular verbs",
    es: "Verbos irregulares"
  },
  color: "#14B8A6",
  position: {
    row: 5,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-11-1",
    title: {
      en: "Common Irregular Verbs",
      es: "Verbos Irregulares Comunes"
    },
    description: {
      en: "Learn key vocabulary for past tense irregular",
      es: "Aprende vocabulario clave para pasado irregular"
    },
    xpRequired: 2350,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "irregular preterite verbs",
        focusPoints: ["ser/ir: fui, fuiste, fue", "tener: tuve; estar: estuve", "hacer: hice; poder: pude; decir: dije"]
      },
      grammar: {
        topic: "using common irregular preterites",
        focusPoints: ["irregular stems (tuv-, estuv-, hic-)", "ser and ir share fui/fue", "for completed past actions"]
      }
    }
  }, {
    id: "lesson-a2-11-2",
    title: {
      en: "Last Week",
      es: "La Semana Pasada"
    },
    description: {
      en: "Practice past tense irregular in conversation",
      es: "Practica pasado irregular en conversación"
    },
    xpRequired: 2370,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "telling a friend about a trip you took",
        prompt: "Practice irregulars: 'fui, tuve, hice, estuve'"
      },
      stories: {
        topic: "a past story with irregular verbs",
        prompt: "Read a past account and spot the irregular preterites"
      }
    }
  }, {
    id: "lesson-a2-11-3",
    title: {
      en: "Life Stories",
      es: "Historias de Vida"
    },
    description: {
      en: "Apply past tense irregular skills",
      es: "Aplica habilidades de pasado irregular"
    },
    xpRequired: 2390,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "regular vs irregular preterite",
        prompt: "Read and tell regular (-é/-í) from irregular (fui, hice)"
      },
      realtime: {
        scenario: "recounting an eventful day",
        prompt: "Demonstrate irregular preterite verbs in a short story"
      }
    }
  }, {
    id: "lesson-a2-11-quiz",
    title: {
      en: "Past Tense Irregular Quiz",
      es: "Prueba de Pasado Irregular"
    },
    description: {
      en: "Test your knowledge of past tense irregular",
      es: "Prueba tus conocimientos de pasado irregular"
    },
    xpRequired: 2410,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "irregular preterite",
        focusPoints: ["fui/fue, tuve, estuve", "hice, pude, dije"]
      },
      grammar: {
        topics: ["using common irregular preterites"],
        focusPoints: ["irregular stems", "ser/ir = fui/fue"]
      }
    }
  }]
}, {
  id: "unit-a2-12",
  title: {
    en: "Telling Stories",
    es: "Contar Historias"
  },
  description: {
    en: "Narrate events",
    es: "Narra eventos"
  },
  color: "#A855F7",
  position: {
    row: 5,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-12-1",
    title: {
      en: "Story Elements",
      es: "Elementos de Historia"
    },
    description: {
      en: "Learn key vocabulary for telling stories",
      es: "Aprende vocabulario clave para contar historias"
    },
    xpRequired: 2450,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "telling a story",
        focusPoints: ["primero, luego, después, entonces", "al final, de repente, mientras", "érase una vez"]
      },
      grammar: {
        topic: "preterite vs imperfect in narration",
        focusPoints: ["imperfect for background (era, había, hacía)", "preterite for events (llegó, dijo)", "linking events with connectors"]
      }
    }
  }, {
    id: "lesson-a2-12-2",
    title: {
      en: "Once Upon a Time",
      es: "Érase Una Vez"
    },
    description: {
      en: "Practice telling stories in conversation",
      es: "Practica contar historias en conversación"
    },
    xpRequired: 2470,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "telling a friend a story about something that happened",
        prompt: "Practice connectors and preterite/imperfect to narrate"
      },
      stories: {
        topic: "a short story",
        prompt: "Read a short narrative and notice background vs events"
      }
    }
  }, {
    id: "lesson-a2-12-3",
    title: {
      en: "My Story",
      es: "Mi Historia"
    },
    description: {
      en: "Apply telling stories skills",
      es: "Aplica habilidades de contar historias"
    },
    xpRequired: 2490,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "background vs events in a story",
        prompt: "Read and separate the scene (imperfect) from the action (preterite)"
      },
      realtime: {
        scenario: "narrating a memorable event",
        prompt: "Demonstrate storytelling with connectors and past tenses"
      }
    }
  }, {
    id: "lesson-a2-12-quiz",
    title: {
      en: "Telling Stories Quiz",
      es: "Prueba de Contar Historias"
    },
    description: {
      en: "Test your knowledge of telling stories",
      es: "Prueba tus conocimientos de contar historias"
    },
    xpRequired: 2510,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "telling stories",
        focusPoints: ["primero, luego, después, al final", "de repente, mientras"]
      },
      grammar: {
        topics: ["preterite vs imperfect in narration"],
        focusPoints: ["imperfect for background vs preterite for events"]
      }
    }
  }]
}, {
  id: "unit-a2-13",
  title: {
    en: "Future Plans",
    es: "Planes Futuros"
  },
  description: {
    en: "Future intentions",
    es: "Intenciones futuras"
  },
  color: "#DB2777",
  position: {
    row: 6,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-13-1",
    title: {
      en: "Dreams and Goals",
      es: "Sueños y Metas"
    },
    description: {
      en: "Learn key vocabulary for future plans",
      es: "Aprende vocabulario clave para planes futuros"
    },
    xpRequired: 2550,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "talking about future plans",
        focusPoints: ["mañana, la próxima semana, el próximo año", "pronto, dentro de, este fin de semana", "los planes, el proyecto"]
      },
      grammar: {
        topic: "expressing intentions",
        focusPoints: ["ir a + infinitive (voy a viajar)", "pensar + infinitive, querer + infinitive", "me gustaría + infinitive"]
      }
    }
  }, {
    id: "lesson-a2-13-2",
    title: {
      en: "What Will You Do?",
      es: "¿Qué Harás?"
    },
    description: {
      en: "Practice future plans in conversation",
      es: "Practica planes futuros en conversación"
    },
    xpRequired: 2570,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about your plans for the holidays",
        prompt: "Practice 'voy a...', 'pienso...', and 'me gustaría...'"
      },
      stories: {
        topic: "future plans and intentions",
        prompt: "Read about someone's plans and discuss"
      }
    }
  }, {
    id: "lesson-a2-13-3",
    title: {
      en: "Planning Ahead",
      es: "Planificando el Futuro"
    },
    description: {
      en: "Apply future plans skills",
      es: "Aplica habilidades de planes futuros"
    },
    xpRequired: 2590,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "ways to talk about the future",
        prompt: "Read and notice 'ir a', 'pensar', and 'querer' + infinitive"
      },
      realtime: {
        scenario: "sharing your goals for next year",
        prompt: "Demonstrate future plans with 'ir a + infinitive' and intentions"
      }
    }
  }, {
    id: "lesson-a2-13-quiz",
    title: {
      en: "Future Plans Quiz",
      es: "Prueba de Planes Futuros"
    },
    description: {
      en: "Test your knowledge of future plans",
      es: "Prueba tus conocimientos de planes futuros"
    },
    xpRequired: 2610,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "future plans",
        focusPoints: ["mañana, la próxima semana, pronto", "los planes, el proyecto"]
      },
      grammar: {
        topics: ["expressing intentions"],
        focusPoints: ["ir a + infinitive", "pensar/querer + infinitive"]
      }
    }
  }]
}, {
  id: "unit-a2-14",
  title: {
    en: "Health & Body",
    es: "Salud y Cuerpo"
  },
  description: {
    en: "Body and health",
    es: "Cuerpo y salud"
  },
  color: "#0EA5E9",
  position: {
    row: 6,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-14-1",
    title: {
      en: "Body Parts",
      es: "Partes del Cuerpo"
    },
    description: {
      en: "Learn key vocabulary for health & body",
      es: "Aprende vocabulario clave para salud y cuerpo"
    },
    xpRequired: 2650,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the body and health",
        focusPoints: ["la cabeza, el estómago, la garganta", "el brazo, la pierna, la espalda", "sano/a, enfermo/a, el dolor"]
      },
      grammar: {
        topic: "saying what hurts",
        focusPoints: ["me duele + singular / me duelen + plural", "doler works like gustar", "tener dolor de cabeza"]
      }
    }
  }, {
    id: "lesson-a2-14-2",
    title: {
      en: "How Do You Feel?",
      es: "¿Cómo Te Sientes?"
    },
    description: {
      en: "Practice health & body in conversation",
      es: "Practica salud y cuerpo en conversación"
    },
    xpRequired: 2670,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "telling someone you don't feel well",
        prompt: "Practice 'me duele(n)...' and 'tengo dolor de...'"
      },
      stories: {
        topic: "talking about health",
        prompt: "Read about someone feeling ill and discuss"
      }
    }
  }, {
    id: "lesson-a2-14-3",
    title: {
      en: "Healthy Living",
      es: "Vida Saludable"
    },
    description: {
      en: "Apply health & body skills",
      es: "Aplica habilidades de salud y cuerpo"
    },
    xpRequired: 2690,
    xpReward: 55,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["healthy"], ["habit", "routine"]],
    content: {
      reading: {
        topic: "a simple healthy routine",
        prompt: "Read a simple healthy routine and identify habits that support wellbeing"
      },
      realtime: {
        scenario: "sharing realistic ways to live more healthfully",
        prompt: "Describe healthy habits for food, movement, rest, and sleep"
      }
    }
  }, {
    id: "lesson-a2-14-quiz",
    title: {
      en: "Health & Body Quiz",
      es: "Prueba de Salud y Cuerpo"
    },
    description: {
      en: "Test your knowledge of health & body",
      es: "Prueba tus conocimientos de salud y cuerpo"
    },
    xpRequired: 2710,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the body and health",
        focusPoints: ["cabeza, estómago, garganta", "brazo, pierna, espalda"]
      },
      grammar: {
        topics: ["saying what hurts"],
        focusPoints: ["me duele vs me duelen", "tener dolor de..."]
      }
    }
  }]
}, {
  id: "unit-a2-15",
  title: {
    en: "At the Doctor's",
    es: "En el Médico"
  },
  description: {
    en: "Medical visits",
    es: "Visitas médicas"
  },
  color: "#22C55E",
  position: {
    row: 7,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-15-1",
    title: {
      en: "Medical Terms",
      es: "Términos Médicos"
    },
    description: {
      en: "Learn key vocabulary for at the doctor's",
      es: "Aprende vocabulario clave para en el médico"
    },
    xpRequired: 2750,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "at the doctor's",
        focusPoints: ["el médico, la cita, los síntomas", "la fiebre, la tos, el resfriado, la gripe", "la receta, la medicina, la farmacia"]
      },
      grammar: {
        topic: "describing symptoms and getting advice",
        focusPoints: ["me encuentro mal, tengo fiebre", "debería / tiene que + infinitive", "¿qué le pasa? / ¿desde cuándo?"]
      }
    }
  }, {
    id: "lesson-a2-15-2",
    title: {
      en: "Visiting the Doctor",
      es: "Visitando al Doctor"
    },
    description: {
      en: "Practice at the doctor's in conversation",
      es: "Practica en el médico en conversación"
    },
    xpRequired: 2770,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a visit to the doctor describing your symptoms",
        prompt: "Practice 'me encuentro mal, tengo...' and advice with 'debería'"
      },
      stories: {
        topic: "a doctor's appointment",
        prompt: "Read a clinic dialogue and discuss the advice given"
      }
    }
  }, {
    id: "lesson-a2-15-3",
    title: {
      en: "Health Concerns",
      es: "Preocupaciones de Salud"
    },
    description: {
      en: "Apply at the doctor's skills",
      es: "Aplica habilidades de en el médico"
    },
    xpRequired: 2790,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "symptoms and remedies",
        prompt: "Read about an illness and the recommended treatment"
      },
      realtime: {
        scenario: "explaining how you feel and asking for advice",
        prompt: "Demonstrate health vocabulary to describe symptoms and get advice"
      }
    }
  }, {
    id: "lesson-a2-15-quiz",
    title: {
      en: "At the Doctor's Quiz",
      es: "Prueba de En el Médico"
    },
    description: {
      en: "Test your knowledge of at the doctor's",
      es: "Prueba tus conocimientos de en el médico"
    },
    xpRequired: 2810,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "at the doctor's",
        focusPoints: ["médico, cita, síntomas", "fiebre, tos, receta, farmacia"]
      },
      grammar: {
        topics: ["describing symptoms and getting advice"],
        focusPoints: ["tengo fiebre / me encuentro mal", "debería / tiene que + infinitive"]
      }
    }
  }]
}, {
  id: "unit-a2-16",
  title: {
    en: "Jobs & Professions",
    es: "Trabajos"
  },
  description: {
    en: "Different careers",
    es: "Diferentes carreras"
  },
  color: "#3B82F6",
  position: {
    row: 7,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-16-1",
    title: {
      en: "Career Words",
      es: "Trabajos - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for jobs & professions",
      es: "Aprende vocabulario clave para trabajos"
    },
    xpRequired: 2850,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "jobs and professions",
        focusPoints: ["médico/a, profesor/a, ingeniero/a", "abogado/a, cocinero/a, dependiente/a", "la empresa, la oficina, el horario"]
      },
      grammar: {
        topic: "talking about work",
        focusPoints: ["ser + profession with no article (soy profesor)", "trabajar de / en / como", "¿a qué te dedicas?"]
      }
    }
  }, {
    id: "lesson-a2-16-2",
    title: {
      en: "What Do You Do?",
      es: "Trabajos - Práctica"
    },
    description: {
      en: "Practice jobs & professions in conversation",
      es: "Practica trabajos en conversación"
    },
    xpRequired: 2870,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about what you and others do for work",
        prompt: "Practice 'soy...', 'trabajo de/en...', and '¿a qué te dedicas?'"
      },
      stories: {
        topic: "different jobs",
        prompt: "Read about people's professions and discuss"
      }
    }
  }, {
    id: "lesson-a2-16-3",
    title: {
      en: "Dream Job",
      es: "Trabajos - Aplicación"
    },
    description: {
      en: "Apply jobs & professions skills",
      es: "Aplica habilidades de trabajos"
    },
    xpRequired: 2890,
    xpReward: 55,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["dream"], ["job"]],
    content: {
      reading: {
        topic: "job profiles and personal interests",
        prompt: "Read two job profiles and identify which one matches a person's interests and why"
      },
      realtime: {
        scenario: "explaining what would make a job fulfilling",
        prompt: "Describe a dream job and explain the tasks, workplace, and qualities you want"
      }
    }
  }, {
    id: "lesson-a2-16-quiz",
    title: {
      en: "Jobs & Professions Quiz",
      es: "Prueba de Trabajos"
    },
    description: {
      en: "Test your knowledge of jobs & professions",
      es: "Prueba tus conocimientos de trabajos"
    },
    xpRequired: 2910,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "jobs and professions",
        focusPoints: ["médico, profesor, ingeniero", "abogado, cocinero, dependiente"]
      },
      grammar: {
        topics: ["talking about work"],
        focusPoints: ["ser + profession (no article)", "trabajar de/en/como"]
      }
    }
  }]
}, {
  id: "unit-a2-17",
  title: {
    en: "School & Education",
    es: "Escuela"
  },
  description: {
    en: "Educational topics",
    es: "Temas educativos"
  },
  color: "#F59E0B",
  position: {
    row: 8,
    offset: 0
  },
  lessons: [{
    id: "lesson-a2-17-1",
    title: {
      en: "In the Classroom",
      es: "Escuela - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for school & education",
      es: "Aprende vocabulario clave para escuela"
    },
    xpRequired: 2950,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "school and education",
        focusPoints: ["la clase, el examen, la asignatura", "el/la profesor/a, el/la alumno/a, los deberes", "el horario, la nota, la carrera"]
      },
      grammar: {
        topic: "talking about studies",
        focusPoints: ["estudiar, aprender, aprobar/suspender", "tener que + infinitive (tengo que estudiar)", "school routine in the present"]
      }
    }
  }, {
    id: "lesson-a2-17-2",
    title: {
      en: "School Life",
      es: "Escuela - Práctica"
    },
    description: {
      en: "Practice school & education in conversation",
      es: "Practica escuela en conversación"
    },
    xpRequired: 2970,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about your studies and timetable",
        prompt: "Practice school vocabulary with 'estudio...' and 'tengo que...'"
      },
      stories: {
        topic: "a school day",
        prompt: "Read about a student's day and discuss the subjects"
      }
    }
  }, {
    id: "lesson-a2-17-3",
    title: {
      en: "Learning Journey",
      es: "Escuela - Aplicación"
    },
    description: {
      en: "Apply school & education skills",
      es: "Aplica habilidades de escuela"
    },
    xpRequired: 2990,
    xpReward: 35,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["learning", "learner"], ["progress", "goal"]],
    content: {
      reading: {
        topic: "a learner's progress and next steps",
        prompt: "Read a learner progress note and identify strengths, challenges, and the next goal"
      },
      realtime: {
        scenario: "reflecting on progress and planning what to study next",
        prompt: "Describe your learning progress and set one specific study goal"
      }
    }
  }, {
    id: "lesson-a2-17-quiz",
    title: {
      en: "School & Education Quiz",
      es: "Prueba de Escuela"
    },
    description: {
      en: "Test your knowledge of school & education",
      es: "Prueba tus conocimientos de escuela"
    },
    xpRequired: 3010,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "school and education",
        focusPoints: ["clase, examen, asignatura", "profesor, alumno, deberes, nota"]
      },
      grammar: {
        topics: ["talking about studies"],
        focusPoints: ["estudiar, aprobar/suspender", "tener que + infinitive"]
      }
    }
  }]
}, {
  id: "unit-a2-18",
  title: {
    en: "Technology Basics",
    es: "Tecnología"
  },
  description: {
    en: "Digital life",
    es: "Vida digital"
  },
  color: "#8B5CF6",
  position: {
    row: 8,
    offset: 1
  },
  lessons: [{
    id: "lesson-a2-18-1",
    title: {
      en: "Digital Devices",
      es: "Tecnología - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for technology basics",
      es: "Aprende vocabulario clave para tecnología"
    },
    xpRequired: 3050,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "basic technology vocabulary",
        focusPoints: ["el móvil/celular, el ordenador/computadora", "internet, la aplicación, el correo", "la contraseña, la pantalla, el archivo"]
      },
      grammar: {
        topic: "talking about using technology",
        focusPoints: ["usar, descargar, enviar, navegar", "common verbs for online actions", "present tense for habits"]
      }
    }
  }, {
    id: "lesson-a2-18-2",
    title: {
      en: "Using Technology",
      es: "Tecnología - Práctica"
    },
    description: {
      en: "Practice technology basics in conversation",
      es: "Practica tecnología en conversación"
    },
    xpRequired: 3070,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "explaining how you use your phone day to day",
        prompt: "Practice tech vocabulary with 'uso...', 'envío...', 'descargo...'"
      },
      stories: {
        topic: "technology in daily life",
        prompt: "Read about how someone uses technology and discuss"
      }
    }
  }, {
    id: "lesson-a2-18-3",
    title: {
      en: "Connected Life",
      es: "Tecnología - Aplicación"
    },
    description: {
      en: "Apply technology basics skills",
      es: "Aplica habilidades de tecnología"
    },
    xpRequired: 3090,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "everyday technology",
        prompt: "Read about apps and devices and notice the action verbs"
      },
      realtime: {
        scenario: "helping a friend with a device",
        prompt: "Demonstrate tech vocabulary with verbs for online actions"
      }
    }
  }, {
    id: "lesson-a2-18-quiz",
    title: {
      en: "Technology Basics Quiz",
      es: "Prueba de Tecnología"
    },
    description: {
      en: "Test your knowledge of technology basics",
      es: "Prueba tus conocimientos de tecnología"
    },
    xpRequired: 3110,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "technology basics",
        focusPoints: ["móvil/celular, ordenador/computadora", "internet, aplicación, correo, contraseña"]
      },
      grammar: {
        topics: ["talking about using technology"],
        focusPoints: ["usar, descargar, enviar, navegar"]
      }
    }
  }]
}];
