import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createStoryAudio } from "../features/stories/storyAudio.js";
import { prepareTTSCacheAudio } from "./ttsCacheAudio.js";
import { createRealtimeTTSConnectionPool } from "./realtimeTTSConnection.js";

// Execute the real player with controllable browser/media APIs. Only Firebase
// and Vite's environment binding are replaced; completion/cache code is intact.
const source = readFileSync(new URL("./tts.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/gm, "")
  .replaceAll("import.meta.env", '({ DEV: true, VITE_REALTIME_URL: "https://tts.test/rtc" })')
  .replaceAll("import.meta.hot", "undefined")
  .replaceAll("export ", "");
const options = { text: "Lee esta frase completa hasta la última palabra.", voice: "ash", langTag: "es-MX" };
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

function harness({ stored = new Map(), edgeStored = new Map(), fetchImpl, setupFails = false, noTracks = false, stats = new Map(), recorderFails = false, recorderStalls = false, storageFails = false, storageStalls = false, mutedAutoplayFails = false, mutedPlayPending = false, unlockPlayPending = false, exchange, prepareCache = prepareTTSCacheAudio } = {}) {
  let now = 10000;
  let nextTimer = 0;
  const timers = new Map();
  const peers = [];
  const recorders = [];
  const audios = [];
  const urls = new Map();
  let posts = 0;
  const requests = [];
  class Audio extends EventTarget {
    constructor() { super(); audios.push(this); }
    currentTime = 0;
    paused = true;
    ended = false;
    removeAttribute() {}
    load() {}
    pause() { this.paused = true; }
    async play() {
      if (this.muted && mutedAutoplayFails) throw new Error("Muted autoplay blocked");
      this.paused = false; this.dispatchEvent(new Event("playing"));
      if (this.src?.startsWith("data:audio/") && unlockPlayPending) return new Promise((resolve, reject) => { this.resolveUnlock = resolve; this.rejectUnlock = reject; });
      if (this.muted && mutedPlayPending) return new Promise((resolve, reject) => { this.rejectPlay = reject; });
    }
    dispatchEvent(event) {
      super.dispatchEvent(event);
      this[`on${event.type}`]?.(event);
      return true;
    }
  }
  class Track extends EventTarget {
    stopped = false;
    stop() { this.stopped = true; }
  }
  class MediaStream {
    tracks = [];
    addTrack(track) { this.tracks.push(track); }
    getTracks() { return this.tracks; }
    getAudioTracks() { return this.tracks; }
  }
  class MediaRecorder extends EventTarget {
    static isTypeSupported() { return true; }
    state = "inactive";
    mimeType = "audio/webm";
    finalChunk = "";
    constructor() { super(); recorders.push(this); }
    start() { this.state = "recording"; }
    chunk(text) {
      const event = new Event("dataavailable");
      event.data = new Blob([text], { type: this.mimeType });
      this.dispatchEvent(event);
    }
    requestData() {}
    stop() {
      this.state = "inactive";
      if (recorderStalls) return;
      queueMicrotask(() => {
        if (recorderFails) this.dispatchEvent(new Event("error"));
        // The last dataavailable is asynchronous and precedes stop in browsers.
        this.chunk(this.finalChunk);
        this.dispatchEvent(new Event("stop"));
      });
    }
  }
  class RTCPeerConnection {
    connectionState = "connected";
    track = new Track();
    channel = {
      readyState: "connecting",
      sent: [],
      send: (message) => this.channel.sent.push(JSON.parse(message)),
      close: () => { this.channel.readyState = "closed"; this.channel.onclose?.(); },
    };
    constructor() { peers.push(this); }
    addTransceiver() {}
    createDataChannel() { return this.channel; }
    async createOffer() { return { sdp: "offer" }; }
    async setLocalDescription() {}
    async setRemoteDescription() {
      if (!noTracks) this.ontrack({ streams: [], track: this.track });
      this.channel.readyState = "open";
      this.channel.onopen();
    }
    async getStats() { return stats; }
    close() { this.connectionState = "closed"; this.onconnectionstatechange?.(); }
  }
  const indexedDB = {
    open() {
      const request = {};
      if (storageStalls) return request;
      queueMicrotask(() => {
        request.result = {
          transaction() {
            const transaction = {
              objectStore: () => ({
                get(key) {
                  const read = {};
                  queueMicrotask(() => { read.result = stored.get(key); read.onsuccess(); });
                  return read;
                },
                put(value) {
                  queueMicrotask(() => {
                    if (storageFails) transaction.onabort?.();
                    else { stored.set(value.key, value); transaction.oncomplete?.(); }
                  });
                },
                delete: (key) => stored.delete(key),
                clear: () => stored.clear(),
              }),
            };
            return transaction;
          },
        };
        request.onsuccess();
      });
      return request;
    },
  };
  const context = vm.createContext({
    Audio, MediaStream, MediaRecorder, RTCPeerConnection, indexedDB, Blob, Event, AbortController,
    prepareTTSCacheAudio: prepareCache,
    createRealtimeTTSConnectionPool,
    Date: class extends Date { static now() { return now; } },
    URL: class extends URL { static createObjectURL(blob) { const url = `blob:test-${urls.size}`; urls.set(url, blob); return url; } },
    console: { warn() {} },
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch: fetchImpl || (async (_url) => {
      const match = String(_url).match(/\/audio\/(.+)$/);
      if (match) {
        const key = decodeURIComponent(match[1]);
        const blob = edgeStored.get(key);
        if (blob) {
          return {
            status: 200,
            headers: new Headers({ "Content-Type": blob.type || "audio/wav" }),
            blob: async () => blob,
          };
        }
      }
      return { status: 404, blob: async () => null };
    }),
    appCheckFetch: async (_url, request) => {
      if (request.method === "POST") { posts++; requests.push({ ...request, url: _url }); }
      if (request.method === "PUT") {
        requests.push({ ...request, url: _url });
        const match = String(_url).match(/\/audio\/(.+)$/);
        if (match) {
          const key = decodeURIComponent(match[1]);
          edgeStored.set(key, request.body);
        }
        return { ok: true, status: 201 };
      }
      if (exchange) return exchange(_url, request);
      return { ok: !setupFails, status: 502, text: async () => "answer" };
    },
  });
  vm.runInContext(`${source}\nglobalThis.api = { getTTSPlayer, createWarmTTSAudio, primeTTSAudio, isCached, stopAllTTSPlayback, warmRealtimeTTS, setTTSConnectionWarmupEnabled, clearPreparedConnection: () => realtimeConnections.clear(), prefetchTTSAudio, playCachedTTS };`, context);
  return {
    api: context.api, peers, recorders, audios, stored, edgeStored, urls, timers, requests,
    get posts() { return posts; },
    send(message) { peers.at(-1).channel.onmessage({ data: JSON.stringify(message) }); },
    async advance(ms) {
      const target = now + ms;
      await flush();
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
        await flush();
      }
      now = target;
      await flush();
    },
  };
}
const generated = { type: "response.done", response: { status: "completed", usage: { output_token_details: { audio_tokens: 1 } } } };
const drained = { type: "output_audio_buffer.stopped" };

async function start(h, opts = options) {
  const player = await h.api.getTTSPlayer(opts);
  await player.ready;
  await player.audio.play();
  h.send({ type: "session.updated" });
  return player;
}

test("narration is configured at call creation and starts without waiting for session.updated", async () => {
  const h = harness();
  const player = await h.api.getTTSPlayer({ ...options, personality: "a wise toad" });
  const request = h.requests[0];
  assert.equal(request.headers["Content-Type"], "application/json");
  const { sdp, session, model } = JSON.parse(request.body);
  assert.equal(sdp, "offer");
  assert.equal(model, "gpt-realtime-2.1-mini");
  assert.equal(session.audio.output.voice, "ash");
  assert.equal(session.audio.input.turn_detection, null);
  assert.match(session.instructions, /a wise toad/);
  assert.match(session.instructions, /es-MX/);
  assert.match(session.instructions, /EXACTLY as written/);
  assert.deepEqual(h.peers[0].channel.sent.map((event) => event.type), ["conversation.item.create", "response.create"]);
  h.send({ type: "session.updated" });
  assert.equal(h.peers[0].channel.sent.filter((event) => event.type === "response.create").length, 1);
  player.cleanup();
  await player.finalize;
});

test("preparation opens receive-only transport without generating audio, and first play consumes it", async () => {
  const h = harness();
  assert.equal(await h.api.warmRealtimeTTS(), true);
  assert.equal(await h.api.warmRealtimeTTS(), true);
  assert.equal(h.posts, 1, "Repeated warmups share one prepared connection");
  assert.equal(h.recorders.length, 0, "Idle silence is not recorded");
  assert.equal(h.peers[0].channel.sent.length, 0, "No text or response is sent while warming");
  const idleAudio = h.audios[0];
  assert.equal(idleAudio.muted, true, "Idle RTP silence is consumed without audible playback");
  assert.equal(idleAudio.paused, false);
  assert.equal(idleAudio.srcObject.getAudioTracks()[0], h.peers[0].track);
  assert.equal(JSON.parse(h.requests[0].body).session.audio.input.turn_detection, null);
  const player = await h.api.getTTSPlayer({ ...options, voice: "cedar", personality: "a friendly narrator" });
  await player.ready;
  assert.equal(idleAudio.paused, true);
  assert.equal(idleAudio.srcObject, null, "Release the silent consumer after handoff");
  assert.equal(h.peers[0].track.stopped, false, "Handoff must not stop the active audio track");
  assert.equal(h.posts, 1, "Pressing Play does not perform another handshake");
  const messages = h.peers[0].channel.sent;
  assert.equal(messages[0].type, "session.update");
  assert.equal(messages[0].session.audio.output.voice, "cedar");
  assert.equal(messages[1].type, "conversation.item.create");
  assert.equal(messages[2].type, "response.create");
  assert.match(messages[2].response.instructions, /friendly narrator/);
  assert.match(messages[2].response.instructions, /es-MX/);
  assert.equal(messages.some((event) => event.type === "session.update"), true);
  h.send({ type: "session.updated" });
  assert.equal(messages.filter((event) => event.type === "response.create").length, 1);
  h.recorders[0].finalChunk = "complete narration ".repeat(100);
  h.send(generated); h.send(drained); await h.advance(1000);
  await player.finalize;
  assert.equal(h.peers[0].track.stopped, true);
  assert.equal(h.timers.size, 0);
});

test("concurrent players cannot claim the same prepared connection or share voices", async () => {
  const h = harness();
  await h.api.warmRealtimeTTS();
  const players = await Promise.all([
    h.api.getTTSPlayer({ ...options, voice: "cedar" }),
    h.api.getTTSPlayer({ ...options, voice: "coral", text: "A different line" }),
  ]);
  assert.equal(h.peers.length, 2);
  assert.equal(h.posts, 2);
  const cedarUpdate = h.peers[0].channel.sent.find((event) => event.type === "session.update");
  assert.equal(cedarUpdate.session.audio.output.voice, "cedar");
  assert.equal(JSON.parse(h.requests[1].body).session.audio.output.voice, "coral");
  players.forEach((player) => player.cleanup());
  await Promise.all(players.map((player) => player.finalize));
  assert.equal(h.peers.every((peer) => peer.track.stopped), true);
  assert.equal(h.timers.size, 0);
});

test("cached playback leaves the prepared connection available for a different uncached phrase", async () => {
  const h = harness();
  const generatedPlayer = await start(h);
  h.recorders[0].finalChunk = "complete narration ".repeat(100);
  h.send(generated); h.send(drained); await h.advance(1000); await generatedPlayer.finalize;
  await h.api.warmRealtimeTTS();
  const replay = await h.api.getTTSPlayer(options);
  assert.ok(replay.audioUrl);
  replay.cleanup();
  const next = await h.api.getTTSPlayer({ ...options, text: "Another uncached phrase" });
  assert.equal(h.posts, 2);
  assert.equal(h.peers.length, 2);
  assert.equal(h.peers[1].channel.sent[1].type, "response.create");
  next.cleanup(); await next.finalize;
});

test("an unused prepared connection expires and disconnects without producing speech", async () => {
  const h = harness();
  await h.api.warmRealtimeTTS();
  await h.advance(4 * 60 * 1000);
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.peers[0].track.stopped, true);
  assert.equal(h.peers[0].channel.sent.length, 0);
  assert.equal(h.audios[0].paused, true);
  assert.equal(h.audios[0].srcObject, null);
  assert.equal(h.timers.size, 0);
  const player = await h.api.getTTSPlayer(options);
  assert.equal(h.posts, 2);
  player.cleanup(); await player.finalize;
});

