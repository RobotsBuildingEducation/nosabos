// src/hooks/useSoundSettings.js
import { create } from "zustand";
import { triggerHaptic } from "tactus";
import { soundManager } from "../utils/SoundManager";

// Sound name constants for use throughout the app
// These map to Tone.js synthesized sounds in SoundManager
export const SOUNDS = {
  CLICK: "incorrect",
  SELECT: "select",
  SUBMIT: "submit",
  SUBMIT_ACTION: "submitAction",
  NEXT: "next",
  COMPLETE: "correct",
  DELICIOUS: "correct",
  SPARKLE: "sparkle",
  MODE_SWITCH: "randomChord",
  DAILY_GOAL: "dailyGoal",
};

/**
 * Global sound settings store.
 * Uses Tone.js synthesized sounds for all audio.
 * Import SOUNDS constant for available sound names.
 */
const useSoundSettings = create((set, get) => ({
  soundEnabled: true,
  volume: 40, // Volume level 0-100, default to 40%
  isInitialized: false,

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    soundManager.setEnabled(enabled);
  },

  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    set({ volume: clampedVolume });
    soundManager.setVolume(clampedVolume / 100);
  },

  /**
   * Initialize the audio system. Must be called from a user gesture (click/tap).
   * This is required due to browser autoplay policies.
   */
  initAudio: async () => {
    if (get().isInitialized) return true;
    try {
      await soundManager.init();
      // Sync current settings with soundManager
      soundManager.setEnabled(get().soundEnabled);
      soundManager.setVolume(get().volume / 100);
      set({ isInitialized: true });
      return true;
    } catch (err) {
      console.error("[useSoundSettings] Failed to initialize audio:", err);
      return false;
    }
  },

  /**
   * Warm up the audio system on first user interaction.
   * Call this on a user gesture (click, touch) to initialize Tone.js.
   */
  warmupAudio: async () => {
    const state = get();
    if (!state.isInitialized) {
      await state.initAudio();
    }
  },

  /**
   * Play a sound by name.
   *
   * @param {string} soundName - The sound name (e.g., "select", "correct", "submitAction")
   * @returns {Promise<void>}
   */
  playSound: async (soundName) => {
    const state = get();
    if (!state.soundEnabled) return;

    // Auto-initialize on first sound play attempt (user gesture)
    if (!state.isInitialized) {
      const success = await state.initAudio();
      if (!success) return;
    }

    // Special handling for random chord
    if (soundName === "randomChord") {
      soundManager.playRandomChord();
    } else {
      soundManager.play(soundName);
    }

    // Trigger haptic feedback alongside the sound
    triggerHaptic();
  },

  /**
   * Play a sound by direct name (for new code that doesn't use MP3 imports)
   */
  playSoundByName: (name) => {
    const state = get();
    if (!state.soundEnabled || !state.isInitialized) return;
    soundManager.play(name);
    triggerHaptic();
  },

  /**
   * Play slider tick sound with pitch based on value
   */
  playSliderTick: async (value, min = 0, max = 100) => {
    const state = get();
    if (!state.soundEnabled) return;

    // Auto-initialize on first play attempt (user gesture from slider interaction)
    if (!state.isInitialized) {
      const success = await state.initAudio();
      if (!success) return;
    }

    soundManager.playSliderTick(value, min, max);
    triggerHaptic();
  },

  /**
   * Play a random chord (for mode switching)
   */
  playRandomChord: async () => {
    const state = get();
    if (!state.soundEnabled) return;

    // Auto-initialize on first play attempt
    if (!state.isInitialized) {
      const success = await state.initAudio();
      if (!success) return;
    }

    soundManager.playRandomChord();
    triggerHaptic();
  },

  /**
   * Check if audio is ready
   */
  isReady: () => get().isInitialized && soundManager.isReady(),
}));

export default useSoundSettings;
export { useSoundSettings };
