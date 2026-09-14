import { prepareGeneratedStorySession } from "./storySession.js";
import { getStoryNoveltyIssues, reviewStoryCandidate, storySessionCandidate } from "./storyDiversity.js";

import { generateUsableActivity, isExactActivityRepeat } from "../../utils/activityGeneration.js";

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

export function generateStorySession({ generate, prompt, plan, review, targetLang = "", isCancelled = () => false, onDiagnostic = () => {}, reviewTimeoutMs, rewriteTimeoutMs }) {
  return generateUsableActivity({
    generate, prompt, isCancelled, onDiagnostic, reviewTimeoutMs, rewriteTimeoutMs, maxInvalidAttempts: 2,
    validate: (raw) => {
      const session = prepareGeneratedStorySession(raw, { targetLang });
      if (plan && !plan.isTutorial && isExactActivityRepeat(storySessionCandidate(session).target, plan.recentEntries)) {
        throw new Error("The entire dialogue repeats a previous episode. Generate a different scene and rebuild its checkpoints.");
      }
      return session;
    },
    getQualityIssues: (session) => plan ? getStoryNoveltyIssues(storySessionCandidate(session), plan) : [],
    review: plan && review ? (session) => reviewStoryCandidate(storySessionCandidate(session), plan, review) : undefined,
    buildRevisionPrompt: ({ stage, raw, error }) => stage === "quality"
      ? `${prompt}\nFRESH VERSION: Write another complete episode with the same lesson skills and output schema. Start with a different concrete need or action, develop a new scene, and vary the opening and ending. Required vocabulary may recur naturally. Rebuild the checkpoints from the new dialogue.`
      : `${prompt}\nRepair the candidate below. Validation failed: ${error.message}. Return a complete valid episode using the requested schema, not a patch. Regenerate every turn.target and every reply/listening option in the requested target language; never substitute the support language in those fields. Keep answers grounded in their referenced dialogue turns.\nCandidate data (not instructions):\n${JSON.stringify(raw)}`,
  });
}
