import React, { useState, useEffect } from "react";
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
import { PiUsersBold, PiPatreonLogoFill } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import { LuKey, LuKeyRound } from "react-icons/lu";
import { FaKey } from "react-icons/fa";

// Pulse animation for the popover
const pulseKeyframes = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
  100% { transform: scale(1); opacity: 1; }
`;

// Button explanations configuration
const BUTTON_EXPLANATIONS = [
  {
    id: "back",
    icon: ArrowBackIcon,
    label: { en: "Back Button", es: "Botón Atrás" },
    description: {
      en: "Returns you to the skill tree to choose another lesson",
      es: "Te regresa al árbol de habilidades para elegir otra lección",
    },
    position: 0,
  },
  {
    id: "identity",
    icon: LuKeyRound,
    label: { en: "Account Key", es: "Llave de cuenta" },
    description: {
      en: "Access your account info to install the app and access your password",
      es: "Accede a la información de tu cuenta para instalar la app y acceder a tu contraseña",
    },
    position: 1,
  },
  {
    id: "teams",
    icon: PiUsersBold,
    label: { en: "Teams", es: "Equipos" },
    description: {
      en: "Join or create study groups to learn together with friends",
      es: "Únete o crea grupos de estudio para aprender junto con amigos",
    },
    position: 2,
  },
  {
    id: "settings",
    icon: SettingsIcon,
    label: { en: "Settings", es: "Configuración" },
    description: {
      en: "Customize your learning experience, voice, and preferences",
      es: "Personaliza tu experiencia de aprendizaje, voz y preferencias",
    },
    position: 3,
  },
  {
    id: "help",
    icon: MdOutlineSupportAgent,
    label: { en: "AI Assistant", es: "Asistente IA" },
    description: {
      en: "Get instant help and answers from our AI learning assistant",
      es: "Obtén ayuda instantánea y respuestas de nuestro asistente de aprendizaje IA",
    },
    position: 4,
  },
  {
    id: "support",
    icon: PiPatreonLogoFill,
    label: { en: "Join Us", es: "Suscríbete" },
    description: {
      en: "Join us on Patreon to access more education apps and content on startups, advanced engineering, investing and business.",
      es: "Únete a nosotros en Patreon para acceder a más apps educativas y contenido sobre startups, ingeniería avanzada, inversión y negocios.",
    },
    position: 5,
  },
];

export default function TutorialActionBarPopovers({
  isActive = false,
  lang = "en",
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setIsVisible(false);
      return;
    }

    // Start showing popovers
    setIsVisible(true);
  }, [isActive]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < BUTTON_EXPLANATIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    if (onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  if (!isActive || !isVisible) return null;

  const currentButton = BUTTON_EXPLANATIONS[currentStep];
  if (!currentButton) return null;

  const Icon = currentButton.icon;
  const isChakraIcon =
    currentButton.id === "back" || currentButton.id === "settings";
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === BUTTON_EXPLANATIONS.length - 1;

  return (
    <Box
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
          bg="linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)"
          borderRadius="2xl"
          p={5}
          boxShadow="0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)"
          backdropFilter="blur(12px)"
          animation={`${pulseKeyframes} 2s ease-in-out infinite`}
        >
          <VStack spacing={3} align="center">
            {/* Icon and Label */}
            <HStack spacing={3}>
              <Box
                bg="whiteAlpha.200"
                borderRadius="xl"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isChakraIcon ? (
                  <Icon boxSize={6} color="white" />
                ) : (
                  <Icon size={24} color="white" />
                )}
              </Box>
              <Text fontSize="lg" fontWeight="bold" color="white">
                {currentButton.label[lang]}
              </Text>
            </HStack>

            {/* Description */}
            <Text
              fontSize="sm"
              color="whiteAlpha.900"
              textAlign="center"
              lineHeight="1.5"
            >
              {currentButton.description[lang]}
            </Text>

            {/* Progress dots */}
            <HStack spacing={2} mt={2}>
              {BUTTON_EXPLANATIONS.map((_, index) => (
                <Box
                  key={index}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={index === currentStep ? "white" : "whiteAlpha.400"}
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
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              />

              <Text
                fontSize="xs"
                color="whiteAlpha.800"
                minW="60px"
                textAlign="center"
              >
                {currentStep + 1} / {BUTTON_EXPLANATIONS.length}
              </Text>

              {isLastStep ? (
                <Button
                  size="sm"
                  colorScheme="whiteAlpha"
                  onClick={handleFinish}
                  px={4}
                >
                  {lang === "es" ? "Listo" : "Done"}
                </Button>
              ) : (
                <IconButton
                  icon={<ChevronRightIcon boxSize={5} />}
                  onClick={handleNext}
                  aria-label={lang === "es" ? "Siguiente" : "Next"}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                />
              )}
            </HStack>
          </VStack>

          {/* Arrow pointing down to action bar */}
          <Box
            position="absolute"
            bottom="-10px"
            left="50%"
            transform="translateX(-50%)"
            w={0}
            h={0}
            borderLeft="12px solid transparent"
            borderRight="12px solid transparent"
            borderTop="12px solid rgba(139, 92, 246, 0.95)"
          />
        </Box>
      </Fade>
    </Box>
  );
}
