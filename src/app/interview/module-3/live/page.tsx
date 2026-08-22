"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MicrophoneIcon,
  PhoneXMarkIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { saveLocalInterviewResult } from "@/lib/interview/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type TranscriptEntry = {
  id: string;
  role: "ai" | "user";
  text: string;
  final: boolean;
};

type SessionStatus =
  | "init"
  | "connecting"
  | "connected"
  | "ai_speaking"
  | "user_speaking"
  | "ending"
  | "ended"
  | "error";

type SessionConfig = {
  roleName: string;
  experienceLevelName: string;
  interviewType: string;
  voice: string;
  languageCode: string;
  jobTitle?: string;
  jobDescription?: string;
  candidateSummary?: string;
};

// ─── AI Avatar ────────────────────────────────────────────────────────────────

function AIAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-50 to-indigo-100">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-600 shadow-2xl shadow-emerald-300">
        <svg
          viewBox="0 0 48 48"
          className="h-16 w-16 text-white"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="24" cy="17" r="9" />
          <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18" />
        </svg>
        {speaking && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
          </span>
        )}
      </div>

      {/* Speaking animation */}
      {speaking && (
        <div className="flex items-end gap-1" aria-label="AI đang nói">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-emerald-500"
              style={{
                height: `${8 + ((i % 3) + 1) * 6}px`,
                animation: "waveBar 0.8s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

const STATUS_LABEL: Record<SessionStatus, string> = {
  init: "Khởi tạo...",
  connecting: "Đang kết nối...",
  connected: "Đang chờ",
  ai_speaking: "AI đang nói",
  user_speaking: "Bạn đang nói",
  ending: "Đang xử lý...",
  ended: "Kết thúc",
  error: "Lỗi kết nối",
};

export default function Module3LivePage() {
  const router = useRouter();

  const [status, setStatus] = useState<SessionStatus>("init");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SessionConfig | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(0);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const sessionIdRef = useRef("");
  const hasStartedRef = useRef(false);

  // Keep transcriptRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load config from sessionStorage
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("interview:rt:config")
        : null;
    if (!raw) {
      router.replace("/interview/module-3");
      return;
    }
    setConfig(JSON.parse(raw) as SessionConfig);
  }, [router]);

  // Auto-start when config is ready
  useEffect(() => {
    if (config && !hasStartedRef.current) {
      hasStartedRef.current = true;
      void initSession(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Timer
  useEffect(() => {
    const active =
      status === "connected" ||
      status === "ai_speaking" ||
      status === "user_speaking";
    if (!active) return;
    const id = setInterval(
      () => setElapsed(Date.now() - startTimeRef.current),
      1000
    );
    return () => clearInterval(id);
  }, [status]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ─── Session init ──────────────────────────────────────────────────────────

  const initSession = async (cfg: SessionConfig) => {
    setStatus("connecting");

    try {
      // 1. Camera + mic permission
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        throw new Error("CAMERA_MIC_DENIED");
      }
      localStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // 2. Get ephemeral key
      const sessionRes = await fetch("/api/interview/module-3/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_name: cfg.roleName,
          experience_level_name: cfg.experienceLevelName,
          interview_type: cfg.interviewType,
          voice: cfg.voice,
          language_code: cfg.languageCode,
          job_title: cfg.jobTitle,
          job_description: cfg.jobDescription,
          candidate_summary: cfg.candidateSummary,
        }),
      });
      if (!sessionRes.ok) {
        const errBody = await sessionRes.json().catch(() => ({})) as { error?: string; message?: string };
        if (sessionRes.status === 401) { router.replace("/signup?redirectedFrom=/interview/module-3"); return; }
        if (sessionRes.status === 403) { router.replace("/pricing?reason=quota"); return; }
        throw new Error(errBody.message ?? "SESSION_FAILED");
      }
      const { session_id, ephemeral_key } = (await sessionRes.json()) as {
        session_id: string;
        ephemeral_key: string;
      };
      sessionIdRef.current = session_id;

      // 3. WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio → play AI voice
      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      pc.ontrack = (e) => {
        remoteAudio.srcObject = e.streams[0];
      };

      // Local audio track only (video stays local, not sent to AI)
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, new MediaStream([audioTrack]));
      }

      // 4. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dc.addEventListener("message", handleEvent);

      // 5. SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 6. Connect to OpenAI Realtime
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeral_key}`,
            "Content-Type": "application/sdp",
          },
        }
      );
      if (!sdpRes.ok) throw new Error("WEBRTC_FAILED");
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      startTimeRef.current = Date.now();
      setStatus("connected");
    } catch (err) {
      const isPermission =
        err instanceof Error && err.message === "CAMERA_MIC_DENIED";
      setError(
        isPermission
          ? "Trình duyệt cần quyền truy cập camera và microphone. Hãy cho phép và thử lại."
          : "Không thể kết nối phỏng vấn. Kiểm tra kết nối mạng và thử lại."
      );
      setStatus("error");
    }
  };

  // ─── Data channel event handler ───────────────────────────────────────────

  const handleEvent = useCallback((e: MessageEvent) => {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(e.data as string) as Record<string, unknown>;
    } catch {
      return;
    }

    switch (event.type) {
      // AI transcript — streaming delta
      case "response.audio_transcript.delta": {
        const delta = (event.delta as string) ?? "";
        setStatus("ai_speaking");
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "ai" && !last.final) {
            return [
              ...prev.slice(0, -1),
              { ...last, text: last.text + delta },
            ];
          }
          return [
            ...prev,
            {
              id: `ai-${Date.now()}-${Math.random()}`,
              role: "ai",
              text: delta,
              final: false,
            },
          ];
        });
        break;
      }

      // AI transcript — complete
      case "response.audio_transcript.done": {
        const full = (event.transcript as string) ?? "";
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "ai") {
            return [
              ...prev.slice(0, -1),
              { ...last, text: full || last.text, final: true },
            ];
          }
          return prev;
        });
        break;
      }

      // AI response done → back to idle
      case "response.done": {
        setStatus((s) => (s === "ai_speaking" ? "connected" : s));
        break;
      }

      // User transcript completed
      case "conversation.item.input_audio_transcription.completed": {
        const userText = ((event.transcript as string) ?? "").trim();
        if (userText) {
          setTranscript((prev) => [
            ...prev,
            {
              id: `user-${Date.now()}-${Math.random()}`,
              role: "user",
              text: userText,
              final: true,
            },
          ]);
        }
        break;
      }

      // VAD: user started speaking
      case "input_audio_buffer.speech_started": {
        setStatus("user_speaking");
        break;
      }

      // VAD: user stopped speaking
      case "input_audio_buffer.speech_stopped": {
        setStatus((s) => (s === "user_speaking" ? "connected" : s));
        break;
      }

      case "error": {
        console.error("OpenAI Realtime error:", event.error);
        break;
      }
    }
  }, []);

  // ─── Controls ─────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const endInterview = useCallback(async () => {
    if (status === "ending" || status === "ended") return;
    setStatus("ending");

    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    const entries = transcriptRef.current;
    const cfg = config;
    const sid = sessionIdRef.current;

    if (!cfg || entries.length === 0 || !sid) {
      router.push("/interview/module-3");
      return;
    }

    try {
      const res = await fetch("/api/interview/module-3/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          transcript: entries.map(({ role, text }) => ({ role, text })),
          role_name: cfg.roleName,
          experience_level_name: cfg.experienceLevelName,
          language_code: cfg.languageCode,
        }),
      });

      if (res.ok) {
        const { result } = (await res.json()) as {
          result: Parameters<typeof saveLocalInterviewResult>[0];
        };
        saveLocalInterviewResult(result);
        setStatus("ended");
        router.push(`/interview/results/${sid}`);
      } else {
        router.push("/interview/module-3");
      }
    } catch {
      router.push("/interview/module-3");
    }
  }, [status, config, router]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const isActive =
    status === "connected" ||
    status === "ai_speaking" ||
    status === "user_speaking";

  // ─── Error state ──────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-8 py-6">
          <p className="text-lg font-semibold text-red-700">
            Không thể kết nối
          </p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={() => router.push("/interview/module-3")}
          className="rounded-[20px] bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Quay lại cấu hình
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Wave animation style */}
      <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div className="flex flex-col gap-5">
        {/* Header bar */}
        <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/85 px-6 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <SignalIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                Module 3
              </p>
              <p className="text-base font-semibold text-slate-900">
                Phỏng vấn Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isActive && (
              <span className="font-mono text-sm font-semibold text-slate-700">
                {fmtTime(elapsed)}
              </span>
            )}
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === "connecting"
                    ? "bg-amber-100 text-amber-700"
                    : status === "ending"
                      ? "bg-orange-100 text-orange-700"
                      : status === "ai_speaking"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "user_speaking"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "ai_speaking"
                    ? "animate-pulse bg-emerald-500"
                    : status === "user_speaking"
                      ? "animate-pulse bg-emerald-500"
                      : status === "connecting"
                        ? "animate-pulse bg-amber-500"
                        : "bg-slate-400"
                }`}
              />
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* Video panels */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* AI Avatar panel */}
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/70 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            style={{ aspectRatio: "16/9" }}
          >
            <AIAvatar speaking={status === "ai_speaking"} />
            <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">
                Alex — HR Interviewer
              </p>
              <p className="text-xs text-white/70">
                {status === "ai_speaking" ? "● Đang nói..." : "● Đang nghe"}
              </p>
            </div>
          </div>

          {/* User webcam panel */}
          <div
            className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />

            {/* Connecting overlay */}
            {status === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <div className="text-center text-white">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="mt-3 text-sm">Đang kết nối camera...</p>
                </div>
              </div>
            )}

            {/* Ending overlay */}
            {status === "ending" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <div className="text-center text-white">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="mt-3 text-sm">Đang tổng hợp kết quả...</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Bạn</p>
              <p className="text-xs text-white/70">
                {isMuted
                  ? "● Mic tắt"
                  : status === "user_speaking"
                    ? "● Đang nói..."
                    : "● Mic bật"}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time transcript */}
        <div className="rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Transcript thời gian thực
            </p>
            {transcript.length > 0 && (
              <span className="text-xs text-slate-400">
                {transcript.length} tin nhắn
              </span>
            )}
          </div>

          <div className="h-52 overflow-y-auto px-6 py-4">
            {transcript.length === 0 ? (
              <p className="text-sm italic text-slate-400">
                {status === "connecting"
                  ? "Đang kết nối với AI phỏng vấn viên..."
                  : "Transcript sẽ xuất hiện ở đây khi cuộc trò chuyện bắt đầu."}
              </p>
            ) : (
              <div className="space-y-3">
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex gap-2 ${
                      entry.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        entry.role === "ai"
                          ? "bg-emerald-50 text-slate-800"
                          : "bg-slate-100 text-slate-800"
                      } ${!entry.final ? "opacity-70" : ""}`}
                    >
                      <span
                        className={`mr-1.5 text-xs font-semibold ${
                          entry.role === "ai"
                            ? "text-emerald-500"
                            : "text-slate-400"
                        }`}
                      >
                        {entry.role === "ai" ? "Alex" : "Bạn"}
                      </span>
                      {entry.text}
                      {!entry.final && (
                        <span className="ml-1 inline-block animate-pulse text-slate-400">
                          ▋
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 rounded-[24px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={toggleMute}
            disabled={!isActive}
            className={`flex items-center gap-2 rounded-[20px] border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isMuted
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <MicrophoneIcon className="h-4 w-4" />
            {isMuted ? "Bật mic" : "Tắt mic"}
          </button>

          <button
            type="button"
            onClick={() => void endInterview()}
            disabled={
              status === "connecting" ||
              status === "ending" ||
              status === "ended"
            }
            className="flex items-center gap-2 rounded-[20px] bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            <PhoneXMarkIcon className="h-4 w-4" />
            {status === "ending" ? "Đang xử lý..." : "Kết thúc phỏng vấn"}
          </button>
        </div>
      </div>
    </>
  );
}
