import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { serveBuiltApp } from "./serveBuiltApp.mjs";
import { INDEXABLE_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, UTILITY_PUBLIC_PATHS, getPublicMetadata } from "../src/seo/publicRoutes.js";

const hosted = await serveBuiltApp("dist");
const paths = [...new Set([...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS, ...UTILITY_PUBLIC_PATHS])];
let browser;
try {
  const hosting = JSON.parse(await readFile("firebase.json", "utf8")).hosting;
  const publicHtmlCacheRule = hosting.headers.find(rule => rule.regex && rule.headers.some(header => header.key === "Cache-Control"));
  assert.ok(publicHtmlCacheRule, "clean public URLs have an explicit HTML cache policy");
  const publicHtmlPattern = new RegExp(publicHtmlCacheRule.regex);
  for (const path of paths.filter(path => path !== "/")) assert.ok(publicHtmlPattern.test(path), `HTML cache header: ${path}`);
  for (const path of ["/assets/main.js", "/api/patreon/login", "/tts", "/talkTurn", "/version.json"]) assert.equal(publicHtmlPattern.test(path), false, `HTML cache policy excludes ${path}`);
  assert.equal(hosting.cleanUrls, true);
  assert.equal(hosting.trailingSlash, false);
  for (const path of paths) {
    const response = await fetch(hosted.origin + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const metadata = getPublicMetadata(path);
    assert.ok(html.includes(`href="${metadata.canonical}"`), `canonical: ${path}`);
    assert.ok(html.includes(`content="${metadata.robots}"`), `robots: ${path}`);
    if (metadata.indexable) {
      assert.ok(/<h1[\s>]/.test(html), `h1: ${path}`);
      assert.ok(html.includes(`lang="${metadata.locale}"`), `language: ${path}`);
    }
    if (metadata.target) assert.doesNotMatch(html, /<script(?! type="application\/ld\+json")/, path);
  }
  assert.equal((await fetch(hosted.origin + "/a-page-that-does-not-exist")).status, 404);
  assert.match(await (await fetch(hosted.origin + "/robots.txt")).text(), /Sitemap: https:\/\/piyali.app\/sitemap.xml/);
  const sitemap = await (await fetch(hosted.origin + "/sitemap.xml")).text();
  assert.ok(!sitemap.includes("patreon-return") && !sitemap.includes("orbing"));
  console.log(`Verified HTML, metadata and HTTP status for ${paths.length} public URLs.`);

  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }), headless: true });
  const output = resolve(process.env.PUBLIC_SCREENSHOTS || "/private/tmp/piyali-public-screenshots");
  await mkdir(output, { recursive: true });
  for (const path of ["/", "/es", "/ar", "/links", "/ar/links", "/citizenship", "/zh/citizenship", "/legacy-links", "/orbing", "/squircle", "/proficiency", "/onboarding", "/subscribe"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(hosted.origin + path, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await page.waitForFunction(() => document.documentElement.dataset.publicReady === "true");
    await page.waitForLoadState("networkidle");
    // A DOM marker lets us verify that hydration kept the original content.
    assert.deepEqual(errors, [], `browser errors: ${path}`);
    assert.ok((await page.locator("#root").innerText()).length > 80, path);
    if (["/", "/links", "/citizenship", "/ar"].includes(path)) await page.screenshot({ path: resolve(output, `${path.replace(/\W+/g, "-")}-mobile.png`), fullPage: false });
    console.log(`Browser checked ${path}`);
    if (path === "/") {
      await page.locator(".piyali-landing-brand .voice-orb-3d canvas").waitFor({ state: "visible" });
      console.log("Verified the actual 3D voice orb loads without clicking it.");
      await page.locator(".lp-live-demo").scrollIntoViewIfNeeded();
      await page.locator(".lp-speak-orb .voice-orb-3d canvas").waitFor({ state: "visible" });
      await page.screenshot({ path: resolve(output, "live-demo-mobile.png"), fullPage: false });
      assert.deepEqual(errors, [], "live-demo orb loads as it comes into view");
      const input = page.locator("input[data-public-name]").first();
      if (await input.count()) { await input.fill("Performance check"); assert.equal(await input.inputValue(), "Performance check"); }
      await page.getByRole("button", { name: "Sign In With Secret Key", exact: true }).first().click();
      await page.getByPlaceholder("Enter your secret key").waitFor();
      assert.deepEqual(errors, [], "sign-in view errors");
    }
    await context.close();
  }
  // Hold the application chunk until a visitor has typed and clicked in the
  // static HTML. Loading must preserve both their text and their first action.
  const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8"));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let release;
  const pending = new Promise(done => { release = done; });
  const mainEntry = Object.values(manifest).find(entry => entry.name === "main" && entry.isDynamicEntry);
  assert.ok(mainEntry, "interactive application entry in build manifest");
  await page.route(`**/${mainEntry.file}`, async route => { await pending; await route.continue(); });
  await page.goto(hosted.origin + "/?practice=fr", { waitUntil: "domcontentloaded" });
  await page.locator("input[data-public-name]").first().fill("Early visitor");
  await page.getByRole("button", { name: "Sign In With Secret Key", exact: true }).first().click();
  release();
  await page.getByPlaceholder("Enter your secret key").waitFor();
  await page.getByRole("button", { name: "← Back", exact: true }).click();
  assert.equal(await page.locator("input[data-public-name]").first().inputValue(), "Early visitor");
  await page.waitForLoadState("networkidle");
  assert.deepEqual(errors, [], "interaction while loading and requested practice language");
  assert.match(await page.locator("#lp-atlas-postcard").innerText(), /Bonjour|Salut|French/);
  await page.locator("#public-interface-language").selectOption("es");
  await page.waitForURL(/\/es\?practice=fr/, { waitUntil: "commit", timeout: 5000 });
  await page.locator('.lp-atlas-greeting[lang="fr"]').waitFor();
  assert.equal(await page.locator("input[data-public-name]").first().inputValue(), "Early visitor");
  assert.deepEqual(errors, [], "localized navigation preserves practice choice and draft name");
  await page.locator(".lp-demo-language-button").click();
  await page.getByRole("menuitemradio", { name: /Alemán/ }).click();
  await page.locator('.lp-live-demo .lp-demo-transcript[lang="de"]').first().waitFor({ timeout: 5000 });
  assert.deepEqual(errors, [], "tutor demo language control");
  await context.close();
  console.log("Verified early input, queued sign-in click and practice-language links.");

  const localeContext = await browser.newContext({ serviceWorkers: "block" });
  const localePage = await localeContext.newPage();
  let releaseLocale;
  const localeGate = new Promise(done => { releaseLocale = done; });
  await localePage.route(`**/${mainEntry.file}`, async route => { await localeGate; await route.continue(); });
  await localePage.goto(hosted.origin + "/?practice=fr", { waitUntil: "domcontentloaded" });
  await localePage.locator("input[data-public-name]").first().fill("Locale visitor");
  await localePage.locator("#public-interface-language").selectOption("es");
  releaseLocale();
  await localePage.waitForURL(/\/es\?practice=fr/, { timeout: 5000 });
  await localePage.locator('.lp-atlas-greeting[lang="fr"]').waitFor();
  assert.equal(await localePage.locator("input[data-public-name]").first().inputValue(), "Locale visitor");
  await localeContext.close();
  const sliderContext = await browser.newContext({ serviceWorkers: "block" });
  const sliderPage = await sliderContext.newPage();
  let releaseSlider;
  const sliderGate = new Promise(done => { releaseSlider = done; });
  await sliderPage.route(`**/${mainEntry.file}`, async route => { await sliderGate; await route.continue(); });
  await sliderPage.goto(hosted.origin + "/squircle", { waitUntil: "domcontentloaded" });
  await sliderPage.getByRole("slider", { name: "Width slider" }).evaluate(input => {
    input.value = "340";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  releaseSlider();
  await sliderPage.waitForFunction(() => document.documentElement.dataset.publicReady === "true");
  assert.equal(await sliderPage.getByRole("slider", { name: "Width slider" }).inputValue(), "340");
  await sliderPage.getByText(/340 x 220/).waitFor();
  await sliderContext.close();

  const cachedContext = await browser.newContext({ serviceWorkers: "block" });
  const cachedPage = await cachedContext.newPage();
  const cachedErrors = [];
  cachedPage.on("pageerror", error => cachedErrors.push(error.message));
  const homeSnapshot = await readFile("dist/index.html", "utf8");
  await cachedPage.route(hosted.origin + "/ar", route => route.fulfill({ status: 200, contentType: "text/html", body: homeSnapshot }));
  await cachedPage.goto(hosted.origin + "/ar", { waitUntil: "networkidle" });
  await cachedPage.waitForFunction(() => document.documentElement.dataset.publicReady === "true");
  assert.deepEqual(cachedErrors, [], "cached app-shell navigation");
  assert.equal((await cachedPage.locator("html").getAttribute("lang")).split("-")[0], "ar");
  assert.equal(await cachedPage.locator('link[rel="canonical"]').getAttribute("href"), "https://piyali.app/ar");
  await cachedContext.close();
  console.log("Verified early slider edits and cached app-shell navigation.");
} finally {
  if (browser) await browser.close();
  await new Promise(done => hosted.server.close(done));
}
