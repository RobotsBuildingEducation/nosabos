const RESTARTABLE_REPLACEMENT_ERRORS = new Set([
  "replacement_expired",
  "replacement_state_changed",
  "membership_not_active",
]);

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
  minimumIntervalMs = 1500,
  now = () => Date.now(),
} = {}) {
  let lastCheckAt = 0;
  return (visibilityState = "visible") => {
    const currentTime = now();
    if (
      visibilityState === "hidden" ||
      currentTime - lastCheckAt < minimumIntervalMs
    ) {
      return false;
    }
    lastCheckAt = currentTime;
    return true;
  };
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
  isChecking = false,
} = {}) {
  return !isResolved;
}

