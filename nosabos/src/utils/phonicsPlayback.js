// Phonics must use the shared player's completion contract. A live WebRTC
// track can be unmuted/playing while still silent before the first spoken sound,
// and silence between sounds is not the end of an utterance.
export function watchPhonicsPlaybackCompletion(player, onDone) {
  const audio = player?.audio;
  if (!audio) return () => {};

  let detached = false;
  const detach = () => {
    if (detached) return;
    detached = true;
    audio.removeEventListener("ended", finish);
    audio.removeEventListener("error", finish);
  };
  const finish = () => {
    if (detached) return;
    detach();
    onDone();
  };

  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener("error", finish, { once: true });
  // Both live and cached players finalize after playback or explicit cleanup.
  // The guard also makes completion safe after stopping or replacing a card.
  player.finalize?.then(finish, finish);
  return detach;
}
