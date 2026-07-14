/**
 * Skill Tree Data Structure for Language Learning
 *
 * This defines the structured learning path with units and lessons.
 * Each unit contains multiple lessons that unlock progressively.
 *
 * Structure:
 * - Unit: A thematic grouping of lessons (e.g., "Basics 1", "Greetings")
 * - Lesson: Individual learning session combining multiple modes
 * - Skill: Completion state for a lesson (locked, available, in_progress, completed)
 */

import { withItalianSkillTreeText } from "./skillTree/italianLocalizer.js";
import { withFrenchSkillTreeText } from "./skillTree/frenchLocalizer.js";
import {
  translateSkillTreeTextToHindi,
  withHindiSkillTreeText,
} from "./skillTree/hindiLocalizer.js";
import { withJapaneseSkillTreeText } from "./skillTree/japaneseLocalizer.js";
import { withPortugueseSkillTreeText } from "./skillTree/portugueseLocalizer.js";
import { withArabicSkillTreeText } from "./skillTree/arabicLocalizer.js";
import { withChineseSkillTreeText } from "./skillTree/chineseLocalizer.js";
import { withGermanSkillTreeText } from "./skillTree/germanLocalizer.js";
import { tagGameLessonContent } from "../components/RPGGame/content/buckets.js";

const withLocalizedSkillTreeText = (skillTree) =>
  withArabicSkillTreeText(
    withChineseSkillTreeText(
      withHindiSkillTreeText(
        withJapaneseSkillTreeText(
          withFrenchSkillTreeText(
            withGermanSkillTreeText(
              withItalianSkillTreeText(withPortugueseSkillTreeText(skillTree)),
            ),
          ),
        ),
      ),
    ),
  );

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

/**
 * Learning path structure for each language
 * Organized by CEFR proficiency levels (A1, A2, B1, B2, C1, C2)
 *
 * A1: Absolute Beginner - Basic survival language
 * A2: Elementary - Simple everyday communication
 * B1: Intermediate - Handle most everyday situations
 * B2: Upper Intermediate - Abstract topics and complex discussions
 * C1: Advanced - Flexible, sophisticated language use
 * C2: Mastery - Near-native proficiency
 */
