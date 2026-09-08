/* eslint-disable react-refresh/only-export-components -- Manual live integration check. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { storyServices } from "../../src/features/stories/storyServices";
import { buildStorySessionPrompt } from "../../src/features/stories/storySession";
import { generateStorySession } from "../../src/features/stories/storyGeneration";

function Check() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setResult("Generating live radio episode…");
    let raw = "";
    try {
      const session = await generateStorySession({
        prompt: buildStorySessionPrompt({ mode: "radio", targetName: "Spanish", supportName: "English", difficulty: "A1 beginner", context: "Planning a birthday party" }) + "\nFor this integration check, include an order_words checkpoint and a select_words checkpoint.",
        generate: async (prompt) => { raw = await storyServices.generate(prompt); return raw; },
        onDiagnostic: (detail) => console.warn("[Live story check]", detail),
      });
      setResult(`PASS: ${session.segments.length} segments\n${JSON.stringify(session, null, 2)}`);
    } catch (error) { setResult(`FAIL: ${error.message}\n${raw}`); }
    finally { setBusy(false); }
  };
  return <main style={{ maxWidth: 900, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}><h1>Live radio generation check</h1>
    <p>Calls the real story model with a synthetic birthday-party topic. Does not play audio or write progress.</p>
    <button disabled={busy} onClick={run}>Check live radio</button><pre style={{ whiteSpace: "pre-wrap" }} role="status">{result}</pre></main>;
}
createRoot(document.getElementById("root")).render(<Check />);
