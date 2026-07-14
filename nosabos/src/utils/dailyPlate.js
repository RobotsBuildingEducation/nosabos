// src/utils/dailyPlate.js
//
// The "Daily Plate" composes one light daily session out of three courses:
//   review — graded flashcard reviews        (progress.flashcardDailyActivity)
//   learn  — completed skill-tree lessons    (progress.lessonDailyActivity)
//   speak  — completed Tutor lessons         (progress.speakDailyActivity)
//
// Counts live on the user doc as per-language, per-day maps:
//   progress.<field>[langKey][YYYY-MM-DD] = number
// `flashcardDailyActivity` was already written by the flashcard review flow;
// the other two are bumped by awardXp() when callers tag a source.
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { FLASHCARD_DAILY_TARGET, getLocalDayKey } from "./flashcardReview";
import { pruneDayEntries } from "./userDataSchema";

export const DAILY_PLATE_KINDS = ["review", "learn", "speak"];

// Guided session order: warm up speaking with the tutor, then the unlocked
// lesson, then close out with flashcard review.
export const DAILY_PLATE_COURSE_ORDER = ["speak", "learn", "review"];

export const DAILY_PLATE_TARGETS = {
  // Shared with the Cards screen's "Daily target" bar — one knob tunes both.
  review: FLASHCARD_DAILY_TARGET,
  learn: 1, // skill-tree lessons completed
  speak: 1, // Tutor lessons completed
  conversation: 4, // fallback only — overridden per-day to 4-7 user turns
  phonics: 3, // Alphabet/phonics letters practiced
  repair: 1, // fallback only — overridden per-day by the repair plan's item count
};

// The Conversation quest asks for a short back-and-forth. Instead of a flat
// target we vary it 4-7 user turns per day (deterministic per day + language)
// so the ask feels fresh. Counted per user turn — see Conversations'
// awardTurnXp — and applied by getDailyPlateSnapshot below.
export const CONVERSATION_TURN_TARGET_MIN = 4;
export const CONVERSATION_TURN_TARGET_MAX = 7;

export function getConversationTurnTarget(dayKey = "", langKey = "") {
  const span = CONVERSATION_TURN_TARGET_MAX - CONVERSATION_TURN_TARGET_MIN + 1;
  // hashString (defined below) is a hoisted function declaration, so calling
  // it here is fine even though it appears later in the file.
  const roll = hashString(`conversation|${langKey}|${dayKey}`) % span;
  return CONVERSATION_TURN_TARGET_MIN + roll;
}

// Every quest course that can be elected onto a daily plate, in canonical
// display order. (phonics is reserved for Phase 3 once the bootcamp is
// repeatable.)
export const QUEST_CANONICAL_ORDER = [
  // Repair leads the plate when present — yesterday's weak spot gets warmed up
  // before forward progress. It is never auto-elected; the app prepends it for
  // the day when the companion brain has a repair plan.
  "repair",
  "speak",
  "learn",
  "review",
  "conversation",
  "phonics",
];

export const DAILY_PLATE_BONUS_XP = 25;

export const DAILY_PLATE_ACTIVITY_FIELDS = {
  review: "flashcardDailyActivity",
  learn: "lessonDailyActivity",
  speak: "speakDailyActivity",
  conversation: "conversationDailyActivity",
  phonics: "phonicsDailyActivity",
  repair: "repairDailyActivity",
};

// Every per-day activity field touched by the plate, used when resetting a
// day's progress for testing.
export const DAILY_PLATE_ALL_ACTIVITY_FIELDS = [
  "flashcardDailyActivity",
  "lessonDailyActivity",
  "speakDailyActivity",
  "conversationDailyActivity",
  "phonicsDailyActivity",
  "repairDailyActivity",
];

// awardXp() accepts these as its optional `source` argument. "review" is
// intentionally absent — flashcard reviews already increment their own
// counter in persistFlashcardReview.
export const PLATE_XP_SOURCE_FIELDS = {
  lesson: DAILY_PLATE_ACTIVITY_FIELDS.learn,
  speak: DAILY_PLATE_ACTIVITY_FIELDS.speak,
};

const PLATE_BONUS_FIELD = "plateBonusDailyActivity";

