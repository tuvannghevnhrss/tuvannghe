// src/components/ChatLayout.tsx
"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { PlusCircle, Loader2, MessagesSquare } from "lucide-react"

import HistoryList from "./HistoryList"           // default export
import MessageInput from "./MessageInput"         // default export
import { ScrollArea } from "@/components/ui/scroll-area"

type Thread = { id: string; title: string | null; updated_at: string }

interface ChatLayoutProps {
  userId  : string | null
  children: React.ReactNode
}

/* -------- Lấy danh sách thread của người dùng -------- */
async function fetchThreads(userId: string) {
  if (!userId) return []
  const res = await fetch(`/api/chat/threads?userId=${userId}`)
  if (!res.ok) throw new Error("Failed to load threads")
  return (await res.json()) as Thread[]
}

export default function ChatLayout({ userId, children }: ChatLayoutProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  /* SWR: lấy & cache thread list */
  const { data: threads, isLoading, mutate } = useSWR(
    userId ? ["threads", userId] : null,
    () => fetchThreads(userId!)
  )

  /* Tự cuộn xuống cuối danh sách thread khi có thay đổi */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threads])

  /* ------------------- RENDER ------------------- */
  return (
    <div className="flex h-screen">                  {/* khung trái + phải */}
      {/* ---------- SIDEBAR ---------- */}
      <aside className="w-64 flex-shrink-0 border-r flex flex-col">
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

          <div ref={bottomRef} /> {/* giữ vị trí cuộn */}
        </ScrollArea>
      </aside>

      {/* ---------- KHUNG CHAT ---------- */}
      <section className="flex flex-1 flex-col">
        {/* vùng hiển thị tin nhắn */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {children}
        </div>

        {/* input luôn bám đáy – chiều rộng 100% */}
        <div className="border-t bg-white px-4 py-3">
          <MessageInput userId={userId} onSent={() => mutate()} />
        </div>
      </section>
    </div>
  )
}
