import { useEffect, useRef, useState } from "react";
import { database } from "../firebaseResources/firebaseResources";
import { fetchXpHistoryForYear } from "../utils/userDataSchema";

export default function useXpHistoryYear({
  npub,
  year = new Date().getFullYear(),
  legacyDays = {},
  legacyGoalDays = [],
  enabled = true,
}) {
  const [history, setHistory] = useState(() => ({
    days: legacyDays || {},
    goalDays: Array.isArray(legacyGoalDays) ? legacyGoalDays : [],
  }));
  const legacyDaysRef = useRef(legacyDays);
  const legacyGoalDaysRef = useRef(legacyGoalDays);
  legacyDaysRef.current = legacyDays;
  legacyGoalDaysRef.current = legacyGoalDays;

  useEffect(() => {
    if (!enabled || !npub) return;
    let cancelled = false;
    fetchXpHistoryForYear(database, npub, String(year))
      .then((loaded) => {
        if (cancelled) return;
        const currentLegacyDays = legacyDaysRef.current || {};
        const currentLegacyGoalDays = Array.isArray(legacyGoalDaysRef.current)
          ? legacyGoalDaysRef.current
          : [];
        setHistory({
          days: { ...currentLegacyDays, ...(loaded.days || {}) },
          goalDays: Array.from(
            new Set([
              ...currentLegacyGoalDays,
              ...(loaded.goalDays || []),
            ]),
          ).sort(),
        });
      })
      .catch((error) => {
        console.warn(`Failed to load XP history for ${year}:`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, npub, year]);

  return history;
}
