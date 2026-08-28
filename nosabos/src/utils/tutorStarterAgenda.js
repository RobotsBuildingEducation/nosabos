export const TUTOR_STARTER_AGENDA_IDS = [
  "hello",
  "myNameIs",
  "goodMorning",
  "goodAfternoon",
  "goodNight",
  "howAreYou",
  "goodbye",
];

export const TUTOR_STARTER_LESSON_IDS = [
  "lesson-tutorial-1",
  "lesson-tutorial-a1",
];

const SUPPORT_LABELS = {
  hello: {
    en: "hello",
    es: "hola",
    pt: "olá",
    it: "ciao",
    fr: "bonjour",
    de: "hallo",
    ja: "こんにちは",
    hi: "नमस्ते",
    ar: "أهلًا",
    zh: "你好",
    nl: "hallo",
  },
  myNameIs: {
    en: "my name is",
    es: "me llamo",
    pt: "meu nome é",
    it: "mi chiamo",
    fr: "je m'appelle",
    de: "ich heiße",
    ja: "私の名前は",
    hi: "मेरा नाम है",
    ar: "اسمي",
    zh: "我叫",
    nl: "ik heet",
  },
  goodMorning: {
    en: "good morning",
    es: "buenos días",
    pt: "bom dia",
    it: "buongiorno",
    fr: "bonjour",
    de: "guten Morgen",
    ja: "おはよう",
    hi: "सुप्रभात",
    ar: "صباح الخير",
    zh: "早上好",
    nl: "goedemorgen",
  },
  goodAfternoon: {
    en: "good afternoon",
    es: "buenas tardes",
    pt: "boa tarde",
    it: "buon pomeriggio",
    fr: "bon après-midi",
    de: "guten Nachmittag",
    ja: "こんにちは",
    hi: "नमस्कार",
    ar: "مساء الخير",
    zh: "下午好",
    nl: "goedemiddag",
  },
  goodNight: {
    en: "good night",
    es: "buenas noches",
    pt: "boa noite",
    it: "buona notte",
    fr: "bonne nuit",
    de: "gute Nacht",
    ja: "おやすみ",
    hi: "शुभ रात्रि",
    ar: "تصبح على خير",
    zh: "晚安",
    nl: "goedenacht",
  },
  howAreYou: {
    en: "how are you",
    es: "cómo estás",
    pt: "como você está",
    it: "come stai",
    fr: "comment ça va",
    de: "wie geht es dir",
    ja: "お元気ですか",
    hi: "आप कैसे हैं",
    ar: "كيف حالك",
    zh: "你好吗",
    nl: "hoe gaat het",
  },
  goodbye: {
    en: "goodbye",
    es: "adiós",
    pt: "adeus",
    it: "arrivederci",
    fr: "au revoir",
    de: "auf Wiedersehen",
    ja: "さようなら",
    hi: "अलविदा",
    ar: "مع السلامة",
    zh: "再见",
    nl: "tot ziens",
  },
};

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

export function getTutorStarterVocabularyPairs(
  targetLang = "es",
  supportLang = "en",
) {
  const support = getBaseLanguageCode(supportLang) || "en";
  const pairs = TUTOR_STARTER_AGENDA_IDS.map((itemId) => ({
    id: itemId,
    target: getTutorStarterTargetExamples(itemId, targetLang)[0] || "",
    meaning:
      SUPPORT_LABELS[itemId]?.[support] ||
      SUPPORT_LABELS[itemId]?.en ||
      itemId,
  })).filter(({ target }) => Boolean(target));

  return Array.from(
    new Map(
      pairs.map((pair) => [
        pair.target.normalize("NFC").trim().toLocaleLowerCase(),
        pair,
      ]),
    ).values(),
  );
}

export function getTutorStarterModelPhrase(itemOrId, targetLang = "es") {
  return getTutorStarterTargetExamples(itemOrId, targetLang)[0] || "";
}

export function isTutorStarterLesson(lessonOrId) {
  const lessonId =
    typeof lessonOrId === "string"
      ? lessonOrId
      : String(lessonOrId?.id || "");
  return TUTOR_STARTER_LESSON_IDS.includes(lessonId);
}

export function getTutorStarterPreviewAgendaItems({
  targetLang = "es",
  supportLang = "en",
} = {}) {
  const supportLanguage = getBaseLanguageCode(supportLang) || "en";

  return TUTOR_STARTER_AGENDA_IDS.map((id) => {
    const meaning =
      SUPPORT_LABELS[id]?.[supportLanguage] || SUPPORT_LABELS[id]?.en || id;
    const phrase = getTutorStarterModelPhrase(id, targetLang);
    const label =
      phrase &&
      phrase.localeCompare(meaning, undefined, { sensitivity: "base" }) !== 0
        ? `${meaning} · ${phrase}`
        : meaning;

    return { id, label };
  });
}
