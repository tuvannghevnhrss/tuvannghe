/* ------------------------------------------------------------------ */
/*  ChatLayout – 2 cột: Sidebar + Chat area                           */
/* ------------------------------------------------------------------ */
'use client';

import { useState, useEffect } from 'react';
import ChatShell   from './ChatShell';
import classNames  from 'classnames';

export type Thread = { id: string; title: string; updated_at: string };

export default function ChatLayout() {
  const [threads, setThreads]   = useState<Thread[]>([]);
  const [current, setCurrent]   = useState<string | null>(null);

  /* ---------------- load threads ---------------- */
  const loadThreads = async () => {
    const res  = await fetch('/api/chat');
    const data = await res.json();
    setThreads(data.chats as Thread[]);
    if (!current && data.chats.length) setCurrent(data.chats[0].id);
  };

  useEffect(() => { loadThreads(); }, []);

  /* ---------------- UI -------------------------- */
  return (
    <div className="flex h-[calc(100vh-48px)]"> {/* 48px ≈ chiều cao navbar */}
      {/* ---------- SIDEBAR ---------- */}
      <aside className="w-64 border-r flex flex-col">
        <header className="px-4 py-3 border-b font-semibold">Lịch sử chat</header>

        {/* danh sách thread */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">Chưa có.</p>
          )}
          <ul className="space-y-1 p-2">
            {threads.map((t) => (
              <li
                key={t.id}
                onClick={() => setCurrent(t.id)}
                className={classNames(
                  'cursor-pointer rounded px-3 py-2 text-sm',
                  current === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-100',
                )}
              >
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ---------- CHAT AREA ---------- */}
      <section className="flex-1 flex flex-col">
        <header className="px-4 py-3 border-b font-semibold">Chat</header>
        <ChatShell /* ChatShell tự tạo / load thread */ />
      </section>
    </div>
  );
}
