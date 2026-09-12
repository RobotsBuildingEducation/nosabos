import React from "react";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { journeyCopy } from "../utils/voiceJourneyCopy";
import { getLocalDayKey } from "../utils/flashcardReview";

export default function MemoryGoals({ bucket, lang = "en" }) {
  const t = key => journeyCopy(lang, key);
  const goal = bucket?.activeGoal;
  if (!goal?.text) return null;
  const summary = bucket.goalProgress || {};
  const blueprint = bucket.dailyGoal?.blueprint;
  const today = blueprint?.goalId === goal.id && blueprint?.dayKey === getLocalDayKey(new Date()) ? blueprint : null;
  const sections = ["demonstrated", "openCapabilities", "usefulLanguage"];
  const hasEvidence = sections.some(key => summary[key]?.length);
  const stageLabel = entry => t(entry.domain === "recall" ? "recognition" : entry.stage === "lightly supported" ? "lightlySupported" : entry.stage || "prompted");
  return <VStack align="stretch" spacing={5}>
    <Box p={5} borderRadius="2xl" bg="var(--app-surface)" border="1px solid" borderColor="var(--app-border)">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color="var(--app-text-muted)">{t("currentGoal")}</Text>
        <Badge colorScheme={goal.status === "achieved" ? "green" : goal.status === "paused" ? "gray" : "teal"}>{t(goal.status || "active")}</Badge>
      </HStack>
      <Text fontSize="lg" fontWeight="semibold" whiteSpace="pre-wrap">{goal.text}</Text>
    </Box>
    <Text fontSize="sm" color="var(--app-text-secondary)">{t("goalIntro")}</Text>
    {!hasEvidence && <Text fontSize="sm" color="var(--app-text-muted)">{t("goalEmpty")}</Text>}
    {sections.map(section => summary[section]?.length > 0 && <Box key={section}>
      <Text fontWeight="semibold" fontSize="sm" mb={2}>{t(section)}</Text>
      <VStack align="stretch" spacing={2}>
        {summary[section].map((entry, index) => <Box key={index} p={3} borderRadius="xl" border="1px solid" borderColor="var(--app-border)">
          <Text fontSize="sm">{typeof entry === "string" ? entry : entry.target}</Text>
          {typeof entry !== "string" && <>
            {entry.example && <Text fontSize="sm" color="var(--app-text-secondary)" mt={1}>{entry.example}</Text>}
            <Badge mt={2} colorScheme="teal" variant="subtle" whiteSpace="normal">{stageLabel(entry)}</Badge>
          </>}
        </Box>)}
      </VStack>
    </Box>)}
    {goal.status === "active" && (today || summary.nextGoalGuidance?.target) && <Box p={4} bg="var(--app-surface)" borderRadius="xl" border="1px solid" borderColor="var(--app-border)">
      <Text fontWeight="semibold" fontSize="sm" mb={2}>{t(today ? "todayAction" : "nextPractice")}</Text>
      <Text fontSize="sm">{today?.objective || summary.nextGoalGuidance.target}</Text>
      {today?.rationale && <Text mt={2} fontSize="sm" color="var(--app-text-secondary)">{today.rationale}</Text>}
    </Box>}
  </VStack>;
}
