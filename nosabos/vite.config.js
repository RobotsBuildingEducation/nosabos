import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  return {
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
    VitePWA({
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        // OAuth and API navigations must always reach Firebase Hosting/
        // Functions. Serving index.html here strands users on the callback URL
        // before the authorization code can be exchanged.
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
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
