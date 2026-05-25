// src/hooks/useSpeechPractice.js
// Uses WebRTC + OpenAI Realtime API for cross-platform speech recognition
// Works on in-app browsers (TikTok, Instagram, etc.) where Web Speech API is unavailable
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appCheckFetch } from "../firebaseResources/firebaseResources";
import { evaluateAttemptStrict } from "../utils/speechEvaluation";

const BCP47_TO_WHISPER = {
  ar: "ar",
  zh: "zh",
  es: "es",
  en: "en",
  pt: "pt",
  fr: "fr",
  it: "it",
  hi: "hi",
  nl: "nl",
  nah: "es", // Nahuatl fallback to Spanish
  ru: "ru",
  de: "de",
  ja: "ja",
  el: "el",
  pl: "pl",
  ga: "ga",
  yua: "es",
};

const REALTIME_MODEL = "gpt-realtime-mini";
const REALTIME_URL = import.meta.env?.VITE_REALTIME_URL
  ? `${import.meta.env.VITE_REALTIME_URL}?model=${encodeURIComponent(
      REALTIME_MODEL
    )}`
  : "";
const MIN_SPEECH_TURN_MS = 500;
const TRANSCRIPT_GRACE_MS = 2500;
const SESSION_UPDATE_EVENT_ID = "speech-practice-session-update";

function makeError(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

function buildRealtimeSpeechSession({
  targetLang,
  timeoutMs,
  vadSilenceDurationMs,
}) {
  const whisperLang = BCP47_TO_WHISPER[targetLang] || "es";

  return {
    type: "realtime",
    output_modalities: ["text"],
    instructions:
      "Transcribe the user's speech exactly. Do not answer the user.",
    audio: {
      input: {
        turn_detection: {
          type: "server_vad",
          silence_duration_ms:
            vadSilenceDurationMs ?? Math.min(timeoutMs, 2000),
          threshold: 0.35,
          prefix_padding_ms: 120,
          create_response: false,
          interrupt_response: false,
        },
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: whisperLang,
        },
      },
    },
  };
}

