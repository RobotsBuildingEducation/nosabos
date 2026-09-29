import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("GrammarBookLegacy initializes targetLang before cefrLevel and curriculumCefrLevel", () => {
  const fileContent = readFileSync(
    resolve(__dirname, "GrammarBook.jsx"),
    "utf8",
  );

  const legacyFnIndex = fileContent.indexOf("function GrammarBookLegacy(");
  assert.ok(legacyFnIndex !== -1, "GrammarBookLegacy function should exist");

  const legacyBody = fileContent.slice(legacyFnIndex);

  const targetLangDeclIndex = legacyBody.indexOf("const targetLang = normalizePracticeLanguage(");
  const cefrLevelDeclIndex = legacyBody.indexOf("const cefrLevel =");
  const curriculumCefrLevelIndex = legacyBody.indexOf("const curriculumCefrLevel =");

  assert.ok(targetLangDeclIndex !== -1, "targetLang declaration should exist");
  assert.ok(cefrLevelDeclIndex !== -1, "cefrLevel declaration should exist");
  assert.ok(curriculumCefrLevelIndex !== -1, "curriculumCefrLevel declaration should exist");

  assert.ok(
    targetLangDeclIndex < cefrLevelDeclIndex,
    `targetLang must be declared before cefrLevel to avoid ReferenceError TDZ access: targetLang index ${targetLangDeclIndex}, cefrLevel index ${cefrLevelDeclIndex}`,
  );
  assert.ok(
    targetLangDeclIndex < curriculumCefrLevelIndex,
    `targetLang must be declared before curriculumCefrLevel to avoid ReferenceError TDZ access: targetLang index ${targetLangDeclIndex}, curriculumCefrLevel index ${curriculumCefrLevelIndex}`,
  );
});

test("Vocabulary initializes targetLang before cefrLevel and curriculumCefrLevel", () => {
  const fileContent = readFileSync(
    resolve(__dirname, "Vocabulary.jsx"),
    "utf8",
  );

  const vocabFnIndex = fileContent.indexOf("function VocabularyLegacy(");
  assert.ok(vocabFnIndex !== -1, "VocabularyLegacy function should exist");

  const vocabBody = fileContent.slice(vocabFnIndex);

  const targetLangDeclIndex = vocabBody.indexOf("const targetLang = normalizePracticeLanguage(");
  const cefrLevelDeclIndex = vocabBody.indexOf("const cefrLevel =");
  const curriculumCefrLevelIndex = vocabBody.indexOf("const curriculumCefrLevel =");

  assert.ok(targetLangDeclIndex !== -1, "targetLang declaration should exist");
  assert.ok(cefrLevelDeclIndex !== -1, "cefrLevel declaration should exist");
  assert.ok(curriculumCefrLevelIndex !== -1, "curriculumCefrLevel declaration should exist");

  assert.ok(
    targetLangDeclIndex < cefrLevelDeclIndex,
    `targetLang must be declared before cefrLevel: targetLang index ${targetLangDeclIndex}, cefrLevel index ${cefrLevelDeclIndex}`,
  );
  assert.ok(
    targetLangDeclIndex < curriculumCefrLevelIndex,
    `targetLang must be declared before curriculumCefrLevel: targetLang index ${targetLangDeclIndex}, curriculumCefrLevel index ${curriculumCefrLevelIndex}`,
  );
});
