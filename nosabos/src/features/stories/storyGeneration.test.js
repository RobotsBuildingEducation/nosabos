import test from "node:test";
import assert from "node:assert/strict";
import { buildStoryGenerationRequest, generateStorySession } from "./storyGeneration.js";

const valid = {
  title: "Planning a Birthday Party",
  segments: [
    { turns: [
      { speaker: "Host", target: "¿Quién llama hoy?", support: "Who is calling today?" },
      { speaker: "Carlos", target: "Me llamo Carlos.", support: "My name is Carlos." },
    ], question: { type: "choice", prompt: "Who is calling?", options: ["Carlos", "Ana"], answer: [0], explanation: "The caller introduces himself as Carlos.", audioTurn: 0 } },
    { turns: [
      { speaker: "Host", target: "¿Cuándo es la fiesta?", support: "When is the party?" },
      { speaker: "Carlos", target: "La fiesta es el sábado por la tarde.", support: "The party is Saturday afternoon." },
    ], question: { type: "select_words", prompt: "Select two words heard.", options: ["la", "mañana", "tarde", "noche"], answer: [0, 2], explanation: "Carlos says la and tarde.", audioTurn: 1 } },
  ],
};

test("requests constrained JSON with nested turn/checkpoint fields and integer answers", () => {
  const request = buildStoryGenerationRequest("A radio show");
  assert.equal(request.generationConfig.responseMimeType, "application/json");
  assert.deepEqual(request.contents[0].parts, [{ text: "A radio show" }]);
  assert.equal(request.generationConfig.thinkingConfig.thinkingBudget, 0);
  const schema = request.generationConfig.responseSchema;
  assert.deepEqual(schema.required, ["title", "segments"]);
  const segment = schema.properties.segments.items;
  assert.deepEqual(segment.required, ["turns", "question"]);
  assert.deepEqual(segment.properties.turns.items.required, ["speaker", "target"]);
  assert.equal(segment.properties.question.properties.answer.items.type, "INTEGER");
  assert.deepEqual(segment.properties.question.properties.type.enum, ["choice", "true_false", "select_words", "order_words", "reply"]);
});

test("HTTP-success malformed nesting is diagnosed and the actual candidate is sent for repair", async () => {
  // Reproduces the extra closing array before the final segment closes in the
  // real unconstrained radio response (followed by an unrelated subtitles field).
  const malformed = JSON.stringify(valid).replace(/}\]}$/, '}]}],"subtitles":[]}');
  assert.throws(() => JSON.parse(malformed), SyntaxError);
  const prompts = []; const diagnostics = [];
  const session = await generateStorySession({ prompt: "Generate a radio show", generate: async (prompt) => {
    prompts.push(prompt); return prompts.length === 1 ? malformed : JSON.stringify(valid);
  }, onDiagnostic: (detail) => diagnostics.push(detail) });
  assert.deepEqual(session, valid);
  assert.equal(prompts.length, 2);
  assert.ok(prompts[1].includes(JSON.stringify(malformed)));
  assert.equal(diagnostics[0].stage, "validation");
  assert.equal(diagnostics[0].name, "SyntaxError");
  assert.equal(diagnostics[0].attempt, 1);
  assert.equal(JSON.stringify(diagnostics).includes("Carlos"), false, "Diagnostics must not expose dialogue");
});

test("semantic validation stays strict and retries stop after two bad candidates", async () => {
  const bad = structuredClone(valid); bad.segments[1].question.answer = [1, 3];
  const diagnostics = []; let calls = 0;
  await assert.rejects(generateStorySession({ prompt: "Radio", generate: async () => { calls++; return JSON.stringify(bad); }, onDiagnostic: (detail) => diagnostics.push(detail) }), /Word selection does not match audio/);
  assert.equal(calls, 2);
  assert.deepEqual(diagnostics.map((detail) => detail.attempt), [1, 2]);
});

test("service failures are diagnosed separately from invalid stories", async () => {
  const diagnostics = [];
  await assert.rejects(generateStorySession({ prompt: "Radio", generate: async () => { throw new Error("Network unavailable"); }, onDiagnostic: (detail) => diagnostics.push(detail) }), /Network unavailable/);
  assert.equal(diagnostics[0].stage, "response");
});

test("cancelled generation does not log errors or launch a repair request", async () => {
  let calls = 0;
  assert.equal(await generateStorySession({ prompt: "Radio", generate: async () => { calls++; return "invalid"; }, isCancelled: () => true, onDiagnostic: () => assert.fail("Cancelled work must be ignored") }), null);
  assert.equal(calls, 1);
});

test("wrong-script dialogue is retried using the requested target language", async () => {
  const spanish = JSON.stringify(valid);
  const japanese = structuredClone(valid);
  japanese.segments.forEach((segment) => {
    segment.turns.forEach((turn, index) => {
      turn.target = index === 0 ? "こんにちは。" : "祖父母の家にいます。";
    });
  });
  japanese.segments[1].question.type = "choice";
  japanese.segments[1].question.options = ["Sí", "No"];
  japanese.segments[1].question.answer = [0];

  const prompts = [];
  const session = await generateStorySession({
    prompt: "Japanese story",
    targetLang: "ja",
    generate: async (prompt) => {
      prompts.push(prompt);
      return prompts.length === 1 ? spanish : JSON.stringify(japanese);
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /every turn\.target.*requested target language/i);
  assert.equal(session.segments[0].turns[0].target, "こんにちは。");
});
