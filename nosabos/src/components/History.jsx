// components/History.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Badge,
  Button,
  HStack,
  VStack,
  Text,
  Spinner,
  Divider,
  IconButton,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { FaVolumeUp, FaStop } from "react-icons/fa";
import { MdMenuBook } from "react-icons/md";
import {
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  query,
  orderBy,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? key) + "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

/* ---------------------------
   LLM plumbing
--------------------------- */
const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const MODEL = import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

async function callResponses({ model, input }) {
  try {
    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        text: { format: { type: "text" } },
        input,
      }),
    });
    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    const text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join("")
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      (typeof payload === "string" ? payload : "");
    return String(text || "");
  } catch {
    return "";
  }
}
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch {}
    }
    return null;
  }
}

/* ---------------------------
   User / XP / Settings
--------------------------- */
const LANG_NAME = (code) =>
  ({ en: "English", es: "Spanish", nah: "Nahuatl" }[code] || code);

const strongNpub = (user) =>
  (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "") ||
    ""
  ).trim();

function useSharedProgress() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en",
    showTranslations: true,
    voice: "alloy",
  });

  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setXp(Number.isFinite(data?.xp) ? data.xp : 0);
      const p = data?.progress || {};
      setProgress({
        level: p.level || "beginner",
        targetLang: ["nah", "es", "en"].includes(p.targetLang)
          ? p.targetLang
          : "es",
        supportLang: ["en", "es", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
        showTranslations:
          typeof p.showTranslations === "boolean" ? p.showTranslations : true,
        voice: p.voice || "alloy",
      });
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub };
}

