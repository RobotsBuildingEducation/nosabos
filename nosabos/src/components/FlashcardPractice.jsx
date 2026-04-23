import React, { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Portal,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiStarLine,
  RiMicLine,
  RiStopCircleLine,
  RiKeyboardLine,
  RiEyeLine,
  RiVolumeUpLine,
} from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import {
  LOW_LATENCY_TTS_FORMAT,
  getRandomVoice,
  getTTSPlayer,
  stopTTSPlayback,
  TTS_LANG_TAG,
} from "../utils/tts";
import { CEFR_COLORS, getConceptText } from "../data/flashcardData";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import useNotesStore from "../hooks/useNotesStore";
import { generateNoteContent, buildNoteObject } from "../utils/noteGeneration";
import { RiBookmarkLine } from "react-icons/ri";
import { FiHelpCircle } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_GLOW,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import submitActionSound from "../assets/submitaction.mp3";
import deliciousSound from "../assets/delicious.mp3";
import selectSound from "../assets/select.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import RandomCharacter from "./RandomCharacter";
import VoiceOrb from "./VoiceOrb";
import { useThemeStore } from "../useThemeStore";
import {
  buildFlashcardReviewUpdate,
  FLASHCARD_REVIEW_STATES,
  getSchedulerRatingOptions,
  mapXpToReviewOutcome,
} from "../utils/flashcardReview";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

const MotionBox = motion(Box);
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return normalizeSupportLanguage(
      localStorage.getItem("appLanguage"),
      DEFAULT_SUPPORT_LANGUAGE,
    );
  }
  return DEFAULT_SUPPORT_LANGUAGE;
};

// Translation helper for UI strings - uses appLanguage for UI text
const getTranslation = (key, params = {}) => {
  const lang = getAppLanguage();
  const dict = translations[lang] ?? translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
};

// Get effective language for flashcard content display
// supportLang (from conversation settings) takes precedence if explicitly set
// Otherwise fall back to appLanguage (from account settings)
const getEffectiveCardLanguage = (supportLang) => {
  const appLang = getAppLanguage();
  const normalizedSupportLang = normalizeSupportLanguage(supportLang, appLang);
  // If supportLang is set to something other than default "en", use it
  // This means user explicitly chose a support language in conversation settings
  if (supportLang && normalizedSupportLang !== "en") {
    return normalizedSupportLang;
  }
  // Otherwise use the app language preference
  return appLang;
};

// Language name helper
const LANG_NAME = (code) => {
  const appLang = getAppLanguage();
  const dict = translations[appLang] || translations.en;
  const key = `language_${code === "nah" ? "nah" : code}`;
  return dict[key] || translations.en[key] || code;
};

// Build AI grading prompt for flashcard translation
function buildFlashcardJudgePrompt({
  concept,
  userAnswer,
  targetLang,
  supportLang,
  cefrLevel,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);

  return `
Judge a flashcard translation from ${SUPPORT} to ${TARGET} (CEFR ${cefrLevel}).

Original (${SUPPORT}):
${concept}

User's translation (${TARGET}):
${userAnswer}

Policy:
- Say YES if the translation accurately conveys the meaning in ${TARGET}.
- Allow natural variations and synonyms that maintain the core meaning.
- Ignore minor grammatical errors if the meaning is clear.
- Allow missing or incorrect accent marks/diacritics.
- For common phrases, accept culturally appropriate equivalents.
- If the meaning is significantly wrong or incomprehensible, say NO.

Reply with ONE of these formats:
YES | <xp_amount>
NO

Where <xp_amount> is 4-7 based on:
- 7 XP: Perfect translation with natural phrasing
- 6 XP: Correct meaning with minor imperfections
- 5 XP: Acceptable translation with some awkwardness
- 4 XP: Barely acceptable but conveys basic meaning
`.trim();
}

function getFlashcardModalTrimTheme(card, cefrColor, isLightTheme) {
  const practiceStatus =
    card?.practiceStatus ||
    (card?.reviewState === FLASHCARD_REVIEW_STATES.DUE
      ? "due"
      : card?.reviewState === FLASHCARD_REVIEW_STATES.LEARNING
        ? "learning"
        : card?.reviewState === FLASHCARD_REVIEW_STATES.SCHEDULED
          ? "scheduled"
          : "active");

  switch (practiceStatus) {
    case "due":
      return {
        borderColor: isLightTheme
          ? "rgba(181, 137, 71, 0.34)"
          : "rgba(251, 191, 36, 0.55)",
        ringColor: isLightTheme
          ? "rgba(181, 137, 71, 0.1)"
          : "rgba(251, 191, 36, 0.22)",
      };
    case "weak":
      return {
        borderColor: isLightTheme
          ? "rgba(194, 103, 132, 0.3)"
          : "rgba(244, 114, 182, 0.36)",
        ringColor: isLightTheme
          ? "rgba(194, 103, 132, 0.1)"
          : "rgba(244, 114, 182, 0.18)",
      };
    case "learning":
      return {
        borderColor: isLightTheme
          ? "rgba(69, 145, 122, 0.28)"
          : "rgba(45, 212, 191, 0.34)",
        ringColor: isLightTheme
          ? "rgba(69, 145, 122, 0.1)"
          : "rgba(45, 212, 191, 0.18)",
      };
    case "scheduled":
      return {
        borderColor: isLightTheme ? APP_BORDER : "rgba(255, 255, 255, 0.22)",
        ringColor: isLightTheme
          ? "rgba(122, 94, 61, 0.08)"
          : "rgba(255, 255, 255, 0.12)",
      };
    default:
      return {
        borderColor: isLightTheme ? `${cefrColor.primary}52` : `${cefrColor.primary}80`,
        ringColor: isLightTheme ? `${cefrColor.primary}14` : `${cefrColor.primary}26`,
      };
  }
}

