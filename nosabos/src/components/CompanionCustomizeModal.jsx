import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiLock } from "react-icons/fi";
import {
  PET_TYPES,
  getEffectivePetType,
  getPetUnlockLevel,
  isPetTypeUnlocked,
  normalizePetType,
} from "../utils/petTypes";
import { getCustomizeModalCopy } from "./companionCustomizeCopy";

const TILE = 16;
const SCALE = 3;
const T = TILE * SCALE;
const NAME_MAX_LENGTH = 24;

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const UNLOCKED_TEXT_LIGHT = "#0f766e";
const UNLOCKED_TEXT_DARK = "#5eead4";
const ACTIVE_UNLOCKED_TEXT_LIGHT = "#0d9488";
const ACTIVE_UNLOCKED_TEXT_DARK = "#99f6e4";

// Small animated preview of a companion option, drawn with the panel's own
// `drawCompanion(ctx, frame, stage, petType)` so the picker matches the panel.
function OptionCanvas({ stage, petType = "dog", drawCompanion }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const resolvedPetType = normalizePetType(petType);

  useEffect(() => {
    if (stage.key === "dead") {
      setFrame(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % 12);
    }, 180);
    return () => window.clearInterval(interval);
  }, [stage.key]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = T;
    canvas.height = T;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, T, T);
    drawCompanion(ctx, frame, stage, resolvedPetType);
  }, [frame, resolvedPetType, stage, drawCompanion]);

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      aria-hidden="true"
      w={{ base: "68px", md: "76px" }}
      h={{ base: "68px", md: "76px" }}
      flexShrink={0}
      sx={{ imageRendering: "pixelated" }}
    />
  );
}

// Controlled modal for renaming the companion and picking its look. The parent
// owns open/close (via useDisclosure) and supplies its own `drawCompanion` +
// current `stage` so the picker previews match that panel exactly.
export default function CompanionCustomizeModal({
  isOpen,
  onClose,
  lang = "en",
  isLightTheme = false,
  petName = "",
  petType = "dog",
  companionLevel = 1,
  placeholder = "",
  stage,
  drawCompanion,
  onSubmit,
}) {
  const copy = getCustomizeModalCopy(lang);
  const trimmedName = typeof petName === "string" ? petName.trim() : "";
  const resolvedPetType = getEffectivePetType(petType, companionLevel);
  const [draftName, setDraftName] = useState(trimmedName);
  const [draftPetType, setDraftPetType] = useState(resolvedPetType);

  // Reset the draft to the live values each time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setDraftName(trimmedName);
      setDraftPetType(resolvedPetType);
    }
  }, [isOpen, trimmedName, resolvedPetType]);

  const submitCustomize = () => {
    const name = draftName.trim().slice(0, NAME_MAX_LENGTH);
    const type = getEffectivePetType(draftPetType, companionLevel);
    if (typeof onSubmit === "function") {
      onSubmit({ name, petType: type });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="sm"
      autoFocus={false}
      motionPreset="scale"
    >
      <ModalOverlay bg="var(--app-overlay)" />
      <ModalContent
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        border="1px solid"
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        rounded="2xl"
        mx={4}
      >
        <ModalHeader fontSize="md" fontWeight="bold" pb={2}>
          {copy.edit}
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                mb={1.5}
              >
                {copy.name}
              </Text>
              <Input
                value={draftName}
                onChange={(e) =>
                  setDraftName(e.target.value.slice(0, NAME_MAX_LENGTH))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCustomize();
                  }
                }}
                maxLength={NAME_MAX_LENGTH}
                placeholder={placeholder}
                bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.800"}
                color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                rounded="md"
              />
            </Box>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                mb={1.5}
              >
                {copy.companion}
              </Text>
              <SimpleGrid columns={2} spacing={2}>
                {PET_TYPES.map((type) => {
                  const active = draftPetType === type;
                  const unlockLevel = getPetUnlockLevel(type);
                  const unlocked = isPetTypeUnlocked(type, companionLevel);
                  const levelLabel =
                    unlockLevel <= 1
                      ? copy.starter
                      : copy.unlockLevel.replace(
                          "{level}",
                          String(unlockLevel),
                        );
                  const ariaLabel = unlocked
                    ? `${copy[type]}, ${levelLabel}`
                    : `${copy[type]}, ${copy.locked}, ${levelLabel}`;
                  return (
                    <Button
                      key={type}
                      w="100%"
                      h={{ base: "116px", md: "128px" }}
                      minW={0}
                      px={2}
                      py={2}
                      variant="ghost"
                      aria-pressed={active}
                      aria-label={ariaLabel}
                      isDisabled={!unlocked}
                      border="2px solid"
                      borderColor={
                        active
                          ? isLightTheme
                            ? "#3f9f9b"
                            : "#5eead4"
                          : "transparent"
                      }
                      borderRadius="xl"
                      bg={
                        active
                          ? isLightTheme
                            ? "rgba(63, 159, 155, 0.12)"
                            : "whiteAlpha.100"
                          : "transparent"
                      }
                      _hover={{
                        bg: active
                          ? isLightTheme
                            ? "rgba(63, 159, 155, 0.18)"
                            : "whiteAlpha.200"
                          : isLightTheme
                            ? APP_SURFACE_MUTED
                            : "whiteAlpha.100",
                      }}
                      _active={{ bg: undefined }}
                      _disabled={{
                        opacity: isLightTheme ? 0.62 : 0.48,
                        cursor: "not-allowed",
                      }}
                      onClick={() => setDraftPetType(type)}
                    >
                      <VStack spacing={1.5} justify="center">
                        <OptionCanvas
                          stage={stage}
                          petType={type}
                          drawCompanion={drawCompanion}
                        />
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          lineHeight="1"
                          color={
                            active
                              ? isLightTheme
                                ? ACTIVE_UNLOCKED_TEXT_LIGHT
                                : ACTIVE_UNLOCKED_TEXT_DARK
                              : unlocked
                                ? isLightTheme
                                  ? UNLOCKED_TEXT_LIGHT
                                  : UNLOCKED_TEXT_DARK
                                : isLightTheme
                                  ? APP_TEXT_SECONDARY
                                  : "gray.300"
                          }
                        >
                          {copy[type]}
                        </Text>
                        <HStack
                          spacing={1}
                          minH="14px"
                          color={
                            unlocked
                              ? active
                                ? isLightTheme
                                  ? ACTIVE_UNLOCKED_TEXT_LIGHT
                                  : ACTIVE_UNLOCKED_TEXT_DARK
                                : isLightTheme
                                  ? UNLOCKED_TEXT_LIGHT
                                  : UNLOCKED_TEXT_DARK
                              : isLightTheme
                                ? "#8a6b32"
                                : "yellow.200"
                          }
                        >
                          {!unlocked ? (
                            <Box as={FiLock} boxSize="10px" />
                          ) : null}
                          <Text
                            fontSize="10px"
                            fontWeight="bold"
                            lineHeight="1"
                          >
                            {levelLabel}
                          </Text>
                        </HStack>
                      </VStack>
                    </Button>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button
            variant="ghost"
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
            _hover={{
              bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
            }}
            onClick={onClose}
          >
            {copy.cancel}
          </Button>
          <Button
            colorScheme={isLightTheme ? undefined : "teal"}
            bg={isLightTheme ? "#3f9f9b" : undefined}
            color={isLightTheme ? "white" : undefined}
            _hover={isLightTheme ? { bg: "#398f8b" } : undefined}
            boxShadow="0px 4px 0px teal"
            onClick={submitCustomize}
          >
            {copy.save}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
