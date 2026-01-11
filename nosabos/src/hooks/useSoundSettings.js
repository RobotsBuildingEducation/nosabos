// src/hooks/useSoundSettings.js
import { create } from "zustand";

/**
 * Global sound settings store.
 * Manages sound enabled/disabled state, volume level, and provides a playSound utility.
 */
const useSoundSettings = create((set, get) => ({
  soundEnabled: true, // Default to enabled
  volume: 40, // Volume level 0-100, default to 40%

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),

  /**
   * Play a sound file if sounds are enabled.
   * @param {string} soundFile - The imported sound file (mp3, wav, etc.)
   * @returns {Promise<void>}
   */
  playSound: (soundFile) => {
    if (!get().soundEnabled) return Promise.resolve();
    const audio = new Audio(soundFile);
    audio.volume = get().volume / 100; // Convert 0-100 to 0-1 for Audio API
    return audio.play().catch(() => {
      // Ignore autoplay errors (e.g., if user hasn't interacted with page yet)
    });
  },
}));

export default useSoundSettings;
export { useSoundSettings };
