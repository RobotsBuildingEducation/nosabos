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

const EXACT_MEANING_TRANSLATIONS = {
  "cheers/health": "sante",
  "hello/goodbye": "bonjour / au revoir",
  "hello!": "bonjour !",
  "hello": "bonjour",
  "goodbye": "au revoir",
  "health": "sante",
  "is": "est",
  "i/me": "je / moi",
};

const EXACT_INSTRUCTION_TRANSLATIONS = {
  "same as english f.": "Comme le F anglais.",
  "same as english m.": "Comme le M anglais.",
  "same as english n.": "Comme le N anglais.",
  "same as english b.": "Comme le B anglais.",
  "same as english k.": "Comme le K anglais.",
  "same as english 'ng'. no separate g sound after.":
    "Comme le « ng » anglais, sans son G distinct ensuite.",
  "short i is very short. long i is spelled 'ie'.":
    "Le I court est tres bref. Le I long s'ecrit « ie ».",
  "dutch has short and long vowels. short a is different from english!":
    "Le neerlandais distingue les voyelles courtes et longues. Le A court ne se prononce pas tout a fait comme en anglais.",
  "mostly in borrowed words. native dutch uses k or s.":
    "S'emploie surtout dans les mots empruntes. Le neerlandais natif utilise plutot K ou S.",
  "short o is more open. long o (oo) has no diphthong.":
    "Le O court est plus ouvert. Le OO long reste pur, sans diphtongue.",
  "only in borrowed words. native dutch uses kw.":
    "S'emploie surtout dans les mots empruntes. Le neerlandais natif utilise plutot KW.",
  "dutch r varies by region! uvular (french-like) is common in the west.":
    "Le R neerlandais varie selon les regions. A l'ouest, on entend souvent un R uvulaire proche du francais.",
  "in standard dutch = v sound. in southern dialects = f sound.":
    "En neerlandais standard, c'est un son V. Dans certains dialectes du sud, cela se rapproche plutot de F.",
  "between english w and v. more like v than w.":
    "Entre le W et le V anglais, mais plus proche du V.",
  "considered one letter in dutch! 'ijsland' = iceland. both letters capitalize together.":
    "Considere comme une seule lettre en neerlandais. Dans « IJsland », les deux lettres prennent la majuscule ensemble.",
  "only in foreign words. native dutch uses ij.":
    "S'emploie surtout dans les mots etrangers. Le neerlandais natif utilise plutot IJ.",
  "both ou and au make the same sound in dutch.":
    "OU et AU produisent le meme son en neerlandais.",
  "ei and ij sound the same! spelling difference is historical.":
    "EI et IJ se prononcent pareil. La difference d'orthographe est historique.",
  "this is the dutch way to write the 'oo' sound!":
    "C'est la graphie neerlandaise du son « oo ».",
  "short a is common. can be broad (back) or slender (front) depending on context.":
    "Le A court est frequent. Il peut etre large (arriere) ou fin (avant) selon le contexte.",
  "short e sound. one of the slender vowels (e, i).":
    "Son E court. C'est l'une des voyelles fines (e, i).",
  "short i. a slender vowel that affects surrounding consonants.":
    "I court. Une voyelle fine qui influence les consonnes voisines.",
  "short o. a broad vowel (a, o, u).":
    "O court. Une voyelle large (a, o, u).",
  "short u. a broad vowel.":
    "U court. Une voyelle large.",
  "the most common greeting. literally 'god to you'. response: 'dia is muire duit'.":
    "La formule de salutation la plus courante. Cela signifie litteralement « Dieu a toi ». Reponse : « Dia is Muire duit ».",
  "used as a toast. literally means 'health'.":
    "S'emploie pour porter un toast. Cela signifie litteralement « sante ».",
  "pronounced separately from previous vowel":
    "Se prononce separement de la voyelle precedente.",
  "like 's' before e/i; like 'k' before a/o/u":
    "Comme « s » devant e/i, et comme « k » devant a/o/u.",
  "short: like 'e' in 'bed'; long (ee): like 'ay' without glide":
    "Voyelle courte : comme le « e » de « bed » ; voyelle longue (ee) : comme « ay », sans glissement.",
  "the dutch sound! like german 'ch' in 'bach' but voiced. practice gargling!":
    "LE son neerlandais par excellence ! Comme le « ch » allemand de « Bach », mais sonore. Entraine-toi en faisant vibrer la gorge.",
  "guttural sound from back of throat, like clearing throat":
    "Son guttural forme au fond de la gorge, comme lorsqu'on se racle la gorge.",
  "not like english j! dutch j = english y sound.":
    "Ce n'est PAS le J anglais. En neerlandais, J se prononce comme le son Y anglais.",
  "clear l, similar to spanish.":
    "L clair, proche de l'espagnol.",
  "short: like 'o' in 'pot'; long (oo): like 'oh' but pure":
    "Voyelle courte : comme le « o » de « pot » ; voyelle longue (oo) : comme « oh », mais sans diphtongue.",
  "varies: uvular (back), rolling, or american-style":
    "Varie selon les regions : uvulaire, roule ou a l'americaine.",
  "dental t, unaspirated.":
    "T dentaire, sans aspiration.",
  "short: like 'u' in french 'tu'; long (uu): same but longer":
    "Voyelle courte : comme le « u » du francais « tu » ; voyelle longue (uu) : le meme son, simplement plus long.",
  "like 'v' in 'very' (or like 'f' in some dialects)":
    "Comme le « v » de « very » (ou comme « f » dans certains dialectes).",
  "like 'v' in 'very' but with rounded lips":
    "Comme le « v » de « very », mais avec les levres arrondies.",
  "like 'ks'":
    "Comme « ks ».",
  "like 'ay' in 'say' or 'eye'":
    "Comme « ay » dans « say » ou « eye ».",
  "like 'ee' in borrowed words":
    "Comme « ee » dans les mots empruntes.",
  "like 'z' in 'zoo' (or like 's' in some dialects)":
    "Comme le « z » de « zoo » (ou comme « s » dans certains dialectes).",
  "trema shows e is separate syllable: 'geëerd' = ge-eerd (honored).":
    "Le trema montre que le E forme une syllabe separee : « geëerd » = ge-eerd (« honored »).",
  "trema separates vowels: 'egoïst' = e-go-ist.":
    "Le trema separe les voyelles : « egoïst » = e-go-ist.",
  "start with 'ah', move to rounded 'u'. no english equivalent! 'huis' = house.":
    "Commence par « ah », puis glisse vers un « u » aux levres arrondies. Il n'y a pas d'equivalent exact en anglais. « Huis » veut dire « maison ».",
  "unique dutch diphthong - 'ow' with rounded lips":
    "Diphtongue neerlandaise caracteristique : « ow » avec les levres arrondies.",
  "both like 'ay' in 'say' - almost identical":
    "Les deux se prononcent comme « ay » dans « say », presque a l'identique.",
  "standard: s + guttural g. belgium/some areas: just s.":
    "Standard : S + G guttural. En Belgique et dans certaines regions : seulement S.",
  "like 'sg' with guttural g, or 's' in some regions":
    "Comme « sg » avec un G guttural, ou simplement « s » dans certaines regions.",
  "in casual speech, 'lopen' sounds like 'lopuh'. very dutch!":
    "Dans le parler courant, « lopen » sonne comme « lopuh ». Tres neerlandais !",
  "short 'a' like in 'cat' or long 'aw' like in 'law'":
    "A court comme dans « cat », ou A long comme dans « law ».",
  "the fada (accent) always lengthens the vowel. á sounds like 'aw'.":
    "Le fada (accent) allonge toujours la voyelle. Á sonne comme « aw ».",
  "b alone is like english b. with h (bh), it becomes 'v' or 'w' sound.":
    "B seul se prononce comme en anglais. Avec H (bh), il devient un son proche de « v » ou de « w ».",
  "like 'b' in 'boy', but 'v' when lenited (bh)":
    "Comme le « b » de « boy », mais devient « v » apres lenition (bh).",
  "always hard like k, never soft. with h (ch), sounds like german 'ch'.":
    "Toujours dur comme K, jamais adouci. Avec H (ch), cela ressemble au « ch » allemand.",
  "broad d is like english. slender d (before e, i) has a 'j' quality.":
    "Le D large ressemble a l'anglais. Le D fin (devant e, i) prend une qualite proche de « j ».",
  "like 'd' in 'dog', or 'j' sound when slender":
    "Comme le « d » de « dog », ou avec une qualite proche de « j » dans la forme fine.",
  "the fada lengthens e to an 'ay' sound.":
    "Le fada allonge E vers un son « ay ».",
  "standard f sound. when lenited (fh), it's silent!":
    "Son F normal. Avec lenition (fh), il devient muet.",
  "always hard g. with h (gh), it's a guttural sound or silent.":
    "G reste toujours dur. Avec H (gh), il devient guttural ou muet.",
  "h often follows consonants to show lenition (softening). changes the sound completely.":
    "H suit souvent les consonnes pour marquer la lenition (adoucissement). Cela peut changer totalement le son.",
  "like 'h' in 'hello', or modifies consonants (lenition)":
    "Comme le « h » de « hello », ou sert a modifier les consonnes (lenition).",
  "the fada makes it a long 'ee' sound.":
    "Le fada en fait un son long de type « ee ».",
  "broad l is like english. slender l is lighter, tongue higher.":
    "Le L large ressemble a l'anglais. Le L fin est plus leger, avec la langue plus haute.",
  "like 'l' in 'love', or palatalized when slender":
    "Comme le « l » de « love », ou palatalise dans la forme fine.",
  "standard m sound. with h (mh), becomes 'v' or 'w'.":
    "Son M normal. Avec H (mh), il devient proche de « v » ou de « w ».",
  "broad n is standard. slender n is lighter, almost like 'ny'.":
    "Le N large est standard. Le N fin est plus leger, presque comme « ny ».",
  "the fada lengthens o to a long 'oh' sound.":
    "Le fada allonge O vers un son long « oh ».",
  "standard p. with h (ph), becomes 'f' sound.":
    "P standard. Avec H (ph), il devient un son « f ».",
  "can be rolled or tapped. slender r is lighter.":
    "Peut etre roule ou battu. Le R fin est plus leger.",
  "broad s is like english s. slender s (before e, i) sounds like 'sh'!":
    "Le S large ressemble au S anglais. Le S fin (devant e, i) sonne comme « sh ».",
  "like 's' in 'sun', or 'sh' when slender":
    "Comme le « s » de « sun », ou « sh » dans la forme fine.",
  "broad t is standard. slender t (before e, i) has a 'ch' quality.":
    "Le T large est standard. Le T fin (devant e, i) prend une qualite proche de « ch ».",
  "like 't' in 'top', or 'ch' when slender":
    "Comme le « t » de « top », ou « ch » dans la forme fine.",
  "the fada lengthens u to a long 'oo' sound.":
    "Le fada allonge U vers un son long « oo ».",
};

