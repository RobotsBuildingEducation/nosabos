import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Progress,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { LuRefreshCw, LuTrophy, LuSparkles } from "react-icons/lu";
import { simplemodel } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { awardXp } from "../utils/utils";

function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch (err) {
    console.error("Failed to read chunk", err);
  }
  return "";
}

function extractJsonArray(raw = "") {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    console.error("Quiz parse error", err, raw);
    return null;
  }
}

function buildQuizPrompt({
  targetLang,
  supportLang,
  context,
}) {
  const contextDescription = JSON.stringify(context || {}, null, 2);
  return [
    "You are a helpful language tutor making a short end-of-unit quiz.",
    `Target language: ${targetLang}. Support language for explanations: ${supportLang}.`,
    "Use the provided lesson context to keep questions on-topic.",
    "Create EXACTLY 10 multiple-choice questions that review vocabulary, grammar, and scenarios from the context.",
    "Each item must be an object: {question, choices:[...4 options...], answer, explanation}.",
    "- Write the question in the support language but keep answer choices in the target language.",
    "- Make sure 'answer' is an exact match to one of the choices.",
    "- Keep explanations concise (<=30 words) in the support language.",
    "Return ONLY valid JSON array with 10 objects. No markdown.",
    "Lesson context:",
    contextDescription,
  ].join("\n");
}

