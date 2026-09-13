import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSpeakingStoryPrompt,
  buildStoryWritingBrief,
  getStoryDifficulty,
} from "./storyPrompts.js";

test("practice-story generation requests target dialogue without eager translations", () => {
  const prompt = buildSpeakingStoryPrompt({
    targetName: "Spanish",
    targetLang: "es",
    difficulty: getStoryDifficulty("A1", { includeTranslations: false }),
    isTutorial: false,
    scenarioDirective: "A family looks at photographs.",
    curriculumContext: "Use family vocabulary.",
  });

  assert.match(prompt, /"tgt":"Spanish spoken line"/);
  assert.doesNotMatch(prompt, /"sup"|support translation|Translate the meaning/i);
});

test("practice-story generation keeps the selected target authoritative", () => {
  const prompt = buildSpeakingStoryPrompt({
    targetName: "Japanese",
    targetLang: "ja",
    difficulty: "Pre-A1",
    isTutorial: false,
    scenarioDirective: "Familia: habla de los abuelos.",
    curriculumContext: "Spanish source curriculum.",
  });

  assert.match(
    prompt,
    /target-language assignment \(Japanese, ja\) is authoritative/i,
  );
  assert.match(prompt, /never copy that wording as dialogue/i);
});

test("story modes that include translations retain the translation brief", () => {
  assert.match(
    buildStoryWritingBrief({ mode: "conversation" }),
    /Translate the meaning and tone faithfully/,
  );
});
