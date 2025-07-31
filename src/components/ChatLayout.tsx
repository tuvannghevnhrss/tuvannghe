'use client';

import { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

type Thread = {
  id: string;
  updated_at: string;
  messages: { content: string }[];
};

export default function ChatLayout({
  userId,
  threads,
}: {
  userId: string;
  threads: Thread[];
}) {
  const [activeId, setActiveId] = useState<string | null>(
    threads[0]?.id ?? null,
  );

  const grouped = useMemo(() => {
    // { '2025-07-31': [thread1, thread2], … }
    return threads.reduce<Record<string, Thread[]>>((acc, t) => {
      const d = new Date(t.updated_at).toLocaleDateString('vi-VN');
      (acc[d] ||= []).push(t);
      return acc;
    }, {});
  }, [threads]);

  return (
    <section className="grid h-[calc(100vh-48px)] grid-cols-[280px_1fr]">
      {/* —— Sidebar —— */}
      <Sidebar
        grouped={grouped}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {/* —— Main —— */}
      <div className="flex flex-col">
        <MessageList threadId={activeId} />

        <MessageInput
          userId={userId}
          threadId={activeId}
          className="border-t p-3 sticky bottom-0 bg-white"
        />
      </div>
    </section>
  );
}
