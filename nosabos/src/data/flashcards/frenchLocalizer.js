/**
 * Adds French support-language concepts to flashcard payloads.
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

const applySourceCase = (source, translation) => {
  if (!source || !translation) return translation;
  const first = String(source).trim().charAt(0);
  if (first && first === first.toLocaleUpperCase("en-US") && /[A-Z]/i.test(first)) {
    return capitalizeFirst(translation);
  }
  return translation;
};

const CONCEPT_TRANSLATIONS = {
  hello: "bonjour",
  goodbye: "au revoir",
  please: "s'il vous plait",
  "thank you": "merci",
  "excuse me": "excusez-moi",
  sorry: "desole",
  yes: "oui",
  no: "non",
  maybe: "peut-etre",
  "how are you?": "comment ca va ?",
  "nice to meet you": "ravi de vous rencontrer",
  "have a good day": "bonne journee",
  "see you later": "a plus tard",
  "you're welcome": "de rien",
  "i'm sorry": "je suis desole",
  "good morning": "bonjour",
  "good afternoon": "bon apres-midi",
  "good evening": "bonsoir",
  "good night": "bonne nuit",
  "what's up?": "quoi de neuf ?",
  congratulations: "felicitations",
  "happy birthday": "joyeux anniversaire",
  welcome: "bienvenue",
  name: "nom",
  age: "age",
  from: "de",
  where: "ou",
  who: "qui",
  i: "je",
  you: "tu",
  he: "il",
  she: "elle",
  we: "nous",
  they: "ils",
  "my name is...": "je m'appelle...",
  "i'm from...": "je viens de...",
  "where are you from?": "d'ou viens-tu ?",
  "how old are you?": "quel age as-tu ?",
  country: "pays",
  city: "ville",
  language: "langue",
  zero: "zero",
  one: "un",
  two: "deux",
  three: "trois",
  four: "quatre",
  five: "cinq",
  six: "six",
  seven: "sept",
  eight: "huit",
  nine: "neuf",
  ten: "dix",
  today: "aujourd'hui",
  tomorrow: "demain",
  yesterday: "hier",
  morning: "matin",
  afternoon: "apres-midi",
  evening: "soir",
  night: "nuit",
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
  sunday: "dimanche",
  what: "quoi",
  when: "quand",
  why: "pourquoi",
  how: "comment",
  which: "lequel",
  food: "nourriture",
  water: "eau",
  bread: "pain",
  milk: "lait",
  coffee: "cafe",
  tea: "the",
  rice: "riz",
  meat: "viande",
  fish: "poisson",
  fruit: "fruit",
  apple: "pomme",
  banana: "banane",
  orange: "orange",
  vegetable: "legume",
  salt: "sel",
  sugar: "sucre",
  breakfast: "petit-dejeuner",
  lunch: "dejeuner",
  dinner: "diner",
  home: "maison",
  house: "maison",
  room: "piece",
  kitchen: "cuisine",
  bathroom: "salle de bain",
  bedroom: "chambre",
  table: "table",
  chair: "chaise",
  door: "porte",
  window: "fenetre",
  book: "livre",
  pen: "stylo",
  phone: "telephone",
  computer: "ordinateur",
  school: "ecole",
  work: "travail",
  teacher: "enseignant",
  student: "eleve",
  friend: "ami",
  family: "famille",
  mother: "mere",
  father: "pere",
  brother: "frere",
  sister: "soeur",
  mom: "maman",
  dad: "papa",
  child: "enfant",
  baby: "bebe",
  boy: "garcon",
  girl: "fille",
  man: "homme",
  woman: "femme",
  big: "grand",
  small: "petit",
  good: "bon",
  bad: "mauvais",
  new: "nouveau",
  old: "vieux",
  hot: "chaud",
  cold: "froid",
  happy: "heureux",
  sad: "triste",
  tired: "fatigue",
  sick: "malade",
  red: "rouge",
  blue: "bleu",
  green: "vert",
  yellow: "jaune",
  black: "noir",
  white: "blanc",
};

export const translateFlashcardConceptToFrench = (englishText) => {
  if (!englishText || typeof englishText !== "string") return englishText;
  const translated = CONCEPT_TRANSLATIONS[normalizeKey(englishText)];
  return translated ? applySourceCase(englishText, translated) : englishText;
};

const addFrenchConcept = (card) => {
  if (!card || typeof card !== "object") return card;
  if (!card.concept || typeof card.concept !== "object") return card;
  if (typeof card.concept.fr === "string") return card;
  return {
    ...card,
    concept: {
      ...card.concept,
      fr: translateFlashcardConceptToFrench(card.concept.en),
    },
  };
};

export const withFrenchFlashcardText = (cards) =>
  Array.isArray(cards) ? cards.map(addFrenchConcept) : cards;