export function normalizePlateLang(targetLang) {
  return typeof targetLang === "string" && targetLang.trim()
    ? targetLang.trim().toLowerCase()
    : "es";
}

export function getDailyPlateDayKey(now = new Date()) {
  return getLocalDayKey(now) || "";
}

function readDayCount(progress, field, langKey, dayKey) {
  const value = Number(progress?.[field]?.[langKey]?.[dayKey]);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * Pure read of today's plate for one language. Everything comes from the
 * user object already held in the store, so callers re-render for free as
 * awards sync back.
 */
export function getDailyPlateSnapshot(
  user = {},
  targetLang = "es",
  now = new Date(),
  kinds = DAILY_PLATE_COURSE_ORDER,
) {
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  const progress = user?.progress || {};

  const activeKinds =
    Array.isArray(kinds) && kinds.length ? kinds : DAILY_PLATE_COURSE_ORDER;

  const courses = activeKinds.map((kind) => {
    const target =
      kind === "conversation"
        ? getConversationTurnTarget(dayKey, langKey)
        : kind === "repair"
          ? // Repair's "done" target is however many items the companion
            // curated into today's repair plan (default 1).
            Math.max(
              1,
              Number(user?.dailyQuestRepair?.[langKey]?.[dayKey]?.target) || 1,
            )
          : DAILY_PLATE_TARGETS[kind] || 1;
    const count = readDayCount(
      progress,
      DAILY_PLATE_ACTIVITY_FIELDS[kind],
      langKey,
      dayKey,
    );
    return {
      kind,
      count: Math.min(count, 999),
      target,
      done: count >= target,
      percent: target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0,
    };
  });

  const doneCount = courses.filter((course) => course.done).length;
  const byKind = Object.fromEntries(
    courses.map((course) => [course.kind, course]),
  );

  return {
    dayKey,
    langKey,
    courses,
    byKind,
    doneCount,
    isCleared: doneCount === courses.length,
    bonusAwarded: Boolean(progress?.[PLATE_BONUS_FIELD]?.[langKey]?.[dayKey]),
  };
}

/**
 * First incomplete course in the plate's own (elected) order, or null when
 * the plate is cleared.
 */
export function getNextPlateCourse(snapshot) {
  const course = (snapshot?.courses || []).find((c) => !c.done);
  return course ? course.kind : null;
}

/* -----------------------------------
   Quest elector

   Picks which course types make up a daily plate. The first quest is a fixed
   trio (handled by the caller); afterward the plate elects a small set from
   whatever modes are available that day. Stored per day+language so it stays
   stable until a new day (or a manual re-roll for testing).
----------------------------------- */
export const DAILY_QUEST_DEFAULT_COUNT = 3;

function orderQuestKinds(kinds) {
  const set = new Set(kinds);
  return QUEST_CANONICAL_ORDER.filter((kind) => set.has(kind));
}

// Deterministic PRNG so a day's plate is stable without storage and identical
// across devices. hashString → mulberry32. Pass a seed string for
// determinism; omit for a fresh (Math.random) roll (the dev re-roll button).
function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function makeSeededRandom(seedStr) {
  let a = hashString(seedStr) || 1;
  return function seeded() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ~3 courses, occasionally 2 or 4 (the agreed ±1 variance).
function pickQuestCount(rng) {
  const r = rng();
  if (r < 0.18) return 2;
  if (r < 0.82) return 3;
  return 4;
}

function weightedSampleWithoutReplacement(items, weightFor, count, rng) {
  const pool = items.map((item) => ({
    item,
    weight: Math.max(0.0001, weightFor(item)),
  }));
  const result = [];
  while (result.length < count && pool.length) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    result.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return result;
}

/**
 * For each candidate kind, weight how "neglected" it is: 1 + the number of the
 * last `days` days with zero activity in that course's counter. More neglected
 * modes get surfaced more often.
 */
export function getQuestNeglectWeights(
  user = {},
  langKey,
  kinds = [],
  now = new Date(),
  days = 7,
) {
  const progress = user?.progress || {};
  const weights = {};
  kinds.forEach((kind) => {
    const field = DAILY_PLATE_ACTIVITY_FIELDS[kind];
    let zeroDays = 0;
    for (let d = 1; d <= days; d++) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const key = getLocalDayKey(date);
      const count = Number(progress?.[field]?.[langKey]?.[key]) || 0;
      if (count <= 0) zeroDays += 1;
    }
    weights[kind] = 1 + zeroDays;
  });
  return weights;
}

/**
 * Elect a set of course kinds from the available pool.
 * - `seed` → deterministic per-day result (omit for a random roll).
 * - `count` → fixed size; omit for the ±1 variance (~3) derived from the seed.
 * - `weights` → per-kind neglect weights (more neglected = more likely).
 * - `avoid` → kinds from the previous plate are down-weighted so days differ.
 * Result is returned in canonical display order.
 */
export function electDailyQuestCourses({
  available = [],
  count,
  avoid = [],
  seed = null,
  weights = null,
} = {}) {
  const pool = available.filter(Boolean);
  const rng = seed != null ? makeSeededRandom(String(seed)) : Math.random;
  const size = typeof count === "number" ? count : pickQuestCount(rng);
  const clamped = Math.max(1, Math.min(size, pool.length));
  if (pool.length <= clamped) return orderQuestKinds(pool);

  const avoidSet = new Set(avoid);
  const weightFor = (kind) => {
    const base = weights?.[kind] ?? 1;
    return avoidSet.has(kind) ? base * 0.25 : base;
  };
  const picked = weightedSampleWithoutReplacement(pool, weightFor, clamped, rng);
  return orderQuestKinds(picked);
}

const QUEST_PLATE_STORAGE_KEY = "dailyQuestPlate";

export function readQuestPlate() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUEST_PLATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.kinds) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeQuestPlate(langKey, dayKey, kinds) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      QUEST_PLATE_STORAGE_KEY,
      JSON.stringify({ langKey, dayKey, kinds }),
    );
  } catch {
    /* ignore */
  }
}

