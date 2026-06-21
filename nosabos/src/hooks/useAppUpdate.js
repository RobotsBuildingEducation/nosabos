import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function useAppUpdate() {
  useEffect(() => {
    let updateTimer;
    let activeRegistration;

    const checkForUpdate = () => {
      activeRegistration?.update().catch((error) => {
        console.warn("Failed to check for an app update:", error);
      });
    };

    registerSW({
      // Do not wait for the window load event. Returning users can otherwise
      // spend the whole session in an old app shell before the update check.
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        // Keep the active registration outside this callback so focus/online
        // events can also refresh long-lived installed PWA sessions.
        activeRegistration = registration;
        checkForUpdate();
        updateTimer = window.setInterval(
          checkForUpdate,
          UPDATE_CHECK_INTERVAL_MS,
        );
      },
    });

    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);

    return () => {
      if (updateTimer) window.clearInterval(updateTimer);
      window.removeEventListener("focus", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);
}
