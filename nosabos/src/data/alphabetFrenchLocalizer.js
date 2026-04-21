import { translateFlashcardConceptToFrench } from "./flashcards/frenchLocalizer.js";

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
  const trimmed = String(source).trim();
  const first = trimmed.charAt(0);
  if (first && first === first.toLocaleUpperCase("en-US") && /[A-Z]/i.test(first)) {
    return capitalizeFirst(translation);
  }
  return translation;
};

const INSTRUCTION_TRANSLATIONS = {
  silent: "muet",
  "always silent": "toujours muet",
  "never silent": "jamais muet",
  "not silent": "non muet",
  "short sound": "son court",
  "long sound": "son long",
  "soft sound": "son doux",
  "hard sound": "son dur",
  "same sound": "meme son",
  "unique sound": "son unique",
  "pure sound": "son pur",
  "sounds like": "se prononce comme",
  "sounds like english": "se prononce comme en anglais",
  "like english": "comme en anglais",
  "like spanish": "comme en espagnol",
  "like french": "comme en francais",
  "like german": "comme en allemand",
  "at the beginning": "au debut",
  "at the end": "a la fin",
  "before vowels": "avant les voyelles",
  "before a vowel": "avant une voyelle",
  "before e/i": "avant e/i",
  "before a/o/u": "avant a/o/u",
  "after vowels": "apres les voyelles",
  "with accent": "avec accent",
  "without accent": "sans accent",
  "nasal sound": "son nasal",
  "rounded lips": "levres arrondies",
  "open sound": "son ouvert",
  "closed sound": "son ferme",
  "rolled r": "r roule",
  "guttural sound": "son guttural",
  "borrowed words": "mots empruntes",
  "foreign words": "mots etrangers",
  "regional": "regional",
  "formal": "formel",
  "casual speech": "discours familier",
  "sometimes": "parfois",
  "often": "souvent",
  "rare": "rare",
  "common": "commun",
};

const translateKnownInstruction = (text) => {
  const source = String(text || "").trim();
  if (!source) return "";

  const exact = INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (exact) return applySourceCase(source, exact);

  let translated = source;
  for (const [english, french] of Object.entries(INSTRUCTION_TRANSLATIONS)) {
    const pattern = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    translated = translated.replace(pattern, (match) => applySourceCase(match, french));
  }

  return translated;
};

export const translateAlphabetInstructionToFrench = (text) =>
  translateKnownInstruction(text) || text || "";

export const translateAlphabetMeaningToFrench = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    return translateFlashcardConceptToFrench(meaning) || meaning;
  }

  const source = meaning.en || meaning.es || meaning.it || "";
  return meaning.fr || translateFlashcardConceptToFrench(source) || source || "";
};

const addFrenchAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.soundEs || letter.sound || "";
  const sourceTip = letter.tipEs || letter.tip || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    soundFr: letter.soundFr || translateAlphabetInstructionToFrench(sourceSound),
    tipFr: letter.tipFr || translateAlphabetInstructionToFrench(sourceTip),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      fr: translateAlphabetMeaningToFrench(practiceWordMeaning),
    },
  };
};

export const withFrenchAlphabetSupport = (letters) =>
  Array.isArray(letters) ? letters.map(addFrenchAlphabetCopy) : letters;
