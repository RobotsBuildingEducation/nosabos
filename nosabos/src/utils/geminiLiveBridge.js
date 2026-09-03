import {
  getAI,
  getLiveGenerativeModel,
  GoogleAIBackend,
  ResponseModality,
  VertexAIBackend,
} from "firebase/ai";

import { app } from "../firebaseResources/firebaseResources";
import {
  DEFAULT_GEMINI_LIVE_VOICE,
  normalizeGeminiLiveVoice,
} from "./geminiLiveVoices";

const GEMINI_LIVE_PROVIDER =
  import.meta.env.VITE_GEMINI_LIVE_PROVIDER || "google-ai";
const GEMINI_LIVE_USES_VERTEX = GEMINI_LIVE_PROVIDER === "vertex";
const GEMINI_LIVE_LOCATION =
  import.meta.env.VITE_GEMINI_LIVE_LOCATION || "us-central1";

// Support both backends:
// • Google AI (Developer API / Google AI Studio): gemini-3.1-flash-live-preview
//   (higher quality audio decoder, bills to Gemini AI Studio).
// • Vertex AI / Agent Platform: gemini-live-2.5-flash-native-audio (bills to GCP).
export const DEFAULT_GEMINI_LIVE_MODEL = GEMINI_LIVE_USES_VERTEX
  ? "gemini-live-2.5-flash-native-audio"
  : "gemini-3.1-flash-live-preview";

const configuredModel =
  (import.meta.env.VITE_TUTOR_GEMINI_LIVE_MODEL ||
    import.meta.env.VITE_GEMINI_LIVE_MODEL ||
    "") + "";

// Guard against cross-backend model mismatch (e.g. .env having 2.5 hardcoded while using google-ai):
const GEMINI_LIVE_MODEL =
  GEMINI_LIVE_USES_VERTEX
    ? configuredModel.includes("2.5") ? configuredModel : DEFAULT_GEMINI_LIVE_MODEL
    : configuredModel.includes("3.1") ? configuredModel : DEFAULT_GEMINI_LIVE_MODEL;

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
// Cost guardrails: Gemini Live bills audio input/output and accumulated session
// context. Keep these defaults conservative so Tutor stays realtime without
// streaming silence or growing one expensive session forever.
// #3 VAD tuning: a lower loudness threshold catches softer speech, and a longer
// pre-roll keeps more of the word onset (the quiet start of "bon"/"pomeriggio") that
// the old 360ms window was clipping — clipped onsets are a top cause of misreads.
// All overridable via env so they can be A/B tuned without code changes.
const INPUT_SILENCE_RMS_THRESHOLD = Number(
  import.meta.env.VITE_GEMINI_LIVE_INPUT_RMS_THRESHOLD || 0.005,
);
const INPUT_PREROLL_MS = Number(
  import.meta.env.VITE_GEMINI_LIVE_INPUT_PREROLL_MS || 700,
);
const INPUT_SPEECH_HOLD_MS = Number(
  import.meta.env.VITE_GEMINI_LIVE_INPUT_SPEECH_HOLD_MS || 2200,
);

// #1 Capture tuning: the "voice call" DSP (echo cancellation / noise suppression /
// auto gain) is tuned for phone-call intelligibility, not ASR fidelity — it distorts
// consonants, pumps levels mid-word, and on mobile often flips the mic into a
// narrowband "communications" capture mode. All three default OFF for cleaner audio.
// Echo cancellation is safe to disable here because the Tutor is strictly turn-based:
// the mic track is hard-muted while the tutor speaks and only re-opens after the
// playback analyser detects ~1.1s of silence (scheduleAssistantUnlockAfterQuiet), so
// the tutor's own voice never overlaps an open mic — there is no echo to cancel.
// All overridable via env (set to "true") for A/B testing or noisy/speakerphone setups.
const INPUT_ECHO_CANCELLATION =
  import.meta.env.VITE_GEMINI_LIVE_ECHO_CANCELLATION === "true";
const INPUT_NOISE_SUPPRESSION =
  import.meta.env.VITE_GEMINI_LIVE_NOISE_SUPPRESSION === "true";
const INPUT_AUTO_GAIN_CONTROL =
  import.meta.env.VITE_GEMINI_LIVE_AUTO_GAIN_CONTROL === "true";
// Periodic Live-session resets were meant to cap accumulated context cost, but
// reconnecting mid-lesson is too risky for the voice loop: it can drop the next
// learner turn or leave a queued tutor response waiting on a slow reconnect.
// Keep the knob for explicit experiments, but default to no automatic reset.
const SESSION_RESPONSE_LIMIT = Math.max(
  0,
  Number(import.meta.env.VITE_GEMINI_LIVE_SESSION_RESPONSE_LIMIT || 0),
);
const MANUAL_RESPONSE_START_TIMEOUT_MS = Math.max(
  5000,
  Number(import.meta.env.VITE_GEMINI_LIVE_RESPONSE_START_TIMEOUT_MS || 20000),
);

