// src/components/CompanionMemoryList.jsx
//
// The "companion brain" view inside the Memory drawer: a short, temporary list
// of what the companion saved to practice. Today's captures read "Saved for
// tomorrow"; yesterday's survive as reinforcement context and show whether
// they were used in today's quest, repaired, or are expiring tonight.
import React, { useMemo } from "react";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";

import useUserStore from "../hooks/useUserStore";
import {
  getCompanionNotes,
  getCompanionDayKey,
  getYesterdayKey,
  MEMORY_STATUS,
} from "../utils/companionMemory";
import {
  MEMORY_DRAWER_COPY,
  memoryCopy,
  memoryStatusLabel,
} from "../utils/companionMemoryCopy";

const SOURCE_LABELS = {
  flashcard: {
    en: "Flashcard",
    es: "Tarjeta",
    pt: "Cartão",
    it: "Scheda",
    fr: "Carte",
    de: "Karte",
    ja: "カード",
    zh: "抽认卡",
    ru: "Карточка",
    hi: "फ्लैशकार्ड",
    ar: "بطاقة",
  },
  vocabulary: {
    en: "Vocabulary",
    es: "Vocabulario",
    pt: "Vocabulário",
    it: "Vocabolario",
    fr: "Vocabulaire",
    de: "Wortschatz",
    ja: "語彙",
    zh: "词汇",
    ru: "Лексика",
    hi: "शब्दावली",
    ar: "مفردات",
  },
  grammar: {
    en: "Grammar",
    es: "Gramática",
    pt: "Gramática",
    it: "Grammatica",
    fr: "Grammaire",
    de: "Grammatik",
    ja: "文法",
    zh: "语法",
    ru: "Грамматика",
    hi: "व्याकरण",
    ar: "قواعد",
  },
};

// Status → accent color (works on both themes via rgba).
const STATUS_ACCENT = {
  captured: { fg: "#2563EB", bg: "rgba(37, 99, 235, 0.14)" },
  used_in_quest: { fg: "#7C3AED", bg: "rgba(124, 58, 237, 0.14)" },
  reinforced: { fg: "#0d9488", bg: "rgba(13, 148, 136, 0.16)" },
  expiring: { fg: "#C2620E", bg: "rgba(194, 98, 14, 0.16)" },
};

// Resolve the display status for one note relative to today.
function resolveStatus(note, isYesterday) {
  if (note.status === MEMORY_STATUS.reinforced) return "reinforced";
  if (note.status === MEMORY_STATUS.usedInQuest) return "used_in_quest";
  // Yesterday's leftovers that weren't reinforced will be pruned tonight.
  if (isYesterday) return "expiring";
  return "captured";
}

function MemoryCard({ note, lang, isYesterday }) {
  const statusKey = resolveStatus(note, isYesterday);
  const accent = STATUS_ACCENT[statusKey] || STATUS_ACCENT.captured;
  const sourceLabel =
    memoryCopy(lang, SOURCE_LABELS[note.sourceMode] || { en: note.sourceMode }) ||
    note.sourceMode;

  return (
    <Box
      bg="var(--app-glass-bg-soft)"
      border="1px solid"
      borderColor="var(--app-border)"
      borderRadius="12px"
      px={3}
      py={2.5}
    >
      <VStack align="stretch" spacing={1.5}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="var(--app-text-primary)"
          noOfLines={2}
        >
          {note.concept}
        </Text>
        {note.companionSummary ? (
          <Text fontSize="xs" color="var(--app-text-secondary)" noOfLines={2}>
            {note.companionSummary}
          </Text>
        ) : null}
        <HStack spacing={2} flexWrap="wrap">
          <Badge
            bg={accent.bg}
            color={accent.fg}
            fontSize="10px"
            px={2}
            py="1px"
            borderRadius="full"
            textTransform="none"
          >
            {memoryStatusLabel(lang, statusKey)}
          </Badge>
          <Badge
            variant="outline"
            colorScheme="gray"
            fontSize="9px"
            textTransform="none"
            color="var(--app-text-muted)"
          >
            {sourceLabel}
          </Badge>
          {Number(note.severity) > 1 ? (
            <Text fontSize="9px" color="var(--app-text-muted)">
              ×{note.severity}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </Box>
  );
}

function SectionHeading({ children }) {
  return (
    <Text
      fontSize="2xs"
      fontWeight="bold"
      letterSpacing="0.08em"
      textTransform="uppercase"
      color="var(--app-text-muted)"
      mb={1.5}
    >
      {children}
    </Text>
  );
}

export default function CompanionMemoryList({ targetLang = "es", lang = "en" }) {
  const user = useUserStore((s) => s.user);

  const { todays, yesterdays } = useMemo(() => {
    const all = getCompanionNotes(user, targetLang);
    const todayKey = getCompanionDayKey();
    const yKey = getYesterdayKey();
    return {
      todays: all.filter((n) => n.createdDayKey === todayKey),
      yesterdays: all.filter((n) => n.createdDayKey === yKey),
    };
  }, [user, targetLang]);

  const hasAny = todays.length > 0 || yesterdays.length > 0;

  return (
    <Box mb={hasAny ? 5 : 3}>
      <Text
        fontSize="md"
        fontWeight="bold"
        color="var(--app-text-primary)"
      >
        {memoryCopy(lang, MEMORY_DRAWER_COPY.title)}
      </Text>
      <Text fontSize="xs" color="var(--app-text-secondary)" mb={3}>
        {memoryCopy(lang, MEMORY_DRAWER_COPY.subtitle)}
      </Text>

      {!hasAny ? (
        <Box
          bg="var(--app-glass-bg-soft)"
          border="1px dashed"
          borderColor="var(--app-border)"
          borderRadius="12px"
          px={3}
          py={4}
        >
          <Text fontSize="sm" color="var(--app-text-secondary)">
            {memoryCopy(lang, MEMORY_DRAWER_COPY.empty)}
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" spacing={4}>
          {todays.length > 0 ? (
            <Box>
              <SectionHeading>
                {memoryCopy(lang, MEMORY_DRAWER_COPY.todayHeading)}
              </SectionHeading>
              <VStack align="stretch" spacing={2}>
                {todays.map((note) => (
                  <MemoryCard key={note.id} note={note} lang={lang} />
                ))}
              </VStack>
            </Box>
          ) : null}
          {yesterdays.length > 0 ? (
            <Box>
              <SectionHeading>
                {memoryCopy(lang, MEMORY_DRAWER_COPY.yesterdayHeading)}
              </SectionHeading>
              <VStack align="stretch" spacing={2}>
                {yesterdays.map((note) => (
                  <MemoryCard
                    key={note.id}
                    note={note}
                    lang={lang}
                    isYesterday
                  />
                ))}
              </VStack>
            </Box>
          ) : null}
        </VStack>
      )}
    </Box>
  );
}
