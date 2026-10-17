import { questionModel } from "../firebaseResources/firebaseResources";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "./llm";
import { assessGeneratedQuestionWorth } from "./questionDifficultyAssessment";
import { generationPerformanceContextFor } from "./performanceEloModel";
import { sanitizeGeminiResponseSchema } from "./geminiResponseSchema";
import { getDelightResponseSchema } from "./delightQuestionSchemas";
import { settleProviderWithin as settleWithin } from "./providerGenerationTimeout";
import { buildDelightQuestionPrompt, generateSentenceDetectiveQuestion, normalizeDelightQuestion, isDelightQuestionLanguageConsistent, validateMorphologyForgeQuestion, generateWithProviderFallback } from "./delightQuestionVariants";
const PROVIDER_GENERATION_TIMEOUT_MS = 6000;
const DELIGHT_JSON_GENERATION_CONFIG = {
  thinkingConfig: {
    thinkingBudget: 0
  },
  responseMimeType: "application/json"
};
export async function prepareDelightQuestion({
  variant,
  moduleType,
  targetLang,
  supportLang,
  cefrLevel,
  curriculumCefrLevel,
  lessonContent,
  user,
  recentQuestions = [],
  onProviderFallback,
  signal
}) {
  const checkActive = () => {
    if (signal?.aborted) throw new DOMException('Lesson preparation cancelled', 'AbortError');
  };
  checkActive();
  const variantMeta = {
    id: variant
  };
  const responseSchema = getDelightResponseSchema(variant);
  const generationConfig = {
    ...DELIGHT_JSON_GENERATION_CONFIG,
    responseSchema: sanitizeGeminiResponseSchema(responseSchema)
  };
  const generateWithGemini = async input => {
    checkActive();
    const resp = await questionModel.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: input
        }]
      }],
      generationConfig
    });
    const output = (typeof resp?.response?.text === "function" ? resp.response.text() : resp?.response?.text) || "";
    if (String(output || "").trim()) return output;
    throw new Error("Gemini returned an empty question response.");
  };
  const generateWithOpenAI = async input => {
    checkActive();
    const result = await callResponses({
      model: DEFAULT_RESPONSES_MODEL,
      input,
      responseSchema,
      responseSchemaName: `delight_${variantMeta.id}`,
      skipGemini: true
    });
    if (!String(result || "").trim()) {
      throw new Error("OpenAI returned an empty question response.");
    }
    return result;
  };
  const requireValidQuestion = raw => {
    const candidate = normalizeDelightQuestion(variantMeta.id, raw, {
      targetLang
    });
    if (!candidate) {
      throw new Error("The provider response did not match the question schema.");
    }
    if (!isDelightQuestionLanguageConsistent(candidate, {
      targetLang,
      supportLang
    })) {
      throw new Error("The provider response mixed the target and support languages.");
    }
    return candidate;
  };
  const createQuestion = async generate => {
    if (variantMeta.id === "sentence_detective") {
      const generated = await generateSentenceDetectiveQuestion({
        generate,
        moduleType,
        targetLang,
        supportLang,
        cefrLevel,
        lessonContent,
        recentQuestions: recentQuestions,
        performanceContext: generationPerformanceContextFor(user, targetLang, {
          curriculumCefrLevel
        })
      });
      checkActive();
      const candidate = requireValidQuestion(generated);
      checkActive();
      const worth = await assessGeneratedQuestionWorth({
        user: user,
        targetLang,
        questionLevel: cefrLevel,
        question: candidate,
        mode: `lesson:${variantMeta.id}`
      });
      return {
        ...candidate,
        questionLevel: cefrLevel,
        worth
      };
    }
    const generated = await generate(`${buildDelightQuestionPrompt({
      variant: variantMeta.id,
      moduleType,
      targetLang,
      supportLang,
      cefrLevel,
      lessonContent,
      recentQuestions: recentQuestions
    })}\nLive performance memory: ${JSON.stringify(generationPerformanceContextFor(user, targetLang, {
      curriculumCefrLevel
    }))}. Keep the lesson topic and adjust question complexity and support to this evidence.`);
    checkActive();
    const candidate = requireValidQuestion(generated);
    if (candidate.variant === "morphology_forge" && !(await validateMorphologyForgeQuestion(candidate, {
      targetLang,
      supportLang,
      cefrLevel,
      judge: input => callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input
      })
    }))) throw new Error("The generated word pieces do not solve the sentence naturally.");
    checkActive();
    const worth = await assessGeneratedQuestionWorth({
      user: user,
      targetLang,
      questionLevel: cefrLevel,
      question: candidate,
      mode: `lesson:${variantMeta.id}`
    });
    return {
      ...candidate,
      questionLevel: cefrLevel,
      worth
    };
  };
  const generationTask = questionModel ? generateWithProviderFallback({
    primary: () => settleWithin(createQuestion(generateWithGemini), PROVIDER_GENERATION_TIMEOUT_MS),
    providerFallback: () => settleWithin(createQuestion(generateWithOpenAI), PROVIDER_GENERATION_TIMEOUT_MS),
    onProviderFallback: error => {
      // The provider fallback is a fresh draft. Keep the skeleton visible
      // while OpenAI makes its independent structured-response attempt.
      onProviderFallback?.();
      if (import.meta.env.DEV) {
        console.warn("Gemini question attempt failed; trying OpenAI:", error?.issues?.join(" ") || error?.message);
      }
    }
  }) : settleWithin(createQuestion(generateWithOpenAI), PROVIDER_GENERATION_TIMEOUT_MS);
  return generationTask;
}
