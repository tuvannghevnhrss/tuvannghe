/* ------------------------------------------------------------------ */
/*  ChatLayout – bọc 2 cột: sidebar + khung Chat                      */
/* ------------------------------------------------------------------ */
'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface Thread {
  id: string;
  title: string;
  last_msg: string;
  updated: string;
}

export default function ChatLayout({
  threads,
  children,
}: React.PropsWithChildren<{ threads: Thread[] }>) {
  const pathname = usePathname();
  const router = useRouter();
  const currentId =
    pathname.startsWith('/chat/') ? pathname.split('/').pop() : null;

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white">
      {/* ---------- Sidebar ---------- */}
      <aside className="w-72 shrink-0 border-r bg-gray-50 hidden lg:flex flex-col">
        <header className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Lịch sử chat</h2>
        </header>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm">
          {threads.length === 0 && (
            <p className="px-2 text-gray-500">Chưa có.</p>
          )}

          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/chat/${t.id}`}
              className={clsx(
                'block rounded px-3 py-2 hover:bg-indigo-50',
                currentId === t.id && 'bg-indigo-100 font-medium'
              )}
            >
              <p className="truncate">{t.title}</p>
              <p className="truncate text-xs text-gray-500">
                {t.last_msg || '…'}
              </p>
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={() => router.push('/chat')}
            className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Chat mới
          </button>
        </div>
      </aside>

      {/* ---------- Khung Chat ---------- */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
