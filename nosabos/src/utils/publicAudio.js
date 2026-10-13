// Public pages need only these actions, not Tone or the full audio store at
// startup. Prime native audio synchronously in the gesture, then let Tone
// adopt that context after its module arrives (including on mobile Safari).
let context = null;
let runtimePromise = null;
let loadedStore = null;

function primeAudio() {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    context ||= new AudioContext();
    if (context.state !== "running") void context.resume().catch(() => {});
  } catch {
    // Sound is optional; the page action should still work.
  }
}

function loadRuntime() {
  if (loadedStore) return Promise.resolve(loadedStore);
  primeAudio();
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import("../hooks/useSoundSettings"),
      import("tone"),
    ]).then(([{ default: store }, Tone]) => {
      if (context && Tone.getContext().state !== "running" && !store.getState().isInitialized) {
        Tone.setContext(new Tone.Context(context), true);
      } else if (context && Tone.getContext().rawContext !== context) {
        void context.close().catch(() => {});
        context = null;
      }
      loadedStore = store;
      return store;
    }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}

export function playPublicSound(name) {
  return loadRuntime().then((store) => store.getState().playSound(name)).catch(() => {});
}

export function warmupPublicAudio() {
  return loadRuntime().then((store) => store.getState().warmupAudio()).catch(() => false);
}
