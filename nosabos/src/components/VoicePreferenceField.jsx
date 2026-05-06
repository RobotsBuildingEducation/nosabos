import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  HStack,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Spinner,
  Text,
  Textarea,
  VStack,
  Button,
  useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaFemale, FaMale } from "react-icons/fa";
import {
  getTTSPlayer,
  getTTSVoiceOption,
  normalizeTTSVoice,
  primeTTSAudio,
  stopTTSPlayback,
  TTS_LANG_TAG,
  TTS_VOICE_OPTIONS,
  warmRealtimeTTS,
} from "../utils/tts";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

const VOICE_PREVIEW_TEXT = {
  ar: "أهلا، سنتدرب معا.",
  de: "Hallo, wir ueben zusammen.",
  el: "Γεια σου, ας εξασκηθούμε μαζί.",
  en: "Hi, I am ready to practice with you.",
  es: "Hola, vamos a practicar juntos.",
  fr: "Bonjour, on va pratiquer ensemble.",
  ga: "Dia duit, cleachtfaimid le cheile.",
  hi: "नमस्ते, चलो साथ अभ्यास करें.",
  it: "Ciao, pratichiamo insieme.",
  ja: "こんにちは。一緒に練習しましょう。",
  nah: "Hola, vamos a practicar juntos.",
  nl: "Hallo, we oefenen samen.",
  pl: "Czesc, pocwiczmy razem.",
  pt: "Ola, vamos praticar juntos.",
  ru: "Привет, давай потренируемся.",
  yua: "Hola, vamos a practicar juntos.",
  zh: "你好，我们一起练习吧。",
};

