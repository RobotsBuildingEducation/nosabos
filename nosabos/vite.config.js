import crypto from "node:crypto";
import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

function pwaVersionMetadataPlugin({ buildId, builtAt }) {
  const versionPayload = JSON.stringify(
    {
      buildId,
      builtAt,
    },
    null,
    2,
  );

  return {
    name: "pwa-version-metadata",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split("?")[0] : "";
        if (url === "/version.json") {
          res.setHeader("Content-Type", "application/json");
          res.end(versionPayload);
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: versionPayload,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  const buildId =
    env.VITE_BUILD_ID ||
    process.env.VITE_BUILD_ID ||
    (command === "build"
      ? `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      : "development");
  const builtAt = new Date().toISOString();

  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
      __APP_BUILT_AT__: JSON.stringify(builtAt),
    },
    server: {
      allowedHosts: [".trycloudflare.com"],
      // Never let the browser keep a Vite app shell or module response across
      // source edits. A stale HTML document can reference deleted chunks, and
      // Vite's SPA fallback then returns HTML for that JavaScript URL.
      headers: {
        "Cache-Control": "no-store",
      },
      proxy: {
        "/api/patreon": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          rewrite: (path) => `/${projectId}/us-central1/patreonAuth${path}`,
        },
      },
    },
    plugins: [
      react(),
      pwaVersionMetadataPlugin({ buildId, builtAt }),
      VitePWA({
        workbox: {
          maximumFileSizeToCacheInBytes: 10000000,
          // OAuth, API navigations, and version metadata must always reach
          // Firebase Hosting / network directly rather than the index.html fallback.
          navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/version\.json$/],
          globIgnores: ["**/version.json"],
        },
        manifest: {
          name: "Piyali",
          short_name: "Piyali",
          description: "Piyali",
          start_url: "./",
          display: "standalone",

          theme_color: "#000000",

          // Used for the app launch/splash background — not the icon background.
          background_color: "#f5ead8",

          icons: [
            {
              src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1790620701/logos_512_x_512_px_13_saxgg9.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1790620701/logos_512_x_512_px_13_saxgg9.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },

        registerType: "prompt",

        devOptions: {
          enabled: true,
        },
      }),
      visualizer({
        filename: "stats.html",
        open: true,
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  };
});