export default function LessonQuiz({ userLanguage = "en", lessonContent = null, xpReward = 30 }) {
  const toast = useToast();
  const user = useUserStore((s) => s.user);
  const npub = user?.local_npub || user?.npub || "";
  const targetLang = user?.progress?.targetLang || "es";
  const supportLang = user?.progress?.supportLang || userLanguage || "en";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const correctCount = useMemo(() => {
    if (!submitted || !questions.length) return 0;
    return questions.reduce((acc, q, idx) => {
      const chosen = answers[idx];
      return acc + (chosen && chosen === q.answer ? 1 : 0);
    }, 0);
  }, [answers, questions, submitted]);

  const passed = submitted && questions.length > 0 && correctCount / questions.length >= 0.8;

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setSubmitted(false);
    setAnswers({});
    try {
      const prompt = buildQuizPrompt({
        targetLang,
        supportLang,
        context: lessonContent || {
          hint: "Review the previous lessons in this unit.",
        },
      });

      const result = await simplemodel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let transcript = "";
      for await (const chunk of result.stream) {
        transcript += textFromChunk(chunk);
      }

      const parsed = extractJsonArray(transcript);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Quiz generation returned no data");
      }

      const normalized = parsed.slice(0, 10).map((item, idx) => ({
        question: item.question || `Question ${idx + 1}`,
        choices: Array.isArray(item.choices) && item.choices.length
          ? item.choices.slice(0, 4)
          : ["Sí", "No", "Tal vez", "No sé"],
        answer: item.answer || (item.choices?.[0] || ""),
        explanation: item.explanation || "Keep practicing this topic!",
      }));

      setQuestions(normalized);
    } catch (err) {
      console.error("Failed to generate quiz", err);
      setError("Could not build quiz right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lessonContent, supportLang, targetLang]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    const giveReward = async () => {
      if (passed && npub && !awarded) {
        try {
          await awardXp(npub, xpReward, targetLang);
          setAwarded(true);
          toast({
            title: userLanguage === "es" ? "¡Bien hecho!" : "Great job!",
            description:
              userLanguage === "es"
                ? "Has aprobado el quiz y ganado XP."
                : "You passed the quiz and earned XP!",
            status: "success",
            duration: 2500,
          });
        } catch (err) {
          console.error("Failed to award XP", err);
          toast({
            title: userLanguage === "es" ? "Error" : "Error",
            description:
              userLanguage === "es"
                ? "No pudimos otorgar XP."
                : "We could not award XP right now.",
            status: "error",
            duration: 2000,
          });
        }
      }
    };
    giveReward();
  }, [awarded, npub, passed, targetLang, toast, userLanguage, xpReward]);

  const handleSubmit = () => {
    if (!questions.length) return;
    setSubmitted(true);
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: userLanguage === "es" ? "Responde todas" : "Answer everything",
        description:
          userLanguage === "es"
            ? "Completa las 10 preguntas antes de enviar."
            : "Finish all 10 questions before submitting.",
        status: "info",
        duration: 1800,
      });
    }
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <Box>
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} mb={4} flexDir={{ base: "column", md: "row" }}>
        <Box>
          <Heading size="lg" mb={1} display="flex" alignItems="center" gap={2}>
            <LuSparkles /> {userLanguage === "es" ? "Quiz final" : "Unit quiz"}
          </Heading>
          <Text color="gray.300">
            {userLanguage === "es"
              ? "Responde 8 de 10 correctamente para completar la unidad."
              : "Answer 8 of 10 correctly to finish the unit."}
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<LuRefreshCw />}
            variant="outline"
            colorScheme="teal"
            onClick={fetchQuiz}
            isLoading={loading}
          >
            {userLanguage === "es" ? "Nuevo quiz" : "New quiz"}
          </Button>
          <Button
            colorScheme={passed ? "green" : "purple"}
            onClick={handleSubmit}
            isDisabled={loading || !questions.length}
          >
            {submitted ? (passed ? "✔" : "↻") : userLanguage === "es" ? "Enviar" : "Submit"}
          </Button>
        </HStack>
      </Flex>

      <Card bg="gray.900" borderColor="gray.700" borderWidth={1}>
        <CardBody>
          {loading && (
            <Text color="gray.300">
              {userLanguage === "es"
                ? "Generando preguntas con IA..."
                : "Generating questions with AI..."}
            </Text>
          )}
          {error && (
            <Text color="red.300" mb={4}>
              {error}
            </Text>
          )}

          {!loading && !questions.length && !error && (
            <Text color="gray.300">
              {userLanguage === "es"
                ? "No hay preguntas disponibles ahora."
                : "No questions available right now."}
            </Text>
          )}

          <VStack spacing={6} align="stretch">
            {questions.map((q, idx) => {
              const isCorrect = submitted && answers[idx] === q.answer;
              const isIncorrect = submitted && answers[idx] && answers[idx] !== q.answer;
              return (
                <Box
                  key={idx}
                  p={4}
                  borderWidth={1}
                  borderRadius="lg"
                  borderColor={isCorrect ? "green.400" : isIncorrect ? "red.400" : "gray.700"}
                  bg="gray.800"
                >
                  <Text fontWeight="bold" mb={2}>
                    {idx + 1}. {q.question}
                  </Text>
                  <RadioGroup
                    value={answers[idx] || ""}
                    onChange={(val) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [idx]: val,
                      }))
                    }
                    isDisabled={submitted && passed}
                  >
                    <Stack spacing={2}>
                      {q.choices.map((choice, cIdx) => (
                        <Radio key={cIdx} value={choice} colorScheme="teal">
                          {choice}
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                  {submitted && (
                    <Text mt={2} color={isCorrect ? "green.300" : "yellow.200"} fontSize="sm">
                      {isCorrect
                        ? userLanguage === "es"
                          ? "¡Correcto!"
                          : "Correct!"
                        : userLanguage === "es"
                        ? "Respuesta correcta: "
                        : "Correct answer: "}
                      {!isCorrect && <Text as="span">{q.answer}</Text>}
                    </Text>
                  )}
                  {submitted && q.explanation && (
                    <Text mt={1} color="gray.300" fontSize="sm">
                      {q.explanation}
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>

          {questions.length > 0 && (
            <Box mt={8}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text color="gray.300">
                  {userLanguage === "es"
                    ? `${answeredCount}/10 respondidas`
                    : `${answeredCount}/10 answered`}
                </Text>
                <HStack spacing={3} color={passed ? "green.300" : "gray.200"}>
                  <LuTrophy />
                  <Text fontWeight="bold">
                    {submitted
                      ? `${correctCount}/${questions.length} ${userLanguage === "es" ? "correctas" : "correct"}`
                      : userLanguage === "es"
                      ? "Necesitas 8 correctas"
                      : "Need 8 correct"}
                  </Text>
                </HStack>
              </Flex>
              <Progress
                value={(correctCount / (questions.length || 1)) * 100}
                colorScheme={passed ? "green" : "purple"}
                borderRadius="full"
                height="10px"
              />
              {submitted && !passed && (
                <Text color="orange.200" mt={2}>
                  {userLanguage === "es"
                    ? "Inténtalo de nuevo o genera un nuevo quiz."
                    : "Try again or generate a new quiz."}
                </Text>
              )}
              {passed && (
                <Text color="green.200" mt={2} fontWeight="bold">
                  {userLanguage === "es"
                    ? "¡Aprobaste el quiz y ganaste XP!"
                    : "You passed the quiz and earned XP!"}
                </Text>
              )}
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
