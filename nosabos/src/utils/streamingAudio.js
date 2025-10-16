const DEFAULT_MIME = "audio/mpeg";

export async function streamResponseToAudio({
  response,
  audio,
  onFirstChunk,
}) {
  if (!response?.body || typeof response.body.getReader !== "function") {
    throw new Error("Streaming unsupported by response");
  }

  const MediaSourceCtor =
    typeof window !== "undefined" && window.MediaSource
      ? window.MediaSource
      : typeof MediaSource !== "undefined"
      ? MediaSource
      : null;

  if (!MediaSourceCtor) {
    throw new Error("MediaSource unavailable");
  }

  const reader = response.body.getReader();
  const mimeType = (response.headers.get("content-type") || DEFAULT_MIME)
    .split(";")[0]
    .trim() || DEFAULT_MIME;

  const mediaSource = new MediaSourceCtor();
  const objectUrl = URL.createObjectURL(mediaSource);
  audio.src = objectUrl;

  const chunks = [];

  await new Promise((resolve, reject) => {
    const handleSourceOpen = async () => {
      let sourceBuffer;
      try {
        sourceBuffer = mediaSource.addSourceBuffer(mimeType);
      } catch (error) {
        reject(error);
        return;
      }

      let firstChunk = true;
      const enqueue = (chunk) =>
        new Promise((resolveChunk, rejectChunk) => {
          const cleanup = () => {
            sourceBuffer.removeEventListener("updateend", onUpdateEnd);
            sourceBuffer.removeEventListener("error", onError);
          };
          const onUpdateEnd = () => {
            cleanup();
            resolveChunk();
          };
          const onError = (err) => {
            cleanup();
            rejectChunk(err);
          };
          sourceBuffer.addEventListener("updateend", onUpdateEnd, { once: true });
          sourceBuffer.addEventListener("error", onError, { once: true });
          sourceBuffer.appendBuffer(chunk);
        });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength
          );
          chunks.push(chunk);
          await enqueue(chunk);
          if (firstChunk) {
            firstChunk = false;
            if (onFirstChunk) {
              await onFirstChunk();
            }
          }
        }
        if (mediaSource.readyState === "open") {
          try {
            mediaSource.endOfStream();
          } catch (error) {
            void error; // ignore endOfStream issues
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    mediaSource.addEventListener("sourceopen", handleSourceOpen, { once: true });
    mediaSource.addEventListener("error", reject, { once: true });
  });

  const blob = new Blob(chunks, { type: mimeType });
  return { objectUrl, blob, mimeType };
}
