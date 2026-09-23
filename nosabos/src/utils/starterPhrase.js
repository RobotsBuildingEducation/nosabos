export const isFoundationStarterLevel = (level) =>
  level === "Pre-A1" || level === "A1";

function parseStarterPhrase(text) {
  const raw = String(text || "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    const target = String(parsed?.target || "").trim();
    if (!target) return null;
    return { target, support: String(parsed?.support || "").trim() };
  } catch {
    return null;
  }
}

function readStreamingField(text, key) {
  const start = text.match(new RegExp(`"${key}"\\s*:\\s*"`));
  if (!start) return "";
  let raw = "";
  for (let i = start.index + start[0].length; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') break;
    if (char === "\\") {
      const escape = text[i + 1];
      if (!escape) break;
      if (escape === "u") {
        if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) break;
        raw += text.slice(i, i + 6);
        i += 5;
      } else {
        raw += text.slice(i, i + 2);
        i += 1;
      }
    } else {
      raw += char;
    }
  }
  try {
    return JSON.parse(`"${raw}"`).trim();
  } catch {
    return "";
  }
}

export async function generateStarterPhrase({
  model,
  goal,
  level,
  targetName,
  supportName,
  lastAiMessage = "",
  onUpdate,
}) {
  if (!model || !goal) throw new Error("Starter phrase requires Gemini and a goal.");
  if (!targetName || !supportName) throw new Error("Starter phrase needs language names.");
  const prompt = `A ${level} beginner is practicing spoken ${targetName} conversation. Their current goal: "${goal}".${
    lastAiMessage
      ? `\nThe conversation partner just said: "${lastAiMessage}". The phrase must work as a natural spoken reply to that.`
      : ""
  }
Write ONE starter phrase in ${targetName} the learner can say out loud to complete the goal: about 3-8 words, ${level}-appropriate high-frequency chunks only, natural and friendly. If a personal detail belongs in it (their name, a family member, a thing they like), put "___" in that spot — at most one blank. Also give its ${supportName} translation (keep "___" as "___").
Respond with ONLY a JSON object: {"target":"phrase in ${targetName}","support":"translation in ${supportName}"}`;

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  let streamedText = "";
  let lastUpdate = "";
  for await (const chunk of result.stream) {
    const piece = typeof chunk?.text === "function" ? chunk.text() : chunk?.text;
    if (!piece) continue;
    streamedText += piece;
    const target = readStreamingField(streamedText, "target");
    if (!target) continue;
    const update = { target, support: readStreamingField(streamedText, "support") };
    const signature = JSON.stringify(update);
    if (signature !== lastUpdate) {
      lastUpdate = signature;
      onUpdate?.(update);
    }
  }
  const response = await result.response;
  const finalText = typeof response?.text === "function" ? response.text() : response?.text;
  const phrase = parseStarterPhrase(finalText) || parseStarterPhrase(streamedText);
  if (!phrase) throw new Error("Gemini did not return a starter phrase.");
  return phrase;
}
