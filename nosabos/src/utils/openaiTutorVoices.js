// OpenAI tutor voice policy, dependency-free so node --test can import it
// (tutorRealtime.js itself pulls in tts.js → Firebase and can't run under
// plain node).
//
// Only the new-generation gpt-realtime voices — marin and cedar, the
// Playground defaults — hold native phonology across a mid-sentence language
// switch. Every legacy realtime voice (alloy, echo, …) drifts back into
// support-language sounds on short target-language spans ("meee llamo" for
// "me llamo") often enough to teach wrong pronunciation, which a language
// tutor must never do. So the tutor never speaks with a legacy voice: stored
// legacy picks migrate to the new voice in the same vocal register, and the
// tutor's voice picker only offers the native-safe pair (see
// getTutorVoiceOptions in tutorRealtime.js). Non-tutor TTS surfaces keep the
// full list.

export const DEFAULT_OPENAI_TUTOR_VOICE = "marin";

export const OPENAI_TUTOR_VOICE_VALUES = ["cedar", "marin"];

// Register-preserving migration for stored legacy voices; the boy/girl
// registers mirror TTS_VOICE_OPTIONS in tts.js.
const LEGACY_OPENAI_VOICE_MIGRATION = {
  alloy: "cedar",
  ash: "cedar",
  ballad: "cedar",
  echo: "cedar",
  verse: "cedar",
  coral: "marin",
  sage: "marin",
  shimmer: "marin",
};

export function normalizeOpenAITutorVoice(voice) {
  const key = String(voice || "")
    .trim()
    .toLowerCase();
  if (OPENAI_TUTOR_VOICE_VALUES.includes(key)) return key;
  // Anything else (Gemini-era names, unknowns) → the default.
  return LEGACY_OPENAI_VOICE_MIGRATION[key] || DEFAULT_OPENAI_TUTOR_VOICE;
}
