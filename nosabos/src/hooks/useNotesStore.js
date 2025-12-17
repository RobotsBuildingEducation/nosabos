// src/hooks/useNotesStore.js
import { create } from "zustand";

// Note structure:
// {
//   id: string,
//   lessonTitle: { en: string, es: string },
//   cefrLevel: string (A1-C2),
//   example: string (in target language),
//   summary: string (in support language),
//   targetLang: string,
//   supportLang: string,
//   createdAt: number (timestamp),
//   moduleType: 'flashcard' | 'vocabulary' | 'grammar'
// }

const STORAGE_KEY = "nosabo_notes";

// Load notes from localStorage
const loadNotes = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save notes to localStorage
const saveNotes = (notes) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed to save notes:", e);
  }
};

const useNotesStore = create((set, get) => ({
  notes: loadNotes(),

  // Button states for action bar
  isLoading: false,
  isDone: false,

  // Add a new note
  addNote: (note) => {
    const newNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    const updated = [newNote, ...get().notes];
    saveNotes(updated);
    set({ notes: updated });
    return newNote;
  },

  // Remove a note by id
  removeNote: (id) => {
    const updated = get().notes.filter((n) => n.id !== id);
    saveNotes(updated);
    set({ notes: updated });
  },

  // Clear all notes
  clearNotes: () => {
    saveNotes([]);
    set({ notes: [] });
  },

  // Clear notes for a specific language only
  clearNotesForLanguage: (targetLang) => {
    const updated = get().notes.filter((n) => n.targetLang !== targetLang);
    saveNotes(updated);
    set({ notes: updated });
  },

  // Get notes filtered by language
  getNotesForLanguage: (targetLang) => {
    return get().notes.filter((n) => n.targetLang === targetLang);
  },

  // Set loading state (for border animation)
  setLoading: (loading) => set({ isLoading: loading }),

  // Set done state (for success border animation)
  setDone: (done) => set({ isDone: done }),

  // Trigger the done animation (automatically clears after 1.5s)
  triggerDoneAnimation: () => {
    set({ isLoading: false, isDone: true });
    setTimeout(() => {
      set({ isDone: false });
    }, 1500);
  },
}));

export default useNotesStore;
export { useNotesStore };
