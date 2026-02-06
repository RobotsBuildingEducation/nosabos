// components/HighlightedText.jsx
import React, { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { getHighlightedTextParts } from "../hooks/useTTSWordHighlighting";

/**
 * Renders text with TTS word highlighting.
 * The current word being spoken is highlighted with a smooth transition.
 *
 * @param {Object} props
 * @param {string} props.text - The text to display
 * @param {number} props.currentWordIndex - Index of the currently spoken word (-1 for none)
 * @param {boolean} props.isPlaying - Whether TTS is currently playing
 * @param {string} props.highlightColor - Background color for highlighted word
 * @param {Object} props.textProps - Additional props to pass to the Text component
 */
export default function HighlightedText({
  text,
  currentWordIndex = -1,
  isPlaying = false,
  highlightColor = "rgba(56, 178, 172, 0.5)",
  textProps = {},
}) {
  const parts = useMemo(() => {
    if (!isPlaying || currentWordIndex < 0) {
      return null;
    }
    return getHighlightedTextParts(text, currentWordIndex, highlightColor);
  }, [text, currentWordIndex, isPlaying, highlightColor]);

  // When not playing, render plain text for performance
  if (!isPlaying || !parts) {
    return (
      <Text
        fontSize={{ base: "md", md: "md" }}
        lineHeight="1.8"
        {...textProps}
      >
        {text || ""}
      </Text>
    );
  }

  return (
    <Text
      fontSize={{ base: "md", md: "md" }}
      lineHeight="1.8"
      {...textProps}
    >
      {parts.map((part, idx) => {
        if (part.isHighlighted) {
          return (
            <Box
              as="span"
              key={`word-${part.index}-${idx}`}
              bg={highlightColor}
              borderRadius="3px"
              px="2px"
              mx="-2px"
              transition="background-color 0.15s ease-out"
              display="inline"
            >
              {part.content}
            </Box>
          );
        }
        return (
          <React.Fragment key={`part-${idx}`}>
            {part.content}
          </React.Fragment>
        );
      })}
    </Text>
  );
}

/**
 * Alternative: Karaoke-style highlighting where spoken words stay highlighted
 */
export function KaraokeText({
  text,
  currentWordIndex = -1,
  isPlaying = false,
  spokenColor = "rgba(56, 178, 172, 0.3)",
  currentColor = "rgba(56, 178, 172, 0.6)",
  textProps = {},
}) {
  const parts = useMemo(() => {
    if (!text) return [];
    return getHighlightedTextParts(text, currentWordIndex);
  }, [text, currentWordIndex]);

  if (!isPlaying || currentWordIndex < 0) {
    return (
      <Text
        fontSize={{ base: "md", md: "md" }}
        lineHeight="1.8"
        {...textProps}
      >
        {text || ""}
      </Text>
    );
  }

  return (
    <Text
      fontSize={{ base: "md", md: "md" }}
      lineHeight="1.8"
      {...textProps}
    >
      {parts.map((part, idx) => {
        if (part.type === "word") {
          const isCurrentWord = part.index === currentWordIndex;
          const isSpoken = part.index < currentWordIndex;

          if (isCurrentWord) {
            return (
              <Box
                as="span"
                key={`word-${part.index}-${idx}`}
                bg={currentColor}
                borderRadius="3px"
                px="2px"
                mx="-2px"
                fontWeight="500"
                transition="all 0.1s ease-out"
                display="inline"
              >
                {part.content}
              </Box>
            );
          }

          if (isSpoken) {
            return (
              <Box
                as="span"
                key={`word-${part.index}-${idx}`}
                bg={spokenColor}
                borderRadius="3px"
                px="2px"
                mx="-2px"
                transition="all 0.15s ease-out"
                display="inline"
              >
                {part.content}
              </Box>
            );
          }
        }

        return (
          <React.Fragment key={`part-${idx}`}>
            {part.content}
          </React.Fragment>
        );
      })}
    </Text>
  );
}
