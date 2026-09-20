import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createWorker } from "../src/index.js";
import { verifyAppCheck } from "../src/app-check.js";

const sdp = "v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n";
const env = {
  OPENAI_API_KEY: "server-test-secret",
  ALLOWED_ORIGINS: "https://piyali.app,http://localhost:5173",
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
