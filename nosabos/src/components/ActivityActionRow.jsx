import React, { Children } from "react";
import { Box, Flex } from "@chakra-ui/react";

const TONE_PALETTES = {
  purple: {
    bg: "purple.500",
    hoverBg: "purple.600",
    shadow: "0 4px 0 var(--chakra-colors-purple-800, #44337A)",
    activeShadow: "0 2px 0 var(--chakra-colors-purple-800, #44337A)",
  },
  teal: {
    bg: "teal.500",
    hoverBg: "teal.600",
    shadow: "0 4px 0 var(--chakra-colors-teal-800, #234E52)",
    activeShadow: "0 2px 0 var(--chakra-colors-teal-800, #234E52)",
  },
  cyan: {
    bg: "cyan.500",
    hoverBg: "cyan.600",
    shadow: "0 4px 0 var(--chakra-colors-cyan-800, #086F83)",
    activeShadow: "0 2px 0 var(--chakra-colors-cyan-800, #086F83)",
  },
  reddit: {
    bg: "reddit.500",
    hoverBg: "reddit.600",
    shadow: "0 4px 0 var(--chakra-colors-reddit-800, #72003b)",
    activeShadow: "0 2px 0 var(--chakra-colors-reddit-800, #72003b)",
  },
  stop: {
    bg: "reddit.500",
    hoverBg: "reddit.600",
    shadow: "0 4px 0 var(--chakra-colors-reddit-800, #72003b)",
    activeShadow: "0 2px 0 var(--chakra-colors-reddit-800, #72003b)",
  },
  red: {
    bg: "red.500",
    hoverBg: "red.600",
    shadow: "0 4px 0 var(--chakra-colors-red-800, #822727)",
    activeShadow: "0 2px 0 var(--chakra-colors-red-800, #822727)",
  },
};

function inspectElement(node, fn) {
  if (!node) return false;
  if (fn(node)) return true;
  if (node.props) {
    if (node.props.leftIcon && inspectElement(node.props.leftIcon, fn)) return true;
    if (node.props.rightIcon && inspectElement(node.props.rightIcon, fn)) return true;
    if (node.props.icon && inspectElement(node.props.icon, fn)) return true;
    const children = Children.toArray(node.props.children);
    for (const child of children) {
      if (typeof child === "string" && fn(child)) return true;
      if (typeof child === "object" && inspectElement(child, fn)) return true;
    }
  }
  return false;
}

function isRecordOrSpeak(node) {
  return inspectElement(node, (el) => {
    if (typeof el === "string") {
      return /\b(record|speak)\b/i.test(el) || el.includes("🎤");
    }
    if (el && el.type) {
      const name = el.type.displayName || el.type.name || "";
      if (/mic|microphone/i.test(name)) return true;
    }
    return false;
  });
}

function isStopButton(node) {
  return inspectElement(node, (el) => {
    if (typeof el === "string") {
      return /\b(stop|disconnect|end)\b/i.test(el) || el.includes("⏹");
    }
    if (el && el.type) {
      const name = el.type.displayName || el.type.name || "";
      if (/stop/i.test(name)) return true;
    }
    return false;
  });
}

function resolveTone(tone, primary) {
  if (tone === "speak" || tone === "record" || tone === "cyan") return "cyan";
  if (tone === "stop" || tone === "reddit" || tone === "danger") return "reddit";
  if (tone === "success") return "teal";
  if (isStopButton(primary)) return "reddit";
  if (isRecordOrSpeak(primary)) return "cyan";
  if (tone === "primary") return "purple";
  return tone in TONE_PALETTES ? tone : "purple";
}

/** One layout for every activity: menu slot, secondary actions, then primary. */
export default function ActivityActionRow({
  primary,
  children,
  tone = "primary",
}) {
  const secondary = Children.toArray(children);
  const colorKey = resolveTone(tone, primary);
  const palette = TONE_PALETTES[colorKey] || TONE_PALETTES.purple;
  return (
    <Flex
      data-activity-action-row=""
      align="center"
      gap={2}
      paddingInlineStart="52px"
      minH="40px"
      w="full"
      minW={0}
      sx={{
        "& button": {
          height: "40px",
          minHeight: "40px",
          maxHeight: "40px",
          minWidth: 0,
          margin: 0,
          borderRadius: "18px",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: "1.15",
          textShadow: "none",
        },
        "& button:focus-visible": {
          outline: "2px solid var(--question-tool-accent-strong)",
          outlineOffset: "3px",
        },
      }}
    >
      {secondary.length > 0 && (
        <Flex
          data-activity-secondary=""
          gap={1}
          align="center"
          flex="0 1 auto"
          minW={0}
          maxW="48%"
          sx={{
            "& > button": {
              flex: "0 1 auto",
              minWidth: "44px",
              padding: "0 8px",
              fontSize: "14px",
              fontWeight: 600,
              background: "transparent",
              color: "var(--app-text-primary)",
              border: 0,
              boxShadow: "none",
            },
            "& > button:hover:not(:disabled)": {
              background: "var(--app-surface-muted)",
            },
          }}
        >
          {secondary}
        </Flex>
      )}
      <Box
        data-activity-primary=""
        flex="1 1 0"
        minW={0}
        sx={{
          "& button": {
            width: "100%",
            maxWidth: "none",
            padding: "0 12px",
            fontSize: "14px",
            fontWeight: 700,
            background: palette.bg,
            color: "white",
            border: 0,
            boxShadow: `${palette.shadow} !important`,
            transform: "translateY(0)",
            transitionProperty: "transform, box-shadow",
            transitionDuration: "120ms",
            transitionTimingFunction: "ease",
            animation: "none",
          },
          "& button:hover:not(:disabled)": {
            background: palette.hoverBg,
            transform: "translateY(0)",
            boxShadow: `${palette.shadow} !important`,
          },
          "& button:focus, & button[data-focus]": {
            transform: "translateY(0)",
            boxShadow: `${palette.shadow} !important`,
          },
          "& button:focus-visible": {
            outline: "2px solid var(--question-tool-accent-strong)",
            outlineOffset: "3px",
            transform: "translateY(0)",
            boxShadow: `${palette.shadow} !important`,
          },
          "& button:active:not(:disabled), & button[data-active]:not(:disabled)": {
            transform: "translateY(4px)",
            boxShadow: "none !important",
          },
          "& button:disabled": {
            opacity: 0.55,
            boxShadow: "none !important",
            transform: "none",
          },
        }}
      >
        {primary}
      </Box>
    </Flex>
  );
}
