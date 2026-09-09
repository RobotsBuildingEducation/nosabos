import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { storyModel, database } from "../../firebaseResources/firebaseResources";
import { getTTSPlayer } from "../../utils/tts";
import { awardXp } from "../../utils/utils";
import { buildStoryGenerationRequest } from "./storyGeneration";

export const storyServices = {
  async generate(prompt) {
    const response = await storyModel.generateContent(buildStoryGenerationRequest(prompt));
    if (response.response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      throw new Error("Story response was truncated before the episode was complete");
    }
    return response.response.text();
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
