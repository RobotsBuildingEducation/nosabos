import test from "node:test";
import assert from "node:assert/strict";

import { buildAssistantLanguagePolicy } from "./assistantLanguagePolicy.js";

test("assistant language policy keeps prose in the support language", () => {
  const policy = buildAssistantLanguagePolicy({
    supportLanguageName: "Hindi",
    targetLanguageName: "Japanese",
  });

  assert.match(policy, /every learner-facing sentence in Hindi/i);
  assert.match(policy, /Japanese only for exact exercise words/i);
  assert.match(policy, /Do not use English or any other third language/i);
  assert.match(policy, /grammar terms.*into Hindi/i);
});

test("exercise assistance gives the solution using available material, even when asked for a hint", async () => {
  const { buildExerciseAssistancePolicy } = await import("./assistantLanguagePolicy.js");
  const policy = buildExerciseAssistancePolicy();
  assert.match(policy, /Start with the exact answer/);
  assert.match(policy, /Do not invent an option/);
  assert.match(policy, /pieces in order.*completed sentence/);
  assert.match(policy, /exercise is inconsistent/);
  assert.match(policy, /even if the request template calls it a hint/);
});
