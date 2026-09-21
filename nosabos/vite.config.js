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
      proxy: {
        "/api/patreon": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          rewrite: (path) =>
            `/${projectId}/us-central1/patreonAuth${path}`,
        },
      },
    },

    plugins: [
    react(),
    pwaVersionMetadataPlugin({ buildId, builtAt }),
    VitePWA({
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5000000,
        // OAuth, API navigations, and version metadata must always reach
        // Firebase Hosting / network directly rather than the index.html fallback.
        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/version\.json$/,
          /^\/assets\//,
        ],
        globIgnores: [
          "**/version.json",
          // Exclude target language curriculum chunks from precache (loaded on demand):
          "**/assets/de-*.js",
          "**/assets/el-*.js",
          "**/assets/en-*.js",
          "**/assets/fr-*.js",
          "**/assets/ga-*.js",
          "**/assets/it-*.js",
          "**/assets/ja-*.js",
          "**/assets/nl-*.js",
          "**/assets/pl-*.js",
          "**/assets/pt-*.js",
          "**/assets/ru-*.js",
          "**/assets/alignmentOverrides-*.js",
          "**/assets/repairOverrides-*.js",
          "**/assets/skillTreeLevelBuilder-*.js",
          // Exclude CEFR level chunks (loaded on demand):
          "**/assets/pre-a1-*.js",
          "**/assets/a1-*.js",
          "**/assets/a2-*.js",
          "**/assets/b1-*.js",
          "**/assets/b2-*.js",
          "**/assets/c1-*.js",
          "**/assets/c2-*.js",
          // Exclude lazy secondary features and tabs (loaded on demand):
          "**/assets/SkillTree-*.js",
          "**/assets/AlphabetBootcamp-*.js",
          "**/assets/GrammarBook-*.js",
          "**/assets/Vocabulary-*.js",
          "**/assets/History-*.js",
          "**/assets/Stories-*.js",
          "**/assets/RealTimeTest-*.js",
          "**/assets/NotesDrawer-*.js",
          "**/assets/DailyGoalModal-*.js",
          "**/assets/DelightQuestionLab-*.js",
          "**/assets/GameRouter-*.js",
          "**/assets/legacyScenario-*.js",
          "**/assets/CitizenshipGuide-*.js",
          "**/assets/IdentityCard-*.js",
          "**/assets/LoadingMiniGame-*.js",
          "**/assets/ProficiencyTest-*.js",
          "**/assets/LinksPage-*.js",
          "**/assets/CustomizeProfileModal-*.js",
          "**/assets/LegacyLinksPage-*.js",
          "**/assets/SquirclePlayground-*.js",
          "**/assets/PatreonOAuthDrawerReturn-*.js",
          "**/assets/useBottomDrawerSwipeDismiss-*.js",
          "**/assets/LandingPage-*.js",
          "**/assets/HelpChatFab-*.js",
          "**/assets/RealWorldTasksModal-*.js",
          "**/assets/SessionTimerModal-*.js",
          "**/assets/BitcoinSupportModal-*.js",
          "**/assets/CompanionRepairModal-*.js",
          "**/assets/*Localizer-*.js",
          "**/assets/FeedbackRail-*.js",
          "**/assets/providerGenerationTimeout-*.js",
          // Exclude large image assets (sprites, character portraits) from precache:
          "**/assets/*.webp",
          "**/assets/*.png",
          "**/assets/*.jpg",
          "**/assets/*.jpeg",
        ],
        runtimeCaching: [
          {
            // On-demand JS & CSS chunks: cached when first accessed, then revalidated
            urlPattern: ({ request }) =>
              request.destination === "script" || request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "nosabos-runtime-scripts",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // On-demand images: cached on first request
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "nosabos-runtime-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts (stylesheets and woff2 font files)
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "nosabos-google-fonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cloudinary static assets (logos, mascots, badges)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "nosabos-cloudinary-assets",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "Piyali",
        short_name: "Piyali",
        start_url: "./",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        description: "PWA install handler package for Piyali",
        icons: [
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1784995553/logos_512_x_512_px_11_aqja42.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1784995553/logos_512_x_512_px_11_aqja42.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1784995553/logos_512_x_512_px_11_aqja42.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
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
