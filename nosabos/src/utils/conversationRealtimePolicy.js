import { buildVoicePersonaReminder } from "./voicePersonaPrompt.js";

export function buildConversationTurnDetection(pauseMs = 2000) {
  const silenceDuration = Number.isFinite(Number(pauseMs))
    ? Math.max(200, Number(pauseMs))
    : 2000;

  return {
    type: "server_vad",
    silence_duration_ms: silenceDuration,
    threshold: 0.35,
    prefix_padding_ms: 120,
    // Conversations creates each response explicitly so it can attach the
    // latest language, level, goal, and personality policy to that turn.
    create_response: false,
    interrupt_response: false,
  };
}

export function buildConversationResponseInstructions(
  sessionInstructions = "",
  persona = "",
) {
  return [
    String(sessionInstructions || "").trim(),
    buildVoicePersonaReminder(persona),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildConversationResponseCreateEvent({
  sessionInstructions = "",
  persona = "",
} = {}) {
  return {
    type: "response.create",
    response: {
      output_modalities: ["audio"],
      instructions: buildConversationResponseInstructions(
        sessionInstructions,
        persona,
      ),
      metadata: { kind: "conversation" },
    },
  };
}
