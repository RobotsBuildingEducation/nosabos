import React, { useEffect, useRef, useState } from "react";
import { pendingJourneyMilestone } from "../utils/voiceJourneyModel";
import { acknowledgeJourneyMilestone } from "../utils/voiceJourney";
import JourneyRecordingModal from "./JourneyRecordingModal";

export default function JourneyMilestoneGate({ npub, targetLang, lang, journey, canPresent, onOpenJourney }) {
  const [opened, setOpened] = useState(null);
  const seen = useRef(new Set());
  const milestone = pendingJourneyMilestone(journey);
  const latest = useRef({ canPresent, journey });
  latest.current = { canPresent, journey };
  useEffect(() => {
    if (!npub || !milestone || opened || seen.current.has(milestone)) return undefined;
    let quietSince = 0;
    const timer = setInterval(() => {
      if (!latest.current.canPresent()) { quietSince = 0; return; }
      if (!quietSince) quietSince = Date.now();
      // Let the existing quest, XP, and companion celebration chain settle.
      if (Date.now() - quietSince < 1500) return;
      seen.current.add(milestone);
      setOpened({ milestone, journey: latest.current.journey });
      void acknowledgeJourneyMilestone(npub, targetLang, milestone).catch(() => {});
      clearInterval(timer);
    }, 300);
    return () => clearInterval(timer);
  }, [npub, targetLang, milestone, opened]);
  return opened ? <JourneyRecordingModal
    npub={npub} targetLang={targetLang} lang={lang}
    milestone={opened.milestone} journey={opened.journey}
    onClose={() => setOpened(null)} onOpenJourney={onOpenJourney}
  /> : null;
}
