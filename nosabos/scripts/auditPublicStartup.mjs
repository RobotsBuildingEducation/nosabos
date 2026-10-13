import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { parse } from "@babel/parser";

// Run after npm run build. This checks the code each public route requires,
// including shared chunks, rather than just the size of its named bundle.
const dist = path.resolve("dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const entry = html.match(/src="\/(assets\/index-[^"]+\.js)"/)?.[1];
assert.ok(entry, "Could not find the production entry point; run npm run build first.");
assert.ok(!html.includes("registerSW.js"), "Public HTML must not automatically start the full offline precache.");
assert.ok(!html.includes("fonts.googleapis.com/css"), "Route-specific display fonts must not block public HTML.");

const stats = fs.readFileSync("stats.html", "utf8");
const start = stats.indexOf("const data = ") + "const data = ".length;
const data = JSON.parse(stats.slice(start, stats.indexOf(";", start)));
const files = fs.readdirSync(path.join(dist, "assets"));

function collectStaticImports(file, collected) {
  if (collected.has(file)) return;
  collected.add(file);
  const ast = parse(fs.readFileSync(path.join(dist, file), "utf8"), { sourceType: "module" });
  for (const node of ast.program.body) {
    if ((node.type === "ImportDeclaration" || node.type.startsWith("Export")) && node.source) {
      assert.ok(node.source.value.startsWith("."), `Unexpected external import in ${file}`);
      collectStaticImports(path.posix.join(path.posix.dirname(file), node.source.value), collected);
    }
  }
}

const report = [];
for (const [route, prefix] of [["/", "LandingPage-"], ["/links", "LinksPage-"]]) {
  const routeFile = files.find((file) => file.startsWith(prefix) && file.endsWith(".js"));
  assert.ok(routeFile, `Missing bundle for ${route}`);
  const graph = new Set();
  collectStaticImports(entry, graph);
  collectStaticImports(`assets/${routeFile}`, graph);
  const modules = Object.values(data.nodeMetas).filter((module) =>
    Object.keys(module.moduleParts).some((chunk) => graph.has(chunk)),
  );
  const heavy = modules.filter((module) =>
    /\/node_modules\/(?:@firebase|firebase|@nostr-dev-kit|@cashu|cashu-ts-v4|tone|three)\//.test(module.id),
  );
  assert.deepEqual(heavy.map((module) => module.id), [], `${route} eagerly imports optional infrastructure`);
  let bytes = 0;
  let gzip = 0;
  for (const file of graph) {
    const content = fs.readFileSync(path.join(dist, file));
    bytes += content.length;
    gzip += gzipSync(content).length;
  }
  assert.ok(gzip <= 450_000, `${route} exceeds the 450 KB gzip startup budget: ${gzip} bytes`);
  report.push({ route, files: graph.size, minifiedKB: Math.round(bytes / 1000), gzipKB: Math.round(gzip / 1000) });
}
console.table(report);

const worker = parse(fs.readFileSync(path.join(dist, "sw.js"), "utf8"));
let precacheUrls;
function inspectWorker(node) {
  if (!node || typeof node !== "object") return;
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.property.name === "precacheAndRoute") {
    precacheUrls = node.arguments[0].elements.map((entry) =>
      entry.properties.find((property) => property.key.name === "url").value.value,
    );
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(inspectWorker);
    else if (value && typeof value === "object") inspectWorker(value);
  }
}
inspectWorker(worker);
assert.ok(precacheUrls, "Missing generated update worker precache.");
assert.deepEqual([...precacheUrls].sort(), ["index.html", "manifest.webmanifest"], "The update worker must not download unused feature bundles.");
const shellBytes = precacheUrls.reduce((sum, url) => sum + fs.statSync(path.join(dist, url)).size, 0);
assert.ok(shellBytes <= 16_000, `The update shell exceeded 16 KB: ${shellBytes} bytes`);
console.log(`Update worker caches only ${precacheUrls.length} shell files (${shellBytes} bytes).`);
console.log("Public startup budgets passed; optional infrastructure is deferred.");
