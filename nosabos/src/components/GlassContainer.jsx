import React, { useMemo } from "react";
import { LiquidGlass } from "@liquidglass/react";
import { Box } from "@chakra-ui/react";

/**
 * SVG filters inside backdrop-filter only work in Chromium desktop browsers.
 * Mobile Safari, Firefox, and iOS Chrome (WebKit) all ignore the SVG
 * displacement map, so LiquidGlass renders broken or invisible.
 *
 * This wrapper detects support and falls back to a clean CSS glassmorphism
 * effect on unsupported browsers.
 */
function detectChromiumDesktop() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Must have Chrome in UA but NOT be iOS (CriOS) or Android mobile
  const isChromium = /Chrome\//.test(ua) && !/Edg\//.test(ua) === false;
  const hasChrome = /Chrome\//.test(ua);
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = /Mobi|Android/.test(ua) || isIOS;
  // Firefox doesn't support SVG filters in backdrop-filter either
  const isFirefox = /Firefox\//.test(ua);
  if (isFirefox || isIOS) return false;
  // Allow Chromium desktop (Chrome, Edge, Brave, Opera, etc.)
  if (hasChrome && !isMobile) return true;
  return false;
}

const supportsLiquidGlass = detectChromiumDesktop();

export default function GlassContainer({
  children,
  className,
  blur = 0.5,
  contrast = 1.2,
  brightness = 1.05,
  saturation = 1.1,
  borderRadius = 0,
  zIndex,
  displacementScale,
  elasticity,
  fallbackBlur = "0px",
  fallbackBg = "rgba(11, 18, 32, 0.65)",
  ...rest
}) {
  const fallbackStyle = useMemo(
    () => ({
      backdropFilter: `blur(${fallbackBlur})`,
      WebkitBackdropFilter: `blur(${fallbackBlur})`,
      background: fallbackBg,
    }),
    [fallbackBlur, fallbackBg],
  );

  if (supportsLiquidGlass) {
    return (
      <LiquidGlass
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        brightness={brightness}
        saturation={saturation}
        zIndex={zIndex}
        displacementScale={displacementScale}
        elasticity={elasticity}
        className={className}
      >
        {children}
      </LiquidGlass>
    );
  }

  return (
    <Box
      className={className}
      zIndex={zIndex}
      borderRadius={
        typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius
      }
      sx={fallbackStyle}
      {...rest}
    >
      {children}
    </Box>
  );
}
