// components/Randomize.jsx
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import {
  Box,
  Button,
  HStack,
  Badge,
  Text, useToast, // ✅ toast
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import translations from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";
import VoiceOrb from "./VoiceOrb";
import XpProgressHeader from "./XpProgressHeader";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  isSupportedPracticeLanguage,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

// Lazy-load modules
const StoryMode = React.lazy(() => import("./Stories"));
const GrammarBook = React.lazy(() => import("./GrammarBook"));
const Vocabulary = React.lazy(() => import("./Vocabulary"));
const History = React.lazy(() => import("./History"));

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
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

const uiCopy = (lang, copy) =>
  copy[normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE)] || copy.en;

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
  const uiLang = normalizeSupportLanguage(
    user?.appLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const t = useT(uiLang);
  const toast = useToast();

  // live XP header
  const [xp, setXp] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const levelNumber = Math.floor(xp / 100) + 1;

  // random rotation state
  const [currentModeKey, setCurrentModeKey] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // watch XP to detect “earned XP”
  const xpBaselineRef = useRef(0);
  const targetLangRef = useRef("es");

  // Mode labels from translations
  const modeLabels = useMemo(
    () => ({
      story:
        t("tabs_stories") ||
        uiCopy(uiLang, {
          en: "Stories",
          es: "Narrativos",
          it: "Storie",
          fr: "Histoires",
          ja: "ストーリー",
          ar: "القصص",
          zh: "故事",
        }),
      grammar:
        t("tabs_grammar") ||
        uiCopy(uiLang, {
          en: "Grammar",
          es: "Gramática",
          it: "Grammatica",
          fr: "Grammaire",
          ja: "文法",
          ar: "القواعد",
          zh: "语法",
        }),
      vocab:
        t("tabs_vocab") ||
        uiCopy(uiLang, {
          en: "Vocabulary",
          es: "Vocabulario",
          it: "Vocabolario",
          fr: "Vocabulaire",
          ja: "語彙",
          ar: "المفردات",
          zh: "词汇",
        }),
      reading:
        t("tabs_reading") ||
        uiCopy(uiLang, {
          en: "Reading",
          es: "Lectura",
          it: "Lettura",
          fr: "Lecture",
          ja: "読解",
          ar: "القراءة",
          zh: "阅读",
        }),
    }),
    [t, uiLang]
  );

  // subscribe to Firestore XP and drive randomization
  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = isSupportedPracticeLanguage(p.targetLang)
        ? normalizePracticeLanguage(p.targetLang, DEFAULT_TARGET_LANGUAGE)
        : DEFAULT_TARGET_LANGUAGE;
      const langXp = getLanguageXp(p, targetLang);
      const newXp = Number.isFinite(langXp) ? langXp : 0;
      const languageChanged = targetLangRef.current !== targetLang;

      targetLangRef.current = targetLang;
      setXp(newXp);
      setProgressPct(Math.min(100, newXp % 100));

      if (initializing) {
        xpBaselineRef.current = newXp;
        const keys = MODES.map((m) => m.key);
        const pick = keys[Math.floor(Math.random() * keys.length)];
        setCurrentModeKey(pick);
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
          uiCopy(uiLang, {
            en: "Nice job!",
            es: "¡Buen trabajo!",
            it: "Ottimo lavoro!",
            fr: "Bien joue !",
            ja: "よくできました！",
            ar: "شغل ممتاز!",
          });
        const desc =
          t("random_toast_desc", { xp: diff }) ||
          uiCopy(uiLang, {
            en: `You earned +${diff} XP.`,
            es: `Ganaste +${diff} XP.`,
            it: `Hai guadagnato +${diff} XP.`,
            fr: `Tu as gagne +${diff} XP.`,
            ja: `+${diff} XPを獲得しました。`,
            ar: `كسبت +${diff} XP.`,
          });

        toast({
          title,
          description: desc,
          status: "success",
          duration: 1800,
          isClosable: true,
          position: "top",
        });

        // Auto-pick the next randomized activity (different from current)
        const keys = MODES.map((m) => m.key).filter(
          (k) => k !== currentModeKey
        );
        const pick = keys[Math.floor(Math.random() * keys.length)];
        setCurrentModeKey(pick);

        // Optional: let child components know they can advance internally if needed
        try {
          window.dispatchEvent(
            new CustomEvent("randomize:advance", { detail: { xpGained: diff } })
          );
        } catch {}
      }
    });
    return () => unsub();
  }, [npub, currentModeKey, initializing, t, toast, uiLang]);

  const currentMode = useMemo(
    () =>
      currentModeKey
        ? { key: currentModeKey, label: modeLabels[currentModeKey] }
        : null,
    [currentModeKey, modeLabels]
  );

  const surpriseMe = () => {
    const keys = MODES.map((m) => m.key).filter((k) => k !== currentModeKey);
    const pick = keys[Math.floor(Math.random() * keys.length)];
    setCurrentModeKey(pick);
  };

  // Reused translated strings with safe fallbacks
  const STR = {
    level:
      t("grammar_badge_level", { level: levelNumber }) ||
      uiCopy(uiLang, {
        en: `Level ${levelNumber}`,
        es: `Nivel ${levelNumber}`,
        it: `Livello ${levelNumber}`,
        fr: `Niveau ${levelNumber}`,
        ja: `レベル ${levelNumber}`,
        ar: `المستوى ${levelNumber}`,
      }),
    xpBadge:
      t("grammar_badge_xp", { xp }) ||
      uiCopy(uiLang, {
        en: `XP ${xp}`,
        es: `XP ${xp}`,
        it: `XP ${xp}`,
        fr: `XP ${xp}`,
        ja: `XP ${xp}`,
        ar: `XP ${xp}`,
      }),
    shuffle:
      t("random_shuffle") ||
      uiCopy(uiLang, {
        en: "Shuffle",
        es: "Mezclar",
        it: "Mescola",
        fr: "Melanger",
        ja: "シャッフル",
        ar: "بدّل",
      }),
    picking:
      t("randomize_picking_surprise") ||
      uiCopy(uiLang, {
        en: "Picking a surprise for you...",
        es: "Eligiendo una sorpresa para ti...",
        it: "Scelta di una sorpresa per te...",
        fr: "Choix d'une surprise pour toi...",
        ja: "サプライズを選んでいます...",
        ar: "بنختار لك مفاجأة...",
      }),
    loading:
      t("generic_loading") ||
      uiCopy(uiLang, {
        en: "Loading...",
        es: "Cargando...",
        it: "Caricamento...",
        fr: "Chargement...",
        ja: "読み込み中...",
        ar: "جارٍ التحميل...",
      }),
  };

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

          {/* Right: Shuffle */}
          <HStack spacing={2}>
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
          <XpProgressHeader
            levelText={STR.level}
            xpText={STR.xpBadge}
            progressPct={progressPct}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box>
        <Suspense
          fallback={
            <HStack justify="center" py={12}>
              <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={32} />
            </HStack>
          }
        >
          {!currentMode ? (
            <HStack justify="center" py={12}>
              <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={32} />
              <Text color="white" ml={2}>
                {STR.picking}
              </Text>
            </HStack>
          ) : currentMode.key === "story" ? (
            <StoryMode
              userLanguage={uiLang}
              activeNpub={npub}
              activeNsec={nsec}
            />
          ) : currentMode.key === "grammar" ? (
            <GrammarBook
              userLanguage={uiLang}
              activeNpub={npub}
              activeNsec={nsec}
            />
          ) : currentMode.key === "vocab" ? (
            <Vocabulary
              userLanguage={uiLang}
              activeNpub={npub}
              activeNsec={nsec}
            />
          ) : (
            <History userLanguage={uiLang} />
          )}
        </Suspense>
      </Box>
    </Box>
  );
}
