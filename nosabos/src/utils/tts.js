import { appCheckFetch } from "../firebaseResources/firebaseResources";
import { prepareTTSCacheAudio } from "./ttsCacheAudio.js";
import { createRealtimeTTSConnectionPool } from "./realtimeTTSConnection.js";

const REALTIME_MODEL =
  (import.meta.env?.VITE_REALTIME_MODEL || "gpt-realtime-2.1-mini") + "";
const PROXIED_HOSTNAMES = new Set([
  "piyali.app",
  "www.piyali.app",
  "nosabos.app",
  "www.nosabos.app",
]);

function getProxyBaseUrl() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (PROXIED_HOSTNAMES.has(host)) {
      return `${window.location.origin}/api/tts-proxy`;
    }
  }
  return import.meta.env?.VITE_REALTIME_URL || "";
}

export const DEFAULT_TTS_VOICE = "ash";

const REALTIME_URL = getProxyBaseUrl()
  ? `${getProxyBaseUrl()}?model=${encodeURIComponent(REALTIME_MODEL)}`
  : "";
const realtimeConnections = createRealtimeTTSConnectionPool({
  url: REALTIME_URL,
  model: REALTIME_MODEL,
  defaultVoice: DEFAULT_TTS_VOICE,
  exchange: appCheckFetch,
  createPeer: () => new RTCPeerConnection(),
  createStream: () => new MediaStream(),
  createAudio: () => new Audio(),
  setTimer: (fn, delay) => setTimeout(fn, delay),
  clearTimer: (timer) => clearTimeout(timer),
  now: () => Date.now(),
});
let connectionWarmupEnabled = true;

// The latency harness disables speculative work before measuring fresh sessions.
// This affects only this page, and never changes the configured app endpoint.
export function setTTSConnectionWarmupEnabled(enabled) {
  connectionWarmupEnabled = Boolean(enabled);
  if (!connectionWarmupEnabled) realtimeConnections.clear();
}

export const TTS_LANG_TAG = {
  ar: "ar-EG",
  zh: "zh-CN",
  en: "en-US",
  es: "es-MX",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  hi: "hi-IN",
  nl: "nl-NL",
  nah: "es-MX",
  ru: "ru-RU",
  ja: "ja-JP",
  de: "de-DE",
  el: "el-GR",
  pl: "pl-PL",
  ga: "ga-IE",
  yua: "es-MX",
};

// Default to opus for size efficiency; allow callers to request lower-latency formats
export const DEFAULT_TTS_FORMAT = "opus";
export const LOW_LATENCY_TTS_FORMAT = "wav";
// Only recordings made after successful generation AND WebRTC playout drain
// are reusable. Older versions may contain truncated audio; never promote them.
const REALTIME_CACHE_FORMAT = "realtime-v7";
const CACHE_AUDIO_PREPARATION_VERSION = 1;
const REALTIME_CACHE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

// Voices supported by BOTH TTS API and Realtime API
// Note: fable, onyx, nova are TTS-only and NOT supported by Realtime API
const SUPPORTED_TTS_VOICES = new Set([
  "alloy",
  "echo",
  "shimmer",
  "coral",
  "verse",
  "ballad",
  "ash",
  "sage",
  "marin",
  "cedar",
]);

export const TTS_VOICE_OPTIONS = [
  { value: "alloy", type: "boy", description: "Balanced and neutral" },
  { value: "coral", type: "girl", description: "Bright and friendly" },
  { value: "ash", type: "boy", description: "Calm and steady" },
  { value: "shimmer", type: "girl", description: "Soft and upbeat" },
  { value: "ballad", type: "boy", description: "Smooth and dramatic" },
  { value: "sage", type: "girl", description: "Warm and composed" },
  { value: "cedar", type: "boy", description: "Deep and grounded" },
  { value: "marin", type: "girl", description: "Cheerful and warm" },
  { value: "echo", type: "boy", description: "Crisp and energetic" },
  { value: "verse", type: "boy", description: "Expressive and clear" },
];

// Array version for random selection
const TTS_VOICES_ARRAY = Array.from(SUPPORTED_TTS_VOICES);
const RANDOM_DEFAULT_TTS_VOICE_KEY = "nosabos:realtime-mini-default-voice";
let randomDefaultTTSVoice = null;

/**
 * Returns a randomly selected voice from the available TTS voices.
 * Use this only when a truly fresh random voice is needed.
 */
export function getRandomVoice() {
  const index = Math.floor(Math.random() * TTS_VOICES_ARRAY.length);
  return TTS_VOICES_ARRAY[index];
}

// Character-specific voice and personality mappings
export const CHARACTER_VOICES = {
  frog: {
    voice: "ash",
    personality:
      "an ancient male toad sage, wise and measured with a deep gravelly tone",
  },
  cat: {
    voice: "sage",
    personality:
      "a sarcastic female cat humanoid, dry wit and playful disdain in every word",
  },
  hamster: {
    voice: "echo",
    personality:
      "the narrator of the app, a relaxed but confident male voice guiding the experience",
  },
  "purple-girl": {
    voice: "marin",
    personality: "a joyful woman with a Japanese accent, warm and enthusiastic",
  },
  yachiru: {
    voice: "shimmer",
    personality:
      "an adorable, bubbly companion with childlike energy, excitable, warm, and playful",
  },
};

/**
 * Returns the voice ID for a given character type, falling back to alloy.
 */
export function getCharacterVoice(characterId) {
  return CHARACTER_VOICES[characterId]?.voice || DEFAULT_TTS_VOICE;
}

/**
 * Returns the voice personality description for a given character type.
 */
export function getCharacterPersonality(characterId) {
  return CHARACTER_VOICES[characterId]?.personality || null;
}

function sanitizeVoice(voice) {
  return SUPPORTED_TTS_VOICES.has(voice) ? voice : DEFAULT_TTS_VOICE;
}

export function normalizeTTSVoice(voice) {
  return sanitizeVoice(voice);
}

function getRandomDefaultTTSVoice() {
  if (randomDefaultTTSVoice) return randomDefaultTTSVoice;

  try {
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem(RANDOM_DEFAULT_TTS_VOICE_KEY);
    }
  } catch {
    // Local storage may be blocked; fall back to in-memory default.
  }

  randomDefaultTTSVoice = DEFAULT_TTS_VOICE;
  return randomDefaultTTSVoice;
}