test("a failed warmup is released and does not cause a retry storm", async () => {
  const h = harness({ setupFails: true });
  assert.equal(await h.api.warmRealtimeTTS(), false);
  assert.equal(await h.api.warmRealtimeTTS(), false);
  assert.equal(h.posts, 1);
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.timers.size, 0);
});

test("blocked muted autoplay discards the unused connection and preserves on-demand playback", async () => {
  const h = harness({ mutedAutoplayFails: true });
  assert.equal(await h.api.warmRealtimeTTS(), false);
  assert.equal(await h.api.warmRealtimeTTS(), false);
  assert.equal(h.posts, 1, "Autoplay failure observes the retry cooldown");
  assert.equal(h.peers[0].track.stopped, true);
  assert.equal(h.audios[0].srcObject, null);
  const player = await h.api.getTTSPlayer(options);
  await player.ready;
  assert.equal(h.posts, 2);
  assert.equal(h.peers[1].channel.sent[1].type, "response.create");
  player.cleanup(); await player.finalize;
});

test("detaching an idle sink with a pending play promise cannot close the claimed transport", async () => {
  const h = harness({ mutedPlayPending: true });
  assert.equal(await h.api.warmRealtimeTTS(), true);
  const idleAudio = h.audios[0];
  const player = await h.api.getTTSPlayer(options);
  await player.ready;
  idleAudio.rejectPlay(new Error("AbortError: playback interrupted by pause"));
  await flush();
  assert.equal(h.peers[0].connectionState, "connected");
  assert.equal(h.peers[0].track.stopped, false);
  player.cleanup(); await player.finalize;
  assert.equal(h.peers[0].track.stopped, true);
});

