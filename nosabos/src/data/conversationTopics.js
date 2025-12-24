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
 * @param {string} targetLang - Target language code (es, en, pt, fr, it, nah)
 * @returns {string[]} - Array of topic strings
 */
export function getSkillTreeTopics(level = "A1", targetLang = "es") {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
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
  A1: [
    { en: "Introduce yourself", es: "Preséntate" },
    { en: "Talk about your family", es: "Habla sobre tu familia" },
    { en: "Describe your daily routine", es: "Describe tu rutina diaria" },
    { en: "Talk about your favorite food", es: "Habla sobre tu comida favorita" },
    { en: "Describe the weather today", es: "Describe el clima de hoy" },
  ],
  A2: [
    { en: "Describe your neighborhood", es: "Describe tu vecindario" },
    { en: "Talk about your hobbies", es: "Habla sobre tus pasatiempos" },
    { en: "Describe what you did yesterday", es: "Describe lo que hiciste ayer" },
    { en: "Talk about your job or studies", es: "Habla sobre tu trabajo o estudios" },
    { en: "Make plans for the weekend", es: "Haz planes para el fin de semana" },
  ],
  B1: [
    { en: "Share a memorable experience", es: "Comparte una experiencia memorable" },
    { en: "Give advice about learning languages", es: "Da consejos sobre aprender idiomas" },
    { en: "Discuss your future goals", es: "Habla sobre tus metas futuras" },
    { en: "Compare two places you know", es: "Compara dos lugares que conoces" },
    { en: "Talk about a person who inspires you", es: "Habla sobre una persona que te inspira" },
  ],
  B2: [
    { en: "Discuss the impact of technology", es: "Habla sobre el impacto de la tecnología" },
    { en: "Debate work-life balance", es: "Debate el equilibrio trabajo-vida" },
    { en: "Analyze a current event", es: "Analiza un evento actual" },
    { en: "Discuss environmental challenges", es: "Habla sobre desafíos ambientales" },
    { en: "Share your views on education", es: "Comparte tus opiniones sobre la educación" },
  ],
  C1: [
    { en: "Analyze ethical implications of AI", es: "Analiza las implicaciones éticas de la IA" },
    { en: "Discuss cultural identity", es: "Habla sobre identidad cultural" },
    { en: "Critique a social policy", es: "Critica una política social" },
    { en: "Debate privacy in the digital age", es: "Debate la privacidad en la era digital" },
    { en: "Discuss economic inequality", es: "Habla sobre la desigualdad económica" },
  ],
  C2: [
    { en: "Explore the nature of consciousness", es: "Explora la naturaleza de la conciencia" },
    { en: "Analyze media influence on society", es: "Analiza la influencia de los medios en la sociedad" },
    { en: "Discuss philosophical perspectives on truth", es: "Habla sobre perspectivas filosóficas de la verdad" },
    { en: "Debate the future of human agency", es: "Debate el futuro de la agencia humana" },
    { en: "Analyze geopolitical trends", es: "Analiza tendencias geopolíticas" },
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
