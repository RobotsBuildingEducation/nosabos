import test from "node:test";
import assert from "node:assert/strict";

import {
  getTutorStarterModelPhrase,
  getTutorStarterTargetExamples,
  TUTOR_STARTER_AGENDA_IDS,
  TUTOR_STARTER_TARGET_LANGUAGES,
} from "./tutorStarterAgenda.js";

test("the deterministic Tutor starter agenda covers every authored target language", () => {
  for (const language of TUTOR_STARTER_TARGET_LANGUAGES) {
    for (const itemId of TUTOR_STARTER_AGENDA_IDS) {
      assert.ok(
        getTutorStarterTargetExamples(itemId, language).length > 0,
        `Missing ${language} Tutor starter phrase for ${itemId}`,
      );
    }
  }
});

test("German-support Polish-target Tutor previews resolve Polish phrases", () => {
  assert.equal(getTutorStarterModelPhrase("hello", "pl"), "cześć");
  assert.equal(getTutorStarterModelPhrase("myNameIs", "pl-PL"), "mam na imię");
  assert.equal(
    getTutorStarterModelPhrase("howAreYou", "pl"),
    "jak się masz?",
  );
  assert.equal(getTutorStarterModelPhrase("goodbye", "pl"), "do widzenia");
});

test("a missing target phrase never silently falls back to English", () => {
  assert.deepEqual(getTutorStarterTargetExamples("hello", "unsupported"), []);
  assert.equal(getTutorStarterModelPhrase("hello", "unsupported"), "");
});
