import { useEffect, useState, useSyncExternalStore } from "react";
import { WaveBar } from "./WaveBar";

const EMPTY_RESOURCES = { activities: [], progress: { percentage: 0 } };
const getEmptyResources = () => EMPTY_RESOURCES;
const subscribeEmptyResources = () => () => {};

const STAGES = {
  code: "Preparing your learning space…",
  profile: "Restoring your saved progress…",
  access: "Checking your membership…",
  path: "Preparing your lessons…",
};

// Completion of the route's declared downloads and preparation, not elapsed time.
export default function LoadingProgress({ stage = "code", pageLabel = "Piyali", targetLanguageLabel }) {
  const stageLabel = STAGES[stage] || STAGES.code;
  const label = stage === "path" && targetLanguageLabel ? `Preparing your ${targetLanguageLabel} lessons…` : stageLabel;
  const [takingLonger, setTakingLonger] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const tracker = window.__piyaliStartupResources;
  const resources = useSyncExternalStore(
    tracker?.subscribe || subscribeEmptyResources,
    tracker?.getSnapshot || getEmptyResources,
    getEmptyResources,
  );
  const percentage = resources.progress?.percentage || 0;
  const status = percentage === 100 ? "Your learning space is ready." : label;

  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLonger(true), 12000);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  return (
    <div className="startup-loading">
      <div className="startup-loading__card" aria-busy="true">
        <p className="startup-loading__brand">PIYALI</p>
        <h1 className="startup-loading__title">Opening {pageLabel}</h1>
        <p className="startup-loading__status" role="status">{status}</p>
        <div
          className="startup-loading__progress"
          data-ready={percentage === 100}
          role="progressbar"
          aria-label="Getting your learning space ready"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-valuetext={`${percentage}% ready. ${status}`}
        >
          <WaveBar
            value={percentage}
            animateFill={false}
            bg="var(--startup-wave-track)"
            border="var(--app-border, var(--startup-wave-border))"
          />
        </div>
        <p className="startup-loading__percentage">{percentage}% ready</p>
        <p className="startup-loading__detail">
          {!online ? "You’re offline. Reconnect to continue loading."
            : resources.progress?.failed ? "Something couldn’t finish loading. Please try again."
            : takingLonger ? "This is taking a little longer. Please keep this page open." : null}
        </p>
        {resources.progress?.failed && (
          <button className="startup-loading__retry" type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        )}
        <ol className="startup-loading__resources" aria-label="Preparing your experience" aria-live="off">
          {resources.activities.map((activity) => (
            <li className="startup-loading__activity" data-state={activity.state} key={activity.key}>
              <span className="startup-loading__activity-indicator" aria-hidden="true">
                {activity.state === "ready" ? "✓" : activity.state === "failed" ? "!" : "•"}
              </span>
              <span>{activity.message}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
