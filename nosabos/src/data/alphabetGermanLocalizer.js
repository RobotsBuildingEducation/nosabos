import { translateFlashcardConceptToGerman } from "./flashcards/germanLocalizer.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("de-DE") + value.slice(1);
};

const INSTRUCTION_TRANSLATIONS = {
  "vowel": "Vokal",
  "consonant": "Konsonant",
  "sign": "Zeichen",
  "same as english": "wie im Englischen",
  "same as spanish": "wie im Spanischen",
  "same as italian": "wie im Italienischen",
  "same as german": "wie im Deutschen",
  "same sound as english": "gleicher Laut wie im Englischen",
  "silent": "stumm",
  "always silent": "immer stumm",
  "never silent": "nie stumm",
  "short sound": "kurzer Laut",
  "long sound": "langer Laut",
  "hard sound": "harter Laut",
  "soft sound": "weicher Laut",
  "rolled r": "gerolltes R",
  "trilled r": "vibrierendes R",
  "nasal sound": "nasallaut",
  "rounded lips": "gerundete Lippen",
  "tongue behind teeth": "Zunge hinter den Zähnen",
  "used in loanwords": "in Lehnwörtern verwendet",
  "only in foreign words": "nur in Fremdwörtern",
  "pronounced separately from adjacent vowel":
    "getrennt vom benachbarten Vokal ausgesprochen",
};

const TOKEN_TRANSLATIONS = [
  ["Same as English", "Wie im Englischen"],
  ["Same as Spanish", "Wie im Spanischen"],
  ["Same as Italian", "Wie im Italienischen"],
  ["Same as German", "Wie im Deutschen"],
  ["Like English", "Wie englisches"],
  ["Like Spanish", "Wie spanisches"],
  ["Like German", "Wie deutsches"],
  ["before vowels", "vor Vokalen"],
  ["after vowels", "nach Vokalen"],
  ["between vowels", "zwischen Vokalen"],
  ["at the beginning", "am Anfang"],
  ["at the end", "am Ende"],
  ["of words", "von Wörtern"],
  ["of syllables", "von Silben"],
  ["rounded lips", "gerundete Lippen"],
  ["tongue", "Zunge"],
  ["teeth", "Zähne"],
  ["mouth", "Mund"],
  ["nose", "Nase"],
  ["air", "Luft"],
  ["voiced", "stimmhaft"],
  ["unvoiced", "stimmlos"],
  ["silent", "stumm"],
  ["stress", "Betonung"],
  ["accent", "Akzent"],
  ["letter", "Buchstabe"],
  ["letters", "Buchstaben"],
  ["sound", "Laut"],
  ["sounds", "Laute"],
  ["word", "Wort"],
  ["words", "Wörter"],
  ["vowel", "Vokal"],
  ["vowels", "Vokale"],
  ["consonant", "Konsonant"],
  ["consonants", "Konsonanten"],
  ["English", "Englisch"],
  ["Spanish", "Spanisch"],
  ["Portuguese", "Portugiesisch"],
  ["Italian", "Italienisch"],
  ["French", "Französisch"],
  ["German", "Deutsch"],
  ["Dutch", "Niederländisch"],
  ["Polish", "Polnisch"],
  ["Russian", "Russisch"],
  ["Greek", "Griechisch"],
  ["Irish", "Irisch"],
  ["Japanese", "Japanisch"],
  ["Nahuatl", "Nahuatl"],
  ["Maya", "Maya"],
];

const ENGLISH_SCAFFOLDING_RE =
  /\b(?:same|unique|only|appears|makes|middle|roof|mouth|lips?|air|rare|usually|spelled|voice|say|considered|one|both|capitalize|pull|back|don'?t|not|like|sister|pronounced|sounds?|used|with|without|before|after|always|never|often|sometimes|unlike|tap|trill|floats|start|saying|then|open|quickly|drop|jaw|spread|slightly|doesn'?t|exist|between|fully|close|touches|three|closed|final|palatal|dental|upper|shorter|round|this|uniquely|regional|variation|unaspirated|short|long|has|keep|pure|stay|relaxed|whispered|softer|than|feels|familiar|soft|explosive|tense|drift|toward|neutral|contrast|hiss|let|come|from|throat|palate|standard|clear|ridge|rounded|steady|release|foreign|place|vibrate|vocal|cords|feel|buzz|no|position|but|change|changes|consistent|rules|use|depending|very|different|called|learners|hear|pair|notice|avoid|clean|less|puff|quality|when|becomes)\b/i;

const stripQuotedExamples = (value) =>
  String(value || "")
    .replace(/'[^']*'/g, "")
    .replace(/"[^"]*"/g, "");

const hasEnglishScaffolding = (value) =>
  ENGLISH_SCAFFOLDING_RE.test(stripQuotedExamples(value));

