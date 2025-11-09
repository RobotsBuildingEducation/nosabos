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
const vertexAI = getVertexAI(app);
export const ai = getVertexAI(app);

let messaging = null;
async function initMessaging() {
  if (await isSupported()) {
    messaging = getMessaging(app);
    // Proceed with messaging-related logic
    console.log("messaging...", messaging);
  } else {
    console.warn("Firebase Messaging is not supported in this environment.");
    // Optionally, set up a fallback or skip messaging entirely
  }
}
initMessaging();

// 3) Pass that into your model’s generationConfig:
const simplemodel = getGenerativeModel(vertexAI, {
  // model: "gemini-1.5-flash",
  // model: "gemini-2.0-flash-001",
  // model: "gemini-2.0-flash",
  // model: "gemini-1.5-flash",
  model: "gemini-2.5-flash",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 }, // disables thinking
  },
});

export { database, vertexAI, messaging, Schema, analytics, simplemodel };
