// Keep the bootstrap fixture small; the test checks these against the live
// performance model's public Score projection.
const TEST_SCORE_ELO = 2200;
const TEST_SCORE_SCALE_VERSION = 4;

const identity = import.meta.env?.DEV &&
  import.meta.env?.VITE_DEV_TEST_NSEC && import.meta.env?.VITE_DEV_TEST_NPUB
  ? { nsec: import.meta.env.VITE_DEV_TEST_NSEC, npub: import.meta.env.VITE_DEV_TEST_NPUB }
  : null;

// A local UI fixture: the normal Firestore account document is never changed.
// At 9,900 language XP, getCompanionLevelFromXp resolves to level 100.
export function withDevTestProgress(user, storage, testAccount = identity) {
  if (!testAccount || !user || !storage ||
      storage.getItem("local_nsec") !== testAccount.nsec ||
      storage.getItem("local_npub") !== testAccount.npub ||
      (user.local_npub || user.id) !== testAccount.npub) return user;

  const progress = user.progress || {};
  const lang = String(progress.targetLang || "es").toLowerCase();
  const intelligence = user.learningIntelligence || {};
  const bucket = intelligence[lang] || {};
  return {
    ...user,
    progress: {
      ...progress,
      targetLang: lang,
      totalXp: Math.max(Number(progress.totalXp) || 0, 9900),
      languageXp: { ...(progress.languageXp || {}), [lang]: 9900 },
    },
    learningIntelligence: {
      ...intelligence,
      [lang]: {
        ...bucket,
        elo: { ...(bucket.elo || {}), rating: TEST_SCORE_ELO, scaleVersion: TEST_SCORE_SCALE_VERSION },
      },
    },
  };
}
