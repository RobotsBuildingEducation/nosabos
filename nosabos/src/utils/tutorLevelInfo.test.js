import test from "node:test";
import assert from "node:assert/strict";

import {
  TUTOR_LEVEL_INFO,
  TUTOR_LEVEL_SUPPORT_LANGUAGES,
} from "./tutorLevelInfo.js";

const TUTOR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

test("Tutor proficiency names and descriptions cover every support language", () => {
  for (const level of TUTOR_LEVELS) {
    const info = TUTOR_LEVEL_INFO[level];
    assert.ok(info, `Missing Tutor copy for ${level}`);

    for (const language of TUTOR_LEVEL_SUPPORT_LANGUAGES) {
      assert.ok(info.name[language], `Missing ${language} name for ${level}`);
      assert.ok(
        info.description[language],
        `Missing ${language} description for ${level}`,
      );
    }
  }
});

test("German Tutor proficiency copy is localized from A0 through C2", () => {
  assert.equal(TUTOR_LEVEL_INFO["Pre-A1"].name.de, "Absoluter Anfänger");
  assert.equal(
    TUTOR_LEVEL_INFO["Pre-A1"].description.de,
    "Erste Wörter und Wiedererkennung",
  );
  assert.equal(TUTOR_LEVEL_INFO.C2.name.de, "Meisterschaft");
  assert.equal(
    TUTOR_LEVEL_INFO.C2.description.de,
    "Nahezu muttersprachliche Kompetenz",
  );
});
