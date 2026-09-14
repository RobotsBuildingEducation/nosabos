import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import net from "node:net";

const FIREBASE_SERVICES = "firestore,functions";
const FIRESTORE_PORT = 8080;
const FUNCTIONS_PORT = 5001;
const STARTUP_TIMEOUT_MS = 45_000;

const REQUIRED_PORTS = [
  { name: "Firestore Emulator", port: FIRESTORE_PORT },
  { name: "Functions Emulator", port: FUNCTIONS_PORT },
];

const javaHomes = [
  process.env.JAVA_HOME,
  "/opt/homebrew/opt/openjdk@21",
  "/usr/local/opt/openjdk@21",
  "/opt/homebrew/opt/openjdk",
  "/usr/local/opt/openjdk",
].filter(Boolean);

function hasExecutable(path) {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveJavaHome() {
  for (const javaHome of javaHomes) {
    if (hasExecutable(`${javaHome}/bin/java`)) return javaHome;
  }

  const javaCheck = spawnSync("java", ["-version"], { stdio: "ignore" });
  return javaCheck.status === 0 ? "" : null;
}

function waitForPort(port, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host: "127.0.0.1", port });

      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for local port ${port}.`));
          return;
        }
        setTimeout(tryConnect, 250);
      });
    };

    tryConnect();
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const occupiedPorts = (
  await Promise.all(
    REQUIRED_PORTS.map(async ({ name, port }) => ({
      name,
      port,
      inUse: await isPortInUse(port),
    })),
  )
).filter(({ inUse }) => inUse);

if (occupiedPorts.length > 0) {
  const conflicts = occupiedPorts
    .map(({ name, port }) => `${name} port ${port}`)
    .join(", ");
  console.error(
    `Cannot start local development because ${conflicts} ${
      occupiedPorts.length === 1 ? "is" : "are"
    } already in use. Stop the other local server and try again.`,
  );
  process.exit(1);
}

const javaHome = resolveJavaHome();
if (javaHome === null) {
  console.error(
    "Java 21 is required for the local Firestore emulator. Install OpenJDK 21 or set JAVA_HOME.",
  );
  process.exit(1);
}

const childEnv = {
  ...process.env,
  ...(javaHome ? { JAVA_HOME: javaHome } : {}),
  PATH: javaHome
    ? `${javaHome}/bin:${process.env.PATH || ""}`
    : process.env.PATH,
};

const firebase = spawn(
  "firebase",
  ["emulators:start", "--only", FIREBASE_SERVICES],
  { env: childEnv, stdio: "inherit" },
);

let vite = null;
let shuttingDown = false;
let resolveFirebaseExit;
const firebaseExit = new Promise((resolve) => {
  resolveFirebaseExit = resolve;
});

function stopChildren(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  if (vite && !vite.killed) vite.kill(signal);
  if (!firebase.killed) firebase.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopChildren(signal));
}

firebase.once("error", (error) => {
  resolveFirebaseExit({
    code: 1,
    message: `Unable to start Firebase emulators: ${error.message}`,
  });
});

firebase.once("exit", (code) => {
  if (!shuttingDown) {
    resolveFirebaseExit({
      code: code ?? 1,
      message: `Firebase emulators stopped unexpectedly (exit ${code ?? 1}).`,
    });
  }
});

try {
  const startup = await Promise.race([
    Promise.all([
      waitForPort(FIRESTORE_PORT, STARTUP_TIMEOUT_MS),
      waitForPort(FUNCTIONS_PORT, STARTUP_TIMEOUT_MS),
    ]).then(() => ({ ready: true })),
    firebaseExit.then((failure) => ({ ready: false, ...failure })),
  ]);

  if (!startup.ready) {
    throw new Error(startup.message);
  }
} catch (error) {
  console.error(error.message);
  stopChildren();
  process.exit(1);
}

vite = spawn(
  "npm",
  ["run", "dev:ui", "--", "--host", "127.0.0.1"],
  { env: childEnv, stdio: "inherit" },
);

vite.once("error", (error) => {
  console.error("Unable to start Vite:", error.message);
  stopChildren();
  process.exitCode = 1;
});

vite.once("exit", (code) => {
  stopChildren();
  process.exitCode = code || 0;
});
