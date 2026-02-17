import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // check every hour

export default function useAppUpdate() {
  useEffect(() => {
    registerSW({
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL_MS);
      },
    });
  }, []);
}
