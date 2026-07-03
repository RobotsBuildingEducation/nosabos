// src/hooks/useRepairFocusStore.js
//
// The active "repair focus" — the bridge that turns the current Daily Quest
// repair STEP into the right *kind* of practice. When the user taps Repair,
// App routing resolves the next step (getNextRepairStep) and, for live-engine
// modes (phonics/tutor), stashes that step's mini-plan here and routes the
// user to that surface. The routed engine reads this focus to (a) show a
// "repair focus" banner, (b) deep-seed itself with the weak concept, and
// (c) mark the step complete + reinforce its note once practiced.
//
// flashcards/lesson steps run as ephemeral lessons instead (surface:
// "lesson"); conversation is deliberately not a repair surface.
import { create } from "zustand";

const useRepairFocusStore = create((set) => ({
  // null when no repair step is in flight, else:
  // { plan, mode, surface, stepIndex, stepCount, targetLang, supportLang, npub }
  //   plan      — the step's mini-plan (one item, target 1 — stored-plan shape)
  //   mode      — the step's mode (tutor|phonics|flashcards|lesson)
  //   surface   — the pathMode it routed to (alphabet|tutor|lesson)
  focus: null,

  setFocus: (focus) => set({ focus }),
  clearFocus: () => set({ focus: null }),
}));

export default useRepairFocusStore;
export { useRepairFocusStore };
