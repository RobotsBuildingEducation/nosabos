import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiCheck, FiDownload, FiMic, FiPause, FiPlay, FiSquare } from "react-icons/fi";
import { MdReplay } from "react-icons/md";
import { RiSeedlingLine } from "react-icons/ri";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound, submitActionSound } from "../constants/sounds";
import { nativeModalMotionProps, nativeOverlayMotionProps } from "../utils/modalMotion";
import { journeyCopy } from "../utils/voiceJourneyCopy";
import { JOURNEY_MILESTONES, journeySessionCount } from "../utils/voiceJourneyModel";
import { loadJourneyRecording, saveJourneyRecording } from "../utils/voiceJourney";
import { createJourneyRecorder } from "../utils/journeyRecorder";

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function JourneyAudio({ blob, label, lang }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!blob) return undefined;
    const value = URL.createObjectURL(blob);
    setUrl(value);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(false);
    return () => URL.revokeObjectURL(value);
  }, [blob]);

  useEffect(() => () => audioRef.current?.pause(), []);

  // WebM duration workaround for Chromium-based browsers
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration === Infinity) {
      audio.currentTime = 1e101;
      const onTime = () => {
        audio.removeEventListener("timeupdate", onTime);
        audio.currentTime = 0;
        if (Number.isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };
      audio.addEventListener("timeupdate", onTime);
    } else if (Number.isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0 && duration === 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      document.querySelectorAll("audio").forEach(other => {
        if (other !== audio) other.pause();
      });
      audio.play().catch(() => setError(true));
    } else {
      audio.pause();
    }
  };

  const handleSliderChange = val => {
    setCurrentTime(val);
    if (!isSeeking) setIsSeeking(true);
  };

  const handleSliderChangeEnd = val => {
    setIsSeeking(false);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const extension = blob?.type?.includes("mp4") ? "m4a" : blob?.type?.includes("ogg") ? "ogg" : "webm";

  return (
    <Box minW={0} w="100%">
      {label && (
        <Text fontSize="xs" mb={2} color="var(--app-text-secondary)" fontWeight="medium">
          {label}
        </Text>
      )}
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          aria-label={label}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => setError(true)}
          style={{ display: "none" }}
        />
      )}
      <HStack
        spacing={3}
        p={2}
        px={3}
        bg="var(--app-surface-muted)"
        border="1px solid"
        borderColor="var(--app-border)"
        borderRadius="full"
        align="center"
        w="100%"
      >
        <IconButton
          icon={isPlaying ? <FiPause size={16} /> : <FiPlay size={16} style={{ marginLeft: "2px" }} />}
          size="sm"
          isRound
          variant="ghost"
          color="var(--app-text-primary)"
          _hover={{ bg: "var(--app-surface)", color: "var(--app-text-primary)" }}
          _focus={{ boxShadow: "none", outline: "none" }}
          _focusVisible={{ boxShadow: "none", outline: "none" }}
          _active={{ bg: "var(--app-surface-muted)", boxShadow: "none" }}
          onClick={togglePlay}
          isDisabled={!url || error}
          aria-label={isPlaying ? "Pause" : "Play"}
        />

        <Text
          fontSize="xs"
          fontFamily="mono"
          color="var(--app-text-primary)"
          minW="30px"
          userSelect="none"
        >
          {formatAudioTime(currentTime)}
        </Text>

        <Box flex={1} px={1}>
          <Slider
            aria-label="Audio progress"
            value={currentTime}
            min={0}
            max={duration > 0 ? duration : Math.max(currentTime, 1)}
            step={0.1}
            onChange={handleSliderChange}
            onChangeEnd={handleSliderChangeEnd}
            isDisabled={!url || error}
            focusThumbOnChange={false}
          >
            <SliderTrack bg="var(--app-border)" h="6px" borderRadius="full">
              <SliderFilledTrack bg="teal.400" />
            </SliderTrack>
            <SliderThumb
              boxSize={3.5}
              bg="teal.500"
              border="2px solid white"
              boxShadow="0 1px 3px rgba(0,0,0,0.3)"
              _focus={{ boxShadow: "none" }}
            />
          </Slider>
        </Box>

        <Text
          fontSize="xs"
          fontFamily="mono"
          color="var(--app-text-muted)"
          minW="30px"
          textAlign="right"
          userSelect="none"
        >
          {duration > 0 ? formatAudioTime(duration) : "--:--"}
        </Text>

        {url && (
          <IconButton
            as="a"
            href={url}
            download={`piyali-voice.${extension}`}
            icon={<FiDownload size={16} />}
            variant="ghost"
            size="sm"
            isRound
            color="var(--app-text-secondary)"
            _hover={{ color: "var(--app-text-primary)", bg: "var(--app-surface)" }}
            aria-label={journeyCopy(lang, "download")}
            title={journeyCopy(lang, "download")}
          />
        )}
      </HStack>

      {error && (
        <Text role="alert" fontSize="xs" mt={2} color="red.400">
          {journeyCopy(lang, "playbackError")}
        </Text>
      )}
    </Box>
  );
}

