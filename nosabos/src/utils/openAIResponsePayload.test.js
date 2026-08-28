import test from "node:test";
import assert from "node:assert/strict";
import {
  extractOpenAIResponseText,
  getOpenAIResponseError,
} from "./openAIResponsePayload.js";

test("extracts structured text after reasoning output items", () => {
  const payload = {
    status: "completed",
    output: [
      { type: "reasoning", content: [] },
      {
        type: "message",
        content: [{ type: "output_text", text: '{"answer":"はい"}' }],
      },
    ],
  };

  assert.equal(extractOpenAIResponseText(payload), '{"answer":"はい"}');
});

test("surfaces incomplete and refused Responses API results", () => {
  assert.throws(
    () =>
      extractOpenAIResponseText({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [],
      }),
    /max_output_tokens/,
  );
  assert.throws(
    () =>
      extractOpenAIResponseText({
        status: "completed",
        output: [
          { content: [{ type: "refusal", refusal: "Cannot comply." }] },
        ],
      }),
    /refused.*Cannot comply/i,
  );
});

test("preserves upstream error details", () => {
  assert.match(
    getOpenAIResponseError(
      { error: { message: "Invalid response schema." } },
      400,
    ).message,
    /400.*Invalid response schema/,
  );
});
