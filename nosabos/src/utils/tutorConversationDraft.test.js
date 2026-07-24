import test from "node:test";
import assert from "node:assert/strict";

import {
  getRestorableTutorConversationMessages,
  normalizeTutorConversationDraftMessages,
  TUTOR_CONVERSATION_DRAFT_MAX_MESSAGES,
  TUTOR_CONVERSATION_DRAFT_VERSION,
} from "./tutorConversationDraft.js";

function message(index, overrides = {}) {
  return {
    id: `message-${index}`,
    role: index % 2 ? "user" : "assistant",
    textFinal: `message ${index}`,
    done: true,
    ts: index,
    ...overrides,
  };
}

test("Tutor conversation drafts retain only the newest finalized messages", () => {
  const messages = Array.from(
    { length: TUTOR_CONVERSATION_DRAFT_MAX_MESSAGES + 5 },
    (_, index) => message(index),
  );
  messages.push(message(99, { done: false, textStream: "partial" }));

  const normalized = normalizeTutorConversationDraftMessages(messages);

  assert.equal(normalized.length, TUTOR_CONVERSATION_DRAFT_MAX_MESSAGES);
  assert.equal(normalized[0].id, "message-5");
  assert.equal(normalized.at(-1).id, "message-64");
  assert.equal(normalized.some((item) => item.id === "message-99"), false);
  assert.equal(normalized[0].text, "message 5");
  assert.equal("textStream" in normalized[0], false);
  assert.equal("translation" in normalized[0], false);
  assert.equal("translationLang" in normalized[0], false);
  assert.equal("pairs" in normalized[0], false);
  assert.equal("done" in normalized[0], false);
  assert.equal("hasAudio" in normalized[0], false);
});

test("Tutor conversation drafts restore only for in-progress lessons", () => {
  const conversationDraft = {
    version: TUTOR_CONVERSATION_DRAFT_VERSION,
    messages: [message(1)],
  };

  assert.equal(
    getRestorableTutorConversationMessages({
      status: "completed",
      conversationDraft,
    }).length,
    0,
  );
  const restored = getRestorableTutorConversationMessages({
      status: "in_progress",
      conversationDraft,
    });
  assert.deepEqual(restored.map((item) => item.id), ["message-1"]);
  assert.equal(restored[0].textFinal, "message 1");
  assert.equal(restored[0].textStream, "");
  assert.equal(restored[0].done, true);
});
