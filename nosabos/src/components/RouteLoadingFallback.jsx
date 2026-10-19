import { useLocation } from "react-router-dom";
import { shouldShowInitialProgress } from "../utils/loadingPresentation.js";
import LoadingProgress from "./LoadingProgress.jsx";
import LoadingEllipsis from "./LoadingEllipsis.jsx";

export default function RouteLoadingFallback() {
  const { pathname } = useLocation();
  const tracker = window.__piyaliStartupResources;
  let authenticated = false;
  try { authenticated = Boolean(localStorage.getItem("local_nsec")?.trim()); } catch { /* Storage can be disabled. */ }

  return tracker && shouldShowInitialProgress({
    pathname,
    initialPathname: tracker.initialPathname,
    initialLoadingComplete: tracker.initialLoadingComplete,
    authenticated,
  }) ? <LoadingProgress /> : <LoadingEllipsis />;
}
