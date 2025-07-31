// src/components/MessageInput.tsx
"use client"

import { useState, useRef, FormEvent } from "react"
import { ArrowUpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  userId : string | null
  onSent?: () => void
}

export default function MessageInput({ userId, onSent }: MessageInputProps) {
  const [value,   setValue]   = useState("")
  const [sending, setSending] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  /* gửi tin nhắn */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim() || sending) return
    setSending(true)

    try {
      await fetch("/api/chat/send", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ userId, content: value.trim() }),
      })

      setValue("")
      onSent?.()
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  /* ------------ UI ------------ */
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm"
    >
      {/* Ô nhập */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Hỏi tư vấn hướng nghiệp điều bạn còn băn khoăn"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />

      {/* Bong bóng đếm ký tự (tuỳ biến thành (0) messages nếu muốn) */}
      {value.length > 0 && (
        <span className="rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
          {value.length}
        </span>
      )}

      {/* Nút gửi */}
      <button
        type="submit"
        disabled={sending || !value.trim()}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          sending || !value.trim()
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-violet-500 text-white hover:bg-violet-600"
        )}
      >
        <ArrowUpCircle className="h-5 w-5" />
      </button>
    </form>
  )
}
