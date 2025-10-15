// src/utils/speechEvaluation.js

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
  yua: new Set(),
  tzo: new Set(),
};

function removeDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeGeneric(str, lang) {
  const s = removeDiacritics(str || "").toLowerCase();
  return s
    .replace(/[^a-zñáéíóúüʼ' -]/gi, " ")
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

const STRICT = {
  default: {
    MIN_SPEECH_SEC: 1.1,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.7,
    MIN_WORD_F1: 0.6,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  es: {
    MIN_SPEECH_SEC: 1.2,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.74,
    MIN_WORD_F1: 0.65,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  en: {
    MIN_SPEECH_SEC: 1.1,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.72,
    MIN_WORD_F1: 0.62,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.04,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  nah: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.5,
    MIN_CHAR_SIM: 0.6,
    MIN_WORD_F1: 0.5,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 3.0],
  },
  yua: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.5,
    MIN_CHAR_SIM: 0.6,
    MIN_WORD_F1: 0.5,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 3.0],
  },
  tzo: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.5,
    MIN_CHAR_SIM: 0.6,
    MIN_WORD_F1: 0.5,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 3.0],
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
};

export function speechReasonTips(reasons = [], { uiLang = "en", targetLabel } = {}) {
  const lang = uiLang === "es" ? "es" : "en";
  const msgs = SPEECH_REASON_MESSAGES[lang];
  const tips = [];
  reasons.forEach((reason) => {
    const msg = msgs[reason];
    if (typeof msg === "function") tips.push(msg(targetLabel || (lang === "es" ? "el idioma objetivo" : "the target language")));
    else if (msg) tips.push(msg);
  });
  if (!tips.length) {
    tips.push(lang === "es" ? "Vuelve a intentarlo hablando con claridad." : "Try again, speaking clearly.");
  }
  return tips;
}
