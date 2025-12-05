export const TTS_ENDPOINT = "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS";

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  nah: "es-ES",
};

export const DEFAULT_TTS_VOICE = "alloy";

const SUPPORTED_TTS_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "coral",
  "verse",
  "ballad",
  "ash",
  "sage",
  "marin",
  "cedar",
]);

// Array version for random selection
const TTS_VOICES_ARRAY = Array.from(SUPPORTED_TTS_VOICES);

/**
 * Returns a randomly selected voice from the available TTS voices.
 * This provides variety in voice playback for a more diverse experience.
 */
export function getRandomVoice() {
  const index = Math.floor(Math.random() * TTS_VOICES_ARRAY.length);
  return TTS_VOICES_ARRAY[index];
}

function sanitizeVoice(voice) {
  return SUPPORTED_TTS_VOICES.has(voice) ? voice : DEFAULT_TTS_VOICE;
}

/**
 * Resolves which voice to use for TTS playback.
 * Now defaults to random voice selection for variety.
 */
export function resolveVoicePreference({
  lang,
  langTag,
} = {}) {
  // Always use random voice for variety
  return getRandomVoice();
}

export async function fetchTTSBlob({
  text,
  langTag = TTS_LANG_TAG.es,
}) {
  // Always use a random voice for variety
  const resolvedVoice = getRandomVoice();

  const payload = {
    input: text,
    voice: resolvedVoice,
    model: "gpt-4o-mini-tts",
    response_format: "mp3",
  };

  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`OpenAI TTS ${res.status}`);
  }

  return res.blob();
}
