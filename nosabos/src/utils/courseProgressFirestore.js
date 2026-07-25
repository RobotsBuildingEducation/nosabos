import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  COURSE_PROGRESS_COLLECTION,
  buildCourseProgressSummary,
  getProgressDocumentLevel,
  mergeCourseProgressSummaries,
} from "./courseProgress.js";

const MIGRATION_BATCH_SIZE = 400;

function toEntry(documentSnapshot, data = documentSnapshot.data()) {
  return {
    id: documentSnapshot.id,
    data,
    ref: documentSnapshot.ref,
  };
}

function toProgressMap(entries, idField) {
  return entries.reduce((map, entry) => {
    const id = entry?.data?.[idField];
    if (id) map[id] = entry.data;
    return map;
  }, {});
}

async function commitMigrationWrites(database, writes) {
  for (let index = 0; index < writes.length; index += MIGRATION_BATCH_SIZE) {
    const batch = writeBatch(database);
    writes.slice(index, index + MIGRATION_BATCH_SIZE).forEach((write) => {
      batch.set(write.ref, write.data, { merge: true });
    });
    await batch.commit();
  }
}

/**
 * Reads one compact summary during normal startup. Accounts created before the
 * summary schema pay the old full-read cost once; that pass also adds
 * queryable CEFR fields to their existing progress documents.
 */
export async function hydrateCourseProgress(
  database,
  userId,
  targetLang = "es",
) {
  const languageKey = String(targetLang || "es").toLowerCase();
  const summaryRef = doc(
    database,
    "users",
    userId,
    COURSE_PROGRESS_COLLECTION,
    languageKey,
  );
  const summarySnapshot = await getDoc(summaryRef);
  if (
    summarySnapshot.exists() &&
    summarySnapshot.data()?.migration?.complete === true
  ) {
    return {
      summary: summarySnapshot.data(),
      languageLessons: {},
      tutorLanguageLessons: {},
      languageFlashcards: {},
      migrated: false,
    };
  }

  const [lessonSnapshot, tutorSnapshot, flashcardSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(database, "users", userId, "languageLessons"),
        where("targetLang", "==", languageKey),
      ),
    ),
    getDocs(
      query(
        collection(database, "users", userId, "tutorLanguageLessons"),
        where("targetLang", "==", languageKey),
      ),
    ),
    getDocs(
      query(
        collection(database, "users", userId, "languageFlashcards"),
        where("targetLang", "==", languageKey),
      ),
    ),
  ]);

  const languageLessons = [];
  const legacyTutorLessons = [];
  lessonSnapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    const entry = toEntry(documentSnapshot, data);
    if (data?.tutorAgendaProgress) legacyTutorLessons.push(entry);
    else languageLessons.push(entry);
  });

  const tutorLanguageLessons = [];
  tutorSnapshot.forEach((documentSnapshot) => {
    tutorLanguageLessons.push(toEntry(documentSnapshot));
  });

  const languageFlashcards = [];
  flashcardSnapshot.forEach((documentSnapshot) => {
    languageFlashcards.push(toEntry(documentSnapshot));
  });

  const migrationWrites = [];
  [
    ["skillTree", languageLessons],
    ["tutor", legacyTutorLessons],
    ["tutor", tutorLanguageLessons],
    ["flashcards", languageFlashcards],
  ].forEach(([mode, entries]) => {
    entries.forEach((entry) => {
      const level = getProgressDocumentLevel(mode, entry.data, entry.id);
      if (level && entry.data?.cefrLevel !== level) {
        entry.data = { ...entry.data, cefrLevel: level };
        migrationWrites.push({
          ref: entry.ref,
          data: { cefrLevel: level },
        });
      }
    });
  });

  // Move old Tutor-owned records into the dedicated collection. Keeping the
  // legacy source document is intentional and makes the migration recoverable.
  legacyTutorLessons.forEach((entry) => {
    const lessonId = entry.data?.lessonId;
    if (!lessonId) return;
    migrationWrites.push({
      ref: doc(
        database,
        "users",
        userId,
        "tutorLanguageLessons",
        `${languageKey}_${lessonId}`,
      ),
      data: entry.data,
    });
  });

  await commitMigrationWrites(database, migrationWrites);

  const allTutorLessons = [...legacyTutorLessons, ...tutorLanguageLessons];
  const summary = buildCourseProgressSummary({
    targetLang: languageKey,
    languageLessons,
    tutorLanguageLessons: allTutorLessons,
    languageFlashcards,
  });
  const persistedSummary = await runTransaction(
    database,
    async (transaction) => {
      const currentSnapshot = await transaction.get(summaryRef);
      const currentSummary = currentSnapshot.exists()
        ? currentSnapshot.data()
        : null;
      if (currentSummary?.migration?.complete === true) {
        return currentSummary;
      }

      const mergedSummary = mergeCourseProgressSummaries(
        summary,
        currentSummary,
      );
      transaction.set(summaryRef, {
        ...mergedSummary,
        migratedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return mergedSummary;
    },
  );

  return {
    summary: persistedSummary,
    languageLessons: toProgressMap(languageLessons, "lessonId"),
    tutorLanguageLessons: toProgressMap(allTutorLessons, "lessonId"),
    languageFlashcards: toProgressMap(languageFlashcards, "cardId"),
    migrated: true,
  };
}
