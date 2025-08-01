"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string | null;
  onSent: () => void;      // callback để ChatLayout gọi mutate()
}

export default function MessageInput({ userId, onSent }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content }),
    });

    if (res.ok) {
      onSent();
      setContent("");
    } else {
      console.error(await res.json());
    }
    setLoading(false);
  }

  return (
    <div className="border-t p-3 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Hỏi huongnghiep.ai"
        className={cn(
          "flex-1 rounded-md border px-4 py-2 text-sm",
          loading && "opacity-60"
        )}
      />
      <button
        disabled={loading}
        onClick={handleSend}
        className={cn(
          "rounded-full h-8 w-8 flex items-center justify-center transition-colors",
          loading ? "bg-muted" : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        →
      </button>
    </div>
  );
}
