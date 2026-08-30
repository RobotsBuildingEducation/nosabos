import React, { useEffect, useRef } from "react";

const INK = "#172033";
const PAPER = "#fff8e8";
const GREEN = "#177245";
const GREEN_LIGHT = "#4ca476";
const BLUE = "#3158a6";
const BLUE_LIGHT = "#7898d0";
const GOLD = "#dda62f";
const CORAL = "#c94f4f";

/**
 * Animated Dual Citizenship Planner mark.
 *
 * Two flat passport covers communicate dual citizenship while the checklist
 * makes the planning utility clear. Motion stays deliberately restrained so
 * the icon remains legible at small sizes and never reads as glossy or 3D.
 */
export default function CitizenshipIcon({ size = 114 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = performance.now();
    let raf;

    const roundedRect = (x, y, width, height, radius) => {
      const safeRadius = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + safeRadius, y);
      ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
      ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        safeRadius,
      );
      ctx.arcTo(x, y + height, x, y, safeRadius);
      ctx.arcTo(x, y, x + width, y, safeRadius);
      ctx.closePath();
    };

    const drawStar = (x, y, outerRadius, innerRadius, points = 5) => {
      ctx.beginPath();
      for (let point = 0; point < points * 2; point += 1) {
        const radius = point % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + (point * Math.PI) / points;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const drawCheck = (x, y, color = PAPER) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x + 4, y + 9);
      ctx.lineTo(x + 11, y);
      ctx.stroke();
    };

    const drawPassport = ({
      x,
      y,
      rotation,
      color,
      detail,
      symbol,
    }) => {
      const width = 86;
      const height = 124;

      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(rotation);
      ctx.translate(-width / 2, -height / 2);

      // A single hard-edged offset keeps separation without a glossy shadow.
      ctx.fillStyle = INK;
      roundedRect(6, 7, width, height, 10);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      roundedRect(0, 0, width, height, 10);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = PAPER;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2.5;
      roundedRect(8, 8, width - 16, height - 16, 6);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = PAPER;
      roundedRect(20, 18, width - 40, 5, 2.5);
      ctx.fill();

      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, 57, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = detail;
      if (symbol === "agave") {
        ctx.save();
        ctx.translate(width / 2, 59);
        [-18, -9, 0, 9, 18].forEach((degrees, index) => {
          ctx.save();
          ctx.rotate((degrees * Math.PI) / 180);
          ctx.beginPath();
          ctx.moveTo(0, 14);
          ctx.quadraticCurveTo(-7 + index * 0.4, 0, 0, -14);
          ctx.quadraticCurveTo(7 - index * 0.4, 0, 0, 14);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      } else {
        drawStar(width / 2, 57, 14, 6.2, 5);
        ctx.fill();
      }

      ctx.fillStyle = PAPER;
      roundedRect(25, 91, width - 50, 4, 2);
      ctx.fill();
      roundedRect(31, 101, width - 62, 4, 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPlanner = (checkPhase, lift = 0) => {
      const x = 48;
      const y = 157;
      const width = 160;
      const height = 65;

      ctx.save();
      ctx.translate(0, lift);

      ctx.fillStyle = INK;
      roundedRect(x + 5, y + 6, width, height, 10);
      ctx.fill();

      ctx.fillStyle = PAPER;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      roundedRect(x, y, width, height, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = CORAL;
      roundedRect(x + width - 17, y + 3, 14, height - 6, 5);
      ctx.fill();

      const rows = [
        { y: y + 15, color: GREEN, line: 76 },
        { y: y + 31, color: BLUE, line: 91 },
        { y: y + 47, color: GOLD, line: 64 },
      ];

      rows.forEach((row, index) => {
        ctx.fillStyle = row.color;
        roundedRect(x + 14, row.y, 13, 13, 3);
        ctx.fill();

        ctx.globalAlpha = reduceMotion
          ? 1
          : Math.max(0.35, Math.min(1, checkPhase - index + 0.4));
        drawCheck(x + 15, row.y + 1);
        ctx.globalAlpha = 1;

        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.72;
        roundedRect(x + 37, row.y + 4.5, row.line, 4, 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.restore();
    };

    const draw = (now) => {
      const elapsed = now - start;
      const movement = reduceMotion ? 0 : Math.sin(elapsed / 850);
      const secondaryMovement = reduceMotion
        ? 0
        : Math.sin(elapsed / 620 + 1.1);
      const routePulse = reduceMotion
        ? 0
        : (Math.sin(elapsed / 420) + 1) / 2;
      const checkPhase = reduceMotion ? 3 : (elapsed % 3000) / 760;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.scale(size / 256, size / 256);

      // A quiet route line ties the two documents together.
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = reduceMotion ? 0 : -elapsed / 55;
      ctx.beginPath();
      ctx.moveTo(74, 59);
      ctx.quadraticCurveTo(128, 27 + movement * 2.5, 183, 57);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.fillStyle = GOLD;
      [
        [74, 59],
        [183, 57],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5 + routePulse * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      drawPassport({
        x: 44 + secondaryMovement * 0.8,
        y: 50 + movement * 4.2,
        rotation: (-8 + movement * 1.7) * (Math.PI / 180),
        color: GREEN,
        detail: GREEN_LIGHT,
        symbol: "agave",
      });
      drawPassport({
        x: 126 - secondaryMovement * 0.8,
        y: 46 - movement * 4.2,
        rotation: (8 - movement * 1.7) * (Math.PI / 180),
        color: BLUE,
        detail: BLUE_LIGHT,
        symbol: "star",
      });

      drawPlanner(checkPhase, movement * 1.8 + secondaryMovement * 0.7);
      ctx.restore();
    };

    const loop = (now) => {
      draw(now);
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", userSelect: "none" }}
      aria-label="Dual Citizenship Planner"
      role="img"
    />
  );
}
