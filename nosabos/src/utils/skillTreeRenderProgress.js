function getRenderableProgressSignature(progress) {
  return `${progress?.status || ""}:${Math.max(
    0,
    Number(progress?.earnedXp) || 0,
  )}`;
}

/**
 * Keeps per-unit render props referentially stable. Updating one lesson should
 * rerender its unit (and, when it unlocks a boundary, the following unit),
 * not every unit in the selected proficiency level.
 */
export function createUnitRenderProgressSelector() {
  const cache = new Map();

  return function selectUnitRenderProgress(units = [], lessons = {}) {
    const activeUnitIds = new Set();
    const result = units.map((unit, index) => {
      activeUnitIds.add(unit.id);
      const previousUnit = index > 0 ? units[index - 1] : null;
      const previousLesson =
        previousUnit?.lessons?.[previousUnit.lessons.length - 1];
      const previousUnitLastLessonStatus = previousLesson
        ? lessons?.[previousLesson.id]?.status || ""
        : "";
      const signature = [
        previousUnitLastLessonStatus,
        ...(unit.lessons || []).map(
          (lesson) =>
            `${lesson.id}:${getRenderableProgressSignature(
              lessons?.[lesson.id],
            )}`,
        ),
      ].join("|");
      const cached = cache.get(unit.id);
      if (cached?.signature === signature) return cached.value;

      const lessonProgressById = Object.fromEntries(
        (unit.lessons || []).map((lesson) => [
          lesson.id,
          lessons?.[lesson.id],
        ]),
      );
      const value = {
        lessonProgressById,
        previousUnitLastLessonStatus,
      };
      cache.set(unit.id, { signature, value });
      return value;
    });

    for (const unitId of cache.keys()) {
      if (!activeUnitIds.has(unitId)) cache.delete(unitId);
    }
    return result;
  };
}
