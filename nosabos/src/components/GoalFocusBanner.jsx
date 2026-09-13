import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  Textarea,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import useGoalFocusStore from "../hooks/useGoalFocusStore";
import useUserStore from "../hooks/useUserStore";
import {
  currentGoalFocus,
  evaluateGoalAttempt,
} from "../utils/learningIntelligence";
import { goalCopy } from "../utils/learningGoalCopy";

// Keep practice in its normal layout; open the focused check only on request.
// It is never a self-reported "done" button or an XP completion gate.
export default function GoalFocusBanner({ surface }) {
  const storedFocus = useGoalFocusStore((s) => s.focus);
  const user = useUserStore((s) => s.user);
  const focus = currentGoalFocus(surface);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setResponse("");
    setFeedback("");
    onClose();
  }, [
    storedFocus?.npub,
    storedFocus?.targetLang,
    storedFocus?.blueprint?.goalId,
    storedFocus?.blueprint?.dayKey,
    onClose,
  ]);
  if (!focus) return null;
  const copy = goalCopy(focus.supportLang);
  const done =
    user?.learningIntelligence?.[focus.targetLang]?.dailyGoal?.completed;
  async function check() {
    setBusy(true);
    try {
      const result = await evaluateGoalAttempt(
        focus,
        response,
        "Focused written production check after practice. Model/hints were available; do not infer pronunciation or independent speech from text.",
      );
      setFeedback(result.feedback || "");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Box maxW="760px" mx="auto" px={3} py={2}>
        <Button
          size="sm"
          variant="outline"
          colorScheme="teal"
          onClick={onOpen}
          maxW="100%"
          aria-haspopup="dialog"
          color="var(--app-text-primary)"
        >
          <Text as="span" isTruncated>
            {done ? copy.complete : copy.title} · {focus.blueprint.objective}
          </Text>
        </Button>
      </Box>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          mx={4}
          bg="var(--app-surface-elevated)"
          color="var(--app-text-primary)"
        >
          <ModalHeader pr={12}>
            {copy.title} · {focus.blueprint.objective}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Text>{focus.blueprint.scenario}</Text>
              <Text fontSize="sm">{focus.blueprint.supports.join(" · ")}</Text>
              <Text fontSize="sm">
                {focus.blueprint.successCriteria.join(" · ")}
              </Text>
              {done ? (
                <Text role="status">{copy.complete}</Text>
              ) : (
                ["lesson", "flashcards"].includes(focus.blueprint.mode) && (
                  <>
                    <Textarea
                      aria-label={copy.attempt}
                      placeholder={copy.attempt}
                      value={response}
                      maxLength={2000}
                      onChange={(e) => setResponse(e.target.value)}
                    />
                    <Button
                      alignSelf="start"
                      size="sm"
                      colorScheme="teal"
                      boxShadow="0 4px 0 var(--chakra-colors-teal-800, #234E52)"
                      isLoading={busy}
                      isDisabled={!response.trim()}
                      onClick={check}
                    >
                      {copy.check}
                    </Button>
                  </>
                )
              )}
              {feedback && <Text role="status">{feedback}</Text>}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