const baseLearningPath = withLocalizedSkillTreeText({
  "Pre-A1": [
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
            en: "Learn basic introductions and goodbyes",
            es: "Aprende introducciones y despedidas básicas",
          },
          xpRequired: 0,
          xpReward: 1,
          isTutorial: true,
          modes: [
            "vocabulary",
            "grammar",
            "reading",
            "stories",
            "realtime",
            "game",
          ],
          content: {
            vocabulary: {
              topic: "tutorial",
              focusPoints: [
                "hello",
                "my name is",
                "good morning",
                "good afternoon",
                "good night",
                "how are you",
                "goodbye",
              ],
              tutorialDescription: {
                en: "Learn first introduction and goodbye phrases with interactive questions.",
                es: "Aprende tus primeras frases de introducción y despedida con preguntas interactivas.",
              },
            },
            grammar: {
              topic: "tutorial",
              focusPoints: [
                "basic introduction patterns",
                "time-based greetings",
                "simple wellbeing questions",
                "basic goodbye phrases",
              ],
              tutorialDescription: {
                en: "Practice simple patterns for introductions, greetings, and goodbyes.",
                es: "Practica patrones simples para introducciones, saludos y despedidas.",
              },
            },
            reading: {
              topic: "tutorial",
              prompt:
                'Use only this short welcome: "Hello, good morning. My name is Piyali. How are you? Excited to learn how to speak <target language>?"',
            },
            stories: {
              topic: "tutorial",
              prompt: "Practice basic introductions and goodbyes in a story",
              tutorialDescription: {
                en: "Practice basic introductions and goodbyes in a short interactive story.",
                es: "Practica introducciones y despedidas básicas en una historia interactiva corta.",
              },
            },
            realtime: {
              topic: "tutorial",
              scenario: "Learn basic introductions and goodbyes",
              prompt:
                "Practice hello, my name is, good morning, good afternoon, good night, how are you, and goodbye",
              successCriteria:
                "The learner makes understandable attempts at hello, my name is, good morning, good afternoon, good night, how are you, and goodbye.",
              successCriteria_es:
                'El estudiante intenta de forma comprensible decir "hola", "me llamo", "buenos días", "buenas tardes", "buenas noches", "¿cómo estás?" y "adiós".',
              successCriteria_pt:
                'O aluno tenta de forma compreensível dizer "olá", "meu nome é", "bom dia", "boa tarde", "boa noite", "como você está?" e "adeus".',
              successCriteria_fr:
                'L\'apprenant essaie de dire de façon compréhensible "bonjour", "je m\'appelle", "bonjour", "bon après-midi", "bonne nuit", "comment ça va ?" et "au revoir".',
              successCriteria_it:
                'L\'apprendente prova in modo comprensibile a dire "ciao", "mi chiamo", "buongiorno", "buon pomeriggio", "buonanotte", "come stai?" e "arrivederci".',
              successCriteria_nl:
                'De leerling probeert begrijpelijk "hallo", "mijn naam is", "goedemorgen", "goedemiddag", "goedenacht", "hoe gaat het?" en "tot ziens" te zeggen.',
              successCriteria_nah:
                "The learner makes understandable attempts at the basic introduction agenda.",
              successCriteria_ja:
                "The learner makes understandable attempts at the basic introduction agenda.",
              tutorialDescription: {
                en: "Practice basic introductions and goodbyes in a realtime tutoring session.",
                es: "Practica introducciones y despedidas básicas en una sesión de tutoría en tiempo real.",
              },
            },
            game: {
              topic: "tutorial",
              unitTitle: "Getting Started",
              sceneId: "tutorialPlaza",
              xpReward: 30,
              focusPoints: [
                "hello",
                "my name is",
                "good morning",
                "good afternoon",
                "good night",
                "how are you",
                "goodbye",
              ],
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
          title: { en: "My Family", es: "Mi Familia" },
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
          title: { en: "More Family", es: "Más Familia" },
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
              prompt:
                "Tell someone about your grandparents and extended family",
              successCriteria:
                "The learner names at least two extended family members.",
            },
            stories: {
              topic: "extended family",
              prompt:
                "A story about visiting grandparents and meeting extended family",
            },
          },
        },
        {
          id: "lesson-pre-a1-1-3",
          title: { en: "People Around Me", es: "Personas a Mi Alrededor" },
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
      ],
    },
    // Unit 2: Numbers 0-10
    {
      id: "unit-pre-a1-numbers",
      title: { en: "Numbers 0-10", es: "Números 0-10" },
      description: {
        en: "Count from zero to ten",
        es: "Cuenta del cero al diez",
      },
      color: "#EC4899",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-2-1",
          title: { en: "Zero to Five", es: "Cero a Cinco" },
          description: { en: "Learn numbers 0-5", es: "Aprende números 0-5" },
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
              focusPoints: ["counting objects"],
            },
          },
        },
        {
          id: "lesson-pre-a1-2-2",
          title: { en: "Six to Ten", es: "Seis a Diez" },
          description: {
            en: "Complete counting to ten",
            es: "Completa el conteo hasta diez",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["stories", "reading"],
          content: {
            stories: {
              topic: "numbers 6-10",
              prompt:
                "A story about counting items at a market from six to ten",
            },
            reading: {
              topic: "numbers 6-10",
              prompt: "Read a short passage that uses numbers six through ten",
            },
          },
        },
        {
          id: "lesson-pre-a1-2-3",
          title: { en: "Counting Objects", es: "Contando Objetos" },
          description: {
            en: "Use numbers to count things",
            es: "Usa números para contar cosas",
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
              prompt:
                "A short story about a child counting toys and sharing them",
            },
          },
        },
        {
          id: "lesson-pre-a1-2-quiz",
          title: { en: "Numbers Quiz", es: "Prueba de Números" },
          description: {
            en: "Test counting 0-10",
            es: "Prueba de contar 0-10",
          },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "numbers review", focusPoints: ["0-10"] },
            grammar: { topic: "number usage", focusPoints: ["quantities"] },
          },
        },
      ],
    },
    // Unit 3: Hello & Goodbye
    {
      id: "unit-pre-a1-greetings",
      title: { en: "Hello & Goodbye", es: "Hola y Adiós" },
      description: {
        en: "Basic greetings and farewells",
        es: "Saludos y despedidas básicas",
      },
      color: "#10B981",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-3-1",
          title: { en: "Saying Hello", es: "Decir Hola" },
          description: {
            en: "Different ways to greet people",
            es: "Diferentes formas de saludar",
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
              focusPoints: ["time-appropriate greetings"],
            },
          },
        },
        {
          id: "lesson-pre-a1-3-2",
          title: { en: "Saying Goodbye", es: "Decir Adiós" },
          description: {
            en: "Farewell expressions",
            es: "Expresiones de despedida",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "farewells",
              prompt:
                "Read a short dialogue where friends say goodbye in different ways",
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
          title: { en: "Greetings in Context", es: "Saludos en Contexto" },
          description: {
            en: "Practice in real situations",
            es: "Practica en situaciones reales",
          },
          xpRequired: 20,
          xpReward: 15,
          modes: ["stories", "reading"],
          content: {
            stories: {
              topic: "greetings in context",
              prompt:
                "A story about arriving at a party and greeting everyone differently",
            },
            reading: {
              topic: "greeting conversations",
              prompt:
                "Read a scene where people greet each other at different times of day",
            },
          },
        },
        {
          id: "lesson-pre-a1-3-quiz",
          title: { en: "Greetings Quiz", es: "Prueba de Saludos" },
          description: { en: "Test greeting skills", es: "Prueba de saludos" },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "greetings review",
              focusPoints: ["all greetings/farewells"],
            },
            grammar: {
              topic: "greeting rules",
              focusPoints: ["appropriate usage"],
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
        en: "Essential single-word responses",
        es: "Respuestas esenciales de una palabra",
      },
      color: "#F59E0B",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-4-1",
          title: { en: "Yes and No", es: "Sí y No" },
          description: {
            en: "The most important words",
            es: "Las palabras más importantes",
          },
          xpRequired: 0,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "affirmative/negative",
              focusPoints: ["sí", "no", "claro", "vale"],
            },
            grammar: {
              topic: "response patterns",
              focusPoints: ["answering yes/no questions"],
            },
          },
        },
        {
          id: "lesson-pre-a1-4-2",
          title: { en: "Maybe and I Don't Know", es: "Quizás y No Sé" },
          description: {
            en: "Express uncertainty",
            es: "Expresa incertidumbre",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "Expressing uncertainty",
              prompt:
                "Practice responding with maybe, I don't know, and other uncertain phrases",
              successCriteria:
                "The learner uses at least two uncertainty expressions.",
            },
            stories: {
              topic: "uncertainty expressions",
              prompt:
                "A story about someone who can't decide what to eat for lunch",
            },
          },
        },
        {
          id: "lesson-pre-a1-4-3",
          title: { en: "Quick Responses", es: "Respuestas Rápidas" },
          description: { en: "React naturally", es: "Reacciona naturalmente" },
          xpRequired: 20,
          xpReward: 15,
          modes: ["reading", "stories"],
          content: {
            reading: {
              topic: "reaction words",
              prompt:
                "Read a text message conversation full of reactions and exclamations",
            },
            stories: {
              topic: "quick responses",
              prompt: "A story about friends reacting to surprising news",
            },
          },
        },
        {
          id: "lesson-pre-a1-4-quiz",
          title: { en: "Responses Quiz", es: "Prueba de Respuestas" },
          description: {
            en: "Test response skills",
            es: "Prueba de respuestas",
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
      ],
    },
    // Unit 5: Please & Thank You
    {
      id: "unit-pre-a1-courtesy",
      title: { en: "Please & Thank You", es: "Por Favor y Gracias" },
      description: {
        en: "Essential courtesy expressions",
        es: "Expresiones de cortesía esenciales",
      },
      color: "#EF4444",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-5-1",
          title: { en: "Please and Thank You", es: "Por Favor y Gracias" },
          description: {
            en: "Magic words that open doors",
            es: "Palabras mágicas que abren puertas",
          },
          xpRequired: 0,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "basic courtesy",
              focusPoints: [
                "por favor",
                "gracias",
                "muchas gracias",
                "de nada",
              ],
            },
            grammar: {
              topic: "polite requests",
              focusPoints: ["adding por favor"],
            },
          },
        },
        {
          id: "lesson-pre-a1-5-2",
          title: { en: "Sorry and Excuse Me", es: "Perdón y Disculpe" },
          description: {
            en: "Apologize politely",
            es: "Discúlpate educadamente",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: {
              topic: "apologies",
              prompt:
                "A story about someone who accidentally bumps into people and apologizes",
            },
            realtime: {
              scenario: "Apologizing and excusing yourself",
              prompt:
                "Practice saying sorry and excuse me in different situations",
              successCriteria:
                "The learner uses apology and attention phrases appropriately.",
            },
          },
        },
        {
          id: "lesson-pre-a1-5-3",
          title: { en: "Polite Expressions", es: "Expresiones Corteses" },
          description: {
            en: "Additional gracious phrases",
            es: "Frases corteses adicionales",
          },
          xpRequired: 20,
          xpReward: 15,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "polite expressions",
              prompt:
                "Read a scene where people exchange gracious phrases at a restaurant",
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
          title: { en: "Courtesy Quiz", es: "Prueba de Cortesía" },
          description: {
            en: "Test polite expressions",
            es: "Prueba de expresiones corteses",
          },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "courtesy review",
              focusPoints: ["please/thank you", "apologies"],
            },
            grammar: {
              topic: "courtesy usage",
              focusPoints: ["appropriate situations"],
            },
          },
        },
      ],
    },
    // Unit 6: Common Objects
    {
      id: "unit-pre-a1-objects",
      title: { en: "Common Objects", es: "Objetos Comunes" },
      description: {
        en: "Name everyday things",
        es: "Nombra las cosas cotidianas",
      },
      color: "#06B6D4",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-6-1",
          title: { en: "Things at Home", es: "Cosas en Casa" },
          description: {
            en: "Common household items",
            es: "Artículos comunes del hogar",
          },
          xpRequired: 0,
          xpReward: 15,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "household items",
              focusPoints: ["mesa", "silla", "puerta", "ventana", "cama"],
            },
            grammar: { topic: "articles with objects", focusPoints: ["el/la"] },
          },
        },
        {
          id: "lesson-pre-a1-6-2",
          title: { en: "Personal Items", es: "Artículos Personales" },
          description: {
            en: "Things you carry daily",
            es: "Cosas que llevas cada día",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["reading", "stories"],
          content: {
            reading: {
              topic: "personal items",
              prompt:
                "Read about someone describing what they carry in their bag",
            },
            stories: {
              topic: "personal items",
              prompt:
                "A story about someone who lost their keys and searches for them",
            },
          },
        },
        {
          id: "lesson-pre-a1-6-3",
          title: { en: "Food and Drink", es: "Comida y Bebida" },
          description: {
            en: "Basic food vocabulary",
            es: "Vocabulario básico de comida",
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
              prompt:
                "Read a simple café menu and identify common food and drink items",
            },
          },
        },
        {
          id: "lesson-pre-a1-6-quiz",
          title: { en: "Objects Quiz", es: "Prueba de Objetos" },
          description: {
            en: "Test object vocabulary",
            es: "Prueba de vocabulario de objetos",
          },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "objects review",
              focusPoints: ["household", "personal", "food"],
            },
            grammar: {
              topic: "object naming",
              focusPoints: ["articles", "gender"],
            },
          },
        },
      ],
    },
    // Unit 7: Colors
    {
      id: "unit-pre-a1-colors",
      title: { en: "Colors", es: "Colores" },
      description: {
        en: "Identify and name colors",
        es: "Identifica y nombra colores",
      },
      color: "#F97316",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-7-1",
          title: { en: "Primary Colors", es: "Colores Primarios" },
          description: { en: "Red, blue, yellow", es: "Rojo, azul, amarillo" },
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
              focusPoints: ["el libro rojo"],
            },
          },
        },
        {
          id: "lesson-pre-a1-7-2",
          title: { en: "More Colors", es: "Más Colores" },
          description: { en: "Expand your palette", es: "Amplía tu paleta" },
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
              prompt:
                "Read descriptions of colorful paintings and identify the colors used",
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
            en: "Complete your palette",
            es: "Completa tu paleta",
          },
          xpRequired: 20,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: {
              topic: "neutral colors",
              prompt:
                "A story about painting a room and choosing between light and dark colors",
            },
            realtime: {
              scenario: "Color preferences",
              prompt:
                "Discuss your favorite colors and describe what color things are",
              successCriteria:
                "The learner uses at least three color words including neutral colors.",
            },
          },
        },
        {
          id: "lesson-pre-a1-7-quiz",
          title: { en: "Colors Quiz", es: "Prueba de Colores" },
          description: {
            en: "Test color knowledge",
            es: "Prueba de conocimiento de colores",
          },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: { topic: "colors review", focusPoints: ["all colors"] },
            grammar: {
              topic: "color usage",
              focusPoints: ["agreement", "placement"],
            },
          },
        },
      ],
    },
    // Unit 8: What's Your Name?
    {
      id: "unit-pre-a1-introductions",
      title: { en: "What's Your Name?", es: "¿Cómo Te Llamas?" },
      description: { en: "Introduce yourself", es: "Preséntate" },
      color: "#6366F1",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-8-1",
          title: { en: "Saying Your Name", es: "Decir Tu Nombre" },
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
              focusPoints: ["Me llamo + name"],
            },
          },
        },
        {
          id: "lesson-pre-a1-8-2",
          title: { en: "Asking Names", es: "Preguntar Nombres" },
          description: {
            en: "Ask others their name",
            es: "Pregunta a otros su nombre",
          },
          xpRequired: 10,
          xpReward: 15,
          modes: ["stories", "realtime"],
          content: {
            stories: {
              topic: "asking for names",
              prompt:
                "A story about a new student meeting classmates and learning their names",
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
          title: { en: "Nice to Meet You", es: "Mucho Gusto" },
          description: {
            en: "Complete the introduction",
            es: "Completa la presentación",
          },
          xpRequired: 20,
          xpReward: 15,
          modes: ["reading", "stories"],
          content: {
            reading: {
              topic: "meeting expressions",
              prompt:
                "Read a dialogue where two people meet for the first time and exchange polite greetings",
            },
            stories: {
              topic: "nice to meet you",
              prompt:
                "A story about a welcome party where everyone introduces themselves",
            },
          },
        },
        {
          id: "lesson-pre-a1-8-quiz",
          title: { en: "Introductions Quiz", es: "Prueba de Presentaciones" },
          description: {
            en: "Test introduction skills",
            es: "Prueba de presentaciones",
          },
          xpRequired: 30,
          xpReward: 25,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "introductions review",
              focusPoints: ["giving name", "asking name"],
            },
            grammar: {
              topic: "introduction patterns",
              focusPoints: ["formal/informal"],
            },
          },
        },
      ],
    },
    // Unit: First Words (moved from A1)
    {
      id: "unit-a1-1",
      title: {
        en: "First Words",
        es: "Primeras Palabras",
      },
      description: {
        en: "Your very first words",
        es: "Tus primeras palabras",
      },
      color: "#22C55E",
      position: { row: 8, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-1-1",
          title: { en: "Hello and Goodbye", es: "Hola y Adiós" },
          description: {
            en: "Learn essential greetings and farewells",
            es: "Aprende saludos y despedidas esenciales",
          },
          xpRequired: 0,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "greetings and polite words",
              focusPoints: [
                "hola, buenos días, buenas tardes/noches",
                "adiós, hasta luego",
                "por favor, gracias, de nada",
              ],
            },
            grammar: {
              topic: "greeting people formally and informally",
              focusPoints: [
                "¿cómo estás? (informal) vs ¿cómo está usted? (formal)",
                "me llamo... / soy...",
                "mucho gusto, encantado/a",
              ],
            },
          },
        },
        {
          id: "lesson-a1-1-2",
          title: { en: "Meeting Someone New", es: "Conocer a Alguien Nuevo" },
          description: {
            en: "Practice greetings in real conversations",
            es: "Practica saludos en conversaciones reales",
          },
          xpRequired: 10,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "meeting someone new and saying hello",
              prompt: "Practice greetings and introductions: 'hola, me llamo...'",
            },
            stories: {
              topic: "a first conversation",
              prompt: "Read a short greeting dialogue and discuss it",
            },
          },
        },
        {
          id: "lesson-a1-1-3",
          title: { en: "Advanced Greetings", es: "Saludos Avanzados" },
          description: {
            en: "Master formal and informal greetings",
            es: "Domina saludos formales e informales",
          },
          xpRequired: 20,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "formal vs informal greetings",
              prompt: "Read and notice when to use tú vs usted in greetings",
            },
            realtime: {
              scenario: "greeting a friend vs a stranger",
              prompt: "Demonstrate greetings and introductions in the right register",
            },
          },
        },
        {
          id: "lesson-a1-1-quiz",
          title: { en: "First Words Quiz", es: "Prueba de Primeras Palabras" },
          description: {
            en: "Test your knowledge of first words",
            es: "Prueba tus conocimientos de primeras palabras",
          },
          xpRequired: 30,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 10, passingScore: 8 },
          content: {
            vocabulary: {
              topic: "greetings and polite words",
              focusPoints: [
                "hola, adiós, gracias, por favor",
                "me llamo..., mucho gusto",
              ],
            },
            grammar: {
              topics: [
                "greeting people formally and informally",
              ],
              focusPoints: [
                "¿cómo estás? vs ¿cómo está usted?",
              ],
            },
          },
        },
      ],
    },
    // Unit: Numbers 0-20 (moved from A1)
    {
      id: "unit-a1-3",
      title: {
        en: "Numbers 0-20",
        es: "Números 0-20",
      },
      description: {
        en: "Count to twenty",
        es: "Cuenta hasta veinte",
      },
      color: "#F59E0B",
      position: { row: 9, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-3-1",
          title: { en: "Counting to Twenty", es: "Contando hasta Veinte" },
          description: {
            en: "Learn to count from zero to twenty",
            es: "Aprende a contar desde cero hasta veinte",
          },
          xpRequired: 0,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "numbers 0-20",
              focusPoints: [
                "cero, uno, dos, tres, cuatro, cinco",
                "seis, siete, ocho, nueve, diez",
                "once, doce... veinte",
              ],
            },
            grammar: {
              topic: "using numbers to count and quantify",
              focusPoints: [
                "hay + number (hay tres libros)",
                "un/una vs uno",
                "¿cuántos/cuántas hay?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-3-2",
          title: {
            en: "Using Numbers Daily",
            es: "Usando Números Diariamente",
          },
          description: {
            en: "Practice numbers in everyday situations",
            es: "Practica números en situaciones cotidianas",
          },
          xpRequired: 10,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "counting things out loud with a friend",
              prompt: "Practice numbers 0-20 with 'hay' and '¿cuántos hay?'",
            },
            stories: {
              topic: "numbers in everyday life",
              prompt: "Read a short text with numbers and discuss the quantities",
            },
          },
        },
        {
          id: "lesson-a1-3-3",
          title: {
            en: "Phone Numbers and Ages",
            es: "Números de Teléfono y Edades",
          },
          description: {
            en: "Apply numbers to phone numbers and ages",
            es: "Aplica números a teléfonos y edades",
          },
          xpRequired: 20,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "numbers in prices and quantities",
              prompt: "Read and say numbers in counts and simple prices",
            },
            realtime: {
              scenario: "telling someone how many you have",
              prompt: "Demonstrate numbers 0-20 to count and quantify",
            },
          },
        },
        {
          id: "lesson-a1-3-quiz",
          title: { en: "Numbers 0-20 Quiz", es: "Prueba de Números 0-20" },
          description: {
            en: "Test your knowledge of numbers 0-20",
            es: "Prueba tus conocimientos de números 0-20",
          },
          xpRequired: 30,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 10, passingScore: 8 },
          content: {
            vocabulary: {
              topic: "numbers 0-20",
              focusPoints: [
                "cero a diez",
                "once a veinte",
              ],
            },
            grammar: {
              topics: [
                "counting and quantifying",
              ],
              focusPoints: [
                "hay + number",
                "¿cuántos hay?",
              ],
            },
          },
        },
      ],
    },
    // Unit: Numbers 21-100 (moved from A1)
    {
      id: "unit-a1-4",
      title: {
        en: "Numbers 21-100",
        es: "Números 21-100",
      },
      description: {
        en: "Larger numbers",
        es: "Números más grandes",
      },
      color: "#8B5CF6",
      position: { row: 10, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-4-1",
          title: { en: "Counting to One Hundred", es: "Contando hasta Cien" },
          description: {
            en: "Learn to count from twenty-one to one hundred",
            es: "Aprende a contar desde veintiuno hasta cien",
          },
          xpRequired: 0,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "numbers 21-100",
              focusPoints: [
                "veintiuno, treinta, cuarenta, cincuenta",
                "sesenta, setenta, ochenta, noventa, cien",
                "compounds: treinta y cinco, cuarenta y dos",
              ],
            },
            grammar: {
              topic: "forming numbers 21-100",
              focusPoints: [
                "y in compounds (cuarenta y dos)",
                "cien vs ciento",
                "agreement: veintiún libros, veintiuna casas",
              ],
            },
          },
        },
        {
          id: "lesson-a1-4-2",
          title: { en: "Prices and Money", es: "Precios y Dinero" },
          description: {
            en: "Practice using larger numbers with prices and money",
            es: "Practica usando números grandes con precios y dinero",
          },
          xpRequired: 10,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "exchanging phone numbers and prices",
              prompt: "Practice numbers 21-100 with prices, ages, and phone numbers",
            },
            stories: {
              topic: "numbers in prices and quantities",
              prompt: "Read prices and amounts and say the numbers aloud",
            },
          },
        },
        {
          id: "lesson-a1-4-3",
          title: {
            en: "Big Numbers in Context",
            es: "Números Grandes en Contexto",
          },
          description: {
            en: "Apply larger numbers in real-life contexts",
            es: "Aplica números grandes en contextos de la vida real",
          },
          xpRequired: 20,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "larger numbers in real contexts",
              prompt: "Read larger numbers (prices, years, quantities) and interpret them",
            },
            realtime: {
              scenario: "saying totals, ages, and years",
              prompt: "Demonstrate numbers 21-100 in prices, ages, and quantities",
            },
          },
        },
        {
          id: "lesson-a1-4-quiz",
          title: { en: "Numbers 21-100 Quiz", es: "Prueba de Números 21-100" },
          description: {
            en: "Test your knowledge of numbers 21-100",
            es: "Prueba tus conocimientos de números 21-100",
          },
          xpRequired: 30,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: { questionsRequired: 10, passingScore: 8 },
          content: {
            vocabulary: {
              topic: "numbers 21-100",
              focusPoints: [
                "veintiuno a cien",
                "compound numbers",
              ],
            },
            grammar: {
              topics: [
                "forming numbers 21-100",
              ],
              focusPoints: [
                "y in compounds",
                "cien vs ciento",
              ],
            },
          },
        },
      ],
    },
    // Unit: Pre-A1 Foundations (moved from A1 - now last in Pre-A1)
    {
      id: "unit-pre-a1-foundations",
      title: {
        en: "Pre-A1 Foundations",
        es: "Fundamentos Pre-A1",
      },
      description: {
        en: "100 must-know words and phrases to start fast",
        es: "100 palabras y frases imprescindibles para empezar rápido",
      },
      color: "#10B981",
      position: { row: 11, offset: 0 },
      lessons: [
        {
          id: "lesson-pre-a1-f-1",
          title: { en: "Everyday Starters", es: "Arranques Cotidianos" },
          description: {
            en: "Your first 20 high-frequency words for greetings and basics",
            es: "Tus primeras 20 palabras de alta frecuencia para saludos y básicos",
          },
          xpRequired: 0,
          xpReward: 25,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "greetings and starters",
              focusPoints: ["hello/bye variations", "thanks/please", "yes/no"],
            },
            grammar: {
              topic: "formula chunks",
              focusPoints: ["basic greeting patterns"],
            },
          },
        },
        {
          id: "lesson-pre-a1-f-2",
          title: { en: "People & Places", es: "Personas y Lugares" },
          description: {
            en: "Add 20 words for names, family, and moving around",
            es: "Suma 20 palabras para nombres, familia y moverte por ahí",
          },
          xpRequired: 10,
          xpReward: 25,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "people and places",
              focusPoints: ["family", "locations", "getting attention"],
            },
            grammar: {
              topic: "formula chunks",
              focusPoints: ["I am/from", "This is", "Where is?"],
            },
          },
        },
        {
          id: "lesson-pre-a1-f-3",
          title: { en: "Actions & Essentials", es: "Acciones y Esenciales" },
          description: {
            en: "20 everyday verbs and short requests to get things done",
            es: "20 verbos cotidianos y peticiones cortas para lograr cosas",
          },
          xpRequired: 20,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "actions and needs",
              focusPoints: ["common verbs", "requests", "need/want"],
            },
            grammar: {
              topic: "action phrases",
              focusPoints: ["basic verb usage"],
            },
          },
        },
        {
          id: "lesson-pre-a1-f-4",
          title: {
            en: "Time, Travel & Directions",
            es: "Tiempo, Viajes y Direcciones",
          },
          description: {
            en: "20 words for time, transport, and finding your way",
            es: "20 palabras para tiempo, transporte y orientarte",
          },
          xpRequired: 30,
          xpReward: 30,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "time and movement",
              focusPoints: ["days and hours", "here/there", "left/right"],
            },
            grammar: {
              topic: "direction phrases",
              focusPoints: ["basic direction patterns"],
            },
          },
        },
        {
          id: "lesson-pre-a1-f-quiz",
          title: { en: "Foundations Quiz", es: "Prueba de Fundamentos" },
          description: {
            en: "Round out 100 words with connectors, feelings, and quick questions",
            es: "Completa 100 palabras con conectores, emociones y preguntas rápidas",
          },
          xpRequired: 40,
          xpReward: 35,
          isFinalQuiz: true,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "connectors and questions",
              focusPoints: [
                "and/but/because",
                "how/what/where",
                "feeling words",
              ],
            },
            grammar: {
              topic: "foundation review",
              focusPoints: ["all patterns"],
            },
          },
        },
      ],
    },
  ],
  A1: [
    {
      id: "unit-a1-5",
      title: {
        en: "Days of Week",
        es: "Días de la Semana",
      },
      description: {
        en: "Learn the days",
        es: "Aprende los días",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-5-1",
          title: {
            en: "Monday to Sunday",
            es: "Lunes a Domingo",
          },
          description: {
            en: "Learn key vocabulary for days of week",
            es: "Aprende vocabulario clave para días de la semana",
          },
          xpRequired: 410,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the days of the week",
              focusPoints: [
                "lunes, martes, miércoles, jueves",
                "viernes, sábado, domingo",
                "hoy, mañana, ayer",
              ],
            },
            grammar: {
              topic: "talking about days",
              focusPoints: [
                "el lunes (on Monday) vs los lunes (on Mondays)",
                "el fin de semana",
                "¿qué día es hoy?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-5-2",
          title: {
            en: "What Day Is It?",
            es: "¿Qué Día Es?",
          },
          description: {
            en: "Practice days of week in conversation",
            es: "Practica días de la semana en conversación",
          },
          xpRequired: 425,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "planning which day to meet",
              prompt: "Practice the days of the week with 'el' and 'los'",
            },
            stories: {
              topic: "a weekly schedule",
              prompt: "Read a simple schedule and discuss what happens each day",
            },
          },
        },
        {
          id: "lesson-a1-5-3",
          title: {
            en: "Planning Your Week",
            es: "Planificando Tu Semana",
          },
          description: {
            en: "Apply days of week skills",
            es: "Aplica habilidades de días de la semana",
          },
          xpRequired: 440,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "days and routines",
              prompt: "Read about a weekly routine and notice the days",
            },
            realtime: {
              scenario: "describing your typical week",
              prompt: "Demonstrate the days of the week to talk about your week",
            },
          },
        },
        {
          id: "lesson-a1-5-quiz",
          title: {
            en: "Days of Week Quiz",
            es: "Prueba de Días de la Semana",
          },
          description: {
            en: "Test your knowledge of days of week",
            es: "Prueba tus conocimientos de días de la semana",
          },
          xpRequired: 455,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the days of the week",
              focusPoints: [
                "lunes a domingo",
                "hoy, mañana, ayer",
              ],
            },
            grammar: {
              topics: [
                "talking about days",
              ],
              focusPoints: [
                "el lunes vs los lunes",
                "¿qué día es hoy?",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-6",
      title: {
        en: "Months & Dates",
        es: "Meses y Fechas",
      },
      description: {
        en: "Calendar basics",
        es: "Conceptos del calendario",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-6-1",
          title: {
            en: "Twelve Months",
            es: "Doce Meses",
          },
          description: {
            en: "Learn key vocabulary for months & dates",
            es: "Aprende vocabulario clave para meses y fechas",
          },
          xpRequired: 485,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "months and dates",
              focusPoints: [
                "enero, febrero, marzo... diciembre",
                "las estaciones: primavera, verano, otoño, invierno",
                "el cumpleaños",
              ],
            },
            grammar: {
              topic: "saying the date",
              focusPoints: [
                "el + number + de + month (el 5 de mayo)",
                "¿qué fecha es hoy?",
                "¿cuándo es tu cumpleaños?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-6-2",
          title: {
            en: "When's Your Birthday?",
            es: "¿Cuándo Es Tu Cumpleaños?",
          },
          description: {
            en: "Practice months & dates in conversation",
            es: "Practica meses y fechas en conversación",
          },
          xpRequired: 500,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "asking when someone's birthday is",
              prompt: "Practice months and dates: 'mi cumpleaños es el ... de ...'",
            },
            stories: {
              topic: "important dates and holidays",
              prompt: "Read about dates in the year and discuss them",
            },
          },
        },
        {
          id: "lesson-a1-6-3",
          title: {
            en: "Important Dates",
            es: "Fechas Importantes",
          },
          description: {
            en: "Apply months & dates skills",
            es: "Aplica habilidades de meses y fechas",
          },
          xpRequired: 515,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "dates in invitations and plans",
              prompt: "Read an invitation and find the date",
            },
            realtime: {
              scenario: "scheduling an event by date",
              prompt: "Demonstrate months and dates to set a day",
            },
          },
        },
        {
          id: "lesson-a1-6-quiz",
          title: {
            en: "Months & Dates Quiz",
            es: "Prueba de Meses y Fechas",
          },
          description: {
            en: "Test your knowledge of months & dates",
            es: "Prueba tus conocimientos de meses y fechas",
          },
          xpRequired: 530,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "months and dates",
              focusPoints: [
                "enero a diciembre",
                "las cuatro estaciones",
              ],
            },
            grammar: {
              topics: [
                "saying the date",
              ],
              focusPoints: [
                "el + número + de + mes",
                "¿qué fecha es hoy?",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-7",
      title: {
        en: "Telling Time",
        es: "Decir la Hora",
      },
      description: {
        en: "What time is it?",
        es: "¿Qué hora es?",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-7-1",
          title: {
            en: "What Time Is It?",
            es: "¿Qué Hora Es?",
          },
          description: {
            en: "Learn key vocabulary for telling time",
            es: "Aprende vocabulario clave para decir la hora",
          },
          xpRequired: 560,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "telling the time",
              focusPoints: [
                "la hora, el minuto",
                "y cuarto, y media, menos cuarto",
                "de la mañana / de la tarde / de la noche",
              ],
            },
            grammar: {
              topic: "asking and saying the time",
              focusPoints: [
                "¿qué hora es?",
                "es la una vs son las dos",
                "a las + time (a las tres)",
              ],
            },
          },
        },
        {
          id: "lesson-a1-7-2",
          title: {
            en: "Daily Schedule",
            es: "Horario Diario",
          },
          description: {
            en: "Practice telling time in conversation",
            es: "Practica decir la hora en conversación",
          },
          xpRequired: 575,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "asking what time a place opens",
              prompt: "Practice '¿qué hora es?' and 'a las...' for times",
            },
            stories: {
              topic: "a daily timetable",
              prompt: "Read a schedule with times and discuss it",
            },
          },
        },
        {
          id: "lesson-a1-7-3",
          title: {
            en: "Making Appointments",
            es: "Haciendo Citas",
          },
          description: {
            en: "Apply telling time skills",
            es: "Aplica habilidades de decir la hora",
          },
          xpRequired: 590,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "times of events and routines",
              prompt: "Read and say the times in a daily plan",
            },
            realtime: {
              scenario: "arranging to meet at a specific time",
              prompt: "Demonstrate telling the time and using 'a las...'",
            },
          },
        },
        {
          id: "lesson-a1-7-quiz",
          title: {
            en: "Telling Time Quiz",
            es: "Prueba de Decir la Hora",
          },
          description: {
            en: "Test your knowledge of telling time",
            es: "Prueba tus conocimientos de decir la hora",
          },
          xpRequired: 605,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "telling the time",
              focusPoints: [
                "y cuarto, y media, menos cuarto",
                "de la mañana/tarde/noche",
              ],
            },
            grammar: {
              topics: [
                "asking and saying the time",
              ],
              focusPoints: [
                "es la una vs son las dos",
                "a las + hora",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-8",
      title: {
        en: "Family Members",
        es: "Familia",
      },
      description: {
        en: "Your family",
        es: "Tu familia",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-8-1",
          title: {
            en: "My Family Tree",
            es: "Mi Árbol Genealógico",
          },
          description: {
            en: "Learn key vocabulary for family members",
            es: "Aprende vocabulario clave para familia",
          },
          xpRequired: 635,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "family members",
              focusPoints: [
                "madre, padre, hermano, hermana",
                "abuelo/a, tío/a, primo/a",
                "hijo/a, esposo/a",
              ],
            },
            grammar: {
              topic: "talking about your family",
              focusPoints: [
                "possessives: mi, tu, su, nuestro",
                "tener (tengo dos hermanos)",
                "gender and plural of family nouns",
              ],
            },
          },
        },
        {
          id: "lesson-a1-8-2",
          title: {
            en: "Talking About Family",
            es: "Hablando de la Familia",
          },
          description: {
            en: "Practice family members in conversation",
            es: "Practica familia en conversación",
          },
          xpRequired: 650,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "introducing your family to a friend",
              prompt: "Practice family words with 'mi/tu' and 'tener'",
            },
            stories: {
              topic: "a family description",
              prompt: "Read about someone's family and discuss the relationships",
            },
          },
        },
        {
          id: "lesson-a1-8-3",
          title: {
            en: "Family Relationships",
            es: "Relaciones Familiares",
          },
          description: {
            en: "Apply family members skills",
            es: "Aplica habilidades de familia",
          },
          xpRequired: 665,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "family relationships",
              prompt: "Read a family tree description and identify who is who",
            },
            realtime: {
              scenario: "describing your own family",
              prompt: "Demonstrate family vocabulary with possessives and 'tener'",
            },
          },
        },
        {
          id: "lesson-a1-8-quiz",
          title: {
            en: "Family Members Quiz",
            es: "Prueba de Familia",
          },
          description: {
            en: "Test your knowledge of family members",
            es: "Prueba tus conocimientos de familia",
          },
          xpRequired: 680,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "family members",
              focusPoints: [
                "madre, padre, hermano/a",
                "abuelos, tíos, primos",
              ],
            },
            grammar: {
              topics: [
                "talking about your family",
              ],
              focusPoints: [
                "possessives mi/tu/su",
                "tener + family",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-9",
      title: {
        en: "Colors & Shapes",
        es: "Colores y Formas",
      },
      description: {
        en: "Describe visually",
        es: "Describe visualmente",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-9-1",
          title: {
            en: "Rainbow Colors",
            es: "Colores del Arcoíris",
          },
          description: {
            en: "Learn key vocabulary for colors & shapes",
            es: "Aprende vocabulario clave para colores y formas",
          },
          xpRequired: 710,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "colors and shapes",
              focusPoints: [
                "rojo, azul, verde, amarillo, negro, blanco",
                "el círculo, el cuadrado, el triángulo",
                "claro / oscuro",
              ],
            },
            grammar: {
              topic: "describing things with colors",
              focusPoints: [
                "adjective agreement: rojo/roja, rojos/rojas",
                "noun + adjective order (la casa roja)",
                "¿de qué color es?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-9-2",
          title: {
            en: "Describing Things",
            es: "Describiendo Cosas",
          },
          description: {
            en: "Practice colors & shapes in conversation",
            es: "Practica colores y formas en conversación",
          },
          xpRequired: 725,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "describing objects by color in a room",
              prompt: "Practice colors with agreement: 'la mesa es blanca'",
            },
            stories: {
              topic: "colors in descriptions",
              prompt: "Read a description and notice the colors and agreement",
            },
          },
        },
        {
          id: "lesson-a1-9-3",
          title: {
            en: "Colors Everywhere",
            es: "Colores por Todas Partes",
          },
          description: {
            en: "Apply colors & shapes skills",
            es: "Aplica habilidades de colores y formas",
          },
          xpRequired: 740,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "colors and adjective agreement",
              prompt: "Read and match colors to nouns with the right ending",
            },
            realtime: {
              scenario: "describing what you are wearing by color",
              prompt: "Demonstrate colors with correct adjective agreement",
            },
          },
        },
        {
          id: "lesson-a1-9-quiz",
          title: {
            en: "Colors & Shapes Quiz",
            es: "Prueba de Colores y Formas",
          },
          description: {
            en: "Test your knowledge of colors & shapes",
            es: "Prueba tus conocimientos de colores y formas",
          },
          xpRequired: 755,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "colors and shapes",
              focusPoints: [
                "rojo, azul, verde, amarillo",
                "círculo, cuadrado, triángulo",
              ],
            },
            grammar: {
              topics: [
                "describing things with colors",
              ],
              focusPoints: [
                "agreement rojo/roja",
                "¿de qué color es?",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-10",
      title: {
        en: "Food & Drinks",
        es: "Comida y Bebidas",
      },
      description: {
        en: "Basic food vocabulary",
        es: "Vocabulario de comida",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-10-1",
          title: {
            en: "Food Vocabulary",
            es: "Vocabulario de Comida",
          },
          description: {
            en: "Learn key vocabulary for food & drinks",
            es: "Aprende vocabulario clave para comida y bebidas",
          },
          xpRequired: 785,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "food and drinks",
              focusPoints: [
                "el pan, la fruta, la carne, el pescado",
                "el agua, el café, la leche, el zumo/jugo",
                "el desayuno, la comida, la cena",
              ],
            },
            grammar: {
              topic: "talking about food you like and want",
              focusPoints: [
                "me gusta + singular / me gustan + plural",
                "quiero / quería + food",
                "el/la with food nouns",
              ],
            },
          },
        },
        {
          id: "lesson-a1-10-2",
          title: {
            en: "I'm Hungry!",
            es: "¡Tengo Hambre!",
          },
          description: {
            en: "Practice food & drinks in conversation",
            es: "Practica comida y bebidas en conversación",
          },
          xpRequired: 800,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "talking about what you eat for breakfast",
              prompt: "Practice food words with 'me gusta' and 'quiero'",
            },
            stories: {
              topic: "meals and eating habits",
              prompt: "Read about someone's meals and discuss",
            },
          },
        },
        {
          id: "lesson-a1-10-3",
          title: {
            en: "My Favorite Foods",
            es: "Mis Comidas Favoritas",
          },
          description: {
            en: "Apply food & drinks skills",
            es: "Aplica habilidades de comida y bebidas",
          },
          xpRequired: 815,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "food preferences",
              prompt: "Read and notice 'me gusta' vs 'me gustan' with foods",
            },
            realtime: {
              scenario: "saying what you like and want to eat",
              prompt: "Demonstrate food vocabulary with likes and wants",
            },
          },
        },
        {
          id: "lesson-a1-10-quiz",
          title: {
            en: "Food & Drinks Quiz",
            es: "Prueba de Comida y Bebidas",
          },
          description: {
            en: "Test your knowledge of food & drinks",
            es: "Prueba tus conocimientos de comida y bebidas",
          },
          xpRequired: 830,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "food and drinks",
              focusPoints: [
                "pan, fruta, carne, pescado",
                "agua, café, leche, zumo/jugo",
              ],
            },
            grammar: {
              topics: [
                "talking about food",
              ],
              focusPoints: [
                "me gusta vs me gustan",
                "quiero + food",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-11",
      title: {
        en: "At the Restaurant",
        es: "En el Restaurante",
      },
      description: {
        en: "Order food",
        es: "Pide comida",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-11-1",
          title: {
            en: "Restaurant Words",
            es: "Palabras de Restaurante",
          },
          description: {
            en: "Learn key vocabulary for at the restaurant",
            es: "Aprende vocabulario clave para en el restaurante",
          },
          xpRequired: 860,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "ordering at a restaurant",
              focusPoints: [
                "el menú, la carta, la cuenta",
                "el/la camarero/a, el plato, la bebida",
                "la propina, la mesa",
              ],
            },
            grammar: {
              topic: "polite ordering phrases",
              focusPoints: [
                "quería / me pone / para mí...",
                "¿qué desea? / ¿algo más?",
                "la cuenta, por favor",
              ],
            },
          },
        },
        {
          id: "lesson-a1-11-2",
          title: {
            en: "Ordering a Meal",
            es: "Pidiendo una Comida",
          },
          description: {
            en: "Practice at the restaurant in conversation",
            es: "Practica en el restaurante en conversación",
          },
          xpRequired: 875,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "ordering a meal from a waiter",
              prompt: "Practice ordering: 'para mí..., la cuenta, por favor'",
            },
            stories: {
              topic: "a restaurant scene",
              prompt: "Read a restaurant dialogue and discuss the order",
            },
          },
        },
        {
          id: "lesson-a1-11-3",
          title: {
            en: "Paying the Bill",
            es: "Pagando la Cuenta",
          },
          description: {
            en: "Apply at the restaurant skills",
            es: "Aplica habilidades de en el restaurante",
          },
          xpRequired: 890,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "restaurant interactions",
              prompt: "Read a menu and a short order and follow along",
            },
            realtime: {
              scenario: "asking for the menu and the bill",
              prompt: "Demonstrate ordering politely at a restaurant",
            },
          },
        },
        {
          id: "lesson-a1-11-quiz",
          title: {
            en: "At the Restaurant Quiz",
            es: "Prueba de En el Restaurante",
          },
          description: {
            en: "Test your knowledge of at the restaurant",
            es: "Prueba tus conocimientos de en el restaurante",
          },
          xpRequired: 905,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "at the restaurant",
              focusPoints: [
                "el menú, la cuenta, el camarero",
                "el plato, la bebida",
              ],
            },
            grammar: {
              topics: [
                "polite ordering phrases",
              ],
              focusPoints: [
                "quería / me pone / para mí",
                "la cuenta, por favor",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-12",
      title: {
        en: "Common Objects",
        es: "Objetos Comunes",
      },
      description: {
        en: "Everyday items",
        es: "Artículos cotidianos",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-12-1",
          title: {
            en: "Everyday Items",
            es: "Objetos Cotidianos",
          },
          description: {
            en: "Learn key vocabulary for common objects",
            es: "Aprende vocabulario clave para objetos comunes",
          },
          xpRequired: 935,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "common everyday objects",
              focusPoints: [
                "la mesa, la silla, el libro, el bolígrafo",
                "el teléfono, las llaves, la mochila",
                "la puerta, la ventana",
              ],
            },
            grammar: {
              topic: "pointing things out",
              focusPoints: [
                "este/esta vs ese/esa",
                "hay (there is/are)",
                "¿qué es esto? / es un/una...",
              ],
            },
          },
        },
        {
          id: "lesson-a1-12-2",
          title: {
            en: "What Is This?",
            es: "¿Qué Es Esto?",
          },
          description: {
            en: "Practice common objects in conversation",
            es: "Practica objetos comunes en conversación",
          },
          xpRequired: 950,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "naming the things on your desk",
              prompt: "Practice object names with 'esto es...' and 'hay...'",
            },
            stories: {
              topic: "objects around us",
              prompt: "Read a description of a room's objects and discuss",
            },
          },
        },
        {
          id: "lesson-a1-12-3",
          title: {
            en: "Objects Around Us",
            es: "Objetos a Nuestro Alrededor",
          },
          description: {
            en: "Apply common objects skills",
            es: "Aplica habilidades de objetos comunes",
          },
          xpRequired: 965,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "this and that with objects",
              prompt: "Read and notice este/ese for near and far objects",
            },
            realtime: {
              scenario: "asking what something is",
              prompt: "Demonstrate object vocabulary with '¿qué es esto?'",
            },
          },
        },
        {
          id: "lesson-a1-12-quiz",
          title: {
            en: "Common Objects Quiz",
            es: "Prueba de Objetos Comunes",
          },
          description: {
            en: "Test your knowledge of common objects",
            es: "Prueba tus conocimientos de objetos comunes",
          },
          xpRequired: 980,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "common objects",
              focusPoints: [
                "mesa, silla, libro, bolígrafo",
                "teléfono, llaves, mochila",
              ],
            },
            grammar: {
              topics: [
                "pointing things out",
              ],
              focusPoints: [
                "este/esta vs ese/esa",
                "hay + object",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-13",
      title: {
        en: "In the House",
        es: "En la Casa",
      },
      description: {
        en: "Rooms and furniture",
        es: "Habitaciones y muebles",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-13-1",
          title: {
            en: "Rooms of the House",
            es: "Cuartos de la Casa",
          },
          description: {
            en: "Learn key vocabulary for in the house",
            es: "Aprende vocabulario clave para en la casa",
          },
          xpRequired: 1010,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the house and its rooms",
              focusPoints: [
                "la cocina, el baño, el dormitorio",
                "el salón, el comedor, el pasillo",
                "los muebles: la cama, el sofá",
              ],
            },
            grammar: {
              topic: "saying where things are",
              focusPoints: [
                "estar for location (está en...)",
                "prepositions: en, sobre, debajo de, al lado de",
                "¿dónde está?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-13-2",
          title: {
            en: "Where Is It?",
            es: "¿Dónde Está?",
          },
          description: {
            en: "Practice in the house in conversation",
            es: "Practica en la casa en conversación",
          },
          xpRequired: 1025,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "giving a friend a tour of your home",
              prompt: "Practice rooms with 'está en...' and prepositions of place",
            },
            stories: {
              topic: "a description of a home",
              prompt: "Read about a house and discuss where the rooms are",
            },
          },
        },
        {
          id: "lesson-a1-13-3",
          title: {
            en: "At Home",
            es: "En Casa",
          },
          description: {
            en: "Apply in the house skills",
            es: "Aplica habilidades de en la casa",
          },
          xpRequired: 1040,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "describing where things are",
              prompt: "Read and locate objects using prepositions of place",
            },
            realtime: {
              scenario: "describing your room",
              prompt: "Demonstrate house vocabulary with 'estar' and place words",
            },
          },
        },
        {
          id: "lesson-a1-13-quiz",
          title: {
            en: "In the House Quiz",
            es: "Prueba de En la Casa",
          },
          description: {
            en: "Test your knowledge of in the house",
            es: "Prueba tus conocimientos de en la casa",
          },
          xpRequired: 1055,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the house and rooms",
              focusPoints: [
                "cocina, baño, dormitorio, salón",
                "cama, sofá, mesa",
              ],
            },
            grammar: {
              topics: [
                "saying where things are",
              ],
              focusPoints: [
                "estar for location",
                "en, sobre, debajo de, al lado de",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-14",
      title: {
        en: "Clothing",
        es: "Ropa",
      },
      description: {
        en: "What you wear",
        es: "Lo que vistes",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-14-1",
          title: {
            en: "What to Wear",
            es: "Qué Ponerse",
          },
          description: {
            en: "Learn key vocabulary for clothing",
            es: "Aprende vocabulario clave para ropa",
          },
          xpRequired: 1085,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "clothing",
              focusPoints: [
                "la camisa, los pantalones, los zapatos",
                "el vestido, la falda, la chaqueta",
                "el abrigo, el sombrero",
              ],
            },
            grammar: {
              topic: "talking about what you wear",
              focusPoints: [
                "llevar / ponerse (reflexive)",
                "agreement and plural of clothes",
                "colors + clothing (camisa azul)",
              ],
            },
          },
        },
        {
          id: "lesson-a1-14-2",
          title: {
            en: "Shopping for Clothes",
            es: "Comprando Ropa",
          },
          description: {
            en: "Practice clothing in conversation",
            es: "Practica ropa en conversación",
          },
          xpRequired: 1100,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "choosing an outfit for an occasion",
              prompt: "Practice clothing with 'llevar' and colors",
            },
            stories: {
              topic: "describing what people wear",
              prompt: "Read a description of outfits and discuss",
            },
          },
        },
        {
          id: "lesson-a1-14-3",
          title: {
            en: "My Wardrobe",
            es: "Mi Guardarropa",
          },
          description: {
            en: "Apply clothing skills",
            es: "Aplica habilidades de ropa",
          },
          xpRequired: 1115,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "clothing and the weather",
              prompt: "Read and match clothes to situations",
            },
            realtime: {
              scenario: "describing what you are wearing today",
              prompt: "Demonstrate clothing vocabulary with 'llevar' and colors",
            },
          },
        },
        {
          id: "lesson-a1-14-quiz",
          title: {
            en: "Clothing Quiz",
            es: "Prueba de Ropa",
          },
          description: {
            en: "Test your knowledge of clothing",
            es: "Prueba tus conocimientos de ropa",
          },
          xpRequired: 1130,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "clothing",
              focusPoints: [
                "camisa, pantalones, zapatos",
                "vestido, falda, chaqueta",
              ],
            },
            grammar: {
              topics: [
                "talking about what you wear",
              ],
              focusPoints: [
                "llevar / ponerse",
                "colors + clothing",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-15",
      title: {
        en: "Daily Routine",
        es: "Rutina Diaria",
      },
      description: {
        en: "Your day",
        es: "Tu día",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-15-1",
          title: {
            en: "My Day",
            es: "Mi Día",
          },
          description: {
            en: "Learn key vocabulary for daily routine",
            es: "Aprende vocabulario clave para rutina diaria",
          },
          xpRequired: 1160,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "daily routine activities",
              focusPoints: [
                "levantarse, ducharse, vestirse",
                "desayunar, trabajar, estudiar",
                "acostarse, dormir",
              ],
            },
            grammar: {
              topic: "describing your routine",
              focusPoints: [
                "reflexive verbs (me levanto, me ducho)",
                "present tense for habits",
                "time + activity (a las ocho me levanto)",
              ],
            },
          },
        },
        {
          id: "lesson-a1-15-2",
          title: {
            en: "Daily Activities",
            es: "Actividades Diarias",
          },
          description: {
            en: "Practice daily routine in conversation",
            es: "Practica rutina diaria en conversación",
          },
          xpRequired: 1175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "describing your morning routine to a friend",
              prompt: "Practice reflexive verbs: 'me levanto, me ducho, desayuno'",
            },
            stories: {
              topic: "a daily routine",
              prompt: "Read about someone's day and discuss the routine",
            },
          },
        },
        {
          id: "lesson-a1-15-3",
          title: {
            en: "From Morning to Night",
            es: "De la Mañana a la Noche",
          },
          description: {
            en: "Apply daily routine skills",
            es: "Aplica habilidades de rutina diaria",
          },
          xpRequired: 1190,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "routines and times",
              prompt: "Read a routine and notice the reflexive verbs and times",
            },
            realtime: {
              scenario: "telling someone your typical day",
              prompt: "Demonstrate routine verbs with times of day",
            },
          },
        },
        {
          id: "lesson-a1-15-quiz",
          title: {
            en: "Daily Routine Quiz",
            es: "Prueba de Rutina Diaria",
          },
          description: {
            en: "Test your knowledge of daily routine",
            es: "Prueba tus conocimientos de rutina diaria",
          },
          xpRequired: 1205,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "daily routine",
              focusPoints: [
                "levantarse, ducharse, vestirse",
                "desayunar, trabajar, acostarse",
              ],
            },
            grammar: {
              topics: [
                "describing your routine",
              ],
              focusPoints: [
                "reflexive verbs (me levanto)",
                "time + activity",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-16",
      title: {
        en: "Weather",
        es: "Clima",
      },
      description: {
        en: "Talk about weather",
        es: "Habla del clima",
      },
      color: "#3B82F6",
      position: { row: 7, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-16-1",
          title: {
            en: "How's the Weather?",
            es: "¿Cómo Está el Clima?",
          },
          description: {
            en: "Learn key vocabulary for weather",
            es: "Aprende vocabulario clave para clima",
          },
          xpRequired: 1235,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the weather",
              focusPoints: [
                "hace sol, hace calor, hace frío",
                "llueve, nieva, hace viento",
                "está nublado, está despejado",
              ],
            },
            grammar: {
              topic: "talking about the weather",
              focusPoints: [
                "hace + noun (hace frío)",
                "está + adjective (está nublado)",
                "¿qué tiempo hace?",
              ],
            },
          },
        },
        {
          id: "lesson-a1-16-2",
          title: {
            en: "Four Seasons",
            es: "Cuatro Estaciones",
          },
          description: {
            en: "Practice weather in conversation",
            es: "Practica clima en conversación",
          },
          xpRequired: 1250,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "chatting about today's weather",
              prompt: "Practice '¿qué tiempo hace?' and 'hace.../está...'",
            },
            stories: {
              topic: "weather and the seasons",
              prompt: "Read a weather report and discuss it",
            },
          },
        },
        {
          id: "lesson-a1-16-3",
          title: {
            en: "Weather Reports",
            es: "Reportes del Clima",
          },
          description: {
            en: "Apply weather skills",
            es: "Aplica habilidades de clima",
          },
          xpRequired: 1265,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "weather in different places",
              prompt: "Read and compare the weather in two cities",
            },
            realtime: {
              scenario: "describing the weather where you are",
              prompt: "Demonstrate weather expressions with 'hace' and 'está'",
            },
          },
        },
        {
          id: "lesson-a1-16-quiz",
          title: {
            en: "Weather Quiz",
            es: "Prueba de Clima",
          },
          description: {
            en: "Test your knowledge of weather",
            es: "Prueba tus conocimientos de clima",
          },
          xpRequired: 1280,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the weather",
              focusPoints: [
                "hace sol/calor/frío",
                "llueve, nieva, está nublado",
              ],
            },
            grammar: {
              topics: [
                "talking about the weather",
              ],
              focusPoints: [
                "hace + noun vs está + adjective",
                "¿qué tiempo hace?",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-17",
      title: {
        en: "Likes & Dislikes",
        es: "Gustos",
      },
      description: {
        en: "Preferences",
        es: "Preferencias",
      },
      color: "#F59E0B",
      position: { row: 8, offset: 0 },
      lessons: [
        {
          id: "lesson-a1-17-1",
          title: {
            en: "I Like, I Love",
            es: "Me Gusta, Me Encanta",
          },
          description: {
            en: "Learn key vocabulary for likes & dislikes",
            es: "Aprende vocabulario clave para gustos",
          },
          xpRequired: 1310,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "likes and dislikes",
              focusPoints: [
                "me gusta / me encanta",
                "no me gusta / odio",
                "me gusta mucho / nada",
              ],
            },
            grammar: {
              topic: "the verb gustar",
              focusPoints: [
                "me gusta + singular / me gustan + plural",
                "me gusta + infinitive (me gusta leer)",
                "a mí me gusta, a ti te gusta",
              ],
            },
          },
        },
        {
          id: "lesson-a1-17-2",
          title: {
            en: "Expressing Preferences",
            es: "Expresando Preferencias",
          },
          description: {
            en: "Practice likes & dislikes in conversation",
            es: "Practica gustos en conversación",
          },
          xpRequired: 1325,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "comparing what you both like",
              prompt: "Practice 'me gusta/gustan' and 'a mí también/tampoco'",
            },
            stories: {
              topic: "preferences and hobbies",
              prompt: "Read about someone's likes and discuss",
            },
          },
        },
        {
          id: "lesson-a1-17-3",
          title: {
            en: "Favorites and Dislikes",
            es: "Favoritos y Disgustos",
          },
          description: {
            en: "Apply likes & dislikes skills",
            es: "Aplica habilidades de gustos",
          },
          xpRequired: 1340,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "expressing preferences",
              prompt: "Read and notice 'me gusta' vs 'me gustan' and 'a mí me...'",
            },
            realtime: {
              scenario: "telling a friend what you like and dislike",
              prompt: "Demonstrate gustar with singular, plural, and infinitives",
            },
          },
        },
        {
          id: "lesson-a1-17-quiz",
          title: {
            en: "Likes & Dislikes Quiz",
            es: "Prueba de Gustos",
          },
          description: {
            en: "Test your knowledge of likes & dislikes",
            es: "Prueba tus conocimientos de gustos",
          },
          xpRequired: 1355,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "likes and dislikes",
              focusPoints: [
                "me gusta / me encanta",
                "no me gusta / odio",
              ],
            },
            grammar: {
              topics: [
                "the verb gustar",
              ],
              focusPoints: [
                "me gusta vs me gustan",
                "a mí me gusta + infinitive",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-a1-18",
      title: {
        en: "Basic Questions",
        es: "Preguntas",
      },
      description: {
        en: "Ask questions",
        es: "Haz preguntas",
      },
      color: "#8B5CF6",
      position: { row: 8, offset: 1 },
      lessons: [
        {
          id: "lesson-a1-18-1",
          title: {
            en: "Question Words",
            es: "Palabras de Pregunta",
          },
          description: {
            en: "Learn key vocabulary for basic questions",
            es: "Aprende vocabulario clave para preguntas",
          },
          xpRequired: 1385,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "question words",
              focusPoints: [
                "qué, quién, dónde, cuándo",
                "cómo, por qué, cuánto",
                "cuál / cuáles",
              ],
            },
            grammar: {
              topic: "forming simple questions",
              focusPoints: [
                "question word + verb (¿dónde vives?)",
                "yes/no questions and ¿verdad?",
                "written accents on question words",
              ],
            },
          },
        },
        {
          id: "lesson-a1-18-2",
          title: {
            en: "Asking Questions",
            es: "Haciendo Preguntas",
          },
          description: {
            en: "Practice basic questions in conversation",
            es: "Practica preguntas en conversación",
          },
          xpRequired: 1400,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "getting to know someone with questions",
              prompt: "Practice asking '¿dónde...?', '¿cómo...?', '¿por qué...?'",
            },
            stories: {
              topic: "an interview",
              prompt: "Read a short interview and notice the questions",
            },
          },
        },
        {
          id: "lesson-a1-18-3",
          title: {
            en: "Getting Information",
            es: "Obteniendo Información",
          },
          description: {
            en: "Apply basic questions skills",
            es: "Aplica habilidades de preguntas",
          },
          xpRequired: 1415,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "questions and answers",
              prompt: "Read and match questions to their answers",
            },
            realtime: {
              scenario: "interviewing a new friend",
              prompt: "Demonstrate question words to ask about someone",
            },
          },
        },
        {
          id: "lesson-a1-18-quiz",
          title: {
            en: "Basic Questions Quiz",
            es: "Prueba de Preguntas",
          },
          description: {
            en: "Test your knowledge of basic questions",
            es: "Prueba tus conocimientos de preguntas",
          },
          xpRequired: 1430,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "question words",
              focusPoints: [
                "qué, quién, dónde, cuándo",
                "cómo, por qué, cuánto",
              ],
            },
            grammar: {
              topics: [
                "forming simple questions",
              ],
              focusPoints: [
                "question word + verb",
                "accents on question words",
              ],
            },
          },
        },
      ],
    },
  ],
  A2: [
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "describing people's appearance and personality",
              focusPoints: [
                "alto/a, bajo/a, moreno/a, rubio/a",
                "delgado/a, fuerte, joven, mayor",
                "simpático/a, tímido/a, alegre",
              ],
            },
            grammar: {
              topic: "ser and adjectives for description",
              focusPoints: [
                "ser + adjective (es alto)",
                "agreement in gender and number",
                "tener + noun (tiene el pelo largo)",
              ],
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
              scenario: "describing a friend to someone who hasn't met them",
              prompt: "Practice 'es...' and 'tiene...' to describe appearance and character",
            },
            stories: {
              topic: "a character description",
              prompt: "Read a description of a person and discuss",
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
              topic: "physical vs personality description",
              prompt: "Read and separate looks (es alto) from character (es amable)",
            },
            realtime: {
              scenario: "describing someone in a photo",
              prompt: "Demonstrate description with 'ser', 'tener', and agreement",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "describing people",
              focusPoints: [
                "alto, bajo, moreno, rubio",
                "simpático, tímido, alegre",
              ],
            },
            grammar: {
              topics: [
                "ser and adjectives for description",
              ],
              focusPoints: [
                "ser + adjective with agreement",
                "tener el pelo...",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "describing places",
              focusPoints: [
                "grande, pequeño, bonito, feo",
                "tranquilo, ruidoso, moderno, antiguo",
                "la ciudad, el pueblo, el barrio",
              ],
            },
            grammar: {
              topic: "hay, estar, and ser for places",
              focusPoints: [
                "hay + noun (hay un parque)",
                "estar for location (está en el centro)",
                "ser for characteristics (es grande)",
              ],
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
              scenario: "describing your town to a visitor",
              prompt: "Practice 'hay...', 'está...', and 'es...' to describe a place",
            },
            stories: {
              topic: "a description of a city",
              prompt: "Read about a place and discuss what it's like",
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
              topic: "hay vs estar vs ser",
              prompt: "Read and choose hay/está/es to describe places",
            },
            realtime: {
              scenario: "comparing two neighborhoods",
              prompt: "Demonstrate place description with hay, estar, and ser",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "describing places",
              focusPoints: [
                "grande, pequeño, tranquilo, ruidoso",
                "ciudad, pueblo, barrio",
              ],
            },
            grammar: {
              topics: [
                "hay, estar, and ser for places",
              ],
              focusPoints: [
                "hay vs está vs es",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "shopping and money",
              focusPoints: [
                "la tienda, el precio, la talla",
                "caro/a, barato/a, la oferta",
                "el euro, pagar, el cambio",
              ],
            },
            grammar: {
              topic: "asking about prices and items",
              focusPoints: [
                "¿cuánto cuesta? / ¿cuánto es?",
                "demonstratives: este, ese, aquel",
                "quería / me llevo...",
              ],
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
              scenario: "buying clothes and asking the price",
              prompt: "Practice '¿cuánto cuesta?' and 'me llevo...' while shopping",
            },
            stories: {
              topic: "a shopping conversation",
              prompt: "Read a shop dialogue and discuss the purchase",
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
              topic: "prices and paying",
              prompt: "Read prices and a receipt and follow the amounts",
            },
            realtime: {
              scenario: "paying and asking for the price",
              prompt: "Demonstrate shopping vocabulary and price questions",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "shopping and money",
              focusPoints: [
                "tienda, precio, talla, oferta",
                "caro, barato, pagar",
              ],
            },
            grammar: {
              topics: [
                "asking about prices and items",
              ],
              focusPoints: [
                "¿cuánto cuesta?",
                "este/ese/aquel",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "at the market",
              focusPoints: [
                "la fruta, la verdura, la carne, el pescado",
                "el kilo, el gramo, la docena",
                "el puesto, la bolsa",
              ],
            },
            grammar: {
              topic: "asking for quantities",
              focusPoints: [
                "un kilo de / medio kilo de",
                "¿a cuánto está(n)?",
                "quisiera / póngame...",
              ],
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
              scenario: "buying fruit and vegetables at a market",
              prompt: "Practice quantities: 'un kilo de...', '¿a cuánto está?'",
            },
            stories: {
              topic: "a market scene",
              prompt: "Read a market dialogue and discuss the quantities bought",
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
              topic: "quantities and prices at the market",
              prompt: "Read and follow amounts and prices in a market list",
            },
            realtime: {
              scenario: "ordering produce by weight",
              prompt: "Demonstrate market vocabulary with quantities and prices",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "at the market",
              focusPoints: [
                "fruta, verdura, carne, pescado",
                "kilo, gramo, docena",
              ],
            },
            grammar: {
              topics: [
                "asking for quantities",
              ],
              focusPoints: [
                "un kilo de / medio kilo de",
                "¿a cuánto está?",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "transportation",
              focusPoints: [
                "el autobús, el tren, el metro, el coche",
                "el billete/boleto, la parada, la estación",
                "el aeropuerto, el avión",
              ],
            },
            grammar: {
              topic: "talking about getting around",
              focusPoints: [
                "ir en + transport (en autobús, a pie)",
                "coger/tomar el autobús",
                "¿cómo vas a...?",
              ],
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
              scenario: "asking how to get to a place by public transport",
              prompt: "Practice 'ir en...' and buying a ticket",
            },
            stories: {
              topic: "getting around a city",
              prompt: "Read about a journey and discuss the transport used",
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
              topic: "transport options and tickets",
              prompt: "Read a transport schedule and find the details",
            },
            realtime: {
              scenario: "planning a trip across town",
              prompt: "Demonstrate transport vocabulary with 'ir en' and tickets",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "transportation",
              focusPoints: [
                "autobús, tren, metro, coche",
                "billete/boleto, parada, estación",
              ],
            },
            grammar: {
              topics: [
                "getting around",
              ],
              focusPoints: [
                "ir en + transport",
                "coger/tomar el autobús",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "directions",
              focusPoints: [
                "a la derecha, a la izquierda, recto/todo recto",
                "cerca, lejos, al lado de, enfrente de",
                "la esquina, la calle, la plaza",
              ],
            },
            grammar: {
              topic: "asking for and giving directions",
              focusPoints: [
                "¿cómo se va a...? / ¿dónde está...?",
                "imperatives: gire, siga, cruce",
                "estar for location",
              ],
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
              scenario: "asking a stranger how to get to the station",
              prompt: "Practice '¿cómo se va a...?' and 'gire a la derecha'",
            },
            stories: {
              topic: "following directions",
              prompt: "Read directions to a place and trace the route",
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
              topic: "directions and city places",
              prompt: "Read a route description and find the destination",
            },
            realtime: {
              scenario: "guiding someone to a nearby place",
              prompt: "Demonstrate directions with imperatives and place words",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "directions",
              focusPoints: [
                "a la derecha/izquierda, recto",
                "cerca, lejos, al lado de, enfrente de",
              ],
            },
            grammar: {
              topics: [
                "asking for and giving directions",
              ],
              focusPoints: [
                "¿cómo se va a...?",
                "gire, siga, cruce",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "making plans and invitations",
              focusPoints: [
                "quedar, invitar, la cita",
                "¿te apetece...? / ¿quieres...?",
                "vale, de acuerdo, lo siento, no puedo",
              ],
            },
            grammar: {
              topic: "arranging to meet",
              focusPoints: [
                "ir a + infinitive for plans",
                "quedar (¿quedamos a las...?)",
                "accepting and declining",
              ],
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
              scenario: "inviting a friend out and agreeing on a time",
              prompt: "Practice '¿te apetece...?' and 'quedamos a las...'",
            },
            stories: {
              topic: "a chat about weekend plans",
              prompt: "Read friends making plans and discuss the arrangement",
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
              topic: "accepting and turning down invitations",
              prompt: "Read and notice how people accept or decline plans",
            },
            realtime: {
              scenario: "planning an outing with a friend",
              prompt: "Demonstrate making, accepting, and declining invitations",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "making plans",
              focusPoints: [
                "quedar, invitar, cita",
                "¿te apetece...?, vale, no puedo",
              ],
            },
            grammar: {
              topics: [
                "arranging to meet",
              ],
              focusPoints: [
                "ir a + infinitive",
                "quedar a las...",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "hobbies and free time",
              focusPoints: [
                "leer, pintar, cocinar, bailar",
                "la música, el cine, los videojuegos",
                "el tiempo libre, la afición",
              ],
            },
            grammar: {
              topic: "talking about what you like to do",
              focusPoints: [
                "gustar + infinitive (me gusta leer)",
                "soler + infinitive (suelo...)",
                "frequency: a veces, siempre, nunca",
              ],
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
              scenario: "talking about what you do in your free time",
              prompt: "Practice 'me gusta + infinitive' and frequency words",
            },
            stories: {
              topic: "hobbies and pastimes",
              prompt: "Read about someone's hobbies and discuss",
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
              topic: "free-time habits",
              prompt: "Read and notice how often someone does activities",
            },
            realtime: {
              scenario: "comparing hobbies with a friend",
              prompt: "Demonstrate hobby vocabulary with gustar and frequency",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "hobbies and interests",
              focusPoints: [
                "leer, pintar, cocinar, bailar",
                "música, cine, tiempo libre",
              ],
            },
            grammar: {
              topics: [
                "talking about what you like to do",
              ],
              focusPoints: [
                "gustar + infinitive",
                "soler + infinitive, frequency",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "sports and exercise",
              focusPoints: [
                "el fútbol, el baloncesto, el tenis",
                "correr, nadar, montar en bici",
                "el gimnasio, el equipo, el partido",
              ],
            },
            grammar: {
              topic: "talking about doing sports",
              focusPoints: [
                "jugar a (juego al fútbol)",
                "hacer / practicar (hago deporte)",
                "frequency: dos veces por semana",
              ],
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
              scenario: "talking about the sports you play",
              prompt: "Practice 'juego al...', 'hago...', and frequency",
            },
            stories: {
              topic: "an active lifestyle",
              prompt: "Read about someone's exercise habits and discuss",
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
              topic: "sports and frequency",
              prompt: "Read and notice 'jugar a' vs 'hacer/practicar' with sports",
            },
            realtime: {
              scenario: "describing your exercise routine",
              prompt: "Demonstrate sports vocabulary with jugar/hacer and frequency",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "sports and exercise",
              focusPoints: [
                "fútbol, baloncesto, tenis",
                "correr, nadar, gimnasio",
              ],
            },
            grammar: {
              topics: [
                "talking about doing sports",
              ],
              focusPoints: [
                "jugar a vs hacer/practicar",
                "frequency expressions",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the regular preterite and time markers",
              focusPoints: [
                "ayer, anoche, la semana pasada",
                "el año pasado, hace dos días",
                "ya, por fin",
              ],
            },
            grammar: {
              topic: "forming the regular preterite",
              focusPoints: [
                "-ar: hablé, hablaste, habló",
                "-er/-ir: comí, comiste, comió",
                "for completed past actions",
              ],
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
              scenario: "telling a friend what you did yesterday",
              prompt: "Practice the regular preterite: 'ayer hablé, comí, trabajé'",
            },
            stories: {
              topic: "a short account of a past day",
              prompt: "Read about what someone did and discuss",
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
              topic: "the preterite in a sequence of events",
              prompt: "Read a past narrative and notice the preterite verbs",
            },
            realtime: {
              scenario: "recounting last weekend",
              prompt: "Demonstrate the regular preterite with time markers",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the regular preterite",
              focusPoints: [
                "ayer, anoche, la semana pasada",
                "hace + time",
              ],
            },
            grammar: {
              topics: [
                "forming the regular preterite",
              ],
              focusPoints: [
                "-ar: -é/-aste/-ó",
                "-er/-ir: -í/-iste/-ió",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "irregular preterite verbs",
              focusPoints: [
                "ser/ir: fui, fuiste, fue",
                "tener: tuve; estar: estuve",
                "hacer: hice; poder: pude; decir: dije",
              ],
            },
            grammar: {
              topic: "using common irregular preterites",
              focusPoints: [
                "irregular stems (tuv-, estuv-, hic-)",
                "ser and ir share fui/fue",
                "for completed past actions",
              ],
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
              scenario: "telling a friend about a trip you took",
              prompt: "Practice irregulars: 'fui, tuve, hice, estuve'",
            },
            stories: {
              topic: "a past story with irregular verbs",
              prompt: "Read a past account and spot the irregular preterites",
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
              topic: "regular vs irregular preterite",
              prompt: "Read and tell regular (-é/-í) from irregular (fui, hice)",
            },
            realtime: {
              scenario: "recounting an eventful day",
              prompt: "Demonstrate irregular preterite verbs in a short story",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "irregular preterite",
              focusPoints: [
                "fui/fue, tuve, estuve",
                "hice, pude, dije",
              ],
            },
            grammar: {
              topics: [
                "using common irregular preterites",
              ],
              focusPoints: [
                "irregular stems",
                "ser/ir = fui/fue",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "telling a story",
              focusPoints: [
                "primero, luego, después, entonces",
                "al final, de repente, mientras",
                "érase una vez",
              ],
            },
            grammar: {
              topic: "preterite vs imperfect in narration",
              focusPoints: [
                "imperfect for background (era, había, hacía)",
                "preterite for events (llegó, dijo)",
                "linking events with connectors",
              ],
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
              scenario: "telling a friend a story about something that happened",
              prompt: "Practice connectors and preterite/imperfect to narrate",
            },
            stories: {
              topic: "a short story",
              prompt: "Read a short narrative and notice background vs events",
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
              topic: "background vs events in a story",
              prompt: "Read and separate the scene (imperfect) from the action (preterite)",
            },
            realtime: {
              scenario: "narrating a memorable event",
              prompt: "Demonstrate storytelling with connectors and past tenses",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "telling stories",
              focusPoints: [
                "primero, luego, después, al final",
                "de repente, mientras",
              ],
            },
            grammar: {
              topics: [
                "preterite vs imperfect in narration",
              ],
              focusPoints: [
                "imperfect for background vs preterite for events",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "talking about future plans",
              focusPoints: [
                "mañana, la próxima semana, el próximo año",
                "pronto, dentro de, este fin de semana",
                "los planes, el proyecto",
              ],
            },
            grammar: {
              topic: "expressing intentions",
              focusPoints: [
                "ir a + infinitive (voy a viajar)",
                "pensar + infinitive, querer + infinitive",
                "me gustaría + infinitive",
              ],
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
              scenario: "talking about your plans for the holidays",
              prompt: "Practice 'voy a...', 'pienso...', and 'me gustaría...'",
            },
            stories: {
              topic: "future plans and intentions",
              prompt: "Read about someone's plans and discuss",
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
              topic: "ways to talk about the future",
              prompt: "Read and notice 'ir a', 'pensar', and 'querer' + infinitive",
            },
            realtime: {
              scenario: "sharing your goals for next year",
              prompt: "Demonstrate future plans with 'ir a + infinitive' and intentions",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "future plans",
              focusPoints: [
                "mañana, la próxima semana, pronto",
                "los planes, el proyecto",
              ],
            },
            grammar: {
              topics: [
                "expressing intentions",
              ],
              focusPoints: [
                "ir a + infinitive",
                "pensar/querer + infinitive",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the body and health",
              focusPoints: [
                "la cabeza, el estómago, la garganta",
                "el brazo, la pierna, la espalda",
                "sano/a, enfermo/a, el dolor",
              ],
            },
            grammar: {
              topic: "saying what hurts",
              focusPoints: [
                "me duele + singular / me duelen + plural",
                "doler works like gustar",
                "tener dolor de cabeza",
              ],
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
              scenario: "telling someone you don't feel well",
              prompt: "Practice 'me duele(n)...' and 'tengo dolor de...'",
            },
            stories: {
              topic: "talking about health",
              prompt: "Read about someone feeling ill and discuss",
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
              topic: "body parts and aches",
              prompt: "Read and match symptoms to body parts with 'doler'",
            },
            realtime: {
              scenario: "describing where it hurts",
              prompt: "Demonstrate body vocabulary with 'me duele' and 'me duelen'",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the body and health",
              focusPoints: [
                "cabeza, estómago, garganta",
                "brazo, pierna, espalda",
              ],
            },
            grammar: {
              topics: [
                "saying what hurts",
              ],
              focusPoints: [
                "me duele vs me duelen",
                "tener dolor de...",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "at the doctor's",
              focusPoints: [
                "el médico, la cita, los síntomas",
                "la fiebre, la tos, el resfriado, la gripe",
                "la receta, la medicina, la farmacia",
              ],
            },
            grammar: {
              topic: "describing symptoms and getting advice",
              focusPoints: [
                "me encuentro mal, tengo fiebre",
                "debería / tiene que + infinitive",
                "¿qué le pasa? / ¿desde cuándo?",
              ],
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
              scenario: "a visit to the doctor describing your symptoms",
              prompt: "Practice 'me encuentro mal, tengo...' and advice with 'debería'",
            },
            stories: {
              topic: "a doctor's appointment",
              prompt: "Read a clinic dialogue and discuss the advice given",
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
              topic: "symptoms and remedies",
              prompt: "Read about an illness and the recommended treatment",
            },
            realtime: {
              scenario: "explaining how you feel and asking for advice",
              prompt: "Demonstrate health vocabulary to describe symptoms and get advice",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "at the doctor's",
              focusPoints: [
                "médico, cita, síntomas",
                "fiebre, tos, receta, farmacia",
              ],
            },
            grammar: {
              topics: [
                "describing symptoms and getting advice",
              ],
              focusPoints: [
                "tengo fiebre / me encuentro mal",
                "debería / tiene que + infinitive",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "jobs and professions",
              focusPoints: [
                "médico/a, profesor/a, ingeniero/a",
                "abogado/a, cocinero/a, dependiente/a",
                "la empresa, la oficina, el horario",
              ],
            },
            grammar: {
              topic: "talking about work",
              focusPoints: [
                "ser + profession with no article (soy profesor)",
                "trabajar de / en / como",
                "¿a qué te dedicas?",
              ],
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
              scenario: "talking about what you and others do for work",
              prompt: "Practice 'soy...', 'trabajo de/en...', and '¿a qué te dedicas?'",
            },
            stories: {
              topic: "different jobs",
              prompt: "Read about people's professions and discuss",
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
              topic: "professions and workplaces",
              prompt: "Read and match jobs to where people work",
            },
            realtime: {
              scenario: "describing your job or dream job",
              prompt: "Demonstrate job vocabulary with 'ser' and 'trabajar de/en'",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "jobs and professions",
              focusPoints: [
                "médico, profesor, ingeniero",
                "abogado, cocinero, dependiente",
              ],
            },
            grammar: {
              topics: [
                "talking about work",
              ],
              focusPoints: [
                "ser + profession (no article)",
                "trabajar de/en/como",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "school and education",
              focusPoints: [
                "la clase, el examen, la asignatura",
                "el/la profesor/a, el/la alumno/a, los deberes",
                "el horario, la nota, la carrera",
              ],
            },
            grammar: {
              topic: "talking about studies",
              focusPoints: [
                "estudiar, aprender, aprobar/suspender",
                "tener que + infinitive (tengo que estudiar)",
                "school routine in the present",
              ],
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
              scenario: "talking about your studies and timetable",
              prompt: "Practice school vocabulary with 'estudio...' and 'tengo que...'",
            },
            stories: {
              topic: "a school day",
              prompt: "Read about a student's day and discuss the subjects",
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
              topic: "subjects and school life",
              prompt: "Read a timetable and discuss the subjects and times",
            },
            realtime: {
              scenario: "describing your studies",
              prompt: "Demonstrate school vocabulary with 'estudiar' and 'tener que'",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "school and education",
              focusPoints: [
                "clase, examen, asignatura",
                "profesor, alumno, deberes, nota",
              ],
            },
            grammar: {
              topics: [
                "talking about studies",
              ],
              focusPoints: [
                "estudiar, aprobar/suspender",
                "tener que + infinitive",
              ],
            },
          },
        },
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
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "basic technology vocabulary",
              focusPoints: [
                "el móvil/celular, el ordenador/computadora",
                "internet, la aplicación, el correo",
                "la contraseña, la pantalla, el archivo",
              ],
            },
            grammar: {
              topic: "talking about using technology",
              focusPoints: [
                "usar, descargar, enviar, navegar",
                "common verbs for online actions",
                "present tense for habits",
              ],
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
              scenario: "explaining how you use your phone day to day",
              prompt: "Practice tech vocabulary with 'uso...', 'envío...', 'descargo...'",
            },
            stories: {
              topic: "technology in daily life",
              prompt: "Read about how someone uses technology and discuss",
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
              topic: "everyday technology",
              prompt: "Read about apps and devices and notice the action verbs",
            },
            realtime: {
              scenario: "helping a friend with a device",
              prompt: "Demonstrate tech vocabulary with verbs for online actions",
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
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "technology basics",
              focusPoints: [
                "móvil/celular, ordenador/computadora",
                "internet, aplicación, correo, contraseña",
              ],
            },
            grammar: {
              topics: [
                "talking about using technology",
              ],
              focusPoints: [
                "usar, descargar, enviar, navegar",
              ],
            },
          },
        },
      ],
    },
  ],
  B1: [
    {
      id: "unit-b1-1",
      title: {
        en: "Present Perfect",
        es: "Pretérito Perfecto",
      },
      description: {
        en: "Have done",
        es: "He hecho",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-1-1",
          title: {
            en: "Have You Ever?",
            es: "Pretérito Perfecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for present perfect",
            es: "Aprende vocabulario clave para pretérito perfecto",
          },
          xpRequired: 3150,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the present perfect (pretérito perfecto)",
              focusPoints: [
                "he/has/ha + participle",
                "irregular participles: hecho, dicho, visto, escrito",
                "markers: ya, todavía no, alguna vez, nunca",
              ],
            },
            grammar: {
              topic: "forming and using the present perfect",
              focusPoints: [
                "haber (he, has, ha, hemos, han) + participle",
                "regular participles: hablado, comido, vivido",
                "for recent past and life experiences",
              ],
            },
          },
        },
        {
          id: "lesson-b1-1-2",
          title: {
            en: "Life Experiences",
            es: "Pretérito Perfecto - Práctica",
          },
          description: {
            en: "Practice present perfect in conversation",
            es: "Practica pretérito perfecto en conversación",
          },
          xpRequired: 3175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "telling a friend what you have done today",
              prompt: "Practice the present perfect with 'ya', 'todavía no', and 'esta semana'",
            },
            stories: {
              topic: "life experiences with the present perfect",
              prompt: "Read about someone's experiences ('he viajado a...') and discuss",
            },
          },
        },
        {
          id: "lesson-b1-1-3",
          title: {
            en: "Achievements",
            es: "Pretérito Perfecto - Aplicación",
          },
          description: {
            en: "Apply present perfect skills",
            es: "Aplica habilidades de pretérito perfecto",
          },
          xpRequired: 3200,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "present perfect vs preterite",
              prompt: "Read and notice when to use 'he hecho' vs 'hice'",
            },
            realtime: {
              scenario: "asking about experiences (¿alguna vez has...?)",
              prompt: "Demonstrate the present perfect to ask and answer about experiences",
            },
          },
        },
        {
          id: "lesson-b1-1-quiz",
          title: {
            en: "Present Perfect Quiz",
            es: "Prueba de Pretérito Perfecto",
          },
          description: {
            en: "Test your knowledge of present perfect",
            es: "Prueba tus conocimientos de pretérito perfecto",
          },
          xpRequired: 3225,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the present perfect and its time markers",
              focusPoints: [
                "ya, todavía no, alguna vez, nunca",
                "irregular participles",
              ],
            },
            grammar: {
              topics: [
                "forming and using the present perfect",
              ],
              focusPoints: [
                "haber + participle",
                "present perfect vs preterite",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-2",
      title: {
        en: "Past Continuous",
        es: "Pasado Continuo",
      },
      description: {
        en: "Was doing",
        es: "Estaba haciendo",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-2-1",
          title: {
            en: "While It Was Happening",
            es: "Mientras Sucedía",
          },
          description: {
            en: "Learn key vocabulary for past continuous",
            es: "Aprende vocabulario clave para pasado continuo",
          },
          xpRequired: 3275,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the past continuous (estaba + gerundio)",
              focusPoints: [
                "estaba hablando, estabas comiendo",
                "gerunds: -ando / -iendo",
                "irregular gerunds: leyendo, durmiendo, pidiendo",
              ],
            },
            grammar: {
              topic: "describing past actions in progress",
              focusPoints: [
                "estar (imperfect) + gerund",
                "mientras + past continuous",
                "interrupted actions: estaba... cuando...",
              ],
            },
          },
        },
        {
          id: "lesson-b1-2-2",
          title: {
            en: "Background Actions",
            es: "Acciones de Fondo",
          },
          description: {
            en: "Practice past continuous in conversation",
            es: "Practica pasado continuo en conversación",
          },
          xpRequired: 3300,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "describing what you were doing when something happened",
              prompt: "Practice 'estaba ...ando cuando...' for interrupted past actions",
            },
            stories: {
              topic: "setting a scene in the past",
              prompt: "Read a story and notice background actions ('llovía, la gente caminaba')",
            },
          },
        },
        {
          id: "lesson-b1-2-3",
          title: {
            en: "Setting the Scene",
            es: "Ambientando la Escena",
          },
          description: {
            en: "Apply past continuous skills",
            es: "Aplica habilidades de pasado continuo",
          },
          xpRequired: 3325,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "past continuous vs preterite in narration",
              prompt: "Read and tell ongoing background (estaba) from completed events (hizo)",
            },
            realtime: {
              scenario: "recounting an interrupted moment",
              prompt: "Demonstrate the past continuous to narrate what was happening",
            },
          },
        },
        {
          id: "lesson-b1-2-quiz",
          title: {
            en: "Past Continuous Quiz",
            es: "Prueba de Pasado Continuo",
          },
          description: {
            en: "Test your knowledge of past continuous",
            es: "Prueba tus conocimientos de pasado continuo",
          },
          xpRequired: 3350,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the past continuous",
              focusPoints: [
                "estaba + gerundio",
                "irregular gerunds",
              ],
            },
            grammar: {
              topics: [
                "past continuous vs preterite",
              ],
              focusPoints: [
                "estar (imperfect) + gerund",
                "mientras / cuando",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-3",
      title: {
        en: "Future Tense",
        es: "Futuro",
      },
      description: {
        en: "Will do",
        es: "Haré",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-3-1",
          title: {
            en: "Tomorrow's World",
            es: "Futuro - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for future tense",
            es: "Aprende vocabulario clave para futuro",
          },
          xpRequired: 3400,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the simple future tense",
              focusPoints: [
                "hablaré, comerás, vivirá",
                "irregular stems: tendré, haré, podré, saldré",
                "markers: mañana, el año que viene, pronto",
              ],
            },
            grammar: {
              topic: "forming the future and expressing probability",
              focusPoints: [
                "infinitive + é/ás/á/emos/án",
                "future of probability (¿qué hora será?)",
                "ir a + infinitive vs simple future",
              ],
            },
          },
        },
        {
          id: "lesson-b1-3-2",
          title: {
            en: "Predictions",
            es: "Futuro - Práctica",
          },
          description: {
            en: "Practice future tense in conversation",
            es: "Practica futuro en conversación",
          },
          xpRequired: 3425,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "making plans and predictions for next year",
              prompt: "Practice the future for plans ('viajaré') and predictions ('lloverá')",
            },
            stories: {
              topic: "predictions and resolutions",
              prompt: "Read about future plans and discuss what will happen",
            },
          },
        },
        {
          id: "lesson-b1-3-3",
          title: {
            en: "Future Possibilities",
            es: "Futuro - Aplicación",
          },
          description: {
            en: "Apply future tense skills",
            es: "Aplica habilidades de futuro",
          },
          xpRequired: 3450,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "future tense vs 'ir a + infinitive'",
              prompt: "Read and compare 'iré' vs 'voy a ir'",
            },
            realtime: {
              scenario: "speculating about the future",
              prompt: "Demonstrate the future for plans, predictions, and probability",
            },
          },
        },
        {
          id: "lesson-b1-3-quiz",
          title: {
            en: "Future Tense Quiz",
            es: "Prueba de Futuro",
          },
          description: {
            en: "Test your knowledge of future tense",
            es: "Prueba tus conocimientos de futuro",
          },
          xpRequired: 3475,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the simple future",
              focusPoints: [
                "regular endings é/ás/á",
                "irregular stems: tendré, haré, podré",
              ],
            },
            grammar: {
              topics: [
                "forming and using the future",
              ],
              focusPoints: [
                "future of probability",
                "ir a + infinitive vs future",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-4",
      title: {
        en: "Comparisons",
        es: "Comparaciones",
      },
      description: {
        en: "More, less, equal",
        es: "Más, menos, igual",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-4-1",
          title: {
            en: "Better or Worse",
            es: "Mejor o Peor",
          },
          description: {
            en: "Learn key vocabulary for comparisons",
            es: "Aprende vocabulario clave para comparaciones",
          },
          xpRequired: 3525,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "comparatives and superlatives",
              focusPoints: [
                "más/menos ... que",
                "tan ... como, tanto ... como",
                "el/la más ... de",
              ],
            },
            grammar: {
              topic: "forming comparisons",
              focusPoints: [
                "irregulars: mejor, peor, mayor, menor",
                "superlative -ísimo (buenísimo)",
                "equality vs inequality",
              ],
            },
          },
        },
        {
          id: "lesson-b1-4-2",
          title: {
            en: "Making Comparisons",
            es: "Haciendo Comparaciones",
          },
          description: {
            en: "Practice comparisons in conversation",
            es: "Practica comparaciones en conversación",
          },
          xpRequired: 3550,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "comparing two cities you have lived in",
              prompt: "Practice 'más/menos... que' and 'tan... como' to compare",
            },
            stories: {
              topic: "comparisons in descriptions",
              prompt: "Read a comparison of two options and discuss",
            },
          },
        },
        {
          id: "lesson-b1-4-3",
          title: {
            en: "Superlatives",
            es: "Superlativos",
          },
          description: {
            en: "Apply comparisons skills",
            es: "Aplica habilidades de comparaciones",
          },
          xpRequired: 3575,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "nuances of comparison",
              prompt: "Read and notice equality vs inequality comparisons",
            },
            realtime: {
              scenario: "deciding between two options out loud",
              prompt: "Demonstrate comparatives and superlatives to weigh choices",
            },
          },
        },
        {
          id: "lesson-b1-4-quiz",
          title: {
            en: "Comparisons Quiz",
            es: "Prueba de Comparaciones",
          },
          description: {
            en: "Test your knowledge of comparisons",
            es: "Prueba tus conocimientos de comparaciones",
          },
          xpRequired: 3600,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "comparatives and superlatives",
              focusPoints: [
                "más/menos que, tan como",
                "el más / -ísimo",
              ],
            },
            grammar: {
              topics: [
                "forming comparisons",
              ],
              focusPoints: [
                "irregulars: mejor, peor, mayor, menor",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-5",
      title: {
        en: "Giving Advice",
        es: "Dar Consejos",
      },
      description: {
        en: "Should, must",
        es: "Debería, debe",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-5-1",
          title: {
            en: "Should and Shouldn't",
            es: "Deberías y No Deberías",
          },
          description: {
            en: "Learn key vocabulary for giving advice",
            es: "Aprende vocabulario clave para dar consejos",
          },
          xpRequired: 3650,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "language for giving advice",
              focusPoints: [
                "deberías / tendrías que / podrías",
                "te recomiendo / te aconsejo que",
                "lo mejor es que + subjunctive",
              ],
            },
            grammar: {
              topic: "advice structures",
              focusPoints: [
                "conditional for soft advice (deberías)",
                "recomendar/aconsejar que + subjunctive",
                "¿por qué no + present?",
              ],
            },
          },
        },
        {
          id: "lesson-b1-5-2",
          title: {
            en: "Helpful Suggestions",
            es: "Sugerencias Útiles",
          },
          description: {
            en: "Practice giving advice in conversation",
            es: "Practica dar consejos en conversación",
          },
          xpRequired: 3675,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "a friend asks you for advice about a problem",
              prompt: "Practice giving advice with 'deberías' and 'te recomiendo que'",
            },
            stories: {
              topic: "advice columns",
              prompt: "Read an advice exchange and discuss the suggestions",
            },
          },
        },
        {
          id: "lesson-b1-5-3",
          title: {
            en: "Problem Solving",
            es: "Resolviendo Problemas",
          },
          description: {
            en: "Apply giving advice skills",
            es: "Aplica habilidades de dar consejos",
          },
          xpRequired: 3700,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "direct vs softened advice",
              prompt: "Read and compare 'haz esto' vs 'yo que tú, haría esto'",
            },
            realtime: {
              scenario: "helping someone make a decision",
              prompt: "Demonstrate advice using conditional and subjunctive forms",
            },
          },
        },
        {
          id: "lesson-b1-5-quiz",
          title: {
            en: "Giving Advice Quiz",
            es: "Prueba de Dar Consejos",
          },
          description: {
            en: "Test your knowledge of giving advice",
            es: "Prueba tus conocimientos de dar consejos",
          },
          xpRequired: 3725,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "giving advice",
              focusPoints: [
                "deberías, tendrías que, podrías",
                "te recomiendo que + subjunctive",
              ],
            },
            grammar: {
              topics: [
                "advice structures",
              ],
              focusPoints: [
                "conditional for advice",
                "recomendar que + subjunctive",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-6",
      title: {
        en: "Making Suggestions",
        es: "Hacer Sugerencias",
      },
      description: {
        en: "Let's, why don't we",
        es: "Vamos, por qué no",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-6-1",
          title: {
            en: "Why Don't We?",
            es: "¿Por Qué No?",
          },
          description: {
            en: "Learn key vocabulary for making suggestions",
            es: "Aprende vocabulario clave para hacer sugerencias",
          },
          xpRequired: 3775,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "language for making suggestions",
              focusPoints: [
                "¿por qué no...? / ¿qué tal si...?",
                "podríamos / deberíamos",
                "¿te parece si...? / vamos a...",
              ],
            },
            grammar: {
              topic: "suggestion structures",
              focusPoints: [
                "nosotros suggestions (vamos a, podríamos)",
                "¿qué tal si + present?",
                "hay que + infinitive for general advice",
              ],
            },
          },
        },
        {
          id: "lesson-b1-6-2",
          title: {
            en: "Let's Try This",
            es: "Intentemos Esto",
          },
          description: {
            en: "Practice making suggestions in conversation",
            es: "Practica hacer sugerencias en conversación",
          },
          xpRequired: 3800,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "planning a weekend with friends",
              prompt: "Practice suggesting plans with '¿qué tal si...?' and 'podríamos'",
            },
            stories: {
              topic: "suggesting and agreeing on plans",
              prompt: "Read a chat where friends make plans and discuss",
            },
          },
        },
        {
          id: "lesson-b1-6-3",
          title: {
            en: "Collaborative Ideas",
            es: "Ideas Colaborativas",
          },
          description: {
            en: "Apply making suggestions skills",
            es: "Aplica habilidades de hacer sugerencias",
          },
          xpRequired: 3825,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "accepting and declining suggestions",
              prompt: "Read and notice how people accept ('¡vale!') or decline politely",
            },
            realtime: {
              scenario: "negotiating a group plan",
              prompt: "Demonstrate making, accepting, and declining suggestions",
            },
          },
        },
        {
          id: "lesson-b1-6-quiz",
          title: {
            en: "Making Suggestions Quiz",
            es: "Prueba de Hacer Sugerencias",
          },
          description: {
            en: "Test your knowledge of making suggestions",
            es: "Prueba tus conocimientos de hacer sugerencias",
          },
          xpRequired: 3850,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "making suggestions",
              focusPoints: [
                "¿por qué no...?, ¿qué tal si...?",
                "podríamos, vamos a",
              ],
            },
            grammar: {
              topics: [
                "suggestion structures",
              ],
              focusPoints: [
                "nosotros suggestions",
                "¿qué tal si + present?",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-7",
      title: {
        en: "Conditional Would",
        es: "Condicional",
      },
      description: {
        en: "I would...",
        es: "Yo haría...",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-7-1",
          title: {
            en: "If I Were You",
            es: "Condicional - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for conditional would",
            es: "Aprende vocabulario clave para condicional",
          },
          xpRequired: 3900,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the simple conditional (would)",
              focusPoints: [
                "hablaría, comerías, viviría",
                "irregular stems: tendría, haría, podría",
                "me gustaría, ¿podrías?",
              ],
            },
            grammar: {
              topic: "forming and using the conditional",
              focusPoints: [
                "infinitive + ía endings",
                "irregular stems (same as future)",
                "for politeness and hypotheticals",
              ],
            },
          },
        },
        {
          id: "lesson-b1-7-2",
          title: {
            en: "Hypothetical Situations",
            es: "Condicional - Práctica",
          },
          description: {
            en: "Practice conditional would in conversation",
            es: "Practica condicional en conversación",
          },
          xpRequired: 3925,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "making polite requests at a hotel",
              prompt: "Practice '¿podría...?' and 'me gustaría...' for polite requests",
            },
            stories: {
              topic: "what would you do? (hypotheticals)",
              prompt: "Read about a dilemma and discuss what you would do",
            },
          },
        },
        {
          id: "lesson-b1-7-3",
          title: {
            en: "Imagining Possibilities",
            es: "Condicional - Aplicación",
          },
          description: {
            en: "Apply conditional would skills",
            es: "Aplica habilidades de condicional",
          },
          xpRequired: 3950,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "conditional for advice and wishes",
              prompt: "Read and notice 'yo que tú, ...' and 'me encantaría...'",
            },
            realtime: {
              scenario: "giving polite advice (yo en tu lugar...)",
              prompt: "Demonstrate the conditional for politeness, wishes, and advice",
            },
          },
        },
        {
          id: "lesson-b1-7-quiz",
          title: {
            en: "Conditional Would Quiz",
            es: "Prueba de Condicional",
          },
          description: {
            en: "Test your knowledge of conditional would",
            es: "Prueba tus conocimientos de condicional",
          },
          xpRequired: 3975,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the conditional",
              focusPoints: [
                "regular -ía endings",
                "irregular stems: tendría, haría, podría",
              ],
            },
            grammar: {
              topics: [
                "forming and using the conditional",
              ],
              focusPoints: [
                "politeness (¿podrías?)",
                "hypotheticals (yo que tú)",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-8",
      title: {
        en: "Travel & Tourism",
        es: "Viajes y Turismo",
      },
      description: {
        en: "Traveling abroad",
        es: "Viajar al extranjero",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-8-1",
          title: {
            en: "Trip Planning",
            es: "Planeando Viajes",
          },
          description: {
            en: "Learn key vocabulary for travel & tourism",
            es: "Aprende vocabulario clave para viajes y turismo",
          },
          xpRequired: 4025,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "travel and tourism vocabulary",
              focusPoints: [
                "el vuelo, la maleta, el pasaporte",
                "el alojamiento, la reserva, el billete/boleto",
                "la aduana, el embarque",
              ],
            },
            grammar: {
              topic: "language for getting around",
              focusPoints: [
                "asking directions: ¿cómo llego a...?",
                "polite requests at a counter",
                "prepositions of place and movement",
              ],
            },
          },
        },
        {
          id: "lesson-b1-8-2",
          title: {
            en: "Booking a Trip",
            es: "Reservando un Viaje",
          },
          description: {
            en: "Practice travel & tourism in conversation",
            es: "Practica viajes y turismo en conversación",
          },
          xpRequired: 4050,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "checking in at the airport and asking about your flight",
              prompt: "Practice travel phrases for check-in, gates, and delays",
            },
            stories: {
              topic: "a travel anecdote",
              prompt: "Read a short trip story and discuss what happened",
            },
          },
        },
        {
          id: "lesson-b1-8-3",
          title: {
            en: "Adventure Awaits",
            es: "La Aventura Espera",
          },
          description: {
            en: "Apply travel & tourism skills",
            es: "Aplica habilidades de viajes y turismo",
          },
          xpRequired: 4075,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "bookings and itineraries",
              prompt: "Read a hotel or flight confirmation and find the key details",
            },
            realtime: {
              scenario: "booking a room and asking about the area",
              prompt: "Demonstrate travel vocabulary to book and ask for recommendations",
            },
          },
        },
        {
          id: "lesson-b1-8-quiz",
          title: {
            en: "Travel & Tourism Quiz",
            es: "Prueba de Viajes y Turismo",
          },
          description: {
            en: "Test your knowledge of travel & tourism",
            es: "Prueba tus conocimientos de viajes y turismo",
          },
          xpRequired: 4100,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "travel and tourism",
              focusPoints: [
                "vuelo, maleta, pasaporte, reserva",
                "billete/boleto, alojamiento",
              ],
            },
            grammar: {
              topics: [
                "language for getting around",
              ],
              focusPoints: [
                "asking directions",
                "polite requests at a counter",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-9",
      title: {
        en: "Environment",
        es: "Medio Ambiente",
      },
      description: {
        en: "Nature and ecology",
        es: "Naturaleza y ecología",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-9-1",
          title: {
            en: "Our Planet",
            es: "Nuestro Planeta",
          },
          description: {
            en: "Learn key vocabulary for environment",
            es: "Aprende vocabulario clave para medio ambiente",
          },
          xpRequired: 4150,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "environment and sustainability vocabulary",
              focusPoints: [
                "el medio ambiente, el cambio climático",
                "el reciclaje, la contaminación, los residuos",
                "la energía renovable, sostenible",
              ],
            },
            grammar: {
              topic: "talking about problems and solutions",
              focusPoints: [
                "impersonal se (se debería reciclar)",
                "hay que / es necesario + infinitive",
                "cause-and-effect connectors",
              ],
            },
          },
        },
        {
          id: "lesson-b1-9-2",
          title: {
            en: "Going Green",
            es: "Siendo Ecológico",
          },
          description: {
            en: "Practice environment in conversation",
            es: "Practica medio ambiente en conversación",
          },
          xpRequired: 4175,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "discussing how to be greener at home",
              prompt: "Practice environment vocabulary and 'deberíamos / hay que' for solutions",
            },
            stories: {
              topic: "an environmental news story",
              prompt: "Read about a local environmental issue and discuss",
            },
          },
        },
        {
          id: "lesson-b1-9-3",
          title: {
            en: "Saving Earth",
            es: "Salvando la Tierra",
          },
          description: {
            en: "Apply environment skills",
            es: "Aplica habilidades de medio ambiente",
          },
          xpRequired: 4200,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "environmental problems and proposals",
              prompt: "Read an article and identify the problem and proposed solutions",
            },
            realtime: {
              scenario: "debating a green policy",
              prompt: "Demonstrate environment vocabulary to argue for a solution",
            },
          },
        },
        {
          id: "lesson-b1-9-quiz",
          title: {
            en: "Environment Quiz",
            es: "Prueba de Medio Ambiente",
          },
          description: {
            en: "Test your knowledge of environment",
            es: "Prueba tus conocimientos de medio ambiente",
          },
          xpRequired: 4225,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "environment and sustainability",
              focusPoints: [
                "medio ambiente, cambio climático",
                "reciclaje, contaminación, energía renovable",
              ],
            },
            grammar: {
              topics: [
                "problems and solutions",
              ],
              focusPoints: [
                "impersonal se",
                "hay que / es necesario + infinitive",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-10",
      title: {
        en: "Culture & Traditions",
        es: "Cultura y Tradiciones",
      },
      description: {
        en: "Cultural practices",
        es: "Prácticas culturales",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-10-1",
          title: {
            en: "Cultural Heritage",
            es: "Patrimonio Cultural",
          },
          description: {
            en: "Learn key vocabulary for culture & traditions",
            es: "Aprende vocabulario clave para cultura y tradiciones",
          },
          xpRequired: 4275,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "culture and traditions vocabulary",
              focusPoints: [
                "la tradición, la costumbre, la fiesta",
                "el festival, el desfile, la gastronomía",
                "celebrar, festejar, disfrazarse",
              ],
            },
            grammar: {
              topic: "describing customs and habits",
              focusPoints: [
                "soler + infinitive (solemos celebrar)",
                "se + verb for general customs",
                "frequency expressions (cada año, suele)",
              ],
            },
          },
        },
        {
          id: "lesson-b1-10-2",
          title: {
            en: "Customs and Festivals",
            es: "Costumbres y Festivales",
          },
          description: {
            en: "Practice culture & traditions in conversation",
            es: "Practica cultura y tradiciones en conversación",
          },
          xpRequired: 4300,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "explaining a holiday from your country",
              prompt: "Practice describing a celebration with 'solemos' and 'se celebra'",
            },
            stories: {
              topic: "a traditional festival",
              prompt: "Read about a festival and discuss its customs",
            },
          },
        },
        {
          id: "lesson-b1-10-3",
          title: {
            en: "Celebrating Diversity",
            es: "Celebrando la Diversidad",
          },
          description: {
            en: "Apply culture & traditions skills",
            es: "Aplica habilidades de cultura y tradiciones",
          },
          xpRequired: 4325,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "comparing traditions",
              prompt: "Read about two celebrations and compare them",
            },
            realtime: {
              scenario: "inviting someone to a celebration and explaining it",
              prompt: "Demonstrate culture vocabulary to describe a tradition",
            },
          },
        },
        {
          id: "lesson-b1-10-quiz",
          title: {
            en: "Culture & Traditions Quiz",
            es: "Prueba de Cultura y Tradiciones",
          },
          description: {
            en: "Test your knowledge of culture & traditions",
            es: "Prueba tus conocimientos de cultura y tradiciones",
          },
          xpRequired: 4350,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "culture and traditions",
              focusPoints: [
                "tradición, costumbre, fiesta, festival",
                "gastronomía, desfile",
              ],
            },
            grammar: {
              topics: [
                "describing customs and habits",
              ],
              focusPoints: [
                "soler + infinitive",
                "se for general customs",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-11",
      title: {
        en: "Media & News",
        es: "Medios y Noticias",
      },
      description: {
        en: "News and media",
        es: "Noticias y medios",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-11-1",
          title: {
            en: "Headlines",
            es: "Titulares",
          },
          description: {
            en: "Learn key vocabulary for media & news",
            es: "Aprende vocabulario clave para medios y noticias",
          },
          xpRequired: 4400,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "media and news vocabulary",
              focusPoints: [
                "las noticias, el titular, el reportaje",
                "el periódico, la entrevista, la fuente",
                "las redes sociales, los medios",
              ],
            },
            grammar: {
              topic: "reporting what you read or heard",
              focusPoints: [
                "según + source (según el periódico)",
                "reported speech basics (dice que...)",
                "expressing certainty and doubt",
              ],
            },
          },
        },
        {
          id: "lesson-b1-11-2",
          title: {
            en: "Current Events",
            es: "Eventos Actuales",
          },
          description: {
            en: "Practice media & news in conversation",
            es: "Practica medios y noticias en conversación",
          },
          xpRequired: 4425,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "discussing a news story you saw",
              prompt: "Practice talking about the news with 'según...' and 'dicen que...'",
            },
            stories: {
              topic: "a short news article",
              prompt: "Read a headline and summary and discuss the story",
            },
          },
        },
        {
          id: "lesson-b1-11-3",
          title: {
            en: "Informed Citizen",
            es: "Ciudadano Informado",
          },
          description: {
            en: "Apply media & news skills",
            es: "Aplica habilidades de medios y noticias",
          },
          xpRequired: 4450,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "fact vs opinion in the news",
              prompt: "Read an article and separate facts from opinions",
            },
            realtime: {
              scenario: "reacting to current events",
              prompt: "Demonstrate media vocabulary to report and react to news",
            },
          },
        },
        {
          id: "lesson-b1-11-quiz",
          title: {
            en: "Media & News Quiz",
            es: "Prueba de Medios y Noticias",
          },
          description: {
            en: "Test your knowledge of media & news",
            es: "Prueba tus conocimientos de medios y noticias",
          },
          xpRequired: 4475,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "media and news",
              focusPoints: [
                "noticias, titular, reportaje",
                "redes sociales, fuente, medios",
              ],
            },
            grammar: {
              topics: [
                "reporting what you heard",
              ],
              focusPoints: [
                "según + source",
                "dice que...",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-12",
      title: {
        en: "Expressing Opinions",
        es: "Expresar Opiniones",
      },
      description: {
        en: "I think that...",
        es: "Creo que...",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-12-1",
          title: {
            en: "I Think That...",
            es: "Creo Que...",
          },
          description: {
            en: "Learn key vocabulary for expressing opinions",
            es: "Aprende vocabulario clave para expresar opiniones",
          },
          xpRequired: 4525,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "expressing and reacting to opinions",
              focusPoints: [
                "creo que, pienso que, me parece que",
                "en mi opinión, desde mi punto de vista",
                "estoy de acuerdo / en contra",
              ],
            },
            grammar: {
              topic: "opinion structures",
              focusPoints: [
                "creo que + indicative",
                "no creo que + subjunctive",
                "agreeing and disagreeing politely",
              ],
            },
          },
        },
        {
          id: "lesson-b1-12-2",
          title: {
            en: "Sharing Views",
            es: "Compartiendo Puntos de Vista",
          },
          description: {
            en: "Practice expressing opinions in conversation",
            es: "Practica expresar opiniones en conversación",
          },
          xpRequired: 4550,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "sharing opinions about a film with a friend",
              prompt: "Practice giving opinions and (dis)agreeing politely",
            },
            stories: {
              topic: "opinions in a discussion",
              prompt: "Read a debate and identify each person's opinion",
            },
          },
        },
        {
          id: "lesson-b1-12-3",
          title: {
            en: "Respectful Debate",
            es: "Debate Respetuoso",
          },
          description: {
            en: "Apply expressing opinions skills",
            es: "Aplica habilidades de expresar opiniones",
          },
          xpRequired: 4575,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "supporting an opinion with reasons",
              prompt: "Read an opinion and find the reasons given",
            },
            realtime: {
              scenario: "a friendly disagreement",
              prompt: "Demonstrate giving, supporting, and challenging opinions",
            },
          },
        },
        {
          id: "lesson-b1-12-quiz",
          title: {
            en: "Expressing Opinions Quiz",
            es: "Prueba de Expresar Opiniones",
          },
          description: {
            en: "Test your knowledge of expressing opinions",
            es: "Prueba tus conocimientos de expresar opiniones",
          },
          xpRequired: 4600,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "expressing opinions",
              focusPoints: [
                "creo que, me parece que, en mi opinión",
                "estoy de acuerdo / en contra",
              ],
            },
            grammar: {
              topics: [
                "opinion structures",
              ],
              focusPoints: [
                "creo que + indicative vs no creo que + subjunctive",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-13",
      title: {
        en: "Making Complaints",
        es: "Quejas",
      },
      description: {
        en: "Express dissatisfaction",
        es: "Expresar insatisfacción",
      },
      color: "#DB2777",
      position: { row: 6, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-13-1",
          title: {
            en: "Something's Wrong",
            es: "Quejas - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for making complaints",
            es: "Aprende vocabulario clave para quejas",
          },
          xpRequired: 4650,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "language for making a complaint",
              focusPoints: [
                "la queja, el reclamo, el reembolso",
                "no funciona, está roto, defectuoso",
                "devolver, cambiar, reclamar",
              ],
            },
            grammar: {
              topic: "complaining politely",
              focusPoints: [
                "softeners: quería, me gustaría, ¿sería posible?",
                "usted register for service",
                "the problem + the request",
              ],
            },
          },
        },
        {
          id: "lesson-b1-13-2",
          title: {
            en: "I'm Not Satisfied",
            es: "Quejas - Práctica",
          },
          description: {
            en: "Practice making complaints in conversation",
            es: "Practica quejas en conversación",
          },
          xpRequired: 4675,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "returning a faulty product to a store",
              prompt: "Practice complaining politely and asking for a refund",
            },
            stories: {
              topic: "a complaint letter or review",
              prompt: "Read a complaint and discuss the issue and the request",
            },
          },
        },
        {
          id: "lesson-b1-13-3",
          title: {
            en: "Resolving Issues",
            es: "Quejas - Aplicación",
          },
          description: {
            en: "Apply making complaints skills",
            es: "Aplica habilidades de quejas",
          },
          xpRequired: 4700,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "polite vs rude complaints",
              prompt: "Read two complaints and compare their tone",
            },
            realtime: {
              scenario: "complaining about a hotel room",
              prompt: "Demonstrate a polite, effective complaint",
            },
          },
        },
        {
          id: "lesson-b1-13-quiz",
          title: {
            en: "Making Complaints Quiz",
            es: "Prueba de Quejas",
          },
          description: {
            en: "Test your knowledge of making complaints",
            es: "Prueba tus conocimientos de quejas",
          },
          xpRequired: 4725,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "making complaints",
              focusPoints: [
                "queja, reclamo, reembolso",
                "no funciona, defectuoso, devolver",
              ],
            },
            grammar: {
              topics: [
                "complaining politely",
              ],
              focusPoints: [
                "softeners: quería, me gustaría",
                "usted register",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-14",
      title: {
        en: "Experiences",
        es: "Experiencias",
      },
      description: {
        en: "Life experiences",
        es: "Experiencias de vida",
      },
      color: "#0EA5E9",
      position: { row: 6, offset: 1 },
      lessons: [
        {
          id: "lesson-b1-14-1",
          title: {
            en: "Memorable Moments",
            es: "Momentos Memorables",
          },
          description: {
            en: "Learn key vocabulary for experiences",
            es: "Aprende vocabulario clave para experiencias",
          },
          xpRequired: 4775,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "talking about past experiences",
              focusPoints: [
                "alguna vez, nunca, una vez",
                "hace + time (hace dos años)",
                "he probado, he visitado",
              ],
            },
            grammar: {
              topic: "narrating experiences",
              focusPoints: [
                "present perfect for life experiences",
                "preterite for specific past events",
                "sequencing: primero, luego, al final",
              ],
            },
          },
        },
        {
          id: "lesson-b1-14-2",
          title: {
            en: "Sharing Experiences",
            es: "Compartiendo Experiencias",
          },
          description: {
            en: "Practice experiences in conversation",
            es: "Practica experiencias en conversación",
          },
          xpRequired: 4800,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "swapping travel and life stories with a friend",
              prompt: "Practice '¿alguna vez has...?' and narrating what happened",
            },
            stories: {
              topic: "a memorable experience",
              prompt: "Read someone's account of an experience and discuss",
            },
          },
        },
        {
          id: "lesson-b1-14-3",
          title: {
            en: "Learning from Life",
            es: "Aprendiendo de la Vida",
          },
          description: {
            en: "Apply experiences skills",
            es: "Aplica habilidades de experiencias",
          },
          xpRequired: 4825,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "ordering events in a story",
              prompt: "Read a narrative and follow its sequence of events",
            },
            realtime: {
              scenario: "telling the story of your best trip",
              prompt: "Demonstrate narrating an experience with linked past tenses",
            },
          },
        },
        {
          id: "lesson-b1-14-quiz",
          title: {
            en: "Experiences Quiz",
            es: "Prueba de Experiencias",
          },
          description: {
            en: "Test your knowledge of experiences",
            es: "Prueba tus conocimientos de experiencias",
          },
          xpRequired: 4850,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "past experiences",
              focusPoints: [
                "alguna vez, nunca, una vez",
                "hace + time",
              ],
            },
            grammar: {
              topics: [
                "narrating experiences",
              ],
              focusPoints: [
                "present perfect vs preterite",
                "sequencing connectors",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b1-15",
      title: {
        en: "Probability",
        es: "Probabilidad",
      },
      description: {
        en: "Maybe, might",
        es: "Quizás, podría",
      },
      color: "#22C55E",
      position: { row: 7, offset: 0 },
      lessons: [
        {
          id: "lesson-b1-15-1",
          title: {
            en: "Maybe and Perhaps",
            es: "Quizás y Tal Vez",
          },
          description: {
            en: "Learn key vocabulary for probability",
            es: "Aprende vocabulario clave para probabilidad",
          },
          xpRequired: 4900,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "expressing probability and possibility",
              focusPoints: [
                "quizás, tal vez, a lo mejor",
                "probablemente, seguramente",
                "es probable / posible que",
              ],
            },
            grammar: {
              topic: "probability structures",
              focusPoints: [
                "quizás/tal vez + subjunctive",
                "a lo mejor + indicative",
                "deber de + infinitive (must be)",
              ],
            },
          },
        },
        {
          id: "lesson-b1-15-2",
          title: {
            en: "Likely or Unlikely",
            es: "Probable o Improbable",
          },
          description: {
            en: "Practice probability in conversation",
            es: "Practica probabilidad en conversación",
          },
          xpRequired: 4925,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "guessing why a friend is running late",
              prompt: "Practice 'quizás esté...', 'a lo mejor...', and 'debe de estar...'",
            },
            stories: {
              topic: "speculating about a mystery",
              prompt: "Read a puzzling situation and discuss what probably happened",
            },
          },
        },
        {
          id: "lesson-b1-15-3",
          title: {
            en: "Making Predictions",
            es: "Haciendo Predicciones",
          },
          description: {
            en: "Apply probability skills",
            es: "Aplica habilidades de probabilidad",
          },
          xpRequired: 4950,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "degrees of certainty",
              prompt: "Read and rank how sure the writer is (seguramente vs quizás)",
            },
            realtime: {
              scenario: "predicting an uncertain outcome",
              prompt: "Demonstrate probability with the subjunctive and indicative",
            },
          },
        },
        {
          id: "lesson-b1-15-quiz",
          title: {
            en: "Probability Quiz",
            es: "Prueba de Probabilidad",
          },
          description: {
            en: "Test your knowledge of probability",
            es: "Prueba tus conocimientos de probabilidad",
          },
          xpRequired: 4975,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "probability and possibility",
              focusPoints: [
                "quizás, tal vez, a lo mejor",
                "es probable que",
              ],
            },
            grammar: {
              topics: [
                "probability structures",
              ],
              focusPoints: [
                "quizás + subjunctive vs a lo mejor + indicative",
                "deber de + infinitive",
              ],
            },
          },
        },
      ],
    },
  ],
  B2: [
    {
      id: "unit-b2-1",
      title: {
        en: "Past Perfect",
        es: "Pluscuamperfecto",
      },
      description: {
        en: "Had done",
        es: "Había hecho",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-1-1",
          title: {
            en: "Before It Happened",
            es: "Pluscuamperfecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for past perfect",
            es: "Aprende vocabulario clave para pluscuamperfecto",
          },
          xpRequired: 5025,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the past perfect (pluscuamperfecto)",
              focusPoints: [
                "había hablado, habías comido",
                "había + participle",
                "markers: ya, todavía no, antes de que",
              ],
            },
            grammar: {
              topic: "an action before another past action",
              focusPoints: [
                "haber (imperfect: había) + participle",
                "ya había... cuando...",
                "sequencing earlier past events",
              ],
            },
          },
        },
        {
          id: "lesson-b2-1-2",
          title: {
            en: "Earlier Actions",
            es: "Pluscuamperfecto - Práctica",
          },
          description: {
            en: "Practice past perfect in conversation",
            es: "Practica pluscuamperfecto en conversación",
          },
          xpRequired: 5055,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "explaining what had already happened before an event",
              prompt: "Practice 'cuando llegué, ya había...' to order past events",
            },
            stories: {
              topic: "flashbacks and backstory",
              prompt: "Read a narrative and notice earlier events (había...)",
            },
          },
        },
        {
          id: "lesson-b2-1-3",
          title: {
            en: "Complex Timelines",
            es: "Pluscuamperfecto - Aplicación",
          },
          description: {
            en: "Apply past perfect skills",
            es: "Aplica habilidades de pluscuamperfecto",
          },
          xpRequired: 5085,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "past perfect vs preterite and imperfect",
              prompt: "Read and order events using había + participle vs simple past",
            },
            realtime: {
              scenario: "recounting a misunderstanding that had built up",
              prompt: "Demonstrate the past perfect to sequence earlier and later past events",
            },
          },
        },
        {
          id: "lesson-b2-1-quiz",
          title: {
            en: "Past Perfect Quiz",
            es: "Prueba de Pluscuamperfecto",
          },
          description: {
            en: "Test your knowledge of past perfect",
            es: "Prueba tus conocimientos de pluscuamperfecto",
          },
          xpRequired: 5115,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the past perfect",
              focusPoints: [
                "había + participle",
                "ya, todavía no, antes de que",
              ],
            },
            grammar: {
              topics: [
                "sequencing past events",
              ],
              focusPoints: [
                "había + participle",
                "past perfect vs preterite",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-2",
      title: {
        en: "Passive Voice",
        es: "Voz Pasiva",
      },
      description: {
        en: "Is done by",
        es: "Es hecho por",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-2-1",
          title: {
            en: "It Was Done",
            es: "Fue Hecho",
          },
          description: {
            en: "Learn key vocabulary for passive voice",
            es: "Aprende vocabulario clave para voz pasiva",
          },
          xpRequired: 5175,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "the passive voice",
              focusPoints: [
                "ser + participle + por (fue construido por)",
                "pasiva refleja: se venden casas",
                "estar + participle: la puerta está cerrada",
              ],
            },
            grammar: {
              topic: "forming and choosing passive structures",
              focusPoints: [
                "ser-passive vs pasiva refleja (se)",
                "agreement of the participle",
                "when to use passive vs active",
              ],
            },
          },
        },
        {
          id: "lesson-b2-2-2",
          title: {
            en: "Formal Writing",
            es: "Escritura Formal",
          },
          description: {
            en: "Practice passive voice in conversation",
            es: "Practica voz pasiva en conversación",
          },
          xpRequired: 5205,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "describing how a product is made",
              prompt: "Practice 'se hace...' and 'es fabricado por...' to describe processes",
            },
            stories: {
              topic: "the passive voice in reports and news",
              prompt: "Read a news report and notice passive constructions",
            },
          },
        },
        {
          id: "lesson-b2-2-3",
          title: {
            en: "Professional Tone",
            es: "Tono Profesional",
          },
          description: {
            en: "Apply passive voice skills",
            es: "Aplica habilidades de voz pasiva",
          },
          xpRequired: 5235,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "passive vs active and impersonal se",
              prompt: "Read and convert between active, passive, and impersonal",
            },
            realtime: {
              scenario: "explaining a procedure formally",
              prompt: "Demonstrate passive and pasiva refleja in a formal description",
            },
          },
        },
        {
          id: "lesson-b2-2-quiz",
          title: {
            en: "Passive Voice Quiz",
            es: "Prueba de Voz Pasiva",
          },
          description: {
            en: "Test your knowledge of passive voice",
            es: "Prueba tus conocimientos de voz pasiva",
          },
          xpRequired: 5265,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "the passive voice",
              focusPoints: [
                "ser + participle + por",
                "pasiva refleja (se vende)",
                "estar + participle",
              ],
            },
            grammar: {
              topics: [
                "forming and choosing passive structures",
              ],
              focusPoints: [
                "ser-passive vs pasiva refleja",
                "participle agreement",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-3",
      title: {
        en: "Reported Speech",
        es: "Discurso Indirecto",
      },
      description: {
        en: "He said that...",
        es: "Él dijo que...",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-3-1",
          title: {
            en: "She Said That...",
            es: "Discurso Indirecto - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for reported speech",
            es: "Aprende vocabulario clave para discurso indirecto",
          },
          xpRequired: 5325,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "reporting what others said",
              focusPoints: [
                "dijo que, comentó que, añadió que",
                "preguntó si / qué / cuándo",
                "pidió/sugirió que + subjunctive",
              ],
            },
            grammar: {
              topic: "reported speech and backshift",
              focusPoints: [
                "present → imperfect (dice → dijo que ...aba)",
                "preterite → past perfect, future → conditional",
                "deixis: aquí→allí, hoy→aquel día",
              ],
            },
          },
        },
        {
          id: "lesson-b2-3-2",
          title: {
            en: "Quoting Others",
            es: "Discurso Indirecto - Práctica",
          },
          description: {
            en: "Practice reported speech in conversation",
            es: "Practica discurso indirecto en conversación",
          },
          xpRequired: 5355,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "passing on a message from one friend to another",
              prompt: "Practice 'me dijo que...' and 'me preguntó si...' with backshift",
            },
            stories: {
              topic: "reporting a conversation",
              prompt: "Read a dialogue and retell it in reported speech",
            },
          },
        },
        {
          id: "lesson-b2-3-3",
          title: {
            en: "Retelling Stories",
            es: "Discurso Indirecto - Aplicación",
          },
          description: {
            en: "Apply reported speech skills",
            es: "Aplica habilidades de discurso indirecto",
          },
          xpRequired: 5385,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "direct vs reported speech",
              prompt: "Read and convert quotes into reported speech",
            },
            realtime: {
              scenario: "relaying an argument you witnessed",
              prompt: "Demonstrate reported speech with correct tense and pronoun shifts",
            },
          },
        },
        {
          id: "lesson-b2-3-quiz",
          title: {
            en: "Reported Speech Quiz",
            es: "Prueba de Discurso Indirecto",
          },
          description: {
            en: "Test your knowledge of reported speech",
            es: "Prueba tus conocimientos de discurso indirecto",
          },
          xpRequired: 5415,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "reported speech",
              focusPoints: [
                "dijo que, preguntó si, pidió que",
                "comentó, añadió, sugirió",
              ],
            },
            grammar: {
              topics: [
                "reported speech and backshift",
              ],
              focusPoints: [
                "tense backshift",
                "deixis: aquí→allí, hoy→aquel día",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-4",
      title: {
        en: "Relative Clauses",
        es: "Cláusulas Relativas",
      },
      description: {
        en: "Who, which, that",
        es: "Que, quien",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-4-1",
          title: {
            en: "Who, Which, That",
            es: "Quien, Cual, Que",
          },
          description: {
            en: "Learn key vocabulary for relative clauses",
            es: "Aprende vocabulario clave para cláusulas relativas",
          },
          xpRequired: 5475,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "relative pronouns",
              focusPoints: [
                "que, quien/quienes",
                "el/la que, el/la cual",
                "cuyo/a, donde",
              ],
            },
            grammar: {
              topic: "joining sentences with relative clauses",
              focusPoints: [
                "restrictive vs non-restrictive (commas)",
                "preposition + relative: con quien, en el que",
                "cuyo for possession",
              ],
            },
          },
        },
        {
          id: "lesson-b2-4-2",
          title: {
            en: "Connecting Ideas",
            es: "Conectando Ideas",
          },
          description: {
            en: "Practice relative clauses in conversation",
            es: "Practica cláusulas relativas en conversación",
          },
          xpRequired: 5505,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "describing a person or place precisely",
              prompt: "Practice combining ideas with 'que', 'quien', and 'donde'",
            },
            stories: {
              topic: "relative clauses in descriptions",
              prompt: "Read a detailed description and notice the relative clauses",
            },
          },
        },
        {
          id: "lesson-b2-4-3",
          title: {
            en: "Complex Sentences",
            es: "Oraciones Complejas",
          },
          description: {
            en: "Apply relative clauses skills",
            es: "Aplica habilidades de cláusulas relativas",
          },
          xpRequired: 5535,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "complex relative clauses",
              prompt: "Read sentences with 'el cual' and 'cuyo' and unpack them",
            },
            realtime: {
              scenario: "defining something without naming it",
              prompt: "Demonstrate relative clauses to define and add information",
            },
          },
        },
        {
          id: "lesson-b2-4-quiz",
          title: {
            en: "Relative Clauses Quiz",
            es: "Prueba de Cláusulas Relativas",
          },
          description: {
            en: "Test your knowledge of relative clauses",
            es: "Prueba tus conocimientos de cláusulas relativas",
          },
          xpRequired: 5565,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "relative pronouns",
              focusPoints: [
                "que, quien, el que/el cual",
                "cuyo, donde",
              ],
            },
            grammar: {
              topics: [
                "relative clauses",
              ],
              focusPoints: [
                "restrictive vs non-restrictive",
                "preposition + relative",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-5",
      title: {
        en: "Formal vs Informal",
        es: "Formal e Informal",
      },
      description: {
        en: "Register switching",
        es: "Cambio de registro",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-5-1",
          title: {
            en: "Registers of Speech",
            es: "Formal e Informal - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for formal vs informal",
            es: "Aprende vocabulario clave para formal e informal",
          },
          xpRequired: 5625,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "formal and informal register",
              focusPoints: [
                "tú vs usted (and ustedes)",
                "informal: hola, ¿qué tal?, un beso",
                "formal: buenos días, atentamente",
              ],
            },
            grammar: {
              topic: "shifting register",
              focusPoints: [
                "verb agreement with tú vs usted",
                "softened requests (¿le importaría...?)",
                "formal vs colloquial vocabulary",
              ],
            },
          },
        },
        {
          id: "lesson-b2-5-2",
          title: {
            en: "Appropriate Language",
            es: "Formal e Informal - Práctica",
          },
          description: {
            en: "Practice formal vs informal in conversation",
            es: "Practica formal e informal en conversación",
          },
          xpRequired: 5655,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "the same message to a friend vs to your boss",
              prompt: "Practice switching between tú/informal and usted/formal",
            },
            stories: {
              topic: "register in messages and letters",
              prompt: "Read a formal and an informal message and compare them",
            },
          },
        },
        {
          id: "lesson-b2-5-3",
          title: {
            en: "Context Matters",
            es: "Formal e Informal - Aplicación",
          },
          description: {
            en: "Apply formal vs informal skills",
            es: "Aplica habilidades de formal e informal",
          },
          xpRequired: 5685,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "matching register to context",
              prompt: "Read texts and judge whether the register fits the situation",
            },
            realtime: {
              scenario: "introducing yourself in an interview vs at a party",
              prompt: "Demonstrate appropriate register for formal and informal settings",
            },
          },
        },
        {
          id: "lesson-b2-5-quiz",
          title: {
            en: "Formal vs Informal Quiz",
            es: "Prueba de Formal e Informal",
          },
          description: {
            en: "Test your knowledge of formal vs informal",
            es: "Prueba tus conocimientos de formal e informal",
          },
          xpRequired: 5715,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "formal vs informal register",
              focusPoints: [
                "tú vs usted",
                "formal vs colloquial greetings",
              ],
            },
            grammar: {
              topics: [
                "shifting register",
              ],
              focusPoints: [
                "tú vs usted agreement",
                "softened formal requests",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-6",
      title: {
        en: "Business Spanish",
        es: "Español de Negocios",
      },
      description: {
        en: "Professional language",
        es: "Lenguaje profesional",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-6-1",
          title: {
            en: "Corporate World",
            es: "Mundo Corporativo",
          },
          description: {
            en: "Learn key vocabulary for business spanish",
            es: "Aprende vocabulario clave para español de negocios",
          },
          xpRequired: 5775,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "business vocabulary",
              focusPoints: [
                "la empresa, el departamento, el cargo",
                "las ventas, el presupuesto, el contrato",
                "el cliente, el proveedor, la reunión",
              ],
            },
            grammar: {
              topic: "business communication structures",
              focusPoints: [
                "formal email openings and closings",
                "le agradecería que + subjunctive",
                "polite negotiation phrases",
              ],
            },
          },
        },
        {
          id: "lesson-b2-6-2",
          title: {
            en: "Professional Meetings",
            es: "Reuniones Profesionales",
          },
          description: {
            en: "Practice business spanish in conversation",
            es: "Practica español de negocios en conversación",
          },
          xpRequired: 5805,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "a meeting to discuss a project deadline",
              prompt: "Practice business vocabulary for meetings and updates",
            },
            stories: {
              topic: "a business email exchange",
              prompt: "Read a professional email thread and discuss its purpose",
            },
          },
        },
        {
          id: "lesson-b2-6-3",
          title: {
            en: "Business Communication",
            es: "Comunicación Empresarial",
          },
          description: {
            en: "Apply business spanish skills",
            es: "Aplica habilidades de español de negocios",
          },
          xpRequired: 5835,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "interpreting business documents",
              prompt: "Read a short proposal or report and find the key points",
            },
            realtime: {
              scenario: "negotiating terms with a client",
              prompt: "Demonstrate professional negotiation language",
            },
          },
        },
        {
          id: "lesson-b2-6-quiz",
          title: {
            en: "Business Spanish Quiz",
            es: "Prueba de Español de Negocios",
          },
          description: {
            en: "Test your knowledge of business spanish",
            es: "Prueba tus conocimientos de español de negocios",
          },
          xpRequired: 5865,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "business vocabulary",
              focusPoints: [
                "empresa, ventas, presupuesto, contrato",
                "cliente, proveedor, reunión",
              ],
            },
            grammar: {
              topics: [
                "business communication structures",
              ],
              focusPoints: [
                "formal email formulas",
                "polite negotiation phrases",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-7",
      title: {
        en: "Science & Innovation",
        es: "Ciencia e Innovación",
      },
      description: {
        en: "Scientific topics",
        es: "Temas científicos",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-7-1",
          title: {
            en: "Scientific Terms",
            es: "Términos Científicos",
          },
          description: {
            en: "Learn key vocabulary for science & innovation",
            es: "Aprende vocabulario clave para ciencia e innovación",
          },
          xpRequired: 5925,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "science and technology vocabulary",
              focusPoints: [
                "la investigación, el experimento, la hipótesis",
                "la tecnología, el descubrimiento, los datos",
                "la inteligencia artificial, el avance",
              ],
            },
            grammar: {
              topic: "explaining processes and findings",
              focusPoints: [
                "impersonal se (se demostró que)",
                "passive voice for results",
                "connectors: debido a, por lo tanto",
              ],
            },
          },
        },
        {
          id: "lesson-b2-7-2",
          title: {
            en: "Technological Advances",
            es: "Avances Tecnológicos",
          },
          description: {
            en: "Practice science & innovation in conversation",
            es: "Practica ciencia e innovación en conversación",
          },
          xpRequired: 5955,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "explaining a new technology to a friend",
              prompt: "Practice science vocabulary to describe how something works",
            },
            stories: {
              topic: "a popular-science article",
              prompt: "Read about a discovery and discuss its impact",
            },
          },
        },
        {
          id: "lesson-b2-7-3",
          title: {
            en: "Future of Science",
            es: "Futuro de la Ciencia",
          },
          description: {
            en: "Apply science & innovation skills",
            es: "Aplica habilidades de ciencia e innovación",
          },
          xpRequired: 5985,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "comprehending science writing",
              prompt: "Read a science text and paraphrase the main finding",
            },
            realtime: {
              scenario: "debating the pros and cons of AI",
              prompt: "Demonstrate science vocabulary to argue a position",
            },
          },
        },
        {
          id: "lesson-b2-7-quiz",
          title: {
            en: "Science & Innovation Quiz",
            es: "Prueba de Ciencia e Innovación",
          },
          description: {
            en: "Test your knowledge of science & innovation",
            es: "Prueba tus conocimientos de ciencia e innovación",
          },
          xpRequired: 6015,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "science and technology",
              focusPoints: [
                "investigación, experimento, hipótesis",
                "tecnología, datos, inteligencia artificial",
              ],
            },
            grammar: {
              topics: [
                "explaining processes and findings",
              ],
              focusPoints: [
                "impersonal se, passive for results",
                "cause/result connectors",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-8",
      title: {
        en: "Social Issues",
        es: "Problemas Sociales",
      },
      description: {
        en: "Society and issues",
        es: "Sociedad y problemas",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-8-1",
          title: {
            en: "Society Today",
            es: "Problemas Sociales - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for social issues",
            es: "Aprende vocabulario clave para problemas sociales",
          },
          xpRequired: 6075,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "social issues vocabulary",
              focusPoints: [
                "la desigualdad, la pobreza, los derechos",
                "la justicia, la inmigración, la discriminación",
                "el voluntariado, la solidaridad",
              ],
            },
            grammar: {
              topic: "discussing problems and proposals",
              focusPoints: [
                "es injusto que / no creo que + subjunctive",
                "expressing cause and consequence",
                "general/impersonal statements",
              ],
            },
          },
        },
        {
          id: "lesson-b2-8-2",
          title: {
            en: "Discussing Problems",
            es: "Problemas Sociales - Práctica",
          },
          description: {
            en: "Practice social issues in conversation",
            es: "Practica problemas sociales en conversación",
          },
          xpRequired: 6105,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "discussing a social problem in your community",
              prompt: "Practice social-issue vocabulary and opinion structures",
            },
            stories: {
              topic: "a story about a social cause",
              prompt: "Read about a community initiative and discuss it",
            },
          },
        },
        {
          id: "lesson-b2-8-3",
          title: {
            en: "Making Change",
            es: "Problemas Sociales - Aplicación",
          },
          description: {
            en: "Apply social issues skills",
            es: "Aplica habilidades de problemas sociales",
          },
          xpRequired: 6135,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "argument and evidence on social issues",
              prompt: "Read an opinion piece and identify claims and support",
            },
            realtime: {
              scenario: "proposing a solution to inequality",
              prompt: "Demonstrate social vocabulary to argue for change",
            },
          },
        },
        {
          id: "lesson-b2-8-quiz",
          title: {
            en: "Social Issues Quiz",
            es: "Prueba de Problemas Sociales",
          },
          description: {
            en: "Test your knowledge of social issues",
            es: "Prueba tus conocimientos de problemas sociales",
          },
          xpRequired: 6165,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "social issues",
              focusPoints: [
                "desigualdad, pobreza, derechos",
                "justicia, inmigración, discriminación",
              ],
            },
            grammar: {
              topics: [
                "discussing problems and proposals",
              ],
              focusPoints: [
                "es injusto que + subjunctive",
                "cause and consequence",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-9",
      title: {
        en: "Arts & Literature",
        es: "Artes y Literatura",
      },
      description: {
        en: "Cultural works",
        es: "Obras culturales",
      },
      color: "#F97316",
      position: { row: 4, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-9-1",
          title: {
            en: "Creative Expression",
            es: "Expresión Creativa",
          },
          description: {
            en: "Learn key vocabulary for arts & literature",
            es: "Aprende vocabulario clave para artes y literatura",
          },
          xpRequired: 6225,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "arts and literature vocabulary",
              focusPoints: [
                "la novela, el cuento, el autor",
                "la obra, la pintura, la escultura",
                "el género, la trama, el personaje",
              ],
            },
            grammar: {
              topic: "describing and reviewing art",
              focusPoints: [
                "se trata de / trata sobre",
                "opinion + reason (me gustó porque)",
                "past tenses to summarize a plot",
              ],
            },
          },
        },
        {
          id: "lesson-b2-9-2",
          title: {
            en: "Artistic Movements",
            es: "Movimientos Artísticos",
          },
          description: {
            en: "Practice arts & literature in conversation",
            es: "Practica artes y literatura en conversación",
          },
          xpRequired: 6255,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "recommending a book or film to a friend",
              prompt: "Practice summarizing a plot and giving your opinion",
            },
            stories: {
              topic: "a book or film review",
              prompt: "Read a review and discuss the opinion and reasons",
            },
          },
        },
        {
          id: "lesson-b2-9-3",
          title: {
            en: "Cultural Analysis",
            es: "Análisis Cultural",
          },
          description: {
            en: "Apply arts & literature skills",
            es: "Aplica habilidades de artes y literatura",
          },
          xpRequired: 6285,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "interpreting a short literary text",
              prompt: "Read a passage and discuss its theme and characters",
            },
            realtime: {
              scenario: "discussing your favorite work",
              prompt: "Demonstrate arts vocabulary to describe and evaluate a work",
            },
          },
        },
        {
          id: "lesson-b2-9-quiz",
          title: {
            en: "Arts & Literature Quiz",
            es: "Prueba de Artes y Literatura",
          },
          description: {
            en: "Test your knowledge of arts & literature",
            es: "Prueba tus conocimientos de artes y literatura",
          },
          xpRequired: 6315,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "arts and literature",
              focusPoints: [
                "novela, cuento, autor, obra",
                "género, trama, personaje",
              ],
            },
            grammar: {
              topics: [
                "describing and reviewing art",
              ],
              focusPoints: [
                "se trata de / trata sobre",
                "opinion + reason",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-10",
      title: {
        en: "Politics & Society",
        es: "Política y Sociedad",
      },
      description: {
        en: "Civic topics",
        es: "Temas cívicos",
      },
      color: "#84CC16",
      position: { row: 4, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-10-1",
          title: {
            en: "Civic Engagement",
            es: "Participación Cívica",
          },
          description: {
            en: "Learn key vocabulary for politics & society",
            es: "Aprende vocabulario clave para política y sociedad",
          },
          xpRequired: 6375,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "politics and society vocabulary",
              focusPoints: [
                "el gobierno, las elecciones, el partido",
                "la ley, el ciudadano, el derecho",
                "votar, gobernar, la democracia",
              ],
            },
            grammar: {
              topic: "discussing politics respectfully",
              focusPoints: [
                "dudo que / no creo que + subjunctive",
                "concession (aunque, si bien)",
                "impersonal opinions (se dice que)",
              ],
            },
          },
        },
        {
          id: "lesson-b2-10-2",
          title: {
            en: "Political Discourse",
            es: "Discurso Político",
          },
          description: {
            en: "Practice politics & society in conversation",
            es: "Practica política y sociedad en conversación",
          },
          xpRequired: 6405,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "a calm discussion about an election",
              prompt: "Practice politics vocabulary and balanced opinion language",
            },
            stories: {
              topic: "a news piece on a policy",
              prompt: "Read about a political issue and discuss different views",
            },
          },
        },
        {
          id: "lesson-b2-10-3",
          title: {
            en: "Active Citizenship",
            es: "Ciudadanía Activa",
          },
          description: {
            en: "Apply politics & society skills",
            es: "Aplica habilidades de política y sociedad",
          },
          xpRequired: 6435,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "bias and perspective in political texts",
              prompt: "Read two takes on an issue and compare their stance",
            },
            realtime: {
              scenario: "debating a policy proposal politely",
              prompt: "Demonstrate politics vocabulary with concession and rebuttal",
            },
          },
        },
        {
          id: "lesson-b2-10-quiz",
          title: {
            en: "Politics & Society Quiz",
            es: "Prueba de Política y Sociedad",
          },
          description: {
            en: "Test your knowledge of politics & society",
            es: "Prueba tus conocimientos de política y sociedad",
          },
          xpRequired: 6465,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "politics and society",
              focusPoints: [
                "gobierno, elecciones, partido, ley",
                "ciudadano, votar, democracia",
              ],
            },
            grammar: {
              topics: [
                "discussing politics",
              ],
              focusPoints: [
                "dudo que + subjunctive",
                "concession: aunque, si bien",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-11",
      title: {
        en: "Health & Lifestyle",
        es: "Salud y Estilo de Vida",
      },
      description: {
        en: "Wellness",
        es: "Bienestar",
      },
      color: "#14B8A6",
      position: { row: 5, offset: 0 },
      lessons: [
        {
          id: "lesson-b2-11-1",
          title: {
            en: "Wellness Choices",
            es: "Elecciones de Bienestar",
          },
          description: {
            en: "Learn key vocabulary for health & lifestyle",
            es: "Aprende vocabulario clave para salud y estilo de vida",
          },
          xpRequired: 6525,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "health and lifestyle vocabulary",
              focusPoints: [
                "la salud, el bienestar, la dieta",
                "el ejercicio, el estrés, el descanso",
                "los hábitos, el sueño, la alimentación",
              ],
            },
            grammar: {
              topic: "talking about habits and advice",
              focusPoints: [
                "soler + infinitive for routines",
                "es bueno que / te recomiendo que + subjunctive",
                "reflexive verbs (cuidarse, relajarse)",
              ],
            },
          },
        },
        {
          id: "lesson-b2-11-2",
          title: {
            en: "Balanced Living",
            es: "Vida Equilibrada",
          },
          description: {
            en: "Practice health & lifestyle in conversation",
            es: "Practica salud y estilo de vida en conversación",
          },
          xpRequired: 6555,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "talking to a friend about healthier habits",
              prompt: "Practice health vocabulary and advice ('deberías', 'es bueno que')",
            },
            stories: {
              topic: "a wellness article",
              prompt: "Read tips on a healthy lifestyle and discuss",
            },
          },
        },
        {
          id: "lesson-b2-11-3",
          title: {
            en: "Holistic Health",
            es: "Salud Holística",
          },
          description: {
            en: "Apply health & lifestyle skills",
            es: "Aplica habilidades de salud y estilo de vida",
          },
          xpRequired: 6585,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "habits and their effects",
              prompt: "Read about a habit and its impact on health",
            },
            realtime: {
              scenario: "at the doctor describing symptoms and getting advice",
              prompt: "Demonstrate health vocabulary to describe a problem and advice",
            },
          },
        },
        {
          id: "lesson-b2-11-quiz",
          title: {
            en: "Health & Lifestyle Quiz",
            es: "Prueba de Salud y Estilo de Vida",
          },
          description: {
            en: "Test your knowledge of health & lifestyle",
            es: "Prueba tus conocimientos de salud y estilo de vida",
          },
          xpRequired: 6615,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "health and lifestyle",
              focusPoints: [
                "salud, bienestar, dieta, ejercicio",
                "estrés, hábitos, descanso",
              ],
            },
            grammar: {
              topics: [
                "habits and advice",
              ],
              focusPoints: [
                "soler + infinitive",
                "es bueno que + subjunctive",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-b2-12",
      title: {
        en: "Abstract Concepts",
        es: "Conceptos Abstractos",
      },
      description: {
        en: "Complex ideas",
        es: "Ideas complejas",
      },
      color: "#A855F7",
      position: { row: 5, offset: 1 },
      lessons: [
        {
          id: "lesson-b2-12-1",
          title: {
            en: "Philosophical Ideas",
            es: "Ideas Filosóficas",
          },
          description: {
            en: "Learn key vocabulary for abstract concepts",
            es: "Aprende vocabulario clave para conceptos abstractos",
          },
          xpRequired: 6675,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "vocabulary for abstract ideas",
              focusPoints: [
                "la libertad, la felicidad, la justicia",
                "el éxito, la verdad, el tiempo",
                "el significado, el propósito",
              ],
            },
            grammar: {
              topic: "discussing abstract concepts",
              focusPoints: [
                "lo + adjective (lo importante, lo difícil)",
                "subjunctive after value judgments (es esencial que)",
                "nominalization of verbs",
              ],
            },
          },
        },
        {
          id: "lesson-b2-12-2",
          title: {
            en: "Deep Thinking",
            es: "Pensamiento Profundo",
          },
          description: {
            en: "Practice abstract concepts in conversation",
            es: "Practica conceptos abstractos en conversación",
          },
          xpRequired: 6705,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "a philosophical chat about happiness",
              prompt: "Practice abstract vocabulary and 'lo + adjetivo' to discuss ideas",
            },
            stories: {
              topic: "an essay on an abstract theme",
              prompt: "Read a reflective text and discuss its main idea",
            },
          },
        },
        {
          id: "lesson-b2-12-3",
          title: {
            en: "Theoretical Discussion",
            es: "Discusión Teórica",
          },
          description: {
            en: "Apply abstract concepts skills",
            es: "Aplica habilidades de conceptos abstractos",
          },
          xpRequired: 6735,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "interpreting abstract arguments",
              prompt: "Read a philosophical passage and paraphrase its point",
            },
            realtime: {
              scenario: "defending what success means to you",
              prompt: "Demonstrate abstract vocabulary to express a nuanced view",
            },
          },
        },
        {
          id: "lesson-b2-12-quiz",
          title: {
            en: "Abstract Concepts Quiz",
            es: "Prueba de Conceptos Abstractos",
          },
          description: {
            en: "Test your knowledge of abstract concepts",
            es: "Prueba tus conocimientos de conceptos abstractos",
          },
          xpRequired: 6765,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 10,
            passingScore: 8,
          },
          content: {
            vocabulary: {
              topic: "abstract concepts",
              focusPoints: [
                "libertad, felicidad, justicia",
                "éxito, verdad, propósito",
              ],
            },
            grammar: {
              topics: [
                "discussing abstract concepts",
              ],
              focusPoints: [
                "lo + adjetivo",
                "subjunctive after value judgments",
              ],
            },
          },
        },
      ],
    },
  ],
  C1: [
    {
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
              topic: "verbs and expressions that trigger the present subjunctive",
              focusPoints: [
                "querer que, esperar que, dudar que",
                "es importante que, es necesario que",
                "ojalá (que)",
              ],
            },
            grammar: {
              topic: "forming the present subjunctive",
              focusPoints: [
                "regular: hable, coma, viva",
                "irregulars: sea, vaya, haya, sepa, dé",
                "stem changes: pueda, quiera, pida",
              ],
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
              scenario: "giving advice and wishes to a friend (espero que te vaya bien)",
              prompt:
                "Practice the present subjunctive after querer que, esperar que, and ojalá",
            },
            stories: {
              topic: "the subjunctive in opinions and emotions",
              prompt:
                "Read a text and spot the subjunctive after 'me alegra que' and 'es una lástima que'",
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
              topic: "subjunctive vs indicative in subordinate clauses",
              prompt:
                "Read and decide when a clause needs subjunctive (doubt, emotion, wish) vs indicative (fact)",
            },
            realtime: {
              scenario: "negotiating plans using cuando, para que, and a menos que",
              prompt:
                "Demonstrate the present subjunctive in purpose, time, and condition clauses",
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
              topic: "present subjunctive triggers",
              focusPoints: [
                "querer/esperar/dudar que",
                "es importante/necesario que, ojalá",
              ],
            },
            grammar: {
              topics: ["forming and using the present subjunctive"],
              focusPoints: ["subjunctive vs indicative"],
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
              topic: "past-tense triggers for the imperfect subjunctive",
              focusPoints: [
                "quería que, esperaba que, dudaba que",
                "como si + past subjunctive",
                "ojalá (pudiera)",
              ],
            },
            grammar: {
              topic: "forming the imperfect subjunctive (-ra and -se forms)",
              focusPoints: [
                "hablara/hablase, comiera/comiese",
                "irregulars: fuera, tuviera, pudiera, hiciera",
                "built from the 3rd-person plural preterite stem",
              ],
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
              scenario: "making polite requests with quisiera and me gustaría que",
              prompt:
                "Practice softening requests and wishes with the imperfect subjunctive",
            },
            stories: {
              topic: "the past subjunctive in storytelling and hypotheticals",
              prompt:
                "Read a narrative and notice 'como si fuera' and reported wishes",
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
              topic: "imperfect subjunctive in si-clauses and reported speech",
              prompt:
                "Read and identify hypothetical and past-wish uses of the imperfect subjunctive",
            },
            realtime: {
              scenario: "talking about unreal situations (si tuviera tiempo, viajaría)",
              prompt:
                "Demonstrate the imperfect subjunctive in si-clauses and after past-tense triggers",
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
              topic: "imperfect subjunctive triggers",
              focusPoints: [
                "quería/esperaba/dudaba que",
                "como si, ojalá + past subjunctive",
              ],
            },
            grammar: {
              topics: ["forming and using the imperfect subjunctive"],
              focusPoints: ["-ra/-se forms (fuera, tuviera)", "si-clauses"],
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
              topic: "connectors for conditions and hypotheses",
              focusPoints: [
                "si, a menos que, en caso de que",
                "siempre que, con tal de que",
                "de + infinitive (de haberlo sabido)",
              ],
            },
            grammar: {
              topic: "the three types of si-clauses",
              focusPoints: [
                "si tengo tiempo, iré (real)",
                "si tuviera tiempo, iría (unreal present)",
                "si hubiera tenido tiempo, habría ido (unreal past)",
              ],
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
              scenario: "discussing 'what would you do if...' dilemmas",
              prompt:
                "Practice unreal conditionals like 'si pudiera, viviría en...'",
            },
            stories: {
              topic: "regrets and alternate outcomes (the third conditional)",
              prompt:
                "Read about a missed chance and discuss 'lo que habría pasado si...'",
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
              topic: "mixed and advanced conditional structures",
              prompt:
                "Read and analyze conditionals that mix time frames",
            },
            realtime: {
              scenario: "negotiating with conditions (con tal de que, a no ser que)",
              prompt:
                "Demonstrate conditional clauses across real, unreal, and past-unreal situations",
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
              topic: "conditional connectors",
              focusPoints: [
                "si, a menos que, en caso de que",
                "con tal de que, siempre que",
              ],
            },
            grammar: {
              topics: ["the three si-clause types", "mixed conditionals"],
              focusPoints: ["si + present / imperfect subj / pluperfect subj"],
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
              topic: "high-frequency Spanish idioms",
              focusPoints: [
                "echar de menos (to miss someone)",
                "darse cuenta de (to realize)",
                "valer la pena (to be worth it)",
                "tener ganas de (to feel like)",
              ],
            },
            grammar: {
              topic: "verbal idiom structures",
              focusPoints: [
                "reflexive idioms: ponerse las pilas, hacerse el tonto",
                "dar idioms: dar la lata, dar igual",
                "fixed prepositions inside idioms",
              ],
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
              scenario: "catching up with a friend using everyday idioms",
              prompt:
                "Practice using idioms like 'echar de menos' and 'tener ganas de' naturally",
            },
            stories: {
              topic: "idioms in everyday dialogue",
              prompt: "Read a casual conversation and explain each idiom's meaning",
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
              topic: "inferring idiom meaning from context",
              prompt:
                "Read texts and work out unfamiliar idioms from the surrounding context",
            },
            realtime: {
              scenario: "telling a short story peppered with idioms",
              prompt:
                "Demonstrate natural use of common idioms in a short narrative",
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
              topic: "common idioms",
              focusPoints: [
                "echar de menos, darse cuenta, valer la pena",
                "tener ganas de",
              ],
            },
            grammar: {
              topics: ["verbal idiom structures"],
              focusPoints: ["reflexive and dar idioms"],
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
              topic: "academic vocabulary and essay structure",
              focusPoints: [
                "la tesis, el argumento, la conclusión",
                "la hipótesis, la metodología",
                "plantear, argumentar, sostener",
              ],
            },
            grammar: {
              topic: "formal academic structures",
              focusPoints: [
                "impersonal se and the passive voice",
                "nominalization: analizar → el análisis",
                "connectors: por consiguiente, en cuanto a, cabe señalar",
              ],
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
              scenario: "defending a thesis to a professor",
              prompt:
                "Practice presenting and supporting an argument in formal register",
            },
            stories: {
              topic: "the structure of an academic essay",
              prompt:
                "Read an essay excerpt and identify the thesis, evidence, and conclusion",
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
              topic: "comprehending dense academic prose",
              prompt: "Read an abstract and paraphrase its argument in plain Spanish",
            },
            realtime: {
              scenario: "summarizing research objectively",
              prompt: "Demonstrate a formal, objective academic register",
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
              topic: "academic vocabulary and essay structure",
              focusPoints: [
                "tesis, argumento, conclusión",
                "hipótesis, metodología",
              ],
            },
            grammar: {
              topics: ["formal academic structures"],
              focusPoints: ["impersonal se, passive, nominalization"],
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
              topic: "workplace and business vocabulary",
              focusPoints: [
                "la reunión, el plazo, el informe",
                "el cliente, el proveedor, la propuesta",
                "agendar, gestionar, coordinar",
              ],
            },
            grammar: {
              topic: "formal email and request formulas",
              focusPoints: [
                "le agradecería que + subjunctive",
                "quedo a la espera de su respuesta",
                "atentamente / un cordial saludo",
              ],
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
              scenario: "a phone call to reschedule a meeting",
              prompt:
                "Practice polite, formal workplace requests and confirmations",
            },
            stories: {
              topic: "reading professional emails and memos",
              prompt: "Read a business email and discuss its tone and structure",
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
              topic: "interpreting professional documents",
              prompt: "Read a proposal and summarize its key points",
            },
            realtime: {
              scenario: "presenting an update to your team",
              prompt: "Demonstrate clear, professional communication in a meeting",
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
              topic: "workplace and business vocabulary",
              focusPoints: [
                "reunión, plazo, informe",
                "cliente, proveedor, propuesta",
              ],
            },
            grammar: {
              topics: ["formal request and email formulas"],
              focusPoints: ["le agradecería que + subjunctive", "professional closings"],
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
              topic: "language for stating and defending opinions",
              focusPoints: [
                "en mi opinión, sostengo que, considero que",
                "estoy a favor de / en contra de",
                "argumentar, refutar, conceder",
              ],
            },
            grammar: {
              topic: "structures for argument and concession",
              focusPoints: [
                "no creo que + subjunctive",
                "si bien / aunque for concession",
                "por un lado... por otro lado",
              ],
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
              scenario: "debating a controversial topic respectfully",
              prompt:
                "Practice stating, supporting, and conceding points in a debate",
            },
            stories: {
              topic: "analyzing arguments in an opinion piece",
              prompt:
                "Read a persuasive text and identify claims, evidence, and counterarguments",
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
              topic: "evaluating the strength of an argument",
              prompt: "Read two opposing views and weigh their reasoning",
            },
            realtime: {
              scenario: "rebutting an opposing view politely",
              prompt:
                "Demonstrate concession and rebuttal: 'si bien..., sin embargo...'",
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
              topic: "opinion and argumentation language",
              focusPoints: [
                "sostengo que, considero que",
                "a favor de / en contra de",
              ],
            },
            grammar: {
              topics: ["argument and concession structures"],
              focusPoints: ["no creo que + subjunctive", "concession: si bien, aunque"],
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
              topic: "vocabulary for discussing culture and society",
              focusPoints: [
                "los valores, las costumbres, la identidad",
                "la sociedad, la tradición, la modernidad",
                "el estereotipo, la diversidad",
              ],
            },
            grammar: {
              topic: "comparing and generalizing",
              focusPoints: [
                "comparatives: más/menos... que, tan... como",
                "generalizations: suele(n), tiende(n) a",
                "lo + adjective (lo importante es que)",
              ],
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
              scenario: "comparing traditions in two countries",
              prompt:
                "Practice comparing cultural practices and values respectfully",
            },
            stories: {
              topic: "cultural themes in a short text",
              prompt:
                "Read about a social custom and analyze what it reveals about values",
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
              topic: "analyzing cultural perspectives in a text",
              prompt: "Read an article and discuss its cultural assumptions",
            },
            realtime: {
              scenario: "discussing a stereotype vs the reality",
              prompt:
                "Demonstrate nuanced cultural analysis without overgeneralizing",
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
              topic: "culture and society vocabulary",
              focusPoints: [
                "valores, costumbres, identidad",
                "estereotipo, diversidad",
              ],
            },
            grammar: {
              topics: ["comparison and generalization structures"],
              focusPoints: ["comparatives", "suele/tiende a, lo + adjetivo"],
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
              topic: "vocabulary for analyzing literature",
              focusPoints: [
                "el narrador, el personaje, la trama",
                "la metáfora, el símbolo, el tono",
                "el verso, la estrofa, la rima",
              ],
            },
            grammar: {
              topic: "narrative tenses and literary style",
              focusPoints: [
                "preterite vs imperfect in narration",
                "literary past forms (hubo, pretérito anterior)",
                "stylistic word order and adjective placement",
              ],
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
              scenario: "discussing a poem's imagery and tone",
              prompt:
                "Practice describing metaphor, symbol, and tone in a text",
            },
            stories: {
              topic: "reading and interpreting a short literary passage",
              prompt: "Read a passage and discuss its narrator and imagery",
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
              topic: "analyzing theme and style in literature",
              prompt:
                "Read a short-story excerpt and identify its theme and techniques",
            },
            realtime: {
              scenario: "comparing two authors' styles",
              prompt: "Demonstrate literary analysis using precise terminology",
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
              topic: "literary analysis vocabulary",
              focusPoints: [
                "narrador, personaje, trama",
                "metáfora, símbolo, tono",
              ],
            },
            grammar: {
              topics: ["narrative tenses and literary style"],
              focusPoints: ["preterite vs imperfect in narration"],
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
              topic: "discourse markers for organizing extended speech",
              focusPoints: [
                "en primer lugar, a continuación, por último",
                "por lo tanto, en consecuencia",
                "en definitiva, en resumen",
              ],
            },
            grammar: {
              topic: "cohesion and coherence devices",
              focusPoints: [
                "reference and pronouns to avoid repetition",
                "connectors of contrast, cause, and result",
                "topic shifts: en cuanto a, respecto a",
              ],
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
              scenario: "giving a structured two-minute opinion",
              prompt:
                "Practice organizing extended speech with clear discourse markers",
            },
            stories: {
              topic: "tracing the thread of a long argument",
              prompt: "Read an extended text and map how its ideas connect",
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
              topic: "analyzing cohesion in extended writing",
              prompt:
                "Read a long passage and identify its connectors and references",
            },
            realtime: {
              scenario: "summarizing a complex topic coherently",
              prompt:
                "Demonstrate coherent, well-structured discourse with smooth transitions",
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
              topic: "discourse markers and connectors",
              focusPoints: [
                "sequencing: en primer lugar, por último",
                "result: por lo tanto, en consecuencia",
              ],
            },
            grammar: {
              topics: ["cohesion and coherence devices"],
              focusPoints: ["reference and topic-shift devices"],
            },
          },
        },
      ],
    },
  ],
  C2: [
    {
      id: "unit-c2-1",
      title: {
        en: "Native Idioms",
        es: "Modismos Nativos",
      },
      description: {
        en: "Advanced idioms",
        es: "Modismos avanzados",
      },
      color: "#22C55E",
      position: { row: 0, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-1-1",
          title: {
            en: "Advanced Expressions",
            es: "Expresiones Avanzadas",
          },
          description: {
            en: "Learn key vocabulary for native idioms",
            es: "Aprende vocabulario clave para modismos nativos",
          },
          xpRequired: 8575,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "everyday Spanish idioms",
              focusPoints: [
                "meter la pata (to mess up)",
                "costar un ojo de la cara (to cost a fortune)",
                "estar en las nubes (to daydream)",
                "echar una mano (to lend a hand)",
              ],
            },
            grammar: {
              topic: "fixed idiomatic structures and verb collocations",
              focusPoints: [
                "dar/tener/hacer idioms: dar igual, tener ganas, hacer caso",
                "ser pan comido (to be easy) vs estar pez (to be clueless)",
                "idioms that don't translate word for word",
              ],
            },
          },
        },
        {
          id: "lesson-c2-1-2",
          title: {
            en: "Speaking Like a Native",
            es: "Hablando Como Nativo",
          },
          description: {
            en: "Practice native idioms in conversation",
            es: "Practica modismos nativos en conversación",
          },
          xpRequired: 8615,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "a casual chat where friends drop idioms like 'no tener pelos en la lengua' and 'tomar el pelo'",
              prompt:
                "Practice using idioms naturally and noticing when someone is speaking figuratively",
            },
            stories: {
              topic:
                "regional slang: vale (España), órale (México), che (Argentina)",
              prompt:
                "Read a dialogue full of colloquialisms and explain what each one really means",
            },
          },
        },
        {
          id: "lesson-c2-1-3",
          title: {
            en: "Cultural Mastery",
            es: "Maestría Cultural",
          },
          description: {
            en: "Apply native idioms skills",
            es: "Aplica habilidades de modismos nativos",
          },
          xpRequired: 8655,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "figurative vs literal meaning in idioms",
              prompt:
                "Read texts with idioms and infer their meaning from context",
            },
            realtime: {
              scenario:
                "explaining a Spanish idiom to someone who took it literally",
              prompt:
                "Demonstrate mastery by using idioms correctly and paraphrasing what they mean",
            },
          },
        },
        {
          id: "lesson-c2-1-quiz",
          title: {
            en: "Native Idioms Quiz",
            es: "Prueba de Modismos Nativos",
          },
          description: {
            en: "Test your knowledge of native idioms",
            es: "Prueba tus conocimientos de modismos nativos",
          },
          xpRequired: 8695,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "common idioms and colloquial expressions",
              focusPoints: [
                "meter la pata, tomar el pelo, echar una mano",
                "regional slang: vale, órale, che",
              ],
            },
            grammar: {
              topics: ["idiomatic verb collocations"],
              focusPoints: ["literal vs figurative meaning"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-2",
      title: {
        en: "Regional Variations",
        es: "Variaciones Regionales",
      },
      description: {
        en: "Dialects",
        es: "Dialectos",
      },
      color: "#3B82F6",
      position: { row: 0, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-2-1",
          title: {
            en: "Dialects",
            es: "Dialectos",
          },
          description: {
            en: "Learn key vocabulary for regional variations",
            es: "Aprende vocabulario clave para variaciones regionales",
          },
          xpRequired: 8775,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "regional vocabulary that changes by country",
              focusPoints: [
                "el carro / el coche / el auto",
                "la computadora / el ordenador",
                "el celular / el móvil",
                "el jugo / el zumo",
                "la papa / la patata",
              ],
            },
            grammar: {
              topic: "regional second-person pronouns: tú, vos, usted, vosotros, ustedes",
              focusPoints: [
                "tú tienes vs vos tenés vs usted tiene",
                "vosotros habláis (España) vs ustedes hablan (Latinoamérica)",
                "voseo endings -ás/-és/-ís: vos hablás, comés, vivís",
              ],
            },
          },
        },
        {
          id: "lesson-c2-2-2",
          title: {
            en: "Accent and Usage",
            es: "Acento y Uso",
          },
          description: {
            en: "Practice regional variations in conversation",
            es: "Practica variaciones regionales en conversación",
          },
          xpRequired: 8815,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "chatting with friends from Argentina, Mexico, and Spain at the same table",
              prompt:
                "Practice switching between voseo (vos tenés, vení, decime) and tuteo (tú tienes, ven, dime) depending on who you are talking to",
            },
            stories: {
              topic:
                "regional accents: seseo, yeísmo rioplatense, and Caribbean /s/ aspiration",
              prompt:
                "Read and discuss how the same words sound across regions, like 'calle' as /kaʝe/ vs /kaʃe/ and 'está' vs 'ehtá'",
            },
          },
        },
        {
          id: "lesson-c2-2-3",
          title: {
            en: "Linguistic Diversity",
            es: "Diversidad Lingüística",
          },
          description: {
            en: "Apply regional variations skills",
            es: "Aplica habilidades de variaciones regionales",
          },
          xpRequired: 8855,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic:
                "spotting voseo, vosotros, and regional words in real texts",
              prompt:
                "Read short texts from Spain, the River Plate, and Central America and identify the regional pronouns and vocabulary",
            },
            realtime: {
              scenario:
                "adapting your register for a Rioplatense friend vs a Peninsular colleague",
              prompt:
                "Demonstrate when to use vos, tú, usted, vosotros, and ustedes based on region and formality",
            },
          },
        },
        {
          id: "lesson-c2-2-quiz",
          title: {
            en: "Regional Variations Quiz",
            es: "Prueba de Variaciones Regionales",
          },
          description: {
            en: "Test your knowledge of regional variations",
            es: "Prueba tus conocimientos de variaciones regionales",
          },
          xpRequired: 8895,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "regional vocabulary and pronoun systems",
              focusPoints: [
                "carro/coche, papa/patata, celular/móvil",
                "tú / vos / usted / vosotros / ustedes",
              ],
            },
            grammar: {
              topics: ["voseo vs tuteo conjugations", "vosotros vs ustedes"],
              focusPoints: [
                "vos tenés vs tú tienes",
                "vosotros habláis vs ustedes hablan",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-3",
      title: {
        en: "Stylistic Mastery",
        es: "Dominio Estilístico",
      },
      description: {
        en: "Style control",
        es: "Control de estilo",
      },
      color: "#F59E0B",
      position: { row: 1, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-3-1",
          title: {
            en: "Refined Language",
            es: "Dominio Estilístico - Vocabulario",
          },
          description: {
            en: "Learn key vocabulary for stylistic mastery",
            es: "Aprende vocabulario clave para dominio estilístico",
          },
          xpRequired: 8975,
          xpReward: 55,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "formal vs colloquial synonyms",
              focusPoints: [
                "solicitar vs pedir",
                "adquirir vs conseguir",
                "comenzar vs empezar",
                "no obstante vs pero",
              ],
            },
            grammar: {
              topic: "register markers and formal connectors",
              focusPoints: [
                "sin embargo, no obstante, por ende",
                "cabe destacar que..., dicho esto...",
                "impersonal se and passive voice for a formal tone",
              ],
            },
          },
        },
        {
          id: "lesson-c2-3-2",
          title: {
            en: "Elegant Expression",
            es: "Dominio Estilístico - Práctica",
          },
          description: {
            en: "Practice stylistic mastery in conversation",
            es: "Practica dominio estilístico en conversación",
          },
          xpRequired: 9015,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "making the same request as a casual text to a friend and a formal email to a boss",
              prompt:
                "Practice shifting register: '¿me pasás eso?' vs 'le agradecería que me enviara el documento'",
            },
            stories: {
              topic: "tone and rhetorical devices: metaphor, irony, hyperbole",
              prompt:
                "Read a passage and discuss how its tone (sincere, ironic, exaggerated) changes the meaning",
            },
          },
        },
        {
          id: "lesson-c2-3-3",
          title: {
            en: "Artistic Language",
            es: "Dominio Estilístico - Aplicación",
          },
          description: {
            en: "Apply stylistic mastery skills",
            es: "Aplica habilidades de dominio estilístico",
          },
          xpRequired: 9055,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "formal and literary discourse markers and nominalization",
              prompt:
                "Read a formal opinion piece and identify hedging, connectors, and sophisticated phrasing",
            },
            realtime: {
              scenario: "giving diplomatic, softened feedback vs blunt feedback",
              prompt:
                "Demonstrate softening and politeness strategies, like 'quizás convendría...' and 'me preguntaba si...'",
            },
          },
        },
        {
          id: "lesson-c2-3-quiz",
          title: {
            en: "Stylistic Mastery Quiz",
            es: "Prueba de Dominio Estilístico",
          },
          description: {
            en: "Test your knowledge of stylistic mastery",
            es: "Prueba tus conocimientos de dominio estilístico",
          },
          xpRequired: 9095,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "formal vs colloquial register",
              focusPoints: [
                "solicitar/pedir, adquirir/conseguir",
                "formal email vs casual text wording",
              ],
            },
            grammar: {
              topics: [
                "formal connectors and discourse markers",
                "register shifting",
              ],
              focusPoints: [
                "no obstante, por ende, cabe destacar",
                "softening and hedging for politeness",
              ],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-4",
      title: {
        en: "Rhetorical Devices",
        es: "Dispositivos Retóricos",
      },
      description: {
        en: "Persuasive techniques",
        es: "Técnicas persuasivas",
      },
      color: "#8B5CF6",
      position: { row: 1, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-4-1",
          title: {
            en: "Persuasive Techniques",
            es: "Técnicas Persuasivas",
          },
          description: {
            en: "Learn key vocabulary for rhetorical devices",
            es: "Aprende vocabulario clave para dispositivos retóricos",
          },
          xpRequired: 9175,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "rhetorical and literary devices",
              focusPoints: [
                "metáfora vs símil (comparison with 'como')",
                "hipérbole (exaggeration)",
                "ironía",
                "personificación",
              ],
            },
            grammar: {
              topic: "structures that create rhetorical effect",
              focusPoints: [
                "anáfora (repetition at the start of phrases)",
                "preguntas retóricas",
                "antítesis (contrasting ideas)",
              ],
            },
          },
        },
        {
          id: "lesson-c2-4-2",
          title: {
            en: "Powerful Speech",
            es: "Discurso Poderoso",
          },
          description: {
            en: "Practice rhetorical devices in conversation",
            es: "Practica dispositivos retóricos en conversación",
          },
          xpRequired: 9215,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "giving a persuasive toast or short speech",
              prompt:
                "Practice weaving in metáfora, ironía, and hipérbole to make your point vivid",
            },
            stories: {
              topic: "spotting irony and metaphor in literature",
              prompt:
                "Read a literary passage and discuss the devices the author uses",
            },
          },
        },
        {
          id: "lesson-c2-4-3",
          title: {
            en: "Master Rhetoric",
            es: "Maestría Retórica",
          },
          description: {
            en: "Apply rhetorical devices skills",
            es: "Aplica habilidades de dispositivos retóricos",
          },
          xpRequired: 9255,
          xpReward: 45,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "analyzing persuasive and figurative language",
              prompt:
                "Read an opinion column and identify its rhetorical devices and intended effect",
            },
            realtime: {
              scenario: "debating a topic with rhetorical flourish",
              prompt:
                "Demonstrate mastery by using rhetorical devices to persuade",
            },
          },
        },
        {
          id: "lesson-c2-4-quiz",
          title: {
            en: "Rhetorical Devices Quiz",
            es: "Prueba de Dispositivos Retóricos",
          },
          description: {
            en: "Test your knowledge of rhetorical devices",
            es: "Prueba tus conocimientos de dispositivos retóricos",
          },
          xpRequired: 9295,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "rhetorical devices",
              focusPoints: [
                "metáfora, símil, hipérbole, ironía",
                "personificación",
              ],
            },
            grammar: {
              topics: ["devices that create rhetorical effect"],
              focusPoints: ["anáfora and preguntas retóricas"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-5",
      title: {
        en: "Specialized Vocabulary",
        es: "Vocabulario Especializado",
      },
      description: {
        en: "Technical terms",
        es: "Términos técnicos",
      },
      color: "#EC4899",
      position: { row: 2, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-5-1",
          title: {
            en: "Expert Terminology",
            es: "Terminología Experta",
          },
          description: {
            en: "Learn key vocabulary for specialized vocabulary",
            es: "Aprende vocabulario clave para vocabulario especializado",
          },
          xpRequired: 9375,
          xpReward: 45,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "professional and technical vocabulary by field",
              focusPoints: [
                "legal: el contrato, la cláusula, el demandante",
                "medical: el diagnóstico, los síntomas, el tratamiento",
                "business: la inversión, el presupuesto, las acciones",
              ],
            },
            grammar: {
              topic: "nominalization and formal terminology",
              focusPoints: [
                "turning verbs into nouns: implementar → la implementación",
                "technical compounds and Latinisms",
                "precise field-specific collocations",
              ],
            },
          },
        },
        {
          id: "lesson-c2-5-2",
          title: {
            en: "Professional Fields",
            es: "Campos Profesionales",
          },
          description: {
            en: "Practice specialized vocabulary in conversation",
            es: "Practica vocabulario especializado en conversación",
          },
          xpRequired: 9415,
          xpReward: 60,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "a work meeting covering a budget, a contract, and a medical report",
              prompt:
                "Practice using precise field vocabulary (presupuesto, cláusula, diagnóstico) accurately",
            },
            stories: {
              topic: "academic and scientific register",
              prompt: "Read a technical text and discuss its specialized terms",
            },
          },
        },
        {
          id: "lesson-c2-5-3",
          title: {
            en: "Domain Expertise",
            es: "Experiencia en el Dominio",
          },
          description: {
            en: "Apply specialized vocabulary skills",
            es: "Aplica habilidades de vocabulario especializado",
          },
          xpRequired: 9455,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "comprehending dense specialized texts",
              prompt:
                "Read a legal or scientific excerpt and paraphrase it in plain Spanish",
            },
            realtime: {
              scenario:
                "explaining a technical topic to an expert vs a layperson",
              prompt:
                "Demonstrate mastery by switching between jargon and plain language",
            },
          },
        },
        {
          id: "lesson-c2-5-quiz",
          title: {
            en: "Specialized Vocabulary Quiz",
            es: "Prueba de Vocabulario Especializado",
          },
          description: {
            en: "Test your knowledge of specialized vocabulary",
            es: "Prueba tus conocimientos de vocabulario especializado",
          },
          xpRequired: 9495,
          xpReward: 60,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "specialized vocabulary across fields",
              focusPoints: [
                "legal, medical, and business terms",
                "jargon vs plain language",
              ],
            },
            grammar: {
              topics: ["formal terminology and nominalization"],
              focusPoints: ["field-specific collocations"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-6",
      title: {
        en: "Subtle Nuances",
        es: "Matices Sutiles",
      },
      description: {
        en: "Fine distinctions",
        es: "Distinciones finas",
      },
      color: "#10B981",
      position: { row: 2, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-6-1",
          title: {
            en: "Fine Distinctions",
            es: "Distinciones Finas",
          },
          description: {
            en: "Learn key vocabulary for subtle nuances",
            es: "Aprende vocabulario clave para matices sutiles",
          },
          xpRequired: 9575,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "near-synonyms with different connotations",
              focusPoints: [
                "delgado / flaco / esquelético",
                "barato / económico / cutre",
                "bonito / lindo / hermoso",
              ],
            },
            grammar: {
              topic: "subtle grammatical contrasts",
              focusPoints: [
                "ser vs estar for permanent vs temporary nuance",
                "por vs para",
                "indicative vs subjunctive for certainty vs doubt",
              ],
            },
          },
        },
        {
          id: "lesson-c2-6-2",
          title: {
            en: "Precise Meaning",
            es: "Significado Preciso",
          },
          description: {
            en: "Practice subtle nuances in conversation",
            es: "Practica matices sutiles en conversación",
          },
          xpRequired: 9615,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "reading between the lines in a tense but polite conversation",
              prompt:
                "Practice conveying nuance through word choice and tone (suggesting vs insisting)",
            },
            stories: {
              topic: "connotation and subtext in dialogue",
              prompt:
                "Read a scene and discuss what the characters imply but don't say",
            },
          },
        },
        {
          id: "lesson-c2-6-3",
          title: {
            en: "Mastery of Detail",
            es: "Maestría del Detalle",
          },
          description: {
            en: "Apply subtle nuances skills",
            es: "Aplica habilidades de matices sutiles",
          },
          xpRequired: 9655,
          xpReward: 55,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "implicature and tone in writing",
              prompt:
                "Read a passage and infer the writer's true attitude from subtle cues",
            },
            realtime: {
              scenario:
                "softening criticism vs being direct, depending on the listener",
              prompt:
                "Demonstrate mastery of nuance, irony, and politeness in context",
            },
          },
        },
        {
          id: "lesson-c2-6-quiz",
          title: {
            en: "Subtle Nuances Quiz",
            es: "Prueba de Matices Sutiles",
          },
          description: {
            en: "Test your knowledge of subtle nuances",
            es: "Prueba tus conocimientos de matices sutiles",
          },
          xpRequired: 9695,
          xpReward: 40,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "connotation and near-synonyms",
              focusPoints: [
                "delgado / flaco / esquelético",
                "implication and subtext",
              ],
            },
            grammar: {
              topics: ["subtle contrasts: ser/estar, por/para, mood"],
              focusPoints: ["nuance in word and structure choice"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-7",
      title: {
        en: "Cultural Expertise",
        es: "Experiencia Cultural",
      },
      description: {
        en: "Cultural mastery",
        es: "Dominio cultural",
      },
      color: "#06B6D4",
      position: { row: 3, offset: 0 },
      lessons: [
        {
          id: "lesson-c2-7-1",
          title: {
            en: "Cultural Intelligence",
            es: "Inteligencia Cultural",
          },
          description: {
            en: "Learn key vocabulary for cultural expertise",
            es: "Aprende vocabulario clave para experiencia cultural",
          },
          xpRequired: 9775,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "cultural references, festivals, and refranes",
              focusPoints: [
                "festivals: Día de Muertos, Las Fallas, Carnaval",
                "refranes: 'A mal tiempo, buena cara'",
                "sobremesa and tuteo vs usted etiquette",
              ],
            },
            grammar: {
              topic: "language tied to customs and politeness",
              focusPoints: [
                "formal vs familiar address in social settings",
                "set phrases for celebrations and condolences",
              ],
            },
          },
        },
        {
          id: "lesson-c2-7-2",
          title: {
            en: "Cultural Navigator",
            es: "Navegador Cultural",
          },
          description: {
            en: "Practice cultural expertise in conversation",
            es: "Practica experiencia cultural en conversación",
          },
          xpRequired: 9815,
          xpReward: 50,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario:
                "navigating a family gathering with greetings, sobremesa, and a toast",
              prompt:
                "Practice the right cultural register and expressions for a social occasion",
            },
            stories: {
              topic: "the cultural context behind traditions",
              prompt:
                "Read about a tradition like Día de Muertos and discuss its meaning",
            },
          },
        },
        {
          id: "lesson-c2-7-3",
          title: {
            en: "Cultural Ambassador",
            es: "Embajador Cultural",
          },
          description: {
            en: "Apply cultural expertise skills",
            es: "Aplica habilidades de experiencia cultural",
          },
          xpRequired: 9855,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "interpreting cultural references and humor",
              prompt:
                "Read a text rich in cultural allusions and explain the references",
            },
            realtime: {
              scenario:
                "explaining a local custom to a foreigner and avoiding a faux pas",
              prompt:
                "Demonstrate cultural fluency by using refranes and the right etiquette in context",
            },
          },
        },
        {
          id: "lesson-c2-7-quiz",
          title: {
            en: "Cultural Expertise Quiz",
            es: "Prueba de Experiencia Cultural",
          },
          description: {
            en: "Test your knowledge of cultural expertise",
            es: "Prueba tus conocimientos de experiencia cultural",
          },
          xpRequired: 9895,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "cultural references and customs",
              focusPoints: [
                "festivals and refranes",
                "social etiquette: besos, sobremesa, usted",
              ],
            },
            grammar: {
              topics: ["culturally appropriate register"],
              focusPoints: ["set phrases for social occasions"],
            },
          },
        },
      ],
    },
    {
      id: "unit-c2-8",
      title: {
        en: "Near-Native Fluency",
        es: "Fluidez Casi Nativa",
      },
      description: {
        en: "Native-like skills",
        es: "Habilidades casi nativas",
      },
      color: "#EF4444",
      position: { row: 3, offset: 1 },
      lessons: [
        {
          id: "lesson-c2-8-1",
          title: {
            en: "Native-Like Skills",
            es: "Habilidades Nativas",
          },
          description: {
            en: "Learn key vocabulary for near-native fluency",
            es: "Aprende vocabulario clave para fluidez casi nativa",
          },
          xpRequired: 9975,
          xpReward: 35,
          modes: ["vocabulary", "grammar"],
          content: {
            vocabulary: {
              topic: "fillers and discourse markers for fluent speech",
              focusPoints: [
                "muletillas: o sea, pues, es que, en plan",
                "backchanneling: claro, ya, ajá",
                "a ver, total, resulta que",
              ],
            },
            grammar: {
              topic: "managing spontaneous discourse",
              focusPoints: [
                "self-correction: digo, quiero decir, mejor dicho",
                "circumlocution to talk around unknown words",
                "smooth turn-taking and connectors",
              ],
            },
          },
        },
        {
          id: "lesson-c2-8-2",
          title: {
            en: "Perfect Fluency",
            es: "Fluidez Perfecta",
          },
          description: {
            en: "Practice near-native fluency in conversation",
            es: "Practica fluidez casi nativa en conversación",
          },
          xpRequired: 10015,
          xpReward: 40,
          modes: ["realtime", "stories"],
          content: {
            realtime: {
              scenario: "a fast, overlapping group conversation at a café",
              prompt:
                "Practice keeping up: react with backchannels, interrupt politely, and self-correct on the fly",
            },
            stories: {
              topic: "natural spoken rhythm and connected speech",
              prompt:
                "Read a transcript of casual speech and discuss the fillers and reductions",
            },
          },
        },
        {
          id: "lesson-c2-8-3",
          title: {
            en: "Complete Mastery",
            es: "Maestría Completa",
          },
          description: {
            en: "Apply near-native fluency skills",
            es: "Aplica habilidades de fluidez casi nativa",
          },
          xpRequired: 10055,
          xpReward: 35,
          modes: ["reading", "realtime"],
          content: {
            reading: {
              topic: "understanding rapid, idiomatic speech in writing",
              prompt:
                "Read informal dialogue and follow the meaning despite slang and ellipsis",
            },
            realtime: {
              scenario: "telling a story spontaneously without pausing",
              prompt:
                "Demonstrate near-native fluency: speak at length, paraphrase, and keep the conversation flowing",
            },
          },
        },
        {
          id: "lesson-c2-8-quiz",
          title: {
            en: "Near-Native Fluency Quiz",
            es: "Prueba de Fluidez Casi Nativa",
          },
          description: {
            en: "Test your knowledge of near-native fluency",
            es: "Prueba tus conocimientos de fluidez casi nativa",
          },
          xpRequired: 10095,
          xpReward: 50,
          modes: ["vocabulary", "grammar"],
          isFinalQuiz: true,
          quizConfig: {
            questionsRequired: 12,
            passingScore: 10,
          },
          content: {
            vocabulary: {
              topic: "fluency markers and discourse management",
              focusPoints: [
                "muletillas and backchanneling",
                "self-correction and circumlocution",
              ],
            },
            grammar: {
              topics: ["strategies for spontaneous discourse"],
              focusPoints: ["keeping speech flowing naturally"],
            },
          },
        },
      ],
    },
  ],
});

