import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers";
import { classifyLoadingResource } from "./loadingActivityCopy.js";

const source = readFileSync(new URL("./startupResourceTracker.js", import.meta.url), "utf8")
  .replace("/* loading-activity-classifier */ (() => null)", `(${classifyLoadingResource.toString()})`);

function browserHarness(urls = [], { plans = null, authenticated = false, pathname = "/links", fetchPlan, styles = [] } = {}) {
  const timers = new Set();
  const preloads = [];
  const events = new Map();
  const scripts = urls.map((src) => ({ src, matches: () => true }));
  let deliver;
  const window = {
    fetch: fetchPlan,
    setTimeout(fn) { timers.add(fn); return fn; },
    clearTimeout(fn) { timers.delete(fn); },
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name) { events.delete(name); },
  };
  const script = source.replace("/* loading-progress-plan */ null", JSON.stringify(plans))
    .replace("/* loading-development-plan-url */ null", JSON.stringify(fetchPlan ? "/__piyali-loading-plan" : null));
  runInNewContext(script, {
    window, URL, URLSearchParams,
    location: { href: `https://piyali.app${pathname}`, origin: "https://piyali.app", pathname },
    localStorage: { getItem: () => authenticated ? "test_nsec" : null },
    document: {
      head: { appendChild: (link) => preloads.push(link) },
      createElement: () => ({}),
      querySelector: () => ({ isConnected: true, querySelector: () => null }),
      querySelectorAll: (selector) => selector === "link[data-startup-stylesheet]" ? styles : scripts,
      getElementById: () => null,
    },
    performance: { getEntriesByType: () => [] },
    PerformanceObserver: class {
      constructor(callback) { deliver = (entries) => callback({ getEntries: () => entries }); }
      observe() {}
      disconnect() {}
    },
    MutationObserver: class { observe() {} disconnect() {} },
  });
  return {
    deliver,
    fail: (index) => events.get("error")({ target: scripts[index] }),
    flush() { const work = [...timers]; timers.clear(); work.forEach((fn) => fn()); },
    snapshot: () => window.__piyaliStartupResources.getSnapshot(),
    api: window.__piyaliStartupResources,
    preloads,
  };
}

function resource(path, overrides = {}) {
  return {
    name: new URL(path, "https://piyali.app").href,
    startTime: 10, duration: 20, responseStatus: 200,
    transferSize: 1324, encodedBodySize: 1024, initiatorType: "script",
    ...overrides,
  };
}

test("app mounting waits for every required stylesheet, including when another sheet was already cached", async () => {
  const callbacks = [];
  const styles = [
    { dataset: { startupLoaded: "true" }, addEventListener() { assert.fail("Cached styles must not wait for another load event"); } },
    ...[0, 1].map((index) => ({ dataset: {}, addEventListener(event, callback) { assert.equal(event, "load"); callbacks[index] = callback; } })),
  ];
  const tracker = browserHarness([], { styles });
  let ready = false;
  const waiting = tracker.api.whenStylesReady().then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(ready, false);
  callbacks[0]();
  await Promise.resolve();
  assert.equal(ready, false);
  callbacks[1]();
  await waiting;
  assert.equal(ready, true);
});

test("development can mount without HTML stylesheet links", async () => {
  await browserHarness().api.whenStylesReady();
});

test("out-of-order completions clear pending files; replayed timing entries aren't counted twice", () => {
  const tracker = browserHarness(["/assets/app.js", "/assets/styles.css"]);
  const newer = resource("/assets/app.js", { startTime: 100 });
  const older = resource("/assets/styles.css", { startTime: 1 });
  tracker.deliver([newer]);
  tracker.flush();
  tracker.deliver([older, newer]);
  tracker.flush();
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.count, 2);
  assert.equal(snapshot.size, "2 KB");
  assert.equal(snapshot.rows.length, 2);
  assert.ok(snapshot.rows.every((row) => row.status === "Received"));
});

