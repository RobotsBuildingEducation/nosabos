import { MemoryRouter } from "react-router-dom";
import Onboarding from "../../src/components/Onboarding";
import FlashcardPreview from "./FlashcardPreview";
import GoalCompletionPreview from "./GoalCompletionPreview";
import { theme as duoTheme } from "../../src/theme";
import { applyThemeMode } from "../../src/useThemeStore";
import "../../src/index.css";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ChakraProvider,
  Box,
  Button,
  Heading,
  HStack,
  Select,
  Text,
} from "@chakra-ui/react";
import LearningGoalSettings from "../../src/components/LearningGoalSettings";
import GoalFocusBanner from "../../src/components/GoalFocusBanner";
import useUserStore from "../../src/hooks/useUserStore";
import useGoalFocusStore from "../../src/hooks/useGoalFocusStore";
import {
  activeGoalFor,
  composeQuestKinds,
  GOAL_MODES,
  GOAL_SURFACES,
  normalizeGoalBlueprint,
} from "../../src/utils/learningIntelligenceModel";
import { saveFixture, evaluateGoalAttempt } from "./service";

applyThemeMode(new URLSearchParams(location.search).get("theme") || "light");
const initial = {
  local_npub: "browser-fixture",
  progress: {
    targetLang: "es",
    conversationSubjects: "Original custom topic",
    helpRequest: "Original help",
    tutorVoicePersona: "Original persona",
  },
  learningIntelligence: {},
};
useUserStore
  .getState()
  .setUser(
    JSON.parse(localStorage.getItem("astra-ui-fixture") || "null") || initial,
  );
export function App() {
  const user = useUserStore((s) => s.user);
  const focus = useGoalFocusStore((s) => s.focus);
  const [onboardingResult, setOnboardingResult] = useState(null);
  const [mode, setMode] = useState("tutor");
  const lang = user.progress.targetLang;
  const goal = activeGoalFor(user, lang);
  function start() {
    const blueprint = normalizeGoalBlueprint(
      {
        mode,
        objective: "Ask where your grandmother lived",
        scenario: "Your grandmother mentions her childhood home.",
        targetLanguage: ["¿Dónde vivías?"],
        successCriteria: ["Ask where she lived"],
      },
      { goal, dayKey: "2026-09-09", targetLang: lang },
    );
    useGoalFocusStore
      .getState()
      .setFocus({
        npub: user.local_npub,
        targetLang: lang,
        supportLang: "en",
        surface: GOAL_SURFACES[mode],
        blueprint,
      });
    saveFixture({
      ...user,
      learningIntelligence: {
        ...user.learningIntelligence,
        [lang]: {
          ...user.learningIntelligence[lang],
          dailyGoal: { completed: false },
        },
      },
    });
  }
  if (new URLSearchParams(location.search).has("completion")) return <ChakraProvider theme={duoTheme}><GoalCompletionPreview /></ChakraProvider>;
  if (new URLSearchParams(location.search).has("flashcard")) return <ChakraProvider theme={duoTheme}><FlashcardPreview /></ChakraProvider>;
  if (new URLSearchParams(location.search).has("onboarding")) return (
    <ChakraProvider theme={duoTheme}>
      <MemoryRouter initialEntries={["/onboarding"]}>
        {onboardingResult ? <Box p={6}><Heading size="md">Onboarding saved</Heading><Text data-testid="onboarding-result">{JSON.stringify(onboardingResult)}</Text></Box> : <Onboarding userLanguage={new URLSearchParams(location.search).get("lang") || "en"} onComplete={setOnboardingResult} />}
      </MemoryRouter>
    </ChakraProvider>
  );
  return (
    <ChakraProvider theme={duoTheme}>
      <Box maxW="780px" mx="auto" p={5}>
        <Heading size="md">Astra isolated browser checks</Heading>
        <Text>
          Production settings and Goal check components; local test data and
          deterministic grading. No learner account or network writes.
        </Text>
        <HStack my={4}>
          <Select
            aria-label="Practice language"
            value={lang}
            onChange={(e) =>
              saveFixture({
                ...user,
                progress: { ...user.progress, targetLang: e.target.value },
              })
            }
          >
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </Select>
          <Select
            aria-label="Goal mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {GOAL_MODES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </HStack>
        <LearningGoalSettings
          npub={user.local_npub}
          targetLang={lang}
          appLanguage="en"
        />
        <Text data-testid="courses">
          Courses:{" "}
          {composeQuestKinds(
            ["speak", "learn", "review"],
            ["goal"],
            true,
            Boolean(goal),
          ).join(" → ")}
        </Text>
        {goal && (
          <Button mt={3} onClick={start}>
            Open Goal task
          </Button>
        )}
        {focus && <Text data-testid="route">Surface: {focus.surface}</Text>}
        <GoalFocusBanner surface={focus?.surface} />
        {["phonics", "tutor", "conversation"].includes(focus?.blueprint.mode) && (
          <Button onClick={() => evaluateGoalAttempt(focus, "¿Dónde vivías?")}>
            Fixture: successful native attempt
          </Button>
        )}
        <Text data-testid="custom-preferences">
          Custom preferences: {user.progress.conversationSubjects} |{" "}
          {user.progress.helpRequest} | {user.progress.tutorVoicePersona}
        </Text>
        <Button
          mt={4}
          onClick={() => {
            saveFixture(initial);
            useGoalFocusStore.getState().clearFocus();
          }}
        >
          Reset fixture
        </Button>
      </Box>
    </ChakraProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
