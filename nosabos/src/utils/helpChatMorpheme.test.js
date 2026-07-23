import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMorphemeFallbackPrompt,
  buildMorphemeModeInstruction,
  hasCompleteMorphemeResponse,
  hasMorphemeBreakdown,
} from "./helpChatMorpheme.js";

test("morpheme mode translates and analyzes only the submitted text", () => {
  const instruction = buildMorphemeModeInstruction({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(instruction, /exact text to translate and analyze/i);
  assert.match(instruction, /translate it into English/i);
  assert.match(instruction, /\/\/ direct translation/i);
  assert.match(instruction, /Do not create an example sentence/i);
  assert.match(instruction, /all and only those words/i);
});

test("single-morpheme words count as a valid breakdown", () => {
  assert.equal(
    hasMorphemeBreakdown(
      '**Guadalajara** = Guadalajara\n- Guadalajara: single morpheme\n→ "Guadalajara"',
    ),
    true,
  );
  assert.equal(hasMorphemeBreakdown("Guadalajara is a city in Mexico."), false);
});

test("a complete morpheme response requires both translation and breakdown", () => {
  const breakdown =
    '**Guadalajara** = Guadalajara\n- Guadalajara: single morpheme\n→ "Guadalajara"';

  assert.equal(hasCompleteMorphemeResponse(breakdown), false);
  assert.equal(
    hasCompleteMorphemeResponse(`// Guadalajara\n\n${breakdown}`),
    true,
  );
});

test("fallback stays anchored to the latest user input", () => {
  const prompt = buildMorphemeFallbackPrompt({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
    question: "guadalajara",
    assistantAnswer: "Siempre quise visitar Guadalajara.",
  });

  assert.match(prompt, /Latest user input: guadalajara/);
  assert.match(prompt, /translate into English/i);
  assert.match(prompt, /\/\/ direct translation/i);
  assert.match(prompt, /do not analyze any words from it/i);
  assert.match(prompt, /Do not create an example sentence/i);
});
