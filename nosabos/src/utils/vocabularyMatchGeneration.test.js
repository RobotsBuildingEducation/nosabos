import test from "node:test";
import assert from "node:assert/strict";
import {
  buildVocabularyMatchPrompt,
  normalizeVocabularyMatchQuestion,
} from "./vocabularyMatchGeneration.js";

const tutorial = {
  topic: "tutorial",
  focusPoints: ["hola + me llamo", "buenos días / buenas noches"],
};

test("tutorial match prompts use only the selected target greeting inventory", () => {
  const prompt = buildVocabularyMatchPrompt({
    targetLang: "de",
    targetName: "German",
    supportLang: "en",
    supportName: "English",
    difficulty: "A1",
    lessonContent: tutorial,
  });

  assert.match(prompt, /hallo/i);
  assert.match(prompt, /guten Morgen/i);
  assert.match(prompt, /auf Wiedersehen/i);
  assert.doesNotMatch(prompt, /hola \+ me llamo/i);
  assert.match(prompt, /exactly three/i);
});

test("tutorial match validation rejects unrelated generic vocabulary", () => {
  const generic = normalizeVocabularyMatchQuestion(
    {
      stem: "Match the words",
      left: ["rapid", "generous", "fragile"],
      right: ["quick", "kind in giving", "easily broken"],
      hint: "Match synonyms",
    },
    { targetLang: "en", lessonContent: tutorial },
  );
  assert.equal(generic, null);

  const greetings = normalizeVocabularyMatchQuestion(
    {
      stem: "Match the greetings",
      left: ["hello", "good morning", "goodbye"],
      right: ["a basic greeting", "a morning greeting", "a farewell"],
      hint: "Think about when each is used",
    },
    { targetLang: "en", lessonContent: tutorial },
  );
  assert.deepEqual(greetings?.left, ["hello", "good morning", "goodbye"]);
});
