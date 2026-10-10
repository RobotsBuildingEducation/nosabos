import test from "node:test";
import assert from "node:assert/strict";
import { INDEXABLE_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, UTILITY_PUBLIC_PATHS, PRACTICE_LANGUAGES, getPublicMetadata } from "./publicRoutes.js";
import { renderLearningDocument } from "./learningPage.js";

test("every discoverable page has reciprocal language alternatives and a canonical URL", () => {
  for (const path of [...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS]) {
    const metadata = getPublicMetadata(path);
    assert.equal(metadata.indexable, true, path);
    assert.equal(metadata.alternates.find(item => item.language === metadata.locale).url, metadata.canonical, path);
    for (const alternative of metadata.alternates.filter(item => item.language !== "x-default")) {
      const translated = getPublicMetadata(new URL(alternative.url).pathname);
      assert.equal(translated.canonical, alternative.url, path);
      assert.ok(translated.alternates.some(item => item.url === metadata.canonical), path);
    }
  }
});

test("callback, account, playground and unsupported language routes are not indexed", () => {
  for (const path of [...UTILITY_PUBLIC_PATHS, "/unknown", "/es/learn/ar", "/zh/learn/nah"]) {
    assert.equal(getPublicMetadata(path).robots, "noindex, follow", path);
  }
  assert.equal(PRACTICE_LANGUAGES.length, 12);
});

test("learning pages contain real lesson examples, readable content and no executable JavaScript", () => {
  for (const path of [...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS].filter(path => getPublicMetadata(path).target)) {
    const html = renderLearningDocument(path);
    const metadata = getPublicMetadata(path);
    assert.ok(html.includes(`<html lang="${metadata.locale}"`), path);
    assert.ok(html.includes(`<ul class="examples" lang="${metadata.target}"`), path);
    assert.ok((html.match(/<li>/g) || []).length >= 4, path);
    assert.doesNotMatch(html, /<script(?! type="application\/ld\+json")/);
    const schema = JSON.parse(html.match(/data-public-schema>([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema["@graph"].find(item => item["@type"] === "WebPage").url, metadata.canonical, path);
  }
});
