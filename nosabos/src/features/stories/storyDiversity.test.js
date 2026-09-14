import test from "node:test";
import assert from "node:assert/strict";
import { createStoryPlan, recordStoryHistory, getStoryHistory, buildStoryDiversityPrompt, getStoryNoveltyIssues } from "./storyDiversity.js";
import { generatePracticeStory, parsePracticeStory } from "./practiceStoryGeneration.js";
import { generateStorySession } from "./storyGeneration.js";

const lessonContent = { topic: "family", storySubjects: ["cousin", "aunt", "uncle", "grandparent"].map((id) => ({ id, name: id })) };
const identity = { npub: "variety-test", targetLang: "en", lessonId: "family" };
const visit = { title: "Family visit", target: "I visit my grandparents today. My grandfather is at the door. We have fresh bread for lunch. The afternoon is warm and sunny." };

test("a reused opening is rejected even when most of the new episode is different", () => {
  const plan = { targetLang: "en", recentEntries: [{ targetText: visit.target }] };
  const candidate = { title: "A new title", target: "Hello! I visit my grandparents today. My aunt needs a ticket for tomorrow. Her son is at school. The timetable has changed." };
  assert.match(getStoryNoveltyIssues(candidate, plan)[0], /repeated_opening/);
});

test("history survives a module reload and disabled storage still works", async () => {
  const previous = globalThis.window;
  const saved = new Map();
  globalThis.window = { localStorage: { getItem: (key) => saved.get(key), setItem: (key, value) => saved.set(key, value) } };
  try {
    const plan = createStoryPlan({ ...identity, npub: "reload-check", lessonContent, mode: "practice" });
    recordStoryHistory(plan, visit);
    const reloaded = await import("./storyDiversity.js?storage-test");
    assert.equal(reloaded.getStoryHistory(plan)[0].targetText, visit.target);
    Object.defineProperty(globalThis.window, "localStorage", { get() { throw new Error("Storage disabled"); } });
    recordStoryHistory(plan, { ...visit, title: "Stored in memory" });
    assert.equal(getStoryHistory(plan)[0].title, "Stored in memory");
  } finally {
    if (previous === undefined) delete globalThis.window; else globalThis.window = previous;
  }
});

test("Practice, Call, and Story share actual content and rotate subjects across modes", () => {
  const selected = [];
  for (const mode of ["practice", "radio", "conversation", "practice"]) {
    const plan = createStoryPlan({ ...identity, lessonContent, mode });
    selected.push(plan.subject.id);
    if (selected.length > 1) assert.ok(plan.recentEntries.some((entry) => entry.targetText === visit.target));
    recordStoryHistory(plan, visit);
  }
  assert.equal(new Set(selected).size, 4);
  assert.equal(getStoryHistory({ ...identity, targetLang: "ja" }).length, 0);
  assert.equal(getStoryHistory({ ...identity, npub: "different-learner" }).length, 0);
  const plan = createStoryPlan({ ...identity, lessonContent, mode: "radio" });
  assert.ok(getStoryNoveltyIssues({ ...visit, target: `Hello! ${visit.target}` }, plan).length);
  assert.match(buildStoryDiversityPrompt(plan), /Practice, Call, and Story together/);
  assert.doesNotMatch(buildStoryDiversityPrompt(plan), /no scripts|no dialogue/i);
  assert.doesNotMatch(buildStoryDiversityPrompt(plan), /I visit my grandparents today/, "Comparison text stays out of the writer's prompt");
});

const raw = (opening = "This photograph is old.") => [opening, "My aunt is in the photograph.", "Is this child your cousin?", "Yes, she is three here.", "Your uncle has a big camera.", "He takes our pictures.", "I want a picture with him.", "Put the album on this table."].map((tgt, i) => JSON.stringify({ type: "sentence", character: i % 2 ? "Neko" : "You", tgt })).join("\n") + '\n{"type":"done"}';

