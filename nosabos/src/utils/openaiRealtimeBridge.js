// OpenAI Realtime transport wrapped in the same surface as the Gemini Live
// bridge (utils/geminiLiveBridge.js), so the Tutor can swap providers without
// touching its session logic. The Tutor already speaks the OpenAI wire
// protocol (session.update / response.create / input_audio_buffer.* over a
// data channel, getSenders()/replaceTrack for mic gating) — the Gemini bridge
// emulates that protocol, and this bridge simply provides the real thing.
//
// Session setup goes through the exchangeRealtimeSDP Cloud Function (App
// Check-gated; the OpenAI key stays server-side). Audio then flows
// browser↔OpenAI directly over WebRTC.

import { appCheckFetch } from "../firebaseResources/firebaseResources";
import {
  buildTutorInputTranscription,
  mergeTutorInputTranscription,
} from "./tutorSpeechPolicy";
import { composeOpenAIRealtimeResponseInstructions } from "./openaiRealtimeResponseInstructions";

const REALTIME_MODEL =
  (
    import.meta.env?.VITE_TUTOR_REALTIME_MODEL ||
    import.meta.env?.VITE_REALTIME_MODEL ||
    "gpt-realtime-2.1-mini"
  ) + "";
const REALTIME_BASE_URL = import.meta.env?.VITE_REALTIME_URL || "";
const DATA_CHANNEL_OPEN_TIMEOUT_MS = 12000;

// Dev-only wire log so provider A/B runs are diagnosable at a glance
// (deltas are skipped to keep the console readable).
const DEBUG_WIRE_LOG = !!import.meta.env?.DEV;
function wireLog(direction, label) {
  if (DEBUG_WIRE_LOG) console.info(`[openai-realtime] ${direction} ${label}`);
}

// Mirrors the Tutor's enableVAD() payload so the session starts in the same
// listening posture the Tutor later toggles.
const DEFAULT_TURN_DETECTION = {
  type: "server_vad",
  silence_duration_ms: 2000,
  threshold: 0.35,
  prefix_padding_ms: 120,
  create_response: false,
  interrupt_response: false,
};

// The Tutor's handleRealtimeEvent switches on the event names the Gemini
// bridge emits (a mix of beta and GA names). Newer OpenAI models emit GA
// names for a few of them — rewrite those so the handler keeps working.
const EVENT_TYPE_ALIASES = {
  "response.output_audio_transcript.delta": "response.audio_transcript.delta",
  "response.output_audio_transcript.done": "response.audio_transcript.done",
  "conversation.item.added": "conversation.item.created",
};

// The Tutor (and the Gemini bridge it normally talks to) speak the beta-era
// wire dialect: flat session fields and modalities:["audio","text"]. The GA
// realtime API that gpt-realtime-2.1-mini speaks nests audio config under
// session.audio.{input,output}, renames modalities → output_modalities, and
// does not allow audio+text together (audio implies transcript events). This
// translates a beta-shaped session object to GA so a rejected session.update
// can never silently drop the Tutor's instructions.
// Voices the GA realtime API accepts. The Tutor's language-policy updates
// carry its GEMINI voice name (normalizeGeminiLiveVoice) — forwarding an
// unknown voice makes the server reject the WHOLE session.update, silently
// dropping the instructions with it. Unknown voices are omitted instead; the
// session keeps the voice set at connect time.
const OPENAI_REALTIME_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "cedar",
  "coral",
  "echo",
  "marin",
  "sage",
  "shimmer",
  "verse",
]);