export default function FlashcardPractice({
  card,
  isOpen,
  onClose,
  onComplete,
  targetLang = "es",
  supportLang = "en",
  pauseMs = 2000,
  languageXp = 0,
}) {
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [, setIsPlayingAudio] = useState(false);
  const [loadingTts, setLoadingTts] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [aiSuggestedRating, setAiSuggestedRating] = useState(null);
  const [assessmentMode, setAssessmentMode] = useState(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const streamingRef = useRef(false);
  const explanationStreamingRef = useRef(false);
  const audioRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  // Notes store
  const addNote = useNotesStore((s) => s.addNote);
  const setNotesLoading = useNotesStore((s) => s.setLoading);
  const triggerDoneAnimation = useNotesStore((s) => s.triggerDoneAnimation);

  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const modalTrimTheme = useMemo(
    () => getFlashcardModalTrimTheme(card, cefrColor, isLightTheme),
    [card, cefrColor, isLightTheme],
  );
  const currentLanguageXp = Number(languageXp) || 0;
  const updatedTotalXp = currentLanguageXp + xpAwarded;
  const xpLevelNumber = Math.floor(updatedTotalXp / 100) + 1;
  const nextLevelProgressPct = updatedTotalXp % 100;
  const effectiveCardLanguage = getEffectiveCardLanguage(supportLang);
  const ratingOptions = useMemo(
    () => getSchedulerRatingOptions(card.reviewProgress || {}),
    [card.reviewProgress],
  );
  const ratingLabel = (rating) =>
    getTranslation(`flashcard_button_${rating}`) || rating;
  const ratingDescription = (rating) =>
    getTranslation(`flashcard_button_${rating}_help`);
  const reviewHelpItems = ratingOptions.map((option) => ({
    rating: option.rating,
    label: ratingLabel(option.rating),
    description: ratingDescription(option.rating),
  }));
  const defaultModalShell = {
    bg: isLightTheme ? APP_SURFACE_ELEVATED : "#08142b",
    background: isLightTheme
      ? "linear-gradient(180deg, rgba(255, 251, 245, 0.98) 0%, rgba(246, 237, 224, 0.98) 100%)"
      : "radial-gradient(circle at 20% 15%, rgba(56,189,248,0.14) 0%, transparent 42%), " +
        "radial-gradient(circle at 82% 25%, rgba(45,212,191,0.12) 0%, transparent 40%), " +
        "radial-gradient(circle at 50% 100%, rgba(30,64,175,0.28) 0%, transparent 62%), " +
        "linear-gradient(180deg, rgba(8,20,43,0.95) 0%, rgba(5,16,36,0.98) 100%)",
  };
  const resultTheme =
    assessmentMode === "self"
      ? {
          title: getTranslation("flashcard_rate_recall"),
          icon: (
            <RiEyeLine
              size={30}
              color={isLightTheme ? "#7b8794" : "#93C5FD"}
            />
          ),
          shellBg: isLightTheme ? APP_SURFACE_ELEVATED : "#10233d",
          shellBorderColor: isLightTheme
            ? "rgba(113, 145, 186, 0.28)"
            : "rgba(96, 165, 250, 0.38)",
          shellRingColor: isLightTheme
            ? "rgba(113, 145, 186, 0.08)"
            : "rgba(96, 165, 250, 0.2)",
          shellBackground: isLightTheme
            ? "linear-gradient(180deg, rgba(249, 247, 243, 0.98) 0%, rgba(236, 242, 250, 0.96) 100%)"
            : "radial-gradient(circle at 20% 15%, rgba(125,211,252,0.14) 0%, transparent 42%), " +
              "radial-gradient(circle at 82% 22%, rgba(96,165,250,0.16) 0%, transparent 38%), " +
              "radial-gradient(circle at 50% 100%, rgba(37,99,235,0.24) 0%, transparent 60%), " +
              "linear-gradient(180deg, rgba(18,44,84,0.95) 0%, rgba(10,26,54,0.98) 100%)",
        }
      : isCorrect
        ? {
            title: getTranslation("flashcard_correct"),
            icon: <RiCheckLine size={32} color="#22C55E" />,
            shellBg: isLightTheme ? APP_SURFACE_ELEVATED : "#1c6668",
            shellBorderColor: isLightTheme
              ? "rgba(74, 160, 112, 0.28)"
              : "rgba(74, 222, 128, 0.42)",
            shellRingColor: isLightTheme
              ? "rgba(74, 160, 112, 0.08)"
              : "rgba(45, 212, 191, 0.2)",
            shellBackground: isLightTheme
              ? "linear-gradient(180deg, rgba(248, 250, 244, 0.98) 0%, rgba(230, 242, 234, 0.98) 100%)"
              : "radial-gradient(circle at 20% 15%, rgba(74,222,128,0.14) 0%, transparent 40%), " +
                "radial-gradient(circle at 82% 20%, rgba(45,212,191,0.18) 0%, transparent 38%), " +
                "radial-gradient(circle at 50% 100%, rgba(34,197,94,0.16) 0%, transparent 60%), " +
                "linear-gradient(180deg, rgba(58,155,155,0.95) 0%, rgba(49,140,140,0.98) 100%)",
          }
        : {
            title: getTranslation("flashcard_incorrect"),
            icon: <RiCloseLine size={32} color="#EF4444" />,
            shellBg: isLightTheme ? APP_SURFACE_ELEVATED : "#6b1d25",
            shellBorderColor: isLightTheme
              ? "rgba(198, 112, 126, 0.3)"
              : "rgba(248, 113, 113, 0.5)",
            shellRingColor: isLightTheme
              ? "rgba(198, 112, 126, 0.08)"
              : "rgba(239, 68, 68, 0.24)",
            shellBackground: isLightTheme
              ? "linear-gradient(180deg, rgba(252, 246, 246, 0.98) 0%, rgba(248, 233, 236, 0.98) 100%)"
              : "radial-gradient(circle at 20% 15%, rgba(251,113,133,0.12) 0%, transparent 40%), " +
                "radial-gradient(circle at 82% 20%, rgba(248,113,113,0.18) 0%, transparent 36%), " +
                "radial-gradient(circle at 50% 100%, rgba(127,29,29,0.22) 0%, transparent 60%), " +
                "linear-gradient(180deg, rgba(112,28,39,0.96) 0%, rgba(96,22,32,0.98) 100%)",
          };
  const modalShellTheme = showResult
    ? {
        ...modalTrimTheme,
        bg: resultTheme.shellBg,
        background: resultTheme.shellBackground,
      }
    : {
        ...defaultModalShell,
        ...modalTrimTheme,
      };
  const shouldCenterModalContent = !(
    showResult &&
    assessmentMode === "ai" &&
    !isCorrect &&
    explanationText
  );
  const playReviewRatingSound = (rating) => {
    if (rating === "easy") {
      playSound(deliciousSound);
      return;
    }

    if (rating === "good" || rating === "hard") {
      playSound(nextButtonSound);
      return;
    }

    playSound(selectSound);
  };
  const reviewButtonThemes = {
    again: {
      bg: isLightTheme ? "#ddb4c3" : "#d45b88",
      hoverBg: isLightTheme ? "#d7a8ba" : "#dc7098",
      activeBg: isLightTheme ? "#cf9bad" : "#c54d79",
      borderColor: isLightTheme
        ? "rgba(176, 94, 122, 0.32)"
        : "rgba(255, 227, 237, 0.38)",
      shadow: isLightTheme ? "0px 3px 0px #c993a3" : "0px 4px 0px #8f2950",
      activeShadow: isLightTheme ? "0px 1px 0px #c993a3" : "0px 2px 0px #8f2950",
      textColor: isLightTheme ? "#432b33" : "white",
      delayColor: isLightTheme ? "#5b4b3a" : "whiteAlpha.900",
    },
    hard: {
      bg: isLightTheme ? "#e0c28d" : "#d4951f",
      hoverBg: isLightTheme ? "#dbb777" : "#deA637",
      activeBg: isLightTheme ? "#d3ab60" : "#c78612",
      borderColor: isLightTheme
        ? "rgba(154, 109, 36, 0.28)"
        : "rgba(255, 239, 204, 0.38)",
      shadow: isLightTheme ? "0px 3px 0px #bf9b62" : "0px 4px 0px #8a5300",
      activeShadow: isLightTheme ? "0px 1px 0px #bf9b62" : "0px 2px 0px #8a5300",
      textColor: isLightTheme ? "#4a3921" : "white",
      delayColor: isLightTheme ? "#5b4b3a" : "whiteAlpha.900",
    },
    good: {
      bg: isLightTheme ? "#abd8ca" : "#27c1a5",
      hoverBg: isLightTheme ? "#9fcebf" : "#38ceb3",
      activeBg: isLightTheme ? "#92c3b4" : "#19b197",
      borderColor: isLightTheme
        ? "rgba(68, 135, 122, 0.24)"
        : "rgba(213, 255, 247, 0.34)",
      shadow: isLightTheme ? "0px 3px 0px #88b8aa" : "0px 4px 0px #0c7a6d",
      activeShadow: isLightTheme ? "0px 1px 0px #88b8aa" : "0px 2px 0px #0c7a6d",
      textColor: isLightTheme ? "#2d403a" : "white",
      delayColor: isLightTheme ? "#5b4b3a" : "whiteAlpha.900",
    },
    easy: {
      bg: isLightTheme ? "#b5cdea" : "#62b0ff",
      hoverBg: isLightTheme ? "#a6c1e2" : "#77bcff",
      activeBg: isLightTheme ? "#97b4d9" : "#4ea4fa",
      borderColor: isLightTheme
        ? "rgba(90, 124, 169, 0.26)"
        : "rgba(226, 242, 255, 0.36)",
      shadow: isLightTheme ? "0px 3px 0px #93afd2" : "0px 4px 0px #2f6fda",
      activeShadow: isLightTheme ? "0px 1px 0px #93afd2" : "0px 2px 0px #2f6fda",
      textColor: isLightTheme ? "#314256" : "white",
      delayColor: isLightTheme ? "#5b4b3a" : "whiteAlpha.900",
    },
  };

  // Speech practice hook
  const {
    startRecording,
    stopRecording,
    isRecording,
    isConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: "answer", // Placeholder - we use AI grading instead of strict matching
    targetLang: targetLang,
    onResult: ({ recognizedText, error }) => {
      if (error) {
        toast({
          title: getTranslation("flashcard_eval_error_title"),
          description: getTranslation("flashcard_eval_error_desc"),
          status: "error",
          duration: 2500,
        });
        return;
      }

      const text = recognizedText || "";
      setRecognizedText(text);
      if (text && text.trim()) {
        checkAnswerWithAI(text);
      }
    },
    timeoutMs: pauseMs,
  });

  const checkAnswerWithAI = async (answer) => {
    setIsGrading(true);

    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildFlashcardJudgePrompt({
          concept: getConceptText(card, effectiveCardLanguage),
          userAnswer: answer,
          targetLang,
          supportLang: effectiveCardLanguage,
          cefrLevel: card.cefrLevel,
        }),
      });

      // Parse response: "YES | 6" or "NO"
      const trimmed = (response || "").trim().toUpperCase();
      const isYes = trimmed.startsWith("YES");

      let xp = 5; // default
      if (isYes && trimmed.includes("|")) {
        const parts = trimmed.split("|");
        const xpPart = parseInt(parts[1]?.trim());
        if (xpPart >= 4 && xpPart <= 7) {
          xp = xpPart;
        }
      }

      setIsCorrect(isYes);
      setXpAwarded(isYes ? xp : 0);
      setAiSuggestedRating(isYes ? mapXpToReviewOutcome(xp) : "again");
      setAssessmentMode("ai");
      setShowResult(true);

      // Play feedback sound
      playSound(isYes ? deliciousSound : selectSound);
    } catch (error) {
      console.error("AI grading error:", error);
      toast({
        title: getTranslation("flashcard_grading_error_title"),
        description: getTranslation("flashcard_grading_error_desc"),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      playSound(submitActionSound);
      setExplanationText("");
      checkAnswerWithAI(textAnswer);
    }
  };

  const handleTryAgain = () => {
    playSound(selectSound);
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
    setIsFlipped(false);
    setStreamedAnswer("");
    setIsStreaming(false);
    streamingRef.current = false;
    setNoteCreated(false);
    setAiSuggestedRating(null);
    setAssessmentMode(null);
    setIsSavingReview(false);
    explanationStreamingRef.current = false;
    setExplanationText("");
    setIsLoadingExplanation(false);
  };

  const handleReviewRating = async (rating) => {
    if (isSavingReview) return;

    playReviewRatingSound(rating);
    setIsSavingReview(true);
    try {
      const selectedOption = ratingOptions.find(
        (option) => option.rating === rating,
      );
      const reviewPatch =
        selectedOption?.patch ||
        buildFlashcardReviewUpdate(card.reviewProgress || {}, rating);
      const earnedXp =
        rating === "again" ? 0 : assessmentMode === "ai" && isCorrect ? xpAwarded : 0;

      await Promise.resolve(
        onComplete({
          ...card,
          xpReward: earnedXp,
          reviewOutcome: rating,
          reviewPatch,
        }),
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleClose = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
    setIsFlipped(false);
    setStreamedAnswer("");
    setIsStreaming(false);
    setIsPlayingAudio(false);
    setLoadingTts(false);
    setIsCreatingNote(false);
    setNoteCreated(false);
    setAiSuggestedRating(null);
    setAssessmentMode(null);
    setIsSavingReview(false);
    explanationStreamingRef.current = false;
    setExplanationText("");
    setIsLoadingExplanation(false);
    streamingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  const handleCancel = () => {
    playSound(selectSound);
    handleClose();
  };

  const handleCreateNote = async () => {
    if (isCreatingNote || noteCreated) return;

    playSound(selectSound);
    setIsCreatingNote(true);
    setNotesLoading(true);

    try {
      const concept = getConceptText(card, effectiveCardLanguage);
      const userAnswer = textAnswer || recognizedText;

      const { example, summary } = await generateNoteContent({
        concept,
        userAnswer,
        wasCorrect: isCorrect,
        targetLang,
        supportLang: effectiveCardLanguage,
        cefrLevel: card.cefrLevel,
        moduleType: "flashcard",
      });

      const note = buildNoteObject({
        lessonTitle: { en: concept, es: concept },
        cefrLevel: card.cefrLevel,
        example,
        summary,
        targetLang,
        supportLang: effectiveCardLanguage,
        moduleType: "flashcard",
        wasCorrect: isCorrect,
      });

      addNote(note);
      setNoteCreated(true);
      triggerDoneAnimation();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title:
          getTranslation("flashcard_note_error") || "Could not create note",
        status: "error",
        duration: 2500,
      });
    } finally {
      setIsCreatingNote(false);
      setNotesLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && textAnswer.trim() && !showResult && !isGrading) {
      handleTextSubmit();
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      playSound(selectSound);
      stopRecording();
      return;
    }

    // Clear previous results
    setShowResult(false);
    setRecognizedText("");
    setIsCorrect(false);
    setXpAwarded(0);
    setAiSuggestedRating(null);
    setAssessmentMode(null);
    setIsSavingReview(false);
    setExplanationText("");
    setIsLoadingExplanation(false);
    playSound(submitActionSound);

    try {
      await startRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title: getTranslation("flashcard_speech_unavailable_title"),
          description: getTranslation("flashcard_speech_unavailable_desc"),
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title: getTranslation("flashcard_mic_denied_title"),
          description: getTranslation("flashcard_mic_denied_desc"),
          status: "error",
          duration: 3200,
        });
      }
    }
  };

  const revealAnswer = async (enterSelfAssessment = false) => {
    if (isStreaming) return;

    if (isFlipped && streamedAnswer) {
      if (enterSelfAssessment) {
        setAssessmentMode("self");
        setAiSuggestedRating("again");
        setShowResult(true);
      }
      return;
    }

    setIsFlipped(true);
    setIsStreaming(true);
    setStreamedAnswer("");
    if (enterSelfAssessment) {
      setIsCorrect(false);
      setXpAwarded(0);
      setAiSuggestedRating(null);
    }
    streamingRef.current = true;

    const sourceText = getConceptText(
      card,
      effectiveCardLanguage,
    );
    const prompt = `Translate "${sourceText}" to ${LANG_NAME(
      targetLang,
    )}. Reply with ONLY the translated word or phrase, nothing else. No explanations, no quotes, no punctuation unless part of the translation.`;

    try {
      const result = await simplemodel.generateContentStream(prompt);

      let fullText = "";
      for await (const chunk of result.stream) {
        if (!streamingRef.current) break;

        const chunkText = typeof chunk.text === "function" ? chunk.text() : "";
        if (!chunkText) continue;

        fullText += chunkText;
        setStreamedAnswer(fullText.trim());
      }
    } catch (error) {
      console.error("Gemini streaming error:", error);
      setStreamedAnswer(getTranslation("flashcard_error_loading"));
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      if (enterSelfAssessment) {
        setAssessmentMode("self");
        setAiSuggestedRating("again");
        setShowResult(true);
      }
    }
  };

  const handleShowAnswer = async () => {
    playSound(selectSound);
    await revealAnswer(false);
  };

  const handleFlipBack = () => {
    streamingRef.current = false;
    setIsFlipped(false);
    setStreamedAnswer("");
    setIsStreaming(false);
    if (assessmentMode === "self") {
      setShowResult(false);
      setAiSuggestedRating(null);
      setAssessmentMode(null);
    }
  };

  const handleExplainAnswer = async () => {
    if (isLoadingExplanation || explanationText) return;

    const userAnswer = textAnswer || recognizedText;
    if (!userAnswer) return;

    playSound(selectSound);

    const concept = getConceptText(card, effectiveCardLanguage);
    const prompt = `You are a helpful language tutor for ${LANG_NAME(
      targetLang,
    )}. A student tried to translate a prompt from ${LANG_NAME(
      effectiveCardLanguage,
    )} to ${LANG_NAME(targetLang)}.

Prompt (${LANG_NAME(effectiveCardLanguage)}): ${concept}
Student translation attempt (${LANG_NAME(targetLang)}): ${userAnswer}

Provide a brief response in ${LANG_NAME(effectiveCardLanguage)} with two parts:
1) Correct translation: the best translation into ${LANG_NAME(targetLang)}
2) Explanation: 2-3 concise sentences in ${LANG_NAME(
      effectiveCardLanguage,
    )} explaining how the student's answer could be improved.`;

    setIsLoadingExplanation(true);
    setExplanationText("");
    explanationStreamingRef.current = true;

    const streamChunkText = (chunk) =>
      typeof chunk?.text === "function" ? chunk.text() : chunk?.text || "";

    try {
      // Prefer streaming for faster UI feedback
      if (simplemodel) {
        const result = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let fullText = "";
        for await (const chunk of result.stream) {
          if (!explanationStreamingRef.current) break;

          const chunkText = streamChunkText(chunk);
          if (!chunkText) continue;

          fullText += chunkText;
          setExplanationText(fullText.trim());
        }

        if (explanationStreamingRef.current) {
          const finalResp = await result.response;
          const finalText = streamChunkText(finalResp) || fullText;
          setExplanationText(finalText.trim());
        }
      } else {
        const explanation = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });

        setExplanationText(explanation.trim());
      }
    } catch (error) {
      console.error("Error explaining answer:", error);
      toast({
        title: getTranslation("flashcard_grading_error_title"),
        description: getTranslation("flashcard_grading_error_desc"),
        status: "error",
        duration: 3000,
      });
    } finally {
      explanationStreamingRef.current = false;
      setIsLoadingExplanation(false);
    }
  };

  const handleListenToAnswer = async (e) => {
    e.stopPropagation(); // Prevent card flip when clicking listen button

    if (!streamedAnswer || loadingTts) return;

    playSound(selectSound);

    // Stop any currently playing audio
    if (audioRef.current) {
      stopTTSPlayback(audioRef.current);
      audioRef.current = null;
    }
    setIsPlayingAudio(false);

    setLoadingTts(true);

    try {
      const player = await getTTSPlayer({
        text: streamedAnswer,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        voice: getRandomVoice(),
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });

      audioRef.current = player.audio;

      let cleanedUp = false;
      const audioTracks = player.audio.srcObject?.getAudioTracks?.() || [];
      const handleTrackMute = () => {
        setIsPlayingAudio(false);
      };
      audioTracks.forEach((track) => {
        if (track.muted) {
          handleTrackMute();
        } else {
          track.addEventListener("mute", handleTrackMute, { once: true });
        }
      });
      const cleanup = () => {
        if (cleanedUp) return; // Prevent double cleanup
        cleanedUp = true;
        audioTracks.forEach((track) =>
          track.removeEventListener("mute", handleTrackMute),
        );
        setLoadingTts(false);
        setIsPlayingAudio(false);
        audioRef.current = null;
        player.cleanup?.();
      };

      player.audio.onended = cleanup;
      player.audio.onerror = cleanup;
      // Also listen to finalize promise as backup for cleanup
      player.finalize?.then?.(cleanup)?.catch?.(() => {});

      await player.ready;
      setLoadingTts(false);
      await player.audio.play();
      setIsPlayingAudio(false);
    } catch (error) {
      console.error("TTS error:", error);
      setLoadingTts(false);
      setIsPlayingAudio(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay
        backdropFilter={isLightTheme ? "blur(4px)" : "blur(8px)"}
        bg={isLightTheme ? "rgba(76, 60, 40, 0.22)" : "blackAlpha.700"}
      />
      <ModalContent
        bg={modalShellTheme.bg}
        borderRadius="2xl"
        overflow="hidden"
        mx={{ base: "1%", md: 0 }}
        h={{ base: "calc(100vh - 2rem)", md: "620px" }}
        maxH="calc(100vh - 2rem)"
        boxShadow={
          isLightTheme
            ? `${APP_SHADOW}, 0 0 0 1px ${modalShellTheme.ringColor}`
            : `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px ${modalShellTheme.ringColor}`
        }
        border="2px solid"
        borderColor={modalShellTheme.borderColor}
        position="relative"
        display="flex"
        flexDirection="column"
        sx={{
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: modalShellTheme.background,
            animation: isLightTheme
              ? "none"
              : "matrixGlowShift 10s ease-in-out infinite",
            zIndex: 0,
            borderRadius: "2xl",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: isLightTheme
              ? "repeating-linear-gradient(0deg, rgba(96,77,56,0.03) 0px, rgba(96,77,56,0.03) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(96,77,56,0.026) 0px, rgba(96,77,56,0.026) 1px, transparent 1px, transparent 28px)"
              : "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
                "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
            opacity: isLightTheme ? 0.28 : 0.45,
            mixBlendMode: isLightTheme ? "normal" : "screen",
            zIndex: 0,
            borderRadius: "2xl",
          },
          "@keyframes matrixGlowShift": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "50%": { transform: "translate(0, -2%) scale(1.02)" },
          },
        }}
      >
        <ModalBody
          p={8}
          position="relative"
          zIndex={1}
          flex="1"
          overflowY="auto"
          display="flex"
          alignItems="stretch"
        >
          <VStack spacing={0} align="stretch" minH="100%" w="100%" flex="1">
            <Box
              flex="1"
              display="flex"
              flexDirection="column"
              justifyContent={shouldCenterModalContent ? "center" : "flex-start"}
            >
              <VStack spacing={6} align="stretch">
                {!showResult && !isGrading && (
                  <Box
                    position="relative"
                    w="100%"
                    h="140px"
                    sx={{ perspective: "1000px" }}
                  >
                    <MotionBox
                      position="absolute"
                      w="100%"
                      h="100%"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    >
                      <Box
                        position="absolute"
                        w="100%"
                        h="100%"
                        p={4}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        sx={{ backfaceVisibility: "hidden" }}
                      >
                        <Text
                          fontSize="xs"
                          color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                          fontWeight="medium"
                          mb={1}
                        >
                          {getTranslation("flashcard_translate_to", {
                            language: LANG_NAME(targetLang),
                          })}
                        </Text>
                        <Text
                          fontSize="3xl"
                          fontWeight="black"
                          color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                          textAlign="center"
                          textShadow={isLightTheme ? "none" : "0 2px 4px rgba(0,0,0,0.2)"}
                        >
                          {getConceptText(
                            card,
                            effectiveCardLanguage,
                          )}
                        </Text>
                        <IconButton
                          aria-label={getTranslation("flashcard_show_answer")}
                          position="absolute"
                          top={3}
                          left={3}
                          size="sm"
                          variant="solid"
                          bg={isLightTheme ? APP_SURFACE : "white"}
                          color={isLightTheme ? "#5d6edc" : "blue"}
                          boxShadow={
                            isLightTheme
                              ? "0 2px 6px rgba(122, 94, 61, 0.12)"
                              : "0 4px 0 blue"
                          }
                          icon={<MdOutlineSupportAgent size={18} />}
                          onClick={handleShowAnswer}
                          _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "gray.50" }}
                          rounded="xl"
                        />
                      </Box>

                      {/* Back Side */}
                      <Box
                        position="absolute"
                        w="100%"
                        h="100%"
                        p={4}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        sx={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <Text
                          fontSize="xs"
                          color={isLightTheme ? APP_TEXT_SECONDARY : "white"}
                          fontWeight="medium"
                          mb={1}
                        >
                          {getTranslation("flashcard_answer_label")}
                        </Text>
                        {isStreaming && !streamedAnswer ? (
                          <VoiceOrb
                            state={
                              ["idle", "listening", "speaking"][
                                Math.floor(Math.random() * 3)
                              ]
                            }
                            size={32}
                          />
                        ) : (
                          <Text
                            fontSize="3xl"
                            fontWeight="black"
                            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                            textAlign="center"
                            textShadow={isLightTheme ? "none" : "0 2px 4px rgba(0,0,0,0.3)"}
                          >
                            {streamedAnswer || "..."}
                          </Text>
                        )}
                        {/* Listen Button */}
                        <Box mt={6}>
                          {streamedAnswer && !isStreaming && (
                            <IconButton
                              aria-label={
                                loadingTts
                                  ? getTranslation("flashcard_loading") || "Loading"
                                  : getTranslation("flashcard_listen")
                              }
                              position="absolute"
                              bottom={3}
                              left={3}
                              size="sm"
                              variant="ghost"
                              color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                              icon={
                                loadingTts ? (
                                  <Spinner size="xs" />
                                ) : (
                                  <RiVolumeUpLine size={14} />
                                )
                              }
                              onClick={handleListenToAnswer}
                              _hover={{
                                bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.300",
                              }}
                              fontSize="xs"
                            />
                          )}
                          <Text
                            position="absolute"
                            bottom={3}
                            right={3}
                            fontSize="xs"
                            color={isLightTheme ? APP_TEXT_SECONDARY : "white"}
                            onClick={handleFlipBack}
                          >
                            {getTranslation("flashcard_tap_to_flip")}
                          </Text>
                        </Box>
                      </Box>
                    </MotionBox>
                  </Box>
                )}

                {/* Unified Input - Show both text and speech */}
                {!showResult && (
                  <VStack spacing={4}>
                    {/* Grading State */}
                    {isGrading ? (
                      <VStack spacing={3} py={4}>
                        <VoiceOrb
                          state={
                            ["idle", "listening", "speaking"][
                              Math.floor(Math.random() * 3)
                            ]
                          }
                          size={48}
                        />
                        <Text color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}>
                          {getTranslation("flashcard_grading")}
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={4} w="100%">
                        {/* Record Button - Top */}
                        <Button
                          w="100%"
                          size="lg"
                          colorScheme={
                            isRecording
                              ? undefined
                              : isConnecting
                                ? "yellow"
                                : "teal"
                          }
                          bg={
                            isRecording
                              ? SOFT_STOP_BUTTON_BG
                              : isLightTheme && !isConnecting
                                ? "#56a89b"
                                : undefined
                          }
                          color={
                            isRecording || (isLightTheme && !isConnecting)
                              ? "white"
                              : undefined
                          }
                          boxShadow={
                            isRecording ? SOFT_STOP_BUTTON_GLOW : undefined
                          }
                          leftIcon={
                            isConnecting ? (
                              <Spinner size="xs" thickness="3px" />
                            ) : isRecording ? (
                              <RiStopCircleLine size={20} />
                            ) : (
                              <RiMicLine size={20} />
                            )
                          }
                          onClick={handleRecord}
                          isDisabled={!supportsSpeech || isConnecting}
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: isRecording
                              ? SOFT_STOP_BUTTON_GLOW
                              : isLightTheme
                                ? "0 6px 14px rgba(86, 168, 155, 0.18)"
                                : `0 8px 20px ${cefrColor.primary}40`,
                            ...(isRecording
                              ? { bg: SOFT_STOP_BUTTON_HOVER_BG }
                              : {}),
                          }}
                          padding={9}
                          _active={{ transform: "translateY(0)" }}
                        >
                          {isConnecting
                            ? getTranslation("vocab_connecting")
                            : isRecording
                              ? getTranslation("flashcard_stop_recording")
                              : getTranslation("flashcard_record_answer")}
                        </Button>

                        {/* Recognized speech text */}
                        {recognizedText && (
                          <Box
                            p={4}
                            borderRadius="lg"
                            bg={isLightTheme ? APP_SURFACE : "whiteAlpha.100"}
                            border="1px solid"
                            borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                            w="100%"
                          >
                            <Text
                              fontSize="sm"
                              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                              mb={1}
                            >
                              {getTranslation("flashcard_recognized")}
                            </Text>
                            <Text
                              fontSize="lg"
                              color={isLightTheme ? "#447a70" : "teal.200"}
                            >
                              {recognizedText}
                            </Text>
                          </Box>
                        )}

                        {/* Text Input and Submit Group */}
                        <VStack spacing={3} w="100%" pt={6}>
                          {/* Text Input */}
                          <Input
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={getTranslation(
                              "flashcard_type_placeholder",
                            )}
                            size="lg"
                            fontSize="16px"
                            textAlign="center"
                            bg={isLightTheme ? APP_SURFACE_ELEVATED : "#f4f5ffff"}
                            border="2px solid"
                            borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                            color={isLightTheme ? APP_TEXT_PRIMARY : "black"}
                            _placeholder={{
                              color: isLightTheme ? APP_TEXT_MUTED : "gray.500",
                            }}
                            _focus={{
                              borderColor: cefrColor.primary,
                              boxShadow: `0 0 0 1px ${cefrColor.primary}`,
                            }}
                          />

                          {/* Submit Button */}
                          <Button
                            w="100%"
                            size="lg"
                            bg={isLightTheme ? "#6b8ecf" : undefined}
                            color="white"
                            onClick={handleTextSubmit}
                            isDisabled={!textAnswer.trim()}
                            leftIcon={<RiKeyboardLine size={20} />}
                            _hover={{
                              transform: "translateY(-2px)",
                              boxShadow: isLightTheme
                                ? "0 6px 14px rgba(107, 142, 207, 0.18)"
                                : `0 8px 20px ${cefrColor.primary}40`,
                            }}
                            padding={9}
                            _active={{ transform: "translateY(0)" }}
                          >
                            {getTranslation("flashcard_submit")}
                          </Button>
                        </VStack>

                        {/* Cancel button */}
                        <Button
                          w="100%"
                          size="md"
                          variant="ghost"
                          color={isLightTheme ? APP_TEXT_SECONDARY : "white"}
                          onClick={handleCancel}
                          _hover={{
                            bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
                          }}
                        >
                          {getTranslation("flashcard_cancel")}
                        </Button>
                      </VStack>
                    )}
                  </VStack>
                )}

                {/* Result */}
                {showResult && (
                  <AnimatePresence>
                    <MotionBox
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <VStack spacing={4} align="stretch" w="100%">
                        <HStack spacing={3} w="100%">
                          {resultTheme.icon}
                          <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                            flex="1"
                          >
                            {resultTheme.title}
                          </Text>
                          {/* Create Note Button - icon only */}
                          {assessmentMode === "ai" ? (
                            <IconButton
                              icon={
                                isCreatingNote ? (
                                  <Spinner size="xs" thickness="3px" />
                                ) : (
                                  <RiBookmarkLine size={18} />
                                )
                              }
                              aria-label={
                                noteCreated
                                  ? getTranslation("flashcard_note_saved") ||
                                    "Note saved!"
                                  : getTranslation("flashcard_create_note") ||
                                    "Create note"
                              }
                              colorScheme={noteCreated ? "green" : "gray"}
                              variant={noteCreated ? "solid" : "ghost"}
                              onClick={handleCreateNote}
                              isDisabled={isCreatingNote || noteCreated}
                              size="sm"
                              flexShrink={0}
                            />
                          ) : null}
                        </HStack>

                        {assessmentMode === "ai" && isCorrect ? (
                          <HStack spacing={2} color="yellow.400">
                            <RiStarLine size={20} />
                            <Text fontSize="lg" fontWeight="bold">
                              +{xpAwarded} XP
                            </Text>
                          </HStack>
                        ) : assessmentMode === "ai" && !isCorrect ? (
                          <VStack w="100%" spacing={3} mt={2}>
                            <Button
                              size="lg"
                              bg={isLightTheme ? "#56a89b" : "teal"}
                              colorScheme="teal"
                              onClick={handleTryAgain}
                              w="100%"
                            >
                              {getTranslation("flashcard_try_again")}
                            </Button>

                            <Button
                              size="lg"
                              colorScheme={undefined}
                              bg={isLightTheme ? "#d8a4b6" : "#d45b88"}
                              color={isLightTheme ? "#432b33" : "white"}
                              variant="solid"
                              border="1px solid"
                              borderColor={
                                isLightTheme
                                  ? "rgba(176, 94, 122, 0.28)"
                                  : "rgba(255, 227, 237, 0.36)"
                              }
                              boxShadow={
                                isLightTheme
                                  ? "0px 4px 0px #c08aa0"
                                  : "0px 4px 0px #8f2950"
                              }
                              _hover={{
                                bg: isLightTheme ? "#d3a0b2" : "#dc7098",
                                boxShadow: isLightTheme
                                  ? "0px 4px 0px #c08aa0"
                                  : "0px 4px 0px #8f2950",
                                transform: "translateY(-1px)",
                              }}
                              _active={{
                                bg: isLightTheme ? "#c992a6" : "#c54d79",
                                boxShadow: isLightTheme
                                  ? "0px 2px 0px #c08aa0"
                                  : "0px 2px 0px #8f2950",
                                transform: "translateY(2px)",
                              }}
                              _disabled={{
                                opacity: 0.7,
                                cursor: "not-allowed",
                                boxShadow: isLightTheme
                                  ? "0px 4px 0px #c08aa0"
                                  : "0px 4px 0px #8f2950",
                              }}
                              onClick={handleExplainAnswer}
                              isDisabled={
                                isLoadingExplanation ||
                                !!explanationText ||
                                isGrading
                              }
                              leftIcon={
                                isLoadingExplanation ? (
                                  <Spinner size="xs" thickness="3px" />
                                ) : (
                                  <FiHelpCircle />
                                )
                              }
                              w="100%"
                            >
                              {getTranslation("flashcard_explain_answer") ||
                                "Explain my answer"}
                            </Button>
                          </VStack>
                        ) : null}

                        <VStack
                          spacing={3}
                          align="stretch"
                          w="100%"
                          p={4}
                          borderRadius="lg"
                          bg={isLightTheme ? APP_SURFACE : "whiteAlpha.100"}
                          border="1px solid"
                          borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                        >
                          <HStack justify="flex-end" mb={-1}>
                            <Popover trigger="click" placement="top-end" isLazy>
                              <PopoverTrigger>
                                <IconButton
                                  aria-label={getTranslation(
                                    "flashcard_rating_help_aria",
                                  )}
                                  icon={<FiHelpCircle />}
                                  size="sm"
                                  variant="ghost"
                                  color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                                  onClick={() => playSound(selectSound)}
                                  _hover={{
                                    bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.200",
                                  }}
                                  _active={{
                                    bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.300",
                                  }}
                                />
                              </PopoverTrigger>
                              <Portal>
                                <PopoverContent
                                  bg={isLightTheme ? APP_SURFACE_ELEVATED : "rgba(15, 23, 42, 0.98)"}
                                  borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.300"}
                                  color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                                  maxW="280px"
                                  zIndex={1600}
                                >
                                  <PopoverArrow
                                    bg={isLightTheme ? APP_SURFACE_ELEVATED : "rgba(15, 23, 42, 0.98)"}
                                  />
                                  <PopoverBody py={4}>
                                    <VStack align="stretch" spacing={3}>
                                      <Text fontSize="sm" fontWeight="bold">
                                        {getTranslation("flashcard_rating_help_title")}
                                      </Text>
                                      {reviewHelpItems.map((item) => (
                                        <Box key={item.rating}>
                                          <Text
                                            fontSize="sm"
                                            fontWeight="semibold"
                                            color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                                          >
                                            {item.label}
                                          </Text>
                                          <Text
                                            fontSize="xs"
                                            color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                                            lineHeight="1.5"
                                          >
                                            {item.description}
                                          </Text>
                                        </Box>
                                      ))}
                                    </VStack>
                                  </PopoverBody>
                                </PopoverContent>
                              </Portal>
                            </Popover>
                          </HStack>

                          <Box
                            display="grid"
                            gridTemplateColumns="repeat(2, minmax(0, 1fr))"
                            gap={3}
                          >
                            {ratingOptions.map((option) => {
                              const buttonTheme =
                                reviewButtonThemes[option.rating] ||
                                reviewButtonThemes.good;
                              const isSuggested =
                                aiSuggestedRating === option.rating;

                              return (
                                <Button
                                  key={option.rating}
                                  size="md"
                                  h="auto"
                                  minH="84px"
                                  px={4}
                                  py={3}
                                  whiteSpace="normal"
                                  textAlign="left"
                                  justifyContent="flex-start"
                                  color={buttonTheme.textColor || "white"}
                                  bg={buttonTheme.bg}
                                  border="1px solid"
                                  borderColor={
                                    isSuggested
                                      ? isLightTheme
                                        ? APP_BORDER_STRONG
                                        : "rgba(255, 255, 255, 0.78)"
                                      : buttonTheme.borderColor
                                  }
                                  boxShadow={buttonTheme.shadow}
                                  transition="background-color 0.18s ease, transform 0.12s ease"
                                  _hover={{
                                    bg: buttonTheme.hoverBg,
                                    transform: "translateY(-1px)",
                                    boxShadow: buttonTheme.shadow,
                                  }}
                                  _active={{
                                    bg: buttonTheme.activeBg,
                                    transform: "translateY(2px)",
                                    boxShadow:
                                      buttonTheme.activeShadow ||
                                      buttonTheme.shadow,
                                  }}
                                  _disabled={{
                                    opacity: 1,
                                    cursor: "progress",
                                  }}
                                  onClick={() =>
                                    handleReviewRating(option.rating)
                                  }
                                  isLoading={isSavingReview}
                                >
                                  <VStack
                                    align="start"
                                    spacing={1}
                                    w="100%"
                                    pointerEvents="none"
                                  >
                                    <Text
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      textShadow={
                                        isLightTheme
                                          ? "none"
                                          : "0 1px 2px rgba(0,0,0,0.18)"
                                      }
                                    >
                                      {ratingLabel(option.rating)}
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      color={buttonTheme.delayColor || "whiteAlpha.900"}
                                      textShadow={
                                        isLightTheme
                                          ? "none"
                                          : "0 1px 2px rgba(0,0,0,0.16)"
                                      }
                                    >
                                      {option.delayLabel}
                                    </Text>
                                  </VStack>
                                </Button>
                              );
                            })}
                          </Box>
                        </VStack>

                        {assessmentMode === "ai" &&
                        !isCorrect &&
                        explanationText ? (
                          <Box
                            w="100%"
                            mb={{ base: 5, md: 6 }}
                            p={4}
                            borderRadius="md"
                            bg={
                              isLightTheme
                                ? "rgba(194, 103, 132, 0.08)"
                                : "rgba(244, 114, 182, 0.08)"
                            }
                            border="1px solid"
                            borderColor={
                              isLightTheme ? "rgba(194, 103, 132, 0.24)" : "pink.400"
                            }
                            boxShadow={isLightTheme ? "none" : "0 4px 12px rgba(0, 0, 0, 0.2)"}
                          >
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color={isLightTheme ? "#8b4f61" : "pink.200"}
                              mb={2}
                              display="flex"
                              alignItems="center"
                              gap={2}
                            >
                              <RiEyeLine />
                              {getTranslation("flashcard_explanation_heading") ||
                                "Explanation"}
                            </Text>
                            <Box
                              color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                              fontSize="sm"
                              lineHeight="1.6"
                              pb={{ base: 3, md: 4 }}
                              sx={{
                                "& p": { mb: 2 },
                                "& p:last-child": { mb: 2 },
                                "& strong": {
                                  fontWeight: "bold",
                                  color: isLightTheme ? "#7a3f52" : "pink.100",
                                },
                                "& em": { fontStyle: "italic" },
                                "& ul, & ol": { pl: 4, mb: 2 },
                                "& li": { mb: 1 },
                                "& code": {
                                  bg: isLightTheme
                                    ? "rgba(96,77,56,0.08)"
                                    : "rgba(0,0,0,0.3)",
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: "sm",
                                  fontFamily: "mono",
                                },
                              }}
                            >
                              <ReactMarkdown>{explanationText}</ReactMarkdown>
                            </Box>
                          </Box>
                        ) : null}

                        {assessmentMode === "ai" && isCorrect ? (
                          <VStack align="stretch" spacing={3} w="100%" p={4}>
                            <Text
                              fontSize="xs"
                              color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                              textAlign="center"
                            >
                              {`${getTranslation("flashcard_xp_level", {
                                level: xpLevelNumber,
                              })} • ${getTranslation("flashcard_total_xp", {
                                xp: updatedTotalXp,
                              })}`}
                            </Text>

                            <WaveBar value={nextLevelProgressPct} />
                          </VStack>
                        ) : null}
                      </VStack>
                    </MotionBox>
                  </AnimatePresence>
                )}
              </VStack>
            </Box>
            <Box
              minH={showResult && shouldCenterModalContent ? "72px" : "0"}
              display="flex"
              alignItems="flex-end"
              pl={{ base: 3, md: 1 }}
              pb={{ base: 2, md: 0 }}
              pointerEvents="none"
            >
              {showResult && shouldCenterModalContent ? (
                <RandomCharacter />
              ) : null}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
