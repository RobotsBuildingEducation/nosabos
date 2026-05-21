export const DEFAULT_GEMINI_LIVE_VOICE = "Zephyr";

export const GEMINI_LIVE_VOICE_OPTIONS = [
  { value: "Puck", type: "boy", description: "Upbeat" },
  { value: "Kore", type: "girl", description: "Firm" },
  { value: "Charon", type: "boy", description: "Informative" },
  { value: "Fenrir", type: "boy", description: "Excitable" },
  { value: "Aoede", type: "girl", description: "Breezy" },
  { value: "Leda", type: "girl", description: "Youthful" },
  { value: "Zephyr", type: "girl", description: "Bright" },
  { value: "Orus", type: "boy", description: "Firm" },
  { value: "Umbriel", type: "boy", description: "Easy-going" },
  { value: "Autonoe", type: "girl", description: "Bright" },
  { value: "Erinome", type: "girl", description: "Clear" },
  { value: "Laomedeia", type: "girl", description: "Upbeat" },
  { value: "Schedar", type: "boy", description: "Even" },
  { value: "Achird", type: "boy", description: "Friendly" },
  { value: "Sadachbia", type: "boy", description: "Lively" },
  { value: "Enceladus", type: "boy", description: "Breathy" },
  { value: "Algieba", type: "boy", description: "Smooth" },
  { value: "Algenib", type: "boy", description: "Gravelly" },
  { value: "Achernar", type: "girl", description: "Soft" },
  { value: "Gacrux", type: "girl", description: "Mature" },
  { value: "Zubenelgenubi", type: "boy", description: "Casual" },
  { value: "Sadaltager", type: "boy", description: "Knowledgeable" },
  { value: "Callirrhoe", type: "girl", description: "Easy-going" },
  { value: "Iapetus", type: "boy", description: "Clear" },
  { value: "Despina", type: "girl", description: "Smooth" },
  { value: "Rasalgethi", type: "boy", description: "Informative" },
  { value: "Alnilam", type: "boy", description: "Firm" },
  { value: "Pulcherrima", type: "girl", description: "Forward" },
  { value: "Vindemiatrix", type: "girl", description: "Gentle" },
  { value: "Sulafat", type: "girl", description: "Warm" },
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
