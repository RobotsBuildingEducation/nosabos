// components/Randomize.jsx
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  HStack,
  Badge,
  Text,
  Spinner,
  useToast, // ✅ toast
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";

// Lazy-load modules
const StoryMode = React.lazy(() => import("./Stories"));
const GrammarBook = React.lazy(() => import("./GrammarBook"));
const Vocabulary = React.lazy(() => import("./Vocabulary"));
const History = React.lazy(() => import("./History"));

const MODE_LOADERS = {
  story: () => import("./Stories"),
  grammar: () => import("./GrammarBook"),
  vocab: () => import("./Vocabulary"),
  reading: () => import("./History"),
};

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? "") + "";
    if (!raw) return "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

const MODES = [
  { key: "story" },
  { key: "grammar" },
  { key: "vocab" },
  { key: "reading" },
];

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "") ||
    ""
  ).trim();
}

function strongNsec() {
  return (
    (typeof window !== "undefined" ? localStorage.getItem("local_nsec") : "") ||
    ""
  ).trim();
}

export default function Randomize() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const nsec = strongNsec();
  const uiLang = user?.appLanguage || "en";
  const t = useT(uiLang);
  const toast = useToast();

  // live XP header
  const [xp, setXp] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const levelNumber = Math.floor(xp / 100) + 1;

  // random rotation state
  const [initializing, setInitializing] = useState(true);
  const [slots, setSlots] = useState([
    { id: "a", modeKey: null, active: true },
    { id: "b", modeKey: null, active: false },
  ]);

  // watch XP to detect “earned XP”
  const xpBaselineRef = useRef(0);
  const targetLangRef = useRef("es");
  const preloadedRef = useRef({});

  // Mode labels from translations
  const modeLabels = useMemo(
    () => ({
      story: t("tabs_stories") || (uiLang === "es" ? "Narrativos" : "Stories"),
      grammar: t("tabs_grammar") || (uiLang === "es" ? "Gramática" : "Grammar"),
      vocab:
        t("tabs_vocab") || (uiLang === "es" ? "Vocabulario" : "Vocabulary"),
      reading: t("tabs_reading") || (uiLang === "es" ? "Lectura" : "Reading"),
    }),
    [t, uiLang]
  );

  const pickRandomMode = useCallback((excludeKey = null) => {
    const keys = MODES.map((m) => m.key).filter((k) => k !== excludeKey);
    const pool = keys.length ? keys : MODES.map((m) => m.key);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const prefetchModeComponent = useCallback((modeKey) => {
    if (!modeKey || preloadedRef.current[modeKey]) return;
    const loader = MODE_LOADERS[modeKey];
    if (!loader) return;
    preloadedRef.current[modeKey] = loader().catch((err) => {
      console.error(`Failed to preload ${modeKey} mode`, err);
      delete preloadedRef.current[modeKey];
    });
  }, []);

  const scheduleNextMode = useCallback(
    (excludeKey) => {
      const pick = pickRandomMode(excludeKey);
      prefetchModeComponent(pick);
      return pick;
    },
    [pickRandomMode, prefetchModeComponent]
  );

  const swapInPrefetch = useCallback(() => {
    setSlots((prev) => {
      const activeIdx = prev.findIndex((s) => s.active);
      const prefetchIdx = activeIdx === 0 ? 1 : 0;
      const readyKey = prev[prefetchIdx]?.modeKey;
      if (!readyKey) return prev;

      const newNext = scheduleNextMode(readyKey);
      return prev.map((slot, idx) => {
        if (idx === prefetchIdx) {
          return { ...slot, active: true };
        }
        return { ...slot, active: false, modeKey: newNext };
      });
    });
  }, [scheduleNextMode]);

  // subscribe to Firestore XP and drive randomization
  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = ["nah", "es", "pt", "en", "fr", "it"].includes(
        p.targetLang
      )
        ? p.targetLang
        : "es";
      const langXp = getLanguageXp(p, targetLang);
      const newXp = Number.isFinite(langXp) ? langXp : 0;
      const languageChanged = targetLangRef.current !== targetLang;

      targetLangRef.current = targetLang;
      setXp(newXp);
      setProgressPct(Math.min(100, newXp % 100));

      if (initializing) {
        xpBaselineRef.current = newXp;
        const first = pickRandomMode();
        const second = scheduleNextMode(first);
        setSlots([
          { id: "a", modeKey: first, active: true },
          { id: "b", modeKey: second, active: false },
        ]);
        setInitializing(false);
        return;
      }

      if (languageChanged) {
        xpBaselineRef.current = newXp;
        return;
      }

      if (newXp < xpBaselineRef.current) {
        xpBaselineRef.current = newXp;
        return;
      }

      // ✅ On XP increase: celebrate + auto-advance
      if (newXp > xpBaselineRef.current) {
        const diff = newXp - xpBaselineRef.current;
        xpBaselineRef.current = newXp;

        // Celebration toast (localized)
        const title =
          t("random_toast_title") ||
          (uiLang === "es" ? "¡Buen trabajo!" : "Nice job!");
        const desc =
          t("random_toast_desc", { xp: diff }) ||
          (uiLang === "es"
            ? `Ganaste +${diff} XP.`
            : `You earned +${diff} XP.`);

        toast({
          title,
          description: desc,
          status: "success",
          duration: 1800,
          isClosable: true,
          position: "top",
        });

        // Auto-pick the next randomized activity (different from current)
        swapInPrefetch();

        // Optional: let child components know they can advance internally if needed
        try {
          window.dispatchEvent(
            new CustomEvent("randomize:advance", { detail: { xpGained: diff } })
          );
        } catch {}
      }
    });
    return () => unsub();
  }, [
    npub,
    initializing,
    t,
    toast,
    uiLang,
    swapInPrefetch,
  ]);

  const currentSlot = slots.find((s) => s.active) || slots[0];
  const currentModeKey = currentSlot?.modeKey;

  const currentMode = useMemo(() => {
    return currentModeKey
      ? { key: currentModeKey, label: modeLabels[currentModeKey] }
      : null;
  }, [currentModeKey, modeLabels]);

  const surpriseMe = () => {
    setSlots((prev) => {
      const activeIdx = prev.findIndex((s) => s.active);
      const prefetchIdx = activeIdx === 0 ? 1 : 0;
      const prefetchKey = prev[prefetchIdx]?.modeKey;

      if (prefetchKey) {
        const newNext = scheduleNextMode(prefetchKey);
        return prev.map((slot, idx) =>
          idx === prefetchIdx
            ? { ...slot, active: true }
            : { ...slot, active: false, modeKey: newNext }
        );
      }

      const fallbackPick =
        scheduleNextMode(prev[activeIdx]?.modeKey) || prev[activeIdx]?.modeKey;
      return [
        { ...prev[0], active: true, modeKey: fallbackPick },
        { ...prev[1], active: false, modeKey: scheduleNextMode(fallbackPick) },
      ];
    });
  };

  // Reused translated strings with safe fallbacks
  const STR = {
    level:
      t("grammar_badge_level", { level: levelNumber }) ||
      (uiLang === "es" ? `Nivel ${levelNumber}` : `Level ${levelNumber}`),
    xpBadge:
      t("grammar_badge_xp", { xp }) ||
      (uiLang === "es" ? `XP ${xp}` : `XP ${xp}`),
    shuffle: t("random_shuffle") || (uiLang === "es" ? "Mezclar" : "Shuffle"),
    picking:
      t("randomize_picking_surprise") ||
      (uiLang === "es"
        ? "Eligiendo una sorpresa para ti…"
        : "Picking a surprise for you…"),
    loading:
      t("generic_loading") || (uiLang === "es" ? "Cargando..." : "Loading..."),
  };

  const renderMode = (modeKey) => {
    if (!modeKey) return null;
    if (modeKey === "story") {
      return (
        <StoryMode userLanguage={uiLang} activeNpub={npub} activeNsec={nsec} />
      );
    }
    if (modeKey === "grammar") {
      return (
        <GrammarBook userLanguage={uiLang} activeNpub={npub} activeNsec={nsec} />
      );
    }
    if (modeKey === "vocab") {
      return (
        <Vocabulary userLanguage={uiLang} activeNpub={npub} activeNsec={nsec} />
      );
    }
    return <History userLanguage={uiLang} />;
  };

  const renderSlot = (slot) => (
    <Box
      key={slot.id}
      position={slot.active ? "relative" : "absolute"}
      inset={slot.active ? "auto" : 0}
      width="100%"
      minH={slot.active ? "auto" : "40vh"}
      overflow={slot.active ? "visible" : "hidden"}
      opacity={slot.active ? 1 : 0}
      pointerEvents={slot.active ? "auto" : "none"}
      aria-hidden={slot.active ? undefined : true}
    >
      <Suspense
        fallback={
          slot.active ? (
            <HStack justify="center" py={12}>
              <Spinner color="teal.300" />
              <Text color="white" ml={2}>
                {STR.loading}
              </Text>
            </HStack>
          ) : null
        }
      >
        {slot.modeKey ? (
          renderMode(slot.modeKey)
        ) : (
          <HStack justify="center" py={12}>
            <Spinner color="teal.300" />
            <Text color="white" ml={2}>
              {slot.active ? STR.picking : STR.loading}
            </Text>
          </HStack>
        )}
      </Suspense>
    </Box>
  );

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
    >
      {/* Header */}
      <Box
        as="header"
        w="100%"
        px={4}
        py={3}
        bg="rgba(15, 15, 35, 0.8)"
        color="white"
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <HStack justify="space-between" align="center">
          {/* Left: current mode badge (translated label only) */}
          <HStack spacing={2}>
            {currentMode ? (
              <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
                {currentMode.label}
              </Badge>
            ) : null}
          </HStack>

          {/* Right: Level/XP + Shuffle */}
          <HStack spacing={2}>
            <Badge variant="subtle">{STR.level}</Badge>
            <Badge variant="subtle">{STR.xpBadge}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={surpriseMe}
              w="auto"
              minW="unset"
              flexShrink={0}
              whiteSpace="nowrap"
            >
              {STR.shuffle}
            </Button>
          </HStack>
        </HStack>
        <Box mt={2}>
          <WaveBar value={progressPct} />
        </Box>
      </Box>

      {/* Content + hidden prefetch slot. Both stay mounted so the next module is ready instantly. */}
      <Box position="relative" minH="40vh">
        {!currentMode ? (
          <HStack justify="center" py={12}>
            <Spinner color="teal.300" />
            <Text color="white" ml={2}>
              {STR.picking}
            </Text>
          </HStack>
        ) : (
          slots.map((slot) => renderSlot(slot))
        )}
      </Box>
    </Box>
  );
}
