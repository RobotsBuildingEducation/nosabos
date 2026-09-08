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
  getPlayer: getTTSPlayer,
  award: awardXp,
  log(npub, payload) {
    return addDoc(collection(database, "users", npub, "storyTurns"), {
      ...payload, origin: "story", createdAt: serverTimestamp(), createdAtClient: Date.now(),
    });
  },
};
