import test from "node:test";
import assert from "node:assert/strict";
import {
  generateContentStreamWithTimeout,
  generateContentWithTimeout,
  settleProviderWithin,
} from "./providerGenerationTimeout.js";

const delay = (ms, value) =>
  new Promise((resolve) => globalThis.setTimeout(() => resolve(value), ms));

test("non-streaming question generation respects the provider deadline", async () => {
  const model = {
    generateContent: () => delay(40, { response: "late" }),
  };
  await assert.rejects(
    generateContentWithTimeout(model, {}, 5),
    /Gemini question generation timed out/,
  );
});

test("streaming question generation uses one deadline for every chunk", async () => {
  const model = {
    async generateContentStream() {
      return {
        stream: {
          async *[Symbol.asyncIterator]() {
            yield "first";
            await delay(40);
            yield "late";
          },
        },
        response: Promise.resolve({ text: () => "firstlate" }),
      };
    },
  };
  const result = await generateContentStreamWithTimeout(model, {}, 10);
  const chunks = [];
  await assert.rejects(
    async () => {
      for await (const chunk of result.stream) chunks.push(chunk);
    },
    /Gemini question generation timed out/,
  );
  assert.deepEqual(chunks, ["first"]);
});

test("OpenAI-style fallback work can use the same six-second boundary", async () => {
  assert.equal(await settleProviderWithin(Promise.resolve("ok"), 10), "ok");
  await assert.rejects(
    settleProviderWithin(delay(40, "late"), 5, "OpenAI question generation"),
    /OpenAI question generation timed out/,
  );
});