const VOICE_PREVIEW_LINES = {
  alloy: {
    en: "I'll keep things clear and steady while you practice.",
    es: "Mantendré la práctica clara y estable para ti.",
    pt: "Vou manter a prática clara e equilibrada para você.",
    it: "Terrò la pratica chiara e stabile per te.",
    fr: "Je garde la pratique claire et stable pour toi.",
    de: "Ich halte das Training klar und ausgeglichen.",
    ja: "はっきり落ち着いた声で練習を支えます。",
    hi: "मैं अभ्यास को साफ़ और संतुलित रखूँगी।",
    ar: "هخلّي التمرين واضح ومتوازن.",
    zh: "我会用清楚稳定的声音陪你练习。",
  },
  coral: {
    en: "I'll bring a bright, friendly spark to each practice round.",
    es: "Le daré a cada práctica un toque brillante y amable.",
    pt: "Vou trazer um toque claro e amigável para cada prática.",
    it: "Porterò una scintilla vivace e amichevole a ogni pratica.",
    fr: "J'apporte une touche claire et amicale a chaque pratique.",
    de: "Ich bringe eine helle, freundliche Note in jede Übung.",
    ja: "明るく親しみやすい声で練習を進めます。",
    hi: "मैं हर अभ्यास में चमकदार और दोस्ताना ऊर्जा लाऊँगी।",
    ar: "هضيف لكل تمرين لمسة مشرقة وودودة.",
    zh: "我会用明亮友好的语气陪你练习。",
  },
  ash: {
    en: "I'll keep a calm pace and give you room to think.",
    es: "Iré con calma y te daré espacio para pensar.",
    pt: "Vou manter um ritmo calmo e dar espaço para você pensar.",
    it: "Terrò un ritmo calmo e ti darò spazio per pensare.",
    fr: "Je garde un rythme calme pour te laisser reflechir.",
    de: "Ich halte ein ruhiges Tempo und lasse dir Zeit zum Denken.",
    ja: "落ち着いたペースで、考える時間を作ります。",
    hi: "मैं शांत गति रखूँगी और सोचने की जगह दूँगी।",
    ar: "هحافظ على إيقاع هادي وأديك وقت تفكر.",
    zh: "我会保持平静节奏，给你思考的空间。",
  },
  shimmer: {
    en: "I'll keep things light, upbeat, and easy to follow.",
    es: "Haré que todo se sienta ligero, animado y fácil de seguir.",
    pt: "Vou deixar tudo leve, animado e fácil de acompanhar.",
    it: "Renderò tutto leggero, allegro e facile da seguire.",
    fr: "Je rends la pratique legere, dynamique et facile a suivre.",
    de: "Ich halte alles leicht, lebendig und gut verständlich.",
    ja: "やわらかく軽快に、わかりやすく進めます。",
    hi: "मैं अभ्यास को हल्का, उत्साहित और आसान रखूँगी।",
    ar: "هخلّي التمرين خفيف ومبهج وسهل المتابعة.",
    zh: "我会让练习轻快、积极又容易跟上。",
  },
  ballad: {
    en: "I'll add a smooth, story-like rhythm to your practice.",
    es: "Le daré a tu práctica un ritmo fluido, como una historia.",
    pt: "Vou dar à sua prática um ritmo fluido, como uma história.",
    it: "Darò alla pratica un ritmo fluido, quasi narrativo.",
    fr: "Je donne a ta pratique un rythme fluide, presque narratif.",
    de: "Ich gebe deinem Training einen weichen, erzählerischen Rhythmus.",
    ja: "物語のようになめらかなリズムで練習します。",
    hi: "मैं अभ्यास में कहानी जैसा मुलायम लय जोड़ूँगी।",
    ar: "هدي تمرينك إيقاع سلس كأنه حكاية.",
    zh: "我会用流畅、有故事感的节奏陪你练习。",
  },
  sage: {
    en: "I'll guide you with a warm, thoughtful tone.",
    es: "Te guiaré con un tono cálido y reflexivo.",
    pt: "Vou guiar você com um tom acolhedor e cuidadoso.",
    it: "Ti guiderò con un tono caldo e riflessivo.",
    fr: "Je te guide avec une voix chaleureuse et posee.",
    de: "Ich begleite dich mit einem warmen, bedachten Ton.",
    ja: "温かく落ち着いた声で丁寧に導きます。",
    hi: "मैं गर्मजोशी भरे और सोच-समझकर बोले गए स्वर में मार्गदर्शन करूँगी।",
    ar: "هرشدك بنبرة دافئة ومتزنة.",
    zh: "我会用温暖沉稳的语气引导你。",
  },
  cedar: {
    en: "I'll keep the session grounded with a deeper, steady sound.",
    es: "Mantendré la sesión firme con una voz profunda y estable.",
    pt: "Vou manter a sessão firme com uma voz profunda e estável.",
    it: "Terrò la sessione ben salda con una voce profonda e stabile.",
    fr: "Je garde la session bien ancree avec une voix profonde et stable.",
    de: "Ich halte die Sitzung mit einer tiefen, festen Stimme geerdet.",
    ja: "深く安定した声で、練習をしっかり支えます。",
    hi: "मैं गहरी और स्थिर आवाज़ से सत्र को संभालूँगी।",
    ar: "هحافظ على الجلسة ثابتة بصوت أعمق وراسي.",
    zh: "我会用低沉稳定的声音让练习更踏实。",
  },
  marin: {
    en: "I'll keep practice cheerful, warm, and encouraging.",
    es: "Mantendré la práctica alegre, cálida y motivadora.",
    pt: "Vou manter a prática alegre, acolhedora e motivadora.",
    it: "Terrò la pratica solare, calda e incoraggiante.",
    fr: "Je garde la pratique joyeuse, chaleureuse et encourageante.",
    de: "Ich halte das Training fröhlich, warm und ermutigend.",
    ja: "明るく温かい声で、前向きに応援します。",
    hi: "मैं अभ्यास को खुशमिजाज, गर्मजोशी भरा और प्रेरक रखूँगी।",
    ar: "هخلي التمرين مرح ودافي ومشجع.",
    zh: "我会让练习轻松温暖，也更有鼓励感。",
  },
  echo: {
    en: "I'll keep feedback crisp, energetic, and direct.",
    es: "Haré que la retroalimentación sea clara, enérgica y directa.",
    pt: "Vou deixar o feedback nítido, energético e direto.",
    it: "Darò feedback nitidi, energici e diretti.",
    fr: "Je donne des retours nets, energiques et directs.",
    de: "Ich gebe klares, energiegeladenes und direktes Feedback.",
    ja: "歯切れよく、エネルギッシュにフィードバックします。",
    hi: "मैं प्रतिक्रिया को स्पष्ट, ऊर्जावान और सीधा रखूँगी।",
    ar: "هديك ملاحظات واضحة وحيوية ومباشرة.",
    zh: "我会给你清晰、有活力、直接的反馈。",
  },
  verse: {
    en: "I'll make each phrase expressive, clear, and easy to repeat.",
    es: "Haré que cada frase sea expresiva, clara y fácil de repetir.",
    pt: "Vou deixar cada frase expressiva, clara e fácil de repetir.",
    it: "Renderò ogni frase espressiva, chiara e facile da ripetere.",
    fr: "Je rends chaque phrase expressive, claire et facile a repeter.",
    de: "Ich mache jeden Satz ausdrucksstark, klar und leicht zu wiederholen.",
    ja: "表現豊かで明瞭に、繰り返しやすく話します。",
    hi: "मैं हर वाक्य को अभिव्यक्तिपूर्ण, साफ़ और दोहराने में आसान बनाऊँगी।",
    ar: "هخلي كل جملة معبرة وواضحة وسهلة التكرار.",
    zh: "我会让每句话表达清楚，也更容易跟读。",
  },
};