export function getPreferredTTSVoice(...candidates) {
  for (const voice of candidates) {
    if (SUPPORTED_TTS_VOICES.has(voice)) return voice;
  }
  return getRandomDefaultTTSVoice();
}

export function getTTSVoiceOption(voice) {
  const normalized = sanitizeVoice(voice);
  return (
    TTS_VOICE_OPTIONS.find((option) => option.value === normalized) ||
    TTS_VOICE_OPTIONS[0]
  );
}

function preconnectRealtimeOrigin() {
  if (realtimePreconnectStarted || !REALTIME_URL) return;
  if (typeof document === "undefined") return;

  try {
    const origin = new URL(REALTIME_URL).origin;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head?.appendChild(link);
    realtimePreconnectStarted = true;
  } catch {
    // Ignore malformed local env URLs.
  }
}

export function warmRealtimeTTS({ force = false } = {}) {
  if (!connectionWarmupEnabled) return Promise.resolve(false);
  preconnectRealtimeOrigin();
  if (!REALTIME_URL || typeof RTCPeerConnection === "undefined" || typeof MediaStream === "undefined" ||
      (typeof document !== "undefined" && document.hidden)) {
    return Promise.resolve(false);
  }
  return realtimeConnections.warm({ force });
}

// A real 50ms silent PCM clip. An empty WAV can leave play() pending on iOS.
const TTS_UNLOCK_AUDIO = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

export function activatePlaybackAudioSession() {
  if (typeof navigator !== "undefined" && navigator.audioSession) {
    try {
      if (navigator.audioSession.type !== "playback") {
        navigator.audioSession.type = "playback";
      }
    } catch {
      // Best-effort audio session configuration.
    }
  }
}

if (typeof window !== "undefined") {
  const onUserInteraction = () => {
    activatePlaybackAudioSession();
    primeTTSAudio();
  };
  window.addEventListener("touchstart", onUserInteraction, { capture: true, passive: true });
  window.addEventListener("touchend", onUserInteraction, { capture: true, passive: true });
  window.addEventListener("click", onUserInteraction, { capture: true, passive: true });
}

function createUnlockedTTSAudio() {
  activatePlaybackAudioSession();
  try {
    const warm = new Audio();
    warm.playsInline = true;
    warm.muted = false;
    warm.volume = 1;
    warm.src = TTS_UNLOCK_AUDIO;
    // Call synchronously inside the gesture, with audible playback permission.
    // The samples themselves are silent. Never await this best-effort unlock or
    // pause in a later callback: by then this element may be narrating speech.
    void warm.play()?.catch(() => {});
    return warm;
  } catch {
    return null;
  }
}

export async function createWarmTTSAudio() {
  return createUnlockedTTSAudio();
}

export function primeTTSAudio() {
  if (!sharedWarmAudio) {
    sharedWarmAudio = createUnlockedTTSAudio();
  } else {
    // A touchstart may not carry playback permission. Retry on the actual
    // click using the same element, still synchronously within the gesture.
    try { void sharedWarmAudio.play()?.catch(() => {}); } catch { /* Best effort. */ }
  }
  return Promise.resolve(sharedWarmAudio);
}

async function consumeSharedWarmAudio() {
  const audio = sharedWarmAudio;
  sharedWarmAudio = null;
  if (!audio) return createUnlockedTTSAudio();
  try { void audio.play()?.catch(() => {}); } catch { /* Best effort. */ }
  return audio;
}

function withTTSTimeout(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

// ============================================================================
// CACHING LAYER
// ============================================================================

// In-memory cache for current session (instant access)
const memoryCache = new Map();
let realtimePreconnectStarted = false;
let sharedWarmAudio = null;

// IndexedDB configuration
const DB_NAME = "tts-audio-cache";
const DB_VERSION = 1;
const STORE_NAME = "audio";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// IndexedDB instance (lazy initialized)
let dbPromise = null;

/**
 * Generate a cache key from the exact playback inputs.
 */
function getCacheKey(
  text,
  langTag,
  responseFormat = DEFAULT_TTS_FORMAT,
  voice = DEFAULT_TTS_VOICE,
  personality = "",
) {
  const normalizedText = (text || "").trim().replace(/\s+/g, " ");
  const normalizedPersonality = (personality || "").trim().replace(/\s+/g, " ");
  return [
    "v2",
    responseFormat,
    langTag,
    sanitizeVoice(voice),
    normalizedPersonality,
    normalizedText,
  ].join("::");
}

/**
 * Open/initialize IndexedDB
 */
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn("TTS IndexedDB failed to open:", request.error);
      resolve(null);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Get audio blob from IndexedDB
 */
async function getFromIndexedDB(key) {
  // Storage is optional. A blocked IndexedDB request must not block narration.
  return withTTSTimeout(readFromIndexedDB(key), 1500, "TTS cache lookup timed out")
    .catch(() => null);
}

async function readFromIndexedDB(key) {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = async () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check TTL
        if (Date.now() - result.timestamp > CACHE_TTL_MS) {
          // Expired - delete async and return null
          deleteFromIndexedDB(key);
          resolve(null);
          return;
        }

        // v6 contains complete recordings, but older entries include connection
        // silence. Repair those once without opening a new OpenAI session.
        if (result.audioPreparationVersion !== CACHE_AUDIO_PREPARATION_VERSION) {
          const prepared = await prepareTTSCacheAudio(result.blob);
          if (prepared.isSilent) {
            deleteFromIndexedDB(key);
            resolve(null);
            return;
          }
          if (prepared.prepared && prepared.blob) {
            await saveToIndexedDB(key, prepared.blob, {
              timestamp: result.timestamp,
              audioPreparationVersion: CACHE_AUDIO_PREPARATION_VERSION,
            });
            resolve(prepared.blob);
            return;
          }
          resolve(result.blob);
          return;
        }
        resolve(result.blob);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save audio blob to IndexedDB
 */
async function saveToIndexedDB(key, blob, metadata = {}) {
  try {
    const db = await openDB();
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
      store.put({ key, blob, timestamp: Date.now(), ...metadata });
    });
  } catch (error) {
    console.warn("TTS IndexedDB save failed:", error);
  }
}

