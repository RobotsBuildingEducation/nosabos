import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Execute the real player with controllable browser/media APIs. Only Firebase
// and Vite's environment binding are replaced; completion/cache code is intact.
const source = readFileSync(new URL("./tts.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/, "")
  .replaceAll("import.meta.env", '({ VITE_REALTIME_URL: "https://tts.test/rtc" })')
  .replaceAll("export ", "");
const options = { text: "Lee esta frase completa hasta la última palabra.", voice: "alloy", langTag: "es-MX" };
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

function harness({ stored = new Map(), setupFails = false, noTracks = false, stats = new Map(), recorderFails = false, storageFails = false } = {}) {
  let now = 10000;
  let nextTimer = 0;
  const timers = new Map();
  const peers = [];
  const recorders = [];
  const urls = new Map();
  let posts = 0;
  class Audio extends EventTarget {
    currentTime = 0;
    paused = true;
    ended = false;
    removeAttribute() {}
    load() {}
    pause() { this.paused = true; }
    async play() { this.paused = false; this.dispatchEvent(new Event("playing")); }
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
      sent: [],
      send: (message) => this.channel.sent.push(JSON.parse(message)),
      close: () => this.channel.onclose?.(),
    };
    constructor() { peers.push(this); }
    addTransceiver() {}
    createDataChannel() { return this.channel; }
    async createOffer() { return { sdp: "offer" }; }
    async setLocalDescription() {}
    async setRemoteDescription() {
      if (!noTracks) this.ontrack({ streams: [], track: this.track });
      this.channel.onopen();
    }
    async getStats() { return stats; }
    close() { this.connectionState = "closed"; this.onconnectionstatechange?.(); }
  }
  const indexedDB = {
    open() {
      const request = {};
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
    Audio, MediaStream, MediaRecorder, RTCPeerConnection, indexedDB, Blob, Event,
    Date: class extends Date { static now() { return now; } },
    URL: { createObjectURL(blob) { const url = `blob:test-${urls.size}`; urls.set(url, blob); return url; } },
    console: { warn() {} },
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    appCheckFetch: async (_url, request) => {
      if (request.method === "POST") posts++;
      return { ok: !setupFails, status: 502, text: async () => "answer" };
    },
  });
  vm.runInContext(`${source}\nglobalThis.api = { getTTSPlayer, isCached, stopAllTTSPlayback };`, context);
  return {
    api: context.api, peers, recorders, stored, urls, timers,
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

  const reloaded = harness({ stored: h.stored });
  const persistedReplay = await reloaded.api.getTTSPlayer(options);
  assert.ok(persistedReplay.audioUrl);
  assert.equal(reloaded.posts, 0);
  assert.equal(await reloaded.urls.get(persistedReplay.audioUrl).text(), first + last);
  persistedReplay.cleanup();
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
