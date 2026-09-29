import { Component } from "react";
import { appUpdateCoordinator } from "../pwa/appUpdateCoordinator";

import {
  CHUNK_RELOAD_KEY,
  isChunkLoadError,
  getStaleAssetRecoveryInfo,
} from "../pwa/staleAssetRecovery";

const DEV_CHUNK_RECOVERY_KEY = "nosabos_dev_chunk_recovery_attempted";

export default class AppLoadBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      updateState: appUpdateCoordinator.getState(),
    };
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.handlePreloadError = this.handlePreloadError.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
      window.addEventListener("vite:preloadError", this.handlePreloadError);
    }
    this.unsubscribeCoordinator = appUpdateCoordinator.subscribe((nextState) => {
      this.setState({ updateState: nextState });
    });
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
      window.removeEventListener("vite:preloadError", this.handlePreloadError);
    }
    if (this.unsubscribeCoordinator) {
      this.unsubscribeCoordinator();
    }
  }

  componentDidCatch(error) {
    console.error("Unable to load Piyali:", error);
    if (isChunkLoadError(error) && import.meta.env.DEV) {
      this.recoverDevelopmentChunkFailure();
      return;
    }
    // If a chunk load failed and we are online, proactively check for an app update
    if (isChunkLoadError(error) && navigator?.onLine) {
      appUpdateCoordinator.checkForUpdate({ force: true, reason: "chunk_error" }).catch(() => {});
    }
  }

  handleOnline() {
    this.setState({ isOnline: true });
    if (this.state.error && isChunkLoadError(this.state.error)) {
      appUpdateCoordinator.checkForUpdate({ force: true, reason: "online" }).catch(() => {});
    }
  }

  handleOffline() {
    this.setState({ isOnline: false });
  }

  handlePreloadError(event) {
    console.warn("Vite preload error encountered:", event);
    const error = new Error("Failed to fetch dynamically imported module");
    this.setState({ error });
    if (import.meta.env.DEV) this.recoverDevelopmentChunkFailure();
  }

  async recoverDevelopmentChunkFailure(force = false) {
    if (typeof window === "undefined") return;

    try {
      const lastAttempt = Number(sessionStorage.getItem(DEV_CHUNK_RECOVERY_KEY)) || 0;
      if (!force && Date.now() - lastAttempt < 30_000) return;
      sessionStorage.setItem(DEV_CHUNK_RECOVERY_KEY, String(Date.now()));

      // A service worker can keep serving an old app shell even after Vite
      // has switched to its current module graph. Remove local app caches and
      // registrations, then fetch a fresh shell. This is dev-only; production
      // PWA caches and update behavior are left alone.
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      const freshUrl = new URL(window.location.href);
      freshUrl.searchParams.set("_piyali_reload", String(Date.now()));
      window.location.replace(freshUrl.href);
    } catch (error) {
      console.warn("Could not automatically recover the local app shell:", error);
    }
  }

  handleAction(actionType) {
    if (actionType === "update") {
      appUpdateCoordinator.applyUpdate();
      return;
    }

    // Bounded reload attempt tracking in sessionStorage
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "attempted");
      }
    } catch {
      // Ignore storage errors
    }

    if (typeof window !== "undefined") {
      const isStaleAsset = isChunkLoadError(this.state.error);
      if (isStaleAsset) {
        if (import.meta.env.DEV) {
          this.recoverDevelopmentChunkFailure(true);
          return;
        }
        // A normal reload can reuse a stale cached document that still points
        // at removed, hashed build assets. A unique URL forces the browser and
        // any intermediary cache to request the current app shell.
        const freshUrl = new URL(window.location.href);
        freshUrl.searchParams.set("_piyali_reload", String(Date.now()));
        window.location.replace(freshUrl.href);
        return;
      }
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    let hasAttemptedReload = false;
    try {
      if (typeof sessionStorage !== "undefined") {
        hasAttemptedReload = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "attempted";
      }
    } catch {
      hasAttemptedReload = false;
    }

    const recovery = getStaleAssetRecoveryInfo({
      error: this.state.error,
      isOnline: this.state.isOnline,
      isUpdateReady: Boolean(this.state.updateState?.isUpdateReady),
      hasAttemptedReload,
    });

    return (
      <div className="app-load-error" role="alert">
        <div className="app-load-error__card">
          <h1>{recovery.title}</h1>
          <p>{recovery.description}</p>
          <button
            type="button"
            onClick={() => this.handleAction(recovery.actionType)}
          >
            {recovery.actionLabel}
          </button>
        </div>
      </div>
    );
  }
}
