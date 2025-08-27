// App.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";

import "./App.css";
import VoiceChat from "./components/VoiceChat";
import Onboarding from "./components/Onboarding";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import { database } from "./firebaseResources/firebaseResources";
import useUserStore from "./hooks/useUserStore";

/* ---------------------------
   Constants & helpers
--------------------------- */
const DEFAULT_CHALLENGE = {
  en: "Make a polite request.",
  es: "Pide algo con cortesía.",
};
const DEFAULT_PERSONA = "Like a sarcastic, semi-friendly toxica.";

const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

/* ---------------------------
   Firestore helpers
--------------------------- */
async function ensureOnboardingField(database, id, data) {
  const hasNested = data?.onboarding && typeof data.onboarding === "object";
  const hasCompleted =
    hasNested &&
    Object.prototype.hasOwnProperty.call(data.onboarding, "completed");
  const hasLegacyTopLevel = Object.prototype.hasOwnProperty.call(
    data || {},
    "onboardingCompleted"
  );

  if (!hasCompleted && !hasLegacyTopLevel) {
    await setDoc(
      doc(database, "users", id),
      { onboarding: { completed: false } },
      { merge: true }
    );
    const snap = await getDoc(doc(database, "users", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : data;
  }
  return data;
}

async function loadUserObjectFromDB(database, id) {
  if (!id) return null;
  try {
    const ref = doc(database, "users", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    let userData = { id: snap.id, ...snap.data() };
    userData = await ensureOnboardingField(database, id, userData);
    return userData;
  } catch (e) {
    console.error("loadUserObjectFromDB failed:", e);
    return null;
  }
}

/* ---------------------------
   App
--------------------------- */
export default function App() {
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const initRef = useRef(false); // guard StrictMode double-run in dev

  // Reflect local creds so children re-render when keys change
  const [activeNpub, setActiveNpub] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("local_npub") || ""
      : ""
  );
  const [activeNsec, setActiveNsec] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("local_nsec") || ""
      : ""
  );

  // Global user store
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  // DID / auth
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    localStorage.getItem("local_npub") ?? "",
    localStorage.getItem("local_nsec") ?? ""
  );

  /** Establish or sync identity and ensure a user doc exists with onboarding flag */
  const connectDID = async () => {
    setIsLoadingApp(true);
    try {
      let id = (localStorage.getItem("local_npub") || "").trim();
      let userDoc = null;

      if (id) {
        userDoc = await loadUserObjectFromDB(database, id);
        if (!userDoc) {
          // first time syncing a locally-present id → create minimal doc
          const base = {
            local_npub: id,
            createdAt: new Date().toISOString(),
            onboarding: { completed: false },
          };
          await setDoc(doc(database, "users", id), base, { merge: true });
          userDoc = await loadUserObjectFromDB(database, id);
        }
      } else {
        // No local id → generate keys, write user doc
        const did = await generateNostrKeys(); // side-effect: writes npub/nsec to localStorage
        id = did.npub;
        const base = {
          local_npub: id,
          createdAt: new Date().toISOString(),
          onboarding: { completed: false },
        };
        await setDoc(doc(database, "users", id), base, { merge: true });
        userDoc = await loadUserObjectFromDB(database, id);
      }

      // Reflect creds
      setActiveNpub(id);
      setActiveNsec(localStorage.getItem("local_nsec") || "");

      // Hydrate store
      if (userDoc) setUser?.(userDoc);
    } catch (e) {
      console.error("connectDID error:", e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  /** Save onboarding payload → progress, flip completed → reload user */
  const handleOnboardingComplete = async (payload = {}) => {
    try {
      const id = (localStorage.getItem("local_npub") || "").trim();
      if (!id) return;

      const safe = (v, fallback) =>
        v === undefined || v === null ? fallback : v;

      // Normalize / validate incoming payload
      const normalized = {
        level: safe(payload.level, "beginner"),
        supportLang: ["en", "es", "bilingual"].includes(payload.supportLang)
          ? payload.supportLang
          : "en",
        voice: safe(payload.voice, "Leda"),
        voicePersona: safe(payload.voicePersona, DEFAULT_PERSONA),
        targetLang: payload.targetLang === "nah" ? "nah" : "es",
        showTranslations:
          typeof payload.showTranslations === "boolean"
            ? payload.showTranslations
            : true,
        challenge:
          payload?.challenge?.en && payload?.challenge?.es
            ? payload.challenge
            : { ...DEFAULT_CHALLENGE },
        xp: 0,
        streak: 0,
      };

      const now = new Date().toISOString();
      await setDoc(
        doc(database, "users", id),
        {
          local_npub: id,
          updatedAt: now,
          onboarding: { completed: true, completedAt: now },
          lastGoal: normalized.challenge.en,
          xp: 0,
          streak: 0,
          progress: { ...normalized },
        },
        { merge: true }
      );

      // Refresh user in store so gating flips and VoiceChat loads with the new progress
      const fresh = await loadUserObjectFromDB(database, id);
      if (fresh) setUser?.(fresh);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  // Boot once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    connectDID();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gate: only show VoiceChat when we *explicitly* see onboarding completed
  const onboardingDone = useMemo(() => {
    const nested = user?.onboarding?.completed;
    const legacy = user?.onboardingCompleted; // if older shape ever existed
    return isTrue(nested) || isTrue(legacy);
  }, [user]);

  const needsOnboarding = useMemo(() => !onboardingDone, [onboardingDone]);

  // Loading state while we fetch/create the user doc
  if (isLoadingApp || !user) {
    return (
      <Box p={4} maxW="480px" mx="auto">
        <Skeleton
          height="40px"
          mb={4}
          startColor="#d7ccc8"
          endColor="#f5e0d3"
          borderRadius="md"
        />
        <SkeletonText
          noOfLines={4}
          spacing={4}
          skeletonHeight={3}
          startColor="#e0c9b9"
          endColor="#f7ede2"
        />
      </Box>
    );
  }

  // First-run: show Onboarding (saves progress + flips flag)
  if (needsOnboarding) {
    return (
      <Onboarding npub={activeNpub} onComplete={handleOnboardingComplete} />
    );
  }

  // Main app
  return (
    <VoiceChat
      auth={auth}
      activeNpub={activeNpub}
      activeNsec={activeNsec}
      onSwitchedAccount={async () => {
        await connectDID();
        // reflect latest local storage values
        setActiveNpub(localStorage.getItem("local_npub") || "");
        setActiveNsec(localStorage.getItem("local_nsec") || "");
      }}
    />
  );
}