/**
 * Delete expired entry from IndexedDB
 */
async function deleteFromIndexedDB(key) {
  try {
    const db = await openDB();
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
  } catch {
    // Ignore deletion errors
  }
}

function getWorkerAudioUrl(realtimeUrl, key) {
  if (!key) return "";
  const target = realtimeUrl || getProxyBaseUrl();
  if (!target) return "";
  try {
    const base = new URL(
      target,
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://piyali.app",
    );
    const basePath = base.pathname.replace(/\/+$/, "");
    return `${base.origin}${basePath}/audio/${encodeURIComponent(key)}`;
  } catch {
    return "";
  }
}

function safeLogInfo(...args) {
  if (import.meta.env?.DEV && typeof console !== "undefined" && typeof console.info === "function") {
    console.info(...args);
  }
}

function safeLogWarn(...args) {
  if (import.meta.env?.DEV && typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(...args);
  }
}

async function fetchFromEdgeCache(key, realtimeUrl, options = {}) {
  const fetchFn = typeof fetch === "function" ? fetch : null;
  if (!fetchFn) return null;
  const url = getWorkerAudioUrl(realtimeUrl, key);
  if (!url) return null;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = options?.timeoutMs || 1500;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  if (options?.signal) {
    if (options.signal.aborted) return null;
    options.signal.addEventListener("abort", () => controller?.abort(), { once: true });
  }
  try {
    const fetchInit = {
      method: "GET",
      signal: controller?.signal,
    };
    if (options?.priority) {
      fetchInit.priority = options.priority;
    }
    const response = await fetchFn(url, fetchInit);
    if (!response || response.status !== 200) {
      safeLogInfo(`[TTS Edge Cache] Miss (${response?.status || "network"}) for: ${key}`);
      return null;
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;
    safeLogInfo(`[TTS Edge Cache] 🎯 HIT! (${blob.size}B, source=${response.headers?.get?.("X-TTS-Cache") || "EDGE"}) for: ${key}`);
    return blob;
  } catch (err) {
    safeLogWarn("[TTS Edge Cache] Probe error:", err);
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function uploadToEdgeCache(key, blob, realtimeUrl) {
  if (!blob || blob.size === 0) return;
  const url = getWorkerAudioUrl(realtimeUrl, key);
  if (!url) return;
  try {
    const contentType = blob.type || "audio/wav";
    safeLogInfo(`[TTS Edge Cache] 📤 Uploading to edge: ${key} (${blob.size}B, ${contentType})`);
    const res = await appCheckFetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    const data = await res.json().catch(() => ({}));
    safeLogInfo(`[TTS Edge Cache] 📤 Upload result (${res.status}):`, data);
  } catch (err) {
    safeLogWarn("[TTS Edge Cache] 📤 Upload failed:", err);
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export async function cleanupExpiredCache() {
  try {
    const db = await openDB();
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const expiredBefore = Date.now() - CACHE_TTL_MS;

    const range = IDBKeyRange.upperBound(expiredBefore);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  } catch {
    // Ignore cleanup errors
  }
}

// ============================================================================
// CORE TTS FUNCTIONS
// ============================================================================

const activeTTSPlayers = new Map();

function registerActiveTTSPlayer(audio, cleanup) {
  if (!audio || typeof cleanup !== "function") return;
  activeTTSPlayers.set(audio, cleanup);
}

function unregisterActiveTTSPlayer(audio, cleanup) {
  if (!audio) return;
  if (!cleanup || activeTTSPlayers.get(audio) === cleanup) {
    activeTTSPlayers.delete(audio);
  }
}

export function stopTTSPlayback(audio) {
  if (!audio) return;

  const cleanup = activeTTSPlayers.get(audio) || audio._ttsCleanup;
  unregisterActiveTTSPlayer(audio, cleanup);

  try {
    audio.pause?.();
  } catch {
    // Best-effort media cleanup.
  }

  try {
    audio.currentTime = 0;
  } catch {
    // Best-effort media cleanup.
  }

  try {
    cleanup?.();
  } catch {
    // Best-effort media cleanup.
  }
}

export function stopAllTTSPlayback() {
  Array.from(activeTTSPlayers.keys()).forEach((audio) => {
    stopTTSPlayback(audio);
  });

  if (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.cancel === "function"
  ) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Best-effort media cleanup.
    }
  }
}

/**
 * Fetch TTS audio with multi-layer caching:
 * 1. Check in-memory cache (instant)
 * 2. Check IndexedDB cache (fast)
 * 3. Fetch from API (slow, but cached for future)
 *
 * @param {Object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.langTag - Language tag (e.g., "es-ES")
 * @param {string} options.voice - Optional specific voice (defaults to saved preference)
 * @returns {Promise<Blob>} Audio blob
 */
export async function fetchTTSBlob() {
  throw new Error("Legacy REST TTS is disabled in favor of realtime playback");
}

export async function getTTSPlayer({
  text,
  voice,
  personality,
  langTag,
  warmAudio,
  disableCache = false,
  usePreparedConnection = true,
  onDiagnostic,
  benchmarkEndpoint,
} = {}) {
  return getRealtimePlayer({
    text,
    voice,
    personality,
    langTag,
    warmAudio,
    disableCache,
    usePreparedConnection,
    onDiagnostic,
    benchmarkEndpoint,
  });
}

async function getRealtimePlayer({
  text,
  voice,
  personality,
  langTag,
  warmAudio,
  disableCache,
  usePreparedConnection,
  onDiagnostic,
  benchmarkEndpoint,
}) {
  let realtimeUrl = REALTIME_URL;
  if (benchmarkEndpoint) {
    if (!import.meta.env.DEV) throw new Error("Endpoint overrides are development-only");
    const endpoint = new URL(benchmarkEndpoint);
    const configured = REALTIME_URL ? new URL(REALTIME_URL) : null;
    const allowed = endpoint.origin === configured?.origin ||
      endpoint.origin === "https://us-central1-nosabo-30dcb.cloudfunctions.net" ||
      endpoint.hostname === "nosabos-tts-proxy-staging.robotsbuildingeducation.workers.dev" ||
      endpoint.hostname === "nosabos-tts-proxy.robotsbuildingeducation.workers.dev" ||
      endpoint.hostname === "localhost" ||
      endpoint.hostname === "127.0.0.1";
    if (!allowed || endpoint.username || endpoint.password) throw new Error("Unsupported benchmark endpoint");
    endpoint.searchParams.set("model", REALTIME_MODEL);
    realtimeUrl = endpoint.href;
  }
  if (!realtimeUrl) throw new Error("Realtime URL not configured");
  const mark = (phase, details = {}) => {
    try { onDiagnostic?.({ phase, ...details }); } catch { /* Observers cannot break playback. */ }
  };
  mark("player-start", { model: REALTIME_MODEL, endpoint: realtimeUrl, cacheEnabled: !disableCache });
  // Reserve the gesture-unlocked element before storage/network awaits, for
  // both cached playback and a fresh stream.
  if (warmAudio === sharedWarmAudio) sharedWarmAudio = null;
  const pendingAudio = warmAudio ? Promise.resolve(warmAudio) : consumeSharedWarmAudio();

  const sanitizedVoice = getPreferredTTSVoice(voice);
  const targetLangTag = langTag || TTS_LANG_TAG.es;
  const cacheKey = getCacheKey(
    text,
    targetLangTag,
    REALTIME_CACHE_FORMAT,
    sanitizedVoice,
    personality,
  );

  if (!disableCache) {
    let cachedBlob =
      memoryCache.get(cacheKey) || (await getFromIndexedDB(cacheKey));
    if (cachedBlob) {
      safeLogInfo(`[TTS Cache] ⚡ Served from local browser cache (IndexedDB 0ms): ${cacheKey}`);
      mark("cache-hit", { source: "local" });
      memoryCache.set(cacheKey, cachedBlob);
      return createAudioFromBlob(cachedBlob, await pendingAudio);
    }

    cachedBlob = await fetchFromEdgeCache(cacheKey, realtimeUrl);
    if (cachedBlob) {
      mark("cache-hit", { source: "edge" });
      memoryCache.set(cacheKey, cachedBlob);
      saveToIndexedDB(cacheKey, cachedBlob, {
        audioPreparationVersion: CACHE_AUDIO_PREPARATION_VERSION,
      }).catch(() => {});
      return createAudioFromBlob(cachedBlob, await pendingAudio);
    }
  }

  mark("cache-miss");
  const warmedConnection = usePreparedConnection && connectionWarmupEnabled && realtimeUrl === REALTIME_URL
    ? await realtimeConnections.take() : null;
  mark("connection-selected", { prepared: Boolean(warmedConnection) });
  const remoteStream = warmedConnection?.stream || new MediaStream();
  // Reuse a pre-warmed Audio element if provided (already unlocked by user
  // gesture on mobile) so that play() works outside a gesture context.
  const audio = (await pendingAudio) || new Audio();
  // Safari can get stuck on the old data URI source unless we fully detach it
  // before switching the element over to the live WebRTC stream.
  try {
    audio.pause?.();
  } catch {
    // Ignore stale audio cleanup failures before reusing the element.
  }
  try {
    audio.removeAttribute?.("src");
  } catch {
    // Older browsers may not expose removeAttribute on media elements.
  }
  try {
    audio.src = "";
  } catch {
    // Ignore src reset failures and continue with srcObject assignment.
  }
  try {
    audio.load?.();
  } catch {
    // Some browsers do not like forcing a load during source swaps.
  }
  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.playsInline = true;
  audio.muted = false;
  audio.volume = 1;
  // The prepared stream was consumed silently while idle. Hand it off only
  // after the real playback element is attached, preserving its live position.
  warmedConnection?.releaseWarmAudio();

  const pc = warmedConnection?.pc || new RTCPeerConnection();
  if (!warmedConnection) pc.addTransceiver("audio", { direction: "recvonly" });

  let responseSucceeded = false;
  let playbackError = null;
  let resolveCompletion;
  // Natural playout is distinct from cleanup, and does not wait on cache writes.
  const completion = new Promise((resolve) => { resolveCompletion = resolve; });
  // WebRTC does not reliably resolve HTMLMediaElement.play() or emit playing.
  // Expose the transport's start signal separately from generation/completion.
  let resolvePlaybackStarted;
  const playbackStarted = new Promise((resolve) => { resolvePlaybackStarted = resolve; });
  let outputBufferStopped = false;
  let resolveResponseComplete;
  // Consumers use this to update playback UI, so it must follow playout,
  // not the faster-than-realtime generation events.
  const responseComplete = new Promise((resolve) => {
    resolveResponseComplete = resolve;
  });
  let finalizeResolved = false;
  let hardFallbackTimer = null;
  let startupTimer = null;
  const setupController = new AbortController();
  let startupStage = "connecting";
  let playbackDrainTimer = null;
  let drainScheduled = false;
  let playbackCompletedNaturally = false;
  let recorderFailed = false;
  let cacheRecorder = null;
  let cacheRecorderDone = Promise.resolve();
  let resolveCacheRecorderDone = null;
  const cacheChunks = [];

  const getRealtimeCacheMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    if (typeof MediaRecorder.isTypeSupported !== "function") return "";
    return (
      REALTIME_CACHE_MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      ) || ""
    );
  };

  const startRealtimeCacheRecording = () => {
    if (disableCache || cacheRecorder || typeof MediaRecorder === "undefined") {
      return;
    }
    if (!remoteStream.getAudioTracks().length) return;

    try {
      const mimeType = getRealtimeCacheMimeType();
      cacheRecorder = mimeType
        ? new MediaRecorder(remoteStream, { mimeType })
        : new MediaRecorder(remoteStream);
      cacheRecorderDone = new Promise((resolve) => {
        resolveCacheRecorderDone = resolve;
      });
      cacheRecorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) cacheChunks.push(event.data);
      });
      cacheRecorder.addEventListener(
        "stop",
        async () => {
          if (
            playbackCompletedNaturally &&
            responseSucceeded &&
            !recorderFailed &&
            !intentionalEnd &&
            cacheChunks.length
          ) {
            const blob = new Blob(cacheChunks, {
              type:
                cacheRecorder.mimeType ||
                cacheChunks[0]?.type ||
                "audio/webm",
            });
            if (blob.size > 512) await addToCache(cacheKey, blob, realtimeUrl);
          }
          resolveCacheRecorderDone?.();
        },
        { once: true },
      );
      cacheRecorder.addEventListener(
        "error",
        () => {
          recorderFailed = true;
          resolveCacheRecorderDone?.();
        },
        { once: true },
      );
      cacheRecorder.start(250);
    } catch {
      cacheRecorder = null;
      resolveCacheRecorderDone?.();
      cacheRecorderDone = Promise.resolve();
    }
  };

  const stopRealtimeCacheRecording = () => {
    if (!cacheRecorder || cacheRecorder.state === "inactive") {
      return cacheRecorderDone;
    }
    try {
      cacheRecorder.requestData?.();
    } catch {
      // Some browsers reject requestData during recorder shutdown.
    }
    try {
      cacheRecorder.stop();
    } catch {
      resolveCacheRecorderDone?.();
    }
    return cacheRecorderDone;
  };

  let resolveFinalize;
  let rejectReady;
  const clearFinalizeTimers = () => {
    clearTimeout(playbackDrainTimer);
    clearTimeout(hardFallbackTimer);
    clearTimeout(startupTimer);
  };
  const finishFinalize = () => {
    if (finalizeResolved) return;
    finalizeResolved = true;
    clearFinalizeTimers();
    resolveFinalize?.();
    resolveCompletion?.(playbackCompletedNaturally
      ? { status: "ended" }
      : { status: playbackError ? "error" : "cancelled", error: playbackError });
  };
  const failPlayback = (error) => {
    if (finalizeResolved) return;
    playbackCompletedNaturally = false;
    playbackError = error;
    mark("playback-error", { stage: startupStage, message: error.message });
    rejectReady?.(error);
    finishFinalize();
    audio.dispatchEvent(new Event("error"));
  };
  const onPlaybackError = () =>
    failPlayback(new Error("TTS audio playback failed"));
  audio.addEventListener("error", onPlaybackError);

  const finishAfterPlaybackDrain = async () => {
    if (
      !responseSucceeded ||
      !outputBufferStopped ||
      drainScheduled ||
      finalizeResolved
    ) return;
    drainScheduled = true;
    // The data channel can beat the last RTP packets and the browser's jitter
    // buffer. Keep recording through that tail before stopping any tracks.
    let tailMs = 1000;
    try {
      const stats = await withTTSTimeout(pc.getStats(), 500, "TTS receiver stats timed out");
      stats.forEach((report) => {
        if (report.type !== "inbound-rtp" || report.kind !== "audio") return;
        const emitted = report.jitterBufferEmittedCount;
        if (emitted > 0) {
          const delay =
            Math.max(
              report.jitterBufferDelay || 0,
              report.jitterBufferTargetDelay || 0,
            ) / emitted;
          tailMs = Math.max(tailMs, delay * 1000 + 500);
        }
      });
    } catch {
      // Safari/older WebViews may not expose receiver jitter-buffer stats.
    }
    if (finalizeResolved) return;
    playbackDrainTimer = setTimeout(() => {
      playbackCompletedNaturally = true;
      finishFinalize();
    }, tailMs);
  };

  const ready = new Promise((resolve, reject) => {
    rejectReady = reject;
    pc.ontrack = (event) => {
      if (finalizeResolved) return;
      // ontrack can be streamless on some browsers.
      const tracks = event.streams?.[0]?.getTracks() || [event.track];
      tracks.filter(Boolean).forEach((track) => {
        if (!remoteStream.getTracks().includes(track)) remoteStream.addTrack(track);
      });
      startRealtimeCacheRecording();
      mark("remote-track", { stream: remoteStream });
      try { void audio.play()?.catch(() => {}); } catch { /* Best effort. */ }
      resolve();
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        failPlayback(new Error("RTC connection failed"));
      }
    };
    if (remoteStream.getAudioTracks().length) {
      startRealtimeCacheRecording();
      mark("remote-track", { stream: remoteStream });
      try { void audio.play()?.catch(() => {}); } catch { /* Best effort. */ }
      resolve();
    }
  });
  // Setup can fail before the caller receives the player and awaits ready.
  void ready.catch(() => {});

  const dc = warmedConnection?.dc || pc.createDataChannel("oai-events");

  // Track when we're intentionally ending to prevent spurious error events
  let intentionalEnd = false;
  let cleanupFn = null;

  // Response-scoped voice/instructions apply atomically with inference. This
  // removes the prepared session.update/ack round trip without racing defaults.
  let narrationRequested = false;
  const requestNarration = () => {
    if (narrationRequested || finalizeResolved) return;
    narrationRequested = true;
    try {
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: {
            output_modalities: ["audio"],
            instructions: narrationSession.instructions,
          },
        }),
      );
      mark("narration-requested");
    } catch (err) {
      failPlayback(err);
    }
  };

  // Track when response is done via data channel messages
  const finalize = new Promise((resolve) => {
    resolveFinalize = resolve;
    pc.onconnectionstatechange = () => {
      if (["closed", "failed"].includes(pc.connectionState || "")) {
        failPlayback(
          new Error("RTC connection closed before playback completed"),
        );
      }
    };
    // Long safety net for cases where the stream never settles cleanly.
    const fallbackTimeoutMs = Math.max(45000, text.length * 180 + 10000);
    hardFallbackTimer = setTimeout(
      () => failPlayback(new Error("Realtime TTS playback timed out")),
      fallbackTimeoutMs,
    );
    // Startup has its own deadline, independent of narration length. This also
    // covers App Check, HTTP, SDP, and a connected transport that never speaks.
    startupTimer = setTimeout(
      () => failPlayback(new Error(`TTS startup timed out (${startupStage}). Please try again.`)),
      20000,
    );
  }).finally(async () => {
    setupController.abort();
    unregisterActiveTTSPlayer(audio, cleanupFn);
    audio.removeEventListener("error", onPlaybackError);
    resolvePlaybackStarted(false);
    clearFinalizeTimers();
    resolveResponseComplete?.();
    // Notify UI before optional recording/cache work, which can stall on iOS.
    try {
      if (audio.onended && !audio.ended) audio.dispatchEvent(new Event("ended"));
    } catch { /* Best-effort media notification. */ }
    await withTTSTimeout(stopRealtimeCacheRecording(), 2000, "TTS recorder shutdown timed out")
      .catch(() => { recorderFailed = true; });
    // Mark as intentionally ended so components can ignore errors
    intentionalEnd = true;
    // Clear error handler first to prevent AbortError from firing
    try {
      audio.onerror = null;
    } catch {
      // Best-effort media cleanup.
    }
    try {
      dc.close();
    } catch {
      // Best-effort RTC cleanup.
    }
    try {
      pc.close();
    } catch {
      // Best-effort RTC cleanup.
    }
    try {
      remoteStream.getTracks().forEach((t) => t.stop());
    } catch {
      // Best-effort media cleanup.
    }
    // Note: Don't set audio.srcObject = null as it causes AbortError
    // Stopping the tracks is sufficient cleanup
  });

  dc.onmessage = (event) => {
    if (finalizeResolved) return;
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.type === "error") {
      safeLogWarn("[TTS WebRTC] OpenAI Realtime error:", msg.error);
      failPlayback(new Error(msg.error?.message || "Realtime TTS failed"));
    } else if (msg.type === "response.done") {
      clearTimeout(startupTimer);
      mark("generation-done", { status: msg.response?.status });
      // Audio-done events also arrive on failed/cancelled/incomplete responses.
      // Only a completed response is eligible to become a replay recording.
      if (msg.response?.status !== "completed") {
        failPlayback(
          new Error(`Realtime TTS response ${msg.response?.status || "unsuccessful"}`),
        );
        return;
      }
      responseSucceeded = true;
      void finishAfterPlaybackDrain();
    } else if (msg.type === "output_audio_buffer.started") {
      clearTimeout(startupTimer);
      startupStage = "playing";
      mark("server-audio-started");
      resolvePlaybackStarted(true);
    } else if (msg.type === "output_audio_buffer.stopped") {
      mark("server-audio-stopped");
      outputBufferStopped = true;
      void finishAfterPlaybackDrain();
    } else if (msg.type === "output_audio_buffer.cleared") {
      failPlayback(new Error("Realtime TTS playback interrupted"));
    } else if (msg.type === "response.output_audio_transcript.done") {
      mark("transcript", { transcript: msg.transcript });
    }
    // response.output_audio.done and response.done describe generation, not
    // playback. Never stop the recorder or infer duration from their tokens.
  };
  dc.onclose = () => {
    if (!finalizeResolved) {
      failPlayback(new Error("Realtime TTS data channel closed"));
    }
  };

  // Expose intentionalEnd flag on audio element for components to check
  audio._ttsIntentionalEnd = () => intentionalEnd;

  const narrationSession = {
    type: "realtime",
    output_modalities: ["audio"],
    instructions: personality
      ? `You are ${personality}, speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim, but in the voice and tone of your character. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided with your character's vocal qualities. Begin immediately with the first word of the text; never preface it with acknowledgments like "Understood" or "Okay".`
      : `You are an audiobook narrator speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided. Begin immediately with the first word of the text; never preface it with acknowledgments like "Understood" or "Okay".`,
    audio: {
      input: { turn_detection: null },
      output: {
        format: { type: "audio/pcm", rate: 24000 },
        voice: sanitizedVoice,
      },
    },
  };

  dc.onopen = () => {
    if (finalizeResolved) return;
    mark("data-channel-open", { prepared: Boolean(warmedConnection) });
    try {
      if (
        warmedConnection &&
        warmedConnection.voice &&
        warmedConnection.voice !== sanitizedVoice
      ) {
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              voice: sanitizedVoice,
              audio: {
                output: {
                  voice: sanitizedVoice,
                },
              },
            },
          }),
        );
      }
      // Send text as content to narrate
      dc.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `[NARRATE THIS TEXT EXACTLY]: ${text}`,
              },
            ],
          },
        }),
      );
      requestNarration();
    } catch (err) {
      failPlayback(err);
    }
  };

  cleanupFn = () => {
    if (finalizeResolved) return;
    intentionalEnd = true;
    rejectReady?.(new Error("TTS playback cancelled"));
    unregisterActiveTTSPlayer(audio, cleanupFn);
    finishFinalize();
  };
  registerActiveTTSPlayer(audio, cleanupFn);
  audio._ttsCleanup = cleanupFn;

  // A timeout/cancel must settle getTTSPlayer even if an underlying browser or
  // App Check promise ignores cancellation. Guard each continuation so late
  // results cannot start speech after the caller has already stopped waiting.
  const assertSetupActive = () => {
    if (finalizeResolved) throw playbackError || new Error("TTS playback cancelled");
  };
  const setupStopped = completion.then(() => { assertSetupActive(); });
  try {
    await Promise.race([setupStopped, (async () => {
      if (warmedConnection) {
        dc.onopen();
      } else {
        mark("offer-start");
        const offer = await pc.createOffer();
        assertSetupActive();
        await pc.setLocalDescription(offer);
        assertSetupActive();
        mark("offer-ready");
        startupStage = "authentication / SDP exchange";
        const resp = await appCheckFetch(realtimeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: offer.sdp, model: REALTIME_MODEL, session: narrationSession }),
          signal: setupController.signal,
        }, { onTiming: (event) => { startupStage = event.phase; mark(event.phase, event); } });
        assertSetupActive();
        const answer = await resp.text();
        assertSetupActive();
        mark("sdp-answer", {
          status: resp.status,
          serverTiming: resp.headers?.get("Server-Timing"),
          runtime: resp.headers?.get("X-TTS-Runtime"),
          appCheck: resp.headers?.get("X-TTS-AppCheck"),
          colo: resp.headers?.get("X-TTS-Colo"),
        });
        if (!resp.ok) throw new Error(`SDP exchange failed: ${resp.status}`);
        startupStage = "connecting audio";
        await pc.setRemoteDescription({ type: "answer", sdp: answer });
        assertSetupActive();
      }
    })()]);
  } catch (error) {
    failPlayback(error);
    await finalize;
    throw error;
  }

  // Prepare the next unused connection while this narration plays. Each player
  // still owns and closes its own connection, so voices/history never leak.
  if (usePreparedConnection && typeof window !== "undefined") void warmRealtimeTTS();

  return {
    audio,
    audioUrl: null,
    ready,
    playbackStarted,
    completion,
    responseComplete,
    finalize,
    done: finalize,
    cleanup: cleanupFn,
  };
}

