// src/utils/speechEvaluation.js

import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

const STOPWORDS = {
  es: new Set([
    "de",
    "la",
    "que",
    "el",
    "en",
    "y",
    "a",
    "los",
    "del",
    "se",
    "las",
    "por",
    "un",
    "para",
    "con",
    "no",
    "una",
    "su",
    "al",
    "lo",
    "como",
    "más",
    "pero",
    "sus",
    "le",
    "ya",
    "o",
    "este",
    "sí",
    "porque",
    "esta",
    "entre",
    "cuando",
    "muy",
    "sin",
    "sobre",
    "también",
    "me",
    "hasta",
    "hay",
    "donde",
    "quien",
    "desde",
    "todo",
    "nos",
    "durante",
    "todos",
    "uno",
    "les",
    "ni",
    "contra",
    "otros",
    "ese",
    "eso",
    "ante",
    "ellos",
    "e",
    "esto",
    "mí",
    "antes",
    "algunos",
    "qué",
    "unos",
    "yo",
    "otro",
    "otras",
    "otra",
    "él",
    "tanto",
    "esa",
    "estos",
    "mucho",
    "quienes",
    "nada",
    "muchos",
    "cual",
    "poco",
    "ella",
    "estar",
    "estas",
    "algunas",
    "algo",
  ]),
  en: new Set([
    "the",
    "and",
    "for",
    "that",
    "with",
    "this",
    "from",
    "they",
    "have",
    "your",
    "you",
    "was",
    "are",
    "were",
    "their",
    "what",
    "when",
    "which",
    "there",
    "into",
    "about",
    "them",
    "then",
    "some",
    "would",
    "like",
    "just",
    "over",
    "more",
    "than",
    "been",
    "being",
    "such",
    "each",
    "very",
    "because",
    "these",
    "those",
    "could",
    "should",
    "where",
    "who",
    "while",
    "through",
    "does",
    "did",
    "had",
    "also",
    "every",
    "once",
    "here",
    "there",
    "how",
    "why",
    "its",
    "our",
    "your",
    "his",
    "her",
    "their",
    "that",
    "with",
    "about",
    "from",
    "into",
    "onto",
    "onto",
    "than",
    "can",
    "will",
    "just",
    "much",
    "many",
    "any",
    "all",
    "both",
    "few",
    "most",
    "other",
    "out",
    "up",
    "down",
    "in",
    "on",
    "at",
    "by",
    "of",
    "to",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "that",
    "which",
    "who",
    "whom",
    "this",
    "these",
    "those",
    "at",
    "as",
    "by",
    "from",
    "it",
    "its",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "there",
    "here",
  ]),
  nah: new Set(),
  nl: new Set([
    "de", "het", "een", "van", "en", "in", "is", "op", "te", "dat", "die",
    "voor", "zijn", "met", "aan", "niet", "ook", "als", "maar", "om", "dan",
    "of", "wat", "bij", "er", "nog", "wel", "naar", "kan", "tot", "uit",
    "al", "werd", "zo", "zou", "ze", "hem", "haar", "hun", "dit", "deze",
    "meer", "nu", "waar", "worden", "wij", "zij", "veel", "over", "door",
    "geen", "heb", "heeft", "hebben", "hebben", "ben", "bent", "was", "waren",
    "je", "jij", "u", "uw", "mij", "ons", "onze", "jullie",
  ]),
  pt: new Set([
    "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "com", "não",
    "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas",
    "foi", "ao", "ele", "das", "tem", "à", "seu", "sua", "ou", "ser", "quando",
    "muito", "há", "nos", "já", "está", "eu", "também", "só", "pelo", "pela",
    "até", "isso", "ela", "entre", "era", "depois", "sem", "mesmo", "aos",
    "ter", "seus", "quem", "nas", "me", "esse", "eles", "estão", "você",
    "tinha", "foram", "essa", "num", "nem", "suas", "meu", "às", "minha",
    "têm", "numa", "pelos", "elas", "havia", "seja", "qual", "será", "nós",
    "tenho", "lhe", "deles", "essas", "esses", "pelas", "este", "fosse",
    "dele", "tu", "te", "vocês", "vos", "lhes", "meus", "minhas", "teu",
    "tua", "teus", "tuas", "nosso", "nossa", "nossos", "nossas", "dela",
    "delas", "esta", "estes", "estas", "aquele", "aquela", "aqueles",
    "aquelas", "isto", "aquilo",
  ]),
  fr: new Set([
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en",
    "que", "qui", "à", "au", "aux", "ce", "ces", "cette", "il", "elle",
    "ils", "elles", "on", "nous", "vous", "je", "tu", "son", "sa", "ses",
    "leur", "leurs", "mon", "ma", "mes", "ton", "ta", "tes", "notre", "nos",
    "votre", "vos", "pour", "par", "sur", "dans", "avec", "sans", "sous",
    "entre", "vers", "chez", "mais", "ou", "donc", "or", "ni", "car", "ne",
    "pas", "plus", "moins", "très", "bien", "tout", "tous", "toute", "toutes",
    "autre", "autres", "même", "mêmes", "y", "en", "dont", "où", "quand",
    "comme", "si", "aussi", "encore", "déjà", "toujours", "jamais", "rien",
    "personne", "chaque", "quelque", "quelques", "plusieurs", "beaucoup",
    "peu", "trop", "assez", "avoir", "être", "faire", "dit", "fait", "été",
    "avait", "était", "sont", "ont", "peut", "doit", "faut", "ici", "là",
  ]),
  it: new Set([
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "da", "in",
    "su", "con", "per", "tra", "fra", "a", "al", "allo", "alla", "ai", "agli",
    "alle", "del", "dello", "della", "dei", "degli", "delle", "e", "è", "che",
    "non", "si", "come", "ma", "anche", "più", "perché", "questo", "questa",
    "questi", "queste", "quello", "quella", "quelli", "quelle", "chi", "cui",
    "dove", "quando", "quale", "quali", "quanto", "quanta", "quanti", "quante",
    "io", "tu", "lui", "lei", "noi", "voi", "loro", "mi", "ti", "ci", "vi",
    "lo", "la", "li", "ne", "mio", "mia", "miei", "mie", "tuo", "tua", "tuoi",
    "tue", "suo", "sua", "suoi", "sue", "nostro", "nostra", "nostri", "nostre",
    "vostro", "vostra", "vostri", "vostre", "essere", "avere", "fare", "stato",
    "fatto", "sono", "sei", "siamo", "siete", "ho", "hai", "ha", "abbiamo",
    "avete", "hanno", "tutto", "tutti", "tutta", "tutte", "altro", "altri",
    "altra", "altre", "ogni", "molto", "molta", "molti", "molte", "poco",
    "poca", "pochi", "poche", "tanto", "tanta", "tanti", "tante", "stesso",
    "stessa", "stessi", "stesse", "solo", "sola", "soli", "sole", "già", "ora",
    "ancora", "sempre", "mai", "qui", "qua", "là", "lì", "così", "bene",
  ]),
  hi: new Set([
    "का", "की", "के", "को", "से", "में", "पर", "और", "या", "तो", "भी", "ही",
    "यह", "ये", "वह", "वे", "मैं", "हम", "तुम", "आप", "वो", "जो", "क्या", "क्यों",
    "कब", "कहाँ", "कैसे", "एक", "कुछ", "बहुत", "नहीं", "हाँ", "था", "थी", "थे",
    "है", "हूँ", "हो", "हैं", "कर", "करना", "किया", "गया", "गई", "अगर", "लेकिन",
    "जब", "तक", "लिए", "द्वारा", "अपने", "अपनी", "अपना", "उनका", "उसका", "मेरा",
    "मेरी", "मेरे", "तुम्हारा", "तुम्हारी", "तुम्हारे", "हमारा", "हमारी", "हमारे",
  ]),
  ar: new Set([
    "ال", "و", "في", "من", "على", "إلى", "عن", "مع", "ده", "دي", "هو", "هي",
    "أنا", "إنت", "انت", "احنا", "هم", "كان", "كانت", "يكون", "بتاع", "لسه",
    "مش", "ما", "أو", "او", "كل", "بعض", "أي", "اي", "مين", "فين", "ليه", "إزاي",
    "ازاي", "إمتى", "امتى", "ده", "دي", "دول", "فيه", "فيها", "عشان", "علشان",
  ]),
  zh: new Set([
    "的", "了", "和", "是", "我", "你", "他", "她", "它", "我们", "你们", "他们",
    "在", "有", "不", "也", "就", "都", "很", "这", "那", "一个", "什么", "怎么",
    "为什么", "可以", "要", "会", "说", "做", "去", "来", "给", "对", "跟", "把",
  ]),
};

function removeDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeGeneric(str, lang) {
  const s = removeDiacritics(str || "").toLowerCase();
  return s
    .replace(/[^\p{L}\p{N}ʼ' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeWords(str, lang) {
  return normalizeGeneric(str, lang).split(" ").filter(Boolean);
}

function levenshteinDistance(a, b) {
  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;
  const dp = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[m];
}

function charSimilarity01(a, b, lang) {
  const A = normalizeGeneric(a, lang);
  const B = normalizeGeneric(b, lang);
  const d = levenshteinDistance(A, B);
  const m = Math.max(A.length, B.length) || 1;
  return (m - d) / m;
}

function wordPRF(recWords, tgtWords, lang, { dropStopwords = true } = {}) {
  const sw = STOPWORDS[lang] || STOPWORDS.en;
  const rw = dropStopwords ? recWords.filter((w) => !sw.has(w)) : recWords;
  const tw = dropStopwords ? tgtWords.filter((w) => !sw.has(w)) : tgtWords;
  const rMap = new Map();
  const tMap = new Map();
  for (const w of rw) rMap.set(w, (rMap.get(w) || 0) + 1);
  for (const w of tw) tMap.set(w, (tMap.get(w) || 0) + 1);
  let hit = 0;
  for (const [w, tc] of tMap) hit += Math.min(tc, rMap.get(w) || 0);
  const prec = rw.length ? hit / rw.length : 0;
  const rec = tw.length ? hit / tw.length : 0;
  const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
  return { prec, rec, f1 };
}

function languageLikelihood(recWords, lang) {
  if (!recWords.length) return 0;
  const sw = STOPWORDS[lang] || STOPWORDS.en;
  let lettersOK = 0;
  let stopHits = 0;
  for (const w of recWords) {
    if (/^[a-zñáéíóúü]+$/i.test(w)) lettersOK++;
    if (sw.has(w)) stopHits++;
  }
  const letterRatio = lettersOK / recWords.length;
  const stopRatio = stopHits / Math.max(2, recWords.length);
  return 0.8 * letterRatio + 0.2 * stopRatio;
}

// Thresholds tuned for learners (not native speakers) - more tolerant of
// imperfect pronunciation, accents, and speech patterns
const STRICT = {
  default: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.55,
    MIN_WORD_F1: 0.45,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  es: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.58,
    MIN_WORD_F1: 0.48,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  en: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.56,
    MIN_WORD_F1: 0.46,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.04,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  pt: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.56,
    MIN_WORD_F1: 0.46,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  fr: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.55,
    MIN_WORD_F1: 0.45,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  it: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.56,
    MIN_WORD_F1: 0.46,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
  nah: {
    MIN_SPEECH_SEC: 0.9,
    MIN_RMS: 0.005,
    MIN_ZCR_PSEC: 350,
    MAX_ZCR_PSEC: 10000,
    MIN_CONFIDENCE: 0.4,
    MIN_CHAR_SIM: 0.5,
    MIN_WORD_F1: 0.4,
    MIN_LANG_LIKE: 0.35,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.35, 3.5],
  },
  nl: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.006,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.45,
    MIN_CHAR_SIM: 0.56,
    MIN_WORD_F1: 0.46,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.4, 3.2],
  },
};

