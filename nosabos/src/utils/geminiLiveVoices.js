export const DEFAULT_GEMINI_LIVE_VOICE = "Vindemiatrix";

export const GEMINI_LIVE_VOICE_DESCRIPTIONS = {
  Vindemiatrix: {
    en: "Relaxed",
    es: "Relajada",
    pt: "Descontraída",
    it: "Rilassata",
    fr: "Détendue",
    de: "Entspannt",
    ja: "落ち着いた",
    hi: "शांत और सहज",
    ar: "هادئة ومريحة",
    zh: "轻松自然",
  },
  Enceladus: {
    en: "Polished",
    es: "Pulido",
    pt: "Polido",
    it: "Raffinato",
    fr: "Soigné",
    de: "Geschliffen",
    ja: "洗練された",
    hi: "सुलझा हुआ",
    ar: "مهذب ومتقن",
    zh: "成熟干练",
  },
  Zephyr: {
    en: "Bright",
    es: "Brillante",
    pt: "Brilhante",
    it: "Brillante",
    fr: "Éclatante",
    de: "Hell",
    ja: "明るい",
    hi: "उज्ज्वल",
    ar: "مشرقة",
    zh: "明朗清澈",
  },
  Charon: {
    en: "Friendly",
    es: "Amigable",
    pt: "Amigável",
    it: "Amichevole",
    fr: "Chaleureux",
    de: "Freundlich",
    ja: "親しみやすい",
    hi: "मित्रवत",
    ar: "ودود",
    zh: "亲切友好",
  },
};

export const GEMINI_LIVE_VOICE_OPTIONS = [
  {
    value: "Vindemiatrix",
    label: "Naomi",
    type: "girl",
    description: "Relaxed",
    descriptionByLang: GEMINI_LIVE_VOICE_DESCRIPTIONS.Vindemiatrix,
  },
  {
    value: "Enceladus",
    label: "John",
    type: "boy",
    description: "Polished",
    descriptionByLang: GEMINI_LIVE_VOICE_DESCRIPTIONS.Enceladus,
  },
  {
    value: "Zephyr",
    label: "Zephyr",
    type: "girl",
    description: "Bright",
    descriptionByLang: GEMINI_LIVE_VOICE_DESCRIPTIONS.Zephyr,
  },
  {
    value: "Charon",
    label: "Michael",
    type: "boy",
    description: "Friendly",
    descriptionByLang: GEMINI_LIVE_VOICE_DESCRIPTIONS.Charon,
  },
];

export function getGeminiLiveVoiceDescription(voice, lang = "en") {
  const normalized = normalizeGeminiLiveVoice(voice);
  const translations = GEMINI_LIVE_VOICE_DESCRIPTIONS[normalized];
  if (!translations) return "Relaxed";
  return translations[lang] || translations.en || "Relaxed";
}

const LEGACY_ALIASES = {
  // Spelling variants
  vindematrix: "Vindemiatrix",
  vindemeatrix: "Vindemiatrix",

  // OpenAI voice settings map to Naomi (Vindemiatrix)
  marin: "Vindemiatrix",
  cedar: "Vindemiatrix",
  alloy: "Vindemiatrix",
  echo: "Vindemiatrix",
  ash: "Vindemiatrix",
  ballad: "Vindemiatrix",
  coral: "Vindemiatrix",
  sage: "Vindemiatrix",
  shimmer: "Vindemiatrix",
  verse: "Vindemiatrix",

  // Previous Gemini nicknames / mappings
  trey: "Enceladus",
  sadachbia: "Enceladus",
  chloe: "Vindemiatrix",
  gacrux: "Vindemiatrix",
  david: "Charon",
  algenib: "Charon",
  puck: "Charon",
  fenrir: "Charon",
  kore: "Zephyr",
  aoede: "Zephyr",
};

const GEMINI_LIVE_VOICE_BY_KEY = new Map([
  ...GEMINI_LIVE_VOICE_OPTIONS.map((option) => [
    option.value.toLowerCase(),
    option.value,
  ]),
  ...GEMINI_LIVE_VOICE_OPTIONS.map((option) => [
    option.label.toLowerCase(),
    option.value,
  ]),
]);

export function normalizeGeminiLiveVoice(voice) {
  const key = String(voice || "").trim().toLowerCase();
  if (LEGACY_ALIASES[key]) return LEGACY_ALIASES[key];
  return GEMINI_LIVE_VOICE_BY_KEY.get(key) || DEFAULT_GEMINI_LIVE_VOICE;
}

export function getGeminiLiveVoiceOption(voice) {
  const normalized = normalizeGeminiLiveVoice(voice);
  return (
    GEMINI_LIVE_VOICE_OPTIONS.find((option) => option.value === normalized) ||
    GEMINI_LIVE_VOICE_OPTIONS[0]
  );
}



