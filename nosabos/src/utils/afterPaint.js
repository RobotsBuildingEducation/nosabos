export function scheduleAfterNextPaint(callback, delayMs = 0) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  let cancelled = false;
  let frameId = null;
  let timeoutId = null;

  const run = () => {
    if (!cancelled) {
      callback();
    }
  };

  const scheduleTimeout = () => {
    timeoutId = window.setTimeout(run, delayMs);
  };

  if (typeof window.requestAnimationFrame === "function") {
    // RAF callbacks run before paint. A timeout scheduled from RAF lets the
    // browser commit the current interaction frame before heavier work begins.
    frameId = window.requestAnimationFrame(scheduleTimeout);
  } else {
    timeoutId = window.setTimeout(run, delayMs);
  }

  return () => {
    cancelled = true;
    if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameId);
    }
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
}
