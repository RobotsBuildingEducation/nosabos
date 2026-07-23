function getAgendaItemId(item, index) {
  return String(item?.id || `agenda-item-${index}`).trim();
}

export function isLegacyTutorAgendaProgress(
  schemaVersion,
  currentSchemaVersion,
) {
  const savedVersion = Number(schemaVersion);
  const currentVersion = Number(currentSchemaVersion);
  return (
    Number.isFinite(currentVersion) &&
    currentVersion > 0 &&
    (!Number.isFinite(savedVersion) || savedVersion < currentVersion)
  );
}

export function normalizeTutorAgendaProgress(items = [], progress = {}) {
  const allowedIds = new Set(
    (Array.isArray(items) ? items : []).map(getAgendaItemId).filter(Boolean),
  );

  return Object.entries(progress || {}).reduce((normalized, [id, complete]) => {
    if (complete === true && allowedIds.has(id)) normalized[id] = true;
    return normalized;
  }, {});
}

export function getTutorAgendaSnapshot(items = [], progress = {}) {
  const agendaItems = Array.isArray(items) ? items : [];
  const normalizedProgress = normalizeTutorAgendaProgress(
    agendaItems,
    progress,
  );
  const completedItems = agendaItems.filter(
    (item, index) => normalizedProgress[getAgendaItemId(item, index)],
  );
  const currentItem = agendaItems.find(
    (item, index) => !normalizedProgress[getAgendaItemId(item, index)],
  );

  return {
    phase: currentItem ? "teach" : "review",
    currentItem: currentItem || null,
    completedItems,
    remainingItems: currentItem
      ? agendaItems.slice(agendaItems.indexOf(currentItem))
      : [],
    progress: normalizedProgress,
    isComplete: agendaItems.length > 0 && !currentItem,
  };
}

export function advanceTutorAgendaProgress(items = [], progress = {}) {
  const snapshot = getTutorAgendaSnapshot(items, progress);
  if (!snapshot.currentItem) {
    return { ...snapshot, advancedItem: null };
  }

  const currentIndex = items.indexOf(snapshot.currentItem);
  const currentId = getAgendaItemId(snapshot.currentItem, currentIndex);
  const nextProgress = { ...snapshot.progress, [currentId]: true };
  return {
    ...getTutorAgendaSnapshot(items, nextProgress),
    advancedItem: snapshot.currentItem,
  };
}

export function advanceTutorQuizAttempt(
  items = [],
  progress = {},
  correctItems = {},
  { correct = false, passingScore = 1 } = {},
) {
  const next = advanceTutorAgendaProgress(items, progress);
  if (!next.advancedItem) {
    return {
      ...next,
      correctItems: { ...correctItems },
      score: Object.keys(correctItems || {}).length,
      passed: false,
      failed: false,
    };
  }

  const scoredItems = { ...(correctItems || {}) };
  if (correct) scoredItems[next.advancedItem.id] = true;
  const score = Object.keys(scoredItems).length;
  const threshold = Math.max(1, Number(passingScore) || 1);
  const passed = next.isComplete && score >= threshold;
  const failed = next.isComplete && !passed;

  return {
    ...next,
    // A failed attempt restarts at question 1. A passed attempt retains its
    // completed cursor until lesson completion is committed.
    progress: failed ? {} : next.progress,
    correctItems: failed ? {} : scoredItems,
    score,
    passed,
    failed,
  };
}
