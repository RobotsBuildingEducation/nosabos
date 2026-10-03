// Capture/transcription failures happen before grading. Do not blame a
// connection for an empty recording, cancellation, or a service failure.
export function getSpeechPracticeErrorFeedback(error, translate) {
  const code = error?.code;
  const kind = code === "no-speech" ? "no_speech"
    : code?.startsWith("connection-") ? "connection"
    : code === "transcription-failed" ? "transcription" : "recording";
  return {
    title: translate(`speech_${kind}_error_title`),
    description: translate(`speech_${kind}_error_desc`),
    status: kind === "no_speech" ? "warning" : "error",
  };
}
