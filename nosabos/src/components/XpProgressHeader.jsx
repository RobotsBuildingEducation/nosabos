import React from "react";
import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import { WaveBar } from "./WaveBar";
import { useThemeStore } from "../useThemeStore";

export default function XpProgressHeader({
  levelText,
  xpText,
  progressPct,
  barProps = {},
  levelTextProps = {},
  xpBadgeProps = {},
  spacing = 2,
  mb = 1,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const resolvedXpBadgeProps = {
    textTransform: "none",
    px: 2.5,
    py: 1,
    rounded: "md",
    fontWeight: "800",
    letterSpacing: "0.02em",
    ...xpBadgeProps,
    ...(isLightTheme
      ? {
          bg: "rgba(255, 253, 249, 0.96)",
          color: "#6f5a47",
          border: "1px solid rgba(96, 77, 56, 0.16)",
          boxShadow: "0 6px 14px rgba(112, 88, 57, 0.10)",
        }
      : {
          bg: "rgba(17, 24, 39, 0.92)",
          color: "#dbe6f3",
          border: "1px solid rgba(148, 163, 184, 0.16)",
          boxShadow: "0 8px 18px rgba(3, 8, 20, 0.24)",
        }),
  };

  return (
    <Box w="100%">
      <HStack justify="space-between" align="center" mb={mb} spacing={spacing}>
        <Text
          fontSize="sm"
          fontWeight="700"
          lineHeight="1.2"
          color="var(--app-text-primary)"
          {...levelTextProps}
        >
          {levelText}
        </Text>
        <Badge variant="subtle" {...resolvedXpBadgeProps}>
          {xpText}
        </Badge>
      </HStack>
      <WaveBar value={progressPct} {...barProps} />
    </Box>
  );
}
