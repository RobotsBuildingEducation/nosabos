export const LANGUAGE_POSTCARDS = {
  nl: {
    greeting: "Dank je wel!",
    greetingMeaning: "thankYou",
    phrase: "Hoe gaat het?",
    phraseMeaning: "howAreYou",
    native: "Nederlands",
    x: 15,
    y: 13,
    tilt: -9,
    tone: "peach"
  },
  en: {
    greeting: "Hello!",
    greetingMeaning: "hello",
    phrase: "How are you?",
    phraseMeaning: "howAreYou",
    native: "English",
    x: 65,
    y: 9,
    tilt: 7,
    tone: "mint"
  },
  fr: {
    greeting: "Ça va ?",
    greetingMeaning: "howAreYou",
    phrase: "Merci !",
    phraseMeaning: "thankYou",
    native: "Français",
    x: 10,
    y: 36,
    tilt: -7,
    tone: "lilac"
  },
  de: {
    greeting: "Guten Tag!",
    greetingMeaning: "goodDay",
    phrase: "Wie geht’s?",
    phraseMeaning: "howAreYou",
    native: "Deutsch",
    x: 84,
    y: 28,
    tilt: 9,
    tone: "peach"
  },
  it: {
    greeting: "Come stai?",
    greetingMeaning: "howAreYou",
    phrase: "Grazie!",
    phraseMeaning: "thankYou",
    native: "Italiano",
    x: 63,
    y: 48,
    tilt: -6,
    tone: "peach"
  },
  pt: {
    greeting: "Tudo bem?",
    greetingMeaning: "howAreYou",
    phrase: "Até logo!",
    phraseMeaning: "seeYou",
    native: "Português",
    x: 30,
    y: 61,
    tilt: 8,
    tone: "mint"
  },
  es: {
    greeting: "¡Hola!",
    greetingMeaning: "hello",
    phrase: "¿Cómo estás?",
    phraseMeaning: "howAreYou",
    native: "Español",
    x: 55,
    y: 82,
    tilt: -8,
    tone: "peach"
  },
  el: {
    greeting: "Καλημέρα!",
    greetingMeaning: "goodMorning",
    phrase: "Τι κάνεις;",
    phraseMeaning: "howAreYou",
    native: "Ελληνικά",
    x: 11,
    y: 76,
    tilt: -8,
    tone: "mint"
  },
  ga: {
    greeting: "Go raibh maith agat!",
    greetingMeaning: "thankYou",
    phrase: "Conas atá tú?",
    phraseMeaning: "howAreYou",
    native: "Gaeilge",
    x: 26,
    y: 93,
    tilt: 5,
    tone: "peach"
  },
  ja: {
    greeting: "ありがとう",
    greetingMeaning: "thankYou",
    phrase: "お元気ですか？",
    phraseMeaning: "howAreYou",
    native: "日本語",
    x: 41,
    y: 30,
    tilt: 5,
    tone: "lilac"
  },
  pl: {
    greeting: "Dzień dobry!",
    greetingMeaning: "goodDay",
    phrase: "Jak się masz?",
    phraseMeaning: "howAreYou",
    native: "Polski",
    x: 83,
    y: 61,
    tilt: 8,
    tone: "lilac"
  },
  ru: {
    greeting: "Как дела?",
    greetingMeaning: "howAreYou",
    phrase: "Спасибо!",
    phraseMeaning: "thankYou",
    native: "Русский",
    x: 84,
    y: 89,
    tilt: -5,
    tone: "mint"
  }
};

// Pick each language's opening once per visit from its phrase pool.
// Keep the phrase and its translation together.

// Pick each language's opening once per visit from its phrase pool.
// Keep the phrase and its translation together.
export function createLanguagePostcards(random = Math.random) {
  return Object.fromEntries(Object.entries(LANGUAGE_POSTCARDS).map(([code, card]) => {
    if (code === "en" || code === "es" || random() < 0.5) return [code, {
      ...card
    }];
    return [code, {
      ...card,
      greeting: card.phrase,
      greetingMeaning: card.phraseMeaning,
      phrase: card.greeting,
      phraseMeaning: card.greetingMeaning
    }];
  }));
}
