import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import { ConversationSettingsPanel } from "./ConversationSettingsDrawer";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

export default function ConversationAccountDrawer({
  isOpen,
  onClose,
  appLanguage = "en",
  settings,
  onSettingsChange,
  supportLang = "en",
}) {
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const ui =
    lang === "ja"
      ? {
          title: "会話設定",
        }
      : lang === "fr"
      ? {
          title: "Parametres de conversation",
        }
      : lang === "pt"
      ? {
          title: "Configuracoes da conversa",
        }
      : lang === "it"
      ? {
          title: "Impostazioni conversazione",
        }
      : lang === "es"
      ? {
          title: "Configuración de conversación",
        }
      : {
          title: "Conversation settings",
        };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay
        {...swipeDismiss.overlayProps}
        bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.600"}
        backdropFilter="blur(4px)"
      />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        borderTopRadius="24px"
        maxH="80vh"
        display="flex"
        flexDirection="column"
        borderTop={isLightTheme ? `1px solid ${APP_BORDER}` : undefined}
        boxShadow={isLightTheme ? APP_SHADOW : undefined}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton
          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
          _hover={{ color: isLightTheme ? APP_TEXT_PRIMARY : "gray.200" }}
          top={4}
          right={4}
        />
        <DrawerHeader pb={2} pr={12}>
          {ui.title}
        </DrawerHeader>
        <DrawerBody
          pb={6}
          display="flex"
          flexDirection="column"
          flex={1}
          minH={0}
        >
          <ConversationSettingsPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            supportLang={supportLang}
            onClose={onClose}
            onSave={onClose}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
