import {
  collection,
  deleteField,
  doc,
  documentId,
  getDocs,
  getDoc,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { buildDailyGoalResetFields } from "./dailyGoalPet.js";

export const USER_SCHEMA_VERSION = 2;
export const RECENT_DAY_RETENTION = 14;

export const DAILY_ACTIVITY_FIELDS = [
  "lessonDailyActivity",
  "speakDailyActivity",
  "flashcardDailyActivity",
  "conversationDailyActivity",
  "phonicsDailyActivity",
  "repairDailyActivity",
  "plateBonusDailyActivity",
];

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalCalendarDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftDayKey(dayKey, amount) {
  if (!DAY_KEY_RE.test(String(dayKey || ""))) return "";
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day + amount, 12);
  return getLocalCalendarDayKey(date);
}

export function monthKeyFromDayKey(dayKey) {
  return DAY_KEY_RE.test(String(dayKey || "")) ? dayKey.slice(0, 7) : "";
}

export function pruneDayEntries(
  entries = {},
  anchorDayKey = getLocalCalendarDayKey(),
  retention = RECENT_DAY_RETENTION,
) {
  if (!entries || typeof entries !== "object") return {};
  const keep = Math.max(1, Math.floor(Number(retention) || 1));
  const cutoff = shiftDayKey(anchorDayKey, -(keep - 1));
  if (!cutoff) return {};
  return Object.fromEntries(
    Object.entries(entries).filter(
      ([key]) => DAY_KEY_RE.test(key) && key >= cutoff && key <= anchorDayKey,
    ),
  );
}

export function buildDailyXpRecent(
  history = {},
  anchorDayKey = getLocalCalendarDayKey(),
) {
  return Object.fromEntries(
    Object.entries(pruneDayEntries(history, anchorDayKey)).map(([key, value]) => [
      key,
      Math.max(0, Number(value) || 0),
    ]),
  );
}

export function pruneActivityProgress(
  progress = {},
  anchorDayKey = getLocalCalendarDayKey(),
) {
  const next = { ...(progress || {}) };
  // These collections are hydrated separately and are never canonical on the
  // root document. Removing stale copies makes the migration's size win real.
  delete next.languageLessons;
  delete next.tutorLanguageLessons;
  delete next.languageFlashcards;
  DAILY_ACTIVITY_FIELDS.forEach((field) => {
    const byLanguage = progress?.[field];
    if (!byLanguage || typeof byLanguage !== "object") return;
    next[field] = Object.fromEntries(
      Object.entries(byLanguage).map(([lang, days]) => [
        lang,
        pruneDayEntries(days, anchorDayKey),
      ]),
    );
  });
  return next;
}

export function computeGoalStreak(goalDays = []) {
  const days = Array.from(
    new Set((Array.isArray(goalDays) ? goalDays : []).filter((day) => DAY_KEY_RE.test(day))),
  ).sort();
  if (!days.length) return { goalStreakCount: 0, lastGoalDayKey: "" };

  let count = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (shiftDayKey(days[index], -1) !== days[index - 1]) break;
    count += 1;
  }
  return {
    goalStreakCount: count,
    lastGoalDayKey: days[days.length - 1],
  };
}

export function getNextGoalSummary(data = {}, todayKey) {
  const previousDay = shiftDayKey(todayKey, -1);
  const lastGoalDayKey = String(data?.lastGoalDayKey || "");
  if (lastGoalDayKey === todayKey) {
    return {
      goalStreakCount: Math.max(1, Number(data?.goalStreakCount) || 1),
      lastGoalDayKey,
    };
  }
  return {
    goalStreakCount:
      lastGoalDayKey === previousDay
        ? Math.max(0, Number(data?.goalStreakCount) || 0) + 1
        : 1,
    lastGoalDayKey: todayKey,
  };
}

export function questDayDocumentId(langKey, dayKey) {
  return `${String(langKey || "es").trim().toLowerCase()}_${dayKey}`;
}

