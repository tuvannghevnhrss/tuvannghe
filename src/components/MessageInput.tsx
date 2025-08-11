"use client";

import { useState, useRef, FormEvent } from "react";
import { ArrowUpCircle } from "lucide-react";

/* ---------- props ---------- */
interface MessageInputProps {
  userId   : string | null;                 // Supabase UID (có thể null)
  threadId?: string;                       // uuid của cuộc trò chuyện (undefined ở msg đầu)
  onSent?  : (newThreadId: string) => void; // bắn ra threadId vừa tạo
}

/* regex xác thực uuid v4 */
const isUUIDv4 = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

/* ---------- component ---------- */
export default function MessageInput({ userId, threadId, onSent }: MessageInputProps) {
  const [value,   setValue]   = useState("");
  const [sending, setSending] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  /* ---------- submit ---------- */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || sending) return;

    setSending(true);
    try {
      /* build payload */
      const payload: Record<string, any> = {
        userId,
        content: value.trim(),
      };
      if (threadId && isUUIDv4(threadId)) payload.threadId = threadId;

      /* gửi API */
      const res  = await fetch("/api/chat/send", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload),
      });
      const data = await res.json();       // { assistantReply, threadId }

      /* callback cho component cha */
      onSent?.(data.threadId);

      setValue("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  /* ---------- UI ---------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="mx-4 mb-4 flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Hỏi tuvannghe để được giải đáp"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />

      {value && (
        <span className="rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
          {value.length}
        </span>
      )}

      <button
        type="submit"
        disabled={sending || !value.trim()}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          sending || !value.trim()
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-violet-500 text-white hover:bg-violet-600"
        }`}
      >
        <ArrowUpCircle className="h-5 w-5" />
      </button>
    </form>
  );
}
