// src/hooks/useSoundSettings.js
import { create } from "zustand";
import * as Tone from "tone";
import { soundManager } from "../utils/SoundManager";

// Legacy MP3 imports - kept for backward compatibility with existing import statements
// These are now just string identifiers that map to Tone.js sounds
import clickSound from "../assets/click.mp3";
import selectSound from "../assets/select.mp3";
import submitSound from "../assets/submit.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import completeSound from "../assets/complete.mp3";
import deliciousSound from "../assets/delicious.mp3";
import sparkleSound from "../assets/sparkle.mp3";
import modeSwitcherSound from "../assets/modeswitcher.mp3";
import dailyGoalSound from "../assets/dailygoal.mp3";

// Map legacy MP3 file paths to new Tone.js sound names
// Special value "randomChord" triggers playRandomChord instead of play()
const SOUND_MAP = new Map([
  [clickSound, "incorrect"], // click.mp3 was used for incorrect answers
  [selectSound, "select"],
  [submitSound, "submit"],
  [submitActionSound, "submitAction"],
  [nextButtonSound, "next"],
  [completeSound, "correct"], // complete.mp3 -> correct (was unused, but map it anyway)
  [deliciousSound, "correct"],
  [sparkleSound, "sparkle"],
  [modeSwitcherSound, "randomChord"], // Play random chord when switching modes
  [dailyGoalSound, "dailyGoal"],
]);

// Set of valid MP3 file paths for HTML5 Audio fallback
const MP3_FILES = new Set([
  clickSound,
  selectSound,
  submitSound,
  submitActionSound,
  nextButtonSound,
  completeSound,
  deliciousSound,
  sparkleSound,
  modeSwitcherSound,
  dailyGoalSound,
]);

/**
 * Play sound using HTML5 Audio API as fallback
 * This tends to work better on some mobile browsers than WebAudio/Tone.js
 */
const playMP3Fallback = (mp3Path, volume) => {
  try {
    const audio = new Audio(mp3Path);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {
      // Silently fail - user hasn't interacted yet or audio not allowed
    });
  } catch {
    // Silently fail
  }
};

/**
 * Global sound settings store.
 * Now uses Tone.js synthesized sounds instead of MP3 files.
 * Maintains backward compatibility with existing playSound(soundFile) calls.
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
      console.log("[useSoundSettings] Audio initialized successfully");
      return true;
    } catch (err) {
      console.error("[useSoundSettings] Failed to initialize audio:", err);
      return false;
    }
  },

  /**
   * Warm up the audio system on first user interaction.
   * Call this SYNCHRONOUSLY from a user gesture - do NOT await this function.
   * The init will happen in background after Tone.start() is called.
   */
  warmupAudio: () => {
    const state = get();
    if (!state.isInitialized) {
      // Don't await - just kick off the init process
      // Tone.start() should already be called by App.jsx in the same gesture
      state.initAudio().catch((err) => {
        console.error("[useSoundSettings] warmupAudio failed:", err);
      });
    }
  },

  /**
   * Play a sound. Accepts either:
   * - Legacy MP3 file path (from imports) - automatically mapped to Tone.js sound
   * - Direct sound name string (e.g., "select", "correct", "submitAction")
   *
   * @param {string} soundFileOrName - The imported sound file or direct sound name
   * @returns {Promise<void>}
   */
  playSound: async (soundFileOrName) => {
    const state = get();
    if (!state.soundEnabled) return;

    // Check if this is an MP3 file path that we can use as fallback
    const isMP3File = MP3_FILES.has(soundFileOrName);

    // Check if Tone.js audio context is ready
    const toneReady = Tone.context.state === "running";

    // If Tone.js isn't ready and we have an MP3 file, use HTML5 Audio fallback
    // This is more reliable on mobile browsers that haven't initialized WebAudio yet
    if (!toneReady && isMP3File) {
      playMP3Fallback(soundFileOrName, state.volume / 100);
      // Also try to initialize Tone.js for future sounds (without blocking)
      if (!state.isInitialized) {
        state.initAudio().catch(() => {});
      }
      return;
    }

    // Try to resume suspended context (happens after tab switching on mobile)
    if (Tone.context.state === "suspended") {
      try {
        await Tone.context.resume();
      } catch {
        // If resume fails and we have MP3, use fallback
        if (isMP3File) {
          playMP3Fallback(soundFileOrName, state.volume / 100);
          return;
        }
      }
    }

    // Auto-initialize on first sound play attempt (user gesture)
    if (!state.isInitialized) {
      const success = await state.initAudio();
      if (!success) {
        // Fallback to MP3 if Tone.js init failed
        if (isMP3File) {
          playMP3Fallback(soundFileOrName, state.volume / 100);
        }
        return;
      }
    }

    // Map legacy MP3 path to Tone.js sound name, or use direct name
    const soundName = SOUND_MAP.get(soundFileOrName) || soundFileOrName;

    // Special handling for random chord
    if (soundName === "randomChord") {
      soundManager.playRandomChord();
    } else {
      soundManager.play(soundName);
    }
  },

  /**
   * Play a sound by direct name (for new code that doesn't use MP3 imports)
   */
  playSoundByName: (name) => {
    const state = get();
    if (!state.soundEnabled || !state.isInitialized) return;
    soundManager.play(name);
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
  },

  /**
   * Check if audio is ready
   */
  isReady: () => get().isInitialized && soundManager.isReady(),
}));

export default useSoundSettings;
export { useSoundSettings };
