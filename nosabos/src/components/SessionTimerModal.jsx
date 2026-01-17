import React, { useMemo, useCallback } from "react";
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
import useSoundSettings, { SOUNDS } from "../hooks/useSoundSettings";

// Analog clock component that visualizes the selected duration
function ClockVisual({ minutes, rotationMinutes = 120, maxMinutes = 240 }) {
  const parsedMinutes = Math.max(0, Math.min(maxMinutes, Number(minutes) || 0));

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
          stroke={isQuarter ? "#38B2AC" : "#4A5568"}
          strokeWidth={isQuarter ? 2 : 1}
          strokeLinecap="round"
        />
      );
    }
    return items;
  }, []);

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

  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <Box
        position="relative"
        width="160px"
        height="160px"
        borderRadius="full"
        bg="gray.800"
        boxShadow="0 0 30px rgba(56, 178, 172, 0.3), inset 0 0 20px rgba(0,0,0,0.5)"
        border="3px solid"
        borderColor="gray.700"
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
              <stop offset="0%" stopColor="rgba(56, 178, 172, 0.4)" />
              <stop offset="100%" stopColor="rgba(49, 151, 149, 0.6)" />
            </linearGradient>
            <linearGradient
              id="arcGradient2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(21, 53, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(7, 0, 198, 0.7)" />
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
          <circle cx="50" cy="50" r="4" fill="#38B2AC" filter="url(#glow)" />

          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2={handX}
            y2={handY}
            stroke="#38B2AC"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transition: "all 0.3s ease-out",
            }}
          />

          {/* Hand tip dot */}
          <circle
            cx={handX}
            cy={handY}
            r="3"
            fill="#81E6D9"
            filter="url(#glow)"
            style={{
              transition: "all 0.3s ease-out",
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
            color="teal.300"
            textShadow="0 0 10px rgba(56, 178, 172, 0.5)"
          >
            {parsedMinutes}m
          </Text>
        </Box>
      </Box>
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
}) {
  const presets = [10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240];
  const playSound = useSoundSettings((s) => s.playSound);
  const handleClose = useCallback(() => {
    playSound(SOUNDS.SELECT);
    onClose?.();
  }, [onClose, playSound]);
  const handleStart = useCallback(() => {
    playSound(SOUNDS.SUBMIT_ACTION);
    onStart?.();
  }, [onStart, playSound]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="gray.900"
        color="gray.100"
        borderColor="gray.700"
        border="1px solid"
        rounded="2xl"
        shadow="xl"
      >
        <ModalHeader>
          <HStack spacing={2} align="center">
            <Box as={FiClock} aria-hidden color="teal.400" />
            <Text>{t.timer_modal_title || "Session timer"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton onClick={handleClose} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="gray.400">
              {t.timer_modal_description || "Set how long you want to focus."}
            </Text>

            {/* Clock visual */}
            <ClockVisual minutes={minutes} />

            {helper}

            <FormControl>
              <FormLabel>{t.timer_modal_minutes_label || "Minutes"}</FormLabel>
              <Input
                type="number"
                min={1}
                max={240}
                value={minutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 240) {
                    onMinutesChange?.("240");
                  } else {
                    onMinutesChange?.(e.target.value);
                  }
                }}
                bg="gray.800"
                borderColor="gray.600"
                _hover={{ borderColor: "gray.500" }}
                _focus={{
                  borderColor: "teal.400",
                  boxShadow: "0 0 0 1px #38B2AC",
                }}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t.timer_modal_max_hint || "max 240 minutes (4 hours)"}
              </Text>
            </FormControl>

            <Box>
              <Text fontSize="sm" mb={2} color="gray.400">
                {t.timer_modal_quick_picks || "Quick picks"}
              </Text>
              <HStack spacing={2} wrap="wrap">
                {presets.map((preset) => {
                  const isActive = Number(minutes) === preset;
                  return (
                    <Button
                      key={preset}
                      size="sm"
                      variant={isActive ? "solid" : "outline"}
                      colorScheme="teal"
                      onClick={() => {
                        playSound(SOUNDS.SELECT);
                        onMinutesChange?.(String(preset));
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
          borderColor="gray.800"
        >
          <Button colorScheme="teal" onClick={handleStart}>
            {isRunning
              ? t.timer_modal_restart || "Restart timer"
              : t.timer_modal_start || "Start timer"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
