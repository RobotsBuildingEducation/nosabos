import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import "./App.css";
import VoiceChat from "./components/VoiceChat";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import { database } from "./firebaseResources/firebaseResources";

const App = () => {
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const initRef = useRef(false); // guard StrictMode double-run in dev

  // Track active creds in App state so children update instantly
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

  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    localStorage.getItem("local_npub") ?? "",
    localStorage.getItem("local_nsec") ?? ""
  );

  const loadUserObjectFromDB = async (id) => {
    if (!id) return null;
    try {
      const userDocRef = doc(database, "users", id);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) return null;
      const userData = { id: snap.id, ...snap.data() };

      // If you have a global store, update it here (guarded)
      // try {
      //   const { setUser } = useUserStore.getState();
      //   setUser(userData);
      // } catch {}

      return userData;
    } catch (error) {
      console.error("loadUserObjectFromDB failed:", error);
      return null;
    }
  };

  const connectDID = async () => {
    setIsLoadingApp(true);
    try {
      let id = (localStorage.getItem("local_npub") || "").trim();
      let user = await loadUserObjectFromDB(id);

      if (!user) {
        // No local id or not found in DB → create once
        const did = await generateNostrKeys(); // writes npub + nsec to localStorage
        id = did.npub;

        await setDoc(
          doc(database, "users", id),
          { local_npub: id, createdAt: new Date().toISOString() },
          { merge: true }
        );

        user = await loadUserObjectFromDB(id);
      }

      // reflect latest creds in state so children update immediately
      setActiveNpub(id);
      setActiveNsec(localStorage.getItem("local_nsec") || "");
    } catch (e) {
      console.error("connectDID error:", e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    connectDID();
  }, []);

  return (
    <VoiceChat
      auth={auth} // auth(nsec) -> derives npub + sets LS
      activeNpub={activeNpub} // keeps the drawer in sync without refresh
      activeNsec={activeNsec}
      onSwitchedAccount={async () => {
        // Rehydrate app state after a switch (LS already set by VoiceChat/auth)
        await connectDID();
        // Sync again just in case
        setActiveNpub(localStorage.getItem("local_npub") || "");
        setActiveNsec(localStorage.getItem("local_nsec") || "");
      }}
    />
  );
};

export default App;
