import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getGenerativeModel, getVertexAI, Schema } from "@firebase/vertexai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PUBLIC_API_KEY,
  authDomain: "nosabo-30dcb.firebaseapp.com",
  projectId: "nosabo-30dcb",
  storageBucket: "nosabo-30dcb.firebasestorage.app",
  messagingSenderId: "323662475274",
  appId: "1:323662475274:web:570aa2eb1beaf87810aff3",
  measurementId: "G-FX7CB1K22B",
};

export const app = initializeApp(firebaseConfig);

const database = getFirestore(app);
const analytics = getAnalytics(app);

// ✅ IMPORTANT: Gemini 3 Flash Preview is "global", not us-central1
const vertexAI = getVertexAI(app, { location: "global" });
export const ai = vertexAI;

let messaging = null;
async function initMessaging() {
  if (await isSupported()) {
    messaging = getMessaging(app);
    console.log("messaging...", messaging);
  } else {
    console.warn("Firebase Messaging is not supported in this environment.");
  }
}
initMessaging();

const simplemodel = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    // Firebase AI Logic doesn't support Gemini 3 thinking_level yet.
    // For now, keep using thinking budgets (0 ≈ "minimal" behavior you're after).
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

export { database, vertexAI, messaging, Schema, analytics, simplemodel, gradingModel };
