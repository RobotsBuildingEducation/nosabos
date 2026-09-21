import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createWorker } from "../src/index.js";
import { verifyAppCheck } from "../src/app-check.js";

const sdp = "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";
const env = {
  OPENAI_API_KEY: "server-test-secret",
  ALLOWED_ORIGINS: "https://piyali.app,http://localhost:5173",
  ALLOWED_RESPONSE_MODELS: "gpt-5.6-luna,gpt-5-nano",
  FIREBASE_PROJECT_NUMBER: "123",
  FIREBASE_APP_ID: "test-app",
  REQUIRE_APPCHECK: "true",
  SESSION_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
function setup(overrides = {}) {
  const calls = [];
  const worker = createWorker({
    verifyToken: async (token) => { if (token !== "valid") throw new Error("invalid"); },
    fetchUpstream: async (...args) => { calls.push(args); return new Response(sdp); },
    ...overrides,
  });
  const request = (options = {}, bindings = env) => worker.fetch(new Request(
    options.url || "https://worker.test/", {
      method: "POST",
      body: sdp,
      ...options,
      headers: { Origin: "https://piyali.app", "Content-Type": "application/sdp", "X-Firebase-AppCheck": "valid", ...options.headers },
    },
  ), bindings);
  return { worker, request, calls };
}

test("raw SDP preserves the existing narration/tutor contract and keeps secrets server-side", async () => {
  const { request, calls } = setup();
  const response = await request();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/sdp");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://piyali.app");
  assert.equal(await response.text(), sdp);
  assert.equal(calls[0][0], "https://api.openai.com/v1/realtime/calls");
  const upstream = calls[0][1];
  assert.equal(upstream.headers.Authorization, "Bearer server-test-secret");
  assert.equal(upstream.body.get("sdp"), sdp);
  assert.deepEqual(JSON.parse(upstream.body.get("session")), { type: "realtime", model: "gpt-realtime-2.1-mini" });
  assert.equal(upstream.redirect, "manual");
});

test("JSON speech-practice sessions preserve transcription and VAD settings", async () => {
  const { request, calls } = setup();
  const session = { output_modalities: ["text"], audio: { input: { transcription: { model: "whisper-1" }, turn_detection: { type: "server_vad", create_response: false } } } };
  const response = await request({ headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ sdp, session }) });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(calls[0][1].body.get("session")), { ...session, type: "realtime", model: "gpt-realtime-2.1-mini" });
});

test("proxyResponses forwards to OpenAI /v1/responses with minimal reasoning and low verbosity", async () => {
  const responsesPayload = {
    id: "resp_123",
    output_text: "Hola, mundo",
  };
  const { request, calls } = setup({
    fetchUpstream: async (...args) => {
      calls.push(args);
      return new Response(JSON.stringify(responsesPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const body = {
    model: "gpt-5.6-luna",
    input: "Translate Hello world",
  };
  const response = await request({
    url: "https://worker.test/proxyResponses",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/json");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://piyali.app");
  assert.deepEqual(await response.json(), responsesPayload);

  assert.equal(calls[0][0], "https://api.openai.com/v1/responses");
  const upstream = calls[0][1];
  assert.equal(upstream.headers.Authorization, "Bearer server-test-secret");
  assert.equal(upstream.headers["Content-Type"], "application/json");
  assert.equal(upstream.headers.Accept, "application/json");
  assert.equal(upstream.redirect, "manual");

  const sentBody = JSON.parse(upstream.body);
  assert.equal(sentBody.model, "gpt-5.6-luna");
  assert.equal(sentBody.input, "Translate Hello world");
  assert.deepEqual(sentBody.reasoning, { effort: "none" });
  assert.equal(sentBody.text.verbosity, "low");

  // Also verify nano uses minimal
  await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5-nano", input: "test nano" }),
  });
  const sentNano = JSON.parse(calls[1][1].body);
  assert.equal(sentNano.model, "gpt-5-nano");
  assert.deepEqual(sentNano.reasoning, { effort: "minimal" });
});

test("proxyResponses routes through Cloudflare AI Gateway when AI_GATEWAY_NAME is set", async () => {
  const { request, calls } = setup();
  const envWithGateway = {
    ...env,
    AI_GATEWAY_NAME: "nosabos-ai",
    CLOUDFLARE_ACCOUNT_ID: "test-account-123",
  };
  const response = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5.6-luna", input: "test gateway" }),
  }, envWithGateway);
  assert.equal(response.status, 200);
  assert.equal(calls[0][0], "https://gateway.ai.cloudflare.com/v1/test-account-123/nosabos-ai/openai/responses");
  assert.equal(calls[0][1].headers["cf-skip-cache"], "true");
});

test("proxyResponses rejects unallowed models and invalid JSON", async () => {
  const { request, calls } = setup();

  // Invalid JSON
  const invalidJson = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json" },
    body: "not json",
  });
  assert.equal(invalidJson.status, 400);

  // Missing model
  const missingModel = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: "test" }),
  });
  assert.equal(missingModel.status, 400);

  // Unallowed model
  const badModel = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o", input: "test" }),
  });
  assert.equal(badModel.status, 400);

  // Wrong content-type
  const wrongCt = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ model: "gpt-5-nano", input: "test" }),
  });
  assert.equal(wrongCt.status, 415);

  // Missing App Check rejected
  const noAppCheck = await request({
    url: "https://worker.test/proxyResponses",
    headers: { "Content-Type": "application/json", "X-Firebase-AppCheck": "" },
    body: JSON.stringify({ model: "gpt-5-nano", input: "test" }),
  });
  assert.equal(noAppCheck.status, 401);

  assert.equal(calls.length, 0);
});

