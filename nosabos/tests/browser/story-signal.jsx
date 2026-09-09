/* eslint-disable react-refresh/only-export-components -- Browser audio regression fixture. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import RadioSignal from "../../src/features/stories/RadioSignal";
import { primeStoryAudioLevels } from "../../src/features/stories/storyAudioLevels";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function SignalCheck() {
  const [audio, setAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setResult("Running checks…");
    const ctx = primeStoryAudioLevels();
    const sampleRate = 24000;
    const buffer = ctx.createBuffer(1, sampleRate * 3, sampleRate);
    const pcm = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) pcm[i] = i < sampleRate * 1.5 ? Math.sin(i / sampleRate * Math.PI * 2 * 440) * 0.18 : 0;
    const bytes = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(bytes);
    const str = (offset, text) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    str(0, "RIFF"); view.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    str(36, "data"); view.setUint32(40, pcm.length * 2, true);
    pcm.forEach((sample, i) => view.setInt16(44 + i * 2, sample * 32767, true));
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    const results = [];
    try {
      for (const kind of ["cached", "stream"]) {
        const element = new Audio();
        let source; let destination;
        if (kind === "cached") element.src = url;
        else {
          destination = ctx.createMediaStreamDestination();
          source = ctx.createBufferSource(); source.buffer = buffer;
          source.connect(destination); element.srcObject = destination.stream;
        }
        setAudio(element); setPlaying(true);
        source?.start();
        await element.play();
        try {
          await wait(650);
          const signal = document.querySelector('[data-testid="radio-signal"]');
          const scales = () => [...signal.children].map((bar) => parseFloat(bar.style.transform.match(/scaleY\(([^)]+)/)?.[1] || 0));
          if (signal.dataset.audioReactive !== "true" || Math.max(...scales()) < 0.4) throw new Error(`${kind}: no audio-driven response`);
          await wait(1500);
          if (Math.max(...scales()) > 0.22) throw new Error(`${kind}: bars did not settle during silence`);
          setPlaying(false); element.pause(); await wait(120);
          if ([...signal.children].some((bar) => bar.style.transform || getComputedStyle(bar).animationName !== "none")) throw new Error(`${kind}: animation continues when paused`);
          results.push(`PASS ${kind}: sound raises bars, silence settles them, pause stops animation`);
        } finally {
          element.pause(); source?.stop(); source?.disconnect(); destination?.stream.getTracks().forEach((track) => track.stop());
          setPlaying(false); setAudio(null);
        }
      }
      setResult(results.join("\n"));
    } catch (error) { setResult(`FAIL: ${error.message}`); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };
  return <main style={{ padding: 32 }}><h1>Radio signal checks</h1><p>Checks live-stream and cached audio against sound, silence, and pause.</p>
    <RadioSignal audio={audio} playing={playing} />
    <button disabled={busy} onClick={run}>Run audio signal checks</button><pre role="status">{result}</pre></main>;
}
createRoot(document.getElementById("root")).render(<ChakraProvider><SignalCheck /></ChakraProvider>);
