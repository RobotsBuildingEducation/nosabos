import { learningCompletionCounters } from "../achievements/learningCounts.js";
import { levelKey } from "../achievements/progressionEvidence.js";
import { goalModesFor, goalModeTarget } from "./learningIntelligenceModel.js";

// Inputs come from confirmed Firestore snapshots, never placement or preview state.
export function piyaliCompletionProof({ profile, summary, quest, language, dayKey }) {
  const events = [];
  const curriculum = summary?.migration?.complete === true ? summary : null;
  const goal = profile.learningIntelligence?.[language]?.dailyGoal;
  const modes = goalModesFor(goal?.blueprint);
  if (goal?.completed === true && modes.length && modes.every(mode => Number(goal.modeProgress?.[mode]) >= goalModeTarget(mode)) && goal.blueprint?.cefrLevel) {
    events.push({ metric: `goals:${levelKey(goal.blueprint.cefrLevel)}`, id: `${language}:${goal.blueprint.dayKey}:${goal.blueprint.goalId}` });
  }
  const repair = quest?.repair;
  const repairedCount = Number(profile.progress?.repairDailyActivity?.[language]?.[dayKey]) || 0;
  if (repair?.items?.length && repairedCount >= Math.max(repair.items.length, Number(repair.target) || 0)) {
    for (const cefr of new Set(repair.items.map(item => item.cefrLevel).filter(Boolean))) {
      events.push({ metric: `repairs:${levelKey(cefr)}`, id: `${language}:${dayKey}:${repair.createdAt}` });
    }
  }
  const immersion = profile.realWorldTasks;
  if (immersion?.targetLang === language && immersion.generatedAt && immersion.tasks?.length) {
    immersion.tasks.forEach((_, index) => {
      if (immersion.completed?.[index] === true) events.push({ metric: "immersion_tasks", id: `${language}:${immersion.dayKey}:${immersion.generatedAt}:${index}` });
    });
    if (immersion.rewarded && immersion.tasks.every((_, index) => immersion.completed?.[index] === true)) {
      events.push({ metric: "immersion_checklists", id: `${language}:${immersion.dayKey}` });
    }
  }
  return { events, evidence: {
    language,
    levels: curriculum
      ? Object.fromEntries(["tutor", "skillTree", "flashcards"].map(mode => [mode, curriculum[mode]?.levels || {}])) : {},
    counters: learningCompletionCounters(curriculum),
  } };
}