const extractExamples = (source) =>
  [...String(source || "").matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter(Boolean);

const fallbackGermanInstruction = (source, kind) => {
  const examples = extractExamples(source);

  if (kind === "sound") {
    if (examples.length >= 2) {
      return `Laut wie '${examples[0]}' in '${examples[1]}'.`;
    }
    if (examples.length === 1) {
      return `Laut '${examples[0]}' klar aussprechen.`;
    }
    return "Laut klar nachsprechen und auf eine stabile Aussprache achten.";
  }

  if (examples.length >= 2) {
    return `Aussprachehinweis: Vergleiche '${examples[0]}' mit '${examples[1]}' und sprich langsam nach.`;
  }
  if (examples.length === 1) {
    return `Aussprachehinweis: Übe den Laut mit '${examples[0]}' und sprich langsam nach.`;
  }
  return "Aussprachehinweis: Übe den Laut langsam und achte auf Zungen- und Lippenposition.";
};

const translateInstruction = (value, kind = "tip") => {
  const source = String(value || "").trim();
  if (!source) return "";

  const direct = INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (direct) return capitalizeFirst(direct);

  let translated = source;
  for (const [from, to] of TOKEN_TRANSLATIONS) {
    translated = translated.replace(new RegExp(`\\b${from}\\b`, "gi"), to);
  }

  translated = translated
    .replace(/\bSame as\b/gi, "Wie")
    .replace(/\bUnique to ([^!]+)!/gi, "Einzigartig in $1!")
    .replace(/\bUnique\b/gi, "Einzigartig")
    .replace(/\bUnlike\b/gi, "Anders als")
    .replace(/\bOnly appears\b/gi, "Kommt nur vor")
    .replace(/\bMakes\b/gi, "Erzeugt")
    .replace(/\bMiddle of Zunge touches roof of Mund\b/gi, "Die Mitte der Zunge berührt den Gaumen")
    .replace(/\bZunge middle touches\b/gi, "Die Zungenmitte berührt")
    .replace(/\bZunge touches roof behind Zähne\b/gi, "Die Zunge berührt den Gaumen hinter den Zähnen")
    .replace(/\bZunge touches behind upper Zähne\b/gi, "Die Zunge berührt den Bereich hinter den oberen Zähnen")
    .replace(/\bZunge touches upper Zähne ridge\b/gi, "Die Zunge berührt den Zahndamm hinter den oberen Zähnen")
    .replace(/\bZunge touches palate lightly\b/gi, "Die Zunge berührt den Gaumen leicht")
    .replace(/\bZunge touches Zähne\b/gi, "Die Zunge berührt die Zähne")
    .replace(/\broof of Mund\b/gi, "Gaumen")
    .replace(/\bLips together\b/gi, "Lippen zusammen")
    .replace(/\bLips close together\b/gi, "Die Lippen schließen sich")
    .replace(/\bLuft goes through Nase AND Mund\b/gi, "Luft geht durch Nase und Mund")
    .replace(/\bAND\b/g, "und")
    .replace(/\bRare in\b/gi, "Selten im")
    .replace(/\bUsually part of\b/gi, "Meist Teil von")
    .replace(/\busually spelled\b/gi, "meist geschrieben")
    .replace(/\boft spelled\b/gi, "oft geschrieben")
    .replace(/\busually\b/gi, "meist")
    .replace(/\bAlone\b/gi, "Allein")
    .replace(/\bvoice\b/gi, "Stimmhaftigkeit")
    .replace(/\bSay\b/gi, "Sprich")
    .replace(/\bStart\b/gi, "Beginne")
    .replace(/\bsaying\b/gi, "beim Sagen von")
    .replace(/\bthen\b/gi, "dann")
    .replace(/\bopen quickly\b/gi, "schnell öffnen")
    .replace(/\bDrop your jaw low\b/gi, "Senke den Kiefer")
    .replace(/\bspread\b/gi, "spreize")
    .replace(/\bslightly\b/gi, "leicht")
    .replace(/\bDoesn't exist in\b/gi, "Gibt es nicht im")
    .replace(/\bAt start of Wort\b/gi, "Am Wortanfang")
    .replace(/\bdon't fully close\b/gi, "schließen nicht ganz")
    .replace(/\bConsidered one\b/gi, "Gilt als ein")
    .replace(/\bBoth\b/gi, "Beide")
    .replace(/\bThree Laute\b/gi, "Drei Laute")
    .replace(/\bTwo Laute\b/gi, "Zwei Laute")
    .replace(/\bopen É\b/gi, "offenes É")
    .replace(/\bclosed Ê\b/gi, "geschlossenes Ê")
    .replace(/\bopen E\b/gi, "offenes E")
    .replace(/\bclosed E\b/gi, "geschlossenes E")
    .replace(/\bfinal E\b/gi, "E am Wortende")
    .replace(/\bPalatal\b/gi, "Palataler")
    .replace(/\bDental\b/gi, "Dentaler")
    .replace(/\bRegional variation\b/gi, "Regionale Variante")
    .replace(/\bunaspirated\b/gi, "nicht behaucht")
    .replace(/\bShort\b/gi, "Kurzes")
    .replace(/\bLong\b/gi, "Langes")
    .replace(/\bmore open\b/gi, "offener")
    .replace(/\bhas no\b/gi, "hat keinen")
    .replace(/\bkeep it pure\b/gi, "halte es rein")
    .replace(/\bstay relaxed\b/gi, "bleiben entspannt")
    .replace(/\bsometimes whispered\b/gi, "manchmal geflüstert")
    .replace(/\bSofter than\b/gi, "Weicher als")
    .replace(/\bsofter than\b/gi, "weicher als")
    .replace(/\bFeels familiar\b/gi, "Fühlt sich vertraut an")
    .replace(/\bkeep lips soft\b/gi, "halte die Lippen weich")
    .replace(/\bkeep Lippen soft\b/gi, "halte die Lippen weich")
    .replace(/\bexplosive\b/gi, "explosiv")
    .replace(/\btense\b/gi, "angespannt")
    .replace(/\bdrift toward\b/gi, "in Richtung")
    .replace(/\bneutral\b/gi, "neutral")
    .replace(/\bcontrast\b/gi, "Kontrast")
    .replace(/\bhiss\b/gi, "Zischlaut")
    .replace(/\bLet the Laut come from\b/gi, "Lass den Laut aus")
    .replace(/\bcome from\b/gi, "kommen aus")
    .replace(/\bthroat\b/gi, "Kehle")
    .replace(/\bStandard\b/gi, "Standard")
    .replace(/\bClear\b/gi, "Klarer")
    .replace(/\bridge\b/gi, "Zahndamm")
    .replace(/\bRounded\b/gi, "Gerundetes")
    .replace(/\bsteady\b/gi, "stabil")
    .replace(/\bRound your lips\b/gi, "Runde deine Lippen")
    .replace(/\bRound your Lippen\b/gi, "Runde deine Lippen")
    .replace(/\bClose Beide lips\b/gi, "Schließe beide Lippen")
    .replace(/\bClose Beide Lippen\b/gi, "Schließe beide Lippen")
    .replace(/\brelease\b/gi, "lösen")
    .replace(/\bcapitalize together\b/gi, "werden gemeinsam großgeschrieben")
    .replace(/\bdiphthong\b/gi, "Diphthong")
    .replace(/\bpull the\b/gi, "ziehe die")
    .replace(/\bback\b/gi, "zurück")
    .replace(/\blips\b/gi, "Lippen")
    .replace(/\brounded\b/gi, "gerundet")
    .replace(/\bupper\b/gi, "oberen")
    .replace(/\bforeign\b/gi, "fremden")
    .replace(/\btap\b/gi, "kurzer R-Schlag")
    .replace(/\btrill\b/gi, "gerolltes R")
    .replace(/\bfloats\b/gi, "schwebt")
    .replace(/\bmiddle of Mund\b/gi, "Mundmitte")
    .replace(/\bbut shorter\b/gi, "aber kürzer")
    .replace(/\bbut round\b/gi, "aber runde")
    .replace(/\bThis is uniquely\b/gi, "Das ist einzigartig")
    .replace(/\bdon't let it become\b/gi, "lass es nicht zu")
    .replace(/\bnot\b/gi, "nicht")
    .replace(/\blike\b/gi, "wie")
    .replace(/\bsister\b/gi, "Schwester")
    .replace(/\bIceland\b/gi, "Island")
    .replace(/\bpronounced\b/gi, "ausgesprochen")
    .replace(/\bsounds wie\b/gi, "klingt wie")
    .replace(/\bsounds like\b/gi, "klingt wie")
    .replace(/\bsound like\b/gi, "klingen wie")
    .replace(/\bused\b/gi, "verwendet")
    .replace(/\bwith\b/gi, "mit")
    .replace(/\bwithout\b/gi, "ohne")
    .replace(/\bbefore\b/gi, "vor")
    .replace(/\bafter\b/gi, "nach")
    .replace(/\balways\b/gi, "immer")
    .replace(/\bnever\b/gi, "nie")
    .replace(/\boften\b/gi, "oft")
    .replace(/\bsometimes\b/gi, "manchmal")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (translated && hasEnglishScaffolding(translated)) {
    return fallbackGermanInstruction(source, kind);
  }

  return translated && translated !== source
    ? translated
    : fallbackGermanInstruction(source, kind);
};

const translateKnownMeaning = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    return translateFlashcardConceptToGerman(meaning);
  }
  return (
    meaning.de ||
    translateFlashcardConceptToGerman(meaning.en) ||
    translateFlashcardConceptToGerman(meaning.es) ||
    ""
  );
};

export const translateAlphabetMeaningToGerman = translateKnownMeaning;

export const translateAlphabetNameToGerman = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) return "";
  if (letter?.type === "phrase") {
    return translateKnownMeaning(letter.practiceWordMeaning);
  }
  const meaning = translateKnownMeaning(source);
  return meaning || "";
};

const addGermanAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    nameDe: letter.nameDe || translateAlphabetNameToGerman(letter.name, letter),
    soundDe:
      letter.soundDe || translateInstruction(letter.sound || letter.soundEs, "sound"),
    tipDe: letter.tipDe || translateInstruction(letter.tip || letter.tipEs, "tip"),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      de: translateKnownMeaning(practiceWordMeaning),
    },
  };
};

export const withGermanAlphabetSupport = (letters) =>
  Array.isArray(letters) ? letters.map(addGermanAlphabetCopy) : letters;
