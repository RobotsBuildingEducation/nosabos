import { getGenerativeModel, getVertexAI, Schema } from "@firebase/vertexai";
import { app } from "./firebaseApp";

const vertexAI = getVertexAI(app, { location: "global" });

const simplemodel = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
  },
});

const gradingModel = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 1024 },
    responseMimeType: "application/json",
  },
});

const citizenshipAssistantModel = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 1024 },
  },
});

export {
  Schema,
  citizenshipAssistantModel,
  gradingModel,
  simplemodel,
  vertexAI,
};