const LESSON_XP_RANGE = { min: 55, max: 80 };
const LESSON_XP_STEP = 5;
const STARTER_LESSON_XP_REQUIRED = 50;
const STARTER_LESSON_IDS = new Set(["lesson-tutorial-1", "lesson-tutorial-a1"]);

/**
 * Assign a deterministic pseudo-random XP reward to each regular lesson so
 * that it requires between 55-80 XP to complete in increments of 5. Starter
 * Tutor lessons are intentionally shorter at 50 XP.
 */
function applyLessonXPSchedule(lessons) {
  return lessons.map((lesson) => ({
    ...lesson,
    xpReward: getLessonXpReward(lesson.id),
  }));
}

function getLessonXpReward(lessonId = "") {
  const normalized = lessonId || "lesson";
  if (STARTER_LESSON_IDS.has(normalized)) return STARTER_LESSON_XP_REQUIRED;

  let hash = 0;

  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  const rewardOptions =
    Math.floor((LESSON_XP_RANGE.max - LESSON_XP_RANGE.min) / LESSON_XP_STEP) +
    1;
  return (hash % rewardOptions) * LESSON_XP_STEP + LESSON_XP_RANGE.min;
}

const SUB_LEVEL_SEGMENTS = {
  "Pre-A1": ["Pre-A1.1", "Pre-A1.2"],
  A1: ["A1.1", "A1.2", "A1.3"],
  A2: ["A2.1", "A2.2", "A2.3"],
  B1: ["B1.1", "B1.2", "B1.3"],
  B2: ["B2.1", "B2.2", "B2.3"],
  C1: ["C1.1", "C1.2", "C1.3"],
  C2: ["C2.1", "C2.2", "C2.3"],
};

