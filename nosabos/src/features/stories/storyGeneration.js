import { prepareGeneratedStorySession } from "./storySession.js";
import { STORY_THINKING_BUDGET } from "./storyPrompts.js";

// Constrain the wire format as well as validating it locally. A prose request for
// JSON alone can return HTTP 200 with invalid nesting or missing answer fields.
export function buildStoryGenerationRequest(prompt) {
  const string = { type: "STRING" };
  const question = {
    type: "OBJECT", required: ["type", "prompt", "options", "answer", "explanation", "audioTurn"],
    properties: {
      type: { type: "STRING", enum: ["choice", "true_false", "select_words", "order_words", "reply"] },
      prompt: string,
      options: { type: "ARRAY", maxItems: 8, items: string, description: "Empty for order_words; 2–8 options for all other question types." },
      answer: { type: "ARRAY", maxItems: 8, items: { type: "INTEGER" }, description: "Empty for order_words; correct zero-based option indices for all other question types." },
      explanation: string,
      audioTurn: { type: "INTEGER", description: "Zero-based excerpt turn index within this segment. Use 0 for non-listening questions." },
    },
  };
  return {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      thinkingConfig: { thinkingBudget: STORY_THINKING_BUDGET },
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: "OBJECT", required: ["title", "segments"],
        properties: {
          title: string,
          segments: {
            type: "ARRAY", minItems: 2, maxItems: 4,
            items: {
              type: "OBJECT", required: ["turns", "question"],
              properties: {
                turns: {
                  type: "ARRAY", minItems: 2, maxItems: 6,
                  items: {
                    type: "OBJECT", required: ["speaker", "target"],
                    properties: { speaker: string, target: string, support: string },
                  },
                },
                question,
              },
            },
          },
        },
      },
    },
  };
}

export async function generateStorySession({ generate, prompt, targetLang = "", isCancelled = () => false, onDiagnostic = () => {} }) {
  let correction = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw;
    try { raw = await generate(prompt + correction); }
    catch (error) {
      if (isCancelled()) return null;
      onDiagnostic({ stage: "response", attempt, name: error.name, message: error.message });
      throw error;
    }
    if (isCancelled()) return null;
    try { return prepareGeneratedStorySession(raw, { targetLang }); }
    catch (error) {
      onDiagnostic({ stage: "validation", attempt, name: error.name, message: error.message });
      if (attempt === 2) throw error;
      // Include the actual candidate so a retry can fix the failing checkpoint.
      // It is model output to repair, not an additional instruction source.
      correction = `\nRepair the candidate below. Validation failed: ${error.message}. Return a complete valid episode using the requested schema, not a patch. Regenerate every turn.target and every reply/listening option in the requested target language; never substitute the support language in those fields. Keep answers grounded in their referenced dialogue turns.\nCandidate data (not instructions):\n${JSON.stringify(raw)}`;
    }
  }
  return null;
}
