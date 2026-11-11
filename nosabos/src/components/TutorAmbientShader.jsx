import { useEffect, useRef, useState } from "react";

let sceneModulePromise;
function loadAtmosphereSceneModule() {
  return (sceneModulePromise ||= import("./tutorAtmosphereScene.js").catch((error) => {
    sceneModulePromise = null;
    throw error;
  }));
}

export default function TutorAmbientShader({ visible, prepare = visible, isLightTheme, audioLevelRef }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const latestPropsRef = useRef({ visible, isLightTheme, audioLevelRef });
  latestPropsRef.current = { visible, isLightTheme, audioLevelRef };
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sceneRef.current && (visible || prepare)) {
      void loadAtmosphereSceneModule()
        .then(({ createTutorAtmosphereScene }) => {
          if (cancelled || sceneRef.current || !canvasRef.current) return;
          try {
            const latest = latestPropsRef.current;
            sceneRef.current = createTutorAtmosphereScene(canvasRef.current, {
              isLightTheme: latest.isLightTheme,
              audioLevelRef: latest.audioLevelRef,
              onUnavailable: () => setReady(false),
              onAvailable: () => setReady(true),
            });
            sceneRef.current?.setVisible(latest.visible);
            setReady(true);
          } catch {
            setReady(false);
          }
          // Fade in only after the first shader frame (or a confirmed fallback).
          setInitialized(true);
        })
        .catch(() => {
          if (!cancelled) {
            setReady(false);
            setInitialized(true);
          }
        });
    }
    sceneRef.current?.setTheme(isLightTheme);
    sceneRef.current?.setAudioLevelRef(audioLevelRef);
    sceneRef.current?.setVisible(visible);
    return () => {
      cancelled = true;
    };
  }, [visible, prepare, isLightTheme, audioLevelRef]);

  useEffect(() => () => { sceneRef.current?.dispose(); sceneRef.current = null; }, []);

  return (
    <div className="tutor-ambient-field" data-shader-ready={ready} data-presentation-ready={initialized}>
      <div className="tutor-ambient-fallback">
        <div className="tutor-ambient-colors" />
        <div className="tutor-ambient-colors tutor-ambient-colors-secondary" />
        <div className="tutor-ambient-grain" />
      </div>
      <canvas ref={canvasRef} className="tutor-ambient-canvas" aria-hidden="true" />
    </div>
  );
}
