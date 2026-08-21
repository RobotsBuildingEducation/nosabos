import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import {
  DIALOGUE_FORK_COPY,
  formatDialogueForkCopy,
  getDialogueForkCopy,
} from "./dialogueForkI18n.js";

test("Dialogue Fork has complete copy for every support language", () => {
  const englishKeys = Object.keys(DIALOGUE_FORK_COPY.en).sort();
  const allLanguages = Object.keys(DIALOGUE_FORK_COPY);

  for (const supportCode of SUPPORT_LANGUAGE_CODES) {
    assert.ok(
      allLanguages.includes(supportCode),
      `Dialogue Fork is missing support language ${supportCode}`,
    );
  }

  for (const language of allLanguages) {
    const copy = getDialogueForkCopy(language);
    assert.deepEqual(
      Object.keys(copy).sort(),
      englishKeys,
      `${language} is missing localized Dialogue Fork copy`,
    );
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, "string", `${language}.${key} is not text`);
      assert.ok(value.trim(), `${language}.${key} is empty`);
    }
  }
});

test("Dialogue Fork copy falls back safely for an unknown language", () => {
  assert.equal(getDialogueForkCopy("unknown"), DIALOGUE_FORK_COPY.en);
});

test("Dialogue Fork copy interpolates localized placeholders", () => {
  assert.equal(
    formatDialogueForkCopy("{speaker}: {line}", {
      speaker: "Server",
      line: "What would you like?",
    }),
    "Server: What would you like?",
  );
});
