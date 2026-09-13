import test from "node:test";
import assert from "node:assert/strict";
import { storyCopy } from "./storyCopy.js";

const REQUIRED_KEYS = [
  "preparingAudio",
  "modes",
  "speaking",
  "radio",
  "conversation",
  "yourTurn",
  "speakingNow",
  "record",
  "stopRecording",
  "connectingMic",
  "speechIncorrect",
  "recordingError",
  "micDenied",
  "loading",
  "loadingSub",
  "generationError",
  "audioError",
  "retry",
  "play",
  "pause",
  "resume",
  "replay",
  "listen",
  "start",
  "nextPair",
  "check",
  "next",
  "finish",
  "skip",
  "back",
  "checkpoint",
  "heard",
  "showQuestion",
  "correct",
  "incorrect",
  "translation",
  "hideTranslation",
  "complete",
  "score",
  "saving",
  "saveError",
  "onAir",
  "ready",
  "paused",
  "segment",
  "of",
  "clear",
  "answer",
  "xp",
  "review",
  "reviewStory",
  "sentencesCompleted",
  "call",
  "practice",
  "story",
  "you",
];

const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "ja", "ru", "el", "nl", "pl", "ga", "ar", "hi", "zh", "nah", "yua",
];

test("storyCopy provides all required UI strings for every supported language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = storyCopy(lang);
    assert.ok(copy, `Missing copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].length > 0,
        `Missing or empty key '${key}' in language: ${lang}`
      );
    }
  }
});

test("storyCopy falls back safely for unknown language", () => {
  const copy = storyCopy("unknown-code");
  assert.equal(copy.call, "Call");
  assert.equal(copy.you, "You");
  assert.equal(copy.practice, "Practice");
  assert.equal(copy.story, "Story");
});

test("storyCopy returns localized prefixes and names for Spanish", () => {
  const copy = storyCopy("es");
  assert.equal(copy.call, "Llamada");
  assert.equal(copy.practice, "Práctica");
  assert.equal(copy.story, "Historia");
  assert.equal(copy.you, "Tú");
  assert.equal(copy.yourTurn, "Tu turno de hablar");
  assert.equal(copy.replay, "Repetir");
  assert.equal(copy.record, "Grabar");
  assert.equal(copy.stopRecording, "Detener");
  assert.equal(copy.skip, "Saltar");
});
