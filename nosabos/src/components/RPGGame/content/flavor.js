// Tier-2 contextual flavor: ONE small constrained LLM call that rewrites the
// authored frame lines (never the answers) so the episode references the
// unit's actual topics at the run's CEFR level. Cached forever by
// (lang × level × unit × episode) in Firestore + localStorage; every failure
// path falls back to the tier-1 lines already in the beats.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { callResponses } from "../../../utils/llm";
import { database } from "../../../firebaseResources/firebaseResources";
import { getCefrProfile, normalizeCefrKey } from "../episodes/profile";

const SCHEMA_VERSION = "v1";
const FLAVOR_MODEL = "gpt-5-nano";
const MAX_LINE_LENGTH = 180;

function cacheId({ targetLang, level, unitId, episodeId }) {
  const clean = (value) => String(value || "").replace(/[^\w-]/g, "_").slice(0, 60);
  return `${clean(targetLang)}_${clean(normalizeCefrKey(level))}_${clean(unitId)}_${clean(episodeId)}_${SCHEMA_VERSION}`;
}

function localKey(id) {
  return `rpgFlavor:${id}`;
}

function looksLikeTargetLanguage(text, targetLang) {
  const value = String(text || "");
  const checks = {
    ar: /\p{Script=Arabic}/u,
    hi: /\p{Script=Devanagari}/u,
    ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
    zh: /\p{Script=Han}/u,
  };
  const check = checks[targetLang];
  if (check) return check.test(value);
  return /\p{Script=Latin}/u.test(value);
}

function sanitizeFlavor(raw, beatIds, targetLang) {
  const beats = raw && typeof raw === "object" ? raw.beats : null;
  if (!beats || typeof beats !== "object") return null;
  const cleaned = {};
  let count = 0;
  beatIds.forEach((beatId) => {
    const entry = beats[beatId];
    if (!entry || typeof entry !== "object") return;
    const line = String(entry.npcLine || "").trim();
    if (
      !line ||
      line.length > MAX_LINE_LENGTH ||
      !looksLikeTargetLanguage(line, targetLang)
    ) {
      return;
    }
    cleaned[beatId] = {
      npcLine: line,
      right: String(entry.right || "").trim().slice(0, MAX_LINE_LENGTH),
      wrong: String(entry.wrong || "").trim().slice(0, MAX_LINE_LENGTH),
    };
    count += 1;
  });
  return count ? { beats: cleaned } : null;
}

function parseLooseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function buildFlavorPrompt({ manifest, beats, unitTitle, unitTopics, targetLang, level }) {
  const profile = getCefrProfile(level);
  const beatLines = beats.map(
    (beat) =>
      `- id "${beat.id}": a ${beat.kind} moment; the NPC's current line is ${JSON.stringify(
        beat.promptTarget,
      )}; the concept in play is ${JSON.stringify(beat.conceptLabel)}.`,
  );
  return [
    `You are rewriting NPC lines for one scene of a language-learning game episode called "${manifest.id}".`,
    `Target language: ${targetLang}. CEFR level: ${normalizeCefrKey(level)}.`,
    `Level rules: at most ${profile.maxUtteranceWords} words per line; ${profile.tenses}.`,
    unitTitle ? `The learner is reviewing the unit: ${unitTitle}.` : "",
    unitTopics?.length ? `Unit topics: ${unitTopics.slice(0, 10).join(", ")}.` : "",
    "Rewrite each line so it references the unit naturally while KEEPING the same meaning and the same requested item/concept — the answer must stay the answer.",
    "Also give a short in-character reaction for a right answer and a wrong answer.",
    `Write ONLY in the target language (${targetLang}). Keep every string under ${MAX_LINE_LENGTH} characters.`,
    "Beats:",
    ...beatLines,
    'Return ONLY valid JSON: {"beats":{"<id>":{"npcLine":"...","right":"...","wrong":"..."}}}',
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Fetch (cache) or generate the flavor pack for a run combo. Resolves to a
 * sanitized flavor object or null; never throws.
 */
export async function fetchOrGenerateFlavor({
  manifest,
  beats,
  unitId,
  unitTitle,
  unitTopics,
  targetLang,
  level,
}) {
  const id = cacheId({ targetLang, level, unitId, episodeId: manifest.id });
  const beatIds = beats.map((beat) => beat.id);

  try {
    const local = window.localStorage.getItem(localKey(id));
    if (local) {
      const parsed = sanitizeFlavor(JSON.parse(local), beatIds, targetLang);
      if (parsed) return parsed;
    }
  } catch {
    // fall through to remote
  }

  try {
    const snapshot = await getDoc(doc(database, "gameFlavor", id));
    if (snapshot.exists()) {
      const parsed = sanitizeFlavor(snapshot.data(), beatIds, targetLang);
      if (parsed) {
        try {
          window.localStorage.setItem(localKey(id), JSON.stringify(parsed));
        } catch {
          // mirror only
        }
        return parsed;
      }
    }
  } catch {
    // offline / rules — tier-1 lines carry the run
  }

  try {
    const prompt = buildFlavorPrompt({
      manifest,
      beats,
      unitTitle,
      unitTopics,
      targetLang,
      level,
    });
    const text = await callResponses({ model: FLAVOR_MODEL, input: prompt });
    const parsed = sanitizeFlavor(parseLooseJson(text), beatIds, targetLang);
    if (!parsed) return null;
    try {
      window.localStorage.setItem(localKey(id), JSON.stringify(parsed));
    } catch {
      // mirror only
    }
    setDoc(doc(database, "gameFlavor", id), parsed).catch(() => {});
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Merge flavor into beats (non-destructive; answers untouched).
 */
export function applyFlavorToBeats(beats, flavor) {
  if (!flavor?.beats) return beats;
  return beats.map((beat) => {
    const entry = flavor.beats[beat.id];
    if (!entry?.npcLine) return beat;
    return {
      ...beat,
      promptTarget: entry.npcLine,
      ttsText: beat.ttsText ? entry.npcLine : beat.ttsText,
      flavorRight: entry.right || "",
      flavorWrong: entry.wrong || "",
    };
  });
}
