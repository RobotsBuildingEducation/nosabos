import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // check every hour

export default function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const updateServiceWorkerRef = useRef(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true);
      },
      onOfflineReady() {
        setIsOfflineReady(true);
      },
      onRegisteredSW(swUrl, registration) {
        if (!registration) return;
        const intervalId = setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL_MS);
        return () => clearInterval(intervalId);
      },
    });

    updateServiceWorkerRef.current = updateServiceWorker;
  }, []);

  const reload = useCallback(() => {
    updateServiceWorkerRef.current?.(true);
  }, []);

  return {
    needsRefresh,
    isOfflineReady,
    reload,
  };
}