const CEFR_LEVEL_PROFILES = {
  "Pre-A1": {
    interaction: "recognize and respond to isolated words and phrases",
    production: "produce single words and memorized chunks",
    mediation: "point to or repeat key words when helping others",
    accuracy: "use memorized single words with basic pronunciation",
    discourseSkills: ["word recognition", "single-word responses"],
  },
  A1: {
    interaction: "exchange short, formulaic turns",
    production: "share personal details and immediate needs",
    mediation: "relay single facts or key words",
    accuracy: "use memorized phrases with understandable pronunciation",
    discourseSkills: ["turn-taking", "formulaic exchanges"],
  },
  A2: {
    interaction: "handle simple transactions and social routines",
    production: "describe familiar topics in short phrases",
    mediation: "summarize main points of brief messages",
    accuracy: "combine rehearsed sentences with basic connectors",
    discourseSkills: ["connected phrases", "short descriptions"],
  },
  B1: {
    interaction: "sustain conversations about experiences and plans",
    production: "narrate events and explain opinions",
    mediation: "relay key details from longer texts or dialogue",
    accuracy: "use past and future frames with emerging control",
    discourseSkills: ["narration", "linking devices", "reformulation"],
  },
  B2: {
    interaction: "negotiate viewpoints and manage breakdowns",
    production: "develop arguments with supporting detail",
    mediation: "summarize and compare sources or positions",
    accuracy: "use complex clauses with generally consistent control",
    discourseSkills: ["argumentation", "clarification", "hedging"],
  },
  C1: {
    interaction: "lead discussions with nuanced register control",
    production: "deliver structured analyses and persuasive discourse",
    mediation: "reframe ideas for different audiences",
    accuracy: "maintain natural flow with precise vocabulary",
    discourseSkills: ["synthesizing", "stance-taking", "register shifts"],
  },
  C2: {
    interaction: "switch effortlessly across formal and informal contexts",
    production: "craft subtle argumentation and stylistic effects",
    mediation: "mediate complex content, positions, or emotions",
    accuracy: "demonstrate near-native control and nuance",
    discourseSkills: [
      "stylistic control",
      "idiomatic range",
      "critical response",
    ],
  },
};

