import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { Readable } from "node:stream";

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

export async function serveBuiltApp(directory, port = 0, { appCheckDebugToken, backendOrigin } = {}) {
  const root = resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url, "http://localhost");
      const pathname = decodeURIComponent(requestUrl.pathname);
      if (backendOrigin && (/^\/api\/patreon(?:\/|$)/.test(pathname) || ["/talkTurn", "/tts"].includes(pathname))) {
        const headers = new Headers();
        const hopHeaders = new Set(["host", "connection", "keep-alive", "transfer-encoding", "te", "trailer", "upgrade", "proxy-authenticate", "proxy-authorization"]);
        for (const [name, value] of Object.entries(request.headers)) {
          if (!hopHeaders.has(name) && value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
        }
        const upstream = await fetch(new URL(requestUrl.pathname + requestUrl.search, backendOrigin), {
          method: request.method,
          headers,
          ...(!["GET", "HEAD"].includes(request.method) ? { body: request, duplex: "half" } : {}),
          redirect: "manual",
          signal: AbortSignal.timeout(60_000),
        });
        const responseHeaders = {};
        for (const [name, value] of upstream.headers) {
          // Node's fetch decompresses the body before forwarding it.
          if (!hopHeaders.has(name) && !["content-encoding", "content-length", "set-cookie"].includes(name)) responseHeaders[name] = value;
        }
        const cookies = upstream.headers.getSetCookie();
        if (cookies.length) responseHeaders["set-cookie"] = cookies;
        responseHeaders["cache-control"] = "no-store";
        response.writeHead(upstream.status, responseHeaders);
        if (upstream.body && request.method !== "HEAD") Readable.fromWeb(upstream.body).on("error", () => response.destroy()).pipe(response);
        else response.end();
        return;
      }
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      try {
        if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
        await stat(file);
      } catch {
        const cleanFile = resolve(root, `.${pathname.replace(/\/$/, "")}.html`);
        try { await stat(cleanFile); file = cleanFile; }
        catch {
          // The initial Vite build has a SPA shell; the complete build has a
          // real 404 and explicit fallback for nested onboarding routes.
          try { await stat(resolve(root, "404.html")); file = resolve(root, pathname.startsWith("/onboarding/") ? "onboarding.html" : "404.html"); }
          catch { file = resolve(root, "index.html"); }
        }
      }
      let body = await readFile(file);
      // The preview is bound to loopback. Reuse an already registered local
      // token without writing it into the deployable HTML or JavaScript.
      if (appCheckDebugToken && extname(file) === ".html") {
        const token = JSON.stringify(appCheckDebugToken).replace(/</g, "\\u003c");
        body = Buffer.from(body.toString("utf8").replace("<head>", `<head><script>self.FIREBASE_APPCHECK_DEBUG_TOKEN=${token};</script>`));
      }
      const compress = /\b(?:text|application)\//.test(types[extname(file)] || "") && request.headers["accept-encoding"]?.includes("gzip");
      response.writeHead(file === resolve(root, "404.html") ? 404 : 200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
        ...(compress ? { "Content-Encoding": "gzip", "Vary": "Accept-Encoding" } : {}),
      });
      response.end(compress ? gzipSync(body) : body);
    } catch { response.writeHead(500).end("Unable to serve build"); }
  });
  await new Promise(resolveListening => server.listen(port, "127.0.0.1", resolveListening));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}
