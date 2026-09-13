import React, { useCallback, useState } from "react";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import GoalLessonCompletion from "../../src/components/GoalLessonCompletion";
import FeedbackRail from "../../src/components/FeedbackRail";
import { buildGoalLesson } from "../../src/utils/learningIntelligenceModel";
import { isGoalLessonReady } from "../../src/utils/lessonProgress";

const blueprint = { goalId: "completion-fixture", dayKey: "2026-09-09", mode: "lesson", objective: "Invite someone for coffee", scenario: "Invite a friend", targetLanguage: [], supports: [], successCriteria: [] };
const lesson = buildGoalLesson(blueprint);
export default function GoalCompletionPreview() {
  const [xp, setXp] = useState(new URLSearchParams(location.search).has("resume") ? lesson.xpReward : 0);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const onComplete = useCallback(() => setCompletionOpen(true), []);
  const bucket = { activeGoal: { id: blueprint.goalId, status: "active" }, dailyGoal: { blueprint, preparationXp: xp } };
  return <Box p={6}>
    {advanced ? <Heading>Tutor</Heading> : <>
      <Heading>Goal lesson</Heading><Button onClick={() => setXp(value => value + 5)}>Correct answer +5 XP</Button>
      {xp > 0 && <FeedbackRail ok xp={5} showNext onNext={() => {}} nextLabel="Next question" userLanguage="en" t={key => key}
        lessonProgress={{ pct: xp / lesson.xpReward * 100, earned: xp, total: lesson.xpReward, label: "Lesson progress" }} />}
      {isGoalLessonReady(bucket, lesson) && <GoalLessonCompletion lesson={lesson} npub="completion-fixture" targetLang="en" appLanguage="en" onComplete={onComplete} preserveLesson />}
      {completionOpen && <Box role="dialog" aria-label="Task complete"><Heading>Task complete</Heading>
        <Button onClick={() => { setCompletionOpen(false); setAdvanced(true); }}>Continue</Button></Box>}
    </>}
  </Box>;
}
