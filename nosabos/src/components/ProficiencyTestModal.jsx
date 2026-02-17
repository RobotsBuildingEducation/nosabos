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

export default function ProficiencyTestModal({
  isOpen,
  onClose,
  onTakeTest,
  lang = "en",
  targetLangLabel = "",
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const isEs = lang === "es";

  const handleSkip = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);

  const handleTakeTest = useCallback(() => {
    playSound(submitActionSound);
    onTakeTest?.();
  }, [onTakeTest, playSound]);

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
              {isEs
                ? `¿Ya conoces algo de ${targetLangLabel || "el idioma"}?`
                : `Already know some ${targetLangLabel || "of the language"}?`}
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
                ? "Podemos tener una conversación rápida para determinar tu nivel y colocarte en el lugar correcto."
                : "We can have a quick conversation to figure out your level and place you in the right spot."}
            </Text>

            <Text fontSize="sm" opacity={0.7} textAlign="center">
              {isEs
                ? "Una charla breve de 10 intercambios — evaluaremos tu pronunciación, gramática y confianza."
                : "A short 10-exchange chat — we'll assess your pronunciation, grammar, and confidence."}
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
                {isEs ? "¡Hagámoslo!" : "Let's do it"}
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
                {isEs ? "No gracias" : "No thanks"}
              </Button>
            </VStack>

            <Text fontSize="xs" opacity={0.5} textAlign="center">
              {isEs
                ? '"No gracias" te iniciará desde el nivel principiante.'
                : '"No thanks" will start you from the beginner level.'}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
