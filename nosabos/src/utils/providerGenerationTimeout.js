export const QUESTION_PROVIDER_TIMEOUT_MS = 6000;

const timeoutError = (label, timeoutMs) =>
  new Error(`${label} timed out after ${timeoutMs}ms.`);

export async function settleProviderWithin(
  promise,
  timeoutMs = QUESTION_PROVIDER_TIMEOUT_MS,
  label = "Question generation",
) {
  const duration = Math.max(1, Number(timeoutMs) || 0);
  let timeoutId;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        timeoutId = globalThis.setTimeout(
          () => reject(timeoutError(label, duration)),
          duration,
        );
      }),
    ]);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

const remainingTime = (deadline) => Math.max(1, deadline - Date.now());

export async function generateContentWithTimeout(
  model,
  request,
  timeoutMs = QUESTION_PROVIDER_TIMEOUT_MS,
) {
  return settleProviderWithin(
    model.generateContent(request),
    timeoutMs,
    "Gemini question generation",
  );
}

export async function generateContentStreamWithTimeout(
  model,
  request,
  timeoutMs = QUESTION_PROVIDER_TIMEOUT_MS,
) {
  const deadline = Date.now() + timeoutMs;
  const response = await settleProviderWithin(
    model.generateContentStream(request),
    remainingTime(deadline),
    "Gemini question generation",
  );
  const sourceStream = response.stream;
  const wrappedStream = {
    async *[Symbol.asyncIterator]() {
      const iterator = sourceStream[Symbol.asyncIterator]();
      try {
        while (true) {
          const next = await settleProviderWithin(
            iterator.next(),
            remainingTime(deadline),
            "Gemini question generation",
          );
          if (next.done) return;
          yield next.value;
        }
      } finally {
        if (typeof iterator.return === "function") {
          Promise.resolve(iterator.return()).catch(() => {});
        }
      }
    },
  };
  const wrappedResponse = { ...response, stream: wrappedStream };
  Object.defineProperty(wrappedResponse, "response", {
    enumerable: true,
    get() {
      return settleProviderWithin(
        Promise.resolve(response.response),
        remainingTime(deadline),
        "Gemini question generation",
      );
    },
  });
  return wrappedResponse;
}
