import React from "react";
import {
  Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay,
} from "@chakra-ui/react";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import PlateScoreJourney from "./PlateScoreJourney";
import { IMMERSION_COPY } from "./immersionCopy";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import useEscapeToClose from "../hooks/useEscapeToClose";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound } from "../constants/sounds";
import { nativeAnchoredDrawerMotionProps, nativeOverlayMotionProps } from "../utils/modalMotion";

export default function RealWorldTasksModal({
  isOpen, onClose, score = 0, targetLang = "es", appLanguage = "en", immersion,
}) {
  const playSound = useSoundSettings((state) => state.playSound);
  const handleClose = () => { playSound(selectSound); onClose?.(); };
  const swipeDismiss = useBottomDrawerSwipeDismiss({ isOpen, onClose: handleClose });
  useEscapeToClose(isOpen, handleClose);
  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={handleClose}
      autoFocus={false} trapFocus={false} returnFocusOnClose={false}>
      <DrawerOverlay {...nativeOverlayMotionProps} />
      <DrawerContent {...swipeDismiss.drawerContentProps}
        motionProps={nativeAnchoredDrawerMotionProps}
        bg="var(--app-surface-elevated)" color="var(--app-text-primary)"
        borderTopRadius="24px" h={{ base: "78vh", md: "78vh" }}
        borderTop="1px solid var(--app-border)" boxShadow="var(--app-shadow-soft)"
        sx={{ "@supports (height: 100dvh)": { height: "78dvh" } }}>
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton top={4} right={4} />
        <DrawerHeader pr={12} fontSize="lg" fontWeight="bold">
          {(IMMERSION_COPY[appLanguage] || IMMERSION_COPY.en).title}
        </DrawerHeader>
        <DrawerBody overflowY="auto" pb={8}>
          <Box maxW="620px" mx="auto">
            <PlateScoreJourney score={score} targetLang={targetLang}
              appLanguage={appLanguage} immersion={immersion} />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