const ADVANCED_MODES = {
  B1: ["listening", "writing"],
  B2: ["listening", "writing", "mediation"],
  C1: ["listening", "writing", "mediation"],
  C2: ["listening", "writing", "mediation"],
};

const ALLOWED_MODULES = new Set([
  "vocabulary",
  "grammar",
  "stories",
  "reading",
  "realtime",
]);

const FUNCTIONAL_PROMPTS = {
  listening: (topic, levelLabel) =>
    `Interpret authentic audio about ${topic} and capture the main points (${levelLabel})`,
  writing: (topic, levelLabel) =>
    `Write a short response that applies the lesson topic to a real scenario (${levelLabel})`,
  mediation: (topic, levelLabel) =>
    `Bridge information about ${topic} for someone with less background knowledge (${levelLabel})`,
};

function deriveLessonTopic(unit, lesson) {
  return (
    lesson.content?.vocabulary?.topic ||
    lesson.content?.grammar?.topic ||
    unit.title?.en ||
    lesson.title?.en ||
    "lesson focus"
  );
}

function addSupplementalLessons(level, unit) {
  const lessons = unit.lessons || [];

  // Skip supplemental lessons for tutorial units
  if (unit.isTutorial) {
    return lessons;
  }

  const nonQuizLessons = lessons.filter((lesson) => !lesson.isFinalQuiz);
  const maxNonQuizXp = Math.max(
    ...nonQuizLessons.map((lesson) => lesson.xpRequired || 0),
    0,
  );
  const xpStep = 15;
  const topic = unit.title?.en || unit.description?.en || "unit theme";

  const supplementalLessons = [
    {
      id: `${unit.id}-skill-builder`,
      title: {
        en: `${unit.title?.en || "Unit"} Skill Builder`,
        es: `Refuerzo de ${unit.title?.es || unit.title?.en || "Unidad"}`,
      },
      description: {
        en: "Short targeted drills to consolidate the unit language before the quiz.",
        es: "Ejercicios breves para consolidar el lenguaje de la unidad antes del cuestionario.",
      },
      xpRequired: maxNonQuizXp + xpStep,
      xpReward: 35,
      modes: ["grammar", "vocabulary"],
      content: {
        grammar: {
          topic,
          focusPoints: ["pattern recycling", "micro-drills"],
        },
        vocabulary: {
          topic,
          prompt: `Cycle through quick recall of ${topic} phrases before applying them.`,
        },
      },
      cefrStage: level,
      pathway: "granularity",
    },
    {
      id: `${unit.id}-integrated-practice`,
      title: {
        en: `${unit.title?.en || "Unit"} Integrated Practice`,
        es: `Práctica integrada de ${
          unit.title?.es || unit.title?.en || "Unidad"
        }`,
      },
      description: {
        en: "Link vocabulary and grammar from the unit in a guided scenario.",
        es: "Vincula vocabulario y gramática de la unidad en un escenario guiado.",
      },
      xpRequired: maxNonQuizXp + xpStep * 2,
      xpReward: 60,
      modes: ["realtime", "reading", "stories"],
      content: {
        realtime: generateIntegratedPracticeGoal(topic, unit, lessons),
        reading: {
          topic,
          prompt: `Interpret scaffolded prompts about ${topic} before responding live.`,
        },
        stories: {
          topic,
          prompt: `Follow a mini scenario that blends the unit's core language for ${topic}.`,
        },
      },
      cefrStage: level,
      pathway: "granularity",
    },
  ];

  const quizIndex = lessons.findIndex((lesson) => lesson.isFinalQuiz);

  if (quizIndex === -1) {
    return [...lessons, ...supplementalLessons];
  }

  const quizLesson = lessons[quizIndex];
  const minQuizXp = maxNonQuizXp + xpStep * (supplementalLessons.length + 1);
  const updatedQuiz = {
    ...quizLesson,
    xpRequired: Math.max(quizLesson.xpRequired || 0, minQuizXp),
  };

  const coreLessons = lessons.filter((lesson) => !lesson.isFinalQuiz);
  const trailingLessons = lessons.slice(quizIndex + 1);

  return [
    ...coreLessons,
    ...supplementalLessons,
    updatedQuiz,
    ...trailingLessons,
  ];
}

