import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { PiDotsNineBold } from "react-icons/pi";
import { FiCompass } from "react-icons/fi";
import { useThemeStore } from "../useThemeStore";

const useSafeLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const ActivityMenuBackdrop = React.forwardRef(function ActivityMenuBackdrop(
  { isOpen, onClose, isLightTheme },
  ref,
) {
  useSafeLayoutEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.body.setAttribute("data-activity-menu-open", "true");
      document.documentElement.setAttribute("data-activity-menu-open", "true");
    } else {
      document.body.removeAttribute("data-activity-menu-open");
      document.documentElement.removeAttribute("data-activity-menu-open");
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.removeAttribute("data-activity-menu-open");
        document.documentElement.removeAttribute("data-activity-menu-open");
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Box
      ref={ref}
      data-activity-menu-backdrop=""
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      w="100vw"
      h="100dvh"
      zIndex={1400}
      backdropFilter="blur(8px)"
      sx={{
        WebkitBackdropFilter: "blur(8px)",
      }}
      bg={
        isLightTheme
          ? "rgba(247, 241, 231, 0.45)"
          : "rgba(2, 6, 23, 0.55)"
      }
      touchAction="none"
      pointerEvents="auto"
      onClick={onClose}
      aria-hidden="true"
      animation="app-modal-overlay-in 200ms ease-out"
    />
  );
});

function useMenuSwipeDismiss({ onClose, isOpen }) {
  const cardRef = useRef(null);
  const backdropRef = useRef(null);
  const gestureRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const isClosingRef = useRef(false);
  const offsetYRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const syncPresentation = useCallback((offsetY, transition = "none") => {
    if (isClosingRef.current && transition === "none") return;

    const card = cardRef.current;
    if (card) {
      card.style.transform =
        offsetY > 0 ? `translate3d(0, ${offsetY}px, 0)` : "";
      card.style.transition = transition;
      card.style.willChange = "transform";
      card.style.backfaceVisibility = "hidden";
      if (offsetY > 0) {
        card.style.opacity = String(Math.max(0.15, 1 - offsetY / 320));
      } else {
        card.style.opacity = "";
      }
    }

    const backdrop = backdropRef.current;
    if (backdrop) {
      if (offsetY > 0) {
        backdrop.style.opacity = String(Math.max(0.1, 1 - offsetY / 240));
        backdrop.style.transition =
          transition === "none" ? "none" : "opacity 0.2s ease";
      } else {
        backdrop.style.opacity = "";
        backdrop.style.transition =
          transition === "none" ? "opacity 0.2s ease" : transition;
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      gestureRef.current = null;
      activePointerIdRef.current = null;
      isClosingRef.current = false;
      offsetYRef.current = 0;
      setIsDragging(false);
      const card = cardRef.current;
      if (card) {
        card.style.transform = "";
        card.style.transition = "";
        card.style.opacity = "";
      }
      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.opacity = "";
        backdrop.style.transition = "";
      }
    } else {
      gestureRef.current = null;
      activePointerIdRef.current = null;
      setIsDragging(false);
    }
  }, [isOpen]);

  const handlePointerDown = useCallback(
    (e) => {
      if (isClosingRef.current) return;
      if (e.isPrimary === false) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // Ignore clicks on close 'X' button
      if (e.target.closest("button[aria-label='Close menu']")) {
        return;
      }

      const isDragHandle = Boolean(e.target.closest("[data-drag-handle]"));
      const isInteractive = Boolean(
        e.target.closest(
          "button, [role='menuitem'], a[href], input, select, textarea",
        ),
      );

      activePointerIdRef.current = e.pointerId;
      const card = cardRef.current;
      gestureRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        currentY: e.clientY,
        startTime: performance.now(),
        currentTime: performance.now(),
        velocityY: 0,
        hasActivated: false,
        isDragHandle,
        isInteractive,
        scrollTop: card?.scrollTop || 0,
      };

      syncPresentation(0, "none");
    },
    [syncPresentation],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (e) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      const gesture = gestureRef.current;
      if (!gesture || isClosingRef.current) return;

      const deltaX = e.clientX - gesture.startX;
      const deltaY = e.clientY - gesture.startY;
      const now = performance.now();

      if (!gesture.hasActivated) {
        const isDownward = deltaY > 6 && Math.abs(deltaY) > Math.abs(deltaX);
        const canActivate = gesture.isDragHandle
          ? isDownward
          : isDownward && gesture.scrollTop <= 0;

        if (!canActivate) {
          if (Math.abs(deltaX) > 12 || deltaY < -10) {
            gestureRef.current = null;
            activePointerIdRef.current = null;
          }
          return;
        }

        gesture.hasActivated = true;
        setIsDragging(true);
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      const elapsed = Math.max(now - gesture.currentTime, 1);
      gesture.velocityY = (e.clientY - gesture.currentY) / elapsed;
      gesture.currentY = e.clientY;
      gesture.currentTime = now;

      if (deltaY > 0) {
        const dampedY = deltaY <= 150 ? deltaY : 150 + (deltaY - 150) * 0.55;
        offsetYRef.current = dampedY;
        syncPresentation(dampedY, "none");
      } else {
        offsetYRef.current = 0;
        syncPresentation(0, "none");
      }
    };

    const handlePointerUp = (e) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      const gesture = gestureRef.current;
      gestureRef.current = null;
      activePointerIdRef.current = null;
      setIsDragging(false);

      if (!gesture || !gesture.hasActivated) {
        return;
      }

      const currentOffset = offsetYRef.current;
      const elapsed = Math.max(performance.now() - gesture.startTime, 1);
      const overallVelocity = currentOffset / elapsed;
      const shouldClose =
        currentOffset > 30 ||
        overallVelocity > 0.25 ||
        gesture.velocityY > 0.3;

      if (shouldClose) {
        isClosingRef.current = true;
        onClose?.();
      } else {
        syncPresentation(
          0,
          "transform 180ms ease-out, opacity 180ms ease-out",
        );
        offsetYRef.current = 0;
      }
    };

    const handlePointerCancel = (e) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      gestureRef.current = null;
      activePointerIdRef.current = null;
      setIsDragging(false);
      syncPresentation(0, "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)");
      offsetYRef.current = 0;
    };

    const handleTouchMove = (e) => {
      if (gestureRef.current?.hasActivated && e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen, onClose, syncPresentation]);

  return {
    cardRef,
    backdropRef,
    isDragging,
    handlePointerDown,
  };
}