test("preflight and health checks do not contact OpenAI or require App Check", async () => {
  const { request, calls } = setup();
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    const response = await request({ method, body: undefined, headers: { "X-Firebase-AppCheck": "" } });
    assert.equal(response.status, method === "OPTIONS" ? 204 : 200);
    if (method === "HEAD") assert.equal(await response.text(), "");
  }
  assert.equal(calls.length, 0);
});

test("unapproved origins, invalid tokens, and disabled verification in production are rejected", async () => {
  const { request, calls } = setup();
  assert.equal((await request({ headers: { Origin: "https://attacker.test" } })).status, 403);
  for (const token of ["", "invalid"]) {
    assert.equal((await request({ headers: { "X-Firebase-AppCheck": token } })).status, 401);
    assert.equal((await request({ headers: { "X-Firebase-AppCheck": token } }, { ...env, REQUIRE_APPCHECK: "false" })).status, 401);
  }
  assert.equal(calls.length, 0);
});

test("App Check bypass is restricted to explicitly opted-in local runtime", async () => {
  const { request } = setup();
  const options = { url: "http://localhost:8787", headers: { "X-Firebase-AppCheck": "" } };
  assert.equal((await request(options)).status, 401);
  assert.equal((await request(options, { ...env, REQUIRE_APPCHECK: "false" })).status, 200);
});

test("timings separate authentication and OpenAI and accurately label local bypass", async () => {
  let time = 100;
  const { request } = setup({
    now: () => time,
    verifyToken: async () => { time += 7; },
    fetchUpstream: async () => { time += 90; return new Response(sdp); },
  });
  const response = await request();
  assert.equal(response.headers.get("X-TTS-Runtime"), "cloudflare-edge");
  assert.equal(response.headers.get("X-TTS-AppCheck"), "verified");
  assert.match(response.headers.get("Access-Control-Expose-Headers"), /Server-Timing/);
  assert.equal(response.headers.get("Server-Timing"), "rate_limit;dur=0, app_check;dur=7, parse;dur=0, openai;dur=90, total;dur=97");
  const local = await request({ url: "http://localhost:8787" }, { ...env, REQUIRE_APPCHECK: "false" });
  assert.equal(local.headers.get("X-TTS-Runtime"), "local-workerd");
  assert.equal(local.headers.get("X-TTS-Colo"), "local");
  assert.equal(local.headers.get("X-TTS-AppCheck"), "local-bypass");
  assert.doesNotMatch(local.headers.get("Server-Timing"), /app_check/);
});

