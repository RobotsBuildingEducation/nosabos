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
import { doc, setDoc } from "firebase/firestore";
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
// so the floor never picks an unroutable mode.
const ERROR_TYPE_TO_REPAIR_MODE = {
  vocabulary: "flashcards",
  grammar: "lesson", // structured → a generated mixed-question mini-lesson
  reading: "flashcards",
  writing: "lesson",
  pronunciation: "phonics",
  phonics: "phonics",
  listening: "conversation",
  conversation_flow: "conversation",
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

/**
 * Free-form conversation modes (Conversations, RealTime chat) have no
 * flashcard-style "wrong" event, so after each substantive learner turn we ask
 * the cheap model whether the utterance contained a real target-language slip
 * worth repairing. The model self-filters (slip:false for clean turns), then
 * captureCompanionMemory enriches + dedupes. Fire-and-forget. Shared by every
 * conversational surface so the prompt + gating stay identical.
 */
export async function captureConversationSlip({
  text,
  targetLang,
  supportLang,
  sourceMode = "conversation",
  cefrLevel,
}) {
  const trimmed = String(text || "").trim();
  // Skip trivial turns (greetings, "yes", "ok") — they're not worth a call.
  if (trimmed.split(/\s+/).filter(Boolean).length < 3) return;
  const targetName = langName(targetLang);
  const supportName = langName(supportLang);
  const input = [
    `A learner practicing ${targetName} just said this in a conversation:`,
    `"${trimmed}"`,
    `If it contains a clear ${targetName} mistake worth repairing later (grammar, conjugation, wrong word, gender/agreement, etc.), return ONLY strict minified JSON: {"slip":true,"concept":"a short skill label in ${supportName}","said":"the wrong fragment","correction":"the corrected ${targetName} form"}.`,
    `If the turn is basically fine, or it's just a greeting/filler, return {"slip":false}. Never invent a mistake.`,
  ].join("\n");

  let raw = "";
  try {
    raw = await callResponses({ input });
  } catch {
    return;
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return;
  let parsed = null;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return;
  }
  if (!parsed?.slip || !parsed.correction) return;

  captureCompanionMemory({
    targetLang,
    supportLang,
    sourceMode,
    concept: String(parsed.concept || parsed.said || trimmed).slice(0, 240),
    userAnswer: String(parsed.said || trimmed),
    expectedAnswer: String(parsed.correction || ""),
    cefrLevel,
    sourceContext: sourceMode,
  });
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
    id: `repair-${normalizePlateLang(targetLang)}-${dayKey || getCompanionDayKey()}`,
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
 * Complete an ephemeral repair lesson from the data embedded in the lesson
 * object (see buildEphemeralRepairLesson). Prefers the live repair focus when
 * present (clears it too); otherwise falls back to the embedded target/ids so
 * a reload mid-lesson can't strand the repair course.
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
 * Complete the active routed repair: the user practiced the weak concept in the
 * recommended live engine (phonics/conversation/tutor), so flip the repair
 * course to done and reinforce every note it covered, then clear the focus.
 * One routed session clears the whole repair (the engine seeds itself around the
 * weak concept rather than drilling card-by-card). Idempotent: a cleared focus
 * is a no-op, so a second call from the same session does nothing.
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
  // recommendedRepairMode is chosen per the highest-severity error; the
  // deterministic plan still presents flashcard-style, but the field drives
  // copy and (with the AI batch) multi-mode routing.
  const recommendedMode = items[0]
    ? repairModeForError(items[0].errorType)
    : "review";

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
// Modes the AI batch may pick for a repair — every one seeds a real, interactive
// surface with the weak material (no boring flashcard fallback):
//   conversation/tutor/phonics → live engine (scenario / phrase agenda / target sound)
//   flashcards → the real flashcard experience (TTS + speech), seeded with repair cards
//   lesson     → a freshly generated mini skill-tree lesson (mixed question types)
const REPAIR_MODES = [
  "conversation",
  "tutor",
  "phonics",
  "flashcards",
  "lesson",
];

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
    `Pick "recommendedMode" to match how the weak concept is best PRACTICED — every mode is a real interactive surface, so choose deliberately and the "summary" must explain WHY this mode fits:`,
    `- "conversation": functional/communicative language the learner would say to another person — greetings, ordering, asking for things, small talk, directions. Great default for anything you'd actually say in dialogue.`,
    `- "tutor": producing one specific target-language phrase or sentence correctly out loud, or focused grammar-in-speech coaching.`,
    `- "phonics": pronunciation, specific sounds, letters, or minimal pairs.`,
    `- "flashcards": fast recall of vocabulary words or short set phrases (meaning ⇄ form) — best when the weak spots are discrete items to memorize.`,
    `- "lesson": a richer concept that benefits from VARIED practice (a grammar pattern, conjugations, agreement, word order) — this generates a short mixed-question mini-lesson.`,
    `Match the mode to the concept; do not default to one. Use "flashcards" for pure recall and "lesson" for anything with structure/rules.`,
    `Compose a short, game-like repair for their next session. Return ONLY strict minified JSON (no markdown, no commentary) with EXACTLY this shape:`,
    `{"message":{"short":"one playful sentence in a manga speech-bubble voice","long":"2-4 warm sentences naming today's repair focus; never say the learner got something wrong"},"repair":{"recommendedMode":"one of ${REPAIR_MODES.join("/")}","items":[{"memoryId":"an id copied from the notes above","prompt":"a FRESH ${level}-appropriate practice cue in ${targetName} that exercises the same concept (do not copy the original)","answer":"the correct answer in ${targetName}","tip":"a short encouraging memory tip in ${supportName}"}]},"summary":"one short line in ${supportName}: why this repair"}`,
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
  const recommendedMode = ranked[0]
    ? repairModeForError(ranked[0].errorType)
    : "review";
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
      return {
        memoryId: note?.id || it?.memoryId || "",
        concept,
        expectedAnswer: String(
          it?.answer || it?.expectedAnswer || note?.expectedAnswer || "",
        ).trim(),
        userAnswer: note?.userAnswer || "",
        errorType: note?.errorType || "unknown",
        sourceMode: note?.sourceMode || "",
        sourceContext: note?.sourceContext || "",
        cefrLevel: displayCEFRLevel(note?.cefrLevel, "Pre-A1"),
        summary: String(it?.tip || it?.summary || note?.companionSummary || "").trim(),
      };
    })
    .filter(Boolean)
    .slice(0, REPAIR_MAX_ITEMS);

  const useItems = items.length ? items : fallback.repair?.items || [];
  const memoryIds = useItems.map((i) => i.memoryId).filter(Boolean);
  const aiMode = String(parsed?.repair?.recommendedMode || "").trim();
  const recommendedMode = REPAIR_MODES.includes(aiMode)
    ? aiMode
    : fallback.repair?.recommendedMode || "review";
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
