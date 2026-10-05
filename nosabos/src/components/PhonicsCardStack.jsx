import React from 'react';
import { Box } from '@chakra-ui/react';
import { APP_SQUIRCLE_SHAPE } from '../theme';

// Anchor the deck to the card faces, independently of the action dock's spacer.
export default function PhonicsCardStack({ count = 1, children }) {
  const layers = Math.min(Math.max(count - 1, 0), 4);
  return (
    <Box data-phonics-card-stack="" w="full" pb={`${layers * 6}px`}>
      <Box position="relative" isolation="isolate">
        {Array.from({ length: layers }, (_, index) => {
          const depth = index + 1;
          return (
            <Box key={depth} data-phonics-stack-layer="" aria-hidden="true"
              position="absolute" inset={0} zIndex={-depth} pointerEvents="none"
              bg="var(--app-surface-muted)" border="1px solid"
              borderColor="var(--app-border-strong)" borderRadius="48px"
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              transform={`translateY(${depth * 6}px) scaleX(${1 - depth * 0.018})`}
              transformOrigin="center bottom"
              boxShadow="0 3px 8px rgba(0, 0, 0, 0.06)" />
          );
        })}
        <Box data-phonics-active-card="" position="relative" zIndex={1}>{children}</Box>
      </Box>
    </Box>
  );
}
