import React, { useCallback, useEffect, useRef } from "react";
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
import useSoundSettings from "../hooks/useSoundSettings";
import { submitActionSound } from "../constants/sounds";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import { t as tFn } from "../utils/translation";
import { PAPER_PENCIL_MODAL_TRANSLATIONS } from "../utils/paperPencilModalTranslations";
import paperPencilMangaArt from "../assets/paper_pencil_manga.webp";
import { APP_BUTTON_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Pre-warm the illustration off the main thread so it appears without a layout shift
if (typeof window !== "undefined" && typeof Image !== "undefined") {
  const prewarm = () => {
    const img = new Image();
    img.decoding = "async";
    img.src = paperPencilMangaArt;
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(prewarm, { timeout: 2500 });
  } else {
    setTimeout(prewarm, 1000);
  }
}

function AnimePencilSketchDisplay() {
  return (
    <Box
      as="img"
      src={paperPencilMangaArt}
      alt=""
      aria-hidden="true"
      w="100%"
      maxH={{ base: "172px", sm: "196px" }}
      objectFit="contain"
      objectPosition="center center"
      display="block"
      mx="auto"
      loading="eager"
      decoding="async"
    />
  );
}

export default function PaperPencilModal({
  isOpen,
  onClose,
  lang = "en",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const modalBodyRef = useRef(null);

  const ui = useCallback(
    (key) => {
      const translated = tFn(lang, key);
      if (translated && translated !== key) return translated;
      return (
        PAPER_PENCIL_MODAL_TRANSLATIONS[lang]?.[key] ||
        PAPER_PENCIL_MODAL_TRANSLATIONS.en[key] ||
        key
      );
    },
    [lang],
  );

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

  const handleUnderstood = useCallback(() => {
    onClose?.();
    deferPostAction(() => {
      void playSound(submitActionSound);
    });
  }, [deferPostAction, onClose, playSound]);

  const textPrimary = isLightTheme ? APP_TEXT_PRIMARY : "gray.100";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleUnderstood}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={false}
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
        color={textPrimary}
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
        {/* Teal Header */}
        <Box
          className="app-modal-header"
          bgGradient="linear(to-r, teal.400, teal.500)"
          px={{ base: 4, md: 5 }}
          py={{ base: 3, md: 4 }}
          borderBottom="1px solid"
          borderColor={
            isLightTheme ? "rgba(20, 184, 166, 0.22)" : "transparent"
          }
          flexShrink={0}
          sx={{
            paddingInlineStart: {
              base: "20px !important",
              md: "48px !important",
            },
            paddingInlineEnd: {
              base: "20px !important",
              md: "48px !important",
            },
            paddingTop: {
              base: "22px !important",
              md: "32px !important",
            },
            paddingBottom: {
              base: "22px !important",
              md: "32px !important",
            },
          }}
        >
          <VStack spacing={{ base: 1, md: 1.5 }} align="center">
            <RandomCharacter
              notSoRandomCharacter={"20"}
              width="40px"
              containerHeight={48}
            />
            <Text
              fontWeight="extrabold"
              fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
              lineHeight="1.2"
              textAlign="center"
              color="white"
              textShadow="0 1px 10px rgba(0,0,0,0.16)"
            >
              {ui("paper_pencil_title")}
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
              base: "18px !important",
              md: "40px !important",
            },
            paddingInlineEnd: {
              base: "18px !important",
              md: "40px !important",
            },
            paddingTop: {
              base: "16px !important",
              md: "32px !important",
            },
            paddingBottom: {
              base: "18px !important",
              md: "36px !important",
            },
          }}
        >
          <VStack spacing={{ base: 4, md: 5 }} align="stretch">
            <AnimePencilSketchDisplay />

            <Text
              fontSize={{ base: "xs", sm: "sm" }}
              color={textPrimary}
              textAlign="center"
              lineHeight="1.55"
              fontWeight="medium"
              px={{ base: 1, md: 2 }}
            >
              {ui("paper_pencil_message")}
            </Text>

            <Button
              w="100%"
              size="md"
              colorScheme="teal"
              bg="teal.400"
              bgGradient="linear(to-r, teal.400, teal.500)"
              color="white"
              onClick={handleUnderstood}
              fontWeight="bold"
              borderRadius={APP_BUTTON_RADIUS}
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              p={{ base: 3, md: 8 }}
              minH={{ base: "44px", md: "40px" }}
              boxShadow="0 4px 0 var(--chakra-colors-teal-600, #2C7A7B)"
              _hover={{
                bg: "teal.300",
                bgGradient: "linear(to-r, teal.300, teal.400)",
              }}
              _active={{
                bg: "teal.400",
                bgGradient: "linear(to-r, teal.400, teal.500)",
                boxShadow: "none",
                transform: "translateY(3px)",
              }}
            >
              {ui("paper_pencil_understood")}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
