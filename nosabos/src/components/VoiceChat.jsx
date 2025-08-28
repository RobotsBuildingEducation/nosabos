// VoiceChat.jsx — Trilingual + Audio Cache + Robust Mobile Audio + Live Firestore Turns
import React, { useRef, useState, useEffect } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  HStack,
  Stack,
  IconButton,
  Progress,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useDisclosure,
  useToast,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { CiRepeat, CiUser, CiSquarePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { IoIosMore } from "react-icons/io";

import { LuBadgeCheck } from "react-icons/lu";
import { GoDownload } from "react-icons/go";
import { FaStop } from "react-icons/fa";

import {
  doc,
  setDoc,
  getDoc,
  getDocFromCache,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  // enableIndexedDbPersistence,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import RobotBuddyPro from "./RobotBuddyPro";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import useUserStore from "../hooks/useUserStore";

/* Endpoints */
export const TALKTURN_URL = "https://talkturn-hftgya63qa-uc.a.run.app";
export const TTS_URL = "https://tts-hftgya63qa-uc.a.run.app";

/* ---------------------------
    Utils: base64/PCM/WAV
  --------------------------- */
function b64ToUint8(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function pcm16ToWav(pcmUint8, sampleRate = 24000, channels = 1) {
  const blockAlign = channels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmUint8.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (o, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmUint8);
  return new Blob([buffer], { type: "audio/wav" });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/* ---------------------------
    Transcoding: robust on mobile
  --------------------------- */
async function blobToWavBase64Universal(blob, targetRate = 24000) {
  const arrayBuf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const decoded = await new Promise((resolve, reject) => {
    ctx.decodeAudioData(arrayBuf.slice(0), resolve, reject);
  });

  const channels = 1;
  const frames = Math.ceil(decoded.duration * targetRate);
  const offline = new OfflineAudioContext(channels, frames, targetRate);

  // average to mono
  const monoSrc = offline.createBuffer(1, decoded.length, decoded.sampleRate);
  const out = monoSrc.getChannelData(0);
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const ch = decoded.getChannelData(c);
    for (let i = 0; i < out.length; i++)
      out[i] += ch[i] / decoded.numberOfChannels;
  }
  const src = offline.createBufferSource();
  src.buffer = monoSrc;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();

  // Float32 -> PCM16
  const f32 = rendered.getChannelData(0);
  const pcm16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const u8 = new Uint8Array(pcm16.buffer);
  const wavBlob = pcm16ToWav(u8, rendered.sampleRate, 1);

  try {
    await ctx.close();
  } catch {}
  const b64 = await blobToBase64(wavBlob);
  return { b64, mime: "audio/wav", wavBlob };
}

// Use WAV if possible; otherwise send original blob/mime
async function safeTranscodeToWavOrPassThrough(blob) {
  try {
    return await blobToWavBase64Universal(blob);
  } catch {
    const b64 = await blobToBase64(blob);
    const mime = (blob.type || "application/octet-stream").split(";")[0];
    return { b64, mime, wavBlob: null };
  }
}

// Pick a MediaRecorder MIME that the browser supports
function pickRecorderMime() {
  const m = window.MediaRecorder;
  if (!m) return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/3gpp",
  ];
  for (const t of candidates) {
    try {
      if (m.isTypeSupported?.(t)) return t;
    } catch {}
  }
  return "";
}

/* ---------------------------
    Audio cache (IndexedDB)
  --------------------------- */
const CLIP_DB = "NoSaboAudioDB";
const CLIP_STORE = "clips";
const memClips = new Map();

function openClipDB() {
  return new Promise((resolve) => {
    if (!("indexedDB" in window)) return resolve(null);
    const req = indexedDB.open(CLIP_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CLIP_STORE))
        db.createObjectStore(CLIP_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
async function saveClipBlob(key, blob) {
  if (!key || !blob) return;
  const db = await openClipDB();
  if (!db) {
    memClips.set(key, blob);
    return;
  }
  await new Promise((resolve) => {
    const tx = db.transaction(CLIP_STORE, "readwrite");
    tx.objectStore(CLIP_STORE).put(blob, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      memClips.set(key, blob);
      resolve();
    };
  });
}
async function loadClipBlob(key) {
  if (!key) return null;
  const db = await openClipDB();
  if (!db) return memClips.get(key) || null;
  return await new Promise((resolve) => {
    const tx = db.transaction(CLIP_STORE, "readonly");
    const req = tx.objectStore(CLIP_STORE).get(key);
    req.onsuccess = () => {
      const blob = req.result || null;
      db.close();
      resolve(blob);
    };
    req.onerror = () => {
      db.close();
      resolve(memClips.get(key) || null);
    };
  });
}
async function sha256Hex(str) {
  try {
    if (crypto?.subtle) {
      const buf = new TextEncoder().encode(str || "");
      const digest = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {}
  let h = 5381;
  for (let i = 0; i < (str || "").length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0");
}

/* ---------------------------
    Shared mobile-safe text style
  --------------------------- */
const MOBILE_TEXT_SX = {
  whiteSpace: "pre-wrap",
  // prefer soft word breaks; avoid per-character "anywhere" breaks
  wordBreak: "break-word",
  overflowWrap: "break-word",
  hyphens: "auto",
};

/* ---------------------------
    Phrase-aligned highlighting
  --------------------------- */
const COLORS = [
  "#91E0FF",
  "#A0EBAF",
  "#FFD48A",
  "#C6B7FF",
  "#FF9FB1",
  "#B0F0FF",
];
const colorFor = (i) => COLORS[i % COLORS.length];

function wrapFirst(text, phrase, tokenId) {
  if (!text || !phrase) return [text];
  const idx = text.toLowerCase().indexOf(String(phrase).toLowerCase());
  if (idx < 0) return [text];
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + phrase.length);
  const after = text.slice(idx + phrase.length);
  return [
    before,
    <span
      key={`${tokenId}-${idx}`}
      data-token={tokenId}
      style={{
        display: "inline",
        borderBottom: 0,
        // visual underline without affecting line metrics
        boxShadow: "inset 0 -2px transparent",
      }}
    >
      {mid}
    </span>,
    ...wrapFirst(after, phrase, tokenId + "_cont"),
  ];
}
function buildAlignedNodes(text, pairs, side /* 'lhs' | 'rhs' */) {
  if (!pairs?.length || !text) return [text];
  const sorted = [...pairs].sort(
    (a, b) => (b?.[side]?.length || 0) - (a?.[side]?.length || 0)
  );
  let nodes = [text];
  sorted.forEach((pair, i) => {
    const phrase = pair?.[side];
    if (!phrase) return;
    const tokenId = `tok_${i}`;
    const next = [];
    nodes.forEach((node) => {
      if (typeof node === "string")
        next.push(...wrapFirst(node, phrase, tokenId));
      else next.push(node);
    });
    nodes = next;
  });
  return nodes;
}
function AlignedBubble({
  primaryLabel,
  secondaryLabel,
  primaryText,
  secondaryText,
  pairs,
  showSecondary,
  onReplay,
  canReplay,
}) {
  const [activeId, setActiveId] = useState(null);

  function decorate(nodes) {
    return React.Children.map(nodes, (node) => {
      if (typeof node === "string" || !node?.props?.["data-token"]) return node;
      const rootId = node.props["data-token"].split("_")[0];
      const i = parseInt(rootId.replace("tok_", "")) || 0;
      const isActive = activeId === rootId;
      const style = {
        boxShadow: isActive
          ? `inset 0 -2px ${colorFor(i)}`
          : "inset 0 -2px transparent",
      };
      return React.cloneElement(node, {
        onMouseEnter: () => setActiveId(rootId),
        onMouseLeave: () => setActiveId(null),
        onClick: () => setActiveId(isActive ? null : rootId),
        style: { ...(node.props.style || {}), ...style },
      });
    });
  }

  const primaryNodes = decorate(buildAlignedNodes(primaryText, pairs, "lhs"));
  const secondaryNodes = decorate(
    buildAlignedNodes(secondaryText, pairs, "rhs")
  );

  return (
    <Box
      bg="gray.800"
      p={3}
      borderRadius="lg"
      maxW="100%"
      w="100%"
      minW={0}
      overflow="hidden"
    >
      {/* Header stacks on small/medium; row on large+ */}
      <Stack
        direction={["column", "column", "row"]}
        spacing={2}
        mb={1}
        justify="flex-end"
        align={["flex-start", "flex-start", "center"]}
        flexWrap="wrap"
      >
        {/* <HStack spacing={2} flex="1 1 auto" minW={0}>
            <Badge colorScheme="purple" whiteSpace="nowrap">
              {primaryLabel}
            </Badge>
            {showSecondary && secondaryText && (
              <Badge variant="subtle" whiteSpace="nowrap">
                {secondaryLabel}
              </Badge>
            )}
          </HStack> */}
        <Button
          size="xs"
          variant="ghost"
          onClick={onReplay}
          isDisabled={!canReplay}
          color="white"
          alignSelf={["flex-start", "flex-start", "auto"]}
        >
          <CiRepeat />
          &nbsp;Repeat
        </Button>
      </Stack>

      {/* Primary text */}
      <Box as="p" fontSize="md" lineHeight="1.6" sx={MOBILE_TEXT_SX}>
        {primaryNodes}
      </Box>

      {/* Secondary text */}
      {showSecondary && secondaryText && (
        <Box
          as="p"
          opacity={0.9}
          fontSize="sm"
          mt={1}
          lineHeight="1.55"
          sx={MOBILE_TEXT_SX}
        >
          {secondaryNodes}
        </Box>
      )}

      {/* Chips */}
      {!!pairs?.length && showSecondary && (
        <Wrap spacing={2} mt={2} shouldWrapChildren>
          {pairs.slice(0, 6).map((p, i) => (
            <Tag
              key={i}
              size="sm"
              style={{
                borderColor: colorFor(i),
                borderWidth: 2,
                background: "transparent",
                color: "white",
              }}
              maxW="100%"
              whiteSpace="normal"
            >
              <Text as="span" fontSize="xs" sx={MOBILE_TEXT_SX}>
                {p.lhs} ⇄ {p.rhs}
              </Text>
            </Tag>
          ))}
        </Wrap>
      )}
    </Box>
  );
}

/* ---------------------------
    Legacy↔New turn mapping for model context
  --------------------------- */
function newToLegacyTurn(m) {
  if (!m) return null;
  if (m.lang === "es") {
    return {
      es: m.text || "",
      en: m.trans_en || "",
      align: Array.isArray(m.pairs)
        ? m.pairs.map((p) => ({ es: p?.lhs || "", en: p?.rhs || "" }))
        : [],
    };
  }
  const esText = m.trans_es || "";
  const enText = m.trans_en || "";
  if (!esText && !enText) return null;
  return { es: esText || "", en: enText || "", align: [] };
}
function buildLegacyFromNew(arr) {
  const out = [];
  (arr || []).forEach((m) => {
    const leg = newToLegacyTurn(m);
    if (leg) out.push(leg);
  });
  return out;
}
const isoNow = () => {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
};

/* ---------------------------
    Main
  --------------------------- */
export default function VoiceChat({
  auth,
  onSwitchedAccount,
  activeNpub = "",
  activeNsec = "",
}) {
  const toast = useToast();
  const settings = useDisclosure();
  const coachSheet = useDisclosure();
  const account = useDisclosure();
  const install = useDisclosure();

  const DEFAULT_CHALLENGE = {
    es: "Pide algo con cortesía.",
    en: "Make a polite request.",
  };
  const DEFAULT_PERSONA = "Like a rude, sarcastic, mean-spirited toxica.";

  const [profileHydrated, setProfileHydrated] = useState(false);

  const user = useUserStore((s) => s.user);

  // UI & learning state
  const [uiState, setUiState] = useState("idle");
  const [mood, setMood] = useState("neutral");
  const [volume, setVolume] = useState(0);
  const [pauseMs, setPauseMs] = useState(2000);

  const [level, setLevel] = useState("beginner");
  const [supportLang, setSupportLang] = useState("en"); // 'en' | 'bilingual' | 'es'
  const [voice, setVoice] = useState("Leda");
  const [voicePersona, setVoicePersona] = useState(DEFAULT_PERSONA);
  const [targetLang, setTargetLang] = useState(
    user?.progress?.targetLang || "es"
  ); // 'nah' | 'es'

  const [history, setHistory] = useState([]); // live from snapshot
  const [coach, setCoach] = useState(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challenge, setChallenge] = useState(DEFAULT_CHALLENGE);
  const [showTranslations, setShowTranslations] = useState(true);

  // Account UI state
  const [currentId, setCurrentId] = useState(activeNpub || "");
  const [currentSecret, setCurrentSecret] = useState(activeNsec || "");
  const [switchNsec, setSwitchNsec] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  // Audio refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const silenceStartRef = useRef(null);
  const redoRef = useRef("");

  /* Sync creds from parent */
  useEffect(() => {
    setCurrentId(activeNpub || "");
  }, [activeNpub]);

  useEffect(() => {
    if (user?.progress?.targetLang) {
      setTargetLang(user.progress.targetLang);
    }
  }, [user?.progress?.targetLang]);
  useEffect(() => {
    setCurrentSecret(activeNsec || "");
  }, [activeNsec]);

  /* Firestore persistence (ignore errors in Private mode) */
  useEffect(() => {
    // enableIndexedDbPersistence(database).catch(() => {});
  }, []);

  /* Live conversation subscription */
  useEffect(() => {
    const npub = (currentId || "").trim();
    if (!npub) return;
    const colRef = collection(database, "users", npub, "turns");
    const q = query(colRef, orderBy("createdAtClient", "asc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const turns = snap.docs.map((d) => {
          const v = d.data() || {};
          return {
            id: d.id,
            lang: v.lang || "es",
            text: v.text || "",
            trans_en: v.trans_en || "",
            trans_es: v.trans_es || "",
            pairs: Array.isArray(v.pairs) ? v.pairs : [],
            audioKey: v.audioKey || null,
            createdAtClient: v.createdAtClient || 0,
          };
        });
        setHistory(turns);
      },
      (err) => {
        console.error("turns snapshot error:", err?.message || err);
      }
    );
    return () => unsub();
  }, [currentId]);

  /* Auto-save profile (only after Firestore load finishes) */
  useEffect(() => {
    if (!profileHydrated) return;
    saveProfile({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    level,
    supportLang,
    voice,
    voicePersona,
    showTranslations,
    targetLang,
    profileHydrated,
  ]);

  /* Load profile/progress with cache fallback */
  useEffect(() => {
    const npub = (currentId || "").trim();
    if (!npub) return;

    setProfileHydrated(false); // block auto-saves until we finish loading

    let cancelled = false;
    (async () => {
      try {
        const ref = doc(database, "users", npub);
        let snap = await getDoc(ref);
        if (!snap.exists()) {
          try {
            snap = await getDocFromCache(ref);
          } catch {}
        }
        const data = snap.exists() ? snap.data() : null;
        const p = data?.progress || {};
        if (cancelled) return;

        setLevel(p.level || "beginner");
        setSupportLang(
          p.supportLang === "bilingual" || p.supportLang === "es"
            ? p.supportLang
            : "en"
        );
        setVoice(p.voice || "Leda");
        setVoicePersona(p.voicePersona || DEFAULT_PERSONA);
        // Respect saved setting; keep current selection if missing
        if (["nah", "es"].includes(p.targetLang)) {
          setTargetLang(p.targetLang);
        }
        setXp(
          Number.isFinite(data?.xp) ? data.xp : Number.isFinite(p.xp) ? p.xp : 0
        );
        setStreak(
          Number.isFinite(data?.streak)
            ? data.streak
            : Number.isFinite(p.streak)
            ? p.streak
            : 0
        );
        setChallenge(
          p.challenge?.es && p.challenge?.en
            ? p.challenge
            : { ...DEFAULT_CHALLENGE }
        );
        setShowTranslations(
          typeof p.showTranslations === "boolean" ? p.showTranslations : true
        );
      } catch (e) {
        console.error("load profile failed:", e);
      } finally {
        if (!cancelled) setProfileHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  /* Save profile (settings/xp/streak/challenge) */
  async function saveProfile(partial = {}) {
    const npub =
      (currentId || "").trim() ||
      (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "");
    if (!npub) return;
    try {
      await setDoc(
        doc(database, "users", npub),
        {
          local_npub: npub,
          updatedAt: isoNow(),
          xp: partial.xp ?? xp,
          streak: partial.streak ?? streak,
          lastGoal: (partial.challenge ?? challenge)?.en || null,
          progress: {
            level: partial.level ?? level,
            supportLang: partial.supportLang ?? supportLang,
            voice: partial.voice ?? voice,
            voicePersona: partial.voicePersona ?? voicePersona,
            targetLang: partial.targetLang ?? targetLang,
            xp: partial.xp ?? xp,
            streak: partial.streak ?? streak,
            challenge: partial.challenge ?? challenge,
            showTranslations: partial.showTranslations ?? showTranslations,
          },
        },
        { merge: true }
      );
    } catch (e) {
      console.error("save profile failed:", e);
    }
  }

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      try {
        if (rafRef.current) clearTimeout(rafRef.current);
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close().catch(() => {});
        }
        audioCtxRef.current = null;
        audioRef.current?.pause?.();
        stopTracks();
      } catch {}
    };
  }, []);
  function stopTracks() {
    const stream = mediaRecorderRef.current?.stream;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  /* Account helpers */
  async function copy(text, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: label, status: "success", duration: 1400 });
    } catch (e) {
      toast({
        title: "Copy failed",
        description: String(e?.message || e),
        status: "error",
      });
    }
  }
  async function switchAccount() {
    const nsec = (switchNsec || "").trim();
    if (!nsec) {
      toast({ title: "Paste your nsec first", status: "warning" });
      return;
    }
    if (!nsec.startsWith("nsec")) {
      toast({
        title: "Invalid key",
        description: "Must start with nsec…",
        status: "error",
      });
      return;
    }
    setIsSwitching(true);
    try {
      if (typeof auth !== "function")
        throw new Error("auth(nsec) is not available.");
      const res = await auth(nsec);
      const npub = res?.user?.npub || localStorage.getItem("local_npub");
      if (!npub?.startsWith("npub"))
        throw new Error("Could not derive npub from the secret key.");
      await setDoc(
        doc(database, "users", npub),
        { local_npub: npub, createdAt: isoNow() },
        { merge: true }
      );
      localStorage.setItem("local_npub", npub);
      localStorage.setItem("local_nsec", nsec);
      setCurrentId(npub);
      setCurrentSecret(nsec);
      setSwitchNsec("");
      account.onClose?.();
      toast({ title: "Switched account", status: "success" });
      if (typeof onSwitchedAccount === "function")
        await Promise.resolve(onSwitchedAccount(npub));
    } catch (e) {
      console.error("switchAccount error:", e);
      toast({
        title: "Switch failed",
        description: e?.message || String(e),
        status: "error",
      });
    } finally {
      setIsSwitching(false);
    }
  }

  /* Recording */
  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Mic not available",
          description: "getUserMedia not supported.",
          status: "error",
        });
        return;
      }
      try {
        audioRef.current?.pause?.();
        audioRef.current = null;
      } catch {}
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const picked = pickRecorderMime();
      if (!picked) {
        toast({
          title: "Recording not supported",
          description: "No compatible audio format.",
          status: "error",
        });
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType: picked });
      chunksRef.current = [];
      recorder.ondataavailable = (e) =>
        e.data && e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;

      // Meter / auto-stop on silence
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      silenceStartRef.current = null;
      setUiState("listening");
      setMood("encourage");

      const buf = new Uint8Array(analyser.fftSize);
      const THRESHOLD = 0.02,
        MONITOR_HZ = 60;
      function loop() {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setVolume(rms);
        const now = performance.now();
        if (rms < THRESHOLD) {
          if (silenceStartRef.current == null) silenceStartRef.current = now;
          else if (now - silenceStartRef.current >= pauseMs) {
            try {
              mediaRecorderRef.current?.stop();
            } catch {}
            return;
          }
        } else {
          silenceStartRef.current = null;
        }
        rafRef.current = setTimeout(loop, 1000 / MONITOR_HZ);
      }
      loop();
    } catch (e) {
      console.error(e);
      toast({
        title: "Microphone error",
        description: String(e),
        status: "error",
      });
    }
  }
  function stopRecordingNow() {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
  }

  function nextGoalFallback(prevGoal, scores) {
    const sum =
      (scores?.pronunciation ?? 0) +
      (scores?.grammar ?? 0) +
      (scores?.vocab ?? 0) +
      (scores?.fluency ?? 0);
    const easy = sum <= 4;
    const mid = sum <= 8;
    const ladder = [
      {
        es: "Preséntate y di de dónde eres.",
        en: "Introduce yourself and say where you’re from.",
      },
      {
        es: "Haz una petición cortés con 'me gustaría'.",
        en: "Make a polite request using 'me gustaría'.",
      },
      { es: "Añade cantidad y cortesía.", en: "Add quantity plus courtesy." },
      {
        es: "Pregunta por detalles (tamaño/sabor).",
        en: "Ask for details (size/flavor).",
      },
      { es: "Propón una hora para quedar.", en: "Propose a time to meet." },
      {
        es: "Cuenta lo que hiciste ayer (pretérito).",
        en: "Say what you did yesterday (preterite).",
      },
    ];
    if (easy) return ladder[0];
    if (mid) return ladder[2];
    return ladder[Math.floor(Math.random() * ladder.length)];
  }

  /* Handle a turn */
  async function handleStop() {
    try {
      setUiState("thinking");
      setMood("neutral");
      try {
        if (rafRef.current) {
          clearTimeout(rafRef.current);
          rafRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          await audioCtxRef.current.close().catch(() => {});
        }
        audioCtxRef.current = null;
      } catch {}
      stopTracks();

      const blob =
        chunksRef.current.length > 1
          ? new Blob(chunksRef.current, {
              type: mediaRecorderRef.current?.mimeType || "audio/webm",
            })
          : chunksRef.current[0];
      if (!blob) {
        toast({ title: "No audio captured", status: "warning" });
        setUiState("idle");
        return;
      }

      // Normalize to WAV if possible, else pass-through
      const { b64, mime } = await safeTranscodeToWavOrPassThrough(blob);

      // Supply last few turns in legacy shape for the model
      const legacyForModel = buildLegacyFromNew(history).slice(-3);

      const resp = await fetch(TALKTURN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: b64,
          mime,
          history: legacyForModel,
          level,
          supportLang,
          challenge,
          redo: redoRef.current,
          voice,
          voicePersona,
          targetLang,
        }),
      });
      if (!resp.ok) {
        let details = "";
        try {
          details = JSON.stringify(await resp.json());
        } catch {}
        throw new Error(`HTTP ${resp.status}${details ? " " + details : ""}`);
      }
      const data = await resp.json();

      // Extract assistant + coach
      const assistantText = data?.assistant?.text ?? data?.assistant_es ?? "";
      const assistantLang =
        data?.assistant?.lang ?? (data?.assistant_es ? "es" : targetLang);
      const coachObj = data?.coach || {};
      const translation_en = coachObj?.translation_en || "";
      const translation_es = coachObj?.translation_es || "";

      // Alignment normalization
      let pairs = [];
      if (assistantLang === "nah") {
        if (supportLang === "es") {
          const nah_es = coachObj?.alignment?.nah_es || [];
          pairs = nah_es.map((p) => ({ lhs: p?.t || "", rhs: p?.es || "" }));
        } else {
          const nah_en = coachObj?.alignment?.nah_en || [];
          pairs = nah_en.map((p) => ({ lhs: p?.t || "", rhs: p?.en || "" }));
        }
      } else {
        if (Array.isArray(coachObj?.alignment)) {
          pairs = coachObj.alignment.map((p) => ({
            lhs: p?.es || "",
            rhs: p?.en || "",
          }));
        } else {
          const es_en = coachObj?.alignment?.es_en || [];
          pairs = es_en.map((p) => ({ lhs: p?.es || "", rhs: p?.en || "" }));
        }
      }

      // Play TTS audio + cache it
      const audioB64 = data?.audioBase64 || null;
      let audioKeyForTurn = null;
      if (audioB64) {
        const pcm = b64ToUint8(audioB64);
        const wavOut = pcm16ToWav(pcm, 24000, 1);
        audioKeyForTurn = await sha256Hex(
          `${assistantText}||${voice}||${assistantLang}`
        );
        await saveClipBlob(audioKeyForTurn, wavOut);

        const url = URL.createObjectURL(wavOut);
        try {
          audioRef.current?.pause?.();
        } catch {}
        const audio = new Audio(url);
        audioRef.current = audio;
        setUiState("speaking");
        setMood("happy");
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setUiState("idle");
          setMood("neutral");
        };
        await audio.play().catch(() => {
          const unlock = () => {
            audio.play().catch(() => {});
            window.removeEventListener("pointerdown", unlock);
          };
          window.addEventListener("pointerdown", unlock);
        });
      } else {
        setUiState("idle");
        setMood("neutral");
      }

      // Persist this TURN as its own document
      if (assistantText) {
        const npub =
          (currentId || "").trim() || localStorage.getItem("local_npub") || "";
        if (npub) {
          const colRef = collection(database, "users", npub, "turns");
          await addDoc(colRef, {
            lang: assistantLang,
            text: assistantText,
            trans_en: translation_en,
            trans_es: translation_es,
            pairs,
            audioKey: audioKeyForTurn || null,
            createdAt: serverTimestamp(),
            createdAtClient: Date.now(),
          });
          // UI updates via onSnapshot
        }
      }

      // Coach, XP, goals
      let nextChallenge = challenge;
      if (coachObj && Object.keys(coachObj).length) {
        setCoach(coachObj);
        let next = coachObj.next_goal;
        if (!next?.es || !next?.en)
          next = nextGoalFallback(challenge, coachObj.scores);
        nextChallenge = coachObj.goal_completed
          ? next
          : {
              es:
                coachObj[`redo_${targetLang}`] && targetLang === "nah"
                  ? "Inténtalo otra vez, siguiendo la pista de la coach."
                  : coachObj.redo_es || "Inténtalo otra vez en español.",
              en: coachObj.goal_completed ? next.en : "Try that again.",
            };
        setChallenge(nextChallenge);

        const sum =
          (coachObj.scores?.pronunciation ?? 0) +
          (coachObj.scores?.grammar ?? 0) +
          (coachObj.scores?.vocab ?? 0) +
          (coachObj.scores?.fluency ?? 0);
        const gained = 10 + sum + (coachObj.goal_completed ? 5 : 0);
        const nextXp = (xp ?? 0) + gained;
        const nextStreak = (streak ?? 0) + 1;
        setXp(nextXp);
        setStreak(nextStreak);
        await saveProfile({
          xp: nextXp,
          streak: nextStreak,
          challenge: nextChallenge,
        });
      } else {
        setCoach(null);
        nextChallenge = nextGoalFallback(challenge, null);
        setChallenge(nextChallenge);
        await saveProfile({ challenge: nextChallenge });
      }

      redoRef.current = "";
    } catch (e) {
      console.error(e);
      setUiState("idle");
      setMood("neutral");
      toast({
        title: "Conversation failed",
        description: String(e?.message || e),
        status: "error",
      });
    } finally {
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  }

  /* Redo */
  async function handleRedo(redo_text) {
    if (!redo_text) return;
    redoRef.current = redo_text;
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: redo_text, voice }),
      });
      if (!resp.ok) {
        let details = "";
        try {
          details = JSON.stringify(await resp.json());
        } catch {}
        throw new Error(`HTTP ${resp.status}${details ? " " + details : ""}`);
      }
      const { audioBase64 } = await resp.json();
      if (!audioBase64) return;
      const pcm = b64ToUint8(audioBase64);
      const wav = pcm16ToWav(pcm, 24000, 1);
      const url = URL.createObjectURL(wav);
      try {
        audioRef.current?.pause?.();
      } catch {}
      const audio = new Audio(url);
      audioRef.current = audio;
      setUiState("speaking");
      setMood("encourage");
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setUiState("idle");
        setMood("neutral");
      };
      await audio.play().catch(() => {
        const unlock = () => {
          audio.play().catch(() => {});
          window.removeEventListener("pointerdown", unlock);
        };
        window.addEventListener("pointerdown", unlock);
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Redo failed", description: String(e), status: "error" });
    }
  }
  function acceptNextGoal(next_goal) {
    if (!next_goal?.es || !next_goal?.en) return;
    setChallenge(next_goal);
    saveProfile({ challenge: next_goal });
    coachSheet.onClose();
  }

  /* Render */
  const progressPct = Math.min(100, xp % 100);
  const levelLabel =
    level === "beginner"
      ? "Beginner"
      : level === "intermediate"
      ? "Intermediate"
      : "Advanced";
  const levelColor =
    level === "beginner"
      ? "green"
      : level === "intermediate"
      ? "orange"
      : "purple";
  const appTitle =
    targetLang === "nah"
      ? "No Sabo — Náhuatl Learning Coach"
      : "No Sabo — Spanish Learning Coach";
  const secondaryPref = supportLang === "es" ? "es" : "en";

  // --- CoachPanel.jsx (inline in VoiceChat.jsx is fine) ---
  function CoachPanel({
    isOpen,
    onClose,
    coach,
    onRedo,
    onAcceptNext,
    targetLang = "es",
  }) {
    if (!coach) coach = {};
    const {
      correction_en,
      tip_en,
      correction_es,
      tip_es,
      translation_en,
      translation_es,
      scores = {},
      cefr,
      next_goal,
      goal_completed,
    } = coach;

    const vocab =
      coach?.[`vocab_${targetLang}`] ||
      (targetLang === "es" ? coach?.vocab_es : []) ||
      [];
    const redo_text =
      coach?.[`redo_${targetLang}`] ||
      (targetLang === "es" ? coach?.redo_es : null);

    const pct =
      (((scores?.pronunciation ?? 0) +
        (scores?.grammar ?? 0) +
        (scores?.vocab ?? 0) +
        (scores?.fluency ?? 0)) /
        12) *
      100;

    const targetName = targetLang === "nah" ? "Náhuatl" : "Spanish";

    return (
      <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={2}>
            <HStack justify="space-between" align="start">
              <Text fontWeight="bold">Coach</Text>
              <HStack>
                {goal_completed ? (
                  <Badge colorScheme="green">Goal completed</Badge>
                ) : (
                  <Badge colorScheme="orange">Keep going</Badge>
                )}
                {cefr && <Badge colorScheme="purple">{cefr}</Badge>}
              </HStack>
            </HStack>
          </DrawerHeader>
          <DrawerBody pb={6}>
            {(translation_en || correction_en || tip_en) && (
              <Box mb={3}>
                <Text fontSize="sm" opacity={0.8}>
                  English
                </Text>
                {translation_en && (
                  <Text whiteSpace="pre-wrap">{translation_en}</Text>
                )}
                {correction_en && (
                  <Text mt={1} fontSize="sm">
                    <b>Correction:</b> {correction_en}
                  </Text>
                )}
                {tip_en && (
                  <Text mt={1} fontSize="sm" opacity={0.9}>
                    💡 {tip_en}
                  </Text>
                )}
              </Box>
            )}

            {(translation_es || correction_es || tip_es) && (
              <Box mb={3}>
                <Text fontSize="sm" opacity={0.8}>
                  Español
                </Text>
                {translation_es && (
                  <Text whiteSpace="pre-wrap">{translation_es}</Text>
                )}
                {correction_es && (
                  <Text mt={1} fontSize="sm">
                    <b>Corrección:</b> {correction_es}
                  </Text>
                )}
                {tip_es && (
                  <Text mt={1} fontSize="sm" opacity={0.9}>
                    💡 {tip_es}
                  </Text>
                )}
              </Box>
            )}

            {!!vocab?.length && (
              <Box mb={3}>
                <Text fontSize="sm" opacity={0.8}>
                  Useful {targetName}
                </Text>
                <Wrap spacing={2}>
                  {vocab.slice(0, 8).map((w, i) => (
                    <WrapItem key={i}>
                      <Tag colorScheme="teal" variant="subtle" maxW="100%">
                        {w}
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            <Box mb={4}>
              <Text fontSize="xs" opacity={0.8}>
                Pronunciation / Grammar / Vocab / Fluency
              </Text>
              <Progress value={pct} size="sm" colorScheme="teal" rounded="sm" />
            </Box>

            <Stack direction={["column", "row"]} spacing={2}>
              <Button
                size="md"
                onClick={() => onRedo?.(redo_text)}
                isDisabled={!redo_text}
                flex="1"
              >
                Try again ({targetName})
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => onAcceptNext?.(next_goal)}
                isDisabled={!next_goal}
                flex="1"
                color="white"
              >
                Next goal
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      color="gray.100"
      position="relative"
      pb="120px"
      // maxW="3000px"
      // w="100%"
      style={{ overflowX: "hidden" }}
      borderRadius="32px"
    >
      <HStack px={4} pt={4}>
        <IconButton
          aria-label="Install App"
          icon={<GoDownload size={20} />}
          size="md"
          onClick={install.onOpen}
          colorScheme="blue.800"
        />
        <IconButton
          aria-label="Account"
          icon={<CiUser size={20} />}
          size="md"
          onClick={account.onOpen}
          colorScheme="blue.800"
        />
        <IconButton
          aria-label="Settings"
          icon={<SettingsIcon />}
          size="md"
          onClick={settings.onOpen}
          mr={2}
          colorScheme="blue.800"
        />
      </HStack>
      {/* App bar */}
      <Stack
        direction={["column", "row"]}
        px={4}
        pt={4}
        pb={2}
        spacing={[2, 4]}
        align={["stretch", "center"]}
        justify="space-between"
      >
        <Box minW={0}>
          <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
            {appTitle}
          </Text>
          <Wrap spacing={2} mt={1}>
            <WrapItem>
              <Badge colorScheme={levelColor} variant="subtle">
                {levelLabel}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="teal" variant="subtle">
                XP {xp}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="pink" variant="subtle">
                {streak}🔥
              </Badge>
            </WrapItem>
          </Wrap>
        </Box>
      </Stack>

      {/* Robot + goal */}
      <VStack align="stretch" spacing={3} px={4}>
        <RobotBuddyPro
          state={uiState}
          loudness={uiState === "listening" ? volume : 0}
          mood={mood}
          variant="abstract"
        />
        <Box
          bg="gray.800"
          p={3}
          rounded="lg"
          border="1px solid rgba(255,255,255,0.06)"
          maxW="100%"
          w="100%"
        >
          {/* Stack in column until lg to prevent squeezing at md widths */}
          <Stack
            direction={["column", "column", "column", "row"]}
            spacing={2}
            justify="flex-start"
            align={["stretch", "stretch", "stretch", "center"]}
            flexWrap="wrap"
          >
            <Box flex="1 1 auto" minW={0}>
              <Text fontWeight="semibold" fontSize="md" sx={MOBILE_TEXT_SX}>
                🎯 {challenge.en}
              </Text>
            </Box>
            <Badge
              colorScheme="teal"
              whiteSpace="normal" // allow wrapping inside the badge on mobile
              alignSelf={["flex-start", "flex-start", "flex-start", "center"]}
              maxW="100%"
            >
              ES: {challenge.es}
            </Badge>
          </Stack>

          <Wrap mt={2} spacing={2}>
            <WrapItem>
              <Button
                size="sm"
                variant="outline"
                onClick={coachSheet.onOpen}
                colorScheme="whiteAlpha.600"
              >
                Coach
              </Button>
            </WrapItem>
            <WrapItem>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTranslations((v) => !v)}
                colorScheme="whiteAlpha.600"
              >
                {showTranslations
                  ? secondaryPref === "es"
                    ? "Hide Spanish"
                    : "Hide English"
                  : secondaryPref === "es"
                  ? "Show Spanish"
                  : "Show English"}
              </Button>
            </WrapItem>
            <WrapItem>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const nx = nextGoalFallback(challenge, coach?.scores);
                  setChallenge(nx);
                  saveProfile({ challenge: nx });
                }}
              >
                New goal
              </Button>
            </WrapItem>
            {(() => {
              const redo_text =
                coach?.[`redo_${targetLang}`] || coach?.redo_es || null;
              return (
                redo_text && (
                  <WrapItem>
                    <Button size="sm" onClick={() => handleRedo(redo_text)}>
                      Redo tip
                    </Button>
                  </WrapItem>
                )
              );
            })()}
          </Wrap>
        </Box>
      </VStack>

      {/* Transcript list (live) */}
      <VStack align="stretch" spacing={3} px={4} mt={3}>
        {history.map((m) => {
          const primaryText = m.text || "";
          const lang = m.lang || "es";
          const primaryLabel = lang === "nah" ? "Náhuatl" : "Spanish";
          const secondaryText =
            (secondaryPref === "es" ? m.trans_es : m.trans_en) || "";
          const secondaryLabel = secondaryPref === "es" ? "Español" : "English";
          const pairs = Array.isArray(m.pairs) ? m.pairs : [];
          const canReplay = !!m.audioKey;

          return (
            <AlignedBubble
              key={m.id}
              primaryLabel={primaryLabel}
              secondaryLabel={secondaryLabel}
              primaryText={primaryText}
              secondaryText={secondaryText}
              pairs={pairs}
              showSecondary={showTranslations}
              canReplay={canReplay}
              onReplay={async () => {
                if (!m.audioKey) {
                  toast({
                    title: "No audio cached",
                    description: "This turn doesn’t have saved audio.",
                    status: "info",
                    duration: 2000,
                  });
                  return;
                }
                const clip = await loadClipBlob(m.audioKey);
                if (!clip) {
                  toast({
                    title: "Audio not found",
                    description: "Say something again to re-cache this line.",
                    status: "info",
                    duration: 2000,
                  });
                  return;
                }
                try {
                  audioRef.current?.pause?.();
                } catch {}
                const url = URL.createObjectURL(clip);
                const audio = new Audio(url);
                audioRef.current = audio;
                setUiState("speaking");
                setMood("happy");
                audio.onended = () => {
                  URL.revokeObjectURL(url);
                  audioRef.current = null;
                  setUiState("idle");
                  setMood("neutral");
                };
                await audio.play().catch(() => {});
              }}
            />
          );
        })}
      </VStack>

      {/* Bottom dock */}
      <Center
        position="fixed"
        bottom="22px"
        left="0"
        right="0"
        zIndex={30}
        px={4}
      >
        <HStack spacing={3} w="100%" maxW="560px" justify="center">
          <Box
            bg="gray.800"
            px={3}
            py={2}
            rounded="lg"
            border="1px solid rgba(255,255,255,0.06)"
            display={["none", "flex"]}
          >
            <Stat minW="120px">
              <StatLabel fontSize="xs">Progress</StatLabel>
              <StatNumber fontSize="md">
                {100 - progressPct} XP to level
              </StatNumber>
              <Progress
                mt={1}
                value={progressPct}
                size="xs"
                colorScheme="cyan"
                rounded="sm"
              />
            </Stat>
          </Box>
          {uiState !== "listening" ? (
            <Button
              onClick={startRecording}
              size="lg"
              height="64px"
              px="8"
              rounded="full"
              colorScheme="cyan"
              color="white"
              textShadow="0px 0px 20px black"
              boxShadow="0 10px 30px rgba(0,0,0,0.35)"
            >
              <PiMicrophoneStageDuotone /> &nbsp;Talk
            </Button>
          ) : (
            <Button
              onClick={stopRecordingNow}
              size="lg"
              height="64px"
              px="8"
              rounded="full"
              colorScheme="red"
              boxShadow="0 10px 30px rgba(0,0,0,0.35)"
            >
              <FaStop />
              &nbsp; Stop
            </Button>
          )}
        </HStack>
      </Center>

      {/* Settings Drawer */}
      <Drawer
        isOpen={settings.isOpen}
        placement="bottom"
        onClose={settings.onClose}
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={2}>Settings</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Wrap spacing={2}>
                <WrapItem>
                  <Select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    bg="gray.800"
                    size="md"
                    w="auto"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </WrapItem>
                <WrapItem>
                  <Select
                    value={supportLang}
                    onChange={(e) => setSupportLang(e.target.value)}
                    bg="gray.800"
                    size="md"
                    w="auto"
                  >
                    <option value="en">Support: English</option>
                    <option value="bilingual">Support: Bilingual</option>
                    <option value="es">Support: Spanish</option>
                  </Select>
                </WrapItem>
                <WrapItem>
                  <Select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    bg="gray.800"
                    size="md"
                    w="auto"
                  >
                    <option value="Leda">Leda</option>
                    <option value="Puck">Puck</option>
                    <option value="Kore">Kore</option>
                    <option value="Breeze">Breeze</option>
                    <option value="Solemn">Solemn</option>
                  </Select>
                </WrapItem>
                <WrapItem>
                  <Select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    bg="gray.800"
                    size="md"
                    w="auto"
                    title="Practice language"
                  >
                    <option value="nah">Practice: Náhuatl</option>
                    <option value="es">Practice: Spanish</option>
                  </Select>
                </WrapItem>
              </Wrap>

              <Box bg="gray.800" p={3} rounded="md">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Auto-stop after pause</Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {pauseMs} ms
                  </Text>
                </HStack>
                <Slider
                  aria-label="pause-slider"
                  min={400}
                  max={3000}
                  step={100}
                  value={pauseMs}
                  onChange={setPauseMs}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>

              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2}>
                  Voice personality
                </Text>
                <Input
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  bg="gray.700"
                  placeholder={`e.g., ${DEFAULT_PERSONA}`}
                />
                <Text fontSize="xs" opacity={0.7} mt={1}>
                  Styles the assistant reply (light sarcasm OK; no bullying).
                </Text>
              </Box>

              <HStack bg="gray.800" p={3} rounded="md" justify="space-between">
                <Text fontSize="sm" mr={2}>
                  Show {secondaryPref === "es" ? "Spanish" : "English"}{" "}
                  translation
                </Text>
                <Switch
                  isChecked={showTranslations}
                  onChange={(e) => setShowTranslations(e.target.checked)}
                />
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Account Drawer */}
      <Drawer
        isOpen={account.isOpen}
        placement="bottom"
        onClose={account.onClose}
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={2}>Account</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={1}>
                  Your ID (npub)
                </Text>
                <InputGroup>
                  <Input
                    value={currentId || ""}
                    readOnly
                    bg="gray.700"
                    placeholder="Not set"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => copy(currentId, "ID copied")}
                      isDisabled={!currentId}
                    >
                      Copy
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </Box>

              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={1}>
                  Secret key (nsec)
                </Text>
                <InputGroup>
                  <Input
                    type="password"
                    value={currentSecret ? "••••••••••••••••••••••••••••" : ""}
                    readOnly
                    bg="gray.700"
                    placeholder="Not stored"
                  />
                  <InputRightElement width="6rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      colorScheme="orange"
                      onClick={() => copy(currentSecret, "Secret copied")}
                      isDisabled={!currentSecret}
                    >
                      Copy
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <Text fontSize="xs" opacity={0.75} mt={1}>
                  We never display your secret—only copy from local storage.
                </Text>
              </Box>

              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2}>
                  Switch account (paste nsec)
                </Text>
                <Input
                  value={switchNsec}
                  onChange={(e) => setSwitchNsec(e.target.value)}
                  bg="gray.700"
                  placeholder="nsec1..."
                />
                <HStack mt={2} justify="flex-end">
                  <Button
                    isLoading={isSwitching}
                    loadingText="Switching"
                    onClick={switchAccount}
                    colorScheme="teal"
                  >
                    Switch
                  </Button>
                </HStack>
                <Text fontSize="xs" opacity={0.75} mt={1}>
                  If the account doesn’t exist, we’ll create it in your users
                  collection.
                </Text>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Coach */}
      <CoachPanel
        isOpen={coachSheet.isOpen}
        onClose={coachSheet.onClose}
        coach={coach}
        onRedo={handleRedo}
        onAcceptNext={acceptNextGoal}
        targetLang={targetLang}
      />

      <Modal isOpen={install.isOpen} onClose={install.onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.900" color="gray.100">
          <ModalHeader>Install App</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" pb={0}>
              <IoIosMore size={32} />
              <Text mt={2}>
                1. Open this page in your browser with the More Options button
              </Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <MdOutlineFileUpload size={32} />
              <Text mt={2}>2. Press the Share button</Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <CiSquarePlus size={32} />
              <Text mt={2}>3. Press the Add To Homescreen button</Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <LuBadgeCheck size={32} />
              <Text mt={2}>
                4. That’s it! You don’t need to download the app through an app
                store because we’re using open-source standards called
                Progressive Web Apps.
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              onMouseDown={install.onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") install.onClose();
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
