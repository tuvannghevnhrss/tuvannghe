// src/components/MessageInput.tsx
"use client"

import { useState } from "react"

export default function MessageInput({
  onSend,
}: {
  onSend: (value: string) => void
}) {
  const [message, setMessage] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!message.trim()) return
        onSend(message)
        setMessage("")
      }}
      className="flex gap-2 w-full"
    >
      <input
        className="flex-1 rounded border px-3 py-2 outline-none"
        placeholder="Nhập tin nhắn..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-white hover:opacity-90"
      >
        Gửi
      </button>
    </form>
  )
}
