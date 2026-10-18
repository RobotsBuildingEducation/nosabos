import { create } from "zustand";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  SUPPORT_LANGUAGE_CODES,
  isSupportedSupportLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import { syncDocumentLanguage } from "../utils/documentLanguage";

import { detectUserLanguage } from "../utils/languageDetection";

// Read language from localStorage
const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem("appLanguage");
    if (isSupportedSupportLanguage(stored)) {
      return normalizeSupportLanguage(stored);
    }
  } catch { /* Browser storage can be disabled. */ }
  return null;
};

// Write language to localStorage (synchronous, immediate)
const setStoredLanguage = (lang) => {
  try {
    if (isSupportedSupportLanguage(lang)) {
      localStorage.setItem("appLanguage", normalizeSupportLanguage(lang));
    }
  } catch { /* Keep the in-memory selection when storage is disabled. */ }
};

// Create the language store (no persist middleware - we handle it manually for sync writes)
const useLanguage = create((set, get) => ({
  language: getStoredLanguage(), // Initialize from localStorage immediately

  // Initialize language (only sets if not already set by user)
  initLanguage: () => {
    // Account settings or another public page may have updated storage since
    // this store was created. Prefer that saved choice over stale memory.
    const stored = getStoredLanguage();
    if (stored) {
      syncDocumentLanguage(stored);
      if (get().language !== stored) set({ language: stored });
      return stored;
    }

    const currentLang = get().language;
    if (currentLang !== null) {
      const normalizedCurrentLang = normalizeSupportLanguage(
        currentLang,
        DEFAULT_SUPPORT_LANGUAGE,
      );
      syncDocumentLanguage(normalizedCurrentLang);
      return normalizedCurrentLang;
    }

    // Otherwise use the shared timezone/browser default
    const detectedLang = detectUserLanguage();
    setStoredLanguage(detectedLang); // Write immediately
    syncDocumentLanguage(detectedLang);
    set({ language: detectedLang });
    return detectedLang;
  },

  // Set language explicitly (user preference)
  setLanguage: (lang) => {
    const nextLang = normalizeSupportLanguage(
      lang,
      get().language || DEFAULT_SUPPORT_LANGUAGE,
    );
    setStoredLanguage(nextLang); // Write immediately
    syncDocumentLanguage(nextLang);
    set({ language: nextLang });
  },

  // Cycle through supported app languages
  toggleLanguage: () => {
    const currentLang = normalizeSupportLanguage(
      get().language,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const currentIndex = SUPPORT_LANGUAGE_CODES.indexOf(currentLang);
    const newLang =
      SUPPORT_LANGUAGE_CODES[
        (currentIndex + 1) % SUPPORT_LANGUAGE_CODES.length
      ] || DEFAULT_SUPPORT_LANGUAGE;
    setStoredLanguage(newLang); // Write immediately
    syncDocumentLanguage(newLang);
    set({ language: newLang });
  },

  // Get translation helper
  t: (translations) => {
    const lang = get().language || "en";
    return translations[lang] ?? translations.en;
  },
}));

export default useLanguage;
