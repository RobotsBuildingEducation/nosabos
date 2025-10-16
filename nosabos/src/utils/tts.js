export const TTS_ENDPOINT = "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS";

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-ES",
  nah: "es-ES",
};

export const DEFAULT_TTS_VOICE = "alloy";

export async function fetchTTSBlob({
  text,
  voice = DEFAULT_TTS_VOICE,
  langTag = TTS_LANG_TAG.es,
}) {
  const payload = {
    input: text,
    voice,
    model: "tts-1",
    response_format: "mp3",
    language: langTag,
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
