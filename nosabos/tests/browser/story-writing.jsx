/* eslint-disable react-refresh/only-export-components -- Manual live editorial review. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { storyModel } from "../../src/firebaseResources/firebaseResources";
import { storyServices } from "../../src/features/stories/storyServices";
import { buildStorySessionPrompt } from "../../src/features/stories/storySession";
import { buildSpeakingStoryPrompt, getStoryDifficulty, STORY_THINKING_BUDGET } from "../../src/features/stories/storyPrompts";
import { generateStorySession } from "../../src/features/stories/storyGeneration";

function Review() {
  const [mode, setMode] = useState("conversation");
  const [level, setLevel] = useState("A1");
  const [topic, setTopic] = useState("Ordering food at a café");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setResult(`Generating ${level} ${mode}…`);
    const input = { targetName: "Spanish", supportName: "English", difficulty: getStoryDifficulty(level) };
    try {
      let output;
      if (mode === "speaking") {
        const prompt = buildSpeakingStoryPrompt({ ...input, targetLang: "es", supportLang: "en", isTutorial: topic === "tutorial", scenarioDirective: `Lesson topic: ${topic}` });
        const response = await storyModel.generateContentStream({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingBudget: STORY_THINKING_BUDGET } } });
        let raw = "";
        for await (const chunk of response.stream) raw += chunk.text();
        const lines = raw.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
        const sentences = lines.filter((line) => line.type === "sentence");
        if (lines.at(-1)?.type !== "done" || !sentences.length || sentences.some((line) => !line.character || !line.tgt || !line.sup)) throw new Error("Incomplete speaking script");
        output = sentences.map((line) => `${line.character}: ${line.tgt}\n  ${line.sup}`).join("\n\n");
      } else {
        const episode = await generateStorySession({ prompt: buildStorySessionPrompt({ ...input, mode, context: JSON.stringify({ topic }) }), generate: storyServices.generate });
        output = `${episode.title}\n\n` + episode.segments.map((segment, index) => `PART ${index + 1}\n` + segment.turns.map((turn) => `${turn.speaker}: ${turn.target}\n  ${turn.support}`).join("\n\n") + `\n\nCheckpoint (${segment.question.type}): ${segment.question.prompt}\nOptions: ${segment.question.options.join(" | ")}\nAnswer: ${segment.question.answer.map((i) => segment.question.options[i]).join(" / ")}\n${segment.question.explanation}`).join("\n\n");
      }
      setResult(`VALID FORMAT — ${level} ${mode} — ${topic}\nEditorial review still required.\n\n${output}`);
    } catch (error) {
      setResult(`FAIL: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };
  return <main style={{ maxWidth: 850, margin: "32px auto", padding: 20, fontFamily: "system-ui", lineHeight: 1.6 }}>
    <h1>Story writing review</h1>
    <p>Generate a live Spanish/English script using the lesson prompts. This preview does not play audio, award XP, or save learner progress.</p>
    <p>Review: a specific want, connected events, distinct voices, an earned ending, level-appropriate language, and questions grounded in the dialogue.</p>
    <fieldset disabled={busy} style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: 16 }}>
      <label>Mode <select value={mode} onChange={(event) => setMode(event.target.value)}>{["speaking", "conversation", "radio"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Level <select value={level} onChange={(event) => setLevel(event.target.value)}>{["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Topic <input value={topic} onChange={(event) => setTopic(event.target.value)} style={{ width: 270 }} /></label>
      <button onClick={run}>Generate writing sample</button>
    </fieldset>
    <pre role="status" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{result}</pre>
  </main>;
}
createRoot(document.getElementById("root")).render(<Review />);
