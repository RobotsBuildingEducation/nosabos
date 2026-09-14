import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { storyModel, storyRevisionModel, database } from "../../firebaseResources/firebaseResources";
import { getTTSPlayer } from "../../utils/tts";
import { awardXp } from "../../utils/utils";
import { buildStoryGenerationRequest } from "./storyGeneration";
import { reviewGeneratedActivity } from "../../utils/activityReviewService";

export const storyServices = {
  review: reviewGeneratedActivity,
  async generate(prompt, { isRevision = false } = {}) {
    const response = await (isRevision ? storyRevisionModel : storyModel).generateContent(buildStoryGenerationRequest(prompt));
    if (response.response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      throw new Error("Story response was truncated before the episode was complete");
    }
    return response.response.text();
  },
  async generateStream(prompt) {
    return storyModel.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    });
  },
  async translate(text, targetLang, supportLang) {
    const prompt = `Translate this ${targetLang || "target"} text into clear, natural, learner-friendly ${supportLang || "support language"}. Return ONLY the direct translation text without quotes or explanation:
"${text}"`;
    const response = await storyModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 128,
      },
    });
    return response.response.text().trim().replace(/^["']|["']$/g, "");
  },
  getPlayer: getTTSPlayer,
  award: awardXp,
  log(npub, payload) {
    return addDoc(collection(database, "users", npub, "storyTurns"), {
      ...payload, origin: "story", createdAt: serverTimestamp(), createdAtClient: Date.now(),
    });
  },
};