function passesSpeechQuality({ duration, rms, zeroCrossings }, targetLenChars, cfg) {
  if (!Number.isFinite(duration) || duration < cfg.MIN_SPEECH_SEC) return false;
  if (!Number.isFinite(rms) || rms < cfg.MIN_RMS) return false;
  const zps = zeroCrossings && duration ? zeroCrossings / duration : 0;
  if (zps < cfg.MIN_ZCR_PSEC || zps > cfg.MAX_ZCR_PSEC) return false;
  const expected = Math.max(cfg.MIN_SPEECH_SEC, targetLenChars * cfg.DURATION_PER_CHAR_SEC);
  const ratio = duration / expected;
  return ratio >= cfg.DURATION_TOLERANCE[0] && ratio <= cfg.DURATION_TOLERANCE[1];
}

export function evaluateAttemptStrict({
  recognizedText = "",
  confidence = 0,
  audioMetrics,
  targetSentence = "",
  lang = "es",
}) {
  const cfg = STRICT[lang] || STRICT.default;
  const reasons = [];
  const recWords = tokenizeWords(recognizedText, lang);
  const tgtWords = tokenizeWords(targetSentence, lang);

  if (audioMetrics) {
    if (!passesSpeechQuality(audioMetrics, (targetSentence || "").length, cfg))
      reasons.push("speech-quality");
  }
  const langLike = languageLikelihood(recWords, lang);
  if (langLike < cfg.MIN_LANG_LIKE) reasons.push("not-target-lang");

  const charSim = charSimilarity01(recognizedText, targetSentence, lang);
  const { f1 } = wordPRF(recWords, tgtWords, lang, { dropStopwords: true });
  if (charSim < cfg.MIN_CHAR_SIM) reasons.push("low-char-sim");
  if (f1 < cfg.MIN_WORD_F1) reasons.push("low-word-f1");
  if (confidence && confidence < cfg.MIN_CONFIDENCE) reasons.push("low-confidence");

  const pass = reasons.length === 0;
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        charSim * 60 +
          f1 * 35 +
          langLike * 20 +
          Math.max(confidence || 0.55, 0.55) * 15
      )
    )
  );
  return { pass, score, reasons, charSim, f1, langLike, confidence };
}

