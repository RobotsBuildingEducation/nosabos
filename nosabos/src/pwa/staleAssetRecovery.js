/**
 * src/pwa/staleAssetRecovery.js
 *
 * Utilities to detect stale chunk/module load failures and determine recovery actions.
 */

export const CHUNK_RELOAD_KEY = "nosabos_chunk_reload_attempt";

/**
 * Identify if an error is caused by a missing chunk / stale dynamic import.
 * @param {Error|any} error
 * @returns {boolean}
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const msg = String(error.message || error);
  return (
    /failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /loading chunk .* failed/i.test(msg) ||
    /dynamically imported module/i.test(msg)
  );
}

/**
 * Determine appropriate user recovery information based on error type, online status, and PWA update state.
 */
export function getStaleAssetRecoveryInfo({
  error,
  isOnline = typeof navigator !== "undefined" ? navigator.onLine : true,
  isUpdateReady = false,
  hasAttemptedReload = false,
}) {
  const isChunk = isChunkLoadError(error);

  if (!isChunk) {
    return {
      type: "runtime_error",
      title: "Piyali couldn't finish loading",
      description:
        "An unexpected error occurred while loading this page. Reload the page to try again.",
      actionLabel: "Reload Piyali",
      actionType: "reload",
    };
  }

  if (!isOnline) {
    return {
      type: "offline_missing_chunk",
      title: "Piyali couldn't load this content",
      description:
        "You appear to be offline. This part of Piyali hasn't been cached yet. Reconnect to the internet and try again.",
      actionLabel: "Try again",
      actionType: "reload",
    };
  }

  if (isUpdateReady) {
    return {
      type: "update_ready",
      title: "A new version of Piyali is available",
      description:
        "A recent deployment changed the application files. Update now to continue using Piyali.",
      actionLabel: "Update now",
      actionType: "update",
    };
  }

  if (!hasAttemptedReload) {
    return {
      type: "stale_chunk_first_attempt",
      title: "Piyali updated in the background",
      description:
        "A new deployment was published. Reloading will fetch the latest application files.",
      actionLabel: "Reload Piyali",
      actionType: "reload",
    };
  }

  return {
    type: "stale_chunk_persisting",
    title: "Unable to load required files",
    description:
      "Piyali couldn't fetch the latest files. Please check your connection and reload.",
    actionLabel: "Reload Piyali",
    actionType: "reload",
  };
}
