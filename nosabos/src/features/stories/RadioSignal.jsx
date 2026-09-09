import { useEffect, useRef } from "react";
import { Box, HStack, usePrefersReducedMotion } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { createStoryLevelReader } from "./storyAudioLevels";

const pulse = keyframes`
  0%, 100% { transform: scaleY(0.2); }
  25% { transform: scaleY(0.9); }
  50% { transform: scaleY(0.35); }
  75% { transform: scaleY(0.7); }
`;
const heights = [10, 18, 28, 14, 32, 22, 12, 26, 18, 30, 14, 8];

export default function RadioSignal({ audio, playing, recording }) {
  const bars = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const active = playing || recording;
  useEffect(() => {
    if (!playing || !audio || reduceMotion) return;
    const reader = createStoryLevelReader(audio);
    if (!reader) return;
    const element = bars.current;
    let frame;
    const values = Array(12).fill(0);
    const draw = () => {
      const levels = reader.read();
      if (levels) {
        element.dataset.audioReactive = "true";
        Array.from(element.children).forEach((bar, index) => {
          // Quick attack and a softer release retain syllable rhythm without flicker.
          values[index] += (levels[index] - values[index]) * (levels[index] > values[index] ? 0.65 : 0.25);
          bar.style.animation = "none";
          bar.style.height = "32px";
          bar.style.transform = `scaleY(${(6 + values[index] * 26) / 32})`;
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      reader.dispose();
      delete element.dataset.audioReactive;
      Array.from(element.children).forEach((bar) => {
        bar.style.removeProperty("animation");
        bar.style.removeProperty("height");
        bar.style.removeProperty("transform");
      });
    };
  }, [audio, playing, reduceMotion]);
  return <HStack ref={bars} h="32px" spacing={1} aria-hidden="true" data-testid="radio-signal">
    {heights.map((height, i) => <Box key={i} w="4px" h={`${active ? height : 6}px`} bg="teal.400" rounded="full"
      animation={active && !reduceMotion ? `${pulse} ${0.65 + (i % 4) * 0.13}s ease-in-out ${-i * 0.11}s infinite` : "none"}
    />)}
  </HStack>;
}
