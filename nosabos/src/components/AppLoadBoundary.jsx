import { Component } from "react";
import { appUpdateCoordinator } from "../pwa/appUpdateCoordinator";

import {
  CHUNK_RELOAD_KEY,
  isChunkLoadError,
  getStaleAssetRecoveryInfo,
} from "../pwa/staleAssetRecovery";

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
    this.setState({
      error: new Error("Failed to fetch dynamically imported module"),
    });
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
