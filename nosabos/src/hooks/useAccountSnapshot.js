import { useEffect, useLayoutEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

// Snapshot callbacks can change with UI state without reconnecting Firestore
// and replaying its cached document after every render.
export default function useAccountSnapshot(npub, onAccountSnapshot) {
  const callback = useRef(onAccountSnapshot);
  useLayoutEffect(() => {
    callback.current = onAccountSnapshot;
  }, [onAccountSnapshot]);

  useEffect(() => {
    if (!npub) return;
    let active = true;
    const stop = onSnapshot(doc(database, "users", npub), snapshot => {
      if (active) callback.current(snapshot);
    });
    return () => {
      active = false;
      stop();
    };
  }, [npub]);
}
