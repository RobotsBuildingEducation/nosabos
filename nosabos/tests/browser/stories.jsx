/* eslint-disable react-refresh/only-export-components -- Standalone browser regression fixture. */
import { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, Box, Button, HStack } from "@chakra-ui/react";
import { theme } from "../../src/theme";
import { applyThemeMode } from "../../src/useThemeStore";
import "../../src/index.css";
import StoryComprehension from "../../src/features/stories/StoryComprehension";

const episode = { title: "The birthday surprise", segments: [
  { turns: [{ speaker: "Ana", target: "Tengo flores rojas.", support: "I have red flowers." }, { speaker: "Luis", target: "Son para mi madre.", support: "They are for my mother." }], question: { type: "choice", prompt: "Who are the flowers for?", options: ["His mother", "His friend", "His sister"], answer: [0], explanation: "Luis says the flowers are for his mother." } },
  { turns: [{ speaker: "Ana", target: "¿Es su cumpleaños?", support: "Is it her birthday?" }, { speaker: "Luis", target: "Sí, es hoy.", support: "Yes, it is today." }], question: { type: "order_words", prompt: "Build what you hear.", options: ["hoy", "Sí", "es"], answer: [1, 2, 0], audioTurn: 1, explanation: "Her birthday is today." } },
  { turns: [{ speaker: "Ana", target: "También tengo un pastel.", support: "I also have a cake." }, { speaker: "Luis", target: "¡Qué buena sorpresa!", support: "What a nice surprise!" }], question: { type: "select_words", prompt: "Select two words you hear.", options: ["flores", "pastel", "tengo", "rojas"], answer: [1, 2], audioTurn: 0, explanation: "Ana also has a cake." } },
] };
let learnerCast = false;
let replySample = false;
let failNextAudio = false;
let speechPass = true;
let playedLines = [];
function useFixtureSpeech({ onResult }) {
  const [isRecording, setRecording] = useState(false);
  const cancelRecording = useCallback(() => setRecording(false), []);
  return { isRecording, isConnecting: false, cancelRecording,
    startRecording: async () => setRecording(true),
    stopRecording: () => { setRecording(false); onResult({ evaluation: { pass: speechPass } }); },
  };
}
let awards = 0;
let logs = 0;
let failSave = false;
const services = {
  generate: async () => {
    const sample = structuredClone(episode);
    if (learnerCast) sample.segments.forEach((segment) => segment.turns.forEach((turn) => { if (turn.speaker === "Luis") turn.speaker = "You"; }));
    if (learnerCast) sample.segments[0].turns.push({ speaker: "Ana", target: "Vamos a visitarla.", support: "Let's visit her." });
    if (replySample) sample.segments[0].question = { type: "reply", prompt: "How do you reply?", options: ["Muchas gracias.", "Hace frío.", "Es lunes."], answer: [0], explanation: "Thank them for the flowers." };
    return JSON.stringify(sample);
  },
  getPlayer: async (turn) => {
    if (failNextAudio) { failNextAudio = false; throw new Error("Fixture audio failure"); }
    playedLines.push(turn.text);
    let timer;
    let finish;
    const completion = new Promise((resolve) => { finish = resolve; });
    return { audio: { play: async () => { timer = setTimeout(() => finish({ status: "ended" }), 250); }, pause() { clearTimeout(timer); } }, ready: Promise.resolve(), completion, cleanup() { clearTimeout(timer); finish({ status: "cancelled" }); } };
  },
  award: async () => { if (failSave) { failSave = false; throw new Error("Offline"); } awards++; },
  log: async () => { logs++; },
};
function Harness() {
  const [mode, setMode] = useState(() => Math.random() < 0.5 ? "radio" : "conversation");
  const [run, setRun] = useState(0);
  const [checks, setChecks] = useState("");
  window.storyHarness = { mode: (value) => { setMode(value); setRun((n) => n + 1); }, counters: () => ({ awards, logs }), failSave: () => { failSave = true; } };
  return <Box maxW="820px" mx="auto" px={4} py={6}>
    <Button mb={4} onClick={() => { setChecks(""); window.storyHarness.mode(Math.random() < 0.5 ? "radio" : "conversation"); }}>New sample activity</Button>
    <Box as="details" mb={6}><Box as="summary" cursor="pointer">Developer checks</Box><HStack mt={3} flexWrap="wrap"><Button onClick={() => applyThemeMode("light")}>Light</Button><Button onClick={() => applyThemeMode("dark")}>Dark</Button><Button onClick={async () => { setChecks("Running checks…"); try { setChecks((await window.runStoryChecks()).join("\n")); } catch (error) { setChecks(`FAIL: ${error.message}`); } }}>Run checks</Button></HStack></Box>
    {checks && <Box as="pre" whiteSpace="pre-wrap" role="status" mb={4}>{checks}</Box>}
    <StoryComprehension key={run} mode={mode} services={services} useSpeech={useFixtureSpeech} npub="fixture-only" targetLang="es" targetName="Spanish" supportLang="en" supportName="English" uiLang="en" cefrLevel="A1" />
  </Box>;
}
applyThemeMode("dark");
createRoot(document.getElementById("root")).render(<ChakraProvider theme={theme}><Harness /></ChakraProvider>);

