import { verifyAppCheck } from "./app-check.js";

const DEFAULT_MODEL = "gpt-realtime-2.1-mini";
const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 30_000;
const ALLOW_HEADERS = "Content-Type, Authorization, X-Firebase-AppCheck";

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

export function createWorker({ fetchUpstream = fetch, verifyToken = verifyAppCheck, now = Date.now } = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const startedAt = now();
      const timings = [];
      const localRuntime = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      const runtime = localRuntime ? "local-workerd" : "cloudflare-edge";
      const origin = request.headers.get("Origin");
      const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim());
      const originAllowed = origin && allowedOrigins.includes(origin);
      const headers = {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Origin",
        "X-TTS-Runtime": runtime,
        "X-TTS-Colo": localRuntime ? "local" : request.cf?.colo || "unknown",
        ...(originAllowed ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD",
          "Access-Control-Allow-Headers": ALLOW_HEADERS,
          "Access-Control-Max-Age": "86400",
          "Access-Control-Expose-Headers": "Server-Timing, X-TTS-Runtime, X-TTS-AppCheck, X-TTS-Colo",
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
      if (origin && !originAllowed) return json(403, { error: "Origin is not allowed." });
      if (!["/", "/health"].includes(url.pathname)) return json(404, { error: "Not found." });
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

      // Disabling verification is only possible in the local workerd runtime.
      const localDev = env.REQUIRE_APPCHECK === "false" && localRuntime;
      headers["X-TTS-AppCheck"] = localDev ? "local-bypass" : "required";
      const configured = Boolean(env.OPENAI_API_KEY && env.SESSION_RATE_LIMITER &&
        (localDev || (env.FIREBASE_PROJECT_NUMBER && env.FIREBASE_APP_ID)));
      if (["GET", "HEAD"].includes(request.method)) {
        return json(configured ? 200 : 503, {
          status: configured ? "healthy" : "not-configured", runtime,
        });
      }
      if (request.method !== "POST" || url.pathname !== "/") {
        return json(405, { error: "Method not allowed." }, { Allow: "POST, OPTIONS, GET, HEAD" });
      }
      if (!configured) return json(503, { error: "Realtime service is not configured." });

      try {
        // There are no user accounts in the existing TTS request contract. Use
        // Cloudflare's trusted IP header for a generous shared-network limit.
        const key = `realtime:${request.headers.get("CF-Connecting-IP") || "local"}`;
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
