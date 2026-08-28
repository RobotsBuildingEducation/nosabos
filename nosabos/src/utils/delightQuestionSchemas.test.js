import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIGHT_RESPONSE_SCHEMAS,
  getDelightResponseSchema,
} from "./delightQuestionSchemas.js";

test("every Delight variant has one bounded provider response schema", () => {
  assert.deepEqual(Object.keys(DELIGHT_RESPONSE_SCHEMAS), [
    "sentence_detective",
    "dialogue_fork",
    "sentence_shapeshifter",
    "word_neighborhoods",
    "morphology_forge",
    "three_clue_mystery",
    "listen_difference",
    "three_word_challenge",
    "natural_or_weird",
  ]);

  assert.equal(
    getDelightResponseSchema("dialogue_fork").properties.options.minItems,
    4,
  );
  assert.equal(
    getDelightResponseSchema("dialogue_fork").properties.options.maxItems,
    4,
  );
  assert.equal(
    getDelightResponseSchema("three_clue_mystery").properties.clues.minItems,
    3,
  );
  assert.equal(
    getDelightResponseSchema("three_clue_mystery").properties.clues.maxItems,
    3,
  );
  assert.equal(
    getDelightResponseSchema("word_neighborhoods").properties.groups.minItems,
    2,
  );
  assert.equal(
    getDelightResponseSchema("word_neighborhoods").properties.groups.items
      .properties.items.maxItems,
    3,
  );
});

test("unknown Delight variants do not receive a generic schema", () => {
  assert.equal(getDelightResponseSchema("unknown"), null);
});
