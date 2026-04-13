import React from "react";
import { motion } from "framer-motion";
import { useThemeStore } from "../useThemeStore";

/**
 * AnimatedBackground - A beautiful animated background with gradient orbs and subtle grid
 * Used as the global background for the entire app
 */
const AnimatedBackground = () => {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLightTheme
            ? `
              radial-gradient(ellipse 85% 58% at 50% -10%, rgba(251, 191, 36, 0.18) 0%, transparent 54%),
              radial-gradient(ellipse 62% 46% at 85% 12%, rgba(249, 115, 22, 0.1) 0%, transparent 52%),
              radial-gradient(ellipse 65% 48% at 18% 82%, rgba(96, 165, 250, 0.1) 0%, transparent 44%),
              linear-gradient(to bottom, #fffdf9 0%, #f8f2e8 50%, #f3ebdf 100%)
            `
            : `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14, 165, 233, 0.1) 0%, transparent 40%),
              radial-gradient(ellipse 50% 30% at 10% 80%, rgba(167, 139, 250, 0.08) 0%, transparent 40%),
              linear-gradient(to bottom, #030712 0%, #0f172a 50%, #030712 100%)
            `,
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: isLightTheme ? [0.22, 0.34, 0.22] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: isLightTheme
            ? "radial-gradient(circle, rgba(251, 146, 60, 0.18) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: isLightTheme ? [0.16, 0.28, 0.16] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          position: "absolute",
          bottom: "20%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: isLightTheme
            ? "radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isLightTheme
            ? `
              linear-gradient(rgba(120, 96, 67, 0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(120, 96, 67, 0.045) 1px, transparent 1px)
            `
            : `
              linear-gradient(rgba(20, 184, 166, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(20, 184, 166, 0.03) 1px, transparent 1px)
            `,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isLightTheme ? 0.025 : 0.02,
          background:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
