"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MicrophoneIcon,
  StopIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { saveLocalInterviewResult } from "@/lib/interview/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "loading"
  | "countdown"
  | "ai_speaking"
  | "user_ready"
  | "user_recording"
  | "recorded"
  | "confirming"
  | "completed"
  | "analyzing";

type Turn = {
  order: number;
  question: string;
  audio_base64: string | null;
  audio_mime: string;
};

type Attempt = {
  id: string;
  blob: Blob;
  objectUrl: string;
  durationSeconds: number;
};

type TurnRecord = {
  order: number;
  question: string;
  transcript: string;
  durationSeconds: number;
  attemptCount: number;
};

type SessionMeta = {
  roleName: string;
  experienceLevelName: string;
  interviewType: string;
  firstTurn: Turn;
  totalTurns: number;
  localMode: boolean;
  voice: string;
  languageCode: string;
};

// ─── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({ src, durationSeconds }: { src: string; durationSeconds: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => {}); setPlaying(true); }
  }

  const progress = durationSeconds > 0 ? Math.min((currentTime / durationSeconds) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2.5">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />
      <button
        type="button"
        onClick={toggle}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
      >
        {playing ? (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-slate-700">
            <rect x="5" y="4" width="3" height="12" rx="1" />
            <rect x="12" y="4" width="3" height="12" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-slate-700 translate-x-px">
            <path d="M6 4l10 6-10 6V4z" />
          </svg>
        )}
      </button>

      <div
        className="flex-1 h-1.5 cursor-pointer overflow-hidden rounded-full bg-slate-200"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          if (audioRef.current) {
            audioRef.current.currentTime = ratio * durationSeconds;
            setCurrentTime(ratio * durationSeconds);
          }
        }}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
        {fmt(currentTime)} / {fmt(durationSeconds)}
      </span>
    </div>
  );
}

// ─── Attempt Card ─────────────────────────────────────────────────────────────

