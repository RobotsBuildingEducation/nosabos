// Temporary product-development gate. While enabled, Grammar and Vocabulary
// render only the new delight variants through DelightQuestionLab. Set this to
// false to restore the legacy randomized exercise engines.
export const DELIGHT_VARIANT_TEST_GATE = true;

// Work through the new formats one at a time. Keep dormant implementations out
// of the testing rotation until their generator and UX have been approved.
export const DELIGHT_VARIANT_TEST_IDS = ["sentence_detective"];
