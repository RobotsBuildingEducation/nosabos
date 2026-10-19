import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const EMPTY = { cashuWallet: null, walletBalance: 0, invoice: null, isCreatingWallet: false };
const emptySnapshot = () => EMPTY;
const emptySubscribe = () => () => {};
let pending;
const loadWallet = () => pending ||= import("../../hooks/useNostrWalletStore.js").catch((error) => {
  pending = null;
  throw error;
});

export function usePublicWallet() {
  const [store, setStore] = useState(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const ready = useCallback(async () => {
    const { default: wallet } = await loadWallet();
    if (mounted.current) setStore(() => wallet);
    return wallet;
  }, []);
  const state = useSyncExternalStore(store?.subscribe || emptySubscribe, store?.getState || emptySnapshot, emptySnapshot);
  const actions = useMemo(() => Object.fromEntries(["createNewWallet", "initiateDeposit", "init", "initWallet"].map((name) => [name,
    async (...args) => (await ready()).getState()[name](...args),
  ])), [ready]);
  return { ...state, ...actions };
}
