/**
 * Conversation Topics Utilities
 *
 * Provides functions to extract lesson topics from the skill tree
 * for AI-powered conversation topic generation.
 */

import { getLearningPath } from "./skillTreeData";

/**
 * Extract lesson topics from the skill tree for a given proficiency level
 * Returns a list of unit titles and lesson topics for AI context
 *
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2)
 * @param {string} targetLang - Target language code (es, en, pt, fr, it, nl, nah)
 * @returns {string[]} - Array of topic strings
 */
export function getSkillTreeTopics(level = "A1", targetLang = "es") {
  const levels = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
  const levelIndex = levels.indexOf(level);
  const effectiveIndex = levelIndex === -1 ? 0 : levelIndex;

  const topics = [];

  // Collect topics from all levels up to and including the user's level
  for (let i = 0; i <= effectiveIndex; i++) {
    const currentLevel = levels[i];
    const units = getLearningPath(targetLang, currentLevel);

    if (units && Array.isArray(units)) {
      units.forEach((unit) => {
        // Skip tutorial units
        if (unit.isTutorial) return;

        // Add unit title
        const unitTitle = unit.title?.en || unit.title;
        if (unitTitle) {
          topics.push(`${currentLevel}: ${unitTitle}`);
        }

        // Add lesson topics
        if (unit.lessons && Array.isArray(unit.lessons)) {
          unit.lessons.forEach((lesson) => {
            // Skip quizzes
            if (lesson.isFinalQuiz) return;

            const lessonTitle = lesson.title?.en || lesson.title;
            if (lessonTitle && !lessonTitle.includes("Quiz")) {
              topics.push(`${currentLevel}: ${lessonTitle}`);
            }
          });
        }
      });
    }
  }

  return topics;
}

/**
 * Get a random subset of skill tree topics for the AI prompt
 * This keeps the prompt size reasonable while providing variety
 *
 * @param {string} level - CEFR level
 * @param {string} targetLang - Target language code
 * @param {number} count - Number of topics to return
 * @returns {string[]} - Random subset of topics
 */
export function getRandomSkillTreeTopics(
  level = "A1",
  targetLang = "es",
  count = 15
) {
  const allTopics = getSkillTreeTopics(level, targetLang);

  // Shuffle and take a subset
  const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Fallback topics in case API fails
 * Simple prompts appropriate for each level
 */
export const fallbackTopics = {
  "Pre-A1": [
    { en: "Say hello", es: "Di hola", it: "Di' ciao" },
    { en: "Count to ten", es: "Cuenta hasta diez", it: "Conta fino a dieci" },
    { en: "Name a color", es: "Nombra un color", it: "Nomina un colore" },
    { en: "Say your name", es: "Di tu nombre", it: "Di' il tuo nome" },
    { en: "Say thank you", es: "Di gracias", it: "Di' grazie" },
  ],
  A1: [
    { en: "Introduce yourself", es: "Preséntate", it: "Presentati" },
    { en: "Talk about your family", es: "Habla sobre tu familia", it: "Parla della tua famiglia" },
    { en: "Describe your daily routine", es: "Describe tu rutina diaria", it: "Descrivi la tua routine quotidiana" },
    { en: "Talk about your favorite food", es: "Habla sobre tu comida favorita", it: "Parla del tuo cibo preferito" },
    { en: "Describe the weather today", es: "Describe el clima de hoy", it: "Descrivi il tempo di oggi" },
  ],
  A2: [
    { en: "Describe your neighborhood", es: "Describe tu vecindario", it: "Descrivi il tuo quartiere" },
    { en: "Talk about your hobbies", es: "Habla sobre tus pasatiempos", it: "Parla dei tuoi hobby" },
    { en: "Describe what you did yesterday", es: "Describe lo que hiciste ayer", it: "Descrivi cosa hai fatto ieri" },
    { en: "Talk about your job or studies", es: "Habla sobre tu trabajo o estudios", it: "Parla del tuo lavoro o studio" },
    { en: "Make plans for the weekend", es: "Haz planes para el fin de semana", it: "Fai piani per il weekend" },
  ],
  B1: [
    { en: "Share a memorable experience", es: "Comparte una experiencia memorable", it: "Condividi un'esperienza memorabile" },
    { en: "Give advice about learning languages", es: "Da consejos sobre aprender idiomas", it: "Dai consigli per imparare le lingue" },
    { en: "Discuss your future goals", es: "Habla sobre tus metas futuras", it: "Parla dei tuoi obiettivi futuri" },
    { en: "Compare two places you know", es: "Compara dos lugares que conoces", it: "Confronta due luoghi che conosci" },
    { en: "Talk about a person who inspires you", es: "Habla sobre una persona que te inspira", it: "Parla di una persona che ti ispira" },
  ],
  B2: [
    { en: "Discuss the impact of technology", es: "Habla sobre el impacto de la tecnología", it: "Discuti l'impatto della tecnologia" },
    { en: "Debate work-life balance", es: "Debate el equilibrio trabajo-vida", it: "Dibatti l'equilibrio lavoro-vita" },
    { en: "Analyze a current event", es: "Analiza un evento actual", it: "Analizza un evento attuale" },
    { en: "Discuss environmental challenges", es: "Habla sobre desafíos ambientales", it: "Discuti le sfide ambientali" },
    { en: "Share your views on education", es: "Comparte tus opiniones sobre la educación", it: "Condividi le tue opinioni sull'istruzione" },
  ],
  C1: [
    { en: "Analyze ethical implications of AI", es: "Analiza las implicaciones éticas de la IA", it: "Analizza le implicazioni etiche dell'IA" },
    { en: "Discuss cultural identity", es: "Habla sobre identidad cultural", it: "Discuti l'identità culturale" },
    { en: "Critique a social policy", es: "Critica una política social", it: "Critica una politica sociale" },
    { en: "Debate privacy in the digital age", es: "Debate la privacidad en la era digital", it: "Dibatti la privacy nell'era digitale" },
    { en: "Discuss economic inequality", es: "Habla sobre la desigualdad económica", it: "Discuti la disuguaglianza economica" },
  ],
  C2: [
    { en: "Explore the nature of consciousness", es: "Explora la naturaleza de la conciencia", it: "Esplora la natura della coscienza" },
    { en: "Analyze media influence on society", es: "Analiza la influencia de los medios en la sociedad", it: "Analizza l'influenza dei media sulla società" },
    { en: "Discuss philosophical perspectives on truth", es: "Habla sobre perspectivas filosóficas de la verdad", it: "Discuti prospettive filosofiche sulla verità" },
    { en: "Debate the future of human agency", es: "Debate el futuro de la agencia humana", it: "Dibatti il futuro dell'agire umano" },
    { en: "Analyze geopolitical trends", es: "Analiza tendencias geopolíticas", it: "Analizza tendenze geopolitiche" },
  ],
};

/**
 * Get a random fallback topic for the given level
 *
 * @param {string} level - CEFR level
 * @returns {{ en: string, es: string }}
 */
export function getRandomFallbackTopic(level = "A1") {
  const topics = fallbackTopics[level] || fallbackTopics.A1;
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}
