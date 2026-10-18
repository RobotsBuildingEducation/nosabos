/**
 * Regional helpers used by the app and landing-page practice defaults.
 * Startup language resolution is shared with the inline loading screen.
 */
import { LANGUAGE_TIMEZONES, detectInitialLanguage } from "./initialLanguage.js";

/**
 * List of timezones commonly associated with Spanish-speaking countries
 */
const SPANISH_TIMEZONES = LANGUAGE_TIMEZONES.es;

const ITALIAN_TIMEZONES = LANGUAGE_TIMEZONES.it;

const GERMAN_TIMEZONES = LANGUAGE_TIMEZONES.de;

const HINDI_TIMEZONES = LANGUAGE_TIMEZONES.hi;

const ARABIC_TIMEZONES = LANGUAGE_TIMEZONES.ar;

const CHINESE_TIMEZONES = LANGUAGE_TIMEZONES.zh;

const FRENCH_TIMEZONES = LANGUAGE_TIMEZONES.fr;

const PORTUGUESE_TIMEZONES = LANGUAGE_TIMEZONES.pt;

const JAPANESE_TIMEZONES = LANGUAGE_TIMEZONES.ja;

/**
 * Spanish language codes (ISO 639-1)
 */
const SPANISH_LANGUAGE_CODES = ['es', 'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];
const ITALIAN_LANGUAGE_CODES = ['it', 'it-IT', 'it-CH', 'it-SM', 'it-VA'];
const GERMAN_LANGUAGE_CODES = ['de', 'de-DE', 'de-AT', 'de-CH', 'de-LI', 'de-LU'];
const HINDI_LANGUAGE_CODES = ['hi', 'hi-IN', 'hi-Latn', 'hi-Latn-IN', 'hi-Deva', 'hi-Deva-IN'];
const ARABIC_LANGUAGE_CODES = ['ar', 'ar-EG', 'ar-Arab', 'ar-Arab-EG', 'arz'];
const CHINESE_LANGUAGE_CODES = ['zh', 'zh-CN', 'zh-Hans', 'zh-Hans-CN', 'zh-SG', 'zh-TW', 'zh-Hant', 'zh-HK', 'zh-MO', 'cmn'];
const FRENCH_LANGUAGE_CODES = ['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr-LU', 'fr-MC'];
const PORTUGUESE_LANGUAGE_CODES = ['pt', 'pt-BR', 'pt-PT', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST', 'pt-TL'];
const JAPANESE_LANGUAGE_CODES = ['ja', 'ja-JP'];

/**
 * Detects if the user's timezone is in a Spanish-speaking region
 * @returns {boolean} True if timezone suggests Spanish-speaking region
 */
export function isSpanishTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return SPANISH_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isItalianTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ITALIAN_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isGermanTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return GERMAN_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isHindiTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return HINDI_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isArabicTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ARABIC_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isChineseTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return CHINESE_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isFrenchTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return FRENCH_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isPortugueseTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return PORTUGUESE_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

export function isJapaneseTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return JAPANESE_TIMEZONES.includes(timezone);
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return false;
  }
}

/**
 * Detects if the user's browser language is set to Spanish
 * @returns {boolean} True if browser language is Spanish
 */
export function isSpanishBrowserLanguage() {
  try {
    const lang = navigator.language || navigator.userLanguage;
    return SPANISH_LANGUAGE_CODES.some(code => lang.startsWith(code.split('-')[0]));
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

/** Keep the landing postcard and tutor demo on the same regional default. */
export function getDefaultLandingPracticeLanguage(uiLanguage) {
  return uiLanguage === 'es' || isSpanishTimezone() || isSpanishBrowserLanguage()
    ? 'en'
    : 'es';
}

export function isItalianBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      ITALIAN_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isGermanBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      GERMAN_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isHindiBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      HINDI_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isArabicBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      ARABIC_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isChineseBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      CHINESE_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isFrenchBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      FRENCH_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isPortugueseBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      PORTUGUESE_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

export function isJapaneseBrowserLanguage() {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];
    return languages.some((lang) =>
      JAPANESE_LANGUAGE_CODES.some((code) => lang?.toLowerCase().startsWith(code.toLowerCase().split('-')[0])),
    );
  } catch (error) {
    console.warn('Could not detect browser language:', error);
    return false;
  }
}

/**
 * Resolve the saved interface language, then timezone and browser defaults.
 * @returns {string} A supported interface-language code.
 */
export function detectUserLanguage() {
  return detectInitialLanguage();
}
