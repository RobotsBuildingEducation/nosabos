// src/components/NotesDrawer.jsx
import React, { useMemo, useState, useRef } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton, Text,
  VStack,
} from "@chakra-ui/react";
import { RiDeleteBinLine, RiVolumeUpLine, RiStopLine } from "react-icons/ri";
import useNotesStore from "../hooks/useNotesStore";
import { getTTSPlayer, TTS_LANG_TAG, getRandomVoice } from "../utils/tts";
import translations from "../utils/translation";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import VoiceOrb from "./VoiceOrb";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageLocale,
  normalizeSupportLanguage,
} from "../constants/languages";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// CEFR levels in order
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// CEFR level colors
const CEFR_COLORS = {
  A1: "#3B82F6",
  A2: "#22C55E",
  B1: "#EAB308",
  B2: "#F97316",
  C1: "#EF4444",
  C2: "#A855F7",
};
const CEFR_TEXT_COLORS = {
  A1: "white",
  A2: "#083344",
  B1: "#3b2f13",
  B2: "#431407",
  C1: "white",
  C2: "white",
};

// Module type labels
const MODULE_LABELS = {
  flashcard: {
    en: "Flashcard",
    es: "Tarjeta",
    pt: "Cartao",
    it: "Scheda",
    fr: "Carte",
    hi: "फ्लैशकार्ड",
  },
  vocabulary: {
    en: "Vocabulary",
    es: "Vocabulario",
    pt: "Vocabulario",
    it: "Vocabolario",
    fr: "Vocabulaire",
    hi: "शब्दावली",
  },
  grammar: {
    en: "Grammar",
    es: "Gramatica",
    pt: "Gramatica",
    it: "Grammatica",
    fr: "Grammaire",
    hi: "व्याकरण",
  },
};

