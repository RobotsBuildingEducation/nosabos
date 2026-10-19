// Self-contained so the same first-visit policy can run before React loads.
export function getInitialLoadingPresentation(pathname, authenticated = false) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  return path === "/links" || (path === "/" && !authenticated) ? "progress" : "ellipsis";
}

export function shouldShowInitialProgress({ pathname, initialPathname, initialLoadingComplete, authenticated }) {
  const normalize = (path) => (path || "/").replace(/\/+$/, "") || "/";
  return !initialLoadingComplete
    && normalize(pathname) === normalize(initialPathname)
    && getInitialLoadingPresentation(pathname, authenticated) === "progress";
}
