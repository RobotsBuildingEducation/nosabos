import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBSCRIPTION_SETTINGS_COPY,
  SUBSCRIPTION_SETTINGS_REQUIRED_KEYS,
} from "./subscriptionSettingsCopy.js";
import { SUBSCRIPTION_RECOVERY_EXPIRED_COPY } from "./subscriptionRecoveryCopy.js";
import {
  SUBSCRIPTION_PATREON_FLOW_COPY,
  SUBSCRIPTION_PATREON_FLOW_REQUIRED_KEYS,
} from "./subscriptionPatreonFlowCopy.js";
import {
  SUBSCRIPTION_LEGACY_MIGRATION_COPY,
  SUBSCRIPTION_LEGACY_MIGRATION_REQUIRED_KEYS,
} from "./subscriptionLegacyMigrationCopy.js";
import {
  SUBSCRIPTION_KEY_REPLACEMENT_COPY,
  SUBSCRIPTION_KEY_REPLACEMENT_REQUIRED_KEYS,
} from "./subscriptionKeyReplacementCopy.js";

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

test("guided Patreon checkout copy is localized for every supported language", () => {
  assert.deepEqual(
    Object.keys(SUBSCRIPTION_PATREON_FLOW_COPY),
    supportedLanguages,
  );
  supportedLanguages.forEach((language) => {
    SUBSCRIPTION_PATREON_FLOW_REQUIRED_KEYS.forEach((key) => {
      assert.equal(
        typeof SUBSCRIPTION_PATREON_FLOW_COPY[language][key],
        "string",
        `${language}.${key} must be localized`,
      );
      assert.notEqual(
        SUBSCRIPTION_PATREON_FLOW_COPY[language][key].trim(),
        "",
        `${language}.${key} cannot be empty`,
      );
    });
  });
});

test("guided Patreon checkout advertises the current annual offer", () => {
  supportedLanguages.forEach((language) => {
    const copy = SUBSCRIPTION_PATREON_FLOW_COPY[language];
    assert.match(copy.membershipPrice, /\$8/);
    assert.match(copy.annualRecommended, /50/);
    assert.match(copy.annualValue, /\$4/);
    assert.match(copy.annualValue, /\$48/);
  });
});

test("legacy passcode migration copy is localized for every supported language", () => {
  assert.deepEqual(
    Object.keys(SUBSCRIPTION_LEGACY_MIGRATION_COPY),
    supportedLanguages,
  );
  supportedLanguages.forEach((language) => {
    SUBSCRIPTION_LEGACY_MIGRATION_REQUIRED_KEYS.forEach((key) => {
      assert.equal(
        typeof SUBSCRIPTION_LEGACY_MIGRATION_COPY[language][key],
        "string",
        `${language}.${key} must be localized`,
      );
      assert.notEqual(
        SUBSCRIPTION_LEGACY_MIGRATION_COPY[language][key].trim(),
        "",
        `${language}.${key} cannot be empty`,
      );
    });
  });
});

test("key replacement copy is localized for every supported language", () => {
  assert.deepEqual(
    Object.keys(SUBSCRIPTION_KEY_REPLACEMENT_COPY),
    supportedLanguages,
  );
  supportedLanguages.forEach((language) => {
    SUBSCRIPTION_KEY_REPLACEMENT_REQUIRED_KEYS.forEach((key) => {
      assert.equal(
        typeof SUBSCRIPTION_KEY_REPLACEMENT_COPY[language][key],
        "string",
        `${language}.${key} must be localized`,
      );
      assert.notEqual(
        SUBSCRIPTION_KEY_REPLACEMENT_COPY[language][key].trim(),
        "",
        `${language}.${key} cannot be empty`,
      );
    });
  });
});
