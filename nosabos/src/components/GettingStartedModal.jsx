import React, { useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck, LuCopy, LuKeyRound } from "react-icons/lu";
import { RxExternalLink } from "react-icons/rx";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import RandomCharacter from "./RandomCharacter";

export default function GettingStartedModal({
  isOpen,
  onClose,
  onStartTutorial,
  secretKey = "",
  lang = "en",
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();
  const isEs = lang === "es";

  const handleGotIt = useCallback(() => {
    playSound(submitActionSound);
    onClose?.();
  }, [onClose, playSound]);

  const handleCopyKey = useCallback(() => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    toast({
      title: isEs ? "¡Copiada!" : "Copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  }, [secretKey, isEs, toast]);

  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={28} />,
        text: isEs ? "Abre el menú del navegador." : "Open the browser menu.",
      },
      {
        id: "step2",
        icon: <RxExternalLink size={28} />,
        text: isEs ? "Abre en el navegador." : "Open in browser.",
      },
      {
        id: "step3",
        icon: <MdOutlineFileUpload size={28} />,
        text: isEs
          ? "Elige 'Compartir' o 'Instalar'."
          : "Choose 'Share' or 'Install'.",
      },
      {
        id: "step4",
        icon: <CiSquarePlus size={28} />,
        text: isEs ? "Agregar a la pantalla de inicio." : "Add to home screen.",
      },
      {
        id: "step5",
        icon: <LuBadgeCheck size={28} />,
        text: isEs
          ? "Abre desde tu pantalla de inicio."
          : "Launch from your home screen.",
      },
    ],
    [isEs],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleGotIt}
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
              {isEs ? "Instalar como app" : "Install as app"}
            </Text>
            <Text
              fontSize="2xs"
              opacity={0.85}
              textAlign="center"
              lineHeight="1.6"
            >
              {isEs
                ? "Para la mejor experiencia, instala la app en tu dispositivo."
                : "For the best experience, install the app on your device."}
            </Text>
          </VStack>
        </Box>

        <ModalBody px={6} py={6}>
          <VStack spacing={5} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
              {installSteps.map((step, idx) => (
                <GridItem key={step.id} bg="gray.800" p={3} rounded="md">
                  <VStack spacing={1} align="center" textAlign="center">
                    <Box color="teal.200">{step.icon}</Box>
                    <Text fontSize="xs">
                      {idx + 1}. {step.text}
                    </Text>
                  </VStack>
                </GridItem>
              ))}
              {secretKey ? (
                <GridItem bg="gray.800" p={3} rounded="md">
                  <VStack spacing={1} align="center" textAlign="center">
                    <Box color="teal.200">
                      <LuKeyRound size={28} />
                    </Box>
                    <Button
                      size="xs"
                      colorScheme="teal"
                      variant="ghost"
                      onClick={handleCopyKey}
                      rightIcon={<LuCopy size={14} />}
                    >
                      <Text fontSize="xs">
                        6.{" "}
                        {isEs
                          ? "Copia la llave secreta para iniciar sesión."
                          : "Copy secret key to sign in."}
                      </Text>
                    </Button>
                  </VStack>
                </GridItem>
              ) : null}
            </Grid>

            <Button
              w="100%"
              size="lg"
              colorScheme="purple"
              onClick={handleGotIt}
              fontWeight="bold"
              rounded="xl"
              py={6}
            >
              {isEs ? "¡Entendido!" : "Got it!"}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
