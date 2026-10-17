import { useLayoutEffect, useState } from "react";
import LoadingProgress from "./LoadingProgress.jsx";

export default function BootReadyBoundary({ children, pageKey, ready = true }) {
  const [finishing, setFinishing] = useState(true);
  useLayoutEffect(() => {
    if (!ready) return;
    const tracker = window.__piyaliStartupResources;
    tracker?.beginPage(pageKey);
    tracker?.completeCode(pageKey);
    tracker?.setStep("page");
    tracker?.flushNow();
    setFinishing(true);
    // Paint the confirmed 100% state once, then reveal the ready page.
    let firstFrame;
    let secondFrame;
    const reveal = () => {
      if (tracker && !tracker.getSnapshot().progress?.ready) {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        firstFrame = secondFrame = undefined;
        return;
      }
      if (firstFrame !== undefined) return;
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setFinishing(false));
      });
    };
    const unsubscribe = tracker?.subscribe(reveal);
    reveal();
    return () => {
      unsubscribe?.();
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [pageKey, ready]);

  return (
    <>
      {children}
      {ready && finishing && (
        <div className="startup-loading__completion">
          <LoadingProgress />
        </div>
      )}
    </>
  );
}
