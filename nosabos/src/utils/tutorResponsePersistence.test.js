import assert from "node:assert/strict";
import test from "node:test";

import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import { buildTutorPersistentResponseSuffix } from "./tutorResponsePersistence.js";
import { buildTutorTeacherTalkLanguageGate } from "./tutorTeacherTalkLanguageGate.js";

test("every A0 pairing ends with one complete language-boundary gate", () => {
  const targets = ["en", "es", "fr", "ja", "nah"];

  for (const supportLanguageCode of SUPPORT_LANGUAGE_CODES) {
    for (const targetLanguageCode of targets) {
      const suffix = buildTutorPersistentResponseSuffix({
        persona: "Rude and mean",
        supportLanguageCode,
        targetLanguageCode,
        isEarlyLevel: true,
      });

      assert.match(suffix, /Rude and mean/);
      assert.match(suffix, /\n\n#/);
      assert.ok(
        suffix.endsWith(
          buildTutorTeacherTalkLanguageGate({
            supportLanguageCode,
            targetLanguageCode,
          }),
        ),
        `${supportLanguageCode} -> ${targetLanguageCode} lost its final language-boundary gate`,
      );
    }
  }
});

test("advanced mixed-language Tutor turns keep personality without forcing support speech", () => {
  const suffix = buildTutorPersistentResponseSuffix({
    persona: "Dry and sarcastic",
    supportLanguageCode: "es",
    targetLanguageCode: "en",
    isEarlyLevel: false,
  });

  assert.match(suffix, /Dry and sarcastic/);
  assert.doesNotMatch(suffix, /Recuerda:/);
  assert.doesNotMatch(suffix, /IDIOMA DE LA RESPUESTA/);
});

test("Spanish A0 support blocks the exact English teacher-talk leak seen in Tutor", () => {
  const suffix = buildTutorPersistentResponseSuffix({
    persona: "Rude and mean",
    supportLanguageCode: "es",
    targetLanguageCode: "en",
    isEarlyLevel: true,
  });

  assert.match(suffix, /El español es el idioma base/);
  assert.match(suffix, /«Now»/);
  assert.match(suffix, /«Nice»/);
  assert.match(suffix, /No uses un tercer idioma/);
  assert.ok(
    suffix.endsWith(
      "- Antes de hablar, revisa cada palabra: si no es material exacto de práctica, debe estar en español.",
    ),
  );
});

test("English A0 support preserves native Italian code switching", () => {
  const suffix = buildTutorPersistentResponseSuffix({
    persona: "Rude and mean",
    supportLanguageCode: "en",
    targetLanguageCode: "it",
    isEarlyLevel: true,
  });

  assert.match(suffix, /say that exact word or phrase in the practice language/);
  assert.match(suffix, /native accent and sounds/);
  assert.match(suffix, /switch immediately back to English/);
  assert.ok(
    suffix.endsWith(
      "- Before speaking, check every word: if it is not exact practice material, it must be English.",
    ),
  );
});
