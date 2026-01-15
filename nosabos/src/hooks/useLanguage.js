import { create } from "zustand";

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

// Detect language based on timezone
const detectLanguageFromTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (spanishTimezones.includes(timezone)) {
      return "es";
    }
  } catch (e) {
    console.warn("Could not detect timezone:", e);
  }
  return "en";
};

// Read language from localStorage
const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem("appLanguage");
    if (stored === "es" || stored === "en") {
      return stored;
    }
  } catch {}
  return null;
};

// Write language to localStorage (synchronous, immediate)
const setStoredLanguage = (lang) => {
  try {
    if (lang === "es" || lang === "en") {
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
    setStoredLanguage(lang); // Write immediately
    set({ language: lang });
  },

  // Toggle between English and Spanish
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

export default useLanguage;
