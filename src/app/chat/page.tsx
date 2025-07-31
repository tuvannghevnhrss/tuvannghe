/* src/components/ChatLayout.tsx */
import React, { ReactNode } from 'react'
import HistoryList   from './HistoryList'
import ThreadSideBar from './ThreadSideBar'
import MessageInput  from './MessageInput'
import type { ThreadMeta } from './types'

type Props = { threads: ThreadMeta[]; children: ReactNode }

export default function ChatLayout({ threads, children }: Props) {
  return (
    <section className="flex h-[calc(100vh-48px)]">   {/* bỏ phần header */}
      {/* =========== SIDEBAR =========== */}
      <aside className="w-64 border-r bg-muted/40 overflow-y-auto">
        <HistoryList threads={threads} />
      </aside>

      {/* =========== VÙNG CHAT =========== */}
      <main className="flex flex-col flex-1">
        {/* danh sách message “chiếm” hết chiều cao còn lại  */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* input luôn nằm dưới cùng  */}
        <div className="border-t bg-white p-3">
          <MessageInput />
        </div>
      </main>
    </section>
  )
}
