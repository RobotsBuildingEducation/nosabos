import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalCloseButton,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { doc, setDoc } from "firebase/firestore";
import { FiTarget, FiZap, FiClock } from "react-icons/fi";
import { database } from "../firebaseResources/firebaseResources";

const MS_24H = 24 * 60 * 60 * 1000;
const PRESETS = [50, 100, 150, 200, 300];

const I18N = {
  en: {
    quickPicks: "Quick picks",
    fineTune: "Fine-tune",
    xpUnit: "XP / day",
    levelExplainer: (pct, lvls) =>
      `Each level is 100 XP. This goal is ${pct}% of a level (≈ ${lvls} level${
        lvls === "1" ? "" : "s"
      } per day).`,
    goalPreview: "Goal preview",
    resetsIn: (when) => `Resets in 24h · ${when}`,
    toastSaved: "Daily goal saved",
    errNoUserTitle: "No user ID",
    errNoUserDesc: "Please sign in again.",
    errSaveTitle: "Could not save goal",
  },
  es: {
    quickPicks: "Atajos",
    fineTune: "Ajuste fino",
    xpUnit: "XP / día",
    levelExplainer: (pct, lvls) =>
      `Cada nivel = 100 XP. Esta meta es el ${pct}% de un nivel (≈ ${lvls} nivel${
        lvls === "1" ? "" : "es"
      } por día).`,
    goalPreview: "Vista previa de la meta",
    resetsIn: (when) => `Se reinicia en 24 h · ${when}`,
    toastSaved: "Meta diaria guardada",
    errNoUserTitle: "Sin ID de usuario",
    errNoUserDesc: "Vuelve a iniciar sesión.",
    errSaveTitle: "No se pudo guardar la meta",
  },
};

export default function DailyGoalModal({
  isOpen,
  onClose,
  npub,
  lang = "en",
  defaultGoal = 200,
  ui = {
    title: "Daily XP goal",
    subtitle: "Each level = 100 XP. How many XP do you want to earn per day?",
    inputLabel: "XP per day",
    save: "Save",
  },
}) {
  const L = I18N[lang === "es" ? "es" : "en"];
  const toast = useToast();
  const [goal, setGoal] = useState(String(defaultGoal));

  // Reset field when modal re-opens or default changes
  useEffect(() => {
    if (isOpen) setGoal(String(defaultGoal));
  }, [isOpen, defaultGoal]);

  // Clamp + parse
  const parsed = useMemo(
    () => Math.max(1, Math.min(1000, Math.round(Number(goal) || 0))),
    [goal]
  );

  // Pretty preview of “next reset” (local time)
  const resetPreview = useMemo(() => {
    const d = new Date(Date.now() + MS_24H);
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  }, [isOpen]); // recompute on open

  const levelPct = Math.min(100, parsed); // % of one level (100 XP)
  const approxLevels = (parsed / 100).toFixed(parsed % 100 === 0 ? 0 : 1);

  const save = async () => {
    if (!npub) {
      toast({
        title: L.errNoUserTitle,
        description: L.errNoUserDesc,
        status: "error",
      });
      return;
    }
    try {
      const resetAt = new Date(Date.now() + MS_24H).toISOString();
      await setDoc(
        doc(database, "users", npub),
        {
          dailyGoalXp: parsed,
          dailyXp: 0,
          dailyResetAt: resetAt,
          dailyHasCelebrated: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast({ title: L.toastSaved, status: "success", duration: 1400 });
      onClose?.();
    } catch (e) {
      toast({
        title: L.errSaveTitle,
        description: String(e?.message || e),
        status: "error",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="gray.900"
        color="gray.100"
        border="1px solid"
        borderColor="gray.700"
        rounded="2xl"
        shadow="xl"
        overflow="hidden"
        maxH="100vh"
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "100dvh",
          },
        }}
      >
        {/* Header */}
        <Box
          bgGradient="linear(to-r, teal.700, teal.500)"
          color="white"
          px={6}
          pr={12}
          py={5}
        >
          <HStack spacing={3} align="center">
            <Box as={FiTarget} aria-hidden fontSize="22px" opacity={0.95} />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">
                {ui.title}
              </Text>
              <Text fontSize="sm" opacity={0.95}>
                {ui.subtitle}
              </Text>
            </VStack>
          </HStack>
        </Box>
        {/* Body */}
        <ModalBody px={{ base: 4, md: 6 }} py={5}>
          <VStack align="stretch" spacing={5}>
            {/* Quick presets */}
            <Box>
              <Text fontSize="sm" mb={2} opacity={0.85}>
                {L.quickPicks}
              </Text>
              <HStack spacing={2} wrap="wrap">
                {PRESETS.map((v) => {
                  const active = parsed === v;
                  return (
                    <Button
                      key={v}
                      size="sm"
                      variant={active ? "solid" : "outline"}
                      colorScheme="teal"
                      onClick={() => setGoal(String(v))}
                    >
                      {v} XP
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            {/* Slider */}
            <Box>
              <Text fontSize="sm" mb={2} opacity={0.85}>
                {L.fineTune}
              </Text>
              <Slider
                aria-label="daily-goal-slider"
                min={10}
                max={500}
                step={10}
                value={Math.min(500, Math.max(10, parsed))}
                onChange={(val) => setGoal(String(val))}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={5} />
              </Slider>
            </Box>

            {/* Simple text field (no steppers) */}
            <FormControl>
              <FormLabel>{ui.inputLabel}</FormLabel>
              <HStack spacing={3} align="center">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={1000}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  bg="gray.800"
                  rounded="md"
                  size="md"
                  w="180px"
                />
                <Text opacity={0.8}>{L.xpUnit}</Text>
              </HStack>
              <Text mt={2} fontSize="xs" opacity={0.7}>
                {L.levelExplainer(levelPct, approxLevels)}
              </Text>
            </FormControl>

            <Divider borderColor="gray.700" />

            {/* Preview */}
            <Box>
              <HStack spacing={2} mb={2}>
                <Box as={FiZap} aria-hidden fontSize="18px" color="teal.300" />
                <Text fontWeight="semibold">{L.goalPreview}</Text>
              </HStack>
              <Progress
                value={Math.min(levelPct, 100)}
                size="sm"
                rounded="md"
                hasStripe
                isAnimated
                colorScheme="teal"
              />
              <HStack mt={2} justify="space-between" fontSize="sm">
                <Text opacity={0.85}>
                  {parsed} {L.xpUnit}
                </Text>
                <HStack spacing={2}>
                  <Box
                    as={FiClock}
                    aria-hidden
                    fontSize="16px"
                    color="gray.300"
                  />
                  <Text opacity={0.8}>{L.resetsIn(resetPreview)}</Text>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        {/* Footer */}
        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor="gray.800"
        >
          <HStack w="100%" justify="flex-end" spacing={3}>
            <Button colorScheme="teal" onClick={save} isDisabled={!npub}>
              {ui.save}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