test("visibility/page cleanup closes unused transport and aborts a pending preparation", async () => {
  const ready = harness();
  await ready.api.warmRealtimeTTS();
  ready.api.clearPreparedConnection();
  assert.equal(ready.peers[0].track.stopped, true);
  assert.equal(ready.peers[0].connectionState, "closed");
  assert.equal(ready.timers.size, 0);
  const pending = harness({ noTracks: true });
  const preparation = pending.api.warmRealtimeTTS();
  await flush();
  pending.api.clearPreparedConnection();
  assert.equal(await preparation, false);
  assert.equal(pending.requests[0].signal.aborted, true);
  assert.equal(pending.peers[0].connectionState, "closed");
  assert.equal(pending.timers.size, 0);
});

test("preparation times out when media never arrives and an in-flight connection can be claimed only once", async () => {
  const pending = harness({ noTracks: true });
  const preparation = pending.api.warmRealtimeTTS();
  await pending.advance(15000);
  assert.equal(await preparation, false);
  assert.equal(pending.requests[0].signal.aborted, true);
  assert.equal(pending.timers.size, 0);
  const h = harness();
  const warming = h.api.warmRealtimeTTS();
  const player = await h.api.getTTSPlayer(options);
  assert.equal(await warming, true);
  assert.equal(h.posts, 1);
  assert.equal(h.peers[0].channel.sent[1].type, "response.create");
  player.cleanup(); await player.finalize;
  assert.equal(h.timers.size, 0);
});

