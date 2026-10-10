import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { serveBuiltApp } from "./serveBuiltApp.mjs";
import { INDEXABLE_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, UTILITY_PUBLIC_PATHS } from "../src/seo/publicRoutes.js";

const options = Object.fromEntries(process.argv.slice(2).map(value => { const [key, ...parts] = value.replace(/^--/, "").split("="); return [key, parts.join("=") || "true"]; }));
const directory = resolve(options.dir || "dist");
const output = resolve(options.output || "reports/lighthouse");
const paths = options.all === "true"
  ? [...new Set([...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS, ...UTILITY_PUBLIC_PATHS])]
  : (options.paths || "/,/links,/legacy-links,/citizenship,/orbing,/squircle,/proficiency,/onboarding,/subscribe,/patreon-return,/learn/en,/es,/ar").split(",");
const profiles = (options.profiles || "mobile,desktop").split(",");
const runs = Number(options.runs || 3);
if (!Number.isInteger(runs) || runs < 1 || profiles.some(profile => !["mobile", "desktop"].includes(profile))) throw new Error("Use a positive --runs count and mobile or desktop --profiles.");
await mkdir(output, { recursive: true });
const hosted = options.origin ? null : await serveBuiltApp(directory);
const origin = options.origin || hosted.origin;
const chrome = await launch({ chromePath: options.chrome || process.env.CHROME_PATH, chromeFlags: ["--headless=new", "--no-first-run", "--disable-background-networking"], logLevel: "silent" });
const results = [];
let lighthouseVersion;
try {
  for (const path of paths) {
    for (const profile of profiles) {
      const measurements = [];
      for (let run = 1; run <= runs; run++) {
        const result = await lighthouse(new URL(path, origin).href, {
          port: chrome.port, logLevel: "error", output: "json",
          // Lighthouse preserves local storage by default. Each run here
          // measures a fresh public visit, rather than an account left by a
          // previous URL in this dedicated audit browser.
          clearStorageTypes: ["all"],
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          ...(profile === "desktop" ? { formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } : {}),
        });
        const { lhr } = result;
        lighthouseVersion = lhr.lighthouseVersion;
        const metric = key => Number.isFinite(lhr.audits[key]?.numericValue) ? lhr.audits[key].numericValue : null;
        const missing = ["largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift"].filter(key => metric(key) === null);
        const record = {
          path, profile, run, performance: Math.round((lhr.categories.performance.score || 0) * 100),
          seo: Math.round((lhr.categories.seo.score || 0) * 100),
          accessibility: Math.round((lhr.categories.accessibility.score || 0) * 100),
          bestPractices: Math.round((lhr.categories["best-practices"].score || 0) * 100),
          lcp: metric("largest-contentful-paint") === null ? null : Math.round(metric("largest-contentful-paint")),
          tbt: metric("total-blocking-time") === null ? null : Math.round(metric("total-blocking-time")),
          cls: metric("cumulative-layout-shift") === null ? null : Number(metric("cumulative-layout-shift").toFixed(3)),
          errors: lhr.runtimeError || (missing.length ? { message: `Missing metrics: ${missing.join(", ")}` } : null),
        };
        measurements.push(record);
        await writeFile(resolve(output, `${path.replace(/\W+/g, "-") || "home"}-${profile}-${run}.json`), result.report);
        console.log(JSON.stringify(record));
      }
      const ordered = [...measurements].sort((a, b) => a.performance - b.performance);
      results.push({ ...ordered[Math.floor(ordered.length / 2)], errors: measurements.find(value => value.errors)?.errors || null, runs, minimum: Math.min(...measurements.map(value => value.performance)) });
      await writeFile(resolve(output, "summary.json"), JSON.stringify({ origin, lighthouseVersion, visit: "anonymous, all storage cleared", generatedAt: new Date().toISOString(), results }, null, 2));
    }
  }
} finally {
  await chrome.kill();
  if (hosted) await new Promise(done => hosted.server.close(done));
}
if (options.assert === "true" && results.some(value => value.minimum < 90 || value.errors)) process.exitCode = 1;
