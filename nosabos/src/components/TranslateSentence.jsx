// components/TranslateSentence.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton, Text,
  Spinner,
  VStack,
  Stack,
  Center,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import FeedbackRail from "./FeedbackRail";
import useSoundSettings from "../hooks/useSoundSettings";
import nextButtonSound from "../assets/nextbutton.mp3";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import VoiceOrb from "./VoiceOrb";
import {
  getQuestionAssistantPanelProps,
  getQuestionChipProps,
  getQuestionToolButtonProps,
  questionAssistantText,
} from "./questionUiStyles";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

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
  const playSound = useSoundSettings((s) => s.playSound);
  const assistantLabel =
    t("vocab_assistant") !== "vocab_assistant"
      ? t("vocab_assistant")
      : userLanguage === "hi"
        ? "सहायक"
        : userLanguage === "ar"
          ? "المساعد"
        : userLanguage === "ja"
          ? "アシスタント"
          : userLanguage === "pt" || userLanguage === "it"
            ? "Assistente"
            : userLanguage === "es"
              ? "Asistente"
              : "Assistant";
  // Word bank state - indices of words still available
  const [bankOrder, setBankOrder] = useState([]);
  // Selected words - indices of words user has chosen, in order
  const [selectedWords, setSelectedWords] = useState([]);
  const primedWarmAudioPromiseRef = useRef(null);

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
    playSound(submitActionSound);
    const userAnswer = getUserAnswer();
    onSubmit(userAnswer);
  }, [getUserAnswer, onSubmit, playSound]);

  const handleSendHelp = useCallback(() => {
    if (!onAskAssistant || isLoadingAssistantSupport || assistantSupportText) return;
    const isFrenchUI = userLanguage === "fr";
    const isPortugueseUI = userLanguage === "pt";
    const isSpanishUI = userLanguage === "es";
    const isJapaneseUI = userLanguage === "ja";
    const isArabicUI = userLanguage === "ar";
    const promptLines = [
      isJapaneseUI
        ? "提供された単語バンクを使って、この文を翻訳してください。"
        : isArabicUI
        ? "ترجم الجملة دي باستخدام بنك الكلمات الموجود."
        : isFrenchUI
        ? "Traduis cette phrase avec la banque de mots fournie."
        : isPortugueseUI
        ? "Traduza esta frase usando o banco de palavras fornecido."
        : isSpanishUI
        ? "Traduce esta oración usando el banco de palabras proporcionado."
        : "Translate this sentence using the provided word bank.",
      sourceSentence
        ? isJapaneseUI
          ? `翻訳する文: ${sourceSentence}`
          : isArabicUI
          ? `الجملة المطلوب ترجمتها: ${sourceSentence}`
          : isFrenchUI
          ? `Phrase a traduire : ${sourceSentence}`
          : isPortugueseUI
          ? `Frase para traduzir: ${sourceSentence}`
          : isSpanishUI
          ? `Oración para traducir: ${sourceSentence}`
          : `Sentence to translate: ${sourceSentence}`
        : null,
      wordBank?.length
        ? isJapaneseUI
          ? `単語バンク: ${wordBank.join(" | ")}`
          : isArabicUI
          ? `بنك الكلمات: ${wordBank.join(" | ")}`
          : isFrenchUI
          ? `Banque de mots : ${wordBank.join(" | ")}`
          : isPortugueseUI
          ? `Banco de palavras: ${wordBank.join(" | ")}`
          : isSpanishUI
          ? `Banco de palabras: ${wordBank.join(" | ")}`
          : `Word bank: ${wordBank.join(" | ")}`
        : null,
      hint
        ? isJapaneseUI
          ? `ヒント: ${hint}`
          : isArabicUI
          ? `تلميح: ${hint}`
          : isFrenchUI
          ? `Indice : ${hint}`
          : isPortugueseUI
          ? `Dica: ${hint}`
          : isSpanishUI
          ? `Pista: ${hint}`
          : `Hint: ${hint}`
        : null,
      isJapaneseUI
        ? "単語バンクの選択肢を組み合わせて、正しい翻訳で答えてください。"
        : isArabicUI
        ? "جاوب بالترجمة الصحيحة المكوّنة من اختيارات بنك الكلمات."
        : isFrenchUI
        ? "Reponds avec la traduction correcte assemblee a partir des options de la banque de mots."
        : isPortugueseUI
        ? "Responda com a traducao correta montada com as opcoes do banco de palavras."
        : isSpanishUI
        ? "Responde con la traducción correcta armada con las opciones del banco de palabras."
        : "Respond with the correct translation assembled from the word bank options.",
    ].filter(Boolean);
    onAskAssistant(promptLines.join("\n"));
  }, [hint, onAskAssistant, isLoadingAssistantSupport, assistantSupportText, sourceSentence, userLanguage, wordBank]);

  const translateLabel = t("translate_sentence_heading");
  const skipLabel = t("practice_skip_question");
  const submitLabel = t("quiz_submit");
  const nextLabel = t("practice_next_question");
  const instructionLabel = t("translate_sentence_instruction");

  const createWarmAudio = useCallback(async () => {
    try {
      const warm = new Audio();
      warm.playsInline = true;
      warm.muted = true;
      warm.volume = 0;
      warm.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const warmPlay = warm.play();
      warmPlay
        ?.then(() => {
          warm.pause();
          try {
            warm.currentTime = 0;
          } catch {
            // Mobile Safari can reject rewinding warmed audio; playback still works.
          }
        })
        .catch(() => undefined);
      warm.muted = false;
      warm.volume = 1;
      return warm;
    } catch {
      return null;
    }
  }, []);

  const primeTTSGesture = useCallback(() => {
    if (primedWarmAudioPromiseRef.current) return;
    primedWarmAudioPromiseRef.current = createWarmAudio().catch(() => null);
  }, [createWarmAudio]);

  const consumePrimedWarmAudio = useCallback(async () => {
    const pendingWarmAudio = primedWarmAudioPromiseRef.current;
    primedWarmAudioPromiseRef.current = null;
    if (!pendingWarmAudio) return null;
    try {
      return await pendingWarmAudio;
    } catch {
      return null;
    }
  }, []);

  const handleManualPlay = useCallback(async () => {
    const warmAudio =
      (await consumePrimedWarmAudio()) || (await createWarmAudio());
    onPlayTTS(sourceSentence, { warmAudio });
  }, [consumePrimedWarmAudio, createWarmAudio, onPlayTTS, sourceSentence]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <VStack align="stretch" spacing={4}>
        {/* Header with character and sentence */}
        <Text fontSize="xl" fontWeight="bold" color={APP_TEXT_PRIMARY}>
          {translateLabel}
        </Text>
        <Box
          bg={APP_SURFACE_ELEVATED}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={APP_BORDER}
          p={5}
          boxShadow={APP_SHADOW}
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
                bg={APP_SURFACE}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={APP_BORDER}
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
                        borderColor: `transparent ${APP_SURFACE} transparent transparent`,
                      }
                    : {}
                }
              >
                <HStack align="start" spacing={2}>
                  {onAskAssistant && (
                    <IconButton
                      aria-label={
                        userLanguage === "ja"
                          ? "アシスタントに聞く"
                          : userLanguage === "ar"
                            ? "اسأل المساعد"
                          : userLanguage === "pt"
                          ? "Pedir ajuda"
                          : userLanguage === "es"
                          ? "Pedir ayuda"
                          : "Ask the assistant"
                      }
                      icon={isLoadingAssistantSupport ? <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} /> : <MdOutlineSupportAgent />}
                      size="sm"
                      fontSize="lg"
                      rounded="xl"
                      onClick={handleSendHelp}
                      isDisabled={isLoadingAssistantSupport || !!assistantSupportText}
                      {...getQuestionToolButtonProps()}
                    />
                  )}
                  <IconButton
                    aria-label={
                      userLanguage === "ja"
                        ? "聞く"
                        : userLanguage === "ar"
                          ? "استمع"
                        : userLanguage === "pt"
                          ? "Ouvir"
                        : userLanguage === "es"
                          ? "Escuchar"
                          : "Listen"
                    }
                    icon={renderSpeakerIcon(isSynthesizing)}
                    size="sm"
                    fontSize="lg"
                    onPointerDown={primeTTSGesture}
                    onTouchStart={primeTTSGesture}
                    onClick={handleManualPlay}
                    {...getQuestionToolButtonProps({ active: isSynthesizing })}
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
            {...getQuestionAssistantPanelProps()}
          >
            <HStack spacing={2} mb={2}>
              <MdOutlineSupportAgent color={questionAssistantText.accent} />
              <Text fontWeight="semibold" color={questionAssistantText.accentStrong}>
                {assistantLabel}
              </Text>
              {isLoadingAssistantSupport && <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} />}
            </HStack>
            <Box
              fontSize="md"
              color={APP_TEXT_PRIMARY}
              lineHeight="1.6"
              sx={{
                "& p": { mb: 2 },
                "& p:last-child": { mb: 0 },
                "& strong": {
                  fontWeight: "bold",
                  color: questionAssistantText.accentStrong,
                },
                "& em": { fontStyle: "italic" },
                "& ul, & ol": { pl: 4, mb: 2 },
                "& li": { mb: 1 },
                "& code": {
                  bg: APP_SURFACE,
                  px: 1,
                  py: 0.5,
                  borderRadius: "sm",
                  fontFamily: "mono",
                },
              }}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          </Box>
        )}

        {/* Answer area - where selected words appear */}
        <Box
          bg={APP_SURFACE_ELEVATED}
          borderRadius="lg"
          borderWidth="2px"
          borderColor={
            lastOk === true
              ? "green.400"
              : lastOk === false
              ? "red.400"
              : APP_BORDER
          }
          p={4}
          minH="80px"
          boxShadow={APP_SHADOW}
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
                    color={APP_TEXT_MUTED}
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
                        {...getQuestionChipProps({
                          dragging: dragSnapshot.isDragging,
                        })}
                        fontSize="sm"
                        cursor={lastOk === true ? "default" : "pointer"}
                        onClick={() => {
                          if (lastOk !== true) {
                            playSound(selectSound);
                            handleSelectedWordClick(position);
                          }
                        }}
                        _hover={lastOk !== true ? getQuestionChipProps()._hover : {}}
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
        <Box borderBottomWidth="1px" borderColor={APP_BORDER} />

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
                      {...getQuestionChipProps({
                        dragging: dragSnapshot.isDragging,
                      })}
                      fontSize="sm"
                      cursor={lastOk === true ? "default" : "pointer"}
                      onClick={() => {
                        if (lastOk !== true) {
                          playSound(selectSound);
                          handleWordClick(wordIndex, position);
                        }
                      }}
                      _hover={lastOk !== true ? getQuestionChipProps()._hover : {}}
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
              px={{ base: 6, md: 10 }}
              py={{ base: 3, md: 4 }}
              color={APP_TEXT_PRIMARY}
              _hover={{ bg: APP_SURFACE_MUTED }}
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
            {isSubmitting ? <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={24} /> : submitLabel}
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