test("prepared narration sends its settings atomically without requiring an acknowledgement", async () => {
  const h = harness();
  await h.api.warmRealtimeTTS();
  const player = await h.api.getTTSPlayer({ ...options, voice: "shimmer", personality: "a bubbly companion" });
  await h.advance(5000);
  const sessionUpdates = h.peers[0].channel.sent.filter((event) => event.type === "session.update");
  assert.equal(sessionUpdates.length, 1);
  assert.equal(sessionUpdates[0].session.audio.output.voice, "shimmer");
  const responses = h.peers[0].channel.sent.filter((event) => event.type === "response.create");
  assert.equal(responses.length, 1);
  assert.match(responses[0].response.instructions, /bubbly companion/);
  assert.equal(h.stored.size, 0);
  player.cleanup(); await player.finalize;
  assert.equal(h.timers.size, 0);
});

test("benchmark bypasses prepared transport, all cache work, and does not change the app endpoint", async () => {
  let cacheWork = 0;
  const h = harness({ prepareCache: async (blob) => { cacheWork++; return { blob, prepared: true }; } });
  await h.api.warmRealtimeTTS();
  h.api.setTTSConnectionWarmupEnabled(false);
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(await h.api.warmRealtimeTTS({ force: true }), false);
  const events = [];
  const player = await h.api.getTTSPlayer({
    ...options, disableCache: true, usePreparedConnection: false,
    benchmarkEndpoint: "https://us-central1-nosabo-30dcb.cloudfunctions.net/exchangeRealtimeSDP",
    onDiagnostic: (event) => events.push(event),
  });
  assert.match(h.requests[1].url, /cloudfunctions.net/);
  assert.equal(events.find((event) => event.phase === "connection-selected").prepared, false);
  h.send(generated); h.send(drained); await h.advance(1000); await player.finalize;
  assert.equal(h.posts, 2);
  assert.equal(h.recorders.length, 0);
  assert.equal(cacheWork, 0);
  assert.equal(h.stored.size, 0);
  assert.ok(events.some((event) => event.phase === "narration-requested"));
  const next = await h.api.getTTSPlayer({ ...options, onDiagnostic: () => { throw new Error("observer"); } });
  assert.match(h.requests[2].url, /^https:\/\/tts.test\//);
  next.cleanup(); await next.finalize;
  await assert.rejects(h.api.getTTSPlayer({ ...options, benchmarkEndpoint: "https://untrusted.test" }), /Unsupported/);
});

test("an old complete v7 cache entry is repaired once with no new connection or TTL extension", async () => {
  const key = `v2::realtime-v7::es-MX::ash::::${options.text}`;
  const stored = new Map([[key, { key, blob: new Blob(["old silence and speech"]), timestamp: 9000 }]]);
  let repairs = 0;
  const prepareCache = async () => { repairs++; return { blob: new Blob(["speech only"], { type: "audio/wav" }), prepared: true }; };
  const h = harness({ stored, prepareCache });
  const player = await h.api.getTTSPlayer(options);
  assert.equal(h.posts, 0);
  assert.equal(await h.urls.get(player.audioUrl).text(), "speech only");
  assert.equal(stored.get(key).timestamp, 9000);
  assert.equal(stored.get(key).audioPreparationVersion, 1);
  player.cleanup();
  const reloaded = harness({ stored, prepareCache });
  const replay = await reloaded.api.getTTSPlayer(options);
  assert.equal(repairs, 1);
  assert.equal(reloaded.posts, 0);
  replay.cleanup();
});

test("new completed recordings are prepared before caching and cache repair failures preserve playback", async () => {
  let prepared = 0;
  const h = harness({ prepareCache: async (blob) => { prepared++; return { blob, prepared: true }; } });
  const player = await start(h);
  h.recorders[0].finalChunk = "complete recording ".repeat(100);
  h.send(generated); h.send(drained); await h.advance(1000);
  await player.finalize;
  assert.equal(prepared, 1);
  assert.equal([...h.stored.values()][0].audioPreparationVersion, 1);
  const fallback = harness({ stored: new Map([...h.stored].map(([key, entry]) => [key, { ...entry, audioPreparationVersion: 0 }])), prepareCache: async (blob) => ({ blob, prepared: false }) });
  const replay = await fallback.api.getTTSPlayer(options);
  assert.equal(fallback.posts, 0);
  assert.equal(await fallback.urls.get(replay.audioUrl).text(), "complete recording ".repeat(100));
  replay.cleanup();
});

test("generation completion and a stalled media clock cannot truncate playback or its replay", async () => {
  const h = harness();
  const player = await start(h);
  let finished = false;
  let responseComplete = false;
  player.finalize.then(() => { finished = true; });
  player.responseComplete.then(() => { responseComplete = true; });
  const first = "first second ".repeat(100);
  const last = "last spoken word ".repeat(100);
  h.recorders[0].chunk(first);
  h.send({ type: "response.output_audio.done" });
  h.send(generated);
  await h.advance(8000); // Much longer than the old 450ms/token/stagnation timers.
  assert.equal(finished, false);
  assert.equal(responseComplete, false);
  assert.equal(h.recorders[0].state, "recording");
  assert.equal(h.peers[0].track.stopped, false);
  assert.equal(await h.api.isCached(options.text, options.langTag, options), false);

  h.send(drained);
  await h.advance(500);
  h.recorders[0].finalChunk = last; // Last RTP audio arrives after the data-channel event.
  assert.equal(finished, false);
  await h.advance(500);
  await player.finalize;
  assert.equal(responseComplete, true);
  assert.equal((await player.completion).status, "ended");
  assert.equal(h.peers[0].track.stopped, true);
  assert.equal(h.stored.size, 1);
  assert.equal(await [...h.stored.values()][0].blob.text(), first + last);

  const replay = await h.api.getTTSPlayer(options);
  assert.equal(h.posts, 1);
  assert.equal(await h.urls.get(replay.audioUrl).text(), first + last);
  let replayFinished = false;
  replay.finalize.then(() => { replayFinished = true; });
  await replay.audio.play();
  await flush();
  assert.equal(replayFinished, false);
  replay.audio.dispatchEvent(new Event("ended"));
  await replay.finalize;
  assert.equal(replayFinished, true);
  assert.equal((await replay.completion).status, "ended");

  const reloaded = harness({ stored: h.stored });
  const persistedReplay = await reloaded.api.getTTSPlayer(options);
  assert.ok(persistedReplay.audioUrl);
  assert.equal(reloaded.posts, 0);
  assert.equal(await reloaded.urls.get(persistedReplay.audioUrl).text(), first + last);
  persistedReplay.cleanup();
});

test("radio advances two real TTS lifecycles even if browser play promises never settle", async () => {
  const h = harness(); let complete = false;
  const queue = createStoryAudio({
    getPlayer: async (turn) => {
      const player = await h.api.getTTSPlayer({ ...options, text: turn.target });
      player.audio.play = () => new Promise(() => {});
      return player;
    },
    onState() {}, onError: assert.fail,
  });
  const pending = queue.play([{ speaker: "Host", target: "Hola, bienvenida a la radio." }, { speaker: "Caller", target: "Gracias, quiero hablar de mi familia." }], () => { complete = true; });
  await flush();
  h.send(generated); h.send(drained); await h.advance(1000); await flush();
  assert.equal(h.peers.length, 2, "The caller starts after the host's actual playout drain");
  assert.equal(complete, false);
  h.send(generated); h.send(drained); await h.advance(1000);
  await pending; await flush();
  assert.equal(complete, true);
  assert.equal(h.peers.every((peer) => peer.track.stopped), true);
});

for (const reason of ["cancelled", "failed", "incomplete", "cleared", "connection", "channel", "user", "timeout", "media", "recorder"]) {
  test(`${reason} attempts never cache partial recordings`, async () => {
    const h = harness({ recorderFails: reason === "recorder" });
    const player = await start(h);
    h.recorders[0].chunk("partial audio ".repeat(100));
    h.send(generated);
    if (["cancelled", "failed", "incomplete"].includes(reason)) h.send({ type: "response.done", response: { status: reason } });
    if (reason === "cleared") h.send({ type: "output_audio_buffer.cleared" });
    if (reason === "connection") { h.peers[0].connectionState = "failed"; h.peers[0].onconnectionstatechange(); }
    if (reason === "channel") h.peers[0].channel.close();
    if (reason === "user") { h.send(drained); await h.advance(500); h.api.stopAllTTSPlayback(); }
    if (reason === "timeout") await h.advance(60000);
    if (reason === "media") player.audio.dispatchEvent(new Event("error"));
    if (reason === "recorder") { h.send(drained); await h.advance(1000); }
    await player.finalize;
    assert.equal((await player.completion).status, reason === "user" ? "cancelled" : reason === "recorder" ? "ended" : "error");
    assert.equal(h.stored.size, 0);
    assert.equal(await h.api.isCached(options.text, options.langTag, options), false);
    assert.equal(h.peers[0].track.stopped, true);
    assert.equal(h.timers.size, 0);
  });
}

test("legacy recordings are neither replayed nor reported as ready", async () => {
  const stored = new Map();
  for (let v = 1; v <= 5; v++) {
    const key = `v2::realtime-v${v}::es-MX::alloy::::${options.text}`;
    stored.set(key, { key, blob: new Blob(["truncated".repeat(100)]), timestamp: 10000 });
  }
  const h = harness({ stored });
  assert.equal(await h.api.isCached(options.text, options.langTag, options), false);
  const player = await start(h);
  assert.equal(player.audioUrl, null);
  assert.equal(h.posts, 1);
  player.cleanup();
  await player.finalize;
});

test("buffer drain still requires a successful response, including reordered events", async () => {
  const h = harness();
  const player = await start(h);
  h.recorders[0].finalChunk = "complete ".repeat(100);
  h.send(drained);
  await h.advance(2000);
  assert.equal(h.recorders[0].state, "recording");
  assert.equal(h.stored.size, 0);
  h.send(generated);
  h.send(drained); // Duplicate events must not reschedule or save twice.
  await h.advance(1000);
  await player.finalize;
  assert.equal(h.stored.size, 1);
});

test("receiver buffering extends the recording tail", async () => {
  const h = harness({ stats: new Map([["audio", { type: "inbound-rtp", kind: "audio", jitterBufferEmittedCount: 100, jitterBufferDelay: 200 }]]) });
  const player = await start(h);
  h.recorders[0].finalChunk = "complete ".repeat(100);
  h.send(generated);
  h.send(drained);
  await h.advance(2000);
  assert.equal(h.recorders[0].state, "recording");
  await h.advance(500);
  await player.finalize;
  assert.equal(h.stored.size, 1);
});

test("setup failure closes the peer and cancels timers", async () => {
  const h = harness({ setupFails: true });
  await assert.rejects(h.api.getTTSPlayer(options), /SDP exchange failed/);
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.timers.size, 0);
});

