import { appCheckFetch } from "../firebaseResources/firebaseResources";

const REALTIME_MODEL =
  (import.meta.env?.VITE_REALTIME_MODEL || "gpt-realtime-2.1-mini") + "";
const REALTIME_URL =
  import.meta.env?.VITE_REALTIME_URL || ""
    ? `${import.meta.env?.VITE_REALTIME_URL}?model=${encodeURIComponent(
        REALTIME_MODEL,
      )}`
    : "";
const REALTIME_WARMUP_TTL_MS = 4 * 60 * 1000;

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

export const DEFAULT_TTS_VOICE = "alloy";

// Default to opus for size efficiency; allow callers to request lower-latency formats
export const DEFAULT_TTS_FORMAT = "opus";
export const LOW_LATENCY_TTS_FORMAT = "wav";
const REALTIME_CACHE_FORMAT = "realtime-v2";
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
    voice: "coral",
    personality:
      "a sarcastic female cat humanoid, dry wit and playful disdain in every word",
  },
  hamster: {
    voice: "cedar",
    personality:
      "the narrator of the app, a relaxed but confident male voice guiding the experience",
  },
  "purple-girl": {
    voice: "marin",
    personality: "a joyful woman with a Japanese accent, warm and enthusiastic",
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
    const storedVoice =
      typeof window !== "undefined"
        ? window.localStorage?.getItem(RANDOM_DEFAULT_TTS_VOICE_KEY)
        : null;
    if (SUPPORTED_TTS_VOICES.has(storedVoice)) {
      randomDefaultTTSVoice = storedVoice;
      return randomDefaultTTSVoice;
    }
  } catch {
    // Local storage may be blocked; fall back to an in-memory default.
  }

  randomDefaultTTSVoice = getRandomVoice();

  try {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem(
        RANDOM_DEFAULT_TTS_VOICE_KEY,
        randomDefaultTTSVoice,
      );
    }
  } catch {
    // Cache stability is best-effort when storage is unavailable.
  }

  return randomDefaultTTSVoice;
}

export function getPreferredTTSVoice(...candidates) {
  for (const voice of candidates) {
    if (SUPPORTED_TTS_VOICES.has(voice)) return voice;
  }
  // Pick once so realtime-mini TTS can reuse cache entries across replays.
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
  preconnectRealtimeOrigin();

  if (!REALTIME_URL || typeof fetch === "undefined") {
    return Promise.resolve(false);
  }

  const now = Date.now();
  if (!force && now - lastRealtimeWarmupAt < REALTIME_WARMUP_TTL_MS) {
    return realtimeWarmupPromise || Promise.resolve(true);
  }

  lastRealtimeWarmupAt = now;
  realtimeWarmupPromise = appCheckFetch(REALTIME_URL, {
    method: "OPTIONS",
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
  })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      realtimeWarmupPromise = null;
    });

  return realtimeWarmupPromise;
}

export async function createWarmTTSAudio() {
  try {
    const warm = new Audio();
    warm.playsInline = true;
    warm.muted = true;
    warm.volume = 0;
    warm.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    await warm.play().catch(() => undefined);
    try {
      warm.pause();
    } catch {
      // Mobile Safari can reject pausing a just-unlocked element.
    }
    try {
      warm.currentTime = 0;
    } catch {
      // Rewinding is best-effort; the warmed element is still reusable.
    }
    warm.muted = false;
    warm.volume = 1;
    return warm;
  } catch {
    return null;
  }
}

export function primeTTSAudio() {
  if (!sharedWarmAudioPromise) {
    sharedWarmAudioPromise = createWarmTTSAudio().catch(() => null);
  }
  return sharedWarmAudioPromise;
}

async function consumeSharedWarmAudio() {
  const pendingWarmAudio = sharedWarmAudioPromise;
  sharedWarmAudioPromise = null;
  if (!pendingWarmAudio) return null;
  try {
    return await pendingWarmAudio;
  } catch {
    return null;
  }
}

// ============================================================================
// CACHING LAYER
// ============================================================================