const AUDIO_WORKLET_NAME = "nosabos-gemini-live-audio";
const AUDIO_WORKLET_SOURCE = `
class NosabosGeminiLiveAudio extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options.processorOptions.targetSampleRate || 16000;
    this.inputSampleRate = sampleRate;
    this.ratio = this.inputSampleRate / this.targetSampleRate;

    // #2 Anti-aliasing: before decimating to the target rate, low-pass just below the
    // target Nyquist so high-frequency energy does not fold back as aliasing noise
    // (which smears the consonant/vowel cues ASR depends on). RBJ cookbook biquad LPF.
    const cutoff = Math.min(this.targetSampleRate * 0.45, this.inputSampleRate * 0.45);
    const w0 = (2 * Math.PI * cutoff) / this.inputSampleRate;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const q = 0.707;
    const alpha = sinw0 / (2 * q);
    const a0 = 1 + alpha;
    this.b0 = ((1 - cosw0) / 2) / a0;
    this.b1 = (1 - cosw0) / a0;
    this.b2 = ((1 - cosw0) / 2) / a0;
    this.a1 = (-2 * cosw0) / a0;
    this.a2 = (1 - alpha) / a0;
    this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0;

    // Resampler state, carried across render quanta so block boundaries stay smooth.
    this.readPos = 0;
    this.prevSample = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || !input[0].length) return true;
    const pcm = input[0];
    const n = pcm.length;

    // 1) Low-pass the block (biquad state persists across quanta).
    const filtered = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const x0 = pcm[i];
      const y0 =
        this.b0 * x0 + this.b1 * this.x1 + this.b2 * this.x2 -
        this.a1 * this.y1 - this.a2 * this.y2;
      this.x2 = this.x1; this.x1 = x0;
      this.y2 = this.y1; this.y1 = y0;
      filtered[i] = y0;
    }

    // 2) Rate-convert with linear interpolation. readPos is fractional and carried
    //    across blocks; a negative index interpolates against the previous block's
    //    last sample so there are no clicks at the boundary.
    const out = [];
    let readPos = this.readPos;
    while (readPos < n - 1) {
      const idx = Math.floor(readPos);
      const frac = readPos - idx;
      const s0 = idx < 0 ? this.prevSample : filtered[idx];
      const s1 = filtered[idx + 1];
      out.push(s0 + (s1 - s0) * frac);
      readPos += this.ratio;
    }
    this.readPos = readPos - n;
    this.prevSample = filtered[n - 1];

    // 3) Float -> Int16 PCM.
    const int16 = new Int16Array(out.length);
    for (let i = 0; i < out.length; i += 1) {
      const s = Math.max(-1, Math.min(1, out[i]));
      int16[i] = s < 0 ? s * 32768 : s * 32767;
    }
    if (int16.length) {
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}

registerProcessor("${AUDIO_WORKLET_NAME}", NosabosGeminiLiveAudio);
`;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getPcm16Rms(arrayBuffer) {
  const samples = new Int16Array(arrayBuffer);
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const normalized = samples[i] / 32768;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

function getPcm16DurationMs(arrayBuffer) {
  return (new Int16Array(arrayBuffer).length / INPUT_SAMPLE_RATE) * 1000;
}

function buildLiveGenerationConfig({
  includeTranscriptions = true,
  voice = DEFAULT_GEMINI_LIVE_VOICE,
  includeSpeechConfig = true,
  inputLanguageCodes = null,
} = {}) {
  const generationConfig = {
    responseModalities: [ResponseModality.AUDIO],
  };

  if (includeSpeechConfig) {
    generationConfig.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: normalizeGeminiLiveVoice(voice),
        },
      },
    };
  }

  if (includeTranscriptions) {
    // Hint the language of the learner's audio (BCP-47, e.g. ["fr-FR"]) so input
    // transcription does not drift to a phonetically close language — the bug where
    // spoken French was transcribed as Italian. This is a hint, not a hard lock.
    // Note: the Firebase AI `AudioTranscriptionConfig` type is empty, but the SDK
    // forwards this object verbatim into the Live `setup` message, so languageCodes
    // reaches the backend at runtime.
    generationConfig.inputAudioTranscription =
      Array.isArray(inputLanguageCodes) && inputLanguageCodes.length
        ? { languageCodes: inputLanguageCodes }
        : {};
    generationConfig.outputAudioTranscription = {};
  }
  return generationConfig;
}

function serverContentFromMessage(message) {
  return (
    message?.serverContent ||
    (message?.type === "serverContent" ? message : null)
  );
}

function textFromModelTurn(modelTurn) {
  const parts = Array.isArray(modelTurn?.parts) ? modelTurn.parts : [];
  return parts
    .map((part) =>
      typeof part?.text === "string" && part?.thought !== true ? part.text : "",
    )
    .filter(Boolean)
    .join(" ");
}

function audioPartsFromModelTurn(modelTurn) {
  const parts = Array.isArray(modelTurn?.parts) ? modelTurn.parts : [];
  return parts
    .map((part) => part?.inlineData)
    .filter(
      (inlineData) =>
        inlineData?.data && /^audio\//i.test(inlineData?.mimeType || ""),
    );
}

function getGeminiLiveAI() {
  return getAI(app, {
    backend: GEMINI_LIVE_USES_VERTEX
      ? new VertexAIBackend(GEMINI_LIVE_LOCATION)
      : new GoogleAIBackend(),
  });
}

async function connectLiveSession({
  voice = DEFAULT_GEMINI_LIVE_VOICE,
  includeTranscriptions = true,
  inputLanguageCodes = null,
  tools = null,
  systemInstruction = null,
} = {}) {
  const ai = getGeminiLiveAI();
  const configs = [
    buildLiveGenerationConfig({
      includeTranscriptions,
      includeSpeechConfig: true,
      voice,
      inputLanguageCodes,
    }),
    buildLiveGenerationConfig({
      includeTranscriptions: false,
      includeSpeechConfig: true,
      voice,
      inputLanguageCodes,
    }),
    buildLiveGenerationConfig({
      includeTranscriptions,
      includeSpeechConfig: false,
      voice,
      inputLanguageCodes,
    }),
    buildLiveGenerationConfig({
      includeTranscriptions: false,
      includeSpeechConfig: false,
      voice,
      inputLanguageCodes,
    }),
  ];
  let firstError = null;

  for (const config of configs) {
    try {
      const liveModel = getLiveGenerativeModel(ai, {
        model: GEMINI_LIVE_MODEL,
        generationConfig: config,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(Array.isArray(tools) && tools.length ? { tools } : {}),
      });
      return await liveModel.connect();
    } catch (error) {
      firstError ||= error;
    }
  }

  throw firstError || new Error("Could not connect to Gemini Live.");
}