function toGaSession(session = {}, { omitVoice = false } = {}) {
  const {
    voice,
    input_audio_transcription: inputTranscription,
    turn_detection: turnDetection,
    modalities,
    output_modalities: outputModalities,
    audio,
    // Beta-era stream-format strings ("pcm16"): WebRTC negotiates the codec
    // in SDP, and the GA API rejects these as unknown parameters.
    output_audio_format: _outputFormat,
    input_audio_format: _inputFormat,
    ...rest
  } = session || {};

  const ga = { ...rest, type: "realtime" };
  const audioConfig = { ...(audio || {}) };
  const input = { ...(audioConfig.input || {}) };
  const output = { ...(audioConfig.output || {}) };

  if (inputTranscription !== undefined) input.transcription = inputTranscription;
  if (turnDetection !== undefined) input.turn_detection = turnDetection;
  // The GA API rejects ANY voice write once the session has produced audio —
  // and a rejected session.update silently drops the instructions with it. So
  // after the first audio response, omit the voice entirely (it can't change
  // anyway) instead of re-sending even the same value.
  if (
    !omitVoice &&
    voice !== undefined &&
    OPENAI_REALTIME_VOICES.has(String(voice))
  ) {
    output.voice = voice;
  }

  if (Object.keys(input).length) audioConfig.input = input;
  if (Object.keys(output).length) audioConfig.output = output;
  if (Object.keys(audioConfig).length) ga.audio = audioConfig;

  const mods = outputModalities || modalities;
  if (Array.isArray(mods)) {
    ga.output_modalities = mods.includes("audio") ? ["audio"] : ["text"];
  }
  return ga;
}

class OpenAIRealtimeBridge {
  constructor({
    audioElement = null,
    initialInstructions = "",
    responseInstructionsPrefix = "",
    voice = "alloy",
    inputLanguageCodes = null,
    inputTranscriptionKeywords = null,
    onEvent,
    onAudioGraph,
    onError,
  } = {}) {
    this.audioElement = audioElement;
    this.initialInstructions = initialInstructions;
    this.responseInstructionsPrefix = responseInstructionsPrefix;
    this.voice = voice;
    this.inputLanguageCodes = Array.isArray(inputLanguageCodes)
      ? inputLanguageCodes
      : [];
    this.inputTranscriptionKeywords = Array.isArray(inputTranscriptionKeywords)
      ? inputTranscriptionKeywords
      : [];
    this.onEvent = onEvent;
    this.onAudioGraph = onAudioGraph;
    this.onError = onError;

    this.pc = null;
    this.dc = null;
    this.localStream = null;
    this.audioContext = null;
    this.closed = false;
    this.audioGraphReady = false;
    // Set once the server starts any audio response; from then on voice must
    // be omitted from session.update (see toGaSession).
    this.audioResponseStarted = false;
    // Preserve the target/support language anchor across partial session.update
    // calls. Tutor toggles VAD frequently and also re-applies policy after
    // connect; neither operation may erase transcription.language/prompt.
    this.inputTranscription = buildTutorInputTranscription({
      inputLanguageCodes: this.inputLanguageCodes,
      keywords: this.inputTranscriptionKeywords,
    });
  }

  get readyState() {
    return this.dc?.readyState || "closed";
  }

  get mediaStream() {
    return this.localStream;
  }

  getSenders() {
    return this.pc?.getSenders?.() || [];
  }

  getReceivers() {
    return this.pc?.getReceivers?.() || [];
  }

  setResponseInstructionsPrefix(instructions = "") {
    this.responseInstructionsPrefix = String(instructions || "").trim();
  }

  send(raw) {
    if (this.dc?.readyState !== "open") return;
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      this.dc.send(raw);
      return;
    }
    if (!payload || typeof payload.type !== "string") {
      this.dc.send(raw);
      return;
    }

    if (payload.type === "session.update") {
      wireLog("→", "session.update");
      // The session policy rides in session.instructions and governs every
      // response whose response.create carries NO instructions of its own
      // (per-response instructions REPLACE session instructions — see the
      // response.create branch below for how turn tasks are delivered).
      if (typeof payload.session?.instructions === "string") {
        this.instructions = payload.session.instructions;
      }
      const requestedTranscription = payload.session?.input_audio_transcription;
      this.inputTranscription = mergeTutorInputTranscription(
        this.inputTranscription,
        requestedTranscription,
      );
      const nextSession = {
        ...(payload.session || {}),
        ...(requestedTranscription === undefined
          ? {}
          : { input_audio_transcription: this.inputTranscription }),
      };
      this.dc.send(
        JSON.stringify({
          type: "session.update",
          session: toGaSession(nextSession, {
            omitVoice: this.audioResponseStarted,
          }),
        }),
      );
      // Do not synthesize session.updated here. OpenAI emits the real
      // acknowledgement; Tutor must not start a lesson until the server has
      // accepted the policy (including its language/transcription fields).
      return;
    }