function getVoicePreviewText(voiceValue, language) {
  const normalizedVoice = normalizeTTSVoice(voiceValue);
  const voiceLines = VOICE_PREVIEW_LINES[normalizedVoice];
  return (
    voiceLines?.[language] ||
    voiceLines?.en ||
    VOICE_PREVIEW_TEXT[language] ||
    VOICE_PREVIEW_TEXT.en
  );
}

function titleCaseVoice(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Alloy";
}

function VoiceTypeIcon({ type, boxSize = 4 }) {
  const Icon = type === "girl" ? FaFemale : FaMale;
  return (
    <Box
      as={Icon}
      aria-hidden="true"
      boxSize={boxSize}
      color={type === "girl" ? "pink.200" : "cyan.200"}
      flexShrink={0}
    />
  );
}

function getPreviewLanguage(targetLang, supportLang) {
  const normalizedSupport = normalizeSupportLanguage(
    supportLang,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  if (TTS_LANG_TAG[normalizedSupport]) return normalizedSupport;

  const normalizedTarget = normalizePracticeLanguage(
    targetLang,
    DEFAULT_TARGET_LANGUAGE,
  );
  if (TTS_LANG_TAG[normalizedTarget]) return normalizedTarget;

  return DEFAULT_TARGET_LANGUAGE;
}

function isExpectedPreviewInterruption(error) {
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || error || "").toLowerCase();
  return (
    name === "aborterror" ||
    message.includes("interrupted by a call to pause") ||
    message.includes("play() request was interrupted") ||
    message.includes("interrupted by a new load request")
  );
}