/**
 * Pre-fetch TTS audio in the background.
 * Call this when content loads to warm the cache before user needs it.
 *
 * @param {Array<{text: string, langTag?: string}>} items - Items to pre-fetch
 * @returns {Promise<void>} Resolves when all pre-fetches complete (or fail silently)
 */
export async function prefetchTTS(items) {
  if (!items || items.length === 0) return;
  const queue = items
    .map((item) => ({
      text: (item?.text || "").trim(),
      langTag: item?.langTag || TTS_LANG_TAG.es,
      voice: item?.voice,
      personality: item?.personality,
    }))
    .filter((item) => item.text);

  const workerCount = Math.min(2, queue.length);
  let nextIndex = 0;
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < queue.length) {
      const item = queue[nextIndex];
      nextIndex += 1;
      try {
        if (
          await isCached(item.text, item.langTag, {
            voice: item.voice,
            personality: item.personality,
          })
        ) {
          continue;
        }
        const player = await getTTSPlayer({
          ...item,
          disableCache: false,
        });
        // Another request may have filled the cache since isCached(). A blob
        // does not autoplay, so there is no playback to await for prefetch.
        if (player.audioUrl) {
          player.cleanup?.();
          continue;
        }
        await player.ready.catch(() => undefined);
        await player.finalize.catch(() => undefined);
        player.cleanup?.();
      } catch {
        // Prefetch should never block the current lesson.
      }
    }
  });
  await Promise.all(workers);
}

