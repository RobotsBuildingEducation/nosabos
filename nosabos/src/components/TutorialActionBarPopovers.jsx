import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Fade,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  ArrowBackIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { PiPath, PiUsersBold } from "react-icons/pi";
import { RiBookmarkLine, RiRoadMapLine } from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { LuKey, LuKeyRound } from "react-icons/lu";
import { FaKey } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import { useThemeStore } from "../useThemeStore";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Keep the tutorial card lively without scaling the layout box.
const glowKeyframes = keyframes`
  0%, 100% { opacity: 0.32; }
  50% { opacity: 0.58; }
`;

// Button explanations configuration - ordered left to right as they appear on skill tree
const BUTTON_EXPLANATIONS = [
  {
    id: "back",
    tutorialId: "back",
    icon: ArrowBackIcon,
    label: { en: "Back Button", es: "Botón Atrás" },
    description: {
      en: "Returns you to the skill tree to choose another lesson",
      es: "Te regresa al árbol de habilidades para elegir otra lección",
    },
    position: 0,
  },
  {
    id: "teams",
    tutorialId: "teams",
    icon: PiUsersBold,
    label: { en: "Teams", es: "Equipos" },
    description: {
      en: "Join or create study groups to learn together with friends",
      es: "Únete o crea grupos de estudio para aprender junto con amigos",
    },
    position: 1,
  },
  {
    id: "settings",
    tutorialId: "settings",
    icon: SettingsIcon,
    label: { en: "Settings", es: "Configuración" },
    description: {
      en: "Open settings and account tabs for your learning preferences, voice, and account details",
      es: "Abre las pestañas de configuración y cuenta para tus preferencias, voz y detalles de cuenta",
    },
    position: 2,
  },
  {
    id: "notes",
    tutorialId: "notes",
    icon: RiBookmarkLine,
    label: { en: "Notes", es: "Notas" },
    description: {
      en: "View your study notes. Notes can be created when you attempt or complete exercises and flashcards.",
      es: "Ve tus notas de estudio. Las notas se pueden crear cuando intentas o completas ejercicios y tarjetas de memoria.",
    },
    position: 3,
  },
  {
    id: "help",
    tutorialId: "help",
    icon: MdOutlineSupportAgent,
    label: { en: "Assistant", es: "Asistente" },
    description: {
      en: "Get instant help and answers from our learning assistant",
      es: "Obtén ayuda instantánea y respuestas de nuestro asistente de aprendizaje IA",
    },
    position: 5,
  },
  {
    id: "mode",
    tutorialId: "mode",
    icon: PiPath,
    label: { en: "Learning Mode", es: "Modo de Aprendizaje" },
    description: {
      en: "Switch between learning path, practice cards, and free conversation modes. The icon changes based on your current mode.",
      es: "Cambia entre la ruta de aprendizaje, tarjetas de práctica y modos de conversación libre. El icono cambia según tu modo actual.",
    },
    position: 6,
  },
];

