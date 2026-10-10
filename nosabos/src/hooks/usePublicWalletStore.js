import { create } from "zustand";

// Bridge to the existing wallet store only when an account or wallet action
// needs it. Stable action references avoid re-running hydration effects.
let storePromise;
const actions = Object.fromEntries(["init", "initWallet", "createNewWallet", "initiateDeposit"].map(name => [name, async (...args) => {
  if (name === "init" && !localStorage.getItem("local_npub")) return false;
  storePromise ||= import("./useNostrWalletStore").then(({ default: store }) => {
    const sync = state => usePublicWalletStore.setState({ ...state, ...actions });
    sync(store.getState());
    store.subscribe(sync);
    return store;
  }).catch(error => { storePromise = null; throw error; });
  const store = await storePromise;
  return store.getState()[name](...args);
}]));

const usePublicWalletStore = create(() => ({ cashuWallet: null, walletBalance: 0, invoice: null, isCreatingWallet: false, ...actions }));
export default usePublicWalletStore;
