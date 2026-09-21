import { appCheckFetch } from "/src/firebaseResources/firebaseResources.js";

const $ = (id) => document.getElementById(id);

const STAGING_URL = "https://nosabos-tts-proxy-staging.robotsbuildingeducation.workers.dev/proxyResponses";
const LOCAL_URL = "http://localhost:8787/proxyResponses";

$("btn-set-local").addEventListener("click", () => {
  $("endpoint-a").value = LOCAL_URL;
});

$("btn-set-staging").addEventListener("click", () => {
  $("endpoint-a").value = STAGING_URL;
});

function extractText(payload) {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return String(payload || "");
  if (payload.output_text) return payload.output_text;
  if (Array.isArray(payload.output)) {
    return payload.output
      .map((item) => (item?.content || []).map((part) => part?.text || "").join(""))
      .join("\n")
      .trim();
  }
  if (payload.error) {
    return `Error: ${payload.error?.message || payload.error}`;
  }
  return JSON.stringify(payload, null, 2);
}

function updateCard(target, state) {
  const isA = target === "A";
  const badge = $(isA ? "badge-a" : "badge-b");
  const lat = $(isA ? "lat-a" : "lat-b");
  const statusEl = $(isA ? "status-a" : "status-b");
  const auth = $(isA ? "auth-a" : "auth-b");
  const textEl = $(isA ? "text-a" : "text-b");
  const headersEl = $(isA ? "headers-a" : "headers-b");
  const jsonEl = $(isA ? "json-a" : "json-b");

  if (state.loading) {
    badge.className = "badge badge-neutral";
    badge.textContent = "Testing...";
    lat.textContent = "—";
    statusEl.textContent = "—";
    auth.textContent = "—";
    textEl.textContent = "Request sent, awaiting response...";
    headersEl.textContent = "—";
    jsonEl.textContent = "—";
    return;
  }

  const ok = state.status >= 200 && state.status < 300;
  badge.className = `badge ${ok ? "badge-success" : "badge-danger"}`;
  badge.textContent = `${state.status} ${ok ? "OK" : "Error"}`;

  lat.textContent = `${state.latencyMs} ms`;
  statusEl.textContent = state.status;
  auth.textContent = state.authStatus || (state.tokenAttached ? "Token Sent" : "No Token");

  textEl.textContent = state.text || "No text returned.";
  headersEl.textContent = state.headers ? JSON.stringify(state.headers, null, 2) : "None";
  jsonEl.textContent = state.json ? JSON.stringify(state.json, null, 2) : (state.raw || "{}");
}

function addHistoryRow(target, endpoint, status, latencyMs, preview) {
  const tbody = $("history-rows");
  if (tbody.querySelector("td[colspan]")) {
    tbody.replaceChildren();
  }
  const tr = document.createElement("tr");
  const ok = status >= 200 && status < 300;
  const timeStr = new Date().toLocaleTimeString();

  tr.innerHTML = `
    <td>${timeStr}</td>
    <td><strong>${target}</strong> (${endpoint.length > 35 ? endpoint.slice(0, 35) + "…" : endpoint})</td>
    <td><span class="badge ${ok ? "badge-success" : "badge-danger"}">${status}</span></td>
    <td><strong>${latencyMs} ms</strong></td>
    <td>${preview ? (preview.length > 50 ? preview.slice(0, 50) + "…" : preview) : "—"}</td>
  `;
  tbody.prepend(tr);
}

async function executeRequest(target, endpoint, model, prompt) {
  updateCard(target, { loading: true });
  const start = performance.now();
  const body = {
    model,
    text: { format: { type: "text" } },
    input: prompt,
  };

  let res;
  let status = 0;
  let headersObj = {};
  let latencyMs = 0;

  try {
    res = await appCheckFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    latencyMs = Math.round(performance.now() - start);
    status = res.status;

    for (const [k, v] of res.headers.entries()) {
      headersObj[k] = v;
    }

    const ct = res.headers.get("content-type") || "";
    let json = null;
    let raw = "";
    let text = "";

    if (ct.includes("application/json")) {
      try {
        json = await res.json();
        text = extractText(json);
      } catch {
        raw = await res.text();
        text = raw;
      }
    } else {
      raw = await res.text();
      text = raw;
    }

    const authHeader = headersObj["x-tts-appcheck"] || (headersObj["x-firebase-appcheck"] ? "present" : null);

    const result = {
      status,
      latencyMs,
      tokenAttached: true,
      authStatus: authHeader,
      text,
      json,
      raw,
      headers: headersObj,
    };

    updateCard(target, result);
    addHistoryRow(target, endpoint, status, latencyMs, text);
    return result;
  } catch (err) {
    latencyMs = Math.round(performance.now() - start);
    const result = {
      status: status || "ERR",
      latencyMs,
      tokenAttached: false,
      authStatus: "Fetch Exception",
      text: `Fetch error: ${err.message || err}`,
      json: null,
      raw: String(err),
      headers: headersObj,
    };
    updateCard(target, result);
    addHistoryRow(target, endpoint, status || "ERR", latencyMs, err.message);
    return result;
  }
}

$("btn-test-cf").addEventListener("click", async () => {
  const endpoint = $("endpoint-a").value.trim();
  const model = $("model").value.trim();
  const prompt = $("input-prompt").value.trim();
  await executeRequest("A", endpoint, model, prompt);
});

$("btn-test-fb").addEventListener("click", async () => {
  const endpoint = $("endpoint-b").value.trim();
  const model = $("model").value.trim();
  const prompt = $("input-prompt").value.trim();
  await executeRequest("B", endpoint, model, prompt);
});

$("btn-test-both").addEventListener("click", async () => {
  const endpointA = $("endpoint-a").value.trim();
  const endpointB = $("endpoint-b").value.trim();
  const model = $("model").value.trim();
  const prompt = $("input-prompt").value.trim();

  // Run sequentially to observe fair latencies without client CPU/network contention
  await executeRequest("A", endpointA, model, prompt);
  await executeRequest("B", endpointB, model, prompt);
});

$("btn-clear").addEventListener("click", () => {
  updateCard("A", { status: 0, latencyMs: "—", text: "Awaiting test execution...", headers: null, json: null });
  updateCard("B", { status: 0, latencyMs: "—", text: "Awaiting test execution...", headers: null, json: null });
  $("badge-a").className = "badge badge-neutral";
  $("badge-a").textContent = "Idle";
  $("badge-b").className = "badge badge-neutral";
  $("badge-b").textContent = "Idle";
  $("history-rows").innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No runs in this session yet.</td></tr>`;
});