/**
 * Check if audio is already cached (memory or IndexedDB)
 * Useful for showing "ready" indicators in UI
 */
export async function isCached(
  text,
  langTag = TTS_LANG_TAG.es,
  { voice, personality } = {},
) {
  const key = getCacheKey(
    text,
    langTag,
    REALTIME_CACHE_FORMAT,
    getPreferredTTSVoice(voice),
    personality,
  );
  if (memoryCache.has(key)) return true;
  const cached = await getFromIndexedDB(key);
  if (cached) {
    memoryCache.set(key, cached);
    return true;
  }
  return false;
}

/**
 * Safely and non-blockingly prefetch TTS audio from Cloudflare Edge Cache / R2 into local cache.
 *
 * GUARANTEES:
 * - NEVER contacts OpenAI or opens WebRTC connections (zero token cost).
 * - Only downloads audio that already exists in Cloudflare R2 / Edge.
 * - Respects navigator.connection.saveData (skips if Data Saver is active).
 * - Runs during idle browser time (requestIdleCallback) with priority: 'low'.
 * - Staggers fetches to avoid cellular packet congestion.
 * - Supports AbortController cancellation on component unmount.
 */
export function prefetchTTSAudio(
  items,
  {
    langTag = TTS_LANG_TAG.es,
    voice = DEFAULT_TTS_VOICE,
    personality = "",
    realtimeUrl = "",
    intervalMs = 120,
  } = {},
) {
  if (!items) {
    return () => {};
  }
  if (typeof navigator !== "undefined" && navigator?.connection?.saveData) {
    return () => {};
  }

  const rawList = Array.isArray(items) ? items : [items];
  const queue = rawList
    .map((item) => {
      if (typeof item === "string") {
        return {
          text: item.trim(),
          langTag,
          voice,
          personality,
        };
      }
      return {
        text: (item?.text || "").trim(),
        langTag: item?.langTag || langTag,
        voice: item?.voice || voice,
        personality: item?.personality || personality,
      };
    })
    .filter((item) => item.text);

  if (queue.length === 0) return () => {};

  const controller = new AbortController();
  const schedule =
    typeof window !== "undefined" &&
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 10);

  let handle = null;
  let timerId = null;

  handle = schedule(async (deadline) => {
    for (const item of queue) {
      if (controller.signal.aborted) break;

      const sanitizedVoice = getPreferredTTSVoice(item.voice);
      const targetLangTag = item.langTag || TTS_LANG_TAG.es;
      const cacheKey = getCacheKey(
        item.text,
        targetLangTag,
        REALTIME_CACHE_FORMAT,
        sanitizedVoice,
        item.personality,
      );

      // 1. Skip if already in memory cache
      if (memoryCache.has(cacheKey)) continue;

      // 2. Skip if already in IndexedDB
      try {
        const locallyCached = await getFromIndexedDB(cacheKey);
        if (locallyCached) {
          memoryCache.set(cacheKey, locallyCached);
          continue;
        }
      } catch {
        // Continue to edge check on IndexedDB error
      }

      // 3. Yield to main thread if deadline expired
      if (
        deadline &&
        typeof deadline.timeRemaining === "function" &&
        deadline.timeRemaining() <= 0
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (controller.signal.aborted) break;

      // 4. Fetch from Cloudflare edge cache (NEVER calls OpenAI on GET)
      try {
        const blob = await fetchFromEdgeCache(cacheKey, realtimeUrl, {
          signal: controller.signal,
          priority: "low",
          timeoutMs: 2500,
        });
        if (blob && blob.size > 0) {
          memoryCache.set(cacheKey, blob);
          saveToIndexedDB(cacheKey, blob, {
            audioPreparationVersion: CACHE_AUDIO_PREPARATION_VERSION,
          }).catch(() => {});
        }
      } catch {
        // Prefetch failures are silent and non-blocking
      }

      // 5. Stagger requests
      if (intervalMs > 0 && !controller.signal.aborted) {
        await new Promise((resolve) => {
          timerId = setTimeout(resolve, intervalMs);
        });
      }
    }
  });

  return () => {
    controller.abort();
    if (timerId) clearTimeout(timerId);
    if (
      typeof window !== "undefined" &&
      typeof window.cancelIdleCallback === "function" &&
      typeof handle === "number"
    ) {
      window.cancelIdleCallback(handle);
    } else if (handle) {
      clearTimeout(handle);
    }
  };
}

