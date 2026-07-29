import test from "node:test";
import assert from "node:assert/strict";

import { fetchWithTimeout } from "./fetchWithTimeout.js";

test("aborts a request that exceeds its timeout", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (_input, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => {
          const error = new Error("Request timed out");
          error.name = "AbortError";
          reject(error);
        },
        { once: true },
      );
    });

  try {
    await assert.rejects(fetchWithTimeout("/slow", {}, 5), {
      name: "AbortError",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
