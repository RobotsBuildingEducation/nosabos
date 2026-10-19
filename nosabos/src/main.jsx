import { preparePublicPageCopy } from "./features/publicCopy/startup";
import { loadFirebaseBackend } from "./firebaseResources/loadBackend.js";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Self-hosted DM Sans (the landing-page hero font) — bundled by Vite so it
// renders reliably without an external request. Used by the companion's
// speech balloon (and available app-wide).
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import "./useThemeStore";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import { theme } from "./theme";
import LoadingEllipsis from "./components/LoadingEllipsis.jsx";
import RouteLoadingFallback from "./components/RouteLoadingFallback.jsx";
import BootReadyBoundary from "./components/BootReadyBoundary.jsx";
import AppLoadBoundary from "./components/AppLoadBoundary.jsx";
import { initAppUpdateCoordinator } from "./pwa/appUpdateCoordinator";

// Keep the one-time cache-busting recovery parameter out of the visible URL
// once the fresh application entry point has loaded.
if (typeof window !== "undefined") {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has("_piyali_reload")) {
    currentUrl.searchParams.delete("_piyali_reload");
    window.history.replaceState(window.history.state, "", currentUrl.href);
  }
}

function lazyPage(key, load) {
  return lazy(() => {
    window.__piyaliStartupResources?.beginPage(key);
    // Only the public landing/links pages postpone backend startup.
    const preparation = ["landing", "links"].includes(key) ? preparePublicPageCopy(key) : loadFirebaseBackend();
    return Promise.all([load(), preparation]).then(([module]) => {
      window.__piyaliStartupResources?.completeCode(key);
      return module;
    });
  });
}

const App = lazyPage("app", () => import("./App.jsx"));
const LandingPage = lazyPage("landing", () => import("./components/LandingPage.jsx"));
const LinksPage = lazyPage("links", () => import("./components/LinksPage.jsx"));
const LegacyLinksPage = lazyPage("legacy-links", () => import("./components/LegacyLinksPage.jsx"));
const ProficiencyTest = lazyPage("proficiency", () => import("./components/ProficiencyTest.jsx"));
const SquirclePlayground = lazyPage("squircle", () => import("./components/SquirclePlayground.jsx"));
const OrbingPlayground = lazyPage("orbing", () => import("./components/orbing/OrbingPlayground.jsx"));
const CitizenshipGuide = lazyPage("citizenship", () => import("./components/CitizenshipGuide.jsx"));
const PatreonOAuthDrawerReturn = lazyPage("patreon-return", () => import("./components/PatreonOAuthDrawerReturn.jsx"));

const hasStoredKey = () => {
  if (typeof window === "undefined") return false;
  const secret = localStorage.getItem("local_nsec");
  return Boolean(secret && secret.trim());
};

function AppContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredKey);
  const [appReady, setAppReady] = useState(false);
  const handleAuthenticated = useCallback(() => {
    window.__piyaliStartupResources?.beginPage("app");
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key && event.key !== "local_nsec") return;
      setIsAuthenticated(hasStoredKey());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!isAuthenticated) {
    return (
      <BootReadyBoundary pageKey="landing">
        <LandingPage onAuthenticated={handleAuthenticated} />
      </BootReadyBoundary>
    );
  }

  return (
    <AppLoadBoundary>
      <BootReadyBoundary pageKey="app" ready={appReady}>
        <Suspense fallback={<LoadingEllipsis />}>
          <App onBootReady={setAppReady} />
        </Suspense>
        <Outlet />
      </BootReadyBoundary>
    </AppLoadBoundary>
  );
}

function ProficiencyContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredKey);

  const handleAuthenticated = useCallback(() => {
    window.__piyaliStartupResources?.beginPage("proficiency");
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event) => {
      if (event.key && event.key !== "local_nsec") return;
      setIsAuthenticated(hasStoredKey());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!isAuthenticated) {
    return (
      <BootReadyBoundary pageKey="landing">
        <LandingPage onAuthenticated={handleAuthenticated} />
      </BootReadyBoundary>
    );
  }

  return (
    <Suspense fallback={<LoadingEllipsis />}>
      <BootReadyBoundary pageKey="proficiency">
        <ProficiencyTest />
      </BootReadyBoundary>
    </Suspense>
  );
}

// Leave the inline screen in place while non-blocking application CSS loads.
// Fonts are optional; they never delay mounting or the initial feedback.
Promise.resolve(window.__piyaliStartupResources?.whenStylesReady()).then(() => {
  window.__piyaliStartupResources?.completeShell();
  initAppUpdateCoordinator();
  createRoot(document.getElementById("root")).render(
    <ChakraProvider theme={theme}>
      <div className="app-shell">
        <Router>
          <AppLoadBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route element={<AppContainer />}>
                  <Route path="/" element={null} />
                  <Route path="/onboarding" element={null} />
                  <Route path="/onboarding/*" element={null} />
                  <Route path="/subscribe" element={null} />
                </Route>
                <Route
                  path="/patreon-return"
                  element={
                    <BootReadyBoundary pageKey="patreon-return">
                      <PatreonOAuthDrawerReturn />
                    </BootReadyBoundary>
                  }
                />
                <Route path="/proficiency" element={<ProficiencyContainer />} />
                <Route
                  path="/orbing"
                  element={
                    <AppLoadBoundary>
                      <BootReadyBoundary pageKey="orbing"><OrbingPlayground /></BootReadyBoundary>
                    </AppLoadBoundary>
                  }
                />
                <Route
                  path="/links"
                  element={
                    <BootReadyBoundary pageKey="links">
                      <LinksPage />
                    </BootReadyBoundary>
                  }
                />
                <Route
                  path="/legacy-links"
                  element={
                    <BootReadyBoundary pageKey="legacy-links">
                      <LegacyLinksPage />
                    </BootReadyBoundary>
                  }
                />
                <Route
                  path="/squircle"
                  element={
                    <BootReadyBoundary pageKey="squircle">
                      <SquirclePlayground />
                    </BootReadyBoundary>
                  }
                />
                <Route
                  path="/citizenship"
                  element={
                    <BootReadyBoundary pageKey="citizenship">
                      <CitizenshipGuide />
                    </BootReadyBoundary>
                  }
                />
              </Routes>
            </Suspense>
          </AppLoadBoundary>
        </Router>
      </div>
    </ChakraProvider>,
  );
});
