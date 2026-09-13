import { getStoryDifficulty } from "./storyPrompts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Badge, Box, Button, Center, Flex, HStack, Icon, IconButton, SimpleGrid, Spinner, Text, VisuallyHidden, VStack } from "@chakra-ui/react";
import { FiHeadphones, FiMic, FiPause, FiPlay, FiRadio, FiRotateCcw, FiVolume2 } from "react-icons/fi";
import { FaStop } from "react-icons/fa";
import { MdOutlineTranslate } from "react-icons/md";
import RadioSignal from "./RadioSignal";
import { primeStoryAudioLevels } from "./storyAudioLevels";
import { primeTTSAudio, TTS_LANG_TAG } from "../../utils/tts";
import { buildCurriculumPromptContext } from "../../utils/lessonCurriculum";
import { getBidiTextProps } from "../../utils/bidiText";
import { buildStorySessionPrompt, isStoryAnswerCorrect } from "./storySession";
import { generateStorySession } from "./storyGeneration";
import { storyCopy } from "./storyCopy";
import { createStoryAudio } from "./storyAudio";
import { storyServices } from "./storyServices";
import AnimatedEllipsis from "../../components/AnimatedEllipsis";
import StoryLoadingScreen from "./StoryLoadingScreen";
import useUserStore from "../../hooks/useUserStore";
import StoryCharacterAvatar from "./StoryCharacterAvatar";
import {
  getStoryCharacterVoice,
  getStoryCharacterPersonality,
  isUserCharacter,
  getRandomStoryCharacterPortraitId,
} from "./storyCharacters";
import ActivityActionRow from "../../components/ActivityActionRow";
import QuestionActionArea from "../../components/QuestionActionArea";
import FeedbackRail from "../../components/FeedbackRail";
import { t } from "../../utils/translation";
import { useSoundSettings } from "../../hooks/useSoundSettings";
import { useSpeechPractice } from "../../hooks/useSpeechPractice";
import { speechReasonTips } from "../../utils/speechEvaluation";
import { normalizeSupportLanguage } from "../../constants/languages";
import { selectSound, submitActionSound, completeSound, clickSound, nextButtonSound } from "../../constants/sounds";

const panel = { bg: "var(--app-surface-elevated)", borderWidth: "1px", borderColor: "var(--app-border)", borderRadius: "24px" };

const resolveStoryTitleText = (value, uiLang = "en", supportLang = "en", targetLang = "es") => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((v) => resolveStoryTitleText(v, uiLang, supportLang, targetLang)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const candidate =
      value[uiLang] ||
      value[supportLang] ||
      value[targetLang] ||
      value.en ||
      value.es ||
      value.title ||
      value.name ||
      Object.values(value).find((v) => typeof v === "string" && v.trim() && !v.startsWith("[object")) ||
      "";
    if (typeof candidate === "string") return candidate.trim();
    if (typeof candidate === "object" && candidate !== null && candidate !== value) {
      return resolveStoryTitleText(candidate, uiLang, supportLang, targetLang);
    }
  }
  const str = String(value).trim();
  return str === "[object Object]" ? "" : str;
};

