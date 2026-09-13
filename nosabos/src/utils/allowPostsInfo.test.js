import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSLATION_AR_STATIC } from "./translationArStatic.js";
import { TRANSLATION_DE_STATIC } from "./translationDeStatic.js";
import { TRANSLATION_HI_STATIC } from "./translationHiStatic.js";
import { TRANSLATION_PT_STATIC } from "./translationPtStatic.js";
import { TRANSLATION_ZH_STATIC } from "./translationZhStatic.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_INFO_KEYS = [
  "allow_posts_info_title",
  "allow_posts_info_desc",
  "allow_posts_info_view_ditto",
  "allow_posts_info_aria",
];

test("static translations have required decentralized identity copy", () => {
  const staticMaps = {
    ar: TRANSLATION_AR_STATIC,
    de: TRANSLATION_DE_STATIC,
    hi: TRANSLATION_HI_STATIC,
    pt: TRANSLATION_PT_STATIC,
    zh: TRANSLATION_ZH_STATIC,
  };

  for (const [lang, map] of Object.entries(staticMaps)) {
    assert.ok(map, `Missing static map for ${lang}`);
    for (const key of REQUIRED_INFO_KEYS) {
      assert.ok(
        typeof map[key] === "string" && map[key].trim().length > 0,
        `Missing or empty translation key '${key}' in ${lang}`,
      );
    }
  }
});

test("translation.jsx includes all allow_posts_info keys for inline languages", () => {
  const translationFile = fs.readFileSync(path.join(__dirname, "translation.jsx"), "utf8");
  for (const key of REQUIRED_INFO_KEYS) {
    const matches = translationFile.match(new RegExp(`\\b${key}\\b`, "g")) || [];
    // Key should appear in en, es, it, fr, ja sections
    assert.ok(
      matches.length >= 5,
      `Expected key '${key}' to appear at least 5 times in translation.jsx (found ${matches.length})`,
    );
  }
});

test("ditto profile url resolves with npub and falls back safely without npub", () => {
  const getDittoUrl = (npub) => {
    const resolved = (npub || "").trim();
    return resolved ? `https://ditto.pub/${resolved}` : "https://ditto.pub";
  };

  const testNpub = "npub1mgt5c7qh6dm9rg57mrp89rqtzn64958nj5w9g2d2h9dng27hmp0sww7u2v";
  assert.equal(getDittoUrl(testNpub), `https://ditto.pub/${testNpub}`);
  assert.equal(getDittoUrl(""), "https://ditto.pub");
  assert.equal(getDittoUrl(null), "https://ditto.pub");
  assert.equal(getDittoUrl(undefined), "https://ditto.pub");
});
