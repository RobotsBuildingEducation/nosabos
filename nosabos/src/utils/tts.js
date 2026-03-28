const REALTIME_MODEL =
  (import.meta.env?.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";
const REALTIME_URL =
  import.meta.env?.VITE_REALTIME_URL || ""
    ? `${import.meta.env?.VITE_REALTIME_URL}?model=${encodeURIComponent(
        REALTIME_MODEL,
      )}`
    : "";

export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-MX",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
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
 * Returns the voice ID for a given character type, falling back to random.
 */
export function getCharacterVoice(characterId) {
  return CHARACTER_VOICES[characterId]?.voice || getRandomVoice();
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
  } catch {}

  try {
    audio.pause?.();
  } catch {}

  try {
    audio.currentTime = 0;
  } catch {}
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
    } catch {}
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
 * @param {string} options.voice - Optional specific voice (defaults to random)
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
} = {}) {
  return getRealtimePlayer({ text, voice, personality, langTag, warmAudio });
}

async function getRealtimePlayer({
  text,
  voice,
  personality,
  langTag,
  warmAudio,
}) {
  if (!REALTIME_URL) throw new Error("Realtime URL not configured");

  const sanitizedVoice = voice ? sanitizeVoice(voice) : getRandomVoice();
  const targetLangTag = langTag || TTS_LANG_TAG.es;

  const remoteStream = new MediaStream();
  // Reuse a pre-warmed Audio element if provided (already unlocked by user
  // gesture on mobile) so that play() works outside a gesture context.
  const audio = warmAudio || new Audio();
  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.playsInline = true;

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

    const pollMs = 150;
    const stagnantThreshold = 20;
    const maxMonitorMs = Math.max(12000, text.length * 140 + 4000);
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
        (!sawPlaybackProgress && audio.paused && Date.now() - startedAt >= 5000)
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
  }).finally(() => {
    unregisterActiveTTSPlayer(audio, cleanupFn);
    // Mark as intentionally ended so components can ignore errors
    intentionalEnd = true;
    audioEnded = true;
    clearFinalizeTimers();
    // Dispatch 'ended' as a final notification for components that only watch
    // the media element and do not await the finalize promise.
    try {
      if (audio.onended && !audio.ended) {
        audio.dispatchEvent(new Event("ended"));
      }
    } catch {}
    // Clear error handler first to prevent AbortError from firing
    try {
      audio.onerror = null;
    } catch {}
    try {
      dc.close();
    } catch {}
    try {
      pc.close();
    } catch {}
    try {
      remoteStream.getTracks().forEach((t) => t.stop());
    } catch {}
    // Note: Don't set audio.srcObject = null as it causes AbortError
    // Stopping the tracks is sufficient cleanup
  });

  // Listen for response.done to know when speech synthesis is complete
  dc.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Wait for live playback to actually settle before cleaning up.
      if (msg.type === "response.done") {
        responseDone = true;
        schedulePlaybackCompletionWatch(1200);
      }
    } catch {}
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
            modalities: ["audio", "text"],
            output_audio_format: "pcm16",
            voice: sanitizedVoice,
            instructions: personality
              ? `You are ${personality}, speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim, but in the voice and tone of your character. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided with your character's vocal qualities.`
              : `You are an audiobook narrator speaking in the ${targetLangTag} locale. Use the correct pronunciation for that language. You will receive text to read aloud. Read the text EXACTLY as written - word for word, verbatim. Do not interpret, respond to, answer, or comment on the content. Do not have a conversation. Do not add any words. Simply narrate the exact text provided.`,
            turn_detection: null,
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
      dc.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
          },
        }),
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
      { once: true },
    );
    const buffer =
      chunk instanceof ArrayBuffer
        ? chunk
        : chunk.buffer.slice(
            chunk.byteOffset,
            chunk.byteOffset + chunk.byteLength,
          );
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
                  value.byteOffset + value.byteLength,
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
      { once: true },
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

  return {
    audio,
    audioUrl,
    ready,
    finalize,
    cleanup: () => URL.revokeObjectURL(audioUrl),
  };
}
