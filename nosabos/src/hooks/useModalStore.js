// src/hooks/useModalStore.js
//
// Modal/drawer visibility store for the 5 modals whose open path was perceived
// as laggy because they lived inside very large parent components:
//
//   1. DailyGoalModal           — was App.jsx useState
//   2. SessionTimerModal        — was App.jsx useState
//   3. LessonDetailModal        — was SkillTree.jsx useState + useDisclosure
//   4. FlashcardPractice modal  — was FlashcardSkillTree.jsx useState
//   5. ConversationSettingsDrawer — was Conversations.jsx useDisclosure
//
// Each modal's isOpen flag (plus any payload it needs, e.g. the selected
// lesson) lives here so the trigger button and the modal can talk directly
// through the store. The big parent components no longer subscribe to the
// flag, so a tap to open a modal does NOT re-execute thousands of lines of
// parent JSX before the modal can render.

import { create } from "zustand";

const useModalStore = create((set) => ({
  // ── Session timer ─────────────────────────────────────────────────────────
  timerModalOpen: false,
  openTimerModal: () => set({ timerModalOpen: true }),
  closeTimerModal: () => set({ timerModalOpen: false }),

  // ── Daily goal ────────────────────────────────────────────────────────────
  dailyGoalOpen: false,
  openDailyGoal: () => set({ dailyGoalOpen: true }),
  closeDailyGoal: () => set({ dailyGoalOpen: false }),

  // ── Skill-tree lesson detail ──────────────────────────────────────────────
  // Carries lesson + unit payload alongside isOpen so the trigger click and
  // the modal don't both need to round-trip through SkillTree state.
  lessonDetailOpen: false,
  selectedLesson: null,
  selectedUnit: null,
  openLessonDetail: (lesson, unit) =>
    set({
      lessonDetailOpen: true,
      selectedLesson: lesson,
      selectedUnit: unit,
    }),
  closeLessonDetail: () => set({ lessonDetailOpen: false }),

  // ── Flashcard practice ────────────────────────────────────────────────────
  flashcardPracticeOpen: false,
  practiceCard: null,
  isReviewSession: false,
  openFlashcardPractice: (card, isReview = false) =>
    set({
      flashcardPracticeOpen: true,
      practiceCard: card,
      isReviewSession: !!isReview,
    }),
  closeFlashcardPractice: () =>
    set({
      flashcardPracticeOpen: false,
      practiceCard: null,
      isReviewSession: false,
    }),

  // ── Conversation settings drawer ──────────────────────────────────────────
  conversationSettingsOpen: false,
  openConversationSettings: () => set({ conversationSettingsOpen: true }),
  closeConversationSettings: () => set({ conversationSettingsOpen: false }),
}));

export default useModalStore;
export { useModalStore };
