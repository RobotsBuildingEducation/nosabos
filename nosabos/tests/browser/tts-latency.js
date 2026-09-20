import { getTTSPlayer, createWarmTTSAudio, setTTSConnectionWarmupEnabled } from "/src/utils/tts.js";

if (!import.meta.env.DEV) throw new Error("This comparison page is development-only");
setTTSConnectionWarmupEnabled(false);

const $ = (id) => document.getElementById(id);
$("endpoint-a").value = import.meta.env.VITE_REALTIME_URL || "";
$("configuration").textContent = `Model: ${import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-2.1-mini"}; language: es-MX. Firebase server authentication is unknown unless its response reports it. If a live Worker requires App Check, configure VITE_REALTIME_URL to that Worker and register the localhost App Check debug token first.`;
const measurements = [];
let activePlayer;
let cancelled = false;
let running = false;

const duration = (row, from, to) => {
  const a = row.events.find((event) => event.phase === from)?.ms;
  const b = row.events.find((event) => event.phase === to)?.ms;
  return a === undefined || b === undefined ? null : Math.max(0, b - a);
};
const ms = (value) => value === null || value === undefined ? "—" : `${Math.round(value)} ms`;
const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (fraction === 0.5) return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};

function render() {
  $("rows").replaceChildren();
  for (const row of measurements) {
    const tr = document.createElement("tr");
    const auth = row.events.find((event) => event.phase === "app-check-ready");
    const server = row.events.find((event) => event.phase === "sdp-answer");
    const values = [row.label, row.status,
      `${ms(duration(row, "app-check-start", "app-check-ready"))}; token ${auth?.tokenAttached ? "sent" : "absent"}; server ${server?.appCheck || "unknown"}`,
      ms(duration(row, "http-start", "sdp-answer")),
      ms(duration(row, "sdp-answer", "data-channel-open")),
      ms(duration(row, "narration-requested", "first-audio-samples")),
      ms(row.events.find((event) => event.phase === "first-audio-samples")?.ms)];
    for (const value of values) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
    $("rows").append(tr);
  }
  const groups = new Map();
  for (const row of measurements) {
    const key = JSON.stringify([row.endpoint, row.model, row.text, row.voice, row.langTag, row.mode]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  $("summary").textContent = [...groups.values()].map((rows) => {
    const valid = rows.filter((row) => row.status === "ended" && !row.hidden);
    const samples = valid.map((row) => row.events.find((event) => event.phase === "first-audio-samples")?.ms).filter(Number.isFinite);
    const http = valid.map((row) => duration(row, "http-start", "sdp-answer")).filter(Number.isFinite);
    return `${rows[0].endpoint} (${rows[0].voice}, ${rows[0].model})\nText: ${rows[0].text}\n${rows.length} attempts; ${valid.length} completed visible-tab trials; ${samples.length} with observed audio; ${rows.length - valid.length} errors/cancellations/hidden trials (retained in export).\nFirst audio: median ${ms(percentile(samples, 0.5))}, p95 ${ms(percentile(samples, 0.95))}. SDP HTTP: median ${ms(percentile(http, 0.5))}, p95 ${ms(percentile(http, 0.95))}.`;
  }).join("\n\n");
}

async function runTrial(label, endpoint, text, voice) {
  const startedAt = performance.now();
  const row = { label, endpoint, text, voice, langTag: "es-MX", model: import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-2.1-mini", date: new Date().toISOString(), mode: "new-connection-no-cache", events: [], status: "running", hidden: document.hidden };
  measurements.push(row);
  let context;
  let source;
  let analyser;
  let silentOutput;
  let monitor;
  const log = (phase, details = {}) => {
    const event = { phase, ms: performance.now() - startedAt, ...details };
    row.events.push(event);
    $("log").textContent += `\n${label} ${ms(event.ms)} ${phase} ${Object.keys(details).length ? JSON.stringify(details) : ""}`;
  };
  const onVisibility = () => { if (document.hidden) { row.hidden = true; log("tab-hidden-trial-invalid"); } };
  document.addEventListener("visibilitychange", onVisibility);
  const observeStream = (stream) => {
    if (source || context.state !== "running") return;
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    silentOutput = context.createGain();
    silentOutput.gain.value = 0; // Observe only; the player's Audio element plays normally.
    source.connect(analyser).connect(silentOutput).connect(context.destination);
    const samples = new Float32Array(analyser.fftSize);
    monitor = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      if (samples.some((value) => Math.abs(value) >= 0.001)) {
        log("first-audio-samples");
        clearInterval(monitor);
        render();
      }
    }, 20);
  };
  try {
    log("trial-start");
    context = new AudioContext();
    await context.resume();
    const warmAudio = await createWarmTTSAudio();
    log("audio-unlocked", { contextState: context.state, outputLatency: context.outputLatency ?? null });
    activePlayer = await getTTSPlayer({
      text, voice, langTag: "es-MX", warmAudio, disableCache: true,
      usePreparedConnection: false, benchmarkEndpoint: endpoint,
      onDiagnostic: ({ phase, stream, ...details }) => {
        log(phase, details);
        if (stream) observeStream(stream);
      },
    });
    if (cancelled) activePlayer.cleanup();
    await activePlayer.ready;
    const thisPlayer = activePlayer;
    void thisPlayer.audio.play().catch((error) => {
      if (error.name !== "AbortError") { log("media-error", { message: error.message }); thisPlayer.cleanup(); }
    });
    const completion = await thisPlayer.completion;
    row.status = completion.status;
    if (completion.error) row.error = completion.error.message;
    await thisPlayer.finalize;
  } catch (error) {
    row.status = cancelled ? "cancelled" : "error";
    row.error = error.message;
    activePlayer?.cleanup();
    await activePlayer?.finalize;
  } finally {
    log("trial-finished", { status: row.status, error: row.error });
    clearInterval(monitor);
    source?.disconnect(); analyser?.disconnect(); silentOutput?.disconnect();
    await context?.close();
    document.removeEventListener("visibilitychange", onVisibility);
    activePlayer = null;
    render();
  }
}

async function run(labels) {
  if (running) return;
  running = true;
  cancelled = false;
  const endpoints = { A: $("endpoint-a").value.trim(), B: $("endpoint-b").value.trim() };
  const text = $("text").value;
  const voice = $("voice").value;
  document.querySelectorAll("button,input,textarea,select").forEach((element) => { element.disabled = true; });
  $("stop").disabled = false;
  $("log").textContent = `Order: ${labels.join(" → ")}. No cache or speculative connections.`;
  try {
    for (const label of labels) {
      if (cancelled) break;
      await runTrial(label, endpoints[label], text, voice);
    }
  } finally {
    running = false;
    document.querySelectorAll("button,input,textarea,select").forEach((element) => { element.disabled = false; });
    $("stop").disabled = true;
  }
}
$("run-a").onclick = () => void run(["A"]);
$("run-b").onclick = () => void run(["B"]);
$("run-both").onclick = () => void run(Math.random() < 0.5 ? ["A", "B", "B", "A"] : ["B", "A", "A", "B"]);
$("stop").onclick = () => { cancelled = true; activePlayer?.cleanup(); };
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify({ userAgent: navigator.userAgent, measurements }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "tts-latency.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
