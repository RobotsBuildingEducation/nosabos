let unlockedContext;

export function unlockPublicAudioContext() {
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext || unlockedContext) return;
  unlockedContext = new AudioContext();
  void unlockedContext.resume().catch(() => {});
}

export function takePublicAudioContext() {
  const context = unlockedContext;
  unlockedContext = null;
  return context;
}
