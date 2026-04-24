// src/components/ConversationSettingsDrawer.jsx
import React, { useCallback, useMemo } from "react";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Textarea,
  VStack,
  Button,
  Badge,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

// CEFR level information (matches CEFR_LEVEL_INFO from FlashcardSkillTree)
const CEFR_LEVELS = [
  {
    level: "Pre-A1",
    name: {
      en: "Foundations",
      es: "Fundamentos",
      pt: "Fundamentos",
      it: "Fondamenti",
      fr: "Fondations",
      ja: "基礎",
      hi: "नींव",
      ar: "الأساسيات",
    },
    description: {
      en: "First words and phrases",
      es: "Primeras palabras y frases",
      pt: "Primeiras palavras e frases",
      it: "Prime parole e frasi",
      fr: "Premiers mots et phrases",
      ja: "最初の単語とフレーズ",
      hi: "पहले शब्द और वाक्यांश",
      ar: "أول كلمات وعبارات",
    },
    color: "#8B5CF6",
  },
  {
    level: "A1",
    name: {
      en: "Beginner",
      es: "Principiante",
      pt: "Iniciante",
      it: "Principiante",
      fr: "Debutant",
      ja: "初心者",
      hi: "शुरुआती",
      ar: "مبتدئ",
    },
    description: {
      en: "Basic survival language",
      es: "Lenguaje básico de supervivencia",
      pt: "Linguagem básica de sobrevivência",
      it: "Lingua essenziale di base",
      fr: "Langue essentielle de base",
      ja: "基本的なサバイバル表現",
      hi: "बुनियादी रोज़मर्रा की भाषा",
      ar: "لغة أساسية للحياة اليومية",
    },
    color: "#3B82F6",
  },
  {
    level: "A2",
    name: {
      en: "Elementary",
      es: "Elemental",
      pt: "Elementar",
      it: "Elementare",
      fr: "Elementaire",
      ja: "初級",
      hi: "प्रारंभिक",
      ar: "أساسي",
    },
    description: {
      en: "Simple everyday communication",
      es: "Comunicación cotidiana simple",
      pt: "Comunicação cotidiana simples",
      it: "Comunicazione quotidiana semplice",
      fr: "Communication simple du quotidien",
      ja: "簡単な日常コミュニケーション",
      hi: "सरल दैनिक संवाद",
      ar: "تواصل يومي بسيط",
    },
    color: "#8B5CF6",
  },
  {
    level: "B1",
    name: {
      en: "Intermediate",
      es: "Intermedio",
      pt: "Intermediário",
      it: "Intermedio",
      fr: "Intermediaire",
      ja: "中級",
      hi: "मध्यम",
      ar: "متوسط",
    },
    description: {
      en: "Handle everyday situations",
      es: "Manejo de situaciones cotidianas",
      pt: "Lidar com situações do dia a dia",
      it: "Gestire situazioni quotidiane",
      fr: "Gerer les situations quotidiennes",
      ja: "日常場面に対応",
      hi: "रोज़मर्रा की स्थितियाँ संभालना",
      ar: "التعامل مع مواقف الحياة اليومية",
    },
    color: "#A855F7",
  },
  {
    level: "B2",
    name: {
      en: "Upper Intermediate",
      es: "Intermedio Alto",
      pt: "Intermediário avançado",
      it: "Intermedio alto",
      fr: "Intermediaire avance",
      ja: "中上級",
      hi: "उच्च मध्यम",
      ar: "متوسط متقدم",
    },
    description: {
      en: "Complex discussions",
      es: "Discusiones complejas",
      pt: "Discussões complexas",
      it: "Discussioni complesse",
      fr: "Discussions complexes",
      ja: "複雑な話し合い",
      hi: "जटिल चर्चाएँ",
      ar: "مناقشات معقدة",
    },
    color: "#F97316",
  },
  {
    level: "C1",
    name: {
      en: "Advanced",
      es: "Avanzado",
      pt: "Avançado",
      it: "Avanzato",
      fr: "Avance",
      ja: "上級",
      hi: "उन्नत",
      ar: "متقدم",
    },
    description: {
      en: "Sophisticated language use",
      es: "Uso sofisticado del idioma",
      pt: "Uso sofisticado do idioma",
      it: "Uso sofisticato della lingua",
      fr: "Usage sophistique de la langue",
      ja: "洗練された言語運用",
      hi: "परिष्कृत भाषा प्रयोग",
      ar: "استخدام متقن للغة",
    },
    color: "#EF4444",
  },
  {
    level: "C2",
    name: {
      en: "Mastery",
      es: "Maestría",
      pt: "Domínio",
      it: "Padronanza",
      fr: "Maitrise",
      ja: "熟達",
      hi: "निपुणता",
      ar: "إتقان",
    },
    description: {
      en: "Near-native proficiency",
      es: "Competencia casi nativa",
      pt: "Proficiência quase nativa",
      it: "Competenza quasi nativa",
      fr: "Competence quasi native",
      ja: "ネイティブに近い熟達度",
      hi: "लगभग मातृभाषी दक्षता",
      ar: "طلاقة قريبة من المتحدث الأصلي",
    },
    color: "#EC4899",
  },
];

