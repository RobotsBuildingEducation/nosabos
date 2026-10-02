import QuestionActionArea from "./QuestionActionArea.jsx";
import { useAchievementUnlock } from "../achievements/useAchievementUnlock.js";

// Home and other screens without an exercise footer still use the same rail.
// A visible exercise footer has higher ownership priority than this fallback.
export default function AchievementUnlockFallback() {
  const { unlock } = useAchievementUnlock();
  if (!unlock) return null;
  return <QuestionActionArea fallback />;
}
