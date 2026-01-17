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
 * Count words in text (simple whitespace split).
 */
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Normalize text for comparison - lowercase, remove punctuation, collapse spaces.
 */
function normalizeForMatch(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Hook for TTS word highlighting based on real-time transcript from TTS API.
 *
 * @param {Object} options
 * @param {string} options.text - The original text being displayed
 * @param {string} options.spokenTranscript - The transcript received from TTS (updates as words are spoken)
 * @param {boolean} options.isPlaying - Whether TTS is currently playing
 * @returns {Object} - { currentWordIndex, reset }
 */
export function useTTSWordHighlighting({
  text,
  spokenTranscript = "",
  isPlaying,
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  // Parse the original text into words
  const originalWords = useMemo(() => splitIntoWords(text), [text]);

  // Reset function
  const reset = useCallback(() => {
    setCurrentWordIndex(-1);
  }, []);

  // Update highlighting based on spoken transcript
  useEffect(() => {
    if (!isPlaying || !text) {
      return;
    }

    if (!spokenTranscript) {
      setCurrentWordIndex(0);
      return;
    }

    // Count how many words have been spoken
    const spokenWordCount = countWords(spokenTranscript);

    // The current word being spoken is at index (spokenWordCount - 1)
    // But we want to highlight the word currently being said, so use spokenWordCount - 1
    // If the transcript has 3 words, we're on word index 2 (0-indexed)
    const targetIndex = Math.max(0, spokenWordCount - 1);

    // Make sure we don't exceed the original text's word count
    const safeIndex = Math.min(targetIndex, originalWords.length - 1);

    setCurrentWordIndex(safeIndex);
  }, [spokenTranscript, isPlaying, text, originalWords.length]);

  // Reset when not playing
  useEffect(() => {
    if (!isPlaying) {
      reset();
    }
  }, [isPlaying, reset]);

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
