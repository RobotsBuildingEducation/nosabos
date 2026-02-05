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
import { PiPath, PiUsersBold } from "react-icons/pi";
import { RiBookmarkLine, RiRoadMapLine } from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { LuKey, LuKeyRound } from "react-icons/lu";
import { FaBitcoin, FaKey } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { translations } from "../utils/translation";

// Pulse animation for the popover
const pulseKeyframes = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1);  }
`;

// Button explanations configuration - ordered left to right as they appear on skill tree
// Labels/descriptions now reference translation keys
const BUTTON_EXPLANATIONS = [
  {
    id: "back",
    icon: ArrowBackIcon,
    labelKey: "tutorial_btn_back_label",
    descKey: "tutorial_btn_back_desc",
    position: 0,
  },
  {
    id: "teams",
    icon: PiUsersBold,
    labelKey: "tutorial_btn_teams_label",
    descKey: "tutorial_btn_teams_desc",
    position: 1,
  },
  {
    id: "settings",
    icon: SettingsIcon,
    labelKey: "tutorial_btn_settings_label",
    descKey: "tutorial_btn_settings_desc",
    position: 2,
  },
  {
    id: "notes",
    icon: RiBookmarkLine,
    labelKey: "tutorial_btn_notes_label",
    descKey: "tutorial_btn_notes_desc",
    position: 3,
  },
  {
    id: "identity",
    icon: FaBitcoin,
    labelKey: "tutorial_btn_identity_label",
    descKey: "tutorial_btn_identity_desc",
    position: 4,
  },
  {
    id: "help",
    icon: MdOutlineSupportAgent,
    labelKey: "tutorial_btn_help_label",
    descKey: "tutorial_btn_help_desc",
    position: 5,
  },
  {
    id: "mode",
    icon: PiPath,
    labelKey: "tutorial_btn_mode_label",
    descKey: "tutorial_btn_mode_desc",
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
  const activeExplanations = isOnSkillTree
    ? BUTTON_EXPLANATIONS.filter((btn) => btn.id !== "back")
    : BUTTON_EXPLANATIONS;

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const playSound = useSoundSettings((s) => s.playSound);
  const ui = translations[lang] || translations.en;

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
          bg="linear-gradient(135deg, rgba(95, 51, 189, 0.95) 0%, rgba(131, 61, 244, 0.95) 100%)"
          borderRadius="2xl"
          p={5}
          boxShadow="0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)"
          backdropFilter="blur(12px)"
          animation={`${pulseKeyframes} 2s ease-in-out infinite`}
          border="1px solid cyan"
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
                {ui[currentButton.labelKey] || translations.en[currentButton.labelKey]}
              </Text>
            </HStack>

            {/* Description */}
            <Text
              fontSize="sm"
              color="whiteAlpha.900"
              textAlign="center"
              lineHeight="1.5"
            >
              {ui[currentButton.descKey] || translations.en[currentButton.descKey]}
            </Text>

            {/* Progress dots */}
            <HStack spacing={2} mt={2}>
              {activeExplanations.map((_, index) => (
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
                aria-label={ui.tutorial_previous || "Previous"}
                size="sm"
                color="white"
                colorScheme="purple"
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              />

              <Text
                fontSize="xs"
                color="whiteAlpha.800"
                minW="60px"
                textAlign="center"
              >
                {currentStep + 1} / {activeExplanations.length}
              </Text>

              {isLastStep ? (
                <Button
                  size="sm"
                  colorScheme="purple"
                  onClick={handleFinish}
                  px={4}
                >
                  {ui.tutorial_done || "Done"}
                </Button>
              ) : (
                <IconButton
                  icon={<ChevronRightIcon boxSize={5} />}
                  onClick={handleNext}
                  aria-label={ui.tutorial_next || "Next"}
                  size="sm"
                  color="white"
                  colorScheme="purple"
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