test("missing server configuration and rate limiting fail closed", async () => {
  const { request, calls } = setup();
  for (const missing of ["OPENAI_API_KEY", "FIREBASE_PROJECT_NUMBER", "FIREBASE_APP_ID", "SESSION_RATE_LIMITER"]) {
    assert.equal((await request({}, { ...env, [missing]: undefined })).status, 503);
  }
  const response = await request({}, { ...env, SESSION_RATE_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(calls.length, 0);
});

test("bad JSON, invalid SDP, session types, and model overrides never reach OpenAI", async () => {
  const { request, calls } = setup();
  for (const body of ["{", "null", "[]", JSON.stringify({ sdp: 42 }), JSON.stringify({ sdp, session: [] }), JSON.stringify({ sdp, session: { type: "transcription" } }), JSON.stringify({ sdp, model: "expensive-model" }), JSON.stringify({ sdp, session: { model: "expensive-model" } })]) {
    assert.equal((await request({ headers: { "Content-Type": "application/json" }, body })).status, 400);
  }
  assert.equal((await request({ url: "https://worker.test/?model=expensive-model" })).status, 400);
  assert.equal((await request({ body: "not sdp" })).status, 400);
  assert.equal((await request({ headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await request({ url: "https://worker.test/unknown" })).status, 404);
  assert.equal((await request({ method: "PUT" })).status, 405);
  assert.equal(calls.length, 0);
});

test("body size cap applies to declared and streamed bodies", async () => {
  const { request, calls } = setup();
  assert.equal((await request({ headers: { "Content-Length": "999999" } })).status, 413);
  assert.equal((await request({ body: sdp + "x".repeat(65536) })).status, 413);
  assert.equal(calls.length, 0);
});

test("upstream failures are sanitized, CORS-readable, and not cached", async () => {
  for (const status of [302, 400, 401, 429, 500]) {
    const { request } = setup({ fetchUpstream: async () => new Response("sensitive provider details", { status }) });
    const response = await request();
    assert.equal(response.status, status === 429 ? 429 : 502);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://piyali.app");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.doesNotMatch(await response.text(), /sensitive/);
  }
  const { request } = setup({ fetchUpstream: async () => { throw new Error("secret"); } });
  assert.equal((await request()).status, 502);
  const invalid = setup({ fetchUpstream: async () => new Response("not SDP") });
  assert.equal((await invalid.request()).status, 502);
});

test("App Check verifies real signatures, issuer, audience, expiry, type, and app identity", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: "test", alg: "RS256" }] });
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: "https://firebaseappcheck.googleapis.com/123", aud: ["projects/123"], sub: "test-app", exp: now + 600, iat: now };
  const sign = (payload, header = {}) => new SignJWT(payload).setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "test", ...header }).sign(privateKey);
  assert.equal((await verifyAppCheck(await sign(claims), env, keys)).sub, "test-app");
  for (const changes of [{ iss: "wrong" }, { aud: ["projects/wrong"] }, { sub: "other-app" }, { exp: now - 1 }, { exp: undefined }, { iat: undefined }]) {
    await assert.rejects(verifyAppCheck(await sign({ ...claims, ...changes }), env, keys));
  }
  await assert.rejects(verifyAppCheck(await sign(claims, { typ: "other" }), env, keys));
  const token = await sign(claims);
  const parts = token.split(".");
  parts[1] = btoa(JSON.stringify({ ...claims, sub: "forged" }));
  await assert.rejects(verifyAppCheck(parts.join("."), env, keys));
});

test("audio cache GET returns 404 on miss and PUT requires App Check", async () => {
  const { worker } = setup();
  // Missing key
  const missing = await worker.fetch(new Request("https://worker.test/audio/missing-key", { method: "GET" }), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("Cache-Control"), "public, max-age=300");

  // PUT without token
  const putNoToken = await worker.fetch(new Request("https://worker.test/audio/v2::key", {
    method: "PUT",
    headers: { "Content-Type": "audio/wav" },
    body: new Uint8Array([1, 2, 3]),
  }), env);
  assert.equal(putNoToken.status, 401);
});

