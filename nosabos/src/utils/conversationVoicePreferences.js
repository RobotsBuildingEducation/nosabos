import { normalizeOpenAITutorVoice } from "./openaiTutorVoices.js";
import { normalizeVoicePersona } from "./voicePersonaPrompt.js";

export function resolveConversationVoice(progress = {}) {
  return normalizeOpenAITutorVoice(progress?.tutorVoice || progress?.voice);
}

export function resolveConversationPersona(progress = {}, fallback = "") {
  return normalizeVoicePersona(
    progress?.tutorVoicePersona || progress?.voicePersona || fallback,
  );
}
