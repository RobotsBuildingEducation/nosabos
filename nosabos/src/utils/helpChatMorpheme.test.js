import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMorphemeBreakdownPrompt,
  buildMorphemeTranslationPlanPrompt,
  hasMorphemeBreakdown,
  parseMorphemeTranslationPlan,
} from "./helpChatMorpheme.js";

test("translation plan always identifies the target-language text to analyze", () => {
  const prompt = buildMorphemeTranslationPlanPrompt({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
    question: "i love you",
  });

  assert.match(prompt, /translation: translate it into Spanish/i);
  assert.match(
    prompt,
    /targetText must ALWAYS contain the target-language wording/i,
  );
  assert.match(prompt, /SOURCE_TEXT:\ni love you/);
});

test("translation plan parser accepts JSON even inside a code fence", () => {
  assert.deepEqual(
    parseMorphemeTranslationPlan(
      '```json\n{"translation":"Te amo","targetText":"Te amo"}\n```',
    ),
    {
      translation: "Te amo",
      targetText: "Te amo",
    },
  );
});

test("target-language input keeps the original as the morpheme text", () => {
  assert.deepEqual(
    parseMorphemeTranslationPlan(
      '{"translation":"I love you","targetText":"Te amo"}',
    ),
    {
      translation: "I love you",
      targetText: "Te amo",
    },
  );
});

test("breakdown prompt analyzes the translated target text, not the source", () => {
  const prompt = buildMorphemeBreakdownPrompt({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
    targetText: "Te amo",
  });

  assert.match(prompt, /exact Spanish text:\nTe amo/);
  assert.match(prompt, /all and only the target-language words/i);
  assert.match(prompt, /Do not translate or analyze any source-language wording/i);
  assert.doesNotMatch(prompt, /i love you/i);
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
