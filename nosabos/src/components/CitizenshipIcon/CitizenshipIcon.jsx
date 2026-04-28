import React, { useRef, useEffect } from "react";

/**
 * Animated canvas icon for a dual-citizenship checklist links page.
 * Loops: idle → checks fill in → APPROVED stamp drops → hold → fade → repeat.
 *
 * Usage:
 *   <CitizenshipIcon size={256} />
 *   <a href="/citizenship"><CitizenshipIcon size={128} /></a>
 */
export default function CitizenshipIcon({ size = 75 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Crisp on retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Respect reduced-motion: jump straight to "all checked + stamped" state
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = performance.now();
    let raf;

    // ---- helpers ------------------------------------------------------------
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const easeOutBack = (t) => {
      const c1 = 1.70158,
        c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // ---- back passport (navy) ----------------------------------------------
    const drawBackPassport = (bob) => {
      ctx.save();
      ctx.translate(108, 132 + bob);
      ctx.rotate((-9 * Math.PI) / 180);
      ctx.translate(-60, -80);

      // Body + shadow
      ctx.save();
      ctx.shadowColor = "rgba(26, 26, 46, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      const grad = ctx.createLinearGradient(0, 0, 120, 160);
      grad.addColorStop(0, "#2d3a5a");
      grad.addColorStop(1, "#1a2340");
      ctx.fillStyle = grad;
      roundRect(0, 0, 120, 160, 6);
      ctx.fill();
      ctx.restore();

      // Inner gold border
      ctx.strokeStyle = "rgba(212, 175, 106, 0.6)";
      ctx.lineWidth = 1;
      roundRect(8, 8, 104, 144, 3);
      ctx.stroke();

      // Crest rings
      ctx.strokeStyle = "#d4af6a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(60, 58, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(60, 58, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Star
      ctx.fillStyle = "#d4af6a";
      const star = [
        [60, 46],
        [64, 56],
        [74, 56],
        [66, 62],
        [69, 72],
        [60, 66],
        [51, 72],
        [54, 62],
        [46, 56],
        [56, 56],
      ];
      ctx.beginPath();
      ctx.moveTo(star[0][0], star[0][1]);
      for (let i = 1; i < star.length; i++) ctx.lineTo(star[i][0], star[i][1]);
      ctx.closePath();
      ctx.fill();

      // Title bars
      ctx.fillStyle = "rgba(212, 175, 106, 0.8)";
      roundRect(30, 92, 60, 3, 1);
      ctx.fill();
      ctx.fillStyle = "rgba(212, 175, 106, 0.5)";
      roundRect(40, 100, 40, 2, 1);
      ctx.fill();

      // Bottom mono lines
      ctx.fillStyle = "rgba(212, 175, 106, 0.4)";
      ctx.fillRect(20, 124, 80, 2);
      ctx.fillRect(20, 132, 60, 2);

      ctx.restore();
    };

    // ---- front passport (parchment + animated checklist) -------------------
    const drawFrontPassport = (bob, checks, stampT) => {
      ctx.save();
      ctx.translate(148, 152 + bob);
      ctx.rotate((7 * Math.PI) / 180);
      ctx.translate(-60, -80);

      // Body + shadow
      ctx.save();
      ctx.shadowColor = "rgba(26, 26, 46, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      const grad = ctx.createLinearGradient(0, 0, 120, 160);
      grad.addColorStop(0, "#f4ebd9");
      grad.addColorStop(1, "#e6d8bd");
      ctx.fillStyle = grad;
      roundRect(0, 0, 120, 160, 6);
      ctx.fill();
      ctx.restore();

      // Inner border
      ctx.strokeStyle = "rgba(26, 26, 46, 0.25)";
      ctx.lineWidth = 1;
      roundRect(6, 6, 108, 148, 3);
      ctx.stroke();

      // Checklist rows
      const rows = [
        { y: 26, lineW: 56 },
        { y: 50, lineW: 48 },
        { y: 74, lineW: 52 },
        { y: 98, lineW: 40 },
      ];

      rows.forEach((row, i) => {
        const p = checks[i];

        // Box (with a brief pop while checking)
        ctx.save();
        if (p > 0 && p < 1) {
          const pop = 1 + Math.sin(p * Math.PI) * 0.18;
          ctx.translate(25, row.y + 7);
          ctx.scale(pop, pop);
          ctx.translate(-25, -(row.y + 7));
        }
        if (p > 0) {
          ctx.fillStyle = "#1a1a2e";
          roundRect(18, row.y, 14, 14, 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "#1a1a2e";
          ctx.lineWidth = 2;
          roundRect(18, row.y, 14, 14, 2);
          ctx.stroke();
        }

        // Progressively-drawn checkmark
        if (p > 0) {
          ctx.strokeStyle = "#f4ebd9";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          const path = [
            [21, row.y + 7],
            [24, row.y + 10],
            [30, row.y + 3],
          ];
          const seg1 = Math.hypot(
            path[1][0] - path[0][0],
            path[1][1] - path[0][1],
          );
          const seg2 = Math.hypot(
            path[2][0] - path[1][0],
            path[2][1] - path[1][1],
          );
          const total = seg1 + seg2;
          const drawLen = total * p;

          ctx.beginPath();
          ctx.moveTo(path[0][0], path[0][1]);
          if (drawLen <= seg1) {
            const t = drawLen / seg1;
            ctx.lineTo(
              path[0][0] + (path[1][0] - path[0][0]) * t,
              path[0][1] + (path[1][1] - path[0][1]) * t,
            );
          } else {
            ctx.lineTo(path[1][0], path[1][1]);
            const t = (drawLen - seg1) / seg2;
            ctx.lineTo(
              path[1][0] + (path[2][0] - path[1][0]) * t,
              path[1][1] + (path[2][1] - path[1][1]) * t,
            );
          }
          ctx.stroke();
        }
        ctx.restore();

        // Line beside (deepens as the row gets checked)
        const lineAlpha = 0.45 + 0.25 * p;
        ctx.strokeStyle = `rgba(26, 26, 46, ${lineAlpha})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(40, row.y + 7);
        ctx.lineTo(40 + row.lineW, row.y + 7);
        ctx.stroke();

        // Subtle strikethrough once checked
        if (p > 0.6) {
          const sAlpha = (p - 0.6) / 0.4;
          ctx.strokeStyle = `rgba(26, 26, 46, ${0.45 * sAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, row.y + 7);
          ctx.lineTo(40 + row.lineW * sAlpha, row.y + 7);
          ctx.stroke();
        }
      });

      // APPROVED stamp — drops in with overshoot
      if (stampT > 0) {
        ctx.save();
        const eased = easeOutBack(stampT);
        const scale = 1.6 + (1 - 1.6) * eased;
        const rotation = ((-25 + 13 * eased) * Math.PI) / 180;
        const opacity = 0.85 * Math.min(1, stampT * 2);

        ctx.translate(60, 130);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        ctx.strokeStyle = "#a0322a";
        ctx.lineWidth = 2;
        roundRect(-30, -10, 60, 20, 2);
        ctx.stroke();

        // Hand-spaced text (canvas has no letter-spacing)
        ctx.fillStyle = "#a0322a";
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const text = "APPROVED";
        const spacing = 1.2;
        const widths = [...text].map((ch) => ctx.measureText(ch).width);
        const totalW =
          widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
        let x = -totalW / 2;
        [...text].forEach((ch, i) => {
          ctx.fillText(ch, x, 0);
          x += widths[i] + spacing;
        });
        ctx.restore();
      }

      ctx.restore();
    };

    // ---- frame --------------------------------------------------------------
    const draw = (now) => {
      const elapsed = now - start;
      const cycle = 6000;
      const t = elapsed % cycle;

      // Timeline: idle → 4 checks → stamp → hold → fade → loop
      const checkStarts = [400, 800, 1200, 1600];
      const checkDur = 350;
      const stampStart = 2200;
      const stampDur = 600;
      const holdEnd = 5200;

      let checks = checkStarts.map((s) =>
        Math.max(0, Math.min(1, (t - s) / checkDur)),
      );
      let stampT = Math.max(0, Math.min(1, (t - stampStart) / stampDur));

      // Reset fade at the end of the cycle
      let fade = 1;
      if (t > holdEnd) fade = 1 - (t - holdEnd) / (cycle - holdEnd);
      checks = checks.map((c) => c * fade);
      stampT = stampT * fade;

      if (reduceMotion) {
        checks = [1, 1, 1, 1];
        stampT = 1;
      }

      const bob = reduceMotion ? 0 : Math.sin(elapsed / 1000) * 1.2;

      // Clear + draw in 256-design-space, scaled to actual size
      ctx.save();
      ctx.clearRect(0, 0, size, size);
      ctx.scale(size / 256, size / 256);

      drawBackPassport(bob);
      drawFrontPassport(-bob, checks, stampT);

      ctx.restore();
    };

    const loop = (now) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block" }}
      aria-label="Dual citizenship checklist"
      role="img"
    />
  );
}
