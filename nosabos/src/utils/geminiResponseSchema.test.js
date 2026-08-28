import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeGeminiResponseSchema } from "./geminiResponseSchema.js";

test("Gemini response schemas preserve supported bounds and drop invalid enums", () => {
  const schema = sanitizeGeminiResponseSchema({
    type: "object",
    properties: {
      joiner: { type: "string", enum: ["", " "] },
      slotType: { type: "string", enum: ["noun", "verb"] },
      tokens: {
        type: "array",
        minItems: 3,
        maxItems: 30,
        items: { type: "string" },
      },
      incorrectIndex: { type: "integer", minimum: 0 },
    },
    required: ["joiner", "slotType", "tokens", "incorrectIndex"],
  });

  assert.deepEqual(schema.properties.joiner, { type: "string" });
  assert.deepEqual(schema.properties.slotType.enum, ["noun", "verb"]);
  assert.equal(schema.properties.tokens.minItems, 3);
  assert.equal(schema.properties.tokens.maxItems, 30);
  assert.equal(schema.properties.incorrectIndex.minimum, 0);
  assert.deepEqual(schema.required, [
    "joiner",
    "slotType",
    "tokens",
    "incorrectIndex",
  ]);
});
