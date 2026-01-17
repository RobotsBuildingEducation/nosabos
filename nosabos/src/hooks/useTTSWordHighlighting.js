// hooks/useTTSWordHighlighting.js
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Speech rate constants based on TTS analysis.
 * Average TTS speaking rate is ~12-15 characters per second.
 * We use ~65ms per character as baseline, adjusted per language.
 */
const CHARS_PER_MS_BY_LANG = {
  en: 0.016, // ~16 chars/sec, faster for English
  es: 0.014, // ~14 chars/sec
  pt: 0.014,
  fr: 0.013,
  it: 0.014,
  nl: 0.015,
  nah: 0.012, // slower for Nahuatl
  ru: 0.012,
  de: 0.013,
  el: 0.012,
  ja: 0.008, // Japanese is syllable-timed, slower
};

const DEFAULT_CHARS_PER_MS = 0.014;

/**
 * Splits text into words while preserving punctuation attached to words.
 * @param {string} text - The text to split
 * @returns {Array<{word: string, start: number, end: number}>} Words with their character positions
 */
function splitIntoWords(text) {
  if (!text) return [];

  const words = [];
  // Match words including attached punctuation
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return words;
}

/**
 * Calculates estimated timing for each word based on character count.
 * @param {Array<{word: string, start: number, end: number}>} words - Words array
 * @param {string} langCode - Language code for speech rate adjustment
 * @returns {Array<{word: string, startMs: number, endMs: number, charStart: number, charEnd: number}>}
 */
function calculateWordTimings(words, langCode = "es") {
  const charsPerMs = CHARS_PER_MS_BY_LANG[langCode] || DEFAULT_CHARS_PER_MS;

  let currentMs = 0;
  const timings = [];

  for (let i = 0; i < words.length; i++) {
    const { word, start, end } = words[i];
    // Duration based on word length (characters)
    const wordDurationMs = word.length / charsPerMs;

    // Add small pause between words (natural speech rhythm)
    const pauseMs = i > 0 ? 50 : 0;

    timings.push({
      word,
      startMs: currentMs + pauseMs,
      endMs: currentMs + pauseMs + wordDurationMs,
      charStart: start,
      charEnd: end,
      index: i,
    });

    currentMs += pauseMs + wordDurationMs;
  }

  return timings;
}

/**
 * Hook for TTS word highlighting that syncs with audio playback.
 *
 * @param {Object} options
 * @param {string} options.text - The text being spoken
 * @param {string} options.langCode - Language code (e.g., 'es', 'en')
 * @param {HTMLAudioElement|null} options.audioElement - The audio element to sync with
 * @param {boolean} options.isPlaying - Whether TTS is currently playing
 * @returns {Object} - { currentWordIndex, wordTimings, reset }
 */
export function useTTSWordHighlighting({
  text,
  langCode = "es",
  audioElement,
  isPlaying,
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const wordTimingsRef = useRef([]);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Calculate word timings when text changes
  useEffect(() => {
    if (!text) {
      wordTimingsRef.current = [];
      return;
    }

    const words = splitIntoWords(text);
    wordTimingsRef.current = calculateWordTimings(words, langCode);
  }, [text, langCode]);

  // Reset function
  const reset = useCallback(() => {
    setCurrentWordIndex(-1);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Animation loop to update current word based on elapsed time
  useEffect(() => {
    if (!isPlaying || !text) {
      reset();
      return;
    }

    // Start tracking time when playback begins
    startTimeRef.current = performance.now();
    setCurrentWordIndex(0);

    const updateHighlight = () => {
      if (!startTimeRef.current) return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const timings = wordTimingsRef.current;

      // Find current word based on elapsed time
      let newIndex = -1;
      for (let i = 0; i < timings.length; i++) {
        if (elapsedMs >= timings[i].startMs && elapsedMs < timings[i].endMs) {
          newIndex = i;
          break;
        }
        // If we're past this word, keep it as fallback
        if (elapsedMs >= timings[i].startMs) {
          newIndex = i;
        }
      }

      setCurrentWordIndex(newIndex);

      // Continue animation if still playing and not past all words
      if (
        isPlaying &&
        timings.length > 0 &&
        elapsedMs < timings[timings.length - 1].endMs + 500
      ) {
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateHighlight);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, text, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    currentWordIndex,
    wordTimings: wordTimingsRef.current,
    reset,
    totalWords: wordTimingsRef.current.length,
  };
}

/**
 * Renders text with the specified word highlighted.
 * @param {string} text - Full text
 * @param {number} highlightIndex - Index of word to highlight (-1 for none)
 * @param {string} highlightColor - CSS color for highlight
 * @returns {Array<React.ReactNode>} Array of text nodes with highlight spans
 */
export function getHighlightedTextParts(
  text,
  highlightIndex,
  highlightColor = "rgba(56, 178, 172, 0.4)"
) {
  if (!text || highlightIndex < 0) {
    return [{ type: "text", content: text || "", isHighlighted: false }];
  }

  const words = splitIntoWords(text);
  if (highlightIndex >= words.length) {
    return [{ type: "text", content: text, isHighlighted: false }];
  }

  const parts = [];
  let lastEnd = 0;

  words.forEach((wordInfo, idx) => {
    // Add text before this word
    if (wordInfo.start > lastEnd) {
      parts.push({
        type: "text",
        content: text.slice(lastEnd, wordInfo.start),
        isHighlighted: false,
      });
    }

    // Add the word (highlighted or not)
    parts.push({
      type: "word",
      content: wordInfo.word,
      isHighlighted: idx === highlightIndex,
      index: idx,
    });

    lastEnd = wordInfo.end;
  });

  // Add remaining text after last word
  if (lastEnd < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastEnd),
      isHighlighted: false,
    });
  }

  return parts;
}

export default useTTSWordHighlighting;