const FRENCH_NAME_PATTERNS = [
  [/^(.+)\s+fada$/i, (base) => `${base.toUpperCase()} avec fada`],
  [/^(.+)\s+met trema$/i, (base) => `${base.toUpperCase()} avec trema`],
  [/^(.+)\s+tréma$/i, (base) => `${base.toUpperCase()} avec trema`],
  [/^(.+)\s+accent aigu$/i, (base) => `${base.toUpperCase()} avec accent aigu`],
  [/^(.+)\s+accent grave$/i, (base) => `${base.toUpperCase()} avec accent grave`],
  [/^(.+)\s+accent circonflexe$/i, (base) => `${base.toUpperCase()} avec accent circonflexe`],
  [/^(.+)\s+ogonek$/i, (base) => `${base.toUpperCase()} avec ogonek`],
  [/^(.+)-umlaut$/i, (base) => `${base.toUpperCase()} avec umlaut`],
];

const FRENCH_SOURCE_LEAK_PATTERN =
  /\b(?:like|sound|sounds|used|literally|slender|broad|surrounding|consonants?|greeting|response|common|changes?|lengthens?|vowel|vowels|toast|modifies?|english|spanish|dutch|german|italian|japanese|irish|lenition|hard|soft|before|after|when|longer|shorter|health)\b/i;

