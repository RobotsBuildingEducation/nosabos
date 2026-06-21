// src/components/ModesCarouselModal.jsx
//
// Onboarding carousel introducing the app's modes — one slide per mode with
// its icon and a short description. Shown once, right after the proficiency
// test modal step. Localized for every support/app language via plateUiCopy.
import React, { useMemo, useState } from "react";
import {
  Box,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { LuLanguages } from "react-icons/lu";
import { PiPath, PiCardsBold, PiSealQuestionDuotone } from "react-icons/pi";
import {
  RiChat3Line,
  RiBook2Line,
  RiArrowLeftLine,
  RiArrowRightLine,
} from "react-icons/ri";

import {
  nativeOverlayMotionProps,
  nativeModalMotionProps,
} from "../utils/modalMotion";
import { plateUiCopy } from "../utils/dailyPlateCopy";

const MotionBox = motion(Box);

const HEADER_TITLE = {
  en: "How it works",
  es: "Cómo funciona",
  pt: "Como funciona",
  it: "Come funziona",
  fr: "Comment ça marche",
  de: "So funktioniert's",
  ja: "使い方",
  hi: "यह कैसे काम करता है",
  ar: "كيف يعمل",
  zh: "使用方法",
};

const BACK_LABEL = {
  en: "Back",
  es: "Atrás",
  pt: "Voltar",
  it: "Indietro",
  fr: "Retour",
  de: "Zurück",
  ja: "戻る",
  hi: "पीछे",
  ar: "رجوع",
  zh: "返回",
};

const NEXT_LABEL = {
  en: "Next",
  es: "Siguiente",
  pt: "Próximo",
  it: "Avanti",
  fr: "Suivant",
  de: "Weiter",
  ja: "次へ",
  hi: "आगे",
  ar: "التالي",
  zh: "下一个",
};

const DONE_LABEL = {
  en: "Done",
  es: "Listo",
  pt: "Concluir",
  it: "Fine",
  fr: "Terminé",
  de: "Fertig",
  ja: "完了",
  hi: "हो गया",
  ar: "تم",
  zh: "完成",
};

// Mirrors the bottom-bar mode menu (PATH_MODES) icons and order.
const buildSlides = (includePhonics) => [
  {
    id: "plate",
    icon: PiSealQuestionDuotone,
    accent: "#0d9488",
    title: {
      en: "Daily Quest",
      es: "Misión diaria",
      pt: "Missão diária",
      it: "Missione quotidiana",
      fr: "Quête du jour",
      de: "Tägliche Quest",
      ja: "デイリークエスト",
      hi: "दैनिक क्वेस्ट",
      ar: "المهمة اليومية",
      zh: "每日任务",
    },
    description: {
      en: "Finish tasks using different learning modes to earn bonus XP for completing the daily quest.",
      es: "Completa tareas usando distintos modos de aprendizaje y gana XP extra al terminar la misión diaria.",
      pt: "Conclua tarefas usando diferentes modos de aprendizado e ganhe XP bônus ao completar a missão diária.",
      it: "Completa attività usando diversi modi di apprendimento e guadagna XP bonus completando la missione quotidiana.",
      fr: "Termine des tâches avec différents modes d'apprentissage et gagne un bonus d'XP en complétant la quête du jour.",
      de: "Erledige Aufgaben mit verschiedenen Lernmodi und verdiene Bonus-XP, wenn du die tägliche Quest abschließt.",
      ja: "さまざまな学習モードでタスクをこなし、デイリークエストを達成してボーナスXPを獲得しましょう。",
      hi: "अलग-अलग लर्निंग मोड से कार्य पूरे करें और दैनिक क्वेस्ट पूरा करने पर बोनस XP कमाएँ।",
      ar: "أكمل المهام باستخدام أوضاع تعلّم مختلفة واحصل على نقاط XP إضافية عند إتمام المهمة اليومية.",
      zh: "使用不同的学习模式完成任务，完成每日任务即可获得额外经验值。",
    },
  },
  {
    id: "path",
    icon: PiPath,
    accent: "#60a5fa",
    title: {
      en: "Lessons",
      es: "Lecciones",
      pt: "Lições",
      it: "Lezioni",
      fr: "Leçons",
      de: "Lektionen",
      ja: "レッスン",
      hi: "पाठ",
      ar: "الدروس",
      zh: "课程",
    },
    description: {
      en: "A structured path from beginner to fluent. Each lesson mixes speaking, stories, grammar, vocabulary, and games.",
      es: "Un camino estructurado de principiante a fluido. Cada lección combina habla, historias, gramática, vocabulario y juegos.",
      pt: "Um caminho estruturado de iniciante a fluente. Cada lição combina fala, histórias, gramática, vocabulário e jogos.",
      it: "Un percorso strutturato dal principiante alla fluidità. Ogni lezione unisce conversazione, storie, grammatica, vocabolario e giochi.",
      fr: "Un parcours structuré du débutant à l'aisance. Chaque leçon mêle expression orale, histoires, grammaire, vocabulaire et jeux.",
      de: "Ein strukturierter Weg vom Anfänger bis zur Sprachgewandtheit. Jede Lektion verbindet Sprechen, Geschichten, Grammatik, Vokabeln und Spiele.",
      ja: "初心者から流暢まで、体系的な学習パス。各レッスンはスピーキング、ストーリー、文法、語彙、ゲームを組み合わせます。",
      hi: "शुरुआती से धाराप्रवाह तक एक संरचित राह। हर पाठ में बोलना, कहानियाँ, व्याकरण, शब्दावली और खेल शामिल हैं।",
      ar: "مسار منظَّم من المبتدئ إلى الطلاقة. يجمع كل درس بين التحدث والقصص والقواعد والمفردات والألعاب.",
      zh: "从入门到流利的系统学习路径。每节课融合口语、故事、语法、词汇和游戏。",
    },
  },
  {
    id: "flashcards",
    icon: PiCardsBold,
    accent: "#c084fc",
    title: {
      en: "Cards",
      es: "Tarjetas",
      pt: "Cartões",
      it: "Schede",
      fr: "Cartes",
      de: "Karten",
      ja: "カード",
      hi: "कार्ड",
      ar: "البطاقات",
      zh: "卡片",
    },
    description: {
      en: "Flashcards with smart spaced review. A few minutes a day keeps your vocabulary fresh and growing.",
      es: "Tarjetas con repaso espaciado inteligente. Unos minutos al día mantienen tu vocabulario fresco y en crecimiento.",
      pt: "Cartões com revisão espaçada inteligente. Alguns minutos por dia mantêm seu vocabulário fresco e crescendo.",
      it: "Schede con ripasso a intervalli intelligenti. Pochi minuti al giorno mantengono il tuo vocabolario fresco e in crescita.",
      fr: "Des cartes avec révision espacée intelligente. Quelques minutes par jour gardent ton vocabulaire frais et en expansion.",
      de: "Karteikarten mit intelligenter, verteilter Wiederholung. Ein paar Minuten am Tag halten deinen Wortschatz frisch und wachsend.",
      ja: "賢い間隔反復のフラッシュカード。1日数分で語彙を新鮮に、着実に増やせます。",
      hi: "स्मार्ट स्पेस्ड रिव्यू वाले फ्लैशकार्ड। रोज़ कुछ मिनट आपकी शब्दावली ताज़ा और बढ़ती रखते हैं।",
      ar: "بطاقات تعليمية بمراجعة متباعدة ذكية. بضع دقائق يوميًا تُبقي مفرداتك حاضرة وفي ازدياد.",
      zh: "采用智能间隔复习的闪卡。每天几分钟，让你的词汇保持新鲜并不断增长。",
    },
  },
  ...(includePhonics
    ? [
        {
          id: "alphabet",
          icon: LuLanguages,
          accent: "#fbbf24",
          title: {
            en: "Phonics",
            es: "Fonética",
            pt: "Fonética",
            it: "Fonetica",
            fr: "Phonétique",
            de: "Phonetik",
            ja: "フォニックス",
            hi: "ध्वनिकी",
            ar: "الصوتيات",
            zh: "自然拼读",
          },
          description: {
            en: "Master your new language's alphabet and sounds first, so lessons and reading come naturally.",
            es: "Domina primero el alfabeto y los sonidos de tu nuevo idioma, para que las lecciones y la lectura fluyan.",
            pt: "Domine primeiro o alfabeto e os sons do seu novo idioma, para que as lições e a leitura fluam naturalmente.",
            it: "Padroneggia prima l'alfabeto e i suoni della tua nuova lingua, così lezioni e lettura verranno naturali.",
            fr: "Maîtrise d'abord l'alphabet et les sons de ta nouvelle langue, pour que les leçons et la lecture deviennent naturelles.",
            de: "Beherrsche zuerst das Alphabet und die Laute deiner neuen Sprache, damit Lektionen und Lesen leichtfallen.",
            ja: "まず新しい言語のアルファベットと音をマスター。レッスンや読みが自然に身につきます。",
            hi: "पहले अपनी नई भाषा की वर्णमाला और ध्वनियाँ सीखें, ताकि पाठ और पढ़ना सहज हो जाए।",
            ar: "أتقن أولًا أبجدية لغتك الجديدة وأصواتها، حتى تأتي الدروس والقراءة بسهولة.",
            zh: "先掌握新语言的字母和发音，让课程和阅读水到渠成。",
          },
        },
      ]
    : []),
  {
    id: "conversations",
    icon: RiChat3Line,
    accent: "#34d399",
    title: {
      en: "Conversation",
      es: "Conversación",
      pt: "Conversação",
      it: "Conversazione",
      fr: "Conversation",
      de: "Gespräch",
      ja: "会話",
      hi: "बातचीत",
      ar: "محادثة",
      zh: "对话",
    },
    description: {
      en: "Real-time voice chat in your new language. Customize the conversation to whatever you want to practice and talk it out live.",
      es: "Chat de voz en tiempo real en tu nuevo idioma. Personaliza la conversación con lo que quieras practicar y conversa en vivo.",
      pt: "Chat de voz em tempo real no seu novo idioma. Personalize a conversa com o que quiser praticar e converse ao vivo.",
      it: "Chat vocale in tempo reale nella tua nuova lingua. Personalizza la conversazione su ciò che vuoi esercitare e parla dal vivo.",
      fr: "Chat vocal en temps réel dans ta nouvelle langue. Personnalise la conversation selon ce que tu veux pratiquer et parle en direct.",
      de: "Echtzeit-Sprachchat in deiner neuen Sprache. Passe das Gespräch an das an, was du üben willst, und sprich live.",
      ja: "新しい言語でのリアルタイム音声チャット。練習したい内容に合わせて会話をカスタマイズし、その場で話せます。",
      hi: "आपकी नई भाषा में रीयल-टाइम वॉइस चैट। जो अभ्यास करना हो उसके अनुसार बातचीत को अनुकूलित करें और लाइव बात करें।",
      ar: "محادثة صوتية فورية بلغتك الجديدة. خصِّص المحادثة حسب ما تريد التدرّب عليه وتحدّث مباشرةً.",
      zh: "用新语言进行实时语音聊天。按你想练习的内容自定义对话，实时开口说。",
    },
  },
  {
    id: "tutor",
    icon: RiBook2Line,
    accent: "#f472b6",
    title: {
      en: "Tutor",
      es: "Tutor",
      pt: "Tutor",
      it: "Tutor",
      fr: "Tuteur",
      de: "Tutor",
      ja: "チューター",
      hi: "ट्यूटर",
      ar: "المعلم",
      zh: "导师",
    },
    description: {
      en: "A real-time voice tutor that teaches your lessons out loud, listens to you, and coaches you turn by turn.",
      es: "Un tutor de voz en tiempo real que enseña tus lecciones en voz alta, te escucha y te guía turno a turno.",
      pt: "Um tutor de voz em tempo real que ensina suas lições em voz alta, ouve você e orienta a cada turno.",
      it: "Un tutor vocale in tempo reale che insegna le tue lezioni ad alta voce, ti ascolta e ti guida turno dopo turno.",
      fr: "Un tuteur vocal en temps réel qui enseigne tes leçons à voix haute, t'écoute et te guide tour après tour.",
      de: "Ein Echtzeit-Sprachtutor, der deine Lektionen laut unterrichtet, dir zuhört und dich Zug um Zug begleitet.",
      ja: "リアルタイムの音声チューター。レッスンを声に出して教え、あなたの発話を聞き、1ターンずつコーチします。",
      hi: "एक रीयल-टाइम वॉइस ट्यूटर जो आपके पाठ ज़ोर से पढ़ाता है, आपको सुनता है और बारी-बारी से मार्गदर्शन करता है।",
      ar: "معلّم صوتي فوري يشرح دروسك بصوت عالٍ، ويستمع إليك، ويوجّهك خطوة بخطوة.",
      zh: "实时语音导师，朗读教授你的课程，倾听你的表达，并逐句指导你。",
    },
  },
];

export default function ModesCarouselModal({
  isOpen,
  onClose,
  includePhonics = false,
  lang = "en",
  // When part of the onboarding chain, rely on the shared persistent backdrop
  // instead of this modal's own overlay, so the dim doesn't flash off/on as the
  // previous modal hands off to this one.
  useSharedBackdrop = false,
}) {
  const slides = useMemo(() => buildSlides(includePhonics), [includePhonics]);
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;
  const slide = slides[Math.min(index, slides.length - 1)];
  const SlideIcon = slide.icon;

  const paginate = (dir) => {
    setIndex((current) =>
      Math.min(slides.length - 1, Math.max(0, current + dir)),
    );
  };

  const handleClose = () => {
    setIndex(0);
    onClose?.();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
      return;
    }
    paginate(1);
  };

  const handleDragEnd = (_event, info) => {
    if (info.offset.x < -60 && !isLast) paginate(1);
    else if (info.offset.x > 60 && index > 0) paginate(-1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="sm"
      motionPreset="none"
      closeOnOverlayClick={false}
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg={useSharedBackdrop ? "transparent" : "var(--app-overlay)"}
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg="gray.900"
        color="var(--app-text-primary)"
        border="1px solid"
        borderColor="var(--app-border)"
        borderRadius="2xl"
        boxShadow="2xl"
        mx={4}
      >
        <ModalCloseButton color="var(--app-text-muted)" />
        <ModalBody pt={10} pb={6} px={6}>
          <VStack spacing={5}>
            <VStack spacing={1} textAlign="center">
              <Text fontSize="lg" fontWeight="black">
                {plateUiCopy(lang, HEADER_TITLE)}
              </Text>
            </VStack>

            {/* Slide — content swaps instantly; the motion wrapper only
                provides the swipe gesture, not an enter/exit animation. */}
            <Box w="100%" minH="200px" position="relative" overflow="hidden">
              <MotionBox
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                cursor="grab"
                whileDrag={{ cursor: "grabbing" }}
              >
                <VStack spacing={4} textAlign="center" px={2}>
                  <Box
                    w="84px"
                    h="84px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={`${slide.accent}1f`}
                    border="1px solid"
                    borderColor={`${slide.accent}66`}
                    color={slide.accent}
                  >
                    <SlideIcon size={36} />
                  </Box>
                  <Text fontSize="xl" fontWeight="bold">
                    {plateUiCopy(lang, slide.title)}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="var(--app-text-secondary)"
                    lineHeight="1.6"
                    minH="68px"
                  >
                    {plateUiCopy(lang, slide.description)}
                  </Text>
                </VStack>
              </MotionBox>
            </Box>

            {/* Dots */}
            <HStack spacing={2}>
              {slides.map((s, i) => (
                <Box
                  key={s.id}
                  as="button"
                  type="button"
                  aria-label={plateUiCopy(lang, s.title)}
                  onClick={() => setIndex(i)}
                  w={i === index ? "18px" : "8px"}
                  h="8px"
                  borderRadius="full"
                  bg={i === index ? slide.accent : "var(--app-surface-muted)"}
                  border="1px solid"
                  borderColor={
                    i === index ? slide.accent : "var(--app-border-strong)"
                  }
                  transition="all 0.25s ease"
                />
              ))}
            </HStack>

            {/* Controls — arrow-only nav. Back stays present but disabled on
                the first slide so the row reads balanced (no off-center
                lone Next button). */}
            <HStack w="100%" spacing={3}>
              <IconButton
                aria-label={plateUiCopy(lang, BACK_LABEL)}
                icon={<RiArrowLeftLine />}
                size="lg"
                flex="1"
                variant="outline"
                colorScheme={index === 0 ? "gray" : "teal"}
                isDisabled={index === 0}
                _disabled={{
                  opacity: 0.5,
                  color: "var(--app-text-muted)",
                  bg: "var(--app-surface-muted)",
                  borderColor: "var(--app-border)",
                  cursor: "not-allowed",
                  boxShadow: "none",
                }}
                onClick={() => paginate(-1)}
              />
              <IconButton
                aria-label={plateUiCopy(lang, isLast ? DONE_LABEL : NEXT_LABEL)}
                icon={<RiArrowRightLine />}
                size="lg"
                flex="1"
                colorScheme="teal"
                onClick={handleNext}
              />
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
