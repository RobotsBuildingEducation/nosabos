import React from "react";
import { Box, HStack } from "@chakra-ui/react";

export default function AnimatedEllipsis({
  color = "blue.200",
  ariaLabel = "Loading",
}) {
  return (
    <HStack
      spacing={1.5}
      minH="24px"
      justify="center"
      role="status"
      aria-label={ariaLabel}
    >
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          w="6px"
          h="6px"
          borderRadius="full"
          bg={color}
          sx={{
            animation: `animatedEllipsisPulse 0.9s ease-in-out ${dot * 0.14}s infinite`,
            "@keyframes animatedEllipsisPulse": {
              "0%, 100%": {
                opacity: 0.28,
                transform: "translateY(0)",
              },
              "50%": {
                opacity: 1,
                transform: "translateY(-3px)",
              },
            },
          }}
        />
      ))}
    </HStack>
  );
}
