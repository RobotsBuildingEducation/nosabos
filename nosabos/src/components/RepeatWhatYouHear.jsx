// components/RepeatWhatYouHear.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import FeedbackRail from "./FeedbackRail";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;

/**
 * RepeatWhatYouHear - A Duolingo-style listening and reconstruction exercise
 *
 * Users listen to a sentence (auto-played on render) and must rebuild it from
 * a word bank in the order they heard.
 */
export default function RepeatWhatYouHear({
  sourceSentence = "",
  wordBank = [],
  correctAnswer = [], // eslint-disable-line no-unused-vars
  hint = "",
  loading = false,

  userLanguage = "en",
  t = (key) => key,

  onSubmit = () => {},
  onSkip = () => {},
  onNext = () => {},
  onPlayTTS = () => {},
  canSkip = true,

  onSendHelpRequest = null,

  lastOk = null,
  recentXp = 0,
  isSubmitting = false,
  showNext = false,

  isSynthesizing = false,

  onExplainAnswer = null,
  explanationText = "",
  isLoadingExplanation = false,
  lessonProgress = null,
  onCreateNote = null,
  isCreatingNote = false,
  noteCreated = false,

  characterImage = null,
}) {
  const [bankOrder, setBankOrder] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (wordBank.length > 0) {
      setBankOrder(wordBank.map((_, idx) => idx));
      setSelectedWords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordBank.join("|")]);

  useEffect(() => {
    hasPlayedRef.current = false;
  }, [sourceSentence]);

  useEffect(() => {
    if (!loading && sourceSentence && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      onPlayTTS(sourceSentence);
    }
  }, [loading, onPlayTTS, sourceSentence]);

  const handleWordClick = useCallback(
    (wordIndex, bankPosition) => {
      if (lastOk !== null) return;
      setBankOrder((prev) => prev.filter((_, pos) => pos !== bankPosition));
      setSelectedWords((prev) => [...prev, wordIndex]);
    },
    [lastOk]
  );

  const handleSelectedWordClick = useCallback(
    (selectedPosition) => {
      if (lastOk !== null) return;
      const wordIndex = selectedWords[selectedPosition];
      setSelectedWords((prev) =>
        prev.filter((_, pos) => pos !== selectedPosition)
      );
      setBankOrder((prev) => [...prev, wordIndex]);
    },
    [selectedWords, lastOk]
  );

  const handleDragEnd = useCallback(
    (result) => {
      if (!result?.destination || lastOk !== null) return;
      const { source, destination } = result;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      if (
        source.droppableId === "word-bank" &&
        destination.droppableId === "word-bank"
      ) {
        const updated = Array.from(bankOrder);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setBankOrder(updated);
        return;
      }

      if (
        source.droppableId === "selected-words" &&
        destination.droppableId === "selected-words"
      ) {
        const updated = Array.from(selectedWords);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setSelectedWords(updated);
        return;
      }

      if (
        source.droppableId === "word-bank" &&
        destination.droppableId === "selected-words"
      ) {
        const wordIndex = bankOrder[source.index];
        const newBank = Array.from(bankOrder);
        newBank.splice(source.index, 1);
        setBankOrder(newBank);

        const newSelected = Array.from(selectedWords);
        newSelected.splice(destination.index, 0, wordIndex);
        setSelectedWords(newSelected);
        return;
      }

      if (
        source.droppableId === "selected-words" &&
        destination.droppableId === "word-bank"
      ) {
        const wordIndex = selectedWords[source.index];
        const newSelected = Array.from(selectedWords);
        newSelected.splice(source.index, 1);
        setSelectedWords(newSelected);

        const newBank = Array.from(bankOrder);
        newBank.splice(destination.index, 0, wordIndex);
        setBankOrder(newBank);
      }
    },
    [bankOrder, selectedWords, lastOk]
  );

  const getUserAnswer = useCallback(() => {
    return selectedWords.map((idx) => wordBank[idx]);
  }, [selectedWords, wordBank]);

  const handleSubmit = useCallback(() => {
    const userAnswer = getUserAnswer();
    onSubmit(userAnswer);
  }, [getUserAnswer, onSubmit]);

  const handleSendHelp = useCallback(() => {
    if (!onSendHelpRequest) return;
    const promptLines = [
      "Repeat What You Hear exercise. Respond with the sentence as spoken using the provided word bank.",
      sourceSentence ? `Spoken sentence: ${sourceSentence}` : null,
      wordBank?.length ? `Word bank: ${wordBank.join(" | ")}` : null,
      hint ? `Hint: ${hint}` : null,
    ].filter(Boolean);
    onSendHelpRequest(promptLines.join("\n"));
  }, [hint, onSendHelpRequest, sourceSentence, wordBank]);

  const headingLabel =
    userLanguage === "es" ? "Toca lo que escuchas" : "Tap what you hear";
  const instructionLabel =
    userLanguage === "es"
      ? "Escucha y toca las palabras en orden"
      : "Listen and tap the words in order";
  const skipLabel = userLanguage === "es" ? "Saltar" : "Skip";
  const submitLabel = userLanguage === "es" ? "Comprobar" : "Submit";
  const nextLabel =
    userLanguage === "es" ? "Siguiente pregunta" : "Next question";

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <VStack align="stretch" spacing={4}>
        <Text fontSize="xl" fontWeight="bold" color="white">
          {headingLabel}
        </Text>
        <Box
          bg="rgba(255, 255, 255, 0.02)"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
          p={5}
        >
          <VStack align="stretch" spacing={4}>
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              borderRadius="lg"
              borderWidth="2px"
              borderColor={
                lastOk === true
                  ? "green.400"
                  : lastOk === false
                  ? "red.400"
                  : "whiteAlpha.200"
              }
              p={4}
              minH="80px"
            >
              <Droppable droppableId="selected-words" direction="horizontal">
                {(provided, snapshot) => (
                  <Flex
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    wrap="wrap"
                    gap={2}
                    minH="48px"
                    align="center"
                    bg={
                      snapshot.isDraggingOver
                        ? "rgba(128, 90, 213, 0.08)"
                        : "transparent"
                    }
                    borderRadius="md"
                    p={2}
                    transition="background 0.2s ease"
                  >
                    <Flex align="center" gap={3}>
                      {onSendHelpRequest && (
                        <IconButton
                          aria-label={
                            userLanguage === "es"
                              ? "Pedir ayuda"
                              : "Ask the assistant"
                          }
                          icon={<MdOutlineSupportAgent />}
                          size="sm"
                          fontSize="lg"
                          bg="white"
                          color="blue"
                          border="3px solid skyblue"
                          boxShadow={"lg"}
                          onClick={handleSendHelp}
                        />
                      )}
                      <IconButton
                        aria-label={
                          userLanguage === "es" ? "Escuchar" : "Listen"
                        }
                        icon={renderSpeakerIcon(isSynthesizing)}
                        size="md"
                        fontSize="xl"
                        variant="ghost"
                        onClick={() => onPlayTTS(sourceSentence)}
                        isRound
                      />
                      {selectedWords.length === 0 &&
                        !snapshot.isDraggingOver && (
                          <Text
                            color="gray.500"
                            fontSize="sm"
                            fontStyle="italic"
                            w="100%"
                            textAlign="center"
                          >
                            {instructionLabel}
                          </Text>
                        )}
                    </Flex>

                    {selectedWords.map((wordIndex, position) => (
                      <Draggable
                        key={`selected-${wordIndex}-${position}`}
                        draggableId={`selected-${wordIndex}-${position}`}
                        index={position}
                        isDragDisabled={lastOk !== null}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <Box
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            px={3}
                            py={2}
                            rounded="md"
                            borderWidth="1px"
                            borderColor={
                              dragSnapshot.isDragging
                                ? "purple.300"
                                : "rgba(255, 255, 255, 0.22)"
                            }
                            bg={
                              dragSnapshot.isDragging
                                ? "rgba(128, 90, 213, 0.25)"
                                : "rgba(255, 255, 255, 0.06)"
                            }
                            cursor={lastOk !== null ? "default" : "grab"}
                            onClick={() =>
                              lastOk === null &&
                              handleSelectedWordClick(position)
                            }
                            _hover={
                              lastOk === null
                                ? {
                                    bg: "rgba(128, 90, 213, 0.12)",
                                    borderColor: "purple.200",
                                  }
                                : {}
                            }
                            transition="all 0.15s ease"
                            boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"
                            style={dragProvided.draggableProps.style}
                          >
                            {wordBank[wordIndex]}
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Flex>
                )}
              </Droppable>
            </Box>
          </VStack>
        </Box>

        <Box borderBottomWidth="1px" borderColor="whiteAlpha.200" />

        <Droppable droppableId="word-bank" direction="horizontal">
          {(provided, snapshot) => (
            <Flex
              ref={provided.innerRef}
              {...provided.droppableProps}
              wrap="wrap"
              gap={3}
              justify="center"
              p={2}
              minH="60px"
              bg={
                snapshot.isDraggingOver
                  ? "rgba(128, 90, 213, 0.05)"
                  : "transparent"
              }
              borderRadius="md"
              transition="background 0.2s ease"
            >
              {bankOrder.map((wordIndex, position) => (
                <Draggable
                  key={`bank-${wordIndex}`}
                  draggableId={`bank-${wordIndex}`}
                  index={position}
                  isDragDisabled={lastOk !== null}
                >
                  {(dragProvided, dragSnapshot) => (
                    <Box
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      px={4}
                      py={2}
                      rounded="lg"
                      borderWidth="2px"
                      borderColor={
                        dragSnapshot.isDragging
                          ? "purple.300"
                          : "rgba(255, 255, 255, 0.22)"
                      }
                      bg={
                        dragSnapshot.isDragging
                          ? "rgba(128, 90, 213, 0.16)"
                          : "rgba(255, 255, 255, 0.04)"
                      }
                      fontSize="sm"
                      cursor={lastOk !== null ? "default" : "pointer"}
                      onClick={() =>
                        lastOk === null && handleWordClick(wordIndex, position)
                      }
                      _hover={
                        lastOk === null
                          ? {
                              bg: "rgba(128, 90, 213, 0.12)",
                              borderColor: "purple.200",
                            }
                          : {}
                      }
                      transition="all 0.15s ease"
                      boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"
                      style={dragProvided.draggableProps.style}
                    >
                      {wordBank[wordIndex]}
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Flex>
          )}
        </Droppable>

        <Stack direction="row" spacing={3} align="center" justify="flex-end">
          {canSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              isDisabled={loading || isSubmitting}
              px={{ base: 6, md: 10 }}
              py={{ base: 3, md: 4 }}
            >
              {skipLabel}
            </Button>
          )}
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isDisabled={
              lastOk === true ||
              isSubmitting ||
              selectedWords.length === 0 ||
              loading
            }
            px={{ base: 7, md: 12 }}
            py={{ base: 3, md: 4 }}
          >
            {isSubmitting ? <Spinner size="sm" /> : submitLabel}
          </Button>
        </Stack>

        <FeedbackRail
          ok={lastOk}
          xp={recentXp}
          showNext={showNext}
          onNext={onNext}
          nextLabel={nextLabel}
          t={t}
          userLanguage={userLanguage}
          onExplainAnswer={onExplainAnswer}
          explanationText={explanationText}
          isLoadingExplanation={isLoadingExplanation}
          lessonProgress={lessonProgress}
          onCreateNote={onCreateNote}
          isCreatingNote={isCreatingNote}
          noteCreated={noteCreated}
        />
      </VStack>
    </DragDropContext>
  );
}
