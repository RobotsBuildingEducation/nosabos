import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";

const CONTROL_CONFIG = [
  { key: "width", label: "Width", min: 160, max: 420, step: 4, unit: "px" },
  { key: "height", label: "Height", min: 140, max: 360, step: 4, unit: "px" },
  { key: "radius", label: "Radius", min: 0, max: 140, step: 2, unit: "px" },
  {
    key: "superellipse",
    label: "Superellipse",
    min: 0.5,
    max: 5,
    step: 0.01,
    unit: "",
    precision: 2,
  },
];

function SquircleControl({ label, value, min, max, step, unit, precision, onChange }) {
  const displayValue = typeof precision === "number" ? value.toFixed(precision) : value;

  return (
    <Box w="100%">
      <Flex align="baseline" justify="space-between" gap={4} mb={2}>
        <Text color="#24324a" fontSize="sm" fontWeight="700">
          {label}
        </Text>
        <Text color="#5c6f8f" fontSize="sm" fontVariantNumeric="tabular-nums">
          {displayValue}
          {unit}
        </Text>
      </Flex>
      <Slider
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      >
        <SliderTrack bg="#dbe4f0" h="8px" borderRadius="999px">
          <SliderFilledTrack bg="#2f80ed" />
        </SliderTrack>
        <SliderThumb
          boxSize={5}
          border="2px solid"
          borderColor="#ffffff"
          boxShadow="0 6px 16px rgba(47, 128, 237, 0.28)"
        />
      </Slider>
    </Box>
  );
}

export default function SquirclePlayground() {
  const [settings, setSettings] = useState({
    width: 280,
    height: 220,
    radius: 56,
    superellipse: 2.77,
  });

  const previewStyle = useMemo(
    () => ({
      width: `${settings.width}px`,
      height: `${settings.height}px`,
      borderRadius: `${settings.radius}px`,
      cornerShape: `superellipse(${settings.superellipse})`,
    }),
    [settings],
  );

  const updateSetting = (key) => (value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <Flex
      minH="100vh"
      bg="#eef3f8"
      color="#162033"
      align="center"
      justify="center"
      px={{ base: 4, md: 8 }}
      py={{ base: 8, md: 12 }}
    >
      <Flex
        w="min(100%, 960px)"
        align="stretch"
        justify="center"
        gap={{ base: 8, lg: 12 }}
        direction={{ base: "column", lg: "row" }}
      >
        <VStack align="stretch" flex="1" spacing={6}>
          <Box textAlign="left">
            <Heading as="h1" size="lg" letterSpacing="0" mb={2}>
              Squircle
            </Heading>
            <Text color="#5c6f8f" fontSize="md">
              Shape a simple card with live superellipse and dimension controls.
            </Text>
          </Box>

          <VStack
            align="stretch"
            bg="#ffffff"
            border="1px solid"
            borderColor="#dde6f2"
            borderRadius="8px"
            boxShadow="0 18px 48px rgba(18, 31, 53, 0.08)"
            p={{ base: 5, md: 6 }}
            spacing={6}
          >
            {CONTROL_CONFIG.map((control) => (
              <SquircleControl
                key={control.key}
                {...control}
                value={settings[control.key]}
                onChange={updateSetting(control.key)}
              />
            ))}
          </VStack>
        </VStack>

        <Flex
          flex="1"
          minH={{ base: "360px", lg: "520px" }}
          align="center"
          justify="center"
          bg="#dfe8f3"
          border="1px solid"
          borderColor="#cfdae8"
          borderRadius="8px"
          p={{ base: 6, md: 10 }}
        >
          <Flex
            style={previewStyle}
            maxW="100%"
            align="center"
            justify="center"
            bg="linear-gradient(145deg, #ffffff 0%, #f5f8fc 100%)"
            border="1px solid rgba(255, 255, 255, 0.88)"
            boxShadow="0 24px 64px rgba(36, 50, 74, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.92)"
            overflow="hidden"
            transition="width 160ms ease, height 160ms ease, border-radius 160ms ease, corner-shape 160ms ease"
          >
            <VStack spacing={1}>
              <Text color="#24324a" fontSize="lg" fontWeight="800">
                Card
              </Text>
              <Text color="#6a7b96" fontSize="sm" fontVariantNumeric="tabular-nums">
                {settings.width} x {settings.height} / {settings.radius}px /{" "}
                superellipse({settings.superellipse.toFixed(2)})
              </Text>
            </VStack>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