test("missing tracks time out and reject ready instead of hanging", async () => {
  const h = harness({ noTracks: true });
  const player = await h.api.getTTSPlayer(options);
  const rejection = assert.rejects(player.ready, /timed out/);
  await h.advance(60000);
  await rejection;
  await player.finalize;
  assert.equal(h.stored.size, 0);
});

test("storage failure preserves the complete in-memory replay and releases the peer", async () => {
  const h = harness({ storageFails: true });
  const player = await start(h);
  h.recorders[0].finalChunk = "complete ".repeat(100);
  h.send(generated);
  h.send(drained);
  await h.advance(1000);
  await player.finalize;
  assert.equal(h.stored.size, 0);
  assert.equal(h.peers[0].connectionState, "closed");
  const replay = await h.api.getTTSPlayer(options);
  assert.ok(replay.audioUrl);
  assert.equal(h.posts, 1);
  replay.cleanup();
});

test("disableCache still waits for complete playback without storing audio", async () => {
  const h = harness();
  const player = await start(h, { ...options, disableCache: true });
  h.send(generated);
  await h.advance(2000);
  assert.equal(h.peers[0].track.stopped, false);
  h.send(drained);
  await h.advance(1000);
  await player.finalize;
  assert.equal(h.recorders.length, 0);
  assert.equal(h.stored.size, 0);
});

