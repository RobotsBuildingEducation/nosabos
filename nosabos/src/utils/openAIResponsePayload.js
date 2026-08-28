function responseErrorMessage(payload) {
  return (
    payload?.error?.message ||
    payload?.error ||
    payload?.incomplete_details?.reason ||
    "OpenAI returned an unusable response."
  );
}

export function getOpenAIResponseError(payload, status = 0) {
  const prefix = status
    ? `OpenAI Responses request failed (${status})`
    : "OpenAI Responses request failed";
  return new Error(`${prefix}: ${responseErrorMessage(payload)}`);
}

export function extractOpenAIResponseText(payload) {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";
  if (payload.error) throw getOpenAIResponseError(payload);

  const contentSegments = Array.isArray(payload.output)
    ? payload.output.flatMap((item) =>
        Array.isArray(item?.content) ? item.content : [],
      )
    : [];
  const refusal = contentSegments.find(
    (segment) => typeof segment?.refusal === "string" && segment.refusal.trim(),
  );
  if (refusal) {
    throw new Error(
      `OpenAI refused the structured response: ${refusal.refusal}`,
    );
  }

  const text =
    (typeof payload.output_text === "string" && payload.output_text) ||
    contentSegments
      .map((segment) =>
        typeof segment?.text === "string" ? segment.text : "",
      )
      .join("")
      .trim() ||
    (Array.isArray(payload.content) && payload.content[0]?.text) ||
    (Array.isArray(payload.choices) &&
      payload.choices[0]?.message?.content) ||
    "";

  if (payload.status && payload.status !== "completed") {
    throw getOpenAIResponseError(payload);
  }

  return String(text || "").trim();
}