export default function TutorialActionBarPopovers({
  isActive = false,
  lang = "en",
  onComplete,
  isOnSkillTree = false, // When true, skip the "back" button explanation
}) {
  // Filter out the back button when on skill tree (no back button there)
  const activeExplanations = useMemo(
    () =>
      isOnSkillTree
        ? BUTTON_EXPLANATIONS.filter((btn) => btn.id !== "back")
        : BUTTON_EXPLANATIONS,
    [isOnSkillTree],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [arrowOffset, setArrowOffset] = useState(null);
  const popoverRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  // Measure the target button and compute arrow position
  const measureArrow = useCallback(
    (step) => {
      const btn = activeExplanations[step];
      if (!btn) return;
      const el = document.querySelector(
        `[data-tutorial-id="${btn.tutorialId}"]`,
      );
      const popover = popoverRef.current;
      if (!el || !popover) return;
      const btnRect = el.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const arrowOffset = btnCenterX - popoverRect.left;
      const clamped = Math.max(
        20,
        Math.min(popoverRect.width - 20, arrowOffset),
      );
      setArrowOffset((prev) => {
        if (typeof prev === "number" && Math.abs(prev - clamped) < 0.5) {
          return prev;
        }
        return clamped;
      });
    },
    [activeExplanations],
  );

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setIsVisible(false);
      setArrowOffset(null);
      return;
    }
    setIsVisible(true);
  }, [isActive]);

  // Measure before paint so the arrow does not visibly "catch up" to each step.
  useLayoutEffect(() => {
    if (!isActive || !isVisible) return;
    measureArrow(currentStep);
    const frame = requestAnimationFrame(() => measureArrow(currentStep));

    const handleResize = () => {
      requestAnimationFrame(() => measureArrow(currentStep));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, isVisible, currentStep, measureArrow]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      playSound(selectSound);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < activeExplanations.length - 1) {
      playSound(selectSound);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = () => {
    playSound(submitActionSound);
    setIsVisible(false);

    onComplete();
  };

  if (!isActive || !isVisible) return null;

  const currentButton = activeExplanations[currentStep];
  if (!currentButton) return null;

  const Icon = currentButton.icon;
  const isChakraIcon =
    currentButton.id === "back" || currentButton.id === "settings";
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeExplanations.length - 1;
  const accentColor = isLightTheme ? "#6B6EF6" : "#8B5CF6";
  const accentGlow = isLightTheme
    ? "linear-gradient(135deg, rgba(107, 110, 246, 0.16) 0%, rgba(244, 114, 182, 0.1) 100%)"
    : "linear-gradient(135deg, rgba(34, 211, 238, 0.35) 0%, rgba(167, 139, 250, 0.28) 100%)";
  const popoverBackground = isLightTheme
    ? "linear-gradient(180deg, rgba(255, 251, 245, 0.98) 0%, rgba(247, 239, 226, 0.96) 100%)"
    : "linear-gradient(135deg, rgba(95, 51, 189, 0.95) 0%, rgba(131, 61, 244, 0.95) 100%)";
  const popoverBorder = isLightTheme ? APP_BORDER : "cyan";
  const popoverShadow = isLightTheme
    ? "0 18px 40px rgba(120, 94, 61, 0.18), 0 8px 22px rgba(107, 110, 246, 0.12)"
    : "0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)";
  const iconChipBackground = isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.200";
  const iconChipBorder = isLightTheme ? APP_BORDER : "transparent";
  const headingColor = isLightTheme ? APP_TEXT_PRIMARY : "white";
  const bodyColor = isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.900";
  const inactiveDotColor = isLightTheme ? APP_BORDER_STRONG : "whiteAlpha.400";
  const counterColor = isLightTheme ? APP_TEXT_MUTED : "whiteAlpha.800";
  const navButtonStyles = isLightTheme
    ? {
        bg: APP_SURFACE,
        color: accentColor,
        border: `1px solid ${APP_BORDER}`,
        boxShadow: "0px 3px 0px rgba(122, 94, 61, 0.22)",
        _hover: {
          bg: APP_SURFACE_ELEVATED,
          transform: "translateY(1px)",
          boxShadow: "0px 2px 0px rgba(122, 94, 61, 0.22)",
        },
        _active: {
          transform: "translateY(3px)",
          boxShadow: "0px 0px 0px rgba(122, 94, 61, 0.22)",
        },
      }
    : {
        color: "white",
        colorScheme: "purple",
      };
  const doneButtonStyles = isLightTheme
    ? {
        bg: "linear-gradient(135deg, #6B6EF6 0%, #8E73F3 100%)",
        color: "white",
        border: "none",
        boxShadow: "0px 4px 0px rgba(92, 86, 186, 0.45)",
        _hover: {
          bg: "linear-gradient(135deg, #6164ec 0%, #846ae9 100%)",
          transform: "translateY(1px)",
          boxShadow: "0px 3px 0px rgba(92, 86, 186, 0.45)",
        },
        _active: {
          transform: "translateY(4px)",
          boxShadow: "0px 0px 0px rgba(92, 86, 186, 0.45)",
        },
      }
    : {
        colorScheme: "purple",
      };

  return (
    <Box
      ref={popoverRef}
      position="fixed"
      bottom="90px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      w="90%"
      maxW="400px"
    >
      <Fade in={isVisible}>
        <Box
          position="relative"
          bg={popoverBackground}
          borderRadius="2xl"
          p={5}
          boxShadow={isLightTheme ? `${APP_SHADOW}, ${popoverShadow}` : popoverShadow}
          backdropFilter="blur(12px)"
          border={`1px solid ${popoverBorder}`}
          isolation="isolate"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-4px",
            borderRadius: "inherit",
            background: accentGlow,
            filter: isLightTheme ? "blur(22px)" : "blur(16px)",
            opacity: isLightTheme ? 0.46 : 0.32,
            zIndex: -1,
            pointerEvents: "none",
            animation: `${glowKeyframes} 2.4s ease-in-out infinite`,
          }}
        >
          <VStack spacing={3} align="center">
            {/* Icon and Label */}
            <HStack spacing={3}>
              <Box
                bg={iconChipBackground}
                border={isLightTheme ? `1px solid ${iconChipBorder}` : "none"}
                borderRadius="xl"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isChakraIcon ? (
                  <Icon boxSize={6} color={headingColor} />
                ) : (
                  <Icon size={24} color={headingColor} />
                )}
              </Box>
              <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                {currentButton.label[lang]}
              </Text>
            </HStack>

            {/* Description */}
            <Text
              fontSize="sm"
              color={bodyColor}
              textAlign="center"
              lineHeight="1.5"
            >
              {currentButton.description[lang]}
            </Text>

            {/* Progress dots */}
            <HStack spacing={2} mt={2}>
              {activeExplanations.map((_, index) => (
                <Box
                  key={index}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={index === currentStep ? accentColor : inactiveDotColor}
                  transition="background 0.3s ease"
                />
              ))}
            </HStack>

            {/* Navigation buttons */}
            <HStack spacing={3} mt={2} w="100%" justify="center">
              <IconButton
                icon={<ChevronLeftIcon boxSize={5} />}
                onClick={handlePrevious}
                isDisabled={isFirstStep}
                aria-label={lang === "es" ? "Anterior" : "Previous"}
                size="sm"
                {...navButtonStyles}
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              />

              <Text
                fontSize="xs"
                color={counterColor}
                minW="60px"
                textAlign="center"
              >
                {currentStep + 1} / {activeExplanations.length}
              </Text>

              {isLastStep ? (
                <Button
                  size="sm"
                  onClick={handleFinish}
                  px={4}
                  {...doneButtonStyles}
                >
                  {lang === "es" ? "Listo" : "Done"}
                </Button>
              ) : (
                <IconButton
                  icon={<ChevronRightIcon boxSize={5} />}
                  onClick={handleNext}
                  aria-label={lang === "es" ? "Siguiente" : "Next"}
                  size="sm"
                  {...navButtonStyles}
                />
              )}
            </HStack>
          </VStack>

          {/* Arrow pointing down to target button */}
          <Box
            position="absolute"
            bottom="-10px"
            left={arrowOffset == null ? "50%" : "0"}
            transform={
              arrowOffset == null
                ? "translateX(-12px)"
                : `translateX(${arrowOffset - 12}px)`
            }
            w={0}
            h={0}
            borderLeft="12px solid transparent"
            borderRight="12px solid transparent"
            borderTop={`12px solid ${isLightTheme ? "rgba(247, 239, 226, 0.98)" : "rgba(139, 92, 246, 0.95)"}`}
            filter={
              isLightTheme
                ? "drop-shadow(0 6px 8px rgba(120, 94, 61, 0.18))"
                : "none"
            }
            transition="transform 0.22s ease"
            willChange="transform"
          />
        </Box>
      </Fade>
    </Box>
  );
}
