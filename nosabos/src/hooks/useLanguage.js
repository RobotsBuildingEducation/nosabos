import { create } from "zustand";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  SUPPORT_LANGUAGE_CODES,
  isSupportedSupportLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import { syncDocumentLanguage } from "../utils/documentLanguage";

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
const hindiTimezones = ["Asia/Kolkata", "Asia/Calcutta"];
const arabicTimezones = ["Africa/Cairo"];
const chineseTimezones = [
  "Asia/Shanghai",
  "Asia/Urumqi",
  "Asia/Hong_Kong",
  "Asia/Macau",
  "Asia/Taipei",
  "Asia/Singapore",
];

const portugueseTimezones = [
  "Europe/Lisbon",
  "Atlantic/Madeira",
  "Atlantic/Azores",
  "America/Sao_Paulo",
  "America/Rio_Branco",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Maceio",
  "America/Araguaina",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "Africa/Maputo",
  "Africa/Luanda",
  "Atlantic/Cape_Verde",
  "Africa/Bissau",
  "Africa/Sao_Tome",
  "Asia/Dili",
];

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
    if (arabicTimezones.includes(timezone)) {
      return "ar";
    }
    if (chineseTimezones.includes(timezone)) {
      return "zh";
    }
    if (hindiTimezones.includes(timezone)) {
      return "hi";
    }
    if (italianTimezones.includes(timezone)) {
      return "it";
    }
    if (frenchTimezones.includes(timezone)) {
      return "fr";
    }
    if (portugueseTimezones.includes(timezone)) {
      return "pt";
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
    if (currentLang !== null) {
      const normalizedCurrentLang = normalizeSupportLanguage(
        currentLang,
        DEFAULT_SUPPORT_LANGUAGE,
      );
      syncDocumentLanguage(normalizedCurrentLang);
      return normalizedCurrentLang;
    }

    // Check if appLanguage already exists in localStorage (set by App.jsx)
    const stored = getStoredLanguage();
    if (stored) {
      syncDocumentLanguage(stored);
      set({ language: stored });
      return stored;
    }

    // Otherwise detect from timezone
    const detectedLang = detectLanguageFromTimezone();
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
