import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal, flushSync } from "react-dom";
import { Box, Button, ChakraProvider, Heading, HStack, Text } from "@chakra-ui/react";
import CompactActionBar from "../../src/components/CompactActionBar";
import QuestionActionArea from "../../src/components/QuestionActionArea";
import ActivityActionRow from "../../src/components/ActivityActionRow";
import useQuestionActionStore from "../../src/hooks/useQuestionActionStore";
import { theme } from "../../src/theme";
import { applyThemeMode } from "../../src/useThemeStore";
import "../../src/index.css";

applyThemeMode(new URLSearchParams(location.search).get("theme") || "light");

const nextFrame = () => new Promise(requestAnimationFrame);
function sample() {
  const surfaces = [...document.querySelectorAll("[data-action-bar-surface]")]
    .filter((el) => getComputedStyle(el).visibility !== "hidden");
  const rect = surfaces[0]?.getBoundingClientRect();
  const action = document.querySelector("[data-question-actions] button")?.getBoundingClientRect();
  return {
    count: surfaces.length,
    width: rect?.width || 0,
    height: rect?.height || 0,
    center: rect ? rect.left + rect.width / 2 : 0,
    bottom: rect?.bottom || 0,
    actionWidth: action?.width,
  };
}

export default function Preview() {
  const [mode, setMode] = useState("compact");
  const [feedback, setFeedback] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const slot = useQuestionActionStore((s) => s.menuSlot);
  const menu = <Button w="44px" h="44px" minW={0} aria-label="Practice modes">⠿</Button>;

  async function record(change, duration = 850) {
    const frames = [sample()];
    flushSync(change);
    const start = performance.now();
    do {
      await nextFrame();
      frames.push(sample());
    } while (performance.now() - start < duration);
    return frames;
  }

  async function run() {
    setRunning(true);
    setResults([]);
    const checks = [];
    const wide = Math.min(window.innerWidth, 480) - 16;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const close = (a, b) => Math.abs(a - b) < 1;
    const check = (name, passed, frames) => {
      checks.push({ name, passed, widths: frames.map((f) => +f.width.toFixed(1)), heights: frames.map((f) => +f.height.toFixed(1)) });
      setResults([...checks]);
    };
    await record(() => { setMode("compact"); setFeedback(false); });
    let frames = await record(() => setMode("activity"));
    const steady = frames.every((f) => f.count === 1 && close(f.center, window.innerWidth / 2));
    const intermediate = frames.filter((f) => f.width > 70 && f.width < wide - 4);
    const actions = frames.map((f) => f.actionWidth).filter(Boolean);
    check("Expand: intermediate widths, centered, one surface, unstretched controls",
      close(frames[0].width, 66) && close(frames.at(-1).width, wide) && steady &&
      (reduced || intermediate.length >= 3) && Math.max(...actions) - Math.min(...actions) < 1, frames);

    frames = await record(() => setFeedback(true));
    check("Feedback grows without cancelling width or moving the bottom edge",
      frames.at(-1).height > 90 && frames.every((f) => close(f.width, wide) && close(f.bottom, frames[0].bottom)), frames);

    frames = await record(() => { setMode("loading"); setFeedback(false); });
    check("Loading replacement inherits width and smoothly contracts feedback",
      frames.every((f) => close(f.width, wide)) && close(frames.at(-1).height, 66), frames);
    frames = await record(() => setMode("activity"));
    check("Activity replacement keeps the expanded width",
      frames.every((f) => close(f.width, wide) && f.count === 1), frames);

    frames = await record(() => setMode("compact"));
    check("Contract: intermediate widths back to 66px",
      close(frames.at(-1).width, 66) && frames.every((f) => f.count === 1) &&
      (reduced || frames.filter((f) => f.width > 70 && f.width < wide - 4).length >= 3), frames);

    const opening = await record(() => setMode("activity"), 100);
    frames = await record(() => setMode("compact"));
    check("Rapid reversal continues from the in-flight size",
      close(opening.at(-1).width, frames[0].width) && close(frames.at(-1).width, 66) &&
      (reduced || (frames[0].width > 70 && frames[0].width < wide - 4)), frames);
    setRunning(false);
  }

  return (
    <Box p={5} pb="200px" maxW="700px" mx="auto">
      <Heading size="md">Action bar transitions</Heading>
      <Text my={3}>Production footers, separate portals and Strict Mode. No account or network services.</Text>
      <HStack flexWrap="wrap">
        <Button isDisabled={running} onClick={() => setMode("compact")}>Today’s Focus</Button>
        <Button isDisabled={running} onClick={() => setMode("activity")}>Phonics</Button>
        <Button isDisabled={running} onClick={() => setFeedback((value) => !value)}>Toggle feedback</Button>
        <Button isDisabled={running} onClick={run}>Run transition checks</Button>
      </HStack>
      <Text role="status" my={3}>{running ? "Running…" : results.length ? `${results.filter((r) => r.passed).length}/${results.length} checks passed` : "Ready"}</Text>
      {results.map((result) => <Text key={result.name}>{result.passed ? "PASS" : "FAIL"}: {result.name}</Text>)}
      <Box as="details" my={4}>
        <summary>Frame measurements</summary>
        <Box as="pre" fontSize="xs" overflowX="auto" data-testid="transition-results">{JSON.stringify(results, null, 2)}</Box>
      </Box>
      {mode === "compact" ? <CompactActionBar>{menu}</CompactActionBar> : (
        <QuestionActionArea
          key={mode}
          fallback={mode === "loading"}
          feedback={feedback ? true : null}
          actions={<ActivityActionRow primary={<Button>{mode === "loading" ? "Loading…" : "Practice"}</Button>} />}
        >
          {feedback && <Text py={3}>Well done! Your pronunciation was clear.</Text>}
        </QuestionActionArea>
      )}
      {mode !== "compact" && slot && createPortal(menu, slot)}
    </Box>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode><ChakraProvider theme={theme}><Preview /></ChakraProvider></StrictMode>,
);
