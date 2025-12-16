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
import useNotesStore from "../hooks/useNotesStore";

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

// Module type labels
const MODULE_LABELS = {
  flashcard: { en: "Flashcard", es: "Tarjeta" },
  vocabulary: { en: "Vocabulary", es: "Vocabulario" },
  grammar: { en: "Grammar", es: "Gramática" },
};

export default function NotesDrawer({ isOpen, onClose, appLanguage = "en" }) {
  const { notes, removeNote, clearNotes } = useNotesStore();

  const lang = appLanguage === "es" ? "es" : "en";

  const drawerTitle = lang === "es" ? "Mis Notas" : "My Notes";
  const emptyMessage =
    lang === "es"
      ? "Aún no tienes notas. Completa tarjetas, vocabulario o gramática para crear notas automáticamente."
      : "No notes yet. Complete flashcards, vocabulary or grammar to automatically create notes.";
  const clearAllLabel = lang === "es" ? "Borrar todo" : "Clear all";
  const summaryLabel = lang === "es" ? "Resumen" : "Summary";
  const lessonLabel = lang === "es" ? "Lección" : "Lesson";
  const noNotesLabel = lang === "es" ? "Sin notas" : "No notes";

  // Group notes by CEFR level
  const notesByCefr = useMemo(() => {
    const groups = {};
    CEFR_LEVELS.forEach((level) => {
      groups[level] = [];
    });

    notes.forEach((note) => {
      const level = note.cefrLevel || "A1";
      if (groups[level]) {
        groups[level].push(note);
      } else {
        groups.A1.push(note);
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
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
          <VStack align="start" spacing={1} flex="1">
            {/* Example as the title */}
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="white"
              noOfLines={2}
              textAlign="left"
              fontStyle="italic"
            >
              "{note.example}"
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
              <Text fontSize="xs" color="gray.500">
                {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
              </Text>
            </HStack>
          </VStack>
          <AccordionIcon color="gray.400" ml={2} />
        </AccordionButton>

        <AccordionPanel pb={4} px={4}>
          <VStack align="stretch" spacing={3}>
            {/* Summary first */}
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold">
                {summaryLabel}
              </Text>
              <Text fontSize="sm" color="gray.200">
                {note.summary}
              </Text>
            </Box>

            {/* Lesson details */}
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold">
                {lessonLabel}
              </Text>
              <Text fontSize="sm" color="gray.300">
                {lessonTitle}
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
            <Accordion allowMultiple>
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
                    <AccordionButton
                      py={3}
                      px={4}
                      bg={hasNotes ? "whiteAlpha.100" : "whiteAlpha.50"}
                      borderRadius="lg"
                      opacity={hasNotes ? 1 : 0.5}
                      cursor={hasNotes ? "pointer" : "not-allowed"}
                      _hover={{
                        bg: hasNotes ? "whiteAlpha.200" : "whiteAlpha.50",
                      }}
                      _expanded={{ bg: "whiteAlpha.150", borderBottomRadius: 0 }}
                    >
                      <HStack flex="1" spacing={3}>
                        <Badge
                          bg={CEFR_COLORS[level]}
                          color="white"
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
                          color={hasNotes ? "white" : "gray.500"}
                          fontWeight="medium"
                        >
                          {hasNotes
                            ? `${levelNotes.length} ${levelNotes.length === 1 ? (lang === "es" ? "nota" : "note") : (lang === "es" ? "notas" : "notes")}`
                            : noNotesLabel}
                        </Text>
                      </HStack>
                      {hasNotes && <AccordionIcon color="gray.400" />}
                    </AccordionButton>

                    {hasNotes && (
                      <AccordionPanel
                        pb={4}
                        px={2}
                        pt={2}
                        bg="whiteAlpha.50"
                        borderBottomRadius="lg"
                      >
                        <Accordion allowMultiple>
                          {levelNotes.map(renderNoteItem)}
                        </Accordion>
                      </AccordionPanel>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
