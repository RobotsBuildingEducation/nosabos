import assert from "node:assert/strict";
import test from "node:test";

import { composeOpenAIRealtimeResponseInstructions } from "./openaiRealtimeResponseInstructions.js";

test("keeps the bilingual speech policy adjacent to every OpenAI turn", () => {
  const instructions = composeOpenAIRealtimeResponseInstructions(
    "Speak every target-language span with native phonology.",
    "Teach the current lesson item.",
  );

  assert.equal(
    instructions,
    [
      "Speak every target-language span with native phonology.",
      "# Current turn",
      "Teach the current lesson item.",
    ].join("\n\n"),
  );
});

test("does not invent a turn instruction when only the speech policy exists", () => {
  assert.equal(
    composeOpenAIRealtimeResponseInstructions("Native bilingual speech.", ""),
    "Native bilingual speech.",
  );
});

test("the support-language anchor is always the final line", () => {
  const instructions = composeOpenAIRealtimeResponseInstructions(
    "Policy.",
    "Turn task.",
    "Recuerda: di todas las instrucciones en español.",
  );
  assert.ok(
    instructions.endsWith(
      "\n\nRecuerda: di todas las instrucciones en español.",
    ),
  );
  // No suffix → unchanged composition.
  assert.equal(
    composeOpenAIRealtimeResponseInstructions("Policy.", "Turn task.", ""),
    "Policy.\n\n# Current turn\n\nTurn task.",
  );
});
