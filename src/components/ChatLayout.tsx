"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

import HistoryList   from "./HistoryList"         // ← xuất mặc định
import { MessageInput }  from "./MessageInput"        // ← xuất mặc định
import { ScrollArea } from "@/components/ui/scroll-area"  // ← xuất *named*
import { PlusCircle, Loader2, MessagesSquare } from "lucide-react"

import useSWR from "swr"

/* ---------- Kiểu ---------- */
interface ChatLayoutProps {
  userId : string | null
  children: React.ReactNode
}

/* ---------- Hàm lấy thread (thay thế cho fetchThreadsForUser) ---------- */
async function getThreads(userId: string) {
  if (!userId) return []
  const res = await fetch(`/api/chat/threads?userId=${userId}`)
  if (!res.ok) throw new Error("Failed to load threads")
  return (await res.json()) as {
    id: string
    title: string | null
    updated_at: string
  }[]
}

/* ---------- Component ---------- */
export default function ChatLayout({ userId, children }: ChatLayoutProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  /* Lấy danh sách threads */
  const {
    data: threads,
    isLoading,
    mutate,
  } = useSWR(userId ? ["threads", userId] : null, () => getThreads(userId!))

  /* Auto-scroll khi danh sách thay đổi */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threads])

  /* ------------ Render ------------ */
  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[260px_1fr]">
      {/* ------ SIDEBAR ------ */}
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

        {/* Danh sách thread */}
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

          {/* neo cuối danh sách */}
          <div ref={bottomRef} />
        </ScrollArea>
      </aside>

      {/* ------ KHUNG CHAT CHÍNH ------ */}
      <section className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">{children}</div>

        {/* Ô nhập tin nhắn ở đáy */}
        <div className="border-t p-4">
          <MessageInput userId={userId} onSent={() => mutate()} />
        </div>
      </section>
    </div>
  )
}
