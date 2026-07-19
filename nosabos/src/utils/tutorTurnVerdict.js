export const TUTOR_TURN_VERDICT = Object.freeze({
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  UNCERTAIN: "uncertain",
});

export function resolveTutorTurnVerdict({
  localSuccessful = false,
  semanticAttempted = false,
  semanticSuccessful = false,
  semanticConfidence = 0,
  confidenceThreshold = 0.55,
} = {}) {
  if (localSuccessful || semanticSuccessful) {
    return TUTOR_TURN_VERDICT.ACCEPTED;
  }
  if (
    semanticAttempted &&
    Number.isFinite(Number(semanticConfidence)) &&
    Number(semanticConfidence) >= confidenceThreshold
  ) {
    return TUTOR_TURN_VERDICT.REJECTED;
  }
  return TUTOR_TURN_VERDICT.UNCERTAIN;
}
