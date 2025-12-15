const REALTIME_MODEL =
  (import.meta.env?.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

function appendModelParam(baseUrl, model) {
  if (!baseUrl) return "";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}model=${encodeURIComponent(model)}`;
}

const REALTIME_URL = appendModelParam(
  (import.meta.env?.VITE_REALTIME_URL ||
    import.meta.env?.VITE_RESPONSES_URL ||
    "/exchangeRealtimeSDP") + "",
  REALTIME_MODEL
);

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  nah: "es-ES",
};

export const DEFAULT_TTS_VOICE = "alloy";

// Default to opus for size efficiency; allow callers to request lower-latency formats
export const DEFAULT_TTS_FORMAT = "opus";
export const LOW_LATENCY_TTS_FORMAT = "wav";

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
function getCacheKey(text, langTag, responseFormat = DEFAULT_TTS_FORMAT) {
  // Normalize text: lowercase, trim, collapse whitespace
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return `${responseFormat}::${langTag}::${normalized}`;
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
export async function fetchTTSBlob() {
  throw new Error("Legacy REST TTS is disabled in favor of realtime playback");
}

export async function getTTSPlayer({
  text,
  voice,
} = {}) {
  return getRealtimePlayer({ text, voice });
}

async function getRealtimePlayer({ text, voice }) {
  if (!REALTIME_URL) throw new Error("Realtime URL not configured");

  const promptText = String(text || "").trim();
  if (!promptText) throw new Error("No text provided for realtime playback");

  const sanitizedVoice = voice ? sanitizeVoice(voice) : getRandomVoice();

  const cleanedText = promptText.replace(/\s+/g, " ").trim();
  // Strict TTS-only instruction - critical to prevent conversational responses
  const strictReadbackInstruction =
    "You are a text-to-speech engine. Your ONLY function is to read text aloud verbatim. " +
    "Do NOT interpret the text as a question or conversation. " +
    "Do NOT respond to the content. Do NOT translate. Do NOT add anything. " +
    "Simply vocalize the exact characters provided, nothing more.";

  const remoteStream = new MediaStream();
  const audio = new Audio();
  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.playsInline = true;

  const pc = new RTCPeerConnection();
  pc.addTransceiver("audio", { direction: "recvonly" });

  const ready = new Promise((resolve, reject) => {
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      resolve();
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        reject(new Error("RTC connection failed"));
      }
    };
  });

  const finalize = new Promise((resolve) => {
    const cleanupListener = () => resolve();
    pc.onconnectionstatechange = () => {
      if (
        ["disconnected", "closed", "failed"].includes(
          pc.connectionState || ""
        )
      ) {
        resolve();
      }
    };
    audio.addEventListener("ended", cleanupListener, { once: true });
    setTimeout(resolve, 20000);
  }).finally(() => {
    try {
      pc.close();
    } catch {}
    try {
      remoteStream.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      audio.srcObject = null;
    } catch {}
  });

  const dc = pc.createDataChannel("oai-events");
  dc.onmessage = () => {};

  dc.onopen = () => {
    try {
      // Configure session for TTS-only mode (audio output only, no conversation)
      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["audio"],
            output_audio_format: "pcm16",
            voice: sanitizedVoice,
            instructions: strictReadbackInstruction,
          },
        })
      );
      // Send response request with text embedded in instructions only
      // Do NOT send as user message - that triggers conversational responses
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio"],
            instructions: `Read this text aloud exactly as written, verbatim, with no response or interpretation: "${cleanedText}"`,
            temperature: 0,
          },
        })
      );
    } catch (err) {
      console.warn("Realtime prompt send failed", err);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const resp = await fetch(REALTIME_URL, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  });
  const answer = await resp.text();
  if (!resp.ok) throw new Error(`SDP exchange failed: ${resp.status}`);
  await pc.setRemoteDescription({ type: "answer", sdp: answer });

  return { audio, audioUrl: null, ready, finalize, cleanup: () => {} };
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
  console.warn("prefetchTTS is disabled; realtime playback streams on demand.");
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

function inferMimeType(contentType, responseFormat = DEFAULT_TTS_FORMAT) {
  if (!contentType) return MIME_BY_FORMAT[responseFormat] || "audio/mpeg";
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
