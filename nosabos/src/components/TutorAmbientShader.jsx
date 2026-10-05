import { useEffect, useRef, useState } from "react";
import { createTutorAtmosphereScene } from "./tutorAtmosphereScene.js";

export default function TutorAmbientShader({ visible, prepare = visible, isLightTheme, audioLevelRef }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!sceneRef.current && (visible || prepare)) {
      try {
        sceneRef.current = createTutorAtmosphereScene(canvasRef.current, {
          isLightTheme,
          audioLevelRef,
          onUnavailable: () => setReady(false),
          onAvailable: () => setReady(true),
        });
        setReady(true);
      } catch {
        setReady(false);
      }
      // Fade in only after the first shader frame (or a confirmed fallback).
      setInitialized(true);
    }
    sceneRef.current?.setTheme(isLightTheme);
    sceneRef.current?.setAudioLevelRef(audioLevelRef);
    sceneRef.current?.setVisible(visible);
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