export function useSpeechPractice({
  targetText,
  targetLang = "es",
  onResult,
  timeoutMs = 15000,
  maxConnectionMs = 10000,
  vadSilenceDurationMs = null,
  speechStopDelayMs = 1500,
  responseDoneDelayMs = 500,
} = {}) {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const evalRef = useRef({
    inProgress: false,
    speechDone: false,
    timeoutId: null,
    silenceTimeoutId: null,
    connectionTimeoutId: null,
  });
  const transcriptRef = useRef("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if we have the realtime URL configured
  const supportsSpeech = useMemo(() => {
    const hasWindow = typeof window !== "undefined";
    const hasRTC = hasWindow && typeof RTCPeerConnection !== "undefined";
    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    const hasRealtimeUrl = !!REALTIME_URL;
    return hasRTC && hasMedia && hasRealtimeUrl;
  }, []);

  const cleanup = useCallback(() => {
    // Close data channel
    try {
      dcRef.current?.close?.();
    } catch {}
    dcRef.current = null;

    // Close peer connection
    try {
      pcRef.current?.close?.();
    } catch {}
    pcRef.current = null;

    // Stop local media stream
    try {
      const tracks = localStreamRef.current?.getTracks?.();
      tracks?.forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;

    // Clear timeouts
    if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
    if (evalRef.current.silenceTimeoutId)
      clearTimeout(evalRef.current.silenceTimeoutId);
    if (evalRef.current.connectionTimeoutId)
      clearTimeout(evalRef.current.connectionTimeoutId);
    evalRef.current.timeoutId = null;
    evalRef.current.silenceTimeoutId = null;
    evalRef.current.connectionTimeoutId = null;
    evalRef.current.inProgress = false;
    evalRef.current.speechDone = false;
    transcriptRef.current = "";
    setIsRecording(false);
    setIsConnecting(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const report = useCallback(
    async ({ recognizedText = "", confidence = 0, audioMetrics, method }) => {
      if (!targetText) return;
      const evaluation = evaluateAttemptStrict({
        recognizedText,
        confidence,
        audioMetrics,
        targetSentence: targetText,
        lang: targetLang,
      });
      onResult?.({
        evaluation,
        recognizedText,
        confidence,
        audioMetrics,
        method,
      });
    },
    [onResult, targetLang, targetText]
  );

  const startRecording = useCallback(async () => {
    if (!targetText) throw makeError("no-target", "target missing");
    if (evalRef.current.inProgress) return;
    if (!REALTIME_URL)
      throw makeError("no-realtime-url", "Realtime URL not configured");
    if (typeof RTCPeerConnection === "undefined")
      throw makeError("no-webrtc", "WebRTC not supported");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      throw makeError("no-media", "getUserMedia not supported");

    // Show connecting spinner immediately
    setIsConnecting(true);

    evalRef.current.inProgress = true;
    evalRef.current.speechDone = false;
    transcriptRef.current = "";

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      evalRef.current.inProgress = false;
      setIsConnecting(false);
      throw makeError("mic-denied", err?.message || "microphone access denied");
    }

    localStreamRef.current = localStream;

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      const realtimeSession = buildRealtimeSpeechSession({
        targetLang,
        timeoutMs,
        vadSilenceDurationMs,
      });

      // Add transceiver for receiving audio (required by the Realtime API)
      pc.addTransceiver("audio", { direction: "recvonly" });

      // Add local audio track
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      let hasDetectedSpeech = false;
      let waitingForTurnEnd = false;
      let speechStartedAt = 0;

      const scheduleFinish = (
        preferredDelayMs,
        { waitForTranscript = false } = {}
      ) => {
        if (evalRef.current.silenceTimeoutId) {
          clearTimeout(evalRef.current.silenceTimeoutId);
        }

        const transcriptReady = !!transcriptRef.current.trim();
        const delayMs =
          waitForTranscript && !transcriptReady
            ? Math.max(preferredDelayMs, TRANSCRIPT_GRACE_MS)
            : preferredDelayMs;

        evalRef.current.silenceTimeoutId = setTimeout(() => {
          if (!evalRef.current.inProgress || evalRef.current.speechDone) return;
          finishRecording();
        }, delayMs);
      };

      const finishRecording = async () => {
        if (!evalRef.current.inProgress || evalRef.current.speechDone) return;
        evalRef.current.speechDone = true;
        waitingForTurnEnd = false;

        if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
        if (evalRef.current.silenceTimeoutId)
          clearTimeout(evalRef.current.silenceTimeoutId);
        if (evalRef.current.connectionTimeoutId)
          clearTimeout(evalRef.current.connectionTimeoutId);

        const finalTranscript = transcriptRef.current.trim();

        // Report result
        await report({
          recognizedText: finalTranscript,
          confidence: finalTranscript ? 0.9 : 0, // Whisper is generally high confidence
          audioMetrics: null,
          method: "realtime-whisper",
        });

        cleanup();
      };

      dc.onopen = () => {
        // Keep this update in sync with the initial call session. Some deployed
        // SDP proxies only apply defaults at call creation, so the data channel
        // update is still useful as a compatibility belt-and-suspenders.
        dc.send(
          JSON.stringify({
            type: "session.update",
            event_id: SESSION_UPDATE_EVENT_ID,
            session: realtimeSession,
          })
        );
      };

      dc.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const msgType = msg?.type || "";

          // Handle input audio transcription completed (both event type variants)
          if (
            (msgType ===
              "conversation.item.input_audio_transcription.completed" ||
              msgType === "input_audio_transcription.completed") &&
            msg.transcript
          ) {
            const transcript = (msg.transcript || "").trim();
            if (transcript) {
              hasDetectedSpeech = true;
              transcriptRef.current = transcript;

              // Reset silence timeout when we receive speech
              if (evalRef.current.silenceTimeoutId) {
                clearTimeout(evalRef.current.silenceTimeoutId);
              }

              // Start silence detection - wait for no more speech
              evalRef.current.silenceTimeoutId = setTimeout(() => {
                finishRecording();
              }, timeoutMs);

              if (waitingForTurnEnd) {
                scheduleFinish(Math.min(speechStopDelayMs, 180));
              }
            }
          }

          // Handle speech started
          if (msgType === "input_audio_buffer.speech_started") {
            hasDetectedSpeech = true;
            waitingForTurnEnd = false;
            speechStartedAt = Date.now();
            if (evalRef.current.silenceTimeoutId) {
              clearTimeout(evalRef.current.silenceTimeoutId);
              evalRef.current.silenceTimeoutId = null;
            }
          }

          // Handle speech stopped - server detected end of speech
          if (msgType === "input_audio_buffer.speech_stopped") {
            const speechDurationMs = speechStartedAt
              ? Date.now() - speechStartedAt
              : MIN_SPEECH_TURN_MS;
            speechStartedAt = 0;
            if (
              speechDurationMs < MIN_SPEECH_TURN_MS &&
              !transcriptRef.current.trim()
            ) {
              hasDetectedSpeech = false;
              waitingForTurnEnd = false;
              return;
            }

            if (hasDetectedSpeech) {
              waitingForTurnEnd = true;
              // Give Whisper a moment to deliver the final transcript, then finish quickly.
              scheduleFinish(speechStopDelayMs, { waitForTranscript: true });
            }
          }

          // In transcription mode, response.done can fire before the user has
          // said anything. Only let it speed up completion after we already
          // have a transcript.
          if (
            msgType === "response.done" &&
            transcriptRef.current.trim()
          ) {
            waitingForTurnEnd = true;
            scheduleFinish(responseDoneDelayMs);
          }

          // Handle errors
          if (msgType === "error") {
            console.error("Realtime API error:", msg.error);
            const erroredEventId = msg?.error?.event_id || msg?.event_id || "";
            if (
              erroredEventId === SESSION_UPDATE_EVENT_ID &&
              !hasDetectedSpeech &&
              !transcriptRef.current.trim()
            ) {
              return;
            }

            // Don't fail completely on errors, just report what we have
            if (hasDetectedSpeech) {
              finishRecording();
            } else {
              evalRef.current.speechDone = false;
              cleanup();
              onResult?.({
                evaluation: null,
                recognizedText: "",
                confidence: 0,
                audioMetrics: null,
                method: "realtime-whisper",
                error: new Error(msg.error?.message || "Realtime API error"),
              });
            }
          }

          if (
            msgType ===
              "conversation.item.input_audio_transcription.failed" ||
            msgType === "input_audio_transcription.failed"
          ) {
            const message =
              msg?.error?.message ||
              msg?.error?.code ||
              "Realtime transcription failed";
            console.error("Realtime transcription failed:", message);
            if (!transcriptRef.current.trim()) {
              evalRef.current.speechDone = false;
              cleanup();
              onResult?.({
                evaluation: null,
                recognizedText: "",
                confidence: 0,
                audioMetrics: null,
                method: "realtime-whisper",
                error: new Error(message),
              });
            }
          }
        } catch (e) {
          console.warn("Failed to parse realtime message:", e);
        }
      };

      dc.onerror = (err) => {
        console.error("Data channel error:", err);
      };

      dc.onclose = () => {
        if (evalRef.current.inProgress && !evalRef.current.speechDone) {
          // Connection closed unexpectedly
          const finalTranscript = transcriptRef.current.trim();
          if (finalTranscript) {
            evalRef.current.speechDone = true;
            report({
              recognizedText: finalTranscript,
              confidence: 0.9,
              audioMetrics: null,
              method: "realtime-whisper",
            });
          }
          cleanup();
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      let resp = null;
      let jsonExchangeError = null;
      try {
        resp = await appCheckFetch(REALTIME_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sdp: offer.sdp,
            model: REALTIME_MODEL,
            session: realtimeSession,
          }),
        });
      } catch (err) {
        jsonExchangeError = err;
      }

      if (!resp || (!resp.ok && [400, 415].includes(resp.status))) {
        resp = await appCheckFetch(REALTIME_URL, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });
      }

      if (!resp.ok) {
        throw new Error(
          `SDP exchange failed: HTTP ${resp.status}${
            jsonExchangeError ? ` (${jsonExchangeError.message})` : ""
          }`
        );
      }

      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Connection established - stop showing connecting spinner, start showing recording
      setIsConnecting(false);
      setIsRecording(true);

      evalRef.current.connectionTimeoutId = setTimeout(() => {
        if (evalRef.current.inProgress && !evalRef.current.speechDone) {
          finishRecording();
        }
      }, maxConnectionMs);
    } catch (err) {
      cleanup();
      throw makeError(
        "connection-failed",
        err?.message || "Failed to connect to realtime API"
      );
    }
  }, [
    report,
    targetLang,
    targetText,
    timeoutMs,
    maxConnectionMs,
    vadSilenceDurationMs,
    speechStopDelayMs,
    responseDoneDelayMs,
    onResult,
    cleanup,
  ]);

  const stopRecording = useCallback(() => {
    if (!evalRef.current.inProgress) return;

    const finalTranscript = transcriptRef.current.trim();
    evalRef.current.speechDone = true;

    // Report whatever we have
    report({
      recognizedText: finalTranscript,
      confidence: finalTranscript ? 0.9 : 0,
      audioMetrics: null,
      method: "realtime-whisper",
    });

    cleanup();
  }, [report, cleanup]);

  return { startRecording, stopRecording, isRecording, isConnecting, supportsSpeech };
}
