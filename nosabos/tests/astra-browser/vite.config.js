import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// A separate origin with an entirely local persistence/model boundary.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    react(),
    {
      name: "astra-test-boundary",
      enforce: "pre",
      resolveId(source) {
        if (source.endsWith("/utils/llm"))
          return fileURLToPath(new URL("./llm.js", import.meta.url));
        if (source.endsWith("/firebaseResources/firebaseResources"))
          return fileURLToPath(new URL("./firebase.js", import.meta.url));
        if (source.endsWith("/utils/learningIntelligence"))
          return fileURLToPath(new URL("./service.js", import.meta.url));
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5186,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] },
  },
});