function getConversationSettingsUi(lang) {
  const copy = {
    en: {
      title: "Conversation Settings",
      proficiencyLabel: "Proficiency Level",
      proficiencyHint: "Set the difficulty level for conversation topics",
      pronunciationLabel: "Pronunciation Practice",
      pronunciationHint: "AI will help you improve pronunciation of words",
      subjectLabel: "Custom Topics",
      subjectHint:
        "Define subjects you want to practice (e.g., medical terms, business, travel)",
      subjectPlaceholder:
        "e.g., I'm a doctor and want to practice medical conversations with patients...",
      save: "Save",
      close: "Close",
    },
    es: {
      title: "Configuración de Conversación",
      proficiencyLabel: "Nivel de Competencia",
      proficiencyHint:
        "Establece el nivel de dificultad para los temas de conversación",
      pronunciationLabel: "Práctica de Pronunciación",
      pronunciationHint: "La IA te ayudará a mejorar la pronunciación",
      subjectLabel: "Temas Personalizados",
      subjectHint:
        "Define los temas que quieres practicar (ej: términos médicos, negocios, viajes)",
      subjectPlaceholder:
        "ej: Soy médico y quiero practicar conversaciones médicas con pacientes...",
      save: "Guardar",
      close: "Cerrar",
    },
    it: {
      title: "Impostazioni conversazione",
      proficiencyLabel: "Livello di competenza",
      proficiencyHint:
        "Imposta il livello di difficoltà per i temi di conversazione",
      pronunciationLabel: "Pratica pronuncia",
      pronunciationHint: "L'IA ti aiuterà a migliorare la pronuncia",
      subjectLabel: "Temi personalizzati",
      subjectHint:
        "Definisci i temi che vuoi praticare (es. medicina, lavoro, viaggi)",
      subjectPlaceholder:
        "es. Sono medico e voglio praticare conversazioni con i pazienti...",
      save: "Salva",
      close: "Chiudi",
    },
    fr: {
      title: "Parametres de conversation",
      proficiencyLabel: "Niveau de competence",
      proficiencyHint:
        "Definis le niveau de difficulte des sujets de conversation",
      pronunciationLabel: "Pratique de prononciation",
      pronunciationHint: "L'IA t'aidera a ameliorer ta prononciation",
      subjectLabel: "Sujets personnalises",
      subjectHint:
        "Definis les sujets que tu veux pratiquer (ex. medecine, travail, voyage)",
      subjectPlaceholder:
        "ex. Je suis medecin et je veux pratiquer des conversations avec des patients...",
      save: "Enregistrer",
      close: "Fermer",
    },
    ja: {
      title: "会話設定",
      proficiencyLabel: "熟達度レベル",
      proficiencyHint: "会話トピックの難易度を設定します",
      pronunciationLabel: "発音練習",
      pronunciationHint: "AIが発音改善をサポートします",
      subjectLabel: "カスタムトピック",
      subjectHint:
        "練習したいテーマを指定します（例: 医療用語、ビジネス、旅行）",
      subjectPlaceholder:
        "例: 私は医師で、患者との医療会話を練習したいです...",
      save: "保存",
      close: "閉じる",
    },
    pt: {
      title: "Configurações da conversa",
      proficiencyLabel: "Nível de proficiência",
      proficiencyHint: "Defina o nível de dificuldade dos temas de conversa",
      pronunciationLabel: "Prática de pronúncia",
      pronunciationHint: "A IA vai ajudar você a melhorar a pronúncia",
      subjectLabel: "Tópicos personalizados",
      subjectHint:
        "Defina os temas que você quer praticar (ex.: medicina, trabalho, viagens)",
      subjectPlaceholder:
        "ex.: Sou médica e quero praticar conversas médicas com pacientes...",
      save: "Salvar",
      close: "Fechar",
    },
    hi: {
      title: "बातचीत सेटिंग्स",
      proficiencyLabel: "दक्षता स्तर",
      proficiencyHint: "बातचीत के विषयों की कठिनाई तय करें",
      pronunciationLabel: "उच्चारण अभ्यास",
      pronunciationHint: "AI आपकी उच्चारण सुधारने में मदद करेगा",
      subjectLabel: "कस्टम विषय",
      subjectHint:
        "वे विषय लिखें जिनका आप अभ्यास करना चाहते हैं (जैसे: चिकित्सा, काम, यात्रा)",
      subjectPlaceholder:
        "जैसे: मैं डॉक्टर हूँ और मरीजों के साथ बातचीत का अभ्यास करना चाहता/चाहती हूँ...",
      save: "सहेजें",
      close: "बंद करें",
    },
    ar: {
      title: "إعدادات المحادثة",
      proficiencyLabel: "مستوى الكفاءة",
      proficiencyHint: "حدّد درجة صعوبة مواضيع المحادثة",
      pronunciationLabel: "تدريب النطق",
      pronunciationHint: "الذكاء الاصطناعي هيساعدك تحسّن النطق",
      subjectLabel: "مواضيع مخصصة",
      subjectHint:
        "اكتب المواضيع اللي عايز تتدرّب عليها (مثال: طب، شغل، سفر)",
      subjectPlaceholder:
        "مثال: أنا دكتور وعايز أتدرّب على محادثات طبية مع المرضى...",
      save: "حفظ",
      close: "إغلاق",
    },
  };

  return copy[lang] || copy.en;
}

