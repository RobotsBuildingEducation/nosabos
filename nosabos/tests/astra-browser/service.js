import useUserStore from "../../src/hooks/useUserStore";
import useGoalFocusStore from "../../src/hooks/useGoalFocusStore";
import {
  changeGoal,
  activeGoalFor,
  mergeEvidence,
} from "../../src/utils/learningIntelligenceModel";
export const astraGoalsEnabled = () => true;
let completionAttempts = 0;
export async function completeGoalLesson() {
  completionAttempts += 1;
  if (new URLSearchParams(location.search).has("fail") && completionAttempts === 1) throw new Error("Fixture save failure");
  return true;
}
export function saveFixture(user) {
  localStorage.setItem("astra-ui-fixture", JSON.stringify(user));
  useUserStore.getState().setUser(user);
}
export async function saveLearningGoal({ targetLang, text, status }) {
  const user = useUserStore.getState().user;
  saveFixture({
    ...user,
    learningIntelligence: {
      ...user.learningIntelligence,
      [targetLang]: changeGoal(user.learningIntelligence[targetLang], {
        text,
        status,
        id: crypto.randomUUID(),
      }),
    },
  });
  useGoalFocusStore.getState().clearFocus();
}
export function currentGoalFocus(surface) {
  const user = useUserStore.getState().user;
  const focus = useGoalFocusStore.getState().focus;
  return focus &&
    (!surface || focus.surface === surface) &&
    focus.targetLang === user.progress.targetLang &&
    activeGoalFor(user, focus.targetLang)?.id === focus.blueprint.goalId
    ? focus
    : null;
}
export async function evaluateGoalAttempt(focus, response) {
  const success = response.trim() === "¿Dónde vivías?";
  const user = useUserStore.getState().user;
  const bucket = user.learningIntelligence[focus.targetLang];
  saveFixture({
    ...user,
    learningIntelligence: {
      ...user.learningIntelligence,
      [focus.targetLang]: {
        ...bucket,
        dailyGoal: { completed: success },
        goalProgress: mergeEvidence(
          bucket.goalProgress,
          {
            id: crypto.randomUUID(),
            target: focus.blueprint.objective,
            mode: focus.blueprint.mode,
            success,
            support: "prompted",
            observation: response,
          },
          "goal",
        ),
      },
    },
  });
  return {
    success,
    feedback: success
      ? "Observable goal action accepted."
      : "Try asking where she lived: ¿Dónde vivías?",
  };
}
