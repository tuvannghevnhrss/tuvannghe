/*  ChatLayout
    - Cột trái  : danh sách đoạn chat + nút “Mới”
    - Cột phải  : khung tin nhắn + ô nhập luôn bám đáy
*/
"use client"

import { useEffect, useRef }   from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { MessagesSquare, PlusCircle, Loader2 } from "lucide-react"

import HistoryList  from "./HistoryList"
import MessageInput from "./MessageInput"
import { ScrollArea } from "@/components/ui/scroll-area"

type Thread = { id: string; title: string | null; updated_at: string }

interface Props {
  userId  : string | null
  children: React.ReactNode
}

/* ---- API lấy thread ---- */
async function fetchThreads(userId: string) {
  const res = await fetch(`/api/chat/threads?userId=${userId}`)
  if (!res.ok) throw new Error("Failed to fetch threads")
  return (await res.json()) as Thread[]
}

export default function ChatLayout({ userId, children }: Props) {
  const router    = useRouter()
  const pathname  = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  /* SWR – cache danh sách thread */
  const { data: threads, isLoading, mutate } = useSWR(
    userId ? ["threads", userId] : null,
    () => fetchThreads(userId!)
  )

  /* Auto-scroll cuối danh sách thread */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threads])

  return (
    <div className="flex h-[calc(100vh-48px)]">     {/* trừ chiều cao navbar fixed 48px */}
      {/* ===== SIDEBAR ===== */}
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

          <div ref={bottomRef} />
        </ScrollArea>
      </aside>

      {/* ===== KHUNG CHAT ===== */}
      <section className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {children /* ChatShell hoặc các message */}
        </div>

        <div className="border-t bg-white px-4 py-3">
          <MessageInput userId={userId} onSent={() => mutate()} />
        </div>
      </section>
    </div>
  )
}
