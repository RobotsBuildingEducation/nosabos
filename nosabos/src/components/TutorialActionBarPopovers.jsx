import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Fade,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  ArrowBackIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { PiPath, PiUsersBold } from "react-icons/pi";
import { FiCompass } from "react-icons/fi";
import { RiBookmarkLine, RiRoadMapLine } from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { LuKey, LuKeyRound } from "react-icons/lu";
import { FaKey } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import { useThemeStore } from "../useThemeStore";
import { getLanguageDirection } from "../constants/languages";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Keep the tutorial card lively without scaling the layout box.
const glowKeyframes = keyframes`
  0%, 100% { opacity: 0.32; }
  50% { opacity: 0.58; }
`;

// Button explanations configuration - ordered left to right as they appear on skill tree
const BUTTON_EXPLANATIONS = [
  {
    id: "back",
    tutorialId: "back",
    icon: ArrowBackIcon,
    label: { en: "Back Button", es: "Botón Atrás", it: "Tasto Indietro", fr: "Bouton retour", ja: "戻るボタン", hi: "वापस बटन", ar: "زر الرجوع", zh: "返回按钮" },
    description: {
      en: "Returns you to the skill tree to choose another lesson",
      es: "Te regresa al árbol de habilidades para elegir otra lección",
      it: "Ti riporta all'albero delle abilità per scegliere un'altra lezione",
      fr: "Te ramene a l'arbre de competences pour choisir une autre lecon",
      ja: "スキルツリーに戻り、別のレッスンを選べます",
      hi: "यह आपको स्किल ट्री पर वापस ले जाता है ताकि आप दूसरा पाठ चुन सकें।",
      ar: "يرجّعك لشجرة المهارات عشان تختار درس تاني.",
      zh: "返回技能树，选择另一节课程。",
    },
    position: 0,
  },
  {
    id: "realWorldTasks",
    tutorialId: "teams",
    icon: FiCompass,
    label: { en: "Immersion Practice", es: "Práctica de Inmersión", it: "Pratica di Immersione", fr: "Pratique d'immersion", ja: "イマージョン練習", hi: "इमर्शन अभ्यास", ar: "تدريب الانغماس", zh: "沉浸练习" },
    description: {
      en: "Complete tasks outside of the app to immerse and practice the language.",
      es: "Completa tareas fuera de la app para sumergirte y practicar el idioma.",
      it: "Completa attività fuori dall'app per immergerti e praticare la lingua.",
      fr: "Complete des taches hors de l'app pour t'immerger et pratiquer la langue.",
      ja: "アプリの外でタスクを完了し、言語に浸って練習します。",
      hi: "ऐप के बाहर के काम पूरे करें ताकि आप भाषा में डूबकर उसका अभ्यास कर सकें।",
      ar: "كمّل مهام برّه التطبيق عشان تندمج في اللغة وتتدرّب عليها.",
      zh: "完成应用外任务，让自己沉浸并练习语言。",
    },
    position: 1,
  },
  {
    id: "settings",
    tutorialId: "settings",
    icon: SettingsIcon,
    label: { en: "Settings", es: "Configuración", it: "Impostazioni", fr: "Parametres", ja: "設定", hi: "सेटिंग्स", ar: "الإعدادات", zh: "设置" },
    description: {
      en: "Open settings and account tabs for your learning preferences, voice, and account details",
      es: "Abre las pestañas de configuración y cuenta para tus preferencias, voz y detalles de cuenta",
      it: "Apri le schede impostazioni e account per le preferenze, la voce e i dettagli dell'account",
      fr: "Ouvre les onglets parametres et compte pour tes preferences, ta voix et tes details de compte",
      ja: "学習設定、音声、アカウント詳細の設定とアカウントタブを開きます",
      hi: "अपनी सीखने की पसंद, आवाज़ और खाते की जानकारी के लिए सेटिंग्स और अकाउंट टैब खोलें।",
      ar: "افتح تبويبات الإعدادات والحساب عشان تظبط تفضيلاتك والصوت وبيانات الحساب.",
      zh: "打开设置和账户标签，调整学习偏好、声音和账户信息。",
    },
    position: 2,
  },
  {
    id: "notes",
    tutorialId: "notes",
    icon: RiBookmarkLine,
    label: { en: "Notes", es: "Notas", it: "Note", fr: "Notes", ja: "メモ", hi: "नोट्स", ar: "الملاحظات", zh: "笔记" },
    description: {
      en: "View your study notes. Notes can be created when you attempt or complete exercises and flashcards.",
      es: "Ve tus notas de estudio. Las notas se pueden crear cuando intentas o completas ejercicios y tarjetas de memoria.",
      it: "Visualizza le tue note di studio. Le note si creano quando esegui o completi esercizi e schede.",
      fr: "Consulte tes notes d'etude. Elles peuvent etre creees quand tu tentes ou termines des exercices et des cartes.",
      ja: "学習メモを表示します。練習やカードを試す・完了するとメモを作成できます。",
      hi: "अपने अध्ययन नोट्स देखें। नोट्स तब बन सकते हैं जब आप अभ्यासों और फ़्लैशकार्डों को आज़माते या पूरा करते हैं।",
      ar: "شوف ملاحظات المذاكرة بتاعتك. الملاحظات ممكن تتعمل لما تجرّب أو تكمّل التمارين والكروت.",
      zh: "查看学习笔记。尝试或完成练习和闪卡时可以创建笔记。",
    },
    position: 3,
  },
  {
    id: "help",
    tutorialId: "help",
    icon: MdOutlineSupportAgent,
    label: { en: "Assistant", es: "Asistente", it: "Assistente", fr: "Assistant", ja: "アシスタント", hi: "सहायक", ar: "المساعد", zh: "助手" },
    description: {
      en: "Get instant help and answers from our learning assistant",
      es: "Obtén ayuda instantánea y respuestas de nuestro asistente de aprendizaje IA",
      it: "Ottieni aiuto immediato e risposte dal nostro assistente di apprendimento",
      fr: "Obtiens une aide immediate et des reponses de notre assistant d'apprentissage",
      ja: "学習アシスタントからすぐに助けや答えを得られます",
      hi: "हमारे सीखने वाले सहायक से तुरंत मदद और उत्तर पाएँ।",
      ar: "خد مساعدة وإجابات فورية من مساعد التعلّم.",
      zh: "从学习助手那里即时获得帮助和答案。",
    },
    position: 5,
  },
  {
    id: "mode",
    tutorialId: "mode",
    icon: PiPath,
    label: { en: "Learning Mode", es: "Modo de Aprendizaje", it: "Modalità di Apprendimento", fr: "Mode d'apprentissage", ja: "学習モード", hi: "सीखने का मोड", ar: "وضع التعلّم", zh: "学习模式" },
    description: {
      en: "Switch between learning path, practice cards, and free conversation modes. The icon changes based on your current mode.",
      es: "Cambia entre la ruta de aprendizaje, tarjetas de práctica y modos de conversación libre. El icono cambia según tu modo actual.",
      it: "Passa tra percorso di apprendimento, schede di pratica e modalità di conversazione libera. L'icona cambia in base alla modalità attuale.",
      fr: "Passe entre le parcours, les cartes de pratique et les modes de conversation libre. L'icone change selon le mode actuel.",
      ja: "学習パス、練習カード、自由会話モードを切り替えます。現在のモードに応じてアイコンが変わります。",
      hi: "लर्निंग पाथ, अभ्यास कार्ड और मुक्त बातचीत मोड के बीच बदलें। आइकन आपके वर्तमान मोड के अनुसार बदलता है।",
      ar: "بدّل بين مسار التعلّم وكروت التدريب وأوضاع المحادثة الحرة. الأيقونة بتتغيّر حسب وضعك الحالي.",
      zh: "在学习路径、练习卡片和自由会话模式之间切换。图标会根据当前模式变化。",
    },
    position: 6,
  },
];

