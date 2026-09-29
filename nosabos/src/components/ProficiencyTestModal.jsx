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
        rounded="2xl"
        shadow="xl"
        overflow="hidden"
        maxW={{ base: "calc(100vw - 20px)", sm: "md" }}
        maxH="calc(100dvh - 12px)"
      >
        <Box
          className="app-modal-header"
          bgGradient="linear(to-r, cyan.400, cyan.500)"
          flexShrink={0}
          sx={{
            "&&": {
              paddingInlineStart: { base: "20px !important", md: "32px !important" },
              paddingInlineEnd: { base: "20px !important", md: "32px !important" },
              paddingTop: { base: "8px !important", md: "14px !important" },
              paddingBottom: { base: "8px !important", md: "14px !important" },
            },
          }}
        >
          <VStack spacing={1}>
            <Box
              as="img"
              src={dogSticker}
              alt=""
              aria-hidden="true"
              w={{ base: "92px", md: "110px" }}
              h={{ base: "44px", md: "51px" }}
              objectFit="cover"
              objectPosition="center bottom"
            />
            <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} lineHeight="1.25" textAlign="center" color="white">
              {scene === "result"
                ? ui("proficiency_modal_result_title")
                : ui("proficiency_modal_choose_start", { language })}
            </Text>
          </VStack>
        </Box>

        <ModalBody
          overflowY="auto"
          minH={0}
          sx={{
            "&&&": {
              paddingInlineStart: { base: "18px !important", md: "28px !important" },
              paddingInlineEnd: { base: "18px !important", md: "28px !important" },
              paddingTop: { base: "12px !important", md: "20px !important" },
              paddingBottom: { base: "12px !important", md: "20px !important" },
            },
          }}
        >
          {scene === "choice" && (
            <VStack spacing={{ base: 6, md: 7 }} align="stretch">
              <Text fontSize="sm" color={textSecondary} textAlign="center">
                {ui("proficiency_modal_choice_description")}
              </Text>
              <Button
                w="100%" size="lg" variant="outline" {...neutralButton}
                whiteSpace="normal" h="auto" minH="56px" py={2}
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(4px)" }}
                isLoading={isSaving}
                onClick={() => void handleStart("Pre-A1", 0, [], "completely_new")}
              >
                {ui("proficiency_modal_completely_new", { language })}
              </Button>
              <Button
                w="100%" size="lg" variant="outline" {...neutralButton}
                whiteSpace="normal" h="auto" minH="56px" py={2}
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(4px)" }}
                isDisabled={isSaving}
                onClick={() => goTo("first_five")}
              >
                {ui("proficiency_modal_find_level")}
              </Button>
            </VStack>
          )}

          {(scene === "first_five" || scene === "second_five") && (
            <VStack spacing={{ base: 2, md: 3 }} align="stretch">
              <Text fontSize={{ base: "sm", md: "md" }} color={textSecondary} textAlign="center" lineHeight="1.3">
                {ui("proficiency_modal_select_all")}
              </Text>
              <Text fontSize="xs" color={textMuted} textAlign="center">
                {ui("proficiency_modal_part", { part: selectionPage + 1 })}
              </Text>
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                {options.map((option) => {
                  const selected = selectedIds.includes(option.id);
                  return (
                    <Button
                      key={option.id}
                      w="100%" h="auto" minH={{ base: "44px", md: "52px" }}
                      py={{ base: 1.5, md: 2 }} px={{ base: 3, md: 4 }}
                      variant="outline" whiteSpace="normal" textAlign="left"
                      justifyContent="flex-start" gap={{ base: 2.5, md: 3 }}
                      color={textPrimary}
                      bg={selected
                        ? isLightTheme ? "#E5F8FB" : "cyan.900"
                        : isLightTheme ? "var(--app-surface-elevated)" : "transparent"}
                      borderColor={selected
                        ? isLightTheme ? "#46B9CD" : "cyan.300"
                        : isLightTheme ? "var(--app-border)" : "gray.600"}
                      _hover={{ bg: selected
                        ? isLightTheme ? "#D8F3F8" : "cyan.800"
                        : isLightTheme ? "var(--app-surface-muted)" : "whiteAlpha.100" }}
                      aria-pressed={selected}
                      onClick={() => toggleOption(option.id)}
                    >
                      <Box
                        as="span"
                        aria-hidden="true"
                        flexShrink={0}
                        w="22px"
                        h="22px"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={selected ? "#0E8095" : isLightTheme ? "#9EB7BA" : "gray.400"}
                        bg={selected ? "#0E8095" : isLightTheme ? "white" : "transparent"}
                        transition="background-color 140ms ease, border-color 140ms ease"
                      >
                        {selected && <CheckIcon boxSize="10px" color="white" />}
                      </Box>
                      <Box as="span" flex="1" whiteSpace="normal" fontSize={{ base: "sm", md: "md" }} lineHeight="1.25">
                        {ui(`proficiency_self_${option.id}`, { language })}
                      </Box>
                    </Button>
                  );
                })}
              </VStack>
              <HStack spacing={2} pt={4}>
                <Button flex="1" size={{ base: "sm", md: "md" }} variant="outline" {...neutralButton} onClick={() => goTo(selectionPage === 0 ? "choice" : "first_five")}>
                  {ui("proficiency_modal_back")}
                </Button>
                <Button
                  flex="1" size={{ base: "sm", md: "md" }} colorScheme="cyan"
                  isDisabled={selectionPage === 1 && !estimate}
                  onClick={() => goTo(selectionPage === 0 ? "second_five" : "result")}
                >
                  {ui(selectionPage === 0 ? "proficiency_modal_next" : "proficiency_modal_done")}
                </Button>
              </HStack>
            </VStack>
          )}

          {scene === "result" && estimate && (
            <VStack spacing={{ base: 6, md: 7 }} align="stretch" textAlign="center">
              <Text fontSize="sm" color={textSecondary}>
                {ui("proficiency_modal_result_description")}
              </Text>
              <Box
                rounded="xl"
                bg={isLightTheme ? "#F1FAFB" : "whiteAlpha.100"}
                border="1px solid"
                borderColor={isLightTheme ? "#46B9CD" : "cyan.500"}
                py={{ base: 2, md: 3 }}
              >
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color={isLightTheme ? "#155D70" : "cyan.200"}>
                  {estimate.level}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  {ui("proficiency_modal_starting_elo", { score: estimate.rating })}
                </Text>
              </Box>
              <Button
                variant="outline" {...neutralButton}
                size="lg" w="100%" whiteSpace="normal" h="auto" minH="56px" px={4} py={2}
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(4px)" }}
                isLoading={isSaving}
                onClick={() => void handleStart(estimate.level, estimate.rating, selectedIds)}
              >
                {ui("proficiency_modal_start_level", { level: estimate.level })}
              </Button>
              <Button
                variant="outline" {...neutralButton}
                size="lg" w="100%" whiteSpace="normal" h="auto" minH="56px" px={4} py={2}
                boxShadow={choiceButtonShadow}
                _active={{ boxShadow: "none", transform: "translateY(4px)" }}
                onClick={handleTakeTest} isDisabled={isSaving}
              >
                {ui("proficiency_modal_take_test_now")}
              </Button>
              <Button variant="ghost" size="sm" color={textPrimary} onClick={() => goTo("second_five")} isDisabled={isSaving}>
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