test("cancelling before a track arrives settles ready and releases the player", async () => {
  const h = harness({ noTracks: true });
  const player = await h.api.getTTSPlayer(options);
  const rejection = assert.rejects(player.ready, /cancelled/);
  h.api.stopAllTTSPlayback();
  await rejection;
  await player.finalize;
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.timers.size, 0);
});

test("radio follows transport playback start when WebRTC emits no media playing event", async () => {
  const h = harness();
  const player = await h.api.getTTSPlayer(options);
  player.audio.play = () => new Promise(() => {});
  const states = [];
  const queue = createStoryAudio({ getPlayer: async () => player, onState: (state) => states.push(state), onError: assert.fail });
  const pending = queue.play([{ speaker: "Host" }]);
  await flush();
  assert.equal(states.at(-1), "loading");
  h.send({ type: "output_audio_buffer.started" });
  await flush();
  assert.equal(states.at(-1), "playing");
  assert.equal(await player.playbackStarted, true);
  h.send(generated); h.send(drained);
  await h.advance(1100); await pending;
  assert.equal(states.at(-1), "idle");
});

test("cancelled TTS does not claim that transport playback started", async () => {
  const h = harness();
  const player = await h.api.getTTSPlayer(options);
  player.cleanup();
  assert.equal(await player.playbackStarted, false);
});

