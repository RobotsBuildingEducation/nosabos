import test from "node:test";
import assert from "node:assert/strict";
import { createPublicCopyCache } from "./cache.js";

test("only the selected page and language load; concurrent requests share work", async () => {
  const calls = [];
  let finish;
  const cache = createPublicCopyCache({ landing: { en: async () => { calls.push("en"); return {}; }, es: () => { calls.push("es"); return new Promise((resolve) => { finish = resolve; }); } }, links: { es: () => { assert.fail("Another page must stay unloaded"); } } });
  const first = cache.load("landing", "es-MX");
  assert.equal(cache.load("landing", "es"), first);
  assert.throws(() => cache.read("landing", "es"), (value) => value === first);
  await Promise.resolve();
  assert.deepEqual(calls, ["es"]);
  const copy = { copy: { cta_start: "Comenzar" } };
  finish(copy);
  assert.equal(await first, copy);
  assert.equal(cache.read("landing", "es"), copy);
  assert.deepEqual(calls, ["es"]);
});

test("an unsupported language uses English without requesting other languages", async () => {
  let calls = 0;
  const copy = { hero_title: "Language Tutor" };
  const cache = createPublicCopyCache({ landing: { en: async () => { calls++; return copy; } } });
  await cache.load("landing", "unknown");
  assert.equal(cache.read("landing", "unknown"), copy);
  assert.equal(calls, 1);
  assert.throws(() => cache.load("other-page", "en"), /Unknown public page/);
});

test("a failed language request can be retried while successful cached copy remains available", async () => {
  let attempts = 0;
  const english = { hello: "Hello" }, spanish = { hello: "Hola" };
  const cache = createPublicCopyCache({ landing: { en: async () => english, es: async () => { if (++attempts === 1) throw new Error("offline"); return spanish; } } });
  await cache.load("landing", "en");
  await assert.rejects(cache.load("landing", "es"), /offline/);
  assert.throws(() => cache.read("landing", "es"), /offline/);
  assert.equal(cache.read("landing", "en"), english);
  await cache.load("landing", "es");
  assert.equal(cache.read("landing", "es"), spanish);
  assert.equal(attempts, 2);
});

test("every public landing locale has complete page, demo, atlas and companion copy", async () => {
  for (const locale of ["en", "es", "it", "pt", "de", "hi", "zh", "ar", "fr", "ja"]) {
    const words = await import(`./landing/${locale}.js`);
    for (const key of ["copy", "refresh", "capabilities", "ethos", "atlas", "tutor", "companionNames"]) assert.ok(words[key], `${locale}:${key}`);
    for (const key of ["hero_title", "cta_start", "placeholder_name", "signin_title"]) assert.ok(words.copy[key], `${locale}:${key}`);
    assert.equal(words.ethos.principles.length, 3);
    assert.ok(words.atlas.meanings.hello);
    for (const pet of ["dog", "ghost", "alien", "slime", "robot", "axolotl"]) assert.ok(words.companionNames[pet], `${locale}:${pet}`);
  }
});