/**
 * Synchronously or near-instantaneously play pre-cached TTS audio on user interaction
 * (e.g. word tile drop or click).
 *
 * Checks memory cache (0ms) and IndexedDB (<5ms).
 * NEVER triggers WebRTC connection or OpenAI API calls.
 */
export async function playCachedTTS({
  text,
  langTag = TTS_LANG_TAG.es,
  voice = DEFAULT_TTS_VOICE,
  personality = "",
  warmAudio = null,
} = {}) {
  if (!text || typeof text !== "string") return { played: false, player: null };
  const sanitizedVoice = getPreferredTTSVoice(voice);
  const targetLangTag = langTag || TTS_LANG_TAG.es;
  const cacheKey = getCacheKey(
    text,
    targetLangTag,
    REALTIME_CACHE_FORMAT,
    sanitizedVoice,
    personality,
  );

  let cachedBlob = memoryCache.get(cacheKey);
  if (!cachedBlob) {
    cachedBlob = await getFromIndexedDB(cacheKey);
    if (cachedBlob) memoryCache.set(cacheKey, cachedBlob);
  }

  if (cachedBlob) {
    try {
      const player = createAudioFromBlob(cachedBlob, warmAudio);
      const playPromise = player.audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          safeLogWarn("[playCachedTTS] Playback failed:", err);
        });
      }
      return { played: true, player };
    } catch (err) {
      safeLogWarn("[playCachedTTS] Error creating audio from cached blob:", err);
      return { played: false, player: null };
    }
  }

  return { played: false, player: null };
}

