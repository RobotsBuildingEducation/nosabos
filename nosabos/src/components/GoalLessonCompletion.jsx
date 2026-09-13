import React, { useEffect, useState } from "react";
import { Button, Spinner, Text, VStack } from "@chakra-ui/react";
import { completeGoalLesson } from "../utils/learningIntelligence";
import { goalLessonCompletionCopy } from "../utils/learningGoalCopy";

// Commits a goal lesson at 100%, including when resuming a saved lesson. The
// app can keep the answered exercise mounted while this runs; failed saves
// still expose Retry and never permit another question.
export default function GoalLessonCompletion({
  lesson,
  npub,
  targetLang,
  appLanguage,
  onComplete,
  preserveLesson = false,
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const copy = goalLessonCompletionCopy(appLanguage);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setCompleted(false);
    completeGoalLesson({ lesson, npub, targetLang }).then((completed) => {
      if (!active) return;
      if (completed) {
        setCompleted(true);
        onComplete();
      }
      else setFailed(true);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [lesson, npub, targetLang, onComplete, attempt]);

  // In the in-app lesson flow, keep the answered question mounted behind the
  // task-complete modal. This component exists only to commit completion; it
  // should not replace the question with a second success screen.
  if (preserveLesson && (completed || !failed)) return null;

  return <VStack minH="240px" justify="center" spacing={4} px={5} color="var(--app-text-primary)">
    {failed ? <>
      <Text role="alert" textAlign="center">{copy.error}</Text>
      <Button colorScheme="teal" onClick={() => setAttempt((value) => value + 1)}>{copy.retry}</Button>
    </> : <>
      <Spinner aria-hidden="true" />
      <Text role="status">{copy.saving}</Text>
    </>}
  </VStack>;
}
