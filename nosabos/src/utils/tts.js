export const TTS_ENDPOINT = "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS";

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-ES",
  nah: "es-ES",
};

export const DEFAULT_TTS_VOICE = "alloy";

const TTS_NATIVE_VOICE = {
  en: "alloy",
  es: "viva",
  nah: "viva",
};

export function voiceForLang(lang, langTag) {
  const normalizedLang = (lang || "").toLowerCase();
  if (normalizedLang && TTS_NATIVE_VOICE[normalizedLang]) {
    return TTS_NATIVE_VOICE[normalizedLang];
  }

  const normalizedTag = (langTag || "").toLowerCase();
  if (normalizedTag.startsWith("es")) return TTS_NATIVE_VOICE.es;
  if (normalizedTag.startsWith("en")) return TTS_NATIVE_VOICE.en;
  return DEFAULT_TTS_VOICE;
}

export function resolveVoicePreference({
  voice,
  lang,
  langTag,
  preferNativeVoice = true,
}) {
  const trimmed = typeof voice === "string" ? voice.trim() : "";
  if (!preferNativeVoice) {
    return trimmed || DEFAULT_TTS_VOICE;
  }

  if (trimmed && trimmed !== DEFAULT_TTS_VOICE) {
    return trimmed;
  }

  return voiceForLang(lang, langTag);
}

export async function fetchTTSBlob({
  text,
  voice,
  lang,
  langTag = TTS_LANG_TAG.es,
  preferNativeVoice = true,
}) {
  const effectiveLangTag = langTag || TTS_LANG_TAG.es;
  const resolvedVoice = resolveVoicePreference({
    voice,
    lang,
    langTag: effectiveLangTag,
    preferNativeVoice,
  });

  const payload = {
    input: text,
    voice: resolvedVoice,
    model: "tts-1",
    response_format: "mp3",
    language: effectiveLangTag,
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
