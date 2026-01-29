/**
 * A2 Level Skill Tree Data
 */

export const SKILL_TREE_A2 = [
  {
    id: "unit-a2-1",
      title: {
        en: "Describing People",
        es: "Describir Personas",
      },
      description: {
        en: "Physical descriptions",
        es: "Descripciones físicas",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-1-1",
          title: {
            en: "Appearance Words",
            es: "Palabras de Apariencia",
          },
          description: {
            en: "Learn key vocabulary for describing people",
            es: "Aprende vocabulario clave para describir personas",
          },
          xpRequired: 1350,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "physical descriptions",
            },
            grammar: {
              topic: "physical descriptions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-1-2",
          title: {
            en: "How Do They Look?",
            es: "¿Cómo Se Ven?",
          },
          description: {
            en: "Practice describing people in conversation",
            es: "Practica describir personas en conversación",
          },
          xpRequired: 1370,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "physical descriptions conversation",
              prompt:
                "Practice using physical descriptions in real conversation",
            },
            stories: {
              topic: "physical descriptions",
              prompt: "Read and discuss physical descriptions",
            },
          },
        },
        {
          id: "lesson-a2-1-3",
          title: {
            en: "Detailed Descriptions",
            es: "Descripciones Detalladas",
          },
          description: {
            en: "Apply describing people skills",
            es: "Aplica habilidades de describir personas",
          },
          xpRequired: 1390,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "physical descriptions",
              prompt:
                "Advanced physical descriptions content and comprehension",
            },
            realtime: {
              scenario: "physical descriptions mastery",
              prompt: "Demonstrate mastery of physical descriptions",
            },
          },
        },
        {
          id: "lesson-a2-1-quiz",
          title: {
            en: "Describing People Quiz",
            es: "Prueba de Describir Personas",
          },
          description: {
            en: "Test your knowledge of describing people",
            es: "Prueba tus conocimientos de describir personas",
          },
          xpRequired: 1410,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "physical descriptions",
            },
            grammar: {
              topics: ["physical descriptions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-2",
      title: {
        en: "Describing Places",
        es: "Describir Lugares",
      },
      description: {
        en: "Talk about locations",
        es: "Habla sobre lugares",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-2-1",
          title: {
            en: "Places Around Town",
            es: "Lugares en la Ciudad",
          },
          description: {
            en: "Learn key vocabulary for describing places",
            es: "Aprende vocabulario clave para describir lugares",
          },
          xpRequired: 1450,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "places",
            },
            grammar: {
              topic: "places structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-2-2",
          title: {
            en: "My Neighborhood",
            es: "Mi Vecindario",
          },
          description: {
            en: "Practice describing places in conversation",
            es: "Practica describir lugares en conversación",
          },
          xpRequired: 1470,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "places conversation",
              prompt: "Practice using places in real conversation",
            },
            stories: {
              topic: "places",
              prompt: "Read and discuss places",
            },
          },
        },
        {
          id: "lesson-a2-2-3",
          title: {
            en: "Dream Destinations",
            es: "Destinos Soñados",
          },
          description: {
            en: "Apply describing places skills",
            es: "Aplica habilidades de describir lugares",
          },
          xpRequired: 1490,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "places",
              prompt: "Advanced places content and comprehension",
            },
            realtime: {
              scenario: "places mastery",
              prompt: "Demonstrate mastery of places",
            },
          },
        },
        {
          id: "lesson-a2-2-quiz",
          title: {
            en: "Describing Places Quiz",
            es: "Prueba de Describir Lugares",
          },
          description: {
            en: "Test your knowledge of describing places",
            es: "Prueba tus conocimientos de describir lugares",
          },
          xpRequired: 1510,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "places",
            },
            grammar: {
              topics: ["places structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-3",
      title: {
        en: "Shopping & Money",
        es: "Compras y Dinero",
      },
      description: {
        en: "Buy things",
        es: "Compra cosas",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-3-1",
          title: {
            en: "At the Store",
            es: "En la Tienda",
          },
          description: {
            en: "Learn key vocabulary for shopping & money",
            es: "Aprende vocabulario clave para compras y dinero",
          },
          xpRequired: 1550,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topic: "shopping structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-3-2",
          title: {
            en: "Bargain Hunting",
            es: "Buscando Ofertas",
          },
          description: {
            en: "Practice shopping & money in conversation",
            es: "Practica compras y dinero en conversación",
          },
          xpRequired: 1570,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "shopping conversation",
              prompt: "Practice using shopping in real conversation",
            },
            stories: {
              topic: "shopping",
              prompt: "Read and discuss shopping",
            },
          },
        },
        {
          id: "lesson-a2-3-3",
          title: {
            en: "Smart Shopping",
            es: "Comprando Inteligentemente",
          },
          description: {
            en: "Apply shopping & money skills",
            es: "Aplica habilidades de compras y dinero",
          },
          xpRequired: 1590,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "shopping",
              prompt: "Advanced shopping content and comprehension",
            },
            realtime: {
              scenario: "shopping mastery",
              prompt: "Demonstrate mastery of shopping",
            },
          },
        },
        {
          id: "lesson-a2-3-quiz",
          title: {
            en: "Shopping & Money Quiz",
            es: "Prueba de Compras y Dinero",
          },
          description: {
            en: "Test your knowledge of shopping & money",
            es: "Prueba tus conocimientos de compras y dinero",
          },
          xpRequired: 1610,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topics: ["shopping structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-4",
      title: {
        en: "At the Market",
        es: "En el Mercado",
      },
      description: {
        en: "Fresh food shopping",
        es: "Compra de alimentos",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-4-1",
          title: {
            en: "Fresh Produce",
            es: "Productos Frescos",
          },
          description: {
            en: "Learn key vocabulary for at the market",
            es: "Aprende vocabulario clave para en el mercado",
          },
          xpRequired: 1650,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topic: "shopping structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-4-2",
          title: {
            en: "Buying Groceries",
            es: "Comprando Comestibles",
          },
          description: {
            en: "Practice at the market in conversation",
            es: "Practica en el mercado en conversación",
          },
          xpRequired: 1670,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "shopping conversation",
              prompt: "Practice using shopping in real conversation",
            },
            stories: {
              topic: "shopping",
              prompt: "Read and discuss shopping",
            },
          },
        },
        {
          id: "lesson-a2-4-3",
          title: {
            en: "Market Day",
            es: "Día de Mercado",
          },
          description: {
            en: "Apply at the market skills",
            es: "Aplica habilidades de en el mercado",
          },
          xpRequired: 1690,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "shopping",
              prompt: "Advanced shopping content and comprehension",
            },
            realtime: {
              scenario: "shopping mastery",
              prompt: "Demonstrate mastery of shopping",
            },
          },
        },
        {
          id: "lesson-a2-4-quiz",
          title: {
            en: "At the Market Quiz",
            es: "Prueba de En el Mercado",
          },
          description: {
            en: "Test your knowledge of at the market",
            es: "Prueba tus conocimientos de en el mercado",
          },
          xpRequired: 1710,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping",
            },
            grammar: {
              topics: ["shopping structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-5",
      title: {
        en: "Transportation",
        es: "Transporte",
      },
      description: {
        en: "Getting around",
        es: "Moverse",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-5-1",
          title: {
            en: "Getting Around",
            es: "Moviéndose",
          },
          description: {
            en: "Learn key vocabulary for transportation",
            es: "Aprende vocabulario clave para transporte",
          },
          xpRequired: 1750,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "transportation",
            },
            grammar: {
              topic: "transportation structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-5-2",
          title: {
            en: "Taking the Bus",
            es: "Tomando el Autobús",
          },
          description: {
            en: "Practice transportation in conversation",
            es: "Practica transporte en conversación",
          },
          xpRequired: 1770,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "transportation conversation",
              prompt: "Practice using transportation in real conversation",
            },
            stories: {
              topic: "transportation",
              prompt: "Read and discuss transportation",
            },
          },
        },
        {
          id: "lesson-a2-5-3",
          title: {
            en: "Travel Options",
            es: "Opciones de Viaje",
          },
          description: {
            en: "Apply transportation skills",
            es: "Aplica habilidades de transporte",
          },
          xpRequired: 1790,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "transportation",
              prompt: "Advanced transportation content and comprehension",
            },
            realtime: {
              scenario: "transportation mastery",
              prompt: "Demonstrate mastery of transportation",
            },
          },
        },
        {
          id: "lesson-a2-5-quiz",
          title: {
            en: "Transportation Quiz",
            es: "Prueba de Transporte",
          },
          description: {
            en: "Test your knowledge of transportation",
            es: "Prueba tus conocimientos de transporte",
          },
          xpRequired: 1810,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "transportation",
            },
            grammar: {
              topics: ["transportation structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-6",
      title: {
        en: "Directions",
        es: "Direcciones",
      },
      description: {
        en: "Find your way",
        es: "Encuentra tu camino",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-6-1",
          title: {
            en: "Left and Right",
            es: "Izquierda y Derecha",
          },
          description: {
            en: "Learn key vocabulary for directions",
            es: "Aprende vocabulario clave para direcciones",
          },
          xpRequired: 1850,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "directions",
            },
            grammar: {
              topic: "directions structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-6-2",
          title: {
            en: "How Do I Get There?",
            es: "¿Cómo Llego Ahí?",
          },
          description: {
            en: "Practice directions in conversation",
            es: "Practica direcciones en conversación",
          },
          xpRequired: 1870,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "directions conversation",
              prompt: "Practice using directions in real conversation",
            },
            stories: {
              topic: "directions",
              prompt: "Read and discuss directions",
            },
          },
        },
        {
          id: "lesson-a2-6-3",
          title: {
            en: "Finding Your Way",
            es: "Encontrando Tu Camino",
          },
          description: {
            en: "Apply directions skills",
            es: "Aplica habilidades de direcciones",
          },
          xpRequired: 1890,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "directions",
              prompt: "Advanced directions content and comprehension",
            },
            realtime: {
              scenario: "directions mastery",
              prompt: "Demonstrate mastery of directions",
            },
          },
        },
        {
          id: "lesson-a2-6-quiz",
          title: {
            en: "Directions Quiz",
            es: "Prueba de Direcciones",
          },
          description: {
            en: "Test your knowledge of directions",
            es: "Prueba tus conocimientos de direcciones",
          },
          xpRequired: 1910,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "directions",
            },
            grammar: {
              topics: ["directions structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-7",
      title: {
        en: "Making Plans",
        es: "Hacer Planes",
      },
      description: {
        en: "Social arrangements",
        es: "Arreglos sociales",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-7-1",
          title: {
            en: "Future Activities",
            es: "Actividades Futuras",
          },
          description: {
            en: "Learn key vocabulary for making plans",
            es: "Aprende vocabulario clave para hacer planes",
          },
          xpRequired: 1950,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "invitations",
            },
            grammar: {
              topic: "invitations structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-7-2",
          title: {
            en: "Let's Meet Up!",
            es: "¡Vamos a Reunirnos!",
          },
          description: {
            en: "Practice making plans in conversation",
            es: "Practica hacer planes en conversación",
          },
          xpRequired: 1970,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "invitations conversation",
              prompt: "Practice using invitations in real conversation",
            },
            stories: {
              topic: "invitations",
              prompt: "Read and discuss invitations",
            },
          },
        },
        {
          id: "lesson-a2-7-3",
          title: {
            en: "Scheduling Events",
            es: "Programando Eventos",
          },
          description: {
            en: "Apply making plans skills",
            es: "Aplica habilidades de hacer planes",
          },
          xpRequired: 1990,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "invitations",
              prompt: "Advanced invitations content and comprehension",
            },
            realtime: {
              scenario: "invitations mastery",
              prompt: "Demonstrate mastery of invitations",
            },
          },
        },
        {
          id: "lesson-a2-7-quiz",
          title: {
            en: "Making Plans Quiz",
            es: "Prueba de Hacer Planes",
          },
          description: {
            en: "Test your knowledge of making plans",
            es: "Prueba tus conocimientos de hacer planes",
          },
          xpRequired: 2010,
          xpReward: 40,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "invitations",
            },
            grammar: {
              topics: ["invitations structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-8",
      title: {
        en: "Hobbies & Interests",
        es: "Pasatiempos",
      },
      description: {
        en: "Free time",
        es: "Tiempo libre",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-8-1",
          title: {
            en: "Free Time Fun",
            es: "Pasatiempos - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for hobbies & interests",
            es: "Aprende vocabulario clave para pasatiempos",
          },
          xpRequired: 2050,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "arts and reading",
            },
            grammar: {
              topic: "arts and reading structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-8-2",
          title: {
            en: "What Do You Enjoy?",
            es: "Pasatiempos - Práctica",
          },
          description: {
            en: "Practice hobbies & interests in conversation",
            es: "Practica pasatiempos en conversación",
          },
          xpRequired: 2070,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "arts and reading conversation",
              prompt: "Practice using arts and reading in real conversation",
            },
            stories: {
              topic: "arts and reading",
              prompt: "Read and discuss arts and reading",
            },
          },
        },
        {
          id: "lesson-a2-8-3",
          title: {
            en: "Sharing Interests",
            es: "Pasatiempos - Aplicación",
          },
          description: {
            en: "Apply hobbies & interests skills",
            es: "Aplica habilidades de pasatiempos",
          },
          xpRequired: 2090,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "arts and reading",
              prompt: "Advanced arts and reading content and comprehension",
            },
            realtime: {
              scenario: "arts and reading mastery",
              prompt: "Demonstrate mastery of arts and reading",
            },
          },
        },
        {
          id: "lesson-a2-8-quiz",
          title: {
            en: "Hobbies & Interests Quiz",
            es: "Prueba de Pasatiempos",
          },
          description: {
            en: "Test your knowledge of hobbies & interests",
            es: "Prueba tus conocimientos de pasatiempos",
          },
          xpRequired: 2110,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "arts and reading",
            },
            grammar: {
              topics: ["arts and reading structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-9",
      title: {
        en: "Sports & Exercise",
        es: "Deportes",
      },
      description: {
        en: "Athletic activities",
        es: "Actividades atléticas",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-9-1",
          title: {
            en: "Playing Sports",
            es: "Deportes - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for sports & exercise",
            es: "Aprende vocabulario clave para deportes",
          },
          xpRequired: 2150,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "sports",
            },
            grammar: {
              topic: "sports structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-9-2",
          title: {
            en: "Staying Active",
            es: "Deportes - Práctica",
          },
          description: {
            en: "Practice sports & exercise in conversation",
            es: "Practica deportes en conversación",
          },
          xpRequired: 2170,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "sports conversation",
              prompt: "Practice using sports in real conversation",
            },
            stories: {
              topic: "sports",
              prompt: "Read and discuss sports",
            },
          },
        },
        {
          id: "lesson-a2-9-3",
          title: {
            en: "Fitness Goals",
            es: "Deportes - Aplicación",
          },
          description: {
            en: "Apply sports & exercise skills",
            es: "Aplica habilidades de deportes",
          },
          xpRequired: 2190,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "sports",
              prompt: "Advanced sports content and comprehension",
            },
            realtime: {
              scenario: "sports mastery",
              prompt: "Demonstrate mastery of sports",
            },
          },
        },
        {
          id: "lesson-a2-9-quiz",
          title: {
            en: "Sports & Exercise Quiz",
            es: "Prueba de Deportes",
          },
          description: {
            en: "Test your knowledge of sports & exercise",
            es: "Prueba tus conocimientos de deportes",
          },
          xpRequired: 2210,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "sports",
            },
            grammar: {
              topics: ["sports structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-10",
      title: {
        en: "Past Tense Regular",
        es: "Pasado Regular",
      },
      description: {
        en: "Regular past verbs",
        es: "Verbos pasados regulares",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-10-1",
          title: {
            en: "Yesterday's Actions",
            es: "Acciones de Ayer",
          },
          description: {
            en: "Learn key vocabulary for past tense regular",
            es: "Aprende vocabulario clave para pasado regular",
          },
          xpRequired: 2250,
          xpReward: 35,
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
          id: "lesson-a2-10-2",
          title: {
            en: "What Did You Do?",
            es: "¿Qué Hiciste?",
          },
          description: {
            en: "Practice past tense regular in conversation",
            es: "Practica pasado regular en conversación",
          },
          xpRequired: 2270,
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
          id: "lesson-a2-10-3",
          title: {
            en: "Recent Events",
            es: "Eventos Recientes",
          },
          description: {
            en: "Apply past tense regular skills",
            es: "Aplica habilidades de pasado regular",
          },
          xpRequired: 2290,
          xpReward: 45,
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
          id: "lesson-a2-10-quiz",
          title: {
            en: "Past Tense Regular Quiz",
            es: "Prueba de Pasado Regular",
          },
          description: {
            en: "Test your knowledge of past tense regular",
            es: "Prueba tus conocimientos de pasado regular",
          },
          xpRequired: 2310,
          xpReward: 40,
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
      id: "unit-a2-11",
      title: {
        en: "Past Tense Irregular",
        es: "Pasado Irregular",
      },
      description: {
        en: "Irregular verbs",
        es: "Verbos irregulares",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-11-1",
          title: {
            en: "Common Irregular Verbs",
            es: "Verbos Irregulares Comunes",
          },
          description: {
            en: "Learn key vocabulary for past tense irregular",
            es: "Aprende vocabulario clave para pasado irregular",
          },
          xpRequired: 2350,
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
          id: "lesson-a2-11-2",
          title: {
            en: "Last Week",
            es: "La Semana Pasada",
          },
          description: {
            en: "Practice past tense irregular in conversation",
            es: "Practica pasado irregular en conversación",
          },
          xpRequired: 2370,
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
          id: "lesson-a2-11-3",
          title: {
            en: "Life Stories",
            es: "Historias de Vida",
          },
          description: {
            en: "Apply past tense irregular skills",
            es: "Aplica habilidades de pasado irregular",
          },
          xpRequired: 2390,
          xpReward: 35,
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
          id: "lesson-a2-11-quiz",
          title: {
            en: "Past Tense Irregular Quiz",
            es: "Prueba de Pasado Irregular",
          },
          description: {
            en: "Test your knowledge of past tense irregular",
            es: "Prueba tus conocimientos de pasado irregular",
          },
          xpRequired: 2410,
          xpReward: 40,
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
      id: "unit-a2-12",
      title: {
        en: "Telling Stories",
        es: "Contar Historias",
      },
      description: {
        en: "Narrate events",
        es: "Narra eventos",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-12-1",
          title: {
            en: "Story Elements",
            es: "Elementos de Historia",
          },
          description: {
            en: "Learn key vocabulary for telling stories",
            es: "Aprende vocabulario clave para contar historias",
          },
          xpRequired: 2450,
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
          id: "lesson-a2-12-2",
          title: {
            en: "Once Upon a Time",
            es: "Érase Una Vez",
          },
          description: {
            en: "Practice telling stories in conversation",
            es: "Practica contar historias en conversación",
          },
          xpRequired: 2470,
          xpReward: 40,
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
          id: "lesson-a2-12-3",
          title: {
            en: "My Story",
            es: "Mi Historia",
          },
          description: {
            en: "Apply telling stories skills",
            es: "Aplica habilidades de contar historias",
          },
          xpRequired: 2490,
          xpReward: 35,
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
          id: "lesson-a2-12-quiz",
          title: {
            en: "Telling Stories Quiz",
            es: "Prueba de Contar Historias",
          },
          description: {
            en: "Test your knowledge of telling stories",
            es: "Prueba tus conocimientos de contar historias",
          },
          xpRequired: 2510,
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
      id: "unit-a2-13",
      title: {
        en: "Future Plans",
        es: "Planes Futuros",
      },
      description: {
        en: "Future intentions",
        es: "Intenciones futuras",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-13-1",
          title: {
            en: "Dreams and Goals",
            es: "Sueños y Metas",
          },
          description: {
            en: "Learn key vocabulary for future plans",
            es: "Aprende vocabulario clave para planes futuros",
          },
          xpRequired: 2550,
          xpReward: 45,
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
          id: "lesson-a2-13-2",
          title: {
            en: "What Will You Do?",
            es: "¿Qué Harás?",
          },
          description: {
            en: "Practice future plans in conversation",
            es: "Practica planes futuros en conversación",
          },
          xpRequired: 2570,
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
          id: "lesson-a2-13-3",
          title: {
            en: "Planning Ahead",
            es: "Planificando el Futuro",
          },
          description: {
            en: "Apply future plans skills",
            es: "Aplica habilidades de planes futuros",
          },
          xpRequired: 2590,
          xpReward: 35,
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
          id: "lesson-a2-13-quiz",
          title: {
            en: "Future Plans Quiz",
            es: "Prueba de Planes Futuros",
          },
          description: {
            en: "Test your knowledge of future plans",
            es: "Prueba tus conocimientos de planes futuros",
          },
          xpRequired: 2610,
          xpReward: 40,
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
      id: "unit-a2-14",
      title: {
        en: "Health & Body",
        es: "Salud y Cuerpo",
      },
      description: {
        en: "Body and health",
        es: "Cuerpo y salud",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-14-1",
          title: {
            en: "Body Parts",
            es: "Partes del Cuerpo",
          },
          description: {
            en: "Learn key vocabulary for health & body",
            es: "Aprende vocabulario clave para salud y cuerpo",
          },
          xpRequired: 2650,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "body parts",
            },
            grammar: {
              topic: "body parts structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-14-2",
          title: {
            en: "How Do You Feel?",
            es: "¿Cómo Te Sientes?",
          },
          description: {
            en: "Practice health & body in conversation",
            es: "Practica salud y cuerpo en conversación",
          },
          xpRequired: 2670,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "body parts conversation",
              prompt: "Practice using body parts in real conversation",
            },
            stories: {
              topic: "body parts",
              prompt: "Read and discuss body parts",
            },
          },
        },
        {
          id: "lesson-a2-14-3",
          title: {
            en: "Healthy Living",
            es: "Vida Saludable",
          },
          description: {
            en: "Apply health & body skills",
            es: "Aplica habilidades de salud y cuerpo",
          },
          xpRequired: 2690,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "body parts",
              prompt: "Advanced body parts content and comprehension",
            },
            realtime: {
              scenario: "body parts mastery",
              prompt: "Demonstrate mastery of body parts",
            },
          },
        },
        {
          id: "lesson-a2-14-quiz",
          title: {
            en: "Health & Body Quiz",
            es: "Prueba de Salud y Cuerpo",
          },
          description: {
            en: "Test your knowledge of health & body",
            es: "Prueba tus conocimientos de salud y cuerpo",
          },
          xpRequired: 2710,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "body parts",
            },
            grammar: {
              topics: ["body parts structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-15",
      title: {
        en: "At the Doctor's",
        es: "En el Médico",
      },
      description: {
        en: "Medical visits",
        es: "Visitas médicas",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-15-1",
          title: {
            en: "Medical Terms",
            es: "Términos Médicos",
          },
          description: {
            en: "Learn key vocabulary for at the doctor's",
            es: "Aprende vocabulario clave para en el médico",
          },
          xpRequired: 2750,
          xpReward: 45,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "health",
            },
            grammar: {
              topic: "health structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-15-2",
          title: {
            en: "Visiting the Doctor",
            es: "Visitando al Doctor",
          },
          description: {
            en: "Practice at the doctor's in conversation",
            es: "Practica en el médico en conversación",
          },
          xpRequired: 2770,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "health conversation",
              prompt: "Practice using health in real conversation",
            },
            stories: {
              topic: "health",
              prompt: "Read and discuss health",
            },
          },
        },
        {
          id: "lesson-a2-15-3",
          title: {
            en: "Health Concerns",
            es: "Preocupaciones de Salud",
          },
          description: {
            en: "Apply at the doctor's skills",
            es: "Aplica habilidades de en el médico",
          },
          xpRequired: 2790,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "health",
              prompt: "Advanced health content and comprehension",
            },
            realtime: {
              scenario: "health mastery",
              prompt: "Demonstrate mastery of health",
            },
          },
        },
        {
          id: "lesson-a2-15-quiz",
          title: {
            en: "At the Doctor's Quiz",
            es: "Prueba de En el Médico",
          },
          description: {
            en: "Test your knowledge of at the doctor's",
            es: "Prueba tus conocimientos de en el médico",
          },
          xpRequired: 2810,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "health",
            },
            grammar: {
              topics: ["health structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-16",
      title: {
        en: "Jobs & Professions",
        es: "Trabajos",
      },
      description: {
        en: "Different careers",
        es: "Diferentes carreras",
      },
      color: "#3B82F6",
      position: { row: 7, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-16-1",
          title: {
            en: "Career Words",
            es: "Trabajos - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for jobs & professions",
            es: "Aprende vocabulario clave para trabajos",
          },
          xpRequired: 2850,
          xpReward: 35,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "careers",
            },
            grammar: {
              topic: "careers structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-16-2",
          title: {
            en: "What Do You Do?",
            es: "Trabajos - Práctica",
          },
          description: {
            en: "Practice jobs & professions in conversation",
            es: "Practica trabajos en conversación",
          },
          xpRequired: 2870,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "careers conversation",
              prompt: "Practice using careers in real conversation",
            },
            stories: {
              topic: "careers",
              prompt: "Read and discuss careers",
            },
          },
        },
        {
          id: "lesson-a2-16-3",
          title: {
            en: "Dream Job",
            es: "Trabajos - Aplicación",
          },
          description: {
            en: "Apply jobs & professions skills",
            es: "Aplica habilidades de trabajos",
          },
          xpRequired: 2890,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "careers",
              prompt: "Advanced careers content and comprehension",
            },
            realtime: {
              scenario: "careers mastery",
              prompt: "Demonstrate mastery of careers",
            },
          },
        },
        {
          id: "lesson-a2-16-quiz",
          title: {
            en: "Jobs & Professions Quiz",
            es: "Prueba de Trabajos",
          },
          description: {
            en: "Test your knowledge of jobs & professions",
            es: "Prueba tus conocimientos de trabajos",
          },
          xpRequired: 2910,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "careers",
            },
            grammar: {
              topics: ["careers structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-17",
      title: {
        en: "School & Education",
        es: "Escuela",
      },
      description: {
        en: "Educational topics",
        es: "Temas educativos",
      },
      color: "#F59E0B",
      position: { row: 8, offset: 0 },
      lessons: [
        {
          id: "lesson-a2-17-1",
          title: {
            en: "In the Classroom",
            es: "Escuela - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for school & education",
            es: "Aprende vocabulario clave para escuela",
          },
          xpRequired: 2950,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "education",
            },
            grammar: {
              topic: "education structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-17-2",
          title: {
            en: "School Life",
            es: "Escuela - Práctica",
          },
          description: {
            en: "Practice school & education in conversation",
            es: "Practica escuela en conversación",
          },
          xpRequired: 2970,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "education conversation",
              prompt: "Practice using education in real conversation",
            },
            stories: {
              topic: "education",
              prompt: "Read and discuss education",
            },
          },
        },
        {
          id: "lesson-a2-17-3",
          title: {
            en: "Learning Journey",
            es: "Escuela - Aplicación",
          },
          description: {
            en: "Apply school & education skills",
            es: "Aplica habilidades de escuela",
          },
          xpRequired: 2990,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "education",
              prompt: "Advanced education content and comprehension",
            },
            realtime: {
              scenario: "education mastery",
              prompt: "Demonstrate mastery of education",
            },
          },
        },
        {
          id: "lesson-a2-17-quiz",
          title: {
            en: "School & Education Quiz",
            es: "Prueba de Escuela",
          },
          description: {
            en: "Test your knowledge of school & education",
            es: "Prueba tus conocimientos de escuela",
          },
          xpRequired: 3010,
          xpReward: 50,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "education",
            },
            grammar: {
              topics: ["education structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    },
    {
      id: "unit-a2-18",
      title: {
        en: "Technology Basics",
        es: "Tecnología",
      },
      description: {
        en: "Digital life",
        es: "Vida digital",
      },
      color: "#8B5CF6",
      position: { row: 8, offset: 1 },
      lessons: [
        {
          id: "lesson-a2-18-1",
          title: {
            en: "Digital Devices",
            es: "Tecnología - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for technology basics",
            es: "Aprende vocabulario clave para tecnología",
          },
          xpRequired: 3050,
          xpReward: 55,
          modes: ["vocabulary", "grammar" ],
          content: {
            vocabulary: {
              topic: "digital communication",
            },
            grammar: {
              topic: "digital communication structures",
              focusPoints: ["basic patterns", "common phrases"],
            },
          },
        },
        {
          id: "lesson-a2-18-2",
          title: {
            en: "Using Technology",
            es: "Tecnología - Práctica",
          },
          description: {
            en: "Practice technology basics in conversation",
            es: "Practica tecnología en conversación",
          },
          xpRequired: 3070,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "digital communication conversation",
              prompt:
                "Practice using digital communication in real conversation",
            },
            stories: {
              topic: "digital communication",
              prompt: "Read and discuss digital communication",
            },
          },
        },
        {
          id: "lesson-a2-18-3",
          title: {
            en: "Connected Life",
            es: "Tecnología - Aplicación",
          },
          description: {
            en: "Apply technology basics skills",
            es: "Aplica habilidades de tecnología",
          },
          xpRequired: 3090,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "digital communication",
              prompt:
                "Advanced digital communication content and comprehension",
            },
            realtime: {
              scenario: "digital communication mastery",
              prompt: "Demonstrate mastery of digital communication",
            },
          },
        },
        {
          id: "lesson-a2-18-quiz",
          title: {
            en: "Technology Basics Quiz",
            es: "Prueba de Tecnología",
          },
          description: {
            en: "Test your knowledge of technology basics",
            es: "Prueba tus conocimientos de tecnología",
          },
          xpRequired: 3110,
          xpReward: 60,
          modes: ["vocabulary", "grammar" ],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "digital communication",
            },
            grammar: {
              topics: ["digital communication structures"],
              focusPoints: ["comprehensive review"],
            },
          },
        }
      ],
    }
];
