const MAX_VOICE_PERSONA_LENGTH = 240;

export function normalizeVoicePersona(persona = "") {
  return String(persona || "").trim().slice(0, MAX_VOICE_PERSONA_LENGTH);
}

export function buildVoicePersonaPolicy(persona = "", role = "tutor") {
  const selectedPersona = normalizeVoicePersona(persona);
  if (!selectedPersona) return "";

  return [
    "# User-selected personality — high priority",
    `The user chose this ${role} personality: ${selectedPersona}`,
    "Interpret the selected personality literally and make it unmistakable in every reply, including greetings, praise, corrections, transitions, questions, and humor.",
    "Preserve its defining attitude, intensity, vocabulary, and interaction style instead of diluting it into a generic teaching voice.",
    "The selected personality controls demeanor: warmth, politeness, directness, humor, praise, and correction style. Generic teaching-tone guidance must not replace or neutralize it.",
    "Before replying, silently phrase the content in this personality; every learner-facing sentence should sound like the same selected character.",
    "If any requested trait cannot be followed because of safety, omit only that trait and preserve every other allowed aspect of the selected personality; never collapse the entire style into a generic default.",
    "The personality changes tone and wording, not lesson accuracy, language boundaries, level limits, or safety.",
  ].join("\n");
}

export function buildVoicePersonaReminder(persona = "") {
  const selectedPersona = normalizeVoicePersona(persona);
  if (!selectedPersona) return "";

  return `FINAL STYLE REQUIREMENT: Follow this exact user-selected personality in the next reply: "${selectedPersona}". Its defining attitude and interaction style must be clearly recognizable throughout the response.`;
}
