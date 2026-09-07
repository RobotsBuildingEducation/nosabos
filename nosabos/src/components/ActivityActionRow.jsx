import React, { Children } from "react";
import { Box, Flex } from "@chakra-ui/react";

/** One layout for every activity: menu slot, secondary actions, then primary. */
export default function ActivityActionRow({
  primary,
  children,
  tone = "primary",
}) {
  const secondary = Children.toArray(children);
  const color =
    tone === "danger" ? "pink" : tone === "success" ? "teal" : "purple";
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
            background: `${color}.500`,
            color: "white",
            border: 0,
            boxShadow: `0 4px 0 var(--chakra-colors-${color}-800)`,
            animation: "none",
          },
          "& button:hover:not(:disabled)": {
            background: `${color}.600`,
            transform: "none",
          },
          "& button:active:not(:disabled)": {
            transform: "translateY(2px)",
            boxShadow: `0 2px 0 var(--chakra-colors-${color}-800)`,
          },
          "& button:disabled": {
            opacity: 0.55,
            boxShadow: "none",
            transform: "none",
          },
        }}
      >
        {primary}
      </Box>
    </Flex>
  );
}
