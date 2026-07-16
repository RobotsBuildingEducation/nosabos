import assert from "node:assert/strict";
import test from "node:test";

import { buildTutorCodeSwitchingAudioInstruction } from "./tutorCodeSwitchingPrompt.js";

test("OpenAI code-switching guidance is language-level, not a word dictionary", () => {
  const prompt = buildTutorCodeSwitchingAudioInstruction(
    "Spanish",
    "English",
    { emphasizeSingleWordSwitches: true },
  );

  assert.match(prompt, /fully bilingual/i);
  assert.match(prompt, /only one word/i);
  assert.match(prompt, /native Spanish phonology/i);
  assert.doesNotMatch(prompt, /mamá|papá|herman|familia|\/maˈma\//i);
});

test("general provider guidance still requires native target pronunciation", () => {
  const prompt = buildTutorCodeSwitchingAudioInstruction(
    "French",
    "English",
  );

  assert.equal(
    prompt,
    [
      "You are a language tutor. Correct target-language pronunciation is required. When code switching, switch accent and phonology for the target-language words instead of reading them with the surrounding language accent.",
      "When you include French words or phrases, pronounce those words with native-like French sounds, rhythm, stress, and intonation even if the surrounding tutoring language is different.",
      "Do not anglicize, hispanicize, or otherwise adapt French model phrases to English pronunciation. The accent must switch for the target phrase itself.",
      "Before and after each French model phrase, separate it naturally with normal speech timing so the audio clearly switches into French pronunciation.",
      "Say each French model phrase as a short standalone phrase. Do not blend its sounds into a support-language sentence.",
      "Never write visible timing, SSML, or control tags such as <pause>, </pause>, <break>, or [pause]. Use normal punctuation only.",
      "Write target-language words in normal spelling. Do not use phonetic respelling, hyphenation, or transliteration unless the learner explicitly asks.",
    ].join(" "),
  );
  assert.match(prompt, /native-like French sounds/i);
  assert.match(prompt, /accent must switch/i);
});
