import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      workbox: {
        maximumFileSizeToCacheInBytes: 6650000, // Set to 4MB or any higher value
      },
      manifest: {
        name: "No Sabos",
        short_name: "No Sabos",
        start_url: "./",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        description: "PWA install handler package for No Sabos",
        icons: [
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1775284376/logos_512_x_512_px_6_qkqris.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1775284376/logos_512_x_512_px_6_qkqris.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1775284376/logos_512_x_512_px_6_qkqris.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
    }),
    // visualizer({
    //   filename: "dist/stats.html",
    //   open: true,
    //   template: "treemap",
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
});
