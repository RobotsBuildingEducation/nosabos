import { useLayoutEffect } from "react";

export default function BootReadyBoundary({ children, pageKey, ready = true }) {
  useLayoutEffect(() => {
    if (!ready) return;
    const tracker = window.__piyaliStartupResources;
    tracker?.beginPage(pageKey);
    tracker?.completeCode(pageKey);
    tracker?.setStep("page");
    tracker?.flushNow();
    tracker?.completeInitialLoading?.();
  }, [pageKey, ready]);

  // Suspense and the app's own readiness checks decide when content can render.
  // Progress reporting must not cover an already-rendered page to display 100%.
  return children;
}