async function awardXp(npub, amount) {
  if (!npub || !amount) return;
  const ref = doc(database, "users", npub);
  await setDoc(
    ref,
    { xp: increment(Math.round(amount)), updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/* ---------------------------
   Difficulty + Prompts
--------------------------- */
function difficultyHint(level, xp) {
  const band = xp < 150 ? 0 : xp < 400 ? 1 : 2;
  if (level === "beginner") {
    return [
      "Short, simple syntax.",
      "Short with a few details.",
      "Short with transitions.",
    ][band];
  }
  if (level === "intermediate") {
    return [
      "Add some connectors.",
      "Add comparisons & causes.",
      "Add brief nuance & context.",
    ][band];
  }
  return [
    "Concise but advanced.",
    "Analytical with nuance.",
    "Denser, more academic tone.",
  ][band];
}

const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang;

// Seed: FIRST lecture must be Bering migration
function buildSeedLecturePrompt({ targetLang, supportLang, level, xp }) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(level, xp);

  return `
Write ONE short lecture in ${TARGET} (≈180–260 words) about the **initial migration from Siberia across the Bering Strait (Beringia)** into the Americas. Suitable for a ${level} learner. Difficulty: ${diff}.

Requirements:
- Mention approximate time frames (e.g., Late Pleistocene), changing climates/sea levels, and possible inland/coastal routes.
- Note types of evidence (archaeology, genetics, languages) without getting too technical.
- Keep it engaging and clear.

Include:
- A concise title (<= 60 chars) in ${TARGET}.
- 3 concise bullet takeaways in ${TARGET}.
- A full ${SUPPORT} translation of the lecture (NOT the takeaways).

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${TARGET}>"],
  "support": "<full translation in ${SUPPORT}>"
}
`.trim();
}

// General progression (after seed), based on prior titles
function buildLecturePrompt({
  previousTitles,
  targetLang,
  supportLang,
  level,
  xp,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(level, xp);
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  return `
You are curating a long, progressive curriculum of short lectures on Mexican and Mesoamerican history.
Choose the **next granular topic** based on the list of previous lecture titles (chronological if possible; otherwise deepen a thread).
Avoid repetition. Favor specificity: a city, figure, event, reform, battle, treaty, cultural theme, or policy.

previous_titles:
${prev}

Write ONE lecture in ${TARGET} (≈180–260 words), suitable for a ${level} learner. Difficulty: ${diff}.
Include:
- A concise title (<= 60 chars).
- 3 concise bullet takeaways.
- Touch on people, culture, governments, and/or wars as relevant.
- Provide a full ${SUPPORT} translation of the lecture (NOT the takeaways).

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${TARGET}>"],
  "support": "<full translation in ${SUPPORT}>"
}
`.trim();
}

/* ---------------------------
   AI-determined XP
--------------------------- */
function buildXpPrompt({
  title,
  target,
  takeaways,
  previousTitles,
  level,
  currentXp,
  hoursSinceLastLecture,
}) {
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  return `
You are an impartial XP rater for a language-learning history app.

Given the NEW lecture and the list of PREVIOUS lecture titles, assign an XP integer for this session.
Consider:
- Novelty vs. previous titles (avoid repetition; reward progression or deepening a thread).
- Topic granularity/specificity (figures, events, policies), and overall difficulty for the user's level: ${level}.
- Coverage balance (people, culture, governments, wars) at least touched.
- Text density/length (≈180–260 words is ideal).
- Consistency/streak: if hours_since_last_lecture <= 48, give a small streak bonus.
- Current user XP: ${currentXp} (slightly increase expectations as XP grows).

Return JSON ONLY in this strict schema:

{
  "xp": <integer between 20 and 70>,
  "reason": "<one-sentence reason>"
}

previous_titles:
${prev}

new_title: ${title}

new_lecture_excerpt:
${target.slice(0, 900)}

new_takeaways:
${Array.isArray(takeaways) ? takeaways.join(" | ") : ""}
hours_since_last_lecture: ${hoursSinceLastLecture ?? "null"}
`.trim();
}

async function computeAdaptiveXp({
  title,
  target,
  takeaways,
  previousTitles,
  level,
  currentXp,
  hoursSinceLastLecture,
}) {
  try {
    const prompt = buildXpPrompt({
      title,
      target,
      takeaways,
      previousTitles,
      level,
      currentXp,
      hoursSinceLastLecture,
    });
    const raw = await callResponses({ model: MODEL, input: prompt });
    const parsed = safeParseJSON(raw);
    const xp = Math.max(3, Math.min(20, Math.round(Number(parsed?.xp))));
    const reason =
      typeof parsed?.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "Auto-scored by rubric.";
    if (Number.isFinite(xp)) return { xp, reason };
  } catch {}
  const base = target.length > 220 ? 9 : target.length > 160 ? 8 : 7;
  const noveltyBoost = previousTitles?.some((t) =>
    String(t || "")
      .toLowerCase()
      .includes(String(title || "").toLowerCase())
  )
    ? -2
    : 2;
  const streakBoost =
    hoursSinceLastLecture != null && hoursSinceLastLecture <= 48 ? 2 : 0;
  const levelTweak =
    level === "beginner" ? 0 : level === "intermediate" ? 1 : 2;
  const xp = Math.max(
    3,
    Math.min(20, base + noveltyBoost + streakBoost + levelTweak)
  );
  return { xp, reason: "Heuristic fallback scoring." };
}

/* ---------------------------
   TTS (no highlighting)
--------------------------- */
const BCP47 = {
  es: { tts: "es-ES" },
  en: { tts: "en-US" },
  nah: { tts: "es-ES" },
};

export default function History({ userLanguage = "en" }) {
  const t = useT(userLanguage);
  const user = useUserStore((s) => s.user);

  const { xp, levelNumber, progressPct, progress, npub } = useSharedProgress();

  const targetLang = ["en", "es", "nah"].includes(progress.targetLang)
    ? progress.targetLang
    : "es";
  const supportLang = resolveSupportLang(
    progress.supportLang || "en",
    userLanguage
  );
  const showTranslations = progress.showTranslations !== false;

  const targetName = LANG_NAME(targetLang);
  const supportName = LANG_NAME(supportLang);

  const localizedLangName = (code) =>
    ({
      en: t("language_en"),
      es: t("language_es"),
      nah: t("language_nah"),
    }[code] || code);

  const targetDisplay = localizedLangName(targetLang);
  const supportDisplay = localizedLangName(supportLang);

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp]);

  // List
  const [lectures, setLectures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const listDisclosure = useDisclosure({ defaultIsOpen: false }); // mobile list toggle

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false);

  // Reading state
  const [isReadingTarget, setIsReadingTarget] = useState(false);
  const [isReadingSupport, setIsReadingSupport] = useState(false);

  // Refs for audio
  const currentAudioRef = useRef(null);

  // NEW: refs for auto-scroll (mobile + desktop lists)
  const mobileEndRef = useRef(null);
  const desktopEndRef = useRef(null);

  // Auto-scroll to bottom when a new lecture arrives
  useEffect(() => {
    requestAnimationFrame(() => {
      mobileEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      desktopEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [lectures.length]);

  // Live sync lectures
  useEffect(() => {
    if (!npub) return;
    const col = collection(database, "users", npub, "historyLectures");
    const q = query(col, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.createdAtClient || 0) - (b.createdAtClient || 0));
      setLectures(items);
      if (!activeId && items.length) setActiveId(items[items.length - 1].id);
    });
    return () => unsub();
  }, [npub]); // eslint-disable-line

  const activeLecture = useMemo(
    () => lectures.find((l) => l.id === activeId) || null,
    [lectures, activeId]
  );

  // Reset reading when switching lecture
  useEffect(() => {
    stopSpeech();
  }, [activeId]); // eslint-disable-line

  async function generateNextLecture() {
    if (!npub || isGenerating) return;
    setIsGenerating(true);

    const previousTitles = lectures
      .map((l) => l.title || "")
      .filter(Boolean)
      .slice(-30);
    const lastClient = lectures.length
      ? lectures[lectures.length - 1].createdAtClient || 0
      : 0;
    const hoursSinceLastLecture = lastClient
      ? Math.round((Date.now() - lastClient) / 3600000)
      : null;

    const isFirst = previousTitles.length === 0;

    const prompt = isFirst
      ? buildSeedLecturePrompt({
          targetLang,
          supportLang,
          level: progress.level || "beginner",
          xp,
        })
      : buildLecturePrompt({
          previousTitles,
          targetLang,
          supportLang,
          level: progress.level || "beginner",
          xp,
        });

    let parsed =
      safeParseJSON(await callResponses({ model: MODEL, input: prompt })) ||
      null;

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.target !== "string"
    ) {
      if (isFirst) {
        parsed = {
          title:
            targetLang === "en"
              ? "Across Beringia into the Americas"
              : "A través de Beringia hacia América",
          target:
            targetLang === "en"
              ? "During the Late Pleistocene, groups from Siberia migrated into the Americas via Beringia—the land bridge exposed by lower sea levels..."
              : "Durante el Pleistoceno tardío, grupos de Siberia migraron hacia América a través de Beringia, el puente terrestre expuesto por el descenso del nivel del mar...",
          support:
            supportLang === "es"
              ? "Durante el Pleistoceno tardío, grupos de Siberia migraron hacia América a través de Beringia..."
              : "During the Late Pleistocene, groups from Siberia migrated into the Americas via Beringia...",
          takeaways: [
            targetLang === "en"
              ? "Beringia linked Siberia and Alaska."
              : "Beringia unió Siberia y Alaska.",
            targetLang === "en"
              ? "Climate shifts opened migration routes."
              : "Los cambios climáticos abrieron rutas.",
            targetLang === "en"
              ? "Foundations for future cultures."
              : "Bases de culturas posteriores.",
          ],
        };
      } else {
        parsed = {
          title:
            targetLang === "en"
              ? "A Turning Point in Early Mesoamerica"
              : "Un punto de inflexión temprano",
          target:
            targetLang === "en"
              ? "An important phase unfolded as communities consolidated agriculture, ritual life, and trade networks..."
              : "Una fase importante se desarrolló cuando las comunidades consolidaron la agricultura, la vida ritual y las redes de intercambio...",
          support:
            supportLang === "es"
              ? "Una fase importante se desarrolló cuando las comunidades consolidaron la agricultura..."
              : "An important phase unfolded as communities consolidated agriculture...",
          takeaways: [
            targetLang === "en"
              ? "Stronger villages and exchanges."
              : "Aldeas y trueques más fuertes.",
            targetLang === "en"
              ? "New identities and beliefs."
              : "Nuevas identidades y creencias.",
            targetLang === "en"
              ? "Technology spread regionally."
              : "Tecnología difundida regionalmente.",
          ],
        };
      }
    }

    const { xp: xpAward, reason: xpReason } = await computeAdaptiveXp({
      title: String(parsed.title || ""),
      target: String(parsed.target || ""),
      takeaways: Array.isArray(parsed.takeaways)
        ? parsed.takeaways.slice(0, 3)
        : [],
      previousTitles,
      level: progress.level || "beginner",
      currentXp: xp,
      hoursSinceLastLecture,
    });

    const payload = {
      title: String(parsed.title || "").trim(),
      target: String(parsed.target || ""),
      support: String(parsed.support || ""),
      takeaways: Array.isArray(parsed.takeaways)
        ? parsed.takeaways.slice(0, 3)
        : [],
      xpAward: xpAward,
      xpReason: xpReason,
      createdAt: serverTimestamp(),
      createdAtClient: Date.now(),
    };

    const col = collection(database, "users", npub, "historyLectures");
    const ref = await addDoc(col, payload);

    await awardXp(npub, xpAward).catch(() => {});

    setActiveId(ref.id);
    setIsGenerating(false);
    if (!listDisclosure.isOpen) listDisclosure.onOpen();
  }

  const stopSpeech = () => {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    } catch {}
    setIsReadingTarget(false);
    setIsReadingSupport(false);
  };

  async function speak({ text, langTag, voice, setReading, onDone }) {
    stopSpeech();
    if (!text) return;
    setReading(true);

    try {
      const res = await fetch(
        "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: text,
            voice: voice || "alloy",
            model: "tts-1",
            response_format: "mp3",
            language: langTag,
          }),
        }
      );
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        setReading(false);
        currentAudioRef.current = null;
        onDone?.();
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
      return;
    } catch {
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = langTag || "es-ES";
        utter.rate = 0.95;
        utter.pitch = 1.0;
        utter.onend = () => {
          setReading(false);
          onDone?.();
        };
        utter.onerror = () => {
          setReading(false);
          onDone?.();
        };
        speechSynthesis.speak(utter);
        return;
      }
      setReading(false);
      onDone?.();
    }
  }

  const readTarget = async () =>
    speak({
      text: activeLecture?.target,
      langTag: (BCP47[targetLang] || BCP47.es).tts,
      voice: progress.voice || "alloy",
      onDone: () => {},
      setReading: setIsReadingTarget,
    });

  const readSupport = async () =>
    speak({
      text: activeLecture?.support,
      langTag: (BCP47[supportLang] || BCP47.en).tts,
      voice: progress.voice || "alloy",
      onDone: () => {},
      setReading: setIsReadingSupport,
    });

  const xpReasonText =
    activeLecture?.xpReason && typeof activeLecture.xpReason === "string"
      ? ` — ${activeLecture.xpReason}`
      : "";

  if (showPasscodeModal) {
    return (
      <PasscodePage
        userLanguage={user.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

  return (
    <Box p={[3, 4, 6]}>
      <VStack spacing={5} align="stretch" maxW="1100px" mx="auto">
        {/* Header: Level / XP */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Badge variant="subtle" px={2} py={1} rounded="md">
              {t("history_badge_level", { level: levelNumber })}
            </Badge>
            <Badge variant="subtle" px={2} py={1} rounded="md">
              {t("history_badge_xp", { xp })}
            </Badge>
          </HStack>
          <WaveBar value={progressPct} />
        </Box>

        {/* Controls */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={2}>
            <MdMenuBook />
            <Text fontWeight="semibold">{t("history_title")}</Text>
          </HStack>
          <Button onClick={generateNextLecture} isDisabled={isGenerating}>
            {isGenerating ? (
              <Spinner size="sm" style={{ marginRight: 8 }} />
            ) : null}
            {t("history_btn_generate")}
          </Button>
        </HStack>

        {/* Mobile: collapsible list */}
        <Box display={{ base: "block", md: "none" }}>
          <Button
            size="sm"
            variant="outline"
            onClick={listDisclosure.onToggle}
            mt={2}
          >
            {listDisclosure.isOpen
              ? t("history_list_hide")
              : t("history_list_show")}
          </Button>
          <Collapse in={listDisclosure.isOpen} animateOpacity>
            <Box
              mt={3}
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              rounded="xl"
              p={4}
              mx={1}
            >
              <Text fontSize="sm" opacity={0.8} mb={3}>
                {t("history_prev_lectures_label")}
              </Text>
              <VStack
                align="stretch"
                spacing={3}
                // maxH="48vh"
                height="200px"
                overflowY="auto"
                pr={1}
                sx={{
                  scrollPadding: "8px",
                  /* Hide scrollbar across browsers */
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  "&::-webkit-scrollbar": { width: "0px", height: "0px" },
                  "&::-webkit-scrollbar-thumb": { background: "transparent" },
                }}
              >
                {lectures.length === 0 ? (
                  <Text fontSize="sm" opacity={0.7}>
                    {t("history_none_yet")}
                  </Text>
                ) : (
                  lectures.map((lec) => {
                    const active = lec.id === activeId;
                    return (
                      <Button
                        key={lec.id}
                        onClick={() => setActiveId(lec.id)}
                        justifyContent="flex-start"
                        size="sm"
                        variant={active ? "solid" : "ghost"}
                        colorScheme={active ? "teal" : "cyan"}
                        whiteSpace="normal"
                        textAlign="left"
                        py={3}
                        px={3}
                        rounded="lg"
                      >
                        <Text fontWeight="600" fontSize="sm">
                          {lec.title}
                        </Text>
                      </Button>
                    );
                  })
                )}
                {/* sentinel for auto-scroll (mobile) */}
                <Box ref={mobileEndRef} />
              </VStack>
            </Box>
          </Collapse>
        </Box>

        <Divider opacity={0.25} display={{ base: "none", md: "block" }} />

        {/* Main content area */}
        <HStack
          align="start"
          spacing={5}
          flexDir={{ base: "column", md: "row" }}
        >
          {/* Left: list (desktop/tablet) */}
          <Box
            w={{ base: "100%", md: "300px" }}
            flexShrink={0}
            bg="gray.800"
            borderColor="gray.700"
            rounded="xl"
            p={4}
            display={{ base: "none", md: "block" }}
          >
            <Text fontSize="sm" opacity={0.8} mb={3}>
              {t("history_prev_lectures_label")}
            </Text>
            <VStack
              align="stretch"
              spacing={3}
              maxH="64vh"
              overflowY="auto"
              pr={1}
              height="200px"
              sx={{
                /* Hide scrollbar across browsers */
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { width: "0px", height: "0px" },
                "&::-webkit-scrollbar-thumb": { background: "transparent" },
              }}
            >
              {lectures.length === 0 ? (
                <Text fontSize="sm" opacity={0.7}>
                  {t("history_none_yet")}
                </Text>
              ) : (
                lectures.map((lec) => {
                  const active = lec.id === activeId;
                  return (
                    <Button
                      key={lec.id}
                      onClick={() => setActiveId(lec.id)}
                      justifyContent="flex-start"
                      size="sm"
                      variant={active ? "solid" : "ghost"}
                      colorScheme={active ? "teal" : "cyan"}
                      whiteSpace="normal"
                      textAlign="left"
                      py={6}
                      px={6}
                      rounded="lg"
                    >
                      <Text fontWeight="600" fontSize="sm">
                        {lec.title}
                      </Text>
                    </Button>
                  );
                })
              )}
              {/* sentinel for auto-scroll (desktop) */}
              <Box ref={desktopEndRef} />
            </VStack>
          </Box>

          {/* Right: Active lecture */}
          <Box
            flex="1"
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            rounded="xl"
            p={[4, 5]}
            minH="280px"
            width="100%"
          >
            {activeLecture ? (
              <VStack align="stretch" spacing={4}>
                <HStack
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
                    {activeLecture.title}
                  </Text>
                  <HStack mt={{ base: 2, md: 0 }}>
                    <Button
                      onClick={readTarget}
                      isLoading={isReadingTarget}
                      leftIcon={<FaVolumeUp />}
                      size="sm"
                    >
                      {t("history_read_in", { language: targetDisplay })}
                    </Button>
                    {showTranslations && activeLecture.support ? (
                      <Button
                        onClick={readSupport}
                        isLoading={isReadingSupport}
                        leftIcon={<FaVolumeUp />}
                        size="sm"
                        variant="outline"
                      >
                        {t("history_read_in", { language: supportDisplay })}
                      </Button>
                    ) : null}
                    {(isReadingTarget || isReadingSupport) && (
                      <IconButton
                        aria-label={t("history_stop_aria")}
                        onClick={stopSpeech}
                        icon={<FaStop />}
                        size="sm"
                        variant="outline"
                      />
                    )}
                  </HStack>
                </HStack>

                <Text fontSize={{ base: "md", md: "md" }} lineHeight="1.8">
                  {activeLecture.target}
                </Text>

                {showTranslations && activeLecture.support ? (
                  <>
                    <Divider opacity={0.2} />
                    <Text fontWeight="600" fontSize="sm" opacity={0.9}>
                      {supportDisplay}
                    </Text>
                    <Text
                      fontSize={{ base: "sm", md: "sm" }}
                      opacity={0.95}
                      lineHeight="1.8"
                    >
                      {activeLecture.support}
                    </Text>
                  </>
                ) : null}

                {Array.isArray(activeLecture.takeaways) &&
                activeLecture.takeaways.length ? (
                  <>
                    <Divider opacity={0.2} />
                    <Text fontWeight="600" fontSize="sm" opacity={0.9}>
                      {t("history_takeaways_heading")}
                    </Text>
                    <VStack align="stretch" spacing={1.5}>
                      {activeLecture.takeaways.map((tkw, i) => (
                        <Text key={i} fontSize="sm">
                          • {tkw}
                        </Text>
                      ))}
                    </VStack>
                  </>
                ) : null}

                {Number.isFinite(activeLecture?.xpAward) ? (
                  <>
                    <Divider opacity={0.2} />
                    <Text fontSize="sm" opacity={0.9}>
                      {t("history_xp_awarded_line", {
                        xp: activeLecture.xpAward,
                        reason: xpReasonText,
                      })}
                    </Text>
                  </>
                ) : null}
              </VStack>
            ) : (
              <VStack spacing={3} width="100%">
                <Text>{t("history_no_lecture")}</Text>
              </VStack>
            )}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}
