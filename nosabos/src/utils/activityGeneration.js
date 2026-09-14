// Content validity is mandatory. Style review is advisory and must never turn
// an otherwise usable activity into a failed lesson or an unbounded spinner.
export const ACTIVITY_REVIEW_TIMEOUT_MS = 5000;
export const ACTIVITY_REWRITE_TIMEOUT_MS = 10000;

const normalize = (text) => String(text || "").normalize("NFKC").toLowerCase()
  .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ").trim();

export function isExactActivityRepeat(target, recentEntries = []) {
  const current = normalize(target);
  return Boolean(current) && recentEntries.some((entry) => current === normalize(entry.targetText || entry.snippet));
}

async function optionalReview(review, candidate, timeoutMs) {
  if (!review) return [];
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => review(candidate)).then(
        (issues) => Array.isArray(issues) && issues.every((issue) => typeof issue === "string") ? issues : [],
        () => [],
      ),
      new Promise((resolve) => { timer = setTimeout(() => resolve([]), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function optionalRewrite(generate, prompt, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => generate(prompt, { isRevision: true })),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Optional rewrite timed out")), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

export async function generateUsableActivity({
  generate, validate, prompt, buildRevisionPrompt, getQualityIssues = () => [], review,
  maxAttempts = 3, maxInvalidAttempts = 3, reviewTimeoutMs = ACTIVITY_REVIEW_TIMEOUT_MS,
  rewriteTimeoutMs = ACTIVITY_REWRITE_TIMEOUT_MS,
  isCancelled = () => false, onDiagnostic = () => {},
}) {
  let nextPrompt = prompt;
  let best = null;
  let invalidAttempts = 0;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (isCancelled()) return null;
    let raw;
    try { raw = best ? await optionalRewrite(generate, nextPrompt, rewriteTimeoutMs) : await generate(nextPrompt, { isRevision: false }); }
    catch (error) {
      if (isCancelled()) return null;
      onDiagnostic({ stage: "response", attempt, name: error.name, message: error.message, recovered: Boolean(best) });
      if (best) return best.candidate;
      throw error;
    }
    if (isCancelled()) return null;
    let candidate;
    try { candidate = validate(raw); }
    catch (error) {
      if (isCancelled()) return null;
      lastError = error;
      invalidAttempts++;
      onDiagnostic({ stage: "validation", attempt, name: error.name, message: error.message,
        recovered: Boolean(best), retrying: !best && attempt < maxAttempts && invalidAttempts < maxInvalidAttempts });
      // Never discard an already validated activity because its optional
      // improvement has malformed JSON, broken answers, or the wrong language.
      if (best) return best.candidate;
      if (attempt === maxAttempts || invalidAttempts === maxInvalidAttempts) throw error;
      nextPrompt = buildRevisionPrompt({ prompt, stage: "validation", raw, error });
      continue;
    }
    const localIssues = getQualityIssues(candidate);
    const advisoryIssues = await optionalReview(review, candidate, reviewTimeoutMs);
    if (isCancelled()) return null;
    const score = localIssues.length * 2 + advisoryIssues.length;
    const alreadyHasCandidate = Boolean(best);
    if (!best || score <= best.score) best = { candidate, score };
    if (!score || alreadyHasCandidate || attempt === maxAttempts) return best.candidate;
    // At most one style rewrite. Keep the first valid draft while attempting
    // an improvement, then choose the better usable result even if a reviewer
    // continues to dislike its style. Do not put subjective complaints in logs
    // as generation failures or echo their example wording back to the writer.
    nextPrompt = buildRevisionPrompt({ prompt, stage: "quality" });
  }
  if (best) return best.candidate;
  throw lastError || new Error("No activity was generated");
}
