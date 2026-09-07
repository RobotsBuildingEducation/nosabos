import { create } from "zustand";

// Registration follows visible question footers, including kept-alive lessons.
const useQuestionActionStore = create((set) => ({
  activeIds: new Map(),
  menuSlot: null,
  ownerId: null,
  suppressed: false,
  setActive: (id, active, menuSlot = null, priority = 1) =>
    set((state) => {
      const existing = state.activeIds.get(id);
      if (
        active
          ? existing?.slot === menuSlot && existing?.priority === priority
          : !existing
      )
        return state;
      const activeIds = new Map(state.activeIds);
      if (active) activeIds.set(id, { slot: menuSlot, priority });
      else activeIds.delete(id);
      let ownerId = null;
      let owner = null;
      for (const [candidateId, candidate] of activeIds) {
        if (!owner || candidate.priority >= owner.priority) {
          ownerId = candidateId;
          owner = candidate;
        }
      }
      return {
        activeIds,
        ownerId,
        menuSlot: owner?.slot || null,
        suppressed: owner?.priority === 2,
      };
    }),
}));

export default useQuestionActionStore;
