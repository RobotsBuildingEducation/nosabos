import { useEffect, useMemo, useRef, useState } from "react";
import { createDeferredService } from "./deferredService.js";
import { afterPublicPaint } from "./afterPublicPaint.js";
import { loadFirebaseBackend } from "../../firebaseResources/loadBackend.js";
import { createPublicIdentityActions } from "./identityActions.js";

export function usePublicIdentity() {
  const [Runtime, setRuntime] = useState(null);
  const mounted = useRef(true);
  const [service] = useState(() => createDeferredService(async () => {
    const module = await import("./IdentityRuntime.jsx");
    if (mounted.current) setRuntime(() => module.default);
  }));
  const methods = useMemo(() => createPublicIdentityActions(service, localStorage, (work) =>
    navigator.locks ? navigator.locks.request("piyali-public-identity", work) : work()
  ), [service]);
  useEffect(() => {
    mounted.current = true;
    const cancel = afterPublicPaint(() => {
      void service.ready().catch((error) => console.warn("Could not prepare Nostr", error));
      void loadFirebaseBackend().catch((error) => console.warn("Could not prepare Firebase", error));
    });
    return () => { mounted.current = false; cancel(); };
  }, [service]);
  return { ...methods, identityRuntime: Runtime ? <Runtime publish={service.publish} /> : null };
}
