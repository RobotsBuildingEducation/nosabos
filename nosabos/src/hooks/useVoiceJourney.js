import { useEffect, useState } from "react";
import { subscribeVoiceJourney } from "../utils/voiceJourney";

export default function useVoiceJourney(npub, lang) {
  const key = `${npub}:${lang}`;
  const [snapshot, setSnapshot] = useState({ key: "", data: {}, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!npub) return undefined;
    return subscribeVoiceJourney(npub, lang,
      data => setSnapshot({ key, data, loading: false, error: false }),
      () => setSnapshot({ key, data: {}, loading: false, error: true }),
    );
  }, [npub, lang, key, attempt]);
  return {
    ...(snapshot.key === key ? snapshot : { data: {}, loading: Boolean(npub), error: false }),
    retry: () => setAttempt(value => value + 1),
  };
}
