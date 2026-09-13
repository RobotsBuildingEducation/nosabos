import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVITY_MENU_COPY,
  getActivityMenuLabels,
  normalizeSupportCode,
} from "./activityMenuCopy.js";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";

test("ACTIVITY_MENU_COPY defines all required menu keys for every support language", () => {
  const expectedKeys = [
    "settings",
    "immersion",
    "assistant",
    "memory",
    "mode",
    "exitLesson",
    "back",
    "closeMenu",
  ];

  for (const key of expectedKeys) {
    assert.ok(ACTIVITY_MENU_COPY[key], `Missing key ${key} in ACTIVITY_MENU_COPY`);
    for (const lang of SUPPORT_LANGUAGE_CODES) {
      const val = ACTIVITY_MENU_COPY[key][lang];
      assert.ok(
        typeof val === "string" && val.trim().length > 0,
        `Expected non-empty string for ${key}.${lang}, got ${val}`,
      );
    }
  }
});

test("getActivityMenuLabels returns fully localized labels for French without English fallbacks", () => {
  // Simulating translations.fr which previously lacked app_settings_aria and inherited 'Settings'
  const mockFrTranslations = {
    app_settings_aria: "Settings", // English inheritance bug
    app_help_chat: "Assistant",
    real_world_tasks_title: "Pratique d'immersion",
    app_notes: "Mémoire",
    app_mode_menu: "Mode",
  };

  const labels = getActivityMenuLabels("fr", mockFrTranslations);
  assert.equal(labels.settings, "Paramètres");
  assert.equal(labels.immersion, "Pratique d'immersion");
  assert.equal(labels.assistant, "Assistant");
  assert.equal(labels.memory, "Mémoire");
  assert.equal(labels.mode, "Mode");
  assert.equal(labels.back, "Retour");
  assert.equal(labels.exitLesson, "Quitter la leçon");
  assert.equal(labels.closeMenu, "Fermer le menu");
});

test("getActivityMenuLabels handles German without 'Einstellungen öffnen' screen-reader text", () => {
  const mockDeTranslations = {
    app_settings_aria: "Einstellungen öffnen",
    app_help_chat: "Assistent",
    real_world_tasks_title: "Immersionsübung",
    app_notes: "Erinnerung",
  };

  const labels = getActivityMenuLabels("de", mockDeTranslations);
  assert.equal(labels.settings, "Einstellungen");
  assert.equal(labels.immersion, "Immersionsübung");
  assert.equal(labels.assistant, "Assistent");
  assert.equal(labels.memory, "Erinnerung");
});

test("getActivityMenuLabels handles Italian correctly", () => {
  const mockItTranslations = {
    app_settings_aria: "Settings", // Inherited bug
    app_help_chat: "Assistente",
    real_world_tasks_title: "Pratica di immersione",
    app_notes: "Memoria",
  };

  const labels = getActivityMenuLabels("it", mockItTranslations);
  assert.equal(labels.settings, "Impostazioni");
  assert.equal(labels.immersion, "Pratica di immersione");
  assert.equal(labels.assistant, "Assistente");
  assert.equal(labels.memory, "Memoria");
});

test("getActivityMenuLabels handles Arabic correctly", () => {
  const mockArTranslations = {
    app_settings_aria: "Settings", // Inherited bug
    app_help_chat: "المساعد",
    real_world_tasks_title: "تدريب الانغماس",
    app_notes: "الذاكرة",
  };

  const labels = getActivityMenuLabels("ar", mockArTranslations);
  assert.equal(labels.settings, "الإعدادات");
  assert.equal(labels.immersion, "تدريب الانغماس");
  assert.equal(labels.assistant, "المساعد");
  assert.equal(labels.memory, "الذاكرة");
});

test("normalizeSupportCode parses language tags and country codes", () => {
  assert.equal(normalizeSupportCode("fr-FR"), "fr");
  assert.equal(normalizeSupportCode("es_MX"), "es");
  assert.equal(normalizeSupportCode("pt-BR"), "pt");
  assert.equal(normalizeSupportCode("zh-CN"), "zh");
  assert.equal(normalizeSupportCode("unknown"), "en");
});
