import { create } from "zustand";

// Transient routing state only. The blueprint and modality progress are
// durable in the user document; persisting this focus would reopen the app in
// the middle of a Goal without the Today’s Focus context.
const useGoalFocusStore = create((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
  clearFocus: () => set({ focus: null }),
}));
export default useGoalFocusStore;
