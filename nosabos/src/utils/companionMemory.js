// src/utils/companionMemory.js
//
// The "companion brain": a small, intentionally temporary memory of the
// learner's recent weak spots. It captures high-signal mistakes during a
// session (Day T), reuses them to flavor and repair tomorrow's Daily Quest
// (Day T+1), then expires them (Day T+2). See COMPANION_MEMORY_QUEST_PLAN.md.
//
// Storage lives on the user doc so quest generation can read it at boot and it
// stays consistent across devices. It's deliberately tiny (high-signal capture
// + aggressive expiry), so the whole per-language log is a small array we
// read-modify-write through the user store (the source of truth) and mirror to
// Firestore with a merge write:
//
//   user.companionMemory[langKey] = { notes: MemoryNote[], lastPrunedDayKey }
//   user.dailyQuestExplanations[langKey][dayKey] = QuestExplanation
//   user.dailyQuestRepair[langKey][dayKey]       = RepairPlan
//
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import useNotesStore from "../hooks/useNotesStore";
import useRepairFocusStore from "../hooks/useRepairFocusStore";
import { getLocalDayKey } from "./flashcardReview";
import { normalizePlateLang, recordPlateActivity } from "./dailyPlate";
import {
  buildQuestBubble,
  companionMemorySummary,
  REPAIR_COPY,
} from "./companionMemoryCopy";
import { callResponses } from "./llm";
import { normalizeCEFRLevel } from "./cefrUtils";

const DAY_MS = 24 * 60 * 60 * 1000;

// Note statuses through the lifecycle.
export const MEMORY_STATUS = {
  captured: "captured",
  queuedForRepair: "queued_for_repair",
  usedInQuest: "used_in_quest",
  reinforced: "reinforced",
  expired: "expired",
};

function displayCEFRLevel(level, fallback = "Pre-A1") {
  const normalized = normalizeCEFRLevel(level || fallback, fallback);
  return normalized === "PRE-A1" ? "Pre-A1" : normalized;
}

function isFoundationCEFRLevel(level) {
  return ["Pre-A1", "A1"].includes(displayCEFRLevel(level, "Pre-A1"));
}

// Error categories that help pick a repair mode + flavor the copy.
export const ERROR_TYPES = [
  "vocabulary",
  "grammar",
  "pronunciation",
  "listening",
  "reading",
  "writing",
  "conversation_flow",
  "phonics",
  "confidence",
  "unknown",
];

// Only a few high-signal capture sources for the MVP. Each maps to a default
// error category, which in turn suggests a repair mode.
const MODE_TO_ERROR_TYPE = {
  flashcard: "vocabulary",
  vocabulary: "vocabulary",
  grammar: "grammar",
  phonics: "phonics",
  conversation: "conversation_flow",
  tutor: "conversation_flow",
  reading: "reading",
  story: "pronunciation", // story = read a sentence aloud → pronunciation repair
};

// Deterministic-fallback mode per error type. Values must be valid REPAIR_MODES
// so the floor never picks an unroutable mode. Conversation is deliberately
// not a repair mode (free-form chat is neither captured nor offered anymore):
// listening drills happen through flashcards (TTS reps) and conversational
// production through the tutor.
const ERROR_TYPE_TO_REPAIR_MODE = {
  vocabulary: "flashcards",
  grammar: "lesson", // structured → a generated mixed-question mini-lesson
  reading: "flashcards",
  writing: "lesson",
  pronunciation: "phonics",
  phonics: "phonics",
  listening: "flashcards",
  conversation_flow: "tutor",
  confidence: "tutor",
  unknown: "flashcards",
};

export function errorTypeForMode(sourceMode) {
  return MODE_TO_ERROR_TYPE[sourceMode] || "unknown";
}

export function repairModeForError(errorType) {
  return ERROR_TYPE_TO_REPAIR_MODE[errorType] || "review";
}

export function getCompanionDayKey(now = new Date()) {
  return getLocalDayKey(now) || "";
}

export function getYesterdayKey(now = new Date()) {
  return getLocalDayKey(new Date(now.getTime() - DAY_MS)) || "";
}

export function getTomorrowKey(now = new Date()) {
  return getLocalDayKey(new Date(now.getTime() + DAY_MS)) || "";
}

/* -----------------------------------
   Reads (pure — off the user object)
----------------------------------- */
function readBucket(user, langKey) {
  const bucket = user?.companionMemory?.[langKey];
  const notes = Array.isArray(bucket?.notes) ? bucket.notes : [];
  return {
    notes,
    lastPrunedDayKey:
      typeof bucket?.lastPrunedDayKey === "string"
        ? bucket.lastPrunedDayKey
        : "",
  };
}

export function getCompanionNotes(user = {}, targetLang = "es") {
  return readBucket(user, normalizePlateLang(targetLang)).notes;
}

// Notes captured today (Day T) — what the drawer celebrates as "saved for
// tomorrow".
export function getTodaysCapturedNotes(user, targetLang, now = new Date()) {
  const dayKey = getCompanionDayKey(now);
  return getCompanionNotes(user, targetLang).filter(
    (n) => n.createdDayKey === dayKey,
  );
}

// Notes from yesterday (Day T-1) that are still alive — the reinforcement
// context that flavors today's quest. Excludes ones already reinforced.
export function getReusableMemory(user, targetLang, now = new Date()) {
  const yesterday = getYesterdayKey(now);
  return getCompanionNotes(user, targetLang).filter(
    (n) =>
      n.createdDayKey === yesterday &&
      n.status !== MEMORY_STATUS.reinforced &&
      n.status !== MEMORY_STATUS.expired,
  );
}

// Has the companion saved anything worth reusing for today's quest?
export function hasReusableMemory(user, targetLang, now = new Date()) {
  return getReusableMemory(user, targetLang, now).length > 0;
}

