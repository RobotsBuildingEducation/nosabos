import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

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
