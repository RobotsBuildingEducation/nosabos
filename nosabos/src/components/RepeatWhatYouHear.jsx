// components/RepeatWhatYouHear.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton, Stack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { SortableArea, SortableList, SortableItem } from "./dnd/Sortable";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import FeedbackRail from "./FeedbackRail";
import useSoundSettings from "../hooks/useSoundSettings";
import nextButtonSound from "../assets/nextbutton.mp3";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import VoiceOrb from "./VoiceOrb";
import { getLanguageDirection } from "../constants/languages";
import {
  getQuestionAssistantPanelProps,
  getQuestionChipProps,
  getQuestionToolButtonProps,
  questionSquircleStyle,
  questionAssistantText,
} from "./questionUiStyles";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;
const submitSpinner = <Spinner size="sm" thickness="2px" color="currentColor" />;
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_SHADOW = "var(--app-shadow-soft)";

function getLanguageTextProps(lang, { align = "start" } = {}) {
  const dir = getLanguageDirection(lang, "ltr");
  return {
    dir,
    lang,
    textAlign: align === "center" ? "center" : dir === "rtl" ? "right" : "left",
    sx: { unicodeBidi: "plaintext" },
  };
}

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
  sourceLang = "en",
  answerLang = "",

  userLanguage = "en",
  t = (key) => key,

  onSubmit = () => {},
  onSkip = () => {},
  onNext = () => {},
  onPlayTTS = () => {},
  canSkip = true,

  // Inline assistant support
  onAskAssistant = null,
  assistantSupportText = "",
  isLoadingAssistantSupport = false,

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
  const playSound = useSoundSettings((s) => s.playSound);
  const answerTextProps = getLanguageTextProps(answerLang || sourceLang);
  const answerDir = answerTextProps.dir;
  const assistantLabel =
    t("vocab_assistant") !== "vocab_assistant"
      ? t("vocab_assistant")
      : userLanguage === "hi"
        ? "सहायक"
        : userLanguage === "ar"
          ? "المساعد"
        : userLanguage === "zh"
          ? "助手"
        : userLanguage === "ja"
          ? "アシスタント"
          : userLanguage === "de"
            ? "Assistent"
          : userLanguage === "pt" || userLanguage === "it"
            ? "Assistente"
            : userLanguage === "es"
              ? "Asistente"
              : "Assistant";
  const [bankOrder, setBankOrder] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const hasPlayedRef = useRef(false);
  const primedWarmAudioPromiseRef = useRef(null);

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
      if (lastOk === true) return; // Allow correction on wrong answer
      setBankOrder((prev) => prev.filter((_, pos) => pos !== bankPosition));
      setSelectedWords((prev) => [...prev, wordIndex]);
    },
    [lastOk]
  );

  const handleSelectedWordClick = useCallback(
    (selectedPosition) => {
      if (lastOk === true) return; // Allow correction on wrong answer
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
      if (!result?.destination || lastOk === true) return; // Allow correction on wrong answer
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
    playSound(submitActionSound);
    const userAnswer = getUserAnswer();
    onSubmit(userAnswer);
  }, [getUserAnswer, onSubmit, playSound]);

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

  const handleSendHelp = useCallback(() => {
    if (!onAskAssistant || isLoadingAssistantSupport || assistantSupportText)
      return;
    const isFrenchUI = userLanguage === "fr";
    const isPortugueseUI = userLanguage === "pt";
    const isSpanishUI = userLanguage === "es";
    const isGermanUI = userLanguage === "de";
    const isJapaneseUI = userLanguage === "ja";
    const isArabicUI = userLanguage === "ar";
    const isChineseUI = userLanguage === "zh";
    const promptLines = [
      isJapaneseUI
        ? "「聞こえたものを繰り返す」練習です。単語バンクを使って、聞こえた文どおりに答えてください。"
        : isArabicUI
        ? "تمرين كرر اللي سمعته. جاوب بالجملة زي ما اتقالت مستخدمًا بنك الكلمات."
        : isChineseUI
        ? "这是“重复你听到的内容”练习。请使用给出的词库，按听到的句子作答。"
        : isFrenchUI
        ? "Exercice \"Repete ce que tu entends\". Reponds avec la phrase telle qu'elle a ete entendue en utilisant la banque de mots."
        : isPortugueseUI
        ? "Exercicio de repetir o que voce ouve. Responda com a frase exatamente como foi dita usando o banco de palavras."
        : isGermanUI
        ? "Übung \"Wiederhole, was du hörst\". Antworte mit dem Satz genau so, wie er gesprochen wurde, und nutze die Wortbank."
        : isSpanishUI
        ? "Ejercicio de 'Repite lo que escuchas'. Responde con la frase tal como se escuchó usando el banco de palabras."
        : "Repeat What You Hear exercise. Respond with the sentence as spoken using the provided word bank.",
      sourceSentence
        ? isJapaneseUI
          ? `聞こえた文: ${sourceSentence}`
          : isArabicUI
          ? `الجملة المسموعة: ${sourceSentence}`
          : isChineseUI
          ? `听到的句子：${sourceSentence}`
          : isFrenchUI
          ? `Phrase prononcee : ${sourceSentence}`
          : isPortugueseUI
          ? `Frase falada: ${sourceSentence}`
          : isGermanUI
          ? `Gesprochener Satz: ${sourceSentence}`
          : isSpanishUI
          ? `Frase pronunciada: ${sourceSentence}`
          : `Spoken sentence: ${sourceSentence}`
        : null,
      wordBank?.length
        ? isJapaneseUI
          ? `単語バンク: ${wordBank.join(" | ")}`
          : isArabicUI
          ? `بنك الكلمات: ${wordBank.join(" | ")}`
          : isChineseUI
          ? `词库：${wordBank.join(" | ")}`
          : isFrenchUI
          ? `Banque de mots : ${wordBank.join(" | ")}`
          : isPortugueseUI
          ? `Banco de palavras: ${wordBank.join(" | ")}`
          : isGermanUI
          ? `Wortbank: ${wordBank.join(" | ")}`
          : isSpanishUI
          ? `Banco de palabras: ${wordBank.join(" | ")}`
          : `Word bank: ${wordBank.join(" | ")}`
        : null,
      hint
        ? isJapaneseUI
          ? `ヒント: ${hint}`
          : isArabicUI
          ? `تلميح: ${hint}`
          : isChineseUI
          ? `提示：${hint}`
          : isFrenchUI
          ? `Indice : ${hint}`
          : isPortugueseUI
          ? `Dica: ${hint}`
          : isGermanUI
          ? `Hinweis: ${hint}`
          : isSpanishUI
          ? `Pista: ${hint}`
          : `Hint: ${hint}`
        : null,
    ].filter(Boolean);
    onAskAssistant(promptLines.join("\n"));
  }, [
    hint,
    onAskAssistant,
    isLoadingAssistantSupport,
    assistantSupportText,
    sourceSentence,
    userLanguage,
    wordBank,
  ]);

  const headingLabel = t("repeat_hear_heading");
  const instructionLabel = t("repeat_hear_instruction");
  const skipLabel = t("practice_skip_question");
  const submitLabel = t("quiz_submit");
  const nextLabel = t("practice_next_question");

  const handleManualPlay = useCallback(async () => {
    // Claim playback immediately so the mount auto-play effect can't fire a
    // second competing TTS request right after the user's first click.
    hasPlayedRef.current = true;
    const warmAudio =
      (await consumePrimedWarmAudio()) || (await createWarmAudio());
    onPlayTTS(sourceSentence, { warmAudio });
  }, [consumePrimedWarmAudio, createWarmAudio, onPlayTTS, sourceSentence]);

  return (
    <SortableArea onDragEnd={handleDragEnd}>
      <VStack align="stretch" spacing={4}>
        <Text fontSize="xl" fontWeight="bold" color={APP_TEXT_PRIMARY}>
          {headingLabel}
        </Text>
        <Box
          bg={APP_SURFACE_ELEVATED}
          borderRadius="lg"
          style={questionSquircleStyle}
          borderWidth="1px"
          borderColor={APP_BORDER}
          p={5}
          boxShadow={APP_SHADOW}
        >
          <VStack align="stretch" spacing={5}>
            {/* Audio speaker and assistant controls centered above the answer box */}
            <HStack justify="center" spacing={4} py={2}>
              <IconButton
                aria-label={
                  userLanguage === "ja"
                    ? "聞く"
                    : userLanguage === "zh"
                      ? "聆听"
                    : userLanguage === "ar"
                      ? "استمع"
                    : userLanguage === "pt"
                      ? "Ouvir"
                    : userLanguage === "es"
                      ? "Escuchar"
                      : "Listen"
                }
                icon={renderSpeakerIcon(isSynthesizing)}
                size="lg"
                fontSize="2xl"
                onPointerDown={primeTTSGesture}
                onTouchStart={primeTTSGesture}
                onClick={handleManualPlay}
                isRound
                {...getQuestionToolButtonProps({
                  active: isSynthesizing,
                })}
              />
              {onAskAssistant && (
                <IconButton
                  aria-label={
                    userLanguage === "ja"
                      ? "アシスタントに聞く"
                      : userLanguage === "zh"
                        ? "询问助手"
                        : userLanguage === "ar"
                          ? "اسأل المساعد"
                        : userLanguage === "pt"
                      ? "Pedir ajuda"
                      : userLanguage === "es"
                      ? "Pedir ayuda"
                      : "Ask the assistant"
                  }
                  icon={
                    isLoadingAssistantSupport ? (
                      <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} />
                    ) : (
                      <MdOutlineSupportAgent />
                    )
                  }
                  size="md"
                  fontSize="xl"
                  rounded="xl"
                  onClick={handleSendHelp}
                  isDisabled={
                    isLoadingAssistantSupport || !!assistantSupportText
                  }
                  {...getQuestionToolButtonProps()}
                />
              )}
            </HStack>

            <Box
              bg={APP_SURFACE}
              borderRadius="lg"
              style={questionSquircleStyle}
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
            >
              <SortableList
                id="selected-words"
                items={selectedWords.map((wordIndex) => `selected-${wordIndex}`)}
                wrap="wrap"
                gap={2}
                minH="48px"
                align="center"
                justify={answerDir === "rtl" ? "flex-end" : "flex-start"}
                dir={answerDir}
                bg="transparent"
                activeStyles={{ bg: "rgba(128, 90, 213, 0.08)" }}
                borderRadius="md"
                style={questionSquircleStyle}
                p={2}
                transition="background 0.2s ease"
              >
                {selectedWords.length === 0 && (
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
                  <SortableItem
                    key={`selected-${wordIndex}`}
                    id={`selected-${wordIndex}`}
                    disabled={lastOk === true}
                  >
                    {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                      <Box
                        ref={setNodeRef}
                        style={style}
                        {...attributes}
                        {...listeners}
                        px={3}
                        py={2}
                        rounded="md"
                        {...getQuestionChipProps({
                          dragging: isDragging,
                        })}
                        cursor={lastOk === true ? "default" : "grab"}
                        dir={answerTextProps.dir}
                        lang={answerTextProps.lang}
                        sx={{ unicodeBidi: "plaintext" }}
                        onClick={() => {
                          if (lastOk !== true) {
                            playSound(selectSound);
                            handleSelectedWordClick(position);
                          }
                        }}
                        _hover={
                          lastOk !== true ? getQuestionChipProps()._hover : {}
                        }
                        >
                          {wordBank[wordIndex]}
                        </Box>
                      )}
                    </SortableItem>
                  ))}
                </SortableList>
            </Box>
          </VStack>
        </Box>

        <Box borderBottomWidth="1px" borderColor={APP_BORDER} />

        <SortableList
          id="word-bank"
          items={bankOrder.map((wordIndex) => `bank-${wordIndex}`)}
          wrap="wrap"
          gap={3}
          justify="center"
          p={2}
          minH="60px"
          dir={answerDir}
          bg="transparent"
          activeStyles={{ bg: "rgba(128, 90, 213, 0.05)" }}
          borderRadius="md"
          style={questionSquircleStyle}
          transition="background 0.2s ease"
        >
              {bankOrder.map((wordIndex, position) => (
                <SortableItem
                  key={`bank-${wordIndex}`}
                  id={`bank-${wordIndex}`}
                  disabled={lastOk === true}
                >
                  {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                    <Box
                      ref={setNodeRef}
                      style={style}
                      {...attributes}
                      {...listeners}
                      px={4}
                      py={2}
                      rounded="lg"
                      {...getQuestionChipProps({
                        dragging: isDragging,
                      })}
                      fontSize="sm"
                      dir={answerTextProps.dir}
                      lang={answerTextProps.lang}
                      sx={{ unicodeBidi: "plaintext" }}
                      cursor={lastOk === true ? "default" : "pointer"}
                      onClick={() => {
                        if (lastOk !== true) {
                          playSound(selectSound);
                          handleWordClick(wordIndex, position);
                        }
                      }}
                      _hover={
                        lastOk !== true ? getQuestionChipProps()._hover : {}
                      }
                    >
                      {wordBank[wordIndex]}
                    </Box>
                  )}
                </SortableItem>
              ))}
            </SortableList>

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
              {isLoadingAssistantSupport && (
                <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} />
              )}
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
            {isSubmitting ? submitSpinner : submitLabel}
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
    </SortableArea>
  );
}
