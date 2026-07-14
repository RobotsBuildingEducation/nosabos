import { initializeApp } from "firebase/app";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAnalytics } from "firebase/analytics";

import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getGenerativeModel, getVertexAI, Schema } from "@firebase/vertexai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PUBLIC_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

const APP_CHECK_DEBUG_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

if (
  typeof window !== "undefined" &&
  APP_CHECK_DEBUG_HOSTNAMES.has(window.location.hostname)
) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

export async function getAppCheckHeaders() {
  try {
    const { token } = await getToken(appCheck, false);
    return token ? { "X-Firebase-AppCheck": token } : {};
  } catch (error) {
    console.warn("Failed to get Firebase App Check token:", error);
    return {};
  }
}

export async function appCheckFetch(input, init = {}) {
  const appCheckHeaders = await getAppCheckHeaders();
  const headers = new Headers(init.headers || {});

  Object.entries(appCheckHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return fetch(input, { ...init, headers });
}

const database = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
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
  model: "gemini-3.1-flash-lite",
  generationConfig: {
    // Firebase AI Logic doesn't support Gemini 3 thinking_level yet.
    // For now, keep using thinking budgets (0 ≈ "minimal" behavior you're after).
    thinkingConfig: { thinkingBudget: 0 },
  },
});

const simplemodel3 = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
    responseMimeType: "application/json",
  },
});

const gradingModel = getGenerativeModel(vertexAI, {
  model: "gemini-3-flash-preview",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 1024 },
    responseMimeType: "application/json",
  },
});

const gradingLiteModel = getGenerativeModel(vertexAI, {
  model: "gemini-3.1-flash-lite",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
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
  database,
  vertexAI,
  messaging,
  Schema,
  analytics,
  simplemodel,
  gradingModel,
  gradingLiteModel,
  citizenshipAssistantModel,
  simplemodel3,
};
