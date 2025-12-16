// src/components/NotesDrawer.jsx
import React, { useMemo } from "react";
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
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RiDeleteBinLine } from "react-icons/ri";
import { translations } from "../utils/translation";
import useNotesStore from "../hooks/useNotesStore";

// CEFR level colors
const CEFR_COLORS = {
  A1: "#3B82F6",
  A2: "#22C55E",
  B1: "#EAB308",
  B2: "#F97316",
  C1: "#EF4444",
  C2: "#A855F7",
};

// Module type labels
const MODULE_LABELS = {
  flashcard: { en: "Flashcard", es: "Tarjeta" },
  vocabulary: { en: "Vocabulary", es: "Vocabulario" },
  grammar: { en: "Grammar", es: "Gramática" },
};

export default function NotesDrawer({ isOpen, onClose, appLanguage = "en" }) {
  const { notes, removeNote, clearNotes } = useNotesStore();

  const lang = appLanguage === "es" ? "es" : "en";
  const ui = useMemo(() => translations[lang] || translations.en, [lang]);

  const drawerTitle = lang === "es" ? "Mis Notas" : "My Notes";
  const emptyMessage =
    lang === "es"
      ? "Aún no tienes notas. Completa tarjetas, vocabulario o gramática para crear notas automáticamente."
      : "No notes yet. Complete flashcards, vocabulary or grammar to automatically create notes.";
  const clearAllLabel = lang === "es" ? "Borrar todo" : "Clear all";
  const exampleLabel = lang === "es" ? "Ejemplo" : "Example";
  const summaryLabel = lang === "es" ? "Resumen" : "Summary";

  // Group notes by date (today, yesterday, older)
  const groupedNotes = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart - dayMs;

    const groups = {
      today: [],
      yesterday: [],
      older: [],
    };

    notes.forEach((note) => {
      if (note.createdAt >= todayStart) {
        groups.today.push(note);
      } else if (note.createdAt >= yesterdayStart) {
        groups.yesterday.push(note);
      } else {
        groups.older.push(note);
      }
    });

    return groups;
  }, [notes]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderNoteItem = (note) => {
    const lessonTitle =
      typeof note.lessonTitle === "object"
        ? note.lessonTitle[lang] || note.lessonTitle.en || "Note"
        : note.lessonTitle || "Note";

    const moduleLabel =
      MODULE_LABELS[note.moduleType]?.[lang] ||
      MODULE_LABELS[note.moduleType]?.en ||
      note.moduleType;

    return (
      <AccordionItem
        key={note.id}
        border="none"
        mb={2}
        bg="whiteAlpha.50"
        borderRadius="lg"
        overflow="hidden"
      >
        <AccordionButton
          py={3}
          px={4}
          _hover={{ bg: "whiteAlpha.100" }}
          _expanded={{ bg: "whiteAlpha.100" }}
        >
          <HStack flex="1" spacing={3} align="center">
            <Badge
              bg={CEFR_COLORS[note.cefrLevel] || CEFR_COLORS.A1}
              color="white"
              fontSize="xs"
              fontWeight="bold"
              px={2}
              py={0.5}
              borderRadius="md"
            >
              {note.cefrLevel}
            </Badge>
            <VStack align="start" spacing={0} flex="1">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="white"
                noOfLines={1}
              >
                {lessonTitle}
              </Text>
              <HStack spacing={2}>
                <Badge
                  variant="subtle"
                  colorScheme="gray"
                  fontSize="10px"
                  textTransform="capitalize"
                >
                  {moduleLabel}
                </Badge>
                <Text fontSize="xs" color="gray.400">
                  {formatTime(note.createdAt)}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          <AccordionIcon color="gray.400" />
        </AccordionButton>

        <AccordionPanel pb={4} px={4}>
          <VStack align="stretch" spacing={3}>
            {/* Example in target language */}
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {exampleLabel}
              </Text>
              <Box
                bg="whiteAlpha.100"
                p={3}
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor={CEFR_COLORS[note.cefrLevel] || "blue.400"}
              >
                <Text fontSize="sm" color="white" fontStyle="italic">
                  {note.example}
                </Text>
              </Box>
            </Box>

            {/* Summary in support language */}
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {summaryLabel}
              </Text>
              <Text fontSize="sm" color="gray.200">
                {note.summary}
              </Text>
            </Box>

            {/* Delete button */}
            <Flex justify="flex-end">
              <IconButton
                icon={<RiDeleteBinLine size={16} />}
                aria-label={lang === "es" ? "Eliminar nota" : "Delete note"}
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

  const renderGroup = (title, notesList) => {
    if (!notesList.length) return null;

    return (
      <Box mb={4}>
        <Text
          fontSize="xs"
          color="gray.500"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wide"
          mb={2}
          px={1}
        >
          {title}
        </Text>
        <Accordion allowMultiple>{notesList.map(renderNoteItem)}</Accordion>
      </Box>
    );
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent bg="gray.900" color="white">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" align="center" pr={8}>
            <Text>{drawerTitle}</Text>
            {notes.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={clearNotes}
              >
                {clearAllLabel}
              </Button>
            )}
          </HStack>
        </DrawerHeader>

        <DrawerBody py={4}>
          {notes.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="200px"
              textAlign="center"
            >
              <Text color="gray.400" fontSize="sm">
                {emptyMessage}
              </Text>
            </Flex>
          ) : (
            <VStack align="stretch" spacing={0}>
              {renderGroup(
                lang === "es" ? "Hoy" : "Today",
                groupedNotes.today
              )}
              {renderGroup(
                lang === "es" ? "Ayer" : "Yesterday",
                groupedNotes.yesterday
              )}
              {renderGroup(
                lang === "es" ? "Anteriores" : "Older",
                groupedNotes.older
              )}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
