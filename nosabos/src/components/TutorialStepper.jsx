import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Circle,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  useBreakpointValue,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import {
  FaBook,
  FaGraduationCap,
  FaBookOpen,
  FaTheaterMasks,
  FaMicrophone,
  FaGamepad,
} from "react-icons/fa";
import { RiBook2Line, RiPencilLine } from "react-icons/ri";
import { MdOutlineDescription } from "react-icons/md";
import { TbLanguage } from "react-icons/tb";

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
  game: {
    icon: FaGamepad,
    color: "#F97316",
    label: { en: "Game", es: "Juego" },
    shortLabel: { en: "Game", es: "Juego" },
    description: {
      en: "Review what you learned by playing an interactive game.",
      es: "Repasa lo aprendido jugando un juego interactivo.",
    },
  },
};

export default function TutorialStepper({
  modules = ["vocabulary", "grammar", "reading", "stories", "realtime", "game"],
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
  const getModuleDescription = (module) => {
    const config = MODULE_CONFIG[module];
    if (!config) return null;
    if (module === validModule && tutorialDescription) {
      return typeof tutorialDescription === "object"
        ? tutorialDescription[supportLang] || tutorialDescription.en
        : tutorialDescription;
    }
    return config.description?.[supportLang] || config.description?.en || null;
  };

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

                {/* Step Circle + Popover */}
                <VStack spacing={1}>
                  <Popover trigger="click" placement="bottom" isLazy>
                    <PopoverTrigger>
                      <Circle
                        as="button"
                        aria-label={`Tutorial step: ${config?.label?.[lang] || module}`}
                        size={{ base: "36px", md: "44px" }}
                        bg={
                          isCompleted
                            ? config?.color || "green.500"
                            : isCurrent
                            ? "whiteAlpha.200"
                            : "whiteAlpha.100"
                        }
                        transition="all 0.3s ease"
                        transform={isCurrent ? "scale(1.1)" : "scale(1)"}
                        boxShadow={
                          isCurrent
                            ? `0px 4px 0px ${config?.color || "#60A5FA"}`
                            : "0px 4px 0px rgba(15, 23, 42, 0.75)"
                        }
                        _hover={{
                          transform: isCurrent
                            ? "scale(1.1) translateY(1px)"
                            : "scale(1.03) translateY(1px)",
                          boxShadow: isCurrent
                            ? `0px 3px 0px ${config?.color || "#60A5FA"}`
                            : "0px 3px 0px rgba(15, 23, 42, 0.75)",
                        }}
                        _active={{
                          transform: isCurrent
                            ? "scale(1.1) translateY(4px)"
                            : "scale(1.02) translateY(4px)",
                          boxShadow: "0px 0px 0px rgba(15, 23, 42, 0.75)",
                        }}
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
                    </PopoverTrigger>
                    <PopoverContent
                      bg="rgba(30, 41, 59, 0.97)"
                      borderColor={config?.color || "whiteAlpha.500"}
                      borderWidth="2px"
                      color="white"
                      maxW="280px"
                    >
                      <PopoverArrow bg="rgba(30, 41, 59, 0.97)" />
                      <PopoverBody py={3}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color={config?.color || "white"}
                          mb={1}
                        >
                          {config?.label?.[supportLang] || config?.label?.en || module}
                        </Text>
                        <Text fontSize="sm" color="gray.200" lineHeight="1.4">
                          {getModuleDescription(module) ||
                            "No description available"}
                        </Text>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>

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

    </VStack>
  );
}
