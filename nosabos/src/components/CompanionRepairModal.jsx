// src/components/CompanionRepairModal.jsx
//
// The Daily Quest "Repair" surface: a short, ephemeral flashcard-style pass
// over the weak spots the companion saved yesterday. It never pollutes the
// long-term flashcard library, counts each repaired item toward the repair
// course's progress, and marks the underlying memory note as reinforced.
//
// Resumable + idempotent: it starts at the current repair count and records at
// most (target − startIndex) completions, so re-opening can't double-count.
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  HStack,
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
import { PiSparkleFill } from "react-icons/pi";
import { RiMagicLine } from "react-icons/ri";
import { TbBookmarkPlus, TbBookmarkFilled } from "react-icons/tb";

import { recordPlateActivity } from "../utils/dailyPlate";
import { markMemoryReinforced } from "../utils/companionMemory";
import { repairCopy } from "../utils/companionMemoryCopy";
import { buildNoteObject } from "../utils/noteGeneration";
import useNotesStore from "../hooks/useNotesStore";

export default function CompanionRepairModal({
  isOpen,
  onClose,
  onComplete,
  plan,
  targetLang = "es",
  appLanguage = "en",
  npub,
  startIndex = 0,
}) {
  const items = useMemo(
    () => (Array.isArray(plan?.items) ? plan.items : []),
    [plan],
  );

  const [index, setIndex] = useState(startIndex);
  const [revealed, setRevealed] = useState(false);
  // Items the learner chose to keep as permanent notes (by memoryId/index), so
  // the button reflects "saved" and can't double-add.
  const [savedKeys, setSavedKeys] = useState(() => new Set());
  const addNote = useNotesStore((s) => s.addNote);
  const triggerDoneAnimation = useNotesStore((s) => s.triggerDoneAnimation);

  // Resume from the latest progress when the modal opens. Deliberately keyed on
  // `isOpen` only — startIndex updates as items are recorded mid-session, and we
  // don't want those to reset the local position.
  useEffect(() => {
    if (isOpen) {
      setIndex(Math.min(Math.max(0, startIndex), items.length));
      setRevealed(false);
      setSavedKeys(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const total = items.length;
  const done = index >= total;
  const current = done ? null : items[index];

  const handleReveal = () => setRevealed(true);

  const handleGotIt = () => {
    const item = items[index];
    if (item) {
      // One increment per repaired item; the conductor sees the repair course
      // flip to done once the count reaches the plan's target.
      recordPlateActivity(npub, "repair", targetLang);
      if (item.memoryId) {
        markMemoryReinforced({
          npub,
          targetLang,
          memoryIds: [item.memoryId],
        });
      }
    }
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  const handleFinish = () => {
    onComplete?.();
    onClose?.();
  };

  // Promote a repaired item into a permanent saved note so it outlives the
  // 2-day repair lifecycle. Reuses the same note shape flashcards save, so it
  // shows up in the drawer's "Saved notes" alongside manual notes.
  const itemKey = (item, i) => item?.memoryId || `idx-${i}`;
  const handleSaveCurrent = () => {
    const item = items[index];
    if (!item) return;
    const key = itemKey(item, index);
    if (savedKeys.has(key)) return;
    addNote(
      buildNoteObject({
        lessonTitle: { en: item.concept, es: item.concept },
        cefrLevel: item.cefrLevel || "A1",
        example: item.expectedAnswer || item.concept,
        summary: item.summary || "",
        targetLang,
        supportLang: appLanguage,
        moduleType: "repair",
        wasCorrect: false,
      }),
    );
    triggerDoneAnimation();
    setSavedKeys((prev) => new Set(prev).add(key));
  };
  const currentSaved = current ? savedKeys.has(itemKey(current, index)) : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="scale">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg="var(--app-surface-elevated)"
        color="var(--app-text-primary)"
        border="1px solid"
        borderColor="var(--app-border)"
        borderRadius="20px"
        mx={4}
      >
        <ModalHeader pb={1}>
          <HStack spacing={2} align="center">
            <Box
              w="26px"
              h="26px"
              borderRadius="full"
              bg="rgba(168, 85, 247, 0.16)"
              color="purple.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <RiMagicLine size={15} />
            </Box>
            <Text fontSize="md" fontWeight="bold">
              {repairCopy(appLanguage, "title")}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {done ? (
            <VStack spacing={3} py={6} textAlign="center">
              <Box color="teal.300">
                <PiSparkleFill size={34} />
              </Box>
              <Text fontSize="lg" fontWeight="bold">
                {repairCopy(appLanguage, "done")}
              </Text>
            </VStack>
          ) : (
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="var(--app-text-secondary)">
                  {repairCopy(appLanguage, "intro")}
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="var(--app-text-muted)"
                  whiteSpace="nowrap"
                >
                  {Math.min(index + 1, total)} / {total}
                </Text>
              </HStack>

              <Box
                bg="var(--app-glass-bg-soft)"
                border="1px solid"
                borderColor="var(--app-border)"
                borderRadius="14px"
                px={4}
                py={5}
                minH="120px"
              >
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="var(--app-text-muted)"
                  mb={1.5}
                >
                  {repairCopy(appLanguage, "promptLabel")}
                </Text>
                <Text fontSize="lg" fontWeight="semibold">
                  {current?.concept}
                </Text>

                {revealed ? (
                  <VStack
                    align="stretch"
                    spacing={2}
                    mt={4}
                    pt={3}
                    borderTop="1px solid"
                    borderColor="var(--app-border)"
                  >
                    {current?.expectedAnswer ? (
                      <Box>
                        <Text fontSize="2xs" color="var(--app-text-muted)">
                          {repairCopy(appLanguage, "answerLabel")}
                        </Text>
                        <Text fontSize="md" color="teal.300" fontWeight="medium">
                          {current.expectedAnswer}
                        </Text>
                      </Box>
                    ) : null}
                    {current?.summary ? (
                      <Text fontSize="sm" color="var(--app-text-secondary)">
                        {current.summary}
                      </Text>
                    ) : null}
                    {current?.userAnswer ? (
                      <Text fontSize="xs" color="var(--app-text-muted)">
                        {repairCopy(appLanguage, "yourAnswerLabel")}: “
                        {current.userAnswer}”
                      </Text>
                    ) : null}
                    <Button
                      size="xs"
                      variant="ghost"
                      alignSelf="flex-start"
                      mt={1}
                      leftIcon={
                        currentSaved ? (
                          <TbBookmarkFilled size={14} />
                        ) : (
                          <TbBookmarkPlus size={14} />
                        )
                      }
                      color={
                        currentSaved ? "teal.300" : "var(--app-text-secondary)"
                      }
                      onClick={handleSaveCurrent}
                      isDisabled={currentSaved}
                    >
                      {repairCopy(
                        appLanguage,
                        currentSaved ? "saved" : "saveNote",
                      )}
                    </Button>
                  </VStack>
                ) : null}
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {done ? (
            <Button colorScheme="teal" w="100%" onClick={handleFinish}>
              {repairCopy(appLanguage, "done")}
            </Button>
          ) : revealed ? (
            <Button colorScheme="purple" w="100%" onClick={handleGotIt}>
              {repairCopy(appLanguage, "gotIt")}
            </Button>
          ) : (
            <Button
              variant="outline"
              w="100%"
              onClick={handleReveal}
              borderColor="var(--app-border)"
            >
              {repairCopy(appLanguage, "reveal")}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
