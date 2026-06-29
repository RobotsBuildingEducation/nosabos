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
import { getLocalDayKey } from "./flashcardReview";
import { normalizePlateLang } from "./dailyPlate";
import { buildQuestBubble, companionMemorySummary } from "./companionMemoryCopy";
import { callResponses } from "./llm";

const DAY_MS = 24 * 60 * 60 * 1000;

// Note statuses through the lifecycle.
export const MEMORY_STATUS = {
  captured: "captured",
  queuedForRepair: "queued_for_repair",
  usedInQuest: "used_in_quest",
  reinforced: "reinforced",
  expired: "expired",
};

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
};

const ERROR_TYPE_TO_REPAIR_MODE = {
  vocabulary: "review",
  grammar: "review", // MVP repairs grammar with targeted cards too
  reading: "review",
  writing: "review",
  pronunciation: "phonics",
  phonics: "phonics",
  listening: "conversation",
  conversation_flow: "conversation",
  confidence: "speak",
  unknown: "review",
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
    cefrLevel: cefrLevel || "A1",
    severity: 1,
    recommendedRepairMode: repairModeForError(errorType),
    companionSummary: companionMemorySummary(supportLang, concept),
    // Alive through Day T+1, pruned starting Day T+2.
    expiresAfterDayKey: getLocalDayKey(new Date(now.getTime() + DAY_MS)) || "",
    usedInQuestDayKey: null,
    status: MEMORY_STATUS.captured,
  };
}

/**
 * Capture one high-signal mistake into the companion brain. Only call this for
 * genuinely useful events (a wrong answer, repeated hints) — not every action.
 * De-dupes within the same day by concept: a repeated miss bumps severity
 * instead of stacking near-identical notes. Returns the stored note (or null
 * when nothing was written).
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
  return stored;
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
const REPAIR_MODES = [
  "review",
  "grammar",
  "phonics",
  "conversation",
  "listening",
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
function buildBatchInput({ ranked, targetLang, appLanguage, todayCleared, carryOverKinds }) {
  const targetName = langName(targetLang);
  const supportName = langName(appLanguage);
  const notes = ranked.map((n) => ({
    memoryId: n.id,
    concept: n.concept,
    theirAnswer: n.userAnswer || "",
    correctAnswer: n.expectedAnswer || "",
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
    `Compose a short, game-like repair for their next session. Return ONLY strict minified JSON (no markdown, no commentary) with EXACTLY this shape:`,
    `{"message":{"short":"one playful sentence in a manga speech-bubble voice","long":"2-4 warm sentences naming today's repair focus; never say the learner got something wrong"},"repair":{"recommendedMode":"one of ${REPAIR_MODES.join("/")}","items":[{"memoryId":"an id copied from the notes above","prompt":"a FRESH practice cue in ${targetName} that exercises the same concept (do not copy the original)","answer":"the correct answer in ${targetName}","tip":"a short encouraging memory tip in ${supportName}"}]},"summary":"one short line in ${supportName}: why this repair"}`,
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
        cefrLevel: note?.cefrLevel || "A1",
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
