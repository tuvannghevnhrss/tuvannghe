"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInterviewRoom, type RoomStatus } from "./useInterviewRoom";
import type { InterviewConfig } from "@/lib/m3/schemas";
import type { Message, Progress } from "./api";
import { Alert, btnDanger, btnPrimary, btnSecondary, Card, inputCls, Spinner } from "./ui";

type Props = {
  interviewId: string;
  config: InterviewConfig;
  initialMessages: Message[];
  initialProgress: Progress | null;
  resumed: boolean;
  startedAt: string | null;
  onFinished: () => void;
};

const STATUS_TEXT: Record<RoomStatus, string> = {
  idle: "Sẵn sàng",
  connecting: "Đang kết nối giọng nói…",
  listening: "AI đang nghe bạn",
  user_speaking: "Bạn đang nói…",
  thinking: "AI đang suy nghĩ…",
  speaking: "AI đang nói",
  reconnecting: "Đang kết nối lại…",
  error: "Gặp sự cố",
  finishing: "Đang tạo báo cáo đánh giá…",
  ended: "Hoàn tất",
};

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Avatar({ status }: { status: RoomStatus }) {
  const speaking = status === "speaking";
  const thinking = status === "thinking";
  const listening = status === "listening" || status === "user_speaking";
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48" aria-hidden>
      <span className={`absolute inset-0 rounded-full ${speaking ? "animate-ping bg-emerald-300/40" : thinking ? "animate-pulse bg-indigo-300/40" : listening ? "bg-sky-200/50" : "bg-slate-200/50"}`} />
      <span className={`absolute inset-3 rounded-full ${speaking ? "bg-emerald-100" : thinking ? "bg-indigo-100" : "bg-slate-100"}`} />
      <div className={`relative flex h-28 w-28 items-center justify-center rounded-full shadow-xl sm:h-32 sm:w-32 ${speaking ? "bg-emerald-600" : thinking ? "bg-indigo-600" : "bg-slate-700"} transition-colors`}>
        <svg viewBox="0 0 48 48" className="h-16 w-16 text-white" fill="currentColor">
          <circle cx="24" cy="17" r="9" />
          <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18" />
        </svg>
      </div>
      {speaking && (
        <div className="absolute -bottom-1 flex items-end gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="w-1.5 animate-pulse rounded-full bg-emerald-500" style={{ height: `${10 + ((i * 7) % 14)}px`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoomTab({ interviewId, config, initialMessages, initialProgress, resumed, startedAt, onFinished }: Props) {
  const room = useInterviewRoom({ interviewId, config, initialMessages, initialProgress, resumed, onFinished });
  const [began, setBegan] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [text, setText] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [room.transcript.length]);

  const elapsed = useMemo(() => (startedAt ? (now - new Date(startedAt).getTime()) / 1000 : 0), [now, startedAt]);
  const limit = config.duration_min * 60;
  const overtime = elapsed > limit;
  const p = room.progress;
  const live = room.status !== "idle" && room.status !== "ended";
  const busy = room.status === "thinking" || room.status === "finishing";

  async function begin() {
    setBegan(true);
    await room.begin();
  }

  return (
    <div className="space-y-4">
      {room.status === "error" && room.error && (
        <Alert>
          <p>{room.error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={() => void room.retry()}>Thử lại</button>
            {room.mode === "voice" && <button className={btnSecondary} onClick={room.switchToFallback}>Dùng chế độ dự phòng (ghi âm / gõ chữ)</button>}
            <button className={btnSecondary} onClick={() => void room.finish()}>Kết thúc và xem báo cáo</button>
          </div>
        </Alert>
      )}
      {room.notice && room.status !== "error" && <Alert tone="amber">{room.notice}</Alert>}

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Bên trái: AI + điều khiển ── */}
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className={`font-semibold tabular-nums ${overtime ? "text-rose-600" : "text-slate-800"}`}>{fmt(elapsed)} / {fmt(limit)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{config.language === "vi" ? "Tiếng Việt" : "English"}</span>
          </div>
          <div className="mt-5"><Avatar status={room.status} /></div>
          <p className="mt-4 text-center text-sm font-semibold text-slate-900" aria-live="polite">{STATUS_TEXT[room.status]}</p>
          <p className="mt-1 text-center text-xs text-slate-500">{room.mode === "voice" ? "Chế độ giọng nói thời gian thực" : "Chế độ dự phòng"}</p>

          {p && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500"><span>{p.stage}</span><span>Câu {Math.min(p.turn, p.budget)}/{p.budget}</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${p.percent}%` }} /></div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {!began && !live && (
              <>
                <button className={`${btnPrimary} w-full`} onClick={() => void begin()}>
                  {resumed ? "Tiếp tục phỏng vấn" : "Bắt đầu trò chuyện"}
                </button>
                <p className="text-center text-xs text-slate-500">Trình duyệt sẽ xin quyền dùng microphone. Nên dùng tai nghe.</p>
                <button className={`${btnSecondary} w-full`} onClick={() => { setBegan(true); room.switchToFallback(); }}>Dùng chế độ dự phòng (ghi âm / gõ chữ)</button>
              </>
            )}

            {began && room.mode === "voice" && live && room.status !== "finishing" && (
              <div className="flex gap-2">
                <button className={`${btnSecondary} flex-1`} onClick={room.toggleMute}>{room.muted ? "🔇 Bật micro" : "🎙️ Tắt micro"}</button>
                <button className={`${btnSecondary} flex-1`} onClick={room.switchToFallback}>Chế độ dự phòng</button>
              </div>
            )}

            {began && room.mode === "fallback" && live && room.status !== "finishing" && (
              <div className="space-y-3">
                <button className={`${room.recording ? btnDanger : btnPrimary} w-full`} onClick={() => void room.toggleRecording()} disabled={busy || room.status === "speaking"}>
                  {room.recording ? "⏹ Dừng và gửi câu trả lời" : "🎙️ Nhấn để trả lời bằng giọng nói"}
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim()) {
                      room.sendText(text);
                      setText("");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="…hoặc gõ câu trả lời" disabled={busy} maxLength={4000} />
                  <button className={btnSecondary} disabled={busy || !text.trim()}>Gửi</button>
                </form>
                <button className={`${btnSecondary} w-full`} onClick={() => void room.switchToVoice()}>Quay lại chế độ giọng nói</button>
              </div>
            )}

            {began && live && room.status !== "finishing" && (
              confirmEnd ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p>Kết thúc sớm và tạo báo cáo từ những gì đã trả lời?</p>
                  <div className="mt-2 flex gap-2">
                    <button className={btnDanger} onClick={() => void room.finish()}>Kết thúc</button>
                    <button className={btnSecondary} onClick={() => setConfirmEnd(false)}>Tiếp tục</button>
                  </div>
                </div>
              ) : (
                <button className={`${btnDanger} w-full`} onClick={() => setConfirmEnd(true)}>Kết thúc phỏng vấn</button>
              )
            )}
            {room.status === "finishing" && <div className="text-center"><Spinner label="Đang tạo báo cáo đánh giá (khoảng 20–40 giây)…" /></div>}
          </div>
        </Card>

        {/* ── Bên phải: transcript ── */}
        <Card title="Bản ghi hội thoại" subtitle="Nội dung đồng bộ với phiên phỏng vấn; được lưu để chấm điểm.">
          <div className="max-h-[560px] min-h-[320px] space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite">
            {room.transcript.length === 0 && <p className="text-sm text-slate-400">Chưa có nội dung. Bấm “Bắt đầu trò chuyện” để vào phòng.</p>}
            {room.transcript.map((t) => (
              <div key={t.id} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${t.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.role === "user" ? "Bạn" : "AI Interviewer"}</span>
                  {t.text}
                </div>
              </div>
            ))}
            {room.status === "thinking" && <div className="flex justify-start"><div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">AI đang suy nghĩ…</div></div>}
            <div ref={endRef} />
          </div>
        </Card>
      </div>
    </div>
  );
}
