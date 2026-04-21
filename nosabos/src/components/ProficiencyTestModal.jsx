import React, { useCallback } from "react";
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuBadgeCheck } from "react-icons/lu";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import RandomCharacter from "./RandomCharacter";
import { t as tFn } from "../utils/translation";

export default function ProficiencyTestModal({
  isOpen,
  onClose,
  onTakeTest,
  lang = "en",
  targetLangLabel = "",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const ui = (key, vars) => tFn(lang, key, vars);
  const deferPostAction = useCallback((task) => {
    if (typeof task !== "function") return;

    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        task();
      });
    });
  }, []);

  const handleSkip = useCallback(() => {
    onClose?.();
    deferPostAction(() => {
      void playSound(selectSound);
    });
  }, [deferPostAction, onClose, playSound]);

  const handleTakeTest = useCallback(() => {
    onTakeTest?.();
    deferPostAction(() => {
      void playSound(submitActionSound);
    });
  }, [deferPostAction, onTakeTest, playSound]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={true}
      motionPreset="none"
      returnFocusOnClose={false}
    >
      <ModalOverlay
        bg={useSharedBackdrop ? "transparent" : "blackAlpha.700"}
        backdropFilter={useSharedBackdrop ? undefined : "blur(4px)"}
      />
      <ModalContent
        bg="gray.900"
        color="gray.100"
        border="1px solid"
        borderColor="gray.700"
        rounded="2xl"
        shadow="xl"
        overflow="hidden"
        maxW={{ base: "90%", sm: "md" }}
      >
        {/* Header gradient */}
        <Box bgGradient="linear(to-r, cyan.400, cyan.500)" px={6} py={6}>
          <VStack spacing={3} mt={"-14"}>
            <RandomCharacter notSoRandomCharacter={"9"} width="100px" />
            {/* <Box as={LuBadgeCheck} fontSize="32px" color="white" /> */}

            <Text
              fontWeight="bold"
              fontSize="lg"
              textAlign="center"
              color="white"
            >
              {tFn(lang, "proficiency_modal_already_know", {
                lang:
                  targetLangLabel ||
                  (lang === "fr"
                    ? "cette langue"
                    : lang === "it"
                    ? "questa lingua"
                    : lang === "es"
                    ? "el idioma"
                    : "the language"),
              })}
            </Text>
          </VStack>
        </Box>

        <ModalBody px={6} py={6}>
          <VStack spacing={5} align="stretch">
            <Text
              fontSize="md"
              opacity={0.9}
              textAlign="center"
              lineHeight="1.6"
            >
              {ui("proficiency_modal_description")}
            </Text>

            <Text fontSize="sm" opacity={0.7} textAlign="center">
              {ui("proficiency_modal_exchange_info")}
            </Text>

            <VStack spacing={4} pt={2}>
              <Button
                w="100%"
                size="lg"
                colorScheme="cyan"
                onClick={handleTakeTest}
                fontWeight="bold"
                rounded="xl"
                py={6}
              >
                {ui("proficiency_modal_take_test")}
              </Button>

              <Button
                w="100%"
                size="md"
                variant="outline"
                color="gray.400"
                _hover={{ color: "gray.200", bg: "whiteAlpha.100" }}
                onClick={handleSkip}
                rounded="xl"
                py={6}
                borde
              >
                {ui("proficiency_modal_skip")}
              </Button>
            </VStack>

            <Text fontSize="xs" opacity={0.5} textAlign="center">
              {ui("proficiency_modal_skip_note")}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