export default function VoicePreferenceField({
  t = {},
  voice,
  voicePersona,
  targetLang,
  supportLang,
  onVoiceChange,
  onVoicePersonaChange,
  onSelectSound,
  menuListMotionProps,
  heading,
  description,
  personaPlaceholder,
}) {
  const toast = useToast();
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const previewPlayerRef = useRef(null);
  const previewRequestIdRef = useRef(0);
  const previewTimeoutRef = useRef(null);
  const personaDraftRef = useRef(voicePersona || "");
  const mountedRef = useRef(true);

  const selectedVoice = useMemo(() => getTTSVoiceOption(voice), [voice]);
  const previewLanguage = useMemo(
    () => getPreviewLanguage(targetLang, supportLang),
    [supportLang, targetLang],
  );
  const voiceLabel = t.settings_voice || t.onboarding_voice_title || "Voice";
  const personaLabel =
    t.ra_persona_label ||
    t.onboarding_voice_persona_label ||
    "Voice personality";

  const getVoiceLabel = useCallback(
    (value) => t[`onboarding_voice_${value}`] || titleCaseVoice(value),
    [t],
  );
  const getVoiceDescription = useCallback(
    (option) =>
      t[`onboarding_voice_${option.value}_description`] ||
      t[`settings_voice_${option.value}_description`] ||
      option.description,
    [t],
  );

  useEffect(() => {
    personaDraftRef.current = voicePersona || "";
  }, [voicePersona]);

  const clearPreviewTimeout = useCallback(() => {
    if (!previewTimeoutRef.current) return;
    clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = null;
  }, []);

  const stopPreview = useCallback(() => {
    clearPreviewTimeout();
    const current = previewPlayerRef.current;
    previewPlayerRef.current = null;
    if (!current) return;
    stopTTSPlayback(current.audio);
    try {
      current.cleanup?.();
    } catch {
      // The active audio element may already have been cleaned up by playback.
    }
  }, [clearPreviewTimeout]);

  useEffect(() => {
    mountedRef.current = true;
    void warmRealtimeTTS();
    return () => {
      mountedRef.current = false;
      stopPreview();
    };
  }, [stopPreview]);

  const playVoicePreview = useCallback(async (voiceValue, personaValue) => {
    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;
    const previewVoice = normalizeTTSVoice(voiceValue);
    const previewPersona = String(personaValue ?? personaDraftRef.current);
    const warmAudioPromise = primeTTSAudio();
    stopPreview();
    setIsTestingVoice(true);
    previewTimeoutRef.current = setTimeout(() => {
      if (previewRequestIdRef.current !== requestId || !mountedRef.current) {
        return;
      }
      previewRequestIdRef.current = requestId + 1;
      stopPreview();
      setIsTestingVoice(false);
    }, 9000);
    try {
      const player = await getTTSPlayer({
        text: getVoicePreviewText(previewVoice, previewLanguage),
        voice: previewVoice,
        personality: previewPersona,
        langTag: TTS_LANG_TAG[previewLanguage] || TTS_LANG_TAG.es,
        warmAudio: await warmAudioPromise.catch(() => null),
      });
      if (previewRequestIdRef.current !== requestId || !mountedRef.current) {
        player.cleanup?.();
        return;
      }
      previewPlayerRef.current = player;
      const markStarted = () => {
        if (
          previewRequestIdRef.current === requestId &&
          previewPlayerRef.current === player &&
          mountedRef.current
        ) {
          clearPreviewTimeout();
          setIsTestingVoice(false);
        }
      };
      const finish = () => {
        if (
          previewRequestIdRef.current === requestId &&
          previewPlayerRef.current === player &&
          mountedRef.current
        ) {
          clearPreviewTimeout();
          previewPlayerRef.current = null;
          setIsTestingVoice(false);
        }
      };
      player.audio.addEventListener("play", markStarted, { once: true });
      player.audio.addEventListener("playing", markStarted, { once: true });
      player.audio.addEventListener("ended", finish, { once: true });
      player.audio.addEventListener("error", finish, { once: true });
      void player.finalize?.finally(finish)?.catch(() => {});
      await player.ready;
      markStarted();
      await player.audio.play();
      markStarted();
    } catch (error) {
      if (previewRequestIdRef.current === requestId && mountedRef.current) {
        clearPreviewTimeout();
        setIsTestingVoice(false);
      }
      if (
        previewRequestIdRef.current === requestId &&
        mountedRef.current &&
        !isExpectedPreviewInterruption(error)
      ) {
        toast({
          status: "error",
          title: t.tts_preview_failed || "Voice preview failed",
          description: String(error?.message || error),
        });
      }
    }
  }, [
    clearPreviewTimeout,
    previewLanguage,
    stopPreview,
    t,
    toast,
  ]);

  const handleVoiceSelect = useCallback(
    (value) => {
      const nextVoice = normalizeTTSVoice(value);
      const nextPersona = String(personaDraftRef.current || "").slice(0, 240);
      onSelectSound?.();
      void warmRealtimeTTS();
      void primeTTSAudio();
      onVoiceChange?.(nextVoice, nextPersona);
      void playVoicePreview(nextVoice, nextPersona);
    },
    [onSelectSound, onVoiceChange, playVoicePreview],
  );

  const handleVoiceMenuOpen = useCallback(() => {
    onSelectSound?.();
    void warmRealtimeTTS();
    void primeTTSAudio();
  }, [onSelectSound]);

  const handlePersonaChange = useCallback(
    (event) => {
      const next = event.target.value.slice(0, 240);
      personaDraftRef.current = next;
      onVoicePersonaChange?.(next);
    },
    [onVoicePersonaChange],
  );

  return (
    <Box bg="gray.800" p={3} rounded="md">
      <VStack align="stretch" spacing={3}>
        {(heading || description) && (
          <Box>
            {heading && (
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {heading}
              </Text>
            )}
            {description && (
              <Text fontSize="xs" opacity={0.7}>
                {description}
              </Text>
            )}
          </Box>
        )}

        <Box>
          <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={1}>
            {voiceLabel}
          </Text>
          <Menu autoSelect={false} isLazy matchWidth onOpen={handleVoiceMenuOpen}>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              size="sm"
              borderColor="gray.700"
              bg="gray.800"
              _hover={{ bg: "gray.750" }}
              _active={{ bg: "gray.750" }}
              w="100%"
              textAlign="left"
              padding={5}
              onClick={handleVoiceMenuOpen}
            >
              <HStack spacing={2} minW={0}>
                {isTestingVoice ? (
                  <Spinner size="xs" flexShrink={0} />
                ) : (
                  <VoiceTypeIcon type={selectedVoice.type} />
                )}
                <Text as="span" noOfLines={1}>
                  {getVoiceLabel(selectedVoice.value)}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList
              borderColor="gray.700"
              bg="gray.900"
              minW="100%"
              w="100%"
              maxH="300px"
              overflowX="hidden"
              overflowY="auto"
              motionProps={menuListMotionProps}
              sx={{
                boxSizing: "border-box",
                "&::-webkit-scrollbar": { width: "8px" },
                "&::-webkit-scrollbar:horizontal": { height: 0 },
                "&::-webkit-scrollbar-track": {
                  bg: "gray.800",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  bg: "gray.600",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": { bg: "gray.500" },
              }}
            >
              <Box
                px={3}
                pt={2}
                pb={1}
                fontSize="xs"
                fontWeight="semibold"
                color="gray.300"
              >
                {voiceLabel}
              </Box>
              <MenuOptionGroup
                type="radio"
                value={selectedVoice.value}
              >
                {TTS_VOICE_OPTIONS.map((option) => {
                  const isSelected = option.value === selectedVoice.value;
                  return (
                    <MenuItemOption
                      key={option.value}
                      value={option.value}
                      px={4}
                      py={3}
                      mx={2}
                      my={0.5}
                      w="calc(100% - 16px)"
                      boxSizing="border-box"
                      borderRadius="md"
                      color={isSelected ? "white" : "gray.100"}
                      bg={isSelected ? "teal.700" : "transparent"}
                      _hover={{
                        bg: isSelected ? "teal.600" : "gray.800",
                      }}
                      _focus={{
                        bg: isSelected ? "teal.600" : "gray.800",
                      }}
                      _checked={{
                        bg: "teal.700",
                        color: "white",
                      }}
                      onClick={() => handleVoiceSelect(option.value)}
                    >
                      <HStack spacing={3} minW={0} align="center">
                        <VoiceTypeIcon type={option.type} />
                        <Box minW={0}>
                          <Text as="span" display="block" noOfLines={1}>
                            {getVoiceLabel(option.value)}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={isSelected ? "teal.50" : "gray.300"}
                            lineHeight="1.2"
                            noOfLines={1}
                          >
                            {getVoiceDescription(option)}
                          </Text>
                        </Box>
                      </HStack>
                    </MenuItemOption>
                  );
                })}
              </MenuOptionGroup>
            </MenuList>
          </Menu>
        </Box>

        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="sm">{personaLabel}</Text>
          </HStack>
          <Textarea
            value={voicePersona || ""}
            onChange={handlePersonaChange}
            bg="gray.700"
            placeholder={personaPlaceholder}
            rows={3}
            resize="vertical"
          />
        </Box>
      </VStack>
    </Box>
  );
}
