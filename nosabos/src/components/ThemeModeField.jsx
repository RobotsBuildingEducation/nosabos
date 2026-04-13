import React from "react";
import { Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { RiMoonClearLine, RiSunLine } from "react-icons/ri";

const OPTIONS = [
  {
    value: "dark",
    icon: RiMoonClearLine,
    preview: {
      bg: "linear-gradient(180deg, #10172a 0%, #0b1220 100%)",
      panel: "rgba(17, 24, 39, 0.88)",
      text: "#e5e7eb",
      textMuted: "#94a3b8",
      accent: "linear-gradient(135deg, #60a5fa, #8b5cf6)",
    },
  },
  {
    value: "light",
    icon: RiSunLine,
    preview: {
      bg: "linear-gradient(180deg, #fffdf9 0%, #f7f1e7 100%)",
      panel: "rgba(255, 253, 249, 0.96)",
      text: "#2f261d",
      textMuted: "#8d7a67",
      accent: "linear-gradient(135deg, #f59e0b, #f97316)",
    },
  },
];

export default function ThemeModeField({
  value = "dark",
  onChange,
  t = {},
  compact = false,
}) {
  const title = t.theme_mode_label || "Theme";
  const description =
    t.theme_mode_description ||
    "Choose how the app looks. Light mode uses a warm, paper-like layout.";

  return (
    <Box
      bg="gray.800"
      p={compact ? 3 : 4}
      rounded="xl"
      border="1px solid"
      borderColor="var(--app-border)"
      boxShadow="var(--app-shadow-soft)"
    >
      <VStack align="stretch" spacing={compact ? 3 : 4}>
        <Box textAlign="left">
          <Text fontSize="sm" fontWeight="semibold" color="var(--app-text-primary)">
            {title}
          </Text>
          <Text fontSize="xs" mt={1} color="var(--app-text-muted)">
            {description}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
          {OPTIONS.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;
            const isDark = option.value === "dark";
            const label = isDark
              ? t.theme_mode_dark || "Midnight"
              : t.theme_mode_light || "Paper";

            return (
              <Box
                key={option.value}
                as="button"
                type="button"
                onClick={() => onChange?.(option.value)}
                textAlign="left"
                borderRadius="20px"
                border="1px solid"
                borderColor={isSelected ? "blue.400" : "var(--app-border)"}
                bg={isSelected ? "var(--app-surface-elevated)" : "var(--app-surface)"}
                boxShadow={
                  isSelected
                    ? "0 0 0 2px rgba(96, 165, 250, 0.22), var(--app-shadow-soft)"
                    : "var(--app-shadow-soft)"
                }
                p={3}
                transition="all 0.2s ease"
                _hover={{
                  transform: "translateY(-1px)",
                  borderColor: isSelected ? "blue.300" : "var(--app-border-strong)",
                }}
                _active={{ transform: "translateY(0)" }}
                aria-pressed={isSelected}
              >
                <VStack align="stretch" spacing={3}>
                  <Box
                    h={compact ? "92px" : "112px"}
                    borderRadius="16px"
                    p={3}
                    background={option.preview.bg}
                    border="1px solid rgba(255, 255, 255, 0.08)"
                    overflow="hidden"
                    position="relative"
                  >
                    <Box
                      position="absolute"
                      top="10px"
                      right="12px"
                      w="34px"
                      h="6px"
                      borderRadius="999px"
                      background={option.preview.accent}
                      opacity={0.9}
                    />
                    <Box
                      w="70%"
                      h="100%"
                      borderRadius="14px"
                      p={3}
                      background={option.preview.panel}
                      border="1px solid rgba(255, 255, 255, 0.06)"
                      boxShadow="0 12px 28px rgba(15, 23, 42, 0.16)"
                    >
                      <VStack align="stretch" spacing={2}>
                        <Box
                          h="9px"
                          w="42%"
                          borderRadius="999px"
                          bg={option.preview.accent}
                          opacity={0.95}
                        />
                        <Box
                          h="7px"
                          w="88%"
                          borderRadius="999px"
                          bg={option.preview.text}
                          opacity={0.9}
                        />
                        <Box
                          h="7px"
                          w="64%"
                          borderRadius="999px"
                          bg={option.preview.textMuted}
                          opacity={0.8}
                        />
                        <HStack spacing={2} pt={1}>
                          <Box
                            h="22px"
                            flex="1"
                            borderRadius="999px"
                            bg={option.preview.text}
                            opacity={0.08}
                          />
                          <Box
                            h="22px"
                            flex="0.8"
                            borderRadius="999px"
                            background={option.preview.accent}
                            opacity={0.5}
                          />
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>

                  <HStack align="start" spacing={3}>
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      display="grid"
                      placeItems="center"
                      bg={isSelected ? "blue.500" : "var(--app-surface-muted)"}
                      color={isSelected ? "white" : "var(--app-text-secondary)"}
                      flexShrink={0}
                    >
                      <Icon size={18} />
                    </Box>
                    <Box minW={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="var(--app-text-primary)"
                      >
                        {label}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
