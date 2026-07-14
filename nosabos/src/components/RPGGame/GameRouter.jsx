import React, { useMemo } from "react";

import LegacyRPGGame from "./index.jsx";
import { normalizeCefrKey } from "./episodes/profile.js";
import { buildLegacyEpisodeScenario } from "./episodes/legacyScenario.js";

/**
 * Cutover boundary for the authored episode engine.
 *
 * Game Reviews and pre-generated tutorial scenarios use the authored local
 * episode engine. The query-string overrides are the plan's dev harness:
 *   ?episode=detective&level=B2&unit=unit-a2-3
 */
export default function GameRouter(props) {
  const lesson = props.lessonContext || props.lesson || null;
  const harness = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      episodeId: params.get("episode") || "",
      level: params.get("level") || "",
      unitId: params.get("unit") || "",
    };
  }, []);

  const useEpisodes =
    !!harness.episodeId ||
    !!props.initialScenario?.authoredEpisode ||
    (!!lesson?.isGame && !lesson?.isTutorial);
  const episodeLesson = useMemo(
    () => {
      const gameContent = lesson?.content?.game || {};
      return {
        ...(lesson || {}),
        id: harness.unitId || lesson?.id || "episode-harness",
        content: {
          ...(lesson?.content || {}),
          game: {
            ...gameContent,
            cefrLevel: harness.level
              ? normalizeCefrKey(harness.level)
              : gameContent.cefrLevel,
          },
        },
        gameReviewContext: {
          ...(lesson?.gameReviewContext || {}),
          cefrLevel: harness.level
            ? normalizeCefrKey(harness.level)
            : lesson?.gameReviewContext?.cefrLevel || gameContent.cefrLevel,
        },
      };
    },
    [harness.level, harness.unitId, lesson],
  );

  const authoredScenario = useMemo(
    () =>
      useEpisodes
        ? props.initialScenario?.authoredEpisode
          ? props.initialScenario
          : buildLegacyEpisodeScenario({
              lesson: episodeLesson,
              targetLang: props.targetLang,
              supportLang: props.supportLang,
              forcedEpisodeId: harness.episodeId || null,
            })
        : null,
    [
      episodeLesson,
      harness.episodeId,
      props.initialScenario,
      props.supportLang,
      props.targetLang,
      useEpisodes,
    ],
  );

  if (!useEpisodes) return <LegacyRPGGame {...props} />;

  return (
    <LegacyRPGGame
      {...props}
      lessonContext={episodeLesson}
      initialScenario={authoredScenario}
      targetLang={props.targetLang}
      supportLang={props.supportLang}
      onGameComplete={props.onGameComplete}
    />
  );
}