export default function TutorialActionBarPopovers({
  isActive = false,
  lang = "en",
  onComplete,
  isOnSkillTree = false, // When true, skip the "back" button explanation
}) {
  // Filter out the back button when on skill tree (no back button there)
  const activeExplanations = useMemo(
    () =>
      isOnSkillTree
        ? BUTTON_EXPLANATIONS.filter((btn) => btn.id !== "back")
        : BUTTON_EXPLANATIONS,
    [isOnSkillTree],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [arrowOffset, setArrowOffset] = useState(null);
  const popoverRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const isRtl = getLanguageDirection(lang) === "rtl";

  // Measure the target button and compute arrow position
  const measureArrow = useCallback(
    (step) => {
      const btn = activeExplanations[step];
      if (!btn) return;
      const el = document.querySelector(
        `[data-tutorial-id="${btn.tutorialId}"]`,
      );
      const popover = popoverRef.current;
      if (!el || !popover) return;
      const btnRect = el.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const arrowOffset = btnCenterX - popoverRect.left;
      const clamped = Math.max(
        20,
        Math.min(popoverRect.width - 20, arrowOffset),
      );
      setArrowOffset((prev) => {
        if (typeof prev === "number" && Math.abs(prev - clamped) < 0.5) {
          return prev;
        }
        return clamped;
      });
    },
    [activeExplanations],
  );

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setIsVisible(false);
      setArrowOffset(null);
      return;
    }
    setIsVisible(true);
  }, [isActive]);

  // Measure before paint so the arrow does not visibly "catch up" to each step.
  useLayoutEffect(() => {
    if (!isActive || !isVisible) return;
    measureArrow(currentStep);
    const frame = requestAnimationFrame(() => measureArrow(currentStep));

    const handleResize = () => {
      requestAnimationFrame(() => measureArrow(currentStep));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, isVisible, currentStep, measureArrow]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      playSound(selectSound);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < activeExplanations.length - 1) {
      playSound(selectSound);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = () => {
    playSound(submitActionSound);
    setIsVisible(false);

    onComplete();
  };

  if (!isActive || !isVisible) return null;

  const currentButton = activeExplanations[currentStep];
  if (!currentButton) return null;

  const Icon = currentButton.icon;
  const isChakraIcon =
    currentButton.id === "back" || currentButton.id === "settings";
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeExplanations.length - 1;
  const accentColor = isLightTheme ? "#6B6EF6" : "#8B5CF6";
  const accentGlow = isLightTheme
    ? "linear-gradient(135deg, rgba(107, 110, 246, 0.16) 0%, rgba(244, 114, 182, 0.1) 100%)"
    : "linear-gradient(135deg, rgba(34, 211, 238, 0.35) 0%, rgba(167, 139, 250, 0.28) 100%)";
  const popoverBackground = isLightTheme
    ? "linear-gradient(180deg, rgba(255, 251, 245, 0.98) 0%, rgba(247, 239, 226, 0.96) 100%)"
    : "linear-gradient(135deg, rgba(95, 51, 189, 0.95) 0%, rgba(131, 61, 244, 0.95) 100%)";
  const popoverBorder = isLightTheme ? APP_BORDER : "cyan";
  const popoverShadow = isLightTheme
    ? "0 18px 40px rgba(120, 94, 61, 0.18), 0 8px 22px rgba(107, 110, 246, 0.12)"
    : "0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)";
  const iconChipBackground = isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.200";
  const iconChipBorder = isLightTheme ? APP_BORDER : "transparent";
  const headingColor = isLightTheme ? APP_TEXT_PRIMARY : "white";
  const bodyColor = isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.900";
  const inactiveDotColor = isLightTheme ? APP_BORDER_STRONG : "whiteAlpha.400";
  const counterColor = isLightTheme ? APP_TEXT_MUTED : "whiteAlpha.800";
  const navButtonStyles = isLightTheme
    ? {
        bg: APP_SURFACE,
        color: accentColor,
        border: `1px solid ${APP_BORDER}`,
        boxShadow: "0px 3px 0px rgba(122, 94, 61, 0.22)",
        _hover: {
          bg: APP_SURFACE_ELEVATED,
          transform: "translateY(1px)",
          boxShadow: "0px 2px 0px rgba(122, 94, 61, 0.22)",
        },
        _active: {
          transform: "translateY(3px)",
          boxShadow: "0px 0px 0px rgba(122, 94, 61, 0.22)",
        },
      }
    : {
        color: "white",
        colorScheme: "purple",
      };
  const doneButtonStyles = isLightTheme
    ? {
        bg: "linear-gradient(135deg, #6B6EF6 0%, #8E73F3 100%)",
        color: "white",
        border: "none",
        boxShadow: "0px 4px 0px rgba(92, 86, 186, 0.45)",
        _hover: {
          bg: "linear-gradient(135deg, #6164ec 0%, #846ae9 100%)",
          transform: "translateY(1px)",
          boxShadow: "0px 3px 0px rgba(92, 86, 186, 0.45)",
        },
        _active: {
          transform: "translateY(4px)",
          boxShadow: "0px 0px 0px rgba(92, 86, 186, 0.45)",
        },
      }
    : {
        colorScheme: "purple",
      };

  return (
    <Box
      ref={popoverRef}
      position="fixed"
      bottom="90px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      w="90%"
      maxW="400px"
    >
      <Fade in={isVisible}>
        <Box
          position="relative"
          bg={popoverBackground}
          borderRadius="2xl"
          p={5}
          boxShadow={isLightTheme ? `${APP_SHADOW}, ${popoverShadow}` : popoverShadow}
          backdropFilter="blur(12px)"
          border={`1px solid ${popoverBorder}`}
          isolation="isolate"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-4px",
            borderRadius: "inherit",
            background: accentGlow,
            filter: isLightTheme ? "blur(22px)" : "blur(16px)",
            opacity: isLightTheme ? 0.46 : 0.32,
            zIndex: -1,
            pointerEvents: "none",
            animation: `${glowKeyframes} 2.4s ease-in-out infinite`,
          }}
        >
          <VStack spacing={3} align="center">
            {/* Icon and Label */}
            <HStack spacing={3}>
              <Box
                bg={iconChipBackground}
                border={isLightTheme ? `1px solid ${iconChipBorder}` : "none"}
                borderRadius="xl"
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isChakraIcon ? (
                  <Icon boxSize={6} color={headingColor} />
                ) : (
                  <Icon size={24} color={headingColor} />
                )}
              </Box>
              <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                {currentButton.label[lang] || currentButton.label.en}
              </Text>
            </HStack>

            {/* Description */}
            <Box
              minH="72px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={2}
            >
              <Text
                fontSize="sm"
                color={bodyColor}
                textAlign="center"
                lineHeight="1.5"
              >
                {currentButton.description[lang] || currentButton.description.en}
              </Text>
            </Box>

            {/* Progress dots */}
            <HStack spacing={2} mt={2}>
              {activeExplanations.map((_, index) => (
                <Box
                  key={index}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={index === currentStep ? accentColor : inactiveDotColor}
                  transition="background 0.3s ease"
                />
              ))}
            </HStack>

            {/* Navigation buttons */}
            <HStack spacing={3} mt={2} w="100%" justify="center">
              <IconButton
                icon={
                  isRtl ? (
                    <ChevronRightIcon boxSize={5} />
                  ) : (
                    <ChevronLeftIcon boxSize={5} />
                  )
                }
                onClick={handlePrevious}
                isDisabled={isFirstStep}
                aria-label={
                  lang === "ja"
                    ? "前へ"
                    : lang === "zh"
                    ? "上一步"
                    : lang === "ar"
                    ? "السابق"
                    : lang === "fr"
                    ? "Precedent"
                    : lang === "hi"
                    ? "पिछला"
                    : lang === "pt"
                    ? "Anterior"
                    : lang === "es"
                    ? "Anterior"
                    : lang === "it"
                    ? "Precedente"
                    : "Previous"
                }
                size="sm"
                {...navButtonStyles}
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              />

              <Text
                fontSize="xs"
                color={counterColor}
                minW="60px"
                textAlign="center"
              >
                {currentStep + 1} / {activeExplanations.length}
              </Text>

              {isLastStep ? (
                <Button
                  size="sm"
                  onClick={handleFinish}
                  px={4}
                  {...doneButtonStyles}
                >
                  {lang === "ja"
                    ? "完了"
                    : lang === "zh"
                    ? "完成"
                    : lang === "ar"
                    ? "تم"
                    : lang === "fr"
                    ? "Termine"
                    : lang === "hi"
                    ? "पूरा"
                    : lang === "pt"
                    ? "Concluir"
                    : lang === "es"
                    ? "Listo"
                    : lang === "it"
                    ? "Fatto"
                    : "Done"}
                </Button>
              ) : (
                <IconButton
                  icon={
                    isRtl ? (
                      <ChevronLeftIcon boxSize={5} />
                    ) : (
                      <ChevronRightIcon boxSize={5} />
                    )
                  }
                  onClick={handleNext}
                  aria-label={
                    lang === "ja"
                      ? "次へ"
                      : lang === "zh"
                      ? "下一步"
                      : lang === "ar"
                      ? "التالي"
                      : lang === "fr"
                      ? "Suivant"
                      : lang === "hi"
                      ? "अगला"
                      : lang === "pt"
                      ? "Proximo"
                      : lang === "es"
                      ? "Siguiente"
                      : lang === "it"
                      ? "Avanti"
                      : "Next"
                  }
                  size="sm"
                  {...navButtonStyles}
                />
              )}
            </HStack>
          </VStack>

          {/* Arrow pointing down to target button */}
          <Box
            position="absolute"
            bottom="-10px"
            left={arrowOffset == null ? "50%" : "0"}
            transform={
              arrowOffset == null
                ? "translateX(-12px)"
                : `translateX(${arrowOffset - 12}px)`
            }
            w={0}
            h={0}
            borderLeft="12px solid transparent"
            borderRight="12px solid transparent"
            borderTop={`12px solid ${isLightTheme ? "rgba(247, 239, 226, 0.98)" : "rgba(139, 92, 246, 0.95)"}`}
            filter={
              isLightTheme
                ? "drop-shadow(0 6px 8px rgba(120, 94, 61, 0.18))"
                : "none"
            }
            transition="transform 0.22s ease"
            willChange="transform"
          />
        </Box>
      </Fade>
    </Box>
  );
}
