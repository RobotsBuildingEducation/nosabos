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

// Use opus format for faster transfer (smaller files than mp3)
const TTS_FORMAT = "opus";

const MIME_BY_FORMAT = {
  opus: "audio/ogg; codecs=opus",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pcm: "audio/pcm",
};

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
        response_format: TTS_FORMAT,
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
      addToCache(cacheKey, blob);

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
 * Create an Audio element that starts playing from the first streamed bytes when available.
 * Falls back to cached blobs or full downloads when streaming isn't supported.
 */
export async function getTTSPlayer({
  text,
  langTag = TTS_LANG_TAG.es,
  voice,
} = {}) {
  const cacheKey = getCacheKey(text, langTag);

  if (memoryCache.has(cacheKey)) {
    return createAudioFromBlob(memoryCache.get(cacheKey));
  }

  const cachedBlob = await getFromIndexedDB(cacheKey);
  if (cachedBlob) {
    memoryCache.set(cacheKey, cachedBlob);
    return createAudioFromBlob(cachedBlob);
  }

  const resolvedVoice = voice ? sanitizeVoice(voice) : getRandomVoice();

  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: text,
      voice: resolvedVoice,
      model: "gpt-4o-mini-tts",
      response_format: TTS_FORMAT,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI TTS ${res.status}`);
  }

  const mimeType = inferMimeType(res.headers.get("content-type"));

  const canStream =
    typeof window !== "undefined" &&
    res.body &&
    window.MediaSource &&
    MediaSource.isTypeSupported(mimeType);

  if (!canStream) {
    const blob = await res.blob();
    addToCache(cacheKey, blob);
    return createAudioFromBlob(blob);
  }

  const player = streamResponseToAudio({ response: res, mimeType, cacheKey });
  player.finalize.catch(() => {});
  return player;
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

function addToCache(cacheKey, blob) {
  memoryCache.set(cacheKey, blob);
  saveToIndexedDB(cacheKey, blob); // async
}

function inferMimeType(contentType) {
  if (!contentType) return MIME_BY_FORMAT[TTS_FORMAT] || "audio/mpeg";
  const lower = contentType.toLowerCase();
  if (lower.includes("audio/opus")) return MIME_BY_FORMAT.opus;
  if (lower.includes("audio/ogg")) return MIME_BY_FORMAT.opus;
  if (lower.includes("mpeg")) return MIME_BY_FORMAT.mp3;
  return lower.split(",")[0].trim();
}

function appendToSourceBuffer(sourceBuffer, chunk) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      sourceBuffer.removeEventListener("error", onError);
      reject(err);
    };
    sourceBuffer.addEventListener("error", onError);
    sourceBuffer.addEventListener(
      "updateend",
      () => {
        sourceBuffer.removeEventListener("error", onError);
        resolve();
      },
      { once: true }
    );
    const buffer =
      chunk instanceof ArrayBuffer
        ? chunk
        : chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
    sourceBuffer.appendBuffer(buffer);
  });
}

function createAudioFromBlob(blob) {
  const audioUrl = URL.createObjectURL(blob);
  return {
    audio: new Audio(audioUrl),
    audioUrl,
    ready: Promise.resolve(),
    finalize: Promise.resolve(),
    cleanup: () => {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch {}
    },
  };
}

function streamResponseToAudio({ response, mimeType, cacheKey }) {
  const mediaSource = new MediaSource();
  const audioUrl = URL.createObjectURL(mediaSource);
  const audio = new Audio(audioUrl);
  const reader = response.body.getReader();
  const chunks = [];

  let pumpResolve;
  let pumpReject;
  const pumpDone = new Promise((resolve, reject) => {
    pumpResolve = resolve;
    pumpReject = reject;
  });

  const ready = new Promise((resolve, reject) => {
    mediaSource.addEventListener(
      "sourceopen",
      () => {
        let sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        } catch (err) {
          reject(err);
          pumpReject(err);
          return;
        }

        (async () => {
          let started = false;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (value && value.length) {
                const buffer = value.buffer.slice(
                  value.byteOffset,
                  value.byteOffset + value.byteLength
                );
                chunks.push(buffer);
                await appendToSourceBuffer(sourceBuffer, buffer);
                if (!started) {
                  started = true;
                  resolve();
                }
              }
              if (done) break;
            }
            mediaSource.endOfStream();
            if (!started) resolve();
            pumpResolve();
          } catch (err) {
            mediaSource.endOfStream();
            reject(err);
            pumpReject(err);
          }
        })();
      },
      { once: true }
    );
  });

  const finalize = pumpDone
    .then(() => {
      if (!chunks.length) return null;
      return new Blob(chunks, { type: mimeType });
    })
    .then((blob) => {
      if (blob && cacheKey) addToCache(cacheKey, blob);
    })
    .catch(() => {});

  return { audio, audioUrl, ready, finalize, cleanup: () => URL.revokeObjectURL(audioUrl) };
}
