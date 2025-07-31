"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HistoryList } from "./HistoryList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Loader2, MessagesSquare } from "lucide-react";
import useSWR from "swr";
import { fetchThreadsForUser } from "@/lib/supabaseBrowser";

// -----------------------------
// Types
// -----------------------------
interface ChatLayoutProps {
  userId: string | null;
  children: React.ReactNode;
}

// -----------------------------
// Component
// -----------------------------
export default function ChatLayout({ userId, children }: ChatLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch chat threads
  const {
    data: threads,
    isLoading,
    mutate,
  } = useSWR(userId ? ["threads", userId] : null, () => fetchThreadsForUser(userId!));

  // Auto‑scroll to bottom when thread list changes
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [threads]);

  // ----------------------------------
  // Render
  // ----------------------------------
  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[260px_1fr] overflow-hidden">
      {/* -------------- SIDEBAR -------------- */}
      <aside className="flex h-full flex-col border-r">
        <header className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium">
          <span className="inline-flex items-center gap-1"><MessagesSquare size={16}/> Đoạn chat</span>
          <button
            onClick={() => router.push("/chat?new=1")}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <PlusCircle size={14}/> Mới
          </button>
        </header>

        {/* Thread list */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Đang tải…
            </div>
          )}

          {!isLoading && threads?.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Bạn chưa có cuộc trò chuyện nào.
            </p>
          )}

          {!isLoading && threads?.length! > 0 && (
            <HistoryList
              threads={threads!}
              activeId={pathname.split("/").pop()!}
              onSelect={(id) => router.push(`/chat/${id}`)}
              onDelete={async () => {
                await mutate();
                if (pathname === "/chat") router.refresh();
              }}
            />
          )}

          {/* keep scroll position */}
          <div ref={bottomRef}/>
        </ScrollArea>

        {/* QUICK LINKS ĐÃ XOÁ: nếu muốn dùng lại, thêm ở đây */}
      </aside>

      {/* -------------- MAIN CHAT -------------- */}
      <section className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <MessageInput userId={userId} onSent={() => mutate()}/>
      </section>
    </div>
  );
}
