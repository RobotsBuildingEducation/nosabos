const curriculumLoaders = {
  de: () => import("./de.js"),
  el: () => import("./el.js"),
  en: () => import("./en.js"),
  fr: () => import("./fr.js"),
  ga: () => import("./ga.js"),
  it: () => import("./it.js"),
  ja: () => import("./ja.js"),
  nl: () => import("./nl.js"),
  pl: () => import("./pl.js"),
  pt: () => import("./pt.js"),
  ru: () => import("./ru.js"),
};

const curriculumCache = new Map();

function mergeLessonOverrides(base, overrides = {}) {
  const merged = { ...(base || {}) };
  Object.entries(overrides || {}).forEach(([lessonId, items]) => {
    merged[lessonId] = { ...(merged[lessonId] || {}), ...items };
  });
  return merged;
}

export async function loadTargetCurriculum(targetLang) {
  const languageKey = String(targetLang || "es").toLowerCase();
  const loader = curriculumLoaders[languageKey];
  if (!loader) return undefined;
  if (curriculumCache.has(languageKey)) {
    return curriculumCache.get(languageKey);
  }

  const pending = Promise.all([
    loader(),
    import("./alignmentOverrides.js"),
    import("./repairOverrides.js"),
  ])
    .then(([module, alignmentModule, repairModule]) =>
      mergeLessonOverrides(
        mergeLessonOverrides(
          module.default,
          alignmentModule.ALIGNMENT_TARGET_OVERRIDES[languageKey],
        ),
        repairModule.REPAIR_TARGET_OVERRIDES[languageKey],
      ),
    )
    .catch((error) => {
      curriculumCache.delete(languageKey);
      throw error;
    });
  curriculumCache.set(languageKey, pending);
  return pending;
}
