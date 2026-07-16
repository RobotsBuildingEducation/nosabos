function getAgendaItemId(item, index) {
  return String(item?.id || `agenda-item-${index}`).trim();
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
