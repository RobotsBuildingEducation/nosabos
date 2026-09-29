import { useEffect, useRef } from "react";
import { drawCompanionCharacter, getHealthyCompanionStage } from "../PlatePetPanel";

export default function TeamCompanionAvatar({ companion, size = 42 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, 48, 48);
    const stage = getHealthyCompanionStage();
    drawCompanionCharacter(context, 0, stage, companion.type);
  }, [companion.type]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      role="img"
      aria-label={`${companion.name || companion.type} companion`}
      style={{ width: size, height: size, imageRendering: "pixelated", flex: "none" }}
    />
  );
}
