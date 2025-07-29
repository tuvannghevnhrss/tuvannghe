/* ------------------------------------------------------------------ */
/*  ChatLayout – 2 cột + header “Lịch sử chat / Chat”                 */
/* ------------------------------------------------------------------ */
'use client';

import { useState } from 'react';
import clsx from 'clsx';
import ChatShell from './ChatShell';

export type Thread = { id: string; title: string; updated_at: string };

type Props = {
  threads: Thread[];
  initialThreadId: string | null;
  userId: string;
};

export default function ChatLayout({
  threads: initialThreads,
  initialThreadId,
  userId,
}: Props) {
  const [threads, setThreads]   = useState<Thread[]>(initialThreads);
  const [current, setCurrent]   = useState<string | null>(initialThreadId);

  /* callback khi ChatShell sinh thread mới */
  const handleNewThread = (id: string, title: string) => {
    setThreads([{ id, title, updated_at: new Date().toISOString() }, ...threads]);
    setCurrent(id);
  };

  return (
    <section className="flex flex-col h-[calc(100vh-48px)]">
      {/* ---------- HEADER ---------- */}
      <header className="grid grid-cols-12 border-b bg-white shrink-0">
        <div className="col-span-3 px-4 py-2 font-semibold border-r">
          Lịch sử chat
        </div>
        <div className="col-span-9 px-4 py-2 font-semibold">Chat</div>
      </header>

      {/* ---------- BODY ---------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar – thread list */}
        <aside className="w-72 border-r overflow-y-auto">
          {threads.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Chưa có.</p>
          ) : (
            <ul className="p-2 space-y-1">
              {threads.map(t => (
                <li
                  key={t.id}
                  onClick={() => setCurrent(t.id)}
                  className={clsx(
                    'cursor-pointer rounded px-3 py-2 text-sm truncate',
                    current === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-gray-100'
                  )}
                >
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <ChatShell
            threadId={current}
            onThreadChange={setCurrent}
            onThreadCreate={handleNewThread}
            userId={userId}
          />
        </div>
      </div>
    </section>
  );
}
