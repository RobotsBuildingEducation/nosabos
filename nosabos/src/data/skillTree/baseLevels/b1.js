// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-b1-1",
  title: {
    en: "Present Perfect",
    es: "Pretérito Perfecto"
  },
  description: {
    en: "Have done",
    es: "He hecho"
  },
  color: "#22C55E",
  position: {
    row: 0,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-1-1",
    title: {
      en: "Have You Ever?",
      es: "Pretérito Perfecto - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for present perfect",
      es: "Aprende vocabulario clave para pretérito perfecto"
    },
    xpRequired: 3150,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the present perfect (pretérito perfecto)",
        focusPoints: ["he/has/ha + participle", "irregular participles: hecho, dicho, visto, escrito", "markers: ya, todavía no, alguna vez, nunca"]
      },
      grammar: {
        topic: "forming and using the present perfect",
        focusPoints: ["haber (he, has, ha, hemos, han) + participle", "regular participles: hablado, comido, vivido", "for recent past and life experiences"]
      }
    }
  }, {
    id: "lesson-b1-1-2",
    title: {
      en: "Life Experiences",
      es: "Pretérito Perfecto - Práctica"
    },
    description: {
      en: "Practice present perfect in conversation",
      es: "Practica pretérito perfecto en conversación"
    },
    xpRequired: 3175,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "telling a friend what you have done today",
        prompt: "Practice the present perfect with 'ya', 'todavía no', and 'esta semana'"
      },
      stories: {
        topic: "life experiences with the present perfect",
        prompt: "Read about someone's experiences ('he viajado a...') and discuss"
      }
    }
  }, {
    id: "lesson-b1-1-3",
    title: {
      en: "Achievements",
      es: "Pretérito Perfecto - Aplicación"
    },
    description: {
      en: "Apply present perfect skills",
      es: "Aplica habilidades de pretérito perfecto"
    },
    xpRequired: 3200,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "present perfect vs preterite",
        prompt: "Read and notice when to use 'he hecho' vs 'hice'"
      },
      realtime: {
        scenario: "asking about experiences (¿alguna vez has...?)",
        prompt: "Demonstrate the present perfect to ask and answer about experiences"
      }
    }
  }, {
    id: "lesson-b1-1-quiz",
    title: {
      en: "Present Perfect Quiz",
      es: "Prueba de Pretérito Perfecto"
    },
    description: {
      en: "Test your knowledge of present perfect",
      es: "Prueba tus conocimientos de pretérito perfecto"
    },
    xpRequired: 3225,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the present perfect and its time markers",
        focusPoints: ["ya, todavía no, alguna vez, nunca", "irregular participles"]
      },
      grammar: {
        topics: ["forming and using the present perfect"],
        focusPoints: ["haber + participle", "present perfect vs preterite"]
      }
    }
  }]
}, {
  id: "unit-b1-2",
  title: {
    en: "Past Continuous",
    es: "Pasado Continuo"
  },
  description: {
    en: "Was doing",
    es: "Estaba haciendo"
  },
  color: "#3B82F6",
  position: {
    row: 0,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-2-1",
    title: {
      en: "While It Was Happening",
      es: "Mientras Sucedía"
    },
    description: {
      en: "Learn key vocabulary for past continuous",
      es: "Aprende vocabulario clave para pasado continuo"
    },
    xpRequired: 3275,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the past continuous (estaba + gerundio)",
        focusPoints: ["estaba hablando, estabas comiendo", "gerunds: -ando / -iendo", "irregular gerunds: leyendo, durmiendo, pidiendo"]
      },
      grammar: {
        topic: "describing past actions in progress",
        focusPoints: ["estar (imperfect) + gerund", "mientras + past continuous", "interrupted actions: estaba... cuando..."]
      }
    }
  }, {
    id: "lesson-b1-2-2",
    title: {
      en: "Background Actions",
      es: "Acciones de Fondo"
    },
    description: {
      en: "Practice past continuous in conversation",
      es: "Practica pasado continuo en conversación"
    },
    xpRequired: 3300,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing what you were doing when something happened",
        prompt: "Practice 'estaba ...ando cuando...' for interrupted past actions"
      },
      stories: {
        topic: "setting a scene in the past",
        prompt: "Read a story and notice background actions ('llovía, la gente caminaba')"
      }
    }
  }, {
    id: "lesson-b1-2-3",
    title: {
      en: "Setting the Scene",
      es: "Ambientando la Escena"
    },
    description: {
      en: "Apply past continuous skills",
      es: "Aplica habilidades de pasado continuo"
    },
    xpRequired: 3325,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "past continuous vs preterite in narration",
        prompt: "Read and tell ongoing background (estaba) from completed events (hizo)"
      },
      realtime: {
        scenario: "recounting an interrupted moment",
        prompt: "Demonstrate the past continuous to narrate what was happening"
      }
    }
  }, {
    id: "lesson-b1-2-quiz",
    title: {
      en: "Past Continuous Quiz",
      es: "Prueba de Pasado Continuo"
    },
    description: {
      en: "Test your knowledge of past continuous",
      es: "Prueba tus conocimientos de pasado continuo"
    },
    xpRequired: 3350,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the past continuous",
        focusPoints: ["estaba + gerundio", "irregular gerunds"]
      },
      grammar: {
        topics: ["past continuous vs preterite"],
        focusPoints: ["estar (imperfect) + gerund", "mientras / cuando"]
      }
    }
  }]
}, {
  id: "unit-b1-3",
  title: {
    en: "Future Tense",
    es: "Futuro"
  },
  description: {
    en: "Will do",
    es: "Haré"
  },
  color: "#F59E0B",
  position: {
    row: 1,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-3-1",
    title: {
      en: "Tomorrow's World",
      es: "Futuro - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for future tense",
      es: "Aprende vocabulario clave para futuro"
    },
    xpRequired: 3400,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the simple future tense",
        focusPoints: ["hablaré, comerás, vivirá", "irregular stems: tendré, haré, podré, saldré", "markers: mañana, el año que viene, pronto"]
      },
      grammar: {
        topic: "forming the future and expressing probability",
        focusPoints: ["infinitive + é/ás/á/emos/án", "future of probability (¿qué hora será?)", "ir a + infinitive vs simple future"]
      }
    }
  }, {
    id: "lesson-b1-3-2",
    title: {
      en: "Predictions",
      es: "Futuro - Práctica"
    },
    description: {
      en: "Practice future tense in conversation",
      es: "Practica futuro en conversación"
    },
    xpRequired: 3425,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "making plans and predictions for next year",
        prompt: "Practice the future for plans ('viajaré') and predictions ('lloverá')"
      },
      stories: {
        topic: "predictions and resolutions",
        prompt: "Read about future plans and discuss what will happen"
      }
    }
  }, {
    id: "lesson-b1-3-3",
    title: {
      en: "Future Possibilities",
      es: "Futuro - Aplicación"
    },
    description: {
      en: "Apply future tense skills",
      es: "Aplica habilidades de futuro"
    },
    xpRequired: 3450,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "future tense vs 'ir a + infinitive'",
        prompt: "Read and compare 'iré' vs 'voy a ir'"
      },
      realtime: {
        scenario: "speculating about the future",
        prompt: "Demonstrate the future for plans, predictions, and probability"
      }
    }
  }, {
    id: "lesson-b1-3-quiz",
    title: {
      en: "Future Tense Quiz",
      es: "Prueba de Futuro"
    },
    description: {
      en: "Test your knowledge of future tense",
      es: "Prueba tus conocimientos de futuro"
    },
    xpRequired: 3475,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the simple future",
        focusPoints: ["regular endings é/ás/á", "irregular stems: tendré, haré, podré"]
      },
      grammar: {
        topics: ["forming and using the future"],
        focusPoints: ["future of probability", "ir a + infinitive vs future"]
      }
    }
  }]
}, {
  id: "unit-b1-4",
  title: {
    en: "Comparisons",
    es: "Comparaciones"
  },
  description: {
    en: "More, less, equal",
    es: "Más, menos, igual"
  },
  color: "#8B5CF6",
  position: {
    row: 1,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-4-1",
    title: {
      en: "Better or Worse",
      es: "Mejor o Peor"
    },
    description: {
      en: "Learn key vocabulary for comparisons",
      es: "Aprende vocabulario clave para comparaciones"
    },
    xpRequired: 3525,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "comparatives and superlatives",
        focusPoints: ["más/menos ... que", "tan ... como, tanto ... como", "el/la más ... de"]
      },
      grammar: {
        topic: "forming comparisons",
        focusPoints: ["irregulars: mejor, peor, mayor, menor", "superlative -ísimo (buenísimo)", "equality vs inequality"]
      }
    }
  }, {
    id: "lesson-b1-4-2",
    title: {
      en: "Making Comparisons",
      es: "Haciendo Comparaciones"
    },
    description: {
      en: "Practice comparisons in conversation",
      es: "Practica comparaciones en conversación"
    },
    xpRequired: 3550,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "comparing two cities you have lived in",
        prompt: "Practice 'más/menos... que' and 'tan... como' to compare"
      },
      stories: {
        topic: "comparisons in descriptions",
        prompt: "Read a comparison of two options and discuss"
      }
    }
  }, {
    id: "lesson-b1-4-3",
    title: {
      en: "Superlatives",
      es: "Superlativos"
    },
    description: {
      en: "Apply comparisons skills",
      es: "Aplica habilidades de comparaciones"
    },
    xpRequired: 3575,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "nuances of comparison",
        prompt: "Read and notice equality vs inequality comparisons"
      },
      realtime: {
        scenario: "deciding between two options out loud",
        prompt: "Demonstrate comparatives and superlatives to weigh choices"
      }
    }
  }, {
    id: "lesson-b1-4-quiz",
    title: {
      en: "Comparisons Quiz",
      es: "Prueba de Comparaciones"
    },
    description: {
      en: "Test your knowledge of comparisons",
      es: "Prueba tus conocimientos de comparaciones"
    },
    xpRequired: 3600,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "comparatives and superlatives",
        focusPoints: ["más/menos que, tan como", "el más / -ísimo"]
      },
      grammar: {
        topics: ["forming comparisons"],
        focusPoints: ["irregulars: mejor, peor, mayor, menor"]
      }
    }
  }]
}, {
  id: "unit-b1-5",
  title: {
    en: "Giving Advice",
    es: "Dar Consejos"
  },
  description: {
    en: "Should, must",
    es: "Debería, debe"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-5-1",
    title: {
      en: "Should and Shouldn't",
      es: "Deberías y No Deberías"
    },
    description: {
      en: "Learn key vocabulary for giving advice",
      es: "Aprende vocabulario clave para dar consejos"
    },
    xpRequired: 3650,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "language for giving advice",
        focusPoints: ["deberías / tendrías que / podrías", "te recomiendo / te aconsejo que", "lo mejor es que + subjunctive"]
      },
      grammar: {
        topic: "advice structures",
        focusPoints: ["conditional for soft advice (deberías)", "recomendar/aconsejar que + subjunctive", "¿por qué no + present?"]
      }
    }
  }, {
    id: "lesson-b1-5-2",
    title: {
      en: "Helpful Suggestions",
      es: "Sugerencias Útiles"
    },
    description: {
      en: "Practice giving advice in conversation",
      es: "Practica dar consejos en conversación"
    },
    xpRequired: 3675,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "a friend asks you for advice about a problem",
        prompt: "Practice giving advice with 'deberías' and 'te recomiendo que'"
      },
      stories: {
        topic: "advice columns",
        prompt: "Read an advice exchange and discuss the suggestions"
      }
    }
  }, {
    id: "lesson-b1-5-3",
    title: {
      en: "Problem Solving",
      es: "Resolviendo Problemas"
    },
    description: {
      en: "Apply giving advice skills",
      es: "Aplica habilidades de dar consejos"
    },
    xpRequired: 3700,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "direct vs softened advice",
        prompt: "Read and compare 'haz esto' vs 'yo que tú, haría esto'"
      },
      realtime: {
        scenario: "helping someone make a decision",
        prompt: "Demonstrate advice using conditional and subjunctive forms"
      }
    }
  }, {
    id: "lesson-b1-5-quiz",
    title: {
      en: "Giving Advice Quiz",
      es: "Prueba de Dar Consejos"
    },
    description: {
      en: "Test your knowledge of giving advice",
      es: "Prueba tus conocimientos de dar consejos"
    },
    xpRequired: 3725,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "giving advice",
        focusPoints: ["deberías, tendrías que, podrías", "te recomiendo que + subjunctive"]
      },
      grammar: {
        topics: ["advice structures"],
        focusPoints: ["conditional for advice", "recomendar que + subjunctive"]
      }
    }
  }]
}, {
  id: "unit-b1-6",
  title: {
    en: "Making Suggestions",
    es: "Hacer Sugerencias"
  },
  description: {
    en: "Let's, why don't we",
    es: "Vamos, por qué no"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-6-1",
    title: {
      en: "Why Don't We?",
      es: "¿Por Qué No?"
    },
    description: {
      en: "Learn key vocabulary for making suggestions",
      es: "Aprende vocabulario clave para hacer sugerencias"
    },
    xpRequired: 3775,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "language for making suggestions",
        focusPoints: ["¿por qué no...? / ¿qué tal si...?", "podríamos / deberíamos", "¿te parece si...? / vamos a..."]
      },
      grammar: {
        topic: "suggestion structures",
        focusPoints: ["nosotros suggestions (vamos a, podríamos)", "¿qué tal si + present?", "hay que + infinitive for general advice"]
      }
    }
  }, {
    id: "lesson-b1-6-2",
    title: {
      en: "Let's Try This",
      es: "Intentemos Esto"
    },
    description: {
      en: "Practice making suggestions in conversation",
      es: "Practica hacer sugerencias en conversación"
    },
    xpRequired: 3800,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "planning a weekend with friends",
        prompt: "Practice suggesting plans with '¿qué tal si...?' and 'podríamos'"
      },
      stories: {
        topic: "suggesting and agreeing on plans",
        prompt: "Read a chat where friends make plans and discuss"
      }
    }
  }, {
    id: "lesson-b1-6-3",
    title: {
      en: "Collaborative Ideas",
      es: "Ideas Colaborativas"
    },
    description: {
      en: "Apply making suggestions skills",
      es: "Aplica habilidades de hacer sugerencias"
    },
    xpRequired: 3825,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "accepting and declining suggestions",
        prompt: "Read and notice how people accept ('¡vale!') or decline politely"
      },
      realtime: {
        scenario: "negotiating a group plan",
        prompt: "Demonstrate making, accepting, and declining suggestions"
      }
    }
  }, {
    id: "lesson-b1-6-quiz",
    title: {
      en: "Making Suggestions Quiz",
      es: "Prueba de Hacer Sugerencias"
    },
    description: {
      en: "Test your knowledge of making suggestions",
      es: "Prueba tus conocimientos de hacer sugerencias"
    },
    xpRequired: 3850,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "making suggestions",
        focusPoints: ["¿por qué no...?, ¿qué tal si...?", "podríamos, vamos a"]
      },
      grammar: {
        topics: ["suggestion structures"],
        focusPoints: ["nosotros suggestions", "¿qué tal si + present?"]
      }
    }
  }]
}, {
  id: "unit-b1-7",
  title: {
    en: "Conditional Would",
    es: "Condicional"
  },
  description: {
    en: "I would...",
    es: "Yo haría..."
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-7-1",
    title: {
      en: "If I Were You",
      es: "Condicional - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for conditional would",
      es: "Aprende vocabulario clave para condicional"
    },
    xpRequired: 3900,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the simple conditional (would)",
        focusPoints: ["hablaría, comerías, viviría", "irregular stems: tendría, haría, podría", "me gustaría, ¿podrías?"]
      },
      grammar: {
        topic: "forming and using the conditional",
        focusPoints: ["infinitive + ía endings", "irregular stems (same as future)", "for politeness and hypotheticals"]
      }
    }
  }, {
    id: "lesson-b1-7-2",
    title: {
      en: "Hypothetical Situations",
      es: "Condicional - Práctica"
    },
    description: {
      en: "Practice conditional would in conversation",
      es: "Practica condicional en conversación"
    },
    xpRequired: 3925,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "making polite requests at a hotel",
        prompt: "Practice '¿podría...?' and 'me gustaría...' for polite requests"
      },
      stories: {
        topic: "what would you do? (hypotheticals)",
        prompt: "Read about a dilemma and discuss what you would do"
      }
    }
  }, {
    id: "lesson-b1-7-3",
    title: {
      en: "Imagining Possibilities",
      es: "Condicional - Aplicación"
    },
    description: {
      en: "Apply conditional would skills",
      es: "Aplica habilidades de condicional"
    },
    xpRequired: 3950,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "conditional for advice and wishes",
        prompt: "Read and notice 'yo que tú, ...' and 'me encantaría...'"
      },
      realtime: {
        scenario: "giving polite advice (yo en tu lugar...)",
        prompt: "Demonstrate the conditional for politeness, wishes, and advice"
      }
    }
  }, {
    id: "lesson-b1-7-quiz",
    title: {
      en: "Conditional Would Quiz",
      es: "Prueba de Condicional"
    },
    description: {
      en: "Test your knowledge of conditional would",
      es: "Prueba tus conocimientos de condicional"
    },
    xpRequired: 3975,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the conditional",
        focusPoints: ["regular -ía endings", "irregular stems: tendría, haría, podría"]
      },
      grammar: {
        topics: ["forming and using the conditional"],
        focusPoints: ["politeness (¿podrías?)", "hypotheticals (yo que tú)"]
      }
    }
  }]
}, {
  id: "unit-b1-8",
  title: {
    en: "Travel & Tourism",
    es: "Viajes y Turismo"
  },
  description: {
    en: "Traveling abroad",
    es: "Viajar al extranjero"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-8-1",
    title: {
      en: "Trip Planning",
      es: "Planeando Viajes"
    },
    description: {
      en: "Learn key vocabulary for travel & tourism",
      es: "Aprende vocabulario clave para viajes y turismo"
    },
    xpRequired: 4025,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "travel and tourism vocabulary",
        focusPoints: ["el vuelo, la maleta, el pasaporte", "el alojamiento, la reserva, el billete/boleto", "la aduana, el embarque"]
      },
      grammar: {
        topic: "language for getting around",
        focusPoints: ["asking directions: ¿cómo llego a...?", "polite requests at a counter", "prepositions of place and movement"]
      }
    }
  }, {
    id: "lesson-b1-8-2",
    title: {
      en: "Booking a Trip",
      es: "Reservando un Viaje"
    },
    description: {
      en: "Practice travel & tourism in conversation",
      es: "Practica viajes y turismo en conversación"
    },
    xpRequired: 4050,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "checking in at the airport and asking about your flight",
        prompt: "Practice travel phrases for check-in, gates, and delays"
      },
      stories: {
        topic: "a travel anecdote",
        prompt: "Read a short trip story and discuss what happened"
      }
    }
  }, {
    id: "lesson-b1-8-3",
    title: {
      en: "Adventure Awaits",
      es: "La Aventura Espera"
    },
    description: {
      en: "Apply travel & tourism skills",
      es: "Aplica habilidades de viajes y turismo"
    },
    xpRequired: 4075,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "bookings and itineraries",
        prompt: "Read a hotel or flight confirmation and find the key details"
      },
      realtime: {
        scenario: "booking a room and asking about the area",
        prompt: "Demonstrate travel vocabulary to book and ask for recommendations"
      }
    }
  }, {
    id: "lesson-b1-8-quiz",
    title: {
      en: "Travel & Tourism Quiz",
      es: "Prueba de Viajes y Turismo"
    },
    description: {
      en: "Test your knowledge of travel & tourism",
      es: "Prueba tus conocimientos de viajes y turismo"
    },
    xpRequired: 4100,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "travel and tourism",
        focusPoints: ["vuelo, maleta, pasaporte, reserva", "billete/boleto, alojamiento"]
      },
      grammar: {
        topics: ["language for getting around"],
        focusPoints: ["asking directions", "polite requests at a counter"]
      }
    }
  }]
}, {
  id: "unit-b1-9",
  title: {
    en: "Environment",
    es: "Medio Ambiente"
  },
  description: {
    en: "Nature and ecology",
    es: "Naturaleza y ecología"
  },
  color: "#F97316",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-9-1",
    title: {
      en: "Our Planet",
      es: "Nuestro Planeta"
    },
    description: {
      en: "Learn key vocabulary for environment",
      es: "Aprende vocabulario clave para medio ambiente"
    },
    xpRequired: 4150,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "environment and sustainability vocabulary",
        focusPoints: ["el medio ambiente, el cambio climático", "el reciclaje, la contaminación, los residuos", "la energía renovable, sostenible"]
      },
      grammar: {
        topic: "talking about problems and solutions",
        focusPoints: ["impersonal se (se debería reciclar)", "hay que / es necesario + infinitive", "cause-and-effect connectors"]
      }
    }
  }, {
    id: "lesson-b1-9-2",
    title: {
      en: "Going Green",
      es: "Siendo Ecológico"
    },
    description: {
      en: "Practice environment in conversation",
      es: "Practica medio ambiente en conversación"
    },
    xpRequired: 4175,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "discussing how to be greener at home",
        prompt: "Practice environment vocabulary and 'deberíamos / hay que' for solutions"
      },
      stories: {
        topic: "an environmental news story",
        prompt: "Read about a local environmental issue and discuss"
      }
    }
  }, {
    id: "lesson-b1-9-3",
    title: {
      en: "Saving Earth",
      es: "Salvando la Tierra"
    },
    description: {
      en: "Apply environment skills",
      es: "Aplica habilidades de medio ambiente"
    },
    xpRequired: 4200,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "environmental problems and proposals",
        prompt: "Read an article and identify the problem and proposed solutions"
      },
      realtime: {
        scenario: "debating a green policy",
        prompt: "Demonstrate environment vocabulary to argue for a solution"
      }
    }
  }, {
    id: "lesson-b1-9-quiz",
    title: {
      en: "Environment Quiz",
      es: "Prueba de Medio Ambiente"
    },
    description: {
      en: "Test your knowledge of environment",
      es: "Prueba tus conocimientos de medio ambiente"
    },
    xpRequired: 4225,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "environment and sustainability",
        focusPoints: ["medio ambiente, cambio climático", "reciclaje, contaminación, energía renovable"]
      },
      grammar: {
        topics: ["problems and solutions"],
        focusPoints: ["impersonal se", "hay que / es necesario + infinitive"]
      }
    }
  }]
}, {
  id: "unit-b1-10",
  title: {
    en: "Culture & Traditions",
    es: "Cultura y Tradiciones"
  },
  description: {
    en: "Cultural practices",
    es: "Prácticas culturales"
  },
  color: "#84CC16",
  position: {
    row: 4,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-10-1",
    title: {
      en: "Cultural Heritage",
      es: "Patrimonio Cultural"
    },
    description: {
      en: "Learn key vocabulary for culture & traditions",
      es: "Aprende vocabulario clave para cultura y tradiciones"
    },
    xpRequired: 4275,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "culture and traditions vocabulary",
        focusPoints: ["la tradición, la costumbre, la fiesta", "el festival, el desfile, la gastronomía", "celebrar, festejar, disfrazarse"]
      },
      grammar: {
        topic: "describing customs and habits",
        focusPoints: ["soler + infinitive (solemos celebrar)", "se + verb for general customs", "frequency expressions (cada año, suele)"]
      }
    }
  }, {
    id: "lesson-b1-10-2",
    title: {
      en: "Customs and Festivals",
      es: "Costumbres y Festivales"
    },
    description: {
      en: "Practice culture & traditions in conversation",
      es: "Practica cultura y tradiciones en conversación"
    },
    xpRequired: 4300,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "explaining a holiday from your country",
        prompt: "Practice describing a celebration with 'solemos' and 'se celebra'"
      },
      stories: {
        topic: "a traditional festival",
        prompt: "Read about a festival and discuss its customs"
      }
    }
  }, {
    id: "lesson-b1-10-3",
    title: {
      en: "Celebrating Diversity",
      es: "Celebrando la Diversidad"
    },
    description: {
      en: "Apply culture & traditions skills",
      es: "Aplica habilidades de cultura y tradiciones"
    },
    xpRequired: 4325,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "comparing traditions",
        prompt: "Read about two celebrations and compare them"
      },
      realtime: {
        scenario: "inviting someone to a celebration and explaining it",
        prompt: "Demonstrate culture vocabulary to describe a tradition"
      }
    }
  }, {
    id: "lesson-b1-10-quiz",
    title: {
      en: "Culture & Traditions Quiz",
      es: "Prueba de Cultura y Tradiciones"
    },
    description: {
      en: "Test your knowledge of culture & traditions",
      es: "Prueba tus conocimientos de cultura y tradiciones"
    },
    xpRequired: 4350,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "culture and traditions",
        focusPoints: ["tradición, costumbre, fiesta, festival", "gastronomía, desfile"]
      },
      grammar: {
        topics: ["describing customs and habits"],
        focusPoints: ["soler + infinitive", "se for general customs"]
      }
    }
  }]
}, {
  id: "unit-b1-11",
  title: {
    en: "Media & News",
    es: "Medios y Noticias"
  },
  description: {
    en: "News and media",
    es: "Noticias y medios"
  },
  color: "#14B8A6",
  position: {
    row: 5,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-11-1",
    title: {
      en: "Headlines",
      es: "Titulares"
    },
    description: {
      en: "Learn key vocabulary for media & news",
      es: "Aprende vocabulario clave para medios y noticias"
    },
    xpRequired: 4400,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "media and news vocabulary",
        focusPoints: ["las noticias, el titular, el reportaje", "el periódico, la entrevista, la fuente", "las redes sociales, los medios"]
      },
      grammar: {
        topic: "reporting what you read or heard",
        focusPoints: ["según + source (según el periódico)", "reported speech basics (dice que...)", "expressing certainty and doubt"]
      }
    }
  }, {
    id: "lesson-b1-11-2",
    title: {
      en: "Current Events",
      es: "Eventos Actuales"
    },
    description: {
      en: "Practice media & news in conversation",
      es: "Practica medios y noticias en conversación"
    },
    xpRequired: 4425,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "discussing a news story you saw",
        prompt: "Practice talking about the news with 'según...' and 'dicen que...'"
      },
      stories: {
        topic: "a short news article",
        prompt: "Read a headline and summary and discuss the story"
      }
    }
  }, {
    id: "lesson-b1-11-3",
    title: {
      en: "Informed Citizen",
      es: "Ciudadano Informado"
    },
    description: {
      en: "Apply media & news skills",
      es: "Aplica habilidades de medios y noticias"
    },
    xpRequired: 4450,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "fact vs opinion in the news",
        prompt: "Read an article and separate facts from opinions"
      },
      realtime: {
        scenario: "reacting to current events",
        prompt: "Demonstrate media vocabulary to report and react to news"
      }
    }
  }, {
    id: "lesson-b1-11-quiz",
    title: {
      en: "Media & News Quiz",
      es: "Prueba de Medios y Noticias"
    },
    description: {
      en: "Test your knowledge of media & news",
      es: "Prueba tus conocimientos de medios y noticias"
    },
    xpRequired: 4475,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "media and news",
        focusPoints: ["noticias, titular, reportaje", "redes sociales, fuente, medios"]
      },
      grammar: {
        topics: ["reporting what you heard"],
        focusPoints: ["según + source", "dice que..."]
      }
    }
  }]
}, {
  id: "unit-b1-12",
  title: {
    en: "Expressing Opinions",
    es: "Expresar Opiniones"
  },
  description: {
    en: "I think that...",
    es: "Creo que..."
  },
  color: "#A855F7",
  position: {
    row: 5,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-12-1",
    title: {
      en: "I Think That...",
      es: "Creo Que..."
    },
    description: {
      en: "Learn key vocabulary for expressing opinions",
      es: "Aprende vocabulario clave para expresar opiniones"
    },
    xpRequired: 4525,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "expressing and reacting to opinions",
        focusPoints: ["creo que, pienso que, me parece que", "en mi opinión, desde mi punto de vista", "estoy de acuerdo / en contra"]
      },
      grammar: {
        topic: "opinion structures",
        focusPoints: ["creo que + indicative", "no creo que + subjunctive", "agreeing and disagreeing politely"]
      }
    }
  }, {
    id: "lesson-b1-12-2",
    title: {
      en: "Sharing Views",
      es: "Compartiendo Puntos de Vista"
    },
    description: {
      en: "Practice expressing opinions in conversation",
      es: "Practica expresar opiniones en conversación"
    },
    xpRequired: 4550,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "sharing opinions about a film with a friend",
        prompt: "Practice giving opinions and (dis)agreeing politely"
      },
      stories: {
        topic: "opinions in a discussion",
        prompt: "Read a debate and identify each person's opinion"
      }
    }
  }, {
    id: "lesson-b1-12-3",
    title: {
      en: "Respectful Debate",
      es: "Debate Respetuoso"
    },
    description: {
      en: "Apply expressing opinions skills",
      es: "Aplica habilidades de expresar opiniones"
    },
    xpRequired: 4575,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "supporting an opinion with reasons",
        prompt: "Read an opinion and find the reasons given"
      },
      realtime: {
        scenario: "a friendly disagreement",
        prompt: "Demonstrate giving, supporting, and challenging opinions"
      }
    }
  }, {
    id: "lesson-b1-12-quiz",
    title: {
      en: "Expressing Opinions Quiz",
      es: "Prueba de Expresar Opiniones"
    },
    description: {
      en: "Test your knowledge of expressing opinions",
      es: "Prueba tus conocimientos de expresar opiniones"
    },
    xpRequired: 4600,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "expressing opinions",
        focusPoints: ["creo que, me parece que, en mi opinión", "estoy de acuerdo / en contra"]
      },
      grammar: {
        topics: ["opinion structures"],
        focusPoints: ["creo que + indicative vs no creo que + subjunctive"]
      }
    }
  }]
}, {
  id: "unit-b1-13",
  title: {
    en: "Making Complaints",
    es: "Quejas"
  },
  description: {
    en: "Express dissatisfaction",
    es: "Expresar insatisfacción"
  },
  color: "#DB2777",
  position: {
    row: 6,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-13-1",
    title: {
      en: "Something's Wrong",
      es: "Quejas - Vocabulario"
    },
    description: {
      en: "Learn key vocabulary for making complaints",
      es: "Aprende vocabulario clave para quejas"
    },
    xpRequired: 4650,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "language for making a complaint",
        focusPoints: ["la queja, el reclamo, el reembolso", "no funciona, está roto, defectuoso", "devolver, cambiar, reclamar"]
      },
      grammar: {
        topic: "complaining politely",
        focusPoints: ["softeners: quería, me gustaría, ¿sería posible?", "usted register for service", "the problem + the request"]
      }
    }
  }, {
    id: "lesson-b1-13-2",
    title: {
      en: "I'm Not Satisfied",
      es: "Quejas - Práctica"
    },
    description: {
      en: "Practice making complaints in conversation",
      es: "Practica quejas en conversación"
    },
    xpRequired: 4675,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "returning a faulty product to a store",
        prompt: "Practice complaining politely and asking for a refund"
      },
      stories: {
        topic: "a complaint letter or review",
        prompt: "Read a complaint and discuss the issue and the request"
      }
    }
  }, {
    id: "lesson-b1-13-3",
    title: {
      en: "Resolving Issues",
      es: "Quejas - Aplicación"
    },
    description: {
      en: "Apply making complaints skills",
      es: "Aplica habilidades de quejas"
    },
    xpRequired: 4700,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "polite vs rude complaints",
        prompt: "Read two complaints and compare their tone"
      },
      realtime: {
        scenario: "complaining about a hotel room",
        prompt: "Demonstrate a polite, effective complaint"
      }
    }
  }, {
    id: "lesson-b1-13-quiz",
    title: {
      en: "Making Complaints Quiz",
      es: "Prueba de Quejas"
    },
    description: {
      en: "Test your knowledge of making complaints",
      es: "Prueba tus conocimientos de quejas"
    },
    xpRequired: 4725,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "making complaints",
        focusPoints: ["queja, reclamo, reembolso", "no funciona, defectuoso, devolver"]
      },
      grammar: {
        topics: ["complaining politely"],
        focusPoints: ["softeners: quería, me gustaría", "usted register"]
      }
    }
  }]
}, {
  id: "unit-b1-14",
  title: {
    en: "Experiences",
    es: "Experiencias"
  },
  description: {
    en: "Life experiences",
    es: "Experiencias de vida"
  },
  color: "#0EA5E9",
  position: {
    row: 6,
    offset: 1
  },
  lessons: [{
    id: "lesson-b1-14-1",
    title: {
      en: "Memorable Moments",
      es: "Momentos Memorables"
    },
    description: {
      en: "Learn key vocabulary for experiences",
      es: "Aprende vocabulario clave para experiencias"
    },
    xpRequired: 4775,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "talking about past experiences",
        focusPoints: ["alguna vez, nunca, una vez", "hace + time (hace dos años)", "he probado, he visitado"]
      },
      grammar: {
        topic: "narrating experiences",
        focusPoints: ["present perfect for life experiences", "preterite for specific past events", "sequencing: primero, luego, al final"]
      }
    }
  }, {
    id: "lesson-b1-14-2",
    title: {
      en: "Sharing Experiences",
      es: "Compartiendo Experiencias"
    },
    description: {
      en: "Practice experiences in conversation",
      es: "Practica experiencias en conversación"
    },
    xpRequired: 4800,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "swapping travel and life stories with a friend",
        prompt: "Practice '¿alguna vez has...?' and narrating what happened"
      },
      stories: {
        topic: "a memorable experience",
        prompt: "Read someone's account of an experience and discuss"
      }
    }
  }, {
    id: "lesson-b1-14-3",
    title: {
      en: "Learning from Life",
      es: "Aprendiendo de la Vida"
    },
    description: {
      en: "Apply experiences skills",
      es: "Aplica habilidades de experiencias"
    },
    xpRequired: 4825,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "ordering events in a story",
        prompt: "Read a narrative and follow its sequence of events"
      },
      realtime: {
        scenario: "telling the story of your best trip",
        prompt: "Demonstrate narrating an experience with linked past tenses"
      }
    }
  }, {
    id: "lesson-b1-14-quiz",
    title: {
      en: "Experiences Quiz",
      es: "Prueba de Experiencias"
    },
    description: {
      en: "Test your knowledge of experiences",
      es: "Prueba tus conocimientos de experiencias"
    },
    xpRequired: 4850,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "past experiences",
        focusPoints: ["alguna vez, nunca, una vez", "hace + time"]
      },
      grammar: {
        topics: ["narrating experiences"],
        focusPoints: ["present perfect vs preterite", "sequencing connectors"]
      }
    }
  }]
}, {
  id: "unit-b1-15",
  title: {
    en: "Probability",
    es: "Probabilidad"
  },
  description: {
    en: "Maybe, might",
    es: "Quizás, podría"
  },
  color: "#22C55E",
  position: {
    row: 7,
    offset: 0
  },
  lessons: [{
    id: "lesson-b1-15-1",
    title: {
      en: "Maybe and Perhaps",
      es: "Quizás y Tal Vez"
    },
    description: {
      en: "Learn key vocabulary for probability",
      es: "Aprende vocabulario clave para probabilidad"
    },
    xpRequired: 4900,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "expressing probability and possibility",
        focusPoints: ["quizás, tal vez, a lo mejor", "probablemente, seguramente", "es probable / posible que"]
      },
      grammar: {
        topic: "probability structures",
        focusPoints: ["quizás/tal vez + subjunctive", "a lo mejor + indicative", "deber de + infinitive (must be)"]
      }
    }
  }, {
    id: "lesson-b1-15-2",
    title: {
      en: "Likely or Unlikely",
      es: "Probable o Improbable"
    },
    description: {
      en: "Practice probability in conversation",
      es: "Practica probabilidad en conversación"
    },
    xpRequired: 4925,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "guessing why a friend is running late",
        prompt: "Practice 'quizás esté...', 'a lo mejor...', and 'debe de estar...'"
      },
      stories: {
        topic: "speculating about a mystery",
        prompt: "Read a puzzling situation and discuss what probably happened"
      }
    }
  }, {
    id: "lesson-b1-15-3",
    title: {
      en: "Making Predictions",
      es: "Haciendo Predicciones"
    },
    description: {
      en: "Apply probability skills",
      es: "Aplica habilidades de probabilidad"
    },
    xpRequired: 4950,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "degrees of certainty",
        prompt: "Read and rank how sure the writer is (seguramente vs quizás)"
      },
      realtime: {
        scenario: "predicting an uncertain outcome",
        prompt: "Demonstrate probability with the subjunctive and indicative"
      }
    }
  }, {
    id: "lesson-b1-15-quiz",
    title: {
      en: "Probability Quiz",
      es: "Prueba de Probabilidad"
    },
    description: {
      en: "Test your knowledge of probability",
      es: "Prueba tus conocimientos de probabilidad"
    },
    xpRequired: 4975,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "probability and possibility",
        focusPoints: ["quizás, tal vez, a lo mejor", "es probable que"]
      },
      grammar: {
        topics: ["probability structures"],
        focusPoints: ["quizás + subjunctive vs a lo mejor + indicative", "deber de + infinitive"]
      }
    }
  }]
}];
