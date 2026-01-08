import React from "react";
import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { FiMic } from "react-icons/fi";

export function SpeakSuccessCard({
  title,
  scoreLabel,
  xp = 0,
  recognizedText = "",
  translation = "",
  t,
  userLanguage = "en",
}) {
  if (!title && !scoreLabel) return null;

  const xpLabel =
    typeof xp === "number" && xp > 0
      ? (t("practice_speak_banner_xp", { xp }) || `+${xp} XP`)
      : "";
  const saidLabel =
    t("practice_speak_banner_you_said") ||
    (userLanguage === "es" ? "Dijiste" : "You said");
  const translationLabel =
    t("practice_speak_banner_translation") ||
    (userLanguage === "es" ? "Significado" : "Meaning");

  return (
    <Box
      w="100%"
      mt={4}
      p={4}
      rounded="xl"
      bgGradient="linear(to-r, teal.500, purple.500)"
      color="white"
      shadow="xl"
      border="1px solid rgba(255,255,255,0.28)"
    >
      <HStack align="start" spacing={4}>
        <Box
          bg="rgba(255,255,255,0.22)"
          rounded="full"
          p={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={FiMic} boxSize={6} />
        </Box>
        <Box flex="1">
          {title ? (
            <Text fontWeight="700" fontSize="lg">
              {title}
            </Text>
          ) : null}
          {scoreLabel || xpLabel ? (
            <Text fontSize="sm" opacity={0.92} mt={1}>
              {[scoreLabel, xpLabel].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {recognizedText ? (
            <Text fontSize="sm" mt={3}>
              <Text as="span" fontWeight="600">
                {saidLabel}:
              </Text>{" "}
              <Text as="span" fontStyle="italic">
                “{recognizedText}”
              </Text>
            </Text>
          ) : null}
          {translation ? (
            <Text fontSize="sm" mt={2} opacity={0.95}>
              <Text as="span" fontWeight="600">
                {translationLabel}:
              </Text>{" "}
              {translation}
            </Text>
          ) : null}
        </Box>
      </HStack>
    </Box>
  );
}

export default SpeakSuccessCard;