const finalizeFrenchInstruction = (translationResult, source) => {
  const candidate = String(
    typeof translationResult === "string"
      ? translationResult
      : translationResult?.text || "",
  ).trim();
  const confidence =
    typeof translationResult === "string"
      ? "derived"
      : translationResult?.confidence || "derived";
  if (!candidate) return "";
  if (normalizeKey(candidate) === normalizeKey(source)) return "";
  if (confidence === "exact" || confidence === "pattern") return candidate;
  if (FRENCH_SOURCE_LEAK_PATTERN.test(candidate)) return "";
  return candidate;
};

const translatePatternInstructionToFrench = (text) => {
  let match = text.match(/^Like '([^']+)' in '([^']+)'$/i);
  if (match) {
    return `Comme le « ${match[1]} » de « ${match[2]} ».`;
  }

  match = text.match(/^Like '([^']+)' in '([^']+)' \((unaspirated)\)$/i);
  if (match) {
    return `Comme le « ${match[1]} » de « ${match[2]} », sans aspiration.`;
  }

  match = text.match(/^Like '([^']+)' in '([^']+)'; at end of word sounds like '([^']+)'$/i);
  if (match) {
    return `Comme le « ${match[1]} » de « ${match[2]} », mais en fin de mot cela se rapproche de « ${match[3]} ».`;
  }

  match = text.match(/^Like '([^']+)' in '([^']+)' before a\/o\/u; like '([^']+)' before e\/i$/i);
  if (match) {
    return `Comme « ${match[1]} » dans « ${match[2]} » devant a/o/u, et comme « ${match[3]} » devant e/i.`;
  }

  match = text.match(/^Like '([^']+)' in '([^']+)' or '([^']+)' when slender$/i);
  if (match) {
    return `Comme le « ${match[1]} » de « ${match[2]} », ou comme « ${match[3]} » dans sa forme fine.`;
  }

  match = text.match(/^Like '([^']+)' in '([^']+)' - same as Spanish Ñ$/i);
  if (match) {
    return `Comme le « ${match[1]} » de « ${match[2]} », soit le meme son que le Ñ espagnol.`;
  }

  match = text.match(/^Like '([^']+)' - always with U$/i);
  if (match) {
    return `Comme « ${match[1]} », toujours avec U.`;
  }

  match = text.match(/^Short: like '([^']+)' in '([^']+)'; Long \(([^)]+)\): like '([^']+)' in '([^']+)'$/i);
  if (match) {
    return `Voyelle courte : comme « ${match[1]} » dans « ${match[2]} » ; voyelle longue (${match[3]}) : comme « ${match[4]} » dans « ${match[5]} ».`;
  }

  match = text.match(/^Short '([^']+)' like in '([^']+)'$/i);
  if (match) {
    return `Son court « ${match[1]} » comme dans « ${match[2]} ».`;
  }

  match = text.match(/^Long '([^']+)' sound like in '([^']+)'$/i);
  if (match) {
    return `Son long « ${match[1]} » comme dans « ${match[2]} ».`;
  }

  match = text.match(/^'([^']+)' - God be with you$/i);
  if (match) {
    return `« ${match[1]} » - Que Dieu soit avec toi.`;
  }

  match = text.match(/^'([^']+)' - Health!$/i);
  if (match) {
    return `« ${match[1]} » - Sante !`;
  }

  match = text.match(/^Upper teeth touch lower lip\. Different from B!$/i);
  if (match) {
    return "Les dents du haut touchent la levre inferieure. A ne pas confondre avec B !";
  }

  return "";
};

