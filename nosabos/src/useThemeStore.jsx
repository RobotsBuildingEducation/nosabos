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
    !document.startViewTransition ||
    prefersReduced ||
    !userInitiated
  ) {
    writeThemeMode(normalized);
    return;
  }

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const endRadius = Math.hypot(cx, cy);

  const root = document.documentElement;
  root.style.setProperty("--theme-transition-cx", `${cx}px`);
  root.style.setProperty("--theme-transition-cy", `${cy}px`);
  root.style.setProperty("--theme-transition-r", `${endRadius}px`);
  root.classList.add("theme-transitioning");

  const transition = document.startViewTransition(() => {
    writeThemeMode(normalized);
  });

  const cleanup = () => {
    root.classList.remove("theme-transitioning");
  };
  transition.finished.then(cleanup, cleanup);
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
