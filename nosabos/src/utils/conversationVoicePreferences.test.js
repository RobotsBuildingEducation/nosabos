import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveConversationPersona,
  resolveConversationVoice,
} from "./conversationVoicePreferences.js";

test("Conversations always uses the Shimmer voice", () => {
  assert.equal(resolveConversationVoice({ tutorVoice: "cedar" }), "shimmer");
  assert.equal(resolveConversationVoice({ tutorVoice: "marin" }), "shimmer");
  assert.equal(resolveConversationVoice({}), "shimmer");
});

test("Conversations consumes the selected Tutor personality", () => {
  assert.equal(
    resolveConversationPersona(
      { tutorVoicePersona: "Rude and mean" },
      "Friendly",
    ),
    "Rude and mean",
  );
});
