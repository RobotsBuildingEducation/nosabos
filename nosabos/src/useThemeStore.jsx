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

let lastPointerX = null;
let lastPointerY = null;
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    },
    true
  );
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

  if (
    current === normalized ||
    !document.startViewTransition ||
    prefersReduced
  ) {
    writeThemeMode(normalized);
    return;
  }

  const x = lastPointerX ?? window.innerWidth / 2;
  const y = lastPointerY ?? window.innerHeight / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const root = document.documentElement;
  root.style.setProperty("--theme-transition-cx", `${x}px`);
  root.style.setProperty("--theme-transition-cy", `${y}px`);
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