test("audio cache GET negative-caches 404 responses at edge", async () => {
  class MockCache {
    constructor() { this.store = new Map(); }
    async match(req) {
      const key = typeof req === "string" ? req : req.url;
      const res = this.store.get(key);
      return res ? res.clone() : undefined;
    }
    async put(req, res) {
      const key = typeof req === "string" ? req : req.url;
      this.store.set(key, res.clone());
    }
  }
  const cache = new MockCache();
  let r2GetCount = 0;
  const worker = createWorker({
    getCache: () => cache,
  });
  const testEnv = {
    ...env,
    AUDIO_CACHE: {
      get: async () => {
        r2GetCount++;
        return null;
      },
    },
  };

  // First request: misses cache, queries R2, returns 404 and caches it
  const res1 = await worker.fetch(new Request("https://worker.test/audio/unrecorded-phrase", { method: "GET" }), testEnv);
  assert.equal(res1.status, 404);
  assert.equal(r2GetCount, 1);
  assert.equal(res1.headers.get("Cache-Control"), "public, max-age=300");

  // Second request: served from edge cache, does NOT call R2 again
  const res2 = await worker.fetch(new Request("https://worker.test/audio/unrecorded-phrase", { method: "GET" }), testEnv);
  assert.equal(res2.status, 404);
  assert.equal(r2GetCount, 1); // R2 was not queried again!
  assert.equal(res2.headers.get("X-TTS-Cache"), "HIT-EDGE");
});

test("audio cache PUT stores audio and subsequent GET serves with immutable headers", async () => {
  class MockCache {
    constructor() { this.store = new Map(); }
    async match(req) {
      const key = typeof req === "string" ? req : req.url;
      const res = this.store.get(key);
      return res ? res.clone() : undefined;
    }
    async put(req, res) {
      const key = typeof req === "string" ? req : req.url;
      this.store.set(key, res.clone());
    }
  }
  const cache = new MockCache();
  const worker = createWorker({
    verifyToken: async (token) => { if (token !== "valid") throw new Error("invalid"); },
    getCache: () => cache,
  });

  const audioKey = "v2::realtime-v6::es-MX::alloy::::hola";
  const audioBytes = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]); // RIFF...

  // 1. PUT audio into cache
  const putResponse = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(audioKey)}`, {
    method: "PUT",
    headers: {
      Origin: "https://piyali.app",
      "Content-Type": "audio/wav",
      "X-Firebase-AppCheck": "valid",
    },
    body: audioBytes,
  }), env);
  assert.equal(putResponse.status, 201);
  const putJson = await putResponse.json();
  assert.equal(putJson.status, "cached");
  assert.equal(putJson.key, audioKey);

  // 2. GET audio from cache
  const getResponse = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(audioKey)}`, {
    method: "GET",
    headers: { Origin: "https://piyali.app" },
  }), env);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.headers.get("Content-Type"), "audio/wav");
  assert.equal(getResponse.headers.get("Cache-Control"), "public, max-age=31536000, immutable");
  assert.equal(getResponse.headers.get("X-TTS-Cache"), "HIT-EDGE");
  assert.equal(getResponse.headers.get("Access-Control-Allow-Origin"), "https://piyali.app");
  const receivedBytes = new Uint8Array(await getResponse.arrayBuffer());
  assert.deepEqual(receivedBytes, audioBytes);
});

test("audio cache rejects unsupported MIME types, empty bodies, and oversized payloads", async () => {
  const { worker } = setup();
  // Unsupported type
  const badType = await worker.fetch(new Request("https://worker.test/audio/test-key", {
    method: "PUT",
    headers: { "Content-Type": "text/plain", "X-Firebase-AppCheck": "valid" },
    body: "not audio",
  }), env);
  assert.equal(badType.status, 415);

  // Empty body
  const emptyBody = await worker.fetch(new Request("https://worker.test/audio/test-key", {
    method: "PUT",
    headers: { "Content-Type": "audio/wav", "X-Firebase-AppCheck": "valid" },
    body: new Uint8Array([]),
  }), env);
  assert.equal(emptyBody.status, 400);

  // Oversized (>512KB)
  const hugeBody = await worker.fetch(new Request("https://worker.test/audio/test-key", {
    method: "PUT",
    headers: { "Content-Type": "audio/wav", "X-Firebase-AppCheck": "valid" },
    body: new Uint8Array(512 * 1024 + 1),
  }), env);
  assert.equal(hugeBody.status, 413);

  // Silent WAV payload rejection
  const silentWav = new Uint8Array(44 + 200);
  const view = new DataView(silentWav.buffer);
  const writeText = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeText(0, "RIFF");
  view.setUint32(4, silentWav.byteLength - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, 24000, true); // 24kHz
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeText(36, "data");
  view.setUint32(40, 200, true); // 200 bytes of zeros
  const silentRes = await worker.fetch(new Request("https://worker.test/audio/silent-test-key", {
    method: "PUT",
    headers: { "Content-Type": "audio/wav", "X-Firebase-AppCheck": "valid" },
    body: silentWav,
  }), env);
  assert.equal(silentRes.status, 400);
  const silentJson = await silentRes.json();
  assert.equal(silentJson.error, "Audio payload is silent.");
});

