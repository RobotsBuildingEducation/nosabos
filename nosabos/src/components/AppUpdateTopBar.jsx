import React, { useState } from "react";
import { Button, HStack, Icon } from "@chakra-ui/react";
import { IoSparkles } from "react-icons/io5";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound } from "../constants/sounds";

const UPDATE_BAR_COPY = {
  en: {
    updateApp: "Update App",
    updating: "Updating…",
  },
  es: {
    updateApp: "Actualizar app",
    updating: "Actualizando…",
  },
  pt: {
    updateApp: "Atualizar app",
    updating: "Atualizando…",
  },
  it: {
    updateApp: "Aggiorna app",
    updating: "Aggiornamento…",
  },
  fr: {
    updateApp: "Mettre à jour l'app",
    updating: "Mise à jour…",
  },
  de: {
    updateApp: "App aktualisieren",
    updating: "Wird aktualisiert…",
  },
  ja: {
    updateApp: "アプリを更新",
    updating: "更新中…",
  },
  hi: {
    updateApp: "ऐप अपडेट करें",
    updating: "अपडेट हो रहा है…",
  },
  ar: {
    updateApp: "تحديث التطبيق",
    updating: "جارٍ التحديث…",
  },
  zh: {
    updateApp: "更新应用",
    updating: "正在更新…",
  },
};

export default function AppUpdateTopBar({
  onUpdate,
  isApplying = false,
  language = "en",
}) {
  const copy = UPDATE_BAR_COPY[language] || UPDATE_BAR_COPY.en;
  const [isPressed, setIsPressed] = useState(false);
  const playSound = useSoundSettings((s) => s.playSound);

  const effectiveLoading = isApplying || isPressed;

  const handleUpdate = async () => {
    if (effectiveLoading) return;
    setIsPressed(true);
    try {
      playSound(selectSound);
    } catch {
      // Audio safe fallback
    }
    try {
      await onUpdate?.();
    } finally {
      setIsPressed(false);
    }
  };

  return (
    <HStack
      w="100%"
      px={{ base: 2, md: 3 }}
      pt="calc(env(safe-area-inset-top, 0px) + 0.5rem)"
      pb={2}
      align="center"
      justify="space-between"
      spacing={2}
    >
      <Icon
        as={IoSparkles}
        color="teal.300"
        boxSize={{ base: 4, md: 4.5 }}
        flexShrink={0}
        aria-hidden="true"
      />

      <Button
        size="xs"
        colorScheme="teal"
        flexShrink={0}
        onClick={handleUpdate}
        isLoading={effectiveLoading}
        loadingText={copy.updating}
        borderRadius="full"
        px={3}
        h="30px"
        fontWeight="bold"
        boxShadow="none"
        _hover={{ boxShadow: "none" }}
        _active={{ transform: "scale(0.94)", boxShadow: "none" }}
        transition="transform 0.1s ease-out, background-color 0.15s ease"
      >
        {copy.updateApp}
      </Button>
    </HStack>
  );
}
