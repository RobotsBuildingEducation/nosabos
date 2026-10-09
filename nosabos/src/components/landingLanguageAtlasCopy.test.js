import assert from "node:assert/strict";
import test from "node:test";
import { createLanguagePostcards, LANGUAGE_POSTCARDS, languageAtlasCopy } from "./landingLanguageAtlasCopy.js";

test("English and Spanish always open with hello regardless of random selection", () => {
  for (const value of [0, 0.49, 0.5, 0.99]) {
    const cards = createLanguagePostcards(() => value);
    assert.equal(cards.en.greeting, "Hello!");
    assert.equal(cards.es.greeting, "¡Hola!");
    assert.equal(cards.en.greetingMeaning, "hello");
    assert.equal(cards.es.greetingMeaning, "hello");
  }
});

test("other languages can open with either pooled phrase, with matching translations and a distinct back", () => {
  const first = createLanguagePostcards(() => 0);
  const second = createLanguagePostcards(() => 0.99);
  for (const [code, original] of Object.entries(LANGUAGE_POSTCARDS)) {
    if (["en", "es"].includes(code)) continue;
    assert.equal(first[code].greeting, original.greeting);
    assert.equal(second[code].greeting, original.phrase);
    assert.equal(second[code].greetingMeaning, original.phraseMeaning);
    assert.equal(second[code].phrase, original.greeting);
    assert.equal(second[code].phraseMeaning, original.greetingMeaning);
    for (const words of Object.values(languageAtlasCopy)) {
      assert.ok(words.meanings[first[code].greetingMeaning]);
      assert.ok(words.meanings[second[code].greetingMeaning]);
    }
    assert.notStrictEqual(second[code], original);
  }
  for (const words of Object.values(languageAtlasCopy)) assert.ok(words.meanings.hello);
});
