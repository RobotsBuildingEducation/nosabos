// One cancellable queue owns all audio for an episode, including excerpt replays.
export function createStoryAudio({ getPlayer, onState, onError, setupTimeoutMs = 30000, playbackTimeoutMs = 90000 }) {
  let version = 0;
  let player = null;
  let cancelWait = null;
  let detachEvents = null;
  let resetPlaybackTimeout = null;
  let paused = false;
  let finishSpeech = null;

  const dispose = (value) => {
    value.ready?.catch?.(() => {});
    value.audio.pause();
    value.cleanup?.();
  };
  const stop = () => {
    version++;
    paused = false;
    cancelWait?.();
    cancelWait = null;
    finishSpeech = null;
    detachEvents?.();
    detachEvents = null;
    if (player) dispose(player);
    player = null;
  };

  return {
    stop,
    completeSpeech() {
      const wasWaiting = Boolean(finishSpeech);
      finishSpeech?.();
      finishSpeech = null;
      return wasWaiting;
    },
    pause() {
      if (!player) return;
      paused = true;
      player.audio.pause();
      resetPlaybackTimeout?.();
      onState("paused");
    },
    async resume() {
      if (!player || !paused) return;
      const token = version;
      paused = false;
      resetPlaybackTimeout?.();
      try {
        await player.audio.play();
        if (token === version) onState("playing");
      } catch (error) {
        if (token === version) { stop(); onState("idle"); onError(error); }
      }
    },
    async play(turns, onComplete, { requiresSpeech = () => false } = {}) {
      stop();
      const token = version;
      const cancelled = new Promise((resolve) => { cancelWait = () => resolve({ status: "cancelled" }); });
      const wait = async (operation, stage, completion) => {
        let timer;
        const timeout = new Promise((resolve) => {
          const arm = () => {
            clearTimeout(timer);
            if (stage === "playback" && paused) return;
            timer = setTimeout(() => resolve({ status: "error", error: new Error(`Radio audio timed out during ${stage}`) }), stage === "playback" ? playbackTimeoutMs : setupTimeoutMs);
          };
          if (stage === "playback") resetPlaybackTimeout = arm;
          arm();
        });
        try {
          const tasks = [cancelled, timeout];
          if (operation) tasks.push(Promise.resolve(operation).then((value) => ({ status: "value", value }), (error) => ({ status: "error", error })));
          if (completion) tasks.push(completion);
          const result = await Promise.race(tasks);
          if (result.status === "error") throw result.error;
          return result;
        } finally {
          clearTimeout(timer);
          if (stage === "playback") resetPlaybackTimeout = null;
        }
      };

      try {
        for (const turn of turns) {
          if (token !== version) return;
          if (requiresSpeech(turn)) {
            const spoken = new Promise((resolve) => { finishSpeech = resolve; });
            onState("awaiting_speech", turn.speaker, turn);
            // Learner turns replace TTS entirely and have no playback timeout.
            await Promise.race([spoken, cancelled]);
            if (token !== version) return;
            finishSpeech = null;
            continue;
          }
          onState("loading", turn.speaker, turn);
          const pendingPlayer = Promise.resolve(getPlayer(turn)).then((value) => {
            if (token !== version) dispose(value);
            return value;
          });
          const prepared = await wait(pendingPlayer, "setup");
          if (token !== version || prepared.status === "cancelled") return;
          const nextPlayer = prepared.value;
          player = nextPlayer;

          // Subscribe before ready/play: live streams may finish while the
          // browser's play() promise is pending, or before listeners attach.
          const completion = new Promise((resolve) => {
            const ended = () => resolve({ status: "ended" });
            const failed = () => resolve({ status: "error", error: new Error("Radio audio playback failed") });
            if (nextPlayer.completion) {
              nextPlayer.completion.then(resolve, (error) => resolve({ status: "error", error }));
            } else {
              nextPlayer.audio.onended = ended;
              nextPlayer.audio.onerror = failed;
              detachEvents = () => { nextPlayer.audio.onended = null; nextPlayer.audio.onerror = null; };
            }
          });
          let outcome = await wait(nextPlayer.ready || Promise.resolve(), "readiness", completion);
          if (token !== version) return;
          if (outcome.status === "value") {
            outcome = await wait(nextPlayer.audio.play(), "starting playback", completion);
            if (token !== version) return;
            if (outcome.status === "value") {
              onState("playing", turn.speaker, turn);
              outcome = await wait(null, "playback", completion);
            }
          }
          if (token !== version) return;
          if (outcome.status !== "ended") throw new Error("Radio audio was interrupted. Replay this part.");
          detachEvents?.();
          detachEvents = null;
          // Shared players finish their own resources/cache. Explicit cleanup
          // here would turn a natural end into a cancelled recording.
          if (!nextPlayer.completion) nextPlayer.cleanup?.();
          player = null;
        }
        if (token === version) { onState("idle", null, null); onComplete?.(); }
      } catch (error) {
        if (token === version) { stop(); onState("idle", null, null); onError(error); }
      }
    },
  };
}
