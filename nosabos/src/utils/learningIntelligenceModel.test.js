import test from "node:test";
import assert from "node:assert/strict";
import {
  activeGoalFor,
  changeGoal,
  compactSummary,
  mergeEvidence,
  composeQuestKinds,
  normalizeGoalBlueprint,
  buildGoalLesson,
  goalInstructions,
  GOAL_MODES,
  GOAL_MODE_TARGETS,
  GOAL_SURFACES,
  goalModesFor,
  goalModeTarget,
  selectGoalModes,
  words,
} from "./learningIntelligenceModel.js";

const goal = {
  id: "grandmother",
  text: "Talk with my grandmother about her childhood",
  status: "active",
};
const context = {
  goal,
  targetLang: "es",
  dayKey: "2026-09-09",
  cefrLevel: "Pre-A1",
};
test("an active per-language goal is derived once, after Repair, including first-day and carry-over plates", () => {
  const user = {
    learningIntelligence: {
      es: { activeGoal: goal },
      fr: { activeGoal: { ...goal, status: "paused" } },
    },
  };
  assert.equal(activeGoalFor(user, "ES"), goal);
  assert.equal(activeGoalFor(user, "fr"), null);
  assert.equal(activeGoalFor(user, "de"), null);
  assert.deepEqual(
    composeQuestKinds(
      ["goal", "speak", "repair", "learn"],
      ["goal", "repair", "review"],
      true,
      true,
    ),
    ["repair", "goal", "review", "speak", "learn"],
  );
  assert.deepEqual(
    composeQuestKinds(["speak", "learn", "review"], [], false, true),
    ["goal", "speak", "learn", "review"],
  );
  assert.deepEqual(
    composeQuestKinds(["goal", "learn"], ["goal", "repair"], false, false),
    ["learn"],
  );
});
test("pause/resume retains identity and evidence; replacing or clearing resets only goal progress", () => {
  const first = changeGoal(
    { repairSummary: { prose: "keep repair" } },
    { text: goal.text, id: "one" },
  );
  first.goalProgress.demonstrated = ["asked a question"];
  const paused = changeGoal(first, {
    text: goal.text,
    status: "paused",
    id: "unused",
  });
  assert.equal(paused.activeGoal.id, "one");
  assert.deepEqual(paused.goalProgress.demonstrated, ["asked a question"]);
  const replaced = changeGoal(paused, {
    text: "Participate in work meetings",
    id: "two",
  });
  assert.equal(replaced.activeGoal.id, "two");
  assert.deepEqual(replaced.goalProgress.demonstrated, []);
  assert.deepEqual(replaced.repairSummary, first.repairSummary);
  assert.equal(
    changeGoal(replaced, { text: "", id: "three" }).activeGoal,
    null,
  );
});
test("both summary contracts are bounded even with huge or malformed model data", () => {
  for (const kind of ["repair", "goal"]) {
    const giant = Array.from({ length: 100 }, () => ({
      target: "word ".repeat(1000),
      example: "answer ".repeat(1000),
      lastSeen: "2026-09-09",
    }));
    const summary = compactSummary(
      {
        openPatterns: giant,
        recentlyRepaired: giant,
        effectiveSupports: giant,
        demonstrated: giant,
        openCapabilities: giant,
        usefulLanguage: giant,
        modeEvidence: giant,
        eventIds: giant.map((_, i) => String(i)),
        prose: "diary ".repeat(10000),
      },
      kind,
    );
    assert.ok(summary.wordCount <= 200);
    assert.equal(summary.wordCount, words(summary.prose).length);
    assert.ok(summary.eventIds.length <= 24);
    for (const [key, value] of Object.entries(summary))
      if (Array.isArray(value) && key !== "eventIds")
        assert.ok(value.length <= (key === "openPatterns" ? 3 : 4));
    assert.ok(JSON.stringify(summary).length < 12000);
  }
});
test("repair evidence resolves exact patterns, tracks support, deduplicates and drops stale assumptions", () => {
  const now = "2026-09-09T12:00:00.000Z";
  const mistake = {
    id: "miss",
    target: "past question",
    expectedAnswer: "¿Dónde vivías?",
    mode: "tutor",
    domain: "grammar",
    success: false,
  };
  let summary = mergeEvidence({}, mistake, "repair", now);
  summary = mergeEvidence(summary, { ...mistake, id: "miss2" }, "repair", now);
  assert.equal(summary.openPatterns[0].recurrence, 2);
  const completeOnly = mergeEvidence(
    summary,
    { ...mistake, id: "exposure", success: true },
    "repair",
    now,
  );
  assert.equal(completeOnly.recentlyRepaired.length, 0);
  const repaired = mergeEvidence(
    summary,
    {
      ...mistake,
      id: "correct",
      success: true,
      observation: "¿Dónde vivías?",
      support: "prompted",
    },
    "repair",
    now,
  );
  assert.equal(repaired.openPatterns.length, 0);
  assert.equal(repaired.recentlyRepaired[0].stage, "prompted");
  assert.deepEqual(
    mergeEvidence(repaired, { ...mistake, id: "correct" }, "repair", now),
    repaired,
  );
  const later = mergeEvidence(
    summary,
    { ...mistake, id: "later", target: "new target" },
    "repair",
    "2026-12-09T12:00:00.000Z",
  );
  assert.deepEqual(
    later.openPatterns.map((e) => e.target),
    ["new target"],
  );
});
test("goal summaries move successful performance toward transfer without claiming mastery from exposure", () => {
  let summary = mergeEvidence(
    {},
    {
      id: "1",
      target: "ask about childhood",
      mode: "conversation",
      success: true,
    },
    "goal",
  );
  assert.equal(summary.demonstrated.length, 0);
  summary = mergeEvidence(
    summary,
    {
      id: "2",
      target: "ask about childhood",
      mode: "conversation",
      success: true,
      observation: "Asked where she lived as a child",
      support: "independent",
    },
    "goal",
  );
  assert.equal(summary.demonstrated[0].stage, "independent");
  assert.match(summary.nextGoalGuidance.target, /Transfer/);
  assert.match(summary.nextGoalGuidance.avoid, /Do not repeat/);
});
test("every top-level mode routes to a real surface; malformed sound/card plans fall back to Tutor", () => {
  for (const mode of GOAL_MODES) {
    const blueprint = normalizeGoalBlueprint(
      { mode, targetLanguage: ["¿Dónde vivías?"] },
      context,
    );
    assert.equal(blueprint.mode, mode);
    assert.ok(blueprint.modes.length >= 2 && blueprint.modes.length <= 5);
    assert.equal(new Set(blueprint.modes).size, blueprint.modes.length);
    assert.ok(GOAL_SURFACES[mode]);
    assert.equal(blueprint.target, 1);
    assert.equal(blueprint.goalText, goal.text);
  }
  for (const raw of [
    null,
    { mode: "unknown" },
    { mode: "phonics" },
    { mode: "flashcards" },
  ]) {
    const fallback = normalizeGoalBlueprint(raw, context);
    assert.equal(fallback.mode, "tutor");
    assert.ok(fallback.objective.includes(goal.text));
  }
});
test("Goal bundles are stable per day and carry the requested modality targets", () => {
  const first = selectGoalModes({
    goalId: goal.id,
    dayKey: context.dayKey,
    preferredMode: "conversation",
  });
  assert.deepEqual(
    selectGoalModes({
      goalId: goal.id,
      dayKey: context.dayKey,
      preferredMode: "conversation",
    }),
    first,
  );
  assert.equal(first[0], "conversation");
  assert.ok(first.length >= 2 && first.length <= GOAL_MODES.length);
  assert.deepEqual(
    Object.fromEntries(GOAL_MODES.map((mode) => [mode, goalModeTarget(mode)])),
    GOAL_MODE_TARGETS,
  );
  const blueprint = normalizeGoalBlueprint(
    { mode: "conversation", targetLanguage: ["¿Dónde vivías?"] },
    context,
  );
  assert.deepEqual(goalModesFor(blueprint), blueprint.modes);
});
test("all five lesson modules at every CEFR level receive exact targets and the goal stretch policy", () => {
  for (const cefrLevel of ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]) {
    const blueprint = normalizeGoalBlueprint(
      { mode: "lesson", targetLanguage: ["¿Dónde vivías?"] },
      { ...context, cefrLevel },
    );
    const lesson = buildGoalLesson(blueprint);
    assert.equal(lesson.xpReward, 20);
    assert.deepEqual(lesson.modes, [
      "vocabulary",
      "grammar",
      "reading",
      "stories",
      "realtime",
    ]);
    for (const content of Object.values(lesson.content)) {
      assert.deepEqual(content.words, ["¿Dónde vivías?"]);
      assert.match(content.levelGuard, /MAY exceed/);
    }
    assert.equal(lesson.isRepair, undefined);
    assert.match(goalInstructions(blueprint), /CEFR .* scaffolding only/);
  }
});


test("XP attribution protects ephemeral ids after focus loss and preserves in-flight curriculum awards", async () => {
  const { practiceXpAttribution } = await import("./learningIntelligenceModel.js");
  const focus = { blueprint: { mode: "lesson" } };
  assert.deepEqual(practiceXpAttribution({ skillTreeLessonId: "goal-id-day" }, null, null), { source: "goalLesson", skillTreeLessonId: "" });
  assert.deepEqual(practiceXpAttribution({ skillTreeLessonId: "repair-es-day-s0" }, null, null), { source: "repairLesson", skillTreeLessonId: "" });
  assert.deepEqual(practiceXpAttribution({ skillTreeLessonId: "a1-unit1-lesson1", source: "lesson" }, focus, null), { source: "lesson", skillTreeLessonId: "a1-unit1-lesson1" });
  assert.deepEqual(practiceXpAttribution({}, { blueprint: { mode: "tutor" } }, null), { source: "goaltutor", skillTreeLessonId: "" });
});
