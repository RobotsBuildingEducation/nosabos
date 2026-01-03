import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Circle,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import {
  FaBook,
  FaGraduationCap,
  FaBookOpen,
  FaTheaterMasks,
  FaMicrophone,
} from "react-icons/fa";
import { RiBook2Line, RiPencilLine } from "react-icons/ri";
import { MdOutlineDescription } from "react-icons/md";

// Module configuration with icons, colors, and descriptions
const MODULE_CONFIG = {
  vocabulary: {
    icon: RiBook2Line,
    color: "#10B981",
    label: { en: "Vocabulary", es: "Vocabulario" },
    shortLabel: { en: "Vocab", es: "Vocab" },
    description: {
      en: "Learn new words through interactive questions.",
      es: "Aprende nuevas palabras mediante preguntas interactivas.",
    },
  },
  grammar: {
    icon: RiPencilLine,
    color: "#3B82F6",
    label: { en: "Grammar", es: "Gramática" },
    shortLabel: { en: "Grammar", es: "Gram" },
    description: {
      en: "Master grammar rules through exercises.",
      es: "Domina las reglas gramaticales mediante ejercicios.",
    },
  },
  reading: {
    icon: FaBookOpen,
    color: "#F59E0B",
    label: { en: "Reading", es: "Lectura" },
    shortLabel: { en: "Read", es: "Leer" },
    description: {
      en: "Improve your reading skills by following along with passages.",
      es: "Mejora tus habilidades de lectura siguiendo los textos.",
    },
  },
  stories: {
    icon: MdOutlineDescription,
    color: "#EC4899",
    label: { en: "Stories", es: "Historias" },
    shortLabel: { en: "Story", es: "Historia" },
    description: {
      en: "Practice with interactive stories by reading and speaking sentence by sentence.",
      es: "Practica con historias interactivas leyendo y hablando oración por oración.",
    },
  },
  realtime: {
    icon: FaMicrophone,
    color: "#8B5CF6",
    label: { en: "Chat", es: "Chat" },
    shortLabel: { en: "Chat", es: "Hablar" },
    description: {
      en: "Practice speaking with realtime conversations.",
      es: "Practica la expresión oral con conversaciones en tiempo real.",
    },
  },
};

export default function TutorialStepper({
  modules = ["vocabulary", "grammar", "reading", "stories", "realtime"],
  currentModule,
  completedModules = [],
  lang = "en",
  supportLang = "en",
  tutorialDescription = null,
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  // Ensure currentModule is valid, fallback to first module if not
  const validModule = MODULE_CONFIG[currentModule] ? currentModule : modules[0];
  const currentIndex = modules.indexOf(validModule);
  const currentConfig = MODULE_CONFIG[validModule];

  // Get description: prefer passed tutorialDescription, fall back to built-in
  const getDescription = () => {
    if (tutorialDescription) {
      return typeof tutorialDescription === "object"
        ? tutorialDescription[supportLang] || tutorialDescription.en
        : tutorialDescription;
    }
    if (currentConfig?.description) {
      return currentConfig.description[supportLang] || currentConfig.description.en;
    }
    return null;
  };

  const description = getDescription();

  return (
    <VStack spacing={4} w="100%" mb={2}>
      {/* Stepper Progress */}
      <Box w="100%" px={2}>
        <HStack
          spacing={0}
          justify="center"
          align="center"
          w="100%"
          position="relative"
        >
          {modules.map((module, index) => {
            const config = MODULE_CONFIG[module];
            const Icon = config?.icon || FaBook;
            const isCompleted = completedModules.includes(module);
            const isCurrent = module === validModule;
            const isPending = !isCompleted && !isCurrent;

            return (
              <React.Fragment key={module}>
                {/* Connector Line (before each step except first) */}
                {index > 0 && (
                  <Box
                    flex={1}
                    h="3px"
                    maxW={{ base: "30px", md: "60px" }}
                    bg={
                      completedModules.includes(modules[index - 1])
                        ? config?.color || "green.400"
                        : "whiteAlpha.300"
                    }
                    transition="background 0.3s ease"
                  />
                )}

                {/* Step Circle */}
                <VStack spacing={1}>
                  <Circle
                    size={{ base: "36px", md: "44px" }}
                    bg={
                      isCompleted
                        ? config?.color || "green.500"
                        : isCurrent
                        ? "whiteAlpha.200"
                        : "whiteAlpha.100"
                    }
                    borderWidth={isCurrent ? "3px" : "2px"}
                    borderColor={
                      isCompleted
                        ? config?.color || "green.500"
                        : isCurrent
                        ? config?.color || "blue.400"
                        : "whiteAlpha.300"
                    }
                    transition="all 0.3s ease"
                    transform={isCurrent ? "scale(1.1)" : "scale(1)"}
                    boxShadow={
                      isCurrent
                        ? `0 0 20px ${config?.color || "blue.400"}40`
                        : "none"
                    }
                  >
                    {isCompleted ? (
                      <CheckIcon boxSize={{ base: 4, md: 5 }} color="white" />
                    ) : (
                      <Icon
                        size={isMobile ? 16 : 20}
                        color={
                          isCurrent
                            ? config?.color || "#60A5FA"
                            : "rgba(255,255,255,0.5)"
                        }
                      />
                    )}
                  </Circle>

                  {/* Step Label */}
                  <Text
                    fontSize={{ base: "2xs", md: "xs" }}
                    fontWeight={isCurrent ? "bold" : "medium"}
                    color={
                      isCompleted || isCurrent ? "white" : "whiteAlpha.600"
                    }
                    textAlign="center"
                    whiteSpace="nowrap"
                  >
                    {isMobile
                      ? config?.shortLabel?.[lang] || module
                      : config?.label?.[lang] || module}
                  </Text>
                </VStack>
              </React.Fragment>
            );
          })}
        </HStack>
      </Box>

      {/* Current Module Description */}
      {description && currentConfig && (
        <Box
          w="100%"
          maxWidth="600px"
          mx="auto"
          bg="whiteAlpha.150"
          borderRadius="xl"
          p={4}
          borderWidth="1px"
          borderColor={`${currentConfig.color}40`}
        >
          <Flex align="center" gap={3}>
            <Circle
              size="40px"
              bg={`${currentConfig.color}20`}
              flexShrink={0}
            >
              {React.createElement(currentConfig.icon, {
                size: 20,
                color: currentConfig.color,
              })}
            </Circle>
            <VStack align="start" spacing={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={currentConfig.color || "white"}
              >
                {currentConfig.label?.[supportLang] || currentConfig.label?.en || validModule}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.800" lineHeight="1.4">
                {description}
              </Text>
            </VStack>
          </Flex>
        </Box>
      )}
    </VStack>
  );
}
