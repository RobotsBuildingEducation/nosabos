import React, { useCallback } from "react";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuBookOpen } from "react-icons/lu";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import RandomCharacter from "./RandomCharacter";

export default function GettingStartedModal({
  isOpen,
  onClose,
  onStartTutorial,
  lang = "en",
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const isEs = lang === "es";

  const handleSkip = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);

  const handleStart = useCallback(() => {
    playSound(submitActionSound);
    onStartTutorial?.();
  }, [onStartTutorial, playSound]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={true}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
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
        <Box bgGradient="linear(to-r, #6366F1, #8B5CF6)" px={6} py={6}>
          <VStack spacing={3} align="center">
            <RandomCharacter notSoRandomCharacter={"39"} width="75px" />
            <Text
              fontWeight="bold"
              fontSize="xl"
              textAlign="center"
              color="white"
            >
              {isEs
                ? "Empieza con una lección tutorial"
                : "Start with a tutorial lesson"}
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
              {isEs
                ? "Te guiaremos por cada módulo de aprendizaje — vocabulario, gramática, lectura, historias y conversación — para que sepas cómo funciona todo."
                : "We'll walk you through each learning module — vocabulary, grammar, reading, stories, and conversation — so you know how everything works."}
            </Text>

            <Text fontSize="sm" opacity={0.7} textAlign="center">
              {isEs
                ? "Solo toma un momento y ganarás tu primer XP."
                : "It only takes a moment and you'll earn your first XP."}
            </Text>

            <VStack spacing={4} pt={2}>
              <Button
                w="100%"
                size="lg"
                colorScheme="purple"
                onClick={handleStart}
                fontWeight="bold"
                rounded="xl"
                py={6}
              >
                {isEs ? "Empezar el recorrido" : "Start the tour"}
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
              >
                {isEs ? "Saltar por ahora" : "Skip for now"}
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