// Exercise the real component and sticky action footer without network generation or XP writes.
const waitFor = async (fn) => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) { if (fn()) return; await new Promise((resolve) => setTimeout(resolve, 30)); }
  throw new Error(`Timed out waiting for UI: ${fn.toString()}`);
};
const text = () => document.body.textContent;
const button = (label) => [...document.querySelectorAll("button")].find((el) => !el.closest("[inert]") && (el.textContent === label || el.getAttribute("aria-label") === label));
const click = async (label) => { await waitFor(() => button(label) && !button(label).disabled).catch((error) => { throw new Error(`${error.message} [${label}]`); }); button(label).click(); await new Promise((resolve) => setTimeout(resolve, 40)); };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
window.runStoryChecks = async () => {
  awards = 0; logs = 0;
  const results = [];
  window.storyHarness.mode("radio"); await waitFor(() => text().includes("READY TO LISTEN"));
  assert(!text().includes("Tengo flores rojas."), "Radio must hide transcript");
  assert(!text().includes("Who are the flowers for?"), "Radio checkpoint must wait for audio");
  assert(!button("Submit"), "Only Play should be offered before the question");
  await click("Play");
  const signal = document.querySelector('[data-testid="radio-signal"] > div');
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    const before = getComputedStyle(signal).transform;
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert(getComputedStyle(signal).animationName !== "none" && getComputedStyle(signal).transform !== before, "Radio bars must animate during playback");
  }
  await click("Pause");
  assert(getComputedStyle(signal).animationName === "none", "Radio bars stop when paused");
  await click("Resume");
  await waitFor(() => text().includes("Who are the flowers for?"));
  assert(getComputedStyle(signal).animationName === "none", "Radio bars stop after playback");
  assert(!button("Play"), "Submit replaces Play when questions appear");
  await click("Replay"); await waitFor(() => text().includes("READY TO LISTEN"));
  assert(text().includes("Who are the flowers for?"), "Replay retains the current question");
  results.push("Radio has one primary action, Play → Submit, and a separate Replay");
  await click("His friend"); await click("Submit");
  assert(text().includes("Not quite."), "Wrong answer must get feedback"); await click("Continue");
  assert(!text().includes("Build what you hear."), "Next radio checkpoint must be gated again");
  await waitFor(() => text().includes("Build what you hear."));
  await click("Sí"); await click("es"); await click("hoy"); await click("Submit");
  assert(text().includes("That’s right!"), "Ordered tiles should be graded"); await click("Continue");
  await waitFor(() => text().includes("Select two words you hear."));
  await click("pastel"); await click("tengo"); await click("Submit");
  await click("Finish story"); await waitFor(() => text().includes("READY TO LISTEN"));
  assert(awards === 1 && logs === 1, "XP and completion must be written once");
  results.push("Wrong answers, ordered tiles, word selection, score and XP complete correctly");
  window.storyHarness.mode("conversation"); await waitFor(() => text().includes("Tengo flores rojas."));
  assert(!text().includes("¿Es su cumpleaños?"), "Future dialogue must stay hidden");
  assert(!text().includes("I have red flowers."), "Translation is initially hidden");
  await click("Show translation"); assert(text().includes("I have red flowers."), "Translation toggle works");
  assert(!text().includes("Who are the flowers for?"), "Conversation checkpoint must wait for audio");
  await click("Play"); await waitFor(() => text().includes("Who are the flowers for?"));
  await click("His mother"); await click("Submit"); await click("Continue");
  assert(text().includes("Sí, es hoy."), "NPC dialogue stays visible for word-order questions");
  assert(!text().includes("Listen and build this line below."), "No placeholder replaces NPC dialogue");
  assert(!text().includes("Build what you hear."), "Next conversation segment must gate its question");
  await waitFor(() => text().includes("Build what you hear."));
  await click("Sí"); await click("es"); await click("hoy"); await click("Submit");
  assert(text().includes("Sí, es hoy."), "Corrected dialogue is revealed after grading");
  results.push("Conversation shows the actual dialogue, including word-order excerpts, and toggles translations");
  for (const mode of ["radio", "conversation"]) {
    learnerCast = true;
    playedLines = [];
    window.storyHarness.mode(mode); await waitFor(() => button("Play"));
    await click("Play"); await waitFor(() => button("Record"));
    assert(!text().includes("Who are the flowers for?"), "You must record before the question");
    assert(!playedLines.includes("Son para mi madre."), "You goes straight to speech without TTS");
    assert(text().includes("Your turn to speak:"), "Speech heading ends with a colon");
    assert(!text().includes("Say this line to continue."), "Speech helper text is removed");
    const speechCard = document.querySelector('[data-testid="story-speech-turn"]');
    assert(!speechCard.textContent.includes("They are for my mother."), "Speech translation starts hidden");
    speechCard.querySelector('button[aria-label="Show translation"]').click();
    await waitFor(() => speechCard.textContent.includes("They are for my mother."));
    speechCard.querySelector('button[aria-label="Hide translation"]').click();
    await waitFor(() => !speechCard.textContent.includes("They are for my mother."));
    if (mode === "radio") {
      for (let frame = 0; frame < 4; frame++) {
        const pet = document.querySelector('img[alt$="pet avatar"]');
        assert(pet && pet.getAttribute("src").startsWith("data:image/png"), "Animated You avatar always displays the pet");
        assert(!document.querySelector('img[alt="You"]'), "Pet frames never fall back to the girl portrait");
        await new Promise((resolve) => setTimeout(resolve, 190));
      }
    }
    await click("Replay");
    assert(button("Record") && speechCard.isConnected, "Replay preserves the waiting speech prompt");
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert(!text().includes("Who are the flowers for?"), "Replay cannot unlock the checkpoint");
    failNextAudio = true;
    speechCard.querySelector('button[aria-label="Play: You"]').click();
    await waitFor(() => text().includes("Audio couldn’t play."));
    assert(button("Record"), "Reference audio failure retains the speech turn");
    speechCard.querySelector('button[aria-label="Play: You"]').click();
    await waitFor(() => playedLines.includes("Son para mi madre."));
    assert(!text().includes("Who are the flowers for?"), "Explicit model audio does not count as recording");
    await click("Record");
    await click("Replay");
    assert(button("Record") && !button("Stop recording"), "Replay cancels microphone capture while keeping the turn");
    speechPass = false;
    await click("Record");
    if (mode === "radio" && !reducedMotion) assert(getComputedStyle(document.querySelector('[data-testid="radio-signal"] > div')).animationName !== "none", "Radio bars animate while recording");
    await click("Stop recording");
    assert(button("Try again") && text().includes("Not quite. Try again."), "Unsuccessful speech shows feedback rail and retry");
    assert(!speechCard.textContent.includes("Try again"), "Evaluation feedback belongs in the rail");
    assert(!text().includes("Who are the flowers for?"), "Unsuccessful speech cannot unlock the question");
    speechPass = true;
    await click("Try again"); await click("Record"); await click("Stop recording");
    assert(button("Continue") && text().includes("That’s right!"), "Correct speech shows success feedback and Continue");
    assert(!text().includes("Who are the flowers for?"), "Success waits for Continue before revealing the question");
    assert(!playedLines.includes("Vamos a visitarla."), "Following line waits for Continue");
    await click("Replay");
    assert(button("Continue"), "Reference audio preserves successful speech feedback");
    await click("Continue");
    await waitFor(() => playedLines.includes("Vamos a visitarla."));
    await waitFor(() => text().includes("Who are the flowers for?"));
    assert(button("Submit") && !button("Record"), "Successful speech reveals Submit");
    playedLines = [];
    await click("Replay"); await new Promise((resolve) => setTimeout(resolve, 650));
    assert(!button("Record"), "Replay does not repeat the speech requirement");
    assert(!playedLines.includes("Son para mi madre."), "Replay only plays the other characters");
    await click("His mother"); await click("Submit"); await click("Continue");
    await waitFor(() => button("Record"));
    assert(!document.querySelector('[data-testid="story-speech-turn"]').textContent.includes("Yes, it is today."), "Next speaking turn starts with translation hidden");
    assert(!button("Play"), "Continuing to the next segment automatically reaches its learner line");
    results.push(`${mode}: speech translations, feedback, enabled reference audio, preserved turns, and automatic continuation pass`);
  }
  learnerCast = false;
  replySample = true;
  window.storyHarness.mode("conversation"); await waitFor(() => button("Play"));
  await click("Play"); await waitFor(() => text().includes("How do you reply?"));
  assert(!text().includes("Choose your reply") && !text().includes("Choose how you reply"), "Reply helper card is removed");
  results.push("Reply checkpoints show the question without the extra helper card");
  replySample = false;
  return results;
};
