import {
  brazilianFlag,
  egyptianFlag,
  frenchFlag,
  germanFlag,
  greekFlag,
  indianFlag,
  irishFlag,
  italianFlag,
  japaneseFlag,
  mexicanFlag,
  netherlandsFlag,
  polishFlag,
  russianFlag,
  usaFlag,
} from "../components/flagsIcons/flags";

export const DEFAULT_SUPPORT_LANGUAGE = "en";
export const DEFAULT_TARGET_LANGUAGE = "es";

export const LANGUAGE_FALLBACK_LABELS = {
  ar: "Egyptian Arabic",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  hi: "Hindi",
  nl: "Dutch",
  nah: "Eastern Huasteca Nahuatl",
  ja: "Japanese (日本語)",
  ru: "Russian",
  de: "German",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

export const LANGUAGE_PROMPT_LABELS = {
  ar: "Egyptian Arabic (العربية المصرية)",
  es: "Spanish (espanol)",
  en: "English",
  pt: "Portuguese (portugues brasileiro)",
  fr: "French (francais)",
  it: "Italian (italiano)",
  hi: "Hindi (hindi)",
  nl: "Dutch (Nederlands)",
  nah: "Eastern Huasteca Nahuatl (nahuatl huasteco oriental)",
  ru: "Russian",
  de: "German (Deutsch)",
  el: "Greek",
  pl: "Polish (polski)",
  ga: "Irish (Gaeilge)",
  yua: "Yucatec Maya (maaya t'aan)",
  ja: "Japanese (日本語)",
};

const LANGUAGE_META = [
  {
    value: "ar",
    languageKey: "language_ar",
    practiceKey: "onboarding_practice_ar",
    tier: "stable",
    supportTier: "stable",
    practiceEnabled: false,
    flag: egyptianFlag,
  },
  {
    value: "nl",
    languageKey: "language_nl",
    practiceKey: "onboarding_practice_nl",
    tier: "stable",
    flag: netherlandsFlag,
  },
  {
    value: "en",
    languageKey: "language_en",
    practiceKey: "onboarding_practice_en",
    tier: "stable",
    flag: usaFlag,
  },
  {
    value: "fr",
    languageKey: "language_fr",
    practiceKey: "onboarding_practice_fr",
    tier: "stable",
    flag: frenchFlag,
  },
  {
    value: "de",
    languageKey: "language_de",
    practiceKey: "onboarding_practice_de",
    tier: "stable",
    flag: germanFlag,
  },
  {
    value: "it",
    languageKey: "language_it",
    practiceKey: "onboarding_practice_it",
    tier: "stable",
    flag: italianFlag,
  },
  {
    value: "hi",
    languageKey: "language_hi",
    practiceKey: "onboarding_practice_hi",
    tier: "stable",
    supportTier: "stable",
    practiceEnabled: false,
    flag: indianFlag,
  },
  {
    value: "pt",
    languageKey: "language_pt",
    practiceKey: "onboarding_practice_pt",
    tier: "stable",
    flag: brazilianFlag,
  },
  {
    value: "es",
    languageKey: "language_es",
    practiceKey: "onboarding_practice_es",
    tier: "stable",
    flag: mexicanFlag,
  },
  {
    value: "nah",
    languageKey: "language_nah",
    practiceKey: "onboarding_practice_nah",
    tier: "alpha",
    flag: mexicanFlag,
  },
  {
    value: "yua",
    languageKey: "language_yua",
    practiceKey: "onboarding_practice_yua",
    tier: "alpha",
    flag: mexicanFlag,
  },
  {
    value: "el",
    languageKey: "language_el",
    practiceKey: "onboarding_practice_el",
    tier: "beta",
    flag: greekFlag,
  },
  {
    value: "ja",
    languageKey: "language_ja",
    practiceKey: "onboarding_practice_ja",
    tier: "beta",
    supportTier: "stable",
    flag: japaneseFlag,
  },
  {
    value: "ru",
    languageKey: "language_ru",
    practiceKey: "onboarding_practice_ru",
    tier: "beta",
    flag: russianFlag,
  },
  {
    value: "pl",
    languageKey: "language_pl",
    practiceKey: "onboarding_practice_pl",
    tier: "beta",
    flag: polishFlag,
  },
  {
    value: "ga",
    languageKey: "language_ga",
    practiceKey: "onboarding_practice_ga",
    tier: "beta",
    flag: irishFlag,
  },
];

const TIER_ORDER = { stable: 0, alpha: 1, beta: 2 };
const SUPPORTED_LANGUAGE_CODES_SET = new Set(
  LANGUAGE_META.map((item) => item.value),
);
const PRACTICE_LANGUAGE_CODES_BASE = LANGUAGE_META.filter(
  (item) => item.practiceEnabled !== false,
).map((item) => item.value);
const PRACTICE_LANGUAGE_CODES_SET = new Set(PRACTICE_LANGUAGE_CODES_BASE);
const SUPPORT_LANGUAGE_CODES_BASE = [
  "en",
  "es",
  "pt",
  "it",
  "fr",
  "ja",
  "hi",
  "ar",
];
const SUPPORT_LANGUAGE_CODES_SET = new Set(SUPPORT_LANGUAGE_CODES_BASE);
export const RTL_LANGUAGE_CODES = ["ar"];

export const LANGUAGE_LOCALES = {
  ar: "ar-EG",
  en: "en-US",
  es: "es-MX",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  hi: "hi-IN",
  nl: "nl-NL",
  nah: "es-MX",
  ja: "ja-JP",
  ru: "ru-RU",
  de: "de-DE",
  el: "el-GR",
  pl: "pl-PL",
  ga: "ga-IE",
  yua: "es-MX",
};

const SORT_LOCALES = {
  ar: "ar",
  en: "en",
  es: "es",
  pt: "pt",
  it: "it",
  fr: "fr",
  ja: "ja",
  hi: "hi",
};

const normalizeCode = (raw) => String(raw || "").trim().toLowerCase();
const normalizeSupportedCode = (raw) => {
  const normalized = normalizeCode(raw);
  if (!normalized) return "";
  if (normalized === "arz") return "ar";
  if (SUPPORTED_LANGUAGE_CODES_SET.has(normalized)) return normalized;
  const [base] = normalized.split(/[-_]/);
  if (base === "arz" && SUPPORTED_LANGUAGE_CODES_SET.has("ar")) return "ar";
  if (SUPPORTED_LANGUAGE_CODES_SET.has(base)) return base;
  return normalized;
};

export const PRACTICE_LANGUAGE_CODES = [...PRACTICE_LANGUAGE_CODES_BASE];
export const SUPPORT_LANGUAGE_CODES = SUPPORT_LANGUAGE_CODES_BASE.filter((code) =>
  SUPPORTED_LANGUAGE_CODES_SET.has(code),
);
export const ALPHABET_LANGUAGE_CODES = [...PRACTICE_LANGUAGE_CODES];

export function isSupportedPracticeLanguage(code) {
  return PRACTICE_LANGUAGE_CODES_SET.has(normalizeSupportedCode(code));
}

export function isSupportedSupportLanguage(code) {
  return SUPPORT_LANGUAGE_CODES_SET.has(normalizeSupportedCode(code));
}

export function normalizeSupportLanguage(
  code,
  fallback = DEFAULT_SUPPORT_LANGUAGE,
) {
  const normalized = normalizeSupportedCode(code);
  if (SUPPORT_LANGUAGE_CODES_SET.has(normalized)) return normalized;
  return fallback;
}

export function normalizePracticeLanguage(
  code,
  fallback = DEFAULT_TARGET_LANGUAGE,
) {
  const normalized = normalizeSupportedCode(code);
  if (SUPPORTED_LANGUAGE_CODES_SET.has(normalized)) return normalized;
  return fallback;
}

export function getDefaultTargetForSupport(supportCode) {
  const support = normalizeSupportLanguage(
    supportCode,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  return support === DEFAULT_TARGET_LANGUAGE
    ? DEFAULT_SUPPORT_LANGUAGE
    : DEFAULT_TARGET_LANGUAGE;
}

export function getLanguageLabel(
  code,
  ui = {},
  fallbackMap = LANGUAGE_FALLBACK_LABELS,
) {
  const normalized = normalizeSupportedCode(code);
  if (!normalized) return "";
  const key = `language_${normalized}`;
  return ui[key] || fallbackMap[normalized] || normalized.toUpperCase();
}

export function getLanguagePromptName(code) {
  const normalized = normalizeSupportedCode(code);
  if (!normalized) return "";
  return (
    LANGUAGE_PROMPT_LABELS[normalized] ||
    LANGUAGE_FALLBACK_LABELS[normalized] ||
    normalized.toUpperCase()
  );
}

export function getLanguageLocale(code, fallback = "en-US") {
  const normalized = normalizeSupportedCode(code);
  return LANGUAGE_LOCALES[normalized] || fallback;
}

export function getLanguageDirection(code, fallback = "ltr") {
  const normalized = normalizeSupportedCode(code);
  return RTL_LANGUAGE_CODES.includes(normalized) ? "rtl" : fallback;
}

export function getSortLocale(code, fallback = "en") {
  const normalized = normalizeSupportLanguage(code, DEFAULT_SUPPORT_LANGUAGE);
  return SORT_LOCALES[normalized] || fallback;
}

function withTierTag(label, tier, ui = {}, uiLang = "en") {
  if (tier === "alpha") {
    const alphaLabel =
      ui.onboarding_language_tag_alpha ||
      (uiLang === "ja"
        ? "アルファ"
        : ["es", "pt", "it", "fr", "hi", "ar"].includes(uiLang)
          ? "alfa"
          : "alpha");
    return `${label} (${alphaLabel})`;
  }
  if (tier === "beta") {
    const betaLabel =
      ui.onboarding_language_tag_beta || (uiLang === "ja" ? "ベータ" : "beta");
    return `${label} (${betaLabel})`;
  }
  return label;
}

function resolveTier(item, mode) {
  if (mode === "support") {
    return item.supportTier || "stable";
  }
  return item.tier;
}

function buildLanguageOptions({
  ui = {},
  uiLang = "en",
  showJapanese = true,
  mode = "practice",
  includeTierTagInLabel = true,
}) {
  const sortLocale = getSortLocale(uiLang);
  const collator = new Intl.Collator(sortLocale);

  const items = LANGUAGE_META
    .filter((item) =>
      mode === "support"
        ? SUPPORT_LANGUAGE_CODES_SET.has(item.value)
        : item.practiceEnabled !== false,
    )
    .filter((item) => (showJapanese ? true : item.value !== "ja"))
    .map((item) => {
      const tier = resolveTier(item, mode);
      const baseLabel =
        mode === "practice"
          ? ui[item.practiceKey] ||
            ui[item.languageKey] ||
            LANGUAGE_FALLBACK_LABELS[item.value] ||
            item.value.toUpperCase()
          : ui[item.languageKey] ||
            ui[item.practiceKey] ||
            LANGUAGE_FALLBACK_LABELS[item.value] ||
            item.value.toUpperCase();

      return {
        value: item.value,
        label: includeTierTagInLabel
          ? withTierTag(baseLabel, tier, ui, uiLang)
          : baseLabel,
        tier,
        beta: tier === "beta",
        alpha: tier === "alpha",
        flag: item.flag(),
      };
    });

  return items.sort((a, b) => {
    const tierDelta = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDelta !== 0) return tierDelta;
    return collator.compare(a.label, b.label);
  });
}

export function getPracticeLanguageOptions(options = {}) {
  return buildLanguageOptions({ ...options, mode: "practice" });
}

export function getSupportLanguageOptions(options = {}) {
  return buildLanguageOptions({ ...options, mode: "support" });
}
