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

// Create the language store
const useLanguage = create(
  persist(
    (set, get) => ({
      language: null, // null means not initialized yet

      // Initialize language (only sets if not already set by user)
      initLanguage: () => {
        const currentLang = get().language;
        if (currentLang === null) {
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
      name: "language-preference",
      partialize: (state) => ({ language: state.language }),
    }
  )
);

export default useLanguage;
