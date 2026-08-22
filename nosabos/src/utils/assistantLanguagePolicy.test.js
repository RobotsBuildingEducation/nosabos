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
