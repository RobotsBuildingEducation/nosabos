import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeStore } from "../useThemeStore";
import VoiceOrb3D from "./VoiceOrb3D.jsx";
import { randomDisplayOrb, randomTutorFeedback, REACTION_DURATION, REACTION_SETTLE_DURATION, TUTOR_DEFAULT_MOODS } from "./orbing/orbModel.js";
import "./voiceOrbNext.css";

function MiniOrb({ state, palette, mood, reaction }) {
  return (
    <span key={reaction?.id} className="voice-orb-next-mini" data-state={state} data-theme={palette} data-mood={mood} data-reaction={reaction?.kind} aria-hidden="true">
      <span className="voice-orb-next-pigment" />
      <span className="voice-orb-next-wash" />
      <span className="voice-orb-next-face"><i /><i /></span>
    </span>
  );
}

/** Display orbs choose their own personality; tutor orbs follow the live voice state. */
export default function VoiceOrbNext({ state = "idle", theme, palette, size = 75, centered = true, variant = "display", excludeThinking = false, callActive = true, feedback = null, force3D = false, showShadow = true }) {
  const themeMode = useThemeStore((store) => store.themeMode);
  const dark = (theme || themeMode) !== "light";
  const resolvedPalette = palette || (dark ? "blue" : "mint");
  const isDisplay = variant === "display";
  const useMini = size < 64 && !force3D;
  const [personality, setPersonality] = useState(() => randomDisplayOrb(Math.random, { excludeThinking }));
  const [reaction, setReaction] = useState(() => ({ id: 1, kind: personality.reaction }));
  const [defaultTutorMood] = useState(() => TUTOR_DEFAULT_MOODS[Math.floor(Math.random() * TUTOR_DEFAULT_MOODS.length)]);
  const [tutorFeedback, setTutorFeedback] = useState(null);
  const reactionId = useRef(1);
  const voiceState = isDisplay ? (excludeThinking && personality.state === "thinking" ? "idle" : personality.state) : (callActive && ["idle", "listening", "thinking", "speaking"].includes(state) ? state : "idle");
  const mood = isDisplay ? personality.mood : tutorFeedback?.mood || (callActive ? defaultTutorMood : "sleepy");
  const currentReaction = isDisplay ? reaction : tutorFeedback?.reaction;

  useEffect(() => {
    if (!isDisplay) return undefined;
    const timer = window.setInterval(() => {
      const next = randomDisplayOrb(Math.random, { excludeThinking });
      setPersonality(next);
      setReaction({ id: ++reactionId.current, kind: next.reaction });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isDisplay, excludeThinking]);

  useEffect(() => {
    if (!isDisplay || !reaction) return undefined;
    const timer = window.setTimeout(() => {
      setReaction((current) => current?.id === reaction.id ? null : current);
    }, (REACTION_DURATION[reaction.kind] + REACTION_SETTLE_DURATION) * 1000);
    return () => window.clearTimeout(timer);
  }, [isDisplay, reaction]);

  useEffect(() => {
    if (isDisplay || feedback?.id == null) return undefined;
    const next = randomTutorFeedback(feedback.result);
    if (!next) return undefined;
    setTutorFeedback({ mood: next.mood, reaction: next.reaction ? { id: feedback.id, kind: next.reaction } : null });
    const duration = next.reaction ? REACTION_DURATION[next.reaction] + REACTION_SETTLE_DURATION : 3.5;
    const timer = window.setTimeout(() => setTutorFeedback(null), duration * 1000);
    return () => window.clearTimeout(timer);
  }, [isDisplay, feedback?.id, feedback?.result]);

  const boop = useCallback(() => {
    if (isDisplay) setReaction({ id: ++reactionId.current, kind: "boop" });
  }, [isDisplay]);

  return (
    <span
      className={`voice-orb-next${isDisplay ? " is-interactive" : ""}`}
      style={{ width: size, height: size, margin: centered ? "0 auto" : 0 }}
      role={isDisplay ? (useMini ? "button" : undefined) : "img"}
      tabIndex={isDisplay && useMini ? 0 : undefined}
      aria-label={isDisplay && !useMini ? undefined : `${isDisplay ? "Boop" : "Tutor"} orb, ${mood}, ${voiceState}`}
      onClick={isDisplay && useMini ? boop : undefined}
      onKeyDown={isDisplay && useMini ? (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); boop(); }
      } : undefined}
    >
      {useMini ? <MiniOrb state={voiceState} palette={resolvedPalette} mood={mood} reaction={currentReaction} /> : (
        <VoiceOrb3D
          state={voiceState}
          mood={mood}
          palette={resolvedPalette}
          dark={dark}
          energy={isDisplay ? 1.5 : 0.7}
          followPointer={false}
          interactive={isDisplay}
          onInteract={isDisplay ? boop : undefined}
          reaction={currentReaction}
          compact
          showShadow={showShadow}
          fallback={<MiniOrb state={voiceState} palette={resolvedPalette} mood={mood} reaction={currentReaction} />}
        />
      )}
    </span>
  );
}
