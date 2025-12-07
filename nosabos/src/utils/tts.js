export const TTS_ENDPOINT = "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS";

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  nah: "es-ES",
};

export const DEFAULT_TTS_VOICE = "alloy";

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

// Array version for random selection
const TTS_VOICES_ARRAY = Array.from(SUPPORTED_TTS_VOICES);

/**
 * Returns a randomly selected voice from the available TTS voices.
 * This provides variety in voice playback for a more diverse experience.
 */
export function getRandomVoice() {
  const index = Math.floor(Math.random() * TTS_VOICES_ARRAY.length);
  return TTS_VOICES_ARRAY[index];
}

function sanitizeVoice(voice) {
  return SUPPORTED_TTS_VOICES.has(voice) ? voice : DEFAULT_TTS_VOICE;
}

/**
 * Resolves which voice to use for TTS playback.
 * Now defaults to random voice selection for variety.
 */
export function resolveVoicePreference({ lang, langTag } = {}) {
  // Always use random voice for variety
  return getRandomVoice();
}

const DEFAULT_SAMPLE_RATE = 24000;

const DEFAULT_SAMPLE_RATE = 24000;

// ============================================================================
// CACHING LAYER
// ============================================================================

// In-memory cache for current session (instant access)
const memoryCache = new Map();

// IndexedDB configuration
const DB_NAME = "tts-audio-cache";
const DB_VERSION = 1;
const STORE_NAME = "audio";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// IndexedDB instance (lazy initialized)
let dbPromise = null;

/**
 * Generate a cache key from text (voice-agnostic for better cache hits)
 */
function getCacheKey(text, langTag) {
  // Normalize text: lowercase, trim, collapse whitespace
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return `${langTag}::${normalized}`;
}

/**
 * Open/initialize IndexedDB
 */
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
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

// Track in-flight requests to avoid duplicate fetches
const inFlightRequests = new Map();

/**
 * Fetch TTS audio with multi-layer caching:
 * 1. Check in-memory cache (instant)
 * 2. Check IndexedDB cache (fast)
 * 3. Fetch from API (slow, but cached for future)
 *
 * @param {Object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.langTag - Language tag (e.g., "es-ES")
 * @param {string} options.voice - Optional specific voice (defaults to random)
 * @returns {Promise<Blob>} Audio blob
 */
export async function fetchTTSBlob({ text, langTag = TTS_LANG_TAG.es, voice }) {
  const cacheKey = getCacheKey(text, langTag);

  // 1. Check in-memory cache (instant)
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. Check if there's already an in-flight request for this key
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Create the fetch promise (checks IndexedDB, then network)
  const fetchPromise = (async () => {
    try {
      // Check IndexedDB cache
      const cachedBlob = await getFromIndexedDB(cacheKey);
      if (cachedBlob) {
        // Store in memory for even faster subsequent access
        memoryCache.set(cacheKey, cachedBlob);
        return cachedBlob;
      }

      // Fetch from API
      const resolvedVoice = voice ? sanitizeVoice(voice) : getRandomVoice();

      const payload = {
        input: text,
        voice: resolvedVoice,
        model: "gpt-4o-mini-tts",
        response_format: "opus",
      };

      const res = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`OpenAI TTS ${res.status}`);
      }

      const blob = await res.blob();

      // Cache in both layers
      memoryCache.set(cacheKey, blob);
      saveToIndexedDB(cacheKey, blob); // async, don't await

      return blob;
    } finally {
      // Remove from in-flight after completion
      inFlightRequests.delete(cacheKey);
    }
  })();

  // Track in-flight request
  inFlightRequests.set(cacheKey, fetchPromise);

  return fetchPromise;
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

  const promises = items.map(({ text, langTag = TTS_LANG_TAG.es }) => {
    // Skip if already cached in memory
    const cacheKey = getCacheKey(text, langTag);
    if (memoryCache.has(cacheKey)) {
      return Promise.resolve();
    }

    // Fetch silently (don't throw on error)
    return fetchTTSBlob({ text, langTag }).catch(() => {
      // Ignore pre-fetch errors silently
    });
  });

  await Promise.all(promises);
}

/**
 * Check if audio is already cached (memory or IndexedDB)
 * Useful for showing "ready" indicators in UI
 */
export async function isCached(text, langTag = TTS_LANG_TAG.es) {
  const cacheKey = getCacheKey(text, langTag);

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

// ============================================================================
// REALTIME STREAMING TTS (low-latency playback)
// ============================================================================

function parseSseEvents(buffer) {
  const events = [];
  let remaining = buffer;
  let idx = remaining.indexOf("\n\n");
  while (idx !== -1) {
    const raw = remaining.slice(0, idx);
    remaining = remaining.slice(idx + 2);
    const lines = raw.split(/\n/);
    let event = "message";
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }
    events.push({ event, data: dataLines.join("\n") });
    idx = remaining.indexOf("\n\n");
  }
  return { events, remaining };
}

function base64ToInt16(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function schedulePcmChunk({ ctx, int16, sampleRate, startAt, scheduledSources }) {
  const audioBuffer = ctx.createBuffer(1, int16.length, sampleRate);
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) {
    channel[i] = int16[i] / 32768;
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(startAt.time);
  scheduledSources.push(source);
  startAt.time += audioBuffer.duration;
}

/**
 * Start realtime OpenAI TTS playback. Returns a controller with a `stop()`
 * function and a `done` promise that resolves once playback ends.
 */
export function startRealtimeTTSPlayback({
  text,
  voice = getRandomVoice(),
  model = "gpt-4o-mini-realtime-preview",
  sampleRate = DEFAULT_SAMPLE_RATE,
  onFirstAudio,
  signal,
}) {
  const abortController = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => abortController.abort(), {
      once: true,
    });
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate });
  const scheduledSources = [];
  const startAt = { time: ctx.currentTime + 0.05 };
  let firstAudioSent = false;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    abortController.abort();
    scheduledSources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    ctx.close?.();
  };

  const done = (async () => {
    const res = await fetch(TTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
      body: JSON.stringify({
        input: text,
        voice: sanitizeVoice(voice),
        model,
        sample_rate: sampleRate,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Realtime TTS ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let doneStreaming = false;

    while (!doneStreaming) {
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, remaining } = parseSseEvents(buffer);
      buffer = remaining;
      for (const evt of events) {
        if (evt.event === "audio" && evt.data) {
          const int16 = base64ToInt16(evt.data);
          schedulePcmChunk({
            ctx,
            int16,
            sampleRate,
            startAt,
            scheduledSources,
          });
          if (!firstAudioSent) {
            firstAudioSent = true;
            onFirstAudio?.();
          }
        } else if (evt.event === "config" && evt.data) {
          // Config event is informational only for now
        } else if (evt.event === "error") {
          try {
            const parsed = JSON.parse(evt.data);
            throw new Error(parsed?.message || "Realtime TTS error");
          } catch (err) {
            throw err;
          }
        } else if (evt.event === "done") {
          doneStreaming = true;
          break;
        }
      }
    }

    const remainingMs = Math.max((startAt.time - ctx.currentTime) * 1000, 0);
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }
    await ctx.close?.();
  })();

  return { stop, done };
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
}