export default function NotesDrawer({
  isOpen,
  onClose,
  appLanguage = "en",
  targetLang = "es",
}) {
  const { notes, removeNote, clearNotesForLanguage } = useNotesStore();
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const [loadingTts, setLoadingTts] = useState(null);
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const swipeDismiss = useBottomDrawerSwipeDismiss({ isOpen, onClose });
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const locale = getLanguageLocale(lang);

  // Filter notes by current target language
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => note.targetLang === targetLang);
  }, [notes, targetLang]);

  const drawerTitle =
    lang === "ja"
      ? "マイメモ"
      : lang === "fr"
      ? "Mes notes"
      : lang === "pt"
      ? "Minhas notas"
      : lang === "it"
      ? "Le mie note"
      : lang === "hi"
      ? "मेरे नोट्स"
      : lang === "es"
      ? "Mis Notas"
      : "My Notes";
  const emptyMessage =
    lang === "ja"
      ? "まだメモがありません。フラッシュカード、語彙、文法を完了すると自動でメモが作成されます。"
      : lang === "fr"
      ? "Aucune note pour l'instant. Termine des cartes, du vocabulaire ou de la grammaire pour creer des notes automatiquement."
      : lang === "pt"
      ? "Voce ainda nao tem notas. Conclua cartoes, vocabulario ou gramatica para criar notas automaticamente."
      : lang === "it"
      ? "Ancora nessuna nota. Completa schede, vocabolario o grammatica per creare note automaticamente."
      : lang === "hi"
      ? "अभी आपके पास कोई नोट नहीं है। फ्लैशकार्ड, शब्दावली या व्याकरण पूरा करें ताकि नोट अपने आप बन सकें।"
      : lang === "es"
      ? "Aún no tienes notas. Completa tarjetas, vocabulario o gramática para crear notas automáticamente."
      : "No notes yet. Complete flashcards, vocabulary or grammar to automatically create notes.";
  const clearAllLabel =
    lang === "ja"
      ? "すべて削除"
      : lang === "fr"
      ? "Tout effacer"
      : lang === "pt"
      ? "Limpar tudo"
      : lang === "it"
      ? "Cancella tutto"
      : lang === "hi"
      ? "सब साफ़ करें"
      : lang === "es"
      ? "Borrar todo"
      : "Clear all";
  const summaryLabel =
    lang === "ja"
      ? "要約"
      : lang === "fr"
      ? "Resume"
      : lang === "pt"
      ? "Resumo"
      : lang === "it"
      ? "Riassunto"
      : lang === "hi"
      ? "सारांश"
      : lang === "es"
      ? "Resumen"
      : "Summary";
  const lessonLabel =
    lang === "ja"
      ? "レッスン"
      : lang === "fr"
      ? "Lecon"
      : lang === "pt"
      ? "Licao"
      : lang === "it"
      ? "Lezione"
      : lang === "hi"
      ? "पाठ"
      : lang === "es"
      ? "Lección"
      : "Lesson";
  const noNotesLabel =
    lang === "ja"
      ? "メモなし"
      : lang === "fr"
      ? "Aucune note"
      : lang === "pt"
      ? "Sem notas"
      : lang === "it"
      ? "Nessuna nota"
      : lang === "hi"
      ? "कोई नोट नहीं"
      : lang === "es"
      ? "Sin notas"
      : "No notes";
  const closeLabel =
    translations[lang]?.teams_drawer_close ||
    translations.en?.teams_drawer_close ||
    "Close";
  const noteTitleFallback =
    lang === "ja"
      ? "メモ"
      : lang === "fr"
      ? "Note"
      : lang === "pt"
      ? "Nota"
      : lang === "it"
      ? "Nota"
      : lang === "hi"
      ? "नोट"
      : lang === "es"
      ? "Nota"
      : "Note";
  const formatNoteCountLabel = (count) => {
    const formattedCount = new Intl.NumberFormat(locale).format(count);

    if (lang === "ja") {
      return `${formattedCount}件のメモ`;
    }

    if (lang === "fr") {
      return `${formattedCount} ${count === 1 ? "note" : "notes"}`;
    }

    if (lang === "pt") {
      return `${formattedCount} ${count === 1 ? "nota" : "notas"}`;
    }

    if (lang === "it") {
      return `${formattedCount} ${count === 1 ? "nota" : "note"}`;
    }

    if (lang === "hi") {
      return `${formattedCount} नोट`;
    }

    if (lang === "es") {
      return `${formattedCount} ${count === 1 ? "nota" : "notas"}`;
    }

    return `${formattedCount} ${count === 1 ? "note" : "notes"}`;
  };
  const listenLabel =
    lang === "ja"
      ? "聞く"
      : lang === "fr"
      ? "Ecouter"
      : lang === "pt"
      ? "Ouvir"
      : lang === "it"
      ? "Ascolta"
      : lang === "hi"
      ? "सुनें"
      : lang === "es"
      ? "Escuchar"
      : "Listen";
  const deleteNoteLabel =
    lang === "ja"
      ? "メモを削除"
      : lang === "fr"
      ? "Supprimer la note"
      : lang === "pt"
      ? "Excluir nota"
      : lang === "it"
      ? "Elimina nota"
      : lang === "hi"
      ? "नोट हटाएं"
      : lang === "es"
      ? "Eliminar nota"
      : "Delete note";
  const noteUi = useMemo(
    () =>
      isLightTheme
        ? {
            overlay: "rgba(76, 60, 40, 0.18)",
            drawerBg: APP_SURFACE_ELEVATED,
            drawerBorder: APP_BORDER,
            drawerText: APP_TEXT_PRIMARY,
            headerBorder: APP_BORDER,
            sectionBg: APP_SURFACE,
            sectionBgHover: APP_SURFACE_MUTED,
            sectionBgExpanded: "#ebe0d0",
            sectionBorder: APP_BORDER,
            noteBg: "#f3ebdf",
            noteBgHover: "#ece1cf",
            notePanelBg: "#f7f0e4",
            noteBorder: "rgba(96, 77, 56, 0.12)",
            primaryText: APP_TEXT_PRIMARY,
            secondaryText: APP_TEXT_SECONDARY,
            mutedText: APP_TEXT_MUTED,
            icon: APP_TEXT_SECONDARY,
            moduleBadgeBg: "#433527",
            moduleBadgeColor: "#fff8ef",
            emptyOpacity: 0.78,
            closeHoverBg: APP_SURFACE_MUTED,
            shadow: APP_SHADOW,
          }
        : {
            overlay: "blackAlpha.600",
            drawerBg: "gray.900",
            drawerBorder: undefined,
            drawerText: "white",
            headerBorder: "whiteAlpha.200",
            sectionBg: "whiteAlpha.100",
            sectionBgHover: "whiteAlpha.200",
            sectionBgExpanded: "whiteAlpha.200",
            sectionBorder: "transparent",
            noteBg: "whiteAlpha.50",
            noteBgHover: "whiteAlpha.100",
            notePanelBg: "whiteAlpha.50",
            noteBorder: "transparent",
            primaryText: "white",
            secondaryText: "gray.300",
            mutedText: "gray.500",
            icon: "gray.400",
            moduleBadgeBg: undefined,
            moduleBadgeColor: undefined,
            emptyOpacity: 0.5,
            closeHoverBg: "whiteAlpha.100",
            shadow: undefined,
          },
    [isLightTheme],
  );

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setPlayingNoteId(null);
  };

  const playNoteTts = async (note) => {
    // Stop any currently playing audio
    stopAudio();

    if (playingNoteId === note.id) {
      return; // Was playing, now stopped
    }

    setLoadingTts(note.id);
    try {
      const ttsLang = note.targetLang || targetLang || "es";
      const player = await getTTSPlayer({
        text: note.example,
        voice: getRandomVoice(),
        langTag: TTS_LANG_TAG[ttsLang] || ttsLang,
      });

      audioRef.current = player.audio;
      pcRef.current = player.pc;
      setPlayingNoteId(note.id);
      setLoadingTts(null);

      player.audio.onended = () => {
        setPlayingNoteId(null);
        stopAudio();
      };

      await player.done;
      setPlayingNoteId(null);
    } catch (error) {
      console.error("TTS playback error:", error);
      setLoadingTts(null);
      setPlayingNoteId(null);
    }
  };

  // Group notes by CEFR level (using filtered notes for current language)
  const notesByCefr = useMemo(() => {
    const groups = {};
    CEFR_LEVELS.forEach((level) => {
      groups[level] = [];
    });

    filteredNotes.forEach((note) => {
      const level = note.cefrLevel || "A1";
      if (groups[level]) {
        groups[level].push(note);
      } else {
        groups.A1.push(note);
      }
    });

    return groups;
  }, [filteredNotes]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  };

  const renderNoteItem = (note) => {
    const lessonTitle =
      typeof note.lessonTitle === "object"
        ? note.lessonTitle[lang] || note.lessonTitle.en || noteTitleFallback
        : note.lessonTitle || noteTitleFallback;

    const moduleLabel =
      MODULE_LABELS[note.moduleType]?.[lang] ||
      MODULE_LABELS[note.moduleType]?.en ||
      note.moduleType;

    return (
      <AccordionItem
        key={note.id}
        border="none"
        mb={2}
        bg={noteUi.noteBg}
        borderWidth="1px"
        borderColor={noteUi.noteBorder}
        borderRadius="lg"
        overflow="hidden"
      >
        <AccordionButton
          py={3}
          px={4}
          _hover={{ bg: noteUi.noteBgHover }}
          _expanded={{ bg: noteUi.noteBgHover }}
        >
          <VStack align="start" spacing={1} flex="1">
            {/* Example as the title */}
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={noteUi.primaryText}
              noOfLines={2}
              textAlign="left"
              fontStyle="italic"
            >
              "{note.example}"
            </Text>
            <HStack spacing={2}>
              <Badge
                variant={isLightTheme ? "solid" : "subtle"}
                bg={isLightTheme ? noteUi.moduleBadgeBg : undefined}
                color={isLightTheme ? noteUi.moduleBadgeColor : undefined}
                colorScheme={isLightTheme ? undefined : "gray"}
                fontSize="10px"
                textTransform="capitalize"
              >
                {moduleLabel}
              </Badge>
              {/* Correct/Incorrect indicator */}
              <Badge
                variant="solid"
                bg={note.wasCorrect ? "green.500" : "red.500"}
                color="white"
                fontSize="9px"
                px={1.5}
                borderRadius="sm"
              >
                {note.wasCorrect ? "✓" : "✖"}
              </Badge>
              <Text fontSize="xs" color={noteUi.mutedText}>
                {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
              </Text>
            </HStack>
          </VStack>
          <AccordionIcon color={noteUi.icon} ml={2} />
        </AccordionButton>

        <AccordionPanel pb={3} px={4} bg={noteUi.notePanelBg}>
          <VStack align="stretch" spacing={2}>
            {/* Summary */}
            <Text fontSize="sm" color={noteUi.secondaryText} lineHeight="tall">
              {note.summary}
            </Text>

            {/* Lesson details - compact inline */}
            <Text fontSize="xs" color={noteUi.mutedText}>
              {lessonLabel}: {lessonTitle}
            </Text>

            {/* Action buttons - TTS left, Delete right */}
            <Flex justify="space-between" align="center" pt={1}>
              <IconButton
                icon={
                  loadingTts === note.id ? (
                    <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} />
                  ) : playingNoteId === note.id ? (
                    <RiStopLine size={16} />
                  ) : (
                    <RiVolumeUpLine size={16} />
                  )
                }
                aria-label={
                  listenLabel
                }
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  playNoteTts(note);
                }}
                isDisabled={loadingTts === note.id}
              />
              <IconButton
                icon={<RiDeleteBinLine size={16} />}
                aria-label={
                  deleteNoteLabel
                }
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => removeNote(note.id)}
              />
            </Flex>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay
        bg={noteUi.overlay}
        backdropFilter={isLightTheme ? "blur(4px)" : undefined}
        opacity={swipeDismiss.overlayOpacity}
        transition="opacity 0.18s ease"
      />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        display="flex"
        flexDirection="column"
        bg={noteUi.drawerBg}
        color={noteUi.drawerText}
        borderTopRadius="24px"
        h="90vh"
        borderTop={noteUi.drawerBorder ? `1px solid ${noteUi.drawerBorder}` : undefined}
        boxShadow={noteUi.shadow}
        sx={{
          "@supports (height: 100dvh)": {
            height: "90dvh",
          },
        }}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton
          color={noteUi.icon}
          _hover={{ color: noteUi.primaryText, bg: noteUi.closeHoverBg }}
          top={4}
          right={4}
        />
        <DrawerHeader borderBottomWidth="1px" borderColor={noteUi.headerBorder} pr={12}>
          <Box maxW="720px" mx="auto" w="100%">
            <HStack justify="space-between" align="center">
              <Text color={noteUi.primaryText} fontWeight="semibold">
                {drawerTitle}
              </Text>
              {filteredNotes.length > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  color={isLightTheme ? "#b45309" : undefined}
                  _hover={
                    isLightTheme
                      ? { bg: noteUi.closeHoverBg, color: "#92400e" }
                      : undefined
                  }
                  onClick={() => clearNotesForLanguage(targetLang)}
                >
                  {clearAllLabel}
                </Button>
              )}
            </HStack>
          </Box>
        </DrawerHeader>

        <DrawerBody overflowY="auto" flex="1" py={4}>
          <Box maxW="720px" mx="auto" w="100%">
          {filteredNotes.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="200px"
              textAlign="center"
            >
              <Text color={noteUi.secondaryText} fontSize="sm" maxW="520px">
                {emptyMessage}
              </Text>
            </Flex>
          ) : (
            <Accordion allowToggle>
              {CEFR_LEVELS.map((level) => {
                const levelNotes = notesByCefr[level];
                const hasNotes = levelNotes.length > 0;

                return (
                  <AccordionItem
                    key={level}
                    border="none"
                    mb={3}
                    isDisabled={!hasNotes}
                  >
                    {({ isExpanded }) => (
                      <>
                        <AccordionButton
                          py={3}
                          px={4}
                          bg={hasNotes ? noteUi.sectionBg : noteUi.notePanelBg}
                          border="1px solid"
                          borderColor={hasNotes ? noteUi.sectionBorder : noteUi.noteBorder}
                          borderRadius="lg"
                          borderBottomRadius={isExpanded ? 0 : "lg"}
                          opacity={hasNotes ? 1 : noteUi.emptyOpacity}
                          cursor={hasNotes ? "pointer" : "not-allowed"}
                          _hover={{
                            bg: hasNotes ? noteUi.sectionBgHover : noteUi.notePanelBg,
                          }}
                          _expanded={{ bg: noteUi.sectionBgExpanded }}
                        >
                          <HStack flex="1" spacing={3}>
                            <Badge
                              bg={CEFR_COLORS[level]}
                              color={CEFR_TEXT_COLORS[level] || "white"}
                              fontSize="sm"
                              fontWeight="bold"
                              px={3}
                              py={1}
                              borderRadius="md"
                            >
                              {level}
                            </Badge>
                            <Text
                              fontSize="sm"
                              color={hasNotes ? noteUi.primaryText : noteUi.mutedText}
                              fontWeight="medium"
                            >
                              {hasNotes
                                ? formatNoteCountLabel(levelNotes.length)
                                : noNotesLabel}
                            </Text>
                          </HStack>
                          {hasNotes && <AccordionIcon color={noteUi.icon} />}
                        </AccordionButton>

                        {hasNotes && (
                          <AccordionPanel
                            pb={4}
                            px={2}
                            pt={2}
                            bg={noteUi.notePanelBg}
                            borderBottomRadius="lg"
                          >
                            <Accordion allowMultiple>
                              {levelNotes.map(renderNoteItem)}
                            </Accordion>
                          </AccordionPanel>
                        )}
                      </>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
          </Box>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" borderColor={noteUi.headerBorder}>
          <Box maxW="720px" mx="auto" w="100%" display="flex" justifyContent="flex-end">
            <Button
              variant={"ghost"}
              color={noteUi.primaryText}
              _hover={{ bg: noteUi.closeHoverBg }}
              onClick={onClose}
            >
              {closeLabel}
            </Button>
          </Box>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
