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
import { useThemeStore } from "../useThemeStore";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

export default function GettingStartedModal({
  isOpen,
  onClose,
  onStartTutorial,
  secretKey = "",
  lang = "en",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();
  const isEs = lang === "es";
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
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

  const handleGotIt = useCallback(() => {
    onClose?.();
    deferPostAction(() => {
      void playSound(submitActionSound);
    });
  }, [deferPostAction, onClose, playSound]);

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
        icon: (
          <Box mt={{ base: "-10px", md: "6px" }}>
            <RxExternalLink size={20} />
          </Box>
        ),
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
      motionPreset="none"
      returnFocusOnClose={false}
    >
      <ModalOverlay
        bg={useSharedBackdrop ? "transparent" : isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.700"}
        backdropFilter={useSharedBackdrop ? undefined : "blur(4px)"}
      />
      <ModalContent
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        border="1px solid"
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        rounded="2xl"
        shadow={isLightTheme ? APP_SHADOW : "xl"}
        overflow="hidden"
        maxW={{ base: "90%", sm: "md" }}
      >
        {/* Header gradient */}
        <Box
          bgGradient="linear(to-r, #6366F1, #8B5CF6)"
          px={6}
          py={6}
          borderBottom="1px solid"
          borderColor={isLightTheme ? "rgba(99, 102, 241, 0.18)" : "transparent"}
        >
          <VStack spacing={3} align="center">
            <RandomCharacter notSoRandomCharacter={"39"} width="64px" />
            <Text
              fontWeight="bold"
              fontSize="lg"
              textAlign="center"
              color="white"
              textShadow="0 1px 10px rgba(0,0,0,0.18)"
            >
              {isEs ? "Instalar como app" : "Install as app"}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="rgba(255,255,255,0.92)"
              textAlign="center"
              lineHeight="1.6"
              maxW="320px"
            >
              {isEs
                ? "Para la mejor experiencia, instala la app en tu dispositivo."
                : "For the best experience, install the app on your device."}
            </Text>
          </VStack>
        </Box>

        <ModalBody px={6} py={6}>
          <VStack spacing={5} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" autoRows="1fr" gap={3}>
              {installSteps.map((step, idx) => (
                <GridItem
                  key={step.id}
                  bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
                  p={3}
                  rounded="lg"
                  border="1px solid"
                  borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.08)"}
                  boxShadow={isLightTheme ? "none" : "0 8px 20px rgba(0,0,0,0.18)"}
                >
                  <VStack
                    spacing={2}
                    align="center"
                    textAlign="center"
                    h="100%"
                    justify="center"
                  >
                    <Box color={isLightTheme ? "#3d9e95" : "teal.200"}>
                      {step.icon}
                    </Box>
                    <Text
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                      lineHeight="1.5"
                      color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                    >
                      {idx + 1}. {step.text}
                    </Text>
                  </VStack>
                </GridItem>
              ))}
              {secretKey ? (
                <GridItem
                  bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
                  p={3}
                  rounded="lg"
                  border="1px solid"
                  borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.08)"}
                  boxShadow={isLightTheme ? "none" : "0 8px 20px rgba(0,0,0,0.18)"}
                  cursor="pointer"
                  onClick={handleCopyKey}
                  _hover={{
                    bg: isLightTheme ? APP_SURFACE : "gray.700",
                  }}
                >
                  <VStack
                    spacing={2}
                    align="center"
                    textAlign="center"
                    h="100%"
                    justify="center"
                  >
                    <Box color={isLightTheme ? "#3d9e95" : "teal.200"}>
                      <LuKeyRound size={28} />
                    </Box>
                    <Text
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                      lineHeight="1.5"
                      color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                    >
                      6.{" "}
                      {isEs
                        ? "Copia la llave secreta para iniciar sesión."
                        : "Copy secret key to sign in."}{" "}
                      <Box
                        as="span"
                        display="inline-block"
                        verticalAlign="middle"
                        color={isLightTheme ? APP_TEXT_SECONDARY : APP_TEXT_MUTED}
                      >
                        <LuCopy size={12} />
                      </Box>
                    </Text>
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
