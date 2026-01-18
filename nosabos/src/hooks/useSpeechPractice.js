// src/hooks/useSpeechPractice.js
// Uses WebRTC + OpenAI Realtime API for cross-platform speech recognition
// Works on in-app browsers (TikTok, Instagram, etc.) where Web Speech API is unavailable
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateAttemptStrict } from "../utils/speechEvaluation";

const BCP47_TO_WHISPER = {
  es: "es",
  en: "en",
  pt: "pt",
  fr: "fr",
  it: "it",
  nl: "nl",
  nah: "es", // Nahuatl fallback to Spanish
  ru: "ru",
  de: "de",
  ja: "ja",
  el: "el",
};

const REALTIME_MODEL = "gpt-4o-mini-realtime-preview";
const REALTIME_URL = import.meta.env?.VITE_REALTIME_URL
  ? `${import.meta.env.VITE_REALTIME_URL}?model=${encodeURIComponent(REALTIME_MODEL)}`
  : "";

function makeError(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

export function useSpeechPractice({
  targetText,
  targetLang = "es",
  onResult,
  timeoutMs = 15000,
} = {}) {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const evalRef = useRef({
    inProgress: false,
    speechDone: false,
    timeoutId: null,
    silenceTimeoutId: null,
  });
  const transcriptRef = useRef("");
  const [isRecording, setIsRecording] = useState(false);

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
    evalRef.current.timeoutId = null;
    evalRef.current.silenceTimeoutId = null;
    evalRef.current.inProgress = false;
    evalRef.current.speechDone = false;
    transcriptRef.current = "";
    setIsRecording(false);
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
    if (!REALTIME_URL) throw makeError("no-realtime-url", "Realtime URL not configured");
    if (typeof RTCPeerConnection === "undefined")
      throw makeError("no-webrtc", "WebRTC not supported");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      throw makeError("no-media", "getUserMedia not supported");

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
      throw makeError("mic-denied", err?.message || "microphone access denied");
    }

    localStreamRef.current = localStream;

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Add transceiver for receiving audio (required by the Realtime API)
      pc.addTransceiver("audio", { direction: "recvonly" });

      // Add local audio track
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      let hasReceivedSpeech = false;

      const finishRecording = async () => {
        if (!evalRef.current.inProgress || evalRef.current.speechDone) return;
        evalRef.current.speechDone = true;

        if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
        if (evalRef.current.silenceTimeoutId)
          clearTimeout(evalRef.current.silenceTimeoutId);

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
        // Configure session for transcription mode
        const whisperLang = BCP47_TO_WHISPER[targetLang] || "es";

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions: "Listen and transcribe the user's speech. Do not respond verbally.",
              modalities: ["audio", "text"], // Need audio to process incoming speech
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: Math.min(timeoutMs, 2000), // End after silence
                threshold: 0.35,
                prefix_padding_ms: 120,
              },
              input_audio_transcription: {
                model: "whisper-1",
                language: whisperLang,
              },
            },
          })
        );
      };

      dc.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const msgType = msg?.type || "";

          // Handle input audio transcription completed (both event type variants)
          if (
            (msgType === "conversation.item.input_audio_transcription.completed" ||
              msgType === "input_audio_transcription.completed") &&
            msg.transcript
          ) {
            const transcript = (msg.transcript || "").trim();
            if (transcript) {
              hasReceivedSpeech = true;
              transcriptRef.current = transcript;

              // Reset silence timeout when we receive speech
              if (evalRef.current.silenceTimeoutId) {
                clearTimeout(evalRef.current.silenceTimeoutId);
              }

              // Start silence detection - wait for no more speech
              evalRef.current.silenceTimeoutId = setTimeout(() => {
                finishRecording();
              }, timeoutMs);
            }
          }

          // Handle speech started
          if (msgType === "input_audio_buffer.speech_started") {
            hasReceivedSpeech = true;
            if (evalRef.current.silenceTimeoutId) {
              clearTimeout(evalRef.current.silenceTimeoutId);
              evalRef.current.silenceTimeoutId = null;
            }
          }

          // Handle speech stopped - server detected end of speech
          if (msgType === "input_audio_buffer.speech_stopped") {
            if (hasReceivedSpeech) {
              // Give a bit of time for the final transcription to come through
              evalRef.current.silenceTimeoutId = setTimeout(() => {
                finishRecording();
              }, 1500);
            }
          }

          // Handle response done (AI finished - means user turn is complete)
          if (msgType === "response.done") {
            // Wait a moment for final transcription
            setTimeout(() => {
              if (!evalRef.current.speechDone) {
                finishRecording();
              }
            }, 500);
          }

          // Handle errors
          if (msgType === "error") {
            console.error("Realtime API error:", msg.error);
            // Don't fail completely on errors, just report what we have
            if (hasReceivedSpeech) {
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

      const resp = await fetch(REALTIME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (!resp.ok) {
        throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
      }

      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsRecording(true);

      // Maximum timeout as safety (30 seconds)
      evalRef.current.timeoutId = setTimeout(() => {
        if (evalRef.current.inProgress && !evalRef.current.speechDone) {
          finishRecording();
        }
      }, 30000);

    } catch (err) {
      cleanup();
      throw makeError("connection-failed", err?.message || "Failed to connect to realtime API");
    }
  }, [report, targetLang, targetText, timeoutMs, onResult, cleanup]);

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

  return { startRecording, stopRecording, isRecording, supportsSpeech };
}
