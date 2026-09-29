import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_IMMERSION_GENERATION_VERSION, appendImmersionHistory,
  dailyImmersionProgress, generateDailyImmersionTasks,
  getDailyImmersionState, hasImmersionPlacement, nextLocalMidnight, normalizeDailyImmersionTasks,
  requestImmersionOpenAI,
} from "./dailyImmersion.js";
import {
  immersionLessonCandidate, leadingImmersionLesson, summarizeImmersionLesson,
} from "./immersionCurriculumContext.js";

const day = new Date(2026, 8, 24, 12);
const dayKey = "2026-09-24";
const base = {
  targetLang: "de", dayKey, tasks: [1, 2, 3].map((number) => ({ title: `Task ${number}` })),
  completed: [true, false, false], rewarded: false,
};

test("immersion resets with the local quest date, including an old same-day batch", () => {
  assert.equal(nextLocalMidnight(day).getHours(), 0);
  assert.equal(nextLocalMidnight(day).getDate(), 25);
  assert.equal(getDailyImmersionState(base, { dayKey, targetLang: "de" }).status, "ready");
  assert.equal(getDailyImmersionState({ ...base, generationVersion: DAILY_IMMERSION_GENERATION_VERSION - 1,
    completed: [false, false, false] }, { dayKey, targetLang: "de" }).status, "new");
  assert.equal(getDailyImmersionState({ ...base, appLanguage: "en" },
    { dayKey, targetLang: "de", appLanguage: "es" }).status, "new");
  assert.equal(getDailyImmersionState({ ...base, dayKey: undefined,
    generatedAt: new Date(2026, 8, 24, 8).toISOString() },
  { dayKey, targetLang: "de" }).status, "ready");
  assert.equal(getDailyImmersionState(base, {
    dayKey: "2026-09-25", targetLang: "de",
  }).status, "new");
  assert.equal(dailyImmersionProgress(new Date(2026, 8, 24, 0)), 100);
  assert.equal(dailyImmersionProgress(new Date(2026, 8, 24, 12)), 50);
});

test("immersion waits for placement in the current language and refreshes untouched pre-placement tasks", () => {
  assert.equal(hasImmersionPlacement({ proficiencyPlacements: { es: "A2" } }, "es"), true);
  assert.equal(hasImmersionPlacement({ proficiencyPlacements: { es: "A2" } }, "de"), false);
  assert.equal(hasImmersionPlacement({ proficiencyPlacement: "Pre-A1" }, "es"), true);
  assert.equal(hasImmersionPlacement({}, "es"), false);
  const oldBatch = { ...base, completed: [false, false, false],
    generationVersion: DAILY_IMMERSION_GENERATION_VERSION };
  assert.equal(getDailyImmersionState(oldBatch, {
    dayKey, targetLang: "de", placementAt: "2026-09-24T12:00:00.000Z",
  }).status, "new");
  assert.equal(getDailyImmersionState({ ...oldBatch, placementAt: "2026-09-24T12:00:00.000Z" }, {
    dayKey, targetLang: "de", placementAt: "2026-09-24T12:00:00.000Z",
  }).status, "ready");
  assert.equal(getDailyImmersionState({ ...oldBatch, completed: [true, false, false] }, {
    dayKey, targetLang: "de", placementAt: "2026-09-24T12:00:00.000Z",
  }).status, "ready");
});

test("a goal adds a fourth mission while keeping today's first three completions", () => {
  const goal = { id: "goal-1", text: "Read a German recipe" };
  const before = getDailyImmersionState(base, { dayKey, targetLang: "de", goal });
  assert.equal(before.status, "goal_update");
  assert.deepEqual(before.completed, [true, false, false]);
  const withGoal = { ...base, goalId: goal.id, goalText: goal.text,
    tasks: [...base.tasks, { title: "Read a recipe" }],
    completed: [true, false, false, false] };
  assert.equal(getDailyImmersionState(withGoal, { dayKey, targetLang: "de", goal }).tasks.length, 4);
  assert.equal(getDailyImmersionState(withGoal, { dayKey, targetLang: "de" }).status, "goal_removed");
});

test("generation requests three missions, or four with a goal", async () => {
  const calls = [];
  const generate = async (prompt, count) => {
    calls.push({ prompt, count });
    return JSON.stringify({ tasks: Array.from({ length: count }, (_, index) => ({
      title: `Task ${index + 1}`, description: "Use German outside the app.",
    })) });
  };
  const inputs = { targetLang: "de", appLanguage: "en", cefrLevel: "A2", generate };
  assert.equal((await generateDailyImmersionTasks(inputs)).length, 3);
  assert.equal((await generateDailyImmersionTasks({ ...inputs, goalText: "Read a recipe" })).length, 4);
  assert.equal((await generateDailyImmersionTasks({ ...inputs, goalText: "Read a recipe", onlyGoal: true })).length, 1);
  assert.equal(calls.length, 3);
  assert.match(calls[1].prompt, /FOURTH mission/);
  assert.match(calls[2].prompt, /ONE immersion mission/);
});

test("immersion requests rely on the model's default output budget", async () => {
  let calls = 0;
  const send = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls += 1;
    assert.equal(Object.hasOwn(body, "max_output_tokens"), false);
    assert.equal(body.reasoning.effort, "medium");
    return {
      ok: true,
      json: async () => ({ status: "completed", output_text: '{"tasks":[]}' }),
    };
  };
  const result = await requestImmersionOpenAI("prompt", { type: "object", properties: {} },
    "immersion_test", send);
  assert.equal(result, '{"tasks":[]}');
  assert.equal(calls, 1);
});

