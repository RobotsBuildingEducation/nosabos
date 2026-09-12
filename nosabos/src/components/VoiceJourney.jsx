import React, { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, HStack, Progress, Spinner, Text, VStack } from "@chakra-ui/react";
import { FiCheck, FiLock, FiMic, FiPlay, FiTrash2 } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound } from "../constants/sounds";
import { journeyCopy } from "../utils/voiceJourneyCopy";
import { JOURNEY_MILESTONES, journeyBaseline, journeySessionCount } from "../utils/voiceJourneyModel";
import { deleteJourneyRecording, loadJourneyRecording } from "../utils/voiceJourney";
import JourneyRecordingModal, { JourneyAudio } from "./JourneyRecordingModal";

export default function VoiceJourney({ npub, targetLang, lang, resource }) {
  const playSound = useSoundSettings((s) => s.playSound);
  const { data: journey, loading, error, retry } = resource;
  const t = (key, values) => journeyCopy(lang, key, values);
  const count = journeySessionCount(journey);
  const next = JOURNEY_MILESTONES.find(number => number > count);
  const baseline = journeyBaseline(journey);
  const [recordingMilestone, setRecordingMilestone] = useState(null);
  const [selected, setSelected] = useState(null);
  const [clips, setClips] = useState(null);
  const [loadingClip, setLoadingClip] = useState(null);
  const [clipError, setClipError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const requestRef = useRef(0);
  useEffect(() => () => { requestRef.current += 1; }, []);
  const listen = async number => {
    const request = ++requestRef.current;
    setSelected(number); setClips(null); setLoadingClip(number); setClipError(""); setConfirmDelete(null);
    try {
      const current = await loadJourneyRecording(npub, targetLang, number);
      const first = baseline && baseline !== number ? await loadJourneyRecording(npub, targetLang, baseline) : null;
      if (requestRef.current === request) setClips({ current, first });
    } catch (err) {
      if (requestRef.current === request) setClipError(err.message === "JOURNEY_SIGNER_UNSUPPORTED" ? "signer" : "error");
    } finally { if (requestRef.current === request) setLoadingClip(null); }
  };
  const remove = async number => {
    setDeleting(true); setClipError("");
    try {
      await deleteJourneyRecording(npub, targetLang, number);
      requestRef.current += 1;
      setSelected(null); setClips(null); setConfirmDelete(null);
    } catch { setClipError("error"); }
    finally { setDeleting(false); }
  };
  if (loading) return <HStack py={8} justify="center"><Spinner size="sm" /><Text fontSize="sm">{t("loading")}</Text></HStack>;
  if (error) return <VStack py={8}><Text role="alert">{t("error")}</Text><Button onClick={() => { playSound(selectSound); retry(); }}>{t("retry")}</Button></VStack>;
  return <>
    <Box p={{ base: 4, md: 6 }} mb={6} borderRadius="2xl" bg="var(--app-surface)" border="1px solid" borderColor="var(--app-border)" position="relative" overflow="hidden">
      <Box position="absolute" right="-30px" top="-60px" w="180px" h="180px" borderRadius="full" bg="teal.400" opacity={0.08} pointerEvents="none" />
      <Text fontSize="xs" color="var(--app-text-muted)" mb={2}>{t("subtitle")}</Text>
      <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" lineHeight="1.2" maxW="390px">{t("title")}</Text>
      <HStack mt={5} mb={2} justify="space-between"><Text fontWeight="semibold" fontSize="sm">{t("sessions", { n: count })}</Text><FiMic /></HStack>
      <Progress value={count} max={next || Math.max(150, count)} colorScheme="teal" size="xs" borderRadius="full" aria-label={t(next ? "next" : "allUnlocked", { n: next })} />
      <Text mt={2} fontSize="xs" color="var(--app-text-secondary)">{t(next ? "next" : "allUnlocked", { n: next })}</Text>
      <Text mt={3} fontSize="xs" color="var(--app-text-muted)">{t("rule")}</Text>
      {count === 0 && <Text mt={3} fontSize="sm">{t("empty")}</Text>}
    </Box>
    <Box as="ol" m={0} p={0} pb={12} listStyleType="none" aria-label={t("journey")}>
      {JOURNEY_MILESTONES.map((number, index) => {
        const unlocked = count >= number;
        const metadata = journey.recordings?.[number];
        const active = selected === number;
        return <Box as="li" key={number} position="relative" pl={{ base: "50px", md: "64px" }} pb={6}>
          {index < JOURNEY_MILESTONES.length - 1 && <Box position="absolute" left={{ base: "17px", md: "21px" }} top="35px" bottom="-1px" borderLeft="2px dashed" borderColor={unlocked ? "teal.500" : "var(--app-border)"} opacity={0.5} />}
          <Box position="absolute" top={2} left={0} display="grid" placeItems="center" w={{ base: "36px", md: "44px" }} h={{ base: "36px", md: "44px" }} borderRadius="full" bg={unlocked ? "teal.600" : "var(--app-surface)"} color={unlocked ? "white" : "var(--app-text-muted)"} border="1px solid" borderColor={unlocked ? "teal.500" : "var(--app-border)"} boxShadow={unlocked && !metadata ? "0 0 0 5px rgba(45,212,191,0.09)" : "none"}>
            {metadata ? <FiCheck /> : unlocked ? <FiMic /> : <FiLock />}
          </Box>
          <Box border="1px solid" borderColor={unlocked && !metadata ? "teal.500" : "var(--app-border)"} bg="var(--app-surface)" borderRadius="2xl" p={{ base: 3, md: 4 }}>
            <HStack align="start" justify="space-between" flexWrap="wrap" rowGap={2}>
              <Box><Text fontWeight="semibold">{t("session", { n: number })}</Text>
                <Text fontSize="xs" mt={1} color="var(--app-text-muted)">{t(metadata ? "saved" : unlocked ? "ready" : "locked")}</Text>
              </Box>
              {metadata ? <Button size="sm" leftIcon={<FiPlay />} variant="outline" isLoading={loadingClip === number} onClick={() => {
                playSound(selectSound);
                if (active && clips) { requestRef.current += 1; setSelected(null); setClips(null); }
                else void listen(number);
              }}>{t("listen")}</Button> : unlocked ? <Button
                size="sm"
                colorScheme="cyan"
                bg="cyan.500"
                color="white"
                boxShadow="0 4px 0 var(--chakra-colors-cyan-800, #086F83)"
                _hover={{ bg: "cyan.400" }}
                _active={{
                  transform: "translateY(2px)",
                  boxShadow: "0 2px 0 var(--chakra-colors-cyan-800, #086F83)",
                }}
                onClick={() => {
                  playSound(selectSound);
                  requestRef.current += 1;
                  setSelected(null);
                  setClips(null);
                  setRecordingMilestone(number);
                }}
                leftIcon={<FiMic />}
              >{t("record")}</Button> : null}
            </HStack>
            {metadata && <Text fontSize="xs" color="var(--app-text-muted)" mt={2}>{new Date(metadata.createdAt).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" })} · {t("captured", { n: metadata.capturedSession })}</Text>}
            {active && clips && <VStack align="stretch" spacing={4} pt={5}>
              <Text fontSize="sm">{clips.current.prompt}</Text>
              {clips.first && <><Text fontSize="xs" color="var(--app-text-muted)">{t("compare")}</Text><JourneyAudio blob={clips.first.blob} label={t("first")} lang={lang} /><Badge alignSelf="start" whiteSpace="normal">{t(clips.first.support === "hints" ? "hints" : "independent")}</Badge></>}
              <JourneyAudio blob={clips.current.blob} label={t("session", { n: number })} lang={lang} />
              <Badge alignSelf="start" whiteSpace="normal">{t(clips.current.support === "hints" ? "hints" : "independent")}</Badge>
            </VStack>}
            {active && clipError && <Text mt={3} fontSize="sm" role="alert">{t(clipError)}</Text>}
            {metadata && active && <Box mt={4}>
              {confirmDelete === number ? <><Text fontSize="sm" mb={2}>{t("deleteConfirm")}</Text><HStack flexWrap="wrap"><Button size="xs" colorScheme="red" isLoading={deleting} onClick={() => { playSound(selectSound); remove(number); }}>{t("delete")}</Button><Button size="xs" variant="ghost" isDisabled={deleting} onClick={() => { playSound(selectSound); setConfirmDelete(null); }}>{t("cancel")}</Button></HStack></> : <Button size="xs" variant="ghost" leftIcon={<FiTrash2 />} color="var(--app-text-muted)" onClick={() => { playSound(selectSound); setConfirmDelete(number); }}>{t("delete")}</Button>}
            </Box>}
          </Box>
        </Box>;
      })}
    </Box>
    {recordingMilestone && <JourneyRecordingModal key={recordingMilestone} npub={npub} targetLang={targetLang} lang={lang} milestone={recordingMilestone} journey={journey} onClose={() => setRecordingMilestone(null)} onOpenJourney={() => setRecordingMilestone(null)} />}
  </>;
}
