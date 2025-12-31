import { IconButton, useColorMode, Tooltip } from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        aria-label="Toggle color mode"
        icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        variant="ghost"
        size="md"
      />
    </Tooltip>
  );
}
