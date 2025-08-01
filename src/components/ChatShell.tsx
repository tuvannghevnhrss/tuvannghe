"use client";

import { useState } from "react";
import MessageInput from "./MessageInput";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

export default function ChatShell({ userId }: { userId: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);

  /** khi user gửi – nhận lại answer */
  async function handleSend(content: string) {
    // thêm tin nhắn người dùng trước
    setMessages((m) => [...m, { role: "user", content }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content }),
    });

    if (!res.ok) {
      console.error(await res.json());
      return;
    }

    const { answer } = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: answer }]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* khung tin nhắn */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
        {messages.map((m, i) => (
          <p
            key={i}
            className={cn(
              "rounded-md px-3 py-2 max-w-[85%]",
              m.role === "user"
                ? "ml-auto bg-primary text-white"
                : "mr-auto bg-muted"
            )}
          >
            {m.content}
          </p>
        ))}
      </div>

      {/* ô nhập */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
