import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import englishCopy from "../pwa/loadingCopy/en.js";

const EMPTY_RESOURCES = { activities: [], progress: { percentage: 0 } };
const getEmptyResources = () => EMPTY_RESOURCES;
const subscribeEmptyResources = () => () => {};

// Completion of the route's declared downloads and preparation, not elapsed time.
export default function LoadingProgress({ stage = "code", language, targetLanguage, targetLanguageLabel }) {
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
  const copy = resources.locale?.copy || englishCopy;
  const label = tracker?.localization?.stage(stage, targetLanguage, targetLanguageLabel) || copy[stage] || copy.code;
  const status = determinate && percentage === 100 ? copy.ready : label;
  const percentageLabel = determinate ? resources.progress?.label || `${percentage}% ready` : copy.preparing;
  const uiLanguage = resources.locale?.language || "en";

  useLayoutEffect(() => {
    if (language) tracker?.setLanguage(language);
  }, [language, tracker]);

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
    <div className="startup-loading" lang={uiLanguage} dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
      <div className="startup-loading__card" aria-busy="true">
        <p className="startup-loading__brand">PIYALI</p>
        <h1 className="startup-loading__title">{copy.title}</h1>
        <p className="startup-loading__status" role="status">{status}</p>
        <div
          className="startup-loading__track"
          data-ready={determinate && percentage === 100}
          role="progressbar"
          aria-label={copy.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? percentage : undefined}
          aria-valuetext={determinate ? `${percentageLabel}. ${status}` : status}
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
        <p className="startup-loading__percentage">{percentageLabel}</p>
        <ol className="startup-loading__resources" aria-label={copy.resourcesLabel} aria-live="off">
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
            {!online ? copy.offline
              : resources.progress?.failed ? copy.failed
              : takingLonger ? copy.takingLonger : null}
          </p>
          <button className="startup-loading__retry" type="button" hidden={!resources.progress?.failed} onClick={() => window.location.reload()}>
            {copy.retry}
          </button>
        </div>
      </div>
    </div>
  );
}