test("a new learner's Score remains zero in immersion context", async () => {
  let prompt = "";
  await generateDailyImmersionTasks({
    targetLang: "de", appLanguage: "en", score: 0,
    generate: async (value) => {
      prompt = value;
      return { tasks: [1, 2, 3].map((number) => ({
        title: `Task ${number}`, description: `Practice task ${number} privately at home.`,
      })) };
    },
  });
  assert.match(prompt, /"score":0/);
  assert.match(prompt, /"nextMilestone":\{"at":1/);
});

test("lesson context describes its purpose without sending the full curriculum", () => {
  const lesson = {
    title: { en: "Describe past events", es: "Describir el pasado" },
    description: { en: "Tell a brief personal story" },
    cefrLevel: "B1",
    objectives: { communicativeObjectives: ["Can narrate events in sequence."] },
    content: {
      grammar: { focusPoints: ["past tense", "sequence markers"] },
      vocabulary: { focusPoints: ["journeys", "past tense"] },
      stories: { prompt: "A long generation prompt that should not be sent" },
    },
  };
  assert.deepEqual(summarizeImmersionLesson(lesson, "es"), {
    title: "Describir el pasado", description: "Tell a brief personal story",
    level: "B1", objective: "Can narrate events in sequence.",
    focusPoints: ["past tense", "sequence markers", "journeys"],
  });
});

test("immersion uses the further Tutor or Skill Tree lesson within a level", () => {
  const units = [{ lessons: ["one", "two", "three", "four"].map((id) => ({ id })) }];
  const skillTree = immersionLessonCandidate({
    units, level: "A2", mode: "Skill Tree", completedCount: 1,
  });
  const tutor = immersionLessonCandidate({
    units, level: "A2", mode: "Tutor", completedCount: 3,
  });
  assert.equal(skillTree.lesson.id, "two");
  assert.equal(leadingImmersionLesson(skillTree, tutor)?.lesson.id, "four");
  assert.equal(leadingImmersionLesson(skillTree, tutor)?.mode, "Tutor");
  assert.equal(leadingImmersionLesson(tutor, skillTree)?.mode, "Tutor");
});

test("CEFR order wins across levels and cached progress extends a course summary", () => {
  const units = [{ lessons: ["one", "two", "three"].map((id) => ({ id })) }];
  const tutor = immersionLessonCandidate({
    units, level: "A2", mode: "Tutor", completedCount: 2,
  });
  const skillTree = immersionLessonCandidate({
    units, level: "B1", mode: "Skill Tree", completedCount: 0,
  });
  assert.equal(leadingImmersionLesson(skillTree, tutor)?.mode, "Skill Tree");
  const progressedTutor = immersionLessonCandidate({
    units, level: "B1", mode: "Tutor", completedCount: 0,
    progress: { one: { status: "completed" }, two: { status: "in_progress" } },
  });
  assert.equal(progressedTutor.lesson.id, "two");
  assert.equal(leadingImmersionLesson(skillTree, progressedTutor)?.mode, "Tutor");
});

test("a Skill Tree introduction is compared as the actual next lesson", () => {
  const units = [{ lessons: [
    { id: "intro", isTutorial: true }, { id: "regular" },
  ] }];
  const skillTree = immersionLessonCandidate({
    units, level: "Pre-A1", mode: "Skill Tree",
  });
  const tutor = immersionLessonCandidate({
    units, level: "Pre-A1", mode: "Tutor", completedCount: 1,
  });
  assert.equal(skillTree.lesson.id, "intro");
  assert.equal(leadingImmersionLesson(skillTree, tutor)?.mode, "Tutor");
  const stillRequired = immersionLessonCandidate({
    units, level: "B1", mode: "Skill Tree", completedCount: 1,
    priorityLessonId: "intro",
  });
  assert.equal(stillRequired.lesson.id, "intro");
});

test("history keeps the latest 24 distinct tasks", () => {
  const older = Array.from({ length: 24 }, (_, index) => ({ title: `Task ${index}`, description: "" }));
  const next = appendImmersionHistory(older, [older[5], { title: "New task", description: "" }]);
  assert.equal(next.length, 24);
  assert.equal(next.at(-1).title, "New task");
  assert.equal(next.filter((task) => task.title === "Task 5").length, 1);
});

test("a useful new task can reuse a short title without repeating yesterday's action", () => {
  const recent = [{ title: "Listen closely", description: "Listen to a song and note two words." }];
  const tasks = { tasks: [
    { title: "Listen closely", description: "Listen to a weather clip and note one forecast." },
    { title: "Write a note", description: "Write two sentences about your plans." },
    { title: "Read a label", description: "Read one label at home and identify a new word." },
  ] };
  assert.equal(normalizeDailyImmersionTasks(tasks, 3, recent)?.length, 3);
  assert.equal(normalizeDailyImmersionTasks({ tasks: [recent[0], ...tasks.tasks.slice(1)] }, 3, recent), null);
});

test("an unusable model draft fails after one request instead of starting another", async () => {
  let calls = 0;
  await assert.rejects(generateDailyImmersionTasks({
    targetLang: "de", appLanguage: "es", cefrLevel: "B1",
    generate: async () => {
      calls += 1;
      return { tasks: [{ title: "Only one", description: "One task is insufficient." }] };
    },
  }), /failed quality checks/);
  assert.equal(calls, 1);
});
