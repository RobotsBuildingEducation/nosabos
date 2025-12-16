import React from "react";
import { Box, keyframes } from "@chakra-ui/react";

const dots = keyframes`
  0% { width: 0.2em; opacity: 0.3; }
  25% { width: 0.6em; opacity: 0.6; }
  50% { width: 1em; opacity: 0.8; }
  75% { width: 1.2em; opacity: 1; }
  100% { width: 1.2em; opacity: 0.6; }
`;

export function AnimatedEllipsis(props) {
  return (
    <Box
      as="span"
      display="inline-block"
      overflow="hidden"
      whiteSpace="nowrap"
      minW="1.2em"
      animation={`${dots} 1s steps(4, end) infinite`}
      {...props}
    >
      ...
    </Box>
  );
}

export default AnimatedEllipsis;
