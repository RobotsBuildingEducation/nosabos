import crypto from "node:crypto";
import process from "node:process";
import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { classifyLoadingResource } from "./src/pwa/loadingActivityCopy.js";
import { buildLoadingProgressPlans } from "./src/pwa/loadingProgressPlan.js";
import { buildDevLoadingProgressPlan } from "./src/pwa/devLoadingProgressPlan.js";
import { deferStartupStyles } from "./src/pwa/startupStyles.js";
import { INITIAL_LANGUAGE_CONFIG, resolveInitialLanguage } from "./src/utils/initialLanguage.js";
import { LOADING_COPY } from "./src/pwa/loadingCopy/index.js";
import { createLoadingLocalization } from "./src/pwa/loadingLocalization.js";
import { getInitialLoadingPresentation } from "./src/utils/loadingPresentation.js";

function startupResourceTrackerPlugin() {
  let base = "/";
  return {
    name: "startup-resource-tracker",
    configResolved(config) { base = config.base; },
    configureServer(server) {
      const plans = new Map();
      server.watcher.on("change", () => plans.clear());
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://vite.local");
        if (url.pathname !== `${base}__piyali-loading-plan`) return next();
        const pageKey = url.searchParams.get("page") || "landing";
        try {
          if (!plans.has(pageKey)) plans.set(pageKey, buildDevLoadingProgressPlan(server, pageKey, base));
          const plan = await plans.get(pageKey);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(plan));
        } catch (error) {
          plans.delete(pageKey);
          server.config.logger.error(`Could not prepare loading plan: ${error.message}`);
          res.statusCode = 503;
          res.end("Loading plan unavailable");
        }
      });
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const plans = context.bundle ? buildLoadingProgressPlans(context.bundle, base) : null;
        const source = readFileSync(new URL("./src/pwa/startupResourceTracker.js", import.meta.url), "utf8")
          .replace("/* loading-activity-classifier */ (() => null)", `(${classifyLoadingResource.toString()})`)
          .replace("/* loading-progress-plan */ null", JSON.stringify(plans))
          .replace("/* loading-development-plan-url */ null", JSON.stringify(context.server ? `${base}__piyali-loading-plan` : null));
        const localeConfig = JSON.stringify({ initial: INITIAL_LANGUAGE_CONFIG, copy: LOADING_COPY,
          languageNames: { en: "English", es: "Spanish", pt: "Portuguese", it: "Italian", fr: "French", de: "German", ja: "Japanese", hi: "Hindi", ar: "Arabic", zh: "Chinese", nl: "Dutch", ru: "Russian", el: "Greek", pl: "Polish", ga: "Irish", nah: "Nahuatl", yua: "Yucatec Maya" },
        }).replaceAll("<", "\\u003c");
        const localization = `window.__piyaliStartupLocalization = (${createLoadingLocalization.toString()})(${localeConfig}, (${resolveInitialLanguage.toString()}), window);document.documentElement.lang=window.__piyaliStartupLocalization.language;document.documentElement.dir=window.__piyaliStartupLocalization.language==="ar"?"rtl":"ltr";(()=>{let authenticated=false;try{authenticated=Boolean(localStorage.getItem("local_nsec")?.trim());}catch{}document.documentElement.dataset.startupLoader=(${getInitialLoadingPresentation.toString()})(location.pathname,authenticated);})();`;
        return deferStartupStyles(html)
          .replace("<!-- startup-localization -->", `<script>${localization}</script>`)
          .replace("<!-- startup-resource-tracker -->", `<script>${source}</script>`);
      },
    },
  };
}

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
      startupResourceTrackerPlugin(),
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
              src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1790678646/logos_512_x_512_px_15_aokgri.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1790678646/logos_512_x_512_px_15_aokgri.png",
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
