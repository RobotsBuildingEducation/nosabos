import test from "node:test";
import assert from "node:assert/strict";

import {
  CEFR_LEVELS,
  CEFR_LEVEL_INFO,
  getCefrLevelDetails,
  normalizeLevelKey,
} from "./cefrLevelInfo.js";

const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "ja",
  "zh",
  "ru",
  "ar",
  "hi",
];

test("CEFR_LEVELS covers Pre-A1 through C2 in order", () => {
  assert.deepEqual(CEFR_LEVELS, [
    "Pre-A1",
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
  ]);
});

test("CEFR_LEVEL_INFO has complete name and description for all 11 supported languages", () => {
  for (const level of CEFR_LEVELS) {
    const info = CEFR_LEVEL_INFO[level];
    assert.ok(info, `Missing info for level ${level}`);
    assert.ok(info.color, `Missing color for ${level}`);
    assert.ok(info.gradient, `Missing gradient for ${level}`);

    for (const lang of SUPPORTED_LANGUAGES) {
      assert.ok(
        typeof info.name[lang] === "string" && info.name[lang].length > 0,
        `Missing ${lang} name for ${level}`,
      );
      assert.ok(
        typeof info.description[lang] === "string" &&
          info.description[lang].length > 0,
        `Missing ${lang} description for ${level}`,
      );
    }
  }
});

test("normalizeLevelKey handles casing and aliases", () => {
  assert.equal(normalizeLevelKey("b1"), "B1");
  assert.equal(normalizeLevelKey("B1"), "B1");
  assert.equal(normalizeLevelKey("a0"), "Pre-A1");
  assert.equal(normalizeLevelKey("A0"), "Pre-A1");
  assert.equal(normalizeLevelKey("pre-a1"), "Pre-A1");
  assert.equal(normalizeLevelKey("Pre-A1"), "Pre-A1");
  assert.equal(normalizeLevelKey("PRE_A1"), "Pre-A1");
  assert.equal(normalizeLevelKey("unknown"), "Pre-A1");
  assert.equal(normalizeLevelKey(null), "Pre-A1");
  assert.equal(normalizeLevelKey(""), "Pre-A1");
});

test("getCefrLevelDetails resolves localized name and description", () => {
  const b1En = getCefrLevelDetails("B1", "en");
  assert.equal(b1En.name, "Intermediate");
  assert.equal(b1En.description, "Handle everyday situations");

  const b1Es = getCefrLevelDetails("B1", "es");
  assert.equal(b1Es.name, "Intermedio");
  assert.equal(b1Es.description, "Manejo de situaciones cotidianas");

  const b1De = getCefrLevelDetails("B1", "de");
  assert.equal(b1De.name, "Mittelstufe");
  assert.equal(b1De.description, "Alltagssituationen bewältigen");

  const b1Ru = getCefrLevelDetails("B1", "ru");
  assert.equal(b1Ru.name, "Средний");
  assert.equal(b1Ru.description, "Понимание повседневных ситуаций");

  const b1Ja = getCefrLevelDetails("B1", "ja");
  assert.equal(b1Ja.name, "中級");
  assert.equal(b1Ja.description, "日常場面に対応");

  const b1Zh = getCefrLevelDetails("B1", "zh");
  assert.equal(b1Zh.name, "中级");
  assert.equal(b1Zh.description, "处理日常情境");
});

test("getCefrLevelDetails falls back safely for unknown languages and locale variants", () => {
  const esVariant = getCefrLevelDetails("A1", "es-MX");
  assert.equal(esVariant.name, "Principiante");
  assert.equal(esVariant.description, "Lenguaje básico de supervivencia");

  const fallback = getCefrLevelDetails("C1", "klingon");
  assert.equal(fallback.name, "Advanced");
  assert.equal(fallback.description, "Sophisticated language use");
});