function ActivityMenuPortal({
  isOpen,
  onClose,
  isLightTheme,
  children,
}) {
  const { cardRef, backdropRef, isDragging, handlePointerDown } =
    useMenuSwipeDismiss({
      isOpen,
      onClose,
    });

  return (
    <Portal>
      <ActivityMenuBackdrop
        ref={backdropRef}
        isOpen={isOpen}
        onClose={onClose}
        isLightTheme={isLightTheme}
      />
      <MenuList
        bg="transparent"
        border="none"
        boxShadow="none"
        p={0}
        m={0}
        minW={0}
        w="100%"
        maxW="100%"
        boxSizing="border-box"
        overflow="visible"
        zIndex={1500}
        outline="none"
        _focus={{ outline: "none", boxShadow: "none" }}
        sx={{
          "& .chakra-menu__menuitem": {
            whiteSpace: "normal !important",
          },
          "& [data-menu-icon-wrapper]": {
            width: { base: "38px !important", sm: "40px !important" },
            height: { base: "38px !important", sm: "40px !important" },
            minWidth: { base: "38px !important", sm: "40px !important" },
            maxWidth: { base: "38px !important", sm: "40px !important" },
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "visible",
            position: "relative",
          },
          "& [data-menu-icon-btn]": {
            width: { base: "30px !important", sm: "32px !important" },
            height: { base: "30px !important", sm: "32px !important" },
            minWidth: { base: "30px !important", sm: "32px !important" },
            maxWidth: { base: "30px !important", sm: "32px !important" },
            minHeight: { base: "30px !important", sm: "32px !important" },
            maxHeight: { base: "30px !important", sm: "32px !important" },
            borderRadius: { base: "10px !important", sm: "11px !important" },
            display: "inline-flex !important",
            alignItems: "center !important",
            justifyContent: "center !important",
            boxSizing: "border-box",
            flexShrink: 0,
          },
          "& [data-menu-icon-btn] > svg": {
            width: { base: "16px !important", sm: "17px !important" },
            height: { base: "16px !important", sm: "17px !important" },
            fontSize: { base: "16px !important", sm: "17px !important" },
          },
        }}
      >
        <Box
          ref={cardRef}
          onPointerDown={handlePointerDown}
          bg="var(--app-surface-elevated)"
          color="var(--app-text-primary)"
          borderWidth={{ base: "2px", sm: "2.5px" }}
          borderStyle="solid"
          borderColor={
            isLightTheme
              ? "rgba(180, 164, 144, 0.65)"
              : "var(--app-border-strong)"
          }
          boxShadow="var(--app-shadow-soft)"
          w="100%"
          maxW="100%"
          minW={0}
          boxSizing="border-box"
          maxH={{
            base: "min(580px, calc(100dvh - 96px))",
            md: "min(540px, calc(100dvh - 120px))",
          }}
          overflowY="auto"
          pt={{ base: 2, sm: 2.5 }}
          px={{ base: 2.5, sm: 3 }}
          pb={{ base: 2.5, sm: 3 }}
          borderRadius={{ base: "24px", sm: "28px" }}
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          gap={{ base: 2, sm: 2.5 }}
          style={{
            touchAction: "pan-y",
          }}
        >
          {/* Top drag bar & close button header */}
          <Box
            data-drag-handle=""
            gridColumn="1 / -1"
            position="relative"
            w="full"
            pt={{ base: 1.5, sm: 2 }}
            pb={{ base: 3.5, sm: 4 }}
            userSelect="none"
            touchAction="none"
            cursor={isDragging ? "grabbing" : "grab"}
          >
            <Box
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="32px"
              w="full"
            >
              {/* Centered pill drag handle */}
              <Box
                w="48px"
                h="5px"
                borderRadius="full"
                bg={
                  isLightTheme
                    ? "rgba(180, 164, 144, 0.55)"
                    : "rgba(255, 255, 255, 0.24)"
                }
                boxShadow={
                  isLightTheme
                    ? "0 1px 0 rgba(255, 255, 255, 0.6)"
                    : "0 1px 0 rgba(0, 0, 0, 0.4)"
                }
                pointerEvents="none"
              />

              {/* Top right 'X' exit button */}
              <IconButton
                aria-label="Close menu"
                icon={<CloseIcon boxSize="13px" />}
                position="absolute"
                right={{ base: 1, sm: 2 }}
                top="50%"
                transform="translateY(-50%)"
                size="sm"
                w="32px"
                h="32px"
                minW="32px"
                variant="ghost"
                borderRadius="full"
                color="var(--app-text-muted)"
                _hover={{
                  color: "var(--app-text-primary)",
                  bg: isLightTheme ? "rgba(0, 0, 0, 0.06)" : "whiteAlpha.200",
                }}
                _active={{
                  bg: isLightTheme ? "rgba(0, 0, 0, 0.1)" : "whiteAlpha.300",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              />
            </Box>
          </Box>

          {children}
        </Box>
      </MenuList>
    </Portal>
  );
}

const matchActionBarModifier = {
  name: "matchActionBar",
  enabled: true,
  phase: "afterMain",
  requires: ["popperOffsets"],
  fn({ state }) {
    const reference = state.elements.reference;
    // Find enclosing navigation container or action area
    const navContainer =
      reference?.closest?.("[data-bottom-navigation]") ||
      reference?.closest?.("[data-question-action-area]") ||
      (typeof document !== "undefined"
        ? document.querySelector("[data-bottom-navigation]") ||
          document.querySelector("[data-question-action-area]:not([aria-hidden='true'])") ||
          document.querySelector(".bottombar-glass")?.closest?.("[data-bottom-navigation], [data-question-action-area]")
        : null);

    // Find the bottom bar element or reference button for vertical anchoring
    const bar =
      reference?.closest?.(".bottombar-glass") ||
      reference?.closest?.("[data-action-bar-surface]") ||
      navContainer?.querySelector?.(".bottombar-glass") ||
      navContainer?.querySelector?.("[data-action-bar-surface]") ||
      reference;

    const viewportW = typeof window !== "undefined" ? window.innerWidth : 360;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 600;

    let containerLeft = 0;
    let containerWidth = viewportW;

    if (navContainer) {
      const navRect = navContainer.getBoundingClientRect();
      if (navRect.width > 0) {
        containerLeft = navRect.left;
        containerWidth = navRect.width;
      }
    } else {
      const rootEl = typeof document !== "undefined" ? document.getElementById("root") : null;
      if (rootEl) {
        const rootRect = rootEl.getBoundingClientRect();
        if (rootRect.width > 0 && rootRect.width < viewportW) {
          containerLeft = rootRect.left;
          containerWidth = rootRect.width;
        }
      }
    }

    // Allocate 12px margin on each side (24px total)
    const barWidth = Math.min(containerWidth - 24, viewportW - 24, 420);
    const isCenterAligned = state.placement === "top";
    let barLeft;
    if (isCenterAligned) {
      barLeft = containerLeft + (containerWidth - barWidth) / 2;
    } else {
      const refRect = reference?.getBoundingClientRect?.();
      const leftAnchor = refRect?.left ?? (containerLeft + 12);
      barLeft = Math.max(containerLeft + 12, Math.min(leftAnchor, containerLeft + containerWidth - barWidth - 12));
    }
    barLeft = Math.max(12, Math.min(barLeft, viewportW - barWidth - 12));

    let barTop = viewportH - 80;
    if (bar) {
      const rect = bar.getBoundingClientRect();
      if (rect.top > 0) {
        barTop = rect.top;
      }
    }

    // Force layout style on popper before reading height
    const popperEl = state.elements?.popper;
    if (popperEl) {
      popperEl.style.width = `${barWidth}px`;
      popperEl.style.maxWidth = `${barWidth}px`;
      popperEl.style.boxSizing = "border-box";
    }

    const popperH =
      popperEl?.offsetHeight ||
      popperEl?.scrollHeight ||
      state.rects?.popper?.height ||
      0;

    if (state.modifiersData.popperOffsets) {
      state.modifiersData.popperOffsets.x = barLeft;
      if (popperH > 0) {
        state.modifiersData.popperOffsets.y = Math.max(10, barTop - popperH - 12);
      }
    }

    state.styles.popper = {
      ...state.styles.popper,
      width: `${barWidth}px`,
      maxWidth: `${barWidth}px`,
      transformOrigin: isCenterAligned ? "bottom center" : "bottom left",
    };
  },
  effect({ state }) {
    const reference = state.elements.reference;
    const navContainer =
      reference?.closest?.("[data-bottom-navigation]") ||
      reference?.closest?.("[data-question-action-area]") ||
      (typeof document !== "undefined"
        ? document.querySelector("[data-bottom-navigation]") ||
          document.querySelector("[data-question-action-area]:not([aria-hidden='true'])")
        : null);

    const viewportW = typeof window !== "undefined" ? window.innerWidth : 360;
    let containerWidth = viewportW;
    if (navContainer) {
      const navRect = navContainer.getBoundingClientRect();
      if (navRect.width > 0) {
        containerWidth = navRect.width;
      }
    } else {
      const rootEl = typeof document !== "undefined" ? document.getElementById("root") : null;
      if (rootEl) {
        const rootRect = rootEl.getBoundingClientRect();
        if (rootRect.width > 0 && rootRect.width < viewportW) {
          containerWidth = rootRect.width;
        }
      }
    }
    const barWidth = Math.min(containerWidth - 24, viewportW - 24, 420);
    const isCenterAligned = state.placement === "top";

    if (state.elements?.popper) {
      state.elements.popper.style.width = `${barWidth}px`;
      state.elements.popper.style.maxWidth = `${barWidth}px`;
      state.elements.popper.style.boxSizing = "border-box";
      state.elements.popper.style.transformOrigin = isCenterAligned
        ? "bottom center"
        : "bottom left";
    }
  },
};

const menuModifiers = [matchActionBarModifier];

export function ImmersionPracticeMenuIcon({
  progress = 0,
  hasNotification = false,
  attention = false,
  isLightTheme = false,
  className,
  ...rest
}) {
  const isActivelyCountingDown = progress > 0 && !hasNotification;

  return (
    <Box
      data-menu-icon-wrapper=""
      className={className}
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={{ base: "36px", sm: "40px", md: "42px" }}
      h={{ base: "36px", sm: "40px", md: "42px" }}
      minW={{ base: "36px", sm: "40px", md: "42px" }}
      maxW={{ base: "36px", sm: "40px", md: "42px" }}
      flexShrink={0}
      overflow="visible"
      {...rest}
    >
      {/* Progress bar timer - only shown when actively counting down */}
      {isActivelyCountingDown && (
        <Box
          as="svg"
          data-menu-progress-ring=""
          position="absolute"
          top="calc(50% + 1px)"
          left="50%"
          transform="translate(-50%, -50%)"
          width={{ base: "36px", sm: "40px", md: "42px" }}
          height={{ base: "36px", sm: "40px", md: "42px" }}
          viewBox="0 0 44 44"
          pointerEvents="none"
          aria-hidden="true"
          zIndex={1}
          overflow="visible"
        >
          <defs>
            <linearGradient
              id="immersionMenuProgressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
              gradientTransform="rotate(135 0.5 0.5)"
            >
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="14"
            ry="14"
            fill="none"
            stroke={
              isLightTheme
                ? "rgba(120, 94, 61, 0.18)"
                : "rgba(255,255,255,0.08)"
            }
            strokeWidth="2.5"
          />
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="14"
            ry="14"
            fill="none"
            stroke="url(#immersionMenuProgressGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
            style={{
              transition: "stroke-dashoffset 0.8s ease",
            }}
          />
        </Box>
      )}

      {/* Button Surface */}
      <Box
        data-menu-icon-btn=""
        position="relative"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w={{ base: "28px", sm: "30px", md: "32px" }}
        h={{ base: "28px", sm: "30px", md: "32px" }}
        minW={{ base: "28px", sm: "30px", md: "32px" }}
        maxW={{ base: "28px", sm: "30px", md: "32px" }}
        minH={{ base: "28px", sm: "30px", md: "32px" }}
        maxH={{ base: "28px", sm: "30px", md: "32px" }}
        borderRadius={{ base: "9px", sm: "10px", md: "11px" }}
        style={{ cornerShape: "superellipse(1.6)" }}
        bg={
          isLightTheme
            ? "rgba(235, 226, 214, 0.9)"
            : "gray.800"
        }
        borderWidth={attention ? "2px" : "1px"}
        borderColor={
          attention
            ? "teal.400"
            : isLightTheme
            ? "rgba(180, 164, 144, 0.5)"
            : "rgba(255, 255, 255, 0.12)"
        }
        boxShadow={
          isLightTheme
            ? "0 2px 0 rgba(180, 164, 144, 0.9)"
            : "0 2px 0 #313a4b"
        }
        color={isLightTheme ? "#1f1912" : "gray.100"}
        animation={
          attention
            ? "tasksAttentionPing 1.5s ease-out"
            : undefined
        }
        flexShrink={0}
      >
        <FiCompass size={16} />

        {/* Notification badge */}
        {hasNotification && (
          <Box
            position="absolute"
            top="-4px"
            right="-4px"
            minW="15px"
            h="15px"
            px="3px"
            borderRadius="full"
            bgGradient="linear(135deg, #14b8a6 0%, #06b6d4 100%)"
            color="white"
            fontSize="9px"
            fontWeight="bold"
            lineHeight="15px"
            textAlign="center"
            boxShadow={
              isLightTheme
                ? "0 0 0 2px #fff"
                : "0 0 0 2px rgba(22, 27, 34, 0.9)"
            }
            pointerEvents="none"
            aria-hidden="true"
            zIndex={2}
          >
            !
          </Box>
        )}
      </Box>
    </Box>
  );
}

function renderItemIcon(icon, isLightTheme, options = {}) {
  if (!icon) return null;
  if (
    React.isValidElement(icon) &&
    (icon.type === ImmersionPracticeMenuIcon ||
      icon.props?.["data-menu-icon-wrapper"] != null ||
      icon.props?.["data-menu-icon-btn"] != null ||
      icon.props?.progress !== undefined ||
      icon.props?.hasNotification !== undefined ||
      icon.type?.name === "ImmersionPracticeMenuIcon")
  ) {
    return icon;
  }
  return (
    <Box
      data-menu-icon-wrapper=""
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={{ base: "36px", sm: "40px", md: "42px" }}
      h={{ base: "36px", sm: "40px", md: "42px" }}
      minW={{ base: "36px", sm: "40px", md: "42px" }}
      maxW={{ base: "36px", sm: "40px", md: "42px" }}
      flexShrink={0}
      overflow="visible"
    >
      <Box
        data-menu-icon-btn=""
        position="relative"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        w={{ base: "28px", sm: "30px", md: "32px" }}
        h={{ base: "28px", sm: "30px", md: "32px" }}
        minW={{ base: "28px", sm: "30px", md: "32px" }}
        maxW={{ base: "28px", sm: "30px", md: "32px" }}
        minH={{ base: "28px", sm: "30px", md: "32px" }}
        maxH={{ base: "28px", sm: "30px", md: "32px" }}
        borderRadius={{ base: "9px", sm: "10px", md: "11px" }}
        style={{ cornerShape: "superellipse(1.6)" }}
        bg={
          options.buttonBg ||
          (isLightTheme
            ? "rgba(235, 226, 214, 0.9)"
            : "gray.800")
        }
        borderWidth="1px"
        borderColor={
          options.buttonBorderColor ||
          (isLightTheme
            ? "rgba(180, 164, 144, 0.5)"
            : "rgba(255, 255, 255, 0.12)")
        }
        boxShadow={
          options.buttonBoxShadow ||
          (isLightTheme
            ? "0 2px 0 rgba(180, 164, 144, 0.9)"
            : "0 2px 0 #313a4b")
        }
        color={options.buttonColor || (isLightTheme ? "#1f1912" : "gray.100")}
        flexShrink={0}
      >
        {icon}
      </Box>
    </Box>
  );
}

/** A single anchored menu; Modes is its second level, including on small phones. */
export default function ActivityMenu({
  label,
  modesLabel,
  modesIcon,
  backLabel,
  items,
  modes,
  selectedMode,
  onSelectMode,
  onOpen,
  triggerIcon,
  triggerProps,
  decoration,
  placement = "top-start",
}) {
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const [view, setView] = useState("actions");
  const firstModeRef = useRef(null);
  const backRef = useRef(null);
  const modesRef = useRef(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) {
      if (view === "modes") {
        (firstModeRef.current || backRef.current)?.focus();
      } else {
        modesRef.current?.focus();
      }
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }
    previousView.current = view;
  }, [view]);

  const bentoTileProps = {
    bg: isLightTheme
      ? "rgba(235, 226, 214, 0.5)"
      : "rgba(255, 255, 255, 0.04)",
    border: "1px solid",
    borderColor: isLightTheme
      ? "rgba(180, 164, 144, 0.4)"
      : "var(--app-border)",
    boxShadow: isLightTheme
      ? "0 1px 2px rgba(0, 0, 0, 0.04)"
      : "0 1px 3px rgba(0, 0, 0, 0.2)",
    _hover: {
      bg: isLightTheme
        ? "rgba(235, 226, 214, 0.95)"
        : "var(--app-surface-muted)",
      borderColor: isLightTheme
        ? "rgba(180, 164, 144, 0.7)"
        : "var(--app-border-strong)",
      textDecoration: "none",
    },
    _focus: {
      bg: isLightTheme
        ? "rgba(235, 226, 214, 0.95)"
        : "var(--app-surface-muted)",
      borderColor: isLightTheme
        ? "rgba(180, 164, 144, 0.7)"
        : "var(--app-border-strong)",
    },
    _focusVisible: {
      outline: "2px solid var(--question-tool-accent-strong, #63b3ed)",
      outlineOffset: "-2px",
    },
    borderRadius: { base: "18px", sm: "22px" },
    p: { base: 3.5, sm: 4 },
    minH: { base: "102px", sm: "108px", md: "112px" },
    h: "100%",
    w: "full",
    minW: 0,
    whiteSpace: "normal",
    textAlign: "start",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    transition:
      "background 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
    _active: {
      transform: "scale(0.97)",
    },
  };

  const fullWidthBarProps = {
    bg: isLightTheme
      ? "rgba(235, 226, 214, 0.5)"
      : "rgba(255, 255, 255, 0.04)",
    border: "1px solid",
    borderColor: isLightTheme
      ? "rgba(180, 164, 144, 0.4)"
      : "var(--app-border)",
    boxShadow: isLightTheme
      ? "0 1px 2px rgba(0, 0, 0, 0.04)"
      : "0 1px 3px rgba(0, 0, 0, 0.2)",
    _hover: {
      bg: isLightTheme
        ? "rgba(235, 226, 214, 0.95)"
        : "var(--app-surface-muted)",
      borderColor: isLightTheme
        ? "rgba(180, 164, 144, 0.7)"
        : "var(--app-border-strong)",
      textDecoration: "none",
    },
    _focus: {
      bg: isLightTheme
        ? "rgba(235, 226, 214, 0.95)"
        : "var(--app-surface-muted)",
      borderColor: isLightTheme
        ? "rgba(180, 164, 144, 0.7)"
        : "var(--app-border-strong)",
    },
    _focusVisible: {
      outline: "2px solid var(--question-tool-accent-strong, #63b3ed)",
      outlineOffset: "-2px",
    },
    borderRadius: { base: "18px", sm: "20px" },
    px: { base: 3.5, sm: 4 },
    py: { base: 3, sm: 3.5 },
    minH: { base: "54px", sm: "58px" },
    w: "full",
    minW: 0,
    whiteSpace: "normal",
    textAlign: "start",
    display: "flex",
    alignItems: "center",
    gridColumn: "1 / -1",
    transition:
      "background 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
    _active: {
      transform: "scale(0.98)",
    },
  };

  return (
    <Box position="relative" w="44px" h="44px">
      {decoration}
      <Menu
        autoSelect={false}
        placement={placement}
        strategy="fixed"
        gutter={10}
        modifiers={menuModifiers}
        onOpen={() => {
          onOpen?.();
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
          });
        }}
        onClose={() => setView("actions")}
      >
        {({ isOpen, onClose }) => (
          <>
            <MenuButton
              as={IconButton}
              icon={triggerIcon || <PiDotsNineBold size={22} color="var(--app-text-primary)" />}
              aria-label={label}
              {...triggerProps}
              variant="unstyled"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              w="44px"
              h="44px"
              minW="44px"
              p={0}
              border={0}
              borderRadius="xl"
              bg={triggerProps?.bg || "transparent !important"}
              boxShadow={triggerProps?.boxShadow || "none !important"}
              color={triggerProps?.color || "var(--app-text-primary)"}
              _hover={{ opacity: 0.7 }}
              _active={{ transform: "none" }}
              _focusVisible={{
                outline: "2px solid var(--question-tool-accent-strong)",
                outlineOffset: "1px",
              }}
            />
            <ActivityMenuPortal
              isOpen={isOpen}
              onClose={onClose}
              isLightTheme={isLightTheme}
            >
              {view === "actions" ? (
              <>
                {items.map((item) =>
                  item.id === "exitLesson" ? (
                    <MenuItem
                      key={item.id}
                      onClick={item.onClick}
                      isDisabled={item.disabled}
                      {...fullWidthBarProps}
                    >
                      <HStack spacing={2.5} minW={0} w="full">
                        {renderItemIcon(item.icon, isLightTheme, item)}
                        <Text
                          fontWeight="semibold"
                          fontSize={{ base: "13px", sm: "14px" }}
                          lineHeight="1.2"
                        >
                          {item.label}
                        </Text>
                      </HStack>
                    </MenuItem>
                  ) : (
                    <MenuItem
                      key={item.id}
                      onClick={item.onClick}
                      isDisabled={item.disabled}
                      {...bentoTileProps}
                    >
                      <Box mb={{ base: 1, sm: 1.5 }} flexShrink={0}>
                        {renderItemIcon(item.icon, isLightTheme, item)}
                      </Box>
                      <Text
                        fontWeight="semibold"
                        fontSize={{ base: "13px", sm: "14px" }}
                        lineHeight="1.25"
                        noOfLines={2}
                        wordBreak="break-word"
                        textAlign="start"
                        w="full"
                      >
                        {item.label}
                      </Text>
                    </MenuItem>
                  )
                )}
                <MenuItem
                  ref={modesRef}
                  closeOnSelect={false}
                  onClick={() => setView("modes")}
                  {...fullWidthBarProps}
                >
                  <HStack justify="space-between" w="full" minW={0} spacing={2.5}>
                    <HStack spacing={2.5} minW={0} flex={1}>
                      {renderItemIcon(modesIcon, isLightTheme)}
                      <Text
                        fontWeight="semibold"
                        fontSize={{ base: "13px", sm: "14px" }}
                        lineHeight="1.2"
                        noOfLines={1}
                        textAlign="start"
                      >
                        {modesLabel}
                      </Text>
                    </HStack>
                    <ChevronRightIcon boxSize={{ base: 5, md: 5 }} flexShrink={0} />
                  </HStack>
                </MenuItem>
              </>
            ) : (
              <>
                {modes.map((mode, index) => {
                  const ModeIcon = mode.icon;
                  const selected = mode.id === selectedMode;
                  return (
                    <MenuItem
                      key={mode.id}
                      ref={index === 0 ? firstModeRef : undefined}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onSelectMode(mode.id)}
                      {...bentoTileProps}
                      gridColumn={
                        modes.length % 2 === 1 && index === modes.length - 1
                          ? "1 / -1"
                          : undefined
                      }
                      borderWidth={selected ? "2.5px" : "1px"}
                      borderColor={
                        selected
                          ? isLightTheme
                            ? "teal.500"
                            : "teal.400"
                          : bentoTileProps.borderColor
                      }
                      _hover={{
                        ...bentoTileProps._hover,
                        borderWidth: selected ? "2.5px" : "1px",
                        borderColor: selected
                          ? isLightTheme
                            ? "teal.500"
                            : "teal.400"
                          : bentoTileProps._hover.borderColor,
                      }}
                      _focus={{
                        ...bentoTileProps._focus,
                        borderWidth: selected ? "2.5px" : "1px",
                        borderColor: selected
                          ? isLightTheme
                            ? "teal.500"
                            : "teal.400"
                          : bentoTileProps._focus.borderColor,
                      }}
                    >
                      <Box mb={{ base: 1, sm: 1.5 }} flexShrink={0}>
                        {renderItemIcon(<ModeIcon size={16} />, isLightTheme)}
                      </Box>
                      <Text
                        fontSize={{ base: "13px", sm: "14px" }}
                        fontWeight={selected ? "bold" : "600"}
                        lineHeight="1.25"
                        noOfLines={2}
                        wordBreak="break-word"
                        textAlign="start"
                        w="full"
                      >
                        {mode.label}
                      </Text>
                    </MenuItem>
                  );
                })}
                <MenuItem
                  ref={backRef}
                  closeOnSelect={false}
                  onClick={() => setView("actions")}
                  {...fullWidthBarProps}
                >
                  <HStack spacing={2.5} minW={0} w="full">
                    {renderItemIcon(
                      <ArrowBackIcon boxSize={{ base: 3.5, md: 3.5 }} />,
                      isLightTheme,
                    )}
                    <Text
                      fontWeight="semibold"
                      fontSize={{ base: "13px", sm: "14px" }}
                      lineHeight="1.2"
                    >
                      {backLabel}
                    </Text>
                  </HStack>
                </MenuItem>
              </>
            )}
            </ActivityMenuPortal>
      </>
    )}
  </Menu>
    </Box>
  );
}
