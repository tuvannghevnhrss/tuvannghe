"use client";

/**
 * Phòng phỏng vấn: Realtime Voice → Transcript → Orchestrator (máy chủ) → Câu hỏi → Realtime Voice.
 * - Model giọng nói KHÔNG tự trả lời (create_response=false); chỉ đọc nguyên văn câu hỏi do Orchestrator tạo.
 * - Chế độ dự phòng (ghi âm/gõ chữ → cùng Orchestrator) khi Realtime không dùng được.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { jaccard } from "@/lib/m3/text";
import { sayInstruction } from "@/lib/m3/persona";
import type { InterviewConfig } from "@/lib/m3/schemas";
import { ApiError, m3api, type Message, type Progress, type TurnResponse } from "./api";

export type RoomStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "user_speaking"
  | "thinking"
  | "speaking"
  | "reconnecting"
  | "error"
  | "finishing"
  | "ended";

export type TranscriptEntry = { id: string; role: "ai" | "user"; text: string; turn: number | null };

const FILLER_ONLY = /^(?:\s|[.,!?…-]|ừm+|ờ+|à+|ừ+|ơ+|ê+|hmm+|um+|uh+|uhm+|ah+|eh+|er+)*$/i;
const DEBOUNCE_MS = 1500;
const MAX_RECONNECTS = 2;

function micErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Trình duyệt chưa được cấp quyền microphone. Hãy cho phép micro cho trang này rồi bấm thử lại.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy microphone. Hãy cắm/bật micro rồi thử lại.";
  if (name === "NotReadableError") return "Microphone đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.";
  return "Không truy cập được microphone.";
}

export function useInterviewRoom(opts: {
  interviewId: string;
  config: InterviewConfig;
  initialMessages: Message[];
  initialProgress: Progress | null;
  resumed: boolean;
  onFinished: () => void;
}) {
  const { interviewId, config, onFinished } = opts;
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [mode, setMode] = useState<"voice" | "fallback">("voice");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(opts.initialProgress);
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(() =>
    opts.initialMessages.map((m) => ({
      id: `m-${m.turn_index}-${m.role}`,
      role: m.role === "interviewer" ? "ai" : "user",
      text: m.content,
      turn: m.turn_index,
    })),
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const lastQuestionRef = useRef<string>("");
  const doneRef = useRef(false);
  const busyRef = useRef(false);
  const pendingRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectsRef = useRef(0);
  const statusRef = useRef<RoomStatus>("idle");
  const modeRef = useRef<"voice" | "fallback">("voice");
  const unmountedRef = useRef(false);
  const recorderRef = useRef<{ rec: MediaRecorder; chunks: Blob[]; startedAt: number } | null>(null);
  const finishingRef = useRef(false);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const setStatusSafe = useCallback((s: RoomStatus) => {
    statusRef.current = s;
    if (!unmountedRef.current) setStatus(s);
  }, []);

  const addEntry = useCallback((role: "ai" | "user", text: string, turn: number | null) => {
    setTranscript((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text, turn }]);
  }, []);

  /* ────────── kết thúc & lấy báo cáo ────────── */
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setStatusSafe("finishing");
    try {
      pcRef.current?.close();
      micRef.current?.getTracks().forEach((t) => t.stop());
      await m3api.complete(interviewId);
      setStatusSafe("ended");
      onFinished();
    } catch (err) {
      finishingRef.current = false;
      const msg = err instanceof ApiError ? err.message : "Không tạo được báo cáo.";
      setError(msg);
      setStatusSafe("error");
    }
  }, [interviewId, onFinished, setStatusSafe]);

  /* ────────── đọc câu hỏi bằng giọng nói ────────── */
  const markSpeakingEnded = useCallback(() => {
    if (speakingFallbackRef.current) clearTimeout(speakingFallbackRef.current);
    if (doneRef.current) {
      void finish();
      return;
    }
    if (statusRef.current === "speaking") setStatusSafe("listening");
  }, [finish, setStatusSafe]);

  const say = useCallback(
    (text: string) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return false;
      setStatusSafe("speaking");
      dc.send(JSON.stringify({ type: "response.create", response: { instructions: sayInstruction(text) } }));
      // Phòng khi không nhận được sự kiện kết thúc phát âm
      if (speakingFallbackRef.current) clearTimeout(speakingFallbackRef.current);
      speakingFallbackRef.current = setTimeout(markSpeakingEnded, Math.min(90_000, 6000 + text.length * 110));
      return true;
    },
    [markSpeakingEnded, setStatusSafe],
  );

  /* ────────── gửi câu trả lời → Orchestrator ────────── */
  const handleTurnResponse = useCallback(
    (res: TurnResponse, answerText: string, answerEntry: boolean) => {
      if (answerEntry) addEntry("user", answerText, res.counted ? (res.turn_index ?? null) : null);
      setProgress(res.progress);
      lastQuestionRef.current = res.question;
      addEntry("ai", res.question, res.turn_index ?? null);
      if (res.done) doneRef.current = true;
      if (modeRef.current === "voice") {
        if (!say(res.question)) setStatusSafe("listening");
      } else if (res.audio_base64) {
        const el = fallbackAudioRef.current ?? new Audio();
        fallbackAudioRef.current = el;
        el.src = `data:${res.audio_mime ?? "audio/mpeg"};base64,${res.audio_base64}`;
        setStatusSafe("speaking");
        el.onended = markSpeakingEnded;
        void el.play().catch(() => markSpeakingEnded());
      } else {
        // Không có audio: hiển thị chữ rồi tiếp tục
        if (res.done) void finish();
        else setStatusSafe("listening");
      }
    },
    [addEntry, finish, markSpeakingEnded, say, setStatusSafe],
  );

  const submitAnswer = useCallback(
    async (text: string, via: "realtime" | "text") => {
      if (busyRef.current || doneRef.current) return;
      busyRef.current = true;
      setStatusSafe("thinking");
      setNotice(null);
      try {
        const res = await m3api.turn(interviewId, { answer: text, via, want_audio: modeRef.current === "fallback" });
        handleTurnResponse(res, text, true);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Không xử lý được câu trả lời.";
        if (err instanceof ApiError && err.code === "COST_LIMIT") {
          setError(msg);
          setStatusSafe("error");
        } else {
          setNotice(`${msg} Hãy nói/gửi lại câu trả lời.`);
          setStatusSafe("listening");
        }
      } finally {
        busyRef.current = false;
      }
    },
    [handleTurnResponse, interviewId, setStatusSafe],
  );

  const flushPending = useCallback(() => {
    const text = pendingRef.current.trim();
    pendingRef.current = "";
    if (!text || FILLER_ONLY.test(text)) return;
    void submitAnswer(text, "realtime");
  }, [submitAnswer]);

  /* ────────── sự kiện Realtime ────────── */
  const handleEvent = useCallback(
    (e: MessageEvent) => {
      let ev: { type?: string; transcript?: string; error?: { message?: string } };
      try {
        ev = JSON.parse(e.data as string);
      } catch {
        return;
      }
      switch (ev.type) {
        case "input_audio_buffer.speech_started":
          if (debounceRef.current) clearTimeout(debounceRef.current);
          if (!busyRef.current && !doneRef.current) setStatusSafe("user_speaking");
          break;
        case "input_audio_buffer.speech_stopped":
          if (statusRef.current === "user_speaking") setStatusSafe("listening");
          break;
        case "conversation.item.input_audio_transcription.completed": {
          const text = (ev.transcript ?? "").trim();
          if (!text || FILLER_ONLY.test(text) || busyRef.current || doneRef.current) break;
          // Chống tự nghe lại giọng AI (echo): bỏ qua nếu gần như trùng câu hỏi đang đọc
          if (statusRef.current === "speaking" && jaccard(text, lastQuestionRef.current) > 0.6) break;
          pendingRef.current = `${pendingRef.current} ${text}`.trim();
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(flushPending, DEBOUNCE_MS);
          break;
        }
        case "output_audio_buffer.stopped":
          markSpeakingEnded();
          break;
        case "response.done":
          if (speakingFallbackRef.current) clearTimeout(speakingFallbackRef.current);
          // Âm thanh còn đang phát một lúc sau response.done → chờ output_audio_buffer.stopped, có chốt chặn
          speakingFallbackRef.current = setTimeout(markSpeakingEnded, 9000);
          break;
        case "error":
          console.warn("Realtime error:", ev.error?.message);
          break;
      }
    },
    [flushPending, markSpeakingEnded, setStatusSafe],
  );

  /* ────────── kết nối giọng nói ────────── */
  const teardownVoice = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    dcRef.current?.close();
    pcRef.current?.close();
    dcRef.current = null;
    pcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
  }, []);

  const connectVoice = useCallback(
    async (intro: string | null) => {
      setError(null);
      setStatusSafe(reconnectsRef.current > 0 ? "reconnecting" : "connecting");
      teardownVoice();
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
          throw new Error("Trình duyệt này không hỗ trợ phỏng vấn giọng nói. Hãy dùng chế độ dự phòng.");
        }
        let mic: MediaStream;
        try {
          mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        } catch (err) {
          throw new Error(micErrorMessage(err));
        }
        micRef.current = mic;
        mic.getAudioTracks()[0]?.addEventListener("ended", () => {
          if (!unmountedRef.current && !finishingRef.current) {
            setError("Microphone đã bị ngắt kết nối.");
            setStatusSafe("error");
          }
        });

        const { client_secret } = await m3api.realtimeToken(interviewId);

        const pc = new RTCPeerConnection();
        pcRef.current = pc;
        const audio = audioElRef.current ?? new Audio();
        audioElRef.current = audio;
        audio.autoplay = true;
        pc.ontrack = (ev) => {
          audio.srcObject = ev.streams[0];
        };
        mic.getAudioTracks().forEach((t) => pc.addTrack(t, mic));
        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;
        dc.addEventListener("message", handleEvent);

        pc.onconnectionstatechange = () => {
          const st = pc.connectionState;
          if (st === "connected") {
            if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
          } else if ((st === "disconnected" || st === "failed") && !finishingRef.current && !unmountedRef.current) {
            if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = setTimeout(() => void autoReconnect(), st === "failed" ? 0 : 4000);
          }
        };

        const opened = new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Kết nối giọng nói quá thời gian chờ.")), 15_000);
          dc.addEventListener("open", () => {
            clearTimeout(t);
            resolve();
          });
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          body: offer.sdp,
          headers: { Authorization: `Bearer ${client_secret}`, "Content-Type": "application/sdp" },
        });
        if (!sdpRes.ok) throw new Error("Không thiết lập được kết nối giọng nói với dịch vụ AI.");
        await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
        await opened;

        reconnectsRef.current = 0;
        setStatusSafe("listening");
        if (intro && !doneRef.current) {
          say(intro);
        }
      } catch (err) {
        teardownVoice();
        setError(err instanceof Error ? err.message : "Không kết nối được giọng nói.");
        setStatusSafe("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleEvent, interviewId, say, setStatusSafe, teardownVoice],
  );

  const resumeIntro = useCallback(
    () =>
      config.language === "vi"
        ? `Xin lỗi, kết nối vừa bị gián đoạn. Mình tiếp tục nhé. ${lastQuestionRef.current}`
        : `Sorry, the connection was interrupted. Let me continue. ${lastQuestionRef.current}`,
    [config.language],
  );

  const autoReconnect = useCallback(async () => {
    if (modeRef.current !== "voice" || finishingRef.current || unmountedRef.current || doneRef.current) return;
    if (reconnectsRef.current >= MAX_RECONNECTS) {
      setError("Mất kết nối giọng nói nhiều lần. Bạn có thể thử lại hoặc chuyển sang chế độ dự phòng — tiến độ phỏng vấn vẫn được giữ nguyên.");
      setStatusSafe("error");
      return;
    }
    reconnectsRef.current += 1;
    try {
      const s = await m3api.start(interviewId); // tải lại trạng thái từ máy chủ
      const lastAi = [...s.messages].reverse().find((m) => m.role === "interviewer");
      if (lastAi) lastQuestionRef.current = lastAi.content;
      setProgress(s.progress);
    } catch {
      /* dùng câu hỏi đang có */
    }
    await connectVoice(resumeIntro());
  }, [connectVoice, interviewId, resumeIntro, setStatusSafe]);

  /** Người dùng bấm "Thử lại". */
  const retry = useCallback(async () => {
    reconnectsRef.current = 0;
    if (modeRef.current === "voice") {
      try {
        const s = await m3api.start(interviewId);
        const lastAi = [...s.messages].reverse().find((m) => m.role === "interviewer");
        if (lastAi) lastQuestionRef.current = lastAi.content;
        setProgress(s.progress);
      } catch {
        /* giữ nguyên */
      }
      await connectVoice(opts.resumed || transcript.length > 1 ? resumeIntro() : lastQuestionRef.current);
    } else {
      setError(null);
      setStatusSafe("listening");
    }
  }, [connectVoice, interviewId, opts.resumed, resumeIntro, setStatusSafe, transcript.length]);

  /** Bắt đầu buổi phỏng vấn (sau khi người dùng bấm nút → có cử chỉ người dùng để phát âm thanh). */
  const begin = useCallback(async () => {
    const lastAi = [...opts.initialMessages].reverse().find((m) => m.role === "interviewer");
    lastQuestionRef.current = lastAi?.content ?? "";
    if (modeRef.current === "voice") {
      await connectVoice(opts.resumed ? resumeIntro() : lastQuestionRef.current);
    }
  }, [connectVoice, opts.initialMessages, opts.resumed, resumeIntro]);

  /* ────────── chế độ dự phòng ────────── */
  const switchToFallback = useCallback(() => {
    teardownVoice();
    modeRef.current = "fallback";
    setMode("fallback");
    setError(null);
    setNotice("Đang dùng chế độ dự phòng: nhấn nút micro để ghi âm câu trả lời, hoặc gõ chữ.");
    setStatusSafe("listening");
  }, [setStatusSafe, teardownVoice]);

  const switchToVoice = useCallback(async () => {
    modeRef.current = "voice";
    setMode("voice");
    setNotice(null);
    await connectVoice(resumeIntro());
  }, [connectVoice, resumeIntro]);

  const sendText = useCallback((text: string) => void submitAnswer(text.trim(), "text"), [submitAnswer]);

  const toggleRecording = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    if (recorderRef.current) {
      recorderRef.current.rec.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorderRef.current = { rec, chunks, startedAt: Date.now() };
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const startedAt = recorderRef.current?.startedAt ?? Date.now();
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 2000) {
          setNotice("Bản ghi quá ngắn, hãy thử lại.");
          return;
        }
        busyRef.current = true;
        setStatusSafe("thinking");
        try {
          const res = await m3api.turnAudio(interviewId, blob, Math.round((Date.now() - startedAt) / 1000));
          handleTurnResponse(res, res.transcript ?? "", !!res.transcript);
        } catch (err) {
          setNotice(`${err instanceof ApiError ? err.message : "Không xử lý được bản ghi."} Hãy thử lại.`);
          setStatusSafe("listening");
        } finally {
          busyRef.current = false;
        }
      };
      rec.start();
      setRecording(true);
      setStatusSafe("user_speaking");
    } catch (err) {
      setNotice(micErrorMessage(err));
    }
  }, [handleTurnResponse, interviewId, setStatusSafe]);

  const toggleMute = useCallback(() => {
    const track = micRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      teardownVoice();
      if (speakingFallbackRef.current) clearTimeout(speakingFallbackRef.current);
    };
  }, [teardownVoice]);

  return {
    status,
    mode,
    error,
    notice,
    progress,
    transcript,
    recording,
    muted,
    begin,
    retry,
    finish,
    switchToFallback,
    switchToVoice,
    sendText,
    toggleRecording,
    toggleMute,
  };
}
