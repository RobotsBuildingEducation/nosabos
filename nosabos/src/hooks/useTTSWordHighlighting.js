// hooks/useTTSWordHighlighting.js
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Speech rate constants - milliseconds per character.
 * Calibrated for OpenAI Realtime TTS voices.
 * Based on ~70ms per character estimate from tts.js
 */
const MS_PER_CHAR_BY_LANG = {
  en: 58,  // English is faster
  es: 65,  // Spanish
  pt: 65,  // Portuguese
  fr: 68,  // French slightly slower
  it: 63,  // Italian
  nl: 60,  // Dutch
  nah: 72, // Nahuatl (uses Spanish voice, slower)
  ru: 68,  // Russian
  de: 63,  // German
  el: 70,  // Greek
  ja: 95,  // Japanese is syllable-timed, much slower
};

const DEFAULT_MS_PER_CHAR = 65;

// Pause between words in milliseconds
const WORD_PAUSE_MS = 40;

/**
 * Splits text into words while preserving punctuation attached to words.
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
 */
function calculateWordTimings(words, langCode = "es") {
  const msPerChar = MS_PER_CHAR_BY_LANG[langCode] || DEFAULT_MS_PER_CHAR;

  let currentMs = 0;
  const timings = [];

  for (let i = 0; i < words.length; i++) {
    const { word, start, end } = words[i];

    // Duration based on word length
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
 * Hook for TTS word highlighting.
 * Starts timing when isPlaying becomes true.
 */
export function useTTSWordHighlighting({
  text,
  langCode = "es",
  isPlaying,
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const wordTimingsRef = useRef([]);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const wasPlayingRef = useRef(false);

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
    wasPlayingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Main effect - start/stop highlighting based on isPlaying
  useEffect(() => {
    // If not playing, reset everything
    if (!isPlaying) {
      if (wasPlayingRef.current) {
        reset();
      }
      return;
    }

    // Starting to play
    if (!wasPlayingRef.current && isPlaying) {
      wasPlayingRef.current = true;
      startTimeRef.current = performance.now();
      setCurrentWordIndex(0);
    }

    const timings = wordTimingsRef.current;
    if (!timings.length) return;

    const updateHighlight = () => {
      if (!startTimeRef.current || !isPlaying) return;

      const elapsedMs = performance.now() - startTimeRef.current;

      // Find current word based on elapsed time
      let newIndex = -1;
      for (let i = 0; i < timings.length; i++) {
        if (elapsedMs >= timings[i].startMs && elapsedMs < timings[i].endMs) {
          newIndex = i;
          break;
        }
        if (elapsedMs >= timings[i].startMs) {
          newIndex = i;
        }
      }

      setCurrentWordIndex(newIndex);

      // Continue animation if not past all words
      const lastWordEnd = timings[timings.length - 1]?.endMs || 0;
      if (elapsedMs < lastWordEnd + 2000) {
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateHighlight);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
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
  };
}

/**
 * Renders text with the specified word highlighted.
 */
export function getHighlightedTextParts(text, highlightIndex) {
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
    if (wordInfo.start > lastEnd) {
      parts.push({
        type: "text",
        content: text.slice(lastEnd, wordInfo.start),
        isHighlighted: false,
      });
    }

    parts.push({
      type: "word",
      content: wordInfo.word,
      isHighlighted: idx === highlightIndex,
      index: idx,
    });

    lastEnd = wordInfo.end;
  });

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
