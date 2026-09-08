import { getStoryDifficulty } from "./storyPrompts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Badge, Box, Button, Center, Flex, HStack, Icon, IconButton, Progress, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { FiCheck, FiHeadphones, FiMic, FiPause, FiPlay, FiRadio, FiRotateCcw, FiVolume2, FiX } from "react-icons/fi";
import { MdOutlineTranslate } from "react-icons/md";
import { keyframes } from "@emotion/react";
import { primeTTSAudio, TTS_LANG_TAG } from "../../utils/tts";
import { buildCurriculumPromptContext } from "../../utils/lessonCurriculum";
import { getBidiTextProps } from "../../utils/bidiText";
import { buildStorySessionPrompt, isStoryAnswerCorrect } from "./storySession";
import { generateStorySession } from "./storyGeneration";
import { storyCopy } from "./storyCopy";
import { createStoryAudio } from "./storyAudio";
import { storyServices } from "./storyServices";
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
import { selectSound, submitActionSound, completeSound, clickSound, nextButtonSound } from "../../constants/sounds";

const panel = { bg: "var(--app-surface-elevated)", borderWidth: "1px", borderColor: "var(--app-border)", borderRadius: "24px" };
const radioPulse = keyframes`
  0%, 100% { transform: scaleY(0.2); }
  25% { transform: scaleY(0.9); }
  50% { transform: scaleY(0.35); }
  75% { transform: scaleY(0.7); }
`;

