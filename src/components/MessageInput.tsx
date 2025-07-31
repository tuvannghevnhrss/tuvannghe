"use client";

import { useState } from "react";

export default function MessageInput({ onSent }: { onSent: () => void }) {
  const [input, setInput] = useState("");

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    // 🟢 Gửi đúng payload + header
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) {
      console.error(await res.text());   // debug nếu còn lỗi
      return;
    }

    setInput("");
    onSent();            // gọi mutate, scroll, …
  }

  return (
    <div className="flex gap-2 p-4">
      <input
        className="flex-1 rounded-lg border px-3 py-2 text-sm"
        placeholder="Hỏi huongnghiep.ai"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={!input.trim()}
      >
        Gửi
      </button>
    </div>
  );
}