export async function computeAudioMetricsFromBlob(blob) {
  if (!blob) throw new Error("no-blob");
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error("audio-context-unavailable");
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new AC();
  try {
    const audio = await ctx.decodeAudioData(arrayBuf);
    const channelData = audio.getChannelData(0);
    const duration = audio.duration;
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) sum += channelData[i] * channelData[i];
    const rms = Math.sqrt(sum / channelData.length);
    let zeroCrossings = 0;
    for (let i = 1; i < channelData.length; i++)
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) zeroCrossings++;
    return { duration, rms, zeroCrossings };
  } finally {
    try {
      await ctx.close();
    } catch {}
  }
}

const SPEECH_REASON_MESSAGES = {
  en: {
    "speech-quality": "Speak a bit louder and keep a steady pace.",
    "not-target-lang": (targetLabel) => `Try speaking in ${targetLabel}.`,
    "low-char-sim": "Match the wording more closely.",
    "low-word-f1": "Include the key content words.",
    "low-confidence": "Speak clearly and reduce background noise.",
  },
  es: {
    "speech-quality": "Habla un poco más fuerte y mantén un ritmo constante.",
    "not-target-lang": (targetLabel) => `Intenta hablar en ${targetLabel}.`,
    "low-char-sim": "Acércate más al texto original.",
    "low-word-f1": "Incluye las palabras clave del contenido.",
    "low-confidence": "Pronuncia con claridad y reduce el ruido de fondo.",
  },
  pt: {
    "speech-quality": "Fale um pouco mais alto e mantenha um ritmo constante.",
    "not-target-lang": (targetLabel) => `Tente falar em ${targetLabel}.`,
    "low-char-sim": "Aproxime-se mais do texto original.",
    "low-word-f1": "Inclua as palavras-chave do conteudo.",
    "low-confidence": "Pronuncie com clareza e reduza o ruido de fundo.",
  },
  it: {
    "speech-quality": "Parla un po' più forte e mantieni un ritmo regolare.",
    "not-target-lang": (targetLabel) => `Prova a parlare in ${targetLabel}.`,
    "low-char-sim": "Avvicinati di più al testo originale.",
    "low-word-f1": "Includi le parole chiave del contenuto.",
    "low-confidence": "Pronuncia con chiarezza e riduci il rumore di fondo.",
  },
  hi: {
    "speech-quality": "थोड़ा ज़ोर से और स्थिर गति में बोलिए।",
    "not-target-lang": (targetLabel) => `${targetLabel} में बोलने की कोशिश कीजिए।`,
    "low-char-sim": "मूल वाक्य के शब्दों के और करीब बोलिए।",
    "low-word-f1": "मुख्य अर्थ वाले शब्द ज़रूर शामिल कीजिए।",
    "low-confidence": "स्पष्ट बोलिए और आसपास का शोर कम कीजिए।",
  },
  ar: {
    "speech-quality": "اتكلم بصوت أوضح وحافظ على سرعة ثابتة.",
    "not-target-lang": (targetLabel) => `حاول تتكلم بـ ${targetLabel}.`,
    "low-char-sim": "قرّب كلامك أكتر من الجملة الأصلية.",
    "low-word-f1": "حاول تدخل الكلمات الأساسية في المحتوى.",
    "low-confidence": "انطق بوضوح وقلل الضوضاء حواليك.",
  },
  fr: {
    "speech-quality": "Parle un peu plus fort et garde un rythme regulier.",
    "not-target-lang": (targetLabel) => `Essaie de parler en ${targetLabel}.`,
    "low-char-sim": "Rapproche-toi davantage du texte original.",
    "low-word-f1": "Inclue les mots cles du contenu.",
    "low-confidence": "Prononce clairement et reduis le bruit de fond.",
  },
  ja: {
    "speech-quality": "もう少し大きな声で、一定のペースで話してみましょう。",
    "not-target-lang": (targetLabel) => `${targetLabel}で話してみましょう。`,
    "low-char-sim": "元の文にもっと近づけてみましょう。",
    "low-word-f1": "重要な内容語を入れてみましょう。",
    "low-confidence": "はっきり発音し、周囲の雑音を減らしましょう。",
  },
  zh: {
    "speech-quality": "请声音更清楚一些，并保持稳定语速。",
    "not-target-lang": (targetLabel) => `请尝试用${targetLabel}说。`,
    "low-char-sim": "请更接近原句内容。",
    "low-word-f1": "请包含关键词。",
    "low-confidence": "请清楚发音，并减少背景噪音。",
  },
};

