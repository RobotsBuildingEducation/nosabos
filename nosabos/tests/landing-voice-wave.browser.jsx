import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import VoiceWaveIcon from "../src/components/VoiceWaveIcon";
import { useTutorVoiceLevel } from "../src/hooks/useTutorVoiceLevel";

// Synthetic waveforms exercise the production analyser/envelope/equalizer path
// without opening a microphone or contacting a provider.
const analyser = (amplitude) => ({
  fftSize: 128,
  context: { state: "running" },
  getFloatTimeDomainData: (samples) => samples.forEach((_, i) => {
    samples[i] = Math.sin(i * 0.4) * amplitude;
  }),
});
export default function Regression() {
  const [state, setState] = useState("idle");
  const micAnalyserRef = useRef(analyser(0.1));
  const tutorAnalyserRef = useRef(analyser(0.04));
  const audioLevelRef = useTutorVoiceLevel({ enabled: true, state, micAnalyserRef, tutorAnalyserRef });
  return <ChakraProvider>
    <h1>Landing speech bars</h1>
    <p>{state}</p>
    <button onClick={() => setState("speaking")}>Tutor audio</button>
    <button onClick={() => setState("listening")}>User audio</button>
    <button onClick={() => setState("idle")}>Silence</button>
    <div id="wave"><VoiceWaveIcon size={28} barCount={9} audioLevelRef={audioLevelRef} /></div>
  </ChakraProvider>;
}
createRoot(document.getElementById("root")).render(<Regression />);
