import React, { useEffect, useRef, useState } from "react";
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
import { ArrowBackIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { PiDotsNineBold } from "react-icons/pi";
import { FiCompass } from "react-icons/fi";
import { useThemeStore } from "../useThemeStore";

const matchActionBarModifier = {
  name: "matchActionBar",
  enabled: true,
  phase: "afterMain",
  requires: ["popperOffsets"],
  fn({ state }) {
    const reference = state.elements.reference;
    let bar = null;
    if (reference) {
      bar =
        reference.closest?.(".bottombar-glass") ||
        reference.closest?.("[data-question-action-area]")?.querySelector(".bottombar-glass") ||
        reference.closest?.("[data-question-action-area]") ||
        reference.closest?.("[data-bottom-navigation]")?.querySelector(".bottombar-glass") ||
        reference.closest?.("[data-bottom-navigation]");
    }
    if (!bar && typeof document !== "undefined") {
      bar =
        document.querySelector("[data-question-action-area]:not([aria-hidden='true']) .bottombar-glass") ||
        document.querySelector("[data-question-action-area]:not([aria-hidden='true'])") ||
        document.querySelector("[data-bottom-navigation] .bottombar-glass") ||
        document.querySelector("[data-bottom-navigation]") ||
        document.querySelector(".bottombar-glass");
    }

    let barLeft = 8;
    let barWidth = typeof window !== "undefined" ? window.innerWidth - 16 : 360;
    let barTop = typeof window !== "undefined" ? window.innerHeight - 80 : 600;

    if (bar) {
      const rect = bar.getBoundingClientRect();
      barLeft = rect.left;
      barWidth = rect.width;
      barTop = rect.top;
    } else if (typeof window !== "undefined") {
      const screenW = window.innerWidth;
      barWidth = Math.min(screenW - 16, 464);
      barLeft = Math.max(8, (screenW - barWidth) / 2);
    }

    if (state.modifiersData.popperOffsets) {
      state.modifiersData.popperOffsets.x = barLeft;
      const popperH =
        state.rects?.popper?.height ||
        state.elements?.popper?.offsetHeight ||
        0;
      if (popperH) {
        state.modifiersData.popperOffsets.y = Math.max(10, barTop - popperH - 10);
      }
    }

    state.styles.popper = {
      ...state.styles.popper,
      width: `${barWidth}px`,
      maxWidth: `${barWidth}px`,
    };
  },
  effect: ({ state }) => () => {
    const reference = state.elements.reference;
    let bar = null;
    if (reference) {
      bar =
        reference.closest?.(".bottombar-glass") ||
        reference.closest?.("[data-question-action-area]")?.querySelector(".bottombar-glass") ||
        reference.closest?.("[data-question-action-area]") ||
        reference.closest?.("[data-bottom-navigation]")?.querySelector(".bottombar-glass") ||
        reference.closest?.("[data-bottom-navigation]");
    }
    if (!bar && typeof document !== "undefined") {
      bar =
        document.querySelector("[data-question-action-area]:not([aria-hidden='true']) .bottombar-glass") ||
        document.querySelector("[data-question-action-area]:not([aria-hidden='true'])") ||
        document.querySelector("[data-bottom-navigation] .bottombar-glass") ||
        document.querySelector("[data-bottom-navigation]") ||
        document.querySelector(".bottombar-glass");
    }
    if (bar && state.elements?.popper) {
      const rect = bar.getBoundingClientRect();
      state.elements.popper.style.width = `${rect.width}px`;
      state.elements.popper.style.maxWidth = `${rect.width}px`;
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
      w={{ base: "44px", md: "38px" }}
      h={{ base: "44px", md: "38px" }}
      minW={{ base: "44px", md: "38px" }}
      maxW={{ base: "44px", md: "38px" }}
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
          width={{ base: "44px", md: "38px" }}
          height={{ base: "44px", md: "38px" }}
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
        w={{ base: "32px", md: "28px" }}
        h={{ base: "32px", md: "28px" }}
        minW={{ base: "32px", md: "28px" }}
        maxW={{ base: "32px", md: "28px" }}
        minH={{ base: "32px", md: "28px" }}
        maxH={{ base: "32px", md: "28px" }}
        borderRadius={{ base: "11px", md: "9px" }}
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
      w={{ base: "44px", md: "38px" }}
      h={{ base: "44px", md: "38px" }}
      minW={{ base: "44px", md: "38px" }}
      maxW={{ base: "44px", md: "38px" }}
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
        w={{ base: "32px", md: "28px" }}
        h={{ base: "32px", md: "28px" }}
        minW={{ base: "32px", md: "28px" }}
        maxW={{ base: "32px", md: "28px" }}
        minH={{ base: "32px", md: "28px" }}
        maxH={{ base: "32px", md: "28px" }}
        borderRadius={{ base: "11px", md: "9px" }}
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
}) {
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const [view, setView] = useState("actions");
  const backRef = useRef(null);
  const modesRef = useRef(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) {
      (view === "modes" ? backRef : modesRef).current?.focus();
    }
    previousView.current = view;
  }, [view]);

  const menuItemProps = {
    bg: "transparent",
    _hover: { bg: "var(--app-surface-muted)" },
    _focus: { bg: "var(--app-surface-muted)" },
    _focusVisible: {
      outline: "2px solid var(--question-tool-accent-strong, #63b3ed)",
      outlineOffset: "-2px",
    },
    borderRadius: "lg",
    px: { base: 4, md: 3.5 },
    py: { base: 2.5, md: 2 },
    minH: { base: "52px", md: "46px" },
    w: "full",
  };

  return (
    <Box position="relative" w="44px" h="44px">
      {decoration}
      <Menu
        placement="top-start"
        strategy="fixed"
        isLazy
        gutter={10}
        modifiers={menuModifiers}
        onOpen={onOpen}
        onClose={() => setView("actions")}
      >
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
          bg="transparent !important"
          boxShadow="none !important"
          color={triggerProps?.color || "var(--app-text-primary)"}
          _hover={{ opacity: 0.7 }}
          _active={{ transform: "none" }}
          _focusVisible={{
            outline: "2px solid var(--question-tool-accent-strong)",
            outlineOffset: "1px",
          }}
        />
        <Portal>
          <MenuList
            bg="var(--app-surface-elevated)"
            color="var(--app-text-primary)"
            borderColor="var(--app-border)"
            boxShadow="var(--app-shadow-soft)"
            w="100%"
            maxW="100%"
            minW={0}
            maxH={{
              base: "min(560px, calc(100dvh - 96px))",
              md: "min(480px, calc(100dvh - 120px))",
            }}
            overflowY="auto"
            zIndex="popover"
            p={{ base: 2.5, md: 2 }}
            borderRadius="28px"
            display="flex"
            flexDirection="column"
            gap={{ base: 1.5, md: 1 }}
            sx={{
              "& .chakra-menu__icon, & [data-menu-icon-wrapper]": {
                width: { base: "44px !important", md: "38px !important" },
                height: { base: "44px !important", md: "38px !important" },
                minWidth: { base: "44px !important", md: "38px !important" },
                maxWidth: { base: "44px !important", md: "38px !important" },
                marginInlineEnd: { base: 3, md: 2.5 },
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "visible",
                position: "relative",
              },
              "& [data-menu-icon-btn]": {
                width: { base: "32px !important", md: "28px !important" },
                height: { base: "32px !important", md: "28px !important" },
                minWidth: { base: "32px !important", md: "28px !important" },
                maxWidth: { base: "32px !important", md: "28px !important" },
                minHeight: { base: "32px !important", md: "28px !important" },
                maxHeight: { base: "32px !important", md: "28px !important" },
                borderRadius: { base: "11px !important", md: "9px !important" },
                display: "inline-flex !important",
                alignItems: "center !important",
                justifyContent: "center !important",
                boxSizing: "border-box",
                flexShrink: 0,
              },
              "& [data-menu-icon-btn] > svg": {
                width: { base: "16px !important", md: "14px !important" },
                height: { base: "16px !important", md: "14px !important" },
                fontSize: { base: "16px !important", md: "14px !important" },
              },
            }}
          >
            {view === "actions" ? (
              <>
                {items.map((item) => (
                  <MenuItem
                    key={item.id}
                    icon={renderItemIcon(item.icon, isLightTheme, item)}
                    onClick={item.onClick}
                    isDisabled={item.disabled}
                    {...menuItemProps}
                  >
                    <Text fontWeight="semibold" fontSize={{ base: "md", md: "sm" }}>
                      {item.label}
                    </Text>
                  </MenuItem>
                ))}
                <MenuItem
                  ref={modesRef}
                  closeOnSelect={false}
                  onClick={() => setView("modes")}
                  {...menuItemProps}
                  icon={renderItemIcon(modesIcon, isLightTheme)}
                >
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="semibold" fontSize={{ base: "md", md: "sm" }}>{modesLabel}</Text>
                    <ChevronRightIcon boxSize={{ base: 6, md: 5 }} />
                  </HStack>
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem
                  ref={backRef}
                  closeOnSelect={false}
                  onClick={() => setView("actions")}
                  icon={renderItemIcon(<ArrowBackIcon boxSize={{ base: 4, md: 3.5 }} />, isLightTheme)}
                  {...menuItemProps}
                >
                  <Text fontWeight="semibold" fontSize={{ base: "md", md: "sm" }}>{backLabel}</Text>
                </MenuItem>
                {modes.map((mode) => {
                  const ModeIcon = mode.icon;
                  const selected = mode.id === selectedMode;
                  return (
                    <MenuItem
                      key={mode.id}
                      icon={renderItemIcon(<ModeIcon size={16} />, isLightTheme, {
                        buttonBg: selected
                          ? isLightTheme
                            ? "teal.50"
                            : "teal.900"
                          : undefined,
                        buttonBorderColor: selected ? "teal.400" : undefined,
                      })}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onSelectMode(mode.id)}
                      {...menuItemProps}
                      bg={selected ? "var(--app-surface-muted)" : "transparent"}
                      fontWeight={selected ? "bold" : "normal"}
                    >
                      <Text
                        fontSize={{ base: "md", md: "sm" }}
                        fontWeight={selected ? "bold" : "normal"}
                      >
                        {mode.label}
                      </Text>
                    </MenuItem>
                  );
                })}
              </>
            )}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
}