const translateKnownInstruction = (text) => {
  const source = String(text || "").trim();
  if (!source) return { text: "", confidence: "empty" };

  const exact = EXACT_INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (exact) return { text: exact, confidence: "exact" };

  const patternTranslation = translatePatternInstructionToFrench(source);
  if (patternTranslation) return { text: patternTranslation, confidence: "pattern" };

  const tokenExact = INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (tokenExact) {
    return {
      text: applySourceCase(source, tokenExact),
      confidence: "exact",
    };
  }

  let translated = source;
  for (const [english, french] of Object.entries(INSTRUCTION_TRANSLATIONS)) {
    const pattern = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    translated = translated.replace(pattern, (match) => applySourceCase(match, french));
  }

  return { text: translated, confidence: "derived" };
};

export const translateAlphabetInstructionToFrench = (text) =>
  finalizeFrenchInstruction(translateKnownInstruction(text), text);

export const translateAlphabetMeaningToFrench = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    const normalized = normalizeKey(meaning);
    if (EXACT_MEANING_TRANSLATIONS[normalized]) {
      return applySourceCase(meaning, EXACT_MEANING_TRANSLATIONS[normalized]);
    }
    const translated = translateFlashcardConceptToFrench(meaning);
    return translated && normalizeKey(translated) !== normalized ? translated : "";
  }

  const source = meaning.en || meaning.es || meaning.it || "";
  if (meaning.fr) return meaning.fr;
  const normalized = normalizeKey(source);
  if (EXACT_MEANING_TRANSLATIONS[normalized]) {
    return applySourceCase(source, EXACT_MEANING_TRANSLATIONS[normalized]);
  }
  const translated = translateFlashcardConceptToFrench(source);
  return translated && normalizeKey(translated) !== normalized ? translated : "";
};

export const translateAlphabetNameToFrench = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) return "";

  if (letter?.type === "phrase") {
    const phraseMeaning = translateAlphabetMeaningToFrench(letter.practiceWordMeaning);
    if (phraseMeaning) return phraseMeaning;
  }

  const normalized = normalizeKey(source);
  if (EXACT_MEANING_TRANSLATIONS[normalized]) {
    return applySourceCase(source, EXACT_MEANING_TRANSLATIONS[normalized]);
  }

  const directMeaning = translateAlphabetMeaningToFrench(source);
  if (directMeaning) return directMeaning;

  for (const [pattern, formatter] of FRENCH_NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) return formatter(match[1]);
  }

  return "";
};

const addFrenchAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.sound || letter.soundEs || "";
  const sourceTip = letter.tip || letter.tipEs || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    nameFr: letter.nameFr || translateAlphabetNameToFrench(letter.name, letter),
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
