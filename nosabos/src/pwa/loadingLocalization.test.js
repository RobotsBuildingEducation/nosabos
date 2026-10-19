import test from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import { INITIAL_LANGUAGE_CONFIG, LANGUAGE_TIMEZONES, resolveInitialLanguage, detectInitialLanguage } from "../utils/initialLanguage.js";
import { LOADING_COPY } from "./loadingCopy/index.js";
import { createLoadingLocalization } from "./loadingLocalization.js";
import { classifyLoadingResource } from "./loadingActivityCopy.js";

const config = { initial: INITIAL_LANGUAGE_CONFIG, copy: LOADING_COPY, languageNames: { es: "Spanish" } };
const browser = (language) => ({ localStorage: { getItem: () => language }, navigator: { languages: ["en-US"] } });

test("saved interface preferences override timezone and browser defaults, including aliases and regional codes", () => {
  for (const [storedLanguage, expected] of [["fr-CA", "fr"], ["JA_jp", "ja"], ["arz", "ar"], ["cmn-Hans", "zh"]]) {
    assert.equal(resolveInitialLanguage(INITIAL_LANGUAGE_CONFIG, { storedLanguage, timeZone: "America/Mexico_City", browserLanguages: ["de-DE"] }), expected);
  }
});

test("every supported regional default matches before falling back to browser preferences", () => {
  for (const [expected, zones] of Object.entries(LANGUAGE_TIMEZONES)) {
    for (const timeZone of zones) {
      assert.equal(resolveInitialLanguage(INITIAL_LANGUAGE_CONFIG, { timeZone, browserLanguages: ["en-US"] }), expected, timeZone);
    }
  }
  assert.equal(resolveInitialLanguage(INITIAL_LANGUAGE_CONFIG, { timeZone: "America/New_York", browserLanguages: ["fr-CA"] }), "fr");
  assert.equal(resolveInitialLanguage(INITIAL_LANGUAGE_CONFIG, { storedLanguage: "nl", browserLanguages: ["nl-NL"] }), "en");
});

test("disabled storage and missing browser preferences still produce a supported language", () => {
  const detected = detectInitialLanguage({ get localStorage() { throw new Error("Storage unavailable"); } });
  assert.ok(SUPPORT_LANGUAGE_CODES.includes(detected));
});

test("all interface languages translate every loader label and resource subject", () => {
  assert.deepEqual(Object.keys(LOADING_COPY).sort(), [...SUPPORT_LANGUAGE_CODES].sort());
  for (const language of SUPPORT_LANGUAGE_CODES) {
    const copy = LOADING_COPY[language];
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(LOADING_COPY.en).sort());
    assert.deepEqual(Object.keys(copy.subjects).sort(), Object.keys(LOADING_COPY.en.subjects).sort());
    assert.ok(Object.values(copy).filter((value) => typeof value === "string").every((value) => value.trim()));
    assert.ok(Object.values(copy.subjects).every((value) => value.trim()));
    if (language !== "en") assert.notEqual(copy.title, LOADING_COPY.en.title);
  }
});

test("the serialized inline localizer works before app modules, using timezone defaults", () => {
  const window = browser(null);
  const intl = { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: "America/Mexico_City" }) }), DisplayNames: Intl.DisplayNames, NumberFormat: Intl.NumberFormat };
  const api = runInNewContext(`(${createLoadingLocalization.toString()})(${JSON.stringify(config)}, (${resolveInitialLanguage.toString()}), window)`, { window, Intl: intl });
  assert.equal(api.language, "es");
  assert.equal(api.getCopy().title, "Abriendo Piyali");
  assert.match(api.percentage(44), /44.*listo/);
});

test("language content, pronunciation, characters, and failures use the selected interface language", () => {
  const api = createLoadingLocalization(config, resolveInitialLanguage, browser("es"));
  assert.equal(api.activity(classifyLoadingResource("/assets/es-abc.js"), "loading"), "Descargando contenido en español…");
  assert.equal(api.activity(classifyLoadingResource("/src/data/phonics/es.js"), "loading"), "Descargando práctica de pronunciación en español…");
  assert.equal(api.activity(classifyLoadingResource("/assets/1-abc.webp"), "ready"), "Listo: las ilustraciones de los personajes");
  assert.equal(api.activity(classifyLoadingResource("/assets/1-abc.webp"), "failed"), "Todavía no pudimos cargar las ilustraciones de los personajes.");
  assert.equal(api.stage("path", "es"), "Preparando tus lecciones de español…");
  assert.equal(api.setLanguage("ar"), true);
  assert.equal(api.getCopy().title, "جارٍ فتح Piyali");
  assert.ok(api.percentage(44).includes(new Intl.NumberFormat("ar", { style: "percent", maximumFractionDigits: 0 }).format(0.44)));
  assert.match(api.percentage(44), /جاهز$/);
  assert.equal(api.setLanguage("ar"), false);
});

test("English resource copy retains the existing product wording", () => {
  const api = createLoadingLocalization(config, resolveInitialLanguage, browser("en"));
  for (const path of ["/assets/es-abc.js", "/src/data/phonics/es.js", "/assets/1-abc.webp", "/src/components/LinksPage.jsx", "/src/nostr.js", "/src/voice.js", "/src/Static.js", "/src/main.jsx"]) {
    const descriptor = classifyLoadingResource(path);
    for (const state of ["loading", "ready", "failed"]) assert.equal(api.activity(descriptor, state), descriptor[state]);
  }
});

test("internal loading labels can use saved account language without changing global startup state", () => {
  const api = createLoadingLocalization(config, resolveInitialLanguage, browser("es"));
  assert.equal(api.getCopy("ja").preparing, "準備中…");
  assert.equal(api.language, "es");
});
