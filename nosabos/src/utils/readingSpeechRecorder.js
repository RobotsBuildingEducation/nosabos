// Native Web Speech recognition for Reading. Android's continuous recognizer
// can replay final results or end mid-paragraph. Use individual utterances there
// and keep the user's recording active across native recognition sessions.
export function createReadingSpeechRecorder({
  Recognition,
  singleUtterance = false,
  onTranscript,
  onState,
  onError,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let current = null;
  let wanted = false;
  let disposed = false;
  let language = "es-MX";
  let completed = [];
  let restartTimer = null;
  let stopTimer = null;
  let limitTimer = null;
  let emptyEnds = 0;
  let networkFailures = 0;
  const state = value => { if (!disposed) onState?.(value); };
  const clearTimers = () => {
    for (const timer of [restartTimer, stopTimer, limitTimer]) {
      if (timer !== null) clearTimer(timer);
    }
    restartTimer = stopTimer = limitTimer = null;
  };
  const publish = () => {
    if (!disposed) onTranscript?.([...completed, current?.text || ""].filter(Boolean).join(" "));
  };
  const abort = rec => {
    try { rec?.abort(); } catch { /* Recognition may already have ended. */ }
  };
  const cancel = () => {
    wanted = false;
    clearTimers();
    const previous = current;
    current = null;
    abort(previous?.rec);
    state("idle");
  };
  const fail = (code, message) => {
    cancel();
    if (!disposed) onError?.(Object.assign(new Error(message || code), { code }));
  };
  const waitForEnd = session => {
    if (current !== session) return;
    if (stopTimer !== null) clearTimer(stopTimer);
    // Chrome normally emits onend after Stop or an error. Recover if it fails
    // to do so, while keeping every interim update visible immediately.
    stopTimer = setTimer(() => {
      if (current !== session) return;
      abort(session.rec);
      session.rec.onend();
    }, 1500);
  };

  const begin = () => {
    if (!wanted || disposed) return;
    let rec;
    try { rec = new Recognition(); } catch (error) {
      fail("recording-failed", error.message);
      return;
    }
    const session = { rec, slots: [], text: "", sealed: false };
    current = session;
    rec.lang = language;
    rec.continuous = !singleUtterance;
    rec.interimResults = true;
    rec.onstart = () => {
      if (current !== session || !wanted) abort(rec);
    };
    rec.onresult = event => {
      if (current !== session || disposed || session.sealed) return;
      session.slots.length = event.results.length;
      for (let index = event.resultIndex || 0; index < event.results.length; index++) {
        const result = event.results[index];
        session.slots[index] = { text: (result[0]?.transcript || "").trim(), final: result.isFinal };
      }
      const hasFinal = session.slots.some(slot => slot?.final);
      // A final single-utterance result owns that utterance. Android may also
      // return an interim echo in another slot; do not concatenate that echo.
      const slots = session.slots
        .filter(slot => slot && (!singleUtterance || !hasFinal || slot.final));
      session.text = slots
        .filter((slot, index) => !singleUtterance || !hasFinal || slot.text !== slots[index - 1]?.text)
        .map(slot => slot.text).filter(Boolean).join(" ");
      if (session.text) { emptyEnds = 0; networkFailures = 0; }
      publish();
      if (singleUtterance && hasFinal) {
        session.sealed = true;
        waitForEnd(session);
        try { rec.stop(); } catch { abort(rec); }
      }
    };
    rec.onerror = event => {
      if (current !== session || !wanted || disposed) return;
      const error = event.error || "unknown";
      if (error === "no-speech" || error === "aborted"
        || (error === "network" && ++networkFailures <= 2)) {
        waitForEnd(session);
        return;
      }
      fail(error === "network" ? "connection-failed"
        : ["not-allowed", "service-not-allowed"].includes(error) ? "mic-denied"
        : "recording-failed", event.message || error);
    };
    rec.onend = () => {
      if (current !== session || disposed) return;
      if (stopTimer !== null) clearTimer(stopTimer);
      stopTimer = null;
      if (session.text) completed.push(session.text);
      else emptyEnds += 1;
      current = null;
      publish();
      if (!wanted) { clearTimers(); state("idle"); return; }
      if (emptyEnds >= 3) { fail("no-speech", "No speech was captured."); return; }
      // Restart only after onend, never onerror or onresult. This prevents
      // overlapping microphone sessions and ignores every old session callback.
      restartTimer = setTimer(() => { restartTimer = null; begin(); }, session.text ? 100 : 300);
    };
    try { rec.start(); } catch (error) {
      fail(error.name === "NotAllowedError" ? "mic-denied" : "recording-failed", error.message);
    }
  };

  const stop = () => {
    if (!wanted) return;
    wanted = false;
    if (restartTimer !== null) clearTimer(restartTimer);
    restartTimer = null;
    if (!current) { clearTimers(); state("idle"); return; }
    state("stopping");
    const session = current;
    // Accept the final event after the user presses Stop.
    waitForEnd(session);
    if (!session.sealed) {
      try { session.rec.stop(); } catch { abort(session.rec); }
    }
  };

  return {
    start(lang) {
      if (disposed) return;
      cancel();
      completed = [];
      emptyEnds = networkFailures = 0;
      language = lang || "es-MX";
      wanted = true;
      state("listening");
      limitTimer = setTimer(stop, 180000);
      begin();
    },
    stop,
    cancel,
    dispose() { disposed = true; cancel(); },
  };
}
