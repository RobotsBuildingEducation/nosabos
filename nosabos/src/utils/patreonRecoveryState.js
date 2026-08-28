const RESTARTABLE_REPLACEMENT_ERRORS = new Set([
  "replacement_expired",
  "replacement_state_changed",
  "membership_not_active",
]);

export const PATREON_PASSIVE_RECHECK_TTL_MS = 16 * 60 * 60 * 1000;
export const PATREON_PENDING_RECHECK_INTERVAL_MS = 1500;

const RESTORE_MISS_KEY_PREFIX = "piyali:patreon-restore-miss:";

function browserStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function restoreMissKey(npub) {
  const normalizedNpub = String(npub || "").trim();
  return normalizedNpub ? `${RESTORE_MISS_KEY_PREFIX}${normalizedNpub}` : "";
}

export function classifyPatreonReplacementResponse(responseOk, payload = {}) {
  if (responseOk && payload.authorized) {
    return { kind: "success", error: "" };
  }
  const error = String(payload.error || "replacement_failed");
  if (RESTARTABLE_REPLACEMENT_ERRORS.has(error)) {
    return { kind: "restart", error };
  }
  return { kind: "failure", error };
}

export function createPatreonRecheckGate({
  minimumIntervalMs = PATREON_PASSIVE_RECHECK_TTL_MS,
  pendingIntervalMs = PATREON_PENDING_RECHECK_INTERVAL_MS,
  now = () => Date.now(),
} = {}) {
  let lastCheckAt = 0;
  return (
    visibilityState = "visible",
    { pending = false, lastCheckAtMs } = {},
  ) => {
    const currentTime = now();
    const requiredInterval = pending ? pendingIntervalMs : minimumIntervalMs;
    const effectiveLastCheckAt = Number.isFinite(lastCheckAtMs)
      ? lastCheckAtMs
      : lastCheckAt;
    if (
      visibilityState === "hidden" ||
      currentTime - effectiveLastCheckAt < requiredInterval
    ) {
      return false;
    }
    lastCheckAt = currentTime;
    return true;
  };
}

export function hasFreshPatreonRestoreMiss({
  npub,
  storage,
  now = Date.now(),
  ttlMs = PATREON_PASSIVE_RECHECK_TTL_MS,
} = {}) {
  const key = restoreMissKey(npub);
  const targetStorage = browserStorage(storage);
  if (!key || !targetStorage) return false;
  try {
    const recordedAtMs = Number(targetStorage.getItem(key) || 0);
    return (
      recordedAtMs > 0 &&
      now - recordedAtMs >= 0 &&
      now - recordedAtMs < ttlMs
    );
  } catch {
    return false;
  }
}

export function rememberPatreonRestoreMiss({
  npub,
  storage,
  now = Date.now(),
} = {}) {
  const key = restoreMissKey(npub);
  const targetStorage = browserStorage(storage);
  if (!key || !targetStorage) return;
  try {
    targetStorage.setItem(key, String(now));
  } catch {
    // Storage can be unavailable in restricted embedded browsers.
  }
}

export function clearPatreonRestoreMiss({ npub, storage } = {}) {
  const key = restoreMissKey(npub);
  const targetStorage = browserStorage(storage);
  if (!key || !targetStorage) return;
  try {
    targetStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted embedded browsers.
  }
}

export function shouldAttemptPatreonKeyRestore(statusPayload = {}) {
  return !(
    statusPayload.authorized ||
    statusPayload.connected ||
    statusPayload.linked ||
    statusPayload.replacementRequired ||
    statusPayload.checkoutRequired
  );
}

export function shouldHoldForInitialPatreonStatus({
  isResolved = false,
} = {}) {
  return !isResolved;
}
