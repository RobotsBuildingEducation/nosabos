// components/TranslateSentence.jsx
import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
  Stack,
  Center,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import FeedbackRail from "./FeedbackRail";
import selectSound from "../assets/select.wav";

const playSelectSound = () => {
  const audio = new Audio(selectSound);
  audio.play().catch(() => {});
};

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;

/**
 * TranslateSentence - A Duolingo-style translation exercise component
 *
 * Users see a sentence in the source language and must construct the translation
 * by selecting/dragging words from a word bank.
 */
export default function TranslateSentence({
  // Question data
  sourceSentence = "",
  wordBank = [], // Array of word options (includes correct words + distractors)
  // eslint-disable-next-line no-unused-vars
  correctAnswer = [], // Array of correct words in order (validation handled by parent)
  hint = "",
  loading = false,

  // User language / UI
  userLanguage = "en",
  t = (key) => key, // translation function

  // Callbacks
  onSubmit = () => {},
  onSkip = () => {},
  onNext = () => {},
  onPlayTTS = () => {},
  canSkip = true,

  // Inline assistant support
  onAskAssistant = null,
  assistantSupportText = "",
  isLoadingAssistantSupport = false,

  // State
  lastOk = null,
  recentXp = 0,
  isSubmitting = false,
  showNext = false,

  // TTS
  isSynthesizing = false,

  // Explanation & Notes
  onExplainAnswer = null,
  explanationText = "",
  isLoadingExplanation = false,
  lessonProgress = null,
  onCreateNote = null,
  isCreatingNote = false,
  noteCreated = false,

  // Optional character (like Duolingo mascot)
  characterImage = null,
}) {
  // Word bank state - indices of words still available
  const [bankOrder, setBankOrder] = useState([]);
  // Selected words - indices of words user has chosen, in order
  const [selectedWords, setSelectedWords] = useState([]);

  // Reset state when question changes
  useEffect(() => {
    if (wordBank.length > 0) {
      setBankOrder(wordBank.map((_, idx) => idx));
      setSelectedWords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordBank.join("|")]);

  // Handle clicking a word in the bank to add it to selection
  const handleWordClick = useCallback(
    (wordIndex, bankPosition) => {
      if (lastOk === true) return; // Don't allow changes after correct answer (allow retry on wrong)

      // Remove from bank, add to selected
      setBankOrder((prev) => prev.filter((_, pos) => pos !== bankPosition));
      setSelectedWords((prev) => [...prev, wordIndex]);
    },
    [lastOk]
  );

  // Handle clicking a selected word to return it to the bank
  const handleSelectedWordClick = useCallback(
    (selectedPosition) => {
      if (lastOk === true) return; // Allow correction on wrong answer

      const wordIndex = selectedWords[selectedPosition];
      // Remove from selected, add back to bank
      setSelectedWords((prev) =>
        prev.filter((_, pos) => pos !== selectedPosition)
      );
      setBankOrder((prev) => [...prev, wordIndex]);
    },
    [selectedWords, lastOk]
  );

  // Handle drag and drop
  const handleDragEnd = useCallback(
    (result) => {
      if (!result?.destination || lastOk === true) return; // Allow correction on wrong answer

      const { source, destination } = result;

      // Same position - no change
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      // Dragging within the bank (reorder)
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

      // Dragging within selected area (reorder)
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

      // Dragging from bank to selected
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

      // Dragging from selected back to bank
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

  // Get the user's answer as an array of words
  const getUserAnswer = useCallback(() => {
    return selectedWords.map((idx) => wordBank[idx]);
  }, [selectedWords, wordBank]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    const userAnswer = getUserAnswer();
    onSubmit(userAnswer);
  }, [getUserAnswer, onSubmit]);

  const handleSendHelp = useCallback(() => {
    if (!onAskAssistant || isLoadingAssistantSupport || assistantSupportText) return;
    const isSpanishUI = userLanguage === "es";
    const promptLines = [
      isSpanishUI
        ? "Traduce esta oración usando el banco de palabras proporcionado."
        : "Translate this sentence using the provided word bank.",
      sourceSentence
        ? isSpanishUI
          ? `Oración para traducir: ${sourceSentence}`
          : `Sentence to translate: ${sourceSentence}`
        : null,
      wordBank?.length
        ? isSpanishUI
          ? `Banco de palabras: ${wordBank.join(" | ")}`
          : `Word bank: ${wordBank.join(" | ")}`
        : null,
      hint ? (isSpanishUI ? `Pista: ${hint}` : `Hint: ${hint}`) : null,
      isSpanishUI
        ? "Responde con la traducción correcta armada con las opciones del banco de palabras."
        : "Respond with the correct translation assembled from the word bank options.",
    ].filter(Boolean);
    onAskAssistant(promptLines.join("\n"));
  }, [hint, onAskAssistant, isLoadingAssistantSupport, assistantSupportText, sourceSentence, userLanguage, wordBank]);

  const translateLabel =
    userLanguage === "es" ? "Traduce esta frase" : "Translate this sentence";
  const skipLabel = userLanguage === "es" ? "Saltar" : "Skip";
  const submitLabel = userLanguage === "es" ? "Comprobar" : "Submit";
  const nextLabel =
    userLanguage === "es" ? "Siguiente pregunta" : "Next question";
  const instructionLabel =
    userLanguage === "es"
      ? "Toca las palabras para formar tu respuesta"
      : "Tap the words to form your answer";

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <VStack align="stretch" spacing={4}>
        {/* Header with character and sentence */}
        <Text fontSize="xl" fontWeight="bold" color="white">
          {translateLabel}
        </Text>
        <Box
          bg="rgba(255, 255, 255, 0.02)"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
          p={5}
        >
          <VStack align="stretch" spacing={4}>
            {/* Title */}

            {/* Character + Speech bubble */}
            <HStack align="start" spacing={4}>
              {characterImage && (
                <Box flexShrink={0} w="100px">
                  <img
                    src={characterImage}
                    alt="Character"
                    style={{ width: "100%", height: "auto" }}
                  />
                </Box>
              )}
              <Box
                flex="1"
                bg="rgba(255, 255, 255, 0.08)"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                p={4}
                position="relative"
                _before={
                  characterImage
                    ? {
                        content: '""',
                        position: "absolute",
                        left: "-12px",
                        top: "20px",
                        borderWidth: "8px",
                        borderStyle: "solid",
                        borderColor:
                          "transparent rgba(255, 255, 255, 0.08) transparent transparent",
                      }
                    : {}
                }
              >
                <HStack align="start" spacing={2}>
                  {onAskAssistant && (
                    <IconButton
                      aria-label={
                        userLanguage === "es"
                          ? "Pedir ayuda"
                          : "Ask the assistant"
                      }
                      icon={isLoadingAssistantSupport ? <Spinner size="xs" /> : <MdOutlineSupportAgent />}
                      size="sm"
                      fontSize="lg"
                      rounded="xl"
                      bg="white"
                      color="blue"
                      boxShadow="0 4px 0 blue"
                      onClick={handleSendHelp}
                      isDisabled={isLoadingAssistantSupport || !!assistantSupportText}
                    />
                  )}
                  <IconButton
                    aria-label={userLanguage === "es" ? "Escuchar" : "Listen"}
                    icon={renderSpeakerIcon(isSynthesizing)}
                    size="sm"
                    fontSize="lg"
                    variant="ghost"
                    onClick={() => onPlayTTS(sourceSentence)}
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    flex="1"
                    lineHeight="tall"
                  >
                    {sourceSentence || (loading ? "..." : "")}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </VStack>
        </Box>

        {/* Inline assistant support response */}
        {(assistantSupportText || isLoadingAssistantSupport) && (
          <Box
            p={4}
            borderRadius="lg"
            bg="rgba(66, 153, 225, 0.1)"
            borderWidth="1px"
            borderColor="blue.400"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
          >
            <HStack spacing={2} mb={2}>
              <MdOutlineSupportAgent color="var(--chakra-colors-blue-400)" />
              <Text fontWeight="semibold" color="blue.300">
                {userLanguage === "es" ? "Asistente" : "Assistant"}
              </Text>
              {isLoadingAssistantSupport && <Spinner size="xs" color="blue.400" />}
            </HStack>
            <Box
              fontSize="md"
              color="whiteAlpha.900"
              lineHeight="1.6"
              sx={{
                "& p": { mb: 2 },
                "& p:last-child": { mb: 0 },
                "& strong": { fontWeight: "bold", color: "blue.200" },
                "& em": { fontStyle: "italic" },
                "& ul, & ol": { pl: 4, mb: 2 },
                "& li": { mb: 1 },
              }}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          </Box>
        )}

        {/* Answer area - where selected words appear */}
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
                {selectedWords.length === 0 && !snapshot.isDraggingOver && (
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
                {selectedWords.map((wordIndex, position) => (
                  <Draggable
                    key={`selected-${wordIndex}-${position}`}
                    draggableId={`selected-${wordIndex}-${position}`}
                    index={position}
                    isDragDisabled={lastOk === true}
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
                            : "rgba(128, 90, 213, 0.12)"
                        }
                        fontSize="sm"
                        cursor={lastOk === true ? "default" : "pointer"}
                        onClick={() => {
                          if (lastOk !== true) {
                            playSelectSound();
                            handleSelectedWordClick(position);
                          }
                        }}
                        _hover={
                          lastOk !== true
                            ? {
                                bg: "rgba(128, 90, 213, 0.2)",
                                borderColor: "purple.300",
                              }
                            : {}
                        }
                        transition="all 0.15s ease"
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

        {/* Divider line */}
        <Box borderBottomWidth="1px" borderColor="whiteAlpha.200" />

        {/* Word bank */}
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
                  isDragDisabled={lastOk === true}
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
                      cursor={lastOk === true ? "default" : "pointer"}
                      onClick={() => {
                        if (lastOk !== true) {
                          playSelectSound();
                          handleWordClick(wordIndex, position);
                        }
                      }}
                      _hover={
                        lastOk !== true
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

        {/* Action buttons */}
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

        {/* Feedback rail */}
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
