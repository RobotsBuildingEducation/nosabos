import assert from "node:assert/strict";
import test from "node:test";

import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import { buildTutorTeacherTalkLanguageGate } from "./tutorTeacherTalkLanguageGate.js";

test("every support language has a structured early-level output gate", () => {
  for (const supportLanguageCode of SUPPORT_LANGUAGE_CODES) {
    const gate = buildTutorTeacherTalkLanguageGate({
      supportLanguageCode,
      targetLanguageCode: supportLanguageCode === "en" ? "es" : "en",
    });

    assert.match(gate, /^#/);
    assert.ok(gate.split("\n").length >= 6, supportLanguageCode);
  }
});

test("Spanish support distinguishes English practice material from teacher talk", () => {
  const gate = buildTutorTeacherTalkLanguageGate({
    supportLanguageCode: "es-MX",
    targetLanguageCode: "en-US",
  });

  assert.match(gate, /El español es el idioma base/);
  assert.match(gate, /todas las instrucciones, preguntas, explicaciones/);
  assert.match(gate, /palabra o frase exacta/);
  assert.match(gate, /acento y los sonidos nativos/);
  assert.match(gate, /vuelve inmediatamente al español/);
  assert.match(gate, /No uses un tercer idioma/);
  assert.match(gate, /«Now»/);
  assert.match(gate, /«Nice»/);
  assert.match(gate, /«Repeat»/);
  assert.match(gate, /si no es material exacto de práctica, debe estar en español/);
});

test("English support requires an Italian practice span with native pronunciation", () => {
  const gate = buildTutorTeacherTalkLanguageGate({
    supportLanguageCode: "en-US",
    targetLanguageCode: "it-IT",
  });

  assert.match(gate, /say that exact word or phrase in the practice language/);
  assert.match(gate, /do not translate, omit, or replace it/);
  assert.match(gate, /native accent and sounds/);
  assert.match(gate, /switch immediately back to English/);
});

test("same-language tutoring removes the code-switch exception", () => {
  const gate = buildTutorTeacherTalkLanguageGate({
    supportLanguageCode: "es",
    targetLanguageCode: "es",
  });

  assert.match(gate, /Usa español en toda la respuesta/);
  assert.doesNotMatch(gate, /palabra o frase exacta/);
  assert.doesNotMatch(gate, /acento y los sonidos nativos/);
  assert.doesNotMatch(gate, /«Now»/);
});

test("unknown support languages do not invent a fallback gate", () => {
  assert.equal(
    buildTutorTeacherTalkLanguageGate({
      supportLanguageCode: "unknown",
      targetLanguageCode: "en",
    }),
    "",
  );
});
