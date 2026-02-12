import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { theme } from "./theme";
import LandingPage from "./components/LandingPage.jsx";

import LinksPage from "./components/LinksPage.jsx";
import SoundExperiment from "./components/SoundExperiment.jsx";
import ProficiencyTest from "./components/ProficiencyTest.jsx";

import "@coinbase/onchainkit/styles.css";
import { MiniKitContextProvider } from "./provider/MinitKitProvider.jsx";

const hasStoredKey = () => {
  if (typeof window === "undefined") return false;
  const secret = localStorage.getItem("local_nsec");
  return Boolean(secret && secret.trim());
};

function AppContainer() {
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

  return <App />;
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

  return <ProficiencyTest />;
}

createRoot(document.getElementById("root")).render(
  <ChakraProvider theme={theme}>
    <MiniKitContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContainer />} />
          <Route path="/onboarding/*" element={<AppContainer />} />
          <Route path="/subscribe" element={<AppContainer />} />
          <Route path="/proficiency" element={<ProficiencyContainer />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/experiments" element={<SoundExperiment />} />
        </Routes>
      </Router>
    </MiniKitContextProvider>
  </ChakraProvider>
);