export default function StoryComprehension({ mode, targetLang, supportLang, targetName, supportName, uiLang, cefrLevel, npub, lesson, lessonContent, onSkip, onNewStory, lessonEarnedXp = 0, services = storyServices, useSpeech = useSpeechPractice }) {
  const user = useUserStore((s) => s.user);
  const playSound = useSoundSettings((s) => s.playSound);
  const effectiveLang = normalizeSupportLanguage(supportLang || uiLang, "en");
  const copy = storyCopy(effectiveLang);
  const [episode, setEpisode] = useState(null);
  const [generation, setGeneration] = useState(0);
  const [generationError, setGenerationError] = useState(false);
  const [part, setPart] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [heard, setHeard] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [revealedTranslations, setRevealedTranslations] = useState({});
  const [turnTranslations, setTurnTranslations] = useState({});
  const [translatingKeys, setTranslatingKeys] = useState({});
  const [playback, setPlayback] = useState("idle");
  const [speaker, setSpeaker] = useState("");
  const [currentTurn, setCurrentTurn] = useState(null);
  const [preview, setPreview] = useState(null);
  const [playbackElement, setPlaybackElement] = useState(null);
  const [previewElement, setPreviewElement] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speechResult, setSpeechResult] = useState(null);
  const [speechTranslation, setSpeechTranslation] = useState(false);

  const toggleTurnTranslation = useCallback(async (key, turn) => {
    playSound(selectSound);
    if (revealedTranslations[key]) {
      setRevealedTranslations((value) => ({ ...value, [key]: false }));
      return;
    }
    setRevealedTranslations((value) => ({ ...value, [key]: true }));
    if (turnTranslations[key] || turn?.support) return;

    if (typeof services?.translate === "function" && turn?.target) {
      setTranslatingKeys((value) => ({ ...value, [key]: true }));
      try {
        const translated = await services.translate(
          turn.target,
          targetName || targetLang,
          supportName || supportLang
        );
        if (translated) {
          setTurnTranslations((value) => ({ ...value, [key]: translated }));
        }
      } catch (err) {
        console.warn("[Stories] Translation request failed", err);
      } finally {
        setTranslatingKeys((value) => ({ ...value, [key]: false }));
      }
    }
  }, [playSound, revealedTranslations, turnTranslations, services, targetName, targetLang, supportName, supportLang]);

  const toggleSpeechTranslation = useCallback(async (turn) => {
    playSound(selectSound);
    if (speechTranslation) {
      setSpeechTranslation(false);
      return;
    }
    setSpeechTranslation(true);
    if (turnTranslations["speech"] || turn?.support) return;

    if (typeof services?.translate === "function" && turn?.target) {
      setTranslatingKeys((value) => ({ ...value, speech: true }));
      try {
        const translated = await services.translate(
          turn.target,
          targetName || targetLang,
          supportName || supportLang
        );
        if (translated) {
          setTurnTranslations((value) => ({ ...value, speech: translated }));
        }
      } catch (err) {
        console.warn("[Stories] Speech translation request failed", err);
      } finally {
        setTranslatingKeys((value) => ({ ...value, speech: false }));
      }
    }
  }, [playSound, speechTranslation, turnTranslations, services, targetName, targetLang, supportName, supportLang]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [reward, setReward] = useState(0);
  const awarded = useRef(false);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const episodeRef = useRef(null);
  const currentPartRef = useRef(null);
  const speechTurnRef = useRef(null);
  episodeRef.current = episode;

  const getPlayer = useCallback((turn) => {
    const voice = getStoryCharacterVoice(turn.speaker, user);
    const personality = getStoryCharacterPersonality(turn.speaker);
    return services.getPlayer({
      text: turn.target,
      langTag: TTS_LANG_TAG[targetLang] || targetLang,
      voice,
      personality: personality || undefined,
    });
  }, [services, targetLang, user]);

  // Reference audio can play while the main script waits for a learner line.
  // It must never consume that turn or unlock its question.
  const previewAudio = useMemo(() => createStoryAudio({
    getPlayer,
    onPlayer: setPreviewElement,
    onState: (state, name, turn) => setPreview(state === "idle" ? null : { state, speaker: name, turn }),
    onError: () => setAudioError(true),
  }), [getPlayer]);
  const stopPreview = useCallback(() => { previewAudio.stop(); setPreview(null); }, [previewAudio]);

  const audio = useMemo(() => createStoryAudio({
    getPlayer,
    onPlayer: setPlaybackElement,
    onState: (state, name, turn) => {
      speechTurnRef.current = state === "awaiting_speech" ? turn : null;
      if (state === "awaiting_speech") {
        setSpeechError(""); setSpeechResult(null); setSpeechTranslation(false);
      }
      setPlayback(state);
      if (name) setSpeaker(name);
      if (state === "idle") {
        setCurrentTurn(null);
        setSpeaker("");
      } else if (turn) {
        setCurrentTurn(turn);
      }
    },
    onError: (error) => {
      console.warn("[Stories] Audio playback failed", { mode, targetLang, message: error.message });
      setAudioError(true);
    },
  }), [targetLang, getPlayer, mode]);

  const awaitingSpeech = playback === "awaiting_speech";
  const { startRecording, stopRecording, cancelRecording, isRecording, isConnecting } = useSpeech({
    targetText: awaitingSpeech ? currentTurn?.target : "",
    transcriptionHint: awaitingSpeech ? currentTurn?.target : "",
    targetLang,
    onResult: ({ evaluation, error }) => {
      if (!mounted.current || !currentTurn || speechTurnRef.current !== currentTurn) return;
      if (error || !evaluation) {
        setSpeechError(copy.recordingError);
        return;
      }
      speechTurnRef.current = null;
      setSpeechError("");
      const correct = Boolean(evaluation.pass);
      setSpeechResult({
        correct,
        explanation: correct ? "" : speechReasonTips(evaluation.reasons, { uiLang: effectiveLang, targetLabel: targetName }).join("\n\n"),
      });
      playSound(correct ? completeSound : clickSound);
    },
  });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; audio.stop(); previewAudio.stop(); };
  }, [audio, previewAudio]);

  useEffect(() => {
    if (part > 0) currentPartRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [part]);

  const context = JSON.stringify({ topic: lessonContent?.topic, scenario: lessonContent?.scenario, prompt: lessonContent?.prompt,
    curriculum: buildCurriculumPromptContext(lessonContent?.curriculumContext, { mode: "stories" }) });

  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      try {
        const prompt = buildStorySessionPrompt({
          mode,
          targetName,
          supportName,
          targetLang,
          supportLang,
          difficulty: getStoryDifficulty(cefrLevel),
          context,
          userCharacterName: "You",
        });
        const parsed = await generateStorySession({
          generate: (request) => services.generate(request), prompt,
          targetLang,
          isCancelled: () => cancelled,
          onDiagnostic: (detail) => console.warn("[Stories] Generation attempt failed", { mode, targetLang, supportLang, ...detail }),
        });
        if (!cancelled) setEpisode(parsed);
      } catch (error) {
        if (!cancelled) {
          console.error("[Stories] Could not prepare episode", { mode, targetLang, supportLang, name: error.name, message: error.message });
          setGenerationError(true);
        }
      }
    };
    generate();
    return () => { cancelled = true; };
  }, [mode, targetName, supportName, targetLang, supportLang, cefrLevel, context, generation, services]);

  useEffect(() => {
    setHasPlayed(false);
  }, [episode]);

  const segment = episode?.segments[part];
  const question = segment?.question;
  const speakers = episode ? [...new Set(episode.segments.flatMap((s) => s.turns.map((turn) => turn.speaker)))] : [];
  const sessionCharacterPortraits = useMemo(() => {
    const map = {};
    speakers.forEach((s) => {
      map[s] = getRandomStoryCharacterPortraitId(s, user);
    });
    map["You"] = getRandomStoryCharacterPortraitId("You", user);
    return map;
  }, [episode, user]);
  const stop = useCallback(() => {
    speechTurnRef.current = null;
    cancelRecording();
    setSpeechResult(null);
    stopPreview();
    audio.stop(); setPlayback("idle");
  }, [audio, cancelRecording, stopPreview]);
  const play = (turns, onComplete) => {
    primeTTSAudio();
    if (mode === "radio") primeStoryAudioLevels();
    setAudioError(false); stopPreview();
    if (awaitingSpeech) {
      speechTurnRef.current = null;
      cancelRecording();
      previewAudio.play(turns);
    } else {
      audio.play(turns, onComplete);
    }
  };
  const startSegment = (section, replay = false) => {
    setHasPlayed(true);
    stop();
    primeTTSAudio();
    if (mode === "radio") primeStoryAudioLevels();
    setAudioError(false); setSpeechError("");
    const turns = replay ? section.turns.filter((turn) => !isUserCharacter(turn.speaker)) : section.turns;
    audio.play(turns, () => { setHeard(true); setQuestionVisible(true); }, {
      requiresSpeech: (turn) => !replay && isUserCharacter(turn.speaker),
    });
  };
  const playSegment = () => {
    setHasPlayed(true);
    if (awaitingSpeech) {
      const contextTurns = segment.turns.slice(0, segment.turns.indexOf(currentTurn) + 1)
        .filter((turn) => !isUserCharacter(turn.speaker));
      play(contextTurns.length ? contextTurns : [currentTurn]);
      return;
    }
    startSegment(segment, heard);
  };
  const recordLine = async () => {
    if (isRecording) { stopRecording(); return; }
    stopPreview();
    setSpeechError(""); setSpeechResult(null);
    speechTurnRef.current = currentTurn;
    try { await startRecording(); }
    catch (error) {
      if (mounted.current && speechTurnRef.current) {
        setSpeechError(error.code === "mic-denied" ? copy.micDenied : copy.recordingError);
      }
    }
  };
  const continueSpeech = () => {
    if (!speechResult?.correct) return;
    stopPreview();
    primeTTSAudio();
    if (mode === "radio") primeStoryAudioLevels();
    playSound(nextButtonSound);
    setSpeechResult(null);
    if (!audio.completeSpeech()) {
      // The developer test shortcut can show feedback without starting audio.
      stop();
      setHeard(true);
      setQuestionVisible(true);
    }
  };
  const retrySpeech = () => {
    stopPreview();
    speechTurnRef.current = null;
    cancelRecording();
    setSpeechError("");
    setSpeechResult(null);
  };
  const handleTestSpeech = (isCorrect = true) => {
    if (isRecording) {
      cancelRecording();
    }
    stopPreview();
    speechTurnRef.current = null;
    setSpeechError("");
    if (isCorrect) {
      setSpeechResult({
        correct: true,
        explanation: "",
      });
      playSound(completeSound);
    } else {
      const tips = speechReasonTips(["pronunciation"], { uiLang: effectiveLang, targetLabel: targetName });
      setSpeechResult({
        correct: false,
        explanation: tips.join("\n\n") || copy.speechIncorrect,
      });
      playSound(clickSound);
    }
  };
  const handleTestQuestion = (isCorrect = true) => {
    if (!question) return;
    stop();
    playSound(submitActionSound);
    if (isCorrect) {
      const correctIndices = Array.isArray(question.answer) ? [...question.answer] : [];
      setSelected(correctIndices);
      playSound(completeSound);
      setResult(true);
      setScore((value) => value + 1);
    } else {
      const allIndices = (question.options || []).map((_, i) => i);
      const wrongIndices = allIndices.filter((i) => !question.answer?.includes(i));
      const wrongSelection = wrongIndices.length > 0
        ? [wrongIndices[0]]
        : question.answer?.length > 1
        ? [question.answer[0]]
        : [];
      setSelected(wrongSelection);
      playSound(clickSound);
      setResult(false);
    }
  };
  const handleTest = (isCorrect = true) => {
    if (speechResult !== null) {
      if (speechResult.correct && isCorrect) {
        continueSpeech();
        setTimeout(() => {
          const currentSeg = episode?.segments[part];
          if (currentSeg?.question) {
            handleTestQuestion(true);
          }
        }, 10);
        return;
      }
      handleTestSpeech(isCorrect);
      return;
    }
    if (awaitingSpeech) {
      handleTestSpeech(isCorrect);
      return;
    }
    if (questionVisible && question) {
      handleTestQuestion(isCorrect);
      return;
    }
    const currentSeg = episode?.segments[part];
    const speechTurn = currentSeg?.turns?.find((turn) => isUserCharacter(turn.speaker));
    if (speechTurn && !heard) {
      stop();
      setCurrentTurn(speechTurn);
      setSpeaker(speechTurn.speaker);
      setPlayback("awaiting_speech");
      handleTestSpeech(isCorrect);
      return;
    }
    stop();
    setHeard(true);
    setQuestionVisible(true);
    if (currentSeg?.question) {
      handleTestQuestion(isCorrect);
    }
  };
  const togglePlayback = () => {
    if (playback === "playing") {
      setAudioError(false);
      audio.pause();
      return;
    }
    if (playback === "paused") {
      setAudioError(false);
      audio.resume();
      return;
    }
    playSegment();
  };

  const check = () => {
    if (result !== null || !questionVisible) return;
    stop();
    playSound(submitActionSound);
    const correct = isStoryAnswerCorrect(question, selected);
    setResult(correct);
    if (correct) {
      playSound(completeSound);
      setScore((value) => value + 1);
    } else {
      playSound(clickSound);
    }
  };
  const finish = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    stop(); setSaving(true); setSaveError(false);
    playSound(completeSound);
    try {
      if (npub && !awarded.current) {
        await services.award(npub, 6, targetLang, { skillTreeLessonId: lesson?.id }).catch(() => {});
        awarded.current = true;
        if (mounted.current) setReward(6);
        // Logging is best effort; an analytics failure must never award XP twice.
        services.log(npub, {
          origin: "story", mode: `story-${mode}-complete`, lang: targetLang, supportLang,
          totalQuestions: episode.segments.length, correctQuestions: score, xpAwarded: 6,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("[Stories] Could not award xp", e);
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
      if (onSkip) {
        onSkip();
      } else if (onNewStory) {
        onNewStory();
      } else {
        restart();
      }
    }
  };
  const advance = () => {
    playSound(nextButtonSound);
    const nextPart = part + 1;
    if (nextPart >= (episode?.segments?.length || 0)) {
      finish();
      return;
    }
    setPart(nextPart);
    setSelected([]);
    setResult(null);
    setSpeechResult(null);
    setHeard(false);
    setQuestionVisible(false);
    setAudioError(false);
    startSegment(episode.segments[nextPart]);
  };
  const restart = () => {
    playSound(nextButtonSound);
    stop(); setEpisode(null); setGenerationError(false); setPart(0); setHeard(false);
    setQuestionVisible(false); setSelected([]); setResult(null); setScore(0);
    setReward(0); setSaveError(false); setAudioError(false); setRevealedTranslations({}); awarded.current = false;
    setCurrentTurn(null); setSpeaker("");
    setHasPlayed(false);
    setGeneration((value) => value + 1);
  };

  if (!episode) {
    return (
      <StoryLoadingScreen
        title={copy.loading}
        subtitle={copy.loadingSub}
        error={generationError ? copy.generationError : null}
        onRetry={onNewStory || restart}
        retryLabel={copy.retry}
        onSkip={onSkip}
        skipLabel={copy.skip}
        variant={mode === "radio" ? "radio" : "conversation"}
        minH="60vh"
      />
    );
  }

  const displayPlayback = preview?.state || playback;
  const displaySpeaker = preview?.speaker || speaker;
  const displayTurn = preview?.turn || currentTurn;
  const isAudioSessionActive = displayPlayback !== "idle";
  const normName = (s) => (s || "").trim().toLowerCase();
  const activeAudio = displayPlayback === "playing";
  const listeningQuestion = ["select_words", "order_words"].includes(question.type);
  const canCheck = question.type === "order_words" || question.type === "select_words" ? selected.length === question.answer.length : selected.length === 1;
  const displayedParts = episode.segments.slice(0, part + 1);

  const totalSegments = episode?.segments?.length || 0;
  const earnedSegments = part + (result === true ? 1 : 0);
  const storyProgress =
    totalSegments > 0
      ? {
          pct: Math.round((earnedSegments / totalSegments) * 100),
          earned: earnedSegments,
          total: totalSegments,
          label:
            t(effectiveLang, "story_progress") ||
            t(effectiveLang, "vocab_lesson_progress") ||
            "Lesson progress",
          showAlways: true,
        }
      : null;

  const speechProgress =
    totalSegments > 0
      ? {
          pct: Math.min(
            100,
            Math.round(((part + (speechResult?.correct ? 0.5 : 0)) / totalSegments) * 100)
          ),
          earned: part + (speechResult?.correct ? 1 : 0),
          total: totalSegments,
          label:
            t(effectiveLang, "story_progress") ||
            t(effectiveLang, "vocab_lesson_progress") ||
            "Lesson progress",
          showAlways: true,
        }
      : null;

  const rawTitle =
    resolveStoryTitleText(episode?.title, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lessonContent?.title, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lesson?.title, uiLang, supportLang, targetLang);
  const prefix = mode === "radio" ? (copy.call || "Call") : (copy.story || "Story");
  const escapedPrefixes = ["sentence practice", "practice", "call", "story", copy.call, copy.practice, copy.story, copy.speaking]
    .filter(Boolean)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const cleanTitle = rawTitle.replace(new RegExp(`^(?:${escapedPrefixes}):\\s*`, "i"), "").trim();
  const displayTitle = cleanTitle ? `${prefix}: ${cleanTitle}` : prefix;
  const isStopAction =
    !questionVisible &&
    ((awaitingSpeech && isRecording) ||
      (!awaitingSpeech && playback === "playing"));

  return <VStack align="stretch" spacing={5} maxW="760px" mx="auto" w="100%" color="var(--app-text-primary)">
    <Box>
      <Text as="h2" fontSize={{ base: "md", md: "lg" }} fontWeight="600" {...getBidiTextProps(supportLang)}>
        {displayTitle}
      </Text>
    </Box>

    {mode === "radio" ? <VStack ref={currentPartRef} scrollMarginTop="24px" {...panel} p={{ base: 6, md: 10 }} spacing={7} bg="linear-gradient(145deg, var(--app-surface-elevated), var(--app-surface-muted))">
      <VisuallyHidden>{displayPlayback === "awaiting_speech" ? copy.yourTurn : displayPlayback === "loading" ? copy.preparingAudio : displayPlayback === "paused" ? copy.paused : isAudioSessionActive ? copy.onAir : copy.ready}</VisuallyHidden>
      <HStack spacing={{ base: 6, md: 14 }} justify="center">
        {speakers.map((name, i) => {
          const isSpeaking = isAudioSessionActive && normName(displaySpeaker) === normName(name);
          const isLeft = i === 0;
          const accentColor = isLeft ? "teal.400" : "purple.400";
          const glowShadow = isLeft
            ? "0 0 0 4px rgba(56, 178, 172, 0.7), 0 0 24px rgba(56, 178, 172, 0.45)"
            : "0 0 0 4px rgba(159, 122, 234, 0.7), 0 0 24px rgba(159, 122, 234, 0.45)";

          return (
            <VStack
              key={name}
              spacing={3}
              opacity={isAudioSessionActive && !isSpeaking ? 0.38 : 1}
              transform={isSpeaking ? "scale(1.08)" : isAudioSessionActive ? "scale(0.95)" : "scale(1)"}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <StoryCharacterAvatar
                name={name}
                portraitId={sessionCharacterPortraits[name]}
                user={user}
                userLabel={(copy.you || "You").toUpperCase()}
                size={{ base: "64px", md: "80px" }}
                isSpeaking={isSpeaking}
                accentColor={accentColor}
                showIndicator={true}
                indicatorIcon={<Icon as={isLeft ? FiMic : FiHeadphones} />}
              />
              <VStack spacing={1}>
                <Text fontWeight={isSpeaking ? "700" : "600"} fontSize="md" color="var(--app-text-primary)">
                  {isUserCharacter(name, user) ? (copy.you || name) : name}
                </Text>
                {isSpeaking && (
                  <Badge
                    colorScheme={isLeft ? "teal" : "purple"}
                    variant="solid"
                    rounded="full"
                    px={2.5}
                    py={0.5}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {displayPlayback === "awaiting_speech" ? copy.yourTurn : displayPlayback === "loading" ? copy.preparingAudio : copy.speakingNow}
                  </Badge>
                )}
              </VStack>
            </VStack>
          );
        })}
      </HStack>
      {isAudioSessionActive && displayPlayback !== "awaiting_speech" && displayTurn && (
        <Box
          minH="54px"
          maxW="560px"
          w="full"
          px={5}
          py={3.5}
          bg="var(--app-surface)"
          rounded="2xl"
          border="1px solid var(--app-border)"
          textAlign="center"
          boxShadow="md"
          transition="all 0.25s ease"
        >
          <Text
            fontSize="xs"
            fontWeight="700"
            color={normName(displayTurn.speaker) === normName(speakers[0]) ? "teal.300" : "purple.300"}
            mb={1}
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            {displayTurn.speaker}
          </Text>
          <Text
            fontSize="lg"
            fontWeight="600"
            color="var(--app-text-primary)"
            lineHeight="1.6"
            {...getBidiTextProps(targetLang)}
          >
            {displayTurn.target}
          </Text>
        </Box>
      )}
      <RadioSignal audio={preview ? previewElement : playbackElement} playing={activeAudio} recording={isRecording} />
      {hasPlayed && (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<FiRotateCcw />}
          isDisabled={saving}
          onClick={playSegment}
          aria-label={copy.replay || "Replay"}
        >
          {copy.replay || "Replay"}
        </Button>
      )}
    </VStack> : <VStack align="stretch" spacing={5}>
      {displayedParts.map((section, sectionIndex) => <VStack key={sectionIndex} ref={sectionIndex === part ? currentPartRef : undefined} scrollMarginTop="24px" align="stretch" spacing={4} opacity={sectionIndex < part ? 0.7 : 1}>
        {section.turns.map((turn, turnIndex) => {
          const key = `${sectionIndex}-${turnIndex}`;
          const isRight = speakers.indexOf(turn.speaker) === 1;
          const speakerDisplay = isUserCharacter(turn.speaker, user) ? (copy.you || turn.speaker) : turn.speaker;
          return <Flex key={key} gap={3} direction={isRight ? "row-reverse" : "row"} align="start">
            <StoryCharacterAvatar
              name={turn.speaker}
              portraitId={sessionCharacterPortraits[turn.speaker]}
              user={user}
              userLabel={(copy.you || "You").toUpperCase()}
              size="42px"
              isSpeaking={displaySpeaker === turn.speaker && activeAudio}
              accentColor={isRight ? "purple.400" : "teal.400"}
            />
            <Box {...panel} p={4} maxW="85%" flex="1" borderColor={displaySpeaker === turn.speaker && activeAudio ? "teal.400" : "var(--app-border)"}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="var(--app-text-secondary)">{speakerDisplay}</Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`${copy.play}: ${speakerDisplay}`}
                    icon={<FiVolume2 />}
                    onClick={() => play([turn])}
                    isDisabled={saving || (!heard && isAudioSessionActive && !awaitingSpeech)}
                  />
                  <IconButton
                      size="sm"
                      variant="ghost"
                      color={revealedTranslations[key] ? "teal.400" : "var(--app-text-secondary)"}
                      _hover={{ color: revealedTranslations[key] ? "teal.300" : "var(--app-text-primary)" }}
                      aria-label={revealedTranslations[key] ? copy.hideTranslation : copy.translation}
                      title={revealedTranslations[key] ? copy.hideTranslation : copy.translation}
                      icon={<MdOutlineTranslate size={18} />}
                      onClick={() => toggleTurnTranslation(key, turn)}
                      isDisabled={saving}
                    />
                </HStack>
              </HStack>
              <Text fontSize="lg" lineHeight="1.7" {...getBidiTextProps(targetLang)}>{turn.target}</Text>
              {revealedTranslations[key] && (
                <Box mt={2}>
                  {translatingKeys[key] ? (
                    <Box py={1}>
                      <AnimatedEllipsis color="teal.400" ariaLabel={copy.preparingAudio || "Loading"} justify="flex-start" />
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="var(--app-text-secondary)" {...getBidiTextProps(supportLang)}>
                      {turnTranslations[key] || turn.support}
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          </Flex>;
        })}
        {sectionIndex === part && question.type === "reply" && result === true && (
          <Flex gap={3} direction="row-reverse" align="start">
            <StoryCharacterAvatar
              name="You"
              portraitId={sessionCharacterPortraits["You"]}
              user={user}
              userLabel={(copy.you || "You").toUpperCase()}
              size="42px"
              isSpeaking={displaySpeaker === "You" && activeAudio}
              accentColor="purple.400"
            />
            <Box {...panel} p={4} maxW="85%" flex="1" borderColor={displaySpeaker === "You" && activeAudio ? "teal.400" : "var(--app-border)"}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="var(--app-text-secondary)">{copy.you || "You"}</Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`${copy.play}: ${copy.you || "You"}`}
                    icon={<FiVolume2 />}
                    onClick={() => play([{ speaker: "You", target: question.options[question.answer[0]], support: question.explanation }])}
                    isDisabled={saving}
                  />
                  {question.explanation && (
                    <IconButton
                      size="sm"
                      variant="ghost"
                      color={(revealedTranslations[`${sectionIndex}-reply`] ?? true) ? "teal.400" : "var(--app-text-secondary)"}
                      _hover={{ color: (revealedTranslations[`${sectionIndex}-reply`] ?? true) ? "teal.300" : "var(--app-text-primary)" }}
                      aria-label={(revealedTranslations[`${sectionIndex}-reply`] ?? true) ? copy.hideTranslation : copy.translation}
                      title={(revealedTranslations[`${sectionIndex}-reply`] ?? true) ? copy.hideTranslation : copy.translation}
                      icon={<MdOutlineTranslate size={18} />}
                      onClick={() => {
                        playSound(selectSound);
                        setRevealedTranslations((value) => ({
                          ...value,
                          [`${sectionIndex}-reply`]: !(value[`${sectionIndex}-reply`] ?? true),
                        }));
                      }}
                      isDisabled={saving}
                    />
                  )}
                </HStack>
              </HStack>
              <Text fontSize="lg" lineHeight="1.7" {...getBidiTextProps(targetLang)}>
                {question.options[question.answer[0]]}
              </Text>
              {(revealedTranslations[`${sectionIndex}-reply`] ?? true) && question.explanation && (
                <Text mt={2} fontSize="sm" color="var(--app-text-secondary)" {...getBidiTextProps(supportLang)}>
                  {question.explanation}
                </Text>
              )}
            </Box>
          </Flex>
        )}
      </VStack>)}
    </VStack>}

    {mode === "conversation" && <HStack>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<FiRotateCcw />}
        isDisabled={saving}
        onClick={playSegment}
        aria-label={copy.replay || "Replay"}
      >
        {copy.replay || "Replay"}
      </Button>
    </HStack>}
    {awaitingSpeech && currentTurn && <VStack {...panel} p={5} align="stretch" aria-live="polite" data-testid="story-speech-turn">
      <HStack justify="space-between">
        <Text fontWeight="700">{copy.yourTurn}:</Text>
        <HStack spacing={1}>
          <IconButton
            size="sm" variant="ghost" icon={<FiVolume2 />}
            aria-label={`${copy.play}: ${isUserCharacter(currentTurn.speaker, user) ? (copy.you || currentTurn.speaker) : currentTurn.speaker}`}
            onClick={() => play([currentTurn])} isDisabled={saving}
          />
          <IconButton
            size="sm" variant="ghost" icon={<MdOutlineTranslate size={18} />}
            aria-label={speechTranslation ? copy.hideTranslation : copy.translation}
            aria-pressed={speechTranslation}
            color={speechTranslation ? "teal.400" : "var(--app-text-secondary)"}
            onClick={() => toggleSpeechTranslation(currentTurn)}
          />
        </HStack>
      </HStack>
      <Text fontSize="lg" {...getBidiTextProps(targetLang)}>{currentTurn.target}</Text>
      {speechTranslation && (
        <Box mt={2}>
          {translatingKeys["speech"] ? (
            <Box py={1}>
              <AnimatedEllipsis color="teal.400" ariaLabel={copy.preparingAudio || "Loading"} justify="flex-start" />
            </Box>
          ) : (
            <Text color="var(--app-text-secondary)" {...getBidiTextProps(supportLang)}>
              {turnTranslations["speech"] || currentTurn.support}
            </Text>
          )}
        </Box>
      )}
      {speechError && <Text role="alert" color="orange.400">{speechError}</Text>}
    </VStack>}
    {audioError && playback !== "paused" && <Text role="alert" color="orange.400">{copy.audioError}</Text>}
    {questionVisible && <VStack {...panel} p={{ base: 4, md: 6 }} align="stretch" spacing={4}>
      <Text fontSize="lg" fontWeight="600" {...getBidiTextProps(supportLang)}>{question.prompt}</Text>
      {listeningQuestion && <Button variant="outline" alignSelf="start" leftIcon={<FiVolume2 />} isDisabled={saving} onClick={() => play([segment.turns[question.audioTurn]])}>{copy.listen}</Button>}
      {question.type === "order_words" && <Box p={3} minH="60px" borderWidth="1px" borderColor="var(--app-border)" rounded="xl" aria-label={copy.answer}>
        <HStack flexWrap="wrap" {...getBidiTextProps(targetLang)}>{selected.map((index) => <Button key={index} size="sm" isDisabled={result !== null} onClick={() => { playSound(selectSound); setSelected((value) => value.filter((i) => i !== index)); }}>{question.options[index]}</Button>)}</HStack>
      </Box>}
      <SimpleGrid columns={listeningQuestion ? { base: 2, md: 3 } : 1} spacing={3}>
        {question.options.map((option, index) => {
          const isSelected = selected.includes(index);
          const isCorrectAnswer = result !== null && question.answer.includes(index);
          const isWrongSelection = result !== null && isSelected && !question.answer.includes(index);

          let borderColor = "var(--app-border)";
          let bg = "var(--app-surface-elevated)";
          let boxShadow = "none";
          let indicatorBg = "transparent";
          let indicatorBorderColor = "var(--app-border-strong)";
          let indicatorColor = "white";
          let indicatorContent = "";

          if (isCorrectAnswer) {
            borderColor = "green.400";
            bg = "rgba(72, 187, 120, 0.16)";
            boxShadow = "0 0 0 1px var(--chakra-colors-green-400), 0 4px 12px rgba(72, 187, 120, 0.2)";
            indicatorBg = "green.500";
            indicatorBorderColor = "green.500";
            indicatorContent = "✓";
          } else if (isWrongSelection) {
            borderColor = "red.400";
            bg = "rgba(245, 101, 101, 0.16)";
            boxShadow = "0 0 0 1px var(--chakra-colors-red-400), 0 4px 12px rgba(245, 101, 101, 0.2)";
            indicatorBg = "red.500";
            indicatorBorderColor = "red.500";
            indicatorContent = "✕";
          } else if (isSelected) {
            borderColor = "purple.400";
            bg = "rgba(128, 90, 213, 0.16)";
            boxShadow = "0 0 0 1px var(--chakra-colors-purple-400), 0 4px 12px rgba(128, 90, 213, 0.25)";
            indicatorBg = "purple.400";
            indicatorBorderColor = "purple.400";
            indicatorContent = "✓";
          }

          return (
            <Button
              key={index}
              minH="54px"
              h="auto"
              whiteSpace="normal"
              py={3.5}
              px={4}
              textAlign="start"
              justifyContent="flex-start"
              variant="outline"
              bg={bg}
              borderColor={borderColor}
              borderWidth="2px"
              borderRadius="18px"
              boxShadow={boxShadow}
              opacity={result !== null && !isSelected && !isCorrectAnswer ? 0.55 : 1}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={
                result === null
                  ? {
                      bg: isSelected ? "rgba(128, 90, 213, 0.22)" : "var(--app-surface-muted)",
                      borderColor: isSelected ? "purple.300" : "var(--app-border-strong)",
                      transform: "translateY(-1px)",
                    }
                  : {}
              }
              _active={result === null ? { transform: "translateY(0)" } : {}}
              aria-pressed={isSelected}
              isDisabled={result !== null || (question.type === "order_words" && isSelected)}
              _disabled={{
                opacity: result !== null ? (isCorrectAnswer || isWrongSelection ? 1 : 0.55) : 1,
                cursor: "default",
              }}
              {...getBidiTextProps(listeningQuestion || question.type === "reply" ? targetLang : supportLang)}
              onClick={() => {
                playSound(selectSound);
                setSelected((value) =>
                  listeningQuestion
                    ? value.includes(index)
                      ? value.filter((i) => i !== index)
                      : value.length < question.answer.length
                      ? [...value, index]
                      : value
                    : [index]
                );
              }}
            >
              <HStack spacing={3} align="center" w="100%">
                <Flex
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  borderWidth="2px"
                  borderColor={indicatorBorderColor}
                  bg={indicatorBg}
                  color={indicatorColor}
                  fontSize="xs"
                  fontWeight="800"
                  transition="all 0.2s ease"
                >
                  {indicatorContent}
                </Flex>
                <Text
                  flex="1"
                  color="var(--app-text-primary)"
                  fontWeight={isSelected || isCorrectAnswer ? "600" : "500"}
                  lineHeight="1.4"
                >
                  {option}
                </Text>
              </HStack>
            </Button>
          );
        })}
      </SimpleGrid>
    </VStack>}
    {saveError && <Text role="alert" color="orange.400">{copy.saveError}</Text>}
    <QuestionActionArea
      feedback={speechResult !== null ? speechResult.correct : result}
      actions={
        result !== null || speechResult !== null ? null : (
          <ActivityActionRow
            tone={isStopAction ? "stop" : "primary"}
            primary={
              <Button
                colorScheme={isStopAction ? "reddit" : "purple"}
                isLoading={saving || (!questionVisible && (playback === "loading" || isConnecting))}
                loadingText={isConnecting ? copy.connectingMic : copy.preparingAudio}
                isDisabled={questionVisible && !canCheck}
                leftIcon={!questionVisible ? (awaitingSpeech ? (isRecording ? <FaStop /> : <FiMic />) : playback === "playing" ? <FiPause /> : <FiPlay />) : undefined}
                onClick={questionVisible ? check : awaitingSpeech ? recordLine : togglePlayback}
                aria-label={awaitingSpeech && isRecording ? "Stop recording" : undefined}
              >
                {questionVisible ? copy.check : awaitingSpeech ? (isRecording ? copy.stopRecording : copy.record) : playback === "playing" ? copy.pause : playback === "paused" ? copy.resume : copy.play}
              </Button>
            }
          >
            {onSkip && (
              <Button
                variant="ghost"
                isDisabled={saving}
                onClick={() => {
                  stop();
                  onSkip();
                }}
              >
                {copy.skip}
              </Button>
            )}
            {/* Test buttons commented out
            <Button
              variant="ghost"
              isDisabled={saving || result === true || speechResult?.correct === true}
              onClick={() => handleTest(true)}
              title="Test step correctly"
              aria-label="Test step correctly"
            >
              Test ✓
            </Button>
            <Button
              variant="ghost"
              isDisabled={saving || result === true || speechResult?.correct === true}
              onClick={() => handleTest(false)}
              title="Test step incorrectly"
              aria-label="Test step incorrectly"
            >
              Test ✗
            </Button>
            */}
          </ActivityActionRow>
        )
      }
    >
      {speechResult !== null && (
        <FeedbackRail
          compact
          ok={speechResult.correct}
          statusLabel={speechResult.correct ? copy.correct : copy.speechIncorrect}
          explanationText={speechResult.explanation}
          lessonProgress={speechProgress}
          showNext={true}
          onNext={speechResult.correct ? continueSpeech : retrySpeech}
          nextLabel={speechResult.correct ? copy.next : copy.retry}
          t={(k) => t(effectiveLang, k)}
          userLanguage={effectiveLang}
        />
      )}
      {result !== null && (
        <FeedbackRail
          compact
          ok={result}
          statusLabel={result ? copy.correct : copy.incorrect}
          explanationText={
            (!result && question
              ? `${question.answer.map((i) => question.options[i]).join(question.type === "order_words" ? " " : " · ")}\n\n${question.explanation}`
              : question?.explanation) || ""
          }
          lessonProgress={storyProgress}
          showNext={true}
          onNext={part === episode.segments.length - 1 ? finish : advance}
          nextLabel={part === episode.segments.length - 1 ? copy.finish : copy.next}
          t={(k) => t(effectiveLang, k)}
          userLanguage={effectiveLang}
        />
      )}
    </QuestionActionArea>
  </VStack>;
}
