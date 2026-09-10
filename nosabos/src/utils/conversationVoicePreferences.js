import { REALTIME_PRACTICE_VOICE } from "./realtimePracticeVoice.js";
import { normalizeVoicePersona } from "./voicePersonaPrompt.js";

export function resolveConversationVoice() {
  return REALTIME_PRACTICE_VOICE;
}

export function resolveConversationPersona(progress = {}, fallback = "") {
  return normalizeVoicePersona(
    progress?.tutorVoicePersona || progress?.voicePersona || fallback,
  );
}
