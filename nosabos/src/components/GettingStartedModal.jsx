import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
import { MdInstallMobile, MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck, LuCopy, LuKeyRound, LuSettings } from "react-icons/lu";
import { RxExternalLink } from "react-icons/rx";
import useSoundSettings from "../hooks/useSoundSettings";
import { submitActionSound } from "../constants/sounds";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import { t as tFn } from "../utils/translation";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

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
  secretKey = "",
  lang = "en",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();
  const ui = (key) => tFn(lang, key);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const modalBodyRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;
    const frame = window.requestAnimationFrame(() => {
      const body = modalBodyRef.current;
      if (!body) return;
      body.scrollTop = 0;
      body.scrollLeft = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

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
      title: tFn(lang, "app_install_copied"),
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  }, [secretKey, lang, toast]);

  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={22} />,
        text: tFn(lang, "app_install_step1"),
      },
      {
        id: "step2",
        icon: (
          <Box mt={{ base: "-6px", md: "2px" }}>
            <RxExternalLink size={18} />
          </Box>
        ),
        text: tFn(lang, "app_install_step2"),
      },
      {
        id: "step3",
        icon: <MdOutlineFileUpload size={22} />,
        text: tFn(lang, "app_install_step3"),
      },
      {
        id: "step4",
        icon: <CiSquarePlus size={22} />,
        // Localized template with {home}/{app} markers where the option icons render.
        text: String(tFn(lang, "app_install_step4") || "")
          .split(/(\{home\}|\{app\})/g)
          .map((part, i) =>
            part === "{home}" ? (
              <Box
                as="span"
                key={`h${i}`}
                display="inline-flex"
                alignItems="center"
                verticalAlign="middle"
              >
                <CiSquarePlus size={16} />
              </Box>
            ) : part === "{app}" ? (
              <Box
                as="span"
                key={`a${i}`}
                display="inline-flex"
                alignItems="center"
                verticalAlign="middle"
              >
                <MdInstallMobile size={16} />
              </Box>
            ) : (
              part
            ),
          ),
      },
      {
        id: "step5",
        icon: <LuBadgeCheck size={22} />,
        text: tFn(lang, "app_install_step5"),
      },
    ],
    [lang],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleGotIt}
      isCentered
      size="lg"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      motionPreset="none"
      returnFocusOnClose={false}
      autoFocus={false}
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg={useSharedBackdrop ? "transparent" : "var(--app-overlay)"}
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        border="1px solid"
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        rounded="2xl"
        shadow={isLightTheme ? APP_SHADOW : "xl"}
        overflow="hidden"
        maxH="calc(100vh - 24px)"
        maxW={{ base: "90%", sm: "md" }}
        display="flex"
        flexDirection="column"
        sx={{
          borderRadius: {
            base: "24px !important",
            md: "72px !important",
          },
          "@supports (height: 100dvh)": {
            maxHeight: "calc(100dvh - 24px)",
          },
        }}
      >
        {/* Header gradient */}
        <Box
          className="app-modal-header"
          bgGradient="linear(to-r, #6366F1, #8B5CF6)"
          px={{ base: 4, md: 5 }}
          py={{ base: 3, md: 4 }}
          borderBottom="1px solid"
          borderColor={
            isLightTheme ? "rgba(99, 102, 241, 0.18)" : "transparent"
          }
          flexShrink={0}
          sx={{
            paddingInlineStart: {
              base: "16px !important",
              md: "48px !important",
            },
            paddingInlineEnd: {
              base: "16px !important",
              md: "48px !important",
            },
            paddingTop: {
              base: "12px !important",
              md: "32px !important",
            },
            paddingBottom: {
              base: "12px !important",
              md: "32px !important",
            },
          }}
        >
          <VStack spacing={{ base: 1, md: 1.5 }} align="center">
            <RandomCharacter
              notSoRandomCharacter={"39"}
              width="40px"
              containerHeight={52}
            />
            <Text
              fontWeight="bold"
              fontSize={{ base: "sm", md: "lg" }}
              textAlign="center"
              color="white"
              textShadow="0 1px 10px rgba(0,0,0,0.18)"
            >
              {ui("app_install_title")}
            </Text>
            <Text
              fontSize={{ base: "2xs", md: "xs" }}
              fontWeight="medium"
              color="rgba(255,255,255,0.92)"
              textAlign="center"
              lineHeight="1.35"
              maxW="320px"
            >
              {ui("app_install_subtitle")}
            </Text>
          </VStack>
        </Box>

        <ModalBody
          ref={modalBodyRef}
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          minH={0}
          overflowY="auto"
          overscrollBehavior="contain"
          sx={{
            WebkitOverflowScrolling: "touch",
            paddingInlineStart: {
              base: "16px !important",
              md: "40px !important",
            },
            paddingInlineEnd: {
              base: "16px !important",
              md: "40px !important",
            },
            paddingTop: {
              base: "12px !important",
              md: "40px !important",
            },
            paddingBottom: {
              base: "12px !important",
              md: "40px !important",
            },
          }}
        >
          <VStack spacing={{ base: 2, md: 3 }} align="stretch">
            <Grid
              templateColumns="repeat(2, 1fr)"
              autoRows="1fr"
              gap={{ base: 2, md: 3 }}
            >
              {installSteps.map((step, idx) => (
                <GridItem
                  key={step.id}
                  bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
                  p={{ base: 2, sm: 3, md: 6 }}
                  rounded="md"
                  border="1px solid"
                  borderColor={
                    isLightTheme ? APP_BORDER : "rgba(255,255,255,0.08)"
                  }
                  boxShadow={
                    isLightTheme ? "none" : "0 8px 20px rgba(0,0,0,0.18)"
                  }
                >
                  <VStack
                    spacing={1}
                    align="center"
                    textAlign="center"
                    h="100%"
                    justify="center"
                  >
                    <Box color={isLightTheme ? "#3d9e95" : "teal.200"}>
                      {step.icon}
                    </Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="medium"
                      lineHeight="1.35"
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
                  p={{ base: 2, sm: 3, md: 6 }}
                  rounded="md"
                  border="1px solid"
                  borderColor={
                    isLightTheme ? APP_BORDER : "rgba(255,255,255,0.08)"
                  }
                  boxShadow={
                    isLightTheme ? "none" : "0 8px 20px rgba(0,0,0,0.18)"
                  }
                  cursor="pointer"
                  onClick={handleCopyKey}
                  _hover={{
                    bg: isLightTheme ? APP_SURFACE : "gray.700",
                  }}
                >
                  <VStack
                    spacing={1}
                    align="center"
                    textAlign="center"
                    h="100%"
                    justify="center"
                  >
                    <Box color={isLightTheme ? "#3d9e95" : "teal.200"}>
                      <LuKeyRound size={22} />
                    </Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="medium"
                      lineHeight="1.35"
                      color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                    >
                      6. {ui("app_install_step6")}{" "}
                      <Box
                        as="span"
                        display="inline-block"
                        verticalAlign="middle"
                        color={
                          isLightTheme ? APP_TEXT_SECONDARY : APP_TEXT_MUTED
                        }
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
              size="md"
              colorScheme="purple"
              onClick={handleGotIt}
              fontWeight="bold"
              rounded="lg"
              p={{ base: 3, md: 8 }}
              minH={{ base: "44px", md: "40px" }}
            >
              {ui("app_install_got_it")}
            </Button>
            <Text
              fontSize={{ base: "2xs", md: "xs" }}
              color={isLightTheme ? APP_TEXT_MUTED : "whiteAlpha.700"}
              textAlign="center"
              lineHeight="1.45"
            >
              {ui("app_install_footer_note")}{" "}
              <Box
                as="span"
                display="inline-flex"
                verticalAlign="text-bottom"
                aria-hidden="true"
              >
                <LuSettings size={12} />
              </Box>{" "}
              {ui("app_install_footer_icon_label")}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
