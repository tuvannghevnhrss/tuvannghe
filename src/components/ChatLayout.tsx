'use client';
import { useState, useEffect } from 'react';
import HistoryList   from './HistoryList';
import ChatShell     from './ChatShell';

export default function ChatLayout({
  threads,
  initialThreadId,
  userId,
}: {
  threads: any[];
  initialThreadId: string | null;
  userId: string;
}) {
  /* an toàn: initialThreadId có thể null */
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);

  /* nếu user chưa có thread → tạo mới ngay (gọi API) */
  useEffect(() => {
    if (threadId === null) {
      (async () => {
        const res = await fetch('/api/chat', { method: 'POST' });
        const json = await res.json();
        setThreadId(json.id);
      })();
    }
  }, [threadId]);

  return (
    <div className="flex h-[calc(100dvh-64px)]">
      {/* Lịch sử */}
      <HistoryList
        items={threads}
        current={threadId}
        onSelect={setThreadId}
      />

      {/* Khung chat */}
      <div className="flex-1 border-l flex flex-col">
        {threadId ? (
          <ChatShell threadId={threadId} userId={userId} />
        ) : (
          <p className="p-6">Đang khởi tạo cuộc trò chuyện…</p>
        )}
      </div>
    </div>
  );
}
