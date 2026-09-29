import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound, submitActionSound } from "../constants/sounds";
import dogSticker from "../assets/10.webp";
import { useThemeStore } from "../useThemeStore";
import { t as tFn } from "../utils/translation";
import { estimateSelfReportedPlacement, SELF_ASSESSMENT_OPTIONS } from "../utils/proficiencySelfAssessment";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

export default function ProficiencyTestModal({
  isOpen,
  onStartAtLevel,
  onTakeTest,
  lang = "en",
  targetLangLabel = "",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const [scene, setScene] = useState("choice");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const language = targetLangLabel || tFn(lang, "proficiency_modal_language_fallback");
  const ui = (key, vars) => tFn(lang, key, vars);
  const estimate = estimateSelfReportedPlacement(selectedIds);

  useEffect(() => {
    if (!isOpen) return;
    setScene("choice");
    setSelectedIds([]);
    setIsSaving(false);
    setSaveError(false);
  }, [isOpen, targetLangLabel]);

  const deferSound = useCallback((sound) => {
    if (typeof window === "undefined") return void playSound(sound);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => void playSound(sound)));
  }, [playSound]);

  const handleStart = useCallback(async (level, rating, ids, source = "self_report") => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      await onStartAtLevel?.({ level, rating, selectedIds: ids, source });
      deferSound(submitActionSound);
    } catch (error) {
      console.warn("Could not save proficiency placement:", error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }, [deferSound, isSaving, onStartAtLevel]);

  const toggleOption = (id) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
    void playSound(selectSound);
  };

  const goTo = (nextScene) => {
    setScene(nextScene);
    void playSound(selectSound);
  };

  const handleTakeTest = () => {
    onTakeTest?.();
    deferSound(submitActionSound);
  };

  const selectionPage = scene === "first_five" ? 0 : 1;
  const options = SELF_ASSESSMENT_OPTIONS.slice(selectionPage * 5, selectionPage * 5 + 5);
  const textPrimary = isLightTheme ? "var(--app-text-primary)" : "gray.100";
  const textSecondary = "var(--app-text-secondary)";
  const textMuted = isLightTheme ? "var(--app-text-secondary)" : "var(--app-text-muted)";
  const neutralButton = {
    bg: isLightTheme ? "var(--app-surface-elevated)" : "gray.800",
    color: textPrimary,
    borderColor: isLightTheme ? "var(--app-border)" : "gray.600",
    _hover: { bg: isLightTheme ? "var(--app-surface-muted)" : "gray.700" },
  };
  const choiceButtonShadow = "0 4px 0 var(--app-button-neutral-edge), 0 7px 16px var(--app-button-neutral-glow)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      motionPreset="none"
      returnFocusOnClose={false}
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg={useSharedBackdrop ? "transparent" : "var(--app-overlay)"}
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg={isLightTheme ? "var(--app-surface-elevated)" : "gray.900"}
        color={textPrimary}
        border="1px solid"
        borderColor={isLightTheme ? "var(--app-border)" : "gray.700"}
        borderRadius={{ base: "20px", sm: "24px" }}
        shadow="xl"
        overflow="hidden"
        maxW={{ base: "calc(100vw - 24px)", sm: "450px" }}
        maxH="calc(100dvh - 24px)"
        mx={{ base: 3, sm: "auto" }}
      >
        <Box
          className="app-modal-header"
          bgGradient="linear(to-r, cyan.400, cyan.500)"
          flexShrink={0}
          px={{ base: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
        >
          <VStack spacing={1.5}>
            <Box
              as="img"
              src={dogSticker}
              alt=""
              aria-hidden="true"
              w={{ base: "88px", md: "105px" }}
              h={{ base: "42px", md: "50px" }}
              objectFit="cover"
              objectPosition="center bottom"
            />
            <Text fontWeight="bold" fontSize={{ base: "16px", md: "18px" }} lineHeight="1.3" textAlign="center" color="white">
              {scene === "result"
                ? ui("proficiency_modal_result_title")
                : ui("proficiency_modal_choose_start", { language })}
            </Text>
          </VStack>
        </Box>

        <ModalBody
          overflowY="auto"
          minH={0}
          px={{ base: 4, sm: 5, md: 6 }}
          py={{ base: 4, md: 5 }}
        >
          {scene === "choice" && (
            <VStack spacing={{ base: 3.5, md: 4 }} align="stretch">
              <Text fontSize="sm" color={textSecondary} textAlign="center" mb={{ base: 1, md: 2 }} lineHeight="1.4">
                {ui("proficiency_modal_choice_description")}
              </Text>
              <Button
                w="100%" size="lg" variant="outline" {...neutralButton}
                whiteSpace="normal" h="auto" minH={{ base: "52px", md: "56px" }}
                py={{ base: 3, md: 3.5 }} px={4}
                borderRadius="18px"
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(3px)" }}
                isLoading={isSaving}
                onClick={() => void handleStart("Pre-A1", 0, [], "completely_new")}
              >
                <Text fontWeight="bold" fontSize={{ base: "15px", md: "md" }} textAlign="center">
                  {ui("proficiency_modal_completely_new", { language })}
                </Text>
              </Button>
              <Button
                w="100%" size="lg" variant="outline" {...neutralButton}
                whiteSpace="normal" h="auto" minH={{ base: "52px", md: "56px" }}
                py={{ base: 3, md: 3.5 }} px={4}
                borderRadius="18px"
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(3px)" }}
                isDisabled={isSaving}
                onClick={() => goTo("first_five")}
              >
                <Text fontWeight="bold" fontSize={{ base: "15px", md: "md" }} textAlign="center">
                  {ui("proficiency_modal_find_level")}
                </Text>
              </Button>
            </VStack>
          )}

          {(scene === "first_five" || scene === "second_five") && (
            <VStack spacing={{ base: 2, md: 2.5 }} align="stretch">
              <VStack spacing={0.5} textAlign="center" mb={{ base: 1, md: 1.5 }}>
                <Text fontSize={{ base: "13px", md: "14px" }} fontWeight="medium" color={textSecondary} lineHeight="1.3">
                  {ui("proficiency_modal_select_all")}
                </Text>
                <Text fontSize="xs" fontWeight="bold" color={textMuted}>
                  {ui("proficiency_modal_part", { part: selectionPage + 1 })}
                </Text>
              </VStack>
              <VStack spacing={{ base: 2, md: 2.5 }} align="stretch">
                {options.map((option) => {
                  const selected = selectedIds.includes(option.id);
                  return (
                    <Box
                      as="button"
                      type="button"
                      key={option.id}
                      w="100%"
                      textAlign="left"
                      py={{ base: 2.5, md: 3 }}
                      px={{ base: 3.5, md: 4 }}
                      borderRadius="16px"
                      border="1.5px solid"
                      borderColor={
                        selected
                          ? isLightTheme ? "#0e8095" : "#22d3ee"
                          : isLightTheme ? "var(--app-border)" : "gray.700"
                      }
                      bg={
                        selected
                          ? isLightTheme ? "#e6f8fa" : "rgba(34, 211, 238, 0.12)"
                          : isLightTheme ? "var(--app-surface-elevated)" : "var(--app-surface-muted)"
                      }
                      boxShadow={
                        selected
                          ? isLightTheme ? "0 2px 8px rgba(14, 128, 149, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.25)"
                          : "none"
                      }
                      _hover={{
                        borderColor: selected
                          ? isLightTheme ? "#0e8095" : "#22d3ee"
                          : isLightTheme ? "gray.400" : "gray.500",
                        bg: selected
                          ? isLightTheme ? "#d9f4f7" : "rgba(34, 211, 238, 0.18)"
                          : isLightTheme ? "var(--app-surface-muted)" : "whiteAlpha.100",
                      }}
                      _active={{
                        transform: "scale(0.99)",
                      }}
                      transition="all 140ms ease"
                      cursor="pointer"
                      aria-pressed={selected}
                      onClick={() => toggleOption(option.id)}
                    >
                      <HStack align="center" spacing={{ base: 3, md: 3.5 }}>
                        <Box
                          aria-hidden="true"
                          flexShrink={0}
                          w="22px"
                          h="22px"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="full"
                          border="2px solid"
                          borderColor={
                            selected
                              ? "#0e8095"
                              : isLightTheme ? "gray.300" : "gray.500"
                          }
                          bg={
                            selected
                              ? "#0e8095"
                              : isLightTheme ? "white" : "transparent"
                          }
                          transition="background-color 140ms ease, border-color 140ms ease"
                        >
                          {selected && <CheckIcon boxSize="10px" color="white" />}
                        </Box>
                        <Text
                          flex="1"
                          fontSize={{ base: "13.5px", md: "14.5px" }}
                          lineHeight="1.3"
                          fontWeight={selected ? "semibold" : "medium"}
                          color={textPrimary}
                        >
                          {ui(`proficiency_self_${option.id}`, { language })}
                        </Text>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
              <HStack spacing={3} pt={{ base: 2.5, md: 3.5 }}>
                <Button
                  flex="1"
                  size="md"
                  h={{ base: "44px", md: "46px" }}
                  borderRadius="16px"
                  variant="outline"
                  fontWeight="bold"
                  {...neutralButton}
                  onClick={() => goTo(selectionPage === 0 ? "choice" : "first_five")}
                >
                  {ui("proficiency_modal_back")}
                </Button>
                <Button
                  flex="1"
                  size="md"
                  h={{ base: "44px", md: "46px" }}
                  borderRadius="16px"
                  colorScheme="cyan"
                  bg="cyan.500"
                  color="white"
                  fontWeight="bold"
                  boxShadow="0 4px 0 var(--chakra-colors-cyan-800, #086F83)"
                  _hover={{ bg: "cyan.400" }}
                  _active={{ boxShadow: "none", transform: "translateY(3px)" }}
                  isDisabled={selectionPage === 1 && !estimate}
                  onClick={() => goTo(selectionPage === 0 ? "second_five" : "result")}
                >
                  {ui(selectionPage === 0 ? "proficiency_modal_next" : "proficiency_modal_done")}
                </Button>
              </HStack>
            </VStack>
          )}

          {scene === "result" && estimate && (
            <VStack spacing={{ base: 4, md: 5 }} align="stretch" textAlign="center">
              <Text fontSize="sm" color={textSecondary} lineHeight="1.4">
                {ui("proficiency_modal_result_description")}
              </Text>
              <Box
                borderRadius="18px"
                bg={isLightTheme ? "#F1FAFB" : "whiteAlpha.100"}
                border="1.5px solid"
                borderColor={isLightTheme ? "#46B9CD" : "cyan.500"}
                py={{ base: 3, md: 4 }}
                px={4}
              >
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="black" color={isLightTheme ? "#155D70" : "cyan.200"}>
                  {estimate.level}
                </Text>
                <Text fontSize="sm" fontWeight="medium" color={textSecondary} mt={0.5}>
                  {ui("proficiency_modal_starting_elo", { score: estimate.rating })}
                </Text>
              </Box>
              <Button
                variant="outline" {...neutralButton}
                size="lg" w="100%" whiteSpace="normal" h="auto" minH={{ base: "50px", md: "54px" }}
                px={4} py={{ base: 3, md: 3.5 }}
                borderRadius="18px"
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(3px)" }}
                isLoading={isSaving}
                onClick={() => void handleStart(estimate.level, estimate.rating, selectedIds)}
              >
                <Text fontWeight="bold" fontSize={{ base: "15px", md: "md" }}>
                  {ui("proficiency_modal_start_level", { level: estimate.level })}
                </Text>
              </Button>
              <Button
                variant="outline" {...neutralButton}
                size="lg" w="100%" whiteSpace="normal" h="auto" minH={{ base: "50px", md: "54px" }}
                px={4} py={{ base: 3, md: 3.5 }}
                borderRadius="18px"
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(3px)" }}
                onClick={handleTakeTest} isDisabled={isSaving}
              >
                <Text fontWeight="bold" fontSize={{ base: "15px", md: "md" }}>
                  {ui("proficiency_modal_take_test_now")}
                </Text>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                borderRadius="14px"
                color={textPrimary}
                onClick={() => goTo("second_five")}
                isDisabled={isSaving}
              >
                {ui("proficiency_modal_back")}
              </Button>
            </VStack>
          )}
          {saveError && (
            <Text color={isLightTheme ? "red.700" : "red.200"} fontSize="sm" textAlign="center" mt={3} role="alert">
              {ui("proficiency_modal_save_error")}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
