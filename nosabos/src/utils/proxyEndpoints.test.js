import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProxyBaseUrl,
  getRealtimeUrl,
  getResponsesUrl,
  getAudioCacheUrl,
  getAssetUrl,
} from "./proxyEndpoints.js";

test("defaults to workers.dev fallback in non-browser / test environment", () => {
  const base = getProxyBaseUrl();
  assert.equal(
    base,
    "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev"
  );
  assert.equal(
    getResponsesUrl(),
    "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev/proxyResponses"
  );
  assert.equal(
    getRealtimeUrl("test-model"),
    "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev?model=test-model"
  );
});

test("uses same-origin /api/tts-proxy on piyali.app", () => {
  global.window = {
    location: {
      hostname: "piyali.app",
      origin: "https://piyali.app",
    },
  };
  try {
    assert.equal(getProxyBaseUrl(), "https://piyali.app/api/tts-proxy");
    assert.equal(
      getResponsesUrl(),
      "https://piyali.app/api/tts-proxy/proxyResponses"
    );
    assert.equal(
      getRealtimeUrl("gpt-realtime-2.1-mini"),
      "https://piyali.app/api/tts-proxy?model=gpt-realtime-2.1-mini"
    );
    assert.equal(
      getAudioCacheUrl("test-key"),
      "https://piyali.app/api/tts-proxy/audio/test-key"
    );
    assert.equal(
      getAudioCacheUrl("test-key", "https://piyali.app/api/tts-proxy?model=xyz"),
      "https://piyali.app/api/tts-proxy/audio/test-key"
    );
  } finally {
    delete global.window;
  }
});

test("uses same-origin /api/tts-proxy on nosabos.app and www variants", () => {
  for (const host of ["www.piyali.app", "nosabos.app", "www.nosabos.app"]) {
    global.window = {
      location: {
        hostname: host,
        origin: `https://${host}`,
      },
    };
    try {
      assert.equal(getProxyBaseUrl(), `https://${host}/api/tts-proxy`);
      assert.equal(getResponsesUrl(), `https://${host}/api/tts-proxy/proxyResponses`);
    } finally {
      delete global.window;
    }
  }
});

test("resolves getAssetUrl on both same-origin and fallback environments", () => {
  // 1. Fallback environment
  assert.equal(
    getAssetUrl("audio/awalk.mp3"),
    "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev/assets/audio/awalk.mp3"
  );
  assert.equal(
    getAssetUrl("/audio/awalk.mp3"),
    "https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev/assets/audio/awalk.mp3"
  );
  assert.equal(getAssetUrl(""), "");

  // 2. Same-origin piyali.app
  global.window = {
    location: {
      hostname: "piyali.app",
      origin: "https://piyali.app",
    },
  };
  try {
    assert.equal(
      getAssetUrl("audio/awalk.mp3"),
      "https://piyali.app/api/tts-proxy/assets/audio/awalk.mp3"
    );
  } finally {
    delete global.window;
  }
});