function AttemptCard({
  attempt,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  attempt: Attempt;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isSelected
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSelected ? (
            <CheckCircleSolid className="h-4 w-4 text-emerald-500" />
          ) : (
            <CheckCircleIcon className="h-4 w-4 text-slate-300" />
          )}
          <span className={`text-xs font-semibold ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
            Lần {index + 1}
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-px text-[11px] text-slate-500">
            {attempt.durationSeconds}s
          </span>
          {isSelected && (
            <span className="rounded-full bg-emerald-100 px-2 py-px text-[11px] font-semibold text-emerald-700">
              Đã chọn
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
          title="Xóa bản này"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <AudioPlayer src={attempt.objectUrl} durationSeconds={attempt.durationSeconds} />

      {!isSelected && (
        <button
          type="button"
          onClick={onSelect}
          className="mt-2.5 w-full rounded-xl border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
        >
          Chọn bản này để phân tích
        </button>
      )}
    </div>
  );
}

// ─── AI Avatar ────────────────────────────────────────────────────────────────

function AIAvatar({ phase }: { phase: Phase }) {
  const isSpeaking = phase === "ai_speaking";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-50 to-indigo-100">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 shadow-2xl shadow-emerald-300/50">
        <svg viewBox="0 0 48 48" className="h-14 w-14 text-white" fill="currentColor">
          <circle cx="24" cy="17" r="9" />
          <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18" />
        </svg>
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
          </span>
        )}
      </div>

      {isSpeaking && (
        <div className="flex items-end gap-1">
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

// ─── User Video ───────────────────────────────────────────────────────────────

function UserVideo({ isRecording, onStreamReady }: { isRecording: boolean; onStreamReady?: (s: MediaStream) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);

  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCamOn(true);
      onStreamReady?.(stream);
    } catch { /* denied */ }
  }, [onStreamReady]);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => { startCam(); return () => stopCam(); }, [startCam, stopCam]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {camOn ? (
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/60">
            <svg viewBox="0 0 40 40" className="h-9 w-9 text-slate-500" fill="currentColor">
              <circle cx="20" cy="14" r="7" fillOpacity="0.5" />
              <path d="M5 36 Q8 26 20 23 Q32 26 35 36" fillOpacity="0.4" />
            </svg>
          </div>
          <button type="button" onClick={startCam}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/15 transition">
            Bật camera
          </button>
        </div>
      )}
      {isRecording && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-rose-600/90 px-2.5 py-1 shadow backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-white">REC</span>
        </div>
      )}
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function CountdownOverlay({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <p className="text-sm font-medium text-white/70">Bắt đầu sau</p>
      <span className="mt-2 text-7xl font-bold tabular-nums text-emerald-400">{count}</span>
      <p className="mt-2 text-xs text-white/50">Chuẩn bị sẵn sàng!</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveInterviewRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;
  const isLocal = sessionId.startsWith("local-live-");

  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [totalTurns, setTotalTurns] = useState(6);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const [turnRecords, setTurnRecords] = useState<TurnRecord[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<Attempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const allObjectUrlsRef = useRef<string[]>([]);

  const completedTurns = turnRecords.length;
  const isLastQuestion = completedTurns >= totalTurns - 1 && currentAttempts.length > 0;

  useEffect(() => {
    return () => {
      allObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      mediaRecorderRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(`interview:live:${sessionId}`);
    if (!raw) { setError("Không tìm thấy dữ liệu phiên."); setPhase("completed"); return; }
    const stored = JSON.parse(raw) as SessionMeta;
    setMeta(stored);
    setTotalTurns(stored.totalTurns ?? 6);
    setCurrentTurn(stored.firstTurn);
    setPhase("countdown");
  }, [sessionId]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("ai_speaking"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "user_recording") return;
    const timer = window.setInterval(() => {
      if (startedAtRef.current)
        setDurationSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "ai_speaking" || !currentTurn) return;
    if (currentTurn.audio_base64) {
      const src = `data:${currentTurn.audio_mime};base64,${currentTurn.audio_base64}`;
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => setPhase("user_ready");
      audio.onerror = () => playBrowserTTS(currentTurn.question);
      audio.play().catch(() => playBrowserTTS(currentTurn.question));
    } else {
      playBrowserTTS(currentTurn.question);
    }
    return () => { audioRef.current?.pause(); window.speechSynthesis?.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurn]);

  function playBrowserTTS(text: string) {
    if (!window.speechSynthesis) { setPhase("user_ready"); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = meta?.languageCode === "en" ? "en-US" : "vi-VN";
    utter.rate = 0.92;
    utter.onend = () => setPhase("user_ready");
    utter.onerror = () => setPhase("user_ready");
    window.speechSynthesis.speak(utter);
  }

  function skipAI() {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPhase("user_ready");
  }

  async function startRecording() {
    setError(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const objectUrl = URL.createObjectURL(blob);
        allObjectUrlsRef.current.push(objectUrl);
        const dur = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const attempt: Attempt = { id: `a-${Date.now()}`, blob, objectUrl, durationSeconds: dur };
        setCurrentAttempts((prev) => [...prev, attempt]);
        setSelectedAttemptId(attempt.id);
        stream.getTracks().forEach((t) => t.stop());
        setPhase("recorded");
      };
      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      recorder.start();
      setPhase("user_recording");
    } catch {
      setError("Không truy cập được micro. Kiểm tra quyền trình duyệt.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function deleteAttempt(id: string) {
    const target = currentAttempts.find((a) => a.id === id);
    if (target) {
      URL.revokeObjectURL(target.objectUrl);
      allObjectUrlsRef.current = allObjectUrlsRef.current.filter((u) => u !== target.objectUrl);
    }
    const remaining = currentAttempts.filter((a) => a.id !== id);
    setCurrentAttempts(remaining);
    if (selectedAttemptId === id) {
      setSelectedAttemptId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
    if (remaining.length === 0) setPhase("user_ready");
  }

  function handleRetake() {
    setPhase("user_ready");
  }

  async function handleAdvance() {
    const selected = currentAttempts.find((a) => a.id === selectedAttemptId);
    if (!selected || !currentTurn || !meta) return;

    setPhase("confirming");
    setError(null);

    try {
      const form = new FormData();
      form.append("audio", selected.blob, `live-turn-${currentTurn.order}.webm`);
      form.append("turn_order", String(currentTurn.order));
      form.append("duration_seconds", String(selected.durationSeconds));
      form.append("current_question", currentTurn.question);
      form.append("language_code", meta.languageCode ?? "vi");
      form.append("is_retake", "false");

      if (isLocal) {
        const history = turnRecords.map((r) => ({ question: r.question, transcript: r.transcript }));
        form.append("conversation_history", JSON.stringify(history));
        form.append("role_name", meta.roleName);
        form.append("experience_level_name", meta.experienceLevelName);
        form.append("interview_type", meta.interviewType);
        form.append("voice", meta.voice ?? "shimmer");
        form.append("total_turns", String(totalTurns));
      }

      const res = await fetch(`/api/interview/live/${sessionId}/turn`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "TURN_FAILED");

      const transcript: string = json.transcript || "(Không nhận diện được)";

      setTurnRecords((prev) => [
        ...prev,
        { order: currentTurn.order, question: currentTurn.question, transcript, durationSeconds: selected.durationSeconds, attemptCount: currentAttempts.length },
      ]);

      currentAttempts.forEach((a) => {
        URL.revokeObjectURL(a.objectUrl);
        allObjectUrlsRef.current = allObjectUrlsRef.current.filter((u) => u !== a.objectUrl);
      });
      setCurrentAttempts([]);
      setSelectedAttemptId(null);

      const sessionComplete: boolean = json.session_complete;
      if (sessionComplete) {
        setPhase("completed");
      } else {
        setCurrentTurn(json.next_turn as Turn);
        setPhase("ai_speaking");
      }
    } catch {
      setError("Lỗi xử lý câu trả lời. Hãy thử lại.");
      setPhase("recorded");
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    try {
      const turns = turnRecords.map((r) => ({
        question: r.question,
        transcript: r.transcript,
        duration_seconds: r.durationSeconds,
      }));
      const body: Record<string, unknown> = {
        turns,
        role_name: meta?.roleName,
        experience_level_name: meta?.experienceLevelName,
        language_code: meta?.languageCode ?? "vi",
      };
      const res = await fetch(`/api/interview/live/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "COMPLETE_FAILED");
      if (json.local_mode && json.result) saveLocalInterviewResult(json.result);
      router.push(`/interview/results/${json.result_id}`);
    } catch {
      setError("Không tổng hợp được báo cáo. Hãy thử lại.");
      setCompleting(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-500">Đang khởi động AI Interviewer...</p>
        </div>
      </div>
    );
  }

  const showMicControls = ["user_ready", "user_recording", "ai_speaking", "recorded"].includes(phase);
  const isActive = !["loading", "countdown", "completed", "analyzing"].includes(phase);

  const statusLabel =
    phase === "ai_speaking" ? "AI đang hỏi" :
    phase === "user_ready" ? "Sẵn sàng" :
    phase === "user_recording" ? "Đang ghi âm" :
    phase === "recorded" ? `${currentAttempts.length} bản ghi` :
    phase === "confirming" ? "Đang xử lý..." :
    phase === "countdown" ? "Chuẩn bị..." :
    phase === "completed" ? "Hoàn thành" : "";

  const statusColor =
    phase === "ai_speaking" ? "bg-emerald-100 text-emerald-700" :
    phase === "user_recording" ? "bg-rose-100 text-rose-700" :
    phase === "recorded" ? "bg-amber-100 text-amber-700" :
    phase === "confirming" ? "bg-amber-100 text-amber-700" :
    phase === "completed" ? "bg-emerald-100 text-emerald-700" :
    "bg-slate-100 text-slate-600";

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes wavePulse {
          from { transform: scaleY(0.3); opacity: 0.5; }
          to   { transform: scaleY(1.7); opacity: 1; }
        }
      `}</style>

      <div className="flex flex-col gap-5">

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/85 px-6 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <SignalIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Module 2 · Live</p>
              <p className="text-base font-semibold text-slate-900">
                {meta?.roleName ?? "Phỏng vấn AI"}
                {meta?.experienceLevelName && (
                  <span className="ml-2 text-sm font-normal text-slate-500">/ {meta.experienceLevelName}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalTurns }).map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-500 ${
                  i < completedTurns ? "h-2 w-5 bg-emerald-500" : i === completedTurns ? "h-2 w-5 bg-slate-300" : "h-2 w-3 bg-slate-200"
                }`} />
              ))}
              <span className="ml-1 text-xs font-semibold tabular-nums text-slate-400">{completedTurns}/{totalTurns}</span>
            </div>

            {/* Status badge */}
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusColor}`}>
              {(phase === "ai_speaking" || phase === "user_recording" || phase === "confirming") && (
                <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  phase === "user_recording" ? "bg-rose-500" : "bg-emerald-500"
                }`} />
              )}
              {statusLabel}
            </span>

            {isActive && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Kết thúc và xem kết quả đã ghi?")) {
                    if (phase === "user_recording") mediaRecorderRef.current?.stop();
                    setPhase("completed");
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                Kết thúc
              </button>
            )}
          </div>
        </div>

        {/* ── Question card ─────────────────────────────────────────────── */}
        {currentTurn && !["completed", "analyzing", "countdown"].includes(phase) && (
          <div className="rounded-[24px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/25">
                Câu {completedTurns + 1} / {totalTurns}
              </span>
              {phase === "confirming" && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                  <span className="h-3 w-3 animate-spin rounded-full border border-amber-400/40 border-t-amber-500" />
                  Đang xử lý...
                </span>
              )}
            </div>
            <p className="text-base font-medium leading-7 text-slate-900 sm:text-lg sm:leading-8">
              {currentTurn.question}
            </p>
          </div>
        )}

        {/* ── Video panels ──────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* AI Avatar */}
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/70 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            style={{ aspectRatio: "16/9" }}
          >
            <AIAvatar phase={phase} />
            {phase === "countdown" && <CountdownOverlay count={countdown} />}
            <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">AI Interviewer</p>
              <p className="text-xs text-white/70">
                {phase === "ai_speaking" ? "● Đang hỏi..." : "● Đang nghe"}
              </p>
            </div>
            {phase === "ai_speaking" && (
              <button
                type="button"
                onClick={skipAI}
                className="absolute right-3 top-3 rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm transition hover:bg-black/60"
              >
                Bỏ qua ▶
              </button>
            )}
          </div>

          {/* User webcam */}
          <div
            className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
            style={{ aspectRatio: "16/9" }}
          >
            <UserVideo isRecording={phase === "user_recording"} />

            {phase === "confirming" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                <p className="mt-3 text-sm text-white/70">Đang nhận diện giọng nói...</p>
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Bạn</p>
              <p className="text-xs text-white/70">
                {phase === "user_recording" ? "● Đang ghi âm" : "● Sẵn sàng"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Mic controls card ─────────────────────────────────────────── */}
        {showMicControls && (
          <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">

            {phase === "ai_speaking" && (
              <div className="flex items-center gap-4">
                <div className="flex h-7 items-end gap-1">
                  {[0, 1, 2, 3, 4, 3, 2].map((v, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-emerald-400"
                      style={{ height: `${8 + v * 3}px`, animation: "wavePulse 0.5s ease-in-out infinite alternate", animationDelay: `${i * 70}ms` }} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-600">AI đang đặt câu hỏi...</span>
                <button type="button" onClick={skipAI}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                  Bỏ qua ▶
                </button>
              </div>
            )}

            {phase === "user_ready" && (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={startRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 transition hover:scale-105 hover:bg-emerald-400 active:scale-95">
                  <MicrophoneIcon className="h-6 w-6 text-white" />
                </button>
                <span className="text-xs font-medium text-slate-500">Nhấn để trả lời</span>
              </div>
            )}

            {phase === "user_recording" && (
              <div className="flex items-center gap-5">
                <div className="flex h-8 items-end gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-rose-400"
                      style={{ height: `${8 + Math.sin(i * 0.9) * 10}px`, animation: "wavePulse 0.45s ease-in-out infinite alternate", animationDelay: `${i * 55}ms` }} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={stopRecording}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/40 transition hover:scale-105 hover:bg-rose-400 active:scale-95">
                    <StopIcon className="h-6 w-6 text-white" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-rose-500 tabular-nums">{durationSeconds}s</span>
                </div>
                <div className="flex h-8 scale-x-[-1] items-end gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-rose-400"
                      style={{ height: `${8 + Math.sin(i * 0.9) * 10}px`, animation: "wavePulse 0.45s ease-in-out infinite alternate", animationDelay: `${i * 55 + 28}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {phase === "recorded" && (
              <button type="button" onClick={handleRetake}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Thực hành lại
              </button>
            )}

            <p className="text-xs text-slate-400">
              {phase === "user_ready" && "Nhấn nút xanh khi sẵn sàng trả lời"}
              {phase === "user_recording" && "Nói rõ ràng · nhấn nút đỏ khi xong"}
              {phase === "ai_speaking" && "Lắng nghe câu hỏi · nhấn \"Bỏ qua\" nếu đã đọc xong"}
              {phase === "recorded" && "Nghe lại bên dưới · chọn bản tốt nhất rồi nhấn \"Câu tiếp theo\""}
            </p>
          </div>
        )}

        {/* ── Attempts card ─────────────────────────────────────────────── */}
        {phase === "recorded" && currentAttempts.length > 0 && (
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">Bản ghi của bạn</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {currentAttempts.length} bản
                </span>
              </div>
              <p className="text-xs text-slate-400">Nghe lại và chọn 1 để phân tích</p>
            </div>

            <div className="space-y-3">
              {currentAttempts.map((attempt, i) => (
                <AttemptCard
                  key={attempt.id}
                  attempt={attempt}
                  index={i}
                  isSelected={attempt.id === selectedAttemptId}
                  onSelect={() => setSelectedAttemptId(attempt.id)}
                  onDelete={() => deleteAttempt(attempt.id)}
                />
              ))}
            </div>

            {/* Advance actions */}
            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleAdvance}
                disabled={!selectedAttemptId}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isLastQuestion
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {isLastQuestion ? (
                  <>
                    <CheckCircleSolid className="h-4 w-4" />
                    Hoàn thành
                  </>
                ) : (
                  <>
                    Câu tiếp theo
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Completed card ────────────────────────────────────────────── */}
        {(phase === "completed" || phase === "analyzing") && (
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircleSolid className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-base font-semibold text-slate-900">Đã ghi âm xong!</p>
              <p className="mt-1 text-sm text-slate-500">{turnRecords.length}/{totalTurns} câu · Sẵn sàng phân tích</p>
            </div>

            <div className="mb-5 space-y-2">
              {turnRecords.map((r) => (
                <div key={r.order} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-600">Câu {r.order + 1}</span>
                    <div className="flex items-center gap-2">
                      {r.attemptCount > 1 && <span className="text-xs text-amber-500">{r.attemptCount} lần thử</span>}
                      <span className="text-xs text-slate-400">{r.durationSeconds}s</span>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-slate-500 line-clamp-2">{r.transcript}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completing ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Đang phân tích...</>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                  Phân tích kết quả
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && !["completed", "analyzing"].includes(phase) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
