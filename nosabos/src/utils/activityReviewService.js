import { activityReviewModel } from "../firebaseResources/firebaseResources";
import { reviewActivity } from "./activityQualityReview.js";

export const reviewGeneratedActivity = (options) => reviewActivity({
  ...options,
  generate: async (request) => {
    const response = await activityReviewModel.generateContent(request);
    return response.response.text();
  },
});
