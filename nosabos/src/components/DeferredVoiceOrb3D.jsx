import { useEffect, useRef, useState } from "react";
import { afterPublicPaint } from "../features/publicStartup/afterPublicPaint.js";

let rendererPromise;
function loadRenderer() {
  return rendererPromise ||= import("./VoiceOrb3D.jsx").catch((error) => {
    rendererPromise = null;
    throw error;
  });
}

// Public pages reserve the orb's space, then fetch 3D after their first paint
// and once the orb is near the viewport so offscreen orbs never stall hero animations.
export default function DeferredVoiceOrb3D({ deferUntilPageReady = false, ...props }) {
  const hostRef = useRef(null);
  const [Renderer, setRenderer] = useState(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let observer;
    let idleTimer;
    const mountRenderer = () => loadRenderer().then((module) => {
      if (!cancelled) setRenderer(() => module.default);
    }).catch(() => { /* Leave the reserved space empty if 3D cannot load. */ });

    if (!deferUntilPageReady) {
      void mountRenderer();
      return () => { cancelled = true; };
    }

    const cancelPaint = afterPublicPaint(() => {
      if (cancelled) return;
      const node = hostRef.current;
      if (!node || typeof IntersectionObserver === "undefined") {
        void mountRenderer();
        return;
      }
      // Pre-fetch the 3D module chunk after initial entrance animations settle,
      // but only instantiate the WebGL scene once the orb approaches the viewport.
      idleTimer = window.setTimeout(() => {
        if (!cancelled) void loadRenderer().catch(() => {});
      }, 1400);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            observer?.disconnect();
            observer = null;
            void mountRenderer();
          }
        },
        { rootMargin: "320px 0px" },
      );
      observer.observe(node);
    });

    return () => {
      cancelled = true;
      cancelPaint?.();
      observer?.disconnect();
      if (idleTimer) window.clearTimeout(idleTimer);
    };
  }, [deferUntilPageReady]);

  return (
    <span ref={hostRef} className={`voice-orb-next-deferred${drawn ? " is-drawn" : ""}`} aria-hidden={!drawn} inert={!drawn}>
      {Renderer && <Renderer {...props} showFallback={!deferUntilPageReady} onReady={() => setDrawn(true)} />}
    </span>
  );
}