export function readQuestPlateKinds(langKey, dayKey) {
  const stored = readQuestPlate();
  if (stored && stored.langKey === langKey && stored.dayKey === dayKey) {
    return orderQuestKinds(stored.kinds);
  }
  return null;
}

// "Has the user ever had a quest day?" — the first quest is the fixed trio;
// after that, days auto-elect. Stored on the user doc
// (progress.dailyQuestFirstSeen) so it's consistent across devices.
export function hasSeenFirstQuest(user) {
  return Boolean(user?.progress?.dailyQuestFirstSeen);
}

// The day the user's introductory (first) quest was elected. Companion-memory
// personalization (the quest bubble + repair task) is suppressed on this day so
// the introductory plate keeps its intended tone — it only kicks in afterward.
export function getFirstQuestDayKey(user) {
  const key = user?.progress?.dailyQuestFirstDayKey;
  return typeof key === "string" ? key : "";
}

// True once the introductory plate is behind the user: they've seen a quest and
// today isn't that very first quest day. Existing users (who predate the
// first-day-key field) read as past their intro, which is correct.
export function isPastFirstQuest(user, dayKey) {
  if (!hasSeenFirstQuest(user)) return false;
  const firstDay = getFirstQuestDayKey(user);
  return !firstDay || firstDay !== dayKey;
}

