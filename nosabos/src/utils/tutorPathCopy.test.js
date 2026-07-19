import test from "node:test";
import assert from "node:assert/strict";

import {
  getTutorPathCopy,
  TUTOR_PATH_COPY_KEYS,
  TUTOR_PATH_COPY_LANGUAGES,
} from "./tutorPathCopy.js";

test("every Tutor lessons-modal label covers every support language", () => {
  for (const key of TUTOR_PATH_COPY_KEYS) {
    for (const language of TUTOR_PATH_COPY_LANGUAGES) {
      assert.ok(
        getTutorPathCopy(key, language),
        `Missing ${language} Tutor path copy for ${key}`,
      );
    }
  }
});

test("the German Tutor lessons modal never falls back to English", () => {
  assert.equal(
    getTutorPathCopy("close", "de"),
    "Schließen",
  );
  assert.equal(
    getTutorPathCopy("currentLesson", "de-DE"),
    "Aktuelle Tutor-Lektion",
  );
  assert.equal(
    getTutorPathCopy("loadingPath", "de"),
    "Lernpfad wird geladen...",
  );
});
