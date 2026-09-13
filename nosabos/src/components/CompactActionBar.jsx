import React from "react";
import { createPortal } from "react-dom";
import { Box } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { APP_ACTION_BAR_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import { useThemeStore } from "../useThemeStore";
import useActionBarDimensions from "../hooks/useActionBarDimensions";
import GlassContainer from "./GlassContainer";

const MotionBox = motion.create(Box);

export default function CompactActionBar({ children, dir = "ltr" }) {
  const isLightTheme = useThemeStore((s) => s.themeMode === "light");
  const reduceMotion = useReducedMotion();
  const dimensions = useActionBarDimensions({ active: true, reduceMotion });

  return typeof document !== "undefined"
    ? createPortal(
        <Box
          data-bottom-navigation=""
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          zIndex={80}
          width="100%"
          maxW="480px"
          margin="0 auto"
          mb="max(12px, env(safe-area-inset-bottom))"
          paddingLeft={2}
          paddingRight={2}
          pointerEvents="none"
          dir={dir}
          display="flex"
          justifyContent="center"
        >
          <MotionBox
            data-action-bar-surface="compact"
            initial={false}
            pointerEvents="auto"
            mx="auto"
            borderRadius={APP_ACTION_BAR_RADIUS}
            overflow="visible"
            style={{
              cornerShape: APP_SQUIRCLE_SHAPE,
              transformOrigin: "50% 50%",
              ...dimensions,
            }}
            sx={{
              "& > .bottombar-glass": {
                position: "relative",
                height: "100%",
                width: "100%",
                borderRadius: APP_ACTION_BAR_RADIUS,
              },
            }}
          >
            <GlassContainer
              borderRadius={APP_ACTION_BAR_RADIUS}
              blur={0.5}
              contrast={1.1}
              brightness={1.05}
              saturation={1.1}
              zIndex={80}
              displacementScale={0.2}
              className="bottombar-glass"
              elasticity={0.9}
              shadowIntensity={isLightTheme ? 0.12 : 0.25}
              allowLightModeGlass
              fallbackBlur={isLightTheme ? "10px" : "2px"}
              fallbackBg={
                isLightTheme
                  ? "rgba(255, 252, 247, 0.58)"
                  : "var(--app-glass-bg-soft)"
              }
            >
              <Box
                position="absolute"
                bottom="10px"
                insetInlineStart={{
                  base: "min(11px, calc((100% - 44px) / 2))",
                  md: "min(23px, calc((100% - 44px) / 2))",
                }}
                w="44px"
                h="44px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius={APP_ACTION_BAR_RADIUS}
                style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              >
                {children}
              </Box>
            </GlassContainer>
          </MotionBox>
        </Box>,
        document.body,
      )
    : null;
}
