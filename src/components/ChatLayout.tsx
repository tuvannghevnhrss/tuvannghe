/* ------------------------------------------------------------------ */
/* ChatLayout – ChatGPT-style                                         */
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
  threads: initial,
  initialThreadId,
  userId,
}: Props) {
  const [threads, setThreads] = useState(initial);
  const [current, setCurrent] = useState<string | null>(initialThreadId);

  const onNew = (id: string, title: string) => {
    setThreads([{ id, title, updated_at: new Date().toISOString() }, ...threads]);
    setCurrent(id);
  };

  return (
    <div className="h-[calc(100vh-48px)] flex bg-[#ececf1] text-sm">
      {/* ───────── Sidebar ───────── */}
      <aside className="w-[260px] shrink-0 bg-white border-r flex flex-col">
        {/* top buttons */}
        <button
          className="m-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-center"
          onClick={() => onNew(crypto.randomUUID(), 'Cuộc trò chuyện mới')}
        >
          Đoạn chat mới
        </button>

        {/* thread list */}
        <nav className="flex-1 overflow-y-auto">
          {threads.map(t => (
            <div
              key={t.id}
              onClick={() => setCurrent(t.id)}
              className={clsx(
                'px-4 py-2 cursor-pointer truncate',
                current === t.id
                  ? 'bg-[#ececf1] font-medium'
                  : 'hover:bg-gray-100'
              )}
            >
              {t.title || 'Cuộc trò chuyện mới'}
            </div>
          ))}
        </nav>

        {/* footer shortcut */}
        <div className="p-3 border-t text-xs text-gray-500">
          © {new Date().getFullYear()}
        </div>
      </aside>

      {/* ───────── Chat area ───────── */}
      <main className="flex-1 flex flex-col relative bg-white">
        {/* dòng trạng thái khi chưa chọn thread */}
        {!current ? (
          <div className="m-auto text-gray-400">Chọn đoạn chat bên trái</div>
        ) : (
          <ChatShell
            threadId={current}
            onThreadChange={setCurrent}
            onThreadCreate={onNew}
            userId={userId}
          />
        )}
      </main>
    </div>
  );
}
