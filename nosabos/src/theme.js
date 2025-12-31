// theme/duoTheme.ts
import { extendTheme, defineStyle, defineStyleConfig } from "@chakra-ui/react";
import { getColor, darken, mode } from "@chakra-ui/theme-tools";

import { menuAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

// -------------------------------------------------------
// Colors (Duolingo-ish flat palette)
// -------------------------------------------------------
const duoGreen = {
  50: "#E0FFFF",
  100: "#CCFFF7",
  200: "#A8FFF0",
  300: "#7FFFD4",
  400: "#66CDAA",
  500: "#5dade2",
  600: "#3CCB5A",
  700: "#2EB24A",
  800: "#2f7cf7",
  900: "#2f7cf7",
};

// -------------------------------------------------------
// Buttons (flat press effect by default)
// -------------------------------------------------------
const duoBase = defineStyle((props) => {
  const { theme, colorScheme = "duo" } = props;

  const bg500 =
    getColor(theme, `${colorScheme}.500`) ??
    getColor(theme, "gray.500") ??
    "#4A5568";

  const darker =
    getColor(theme, `${colorScheme}.900`) ||
    getColor(theme, `${colorScheme}.800`) ||
    darken(bg500, 20) ||
    "#1a1a1a";

  return {
    outline: "none",
    _focus: { outline: "none", boxShadow: "none" },
    _focusVisible: { outline: "none", boxShadow: "none" },

    // Flat 3D press effect
    "--button-shadow": darker,
    boxShadow: "0 4px 0 var(--button-shadow)",
    transform: "translateY(0)",
    transitionProperty: "transform, box-shadow",
    transitionDuration: "120ms",
    transitionTimingFunction: "ease",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    userSelect: "none",
    borderRadius: "lg",

    _hover: { outline: "none" },
    _active: {
      outline: "none",
      boxShadow: "none",
      transform: "translateY(4px)",
    },

    _disabled: {
      boxShadow: "none",
      transform: "none",
      opacity: 0.6,
      cursor: "not-allowed",
    },
  };
});

const duoSolid = defineStyle((props) => {
  const { theme, colorScheme = "duo" } = props;
  const bg =
    getColor(theme, `${colorScheme}.500`) ??
    getColor(theme, "gray.500") ??
    "#4A5568";

  return {
    bg,
    color: "white",
  };
});

// Minimal OUTLINE (no press effect, neutral surface)
const duoOutline = defineStyle((props) => {
  const { colorMode } = props;
  return {
    bg: mode("white", "gray.900")(props),
    color: mode("gray.800", "gray.100")(props),
    borderWidth: "1px",
    borderColor: mode("gray.300", "gray.700")(props),
    boxShadow: "none",
    transform: "none",
    _hover: { bg: mode("gray.50", "gray.800")(props) },
    _active: { bg: mode("gray.100", "gray.800")(props), boxShadow: "none", transform: "none" },
  };
});

// Minimal GHOST (fully transparent, no press effect)
const duoGhost = defineStyle((props) => ({
  bg: "transparent",
  color: mode("gray.700", "gray.100")(props),
  boxShadow: "none",
  transform: "none",
  _hover: { bg: mode("gray.100", "gray.800")(props) },
  _active: { bg: mode("gray.200", "gray.800")(props), boxShadow: "none", transform: "none" },
}));

const Button = defineStyleConfig({
  baseStyle: duoBase,
  variants: {
    // keep custom names
    duo: duoSolid,
    duoOutline,
    // map Chakra's common names so other code can safely use them
    solid: duoSolid,
    outline: duoOutline,
    ghost: duoGhost,
  },
  defaultProps: { variant: "duo", colorScheme: "duo" },
});

// IconButton inherits the same minimal options
const iconBase = defineStyle((props) => ({
  ...duoBase(props),
  borderRadius: "full",
  px: 0,
  minW: 11,
}));

const IconButton = defineStyleConfig({
  baseStyle: iconBase,
  variants: {
    duo: duoSolid,
    duoOutline,
    solid: duoSolid,
    outline: duoOutline,
    ghost: duoGhost,
  },
  defaultProps: { variant: "duo", colorScheme: "duo" },
});

// -------------------------------------------------------
// Menu (minimalist, readable, adapts to color mode)
// -------------------------------------------------------
const minimalMenu = definePartsStyle((props) => ({
  // Dropdown panel
  list: {
    bg: mode("white", "gray.900")(props),
    color: mode("gray.800", "gray.100")(props),
    border: "1px solid",
    borderColor: mode("gray.200", "gray.700")(props),
    rounded: "lg",
    boxShadow: mode("md", "none")(props),
    p: "6px",
  },

  // Items (applies to MenuItem & MenuItemOption)
  item: {
    bg: "transparent",
    color: mode("gray.800", "gray.100")(props),
    px: 3,
    py: 2,
    rounded: "md",
    _hover: { bg: mode("gray.100", "gray.800")(props) },
    _focus: { bg: mode("gray.100", "gray.800")(props) },
    _active: { bg: "teal.600", color: "white" },
    _expanded: { bg: mode("gray.100", "gray.800")(props) },
    _disabled: { opacity: 0.45, cursor: "not-allowed" },
    _checked: {
      bg: "teal.600",
      color: "white",
      _hover: { bg: "teal.600" },
      _focus: { bg: "teal.600" },
    },
  },

  groupTitle: {
    px: 3,
    py: 1.5,
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    color: "gray.400",
  },

  command: { color: "gray.400" },

  divider: { my: 1, borderColor: mode("gray.200", "gray.700")(props) },
}));

const Menu = defineMultiStyleConfig({
  variants: { minimal: minimalMenu },
  defaultProps: { variant: "minimal" },
});

// -------------------------------------------------------
// Export theme
// -------------------------------------------------------
export const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: { duo: duoGreen },
  styles: {
    global: (props) => ({
      body: {
        bg: mode("#FAFAFA", "#0b1220")(props),
        color: mode("#1F1F1F", "#e5e7eb")(props),
      },
    }),
  },
  semanticTokens: {
    colors: {
      "bg.canvas": {
        default: "#FAFAFA",
        _dark: "#0b1220",
      },
      "bg.surface": {
        default: "#FFFFFF",
        _dark: "#1a1a1a",
      },
      "bg.subtle": {
        default: "#F5F5F5",
        _dark: "#2a2a2a",
      },
      "text.primary": {
        default: "#1F1F1F",
        _dark: "#e5e7eb",
      },
      "text.secondary": {
        default: "#666666",
        _dark: "#9ca3af",
      },
      "text.muted": {
        default: "#999999",
        _dark: "#6b7280",
      },
      "border.default": {
        default: "#E5E5E5",
        _dark: "#374151",
      },
      "border.subtle": {
        default: "#F0F0F0",
        _dark: "#1f2937",
      },
    },
  },
  components: {
    Button,
    IconButton,
    Menu,
  },
  // fonts: { heading: "Nunito, system-ui, sans-serif", body: "Nunito, system-ui, sans-serif" },
});
