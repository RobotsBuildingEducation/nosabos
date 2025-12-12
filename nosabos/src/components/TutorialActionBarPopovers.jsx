import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Fade,
  keyframes,
} from "@chakra-ui/react";
import { ArrowBackIcon, SettingsIcon } from "@chakra-ui/icons";
import { FaAddressCard } from "react-icons/fa";
import { PiUsersBold, PiPatreonLogoFill } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";

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
    icon: FaAddressCard,
    label: { en: "Identity", es: "Identidad" },
    description: {
      en: "View and manage your profile and learning statistics",
      es: "Ver y gestionar tu perfil y estadísticas de aprendizaje",
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
    label: { en: "Support Us", es: "Apóyanos" },
    description: {
      en: "Support the project on Patreon to help us grow",
      es: "Apoya el proyecto en Patreon para ayudarnos a crecer",
    },
    position: 5,
  },
];

export default function TutorialActionBarPopovers({
  isActive = false,
  lang = "en",
  onComplete,
  autoAdvanceMs = 3000,
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

    // Auto-advance through all buttons
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= BUTTON_EXPLANATIONS.length) {
          clearInterval(interval);
          setIsVisible(false);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return prev;
        }
        return next;
      });
    }, autoAdvanceMs);

    return () => clearInterval(interval);
  }, [isActive, autoAdvanceMs, onComplete]);

  if (!isActive || !isVisible) return null;

  const currentButton = BUTTON_EXPLANATIONS[currentStep];
  if (!currentButton) return null;

  const Icon = currentButton.icon;
  const isChakraIcon = currentButton.id === "back" || currentButton.id === "settings";

  return (
    <Box
      position="fixed"
      bottom="90px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      w="90%"
      maxW="400px"
      pointerEvents="none"
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

            {/* Skip hint */}
            <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
              {lang === "es"
                ? `${currentStep + 1}/${BUTTON_EXPLANATIONS.length} - Avanzando automáticamente...`
                : `${currentStep + 1}/${BUTTON_EXPLANATIONS.length} - Auto-advancing...`}
            </Text>
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
