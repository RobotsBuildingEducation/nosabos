// src/hooks/useSoundSettings.js
import { create } from "zustand";
import { triggerHaptic } from "tactus";
import { soundManager } from "../utils/SoundManager";

// Module-level promise to track initialization across all callers
let initPromise = null;
export const DEFAULT_TUTOR_VOLUME = 1.0;

/**
 * Global sound settings store.
 * Uses Tone.js to synthesize sound effects without audio assets.
 */
const useSoundSettings = create((set, get) => ({
  soundEnabled: true,
  volume: 100, // Volume level 0-100; default 100% (sound effects are an on/off switch)
  // Tutor (Gemini Live) playback gain multiplier, 0-4 (1 = unchanged). Applied
  // directly by the Tutor bridge via setOutputGain.
  tutorVolume: DEFAULT_TUTOR_VOLUME,
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

  setTutorVolume: (value) => {
    const clamped = Math.max(0, Math.min(4, Math.round(Number(value) * 10) / 10));
    set({ tutorVolume: clamped });
  },

  /**
   * Initialize the audio system. Must be called from a user gesture (click/tap).
   * This is required due to browser autoplay policies.
   * Uses a shared promise to prevent race conditions when multiple calls happen
   * simultaneously (e.g., warmupAudio + playSound on first click).
   */
  initAudio: async () => {
    // Already initialized
    if (get().isInitialized) return true;

    // If initialization is in progress, wait for it
    if (initPromise) {
      return initPromise;
    }

    // Start initialization and store the promise
    initPromise = (async () => {
      try {
        await soundManager.init();
        // Sync current settings with soundManager
        soundManager.setEnabled(get().soundEnabled);
        soundManager.setVolume(get().volume / 100);
        set({ isInitialized: true });
        return true;
      } catch (err) {
        console.error("[useSoundSettings] Failed to initialize audio:", err);
        initPromise = null; // Allow retry on failure
        return false;
      }
    })();

    return initPromise;
  },

  /**
   * Warm up the audio system on first user interaction.
   * Call this on a user gesture (click, touch) to initialize Tone.js.
   */
  warmupAudio: async () => {
    const state = get();
    if (!state.isInitialized) {
      const ready = await state.initAudio();
      if (!ready) return false;
    }
    return soundManager.ensureContextRunning();
  },

  /**
   * Play a synthesized sound by name.
   *
   * @param {string} soundName - A SoundManager sound name
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

    // Try to ensure context is running, but still attempt to play even if
    // resume fails — on mobile the context may resume mid-gesture and the
    // sound can still fire.  Haptic feedback should always trigger.
    await soundManager.ensureContextRunning();

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
