# Cloudflare Worker Realtime TTS Architecture Plan

> Implementation review: the maintained implementation and operational guide are
> in `cloudflare-tts-proxy/README.md`. The prototype below omitted the existing
> mandatory Firebase App Check verification, origin restrictions, model limits,
> rate limiting, body limits, and upstream timeouts; those are preserved/added in
> the implementation. The endpoint also serves speech practice and conversations.
> “Always <5 ms” and “$0 monthly” are not end-to-end latency or total-cost
> guarantees: network/OpenAI latency and OpenAI usage charges still apply, and
> Cloudflare's free tier has daily request and CPU limits. Retire the reserved
> Firebase instance only after verifying the live replacement.

## Executive Summary
Currently, Nosabos relies on a Firebase Cloud Function ([`exchangeRealtimeSDP`](file:///Users/sheilferzepeda/Desktop/nosabos-x/nosabos/functions/index.js#L128-L206)) configured with `minInstances: 1` to eliminate container boot cold starts when initiating WebRTC sessions with OpenAI's Realtime API (`gpt-realtime-2.1-mini`). While this prevents the 2–4 second container cold-start delay, it incurs a recurring Google Cloud / Firebase hosting cost (~$2–$5/month).

This plan outlines replacing or supplementing the Firebase function with a **Cloudflare Worker**. Because Cloudflare Workers run on lightweight **V8 isolates** rather than containerized microVMs, they provide **sub-5ms (effectively 0ms) cold starts worldwide with $0.00/month recurring expense** (within Cloudflare's 100,000 requests/day free tier).

---

## Why Cloudflare Workers?

| Metric | Firebase Functions v2 (`minInstances: 1`) | Firebase Functions v2 (`minInstances: 0`) | Cloudflare Worker (Free Tier) |
| :--- | :--- | :--- | :--- |
| **Runtime Architecture** | Docker / Cloud Run MicroVM | Docker / Cloud Run MicroVM | **V8 Isolates (Edge Runtime)** |
| **Cold Start Latency** | ~0 ms (when warm) | 1,500 ms – 3,500 ms | **< 5 ms (everywhere, always)** |
| **Base Monthly Cost** | **~$2 – $5 / month** | $0.00 / month | **$0.00 / month** (100k req/day free) |
| **Concurrency Scaling** | Container auto-scale limit | Container spin-up latency | **Instant global scale across 300+ edge cities** |
| **Global Proximity** | Fixed region (`us-central1`) | Fixed region (`us-central1`) | **Routed to the closest edge point to the user** |

---

## Architecture Flow

```
[Browser Client]
       |
       | 1. POST SDP Offer (WebRTC)
       v
[Cloudflare Edge Worker] (0ms cold start, attaches secret OPENAI_API_KEY)
       |
       | 2. POST https://api.openai.com/v1/realtime/calls
       v
[OpenAI Realtime Gateway]
       |
       | 3. Returns SDP Answer
       v
[Cloudflare Edge Worker]
       |
       | 4. Returns SDP Answer (Content-Type: application/sdp)
       v
[Browser Client]
       |
       | 5. Direct WebRTC Media Stream (Audio over RTP/UDP)
       +====================================================> [OpenAI Media Gateway]
```

*Note: The proxy only handles the initial ~200ms SDP handshake. All high-bandwidth audio streaming flows directly between the browser and OpenAI over WebRTC.*

---

## Implementation Details

### 1. The Worker Script (`cloudflare-tts-proxy/src/index.js`)

```javascript
/**
 * Cloudflare Worker: OpenAI Realtime SDP Proxy
 * Replaces Firebase exchangeRealtimeSDP with 0ms cold starts at $0/mo.
 */

const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1-mini";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // or restrict to production domains
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Firebase-AppCheck",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    // 1. CORS Preflight & Health Check
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method === "GET" || request.method === "HEAD") {
      return new Response(JSON.stringify({ status: "healthy", runtime: "cloudflare-edge" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }

    // 2. Validate Environment Secret
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY secret on worker." }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(request.url);
      let model = url.searchParams.get("model") || DEFAULT_REALTIME_MODEL;
      const contentType = (request.headers.get("content-type") || "").toLowerCase();

      let offerSDP = "";
      let sessionConfig = null;

      if (contentType.includes("application/sdp")) {
        offerSDP = await request.text();
      } else {
        const body = await request.json().catch(() => ({}));
        offerSDP = (body.sdp || "").toString();
        if (typeof body.model === "string" && body.model.trim()) {
          model = body.model.trim();
        }
        if (body.session && typeof body.session === "object") {
          sessionConfig = {
            ...body.session,
            type: body.session.type || "realtime",
            model: body.session.model || model,
          };
        }
      }

      if (!offerSDP) {
        return new Response(JSON.stringify({ error: "Missing SDP offer." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      // 3. Assemble Multipart Payload for OpenAI Realtime
      const formData = new FormData();
      formData.set("sdp", offerSDP);
      formData.set(
        "session",
        JSON.stringify(sessionConfig || { type: "realtime", model }),
      );

      // 4. Upstream call to OpenAI
      const upstream = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const answerSDP = await upstream.text();

      if (!upstream.ok) {
        return new Response(answerSDP || "Upstream OpenAI error.", {
          status: upstream.status || 502,
          headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
        });
      }

      // 5. Return SDP Answer to Browser
      return new Response(answerSDP, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/sdp",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Internal Worker Error" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
```

---

### 2. Configuration (`cloudflare-tts-proxy/wrangler.toml`)

```toml
name = "nosabos-tts-proxy"
main = "src/index.js"
compatibility_date = "2024-04-01"

[vars]
# Non-secret variables can go here
```

---

## Local Testing Workflow (Zero Cloud Deployment Needed)

You can test the entire setup locally on your machine without deploying anything live to Cloudflare and without needing a Cloudflare account:

### 1. Set Up Local Secrets
Create a `.dev.vars` file inside `cloudflare-tts-proxy/` (this file is gitignored and used only by the local runtime):
```ini
# cloudflare-tts-proxy/.dev.vars
OPENAI_API_KEY=sk-your-openai-key-here
```

### 2. Start the Local Edge Runtime
From the `cloudflare-tts-proxy/` directory, run:
```bash
npx wrangler dev
```
Wrangler will launch the open-source `workerd` V8 runtime locally and output:
```text
Ready on http://localhost:8787
```

### 3. Point Nosabos to Localhost
In the Nosabos root directory, set in `.env.local` (or `.env`):
```env
VITE_REALTIME_URL=http://localhost:8787
```

### 4. Run Verification Tests
1. **Start the frontend:**
   ```bash
   npm run dev
   ```
2. **Open the browser test harness:**
   Navigate to [`http://localhost:5173/tests/browser/tts-playback.html`](file:///Users/sheilferzepeda/Desktop/nosabos-x/nosabos/tests/browser/tts-playback.html).
3. **Verify end-to-end execution:**
   - Click **"Play narration"**.
   - Confirm the SDP offer is received and answered by `http://localhost:8787`.
   - Confirm audio streams and plays in the browser.
   - Click a second time to verify the audio plays instantly from local IndexedDB cache without another network request.

---

### Client Frontend Integration (Production)

In the client application, [`src/utils/tts.js`](file:///Users/sheilferzepeda/Desktop/nosabos-x/nosabos/src/utils/tts.js#L5-L10) points to `VITE_REALTIME_URL`:
```javascript
const REALTIME_URL =
  import.meta.env?.VITE_REALTIME_URL || ""
    ? `${import.meta.env?.VITE_REALTIME_URL}?model=${encodeURIComponent(
        REALTIME_MODEL,
      )}`
    : "";
```

When ready for production, update the environment variable in `.env`:
```env
# Point directly to the live Cloudflare Worker URL
VITE_REALTIME_URL=https://nosabos-tts-proxy.<your-subdomain>.workers.dev
```

No changes to the client-side audio element pre-warming, IndexedDB caching, or WebRTC handlers are required. Everything works transparently as a drop-in endpoint replacement.

---

### Retiring the Firebase Instance Charge

Once the Cloudflare Worker is verified and deployed:
1. In [`functions/index.js`](file:///Users/sheilferzepeda/Desktop/nosabos-x/nosabos/functions/index.js#L131), set `minInstances: 0`:
   ```javascript
   exports.exchangeRealtimeSDP = onRequest(
     {
       region: REGION,
       minInstances: 0, // No longer paying for an idle container
       ...
     }
   );
   ```
2. Deploy the updated functions (`firebase deploy --only functions:exchangeRealtimeSDP`).
3. Monthly fixed container bill drops to **$0.00**.

---

## Live Deployment Steps (When Ready)

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```
2. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```
3. **Set the Production Secret:**
   ```bash
   cd cloudflare-tts-proxy
   wrangler secret put OPENAI_API_KEY
   ```
4. **Deploy:**
   ```bash
   wrangler deploy
   ```
5. **Update `.env`:**
   Update `VITE_REALTIME_URL` in Nosabos to the Worker URL.
6. **Set Firebase `minInstances: 0`:**
   Eliminate the idle container in Google Cloud.
