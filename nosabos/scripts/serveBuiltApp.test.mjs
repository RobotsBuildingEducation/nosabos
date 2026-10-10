import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { serveBuiltApp } from "./serveBuiltApp.mjs";

test("local preview forwards Firebase APIs while keeping debug configuration out of the build", async () => {
  const directory = await mkdtemp(join(tmpdir(), "piyali-preview-server-"));
  const html = '<html><head><title>Preview</title></head><body>Public content</body></html>';
  await writeFile(join(directory, "index.html"), html);
  await writeFile(join(directory, "404.html"), "Page not found");
  const received = [];
  const backend = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    received.push({ url: request.url, method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString() });
    const body = gzipSync(JSON.stringify({ backend: true }));
    response.writeHead(422, {
      "Content-Type": "application/json", "Content-Encoding": "gzip",
      "Set-Cookie": ["first=one; HttpOnly; Path=/", "second=two; HttpOnly; Path=/"],
    }).end(body);
  });
  await new Promise(done => backend.listen(0, "127.0.0.1", done));
  const backendOrigin = `http://127.0.0.1:${backend.address().port}`;
  let hosted;
  try {
    hosted = await serveBuiltApp(directory, 0, { backendOrigin, appCheckDebugToken: "test-preview-token" });
    const page = await fetch(hosted.origin);
    assert.match(await page.text(), /FIREBASE_APPCHECK_DEBUG_TOKEN="test-preview-token"/);
    assert.equal(await readFile(join(directory, "index.html"), "utf8"), html);
    for (const path of ["/api/patreon/link-challenge?check=1", "/talkTurn", "/tts"]) {
      const response = await fetch(hosted.origin + path, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Firebase-AppCheck": "test-app-check", Cookie: "session=test-session" },
        body: '{"publicId":"test-public-id"}',
      });
      assert.equal(response.status, 422);
      assert.deepEqual(await response.json(), { backend: true });
      assert.equal(response.headers.get("content-encoding"), null);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.getSetCookie().length, 2);
      const request = received.at(-1);
      assert.equal(request.url, path);
      assert.equal(request.method, "POST");
      assert.equal(request.headers["x-firebase-appcheck"], "test-app-check");
      assert.equal(request.headers.cookie, "session=test-session");
      assert.equal(request.body, '{"publicId":"test-public-id"}');
    }
    const count = received.length;
    assert.equal((await fetch(hosted.origin + "/api/unrelated")).status, 404);
    assert.equal(received.length, count);
  } finally {
    if (hosted) await new Promise(done => hosted.server.close(done));
    await new Promise(done => backend.close(done));
    await rm(directory, { recursive: true, force: true });
  }
});
