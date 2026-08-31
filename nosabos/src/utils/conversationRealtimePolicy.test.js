import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConversationResponseCreateEvent,
  buildConversationResponseInstructions,
  buildConversationTurnDetection,
} from "./conversationRealtimePolicy.js";

test("conversation VAD keeps turn detection but leaves response creation to the client", () => {
  const config = buildConversationTurnDetection(1750);

  assert.equal(config.type, "server_vad");
  assert.equal(config.silence_duration_ms, 1750);
  assert.equal(config.create_response, false);
  assert.equal(config.interrupt_response, false);
});

test("each conversation response ends with the selected personality reminder", () => {
  const instructions = buildConversationResponseInstructions(
    "Respond only in Spanish. Keep the reply short.",
    "Rude and mean",
  );

  assert.match(instructions, /^Respond only in Spanish/);
  assert.match(instructions, /Rude and mean/);
  assert.ok(
    instructions.endsWith(
      'Its defining attitude and interaction style must be clearly recognizable throughout the response.',
    ),
  );
});

test("manual response event carries audio modality and per-turn instructions", () => {
  const event = buildConversationResponseCreateEvent({
    sessionInstructions: "Use only beginner Spanish.",
    persona: "Dry and sarcastic",
  });

  assert.equal(event.type, "response.create");
  assert.deepEqual(event.response.output_modalities, ["audio"]);
  assert.equal(event.response.metadata.kind, "conversation");
  assert.match(event.response.instructions, /Dry and sarcastic/);
});
