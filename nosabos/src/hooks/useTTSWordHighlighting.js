// hooks/useTTSWordHighlighting.js
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Speech rate constants - milliseconds per character.
 * These are calibrated based on OpenAI Realtime TTS voices.
 * The realtime API speaks at roughly 150-180 words per minute,
 * which translates to about 55-70ms per character depending on language.
 */
const MS_PER_CHAR_BY_LANG = {
  en: 55,  // English is faster
  es: 62,  // Spanish
  pt: 62,  // Portuguese
  fr: 65,  // French slightly slower
  it: 60,  // Italian
  nl: 58,  // Dutch
  nah: 70, // Nahuatl (uses Spanish voice, slower)
  ru: 65,  // Russian
  de: 60,  // German
  el: 68,  // Greek
  ja: 90,  // Japanese is syllable-timed, much slower
};

const DEFAULT_MS_PER_CHAR = 62;

// Pause between words in milliseconds
const WORD_PAUSE_MS = 30;

/**
 * Splits text into words while preserving punctuation attached to words.
 * @param {string} text - The text to split
 * @returns {Array<{word: string, start: number, end: number}>} Words with their character positions
 */
function splitIntoWords(text) {
  if (!text) return [];

  const words = [];
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
 * @returns {Array<{word: string, startMs: number, endMs: number, charStart: number, charEnd: number, index: number}>}
 */
function calculateWordTimings(words, langCode = "es") {
  const msPerChar = MS_PER_CHAR_BY_LANG[langCode] || DEFAULT_MS_PER_CHAR;

  let currentMs = 0;
  const timings = [];

  for (let i = 0; i < words.length; i++) {
    const { word, start, end } = words[i];

    // Duration based on word length (characters)
    const wordDurationMs = word.length * msPerChar;

    // Add pause between words
    const pauseMs = i > 0 ? WORD_PAUSE_MS : 0;

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
 * Listens to the audio element's 'playing' event to start timing accurately.
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
  const [audioStarted, setAudioStarted] = useState(false);
  const wordTimingsRef = useRef([]);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioElementRef = useRef(null);

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
    setAudioStarted(false);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Listen to audio element events
  useEffect(() => {
    if (!isPlaying || !audioElement) {
      return;
    }

    // Store ref to current audio element
    audioElementRef.current = audioElement;

    const handlePlaying = () => {
      // Audio has actually started playing - start our timer now
      startTimeRef.current = performance.now();
      setAudioStarted(true);
      setCurrentWordIndex(0);
    };

    const handleEnded = () => {
      reset();
    };

    const handlePause = () => {
      // Keep current position but stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // If audio is already playing, start immediately
    if (!audioElement.paused && audioElement.currentTime > 0) {
      handlePlaying();
    }

    audioElement.addEventListener("playing", handlePlaying);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("playing", handlePlaying);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [isPlaying, audioElement, reset]);

  // Animation loop to update current word based on elapsed time
  useEffect(() => {
    if (!audioStarted || !text || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateHighlight = () => {
      if (!startTimeRef.current || !isPlaying) return;

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
      const lastWordEnd = timings.length > 0 ? timings[timings.length - 1].endMs : 0;
      if (isPlaying && elapsedMs < lastWordEnd + 1000) {
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateHighlight);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioStarted, text, isPlaying]);

  // Reset when isPlaying becomes false
  useEffect(() => {
    if (!isPlaying) {
      reset();
    }
  }, [isPlaying, reset]);

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
    audioStarted,
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
