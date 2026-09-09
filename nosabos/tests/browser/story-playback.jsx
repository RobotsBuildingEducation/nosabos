/* eslint-disable react-refresh/only-export-components -- Manual integration check. */
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getTTSPlayer, primeTTSAudio } from "../../src/utils/tts";
import { ChakraProvider } from "@chakra-ui/react";
import RadioSignal from "../../src/features/stories/RadioSignal";
import { primeStoryAudioLevels } from "../../src/features/stories/storyAudioLevels";
import { createStoryAudio } from "../../src/features/stories/storyAudio";

function PlaybackCheck() {
  const [log, setLog] = useState([]);
  const [audio, setAudio] = useState(null);
  const [state, setState] = useState("idle");
  const uncached = useRef(false);
  const append = (message) => setLog((items) => [...items, message]);
  const queue = useMemo(() => createStoryAudio({
    getPlayer: async (turn) => {
      append(`${turn.speaker}: requesting player`);
      const player = await getTTSPlayer({ text: turn.target, voice: turn.speaker === "Host" ? "ash" : "coral", langTag: "es-MX", disableCache: uncached.current });
      append(`${turn.speaker}: player returned (${player.audioUrl ? "cached" : "realtime"})`);
      player.ready.then(() => append(`${turn.speaker}: ready`), (error) => append(`${turn.speaker}: readiness failed: ${error.message}`));
      player.finalize?.then(() => append(`${turn.speaker}: finalized`));
      return player;
    },
    onPlayer: setAudio,
    onState: (state, speaker) => { setState(state); append(`${speaker || "Queue"}: ${state}`); },
    onError: (error) => append(`FAIL: ${error.message}`),
  }), []);
  useEffect(() => () => queue.stop(), [queue]);
  useEffect(() => {
    if (state !== "playing" || !audio) return;
    let frames = 0; let peak = 0;
    const timer = setInterval(() => {
      const signal = document.querySelector('[data-testid="radio-signal"]');
      if (signal?.dataset.audioReactive !== "true") return;
      frames++;
      for (const bar of signal.children) peak = Math.max(peak, Number(bar.style.transform.match(/scaleY\(([^)]+)/)?.[1] || 0));
    }, 50);
    return () => {
      clearInterval(timer);
      setLog((items) => [...items, `${frames && peak > 0.25 ? "PASS" : "FAIL"}: ${audio.srcObject ? "realtime" : "cached"} waveform (${frames} measured frames, peak ${peak.toFixed(2)})`]);
    };
  }, [state, audio]);
  return <main style={{ padding: 24, fontFamily: "sans-serif" }}><h1>Live radio playback check</h1>
    <p>Plays two synthetic Spanish turns with the real TTS service. No generation or progress writes.</p>
    <RadioSignal audio={audio} playing={state === "playing"} />
    <label><input type="checkbox" onChange={(event) => { uncached.current = event.target.checked; }} />Force uncached speech</label>
    <button onClick={() => { primeTTSAudio(); primeStoryAudioLevels(); setLog([]); queue.play([
      { speaker: "Host", target: "Hola, bienvenida a Radio Amigos. ¿Qué planes tienes para hoy?" },
      { speaker: "Caller", target: "Esta tarde voy al parque con mi familia. ¡Tenemos un día libre!" },
    ], () => append("PASS: both turns completed; checkpoint unlocked")); }}>Play live radio</button>
    <button onClick={() => { queue.stop(); append("Stopped"); }}>Stop</button>
    <pre role="status" style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre></main>;
}
createRoot(document.getElementById("root")).render(<ChakraProvider><PlaybackCheck /></ChakraProvider>);
