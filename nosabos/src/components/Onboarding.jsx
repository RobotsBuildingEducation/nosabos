// src/components/Onboarding.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck, LuKeyRound } from "react-icons/lu";
import submitActionSound from "../assets/submitaction.mp3";
import useSoundSettings from "../hooks/useSoundSettings";
import { useLocation, useNavigate } from "react-router-dom";

import { translations } from "../utils/translation";
import RandomCharacter from "./RandomCharacter";

const BASE_PATH = "/onboarding";

export default function Onboarding({
  onComplete,
  userLanguage = "en",
  initialDraft = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const supportLang = userLanguage === "es" ? "es" : "en";
  const ui = translations[supportLang] || translations.en;

  const playSound = useSoundSettings((s) => s.playSound);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!location.pathname.startsWith(BASE_PATH)) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={28} />,
        text: ui?.app_install_step1 || "Open the browser menu.",
      },
      {
        id: "step2",
        icon: <MdOutlineFileUpload size={28} />,
        text: ui?.app_install_step2 || "Choose 'Share' or 'Install'.",
      },
      {
        id: "step3",
        icon: <CiSquarePlus size={28} />,
        text: ui?.app_install_step3 || "Add to Home Screen.",
      },
      {
        id: "step4",
        icon: <LuBadgeCheck size={28} />,
        text: ui?.app_install_step4 || "Launch from your Home Screen.",
      },
      {
        id: "step5",
        icon: <LuKeyRound size={24} />,
        text:
          ui?.account_final_step_title ||
          "Copy your secret key to sign into your account",
        subText:
          ui?.account_final_step_description ||
          "This key is the only way to access your accounts on Robots Building Education apps. Store it in a password manager or a safe place. We cannot recover it for you.",
      },
    ],
    [ui],
  );

  async function handleGotIt() {
    if (typeof onComplete !== "function") {
      console.error("Onboarding.onComplete is not provided.");
      return;
    }
    setIsSaving(true);
    try {
      playSound(submitActionSound);
      const payload = {
        level: initialDraft.level || "beginner",
        supportLang,
        voicePersona:
          initialDraft.voicePersona ||
          translations[supportLang]?.onboarding_persona_default_example ||
          translations.en.onboarding_persona_default_example,
        targetLang:
          initialDraft.targetLang || (supportLang === "es" ? "en" : "es"),
        pauseMs:
          typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
            ? initialDraft.pauseMs
            : 1200,
        soundEnabled:
          typeof initialDraft.soundEnabled === "boolean"
            ? initialDraft.soundEnabled
            : true,
        soundVolume:
          typeof initialDraft.soundVolume === "number"
            ? initialDraft.soundVolume
            : 40,
      };
      await Promise.resolve(onComplete(payload));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      color="gray.100"
      sx={{
        "@supports (height: 100dvh)": {
          minHeight: "100dvh",
        },
      }}
    >
      <Drawer isOpen={true} placement="bottom" onClose={() => {}}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent
          bg="gray.900"
          color="gray.100"
          borderTopRadius="24px"
          maxH="100vh"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "100dvh",
            },
          }}
        >
          <DrawerBody pb={6}>
            <Box maxW="600px" mx="auto" w="100%">
              <VStack align="stretch" spacing={1}>
                <HStack display="flex" alignItems={"center"}>
                  <RandomCharacter notSoRandomCharacter={"24"} />
                  <Text fontWeight="bold" fontSize="lg">
                    {ui?.app_install_title || "Install as app"}
                  </Text>
                </HStack>
                <Text opacity={0.85} fontSize="sm">
                  {ui?.onboarding_install_subtitle ||
                    "For the best experience, install the app on your device."}
                </Text>
              </VStack>
            </Box>
            <Box maxW="600px" mx="auto" w="100%" mt={4}>
              <Box bg="gray.800" p={3} rounded="md">
                {installSteps.map((step, idx) => (
                  <Box key={step.id} py={2}>
                    <Flex
                      align="center"
                      gap={3}
                      justify="space-between"
                      flexWrap="wrap"
                    >
                      <HStack align="center" gap={3}>
                        <Box color="teal.200">{step.icon}</Box>
                        <Text fontSize="sm">{step.text}</Text>
                      </HStack>
                    </Flex>
                    {step.subText ? (
                      <Text fontSize="xs" color="teal.100" mt={2} ml={8}>
                        {step.subText}
                      </Text>
                    ) : null}
                    {idx < installSteps.length - 1 && (
                      <Divider my={3} borderColor="gray.700" />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </DrawerBody>

          <Box
            px={6}
            pb={6}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <Box maxW="600px" mx="auto" w="100%">
              <Button
                size="lg"
                colorScheme="teal"
                onClick={handleGotIt}
                isLoading={isSaving}
                loadingText={ui.common_saving}
                w="100%"
              >
                {ui?.onboarding_got_it || "Got it!"}
              </Button>
            </Box>
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
