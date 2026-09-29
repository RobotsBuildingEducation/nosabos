// Capability landmarks follow the skill-tree themes and the things learners
// practice in cards, Tutor, conversations, reading, stories, and games. They
// describe the current Score estimate, rather than certifying mastery.
export const SCORE_MILESTONES = Object.freeze([
  { score: 1, level: "Pre-A1", icon: "star", modes: ["lesson", "flashcards"], en: "Getting started", es: "Primeros pasos" },
  { score: 2, level: "Pre-A1", icon: "spark", modes: ["flashcards", "phonics"], en: "Recognize a greeting", es: "Reconocer un saludo" },
  { score: 4, level: "Pre-A1", icon: "voice", modes: ["tutor", "realtime"], en: "Say hello and your name", es: "Saludar y decir tu nombre" },
  { score: 6, level: "Pre-A1", icon: "heart", modes: ["tutor", "flashcards"], en: "Use polite everyday replies", es: "Usar respuestas cotidianas de cortesía" },
  { score: 9, level: "Pre-A1", icon: "people", modes: ["lesson", "flashcards"], en: "Name people and familiar things", es: "Nombrar personas y cosas conocidas" },
  { score: 12, level: "Pre-A1", icon: "ear", modes: ["tutor", "stories"], en: "Follow a tiny spoken exchange", es: "Seguir un intercambio oral breve" },
  { score: 14, level: "Pre-A1", icon: "book", modes: ["reading", "game"], en: "Read short everyday phrases", es: "Leer frases cotidianas breves" },
  { score: 18, level: "A1", icon: "calendar", modes: ["lesson", "flashcards"], en: "Use common everyday words", es: "Usar palabras cotidianas comunes" },
  { score: 21, level: "A1", icon: "food", modes: ["tutor", "game"], en: "Order food and drinks", es: "Pedir comida y bebidas" },
  { score: 25, level: "A1", icon: "home", modes: ["lesson", "stories"], en: "Describe home and family", es: "Describir tu hogar y familia" },
  { score: 28, level: "A1", icon: "note", modes: ["reading", "tutor"], en: "Understand simple messages", es: "Entender mensajes sencillos" },
  { score: 32, level: "A2", icon: "voice", modes: ["tutor", "conversations"], en: "Keep a basic conversation going", es: "Mantener una conversación básica" },
  { score: 35, level: "A2", icon: "map", modes: ["tutor", "game"], en: "Shop and ask for directions", es: "Comprar y pedir indicaciones" },
  { score: 39, level: "A2", icon: "calendar", modes: ["lesson", "conversations"], en: "Make plans and share interests", es: "Hacer planes y compartir intereses" },
  { score: 42, level: "A2", icon: "story", modes: ["stories", "reading"], en: "Tell a simple past event", es: "Contar un hecho sencillo del pasado" },
  { score: 46, level: "B1", icon: "story", modes: ["stories", "tutor"], en: "Describe experiences in sequence", es: "Relatar experiencias en orden" },
  { score: 49, level: "B1", icon: "voice", modes: ["tutor", "conversations"], en: "Give an opinion with reasons", es: "Dar una opinión con razones" },
  { score: 53, level: "B1", icon: "compass", modes: ["lesson", "game"], en: "Compare options and give advice", es: "Comparar opciones y dar consejos" },
  { score: 56, level: "B1", icon: "book", modes: ["reading", "stories"], en: "Follow and retell a short story", es: "Seguir y resumir un relato breve" },
  { score: 60, level: "B2", icon: "voice", modes: ["tutor", "conversations"], en: "Explain a detailed viewpoint", es: "Explicar un punto de vista detallado" },
  { score: 63, level: "B2", icon: "work", modes: ["lesson", "tutor"], en: "Communicate in work situations", es: "Comunicarse en situaciones laborales" },
  { score: 67, level: "B2", icon: "book", modes: ["reading", "stories"], en: "Read ideas beyond the literal", es: "Leer ideas más allá de lo literal" },
  { score: 70, level: "B2", icon: "people", modes: ["conversations", "game"], en: "Discuss social and cultural issues", es: "Debatir temas sociales y culturales" },
  { score: 74, level: "C1", icon: "compass", modes: ["tutor", "lesson"], en: "Adapt your tone to the situation", es: "Adaptar el tono a cada situación" },
  { score: 77, level: "C1", icon: "voice", modes: ["conversations", "tutor"], en: "Build a nuanced argument", es: "Construir un argumento con matices" },
  { score: 81, level: "C1", icon: "book", modes: ["reading", "stories"], en: "Interpret complex texts", es: "Interpretar textos complejos" },
  { score: 84, level: "C1", icon: "note", modes: ["lesson", "tutor"], en: "Express precise, subtle ideas", es: "Expresar ideas precisas y sutiles" },
  { score: 89, level: "C2", icon: "spark", modes: ["stories", "conversations"], en: "Use idioms naturally", es: "Usar modismos con naturalidad" },
  { score: 92, level: "C2", icon: "voice", modes: ["tutor", "conversations"], en: "Shift style for any audience", es: "Cambiar de estilo según el público" },
  { score: 96, level: "C2", icon: "book", modes: ["reading", "lesson"], en: "Synthesize specialist information", es: "Sintetizar información especializada" },
  { score: 100, level: "C2", icon: "star", modes: ["lesson", "tutor", "conversations"], en: "Communicate with full precision", es: "Comunicarse con plena precisión" },
]);

export function getScoreMilestoneProgress(score) {
  const numeric = score == null ? 0 : Number(score);
  const value = Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
  const reached = SCORE_MILESTONES.filter((milestone) => milestone.score <= value);
  return {
    score: value,
    reached,
    current: reached.at(-1) || null,
    next: SCORE_MILESTONES[reached.length] || null,
  };
}

export function getScoreMilestoneWindow(score) {
  const { reached } = getScoreMilestoneProgress(score);
  const visibleCount = Math.min(3, SCORE_MILESTONES.length);
  const start = Math.max(0, Math.min(reached.length - 2, SCORE_MILESTONES.length - visibleCount));
  return SCORE_MILESTONES.slice(start, start + visibleCount);
}
