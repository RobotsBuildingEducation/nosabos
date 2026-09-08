const en = {
  preparingAudio: "Preparing audio…",
  modes: "Story modes", speaking: "Practice", radio: "Radio", conversation: "Conversation",
  radioIntro: "Tune in to a call. Press play, record any lines for You, then answer at each break.",
  conversationIntro: "Press play to follow the conversation. Record your lines as You, then answer the question.",
  yourTurn: "Your turn to speak", speakingNow: "Speaking", record: "Record", stopRecording: "Stop recording", connectingMic: "Connecting microphone…",
  speechIncorrect: "Not quite. Try again.", recordingError: "Recording couldn’t complete. Check your microphone and try again.", micDenied: "Allow microphone access, then try recording again.",
  loading: "Getting your story ready…", generationError: "We couldn’t prepare this story. Please try again.",
  audioError: "Audio couldn’t play. Tap play to try again.", retry: "Try again", play: "Play", pause: "Pause", resume: "Resume", replay: "Replay", listen: "Listen to the excerpt",
  start: "Start story", nextPair: "Next pair", check: "Submit", next: "Continue", finish: "Finish story", skip: "Skip", back: "New story",
  checkpoint: "Check your understanding", heard: "Listen to the segment to unlock the question.", showQuestion: "Answer question", correct: "That’s right!", incorrect: "Not quite. Here’s what happened:",
  translation: "Show translation", hideTranslation: "Hide translation",
  complete: "Story complete", score: "correct on the first try", saving: "Saving progress…", saveError: "Your story is complete, but progress could not be saved. Try again.",
  onAir: "ON AIR", ready: "READY TO LISTEN", paused: "PAUSED", segment: "Part", of: "of", clear: "Clear", answer: "Your answer", xp: "XP", review: "Review the answer, then continue.",
  reviewStory: "Review story", sentencesCompleted: "sentences completed",
};
const es = {
  preparingAudio: "Preparando audio…",
  modes: "Modos de historias", speaking: "Practicar", radio: "Radio", conversation: "Conversación",
  radioIntro: "Pulsa reproducir, graba las frases de tu personaje y responde en cada pausa.",
  conversationIntro: "Pulsa reproducir para seguir la conversación. Graba tus frases y luego responde la pregunta.",
  yourTurn: "Tu turno de hablar", speakingNow: "Hablando", record: "Grabar", stopRecording: "Detener grabación", connectingMic: "Conectando micrófono…",
  speechIncorrect: "Todavía no. Inténtalo de nuevo.", recordingError: "No se pudo completar la grabación. Revisa tu micrófono e inténtalo de nuevo.", micDenied: "Permite el acceso al micrófono y vuelve a grabar.",
  loading: "Preparando tu historia…", generationError: "No pudimos preparar la historia. Inténtalo de nuevo.", audioError: "No se pudo reproducir el audio. Pulsa reproducir para reintentar.",
  retry: "Reintentar", play: "Reproducir", pause: "Pausar", resume: "Reanudar", replay: "Repetir", listen: "Escuchar el fragmento", start: "Comenzar historia", nextPair: "Siguiente par",
  check: "Enviar", next: "Continuar", finish: "Terminar historia", skip: "Saltar", back: "Nueva historia", checkpoint: "Comprueba lo que entendiste", heard: "Escucha esta parte para desbloquear la pregunta.", showQuestion: "Responder pregunta",
  correct: "¡Correcto!", incorrect: "No exactamente. Esto es lo que pasó:", translation: "Mostrar traducción", hideTranslation: "Ocultar traducción",
  complete: "Historia completada", score: "correctas al primer intento", saving: "Guardando progreso…", saveError: "Completaste la historia, pero no se guardó el progreso. Inténtalo de nuevo.",
  onAir: "AL AIRE", ready: "LISTO PARA ESCUCHAR", paused: "EN PAUSA", segment: "Parte", of: "de", clear: "Borrar", answer: "Tu respuesta", xp: "XP", review: "Revisa la respuesta y continúa.",
  reviewStory: "Revisar historia", sentencesCompleted: "frases completadas",
};

export const storyCopy = (language) => ({ ...en, ...({ es }[language] || {}) });
