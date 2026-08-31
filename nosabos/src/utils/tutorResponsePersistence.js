import { buildTutorTeacherTalkLanguageGate } from "./tutorTeacherTalkLanguageGate.js";
import { buildVoicePersonaReminder } from "./voicePersonaPrompt.js";

const baseLanguageCode = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];

/**
 * Requirements that must survive every response-local Tutor instruction.
 *
 * Persona is repeated on every turn because both realtime providers receive
 * changing task instructions. At beginner levels one response-final language
 * gate keeps teacher talk in the support language while requiring exact
 * practice spans to retain the target language's native pronunciation.
 */
export function buildTutorPersistentResponseSuffix({
  persona = "",
  supportLanguageCode = "",
  targetLanguageCode = "",
  isEarlyLevel = false,
} = {}) {
  const support = baseLanguageCode(supportLanguageCode);
  const target = baseLanguageCode(targetLanguageCode);
  const personaReminder = buildVoicePersonaReminder(persona);
  const shouldPinSupportLanguage =
    isEarlyLevel || (support && support === target);
  const languageGate = shouldPinSupportLanguage
    ? buildTutorTeacherTalkLanguageGate({
        supportLanguageCode: support,
        targetLanguageCode: target,
      })
    : "";
  return [personaReminder, languageGate].filter(Boolean).join("\n\n");
}
