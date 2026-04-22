import {
  PORTUGUESE_ALPHABET_INSTRUCTION_MAP,
  PORTUGUESE_ALPHABET_MEANING_MAP,
} from "./alphabetPortugueseSupportMap.js";
import { translateFlashcardConceptToPortuguese } from "./flashcards/portugueseLocalizer.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-ES");

const compactWhitespace = (value) =>
  String(value || "")
    .replace(/[¿¡]/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();

const capitalizeFirst = (value, locale = "pt-BR") => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
};

const applySourceCase = (source, translation) => {
  if (!source || !translation) return translation;
  const trimmed = String(source).trim();
  const first = trimmed.charAt(0);
  if (
    first &&
    first === first.toLocaleUpperCase("en-US") &&
    /[A-ZÀ-ÖØ-Þ]/u.test(first)
  ) {
    return capitalizeFirst(translation);
  }
  return translation;
};

const applyTokenCase = (token, translation) => {
  if (!token || !translation) return translation;
  if (token === token.toLocaleUpperCase("es-ES")) {
    return translation.toLocaleUpperCase("pt-BR");
  }
  if (
    token.charAt(0) === token.charAt(0).toLocaleUpperCase("es-ES") &&
    /[A-ZÀ-ÖØ-Þ]/u.test(token.charAt(0))
  ) {
    return capitalizeFirst(translation);
  }
  return translation;
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const OBVIOUS_SPANISH_LEAK_PATTERN = new RegExp(
  `(?:^|[^\\p{L}\\p{M}])(?:${[
    "sonido",
    "sonidos",
    "suena",
    "suenan",
    "dientes",
    "lengua",
    "labios",
    "español",
    "española",
    "alemán",
    "alemana",
    "francés",
    "holandés",
    "después",
    "pregunta",
    "exclamación",
    "mantenla",
    "mantenlo",
    "compárala",
    "a menudo",
  ]
    .map(escapeRegex)
    .join("|")})(?=$|[^\\p{L}\\p{M}])`,
  "iu",
);

const LIKELY_PORTUGUESE_PATTERN =
  /[ãõâêôç]|\b(?:você|vocês|língua|lábios|som|sons|não|há|inglês|espanhol|alemão|português|vogais|consoantes|palavra|palavras|depois|também|arredondad|fechad|abert|surd|comece|mantenha)\b/iu;

const needsPortugueseRepair = (value) => {
  const text = compactWhitespace(value);
  return !text || OBVIOUS_SPANISH_LEAK_PATTERN.test(text);
};

const ALPHABET_NAME_EXACT = {
  [normalizeKey("Lange IJ")]: "IJ longo",
  [normalizeKey("Griekse ij")]: "ij grego",
  [normalizeKey("E met trema")]: "E com trema",
  [normalizeKey("I met trema")]: "I com trema",
  [normalizeKey("Cé cédille")]: "C com cedilha",
  [normalizeKey("E accent aigu")]: "E com acento agudo",
  [normalizeKey("E accent grave")]: "E com acento grave",
  [normalizeKey("E accent circonflexe")]: "E com acento circunflexo",
  [normalizeKey("E tréma")]: "E com trema",
  [normalizeKey("I accent circonflexe")]: "I com acento circunflexo",
  [normalizeKey("I tréma")]: "I com trema",
  [normalizeKey("O accent circonflexe")]: "O com acento circunflexo",
  [normalizeKey("U accent grave")]: "U com acento grave",
  [normalizeKey("U accent circonflexe")]: "U com acento circunflexo",
  [normalizeKey("U tréma")]: "U com trema",
  [normalizeKey("A accent grave")]: "A com acento grave",
  [normalizeKey("A accent circonflexe")]: "A com acento circunflexo",
  [normalizeKey("Nasal AN/EN")]: "nasal AN/EN",
  [normalizeKey("Nasal ON")]: "nasal ON",
  [normalizeKey("Nasal IN")]: "nasal IN",
  [normalizeKey("Nasal UN")]: "nasal UN",
  [normalizeKey("Silent Letters")]: "Letras silenciosas",
  [normalizeKey("Word Stress")]: "Acento da palavra",
  [normalizeKey("TH (voiced)")]: "TH (sonoro)",
  [normalizeKey("TH (unvoiced)")]: "TH (surdo)",
  [normalizeKey("R (American)")]: "R (americano)",
  [normalizeKey("Short I")]: "I curto",
  [normalizeKey("Long E")]: "E longo",
  [normalizeKey("Schwa")]: "Schwa",
  [normalizeKey("Short A")]: "A curto",
  [normalizeKey("Ah sound")]: "Som de ah",
  [normalizeKey("AW sound")]: "Som de aw",
  [normalizeKey("Short U")]: "U curto",
  [normalizeKey("Short OO")]: "OO curto",
  [normalizeKey("Long OO")]: "OO longo",
  [normalizeKey("AY diphthong")]: "Ditongo AY",
  [normalizeKey("Long I")]: "I longo",
  [normalizeKey("OW diphthong")]: "Ditongo OW",
  [normalizeKey("Long O")]: "O longo",
  [normalizeKey("OY diphthong")]: "Ditongo OY",
  [normalizeKey("J / soft G")]: "J / G suave",
  [normalizeKey("Dark L")]: "L escuro",
  [normalizeKey("Clear L")]: "L claro",
  [normalizeKey("Flap T")]: "T vibrado",
};

const INSTRUCTION_EXACT = {
  [normalizeKey("Como 'ñ' en 'niño'")]: "Como 'nh' em 'ninho'",
  [normalizeKey("¡Exactamente como Ñ española! 'Amanhã' = 'amañá'.")]:
    "Exatamente como o NH do português. 'Amanhã' mantém o som nasal.",
  [normalizeKey("Mismas reglas que español. Usa Ç para sonido 's' antes de a/o/u.")]:
    "Mesmas regras do espanhol. Use Ç para o som de 's' antes de a/o/u.",
  [normalizeKey("El alemán tiene vocales cortas y largas. ¡La longitud cambia el significado!")]:
    "O alemão tem vogais curtas e longas. O comprimento muda o significado!",
  [normalizeKey("Sola, C es rara en alemán. Usualmente parte de CH, CK, o en palabras extranjeras.")]:
    "Sozinha, C é rara no alemão. Geralmente aparece em CH, CK ou em palavras estrangeiras.",
  [normalizeKey("H después de vocal = vocal larga. 'Sohn' - H hace O larga.")]:
    "H depois de vogal = vogal longa. Em 'Sohn', o H deixa o O longo.",
  [normalizeKey("Hiragana (あ) y Katakana (ア) comparten el mismo sonido.")]:
    "Hiragana (あ) e Katakana (ア) compartilham o mesmo som.",
  [normalizeKey("Labios relajados; a veces se susurra entre consonantes.")]:
    "Lábios relaxados; às vezes ela é sussurrada entre consoantes.",
  [normalizeKey("Vocal media limpia; sin desliz de 'y'.")]:
    "Vogal média limpa, sem deslizamento de 'y'.",
  [normalizeKey("Redondeada pero corta; evita convertirla en 'ou'.")]:
    "Arredondada, mas curta; evite transformá-la em 'ou'.",
  [normalizeKey("La A francesa está entre 'cat' y 'father' inglés. Mantenla pura.")]:
    "O A francês fica entre 'cat' e 'father' inglês. Mantenha o som puro.",
  [normalizeKey("Hace que C suene como 's' antes de a, o, u: 'français'.")]:
    "Faz o C soar como 's' antes de a, o, u: 'français'.",
};

const LETTER_NAME_PATTERNS = [
  [/^([A-ZÀ-ÖØ-Þ]) with acute$/iu, (letter) => `${letter} com acento agudo`],
  [/^([A-ZÀ-ÖØ-Þ]) with grave$/iu, (letter) => `${letter} com acento grave`],
  [/^([A-ZÀ-ÖØ-Þ]) with circumflex$/iu, (letter) => `${letter} com acento circunflexo`],
  [/^([A-ZÀ-ÖØ-Þ]) with tilde$/iu, (letter) => `${letter} com til`],
  [/^([A-ZÀ-ÖØ-Þ]) with diaeresis$/iu, (letter) => `${letter} com trema`],
  [/^([A-ZÀ-ÖØ-Þ]) with cedilla$/iu, (letter) => `${letter} com cedilha`],
  [/^([A-ZÀ-ÖØ-Þ]) accent aigu$/iu, (letter) => `${letter} com acento agudo`],
  [/^([A-ZÀ-ÖØ-Þ]) accent grave$/iu, (letter) => `${letter} com acento grave`],
  [/^([A-ZÀ-ÖØ-Þ]) accent circonflexe$/iu, (letter) => `${letter} com acento circunflexo`],
  [/^([A-ZÀ-ÖØ-Þ]) tr[eé]ma$/iu, (letter) => `${letter} com trema`],
];

const SPANISH_INSTRUCTION_SUBSTRING_REPLACEMENTS = [
  [/\ba diferencia del inglés\b/giu, "ao contrário do inglês"],
  [/\ba diferencia del español\b/giu, "ao contrário do espanhol"],
  [/\ba menudo\b/giu, "muitas vezes"],
  [/\ba veces\b/giu, "às vezes"],
  [/\bal final de la palabra\b/giu, "no final da palavra"],
  [/\bal final de palabra\b/giu, "no final da palavra"],
  [/\bal final de sílaba\b/giu, "no final da sílaba"],
  [/\bal final\b/giu, "no final"],
  [/\bal inicio de palabras\b/giu, "no início das palavras"],
  [/\bal inicio de sílabas\b/giu, "no início das sílabas"],
  [/\bal inicio\b/giu, "no início"],
  [/\bantes de\b/giu, "antes de"],
  [/\bdespués de\b/giu, "depois de"],
  [/\bdel inglés\b/giu, "do inglês"],
  [/\bdel español\b/giu, "do espanhol"],
  [/\bdel portugués\b/giu, "do português"],
  [/\ben inglés\b/giu, "em inglês"],
  [/\ben español\b/giu, "em espanhol"],
  [/\ben portugués\b/giu, "em português"],
  [/\ben francés\b/giu, "em francês"],
  [/\ben alemán\b/giu, "em alemão"],
  [/\ben Brasil\b/giu, "no Brasil"],
  [/\ben España\b/giu, "na Espanha"],
  [/\ben Portugal\b/giu, "em Portugal"],
  [/\ben Argentina\b/giu, "na Argentina"],
  [/\ben Latinoamérica\b/giu, "na América Latina"],
  [/\bigual que\b/giu, "igual a"],
  [/\bmismas reglas que\b/giu, "mesmas regras que"],
  [/\bsin mucho aire\b/giu, "sem muito ar"],
  [/\bsin aspiración\b/giu, "sem aspiração"],
  [/\bcon aspiración\b/giu, "com aspiração"],
  [/\bsin redondear mucho\b/giu, "sem arredondar muito"],
  [/\bcon acento\b/giu, "com acento"],
  [/\bsin acento\b/giu, "sem acento"],
  [/\bpor nariz y boca\b/giu, "pelo nariz e pela boca"],
  [/\bpor nariz\b/giu, "pelo nariz"],
  [/\bse pronuncia\b/giu, "pronuncia-se"],
  [/\bse pronuncian\b/giu, "pronunciam-se"],
  [/\bse reduce\b/giu, "se reduz"],
  [/\bse convierte\b/giu, "vira"],
  [/\bse vuelve\b/giu, "fica"],
  [/\bsolo se usa\b/giu, "só é usada"],
  [/\bsolo aparece\b/giu, "só aparece"],
  [/\bno existe\b/giu, "não existe"],
  [/\bno hay\b/giu, "não há"],
];

const SPANISH_INSTRUCTION_TOKEN_TRANSLATIONS = {
  "abierta": "aberta",
  "abiertas": "abertas",
  "abierto": "aberto",
  "abiertos": "abertos",
  "acento": "acento",
  "ahora": "agora",
  "aire": "ar",
  "al": "ao",
  "alemán": "alemão",
  "alemana": "alemã",
  "algunas": "algumas",
  "algunos": "alguns",
  "allá": "lá",
  "allí": "ali",
  "ancha": "larga",
  "ancho": "largo",
  "aspiración": "aspiração",
  "aún": "ainda",
  "aunque": "embora",
  "barco": "barco",
  "bebé": "bebê",
  "bien": "bem",
  "boca": "boca",
  "bosque": "floresta",
  "brasil": "Brasil",
  "cambia": "muda",
  "cambian": "mudam",
  "cerrada": "fechada",
  "cerradas": "fechadas",
  "cerrado": "fechado",
  "cerrados": "fechados",
  "chico": "menino",
  "clásica": "clássica",
  "clásico": "clássico",
  "clara": "clara",
  "claro": "claro",
  "compárala": "compare-a",
  "compárala": "compare-a",
  "comparten": "compartilham",
  "común": "comum",
  "comunes": "comuns",
  "compleja": "complexa",
  "con": "com",
  "consonante": "consoante",
  "consonantes": "consoantes",
  "corta": "curta",
  "cortas": "curtas",
  "corto": "curto",
  "cortos": "curtos",
  "cresta": "crista",
  "cuando": "quando",
  "cuenta": "conta",
  "curva": "curve",
  "de": "de",
  "del": "do",
  "después": "depois",
  "detrás": "atrás",
  "día": "dia",
  "di": "diga",
  "dientes": "dentes",
  "diferencia": "diferença",
  "diferente": "diferente",
  "diferentes": "diferentes",
  "earth": "terra",
  "cerezo": "cerejeira",
  "ejemplo": "exemplo",
  "el": "o",
  "ella": "ela",
  "ellos": "eles",
  "en": "em",
  "entonces": "então",
  "entre": "entre",
  "es": "é",
  "escucha": "escute",
  "español": "espanhol",
  "española": "espanhola",
  "esta": "esta",
  "está": "está",
  "exactamente": "exatamente",
  "exclamación": "exclamação",
  "extranjera": "estrangeira",
  "extranjeras": "estrangeiras",
  "extranjero": "estrangeiro",
  "extranjeros": "estrangeiros",
  "fácil": "fácil",
  "francés": "francês",
  "fricción": "fricção",
  "garganta": "garganta",
  "golpe": "golpe",
  "gordo": "grosso",
  "griego": "grego",
  "griega": "grega",
  "habla": "fala",
  "hace": "faz",
  "hazla": "faça-a",
  "hay": "há",
  "holandés": "holandês",
  "igual": "igual",
  "inglés": "inglês",
  "inicio": "início",
  "isla": "ilha",
  "japonés": "japonês",
  "jamón": "presunto",
  "labio": "lábio",
  "labios": "lábios",
  "larga": "longa",
  "largas": "longas",
  "largo": "longo",
  "largos": "longos",
  "las": "as",
  "latinoamérica": "América Latina",
  "la": "a",
  "lee": "lê",
  "lengua": "língua",
  "ligera": "leve",
  "ligeramente": "levemente",
  "ligero": "leve",
  "ligeros": "leves",
  "ligeras": "leves",
  "limpia": "limpa",
  "longitud": "comprimento",
  "lo": "o",
  "luna": "lua",
  "mamá": "mamãe",
  "mantenla": "mantenha-a",
  "mantenlo": "mantenha-o",
  "mantén": "mantenha",
  "más": "mais",
  "mayoría": "maioria",
  "mismo": "mesmo",
  "misma": "mesma",
  "mismos": "mesmos",
  "mismas": "mesmas",
  "mujer": "mulher",
  "mucha": "muita",
  "muchas": "muitas",
  "mucho": "muito",
  "muy": "muito",
  "nariz": "nariz",
  "niño": "menino",
  "noche": "noite",
  "no": "não",
  "nunca": "nunca",
  "o": "o",
  "omiten": "omitem",
  "oro": "ouro",
  "oscura": "escura",
  "oscuro": "escuro",
  "otra": "outra",
  "otro": "outro",
  "papá": "papai",
  "paraguas": "guarda-chuva",
  "palabra": "palavra",
  "palabras": "palavras",
  "paladar": "palato",
  "parte": "parte",
  "pausa": "pausa",
  "pequeña": "pequena",
  "pequeñas": "pequenas",
  "pequeño": "pequeno",
  "pequeños": "pequenos",
  "perro": "cachorro",
  "pero": "mas",
  "poca": "pouca",
  "pocas": "poucas",
  "poco": "pouco",
  "pocos": "poucos",
  "pontos": "pontos",
  "portugués": "português",
  "portuguesa": "portuguesa",
  "posterior": "posterior",
  "prestada": "emprestada",
  "prestadas": "emprestadas",
  "pregunta": "pergunta",
  "preguntas": "perguntas",
  "pronuncia": "pronuncia",
  "pronunciada": "pronunciada",
  "pronunciación": "pronúncia",
  "puntos": "pontos",
  "que": "que",
  "rápida": "rápida",
  "rápido": "rápido",
  "recuerda": "lembre-se",
  "redondea": "arredonde",
  "redondeada": "arredondada",
  "redondeadas": "arredondadas",
  "redondeado": "arredondado",
  "redondeados": "arredondados",
  "región": "região",
  "regiones": "regiões",
  "relaja": "relaxe",
  "relajados": "relaxados",
  "retráe": "retraia",
  "río": "Rio",
  "se": "se",
  "según": "dependendo",
  "siempre": "sempre",
  "sí": "sim",
  "sílaba": "sílaba",
  "sílabas": "sílabas",
  "sin": "sem",
  "solo": "só",
  "sólo": "só",
  "sola": "sozinha",
  "son": "são",
  "sonido": "som",
  "sonidos": "sons",
  "sorda": "surda",
  "sordo": "surdo",
  "sonora": "sonora",
  "sonoro": "sonoro",
  "sonríe": "sorria",
  "suave": "suave",
  "suaves": "suaves",
  "sube": "sobe",
  "suelta": "solte",
  "suena": "soa",
  "suene": "soe",
  "suenan": "soam",
  "sonar": "soar",
  "susurra": "sussurre",
  "susurrada": "sussurrada",
  "también": "também",
  "tararea": "cantarole",
  "te": "te",
  "temprano": "cedo",
  "tensa": "tensa",
  "tenso": "tenso",
  "media": "média",
  "termina": "termina",
  "tiene": "tem",
  "tienen": "têm",
  "tierra": "terra",
  "todo": "todo",
  "todos": "todos",
  "toma": "toma",
  "tocan": "tocam",
  "tu": "você",
  "una": "uma",
  "uno": "um",
  "unos": "uns",
  "unas": "umas",
  "usa": "use",
  "usan": "usam",
  "usualmente": "geralmente",
  "usted": "você",
  "veces": "vezes",
  "verano": "verão",
  "ya": "já",
  "yo": "eu",
  "yugoslavo": "iugoslavo",
  "vibración": "vibração",
  "vocal": "vogal",
  "vocales": "vogais",
  "voz": "voz",
  "vuelve": "fica",
  "zorro": "raposa",
};

const translateInstructionTokenToPortuguese = (token) => {
  const suffixMatch = token.match(/'+$/u);
  const suffix = suffixMatch ? suffixMatch[0] : "";
  const core = suffix ? token.slice(0, -suffix.length) : token;
  const normalized = normalizeKey(core);
  const exact = SPANISH_INSTRUCTION_TOKEN_TRANSLATIONS[normalized];
  if (exact) {
    return `${applyTokenCase(core, exact)}${suffix}`;
  }

  if (core.length > 1) {
    const flashcardTranslation = translateFlashcardConceptToPortuguese(
      core,
      core,
    );
    if (flashcardTranslation && flashcardTranslation !== core) {
      return `${applyTokenCase(core, flashcardTranslation)}${suffix}`;
    }
  }

  return `${core
    .replace(/ciones$/iu, "ções")
    .replace(/ción$/iu, "ção")
    .replace(/mente$/iu, "mente")
    .replace(/ñ/giu, "nh")}${suffix}`;
};

const polishPortugueseInstruction = (value, source = value) => {
  let translated = compactWhitespace(value);
  if (!translated) return "";

  SPANISH_INSTRUCTION_SUBSTRING_REPLACEMENTS.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  translated = translated.replace(/\p{L}[\p{L}\p{M}'-]*/gu, (token) =>
    translateInstructionTokenToPortuguese(token),
  );

  translated = translated.replace(
    /(^|[\s(])y(?=[\s)])/giu,
    (_, prefix) => `${prefix}e`,
  );

  translated = compactWhitespace(translated);
  return applySourceCase(source, translated);
};

const normalizePortugueseInstruction = (source) => {
  const text = compactWhitespace(source);
  if (!text) return "";
  const polished = polishPortugueseInstruction(text, source);
  if (polished) {
    return polished;
  }
  return text;
};

const selectPortugueseText = (existingValue, fallbackValue) => {
  const existing = compactWhitespace(existingValue);
  if (existing && !needsPortugueseRepair(existing)) {
    return existing;
  }
  return compactWhitespace(fallbackValue);
};

export const translateAlphabetMeaningToPortuguese = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "object") {
    if (
      typeof meaning.pt === "string" &&
      meaning.pt.trim() &&
      !needsPortugueseRepair(meaning.pt)
    ) {
      return compactWhitespace(meaning.pt);
    }

    const sourceEn = meaning.en || "";
    const sourceEs = meaning.es || "";
    const mappedMeaning =
      PORTUGUESE_ALPHABET_MEANING_MAP[normalizeKey(sourceEs)] ||
      PORTUGUESE_ALPHABET_MEANING_MAP[normalizeKey(sourceEn)] ||
      "";
    const englishTranslation = sourceEn
      ? translateFlashcardConceptToPortuguese(sourceEn, "")
      : "";
    if (englishTranslation && englishTranslation !== sourceEn) {
      return compactWhitespace(englishTranslation);
    }

    const translated = translateFlashcardConceptToPortuguese(
      sourceEn || sourceEs,
      sourceEs || "",
    );

    if (
      translated &&
      (translated !== sourceEn &&
        translated !== sourceEs &&
        compactWhitespace(translated) !== compactWhitespace(sourceEs))
    ) {
      return compactWhitespace(translated);
    }

    if (mappedMeaning || sourceEs || sourceEn) {
      return normalizePortugueseInstruction(
        mappedMeaning || sourceEs || sourceEn,
      );
    }

    return compactWhitespace(translated || sourceEn);
  }

  const source = compactWhitespace(meaning);
  if (!source) return "";

  const mappedMeaning =
    PORTUGUESE_ALPHABET_MEANING_MAP[normalizeKey(source)] || "";
  const translated = translateFlashcardConceptToPortuguese(source, "");
  if (translated && translated !== source) {
    return compactWhitespace(translated);
  }

  return normalizePortugueseInstruction(mappedMeaning || source);
};

export const translateAlphabetInstructionToPortuguese = (
  spanishText,
  fallbackText = "",
) => {
  const source = compactWhitespace(spanishText || fallbackText);
  if (!source) return "";

  const exact =
    INSTRUCTION_EXACT[normalizeKey(source)] ||
    INSTRUCTION_EXACT[normalizeKey(fallbackText)];
  if (exact) return exact;

  const mapped =
    PORTUGUESE_ALPHABET_INSTRUCTION_MAP[normalizeKey(source)] || source;

  return normalizePortugueseInstruction(mapped);
};

export const translateAlphabetNameToPortuguese = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) return "";

  if (letter?.type === "phrase") {
    const phraseMeaning = translateAlphabetMeaningToPortuguese(
      letter.practiceWordMeaning,
    );
    if (phraseMeaning) return phraseMeaning;
  }

  const exact = ALPHABET_NAME_EXACT[normalizeKey(source)];
  if (exact) return exact;

  for (const [pattern, formatter] of LETTER_NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) return formatter(match[1]);
  }

  const directMeaning = translateAlphabetMeaningToPortuguese({
    en: source,
    es: source,
  });
  if (directMeaning && directMeaning !== source) {
    return applySourceCase(source, directMeaning);
  }

  return "";
};

const addPortugueseAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.soundEs || letter.sound || "";
  const sourceTip = letter.tipEs || letter.tip || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    namePt: selectPortugueseText(
      letter.namePt,
      translateAlphabetNameToPortuguese(letter.name, letter),
    ),
    soundPt: selectPortugueseText(
      letter.soundPt,
      translateAlphabetInstructionToPortuguese(sourceSound, letter.sound),
    ),
    tipPt: selectPortugueseText(
      letter.tipPt,
      translateAlphabetInstructionToPortuguese(sourceTip, letter.tip),
    ),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      pt: selectPortugueseText(
        practiceWordMeaning.pt,
        translateAlphabetMeaningToPortuguese(practiceWordMeaning),
      ),
    },
  };
};

export const withPortugueseAlphabetSupport = (letters) =>
  Array.isArray(letters) ? letters.map(addPortugueseAlphabetCopy) : letters;
