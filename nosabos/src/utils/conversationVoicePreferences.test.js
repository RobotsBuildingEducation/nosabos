import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveConversationPersona,
  resolveConversationVoice,
} from "./conversationVoicePreferences.js";

test("Conversations consumes the voice selected for Tutor", () => {
  assert.equal(resolveConversationVoice({ tutorVoice: "cedar" }), "cedar");
  assert.equal(resolveConversationVoice({ tutorVoice: "marin" }), "marin");
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
