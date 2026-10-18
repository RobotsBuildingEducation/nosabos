// Data-only: shared by the app and the inline, pre-React loading screen.
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";

export const LANGUAGE_TIMEZONES = {
  "es": [
    "America/Mexico_City",
    "America/Cancun",
    "America/Merida",
    "America/Monterrey",
    "America/Mazatlan",
    "America/Chihuahua",
    "America/Tijuana",
    "America/Hermosillo",
    "America/Matamoros",
    "America/Ojinaga",
    "America/Bahia_Banderas",
    "Europe/Madrid",
    "Atlantic/Canary",
    "America/Argentina/Buenos_Aires",
    "America/Argentina/Cordoba",
    "America/Argentina/Salta",
    "America/Argentina/Jujuy",
    "America/Argentina/Tucuman",
    "America/Argentina/Catamarca",
    "America/Argentina/La_Rioja",
    "America/Argentina/San_Juan",
    "America/Argentina/Mendoza",
    "America/Argentina/San_Luis",
    "America/Argentina/Rio_Gallegos",
    "America/Argentina/Ushuaia",
    "America/Santiago",
    "Pacific/Easter",
    "America/Bogota",
    "America/Lima",
    "America/Caracas",
    "America/Guayaquil",
    "Pacific/Galapagos",
    "America/La_Paz",
    "America/Asuncion",
    "America/Montevideo",
    "America/Guatemala",
    "America/Tegucigalpa",
    "America/El_Salvador",
    "America/Managua",
    "America/Costa_Rica",
    "America/Panama",
    "America/Havana",
    "America/Santo_Domingo",
    "America/Puerto_Rico",
    "America/Buenos_Aires"
  ],
  "it": [
    "Europe/Rome",
    "Europe/Vatican",
    "Europe/San_Marino"
  ],
  "de": [
    "Europe/Berlin",
    "Europe/Vienna",
    "Europe/Zurich",
    "Europe/Vaduz",
    "Europe/Luxembourg"
  ],
  "hi": [
    "Asia/Kolkata",
    "Asia/Calcutta"
  ],
  "ar": [
    "Africa/Cairo"
  ],
  "zh": [
    "Asia/Shanghai",
    "Asia/Urumqi",
    "Asia/Hong_Kong",
    "Asia/Macau",
    "Asia/Taipei",
    "Asia/Singapore"
  ],
  "fr": [
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
    "Africa/Tunis"
  ],
  "pt": [
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
    "Asia/Dili"
  ],
  "ja": [
    "Asia/Tokyo"
  ]
};

export const INITIAL_LANGUAGE_CONFIG = {
  supported: SUPPORT_LANGUAGE_CODES,
  timezones: Object.fromEntries(Object.entries(LANGUAGE_TIMEZONES).flatMap(([language, zones]) => zones.map((zone) => [zone, language]))),
  browserPriority: ["ar", "zh", "it", "de", "hi", "fr", "pt", "ja", "es"],
};

// Self-contained so the exact same resolver can also be embedded in HTML.
export function resolveInitialLanguage(config, { storedLanguage, timeZone, browserLanguages = [] } = {}) {
  const normalize = (value) => {
    const base = String(value || "").trim().toLowerCase().split(/[-_]/)[0];
    return base === "arz" ? "ar" : base === "cmn" ? "zh" : base;
  };
  const stored = normalize(storedLanguage);
  if (config.supported.includes(stored)) return stored;
  const regional = config.timezones[timeZone];
  if (config.supported.includes(regional)) return regional;
  const browser = browserLanguages.map(normalize);
  return config.browserPriority.find((language) => browser.includes(language)) || "en";
}

export function detectInitialLanguage(browser = globalThis) {
  let storedLanguage, timeZone, browserLanguages = [];
  try { storedLanguage = browser.localStorage?.getItem("appLanguage"); } catch { /* Storage can be disabled. */ }
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Use browser languages. */ }
  try {
    const navigator = browser.navigator;
    browserLanguages = navigator?.languages?.length ? [...navigator.languages] : [navigator?.language || navigator?.userLanguage];
  } catch { /* Use English if browser preferences are unavailable. */ }
  return resolveInitialLanguage(INITIAL_LANGUAGE_CONFIG, { storedLanguage, timeZone, browserLanguages });
}
