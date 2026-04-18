import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import { useThemeStore } from "../useThemeStore";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_OVERLAY = "var(--app-overlay)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Helper: get angle in degrees (0=12 o'clock, clockwise) from pointer to element center
function getAngleFromCenter(clientX, clientY, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rad = Math.atan2(clientX - cx, -(clientY - cy)); // 0 = up, clockwise positive
  return ((rad * 180) / Math.PI + 360) % 360;
}

// Analog clock component that visualizes the selected duration
const STEP = 5; // minute increment per tick

function ClockVisual({
  minutes,
  onMinutesChange,
  rotationMinutes = 120,
  maxMinutes = 240,
  playSliderTick,
  isLightTheme = false,
}) {
  const parsedMinutes = Math.max(0, Math.min(maxMinutes, Number(minutes) || 0));
  const clockRef = useRef(null);
  const dragState = useRef(null);

  // Keep stable refs so the effect doesn't tear down on every render
  const minutesRef = useRef(minutes);
  minutesRef.current = minutes;
  const onMinutesChangeRef = useRef(onMinutesChange);
  onMinutesChangeRef.current = onMinutesChange;
  const playSliderTickRef = useRef(playSliderTick);
  playSliderTickRef.current = playSliderTick;

  // Circular drag gesture handling — stable effect, runs once on mount
  useEffect(() => {
    const el = clockRef.current;
    if (!el) return;

    const onPointerMove = (e) => {
      const state = dragState.current;
      if (!state) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const currentAngle = getAngleFromCenter(clientX, clientY, state.rect);

      // Calculate shortest angular delta (-180 to 180)
      let delta = currentAngle - state.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      state.lastAngle = currentAngle;

      // Convert angular delta to minutes (360° = rotationMinutes)
      const minuteDelta = (delta / 360) * rotationMinutes;
      state.accumMinutes = Math.max(
        0,
        Math.min(maxMinutes, state.accumMinutes + minuteDelta),
      );

      // Snap to nearest STEP
      const snapped = Math.round(state.accumMinutes / STEP) * STEP;
      if (snapped !== state.lastEmitted) {
        state.lastEmitted = snapped;
        onMinutesChangeRef.current?.(String(snapped));
        playSliderTickRef.current?.(snapped, STEP, maxMinutes);
      }
    };

    const onPointerUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };

    const onPointerDown = (e) => {
      if (!onMinutesChangeRef.current) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const current = Math.max(
        0,
        Math.min(maxMinutes, Number(minutesRef.current) || 0),
      );

      dragState.current = {
        rect,
        lastAngle: getAngleFromCenter(clientX, clientY, rect),
        accumMinutes: current,
        lastEmitted: current,
      };

      window.addEventListener("mousemove", onPointerMove, { passive: false });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);
    };

    el.addEventListener("mousedown", onPointerDown);
    el.addEventListener("touchstart", onPointerDown, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onPointerDown);
      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [rotationMinutes, maxMinutes]);

  // Calculate how many full rotations and the remainder
  const fullRotations = Math.floor(parsedMinutes / rotationMinutes);
  const remainder = parsedMinutes % rotationMinutes;
  const isFullCircle = parsedMinutes >= rotationMinutes && remainder === 0;

  // Calculate angle for the minute hand (full rotation = rotationMinutes)
  const handMinutes = isFullCircle
    ? rotationMinutes
    : remainder || parsedMinutes;
  const angle = (handMinutes / rotationMinutes) * 360 - 90; // -90 to start from 12 o'clock

  // Generate tick marks for the clock face
  const ticks = useMemo(() => {
    const items = [];
    for (let i = 0; i < 12; i++) {
      const tickAngle = (i / 12) * 360 - 90;
      const isQuarter = i % 3 === 0;
      const outerRadius = 45;
      const innerRadius = isQuarter ? 38 : 41;

      const x1 = 50 + innerRadius * Math.cos((tickAngle * Math.PI) / 180);
      const y1 = 50 + innerRadius * Math.sin((tickAngle * Math.PI) / 180);
      const x2 = 50 + outerRadius * Math.cos((tickAngle * Math.PI) / 180);
      const y2 = 50 + outerRadius * Math.sin((tickAngle * Math.PI) / 180);

      items.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={
            isQuarter
              ? isLightTheme
                ? "#43a19d"
                : "#38B2AC"
              : isLightTheme
                ? "#6d6457"
                : "#4A5568"
          }
          strokeWidth={isQuarter ? 2 : 1.25}
          strokeLinecap="round"
        />,
      );
    }
    return items;
  }, [isLightTheme]);

  // Arc path generator for a given portion of the circle
  const createArcPath = (startMin, endMin, radius) => {
    if (endMin <= startMin) return "";

    const startAngle = (startMin / rotationMinutes) * 360 - 90;
    const endAngle = (endMin / rotationMinutes) * 360 - 90;
    const cx = 50;
    const cy = 50;

    const startX = cx + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = cy + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = cx + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = cy + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArc = endMin - startMin > rotationMinutes / 2 ? 1 : 0;

    return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  };

  // First layer arc (teal) - up to first 120 minutes
  const firstLayerMinutes = Math.min(parsedMinutes, rotationMinutes);
  const firstArcPath = useMemo(() => {
    if (parsedMinutes === 0) return "";
    if (parsedMinutes >= rotationMinutes) {
      // Full circle for first layer
      return null; // We'll render a full circle instead
    }
    return createArcPath(0, firstLayerMinutes, 35);
  }, [parsedMinutes, firstLayerMinutes, rotationMinutes]);

  // Second layer arc (purple/magenta) - 120-240 minutes
  const secondLayerMinutes = parsedMinutes > rotationMinutes ? remainder : 0;
  const secondArcPath = useMemo(() => {
    if (parsedMinutes <= rotationMinutes) return "";
    if (parsedMinutes >= rotationMinutes * 2) {
      // Full circle for second layer
      return null;
    }
    return createArcPath(0, secondLayerMinutes, 35);
  }, [parsedMinutes, secondLayerMinutes, rotationMinutes]);

  // Hand end point
  const handLength = 32;
  const handX = 50 + handLength * Math.cos((angle * Math.PI) / 180);
  const handY = 50 + handLength * Math.sin((angle * Math.PI) / 180);
  const clockFaceBackground = isLightTheme
    ? "radial-gradient(circle at 50% 38%, rgba(255, 252, 247, 0.98) 0%, rgba(244, 236, 225, 0.96) 64%, rgba(232, 219, 203, 0.94) 100%)"
    : "gray.800";
  const clockBorderColor = isLightTheme ? APP_BORDER_STRONG : "gray.700";
  const clockShadow = isLightTheme
    ? "0 10px 24px rgba(120, 94, 61, 0.08)"
    : "0 0 30px rgba(56, 178, 172, 0.3), inset 0 0 20px rgba(0,0,0,0.5)";
  const accentColor = isLightTheme ? "#43a19d" : "#38B2AC";
  const accentTipColor = isLightTheme ? "#6bd3cb" : "#81E6D9";
  const centerTextColor = isLightTheme ? "#3f9f9b" : "#4FD1C5";

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      py={4}
    >
      <Box
        ref={clockRef}
        position="relative"
        width="160px"
        height="160px"
        borderRadius="full"
        bg={clockFaceBackground}
        boxShadow={clockShadow}
        border="3px solid"
        borderColor={clockBorderColor}
        cursor={onMinutesChange ? "grab" : "default"}
        userSelect="none"
        style={onMinutesChange ? { touchAction: "none" } : undefined}
        _active={onMinutesChange ? { cursor: "grabbing" } : {}}
      >
        <svg
          viewBox="0 0 100 100"
          style={{
            width: "100%",
            height: "100%",
            transform: "rotate(0deg)",
          }}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id="arcGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={
                  isLightTheme
                    ? "rgba(93, 196, 180, 0.32)"
                    : "rgba(56, 178, 172, 0.4)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  isLightTheme
                    ? "rgba(67, 161, 157, 0.52)"
                    : "rgba(49, 151, 149, 0.6)"
                }
              />
            </linearGradient>
            <linearGradient
              id="arcGradient2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={
                  isLightTheme
                    ? "rgba(137, 146, 228, 0.34)"
                    : "rgba(21, 53, 255, 0.5)"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  isLightTheme
                    ? "rgba(109, 116, 203, 0.5)"
                    : "rgba(7, 0, 198, 0.7)"
                }
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* First layer - teal (0-120 minutes) */}
          {parsedMinutes >= rotationMinutes ? (
            // Full circle for first layer
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="url(#arcGradient)"
              opacity={0.8}
            />
          ) : parsedMinutes > 0 && firstArcPath ? (
            <path d={firstArcPath} fill="url(#arcGradient)" opacity={0.8} />
          ) : null}

          {/* Second layer - purple (120-240 minutes) */}
          {parsedMinutes >= rotationMinutes * 2 ? (
            // Full circle for second layer
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="url(#arcGradient2)"
              opacity={0.85}
            />
          ) : secondArcPath ? (
            <path d={secondArcPath} fill="url(#arcGradient2)" opacity={0.85} />
          ) : null}

          {/* Clock face ticks */}
          {ticks}

          {/* Center circle */}
          <circle
            cx="50"
            cy="50"
            r="4"
            fill={accentColor}
            filter={isLightTheme ? undefined : "url(#glow)"}
          />

          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2={handX}
            y2={handY}
            stroke={accentColor}
            strokeWidth="3"
            strokeLinecap="round"
            filter={isLightTheme ? undefined : "url(#glow)"}
            style={{
              transition: dragState.current ? "none" : "all 0.3s ease-out",
            }}
          />

          {/* Hand tip dot */}
          <circle
            cx={handX}
            cy={handY}
            r="3"
            fill={accentTipColor}
            filter={isLightTheme ? undefined : "url(#glow)"}
            style={{
              transition: dragState.current ? "none" : "all 0.3s ease-out",
            }}
          />
        </svg>

        {/* Center text showing minutes */}
        <Box
          position="absolute"
          bottom="25px"
          left="50%"
          transform="translateX(-50%)"
          textAlign="center"
        >
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={centerTextColor}
            textShadow={
              isLightTheme ? "none" : "0 0 10px rgba(56, 178, 172, 0.5)"
            }
          >
            {parsedMinutes}m
          </Text>
        </Box>
      </Box>
      {onMinutesChange && (
        <Text
          fontSize="xs"
          color={isLightTheme ? APP_TEXT_MUTED : "gray.500"}
          mt={2}
        >
          Drag around the clock to set time
        </Text>
      )}
    </Box>
  );
}

