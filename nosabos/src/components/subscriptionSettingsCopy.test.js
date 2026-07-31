import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBSCRIPTION_SETTINGS_COPY,
  SUBSCRIPTION_SETTINGS_REQUIRED_KEYS,
} from "./subscriptionSettingsCopy.js";
import { SUBSCRIPTION_RECOVERY_EXPIRED_COPY } from "./subscriptionRecoveryCopy.js";

const supportedLanguages = [
  "en",
  "es",
  "pt",
  "it",
  "fr",
  "de",
  "ja",
  "hi",
  "ar",
  "zh",
];

test("subscription settings copy is complete for every supported language", () => {
  assert.deepEqual(Object.keys(SUBSCRIPTION_SETTINGS_COPY), supportedLanguages);
  supportedLanguages.forEach((language) => {
    SUBSCRIPTION_SETTINGS_REQUIRED_KEYS.forEach((key) => {
      assert.equal(
        typeof SUBSCRIPTION_SETTINGS_COPY[language][key],
        "string",
        `${language}.${key} must be localized`,
      );
      assert.notEqual(
        SUBSCRIPTION_SETTINGS_COPY[language][key].trim(),
        "",
        `${language}.${key} cannot be empty`,
      );
    });
  });
});

test("expired recovery guidance is localized for every supported language", () => {
  assert.deepEqual(
    Object.keys(SUBSCRIPTION_RECOVERY_EXPIRED_COPY),
    supportedLanguages,
  );
  supportedLanguages.forEach((language) => {
    assert.equal(
      typeof SUBSCRIPTION_RECOVERY_EXPIRED_COPY[language],
      "string",
    );
    assert.notEqual(SUBSCRIPTION_RECOVERY_EXPIRED_COPY[language].trim(), "");
  });
});
