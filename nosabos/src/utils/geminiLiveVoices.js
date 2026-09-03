// Trey is the learner-facing name for Gemini's Sadachbia voice ID.
export const DEFAULT_GEMINI_LIVE_VOICE = "Sadachbia";

export const GEMINI_LIVE_VOICE_OPTIONS = [
  { value: "Zephyr", label: "Zephyr", type: "girl", description: "Bright" },
  { value: "Sadachbia", label: "Trey", type: "boy", description: "Chill" },
  {
    value: "Vindemiatrix",
    label: "Naomi",
    type: "girl",
    description: "Warm",
  },
  {
    value: "Enceladus",
    label: "John",
    type: "boy",
    description: "Polished",
  },
  { value: "Gacrux", label: "Chloe", type: "girl", description: "Gentle" },
  {
    value: "Algenib",
    label: "David",
    type: "boy",
    description: "Confident",
  },
];

const GEMINI_LIVE_VOICE_BY_KEY = new Map(
  GEMINI_LIVE_VOICE_OPTIONS.map((option) => [
    option.value.toLowerCase(),
    option.value,
  ]),
);

export function normalizeGeminiLiveVoice(voice) {
  const key = String(voice || "").trim().toLowerCase();
  return GEMINI_LIVE_VOICE_BY_KEY.get(key) || DEFAULT_GEMINI_LIVE_VOICE;
}

export function getGeminiLiveVoiceOption(voice) {
  const normalized = normalizeGeminiLiveVoice(voice);
  return (
    GEMINI_LIVE_VOICE_OPTIONS.find((option) => option.value === normalized) ||
    GEMINI_LIVE_VOICE_OPTIONS[0]
  );
}
