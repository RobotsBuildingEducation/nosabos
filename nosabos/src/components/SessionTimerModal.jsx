import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";

export default function SessionTimerModal({
  isOpen,
  onClose,
  minutes,
  onMinutesChange,
  onStart,
  isRunning,
  helper,
  t = {},
}) {
  const presets = [10, 15, 20, 30, 45, 60, 90, 120];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100" borderColor="gray.700">
        <ModalHeader>
          <HStack spacing={2} align="center">
            <Box as={FiClock} aria-hidden />
            <Text>{t.timer_modal_title || "Session timer"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text>
              {t.timer_modal_description ||
                "Set how long you want to focus. You can start a fresh countdown or reset the current one."}
            </Text>

            {helper}

            <FormControl>
              <FormLabel>{t.timer_modal_minutes_label || "Minutes"}</FormLabel>
              <Input
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => onMinutesChange?.(e.target.value)}
              />
            </FormControl>

            <Box>
              <Text fontSize="sm" mb={2} color="gray.300">
                {t.timer_modal_quick_picks || "Quick picks"}
              </Text>
              <HStack spacing={2} wrap="wrap">
                {presets.map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant="outline"
                    colorScheme="teal"
                    onClick={() => onMinutesChange?.(String(preset))}
                  >
                    {preset}m
                  </Button>
                ))}
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose}>
            {t.timer_modal_cancel || "Cancel"}
          </Button>
          <Button colorScheme="teal" onClick={onStart}>
            {isRunning
              ? t.timer_modal_restart || "Restart timer"
              : t.timer_modal_start || "Start timer"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
