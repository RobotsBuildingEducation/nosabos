// src/hooks/useSpeechPractice.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeAudioMetricsFromBlob,
  evaluateAttemptStrict,
} from "../utils/speechEvaluation";

const BCP47 = {
  es: "es-ES",
  en: "en-US",
  nah: "es-ES",
};

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
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const evalRef = useRef({ inProgress: false, speechDone: false, timeoutId: null });
  const [isRecording, setIsRecording] = useState(false);

  const supportsSpeech = useMemo(() => {
    const hasWindow = typeof window !== "undefined";
    const sr = hasWindow && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    return !!sr && hasMedia;
  }, []);

  const cleanup = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    try {
      const tracks = streamRef.current?.getTracks?.();
      tracks?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    mediaRecorderRef.current = null;
    recognitionRef.current = null;
    if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
    evalRef.current.timeoutId = null;
    evalRef.current.inProgress = false;
    evalRef.current.speechDone = false;
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

    const hasWindow = typeof window !== "undefined";
    const SR =
      hasWindow && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) throw makeError("no-speech-recognition");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      throw makeError("no-media");
    if (typeof MediaRecorder === "undefined")
      throw makeError("no-mediarecorder");

    evalRef.current.inProgress = true;
    evalRef.current.speechDone = false;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      evalRef.current.inProgress = false;
      throw makeError("mic-denied", err?.message || "microphone access denied");
    }

    streamRef.current = stream;
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    const chunks = [];
    mr.ondataavailable = (evt) => {
      if (evt.data?.size) chunks.push(evt.data);
    };
    mr.onstop = async () => {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {}
      if (!evalRef.current.speechDone) {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const metrics = await computeAudioMetricsFromBlob(blob);
          await report({
            recognizedText: "",
            confidence: 0,
            audioMetrics: metrics,
            method: "audio-fallback",
          });
        } catch (err) {
          onResult?.({
            evaluation: null,
            recognizedText: "",
            confidence: 0,
            audioMetrics: null,
            method: "audio-fallback",
            error: err,
          });
        }
      }
      if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
      evalRef.current.timeoutId = null;
      evalRef.current.inProgress = false;
      setIsRecording(false);
    };

    const recog = new SR();
    recognitionRef.current = recog;
    recog.lang = BCP47[targetLang] || BCP47.es;
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 5;

    recog.onresult = async (evt) => {
      if (!evalRef.current.inProgress) return;
      evalRef.current.speechDone = true;
      if (evalRef.current.timeoutId) clearTimeout(evalRef.current.timeoutId);
      evalRef.current.timeoutId = null;

      const result = evt.results?.[0];
      const best = result?.[0];
      await report({
        recognizedText: best?.transcript || "",
        confidence:
          typeof best?.confidence === "number" ? best.confidence : 0,
        audioMetrics: null,
        method: "live-speech-api",
      });

      try {
        recog.stop();
      } catch {}
      try {
        mr.stop();
      } catch {}
    };

    recog.onerror = () => {
      evalRef.current.speechDone = false;
      try {
        mr.stop();
      } catch {}
    };

    recog.onend = () => {
      if (evalRef.current.inProgress && !evalRef.current.speechDone) {
        try {
          mr.stop();
        } catch {}
      }
    };

    try {
      recog.start();
    } catch (err) {
      evalRef.current.inProgress = false;
      stream.getTracks().forEach((t) => t.stop());
      throw makeError("recognition-start", err?.message || "speech start failed");
    }

    mr.start();
    setIsRecording(true);

    evalRef.current.timeoutId = setTimeout(() => {
      if (!evalRef.current.inProgress) return;
      evalRef.current.speechDone = false;
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {}
    }, Math.max(4000, timeoutMs));
  }, [report, targetLang, targetText, timeoutMs, onResult]);

  const stopRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  }, []);

  return { startRecording, stopRecording, isRecording, supportsSpeech };
}
