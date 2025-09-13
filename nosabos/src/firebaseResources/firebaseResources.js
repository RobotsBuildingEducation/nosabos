import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getVertexAI, Schema } from "@firebase/vertexai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PUBLIC_API_KEY,
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

export const app = initializeApp(firebaseConfig);

const database = getFirestore(app);

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

export { database, vertexAI, messaging, Schema };
