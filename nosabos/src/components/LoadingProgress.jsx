import { useEffect, useState, useSyncExternalStore } from "react";

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
export default function LoadingProgress({ stage = "code", targetLanguageLabel }) {
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
  const determinate = resources.progress?.determinate !== false;
  const status = determinate && percentage === 100 ? "Your learning space is ready." : label;

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
        <h1 className="startup-loading__title">Opening Piyali</h1>
        <p className="startup-loading__status" role="status">{status}</p>
        <div
          className="startup-loading__track"
          data-ready={determinate && percentage === 100}
          role="progressbar"
          aria-label="Getting your learning space ready"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? percentage : undefined}
          aria-valuetext={determinate ? `${percentage}% ready. ${status}` : status}
        >
          {/* Match the HTML loader exactly; never animate a new fill from zero. */}
          <span className="startup-loading__fill" style={{ width: `${percentage}%` }}>
            <svg viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <g className="startup-loading__wave" opacity="0.18">
                <path d="M0,18 C10,14 20,22 30,18 S50,14 60,18 S80,22 90,18 S110,14 120,18 L120,30 L0,30 Z" fill="#fff" />
              </g>
            </svg>
          </span>
        </div>
        <p className="startup-loading__percentage">{determinate ? `${percentage}% ready` : "Preparing…"}</p>
        <ol className="startup-loading__resources" aria-label="Preparing your experience" aria-live="off">
          {resources.activities.map((activity) => (
            <li className="startup-loading__activity" data-state={activity.state} key={activity.key} style={{ gridRow: activity.slot + 1 }}>
              <span className="startup-loading__activity-indicator" aria-hidden="true">
                {activity.state === "ready" ? "✓" : activity.state === "failed" ? "!" : "•"}
              </span>
              <span className="startup-loading__activity-message">{activity.message}</span>
            </li>
          ))}
        </ol>
        <div className="startup-loading__feedback">
          <p className="startup-loading__detail">
            {!online ? "You’re offline. Reconnect to continue loading."
              : resources.progress?.failed ? "Something couldn’t finish loading. Please try again."
              : takingLonger ? "This is taking a little longer. Please keep this page open." : null}
          </p>
          <button className="startup-loading__retry" type="button" hidden={!resources.progress?.failed} onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