export function speechReasonTips(reasons = [], { uiLang = "en", targetLabel } = {}) {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const msgs = SPEECH_REASON_MESSAGES[lang];
  const tips = [];
  reasons.forEach((reason) => {
    const msg = msgs[reason];
    if (typeof msg === "function")
      tips.push(
        msg(
          targetLabel ||
            (lang === "es"
              ? "el idioma objetivo"
              : lang === "pt"
                ? "o idioma alvo"
              : lang === "it"
                ? "la lingua obiettivo"
                : lang === "hi"
                  ? "लक्ष्य भाषा"
                : lang === "zh"
                  ? "目标语言"
                : lang === "fr"
                  ? "la langue cible"
                  : lang === "ja"
                    ? "目標言語"
                    : lang === "ar"
                      ? "اللغة الهدف"
                      : "the target language"),
        ),
      );
    else if (msg) tips.push(msg);
  });
  if (!tips.length) {
    tips.push(
      lang === "es"
        ? "Vuelve a intentarlo hablando con claridad."
        : lang === "pt"
          ? "Tente novamente falando com clareza."
        : lang === "it"
          ? "Riprova parlando chiaramente."
          : lang === "hi"
            ? "स्पष्ट बोलते हुए फिर से कोशिश कीजिए।"
          : lang === "zh"
            ? "请清楚地说，然后再试一次。"
          : lang === "fr"
            ? "Reessaie en parlant clairement."
          : lang === "ja"
              ? "はっきり話して、もう一度試してみましょう。"
              : lang === "ar"
                ? "حاول مرة تانية واتكلم بوضوح."
                : "Try again, speaking clearly.",
    );
  }
  return tips;
}
