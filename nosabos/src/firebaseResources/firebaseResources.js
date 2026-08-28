import { initializeApp } from "firebase/app";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAnalytics } from "firebase/analytics";

import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
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
const useFirebaseEmulators =
  import.meta.env.DEV &&
  String(import.meta.env.VITE_USE_FIREBASE_EMULATORS).toLowerCase() === "true";

const configuredDebugToken =
  import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ||
  import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;

const isLiveFunctionsConfigured =
  typeof import.meta.env.VITE_REALTIME_URL === "string" &&
  Boolean(import.meta.env.VITE_REALTIME_URL) &&
  !import.meta.env.VITE_REALTIME_URL.includes("localhost") &&
  !import.meta.env.VITE_REALTIME_URL.includes("127.0.0.1");

// Initialize App Check whenever we are not using full emulators, or when calling live Cloud Functions
const shouldInitializeAppCheck = !useFirebaseEmulators || isLiveFunctionsConfigured;

if (
  shouldInitializeAppCheck &&
  typeof window !== "undefined" &&
  (import.meta.env.DEV ||
    APP_CHECK_DEBUG_HOSTNAMES.has(window.location.hostname) ||
    window.location.hostname.endsWith(".local") ||
    /^192\.168\.\d+\.\d+$/.test(window.location.hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname))
) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    configuredDebugToken && String(configuredDebugToken).trim()
      ? String(configuredDebugToken).trim()
      : true;
}

export const appCheck = !shouldInitializeAppCheck
  ? null
  : initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    });

export async function getAppCheckHeaders() {
  if (!appCheck) return {};

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
  localCache: useFirebaseEmulators
    ? memoryLocalCache()
    : persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
});

if (useFirebaseEmulators) {
  connectFirestoreEmulator(database, "127.0.0.1", 8080);
}
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
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    // Firebase AI Logic doesn't support Gemini 3 thinking_level yet.
    // For now, keep using thinking budgets (0 ≈ "minimal" behavior you're after).
    thinkingConfig: { thinkingBudget: 0 },
  },
});

// Question generation has a deliberately short network deadline. Firebase's
// default is 180 seconds; using a dedicated model instance lets its internal
// AbortController cancel timed-out fetches instead of merely ignoring them in
// the UI while they continue consuming quota in the background.
const questionModel = getGenerativeModel(
  vertexAI,
  {
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      thinkingConfig: { thinkingBudget: 0 },
    },
  },
  { timeout: 6000 },
);

const simplemodel3 = getGenerativeModel(vertexAI, {
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
    responseMimeType: "application/json",
  },
});

const gradingModel = getGenerativeModel(vertexAI, {
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 1024 },
    responseMimeType: "application/json",
  },
});

const gradingLiteModel = getGenerativeModel(vertexAI, {
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 },
    responseMimeType: "application/json",
  },
});

const citizenshipAssistantModel = getGenerativeModel(vertexAI, {
  model: "gemini-3.5-flash-lite",
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
  questionModel,
  gradingModel,
  gradingLiteModel,
  citizenshipAssistantModel,
  simplemodel3,
};
