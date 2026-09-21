// Keep at most one unused, receive-only connection ready for the next narration.
// It is never shared by players or reused after producing audio (voices lock
// after the first response). Warming never requests speech or a microphone.
export function createRealtimeTTSConnectionPool({
  url,
  model,
  defaultVoice = "ash",
  exchange,
  createPeer = () => new RTCPeerConnection(),
  createStream = () => new MediaStream(),
  createAudio = () => new Audio(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now,
  idleMs = 4 * 60 * 1000,
  connectTimeoutMs = 15000,
}) {
  let idle = null;
  let retryAt = 0;

  function prepare() {
    const pc = createPeer();
    const stream = createStream();
    pc.addTransceiver("audio", { direction: "recvonly" });
    const dc = pc.createDataChannel("oai-events");
    const controller = new AbortController();
    let settled = false;
    let closed = false;
    let deadline;
    let warmAudio = null;
    const releaseWarmAudio = () => {
      if (!warmAudio) return;
      const audio = warmAudio;
      warmAudio = null;
      try { audio.pause(); audio.srcObject = null; } catch { /* Best-effort media cleanup. */ }
    };
    let resolveReady;
    let rejectReady;
    const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    const detach = () => {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      dc.onopen = null;
      dc.onclose = null;
      dc.onerror = null;
    };
    const connection = {
      pc, dc, stream, ready,
      voice: defaultVoice,
      expiresAt: now() + idleMs,
      expiry: null,
      claimed: false,
      detach,
      releaseWarmAudio,
      close() {
        if (closed) return;
        closed = true;
        clearTimer(deadline);
        clearTimer(connection.expiry);
        detach();
        controller.abort();
        releaseWarmAudio();
        dc.close();
        pc.close();
        stream.getTracks().forEach((track) => track.stop());
        if (!settled) {
          settled = true;
          rejectReady(new Error("TTS connection preparation cancelled"));
        }
      },
    };
    const fail = () => {
      if (!connection.claimed) {
        if (idle === connection) idle = null;
        retryAt = now() + 30000;
      }
      connection.close();
    };
    const checkReady = () => {
      if (!settled && dc.readyState === "open" && stream.getAudioTracks().length) {
        settled = true;
        clearTimer(deadline);
        resolveReady(connection);
      }
    };
    pc.ontrack = (event) => {
      if (closed) return;
      const tracks = event.streams?.[0]?.getTracks() || [event.track];
      tracks.filter(Boolean).forEach((track) => {
        if (!stream.getTracks().includes(track)) stream.addTrack(track);
      });
      // An idle receiver still gets RTP silence. Without a consumer Chrome can
      // queue it until Play, adding seconds of delay to an already-ready call.
      // Consume silently while idle; no speech is requested or microphone used.
      if (!warmAudio) {
        try {
          warmAudio = createAudio();
          warmAudio.muted = true;
          warmAudio.autoplay = true;
          warmAudio.playsInline = true;
          warmAudio.srcObject = stream;
          const audio = warmAudio;
          void audio.play()?.catch(() => {
            // Detaching during handoff can reject a pending play() with
            // AbortError. It must not close the now-active player's transport.
            if (warmAudio === audio) fail();
          });
        } catch { fail(); }
      }
      checkReady();
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) fail();
    };
    dc.onopen = checkReady;
    dc.onclose = fail;
    dc.onerror = fail;
    deadline = setTimer(fail, connectTimeoutMs);
    connection.expiry = setTimer(() => {
      if (idle === connection) idle = null;
      connection.close();
    }, idleMs);
    void (async () => {
      try {
        const offer = await pc.createOffer();
        if (closed) return;
        await pc.setLocalDescription(offer);
        if (closed) return;
        const response = await exchange(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sdp: offer.sdp,
            model,
            session: {
              type: "realtime",
              model,
              voice: defaultVoice,
              audio: {
                input: { turn_detection: null },
                output: {
                  format: { type: "audio/pcm", rate: 24000 },
                  voice: defaultVoice,
                },
              },
            },
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("TTS connection preparation failed");
        const sdp = await response.text();
        if (closed) return;
        await pc.setRemoteDescription({ type: "answer", sdp });
      } catch {
        fail();
      }
    })();
    // Background failures are silent and cannot become unhandled rejections.
    void ready.catch(() => {
      if (idle === connection) idle = null;
      if (!connection.claimed) retryAt = now() + 30000;
    });
    return connection;
  }

  return {
    warm({ force = false } = {}) {
      if (!url) return Promise.resolve(false);
      if (idle && (idle.expiresAt <= now() || ["closed", "failed"].includes(idle.pc.connectionState))) {
        idle.close();
        idle = null;
      }
      if (!idle) {
        if (!force && now() < retryAt) return Promise.resolve(false);
        try { idle = prepare(); } catch {
          retryAt = now() + 30000;
          return Promise.resolve(false);
        }
      }
      const connection = idle;
      return connection.ready.then(() => connection.dc.readyState === "open" &&
        !["closed", "failed", "disconnected"].includes(connection.pc.connectionState), () => false);
    },
    async take() {
      const connection = idle;
      if (!connection) return null;
      idle = null; // Claim synchronously; concurrent players cannot share it.
      connection.claimed = true;
      clearTimer(connection.expiry);
      try {
        await connection.ready;
        if (connection.expiresAt <= now() || connection.dc.readyState !== "open" ||
            ["failed", "closed", "disconnected"].includes(connection.pc.connectionState)) {
          connection.close();
          return null;
        }
        connection.detach();
        return connection;
      } catch {
        connection.close();
        return null;
      }
    },
    clear() {
      const connection = idle;
      idle = null;
      connection?.close();
    },
  };
}
