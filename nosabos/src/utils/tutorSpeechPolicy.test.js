import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTutorInputTranscription,
  hasUnexpectedTutorTranscriptScript,
  mergeTutorInputTranscription,
} from "./tutorSpeechPolicy.js";

test("anchors OpenAI transcription to target while retaining support context", () => {
  assert.deepEqual(
    buildTutorInputTranscription({
      inputLanguageCodes: ["es-MX", "en-US"],
      keywords: ["papá", "mamá"],
    }),
    {
      model: "gpt-4o-mini-transcribe",
      language: "es",
      prompt:
        "Language lesson: es. Occasional support questions: en. Preserve the spelling and writing systems of only these languages. Keywords: papá, mamá",
    },
  );
});

test("partial session updates cannot erase the established language anchor", () => {
  const anchored = buildTutorInputTranscription({
    inputLanguageCodes: ["es-MX", "en-US"],
  });
  assert.deepEqual(
    mergeTutorInputTranscription(anchored, {
      model: "gpt-4o-mini-transcribe",
    }),
    anchored,
  );
});

test("rejects Chinese-script drift during a Spanish lesson with English support", () => {
  assert.equal(
    hasUnexpectedTutorTranscriptScript("爸爸", ["es-MX", "en-US"]),
    true,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("媽媽", ["es-MX", "en-US"]),
    true,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("mamá", ["es-MX", "en-US"]),
    false,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("Can you repeat that?", [
      "es-MX",
      "en-US",
    ]),
    false,
  );
});

test("allows scripts that belong to either target or support language", () => {
  assert.equal(
    hasUnexpectedTutorTranscriptScript("爸爸", ["zh-CN", "en-US"]),
    false,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("こんにちは", ["ja-JP", "en-US"]),
    false,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("привет", ["ru-RU", "en-US"]),
    false,
  );
  assert.equal(
    hasUnexpectedTutorTranscriptScript("爸爸", ["es-MX", "zh-CN"]),
    false,
  );
});