export default function SessionTimerModal({
  isOpen,
  onClose,
  minutes,
  onMinutesChange,
  onStart,
  isRunning,
  helper,
  t = {},
  useSharedBackdrop = false,
}) {
  const presets = [20, 30, 45, 60, 90, 120, 150, 180, 240];
  const playSound = useSoundSettings((s) => s.playSound);
  const playSliderTick = useSoundSettings((s) => s.playSliderTick);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  // All editing (typing, presets, clock drag) updates only this local draft
  // so interactions stay instant. The parent App is synced at commit points:
  // close and start. This avoids an App re-render on every drag tick or
  // preset click.
  const [localMinutes, setLocalMinutes] = useState(() => minutes);
  useEffect(() => {
    if (isOpen) setLocalMinutes(minutes);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const deferPostAction = useCallback((task) => {
    if (typeof task !== "function") return;

    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        task();
      });
    });
  }, []);

  const handleLocalMinutesChange = useCallback((value) => {
    setLocalMinutes(value);
  }, []);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value;
    const val = Number(raw);
    setLocalMinutes(val > 240 ? "240" : raw);
  }, []);

  const handleClose = useCallback(() => {
    onClose?.();
    deferPostAction(() => {
      onMinutesChange?.(localMinutes);
      void playSound(selectSound);
    });
  }, [deferPostAction, onClose, onMinutesChange, localMinutes, playSound]);

  const handleStart = useCallback(() => {
    onStart?.(localMinutes);
    deferPostAction(() => {
      onMinutesChange?.(localMinutes);
      void playSound(submitActionSound);
    });
  }, [deferPostAction, onMinutesChange, onStart, localMinutes, playSound]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="lg"
      motionPreset="none"
      returnFocusOnClose={false}
    >
      <ModalOverlay
        bg={useSharedBackdrop ? "transparent" : isLightTheme ? APP_OVERLAY : "blackAlpha.700"}
        backdropFilter={useSharedBackdrop ? undefined : isLightTheme ? "blur(4px)" : undefined}
      />
      <ModalContent
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        border="1px solid"
        rounded="2xl"
        shadow={isLightTheme ? APP_SHADOW : "xl"}
      >
        <ModalHeader>
          <HStack spacing={2} align="center">
            <Box
              as={FiClock}
              aria-hidden
              color={isLightTheme ? "#3f9f9b" : "teal.400"}
            />
            <Text>{t.timer_modal_title || "Session timer"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          onClick={handleClose}
          color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
          _hover={{
            bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
          }}
          _focusVisible={{
            boxShadow: isLightTheme
              ? "0 0 0 2px rgba(63, 159, 155, 0.2)"
              : undefined,
          }}
        />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}>
              {t.timer_modal_description || "Set how long you want to focus."}
            </Text>

            {/* Clock visual — drag around the face to adjust time */}
            <ClockVisual
              minutes={localMinutes}
              onMinutesChange={handleLocalMinutesChange}
              playSliderTick={playSliderTick}
              isLightTheme={isLightTheme}
            />

            {helper}

            <FormControl>
              <FormLabel color={isLightTheme ? APP_TEXT_PRIMARY : undefined}>
                {t.timer_modal_minutes_label || "Minutes"}
              </FormLabel>
              <Input
                type="number"
                min={0}
                max={240}
                value={localMinutes}
                onChange={handleInputChange}
                bg={isLightTheme ? APP_SURFACE : "gray.800"}
                color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                borderColor={isLightTheme ? APP_BORDER_STRONG : "gray.600"}
                _hover={{
                  borderColor: isLightTheme ? APP_BORDER_STRONG : "gray.500",
                }}
                _focus={{
                  borderColor: "teal.400",
                  boxShadow: isLightTheme
                    ? "0 0 0 1px rgba(63, 159, 155, 0.78)"
                    : "0 0 0 1px #38B2AC",
                }}
              />
              <Text
                fontSize="xs"
                color={isLightTheme ? APP_TEXT_MUTED : "gray.500"}
                mt={1}
              >
                {t.timer_modal_max_hint || "max 240 minutes (4 hours)"}
              </Text>
            </FormControl>

            <Box>
              <Text
                fontSize="sm"
                mb={2}
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              >
                {t.timer_modal_quick_picks || "Quick picks"}
              </Text>
              <HStack spacing={2} wrap="wrap">
                {presets.map((preset) => {
                  const isActive = Number(localMinutes) === preset;
                  return (
                    <Button
                      key={preset}
                      size="sm"
                      variant={
                        isLightTheme ? "solid" : isActive ? "solid" : "outline"
                      }
                      colorScheme={isLightTheme ? undefined : "teal"}
                      bg={
                        isLightTheme
                          ? isActive
                            ? "#3f9f9b"
                            : APP_SURFACE_ELEVATED
                          : undefined
                      }
                      color={
                        isLightTheme
                          ? isActive
                            ? "white"
                            : APP_TEXT_PRIMARY
                          : undefined
                      }
                      border="1px solid"
                      borderColor={
                        isLightTheme
                          ? isActive
                            ? "rgba(63, 159, 155, 0.7)"
                            : APP_BORDER
                          : undefined
                      }
                      boxShadow={
                        isLightTheme && isActive
                          ? "0 6px 0 rgba(36, 91, 89, 0.18)"
                          : "none"
                      }
                      _hover={
                        isLightTheme
                          ? {
                              bg: isActive ? "#398f8b" : APP_SURFACE_MUTED,
                            }
                          : undefined
                      }
                      onClick={() => {
                        playSound(selectSound);
                        handleLocalMinutesChange(String(preset));
                      }}
                    >
                      {preset}m
                    </Button>
                  );
                })}
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          gap={3}
          flexWrap="wrap"
          borderTop="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.800"}
        >
          <Button
            variant="ghost"
            colorScheme="gray"
            color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
            onClick={handleClose}
          >
            {t.timer_modal_close || "Close"}
          </Button>
          <Button
            colorScheme={isLightTheme ? undefined : "teal"}
            bg={isLightTheme ? "#3f9f9b" : undefined}
            color={isLightTheme ? "white" : undefined}
            _hover={isLightTheme ? { bg: "#398f8b" } : undefined}
            onClick={handleStart}
            boxShadow={"0px 4px 0px teal"}
          >
            {isRunning
              ? t.timer_modal_restart || "Restart timer"
              : t.timer_modal_start || "Start timer"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
