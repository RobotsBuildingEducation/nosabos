// src/hooks/useRepairFocusStore.js
//
// The active "repair focus" — the bridge that turns the Daily Quest repair task
// into the right *kind* of practice. When the user taps Repair, App routing
// reads the blueprint's recommendedMode, and for live-engine modes
// (phonics/conversation/tutor) it stashes the repair plan here and routes the
// user to that surface. The routed engine reads this focus to (a) show a
// "repair focus" banner, (b) deep-seed itself with the weak concept, and
// (c) mark the repair complete + reinforce the notes once practiced.
//
// Recall-type repairs (review/grammar/listening) skip this and use the quick
// CompanionRepairModal instead — a flashcard is the right tool for those.
import { create } from "zustand";

const useRepairFocusStore = create((set) => ({
  // null when no repair is in flight, else:
  // { plan, mode, surface, targetLang, supportLang, npub }
  //   plan      — the stored repair plan (items, memoryIds, target, recommendedMode)
  //   mode      — the resolved recommendedMode (phonics|conversation|speak|…)
  //   surface   — the pathMode it routed to (alphabet|conversations|tutor)
  focus: null,

  setFocus: (focus) => set({ focus }),
  clearFocus: () => set({ focus: null }),
}));

export default useRepairFocusStore;
export { useRepairFocusStore };
