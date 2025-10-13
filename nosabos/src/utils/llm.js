// src/utils/llm.js

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const DEFAULT_RESPONSES_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

export async function callResponses({ model = DEFAULT_RESPONSES_MODEL, input }) {
  try {
    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        text: { format: { type: "text" } },
        input,
      }),
    });
    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    const text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join("")
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      (typeof payload === "string" ? payload : "");
    return String(text || "");
  } catch {
    return "";
  }
}

export { DEFAULT_RESPONSES_MODEL };