function normalizeConceptKey(concept) {
  return String(concept || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Capture fires from surfaces that don't all receive npub as a prop, so fall
// back to the same resolution the rest of the app uses.
function resolveNpub(npub) {
  const direct = (npub || "").trim();
  if (direct) return direct;
  try {
    const user = useUserStore.getState?.()?.user;
    const fromUser = (user?.id || user?.local_npub || "").trim();
    if (fromUser) return fromUser;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    return (window.localStorage.getItem("local_npub") || "").trim();
  }
  return "";
}

/* -----------------------------------
   Persistence (store first, then mirror to Firestore)
----------------------------------- */
function persistBucket(rawNpub, langKey, bucket) {
  const npub = resolveNpub(rawNpub);
  // Local store is the source of truth so the drawer + quest react instantly.
  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser) {
      store.patchUser({
        companionMemory: {
          ...(currentUser?.companionMemory || {}),
          [langKey]: bucket,
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync companion memory locally:", error);
  }

  if (!npub) return Promise.resolve();
  // merge:true deep-merges the map, so other languages survive; the notes
  // array is replaced wholesale (which is what we want).
  return setDoc(
    doc(database, "users", npub),
    { companionMemory: { [langKey]: bucket } },
    { merge: true },
  ).catch((error) => {
    console.error("Failed to persist companion memory:", error);
  });
}

/* -----------------------------------
   Capture (Day T) — cheap, no AI
----------------------------------- */
function buildMemoryNote({
  concept,
  userAnswer,
  expectedAnswer,
  targetLang,
  supportLang,
  sourceMode,
  sourceContext,
  cefrLevel,
  dayKey,
  now,
}) {
  const errorType = errorTypeForMode(sourceMode);
  return {
    id: `mem-${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
    createdDayKey: dayKey,
    createdAt: now.getTime(),
    targetLang,
    supportLang,
    sourceMode,
    sourceContext: sourceContext || "",
    concept: String(concept || "").slice(0, 240),
    userAnswer: String(userAnswer || "").slice(0, 240),
    expectedAnswer: String(expectedAnswer || "").slice(0, 240),
    errorType,
    cefrLevel: displayCEFRLevel(cefrLevel, "Pre-A1"),
    severity: 1,
    recommendedRepairMode: repairModeForError(errorType),
    companionSummary: companionMemorySummary(supportLang, concept),
    // Filled in shortly after capture by a cheap Flash-Lite pass (enrichNote).
    // Until then they're empty and the UI falls back to companionSummary.
    mistake: "", // what the learner got wrong (support language)
    correction: String(expectedAnswer || "").slice(0, 240), // the right form
    tip: "", // one short improvement tip (support language)
    enriched: false,
    // Alive through Day T+1, pruned starting Day T+2.
    expiresAfterDayKey: getLocalDayKey(new Date(now.getTime() + DAY_MS)) || "",
    usedInQuestDayKey: null,
    status: MEMORY_STATUS.captured,
  };
}

/* -----------------------------------
   Enrichment (cheap Flash-Lite pass, runs just after capture)
----------------------------------- */
// Ask the cheap model to describe the slip in plain terms: what the learner did
// wrong, the correct form, and one short tip. Returns null on any failure so the
// base note (already written) keeps its deterministic summary. Kept tiny and
// strict-JSON so it's cheap and easy to parse.
async function enrichNoteFields({
  concept,
  userAnswer,
  expectedAnswer,
  targetLang,
  supportLang,
  sourceMode,
}) {
  const targetName = langName(targetLang);
  const supportName = langName(supportLang);
  const input = [
    `A learner studying ${targetName} just slipped up during a ${sourceMode} exercise.`,
    `Prompt / concept: ${concept}`,
    userAnswer
      ? `What the learner answered: ${userAnswer}`
      : `The learner could not produce an answer.`,
    expectedAnswer ? `Expected answer: ${expectedAnswer}` : "",
    `Explain the slip warmly and concretely so a teammate could repair it tomorrow.`,
    `Write "did" and "tip" in ${supportName}. Write "fix" in ${targetName} when it's a word/phrase, otherwise in ${supportName}.`,
    `Return ONLY strict minified JSON, no markdown, exactly:`,
    `{"did":"what specifically was wrong, <=14 words","fix":"the correct form or answer","tip":"one short, encouraging way to remember it, <=16 words"}`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw = "";
  try {
    raw = await callResponses({ input });
  } catch {
    return null;
  }
  const parsed = parseBlueprintJson(raw); // tolerant {...} extractor, reused
  if (!parsed) return null;
  const did = String(parsed.did || "").trim().slice(0, 200);
  const fix = String(parsed.fix || "").trim().slice(0, 200);
  const tip = String(parsed.tip || "").trim().slice(0, 200);
  if (!did && !fix && !tip) return null;
  return { mistake: did, correction: fix, tip };
}

// Re-read the latest bucket and patch the just-captured note in place. Re-reading
// avoids clobbering any capture that landed in between; if the note was pruned or
// the user switched accounts, we simply skip.
async function enrichAndPatchNote({ npub, langKey, noteId, fields }) {
  if (!fields) return;
  const store = useUserStore.getState?.();
  const bucket = readBucket(store?.user || {}, langKey);
  const idx = bucket.notes.findIndex((n) => n.id === noteId);
  if (idx < 0) return;
  const notes = [...bucket.notes];
  const prev = notes[idx];
  notes[idx] = {
    ...prev,
    mistake: fields.mistake || prev.mistake || "",
    correction: fields.correction || prev.correction || "",
    tip: fields.tip || prev.tip || "",
    enriched: true,
  };
  await persistBucket(npub, langKey, {
    notes,
    lastPrunedDayKey: bucket.lastPrunedDayKey,
  });
}

/* -----------------------------------
   Drawer summary — one AI-written plain-text digest of the whole log
----------------------------------- */
// The Memory drawer opens with a short Flash-Lite paragraph summarizing the
// current log in the support language. Cached per language in localStorage and
// keyed to a content signature, so it regenerates only when the log actually
// changes (a new capture, enrichment landing, a status flip, expiry).

function memorySummaryStorageKey(langKey) {
  return `companionMemorySummary:${langKey}`;
}

// Bump when the summary prompt changes so cached summaries regenerate even
// though the log itself didn't change.
const MEMORY_SUMMARY_PROMPT_VERSION = "v2";

// Fields that would change what the summary says. Includes `enriched` so the
// summary refreshes once the capture-time diagnosis lands.
function memoryLogSignature(notes = [], supportLang = "en") {
  return `${MEMORY_SUMMARY_PROMPT_VERSION}|${supportLang}|${notes
    .map((n) => `${n.id}:${n.status}:${n.severity || 1}:${n.enriched ? 1 : 0}`)
    .join("|")}`;
}

function readCachedMemorySummary(langKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(memorySummaryStorageKey(langKey));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.text === "string" ? parsed : null;
  } catch {
    return null;
  }
}

// Last generated summary for this language regardless of freshness — lets the
// drawer paint something immediately while a refresh runs in the background.
export function getCachedMemorySummaryText(targetLang) {
  return readCachedMemorySummary(normalizePlateLang(targetLang))?.text || "";
}

async function generateMemorySummaryText({ notes, langKey, supportLang }) {
  const targetName = langName(langKey);
  const supportName = langName(supportLang);
  const todayKey = getCompanionDayKey();
  const yKey = getYesterdayKey();
  const feed = notes.map((n) => ({
    when:
      n.createdDayKey === todayKey
        ? "today"
        : n.createdDayKey === yKey
          ? "yesterday"
          : n.createdDayKey,
    concept: n.concept,
    learnerAnswer: n.userAnswer || "",
    correctAnswer: n.expectedAnswer || n.correction || "",
    whatWentWrong: n.mistake || "",
    activity: n.sourceMode || "",
    status: n.status,
    timesMissed: n.severity || 1,
  }));
  const input = [
    `You write the digest line at the top of a mistake log for a ${targetName} course. Here is the current log (JSON):`,
    JSON.stringify(feed),
    `Statuses: "captured" = saved to practice tomorrow; "used_in_quest" = woven into today's quest; "reinforced" = already repaired; yesterday's unrepaired notes expire tonight.`,
    `Write a compact plain-text digest of the log in ${supportName}: the dominant pattern across the slips, what was repaired, and what is still open. Name the actual concepts, quoting ${targetName} words verbatim.`,
    `Dry, factual, matter-of-fact — like case notes. State only what the log shows. No greeting, no praise, no encouragement, no advice, no "we"/"let's", and do not address the learner. Terse fragments are fine. 1-3 short sentences, max 40 words, plain text only — no lists, no markdown, no emojis.`,
  ].join("\n");

  let raw = "";
  try {
    raw = await callResponses({ input });
  } catch {
    return "";
  }
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim()
    .slice(0, 480);
}

const memorySummaryInflight = new Map();

/**
 * The AI summary for the current log: cached per (language, log signature) so
 * repeated drawer opens are free and it only regenerates when the log changes.
 * Concurrent callers share one in-flight generation. Returns "" when the log
 * is empty or generation fails (the drawer simply shows nothing).
 */
export async function getOrBuildMemorySummary({
  notes = [],
  targetLang,
  supportLang = "en",
}) {
  if (!notes.length) return "";
  const langKey = normalizePlateLang(targetLang);
  const signature = memoryLogSignature(notes, supportLang);

  const cached = readCachedMemorySummary(langKey);
  if (cached?.signature === signature && cached.text) return cached.text;

  const flightKey = `${langKey}|${signature}`;
  if (memorySummaryInflight.has(flightKey)) {
    return memorySummaryInflight.get(flightKey);
  }

  const pending = generateMemorySummaryText({ notes, langKey, supportLang })
    .then((text) => {
      if (text && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            memorySummaryStorageKey(langKey),
            JSON.stringify({ signature, text }),
          );
        } catch {
          /* ignore quota errors — it just regenerates next open */
        }
      }
      return text;
    })
    .finally(() => memorySummaryInflight.delete(flightKey));

  memorySummaryInflight.set(flightKey, pending);
  return pending;
}

/**
 * Capture one high-signal mistake into the companion brain. Only call this for
 * genuinely useful events (a wrong answer, repeated hints) — not every action.
 * De-dupes within the same day by concept: a repeated miss bumps severity
 * instead of stacking near-identical notes. Returns the stored note (or null
 * when nothing was written).
 *
 * The base note is written immediately (so a capture is never lost), then a
 * cheap Flash-Lite pass enriches it in the background with what went wrong + a
 * tip. Callers fire-and-forget; the enrichment patch lands a moment later.
 */
export async function captureCompanionMemory({
  npub,
  targetLang,
  supportLang = "en",
  sourceMode,
  concept,
  userAnswer,
  expectedAnswer,
  cefrLevel,
  sourceContext,
  now = new Date(),
}) {
  const trimmedConcept = String(concept || "").trim();
  if (!trimmedConcept) return null;

  const langKey = normalizePlateLang(targetLang);
  const dayKey = getCompanionDayKey(now);
  if (!dayKey) return null;

  const store = useUserStore.getState?.();
  const currentUser = store?.user || {};
  const bucket = readBucket(currentUser, langKey);
  const notes = [...bucket.notes];

  const conceptKey = normalizeConceptKey(trimmedConcept);
  const dupeIndex = notes.findIndex(
    (n) =>
      n.createdDayKey === dayKey &&
      n.sourceMode === sourceMode &&
      normalizeConceptKey(n.concept) === conceptKey,
  );

  let stored;
  if (dupeIndex >= 0) {
    // Same slip again today — strengthen the signal rather than duplicate it.
    const existing = notes[dupeIndex];
    stored = {
      ...existing,
      severity: Math.min(3, (Number(existing.severity) || 1) + 1),
      userAnswer: String(userAnswer || existing.userAnswer || "").slice(0, 240),
      createdAt: now.getTime(),
    };
    notes[dupeIndex] = stored;
  } else {
    stored = buildMemoryNote({
      concept: trimmedConcept,
      userAnswer,
      expectedAnswer,
      targetLang: langKey,
      supportLang,
      sourceMode,
      sourceContext,
      cefrLevel,
      dayKey,
      now,
    });
    notes.unshift(stored);
  }

  // Keep the log small even within a single heavy day.
  const trimmed = notes.slice(0, 40);
  await persistBucket(npub, langKey, {
    notes: trimmed,
    lastPrunedDayKey: bucket.lastPrunedDayKey,
  });

  // Pulse the notes/memory action-bar button so the capture is visible the same
  // way lessons/skill-tree saves are — centralized here so EVERY capture source
  // (flashcards, vocab, grammar, tutor, phonics, conversation) lights it up,
  // including the realtime modes that capture asynchronously.
  try {
    useNotesStore.getState?.().triggerDoneAnimation?.();
  } catch {
    /* non-fatal: the note is already saved */
  }

  // Background enrichment (cheap Flash-Lite): describe the slip + a tip, then
  // patch the note a moment later. Fire-and-forget so capture stays snappy, and
  // only for notes not already enriched (a repeated miss keeps its first pass).
  if (!stored.enriched) {
    void enrichNoteFields({
      concept: trimmedConcept,
      userAnswer: stored.userAnswer,
      expectedAnswer: stored.expectedAnswer,
      targetLang: langKey,
      supportLang,
      sourceMode,
    }).then((fields) =>
      enrichAndPatchNote({ npub, langKey, noteId: stored.id, fields }),
    );
  }

  return stored;
}

function repairLessonLevelGuard(cefrLevel) {
  const level = displayCEFRLevel(cefrLevel, "Pre-A1");
  if (level === "Pre-A1") {
    return [
      "REPAIR LEVEL GUARD: The learner is Pre-A1/A0.",
      "Use only memorized high-frequency chunks, greetings, names, numbers, simple present-tense phrases, and one-clause sentences of about 3-6 words.",
      "Do not introduce, name, compare, or test past tenses, preterite/indefinite/imperfect, subjunctive, conditional, object pronouns, or multi-clause grammar.",
      "If the weak spot is advanced, downshift it into recognition or practice of one useful beginner word/chunk instead of teaching the advanced rule.",
    ].join(" ");
  }
  if (level === "A1") {
    return [
      "REPAIR LEVEL GUARD: The learner is A1.",
      "Use basic everyday vocabulary, simple present-tense patterns, memorized chunks, and short one-clause sentences.",
      "Do not introduce, name, compare, or test past tenses, preterite/indefinite/imperfect, subjunctive, conditional, or advanced grammar.",
      "If the weak spot is advanced, downshift it into one useful beginner-safe word/chunk.",
    ].join(" ");
  }
  return `REPAIR LEVEL GUARD: Keep every exercise within CEFR ${level}; the repair topic must not exceed that level.`;
}

const FOUNDATION_ADVANCED_REPAIR_PATTERN =
  /\b(pret[eé]rito|indefinid[oa]|imperfect[oa]|subjunctive|subjuntivo|conditional|condicional|past\s+tense|preterite|future\s+tense|object\s+pronoun|pronombres?\s+de\s+objeto|ayer|anoche|pasado|pasada|cuando\s+era|cuando\s+fui)\b/i;

function isBeginnerSafeRepairTarget(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (FOUNDATION_ADVANCED_REPAIR_PATTERN.test(text)) return false;
  if (/[.?!;:]/.test(text)) return false;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount <= 4 && text.length <= 42;
}

/**
 * Build an ephemeral skill-tree lesson from a repair plan. This is a REAL
 * lesson object — same shape handleStartLesson consumes — so repair runs
 * through the actual lesson view (top nav tabs, XP bar, bottom action bar) and
 * the real engines (Vocabulary/Grammar/Reading/Stories/RealTime), each seeded
 * via lessonContent { topic, words, focusPoints } so generation stays strictly
 * on the weak material. It is never persisted to the learning path: `isRepair`
 * makes App skip lesson-progress writes, and completion (XP goal, same as any
 * lesson) reinforces the memory notes instead.
 */
export function buildEphemeralRepairLesson({
  plan,
  targetLang,
  cefrLevel = "Pre-A1",
  dayKey,
  recommendedMode = "lesson",
  stepIndex = 0,
}) {
  const items = Array.isArray(plan?.items) ? plan.items : [];
  const concepts = items.map((it) => it?.concept).filter(Boolean);
  if (!concepts.length) return null;
  const lessonCefrLevel = displayCEFRLevel(cefrLevel, "Pre-A1");
  const isFoundationLevel = isFoundationCEFRLevel(lessonCefrLevel);
  const levelGuard = repairLessonLevelGuard(lessonCefrLevel);

  // Target-language material the engines should drill: prefer the corrected
  // form; fall back to the concept label.
  const rawWords = items
    .map((it) => it?.expectedAnswer || it?.concept)
    .filter(Boolean);
  const words = isFoundationLevel
    ? rawWords.filter(isBeginnerSafeRepairTarget)
    : rawWords;
  const repairTargets = isFoundationLevel
    ? words
    : words.length
      ? words
      : concepts;
  const focusPoints = isFoundationLevel
    ? []
    : [
        ...items
          .map((it) => {
            const tip = it?.summary || "";
            return tip ? `${it.concept}: ${tip}` : it?.concept;
          })
          .filter(Boolean),
      ];

  // `flashcards` repair = pure recall → the vocabulary engine (it includes the
  // flashcard submodule). `lesson` repair = the FULL lesson experience: every
  // submodule except game review, all seeded with the same weak material.
  const modes =
    recommendedMode === "flashcards"
      ? ["vocabulary"]
      : isFoundationLevel
        ? ["vocabulary"]
      : [...REPAIR_LESSON_MODES];

  const topic = isFoundationLevel
    ? repairTargets.length
      ? `beginner repair with these words or chunks: ${repairTargets.join("; ")}`
      : "beginner repair based on recent weak spots"
    : concepts.join("; ");
  const content = {};
  modes.forEach((m) => {
    content[m] = {
      topic,
      words,
      focusPoints,
      cefrLevel: lessonCefrLevel,
      isRepair: true,
      levelGuard,
      repairTargets,
    };
  });

  return {
    // Step-scoped id: each repair step is its own ephemeral lesson, so a
    // restored activeLesson from an earlier step can't be mistaken for the
    // current one.
    id: `repair-${normalizePlateLang(targetLang)}-${dayKey || getCompanionDayKey()}-s${Math.max(0, Number(stepIndex) || 0)}`,
    isRepair: true,
    title: { ...REPAIR_COPY.title },
    description: { ...REPAIR_COPY.intro },
    cefrLevel: lessonCefrLevel,
    // Small goal: a handful of correct answers in the seeded engines completes
    // the lesson through the normal XP-goal path.
    xpReward: 10,
    modes,
    content,
    // Completion data embedded in the lesson itself so finishing still flips
    // the repair course + reinforces notes even if the in-memory repair focus
    // was lost (e.g. the app reloaded mid-lesson and restored activeLesson
    // from localStorage).
    repairTarget: Math.max(1, Number(plan?.target) || items.length || 1),
    repairMemoryIds: Array.isArray(plan?.memoryIds) ? plan.memoryIds : [],
  };
}

/**
 * Complete an ephemeral repair lesson (one step of the day's repair) from the
 * data embedded in the lesson object (see buildEphemeralRepairLesson).
 * Prefers the live repair focus when present (clears it too); otherwise falls
 * back to the embedded target/ids so a reload mid-lesson can't strand the
 * repair course. Step lessons carry target 1, so finishing one advances the
 * repair course by exactly one step.
 */
export async function completeRepairLesson({ lesson, npub, targetLang }) {
  const focus = useRepairFocusStore.getState?.()?.focus;
  if (focus) {
    await completeRepairFocus();
    return;
  }
  const target = Math.max(1, Number(lesson?.repairTarget) || 1);
  // Parallel, like completeRepairFocus: local store patches flip the course
  // instantly; the commutative increment(1) writes settle in the background.
  const pending = [];
  for (let i = 0; i < target; i += 1) {
    pending.push(recordPlateActivity(npub, "repair", targetLang));
  }
  const memoryIds = Array.isArray(lesson?.repairMemoryIds)
    ? lesson.repairMemoryIds
    : [];
  if (memoryIds.length) {
    pending.push(markMemoryReinforced({ npub, targetLang, memoryIds }));
  }
  await Promise.all(pending);
}

/* -----------------------------------
   Expiry (Day T+2) — runs at boot
----------------------------------- */
/**
 * Drop notes whose reinforcement window has passed (expiresAfterDayKey is
 * strictly before today). Idempotent per day via lastPrunedDayKey, and a no-op
 * write when nothing changed. Safe to call on every boot.
 */
export async function pruneCompanionMemory({
  npub,
  targetLang,
  now = new Date(),
}) {
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getCompanionDayKey(now);
  if (!dayKey) return;

  const store = useUserStore.getState?.();
  const currentUser = store?.user || {};
  const bucket = readBucket(currentUser, langKey);
  if (bucket.lastPrunedDayKey === dayKey) return; // already pruned today

  const kept = bucket.notes.filter(
    (n) =>
      typeof n.expiresAfterDayKey === "string" &&
      n.expiresAfterDayKey >= dayKey,
  );

  // Only write when we actually removed expired notes. This is deliberate: if
  // this runs before the user doc has loaded (store notes empty), we must NOT
  // write an empty array back — that would clobber the real notes on the
  // server. A no-op (nothing expired / nothing loaded) writes nothing.
  if (kept.length === bucket.notes.length) return;

  await persistBucket(npub, langKey, {
    notes: kept,
    lastPrunedDayKey: dayKey,
  });
}

/**
 * Mark a set of notes as reinforced once a repair task uses them, so they no
 * longer resurface and the drawer can celebrate "Repair complete".
 */
export async function markMemoryReinforced({
  npub,
  targetLang,
  memoryIds = [],
  now = new Date(),
}) {
  if (!memoryIds.length) return;
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getCompanionDayKey(now);
  const idSet = new Set(memoryIds);

  const store = useUserStore.getState?.();
  const currentUser = store?.user || {};
  const bucket = readBucket(currentUser, langKey);
  let touched = false;
  const notes = bucket.notes.map((n) => {
    if (!idSet.has(n.id)) return n;
    touched = true;
    return {
      ...n,
      status: MEMORY_STATUS.reinforced,
      usedInQuestDayKey: n.usedInQuestDayKey || dayKey,
    };
  });
  if (!touched) return;

  await persistBucket(npub, langKey, {
    notes,
    lastPrunedDayKey: bucket.lastPrunedDayKey,
  });
}

/**
 * Complete the active routed repair step: the user practiced the weak concept
 * in the routed live engine (phonics/tutor), so bank that step's course
 * increment(s), reinforce the note(s) it covered, and clear the focus. The
 * focus holds a per-step mini-plan (target 1, one item — see getRepairSteps),
 * so one routed session advances the repair course by exactly one step; the
 * next tap on the repair task routes into the next step's mode. Idempotent: a
 * cleared focus is a no-op, so a second call from the same session does
 * nothing.
 */
export async function completeRepairFocus() {
  const focusStore = useRepairFocusStore.getState?.();
  const focus = focusStore?.focus;
  if (!focus) return;
  const { plan, targetLang, npub } = focus;
  const memoryIds = Array.isArray(plan?.memoryIds) ? plan.memoryIds : [];
  const target = Math.max(1, Number(plan?.target) || memoryIds.length || 1);

  // Clear first so any re-entrant completion (e.g. two quick successes) is a
  // no-op and can't double-count the course.
  focusStore.clearFocus?.();

  // Fire the increments in parallel: each call patches the local store
  // synchronously before its Firestore write (so the repair course flips done
  // immediately — the task-complete modal shouldn't wait on N sequential
  // round-trips), and the writes use increment(1), which is commutative.
  const pending = [];
  for (let i = 0; i < target; i += 1) {
    pending.push(recordPlateActivity(npub, "repair", targetLang));
  }
  if (memoryIds.length) {
    pending.push(markMemoryReinforced({ npub, targetLang, memoryIds }));
  }
  await Promise.all(pending);
}

/**
 * Flag notes as used in today's quest (the repair was queued/curated from
 * them). Distinct from reinforced — used = "the quest leaned on this",
 * reinforced = "the learner repaired it".
 */
export async function markMemoryUsedInQuest({
  npub,
  targetLang,
  memoryIds = [],
  questDayKey,
  now = new Date(),
}) {
  if (!memoryIds.length) return;
  const langKey = normalizePlateLang(targetLang);
  const dayKey = questDayKey || getCompanionDayKey(now);
  const idSet = new Set(memoryIds);

  const store = useUserStore.getState?.();
  const currentUser = store?.user || {};
  const bucket = readBucket(currentUser, langKey);
  let touched = false;
  const notes = bucket.notes.map((n) => {
    if (!idSet.has(n.id) || n.status === MEMORY_STATUS.reinforced) return n;
    touched = true;
    return {
      ...n,
      status: MEMORY_STATUS.usedInQuest,
      usedInQuestDayKey: dayKey,
    };
  });
  if (!touched) return;

  await persistBucket(npub, langKey, {
    notes,
    lastPrunedDayKey: bucket.lastPrunedDayKey,
  });
}

/* -----------------------------------
   Repair plan (Day T+1)
----------------------------------- */
export const REPAIR_MAX_ITEMS = 3;

/**
 * Pick the strongest reusable notes into a small repair set. Dedupes by
 * concept, prefers higher severity, and caps at REPAIR_MAX_ITEMS so repair
 * never dominates the plate. Returns a plan object (not yet persisted) or null
 * when there's nothing worth repairing.
 */
// Strongest reusable notes, deduped by concept and capped — shared by the
// deterministic plan and the AI batch (which needs the same ranked set so its
// generated items map back to real memory ids).
export function rankReusableNotes(reusable = [], max = REPAIR_MAX_ITEMS) {
  const seen = new Set();
  return [...reusable]
    .sort((a, b) => (b.severity || 1) - (a.severity || 1))
    .filter((n) => {
      const key = normalizeConceptKey(n.concept);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
}

// Map ranked notes → repair items in the shape the repair modal renders
// (concept = prompt shown, expectedAnswer = revealed, summary = tip).
function repairItemsFromNotes(ranked = []) {
  return ranked.map((n) => ({
    memoryId: n.id,
    concept: n.concept,
    expectedAnswer: n.expectedAnswer || "",
    userAnswer: n.userAnswer || "",
    errorType: n.errorType,
    sourceMode: n.sourceMode,
    // The practice mode this item's step should run in (getRepairSteps
    // dedupes across items so a multi-item repair spans different modes).
    mode: repairModeForError(n.errorType),
    // Carries a mode-specific pointer back to the exact source (e.g. the
    // phonics letter id) so a routed repair can deep-seed the right material
    // instead of just naming the concept. Free-form per sourceMode.
    sourceContext: n.sourceContext || "",
    cefrLevel: n.cefrLevel,
    summary: n.companionSummary || "",
  }));
}

export function buildRepairPlan({
  user,
  targetLang,
  now = new Date(),
  dayKey,
  max = REPAIR_MAX_ITEMS,
}) {
  const ranked = rankReusableNotes(getReusableMemory(user, targetLang, now), max);
  if (!ranked.length) return null;

  const items = repairItemsFromNotes(ranked);
  // Legacy hint only — actual routing is per-item/per-step via getRepairSteps,
  // which reads each item's own mode.
  const recommendedMode = items[0]?.mode || "lesson";

  return {
    dayKey: dayKey || getCompanionDayKey(now),
    targetLang: normalizePlateLang(targetLang),
    mode: "review",
    recommendedMode,
    target: items.length,
    items,
    memoryIds: items.map((i) => i.memoryId),
    createdAt: now.getTime(),
  };
}

export function getStoredRepairPlan(user, targetLang, dayKey) {
  const langKey = normalizePlateLang(targetLang);
  const plan = user?.dailyQuestRepair?.[langKey]?.[dayKey];
  return plan && Array.isArray(plan.items) && plan.items.length ? plan : null;
}

export async function storeRepairPlan({ npub: rawNpub, targetLang, dayKey, plan }) {
  if (!plan) return;
  const npub = resolveNpub(rawNpub);
  const langKey = normalizePlateLang(targetLang);

  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser) {
      const existing = currentUser?.dailyQuestRepair || {};
      store.patchUser({
        dailyQuestRepair: {
          ...existing,
          [langKey]: { ...(existing[langKey] || {}), [dayKey]: plan },
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync repair plan locally:", error);
  }

  if (!npub) return;
  await setDoc(
    doc(database, "users", npub),
    { dailyQuestRepair: { [langKey]: { [dayKey]: plan } } },
    { merge: true },
  ).catch((error) => {
    console.error("Failed to persist repair plan:", error);
  });
}

/* -----------------------------------
   Quest explanation (the manga bubble)
----------------------------------- */
export function getStoredQuestExplanation(user, targetLang, dayKey) {
  const langKey = normalizePlateLang(targetLang);
  return user?.dailyQuestExplanations?.[langKey]?.[dayKey] || null;
}

export async function storeQuestExplanation({
  npub: rawNpub,
  targetLang,
  dayKey,
  explanation,
}) {
  if (!explanation) return;
  const npub = resolveNpub(rawNpub);
  const langKey = normalizePlateLang(targetLang);

  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser) {
      const existing = currentUser?.dailyQuestExplanations || {};
      store.patchUser({
        dailyQuestExplanations: {
          ...existing,
          [langKey]: { ...(existing[langKey] || {}), [dayKey]: explanation },
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync quest explanation locally:", error);
  }

  if (!npub) return;
  await setDoc(
    doc(database, "users", npub),
    { dailyQuestExplanations: { [langKey]: { [dayKey]: explanation } } },
    { merge: true },
  ).catch((error) => {
    console.error("Failed to persist quest explanation:", error);
  });
}

/* =====================================================================
   Daily batch — the companion "thinks about tomorrow" once, when today's
   quest finishes (or, as a fallback, on the next open if it didn't).

   One LLM call over the whole day's note feed composes a *blueprint* for the
   day it will be consumed: the manga message + an AI-authored repair set
   (fresh practice, not a replay) + a one-line rationale. The AI is an
   enhancement over a deterministic floor — any failure falls back to
   buildQuestBubble + the heuristic repair plan, so the next day never breaks.

   Stored at user.dailyQuestBlueprint[lang][dayKey]; the repair sub-object is
   mirrored into dailyQuestRepair (and rationale into dailyQuestExplanations)
   so every existing consumer keeps working unchanged.
   ===================================================================== */

const BLUEPRINT_STALE_MS = 10 * 60 * 1000; // a "generating" marker older than this is retryable
// Modes a repair step may run in — every one seeds a real, interactive
// surface with the weak material:
//   tutor/phonics → live engine (an ephemeral tutor session / target sound)
//   flashcards    → the real flashcard experience (TTS + speech), seeded with repair cards
//   lesson        → a freshly generated mini skill-tree lesson (mixed question types)
// Conversation is deliberately NOT a repair mode: free-form chat is too
// unstructured to verify a specific weak spot got repaired.
const REPAIR_MODES = ["tutor", "phonics", "flashcards", "lesson"];

// When two steps would land on the same mode, later duplicates take the next
// unused mode from this list so a multi-item repair spans different modes.
// Only generic modes belong here — phonics is excluded because it only makes
// sense for sound/pronunciation material.
const REPAIR_STEP_FALLBACK_MODES = ["lesson", "flashcards", "tutor"];

// Valid mode, or "" — legacy stored plans may still say "conversation" (no
// longer offered) or "speak" (old alias); both route to the tutor, the closest
// spoken-production surface.
export function normalizeRepairMode(mode) {
  const m = String(mode || "")
    .trim()
    .toLowerCase();
  if (REPAIR_MODES.includes(m)) return m;
  if (m === "conversation" || m === "speak") return "tutor";
  return "";
}

/**
 * Split a day's repair plan into per-step mini-plans: one item per step, each
 * with its own practice mode (per-item AI/heuristic pick, deduped across steps
 * so a multi-item repair uses different modes). Each step's `plan` has the
 * exact stored-plan shape with target 1 and just that item, so every existing
 * consumer (the focus store, the ephemeral lesson builder, the completion
 * paths) works on one step without knowing about steps — completing a step
 * increments the plate's repair course by exactly 1, which is why the course
 * counter reads 0/N for an N-item repair.
 */
export function getRepairSteps(plan) {
  const items = Array.isArray(plan?.items) ? plan.items : [];
  if (!items.length) return [];
  const used = new Set();
  return items.map((item, index) => {
    const preferred =
      normalizeRepairMode(item?.mode) ||
      normalizeRepairMode(repairModeForError(item?.errorType)) ||
      "lesson";
    let mode = preferred;
    if (used.has(mode)) {
      mode = REPAIR_STEP_FALLBACK_MODES.find((m) => !used.has(m)) || preferred;
    }
    used.add(mode);
    return {
      index,
      mode,
      item,
      plan: {
        ...plan,
        recommendedMode: mode,
        target: 1,
        items: [item],
        memoryIds: item?.memoryId ? [item.memoryId] : [],
      },
    };
  });
}

// The step the learner should do next, given how many repair increments
// they've already banked today. Clamped so a stale count can't run past the
// end. Null when the plan has no usable items.
export function getNextRepairStep(plan, completedCount = 0) {
  const steps = getRepairSteps(plan);
  if (!steps.length) return null;
  const idx = Math.min(
    Math.max(0, Math.floor(Number(completedCount) || 0)),
    steps.length - 1,
  );
  return { ...steps[idx], stepCount: steps.length };
}

/* -----------------------------------
   Repair flashcard deck — a "flashcards" step runs in the REAL flashcard
   surface with a small deck generated fresh around the weak spot (not the
   predefined library). Card ids are stable per day+step and the deck is
   cached in localStorage, so re-entering the step (or reloading mid-deck)
   reuses the same cards and already-answered ones stay answered. Answering a
   card persists its definition alongside its review progress (see
   persistFlashcardReview in App), which is what adds it to the learner's
   main deck with normal SRS scheduling from then on.
----------------------------------- */
export const REPAIR_DECK_SIZE = 3;

function repairDeckStorageKey(langKey, dayKey, stepIndex) {
  return `repairDeck:${langKey}:${dayKey}:s${stepIndex}`;
}

function readCachedRepairDeck(key) {
  if (typeof window === "undefined" || !key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const cards = Array.isArray(parsed) ? parsed : null;
    if (!cards?.length) return null;
    return cards.filter((c) => c && c.id && c.concept) || null;
  } catch {
    return null;
  }
}

function writeCachedRepairDeck(key, cards) {
  if (typeof window === "undefined" || !key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(cards));
  } catch {
    /* ignore quota errors — the deck just regenerates next time */
  }
}

function buildRepairCard({
  support,
  target,
  supportBase,
  targetBase,
  langKey,
  dayKey,
  stepIndex,
  cardIndex,
  level,
}) {
  const supportText = String(support || "").trim().slice(0, 160);
  const targetText = String(target || "").trim().slice(0, 160);
  if (!supportText && !targetText) return null;
  const concept = {};
  concept[supportBase] = supportText || targetText;
  if (!concept.en) concept.en = supportText || targetText;
  if (targetText) concept[targetBase] = targetText;
  return {
    id: `repair-${langKey}-${dayKey}-s${stepIndex}-c${cardIndex}`,
    concept,
    cefrLevel: level,
    category: "repair",
    type: (targetText || supportText).split(/\s+/).length > 1 ? "phrase" : "word",
    isRepair: true,
  };
}

// Ask the cheap model for a few tiny recall cards drilling exactly the weak
// spot. Returns [{support, target}] or null on any failure.
async function generateRepairDeckEntries({
  item,
  targetLang,
  supportLang,
  level,
  count,
}) {
  const targetName = langName(targetLang);
  const supportName = langName(supportLang);
  const guard = repairLessonLevelGuard(level);
  const input = [
    `A learner studying ${targetName} (CEFR ${level}) recently struggled with this weak spot: "${item.concept}".`,
    item.expectedAnswer ? `The correct ${targetName} form is: "${item.expectedAnswer}".` : "",
    item.summary ? `Coach note: ${item.summary}` : "",
    guard,
    `Create ${count} tiny recall flashcards that drill EXACTLY this weak spot. The FIRST card must be the weak item itself; the others are minimal variations or directly supporting words/short phrases for the same concept — nothing unrelated.`,
    `Each card: "support" is the cue shown to the learner, written in ${supportName}; "target" is the ${targetName} answer they must produce. Keep both short — a word or one short phrase, never a full sentence beyond ${level}.`,
    `Return ONLY a strict minified JSON array with exactly ${count} items, no markdown: [{"support":"...","target":"..."}]`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw = "";
  try {
    raw = await callResponses({ input });
  } catch {
    return null;
  }
  const text = String(raw || "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const entries = parsed
      .map((e) => ({
        support: String(e?.support || "").trim(),
        target: String(e?.target || "").trim(),
      }))
      .filter((e) => e.support && e.target);
    return entries.length ? entries : null;
  } catch {
    return null;
  }
}

/**
 * Build (or restore from today's cache) the generated deck for a
 * "flashcards" repair step. Always yields at least one deterministic card
 * built straight from the weak item (the floor when the AI call fails), so
 * the step is never empty.
 */
export async function getOrBuildRepairDeck({ focus, now = new Date() }) {
  const plan = focus?.plan;
  const item = Array.isArray(plan?.items) ? plan.items[0] : null;
  if (!item) return [];
  const langKey = normalizePlateLang(focus?.targetLang || plan?.targetLang);
  const supportBase = String(focus?.supportLang || "en").toLowerCase() || "en";
  const dayKey = plan?.dayKey || getCompanionDayKey(now);
  const stepIndex = Math.max(0, Number(focus?.stepIndex) || 0);
  const level = displayCEFRLevel(item?.cefrLevel, "Pre-A1");

  const cacheKey = repairDeckStorageKey(langKey, dayKey, stepIndex);
  const cached = readCachedRepairDeck(cacheKey);
  if (cached?.length) return cached;

  const common = {
    supportBase,
    targetBase: langKey,
    langKey,
    dayKey,
    stepIndex,
    level,
  };
  // The floor: the weak item itself, cue = its concept label (target-language
  // practice cue for AI plans, support-language label for heuristic ones).
  const floorCard = buildRepairCard({
    ...common,
    support: item.concept,
    target: item.expectedAnswer || item.concept,
    cardIndex: 0,
  });
  if (!floorCard) return [];

  let cards = [floorCard];
  const entries = await generateRepairDeckEntries({
    item,
    targetLang: langKey,
    supportLang: supportBase,
    level,
    count: REPAIR_DECK_SIZE,
  });
  if (entries?.length) {
    cards = entries
      .slice(0, REPAIR_DECK_SIZE)
      .map((entry, index) =>
        buildRepairCard({ ...common, ...entry, cardIndex: index }),
      )
      .filter(Boolean);
    if (!cards.length) cards = [floorCard];
  }

  writeCachedRepairDeck(cacheKey, cards);
  return cards;
}

/**
 * Dev/testing companion to resetTodayPlate: erase the artifacts that make a
 * flashcards repair step look already-done on a re-run. Card ids and the
 * cached deck are deterministic per (lang, day, step), so after a plate reset
 * the restored deck would find every card's persisted progress doc and bank
 * the step instantly on entry ("answered" = progress doc exists — that's what
 * makes a mid-step reload resumable). Clears the live focus, today's cached
 * decks, and today's repair-card progress docs; the languageFlashcards
 * subscription mirrors the deletes back into the local store.
 */
export async function resetTodayRepairArtifacts({
  npub,
  targetLang,
  now = new Date(),
}) {
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getCompanionDayKey(now);
  if (!dayKey) return;

  useRepairFocusStore.getState?.()?.clearFocus?.();

  if (typeof window !== "undefined") {
    try {
      const prefix = `repairDeck:${langKey}:${dayKey}:`;
      const stale = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) stale.push(key);
      }
      stale.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      /* ignore — deck cache just regenerates with the same card ids */
    }
  }

  if (!npub) return;

  // Match today's repair cards in the local mirror of the subcollection so no
  // Firestore query is needed; doc ids are `${targetLang}_${cardId}` (see
  // persistFlashcardReview).
  const cardPrefix = `repair-${langKey}-${dayKey}-s`;
  const byLang =
    useUserStore.getState?.()?.user?.progress?.languageFlashcards || {};
  const docIds = [];
  Object.values(byLang).forEach((cards) => {
    Object.values(cards || {}).forEach((progress) => {
      const cardId = progress?.cardId;
      const lang = progress?.targetLang;
      if (!cardId || !lang) return;
      if (normalizePlateLang(lang) !== langKey) return;
      if (String(cardId).startsWith(cardPrefix)) {
        docIds.push(`${lang}_${cardId}`);
      }
    });
  });
  if (!docIds.length) return;

  try {
    await Promise.all(
      docIds.map((id) =>
        deleteDoc(doc(database, "users", npub, "languageFlashcards", id)),
      ),
    );
  } catch (error) {
    console.warn("Failed to reset repair card progress:", error);
  }
}

// Submodules an ephemeral repair lesson may include — exactly the tabs the real
// lesson view renders (each consumes lessonContent { topic, words, focusPoints }).
const REPAIR_LESSON_MODES = [
  "vocabulary",
  "grammar",
  "reading",
  "stories",
  "realtime",
];

const BATCH_LANG_NAMES = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  de: "German",
  ja: "Japanese",
  zh: "Chinese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
};

export function getStoredBlueprint(user, targetLang, dayKey) {
  const langKey = normalizePlateLang(targetLang);
  const bp = user?.dailyQuestBlueprint?.[langKey]?.[dayKey];
  return bp && typeof bp === "object" ? bp : null;
}

// A ready blueprint's manga message (empty until the batch has run).
export function getBlueprintMessage(user, targetLang, dayKey) {
  const bp = getStoredBlueprint(user, targetLang, dayKey);
  if (!bp || bp.status !== "ready") return null;
  return bp.message || null;
}

// Unfinished kinds carried over from an incomplete previous day (Option A).
export function getBlueprintCarryOverKinds(user, targetLang, dayKey) {
  const bp = getStoredBlueprint(user, targetLang, dayKey);
  if (!bp || bp.status !== "ready") return [];
  return Array.isArray(bp.carryOverKinds) ? bp.carryOverKinds : [];
}

// Should the batch run for this consumption day? Skips when a ready (or
// recently-failed) blueprint already exists; retries a stale "generating"
// marker (e.g. a tab that closed mid-call).
export function shouldRunDailyBatch(user, targetLang, dayKey, now = new Date()) {
  const bp = getStoredBlueprint(user, targetLang, dayKey);
  if (!bp) return true;
  if (bp.status === "ready" || bp.status === "failed") return false;
  if (bp.status === "generating") {
    return now.getTime() - (Number(bp.startedAt) || 0) > BLUEPRINT_STALE_MS;
  }
  return true;
}

function mergeDayField(existing, langKey, dayKey, value) {
  const root = existing || {};
  return {
    ...root,
    [langKey]: { ...(root[langKey] || {}), [dayKey]: value },
  };
}

// Persist a blueprint (store-first, then Firestore merge). Mirrors the repair
// sub-object → dailyQuestRepair and rationale → dailyQuestExplanations in the
// same write so existing readers (getStoredRepairPlan, the bubble's
// explanation store) work without changes.
async function persistBlueprint(rawNpub, langKey, dayKey, blueprint) {
  const npub = resolveNpub(rawNpub);
  const repair =
    blueprint?.repair && Array.isArray(blueprint.repair.items) && blueprint.repair.items.length
      ? blueprint.repair
      : null;
  const explanation = blueprint?.rationale || null;

  try {
    const store = useUserStore.getState?.();
    const u = store?.user;
    if (store?.patchUser) {
      const patch = {
        dailyQuestBlueprint: mergeDayField(
          u?.dailyQuestBlueprint,
          langKey,
          dayKey,
          blueprint,
        ),
      };
      if (repair) {
        patch.dailyQuestRepair = mergeDayField(
          u?.dailyQuestRepair,
          langKey,
          dayKey,
          repair,
        );
      }
      if (explanation) {
        patch.dailyQuestExplanations = mergeDayField(
          u?.dailyQuestExplanations,
          langKey,
          dayKey,
          explanation,
        );
      }
      store.patchUser(patch);
    }
  } catch (error) {
    console.warn("Failed to sync blueprint locally:", error);
  }

  if (!npub) return;
  const docPatch = {
    dailyQuestBlueprint: { [langKey]: { [dayKey]: blueprint } },
  };
  if (repair) docPatch.dailyQuestRepair = { [langKey]: { [dayKey]: repair } };
  if (explanation) {
    docPatch.dailyQuestExplanations = { [langKey]: { [dayKey]: explanation } };
  }
  await setDoc(doc(database, "users", npub), docPatch, { merge: true }).catch(
    (error) => {
      console.error("Failed to persist blueprint:", error);
    },
  );
}

function langName(code) {
  return BATCH_LANG_NAMES[normalizePlateLang(code)] || BATCH_LANG_NAMES[code] || code;
}

// The single batch prompt. English instructions, output written in the user's
// app language for the message/tips and the target language for practice.
function buildBatchInput({
  ranked,
  targetLang,
  appLanguage,
  todayCleared,
  carryOverKinds,
  cefrLevel,
}) {
  const targetName = langName(targetLang);
  const supportName = langName(appLanguage);
  const level = displayCEFRLevel(cefrLevel || ranked[0]?.cefrLevel, "Pre-A1");
  const levelGuard = repairLessonLevelGuard(level);
  const notes = ranked.map((n) => ({
    memoryId: n.id,
    concept: n.concept,
    theirAnswer: n.userAnswer || "",
    correctAnswer: n.expectedAnswer || n.correction || "",
    cefrLevel: displayCEFRLevel(n.cefrLevel || level, level),
    // Enriched at capture time by the Flash-Lite pass — gives the batch a richer,
    // already-diagnosed picture of each slip instead of just raw answers.
    whatWentWrong: n.mistake || "",
    improvementTip: n.tip || "",
    errorType: n.errorType,
    severity: n.severity || 1,
  }));
  const completion = todayCleared
    ? "The learner finished their last quest."
    : "The learner did NOT finish their last quest. Gently acknowledge that without any blame, and put the most important concept first.";
  const carry = carryOverKinds?.length
    ? `They also have unfinished tasks carrying into today: ${carryOverKinds.join(", ")}.`
    : "";

  return [
    `You are the learner's friendly language-learning companion (a small pet character) for a ${targetName} course.`,
    `Write the "message" and every "tip" in ${supportName}. Write each practice "prompt" and "answer" in ${targetName}.`,
    `These are the weak spots the learner struggled with most recently (JSON):`,
    JSON.stringify(notes),
    completion,
    carry,
    `The learner is at CEFR level ${level}. Keep every prompt, answer, and the overall difficulty appropriate for ${level} — simpler and more concrete for Pre-A1/A1, more nuanced for higher levels. Never exceed their level.`,
    levelGuard,
    `The repair runs as a SEQUENCE of short activities — one per item — so pick each item's "mode" to match how THAT weak concept is best PRACTICED. Every mode is a real interactive surface, so choose deliberately:`,
    `- "tutor": producing a specific target-language phrase or sentence correctly out loud, functional language you'd say to another person, or focused grammar-in-speech coaching.`,
    `- "phonics": pronunciation, specific sounds, letters, or minimal pairs.`,
    `- "flashcards": fast recall of vocabulary words or short set phrases (meaning ⇄ form) — best when the weak spot is a discrete item to memorize.`,
    `- "lesson": a richer concept that benefits from VARIED practice (a grammar pattern, conjugations, agreement, word order) — this generates a short mixed-question mini-lesson.`,
    `Match each mode to its concept; when there are multiple items, give them DIFFERENT modes whenever sensible so the repair sequence feels varied. Use "flashcards" for pure recall and "lesson" for anything with structure/rules.`,
    `Compose a short, game-like repair for their next session.`,
    `SCOPE: the repair is only ONE small task inside today's quest — the other quest tasks continue the learner's regular course progress with new material. When the message explains what you lined up and why, explicitly attribute it to the repair task (call it a "repair" or a quick warm-up before the rest of the quest). NEVER phrase it as if the whole day or the whole quest is about this material (not "today we are going to work on X" — say "our quick repair task today covers X, then we keep pushing ahead").`,
    `Return ONLY strict minified JSON (no markdown, no commentary) with EXACTLY this shape:`,
    `{"message":{"short":"one playful sentence in a manga speech-bubble voice","long":"2-4 warm sentences naming what the repair task focuses on and why, explicitly scoped to the repair task with the rest of the quest framed as their normal progress; never say the learner got something wrong"},"repair":{"items":[{"memoryId":"an id copied from the notes above","mode":"one of ${REPAIR_MODES.join("/")}","prompt":"a FRESH ${level}-appropriate practice cue in ${targetName} that exercises the same concept (do not copy the original)","answer":"the correct answer in ${targetName}","tip":"a short encouraging memory tip in ${supportName}"}]},"summary":"one short line in ${supportName}: why this repair"}`,
    `Use one item per weak spot, max ${REPAIR_MAX_ITEMS}, each memoryId from the list. Stay positive and encouraging.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Defensive parse: strip code fences / prose, take the first {...} block.
function parseBlueprintJson(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

// Deterministic blueprint (the floor): heuristic repair items + templated
// manga message. Always valid, used directly when there's no AI or it fails.
function buildDeterministicBlueprint({
  ranked,
  langKey,
  appLanguage,
  todayCleared,
  carryOverKinds,
  targetDayKey,
  now,
}) {
  const items = repairItemsFromNotes(ranked);
  const concept = items[0]?.concept || "";
  const leadKind = !concept ? "fresh" : items.length > 1 ? "repairMulti" : "repair";
  const bubble = buildQuestBubble({
    lang: appLanguage,
    leadKind,
    concept,
    taskList: "",
    cleared: false,
  });
  const recommendedMode = items[0]?.mode || "lesson";
  const memoryIds = items.map((i) => i.memoryId).filter(Boolean);

  return {
    status: "ready",
    source: "deterministic",
    generatedAt: now.getTime(),
    dayKey: targetDayKey,
    targetLang: langKey,
    yesterdayComplete: todayCleared,
    carryOverKinds: carryOverKinds || [],
    message: { short: bubble.short, long: bubble.long },
    repair: items.length
      ? {
          dayKey: targetDayKey,
          targetLang: langKey,
          mode: "review",
          recommendedMode,
          target: items.length,
          items,
          memoryIds,
          createdAt: now.getTime(),
        }
      : null,
    rationale: {
      questDayKey: targetDayKey,
      targetLang: langKey,
      repairMemoryIds: memoryIds,
      summary: concept ? `Repair: ${concept}` : "",
    },
  };
}

// Merge the AI's JSON with the ranked notes (which own the real memory ids,
// original answers, and error types) into a stored-shape blueprint.
function assembleAiBlueprint({
  parsed,
  ranked,
  fallback,
  langKey,
  todayCleared,
  carryOverKinds,
  targetDayKey,
  now,
}) {
  const noteById = new Map(ranked.map((n) => [n.id, n]));
  const aiItems = Array.isArray(parsed?.repair?.items) ? parsed.repair.items : [];
  const items = aiItems
    .map((it) => {
      const note = noteById.get(it?.memoryId) || null;
      const concept = String(it?.prompt || it?.concept || note?.concept || "").trim();
      if (!concept) return null;
      const errorType = note?.errorType || "unknown";
      return {
        memoryId: note?.id || it?.memoryId || "",
        concept,
        expectedAnswer: String(
          it?.answer || it?.expectedAnswer || note?.expectedAnswer || "",
        ).trim(),
        userAnswer: note?.userAnswer || "",
        errorType,
        sourceMode: note?.sourceMode || "",
        // The AI's per-item practice mode when valid, else the heuristic one.
        mode:
          normalizeRepairMode(it?.mode) ||
          normalizeRepairMode(repairModeForError(errorType)) ||
          "lesson",
        sourceContext: note?.sourceContext || "",
        cefrLevel: displayCEFRLevel(note?.cefrLevel, "Pre-A1"),
        summary: String(it?.tip || it?.summary || note?.companionSummary || "").trim(),
      };
    })
    .filter(Boolean)
    .slice(0, REPAIR_MAX_ITEMS);

  const useItems = items.length ? items : fallback.repair?.items || [];
  const memoryIds = useItems.map((i) => i.memoryId).filter(Boolean);
  // Legacy hint (routing is per-item via getRepairSteps): the first step's mode.
  const recommendedMode =
    useItems[0]?.mode || fallback.repair?.recommendedMode || "lesson";
  const longMsg = String(parsed?.message?.long || "").trim();
  const shortMsg = String(parsed?.message?.short || "").trim();

  return {
    status: "ready",
    source: "ai",
    generatedAt: now.getTime(),
    dayKey: targetDayKey,
    targetLang: langKey,
    yesterdayComplete: todayCleared,
    carryOverKinds: carryOverKinds || [],
    message: {
      short: shortMsg || fallback.message.short,
      long: longMsg || fallback.message.long,
    },
    repair: useItems.length
      ? {
          dayKey: targetDayKey,
          targetLang: langKey,
          mode: "review",
          recommendedMode,
          target: useItems.length,
          items: useItems,
          memoryIds,
          createdAt: now.getTime(),
        }
      : null,
    rationale: {
      questDayKey: targetDayKey,
      targetLang: langKey,
      repairMemoryIds: memoryIds,
      summary: String(parsed?.summary || fallback.rationale.summary || "").trim(),
    },
  };
}

/**
 * Compose the blueprint for `targetDayKey` from a set of source notes. One AI
 * call, with a deterministic fallback. Marker-first so two devices can't
 * double-run. Pass the notes explicitly (today's captures when run at
 * completion; yesterday's reusable notes when run as the next-day fallback).
 */
export async function runDailyBatch({
  npub: rawNpub,
  targetLang,
  appLanguage = "en",
  sourceNotes = [],
  targetDayKey,
  todayCleared = true,
  carryOverKinds = [],
  cefrLevel,
  now = new Date(),
}) {
  const npub = resolveNpub(rawNpub);
  const langKey = normalizePlateLang(targetLang);
  if (!targetDayKey) return null;

  // Marker first (multi-device guard) before the slow call.
  await persistBlueprint(npub, langKey, targetDayKey, {
    status: "generating",
    startedAt: now.getTime(),
    dayKey: targetDayKey,
    targetLang: langKey,
  });

  const ranked = rankReusableNotes(sourceNotes);
  const fallback = buildDeterministicBlueprint({
    ranked,
    langKey,
    appLanguage,
    todayCleared,
    carryOverKinds,
    targetDayKey,
    now,
  });

  let blueprint = fallback;
  if (ranked.length) {
    try {
      const raw = await callResponses({
        input: buildBatchInput({
          ranked,
          targetLang: langKey,
          appLanguage,
          todayCleared,
          carryOverKinds,
          cefrLevel,
        }),
      });
      const parsed = parseBlueprintJson(raw);
      if (parsed) {
        blueprint = assembleAiBlueprint({
          parsed,
          ranked,
          fallback,
          langKey,
          todayCleared,
          carryOverKinds,
          targetDayKey,
          now,
        });
      }
    } catch (error) {
      console.warn("runDailyBatch: AI compose failed, using deterministic", error);
    }
  }

  await persistBlueprint(npub, langKey, targetDayKey, blueprint);

  // Flag the notes the quest leaned on (idempotent; skips already-reinforced).
  const usedIds = blueprint?.repair?.memoryIds || [];
  if (usedIds.length) {
    await markMemoryUsedInQuest({
      npub,
      targetLang: langKey,
      memoryIds: usedIds,
      questDayKey: targetDayKey,
      now,
    });
  }
  return blueprint;
}
