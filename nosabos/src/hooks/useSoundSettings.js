// src/hooks/useSoundSettings.js
import { create } from "zustand";

// Singleton AudioContext for Web Audio API (required for mobile volume control)
let audioContext = null;
let gainNode = null;

/**
 * Get or create the AudioContext and GainNode.
 * Uses Web Audio API because HTMLAudioElement.volume is read-only on iOS Safari
 * and some other mobile browsers.
 */
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
  }
  return { audioContext, gainNode };
};

/**
 * Global sound settings store.
 * Manages sound enabled/disabled state, volume level, and provides a playSound utility.
 */
const useSoundSettings = create((set, get) => ({
  soundEnabled: true, // Default to enabled
  volume: 40, // Volume level 0-100, default to 40%

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    // Update the GainNode if it exists
    if (gainNode) {
      gainNode.gain.value = clampedVolume / 100;
    }
    set({ volume: clampedVolume });
  },

  /**
   * Play a sound file if sounds are enabled.
   * Uses Web Audio API for cross-platform volume control (including mobile).
   * @param {string} soundFile - The imported sound file (mp3, wav, etc.)
   * @returns {Promise<void>}
   */
  playSound: async (soundFile) => {
    if (!get().soundEnabled) return;

    try {
      const { audioContext, gainNode } = getAudioContext();

      // Resume AudioContext if suspended (required after user interaction on mobile)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Set the current volume on the gain node
      gainNode.gain.value = get().volume / 100;

      // Fetch and decode the audio file
      const response = await fetch(soundFile);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create a buffer source and connect through the gain node
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      source.start(0);
    } catch (error) {
      // Ignore errors (e.g., autoplay restrictions, network issues)
    }
  },
}));

export default useSoundSettings;
export { useSoundSettings };
