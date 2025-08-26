// src/hooks/useUserStore.js
import { create } from "zustand";

const useUserStore = create((set, get) => ({
  user: null,
  setUser: (userData) => set({ user: userData }),
  patchUser: (patch) => set({ user: { ...(get().user || {}), ...patch } }),
}));

export default useUserStore; // default export
export { useUserStore }; // named export (so `import { useUserStore } ...` works too)
