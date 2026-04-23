/**
 * Detects if the user is likely in a Spanish-speaking region based on their timezone
 * and browser language settings.
 */
import {
  DEFAULT_SUPPORT_LANGUAGE,
  isSupportedSupportLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

/**
 * List of timezones commonly associated with Spanish-speaking countries
 */
const SPANISH_TIMEZONES = [
  // Mexico
  'America/Mexico_City',
  'America/Cancun',
  'America/Merida',
  'America/Monterrey',
  'America/Mazatlan',
  'America/Chihuahua',
  'America/Tijuana',
  'America/Hermosillo',
  'America/Matamoros',
  'America/Ojinaga',
  'America/Bahia_Banderas',

  // Spain
  'Europe/Madrid',
  'Atlantic/Canary',

  // Argentina
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Salta',
  'America/Argentina/Jujuy',
  'America/Argentina/Tucuman',
  'America/Argentina/Catamarca',
  'America/Argentina/La_Rioja',
  'America/Argentina/San_Juan',
  'America/Argentina/Mendoza',
  'America/Argentina/San_Luis',
  'America/Argentina/Rio_Gallegos',
  'America/Argentina/Ushuaia',

  // Chile
  'America/Santiago',
  'Pacific/Easter',

  // Colombia
  'America/Bogota',

  // Peru
  'America/Lima',

  // Venezuela
  'America/Caracas',

  // Ecuador
  'America/Guayaquil',
  'Pacific/Galapagos',

  // Bolivia
  'America/La_Paz',

  // Paraguay
  'America/Asuncion',

  // Uruguay
  'America/Montevideo',

  // Central America
  'America/Guatemala',
  'America/Tegucigalpa',
  'America/El_Salvador',
  'America/Managua',
  'America/Costa_Rica',
  'America/Panama',

  // Caribbean
  'America/Havana',
  'America/Santo_Domingo',
  'America/Puerto_Rico',
];

const ITALIAN_TIMEZONES = [
  'Europe/Rome',
  'Europe/Vatican',
  'Europe/San_Marino',
];

const HINDI_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Calcutta',
];

const FRENCH_TIMEZONES = [
  'Europe/Paris',
  'Europe/Monaco',
  'America/Martinique',
  'America/Guadeloupe',
  'America/Cayenne',
  'America/Miquelon',
  'Indian/Reunion',
  'Indian/Mayotte',
  'Pacific/Noumea',
  'Pacific/Tahiti',
  'Pacific/Marquesas',
  'Pacific/Wallis',
  'Africa/Abidjan',
  'Africa/Algiers',
  'Africa/Bamako',
  'Africa/Bangui',
  'Africa/Brazzaville',
  'Africa/Dakar',
  'Africa/Douala',
  'Africa/Kinshasa',
  'Africa/Libreville',
  'Africa/Lome',
  'Africa/Ndjamena',
  'Africa/Niamey',
  'Africa/Porto-Novo',
  'Africa/Tunis',
];

const PORTUGUESE_TIMEZONES = [
  'Europe/Lisbon',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'America/Sao_Paulo',
  'America/Rio_Branco',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Maceio',
  'America/Araguaina',
  'America/Cuiaba',
  'America/Campo_Grande',
  'America/Porto_Velho',
  'Africa/Maputo',
  'Africa/Luanda',
  'Atlantic/Cape_Verde',
  'Africa/Bissau',
  'Africa/Sao_Tome',
  'Asia/Dili',
];

const JAPANESE_TIMEZONES = [
  'Asia/Tokyo',
];

/**
 * Spanish language codes (ISO 639-1)
 */
const SPANISH_LANGUAGE_CODES = ['es', 'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];
const ITALIAN_LANGUAGE_CODES = ['it', 'it-IT', 'it-CH', 'it-SM', 'it-VA'];
const HINDI_LANGUAGE_CODES = ['hi', 'hi-IN', 'hi-Latn', 'hi-Latn-IN', 'hi-Deva', 'hi-Deva-IN'];
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

export function isHindiTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return HINDI_TIMEZONES.includes(timezone);
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
 * Determines if the user should default to Spanish based on timezone and/or browser language
 * @returns {"es" | "en"} The detected language code
 */
export function detectUserLanguage() {
  // Check if language has already been set by the user
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('appLanguage');
    if (isSupportedSupportLanguage(stored)) {
      return normalizeSupportLanguage(stored);
    }
  }

  // First check timezone (more reliable for regional detection)
  if (isItalianTimezone()) {
    return 'it';
  }

  if (isHindiTimezone()) {
    return 'hi';
  }

  if (isFrenchTimezone()) {
    return 'fr';
  }

  if (isPortugueseTimezone()) {
    return 'pt';
  }

  if (isJapaneseTimezone()) {
    return 'ja';
  }

  if (isSpanishTimezone()) {
    return 'es';
  }

  // Fallback to browser language detection
  if (isItalianBrowserLanguage()) {
    return 'it';
  }

  if (isHindiBrowserLanguage()) {
    return 'hi';
  }

  if (isFrenchBrowserLanguage()) {
    return 'fr';
  }

  if (isPortugueseBrowserLanguage()) {
    return 'pt';
  }

  if (isJapaneseBrowserLanguage()) {
    return 'ja';
  }

  if (isSpanishBrowserLanguage()) {
    return 'es';
  }

  // Default to English
  return DEFAULT_SUPPORT_LANGUAGE;
}
