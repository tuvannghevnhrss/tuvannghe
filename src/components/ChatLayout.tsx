'use client';
import { useState } from 'react';
import HistoryList from './HistoryList';
import ChatShell   from './ChatShell';

type Thread = { id: string; title: string; last_message: string | null };

export default function ChatLayout({
  threads,
  initial,
}: {
  threads : Thread[];
  initial : string | null;
}) {
  const [threadId, setThreadId] = useState<string | null>(initial);

  return (
    <div className="flex h-[calc(100vh-64px)]"> {/* trừ chiều cao header */}
      {/* Cột trái – lịch sử */}
      <aside className="w-72 shrink-0 border-r overflow-y-auto">
        <h2 className="px-4 py-3 font-semibold">Lịch sử chat</h2>
        <HistoryList
          threads={threads}
          current={threadId}
          onSelect={setThreadId}
        />
      </aside>

      {/* Cột phải – khu vực chat */}
      <main className="flex-1 flex flex-col">
        <ChatShell threadId={threadId} onThreadChange={setThreadId} />
      </main>
    </div>
  );
}
