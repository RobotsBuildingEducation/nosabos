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

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";

// Module configuration with icons, colors, and descriptions
const MODULE_CONFIG = {
  vocabulary: {
    icon: RiBook2Line,
    color: "#10B981",
    label: { en: "Vocabulary", es: "Vocabulario", pt: "Vocabulário", it: "Vocabolario", fr: "Vocabulaire", ja: "語彙" },
    shortLabel: { en: "Vocab", es: "Vocab", pt: "Vocabul.", it: "Vocab", fr: "Vocab", ja: "語彙" },
    description: {
      en: "Learn new words through interactive questions.",
      es: "Aprende nuevas palabras mediante preguntas interactivas.",
      pt: "Aprenda novas palavras com perguntas interativas.",
      it: "Impara nuove parole con domande interattive.",
      fr: "Apprends de nouveaux mots avec des questions interactives.",
      ja: "インタラクティブな質問で新しい単語を学びます。",
    },
  },
  grammar: {
    icon: RiPencilLine,
    color: "#3B82F6",
    label: { en: "Grammar", es: "Gramática", pt: "Gramática", it: "Grammatica", fr: "Grammaire", ja: "文法" },
    shortLabel: { en: "Grammar", es: "Gram", pt: "Gram.", it: "Gram", fr: "Gram", ja: "文法" },
    description: {
      en: "Master grammar rules through exercises.",
      es: "Domina las reglas gramaticales mediante ejercicios.",
      pt: "Domine as regras gramaticais com exercícios.",
      it: "Padroneggia le regole grammaticali con esercizi.",
      fr: "Maitrise les regles de grammaire avec des exercices.",
      ja: "練習問題で文法ルールを身につけます。",
    },
  },
  reading: {
    icon: FaBookOpen,
    color: "#F59E0B",
    label: { en: "Reading", es: "Lectura", pt: "Leitura", it: "Lettura", fr: "Lecture", ja: "読解" },
    shortLabel: { en: "Read", es: "Leer", pt: "Ler", it: "Leggi", fr: "Lire", ja: "読む" },
    description: {
      en: "Improve your reading skills by following along with passages.",
      es: "Mejora tus habilidades de lectura siguiendo los textos.",
      pt: "Melhore sua leitura acompanhando os textos.",
      it: "Migliora la tua lettura seguendo i testi.",
      fr: "Ameliore ta lecture en suivant les textes.",
      ja: "文章を追いながら読解力を高めます。",
    },
  },
  stories: {
    icon: MdOutlineDescription,
    color: "#EC4899",
    label: { en: "Stories", es: "Historias", pt: "Histórias", it: "Storie", fr: "Histoires", ja: "ストーリー" },
    shortLabel: { en: "Story", es: "Historia", pt: "História", it: "Storia", fr: "Histoire", ja: "物語" },
    description: {
      en: "Practice with interactive stories by reading and speaking sentence by sentence.",
      es: "Practica con historias interactivas leyendo y hablando oración por oración.",
      pt: "Pratique com histórias interativas lendo e falando frase por frase.",
      it: "Pratica con storie interattive leggendo e parlando frase per frase.",
      fr: "Pratique avec des histoires interactives, phrase par phrase, a l'ecrit et a l'oral.",
      ja: "文ごとに読んで話すインタラクティブなストーリーで練習します。",
    },
  },
  realtime: {
    icon: FaMicrophone,
    color: "#8B5CF6",
    label: { en: "Chat", es: "Chat", pt: "Chat", it: "Chat", fr: "Chat", ja: "チャット" },
    shortLabel: { en: "Chat", es: "Hablar", pt: "Falar", it: "Parla", fr: "Parler", ja: "話す" },
    description: {
      en: "Practice speaking with realtime conversations.",
      es: "Practica la expresión oral con conversaciones en tiempo real.",
      pt: "Pratique a fala com conversas em tempo real.",
      it: "Pratica la conversazione in tempo reale.",
      fr: "Pratique l'expression orale avec des conversations en temps reel.",
      ja: "リアルタイム会話で話す練習をします。",
    },
  },
  game: {
    icon: FaGamepad,
    color: "#F97316",
    label: { en: "Game", es: "Juego", pt: "Jogo", it: "Gioco", fr: "Jeu", ja: "ゲーム" },
    shortLabel: { en: "Game", es: "Juego", pt: "Jogo", it: "Gioco", fr: "Jeu", ja: "ゲーム" },
    description: {
      en: "Review what you learned by playing an interactive game.",
      es: "Repasa lo aprendido jugando un juego interactivo.",
      pt: "Revise o que você aprendeu com um jogo interativo.",
      it: "Ripassa ciò che hai imparato con un gioco interattivo.",
      fr: "Revise ce que tu as appris avec un jeu interactif.",
      ja: "インタラクティブなゲームで学んだことを復習します。",
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
                        : APP_BORDER
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
                        border={`1px solid ${config?.color}`}
                        bg={
                          isCompleted
                            ? config?.color || "green.500"
                            : isCurrent
                              ? APP_SURFACE_ELEVATED
                              : APP_SURFACE
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
                        mb={1}
                      >
                        {isCompleted ? (
                          <CheckIcon
                            boxSize={{ base: 4, md: 5 }}
                            color="white"
                          />
                        ) : (
                          <Icon
                            size={isMobile ? 16 : 20}
                            color={
                              isCurrent
                                ? config?.color || "#60A5FA"
                                : APP_TEXT_MUTED
                            }
                          />
                        )}
                      </Circle>
                    </PopoverTrigger>
                    <PopoverContent
                      bg={APP_SURFACE_ELEVATED}
                      borderColor={config?.color || APP_BORDER_STRONG}
                      borderWidth="2px"
                      color={APP_TEXT_PRIMARY}
                      maxW="280px"
                    >
                      <PopoverArrow bg={APP_SURFACE_ELEVATED} />
                      <PopoverBody py={3}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color={config?.color || APP_TEXT_PRIMARY}
                          mb={1}
                        >
                          {config?.label?.[supportLang] ||
                            config?.label?.en ||
                            module}
                        </Text>
                        <Text fontSize="sm" color={APP_TEXT_SECONDARY} lineHeight="1.4">
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
                      isCompleted || isCurrent ? APP_TEXT_PRIMARY : APP_TEXT_MUTED
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
