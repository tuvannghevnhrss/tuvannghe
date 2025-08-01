/*  ChatShell chỉ còn nhiệm vụ:
      - lấy messages của thread hiện tại
      - render danh sách tin nhắn
      - KHÔNG chứa MessageInput nữa
*/

"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"

interface Props {
  userId: string | null
  threadId?: string          // nếu dùng dynamic route /chat/[id]
}

/* ---- API lấy messages ---- */
async function fetchMessages(threadId?: string) {
  if (!threadId) return []
  const res = await fetch(`/api/chat/messages?threadId=${threadId}`)
  if (!res.ok) throw new Error("Failed to fetch messages")
  return (await res.json()) as {
    id: string
    role: "user" | "assistant"
    content: string
    created_at: string
  }[]
}

export default function ChatShell({ threadId }: Props) {
  const { data: messages, isLoading } = useSWR(
    threadId ? ["messages", threadId] : null,
    () => fetchMessages(threadId)
  )

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải…
      </div>
    )

  if (!messages || messages.length === 0)
    return (
      <p className="text-center text-sm text-muted-foreground">
        Hãy đặt câu hỏi đầu tiên của bạn 👋
      </p>
    )

  return (
    <>
      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.role === "user"
              ? "self-end max-w-[80%] rounded-lg bg-violet-500 px-3 py-2 text-white"
              : "max-w-[80%] rounded-lg bg-muted px-3 py-2"
          }
        >
          {m.content}
        </div>
      ))}
    </>
  )
}
