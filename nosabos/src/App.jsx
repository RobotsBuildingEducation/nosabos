// App.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import "./App.css";
import VoiceChat from "./components/VoiceChat";
import Onboarding from "./components/Onboarding"; // ensure this resolves to your component
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import { database } from "./firebaseResources/firebaseResources";
import useUserStore from "./hooks/useUserStore";

// Normalize weird stored values to a real boolean
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const App = () => {
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const initRef = useRef(false); // guard StrictMode double-run in dev

  // Local mirrors of active creds to keep children in sync
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

  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    localStorage.getItem("local_npub") ?? "",
    localStorage.getItem("local_nsec") ?? ""
  );

  /** Ensure an existing user doc has onboarding flag; backfill if missing. */
  const ensureOnboardingField = async (id, data) => {
    const hasNested = data?.onboarding && typeof data.onboarding === "object";
    const hasCompleted =
      hasNested &&
      Object.prototype.hasOwnProperty.call(data.onboarding, "completed");
    const hasLegacyTopLevel = Object.prototype.hasOwnProperty.call(
      data || {},
      "onboardingCompleted"
    );

    if (!hasCompleted && !hasLegacyTopLevel) {
      // Backfill once for legacy docs
      await setDoc(
        doc(database, "users", id),
        { onboarding: { completed: false } },
        { merge: true }
      );
      // Re-read fresh data
      const snap = await getDoc(doc(database, "users", id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : data;
    }
    return data;
  };

  /** Helper: read user doc */
  const loadUserObjectFromDB = async (id) => {
    if (!id) return null;
    try {
      const userDocRef = doc(database, "users", id);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) return null;
      let userData = { id: snap.id, ...snap.data() };

      // Backfill onboarding if missing (legacy docs)
      userData = await ensureOnboardingField(id, userData);

      setUser?.(userData);
      return userData;
    } catch (error) {
      console.error("loadUserObjectFromDB failed:", error);
      return null;
    }
  };

  /**
   * Connect DID and ensure a stable user doc:
   * - If local_npub exists:
   *   - If doc exists -> use it (and backfill onboarding if missing)
   *   - If doc missing -> create it with onboarding.completed=false
   * - If no local_npub -> generate keys once and create the doc with onboarding
   */
  const connectDID = async () => {
    setIsLoadingApp(true);
    try {
      let id = (localStorage.getItem("local_npub") || "").trim();
      let userDoc = null;

      if (id) {
        userDoc = await loadUserObjectFromDB(id);
        if (!userDoc) {
          // Create a doc for the existing local id (first time syncing)
          const base = {
            local_npub: id,
            createdAt: new Date().toISOString(),
            onboarding: { completed: false },
          };
          await setDoc(doc(database, "users", id), base, { merge: true });
          userDoc = await loadUserObjectFromDB(id);
        }
      } else {
        // No local id -> generate keys once
        const did = await generateNostrKeys(); // writes npub + nsec to localStorage
        id = did.npub;
        const base = {
          local_npub: id,
          createdAt: new Date().toISOString(),
          onboarding: { completed: false },
        };
        await setDoc(doc(database, "users", id), base, { merge: true });
        userDoc = await loadUserObjectFromDB(id);
      }

      // reflect latest creds so children update immediately
      setActiveNpub(id);
      setActiveNsec(localStorage.getItem("local_nsec") || "");

      if (userDoc) setUser?.(userDoc);
    } catch (e) {
      console.error("connectDID error:", e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  /** Mark onboarding as complete and refresh user */
  const handleOnboardingComplete = async (payload = {}) => {
    try {
      const id = localStorage.getItem("local_npub");
      if (!id) return;

      // Normalize payload -> progress shape VoiceChat expects
      const safe = (v, fallback) =>
        v === undefined || v === null ? fallback : v;
      const challenge =
        payload?.challenge?.en && payload?.challenge?.es
          ? payload.challenge
          : { en: "Make a polite request.", es: "Pide algo con cortesía." };

      const progress = {
        level: safe(payload.level, "beginner"),
        supportLang: ["en", "es", "bilingual"].includes(payload.supportLang)
          ? payload.supportLang
          : "en",
        voice: safe(payload.voice, "Leda"),
        voicePersona: safe(
          payload.voicePersona,
          "Like a rude, sarcastic, mean-spirited toxica."
        ),
        targetLang: payload.targetLang === "nah" ? "nah" : "es",
        showTranslations:
          typeof payload.showTranslations === "boolean"
            ? payload.showTranslations
            : true,
        challenge,
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
          lastGoal: progress.challenge.en,
          xp: 0,
          streak: 0,
          progress,
        },
        { merge: true }
      );

      // Refresh the in-memory user so App gates to VoiceChat and Settings see the new values
      const fresh = await loadUserObjectFromDB(id);
      if (fresh) setUser?.(fresh);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    connectDID();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SINGLE SOURCE OF TRUTH: need onboarding unless we explicitly see "true"
  const onboardingDone = useMemo(() => {
    const a = user?.onboarding?.completed;
    const b = user?.onboardingCompleted; // legacy flat shape, if you ever used it
    return isTrue(a) || isTrue(b);
  }, [user]);

  const needsOnboarding = useMemo(() => !onboardingDone, [onboardingDone]);

  if (isLoadingApp || !user) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (needsOnboarding) {
    return (
      <Onboarding user={user} onComplete={() => handleOnboardingComplete()} />
    );
  }

  return (
    <VoiceChat
      auth={auth}
      activeNpub={activeNpub}
      activeNsec={activeNsec}
      onSwitchedAccount={async () => {
        await connectDID();
        setActiveNpub(localStorage.getItem("local_npub") || "");
        setActiveNsec(localStorage.getItem("local_nsec") || "");
      }}
    />
  );
};

export default App;
