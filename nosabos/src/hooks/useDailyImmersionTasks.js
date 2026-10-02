import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { awardXp } from "../utils/utils";
import useSoundSettings from "./useSoundSettings";
import { sparkleSound } from "../constants/sounds";
import { REAL_WORLD_TASKS_REWARD_XP } from "../constants/realWorldTasks";
import { getDailyPlateDayKey } from "../utils/dailyPlate";
import { loadLearningPath, loadMultiLevelLearningPath } from "../data/skillTree/index.js";
import { getCourseLevelStats, getCourseProgressSummary } from "../utils/courseProgress";
import { INTRO_TUTORIAL_LESSON_ID } from "../utils/introTutorial";
import {
  immersionLessonCandidate, leadingImmersionLesson, summarizeImmersionLesson,
} from "../utils/immersionCurriculumContext";
import { generationPerformanceContextFor, scoreForUser } from "../utils/performanceEloModel";
import {
  DAILY_IMMERSION_GENERATION_VERSION, appendImmersionHistory,
  generateDailyImmersionTasks, getDailyImmersionState, hasImmersionPlacement,
} from "../utils/dailyImmersion";

export default function useDailyImmersionTasks({
  user, npub, targetLang, appLanguage, cefrLevel, goal,
  lessonLevel = "Pre-A1", lessonProgress = {}, tutorLevel = "Pre-A1",
  introTutorialLevel = null,
  now = Date.now(), enabled = true, patchUser, onRewardClaimed,
}) {
  const dayKey = getDailyPlateDayKey(new Date(now));
  const awaitingPlacement = !hasImmersionPlacement(user, targetLang);
  const batch = user?.realWorldTasks || null;
  const state = useMemo(() => getDailyImmersionState(batch, {
    dayKey, targetLang, appLanguage, goal,
    placementAt: user?.proficiencyPlacementAt || null,
  }), [batch, dayKey, targetLang, appLanguage, goal, user?.proficiencyPlacementAt]);
  const [pending, setPending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardJustAwarded, setRewardJustAwarded] = useState(false);
  const playSound = useSoundSettings((store) => store.playSound);
  const [rewardError, setRewardError] = useState("");
  const [error, setError] = useState("");
  const guardRef = useRef(false);
  const rewardGuardRef = useRef(false);
  const attemptedRef = useRef("");
  const scopeRef = useRef("");
  scopeRef.current = `${npub || ""}:${targetLang}:${dayKey}:${goal?.id || ""}:${goal?.text || ""}:${user?.proficiencyPlacementAt || ""}:${cefrLevel}`;

  const persist = useCallback(async (next, expectedScope = scopeRef.current, historyByLanguage = null) => {
    if (!npub) return;
    await setDoc(doc(database, "users", npub), {
      realWorldTasks: next, updatedAt: new Date().toISOString(),
      ...(historyByLanguage ? { realWorldTaskHistoryByLanguage: historyByLanguage } : {}),
    }, { merge: true });
    if (scopeRef.current === expectedScope) patchUser?.({
      realWorldTasks: next,
      ...(historyByLanguage ? { realWorldTaskHistoryByLanguage: historyByLanguage } : {}),
    });
  }, [npub, patchUser]);

  const sync = useCallback(async () => {
    if (!enabled || awaitingPlacement || !user || !npub || !dayKey || guardRef.current || state.status === "ready") return;
    guardRef.current = true;
    const expectedScope = scopeRef.current;
    setPending(true);
    setError("");
    try {
      let next;
      let nextHistoryByLanguage = null;
      const languageKey = String(targetLang || "es").toLowerCase();
      const historyByLanguage = { ...(user?.realWorldTaskHistoryByLanguage || {}) };
      const previousLanguageKey = String(batch?.targetLang || "").toLowerCase();
      if (previousLanguageKey && previousLanguageKey !== languageKey) {
        historyByLanguage[previousLanguageKey] = appendImmersionHistory(
          historyByLanguage[previousLanguageKey],
          [...(batch?.recentTaskHistory || []), ...(batch?.tasks || [])],
        );
      }
      const savedHistory = historyByLanguage[languageKey] || [];
      const sameLanguageBatch = batch?.targetLang === targetLang;
      const legacyHistory = sameLanguageBatch ? batch?.recentTaskHistory || [] : [];
      if (state.status === "goal_removed") {
        next = { ...batch, tasks: batch.tasks.slice(0, 3),
          completed: (batch.completed || []).slice(0, 3),
          goalId: "", goalText: "", dayKey };
        nextHistoryByLanguage = {
          ...historyByLanguage,
          [languageKey]: appendImmersionHistory(savedHistory, batch.tasks.slice(3)),
        };
      } else {
        const goalText = String(goal?.text || "").trim();
        const recentTasks = appendImmersionHistory(
          appendImmersionHistory(savedHistory, legacyHistory),
          sameLanguageBatch ? batch.tasks || [] : [],
        );
        let currentLearning = null;
        try {
          const [skillUnits, tutorUnits] = await Promise.all([
            loadMultiLevelLearningPath(targetLang, [lessonLevel], {
              introTutorialLevel,
            }),
            loadLearningPath(targetLang, tutorLevel),
          ]);
          const languageKey = String(targetLang || "es").toLowerCase();
          const tutorProgress = user?.progress?.tutorLanguageLessons?.[languageKey] || {};
          const summary = getCourseProgressSummary(user?.progress, languageKey);
          const skillCount = getCourseLevelStats(summary, "skillTree", lessonLevel).completed;
          const tutorCount = getCourseLevelStats(summary, "tutor", tutorLevel).completed;
          const skillTree = immersionLessonCandidate({
            units: skillUnits, progress: lessonProgress,
            completedCount: skillCount, level: lessonLevel,
            mode: "Lessons",
            priorityLessonId: introTutorialLevel ? INTRO_TUTORIAL_LESSON_ID : null,
          });
          const tutor = immersionLessonCandidate({
            units: tutorUnits, progress: tutorProgress,
            completedCount: tutorCount, level: tutorLevel, mode: "Tutor",
          });
          const leading = leadingImmersionLesson(skillTree, tutor);
          currentLearning = leading
            ? {
                ...summarizeImmersionLesson(leading.lesson, appLanguage),
                level: leading.level, source: leading.mode,
              }
            : null;
        } catch (cause) {
          console.warn("Could not read the next lesson for immersion context:", cause);
        }
        const generated = await generateDailyImmersionTasks({
          targetLang, appLanguage, cefrLevel, goalText,
          onlyGoal: state.status === "goal_update",
          performance: generationPerformanceContextFor(user, targetLang),
          score: scoreForUser(user, targetLang),
          learningContext: currentLearning,
          recentTasks,
        });
        next = state.status === "goal_update"
          ? { ...batch, tasks: [...batch.tasks.slice(0, 3), generated[0]],
            completed: [...(batch.completed || []).slice(0, 3), false],
            goalId: goal?.id || "", goalText, dayKey }
          : { tasks: generated, completed: generated.map(() => false),
            rewarded: false, generatedAt: new Date().toISOString(),
            targetLang, cefrLevel, appLanguage, dayKey,
            placementAt: user?.proficiencyPlacementAt || null,
            generationVersion: DAILY_IMMERSION_GENERATION_VERSION,
            goalId: goal?.id || "", goalText };
        if (state.status !== "goal_update") {
          next.recentTaskHistory = recentTasks;
        }
        if (state.status === "goal_update" && batch.tasks.length > 3) {
          nextHistoryByLanguage = {
            ...historyByLanguage,
            [languageKey]: appendImmersionHistory(savedHistory, batch.tasks.slice(3)),
          };
        } else if (state.status !== "goal_update") {
          nextHistoryByLanguage = {
            ...historyByLanguage,
            [languageKey]: recentTasks,
          };
        }
      }
      if (scopeRef.current !== expectedScope) return;
      await persist(next, expectedScope, nextHistoryByLanguage);
    } catch (cause) {
      console.error("Daily immersion generation failed:", cause);
      setError("Could not create today's immersion tasks. Please try again.");
    } finally {
      setPending(false);
      guardRef.current = false;
    }
  }, [enabled, awaitingPlacement, npub, dayKey, state.status, batch, goal?.id, goal?.text,
    targetLang, appLanguage, cefrLevel, lessonLevel, tutorLevel,
    lessonProgress, introTutorialLevel, user, persist]);

  const attemptKey = `${npub || ""}:${targetLang}:${dayKey}:${goal?.id || ""}:${goal?.text || ""}:${user?.proficiencyPlacementAt || ""}:${cefrLevel}:${state.status}`;
  useEffect(() => {
    if (!enabled || awaitingPlacement || !user || !npub || pending || guardRef.current ||
      state.status === "ready" || attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;
    void sync();
  }, [enabled, awaitingPlacement, user, npub, pending, state.status, attemptKey, sync]);

  const retry = useCallback(() => {
    attemptedRef.current = "";
    void sync();
  }, [sync]);

  const awardCompletion = useCallback(async (completedBatch, expectedScope = scopeRef.current, options = {}) => {
    if (!npub || !targetLang || !dayKey || rewardGuardRef.current) return;
    rewardGuardRef.current = true;
    setClaiming(true);
    setRewardError("");
    try {
      const result = await awardXp(npub, REAL_WORLD_TASKS_REWARD_XP, targetLang, {
        source: "immersion",
        idempotencyKey: `daily-immersion:${targetLang}:${dayKey}`,
      });
      const next = {
        ...completedBatch,
        rewarded: true,
        rewardedAt: completedBatch?.rewardedAt || new Date().toISOString(),
      };
      await persist(next, expectedScope);
      if (scopeRef.current === expectedScope) {
        if (!options.alreadyCelebrated) {
          setRewardJustAwarded(true);
          void playSound(sparkleSound);
        }
        onRewardClaimed?.(REAL_WORLD_TASKS_REWARD_XP);
      }
      return result;
    } catch (cause) {
      console.error("Could not automatically claim immersion reward:", cause);
      setRewardError(true);
      if (options.alreadyCelebrated) {
        setRewardJustAwarded(false);
        const unrewarded = { ...completedBatch, rewarded: false };
        if (scopeRef.current === expectedScope) {
          patchUser?.({ realWorldTasks: unrewarded });
        }
        void persist(unrewarded, expectedScope).catch(() => {});
      }
      throw cause;
    } finally {
      setClaiming(false);
      rewardGuardRef.current = false;
    }
  }, [npub, targetLang, dayKey, persist, playSound, onRewardClaimed, patchUser]);

  useEffect(() => {
    setRewardJustAwarded(false);
  }, [dayKey, targetLang, goal?.id, goal?.text]);

  useEffect(() => {
    if (!rewardJustAwarded) return undefined;
    const timeout = setTimeout(() => setRewardJustAwarded(false), 3500);
    return () => clearTimeout(timeout);
  }, [rewardJustAwarded]);

  useEffect(() => {
    if (!enabled || state.status !== "ready" || state.rewarded || !state.completed.length ||
        !state.completed.every(Boolean) || rewardGuardRef.current) return;
    void awardCompletion(batch).catch(() => {});
  }, [enabled, state.status, state.rewarded, state.completed, batch, awardCompletion]);

  const toggleTask = useCallback(async (index) => {
    if (!batch || pending || claiming || state.status !== "ready" || index < 0 || index >= state.tasks.length) return;
    const completed = [...state.completed];
    completed[index] = !completed[index];
    const isCompletingAll = completed.length > 0 && completed.every(Boolean) && !batch.rewarded;
    const next = isCompletingAll
      ? { ...batch, completed, rewarded: true, rewardedAt: new Date().toISOString() }
      : { ...batch, completed };

    patchUser?.({ realWorldTasks: next });

    if (isCompletingAll) {
      setRewardJustAwarded(true);
      void playSound(sparkleSound);
    }

    try {
      if (isCompletingAll) {
        await awardCompletion(next, scopeRef.current, { alreadyCelebrated: true });
      } else {
        await persist(next);
      }
    } catch (cause) {
      console.error("Could not save immersion progress:", cause);
    }
  }, [batch, pending, claiming, state, patchUser, persist, awardCompletion, playSound]);

  const retryReward = useCallback(() => {
    if (!batch || state.status !== "ready" || !state.completed.length ||
        !state.completed.every(Boolean) || state.rewarded) return;
    void awardCompletion(batch).catch(() => {});
  }, [batch, state, awardCompletion]);

  return {
    ...state,
    ...(awaitingPlacement ? { status: "awaiting_placement", tasks: [], completed: [] } : {}),
    awaitingPlacement, goal: Boolean(goal?.text),
    isGenerating: !awaitingPlacement && (pending || (enabled && Boolean(user) && Boolean(npub) && state.status !== "ready" && !error)),
    isClaiming: claiming, rewardJustAwarded, rewardError, error, retry, retryReward, toggleTask,
  };
}