function buildLessonObjectives(level, unit, lesson) {
  const profile = CEFR_LEVEL_PROFILES[level] || CEFR_LEVEL_PROFILES.A1;
  const topic = deriveLessonTopic(unit, lesson);
  const baseAssessment = lesson.isFinalQuiz
    ? `Meet the ${
        lesson.title?.en || "lesson"
      } pass criteria to show readiness for the next sub-stage.`
    : `Complete guided practice showing control of ${topic} in ${
        lesson.modes?.join(", ") || "core"
      } tasks.`;

  return {
    cefrLevel: level,
    communicativeObjectives: [
      `Can ${profile.interaction} when discussing ${topic}.`,
      `Can ${
        profile.production
      } while keeping conversation aligned to ${unit.title?.en?.toLowerCase()}.`,
      `Can ${profile.mediation} related to ${topic} when peers need support.`,
    ],
    successCriteria: [
      `Uses lesson language to ${profile.interaction} with ${profile.accuracy}.`,
      `Shows ${
        profile.discourseSkills.join(", ") || "connected speech"
      } across ${lesson.modes?.length || 1} activity modes.`,
      baseAssessment,
    ],
  };
}

function appendAdvancedModes(level, lesson, unit) {
  const additions = ADVANCED_MODES[level];
  if (!additions) return lesson;

  const topic = deriveLessonTopic(unit, lesson);
  const advancedTasks = additions.map((mode) => ({
    mode,
    topic,
    prompt:
      FUNCTIONAL_PROMPTS[mode]?.(topic, level) ||
      `Apply ${topic} in a ${mode} task for level ${level}.`,
  }));

  return {
    ...lesson,
    advancedTasks: [...(lesson.advancedTasks || []), ...advancedTasks],
  };
}

