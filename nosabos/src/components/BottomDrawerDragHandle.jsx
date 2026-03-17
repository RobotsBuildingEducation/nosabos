import React from "react";
import { Box } from "@chakra-ui/react";

export default function BottomDrawerDragHandle({
  isDragging = false,
  ...props
}) {
  return (
    <Box
      alignItems="center"
      cursor="grab"
      display="flex"
      justifyContent="center"
      pb={2}
      pt={3}
      px={4}
      role="presentation"
      touchAction="none"
      userSelect="none"
      {...props}
    >
      <Box
        bg={isDragging ? "whiteAlpha.500" : "whiteAlpha.400"}
        borderRadius="full"
        boxShadow="0 1px 0 rgba(255,255,255,0.14)"
        h="5px"
        transition="background-color 0.18s ease"
        w="52px"
      />
    </Box>
  );
}
