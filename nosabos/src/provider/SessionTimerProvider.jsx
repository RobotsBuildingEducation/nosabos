import { useSyncExternalStore } from "react";

// Module-level store for the high-frequency "remaining seconds" value.
// Keeping this out of React state prevents parent components (App, TopBar)
// from re-rendering on every 1-second countdown tick — only subscribers do.
let remainingValue = null;
const subscribers = new Set();

export function setRemainingSeconds(value) {
  const normalized =
    value === null || value === undefined ? null : Number(value);
  if (remainingValue === normalized) return;
  remainingValue = normalized;
  subscribers.forEach((cb) => cb());
}

export function getRemainingSeconds() {
  return remainingValue;
}

function subscribe(cb) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function useSessionTimerRemaining() {
  return useSyncExternalStore(subscribe, getRemainingSeconds, () => null);
}

export function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}
