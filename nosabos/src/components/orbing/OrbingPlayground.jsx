import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, AudioLines, Check, Heart, Mic, MicOff, Moon,
  MousePointer2, Pause, Play, RotateCcw, Sparkles, Sun, Volume2, X,
} from "lucide-react";
import VoiceOrb3D from "../VoiceOrb3D.jsx";
import useSoundSettings from "../../hooks/useSoundSettings.js";
import {
  PLAYGROUND_EXPRESSIONS,
  PLAYGROUND_FLOW,
  PLAYGROUND_MOODS,
  PLAYGROUND_PALETTES,
  PLAYGROUND_REACTION_DURATIONS,
  PLAYGROUND_REACTION_SOUNDS,
  PLAYGROUND_REACTIONS,
  PLAYGROUND_STATES,
  playgroundReactionPose,
  resolvePlaygroundMood,
} from "./playgroundData.js";
import { useOrbMicrophone } from "./useOrbMicrophone.js";
import "./orbing.css";

function MoodGlyph({ mood }) {
  return (
    <svg viewBox="0 0 44 30" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {mood === "joy" ? <path d="M8 17Q13 7 18 17M27 17Q32 7 37 17" />
          : mood === "love" ? <path fill="#e85d78" stroke="#e85d78" strokeWidth="1" d="M13 21C-2 10 10 5 13 12C18 4 29 11 13 21M32 21C17 10 29 5 32 12C37 4 48 11 32 21" />
          : mood === "excited" ? <path d="M8 10L17 15L8 20M36 10L27 15L36 20" />
          : mood === "surprised" ? <><ellipse cx="13" cy="15" rx="4.5" ry="6" fill="currentColor" stroke="none" /><ellipse cx="32" cy="15" rx="4.5" ry="6" fill="currentColor" stroke="none" /></>
          : mood === "sleepy" ? <path d="M8 15Q13 20 18 15M27 15Q32 20 37 15" />
          : mood === "tender" ? <path d="M11 13L15 18M30 18L34 13" />
          : mood === "content" ? <path strokeWidth="4.5" d="M13 11V20M32 11V20" />
          : mood === "playful" ? <><path d="M8 16Q13 8 18 16" /><ellipse cx="32" cy="15" rx="3.5" ry="4.5" fill="currentColor" stroke="none" /></>
          : mood === "bashful" ? <><path d="M10 17L14 13M30 13L34 17" /><circle cx="10" cy="22" r="2.5" fill="#f87171" stroke="none" /><circle cx="34" cy="22" r="2.5" fill="#f87171" stroke="none" /></>
          : mood === "zen" ? <path strokeWidth="3" d="M7 16H18M26 16H37" />
          : mood === "proud" ? <><path d="M9 13Q13.5 19 18 13M26 13Q30.5 19 35 13" /><path strokeWidth="2" d="M13.5 8V11M30.5 8V11" /></>
          : mood === "goofy" ? <><path d="M8 17Q13 10 18 17" /><ellipse cx="32" cy="16" rx="4" ry="4" strokeWidth="2.8" /></>
          : mood === "determined" ? <path d="M8 13L18 16M36 13L26 16" strokeWidth="4" />
          : mood === "daydreaming" ? <><path d="M9 18Q13 11 18 18M26 18Q30 11 35 18" /><circle cx="18" cy="8" r="1.5" fill="currentColor" stroke="none" /><circle cx="35" cy="8" r="1.5" fill="currentColor" stroke="none" /></>
          : mood === "grateful" ? <><ellipse cx="13" cy="15" rx="4" ry="5" fill="currentColor" stroke="none" /><ellipse cx="32" cy="15" rx="4" ry="5" fill="currentColor" stroke="none" /><circle cx="9" cy="22" r="2" fill="#fb923c" stroke="none" /><circle cx="35" cy="22" r="2" fill="#fb923c" stroke="none" /></>
          : mood === "awestruck" ? <path d="M13 10L14.5 13.5L18 15L14.5 16.5L13 20L11.5 16.5L8 15L11.5 13.5ZM32 10L33.5 13.5L37 15L33.5 16.5L32 20L30.5 16.5L27 15L30.5 13.5Z" fill="currentColor" stroke="none" />
          : mood === "hopeful" ? <><path d="M8 19Q13 12 18 18M27 18Q32 12 37 19" strokeWidth="3.6" /><circle cx="13" cy="10" r="1.5" fill="currentColor" stroke="none" /><circle cx="32" cy="10" r="1.5" fill="currentColor" stroke="none" /></>
          : mood === "cheeky" ? <path d="M8 18Q14 12 18 14M26 14Q30 12 36 18" strokeWidth="3.6" />
          : mood === "cozy" ? <><path d="M8 14Q13 18 18 14M26 14Q31 18 36 14" strokeWidth="3.6" /><path d="M10 21Q13 23 16 21M28 21Q31 23 34 21" stroke="#f472b6" strokeWidth="2.4" /></>
          : mood === "curious" ? <path strokeWidth="4.5" d="M13 14V19M32 9V20" />
          : <path strokeWidth="4.5" d="M13 11V20M32 11V20" />}
      </g>
    </svg>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <button className="orbing-toggle-row" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span>{children}</span>
      <span className="orbing-switch" aria-hidden="true"><span /></span>
    </button>
  );
}

