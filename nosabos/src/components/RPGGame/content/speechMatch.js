// Local say-aloud grading: transcript vs a known target phrase, no LLM.
// Latin scripts get diacritic-insensitive similarity; CJK/Indic/Arabic use a
// containment matcher as the v1 (plan § "Speech & listening", open question 1).

import { getCefrProfile } from "../episodes/profile";

const LATIN_LANGS = new Set(["es", "en", "pt", "it", "fr", "de", "nl"]);
const CHAR_SPLIT_LANGS = new Set(["ja", "zh"]);

function stripDiacritics(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeText(text, lang) {
  let t = String(text || "").toLowerCase().trim();
  if (LATIN_LANGS.has(lang)) t = stripDiacritics(t);
  // Strip punctuation across scripts, keep letters/numbers/spaces.
  t = t.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return t;
}

function tokenize(text, lang) {
  if (CHAR_SPLIT_LANGS.has(lang)) {
    return normalizeText(text, lang).replace(/\s+/g, "").split("");
  }
  return normalizeText(text, lang).split(" ").filter(Boolean);
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[n];
}

function charSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 0;
  return 1 - levenshtein(a, b) / maxLen;
}

function tokenOverlap(targetTokens, heardTokens) {
  if (!targetTokens.length) return 0;
  const heardSet = new Map();
  heardTokens.forEach((tok) => heardSet.set(tok, (heardSet.get(tok) || 0) + 1));
  let hits = 0;
  targetTokens.forEach((tok) => {
    const available = heardSet.get(tok) || 0;
    if (available > 0) {
      hits += 1;
      heardSet.set(tok, available - 1);
    }
  });
  return hits / targetTokens.length;
}

/**
 * Grade a spoken transcript against a target phrase.
 * Returns { score: 0..1, pass: boolean }.
 */
export function matchSpokenTarget({ transcript, target, lang = "es", level = "A1" }) {
  const profile = getCefrProfile(level);
  const heardNorm = normalizeText(transcript, lang);
  const targetNorm = normalizeText(target, lang);
  if (!heardNorm || !targetNorm) return { score: 0, pass: false };

  const targetTokens = tokenize(target, lang);
  const heardTokens = tokenize(transcript, lang);
  const overlap = tokenOverlap(targetTokens, heardTokens);

  let score = overlap;
  if (LATIN_LANGS.has(lang)) {
    score = Math.max(
      overlap,
      charSimilarity(heardNorm.replace(/\s/g, ""), targetNorm.replace(/\s/g, "")),
    );
  }
  return { score, pass: score >= profile.speechPassSimilarity };
}
