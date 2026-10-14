import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Backpack, BookOpen, Check, ChevronRight,
  Compass, Expand, Flower2, Leaf, MapPin, Minimize, MousePointer2,
  RotateCcw, Settings2, Sparkles, Sun, X,
} from "lucide-react";
import { BERRIES, LANDMARKS, SPAWN, questDescription } from "./gameData.js";
import { createGamerWorld } from "./world.js";
import { VILLAGE_CAST } from "./cast.js";
import npcSpriteSheet from "../../sprites/NPC_sprites.png";
import tutorSpriteSheet from "../../sprites/tutor/main_character_tutor_transparent.webp";
import "./gamer.css";

function Portrait({ hana = false }) {
  return (
    <svg viewBox="0 0 80 86" fill="none" aria-hidden="true">
      <path d="M9 86C9 64 22 57 40 57S71 66 72 86" fill={hana ? "#567a60" : "#bb5946"} />
      <path d="M28 61L40 79L52 61" fill="#fff0cb" />
      <path d="M25 37C21 17 28 9 42 9C61 9 67 26 60 49L53 65L27 63Z" fill={hana ? "#c39757" : "#603a30"} />
      <path d="M29 32C28 22 54 19 56 34L54 50C52 61 44 66 40 66C34 66 26 57 26 48L25 37Z" fill="#f5cba1" />
      <path d="M22 37L17 27L23 25L20 16L29 17L29 8L37 12L43 4L46 12L55 7L55 17L63 16L61 30L54 40L51 25L43 31L42 22L30 36L30 28Z" fill={hana ? "#d6b16e" : "#603a30"} />
      <path d="M29 43C31 38 37 39 38 44L36 51L30 50Z M43 44C44 39 50 38 52 43L51 50L45 51Z" fill="#fffaf0" />
      <ellipse cx="34" cy="45.5" rx="2.6" ry="4.5" fill="#577e80" />
      <ellipse cx="47.4" cy="45.5" rx="2.6" ry="4.5" fill="#577e80" />
      <path d="M29 39L37 38M44 38L51 39" stroke="#603a30" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M37 57Q41 59 45 56" stroke="#b77865" strokeWidth="1.4" strokeLinecap="round" />
      {!hana && <path d="M24 63L37 67L56 62L57 69L43 75L25 71Z" fill="#dc7655" />}
      {hana && <><path d="M23 29L17 19L27 20L32 30Z" fill="#567a60" /><circle cx="25" cy="26" r="4" fill="#f5daa0" /></>}
    </svg>
  );
}

function MiniMap({ snapshot, collected, stage }) {
  const mapX = (x) => 60 + x * 1.65;
  const mapY = (z) => 63 + z * 1.65;
  const hana = snapshot.hana || LANDMARKS[0];
  return (
    <div className="gamer-minimap" aria-label="Village map. The gold diamond marks Hana, and gold dots mark sunberries.">
      <span className="gamer-map-north">N</span>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs><clipPath id="gamer-map-clip"><circle cx="60" cy="60" r="54" /></clipPath></defs>
        <g clipPath="url(#gamer-map-clip)">
          <circle cx="60" cy="60" r="55" fill="#8d9e78" />
          <path d="M80 0Q94 30 82 57T90 120" stroke="#b7cfbf" strokeWidth="8" fill="none" />
          <path d="M63 116Q52 90 60 61T61 5M34 78Q44 59 61 60L105 58" stroke="#d9cba6" strokeWidth="5" fill="none" />
          <ellipse cx="58" cy="60" rx="13" ry="11" fill="#d9cba6" />
          <path d="M36 42L43 37L51 42V53H36Z" fill="#a56d50" />
          <path d="M56 23L65 17L75 23V35H56Z" fill="#507a77" />
          <path d="M30 70L38 65L45 70V81H30Z" fill="#a56d50" />
          {[[-8, 13], [9, 14], [-17, -2], [21, 7], [-17, -15], [9, -19], [-7, -23], [22, -16], [-17, 16]].map(([x, z], i) => (
            <circle key={i} cx={mapX(x)} cy={mapY(z)} r="5" fill="#587650" opacity=".85" />
          ))}
          <path d="M75 57H91" stroke="#90774e" strokeWidth="4" />
          {stage !== "complete" && <rect x={mapX(hana.x) - 2.6} y={mapY(hana.z) - 2.6} width="5.2" height="5.2" fill="#ffe3a3" transform={`rotate(45 ${mapX(hana.x)} ${mapY(hana.z)})`} />}
          {stage === "gather" && BERRIES.filter((berry) => !collected.includes(berry.id)).map((berry) => <circle key={berry.id} cx={mapX(berry.x)} cy={mapY(berry.z)} r="2.5" fill="#ffe3a3" />)}
          <g transform={`translate(${mapX(snapshot.x)} ${mapY(snapshot.z)}) rotate(${-snapshot.heading * 180 / Math.PI + 180})`}>
            <circle r="6" fill="#fff9df" opacity=".2" />
            <path d="M0 -5L3.5 4L0 2.7L-3.5 4Z" fill="#fff9e8" stroke="#4e6558" strokeWidth=".7" />
          </g>
        </g>
        <circle cx="60" cy="60" r="54" fill="none" stroke="#eee4c5" strokeWidth="1" opacity=".7" />
      </svg>
      <span className="gamer-map-caption">ASTERFALL</span>
    </div>
  );
}