export default function OrbingPlayground() {
  const [mood, setMood] = useState("joy");
  const [state, setState] = useState("idle");
  const [palette, setPalette] = useState("mint");
  const [energy, setEnergy] = useState(0.7);
  const [voiceLevel, setVoiceLevel] = useState(0.65);
  const [followPointer, setFollowPointer] = useState(true);
  const [dark, setDark] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [playingTour, setPlayingTour] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [message, setMessage] = useState("");
  const reactionCounter = useRef(0);
  const mic = useOrbMicrophone();
  const playSound = useSoundSettings((settings) => settings.playSound);
  const warmupAudio = useSoundSettings((settings) => settings.warmupAudio);
  const soundsOn = useSoundSettings((settings) => settings.soundEnabled);
  const setSoundsOn = useSoundSettings((settings) => settings.setSoundEnabled);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const title = document.title;
    document.title = "Orbing — 20 feelings, dances & colors · Piyali";
    return () => { document.title = title; };
  }, []);

  const react = useCallback((kind) => {
    setPaused(false);
    setReaction({ kind, id: ++reactionCounter.current });
    const reactionObj = PLAYGROUND_REACTIONS.find((item) => item.id === kind);
    setMessage(kind === "boop" ? "Oh! That tickles. Again?" : reactionObj?.message || "");
    if (soundsOn) {
      const soundKey = PLAYGROUND_REACTION_SOUNDS[kind] || "select";
      void playSound(soundKey);
    }
  }, [playSound, soundsOn]);

  const finishReaction = useCallback((id) => {
    if (id !== reactionCounter.current) return;
    setReaction(null);
    setMessage("");
  }, []);

  useEffect(() => {
    if (!playingTour) return undefined;
    const steps = [
      { mood: "joy", state: "idle", action: "wave" },
      { mood: "curious", state: "listening" },
      { mood: "determined", state: "thinking" },
      { mood: "excited", state: "speaking", action: "wiggle" },
      { mood: "zen", state: "aurora", action: "float" },
      { mood: "proud", state: "shimmer", action: "twirl" },
      { mood: "awestruck", state: "nebula", action: "orbit" },
      { mood: "playful", state: "kaleidoscope", action: "jiggle" },
      { mood: "cozy", state: "whisper", action: "snooze" },
      { mood: "love", state: "heartbeat", action: "celebrate" },
    ];
    let index = 0;
    const step = () => {
      const next = steps[index++];
      if (!next) { setPlayingTour(false); return; }
      setMood(next.mood);
      setState(next.state);
      if (next.action) react(next.action);
    };
    step();
    const timer = setInterval(step, 3400);
    return () => clearInterval(timer);
  }, [playingTour, react]);

  const chooseMood = (next) => { setPlayingTour(false); setMood(next); setMessage(""); setReaction(null); };
  const chooseState = (next) => { setPlayingTour(false); setState(next); if (next !== "listening") mic.stop(); };
  const reset = () => {
    setPlayingTour(false); setMood("joy"); setState("idle"); setPalette("mint");
    setEnergy(0.7); setVoiceLevel(0.65); setFollowPointer(true); setPaused(false);
    setDark(false); setReaction(null); setMessage("");
    mic.stop();
  };
  const toggleMic = async () => {
    setPlayingTour(false);
    if (mic.status !== "off") { mic.stop(); return; }
    if (await mic.start()) { setState("listening"); setPaused(false); }
  };
  const startTour = () => { mic.stop(); setPaused(false); if (soundsOn) void warmupAudio(); setPlayingTour((value) => !value); };

  const currentMood = PLAYGROUND_MOODS.find((item) => item.id === mood) || PLAYGROUND_MOODS[0];
  const currentState = PLAYGROUND_STATES.find((item) => item.id === state) || PLAYGROUND_STATES[0];
  const currentPalette = PLAYGROUND_PALETTES.find((item) => item.id === palette) || PLAYGROUND_PALETTES[0];

  return (
    <main className="orbing-page">
      <header className="orbing-header">
        <Link to="/" className="orbing-wordmark" aria-label="Back to Piyali">
          <span className="orbing-logo" aria-hidden="true"><i /><i /></span>piyali
          <span className="orbing-wordmark-divider" /> <span className="orbing-lab-name">playground</span>
        </Link>
        <span className="orbing-header-note"><span /> 20 feelings · 20 dances · 20 colors · 20 voice states</span>
        <Link to="/" className="orbing-back"><ArrowLeft size={14} /> Back to Piyali</Link>
      </header>

      <div className="orbing-content">
        <section className="orbing-intro">
          <div>
            <div className="orbing-eyebrow">
              <span>EXPERIMENT 002</span>
              <span className="orbing-eyebrow-rule" />
              THE VOICEORB, EVOLVED
            </div>
            <h1>A little more <span>alive.</span>
              <svg viewBox="0 0 37 45" aria-hidden="true"><path d="M5 22l15-12M10 30l22-2M3 14l5-11" /></svg>
            </h1>
            <p>20 feelings, 20 behaviors and dances, 20 color palettes, and 20 voice states — created exclusively for the playground.</p>
          </div>
          <button
            className={`orbing-tour-button${playingTour ? " is-playing" : ""}`}
            onClick={startTour}
            aria-pressed={playingTour}
          >
            {playingTour ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            {playingTour ? "Stop the little show" : "Watch the 20-personality showcase"}
            <span>~34s</span>
          </button>
        </section>

        <div className="orbing-layout">
          <section className={`orbing-studio${dark ? " is-dark" : ""}`} aria-label="Interactive orb studio">
            <div className="orbing-stage">
              <div className="orbing-stage-header">
                <div className="orbing-model-label">
                  <span className="orbing-live-dot" />
                  <span>VoiceOrb <span className="orbing-model-version">20x20</span></span>
                </div>
                <div className="orbing-stage-tools">
                  <button
                    aria-label={dark ? "Use daylight studio" : "Use moonlight studio"}
                    onClick={() => { setDark(!dark); setPalette(dark ? "mint" : "midnight"); }}
                    title={dark ? "Daylight" : "Moonlight"}
                  >
                    {dark ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    aria-label={paused ? "Resume animation" : "Pause animation"}
                    aria-pressed={paused}
                    onClick={() => { setPaused(!paused); setPlayingTour(false); }}
                    title={paused ? "Resume" : "Pause"}
                  >
                    {paused ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                </div>
              </div>
              <div className="orbing-stage-word" aria-hidden="true">hello, you.</div>

              <VoiceOrb3D
                state={state}
                mood={mood}
                palette={palette}
                energy={energy}
                voiceLevel={voiceLevel}
                audioLevelRef={mic.status === "on" ? mic.levelRef : undefined}
                reaction={reaction}
                paused={paused}
                reducedMotion={reducedMotion}
                followPointer={followPointer}
                dark={dark}
                onInteract={react}
                onReactionComplete={finishReaction}
                palettes={PLAYGROUND_PALETTES}
                orbFlow={PLAYGROUND_FLOW}
                reactionDurations={PLAYGROUND_REACTION_DURATIONS}
                reactionPose={playgroundReactionPose}
                resolveOrbMood={resolvePlaygroundMood}
                expressions={PLAYGROUND_EXPRESSIONS}
              />

              <div className="orbing-orbit-label" aria-hidden="true">
                <span /> a little curiosity<br />
                <span className="orbing-handwritten">goes a long way</span>
              </div>
              <div className="orbing-stage-caption">
                <p aria-live="polite">{message || (state === "idle" ? currentMood.line : currentState.caption)}</p>
                <span className={`orbing-state-badge is-${state}`}>
                  <span />
                  {paused ? "Taking a breather" : mic.status === "on" ? "Listening to you" : currentState.label}
                </span>
              </div>
              <div className="orbing-stage-corner"><MousePointer2 size={12} /> Tap to boop · drag to turn</div>
              <span className="orbing-stage-edition">20 FEELINGS · 20 DANCES · 20 COLORS · 20 STATES</span>
            </div>

            <div className="orbing-reactions">
              <div>
                <span className="orbing-small-label">A LITTLE NUDGE · 20 BEHAVIORS &amp; DANCES</span>
                <p>Trigger a dance.</p>
              </div>
              <div className="orbing-reaction-buttons" role="group" aria-label="Behaviors and dances">
                {PLAYGROUND_REACTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setPlayingTour(false); react(item.id); }}
                      className={reaction?.kind === item.id ? "is-active" : ""}
                      title={item.label}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="orbing-controls" aria-label="Character controls">
            <div className="orbing-controls-title">
              <div>
                <h2>Make it yours.</h2>
                <p>20 feelings, voice states &amp; colors.</p>
              </div>
              <Sparkles size={20} />
            </div>

            <section className="orbing-control-section">
              <div className="orbing-section-label">
                <h3>Feeling</h3>
                <span>{currentMood.label} (20)</span>
              </div>
              <div className="orbing-moods" role="radiogroup" aria-label="Orb feelings">
                {PLAYGROUND_MOODS.map((item) => (
                  <button
                    key={item.id}
                    className={mood === item.id ? "is-selected" : ""}
                    onClick={() => chooseMood(item.id)}
                    aria-pressed={mood === item.id}
                    title={item.label}
                  >
                    <MoodGlyph mood={item.id} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="orbing-control-section">
              <div className="orbing-section-label">
                <h3>Voice state &amp; movement</h3>
                <span>{currentState.label} (20)</span>
              </div>
              <div className="orbing-voice-states" role="radiogroup" aria-label="Orb voice states">
                {PLAYGROUND_STATES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => chooseState(item.id)}
                    aria-pressed={state === item.id}
                    className={state === item.id ? "is-selected" : ""}
                    title={item.caption}
                  >
                    <span className={`orbing-state-symbol is-${item.id}`} aria-hidden="true"><i /><i /><i /></span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="orbing-voice-options">
                {mic.status !== "on" && (
                  <label className="orbing-range-label" htmlFor="orb-voice">
                    <span>Preview amplitude</span>
                    <span>{Math.round(voiceLevel * 100)}%</span>
                    <input
                      id="orb-voice"
                      type="range"
                      min="0"
                      max="100"
                      value={voiceLevel * 100}
                      onChange={(event) => setVoiceLevel(Number(event.target.value) / 100)}
                    />
                  </label>
                )}
                <button
                  className={`orbing-mic-button${mic.status === "on" ? " is-on" : ""}`}
                  onClick={toggleMic}
                >
                  {mic.status === "on" ? <MicOff size={14} /> : <Mic size={14} />}
                  {mic.status === "on" ? "Stop microphone" : mic.status === "requesting" ? "Cancel microphone request" : "Try your microphone"}
                </button>
                <p>{mic.status === "on" ? "Audio stays here. Nothing is recorded or sent." : "Each state animates color movement uniquely. Try your mic to bring it to life."}</p>
              </div>
              {mic.error && <p className="orbing-mic-error" role="status">{mic.error}</p>}
            </section>

            <section className="orbing-control-section">
              <div className="orbing-section-label">
                <h3>Color story</h3>
                <span>{currentPalette.name} (20)</span>
              </div>
              <div className="orbing-palette" role="radiogroup" aria-label="Color palettes">
                {PLAYGROUND_PALETTES.map((item) => (
                  <button
                    key={item.id}
                    style={{ "--swatch": item.swatch }}
                    aria-label={item.name}
                    title={item.name}
                    aria-pressed={palette === item.id}
                    className={palette === item.id ? "is-selected" : ""}
                    onClick={() => setPalette(item.id)}
                  >
                    {palette === item.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>

            <section className="orbing-control-section orbing-motion-section">
              <div className="orbing-section-label"><h3>Little details</h3><span>04</span></div>
              <label className="orbing-range-label" htmlFor="orb-energy">
                <span>Energy</span>
                <span>{energy < 0.4 ? "Mellow" : energy > 0.95 ? "Extra bouncy" : "Easygoing"}</span>
                <input
                  id="orb-energy"
                  type="range"
                  min="0"
                  max="150"
                  value={energy * 100}
                  onChange={(event) => setEnergy(Number(event.target.value) / 100)}
                  disabled={reducedMotion}
                />
              </label>
              <Toggle checked={followPointer} onChange={setFollowPointer}><MousePointer2 size={14} /> Follow my cursor</Toggle>
              <Toggle checked={soundsOn} onChange={setSoundsOn}><Volume2 size={14} /> Reaction sounds</Toggle>
              {reducedMotion && <p className="orbing-motion-note">Your reduced-motion preference is on. Expressions and colors still work.</p>}
            </section>

            <button className="orbing-reset" onClick={reset}><RotateCcw size={13} /> Reset to its happy place</button>
          </aside>
        </div>

        <footer className="orbing-footer">
          <p><Heart size={13} /> Built from VoiceOrb. 20 feelings, 20 dances, 20 colors, 20 voice states.</p>
          <span>20×20 PLAYGROUND EDITION</span>
        </footer>
      </div>
      {mic.status === "on" && (
        <div className="orbing-mic-live" role="status">
          <AudioLines size={17} />
          <span>Microphone is on · local audio only</span>
          <button onClick={mic.stop} aria-label="Stop microphone"><X size={16} /></button>
        </div>
      )}
    </main>
  );
}