// In-memory cache for current session (instant access)
const memoryCache = new Map();
let realtimePreconnectStarted = false;
let realtimeWarmupPromise = null;
let lastRealtimeWarmupAt = 0;
let sharedWarmAudioPromise = null;

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
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
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
async function saveToIndexedDB(key, blob) {
  try {
    const db = await openDB();
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put({
      key,
      blob,
      timestamp: Date.now(),
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
    cleanup?.();
  } catch {
    // Best-effort media cleanup.
  }

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
} = {}) {
  return getRealtimePlayer({
    text,
    voice,
    personality,
    langTag,
    warmAudio,
    disableCache,
  });
}

async function getRealtimePlayer({
  text,
  voice,
  personality,
  langTag,
  warmAudio,
  disableCache,
}) {
  if (!REALTIME_URL) throw new Error("Realtime URL not configured");

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
    const cachedBlob =
      memoryCache.get(cacheKey) || (await getFromIndexedDB(cacheKey));
    if (cachedBlob) {
      memoryCache.set(cacheKey, cachedBlob);
      return createAudioFromBlob(cachedBlob, warmAudio);
    }
  }

  void warmRealtimeTTS();

  const remoteStream = new MediaStream();
  // Reuse a pre-warmed Audio element if provided (already unlocked by user
  // gesture on mobile) so that play() works outside a gesture context.
  const audio = warmAudio || (await consumeSharedWarmAudio()) || new Audio();
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

  const pc = new RTCPeerConnection();
  pc.addTransceiver("audio", { direction: "recvonly" });

  // Track when audio playback has actually started (play() resolved)
  let audioStarted = false;
  let audioEnded = false;
  let responseDone = false;
  let finalizeResolved = false;
  let playbackMonitorTimer = null;
  let responseDoneWatchTimer = null;
  let hardFallbackTimer = null;
  let shouldCacheRealtimeAudio = false;
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
        () => {
          if (shouldCacheRealtimeAudio && cacheChunks.length) {
            const blob = new Blob(cacheChunks, {
              type:
                cacheRecorder.mimeType ||
                cacheChunks[0]?.type ||
                "audio/webm",
            });
            if (blob.size > 512) addToCache(cacheKey, blob);
          }
          resolveCacheRecorderDone?.();
        },
        { once: true },
      );
      cacheRecorder.addEventListener(
        "error",
        () => {
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

  audio.addEventListener(
    "playing",
    () => {
      audioStarted = true;
    },
    { once: true },
  );
  audio.addEventListener(
    "ended",
    () => {
      audioEnded = true;
    },
    { once: true },
  );

  let resolveFinalize;
  const clearFinalizeTimers = () => {
    if (playbackMonitorTimer) {
      clearTimeout(playbackMonitorTimer);
      playbackMonitorTimer = null;
    }
    if (responseDoneWatchTimer) {
      clearTimeout(responseDoneWatchTimer);
      responseDoneWatchTimer = null;
    }
    if (hardFallbackTimer) {
      clearTimeout(hardFallbackTimer);
      hardFallbackTimer = null;
    }
  };
  const finishFinalize = () => {
    if (finalizeResolved) return;
    finalizeResolved = true;
    clearFinalizeTimers();
    resolveFinalize?.();
  };
  const startPlaybackCompletionWatch = () => {
    if (responseDoneWatchTimer) {
      clearTimeout(responseDoneWatchTimer);
      responseDoneWatchTimer = null;
    }
    if (playbackMonitorTimer || finalizeResolved) return;

    const pollMs = 120;
    const stagnantThreshold = 5;
    const maxMonitorMs = Math.max(7000, text.length * 100 + 2500);
    const startedAt = Date.now();
    let lastTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    let sawPlaybackProgress = lastTime > 0.01 || audioStarted;
    let stagnantPolls = 0;

    const poll = () => {
      playbackMonitorTimer = null;
      if (finalizeResolved) return;

      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const hasAdvanced = currentTime > lastTime + 0.01;

      if (hasAdvanced) {
        sawPlaybackProgress = true;
        audioStarted = true;
        stagnantPolls = 0;
        lastTime = currentTime;
      } else if (sawPlaybackProgress || currentTime > 0.01 || audioEnded) {
        sawPlaybackProgress = true;
        stagnantPolls += 1;
      }

      if (
        sawPlaybackProgress &&
        (audioEnded || stagnantPolls >= stagnantThreshold)
      ) {
        finishFinalize();
        return;
      }

      if (
        Date.now() - startedAt >= maxMonitorMs ||
        (!sawPlaybackProgress && audio.paused && Date.now() - startedAt >= 1500)
      ) {
        finishFinalize();
        return;
      }

      playbackMonitorTimer = setTimeout(poll, pollMs);
    };

    playbackMonitorTimer = setTimeout(poll, pollMs);
  };
  const schedulePlaybackCompletionWatch = (delayMs = 0) => {
    if (finalizeResolved) return;
    if (delayMs <= 0) {
      startPlaybackCompletionWatch();
      return;
    }
    if (playbackMonitorTimer || responseDoneWatchTimer) return;
    responseDoneWatchTimer = setTimeout(() => {
      responseDoneWatchTimer = null;
      startPlaybackCompletionWatch();
    }, delayMs);
  };

  const ready = new Promise((resolve, reject) => {
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((t) => {
        remoteStream.addTrack(t);
        t.addEventListener(
          "ended",
          () => {
            if (responseDone) startPlaybackCompletionWatch();
          },
          { once: true },
        );
        t.addEventListener("mute", () => {
          if (responseDone) startPlaybackCompletionWatch();
        });
      });
      startRealtimeCacheRecording();
      resolve();
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        reject(new Error("RTC connection failed"));
      }
    };
  });

  const dc = pc.createDataChannel("oai-events");

  // Track when we're intentionally ending to prevent spurious error events
  let intentionalEnd = false;
  let cleanupFn = null;

  // Request the narration response only AFTER the session (with its narration
  // instructions) is confirmed applied via session.updated, so the model never
  // produces a cold first turn under default conversational behavior (which
  // leaked an "Understood..." preamble). A timer falls back in case the event
  // is missed, so this can never hang.
  let narrationRequested = false;
  let sessionReadyFallbackTimer = null;
  const requestNarration = () => {
    if (narrationRequested) return;
    narrationRequested = true;
    if (sessionReadyFallbackTimer) {
      clearTimeout(sessionReadyFallbackTimer);
      sessionReadyFallbackTimer = null;
    }
    try {
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: { output_modalities: ["audio"] },
        }),
      );
    } catch (err) {
      console.warn("Realtime response.create failed", err);
    }
  };

  // Track when response is done via data channel messages
  const finalize = new Promise((resolve) => {
    resolveFinalize = resolve;
    pc.onconnectionstatechange = () => {
      if (["closed", "failed"].includes(pc.connectionState || "")) {
        finishFinalize();
      }
    };
    audio.addEventListener(
      "ended",
      () => {
        finishFinalize();
      },
      { once: true },
    );
    // Long safety net for cases where the stream never settles cleanly.
    const fallbackTimeoutMs = Math.max(45000, text.length * 180 + 10000);
    hardFallbackTimer = setTimeout(finishFinalize, fallbackTimeoutMs);
  }).finally(async () => {
    unregisterActiveTTSPlayer(audio, cleanupFn);
    // Mark as intentionally ended so components can ignore errors
    intentionalEnd = true;
    audioEnded = true;
    clearFinalizeTimers();
    await stopRealtimeCacheRecording();
    // Dispatch 'ended' as a final notification for components that only watch
    // the media element and do not await the finalize promise.
    try {
      if (audio.onended && !audio.ended) {
        audio.dispatchEvent(new Event("ended"));
      }
    } catch {
      // Some media elements reject synthetic events during teardown.
    }
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

  // Listen for response.done to know when speech synthesis is complete
  dc.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "error") {
        console.warn("Realtime TTS error:", msg.error?.message || msg.error);
      }
      if (msg.type === "session.updated") {
        // Narration instructions are now applied — safe to request the turn.
        requestNarration();
      }
      // Wait for live playback to actually settle before cleaning up.
      if (msg.type === "response.done") {
        responseDone = true;
        shouldCacheRealtimeAudio = true;
        schedulePlaybackCompletionWatch(180);
      }
    } catch {
      // Ignore malformed data-channel events.
    }
  };

  // Expose intentionalEnd flag on audio element for components to check
  audio._ttsIntentionalEnd = () => intentionalEnd;

  dc.onopen = () => {
    try {
      // Configure session for narration/read-aloud mode
      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            output_modalities: ["audio"],
            instructions: personality
              ? `You are ${personality}, speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim, but in the voice and tone of your character. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided with your character's vocal qualities. Begin immediately with the first word of the text; never preface it with acknowledgments like "Understood" or "Okay".`
              : `You are an audiobook narrator speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided. Begin immediately with the first word of the text; never preface it with acknowledgments like "Understood" or "Okay".`,
            audio: {
              input: {
                turn_detection: null,
              },
              output: {
                format: { type: "audio/pcm", rate: 24000 },
                voice: sanitizedVoice,
              },
            },
          },
        }),
      );
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
      // Do NOT request the response yet. Wait for the session.updated event
      // (handled in dc.onmessage) so the narration instructions are guaranteed
      // to be active for the model's first and only turn. The fallback timer
      // fires the request if that event is somehow missed, so we never hang.
      sessionReadyFallbackTimer = setTimeout(requestNarration, 500);
    } catch (err) {
      console.warn("Realtime prompt send failed", err);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const resp = await appCheckFetch(REALTIME_URL, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  });
  const answer = await resp.text();
  if (!resp.ok) throw new Error(`SDP exchange failed: ${resp.status}`);
  await pc.setRemoteDescription({ type: "answer", sdp: answer });

  cleanupFn = () => {
    intentionalEnd = true;
    unregisterActiveTTSPlayer(audio, cleanupFn);
    finishFinalize();
  };
  registerActiveTTSPlayer(audio, cleanupFn);
  audio._ttsCleanup = cleanupFn;

  return { audio, audioUrl: null, ready, finalize, cleanup: cleanupFn };
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
  const cacheKey = getCacheKey(
    text,
    langTag,
    REALTIME_CACHE_FORMAT,
    getPreferredTTSVoice(voice),
    personality,
  );

  // Check memory first (instant)
  if (memoryCache.has(cacheKey)) {
    return true;
  }

  // Check IndexedDB
  const cached = await getFromIndexedDB(cacheKey);
  if (cached) {
    // Promote to memory cache
    memoryCache.set(cacheKey, cached);
    return true;
  }

  return false;
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

  preconnectRealtimeOrigin();
  const warmRealtimeWhenIdle = () => {
    void warmRealtimeTTS();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warmRealtimeWhenIdle, { timeout: 2500 });
  } else {
    setTimeout(warmRealtimeWhenIdle, 1500);
  }

  const primeFromGesture = () => {
    void warmRealtimeTTS();
    void primeTTSAudio();
  };
  window.addEventListener("pointerdown", primeFromGesture, {
    capture: true,
    once: true,
    passive: true,
  });
  window.addEventListener("touchstart", primeFromGesture, {
    capture: true,
    once: true,
    passive: true,
  });
}

function addToCache(cacheKey, blob) {
  memoryCache.set(cacheKey, blob);
  saveToIndexedDB(cacheKey, blob); // async
}

function createAudioFromBlob(blob, warmAudio = null) {
  const audioUrl = URL.createObjectURL(blob);
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
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    unregisterActiveTTSPlayer(audio, cleanup);
    try {
      URL.revokeObjectURL(audioUrl);
    } catch {
      // Object URL may already be gone.
    }
  };
  registerActiveTTSPlayer(audio, cleanup);
  audio._ttsCleanup = cleanup;
  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });

  return {
    audio,
    audioUrl,
    ready: Promise.resolve(),
    finalize: Promise.resolve(),
    cleanup,
  };
}