    if (payload.type === "response.create") {
      const response = { ...(payload.response || {}) };
      const mods = response.output_modalities || response.modalities;
      delete response.modalities;
      response.output_modalities =
        Array.isArray(mods) && !mods.includes("audio") ? ["text"] : ["audio"];
      // response.instructions is the clean, response-local control surface
      // used by the Playground. Keep a compact bilingual voice policy adjacent
      // to the current task so target-language spans are rendered as native
      // speech instead of inheriting the surrounding support-language accent.
      // Do not copy the full session prompt here: that made mini sound scripted.
      const turnInstructions = String(response.instructions || "").trim();
      const responseInstructions = composeOpenAIRealtimeResponseInstructions(
        this.responseInstructionsPrefix,
        turnInstructions,
      );
      if (responseInstructions) {
        response.instructions = responseInstructions;
      } else {
        delete response.instructions;
      }
      wireLog(
        "→",
        `response.create${response.metadata?.kind ? ` (${response.metadata.kind})` : ""}`,
      );
      if (DEBUG_WIRE_LOG) {
        console.debug("[openai-realtime] turn task →", turnInstructions);
      }
      this.dc.send(JSON.stringify({ ...payload, response }));
      return;
    }

    wireLog("→", payload.type);
    this.dc.send(raw);
  }

  // The element path can only attenuate (0..1); the Gemini bridge's >1 boost
  // is not reproducible without re-routing playback through an AudioContext.
  setOutputGain(gain) {
    if (!this.audioElement) return;
    const clamped = Math.max(0, Math.min(1, Number(gain) || 0));
    this.audioElement.volume = clamped;
  }

  setInputAudioEnabled(enabled) {
    this.localStream?.getAudioTracks?.().forEach((track) => {
      track.enabled = !!enabled;
    });
  }

  // The Tutor's handleRealtimeEvent expects MessageEvent-shaped input and does
  // JSON.parse(evt.data) itself (the Gemini bridge wraps its events the same
  // way) — so every emitted event must carry a JSON string under `.data`.
  emit(event) {
    try {
      this.onEvent?.({ data: JSON.stringify(event) });
    } catch {
      // listener errors must not kill the data channel pump
    }
  }

  buildInitialSession() {
    return {
      instructions: this.initialInstructions || "",
      voice: this.voice || "alloy",
      input_audio_transcription: this.inputTranscription,
      turn_detection: DEFAULT_TURN_DETECTION,
    };
  }

  async connect() {
    if (!REALTIME_BASE_URL) {
      throw new Error("Realtime URL is not configured (VITE_REALTIME_URL).");
    }
    const url = `${REALTIME_BASE_URL}?model=${encodeURIComponent(REALTIME_MODEL)}`;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const pc = new RTCPeerConnection();
    this.pc = pc;

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(pc.connectionState) && !this.closed) {
        this.onError?.(`Realtime connection ${pc.connectionState}`);
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;
      if (this.audioElement) {
        this.audioElement.srcObject = remoteStream;
        this.audioElement.play().catch(() => {});
      }
      if (!this.audioGraphReady) {
        try {
          const AudioContextCtor =
            window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContextCtor();
          this.audioContext = audioContext;
          // ontrack fires outside the user gesture, so the context can start
          // suspended — a dead analyser would make the Tutor's unlock-after-
          // quiet poll think playback ended instantly.
          audioContext.resume?.().catch?.(() => {});
          const source = audioContext.createMediaStreamSource(remoteStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          this.audioGraphReady = true;
          this.onAudioGraph?.({
            audioContext,
            analyser,
            floatBuffer: new Float32Array(analyser.frequencyBinCount),
            stream: destination.stream,
          });
        } catch {
          // visualization is optional; audio still plays via the element
        }
      }
    };

    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;

    const dcOpen = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Realtime data channel timed out.")),
        DATA_CHANNEL_OPEN_TIMEOUT_MS,
      );
      dc.onopen = () => {
        clearTimeout(timeout);
        try {
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: toGaSession(this.buildInitialSession()),
            }),
          );
        } catch {
          // the Tutor re-sends session config on its own cadence
        }
        resolve();
      };
      dc.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Realtime data channel failed."));
      };
    });

    dc.onmessage = (event) => {
      let parsed = null;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!parsed || typeof parsed.type !== "string") return;
      if (
        !this.audioResponseStarted &&
        (parsed.type === "response.output_audio.delta" ||
          parsed.type === "response.audio.delta" ||
          parsed.type === "response.output_audio_transcript.delta" ||
          parsed.type === "response.audio_transcript.delta" ||
          parsed.type === "output_audio_buffer.started")
      ) {
        this.audioResponseStarted = true;
      }
      if (!parsed.type.endsWith(".delta")) wireLog("←", parsed.type);
      if (DEBUG_WIRE_LOG && parsed.type === "session.updated") {
        console.info("[openai-realtime] effective session:", {
          model: parsed.session?.model,
          voice: parsed.session?.audio?.output?.voice,
          hasInstructions: !!parsed.session?.instructions,
          outputModalities: parsed.session?.output_modalities,
        });
      }
      if (parsed.type === "error") {
        // Surface rejections loudly (a silently dropped session.update means
        // the Tutor's instructions never reached the model) but don't route
        // to onError — benign errors like cancelling an inactive response
        // would otherwise pop the Tutor's error UI mid-lesson.
        console.warn("[openai-realtime] server error event:", parsed?.error || parsed);
      }
      const alias = EVENT_TYPE_ALIASES[parsed.type];
      if (alias) {
        this.emit({ ...parsed, type: alias, originalType: parsed.type });
        return;
      }
      // Unaliased events forward the ORIGINAL MessageEvent — .data is already
      // the JSON string the handler parses (same as the pre-Gemini wiring,
      // which set dc.onmessage = handleRealtimeEvent directly).
      try {
        this.onEvent?.(event);
      } catch {
        // listener errors must not kill the data channel pump
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // Establish the call with the effective voice, language, transcription,
    // and tutor instructions already present. This matches the Playground's
    // clean session creation path and avoids beginning from a default session
    // that is only made bilingual by a later data-channel update.
    const initialSession = {
      ...toGaSession(this.buildInitialSession()),
      model: REALTIME_MODEL,
    };
    const response = await appCheckFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sdp: offer.sdp,
        model: REALTIME_MODEL,
        session: initialSession,
      }),
    });
    const answer = await response.text();
    if (!response.ok) {
      throw new Error(`SDP exchange failed: HTTP ${response.status}`);
    }
    await pc.setRemoteDescription({ type: "answer", sdp: answer });
    await dcOpen;
    return this;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.dc?.close?.();
    } catch {
      /* already closing */
    }
    try {
      this.pc?.getSenders?.().forEach((sender) => sender.track?.stop?.());
      this.pc?.getReceivers?.().forEach((receiver) => receiver.track?.stop?.());
    } catch {
      /* tracks already stopped */
    }
    try {
      this.pc?.close?.();
    } catch {
      /* already closed */
    }
    try {
      this.localStream?.getTracks?.().forEach((track) => track.stop());
    } catch {
      /* already stopped */
    }
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.srcObject = null;
      } catch {
        /* detached */
      }
    }
    try {
      this.audioContext?.close?.();
    } catch {
      /* already closed */
    }
    this.pc = null;
    this.dc = null;
    this.localStream = null;
    this.audioContext = null;
  }
}

export async function createOpenAIRealtimeBridge(options = {}) {
  const bridge = new OpenAIRealtimeBridge(options);
  try {
    await bridge.connect();
  } catch (error) {
    bridge.close();
    throw error;
  }
  return bridge;
}