test("a pending gesture unlock cannot block startup or pause speech when it resolves late", async () => {
  const h = harness({ unlockPlayPending: true });
  let unlocked;
  const priming = h.api.primeTTSAudio().then((audio) => { unlocked = audio; return audio; });
  await flush();
  assert.equal(unlocked, h.audios[0], "Unlock returns the element without awaiting browser play()");
  assert.equal(unlocked.muted, false, "A silent clip requests permission for unmuted audio during the gesture");
  const wav = Buffer.from(unlocked.src.split(",")[1], "base64");
  assert.equal(wav.readUInt32LE(40), wav.length - 44, "The WAV contains real PCM data");
  assert.ok(wav.length > 44);
  const player = await h.api.getTTSPlayer(options);
  assert.equal(player.audio, await priming);
  await player.audio.play();
  unlocked.resolveUnlock();
  await flush();
  assert.equal(player.audio.paused, false, "A late unlock completion must not pause the new source");
  player.cleanup(); await player.finalize;
  assert.equal(h.timers.size, 0);
});

test("an IndexedDB replay uses the element unlocked by the gesture", async () => {
  const key = `v2::realtime-v7::es-MX::ash::::${options.text}`;
  const stored = new Map([[key, { key, blob: new Blob(["complete recording"]), timestamp: 9000, audioPreparationVersion: 1 }]]);
  const h = harness({ stored, unlockPlayPending: true });
  const warm = await h.api.primeTTSAudio();
  const player = await h.api.getTTSPlayer(options);
  assert.equal(player.audio, warm);
  assert.ok(player.audioUrl);
  assert.equal(h.posts, 0);
  warm.rejectUnlock(new Error("Source replaced"));
  await flush();
  player.cleanup();
});

test("blocked IndexedDB falls back to narration without leaving a loading promise", async () => {
  const h = harness({ storageStalls: true });
  const pending = h.api.getTTSPlayer(options);
  await h.advance(1500);
  const player = await pending;
  assert.equal(h.posts, 1);
  player.cleanup(); await player.finalize;
  assert.equal(h.timers.size, 0);
});

for (const stall of ["authentication / HTTP", "SDP body"]) {
  test(`a stalled ${stall} times out, aborts, and cannot start a late narration`, async () => {
    let resume;
    const stalled = new Promise((resolve) => { resume = resolve; });
    let calls = 0;
    const h = harness({ exchange: async () => {
      calls++;
      if (calls === 1 && stall === "authentication / HTTP") await stalled;
      return { ok: true, status: 200, text: async () => {
        if (calls === 1 && stall === "SDP body") await stalled;
        return "answer";
      } };
    } });
    const failure = assert.rejects(h.api.getTTSPlayer(options), /startup timed out/);
    await h.advance(20000);
    await failure;
    assert.equal(h.requests[0].signal.aborted, true);
    assert.equal(h.peers[0].connectionState, "closed");
    assert.equal(h.peers[0].channel.sent.length, 0);
    resume(); await flush();
    assert.equal(h.peers[0].channel.sent.length, 0, "A late response cannot trigger unwanted speech");
    const retry = await h.api.getTTSPlayer(options);
    assert.equal(h.posts, 2);
    assert.equal(h.peers[1].channel.sent[1].type, "response.create");
    retry.cleanup(); await retry.finalize;
    assert.equal(h.timers.size, 0);
  });
}

test("stop all cancels an in-flight SDP exchange before a player is returned", async () => {
  const h = harness({ exchange: () => new Promise(() => {}) });
  const failure = assert.rejects(h.api.getTTSPlayer(options), /cancelled/);
  await flush();
  assert.equal(h.posts, 1);
  h.api.stopAllTTSPlayback();
  await failure;
  assert.equal(h.requests[0].signal.aborted, true);
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.timers.size, 0);
});

test("stalled recorder shutdown releases playback UI and eventually closes transport", async () => {
  const h = harness({ recorderStalls: true });
  const player = await start(h);
  let ended = false;
  player.audio.onended = () => { ended = true; player.cleanup(); };
  h.send(generated); h.send(drained);
  await h.advance(1000);
  await player.responseComplete;
  assert.equal(ended, true);
  assert.equal((await player.completion).status, "ended");
  await h.advance(2000);
  await player.finalize;
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.stored.size, 0);
  assert.equal(h.timers.size, 0);
});

