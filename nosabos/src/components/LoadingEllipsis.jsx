export default function LoadingEllipsis({ language }) {
  const label = window.__piyaliStartupLocalization?.getCopy(language).preparing || "Loading…";

  return (
    <div className="loading-ellipsis" role="status">
      <span className="loading-ellipsis__label">{label}</span>
      <span className="loading-ellipsis__dots" aria-hidden="true">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
}