/**
 * Clear all TTS caches (useful for debugging or user-initiated clear)
 */
export async function clearTTSCache() {
  // Clear memory cache
  memoryCache.clear();

  // Clear IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    }
  } catch {
    // Ignore clear errors
  }
}

// Run cleanup on module load (async, non-blocking)
if (typeof window !== "undefined") {
  setTimeout(() => {
    cleanupExpiredCache();
  }, 5000);

  const warmRealtimeWhenIdle = () => {
    void warmRealtimeTTS();
  };
  let idleCallback = null;
  let idleTimer = null;
  if (typeof window.requestIdleCallback === "function") {
    idleCallback = window.requestIdleCallback(warmRealtimeWhenIdle, { timeout: 1000 });
  } else {
    idleTimer = setTimeout(warmRealtimeWhenIdle, 250);
  }

  const primeFromGesture = () => {
    void warmRealtimeTTS();
    void primeTTSAudio();
  };
  window.addEventListener("pointerdown", primeFromGesture, {
    capture: true,
    passive: true,
  });
  window.addEventListener("touchstart", primeFromGesture, {
    capture: true,
    passive: true,
  });
  window.addEventListener("click", primeFromGesture, { capture: true, passive: true });
  const releasePreparedConnection = () => realtimeConnections.clear();
  const handleVisibility = () => {
    if (document.hidden) releasePreparedConnection();
    else void warmRealtimeTTS();
  };
  window.addEventListener("pagehide", releasePreparedConnection);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibility);
  }
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      releasePreparedConnection();
      clearTimeout(idleTimer);
      if (idleCallback !== null) window.cancelIdleCallback?.(idleCallback);
      window.removeEventListener("pointerdown", primeFromGesture, true);
      window.removeEventListener("touchstart", primeFromGesture, true);
      window.removeEventListener("click", primeFromGesture, true);
      window.removeEventListener("pagehide", releasePreparedConnection);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    });
  }
}

