// src/components/RepairFocusBanner.jsx
//
// Shown at the top of a live engine (Phonics / Conversation / Tutor) when the
// Daily Quest routed a repair into it. It names the weak concept the companion
// wants warmed up, so the routed practice has a clear target, and offers a
// "skip" out. The engine itself calls completeRepairFocus() on a successful
// attempt — this banner is the visible cue, not the completion trigger.
import React from "react";
import { Box, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { RiMagicLine } from "react-icons/ri";
import { TbX } from "react-icons/tb";

import useRepairFocusStore from "../hooks/useRepairFocusStore";
import { repairCopy } from "../utils/companionMemoryCopy";
import { APP_SQUIRCLE_SHAPE } from "../theme";

export default function RepairFocusBanner({
  surface,
  appLanguage = "en",
  ...boxProps
}) {
  const focus = useRepairFocusStore((s) => s.focus);
  const clearFocus = useRepairFocusStore((s) => s.clearFocus);

  // Only show for the engine this repair was routed into.
  if (!focus || focus.surface !== surface) return null;

  const item = focus.plan?.items?.[0] || {};
  const concept = item.concept || "";
  const tip = item.summary || "";
  if (!concept) return null;

  return (
    <Box
      bg="rgba(168, 85, 247, 0.12)"
      border="1px solid"
      borderColor="rgba(168, 85, 247, 0.35)"
      borderRadius="14px"
      style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
      px={3}
      py={2.5}
      mb={3}
      mx="auto"
      w="100%"
      {...boxProps}
    >
      <HStack align="flex-start" spacing={2.5}>
        <Box
          w="26px"
          h="26px"
          borderRadius="full"
          bg="rgba(168, 85, 247, 0.2)"
          color="purple.300"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          mt="1px"
        >
          <RiMagicLine size={15} />
        </Box>
        <VStack align="stretch" spacing={0.5} flex="1" minW={0}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.06em"
            textTransform="uppercase"
            color="purple.300"
          >
            {repairCopy(appLanguage, "focusLabel")}
          </Text>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="var(--app-text-primary)"
            noOfLines={2}
          >
            {concept}
          </Text>
          {tip ? (
            <Text fontSize="xs" color="var(--app-text-secondary)" noOfLines={2}>
              {tip}
            </Text>
          ) : null}
          <Text fontSize="2xs" color="var(--app-text-muted)" mt={0.5}>
            {repairCopy(appLanguage, "focusHint")}
          </Text>
        </VStack>
        <IconButton
          aria-label={repairCopy(appLanguage, "focusExit")}
          icon={<TbX size={16} />}
          size="xs"
          variant="ghost"
          color="var(--app-text-muted)"
          onClick={clearFocus}
          flexShrink={0}
        />
      </HStack>
    </Box>
  );
}
