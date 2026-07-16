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
