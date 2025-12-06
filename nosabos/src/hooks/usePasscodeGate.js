import { useEffect, useMemo, useState } from "react";
import { PasscodePage } from "../components/PasscodePage";

const PASSCODE_KEY = "passcode";
const PASSCODE_FEATURES_KEY = "features_passcode";

function readStoredPasscode() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PASSCODE_KEY);
}

export function usePasscodeGate(levelNumber, userLanguage) {
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  const hasValidPasscode = useMemo(() => {
    const stored = readStoredPasscode();
    return stored === import.meta.env.VITE_PATREON_PASSCODE;
  }, [showPasscodeModal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldGate = levelNumber > 2 && !hasValidPasscode;
    setShowPasscodeModal(shouldGate);
  }, [levelNumber, hasValidPasscode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasValidPasscode) return;
    localStorage.setItem(PASSCODE_KEY, import.meta.env.VITE_PATREON_PASSCODE);
    localStorage.setItem(PASSCODE_FEATURES_KEY, import.meta.env.VITE_PATREON_PASSCODE);
  }, [hasValidPasscode]);

  const gateView = showPasscodeModal ? (
    <PasscodePage
      userLanguage={userLanguage}
      setShowPasscodeModal={setShowPasscodeModal}
    />
  ) : null;

  return { showPasscodeModal, gateView, setShowPasscodeModal };
}
