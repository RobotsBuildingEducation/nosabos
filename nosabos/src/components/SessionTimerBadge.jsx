import { Text } from "@chakra-ui/react";
import {
  formatTimer,
  useSessionTimerRemaining,
} from "../provider/SessionTimerProvider";
import { useThemeStore } from "../useThemeStore";

export default function SessionTimerBadge({ isRunning }) {
  const remaining = useSessionTimerRemaining();
  const themeMode = useThemeStore((s) => s.themeMode);
  if (remaining === null) return null;

  const isLightTheme = themeMode === "light";
  const timerColor = isRunning
    ? isLightTheme
      ? "#1f6f6c"
      : "teal.200"
    : isLightTheme
      ? "#6f625b"
      : "gray.300";

  return (
    <Text
      as="span"
      minW="5ch"
      textAlign="center"
      fontFamily="mono"
      fontWeight="bold"
      fontSize="2xs"
      lineHeight="1"
      color={timerColor}
      sx={{ fontVariantNumeric: "tabular-nums" }}
    >
      {formatTimer(remaining)}
    </Text>
  );
}
