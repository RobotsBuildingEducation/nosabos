import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import {
  WORD_NEIGHBORHOODS_COPY,
  formatWordNeighborhoodsCopy,
  getWordNeighborhoodsCopy,
} from "./wordNeighborhoodsI18n.js";

test("Word Neighborhoods has complete copy for every support language", () => {
  const englishKeys = Object.keys(WORD_NEIGHBORHOODS_COPY.en).sort();
  const allLanguages = Object.keys(WORD_NEIGHBORHOODS_COPY);

  for (const supportCode of SUPPORT_LANGUAGE_CODES) {
    assert.ok(
      allLanguages.includes(supportCode),
      `Word Neighborhoods is missing support language ${supportCode}`,
    );
  }

  for (const language of allLanguages) {
    const copy = getWordNeighborhoodsCopy(language);
    assert.deepEqual(
      Object.keys(copy).sort(),
      englishKeys,
      `${language} is missing localized Word Neighborhoods copy`,
    );
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, "string", `${language}.${key} is not text`);
      assert.ok(value.trim(), `${language}.${key} is empty`);
    }
  }
});

test("Word Neighborhoods copy falls back safely for an unknown language", () => {
  assert.equal(
    getWordNeighborhoodsCopy("unknown"),
    WORD_NEIGHBORHOODS_COPY.en,
  );
});

test("Word Neighborhoods copy interpolates localized placeholders", () => {
  assert.equal(
    formatWordNeighborhoodsCopy("Groups: {groups}", {
      groups: "Food, Clothing",
    }),
    "Groups: Food, Clothing",
  );
});
