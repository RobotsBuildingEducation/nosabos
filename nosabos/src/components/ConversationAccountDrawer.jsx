import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import { ConversationSettingsPanel } from "./ConversationSettingsDrawer";
import { IdentityPanel } from "./IdentityDrawer";

export default function ConversationAccountDrawer({
  isOpen,
  onClose,
  tabIndex = 0,
  onTabChange,
  appLanguage = "en",
  settings,
  onSettingsChange,
  supportLang = "en",
  identityProps = {},
}) {
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });
  const lang = appLanguage === "es" ? "es" : "en";
  const ui =
    lang === "es"
      ? {
          title: "Configuración",
          conversationTab: "Configuración de conversación",
          accountTab: "Cuenta",
        }
      : {
          title: "Settings",
          conversationTab: "Conversation settings",
          accountTab: "Account",
        };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay {...swipeDismiss.overlayProps} bg="blackAlpha.600" />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        bg="gray.900"
        color="gray.100"
        borderTopRadius="24px"
        maxH="80vh"
        display="flex"
        flexDirection="column"
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton
          color="gray.400"
          _hover={{ color: "gray.200" }}
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
          <Tabs
            index={tabIndex}
            onChange={onTabChange}
            variant="unstyled"
            display="flex"
            flexDirection="column"
            flex={1}
            minH={0}
          >
            <TabList
              mb={4}
              gap={6}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Tab
                px={0}
                pt={1}
                pb={3}
                position="relative"
                fontWeight="semibold"
                color="gray.400"
                borderRadius="0"
                bg="transparent"
                border="none"
                boxShadow="none"
                outline="none"
                _active={{ bg: "transparent" }}
                _hover={{ color: "gray.100", borderColor: "transparent" }}
                _focus={{
                  boxShadow: "none",
                  outline: "none",
                  borderColor: "transparent",
                }}
                _focusVisible={{
                  boxShadow: "none",
                  outline: "none",
                  borderColor: "transparent",
                }}
                sx={{
                  "&:hover": { borderColor: "transparent" },
                  "&:focus": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&[data-focus]": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&[data-focus-visible]": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                }}
                _after={{
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: "-1px",
                  height: "3px",
                  borderRadius: "full",
                  bgGradient: "linear(to-r, cyan.300, blue.400, purple.400)",
                  opacity: 0,
                  transform: "scaleX(0.7)",
                  transformOrigin: "center",
                  transition: "all 0.2s ease",
                }}
                _selected={{
                  color: "white",
                  _after: {
                    opacity: 1,
                    transform: "scaleX(1)",
                  },
                }}
              >
                {ui.conversationTab}
              </Tab>
              <Tab
                px={0}
                pt={1}
                pb={3}
                position="relative"
                fontWeight="semibold"
                color="gray.400"
                borderRadius="0"
                bg="transparent"
                border="none"
                boxShadow="none"
                outline="none"
                _active={{ bg: "transparent" }}
                _hover={{ color: "gray.100", borderColor: "transparent" }}
                _focus={{
                  boxShadow: "none",
                  outline: "none",
                  borderColor: "transparent",
                }}
                _focusVisible={{
                  boxShadow: "none",
                  outline: "none",
                  borderColor: "transparent",
                }}
                sx={{
                  "&:hover": { borderColor: "transparent" },
                  "&:focus": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&[data-focus]": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                  "&[data-focus-visible]": {
                    outline: "none",
                    boxShadow: "none",
                    borderColor: "transparent",
                  },
                }}
                _after={{
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: "-1px",
                  height: "3px",
                  borderRadius: "full",
                  bgGradient: "linear(to-r, cyan.300, blue.400, purple.400)",
                  opacity: 0,
                  transform: "scaleX(0.7)",
                  transformOrigin: "center",
                  transition: "all 0.2s ease",
                }}
                _selected={{
                  color: "white",
                  _after: {
                    opacity: 1,
                    transform: "scaleX(1)",
                  },
                }}
              >
                {ui.accountTab}
              </Tab>
            </TabList>
            <TabPanels flex={1} minH={0}>
              <TabPanel
                px={0}
                pt={0}
                pb={0}
                display="flex"
                flexDirection="column"
                overflowY="auto"
                minH={0}
              >
                <ConversationSettingsPanel
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                  supportLang={supportLang}
                  onClose={onClose}
                  onSave={onClose}
                />
              </TabPanel>
              <TabPanel
                px={0}
                pt={0}
                pb={0}
                display="flex"
                flexDirection="column"
                overflowY="auto"
                minH={0}
              >
                <IdentityPanel
                  {...identityProps}
                  onClose={onClose}
                  showHeader={false}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
