export function composeOpenAIRealtimeResponseInstructions(
  responsePolicy = "",
  turnInstructions = "",
  responseSuffix = "",
) {
  const composed = [
    String(responsePolicy || "").trim(),
    String(turnInstructions || "").trim(),
  ]
    .filter(Boolean)
    .join("\n\n# Current turn\n\n");
  // The suffix is the support-language output anchor — it must be the LAST
  // thing the model reads before generating (see openaiTutorLanguageAnchor).
  const suffix = String(responseSuffix || "").trim();
  return [composed, suffix].filter(Boolean).join("\n\n");
}