function schedulePcmAudio({
  audioContext,
  destination,
  scheduledSources,
  nextStartTime,
  base64Audio,
}) {
  const bytes = fromBase64(base64Audio);
  const evenLength = bytes.byteLength - (bytes.byteLength % 2);
  const samples = new Int16Array(bytes, 0, evenLength / 2);
  const buffer = audioContext.createBuffer(
    1,
    samples.length,
    OUTPUT_SAMPLE_RATE,
  );
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) {
    channel[i] = samples[i] / 32768;
  }
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);
  scheduledSources.add(source);
  source.onended = () => scheduledSources.delete(source);
  const startTime = Math.max(audioContext.currentTime + 0.02, nextStartTime);
  source.start(startTime);
  return startTime + buffer.duration;
}

function waitForAudioSchedule(audioContext, nextStartTime) {
  const delayMs = Math.max(
    0,
    (nextStartTime - audioContext.currentTime) * 1000,
  );
  return new Promise((resolve) => setTimeout(resolve, delayMs + 120));
}

export async function createGeminiLiveVoicePreviewPlayer({
  text = "",
  voice = DEFAULT_GEMINI_LIVE_VOICE,
  personality = "",
  language = "en",
} = {}) {
  if (
    typeof AudioContext === "undefined" &&
    typeof webkitAudioContext === "undefined"
  ) {
    throw new Error("Web Audio is not supported in this browser.");
  }

  const Ctx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new Ctx();
  if (audioContext.state === "suspended") await audioContext.resume();

  const destination = audioContext.createMediaStreamDestination();
  const audio = new Audio();
  audio.srcObject = destination.stream;
  audio.autoplay = true;
  audio.playsInline = true;
  audio.muted = false;
  audio.volume = 1;

  const session = await connectLiveSession({
    voice: normalizeGeminiLiveVoice(voice),
    includeTranscriptions: false,
  });
  const scheduledSources = new Set();
  let nextStartTime = audioContext.currentTime + 0.02;
  let cleanedUp = false;
  let readyResolved = false;
  let resolveReady;
  let rejectReady;
  let resolveFinalize;
  let rejectFinalize;

  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const finalize = new Promise((resolve, reject) => {
    resolveFinalize = resolve;
    rejectFinalize = reject;
  });

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    for (const source of scheduledSources) {
      try {
        source.stop(0);
      } catch {
        // The preview source may already have ended.
      }
    }
    scheduledSources.clear();
    try {
      await session?.close?.();
    } catch {
      // The preview socket may already be closed.
    }
    try {
      await audioContext.close?.();
    } catch {
      // The preview context may already be closed.
    }
  };

  const previewPrompt = [
    personality
      ? `Use this tutor personality and style: ${String(personality).slice(0, 240)}.`
      : "Use a friendly, encouraging tutor style.",
    `Speak in ${language}.`,
    `Say only this short voice preview, without adding extra words: ${text || "Hi, I am ready to practice with you."}`,
  ].join(" ");

  (async () => {
    try {
      await session.send(previewPrompt, true);
      for await (const message of session.receive()) {
        if (cleanedUp) break;
        const serverContent = serverContentFromMessage(message);
        if (!serverContent) continue;
        for (const inlineData of audioPartsFromModelTurn(
          serverContent.modelTurn,
        )) {
          nextStartTime = schedulePcmAudio({
            audioContext,
            destination,
            scheduledSources,
            nextStartTime,
            base64Audio: inlineData.data,
          });
          if (!readyResolved) {
            readyResolved = true;
            resolveReady?.();
          }
        }
        if (serverContent.turnComplete) break;
      }
      if (!readyResolved) {
        readyResolved = true;
        resolveReady?.();
      }
      await waitForAudioSchedule(audioContext, nextStartTime);
      resolveFinalize?.();
    } catch (error) {
      if (!readyResolved) rejectReady?.(error);
      rejectFinalize?.(error);
    } finally {
      await cleanup();
    }
  })();

  return { audio, ready, finalize, cleanup };
}

export async function createGeminiLiveRealtimeBridge({
  audioElement = null,
  initialInstructions = "",
  responseInstructionsSuffix = "",
  voice = DEFAULT_GEMINI_LIVE_VOICE,
  inputLanguageCodes = null,
  tools = null,
  onEvent,
  onAudioGraph,
  onError,
} = {}) {
  const bridge = new GeminiLiveRealtimeBridge({
    audioElement,
    initialInstructions,
    responseInstructionsSuffix,
    voice,
    inputLanguageCodes,
    tools,
    onEvent,
    onAudioGraph,
    onError,
  });
  await bridge.connect();
  return bridge;
}

class GeminiLiveRealtimeBridge {
  constructor({
    audioElement,
    initialInstructions,
    responseInstructionsSuffix,
    voice,
    inputLanguageCodes,
    tools,
    onEvent,
    onAudioGraph,
    onError,
  }) {
    this.audioElement = audioElement;
    this.instructions = initialInstructions || "";
    this.responseInstructionsSuffix = String(
      responseInstructionsSuffix || "",
    ).trim();
    this.voice = normalizeGeminiLiveVoice(voice);
    this.inputLanguageCodes = Array.isArray(inputLanguageCodes)
      ? inputLanguageCodes
      : null;
    this.tools = Array.isArray(tools) && tools.length ? tools : null;
    this.speechHoldMs = INPUT_SPEECH_HOLD_MS;
    this.onEvent = onEvent;
    this.onAudioGraph = onAudioGraph;
    this.onError = onError;
    this.readyState = "connecting";
    this.session = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.micSource = null;
    this.playbackDestination = null;
    this.playbackAnalyser = null;
    this.playbackFloatBuffer = null;
    this.playbackGain = null;
    this.outputGain = 1;
    this.receiveLoopPromise = null;
    this.closed = false;
    this.pendingResponses = [];
    this.pendingManualResponses = [];
    this.activeResponse = null;
    this.scheduledSources = new Set();
    this.nextStartTime = 0;
    this.inputTranscript = "";
    this.suppressAutoTurn = false;
    this.desiredInputAudioEnabled = true;
    this.inputAudioEnabled = true;
    this.inputSpeechActiveUntil = 0;
    this.inputPrerollBuffers = [];
    this.inputPrerollDurationMs = 0;
    this.completedResponsesSinceReset = 0;
    this.resetPending = false;
    this.resettingSession = false;
    this.responseBuffer = [];
    this.responseTimer = null;
    this.serverTurnComplete = false;
  }

