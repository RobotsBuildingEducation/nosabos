import { useEffect, useId, useRef, useState } from "react";
import { Button, HStack, Menu, MenuButton, MenuItemOption, MenuList, MenuOptionGroup, Portal } from "@chakra-ui/react";
import { ChevronDown, Mic, Square } from "lucide-react";
import VoiceOrb from "./VoiceOrbNext";
import VoiceWaveIcon from "./VoiceWaveIcon";
import { getPracticeLanguageOptions, LANGUAGE_LOCALES } from "../constants/languages";
import { useTutorVoiceLevel } from "../hooks/useTutorVoiceLevel";
import { LANDING_TUTOR_SAMPLES, LandingTutorDemoSession } from "../utils/landingTutorDemo";
import { getDefaultLandingPracticeLanguage } from "../utils/languageDetection";
import { landingTutorDemoCopy } from "./landingTutorDemoCopy";

const INITIAL_STATE = { status: "idle", tutorText: "", learnerText: "", error: "" };
const ACTIVE_STATES = new Set(["connecting", "thinking", "speaking", "listening"]);

export default function LandingTutorDemo({ copy, lang, visible = true }) {
  const [targetLanguage, setTargetLanguage] = useState(() =>
    getDefaultLandingPracticeLanguage(lang));
  const [session, setSession] = useState(INITIAL_STATE);
  const controllerRef = useRef(null);
  const containerRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micFloatBufRef = useRef(null);
  const tutorAnalyserRef = useRef(null);
  const tutorFloatBufRef = useRef(null);
  const languageLabelId = useId();
  const words = landingTutorDemoCopy[lang] || landingTutorDemoCopy.en;
  const active = visible && ACTIVE_STATES.has(session.status);
  const languages = getPracticeLanguageOptions({ ui: copy, uiLang: lang });
  const selectedLanguage = languages.find((language) => language.value === targetLanguage);
  const sample = LANDING_TUTOR_SAMPLES[targetLanguage];
  const orbState = ["thinking", "speaking", "listening"].includes(session.status) ? session.status : "idle";
  const audioLevelRef = useTutorVoiceLevel({ enabled: active, state: orbState,
    micAnalyserRef, micFloatBufRef, tutorAnalyserRef, tutorFloatBufRef });

  useEffect(() => {
    if (!visible) return;
    const stop = () => controllerRef.current?.stop();
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stop();
    });
    if (containerRef.current) observer?.observe(containerRef.current);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      stop();
      controllerRef.current?.dispose();
    };
  }, [visible]);

  function start() {
    if (controllerRef.current?.run) return;
    controllerRef.current?.dispose();
    const controller = new LandingTutorDemoSession({
      createBridge: async (options) => {
        // Unlock audio in the Start click, before the lazy import and network
        // handshake consume mobile browsers' transient user activation.
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) throw new Error("Web Audio is unavailable.");
        const audioContext = new Ctx();
        void audioContext.resume().catch(() => {});
        const closeEarly = () => { void audioContext.close().catch(() => {}); };
        options.signal.addEventListener("abort", closeEarly, { once: true });
        try {
          const { createGeminiLiveRealtimeBridge } = await import("../utils/geminiLiveBridge");
          options.signal.throwIfAborted();
          options.signal.removeEventListener("abort", closeEarly);
          return await createGeminiLiveRealtimeBridge({ ...options, audioContext });
        } catch (error) {
          closeEarly();
          throw error;
        } finally {
          options.signal.removeEventListener("abort", closeEarly);
        }
      },
      onChange: setSession,
      onAudioGraph: (graph) => {
        micAnalyserRef.current = graph?.micAnalyser || null;
        micFloatBufRef.current = graph?.micFloatBuffer || null;
        tutorAnalyserRef.current = graph?.analyser || null;
        tutorFloatBufRef.current = graph?.floatBuffer || null;
      },
    });
    controllerRef.current = controller;
    void controller.start({ targetLanguage, supportLanguage: lang,
      inputLanguageCodes: [...new Set([LANGUAGE_LOCALES[targetLanguage], LANGUAGE_LOCALES[lang]].filter(Boolean))] });
  }

  const statusText = session.status === "error" ? words[session.error] : words[session.status];
  const showSample = session.status === "idle";

  return (
    <div className="lp-conversation lp-live-demo" ref={containerRef} data-status={session.status}>
      <div className="lp-demo-language">
        <span id={languageLabelId}>{words.language}</span>
        <Menu isLazy placement="bottom-end">
          <MenuButton as={Button} variant="outline" className="lp-demo-language-button" isDisabled={active}
            _hover={{ bg: "var(--lp-mint)" }} _active={{ bg: "var(--lp-mint)" }}
            _expanded={{ bg: "var(--lp-mint)" }}
            aria-labelledby={`${languageLabelId} ${languageLabelId}-value`}
            rightIcon={<ChevronDown size={16} />}>
            <span id={`${languageLabelId}-value`}>{selectedLanguage?.label}</span>
          </MenuButton>
          <Portal>
            <MenuList bg="var(--app-surface)" color="var(--app-text-primary)"
              borderColor="var(--app-border)" borderRadius="16px" boxShadow="xl"
              minW="210px" maxW="calc(100vw - 32px)" maxH="min(320px, 60vh)"
              overflowY="auto" zIndex={1500} p={2} fontFamily="DM Sans, sans-serif">
              <MenuOptionGroup type="radio" value={targetLanguage} onChange={(value) => {
                controllerRef.current?.dispose();
                controllerRef.current = null;
                setTargetLanguage(value);
                setSession(INITIAL_STATE);
              }}>
                {languages.map((language) => (
                  <MenuItemOption key={language.value} value={language.value}
                    bg="transparent" borderRadius="10px" minH="44px" fontSize="sm"
                    _hover={{ bg: "var(--app-surface-elevated)" }}
                    _focus={{ bg: "var(--app-surface-elevated)" }}
                    _checked={{ fontWeight: "semibold" }}>
                    <HStack spacing={2}>{language.flag}<span>{language.label}</span></HStack>
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuList>
          </Portal>
        </Menu>
      </div>
      <div className="lp-speech-bubble lp-demo-transcript" lang={targetLanguage} dir="ltr" aria-live="off">
        {showSample ? sample[0] : session.tutorText || words.emptyTutor}
      </div>
      <div className="lp-speak-orb">
        <VoiceOrb size={116} sharedRenderer maxDpr={1} variant={active ? "tutor" : "display"}
          state={orbState} callActive={active} audioLevelRef={audioLevelRef} />
      </div>
      <div className="lp-demo-voice" aria-hidden="true">
        <VoiceWaveIcon size={28} barCount={9} audioLevelRef={audioLevelRef} color="var(--lp-green)" />
      </div>
      <div className="lp-speech-bubble lp-speech-bubble--reply lp-demo-transcript" lang={targetLanguage} dir="ltr" aria-live="off">
        {showSample ? sample[1] : session.learnerText || words.emptyLearner}
      </div>
      <div className="lp-demo-controls">
        <button type="button" onClick={active ? () => controllerRef.current?.stop() : start}>
          {active ? <Square size={14} /> : <Mic size={15} />}
          {active ? session.status === "connecting" ? words.cancel : words.stop
            : session.status === "idle" ? words.start : words.retry}
        </button>
      </div>
      {statusText && <p className="lp-demo-status" role={session.status === "error" ? "alert" : "status"}>{statusText}</p>}
    </div>
  );
}
