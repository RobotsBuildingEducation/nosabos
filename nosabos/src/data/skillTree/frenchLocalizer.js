/**
 * Adds French support-language copy to skill-tree payloads.
 *
 * The source lesson data keeps its authored English/Spanish content. This pass
 * adds a `fr` field anywhere the shared readers expect `{ en, es, ... }`.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("fr-FR") + value.slice(1);
};

const TEXT_TRANSLATIONS = {
  "getting started": "Pour commencer",
  "first words": "Premiers mots",
  "basic greetings and farewells": "Salutations et formules de base",
  "greetings": "Salutations",
  "actions & essentials": "Actions et essentiels",
  "everyday starters": "Premiers mots du quotidien",
  "basic questions": "Questions de base",
  "asking questions": "Poser des questions",
  "food & drinks": "Nourriture et boissons",
  "food and drink": "Nourriture et boissons",
  "colors": "Couleurs",
  "colors & shapes": "Couleurs et formes",
  "family members": "Membres de la famille",
  "family relationships": "Relations familiales",
  "days of week": "Jours de la semaine",
  "calendar basics": "Bases du calendrier",
  "at home": "A la maison",
  "at the restaurant": "Au restaurant",
  "at the market": "Au marche",
  "at the store": "Au magasin",
  "body and health": "Corps et sante",
  "body parts": "Parties du corps",
  "getting around": "Se deplacer",
  "directions": "Directions",
  "travel": "Voyage",
  "transport": "Transport",
  "clothing": "Vetements",
  "daily routine": "Routine quotidienne",
  "free time": "Temps libre",
  "weather": "Meteo",
  "work and school": "Travail et ecole",
  "education": "Education",
  "business spanish": "Espagnol professionnel",
  "business communication": "Communication professionnelle",
  "cultural heritage": "Patrimoine culturel",
  "culture & traditions": "Culture et traditions",
  "current events": "Actualite",
  "arts & literature": "Arts et litterature",
  "advanced discourse": "Discours avance",
  "advanced expressions": "Expressions avancees",
  "advanced greetings": "Salutations avancees",
  "complete mastery": "Maitrise complete",
  "game review": "Revision par le jeu",
  "conversation practice": "Pratique de conversation",
  "grammar": "Grammaire",
  "vocabulary": "Vocabulaire",
  "reading": "Lecture",
  "stories": "Histoires",
  "realtime": "Temps reel",
  "learn new words through interactive questions.":
    "Apprends de nouveaux mots avec des questions interactives.",
  "master grammar rules through exercises.":
    "Maitrise les regles de grammaire avec des exercices.",
  "improve your reading skills by following along with passages.":
    "Ameliore ta lecture en suivant des textes.",
  "practice with interactive stories by reading and speaking sentence by sentence.":
    "Pratique avec des histoires interactives en lisant et parlant phrase par phrase.",
  "practice speaking with realtime conversations.":
    "Pratique l'oral avec des conversations en temps reel.",
  "review what you learned by playing an interactive game.":
    "Revise ce que tu as appris avec un jeu interactif.",
  "finish the tutorial by playing a short game review.":
    "Termine le tutoriel avec une courte revision sous forme de jeu.",
  "the learner says hello.": "L'apprenant dit bonjour.",
  "the learner says hello to you.": 'L\'apprenant te dit "bonjour".',
};

export const translateSkillTreeTextToFrench = (value) => {
  const source = String(value || "").trim();
  if (!source) return source;
  const translated = TEXT_TRANSLATIONS[normalizeKey(source)];
  if (!translated) return source;
  return source.charAt(0) === source.charAt(0).toLocaleUpperCase("en-US")
    ? capitalizeFirst(translated)
    : translated;
};

const addFrenchText = (value) => {
  if (Array.isArray(value)) return value.map(addFrenchText);
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = addFrenchText(child);
  }

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.fr !== "string"
  ) {
    next.fr = translateSkillTreeTextToFrench(value.en);
  }

  if (
    typeof value.successCriteria === "string" &&
    typeof value.successCriteria_fr !== "string"
  ) {
    const translated = translateSkillTreeTextToFrench(value.successCriteria);
    if (translated && translated !== value.successCriteria) {
      next.successCriteria_fr = translated;
    }
  }

  return next;
};

export const withFrenchSkillTreeText = (skillTree) => addFrenchText(skillTree);
