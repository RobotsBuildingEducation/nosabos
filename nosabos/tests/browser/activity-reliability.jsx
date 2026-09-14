/* eslint-disable react-refresh/only-export-components -- Standalone regression fixture. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, Box, Button } from "@chakra-ui/react";
import { theme } from "../../src/theme";
import "../../src/index.css";
import StoryComprehension from "../../src/features/stories/StoryComprehension";
import { generateReadingWithQuality } from "../../src/utils/readingGeneration";
import { generatePracticeStory } from "../../src/features/stories/practiceStoryGeneration";

const complaint = "The text reuses the exact same concrete pattern and exclamation formula ('Oh, look at...!' 'How surprising...') found in several recent texts such as 'Leaving the Art Studio' and 'My Bus Schedule Update'.";
const reading = { title: "Our teacher", target: "Lina is our teacher. She helps us read. Her book has pictures of animals.", takeaways: ["Identify a teacher."], reviewQuestion: { question: "Who is Lina?", answer: "A teacher" } };
const episode = { title: "The class photo", segments: [
  { turns: [{ speaker: "Neko", target: "Lina is our teacher.", support: "Lina es nuestra maestra." }, { speaker: "Sheilfer", target: "She has a camera.", support: "Ella tiene una cámara." }], question: { type: "choice", prompt: "Who is Lina?", options: ["A teacher", "A child"], answer: [0], explanation: "Lina is our teacher.", audioTurn: 0 } },
  { turns: [{ speaker: "Neko", target: "Our class is in this photo.", support: "Nuestra clase está en esta foto." }, { speaker: "Sheilfer", target: "Put it by the window.", support: "Ponla junto a la ventana." }], question: { type: "choice", prompt: "Where does the photo go?", options: ["By the window", "In a book"], answer: [0], explanation: "Put it by the window.", audioTurn: 1 } },
] };
const practiceRaw = ["This photograph is old.", "My aunt is in the photograph.", "Is this child your cousin?", "Yes, she is three here.", "Your uncle has a big camera.", "He takes our pictures.", "I want a picture with him.", "Put the album on this table."].map((tgt, i) => JSON.stringify({ type: "sentence", character: i % 2 ? "Neko" : "You", tgt })).join("\n") + '\n{"type":"done"}';
const speech = { isRecording: false, isConnecting: false, cancelRecording() {} };
const useFixtureSpeech = () => speech;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const waitFor = async (fn) => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) { if (fn()) return; await new Promise((resolve) => setTimeout(resolve, 20)); }
  throw new Error(`UI timeout: ${fn.toString()}`);
};
// The production sticky footer and feedback rail render through a portal.
const activityText = () => document.body.textContent;
const findButton = (label) => [...document.querySelectorAll("button")].find((button) => button.textContent === label);
const click = async (label) => { await waitFor(() => findButton(label) && !findButton(label).disabled); findButton(label).click(); };
const makeReview = (fault) => async () => { if (fault === "reviewer offline") throw new Error("Review unavailable"); return [complaint]; };

function Harness() {
  const [sample, setSample] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const passed = [];
    setStatus("Running deterministic failure checks…");
    try {
      for (const fault of ["persistent complaint", "reviewer offline", "broken rewrite"]) {
        let calls = 0;
        const candidate = await generateReadingWithQuality({ prompt: "People Around Me", targetLang: "en",
          review: makeReview(fault), generate: async () => ++calls === 2 && fault === "broken rewrite" ? null : reading,
        });
        assert(candidate.target === reading.target && candidate.reviewQuestion.answer === "A teacher", `Reading lost usable content: ${fault}`);
        assert(calls === (fault === "reviewer offline" ? 1 : 2), `Unbounded Reading retries: ${fault}`);
        calls = 0;
        const practice = await generatePracticeStory({ prompt: "Family", plan: { targetLang: "en", recentEntries: [], objective: "Family", mode: "practice" },
          review: makeReview(fault), generate: async () => ++calls === 2 && fault === "broken rewrite" ? "broken" : practiceRaw,
        });
        assert(practice.sentences.length === 8, `Practice lost usable content: ${fault}`);
        assert(calls === (fault === "reviewer offline" ? 1 : 2), `Unbounded Practice retries: ${fault}`);
        passed.push(`Reading and Practice: ${fault} recovered`);
      }
      for (const mode of ["radio", "conversation"]) for (const fault of ["persistent complaint", "reviewer offline", "broken rewrite"]) {
        let calls = 0;
        const services = {
          review: makeReview(fault),
          generate: async () => ++calls === 2 && fault === "broken rewrite" ? "broken" : JSON.stringify(episode),
          getPlayer: async () => {
            let finish;
            const completion = new Promise((resolve) => { finish = resolve; });
            return { audio: { play: async () => finish({ status: "ended" }), pause() {} }, ready: Promise.resolve(), completion, cleanup: () => finish({ status: "cancelled" }) };
          },
          award: () => { throw new Error("Fixture must not write progress"); }, log: () => {},
        };
        const id = `${mode}-${fault}-${Date.now()}`;
        setSample({ mode, services, id });
        await waitFor(() => document.querySelector(`[data-case="${id}"]`) && activityText().includes("The class photo"));
        assert(!findButton("Try again"), `${mode} showed a generation error: ${fault}`);
        await click("Play");
        await waitFor(() => activityText().includes("Who is Lina?"));
        await click("A teacher");
        await click("Submit");
        await waitFor(() => activityText().includes("That’s right!"));
        assert(calls === (fault === "reviewer offline" ? 1 : 2), `Unbounded ${mode} retries: ${fault}`);
        passed.push(`${mode}: ${fault} recovered; rendered and graded the original checkpoint`);
        setStatus(passed.join("\n"));
      }
      setStatus(`PASS: ${passed.length} checks\n${passed.join("\n")}`);
    } catch (error) { setStatus(`FAIL: ${error.message}\n${passed.join("\n")}`); }
    finally { setBusy(false); }
  };
  return <Box maxW="900px" mx="auto" p={6}>
    <h1>Activity reliability regression</h1>
    <p>Injected reviewer failures and malformed rewrites. Real Call/Story component, generation helpers and checkpoint grading. No model requests, progress or XP writes.</p>
    <Button onClick={run} isDisabled={busy}>Run reliability checks</Button>
    <Box as="pre" role="status" whiteSpace="pre-wrap" my={4}>{status}</Box>
    <Box id="activity" data-case={sample?.id}>{sample && <StoryComprehension key={sample.id} mode={sample.mode} services={sample.services} useSpeech={useFixtureSpeech} npub={`reliability-fixture-${sample.id}`} targetLang="en" targetName="English" supportLang="en" supportName="English" uiLang="en" cefrLevel="A0" />}</Box>
  </Box>;
}
createRoot(document.getElementById("root")).render(<ChakraProvider theme={theme}><Harness /></ChakraProvider>);