test("practice rejects a semantic repeat and passes the accepted complete draft to the UI", async () => {
  const plan = createStoryPlan({ ...identity, npub: "practice-review", lessonContent, mode: "practice" });
  const prompts = []; let reviews = 0;
  const result = await generatePracticeStory({ prompt: "Family dialogue", plan,
    generate: async (prompt) => { prompts.push(prompt); return raw(prompts.length === 1 ? "Grandpa is visiting today." : undefined); },
    review: async () => ++reviews === 1 ? ["Repeated family-visit premise; develop a different family situation."] : [],
  });
  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /FRESH VERSION/);
  assert.doesNotMatch(prompts[1], /Repeated family-visit premise/);
  assert.equal(result.sentences[0].tgt, "This photograph is old.");
  assert.equal(getStoryHistory(plan).length, 0, "Generation must not save rejected drafts or mutate history before the UI accepts");
  assert.throws(() => parsePracticeStory(raw().replaceAll('"Neko"', '"Grandpa"'), plan), /two official characters/);
});

test("persistent Practice style complaints retain a usable episode after one rewrite", async () => {
  const plan = createStoryPlan({ ...identity, npub: "practice-failure", lessonContent, mode: "practice" });
  let calls = 0;
  const result = await generatePracticeStory({ prompt: "Family", plan, generate: async () => { calls++; return raw(); }, review: async () => ["Repeated premise"] });
  assert.equal(calls, 2);
  assert.equal(result.sentences.length, 8);
  assert.equal(await generatePracticeStory({ prompt: "Family", plan, generate: async () => raw(), isCancelled: () => true }), null);
});

test("Practice still blocks incomplete episodes and entire previously shown dialogue", async () => {
  const plan = { targetLang: "en", recentEntries: [] };
  for (const generated of [raw().replace('{"type":"done"}', ""), raw()]) {
    let calls = 0;
    await assert.rejects(generatePracticeStory({ prompt: "Family", plan: { ...plan,
      recentEntries: [{ targetText: parsePracticeStory(raw(), plan).fullStory.tgt }],
    }, generate: async () => { calls++; return generated; }, review: async () => [],
    }), /complete episode|entire dialogue repeats/);
    assert.equal(calls, 3);
  }
});

test("fixed Practice tutorials skip advisory review and duplicate comparisons", async () => {
  const tutorial = '{"type":"sentence","character":"You","tgt":"Hello."}\n{"type":"sentence","character":"Neko","tgt":"Good morning."}\n{"type":"done"}';
  const result = await generatePracticeStory({ prompt: "Welcome", plan: { targetLang: "en", isTutorial: true, recentEntries: [{ targetText: "Hello.\nGood morning." }] },
    generate: async () => tutorial, review: () => assert.fail("Fixed tutorial must not be reviewed for novelty"),
  });
  assert.equal(result.sentences.length, 2);
});

test("Call and Story keep usable episodes when an advisory reviewer keeps complaining", async () => {
  const plan = createStoryPlan({ ...identity, npub: "comprehension-review", lessonContent, mode: "radio" });
  const session = { title: "Family", segments: [0, 1, 2].map(() => ({
    turns: [{ speaker: "Neko", target: "My aunt has a camera." }, { speaker: "Sheilfer", target: "Is the camera old?" }],
    question: { type: "choice", prompt: "What does the aunt have?", options: ["A camera", "A hat"], answer: [0], explanation: "She has a camera.", audioTurn: 0 },
  })) };
  // Use distinct turns: this test is specifically about semantic review, not exact duplication.
  session.segments[1].turns[0].target = "She takes family photographs.";
  session.segments[1].turns[1].target = "Her cousin likes the pictures.";
  session.segments[2].turns[0].target = "We need a picture of our uncle.";
  session.segments[2].turns[1].target = "He is here with my grandfather.";
  for (const mode of ["radio", "conversation"]) {
    let calls = 0;
    const result = await generateStorySession({ prompt: "Family call", targetLang: "en", plan: { ...plan, mode },
      generate: async () => { calls++; return JSON.stringify(session); }, review: async () => ["The same central scene appears in recent Practice."],
    });
    assert.deepEqual(result, session);
    assert.equal(calls, 2);
  }
});