function Modal({ title, eyebrow, onClose, children, className = "" }) {
  const contentRef = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = contentRef.current;
    dialog?.querySelector("button")?.focus();
    function handleKey(event) {
      if (event.code === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const items = dialog.querySelectorAll("button:not(:disabled), a, input, select, [tabindex='0']");
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div className={`gamer-modal-backdrop ${className}`} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={contentRef} role="dialog" aria-modal="true" aria-labelledby="gamer-modal-title" className="gamer-modal">
        <div className="gamer-modal-header">
          <div><span className="gamer-eyebrow">{eyebrow}</span><h2 id="gamer-modal-title">{title}</h2></div>
          <button className="gamer-icon-button" onClick={onClose} aria-label="Close panel"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function TouchJoystick({ engineRef }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerRef = useRef(null);
  const update = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / 34;
    let y = (event.clientY - rect.top - rect.height / 2) / 34;
    const distance = Math.max(1, Math.hypot(x, y));
    x /= distance;
    y /= distance;
    setKnob({ x: x * 26, y: y * 26 });
    engineRef.current?.setTouchInput(x, y);
  };
  const release = () => {
    pointerRef.current = null;
    setKnob({ x: 0, y: 0 });
    engineRef.current?.setTouchInput(0, 0);
  };
  return (
    <div className="gamer-joystick" role="group" aria-label="Touch movement control"
      onPointerDown={(event) => { pointerRef.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
      onPointerMove={(event) => { if (pointerRef.current === event.pointerId) update(event); }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      <span className="gamer-joystick-track" /><span className="gamer-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}><Compass size={22} /></span>
    </div>
  );
}

export default function Gamer() {
  const hostRef = useRef(null);
  const pageRef = useRef(null);
  const engineRef = useRef(null);
  const interactRef = useRef(null);
  const toastTimer = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState({ ...SPAWN, heading: 0, yaw: 0, target: null, marker: null, hanaDistance: 10 });
  const [stage, setStage] = useState("meet");
  const [collected, setCollected] = useState([]);
  const [dialogue, setDialogue] = useState(null);
  const [panel, setPanel] = useState(null);
  const [translation, setTranslation] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [quality, setQuality] = useState("high");
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const worldStateRef = useRef({ collected, quality, reducedMotion });
  const count = collected.length;
  const quest = questDescription(stage, count);
  const showToast = useCallback((message, detail) => {
    clearTimeout(toastTimer.current);
    setToast({ message, detail });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  const closeOverlay = useCallback(() => {
    setDialogue(null);
    setPanel(null);
    setFeedback("");
    setTranslation(false);
    // Restore world keyboard control after closing a panel opened by a button.
    requestAnimationFrame(() => hostRef.current?.querySelector("canvas")?.focus({ preventScroll: true }));
  }, []);

  const handleInteract = useCallback((target) => {
    setTranslation(false);
    setFeedback("");
    if (target.id === "hana") {
      setDialogue({ type: stage === "meet" ? "greeting" : stage === "complete" ? "after" : count === 3 ? "delivery" : "reminder", name: "Hana", role: "VILLAGE BOTANIST" });
    } else if (target.kind === "berry") {
      if (stage === "meet") { showToast("A sunberry bush", "Hana might have a use for these. Say hello first."); return; }
      if (stage === "complete" || collected.includes(target.id)) return;
      setCollected((previous) => previous.includes(target.id) ? previous : [...previous, target.id]);
      showToast("Sunberries collected", count === 2 ? "Your basket is full. Return to Hana." : `${count + 1} of 3 · A little kindness`);
    } else if (target.id === "milo") {
      setDialogue({ type: "milo", name: "Milo", role: "VILLAGE RESIDENT" });
    } else {
      setDialogue({ type: target.id, name: target.name, role: "A MOMENT OF DISCOVERY" });
    }
  }, [stage, count, collected, showToast]);

  useEffect(() => { interactRef.current = handleInteract; }, [handleInteract]);
  useEffect(() => { worldStateRef.current = { collected, quality, reducedMotion }; }, [collected, quality, reducedMotion]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Asterfall · Piyali Worlds";
    let world;
    let cancelled = false;
    createGamerWorld(hostRef.current, {
        onReady: () => setReady(true),
        onUpdate: setSnapshot,
        onInteract: (target) => interactRef.current?.(target),
        onError: setError,
      }).then((createdWorld) => {
        if (cancelled) { createdWorld.dispose(); return; }
        world = createdWorld;
        engineRef.current = world;
        world.setCollected(worldStateRef.current.collected);
        world.setQuality(worldStateRef.current.quality);
        world.setReducedMotion(worldStateRef.current.reducedMotion);
      }).catch((caught) => {
      if (cancelled) return;
      console.error("Unable to create the Asterfall demo", caught);
      setError("The village couldn’t finish loading. Check that WebGL is available, then try again.");
    });
    return () => {
      cancelled = true;
      world?.dispose();
      engineRef.current = null;
      clearTimeout(toastTimer.current);
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => { engineRef.current?.setPaused(!!dialogue || !!panel || !!error); }, [dialogue, panel, error]);
  useEffect(() => { engineRef.current?.setCollected(collected); }, [collected]);
  useEffect(() => { engineRef.current?.setQuality(quality); }, [quality]);
  useEffect(() => { engineRef.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === pageRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat || event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [role='dialog']")) return;
      if (event.code === "KeyJ" || event.code === "KeyI") {
        event.preventDefault();
        setPanel((current) => current ? null : event.code === "KeyJ" ? "journal" : "inventory");
      }
      if (event.code === "Escape" && !dialogue) closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogue, closeOverlay]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (pageRef.current?.requestFullscreen) await pageRef.current.requestFullscreen();
      else showToast("Already filling your screen", "This browser doesn’t support the fullscreen control.");
    } catch { showToast("Fullscreen unavailable", "You can keep exploring in this window."); }
  };
  const chooseGreeting = (correct) => {
    if (!correct) { setFeedback("That means “I’d like a sword.” Try a friendly greeting."); return; }
    setStage("gather");
    setFeedback("");
    setDialogue({ type: "request", name: "Hana", role: "VILLAGE BOTANIST" });
  };
  const deliver = () => {
    setStage("complete");
    setDialogue({ type: "success", name: "Hana", role: "VILLAGE BOTANIST" });
    showToast("A little kindness · complete", "+25 demo XP · A new friend in Asterfall");
  };
  const lines = {
    greeting: { es: "¡Hola! No te había visto por aquí. ¿Cómo estás?", en: "Hello! I haven’t seen you around here before. How are you?" },
    request: { es: "¡Qué bien! Soy Hana. ¿Puedes traerme tres bayas del río? Son para mi jardín.", en: "Lovely! I’m Hana. Can you bring me three berries from the river? They’re for my garden." },
    reminder: { es: "Las bayas crecen junto al río. Cruza el puente y encontrarás más.", en: "The berries grow beside the river. Cross the bridge and you’ll find more." },
    delivery: { es: "¡Has vuelto! ¿Tienes las tres bayas?", en: "You’re back! Do you have the three berries?" },
    success: { es: "¡Muchas gracias! Qué bonitas son. Siempre tendrás una amiga en Asterfall.", en: "Thank you so much! They’re beautiful. You’ll always have a friend in Asterfall." },
    after: { es: "¡Hola de nuevo! El jardín está precioso gracias a ti.", en: "Hello again! The garden looks beautiful thanks to you." },
    milo: { es: "Aquí la vida es tranquila. Me gusta escuchar el río por la mañana.", en: "Life is peaceful here. I like listening to the river in the morning." },
    sign: { es: "Bienvenido a Asterfall. Sigue el camino. Encuentra tu historia.", en: "Welcome to Asterfall. Follow the path. Find your story." },
    well: { es: "El agua está fresca. Una pequeña moneda brilla en el fondo.", en: "The water is cool. A little coin shines at the bottom." },
  };
  const line = dialogue ? lines[dialogue.type] : null;
  const markerItem = snapshot.target || LANDMARKS[0];
  const showMarker = ready && !panel && !dialogue && snapshot.marker?.visible && (snapshot.target || stage === "meet" || stage === "gather" && count === 3);

  return (
    <main className={`gamer-page gamer-art-study ${dialogue || panel ? "gamer-overlay-open" : ""}`} ref={pageRef}>
      <div className="gamer-world" ref={hostRef} data-player-x={snapshot.x.toFixed(2)} data-player-z={snapshot.z.toFixed(2)} data-quest-stage={stage} data-collected={count} data-player-motion={JSON.stringify(snapshot.motion || null)} data-villagers={JSON.stringify(snapshot.villagers || [])} />
      <div className="gamer-vignette" aria-hidden="true" />

      <header className="gamer-topbar">
        <Link to="/" className="gamer-brand" aria-label="Back to Piyali"><span className="gamer-brand-symbol"><Leaf size={21} strokeWidth={1.6} /></span><span>piyali<span className="gamer-brand-divider">/</span><span className="gamer-brand-worlds">worlds</span></span></Link>
        <span className="gamer-demo-tag"><span />AN ART STUDY</span>
        <nav className="gamer-toolbar" aria-label="Game controls">
          <button className={`gamer-icon-button ${panel === "journal" ? "is-active" : ""}`} onClick={() => setPanel("journal")} aria-label="Quest journal (J)" title="Quest journal · J"><BookOpen size={19} /></button>
          <button className={`gamer-icon-button ${panel === "inventory" ? "is-active" : ""}`} onClick={() => setPanel("inventory")} aria-label="Inventory (I)" title="Inventory · I"><Backpack size={19} /><span className="gamer-inventory-dot" hidden={count === 0 || stage === "complete"} /></button>
          <span className="gamer-toolbar-divider" />
          <button className="gamer-icon-button" onClick={() => setPanel("settings")} aria-label="Settings" title="Settings"><Settings2 size={19} /></button>
          <button className="gamer-icon-button gamer-fullscreen-button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen">{fullscreen ? <Minimize size={18} /> : <Expand size={18} />}</button>
        </nav>
      </header>

      <div className="gamer-location">
        <div className="gamer-eyebrow"><span className="gamer-little-line" />THE VERDANT COAST · STUDY 01</div>
        <h1>Asterfall<span>.</span></h1>
        <p>A village beneath the leaves.</p>
      </div>

      <button className={`gamer-quest-card ${stage === "complete" ? "is-complete" : ""}`} onClick={() => setPanel("journal")} aria-label={`Open quest journal: ${quest.task}`}>
        <span className="gamer-quest-heading"><span className="gamer-quest-diamond">{stage === "complete" ? <Check size={14} /> : <span />}</span><span>{stage === "complete" ? "A MOMENT WELL SPENT" : "YOUR NEXT CHAPTER"}</span><ChevronRight size={13} /></span>
        <strong>{quest.title}</strong>
        <span className="gamer-quest-description">{quest.task}</span>
        <span className="gamer-quest-footer"><span>{quest.label}</span>{stage === "gather" && count < 3 ? <span className="gamer-berry-dots">{[0, 1, 2].map((i) => <i key={i} className={i < count ? "is-filled" : ""} />)}</span> : <span className="gamer-quest-distance">{stage === "complete" ? <Check size={12} /> : `${Math.round(snapshot.hanaDistance)} m`}</span>}</span>
      </button>

      <aside className="gamer-map-wrap"><MiniMap snapshot={snapshot} collected={collected} stage={stage} /><div className="gamer-map-weather"><Sun size={12} /><span>Clear skies</span><span className="gamer-weather-dot" /></div></aside>

      {showMarker && <div className={`gamer-world-marker ${snapshot.target ? "is-near" : ""}`} style={{ left: `${snapshot.marker.x}%`, top: `${snapshot.marker.y}%` }}>
        <span className="gamer-marker-diamond">{markerItem.kind === "berry" ? <Flower2 size={13} /> : markerItem.kind === "object" ? <Sparkles size={13} /> : <span>!</span>}</span>
        <span className="gamer-marker-name">{markerItem.name}</span>
        {snapshot.target && <button onClick={() => engineRef.current?.interact()} className="gamer-marker-action"><kbd>E</kbd>{markerItem.kind === "npc" ? "Talk" : markerItem.kind === "berry" ? "Gather" : "Examine"}</button>}
      </div>}

      {toast && <div className="gamer-toast" role="status"><span><Leaf size={20} /></span><div><strong>{toast.message}</strong><p>{toast.detail}</p></div></div>}

      {!panel && !dialogue && <>
        <aside className="gamer-cast-study" aria-label="Existing sprite characters reimagined in 3D">
          <span className="gamer-eyebrow">FAMILIAR FACES, A NEW DIMENSION</span>
          <div>{VILLAGE_CAST.map((person) => <div className="gamer-cast-reference" key={person.id}>
            <span className={`gamer-cast-sprite ${person.id === "yachiru" ? "is-tutor" : ""}`} style={{ backgroundImage: `url(${person.id === "yachiru" ? tutorSpriteSheet : npcSpriteSheet})`, backgroundPosition: `0% ${person.spriteRow === null ? 0 : person.spriteRow / 3 * 100}%` }} aria-hidden="true" />
            <span>{person.name}</span>
          </div>)}</div>
        </aside>
        {(snapshot.castMarkers || []).filter((person) => person.visible).map((person) => <div className="gamer-cast-label" key={person.id} style={{ left: `${person.x}%`, top: `${person.y}%` }}><span>{person.name}</span><i /></div>)}
      </>}

      <footer className="gamer-bottom-bar">
        <div className="gamer-player-card"><span className="gamer-player-portrait"><Portrait /></span><div><span className="gamer-player-name">The wanderer <span>LV. 01</span></span><span className="gamer-player-subtitle">{stage === "complete" ? "A friend of Asterfall" : "Every word, a new world."}</span><span className="gamer-xp-track"><span style={{ width: stage === "complete" ? "55%" : "30%" }} /></span></div></div>
        <div className="gamer-desktop-controls"><span><span className="gamer-key-cluster"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>Move</span><span><kbd>SHIFT</kbd>Sprint</span><span><MousePointer2 size={15} />Drag to look</span><span><kbd>E</kbd>Interact</span></div>
        <button className="gamer-reset-camera" onClick={() => engineRef.current?.resetCamera()} title="Reset camera · C"><RotateCcw size={14} /><span>Recenter</span><kbd>C</kbd></button>
      </footer>
      <div className="gamer-map-note"><MapPin size={11} /><span>One small village. A world of possibilities.</span><span className="gamer-map-note-rule" /><span>01 / 01</span></div>

      {!panel && !dialogue && <div className="gamer-touch-controls"><TouchJoystick engineRef={engineRef} /><div className="gamer-touch-actions"><button className="gamer-touch-sprint" aria-label="Hold to sprint" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); engineRef.current?.setSprint(true); }} onPointerUp={() => engineRef.current?.setSprint(false)} onPointerCancel={() => engineRef.current?.setSprint(false)} onLostPointerCapture={() => engineRef.current?.setSprint(false)}>Sprint</button><button className="gamer-touch-interact" disabled={!snapshot.target} onClick={() => engineRef.current?.interact()} aria-label={snapshot.target ? `Interact with ${snapshot.target.name}` : "Move closer to interact"}>{snapshot.target?.kind === "berry" ? <Flower2 size={23} /> : <Sparkles size={23} />}<span>{snapshot.target?.kind === "berry" ? "Gather" : snapshot.target?.kind === "object" ? "Examine" : "Talk"}</span></button></div></div>}

      {(!ready || error) && <div className="gamer-loading" role="status"><span className="gamer-loading-icon"><Leaf size={32} /></span><span className="gamer-eyebrow">PIYALI WORLDS</span><h2>{error ? "A little pause in the journey." : "Somewhere, a story is waiting."}</h2><p>{error || "Finding a quiet corner of the world…"}</p>{error && <button className="gamer-primary-button" onClick={() => window.location.reload()}>Try again <RotateCcw size={15} /></button>}</div>}

      {dialogue && line && <Modal title={dialogue.name} eyebrow={dialogue.role} onClose={closeOverlay} className="gamer-dialogue-backdrop">
        <div className="gamer-dialogue-content">
          <div className={`gamer-dialogue-portrait ${dialogue.name !== "Hana" ? "is-object" : ""}`}>{dialogue.name === "Hana" ? <Portrait hana /> : dialogue.type === "milo" ? <Portrait /> : dialogue.type === "well" ? <Sparkles size={38} /> : <MapPin size={38} />}</div>
          <div className="gamer-dialogue-lines"><span className="gamer-language-tag">ESPAÑOL <span>·</span> A SMALL CONVERSATION</span><p className="gamer-dialogue-spanish">{line.es}</p><button className="gamer-translation-button" aria-expanded={translation} onClick={() => setTranslation(!translation)}><BookOpen size={12} />{translation ? "Hide translation" : "Show translation"}</button>{translation && <p className="gamer-dialogue-translation">{line.en}</p>}</div>
        </div>
        {dialogue.type === "greeting" ? <div className="gamer-dialogue-choices"><span className="gamer-eyebrow">GREET HANA</span><button onClick={() => chooseGreeting(true)}><span><strong>¡Hola! Estoy bien, gracias.</strong><small>Hello! I’m well, thank you.</small></span><ArrowRight size={18} /></button><button onClick={() => chooseGreeting(false)}><span><strong>Quiero una espada.</strong><small>I’d like a sword.</small></span><ArrowRight size={18} /></button>{feedback && <p className="gamer-dialogue-feedback" role="status">{feedback}</p>}</div>
          : dialogue.type === "delivery" ? <button className="gamer-primary-button" onClick={deliver}>Aquí tienes las bayas. <ArrowRight size={17} /></button>
          : <div className="gamer-dialogue-footer">{dialogue.type === "success" ? <span className="gamer-dialogue-reward"><Sparkles size={15} /> QUEST COMPLETE <strong>+25 XP</strong></span> : dialogue.type === "request" ? <span className="gamer-dialogue-reward"><Flower2 size={16} /> Collect 3 sunberries <strong>0 / 3</strong></span> : <span className="gamer-dialogue-reward"><Leaf size={15} /> Asterfall village</span>}<button className="gamer-primary-button" onClick={closeOverlay}>{dialogue.type === "request" ? "I’ll find them" : dialogue.type === "success" ? "Keep exploring" : "Continue"}<ArrowRight size={16} /></button></div>}
      </Modal>}

      {panel === "journal" && <Modal title="A little kindness" eyebrow="YOUR JOURNAL · CHAPTER 01" onClose={closeOverlay}>
        <p className="gamer-panel-intro">A new face, a quiet village, and a small favor. Sometimes that’s how the best journeys begin.</p>
        <div className="gamer-journal-steps">{[
          { done: stage !== "meet", active: stage === "meet", title: "A friendly hello", text: "Meet Hana in the village square." },
          { done: count === 3, active: stage === "gather" && count < 3, title: "A handful of sunshine", text: `Gather sunberries by the river. ${count} / 3 collected.` },
          { done: stage === "complete", active: stage === "gather" && count === 3, title: "A small act of kindness", text: "Return to Hana with the berries." },
        ].map((step, i) => <div className={`gamer-journal-step ${step.done ? "is-done" : step.active ? "is-current" : ""}`} key={step.title}><span className="gamer-step-number">{step.done ? <Check size={16} /> : `0${i + 1}`}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></div>)}</div>
        <div className="gamer-journal-reward"><Sparkles size={18} /><span>REWARD</span><strong>25 demo XP</strong><span>+ a new friend</span></div>
        <p className="gamer-panel-footnote">This is a standalone demo. Quest progress lasts for this visit.</p>
        <button className="gamer-primary-button" onClick={closeOverlay}>Back to the village <ArrowRight size={16} /></button>
      </Modal>}

      {panel === "inventory" && <Modal title="A wanderer’s satchel" eyebrow="YOUR INVENTORY" onClose={closeOverlay}>
        <p className="gamer-panel-intro">A little room for the things you find along the way.</p>
        <div className="gamer-inventory-item"><span className="gamer-item-art"><Flower2 size={38} strokeWidth={1.4} /></span><div><strong>Sunberries</strong><span>bayas del sol</span><p>{stage === "complete" ? "Delivered with kindness. Hana’s garden will thank you." : "Golden berries that grow beside the river. Picked for Hana’s garden."}</p></div><span className="gamer-item-count">{stage === "complete" ? 0 : count}<small>/ 3</small></span></div>
        <div className="gamer-inventory-item gamer-inventory-keepsake"><span className="gamer-item-art"><Compass size={33} strokeWidth={1.3} /></span><div><strong>A well-worn compass</strong><span>una brújula</span><p>For the days when the path is still a question.</p></div><span className="gamer-keepsake-label">KEEPSAKE</span></div>
        <button className="gamer-primary-button" onClick={closeOverlay}>Keep wandering <ArrowRight size={16} /></button>
      </Modal>}

      {panel === "settings" && <Modal title="Make yourself at home" eyebrow="WORLD SETTINGS" onClose={closeOverlay}>
        <div className="gamer-setting-row"><div><strong>World detail</strong><p>Shadows and rendering resolution.</p></div><div className="gamer-segmented"><button aria-pressed={quality === "low"} onClick={() => setQuality("low")}>Lighter</button><button aria-pressed={quality === "high"} onClick={() => setQuality("high")}>Full</button></div></div>
        <div className="gamer-setting-row"><div><strong>Gentle motion</strong><p>Reduce camera easing and ambient movement.</p></div><button className="gamer-switch" role="switch" aria-label="Gentle motion" aria-checked={reducedMotion} onClick={() => setReducedMotion(!reducedMotion)}><span /></button></div>
        <div className="gamer-settings-controls"><span className="gamer-eyebrow">A FEW WAYS TO WANDER</span><p><kbd>W A S D</kbd> or <kbd>↑ ← ↓ →</kbd> Walk around</p><p><kbd>SHIFT</kbd> Run a little faster</p><p><kbd>E</kbd> or <kbd>SPACE</kbd> Talk, gather, examine</p><p><MousePointer2 size={14} /> Click ground to walk · Drag to look · Scroll to zoom</p><p><kbd>C</kbd> Recenter <kbd>J</kbd> Journal <kbd>I</kbd> Inventory</p><p className="gamer-touch-help">On touchscreens, use the movement stick and drag the world to turn the camera.</p></div>
        <button className="gamer-primary-button" onClick={closeOverlay}>Back to the village <ArrowRight size={16} /></button>
      </Modal>}
      <Link to="/" className="gamer-accessible-exit"><ArrowLeft size={14} /> Leave village</Link>
    </main>
  );
}