test("development plans count downloads completed before metadata arrives, without waiting for main to execute", async () => {
  let finishPlan;
  const fetchPlan = () => new Promise((resolve) => { finishPlan = resolve; });
  const tracker = browserHarness([], { fetchPlan });
  tracker.deliver([resource("/src/index.css"), resource("/src/components/LinksPage.jsx?v=123")]);
  finishPlan({ ok: true, json: async () => ({
    shell: ["/src/main.jsx", "/src/index.css"],
    pages: { links: { resources: ["/src/main.jsx", "/src/index.css", "/src/components/LinksPage.jsx"], steps: ["shell", "code", "page"] } },
  }) });
  await new Promise((resolve) => setImmediate(resolve));
  tracker.flush();
  assert.equal(tracker.snapshot().progress.completed, 2);
  assert.equal(tracker.snapshot().progress.total, 6);
  assert.equal(tracker.snapshot().progress.percentage, 33);
  assert.equal(tracker.snapshot().progress.ready, false);
  tracker.api.completeShell();
  tracker.api.completeCode("links");
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
});

test("a late development graph never replaces a displayed provisional percentage", async () => {
  let finishPlan;
  const tracker = browserHarness([], { fetchPlan: () => new Promise((resolve) => { finishPlan = resolve; }) });
  // Shell readiness used to display 33%, which could fall when the graph grew.
  tracker.api.completeShell();
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, null);
  assert.equal(tracker.snapshot().progress.determinate, false);
  finishPlan({ ok: true, json: async () => ({
    shell: ["/main.js"],
    pages: { links: { resources: ["/main.js", ...Array.from({ length: 20 }, (_, i) => `/part-${i}.js`)], steps: ["shell", "code", "page"] } },
  }) });
  await new Promise((resolve) => setImmediate(resolve));
  tracker.flush();
  assert.equal(tracker.snapshot().progress.determinate, true);
  assert.equal(tracker.snapshot().progress.percentage, 8);
  tracker.api.completeCode("links");
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
});

test("native and React loaders can read the same initialized snapshot immediately", () => {
  const tracker = browserHarness();
  assert.equal(tracker.snapshot().progress.percentage, 0);
  assert.equal(tracker.snapshot().progress.determinate, true);
});

test("development resource keys ignore cache versions while keeping distinct semantic imports", () => {
  const plans = {
    shell: [],
    pages: { links: { resources: ["/docs/policy.md?import=&raw=", "/docs/policy.md?import="], steps: ["shell", "code", "page"] } },
  };
  const tracker = browserHarness([], { plans });
  tracker.deliver([resource("/docs/policy.md?raw&v=123&import&t=456")]);
  tracker.flush();
  assert.equal(tracker.snapshot().progress.completed, 1);
  assert.equal(tracker.snapshot().progress.percentage, 20);
});

test("file fragments match completed requests and URL credentials never appear in displayed details", () => {
  const tracker = browserHarness(["/assets/lessons.js?token=private-token#private-fragment"]);
  tracker.deliver([resource("/assets/lessons.js?token=private-token")]);
  tracker.flush();
  assert.equal(tracker.snapshot().rows.length, 1);
  const row = tracker.snapshot().rows[0];
  assert.equal(row.status, "Received");
  assert.equal(row.name, "lessons.js");
  assert.ok(!`${row.name} ${row.detail}`.includes("private"));
});

test("cached, opaque, and failed resources have distinct labels without invented transfer sizes", () => {
  const tracker = browserHarness(["/assets/missing.js"]);
  tracker.fail(0);
  tracker.deliver([
    resource("/assets/missing.js", { responseStatus: 0, transferSize: 0, encodedBodySize: 0 }),
    resource("https://cdn.example.com/font.woff2", { responseStatus: 0, transferSize: 0, encodedBodySize: 0, startTime: 2 }),
    resource("/assets/cached.js", { deliveryType: "cache", transferSize: 0, startTime: 3 }),
  ]);
  tracker.flush();
  const rows = tracker.snapshot().rows;
  assert.equal(rows.find((row) => row.name === "missing.js").status, "Failed");
  assert.equal(rows.filter((row) => row.name === "missing.js").length, 1);
  const opaque = rows.find((row) => row.type === "Font");
  assert.equal(opaque.status, "Finished");
  assert.ok(!opaque.detail.includes(" B"));
  const cached = rows.find((row) => row.name === "cached.js");
  assert.equal(cached.status, "Cached");
  assert.ok(!cached.detail.includes("transferred"));
});

test("a late script error corrects an opaque completion instead of leaving a successful-looking row", () => {
  const tracker = browserHarness(["/assets/missing.js"]);
  tracker.deliver([resource("/assets/missing.js", { responseStatus: 0, transferSize: 0, encodedBodySize: 0 })]);
  tracker.flush();
  tracker.fail(0);
  tracker.flush();
  assert.equal(tracker.snapshot().rows.length, 1);
  assert.equal(tracker.snapshot().rows[0].status, "Failed");
});

