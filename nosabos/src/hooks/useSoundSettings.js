// src/hooks/useSoundSettings.js
import { create } from "zustand";

// Import all sound assets for preloading
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

// Audio cache for preloaded sounds
const audioCache = new Map();

// List of all sounds to preload
const allSounds = [
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
];

// Preload a single audio file into the cache
const preloadAudio = (soundFile) => {
  if (audioCache.has(soundFile)) return;
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = soundFile;
  // Load the audio data
  audio.load();
  audioCache.set(soundFile, audio);
};

// Preload all sounds on module initialization
allSounds.forEach(preloadAudio);

// Track if audio has been "unlocked" on mobile
let audioUnlocked = false;

// Shared AudioContext for Web Audio API (more reliable on mobile)
let audioContext = null;

/**
 * Get or create a shared AudioContext
 */
const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext;
};

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
   * Warm up the audio system on first user interaction.
   * Call this on a user gesture (click, touch) to eliminate mobile audio delay.
   * Uses Web Audio API (AudioContext) for more reliable mobile unlock.
   */
  warmupAudio: () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // Method 1: Unlock Web Audio API context (most reliable for mobile)
    const ctx = getAudioContext();
    if (ctx) {
      // Resume the context if it's suspended (required on iOS Safari)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // Play a tiny silent buffer to fully unlock audio
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {
        // Fallback if buffer creation fails
      }
    }

    // Method 2: Also "touch" the HTML5 Audio elements to preload them
    // Play each cached audio very briefly at volume 0 to ensure they're ready
    for (const cachedAudio of audioCache.values()) {
      const clone = cachedAudio.cloneNode();
      clone.volume = 0;
      clone.play().then(() => {
        // Immediately pause after starting to just "unlock" without playing
        clone.pause();
        clone.currentTime = 0;
      }).catch(() => {});
    }
  },

  /**
   * Play a sound file if sounds are enabled.
   * Uses preloaded/cached audio for instant playback on mobile.
   * @param {string} soundFile - The imported sound file (mp3, wav, etc.)
   * @returns {Promise<void>}
   */
  playSound: (soundFile) => {
    if (!get().soundEnabled) return Promise.resolve();

    // Ensure audio is preloaded
    if (!audioCache.has(soundFile)) {
      preloadAudio(soundFile);
    }

    const cachedAudio = audioCache.get(soundFile);
    if (cachedAudio) {
      // Clone the cached audio for concurrent playback support
      const audio = cachedAudio.cloneNode();
      audio.volume = get().volume / 100;
      return audio.play().catch(() => {});
    }

    // Fallback to creating new audio (shouldn't happen with preloading)
    const audio = new Audio(soundFile);
    audio.volume = get().volume / 100;
    return audio.play().catch(() => {});
  },
}));

export default useSoundSettings;
export { useSoundSettings };