function hasLegacyRootData(data = {}) {
  return Boolean(
    data.dailyQuestBlueprint ||
      data.dailyQuestRepair ||
      data.dailyQuestExplanations ||
      data.dailyXpHistory ||
      data.completedGoalDates ||
      data.companionMemory,
  );
}

function collectQuestMigrations(data = {}) {
  const byDocument = new Map();
  const fields = [
    ["dailyQuestBlueprint", "blueprint"],
    ["dailyQuestRepair", "repair"],
    ["dailyQuestExplanations", "explanation"],
  ];

  fields.forEach(([legacyField, targetField]) => {
    Object.entries(data?.[legacyField] || {}).forEach(([lang, days]) => {
      const recentKeys = Object.keys(days || {})
        .filter((key) => DAY_KEY_RE.test(key))
        .sort()
        .slice(-3);
      recentKeys.forEach((dayKey) => {
        const id = questDayDocumentId(lang, dayKey);
        const current = byDocument.get(id) || {
          id,
          lang: String(lang).toLowerCase(),
          dayKey,
        };
        current[targetField] = days[dayKey];
        byDocument.set(id, current);
      });
    });
  });
  return Array.from(byDocument.values());
}

function collectXpMonths(data = {}) {
  const months = new Map();
  Object.entries(data?.dailyXpHistory || {}).forEach(([dayKey, xp]) => {
    const monthKey = monthKeyFromDayKey(dayKey);
    if (!monthKey) return;
    const bucket = months.get(monthKey) || { days: {}, goalDays: [] };
    bucket.days[dayKey] = Math.max(0, Number(xp) || 0);
    months.set(monthKey, bucket);
  });
  (Array.isArray(data?.completedGoalDates) ? data.completedGoalDates : []).forEach(
    (dayKey) => {
      const monthKey = monthKeyFromDayKey(dayKey);
      if (!monthKey) return;
      const bucket = months.get(monthKey) || { days: {}, goalDays: [] };
      bucket.goalDays.push(dayKey);
      months.set(monthKey, bucket);
    },
  );
  return months;
}

