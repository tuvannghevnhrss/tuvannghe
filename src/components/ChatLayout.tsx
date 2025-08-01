// src/components/ChatLayout.tsx
"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { PlusCircle, Loader2, MessagesSquare } from "lucide-react"

import HistoryList   from "./HistoryList"          // default export
import MessageInput  from "./MessageInput"         // default export
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatLayoutProps {
  userId  : string | null
  children: React.ReactNode
}

/* Lấy danh sách thread của người dùng */
async function getThreads(userId: string) {
  if (!userId) return []
  const res = await fetch(`/api/chat/threads?userId=${userId}`)
  if (!res.ok) throw new Error("Failed to load threads")
  return (await res.json()) as {
    id        : string
    title     : string | null
    updated_at: string
  }[]
}

export default function ChatLayout({ userId, children }: ChatLayoutProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  /* lấy threads */
  const { data: threads, isLoading, mutate } = useSWR(
    userId ? ["threads", userId] : null,
    () => getThreads(userId!)
  )

  /* tự cuộn xuống cuối danh sách */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threads])

  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[260px_1fr]">
      {/* ============ SIDEBAR ============ */}
      <aside className="flex h-full flex-col border-r">
        <header className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium">
          <span className="inline-flex items-center gap-1">
            <MessagesSquare size={16} /> Đoạn chat
          </span>
          <button
            onClick={() => router.push("/chat?new=1")}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <PlusCircle size={14} /> Mới
          </button>
        </header>

        {/* danh sách thread */}
        <ScrollArea className="flex-1">
          {isLoading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải…
            </div>
          )}

          {!isLoading && threads?.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Bạn chưa có cuộc trò chuyện nào.
            </p>
          )}

          {threads && threads.length > 0 && (
            <HistoryList
              threads={threads}
              activeId={pathname.split("/").pop()!}
              onSelect={(id) => router.push(`/chat/${id}`)}
              onDelete={async () => {
                await mutate()
                if (pathname === "/chat") router.refresh()
              }}
            />
          )}

          {/* giữ vị trí cuộn */}
          <div ref={bottomRef} />
        </ScrollArea>
      </aside>

      {/* ============ KHUNG CHAT CHÍNH ============ */}
      <section className="relative flex h-full flex-col">
        {/* nội dung chat */}
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-6">{children}</div>

        {/* khung nhập luôn ở đáy */}
        <div className="sticky bottom-0 border-t bg-white p-4">
          <MessageInput userId={userId} onSent={() => mutate()} />
        </div>
      </section>
    </div>
  )
}
