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
  VStack,
} from "@chakra-ui/react";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck, LuKeyRound } from "react-icons/lu";
import useSoundSettings from "../hooks/useSoundSettings";
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

  const handleGotIt = useCallback(() => {
    playSound(submitActionSound);
    onClose?.();
  }, [onClose, playSound]);

  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={28} />,
        text: isEs
          ? "Abre el menú del navegador."
          : "Open the browser menu.",
      },
      {
        id: "step2",
        icon: <MdOutlineFileUpload size={28} />,
        text: isEs
          ? "Elige 'Compartir' o 'Instalar'."
          : "Choose 'Share' or 'Install'.",
      },
      {
        id: "step3",
        icon: <CiSquarePlus size={28} />,
        text: isEs
          ? "Agregar a la Pantalla de Inicio."
          : "Add to Home Screen.",
      },
      {
        id: "step4",
        icon: <LuBadgeCheck size={28} />,
        text: isEs
          ? "Abre desde tu Pantalla de Inicio."
          : "Launch from your Home Screen.",
      },
      {
        id: "step5",
        icon: <LuKeyRound size={24} />,
        text: isEs
          ? "Copia tu llave secreta para iniciar sesión en tu cuenta"
          : "Copy your secret key to sign into your account",
        subText: isEs
          ? "Esta llave es la única forma de acceder a tus cuentas en las apps de Robots Building Education. Guárdala en un administrador de contraseñas o en un lugar seguro. No podemos recuperarla por ti."
          : "This key is the only way to access your accounts on Robots Building Education apps. Store it in a password manager or a safe place. We cannot recover it for you.",
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
          </VStack>
        </Box>

        <ModalBody px={6} py={6}>
          <VStack spacing={5} align="stretch">
            <Text
              fontSize="sm"
              opacity={0.85}
              textAlign="center"
              lineHeight="1.6"
            >
              {isEs
                ? "Para la mejor experiencia, instala la app en tu dispositivo."
                : "For the best experience, install the app on your device."}
            </Text>

            <Grid
              templateColumns="repeat(2, 1fr)"
              gap={3}
            >
              {installSteps.map((step) => (
                <GridItem
                  key={step.id}
                  colSpan={step.subText ? 2 : 1}
                  bg="gray.800"
                  p={3}
                  rounded="md"
                >
                  <VStack spacing={1} align="center" textAlign="center">
                    <Box color="teal.200">{step.icon}</Box>
                    <Text fontSize="xs">{step.text}</Text>
                    {step.subText ? (
                      <Text fontSize="xs" color="teal.100" mt={1}>
                        {step.subText}
                      </Text>
                    ) : null}
                  </VStack>
                </GridItem>
              ))}
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
