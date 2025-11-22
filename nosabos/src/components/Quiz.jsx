// src/components/Quiz.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import QuestionRenderer from "./quiz/QuestionRenderer";
import { shuffle } from "./quiz/utils";
import { translations } from "../utils/translation";

/* ---------------------------
   i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? key) + "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

/**
 * Quiz Component
 *
 * Displays 10 questions from a quiz pool.
 * Requires 8 out of 10 correct answers (80%) to pass.
 * Does NOT award XP.
 *
 * Props:
 * - questions: Array of question objects (should be 10)
 * - onComplete: Callback when quiz is finished (passed: boolean, score: number, correctCount: number)
 * - uiLang: UI language
 * - targetLang: Language being practiced/tested (for question content)
 * - lessonTitle: Title of the lesson for display
 */
export default function Quiz({
  questions = [],
  onComplete,
  uiLang = "en",
  targetLang = "es",
  lessonTitle = "",
}) {
  const t = useT(uiLang);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  // Helper to get text in target language with fallback
  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return '';
    return textObj[targetLang] || textObj.es || textObj.en || Object.values(textObj)[0] || '';
  };

  // Localize questions to target language
  const localizedQuestions = useMemo(() => {
    return questions.map((q) => ({
      ...q,
      stem: getLocalizedText(q.stem),
      options: q.options?.map((opt) => ({
        ...opt,
        label: getLocalizedText(opt.label),
      })),
    }));
  }, [questions, targetLang]);

  // Use exactly 10 questions (shuffle and take first 10)
  const shuffledQuestions = useMemo(
    () => shuffle(localizedQuestions).slice(0, 10),
    [localizedQuestions]
  );

  const totalQuestions = 10;
  const requiredCorrect = 8;
  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Calculate score and pass status
  const correctAnswers = answers.filter((a) => a?.correct).length;
  const passed = correctAnswers >= requiredCorrect;

  function handleSubmit(payload) {
    // Store the answer
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = payload;
      return newAnswers;
    });

    // Move to next question after a short delay
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Quiz finished
        setFinished(true);
        // Calculate final results
        const finalCorrect = [...answers, payload].filter((a) => a?.correct).length;
        const finalPassed = finalCorrect >= requiredCorrect;
        onComplete?.(finalPassed, (finalCorrect / totalQuestions) * 100, finalCorrect);
      }
    }, 1500);
  }

  function handleRetry() {
    setCurrentIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  if (totalQuestions === 0) {
    return (
      <Box p={4}>
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No quiz available</AlertTitle>
          <AlertDescription>
            This lesson doesn't have a quiz yet.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  if (finished) {
    return (
      <Box p={[4, 6]} maxW="800px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            {passed ? (
              <CheckCircleIcon boxSize={16} color="green.400" mb={4} />
            ) : (
              <WarningIcon boxSize={16} color="orange.400" mb={4} />
            )}
            <Heading size="xl" mb={2}>
              {passed ? t("quiz_passed") || "Quiz Passed!" : t("quiz_failed") || "Quiz Failed"}
            </Heading>
            <Text fontSize="lg" color="gray.400">
              {lessonTitle}
            </Text>
          </Box>

          <Divider />

          <Box>
            <VStack spacing={4}>
              <HStack justify="space-between" w="100%">
                <Text fontSize="lg">{t("quiz_score") || "Score"}:</Text>
                <Badge
                  colorScheme={passed ? "green" : "orange"}
                  fontSize="xl"
                  p={2}
                  borderRadius="md"
                >
                  {Math.round(score)}%
                </Badge>
              </HStack>

              <HStack justify="space-between" w="100%">
                <Text fontSize="lg">{t("quiz_correct_answers") || "Correct Answers"}:</Text>
                <Text fontSize="xl" fontWeight="bold" color={correctAnswers >= requiredCorrect ? "green.400" : "orange.400"}>
                  {correctAnswers} / {totalQuestions}
                </Text>
              </HStack>

              <HStack justify="space-between" w="100%">
                <Text fontSize="lg">Required to Pass:</Text>
                <Text fontSize="xl" fontWeight="bold">
                  {requiredCorrect}/{totalQuestions} ({Math.round((requiredCorrect / totalQuestions) * 100)}%)
                </Text>
              </HStack>
            </VStack>
          </Box>

          <Divider />

          {passed ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {t("quiz_congratulations") || "Congratulations!"}
                </AlertTitle>
                <AlertDescription>
                  {t("quiz_passed_message") ||
                    "You've successfully completed this quiz. You can now move on to the next unit."}
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {t("quiz_try_again_title") || "Keep Practicing"}
                </AlertTitle>
                <AlertDescription>
                  {t("quiz_failed_message") ||
                    `You need at least ${requiredCorrect} out of ${totalQuestions} correct to pass. Review the material and try again!`}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <HStack justify="center" spacing={4}>
            {!passed && (
              <Button colorScheme="teal" size="lg" onClick={handleRetry}>
                {t("quiz_retry") || "Retry Quiz"}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => onComplete?.(passed, score)}
            >
              {t("quiz_close") || "Close"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={[4, 6]} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.400">
              {t("quiz_question") || "Question"} {currentIndex + 1} / {totalQuestions}
            </Text>
            <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
              Need {requiredCorrect}/{totalQuestions} correct to pass
            </Badge>
          </HStack>
          <Progress
            value={progress}
            size="sm"
            colorScheme="teal"
            borderRadius="full"
            mb={4}
          />
          {lessonTitle && (
            <Text fontSize="lg" fontWeight="semibold" color="gray.300">
              {lessonTitle}
            </Text>
          )}
        </Box>

        <Divider />

        {/* Question */}
        <Box bg="gray.800" p={6} borderRadius="lg">
          <QuestionRenderer
            item={currentQuestion}
            onSubmit={handleSubmit}
            uiLang={uiLang}
          />
        </Box>

        {/* Progress indicator */}
        <HStack justify="center" spacing={2}>
          {shuffledQuestions.map((_, idx) => (
            <Box
              key={idx}
              w={3}
              h={3}
              borderRadius="full"
              bg={
                idx < currentIndex
                  ? answers[idx]?.correct
                    ? "green.400"
                    : "red.400"
                  : idx === currentIndex
                  ? "blue.400"
                  : "gray.600"
              }
            />
          ))}
        </HStack>
      </VStack>
    </Box>
  );
}
