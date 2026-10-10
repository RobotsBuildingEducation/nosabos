import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { INDEXABLE_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, UTILITY_PUBLIC_PATHS, getPublicMetadata } from "../src/seo/publicRoutes.js";
import { escapeHtml, renderSeoHead } from "../src/seo/head.js";
import { renderPublicPage } from "../.prerender/entry-server.js";

const directory = resolve("dist");
const sourceShell = await readFile(resolve(directory, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(resolve(directory, ".vite/manifest.json"), "utf8"));
const mainEntryKey = Object.keys(manifest).find(key => manifest[key].name === "main" && manifest[key].isDynamicEntry);
if (!mainEntryKey) throw new Error("The build manifest is missing the interactive application entry.");
const assets = await readdir(resolve(directory, "assets"));
const pages = [...new Set([...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS, ...UTILITY_PUBLIC_PATHS])].filter(path => !getPublicMetadata(path).target && path !== "/patreon-return");
const componentFiles = { "/": "LandingPage", "/links": "LinksPage", "/citizenship": "CitizenshipGuide", "/legacy-links": "LegacyLinksPage", "/orbing": "orbing/OrbingPlayground", "/squircle": "SquirclePlayground", "/proficiency": "LandingPage", "/onboarding": "LandingPage", "/subscribe": "LandingPage" };

function cssForEntry(key, seen = new Set()) {
  if (seen.has(key) || !manifest[key]) return [];
  seen.add(key);
  const entry = manifest[key];
  return [...(entry.css || []), ...(entry.imports || []).flatMap(child => cssForEntry(child, seen))];
}
function documentForPage(path, body) {
  const metadata = getPublicMetadata(path);
  const component = componentFiles[metadata.path];
  const css = [...cssForEntry(mainEntryKey), ...(component ? cssForEntry(`src/components/${component}.jsx`) : [])];
  const head = sourceShell.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<title>[\s\S]*?<\/title>[\s\S]*?(?=<meta name="viewport")/, renderSeoHead(metadata));
  const styleLinks = [...new Set(css)].map(file => `<link rel="stylesheet" href="/${file}">`).join("");
  const fonts = assets.filter(file => /^dm-sans-latin-(400|700)-normal-.*\.woff2$/.test(file) || (metadata.path === "/links" && /^gaegu-latin-700-normal-.*\.woff2$/.test(file)));
  const preloadFonts = fonts.map(file => `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin>`).join("");
  return `<!doctype html><html lang="${metadata.locale}" dir="${metadata.locale === "ar" ? "rtl" : "ltr"}" data-theme-mode="light" data-prerendered="true" data-public-path="${escapeHtml(path)}"><head>${head}${styleLinks}${preloadFonts}</head><body><div id="root">${body}</div></body></html>`;
}
for (const path of pages) {
  const body = await renderPublicPage(path, getPublicMetadata(path).locale);
  const file = path === "/" ? "index.html" : `${path.slice(1)}.html`;
  await mkdir(dirname(resolve(directory, file)), { recursive: true });
  await writeFile(resolve(directory, file), documentForPage(path, body));
  console.log(`Prerendered ${path}`);
}
const callback = documentForPage("/patreon-return", "").replace(' data-prerendered="true"', "");
await writeFile(resolve(directory, "patreon-return.html"), callback);
const notFound = documentForPage("/404", '<main><h1>Page not found</h1><a href="/">Return to Piyali</a></main>').replace(' data-prerendered="true"', "");
await writeFile(resolve(directory, "404.html"), notFound);