test("a cache decoder stall cannot hold playback UI or transport open", async () => {
  const h = harness({ prepareCache: () => new Promise(() => {}) });
  const player = await start(h);
  h.recorders[0].finalChunk = "complete recording ".repeat(100);
  h.send(generated); h.send(drained);
  await h.advance(1000);
  await player.responseComplete;
  await h.advance(2000);
  await player.finalize;
  assert.equal(h.peers[0].connectionState, "closed");
  assert.equal(h.timers.size, 0);
});

test("gesture priming retries the same element and explicit handoff cannot share it with another player", async () => {
  const h = harness({ unlockPlayPending: true });
  const firstGesture = h.api.primeTTSAudio();
  const nextGesture = h.api.primeTTSAudio();
  assert.equal(h.audios.length, 1);
  assert.equal(await firstGesture, await nextGesture);
  const warmAudio = await firstGesture;
  const first = await h.api.getTTSPlayer({ ...options, warmAudio });
  const second = await h.api.getTTSPlayer({ ...options, text: "Otra frase." });
  assert.notEqual(second.audio, first.audio, "A provided primed element is consumed exactly once");
  first.cleanup(); second.cleanup();
  await Promise.all([first.finalize, second.finalize]);
  assert.equal(h.timers.size, 0);
});

test("edge cache hit bypasses WebRTC and saves audio into IndexedDB", async () => {
  const edgeStored = new Map();
  const testBlob = new Blob(["edge audio content"], { type: "audio/wav" });
  const key = "v2::realtime-v7::es-MX::ash::::Lee esta frase completa hasta la última palabra.";
  edgeStored.set(key, testBlob);

  const h = harness({ edgeStored });
  const diagnostics = [];
  const player = await h.api.getTTSPlayer({
    ...options,
    onDiagnostic: (d) => diagnostics.push(d),
  });

  assert.equal(h.peers.length, 0, "No WebRTC peer created on edge cache hit");
  assert.equal(h.posts, 0, "No SDP exchange POST made on edge cache hit");
  assert.ok(diagnostics.some((d) => d.phase === "cache-hit" && d.source === "edge"));

  // Verify it saved to IndexedDB for next time
  await flush();
  assert.ok(h.stored.has(key), "Saved to IndexedDB after edge hit");

  player.cleanup();
  await player.finalize;
});

test("edge cache miss falls back to WebRTC and uploads completed recording to edge", async () => {
  const h = harness();
  const player = await start(h);
  h.recorders[0].finalChunk = "complete recording ".repeat(100);
  h.send(generated); h.send(drained);
  await h.advance(1000);
  await player.responseComplete;
  await h.advance(2000);
  await player.finalize;

  const uploadReq = h.requests.find((r) => r.method === "PUT" && r.url.includes("/audio/"));
  assert.ok(uploadReq, "Audio upload request sent to edge");
  assert.ok(h.edgeStored.size > 0, "Edge cache populated on completion");
});

test("edge cache network failure falls back smoothly to WebRTC", async () => {
  const h = harness({
    fetchImpl: async () => { throw new Error("Network error"); },
  });
  const player = await start(h);
  assert.equal(h.peers.length, 1, "WebRTC peer created despite edge network failure");
  player.cleanup();
  await player.finalize;
});

test("prefetchTTSAudio fetches from edge cache and saves to local IndexedDB and memory", async () => {
  const edgeStored = new Map();
  const testBlob = new Blob(["edge audio word"], { type: "audio/wav" });
  const phrase = "gato";
  const key = "v2::realtime-v7::es-MX::alloy::::gato";
  edgeStored.set(key, testBlob);

  const h = harness({ edgeStored });
  const cancel = h.api.prefetchTTSAudio([phrase], { langTag: "es-MX", voice: "alloy", intervalMs: 0 });

  await h.advance(100);
  await flush();

  assert.equal(await h.api.isCached(phrase, "es-MX", { voice: "alloy" }), true, "Phrase was cached locally by prefetch");
  cancel();
});

test("playCachedTTS plays immediately from cache without WebRTC", async () => {
  const stored = new Map();
  const testBlob = new Blob(["cached audio word"], { type: "audio/wav" });
  const phrase = "perro";
  const key = "v2::realtime-v7::es-MX::alloy::::perro";
  stored.set(key, { key, blob: testBlob, timestamp: Date.now() });

  const h = harness({ stored });
  const result = await h.api.playCachedTTS({ text: phrase, langTag: "es-MX", voice: "alloy" });

  assert.equal(result.played, true, "playCachedTTS played from cache");
  assert.ok(result.player, "Returned a player");
  assert.equal(h.peers.length, 0, "No WebRTC peer was created");
  assert.equal(h.posts, 0, "No SDP POST was made");
  result.player.cleanup();
});

test("playCachedTTS returns played: false when audio is not cached", async () => {
  const h = harness();
  const result = await h.api.playCachedTTS({ text: "uncached phrase", langTag: "es-MX", voice: "alloy" });
  assert.equal(result.played, false, "Did not play uncached audio");
  assert.equal(result.player, null);
  assert.equal(h.peers.length, 0, "Did not start WebRTC");
});


