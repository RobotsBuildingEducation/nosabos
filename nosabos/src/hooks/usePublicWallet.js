import { useEffect, useState } from "react";

let storePromise = null;
function loadStore() {
  storePromise ||= import("./useNostrWalletStore").then((module) => module.default).catch((error) => {
    storePromise = null;
    throw error;
  });
  return storePromise;
}

const actions = Object.fromEntries(
  ["init", "initWallet", "createNewWallet", "initiateDeposit"].map((name) => [
    name,
    async (...args) => (await loadStore()).getState()[name](...args),
  ]),
);

// Keep the existing global wallet and its subscriptions, but do not load its
// signing, Cashu, and achievement dependencies just to display public links.
export default function usePublicWallet(enabled) {
  const [state, setState] = useState({
    cashuWallet: null,
    walletBalance: 0,
    invoice: "",
    isCreatingWallet: false,
  });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let unsubscribe;
    loadStore().then((store) => {
      if (!alive) return;
      setState(store.getState());
      unsubscribe = store.subscribe(setState);
    }).catch((error) => console.warn("Could not load wallet:", error));
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [enabled]);
  return { ...state, ...actions };
}
