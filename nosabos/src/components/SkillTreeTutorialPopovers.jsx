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
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  CheckIcon,
} from "@chakra-ui/icons";
import {
  RiRoadMapLine,
  RiBook2Line,
  RiStarLine,
  RiTrophyLine,
  RiFlashlightLine,
} from "react-icons/ri";
import { FaLayerGroup, FaGraduationCap } from "react-icons/fa";
import { MdOutlineSchool, MdSwipe } from "react-icons/md";
import { BsLightningCharge } from "react-icons/bs";

// Pulse animation for the popover
const pulseKeyframes = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

// Skill tree tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    icon: MdOutlineSchool,
    label: { en: "Welcome!", es: "Bienvenido!" },
    description: {
      en: "This is your learning journey! Let's take a quick tour to show you how everything works.",
      es: "Este es tu camino de aprendizaje! Hagamos un tour rápido para mostrarte cómo funciona todo.",
    },
  },
  {
    id: "lessons",
    icon: RiBook2Line,
    label: { en: "Lessons", es: "Lecciones" },
    description: {
      en: "Each circle is a lesson. Complete lessons in order to unlock the next ones. Tap on an available lesson to start learning!",
      es: "Cada círculo es una lección. Completa las lecciones en orden para desbloquear las siguientes. Toca una lección disponible para empezar a aprender!",
    },
  },
  {
    id: "units",
    icon: FaLayerGroup,
    label: { en: "Units", es: "Unidades" },
    description: {
      en: "Lessons are grouped into themed units. Each unit focuses on a specific topic like greetings, numbers, or food.",
      es: "Las lecciones están agrupadas en unidades temáticas. Cada unidad se enfoca en un tema específico como saludos, números o comida.",
    },
  },
  {
    id: "progress",
    icon: RiStarLine,
    label: { en: "XP & Progress", es: "XP y Progreso" },
    description: {
      en: "Earn XP by completing activities. Your progress bar shows how much of each level you've completed.",
      es: "Gana XP completando actividades. Tu barra de progreso muestra cuánto has completado de cada nivel.",
    },
  },
  {
    id: "levels",
    icon: FaGraduationCap,
    label: { en: "CEFR Levels", es: "Niveles CEFR" },
    description: {
      en: "Navigate between proficiency levels (A1 to C2) using the level selector at the top. Complete all lessons in a level to unlock the next!",
      es: "Navega entre niveles de competencia (A1 a C2) usando el selector de nivel arriba. Completa todas las lecciones de un nivel para desbloquear el siguiente!",
    },
  },
  {
    id: "modes",
    icon: MdSwipe,
    label: { en: "Learning Modes", es: "Modos de Aprendizaje" },
    description: {
      en: "Use the bottom bar to switch between Learning Path, Flashcards, and Conversations. Each mode offers a different way to practice!",
      es: "Usa la barra inferior para cambiar entre Ruta de Aprendizaje, Tarjetas y Conversaciones. Cada modo ofrece una forma diferente de practicar!",
    },
  },
  {
    id: "start",
    icon: BsLightningCharge,
    label: { en: "Let's Begin!", es: "Comencemos!" },
    description: {
      en: "You're all set! Tap on the first lesson to begin your language learning adventure.",
      es: "Estás listo! Toca la primera lección para comenzar tu aventura de aprendizaje de idiomas.",
    },
  },
];

export default function SkillTreeTutorialPopovers({
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
    if (currentStep < TUTORIAL_STEPS.length - 1) {
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

  const currentTutorial = TUTORIAL_STEPS[currentStep];
  if (!currentTutorial) return null;

  const Icon = currentTutorial.icon;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <>
      {/* Overlay to prevent interactions */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={999}
        onClick={(e) => e.stopPropagation()}
      />

      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1000}
        w="90%"
        maxW="400px"
      >
        <Fade in={isVisible}>
          <Box
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)"
            borderRadius="2xl"
            p={6}
            boxShadow="0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)"
            backdropFilter="blur(12px)"
            animation={`${pulseKeyframes} 2s ease-in-out infinite`}
            border="2px solid rgba(255, 255, 255, 0.2)"
          >
            <VStack spacing={4} align="center">
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
                  <Icon size={28} color="white" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {currentTutorial.label[lang]}
                </Text>
              </HStack>

              {/* Description */}
              <Text
                fontSize="md"
                color="whiteAlpha.900"
                textAlign="center"
                lineHeight="1.6"
                px={2}
              >
                {currentTutorial.description[lang]}
              </Text>

              {/* Progress dots */}
              <HStack spacing={2} mt={2}>
                {TUTORIAL_STEPS.map((_, index) => (
                  <Box
                    key={index}
                    w={index === currentStep ? "20px" : "8px"}
                    h="8px"
                    borderRadius="full"
                    bg={index === currentStep ? "white" : "whiteAlpha.400"}
                    transition="all 0.3s ease"
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
                  color="white"
                  variant="ghost"
                  _hover={{ bg: "whiteAlpha.200" }}
                  _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
                />

                <Text
                  fontSize="sm"
                  color="whiteAlpha.800"
                  minW="60px"
                  textAlign="center"
                  fontWeight="medium"
                >
                  {currentStep + 1} / {TUTORIAL_STEPS.length}
                </Text>

                {isLastStep ? (
                  <Button
                    size="md"
                    bg="white"
                    color="blue.600"
                    onClick={handleFinish}
                    px={6}
                    fontWeight="bold"
                    _hover={{
                      bg: "whiteAlpha.900",
                      transform: "translateY(-1px)",
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                  >
                    {lang === "es" ? "Comenzar" : "Get Started"}
                  </Button>
                ) : (
                  <IconButton
                    icon={<ChevronRightIcon boxSize={5} />}
                    onClick={handleNext}
                    aria-label={lang === "es" ? "Siguiente" : "Next"}
                    size="sm"
                    color="white"
                    variant="ghost"
                    _hover={{ bg: "whiteAlpha.200" }}
                  />
                )}
              </HStack>

              {/* Skip button */}
              {!isLastStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  color="whiteAlpha.700"
                  onClick={handleFinish}
                  _hover={{ color: "white", bg: "whiteAlpha.100" }}
                >
                  {lang === "es" ? "Saltar tutorial" : "Skip tutorial"}
                </Button>
              )}
            </VStack>
          </Box>
        </Fade>
      </Box>
    </>
  );
}