export async function migrateUserToSchemaV2(database, npub, knownData = null) {
  if (!database || !npub) return null;
  if (
    knownData &&
    Number(knownData.schemaVersion || 1) >= USER_SCHEMA_VERSION &&
    !hasLegacyRootData(knownData)
  ) {
    return knownData;
  }
  const userRef = doc(database, "users", npub);

  await runTransaction(database, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;
    const data = userSnap.data() || {};
    if (
      Number(data.schemaVersion || 1) >= USER_SCHEMA_VERSION &&
      !hasLegacyRootData(data)
    ) {
      return;
    }

    const todayKey = getLocalCalendarDayKey();
    const quests = collectQuestMigrations(data);
    const xpMonths = collectXpMonths(data);
    const companionEntries = Object.entries(data?.companionMemory || {});
    const questRefs = quests.map((item) =>
      doc(database, "users", npub, "questDays", item.id),
    );
    const xpRefs = Array.from(xpMonths.keys()).map((monthKey) =>
      doc(database, "users", npub, "xpHistory", monthKey),
    );
    const companionRefs = companionEntries.map(([lang]) =>
      doc(database, "users", npub, "companion", String(lang).toLowerCase()),
    );
    const childSnaps = await Promise.all(
      [...questRefs, ...xpRefs, ...companionRefs].map((ref) => tx.get(ref)),
    );
    let cursor = 0;

    quests.forEach((item, index) => {
      const existing = childSnaps[cursor + index]?.data?.() || {};
      tx.set(
        questRefs[index],
        {
          ...item,
          ...existing,
          ...(item.blueprint !== undefined
            ? { blueprint: existing.blueprint ?? item.blueprint }
            : {}),
          ...(item.repair !== undefined
            ? { repair: existing.repair ?? item.repair }
            : {}),
          ...(item.explanation !== undefined
            ? { explanation: existing.explanation ?? item.explanation }
            : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    });
    cursor += questRefs.length;

    Array.from(xpMonths.entries()).forEach(([monthKey, legacy], index) => {
      const existing = childSnaps[cursor + index]?.data?.() || {};
      const mergedDays = { ...(existing.days || {}) };
      Object.entries(legacy.days).forEach(([dayKey, xp]) => {
        mergedDays[dayKey] = Math.max(Number(mergedDays[dayKey]) || 0, xp);
      });
      const goalDays = Array.from(
        new Set([...(existing.goalDays || []), ...legacy.goalDays]),
      ).sort();
      tx.set(
        xpRefs[index],
        { days: mergedDays, goalDays, monthKey, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    });
    cursor += xpRefs.length;

    companionEntries.forEach(([lang, bucket], index) => {
      const existing = childSnaps[cursor + index]?.data?.() || {};
      tx.set(
        companionRefs[index],
        { ...bucket, ...existing, lang: String(lang).toLowerCase() },
        { merge: true },
      );
    });

    const combinedRecent = { ...(data.dailyXpRecent || {}) };
    Object.entries(data.dailyXpHistory || {}).forEach(([dayKey, xp]) => {
      combinedRecent[dayKey] = Math.max(
        Number(combinedRecent[dayKey]) || 0,
        Number(xp) || 0,
      );
    });
    const completedGoalDates = Array.isArray(data.completedGoalDates)
      ? data.completedGoalDates
      : [];
    const legacyStreak = completedGoalDates.length
      ? computeGoalStreak(completedGoalDates)
      : {
          goalStreakCount: Math.max(0, Number(data.goalStreakCount) || 0),
          lastGoalDayKey: String(data.lastGoalDayKey || ""),
        };
    const existingLastGoal = String(data.lastGoalDayKey || "");
    const computedStreak =
      existingLastGoal >= legacyStreak.lastGoalDayKey
        ? {
            goalStreakCount:
              existingLastGoal === legacyStreak.lastGoalDayKey
                ? Math.max(
                    legacyStreak.goalStreakCount,
                    Math.max(0, Number(data.goalStreakCount) || 0),
                  )
                : Math.max(0, Number(data.goalStreakCount) || 0),
            lastGoalDayKey: existingLastGoal,
          }
        : legacyStreak;
    const petReconciliation = buildDailyGoalResetFields(data, new Date(), {
      resetWindow: false,
    });

    tx.update(userRef, {
      schemaVersion: USER_SCHEMA_VERSION,
      dailyXpRecent: buildDailyXpRecent(combinedRecent, todayKey),
      ...computedStreak,
      ...petReconciliation,
      progress: pruneActivityProgress(data.progress || {}, todayKey),
      dailyQuestBlueprint: deleteField(),
      dailyQuestRepair: deleteField(),
      dailyQuestExplanations: deleteField(),
      dailyXpHistory: deleteField(),
      completedGoalDates: deleteField(),
      companionMemory: deleteField(),
      updatedAt: new Date().toISOString(),
    });
  });

  const migrated = await getDoc(userRef);
  return migrated.exists() ? { id: migrated.id, ...migrated.data() } : null;
}

export async function fetchXpHistoryForYear(database, npub, year) {
  if (!database || !npub || !/^\d{4}$/.test(String(year))) {
    return { days: {}, goalDays: [] };
  }
  const start = `${year}-01`;
  const end = `${year}-12`;
  const snapshot = await getDocs(
    query(
      collection(database, "users", npub, "xpHistory"),
      where(documentId(), ">=", start),
      where(documentId(), "<=", end),
    ),
  );
  const days = {};
  const goalDays = new Set();
  snapshot.forEach((monthSnap) => {
    const data = monthSnap.data() || {};
    Object.assign(days, data.days || {});
    (Array.isArray(data.goalDays) ? data.goalDays : []).forEach((day) =>
      goalDays.add(day),
    );
  });
  return { days, goalDays: Array.from(goalDays).sort() };
}
