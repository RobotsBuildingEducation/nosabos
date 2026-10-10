import { unlockPublicAudioContext } from "./utils/publicAudioContext.js";

// Paint the complete public HTML before fetching the interactive application.
// A real interaction starts loading immediately and keeps its first click.
let loading;
let ready = false;
const clicks = [];
const changes = new Map();
const root = document.getElementById("root");

function firstGesture() {
  unlockPublicAudioContext();
  document.removeEventListener("pointerdown", firstGesture, true);
  document.removeEventListener("keydown", firstGesture, true);
  void boot();
}

function captureClick(event) {
  if (ready || !(event.target instanceof Element) || event.target.closest("a[href], summary")) return;
  const target = event.target.closest('button, [role="button"], input[type="checkbox"], input[type="radio"]');
  if (!target || !root.contains(target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  clicks.push(target);
  document.documentElement.dataset.publicBooting = "true";
  void boot();
}

function captureInput(event) {
  if (ready || !root.contains(event.target) || !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
  changes.set(event.target, event.target.value);
  void boot();
}

function finishBoot() {
  if (ready) return;
  ready = true;
  document.removeEventListener("click", captureClick, true);
  document.removeEventListener("input", captureInput, true);
  delete document.documentElement.dataset.publicBooting;
  for (const [target, value] of changes) {
    if (!target.isConnected) continue;
    // React tracks the property's setter. Use the native setter to replay an
    // edit that happened before hydration, including range and select values.
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), "value")?.set;
    if (!setter) continue;
    target.value = "";
    setter.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }
  changes.clear();
  for (const target of clicks.splice(0)) if (target.isConnected) target.click();
}

function boot() {
  loading ||= import("./main.jsx").then(() => {
    if (document.documentElement.dataset.publicReady === "true") finishBoot();
  }).catch(() => {
    ready = true;
    document.removeEventListener("click", captureClick, true);
    delete document.documentElement.dataset.publicBooting;
    const notice = document.createElement("div");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "position:fixed;bottom:16px;left:16px;right:16px;padding:16px;background:#fffdf9;color:#2a2119;border:1px solid #e7dfd4;border-radius:16px;z-index:3000";
    notice.textContent = "Connection problem. Reload the page to use the interactive tools. ";
    const retry = document.createElement("button");
    retry.textContent = "Reload";
    retry.onclick = () => window.location.reload();
    notice.append(retry);
    document.body.append(notice);
  });
  return loading;
}

document.addEventListener("pointerdown", firstGesture, { capture: true, once: true });
document.addEventListener("keydown", firstGesture, { capture: true, once: true });
document.addEventListener("click", captureClick, true);
document.addEventListener("input", captureInput, true);
document.addEventListener("focusin", () => { void boot(); }, { once: true });
document.addEventListener("piyali:public-ready", finishBoot, { once: true });

const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
if (document.documentElement.dataset.prerendered !== "true" || document.documentElement.dataset.publicPath !== currentPath || localStorage.getItem("local_nsec") || navigator.serviceWorker?.controller) void boot();
else if (globalThis.PerformanceObserver?.supportedEntryTypes.includes("paint")) {
  const observer = new PerformanceObserver(entries => {
    if (entries.getEntriesByName("first-contentful-paint").length) {
      observer.disconnect();
      requestAnimationFrame(() => { void boot(); });
    }
  });
  observer.observe({ type: "paint", buffered: true });
} else {
  // Wait for initial fonts and a painted frame in browsers without Paint Timing.
  void (document.fonts?.ready || Promise.resolve()).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => { void boot(); }));
  });
}