  setResponseInstructionsSuffix(instructions = "") {
    this.responseInstructionsSuffix = String(instructions || "").trim();
  }

  async connect() {
    if (
      typeof AudioContext === "undefined" &&
      typeof webkitAudioContext === "undefined"
    ) {
      throw new Error("Web Audio is not supported in this browser.");
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    this.session = await this.connectLiveSession();
    await this.setupAudio();
    this.readyState = "open";
    // Billing visibility: which model/backend this session bills against.
    console.info(
      "[gemini-live] connected — model:",
      GEMINI_LIVE_MODEL,
      "backend:",
      GEMINI_LIVE_USES_VERTEX ? "vertex" : "google-ai",
      "location:",
      GEMINI_LIVE_LOCATION,
    );
    this.emit({ type: "session.updated" });
    this.receiveLoopPromise = this.receiveLoop();
  }

  async connectLiveSession() {
    // TEMP debug (remove after verifying the input-language hint): logs exactly what
    // inputAudioTranscription this live session will send — fires on the initial
    // connect and on every periodic session reset, so the hint should persist.
    console.info(
      "[gemini-live] live session inputAudioTranscription:",
      Array.isArray(this.inputLanguageCodes) && this.inputLanguageCodes.length
        ? { languageCodes: this.inputLanguageCodes }
        : {},
    );
    const systemInstruction = [
      this.instructions,
      this.responseInstructionsSuffix,
    ]
      .filter(Boolean)
      .join("\n\n");

    return connectLiveSession({
      voice: this.voice,
      includeTranscriptions: true,
      inputLanguageCodes: this.inputLanguageCodes,
      tools: this.tools,
      systemInstruction: systemInstruction || null,
    });
  }

  async setupAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") await ctx.resume();
    this.audioContext = ctx;
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: INPUT_ECHO_CANCELLATION,
        noiseSuppression: INPUT_NOISE_SUPPRESSION,
        autoGainControl: INPUT_AUTO_GAIN_CONTROL,
      },
    });

    const workletBlob = new Blob([AUDIO_WORKLET_SOURCE], {
      type: "application/javascript",
    });
    const workletUrl = URL.createObjectURL(workletBlob);
    try {
      await ctx.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }

    this.micSource = ctx.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(ctx, AUDIO_WORKLET_NAME, {
      processorOptions: { targetSampleRate: INPUT_SAMPLE_RATE },
    });
    this.workletNode.port.onmessage = (event) => {
      if (this.closed || this.readyState !== "open") return;
      const buffer = event.data;
      if (!buffer?.byteLength) return;
      // Do not send raw worklet buffers directly. This path enforces the
      // cost gate so muted/thinking/silent time does not become billable audio.
      this.handleInputAudioBuffer(buffer);
    };
    this.micSource.connect(this.workletNode);

    this.playbackDestination = ctx.createMediaStreamDestination();
    this.playbackAnalyser = ctx.createAnalyser();
    this.playbackAnalyser.fftSize = 256;
    this.playbackAnalyser.smoothingTimeConstant = 0.12;
    // Keep both playback processing nodes AFTER the analyser so neither the user's
    // volume boost nor peak limiting changes the turn-taking quiet detector.
    this.playbackGain = ctx.createGain();
    this.playbackGain.gain.value = this.outputGain;
    this.playbackAnalyser.connect(this.playbackGain);
    // Connect directly to the hardware audio destination for clean, unclipped,
    // natural speech output without compressor intermodulation distortion.
    this.playbackGain.connect(ctx.destination);
    // Keep playbackDestination solely for the capture stream used by MediaRecorder (clip replay).
    this.playbackGain.connect(this.playbackDestination);
    this.playbackFloatBuffer = new Float32Array(this.playbackAnalyser.fftSize);

    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }

    this.onAudioGraph?.({
      audioContext: ctx,
      analyser: this.playbackAnalyser,
      floatBuffer: this.playbackFloatBuffer,
      stream: this.playbackDestination.stream,
    });
  }

  send(raw) {
    if (this.closed || this.readyState !== "open") {
      throw new Error("Gemini Live session is not open.");
    }
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (payload?.type === "session.update") {
      const session = payload.session || {};
      if (typeof session.instructions === "string") {
        this.instructions = session.instructions;
      }
      if (typeof session.voice === "string") {
        this.voice = normalizeGeminiLiveVoice(session.voice);
      }
      if (Object.prototype.hasOwnProperty.call(session, "turn_detection")) {
        this.setInputAudioEnabled(!!session.turn_detection);
        if (
          session.turn_detection &&
          typeof session.turn_detection === "object"
        ) {
          const silenceMs = Number(session.turn_detection.silence_duration_ms);
          if (Number.isFinite(silenceMs) && silenceMs > 0) {
            this.speechHoldMs = silenceMs;
          }
        }
      }
      this.emit({ type: "session.updated" });
      return;
    }

    if (payload?.type === "input_audio_buffer.clear") {
      this.inputTranscript = "";
      return;
    }

    if (payload?.type === "response.create") {
      const response = payload.response || {};
      this.requestResponse(
        response.instructions || "",
        response.metadata || {},
      );
      return;
    }

    if (payload?.type === "response.cancel") {
      this.pendingManualResponses = [];
      this.pendingResponses = [];
      this.finishActiveResponse("response.canceled");
      this.interruptPlayback();
      return;
    }
  }

  requestResponse(instructions, metadata = {}) {
    const rid = `gemini_${uid()}`;
    const response = {
      id: rid,
      metadata,
      text: "",
      modelTextFallback: "",
      hasOutputTranscription: false,
      started: false,
      prompt: "",
      startTimeoutId: null,
    };

    const trimmed = String(instructions || "").trim();
    // Keep mid-turn prompts clean and minimal: the full persona and session rules
    // are already established in systemInstruction. Stripping "Internal tutor control message..."
    // and session repeats prevents Gemini 2.5 native-audio decoder artifacts (control token leakage).
    response.prompt = trimmed || "Respond to the learner now.";

    this.pendingManualResponses.push(response);
    this.dispatchNextManualResponse();
  }

  clearManualResponseStartTimeout(response) {
    if (!response?.startTimeoutId) return;
    clearTimeout(response.startTimeoutId);
    response.startTimeoutId = null;
  }

  emitResponseCanceled(response, reason = "") {
    if (!response) return;
    this.clearManualResponseStartTimeout(response);
    this.emit({
      type: "response.canceled",
      response_id: response.id,
      response: { id: response.id, metadata: response.metadata || {} },
      ...(reason ? { error: { message: reason } } : {}),
    });
  }

  scheduleManualResponseStartTimeout(response) {
    this.clearManualResponseStartTimeout(response);
    response.startTimeoutId = setTimeout(() => {
      if (this.closed || this.resettingSession) return;
      if (this.activeResponse === response || response.started) return;
      const pendingIndex = this.pendingResponses.indexOf(response);
      if (pendingIndex === -1) return;
      this.pendingResponses.splice(pendingIndex, 1);
      this.emitResponseCanceled(
        response,
        "Gemini Live did not start a response in time.",
      );
      this.dispatchNextManualResponse();
    }, MANUAL_RESPONSE_START_TIMEOUT_MS);
  }

  dispatchNextManualResponse({ allowWhileSuppressingAutoTurn = false } = {}) {
    if (
      this.closed ||
      !this.session ||
      this.resettingSession ||
      this.activeResponse ||
      (this.suppressAutoTurn && !allowWhileSuppressingAutoTurn) ||
      this.pendingResponses.length ||
      !this.pendingManualResponses.length
    ) {
      return;
    }

    if (this.resetPending) {
      this.resetLiveSessionSoon();
      return;
    }

    const response = this.pendingManualResponses.shift();
    this.pendingResponses.push(response);
    this.scheduleManualResponseStartTimeout(response);
    this.setInputAudioEnabled(false);
    this.session
      .send(response.prompt || "Respond now.", true)
      .catch((error) => {
        this.clearManualResponseStartTimeout(response);
        this.pendingResponses = this.pendingResponses.filter(
          (item) => item !== response,
        );
        this.emitResponseCanceled(response, error?.message || String(error));
        this.handleError(error);
        this.dispatchNextManualResponse();
      });
  }

  // Answer a model tool call (e.g. markTurnSuccessful) so the live turn can
  // continue. On the Vertex backend FunctionResponse.id is undefined and the
  // SDK matches responses by name; on the Google AI backend the id is echoed.
  async sendToolResponses(functionResponses) {
    if (this.closed || !this.session) return;
    if (!Array.isArray(functionResponses) || !functionResponses.length) return;
    try {
      await this.session.sendFunctionResponses(functionResponses);
    } catch (error) {
      this.handleError(error);
    }
  }

  async receiveLoop() {
    try {
      for await (const message of this.session.receive()) {
        if (this.closed) break;
        await this.handleServerMessage(message);
      }
    } catch (error) {
      if (!this.closed && !this.resettingSession) this.handleError(error);
    }
  }

  // Live usage accounting: the Live API reports usageMetadata per generation —
  // prompt tokens INCLUDE the accumulated session context (all prior audio +
  // text re-processed each turn), which is the compounding cost driver on long
  // sessions. Logs a per-turn breakdown plus a running cost estimate at the
  // Agent Platform Gemini 2.5 Flash Live pricing ($/1M: audio-in 3,
  // text-in 0.50, audio-out 12, text-out/thoughts 2.00).
  recordUsageMetadata(usage) {
    if (!usage || typeof usage !== "object") return;
    if (!this.sessionUsage) {
      this.sessionUsage = {
        turns: 0,
        promptAudio: 0,
        promptText: 0,
        promptOther: 0,
        outputAudio: 0,
        outputText: 0,
        thoughts: 0,
      };
    }
    const modalitySum = (details, modality) =>
      (Array.isArray(details) ? details : [])
        .filter(
          (entry) =>
            String(entry?.modality || "").toUpperCase() === modality,
        )
        .reduce((sum, entry) => sum + (Number(entry?.tokenCount) || 0), 0);
    const promptDetails =
      usage.promptTokensDetails || usage.promptTokenDetails || [];
    const outputDetails =
      usage.candidatesTokensDetails ||
      usage.responseTokensDetails ||
      usage.candidatesTokenDetails ||
      [];
    const promptAudio = modalitySum(promptDetails, "AUDIO");
    const promptText = modalitySum(promptDetails, "TEXT");
    const outputAudio = modalitySum(outputDetails, "AUDIO");
    const outputText = modalitySum(outputDetails, "TEXT");
    const thoughts = Number(usage.thoughtsTokenCount) || 0;
    const promptTotal =
      Number(usage.promptTokenCount) || promptAudio + promptText;
    const promptOther = Math.max(0, promptTotal - promptAudio - promptText);

    const totals = this.sessionUsage;
    totals.turns += 1;
    totals.promptAudio += promptAudio;
    totals.promptText += promptText;
    totals.promptOther += promptOther;
    totals.outputAudio += outputAudio;
    totals.outputText += outputText;
    totals.thoughts += thoughts;

    const estUsd = GEMINI_LIVE_USES_VERTEX
      ? (totals.promptAudio * 3 +
          (totals.promptText + totals.promptOther) * 0.5 +
          totals.outputAudio * 12 +
          (totals.outputText + totals.thoughts) * 2) /
        1e6
      : (totals.promptAudio * 3 +
          (totals.promptText + totals.promptOther) * 0.75 +
          totals.outputAudio * 12 +
          (totals.outputText + totals.thoughts) * 4.5) /
        1e6;
    console.info(
      `[gemini-live] usage turn ${totals.turns}: prompt ${promptTotal} (audio ${promptAudio}, text ${promptText}), output audio ${outputAudio} / text ${outputText} / thoughts ${thoughts} | session ≈ $${estUsd.toFixed(4)}`,
    );
  }

  async handleServerMessage(message) {
    if (message?.usageMetadata) this.recordUsageMetadata(message.usageMetadata);
    // Tutor no longer applies learner-pause output buffering. Manual responses
    // should surface as soon as Gemini emits them; input gating still controls what
    // mic audio is sent upstream.
    const delayRemaining = 0;

    // Tool calls and cancellations arrive on the same receive() stream as
    // serverContent. Surface them to the consumer (Tutor) before the
    // serverContent early-return below would silently drop them.
    if (message?.type === "toolCall" && Array.isArray(message.functionCalls)) {
      this.emitOrBuffer(
        {
          type: "event",
          event: { type: "tool.call", functionCalls: message.functionCalls },
        },
        delayRemaining,
      );
      return;
    }
    if (message?.type === "toolCallCancellation") {
      const functionIds = Array.isArray(message.functionIds)
        ? message.functionIds
        : Array.isArray(message.ids)
          ? message.ids
          : [];
      this.emitOrBuffer(
        { type: "event", event: { type: "tool.cancel", functionIds } },
        delayRemaining,
      );
      return;
    }

    const serverContent = serverContentFromMessage(message);
    if (!serverContent) return;

    if (serverContent.inputTranscription?.text) {
      this.inputTranscript += serverContent.inputTranscription.text;
    }

    const interruptedSuppressedAutoTurn =
      !!serverContent.interrupted && this.suppressAutoTurn;
    if (serverContent.interrupted) {
      this.suppressAutoTurn = false;
      this.finishActiveResponse("response.canceled");
      this.interruptPlayback();
      if (this.responseTimer) {
        clearTimeout(this.responseTimer);
        this.responseTimer = null;
      }
      this.responseBuffer = [];
      if (interruptedSuppressedAutoTurn) {
        // A manual Tutor prompt intentionally interrupted Gemini's automatic VAD
        // reply. Drop every remaining fragment from that old reply; the next
        // server payload belongs to the already-pending manual response.
        this.dispatchNextManualResponse();
        return;
      }
    }

    const hasModelTurn = !!serverContent.modelTurn;
    const hasOutput = hasModelTurn || !!serverContent.outputTranscription?.text;
    const isUnrequestedOutput =
      hasOutput &&
      !this.activeResponse &&
      this.pendingResponses.length === 0 &&
      this.pendingManualResponses.length === 0;
    let beganSuppressingAutoTurn = false;

    if (isUnrequestedOutput) {
      // Gemini's default automatic VAD has already started an unsolicited model
      // turn. Gate manual dispatch BEFORE delivering the transcript: the transcript
      // callback synchronously queues the app-directed Tutor response, and setting
      // this afterward lets that second request interrupt/overlap the automatic one.
      this.suppressAutoTurn = true;
      beganSuppressingAutoTurn = true;
      if (this.inputTranscript.trim()) {
        await this.finalizeInputTranscript();
      }
    }

    if (hasModelTurn && this.inputTranscript.trim() && !this.activeResponse) {
      // Same ordering guarantee for payload shapes where modelTurn is the first
      // indication that Gemini began its automatic response.
      this.suppressAutoTurn = true;
      beganSuppressingAutoTurn = true;
      await this.finalizeInputTranscript();
    }

    if (beganSuppressingAutoTurn) {
      // Preserve the existing low-latency behavior: send the queued app-directed
      // prompt now so it interrupts the unwanted automatic reply. Suppression stays
      // active until the matching interrupted/turnComplete signal is discarded.
      this.dispatchNextManualResponse({
        allowWhileSuppressingAutoTurn: true,
      });
    }

    if (this.suppressAutoTurn) {
      if (serverContent.turnComplete || serverContent.interrupted) {
        this.suppressAutoTurn = false;
        this.dispatchNextManualResponse();
      }
      return;
    }

    if (hasModelTurn || serverContent.outputTranscription?.text) {
      this.ensureActiveResponse(delayRemaining);
    }

    if (this.activeResponse && serverContent.outputTranscription?.text) {
      this.activeResponse.hasOutputTranscription = true;
      this.activeResponse.text += serverContent.outputTranscription.text;
      this.emitOrBuffer(
        {
          type: "event",
          event: {
            type: "response.audio_transcript.delta",
            response_id: this.activeResponse.id,
            delta: serverContent.outputTranscription.text,
          },
        },
        delayRemaining,
      );
    }

    const modelText = textFromModelTurn(serverContent.modelTurn);
    if (this.activeResponse && modelText) {
      // In AUDIO mode, outputTranscription is the learner-facing transcript of
      // modelTurn's audio. Some Gemini/SDK payloads also contain text parts in
      // modelTurn; emitting both produces two paraphrased replies in one bubble.
      // Hold model text only as a fallback for sessions where transcription was
      // unavailable, and choose that fallback once the server closes the turn.
      this.activeResponse.modelTextFallback += `${
        this.activeResponse.modelTextFallback ? " " : ""
      }${modelText}`;
    }

    const audioParts = audioPartsFromModelTurn(serverContent.modelTurn);
    if (audioParts.length) {
      for (const inlineData of audioParts) {
        this.emitOrBuffer(
          { type: "audio", data: inlineData.data },
          delayRemaining,
        );
      }
    }

    if (serverContent.turnComplete && this.activeResponse) {
      this.flushModelTextFallback(delayRemaining);
      this.serverTurnComplete = true;
      this.emitOrBuffer({ type: "turnComplete" }, delayRemaining);
    }

    if (serverContent.turnComplete && this.inputTranscript.trim()) {
      await this.finalizeInputTranscript();
    }
  }

  applyInputAudioEnabled() {
    // This is the billing gate, not only a UI mute. Disabled means no PCM
    // audio is sent to Gemini Live. Session resets temporarily force the
    // effective gate closed without changing the Tutor's latest desired state.
    const enabled = !!this.desiredInputAudioEnabled && !this.resettingSession;
    this.inputAudioEnabled = enabled;
    try {
      this.mediaStream?.getAudioTracks?.().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {
      // Track state is best-effort; the bridge-level gate below is authoritative.
    }
    if (!enabled) {
      this.inputSpeechActiveUntil = 0;
      this.inputPrerollBuffers = [];
      this.inputPrerollDurationMs = 0;
    }
  }

  setInputAudioEnabled(enabled) {
    this.desiredInputAudioEnabled = !!enabled;
    this.applyInputAudioEnabled();
  }

  handleInputAudioBuffer(buffer) {
    if (
      this.closed ||
      this.readyState !== "open" ||
      this.resettingSession ||
      !this.inputAudioEnabled
    ) {
      return;
    }

    const rms = getPcm16Rms(buffer);
    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const durationMs = getPcm16DurationMs(buffer);
    const isSpeech = rms >= INPUT_SILENCE_RMS_THRESHOLD;

    if (isSpeech) {
      this.inputSpeechActiveUntil =
        now + (this.speechHoldMs || INPUT_SPEECH_HOLD_MS);
      if (this.responseTimer) {
        clearTimeout(this.responseTimer);
        this.responseTimer = null;
      }
      if (this.responseBuffer.length > 0) {
        console.log(
          `[gemini-live] User started speaking, discarding ${this.responseBuffer.length} buffered items`,
        );
        this.responseBuffer = [];
      }
    }

    if (now <= this.inputSpeechActiveUntil) {
      if (this.inputPrerollBuffers.length) {
        const preroll = this.inputPrerollBuffers;
        this.inputPrerollBuffers = [];
        this.inputPrerollDurationMs = 0;
        for (const prerollBuffer of preroll) {
          this.sendInputAudioBuffer(prerollBuffer);
        }
      }
      this.sendInputAudioBuffer(buffer);
      return;
    }

    this.inputPrerollBuffers.push(buffer);
    this.inputPrerollDurationMs += durationMs;
    while (
      this.inputPrerollBuffers.length &&
      this.inputPrerollDurationMs > INPUT_PREROLL_MS
    ) {
      const dropped = this.inputPrerollBuffers.shift();
      this.inputPrerollDurationMs -= getPcm16DurationMs(dropped);
    }
  }

  sendInputAudioBuffer(buffer) {
    if (
      this.closed ||
      this.readyState !== "open" ||
      this.resettingSession ||
      !this.session ||
      !buffer?.byteLength
    ) {
      return;
    }
    this.session
      .sendAudioRealtime({
        mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
        data: toBase64(buffer),
      })
      .catch((error) => this.handleError(error));
  }

  ensureActiveResponse(delayRemaining = 0) {
    if (this.activeResponse) return this.activeResponse;
    this.activeResponse = this.pendingResponses.shift() || {
      id: `gemini_${uid()}`,
      metadata: {},
      text: "",
      modelTextFallback: "",
      hasOutputTranscription: false,
      started: false,
      startTimeoutId: null,
    };
    this.serverTurnComplete = false;
    this.clearManualResponseStartTimeout(this.activeResponse);
    if (!this.activeResponse.started) {
      this.activeResponse.started = true;
      this.emitOrBuffer(
        {
          type: "event",
          event: {
            type: "response.created",
            response: {
              id: this.activeResponse.id,
              metadata: this.activeResponse.metadata || {},
            },
          },
        },
        delayRemaining,
      );
    }
    return this.activeResponse;
  }

  flushModelTextFallback(delayRemaining = 0) {
    const response = this.activeResponse;
    if (
      !response ||
      response.hasOutputTranscription ||
      !response.modelTextFallback
    ) {
      return;
    }
    const text = response.modelTextFallback;
    response.modelTextFallback = "";
    response.text += text;
    this.emitOrBuffer(
      {
        type: "event",
        event: {
          type: "response.text.delta",
          response_id: response.id,
          delta: text,
        },
      },
      delayRemaining,
    );
  }

  async finalizeInputTranscript() {
    const transcript = this.inputTranscript.replace(/\s+/g, " ").trim();
    this.inputTranscript = "";
    if (!transcript) return;
    await this.emit({ type: "input_audio_buffer.speech_stopped" });
    await this.emit({ type: "input_audio_buffer.committed" });
    await this.emit({
      type: "conversation.item.input_audio_transcription.completed",
      transcript,
    });
  }

  playAudio(base64Audio) {
    if (!base64Audio || !this.audioContext || !this.playbackAnalyser) return;
    try {
      const bytes = fromBase64(base64Audio);
      const evenLength = bytes.byteLength - (bytes.byteLength % 2);
      const samples = new Int16Array(bytes, 0, evenLength / 2);
      const buffer = this.audioContext.createBuffer(
        1,
        samples.length,
        OUTPUT_SAMPLE_RATE,
      );
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) {
        channel[i] = samples[i] / 32768;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.playbackAnalyser);
      source.onended = () => {
        this.scheduledSources.delete(source);
        this.checkAndFinalizeResponse();
      };
      this.scheduledSources.add(source);
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
      this.nextStartTime = Math.max(
        this.audioContext.currentTime + 0.02,
        this.nextStartTime,
      );
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
    } catch (error) {
      this.handleError(error);
    }
  }

  emitOrBuffer(item, delayRemaining) {
    if (delayRemaining > 0) {
      this.responseBuffer.push(item);
      this.scheduleResponseBuffer(delayRemaining);
    } else {
      this.flushResponseItem(item);
    }
  }

  flushResponseItem(item) {
    if (item.type === "audio") {
      this.playAudio(item.data);
    } else if (item.type === "event") {
      this.emit(item.event);
    } else if (item.type === "turnComplete") {
      this.checkAndFinalizeResponse();
    }
  }

  scheduleResponseBuffer(delayMs) {
    if (this.responseTimer) return;
    this.responseTimer = setTimeout(() => {
      this.responseTimer = null;
      if (this.closed || this.resettingSession) return;
      console.log(
        `[gemini-live] VAD pause elapsed, flushing ${this.responseBuffer.length} buffered items`,
      );
      const items = this.responseBuffer;
      this.responseBuffer = [];
      for (const item of items) {
        this.flushResponseItem(item);
      }
    }, delayMs);
  }

  checkAndFinalizeResponse() {
    if (
      this.serverTurnComplete &&
      this.activeResponse &&
      this.responseBuffer.length === 0 &&
      this.scheduledSources.size === 0 &&
      !this.responseTimer
    ) {
      this.emit({
        type: "response.output_audio.done",
        response_id: this.activeResponse.id,
      });
      this.finishActiveResponse("response.done");
    }
  }

  interruptPlayback() {
    for (const source of this.scheduledSources) {
      try {
        source.stop(0);
      } catch {
        // The source may already have ended.
      }
    }
    this.scheduledSources.clear();
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  setOutputGain(value) {
    const raw = Number(value);
    if (!Number.isFinite(raw)) return;
    // Gemini Live PCM audio is 16-bit normalized full-scale speech.
    // Digital gain multipliers above 1.0 push waveform peaks past 0 dBFS into
    // severe digital clipping, turning vocal formants into buzzing square waves (honks).
    // Safely clamp gain to 1.0 (unity) and map any legacy boosted setting (e.g. 3.5) back to 1.0.
    const v = raw > 1.2 ? 1.0 : Math.max(0, Math.min(1.0, raw));
    this.outputGain = v;
    if (!this.playbackGain) return;
    try {
      const now = this.audioContext?.currentTime ?? 0;
      this.playbackGain.gain.setTargetAtTime(v, now, 0.02);
    } catch {
      this.playbackGain.gain.value = v;
    }
  }

  finishActiveResponse(type = "response.done") {
    if (!this.activeResponse) return;
    const response = this.activeResponse;
    this.clearManualResponseStartTimeout(response);
    this.emit({
      type,
      response_id: response.id,
      response: { id: response.id, metadata: response.metadata || {} },
    });
    this.activeResponse = null;
    if (type === "response.done") {
      this.completedResponsesSinceReset += 1;
      if (
        SESSION_RESPONSE_LIMIT > 0 &&
        this.completedResponsesSinceReset >= SESSION_RESPONSE_LIMIT
      ) {
        this.resetPending = true;
      }
    }
    this.dispatchNextManualResponse();
  }

  resetLiveSessionSoon() {
    if (
      this.closed ||
      this.resettingSession ||
      this.activeResponse ||
      this.pendingResponses.length
    ) {
      return;
    }
    this.resetLiveSession().catch((error) => this.handleError(error));
  }

  async resetLiveSession() {
    if (this.closed || this.resettingSession) return;
    // Live bills the accumulated session context on later turns, so reset
    // periodically to bound multi-turn lesson cost.
    this.resettingSession = true;
    this.applyInputAudioEnabled();
    const oldSession = this.session;
    this.session = null;
    this.suppressAutoTurn = false;
    this.inputTranscript = "";
    try {
      await oldSession?.close?.();
    } catch {
      // The old socket may already be closed.
    }
    try {
      if (this.closed) return;
      this.session = await this.connectLiveSession();
      this.completedResponsesSinceReset = 0;
      this.resetPending = false;
      this.fullInstructionPromptsRemaining = 1;
      this.receiveLoopPromise = this.receiveLoop();
      this.resettingSession = false;
      this.applyInputAudioEnabled();
      this.dispatchNextManualResponse();
    } finally {
      this.resettingSession = false;
      this.applyInputAudioEnabled();
    }
  }

  getSenders() {
    return [];
  }

  getReceivers() {
    return [];
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.readyState = "closed";
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
    this.responseBuffer = [];
    [
      ...this.pendingManualResponses,
      ...this.pendingResponses,
      this.activeResponse,
    ]
      .filter(Boolean)
      .forEach((response) => this.clearManualResponseStartTimeout(response));
    this.pendingManualResponses = [];
    this.pendingResponses = [];
    this.interruptPlayback();
    try {
      this.workletNode?.port && (this.workletNode.port.onmessage = null);
      this.workletNode?.disconnect();
    } catch {
      // Audio graph cleanup is best-effort.
    }
    try {
      this.micSource?.disconnect();
    } catch {
      // Audio graph cleanup is best-effort.
    }
    try {
      this.playbackAnalyser?.disconnect();
    } catch {
      // Audio graph cleanup is best-effort.
    }
    try {
      this.playbackGain?.disconnect();
    } catch {
      // Audio graph cleanup is best-effort.
    }
    try {
      this.mediaStream?.getTracks?.().forEach((track) => track.stop());
    } catch {
      // Media tracks may already be stopped by the Tutor cleanup.
    }
    try {
      await this.session?.close();
    } catch {
      // The WebSocket may already be closed by the server.
    }
    try {
      await this.audioContext?.close?.();
    } catch {
      // The context may already be closed by the Tutor cleanup.
    }
  }

  handleError(error) {
    const message = error?.message || String(error);
    this.onError?.(message);
    this.emit({
      type: "error",
      error: { message },
    });
  }

  async emit(event) {
    if (!this.onEvent) return;
    await this.onEvent({ data: JSON.stringify(event) });
  }
}
