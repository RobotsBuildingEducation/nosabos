/**
 * Pre-A1 Level Skill Tree Data
 *
 * For ultimate beginners with zero prior knowledge.
 * Focus on recognition, single words, and survival basics before tackling A1.
 */

import { withItalianSkillTreeText } from "./italianLocalizer.js";
import { withFrenchSkillTreeText } from "./frenchLocalizer.js";
import { withHindiSkillTreeText } from "./hindiLocalizer.js";
import { withJapaneseSkillTreeText } from "./japaneseLocalizer.js";
import { withPortugueseSkillTreeText } from "./portugueseLocalizer.js";

const withLocalizedSkillTreeText = (skillTree) =>
  withHindiSkillTreeText(
    withJapaneseSkillTreeText(
      withFrenchSkillTreeText(
        withItalianSkillTreeText(withPortugueseSkillTreeText(skillTree)),
      ),
    ),
  );

export const SKILL_TREE_PRE_A1 = withLocalizedSkillTreeText([
  // Tutorial Unit - always at the very beginning
  {
    id: "unit-tutorial-pre-a1",
    title: {
      en: "Getting Started",
      es: "Primeros Pasos",
    },
    description: {
      en: "Learn how to use the app and explore all features",
      es: "Aprende a usar la app y explora todas las funciones",
    },
    color: "#6366F1",
    position: { row: -1, offset: 0 },
    isTutorial: true,
    lessons: [
      {
        id: "lesson-tutorial-1",
        title: {
          en: "Getting Started",
          es: "Primeros Pasos",
        },
        description: {
          en: "A guided tour of all learning modules",
          es: "Un recorrido guiado por todos los módulos de aprendizaje",
        },
        xpRequired: 0,
        xpReward: 50,
        isTutorial: true,
        modes: ["vocabulary", "grammar", "reading", "stories", "realtime", "game"],
        content: {
          vocabulary: {
            topic: "tutorial",
            focusPoints: ["hello", "hi", "good morning", "greetings"],
            tutorialDescription: {
              en: "Learn new words with interactive questions. Practice saying hello.",
              es: "Aprende nuevas palabras mediante preguntas interactivas. Practica decir hola.",
            },
          },
          grammar: {
            topic: "tutorial",
            focusPoints: ["hello patterns", "simple greetings"],
            tutorialDescription: {
              en: "Master grammar rules through exercises. Practice greeting patterns.",
              es: "Domina las reglas gramaticales mediante ejercicios. Practica patrones de saludo.",
            },
          },
          reading: {
            topic: "tutorial",
            prompt: "Read a simple hello greeting",
            tutorialDescription: {
              en: "Improve your reading skills with a simple hello passage.",
              es: "Mejora tus habilidades de lectura con un texto simple de saludo.",
            },
          },
          stories: {
            topic: "tutorial",
            prompt: "Practice saying hello in a story",
            tutorialDescription: {
              en: "Practice with interactive stories that say hello.",
              es: "Practica con historias interactivas que dicen hola.",
            },
          },
          realtime: {
            topic: "tutorial",
            scenario: "Say hello",
            prompt: "Practice saying hello in a live chat",
            successCriteria: "The learner says hello.",
            successCriteria_es: 'El estudiante dice "hola".',
            successCriteria_fr: 'L\'apprenant dit "bonjour".',
            tutorialDescription: {
              en: "Practice speaking with realtime conversations. Say hello to complete this activity.",
              es: "Practica la expresión oral con conversaciones en tiempo real. Di hola para completar esta actividad.",
            },
          },
          game: {
            topic: "tutorial",
            unitTitle: "Getting Started",
            tutorialDescription: {
              en: "Finish the tutorial by playing a short game review.",
              es: "Termina el tutorial jugando un breve repaso en modo juego.",
            },
          },
        },
      },
    ],
  },

  // Unit 1: People & Family
  {
    id: "unit-pre-a1-people",
    title: {
      en: "People & Family",
      es: "Personas y Familia",
    },
    description: {
      en: "Learn words for the people in your life",
      es: "Aprende palabras para las personas en tu vida",
    },
    color: "#8B5CF6",
    position: { row: 0, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-1-1",
        title: {
          en: "My Family",
          es: "Mi Familia",
        },
        description: {
          en: "Learn the words for close family members",
          es: "Aprende las palabras para familiares cercanos",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "close family members",
            focusPoints: ["mamá", "papá", "hermano", "hermana", "familia"],
          },
          grammar: {
            topic: "family with articles",
            focusPoints: ["el/la with family nouns", "mi mamá, mi papá"],
          },
        },
      },
      {
        id: "lesson-pre-a1-1-2",
        title: {
          en: "More Family",
          es: "Más Familia",
        },
        description: {
          en: "Grandparents, babies, and extended family",
          es: "Abuelos, bebés y familia extendida",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "Talking about family",
            prompt: "Tell someone about your grandparents and extended family",
            successCriteria:
              "The learner names at least two extended family members.",
          },
          stories: {
            topic: "extended family",
            prompt: "A story about visiting grandparents and meeting extended family",
          },
        },
      },
      {
        id: "lesson-pre-a1-1-3",
        title: {
          en: "People Around Me",
          es: "Personas a Mi Alrededor",
        },
        description: {
          en: "Words for friends, children, and people you see every day",
          es: "Palabras para amigos, niños y personas que ves todos los días",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "people in daily life",
            prompt: "Read a short description of people in a neighborhood",
          },
          realtime: {
            scenario: "Describing people",
            prompt: "Describe the people around you using new vocabulary",
            successCriteria:
              "The learner uses people vocabulary to describe someone.",
          },
        },
      },
      {
        id: "lesson-pre-a1-1-quiz",
        title: {
          en: "People & Family Quiz",
          es: "Prueba de Personas y Familia",
        },
        description: {
          en: "Test your knowledge of people and family words",
          es: "Pon a prueba tu conocimiento de palabras de personas y familia",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "people and family review",
            focusPoints: ["family members", "friends", "people"],
          },
          grammar: {
            topic: "people vocabulary usage",
            focusPoints: ["gender", "articles", "possessives"],
          },
        },
      },
      {
        id: "lesson-pre-a1-1-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review People & Family by playing an interactive game",
          es: "Repasa Personas y Familia jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "People & Family game review",
            unitTitle: "People & Family",
            focusPoints: ["family members", "friends", "people", "gender", "articles", "possessives"],
          },
        },
      },
    ],
  },

  // Unit 2: Numbers 0-10
  {
    id: "unit-pre-a1-numbers",
    title: {
      en: "Numbers 0-10",
      es: "Números 0-10",
    },
    description: {
      en: "Count from zero to ten in Spanish",
      es: "Cuenta del cero al diez en español",
    },
    color: "#EC4899",
    position: { row: 1, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-2-1",
        title: {
          en: "Zero to Five",
          es: "Cero a Cinco",
        },
        description: {
          en: "Learn your first numbers: 0, 1, 2, 3, 4, 5",
          es: "Aprende tus primeros números: 0, 1, 2, 3, 4, 5",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "numbers 0-5",
            focusPoints: ["cero", "uno", "dos", "tres", "cuatro", "cinco"],
          },
          grammar: {
            topic: "number usage",
            focusPoints: ["counting objects", "number pronunciation"],
          },
        },
      },
      {
        id: "lesson-pre-a1-2-2",
        title: {
          en: "Six to Ten",
          es: "Seis a Diez",
        },
        description: {
          en: "Complete counting to ten: 6, 7, 8, 9, 10",
          es: "Completa el conteo hasta diez: 6, 7, 8, 9, 10",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["stories", "reading"],
        content: {
          stories: {
            topic: "numbers 6-10",
            prompt: "A story about counting items at a market from six to ten",
          },
          reading: {
            topic: "numbers 6-10",
            prompt: "Read a short passage that uses numbers six through ten",
          },
        },
      },
      {
        id: "lesson-pre-a1-2-3",
        title: {
          en: "Counting Objects",
          es: "Contando Objetos",
        },
        description: {
          en: "Use numbers to count everyday things",
          es: "Usa números para contar cosas cotidianas",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "Counting objects",
            prompt: "Count everyday objects together in a conversation",
            successCriteria:
              "The learner counts at least three objects using correct numbers.",
          },
          stories: {
            topic: "counting objects",
            prompt: "A short story about a child counting toys and sharing them",
          },
        },
      },
      {
        id: "lesson-pre-a1-2-quiz",
        title: {
          en: "Numbers Quiz",
          es: "Prueba de Números",
        },
        description: {
          en: "Test your counting skills from 0 to 10",
          es: "Pon a prueba tu habilidad de contar del 0 al 10",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "numbers review",
            focusPoints: ["0-10", "counting"],
          },
          grammar: {
            topic: "number usage",
            focusPoints: ["quantities", "counting objects"],
          },
        },
      },
      {
        id: "lesson-pre-a1-2-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Numbers 0-10 by playing an interactive game",
          es: "Repasa Números 0-10 jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Numbers 0-10 game review",
            unitTitle: "Numbers 0-10",
            focusPoints: ["0-10", "counting", "quantities", "counting objects"],
          },
        },
      },
    ],
  },

  // Unit 3: Hello & Goodbye
  {
    id: "unit-pre-a1-greetings",
    title: {
      en: "Hello & Goodbye",
      es: "Hola y Adiós",
    },
    description: {
      en: "Basic greetings and farewells for any situation",
      es: "Saludos y despedidas básicas para cualquier situación",
    },
    color: "#10B981",
    position: { row: 2, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-3-1",
        title: {
          en: "Saying Hello",
          es: "Decir Hola",
        },
        description: {
          en: "Learn different ways to greet people",
          es: "Aprende diferentes formas de saludar a la gente",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "greetings",
            focusPoints: [
              "hola",
              "buenos días",
              "buenas tardes",
              "buenas noches",
            ],
          },
          grammar: {
            topic: "greeting usage",
            focusPoints: ["time-appropriate greetings", "formal vs informal"],
          },
        },
      },
      {
        id: "lesson-pre-a1-3-2",
        title: {
          en: "Saying Goodbye",
          es: "Decir Adiós",
        },
        description: {
          en: "Learn farewell expressions for different situations",
          es: "Aprende expresiones de despedida para diferentes situaciones",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "farewells",
            prompt: "Read a short dialogue where friends say goodbye in different ways",
          },
          realtime: {
            scenario: "Saying goodbye",
            prompt: "Practice different ways to say goodbye",
            successCriteria:
              "The learner uses at least two different farewell expressions.",
          },
        },
      },
      {
        id: "lesson-pre-a1-3-3",
        title: {
          en: "Greetings in Context",
          es: "Saludos en Contexto",
        },
        description: {
          en: "Practice greetings in real-life situations",
          es: "Practica saludos en situaciones de la vida real",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["stories", "reading"],
        content: {
          stories: {
            topic: "greetings in context",
            prompt: "A story about arriving at a party and greeting everyone differently",
          },
          reading: {
            topic: "greeting conversations",
            prompt: "Read a scene where people greet each other at different times of day",
          },
        },
      },
      {
        id: "lesson-pre-a1-3-quiz",
        title: {
          en: "Greetings Quiz",
          es: "Prueba de Saludos",
        },
        description: {
          en: "Test your greeting and farewell skills",
          es: "Pon a prueba tus habilidades de saludo y despedida",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "greetings review",
            focusPoints: ["all greetings", "all farewells"],
          },
          grammar: {
            topic: "greeting rules",
            focusPoints: ["appropriate usage", "context"],
          },
        },
      },
      {
        id: "lesson-pre-a1-3-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Hello & Goodbye by playing an interactive game",
          es: "Repasa Hola y Adiós jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Hello & Goodbye game review",
            unitTitle: "Hello & Goodbye",
            focusPoints: ["all greetings", "all farewells", "appropriate usage", "context"],
          },
        },
      },
    ],
  },

  // Unit 4: Yes, No & Basic Responses
  {
    id: "unit-pre-a1-responses",
    title: {
      en: "Yes, No & Basic Responses",
      es: "Sí, No y Respuestas Básicas",
    },
    description: {
      en: "Essential single-word responses for any conversation",
      es: "Respuestas esenciales de una palabra para cualquier conversación",
    },
    color: "#F59E0B",
    position: { row: 3, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-4-1",
        title: {
          en: "Yes and No",
          es: "Sí y No",
        },
        description: {
          en: "Master the most important words in any language",
          es: "Domina las palabras más importantes en cualquier idioma",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "affirmative and negative",
            focusPoints: ["sí", "no", "claro", "vale", "de acuerdo"],
          },
          grammar: {
            topic: "response patterns",
            focusPoints: ["answering yes/no questions", "emphasis with sí/no"],
          },
        },
      },
      {
        id: "lesson-pre-a1-4-2",
        title: {
          en: "Maybe and I Don't Know",
          es: "Quizás y No Sé",
        },
        description: {
          en: "Express uncertainty with simple phrases",
          es: "Expresa incertidumbre con frases simples",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["realtime", "stories"],
        content: {
          realtime: {
            scenario: "Expressing uncertainty",
            prompt: "Practice responding with maybe, I don't know, and other uncertain phrases",
            successCriteria:
              "The learner uses at least two uncertainty expressions.",
          },
          stories: {
            topic: "uncertainty expressions",
            prompt: "A story about someone who can't decide what to eat for lunch",
          },
        },
      },
      {
        id: "lesson-pre-a1-4-3",
        title: {
          en: "Quick Responses",
          es: "Respuestas Rápidas",
        },
        description: {
          en: "React naturally in conversations",
          es: "Reacciona naturalmente en conversaciones",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["reading", "stories"],
        content: {
          reading: {
            topic: "reaction words",
            prompt: "Read a text message conversation full of reactions and exclamations",
          },
          stories: {
            topic: "quick responses",
            prompt: "A story about friends reacting to surprising news",
          },
        },
      },
      {
        id: "lesson-pre-a1-4-quiz",
        title: {
          en: "Responses Quiz",
          es: "Prueba de Respuestas",
        },
        description: {
          en: "Test your ability to respond appropriately",
          es: "Pon a prueba tu habilidad de responder apropiadamente",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "responses review",
            focusPoints: ["yes/no", "uncertainty", "reactions"],
          },
          grammar: {
            topic: "response usage",
            focusPoints: ["appropriate responses"],
          },
        },
      },
      {
        id: "lesson-pre-a1-4-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Yes, No & Basic Responses by playing an interactive game",
          es: "Repasa Sí, No y Respuestas Básicas jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Yes, No & Basic Responses game review",
            unitTitle: "Yes, No & Basic Responses",
            focusPoints: ["yes/no", "uncertainty", "reactions", "appropriate responses"],
          },
        },
      },
    ],
  },

  // Unit 5: Please & Thank You
  {
    id: "unit-pre-a1-courtesy",
    title: {
      en: "Please & Thank You",
      es: "Por Favor y Gracias",
    },
    description: {
      en: "Essential courtesy expressions for polite communication",
      es: "Expresiones de cortesía esenciales para comunicación educada",
    },
    color: "#EF4444",
    position: { row: 4, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-5-1",
        title: {
          en: "Please and Thank You",
          es: "Por Favor y Gracias",
        },
        description: {
          en: "The magic words that open doors everywhere",
          es: "Las palabras mágicas que abren puertas en todas partes",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "basic courtesy",
            focusPoints: ["por favor", "gracias", "muchas gracias", "de nada"],
          },
          grammar: {
            topic: "polite requests",
            focusPoints: ["adding por favor", "thanking appropriately"],
          },
        },
      },
      {
        id: "lesson-pre-a1-5-2",
        title: {
          en: "Sorry and Excuse Me",
          es: "Perdón y Disculpe",
        },
        description: {
          en: "Apologize and get attention politely",
          es: "Discúlpate y llama la atención educadamente",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["stories", "realtime"],
        content: {
          stories: {
            topic: "apologies",
            prompt: "A story about someone who accidentally bumps into people and apologizes",
          },
          realtime: {
            scenario: "Apologizing and excusing yourself",
            prompt: "Practice saying sorry and excuse me in different situations",
            successCriteria:
              "The learner uses apology and attention phrases appropriately.",
          },
        },
      },
      {
        id: "lesson-pre-a1-5-3",
        title: {
          en: "Polite Expressions",
          es: "Expresiones Corteses",
        },
        description: {
          en: "Additional phrases for gracious communication",
          es: "Frases adicionales para comunicación cortés",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["reading", "realtime"],
        content: {
          reading: {
            topic: "polite expressions",
            prompt: "Read a scene where people exchange gracious phrases at a restaurant",
          },
          realtime: {
            scenario: "Being polite",
            prompt: "Practice using polite phrases in everyday situations",
            successCriteria:
              "The learner uses at least two polite expressions naturally.",
          },
        },
      },
      {
        id: "lesson-pre-a1-5-quiz",
        title: {
          en: "Courtesy Quiz",
          es: "Prueba de Cortesía",
        },
        description: {
          en: "Test your polite expression skills",
          es: "Pon a prueba tus habilidades de expresiones corteses",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "courtesy review",
            focusPoints: ["please/thank you", "apologies", "polite phrases"],
          },
          grammar: {
            topic: "courtesy usage",
            focusPoints: ["appropriate situations"],
          },
        },
      },
      {
        id: "lesson-pre-a1-5-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Please & Thank You by playing an interactive game",
          es: "Repasa Por Favor y Gracias jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Please & Thank You game review",
            unitTitle: "Please & Thank You",
            focusPoints: ["please/thank you", "apologies", "polite phrases", "appropriate situations"],
          },
        },
      },
    ],
  },

  // Unit 6: Common Objects
  {
    id: "unit-pre-a1-objects",
    title: {
      en: "Common Objects",
      es: "Objetos Comunes",
    },
    description: {
      en: "Name everyday things around you",
      es: "Nombra las cosas cotidianas a tu alrededor",
    },
    color: "#06B6D4",
    position: { row: 5, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-6-1",
        title: {
          en: "Things at Home",
          es: "Cosas en Casa",
        },
        description: {
          en: "Learn names of common household items",
          es: "Aprende nombres de artículos comunes del hogar",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "household items",
            focusPoints: [
              "mesa",
              "silla",
              "puerta",
              "ventana",
              "cama",
              "lámpara",
            ],
          },
          grammar: {
            topic: "articles with objects",
            focusPoints: ["el/la with objects", "masculine vs feminine nouns"],
          },
        },
      },
      {
        id: "lesson-pre-a1-6-2",
        title: {
          en: "Personal Items",
          es: "Artículos Personales",
        },
        description: {
          en: "Things you carry with you every day",
          es: "Cosas que llevas contigo todos los días",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["reading", "stories"],
        content: {
          reading: {
            topic: "personal items",
            prompt: "Read about someone describing what they carry in their bag",
          },
          stories: {
            topic: "personal items",
            prompt: "A story about someone who lost their keys and searches for them",
          },
        },
      },
      {
        id: "lesson-pre-a1-6-3",
        title: {
          en: "Food and Drink Items",
          es: "Comida y Bebida",
        },
        description: {
          en: "Basic food and drink vocabulary",
          es: "Vocabulario básico de comida y bebida",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["realtime", "reading"],
        content: {
          realtime: {
            scenario: "Ordering food and drinks",
            prompt: "Practice asking for food and drinks at a café",
            successCriteria:
              "The learner names at least two food or drink items.",
          },
          reading: {
            topic: "food and drinks",
            prompt: "Read a simple café menu and identify common food and drink items",
          },
        },
      },
      {
        id: "lesson-pre-a1-6-quiz",
        title: {
          en: "Objects Quiz",
          es: "Prueba de Objetos",
        },
        description: {
          en: "Test your knowledge of common objects",
          es: "Pon a prueba tu conocimiento de objetos comunes",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "objects review",
            focusPoints: ["household", "personal", "food/drink"],
          },
          grammar: {
            topic: "object naming",
            focusPoints: ["articles", "gender"],
          },
        },
      },
      {
        id: "lesson-pre-a1-6-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Common Objects by playing an interactive game",
          es: "Repasa Objetos Comunes jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Common Objects game review",
            unitTitle: "Common Objects",
            focusPoints: ["household", "personal", "food/drink", "articles", "gender"],
          },
        },
      },
    ],
  },

  // Unit 7: Colors
  {
    id: "unit-pre-a1-colors",
    title: {
      en: "Colors",
      es: "Colores",
    },
    description: {
      en: "Learn to identify and name colors",
      es: "Aprende a identificar y nombrar colores",
    },
    color: "#F97316",
    position: { row: 6, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-7-1",
        title: {
          en: "Primary Colors",
          es: "Colores Primarios",
        },
        description: {
          en: "Red, blue, yellow - the building blocks",
          es: "Rojo, azul, amarillo - los bloques básicos",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "primary colors",
            focusPoints: ["rojo", "azul", "amarillo"],
          },
          grammar: {
            topic: "color as adjective",
            focusPoints: ["color placement after noun", "el libro rojo"],
          },
        },
      },
      {
        id: "lesson-pre-a1-7-2",
        title: {
          en: "More Colors",
          es: "Más Colores",
        },
        description: {
          en: "Expand your color vocabulary",
          es: "Amplía tu vocabulario de colores",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["realtime", "reading"],
        content: {
          realtime: {
            scenario: "Describing colors around you",
            prompt: "Tell someone what colors you see around you",
            successCriteria:
              "The learner names at least three colors in conversation.",
          },
          reading: {
            topic: "additional colors",
            prompt: "Read descriptions of colorful paintings and identify the colors used",
          },
        },
      },
      {
        id: "lesson-pre-a1-7-3",
        title: {
          en: "Black, White & Neutral",
          es: "Negro, Blanco y Neutros",
        },
        description: {
          en: "Complete your color palette",
          es: "Completa tu paleta de colores",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["stories", "realtime"],
        content: {
          stories: {
            topic: "neutral colors",
            prompt: "A story about painting a room and choosing between light and dark colors",
          },
          realtime: {
            scenario: "Color preferences",
            prompt: "Discuss your favorite colors and describe what color things are",
            successCriteria:
              "The learner uses at least three color words including neutral colors.",
          },
        },
      },
      {
        id: "lesson-pre-a1-7-quiz",
        title: {
          en: "Colors Quiz",
          es: "Prueba de Colores",
        },
        description: {
          en: "Test your color recognition skills",
          es: "Pon a prueba tu reconocimiento de colores",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "colors review",
            focusPoints: ["all colors", "shades"],
          },
          grammar: {
            topic: "color usage",
            focusPoints: ["agreement", "placement"],
          },
        },
      },
      {
        id: "lesson-pre-a1-7-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review Colors by playing an interactive game",
          es: "Repasa Colores jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "Colors game review",
            unitTitle: "Colors",
            focusPoints: ["all colors", "shades", "agreement", "placement"],
          },
        },
      },
    ],
  },

  // Unit 8: What's Your Name?
  {
    id: "unit-pre-a1-introductions",
    title: {
      en: "What's Your Name?",
      es: "¿Cómo Te Llamas?",
    },
    description: {
      en: "Introduce yourself and ask others their names",
      es: "Preséntate y pregunta a otros sus nombres",
    },
    color: "#6366F1",
    position: { row: 7, offset: 0 },
    lessons: [
      {
        id: "lesson-pre-a1-8-1",
        title: {
          en: "Saying Your Name",
          es: "Decir Tu Nombre",
        },
        description: {
          en: "Learn to introduce yourself",
          es: "Aprende a presentarte",
        },
        xpRequired: 0,
        xpReward: 15,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "self introduction",
            focusPoints: ["me llamo", "soy", "mi nombre es"],
          },
          grammar: {
            topic: "introduction patterns",
            focusPoints: ["Me llamo + name", "Soy + name"],
          },
        },
      },
      {
        id: "lesson-pre-a1-8-2",
        title: {
          en: "Asking Names",
          es: "Preguntar Nombres",
        },
        description: {
          en: "Ask others what their name is",
          es: "Pregunta a otros cómo se llaman",
        },
        xpRequired: 10,
        xpReward: 15,
        modes: ["stories", "realtime"],
        content: {
          stories: {
            topic: "asking for names",
            prompt: "A story about a new student meeting classmates and learning their names",
          },
          realtime: {
            scenario: "Asking someone's name",
            prompt: "Meet someone new and ask what their name is",
            successCriteria:
              "The learner asks for the other person's name using an appropriate phrase.",
          },
        },
      },
      {
        id: "lesson-pre-a1-8-3",
        title: {
          en: "Nice to Meet You",
          es: "Mucho Gusto",
        },
        description: {
          en: "Complete the introduction with polite expressions",
          es: "Completa la presentación con expresiones corteses",
        },
        xpRequired: 20,
        xpReward: 15,
        modes: ["reading", "stories"],
        content: {
          reading: {
            topic: "meeting expressions",
            prompt: "Read a dialogue where two people meet for the first time and exchange polite greetings",
          },
          stories: {
            topic: "nice to meet you",
            prompt: "A story about a welcome party where everyone introduces themselves",
          },
        },
      },
      {
        id: "lesson-pre-a1-8-quiz",
        title: {
          en: "Introductions Quiz",
          es: "Prueba de Presentaciones",
        },
        description: {
          en: "Test your introduction skills",
          es: "Pon a prueba tus habilidades de presentación",
        },
        xpRequired: 30,
        xpReward: 25,
        isFinalQuiz: true,
        modes: ["vocabulary", "grammar"],
        content: {
          vocabulary: {
            topic: "introductions review",
            focusPoints: ["giving name", "asking name", "polite responses"],
          },
          grammar: {
            topic: "introduction patterns",
            focusPoints: ["formal/informal", "gender agreement"],
          },
        },
      },
      {
        id: "lesson-pre-a1-8-game",
        title: {
          en: "Game Review",
          es: "Repaso de Juego",
        },
        description: {
          en: "Review What's Your Name? by playing an interactive game",
          es: "Repasa ¿Cómo Te Llamas? jugando un juego interactivo",
        },
        xpRequired: 55,
        xpReward: 30,
        isGame: true,
        modes: ["game"],
        content: {
          game: {
            topic: "What's Your Name? game review",
            unitTitle: "What's Your Name?",
            focusPoints: ["giving name", "asking name", "polite responses", "formal/informal", "gender agreement"],
          },
        },
      },
    ],
  },
]);