export default function JourneyRecordingModal({
  npub,
  targetLang,
  lang = "en",
  milestone,
  journey = {},
  onClose,
  onOpenJourney,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const t = (key, values) => journeyCopy(lang, key, values);
  const sessionCount = journeySessionCount(journey);
  const [activeMilestone, setActiveMilestone] = useState(() => milestone || JOURNEY_MILESTONES[0]);
  const [localRecordings, setLocalRecordings] = useState(() => ({ ...(journey?.recordings || {}) }));
  const [loadedAudios, setLoadedAudios] = useState({});
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState("");

  const [recorderState, setRecorderState] = useState({ status: "idle", seconds: 0 });
  const [activeRecording, setActiveRecording] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const recorderRef = useRef(null);
  const aliveRef = useRef(true);

  const busy = saving || ["starting", "recording", "stopping"].includes(recorderState.status);

  useEffect(() => {
    if (journey?.recordings) {
      setLocalRecordings(prev => ({ ...prev, ...journey.recordings }));
    }
  }, [journey?.recordings]);

  useEffect(() => {
    aliveRef.current = true;
    const recorder = createJourneyRecorder({
      onState: setRecorderState,
      onRecording: setActiveRecording,
    });
    recorderRef.current = recorder;
    const stopWhenHidden = () => {
      if (document.hidden) recorder.stop();
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      aliveRef.current = false;
      recorder.dispose();
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, []);

  // Fetch audio when an already-recorded milestone is active
  useEffect(() => {
    if (!npub || !targetLang || !activeMilestone) return;
    if (!localRecordings[activeMilestone] || loadedAudios[activeMilestone]) return;

    let alive = true;
    setLoadingAudio(true);
    setAudioLoadError("");

    loadJourneyRecording(npub, targetLang, activeMilestone)
      .then(result => {
        if (alive) {
          setLoadedAudios(prev => ({ ...prev, [activeMilestone]: result }));
        }
      })
      .catch(err => {
        if (alive) {
          setAudioLoadError(err.message === "JOURNEY_SIGNER_UNSUPPORTED" ? "signer" : "error");
        }
      })
      .finally(() => {
        if (alive) setLoadingAudio(false);
      });

    return () => {
      alive = false;
    };
  }, [npub, targetLang, activeMilestone, localRecordings, loadedAudios]);

  const selectMilestone = num => {
    if (num > sessionCount || busy) return;
    playSound(selectSound);
    if (recorderState.status === "recording") {
      recorderRef.current?.stop();
    }
    setActiveRecording(null);
    setRecorderState({ status: "idle", seconds: 0 });
    setSaveError("");
    setActiveMilestone(num);
  };

  const handleSave = async () => {
    if (!activeRecording?.blob) return;
    playSound(submitActionSound);
    setSaving(true);
    setSaveError("");
    try {
      await saveJourneyRecording({
        npub,
        lang: targetLang,
        milestone: activeMilestone,
        blob: activeRecording.blob,
        duration: activeRecording.duration,
        prompt: journeyCopy(lang, "prompt"),
        support: "independent",
      });

      const nowIso = new Date().toISOString();
      if (aliveRef.current) {
        setLocalRecordings(prev => ({
          ...prev,
          [activeMilestone]: { createdAt: nowIso, capturedSession: sessionCount },
        }));
        setLoadedAudios(prev => ({
          ...prev,
          [activeMilestone]: { blob: activeRecording.blob },
        }));
        setActiveRecording(null);
        setRecorderState({ status: "idle", seconds: 0 });
      }
    } catch (err) {
      if (aliveRef.current) {
        setSaveError(err.message === "JOURNEY_SIGNER_UNSUPPORTED" ? "signer" : "error");
      }
    } finally {
      if (aliveRef.current) setSaving(false);
    }
  };

  const hasRecording = Boolean(localRecordings[activeMilestone]);

  return (
    <Modal
      isOpen
      onClose={busy ? () => {} : onClose}
      isCentered
      size="lg"
      scrollBehavior="inside"
      closeOnOverlayClick={false}
      closeOnEsc={!busy}
      returnFocusOnClose={false}
    >
      <ModalOverlay motionProps={nativeOverlayMotionProps} bg="var(--app-overlay)" />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg="var(--app-surface-elevated)"
        color="var(--app-text-primary)"
        borderRadius="24px"
        mx={4}
        maxH="90dvh"
        border="1px solid"
        borderColor="var(--app-border)"
      >
        <ModalCloseButton
          isDisabled={busy}
          onClick={() => {
            playSound(selectSound);
            onClose?.();
          }}
        />
        <ModalHeader pr={12} pt={7} pb={2}>
          <Text fontSize="2xl" lineHeight="1.2" fontWeight="bold">
            {t("yourJourney")}
          </Text>
        </ModalHeader>
        <ModalBody px={6} pb={6} pt={4}>
          <VStack align="stretch" spacing={5}>
            {/* Main container with mic icon and Session · Journey header */}
            <Box
              p={5}
              borderRadius="2xl"
              bg="var(--app-surface)"
              border="1px solid"
              borderColor="var(--app-border)"
            >
              <HStack spacing={2} align="center" mb={2}>
                <Box as={RiSeedlingLine} size="20" color="teal.400" />
                <Text fontSize="xs" fontWeight="semibold" color="var(--app-text-muted)" letterSpacing="wide">
                  {t("session", { n: activeMilestone })} · {t("journey")}
                </Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg" mb={1.5}>
                {t("title")}
              </Text>
              <Text fontSize="sm" color="var(--app-text-secondary)">
                {t("intro")}
              </Text>
            </Box>

            {/* Clickable milestone numbers */}
            <HStack flexWrap="wrap" spacing={2} rowGap={2} aria-label={t("journey")}>
              {JOURNEY_MILESTONES.map(number => {
                const isUnlocked = number <= sessionCount;
                const isSelected = number === activeMilestone;
                const isSaved = Boolean(localRecordings[number]);

                return (
                  <Button
                    key={number}
                    size="xs"
                    minW="36px"
                    h="32px"
                    px={2.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                    variant="outline"
                    isDisabled={!isUnlocked || busy}
                    onClick={() => selectMilestone(number)}
                    cursor={isUnlocked ? "pointer" : "not-allowed"}
                    bg={isSelected ? "rgba(20, 184, 166, 0.08)" : "transparent"}
                    color={
                      isSelected
                        ? "teal.500"
                        : isUnlocked
                          ? "var(--app-text-primary)"
                          : "var(--app-text-muted)"
                    }
                    border="1.5px solid"
                    borderColor={isSelected ? "teal.500" : "var(--app-border)"}
                    boxShadow="none"
                    _hover={
                      isSelected
                        ? { borderColor: "teal.400", bg: "rgba(20, 184, 166, 0.14)" }
                        : isUnlocked
                          ? {
                              borderColor: "var(--app-border-strong)",
                              bg: "var(--app-surface-muted)",
                              color: "var(--app-text-primary)",
                            }
                          : undefined
                    }
                    _active={
                      isSelected
                        ? { borderColor: "teal.600", bg: "rgba(20, 184, 166, 0.2)" }
                        : isUnlocked
                          ? { bg: "var(--app-surface-muted)" }
                          : undefined
                    }
                    _disabled={{
                      opacity: 0.35,
                      cursor: "not-allowed",
                      boxShadow: "none",
                      borderColor: "var(--app-border)",
                    }}
                    leftIcon={isSaved ? <FiCheck size={11} /> : undefined}
                  >
                    {number}
                  </Button>
                );
              })}
            </HStack>

            {/* Selected milestone content: saved recording player OR record control */}
            {hasRecording ? (
              <Box>
                {loadingAudio ? (
                  <HStack py={6} justify="center">
                    <Spinner size="sm" color="cyan.500" />
                    <Text fontSize="sm" color="var(--app-text-secondary)">
                      {t("loading")}
                    </Text>
                  </HStack>
                ) : audioLoadError ? (
                  <VStack py={4} align="stretch">
                    <Text role="alert" fontSize="sm" color="red.400">
                      {t(audioLoadError)}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        playSound(selectSound);
                        setLoadedAudios(prev => {
                          const copy = { ...prev };
                          delete copy[activeMilestone];
                          return copy;
                        });
                      }}
                    >
                      {t("retry")}
                    </Button>
                  </VStack>
                ) : loadedAudios[activeMilestone] ? (
                  <VStack
                    align="stretch"
                    spacing={3}
                    p={4}
                    borderRadius="xl"
                    bg="var(--app-surface)"
                    border="1px solid"
                    borderColor="var(--app-border)"
                  >
                    <HStack spacing={2} color="teal.400">
                      <FiCheck />
                      <Text fontWeight="semibold" fontSize="sm" color="var(--app-text-primary)">
                        {t("saved")}
                      </Text>
                      {localRecordings[activeMilestone]?.createdAt && (
                        <Text fontSize="xs" color="var(--app-text-muted)" ml="auto">
                          {new Date(localRecordings[activeMilestone].createdAt).toLocaleDateString(lang, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </HStack>
                    <JourneyAudio
                      blob={loadedAudios[activeMilestone].blob}
                      label={t("ownVoice")}
                      lang={lang}
                    />
                  </VStack>
                ) : null}
              </Box>
            ) : (
              <VStack align="stretch" spacing={3}>
                {(saveError || recorderState.error) && (
                  <Text role="alert" fontSize="sm" color="red.400">
                    {t(saveError || recorderState.error)}
                  </Text>
                )}

                {recorderState.status === "recording" && (
                  <Text role="status" textAlign="center" color="red.400" fontWeight="semibold">
                    {t("recording", { n: recorderState.seconds })}
                  </Text>
                )}

                {activeRecording ? (
                  <VStack
                    align="stretch"
                    spacing={4}
                    p={4}
                    borderRadius="xl"
                    bg="var(--app-surface)"
                    border="1px solid"
                    borderColor="var(--app-border)"
                  >
                    <JourneyAudio blob={activeRecording.blob} label={t("preview")} lang={lang} />
                    <HStack spacing={3}>
                      <Button
                        flex={1}
                        variant="outline"
                        leftIcon={<MdReplay />}
                        isDisabled={saving}
                        onClick={() => {
                          playSound(selectSound);
                          setActiveRecording(null);
                          setSaveError("");
                          setRecorderState({ status: "idle", seconds: 0 });
                        }}
                      >
                        {t("again")}
                      </Button>
                      <Button
                        flex={1}
                        colorScheme="teal"
                        bg="teal.500"
                        color="white"
                        boxShadow="0 4px 0 var(--chakra-colors-teal-800, #234E52)"
                        _hover={{ bg: "teal.600" }}
                        _active={{
                          transform: "translateY(2px)",
                          boxShadow: "0 2px 0 var(--chakra-colors-teal-800, #234E52)",
                        }}
                        isLoading={saving}
                        loadingText={t("saving")}
                        onClick={handleSave}
                      >
                        {t("save")}
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    <Button
                      size="lg"
                      w="100%"
                      colorScheme={recorderState.status === "recording" ? "red" : "cyan"}
                      bg={recorderState.status === "recording" ? "red.500" : "cyan.500"}
                      color="white"
                      boxShadow={
                        recorderState.status === "recording"
                          ? "0 4px 0 var(--chakra-colors-red-800, #822727)"
                          : "0 4px 0 var(--chakra-colors-cyan-800, #086F83)"
                      }
                      _hover={{
                        bg: recorderState.status === "recording" ? "red.600" : "cyan.600",
                      }}
                      _active={{
                        transform: "translateY(2px)",
                        boxShadow:
                          recorderState.status === "recording"
                            ? "0 2px 0 var(--chakra-colors-red-800, #822727)"
                            : "0 2px 0 var(--chakra-colors-cyan-800, #086F83)",
                      }}
                      leftIcon={recorderState.status === "recording" ? <FiSquare /> : <FiMic />}
                      isLoading={["starting", "stopping"].includes(recorderState.status)}
                      loadingText={t("starting")}
                      onClick={() => {
                        playSound(selectSound);
                        if (recorderState.status === "recording") {
                          recorderRef.current?.stop();
                        } else {
                          setSaveError("");
                          recorderRef.current?.start();
                        }
                      }}
                    >
                      {t(recorderState.status === "recording" ? "stop" : "record")}
                    </Button>
                  </VStack>
                )}
              </VStack>
            )}

            {/* Modal footer actions */}
            <HStack mt={3} justify="space-between" flexWrap="wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  playSound(selectSound);
                  onClose?.();
                }}
                isDisabled={busy}
                borderColor="transparent !important"
                _hover={{ bg: "var(--app-surface-muted)", borderColor: "transparent !important" }}
                _focus={{ boxShadow: "none", borderColor: "transparent !important" }}
              >
                {t(hasRecording ? "done" : "later")}
              </Button>
              <Button
                className="journey-link-btn"
                size="sm"
                variant="link"
                px={2.5}
                py={1.5}
                h="auto"
                minW="auto"
                color="var(--app-text-secondary)"
                textDecoration="underline"
                textUnderlineOffset="5px"
                border="none !important"
                borderColor="transparent !important"
                boxShadow="none !important"
                outline="none !important"
                sx={{
                  textUnderlineOffset: "5px",
                  "&:hover, &:focus, &:focus-visible, &:active": {
                    borderColor: "transparent !important",
                    outline: "none !important",
                    boxShadow: "none !important",
                    border: "none !important",
                  },
                }}
                _hover={{
                  color: "var(--app-text-primary)",
                  textDecoration: "underline",
                  textUnderlineOffset: "5px",
                  border: "none !important",
                  borderColor: "transparent !important",
                  boxShadow: "none !important",
                  outline: "none !important",
                }}
                _focus={{
                  border: "none !important",
                  borderColor: "transparent !important",
                  boxShadow: "none !important",
                  outline: "none !important",
                }}
                _focusVisible={{
                  border: "none !important",
                  borderColor: "transparent !important",
                  boxShadow: "none !important",
                  outline: "none !important",
                }}
                _active={{
                  border: "none !important",
                  borderColor: "transparent !important",
                  boxShadow: "none !important",
                  outline: "none !important",
                }}
                isDisabled={busy}
                onClick={() => {
                  playSound(selectSound);
                  onOpenJourney?.();
                }}
              >
                {t("view")}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
