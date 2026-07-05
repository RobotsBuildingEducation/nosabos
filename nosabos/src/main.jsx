import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { theme } from "./theme";
import LandingPage from "./components/LandingPage.jsx";
import VoiceOrb from "./components/VoiceOrb.jsx";

import "@coinbase/onchainkit/styles.css";
import { MiniKitContextProvider } from "./provider/MinitKitProvider.jsx";

const App = lazy(() => import("./App.jsx"));
const LinksPage = lazy(() => import("./components/LinksPage.jsx"));
const ProficiencyTest = lazy(() => import("./components/ProficiencyTest.jsx"));
const SquirclePlayground = lazy(
  () => import("./components/SquirclePlayground.jsx"),
);
const CitizenshipGuide = lazy(
  () => import("./components/CitizenshipGuide.jsx"),
);

const hasStoredKey = () => {
  if (typeof window === "undefined") return false;
  const secret = localStorage.getItem("local_nsec");
  return Boolean(secret && secret.trim());
};

const LOADING_ORB_STATES = ["idle", "listening", "speaking"];

function getRandomLoadingOrbState() {
  return LOADING_ORB_STATES[
    Math.floor(Math.random() * LOADING_ORB_STATES.length)
  ];
}

function RouteFallback() {
  const orbState = useMemo(getRandomLoadingOrbState, []);

  return (
    <div className="route-fallback" aria-label="Loading">
      <VoiceOrb state={orbState} size={88} useWorker maxDpr={1} />
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
  const orbState = useMemo(getRandomLoadingOrbState, []);

  return (
    <div
      className={`route-fallback boot-overlay ${
        visible ? "is-visible" : "is-hidden"
      }`}
      aria-label="Loading"
      aria-hidden={!visible}
    >
      <VoiceOrb state={orbState} size={88} useWorker maxDpr={1} />
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

  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

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

  useEffect(() => clearBootHideTimers, [clearBootHideTimers]);

  if (!isAuthenticated) {
    return <LandingPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <Suspense fallback={null}>
        <App onBootReady={handleAppBootReady} />
      </Suspense>
      {bootOverlayMounted && <BootOverlay visible={bootOverlayVisible} />}
    </>
  );
}

function ProficiencyContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredKey);

  const handleAuthenticated = useCallback(() => {
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

createRoot(document.getElementById("root")).render(
  <ChakraProvider theme={theme}>
    <MiniKitContextProvider>
      <div className="app-shell">
        <Router>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<AppContainer />} />
              <Route path="/onboarding/*" element={<AppContainer />} />
              <Route path="/subscribe" element={<AppContainer />} />
              <Route path="/proficiency" element={<ProficiencyContainer />} />
              <Route
                path="/links"
                element={
                  <BootReadyBoundary>
                    <LinksPage />
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
            </Routes>
          </Suspense>
        </Router>
      </div>
    </MiniKitContextProvider>
  </ChakraProvider>,
);
