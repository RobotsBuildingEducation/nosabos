export const TUTOR_STARTER_AGENDA_IDS = [
  "hello",
  "myNameIs",
  "goodMorning",
  "goodAfternoon",
  "goodNight",
  "howAreYou",
  "goodbye",
];

// The Tutor's first lesson has a deterministic agenda, so it cannot rely on
// the realtime model to translate these phrases. Keep the spoken target
// phrases aligned with the authored lesson-tutorial-1 curriculum.
export const TUTOR_STARTER_TARGET_LANGUAGES = [
  "en",
  "es",
  "pt",
  "fr",
  "de",
  "it",
  "ja",
  "ru",
  "nl",
  "el",
  "pl",
  "ga",
];

const TARGET_EXAMPLES = {
  en: {
    hello: ["hello", "hi"],
    myNameIs: ["my name is", "I am"],
    goodMorning: ["good morning"],
    goodAfternoon: ["good afternoon"],
    goodNight: ["good night"],
    howAreYou: ["how are you", "how's it going"],
    goodbye: ["goodbye", "bye", "see you"],
  },
  es: {
    hello: ["hola"],
    myNameIs: ["me llamo", "mi nombre es"],
    goodMorning: ["buenos días"],
    goodAfternoon: ["buenas tardes"],
    goodNight: ["buenas noches"],
    howAreYou: ["¿cómo estás?", "¿qué tal?"],
    goodbye: ["adiós", "hasta luego"],
  },
  pt: {
    hello: ["olá", "oi"],
    myNameIs: ["meu nome é", "me chamo"],
    goodMorning: ["bom dia"],
    goodAfternoon: ["boa tarde"],
    goodNight: ["boa noite"],
    howAreYou: ["como você está?", "tudo bem?"],
    goodbye: ["adeus", "tchau", "até logo"],
  },
  fr: {
    hello: ["bonjour", "salut"],
    myNameIs: ["je m'appelle", "mon nom est"],
    goodMorning: ["bonjour"],
    goodAfternoon: ["bon après-midi"],
    goodNight: ["bonne nuit"],
    howAreYou: ["comment ça va?"],
    goodbye: ["au revoir", "salut"],
  },
  de: {
    hello: ["hallo", "guten Tag"],
    myNameIs: ["ich heiße", "mein Name ist"],
    goodMorning: ["guten Morgen"],
    goodAfternoon: ["guten Nachmittag"],
    goodNight: ["gute Nacht"],
    howAreYou: ["wie geht es dir?", "wie geht es Ihnen?"],
    goodbye: ["auf Wiedersehen", "tschüss"],
  },
  it: {
    hello: ["ciao", "salve"],
    myNameIs: ["mi chiamo", "il mio nome è"],
    goodMorning: ["buongiorno"],
    goodAfternoon: ["buon pomeriggio"],
    goodNight: ["buona notte", "buonanotte"],
    howAreYou: ["come stai?"],
    goodbye: ["arrivederci", "ciao"],
  },
  ja: {
    hello: ["こんにちは"],
    myNameIs: ["私の名前は", "と申します"],
    goodMorning: ["おはよう"],
    goodAfternoon: ["こんにちは"],
    goodNight: ["おやすみ"],
    howAreYou: ["お元気ですか"],
    goodbye: ["さようなら", "またね"],
  },
  ru: {
    hello: ["привет"],
    myNameIs: ["меня зовут"],
    goodMorning: ["доброе утро"],
    goodAfternoon: ["добрый день"],
    goodNight: ["спокойной ночи"],
    howAreYou: ["как дела?"],
    goodbye: ["до свидания", "пока"],
  },
  nl: {
    hello: ["hallo", "hoi"],
    myNameIs: ["ik heet", "mijn naam is"],
    goodMorning: ["goedemorgen"],
    goodAfternoon: ["goedemiddag"],
    goodNight: ["goedenacht", "goedeavond"],
    howAreYou: ["hoe gaat het?"],
    goodbye: ["tot ziens", "dag", "doei"],
  },
  el: {
    hello: ["γεια"],
    myNameIs: ["με λένε"],
    goodMorning: ["καλημέρα"],
    goodAfternoon: ["καλησπέρα"],
    goodNight: ["καληνύχτα"],
    howAreYou: ["τι κάνεις;"],
    goodbye: ["αντίο", "τα λέμε"],
  },
  pl: {
    hello: ["cześć"],
    myNameIs: ["mam na imię"],
    goodMorning: ["dzień dobry"],
    goodAfternoon: ["dzień dobry"],
    goodNight: ["dobranoc"],
    howAreYou: ["jak się masz?"],
    goodbye: ["do widzenia", "na razie"],
  },
  ga: {
    hello: ["dia dhuit"],
    myNameIs: ["is ainm dom"],
    goodMorning: ["maidin mhaith"],
    goodAfternoon: ["tráthnóna maith"],
    goodNight: ["oíche mhaith"],
    howAreYou: ["conas atá tú?"],
    goodbye: ["slán", "slán go fóill"],
  },
};

function getBaseLanguageCode(language) {
  return String(language || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
}

export function getTutorStarterTargetExamples(itemOrId, targetLang = "es") {
  const itemId =
    typeof itemOrId === "string" ? itemOrId : String(itemOrId?.id || "");
  const language = getBaseLanguageCode(targetLang) || "es";
  const authoredExamples = TARGET_EXAMPLES[language]?.[itemId];
  const embeddedExamples =
    typeof itemOrId === "object" ? itemOrId?.examples?.[language] : null;
  return [
    ...(Array.isArray(authoredExamples) ? authoredExamples : []),
    ...(Array.isArray(embeddedExamples) ? embeddedExamples : []),
  ].filter((example, index, examples) => examples.indexOf(example) === index);
}

export function getTutorStarterModelPhrase(itemOrId, targetLang = "es") {
  return getTutorStarterTargetExamples(itemOrId, targetLang)[0] || "";
}
