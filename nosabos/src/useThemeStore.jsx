import { create } from "zustand";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "./firebaseResources/firebaseResources";

export const normalizeThemeMode = (mode) =>
  mode === "light" ? "light" : "dark";

const shades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
const applyThemeColor = (color) => {
  if (typeof document === "undefined") return;
  if (color === "pink") {
    // Remove overrides so default pink values are restored
    shades.forEach((s) =>
      document.documentElement.style.removeProperty(`--chakra-colors-pink-${s}`)
    );
    document.documentElement.style.removeProperty("--chakra-colors-pink");
    return;
  }

  shades.forEach((s) => {
    document.documentElement.style.setProperty(
      `--chakra-colors-pink-${s}`,
      `var(--chakra-colors-${color}-${s})`
    );
  });
  document.documentElement.style.setProperty(
    "--chakra-colors-pink",
    `var(--chakra-colors-${color})`
  );
};

// Track recent user interaction so we only animate the theme switch when
// it is user-initiated (not on app load or async Firebase hydration).
let lastInteractionAt = 0;
const INTERACTION_WINDOW_MS = 600;
if (typeof window !== "undefined") {
  const markInteraction = () => {
    lastInteractionAt = Date.now();
  };
  window.addEventListener("pointerdown", markInteraction, true);
  window.addEventListener("keydown", markInteraction, true);
}

const writeThemeMode = (normalized) => {
  document.documentElement.dataset.themeMode = normalized;
  document.documentElement.style.colorScheme = normalized;
  if (document.body) {
    document.body.dataset.themeMode = normalized;
  }
};

// Background colors per theme, used to paint the overlay wipe without
// needing to snapshot the DOM.
const THEME_OVERLAY_COLOR = {
  dark: "#0b1220",
  light: "#f7f1e7",
};

export const applyThemeMode = (mode) => {
  if (typeof document === "undefined") return;
  const normalized = normalizeThemeMode(mode);
  const current = document.documentElement.dataset.themeMode;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const userInitiated =
    Date.now() - lastInteractionAt < INTERACTION_WINDOW_MS;

  if (
    current === normalized ||
    prefersReduced ||
    !userInitiated ||
    typeof document.body === "undefined" ||
    !document.body
  ) {
    writeThemeMode(normalized);
    return;
  }

  // Remove any in-flight overlay before starting a new one.
  document
    .querySelectorAll(".theme-swap-overlay")
    .forEach((node) => node.remove());

  const overlay = document.createElement("div");
  overlay.className = "theme-swap-overlay";
  overlay.style.backgroundColor = THEME_OVERLAY_COLOR[normalized];
  document.body.appendChild(overlay);

  // Force a reflow so the starting keyframe values are registered before
  // we kick off the animation.
  // eslint-disable-next-line no-unused-expressions
  overlay.offsetWidth;
  overlay.classList.add("theme-swap-overlay--active");

  // Total animation is 1200ms. The overlay reaches full coverage and
  // peak blur/opacity by 70% (840ms). We swap the live theme then so
  // the DOM beneath the overlay is already the new theme before the
  // overlay fades out — no color flip is ever visible.
  const SWAP_AT = 840;
  const TOTAL = 1200;

  const swapTimer = window.setTimeout(() => {
    writeThemeMode(normalized);
  }, SWAP_AT);

  const removeTimer = window.setTimeout(() => {
    overlay.remove();
  }, TOTAL + 80);

  overlay.addEventListener(
    "animationend",
    () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(removeTimer);
      // If for any reason the swap timer didn't fire yet, make sure the
      // theme actually gets applied.
      if (document.documentElement.dataset.themeMode !== normalized) {
        writeThemeMode(normalized);
      }
      overlay.remove();
    },
    { once: true }
  );
};

const getStoredThemeColor = () => {
  if (typeof window === "undefined") return "orange";
  return localStorage.getItem("themeColor") || "orange";
};

const getStoredThemeMode = () => {
  if (typeof window === "undefined") return "dark";
  return normalizeThemeMode(localStorage.getItem("themeMode"));
};

export const useThemeStore = create((set) => ({
  themeColor: getStoredThemeColor(),
  themeMode: getStoredThemeMode(),
  syncThemeMode: (mode) => {
    const normalized = normalizeThemeMode(mode);
    set({ themeMode: normalized });
    if (typeof window !== "undefined") {
      localStorage.setItem("themeMode", normalized);
    }
    applyThemeMode(normalized);
  },
  setThemeColor: async (color) => {
    set({ themeColor: color });
    if (typeof window !== "undefined") {
      localStorage.setItem("themeColor", color);
    }
    applyThemeColor(color);
    const npub =
      typeof window !== "undefined"
        ? localStorage.getItem("local_npub")
        : null;
    if (npub) {
      try {
        const userDoc = doc(database, "users", npub);
        await updateDoc(userDoc, { themeColor: color });
      } catch (e) {
        console.error("Failed to update theme", e);
      }
    }
  },
  setThemeMode: async (mode) => {
    const normalized = normalizeThemeMode(mode);
    set({ themeMode: normalized });
    if (typeof window !== "undefined") {
      localStorage.setItem("themeMode", normalized);
    }
    applyThemeMode(normalized);
    const npub =
      typeof window !== "undefined"
        ? localStorage.getItem("local_npub")
        : null;
    if (npub) {
      try {
        const userDoc = doc(database, "users", npub);
        await updateDoc(userDoc, { themeMode: normalized });
      } catch (e) {
        console.error("Failed to update theme mode", e);
      }
    }
  },
}));

// Apply saved theme on load
applyThemeColor(getStoredThemeColor());
applyThemeMode(getStoredThemeMode());
