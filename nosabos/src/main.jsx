import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import "./index.css";
// Self-hosted DM Sans (the landing-page hero font) — bundled by Vite so it
// renders reliably without an external request. Used by the companion's
// speech balloon (and available app-wide).
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import "./useThemeStore";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes, Outlet, useParams, useLocation } from "react-router-dom";
import { theme } from "./theme";
import AppLoadBoundary from "./components/AppLoadBoundary.jsx";
import { initAppUpdateCoordinator } from "./pwa/appUpdateCoordinator";
import PublicSeo from "./components/PublicSeo.jsx";
import PublicLanguageLinks from "./components/PublicLanguageLinks.jsx";
import PublicNotFound from "./components/PublicNotFound.jsx";
import { SUPPORT_LANGUAGE_CODES } from "./constants/supportLanguages.js";
import { resolvePublicRoute } from "./seo/publicRoutes.js";
import { PublicRenderContext } from "./seo/PublicRenderContext.js";
import useLanguage from "./hooks/useLanguage.js";

if (typeof window !== "undefined") {
  const initialPublicRoute = resolvePublicRoute(window.location.pathname);
  if (initialPublicRoute.localized) localStorage.setItem("appLanguage", initialPublicRoute.locale);
}

// Keep the one-time cache-busting recovery parameter out of the visible URL
// once the fresh application entry point has loaded.
if (typeof window !== "undefined") {
  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has("_piyali_reload")) {
    currentUrl.searchParams.delete("_piyali_reload");
    window.history.replaceState(window.history.state, "", currentUrl.href);
  }
}

const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const LearningLanguagePage = lazy(() => import("./components/LearningLanguagePage.jsx"));
const App = lazy(() => import("./App.jsx"));
const LinksPage = lazy(() => import("./components/LinksPage.jsx"));
const LegacyLinksPage = lazy(() => import("./components/LegacyLinksPage.jsx"));
const ProficiencyTest = lazy(() => import("./components/ProficiencyTest.jsx"));
const SquirclePlayground = lazy(
  () => import("./components/SquirclePlayground.jsx"),
);
const OrbingPlayground = lazy(
  () => import("./components/orbing/OrbingPlayground.jsx"),
);
const CitizenshipGuide = lazy(
  () => import("./components/CitizenshipGuide.jsx"),
);
const PatreonOAuthDrawerReturn = lazy(
  () => import("./components/PatreonOAuthDrawerReturn.jsx"),
);

const hasStoredKey = () => {
  if (typeof window === "undefined") return false;
  const secret = localStorage.getItem("local_nsec");
  return Boolean(secret && secret.trim());
};

// Keep first-time public visits from downloading the entire offline app.
// Signed-in learners and existing installations still receive update checks.
if (typeof navigator !== "undefined" && (hasStoredKey() || navigator.serviceWorker?.controller)) initAppUpdateCoordinator();

function RouteFallback() {
  return (
    <div className="route-fallback" aria-label="Loading">
      <span className="route-loading-orb" aria-hidden="true" />
    </div>
  );
}

function BootReadyBoundary({ children }) {
  useEffect(() => {
    // The page-level fallback is outside this boundary, so mounting the route
    // content is enough to replace it.
  }, []);

  return children;
}

function BootOverlay({ visible }) {
  return (
    <div
      className={`route-fallback boot-overlay ${
        visible ? "is-visible" : "is-hidden"
      }`}
      aria-label="Loading"
      aria-hidden={!visible}
    >
      <span className="route-loading-orb" aria-hidden="true" />
    </div>
  );
}

function AppContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredKey);
  const [bootOverlayMounted, setBootOverlayMounted] = useState(hasStoredKey);
  const [bootOverlayVisible, setBootOverlayVisible] = useState(hasStoredKey);
  const bootHideFrameRef = useRef(null);
  const bootHideSecondFrameRef = useRef(null);
  const bootSettleTimerRef = useRef(null);
  const bootHideTimerRef = useRef(null);

  const clearBootHideTimers = useCallback(() => {
    if (bootHideFrameRef.current) {
      cancelAnimationFrame(bootHideFrameRef.current);
      bootHideFrameRef.current = null;
    }
    if (bootHideSecondFrameRef.current) {
      cancelAnimationFrame(bootHideSecondFrameRef.current);
      bootHideSecondFrameRef.current = null;
    }
    if (bootSettleTimerRef.current) {
      clearTimeout(bootSettleTimerRef.current);
      bootSettleTimerRef.current = null;
    }
    if (bootHideTimerRef.current) {
      clearTimeout(bootHideTimerRef.current);
      bootHideTimerRef.current = null;
    }
  }, []);

  const handleAuthenticated = useCallback(() => {
    initAppUpdateCoordinator();
    clearBootHideTimers();
    setBootOverlayMounted(true);
    setBootOverlayVisible(true);
    setIsAuthenticated(true);
  }, [clearBootHideTimers]);

  const handleAppBootReady = useCallback(() => {
    clearBootHideTimers();
    bootHideFrameRef.current = requestAnimationFrame(() => {
      bootHideSecondFrameRef.current = requestAnimationFrame(() => {
        bootSettleTimerRef.current = setTimeout(() => {
          setBootOverlayVisible(false);
          bootHideTimerRef.current = setTimeout(() => {
            setBootOverlayMounted(false);
            bootHideTimerRef.current = null;
          }, 520);
        }, 220);
      });
    });
  }, [clearBootHideTimers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event) => {
      if (event.key && event.key !== "local_nsec") return;
      setIsAuthenticated(hasStoredKey());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    clearBootHideTimers();
    setBootOverlayMounted(true);
    setBootOverlayVisible(true);
  }, [clearBootHideTimers, isAuthenticated]);

  // Failsafe: ensure boot overlay never traps the user indefinitely
  useEffect(() => {
    if (!bootOverlayVisible) return;
    const failsafeTimer = setTimeout(() => {
      console.warn("[BOOT] Boot overlay failsafe triggered after timeout");
      setBootOverlayVisible(false);
      const unmountTimer = setTimeout(() => {
        setBootOverlayMounted(false);
      }, 520);
      return () => clearTimeout(unmountTimer);
    }, 7000);
    return () => clearTimeout(failsafeTimer);
  }, [bootOverlayVisible]);

  useEffect(() => clearBootHideTimers, [clearBootHideTimers]);

  if (!isAuthenticated) {
    return <LandingPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AppLoadBoundary>
      <Suspense fallback={null}>
        <App onBootReady={handleAppBootReady} />
      </Suspense>
      {bootOverlayMounted && <BootOverlay visible={bootOverlayVisible} />}
      <Outlet />
    </AppLoadBoundary>
  );
}

function ProficiencyContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredKey);

  const handleAuthenticated = useCallback(() => {
    initAppUpdateCoordinator();
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
    return <LandingPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Suspense fallback={null}>
      <BootReadyBoundary>
        <ProficiencyTest />
      </BootReadyBoundary>
    </Suspense>
  );
}

function LocalizedPublicLayout() {
  const { locale } = useParams();
  return SUPPORT_LANGUAGE_CODES.includes(locale) ? <Outlet /> : <PublicNotFound />;
}

function LearningPageContainer() {
  const { pathname } = useLocation();
  return resolvePublicRoute(pathname).target ? <LearningLanguagePage /> : <PublicNotFound />;
}

function PublicReadySignal() {
  useEffect(() => {
    document.documentElement.dataset.publicReady = "true";
    // Replay early edits after React finishes its effects, so a subsequent
    // language navigation receives the state from the preceding input edit.
    queueMicrotask(() => document.dispatchEvent(new Event("piyali:public-ready")));
  }, []);
  return null;
}

export function PublicApp({ RouterComponent = Router, routerProps = {}, publicLocale = null }) {
  const RouterView = RouterComponent;
  const styleCache = useMemo(() => createCache({ key: "css" }), []);
  return <CacheProvider value={styleCache}><PublicRenderContext.Provider value={publicLocale}>
  <ChakraProvider theme={theme}>
    <div className="app-shell">
      <RouterView {...routerProps}>
        <PublicSeo />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/learn/:target" element={<LearningPageContainer />} />
            <Route path="/:locale" element={<LocalizedPublicLayout />}>
              <Route index element={<AppContainer />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="citizenship" element={<CitizenshipGuide />} />
              <Route path="learn/:target" element={<LearningPageContainer />} />
              <Route path="*" element={<PublicNotFound />} />
            </Route>
            <Route element={<AppContainer />}>
              <Route path="/" element={null} />
              <Route path="/onboarding" element={null} />
              <Route path="/onboarding/*" element={null} />
              <Route path="/subscribe" element={null} />
            </Route>
            <Route
              path="/patreon-return"
              element={
                <BootReadyBoundary>
                  <PatreonOAuthDrawerReturn />
                </BootReadyBoundary>
              }
            />
            <Route path="/proficiency" element={<ProficiencyContainer />} />
            <Route
              path="/orbing"
              element={
                <AppLoadBoundary>
                  <OrbingPlayground />
                </AppLoadBoundary>
              }
            />
            <Route
              path="/links"
              element={
                <BootReadyBoundary>
                  <LinksPage />
                </BootReadyBoundary>
              }
            />
            <Route
              path="/legacy-links"
              element={
                <BootReadyBoundary>
                  <LegacyLinksPage />
                </BootReadyBoundary>
              }
            />
            <Route
              path="/squircle"
              element={
                <BootReadyBoundary>
                  <SquirclePlayground />
                </BootReadyBoundary>
              }
            />
            <Route
              path="/citizenship"
              element={
                <BootReadyBoundary>
                  <CitizenshipGuide />
                </BootReadyBoundary>
              }
            />
            <Route path="*" element={<PublicNotFound />} />
          </Routes>
          <PublicReadySignal />
        </Suspense>
        <PublicLanguageLinks />
      </RouterView>
    </div>
  </ChakraProvider>
  </PublicRenderContext.Provider></CacheProvider>;
}

if (typeof document !== "undefined") {
  const root = document.getElementById("root");
  const locale = document.documentElement.lang.split("-")[0];
  const storedLanguage = localStorage.getItem("appLanguage");
  const snapshotMatches = document.documentElement.dataset.publicPath === (window.location.pathname.replace(/\/$/, "") || "/");
  const canHydrate = document.documentElement.dataset.prerendered === "true" && snapshotMatches && !hasStoredKey()
    && (!storedLanguage || storedLanguage === locale)
    && localStorage.getItem("themeMode") !== "dark";
  const app = <PublicApp publicLocale={canHydrate ? locale : null} />;
  if (canHydrate) {
    useLanguage.getState().setLanguage(locale, { navigate: false });
    hydrateRoot(root, app);
  }
  else createRoot(root).render(app);
}