test("character files become one product activity that stays loading until every requested image finishes", () => {
  const tracker = browserHarness(["/assets/1-abc.webp", "/assets/3-def.webp"]);
  tracker.flush();
  assert.equal(tracker.snapshot().activities.length, 1);
  assert.equal(tracker.snapshot().activities[0].message, "Downloading character artwork…");
  tracker.deliver([resource("/assets/1-abc.webp")]);
  tracker.flush();
  assert.equal(tracker.snapshot().activities[0].state, "loading");
  tracker.deliver([resource("/assets/3-def.webp")]);
  tracker.flush();
  assert.equal(tracker.snapshot().activities[0].message, "Character artwork ready");
});

test("download rows keep their slots when completions arrive out of order", () => {
  const paths = ["/assets/es-abc.js", "/assets/fr-abc.js", "/assets/ja-abc.js", "/assets/VoiceOrb-abc.js", "/assets/1-abc.webp"];
  const tracker = browserHarness(paths);
  const slots = new Map(tracker.snapshot().activities.map(({ key, slot }) => [key, slot]));
  tracker.deliver([resource(paths[2]), resource(paths[0])]);
  tracker.flush();
  assert.equal(tracker.snapshot().activities.length, 5);
  for (const { key, slot } of tracker.snapshot().activities) assert.equal(slot, slots.get(key));
  assert.equal(tracker.snapshot().activities.find(({ key }) => key === "content:ja").state, "ready");
});

test("a waiting download reuses a finished slot without moving active rows or cycling old rows back", () => {
  const paths = ["/assets/es-abc.js", "/assets/fr-abc.js", "/assets/ja-abc.js", "/assets/de-abc.js", "/assets/pt-abc.js", "/assets/it-abc.js"];
  const tracker = browserHarness(paths);
  const before = tracker.snapshot().activities;
  assert.equal(before.length, 5);
  assert.ok(before.every(({ state }) => state === "loading"));
  assert.ok(!before.some(({ key }) => key === "content:it"));
  const freed = before.find(({ key }) => key === "content:ja").slot;
  tracker.deliver([resource(paths[2])]);
  tracker.flush();
  const after = tracker.snapshot().activities;
  assert.equal(after.find(({ key }) => key === "content:it").slot, freed);
  for (const { key, slot } of before.filter(({ key }) => key !== "content:ja")) {
    assert.equal(after.find((activity) => activity.key === key).slot, slot);
  }
  tracker.deliver([resource(paths[0])]);
  tracker.flush();
  assert.ok(!tracker.snapshot().activities.some(({ key }) => key === "content:ja"));
  tracker.api.flushNow();
  assert.ok(!tracker.snapshot().activities.some(({ key }) => key === "content:ja"));
});

test("product copy identifies language content in source and production paths and hides infrastructure", () => {
  for (const path of ["/src/data/skillTree/targetCurriculum/fr.js", "/assets/fr-1abcDEF.js", "/assets/fr2-1abcDEF.js", "/src/features/publicCopy/landing/fr.js", "/src/features/publicCopy/links/fr.jsx"]) {
    assert.equal(classifyLoadingResource(path).loading, "Downloading French content…");
  }
  assert.equal(classifyLoadingResource("/src/data/phonics/es.js").loading, "Downloading Spanish pronunciation practice…");
  assert.equal(classifyLoadingResource("/src/data/skillTree/baseLevels/a1.js").loading, "Downloading lesson activities…");
  assert.equal(classifyLoadingResource("/assets/index-abc123.js").loading, "Preparing practice tools…");
  assert.equal(classifyLoadingResource("/registerSW.js"), null);
  assert.equal(classifyLoadingResource("/@vite/client"), null);
});

test("product activities never display filenames, sizes, timings, or URL credentials", () => {
  const tracker = browserHarness();
  tracker.deliver([
    resource("/assets/ja-secretHash.js?token=private-token"),
    resource("/assets/VoiceOrb-secretHash.js"),
  ]);
  tracker.flush();
  const messages = tracker.snapshot().activities.map((activity) => activity.message).join(" ");
  assert.ok(messages.includes("Japanese content ready"));
  assert.ok(messages.includes("Voice and sound ready"));
  assert.doesNotMatch(messages, /secretHash|private-token|\.js|\d+\s*(?:KB|MB|ms)/);
});

