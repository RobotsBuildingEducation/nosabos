import test from "node:test";
import assert from "node:assert/strict";

import {
  getTutorStarterPreviewAgendaItems,
  getTutorStarterModelPhrase,
  getTutorStarterTargetExamples,
  isTutorStarterLesson,
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

test("the learner-facing starter preview contains one item per concept", () => {
  for (const targetLang of TUTOR_STARTER_TARGET_LANGUAGES) {
    const items = getTutorStarterPreviewAgendaItems({
      targetLang,
      supportLang: "en",
    });

    assert.equal(items.length, 7);
    assert.deepEqual(
      items.map((item) => item.id),
      TUTOR_STARTER_AGENDA_IDS,
    );
    assert.ok(items.every((item) => item.label.trim()));
  }
});

test("the starter preview remains seven localized concepts without a target phrase", () => {
  const items = getTutorStarterPreviewAgendaItems({
    targetLang: "unsupported",
    supportLang: "ar",
  });

  assert.equal(items.length, 7);
  assert.equal(items[0].label, "أهلًا");
  assert.equal(items[6].label, "مع السلامة");
});

test("both authored tutorial lesson ids use the starter preview", () => {
  assert.equal(isTutorStarterLesson("lesson-tutorial-1"), true);
  assert.equal(isTutorStarterLesson({ id: "lesson-tutorial-a1" }), true);
  assert.equal(isTutorStarterLesson("lesson-a1-1"), false);
});
