/**
 * Shared helper to resolve Cloudflare proxy endpoints.
 *
 * When loaded on a Cloudflare-proxied domain (piyali.app, nosabos.app),
 * requests route to same-origin /api/tts-proxy/* paths to completely eliminate
 * the 100ms–300ms mobile CORS preflight (HTTP OPTIONS) latency penalty.
 *
 * In local development (localhost) or staging (firebaseapp / web.app), it
 * falls back to the configured VITE_REALTIME_URL / VITE_RESPONSES_URL.
 */

const DEFAULT_WORKER_ORIGIN =
  "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev";

const PROXIED_HOSTNAMES = new Set([
  "piyali.app",
  "www.piyali.app",
  "nosabos.app",
  "www.nosabos.app",
]);

export function getProxyBaseUrl() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (PROXIED_HOSTNAMES.has(host)) {
      return `${window.location.origin}/api/tts-proxy`;
    }
  }

  const envUrl =
    import.meta.env?.VITE_REALTIME_URL ||
    import.meta.env?.VITE_RESPONSES_URL ||
    DEFAULT_WORKER_ORIGIN;

  return envUrl.replace(/\/+$/, "");
}

export function getRealtimeUrl(model = "gpt-realtime-2.1-mini") {
  const base = getProxyBaseUrl();
  return `${base}?model=${encodeURIComponent(model)}`;
}

export function getResponsesUrl() {
  const base = getProxyBaseUrl();
  return `${base}/proxyResponses`;
}

export function getAudioCacheUrl(key, realtimeUrl) {
  if (!key) return "";
  let base = "";
  if (realtimeUrl) {
    try {
      const url = new URL(
        realtimeUrl,
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "https://piyali.app",
      );
      base = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    } catch {
      base = getProxyBaseUrl();
    }
  } else {
    base = getProxyBaseUrl();
  }
  return `${base}/audio/${encodeURIComponent(key)}`;
}

export function getAssetUrl(assetPath) {
  if (!assetPath) return "";
  const cleanPath = String(assetPath).replace(/^\/+/, "");
  const base = getProxyBaseUrl();
  return `${base}/assets/${cleanPath}`;
}
