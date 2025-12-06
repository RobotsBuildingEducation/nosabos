import { useEffect, useRef, useState } from "react";

export function usePasscodeModal(levelNumber) {
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const previousLevelRef = useRef(levelNumber);

  useEffect(() => {
    const hasPasscode =
      localStorage.getItem("passcode") === import.meta.env.VITE_PATREON_PASSCODE;
    const previousLevel = previousLevelRef.current ?? levelNumber;
    const leveledUp = typeof levelNumber === "number" && levelNumber > previousLevel;

    if (leveledUp && levelNumber > 2 && !hasPasscode) {
      setShowPasscodeModal(true);
    }

    previousLevelRef.current = levelNumber;
  }, [levelNumber]);

  return { showPasscodeModal, setShowPasscodeModal };
}