export function ConversationSettingsPanel({
  settings,
  onSettingsChange,
  supportLang = "en",
  onClose,
  onSave,
  showActions = true,
}) {
  const lang = normalizeSupportLanguage(supportLang, DEFAULT_SUPPORT_LANGUAGE);
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  const currentLevel =
    CEFR_LEVELS.find((l) => l.level === settings.proficiencyLevel) ||
    CEFR_LEVELS[0];

  const handleLevelChange = (level) => {
    playSound(selectSound);
    onSettingsChange({ ...settings, proficiencyLevel: level });
  };

  const handlePronunciationChange = (checked) => {
    playSound(selectSound);
    onSettingsChange({ ...settings, practicePronunciation: checked });
  };

  const handleSubjectChange = (e) => {
    onSettingsChange({ ...settings, conversationSubjects: e.target.value });
  };

  const handleSave = useCallback(() => {
    playSound(submitActionSound);
    onSave?.();
  }, [onSave, playSound]);

  const handleClose = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);

  const t = useMemo(() => getConversationSettingsUi(lang), [lang]);

  return (
    <VStack align="stretch" spacing={5} flex={1}>
      {/* Proficiency Level Dropdown */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
          {t.proficiencyLabel}
        </FormLabel>
        <Text
          fontSize="xs"
          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
          mb={3}
        >
          {t.proficiencyHint}
        </Text>
        <Menu matchWidth onOpen={() => playSound(selectSound)}>
          <MenuButton
            as={Button}
            rightIcon={<FiChevronDown />}
            w="100%"
            bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
            color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
            border="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "transparent"}
            boxShadow={isLightTheme ? APP_SHADOW : "0 4px 0px black"}
            _active={{ bg: isLightTheme ? APP_SURFACE : "gray.700" }}
            _hover={{ bg: isLightTheme ? APP_SURFACE : "gray.700" }}
            textAlign="left"
            fontWeight="normal"
            h="auto"
            py={3}
            px={3}
            whiteSpace="normal"
            onClick={() => playSound(selectSound)}
          >
            <HStack spacing={2} align="center" flex={1} minW={0}>
              <Badge
                px={2}
                py={1}
                borderRadius="md"
                bg={currentLevel.color}
                color="white"
                fontSize="sm"
                fontWeight="bold"
                flexShrink={0}
              >
                {currentLevel.level === "Pre-A1" ? "A0" : currentLevel.level}
              </Badge>
              <Box minW={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {currentLevel.name[lang] || currentLevel.name.en}
                </Text>
                <Text fontSize="xs" color="gray.400" noOfLines={1}>
                  {currentLevel.description[lang] || currentLevel.description.en}
                </Text>
              </Box>
            </HStack>
          </MenuButton>
          <MenuList
            bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.800"}
            color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
            borderColor={isLightTheme ? APP_BORDER : "gray.700"}
            maxH="300px"
            overflowY="auto"
          >
            {CEFR_LEVELS.map((level) => (
              <MenuItem
                key={level.level}
                onClick={() => handleLevelChange(level.level)}
                bg={
                  settings.proficiencyLevel === level.level
                    ? isLightTheme
                      ? APP_SURFACE_MUTED
                      : "gray.700"
                    : "transparent"
                }
                _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "gray.700" }}
                py={3}
              >
                <HStack spacing={2} w="100%" align="center">
                  <Badge
                    px={2}
                    py={1}
                    borderRadius="md"
                    bg={level.color}
                    color="white"
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                  >
                    {level.level === "Pre-A1" ? "A0" : level.level}
                  </Badge>
                  <Box minW={0} flex={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      {level.name[lang] || level.name.en}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                    >
                      {level.description[lang] || level.description.en}
                    </Text>
                  </Box>
                </HStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </FormControl>

      {/* Pronunciation Practice Switch */}
      <FormControl>
        <HStack justify="space-between" align="center">
          <Box>
            <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>
              {t.pronunciationLabel}
            </FormLabel>
            <Text
              fontSize="xs"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              mt={1}
            >
              {t.pronunciationHint}
            </Text>
          </Box>
          <Switch
            colorScheme="cyan"
            isChecked={settings.practicePronunciation}
            onChange={(e) => handlePronunciationChange(e.target.checked)}
          />
        </HStack>
      </FormControl>

      {/* Subject Selector */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
          {t.subjectLabel}
        </FormLabel>
        <Text
          fontSize="xs"
          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
          mb={3}
        >
          {t.subjectHint}
        </Text>
        <Textarea
          value={settings.conversationSubjects || ""}
          onChange={handleSubjectChange}
          placeholder={t.subjectPlaceholder}
          bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
          color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
          borderColor={isLightTheme ? APP_BORDER : "gray.700"}
          _hover={{ borderColor: isLightTheme ? APP_BORDER : "gray.600" }}
          _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
          resize="vertical"
          minH="120px"
          fontSize="16px"
        />
      </FormControl>

      {showActions ? (
        <HStack spacing={3} mt="auto">
          <Button
            variant="outline"
            colorScheme={isLightTheme ? "gray" : "gray"}
            borderColor={isLightTheme ? APP_BORDER : undefined}
            color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
            bg={isLightTheme ? APP_SURFACE_ELEVATED : undefined}
            onClick={handleClose}
            size="lg"
            flex={1}
          >
            {t.close}
          </Button>
          <Button colorScheme="cyan" onClick={handleSave} size="lg" flex={1}>
            {t.save}
          </Button>
        </HStack>
      ) : null}
    </VStack>
  );
}

export default function ConversationSettingsDrawer({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  supportLang = "en",
}) {
  const lang = normalizeSupportLanguage(supportLang, DEFAULT_SUPPORT_LANGUAGE);
  const t = useMemo(() => getConversationSettingsUi(lang), [lang]);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
      closeOnOverlayClick={false}
    >
      <DrawerOverlay
        bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.600"}
        backdropFilter="blur(4px)"
      />
      <DrawerContent
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        borderLeftRadius="24px"
        maxH="100vh"
        display="flex"
        flexDirection="column"
        boxShadow={isLightTheme ? APP_SHADOW : undefined}
        borderLeft={isLightTheme ? `1px solid ${APP_BORDER}` : undefined}
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "100dvh",
          },
        }}
      >
        <DrawerCloseButton
          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
          _hover={{ color: isLightTheme ? APP_TEXT_PRIMARY : "gray.200" }}
          top={4}
          right={4}
          onClick={onClose}
        />
        <DrawerHeader pb={2} pr={12}>
          {t.title}
        </DrawerHeader>
        <DrawerBody pb={6} display="flex" flexDirection="column" flex={1}>
          <ConversationSettingsPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            supportLang={supportLang}
            onClose={onClose}
            onSave={onClose}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// Export CEFR_LEVELS for use in other components
export { CEFR_LEVELS };
