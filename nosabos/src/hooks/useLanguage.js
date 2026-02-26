import { create } from "zustand";

// All supported UI/support language codes.
// When translations are added for a new language, add its code here.
const SUPPORTED_LANGUAGES = new Set([
  "en", "es", "pt", "fr", "it", "nl", "de",
  "ja", "ru", "el", "pl", "ga", "nah", "yua",
]);

// Timezone → language mapping for auto-detection.
// Only languages with clear geographic timezone associations are listed.
const TIMEZONE_LANG_MAP = {
  // Spanish-speaking
  "Europe/Madrid": "es",
  "Atlantic/Canary": "es",
  "America/Mexico_City": "es",
  "America/Tijuana": "es",
  "America/Monterrey": "es",
  "America/Merida": "es",
  "America/Cancun": "es",
  "America/Chihuahua": "es",
  "America/Mazatlan": "es",
  "America/Hermosillo": "es",
  "America/Guatemala": "es",
  "America/El_Salvador": "es",
  "America/Tegucigalpa": "es",
  "America/Managua": "es",
  "America/Costa_Rica": "es",
  "America/Panama": "es",
  "America/Bogota": "es",
  "America/Lima": "es",
  "America/Guayaquil": "es",
  "America/Caracas": "es",
  "America/La_Paz": "es",
  "America/Santiago": "es",
  "America/Buenos_Aires": "es",
  "America/Argentina/Buenos_Aires": "es",
  "America/Argentina/Cordoba": "es",
  "America/Argentina/Mendoza": "es",
  "America/Montevideo": "es",
  "America/Asuncion": "es",
  "America/Havana": "es",
  "America/Santo_Domingo": "es",
  "America/Puerto_Rico": "es",
  // Portuguese-speaking
  "America/Sao_Paulo": "pt",
  "America/Fortaleza": "pt",
  "America/Recife": "pt",
  "America/Belem": "pt",
  "America/Manaus": "pt",
  "America/Cuiaba": "pt",
  "America/Porto_Velho": "pt",
  "America/Boa_Vista": "pt",
  "America/Campo_Grande": "pt",
  "America/Bahia": "pt",
  "America/Araguaina": "pt",
  "America/Maceio": "pt",
  "America/Noronha": "pt",
  "Europe/Lisbon": "pt",
  "Atlantic/Azores": "pt",
  "Atlantic/Madeira": "pt",
  // French-speaking
  "Europe/Paris": "fr",
  "America/Guadeloupe": "fr",
  "America/Martinique": "fr",
  "America/Cayenne": "fr",
  "Indian/Reunion": "fr",
  "Pacific/Noumea": "fr",
  "Pacific/Tahiti": "fr",
  // Italian-speaking
  "Europe/Rome": "it",
  // German-speaking
  "Europe/Berlin": "de",
  "Europe/Vienna": "de",
  "Europe/Zurich": "de",
  // Dutch-speaking
  "Europe/Amsterdam": "nl",
  "America/Curacao": "nl",
  // Greek-speaking
  "Europe/Athens": "el",
  // Polish-speaking
  "Europe/Warsaw": "pl",
  // Russian-speaking
  "Europe/Moscow": "ru",
  "Europe/Kaliningrad": "ru",
  "Europe/Samara": "ru",
  "Asia/Yekaterinburg": "ru",
  "Asia/Novosibirsk": "ru",
  "Asia/Krasnoyarsk": "ru",
  "Asia/Irkutsk": "ru",
  "Asia/Yakutsk": "ru",
  "Asia/Vladivostok": "ru",
  "Asia/Magadan": "ru",
  "Asia/Kamchatka": "ru",
  // Japanese-speaking
  "Asia/Tokyo": "ja",
  // Irish-speaking (Ireland defaults to English; Irish is opt-in)
  "Europe/Dublin": "en",
};

// Browser language prefix → app language code
const BROWSER_LANG_MAP = {
  es: "es",
  pt: "pt",
  fr: "fr",
  it: "it",
  de: "de",
  nl: "nl",
  el: "el",
  pl: "pl",
  ru: "ru",
  ja: "ja",
  ga: "ga",
};

// Detect language based on timezone, then browser language, then default to English
const detectLanguageFromEnvironment = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzLang = TIMEZONE_LANG_MAP[timezone];
    if (tzLang && SUPPORTED_LANGUAGES.has(tzLang)) {
      return tzLang;
    }
  } catch (e) {
    console.warn("Could not detect timezone:", e);
  }

  // Fallback: browser language
  try {
    const browserLang = (navigator.language || "").split("-")[0].toLowerCase();
    const mapped = BROWSER_LANG_MAP[browserLang];
    if (mapped && SUPPORTED_LANGUAGES.has(mapped)) {
      return mapped;
    }
  } catch (e) {
    console.warn("Could not detect browser language:", e);
  }

  return "en";
};

// Read language from localStorage
const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem("appLanguage");
    if (stored && SUPPORTED_LANGUAGES.has(stored)) {
      return stored;
    }
  } catch {}
  return null;
};

// Write language to localStorage (synchronous, immediate)
const setStoredLanguage = (lang) => {
  try {
    if (lang && SUPPORTED_LANGUAGES.has(lang)) {
      localStorage.setItem("appLanguage", lang);
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
      // Otherwise detect from environment
      const detectedLang = detectLanguageFromEnvironment();
      setStoredLanguage(detectedLang); // Write immediately
      set({ language: detectedLang });
      return detectedLang;
    }
    return currentLang;
  },

  // Set language explicitly (user preference)
  setLanguage: (lang) => {
    setStoredLanguage(lang); // Write immediately
    set({ language: lang });
  },

  // Toggle between English and Spanish (legacy helper, kept for backwards compatibility)
  toggleLanguage: () => {
    const currentLang = get().language || "en";
    const newLang = currentLang === "en" ? "es" : "en";
    setStoredLanguage(newLang); // Write immediately
    set({ language: newLang });
  },

  // Get translation helper
  t: (translations) => {
    const lang = get().language || "en";
    return translations[lang] || translations.en;
  },
}));

export { SUPPORTED_LANGUAGES };
export default useLanguage;
