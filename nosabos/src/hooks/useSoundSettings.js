// src/hooks/useSoundSettings.js
import { create } from "zustand";

/**
 * Global sound settings store.
 * Manages sound enabled/disabled state and provides a playSound utility.
 */
const useSoundSettings = create((set, get) => ({
  soundEnabled: true, // Default to enabled

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  /**
   * Play a sound file if sounds are enabled.
   * @param {string} soundFile - The imported sound file (mp3, wav, etc.)
   * @returns {Promise<void>}
   */
  playSound: (soundFile) => {
    if (!get().soundEnabled) return Promise.resolve();
    const audio = new Audio(soundFile);
    return audio.play().catch(() => {
      // Ignore autoplay errors (e.g., if user hasn't interacted with page yet)
    });
  },
}));

export default useSoundSettings;
export { useSoundSettings };
