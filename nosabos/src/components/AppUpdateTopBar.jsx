import React from "react";
import { Button, HStack, Icon } from "@chakra-ui/react";
import { IoSparkles } from "react-icons/io5";

const UPDATE_BAR_COPY = {
  en: {
    updateApp: "Update App",
    later: "Later",
    updating: "Updating…",
  },
  es: {
    updateApp: "Actualizar app",
    later: "Más tarde",
    updating: "Actualizando…",
  },
  pt: {
    updateApp: "Atualizar app",
    later: "Mais tarde",
    updating: "Atualizando…",
  },
  it: {
    updateApp: "Aggiorna app",
    later: "Più tardi",
    updating: "Aggiornamento…",
  },
  fr: {
    updateApp: "Mettre à jour l'app",
    later: "Plus tard",
    updating: "Mise à jour…",
  },
  de: {
    updateApp: "App aktualisieren",
    later: "Später",
    updating: "Wird aktualisiert…",
  },
  ja: {
    updateApp: "アプリを更新",
    later: "後で",
    updating: "更新中…",
  },
  hi: {
    updateApp: "ऐप अपडेट करें",
    later: "बाद में",
    updating: "अपडेट हो रहा है…",
  },
  ar: {
    updateApp: "تحديث التطبيق",
    later: "لاحقاً",
    updating: "جارٍ التحديث…",
  },
  zh: {
    updateApp: "更新应用",
    later: "稍后",
    updating: "正在更新…",
  },
};

export default function AppUpdateTopBar({
  onUpdate,
  onLater,
  isApplying = false,
  language = "en",
}) {
  const copy = UPDATE_BAR_COPY[language] || UPDATE_BAR_COPY.en;

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

      <HStack spacing={2} flexShrink={0}>
        <Button
          size="xs"
          variant="ghost"
          color="var(--app-text-secondary, rgba(255, 255, 255, 0.75))"
          onClick={onLater}
          isDisabled={isApplying}
          borderRadius="full"
          px={2.5}
          h="30px"
        >
          {copy.later}
        </Button>
        <Button
          size="xs"
          colorScheme="teal"
          onClick={onUpdate}
          isLoading={isApplying}
          loadingText={copy.updating}
          borderRadius="full"
          px={3}
          h="30px"
          fontWeight="bold"
          boxShadow="none"
          _hover={{ boxShadow: "none" }}
          _active={{ boxShadow: "none" }}
        >
          {copy.updateApp}
        </Button>
      </HStack>
    </HStack>
  );
}
