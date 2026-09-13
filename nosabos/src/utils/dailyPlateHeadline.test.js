import test from "node:test";
import assert from "node:assert/strict";

import {
  getStoredPlateHeadline,
  getPlateTaskSummary,
  buildPlateHeadlinePrompt,
  generateAndStorePlateHeadline,
  cleanHeadlineText,
} from "./dailyPlateHeadline.js";

test("getStoredPlateHeadline returns text when dayKey and appLanguage match", () => {
  const user = {
    dailyPlateHeadline: {
      es: {
        dayKey: "2026-09-13",
        appLanguage: "en",
        text: "Handle your first café order, including a follow-up question.",
      },
    },
  };

  const result = getStoredPlateHeadline(user, "es", "2026-09-13", "en");
  assert.equal(
    result,
    "Handle your first café order, including a follow-up question.",
  );
});

test("getStoredPlateHeadline returns null when support language changes", () => {
  const user = {
    dailyPlateHeadline: {
      es: {
        dayKey: "2026-09-13",
        appLanguage: "es",
        text: "Domina las presentaciones básicas para conversar con confianza desde el primer día.",
      },
    },
  };

  // User changed support language to English: cache misses so it can re-generate in English
  assert.equal(getStoredPlateHeadline(user, "es", "2026-09-13", "en"), null);

  // If support language matches Spanish, it hits the cache
  assert.equal(
    getStoredPlateHeadline(user, "es", "2026-09-13", "es"),
    "Domina las presentaciones básicas para conversar con confianza desde el primer día.",
  );
});

test("getStoredPlateHeadline returns null when dayKey is stale or missing", () => {
  const user = {
    dailyPlateHeadline: {
      es: {
        dayKey: "2026-09-12",
        appLanguage: "en",
        text: "Yesterday's headline.",
      },
    },
  };

  // Day rollover:
  assert.equal(getStoredPlateHeadline(user, "es", "2026-09-13", "en"), null);

  // Different target language:
  assert.equal(getStoredPlateHeadline(user, "fr", "2026-09-12", "en"), null);

  // Missing user or empty:
  assert.equal(getStoredPlateHeadline(null, "es", "2026-09-13", "en"), null);
  assert.equal(getStoredPlateHeadline({}, "es", "2026-09-13", "en"), null);
});

test("getPlateTaskSummary excludes repair and goal and extracts topics", () => {
  const courses = [
    { kind: "repair", count: 1, target: 1 },
    { kind: "goal", count: 0, target: 1 },
    { kind: "speak", count: 1, target: 1 },
    { kind: "learn", count: 0, target: 1 },
    { kind: "review", count: 3, target: 5 },
  ];

  const mockUnits = [
    {
      id: "unit-1",
      title: { en: "Food and Dining" },
      lessons: [
        {
          id: "lesson-1",
          title: { en: "Ordering at a Café" },
        },
      ],
    },
  ];

  const summary = getPlateTaskSummary(courses, {}, "es", mockUnits);

  // Repair and Goal must be excluded
  assert.equal(summary.length, 3);
  assert.deepEqual(
    summary.map((s) => s.kind),
    ["speak", "learn", "review"],
  );

  // Check details
  const speakTask = summary.find((s) => s.kind === "speak");
  assert.equal(speakTask.topic, "Tutor conversation practice");
  assert.equal(speakTask.progress, "1/1");
  assert.equal(speakTask.done, true);

  const learnTask = summary.find((s) => s.kind === "learn");
  assert.equal(learnTask.topic, "Ordering at a Café");
  assert.equal(learnTask.progress, "0/1");
  assert.equal(learnTask.done, false);

  const reviewTask = summary.find((s) => s.kind === "review");
  assert.equal(reviewTask.topic, "Vocabulary flashcard review");
  assert.equal(reviewTask.progress, "3/5");
  assert.equal(reviewTask.done, false);
});

test("buildPlateHeadlinePrompt includes tasks and guidelines with strict output language enforcement", () => {
  const taskSummary = [
    { kind: "speak", topic: "Tutor conversation", progress: "0/1" },
    { kind: "learn", topic: "Food & Drinks", progress: "0/1" },
  ];

  const prompt = buildPlateHeadlinePrompt({
    targetLang: "es",
    appLanguage: "en",
    taskSummary,
  });

  assert.match(prompt, /Course: Learning Spanish/);
  assert.match(
    prompt,
    /OUTPUT LANGUAGE REQUIREMENT: You MUST write the sentence strictly in English/,
  );
  assert.match(prompt, /- speak: Tutor conversation \(0\/1 completed\)/);
  assert.match(prompt, /- learn: Food & Drinks \(0\/1 completed\)/);
  assert.match(prompt, /Do NOT mention XP/);
  assert.match(prompt, /Do NOT mention repairs/);
  assert.match(prompt, /The entire sentence MUST be written in English/);
});

test("cleanHeadlineText removes quotes, fences, and extraneous lines", () => {
  assert.equal(cleanHeadlineText('"Hello world"'), "Hello world");
  assert.equal(cleanHeadlineText('“Pide tu café”'), "Pide tu café");
  assert.equal(cleanHeadlineText("```json\nAsk for directions with ease.\n```"), "Ask for directions with ease.");
  assert.equal(cleanHeadlineText("Sentence one.\nSentence two."), "Sentence one.");
  assert.equal(cleanHeadlineText('"'), "");
});

test("generateAndStorePlateHeadline streams chunks to onStream", async () => {
  const streamedChunks = [];
  const mockCallLlm = async ({ input, onChunk }) => {
    onChunk?.('"Handle');
    onChunk?.('"Handle your');
    onChunk?.('"Handle your first café order."');
    return '"Handle your first café order."';
  };

  const text = await generateAndStorePlateHeadline({
    npub: "",
    targetLang: "es",
    appLanguage: "en",
    dayKey: "2026-09-13",
    taskSummary: [],
    callLlm: mockCallLlm,
    onStream: (chunk) => streamedChunks.push(chunk),
  });

  assert.equal(text, "Handle your first café order.");
  assert.deepEqual(streamedChunks, [
    "Handle",
    "Handle your",
    "Handle your first café order.",
  ]);
});

test("generateAndStorePlateHeadline invokes LLM and cleans quotes when non-streaming", async () => {
  let calledWithPrompt = "";
  const mockCallLlm = async ({ input }) => {
    calledWithPrompt = input;
    return '  "Order your morning coffee with confidence."  \n';
  };

  const text = await generateAndStorePlateHeadline({
    npub: "",
    targetLang: "es",
    appLanguage: "en",
    dayKey: "2026-09-13",
    taskSummary: [
      { kind: "speak", topic: "Café conversation", progress: "0/1" },
    ],
    callLlm: mockCallLlm,
  });

  assert.equal(text, "Order your morning coffee with confidence.");
  assert.match(calledWithPrompt, /Café conversation/);
});