test("fixed planned work advances on completion, ignores background work, and waits for the rendered page", () => {
  const plans = {
    shell: ["/assets/main.js", "/assets/main.css"],
    pages: { links: { resources: ["/assets/main.js", "/assets/main.css", "/assets/links.js"], steps: ["shell", "code", "page"] } },
  };
  const tracker = browserHarness([], { plans });
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 0);
  tracker.deliver([resource("/assets/main.css")]);
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 16);
  tracker.deliver([resource("/assets/optional-game.js"), resource("/assets/links.js", { responseStatus: 404 })]);
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 16);
  assert.equal(tracker.snapshot().progress.total, 6);
  tracker.api.completeShell();
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 50);
  tracker.deliver([resource("/assets/links.js", { startTime: 50 })]);
  tracker.api.completeCode("links");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 83);
  assert.equal(tracker.snapshot().progress.ready, false);
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
  assert.equal(tracker.snapshot().progress.ready, true);
});

test("the first public route preloads only its required modules while the shell downloads", () => {
  const plans = {
    shell: ["/assets/main.js"],
    pages: {
      landing: { resources: ["/assets/main.js", "/assets/landing.js", "/assets/landing.css"], steps: ["shell", "code", "page"] },
      links: { resources: ["/assets/main.js", "/assets/links.js"], steps: ["shell", "code", "page"] },
      app: { resources: ["/assets/main.js", "/assets/app.js"], steps: ["shell", "code", "page"] },
    },
  };
  const landing = browserHarness([], { plans, pathname: "/" });
  assert.deepEqual(landing.preloads.map((link) => link.href), ["/assets/landing.js"]);
  assert.equal(landing.preloads[0].rel, "modulepreload");
  assert.equal(landing.preloads[0].crossOrigin, "");
  const links = browserHarness([], { plans });
  assert.deepEqual(links.preloads.map((link) => link.href), ["/assets/links.js"]);
  const authenticated = browserHarness([], { plans, pathname: "/", authenticated: true });
  assert.equal(authenticated.preloads.length, 0);
  const development = browserHarness([], { plans, fetchPlan: async () => ({ ok: false }) });
  assert.equal(development.preloads.length, 0);
});

test("the lazy landing page stays incomplete until its route code and stylesheet finish", () => {
  const plans = {
    shell: ["/assets/main.js"],
    pages: { landing: { resources: ["/assets/main.js", "/assets/landing.js", "/assets/landing.css"], steps: ["shell", "code", "page"] } },
  };
  const tracker = browserHarness([], { plans, pathname: "/" });
  tracker.api.completeShell();
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 33);
  assert.equal(tracker.snapshot().progress.ready, false);
  tracker.deliver([resource("/assets/landing.js"), resource("/assets/landing.css")]);
  tracker.api.completeCode("landing");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.ready, false);
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
  assert.equal(tracker.snapshot().progress.ready, true);
});

test("initialization signals cannot mark a known failed stylesheet as downloaded", () => {
  const plans = {
    shell: ["/assets/main.css"],
    pages: { links: { resources: ["/assets/main.css"], steps: ["shell", "code", "page"] } },
  };
  const tracker = browserHarness([], { plans });
  tracker.deliver([resource("/assets/main.css", { responseStatus: 503 })]);
  tracker.api.completeShell();
  tracker.api.completeCode("links");
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 75);
  assert.equal(tracker.snapshot().progress.failed, true);
  assert.equal(tracker.snapshot().progress.ready, false);
  tracker.deliver([resource("/assets/main.css", { startTime: 50 })]);
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
  assert.equal(tracker.snapshot().progress.failed, false);
});

test("signed-in startup cannot finish while profile, access, or lesson checks are unresolved", () => {
  const tracker = browserHarness([], { authenticated: true, pathname: "/" });
  tracker.api.completeShell();
  tracker.api.completeCode("app");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 33);
  tracker.api.setStep("profile");
  tracker.api.setStep("access");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 66);
  tracker.api.setStep("lessons");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 83);
  tracker.api.setStep("page");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.percentage, 100);
  // A new page retains already-loaded code, but not the previous page's readiness.
  tracker.api.beginPage("links");
  tracker.flush();
  assert.equal(tracker.snapshot().progress.ready, false);
  assert.equal(tracker.snapshot().progress.percentage, 33);
});
