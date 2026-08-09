import React from "react";
import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";
import { APP_SQUIRCLE_SHAPE } from "../theme";
import { useThemeStore } from "../useThemeStore";
import RandomCharacter from "./RandomCharacter";
import { SUBSCRIPTION_RECOVERY_EXPIRED_COPY } from "./subscriptionRecoveryCopy";
import { SUBSCRIPTION_KEY_REPLACEMENT_COPY } from "./subscriptionKeyReplacementCopy";

export default function PatreonKeyReplacementGate({
  appLanguage = "en",
  onConfirm,
  onCancel,
  isChecking = false,
  statusError = "",
  embedded = false,
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const copy =
    SUBSCRIPTION_KEY_REPLACEMENT_COPY[lang] ||
    SUBSCRIPTION_KEY_REPLACEMENT_COPY.en;
  const themeMode = useThemeStore((state) => state.themeMode);
  const isLightTheme = themeMode === "light";
  const isRtl = lang === "ar";
  const pageBg = isLightTheme
    ? "radial-gradient(circle at 18% 18%, rgba(168, 85, 247, 0.13), transparent 28%), radial-gradient(circle at 84% 10%, rgba(45, 212, 191, 0.12), transparent 24%), #f8f1e7"
    : "radial-gradient(circle at 20% 15%, rgba(168, 85, 247, 0.2), transparent 28%), radial-gradient(circle at 82% 18%, rgba(45, 212, 191, 0.14), transparent 26%), #020617";
  const shellBg = isLightTheme ? "rgba(255, 250, 241, 0.97)" : "gray.900";
  const shellText = isLightTheme ? "#2f241b" : "gray.50";
  const shellBorder = isLightTheme
    ? "rgba(185, 156, 118, 0.32)"
    : "whiteAlpha.200";
  const softPanelBg = isLightTheme
    ? "rgba(242, 234, 220, 0.82)"
    : "whiteAlpha.100";
  const mutedText = isLightTheme ? "#6f5b46" : "gray.200";
  const errorMessage =
    statusError === "replacement_expired" ||
    statusError === "replacement_state_changed"
      ? SUBSCRIPTION_RECOVERY_EXPIRED_COPY[lang] ||
        SUBSCRIPTION_RECOVERY_EXPIRED_COPY.en
      : statusError === "membership_not_active"
        ? copy.membershipInactive
        : statusError === "unavailable"
          ? copy.unavailable
          : statusError
            ? copy.failed
            : "";

  return (
    <Box
      minH={embedded ? "auto" : "100vh"}
      bg={embedded ? "transparent" : pageBg}
      color={shellText}
      dir={isRtl ? "rtl" : "ltr"}
      display={embedded ? "block" : "flex"}
      alignItems="center"
      justifyContent="center"
      px={embedded ? 0 : { base: 2, md: 4 }}
      py={embedded ? 0 : { base: 3, md: 8 }}
    >
      <Box
        bg={embedded ? "transparent" : shellBg}
        borderWidth={embedded ? 0 : "1px"}
        borderColor={shellBorder}
        borderRadius={{ base: "30px", md: "36px" }}
        style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
        p={embedded ? 0 : { base: 4, md: 7 }}
        maxW="620px"
        w="100%"
        boxShadow={
          embedded
            ? "none"
            : isLightTheme
              ? "0 24px 80px rgba(97, 74, 47, 0.16)"
              : "0 24px 80px rgba(0,0,0,0.42)"
        }
      >
        <VStack align="stretch" spacing={{ base: 5, md: 6 }}>
          <Box textAlign="center">
            <Box
              bg={softPanelBg}
              border="1px solid"
              borderColor={shellBorder}
              borderRadius="28px"
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              px={4}
              py={1}
              w="fit-content"
              mx="auto"
              mb={4}
            >
              <RandomCharacter notSoRandomCharacter="31" width="92px" />
            </Box>
            <Text
              color="purple.400"
              fontSize="xs"
              fontWeight="black"
              letterSpacing="wide"
              textTransform="uppercase"
              mb={2}
            >
              {copy.eyebrow}
            </Text>
            <Heading size={{ base: "md", md: "lg" }}>{copy.title}</Heading>
          </Box>

          <Box
            bg={softPanelBg}
            border="1px solid"
            borderColor={shellBorder}
            borderRadius="28px"
            style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
            p={{ base: 5, md: 6 }}
          >
            <Text color={mutedText} fontSize={{ base: "sm", md: "md" }} lineHeight="tall">
              {copy.body}
            </Text>
            <Text color={shellText} fontSize="sm" fontWeight="bold" mt={4}>
              {copy.reassurance}
            </Text>
          </Box>

          <VStack spacing={3}>
            <Button
              type="button"
              w="100%"
              h="auto"
              py={5}
              bg="purple.400"
              color="white"
              boxShadow="0px 4px 0px #6b46c1"
              onClick={onConfirm}
              isLoading={isChecking}
              loadingText={copy.replacing}
              _hover={{
                bg: "purple.500",
                color: "white",
                transform: "translateY(-1px)",
              }}
              _active={{
                bg: "purple.600",
                color: "white",
                transform: "translateY(2px)",
                boxShadow: "0px 2px 0px #553c9a",
              }}
            >
              {copy.confirm}
            </Button>
            <Button
              type="button"
              w="100%"
              variant="ghost"
              onClick={onCancel}
              isDisabled={isChecking}
            >
              {copy.cancel}
            </Button>
          </VStack>

          {errorMessage && (
            <Text
              role="alert"
              color={isLightTheme ? "#9f2d36" : "red.200"}
              fontSize="xs"
              textAlign="center"
            >
              {errorMessage}
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
