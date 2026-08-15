import React, { useState } from "react";
import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import DelightQuestionLab from "./DelightQuestionLab";
import { DELIGHT_VARIANT_TEST_GATE } from "../config/delightVariantGate";
import { questionSquircleStyle } from "./questionUiStyles";

export default function DelightVariantLabPage() {
  const [moduleType, setModuleType] = useState("grammar");
  const previewLesson =
    moduleType === "grammar"
      ? {
          id: "A1-sentence-detective-preview",
          cefrLevel: "A1",
          topic: "completed actions in the past",
          focusPoints: [
            "preterite person and number agreement with explicit past-time cues",
          ],
          levelGuard: "Use short sentences and familiar everyday vocabulary.",
        }
      : {
          id: "A1-sentence-detective-preview",
          cefrLevel: "A1",
          topic: "everyday objects and their functions",
          words: ["llave", "paraguas", "cuchara", "lápiz"],
          focusPoints: ["choose an object from a direct functional context"],
          levelGuard: "Use short sentences and concrete everyday meanings.",
        };

  if (!DELIGHT_VARIANT_TEST_GATE) {
    return (
      <Box p={8} color="var(--app-text-primary)">
        The delight-variant testing gate is disabled.
      </Box>
    );
  }

  return (
    <Box minH="100dvh" bg="var(--app-surface)" py={6}>
      <VStack maxW="760px" mx="auto" px={4} align="stretch" spacing={2}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <HStack spacing={2}>
              <Text fontSize="2xl" fontWeight="900" color="var(--app-text-primary)">
                Delight Variant Lab
              </Text>
              <Badge colorScheme="purple">Temporary</Badge>
            </HStack>
            <Text fontSize="sm" color="var(--app-text-secondary)">
              Isolated preview of the gated question experience.
            </Text>
          </Box>
          <HStack
            p={1}
            bg="var(--app-surface-muted)"
            borderWidth="1px"
            borderColor="var(--app-border)"
            borderRadius="xl"
            style={questionSquircleStyle}
          >
            {[
              ["grammar", "Grammar"],
              ["vocabulary", "Vocabulary"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                colorScheme={moduleType === value ? "purple" : undefined}
                variant={moduleType === value ? "solid" : "ghost"}
                onClick={() => setModuleType(value)}
                style={questionSquircleStyle}
              >
                {label}
              </Button>
            ))}
          </HStack>
        </HStack>
      </VStack>
      <DelightQuestionLab
        key={moduleType}
        moduleType={moduleType}
        lesson={previewLesson}
        lessonContent={previewLesson}
      />
    </Box>
  );
}
