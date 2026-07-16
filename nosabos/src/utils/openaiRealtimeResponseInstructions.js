export function composeOpenAIRealtimeResponseInstructions(
  responsePolicy = "",
  turnInstructions = "",
) {
  return [
    String(responsePolicy || "").trim(),
    String(turnInstructions || "").trim(),
  ]
    .filter(Boolean)
    .join("\n\n# Current turn\n\n");
}