export default function StoryComprehension({ mode, targetLang, supportLang, targetName, supportName, uiLang, cefrLevel, npub, lesson, lessonContent, onSkip, onNewStory, lessonEarnedXp = 0, services = storyServices, useSpeech = useSpeechPractice }) {
  const user = useUserStore((s) => s.user);
  const playSound = useSoundSettings((s) => s.playSound);
  const copy = storyCopy(uiLang);
  const [episode, setEpisode] = useState(null);
  const [generation, setGeneration] = useState(0);
  const [generationError, setGenerationError] = useState(false);
  const [part, setPart] = useState(0);
  const [heard, setHeard] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [revealedTranslations, setRevealedTranslations] = useState({});
  const [playback, setPlayback] = useState("idle");
  const [speaker, setSpeaker] = useState("");
  const [currentTurn, setCurrentTurn] = useState(null);
  const [preview, setPreview] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speechResult, setSpeechResult] = useState(null);
  const [speechTranslation, setSpeechTranslation] = useState(false);
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
    onState: (state, name, turn) => setPreview(state === "idle" ? null : { state, speaker: name, turn }),
    onError: () => setAudioError(true),
  }), [getPlayer]);
  const stopPreview = useCallback(() => { previewAudio.stop(); setPreview(null); }, [previewAudio]);

  const audio = useMemo(() => createStoryAudio({
    getPlayer,
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
        explanation: correct ? "" : speechReasonTips(evaluation.reasons, { uiLang, targetLabel: targetName }).join("\n\n"),
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
          difficulty: getStoryDifficulty(cefrLevel),
          context,
          userCharacterName: "You",
        });
        const parsed = await generateStorySession({
          generate: (request) => services.generate(request), prompt,
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
    primeTTSAudio(); setAudioError(false); stopPreview();
    if (awaitingSpeech) {
      speechTurnRef.current = null;
      cancelRecording();
      previewAudio.play(turns);
    } else {
      audio.play(turns, onComplete);
    }
  };
  const startSegment = (section, replay = false) => {
    stop();
    primeTTSAudio(); setAudioError(false); setSpeechError("");
    const turns = replay ? section.turns.filter((turn) => !isUserCharacter(turn.speaker)) : section.turns;
    audio.play(turns, () => { setHeard(true); setQuestionVisible(true); }, {
      requiresSpeech: (turn) => !replay && isUserCharacter(turn.speaker),
    });
  };
  const playSegment = () => {
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
      const tips = speechReasonTips(["pronunciation"], { uiLang, targetLabel: targetName });
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
  const togglePlayback = () => playback === "playing" ? audio.pause() : playback === "paused" ? audio.resume() : playSegment();

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
    setGeneration((value) => value + 1);
  };

  if (!episode) return <VStack spacing={6} minH="60vh" justify="space-between" w="100%">
    <Center py={16} flex="1">
      <VStack spacing={5} maxW="420px" textAlign="center">
        <Icon as={mode === "radio" ? FiRadio : FiHeadphones} boxSize={10} color="teal.400" />
        <Text role={generationError ? "alert" : "status"}>{generationError ? copy.generationError : copy.loading}</Text>
        {generationError ? <Button onClick={onNewStory || restart}>{copy.retry}</Button> : <Spinner color="teal.400" />}
      </VStack>
    </Center>
    <Box w="full" maxW="760px" mx="auto">
      <QuestionActionArea actions={<ActivityActionRow tone="primary" primary={<Button isLoading={!generationError} isDisabled colorScheme="teal" rounded="full" px={8}>{copy.loading}</Button>}>{onSkip && <Button variant="ghost" onClick={onSkip}>{copy.skip}</Button>}</ActivityActionRow>} />
    </Box>
  </VStack>;

  const displayPlayback = preview?.state || playback;
  const displaySpeaker = preview?.speaker || speaker;
  const displayTurn = preview?.turn || currentTurn;
  const isAudioSessionActive = displayPlayback !== "idle";
  const normName = (s) => (s || "").trim().toLowerCase();
  const activeAudio = displayPlayback === "playing";
  const listeningQuestion = ["select_words", "order_words"].includes(question.type);
  const canCheck = question.type === "order_words" || question.type === "select_words" ? selected.length === question.answer.length : selected.length === 1;
  const displayedParts = episode.segments.slice(0, part + 1);

  const lessonXpGoal = lesson?.xpReward || 0;
  const normalizedLessonEarnedXp = Math.max(0, Number(lessonEarnedXp) || 0);
  const lessonProgress =
    lesson && !lesson.isTutorial && lessonXpGoal > 0
      ? {
          pct: Math.min(100, (normalizedLessonEarnedXp / lessonXpGoal) * 100),
          earned: Math.min(normalizedLessonEarnedXp, lessonXpGoal),
          total: lessonXpGoal,
          label: t(uiLang, "vocab_lesson_progress") || "Lesson progress",
          showAlways: true,
        }
      : episode?.segments?.length > 0
      ? {
          pct: Math.round(((part + (result !== null ? 1 : 0)) / episode.segments.length) * 100),
          earned: part + (result !== null ? 1 : 0),
          total: episode.segments.length,
          label: t(uiLang, "vocab_lesson_progress") || "Lesson progress",
          showAlways: true,
        }
      : null;
  return <VStack align="stretch" spacing={5} maxW="760px" mx="auto" w="100%" color="var(--app-text-primary)">
    <HStack justify="space-between" align="center" wrap="wrap" gap={2}>
      <Badge colorScheme="teal">{copy[mode]}</Badge>
      <HStack spacing={2} align="center">
        <Button
          size="xs"
          variant="outline"
          colorScheme="teal"
          rounded="full"
          leftIcon={<FiCheck />}
          onClick={() => handleTest(true)}
          isDisabled={result === true || speechResult?.correct === true}
          title="Test step correctly"
          aria-label="Test step correctly"
        >
          Test Correct
        </Button>
        <Button
          size="xs"
          variant="outline"
          colorScheme="red"
          rounded="full"
          leftIcon={<FiX />}
          onClick={() => handleTest(false)}
          isDisabled={result === true || speechResult?.correct === true}
          title="Test step incorrectly"
          aria-label="Test step incorrectly"
        >
          Test Incorrect
        </Button>
        <Text fontSize="sm" color="var(--app-text-secondary)">{copy.segment} {part + 1} {copy.of} {episode.segments.length}</Text>
      </HStack>
    </HStack>
    <Progress aria-label={copy.modes} value={100 * (part + (result !== null ? 1 : 0)) / episode.segments.length} colorScheme="teal" size="sm" borderRadius="full" />
    <Box><Text as="h2" fontSize="2xl" fontWeight="700" {...getBidiTextProps(supportLang)}>{episode.title}</Text><Text mt={2} fontSize="sm" color="var(--app-text-secondary)">{copy[`${mode}Intro`]}</Text></Box>

    {mode === "radio" ? <VStack ref={currentPartRef} scrollMarginTop="24px" {...panel} p={{ base: 6, md: 10 }} spacing={7} bg="linear-gradient(145deg, var(--app-surface-elevated), var(--app-surface-muted))">
      <Badge colorScheme={isAudioSessionActive ? "teal" : "gray"} letterSpacing="0.15em">{displayPlayback === "awaiting_speech" ? copy.yourTurn : displayPlayback === "loading" ? copy.preparingAudio : displayPlayback === "paused" ? copy.paused : isAudioSessionActive ? copy.onAir : copy.ready}</Badge>
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
                size={{ base: "64px", md: "80px" }}
                isSpeaking={isSpeaking}
                accentColor={accentColor}
                showIndicator={true}
                indicatorIcon={<Icon as={isLeft ? FiMic : FiHeadphones} />}
              />
              <VStack spacing={1}>
                <Text fontWeight={isSpeaking ? "700" : "600"} fontSize="md" color="var(--app-text-primary)">
                  {name}
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
      <HStack h="32px" spacing={1} aria-hidden="true" data-testid="radio-signal">
        {[10, 18, 28, 14, 32, 22, 12, 26, 18, 30, 14, 8].map((height, i) => <Box
          key={i} w="4px" h={`${activeAudio || isRecording ? height : 6}px`} bg="teal.400" rounded="full"
          animation={activeAudio || isRecording ? `${radioPulse} ${0.65 + (i % 4) * 0.13}s ease-in-out ${-i * 0.11}s infinite` : "none"}
          transition="height 0.2s"
          sx={{ "@media (prefers-reduced-motion: reduce)": { animation: "none", transition: "none" } }}
        />)}
      </HStack>
      <IconButton aria-label={copy.replay} icon={<FiRotateCcw />} variant="ghost" isDisabled={saving} onClick={playSegment} />
      {!heard && !awaitingSpeech && <Text fontSize="sm" textAlign="center" color="var(--app-text-secondary)">{copy.heard}</Text>}
    </VStack> : <VStack align="stretch" spacing={5}>
      {displayedParts.map((section, sectionIndex) => <VStack key={sectionIndex} ref={sectionIndex === part ? currentPartRef : undefined} scrollMarginTop="24px" align="stretch" spacing={4} opacity={sectionIndex < part ? 0.7 : 1}>
        {section.turns.map((turn, turnIndex) => {
          const key = `${sectionIndex}-${turnIndex}`;
          const isRight = speakers.indexOf(turn.speaker) === 1;
          return <Flex key={key} gap={3} direction={isRight ? "row-reverse" : "row"} align="start">
            <StoryCharacterAvatar
              name={turn.speaker}
              portraitId={sessionCharacterPortraits[turn.speaker]}
              user={user}
              size="42px"
              isSpeaking={displaySpeaker === turn.speaker && activeAudio}
              accentColor={isRight ? "purple.400" : "teal.400"}
            />
            <Box {...panel} p={4} maxW="85%" flex="1" borderColor={displaySpeaker === turn.speaker && activeAudio ? "teal.400" : "var(--app-border)"}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="var(--app-text-secondary)">{turn.speaker}</Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`${copy.play}: ${turn.speaker}`}
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
                      onClick={() => {
                        playSound(selectSound);
                        setRevealedTranslations((value) => ({ ...value, [key]: !value[key] }));
                      }}
                      isDisabled={saving}
                    />
                </HStack>
              </HStack>
              <Text fontSize="lg" lineHeight="1.7" {...getBidiTextProps(targetLang)}>{turn.target}</Text>
              {revealedTranslations[key] && (
                <Text mt={2} fontSize="sm" color="var(--app-text-secondary)" {...getBidiTextProps(supportLang)}>
                  {turn.support}
                </Text>
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
              size="42px"
              isSpeaking={displaySpeaker === "You" && activeAudio}
              accentColor="purple.400"
            />
            <Box {...panel} p={4} maxW="85%" flex="1" borderColor={displaySpeaker === "You" && activeAudio ? "teal.400" : "var(--app-border)"}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="var(--app-text-secondary)">You</Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`${copy.play}: You`}
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
      <IconButton aria-label={copy.replay} icon={<FiRotateCcw />} variant="ghost" isDisabled={saving} onClick={playSegment} />
      {!heard && !awaitingSpeech && <Text fontSize="sm" color="var(--app-text-secondary)">{copy.heard}</Text>}
    </HStack>}
    {awaitingSpeech && currentTurn && <VStack {...panel} p={5} align="stretch" aria-live="polite" data-testid="story-speech-turn">
      <HStack justify="space-between">
        <Text fontWeight="700">{copy.yourTurn}:</Text>
        <HStack spacing={1}>
          <IconButton
            size="sm" variant="ghost" icon={<FiVolume2 />}
            aria-label={`${copy.play}: ${currentTurn.speaker}`}
            onClick={() => play([currentTurn])} isDisabled={saving}
          />
          <IconButton
            size="sm" variant="ghost" icon={<MdOutlineTranslate size={18} />}
            aria-label={speechTranslation ? copy.hideTranslation : copy.translation}
            aria-pressed={speechTranslation}
            color={speechTranslation ? "teal.400" : "var(--app-text-secondary)"}
            onClick={() => { playSound(selectSound); setSpeechTranslation((value) => !value); }}
          />
        </HStack>
      </HStack>
      <Text fontSize="lg" {...getBidiTextProps(targetLang)}>{currentTurn.target}</Text>
      {speechTranslation && <Text color="var(--app-text-secondary)" {...getBidiTextProps(supportLang)}>{currentTurn.support}</Text>}
      {speechError && <Text role="alert" color="orange.400">{speechError}</Text>}
    </VStack>}
    {audioError && <Text role="alert" color="orange.400">{copy.audioError}</Text>}
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
            borderColor = "teal.400";
            bg = "rgba(56, 178, 172, 0.16)";
            boxShadow = "0 0 0 1px var(--chakra-colors-teal-400), 0 4px 12px rgba(56, 178, 172, 0.25)";
            indicatorBg = "teal.400";
            indicatorBorderColor = "teal.400";
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
                      bg: isSelected ? "rgba(56, 178, 172, 0.22)" : "var(--app-surface-muted)",
                      borderColor: isSelected ? "teal.300" : "var(--app-border-strong)",
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
            tone="primary"
            primary={
              <Button
                colorScheme="teal"
                isLoading={saving || (!questionVisible && (playback === "loading" || isConnecting))}
                loadingText={isConnecting ? copy.connectingMic : copy.preparingAudio}
                isDisabled={questionVisible && !canCheck}
                leftIcon={!questionVisible ? (awaitingSpeech ? <FiMic /> : playback === "playing" ? <FiPause /> : <FiPlay />) : undefined}
                onClick={questionVisible ? check : awaitingSpeech ? recordLine : togglePlayback}
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
          showNext={true}
          onNext={speechResult.correct ? continueSpeech : retrySpeech}
          nextLabel={speechResult.correct ? copy.next : copy.retry}
          t={(k) => t(uiLang, k)}
          userLanguage={uiLang}
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
          lessonProgress={lessonProgress}
          showNext={true}
          onNext={part === episode.segments.length - 1 ? finish : advance}
          nextLabel={part === episode.segments.length - 1 ? copy.finish : copy.next}
          t={(k) => t(uiLang, k)}
          userLanguage={uiLang}
        />
      )}
    </QuestionActionArea>
  </VStack>;
}
