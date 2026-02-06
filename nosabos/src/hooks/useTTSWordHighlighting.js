// hooks/useTTSWordHighlighting.js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Splits text into words (non-whitespace sequences).
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
 * Milliseconds per character for different languages.
 * Based on typical TTS speaking rates (~150-180 words per minute).
 */
const MS_PER_CHAR = {
  en: 55,
  es: 62,
  pt: 62,
  fr: 65,
  it: 60,
  nl: 58,
  nah: 70,
  ru: 65,
  de: 60,
  el: 68,
  ja: 90,
};
const DEFAULT_MS_PER_CHAR = 62;

// Delay before starting highlighting to account for audio buffer startup
const AUDIO_STARTUP_DELAY_MS = 300;

/**
 * Hook for TTS word highlighting that paces highlighting based on word durations.
 *
 * The transcript from the API arrives ahead of the audio, so we can't use it directly.
 * Instead, we use the transcript to know the total words, then pace through them
 * based on estimated word durations once audio starts playing.
 */
export function useTTSWordHighlighting({
  text,
  spokenTranscript = "",
  isPlaying,
  langCode = "es",
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const wordTimingsRef = useRef([]);

  // Parse the original text into words with timing estimates
  const originalWords = useMemo(() => {
    const words = splitIntoWords(text);
    const msPerChar = MS_PER_CHAR[langCode] || DEFAULT_MS_PER_CHAR;

    let currentMs = 0;
    return words.map((w, i) => {
      const duration = w.word.length * msPerChar;
      const pause = i > 0 ? 35 : 0; // Small pause between words
      const startMs = currentMs + pause;
      const endMs = startMs + duration;
      currentMs = endMs;
      return { ...w, startMs, endMs, index: i };
    });
  }, [text, langCode]);

  // Store word timings in ref for animation callback
  useEffect(() => {
    wordTimingsRef.current = originalWords;
  }, [originalWords]);

  // Reset function
  const reset = useCallback(() => {
    setCurrentWordIndex(-1);
    startTimeRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Main animation loop - paces through words based on timing
  useEffect(() => {
    if (!isPlaying || !text || originalWords.length === 0) {
      if (!isPlaying) {
        reset();
      }
      return;
    }

    // Start timing when playback begins
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
      setCurrentWordIndex(0);
    }

    const animate = () => {
      if (!startTimeRef.current) return;

      // Subtract startup delay - audio takes time to actually start producing sound
      const rawElapsed = performance.now() - startTimeRef.current;
      const elapsed = rawElapsed - AUDIO_STARTUP_DELAY_MS;
      const timings = wordTimingsRef.current;

      // Before startup delay completes, stay on first word
      if (elapsed < 0) {
        setCurrentWordIndex(0);
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Find the word that should be highlighted at this time
      let newIndex = 0;
      for (let i = 0; i < timings.length; i++) {
        if (elapsed >= timings[i].startMs) {
          newIndex = i;
        } else {
          break;
        }
      }

      setCurrentWordIndex(newIndex);

      // Continue animating if we haven't reached the end
      const lastWord = timings[timings.length - 1];
      if (lastWord && elapsed < lastWord.endMs + 1000) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, text, originalWords.length, reset]);

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
    reset,
    totalWords: originalWords.length,
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