test("audio cache DELETE removes audio from R2 and edge cache with App Check", async () => {
  class MockCache {
    constructor() { this.store = new Map(); }
    async match(req) { const key = typeof req === "string" ? req : req.url; return this.store.get(key)?.clone(); }
    async put(req, res) { const key = typeof req === "string" ? req : req.url; this.store.set(key, res.clone()); }
    async delete(req) { const key = typeof req === "string" ? req : req.url; return this.store.delete(key); }
  }
  const cache = new MockCache();
  const r2Store = new Map();
  const r2Bucket = {
    async get(key) { const entry = r2Store.get(key); return entry ? { body: entry.body } : null; },
    async put(key, body) { r2Store.set(key, { body }); },
    async delete(key) { r2Store.delete(key); },
  };
  const worker = createWorker({ verifyToken: async (token) => { if (token !== "valid") throw new Error("bad"); }, getCache: () => cache });
  const envWithR2 = { ...env, AUDIO_CACHE: r2Bucket };
  const key = "v2::test-delete-key";

  // 1. Seed cache and R2
  await r2Bucket.put(key, new Uint8Array([1, 2, 3]));
  await cache.put(`https://worker.test/audio/${encodeURIComponent(key)}`, new Response("cached"));

  // 2. DELETE without App Check fails 401
  const unauth = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(key)}`, {
    method: "DELETE",
  }), envWithR2);
  assert.equal(unauth.status, 401);

  // 3. DELETE with App Check succeeds
  const deleted = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { "X-Firebase-AppCheck": "valid" },
  }), envWithR2);
  assert.equal(deleted.status, 200);
  const deletedJson = await deleted.json();
  assert.equal(deletedJson.status, "deleted");
  assert.equal(r2Store.has(key), false);
  assert.equal(await cache.match(`https://worker.test/audio/${encodeURIComponent(key)}`), undefined);
});

test("audio cache falls back to R2 and caches it at the edge", async () => {
  class MockCache {
    constructor() { this.store = new Map(); }
    async match(req) {
      const key = typeof req === "string" ? req : req.url;
      const res = this.store.get(key);
      return res ? res.clone() : undefined;
    }
    async put(req, res) {
      const key = typeof req === "string" ? req : req.url;
      this.store.set(key, res.clone());
    }
  }
  const cache = new MockCache();
  const r2Store = new Map();
  const r2Bucket = {
    async get(key) {
      const entry = r2Store.get(key);
      if (!entry) return null;
      return { body: entry.body, httpMetadata: { contentType: entry.contentType }, httpEtag: '"r2-etag"' };
    },
    async put(key, body, options) {
      r2Store.set(key, { body, contentType: options?.httpMetadata?.contentType || "audio/wav" });
    },
  };

  const worker = createWorker({
    verifyToken: async () => {},
    getCache: () => cache,
  });

  const envWithR2 = { ...env, AUDIO_CACHE: r2Bucket };
  const key = "v2::r2-only-phrase";
  const audioData = new Uint8Array([1, 2, 3, 4]);

  // Seed R2 directly
  await r2Bucket.put(key, audioData, { httpMetadata: { contentType: "audio/wav" } });

  // First GET: hits R2, populates cache
  const firstGet = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(key)}`), envWithR2);
  assert.equal(firstGet.status, 200);
  assert.equal(firstGet.headers.get("X-TTS-Cache"), "HIT-R2");
  assert.deepEqual(new Uint8Array(await firstGet.arrayBuffer()), audioData);

  // Second GET: hits edge cache directly
  const secondGet = await worker.fetch(new Request(`https://worker.test/audio/${encodeURIComponent(key)}`), envWithR2);
  assert.equal(secondGet.status, 200);
  assert.equal(secondGet.headers.get("X-TTS-Cache"), "HIT-EDGE");
});