const blobUrlCache = new WeakMap();

function getOrCreateBlobUrl(blob) {
  if (!blob) return "";
  let url = blobUrlCache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    blobUrlCache.set(blob, url);
  }
  return url;
}

async function addToCache(cacheKey, blob, realtimeUrl = "") {
  const prepared = await prepareTTSCacheAudio(blob);
  if (!prepared.blob || prepared.isSilent) {
    safeLogWarn(`[TTS Cache] ⚠️ Discarded silent or unverified recording for ${cacheKey}`);
    return;
  }
  memoryCache.set(cacheKey, prepared.blob);
  await saveToIndexedDB(cacheKey, prepared.blob, {
    audioPreparationVersion: prepared.prepared ? CACHE_AUDIO_PREPARATION_VERSION : 0,
  });
  if (realtimeUrl) {
    uploadToEdgeCache(cacheKey, prepared.blob, realtimeUrl).catch(() => {});
  }
}

function createAudioFromBlob(blob, warmAudio = null) {
  activatePlaybackAudioSession();
  const audioUrl = getOrCreateBlobUrl(blob);
  const audio = warmAudio || new Audio();
  try {
    audio.pause?.();
  } catch {
    // Best-effort media cleanup.
  }
  try {
    audio.srcObject = null;
  } catch {
    // Best-effort media cleanup.
  }
  audio.src = audioUrl;
  audio.autoplay = false;
  audio.playsInline = true;

  let cleanedUp = false;
  let resolveCompletion;
  const completion = new Promise((resolve) => { resolveCompletion = resolve; });
  let resolveFinalize;
  const finalize = new Promise((resolve) => {
    resolveFinalize = resolve;
  });

  const cleanup = (event) => {
    if (cleanedUp) return;
    cleanedUp = true;
    unregisterActiveTTSPlayer(audio, cleanup);
    audio.removeEventListener("ended", cleanup);
    audio.removeEventListener("error", cleanup);
    resolveFinalize?.();
    resolveCompletion?.(event?.type === "ended"
      ? { status: "ended" }
      : { status: event?.type === "error" ? "error" : "cancelled", error: event?.type === "error" ? new Error("Cached TTS audio playback failed") : null });
  };
  registerActiveTTSPlayer(audio, cleanup);
  audio._ttsCleanup = cleanup;
  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });

  return {
    audio,
    audioUrl,
    ready: Promise.resolve(),
    completion,
    finalize,
    done: finalize,
    cleanup,
  };
}