/**
 * Maps topics to specific, actionable realtime conversation goals.
 * Each goal includes:
 * - scenario: A clear task the user should accomplish
 * - prompt: Roleplay context for the AI tutor
 * - successCriteria: What counts as completing the goal (for evaluation)
 */
const REALTIME_GOAL_TEMPLATES = {
  // Pre-A1 / A1 topics
  "greetings and starters": {
    scenario: "Greet someone and say goodbye",
    prompt:
      "Roleplay meeting someone new. Greet them, exchange pleasantries, and say goodbye.",
    successCriteria: "User greets appropriately and uses a farewell expression",
  },
  "people and places": {
    scenario: "Introduce yourself and say where you're from",
    prompt:
      "Ask the learner where they're from and about their family. Have them introduce a family member.",
    successCriteria:
      "User states their name, origin, or introduces a person using 'This is...' or similar",
  },
  "actions and needs": {
    scenario: "Ask for help or make a simple request",
    prompt:
      "Roleplay a situation where the learner needs to ask for something (directions, help, or an item).",
    successCriteria: "User makes a clear request using appropriate verb forms",
  },
  "time and movement": {
    scenario: "Ask what time it is or for directions",
    prompt:
      "The learner needs to find out the time or get directions to somewhere nearby.",
    successCriteria: "User asks about time or directions using question words",
  },
  "social expressions": {
    scenario: "Use polite phrases in a conversation",
    prompt:
      "Have a brief polite exchange - the learner should use thank you, please, excuse me, or sorry.",
    successCriteria:
      "User uses at least one polite expression naturally in context",
  },
  greetings: {
    scenario: "Greet someone appropriately for the time of day",
    prompt:
      "Meet the learner at different times and have them greet you appropriately.",
    successCriteria:
      "User uses appropriate greeting for context (morning/afternoon/evening)",
  },
  introductions: {
    scenario: "Introduce yourself with your name and one fact",
    prompt:
      "Ask the learner to introduce themselves. Prompt for their name and something about them.",
    successCriteria:
      "User states their name and shares at least one personal detail",
  },
  numbers: {
    scenario: "Give your phone number or age",
    prompt:
      "Ask the learner for their phone number, age, or address number in conversation.",
    successCriteria: "User correctly produces numbers in the target language",
  },
  "days of week": {
    scenario: "Make plans for a specific day",
    prompt:
      "Invite the learner to do something and have them suggest or confirm a day.",
    successCriteria: "User correctly names a day of the week in context",
  },
  "time expressions": {
    scenario: "Say when you do something daily",
    prompt:
      "Ask the learner about their daily routine - when they wake up, eat, or work.",
    successCriteria: "User expresses time of day or routine timing",
  },
  time: {
    scenario: "Tell someone the current time",
    prompt:
      "Ask the learner what time it is now or what time they do certain activities.",
    successCriteria: "User correctly states a time using appropriate format",
  },
  family: {
    scenario: "Describe your family members",
    prompt:
      "Ask the learner about their family. Who do they live with? Siblings?",
    successCriteria: "User names family members and describes a relationship",
  },
  colors: {
    scenario: "Describe what color something is",
    prompt:
      "Point out objects and ask the learner what color they are or what their favorite color is.",
    successCriteria: "User correctly uses color vocabulary",
  },
  food: {
    scenario: "Order food or say what you like to eat",
    prompt:
      "Roleplay a café scene. Ask what the learner wants to eat or drink.",
    successCriteria: "User orders or expresses food preference",
  },
  clothing: {
    scenario: "Describe what you're wearing",
    prompt:
      "Ask the learner what they're wearing today or what they like to wear.",
    successCriteria: "User describes clothing items",
  },
  // A2 topics
  "daily activities": {
    scenario: "Describe your morning routine",
    prompt:
      "Ask about the learner's typical day. What do they do in the morning?",
    successCriteria: "User describes at least two daily activities in sequence",
  },
  weather: {
    scenario: "Talk about today's weather",
    prompt:
      "Discuss the current weather and ask what the learner likes to do in this weather.",
    successCriteria: "User describes weather conditions",
  },
  preferences: {
    scenario: "Say what you like and dislike",
    prompt:
      "Ask the learner about their preferences in food, activities, or music.",
    successCriteria:
      "User expresses a preference using like/dislike structures",
  },
  "question words": {
    scenario: "Ask three questions about someone",
    prompt:
      "The learner should ask you questions to learn about you (who, what, where, when, why).",
    successCriteria: "User asks at least two questions using question words",
  },
  "physical descriptions": {
    scenario: "Describe a person's appearance",
    prompt:
      "Ask the learner to describe someone they know - what do they look like?",
    successCriteria: "User uses adjectives to describe physical appearance",
  },
  places: {
    scenario: "Give directions to a nearby place",
    prompt:
      "The learner is lost. Have them ask for or give directions to a location.",
    successCriteria:
      "User uses directional vocabulary or location prepositions",
  },
  shopping: {
    scenario: "Ask for a price and buy something",
    prompt: "Roleplay a shop scene. The learner wants to buy something.",
    successCriteria: "User asks price and completes a basic transaction",
  },
  transportation: {
    scenario: "Ask about bus or train schedules",
    prompt:
      "The learner needs to take public transport. Have them ask about times/platforms.",
    successCriteria: "User asks about transportation times or locations",
  },
  directions: {
    scenario: "Ask how to get somewhere",
    prompt:
      "The learner needs to find a place. Have them ask for and understand directions.",
    successCriteria: "User asks for directions using appropriate phrases",
  },
  // B1+ topics
  arts: {
    scenario: "Recommend a movie or book you enjoyed",
    prompt:
      "Discuss entertainment. Ask the learner to recommend something and explain why.",
    successCriteria: "User recommends something with a reason",
  },
  sports: {
    scenario: "Talk about your favorite sport or exercise",
    prompt:
      "Discuss sports and fitness. What does the learner do to stay active?",
    successCriteria: "User discusses sports/exercise with relevant vocabulary",
  },
  health: {
    scenario: "Describe how you're feeling today",
    prompt:
      "Check in on the learner's health. How are they feeling? Any concerns?",
    successCriteria: "User describes physical or emotional state",
  },
  careers: {
    scenario: "Describe your job or dream career",
    prompt: "Discuss work and careers. What does the learner do or want to do?",
    successCriteria:
      "User describes work responsibilities or career aspirations",
  },
  education: {
    scenario: "Talk about your studies or learning goals",
    prompt:
      "Discuss education. What is the learner studying? What do they want to learn?",
    successCriteria: "User discusses educational experiences or goals",
  },
  comparisons: {
    scenario: "Compare two things and give your opinion",
    prompt:
      "Present two options to the learner and have them compare and choose.",
    successCriteria: "User uses comparative structures correctly",
  },
  travel: {
    scenario: "Describe a trip you took or want to take",
    prompt:
      "Discuss travel experiences or plans. Where has/would the learner go?",
    successCriteria: "User describes travel using past or conditional forms",
  },
  culture: {
    scenario: "Explain a tradition from your culture",
    prompt:
      "Discuss cultural practices. What traditions does the learner's culture have?",
    successCriteria: "User explains a cultural practice or tradition",
  },
  // Advanced topics
  "abstract ideas": {
    scenario: "Explain your opinion on a topic",
    prompt:
      "Discuss a current topic or idea. Ask the learner to explain their viewpoint.",
    successCriteria: "User presents an opinion with supporting reasoning",
  },
  emotions: {
    scenario: "Describe a time you felt a strong emotion",
    prompt:
      "Discuss feelings and experiences. When did the learner feel happy/sad/excited?",
    successCriteria:
      "User describes emotional experience with appropriate vocabulary",
  },
  "future plans": {
    scenario: "Talk about your goals for next year",
    prompt:
      "Discuss plans and aspirations. What does the learner want to achieve?",
    successCriteria: "User expresses future plans using appropriate tenses",
  },
  environment: {
    scenario: "Discuss an environmental issue",
    prompt:
      "Talk about environmental topics. What concerns does the learner have?",
    successCriteria:
      "User discusses environmental topic with relevant vocabulary",
  },
  technology: {
    scenario: "Explain how you use technology daily",
    prompt:
      "Discuss technology use. How does technology affect the learner's life?",
    successCriteria: "User describes technology use with specific examples",
  },
};

/**
 * Generates an actionable realtime goal based on topic and lesson focusPoints.
 * Includes goal variations for multiple sessions.
 */
function generateActionableRealtimeGoal(topicLabel, lesson) {
  const topicKey = topicLabel.toLowerCase();
  const template = REALTIME_GOAL_TEMPLATES[topicKey];

  // Get focusPoints from vocabulary or grammar content for additional context
  const vocabFocus = lesson?.content?.vocabulary?.focusPoints || [];
  const grammarFocus = lesson?.content?.grammar?.focusPoints || [];
  const allFocus = [...vocabFocus, ...grammarFocus].filter(Boolean);

  if (template) {
    // Generate variations based on the base template
    const goalVariations = generateGoalVariations(
      template,
      topicLabel,
      allFocus,
    );

    return {
      ...withGoalUiLocalizations(
        {
          scenario: template.scenario,
          prompt: template.prompt,
          successCriteria: template.successCriteria,
        },
        topicLabel,
      ),
      focusPoints: allFocus,
      goalVariations: goalVariations,
      goalIndex: 0,
    };
  }

  // Generate a reasonable default based on available focusPoints
  if (allFocus.length > 0) {
    const firstFocus = allFocus[0];
    const baseGoal = {
      scenario: `Practice using ${firstFocus} in conversation`,
      prompt: `Have a natural conversation where the learner practices ${topicLabel}. Focus on: ${allFocus.join(
        ", ",
      )}.`,
      successCriteria: `User demonstrates use of ${firstFocus} in context`,
    };

    // Create variations for focus points
    const variations = [
      withGoalUiLocalizations(baseGoal, topicLabel, firstFocus),
    ];
    allFocus.slice(1, 3).forEach((focus) => {
      variations.push(
        withGoalUiLocalizations(
          {
            scenario: `Practice ${focus} in a real situation`,
            prompt: `Create a situation where the learner must use ${focus}. Ask follow-up questions.`,
            successCriteria: `User uses ${focus} correctly in context`,
          },
          topicLabel,
          focus,
        ),
      );
    });

    return {
      ...withGoalUiLocalizations(baseGoal, topicLabel, firstFocus),
      focusPoints: allFocus,
      goalVariations: variations,
      goalIndex: 0,
    };
  }

  // Final fallback - still more specific than before
  return {
    ...withGoalUiLocalizations(
      {
        scenario: `Have a conversation about ${topicLabel}`,
        prompt: `Engage the learner in a natural conversation about ${topicLabel}. Ask questions and encourage responses.`,
        successCriteria: `User participates meaningfully in conversation about ${topicLabel}`,
      },
      topicLabel,
    ),
    focusPoints: [],
    goalVariations: [],
    goalIndex: 0,
  };
}

/**
 * Generates goal variations from a base template for progression through multiple sessions.
 */
function translateGoalTextToEs(text, topicLabel, focus) {
  if (!text) return "";
  const t = text.toLowerCase();
  const topic = topicLabel || focus || "";
  const focusTerm = focus || topicLabel || "";

  const matches = [
    {
      test: (s) => s.includes("answer questions about"),
      build: () => `Responde preguntas sobre ${topic}`,
    },
    {
      test: (s) => s.includes("start a conversation about"),
      build: () => `Inicia una conversación sobre ${topic}`,
    },
    {
      test: (s) => s.includes("use") && s.includes("real situation"),
      build: () => `Usa ${focusTerm} en una situación real`,
    },
    {
      test: (s) => s.includes("demonstrates correct use"),
      build: () => `El usuario demuestra el uso correcto de ${focusTerm}`,
    },
    {
      test: (s) => s.includes("answers questions using"),
      build: () =>
        `El usuario responde preguntas usando vocabulario de ${topic} correctamente`,
    },
    {
      test: (s) => s.includes("initiates and sustains conversation"),
      build: () =>
        `El usuario inicia y mantiene una conversación sobre ${topic}`,
    },
  ];

  const hit = matches.find((m) => m.test(t));
  return hit ? hit.build() : text;
}

function translateGoalTextToHi(text) {
  if (!text) return "";
  return translateSkillTreeTextToHindi(text);
}

function withGoalUiLocalizations(goal, topicLabel, focus) {
  if (!goal) return goal;
  return {
    ...goal,
    scenario_es:
      goal.scenario_es ||
      translateGoalTextToEs(goal.scenario, topicLabel, focus),
    scenario_hi: goal.scenario_hi || translateGoalTextToHi(goal.scenario),
    successCriteria_es:
      goal.successCriteria_es ||
      translateGoalTextToEs(goal.successCriteria, topicLabel, focus),
    successCriteria_hi:
      goal.successCriteria_hi || translateGoalTextToHi(goal.successCriteria),
  };
}

