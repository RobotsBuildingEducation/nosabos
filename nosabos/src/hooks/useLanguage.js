import { create } from "zustand";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  SUPPORT_LANGUAGE_CODES,
  isSupportedSupportLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

// Spanish-speaking timezone identifiers
const spanishTimezones = [
  // Spain
  "Europe/Madrid",
  "Atlantic/Canary",
  // Mexico
  "America/Mexico_City",
  "America/Tijuana",
  "America/Monterrey",
  "America/Merida",
  "America/Cancun",
  "America/Chihuahua",
  "America/Mazatlan",
  "America/Hermosillo",
  // Central America
  "America/Guatemala",
  "America/El_Salvador",
  "America/Tegucigalpa",
  "America/Managua",
  "America/Costa_Rica",
  "America/Panama",
  // South America
  "America/Bogota",
  "America/Lima",
  "America/Guayaquil",
  "America/Caracas",
  "America/La_Paz",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Montevideo",
  "America/Asuncion",
  // Caribbean
  "America/Havana",
  "America/Santo_Domingo",
  "America/Puerto_Rico",
];

const italianTimezones = ["Europe/Rome", "Europe/Vatican", "Europe/San_Marino"];

const japaneseTimezones = ["Asia/Tokyo"];

const frenchTimezones = [
  "Europe/Paris",
  "Europe/Monaco",
  "America/Martinique",
  "America/Guadeloupe",
  "America/Cayenne",
  "America/Miquelon",
  "Indian/Reunion",
  "Indian/Mayotte",
  "Pacific/Noumea",
  "Pacific/Tahiti",
  "Pacific/Marquesas",
  "Pacific/Wallis",
  "Africa/Abidjan",
  "Africa/Algiers",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Brazzaville",
  "Africa/Dakar",
  "Africa/Douala",
  "Africa/Kinshasa",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Porto-Novo",
  "Africa/Tunis",
];

// Detect language based on timezone
const detectLanguageFromTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (italianTimezones.includes(timezone)) {
      return "it";
    }
    if (frenchTimezones.includes(timezone)) {
      return "fr";
    }
    if (japaneseTimezones.includes(timezone)) {
      return "ja";
    }
    if (spanishTimezones.includes(timezone)) {
      return "es";
    }
  } catch (e) {
    console.warn("Could not detect timezone:", e);
  }
  return DEFAULT_SUPPORT_LANGUAGE;
};

// Read language from localStorage
const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem("appLanguage");
    if (isSupportedSupportLanguage(stored)) {
      return normalizeSupportLanguage(stored);
    }
  } catch {}
  return null;
};

// Write language to localStorage (synchronous, immediate)
const setStoredLanguage = (lang) => {
  try {
    if (isSupportedSupportLanguage(lang)) {
      localStorage.setItem("appLanguage", normalizeSupportLanguage(lang));
    }
  } catch {}
};

// Create the language store (no persist middleware - we handle it manually for sync writes)
const useLanguage = create((set, get) => ({
  language: getStoredLanguage(), // Initialize from localStorage immediately

  // Initialize language (only sets if not already set by user)
  initLanguage: () => {
    const currentLang = get().language;
    if (currentLang === null) {
      // Check if appLanguage already exists in localStorage (set by App.jsx)
      const stored = getStoredLanguage();
      if (stored) {
        set({ language: stored });
        return stored;
      }
      // Otherwise detect from timezone
      const detectedLang = detectLanguageFromTimezone();
      setStoredLanguage(detectedLang); // Write immediately
      set({ language: detectedLang });
      return detectedLang;
    }
    return currentLang;
  },

  // Set language explicitly (user preference)
  setLanguage: (lang) => {
    const nextLang = normalizeSupportLanguage(
      lang,
      get().language || DEFAULT_SUPPORT_LANGUAGE,
    );
    setStoredLanguage(nextLang); // Write immediately
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
    set({ language: newLang });
  },

  // Get translation helper
  t: (translations) => {
    const lang = get().language || "en";
    return translations[lang] ?? translations.en;
  },
}));

export default useLanguage;
