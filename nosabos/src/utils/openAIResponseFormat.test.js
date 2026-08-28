import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOpenAIResponseFormat,
  buildStrictOpenAISchema,
} from "./openAIResponseFormat.js";

test("OpenAI uses json_schema format when a provider contract is supplied", () => {
  const schema = {
    type: "object",
    properties: { answer: { type: "string" } },
    required: ["answer"],
  };
  assert.deepEqual(
    buildOpenAIResponseFormat({
      responseSchema: schema,
      responseSchemaName: "delight:dialogue fork",
    }),
    {
      type: "json_schema",
      name: "delight_dialogue_fork",
      description: "One renderable language-learning question.",
      schema: {
        ...schema,
        additionalProperties: false,
      },
      strict: true,
    },
  );
});

test("OpenAI strict schemas keep only required UI fields recursively", () => {
  const schema = {
    type: "object",
    properties: {
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            items: { type: "array", items: { type: "string" } },
          },
          required: ["label", "items"],
        },
      },
      hint: { type: "string" },
    },
    required: ["groups"],
  };

  assert.deepEqual(buildStrictOpenAISchema(schema), {
    type: "object",
    properties: {
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            items: { type: "array", items: { type: "string" } },
          },
          required: ["label", "items"],
          additionalProperties: false,
        },
      },
    },
    required: ["groups"],
    additionalProperties: false,
  });
});

test("OpenAI keeps ordinary calls in text mode", () => {
  assert.deepEqual(buildOpenAIResponseFormat(), { type: "text" });
});
