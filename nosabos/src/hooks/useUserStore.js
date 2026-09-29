// src/hooks/useUserStore.js
import { create } from "zustand";
import { withDevTestProgress } from "../utils/devTestAccount";

const useUserStore = create((set, get) => ({
  user: null,
  setUser: (userData) => set({
    user: withDevTestProgress(userData, typeof window !== "undefined" ? window.localStorage : null),
  }),
  patchUser: (patch) => set({
    user: withDevTestProgress(
      { ...(get().user || {}), ...patch },
      typeof window !== "undefined" ? window.localStorage : null,
    ),
  }),
}));

export default useUserStore; // default export
export { useUserStore }; // named export (so `import { useUserStore } ...` works too)
