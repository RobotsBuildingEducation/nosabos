import { generateSW } from "workbox-build";
import { PUBLIC_WORKBOX_OPTIONS } from "./pwaConfig.mjs";

// Recalculate HTML revisions after prerendering, preserving prompt updates.
const { count, size, warnings } = await generateSW({
  ...PUBLIC_WORKBOX_OPTIONS,
  globDirectory: "dist", globPatterns: ["**/*.{js,css,html}"], swDest: "dist/sw.js",
  navigateFallback: "/index.html", cleanupOutdatedCaches: true,
  skipWaiting: false, clientsClaim: false, mode: "production",
});
for (const warning of warnings) console.warn(warning);
console.log(`Final offline manifest: ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB`);
