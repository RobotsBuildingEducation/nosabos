import React, { useEffect, useRef, useState } from "react";
import { Button, Text, VStack } from "@chakra-ui/react";
import { FiMic } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound } from "../constants/sounds";
import { JOURNEY_MILESTONES, journeySessionCount } from "../utils/voiceJourneyModel";
import { journeyCopy } from "../utils/voiceJourneyCopy";
import { unlockNextJourneyMilestoneForTesting } from "../utils/voiceJourney";
import JourneyRecordingModal from "./JourneyRecordingModal";

export default function JourneyTestButton({ npub, targetLang, lang, resource, onOpenJourney }) {
  const playSound = useSoundSettings((s) => s.playSound);
  const [opened, setOpened] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const count = journeySessionCount(opened?.journey || resource.data);
  const next = JOURNEY_MILESTONES.find(number => number > count);
  const open = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const result = await unlockNextJourneyMilestoneForTesting(npub, targetLang);
      if (!alive.current) return;
      if (result) setOpened(result);
      else onOpenJourney();
    } catch {
      if (alive.current) setFailed(true);
    } finally {
      pending.current = false;
      if (alive.current) setLoading(false);
    }
  };
  return <>
    <VStack align="end" spacing={1}>
      <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<FiMic />}
        isLoading={loading} isDisabled={!npub || resource.loading || Boolean(opened)} onClick={() => {
          playSound(selectSound);
          open();
        }}>
        {journeyCopy(lang, next ? "testJourney" : "view", { n: next })}
      </Button>
      {failed && <Text role="alert" fontSize="xs" color="var(--app-text-secondary)">{journeyCopy(lang, "error")}</Text>}
    </VStack>
    {opened && <JourneyRecordingModal key={opened.milestone} npub={npub} targetLang={targetLang} lang={lang}
      milestone={opened.milestone} journey={opened.journey} onClose={() => setOpened(null)} onOpenJourney={onOpenJourney} />}
  </>;
}