test("assets endpoint serves media from R2 and edge caches with immutable headers", async () => {
  class MockCache {
    constructor() { this.store = new Map(); }
    async match(req) {
      const key = typeof req === "string" ? req : req.url;
      const res = this.store.get(key);
      return res ? res.clone() : undefined;
    }
    async put(req, res) {
      const key = typeof req === "string" ? req : req.url;
      this.store.set(key, res.clone());
    }
  }
  const cache = new MockCache();
  const r2Store = new Map();
  const r2Bucket = {
    async get(key) {
      const entry = r2Store.get(key);
      if (!entry) return null;
      return { body: entry.body, httpMetadata: { contentType: entry.contentType }, httpEtag: '"asset-etag"' };
    },
    async put(key, body, options) {
      r2Store.set(key, { body, contentType: options?.httpMetadata?.contentType });
    },
  };

  const worker = createWorker({
    verifyToken: async () => {},
    getCache: () => cache,
  });
  const envWithR2 = { ...env, AUDIO_CACHE: r2Bucket };

  // 1. Invalid paths
  assert.equal((await worker.fetch(new Request("https://worker.test/assets"), envWithR2)).status, 400);
  assert.equal((await worker.fetch(new Request("https://worker.test/assets/invalid$path!"), envWithR2)).status, 400);

  // 2. 404 for missing asset
  const missing = await worker.fetch(new Request("https://worker.test/assets/characters/missing.webp"), envWithR2);
  assert.equal(missing.status, 404);

  // 3. Seed asset in R2
  const imageBytes = new Uint8Array([82, 73, 70, 70]); // WEBP header bytes
  await r2Bucket.put("assets/characters/1.webp", imageBytes, { httpMetadata: { contentType: "image/webp" } });

  // 4. First GET: serves from R2, sets immutable header and HIT-R2
  const firstGet = await worker.fetch(new Request("https://worker.test/assets/characters/1.webp"), envWithR2);
  assert.equal(firstGet.status, 200);
  assert.equal(firstGet.headers.get("Content-Type"), "image/webp");
  assert.equal(firstGet.headers.get("Cache-Control"), "public, max-age=31536000, immutable");
  assert.equal(firstGet.headers.get("X-TTS-Cache"), "HIT-R2");
  assert.deepEqual(new Uint8Array(await firstGet.arrayBuffer()), imageBytes);

  // 5. Second GET: served from edge cache HIT-EDGE
  const secondGet = await worker.fetch(new Request("https://worker.test/assets/characters/1.webp"), envWithR2);
  assert.equal(secondGet.status, 200);
  assert.equal(secondGet.headers.get("X-TTS-Cache"), "HIT-EDGE");
});

test("handles /api/tts-proxy subpath prefix identically to root endpoints", async () => {
  const worker = createWorker();

  // 1. Health check with prefix
  const healthRes = await worker.fetch(new Request("https://piyali.app/api/tts-proxy/health"), env);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.status, "healthy");

  // 2. Trailing slash / bare prefix maps to root
  const rootGet = await worker.fetch(new Request("https://piyali.app/api/tts-proxy"), env);
  assert.equal(rootGet.status, 200);

  // 3. Audio endpoint with prefix
  const audioRes = await worker.fetch(new Request("https://piyali.app/api/tts-proxy/audio/test-key"), env);
  assert.equal(audioRes.status, 404); // cleanly handled by audio handler

  // 4. Unknown endpoint with prefix returns 404
  const notFound = await worker.fetch(new Request("https://piyali.app/api/tts-proxy/unknown-path"), env);
  assert.equal(notFound.status, 404);
});

