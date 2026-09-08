/* eslint-disable react-refresh/only-export-components -- Manual integration check. */
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getTTSPlayer, primeTTSAudio } from "../../src/utils/tts";
import { createStoryAudio } from "../../src/features/stories/storyAudio";

function PlaybackCheck() {
  const [log, setLog] = useState([]);
  const append = (message) => setLog((items) => [...items, message]);
  const queue = useMemo(() => createStoryAudio({
    getPlayer: async (turn) => {
      append(`${turn.speaker}: requesting player`);
      const player = await getTTSPlayer({ text: turn.target, voice: turn.speaker === "Host" ? "ash" : "coral", langTag: "es-MX" });
      append(`${turn.speaker}: player returned (${player.audioUrl ? "cached" : "realtime"})`);
      player.ready.then(() => append(`${turn.speaker}: ready`), (error) => append(`${turn.speaker}: readiness failed: ${error.message}`));
      player.finalize?.then(() => append(`${turn.speaker}: finalized`));
      return player;
    },
    onState: (state, speaker) => append(`${speaker || "Queue"}: ${state}`),
    onError: (error) => append(`FAIL: ${error.message}`),
  }), []);
  useEffect(() => () => queue.stop(), [queue]);
  return <main style={{ padding: 24, fontFamily: "sans-serif" }}><h1>Live radio playback check</h1>
    <p>Plays two synthetic Spanish turns with the real TTS service. No generation or progress writes.</p>
    <button onClick={() => { primeTTSAudio(); setLog([]); queue.play([
      { speaker: "Host", target: "Hola, bienvenida a Radio Amigos. ¿Qué planes tienes para hoy?" },
      { speaker: "Caller", target: "Esta tarde voy al parque con mi familia. ¡Tenemos un día libre!" },
    ], () => append("PASS: both turns completed; checkpoint unlocked")); }}>Play live radio</button>
    <button onClick={() => { queue.stop(); append("Stopped"); }}>Stop</button>
    <pre role="status" style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre></main>;
}
createRoot(document.getElementById("root")).render(<PlaybackCheck />);
