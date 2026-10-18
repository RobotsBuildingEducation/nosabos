import { useEffect, useState } from "react";
import { afterPublicPaint } from "../features/publicStartup/afterPublicPaint.js";

let rendererPromise;
function loadRenderer() {
  return rendererPromise ||= import("./VoiceOrb3D.jsx").catch((error) => {
    rendererPromise = null;
    throw error;
  });
}

// Public pages reserve the orb's space, then fetch 3D after their first paint.
export default function DeferredVoiceOrb3D({ deferUntilPageReady = false, ...props }) {
  const [Renderer, setRenderer] = useState(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => loadRenderer().then((module) => {
      if (!cancelled) setRenderer(() => module.default);
    }).catch(() => { /* Leave the reserved space empty if 3D cannot load. */ });
    const cancel = deferUntilPageReady ? afterPublicPaint(load) : undefined;
    if (!deferUntilPageReady) void load();
    return () => { cancelled = true; cancel?.(); };
  }, [deferUntilPageReady]);

  return (
    <span className={`voice-orb-next-deferred${drawn ? " is-drawn" : ""}`} aria-hidden={!drawn} inert={!drawn}>
      {Renderer && <Renderer {...props} showFallback={!deferUntilPageReady} onReady={() => setDrawn(true)} />}
    </span>
  );
}
