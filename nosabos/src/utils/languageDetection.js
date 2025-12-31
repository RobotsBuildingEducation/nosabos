/**
 * Detects if the user is likely in a Spanish-speaking region based on their timezone
 * and browser language settings.
 */

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

/**
 * Spanish language codes (ISO 639-1)
 */
const SPANISH_LANGUAGE_CODES = ['es', 'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];

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

/**
 * Determines if the user should default to Spanish based on timezone and/or browser language
 * @returns {"es" | "en"} The detected language code
 */
export function detectUserLanguage() {
  // Check if language has already been set by the user
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('appLanguage');
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
  }

  // First check timezone (more reliable for regional detection)
  if (isSpanishTimezone()) {
    return 'es';
  }

  // Fallback to browser language detection
  if (isSpanishBrowserLanguage()) {
    return 'es';
  }

  // Default to English
  return 'en';
}
