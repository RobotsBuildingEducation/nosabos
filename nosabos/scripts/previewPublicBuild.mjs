import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv } from "vite";
import { serveBuiltApp } from "./serveBuiltApp.mjs";

const options = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, ...parts] = value.replace(/^--/, "").split("=");
  return [key, parts.join("=")];
}));
const directory = resolve(options.dir || "dist");
const port = Number(options.port || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Use --port=4173 or another valid port.");
}
const html = await readFile(resolve(directory, "index.html"), "utf8").catch(() => "");
if (!html.includes('data-prerendered="true"')) {
  throw new Error("Run npm run build first. The public preview requires the complete production build.");
}
const localEnv = loadEnv("development", process.cwd(), "VITE_");
const appCheckDebugToken = localEnv.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || localEnv.VITE_APPCHECK_DEBUG_TOKEN;
const firebase = JSON.parse(await readFile(resolve(".firebaserc"), "utf8"));
const project = firebase.projects?.default;
if (!project || !/^[a-z][a-z0-9-]+$/.test(project)) throw new Error("Configure the default Firebase project in .firebaserc.");
const backendOrigin = `https://${project}.web.app`;
const { server, origin } = await serveBuiltApp(directory, port, { appCheckDebugToken, backendOrigin });
console.log(`Production public preview: ${origin}`);
console.log(`Build directory: ${directory}`);
console.log("Use this URL for Lighthouse. npm run dev serves the development app.");
console.log(`Firebase API routes forward to ${backendOrigin}; account actions use the live backend.`);
console.log(appCheckDebugToken
  ? "App Check: using the configured development token only in this local preview."
  : "App Check: configure a registered token in .env.development.local to test live account features locally.");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
