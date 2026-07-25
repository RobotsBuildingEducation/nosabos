// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
export default [{
  id: "unit-a1-5",
  title: {
    en: "Days of Week",
    es: "Días de la Semana"
  },
  description: {
    en: "Learn the days",
    es: "Aprende los días"
  },
  color: "#EC4899",
  position: {
    row: 2,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-5-1",
    title: {
      en: "Monday to Sunday",
      es: "Lunes a Domingo"
    },
    description: {
      en: "Learn key vocabulary for days of week",
      es: "Aprende vocabulario clave para días de la semana"
    },
    xpRequired: 410,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the days of the week",
        focusPoints: ["lunes, martes, miércoles, jueves", "viernes, sábado, domingo", "hoy, mañana, ayer"]
      },
      grammar: {
        topic: "talking about days",
        focusPoints: ["el lunes (on Monday) vs los lunes (on Mondays)", "el fin de semana", "¿qué día es hoy?"]
      }
    }
  }, {
    id: "lesson-a1-5-2",
    title: {
      en: "What Day Is It?",
      es: "¿Qué Día Es?"
    },
    description: {
      en: "Practice days of week in conversation",
      es: "Practica días de la semana en conversación"
    },
    xpRequired: 425,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "planning which day to meet",
        prompt: "Practice the days of the week with 'el' and 'los'"
      },
      stories: {
        topic: "a weekly schedule",
        prompt: "Read a simple schedule and discuss what happens each day"
      }
    }
  }, {
    id: "lesson-a1-5-3",
    title: {
      en: "Planning Your Week",
      es: "Planificando Tu Semana"
    },
    description: {
      en: "Apply days of week skills",
      es: "Aplica habilidades de días de la semana"
    },
    xpRequired: 440,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "days and routines",
        prompt: "Read about a weekly routine and notice the days"
      },
      realtime: {
        scenario: "describing your typical week",
        prompt: "Demonstrate the days of the week to talk about your week"
      }
    }
  }, {
    id: "lesson-a1-5-quiz",
    title: {
      en: "Days of Week Quiz",
      es: "Prueba de Días de la Semana"
    },
    description: {
      en: "Test your knowledge of days of week",
      es: "Prueba tus conocimientos de días de la semana"
    },
    xpRequired: 455,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the days of the week",
        focusPoints: ["lunes a domingo", "hoy, mañana, ayer"]
      },
      grammar: {
        topics: ["talking about days"],
        focusPoints: ["el lunes vs los lunes", "¿qué día es hoy?"]
      }
    }
  }]
}, {
  id: "unit-a1-6",
  title: {
    en: "Months & Dates",
    es: "Meses y Fechas"
  },
  description: {
    en: "Calendar basics",
    es: "Conceptos del calendario"
  },
  color: "#10B981",
  position: {
    row: 2,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-6-1",
    title: {
      en: "Twelve Months",
      es: "Doce Meses"
    },
    description: {
      en: "Learn key vocabulary for months & dates",
      es: "Aprende vocabulario clave para meses y fechas"
    },
    xpRequired: 485,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "months and dates",
        focusPoints: ["enero, febrero, marzo... diciembre", "las estaciones: primavera, verano, otoño, invierno", "el cumpleaños"]
      },
      grammar: {
        topic: "saying the date",
        focusPoints: ["el + number + de + month (el 5 de mayo)", "¿qué fecha es hoy?", "¿cuándo es tu cumpleaños?"]
      }
    }
  }, {
    id: "lesson-a1-6-2",
    title: {
      en: "When's Your Birthday?",
      es: "¿Cuándo Es Tu Cumpleaños?"
    },
    description: {
      en: "Practice months & dates in conversation",
      es: "Practica meses y fechas en conversación"
    },
    xpRequired: 500,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "asking when someone's birthday is",
        prompt: "Practice months and dates: 'mi cumpleaños es el ... de ...'"
      },
      stories: {
        topic: "important dates and holidays",
        prompt: "Read about dates in the year and discuss them"
      }
    }
  }, {
    id: "lesson-a1-6-3",
    title: {
      en: "Important Dates",
      es: "Fechas Importantes"
    },
    description: {
      en: "Apply months & dates skills",
      es: "Aplica habilidades de meses y fechas"
    },
    xpRequired: 515,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "dates in invitations and plans",
        prompt: "Read an invitation and find the date"
      },
      realtime: {
        scenario: "scheduling an event by date",
        prompt: "Demonstrate months and dates to set a day"
      }
    }
  }, {
    id: "lesson-a1-6-quiz",
    title: {
      en: "Months & Dates Quiz",
      es: "Prueba de Meses y Fechas"
    },
    description: {
      en: "Test your knowledge of months & dates",
      es: "Prueba tus conocimientos de meses y fechas"
    },
    xpRequired: 530,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "months and dates",
        focusPoints: ["enero a diciembre", "las cuatro estaciones"]
      },
      grammar: {
        topics: ["saying the date"],
        focusPoints: ["el + número + de + mes", "¿qué fecha es hoy?"]
      }
    }
  }]
}, {
  id: "unit-a1-7",
  title: {
    en: "Telling Time",
    es: "Decir la Hora"
  },
  description: {
    en: "What time is it?",
    es: "¿Qué hora es?"
  },
  color: "#06B6D4",
  position: {
    row: 3,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-7-1",
    title: {
      en: "What Time Is It?",
      es: "¿Qué Hora Es?"
    },
    description: {
      en: "Learn key vocabulary for telling time",
      es: "Aprende vocabulario clave para decir la hora"
    },
    xpRequired: 560,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "telling the time",
        focusPoints: ["la hora, el minuto", "y cuarto, y media, menos cuarto", "de la mañana / de la tarde / de la noche"]
      },
      grammar: {
        topic: "asking and saying the time",
        focusPoints: ["¿qué hora es?", "es la una vs son las dos", "a las + time (a las tres)"]
      }
    }
  }, {
    id: "lesson-a1-7-2",
    title: {
      en: "Daily Schedule",
      es: "Horario Diario"
    },
    description: {
      en: "Practice telling time in conversation",
      es: "Practica decir la hora en conversación"
    },
    xpRequired: 575,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "asking what time a place opens",
        prompt: "Practice '¿qué hora es?' and 'a las...' for times"
      },
      stories: {
        topic: "a daily timetable",
        prompt: "Read a schedule with times and discuss it"
      }
    }
  }, {
    id: "lesson-a1-7-3",
    title: {
      en: "Making Appointments",
      es: "Haciendo Citas"
    },
    description: {
      en: "Apply telling time skills",
      es: "Aplica habilidades de decir la hora"
    },
    xpRequired: 590,
    xpReward: 55,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["appointment"], ["time", "schedule"]],
    content: {
      reading: {
        topic: "finding an available appointment time",
        prompt: "Read two schedules and identify a mutually available appointment time"
      },
      realtime: {
        scenario: "arranging and changing an appointment",
        prompt: "Arrange, confirm, and reschedule an appointment using dates and times"
      }
    }
  }, {
    id: "lesson-a1-7-quiz",
    title: {
      en: "Telling Time Quiz",
      es: "Prueba de Decir la Hora"
    },
    description: {
      en: "Test your knowledge of telling time",
      es: "Prueba tus conocimientos de decir la hora"
    },
    xpRequired: 605,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "telling the time",
        focusPoints: ["y cuarto, y media, menos cuarto", "de la mañana/tarde/noche"]
      },
      grammar: {
        topics: ["asking and saying the time"],
        focusPoints: ["es la una vs son las dos", "a las + hora"]
      }
    }
  }]
}, {
  id: "unit-a1-8",
  title: {
    en: "Family Members",
    es: "Familia"
  },
  description: {
    en: "Your family",
    es: "Tu familia"
  },
  color: "#EF4444",
  position: {
    row: 3,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-8-1",
    title: {
      en: "My Family Tree",
      es: "Mi Árbol Genealógico"
    },
    description: {
      en: "Learn key vocabulary for family members",
      es: "Aprende vocabulario clave para familia"
    },
    xpRequired: 635,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "family members",
        focusPoints: ["madre, padre, hermano, hermana", "abuelo/a, tío/a, primo/a", "hijo/a, esposo/a"]
      },
      grammar: {
        topic: "talking about your family",
        focusPoints: ["possessives: mi, tu, su, nuestro", "tener (tengo dos hermanos)", "gender and plural of family nouns"]
      }
    }
  }, {
    id: "lesson-a1-8-2",
    title: {
      en: "Talking About Family",
      es: "Hablando de la Familia"
    },
    description: {
      en: "Practice family members in conversation",
      es: "Practica familia en conversación"
    },
    xpRequired: 650,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "introducing your family to a friend",
        prompt: "Practice family words with 'mi/tu' and 'tener'"
      },
      stories: {
        topic: "a family description",
        prompt: "Read about someone's family and discuss the relationships"
      }
    }
  }, {
    id: "lesson-a1-8-3",
    title: {
      en: "Family Relationships",
      es: "Relaciones Familiares"
    },
    description: {
      en: "Apply family members skills",
      es: "Aplica habilidades de familia"
    },
    xpRequired: 665,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "family relationships",
        prompt: "Read a family tree description and identify who is who"
      },
      realtime: {
        scenario: "describing your own family",
        prompt: "Demonstrate family vocabulary with possessives and 'tener'"
      }
    }
  }, {
    id: "lesson-a1-8-quiz",
    title: {
      en: "Family Members Quiz",
      es: "Prueba de Familia"
    },
    description: {
      en: "Test your knowledge of family members",
      es: "Prueba tus conocimientos de familia"
    },
    xpRequired: 680,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "family members",
        focusPoints: ["madre, padre, hermano/a", "abuelos, tíos, primos"]
      },
      grammar: {
        topics: ["talking about your family"],
        focusPoints: ["possessives mi/tu/su", "tener + family"]
      }
    }
  }]
}, {
  id: "unit-a1-9",
  title: {
    en: "Colors & Shapes",
    es: "Colores y Formas"
  },
  description: {
    en: "Describe visually",
    es: "Describe visualmente"
  },
  color: "#F97316",
  position: {
    row: 4,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-9-1",
    title: {
      en: "Rainbow Colors",
      es: "Colores del Arcoíris"
    },
    description: {
      en: "Learn key vocabulary for colors & shapes",
      es: "Aprende vocabulario clave para colores y formas"
    },
    xpRequired: 710,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "colors and shapes",
        focusPoints: ["rojo, azul, verde, amarillo, negro, blanco", "el círculo, el cuadrado, el triángulo", "claro / oscuro"]
      },
      grammar: {
        topic: "describing things with colors",
        focusPoints: ["adjective agreement: rojo/roja, rojos/rojas", "noun + adjective order (la casa roja)", "¿de qué color es?"]
      }
    }
  }, {
    id: "lesson-a1-9-2",
    title: {
      en: "Describing Things",
      es: "Describiendo Cosas"
    },
    description: {
      en: "Practice colors & shapes in conversation",
      es: "Practica colores y formas en conversación"
    },
    xpRequired: 725,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing objects by color in a room",
        prompt: "Practice colors with agreement: 'la mesa es blanca'"
      },
      stories: {
        topic: "colors in descriptions",
        prompt: "Read a description and notice the colors and agreement"
      }
    }
  }, {
    id: "lesson-a1-9-3",
    title: {
      en: "Colors Everywhere",
      es: "Colores por Todas Partes"
    },
    description: {
      en: "Apply colors & shapes skills",
      es: "Aplica habilidades de colores y formas"
    },
    xpRequired: 740,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "colors and adjective agreement",
        prompt: "Read and match colors to nouns with the right ending"
      },
      realtime: {
        scenario: "describing what you are wearing by color",
        prompt: "Demonstrate colors with correct adjective agreement"
      }
    }
  }, {
    id: "lesson-a1-9-quiz",
    title: {
      en: "Colors & Shapes Quiz",
      es: "Prueba de Colores y Formas"
    },
    description: {
      en: "Test your knowledge of colors & shapes",
      es: "Prueba tus conocimientos de colores y formas"
    },
    xpRequired: 755,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "colors and shapes",
        focusPoints: ["rojo, azul, verde, amarillo", "círculo, cuadrado, triángulo"]
      },
      grammar: {
        topics: ["describing things with colors"],
        focusPoints: ["agreement rojo/roja", "¿de qué color es?"]
      }
    }
  }]
}, {
  id: "unit-a1-10",
  title: {
    en: "Food & Drinks",
    es: "Comida y Bebidas"
  },
  description: {
    en: "Basic food vocabulary",
    es: "Vocabulario de comida"
  },
  color: "#84CC16",
  position: {
    row: 4,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-10-1",
    title: {
      en: "Food Vocabulary",
      es: "Vocabulario de Comida"
    },
    description: {
      en: "Learn key vocabulary for food & drinks",
      es: "Aprende vocabulario clave para comida y bebidas"
    },
    xpRequired: 785,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "food and drinks",
        focusPoints: ["el pan, la fruta, la carne, el pescado", "el agua, el café, la leche, el zumo/jugo", "el desayuno, la comida, la cena"]
      },
      grammar: {
        topic: "talking about food you like and want",
        focusPoints: ["me gusta + singular / me gustan + plural", "quiero / quería + food", "el/la with food nouns"]
      }
    }
  }, {
    id: "lesson-a1-10-2",
    title: {
      en: "I'm Hungry!",
      es: "¡Tengo Hambre!"
    },
    description: {
      en: "Practice food & drinks in conversation",
      es: "Practica comida y bebidas en conversación"
    },
    xpRequired: 800,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "talking about what you eat for breakfast",
        prompt: "Practice food words with 'me gusta' and 'quiero'"
      },
      stories: {
        topic: "meals and eating habits",
        prompt: "Read about someone's meals and discuss"
      }
    }
  }, {
    id: "lesson-a1-10-3",
    title: {
      en: "My Favorite Foods",
      es: "Mis Comidas Favoritas"
    },
    description: {
      en: "Apply food & drinks skills",
      es: "Aplica habilidades de comida y bebidas"
    },
    xpRequired: 815,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "food preferences",
        prompt: "Read and notice 'me gusta' vs 'me gustan' with foods"
      },
      realtime: {
        scenario: "saying what you like and want to eat",
        prompt: "Demonstrate food vocabulary with likes and wants"
      }
    }
  }, {
    id: "lesson-a1-10-quiz",
    title: {
      en: "Food & Drinks Quiz",
      es: "Prueba de Comida y Bebidas"
    },
    description: {
      en: "Test your knowledge of food & drinks",
      es: "Prueba tus conocimientos de comida y bebidas"
    },
    xpRequired: 830,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "food and drinks",
        focusPoints: ["pan, fruta, carne, pescado", "agua, café, leche, zumo/jugo"]
      },
      grammar: {
        topics: ["talking about food"],
        focusPoints: ["me gusta vs me gustan", "quiero + food"]
      }
    }
  }]
}, {
  id: "unit-a1-11",
  title: {
    en: "At the Restaurant",
    es: "En el Restaurante"
  },
  description: {
    en: "Order food",
    es: "Pide comida"
  },
  color: "#14B8A6",
  position: {
    row: 5,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-11-1",
    title: {
      en: "Restaurant Words",
      es: "Palabras de Restaurante"
    },
    description: {
      en: "Learn key vocabulary for at the restaurant",
      es: "Aprende vocabulario clave para en el restaurante"
    },
    xpRequired: 860,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "ordering at a restaurant",
        focusPoints: ["el menú, la carta, la cuenta", "el/la camarero/a, el plato, la bebida", "la propina, la mesa"]
      },
      grammar: {
        topic: "polite ordering phrases",
        focusPoints: ["quería / me pone / para mí...", "¿qué desea? / ¿algo más?", "la cuenta, por favor"]
      }
    }
  }, {
    id: "lesson-a1-11-2",
    title: {
      en: "Ordering a Meal",
      es: "Pidiendo una Comida"
    },
    description: {
      en: "Practice at the restaurant in conversation",
      es: "Practica en el restaurante en conversación"
    },
    xpRequired: 875,
    xpReward: 60,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "ordering a meal from a waiter",
        prompt: "Practice ordering: 'para mí..., la cuenta, por favor'"
      },
      stories: {
        topic: "a restaurant scene",
        prompt: "Read a restaurant dialogue and discuss the order"
      }
    }
  }, {
    id: "lesson-a1-11-3",
    title: {
      en: "Paying the Bill",
      es: "Pagando la Cuenta"
    },
    description: {
      en: "Apply at the restaurant skills",
      es: "Aplica habilidades de en el restaurante"
    },
    xpRequired: 890,
    xpReward: 35,
    modes: ["reading", "realtime"],
    objectiveAlignment: [["bill"], ["total", "charge", "payment"]],
    content: {
      reading: {
        topic: "checking an itemized restaurant bill",
        prompt: "Read an itemized restaurant bill and verify the items, total, and change"
      },
      realtime: {
        scenario: "paying and resolving a question about the bill",
        prompt: "Ask for the bill, clarify a charge, choose a payment method, and close politely"
      }
    }
  }, {
    id: "lesson-a1-11-quiz",
    title: {
      en: "At the Restaurant Quiz",
      es: "Prueba de En el Restaurante"
    },
    description: {
      en: "Test your knowledge of at the restaurant",
      es: "Prueba tus conocimientos de en el restaurante"
    },
    xpRequired: 905,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "at the restaurant",
        focusPoints: ["el menú, la cuenta, el camarero", "el plato, la bebida"]
      },
      grammar: {
        topics: ["polite ordering phrases"],
        focusPoints: ["quería / me pone / para mí", "la cuenta, por favor"]
      }
    }
  }]
}, {
  id: "unit-a1-12",
  title: {
    en: "Classroom Objects",
    es: "Objetos del Aula"
  },
  description: {
    en: "Identify and locate school and desk items",
    es: "Identifica y ubica artículos escolares y de escritorio"
  },
  color: "#A855F7",
  position: {
    row: 5,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-12-1",
    title: {
      en: "Desk and School Supplies",
      es: "Útiles Escolares y de Escritorio"
    },
    description: {
      en: "Learn key classroom and workspace vocabulary",
      es: "Aprende vocabulario clave del aula y del espacio de trabajo"
    },
    xpRequired: 935,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "classroom and workspace objects",
        focusPoints: ["el libro, el cuaderno, el bolígrafo, el lápiz", "la mochila, el escritorio, la pizarra", "el ordenador/computadora, la pantalla, el teclado"]
      },
      grammar: {
        topic: "pointing things out",
        focusPoints: ["este/esta vs ese/esa", "hay (there is/are)", "¿qué es esto? / es un/una..."]
      }
    }
  }, {
    id: "lesson-a1-12-2",
    title: {
      en: "What Is This?",
      es: "¿Qué Es Esto?"
    },
    description: {
      en: "Identify classroom objects in conversation",
      es: "Identifica objetos del aula en conversación"
    },
    xpRequired: 950,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "naming the things on your desk",
        prompt: "Identify and locate classroom objects with 'esto es...' and 'hay...'",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["realtime-practice-object-names-with-esto-es-and-hay-1"]
      },
      stories: {
        topic: "objects in a classroom",
        prompt: "Read a classroom description and identify where the school supplies are",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["stories-read-a-description-of-a-room-s-objects-and-discuss-1"]
      }
    }
  }, {
    id: "lesson-a1-12-3",
    title: {
      en: "Around the Classroom",
      es: "Alrededor del Aula"
    },
    description: {
      en: "Use demonstratives to distinguish classroom objects",
      es: "Usa demostrativos para distinguir objetos del aula"
    },
    xpRequired: 965,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "this and that with classroom objects",
        prompt: "Distinguish nearby and distant classroom objects with este and ese",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["reading-read-and-notice-este-ese-for-near-and-far-objects-1"]
      },
      realtime: {
        scenario: "asking about unfamiliar classroom objects",
        prompt: "Ask and answer what classroom objects are with '¿qué es esto?'",
        preserveCanonicalGoal: true,
        targetCurriculumAliases: ["realtime-demonstrate-object-vocabulary-with-que-es-esto-1"]
      }
    }
  }, {
    id: "lesson-a1-12-quiz",
    title: {
      en: "Classroom Objects Quiz",
      es: "Prueba de Objetos del Aula"
    },
    description: {
      en: "Test your knowledge of classroom objects",
      es: "Prueba tus conocimientos de objetos del aula"
    },
    xpRequired: 980,
    xpReward: 60,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "classroom objects",
        focusPoints: ["libro, cuaderno, bolígrafo, lápiz", "mochila, escritorio, pizarra", "ordenador/computadora, pantalla, teclado"]
      },
      grammar: {
        topics: ["pointing things out"],
        focusPoints: ["este/esta vs ese/esa", "hay + object"]
      }
    }
  }]
}, {
  id: "unit-a1-13",
  title: {
    en: "In the House",
    es: "En la Casa"
  },
  description: {
    en: "Rooms and furniture",
    es: "Habitaciones y muebles"
  },
  color: "#DB2777",
  position: {
    row: 6,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-13-1",
    title: {
      en: "Rooms of the House",
      es: "Cuartos de la Casa"
    },
    description: {
      en: "Learn key vocabulary for in the house",
      es: "Aprende vocabulario clave para en la casa"
    },
    xpRequired: 1010,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the house and its rooms",
        focusPoints: ["la cocina, el baño, el dormitorio", "el salón, el comedor, el pasillo", "los muebles: la cama, el sofá"]
      },
      grammar: {
        topic: "saying where things are",
        focusPoints: ["estar for location (está en...)", "prepositions: en, sobre, debajo de, al lado de", "¿dónde está?"]
      }
    }
  }, {
    id: "lesson-a1-13-2",
    title: {
      en: "Where Is It?",
      es: "¿Dónde Está?"
    },
    description: {
      en: "Practice in the house in conversation",
      es: "Practica en la casa en conversación"
    },
    xpRequired: 1025,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "giving a friend a tour of your home",
        prompt: "Practice rooms with 'está en...' and prepositions of place"
      },
      stories: {
        topic: "a description of a home",
        prompt: "Read about a house and discuss where the rooms are"
      }
    }
  }, {
    id: "lesson-a1-13-3",
    title: {
      en: "At Home",
      es: "En Casa"
    },
    description: {
      en: "Apply in the house skills",
      es: "Aplica habilidades de en la casa"
    },
    xpRequired: 1040,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "describing where things are",
        prompt: "Read and locate objects using prepositions of place"
      },
      realtime: {
        scenario: "describing your room",
        prompt: "Demonstrate house vocabulary with 'estar' and place words"
      }
    }
  }, {
    id: "lesson-a1-13-quiz",
    title: {
      en: "In the House Quiz",
      es: "Prueba de En la Casa"
    },
    description: {
      en: "Test your knowledge of in the house",
      es: "Prueba tus conocimientos de en la casa"
    },
    xpRequired: 1055,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the house and rooms",
        focusPoints: ["cocina, baño, dormitorio, salón", "cama, sofá, mesa"]
      },
      grammar: {
        topics: ["saying where things are"],
        focusPoints: ["estar for location", "en, sobre, debajo de, al lado de"]
      }
    }
  }]
}, {
  id: "unit-a1-14",
  title: {
    en: "Clothing",
    es: "Ropa"
  },
  description: {
    en: "What you wear",
    es: "Lo que vistes"
  },
  color: "#0EA5E9",
  position: {
    row: 6,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-14-1",
    title: {
      en: "What to Wear",
      es: "Qué Ponerse"
    },
    description: {
      en: "Learn key vocabulary for clothing",
      es: "Aprende vocabulario clave para ropa"
    },
    xpRequired: 1085,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "clothing",
        focusPoints: ["la camisa, los pantalones, los zapatos", "el vestido, la falda, la chaqueta", "el abrigo, el sombrero"]
      },
      grammar: {
        topic: "talking about what you wear",
        focusPoints: ["llevar / ponerse (reflexive)", "agreement and plural of clothes", "colors + clothing (camisa azul)"]
      }
    }
  }, {
    id: "lesson-a1-14-2",
    title: {
      en: "Shopping for Clothes",
      es: "Comprando Ropa"
    },
    description: {
      en: "Practice clothing in conversation",
      es: "Practica ropa en conversación"
    },
    xpRequired: 1100,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "choosing an outfit for an occasion",
        prompt: "Practice clothing with 'llevar' and colors"
      },
      stories: {
        topic: "describing what people wear",
        prompt: "Read a description of outfits and discuss"
      }
    }
  }, {
    id: "lesson-a1-14-3",
    title: {
      en: "My Wardrobe",
      es: "Mi Guardarropa"
    },
    description: {
      en: "Apply clothing skills",
      es: "Aplica habilidades de ropa"
    },
    xpRequired: 1115,
    xpReward: 35,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "clothing and the weather",
        prompt: "Read and match clothes to situations"
      },
      realtime: {
        scenario: "describing what you are wearing today",
        prompt: "Demonstrate clothing vocabulary with 'llevar' and colors"
      }
    }
  }, {
    id: "lesson-a1-14-quiz",
    title: {
      en: "Clothing Quiz",
      es: "Prueba de Ropa"
    },
    description: {
      en: "Test your knowledge of clothing",
      es: "Prueba tus conocimientos de ropa"
    },
    xpRequired: 1130,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "clothing",
        focusPoints: ["camisa, pantalones, zapatos", "vestido, falda, chaqueta"]
      },
      grammar: {
        topics: ["talking about what you wear"],
        focusPoints: ["llevar / ponerse", "colors + clothing"]
      }
    }
  }]
}, {
  id: "unit-a1-15",
  title: {
    en: "Daily Routine",
    es: "Rutina Diaria"
  },
  description: {
    en: "Your day",
    es: "Tu día"
  },
  color: "#22C55E",
  position: {
    row: 7,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-15-1",
    title: {
      en: "My Day",
      es: "Mi Día"
    },
    description: {
      en: "Learn key vocabulary for daily routine",
      es: "Aprende vocabulario clave para rutina diaria"
    },
    xpRequired: 1160,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "daily routine activities",
        focusPoints: ["levantarse, ducharse, vestirse", "desayunar, trabajar, estudiar", "acostarse, dormir"]
      },
      grammar: {
        topic: "describing your routine",
        focusPoints: ["reflexive verbs (me levanto, me ducho)", "present tense for habits", "time + activity (a las ocho me levanto)"]
      }
    }
  }, {
    id: "lesson-a1-15-2",
    title: {
      en: "Daily Activities",
      es: "Actividades Diarias"
    },
    description: {
      en: "Practice daily routine in conversation",
      es: "Practica rutina diaria en conversación"
    },
    xpRequired: 1175,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "describing your morning routine to a friend",
        prompt: "Practice reflexive verbs: 'me levanto, me ducho, desayuno'"
      },
      stories: {
        topic: "a daily routine",
        prompt: "Read about someone's day and discuss the routine"
      }
    }
  }, {
    id: "lesson-a1-15-3",
    title: {
      en: "From Morning to Night",
      es: "De la Mañana a la Noche"
    },
    description: {
      en: "Apply daily routine skills",
      es: "Aplica habilidades de rutina diaria"
    },
    xpRequired: 1190,
    xpReward: 45,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "routines and times",
        prompt: "Read a routine and notice the reflexive verbs and times"
      },
      realtime: {
        scenario: "telling someone your typical day",
        prompt: "Demonstrate routine verbs with times of day"
      }
    }
  }, {
    id: "lesson-a1-15-quiz",
    title: {
      en: "Daily Routine Quiz",
      es: "Prueba de Rutina Diaria"
    },
    description: {
      en: "Test your knowledge of daily routine",
      es: "Prueba tus conocimientos de rutina diaria"
    },
    xpRequired: 1205,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "daily routine",
        focusPoints: ["levantarse, ducharse, vestirse", "desayunar, trabajar, acostarse"]
      },
      grammar: {
        topics: ["describing your routine"],
        focusPoints: ["reflexive verbs (me levanto)", "time + activity"]
      }
    }
  }]
}, {
  id: "unit-a1-16",
  title: {
    en: "Weather",
    es: "Clima"
  },
  description: {
    en: "Talk about weather",
    es: "Habla del clima"
  },
  color: "#3B82F6",
  position: {
    row: 7,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-16-1",
    title: {
      en: "How's the Weather?",
      es: "¿Cómo Está el Clima?"
    },
    description: {
      en: "Learn key vocabulary for weather",
      es: "Aprende vocabulario clave para clima"
    },
    xpRequired: 1235,
    xpReward: 45,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "the weather",
        focusPoints: ["hace sol, hace calor, hace frío", "llueve, nieva, hace viento", "está nublado, está despejado"]
      },
      grammar: {
        topic: "talking about the weather",
        focusPoints: ["hace + noun (hace frío)", "está + adjective (está nublado)", "¿qué tiempo hace?"]
      }
    }
  }, {
    id: "lesson-a1-16-2",
    title: {
      en: "Four Seasons",
      es: "Cuatro Estaciones"
    },
    description: {
      en: "Practice weather in conversation",
      es: "Practica clima en conversación"
    },
    xpRequired: 1250,
    xpReward: 50,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "chatting about today's weather",
        prompt: "Practice '¿qué tiempo hace?' and 'hace.../está...'"
      },
      stories: {
        topic: "weather and the seasons",
        prompt: "Read a weather report and discuss it"
      }
    }
  }, {
    id: "lesson-a1-16-3",
    title: {
      en: "Weather Reports",
      es: "Reportes del Clima"
    },
    description: {
      en: "Apply weather skills",
      es: "Aplica habilidades de clima"
    },
    xpRequired: 1265,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "weather in different places",
        prompt: "Read and compare the weather in two cities"
      },
      realtime: {
        scenario: "describing the weather where you are",
        prompt: "Demonstrate weather expressions with 'hace' and 'está'"
      }
    }
  }, {
    id: "lesson-a1-16-quiz",
    title: {
      en: "Weather Quiz",
      es: "Prueba de Clima"
    },
    description: {
      en: "Test your knowledge of weather",
      es: "Prueba tus conocimientos de clima"
    },
    xpRequired: 1280,
    xpReward: 40,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "the weather",
        focusPoints: ["hace sol/calor/frío", "llueve, nieva, está nublado"]
      },
      grammar: {
        topics: ["talking about the weather"],
        focusPoints: ["hace + noun vs está + adjective", "¿qué tiempo hace?"]
      }
    }
  }]
}, {
  id: "unit-a1-17",
  title: {
    en: "Likes & Dislikes",
    es: "Gustos"
  },
  description: {
    en: "Preferences",
    es: "Preferencias"
  },
  color: "#F59E0B",
  position: {
    row: 8,
    offset: 0
  },
  lessons: [{
    id: "lesson-a1-17-1",
    title: {
      en: "I Like, I Love",
      es: "Me Gusta, Me Encanta"
    },
    description: {
      en: "Learn key vocabulary for likes & dislikes",
      es: "Aprende vocabulario clave para gustos"
    },
    xpRequired: 1310,
    xpReward: 55,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "likes and dislikes",
        focusPoints: ["me gusta / me encanta", "no me gusta / odio", "me gusta mucho / nada"]
      },
      grammar: {
        topic: "the verb gustar",
        focusPoints: ["me gusta + singular / me gustan + plural", "me gusta + infinitive (me gusta leer)", "a mí me gusta, a ti te gusta"]
      }
    }
  }, {
    id: "lesson-a1-17-2",
    title: {
      en: "Expressing Preferences",
      es: "Expresando Preferencias"
    },
    description: {
      en: "Practice likes & dislikes in conversation",
      es: "Practica gustos en conversación"
    },
    xpRequired: 1325,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "comparing what you both like",
        prompt: "Practice 'me gusta/gustan' and 'a mí también/tampoco'"
      },
      stories: {
        topic: "preferences and hobbies",
        prompt: "Read about someone's likes and discuss"
      }
    }
  }, {
    id: "lesson-a1-17-3",
    title: {
      en: "Favorites and Dislikes",
      es: "Favoritos y Disgustos"
    },
    description: {
      en: "Apply likes & dislikes skills",
      es: "Aplica habilidades de gustos"
    },
    xpRequired: 1340,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "expressing preferences",
        prompt: "Read and notice 'me gusta' vs 'me gustan' and 'a mí me...'"
      },
      realtime: {
        scenario: "telling a friend what you like and dislike",
        prompt: "Demonstrate gustar with singular, plural, and infinitives"
      }
    }
  }, {
    id: "lesson-a1-17-quiz",
    title: {
      en: "Likes & Dislikes Quiz",
      es: "Prueba de Gustos"
    },
    description: {
      en: "Test your knowledge of likes & dislikes",
      es: "Prueba tus conocimientos de gustos"
    },
    xpRequired: 1355,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "likes and dislikes",
        focusPoints: ["me gusta / me encanta", "no me gusta / odio"]
      },
      grammar: {
        topics: ["the verb gustar"],
        focusPoints: ["me gusta vs me gustan", "a mí me gusta + infinitive"]
      }
    }
  }]
}, {
  id: "unit-a1-18",
  title: {
    en: "Basic Questions",
    es: "Preguntas"
  },
  description: {
    en: "Ask questions",
    es: "Haz preguntas"
  },
  color: "#8B5CF6",
  position: {
    row: 8,
    offset: 1
  },
  lessons: [{
    id: "lesson-a1-18-1",
    title: {
      en: "Question Words",
      es: "Palabras de Pregunta"
    },
    description: {
      en: "Learn key vocabulary for basic questions",
      es: "Aprende vocabulario clave para preguntas"
    },
    xpRequired: 1385,
    xpReward: 35,
    modes: ["vocabulary", "grammar"],
    content: {
      vocabulary: {
        topic: "question words",
        focusPoints: ["qué, quién, dónde, cuándo", "cómo, por qué, cuánto", "cuál / cuáles"]
      },
      grammar: {
        topic: "forming simple questions",
        focusPoints: ["question word + verb (¿dónde vives?)", "yes/no questions and ¿verdad?", "written accents on question words"]
      }
    }
  }, {
    id: "lesson-a1-18-2",
    title: {
      en: "Asking Questions",
      es: "Haciendo Preguntas"
    },
    description: {
      en: "Practice basic questions in conversation",
      es: "Practica preguntas en conversación"
    },
    xpRequired: 1400,
    xpReward: 40,
    modes: ["realtime", "stories"],
    content: {
      realtime: {
        scenario: "getting to know someone with questions",
        prompt: "Practice asking '¿dónde...?', '¿cómo...?', '¿por qué...?'"
      },
      stories: {
        topic: "an interview",
        prompt: "Read a short interview and notice the questions"
      }
    }
  }, {
    id: "lesson-a1-18-3",
    title: {
      en: "Getting Information",
      es: "Obteniendo Información"
    },
    description: {
      en: "Apply basic questions skills",
      es: "Aplica habilidades de preguntas"
    },
    xpRequired: 1415,
    xpReward: 55,
    modes: ["reading", "realtime"],
    content: {
      reading: {
        topic: "questions and answers",
        prompt: "Read and match questions to their answers"
      },
      realtime: {
        scenario: "interviewing a new friend",
        prompt: "Demonstrate question words to ask about someone"
      }
    }
  }, {
    id: "lesson-a1-18-quiz",
    title: {
      en: "Basic Questions Quiz",
      es: "Prueba de Preguntas"
    },
    description: {
      en: "Test your knowledge of basic questions",
      es: "Prueba tus conocimientos de preguntas"
    },
    xpRequired: 1430,
    xpReward: 50,
    modes: ["vocabulary", "grammar"],
    isFinalQuiz: true,
    quizConfig: {
      questionsRequired: 10,
      passingScore: 8
    },
    content: {
      vocabulary: {
        topic: "question words",
        focusPoints: ["qué, quién, dónde, cuándo", "cómo, por qué, cuánto"]
      },
      grammar: {
        topics: ["forming simple questions"],
        focusPoints: ["question word + verb", "accents on question words"]
      }
    }
  }]
}];