function generateGoalVariations(baseTemplate, topicLabel, focusPoints = []) {
  const variations = [
    withGoalUiLocalizations(
      {
        scenario: baseTemplate.scenario,
        prompt: baseTemplate.prompt,
        prompt_es: translateGoalTextToEs(baseTemplate.prompt, topicLabel),
        successCriteria: baseTemplate.successCriteria,
      },
      topicLabel,
    ),
  ];

  // Add "respond to questions" variation
  variations.push(
    withGoalUiLocalizations(
      {
        scenario: `Answer questions about ${topicLabel}`,
        prompt: `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
        prompt_es: translateGoalTextToEs(
          `Ask the learner questions about ${topicLabel}. Have them respond with complete answers.`,
          topicLabel,
        ),
        successCriteria: `User answers questions using ${topicLabel} vocabulary correctly`,
      },
      topicLabel,
    ),
  );

  // Add "start a conversation" variation
  variations.push(
    withGoalUiLocalizations(
      {
        scenario: `Start a conversation about ${topicLabel}`,
        prompt: `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
        prompt_es: translateGoalTextToEs(
          `Let the learner initiate conversation about ${topicLabel}. Respond naturally and encourage them to say more.`,
          topicLabel,
        ),
        successCriteria: `User initiates and sustains conversation about ${topicLabel}`,
      },
      topicLabel,
    ),
  );

  // Add focus-point specific variations if available
  if (focusPoints.length > 0) {
    variations.push(
      withGoalUiLocalizations(
        {
          scenario: `Use ${focusPoints[0]} in a real situation`,
          prompt: `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
          prompt_es: translateGoalTextToEs(
            `Create a realistic scenario requiring ${focusPoints[0]}. Guide the learner through it.`,
            topicLabel,
            focusPoints[0],
          ),
          successCriteria: `User demonstrates correct use of ${focusPoints[0]}`,
        },
        topicLabel,
        focusPoints[0],
      ),
    );
  }

  return variations;
}

/**
 * Generates integrated practice goals that combine multiple unit topics.
 * Creates specific, actionable roleplay scenarios based on actual lesson content.
 */
function generateIntegratedPracticeGoal(topic, unit, lessons = []) {
  // Collect lesson titles and topics from unit lessons
  const lessonTitles = [];
  const lessonDescriptions = [];

  lessons.forEach((lesson) => {
    // Skip quiz and supplemental lessons
    if (lesson.isFinalQuiz || lesson.id?.includes("integrated-practice")) {
      return;
    }
    if (lesson.title?.en) {
      lessonTitles.push(lesson.title.en);
    }
    if (lesson.description?.en) {
      lessonDescriptions.push(lesson.description.en);
    }
  });

  const topicKey = topic.toLowerCase();
  const unitTitle = unit?.title?.en || topic;

  // Create varied goals - prioritize topic-specific templates
  const goalVariations = [];

  // First, check for topic-specific templates - these are handcrafted and best
  const topicSpecificGoals = INTEGRATED_PRACTICE_TEMPLATES[topicKey];
  if (topicSpecificGoals && topicSpecificGoals.length > 0) {
    goalVariations.push(
      ...topicSpecificGoals.map((goal) =>
        withGoalUiLocalizations(goal, unitTitle),
      ),
    );
  }

  // Generate creative roleplay scenarios based on the unit topic
  // These should be specific actions, not abstract concepts
  const creativeGoals = generateCreativeGoalsForTopic(
    topicKey,
    unitTitle,
    lessonTitles,
  );
  goalVariations.push(
    ...creativeGoals.map((goal) => withGoalUiLocalizations(goal, unitTitle)),
  );

  // Ensure we have at least one goal
  if (goalVariations.length === 0) {
    goalVariations.push(
      withGoalUiLocalizations(
        {
          scenario: `Have a conversation about ${unitTitle}`,
          prompt: `Start a natural conversation about ${unitTitle}. Ask the learner questions and respond to their answers. Build on what they say.`,
          successCriteria: `User participates actively in a conversation about ${unitTitle}`,
        },
        unitTitle,
      ),
    );
  }

  // Return first goal as default, with variations array for progression
  return {
    ...goalVariations[0],
    lessonTitles: lessonTitles.slice(0, 5),
    goalVariations: goalVariations,
    goalIndex: 0,
  };
}

/**
 * Generate creative, actionable roleplay goals based on topic
 * These are specific scenarios, not abstract "use X and Y together"
 */
function generateCreativeGoalsForTopic(topicKey, unitTitle, lessonTitles) {
  const goals = [];

  // Map topics to creative roleplay scenarios
  const topicScenarios = {
    transportation: [
      {
        scenario: "Buy a bus ticket to the city center",
        prompt:
          "You work at a bus station. The learner needs to buy a ticket. Ask where they want to go, tell them the price, and give them departure information.",
        successCriteria:
          "User asks for a ticket, understands the price, and confirms their trip details",
      },
      {
        scenario: "Ask a stranger for directions to the train station",
        prompt:
          "The learner is lost and needs to find the train station. Give them directions using landmarks and transportation vocabulary.",
        successCriteria:
          "User asks for directions and confirms they understand how to get there",
      },
      {
        scenario: "Explain your daily commute to a new coworker",
        prompt:
          "You are a new coworker asking about how to get to work. Ask the learner what transportation they use, how long it takes, and any tips.",
        successCriteria:
          "User describes their commute with transportation type, duration, and route details",
      },
    ],
    greetings: [
      {
        scenario: "Meet a friend's parent for the first time",
        prompt:
          "You are your friend's parent meeting the learner. Have a polite greeting exchange - introductions, pleasantries, and small talk.",
        successCriteria:
          "User greets politely, introduces themselves, and responds appropriately to questions",
      },
    ],
    food: [
      {
        scenario: "Order breakfast at a café",
        prompt:
          "You are a waiter at a café. Take the learner's breakfast order - ask what they want to eat and drink, suggest items, and confirm the order.",
        successCriteria:
          "User orders food and drink items and responds to your suggestions",
      },
      {
        scenario: "Recommend a restaurant to a tourist",
        prompt:
          "You are a tourist asking for restaurant recommendations. Ask the learner about good places to eat, what kind of food they serve, and how to get there.",
        successCriteria:
          "User recommends a place and describes the food and location",
      },
    ],
    numbers: [
      {
        scenario: "Exchange phone numbers with a new friend",
        prompt:
          "You just met the learner and want to stay in touch. Exchange phone numbers - ask for theirs, give yours, and confirm you got it right.",
        successCriteria:
          "User gives their phone number clearly and confirms they wrote down yours correctly",
      },
    ],
    family: [
      {
        scenario: "Show photos of your family to a friend",
        prompt:
          "Ask the learner to describe their family as if showing you photos. Ask about names, ages, relationships, and what each person is like.",
        successCriteria:
          "User describes multiple family members with names and at least one detail about each",
      },
    ],
    places: [
      {
        scenario: "Recommend your favorite spot in the city",
        prompt:
          "You are new to the city and looking for good places to visit. Ask the learner for recommendations - what's there, why they like it, how to get there.",
        successCriteria:
          "User recommends a specific place with description and directions",
      },
    ],
    shopping: [
      {
        scenario: "Return an item that doesn't fit",
        prompt:
          "You work at a clothing store. The learner wants to return or exchange something. Ask what's wrong with it and help them find a solution.",
        successCriteria:
          "User explains the problem and successfully completes the return/exchange",
      },
    ],
    time: [
      {
        scenario: "Make plans to meet a friend this weekend",
        prompt:
          "You want to meet up with the learner this weekend. Discuss when you're both free, what time works, and what you'll do together.",
        successCriteria:
          "User discusses availability using time expressions and agrees on a specific time to meet",
      },
    ],
    weather: [
      {
        scenario: "Decide what to do today based on the weather",
        prompt:
          "Discuss today's weather with the learner and make plans together. Talk about what the weather is like and what activities would be good or bad for it.",
        successCriteria:
          "User describes the weather and suggests appropriate activities",
      },
    ],
    work: [
      {
        scenario: "Tell a new acquaintance about your job",
        prompt:
          "You just met the learner at a party. Ask about their work - what they do, where they work, if they like it, and what a typical day is like.",
        successCriteria:
          "User describes their job with at least 3 details (role, place, activities, or opinions)",
      },
    ],
    health: [
      {
        scenario: "Describe your symptoms to a pharmacist",
        prompt:
          "You work at a pharmacy. The learner doesn't feel well. Ask about their symptoms, how long they've had them, and recommend something to help.",
        successCriteria:
          "User describes symptoms clearly and responds to your recommendations",
      },
    ],
    hobbies: [
      {
        scenario: "Invite someone to join your hobby",
        prompt:
          "Ask the learner about their hobbies, then have them try to convince you to try their favorite hobby. Ask questions about what it involves and why they enjoy it.",
        successCriteria:
          "User describes their hobby in detail and explains why you should try it",
      },
    ],
  };

  // Find matching scenarios for this topic
  for (const [key, scenarios] of Object.entries(topicScenarios)) {
    if (topicKey.includes(key) || key.includes(topicKey)) {
      goals.push(...scenarios);
      break;
    }
  }

  // If we found topic-specific goals, add a synthesis goal using lesson titles
  if (goals.length > 0 && lessonTitles.length >= 2) {
    goals.push({
      scenario: `Combine: ${lessonTitles[0]} and ${lessonTitles[1]}`,
      prompt: `Create a realistic conversation that naturally combines elements from "${lessonTitles[0]}" and "${lessonTitles[1]}". The learner should demonstrate they can use vocabulary and structures from both lessons.`,
      successCriteria: `User demonstrates language from both ${lessonTitles[0]} and ${lessonTitles[1]} in their responses`,
    });
  }

  // If no specific match, create goals from lesson titles
  if (goals.length === 0 && lessonTitles.length > 0) {
    if (lessonTitles.length >= 2) {
      goals.push({
        scenario: `Use what you learned: ${lessonTitles[0]} + ${lessonTitles[1]}`,
        prompt: `Have a conversation that lets the learner practice "${lessonTitles[0]}" and "${lessonTitles[1]}". Create a realistic situation where both topics come up naturally.`,
        successCriteria: `User demonstrates skills from both lessons in a natural conversation`,
      });
    }

    // Add a roleplay based on unit title
    goals.push({
      scenario: `Real-world practice: ${unitTitle}`,
      prompt: `Create a realistic everyday situation involving ${unitTitle}. Guide the learner through the interaction with follow-up questions.`,
      successCriteria: `User successfully navigates a realistic ${unitTitle} scenario`,
    });
  }

  return goals;
}

/**
 * Topic-specific integrated practice goals for better relevance
 */
const INTEGRATED_PRACTICE_TEMPLATES = {
  "pre-a1 foundations": [
    {
      scenario: "Introduce yourself and ask about someone else",
      prompt:
        "Have the learner introduce themselves fully (name, origin, family) and then ask questions about you.",
      successCriteria:
        "User introduces themselves AND asks at least one question about the other person",
    },
    {
      scenario: "Navigate a simple social situation",
      prompt:
        "Roleplay meeting someone new - greetings, introductions, polite phrases, and saying goodbye.",
      successCriteria:
        "User uses greetings, introduces themselves, and uses polite expressions",
    },
  ],
  greetings: [
    {
      scenario: "Have a complete greeting exchange",
      prompt:
        "Practice a full greeting sequence - hello, how are you, response, and goodbye.",
      successCriteria:
        "User completes a natural greeting exchange with appropriate responses",
    },
  ],
  "people and places": [
    {
      scenario: "Describe where you live and who you live with",
      prompt:
        "Ask about the learner's home - where they live, who is in their family, what's nearby.",
      successCriteria:
        "User describes their location AND mentions family or people",
    },
  ],
  numbers: [
    {
      scenario: "Exchange contact information",
      prompt:
        "Practice giving and asking for phone numbers, ages, or addresses.",
      successCriteria: "User correctly produces multiple numbers in context",
    },
  ],
  food: [
    {
      scenario: "Order a complete meal at a restaurant",
      prompt:
        "Roleplay ordering food - greeting the waiter, ordering food and drink, asking for the check.",
      successCriteria: "User orders at least two items and uses polite phrases",
    },
  ],
  shopping: [
    {
      scenario: "Complete a shopping transaction",
      prompt:
        "Guide the learner through buying something - asking about items, prices, and paying.",
      successCriteria:
        "User asks questions about products AND completes the transaction",
    },
  ],
  travel: [
    {
      scenario: "Plan and describe a trip",
      prompt:
        "Discuss travel plans - where they want to go, when, how, and what they'll do there.",
      successCriteria:
        "User describes travel plans with multiple details (destination, timing, activities)",
    },
  ],
  places: [
    {
      scenario: "Describe your favorite place in your city",
      prompt:
        "Ask the learner about places in their city - a favorite restaurant, park, or neighborhood. Have them describe what it looks like and why they like it.",
      successCriteria:
        "User describes a specific place with at least 3 details (location, appearance, why they like it)",
    },
    {
      scenario: "Give directions to a landmark",
      prompt:
        "You are lost and need directions to a famous place. Ask the learner how to get there.",
      successCriteria:
        "User gives directions using location vocabulary (near, far, turn, straight, etc.)",
    },
  ],
  "describing places": [
    {
      scenario: "Compare two different places",
      prompt:
        "Ask the learner to compare two places they know - their home vs a friend's, their city vs another city, etc.",
      successCriteria:
        "User uses comparison language to describe differences and similarities between places",
    },
  ],
  family: [
    {
      scenario: "Introduce your family members",
      prompt:
        "Ask about the learner's family - names, ages, relationships, what they do. Encourage them to describe each person briefly.",
      successCriteria:
        "User names and describes at least 2-3 family members with basic details",
    },
  ],
  time: [
    {
      scenario: "Describe your typical day",
      prompt:
        "Ask the learner what they do at different times - morning routine, afternoon activities, evening plans.",
      successCriteria:
        "User describes activities at specific times (morning, afternoon, evening) with time expressions",
    },
  ],
  weather: [
    {
      scenario: "Discuss today's weather and make plans",
      prompt:
        "Talk about the weather today and ask what the learner plans to do because of it. Discuss appropriate clothing or activities.",
      successCriteria:
        "User describes weather AND connects it to plans or clothing choices",
    },
  ],
  transportation: [
    {
      scenario: "Explain how you get to work or school",
      prompt:
        "Ask about the learner's commute - what transportation they use, how long it takes, their preferences.",
      successCriteria:
        "User describes their transportation method with details (type, time, frequency)",
    },
  ],
  health: [
    {
      scenario: "Describe how you're feeling today",
      prompt:
        "Ask about the learner's health and wellbeing. If they feel unwell, ask about symptoms. If well, ask what they do to stay healthy.",
      successCriteria:
        "User describes their physical or emotional state with relevant vocabulary",
    },
  ],
  work: [
    {
      scenario: "Talk about your job or studies",
      prompt:
        "Ask about what the learner does for work or studies - their role, responsibilities, what they like about it.",
      successCriteria:
        "User describes their work/studies with at least 2-3 specific details",
    },
  ],
  hobbies: [
    {
      scenario: "Share your favorite hobby and why you enjoy it",
      prompt:
        "Ask about hobbies and free time activities. Have them explain what they do, how often, and why they enjoy it.",
      successCriteria:
        "User describes a hobby with details about frequency and reasons for enjoyment",
    },
  ],
};

function ensureModeContent(mode, topic, lesson) {
  const topicLabel =
    typeof topic === "string" ? topic : String(topic || "topic");
  const updatedContent = { ...(lesson.content || {}) };

  if (mode === "vocabulary") {
    updatedContent.vocabulary = updatedContent.vocabulary || {
      topic: topicLabel,
      prompt: `Learn and recycle ${topicLabel} vocabulary in context.`,
    };
  }

  if (mode === "grammar") {
    updatedContent.grammar = updatedContent.grammar || {
      topic: topicLabel,
      focusPoints: ["form", "use"],
    };
  }

  if (mode === "stories") {
    updatedContent.stories = updatedContent.stories || {
      topic: topicLabel,
      prompt: `Follow a short story that highlights ${topicLabel} language.`,
    };
  }

  if (mode === "reading") {
    updatedContent.reading = updatedContent.reading || {
      topic: topicLabel,
      prompt: `Interpret written prompts about ${topicLabel}.`,
    };
  }

  if (mode === "realtime") {
    updatedContent.realtime =
      updatedContent.realtime ||
      generateActionableRealtimeGoal(topicLabel, lesson);
  }

  return updatedContent;
}

function hashText(text) {
  return String(text || "")
    .split("")
    .reduce((hash, char) => {
      return (hash * 31 + char.charCodeAt(0)) % 2147483647;
    }, 7);
}

function applyPreA1LessonModuleStrategy(unit, lessons) {
  const extraModes = ["realtime", "reading", "stories"];
  let previousSignature = null;

  return lessons.map((lesson) => {
    const isProtectedLesson =
      lesson.isTutorial ||
      lesson.isFinalQuiz ||
      lesson.id?.includes("skill-builder") ||
      lesson.id?.includes("integrated-practice");

    if (isProtectedLesson) {
      previousSignature = null;
      return lesson;
    }

    const seed = hashText(`${unit.id}-${lesson.id}-${lesson.title?.en || ""}`);
    const desiredExtraCount = 1 + (seed % 2);
    const rotatingModes = [...extraModes]
      .sort((left, right) => {
        const leftScore = (hashText(`${lesson.id}-${left}`) + seed) % 97;
        const rightScore = (hashText(`${lesson.id}-${right}`) + seed) % 97;
        return leftScore - rightScore;
      })
      .slice(0, desiredExtraCount);

    const options = [
      [...rotatingModes],
      [...extraModes.filter((mode) => !rotatingModes.includes(mode))].slice(
        0,
        desiredExtraCount,
      ),
      [...extraModes.filter((mode) => !rotatingModes.includes(mode))],
    ].filter((modes) => modes.length > 0);

    const selectedExtras =
      options.find((modes) => modes.sort().join("|") !== previousSignature) ||
      rotatingModes;

    const modes = ["vocabulary", "grammar", ...selectedExtras];
    const signature = [...selectedExtras].sort().join("|");

    let content = { ...(lesson.content || {}) };
    modes.forEach((mode) => {
      content = ensureModeContent(mode, deriveLessonTopic(unit, lesson), {
        ...lesson,
        content,
      });
    });

    previousSignature = signature;

    return {
      ...lesson,
      modes,
      content,
    };
  });
}

function normalizeLessonModes(unit, lesson) {
  // Skip normalization for tutorial lessons - preserve their exact modes
  if (lesson.isTutorial) {
    return lesson;
  }

  const topic = deriveLessonTopic(unit, lesson);
  const isQuiz = lesson.isFinalQuiz;
  const isSkillBuilder = lesson.id?.includes("skill-builder");
  const isIntegratedPractice = lesson.id?.includes("integrated-practice");

  let modes = (lesson.modes || []).filter((mode) => ALLOWED_MODULES.has(mode));
  modes = Array.from(new Set(modes));

  if (isQuiz) {
    modes = ["grammar", "vocabulary"];
  } else if (isSkillBuilder) {
    modes = ["grammar", "vocabulary"];
  } else if (isIntegratedPractice) {
    modes = ["realtime", "reading", "stories"];
  } else {
    if (modes.length === 0) {
      modes = ["vocabulary", "realtime", "reading"];
    }

    // Fill in missing modes only if lesson has fewer than 2
    while (modes.length < 2) {
      const filler = [
        "vocabulary",
        "grammar",
        "reading",
        "stories",
        "realtime",
      ].find((mode) => !modes.includes(mode));
      if (!filler) break;
      modes.push(filler);
    }

    if (modes.length > 5) {
      modes = modes.slice(0, 5);
    }
  }

  let content = { ...(lesson.content || {}) };
  modes.forEach((mode) => {
    content = ensureModeContent(mode, topic, { ...lesson, content });
  });

  return { ...lesson, modes, content };
}

function ensureUnitModuleCoverage(unit, lessons) {
  const moduleCounts = lessons.reduce((counts, lesson) => {
    lesson.modes?.forEach((mode) => {
      counts[mode] = (counts[mode] || 0) + 1;
    });
    return counts;
  }, {});

  const missingModules = Array.from(ALLOWED_MODULES).filter(
    (module) => !moduleCounts[module],
  );

  const eligibleLessons = lessons.filter(
    (lesson) =>
      !lesson.isFinalQuiz &&
      !lesson.id?.includes("skill-builder") &&
      !lesson.id?.includes("integrated-practice"),
  );

  missingModules.forEach((module) => {
    let targetLesson = eligibleLessons.find(
      (lesson) =>
        (lesson.modes?.length || 0) < 4 &&
        !(lesson.modes || []).includes(module),
    );

    if (!targetLesson) {
      targetLesson = eligibleLessons.find((lesson) => {
        const lessonModes = lesson.modes || [];
        if (lessonModes.includes(module)) return false;
        if (lessonModes.length !== 4) return false;
        return lessonModes.some((mode) => moduleCounts[mode] > 1);
      });

      if (targetLesson) {
        const modeToReplace = targetLesson.modes.find(
          (mode) => moduleCounts[mode] > 1,
        );
        if (modeToReplace) {
          targetLesson.modes = targetLesson.modes
            .filter((mode) => mode !== modeToReplace)
            .concat(module);
          moduleCounts[modeToReplace] -= 1;
        }
      }
    }

    if (!targetLesson) {
      return;
    }

    targetLesson.modes = Array.from(
      new Set([...(targetLesson.modes || []), module]),
    );
    targetLesson.content = ensureModeContent(
      module,
      deriveLessonTopic(unit, targetLesson),
      targetLesson,
    );
    moduleCounts[module] = (moduleCounts[module] || 0) + 1;
  });

  return lessons;
}

function tagLessonWithFunction(level, unit, lesson) {
  const topic = deriveLessonTopic(unit, lesson);
  const profile = CEFR_LEVEL_PROFILES[level] || CEFR_LEVEL_PROFILES.A1;
  return {
    ...lesson,
    objectives: buildLessonObjectives(level, unit, lesson),
    communicativeFocus: {
      function: `${profile.interaction} on ${topic}`,
      discourseSkills: profile.discourseSkills,
      scenario: `${unit.description?.en || unit.title?.en}: ${
        lesson.description?.en || lesson.title?.en || "lesson"
      }`,
    },
  };
}

function assignSubLevels(unitsByLevel) {
  const cloned = JSON.parse(JSON.stringify(unitsByLevel));

  Object.entries(cloned).forEach(([level, units]) => {
    const subStages = SUB_LEVEL_SEGMENTS[level] || [level];
    const chunkSize = Math.ceil(units.length / subStages.length);

    cloned[level] = units.map((unit, index) => {
      const subLevelIndex = Math.min(
        Math.floor(index / chunkSize),
        subStages.length - 1,
      );
      const subLevel = subStages[subLevelIndex];
      const isMilestone =
        index === units.length - 1 || (index + 1) % chunkSize === 0;

      return {
        ...unit,
        subLevel,
        milestone: isMilestone
          ? {
              title: `${subLevel} milestone`,
              summary: `Checkpoint for ${subLevel} to verify readiness before advancing to the next sub-stage.`,
              checks: [
                `Completed ${unit.title?.en || "unit"} quiz with ${
                  unit.lessons?.find((lesson) => lesson.isFinalQuiz)?.quizConfig
                    ?.passingScore || "target"
                } passing score target.`,
                `Can ${
                  CEFR_LEVEL_PROFILES[level]?.interaction ||
                  "interact in everyday situations"
                } using the themes from this segment.`,
                `Demonstrates ${
                  CEFR_LEVEL_PROFILES[level]?.accuracy || "steady control"
                } across ${subLevel} topics.`,
              ],
            }
          : undefined,
      };
    });
  });

  return cloned;
}

function applyCEFRScaffolding(path) {
  const stagedPath = assignSubLevels(path);

  Object.entries(stagedPath).forEach(([level, units]) => {
    stagedPath[level] = units.map((unit) => {
      const expandedLessons = addSupplementalLessons(level, unit);
      const enhancedLessons = expandedLessons.map((lesson) =>
        normalizeLessonModes(
          unit,
          appendAdvancedModes(
            level,
            tagLessonWithFunction(level, unit, lesson),
            unit,
          ),
        ),
      );
      const balancedLessons = applyPreA1LessonModuleStrategy(
        unit,
        ensureUnitModuleCoverage(unit, enhancedLessons),
      );

      const scheduledLessons = applyLessonXPSchedule(balancedLessons);

      // Append a Game Review lesson at the end of every non-tutorial unit
      if (!unit.isTutorial) {
        const unitTitle = unit.title?.en || "Unit";
        const maxXp = Math.max(...scheduledLessons.map((l) => l.xpRequired || 0), 0);
        const unitTopics = scheduledLessons
          .filter((l) => !l.isGame)
          .map((l) =>
            l.content?.vocabulary?.topic || l.content?.grammar?.topic ||
            l.content?.realtime?.scenario || l.content?.reading?.topic ||
            l.title?.en || "",
          )
          .filter(Boolean);
        scheduledLessons.push({
          id: `${unit.id}-game`,
          title: { en: "Game Review", es: "Repaso de Juego" },
          description: {
            en: `Review ${unitTitle} by playing an interactive game`,
            es: `Repasa ${unit.title?.es || unitTitle} jugando un juego interactivo`,
          },
          xpRequired: maxXp + 30,
          xpReward: 30,
          isGame: true,
          modes: ["game"],
          content: {
            game: {
              topic: `${unitTitle} game review`, unitTitle, cefrLevel: level,
              unitTopics, focusPoints: ["comprehensive review"],
              ...tagGameLessonContent(unitTopics),
            },
          },
        });
      }

      return {
        ...unit,
        communicativeFunctions: [
          `Functional focus: ${
            CEFR_LEVEL_PROFILES[level]?.interaction || "interaction"
          }.`,
          `Discourse skills: ${(
            CEFR_LEVEL_PROFILES[level]?.discourseSkills || []
          ).join(", ")}.`,
        ],
        lessons: scheduledLessons,
      };
    });
  });

  return stagedPath;
}

const cefrAlignedLearningPath = withLocalizedSkillTreeText(
  applyCEFRScaffolding(baseLearningPath),
);

const SUPPORTED_TARGET_LANGS = new Set([
  "en",
  "es",
  "pt",
  "fr",
  "it",
  "nl",
  "nah",
  "ja",
  "ru",
  "de",
  "el",
  "pl",
  "ga",
  "yua",
]);
const DEFAULT_TARGET_LANG = "es";

const cloneLearningPath = () =>
  JSON.parse(JSON.stringify(cefrAlignedLearningPath));

export const LEARNING_PATHS = {
  es: cloneLearningPath(), // Spanish
  en: cloneLearningPath(), // English
  pt: cloneLearningPath(), // Portuguese
  fr: cloneLearningPath(), // French
  it: cloneLearningPath(), // Italian
  nl: cloneLearningPath(), // Dutch
  nah: cloneLearningPath(), // Eastern Huasteca Nahuatl
  ja: cloneLearningPath(), // Japanese
  ru: cloneLearningPath(), // Russian
  de: cloneLearningPath(), // German
  el: cloneLearningPath(), // Greek
  pl: cloneLearningPath(), // Polish
  ga: cloneLearningPath(), // Irish
  yua: cloneLearningPath(), // Yucatec Maya
};

/**
 * Get the learning path for a specific language and level
 */
export function getLearningPath(targetLang, level) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;
  const units = LEARNING_PATHS[lang]?.[level] || [];
  // Return a shallow array clone so consumers can iterate / filter freely
  // without mutating the static source. We intentionally do NOT deep-clone:
  // JSON.parse(JSON.stringify(units)) on the multi-level case was a 2-3s
  // synchronous main-thread block on iOS Safari, which manifested as a
  // frozen UI (including stuttering sounds) when switching modes. All
  // current consumers treat the returned data as read-only.
  return units.slice();
}

/**
 * Get the learning path for multiple levels
 * Returns combined units from all specified levels with level metadata
 */
export function getMultiLevelLearningPath(targetLang, levels = ["A1", "A2"]) {
  const lang = SUPPORTED_TARGET_LANGS.has(targetLang)
    ? targetLang
    : DEFAULT_TARGET_LANG;

  const allUnits = [];
  levels.forEach((level) => {
    const units = LEARNING_PATHS[lang]?.[level] || [];
    // Spread each unit so cefrLevel can be added without mutating the source.
    // Inner arrays (e.g. `lessons`) remain references to LEARNING_PATHS; all
    // current consumers read them via .filter/.find/.map and never mutate.
    const unitsWithLevel = units.map((unit) => ({
      ...unit,
      cefrLevel: level,
    }));
    allUnits.push(...unitsWithLevel);
  });

  // IMPORTANT: do not deep-clone here. The previous implementation used
  // JSON.parse(JSON.stringify(allUnits)) "to avoid mutation", but for the
  // Tutor mode (which loads all 7 CEFR levels) that serialize+parse pass
  // synchronously blocks the iOS Safari main thread for 2-3 seconds — long
  // enough that audio (Tone.js mode-switch chord) stutters and the mode
  // swap visibly freezes. The shallow `.map({...unit})` above is sufficient
  // protection given consumers never mutate the returned tree.
  return allUnits;
}

/**
 * Calculate total XP required to complete a unit
 */
export function getUnitTotalXP(unit) {
  return unit.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
}

/**
 * Get the next available lesson for a user based on sequential completion
 */
export function getNextLesson(units, userProgress) {
  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    for (
      let lessonIndex = 0;
      lessonIndex < unit.lessons.length;
      lessonIndex++
    ) {
      const lesson = unit.lessons[lessonIndex];
      if (!userProgress?.[lesson.id]?.completed) {
        return { lesson, unitIndex, lessonIndex, unit };
      }
    }
  }
  return null;
}

/**
 * Get overall unit progress as a percentage
 */
export function getUnitProgress(unit, userProgress) {
  const total = unit.lessons.length;
  if (!total) return 0;
  const completed = unit.lessons.filter(
    (l) => userProgress?.[l.id]?.completed,
  ).length;
  return Math.round((completed / total) * 100);
}
