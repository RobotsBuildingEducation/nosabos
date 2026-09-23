import assert from "node:assert/strict";
import test from "node:test";
import { generateStarterPhrase, isFoundationStarterLevel } from "./starterPhrase.js";

test("starter help asks Gemini for a phrase tied to the goal and latest reply", async () => {
  let request;
  const updates = [];
  const model = {
    generateContentStream: async (input) => {
      request = input;
      return {
        stream: [
          { text: () => '{"target":"Me llamo' },
          { text: () => ' ___","support":"My name is ___"}' },
        ],
        get response() {
          assert.deepEqual(updates[0], { target: "Me llamo", support: "" }, "Show the target before the final response resolves");
          return { text: () => '{"target":"Me llamo ___","support":"My name is ___"}' };
        },
      };
    },
  };
  const phrase = await generateStarterPhrase({
    model,
    goal: "Introduce yourself",
    level: "A1",
    targetName: "Spanish",
    supportName: "English",
    lastAiMessage: "¿Cómo te llamas?",
    onUpdate: (partial) => updates.push(partial),
  });

  assert.deepEqual(phrase, { target: "Me llamo ___", support: "My name is ___" });
  assert.deepEqual(updates[0], { target: "Me llamo", support: "" });
  assert.deepEqual(updates.at(-1), phrase);
  assert.match(request.contents[0].parts[0].text, /Introduce yourself/);
  assert.match(request.contents[0].parts[0].text, /¿Cómo te llamas\?/);
  assert.equal(isFoundationStarterLevel("Pre-A1"), true);
  assert.equal(isFoundationStarterLevel("A1"), true);
  assert.equal(isFoundationStarterLevel("B1"), false);
});

test("starter help rejects an empty Gemini result", async () => {
  const model = { generateContentStream: async () => ({ stream: [], response: { text: () => "{}" } }) };
  await assert.rejects(
    generateStarterPhrase({ model, goal: "Say hello", level: "A1", targetName: "Spanish", supportName: "English" }),
    /did not return a starter phrase/,
  );
});

test("starter help streams JSON strings across escaped character boundaries", async () => {
  const updates = [];
  const pieces = ['{"target":"J\\', 'u00e1, s\\', '"í","support":"Yes"}'];
  const model = {
    generateContentStream: async () => ({
      stream: pieces.map((piece) => ({ text: () => piece })),
      response: { text: () => pieces.join("") },
    }),
  };
  const phrase = await generateStarterPhrase({
    model,
    goal: "Say yes",
    level: "A1",
    targetName: "Spanish",
    supportName: "English",
    onUpdate: (partial) => updates.push(partial),
  });
  assert.deepEqual(phrase, { target: 'Já, s"í', support: "Yes" });
  assert.deepEqual(updates.at(-1), phrase);
  assert.ok(updates.every((update) => !update.target.includes("\\")));
});
