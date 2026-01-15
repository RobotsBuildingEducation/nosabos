import { create } from "zustand";
import { persist } from "zustand/middleware";

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

// Custom storage to sync with App.jsx's appLanguage format
// App.jsx stores directly as "en" or "es" string, not JSON
const appLanguageStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name);
      if (value === "es" || value === "en") {
        return JSON.stringify({ state: { language: value } });
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      const lang = parsed?.state?.language;
      if (lang === "es" || lang === "en") {
        localStorage.setItem(name, lang);
      }
    } catch {}
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

// Create the language store
const useLanguage = create(
  persist(
    (set, get) => ({
      language: null, // null means not initialized yet

      // Initialize language (only sets if not already set by user)
      initLanguage: () => {
        const currentLang = get().language;
        if (currentLang === null) {
          // Check if appLanguage already exists in localStorage (set by App.jsx)
          const stored = localStorage.getItem("appLanguage");
          if (stored === "es" || stored === "en") {
            set({ language: stored });
            return stored;
          }
          // Otherwise detect from timezone
          const detectedLang = detectLanguageFromTimezone();
          set({ language: detectedLang });
          return detectedLang;
        }
        return currentLang;
      },

      // Set language explicitly (user preference)
      setLanguage: (lang) => set({ language: lang }),

      // Toggle between English and Spanish
      toggleLanguage: () => {
        const currentLang = get().language || "en";
        set({ language: currentLang === "en" ? "es" : "en" });
      },

      // Get translation helper
      t: (translations) => {
        const lang = get().language || "en";
        return translations[lang] || translations.en;
      },
    }),
    {
      name: "appLanguage", // Use same key as App.jsx
      storage: appLanguageStorage,
      partialize: (state) => ({ language: state.language }),
    }
  )
);

export default useLanguage;
