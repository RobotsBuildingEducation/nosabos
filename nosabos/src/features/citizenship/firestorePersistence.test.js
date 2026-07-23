import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseMostRecentTimestamped,
  combineProgressAndChat,
  sortRemoteChatMessages,
  stripAssistantChatFromProgress,
} from "./firestorePersistence.js";

test("remote progress documents exclude assistant chat", () => {
  const progress = {
    version: 3,
    answers: { birthplace: "us" },
    assistantChat: {
      messages: [{ id: "message-1", text: "Saved chat" }],
      saved: true,
    },
  };

  assert.deepEqual(stripAssistantChatFromProgress(progress), {
    version: 3,
    answers: { birthplace: "us" },
  });
  assert.equal(progress.assistantChat.saved, true);
});

test("remote chat can be combined with bounded progress after loading", () => {
  const assistantChat = {
    messages: [{ id: "message-1", text: "Saved chat" }],
    saved: true,
  };
  assert.deepEqual(
    combineProgressAndChat({ version: 3 }, assistantChat),
    {
      version: 3,
      assistantChat,
    },
  );
});

test("newest timestamped persistence source wins", () => {
  const older = { updatedAt: "2026-07-20T00:00:00.000Z", source: "old" };
  const newer = { updatedAt: "2026-07-23T00:00:00.000Z", source: "new" };
  assert.equal(
    chooseMostRecentTimestamped(older, newer, null)?.source,
    "new",
  );
});

test("remote chat messages retain their stored order", () => {
  assert.deepEqual(
    sortRemoteChatMessages([
      { id: "third", position: 2 },
      { id: "first", position: 0 },
      { id: "second", position: 1 },
    ]).map((message) => message.id),
    ["first", "second", "third"],
  );
});
