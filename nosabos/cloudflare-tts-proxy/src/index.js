import { verifyAppCheck } from "./app-check.js";

const DEFAULT_MODEL = "gpt-realtime-2.1-mini";
const DEFAULT_RESPONSE_MODEL = "gpt-5.6-luna,gpt-5-nano";
const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 30_000;
const ALLOW_HEADERS = "Content-Type, Authorization, X-Firebase-AppCheck";
const MAX_AUDIO_BYTES = 512 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
]);

function parseAudioKey(pathname) {
  if (!pathname.startsWith("/audio/")) return null;
  const rawKey = pathname.slice("/audio/".length);
  if (!rawKey) return null;
  try {
    const key = decodeURIComponent(rawKey).trim();
    if (!key || key.length > 512) return null;
    return key;
  } catch {
    return null;
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readBody(request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "Request body is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function parseOffer(request, url, env) {
  const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (!["application/sdp", "application/json"].includes(contentType)) {
    throw new HttpError(415, "Use application/sdp or application/json.");
  }
  const text = await readBody(request);
  let body = {};
  if (contentType === "application/json") {
    try { body = JSON.parse(text); } catch { throw new HttpError(400, "Invalid JSON."); }
    if (!isObject(body)) throw new HttpError(400, "Expected a JSON object.");
  }
  const sdp = contentType === "application/sdp" ? text : body.sdp;
  if (typeof sdp !== "string" || !/^v=0\r?\n/.test(sdp) || !/^m=audio /m.test(sdp)) {
    throw new HttpError(400, "Missing or invalid audio SDP offer.");
  }
  if (body.session !== undefined && !isObject(body.session)) {
    throw new HttpError(400, "Invalid session configuration.");
  }
  const session = body.session || {};
  if (session.type !== undefined && session.type !== "realtime") {
    throw new HttpError(400, "Only realtime sessions are supported.");
  }
  const allowedModels = (env.ALLOWED_MODELS || DEFAULT_MODEL).split(",").map((model) => model.trim());
  // Validate every supplied model, including nested overrides.
  for (const model of [url.searchParams.get("model"), body.model, session.model]) {
    if (model !== null && model !== undefined &&
        (typeof model !== "string" || !allowedModels.includes(model.trim()))) {
      throw new HttpError(400, "Unsupported realtime model.");
    }
  }
  const model = (session.model ?? body.model ?? url.searchParams.get("model") ?? DEFAULT_MODEL).trim();
  if (!allowedModels.includes(model)) throw new HttpError(400, "Unsupported realtime model.");
  return { sdp, session: { ...session, type: "realtime", model } };
}

async function parseResponsesRequest(request, env) {
  const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new HttpError(415, "Use application/json.");
  }
  const text = await readBody(request);
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
  if (!isObject(body)) {
    throw new HttpError(400, "Expected a JSON object.");
  }
  const model = (body.model || "").toString().trim();
  if (!model) {
    throw new HttpError(400, "Missing 'model' in request body.");
  }
  const allowedResponseModels = (env.ALLOWED_RESPONSE_MODELS || DEFAULT_RESPONSE_MODEL)
    .split(",")
    .map((m) => m.trim());
  if (!allowedResponseModels.includes(model)) {
    throw new HttpError(400, `Model '${model}' not allowed. Allowed: ${allowedResponseModels.join(", ")}`);
  }
  const isLuna = model.includes("luna");
  body.reasoning = { effort: isLuna ? "none" : "minimal" };
  body.text = { ...(body.text || {}), verbosity: "low" };
  return body;
}

export function createWorker({
  fetchUpstream = fetch,
  verifyToken = verifyAppCheck,
  now = Date.now,
  getCache = () => (typeof caches !== "undefined" ? caches.default : null),
} = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const startedAt = now();
      const timings = [];
      const localRuntime = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      const runtime = localRuntime ? "local-workerd" : "cloudflare-edge";
      const origin = request.headers.get("Origin");
      const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim());
      const originAllowed = origin && (
        allowedOrigins.includes(origin) ||
        (localRuntime && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      );
      const headers = {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Origin",
        "X-TTS-Runtime": runtime,
        "X-TTS-Colo": localRuntime ? "local" : request.cf?.colo || "unknown",
        ...(originAllowed ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD, PUT",
          "Access-Control-Allow-Headers": ALLOW_HEADERS,
          "Access-Control-Max-Age": "86400",
          "Access-Control-Expose-Headers": "Server-Timing, X-TTS-Runtime, X-TTS-AppCheck, X-TTS-Colo, X-TTS-Cache",
        } : {}),
      };
      // Wall time across I/O, not precise CPU profiling: Workers' clocks only
      // advance after I/O. A zero here does not mean an operation costs no CPU.
      const timed = async (name, operation) => {
        const start = now();
        try { return await operation(); }
        finally { timings.push(`${name};dur=${Math.max(0, now() - start)}`); }
      };
      const responseHeaders = () => ({
        ...headers,
        "Server-Timing": [...timings, `total;dur=${Math.max(0, now() - startedAt)}`].join(", "),
      });
      const json = (status, value, extraHeaders = {}) => new Response(
        request.method === "HEAD" ? null : JSON.stringify(value),
        { status, headers: { ...responseHeaders(), "Content-Type": "application/json", ...extraHeaders } },
      );
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      if (origin && !originAllowed) return json(403, { error: "Origin is not allowed." });
      if (
        !["/", "/health", "/proxyResponses"].includes(pathname) &&
        !pathname.startsWith("/audio/") &&
        pathname !== "/audio"
      ) {
        return json(404, { error: "Not found." });
      }
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

      // Disabling verification is only possible in the local workerd runtime.
      const localDev = env.REQUIRE_APPCHECK === "false" && localRuntime;
      headers["X-TTS-AppCheck"] = localDev ? "local-bypass" : "required";

      // Audio edge cache endpoints (shared across learners)
      if (pathname === "/audio" || pathname.startsWith("/audio/")) {
        if (pathname === "/audio" || pathname === "/audio/") {
          return json(400, { error: "Missing audio key." });
        }
        const audioKey = parseAudioKey(pathname);
        if (!audioKey) return json(400, { error: "Invalid audio key." });

        if (["GET", "HEAD"].includes(request.method)) {
          const cache = getCache();
          const cacheKeyRequest = new Request(url.origin + url.pathname, { method: "GET" });
          if (cache) {
            const cached = await cache.match(cacheKeyRequest);
            console.log(`[Audio GET] ${audioKey} -> match: ${Boolean(cached)}`);
            if (cached) {
              const respHeaders = new Headers(cached.headers);
              respHeaders.set("X-TTS-Cache", "HIT-EDGE");
              if (origin && originAllowed) {
                respHeaders.set("Access-Control-Allow-Origin", origin);
              }
              return new Response(request.method === "HEAD" ? null : cached.body, {
                status: 200,
                headers: respHeaders,
              });
            }
          }
          if (env.AUDIO_CACHE) {
            const object = await env.AUDIO_CACHE.get(audioKey);
            console.log(`[Audio GET R2] ${audioKey} -> object: ${Boolean(object)}`);
            if (object) {
              const contentType = object.httpMetadata?.contentType || "audio/wav";
              const audioHeaders = new Headers({
                ...headers,
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "ETag": object.httpEtag || `"${audioKey}"`,
                "X-TTS-Cache": "HIT-R2",
              });
              const r2Response = new Response(request.method === "HEAD" ? null : object.body, {
                status: 200,
                headers: audioHeaders,
              });
              if (cache && request.method === "GET") {
                await cache.put(cacheKeyRequest, r2Response.clone());
              }
              return r2Response;
            }
          }
          console.log(`[Audio GET] 404 Not Found: ${audioKey}`);
          return json(404, { error: "Audio not found." });
        }

        if (request.method === "PUT") {
          if (env.SESSION_RATE_LIMITER) {
            const key = `audio-put:${request.headers.get("CF-Connecting-IP") || "local"}`;
            const { success } = await timed("rate_limit", () => env.SESSION_RATE_LIMITER.limit({ key }));
            if (!success) return json(429, { error: "Too many upload requests." }, { "Retry-After": "60" });
          }
          if (!localDev) {
            const token = request.headers.get("X-Firebase-AppCheck");
            if (!token || token.length > 8192) {
              console.warn(`[Audio PUT] Missing/invalid App Check header`);
              return json(401, { error: "A valid App Check token is required." });
            }
            try { await timed("app_check", () => verifyToken(token, env)); } catch (err) {
              console.warn(`[Audio PUT] App Check verification failed: ${err.message}`);
              return json(401, { error: "A valid App Check token is required." });
            }
            headers["X-TTS-AppCheck"] = "verified";
          }
          const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
          if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
            console.warn(`[Audio PUT] Unsupported format: ${contentType}`);
            return json(415, { error: "Unsupported audio format." });
          }
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            return json(400, { error: "Empty audio payload." });
          }
          if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
            return json(413, { error: "Audio payload exceeds size limit." });
          }

          const cache = getCache();
          const cacheKeyRequest = new Request(url.origin + url.pathname, { method: "GET" });
          if (cache) {
            const edgeResponse = new Response(arrayBuffer, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-TTS-Cache": "HIT-EDGE",
                ...(originAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
              },
            });
            await cache.put(cacheKeyRequest, edgeResponse);
            console.log(`[Audio PUT] Stored ${audioKey} in edge cache (${arrayBuffer.byteLength}B)`);
          }
          if (env.AUDIO_CACHE) {
            await env.AUDIO_CACHE.put(audioKey, arrayBuffer, {
              httpMetadata: { contentType },
            });
            console.log(`[Audio PUT] Stored ${audioKey} in R2`);
          }
          return json(201, { status: "cached", key: audioKey, size: arrayBuffer.byteLength });
        }

        return json(405, { error: "Method not allowed." }, { Allow: "GET, HEAD, PUT, OPTIONS" });
      }

      const configured = Boolean(env.OPENAI_API_KEY && env.SESSION_RATE_LIMITER &&
        (localDev || (env.FIREBASE_PROJECT_NUMBER && env.FIREBASE_APP_ID)));
      if (["GET", "HEAD"].includes(request.method)) {
        return json(configured ? 200 : 503, {
          status: configured ? "healthy" : "not-configured", runtime,
        });
      }
      if (request.method !== "POST" || !["/", "/proxyResponses"].includes(pathname)) {
        return json(405, { error: "Method not allowed." }, { Allow: "POST, OPTIONS, GET, HEAD" });
      }
      if (!configured) return json(503, { error: "Realtime service is not configured." });

      try {
        // There are no user accounts in the existing TTS request contract. Use
        // Cloudflare's trusted IP header for a generous shared-network limit.
        const routeKey = pathname === "/proxyResponses" ? "responses" : "realtime";
        const key = `${routeKey}:${request.headers.get("CF-Connecting-IP") || "local"}`;
        const { success } = await timed("rate_limit", () => env.SESSION_RATE_LIMITER.limit({ key }));
        if (!success) return json(429, { error: "Too many session requests. Try again shortly." }, { "Retry-After": "60" });
        if (!localDev) {
          const token = request.headers.get("X-Firebase-AppCheck");
          if (!token || token.length > 8192) return json(401, { error: "A valid App Check token is required." });
          try { await timed("app_check", () => verifyToken(token, env)); } catch {
            return json(401, { error: "A valid App Check token is required." });
          }
          headers["X-TTS-AppCheck"] = "verified";
        }

        if (pathname === "/proxyResponses") {
          const body = await timed("parse", () => parseResponsesRequest(request, env));
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
          const upstreamStarted = now();
          try {
            const upstream = await fetchUpstream("https://api.openai.com/v1/responses", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(body),
              signal: controller.signal,
              redirect: "manual",
            });
            timings.push(`openai;dur=${Math.max(0, now() - upstreamStarted)}`);
            const ct = upstream.headers.get("content-type") || "application/json";
            const responseText = await upstream.text();
            if (!upstream.ok) {
              console.warn("Responses upstream rejected request", upstream.status);
            }
            return new Response(responseText, {
              status: upstream.status,
              headers: {
                ...responseHeaders(),
                "Content-Type": ct,
                ...(upstream.status === 429 ? { "Retry-After": "60" } : {}),
              },
            });
          } catch {
            return json(controller.signal.aborted ? 504 : 502, {
              error: "Responses provider is unavailable. Try again shortly.",
            });
          } finally {
            clearTimeout(timeout);
          }
        }

        const { sdp, session } = await timed("parse", () => parseOffer(request, url, env));
        const form = new FormData();
        form.set("sdp", sdp);
        form.set("session", JSON.stringify(session));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
        const upstreamStarted = now();
        try {
          const upstream = await fetchUpstream("https://api.openai.com/v1/realtime/calls", {
            method: "POST",
            headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
            body: form,
            signal: controller.signal,
            // workerd supports follow/manual, not the browser's "error" mode.
            // Treat 3xx as upstream failure so credentials never follow redirects.
            redirect: "manual",
          });
          if (!upstream.ok) {
            await upstream.body?.cancel();
            // Do not reflect provider errors, credentials, or SDP into logs.
            console.warn("Realtime upstream rejected request", upstream.status);
            return json(upstream.status === 429 ? 429 : 502,
              { error: "Realtime provider could not create a session." },
              upstream.status === 429 ? { "Retry-After": "60" } : {});
          }
          const answer = await upstream.text();
          timings.push(`openai;dur=${Math.max(0, now() - upstreamStarted)}`);
          if (!/^v=0\r?\n/.test(answer)) return json(502, { error: "Invalid realtime provider response." });
          return new Response(answer, { status: 200, headers: { ...responseHeaders(), "Content-Type": "application/sdp" } });
        } catch {
          return json(controller.signal.aborted ? 504 : 502, { error: "Realtime provider is unavailable. Try again shortly." });
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        return json(error instanceof HttpError ? error.status : 503, {
          error: error instanceof HttpError ? error.message : "Realtime service is unavailable.",
        });
      }
    },
  };
}

export default createWorker();
