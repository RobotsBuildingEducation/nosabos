// Tutor realtime provider + voice selection, shared by the Tutor session and
// the settings/onboarding voice pickers so the voice list always matches the
// backend that will actually speak.
//
// Both bridges expose the same surface (send / readyState / mediaStream /
// getSenders / close / onEvent…), so the Tutor's session logic is
// provider-agnostic. Default is Gemini Live; set
// VITE_TUTOR_REALTIME_PROVIDER=openai to flip builds, or append
// ?tutorRealtime=openai|gemini to the URL for a session-time A/B without
// rebuilding.

import {
  GEMINI_LIVE_VOICE_OPTIONS,
  getGeminiLiveVoiceOption,
  normalizeGeminiLiveVoice,
} from "./geminiLiveVoices";
import { TTS_VOICE_OPTIONS, getTTSVoiceOption } from "./tts";

const TUTOR_REALTIME_PROVIDER_ENV = (
  import.meta.env.VITE_TUTOR_REALTIME_PROVIDER || "gemini"
).toLowerCase();

// V2 intentionally retires the sticky override used during the
// gpt-realtime-2.1-mini trial. Anyone who tested OpenAI is returned to the
// shipped Gemini default; a new explicit URL override can still opt back in.
const TUTOR_REALTIME_PROVIDER_STORAGE_KEY = "tutorRealtimeProviderV2";

export function resolveTutorRealtimeProvider() {
  // The SPA strips the search string on internal navigation long before the
  // Tutor connects, so a query override must STICK: ?tutorRealtime=openai or
  // =gemini persists to localStorage; any other value (e.g. =reset) clears
  // the stored override and returns to the env default.
  try {
    const fromQuery = new URLSearchParams(window.location.search).get(
      "tutorRealtime",
    );
    if (fromQuery === "openai" || fromQuery === "gemini") {
      window.localStorage.setItem(
        TUTOR_REALTIME_PROVIDER_STORAGE_KEY,
        fromQuery,
      );
      return fromQuery;
    }
    if (fromQuery) {
      window.localStorage.removeItem(TUTOR_REALTIME_PROVIDER_STORAGE_KEY);
    }
    const stored = window.localStorage.getItem(
      TUTOR_REALTIME_PROVIDER_STORAGE_KEY,
    );
    if (stored === "openai" || stored === "gemini") return stored;
  } catch {
    // no window/storage — fall through to env
  }
  return TUTOR_REALTIME_PROVIDER_ENV === "openai" ? "openai" : "gemini";
}

export function isOpenAITutorProvider() {
  return resolveTutorRealtimeProvider() === "openai";
}

// marin is OpenAI's strongest multilingual GA voice — noticeably better accent
// switching than the legacy alloy default — so it is the fallback whenever the
// stored tutor voice is not an OpenAI realtime voice (e.g. a Gemini-era name).
export const DEFAULT_OPENAI_TUTOR_VOICE = "marin";

const OPENAI_TUTOR_VOICE_SET = new Set(
  TTS_VOICE_OPTIONS.map((option) => option.value),
);

export function normalizeOpenAITutorVoice(voice) {
  const key = String(voice || "")
    .trim()
    .toLowerCase();
  return OPENAI_TUTOR_VOICE_SET.has(key) ? key : DEFAULT_OPENAI_TUTOR_VOICE;
}

// The single stored progress.tutorVoice field holds whichever provider's voice
// the user last picked; each provider maps foreign names to its own default,
// so the pickers below must normalize with the ACTIVE provider to stay in sync
// with what the session will actually use.
export function getTutorVoiceOptions() {
  return isOpenAITutorProvider() ? TTS_VOICE_OPTIONS : GEMINI_LIVE_VOICE_OPTIONS;
}

export function normalizeTutorVoice(voice) {
  return isOpenAITutorProvider()
    ? normalizeOpenAITutorVoice(voice)
    : normalizeGeminiLiveVoice(voice);
}

export function getTutorVoiceOption(voice) {
  return isOpenAITutorProvider()
    ? getTTSVoiceOption(normalizeOpenAITutorVoice(voice))
    : getGeminiLiveVoiceOption(voice);
}

export function getTutorVoicePreviewProvider() {
  return isOpenAITutorProvider() ? "openai-realtime" : "gemini-live";
}
