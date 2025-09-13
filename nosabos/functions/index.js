/* functions/index.js */

// Firebase Functions v2 (Node 20, global fetch available)
const functions = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Admin SDK once
try {
  admin.app();
} catch {
  admin.initializeApp();
}

// ===== Runtime config =====
//   firebase functions:config:set openai.key="sk-xxxxxxxx"
//   firebase deploy --only functions
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  (functions.params.projectId && functions.config().openai?.key) ||
  "";

if (!OPENAI_API_KEY) {
  functions.logger.warn(
    "OPENAI_API_KEY not set. Use 'firebase functions:config:set openai.key=\"...\"' or env var."
  );
}

// ==== Tunables ====
const REGION = "us-central1";
const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.DEPLOYED_URL,
];

// Only permit the models you actually use with /proxyResponses
const ALLOWED_RESPONSE_MODELS = new Set(["gpt-4o-mini", "gpt-4o", "o4-mini"]);

// Optionally require Firebase App Check (set true after client wiring)
const REQUIRE_APPCHECK = false;

// ===== Small CORS helper =====
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Firebase-AppCheck"
  );
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// ===== App Check (optional but recommended) =====
// async function verifyAppCheck(req) {
//   if (!REQUIRE_APPCHECK) return;
//   const token = req.header("X-Firebase-AppCheck");
//   if (!token) {
//     throw new functions.https.HttpsError(
//       "unauthenticated",
//       "Missing App Check token."
//     );
//   }
//   try {
//     await admin.appCheck().verifyToken(token);
//   } catch (e) {
//     throw new functions.https.HttpsError(
//       "permission-denied",
//       "Invalid App Check token."
//     );
//   }
// }

// ===== Helpers =====
function badRequest(msg) {
  throw new functions.https.HttpsError("invalid-argument", msg);
}
function authzHeader() {
  return { Authorization: `Bearer ${OPENAI_API_KEY}` };
}

// ======================================================
// 1) Realtime SDP Exchange Proxy
//    Frontend posts SDP offer here instead of OpenAI.
//    Returns the SDP answer (Content-Type: application/sdp)
// ------------------------------------------------------
exports.exchangeRealtimeSDP = onRequest(
  {
    region: REGION,
    maxInstances: 10,
    concurrency: 80,
    cors: false, // manual CORS
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    if (applyCors(req, res)) return;
    if (req.method !== "POST")
      return res.status(405).send("Method Not Allowed");
    // await verifyAppCheck(req);

    // Accept raw SDP (Content-Type: application/sdp) or JSON { sdp, model }
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    let offerSDP = "";
    let model = "gpt-4o-realtime-preview"; // set your default realtime model
    if (contentType.includes("application/sdp")) {
      offerSDP = req.rawBody?.toString("utf8") || "";
    } else {
      const body = req.body || {};
      offerSDP = (body.sdp || "").toString();
      if (typeof body.model === "string" && body.model.trim()) {
        model = body.model.trim();
      }
    }
    if (!offerSDP) badRequest("Missing SDP offer.");

    const url = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
      model
    )}`;

    let upstream;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          ...authzHeader(),
          "Content-Type": "application/sdp",
        },
        body: offerSDP,
      });
    } catch (e) {
      functions.logger.error(
        "Realtime upstream fetch failed:",
        e?.message || e
      );
      throw new functions.https.HttpsError(
        "internal",
        "Realtime upstream error."
      );
    }

    const answerSDP = await upstream.text();
    if (!upstream.ok) {
      functions.logger.error(
        "Realtime upstream non-OK:",
        upstream.status,
        answerSDP
      );
      return res.status(502).send(answerSDP || "Upstream error.");
    }

    res.setHeader("Content-Type", "application/sdp");
    return res.status(200).send(answerSDP);
  }
);

// ======================================================
// 2) Responses API Proxy
//    For translate/judge/next-goal requests.
// ------------------------------------------------------
exports.proxyResponses = onRequest(
  {
    region: REGION,
    maxInstances: 20,
    concurrency: 80,
    cors: false,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    if (applyCors(req, res)) return;
    if (req.method !== "POST")
      return res.status(405).send("Method Not Allowed");
    // await verifyAppCheck(req);

    const body = req.body || {};
    const model = (body.model || "").toString();
    if (!model) badRequest("Missing 'model' in request body.");
    if (!ALLOWED_RESPONSE_MODELS.has(model)) {
      badRequest(
        `Model '${model}' not allowed. Allowed: ${Array.from(
          ALLOWED_RESPONSE_MODELS
        ).join(", ")}`
      );
    }

    // (Optional) Inject guardrails/metadata here:
    // body.metadata = { origin: "rbe", ...(body.metadata || {}) };

    let upstream;
    try {
      upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          ...authzHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      functions.logger.error(
        "Responses upstream fetch failed:",
        e?.message || e
      );
      throw new functions.https.HttpsError(
        "internal",
        "Responses upstream error."
      );
    }

    const ct = upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", ct);
    return res.send(text);
  }
);

// ======================================================
// 3) Health check (handy for debugging)
// ------------------------------------------------------
exports.health = onRequest(
  { region: REGION, cors: false },
  async (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(
      JSON.stringify({
        ok: true,
        projectId: functions.params.projectId || admin.app().options.projectId,
        appCheckRequired: REQUIRE_APPCHECK,
        openaiConfigured: Boolean(OPENAI_API_KEY),
        time: new Date().toISOString(),
      })
    );
  }
);