// Set ONLY the "seen a quest" flag — no first-quest-day stamp. Used when we
// detect a returning user via a plate that older code cached without ever
// setting the flag: they're past their intro, so we must not stamp today as
// their first quest day (which would wrongly suppress the companion bubble).
export async function markFirstQuestFlagOnly(npub) {
  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (
      store?.patchUser &&
      currentUser?.progress?.dailyQuestFirstSeen !== true
    ) {
      store.patchUser({
        progress: {
          ...(currentUser.progress || {}),
          dailyQuestFirstSeen: true,
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync first-quest flag locally:", error);
  }

  if (!npub) return;
  try {
    await setDoc(
      doc(database, "users", npub),
      { progress: { dailyQuestFirstSeen: true } },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to persist first-quest flag:", error);
  }
}

export async function markFirstQuestSeen(npub) {
  const dayKey = getDailyPlateDayKey();
  // Patch the local store first so the election effect sees it immediately.
  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser && currentUser?.progress?.dailyQuestFirstSeen !== true) {
      store.patchUser({
        progress: {
          ...(currentUser.progress || {}),
          dailyQuestFirstSeen: true,
          dailyQuestFirstDayKey:
            currentUser.progress?.dailyQuestFirstDayKey || dayKey,
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync first-quest flag locally:", error);
  }

  if (!npub) return;
  try {
    // The first quest day is written once, ever. The local store may not have
    // loaded yet when this runs (a raced new-day boot), so trusting it alone
    // clobbered the real stamp with today — check the server copy first and
    // preserve it, re-syncing the local store if it had raced ahead.
    let remoteProgress = null;
    try {
      const snap = await getDoc(doc(database, "users", npub));
      remoteProgress = snap.exists() ? snap.data()?.progress || null : null;
    } catch {
      /* offline/read failure — fall through with local knowledge only */
    }
    const localFirstDay =
      useUserStore.getState?.()?.user?.progress?.dailyQuestFirstDayKey;
    if (remoteProgress?.dailyQuestFirstSeen) {
      // The server already knows the intro happened — whether stamped with its
      // real day or deliberately flag-only (markFirstQuestFlagOnly), stamping
      // TODAY would wrongly make today read as the first quest day. Re-sync the
      // local store to the server copy and write nothing.
      const remoteFirstDay = remoteProgress?.dailyQuestFirstDayKey || "";
      if (remoteFirstDay !== (localFirstDay || "")) {
        try {
          const store = useUserStore.getState?.();
          if (store?.patchUser) {
            const progress = {
              ...(store.user?.progress || {}),
              dailyQuestFirstSeen: true,
            };
            if (remoteFirstDay) progress.dailyQuestFirstDayKey = remoteFirstDay;
            else delete progress.dailyQuestFirstDayKey;
            store.patchUser({ progress });
          }
        } catch {
          /* ignore — server copy is already correct */
        }
      }
      return;
    }
    const existingFirstDay =
      remoteProgress?.dailyQuestFirstDayKey || localFirstDay;
    await setDoc(
      doc(database, "users", npub),
      {
        progress: {
          dailyQuestFirstSeen: true,
          dailyQuestFirstDayKey: existingFirstDay || dayKey,
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to persist first-quest flag:", error);
  }
}

/* -----------------------------------
   Guided session persistence

   A "session" is the user pressing "Start daily practice" — while active,
   the app auto-advances them through the remaining courses. It lives in
   localStorage keyed to a day + language so a stale session never carries
   into tomorrow or another language.
----------------------------------- */
const PLATE_SESSION_STORAGE_KEY = "dailyPlateSession";

export function readPlateSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLATE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function startPlateSession(langKey, dayKey, now = new Date()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PLATE_SESSION_STORAGE_KEY,
      JSON.stringify({ langKey, dayKey, startedAt: now.toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPlateSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLATE_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isPlateSessionFor(session, langKey, dayKey) {
  return Boolean(
    session && session.langKey === langKey && session.dayKey === dayKey,
  );
}

/**
 * Count one plate action right now, independent of XP. The Tutor uses this
 * for "speak" when a Tutor lesson completes — its XP is success-gated and
 * varies per lesson, so the plate counts the completion itself. Bumps the
 * local store first so the plate UI and conductor react immediately, then
 * persists an atomic increment.
 */
export async function recordPlateActivity(
  npub,
  kind,
  targetLang,
  now = new Date(),
) {
  const field = DAILY_PLATE_ACTIVITY_FIELDS[kind];
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  if (!npub || !field || !dayKey) return;

  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser && currentUser) {
      const progress = currentUser.progress || {};
      const langMap = pruneDayEntries(
        progress?.[field]?.[langKey] || {},
        dayKey,
      );
      const nextCount = (Number(langMap?.[dayKey]) || 0) + 1;
      store.patchUser({
        progress: {
          ...progress,
          [field]: {
            ...(progress[field] || {}),
            [langKey]: { ...langMap, [dayKey]: nextCount },
          },
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync plate activity locally:", error);
  }

  try {
    const userRef = doc(database, "users", npub);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists() ? snap.data() : {};
      const langMap = pruneDayEntries(
        data?.progress?.[field]?.[langKey] || {},
        dayKey,
      );
      tx.update(userRef, {
        [`progress.${field}.${langKey}`]: {
          ...langMap,
          [dayKey]: (Number(langMap[dayKey]) || 0) + 1,
        },
        updatedAt: now.toISOString(),
      });
    });
  } catch (error) {
    console.error("Failed to record plate activity:", error);
  }
}

/**
 * Dev/testing helper: zero today's plate progress for a language — every
 * course counter and the bonus marker — so the full quest flow can be run
 * again from scratch. Updates the local store first for instant UI, then
 * persists.
 */
export async function resetTodayPlate(npub, targetLang, now = new Date()) {
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  if (!npub || !dayKey) return;

  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser && currentUser) {
      const progress = currentUser.progress || {};
      const zeroField = (field) => ({
        ...(progress[field] || {}),
        [langKey]: { ...(progress[field]?.[langKey] || {}), [dayKey]: 0 },
      });
      const nextProgress = { ...progress };
      DAILY_PLATE_ALL_ACTIVITY_FIELDS.forEach((field) => {
        nextProgress[field] = zeroField(field);
      });
      nextProgress[PLATE_BONUS_FIELD] = {
        ...(progress[PLATE_BONUS_FIELD] || {}),
        [langKey]: {
          ...(progress[PLATE_BONUS_FIELD]?.[langKey] || {}),
          [dayKey]: false,
        },
      };
      store.patchUser({ progress: nextProgress });
    }
  } catch (error) {
    console.warn("Failed to reset plate locally:", error);
  }

  try {
    const userRef = doc(database, "users", npub);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists() ? snap.data() : {};
      const update = { updatedAt: now.toISOString() };
      DAILY_PLATE_ALL_ACTIVITY_FIELDS.forEach((field) => {
        update[`progress.${field}.${langKey}`] = {
          ...pruneDayEntries(data?.progress?.[field]?.[langKey] || {}, dayKey),
          [dayKey]: 0,
        };
      });
      update[`progress.${PLATE_BONUS_FIELD}.${langKey}`] = {
        ...pruneDayEntries(
          data?.progress?.[PLATE_BONUS_FIELD]?.[langKey] || {},
          dayKey,
        ),
        [dayKey]: false,
      };
      tx.update(userRef, update);
    });
  } catch (error) {
    console.error("Failed to reset plate:", error);
  }
}

/**
 * Returns a progress object with today's bonus marker applied — used to
 * patch the local user store immediately after a successful claim so the
 * claiming effect doesn't refire while Firestore catches up.
 */
export function applyPlateBonusMarker(
  progress = {},
  langKey,
  dayKey,
  at = new Date().toISOString(),
) {
  return {
    ...progress,
    [PLATE_BONUS_FIELD]: {
      ...(progress?.[PLATE_BONUS_FIELD] || {}),
      [langKey]: {
        ...pruneDayEntries(
          progress?.[PLATE_BONUS_FIELD]?.[langKey] || {},
          dayKey,
        ),
        [dayKey]: at,
      },
    },
  };
}

/**
 * Marks today's plate bonus as claimed exactly once per language per day.
 * Returns true only for the writer that won, so the caller knows whether to
 * award the bonus XP. The marker is written before the XP so a race can never
 * double-pay.
 */
export async function claimDailyPlateBonus(npub, targetLang, now = new Date()) {
  if (!npub) return false;
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  if (!dayKey) return false;

  const ref = doc(database, "users", npub);
  let claimed = false;

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() : {};
    if (data?.progress?.[PLATE_BONUS_FIELD]?.[langKey]?.[dayKey]) {
      claimed = false;
      return;
    }
    tx.update(ref, {
      [`progress.${PLATE_BONUS_FIELD}.${langKey}`]: {
        ...pruneDayEntries(
          data?.progress?.[PLATE_BONUS_FIELD]?.[langKey] || {},
          dayKey,
        ),
        [dayKey]: now.toISOString(),
      },
      updatedAt: now.toISOString(),
    });
    claimed = true;
  });

  return claimed;
}
